import type {
  IOrderService,
  OrderPaymentUpdateResult,
  OrderStatusUpdateResult,
} from '../interfaces';
import type {
  AdminDemoSession,
  ConfirmOrderPaymentInput,
  CreateDemoOrderInput,
  CustomerDemoAccount,
  DemoOrder,
  OrderFulfillmentStatus,
  OrderNotificationRecord,
  OrderPaymentHistoryEntry,
  OrderShippingDetails,
  OrderStatusHistoryEntry,
  PaymentRecordStatus,
  RegisteredCustomer,
  UpdateOrderStatusInput,
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
import {
  buildShippingMetadataSummary,
  getAutoNotificationMessage,
  getPaymentConfirmedNotificationMessage,
  getStatusDisplayLabel,
  mapCanonicalPaymentToLegacyRecord,
  normalizeOrderStatus,
  normalizePaymentStatus,
} from '../../utils/orderLifecycle';

function generateLocalOrderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `GK-${year}-${String(sequence).padStart(4, '0')}`;
}

function buildLocalCustomerId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `GK-CUST-${clean.slice(0, 12).toUpperCase() || Date.now().toString(36).toUpperCase()}`;
}

function getCurrentLocalAdminMeta(): { name: string; email: string } {
  const session = readStorage<AdminDemoSession | null>(STORAGE_KEYS.ADMIN_DEMO_SESSION, null);
  return {
    name: session?.displayName || 'GiftKart Admin',
    email: session?.email || 'admin.giftkart@gmail.com',
  };
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

  async getOrdersByCustomerAccount(
    customerAccountId?: string,
    email?: string
  ): Promise<DemoOrder[]> {
    const cleanId = (customerAccountId || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanId && !cleanEmail) return [];

    const query = new URLSearchParams();
    if (cleanId) query.set('accountId', cleanId);
    if (cleanEmail) query.set('email', cleanEmail);

    try {
      const res = await apiRequest<{ orders: DemoOrder[] }>(
        `/api/public/orders/customer?${query.toString()}`
      );
      return Array.isArray(res.orders) ? res.orders : [];
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        await ensureServerHydrated();
        return getLiveStore()
          .orders.filter(
            (o) =>
              (cleanId && o.customerAccountId === cleanId) ||
              (cleanEmail && o.customer?.email?.trim().toLowerCase() === cleanEmail)
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
      throw err;
    }
  }

  async getCustomerOrderNotifications(
    customerAccountId?: string,
    email?: string
  ): Promise<OrderNotificationRecord[]> {
    const cleanId = (customerAccountId || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanId && !cleanEmail) return [];

    const query = new URLSearchParams();
    if (cleanId) query.set('accountId', cleanId);
    if (cleanEmail) query.set('email', cleanEmail);

    try {
      const res = await apiRequest<{ notifications: OrderNotificationRecord[] }>(
        `/api/public/notifications/customer?${query.toString()}`
      );
      return Array.isArray(res.notifications) ? res.notifications : [];
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        await ensureServerHydrated();
        const result: OrderNotificationRecord[] = [];
        for (const order of getLiveStore().orders) {
          const matches =
            (cleanId && order.customerAccountId === cleanId) ||
            (cleanEmail && order.customer?.email?.trim().toLowerCase() === cleanEmail);
          if (!matches) continue;
          if (Array.isArray(order.notifications)) {
            result.push(...order.notifications);
          }
        }
        return result.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
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
      const orderId = `ord-${Date.now()}-${sequence}`;
      const isPrepaidPaid =
        input.paymentStatus === 'PAID' ||
        input.paymentStatus === 'Paid' ||
        input.paymentStatus === 'SUCCESS';
      const canonicalPay = isPrepaidPaid ? 'Paid' : 'Unpaid';

      const initialNotif: OrderNotificationRecord = {
        id: `notif-${Date.now()}-${sequence}`,
        orderId,
        orderNumber,
        customerAccountId,
        customerEmail,
        eventKey: 'STATUS:New Order',
        status: 'New Order',
        title: `Order ${orderNumber} • New Order`,
        message: getAutoNotificationMessage('New Order'),
        sentAt: now,
        deliveryStatus: 'DELIVERED_TO_APP',
        triggeredBy: 'System',
      };

      const newOrder: DemoOrder = {
        id: orderId,
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
        paymentStatus: mapCanonicalPaymentToLegacyRecord(canonicalPay),
        paymentReference: `TXN-${orderNumber.replace(/[^A-Z0-9]/g, '')}`,
        paymentGatewayStatus: 'CASHFREE_NOT_CONNECTED',
        fulfillmentStatus: 'New Order',
        shippingDetails: {},
        paymentDetails: {
          status: canonicalPay,
          collectedAmountInr: isPrepaidPaid ? Number(input.grandTotalInr) || 0 : 0,
          collectionDate: isPrepaidPaid ? now : undefined,
          confirmedAt: isPrepaidPaid ? now : undefined,
          note: isPrepaidPaid
            ? 'Prepaid at checkout.'
            : 'Awaiting Cash on Delivery payment collection.',
        },
        paymentHistory: isPrepaidPaid
          ? [
              {
                id: `pay-${Date.now()}-1`,
                status: 'Paid',
                amountInr: Number(input.grandTotalInr) || 0,
                timestamp: now,
                collectionDate: now,
                note: 'Prepaid at checkout.',
              },
            ]
          : [],
        notifications: [initialNotif],
        statusHistory: [
          {
            id: `hist-${Date.now()}-1`,
            type: 'ORDER_CREATED',
            status: 'New Order',
            timestamp: now,
            note: 'Order placed by customer and received at GiftKart.',
            updatedBy: 'System',
          },
          {
            id: `hist-${Date.now()}-2`,
            type: 'NOTIFICATION_SENT',
            status: 'New Order',
            timestamp: now,
            note: initialNotif.message,
            updatedBy: 'System',
            metadataSummary: 'Automatic customer notification delivered to GiftKart App',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      savePublicLocalCollection('orders', [newOrder, ...existingOrders], 'orders');
      return newOrder;
    }
  }

  async updateOrderStatusDetailed(
    orderId: string,
    input: UpdateOrderStatusInput
  ): Promise<OrderStatusUpdateResult> {
    if (!getAdminBearerToken()) {
      throw new Error('Admin sign-in required.');
    }
    const canonicalStatus = normalizeOrderStatus(input.status);
    try {
      const res = await apiRequest<OrderStatusUpdateResult>(
        `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: 'POST',
          requireAdmin: true,
          body: {
            ...input,
            status: canonicalStatus,
          },
        }
      );
      await refreshStoreFromServer(['orders', 'activity']);
      return res;
    } catch (err) {
      if (!isBackendUnavailableError(err)) {
        throw err;
      }

      const existing = await this.readAdminOrders();
      const index = existing.findIndex((o) => o.id === orderId);
      if (index < 0) {
        throw new Error(`Order not found: ${orderId}`);
      }
      const target = existing[index];
      const admin = getCurrentLocalAdminMeta();
      const now = new Date().toISOString();
      const effectiveTimestamp =
        input.updateDateTime && !Number.isNaN(Date.parse(input.updateDateTime))
          ? new Date(input.updateDateTime).toISOString()
          : now;
      const customerNote = input.customerNote?.trim() || '';

      const mergedShipping: OrderShippingDetails = {
        ...(target.shippingDetails || {}),
      };
      if (input.shippingDetails) {
        for (const [k, v] of Object.entries(input.shippingDetails)) {
          if (typeof v === 'string' && v.trim()) {
            (mergedShipping as Record<string, string>)[k] = v.trim();
          }
        }
      }

      const metadataSummary = buildShippingMetadataSummary(canonicalStatus, mergedShipping);
      const existingNotifications = Array.isArray(target.notifications) ? target.notifications : [];
      const eventKey = `STATUS:${canonicalStatus}`;
      const alreadySent = existingNotifications.some((n) => n.eventKey === eventKey);
      const displayLabel = getStatusDisplayLabel(canonicalStatus);

      const newNotification: OrderNotificationRecord | null = alreadySent
        ? null
        : {
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            orderId: target.id,
            orderNumber: target.orderNumber,
            customerAccountId: target.customerAccountId,
            customerEmail: target.customer?.email?.trim().toLowerCase(),
            eventKey,
            status: canonicalStatus,
            title: `Order ${target.orderNumber} • ${displayLabel}`,
            message: getAutoNotificationMessage(canonicalStatus),
            sentAt: now,
            deliveryStatus: 'DELIVERED_TO_APP',
            triggeredBy: 'Admin',
            adminName: admin.name,
            customerNote: customerNote || undefined,
          };

      const nextHistory: OrderStatusHistoryEntry[] = [
        ...target.statusHistory,
        {
          id: `hist-${Date.now()}-st`,
          type: 'STATUS_UPDATE',
          status: canonicalStatus,
          timestamp: effectiveTimestamp,
          note: customerNote || `Order status updated to ${displayLabel}.`,
          updatedBy: 'Admin',
          adminName: admin.name,
          adminEmail: admin.email,
          metadataSummary,
        },
        ...(newNotification
          ? [
              {
                id: `hist-${Date.now()}-nf`,
                type: 'NOTIFICATION_SENT' as const,
                status: canonicalStatus,
                timestamp: now,
                note: newNotification.message,
                updatedBy: 'System' as const,
                adminName: admin.name,
                metadataSummary: 'Automatic customer notification sent to GiftKart App',
              },
            ]
          : []),
      ];

      const updated: DemoOrder = {
        ...target,
        fulfillmentStatus: canonicalStatus,
        shippingDetails: mergedShipping,
        notifications: newNotification
          ? [newNotification, ...existingNotifications]
          : existingNotifications,
        statusHistory: nextHistory,
        updatedAt: now,
      };

      const nextAll = [...existing];
      nextAll[index] = updated;
      await saveAdminCollection('orders', nextAll, 'orders');

      return {
        order: updated,
        notificationSent: Boolean(newNotification),
        duplicateSkipped: alreadySent,
        notification: newNotification,
      };
    }
  }

  async updateOrderStatus(
    orderId: string,
    nextStatus: OrderFulfillmentStatus,
    note?: string
  ): Promise<DemoOrder> {
    const res = await this.updateOrderStatusDetailed(orderId, {
      status: normalizeOrderStatus(nextStatus),
      customerNote: note,
    });
    return res.order;
  }

  async confirmOrderPayment(
    orderId: string,
    input: ConfirmOrderPaymentInput
  ): Promise<OrderPaymentUpdateResult> {
    if (!getAdminBearerToken()) {
      throw new Error('Admin sign-in required.');
    }
    try {
      const res = await apiRequest<OrderPaymentUpdateResult>(
        `/api/admin/orders/${encodeURIComponent(orderId)}/payment`,
        {
          method: 'POST',
          requireAdmin: true,
          body: input,
        }
      );
      await refreshStoreFromServer(['orders', 'activity']);
      return res;
    } catch (err) {
      if (!isBackendUnavailableError(err)) {
        throw err;
      }

      const existing = await this.readAdminOrders();
      const index = existing.findIndex((o) => o.id === orderId);
      if (index < 0) {
        throw new Error(`Order not found: ${orderId}`);
      }
      const target = existing[index];
      const currentCanonical = normalizePaymentStatus(target);

      if (currentCanonical === 'Paid' && input.status === 'Paid') {
        throw new Error(
          'Payment has already been confirmed as Paid for this order. Duplicate confirmation is blocked.'
        );
      }

      const admin = getCurrentLocalAdminMeta();
      const now = new Date().toISOString();
      const collectedAmount =
        input.collectedAmountInr !== undefined
          ? Math.max(0, Number(input.collectedAmountInr) || 0)
          : input.status === 'Unpaid'
          ? 0
          : target.grandTotalInr;
      const collectionDate =
        input.collectionDate && !Number.isNaN(Date.parse(input.collectionDate))
          ? new Date(input.collectionDate).toISOString()
          : input.status === 'Unpaid'
          ? undefined
          : now;
      const note = input.note?.trim();

      const historyEntry: OrderPaymentHistoryEntry = {
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: input.status,
        amountInr: collectedAmount,
        timestamp: now,
        collectionDate,
        adminName: admin.name,
        adminEmail: admin.email,
        note:
          note ||
          (input.status === 'Paid'
            ? `COD payment of ₹${Math.round(collectedAmount).toLocaleString('en-IN')} confirmed by ${admin.name}.`
            : `Payment status updated to ${input.status}.`),
      };

      const existingNotifications = Array.isArray(target.notifications) ? target.notifications : [];
      const paidEventKey = 'PAYMENT:Paid';
      const alreadyNotified = existingNotifications.some((n) => n.eventKey === paidEventKey);

      const paidNotification: OrderNotificationRecord | null =
        input.status === 'Paid' && !alreadyNotified
          ? {
              id: `notif-${Date.now()}-pay`,
              orderId: target.id,
              orderNumber: target.orderNumber,
              customerAccountId: target.customerAccountId,
              customerEmail: target.customer?.email?.trim().toLowerCase(),
              eventKey: paidEventKey,
              status: 'Payment Confirmed',
              title: `Order ${target.orderNumber} • Payment Successful`,
              message: getPaymentConfirmedNotificationMessage(target.orderNumber, collectedAmount),
              sentAt: now,
              deliveryStatus: 'DELIVERED_TO_APP',
              triggeredBy: 'Admin',
              adminName: admin.name,
            }
          : null;

      const updated: DemoOrder = {
        ...target,
        paymentStatus: mapCanonicalPaymentToLegacyRecord(input.status),
        paymentDetails: {
          status: input.status,
          collectedAmountInr: collectedAmount,
          collectionDate,
          confirmedByAdminName: admin.name,
          confirmedByAdminEmail: admin.email,
          confirmedAt: now,
          note,
        },
        paymentHistory: [historyEntry, ...(target.paymentHistory || [])],
        notifications: paidNotification
          ? [paidNotification, ...existingNotifications]
          : existingNotifications,
        statusHistory: [
          ...target.statusHistory,
          {
            id: `hist-${Date.now()}-pay`,
            type: 'PAYMENT_UPDATE',
            status: target.fulfillmentStatus,
            timestamp: now,
            note: historyEntry.note,
            updatedBy: 'Admin',
            adminName: admin.name,
            adminEmail: admin.email,
            metadataSummary: `Payment: ${input.status} • Collected ₹${Math.round(collectedAmount).toLocaleString('en-IN')}`,
          },
          ...(paidNotification
            ? [
                {
                  id: `hist-${Date.now()}-pay-nf`,
                  type: 'NOTIFICATION_SENT' as const,
                  status: target.fulfillmentStatus,
                  timestamp: now,
                  note: paidNotification.message,
                  updatedBy: 'System' as const,
                  adminName: admin.name,
                  metadataSummary: 'Automatic payment confirmation sent to Customer App',
                },
              ]
            : []),
        ],
        updatedAt: now,
      };

      const nextAll = [...existing];
      nextAll[index] = updated;
      await saveAdminCollection('orders', nextAll, 'orders');

      return {
        order: updated,
        notificationSent: Boolean(paidNotification),
      };
    }
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentRecordStatus,
    note?: string
  ): Promise<DemoOrder> {
    const canonical = normalizePaymentStatus(paymentStatus);
    const res = await this.confirmOrderPayment(orderId, {
      status: canonical,
      note,
    });
    return res.order;
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
      const normalized = normalizeOrderStatus(target.fulfillmentStatus);
      if (normalized !== 'New Order') {
        throw new Error('Order cannot be cancelled once processing has started.');
      }

      const now = new Date().toISOString();
      const existingNotifications = Array.isArray(target.notifications) ? target.notifications : [];
      const hasCancelNotif = existingNotifications.some((n) => n.eventKey === 'STATUS:Cancelled');
      const cancelNotif: OrderNotificationRecord | null = hasCancelNotif
        ? null
        : {
            id: `notif-${Date.now()}-cancel`,
            orderId: target.id,
            orderNumber: target.orderNumber,
            customerAccountId: target.customerAccountId,
            customerEmail: target.customer?.email?.trim().toLowerCase(),
            eventKey: 'STATUS:Cancelled',
            status: 'Cancelled',
            title: `Order ${target.orderNumber} • Cancelled`,
            message: getAutoNotificationMessage('Cancelled'),
            sentAt: now,
            deliveryStatus: 'DELIVERED_TO_APP',
            triggeredBy: 'Customer',
            customerNote: reason?.trim() || undefined,
          };

      const updated: DemoOrder = {
        ...target,
        fulfillmentStatus: 'Cancelled',
        notifications: cancelNotif
          ? [cancelNotif, ...existingNotifications]
          : existingNotifications,
        statusHistory: [
          ...target.statusHistory,
          {
            id: `hist-${Date.now()}-cancel`,
            type: 'CUSTOMER_ACTION',
            status: 'Cancelled',
            timestamp: now,
            note: reason?.trim() || 'Cancelled by customer.',
            updatedBy: 'Customer',
          },
          ...(cancelNotif
            ? [
                {
                  id: `hist-${Date.now()}-cancel-nf`,
                  type: 'NOTIFICATION_SENT' as const,
                  status: 'Cancelled' as const,
                  timestamp: now,
                  note: cancelNotif.message,
                  updatedBy: 'System' as const,
                  metadataSummary: 'Automatic customer notification delivered to GiftKart App',
                },
              ]
            : []),
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
