import type { IOrderService } from '../interfaces';
import type {
  CreateDemoOrderInput,
  CustomerDemoAccount,
  DemoOrder,
  OrderFulfillmentStatus,
  OrderStatusHistoryEntry,
  PaymentRecordStatus,
  RegisteredCustomer,
} from '../../types';
import { STORAGE_KEYS, readStorage } from '../../storage/localStorageEngine';
import {
  apiRequest,
  ensureServerHydrated,
  getAdminBearerToken,
  getLiveStore,
  isBackendUnavailableError,
  refreshStoreFromServer,
  saveAdminCollection,
  savePublicLocalCollection,
} from '../../storage/serverSync';

function generateLocalOrderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `GK-${year}-${String(sequence).padStart(4, '0')}`;
}

function buildLocalCustomerId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `GK-CUST-${clean.slice(0, 12).toUpperCase() || Date.now().toString(36).toUpperCase()}`;
}

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
    try {
      const res = await apiRequest<{ order: DemoOrder | null }>(
        `/api/public/orders/track?orderNumber=${encodeURIComponent(normalized)}`
      );
      return res.order ?? null;
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        await ensureServerHydrated();
        return (
          getLiveStore().orders.find((o) => o.orderNumber.toUpperCase() === normalized) ?? null
        );
      }
      throw err;
    }
  }

  async getOrdersByCustomerAccount(customerAccountId: string): Promise<DemoOrder[]> {
    if (!customerAccountId) return [];
    try {
      const res = await apiRequest<{ orders: DemoOrder[] }>(
        `/api/public/orders/customer?accountId=${encodeURIComponent(customerAccountId)}`
      );
      return Array.isArray(res.orders) ? res.orders : [];
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        await ensureServerHydrated();
        return getLiveStore()
          .orders.filter((o) => o.customerAccountId === customerAccountId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
      throw err;
    }
  }

  async createDemoOrder(input: CreateDemoOrderInput): Promise<DemoOrder> {
    try {
      const res = await apiRequest<{ order: DemoOrder }>('/api/public/orders', {
        method: 'POST',
        body: input,
      });
      void refreshStoreFromServer(['orders', 'customers']);
      return res.order;
    } catch (err) {
      if (!isBackendUnavailableError(err)) {
        throw err;
      }

      await ensureServerHydrated();
      const customerEmail = input.customer.email.trim().toLowerCase();
      const customerName = input.customer.fullName.trim();
      const customerPhone = input.customer.phone.trim();

      if (!customerName || !customerPhone || input.items.length === 0) {
        throw new Error('Order requires customer name, phone, and at least one item.');
      }

      const existingCustomers = getLiveStore().registeredCustomers;
      const existingIdx = existingCustomers.findIndex(
        (c) =>
          (input.customerAccountId && c.id === input.customerAccountId) ||
          (customerEmail && c.email.toLowerCase() === customerEmail)
      );
      if (existingIdx >= 0 && existingCustomers[existingIdx].status === 'BLOCKED') {
        throw new Error(
          'Your account has been restricted by the administrator and cannot place new orders.'
        );
      }

      const now = new Date().toISOString();
      const nextCustomers = [...existingCustomers];
      let customerAccountId = input.customerAccountId;
      if (existingIdx >= 0) {
        const updatedCustomer: RegisteredCustomer = {
          ...existingCustomers[existingIdx],
          fullName: customerName || existingCustomers[existingIdx].fullName,
          phone: customerPhone || existingCustomers[existingIdx].phone,
          defaultCity: input.customer.city || existingCustomers[existingIdx].defaultCity || 'Jalchak',
          updatedAt: now,
        };
        nextCustomers[existingIdx] = updatedCustomer;
        customerAccountId = updatedCustomer.id;
      } else {
        const createdCustomer: RegisteredCustomer = {
          id: customerAccountId || buildLocalCustomerId(customerEmail || customerPhone),
          fullName: customerName,
          email: customerEmail,
          phone: customerPhone,
          defaultCity: input.customer.city || 'Jalchak',
          status: 'ACTIVE',
          registeredAt: now,
          updatedAt: now,
        };
        nextCustomers.unshift(createdCustomer);
        customerAccountId = createdCustomer.id;
      }
      savePublicLocalCollection('registeredCustomers', nextCustomers, 'customers');

      const existingOrders = getLiveStore().orders;
      const sequence = existingOrders.length + 1;
      const orderNumber = generateLocalOrderNumber(sequence);
      const wrapCharge = input.giftWrap.enabled ? Number(input.giftWrap.chargeInrSnapshot) || 0 : 0;

      const newOrder: DemoOrder = {
        id: `ord-${Date.now()}-${sequence}`,
        orderNumber,
        mode: 'LIVE_ORDER',
        customerAccountId,
        customer: { ...input.customer },
        items: input.items.map((item) => {
          const unitPrice = Number(item.unitPriceInrSnapshot) || 0;
          const qty = Math.max(1, Number(item.quantity) || 1);
          return {
            ...item,
            unitPriceInrSnapshot: unitPrice,
            quantity: qty,
            lineTotalInr: unitPrice * qty,
          };
        }),
        giftWrap: {
          ...input.giftWrap,
          chargeInrSnapshot: wrapCharge,
        },
        subtotalInr: Number(input.subtotalInr) || 0,
        giftWrapChargeInr: wrapCharge,
        discountInr: Number(input.discountInr) || 0,
        deliveryChargeInr: Number(input.deliveryChargeInr) || 0,
        grandTotalInr: Number(input.grandTotalInr) || 0,
        couponCode: input.couponCode,
        paymentMethod: input.paymentMethod || 'Cash on Delivery (COD)',
        paymentStatus: input.paymentStatus ?? 'PENDING',
        paymentReference: `TXN-${orderNumber.replace(/[^A-Z0-9]/g, '')}`,
        paymentGatewayStatus: 'CASHFREE_NOT_CONNECTED',
        fulfillmentStatus: 'New',
        statusHistory: [
          {
            status: 'New',
            timestamp: now,
            note: 'Order received and awaiting store review.',
            updatedBy: 'System',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      savePublicLocalCollection('orders', [newOrder, ...existingOrders], 'orders');
      return newOrder;
    }
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
    try {
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
    } catch (err) {
      if (!isBackendUnavailableError(err)) {
        throw err;
      }

      await ensureServerHydrated();
      const existing = getLiveStore().orders;
      const idx = existing.findIndex((o) => o.id === orderId);
      if (idx < 0) {
        throw new Error('Order not found.');
      }
      const target = existing[idx];
      if (target.customerAccountId && target.customerAccountId !== currentCustomer?.id) {
        throw new Error('You do not have permission to cancel this order.');
      }
      if (target.fulfillmentStatus !== 'New' && target.fulfillmentStatus !== 'Demo Placed') {
        throw new Error('Order cannot be cancelled once processing has started.');
      }

      const now = new Date().toISOString();
      const updated: DemoOrder = {
        ...target,
        fulfillmentStatus: 'Cancelled',
        statusHistory: [
          ...target.statusHistory,
          {
            status: 'Cancelled',
            timestamp: now,
            note: reason?.trim() || 'Cancelled by customer.',
            updatedBy: 'Customer',
          },
        ],
        updatedAt: now,
      };
      const next = [...existing];
      next[idx] = updated;
      savePublicLocalCollection('orders', next, 'orders');
      return updated;
    }
  }
}
