import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgePercent,
  Ban,
  Briefcase,
  Check,
  ChevronRight,
  CreditCard,
  Gift,
  Home,
  Lock,
  MapPin,
  Minus,
  MoreHorizontal,
  Package,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Ticket,
  Trash2,
  Truck,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  useCoupons,
  useGiftWrapConfig,
  useProducts,
  useSavedAddresses,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { STORAGE_KEYS, readStorage } from '../../storage/localStorageEngine';
import type { DemoOrder, SavedAddress } from '../../types';
import { formatDateTime, formatInr } from '../../utils/format';
import {
  validateEmail,
  validateIndianPhone,
  validateIndianPincode,
  validateRequired,
} from '../../utils/validation';
import {
  INDIAN_STATES,
  formatFullAddress,
  lookupIndianPin,
  normalizeAddressType,
  pickSavedAddress,
  type AddressTypeOption,
} from '../../utils/storefrontHelpers';
import { ProductImage } from '../../components/ui/ProductImage';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { MobileCartPage } from '../../components/storefront/MobileCartPage';
import { MobileCheckoutPage } from '../../components/storefront/MobileCheckoutPage';

function normalizePhoneDigits(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

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
  const { data: products } = useProducts();
  const { data: coupons } = useCoupons();

  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>();
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const activeStyles = giftWrapConfig?.styles.filter((s) => s.isActive) ?? [];
  const activeCoupons = useMemo(
    () => coupons.filter((c) => c.isActive),
    [coupons]
  );

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const pricing = useMemo(() => {
    let totalMrp = 0;
    for (const item of items) {
      const matched = productById.get(item.productId);
      const mrp =
        matched?.compareAtPriceInr && matched.compareAtPriceInr > item.unitPriceInr
          ? matched.compareAtPriceInr
          : item.unitPriceInr;
      totalMrp += mrp * item.quantity;
    }
    const productSavings = Math.max(0, totalMrp - subtotalInr);
    const totalPayable = Math.max(0, subtotalInr + giftWrapChargeInr - couponDiscount);
    return {
      totalMrp,
      productSavings,
      totalSavings: productSavings + couponDiscount,
      totalPayable,
    };
  }, [items, productById, subtotalInr, giftWrapChargeInr, couponDiscount]);

  async function applyCouponCode(codeToApply: string) {
    const trimmed = codeToApply.trim().toUpperCase();
    if (!trimmed) {
      setCouponFeedback({ type: 'error', message: 'Please enter a coupon code.' });
      return;
    }
    const res = await services.promotions.validateCoupon(trimmed, subtotalInr);
    if (!res.valid) {
      setCouponDiscount(0);
      setAppliedCouponCode(undefined);
      setCouponFeedback({ type: 'error', message: res.message });
      return;
    }
    setCouponInput(res.coupon?.code ?? trimmed);
    setCouponDiscount(res.discountInr);
    setAppliedCouponCode(res.coupon?.code ?? trimmed);
    setCouponFeedback({ type: 'success', message: res.message });
  }

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    await applyCouponCode(couponInput);
  }

  function handleRemoveCoupon() {
    setCouponInput('');
    setCouponDiscount(0);
    setAppliedCouponCode(undefined);
    setCouponFeedback(null);
  }

  return (
    <>
      {/* Normal Mobile (< 900px): Dedicated Reference-Matched Mobile Cart Page */}
      <div className="-mx-3.5 -my-4 sm:-mx-6 sm:-my-5 lg:hidden">
        <MobileCartPage />
      </div>

      {/* Desktop & Laptop (>= 900px): Full Parity with Mobile Cart */}
      <div className="hidden lg:block">
        {items.length === 0 ? (
          <EmptyState
            title="Your Gift Bag is empty"
            description="Add personalized mugs, printed T-shirts, photo frames, LED lamps, or curated gift boxes to start your order."
            icon={<ShoppingBag className="h-5 w-5" />}
            action={
              <Link to="/shop">
                <Button size="md">Explore GiftKart Shop</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EFE3FF] pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#1E1035]">
                  Your Shopping Cart
                </h1>
                <p className="mt-0.5 text-[13px] text-[#685782]">
                  {items.reduce((sum, i) => sum + i.quantity, 0)}{' '}
                  {items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? 'item' : 'items'} in
                  your bag · Review items, apply coupons, or add boutique gift wrapping.
                </p>
              </div>
              <Link
                to="/shop"
                className="text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
              >
                Continue Shopping →
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
              {/* Left: Cart Items + Boutique Gift Wrapping */}
              <div className="space-y-5 lg:col-span-7">
                <div className="divide-y divide-[#EFE3FF] rounded-2xl border border-[#EFE3FF] bg-white p-5 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)]">
                  {items.map((item) => {
                    const matchedProduct = productById.get(item.productId);
                    const unitMrp =
                      matchedProduct?.compareAtPriceInr &&
                      matchedProduct.compareAtPriceInr > item.unitPriceInr
                        ? matchedProduct.compareAtPriceInr
                        : undefined;
                    return (
                      <div
                        key={item.cartItemId}
                        className="flex gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <Link
                          to={`/product/${item.productSlug}`}
                          className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#EFE3FF] bg-[#FAF6FF]"
                        >
                          <ProductImage
                            src={item.image}
                            alt={item.productName}
                            aspectClass="aspect-square"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/product/${item.productSlug}`}
                              className="text-sm font-bold text-[#1E1035] hover:text-[#6A11CB]"
                            >
                              {item.productName}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeItem(item.cartItemId)}
                              aria-label={`Remove ${item.productName}`}
                              className="cursor-pointer rounded-lg p-1 text-[#8B7AA0] hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="font-mono text-[11px] text-[#7A6894]">
                            SKU: {item.productSku}
                          </p>
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
                              Photo Attached: {item.customPhotoFileName}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-lg border border-[#DFD2F2] bg-[#FAF6FF]">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.cartItemId, item.quantity - 1)
                                }
                                className="flex h-8 w-8 cursor-pointer items-center justify-center text-[#2B0B4E] hover:text-[#6A11CB]"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-[28px] text-center font-mono text-xs font-bold tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.cartItemId, item.quantity + 1)
                                }
                                className="flex h-8 w-8 cursor-pointer items-center justify-center text-[#2B0B4E] hover:text-[#6A11CB]"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex items-baseline gap-2">
                              {unitMrp && (
                                <span className="font-mono text-xs tabular-nums text-[#8B7AA0] line-through">
                                  {formatInr(unitMrp * item.quantity)}
                                </span>
                              )}
                              <span className="font-mono text-sm font-extrabold tabular-nums text-[#6A11CB]">
                                {formatInr(item.unitPriceInr * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Configurable Boutique Gift Wrapping */}
                {giftWrapConfig?.globallyEnabled && (
                  <div className="space-y-4 rounded-2xl border border-[#EFE3FF] bg-white p-5 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.1)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0F6] text-[#FF4D8D]">
                          <Gift className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-extrabold text-[#1E1035]">
                            Boutique Gift Wrapping
                          </h2>
                          <p className="text-xs text-[#685782]">
                            Add curated gift wrapping, recipient name &amp; a printed message card.
                          </p>
                        </div>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#DFD2F2] bg-[#FAF6FF] px-3.5 py-2 text-xs font-bold text-[#6A11CB]">
                        <input
                          type="checkbox"
                          checked={giftWrap.enabled}
                          onChange={(e) =>
                            setGiftWrapEnabled(e.target.checked, activeStyles[0])
                          }
                          className="h-4 w-4 accent-[#6A11CB]"
                        />
                        <span>{giftWrap.enabled ? 'Enabled' : 'Add Gift Wrap'}</span>
                      </label>
                    </div>

                    {giftWrap.enabled && (
                      <div className="space-y-4 border-t border-[#EFE3FF] pt-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {activeStyles.map((style) => {
                            const active = giftWrap.styleId === style.id;
                            return (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() => selectGiftWrapStyle(style)}
                                className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                                  active
                                    ? 'border-[#6A11CB] bg-[#FAF6FF] shadow-xs'
                                    : 'border-[#EFE3FF] bg-white hover:border-[#6A11CB]/40'
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
                              className="mt-1 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 py-2 text-sm text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-[#2B0B4E]">
                                Gift Message Card
                              </label>
                              <span className="font-mono text-[10px] text-[#7A6894]">
                                {giftWrap.giftMessage.length}/
                                {giftWrapConfig.maxMessageLength}
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
                              className="mt-1 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 py-2 text-sm text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Order Summary & Coupons */}
              <div className="space-y-5 rounded-2xl border border-[#EFE3FF] bg-white p-6 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)] lg:col-span-5 lg:sticky lg:top-28">
                <h2 className="text-lg font-extrabold text-[#1E1035]">Price Details</h2>

                {/* Coupon Input + Quick Chips */}
                <div className="space-y-2.5">
                  <form onSubmit={(e) => void handleApplyCoupon(e)} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A11CB]" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="h-10 w-full rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] pl-9 pr-3 font-mono text-xs font-bold text-[#2B0B4E] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                      />
                    </div>
                    {appliedCouponCode ? (
                      <Button
                        type="button"
                        variant="glass"
                        size="sm"
                        onClick={handleRemoveCoupon}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button type="submit" variant="glass" size="sm">
                        Apply
                      </Button>
                    )}
                  </form>

                  {activeCoupons.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {activeCoupons.slice(0, 3).map((coupon) => (
                        <button
                          key={coupon.id}
                          type="button"
                          onClick={() => void applyCouponCode(coupon.code)}
                          className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold transition-colors ${
                            appliedCouponCode === coupon.code
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-[#EBD8FF] bg-[#FAF6FF] text-[#6A11CB] hover:border-[#6A11CB]'
                          }`}
                        >
                          <Ticket className="h-3 w-3" />
                          <span className="font-mono">{coupon.code}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {couponFeedback && (
                    <p
                      className={`text-xs font-semibold ${
                        couponFeedback.type === 'success'
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {couponFeedback.message}
                    </p>
                  )}
                </div>

                <dl className="space-y-2.5 border-t border-[#EFE3FF] pt-4 text-sm">
                  {pricing.productSavings > 0 && (
                    <>
                      <div className="flex justify-between text-[#594A6B]">
                        <span>Total MRP</span>
                        <span className="font-mono font-semibold tabular-nums text-[#2B0B4E]">
                          {formatInr(pricing.totalMrp)}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount on MRP</span>
                        <span className="font-mono font-bold tabular-nums">
                          -{formatInr(pricing.productSavings)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-[#594A6B]">
                    <span>Items Subtotal</span>
                    <span className="font-mono font-bold tabular-nums text-[#2B0B4E]">
                      {formatInr(subtotalInr)}
                    </span>
                  </div>
                  {giftWrap.enabled && (
                    <div className="flex justify-between text-[#594A6B]">
                      <span>Gift Wrapping ({giftWrap.styleNameSnapshot})</span>
                      <span className="font-mono font-bold tabular-nums text-[#2B0B4E]">
                        {formatInr(giftWrapChargeInr)}
                      </span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Coupon Discount ({appliedCouponCode})</span>
                      <span className="font-mono font-bold tabular-nums">
                        -{formatInr(couponDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#594A6B]">
                    <span>Delivery Charges</span>
                    <span className="font-bold text-emerald-700">FREE</span>
                  </div>
                  <div className="flex justify-between border-t border-[#EFE3FF] pt-3 text-base font-extrabold text-[#1E1035]">
                    <span>Order Total</span>
                    <span className="font-mono tabular-nums text-[#6A11CB]">
                      {formatInr(pricing.totalPayable)}
                    </span>
                  </div>
                </dl>

                {pricing.totalSavings > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs font-bold text-emerald-800">
                    <BadgePercent className="h-4 w-4 shrink-0" />
                    <span>
                      You will save {formatInr(pricing.totalSavings)} on this order.
                    </span>
                  </div>
                )}

                <Link
                  to="/checkout"
                  state={{ couponCode: appliedCouponCode, couponDiscount }}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] text-sm font-bold text-white shadow-[0_10px_24px_-8px_rgba(106,17,203,0.45)] transition-all hover:opacity-95"
                >
                  Proceed to Checkout →
                </Link>

                <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-[#6E5B85]">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Secure Checkout
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-[#6A11CB]" />
                    Cash on Delivery Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

type DesktopCheckoutStep = 1 | 2 | 3;

interface DesktopCheckoutRouterState {
  couponCode?: string;
  couponDiscount?: number;
  selectedAddressId?: string;
}

const DESKTOP_ADDRESS_TYPE_OPTIONS: Array<{
  value: AddressTypeOption;
  label: string;
  Icon: typeof Home;
}> = [
  { value: 'Home', label: 'Home', Icon: Home },
  { value: 'Work', label: 'Work', Icon: Briefcase },
  { value: 'Other', label: 'Other', Icon: MoreHorizontal },
];

export function CheckoutPage() {
  const { items, giftWrap, subtotalInr, giftWrapChargeInr, clearCart } = useCart();
  const { customerAccount } = useAuth();
  const { data: settings } = useStoreSettings();
  const { data: savedAddresses } = useSavedAddresses();
  const { data: products } = useProducts();
  const { data: coupons } = useCoupons();
  const navigate = useNavigate();
  const location = useLocation();
  const routerState = (location.state ?? null) as DesktopCheckoutRouterState | null;

  const activeZones = settings?.deliveryZones.filter((z) => z.isActive) ?? [];
  const activeCoupons = useMemo(() => coupons.filter((c) => c.isActive), [coupons]);

  // Synchronously inspect saved addresses on mount so returning users skip Step 1 directly to Step 2
  const [initialSavedAddress] = useState<SavedAddress | null>(() => {
    const stored = readStorage<SavedAddress[]>(STORAGE_KEYS.SAVED_ADDRESSES, []);
    if (routerState?.selectedAddressId) {
      const matched = stored.find((a) => a.id === routerState.selectedAddressId);
      if (matched) return matched;
    }
    return pickSavedAddress(stored);
  });

  const [step, setStep] = useState<DesktopCheckoutStep>(initialSavedAddress ? 2 : 1);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    initialSavedAddress?.id ?? null
  );

  const [fullName, setFullName] = useState(
    initialSavedAddress?.fullName ?? customerAccount?.fullName ?? ''
  );
  const [phone, setPhone] = useState(
    normalizePhoneDigits(initialSavedAddress?.phone ?? customerAccount?.phone ?? '')
  );
  const [email, setEmail] = useState(
    initialSavedAddress?.email ?? customerAccount?.email ?? ''
  );
  const [addressLine1, setAddressLine1] = useState(
    initialSavedAddress?.addressLine1 ?? ''
  );
  const [landmark, setLandmark] = useState(initialSavedAddress?.landmark ?? '');
  const [pincode, setPincode] = useState(initialSavedAddress?.pincode ?? '');
  const [stateName, setStateName] = useState(
    initialSavedAddress?.state || 'West Bengal'
  );
  const [city, setCity] = useState(initialSavedAddress?.city || '');
  const [area, setArea] = useState(initialSavedAddress?.area || '');
  const [addressType, setAddressType] = useState<AddressTypeOption>(
    normalizeAddressType(initialSavedAddress?.label)
  );
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Step 2: Coupon state
  const [couponInput, setCouponInput] = useState(routerState?.couponCode ?? '');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(
    routerState?.couponCode
  );
  const [couponDiscount, setCouponDiscount] = useState(
    routerState?.couponDiscount ?? 0
  );
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Step 3: Payment state (COD active, UPI Coming Soon)
  const [paymentMethod] = useState<'cod'>('cod');
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill account email if still blank
  useEffect(() => {
    if (customerAccount?.email && !email) {
      setEmail(customerAccount.email);
    }
    if (customerAccount?.fullName && !fullName) {
      setFullName(customerAccount.fullName);
    }
    if (customerAccount?.phone && !phone) {
      setPhone(normalizePhoneDigits(customerAccount.phone));
    }
  }, [customerAccount, email, fullName, phone]);

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const pricing = useMemo(() => {
    let totalMrp = 0;
    for (const item of items) {
      const matched = productById.get(item.productId);
      const mrp =
        matched?.compareAtPriceInr && matched.compareAtPriceInr > item.unitPriceInr
          ? matched.compareAtPriceInr
          : item.unitPriceInr;
      totalMrp += mrp * item.quantity;
    }
    const productSavings = Math.max(0, totalMrp - subtotalInr);
    const grandTotalInr = Math.max(0, subtotalInr + giftWrapChargeInr - couponDiscount);
    return {
      totalMrp,
      productSavings,
      totalSavings: productSavings + couponDiscount,
      grandTotalInr,
    };
  }, [items, productById, subtotalInr, giftWrapChargeInr, couponDiscount]);

  function applySavedAddressToForm(addr: SavedAddress) {
    setSelectedAddressId(addr.id);
    setFullName(addr.fullName);
    setPhone(normalizePhoneDigits(addr.phone));
    setEmail(addr.email || customerAccount?.email || '');
    setAddressLine1(addr.addressLine1);
    setLandmark(addr.landmark ?? '');
    setPincode(addr.pincode);
    setStateName(addr.state || 'West Bengal');
    setCity(addr.city || '');
    setArea(addr.area || '');
    setAddressType(normalizeAddressType(addr.label));
    setFormErrors({});
  }

  function handlePinChange(rawValue: string) {
    const cleanPin = rawValue.replace(/\D/g, '').slice(0, 6);
    setPincode(cleanPin);
    if (cleanPin.length === 6) {
      const match = lookupIndianPin(cleanPin);
      if (match) {
        setStateName(match.state);
        if (match.city) setCity(match.city);
        if (match.area) setArea(match.area);
      }
    }
  }

  async function handleContinueFromStep1(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const nameCheck = validateRequired(fullName, 'Full name');
    if (!nameCheck.valid) errors.fullName = nameCheck.error!;

    const phoneCheck = validateIndianPhone(phone);
    if (!phoneCheck.valid) errors.phone = phoneCheck.error!;

    if (email.trim()) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) errors.email = emailCheck.error!;
    }

    const addrCheck = validateRequired(addressLine1, 'House / Street address');
    if (!addrCheck.valid) errors.addressLine1 = addrCheck.error!;

    const pinCheck = validateIndianPincode(pincode);
    if (!pinCheck.valid) errors.pincode = pinCheck.error!;

    if (!stateName.trim()) errors.state = 'Please select your state.';
    if (!city.trim()) errors.city = 'Please enter city or district.';
    if (!area.trim()) errors.area = 'Please enter area or locality.';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (saveForFuture) {
      const defaultZone = activeZones[0];
      const payload: SavedAddress = {
        id: selectedAddressId ?? `addr-${Date.now()}`,
        label: addressType,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || customerAccount?.email || '',
        addressLine1: addressLine1.trim(),
        landmark: landmark.trim() || undefined,
        area: area.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        deliveryZoneId: defaultZone?.id ?? 'zone-jalchak',
        isDefault: savedAddresses.length === 0,
        createdAt: new Date().toISOString(),
      };
      await services.community.saveAddress(payload);
      setSelectedAddressId(payload.id);
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleApplyCoupon(codeToTry: string) {
    const clean = codeToTry.trim().toUpperCase();
    if (!clean) {
      setCouponFeedback({ type: 'error', message: 'Enter a coupon code first.' });
      return;
    }
    const res = await services.promotions.validateCoupon(clean, subtotalInr);
    if (!res.valid) {
      setCouponDiscount(0);
      setAppliedCouponCode(undefined);
      setCouponFeedback({ type: 'error', message: res.message });
      return;
    }
    setCouponInput(res.coupon?.code ?? clean);
    setAppliedCouponCode(res.coupon?.code ?? clean);
    setCouponDiscount(res.discountInr);
    setCouponFeedback({ type: 'success', message: res.message });
  }

  async function handlePlaceOrder() {
    if (submitting || items.length === 0) return;
    setSubmitting(true);
    try {
      const matchedZone =
        activeZones.find(
          (z) => z.name.toLowerCase() === city.trim().toLowerCase()
        ) ?? activeZones[0];
      const zoneId = matchedZone?.id ?? 'zone-jalchak';
      const zoneName = city.trim() || matchedZone?.name || 'Jalchak';
      const zoneState = stateName.trim() || matchedZone?.state || 'West Bengal';

      const created = await services.orders.createDemoOrder({
        customerAccountId: customerAccount?.id,
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || customerAccount?.email || 'customer@giftkart.in',
          addressLine1: addressLine1.trim(),
          addressLine2: landmark.trim() || area.trim() || undefined,
          deliveryZoneId: zoneId,
          deliveryZoneNameSnapshot: zoneName,
          city: zoneName,
          state: zoneState,
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
        discountInr: couponDiscount,
        deliveryChargeInr: 0,
        grandTotalInr: pricing.grandTotalInr,
        couponCode: couponDiscount > 0 ? appliedCouponCode : undefined,
        paymentMethod: 'Cash on Delivery (COD)',
      });

      clearCart();
      navigate(`/order-confirmation/${created.orderNumber}`, { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  const formattedAddressPreview = formatFullAddress({
    id: selectedAddressId ?? 'preview',
    label: addressType,
    fullName,
    phone,
    email,
    addressLine1,
    landmark,
    area,
    city: city || 'Jalchak',
    state: stateName || 'West Bengal',
    pincode,
    deliveryZoneId: 'zone-jalchak',
    isDefault: false,
    createdAt: '',
  });

  const STEPS: Array<{ num: DesktopCheckoutStep; label: string }> = [
    { num: 1, label: 'Delivery Address' },
    { num: 2, label: 'Confirm Details' },
    { num: 3, label: 'Payment' },
  ];

  return (
    <>
      {/* Normal Mobile (< 900px): Dedicated Reference-Matched 3-Step Mobile Checkout */}
      <div className="-mx-3.5 -my-4 sm:-mx-6 sm:-my-5 lg:hidden">
        <MobileCheckoutPage />
      </div>

      {/* Desktop & Laptop (>= 900px): Full 3-Step Checkout Parity with Mobile */}
      <div className="hidden lg:block">
        {items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Add a gift to your cart before starting checkout."
            icon={<ShoppingBag className="h-5 w-5" />}
            action={
              <Link to="/shop">
                <Button size="sm">Return to Shop</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Top Header + 3-Step Progress Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE3FF] pb-4">
              <div>
                <Link
                  to="/cart"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Cart</span>
                </Link>
                <h1 className="mt-1 font-display text-2xl font-bold text-[#1E1035]">
                  Checkout
                </h1>
              </div>

              <ol
                aria-label="Checkout progress"
                className="flex items-center gap-2.5"
              >
                {STEPS.map((s, idx) => {
                  const completed = step > s.num;
                  const active = step === s.num;
                  return (
                    <li key={s.num} className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={s.num > step}
                        onClick={() => {
                          if (s.num < step) setStep(s.num);
                        }}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                          active
                            ? 'bg-[#6A11CB] text-white'
                            : completed
                              ? 'cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-[#F6F0FC] text-[#8E7CA8] cursor-default'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-extrabold ${
                            active
                              ? 'bg-white/20 text-white'
                              : completed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-[#8E7CA8]'
                          }`}
                        >
                          {completed ? <Check className="h-3 w-3" /> : s.num}
                        </span>
                        <span>{s.label}</span>
                      </button>
                      {idx < STEPS.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-[#C6B3DE]" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Main 2-Column Checkout Grid */}
            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
              {/* Left Active Step Column */}
              <div className="space-y-5 lg:col-span-7">
                {/* STEP 1: ADDRESS FORM */}
                {step === 1 && (
                  <form
                    onSubmit={(e) => void handleContinueFromStep1(e)}
                    className="space-y-5 rounded-2xl border border-[#EFE3FF] bg-white p-6 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-extrabold text-[#1E1035]">
                          Step 1 · Delivery Address
                        </h2>
                        <p className="text-xs text-[#685782]">
                          Enter where your GiftKart order should be delivered.
                        </p>
                      </div>
                      <Link
                        to="/addresses"
                        className="text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
                      >
                        Manage Saved Addresses →
                      </Link>
                    </div>

                    {/* Quick-Select Saved Addresses */}
                    {savedAddresses.length > 0 && (
                      <div className="rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] p-3.5">
                        <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6A11CB]">
                          <MapPin className="h-3.5 w-3.5 text-[#FF4D8D]" />
                          <span>Select a Saved Address</span>
                        </p>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {savedAddresses.map((addr) => {
                            const selected = selectedAddressId === addr.id;
                            return (
                              <button
                                key={addr.id}
                                type="button"
                                onClick={() => applySavedAddressToForm(addr)}
                                className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                                  selected
                                    ? 'border-[#6A11CB] bg-white shadow-xs ring-1 ring-[#6A11CB]/25'
                                    : 'border-[#EBD8FF] bg-white/80 hover:border-[#6A11CB]/50'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-[#1E1035]">
                                    {addr.fullName}
                                  </span>
                                  <span className="rounded bg-[#F4EBFF] px-1.5 py-0.5 text-[10px] font-bold text-[#6A11CB]">
                                    {addr.label}
                                  </span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-[11px] text-[#594A6B]">
                                  {formatFullAddress(addr)}
                                </p>
                                <p className="mt-1 font-mono text-[11px] text-[#7A6894]">
                                  +91 {normalizePhoneDigits(addr.phone)}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 9-Field Compact Structured Address Form */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter recipient full name"
                          className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:outline-none"
                        />
                        {formErrors.fullName && (
                          <p className="mt-1 text-xs text-rose-600">{formErrors.fullName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          Mobile Number *
                        </label>
                        <div className="mt-1 flex h-10 items-center overflow-hidden rounded-xl border border-[#DFD2F2] bg-white focus-within:border-[#6A11CB]">
                          <span className="flex h-full items-center border-r border-[#EFE3FF] bg-[#FAF6FF] px-3 text-xs font-bold text-[#6A11CB]">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={phone}
                            onChange={(e) =>
                              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                            }
                            placeholder="10-digit mobile"
                            className="h-full w-full px-3 text-sm text-[#1E1035] focus:outline-none"
                          />
                        </div>
                        {formErrors.phone && (
                          <p className="mt-1 text-xs text-rose-600">{formErrors.phone}</p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:outline-none"
                        />
                        {formErrors.email && (
                          <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          House / Flat / Building / Street *
                        </label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          placeholder="e.g., Mukherjee Road, House No. 12"
                          className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:outline-none"
                        />
                        {formErrors.addressLine1 && (
                          <p className="mt-1 text-xs text-rose-600">
                            {formErrors.addressLine1}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g., Near Jalchak High School"
                          className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => handlePinChange(e.target.value)}
                          placeholder="e.g., 721155"
                          className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 font-mono text-sm text-[#1E1035] focus:border-[#6A11CB] focus:outline-none"
                        />
                        {formErrors.pincode && (
                          <p className="mt-1 text-xs text-rose-600">{formErrors.pincode}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          State *
                        </label>
                        <select
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3 text-sm font-medium text-[#1E1035] focus:border-[#6A11CB] focus:outline-none"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        {formErrors.state && (
                          <p className="mt-1 text-xs text-rose-600">{formErrors.state}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          City / District *
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g., Paschim Medinipur"
                          className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:outline-none"
                        />
                        {formErrors.city && (
                          <p className="mt-1 text-xs text-rose-600">{formErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          Area / Locality *
                        </label>
                        <input
                          type="text"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="e.g., Jalchak"
                          className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:outline-none"
                        />
                        {formErrors.area && (
                          <p className="mt-1 text-xs text-rose-600">{formErrors.area}</p>
                        )}
                      </div>
                    </div>

                    {/* Address Type */}
                    <div>
                      <p className="text-xs font-bold text-[#2B0B4E]">Address Type *</p>
                      <div className="mt-2 grid grid-cols-3 gap-2.5">
                        {DESKTOP_ADDRESS_TYPE_OPTIONS.map(({ value, label, Icon }) => {
                          const active = addressType === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setAddressType(value)}
                              className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all ${
                                active
                                  ? 'border-[#6A11CB] bg-[#6A11CB] text-white shadow-xs'
                                  : 'border-[#DFD2F2] bg-white text-[#2B0B4E] hover:border-[#6A11CB]/50'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#4B3963]">
                      <input
                        type="checkbox"
                        checked={saveForFuture}
                        onChange={(e) => setSaveForFuture(e.target.checked)}
                        className="h-4 w-4 accent-[#6A11CB]"
                      />
                      <span>Save this address for future orders</span>
                    </label>

                    <button
                      type="submit"
                      className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] text-sm font-bold text-white shadow-[0_10px_24px_-8px_rgba(106,17,203,0.45)] transition-all hover:opacity-95"
                    >
                      Continue to Confirm Details →
                    </button>
                  </form>
                )}

                {/* STEP 2: CONFIRM DETAILS */}
                {step === 2 && (
                  <div className="space-y-5">
                    {/* Delivering To Card */}
                    <div className="rounded-2xl border border-[#EFE3FF] bg-white p-5 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF5FF] text-[#6A11CB]">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#7A6894]">
                                Delivering To
                              </p>
                              <span className="rounded bg-[#F4EBFF] px-2 py-0.5 text-[10px] font-bold text-[#6A11CB]">
                                {addressType}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-extrabold text-[#1E1035]">
                              {fullName}
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-[#594A6B]">
                              {formattedAddressPreview}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-[#685782]">
                              +91 {phone}
                              {email ? ` · ${email}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="cursor-pointer rounded-lg border border-[#DFD2F2] bg-[#FAF6FF] px-3 py-1.5 text-xs font-bold text-[#6A11CB] hover:bg-[#F1E4FF]"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Ordered Items Review */}
                    <div className="rounded-2xl border border-[#EFE3FF] bg-white p-5 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)]">
                      <h2 className="mb-3.5 text-base font-extrabold text-[#1E1035]">
                        Review Items ({items.reduce((s, i) => s + i.quantity, 0)})
                      </h2>
                      <div className="divide-y divide-[#EFE3FF]">
                        {items.map((item) => (
                          <div
                            key={item.cartItemId}
                            className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0"
                          >
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#EFE3FF] bg-[#FAF6FF]">
                              <ProductImage
                                src={item.image}
                                alt={item.productName}
                                aspectClass="aspect-square"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-[#1E1035]">
                                {item.productName}
                              </p>
                              <p className="mt-0.5 text-xs text-[#685782]">
                                Qty: {item.quantity} · {formatInr(item.unitPriceInr)} each
                              </p>
                              {Object.keys(item.selectedVariants).length > 0 && (
                                <p className="mt-0.5 text-xs text-[#594A6B]">
                                  {Object.entries(item.selectedVariants)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(' · ')}
                                </p>
                              )}
                              {item.personalizationDetails && (
                                <p className="mt-0.5 text-xs font-semibold text-[#6A11CB]">
                                  Note: {item.personalizationDetails}
                                </p>
                              )}
                              {item.customPhotoFileName && (
                                <p className="text-xs font-semibold text-[#FF4D8D]">
                                  Photo: {item.customPhotoFileName}
                                </p>
                              )}
                            </div>
                            <span className="font-mono text-sm font-extrabold tabular-nums text-[#6A11CB]">
                              {formatInr(item.unitPriceInr * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {giftWrap.enabled && (
                        <div className="mt-4 rounded-xl border border-[#EFE3FF] bg-[#FFF5FA] p-3.5 text-xs">
                          <p className="font-bold text-[#6A11CB]">
                            Boutique Gift Wrapping · {giftWrap.styleNameSnapshot} (
                            {formatInr(giftWrapChargeInr)})
                          </p>
                          {giftWrap.recipientName && (
                            <p className="mt-0.5 text-[#2B0B4E]">
                              Recipient: {giftWrap.recipientName}
                            </p>
                          )}
                          {giftWrap.giftMessage && (
                            <p className="mt-0.5 italic text-[#594A6B]">
                              &ldquo;{giftWrap.giftMessage}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Apply Coupon Card */}
                    <div className="rounded-2xl border border-[#EFE3FF] bg-white p-5 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)]">
                      <h3 className="text-sm font-extrabold text-[#1E1035]">
                        Apply Coupon
                      </h3>
                      <div className="mt-2.5 flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="h-10 flex-1 rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] px-3.5 font-mono text-xs font-bold text-[#2B0B4E] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                        />
                        <Button
                          type="button"
                          variant="glass"
                          size="sm"
                          onClick={() => void handleApplyCoupon(couponInput)}
                        >
                          Apply
                        </Button>
                      </div>
                      {activeCoupons.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {activeCoupons.slice(0, 4).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => void handleApplyCoupon(c.code)}
                              className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold transition-colors ${
                                appliedCouponCode === c.code
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                  : 'border-[#EBD8FF] bg-[#FAF6FF] text-[#6A11CB] hover:border-[#6A11CB]'
                              }`}
                            >
                              <Ticket className="h-3 w-3" />
                              <span className="font-mono">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {couponFeedback && (
                        <p
                          className={`mt-2 text-xs font-semibold ${
                            couponFeedback.type === 'success'
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {couponFeedback.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setStep(3);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] text-sm font-bold text-white shadow-[0_10px_24px_-8px_rgba(106,17,203,0.45)] transition-all hover:opacity-95"
                    >
                      Continue to Payment →
                    </button>
                  </div>
                )}

                {/* STEP 3: PAYMENT METHOD */}
                {step === 3 && (
                  <div className="space-y-5 rounded-2xl border border-[#EFE3FF] bg-white p-6 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)]">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-extrabold text-[#1E1035]">
                          Step 3 · Choose Payment Method
                        </h2>
                        <p className="text-xs text-[#685782]">
                          Select how you would like to pay for your GiftKart order.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="cursor-pointer text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
                      >
                        ← Back to Review
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Active Cash on Delivery (COD) */}
                      <div className="flex items-start justify-between gap-4 rounded-xl border-2 border-[#6A11CB] bg-[#FAF6FF] p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#6A11CB] bg-[#6A11CB] text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <PackageCheck className="h-4 w-4 text-[#6A11CB]" />
                              <span className="text-sm font-extrabold text-[#1E1035]">
                                Cash on Delivery (COD)
                              </span>
                              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                Available
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-[#594A6B]">
                              Pay in cash at your doorstep when your GiftKart order arrives. No extra COD charges.
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-sm font-extrabold text-[#6A11CB]">
                          {formatInr(pricing.grandTotalInr)}
                        </span>
                      </div>

                      {/* UPI Coming Soon / Temporarily Unavailable */}
                      <div className="flex items-start justify-between gap-4 rounded-xl border border-[#EFE3FF] bg-[#FAFAFC] p-4 opacity-70">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#D4C7E5] bg-white text-[#9D8BB5]">
                            <Ban className="h-3 w-3" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-[#7A6894]" />
                              <span className="text-sm font-bold text-[#4B3963]">
                                UPI Payment (GPay / PhonePe / Paytm)
                              </span>
                              <span className="rounded bg-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-700">
                                Coming Soon
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#6E5B85]">
                              UPI online payment is temporarily unavailable. Please place your order using Cash on Delivery.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compact Delivering To Confirmation */}
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EFE3FF] bg-[#FCFAFF] px-4 py-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-[#1E1035]">
                          Delivering to {fullName} ({addressType})
                        </p>
                        <p className="truncate text-[#685782]">{formattedAddressPreview}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="shrink-0 cursor-pointer font-bold text-[#6A11CB] hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={submitting || paymentMethod !== 'cod'}
                      onClick={() => void handlePlaceOrder()}
                      className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] text-sm font-bold text-white shadow-[0_10px_24px_-8px_rgba(106,17,203,0.45)] transition-all hover:opacity-95 disabled:opacity-50"
                    >
                      <Lock className="h-4 w-4" />
                      <span>
                        {submitting
                          ? 'Placing Order...'
                          : `Place Order (COD) · ${formatInr(pricing.grandTotalInr)}`}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Sticky Order Price Summary */}
              <aside className="space-y-4 rounded-2xl border border-[#EFE3FF] bg-white p-6 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)] lg:col-span-5 lg:sticky lg:top-28">
                <h2 className="text-base font-extrabold text-[#1E1035]">
                  Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} items)
                </h2>

                <ul className="divide-y divide-[#F3EAFF] text-xs">
                  {items.map((item) => (
                    <li key={item.cartItemId} className="flex items-center gap-3 py-2.5 first:pt-0">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#EFE3FF] bg-[#FAF6FF]">
                        <ProductImage
                          src={item.image}
                          alt={item.productName}
                          aspectClass="aspect-square"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[#1E1035]">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-[#685782]">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-[#6A11CB]">
                        {formatInr(item.unitPriceInr * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="space-y-2 border-t border-[#EFE3FF] pt-3.5 text-sm">
                  {pricing.productSavings > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Product Savings</span>
                      <span className="font-mono font-bold tabular-nums">
                        -{formatInr(pricing.productSavings)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#594A6B]">
                    <span>Items Subtotal</span>
                    <span className="font-mono font-bold tabular-nums text-[#1E1035]">
                      {formatInr(subtotalInr)}
                    </span>
                  </div>
                  {giftWrap.enabled && (
                    <div className="flex justify-between text-[#594A6B]">
                      <span>Gift Wrapping</span>
                      <span className="font-mono font-bold tabular-nums text-[#1E1035]">
                        {formatInr(giftWrapChargeInr)}
                      </span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Coupon ({appliedCouponCode})</span>
                      <span className="font-mono font-bold tabular-nums">
                        -{formatInr(couponDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#594A6B]">
                    <span>Delivery</span>
                    <span className="font-bold text-emerald-700">FREE</span>
                  </div>
                  <div className="flex justify-between border-t border-[#EFE3FF] pt-3 text-base font-extrabold text-[#1E1035]">
                    <span>Order Total</span>
                    <span className="font-mono tabular-nums text-[#6A11CB]">
                      {formatInr(pricing.grandTotalInr)}
                    </span>
                  </div>
                </dl>

                {pricing.totalSavings > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-bold text-emerald-800">
                    <BadgePercent className="h-4 w-4 shrink-0" />
                    <span>Saving {formatInr(pricing.totalSavings)} on this order</span>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const ORDER_BURST_PARTICLES: {
  tx: string;
  ty: string;
  color: string;
  size: string;
  shape: string;
}[] = [
  { tx: '-58px', ty: '-48px', color: '#6A11CB', size: 'h-2.5 w-2.5', shape: 'rounded-full' },
  { tx: '58px', ty: '-46px', color: '#FF4D8D', size: 'h-2.5 w-2.5', shape: 'rounded-full' },
  { tx: '-70px', ty: '6px', color: '#F59E0B', size: 'h-2 w-3.5', shape: 'rounded-full' },
  { tx: '70px', ty: '8px', color: '#16A34A', size: 'h-2 w-3.5', shape: 'rounded-full' },
  { tx: '-46px', ty: '54px', color: '#FF4D8D', size: 'h-2.5 w-2.5', shape: 'rounded-xs' },
  { tx: '48px', ty: '52px', color: '#6A11CB', size: 'h-2.5 w-2.5', shape: 'rounded-xs' },
  { tx: '0px', ty: '-68px', color: '#16A34A', size: 'h-2 w-2', shape: 'rounded-full' },
  { tx: '12px', ty: '64px', color: '#F59E0B', size: 'h-2 w-2', shape: 'rounded-full' },
];

export function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
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
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="h-72 animate-pulse rounded-[28px] bg-[#F5ECFF]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <EmptyState
          title="Order details unavailable"
          description="You can view all your orders and live status directly inside My Orders."
          action={
            <Link to="/my-orders">
              <Button size="sm">My Orders</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="-mx-3.5 -my-4 min-h-[calc(100dvh-110px)] bg-gradient-to-b from-[#FDF9FF] via-[#FAF4FF] to-[#F5ECFF] px-4 pb-28 pt-8 sm:-mx-6 sm:-my-5 lg:mx-auto lg:my-0 lg:min-h-0 lg:max-w-xl lg:bg-none lg:px-0 lg:pb-12 lg:pt-6">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        {/* Official App Order Placed Celebration Animation */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          {/* Concentric Expanding Success Ripples */}
          <span
            aria-hidden="true"
            className="gk-anim-order-ripple-1 absolute h-20 w-20 rounded-full border-2 border-[#16A34A]/45 bg-[#DCFCE7]/50"
          />
          <span
            aria-hidden="true"
            className="gk-anim-order-ripple-2 absolute h-20 w-20 rounded-full border-2 border-[#6A11CB]/30 bg-[#EBD8FF]/35"
          />

          {/* Celebratory Confetti Burst Particles */}
          {ORDER_BURST_PARTICLES.map((particle, idx) => (
            <span
              key={idx}
              aria-hidden="true"
              style={
                {
                  '--tx': particle.tx,
                  '--ty': particle.ty,
                  backgroundColor: particle.color,
                } as React.CSSProperties
              }
              className={`gk-anim-confetti absolute ${particle.size} ${particle.shape}`}
            />
          ))}

          {/* Blooming Success Circle with Self-Drawing Checkmark */}
          <div className="gk-anim-order-pop relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] shadow-[0_14px_30px_-6px_rgba(22,163,74,0.52)] ring-[6px] ring-[#DCFCE7]">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
              className="h-10 w-10"
            >
              <path
                d="M12.5 24.8L20.5 32.8L35.8 16.5"
                stroke="#FFFFFF"
                strokeWidth="4.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="gk-anim-check-draw"
              />
            </svg>
          </div>
        </div>

        {/* Title & Confirmation Copy */}
        <div className="gk-anim-slide-up-1 mt-2">
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#2B0B4E]">
            Order Placed Successfully!
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#5B4775]">
            Thank you, <span className="font-bold text-[#2B0B4E]">{order.customer.fullName}</span>! Your GiftKart order has been confirmed.
          </p>
        </div>

        {/* Compact Order Summary Card (No Tracking ID) */}
        <div className="gk-anim-slide-up-2 mt-6 w-full rounded-[22px] border border-[#EBD8FF] bg-white p-4 text-left shadow-[0_10px_28px_-14px_rgba(106,17,203,0.18)]">
          <ul className="divide-y divide-[#F3E9FF]">
            {order.items.map((item, idx) => (
              <li
                key={`${item.productSkuSnapshot}-${idx}`}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#F2E6FF] bg-[#FAF6FF]">
                  <ProductImage
                    src={item.imageSnapshot}
                    alt={item.productNameSnapshot}
                    aspectClass="aspect-square"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13.5px] font-extrabold leading-snug text-[#2B0B4E]">
                    {item.productNameSnapshot}
                  </p>
                  <p className="mt-0.5 text-[12px] font-semibold text-[#6E5B85]">
                    Qty: {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-[14.5px] font-extrabold tabular-nums text-[#FF1F7A]">
                  {formatInr(item.lineTotalInr)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3.5 space-y-2 border-t border-[#EFE3FF] pt-3 text-[12.5px]">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[#6E5B85]">Delivery Address</span>
              <span className="max-w-[65%] text-right font-semibold leading-snug text-[#2B0B4E]">
                {order.customer.addressLine1}, {order.customer.city} - {order.customer.pincode}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#6E5B85]">Payment Method</span>
              <span className="font-bold text-[#2B0B4E]">
                {order.paymentMethod || 'Cash on Delivery (COD)'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#6E5B85]">Order Date</span>
              <span className="font-semibold text-[#2B0B4E]">
                {formatDateTime(order.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#EFE3FF] pt-2.5 text-[15px] font-extrabold text-[#2B0B4E]">
              <span>Order Total</span>
              <span className="tabular-nums text-[#6A11CB]">
                {formatInr(order.grandTotalInr)}
              </span>
            </div>
          </div>
        </div>

        {/* Single Action Option: My Orders */}
        <div className="gk-anim-slide-up-3 mt-5 w-full">
          <Link
            to="/my-orders"
            className="flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-6 text-[16px] font-extrabold text-white shadow-[0_8px_22px_-4px_rgba(162,28,175,0.48)] transition-transform active:scale-[0.985]"
          >
            <Package className="h-[19px] w-[19px] shrink-0 stroke-[2.2]" />
            <span>My Orders</span>
            <ChevronRight className="h-5 w-5 shrink-0 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
