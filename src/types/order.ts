import type { GiftWrapSelection } from './giftWrap';

export type OrderMode = 'DEMO_ORDER';

export type PaymentGatewayStatus = 'CASHFREE_NOT_CONNECTED';

export type OrderFulfillmentStatus =
  | 'Demo Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

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
  status: OrderFulfillmentStatus;
  timestamp: string;
  note?: string;
  updatedBy: 'System (Demo Order)' | 'Admin';
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
  paymentGatewayStatus: PaymentGatewayStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
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
}
