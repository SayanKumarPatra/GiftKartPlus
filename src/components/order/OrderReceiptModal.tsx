import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Gift,
  Heart,
  Loader2,
  MapPin,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { DemoOrder, StoreSettings } from '../../types';
import { BRAND_ASSETS } from '../../config/appConfig';
import { formatDateTime, formatInr } from '../../utils/format';
import { getStatusDisplayLabel } from '../../utils/orderLifecycle';
import {
  downloadOrderReceiptPdf,
  printOrderReceipt,
  resolveOrderReceipt,
} from '../../utils/orderReceiptPdf';
import { normalizeOfficialContactFields } from '../../utils/storefrontHelpers';
import { useLanguage } from '../../context/LanguageContext';

interface OrderReceiptModalProps {
  order: DemoOrder | null;
  storeSettings?: StoreSettings | null;
  onClose: () => void;
  showPrintButton?: boolean;
  onDownloadComplete?: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  storeSettings,
  onClose,
  showPrintButton = false,
  onDownloadComplete,
}) => {
  const { t } = useLanguage();
  const [downloading, setDownloading] = useState(false);

  if (!order) return null;

  const receipt = resolveOrderReceipt(order);
  const brandName = storeSettings?.storeName || 'GiftKart';
  const brandTagline = storeSettings?.tagline || 'Har Gift Mein Ek Kahani.';
  const logoSrc = storeSettings?.logoUrl || BRAND_ASSETS.logo;
  const resolvedContact = normalizeOfficialContactFields({
    supportEmail: storeSettings?.supportEmail,
    supportPhone: storeSettings?.supportPhone,
    contactVersion: storeSettings?.contactVersion,
    socialLinks: storeSettings?.socialLinks,
  });
  const deliveryStatusLabel = getStatusDisplayLabel(order.fulfillmentStatus);
  const fullAddress = [
    order.customer.addressLine1,
    order.customer.addressLine2,
    `${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}`,
  ]
    .filter(Boolean)
    .join(', ');

  const isPaid =
    receipt.paymentStatus === 'Paid' || receipt.paymentStatus === 'Payment Collected';

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadOrderReceiptPdf(order, storeSettings);
      onDownloadComplete?.();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-[#18072E]/70 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('officialOrderReceipt')}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] sm:rounded-[24px] bg-white shadow-2xl border border-[#EBD8FF]">
        {/* Top Modal Utility Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-[#EFE3FF] bg-[#FAF6FF] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6A11CB] text-white">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-[#2B0B4E] truncate">
                {t('officialOrderReceipt')}
              </p>
              <p className="text-[11px] font-semibold text-[#6A11CB] truncate">
                {receipt.receiptNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E6D4FF] bg-white text-[#523B6E] hover:bg-[#F5EBFF] transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Official Store-Style Receipt Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-5 space-y-4">
          {/* Official Brand Header */}
          <div className="overflow-hidden rounded-2xl border border-[#EBD8FF] bg-gradient-to-br from-[#6A11CB] via-[#5A0EB2] to-[#4A0B94] text-white shadow-sm">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3.5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-white p-1.5 shadow-sm flex items-center justify-center">
                  <img
                    src={logoSrc}
                    alt={brandName}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[18px] font-extrabold tracking-tight leading-tight">
                    {brandName}
                  </h3>
                  <p className="text-[11.5px] text-white/85 mt-0.5">{brandTagline}</p>
                  <p className="text-[11px] text-white/80 mt-1 break-words">
                    {resolvedContact.supportPhone} • {resolvedContact.supportEmail}
                  </p>
                </div>
              </div>

              <div className="sm:text-right border-t border-white/15 pt-3 sm:border-t-0 sm:pt-0 space-y-1 text-[11.5px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/18 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="h-3 w-3 text-[#7CFFB2]" />
                  {deliveryStatusLabel}
                </span>
                <p className="font-extrabold text-[13px] tracking-wide">
                  {receipt.receiptNumber}
                </p>
                <p className="text-white/85">
                  Order ID: <span className="font-semibold text-white">{order.orderNumber}</span>
                </p>
                <p className="text-white/80">
                  Ordered: {formatDateTime(order.createdAt)}
                </p>
                {receipt.deliveredAt && (
                  <p className="text-white/90 font-medium">
                    {t('deliveredDateLabel')}: {formatDateTime(receipt.deliveredAt)}
                  </p>
                )}
              </div>
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FF4D8D] via-[#FF7EB3] to-[#FF4D8D]" />
          </div>

          {/* Customer Address & Payment Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3.5 text-[12px] text-[#3E245E] space-y-1">
              <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#6A11CB] mb-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Customer &amp; Delivery Address
              </p>
              <p className="font-bold text-[13px] text-[#2B0B4E] break-words">
                {order.customer.fullName}
              </p>
              <p className="break-words">Phone: {order.customer.phone}</p>
              {order.customer.email && (
                <p className="break-all">Email: {order.customer.email}</p>
              )}
              <p className="pt-1 text-[#5A4473] leading-relaxed break-words">
                {fullAddress}
              </p>
            </div>

            <div className="rounded-2xl border border-[#F8D0E2] bg-[#FFF5FA] p-3.5 text-[12px] text-[#3E245E] space-y-1.5">
              <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#D6296B] mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Payment &amp; Fulfillment
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6E5B85]">Payment Method</span>
                <span className="font-bold text-[#2B0B4E] text-right">
                  {receipt.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6E5B85]">Payment Status</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {receipt.paymentStatus}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6E5B85]">Delivery Status</span>
                <span className="font-bold text-emerald-700">{deliveryStatusLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F4D6E5]">
                <span className="font-semibold text-[#5A4473]">{t('totalPaidLabel')}</span>
                <span className="font-extrabold text-[13.5px] text-[#6A11CB]">
                  {formatInr(receipt.paidAmountInr)}
                </span>
              </div>
            </div>
          </div>

          {/* Purchased Products List */}
          <div className="rounded-2xl border border-[#EBD8FF] overflow-hidden">
            <div className="bg-[#6A11CB] px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white flex items-center justify-between">
              <span>Ordered Products ({order.items.length})</span>
              <span>Amount</span>
            </div>
            <div className="divide-y divide-[#F0E4FF] bg-white">
              {order.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="flex items-start gap-3 p-3.5"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-[#FAF6FF]">
                    {item.imageSnapshot ? (
                      <img
                        src={item.imageSnapshot}
                        alt={item.productNameSnapshot}
                        className="h-full w-full max-h-full max-w-full object-contain object-center"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[#A78BFA]">
                        <Gift className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[#2B0B4E] leading-snug break-words">
                      {item.productNameSnapshot}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[#6E5B85]">
                      Qty: <strong className="text-[#2B0B4E]">{item.quantity}</strong> ×{' '}
                      {formatInr(item.unitPriceInrSnapshot)}
                    </p>
                    {Object.keys(item.selectedVariants || {}).length > 0 && (
                      <p className="mt-0.5 text-[11px] text-[#7A6691] break-words">
                        {Object.entries(item.selectedVariants)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' • ')}
                      </p>
                    )}
                    {item.personalizationDetails && (
                      <p className="mt-1 text-[11px] font-medium text-[#6A11CB] break-words">
                        Personalization: {item.personalizationDetails}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13.5px] font-extrabold text-[#2B0B4E]">
                      {formatInr(item.lineTotalInr)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="rounded-2xl border border-[#EBD8FF] bg-[#FCF9FF] p-4 space-y-2 text-[12.5px]">
            <div className="flex items-center justify-between text-[#5A4473]">
              <span>Subtotal</span>
              <span className="font-semibold text-[#2B0B4E]">
                {formatInr(order.subtotalInr)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#5A4473]">
              <span>Delivery Charge</span>
              <span className="font-semibold text-[#2B0B4E]">
                {order.deliveryChargeInr > 0 ? formatInr(order.deliveryChargeInr) : 'FREE'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#5A4473]">
              <span>
                Discount{order.couponCode ? ` (${order.couponCode})` : ''}
              </span>
              <span
                className={`font-semibold ${
                  order.discountInr > 0 ? 'text-[#D6296B]' : 'text-[#2B0B4E]'
                }`}
              >
                {order.discountInr > 0 ? `- ${formatInr(order.discountInr)}` : formatInr(0)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#E6D4FF] pt-2.5 text-[15px] font-extrabold text-[#6A11CB]">
              <span>Grand Total</span>
              <span>{formatInr(order.grandTotalInr)}</span>
            </div>
            <div
              className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-[12.5px] font-bold ${
                isPaid
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <span>
                {t('totalPaidLabel')} ({receipt.paymentStatus})
              </span>
              <span>{formatInr(receipt.paidAmountInr)}</span>
            </div>
          </div>

          {/* Short Thank You Note */}
          <div className="rounded-2xl border border-[#F8D0E2] bg-gradient-to-r from-[#FFF5FA] to-[#F8F2FF] px-4 py-3 text-center">
            <p className="inline-flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-[#6A11CB]">
              <Heart className="h-3.5 w-3.5 fill-[#FF4D8D] text-[#FF4D8D]" />
              {t('receiptThankYou')}
            </p>
            <p className="mt-0.5 text-[11px] text-[#6E5B85]">{brandTagline}</p>
          </div>
        </div>

        {/* Sticky Footer Action Bar */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#EFE3FF] bg-white px-4 py-3 sm:px-5 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
          {showPrintButton && (
            <button
              type="button"
              onClick={() => printOrderReceipt(order, storeSettings)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5D3FF] bg-[#F8F2FF] px-4 py-2.5 text-[13px] font-bold text-[#5E17EB] hover:bg-[#EFE2FF] transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#8E2DE2] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-md shadow-[#6A11CB]/25 hover:opacity-95 disabled:opacity-60 transition-all"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('downloadingReceipt')}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t('downloadReceipt')} (PDF)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
