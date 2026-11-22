import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Gift,
  MapPin,
  Plug,
  Plus,
  RefreshCw,
  ShieldAlert,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import {
  useCategories,
  useCoupons,
  useOrders,
  useProducts,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { resetAllDemoSeedData } from '../../data/seedData';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, formatInr } from '../../utils/format';
import type {
  Coupon,
  CouponDiscountType,
  DeliveryZone,
  DemoOrder,
  OrderFulfillmentStatus,
} from '../../types';
import { Button } from '../../components/ui/Button';

const FULFILLMENT_STATUSES: OrderFulfillmentStatus[] = [
  'Demo Placed',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

/* ============================================================================
 * 1. ADMIN DEMO ORDERS & TIMESTAMPED STATUS HISTORY
 * ========================================================================== */
export function AdminOrdersPage() {
  const { data: orders } = useOrders();
  const { pushToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [nextStatus, setNextStatus] = useState<OrderFulfillmentStatus>('Confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => o.fulfillmentStatus === statusFilter);
  }, [orders, statusFilter]);

  const selectedOrder: DemoOrder | undefined = useMemo(() => {
    return (
      filteredOrders.find((o) => o.id === selectedOrderId) ??
      filteredOrders[0]
    );
  }, [filteredOrders, selectedOrderId]);

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await services.orders.updateOrderStatus(
        selectedOrder.id,
        nextStatus,
        statusNote.trim() || undefined
      );
      setStatusNote('');
      pushToast({
        title: `Order ${selectedOrder.orderNumber} updated`,
        description: `Status recorded as "${nextStatus}" in timestamped history.`,
        variant: 'success',
      });
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
            Demo Orders &amp; Status History
          </h1>
          <p className="text-xs text-[#5F4B78]">
            Inspect immutable product, SKU, price, and gift-wrapping snapshots. Every status change logs a timestamped history entry.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2 text-xs font-semibold text-[#4A3862] focus:border-[#6A11CB] focus:outline-none"
        >
          <option value="ALL">All Statuses ({orders.length})</option>
          {FULFILLMENT_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Orders List */}
        <div className="space-y-3 lg:col-span-5">
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-[#EBD8FF] bg-white p-6 text-center text-xs text-[#5F4B78]">
              No demo orders match the selected status filter.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const active = selectedOrder?.id === order.id;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setNextStatus(order.fulfillmentStatus);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? 'border-[#6A11CB] bg-[#F8F2FF] shadow-sm'
                      : 'border-[#EBD8FF] bg-white hover:bg-[#FAF6FF]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[#6A11CB]">
                      {order.orderNumber}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#FF4D8D] ring-1 ring-[#EBD8FF]">
                      {order.fulfillmentStatus}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[#2A0E4D]">
                    {order.customer.fullName}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-xs text-[#5F4B78]">
                    <span>
                      {order.customer.deliveryZoneNameSnapshot} · {order.items.length} item(s)
                    </span>
                    <span className="font-mono font-bold text-[#2A0E4D]">
                      {formatInr(order.grandTotalInr)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Selected Order Snapshot & History */}
        <div className="lg:col-span-7">
          {!selectedOrder ? (
            <div className="rounded-2xl border border-[#EBD8FF] bg-white p-8 text-center text-sm text-[#5F4B78]">
              Select a demo order to inspect its immutable snapshot and status history.
            </div>
          ) : (
            <div className="rounded-2xl border border-[#EBD8FF] bg-white p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F0E4FF] pb-4">
                <div>
                  <span className="rounded-full bg-[#FFF0F6] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FF4D8D]">
                    Demo Order · Cashfree Not Connected
                  </span>
                  <h2 className="mt-1.5 font-mono text-xl font-bold text-[#2A0E4D]">
                    {selectedOrder.orderNumber}
                  </h2>
                  <p className="text-xs text-[#5F4B78]">
                    Placed {formatDateTime(selectedOrder.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#7B6496]">Grand Total</p>
                  <p className="font-mono text-xl font-bold text-[#6A11CB]">
                    {formatInr(selectedOrder.grandTotalInr)}
                  </p>
                </div>
              </div>

              {/* Customer & Delivery Address */}
              <div className="grid gap-4 rounded-2xl bg-[#FAF6FF] p-4 text-xs sm:grid-cols-2">
                <div>
                  <p className="font-bold uppercase tracking-wider text-[#8C75A8]">Customer</p>
                  <p className="mt-1 font-semibold text-[#2A0E4D]">
                    {selectedOrder.customer.fullName}
                  </p>
                  <p className="text-[#5F4B78]">{selectedOrder.customer.phone}</p>
                  <p className="text-[#5F4B78]">{selectedOrder.customer.email}</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-[#8C75A8]">
                    Delivery Zone &amp; Address
                  </p>
                  <p className="mt-1 font-semibold text-[#6A11CB]">
                    {selectedOrder.customer.deliveryZoneNameSnapshot} ({selectedOrder.customer.state})
                  </p>
                  <p className="text-[#5F4B78]">{selectedOrder.customer.addressLine1}</p>
                  <p className="text-[#5F4B78]">
                    {selectedOrder.customer.city} — {selectedOrder.customer.pincode}
                  </p>
                </div>
              </div>

              {/* Frozen Item Snapshots */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C75A8]">
                  Frozen Product Snapshots ({selectedOrder.items.length})
                </h3>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={`${item.productSkuSnapshot}-${idx}`}
                      className="rounded-xl border border-[#F0E4FF] p-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#2A0E4D]">
                            {item.productNameSnapshot}
                          </p>
                          <p className="font-mono text-[11px] text-[#7B6496]">
                            SKU: {item.productSkuSnapshot} · {formatInr(item.unitPriceInrSnapshot)} ×{' '}
                            {item.quantity}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-[#2A0E4D]">
                          {formatInr(item.lineTotalInr)}
                        </span>
                      </div>
                      {Object.keys(item.selectedVariants).length > 0 && (
                        <p className="mt-1 text-[#5F4B78]">
                          Variants:{' '}
                          {Object.entries(item.selectedVariants)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}
                      {item.personalizationDetails && (
                        <p className="mt-1 font-medium text-[#6A11CB]">
                          Personalization: {item.personalizationDetails}
                        </p>
                      )}
                      {item.customPhotoFileName && (
                        <p className="mt-0.5 text-[#FF4D8D]">
                          Custom Photo (Client Preview): {item.customPhotoFileName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gift Wrapping Snapshot + Totals */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#EBD8FF] bg-[#FFF8FB] p-3.5 text-xs">
                  <p className="flex items-center gap-1.5 font-bold text-[#6A11CB]">
                    <Gift className="h-3.5 w-3.5 text-[#FF4D8D]" />
                    <span>Gift Wrapping Snapshot</span>
                  </p>
                  {selectedOrder.giftWrap.enabled ? (
                    <div className="mt-2 space-y-1 text-[#5F4B78]">
                      <p>
                        Style:{' '}
                        <strong className="text-[#2A0E4D]">
                          {selectedOrder.giftWrap.styleNameSnapshot}
                        </strong>{' '}
                        ({formatInr(selectedOrder.giftWrap.chargeInrSnapshot)})
                      </p>
                      {selectedOrder.giftWrap.recipientName && (
                        <p>Recipient: {selectedOrder.giftWrap.recipientName}</p>
                      )}
                      {selectedOrder.giftWrap.giftMessage && (
                        <p className="italic">&ldquo;{selectedOrder.giftWrap.giftMessage}&rdquo;</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[#7B6496]">No gift wrapping selected.</p>
                  )}
                </div>

                <div className="rounded-xl border border-[#EBD8FF] bg-[#FAF6FF] p-3.5 text-xs space-y-1">
                  <div className="flex justify-between text-[#5F4B78]">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatInr(selectedOrder.subtotalInr)}</span>
                  </div>
                  <div className="flex justify-between text-[#5F4B78]">
                    <span>Gift Wrapping</span>
                    <span className="font-mono">{formatInr(selectedOrder.giftWrapChargeInr)}</span>
                  </div>
                  <div className="flex justify-between text-[#5F4B78]">
                    <span>Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                    <span className="font-mono text-[#FF4D8D]">
                      -{formatInr(selectedOrder.discountInr)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5F4B78]">
                    <span>Delivery</span>
                    <span className="font-mono">{formatInr(selectedOrder.deliveryChargeInr)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#EBD8FF] pt-1.5 font-bold text-[#2A0E4D]">
                    <span>Grand Total</span>
                    <span className="font-mono text-[#6A11CB]">
                      {formatInr(selectedOrder.grandTotalInr)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Form */}
              <form
                onSubmit={(e) => void handleStatusUpdate(e)}
                className="rounded-2xl border border-[#6A11CB]/20 bg-[#FAF6FF] p-4 space-y-3"
              >
                <p className="text-xs font-bold text-[#2A0E4D]">Update Fulfillment Status</p>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value as OrderFulfillmentStatus)}
                    className="rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs font-semibold text-[#2A0E4D] focus:border-[#6A11CB] focus:outline-none"
                  >
                    {FULFILLMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Optional status note (logged with timestamp)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="sm:col-span-2 rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" variant="primary" disabled={updating}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{updating ? 'Recording...' : 'Record Status Update'}</span>
                  </Button>
                </div>
              </form>

              {/* Timestamped Status History */}
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8C75A8]">
                  <Clock className="h-3.5 w-3.5 text-[#6A11CB]" />
                  <span>Timestamped Status History ({selectedOrder.statusHistory.length})</span>
                </h3>
                <ol className="mt-2.5 space-y-2 border-l-2 border-[#EBD8FF] pl-4">
                  {selectedOrder.statusHistory.map((entry, idx) => (
                    <li key={`${entry.timestamp}-${idx}`} className="relative text-xs">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#6A11CB]" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[#2A0E4D]">{entry.status}</span>
                        <span className="font-mono text-[11px] text-[#7B6496]">
                          {formatDateTime(entry.timestamp)} · {entry.updatedBy}
                        </span>
                      </div>
                      {entry.note && <p className="mt-0.5 text-[#5F4B78]">{entry.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. ADMIN COUPONS & OFFERS
 * ========================================================================== */
export function AdminCouponsPage() {
  const { data: coupons } = useCoupons();
  const { pushToast } = useToast();

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [minOrderInr, setMinOrderInr] = useState('599');

  async function handleAddCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    const coupon: Coupon = {
      id: `cpn-${Date.now()}`,
      code: code.trim().toUpperCase(),
      description: description.trim() || 'GiftKart promotional offer',
      discountType,
      value: Math.max(1, Number(value) || 10),
      minOrderInr: Math.max(0, Number(minOrderInr) || 0),
      maxDiscountInr: discountType === 'PERCENTAGE' ? 300 : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await services.promotions.upsertCoupon(coupon);
    setCode('');
    setDescription('');
    pushToast({ title: `Coupon ${coupon.code} saved`, variant: 'success' });
  }

  async function toggleCoupon(coupon: Coupon) {
    await services.promotions.upsertCoupon({ ...coupon, isActive: !coupon.isActive });
  }

  async function deleteCoupon(id: string) {
    await services.promotions.deleteCoupon(id);
    pushToast({ title: 'Coupon deleted', variant: 'info' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">Coupons &amp; Offers</h1>
        <p className="text-xs text-[#5F4B78]">
          Create percentage or flat INR promo codes validated automatically in Cart &amp; Demo Checkout.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleAddCoupon(e)}
        className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-4"
      >
        <h2 className="font-display text-base font-bold text-[#2A0E4D]">Create Promo Coupon</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            required
            placeholder="Code (e.g. FESTIVE15)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-xs uppercase focus:border-[#6A11CB] focus:outline-none"
          />
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
            className="rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FLAT_INR">Flat INR (₹)</option>
          </select>
          <input
            type="number"
            min={1}
            required
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <input
            type="number"
            min={0}
            required
            placeholder="Min Order (₹)"
            value={minOrderInr}
            onChange={(e) => setMinOrderInr(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <Button type="submit" size="sm" variant="primary">
            <Plus className="h-3.5 w-3.5" />
            <span>Save Coupon</span>
          </Button>
        </div>
        <input
          type="text"
          placeholder="Short description shown to customers"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
        />
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {coupons.map((cpn) => (
          <div
            key={cpn.id}
            className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#FF4D8D]" />
                <span className="font-mono text-base font-bold text-[#6A11CB]">{cpn.code}</span>
              </div>
              <span className="rounded-full bg-[#FAF6FF] px-2.5 py-0.5 font-mono text-xs font-bold text-[#2A0E4D]">
                {cpn.discountType === 'PERCENTAGE' ? `${cpn.value}% OFF` : `${formatInr(cpn.value)} OFF`}
              </span>
            </div>
            <p className="text-xs text-[#5F4B78]">{cpn.description}</p>
            <p className="text-[11px] text-[#7B6496]">
              Min order: {formatInr(cpn.minOrderInr)}
              {cpn.maxDiscountInr ? ` · Max discount: ${formatInr(cpn.maxDiscountInr)}` : ''}
            </p>
            <div className="flex items-center justify-between border-t border-[#F0E4FF] pt-3">
              <button
                type="button"
                onClick={() => void toggleCoupon(cpn)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  cpn.isActive ? 'bg-[#F4EBFF] text-[#6A11CB]' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {cpn.isActive ? 'Active' : 'Disabled'}
              </button>
              <button
                type="button"
                onClick={() => void deleteCoupon(cpn.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
 * 3. ADMIN CUSTOMERS (DERIVED FROM DEMO ORDERS & ACTIVE DEMO SESSION)
 * ========================================================================== */
export function AdminCustomersPage() {
  const { data: orders } = useOrders();
  const { customerAccount } = useAuth();

  const customers = useMemo(() => {
    const map = new Map<
      string,
      {
        email: string;
        fullName: string;
        phone: string;
        city: string;
        orderCount: number;
        totalSpentInr: number;
      }
    >();

    orders.forEach((order) => {
      const key = order.customer.email.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpentInr += order.grandTotalInr;
      } else {
        map.set(key, {
          email: order.customer.email,
          fullName: order.customer.fullName,
          phone: order.customer.phone,
          city: order.customer.deliveryZoneNameSnapshot,
          orderCount: 1,
          totalSpentInr: order.grandTotalInr,
        });
      }
    });

    if (customerAccount && !map.has(customerAccount.email.toLowerCase())) {
      map.set(customerAccount.email.toLowerCase(), {
        email: customerAccount.email,
        fullName: customerAccount.fullName,
        phone: customerAccount.phone,
        city: 'Jalchak',
        orderCount: 0,
        totalSpentInr: 0,
      });
    }

    return Array.from(map.values());
  }, [orders, customerAccount]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
          Customer Records (Local Demo)
        </h1>
        <p className="text-xs text-[#5F4B78]">
          Derived from local Demo Orders and active browser demo accounts. Replaceable with Supabase Auth &amp; Database in future phase.
        </p>
      </div>

      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs overflow-x-auto">
        {customers.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#5F4B78]">No customer records yet.</p>
        ) : (
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0E4FF] text-[#7B6496]">
                <th className="pb-2.5 font-semibold">Customer</th>
                <th className="pb-2.5 font-semibold">Contact</th>
                <th className="pb-2.5 font-semibold">Primary Zone</th>
                <th className="pb-2.5 font-semibold">Demo Orders</th>
                <th className="pb-2.5 text-right font-semibold">Demo Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5ECFF]">
              {customers.map((c) => (
                <tr key={c.email} className="hover:bg-[#FAF6FF]">
                  <td className="py-3 font-semibold text-[#2A0E4D]">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-[#6A11CB]" />
                      <span>{c.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[#5F4B78]">
                    <p>{c.email}</p>
                    <p className="text-[11px] text-[#7B6496]">{c.phone}</p>
                  </td>
                  <td className="py-3 text-[#4A3862]">{c.city}</td>
                  <td className="py-3 font-mono font-bold text-[#6A11CB]">{c.orderCount}</td>
                  <td className="py-3 text-right font-mono font-bold tabular-nums text-[#2A0E4D]">
                    {formatInr(c.totalSpentInr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
 * 4. ADMIN REPORTS
 * ========================================================================== */
export function AdminReportsPage() {
  const { data: orders } = useOrders();
  const { data: products } = useProducts({ includeInactive: true });
  const { data: categories } = useCategories(true);

  const zoneBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; totalInr: number }>();
    orders.forEach((o) => {
      const z = o.customer.deliveryZoneNameSnapshot;
      const cur = map.get(z) ?? { count: 0, totalInr: 0 };
      cur.count += 1;
      cur.totalInr += o.grandTotalInr;
      map.set(z, cur);
    });
    return Array.from(map.entries());
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      map.set(o.fulfillmentStatus, (map.get(o.fulfillmentStatus) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
          Demo Store Reports
        </h1>
        <p className="text-xs text-[#5F4B78]">
          Computed directly from local browser Demo Orders and catalog data (no fabricated metrics).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-3">
          <h2 className="font-display text-base font-bold text-[#2A0E4D]">
            Demo Orders by Delivery Zone
          </h2>
          {zoneBreakdown.length === 0 ? (
            <p className="text-xs text-[#5F4B78]">No demo order data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {zoneBreakdown.map(([zone, stats]) => (
                <div
                  key={zone}
                  className="flex items-center justify-between rounded-xl bg-[#FAF6FF] px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#2A0E4D]">{zone}</p>
                    <p className="text-[11px] text-[#7B6496]">{stats.count} demo order(s)</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#6A11CB]">
                    {formatInr(stats.totalInr)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-3">
          <h2 className="font-display text-base font-bold text-[#2A0E4D]">
            Fulfillment Status Breakdown
          </h2>
          <div className="space-y-2">
            {statusBreakdown.map(([st, count]) => (
              <div
                key={st}
                className="flex items-center justify-between rounded-xl border border-[#F0E4FF] px-3.5 py-2 text-xs"
              >
                <span className="font-semibold text-[#2A0E4D]">{st}</span>
                <span className="rounded-full bg-[#F4EBFF] px-2.5 py-0.5 font-mono font-bold text-[#6A11CB]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs">
        <h2 className="font-display text-base font-bold text-[#2A0E4D]">
          Catalog Coverage Across 15 Official Categories
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                className="rounded-xl border border-[#F0E4FF] bg-[#FDFBFF] p-3 text-xs"
              >
                <p className="truncate font-semibold text-[#2A0E4D]">{cat.name}</p>
                <p className="mt-1 font-mono text-[11px] text-[#6A11CB]">
                  {count} product(s) · {cat.subcategories.length} sub
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 5. ADMIN STORE SETTINGS & EDITABLE DELIVERY ZONES (JALCHAK)
 * ========================================================================== */
export function AdminSettingsPage() {
  const { data: settings } = useStoreSettings();
  const { pushToast } = useToast();

  const [zoneName, setZoneName] = useState('');
  const [zoneState, setZoneState] = useState('West Bengal');
  const [chargeInr, setChargeInr] = useState('69');
  const [freeAboveInr, setFreeAboveInr] = useState('1199');
  const [estimatedDays, setEstimatedDays] = useState('1–3 business days');

  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  if (!settings) {
    return <p className="text-sm text-[#5F4B78]">Loading store settings...</p>;
  }

  async function handleSaveSupport(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    await services.settings.updateSettings({
      ...settings,
      supportEmail: supportEmail.trim() || settings.supportEmail,
      supportPhone: supportPhone.trim() || settings.supportPhone,
    });
    pushToast({ title: 'Store contact settings saved', variant: 'success' });
  }

  async function handleAddZone(e: React.FormEvent) {
    e.preventDefault();
    if (!zoneName.trim()) return;
    const zone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      name: zoneName.trim(),
      state: zoneState.trim() || 'West Bengal',
      chargeInr: Math.max(0, Number(chargeInr) || 0),
      freeDeliveryAboveInr: Math.max(0, Number(freeAboveInr) || 0),
      estimatedDays: estimatedDays.trim() || '2–3 business days',
      isActive: true,
    };
    await services.settings.upsertDeliveryZone(zone);
    setZoneName('');
    pushToast({
      title: `Delivery zone "${zone.name}" added`,
      variant: 'success',
    });
  }

  async function toggleZone(zone: DeliveryZone) {
    await services.settings.upsertDeliveryZone({ ...zone, isActive: !zone.isActive });
  }

  async function removeZone(zoneId: string) {
    await services.settings.deleteDeliveryZone(zoneId);
    pushToast({ title: 'Delivery zone removed', variant: 'info' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
            Store Settings &amp; Delivery Zones
          </h1>
          <p className="text-xs text-[#5F4B78]">
            Initial launch zone is strictly Jalchak, West Bengal. You may edit rates or add future zones here.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="glass"
          onClick={() => {
            resetAllDemoSeedData();
            pushToast({ title: 'Default Jalchak seed restored', variant: 'info' });
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Seed Defaults</span>
        </Button>
      </div>

      {/* Store Contact Settings */}
      <form
        onSubmit={(e) => void handleSaveSupport(e)}
        className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-4"
      >
        <h2 className="font-display text-base font-bold text-[#2A0E4D]">Store Contact Details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">Support Email</label>
            <input
              type="email"
              defaultValue={settings.supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">Support Phone</label>
            <input
              type="text"
              defaultValue={settings.supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
        </div>
        <Button type="submit" size="sm" variant="primary">
          Save Store Settings
        </Button>
      </form>

      {/* Delivery Zones */}
      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#FF4D8D]" />
          <h2 className="font-display text-base font-bold text-[#2A0E4D]">
            Serviceable Delivery Zones ({settings.deliveryZones.length})
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {settings.deliveryZones.map((zone) => (
            <div
              key={zone.id}
              className="rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-base font-bold text-[#2A0E4D]">{zone.name}</p>
                  <p className="text-xs text-[#5F4B78]">
                    {zone.state} · {zone.estimatedDays}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-[#6A11CB]">
                  {formatInr(zone.chargeInr)}
                </span>
              </div>
              <p className="text-[11px] text-[#7B6496]">
                Free delivery on orders above {formatInr(zone.freeDeliveryAboveInr)}
              </p>
              <div className="flex items-center justify-between border-t border-[#EBD8FF] pt-2.5">
                <button
                  type="button"
                  onClick={() => void toggleZone(zone)}
                  className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${
                    zone.isActive ? 'bg-white text-[#6A11CB]' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {zone.isActive ? 'Active' : 'Paused'}
                </button>
                <button
                  type="button"
                  onClick={() => void removeZone(zone.id)}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => void handleAddZone(e)} className="border-t border-[#F0E4FF] pt-4 space-y-3">
          <p className="text-xs font-bold text-[#2A0E4D]">Add Serviceable Delivery Zone</p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            <input
              type="text"
              required
              placeholder="City / Zone Name"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
            />
            <input
              type="text"
              placeholder="State"
              value={zoneState}
              onChange={(e) => setZoneState(e.target.value)}
              className="rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
            />
            <input
              type="number"
              min={0}
              placeholder="Fee (₹)"
              value={chargeInr}
              onChange={(e) => setChargeInr(e.target.value)}
              className="rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-xs focus:border-[#6A11CB] focus:outline-none"
            />
            <input
              type="number"
              min={0}
              placeholder="Free Above (₹)"
              value={freeAboveInr}
              onChange={(e) => setFreeAboveInr(e.target.value)}
              className="rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-xs focus:border-[#6A11CB] focus:outline-none"
            />
            <Button type="submit" size="sm" variant="accent">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Zone</span>
            </Button>
          </div>
          <input
            type="text"
            placeholder="Estimated delivery timeframe (e.g. 1–2 business days)"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          />
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
 * 6. ADMIN FUTURE INTEGRATIONS READINESS (ALL 7 UNCONNECTED)
 * ========================================================================== */
export function AdminIntegrationsPage() {
  const cashfree = services.paymentGateway.getDescriptor();
  const supabaseSchema = services.supabaseContract.getSchemaPlan();

  const integrations = [
    {
      name: 'Supabase Authentication',
      status: supabaseSchema.statusLabel,
      summary:
        'Prepared behind replaceable ICustomerAuthService and IAdminAuthService interfaces to replace LocalStorage demo auth with production security.',
    },
    {
      name: 'Supabase Database (PostgreSQL)',
      status: supabaseSchema.statusLabel,
      summary: `Prepared for ${supabaseSchema.expectedTables.length} normalized tables (${supabaseSchema.expectedTables.slice(0, 5).join(', ')}...). Currently running LocalStorage demo adapter.`,
    },
    {
      name: 'Supabase Storage',
      status: supabaseSchema.statusLabel,
      summary:
        'Prepared for persistent product galleries and customer custom-gift photo uploads (currently browser-only preview).',
    },
    {
      name: 'Cashfree Payment Gateway (INR)',
      status: cashfree.statusLabel,
      summary: cashfree.description,
    },
    {
      name: 'WhatsApp Business API',
      status: services.whatsapp.statusLabel,
      summary:
        'Prepared for automated order confirmation and delivery status template updates for Jalchak customers.',
    },
    {
      name: 'Email Notifications',
      status: services.email.statusLabel,
      summary:
        'Prepared for transactional order confirmation emails, gift receipts, and admin alerts.',
    },
    {
      name: 'Storefront Analytics',
      status: services.analytics.statusLabel,
      summary:
        'Prepared for event tracking across category browsing, customization engagement, and checkout conversion.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#FF4D8D]" />
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
            Future Integrations Architecture
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-[#5F4B78]">
            All 7 external production services below are modeled via clean TypeScript interfaces and placeholder adapters. None are connected yet; GiftKart is currently running in transparent Local Demo Mode.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((item) => (
          <div
            key={item.name}
            className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Plug className="h-4 w-4 text-[#6A11CB]" />
                <h2 className="font-display text-base font-bold text-[#2A0E4D]">{item.name}</h2>
              </div>
              <span className="shrink-0 rounded-full bg-[#FFF0F6] px-2.5 py-0.5 text-[10px] font-bold text-[#FF4D8D]">
                {item.status}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#5F4B78]">{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
