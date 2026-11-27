import type {
  CanonicalOrderStatus,
  CanonicalPaymentStatus,
  DemoOrder,
  OrderFulfillmentStatus,
  OrderShippingDetails,
  PaymentRecordStatus,
} from '../types';

export const CORE_ORDER_STAGES: CanonicalOrderStatus[] = [
  'New Order',
  'Processing',
  'Packed',
  'Shipped',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

export const EXCEPTION_ORDER_STATUSES: CanonicalOrderStatus[] = [
  'Cancelled',
  'Delivery Failed',
  'Returned',
];

export const ALL_ADMIN_ORDER_STATUSES: CanonicalOrderStatus[] = [
  ...CORE_ORDER_STAGES,
  ...EXCEPTION_ORDER_STATUSES,
];

export const CANONICAL_PAYMENT_STATUSES: CanonicalPaymentStatus[] = [
  'Unpaid',
  'Payment Collected',
  'Paid',
  'Refunded',
];

export function normalizeOrderStatus(
  status?: OrderFulfillmentStatus | string | null
): CanonicalOrderStatus {
  switch (status) {
    case 'New Order':
    case 'New':
    case 'Demo Placed':
    case 'Confirmed':
      return 'New Order';
    case 'Processing':
    case 'Preparing':
      return 'Processing';
    case 'Packed':
      return 'Packed';
    case 'Shipped':
    case 'Shipped / Dispatched':
      return 'Shipped';
    case 'In Transit':
      return 'In Transit';
    case 'Out for Delivery':
      return 'Out for Delivery';
    case 'Delivered':
    case 'Completed':
      return 'Delivered';
    case 'Cancelled':
      return 'Cancelled';
    case 'Delivery Failed':
      return 'Delivery Failed';
    case 'Returned':
      return 'Returned';
    default:
      return 'New Order';
  }
}

export function isExceptionOrderStatus(status?: OrderFulfillmentStatus | string | null): boolean {
  const canonical = normalizeOrderStatus(status);
  return (
    canonical === 'Cancelled' ||
    canonical === 'Delivery Failed' ||
    canonical === 'Returned'
  );
}

export function getStatusDisplayLabel(status?: OrderFulfillmentStatus | string | null): string {
  const canonical = normalizeOrderStatus(status);
  if (canonical === 'Shipped') {
    return 'Shipped / Dispatched';
  }
  return canonical;
}

export function getShortStageLabel(status: CanonicalOrderStatus): string {
  switch (status) {
    case 'New Order':
      return 'New';
    case 'Processing':
      return 'Processing';
    case 'Packed':
      return 'Packed';
    case 'Shipped':
      return 'Shipped';
    case 'In Transit':
      return 'In Transit';
    case 'Out for Delivery':
      return 'Out for Del.';
    case 'Delivered':
      return 'Delivered';
    default:
      return status;
  }
}

export function getOrderStageIndex(status?: OrderFulfillmentStatus | string | null): number {
  const canonical = normalizeOrderStatus(status);
  return CORE_ORDER_STAGES.indexOf(canonical);
}

export function getDeliveryVanProgressPercent(
  status?: OrderFulfillmentStatus | string | null
): number {
  const canonical = normalizeOrderStatus(status);
  switch (canonical) {
    case 'New Order':
      return 6;
    case 'Processing':
      return 20;
    case 'Packed':
      return 35;
    case 'Shipped':
      return 52;
    case 'In Transit':
      return 68;
    case 'Out for Delivery':
      return 84;
    case 'Delivered':
      return 96;
    case 'Delivery Failed':
      return 78;
    case 'Returned':
      return 24;
    case 'Cancelled':
      return 6;
    default:
      return 6;
  }
}

export function isVanInMotion(status?: OrderFulfillmentStatus | string | null): boolean {
  const canonical = normalizeOrderStatus(status);
  return (
    canonical === 'Shipped' ||
    canonical === 'In Transit' ||
    canonical === 'Out for Delivery'
  );
}

export function getLiveTrackingStatusLabel(
  status?: OrderFulfillmentStatus | string | null
): string {
  const canonical = normalizeOrderStatus(status);
  switch (canonical) {
    case 'New Order':
      return 'Order Received at GiftKart Studio';
    case 'Processing':
      return 'Curating & Preparing Your Gift';
    case 'Packed':
      return 'Gift Packed & Ready for Courier Pickup';
    case 'Shipped':
      return 'Dispatched with Courier Partner';
    case 'In Transit':
      return 'On the Way to Destination Hub';
    case 'Out for Delivery':
      return 'GiftKart Van Out for Delivery Nearby';
    case 'Delivered':
      return 'Delivered Successfully to Customer';
    case 'Cancelled':
      return 'Order Cancelled';
    case 'Delivery Failed':
      return 'Delivery Attempt Unsuccessful';
    case 'Returned':
      return 'Order Returned to GiftKart Studio';
    default:
      return 'Order Received';
  }
}

/**
 * Automatic customer notification messages strictly matching the specification.
 */
export function getAutoNotificationMessage(status: CanonicalOrderStatus): string {
  switch (status) {
    case 'New Order':
      return 'Your GiftKart order has been received successfully.';
    case 'Processing':
      return 'Your order is being prepared.';
    case 'Packed':
      return 'Your gift has been packed and is ready for dispatch.';
    case 'Shipped':
      return 'Your order has been shipped.';
    case 'In Transit':
      return 'Your order is on the way.';
    case 'Out for Delivery':
      return 'Your order is out for delivery. Please stay available.';
    case 'Delivered':
      return 'Your order has been successfully delivered. Thank you for shopping with GiftKart!';
    case 'Cancelled':
      return 'Your order has been cancelled.';
    case 'Delivery Failed':
      return 'We were unable to deliver your order. Please contact us.';
    case 'Returned':
      return 'Your order return has been recorded by GiftKart.';
  }
}

export function getPaymentConfirmedNotificationMessage(
  orderNumber: string,
  amountInr: number
): string {
  return `Payment of ₹${Math.round(amountInr).toLocaleString('en-IN')} has been confirmed for order ${orderNumber}. Thank you for shopping with GiftKart!`;
}

/**
 * Resolves canonical Payment Status strictly from payment records.
 * NEVER auto-marks an order as Paid solely because fulfillmentStatus is Delivered.
 */
export function normalizePaymentStatus(
  orderOrStatus?: Pick<DemoOrder, 'paymentDetails' | 'paymentStatus'> | PaymentRecordStatus | string | null
): CanonicalPaymentStatus {
  const raw =
    typeof orderOrStatus === 'string'
      ? orderOrStatus
      : orderOrStatus?.paymentDetails?.status || orderOrStatus?.paymentStatus;

  switch (raw) {
    case 'Paid':
    case 'PAID':
    case 'SUCCESS':
      return 'Paid';
    case 'Payment Collected':
    case 'PAYMENT_COLLECTED':
      return 'Payment Collected';
    case 'Refunded':
    case 'REFUNDED':
      return 'Refunded';
    case 'Unpaid':
    case 'UNPAID':
    case 'PENDING':
    case 'FAILED':
    default:
      return 'Unpaid';
  }
}

export function mapCanonicalPaymentToLegacyRecord(
  status: CanonicalPaymentStatus
): PaymentRecordStatus {
  switch (status) {
    case 'Paid':
      return 'PAID';
    case 'Payment Collected':
      return 'PAYMENT_COLLECTED';
    case 'Refunded':
      return 'REFUNDED';
    case 'Unpaid':
    default:
      return 'UNPAID';
  }
}

/**
 * GiftKart Brand-Only Badge Classes (Purple #6A11CB, Pink #FF4D8D, Lavender #EBD8FF, White #FFFFFF).
 * Zero red tones anywhere.
 */
export function getOrderBadgeClasses(status?: OrderFulfillmentStatus | string | null): string {
  const canonical = normalizeOrderStatus(status);
  switch (canonical) {
    case 'New Order':
      return 'bg-[#F8F2FF] text-[#6A11CB] border-[#EBD8FF]';
    case 'Processing':
      return 'bg-[#F3E5FF] text-[#540CA6] border-[#D8B4FE]';
    case 'Packed':
      return 'bg-[#EFE0FF] text-[#6A11CB] border-[#C99BFF]';
    case 'Shipped':
      return 'bg-[#6A11CB]/10 text-[#6A11CB] border-[#6A11CB]/30';
    case 'In Transit':
      return 'bg-gradient-to-r from-[#F3E5FF] to-[#FFEAF3] text-[#6A11CB] border-[#EBD8FF]';
    case 'Out for Delivery':
      return 'bg-[#FFF0F6] text-[#FF4D8D] border-[#FF4D8D]/35';
    case 'Delivered':
      return 'bg-[#6A11CB] text-white border-[#6A11CB]';
    case 'Cancelled':
      return 'bg-[#FFF0F6] text-[#B8205B] border-[#FF4D8D]/40';
    case 'Delivery Failed':
      return 'bg-[#FFE5F0] text-[#C81E62] border-[#FF4D8D]/50';
    case 'Returned':
      return 'bg-[#F8F2FF] text-[#5B21B6] border-[#C4B5FD]';
    default:
      return 'bg-[#F8F2FF] text-[#6A11CB] border-[#EBD8FF]';
  }
}

export function getPaymentBadgeClasses(status: CanonicalPaymentStatus): string {
  switch (status) {
    case 'Paid':
      return 'bg-[#6A11CB] text-white border-[#6A11CB]';
    case 'Payment Collected':
      return 'bg-[#F3E5FF] text-[#6A11CB] border-[#C99BFF]';
    case 'Refunded':
      return 'bg-[#F8F2FF] text-[#540CA6] border-[#EBD8FF]';
    case 'Unpaid':
    default:
      return 'bg-[#FFF0F6] text-[#FF4D8D] border-[#FF4D8D]/35';
  }
}

export function buildShippingMetadataSummary(
  status: CanonicalOrderStatus,
  shipping?: Partial<OrderShippingDetails>
): string | undefined {
  if (!shipping) return undefined;
  const parts: string[] = [];

  if (status === 'Packed') {
    if (shipping.packingCompletedAt) parts.push(`Packed on ${shipping.packingCompletedAt}`);
    if (shipping.packingNote) parts.push(`Packing: ${shipping.packingNote}`);
  } else if (status === 'Shipped') {
    if (shipping.courierName) parts.push(`Courier: ${shipping.courierName}`);
    if (shipping.trackingId) parts.push(`Tracking ID: ${shipping.trackingId}`);
    if (shipping.shippedDate) parts.push(`Shipped: ${shipping.shippedDate}`);
  } else if (status === 'In Transit') {
    if (shipping.currentShippingUpdate) parts.push(`Transit: ${shipping.currentShippingUpdate}`);
    if (shipping.expectedDeliveryDate) parts.push(`ETA: ${shipping.expectedDeliveryDate}`);
  } else if (status === 'Out for Delivery') {
    if (shipping.outForDeliveryDate) parts.push(`Delivery Date: ${shipping.outForDeliveryDate}`);
    if (shipping.deliveryRemarks) parts.push(`Remarks: ${shipping.deliveryRemarks}`);
  } else if (status === 'Delivered') {
    if (shipping.deliveredAt) parts.push(`Delivered: ${shipping.deliveredAt}`);
    if (shipping.deliveryConfirmation) parts.push(`Confirmed: ${shipping.deliveryConfirmation}`);
  } else if (status === 'Cancelled' || status === 'Delivery Failed' || status === 'Returned') {
    if (shipping.exceptionReason) parts.push(`Reason: ${shipping.exceptionReason}`);
    if (shipping.deliveryRemarks) parts.push(`Remarks: ${shipping.deliveryRemarks}`);
  }

  return parts.length > 0 ? parts.join(' • ') : undefined;
}
