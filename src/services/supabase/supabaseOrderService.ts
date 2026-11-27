import type {
  IOrderService,
  OrderPaymentUpdateResult,
  OrderStatusUpdateResult,
} from '../interfaces';
import type {
  ConfirmOrderPaymentInput,
  CreateDemoOrderInput,
  DemoOrder,
  OrderFulfillmentStatus,
  OrderNotificationRecord,
  OrderShippingDetails,
  PaymentRecordStatus,
  UpdateOrderStatusInput,
} from '../../types';
import {
  getSupabaseClient,
  isSupabaseSchemaMissingError,
  reportSchemaNotInitializedOnce,
} from '../../lib/supabase';
import { storeEvents } from '../../storage/storeEvents';
import {
  buildShippingMetadataSummary,
  getAutoNotificationMessage,
  getPaymentConfirmedNotificationMessage,
  getStatusDisplayLabel,
  mapCanonicalPaymentToLegacyRecord,
  normalizeOrderStatus,
  normalizePaymentStatus,
} from '../../utils/orderLifecycle';
import { resolveOrderReceipt } from '../../utils/orderReceiptPdf';
import { LocalOrderService } from '../local/localOrderService';
import {
  SCHEMA_MIGRATION_HINT,
  mapOrderNotificationRow,
  mapOrderRow,
} from './supabaseMappers';

const ORDER_WITH_RELATIONS =
  '*, order_items(*), order_status_history(*), order_payments(*), order_notifications(*)';

async function getCurrentAdminActor(): Promise<{ name: string; email: string }> {
  const client = getSupabaseClient();
  const { data } = await client.auth.getUser();
  const user = data.user;
  if (!user) {
    throw new Error('Admin sign-in required.');
  }
  const { data: adminRow } = await client
    .from('admin_users')
    .select('display_name, email')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!adminRow) {
    throw new Error('Only the authorized GiftKart administrator can perform this action.');
  }
  return {
    name: String(adminRow.display_name || 'GiftKart Admin'),
    email: String(adminRow.email || user.email || 'admin.giftkart@gmail.com'),
  };
}

async function logAdminOrderActivity(
  action: string,
  target: string,
  actorEmail: string
): Promise<void> {
  try {
    const client = getSupabaseClient();
    await client.from('admin_activity_logs').insert({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      target,
      actor_email: actorEmail,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Non-blocking audit log
  }
}

export class SupabaseOrderService implements IOrderService {
  private readonly fallback = new LocalOrderService();

  private async fetchOrderById(orderId: string): Promise<DemoOrder | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('orders')
      .select(ORDER_WITH_RELATIONS)
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load order details.');
    }
    return data ? mapOrderRow(data as Record<string, unknown>) : null;
  }

  async listOrders(): Promise<DemoOrder[]> {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      return [];
    }

    const { data, error } = await client
      .from('orders')
      .select(ORDER_WITH_RELATIONS)
      .order('created_at', { ascending: false });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('orders');
        return [];
      }
      throw new Error(error.message || 'Failed to load orders from Supabase.');
    }

    return ((data ?? []) as Record<string, unknown>[]).map((row) => mapOrderRow(row));
  }

  async getOrderByNumber(orderNumber: string): Promise<DemoOrder | null> {
    const normalized = orderNumber.trim().toUpperCase();
    if (!normalized) return null;

    const client = getSupabaseClient();
    const { data, error } = await client.rpc('track_order_by_number', {
      p_order_number: normalized,
    });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('track_order_by_number');
        return this.fallback.getOrderByNumber(normalized);
      }
      throw new Error(error.message || 'Failed to track order.');
    }

    if (!data || typeof data !== 'object') {
      return null;
    }

    const payload = data as {
      order?: Record<string, unknown>;
      items?: Record<string, unknown>[];
      history?: Record<string, unknown>[];
      payments?: Record<string, unknown>[];
      notifications?: Record<string, unknown>[];
    };
    if (!payload.order) return null;

    return mapOrderRow(
      payload.order,
      payload.items ?? [],
      payload.history ?? [],
      payload.payments ?? [],
      payload.notifications ?? []
    );
  }

  async getOrdersByCustomerAccount(
    customerAccountId?: string,
    email?: string
  ): Promise<DemoOrder[]> {
    const cleanId = (customerAccountId || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanId && !cleanEmail) return [];

    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      return [];
    }

    const { data, error } = await client
      .from('orders')
      .select(ORDER_WITH_RELATIONS)
      .order('created_at', { ascending: false });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('orders');
        return [];
      }
      throw new Error(error.message || 'Failed to load customer orders.');
    }

    const orders = ((data ?? []) as Record<string, unknown>[]).map((row) => mapOrderRow(row));
    return orders.filter(
      (o) =>
        (cleanId && o.customerAccountId === cleanId) ||
        (cleanEmail && o.customer.email.trim().toLowerCase() === cleanEmail)
    );
  }

  async getCustomerOrderNotifications(
    customerAccountId?: string,
    email?: string
  ): Promise<OrderNotificationRecord[]> {
    const cleanId = (customerAccountId || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanId && !cleanEmail) return [];

    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      return [];
    }

    const { data, error } = await client
      .from('order_notifications')
      .select('*')
      .order('sent_at', { ascending: false });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('order_notifications');
        return [];
      }
      throw new Error(error.message || 'Failed to load order notifications.');
    }

    return ((data ?? []) as Record<string, unknown>[])
      .map(mapOrderNotificationRow)
      .filter(
        (n) =>
          (cleanId && n.customerAccountId === cleanId) ||
          (cleanEmail && (n.customerEmail || '').trim().toLowerCase() === cleanEmail)
      );
  }

  async createDemoOrder(input: CreateDemoOrderInput): Promise<DemoOrder> {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('place_giftkart_order', {
      payload: input,
    });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Unable to place your order. Please try again.');
    }

    const result = (data ?? {}) as { id?: string; orderNumber?: string };
    const orderNumber = String(result.orderNumber ?? '');
    const hydrated = orderNumber ? await this.getOrderByNumber(orderNumber) : null;
    if (!hydrated) {
      throw new Error('Order was placed, but failed to load order confirmation.');
    }

    storeEvents.emit('orders');
    storeEvents.emit('catalog');
    return hydrated;
  }

  async updateOrderStatusDetailed(
    orderId: string,
    input: UpdateOrderStatusInput
  ): Promise<OrderStatusUpdateResult> {
    const admin = await getCurrentAdminActor();
    const client = getSupabaseClient();
    const target = await this.fetchOrderById(orderId);
    if (!target) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const canonicalStatus = normalizeOrderStatus(input.status);
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
    if (canonicalStatus === 'Delivered' && !mergedShipping.deliveredAt) {
      mergedShipping.deliveredAt = effectiveTimestamp;
    }

    const metadataSummary = buildShippingMetadataSummary(canonicalStatus, mergedShipping);
    const existingNotifications = Array.isArray(target.notifications)
      ? target.notifications
      : [];
    const eventKey = `STATUS:${canonicalStatus}`;
    const alreadySent = existingNotifications.some((n) => n.eventKey === eventKey);
    const displayLabel = getStatusDisplayLabel(canonicalStatus);

    const updatedPreview: DemoOrder = {
      ...target,
      fulfillmentStatus: canonicalStatus,
      shippingDetails: mergedShipping,
      updatedAt: now,
    };
    const nextReceipt =
      canonicalStatus === 'Delivered'
        ? resolveOrderReceipt(updatedPreview)
        : target.receipt ?? null;

    const { error: updateErr } = await client
      .from('orders')
      .update({
        fulfillment_status: canonicalStatus,
        shipping_details: mergedShipping,
        receipt: nextReceipt,
        updated_at: now,
      })
      .eq('id', orderId);

    if (updateErr) {
      if (isSupabaseSchemaMissingError(updateErr)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(updateErr.message || 'Failed to update order status.');
    }

    let newNotification: OrderNotificationRecord | null = null;
    if (!alreadySent) {
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const notifPayload = {
        id: notifId,
        order_id: target.id,
        order_number: target.orderNumber,
        customer_id: target.customerAccountId ?? null,
        customer_email: target.customer.email.trim().toLowerCase(),
        event_key: eventKey,
        status: canonicalStatus,
        title: `Order ${target.orderNumber} • ${displayLabel}`,
        message: getAutoNotificationMessage(canonicalStatus),
        delivery_status: 'DELIVERED_TO_APP',
        triggered_by: 'Admin',
        admin_name: admin.name,
        customer_note: customerNote || null,
        sent_at: now,
      };
      const { error: notifErr } = await client
        .from('order_notifications')
        .upsert(notifPayload, { onConflict: 'order_id,event_key', ignoreDuplicates: true });
      if (!notifErr) {
        newNotification = mapOrderNotificationRow(notifPayload);
      }
    }

    const historyRows = [
      {
        id: `hist-${Date.now()}-st-${Math.random().toString(36).slice(2, 5)}`,
        order_id: target.id,
        event_type: 'STATUS_UPDATE',
        status: canonicalStatus,
        note: customerNote || `Order status updated to ${displayLabel}.`,
        updated_by: 'Admin',
        admin_name: admin.name,
        admin_email: admin.email,
        metadata_summary: metadataSummary ?? null,
        timestamp: effectiveTimestamp,
      },
      ...(newNotification
        ? [
            {
              id: `hist-${Date.now()}-nf-${Math.random().toString(36).slice(2, 5)}`,
              order_id: target.id,
              event_type: 'NOTIFICATION_SENT',
              status: canonicalStatus,
              note: newNotification.message,
              updated_by: 'System',
              admin_name: admin.name,
              admin_email: null,
              metadata_summary: 'Automatic customer notification sent to GiftKart',
              timestamp: now,
            },
          ]
        : []),
    ];

    await client.from('order_status_history').insert(historyRows);
    await logAdminOrderActivity(
      `Updated Order Status → ${displayLabel}`,
      target.orderNumber,
      admin.email
    );

    const hydrated = (await this.fetchOrderById(orderId)) ?? updatedPreview;
    storeEvents.emit('orders');
    storeEvents.emit('activity');

    return {
      order: hydrated,
      notificationSent: Boolean(newNotification),
      duplicateSkipped: alreadySent,
      notification: newNotification,
    };
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
    const admin = await getCurrentAdminActor();
    const client = getSupabaseClient();
    const target = await this.fetchOrderById(orderId);
    if (!target) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const currentCanonical = normalizePaymentStatus(target);
    if (currentCanonical === 'Paid' && input.status === 'Paid') {
      throw new Error(
        'Payment has already been confirmed as Paid for this order. Duplicate confirmation is blocked.'
      );
    }

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
    const note =
      input.note?.trim() ||
      (input.status === 'Paid'
        ? `COD payment of ₹${Math.round(collectedAmount).toLocaleString('en-IN')} confirmed by ${admin.name}.`
        : `Payment status updated to ${input.status}.`);

    const nextPaymentDetails = {
      status: input.status,
      collectedAmountInr: collectedAmount,
      collectionDate,
      confirmedByAdminName: admin.name,
      confirmedByAdminEmail: admin.email,
      confirmedAt: now,
      note,
    };
    const legacyPayStatus = mapCanonicalPaymentToLegacyRecord(input.status);
    const updatedPreview: DemoOrder = {
      ...target,
      paymentStatus: legacyPayStatus,
      paymentDetails: nextPaymentDetails,
      updatedAt: now,
    };
    const nextReceipt =
      target.receipt || normalizeOrderStatus(target.fulfillmentStatus) === 'Delivered'
        ? resolveOrderReceipt(updatedPreview)
        : null;

    const { error: updateErr } = await client
      .from('orders')
      .update({
        payment_status: legacyPayStatus,
        payment_details: nextPaymentDetails,
        receipt: nextReceipt,
        updated_at: now,
      })
      .eq('id', orderId);

    if (updateErr) {
      if (isSupabaseSchemaMissingError(updateErr)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(updateErr.message || 'Failed to confirm order payment.');
    }

    await client.from('order_payments').insert({
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      order_id: target.id,
      status: input.status,
      amount_inr: collectedAmount,
      collection_date: collectionDate ?? null,
      admin_name: admin.name,
      admin_email: admin.email,
      note,
      timestamp: now,
    });

    const existingNotifications = Array.isArray(target.notifications)
      ? target.notifications
      : [];
    const paidEventKey = 'PAYMENT:Paid';
    const alreadyNotified = existingNotifications.some((n) => n.eventKey === paidEventKey);
    let paidNotificationSent = false;

    if (input.status === 'Paid' && !alreadyNotified) {
      const { error: notifErr } = await client.from('order_notifications').upsert(
        {
          id: `notif-${Date.now()}-pay`,
          order_id: target.id,
          order_number: target.orderNumber,
          customer_id: target.customerAccountId ?? null,
          customer_email: target.customer.email.trim().toLowerCase(),
          event_key: paidEventKey,
          status: 'Payment Confirmed',
          title: `Order ${target.orderNumber} • Payment Successful`,
          message: getPaymentConfirmedNotificationMessage(
            target.orderNumber,
            collectedAmount
          ),
          delivery_status: 'DELIVERED_TO_APP',
          triggered_by: 'Admin',
          admin_name: admin.name,
          sent_at: now,
        },
        { onConflict: 'order_id,event_key', ignoreDuplicates: true }
      );
      paidNotificationSent = !notifErr;
    }

    await client.from('order_status_history').insert([
      {
        id: `hist-${Date.now()}-pay`,
        order_id: target.id,
        event_type: 'PAYMENT_UPDATE',
        status: target.fulfillmentStatus,
        note,
        updated_by: 'Admin',
        admin_name: admin.name,
        admin_email: admin.email,
        metadata_summary: `Payment: ${input.status} • Collected ₹${Math.round(collectedAmount).toLocaleString('en-IN')}`,
        timestamp: now,
      },
      ...(paidNotificationSent
        ? [
            {
              id: `hist-${Date.now()}-pay-nf`,
              order_id: target.id,
              event_type: 'NOTIFICATION_SENT',
              status: target.fulfillmentStatus,
              note: getPaymentConfirmedNotificationMessage(
                target.orderNumber,
                collectedAmount
              ),
              updated_by: 'System',
              admin_name: admin.name,
              admin_email: null,
              metadata_summary: 'Automatic payment confirmation sent to Customer',
              timestamp: now,
            },
          ]
        : []),
    ]);

    await logAdminOrderActivity(
      `Payment Updated → ${input.status}`,
      target.orderNumber,
      admin.email
    );

    const hydrated = (await this.fetchOrderById(orderId)) ?? updatedPreview;
    storeEvents.emit('orders');
    storeEvents.emit('activity');

    return {
      order: hydrated,
      notificationSent: paidNotificationSent,
    };
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
    const client = getSupabaseClient();
    const { error } = await client.rpc('cancel_my_order', {
      p_order_id: orderId,
      p_reason: reason?.trim() || null,
    });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Unable to cancel this order.');
    }

    const hydrated = await this.fetchOrderById(orderId);
    if (!hydrated) {
      throw new Error('Order cancelled, but updated details could not be loaded.');
    }

    storeEvents.emit('orders');
    return hydrated;
  }
}
