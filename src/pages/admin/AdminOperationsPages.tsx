import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Gift,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plug,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Tag,
  Trash2,
  Users,
  X,
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
import { isAllGiftsCategory } from '../../utils/storefrontHelpers';
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

function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/* ============================================================================
 * 1. ADMIN ORDERS & TIMESTAMPED STATUS HISTORY (MOBILE MASTER -> DETAIL)
 * ========================================================================== */
export function AdminOrdersPage() {
  const { data: orders } = useOrders();
  const { pushToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialOrderParam = searchParams.get('order') ?? '';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderParam);
  const [mobileDetailOpen, setMobileDetailOpen] = useState<boolean>(Boolean(initialOrderParam));
  const [nextStatus, setNextStatus] = useState<OrderFulfillmentStatus>('Confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.fulfillmentStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.phone.toLowerCase().includes(q) ||
        o.customer.deliveryZoneNameSnapshot.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, search]);

  const selectedOrder: DemoOrder | undefined = useMemo(() => {
    return (
      filteredOrders.find((o) => o.id === selectedOrderId) ??
      orders.find((o) => o.id === selectedOrderId) ??
      filteredOrders[0]
    );
  }, [filteredOrders, orders, selectedOrderId]);

  useEffect(() => {
    if (selectedOrder) {
      setNextStatus(selectedOrder.fulfillmentStatus);
    }
  }, [selectedOrder?.id, selectedOrder?.fulfillmentStatus]);

  function openOrder(order: DemoOrder) {
    setSelectedOrderId(order.id);
    setNextStatus(order.fulfillmentStatus);
    setMobileDetailOpen(true);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  function closeMobileDetail() {
    setMobileDetailOpen(false);
    if (searchParams.has('order')) {
      setSearchParams({}, { replace: true });
    }
  }

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
        description: `Status recorded as "${nextStatus}".`,
        variant: 'success',
      });
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header (Hidden on mobile when inspecting a single order for maximum focus) */}
      <div className={mobileDetailOpen ? 'hidden lg:block' : 'block'}>
        <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
          Orders ({orders.length})
        </h1>
        <p className="text-[11px] text-[#5F4B78] sm:text-xs">
          Tap any order to inspect items, custom photos, customer contact &amp; update status
        </p>

        {/* Search + Horizontal Status Filter Bar */}
        <div className="mt-3 space-y-2.5">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-[#EBD8FF] bg-white px-3 shadow-xs">
            <Search className="h-4 w-4 shrink-0 text-[#6A11CB]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, customer name, or phone..."
              className="w-full bg-transparent text-sm text-[#2A0E4D] focus:outline-none sm:text-xs"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`min-h-[34px] shrink-0 rounded-lg px-3 text-xs font-semibold whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-[#6A11CB] text-white'
                  : 'border border-[#EBD8FF] bg-white text-[#5F4B78]'
              }`}
            >
              All ({orders.length})
            </button>
            {FULFILLMENT_STATUSES.map((st) => {
              const count = orders.filter((o) => o.fulfillmentStatus === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`min-h-[34px] shrink-0 rounded-lg px-3 text-xs font-semibold whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-[#6A11CB] text-white'
                      : 'border border-[#EBD8FF] bg-white text-[#5F4B78]'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Orders List (Visible on desktop always, visible on mobile when !mobileDetailOpen) */}
        <div
          className={`space-y-2.5 lg:col-span-5 ${
            mobileDetailOpen ? 'hidden lg:block' : 'block'
          }`}
        >
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-[#EBD8FF] bg-white p-8 text-center text-xs text-[#5F4B78]">
              No orders match your filter.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const active = selectedOrder?.id === order.id;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => openOrder(order)}
                  className={`w-full rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99] sm:p-4 ${
                    active
                      ? 'border-[#6A11CB] bg-[#F8F2FF] shadow-xs'
                      : 'border-[#EBD8FF] bg-white hover:bg-[#FAF6FF]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[#6A11CB]">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] font-bold text-[#FF4D8D]">
                      {order.fulfillmentStatus}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-[#2A0E4D]">
                      {order.customer.fullName}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="font-mono text-sm font-bold tabular-nums text-[#2A0E4D]">
                        {formatInr(order.grandTotalInr)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#8C75A8] lg:hidden" />
                    </div>
                  </div>
                  <p className="mt-1 truncate text-[11.5px] text-[#5F4B78]">
                    {order.customer.deliveryZoneNameSnapshot} · {order.items.length} item(s) ·{' '}
                    {order.paymentMethod || 'COD'}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Order Detail Panel (Visible on desktop always, visible on mobile when mobileDetailOpen) */}
        <div
          className={`lg:col-span-7 ${
            mobileDetailOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {mobileDetailOpen && (
            <button
              type="button"
              onClick={closeMobileDetail}
              className="mb-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-bold text-[#6A11CB] shadow-xs active:bg-[#F4EBFF] lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All Orders</span>
            </button>
          )}

          {!selectedOrder ? (
            <div className="rounded-2xl border border-[#EBD8FF] bg-white p-8 text-center text-sm text-[#5F4B78]">
              Select an order to inspect details and update status.
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-6">
              {/* Order Top Header */}
              <div className="flex items-start justify-between gap-3 border-b border-[#F0E4FF] pb-3.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#6A11CB]">
                    {selectedOrder.paymentMethod || 'Cash on Delivery (COD)'}
                  </p>
                  <h2 className="mt-0.5 font-mono text-lg font-bold text-[#2A0E4D] sm:text-xl">
                    {selectedOrder.orderNumber}
                  </h2>
                  <p className="text-[11.5px] text-[#5F4B78]">
                    {formatDateTime(selectedOrder.createdAt)} ·{' '}
                    <strong className="text-[#FF4D8D]">{selectedOrder.fulfillmentStatus}</strong>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-[#7B6496]">Grand Total</p>
                  <p className="font-mono text-lg font-bold tabular-nums text-[#6A11CB] sm:text-xl">
                    {formatInr(selectedOrder.grandTotalInr)}
                  </p>
                </div>
              </div>

              {/* Quick 1-Tap Owner Status Update (Placed high for fast mobile workflow!) */}
              <form
                onSubmit={(e) => void handleStatusUpdate(e)}
                className="space-y-3 rounded-2xl border border-[#6A11CB]/20 bg-[#FAF6FF] p-3.5 sm:p-4"
              >
                <p className="text-xs font-bold text-[#2A0E4D]">Update Order Status</p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {FULFILLMENT_STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNextStatus(st)}
                      className={`min-h-[38px] rounded-xl px-2.5 text-[11.5px] font-bold transition-colors ${
                        nextStatus === st
                          ? 'bg-[#6A11CB] text-white shadow-xs'
                          : 'border border-[#EBD8FF] bg-white text-[#4A3862] hover:bg-[#F4EBFF]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Optional note (e.g. Dispatched with courier)"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs focus:border-[#6A11CB] focus:outline-none"
                />
                <Button type="submit" size="sm" variant="primary" fullWidth disabled={updating}>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{updating ? 'Updating...' : `Set Status: ${nextStatus}`}</span>
                </Button>
              </form>

              {/* Customer Contact + 1-Tap Call & WhatsApp */}
              <div className="space-y-3 rounded-2xl bg-[#FAF6FF] p-3.5 text-xs sm:p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10.5px] font-bold tracking-wide text-[#8C75A8]">Customer</p>
                    <p className="mt-1 text-sm font-bold text-[#2A0E4D]">
                      {selectedOrder.customer.fullName}
                    </p>
                    <p className="text-[#5F4B78]">{selectedOrder.customer.phone}</p>
                    <p className="truncate text-[#5F4B78]">{selectedOrder.customer.email}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] font-bold tracking-wide text-[#8C75A8]">
                      Delivery Address
                    </p>
                    <p className="mt-1 font-bold text-[#6A11CB]">
                      {selectedOrder.customer.deliveryZoneNameSnapshot} (
                      {selectedOrder.customer.state})
                    </p>
                    <p className="text-[#5F4B78]">{selectedOrder.customer.addressLine1}</p>
                    <p className="text-[#5F4B78]">
                      {selectedOrder.customer.city} — {selectedOrder.customer.pincode}
                    </p>
                  </div>
                </div>

                {selectedOrder.customer.phone && (
                  <div className="grid grid-cols-2 gap-2 border-t border-[#EBD8FF] pt-2.5">
                    <a
                      href={`tel:${selectedOrder.customer.phone}`}
                      className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-bold text-[#6A11CB] active:bg-[#F4EBFF]"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call Customer</span>
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(selectedOrder.customer.phone)}?text=${encodeURIComponent(
                        `Hello ${selectedOrder.customer.fullName}, update for your GiftKart Order ${selectedOrder.orderNumber}: Status is currently "${selectedOrder.fulfillmentStatus}".`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white active:scale-[0.98]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Ordered Items */}
              <div>
                <h3 className="text-xs font-bold text-[#8C75A8]">
                  Ordered Items ({selectedOrder.items.length})
                </h3>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={`${item.productSkuSnapshot}-${idx}`}
                      className="rounded-xl border border-[#F0E4FF] p-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-[#2A0E4D]">{item.productNameSnapshot}</p>
                          <p className="font-mono text-[11px] text-[#7B6496]">
                            {item.productSkuSnapshot} · {formatInr(item.unitPriceInrSnapshot)} ×{' '}
                            {item.quantity}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono font-bold tabular-nums text-[#2A0E4D]">
                          {formatInr(item.lineTotalInr)}
                        </span>
                      </div>
                      {Object.keys(item.selectedVariants).length > 0 && (
                        <p className="mt-1 text-[#5F4B78]">
                          {Object.entries(item.selectedVariants)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}
                      {item.personalizationDetails && (
                        <p className="mt-1.5 rounded-lg bg-[#FAF6FF] px-2.5 py-1.5 font-medium text-[#6A11CB]">
                          Custom Text: {item.personalizationDetails}
                        </p>
                      )}
                      {item.customPhotoFileName && (
                        <p className="mt-1 rounded-lg bg-[#FFF0F6] px-2.5 py-1.5 font-semibold text-[#FF4D8D]">
                          Custom Photo: {item.customPhotoFileName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gift Wrap & Price Breakdown */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#EBD8FF] bg-[#FFF8FB] p-3.5 text-xs">
                  <p className="flex items-center gap-1.5 font-bold text-[#6A11CB]">
                    <Gift className="h-3.5 w-3.5 text-[#FF4D8D]" />
                    <span>Gift Wrapping</span>
                  </p>
                  {selectedOrder.giftWrap.enabled ? (
                    <div className="mt-1.5 space-y-1 text-[#5F4B78]">
                      <p>
                        <strong className="text-[#2A0E4D]">
                          {selectedOrder.giftWrap.styleNameSnapshot}
                        </strong>{' '}
                        ({formatInr(selectedOrder.giftWrap.chargeInrSnapshot)})
                      </p>
                      {selectedOrder.giftWrap.recipientName && (
                        <p>For: {selectedOrder.giftWrap.recipientName}</p>
                      )}
                      {selectedOrder.giftWrap.giftMessage && (
                        <p className="italic">&ldquo;{selectedOrder.giftWrap.giftMessage}&rdquo;</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-[#7B6496]">No gift wrapping selected.</p>
                  )}
                </div>

                <div className="space-y-1 rounded-xl border border-[#EBD8FF] bg-[#FAF6FF] p-3.5 text-xs">
                  <div className="flex justify-between text-[#5F4B78]">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">
                      {formatInr(selectedOrder.subtotalInr)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5F4B78]">
                    <span>Gift Wrap</span>
                    <span className="font-mono tabular-nums">
                      {formatInr(selectedOrder.giftWrapChargeInr)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5F4B78]">
                    <span>
                      Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}
                    </span>
                    <span className="font-mono tabular-nums text-[#FF4D8D]">
                      -{formatInr(selectedOrder.discountInr)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5F4B78]">
                    <span>Delivery</span>
                    <span className="font-mono tabular-nums">
                      {formatInr(selectedOrder.deliveryChargeInr)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#EBD8FF] pt-1.5 font-bold text-[#2A0E4D]">
                    <span>Grand Total</span>
                    <span className="font-mono tabular-nums text-[#6A11CB]">
                      {formatInr(selectedOrder.grandTotalInr)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#8C75A8]">
                  <Clock className="h-3.5 w-3.5 text-[#6A11CB]" />
                  <span>Status History ({selectedOrder.statusHistory.length})</span>
                </h3>
                <ol className="mt-2.5 space-y-2.5 border-l-2 border-[#EBD8FF] pl-4">
                  {selectedOrder.statusHistory.map((entry, idx) => (
                    <li key={`${entry.timestamp}-${idx}`} className="relative text-xs">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#6A11CB]" />
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-[#2A0E4D]">{entry.status}</span>
                        <span className="font-mono text-[10.5px] text-[#7B6496]">
                          {formatDateTime(entry.timestamp)}
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

  const [showForm, setShowForm] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [minOrderInr, setMinOrderInr] = useState('599');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  function resetForm() {
    setEditingCouponId(null);
    setCode('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setValue('10');
    setMinOrderInr('599');
    setValidFrom('');
    setValidUntil('');
    setShowForm(false);
  }

  function startEditCoupon(cpn: Coupon) {
    setEditingCouponId(cpn.id);
    setCode(cpn.code);
    setDescription(cpn.description);
    setDiscountType(cpn.discountType);
    setValue(String(cpn.value));
    setMinOrderInr(String(cpn.minOrderInr));
    setValidFrom(cpn.validFrom ? cpn.validFrom.slice(0, 10) : '');
    setValidUntil(cpn.validUntil ? cpn.validUntil.slice(0, 10) : '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSaveCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    const existing = coupons.find((c) => c.id === editingCouponId);
    const coupon: Coupon = {
      id: existing?.id ?? `cpn-${Date.now()}`,
      code: code.trim().toUpperCase(),
      description: description.trim() || 'GiftKart promotional offer',
      discountType,
      value: Math.max(1, Number(value) || 10),
      minOrderInr: Math.max(0, Number(minOrderInr) || 0),
      maxDiscountInr: discountType === 'PERCENTAGE' ? 300 : undefined,
      validFrom: validFrom || undefined,
      validUntil: validUntil || undefined,
      isActive: existing ? existing.isActive : true,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    await services.promotions.upsertCoupon(coupon);
    resetForm();
    pushToast({
      title: existing ? `Coupon ${coupon.code} updated` : `Coupon ${coupon.code} created`,
      variant: 'success',
    });
  }

  async function toggleCoupon(coupon: Coupon) {
    await services.promotions.upsertCoupon({ ...coupon, isActive: !coupon.isActive });
  }

  async function deleteCoupon(id: string) {
    await services.promotions.deleteCoupon(id);
    if (editingCouponId === id) resetForm();
    pushToast({ title: 'Coupon deleted', variant: 'info' });
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
            Coupons ({coupons.length})
          </h1>
          <p className="text-[11px] text-[#5F4B78] sm:text-xs">
            Create &amp; manage percentage or flat ₹ promo codes
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showForm ? 'Close' : 'New Coupon'}</span>
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleSaveCoupon(e)}
          className="space-y-3 rounded-2xl border border-[#6A11CB]/25 bg-white p-4 shadow-md sm:p-5"
        >
          <h2 className="font-display text-base font-bold text-[#2A0E4D]">
            {editingCouponId ? `Edit ${code.toUpperCase()}` : 'Create Promo Coupon'}
          </h2>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <input
              type="text"
              required
              placeholder="Code (e.g. FESTIVE15)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="col-span-2 h-11 rounded-xl border border-[#EBD8FF] px-3 font-mono text-sm uppercase focus:border-[#6A11CB] focus:outline-none sm:col-span-1"
            />
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
              className="col-span-2 h-11 rounded-xl border border-[#EBD8FF] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none sm:col-span-1"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT_INR">Flat INR (₹)</option>
            </select>
            <input
              type="number"
              min={1}
              required
              placeholder="Discount Value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <input
              type="number"
              min={0}
              required
              placeholder="Min Order (₹)"
              value={minOrderInr}
              onChange={(e) => setMinOrderInr(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#5F4B78]">Valid From</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-[#EBD8FF] px-2.5 text-xs focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#5F4B78]">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-[#EBD8FF] px-2.5 text-xs focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Short description shown to customers"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
          />

          <Button type="submit" size="sm" variant="primary" fullWidth>
            <Plus className="h-4 w-4" />
            <span>{editingCouponId ? 'Update Coupon' : 'Save Coupon'}</span>
          </Button>
        </form>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {coupons.map((cpn) => {
          const isExpired = Boolean(cpn.validUntil && todayIso > cpn.validUntil.slice(0, 10));
          return (
            <div
              key={cpn.id}
              className="space-y-2.5 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#FF4D8D]" />
                  <span className="font-mono text-base font-bold text-[#6A11CB]">{cpn.code}</span>
                  {isExpired && (
                    <span className="text-[11px] font-bold text-rose-600">· Expired</span>
                  )}
                </div>
                <span className="font-mono text-xs font-bold tabular-nums text-[#2A0E4D]">
                  {cpn.discountType === 'PERCENTAGE'
                    ? `${cpn.value}% OFF`
                    : `${formatInr(cpn.value)} OFF`}
                </span>
              </div>
              <p className="text-xs text-[#5F4B78]">{cpn.description}</p>
              <p className="text-[11px] text-[#7B6496]">
                Min order: {formatInr(cpn.minOrderInr)}
                {cpn.maxDiscountInr ? ` · Max: ${formatInr(cpn.maxDiscountInr)}` : ''}
              </p>
              <div className="flex items-center justify-between border-t border-[#F0E4FF] pt-2.5">
                <button
                  type="button"
                  onClick={() => void toggleCoupon(cpn)}
                  className={`min-h-[34px] rounded-lg px-3 text-xs font-bold ${
                    cpn.isActive ? 'bg-[#F4EBFF] text-[#6A11CB]' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {cpn.isActive ? 'Active' : 'Disabled'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEditCoupon(cpn)}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#EBD8FF] px-2.5 text-xs font-bold text-[#6A11CB]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteCoupon(cpn.id)}
                    aria-label={`Delete ${cpn.code}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EBD8FF] text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
 * 3. ADMIN CUSTOMERS (MOBILE CARDS WITH CALL/WHATSAPP + DESKTOP TABLE)
 * ========================================================================== */
export function AdminCustomersPage() {
  const { data: orders } = useOrders();
  const { customerAccount } = useAuth();
  const [search, setSearch] = useState('');

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

    const q = search.trim().toLowerCase();
    return Array.from(map.values()).filter(
      (c) =>
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [orders, customerAccount, search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
          Customers ({customers.length})
        </h1>
        <p className="text-[11px] text-[#5F4B78] sm:text-xs">
          Customer directory from placed orders and active storefront accounts
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs sm:p-5">
        <div className="flex h-11 items-center gap-2 rounded-xl border border-[#EBD8FF] bg-[#FAF6FF] px-3">
          <Search className="h-4 w-4 text-[#6A11CB]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, phone, or email..."
            className="w-full bg-transparent text-sm text-[#2A0E4D] focus:outline-none sm:text-xs"
          />
        </div>

        {customers.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#5F4B78]">No customer records found.</p>
        ) : (
          <>
            {/* Mobile Customer Cards */}
            <div className="space-y-2.5 md:hidden">
              {customers.map((c) => (
                <div
                  key={c.email}
                  className="space-y-2.5 rounded-xl border border-[#F0E4FF] bg-[#FDFBFF] p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#2A0E4D]">{c.fullName}</p>
                      <p className="truncate text-[11px] text-[#5F4B78]">{c.email}</p>
                      <p className="text-[11px] text-[#7B6496]">
                        {c.city} · {c.orderCount} order(s)
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-[#6A11CB]">
                      {formatInr(c.totalSpentInr)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-[#F0E4FF] pt-2">
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-[#EBD8FF] bg-white text-xs font-bold text-[#6A11CB]"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call</span>
                      </a>
                    ) : (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-[#EBD8FF] bg-white text-xs font-bold text-[#6A11CB]"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Email</span>
                      </a>
                    )}
                    {c.phone && (
                      <a
                        href={`https://wa.me/${cleanPhoneForWhatsApp(c.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F0E4FF] text-[#7B6496]">
                    <th className="pb-2.5 font-semibold">Customer</th>
                    <th className="pb-2.5 font-semibold">Contact</th>
                    <th className="pb-2.5 font-semibold">Primary Zone</th>
                    <th className="pb-2.5 font-semibold">Orders</th>
                    <th className="pb-2.5 text-right font-semibold">Total Spend</th>
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
            </div>
          </>
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

  const nonCancelledOrders = useMemo(
    () => orders.filter((o) => o.fulfillmentStatus !== 'Cancelled'),
    [orders]
  );

  const totalRevenue = useMemo(
    () => nonCancelledOrders.reduce((s, o) => s + o.grandTotalInr, 0),
    [nonCancelledOrders]
  );

  const avgOrderValue = nonCancelledOrders.length
    ? Math.round(totalRevenue / nonCancelledOrders.length)
    : 0;

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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
          Store Analytics &amp; Reports
        </h1>
        <p className="text-[11px] text-[#5F4B78] sm:text-xs">
          Live breakdown calculated from store orders and catalog
        </p>
      </div>

      {/* 2x2 Summary KPIs */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-[#7B6496]">Net Revenue</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-[#6A11CB]">
            {formatInr(totalRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-[#7B6496]">Avg Order Value</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-[#2A0E4D]">
            {formatInr(avgOrderValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-[#7B6496]">Total Orders</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-[#2A0E4D]">
            {orders.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-[#7B6496]">Catalog Size</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-[#2A0E4D]">
            {products.length} items
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-5">
          <h2 className="font-display text-base font-bold text-[#2A0E4D]">
            Orders by Delivery Zone
          </h2>
          {zoneBreakdown.length === 0 ? (
            <p className="text-xs text-[#5F4B78]">No order data yet.</p>
          ) : (
            <div className="space-y-2">
              {zoneBreakdown.map(([zone, stats]) => (
                <div
                  key={zone}
                  className="flex items-center justify-between rounded-xl bg-[#FAF6FF] px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#2A0E4D]">{zone}</p>
                    <p className="text-[11px] text-[#7B6496]">{stats.count} order(s)</p>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums text-[#6A11CB]">
                    {formatInr(stats.totalInr)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-5">
          <h2 className="font-display text-base font-bold text-[#2A0E4D]">
            Fulfillment Status
          </h2>
          <div className="space-y-2">
            {statusBreakdown.map(([st, count]) => (
              <div
                key={st}
                className="flex items-center justify-between rounded-xl border border-[#F0E4FF] px-3.5 py-2.5 text-xs"
              >
                <span className="font-semibold text-[#2A0E4D]">{st}</span>
                <span className="font-mono font-bold tabular-nums text-[#6A11CB]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-5">
        <h2 className="font-display text-base font-bold text-[#2A0E4D]">
          Catalog Coverage Across {categories.length} Official Categories
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat) => {
            const count = isAllGiftsCategory(cat)
              ? products.length
              : products.filter((p) => p.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                className="rounded-xl border border-[#F0E4FF] bg-[#FDFBFF] p-3 text-xs"
              >
                <p className="truncate font-bold text-[#2A0E4D]">{cat.name}</p>
                <p className="mt-0.5 font-mono text-[11px] tabular-nums text-[#6A11CB]">
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
 * 5. ADMIN STORE SETTINGS & EDITABLE DELIVERY ZONES
 * ========================================================================== */
export function AdminSettingsPage() {
  const { data: settings } = useStoreSettings();
  const { pushToast } = useToast();

  const [showAddZone, setShowAddZone] = useState(false);
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
    setShowAddZone(false);
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
            Store Settings
          </h1>
          <p className="text-[11px] text-[#5F4B78] sm:text-xs">
            Contact details, delivery zones &amp; shipping fees
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
          <span>Reset</span>
        </Button>
      </div>

      {/* Store Contact Settings */}
      <form
        onSubmit={(e) => void handleSaveSupport(e)}
        className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-5"
      >
        <h2 className="font-display text-base font-bold text-[#2A0E4D]">Store Contact Details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">Support Email</label>
            <input
              type="email"
              defaultValue={settings.supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">Support Phone</label>
            <input
              type="text"
              defaultValue={settings.supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
        </div>
        <Button type="submit" size="sm" variant="primary" fullWidth>
          Save Contact Details
        </Button>
      </form>

      {/* Delivery Zones */}
      <div className="space-y-3.5 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#FF4D8D]" />
            <h2 className="font-display text-base font-bold text-[#2A0E4D]">
              Delivery Zones ({settings.deliveryZones.length})
            </h2>
          </div>
          <Button
            type="button"
            size="sm"
            variant="accent"
            onClick={() => setShowAddZone((p) => !p)}
          >
            {showAddZone ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{showAddZone ? 'Close' : 'Add Zone'}</span>
          </Button>
        </div>

        {showAddZone && (
          <form
            onSubmit={(e) => void handleAddZone(e)}
            className="space-y-2.5 rounded-xl border border-[#6A11CB]/25 bg-[#FAF6FF] p-3.5"
          >
            <p className="text-xs font-bold text-[#2A0E4D]">Add Serviceable Delivery Zone</p>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="City / Zone Name *"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="col-span-2 h-11 rounded-xl border border-[#EBD8FF] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none sm:col-span-1"
              />
              <input
                type="text"
                placeholder="State"
                value={zoneState}
                onChange={(e) => setZoneState(e.target.value)}
                className="col-span-2 h-11 rounded-xl border border-[#EBD8FF] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none sm:col-span-1"
              />
              <input
                type="number"
                min={0}
                placeholder="Fee (₹)"
                value={chargeInr}
                onChange={(e) => setChargeInr(e.target.value)}
                className="h-11 rounded-xl border border-[#EBD8FF] bg-white px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
              <input
                type="number"
                min={0}
                placeholder="Free Above (₹)"
                value={freeAboveInr}
                onChange={(e) => setFreeAboveInr(e.target.value)}
                className="h-11 rounded-xl border border-[#EBD8FF] bg-white px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Estimated delivery (e.g. 1–2 business days)"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <Button type="submit" size="sm" variant="primary" fullWidth>
              <Plus className="h-4 w-4" />
              <span>Save Delivery Zone</span>
            </Button>
          </form>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {settings.deliveryZones.map((zone) => (
            <div
              key={zone.id}
              className="space-y-2 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-bold text-[#2A0E4D]">{zone.name}</p>
                  <p className="text-xs text-[#5F4B78]">
                    {zone.state} · {zone.estimatedDays}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-[#6A11CB]">
                  {formatInr(zone.chargeInr)}
                </span>
              </div>
              <p className="text-[11px] text-[#7B6496]">
                Free delivery above {formatInr(zone.freeDeliveryAboveInr)}
              </p>
              <div className="flex items-center justify-between border-t border-[#EBD8FF] pt-2.5">
                <button
                  type="button"
                  onClick={() => void toggleZone(zone)}
                  className={`min-h-[34px] rounded-lg px-3 text-xs font-bold ${
                    zone.isActive ? 'bg-white text-[#6A11CB]' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {zone.isActive ? 'Active' : 'Paused'}
                </button>
                <button
                  type="button"
                  onClick={() => void removeZone(zone.id)}
                  className="inline-flex min-h-[34px] items-center gap-1 px-2 text-xs font-semibold text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 6. ADMIN FUTURE INTEGRATIONS READINESS
 * ========================================================================== */
export function AdminIntegrationsPage() {
  const cashfree = services.paymentGateway.getDescriptor();
  const supabaseSchema = services.supabaseContract.getSchemaPlan();

  const integrations = [
    {
      name: 'Cloud Authentication',
      status: supabaseSchema.statusLabel,
      summary: 'Prepared to replace LocalStorage auth with production role-based security.',
    },
    {
      name: 'Cloud Database',
      status: supabaseSchema.statusLabel,
      summary: `Ready for ${supabaseSchema.expectedTables.length} normalized collections/tables across products, categories, and orders.`,
    },
    {
      name: 'Media Storage',
      status: supabaseSchema.statusLabel,
      summary: 'Ready for permanent product galleries and customer custom photo uploads.',
    },
    {
      name: 'Online Payment Gateway (INR)',
      status: cashfree.statusLabel,
      summary: cashfree.description,
    },
    {
      name: 'WhatsApp Business API',
      status: services.whatsapp.statusLabel,
      summary: 'Ready for automated order confirmations and delivery alerts for Jalchak buyers.',
    },
    {
      name: 'Email Notifications',
      status: services.email.statusLabel,
      summary: 'Ready for automated order receipts and admin alerts.',
    },
    {
      name: 'Storefront Analytics',
      status: services.analytics.statusLabel,
      summary: 'Ready for category browsing and conversion tracking.',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-5">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#FF4D8D]" />
        <div>
          <h1 className="font-display text-lg font-bold text-[#2A0E4D] sm:text-xl">
            System Integrations
          </h1>
          <p className="mt-0.5 text-xs leading-relaxed text-[#5F4B78]">
            All store operations work locally right now. Connect live cloud services anytime without changing the UI.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {integrations.map((item) => (
          <div
            key={item.name}
            className="space-y-2 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Plug className="h-4 w-4 shrink-0 text-[#6A11CB]" />
                <h2 className="font-display text-sm font-bold text-[#2A0E4D] sm:text-base">
                  {item.name}
                </h2>
              </div>
              <span className="shrink-0 text-[10.5px] font-bold text-[#FF4D8D]">
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
