import type { IOrderService } from '../interfaces';
import type {
  CreateDemoOrderInput,
  DemoOrder,
  OrderFulfillmentStatus,
  OrderStatusHistoryEntry,
  PaymentRecordStatus,
} from '../../types';
import { STORAGE_KEYS, readStorage, writeStorage } from '../../storage/localStorageEngine';
import { ensureDemoSeedHydrated } from '../../data/seedData';
import { generateOrderNumber } from '../../utils/format';
import { sharedCustomerDirectory } from './localAuthServices';

export class LocalOrderService implements IOrderService {
  private readOrders(): DemoOrder[] {
    ensureDemoSeedHydrated();
    return readStorage<DemoOrder[]>(STORAGE_KEYS.ORDERS, []);
  }

  async listOrders(): Promise<DemoOrder[]> {
    const orders = this.readOrders();
    return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getOrderByNumber(orderNumber: string): Promise<DemoOrder | null> {
    const normalized = orderNumber.trim().toUpperCase();
    if (!normalized) {
      return null;
    }
    const orders = this.readOrders();
    return orders.find((o) => o.orderNumber.toUpperCase() === normalized) ?? null;
  }

  async getOrdersByCustomerAccount(customerAccountId: string): Promise<DemoOrder[]> {
    const orders = await this.listOrders();
    return orders.filter((o) => o.customerAccountId === customerAccountId);
  }

  async createDemoOrder(input: CreateDemoOrderInput): Promise<DemoOrder> {
    // Reject blocked customers before placing an order
    if (input.customer.email) {
      const existingCustomer = await sharedCustomerDirectory.getCustomerByEmail(
        input.customer.email
      );
      if (existingCustomer?.status === 'BLOCKED') {
        throw new Error(
          'Your account has been restricted by the administrator and cannot place new orders.'
        );
      }
    }

    // Automatically register/sync customer in the Customers directory without duplicates
    const syncedCustomer = await sharedCustomerDirectory.upsertCustomer({
      id: input.customerAccountId,
      fullName: input.customer.fullName,
      email: input.customer.email,
      phone: input.customer.phone,
      defaultCity: input.customer.city || 'Jalchak',
    });

    const existing = this.readOrders();
    const now = new Date().toISOString();
    const sequence = existing.length + 1;
    const orderNumber = generateOrderNumber(sequence);

    const frozenItems = input.items.map((item) => ({
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      productSkuSnapshot: item.productSkuSnapshot,
      unitPriceInrSnapshot: item.unitPriceInrSnapshot,
      quantity: item.quantity,
      lineTotalInr: item.unitPriceInrSnapshot * item.quantity,
      selectedVariants: { ...item.selectedVariants },
      personalizationDetails: item.personalizationDetails,
      customPhotoFileName: item.customPhotoFileName,
      imageSnapshot: item.imageSnapshot,
    }));

    const frozenGiftWrap = {
      enabled: input.giftWrap.enabled,
      styleId: input.giftWrap.styleId,
      styleNameSnapshot: input.giftWrap.styleNameSnapshot,
      chargeInrSnapshot: input.giftWrap.enabled ? input.giftWrap.chargeInrSnapshot : 0,
      recipientName: input.giftWrap.recipientName,
      giftMessage: input.giftWrap.giftMessage,
    };

    const initialHistoryEntry: OrderStatusHistoryEntry = {
      status: 'New',
      timestamp: now,
      note: 'Order received and awaiting store review.',
      updatedBy: 'System',
    };

    const paymentStatus: PaymentRecordStatus = input.paymentStatus ?? 'PENDING';
    const paymentReference = `TXN-${orderNumber.replace(/[^A-Z0-9]/g, '')}`;

    const newOrder: DemoOrder = {
      id: `ord-${Date.now()}-${sequence}`,
      orderNumber,
      mode: 'LIVE_ORDER',
      customerAccountId: syncedCustomer.id,
      customer: { ...input.customer },
      items: frozenItems,
      giftWrap: frozenGiftWrap,
      subtotalInr: input.subtotalInr,
      giftWrapChargeInr: frozenGiftWrap.chargeInrSnapshot,
      discountInr: input.discountInr,
      deliveryChargeInr: input.deliveryChargeInr,
      grandTotalInr: input.grandTotalInr,
      couponCode: input.couponCode,
      paymentMethod: input.paymentMethod ?? 'Cash on Delivery (COD)',
      paymentStatus,
      paymentReference,
      paymentGatewayStatus: 'CASHFREE_NOT_CONNECTED',
      fulfillmentStatus: 'New',
      statusHistory: [initialHistoryEntry],
      createdAt: now,
      updatedAt: now,
    };

    writeStorage(STORAGE_KEYS.ORDERS, [newOrder, ...existing], 'orders');
    return newOrder;
  }

  async updateOrderStatus(
    orderId: string,
    nextStatus: OrderFulfillmentStatus,
    note?: string
  ): Promise<DemoOrder> {
    const existing = this.readOrders();
    const index = existing.findIndex((o) => o.id === orderId);
    if (index < 0) {
      throw new Error(`Order not found: ${orderId}`);
    }
    const target = existing[index];
    const now = new Date().toISOString();

    const historyEntry: OrderStatusHistoryEntry = {
      status: nextStatus,
      timestamp: now,
      note: note?.trim() || `Order status updated to ${nextStatus}.`,
      updatedBy: 'Admin',
    };

    const updated: DemoOrder = {
      ...target,
      fulfillmentStatus: nextStatus,
      statusHistory: [...target.statusHistory, historyEntry],
      updatedAt: now,
    };

    const nextAll = [...existing];
    nextAll[index] = updated;
    writeStorage(STORAGE_KEYS.ORDERS, nextAll, 'orders');
    return updated;
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentRecordStatus,
    note?: string
  ): Promise<DemoOrder> {
    const existing = this.readOrders();
    const index = existing.findIndex((o) => o.id === orderId);
    if (index < 0) {
      throw new Error(`Order not found: ${orderId}`);
    }
    const target = existing[index];
    const now = new Date().toISOString();
    const updated: DemoOrder = {
      ...target,
      paymentStatus,
      statusHistory: note
        ? [
            ...target.statusHistory,
            {
              status: target.fulfillmentStatus,
              timestamp: now,
              note,
              updatedBy: 'Admin',
            },
          ]
        : target.statusHistory,
      updatedAt: now,
    };
    const nextAll = [...existing];
    nextAll[index] = updated;
    writeStorage(STORAGE_KEYS.ORDERS, nextAll, 'orders');
    return updated;
  }

  async cancelOrderByCustomer(orderId: string, reason?: string): Promise<DemoOrder> {
    const existing = this.readOrders();
    const index = existing.findIndex((o) => o.id === orderId);
    if (index < 0) {
      throw new Error(`Order not found: ${orderId}`);
    }
    const target = existing[index];
    if (target.fulfillmentStatus !== 'New' && target.fulfillmentStatus !== 'Demo Placed') {
      throw new Error('Order cannot be cancelled once processing has started.');
    }

    const now = new Date().toISOString();
    const historyEntry: OrderStatusHistoryEntry = {
      status: 'Cancelled',
      timestamp: now,
      note: reason?.trim() || 'Cancelled by customer before processing.',
      updatedBy: 'Customer',
    };

    const updated: DemoOrder = {
      ...target,
      fulfillmentStatus: 'Cancelled',
      statusHistory: [...target.statusHistory, historyEntry],
      updatedAt: now,
    };

    const nextAll = [...existing];
    nextAll[index] = updated;
    writeStorage(STORAGE_KEYS.ORDERS, nextAll, 'orders');
    return updated;
  }
}
