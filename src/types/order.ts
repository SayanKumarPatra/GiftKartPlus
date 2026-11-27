import type { GiftWrapSelection } from './giftWrap';

export type OrderMode = 'LIVE_ORDER' | 'DEMO_ORDER';

export type PaymentGatewayStatus = 'CASHFREE_NOT_CONNECTED' | 'CONNECTED';

export type CanonicalPaymentStatus = 'Unpaid' | 'Payment Collected' | 'Paid' | 'Refunded';

export type PaymentRecordStatus =
  | 'SUCCESS'
  | 'PENDING'
  | 'FAILED'
  | 'UNPAID'
  | 'PAYMENT_COLLECTED'
  | 'PAID'
  | 'REFUNDED'
  | CanonicalPaymentStatus;

export type CanonicalOrderStatus =
  | 'New Order'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Delivery Failed'
  | 'Returned';

export type OrderFulfillmentStatus =
  | CanonicalOrderStatus
  | 'New'
  | 'Completed'
  | 'Demo Placed'
  | 'Confirmed'
  | 'Preparing';

export type OrderActivityType =
  | 'ORDER_CREATED'
  | 'STATUS_UPDATE'
  | 'PAYMENT_UPDATE'
  | 'NOTIFICATION_SENT'
  | 'CUSTOMER_ACTION';

export interface OrderShippingDetails {
  packingCompletedAt?: string;
  packingNote?: string;
  courierName?: string;
  trackingId?: string;
  shippedDate?: string;
  currentShippingUpdate?: string;
  expectedDeliveryDate?: string;
  outForDeliveryDate?: string;
  deliveryRemarks?: string;
  deliveredAt?: string;
  deliveryConfirmation?: string;
  exceptionReason?: string;
}

export interface OrderPaymentDetails {
  status: CanonicalPaymentStatus;
  collectedAmountInr: number;
  collectionDate?: string;
  confirmedByAdminName?: string;
  confirmedByAdminEmail?: string;
  confirmedAt?: string;
  note?: string;
}

export interface OrderPaymentHistoryEntry {
  id: string;
  status: CanonicalPaymentStatus;
  amountInr: number;
  timestamp: string;
  collectionDate?: string;
  adminName?: string;
  adminEmail?: string;
  note?: string;
}

export interface OrderNotificationRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerAccountId?: string;
  customerEmail?: string;
  eventKey: string;
  status: CanonicalOrderStatus | 'Payment Confirmed';
  title: string;
  message: string;
  sentAt: string;
  deliveryStatus: 'DELIVERED_TO_APP';
  triggeredBy: 'System' | 'Admin' | 'Customer';
  adminName?: string;
  customerNote?: string;
}

export interface OrderItemSnapshot {
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceInrSnapshot: number;
  quantity: number;
  lineTotalInr: number;
  selectedVariants: Record<string, string>;
  personalizationDetails: string;
  customPhotoFileName?: string;
  imageSnapshot?: string;
}

export interface OrderStatusHistoryEntry {
  id?: string;
  type?: OrderActivityType;
  status: OrderFulfillmentStatus;
  timestamp: string;
  note?: string;
  updatedBy: 'System' | 'System (Demo Order)' | 'Admin' | 'Customer';
  adminName?: string;
  adminEmail?: string;
  metadataSummary?: string;
}

export interface OrderCustomerDetails {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  deliveryZoneId: string;
  deliveryZoneNameSnapshot: string;
  city: string;
  state: string;
  pincode: string;
}

export interface DemoOrder {
  id: string;
  orderNumber: string;
  mode: OrderMode;
  customerAccountId?: string;
  customer: OrderCustomerDetails;
  items: OrderItemSnapshot[];
  giftWrap: GiftWrapSelection;
  subtotalInr: number;
  giftWrapChargeInr: number;
  discountInr: number;
  deliveryChargeInr: number;
  grandTotalInr: number;
  couponCode?: string;
  paymentMethod?: string;
  paymentStatus?: PaymentRecordStatus;
  paymentReference?: string;
  paymentGatewayStatus: PaymentGatewayStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  shippingDetails?: OrderShippingDetails;
  paymentDetails?: OrderPaymentDetails;
  paymentHistory?: OrderPaymentHistoryEntry[];
  notifications?: OrderNotificationRecord[];
  statusHistory: OrderStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDemoOrderInput {
  customerAccountId?: string;
  customer: OrderCustomerDetails;
  items: OrderItemSnapshot[];
  giftWrap: GiftWrapSelection;
  subtotalInr: number;
  giftWrapChargeInr: number;
  discountInr: number;
  deliveryChargeInr: number;
  grandTotalInr: number;
  couponCode?: string;
  paymentMethod?: string;
  paymentStatus?: PaymentRecordStatus;
}

export interface UpdateOrderStatusInput {
  status: CanonicalOrderStatus;
  updateDateTime?: string;
  customerNote?: string;
  shippingDetails?: Partial<OrderShippingDetails>;
}

export interface ConfirmOrderPaymentInput {
  status: CanonicalPaymentStatus;
  collectedAmountInr?: number;
  collectionDate?: string;
  note?: string;
}
