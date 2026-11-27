import { jsPDF } from 'jspdf';
import type { DemoOrder, StoreSettings } from '../types';
import { formatDateTime } from './format';
import { getStatusDisplayLabel, normalizePaymentStatus } from './orderLifecycle';

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

async function loadImageAsJpegDataUrl(src: string): Promise<string | null> {
  if (!isSafeImageSrc(src)) return null;
  if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/png')) {
    return src;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = window.setTimeout(() => resolve(null), 3500);
    img.onload = () => {
      window.clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const size = 96;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        const ratio = Math.min(size / img.width, size / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
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

/**
 * Generates and downloads a real, GiftKart-branded A4 PDF Received Copy from live database order data.
 */
export async function downloadOrderReceiptPdf(
  order: DemoOrder,
  storeSettings?: StoreSettings | null
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const brandName = storeSettings?.storeName || 'GiftKart';
  const storeAddress =
    storeSettings?.serviceCitiesSummary ||
    'Jalchak, Pingla, Paschim Medinipur, West Bengal - 721155';
  const supportPhone = storeSettings?.supportPhone || '+91 9239505791';
  const supportEmail = storeSettings?.supportEmail || 'hello.giftkart@gmail.com';
  const currentStatus = getStatusDisplayLabel(order.fulfillmentStatus);
  const paymentStatus = normalizePaymentStatus(order);
  const shipping = order.shippingDetails || {};
  const paymentDetails = order.paymentDetails;

  // Brand Header Banner (#6A11CB)
  doc.setFillColor(106, 17, 203);
  doc.rect(0, 0, pageWidth, 34, 'F');
  // Pink Accent Strip (#FF4D8D)
  doc.setFillColor(255, 77, 141);
  doc.rect(0, 34, pageWidth, 2.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(brandName, margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(storeAddress, margin, 21.5);
  const contactLine = [supportPhone, supportEmail].filter(Boolean).join('  |  ');
  if (contactLine) {
    doc.text(contactLine, margin, 26.5);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RECEIVED COPY', pageWidth - margin, 13.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Order ID: ${order.orderNumber}`, pageWidth - margin, 19.5, { align: 'right' });
  doc.setFontSize(8.5);
  doc.text(`Order Date: ${formatDateTime(order.createdAt)}`, pageWidth - margin, 25, {
    align: 'right',
  });
  doc.text(`Status: ${currentStatus}`, pageWidth - margin, 30, { align: 'right' });

  let y = 43;

  // Two-column info cards: Customer & Delivery | Payment & Shipping
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
    `Name: ${order.customer.fullName}`,
    `Phone: ${order.customer.phone}`,
    order.customer.email ? `Email: ${order.customer.email}` : '',
    `Zone: ${order.customer.deliveryZoneNameSnapshot}`,
    `Address: ${fullAddress}`,
  ].filter(Boolean);

  const paymentShippingLines = [
    `Payment Method: ${order.paymentMethod || 'Cash on Delivery (COD)'}`,
    `Payment Status: ${paymentStatus}`,
    `Collected Amount: ${formatPdfRs(paymentDetails?.collectedAmountInr ?? (paymentStatus === 'Paid' ? order.grandTotalInr : 0))}`,
    paymentDetails?.collectionDate
      ? `Collection Date: ${formatDateTime(paymentDetails.collectionDate)}`
      : '',
    paymentDetails?.confirmedByAdminName
      ? `Confirmed By: ${paymentDetails.confirmedByAdminName}`
      : '',
    shipping.courierName ? `Courier: ${shipping.courierName}` : '',
    shipping.trackingId ? `Tracking ID: ${shipping.trackingId}` : '',
    shipping.shippedDate ? `Shipped Date: ${shipping.shippedDate}` : '',
    shipping.expectedDeliveryDate ? `Expected Delivery: ${shipping.expectedDeliveryDate}` : '',
  ].filter(Boolean);

  doc.setFontSize(8.2);
  const leftWrapped = customerLines.flatMap((line) => doc.splitTextToSize(line, colWidth - 8));
  const rightWrapped = paymentShippingLines.flatMap((line) =>
    doc.splitTextToSize(line, colWidth - 8)
  );
  const cardHeight = Math.max(leftWrapped.length, rightWrapped.length) * 4.4 + 13;

  // Left card
  doc.setFillColor(248, 242, 255);
  doc.setDrawColor(235, 216, 255);
  doc.roundedRect(margin, y, colWidth, cardHeight, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(106, 17, 203);
  doc.text('CUSTOMER & DELIVERY DETAILS', margin + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(43, 11, 78);
  doc.text(leftWrapped, margin + 4, y + 12);

  // Right card
  const rightX = margin + colWidth + colGap;
  doc.setFillColor(255, 240, 246);
  doc.setDrawColor(235, 216, 255);
  doc.roundedRect(rightX, y, colWidth, cardHeight, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 77, 141);
  doc.text('PAYMENT & SHIPPING SUMMARY', rightX + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(43, 11, 78);
  doc.text(rightWrapped, rightX + 4, y + 12);

  y += cardHeight + 7;

  // Purchased Items Header
  doc.setFillColor(106, 17, 203);
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PRODUCT DETAILS', margin + 3, y + 5.3);
  doc.text('QTY', margin + 114, y + 5.3, { align: 'center' });
  doc.text('UNIT PRICE', margin + 142, y + 5.3, { align: 'right' });
  doc.text('TOTAL', margin + contentWidth - 3, y + 5.3, { align: 'right' });
  y += 10;

  // Preload thumbnails safely
  const thumbnails = await Promise.all(
    order.items.map((item) =>
      item.imageSnapshot ? loadImageAsJpegDataUrl(item.imageSnapshot) : Promise.resolve(null)
    )
  );

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
      detailLines.push(`Note: ${item.personalizationDetails}`);
    }

    doc.setFontSize(8.3);
    const textOffsetX = thumb ? margin + 15 : margin + 3;
    const maxNameWidth = thumb ? 90 : 102;
    const wrappedName = doc.splitTextToSize(detailLines[0], maxNameWidth);
    const wrappedMeta = detailLines
      .slice(1)
      .flatMap((l) => doc.splitTextToSize(l, maxNameWidth));
    const rowHeight = Math.max(thumb ? 14 : 9, (wrappedName.length + wrappedMeta.length) * 4 + 4);

    if (y + rowHeight > pageHeight - 45) {
      doc.addPage();
      y = 18;
    }

    doc.setDrawColor(235, 216, 255);
    doc.setFillColor(i % 2 === 0 ? 255 : 252, i % 2 === 0 ? 255 : 249, 255);
    doc.rect(margin, y, contentWidth, rowHeight, 'FD');

    if (thumb) {
      try {
        doc.addImage(thumb, 'JPEG', margin + 2.5, y + 2, 10, 10);
      } catch {
        // Ignore non-embeddable image format
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(43, 11, 78);
    doc.text(wrappedName, textOffsetX, y + 5.2);

    if (wrappedMeta.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(110, 91, 133);
      doc.text(wrappedMeta, textOffsetX, y + 5.2 + wrappedName.length * 4);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(43, 11, 78);
    doc.text(String(item.quantity), margin + 114, y + 6, { align: 'center' });
    doc.text(formatPdfRs(item.unitPriceInrSnapshot), margin + 142, y + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatPdfRs(item.lineTotalInr), margin + contentWidth - 3, y + 6, { align: 'right' });

    y += rowHeight;
  }

  y += 6;
  if (y > pageHeight - 62) {
    doc.addPage();
    y = 18;
  }

  // Gift Wrap note (left) & Price Breakdown (right)
  const summaryWidth = 76;
  const summaryX = margin + contentWidth - summaryWidth;

  if (order.giftWrap?.enabled) {
    const wrapBoxWidth = contentWidth - summaryWidth - 6;
    doc.setFillColor(248, 242, 255);
    doc.setDrawColor(235, 216, 255);
    doc.roundedRect(margin, y, wrapBoxWidth, 24, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(106, 17, 203);
    doc.text('GIFT WRAP INCLUDED', margin + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(43, 11, 78);
    const wrapLines = [
      order.giftWrap.styleNameSnapshot ? `Style: ${order.giftWrap.styleNameSnapshot}` : '',
      order.giftWrap.recipientName ? `Recipient: ${order.giftWrap.recipientName}` : '',
      order.giftWrap.giftMessage ? `Message: "${order.giftWrap.giftMessage}"` : '',
    ]
      .filter(Boolean)
      .flatMap((line) => doc.splitTextToSize(line, wrapBoxWidth - 8));
    doc.text(wrapLines.slice(0, 4), margin + 4, y + 11);
  }

  const totalsRows: [string, string][] = [
    ['Subtotal', formatPdfRs(order.subtotalInr)],
    ['Gift Wrap', order.giftWrapChargeInr > 0 ? formatPdfRs(order.giftWrapChargeInr) : 'Rs. 0'],
    [
      'Delivery Charge',
      order.deliveryChargeInr > 0 ? formatPdfRs(order.deliveryChargeInr) : 'FREE',
    ],
  ];
  if (order.discountInr > 0) {
    totalsRows.push([
      `Discount${order.couponCode ? ` (${order.couponCode})` : ''}`,
      `- ${formatPdfRs(order.discountInr)}`,
    ]);
  }

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(235, 216, 255);
  const summaryBoxHeight = totalsRows.length * 6 + 15;
  doc.roundedRect(summaryX, y, summaryWidth, summaryBoxHeight, 3, 3, 'FD');

  let sy = y + 6;
  doc.setFontSize(8.5);
  for (const [label, val] of totalsRows) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 91, 133);
    doc.text(label, summaryX + 4, sy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(43, 11, 78);
    doc.text(val, summaryX + summaryWidth - 4, sy, { align: 'right' });
    sy += 6;
  }

  doc.setDrawColor(235, 216, 255);
  doc.line(summaryX + 3, sy - 2, summaryX + summaryWidth - 3, sy - 2);
  sy += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(106, 17, 203);
  doc.text('Grand Total', summaryX + 4, sy);
  doc.text(formatPdfRs(order.grandTotalInr), summaryX + summaryWidth - 4, sy, { align: 'right' });

  // Footer
  const footerY = pageHeight - 16;
  doc.setDrawColor(235, 216, 255);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(110, 91, 133);
  doc.text(
    `Generated by ${brandName} Admin Panel • ${formatDateTime(new Date().toISOString())}`,
    margin,
    footerY
  );
  doc.text('Thank you for shopping with GiftKart!', pageWidth - margin, footerY, {
    align: 'right',
  });

  doc.save(`GiftKart-Received-Copy-${order.orderNumber}.pdf`);
}

/**
 * Safely prints the real Received Copy using a hidden DOM iframe (avoids blocked window.open popups).
 * All user/database strings are strictly HTML-escaped.
 */
export function printOrderReceipt(
  order: DemoOrder,
  storeSettings?: StoreSettings | null
): void {
  const brandName = storeSettings?.storeName || 'GiftKart';
  const storeAddress =
    storeSettings?.serviceCitiesSummary ||
    'Jalchak, Pingla, Paschim Medinipur, West Bengal - 721155';
  const supportLine = [storeSettings?.supportPhone, storeSettings?.supportEmail]
    .filter(Boolean)
    .join(' • ');
  const currentStatus = getStatusDisplayLabel(order.fulfillmentStatus);
  const paymentStatus = normalizePaymentStatus(order);
  const shipping = order.shippingDetails || {};
  const paymentDetails = order.paymentDetails;

  const fullAddress = [
    order.customer.addressLine1,
    order.customer.addressLine2,
    `${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}`,
  ]
    .filter(Boolean)
    .join(', ');

  const itemsHtml = order.items
    .map((item) => {
      const variants = Object.entries(item.selectedVariants || {})
        .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`)
        .join(' • ');
      const imgHtml = isSafeImageSrc(item.imageSnapshot)
        ? `<img src="${escapeHtml(item.imageSnapshot)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px;border:1px solid #EBD8FF;flex-shrink:0;" />`
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
                ${item.personalizationDetails ? `<div style="font-size:11px;color:#6A11CB;">Note: ${escapeHtml(item.personalizationDetails)}</div>` : ''}
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
      <title>Received Copy - ${escapeHtml(order.orderNumber)}</title>
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
          <div>
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(brandName)}</div>
            <div style="font-size:12px;opacity:0.9;margin-top:4px;">${escapeHtml(storeAddress)}</div>
            ${supportLine ? `<div style="font-size:11.5px;opacity:0.85;margin-top:2px;">${escapeHtml(supportLine)}</div>` : ''}
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px;font-weight:800;letter-spacing:0.08em;">RECEIVED COPY</div>
            <div style="font-size:14px;font-weight:700;margin-top:4px;">${escapeHtml(order.orderNumber)}</div>
            <div style="font-size:11.5px;opacity:0.9;margin-top:2px;">${escapeHtml(formatDateTime(order.createdAt))}</div>
            <div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.18);font-size:11px;font-weight:700;">${escapeHtml(currentStatus)}</div>
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
            <h4 style="color:#FF4D8D;">Payment &amp; Shipping Info</h4>
            <div>Method: <strong>${escapeHtml(order.paymentMethod || 'Cash on Delivery (COD)')}</strong></div>
            <div>Payment Status: <strong>${escapeHtml(paymentStatus)}</strong></div>
            <div>Collected: <strong>&#8377;${Math.round(paymentDetails?.collectedAmountInr ?? (paymentStatus === 'Paid' ? order.grandTotalInr : 0)).toLocaleString('en-IN')}</strong></div>
            ${paymentDetails?.collectionDate ? `<div>Collection Date: ${escapeHtml(formatDateTime(paymentDetails.collectionDate))}</div>` : ''}
            ${paymentDetails?.confirmedByAdminName ? `<div>Confirmed By: ${escapeHtml(paymentDetails.confirmedByAdminName)}</div>` : ''}
            ${shipping.courierName ? `<div>Courier: ${escapeHtml(shipping.courierName)}</div>` : ''}
            ${shipping.trackingId ? `<div>Tracking ID: ${escapeHtml(shipping.trackingId)}</div>` : ''}
            ${shipping.expectedDeliveryDate ? `<div>Expected Delivery: ${escapeHtml(shipping.expectedDeliveryDate)}</div>` : ''}
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
          <div style="display:flex;justify-content:flex-end;margin-top:14px;">
            <div style="width:260px;border:1px solid #EBD8FF;border-radius:12px;padding:12px 14px;font-size:12.5px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Subtotal</span><strong>&#8377;${Math.round(order.subtotalInr).toLocaleString('en-IN')}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Gift Wrap</span><strong>&#8377;${Math.round(order.giftWrapChargeInr).toLocaleString('en-IN')}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Delivery Charge</span><strong>${order.deliveryChargeInr > 0 ? `&#8377;${Math.round(order.deliveryChargeInr).toLocaleString('en-IN')}` : 'FREE'}</strong></div>
              ${order.discountInr > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px;color:#FF4D8D;"><span>Discount</span><strong>-&#8377;${Math.round(order.discountInr).toLocaleString('en-IN')}</strong></div>` : ''}
              <div style="display:flex;justify-content:space-between;padding-top:8px;margin-top:6px;border-top:1px solid #EBD8FF;font-size:15px;font-weight:800;color:#6A11CB;"><span>Grand Total</span><span>&#8377;${Math.round(order.grandTotalInr).toLocaleString('en-IN')}</span></div>
            </div>
          </div>
        </div>
        <div class="footer">
          <span>Generated on ${escapeHtml(formatDateTime(new Date().toISOString()))}</span>
          <span>Thank you for shopping with ${escapeHtml(brandName)}!</span>
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
