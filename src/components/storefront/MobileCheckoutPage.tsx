import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgePercent,
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  Coffee,
  CreditCard,
  Gift,
  Heart,
  Home,
  Image as ImageIcon,
  KeyRound,
  LayoutGrid,
  Lightbulb,
  Lock,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  ReceiptText,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Tag,
  Ticket,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  useCategories,
  useCoupons,
  useProducts,
  useSavedAddresses,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { ProductImage } from '../ui/ProductImage';
import { formatInr } from '../../utils/format';
import {
  validateEmail,
  validateIndianPhone,
  validateIndianPincode,
  validateRequired,
} from '../../utils/validation';

type CheckoutStep = 1 | 2 | 3;

interface CheckoutRouterState {
  couponCode?: string;
  couponDiscount?: number;
  selectedAddressId?: string;
}

function getCategoryTagIcon(categoryName?: string): LucideIcon {
  if (!categoryName) return Tag;
  const lower = categoryName.toLowerCase();
  if (lower.includes('mug')) return Coffee;
  if (lower.includes('t-shirt') || lower.includes('tshirt')) return Shirt;
  if (lower.includes('frame') || lower.includes('photo')) return ImageIcon;
  if (lower.includes('led') || lower.includes('light')) return Lightbulb;
  if (lower.includes('cushion')) return Heart;
  if (lower.includes('keychain') || lower.includes('key chain')) return KeyRound;
  if (lower.includes('home')) return Home;
  if (lower.includes('box') || lower.includes('hamper')) return Package;
  if (lower.includes('bag')) return ShoppingBag;
  return Tag;
}

function UpiWordmarkIcon() {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5DFEC] bg-white px-1 shadow-2xs"
    >
      <div className="flex items-center gap-0.5">
        <span className="text-[11px] font-black italic tracking-tighter text-[#7B7485]">
          UPI
        </span>
        <span className="flex flex-col leading-none">
          <span className="h-1.5 w-1 -skew-x-12 bg-[#EA8B4B]/70" />
          <span className="mt-0.5 h-1.5 w-1 -skew-x-12 bg-[#3A9D5D]/70" />
        </span>
      </div>
    </div>
  );
}

const STEP_LABELS: { step: CheckoutStep; label: string }[] = [
  { step: 1, label: 'Address' },
  { step: 2, label: 'Confirm Details' },
  { step: 3, label: 'Payment' },
];

export function MobileCheckoutPage() {
  const { items, itemCount, subtotalInr, giftWrap, giftWrapChargeInr, clearCart } =
    useCart();
  const { customerAccount } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as CheckoutRouterState | null) ?? null;

  const { data: settings } = useStoreSettings();
  const { data: savedAddresses } = useSavedAddresses();
  const { data: products } = useProducts({ includeInactive: true });
  const { data: categories } = useCategories(true);
  const { data: coupons } = useCoupons();

  const activeZones = useMemo(
    () => settings?.deliveryZones.filter((z) => z.isActive) ?? [],
    [settings?.deliveryZones]
  );

  // Step state (1: Address, 2: Confirm Details, 3: Payment)
  const [step, setStep] = useState<CheckoutStep>(1);

  // Step 1 form state
  const [fullName, setFullName] = useState(customerAccount?.fullName ?? '');
  const [phone, setPhone] = useState(customerAccount?.phone ?? '');
  const [email, setEmail] = useState(customerAccount?.email ?? '');
  const [addressLine1, setAddressLine1] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [activeAddressId, setActiveAddressId] = useState<string | null>(
    routeState?.selectedAddressId ?? null
  );
  const [addressPrefilled, setAddressPrefilled] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Step 2 coupon state (synced from Cart router state when present)
  const [couponPanelOpen, setCouponPanelOpen] = useState(false);
  const [couponInput, setCouponInput] = useState(routeState?.couponCode ?? '');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(
    routeState?.couponCode
  );
  const [couponDiscount, setCouponDiscount] = useState<number>(
    routeState?.couponDiscount ?? 0
  );
  const [couponValidating, setCouponValidating] = useState(false);

  // Step 3 payment state (only COD is active; UPI is disabled)
  const [paymentMethod] = useState<'cod'>('cod');
  const [amountExpanded, setAmountExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill Email from Login Account whenever available
  useEffect(() => {
    if (customerAccount?.email && !email) {
      setEmail(customerAccount.email);
    }
    if (customerAccount?.fullName && !fullName && !addressPrefilled) {
      setFullName(customerAccount.fullName);
    }
    if (customerAccount?.phone && !phone && !addressPrefilled) {
      setPhone(customerAccount.phone);
    }
  }, [customerAccount, email, fullName, phone, addressPrefilled]);

  // Pre-fill Step 1 fields once from saved address (route selected or default)
  useEffect(() => {
    if (addressPrefilled || savedAddresses.length === 0) return;
    const preferred =
      savedAddresses.find((a) => a.id === routeState?.selectedAddressId) ??
      savedAddresses.find((a) => a.isDefault) ??
      savedAddresses[0];
    if (!preferred) return;

    setActiveAddressId(preferred.id);
    setFullName(preferred.fullName || customerAccount?.fullName || '');
    setPhone(preferred.phone || customerAccount?.phone || '');
    setEmail(customerAccount?.email || preferred.email || '');
    setAddressLine1(preferred.addressLine1 || '');
    setLandmark(preferred.area || '');
    setPincode(preferred.pincode || '');
    setAddressPrefilled(true);
  }, [savedAddresses, addressPrefilled, routeState?.selectedAddressId, customerAccount]);

  // Re-validate applied coupon if cart subtotal changes
  useEffect(() => {
    if (!appliedCouponCode) return;
    let active = true;
    void services.promotions
      .validateCoupon(appliedCouponCode, subtotalInr)
      .then((res) => {
        if (!active) return;
        if (res.valid) {
          setCouponDiscount(res.discountInr);
        } else {
          setCouponDiscount(0);
          setAppliedCouponCode(undefined);
        }
      });
    return () => {
      active = false;
    };
  }, [appliedCouponCode, subtotalInr]);

  // Scroll smoothly to top when transitioning between checkout steps
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const activeCoupons = useMemo(
    () => coupons.filter((c) => c.isActive),
    [coupons]
  );

  const matchedZone = useMemo(() => {
    const matchedSaved = savedAddresses.find((a) => a.id === activeAddressId);
    if (matchedSaved) {
      const bySaved = activeZones.find(
        (z) =>
          z.id === matchedSaved.deliveryZoneId ||
          z.name.toLowerCase() === matchedSaved.city.toLowerCase()
      );
      if (bySaved) return bySaved;
    }
    const byCustomerCity = activeZones.find(
      (z) =>
        z.name.toLowerCase() === (customerAccount?.defaultCity ?? '').toLowerCase()
    );
    return byCustomerCity ?? activeZones[0] ?? null;
  }, [activeZones, savedAddresses, activeAddressId, customerAccount?.defaultCity]);

  // Real catalog prices and real discount math
  const pricing = useMemo(() => {
    let totalProductPriceInr = 0;
    let catalogDiscountInr = 0;

    for (const item of items) {
      const catalogProduct = productById.get(item.productId);
      const compareAt =
        catalogProduct?.compareAtPriceInr &&
        catalogProduct.compareAtPriceInr > item.unitPriceInr
          ? catalogProduct.compareAtPriceInr
          : item.unitPriceInr;

      totalProductPriceInr += compareAt * item.quantity;
      catalogDiscountInr += (compareAt - item.unitPriceInr) * item.quantity;
    }

    const totalDiscountInr = catalogDiscountInr + couponDiscount;
    const orderTotalInr = Math.max(
      0,
      subtotalInr + giftWrapChargeInr - couponDiscount
    );

    return {
      totalProductPriceInr,
      catalogDiscountInr,
      totalDiscountInr,
      orderTotalInr,
    };
  }, [items, productById, couponDiscount, subtotalInr, giftWrapChargeInr]);

  function handleBack() {
    if (step === 3) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(1);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/cart');
    }
  }

  function handleApplySavedAddress(addrId: string) {
    const addr = savedAddresses.find((a) => a.id === addrId);
    if (!addr) return;
    setActiveAddressId(addr.id);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setEmail(customerAccount?.email || addr.email || email);
    setAddressLine1(addr.addressLine1);
    setLandmark(addr.area || '');
    setPincode(addr.pincode);
    setFormErrors({});
  }

  async function handleStep1Continue(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const nameRes = validateRequired(fullName, 'Full Name');
    if (!nameRes.valid) errors.fullName = nameRes.error!;

    const phoneRes = validateIndianPhone(phone);
    if (!phoneRes.valid) errors.phone = phoneRes.error!;

    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      const emailRes = validateEmail(trimmedEmail);
      if (!emailRes.valid) errors.email = emailRes.error!;
    }

    const addrRes = validateRequired(addressLine1, 'Address');
    if (!addrRes.valid) errors.addressLine1 = addrRes.error!;

    const pinRes = validateIndianPincode(pincode);
    if (!pinRes.valid) errors.pincode = pinRes.error!;

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      pushToast({
        title: 'Incomplete Delivery Details',
        description: 'Please fill in all required address fields.',
        variant: 'error',
      });
      return;
    }

    // Save address for future orders if checked
    if (saveForFuture) {
      const existing = savedAddresses.find((a) => a.id === activeAddressId);
      const city = existing?.city || matchedZone?.name || 'Jalchak';
      const state = existing?.state || matchedZone?.state || 'West Bengal';
      const deliveryZoneId = existing?.deliveryZoneId || matchedZone?.id || 'zone-jalchak';

      const newId = existing?.id ?? `addr-${Date.now()}`;
      await services.community.saveAddress({
        id: newId,
        label: existing?.label || 'Home',
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: trimmedEmail || customerAccount?.email || '',
        addressLine1: addressLine1.trim(),
        area: landmark.trim(),
        deliveryZoneId,
        city,
        state,
        pincode: pincode.trim(),
        isDefault: true,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
      setActiveAddressId(newId);
    }

    setStep(2);
  }

  async function applyCouponCode(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      pushToast({
        title: 'Enter Coupon Code',
        description: 'Please type a valid coupon code.',
        variant: 'error',
      });
      return;
    }
    setCouponValidating(true);
    try {
      const res = await services.promotions.validateCoupon(code, subtotalInr);
      if (!res.valid) {
        setCouponDiscount(0);
        setAppliedCouponCode(undefined);
        pushToast({
          title: 'Coupon Not Applied',
          description: res.message,
          variant: 'error',
        });
        return;
      }
      setCouponDiscount(res.discountInr);
      setAppliedCouponCode(res.coupon?.code ?? code);
      setCouponInput(res.coupon?.code ?? code);
      setCouponPanelOpen(false);
      pushToast({
        title: 'Coupon Applied',
        description: res.message,
        variant: 'success',
      });
    } finally {
      setCouponValidating(false);
    }
  }

  function handleClearCoupon() {
    setAppliedCouponCode(undefined);
    setCouponDiscount(0);
    setCouponInput('');
    pushToast({
      title: 'Coupon Removed',
      description: 'Coupon discount removed from your order.',
      variant: 'info',
    });
  }

  async function handlePlaceOrder() {
    if (submitting || items.length === 0) return;
    if (paymentMethod !== 'cod') return;

    const existing = savedAddresses.find((a) => a.id === activeAddressId);
    const zoneId = existing?.deliveryZoneId || matchedZone?.id || 'zone-jalchak';
    const zoneName = existing?.city || matchedZone?.name || 'Jalchak';
    const zoneState = existing?.state || matchedZone?.state || 'West Bengal';

    setSubmitting(true);
    try {
      const created = await services.orders.createDemoOrder({
        customerAccountId: customerAccount?.id,
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || customerAccount?.email || 'customer@giftkart.in',
          addressLine1: addressLine1.trim(),
          addressLine2: landmark.trim() || undefined,
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
        grandTotalInr: pricing.orderTotalInr,
        couponCode: couponDiscount > 0 ? appliedCouponCode : undefined,
      });

      clearCart();
      pushToast({
        title: `Order ${created.orderNumber} Placed`,
        description: 'Cash on Delivery order confirmed.',
        variant: 'success',
      });
      navigate(`/order-confirmation/${created.orderNumber}`, { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  // Empty cart fallback
  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100dvh-120px)] w-full bg-gradient-to-b from-[#FDF9FF] via-[#FAF4FF] to-[#F5ECFF] px-4 pb-24 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/cart')}
            aria-label="Back to cart"
            className="-ml-1.5 flex h-10 w-10 items-center justify-center rounded-full text-[#2B0B4E] active:bg-[#EBD8FF]/60"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.3]" />
          </button>
          <h1 className="text-[19px] font-extrabold text-[#2B0B4E]">Checkout</h1>
        </div>

        <div className="mt-10 flex flex-col items-center rounded-[24px] border border-[#EBD8FF] bg-white px-6 py-10 text-center shadow-[0_8px_24px_-12px_rgba(106,17,203,0.14)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5ECFF] text-[#6A11CB]">
            <ShoppingBag className="h-8 w-8 stroke-[1.9]" />
          </div>
          <h2 className="mt-4 text-[18px] font-extrabold text-[#2B0B4E]">
            Your Cart is Empty
          </h2>
          <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-[#6A5782]">
            Add a gift to your cart before starting checkout.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex h-[46px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-7 text-[14px] font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(106,17,203,0.4)] active:scale-[0.98]"
          >
            <Gift className="h-4 w-4 stroke-[2.2]" />
            <span>Explore Gifts</span>
          </Link>
        </div>
      </div>
    );
  }

  const displayCityState = (() => {
    const existing = savedAddresses.find((a) => a.id === activeAddressId);
    const city = existing?.city || matchedZone?.name || 'Jalchak';
    const state = existing?.state || matchedZone?.state || 'West Bengal';
    return `${city}, ${state}`;
  })();

  return (
    <div className="min-h-[calc(100dvh-56px)] w-full overflow-x-clip bg-gradient-to-b from-[#FDF9FF] via-[#FAF5FF] to-[#F6EEFF] pb-28">
      {/* TOP CHECKOUT BAR */}
      <div className="flex items-center gap-1.5 px-3 pb-1 pt-2.5">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#2B0B4E] transition-colors active:bg-[#EBD8FF]/60"
        >
          <ArrowLeft className="h-[20px] w-[20px] stroke-[2.3]" />
        </button>
        <h1 className="text-[19px] font-extrabold tracking-[-0.015em] text-[#2B0B4E]">
          Checkout
        </h1>
      </div>

      {/* 3-STEP PROGRESS INDICATOR */}
      <nav aria-label="Checkout progress" className="px-5 pb-3.5 pt-1.5">
        <div className="relative flex items-start justify-between">
          {/* Connector Lines */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[16%] right-[50%] top-[14px] h-[2px] rounded-full transition-colors duration-200"
            style={{
              backgroundColor: step > 1 ? '#6A11CB' : '#E6D4FF',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[50%] right-[16%] top-[14px] h-[2px] rounded-full transition-colors duration-200"
            style={{
              backgroundColor: step > 2 ? '#6A11CB' : '#E6D4FF',
            }}
          />

          {STEP_LABELS.map((item) => {
            const isCompleted = step > item.step;
            const isCurrent = step === item.step;
            const canClick = isCompleted;

            return (
              <button
                key={item.step}
                type="button"
                disabled={!canClick}
                onClick={() => {
                  if (canClick) setStep(item.step);
                }}
                aria-current={isCurrent ? 'step' : undefined}
                className={`relative z-10 flex w-1/3 flex-col items-center gap-1.5 text-center ${
                  canClick ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span
                  className={`flex h-[29px] w-[29px] items-center justify-center rounded-full text-[13px] font-extrabold transition-all ${
                    isCurrent
                      ? 'bg-[#6A11CB] text-white shadow-[0_4px_12px_rgba(106,17,203,0.34)]'
                      : isCompleted
                        ? 'border-[1.8px] border-[#6A11CB] bg-white text-[#6A11CB]'
                        : 'border-[1.5px] border-[#D8C5F3] bg-white text-[#85729F]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[2.7]" />
                  ) : (
                    item.step
                  )}
                </span>
                <span
                  className={`text-[12px] leading-tight whitespace-nowrap ${
                    isCurrent
                      ? 'font-extrabold text-[#2B0B4E]'
                      : isCompleted
                        ? 'font-bold text-[#3B0764]'
                        : 'font-medium text-[#75628E]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ================================================================
          STEP 1: DELIVERY ADDRESS
      ================================================================ */}
      {step === 1 && (
        <form
          onSubmit={(e) => void handleStep1Continue(e)}
          noValidate
          className="px-3.5"
        >
          <section className="rounded-[22px] border border-[#EBD8FF] bg-white/90 p-4 shadow-[0_6px_22px_-12px_rgba(106,17,203,0.14)]">
            <div className="flex items-center gap-2">
              <MapPin
                aria-hidden="true"
                className="h-[20px] w-[20px] shrink-0 text-[#6A11CB] stroke-[2.2]"
              />
              <h2 className="text-[16.5px] font-extrabold text-[#5B10B8]">
                Add Delivery Address
              </h2>
            </div>

            {/* Optional Quick-Select Saved Addresses Strip */}
            {savedAddresses.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {savedAddresses.map((addr) => {
                  const isPicked = activeAddressId === addr.id;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleApplySavedAddress(addr.id)}
                      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-colors ${
                        isPicked
                          ? 'border-[#6A11CB] bg-[#F3E8FF] text-[#6A11CB]'
                          : 'border-[#E6D4FF] bg-white text-[#4B3568]'
                      }`}
                    >
                      {addr.label} · {addr.pincode}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-3.5 space-y-3">
              {/* Full Name (Required) */}
              <div>
                <label
                  htmlFor="mc-full-name"
                  className={`flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-2.5 transition-colors focus-within:border-[#6A11CB] ${
                    formErrors.fullName ? 'border-rose-400' : 'border-[#DEC9FA]'
                  }`}
                >
                  <User
                    aria-hidden="true"
                    className="h-[19px] w-[19px] shrink-0 text-[#6A11CB] stroke-[1.9]"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold leading-none text-[#5E4B78]">
                      Full Name <span className="text-[#FF247A]">*</span>
                    </span>
                    <input
                      id="mc-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (formErrors.fullName) {
                          setFormErrors((prev) => ({ ...prev, fullName: '' }));
                        }
                      }}
                      placeholder="Enter your full name"
                      className="mt-1 w-full bg-transparent text-[14.5px] font-bold text-[#2B0B4E] placeholder:font-normal placeholder:text-[#9D8CB5] focus:outline-none"
                    />
                  </div>
                </label>
                {formErrors.fullName && (
                  <p className="mt-1 pl-1 text-[11.5px] font-semibold text-rose-600">
                    {formErrors.fullName}
                  </p>
                )}
              </div>

              {/* Mobile Number (Required) */}
              <div>
                <label
                  htmlFor="mc-phone"
                  className={`flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-2.5 transition-colors focus-within:border-[#6A11CB] ${
                    formErrors.phone ? 'border-rose-400' : 'border-[#DEC9FA]'
                  }`}
                >
                  <Phone
                    aria-hidden="true"
                    className="h-[19px] w-[19px] shrink-0 text-[#6A11CB] stroke-[1.9]"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold leading-none text-[#5E4B78]">
                      Mobile Number <span className="text-[#FF247A]">*</span>
                    </span>
                    <input
                      id="mc-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        if (formErrors.phone) {
                          setFormErrors((prev) => ({ ...prev, phone: '' }));
                        }
                      }}
                      placeholder="10-digit mobile number"
                      className="mt-1 w-full bg-transparent text-[14.5px] font-bold tabular-nums text-[#2B0B4E] placeholder:font-normal placeholder:text-[#9D8CB5] focus:outline-none"
                    />
                  </div>
                </label>
                {formErrors.phone && (
                  <p className="mt-1 pl-1 text-[11.5px] font-semibold text-rose-600">
                    {formErrors.phone}
                  </p>
                )}
              </div>

              {/* Email Address (Auto-filled from login account) */}
              <div>
                <label
                  htmlFor="mc-email"
                  className={`flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-2.5 transition-colors focus-within:border-[#6A11CB] ${
                    formErrors.email ? 'border-rose-400' : 'border-[#DEC9FA]'
                  }`}
                >
                  <Mail
                    aria-hidden="true"
                    className="h-[19px] w-[19px] shrink-0 text-[#6A11CB] stroke-[1.9]"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold leading-none text-[#5E4B78]">
                      Email Address
                    </span>
                    <input
                      id="mc-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formErrors.email) {
                          setFormErrors((prev) => ({ ...prev, email: '' }));
                        }
                      }}
                      placeholder="you@example.com"
                      className="mt-1 w-full bg-transparent text-[14.5px] font-bold text-[#2B0B4E] placeholder:font-normal placeholder:text-[#9D8CB5] focus:outline-none"
                    />
                  </div>
                </label>
                {formErrors.email && (
                  <p className="mt-1 pl-1 text-[11.5px] font-semibold text-rose-600">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* House / Flat / Building / Street (Required) */}
              <div>
                <label
                  htmlFor="mc-address"
                  className={`flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-2.5 transition-colors focus-within:border-[#6A11CB] ${
                    formErrors.addressLine1 ? 'border-rose-400' : 'border-[#DEC9FA]'
                  }`}
                >
                  <Home
                    aria-hidden="true"
                    className="h-[19px] w-[19px] shrink-0 text-[#6A11CB] stroke-[1.9]"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold leading-none text-[#5E4B78]">
                      House / Flat / Building / Street{' '}
                      <span className="text-[#FF247A]">*</span>
                    </span>
                    <input
                      id="mc-address"
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => {
                        setAddressLine1(e.target.value);
                        if (formErrors.addressLine1) {
                          setFormErrors((prev) => ({ ...prev, addressLine1: '' }));
                        }
                      }}
                      placeholder="House no., street, locality"
                      className="mt-1 w-full bg-transparent text-[14.5px] font-bold text-[#2B0B4E] placeholder:font-normal placeholder:text-[#9D8CB5] focus:outline-none"
                    />
                  </div>
                </label>
                {formErrors.addressLine1 && (
                  <p className="mt-1 pl-1 text-[11.5px] font-semibold text-rose-600">
                    {formErrors.addressLine1}
                  </p>
                )}
              </div>

              {/* Landmark (Optional) */}
              <div>
                <label
                  htmlFor="mc-landmark"
                  className="flex items-center gap-3 rounded-2xl border border-[#DEC9FA] bg-white px-3.5 py-2.5 transition-colors focus-within:border-[#6A11CB]"
                >
                  <MapPin
                    aria-hidden="true"
                    className="h-[19px] w-[19px] shrink-0 text-[#6A11CB] stroke-[1.9]"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold leading-none text-[#5E4B78]">
                      Landmark (Optional)
                    </span>
                    <input
                      id="mc-landmark"
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near school, temple, or market"
                      className="mt-1 w-full bg-transparent text-[14.5px] font-bold text-[#2B0B4E] placeholder:font-normal placeholder:text-[#9D8CB5] focus:outline-none"
                    />
                  </div>
                </label>
              </div>

              {/* PIN Code (Required) */}
              <div>
                <label
                  htmlFor="mc-pincode"
                  className={`flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-2.5 transition-colors focus-within:border-[#6A11CB] ${
                    formErrors.pincode ? 'border-rose-400' : 'border-[#DEC9FA]'
                  }`}
                >
                  <LayoutGrid
                    aria-hidden="true"
                    className="h-[19px] w-[19px] shrink-0 text-[#6A11CB] stroke-[1.9]"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold leading-none text-[#5E4B78]">
                      PIN Code <span className="text-[#FF247A]">*</span>
                    </span>
                    <input
                      id="mc-pincode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={pincode}
                      onChange={(e) => {
                        setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        if (formErrors.pincode) {
                          setFormErrors((prev) => ({ ...prev, pincode: '' }));
                        }
                      }}
                      placeholder="6-digit PIN code"
                      className="mt-1 w-full bg-transparent text-[14.5px] font-bold tabular-nums text-[#2B0B4E] placeholder:font-normal placeholder:text-[#9D8CB5] focus:outline-none"
                    />
                  </div>
                </label>
                {formErrors.pincode && (
                  <p className="mt-1 pl-1 text-[11.5px] font-semibold text-rose-600">
                    {formErrors.pincode}
                  </p>
                )}
              </div>
            </div>

            {/* Save Address for Future Orders Checkbox */}
            <label className="mt-4 flex min-h-[44px] cursor-pointer items-center gap-2.5 select-none">
              <button
                type="button"
                role="checkbox"
                aria-checked={saveForFuture}
                onClick={() => setSaveForFuture((prev) => !prev)}
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border transition-colors ${
                  saveForFuture
                    ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
                    : 'border-[#C9B3EC] bg-white'
                }`}
              >
                {saveForFuture && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </button>
              <span className="text-[13.5px] font-semibold text-[#2B0B4E]">
                Save this address for future orders
              </span>
            </label>
          </section>

          {/* Step 1 Continue Button */}
          <div className="mt-4">
            <button
              type="submit"
              className="flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-6 text-[16px] font-extrabold text-white shadow-[0_8px_22px_-4px_rgba(162,28,175,0.48)] transition-transform active:scale-[0.985]"
            >
              <span>Continue</span>
              <ChevronRight className="h-5 w-5 shrink-0 stroke-[2.5]" />
            </button>
          </div>
        </form>
      )}

      {/* ================================================================
          STEP 2: CONFIRM DETAILS
      ================================================================ */}
      {step === 2 && (
        <div className="space-y-3 px-3.5">
          {/* Delivering To Card */}
          <section
            aria-label="Delivering to"
            className="rounded-[20px] border border-[#EBD8FF] bg-white p-3.5 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.14)]"
          >
            <div className="flex items-center gap-2">
              <MapPin
                aria-hidden="true"
                className="h-[18px] w-[18px] shrink-0 text-[#6A11CB] stroke-[2.2]"
              />
              <h2 className="text-[15.5px] font-extrabold text-[#2B0B4E]">
                Delivering to
              </h2>
            </div>

            <div className="mt-2.5 rounded-2xl border border-[#EFE2FF] bg-[#FAF6FF] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <User
                    aria-hidden="true"
                    className="mt-0.5 h-[16px] w-[16px] shrink-0 text-[#5B10B8] stroke-[2]"
                  />
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-extrabold leading-snug text-[#2B0B4E]">
                      {fullName}
                    </p>
                    <p className="mt-1 text-[12.5px] leading-[1.45] text-[#4B3568]">
                      {addressLine1}
                      {landmark.trim() ? `, ${landmark.trim()}` : ''}
                      <br />
                      {displayCityState} - {pincode}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="shrink-0 whitespace-nowrap rounded-xl border border-[#DEC7FF] bg-white px-3.5 py-1.5 text-[12px] font-extrabold text-[#5B10B8] shadow-2xs transition-transform active:scale-95"
                >
                  Change
                </button>
              </div>

              <div className="mt-2.5 space-y-1 border-t border-[#EFE2FF] pt-2 text-[12.5px] font-semibold text-[#3B2654]">
                <p className="flex items-center gap-2">
                  <Phone
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-[#5B10B8]"
                  />
                  <span className="tabular-nums">{phone}</span>
                </p>
                {email.trim() && (
                  <p className="flex items-center gap-2">
                    <Mail
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-[#5B10B8]"
                    />
                    <span className="truncate">{email.trim()}</span>
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Cart Products List Card */}
          <section
            aria-label="Order items"
            className="divide-y divide-[#F2E6FF] rounded-[20px] border border-[#EBD8FF] bg-white shadow-[0_6px_18px_-12px_rgba(106,17,203,0.14)]"
          >
            {items.map((item) => {
              const catalogProduct = productById.get(item.productId);
              const categoryLabel =
                (catalogProduct &&
                  categoryNameById.get(catalogProduct.categoryId)) ||
                'GiftKart';
              const CategoryIcon = getCategoryTagIcon(categoryLabel);

              return (
                <div
                  key={item.cartItemId}
                  className="flex items-center gap-3 p-3.5"
                >
                  <div className="h-[78px] w-[78px] shrink-0 overflow-hidden rounded-[14px] border border-[#F2E6FF] bg-[#FAF6FF]">
                    <ProductImage
                      src={item.image}
                      alt={item.productName}
                      aspectClass="aspect-square"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#DEC7FF] bg-[#F5ECFF] px-2.5 py-[2px] text-[10.5px] font-bold leading-none text-[#6A11CB]">
                      <CategoryIcon
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 stroke-[2.2]"
                      />
                      <span className="truncate">{categoryLabel}</span>
                    </span>

                    <p className="mt-1 line-clamp-2 text-[13.5px] font-extrabold leading-snug text-[#2B0B4E]">
                      {item.productName}
                    </p>

                    <p className="mt-0.5 text-[16px] font-extrabold leading-tight tabular-nums text-[#FF1F7A]">
                      {formatInr(item.unitPriceInr * item.quantity)}
                    </p>

                    <span className="mt-1 inline-block rounded-lg bg-[#F4ECFF] px-2.5 py-0.5 text-[11.5px] font-bold tabular-nums text-[#3B0764]">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Apply Coupon Section */}
          <section aria-label="Apply coupon">
            <div className="overflow-hidden rounded-2xl border border-[#E6D4FF] bg-[#F4ECFF]">
              <button
                type="button"
                onClick={() => setCouponPanelOpen((prev) => !prev)}
                aria-expanded={couponPanelOpen}
                className="flex min-h-[48px] w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors active:bg-[#EDE0FF]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Ticket
                    aria-hidden="true"
                    className="h-[20px] w-[20px] shrink-0 text-[#FF4D8D] stroke-[2]"
                  />
                  {appliedCouponCode ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[14px] font-extrabold text-[#2B0B4E]">
                        {appliedCouponCode} Applied
                      </span>
                      <span className="shrink-0 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-bold text-[#15803D]">
                        -{formatInr(couponDiscount)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[14.5px] font-extrabold text-[#2B0B4E]">
                      Apply Coupon
                    </span>
                  )}
                </div>

                <ChevronRight
                  aria-hidden="true"
                  className={`h-[18px] w-[18px] shrink-0 text-[#4C1D95] stroke-[2.3] transition-transform duration-200 ${
                    couponPanelOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {couponPanelOpen && (
                <div className="border-t border-[#E6D4FF] bg-white px-3.5 pb-3.5 pt-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void applyCouponCode(couponInput);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      placeholder="Enter coupon code"
                      aria-label="Coupon code"
                      className="h-[42px] min-w-0 flex-1 rounded-xl border border-[#E6D4FF] bg-[#FAF6FF] px-3 font-mono text-[13px] font-bold uppercase text-[#2B0B4E] placeholder:font-sans placeholder:font-medium placeholder:normal-case placeholder:text-[#84729B] focus:border-[#6A11CB] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={couponValidating}
                      className="h-[42px] shrink-0 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] px-4 text-[13px] font-extrabold text-white shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {couponValidating ? '...' : 'Apply'}
                    </button>
                  </form>

                  {appliedCouponCode && (
                    <div className="mt-2.5 flex items-center justify-between rounded-xl bg-[#ECFDF5] px-3 py-2 text-[12px]">
                      <span className="font-bold text-[#15803D]">
                        Code {appliedCouponCode} saves{' '}
                        {formatInr(couponDiscount)}
                      </span>
                      <button
                        type="button"
                        onClick={handleClearCoupon}
                        className="font-extrabold text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {activeCoupons.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {activeCoupons.map((coupon) => {
                        const isApplied = appliedCouponCode === coupon.code;
                        return (
                          <div
                            key={coupon.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="font-mono text-[12.5px] font-extrabold text-[#6A11CB]">
                                {coupon.code}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-snug text-[#5B4775]">
                                {coupon.description}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void applyCouponCode(coupon.code)}
                              disabled={isApplied || couponValidating}
                              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11.5px] font-extrabold active:scale-95 ${
                                isApplied
                                  ? 'bg-[#DCFCE7] text-[#15803D]'
                                  : 'border border-[#DEC7FF] bg-white text-[#6A11CB]'
                              }`}
                            >
                              {isApplied ? 'Applied' : 'Apply'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Price Details Card */}
          <section
            aria-label="Price details"
            className="rounded-[20px] border border-[#EBD8FF] bg-white p-4 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.14)]"
          >
            <div className="flex items-center gap-2">
              <ReceiptText
                aria-hidden="true"
                className="h-[19px] w-[19px] shrink-0 text-[#5B10B8] stroke-[2]"
              />
              <h2 className="text-[15.5px] font-extrabold text-[#2B0B4E]">
                Price Details{' '}
                <span className="font-semibold text-[#5E477A]">
                  ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
                </span>
              </h2>
            </div>

            <dl className="mt-3.5 space-y-2.5 text-[14px]">
              <div className="flex items-center justify-between gap-2">
                <dt className="font-medium text-[#2B0B4E]">Product Price</dt>
                <dd className="font-bold tabular-nums text-[#2B0B4E]">
                  {formatInr(pricing.totalProductPriceInr)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-[#16A34A]">
                  Product Discount
                </dt>
                <dd className="font-bold tabular-nums text-[#16A34A]">
                  - {formatInr(pricing.catalogDiscountInr)}
                </dd>
              </div>

              {couponDiscount > 0 && appliedCouponCode && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-semibold text-[#16A34A]">
                    Coupon Discount ({appliedCouponCode})
                  </dt>
                  <dd className="font-bold tabular-nums text-[#16A34A]">
                    - {formatInr(couponDiscount)}
                  </dd>
                </div>
              )}

              {giftWrap.enabled && giftWrapChargeInr > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-medium text-[#5A4575]">Gift Wrapping</dt>
                  <dd className="font-bold tabular-nums text-[#2B0B4E]">
                    + {formatInr(giftWrapChargeInr)}
                  </dd>
                </div>
              )}
            </dl>

            <div className="my-3.5 border-t border-[#EFE3FF]" />

            <div className="flex items-center justify-between gap-2">
              <span className="text-[16px] font-extrabold text-[#2B0B4E]">
                Order Total
              </span>
              <span className="text-[18.5px] font-extrabold tabular-nums text-[#5B10B8]">
                {formatInr(pricing.orderTotalInr)}
              </span>
            </div>

            {pricing.totalDiscountInr > 0 && (
              <div className="mt-3.5 flex items-center justify-center gap-2 rounded-xl bg-[#DCFCE7] px-3.5 py-2.5 text-[13px] font-bold text-[#15803D]">
                <BadgePercent
                  aria-hidden="true"
                  className="h-[19px] w-[19px] shrink-0 fill-[#16A34A] text-white"
                />
                <span>
                  Yay! Your total discount is{' '}
                  {formatInr(pricing.totalDiscountInr)}
                </span>
              </div>
            )}
          </section>

          {/* Step 2 Continue Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-6 text-[16px] font-extrabold text-white shadow-[0_8px_22px_-4px_rgba(162,28,175,0.48)] transition-transform active:scale-[0.985]"
            >
              <span>Continue</span>
              <ChevronRight className="h-5 w-5 shrink-0 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================
          STEP 3: PAYMENT (ONLY UPI DISABLED + COD ACTIVE)
      ================================================================ */}
      {step === 3 && (
        <div className="space-y-4 px-3.5">
          {/* Total Amount Collapsible Lavender Bar */}
          <div className="overflow-hidden rounded-2xl border border-[#E6D4FF] bg-[#F4ECFF]">
            <button
              type="button"
              onClick={() => setAmountExpanded((prev) => !prev)}
              aria-expanded={amountExpanded}
              className="flex min-h-[54px] w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="inline-flex items-center gap-1.5 text-[15.5px] font-extrabold text-[#5B10B8]">
                <span>Total Amount</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 stroke-[2.5] transition-transform duration-200 ${
                    amountExpanded ? 'rotate-180' : ''
                  }`}
                />
              </span>
              <span className="text-[19px] font-extrabold tabular-nums text-[#5B10B8]">
                {formatInr(pricing.orderTotalInr)}
              </span>
            </button>

            {amountExpanded && (
              <div className="space-y-1.5 border-t border-[#E6D4FF] bg-white px-4 py-3 text-[13px]">
                <div className="flex justify-between text-[#4B3568]">
                  <span>
                    Product Price ({itemCount}{' '}
                    {itemCount === 1 ? 'Item' : 'Items'})
                  </span>
                  <span className="font-bold tabular-nums text-[#2B0B4E]">
                    {formatInr(pricing.totalProductPriceInr)}
                  </span>
                </div>
                {pricing.totalDiscountInr > 0 && (
                  <div className="flex justify-between font-semibold text-[#16A34A]">
                    <span>Total Discount</span>
                    <span className="tabular-nums">
                      - {formatInr(pricing.totalDiscountInr)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#F2E6FF] pt-1.5 font-extrabold text-[#2B0B4E]">
                  <span>Order Total</span>
                  <span className="tabular-nums text-[#5B10B8]">
                    {formatInr(pricing.orderTotalInr)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Select Payment Method */}
          <section aria-label="Select payment method" className="space-y-3">
            <div className="flex items-center gap-2 pt-1">
              <CreditCard
                aria-hidden="true"
                className="h-[20px] w-[20px] shrink-0 text-[#5B10B8] stroke-[2.2]"
              />
              <h2 className="text-[16px] font-extrabold text-[#2B0B4E]">
                Select Payment Method
              </h2>
            </div>

            {/* 1. UPI Payment — DISABLED & NOT SELECTABLE */}
            <div
              aria-disabled="true"
              className="flex cursor-not-allowed select-none items-center gap-3.5 rounded-[18px] border border-[#E6E1EE] bg-[#F3F1F6] p-4"
            >
              <UpiWordmarkIcon />

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-extrabold leading-tight text-[#847D8F]">
                  UPI Payment
                </p>
                <p className="mt-1 text-[12.5px] font-medium leading-snug text-[#E53935]">
                  UPI payment is currently not available.
                </p>
              </div>

              <Ban
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-[#E59A9A] stroke-[2]"
              />
            </div>

            {/* 2. Cash on Delivery (COD) — ACTIVE & SELECTED */}
            <button
              type="button"
              role="radio"
              aria-checked={paymentMethod === 'cod'}
              className="flex w-full items-center gap-3.5 rounded-[18px] border-[1.6px] border-[#6A11CB] bg-white p-4 text-left shadow-[0_6px_20px_-10px_rgba(106,17,203,0.22)] transition-transform active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5ECFF] text-[#6A11CB]">
                <PackageCheck className="h-[22px] w-[22px] stroke-[2]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-extrabold leading-tight text-[#2B0B4E]">
                  Cash on Delivery (COD)
                </p>
                <p className="mt-1 text-[12.5px] font-medium leading-snug text-[#5B4775]">
                  Pay when you receive your order
                </p>
              </div>

              <span
                aria-hidden="true"
                className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-[#6A11CB] bg-white"
              >
                <span className="h-3 w-3 rounded-full bg-[#6A11CB]" />
              </span>
            </button>
          </section>

          {/* Safe & Secure Order Notice */}
          <section
            aria-label="Safe and secure order"
            className="flex items-center gap-3.5 rounded-[20px] border border-[#E6D4FF] bg-[#F5EEFF] p-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6A11CB] text-white shadow-[0_4px_12px_rgba(106,17,203,0.28)]">
              <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-extrabold text-[#2B0B4E]">
                Safe &amp; Secure Order
              </p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-[#533F6E]">
                Your order is protected and will be delivered to your given
                address.
              </p>
            </div>
          </section>

          {/* Place Order Gradient Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => void handlePlaceOrder()}
              disabled={submitting}
              className="flex h-[52px] w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-6 text-[16px] font-extrabold text-white shadow-[0_8px_22px_-4px_rgba(162,28,175,0.48)] transition-transform active:scale-[0.985] disabled:opacity-60"
            >
              <Lock className="h-[18px] w-[18px] shrink-0 stroke-[2.4]" />
              <span>{submitting ? 'Placing Order...' : 'Place Order'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
