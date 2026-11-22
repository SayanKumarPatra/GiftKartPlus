import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Gift,
  MapPin,
  Minus,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Tag,
  Trash2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  useGiftWrapConfig,
  useSavedAddresses,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import type { DemoOrder } from '../../types';
import { formatDateTime, formatInr } from '../../utils/format';
import {
  validateEmail,
  validateIndianPhone,
  validateIndianPincode,
  validateRequired,
} from '../../utils/validation';
import { ProductImage } from '../../components/ui/ProductImage';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

export function CartPage() {
  const {
    items,
    giftWrap,
    subtotalInr,
    giftWrapChargeInr,
    updateQuantity,
    removeItem,
    setGiftWrapEnabled,
    selectGiftWrapStyle,
    updateGiftWrapDetails,
  } = useCart();
  const { data: giftWrapConfig } = useGiftWrapConfig();
  const { pushToast } = useToast();

  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>();

  const activeStyles = giftWrapConfig?.styles.filter((s) => s.isActive) ?? [];

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const res = await services.promotions.validateCoupon(couponInput, subtotalInr);
    if (!res.valid) {
      setCouponDiscount(0);
      setAppliedCouponCode(undefined);
      pushToast({ title: 'Coupon not applied', description: res.message, variant: 'error' });
      return;
    }
    setCouponDiscount(res.discountInr);
    setAppliedCouponCode(res.coupon?.code);
    pushToast({ title: 'Coupon Applied', description: res.message, variant: 'success' });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your Gift Bag is empty"
        description="Add personalized mugs, printed T-shirts, photo frames, or keepsake boxes to begin crafting your gift."
        icon={<ShoppingBag className="h-5 w-5" />}
        action={
          <Link to="/shop">
            <Button size="md">Explore GiftKart Shop</Button>
          </Link>
        }
      />
    );
  }

  const grandEstimate = Math.max(0, subtotalInr + giftWrapChargeInr - couponDiscount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#3B0764]">Your Gift Bag</h1>
        <p className="mt-1 text-sm text-[#594A6B]">
          Review items, customize gift wrapping &amp; personal message card before placing your demo order.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-5 lg:col-span-7">
          {/* Item List */}
          <div className="gk-card divide-y divide-[#EBD8FF] rounded-3xl p-5">
            {items.map((item) => (
              <div key={item.cartItemId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <div className="h-24 w-28 shrink-0 overflow-hidden rounded-2xl border border-[#EBD8FF]">
                  <ProductImage
                    src={item.image}
                    alt={item.productName}
                    aspectClass="aspect-[4/3]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/product/${item.productSlug}`}
                      className="text-sm font-bold text-[#2B0B4E] hover:text-[#6A11CB]"
                    >
                      {item.productName}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.cartItemId)}
                      aria-label={`Remove ${item.productName}`}
                      className="rounded-lg p-1 text-[#8B7AA0] hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-[#6E5B85]">SKU: {item.productSku}</p>
                  {Object.keys(item.selectedVariants).length > 0 && (
                    <p className="mt-1 text-xs text-[#594A6B]">
                      {Object.entries(item.selectedVariants)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}
                  {item.personalizationDetails && (
                    <p className="mt-1 text-xs font-semibold text-[#6A11CB]">
                      Custom Note: {item.personalizationDetails}
                    </p>
                  )}
                  {item.customPhotoFileName && (
                    <p className="mt-0.5 text-xs font-semibold text-[#FF4D8D]">
                      Photo Preview Attached: {item.customPhotoFileName}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-[#EBD8FF] bg-[#F8F2FF]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center text-[#2B0B4E]"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[28px] text-center font-mono text-xs font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center text-[#2B0B4E]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-mono text-sm font-extrabold tabular-nums text-[#6A11CB]">
                      {formatInr(item.unitPriceInr * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Configurable Gift Wrapping Module */}
          {giftWrapConfig?.globallyEnabled && (
            <div className="gk-card space-y-4 rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF0F6] text-[#FF4D8D]">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#3B0764]">
                      Boutique Gift Wrapping
                    </h2>
                    <p className="text-xs text-[#594A6B]">
                      Choose wrapping paper style, recipient name &amp; heartfelt message card.
                    </p>
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#EBD8FF] bg-[#F8F2FF] px-4 py-2 text-xs font-bold text-[#6A11CB]">
                  <input
                    type="checkbox"
                    checked={giftWrap.enabled}
                    onChange={(e) =>
                      setGiftWrapEnabled(e.target.checked, activeStyles[0])
                    }
                    className="h-4 w-4 accent-[#6A11CB]"
                  />
                  <span>{giftWrap.enabled ? 'Enabled' : 'Enable Gift Wrap'}</span>
                </label>
              </div>

              {giftWrap.enabled && (
                <div className="space-y-4 border-t border-[#EBD8FF] pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeStyles.map((style) => {
                      const active = giftWrap.styleId === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => selectGiftWrapStyle(style)}
                          className={`rounded-2xl border p-3.5 text-left transition-all ${
                            active
                              ? 'border-[#6A11CB] bg-[#F8F2FF] shadow-sm'
                              : 'border-[#EBD8FF] bg-white hover:border-[#FF4D8D]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-xs font-bold text-[#2B0B4E]">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: style.accentColorHex }}
                              />
                              {style.name}
                            </span>
                            <span className="font-mono text-xs font-extrabold tabular-nums text-[#6A11CB]">
                              +{formatInr(style.chargeInr)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] leading-snug text-[#594A6B]">
                            {style.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[#2B0B4E]">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={giftWrap.recipientName}
                        onChange={(e) =>
                          updateGiftWrapDetails({ recipientName: e.target.value })
                        }
                        placeholder="Who is receiving this gift?"
                        className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          Gift Message Card
                        </label>
                        <span className="font-mono text-[10px] text-[#6E5B85]">
                          {giftWrap.giftMessage.length}/{giftWrapConfig.maxMessageLength}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        maxLength={giftWrapConfig.maxMessageLength}
                        value={giftWrap.giftMessage}
                        onChange={(e) =>
                          updateGiftWrapDetails({ giftMessage: e.target.value })
                        }
                        placeholder="Write a personal note to print on the card..."
                        className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2 text-sm text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Summary Column */}
        <div className="gk-card space-y-5 rounded-3xl p-6 lg:col-span-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold text-[#3B0764]">Order Summary</h2>

          {/* Coupon Form */}
          <form onSubmit={(e) => void handleApplyCoupon(e)} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF4D8D]" />
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Try KAHANI10 or GIFT100"
                className="min-h-[40px] w-full rounded-xl border border-[#EBD8FF] bg-[#F8F2FF] pl-9 pr-3 font-mono text-xs font-bold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
            <Button type="submit" variant="glass" size="sm">
              Apply
            </Button>
          </form>

          {/* Gift Wrapping Summary Block */}
          {giftWrap.enabled && (
            <div className="rounded-2xl border border-[#EBD8FF] bg-[#FFF0F6]/70 p-3.5 text-xs">
              <p className="font-bold text-[#6A11CB]">Gift Wrapping Summary</p>
              <p className="mt-1 text-[#2B0B4E]">
                Style: <strong>{giftWrap.styleNameSnapshot}</strong> ({formatInr(giftWrapChargeInr)})
              </p>
              {giftWrap.recipientName && (
                <p className="mt-0.5 text-[#594A6B]">Recipient: {giftWrap.recipientName}</p>
              )}
              {giftWrap.giftMessage && (
                <p className="mt-1 italic text-[#594A6B]">&ldquo;{giftWrap.giftMessage}&rdquo;</p>
              )}
            </div>
          )}

          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between text-[#594A6B]">
              <span>Items Subtotal</span>
              <span className="font-mono font-bold tabular-nums text-[#2B0B4E]">
                {formatInr(subtotalInr)}
              </span>
            </div>
            <div className="flex justify-between text-[#594A6B]">
              <span>Gift Wrapping</span>
              <span className="font-mono font-bold tabular-nums text-[#2B0B4E]">
                {giftWrap.enabled ? formatInr(giftWrapChargeInr) : '₹0'}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({appliedCouponCode})</span>
                <span className="font-mono font-bold tabular-nums">
                  -{formatInr(couponDiscount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#EBD8FF] pt-3 text-base font-extrabold text-[#3B0764]">
              <span>Estimated Total</span>
              <span className="font-mono tabular-nums text-[#6A11CB]">
                {formatInr(grandEstimate)}
              </span>
            </div>
          </dl>

          <Link
            to="/checkout"
            state={{ couponCode: appliedCouponCode, couponDiscount }}
            className="gk-btn-pink flex min-h-[48px] w-full items-center justify-center rounded-full text-sm font-bold"
          >
            Proceed to Demo Checkout →
          </Link>

          <p className="text-center text-[11px] text-[#6E5B85]">
            Demo Order Placement only · Delivery calculated for Jalchak at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const { items, giftWrap, subtotalInr, giftWrapChargeInr, clearCart } = useCart();
  const { customerAccount } = useAuth();
  const { data: settings } = useStoreSettings();
  const { data: savedAddresses } = useSavedAddresses();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const activeZones = settings?.deliveryZones.filter((z) => z.isActive) ?? [];
  const paymentDescriptor = services.paymentGateway.getDescriptor();

  const [fullName, setFullName] = useState(customerAccount?.fullName ?? '');
  const [phone, setPhone] = useState(customerAccount?.phone ?? '');
  const [email, setEmail] = useState(customerAccount?.email ?? '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [deliveryZoneId, setDeliveryZoneId] = useState('');
  const [pincode, setPincode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountInr, setDiscountInr] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!deliveryZoneId && activeZones.length > 0) {
      const preferred = activeZones.find(
        (z) => z.name.toLowerCase() === (customerAccount?.defaultCity ?? '').toLowerCase()
      );
      setDeliveryZoneId((preferred ?? activeZones[0]).id);
    }
  }, [activeZones, deliveryZoneId, customerAccount?.defaultCity]);

  const selectedZone = activeZones.find((z) => z.id === deliveryZoneId) ?? activeZones[0];
  const deliveryChargeInr = selectedZone
    ? subtotalInr >= selectedZone.freeDeliveryAboveInr
      ? 0
      : selectedZone.chargeInr
    : 0;
  const grandTotalInr = Math.max(
    0,
    subtotalInr + giftWrapChargeInr + deliveryChargeInr - discountInr
  );

  if (items.length === 0) {
    return (
      <EmptyState
        title="No items in your Gift Bag"
        description="Add a gift to your bag before proceeding to Demo Checkout."
        action={
          <Link to="/shop">
            <Button size="sm">Return to Shop</Button>
          </Link>
        }
      />
    );
  }

  async function applyCheckoutCoupon() {
    const res = await services.promotions.validateCoupon(couponCode, subtotalInr);
    if (!res.valid) {
      setDiscountInr(0);
      pushToast({ title: 'Coupon Invalid', description: res.message, variant: 'error' });
      return;
    }
    setDiscountInr(res.discountInr);
    setCouponCode(res.coupon?.code ?? couponCode);
    pushToast({ title: 'Coupon Applied', description: res.message, variant: 'success' });
  }

  async function handlePlaceDemoOrder(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const nameCheck = validateRequired(fullName, 'Full name');
    if (!nameCheck.valid) errors.fullName = nameCheck.error!;

    const phoneCheck = validateIndianPhone(phone);
    if (!phoneCheck.valid) errors.phone = phoneCheck.error!;

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) errors.email = emailCheck.error!;

    const addrCheck = validateRequired(addressLine1, 'Street address');
    if (!addrCheck.valid) errors.addressLine1 = addrCheck.error!;

    const pinCheck = validateIndianPincode(pincode);
    if (!pinCheck.valid) errors.pincode = pinCheck.error!;

    if (!selectedZone) {
      errors.deliveryZoneId = 'Please select a serviceable delivery city.';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      pushToast({
        title: 'Please check your delivery details',
        description: 'Correct the highlighted fields before placing your demo order.',
        variant: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await services.orders.createDemoOrder({
        customerAccountId: customerAccount?.id,
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          deliveryZoneId: selectedZone.id,
          deliveryZoneNameSnapshot: selectedZone.name,
          city: selectedZone.name,
          state: selectedZone.state,
          pincode: pincode.trim(),
        },
        items: items.map((item) => ({
          productId: item.productId,
          productNameSnapshot: item.productName,
          productSkuSnapshot: item.productSku,
          unitPriceInrSnapshot: item.unitPriceInr,
          quantity: item.quantity,
          lineTotalInr: item.unitPriceInr * item.quantity,
          selectedVariants: { ...item.selectedVariants },
          personalizationDetails: item.personalizationDetails,
          customPhotoFileName: item.customPhotoFileName,
          imageSnapshot: item.image,
        })),
        giftWrap,
        subtotalInr,
        giftWrapChargeInr,
        discountInr,
        deliveryChargeInr,
        grandTotalInr,
        couponCode: discountInr > 0 ? couponCode.trim().toUpperCase() : undefined,
      });

      clearCart();
      pushToast({
        title: `Demo Order ${created.orderNumber} Placed`,
        description: 'Saved locally with immutable item & gift-wrap snapshots.',
        variant: 'success',
      });
      navigate(`/order-confirmation/${created.orderNumber}`, { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handlePlaceDemoOrder(e)} className="space-y-6">
      <div>
        <p className="text-xs font-bold text-[#FF4D8D]">
          Demo Order Placement ONLY · No Real Payment Collected
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#3B0764]">Demo Checkout</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-5 lg:col-span-7">
          {/* Customer & Jalchak Delivery Address */}
          <div className="gk-card space-y-4 rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-[#3B0764]">
                Delivery Details (Jalchak)
              </h2>
              <Link
                to="/addresses"
                className="text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
              >
                Manage Saved Addresses →
              </Link>
            </div>

            {savedAddresses.length > 0 && (
              <div className="rounded-2xl border border-[#EBD8FF] bg-[#FAF5FF] p-3.5">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6A11CB]">
                  <MapPin className="h-3.5 w-3.5 text-[#FF4D8D]" />
                  <span>Quick-Fill Saved Address (Local Demo)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setFullName(addr.fullName);
                        setPhone(addr.phone);
                        if (addr.email) setEmail(addr.email);
                        setAddressLine1(addr.addressLine1);
                        setAddressLine2(addr.area ?? '');
                        setPincode(addr.pincode);
                        const matchedZone = activeZones.find(
                          (z) =>
                            z.id === addr.deliveryZoneId ||
                            z.name.toLowerCase() === addr.city.toLowerCase()
                        );
                        if (matchedZone) {
                          setDeliveryZoneId(matchedZone.id);
                        }
                        pushToast({
                          title: `Filled "${addr.label}" Address`,
                          description: `${addr.city} — ${addr.pincode}`,
                          variant: 'info',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#6A11CB]/25 bg-white px-3 py-1.5 text-xs font-bold text-[#3B0764] transition hover:border-[#FF4D8D] hover:text-[#FF4D8D]"
                    >
                      <span>{addr.label}</span>
                      <span className="text-[10px] font-semibold text-[#6E5B85]">
                        ({addr.city})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
                {formErrors.fullName && (
                  <p className="mt-1 text-xs text-rose-700">{formErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  Mobile Number (India) *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9382040746"
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-rose-700">{formErrors.phone}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#2B0B4E]">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-rose-700">{formErrors.email}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  House / Flat &amp; Street Address *
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g., 14/B City Centre Phase II"
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
                {formErrors.addressLine1 && (
                  <p className="mt-1 text-xs text-rose-700">{formErrors.addressLine1}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  Delivery Zone *
                </label>
                <select
                  value={deliveryZoneId}
                  onChange={(e) => setDeliveryZoneId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                >
                  {activeZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}, {zone.state} ({formatInr(zone.chargeInr)} · Free above {formatInr(zone.freeDeliveryAboveInr)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  PIN Code (6 digits) *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="713216 / 700064"
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
                />
                {formErrors.pincode && (
                  <p className="mt-1 text-xs text-rose-700">{formErrors.pincode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Honest Payment Mode Card (Demo Order ONLY — No COD, Cashfree Disconnected) */}
          <div className="gk-card space-y-3 rounded-3xl p-6">
            <h2 className="text-lg font-extrabold text-[#3B0764]">
              Order Mode &amp; Payment Status
            </h2>

            <div className="rounded-2xl border-2 border-[#6A11CB] bg-[#F8F2FF] p-4">
              <p className="text-sm font-bold text-[#3B0764]">
                Demo Order Placement (Active Local Preview)
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#594A6B]">
                Records a complete demo order locally in browser storage with frozen product, price, SKU, customization, and gift-wrapping snapshots. No real payment is charged and Cash on Delivery is not enabled at this stage.
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border border-[#EBD8FF] bg-white p-4 opacity-75">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D8D]" />
              <div className="text-xs">
                <p className="font-bold text-[#2B0B4E]">
                  Cashfree Online Payments — {paymentDescriptor.statusLabel}
                </p>
                <p className="mt-0.5 text-[#594A6B]">{paymentDescriptor.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="gk-card space-y-5 rounded-3xl p-6 lg:col-span-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold text-[#3B0764]">
            Items &amp; Gift Wrapping Summary
          </h2>

          <ul className="divide-y divide-[#EBD8FF] text-xs">
            {items.map((item) => (
              <li key={item.cartItemId} className="py-2.5 first:pt-0">
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-[#2B0B4E]">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-[#6A11CB]">
                    {formatInr(item.unitPriceInr * item.quantity)}
                  </span>
                </div>
                {item.personalizationDetails && (
                  <p className="mt-0.5 text-[#6A11CB]">Note: {item.personalizationDetails}</p>
                )}
                {item.customPhotoFileName && (
                  <p className="text-[#FF4D8D]">Photo: {item.customPhotoFileName}</p>
                )}
              </li>
            ))}
          </ul>

          {giftWrap.enabled && (
            <div className="rounded-2xl border border-[#EBD8FF] bg-[#FFF0F6]/70 p-3.5 text-xs">
              <p className="font-bold text-[#6A11CB]">
                Gift Wrapping · {giftWrap.styleNameSnapshot} ({formatInr(giftWrapChargeInr)})
              </p>
              {giftWrap.recipientName && (
                <p className="mt-1 text-[#2B0B4E]">Recipient: {giftWrap.recipientName}</p>
              )}
              {giftWrap.giftMessage && (
                <p className="mt-0.5 italic text-[#594A6B]">&ldquo;{giftWrap.giftMessage}&rdquo;</p>
              )}
            </div>
          )}

          {/* Promo Code */}
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Coupon code (KAHANI10)"
              className="min-h-[38px] flex-1 rounded-xl border border-[#EBD8FF] bg-[#F8F2FF] px-3 font-mono text-xs font-bold text-[#2B0B4E]"
            />
            <Button type="button" variant="glass" size="sm" onClick={() => void applyCheckoutCoupon()}>
              Apply
            </Button>
          </div>

          <dl className="space-y-2 border-t border-[#EBD8FF] pt-3 text-sm">
            <div className="flex justify-between text-[#594A6B]">
              <span>Subtotal</span>
              <span className="font-mono font-bold tabular-nums">{formatInr(subtotalInr)}</span>
            </div>
            <div className="flex justify-between text-[#594A6B]">
              <span>Gift Wrapping</span>
              <span className="font-mono font-bold tabular-nums">
                {formatInr(giftWrapChargeInr)}
              </span>
            </div>
            <div className="flex justify-between text-[#594A6B]">
              <span>Delivery ({selectedZone?.name ?? 'Zone'})</span>
              <span className="font-mono font-bold tabular-nums">
                {deliveryChargeInr === 0 ? 'FREE' : formatInr(deliveryChargeInr)}
              </span>
            </div>
            {discountInr > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span className="font-mono font-bold tabular-nums">-{formatInr(discountInr)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#EBD8FF] pt-3 text-base font-extrabold text-[#3B0764]">
              <span>Grand Total</span>
              <span className="font-mono tabular-nums text-[#6A11CB]">
                {formatInr(grandTotalInr)}
              </span>
            </div>
          </dl>

          <button
            type="submit"
            disabled={submitting}
            className="gk-btn-purple flex min-h-[48px] w-full items-center justify-center rounded-full text-sm font-bold disabled:opacity-50"
          >
            {submitting ? 'Placing Demo Order...' : `Place Demo Order · ${formatInr(grandTotalInr)}`}
          </button>
        </div>
      </div>
    </form>
  );
}

export function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (orderNumber) {
      void services.orders
        .getOrderByNumber(orderNumber)
        .then((res) => {
          if (active) setOrder(res);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [orderNumber]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-[#F8F2FF]" />;
  }

  if (!order) {
    return (
      <EmptyState
        title="Order receipt not found"
        description="Look up your order number on the Track Order page."
        action={
          <Link to="/track-order">
            <Button size="sm">Go to Track Order</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-3 font-mono text-xs font-bold text-[#FF4D8D]">
          DEMO ORDER CONFIRMED · NO PAYMENT COLLECTED
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#3B0764]">
          Thank You, {order.customer.fullName}!
        </h1>
        <p className="mt-2 text-sm text-[#4B2C70]">
          Order <span className="font-mono font-extrabold text-[#6A11CB]">{order.orderNumber}</span> placed on{' '}
          {formatDateTime(order.createdAt)} for delivery in{' '}
          <strong>{order.customer.deliveryZoneNameSnapshot}</strong>.
        </p>
      </div>

      <div className="gk-card space-y-5 rounded-3xl p-6">
        <h2 className="text-base font-extrabold text-[#3B0764]">
          Immutable Order Snapshot
        </h2>
        <ul className="divide-y divide-[#EBD8FF] text-sm">
          {order.items.map((item, idx) => (
            <li key={`${item.productSkuSnapshot}-${idx}`} className="py-3">
              <div className="flex justify-between gap-2">
                <span className="font-bold text-[#2B0B4E]">
                  {item.productNameSnapshot} × {item.quantity}
                </span>
                <span className="font-mono font-bold tabular-nums text-[#6A11CB]">
                  {formatInr(item.lineTotalInr)}
                </span>
              </div>
              <p className="font-mono text-xs text-[#6E5B85]">
                SKU: {item.productSkuSnapshot} · Unit: {formatInr(item.unitPriceInrSnapshot)}
              </p>
              {item.personalizationDetails && (
                <p className="mt-0.5 text-xs text-[#6A11CB]">
                  Personalization: {item.personalizationDetails}
                </p>
              )}
            </li>
          ))}
        </ul>

        {order.giftWrap.enabled && (
          <div className="rounded-2xl border border-[#EBD8FF] bg-[#FFF0F6]/70 p-4 text-xs">
            <p className="font-bold text-[#6A11CB]">
              Gift Wrapping: {order.giftWrap.styleNameSnapshot} ({formatInr(order.giftWrap.chargeInrSnapshot)})
            </p>
            {order.giftWrap.recipientName && (
              <p className="mt-1 text-[#2B0B4E]">Recipient: {order.giftWrap.recipientName}</p>
            )}
            {order.giftWrap.giftMessage && (
              <p className="mt-0.5 italic text-[#594A6B]">&ldquo;{order.giftWrap.giftMessage}&rdquo;</p>
            )}
          </div>
        )}

        <div className="flex justify-between border-t border-[#EBD8FF] pt-4 text-lg font-extrabold text-[#3B0764]">
          <span>Grand Total</span>
          <span className="font-mono tabular-nums text-[#6A11CB]">
            {formatInr(order.grandTotalInr)}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link to={`/track-order?order=${order.orderNumber}`}>
            <Button>Track This Order</Button>
          </Link>
          <Link to="/my-orders">
            <Button variant="glass">View My Orders</Button>
          </Link>
          <Link to="/shop">
            <Button variant="ghost">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
