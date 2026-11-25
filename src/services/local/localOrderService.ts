import type { IOrderService } from '../interfaces';
import type {
  CreateDemoOrderInput,
  CustomerDemoAccount,
  DemoOrder,
  OrderFulfillmentStatus,
  OrderStatusHistoryEntry,
  PaymentRecordStatus,
} from '../../types';
import { STORAGE_KEYS, readStorage } from '../../storage/localStorageEngine';
import {
  apiRequest,
  ensureServerHydrated,
  getAdminBearerToken,
  getLiveStore,
  refreshStoreFromServer,
  saveAdminCollection,
} from '../../storage/serverSync';

export class LocalOrderService implements IOrderService {
  private async readAdminOrders(): Promise<DemoOrder[]> {
    await ensureServerHydrated();
    return getLiveStore().orders;
  }

  async listOrders(): Promise<DemoOrder[]> {
    if (!getAdminBearerToken()) {
      return [];
    }
    const orders = await this.readAdminOrders();
    return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getOrderByNumber(orderNumber: string): Promise<DemoOrder | null> {
    const normalized = orderNumber.trim().toUpperCase();
    if (!normalized) {
      return null;
    }
    const res = await apiRequest<{ order: DemoOrder | null }>(
      `/api/public/orders/track?orderNumber=${encodeURIComponent(normalized)}`
    );
    return res.order ?? null;
  }

  async getOrdersByCustomerAccount(customerAccountId: string): Promise<DemoOrder[]> {
    if (!customerAccountId) return [];
    const res = await apiRequest<{ orders: DemoOrder[] }>(
      `/api/public/orders/customer?accountId=${encodeURIComponent(customerAccountId)}`
    );
    return Array.isArray(res.orders) ? res.orders : [];
  }

  async createDemoOrder(input: CreateDemoOrderInput): Promise<DemoOrder> {
    const res = await apiRequest<{ order: DemoOrder }>('/api/public/orders', {
      method: 'POST',
      body: input,
    });
    void refreshStoreFromServer(['orders', 'customers']);
    return res.order;
  }

  async updateOrderStatus(
    orderId: string,
    nextStatus: OrderFulfillmentStatus,
    note?: string
  ): Promise<DemoOrder> {
    const existing = await this.readAdminOrders();
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
    await saveAdminCollection('orders', nextAll, 'orders');
    return updated;
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentRecordStatus,
    note?: string
  ): Promise<DemoOrder> {
    const existing = await this.readAdminOrders();
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
    await saveAdminCollection('orders', nextAll, 'orders');
    return updated;
  }

  async cancelOrderByCustomer(orderId: string, reason?: string): Promise<DemoOrder> {
    const currentCustomer = readStorage<CustomerDemoAccount | null>(
      STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT,
      null
    );
    const res = await apiRequest<{ order: DemoOrder }>(
      `/api/public/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        method: 'POST',
        body: {
          reason,
          customerAccountId: currentCustomer?.id,
        },
      }
    );
    void refreshStoreFromServer(['orders']);
    return res.order;
  }
}
