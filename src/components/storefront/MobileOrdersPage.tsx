import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  Gift,
  Headset,
  Info,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Truck,
  User,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCustomerOrders } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import type { DemoOrder, OrderFulfillmentStatus } from '../../types';
import { ProductImage } from '../ui/ProductImage';
import { DeliveryVanTracker } from '../order/DeliveryVanTracker';
import { formatInr } from '../../utils/format';
import {
  getOrderBadgeClasses,
  getPaymentBadgeClasses,
  getStatusDisplayLabel,
  normalizeOrderStatus,
  normalizePaymentStatus,
} from '../../utils/orderLifecycle';

const VIEW_ORDERS_ILLUSTRATION =
  '/assets/aistudio/Vibrant_3D_Shopping_Essentials_49dd2758.png';

type DisplayOrderStatus =
  | 'Order Placed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';
type FilterTabKey = 'all' | DisplayOrderStatus;

interface TimelineStep {
  label: string;
  dateLabel: string;
  state: 'completed' | 'current' | 'pending';
  detail: string;
}

interface MobileOrderViewModel {
  rawOrder: DemoOrder;
  id: string;
  orderNumber: string;
  orderIdLabel: string;
  placedOn: string;
  deliveredOn?: string;
  primaryProductName: string;
  extraItemsCount: number;
  productImage?: string;
  totalQuantity: number;
  items: DemoOrder['items'];
  subtotalInr: number;
  discountInr: number;
  giftWrapChargeInr: number;
  shippingChargeInr: number;
  grandTotalInr: number;
  rawStatus: OrderFulfillmentStatus;
  displayStatus: DisplayOrderStatus;
  exactStatusLabel: string;
  canCancel: boolean;
  paymentMethod: string;
  paymentBadge: string;
  deliveryAddress: {
    name: string;
    line1: string;
    line2?: string;
    cityStatePin: string;
    phone: string;
  };
  timeline: TimelineStep[];
  cancellationNote?: string;
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

function formatFullDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function mapFulfillmentToDisplayStatus(
  status: OrderFulfillmentStatus
): DisplayOrderStatus {
  const canonical = normalizeOrderStatus(status);
  switch (canonical) {
    case 'New Order':
      return 'Order Placed';
    case 'Processing':
    case 'Packed':
      return 'Processing';
    case 'Shipped':
    case 'In Transit':
    case 'Out for Delivery':
      return 'Shipped';
    case 'Delivered':
      return 'Delivered';
    case 'Cancelled':
    case 'Delivery Failed':
    case 'Returned':
      return 'Cancelled';
    default:
      return 'Order Placed';
  }
}

function buildOrderTimeline(order: DemoOrder): TimelineStep[] {
  const placedEntry = order.statusHistory.find(
    (h) => h.status === 'New Order' || h.status === 'New' || h.status === 'Demo Placed'
  );
  const processingEntry =
    order.statusHistory.find((h) => h.status === 'Packed') ??
    order.statusHistory.find((h) => h.status === 'Processing') ??
    order.statusHistory.find((h) => h.status === 'Preparing') ??
    order.statusHistory.find((h) => h.status === 'Confirmed');
  const shippedEntry =
    order.statusHistory.find((h) => h.status === 'Out for Delivery') ??
    order.statusHistory.find((h) => h.status === 'In Transit') ??
    order.statusHistory.find((h) => h.status === 'Shipped');
  const deliveredEntry = order.statusHistory.find(
    (h) => h.status === 'Completed' || h.status === 'Delivered'
  );

  const placedDate = formatShortDate(placedEntry?.timestamp ?? order.createdAt);
  const displayStatus = mapFulfillmentToDisplayStatus(order.fulfillmentStatus);

  const stepIndex: Record<Exclude<DisplayOrderStatus, 'Cancelled'>, number> = {
    'Order Placed': 0,
    Processing: 1,
    Shipped: 2,
    Delivered: 3,
  };

  const currentIdx =
    displayStatus === 'Cancelled' ? 0 : stepIndex[displayStatus];

  return [
    {
      label: 'Order Placed',
      dateLabel: placedDate,
      state: currentIdx === 0 ? 'current' : 'completed',
      detail: 'Your GiftKart order has been received and confirmed.',
    },
    {
      label: 'Processing',
      dateLabel: processingEntry
        ? formatShortDate(processingEntry.timestamp)
        : currentIdx === 1
          ? 'Now'
          : '',
      state:
        currentIdx > 1 ? 'completed' : currentIdx === 1 ? 'current' : 'pending',
      detail:
        processingEntry?.note ||
        'Our gifting studio is preparing and quality-checking your order.',
    },
    {
      label: 'Shipped',
      dateLabel: shippedEntry
        ? formatShortDate(shippedEntry.timestamp)
        : currentIdx === 2
          ? 'In Transit'
          : '',
      state:
        currentIdx > 2 ? 'completed' : currentIdx === 2 ? 'current' : 'pending',
      detail:
        shippedEntry?.note ||
        'Package dispatched and on the way to your delivery address.',
    },
    {
      label: 'Delivered',
      dateLabel: deliveredEntry
        ? formatShortDate(deliveredEntry.timestamp)
        : '',
      state: currentIdx >= 3 ? 'completed' : 'pending',
      detail:
        deliveredEntry?.note ||
        'Delivered safely to your doorstep with protective packaging.',
    },
  ];
}

function toMobileOrderViewModel(order: DemoOrder): MobileOrderViewModel {
  const displayStatus = mapFulfillmentToDisplayStatus(order.fulfillmentStatus);
  const canonicalStatus = normalizeOrderStatus(order.fulfillmentStatus);
  const canonicalPayment = normalizePaymentStatus(order);
  const firstItem = order.items[0];
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveredEntry = order.statusHistory.find(
    (h) => h.status === 'Completed' || h.status === 'Delivered'
  );
  const cancelledEntry = order.statusHistory.find(
    (h) =>
      h.status === 'Cancelled' ||
      h.status === 'Delivery Failed' ||
      h.status === 'Returned'
  );
  const paymentMethod = order.paymentMethod?.trim() || 'Cash on Delivery (COD)';

  return {
    rawOrder: order,
    id: order.id,
    orderNumber: order.orderNumber,
    orderIdLabel: `Order #${order.orderNumber}`,
    placedOn: formatFullDate(order.createdAt),
    deliveredOn: deliveredEntry
      ? formatFullDate(deliveredEntry.timestamp)
      : undefined,
    primaryProductName: firstItem?.productNameSnapshot ?? 'GiftKart Order',
    extraItemsCount: Math.max(0, order.items.length - 1),
    productImage: firstItem?.imageSnapshot,
    totalQuantity,
    items: order.items,
    subtotalInr: order.subtotalInr,
    discountInr: order.discountInr,
    giftWrapChargeInr: order.giftWrapChargeInr,
    shippingChargeInr: order.deliveryChargeInr,
    grandTotalInr: order.grandTotalInr,
    rawStatus: order.fulfillmentStatus,
    displayStatus,
    exactStatusLabel: getStatusDisplayLabel(canonicalStatus),
    // Strictly cancellable ONLY before Processing begins
    canCancel: canonicalStatus === 'New Order',
    paymentMethod,
    paymentBadge: canonicalPayment,
    deliveryAddress: {
      name: order.customer.fullName,
      line1: order.customer.addressLine1,
      line2: order.customer.addressLine2,
      cityStatePin: `${order.customer.city}, ${order.customer.state} — ${order.customer.pincode}`,
      phone: order.customer.phone,
    },
    timeline: buildOrderTimeline(order),
    cancellationNote: cancelledEntry?.note,
  };
}

function getStatusBadgeClasses(status: DisplayOrderStatus): string {
  switch (status) {
    case 'Order Placed':
      return 'bg-[#F3E8FF] text-[#6A11CB] border border-[#DFC7FF]';
    case 'Processing':
      return 'bg-[#FFF3E0] text-[#D97706] border border-[#FDE2B8]';
    case 'Shipped':
      return 'bg-[#EBF4FF] text-[#2563EB] border border-[#CFE3FF]';
    case 'Delivered':
      return 'bg-[#E8F8EE] text-[#15803D] border border-[#C6EED3]';
    case 'Cancelled':
      return 'bg-[#FFF0F6] text-[#C81E68] border border-[#FFD1E5]';
  }
}

function getCardTimelineShortDate(step: TimelineStep): string {
  if (step.state === 'pending') return '';
  return step.dateLabel;
}

function HorizontalOrderTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="mt-3 border-t border-[#F2E8FF] pt-3">
      <div className="grid grid-cols-4">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const nextStep = steps[idx + 1];

          let lineClass = 'bg-[#E5DFF0]';
          if (step.state === 'completed' && nextStep?.state === 'completed') {
            lineClass = 'bg-[#16A34A]';
          } else if (
            step.state === 'completed' &&
            nextStep?.state === 'current'
          ) {
            lineClass = 'bg-gradient-to-r from-[#16A34A] to-[#6A11CB]';
          }

          const shortDate = getCardTimelineShortDate(step);

          return (
            <div
              key={step.label}
              className="relative flex flex-col items-center text-center"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-[10px] h-[2.5px] w-full -translate-y-1/2 ${lineClass}`}
                />
              )}

              <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                {step.state === 'completed' && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A] text-white shadow-[0_2px_6px_rgba(22,163,74,0.28)]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}
                {step.state === 'current' && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-[3.5px] border-[#6A11CB] bg-white ring-3 ring-[#EBD8FF]/80" />
                )}
                {step.state === 'pending' && (
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[#CFC6DE] bg-white" />
                )}
              </div>

              <span
                className={`mt-1.5 px-0.5 text-[9.5px] leading-[1.2] tracking-[-0.01em] min-[390px]:text-[10px] ${
                  step.state === 'current' || step.state === 'completed'
                    ? 'font-bold text-[#2B0B4E]'
                    : 'font-medium text-[#8B7AA0]'
                }`}
              >
                {step.label}
              </span>

              {shortDate && (
                <span
                  className={`mt-0.5 text-[9px] leading-none min-[390px]:text-[9.5px] ${
                    step.state === 'current'
                      ? 'font-bold text-[#6A11CB]'
                      : 'font-medium text-[#6F5C88]'
                  }`}
                >
                  {shortDate}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileOrderDetailsView({
  order,
  onBack,
  onOrderCancelled,
}: {
  order: MobileOrderViewModel;
  onBack: () => void;
  onOrderCancelled: () => void;
}) {
  const { pushToast } = useToast();
  const { t } = useLanguage();
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleConfirmCancel() {
    if (!order.canCancel || cancelling) return;
    setCancelling(true);
    try {
      await services.orders.cancelOrderByCustomer(
        order.id,
        'Cancelled by customer before processing.'
      );
      setConfirmCancelOpen(false);
      onOrderCancelled();
      pushToast({
        title: 'Order Cancelled',
        description: `${order.orderIdLabel} has been cancelled successfully.`,
        variant: 'info',
      });
    } catch (err) {
      pushToast({
        title: 'Unable to Cancel Order',
        description:
          err instanceof Error
            ? err.message
            : 'Order cannot be cancelled once processing has started.',
        variant: 'error',
      });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="px-3.5 pb-8 pt-3">
      {/* Back Header */}
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-bold text-[#6A11CB] shadow-[0_2px_8px_rgba(106,17,203,0.08)] active:scale-[0.98]"
      >
        <ArrowLeft className="h-3.5 w-3.5 stroke-[2.4]" />
        <span>{t('myOrders')}</span>
      </button>

      <div className="space-y-3">
        {/* Order Header & Items Card */}
        <div className="rounded-[22px] border border-[#EFE2FF] bg-white p-4 shadow-[0_6px_18px_rgba(106,17,203,0.07)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-[16px] font-extrabold text-[#2B0B4E]">
                {order.orderIdLabel}
              </h1>
              <p className="mt-0.5 text-[11.5px] font-medium text-[#6F5C88]">
                {t('orderDate')}: {order.placedOn}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${getOrderBadgeClasses(
                order.rawStatus
              )}`}
            >
              {order.exactStatusLabel}
            </span>
          </div>

          {/* Product Items List */}
          <div className="mt-3.5 divide-y divide-[#F2E8FF] border-t border-[#F2E8FF] pt-3">
            {order.items.map((item, idx) => (
              <div
                key={`${item.productSkuSnapshot}-${idx}`}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-2xl border border-[#EFE2FF] bg-[#FAF6FF]">
                  <ProductImage
                    src={item.imageSnapshot}
                    alt={item.productNameSnapshot}
                    aspectClass="aspect-square"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-extrabold leading-snug text-[#2B0B4E]">
                    {item.productNameSnapshot}
                  </p>
                  <p className="mt-0.5 text-[12px] font-semibold text-[#6F5C88]">
                    Quantity: {item.quantity}
                  </p>
                  <p className="mt-0.5 text-[14.5px] font-extrabold tabular-nums text-[#6A11CB]">
                    {formatInr(item.lineTotalInr)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Animated Live GiftKart Delivery Van Tracker */}
        <DeliveryVanTracker order={order.rawOrder} compact />

        {/* Order Status / Tracking Timeline */}
        {order.displayStatus === 'Cancelled' ? (
          <div className="rounded-[22px] border border-[#FFD1E5] bg-[#FFF0F6] p-4 shadow-[0_6px_18px_rgba(255,77,141,0.08)]">
            <div className="flex items-start gap-2.5">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#C81E68]" />
              <div>
                <h2 className="text-[14px] font-extrabold text-[#9D174D]">
                  {order.exactStatusLabel}
                </h2>
                <p className="mt-0.5 text-[12px] leading-snug text-[#C81E68]">
                  {order.cancellationNote ||
                    'Please check your order updates or contact GiftKart support.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-[#EFE2FF] bg-white p-4 shadow-[0_6px_18px_rgba(106,17,203,0.06)]">
            <div className="mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#6A11CB]" />
              <h2 className="text-[13.5px] font-extrabold text-[#2B0B4E]">
                {t('orderStatus')}
              </h2>
            </div>

            <ol className="space-y-3.5">
              {order.timeline.map((step, idx) => {
                const isLast = idx === order.timeline.length - 1;
                return (
                  <li key={step.label} className="relative flex gap-3">
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-[9px] top-5 h-[calc(100%+4px)] w-[2px] ${
                          step.state === 'completed'
                            ? 'bg-[#16A34A]'
                            : 'bg-[#E5DFF0]'
                        }`}
                      />
                    )}
                    <div className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
                      {step.state === 'completed' && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A] text-white">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                      {step.state === 'current' && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border-[3.5px] border-[#6A11CB] bg-white ring-3 ring-[#EBD8FF]/80" />
                      )}
                      {step.state === 'pending' && (
                        <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[#CFC6DE] bg-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[12.5px] font-bold ${
                            step.state === 'pending'
                              ? 'text-[#8B7AA0]'
                              : 'text-[#2B0B4E]'
                          }`}
                        >
                          {step.label}
                        </span>
                        {step.dateLabel && (
                          <span
                            className={`shrink-0 text-[11px] font-semibold ${
                              step.state === 'current'
                                ? 'text-[#6A11CB]'
                                : 'text-[#75628E]'
                            }`}
                          >
                            {step.dateLabel}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-[#6F5C88]">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Delivery Address Section */}
        <div className="rounded-[22px] border border-[#EFE2FF] bg-white p-4 shadow-[0_6px_18px_rgba(106,17,203,0.06)]">
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#FF4D8D]" />
            <h2 className="text-[13.5px] font-extrabold text-[#2B0B4E]">
              {t('deliveryAddress')}
            </h2>
          </div>
          <p className="text-[13px] font-bold text-[#2B0B4E]">
            {order.deliveryAddress.name}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[#5E4A77]">
            {order.deliveryAddress.line1}
            {order.deliveryAddress.line2
              ? `, ${order.deliveryAddress.line2}`
              : ''}
          </p>
          <p className="text-[12px] font-semibold text-[#6A11CB]">
            {order.deliveryAddress.cityStatePin}
          </p>
          <p className="mt-1 text-[11.5px] font-medium text-[#6F5C88]">
            {t('phoneNumber')}: {order.deliveryAddress.phone}
          </p>
        </div>

        {/* Payment Method Section (Strictly reflects customer's chosen payment method) */}
        <div className="rounded-[22px] border border-[#EFE2FF] bg-white p-4 shadow-[0_6px_18px_rgba(106,17,203,0.06)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#6A11CB]" />
              <h2 className="text-[13.5px] font-extrabold text-[#2B0B4E]">
                {t('paymentMethod')}
              </h2>
            </div>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${getPaymentBadgeClasses(
                normalizePaymentStatus(order.rawOrder)
              )}`}
            >
              {order.paymentBadge}
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] font-semibold text-[#5E4A77]">
            {order.paymentMethod}
          </p>
        </div>

        {/* Price Summary Section */}
        <div className="rounded-[22px] border border-[#EFE2FF] bg-white p-4 shadow-[0_6px_18px_rgba(106,17,203,0.06)]">
          <h2 className="mb-2.5 text-[13.5px] font-extrabold text-[#2B0B4E]">
            {t('priceDetails')}
          </h2>
          <div className="space-y-2 text-[12.5px]">
            <div className="flex items-center justify-between text-[#5E4A77]">
              <span>{t('subtotal')}</span>
              <span className="font-semibold tabular-nums text-[#2B0B4E]">
                {formatInr(order.subtotalInr)}
              </span>
            </div>
            {order.giftWrapChargeInr > 0 && (
              <div className="flex items-center justify-between text-[#5E4A77]">
                <span>{t('giftWrapCharge')}</span>
                <span className="font-semibold tabular-nums text-[#2B0B4E]">
                  + {formatInr(order.giftWrapChargeInr)}
                </span>
              </div>
            )}
            {order.discountInr > 0 && (
              <div className="flex items-center justify-between text-[#15803D]">
                <span>{t('couponDiscount')}</span>
                <span className="font-semibold tabular-nums">
                  - {formatInr(order.discountInr)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-[#5E4A77]">
              <span>{t('deliveryCharge')}</span>
              <span className="font-semibold text-[#15803D]">
                {order.shippingChargeInr === 0
                  ? t('free')
                  : formatInr(order.shippingChargeInr)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#F0E4FF] pt-2.5 text-[14px] font-extrabold text-[#2B0B4E]">
              <span>{t('grandTotal')}</span>
              <span className="tabular-nums text-[#6A11CB]">
                {formatInr(order.grandTotalInr)}
              </span>
            </div>
          </div>
        </div>

        {/* Strict Before-Processing Cancellation Policy Notice (when Processing or Shipped) */}
        {(order.displayStatus === 'Processing' ||
          order.displayStatus === 'Shipped') && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-[#EFE2FF] bg-[#FAF6FF] px-3.5 py-3 text-[12px] text-[#5B4775]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6A11CB]" />
            <p className="leading-snug">
              {order.displayStatus === 'Processing'
                ? 'Cancellation is no longer available because your order has entered processing.'
                : 'Cancellation is no longer available because your order has already been shipped.'}
            </p>
          </div>
        )}

        {/* Inline Cancel Confirmation Box (ONLY available before Processing) */}
        {order.canCancel && confirmCancelOpen && (
          <div className="rounded-[20px] border border-[#FFD1E5] bg-[#FFF0F6] p-4 shadow-[0_6px_16px_rgba(255,77,141,0.1)]">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#C81E68]" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold text-[#9D174D]">
                  {t('cancelOrder')}?
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-[#C81E68]">
                  You can cancel this order now because processing has not
                  started yet.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmCancelOpen(false)}
                    disabled={cancelling}
                    className="flex h-[40px] items-center justify-center rounded-full border border-[#E5D3FF] bg-white px-3 text-[12.5px] font-bold text-[#3B0764] active:scale-[0.98]"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleConfirmCancel()}
                    disabled={cancelling}
                    className="flex h-[40px] items-center justify-center rounded-full bg-[#C81E68] px-3 text-[12.5px] font-bold text-white shadow-xs active:scale-[0.98] disabled:opacity-60"
                  >
                    {cancelling ? '...' : t('cancelOrder')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className={`grid gap-2.5 pt-1 ${
            order.canCancel ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {order.canCancel && (
            <button
              type="button"
              onClick={() => setConfirmCancelOpen(true)}
              className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-full border border-[#FFB8D4] bg-white px-3 text-[13px] font-bold text-[#C81E68] shadow-[0_3px_10px_rgba(255,77,141,0.1)] active:scale-[0.98]"
            >
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{t('cancelOrder')}</span>
            </button>
          )}

          <Link
            to="/contact"
            className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-full border border-[#E6D3FF] bg-white px-3 text-[13px] font-bold text-[#6A11CB] shadow-[0_3px_10px_rgba(106,17,203,0.08)] active:scale-[0.98]"
          >
            <Headset className="h-4 w-4 shrink-0" />
            <span>{t('contactSupport')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileEmptyOrdersState() {
  const { t } = useLanguage();
  return (
    <div className="px-4 pb-8 pt-6 text-center">
      <div className="mx-auto max-w-[340px] rounded-[26px] border border-[#EFE2FF] bg-white/90 px-5 py-7 shadow-[0_8px_24px_rgba(106,17,203,0.07)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#F4E6FF] to-[#FFE7F2] text-[#6A11CB] shadow-inner">
          <Gift className="h-10 w-10 stroke-[1.8]" />
        </div>
        <h2 className="mt-4 text-[21px] font-extrabold tracking-[-0.015em] text-[#2B0B4E]">
          {t('noOrdersYet')}
        </h2>
        <p className="mt-2 text-[13px] leading-[1.5] text-[#5C4875]">
          {t('noOrdersDesc')}
        </p>
        <Link
          to="/shop"
          className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#9C1FC0] to-[#FF4D8D] px-6 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(106,17,203,0.26)] active:scale-[0.98]"
        >
          <span>{t('exploreGifts')}</span>
          <ArrowRight className="h-4 w-4 stroke-[2.3]" />
        </Link>
      </div>
    </div>
  );
}

export function MobileOrdersPage() {
  const { customerAccount } = useAuth();
  const { data: rawOrders, refresh: reloadOrders } = useCustomerOrders(
    customerAccount?.id,
    customerAccount?.email
  );
  const { pushToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const previewParam = searchParams.get('view');
  const [activeFilter, setActiveFilter] = useState<FilterTabKey>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const isLoggedInView =
    previewParam === 'logged-out'
      ? false
      : previewParam === 'orders' ||
          previewParam === 'empty' ||
          previewParam === 'details'
        ? true
        : Boolean(customerAccount);

  const isEmptyPreview = previewParam === 'empty';

  const ordersSource = useMemo<MobileOrderViewModel[]>(() => {
    if (isEmptyPreview || !customerAccount) return [];
    return rawOrders.map(toMobileOrderViewModel);
  }, [rawOrders, customerAccount, isEmptyPreview]);

  const statusCounts = useMemo(
    () => ({
      all: ordersSource.length,
      'Order Placed': ordersSource.filter(
        (o) => o.displayStatus === 'Order Placed'
      ).length,
      Processing: ordersSource.filter((o) => o.displayStatus === 'Processing')
        .length,
      Shipped: ordersSource.filter((o) => o.displayStatus === 'Shipped').length,
      Delivered: ordersSource.filter((o) => o.displayStatus === 'Delivered')
        .length,
      Cancelled: ordersSource.filter((o) => o.displayStatus === 'Cancelled')
        .length,
    }),
    [ordersSource]
  );

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return ordersSource;
    return ordersSource.filter((order) => order.displayStatus === activeFilter);
  }, [activeFilter, ordersSource]);

  const selectedOrder = selectedOrderId
    ? ordersSource.find((o) => o.id === selectedOrderId) ?? null
    : null;

  const filterTabs: Array<{ key: FilterTabKey; label: string; count: number }> =
    [
      { key: 'all', label: t('allOrders'), count: statusCounts.all },
      {
        key: 'Order Placed',
        label: t('statusConfirmed'),
        count: statusCounts['Order Placed'],
      },
      {
        key: 'Processing',
        label: t('statusPacked'),
        count: statusCounts.Processing,
      },
      { key: 'Shipped', label: t('statusShipped'), count: statusCounts.Shipped },
      { key: 'Delivered', label: t('statusDelivered'), count: statusCounts.Delivered },
      ...(statusCounts.Cancelled > 0
        ? [
            {
              key: 'Cancelled' as const,
              label: t('statusCancelled'),
              count: statusCounts.Cancelled,
            },
          ]
        : []),
    ];

  return (
    <div className="min-h-[calc(100dvh-132px)] w-full overflow-x-clip bg-gradient-to-b from-[#FCE9F6] via-[#FAF0FF] to-[#F6EEFF] pt-1.5">
      {/* STATE 1: LOGGED-OUT SCREEN */}
      {!isLoggedInView ? (
        <section
          aria-label={t('myOrders')}
          className="flex flex-col items-center px-4 pb-4 pt-1.5 text-center"
        >
          <div className="flex w-full items-center justify-center py-1">
            <img
              src={VIEW_ORDERS_ILLUSTRATION}
              alt={t('myOrders')}
              className="mx-auto h-auto w-full max-w-[172px] object-contain drop-shadow-[0_10px_22px_rgba(106,17,203,0.12)] min-[390px]:max-w-[192px]"
            />
          </div>

          <h1 className="mt-1.5 text-[21px] font-extrabold tracking-[-0.02em] text-[#2B0B4E] min-[390px]:text-[23px]">
            {t('myOrders')}
          </h1>

          <p className="mt-1.5 max-w-[295px] text-[12.5px] leading-[1.45] text-[#523D6D]">
            {t('signInPrompt')}
          </p>

          <div className="mt-3.5 w-full max-w-[348px] space-y-2">
            <Link
              to="/account"
              state={{ from: '/my-orders' }}
              className="relative flex min-h-[46px] w-full items-center justify-between rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] px-5 text-[14.5px] font-bold text-white shadow-[0_8px_22px_rgba(106,17,203,0.28)] transition-transform active:scale-[0.985]"
            >
              <span className="flex items-center gap-2.5">
                <User className="h-[19px] w-[19px] shrink-0 stroke-[2]" />
                <span>{t('signIn')}</span>
              </span>
              <ChevronRight className="h-[19px] w-[19px] shrink-0 stroke-[2.2]" />
            </Link>

            <Link
              to="/account"
              state={{ from: '/my-orders', mode: 'signup' }}
              className="flex min-h-[44px] w-full items-center justify-start gap-2.5 rounded-full border border-[#EBD8FF] bg-white px-5 text-[14px] font-bold text-[#2B0B4E] shadow-[0_4px_14px_rgba(106,17,203,0.08)] transition-transform active:scale-[0.985]"
            >
              <UserPlus className="h-[19px] w-[19px] shrink-0 text-[#6A11CB] stroke-[2]" />
              <span>{t('createAccount')}</span>
            </Link>
          </div>

          <div className="mt-3.5 grid w-full max-w-[360px] grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#EFE2FF] bg-[#FAF4FF]/90 px-2 py-2.5 text-center shadow-[0_3px_10px_rgba(106,17,203,0.05)]">
              <Package className="h-[19px] w-[19px] text-[#3B1764] stroke-[1.9]" />
              <span className="mt-1 text-[11px] font-bold leading-[1.2] text-[#2B0B4E] min-[390px]:text-[11.5px]">
                Live
                <br />
                Status
              </span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border border-[#EFE2FF] bg-[#FAF4FF]/90 px-2 py-2.5 text-center shadow-[0_3px_10px_rgba(106,17,203,0.05)]">
              <RotateCcw className="h-[19px] w-[19px] text-[#3B1764] stroke-[1.9]" />
              <span className="mt-1 text-[11px] font-bold leading-[1.2] text-[#2B0B4E] min-[390px]:text-[11.5px]">
                Easy
                <br />
                Returns
              </span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border border-[#EFE2FF] bg-[#FAF4FF]/90 px-2 py-2.5 text-center shadow-[0_3px_10px_rgba(106,17,203,0.05)]">
              <ShieldCheck className="h-[19px] w-[19px] text-[#3B1764] stroke-[1.9]" />
              <span className="mt-1 text-[11px] font-bold leading-[1.2] text-[#2B0B4E] min-[390px]:text-[11.5px]">
                Order
                <br />
                Support
              </span>
            </div>
          </div>
        </section>
      ) : selectedOrder ? (
        /* ORDER DETAILS VIEW */
        <MobileOrderDetailsView
          order={selectedOrder}
          onBack={() => setSelectedOrderId(null)}
          onOrderCancelled={reloadOrders}
        />
      ) : ordersSource.length === 0 ? (
        /* EMPTY ORDERS SCREEN */
        <MobileEmptyOrdersState />
      ) : (
        /* MY ORDERS DASHBOARD */
        <section
          aria-label="My Orders Dashboard"
          className="px-3.5 pb-5 pt-2"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/85 text-[#2B0B4E] shadow-[0_3px_10px_rgba(106,17,203,0.08)]">
              <Package className="h-5 w-5 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[18.5px] font-extrabold leading-tight tracking-[-0.015em] text-[#2B0B4E] min-[390px]:text-[20px]">
                {t('myOrders')}
              </h1>
              <p className="text-[11.5px] font-medium text-[#5A4476]">
                {t('trackYourOrder')}
              </p>
            </div>
          </div>

          {/* Order Status Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filter orders by status"
            className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
          >
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#6A11CB] to-[#8E24AA] font-bold text-white shadow-[0_4px_12px_rgba(106,17,203,0.28)]'
                      : 'border border-[#EFE2FF] bg-white font-semibold text-[#2B0B4E] shadow-[0_2px_8px_rgba(106,17,203,0.05)] active:bg-[#F5ECFF]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          {/* Order Cards Stack */}
          {filteredOrders.length === 0 ? (
            <div className="mt-3 rounded-[20px] border border-[#EFE2FF] bg-white p-5 text-center shadow-[0_6px_18px_rgba(106,17,203,0.06)]">
              <p className="text-[13.5px] font-bold text-[#2B0B4E]">
                No orders in {activeFilter}
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className="mt-2.5 rounded-full bg-[#F5ECFF] px-4 py-1.5 text-[12px] font-bold text-[#6A11CB]"
              >
                {t('allOrders')}
              </button>
            </div>
          ) : (
            <div className="mt-2.5 space-y-2.5">
              {filteredOrders.map((order) => (
                <article
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedOrderId(order.id);
                    }
                  }}
                  aria-label={`View details for ${order.orderIdLabel}`}
                  className="cursor-pointer rounded-[18px] border border-[#EFE2FF] bg-white p-3 shadow-[0_5px_16px_rgba(106,17,203,0.07)] transition-transform duration-150 active:scale-[0.99]"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-xl border border-[#F2E7FF] bg-[#FAF6FF] min-[390px]:h-[68px] min-[390px]:w-[68px]">
                      <ProductImage
                        src={order.productImage}
                        alt={order.primaryProductName}
                        aspectClass="aspect-square"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h2 className="truncate text-[13px] font-extrabold text-[#2B0B4E] min-[390px]:text-[13.5px]">
                          {order.orderIdLabel}
                        </h2>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold min-[390px]:text-[11px] ${getOrderBadgeClasses(
                            order.rawStatus
                          )}`}
                        >
                          {order.exactStatusLabel}
                        </span>
                      </div>

                      <p className="mt-0.5 text-[11px] font-medium text-[#705D89]">
                        Placed on: {order.placedOn}
                      </p>

                      <div className="mt-1 flex items-center justify-between gap-1.5">
                        <p className="truncate text-[12.5px] font-bold text-[#2B0B4E] min-[390px]:text-[13px]">
                          {order.primaryProductName}
                          {order.extraItemsCount > 0
                            ? ` +${order.extraItemsCount} more`
                            : ''}
                        </p>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#6A11CB] stroke-[2.2]" />
                      </div>

                      <p className="mt-0.5 text-[12px] font-medium text-[#6B5884]">
                        Qty:{' '}
                        <span className="font-bold text-[#2B0B4E]">
                          {order.totalQuantity}
                        </span>
                        <span className="mx-1.5 text-[#D5C4EA]">|</span>
                        <span className="font-extrabold tabular-nums text-[#2B0B4E]">
                          {formatInr(order.grandTotalInr)}
                        </span>
                        <span className="mx-1.5 text-[#D5C4EA]">|</span>
                        <span className="text-[11px] font-semibold text-[#6A11CB]">
                          {order.paymentMethod}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Cancelled Notice OR Horizontal 4-Step Timeline */}
                  {order.displayStatus === 'Cancelled' ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#FFF0F6] px-3 py-2 text-[11.5px] font-semibold text-[#C81E68]">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{t('orderCancelled')}</span>
                    </div>
                  ) : (
                    <HorizontalOrderTimeline steps={order.timeline} />
                  )}

                  {/* Delivered Order Footer */}
                  {order.displayStatus === 'Delivered' && order.deliveredOn && (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[#F8F3FF] px-3 py-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                        <span className="truncate text-[11px] font-medium text-[#4A3566] min-[390px]:text-[11.5px]">
                          Delivered on{' '}
                          <strong className="font-bold text-[#2B0B4E]">
                            {order.deliveredOn}
                          </strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          pushToast({
                            title: 'Ready to Reorder',
                            description: `Exploring "${order.primaryProductName}" in GiftKart store.`,
                            variant: 'success',
                          });
                          navigate('/shop');
                        }}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#DEC7FF] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6A11CB] shadow-[0_2px_6px_rgba(106,17,203,0.08)] active:scale-[0.97]"
                      >
                        <RefreshCw className="h-3 w-3 stroke-[2.4]" />
                        <span>Buy Again</span>
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
