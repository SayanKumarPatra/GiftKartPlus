import type { IOrderService } from '../interfaces';
import type {
  CreateDemoOrderInput,
  DemoOrder,
  OrderFulfillmentStatus,
  OrderStatusHistoryEntry,
} from '../../types';
import { STORAGE_KEYS, readStorage, writeStorage } from '../../storage/localStorageEngine';
import { SEED_DEMO_ORDERS, ensureDemoSeedHydrated } from '../../data/seedData';
import { generateOrderNumber } from '../../utils/format';

/**
 * LocalStorage Order Service enforcing:
 * 1. Demo Order Placement ONLY (no COD, no fake payments, Cashfree marked disconnected).
 * 2. Deep immutable snapshots of product name, SKU, unit price, variants, personalization,
 *    gift wrapping style/charge/recipient/message, and totals.
 * 3. Timestamped statusHistory entry recorded on placement and every Admin status update.
 */
export class LocalOrderService implements IOrderService {
  private readOrders(): DemoOrder[] {
    ensureDemoSeedHydrated();
    return readStorage<DemoOrder[]>(STORAGE_KEYS.ORDERS, SEED_DEMO_ORDERS);
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
    const existing = this.readOrders();
    const now = new Date().toISOString();
    const sequence = existing.length + 1;
    const orderNumber = generateOrderNumber(sequence);

    // Freeze deep copies so subsequent Admin catalog edits can NEVER alter historical orders
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
      status: 'Demo Placed',
      timestamp: now,
      note: 'Demo order placed locally (no real payment collected; Cashfree is Integration Ready — Not Connected).',
      updatedBy: 'System (Demo Order)',
    };

    const newOrder: DemoOrder = {
      id: `ord-${Date.now()}-${sequence}`,
      orderNumber,
      mode: 'DEMO_ORDER',
      customerAccountId: input.customerAccountId,
      customer: { ...input.customer },
      items: frozenItems,
      giftWrap: frozenGiftWrap,
      subtotalInr: input.subtotalInr,
      giftWrapChargeInr: frozenGiftWrap.chargeInrSnapshot,
      discountInr: input.discountInr,
      deliveryChargeInr: input.deliveryChargeInr,
      grandTotalInr: input.grandTotalInr,
      couponCode: input.couponCode,
      paymentGatewayStatus: 'CASHFREE_NOT_CONNECTED',
      fulfillmentStatus: 'Demo Placed',
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
}
