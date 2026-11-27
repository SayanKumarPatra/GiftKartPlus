import type { jsPDF as JsPdfDocument } from 'jspdf';
import type { DemoOrder, OrderReceiptRecord, StoreSettings } from '../types';
import { BRAND_ASSETS } from '../config/appConfig';
import { formatDateTime } from './format';
import {
  getStatusDisplayLabel,
  normalizeOrderStatus,
  normalizePaymentStatus,
} from './orderLifecycle';
import { normalizeOfficialContactFields } from './storefrontHelpers';

function formatPdfRs(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  return `Rs. ${rounded.toLocaleString('en-IN')}`;
}

function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeImageSrc(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image/')
  );
}

/**
 * Returns true ONLY when the order's Delivery Status is Delivered / Delivery Completed.
 * Used as the strict customer eligibility gate across storefront & receipt views.
 */
export function isOrderReceiptAvailable(order?: DemoOrder | null): boolean {
  if (!order) return false;
  return normalizeOrderStatus(order.fulfillmentStatus) === 'Delivered';
}

/**
 * Deterministic, unique Receipt Number shared between Customer & Admin Panel.
 */
export function buildOrderReceiptNumber(orderNumber: string): string {
  const clean = String(orderNumber || '').trim().toUpperCase();
  return `RCP-${clean || 'ORDER'}`;
}

/**
 * Extracts real delivery date/timestamp from shipping details or status history.
 */
export function resolveOrderDeliveredAt(order: DemoOrder): string | undefined {
  if (order.receipt?.deliveredAt) {
    return order.receipt.deliveredAt;
  }
  if (order.shippingDetails?.deliveredAt) {
    return order.shippingDetails.deliveredAt;
  }
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (normalizeOrderStatus(history[i].status) === 'Delivered') {
      return history[i].timestamp;
    }
  }
  if (normalizeOrderStatus(order.fulfillmentStatus) === 'Delivered') {
    return order.updatedAt || order.createdAt;
  }
  return undefined;
}

/**
 * Computes the actual paid / collected amount from real order & payment records.
 * Never fabricates Paid status or fake payment totals.
 */
export function resolveOrderPaidAmountInr(order: DemoOrder): number {
  const canonicalPayment = normalizePaymentStatus(order);
  const explicitCollected = order.paymentDetails?.collectedAmountInr;
  if (typeof explicitCollected === 'number' && !Number.isNaN(explicitCollected)) {
    if (canonicalPayment === 'Unpaid') {
      return 0;
    }
    return Math.max(0, explicitCollected);
  }
  if (canonicalPayment === 'Paid' || canonicalPayment === 'Payment Collected') {
    return Math.max(0, Number(order.grandTotalInr) || 0);
  }
  return 0;
}

/**
 * Single source of truth for Receipt Record metadata used by Customer & Admin Panel.
 * Preserves persisted receiptNumber & issuedAt while staying synced with latest real payment & delivery data.
 */
export function resolveOrderReceipt(order: DemoOrder): OrderReceiptRecord {
  const paymentStatus = normalizePaymentStatus(order);
  const paidAmountInr = resolveOrderPaidAmountInr(order);
  const deliveredAt = resolveOrderDeliveredAt(order);
  const existing = order.receipt;

  return {
    receiptNumber: existing?.receiptNumber || buildOrderReceiptNumber(order.orderNumber),
    orderId: order.id,
    orderNumber: order.orderNumber,
    issuedAt: existing?.issuedAt || deliveredAt || order.updatedAt || order.createdAt,
    deliveredAt,
    deliveryStatus: 'Delivered',
    paymentMethod: order.paymentMethod || 'Cash on Delivery (COD)',
    paymentStatus,
    grandTotalInr: Math.max(0, Number(order.grandTotalInr) || 0),
    paidAmountInr,
  };
}

function formatReceiptDateLabel(raw?: string): string {
  if (!raw) return '';
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return formatDateTime(new Date(parsed).toISOString());
  }
  return raw;
}

async function loadImageAsCanvasDataUrl(
  src: string,
  options?: { size?: number; format?: 'jpeg' | 'png'; fillBackground?: boolean }
): Promise<string | null> {
  if (!isSafeImageSrc(src)) return null;
  const format = options?.format || 'jpeg';
  const size = options?.size || 96;
  const fillBackground = options?.fillBackground ?? format === 'jpeg';

  if (format === 'jpeg' && src.startsWith('data:image/jpeg')) {
    return src;
  }
  if (format === 'png' && src.startsWith('data:image/png')) {
    return src;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = window.setTimeout(() => resolve(null), 4000);
    img.onload = () => {
      window.clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        if (fillBackground) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
        }
        const ratio = Math.min(size / img.width, size / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(
          format === 'png'
            ? canvas.toDataURL('image/png')
            : canvas.toDataURL('image/jpeg', 0.88)
        );
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      window.clearTimeout(timeout);
      resolve(null);
    };
    img.src = src;
  });
}

function triggerPdfBlobDownload(doc: JsPdfDocument, filename: string): void {
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 2500);
  } catch {
    doc.save(filename);
  }
}

/**
 * Generates and downloads an official, GiftKart-branded A4 PDF Order Receipt
 * from 100% real Order & Payment records. Shared by both Customer & Admin Panel.
 */
export async function downloadOrderReceiptPdf(
  order: DemoOrder,
  storeSettings?: StoreSettings | null
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const brandName = storeSettings?.storeName || 'GiftKart';
  const brandTagline = storeSettings?.tagline || 'Har Gift Mein Ek Kahani.';
  const storeAddress =
    storeSettings?.serviceCitiesSummary ||
    'Jalchak, Pingla, Paschim Medinipur, West Bengal - 721155';
  const resolvedContact = normalizeOfficialContactFields({
    supportEmail: storeSettings?.supportEmail,
    supportPhone: storeSettings?.supportPhone,
    contactVersion: storeSettings?.contactVersion,
    socialLinks: storeSettings?.socialLinks,
  });
  const supportPhone = resolvedContact.supportPhone;
  const supportEmail = resolvedContact.supportEmail;

  const receipt = resolveOrderReceipt(order);
  const currentStatus = getStatusDisplayLabel(order.fulfillmentStatus);
  const paymentStatus = receipt.paymentStatus;
  const paidAmountInr = receipt.paidAmountInr;
  const deliveredDateLabel = formatReceiptDateLabel(receipt.deliveredAt);
  const shipping = order.shippingDetails || {};
  const paymentDetails = order.paymentDetails;

  // Preload brand logo + item thumbnails concurrently
  const logoSrc = storeSettings?.logoUrl || BRAND_ASSETS.logo;
  const [logoDataUrl, thumbnails] = await Promise.all([
    loadImageAsCanvasDataUrl(logoSrc, { size: 128, format: 'png', fillBackground: false }),
    Promise.all(
      order.items.map((item) =>
        item.imageSnapshot
          ? loadImageAsCanvasDataUrl(item.imageSnapshot, {
              size: 112,
              format: 'jpeg',
              fillBackground: true,
            })
          : Promise.resolve(null)
      )
    ),
  ]);

  // Official Store Header Banner (#6A11CB) + Pink Accent Strip (#FF4D8D)
  doc.setFillColor(106, 17, 203);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFillColor(255, 77, 141);
  doc.rect(0, 40, pageWidth, 2.4, 'F');

  // Brand Logo inside white rounded badge
  let brandTextX = margin;
  if (logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, 8.5, 19, 19, 3.5, 3.5, 'F');
      doc.addImage(logoDataUrl, 'PNG', margin + 1.5, 10, 16, 16);
      brandTextX = margin + 23;
    } catch {
      brandTextX = margin;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text(brandName, brandTextX, 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(242, 232, 255);
  doc.text(brandTagline, brandTextX, 20.5);

  doc.setFontSize(7.8);
  const addressLines = doc.splitTextToSize(storeAddress, 84);
  doc.text(addressLines.slice(0, 2), brandTextX, 25.8);

  const contactLine = [supportPhone, supportEmail].filter(Boolean).join('  |  ');
  if (contactLine) {
    doc.text(contactLine, brandTextX, 34.5);
  }

  // Right Header: Official Order Receipt & Metadata
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('OFFICIAL ORDER RECEIPT', pageWidth - margin, 12.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Receipt No: ${receipt.receiptNumber}`, pageWidth - margin, 18.2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.text(`Order ID: ${order.orderNumber}`, pageWidth - margin, 23.2, { align: 'right' });
  doc.text(`Order Date: ${formatDateTime(order.createdAt)}`, pageWidth - margin, 27.8, {
    align: 'right',
  });
  if (deliveredDateLabel) {
    doc.text(`Delivered On: ${deliveredDateLabel}`, pageWidth - margin, 32.4, {
      align: 'right',
    });
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Delivery Status: ${currentStatus}`, pageWidth - margin, 37, { align: 'right' });

  let y = 48;

  // Two-column info cards: Customer & Delivery | Payment & Order Info
  const colGap = 5;
  const colWidth = (contentWidth - colGap) / 2;

  const fullAddress = [
    order.customer.addressLine1,
    order.customer.addressLine2,
    `${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}`,
  ]
    .filter(Boolean)
    .join(', ');

  const customerLines = [
    `Customer: ${order.customer.fullName}`,
    `Phone: ${order.customer.phone}`,
    order.customer.email ? `Email: ${order.customer.email}` : '',
    order.customer.deliveryZoneNameSnapshot
      ? `Delivery Zone: ${order.customer.deliveryZoneNameSnapshot}`
      : '',
    `Delivery Address: ${fullAddress}`,
  ].filter(Boolean);

  const paymentSummaryLines = [
    `Payment Method: ${receipt.paymentMethod}`,
    `Payment Status: ${paymentStatus}`,
    `Order Total: ${formatPdfRs(order.grandTotalInr)}`,
    `Total Paid Amount: ${formatPdfRs(paidAmountInr)}`,
    paymentDetails?.collectionDate
      ? `Payment Date: ${formatReceiptDateLabel(paymentDetails.collectionDate)}`
      : '',
    shipping.courierName ? `Courier Partner: ${shipping.courierName}` : '',
    shipping.trackingId ? `Tracking ID: ${shipping.trackingId}` : '',
    deliveredDateLabel ? `Delivery Completed: ${deliveredDateLabel}` : '',
  ].filter(Boolean);

  doc.setFontSize(8.2);
  const leftWrapped = customerLines.flatMap((line) => doc.splitTextToSize(line, colWidth - 8));
  const rightWrapped = paymentSummaryLines.flatMap((line) =>
    doc.splitTextToSize(line, colWidth - 8)
  );
  const cardHeight = Math.max(leftWrapped.length, rightWrapped.length) * 4.35 + 13;

  // Left card — Customer & Delivery Address
  doc.setFillColor(248, 242, 255);
  doc.setDrawColor(235, 216, 255);
  doc.roundedRect(margin, y, colWidth, cardHeight, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(106, 17, 203);
  doc.text('CUSTOMER & DELIVERY DETAILS', margin + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(43, 11, 78);
  doc.text(leftWrapped, margin + 4, y + 12);

  // Right card — Payment & Fulfillment Summary
  const rightX = margin + colWidth + colGap;
  doc.setFillColor(255, 244, 249);
  doc.setDrawColor(235, 216, 255);
  doc.roundedRect(rightX, y, colWidth, cardHeight, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(214, 41, 107);
  doc.text('PAYMENT & DELIVERY SUMMARY', rightX + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(43, 11, 78);
  doc.text(rightWrapped, rightX + 4, y + 12);

  y += cardHeight + 7;

  // Purchased Items Table Header
  doc.setFillColor(106, 17, 203);
  doc.roundedRect(margin, y, contentWidth, 8.2, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.text('ITEM & PRODUCT DETAILS', margin + 3, y + 5.4);
  doc.text('QTY', margin + 114, y + 5.4, { align: 'center' });
  doc.text('UNIT PRICE', margin + 142, y + 5.4, { align: 'right' });
  doc.text('LINE TOTAL', margin + contentWidth - 3, y + 5.4, { align: 'right' });
  y += 9.5;

  for (let i = 0; i < order.items.length; i += 1) {
    const item = order.items[i];
    const thumb = thumbnails[i];

    const detailLines: string[] = [item.productNameSnapshot];
    if (item.productSkuSnapshot) {
      detailLines.push(`SKU: ${item.productSkuSnapshot}`);
    }
    const variantStr = Object.entries(item.selectedVariants || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
    if (variantStr) detailLines.push(variantStr);
    if (item.personalizationDetails) {
      detailLines.push(`Personalization: ${item.personalizationDetails}`);
    }

    doc.setFontSize(8.3);
    const textOffsetX = thumb ? margin + 16.5 : margin + 3;
    const maxNameWidth = thumb ? 88 : 102;
    const wrappedName = doc.splitTextToSize(detailLines[0], maxNameWidth);
    const wrappedMeta = detailLines
      .slice(1)
      .flatMap((l) => doc.splitTextToSize(l, maxNameWidth));
    const rowHeight = Math.max(thumb ? 15.5 : 10, (wrappedName.length + wrappedMeta.length) * 4 + 4.5);

    if (y + rowHeight > pageHeight - 52) {
      doc.addPage();
      y = 18;
    }

    doc.setDrawColor(235, 216, 255);
    doc.setFillColor(i % 2 === 0 ? 255 : 252, i % 2 === 0 ? 255 : 249, 255);
    doc.rect(margin, y, contentWidth, rowHeight, 'FD');

    if (thumb) {
      try {
        doc.addImage(thumb, 'JPEG', margin + 2.5, y + 2.2, 11, 11);
      } catch {
        // Skip image if unreadable
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(43, 11, 78);
    doc.text(wrappedName, textOffsetX, y + 5.4);

    if (wrappedMeta.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      doc.setTextColor(110, 91, 133);
      doc.text(wrappedMeta, textOffsetX, y + 5.4 + wrappedName.length * 4);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(43, 11, 78);
    doc.text(String(item.quantity), margin + 114, y + 6.4, { align: 'center' });
    doc.text(formatPdfRs(item.unitPriceInrSnapshot), margin + 142, y + 6.4, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatPdfRs(item.lineTotalInr), margin + contentWidth - 3, y + 6.4, {
      align: 'right',
    });

    y += rowHeight;
  }

  y += 6;
  if (y > pageHeight - 68) {
    doc.addPage();
    y = 18;
  }

  // Left: Gift Wrap Details (if enabled) + Receipt Verification Note
  const summaryWidth = 80;
  const summaryX = margin + contentWidth - summaryWidth;
  const leftBoxWidth = contentWidth - summaryWidth - 6;

  let leftBoxY = y;
  if (order.giftWrap?.enabled) {
    doc.setFillColor(248, 242, 255);
    doc.setDrawColor(235, 216, 255);
    doc.roundedRect(margin, leftBoxY, leftBoxWidth, 24, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.4);
    doc.setTextColor(106, 17, 203);
    doc.text('GIFT WRAP INCLUDED', margin + 4, leftBoxY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.9);
    doc.setTextColor(43, 11, 78);
    const wrapLines = [
      order.giftWrap.styleNameSnapshot ? `Style: ${order.giftWrap.styleNameSnapshot}` : '',
      order.giftWrap.recipientName ? `Recipient: ${order.giftWrap.recipientName}` : '',
      order.giftWrap.giftMessage ? `Message: "${order.giftWrap.giftMessage}"` : '',
    ]
      .filter(Boolean)
      .flatMap((line) => doc.splitTextToSize(line, leftBoxWidth - 8));
    doc.text(wrapLines.slice(0, 4), margin + 4, leftBoxY + 11);
    leftBoxY += 27;
  }

  // Official Thank You Note Box on the left
  doc.setFillColor(255, 247, 251);
  doc.setDrawColor(248, 208, 226);
  doc.roundedRect(margin, leftBoxY, leftBoxWidth, 21, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.6);
  doc.setTextColor(106, 17, 203);
  doc.text(`Thank you for shopping with ${brandName}!`, margin + 4, leftBoxY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(92, 72, 115);
  const thankNoteLines = doc.splitTextToSize(
    'We truly appreciate your order and hope your personalized gift brings a warm smile. Keep this official receipt for your records.',
    leftBoxWidth - 8
  );
  doc.text(thankNoteLines.slice(0, 3), margin + 4, leftBoxY + 11.5);

  // Right: Price & Payment Summary Box
  const totalsRows: [string, string, boolean?][] = [
    ['Subtotal', formatPdfRs(order.subtotalInr)],
    ...(order.giftWrapChargeInr > 0
      ? ([['Gift Wrap Charge', formatPdfRs(order.giftWrapChargeInr)]] as [string, string, boolean?][])
      : []),
    [
      'Delivery Charge',
      order.deliveryChargeInr > 0 ? formatPdfRs(order.deliveryChargeInr) : 'FREE',
    ],
    [
      `Discount${order.couponCode ? ` (${order.couponCode})` : ''}`,
      order.discountInr > 0 ? `- ${formatPdfRs(order.discountInr)}` : 'Rs. 0',
      order.discountInr > 0,
    ],
  ];

  const summaryBoxHeight = totalsRows.length * 6 + 24;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(235, 216, 255);
  doc.roundedRect(summaryX, y, summaryWidth, summaryBoxHeight, 3, 3, 'FD');

  let sy = y + 6;
  doc.setFontSize(8.4);
  for (const [label, val, isHighlight] of totalsRows) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(isHighlight ? 214 : 110, isHighlight ? 41 : 91, isHighlight ? 107 : 133);
    doc.text(label, summaryX + 4, sy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isHighlight ? 214 : 43, isHighlight ? 41 : 11, isHighlight ? 107 : 78);
    doc.text(val, summaryX + summaryWidth - 4, sy, { align: 'right' });
    sy += 6;
  }

  doc.setDrawColor(235, 216, 255);
  doc.line(summaryX + 3, sy - 2, summaryX + summaryWidth - 3, sy - 2);
  sy += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(106, 17, 203);
  doc.text('Grand Total', summaryX + 4, sy);
  doc.text(formatPdfRs(order.grandTotalInr), summaryX + summaryWidth - 4, sy, { align: 'right' });

  // Highlighted Total Paid Amount strip
  sy += 4;
  const isPaid = paymentStatus === 'Paid' || paymentStatus === 'Payment Collected';
  doc.setFillColor(isPaid ? 236 : 254, isPaid ? 253 : 243, isPaid ? 245 : 199);
  doc.roundedRect(summaryX + 3, sy, summaryWidth - 6, 8.2, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(isPaid ? 4 : 180, isPaid ? 120 : 83, isPaid ? 87 : 9);
  doc.text(`Total Paid (${paymentStatus})`, summaryX + 5.5, sy + 5.4);
  doc.text(formatPdfRs(paidAmountInr), summaryX + summaryWidth - 5.5, sy + 5.4, {
    align: 'right',
  });

  // Footer
  const footerY = pageHeight - 14;
  doc.setDrawColor(235, 216, 255);
  doc.line(margin, footerY - 4.5, pageWidth - margin, footerY - 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(110, 91, 133);
  doc.text(
    `${brandName} Official Computer-Generated Receipt • ${receipt.receiptNumber}`,
    margin,
    footerY
  );
  doc.text(`${brandTagline} • Thank you!`, pageWidth - margin, footerY, {
    align: 'right',
  });

  triggerPdfBlobDownload(doc, `GiftKart-Receipt-${order.orderNumber}.pdf`);
}

/**
 * Safely prints the Official Order Receipt using a hidden DOM iframe (avoids blocked window.open popups).
 * All user/database strings are strictly HTML-escaped.
 */
export function printOrderReceipt(
  order: DemoOrder,
  storeSettings?: StoreSettings | null
): void {
  const brandName = storeSettings?.storeName || 'GiftKart';
  const brandTagline = storeSettings?.tagline || 'Har Gift Mein Ek Kahani.';
  const logoSrc = storeSettings?.logoUrl || BRAND_ASSETS.logo;
  const storeAddress =
    storeSettings?.serviceCitiesSummary ||
    'Jalchak, Pingla, Paschim Medinipur, West Bengal - 721155';
  const resolvedContact = normalizeOfficialContactFields({
    supportEmail: storeSettings?.supportEmail,
    supportPhone: storeSettings?.supportPhone,
    contactVersion: storeSettings?.contactVersion,
    socialLinks: storeSettings?.socialLinks,
  });
  const supportLine = [resolvedContact.supportPhone, resolvedContact.supportEmail]
    .filter(Boolean)
    .join(' • ');

  const receipt = resolveOrderReceipt(order);
  const currentStatus = getStatusDisplayLabel(order.fulfillmentStatus);
  const paymentStatus = receipt.paymentStatus;
  const paidAmountInr = receipt.paidAmountInr;
  const deliveredDateLabel = formatReceiptDateLabel(receipt.deliveredAt);
  const shipping = order.shippingDetails || {};
  const paymentDetails = order.paymentDetails;

  const fullAddress = [
    order.customer.addressLine1,
    order.customer.addressLine2,
    `${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}`,
  ]
    .filter(Boolean)
    .join(', ');

  const logoHtml = isSafeImageSrc(logoSrc)
    ? `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(brandName)}" style="width:46px;height:46px;object-fit:contain;background:#FFFFFF;border-radius:10px;padding:4px;flex-shrink:0;" />`
    : '';

  const itemsHtml = order.items
    .map((item) => {
      const variants = Object.entries(item.selectedVariants || {})
        .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`)
        .join(' • ');
      const imgHtml = isSafeImageSrc(item.imageSnapshot)
        ? `<img src="${escapeHtml(item.imageSnapshot)}" alt="" style="width:42px;height:42px;object-fit:cover;border-radius:8px;border:1px solid #EBD8FF;flex-shrink:0;" />`
        : '';
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #EBD8FF;">
            <div style="display:flex;align-items:center;gap:10px;">
              ${imgHtml}
              <div>
                <div style="font-weight:700;color:#2B0B4E;font-size:13px;">${escapeHtml(item.productNameSnapshot)}</div>
                ${item.productSkuSnapshot ? `<div style="font-size:11px;color:#6E5B85;">SKU: ${escapeHtml(item.productSkuSnapshot)}</div>` : ''}
                ${variants ? `<div style="font-size:11px;color:#6E5B85;">${variants}</div>` : ''}
                ${item.personalizationDetails ? `<div style="font-size:11px;color:#6A11CB;">Personalization: ${escapeHtml(item.personalizationDetails)}</div>` : ''}
              </div>
            </div>
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #EBD8FF;text-align:center;font-weight:600;">${escapeHtml(item.quantity)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #EBD8FF;text-align:right;">&#8377;${Math.round(item.unitPriceInrSnapshot).toLocaleString('en-IN')}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #EBD8FF;text-align:right;font-weight:700;">&#8377;${Math.round(item.lineTotalInr).toLocaleString('en-IN')}</td>
        </tr>
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Order Receipt - ${escapeHtml(receipt.receiptNumber)}</title>
      <style>
        * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { margin: 0; padding: 20px; color: #2B0B4E; background: #FFFFFF; }
        .sheet { max-width: 780px; margin: 0 auto; border: 1px solid #EBD8FF; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #6A11CB, #540CA6); color: #FFFFFF; padding: 22px 24px; border-bottom: 4px solid #FF4D8D; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 18px 24px; }
        .box { border: 1px solid #EBD8FF; border-radius: 12px; padding: 12px 14px; font-size: 12.5px; line-height: 1.55; }
        .box-purple { background: #F8F2FF; }
        .box-pink { background: #FFF0F6; }
        .box h4 { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        th { background: #6A11CB; color: #FFFFFF; padding: 9px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
        .footer { padding: 14px 24px; border-top: 1px solid #EBD8FF; font-size: 11px; color: #6E5B85; display: flex; justify-content: space-between; }
        @media print { body { padding: 0; } .sheet { border: none; } }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            ${logoHtml}
            <div>
              <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(brandName)}</div>
              <div style="font-size:11.5px;opacity:0.92;">${escapeHtml(brandTagline)}</div>
              <div style="font-size:11.5px;opacity:0.88;margin-top:4px;">${escapeHtml(storeAddress)}</div>
              ${supportLine ? `<div style="font-size:11px;opacity:0.85;margin-top:2px;">${escapeHtml(supportLine)}</div>` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12.5px;font-weight:800;letter-spacing:0.08em;">OFFICIAL ORDER RECEIPT</div>
            <div style="font-size:13.5px;font-weight:800;margin-top:4px;">${escapeHtml(receipt.receiptNumber)}</div>
            <div style="font-size:11.5px;opacity:0.92;margin-top:2px;">Order ID: ${escapeHtml(order.orderNumber)}</div>
            <div style="font-size:11px;opacity:0.9;margin-top:2px;">Ordered: ${escapeHtml(formatDateTime(order.createdAt))}</div>
            ${deliveredDateLabel ? `<div style="font-size:11px;opacity:0.9;margin-top:2px;">Delivered: ${escapeHtml(deliveredDateLabel)}</div>` : ''}
            <div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.2);font-size:11px;font-weight:700;">${escapeHtml(currentStatus)}</div>
          </div>
        </div>
        <div class="grid">
          <div class="box box-purple">
            <h4 style="color:#6A11CB;">Customer &amp; Delivery Address</h4>
            <div><strong>${escapeHtml(order.customer.fullName)}</strong></div>
            <div>Phone: ${escapeHtml(order.customer.phone)}</div>
            ${order.customer.email ? `<div>Email: ${escapeHtml(order.customer.email)}</div>` : ''}
            <div>Zone: ${escapeHtml(order.customer.deliveryZoneNameSnapshot)}</div>
            <div style="margin-top:4px;">${escapeHtml(fullAddress)}</div>
          </div>
          <div class="box box-pink">
            <h4 style="color:#D6296B;">Payment &amp; Delivery Summary</h4>
            <div>Payment Method: <strong>${escapeHtml(receipt.paymentMethod)}</strong></div>
            <div>Payment Status: <strong>${escapeHtml(paymentStatus)}</strong></div>
            <div>Order Total: <strong>&#8377;${Math.round(order.grandTotalInr).toLocaleString('en-IN')}</strong></div>
            <div>Total Paid: <strong>&#8377;${Math.round(paidAmountInr).toLocaleString('en-IN')}</strong></div>
            ${paymentDetails?.collectionDate ? `<div>Payment Date: ${escapeHtml(formatReceiptDateLabel(paymentDetails.collectionDate))}</div>` : ''}
            ${shipping.courierName ? `<div>Courier: ${escapeHtml(shipping.courierName)}</div>` : ''}
            ${shipping.trackingId ? `<div>Tracking ID: ${escapeHtml(shipping.trackingId)}</div>` : ''}
          </div>
        </div>
        <div style="padding:0 24px 18px;">
          <table>
            <thead>
              <tr>
                <th style="text-align:left;">Product</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-top:14px;">
            <div style="flex:1;background:#FFF7FB;border:1px solid #F8D0E2;border-radius:12px;padding:12px 14px;font-size:12px;color:#5C4873;">
              <div style="font-weight:800;color:#6A11CB;margin-bottom:4px;">Thank you for shopping with ${escapeHtml(brandName)}!</div>
              <div>We hope your personalized gift brings joy. Please keep this official receipt for your records.</div>
            </div>
            <div style="width:270px;border:1px solid #EBD8FF;border-radius:12px;padding:12px 14px;font-size:12.5px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Subtotal</span><strong>&#8377;${Math.round(order.subtotalInr).toLocaleString('en-IN')}</strong></div>
              ${order.giftWrapChargeInr > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Gift Wrap</span><strong>&#8377;${Math.round(order.giftWrapChargeInr).toLocaleString('en-IN')}</strong></div>` : ''}
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Delivery Charge</span><strong>${order.deliveryChargeInr > 0 ? `&#8377;${Math.round(order.deliveryChargeInr).toLocaleString('en-IN')}` : 'FREE'}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;${order.discountInr > 0 ? 'color:#D6296B;' : ''}"><span>Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ''}</span><strong>${order.discountInr > 0 ? `-&#8377;${Math.round(order.discountInr).toLocaleString('en-IN')}` : '&#8377;0'}</strong></div>
              <div style="display:flex;justify-content:space-between;padding-top:8px;margin-top:6px;border-top:1px solid #EBD8FF;font-size:15px;font-weight:800;color:#6A11CB;"><span>Grand Total</span><span>&#8377;${Math.round(order.grandTotalInr).toLocaleString('en-IN')}</span></div>
              <div style="display:flex;justify-content:space-between;margin-top:6px;padding:6px 8px;border-radius:8px;background:#ECFDF5;color:#047857;font-size:12px;font-weight:700;"><span>Total Paid (${escapeHtml(paymentStatus)})</span><span>&#8377;${Math.round(paidAmountInr).toLocaleString('en-IN')}</span></div>
            </div>
          </div>
        </div>
        <div class="footer">
          <span>${escapeHtml(brandName)} Official Receipt • ${escapeHtml(receipt.receiptNumber)}</span>
          <span>${escapeHtml(brandTagline)}</span>
        </div>
      </div>
    </body>
  </html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  window.setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1500);
    }
  }, 300);
}
