import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
} from 'lucide-react';
import { useOrders } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { formatDateTime, formatInr } from '../../utils/format';
import type { DemoOrder, OrderFulfillmentStatus } from '../../types';
import { AdminEmptyState, AdminToast } from '../../components/admin/AdminSharedUI';

type OrderTab = 'All' | 'New' | 'Processing' | 'Completed' | 'Cancelled';

const ORDER_TABS: OrderTab[] = ['All', 'New', 'Processing', 'Completed', 'Cancelled'];

const UPDATE_STATUS_OPTIONS: OrderFulfillmentStatus[] = [
  'New',
  'Processing',
  'Completed',
  'Cancelled',
];

function normalizeOrderBucket(status: OrderFulfillmentStatus): Exclude<OrderTab, 'All'> {
  if (status === 'New' || status === 'Demo Placed') return 'New';
  if (
    status === 'Processing' ||
    status === 'Confirmed' ||
    status === 'Preparing' ||
    status === 'Out for Delivery'
  ) {
    return 'Processing';
  }
  if (status === 'Completed' || status === 'Delivered') return 'Completed';
  return 'Cancelled';
}

function getStatusPillStyle(status: OrderFulfillmentStatus): string {
  const bucket = normalizeOrderBucket(status);
  switch (bucket) {
    case 'New':
      return 'bg-sky-50 text-sky-700 border border-sky-200';
    case 'Processing':
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
  }
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function AdminOrdersPage() {
  const { data: orders } = useOrders();
  const [activeTab, setActiveTab] = useState<OrderTab>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderFulfillmentStatus>('Processing');
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  const selectedOrder = useMemo<DemoOrder | null>(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const filteredOrders = useMemo(() => {
    if (activeTab === 'All') return orders;
    return orders.filter((o) => normalizeOrderBucket(o.fulfillmentStatus) === activeTab);
  }, [orders, activeTab]);

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  function openOrderDetails(order: DemoOrder) {
    setSelectedOrderId(order.id);
    setNextStatus(normalizeOrderBucket(order.fulfillmentStatus));
    setStatusNote('');
  }

  async function handleUpdateStatus() {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await services.orders.updateOrderStatus(
        selectedOrder.id,
        nextStatus,
        statusNote.trim() || undefined
      );
      await services.adminAuth.logActivity(
        `Updated order ${selectedOrder.orderNumber} to ${nextStatus}`,
        'Orders Management'
      );
      setStatusNote('');
      showNotice(`Order #${selectedOrder.orderNumber} marked as ${nextStatus}.`);
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to update order status.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  // Mobile-First Order Detail View
  if (selectedOrder) {
    const bucket = normalizeOrderBucket(selectedOrder.fulfillmentStatus);
    return (
      <div className="space-y-3">
        <AdminToast
          message={toast?.message ?? null}
          tone={toast?.tone}
          onClose={() => setToast(null)}
        />

        <button
          type="button"
          onClick={() => setSelectedOrderId(null)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-extrabold text-[#6A11CB]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Orders</span>
        </button>

        {/* Order Header Card */}
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.2)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[15px] font-extrabold text-[#1E1035]">
                #{selectedOrder.orderNumber}
              </p>
              <p className="mt-0.5 text-[11.5px] text-[#75648E]">
                Placed {formatDateTime(selectedOrder.createdAt)}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${getStatusPillStyle(
                selectedOrder.fulfillmentStatus
              )}`}
            >
              {bucket}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#F2E9FF] pt-2.5 text-xs">
            <span className="font-semibold text-[#685782]">
              {selectedOrder.paymentMethod || 'Cash on Delivery (COD)'}
            </span>
            <span className="text-[15px] font-extrabold tabular-nums text-[#6A11CB]">
              {formatInr(selectedOrder.grandTotalInr)}
            </span>
          </div>
        </div>

        {/* Update Status Card */}
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.16)]">
          <h3 className="text-[13px] font-extrabold text-[#1E1035]">
            Update Order Status
          </h3>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {UPDATE_STATUS_OPTIONS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setNextStatus(st)}
                className={`h-9 cursor-pointer rounded-xl border text-xs font-bold transition-all ${
                  nextStatus === st
                    ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
                    : 'border-[#E5D5FA] bg-[#FAF6FF] text-[#4A3860]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Optional note for customer timeline..."
            className="mt-2.5 h-9 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleUpdateStatus()}
            className="mt-2.5 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] text-xs font-extrabold text-white shadow-xs disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{saving ? 'Updating...' : 'Save Order Status'}</span>
          </button>
        </div>

        {/* Customer & Delivery Info */}
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.16)]">
          <h3 className="text-[13px] font-extrabold text-[#1E1035]">
            Customer &amp; Delivery
          </h3>
          <div className="mt-2 space-y-1.5 text-xs text-[#4A3860]">
            <p className="flex items-center gap-2 font-bold text-[#1E1035]">
              <User className="h-3.5 w-3.5 text-[#6A11CB]" />
              <span>{selectedOrder.customer.fullName}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-[#6A11CB]" />
              <span>
                {selectedOrder.customer.phone} · {selectedOrder.customer.email}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF4D8D]" />
              <span>
                {selectedOrder.customer.addressLine1}
                {selectedOrder.customer.addressLine2
                  ? `, ${selectedOrder.customer.addressLine2}`
                  : ''}
                , {selectedOrder.customer.city}, {selectedOrder.customer.state} —{' '}
                {selectedOrder.customer.pincode}
              </span>
            </p>
          </div>
        </div>

        {/* Purchased Products */}
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.16)]">
          <h3 className="text-[13px] font-extrabold text-[#1E1035]">
            Purchased Products ({selectedOrder.items.length})
          </h3>
          <div className="mt-2.5 divide-y divide-[#F2E9FF]">
            {selectedOrder.items.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EFE3FF] bg-[#FAF6FF]">
                  {item.imageSnapshot ? (
                    <img
                      src={item.imageSnapshot}
                      alt={item.productNameSnapshot}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-4.5 w-4.5 text-[#9B8AB4]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-[#1E1035]">
                    {item.productNameSnapshot}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#75648E]">
                    Qty {item.quantity} × {formatInr(item.unitPriceInrSnapshot)} ={' '}
                    <strong className="text-[#6A11CB]">
                      {formatInr(item.lineTotalInr)}
                    </strong>
                  </p>
                  {item.personalizationDetails && (
                    <p className="mt-1 rounded-lg bg-[#FAF5FF] px-2 py-1 text-[11px] text-[#594A6B]">
                      Custom: {item.personalizationDetails}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1 border-t border-[#F2E9FF] pt-2.5 text-xs text-[#594A6B]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums">
                {formatInr(selectedOrder.subtotalInr)}
              </span>
            </div>
            {selectedOrder.giftWrapChargeInr > 0 && (
              <div className="flex justify-between">
                <span>Gift Wrap</span>
                <span className="font-semibold tabular-nums">
                  {formatInr(selectedOrder.giftWrapChargeInr)}
                </span>
              </div>
            )}
            {selectedOrder.discountInr > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                <span className="font-semibold tabular-nums">
                  -{formatInr(selectedOrder.discountInr)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="font-semibold tabular-nums">
                {selectedOrder.deliveryChargeInr === 0
                  ? 'Free'
                  : formatInr(selectedOrder.deliveryChargeInr)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#F2E9FF] pt-1.5 text-[13.5px] font-extrabold text-[#1E1035]">
              <span>Grand Total</span>
              <span className="tabular-nums text-[#6A11CB]">
                {formatInr(selectedOrder.grandTotalInr)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {/* Order Filter Tabs (Matches Mockup Screen 7) */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {ORDER_TABS.map((tab) => {
          const active = activeTab === tab;
          const count =
            tab === 'All'
              ? orders.length
              : orders.filter((o) => normalizeOrderBucket(o.fulfillmentStatus) === tab)
                  .length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] text-white shadow-xs'
                  : 'border border-[#E5D5FA] bg-white text-[#4A3860]'
              }`}
            >
              {tab} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <AdminEmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="No orders available."
          description="Real customer orders placed on the GiftKart storefront will appear here automatically."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const bucket = normalizeOrderBucket(order.fulfillmentStatus);
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => openOrderDetails(order)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#EBD8FF]/90 bg-white px-3.5 py-3 text-left shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)] transition-all active:scale-[0.99] hover:border-[#6A11CB]/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFEAF2] text-[#FF4D8D]">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-extrabold text-[#1E1035]">
                      #{order.orderNumber}
                    </p>
                    <p className="truncate text-[11.5px] text-[#75648E]">
                      {formatShortDate(order.createdAt)} · {order.customer.fullName}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[13.5px] font-extrabold tabular-nums text-[#1E1035]">
                    {formatInr(order.grandTotalInr)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${getStatusPillStyle(
                      order.fulfillmentStatus
                    )}`}
                  >
                    {bucket}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
