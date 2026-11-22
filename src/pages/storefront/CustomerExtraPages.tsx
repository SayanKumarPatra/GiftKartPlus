import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Gift,
  MapPin,
  Package,
  PencilLine,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { services } from '../../services/registry';
import {
  useSavedAddresses,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { useToast } from '../../context/ToastContext';
import { BRAND_ASSETS, STUDIO_MEDIA } from '../../config/appConfig';
import type { DemoOrder, SavedAddress } from '../../types';
import { formatDateTime, formatInr } from '../../utils/format';
import {
  validateEmail,
  validateIndianPhone,
  validateIndianPincode,
  validateRequired,
} from '../../utils/validation';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductImage } from '../../components/ui/ProductImage';

/* ============================================================================
 * #14 ORDER DETAILS PAGE (/order/:orderNumber)
 * ========================================================================== */
export function OrderDetailsPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void services.orders
      .getOrderByNumber(orderNumber ?? '')
      .then((found) => {
        if (active) setOrder(found);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-32 animate-pulse rounded-3xl bg-[#F4EBFF]" />
        <div className="h-64 animate-pulse rounded-3xl bg-[#FAF6FF]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <EmptyState
          title="Demo order not found"
          description={`We could not find a local demo order with ID "${orderNumber ?? ''}".`}
          icon={<Package className="h-5 w-5" />}
          action={
            <Link to="/my-orders">
              <Button size="sm">View My Demo Orders</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#6E5B85]">
        <Link to="/" className="hover:text-[#6A11CB]">Home</Link>
        <span>/</span>
        <Link to="/my-orders" className="hover:text-[#6A11CB]">My Orders</Link>
        <span>/</span>
        <span className="font-bold text-[#2B0B4E]">{order.orderNumber}</span>
      </nav>

      {/* Header Banner */}
      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-[#FF4D8D] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              DEMO ORDER · NO LIVE PAYMENT COLLECTED
            </span>
            <h1 className="mt-2 font-mono text-2xl font-extrabold text-[#3B0764] sm:text-3xl">
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-xs text-[#594A6B]">
              Placed on {formatDateTime(order.createdAt)} · Cashfree:{' '}
              <strong className="text-[#6A11CB]">Integration Ready — Not Connected</strong>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-flex rounded-full bg-white px-3.5 py-1 text-xs font-bold text-[#6A11CB] shadow-xs">
              {order.fulfillmentStatus}
            </span>
            <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-[#2B0B4E]">
              {formatInr(order.grandTotalInr)}
            </p>
          </div>
        </div>
      </div>

      {/* Immutable Item Snapshots */}
      <div className="gk-card rounded-3xl p-6 space-y-4">
        <h2 className="text-base font-extrabold text-[#2B0B4E]">
          Ordered Items (Frozen Snapshots)
        </h2>
        <div className="divide-y divide-[#F0E4FF]">
          {order.items.map((item, idx) => (
            <div key={`${item.productSkuSnapshot}-${idx}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF]">
                <ProductImage
                  src={item.imageSnapshot}
                  alt={item.productNameSnapshot}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#2B0B4E]">
                      {item.productNameSnapshot}
                    </p>
                    <p className="font-mono text-[11px] text-[#7B6496]">
                      SKU: {item.productSkuSnapshot} · {formatInr(item.unitPriceInrSnapshot)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-extrabold tabular-nums text-[#6A11CB]">
                    {formatInr(item.lineTotalInr)}
                  </span>
                </div>
                {Object.keys(item.selectedVariants).length > 0 && (
                  <p className="mt-1 text-xs text-[#594A6B]">
                    {Object.entries(item.selectedVariants)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </p>
                )}
                {item.personalizationDetails && (
                  <p className="mt-1 text-xs font-semibold text-[#6A11CB]">
                    Personalization: {item.personalizationDetails}
                  </p>
                )}
                {item.customPhotoFileName && (
                  <p className="mt-0.5 text-xs font-medium text-[#FF4D8D]">
                    Photo Preview Attached: {item.customPhotoFileName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery, Gift Wrap & Price Summary */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="gk-card rounded-3xl p-5 text-xs space-y-1.5">
          <p className="flex items-center gap-1.5 font-extrabold text-[#2B0B4E]">
            <MapPin className="h-4 w-4 text-[#FF4D8D]" />
            <span>Delivery Address</span>
          </p>
          <p className="font-bold text-[#2B0B4E]">{order.customer.fullName}</p>
          <p className="text-[#594A6B]">{order.customer.addressLine1}</p>
          {order.customer.addressLine2 && (
            <p className="text-[#594A6B]">{order.customer.addressLine2}</p>
          )}
          <p className="font-semibold text-[#6A11CB]">
            {order.customer.deliveryZoneNameSnapshot}, {order.customer.state} — {order.customer.pincode}
          </p>
          <p className="text-[#594A6B]">
            {order.customer.phone} · {order.customer.email}
          </p>
        </div>

        <div className="gk-card rounded-3xl p-5 text-xs space-y-1.5">
          <p className="flex items-center gap-1.5 font-extrabold text-[#2B0B4E]">
            <Gift className="h-4 w-4 text-[#FF4D8D]" />
            <span>Gift Wrapping Snapshot</span>
          </p>
          {order.giftWrap.enabled ? (
            <>
              <p className="font-bold text-[#6A11CB]">
                {order.giftWrap.styleNameSnapshot} ({formatInr(order.giftWrap.chargeInrSnapshot)})
              </p>
              {order.giftWrap.recipientName && (
                <p className="text-[#594A6B]">
                  Recipient: <strong className="text-[#2B0B4E]">{order.giftWrap.recipientName}</strong>
                </p>
              )}
              {order.giftWrap.giftMessage && (
                <p className="italic text-[#594A6B]">&ldquo;{order.giftWrap.giftMessage}&rdquo;</p>
              )}
            </>
          ) : (
            <p className="text-[#594A6B]">Standard protective packaging (no gift wrap).</p>
          )}
        </div>

        <div className="gk-card rounded-3xl p-5 text-xs space-y-1.5">
          <p className="font-extrabold text-[#2B0B4E]">INR Order Totals</p>
          <div className="flex justify-between text-[#594A6B]">
            <span>Subtotal</span>
            <span className="font-mono">{formatInr(order.subtotalInr)}</span>
          </div>
          <div className="flex justify-between text-[#594A6B]">
            <span>Gift Wrapping</span>
            <span className="font-mono">{formatInr(order.giftWrapChargeInr)}</span>
          </div>
          <div className="flex justify-between text-[#594A6B]">
            <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
            <span className="font-mono text-[#FF4D8D]">-{formatInr(order.discountInr)}</span>
          </div>
          <div className="flex justify-between text-[#594A6B]">
            <span>Delivery ({order.customer.deliveryZoneNameSnapshot})</span>
            <span className="font-mono">{formatInr(order.deliveryChargeInr)}</span>
          </div>
          <div className="flex justify-between border-t border-[#EBD8FF] pt-2 text-sm font-extrabold text-[#2B0B4E]">
            <span>Grand Total</span>
            <span className="font-mono text-[#6A11CB]">{formatInr(order.grandTotalInr)}</span>
          </div>
        </div>
      </div>

      {/* Status History */}
      <div className="gk-card rounded-3xl p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-[#2B0B4E]">
          <Clock className="h-4 w-4 text-[#6A11CB]" />
          <span>Timestamped Order Status History</span>
        </h2>
        <ol className="space-y-3 border-l-2 border-[#EBD8FF] pl-5">
          {order.statusHistory.map((entry, idx) => (
            <li key={`${entry.timestamp}-${idx}`} className="relative text-xs">
              <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-[#6A11CB]" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#2B0B4E]">{entry.status}</span>
                <span className="font-mono text-[11px] text-[#7B6496]">
                  {formatDateTime(entry.timestamp)} · {entry.updatedBy}
                </span>
              </div>
              {entry.note && <p className="mt-0.5 text-[#594A6B]">{entry.note}</p>}
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/my-orders">
            <Button variant="glass" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to My Orders</span>
            </Button>
          </Link>
          <Link to={`/track-order?order=${order.orderNumber}`}>
            <Button variant="primary" size="sm">
              Track Order Live View
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * #15 SAVED ADDRESSES PAGE (/addresses) — JALCHAK ONLY
 * ========================================================================== */
export function SavedAddressesPage() {
  const { data: addresses } = useSavedAddresses();
  const { data: settings } = useStoreSettings();
  const { pushToast } = useToast();

  const activeZones = (settings?.deliveryZones ?? []).filter((z) => z.isActive);
  const [label, setLabel] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [area, setArea] = useState('');
  const [deliveryZoneId, setDeliveryZoneId] = useState('zone-jalchak');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nameRes = validateRequired(fullName, 'Full name');
    if (!nameRes.valid) return setError(nameRes.error!);
    const phoneRes = validateIndianPhone(phone);
    if (!phoneRes.valid) return setError(phoneRes.error!);
    const emailRes = validateEmail(email);
    if (!emailRes.valid) return setError(emailRes.error!);
    const addrRes = validateRequired(addressLine1, 'Street address');
    if (!addrRes.valid) return setError(addrRes.error!);
    const pinRes = validateIndianPincode(pincode);
    if (!pinRes.valid) return setError(pinRes.error!);

    const zone = activeZones.find((z) => z.id === deliveryZoneId) ?? activeZones[0];
    if (!zone) return setError('Please select a serviceable delivery zone.');

    const payload: SavedAddress = {
      id: `addr-${Date.now()}`,
      label: label.trim() || `${zone.name} Address`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      addressLine1: addressLine1.trim(),
      area: area.trim() || zone.name,
      deliveryZoneId: zone.id,
      city: zone.name,
      state: zone.state,
      pincode: pincode.trim(),
      isDefault,
      createdAt: new Date().toISOString(),
    };

    await services.community.saveAddress(payload);
    setFullName('');
    setPhone('');
    setEmail('');
    setAddressLine1('');
    setArea('');
    setPincode('');
    pushToast({
      title: 'Address saved locally',
      description: `Available for one-tap selection during Demo Checkout (${zone.name}).`,
      variant: 'success',
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#6E5B85]">
        <Link to="/" className="hover:text-[#6A11CB]">Home</Link>
        <span>/</span>
        <Link to="/account" className="hover:text-[#6A11CB]">Account</Link>
        <span>/</span>
        <span className="font-bold text-[#2B0B4E]">Saved Addresses</span>
      </nav>

      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-6 sm:p-8">
        <p className="text-xs font-bold text-[#FF4D8D]">Jalchak Service Zone</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#3B0764]">Saved Delivery Addresses</h1>
        <p className="mt-1 text-sm text-[#4B2C70]">
          Store frequently used Jalchak addresses locally for faster Demo Checkout.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Saved List */}
        <div className="space-y-3 lg:col-span-6">
          <h2 className="text-sm font-extrabold text-[#2B0B4E]">
            Your Addresses ({addresses.length})
          </h2>
          {addresses.length === 0 ? (
            <EmptyState
              title="No saved addresses yet"
              description="Add a Jalchak delivery address using the form."
            />
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className={`rounded-2xl border p-4 shadow-xs ${
                  addr.isDefault
                    ? 'border-[#6A11CB] bg-[#FAF6FF]'
                    : 'border-[#EBD8FF] bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#FF4D8D]" />
                    <span className="text-sm font-bold text-[#2B0B4E]">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-[#6A11CB] px-2 py-0.5 text-[10px] font-bold text-white">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => void services.community.setDefaultAddress(addr.id)}
                        className="text-[11px] font-bold text-[#6A11CB] hover:underline"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void services.community.deleteAddress(addr.id)}
                      aria-label={`Delete ${addr.label}`}
                      className="text-[#8C75A8] hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold text-[#2B0B4E]">{addr.fullName}</p>
                <p className="mt-0.5 text-xs text-[#594A6B]">
                  {addr.addressLine1}, {addr.area}
                </p>
                <p className="text-xs font-semibold text-[#6A11CB]">
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
                <p className="mt-1 text-[11px] text-[#7B6496]">
                  {addr.phone} · {addr.email}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Address Form */}
        <form
          onSubmit={(e) => void handleSaveAddress(e)}
          className="gk-card rounded-3xl p-6 space-y-4 lg:col-span-6"
        >
          <h2 className="flex items-center gap-2 text-base font-extrabold text-[#2B0B4E]">
            <Plus className="h-4 w-4 text-[#FF4D8D]" />
            <span>Add New Address</span>
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#2B0B4E]">Address Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Home / Office / Parents"
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B0B4E]">Serviceable City *</label>
              <select
                value={deliveryZoneId}
                onChange={(e) => setDeliveryZoneId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
              >
                {activeZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.state})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B0B4E]">Recipient Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B0B4E]">Mobile Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2B0B4E]">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2B0B4E]">Street / Flat Address *</label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B0B4E]">Area / Locality</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Jalchak Bazar / Station Para"
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B0B4E]">6-Digit PIN Code *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="713216 / 700045"
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-xs focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#4A3862]">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 accent-[#6A11CB]"
            />
            <span>Set as default demo delivery address</span>
          </label>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth variant="primary">
            Save Delivery Address
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
 * #24 CUSTOMIZATION GUIDE PAGE (/customization-guide)
 * ========================================================================== */
export function CustomizationGuidePage() {
  const { data: settings } = useStoreSettings();

  const steps = [
    {
      step: '01',
      title: 'Pick Your Base Gift & Style',
      body: 'Choose from Coffee Mugs (Normal, Magic, Photo, Couple, Name Printed, Color Changing), T-shirt Prints (Regular, Infinity, Leather Print, Couple, Name, Oversized, Polo), or Photo Frames (Normal, LED Lighting, Stone Print, Crystal, Collage, Wooden, Acrylic).',
      Icon: Sparkles,
      img: STUDIO_MEDIA.coffeeMug,
    },
    {
      step: '02',
      title: 'Add Name, Date or Dedication Note',
      body: 'Enter exact spelling, dates, or quotes inside the personalization box on the product page. Your exact text is frozen into your order snapshot.',
      Icon: PencilLine,
      img: STUDIO_MEDIA.tshirtPrint,
    },
    {
      step: '03',
      title: 'Attach a Bright, High-Resolution Photo',
      body: 'Upload a clear front-facing photo to preview directly on the product page. In Demo Mode, photo previews remain local to your browser until Supabase Storage is connected.',
      Icon: Camera,
      img: STUDIO_MEDIA.photoFrame,
    },
    {
      step: '04',
      title: 'Configure Boutique Gift Wrapping',
      body: 'In your Gift Bag, toggle Gift Wrapping to choose Royal Lavender Silk, Rose Pink Celebration, Minimal Pearl White, or Festive Keepsake Foil with a personal message card.',
      Icon: Gift,
      img: STUDIO_MEDIA.giftBox,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#6E5B85]">
        <Link to="/" className="hover:text-[#6A11CB]">Home</Link>
        <span>/</span>
        <span className="font-bold text-[#2B0B4E]">Customization Guide</span>
      </nav>

      <div className="gk-promo-gradient overflow-hidden rounded-3xl border border-[#EBD8FF] p-6 sm:p-9">
        <div className="grid items-center gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#FF4D8D]">
              <Star className="h-3.5 w-3.5" />
              <span>Personalization &amp; Print Tips</span>
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-[#3B0764] sm:text-4xl">
              {settings?.pageContent?.customizationHeadline ?? 'How GiftKart Customization Works'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#4B2C70]">
              {settings?.pageContent?.customizationNote ??
                'Personalize mugs, T-shirts, illuminated lamps, and photo frames in minutes with instant previews and boutique gift wrapping.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/customize">
                <Button variant="accent">Start Customizing Gifts →</Button>
              </Link>
              <Link to="/faq">
                <Button variant="glass">Read FAQ</Button>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <img
              src={BRAND_ASSETS.serviceHighlightsBanner}
              alt="GiftKart personalization and service highlights"
              referrerPolicy="no-referrer"
              className="w-full rounded-2xl border border-white/80 shadow-md"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {steps.map(({ step, title, body, Icon, img }) => (
          <div key={step} className="gk-card overflow-hidden rounded-3xl p-5 flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF]">
              <ProductImage src={img} alt={title} className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#F4EBFF] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#6A11CB]">
                  Step {step}
                </span>
                <Icon className="h-4 w-4 text-[#FF4D8D]" />
              </div>
              <h2 className="mt-1.5 text-base font-extrabold text-[#2B0B4E]">{title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#594A6B]">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-[#EBD8FF] bg-[#FAF6FF] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#6A11CB]" />
          <div className="text-xs text-[#4A3862]">
            <p className="font-bold text-[#2B0B4E]">
              Serving Jalchak · Demo Mode Notice
            </p>
            <p className="mt-0.5">
              All customizations and gift wrapping notes are stored safely inside each Demo Order snapshot.
            </p>
          </div>
        </div>
        <Link to="/shop">
          <Button variant="primary" size="sm">
            Explore All 15 Categories
          </Button>
        </Link>
      </div>
    </div>
  );
}
