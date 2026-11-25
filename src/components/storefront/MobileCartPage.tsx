import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BadgePercent,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Gift,
  Heart,
  Home,
  Image as ImageIcon,
  KeyRound,
  Lightbulb,
  MapPin,
  Minus,
  Package,
  Plus,
  ReceiptText,
  Shirt,
  ShoppingBag,
  Tag,
  Ticket,
  Trash2,
  X,
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
} from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { ProductImage } from '../ui/ProductImage';
import { formatInr } from '../../utils/format';

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

export function MobileCartPage() {
  const {
    items,
    itemCount,
    subtotalInr,
    giftWrap,
    giftWrapChargeInr,
    updateQuantity,
    removeItem,
    toggleWishlist,
    isWishlisted,
  } = useCart();
  const { customerAccount } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: products } = useProducts({ includeInactive: true });
  const { data: categories } = useCategories(true);
  const { data: savedAddresses } = useSavedAddresses();
  const { data: coupons } = useCoupons();

  // Delivery address selection (defaults automatically to customer's default saved address)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);

  // Coupon section state
  const [couponPanelOpen, setCouponPanelOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>();
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (savedAddresses.length === 0) {
      setSelectedAddressId(null);
      return;
    }
    const stillExists = savedAddresses.some((a) => a.id === selectedAddressId);
    if (!stillExists) {
      const preferred =
        savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
      setSelectedAddressId(preferred.id);
    }
  }, [savedAddresses, selectedAddressId]);

  // Keep applied coupon discount synced with real subtotal when quantities/items change
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

  const selectedAddress = useMemo(
    () =>
      savedAddresses.find((a) => a.id === selectedAddressId) ??
      savedAddresses.find((a) => a.isDefault) ??
      savedAddresses[0] ??
      null,
    [savedAddresses, selectedAddressId]
  );

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

  // Real price & discount calculations strictly derived from actual catalog data
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
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  function handleWishlistToggle(productId: string, productName: string) {
    if (!customerAccount) {
      navigate('/account', {
        state: {
          from: `${location.pathname}${location.search}`,
          reason: 'wishlist',
        },
      });
      return;
    }
    const added = toggleWishlist(productId);
    pushToast({
      title: added ? 'Saved to Wishlist' : 'Removed from Wishlist',
      description: productName,
      variant: 'info',
    });
  }

  function handleRemoveItem(cartItemId: string, productName: string) {
    removeItem(cartItemId);
    pushToast({
      title: 'Removed from Cart',
      description: productName,
      variant: 'info',
    });
  }

  async function applyCouponCode(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a valid coupon code.');
      return;
    }
    setCouponError('');
    setCouponValidating(true);
    try {
      const res = await services.promotions.validateCoupon(code, subtotalInr);
      if (!res.valid) {
        setCouponDiscount(0);
        setAppliedCouponCode(undefined);
        setCouponError(res.message);
        return;
      }
      setCouponDiscount(res.discountInr);
      setAppliedCouponCode(res.coupon?.code ?? code);
      setCouponInput(res.coupon?.code ?? code);
      setCouponError('');
      setCouponPanelOpen(false);
    } finally {
      setCouponValidating(false);
    }
  }

  function handleCouponSubmit(e: React.FormEvent) {
    e.preventDefault();
    void applyCouponCode(couponInput);
  }

  function handleClearCoupon() {
    setAppliedCouponCode(undefined);
    setCouponDiscount(0);
    setCouponInput('');
    setCouponError('');
  }

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100dvh-120px)] w-full bg-gradient-to-b from-[#FDF8FF] via-[#FAF4FF] to-[#F5ECFF] px-4 pb-24 pt-3">
        {/* Top My Cart Title Bar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="-ml-1.5 flex h-10 w-10 items-center justify-center rounded-full text-[#3B0764] transition-colors active:bg-[#EBD8FF]/60"
          >
            <ChevronLeft className="h-[22px] w-[22px] stroke-[2.4]" />
          </button>
          <h1 className="text-[19px] font-extrabold tracking-[-0.015em] text-[#2B0B4E]">
            My Cart{' '}
            <span className="font-semibold text-[#5E477A]">(0 Items)</span>
          </h1>
        </div>

        <div className="mt-10 flex flex-col items-center rounded-[24px] border border-[#EBD8FF] bg-white px-6 py-10 text-center shadow-[0_8px_24px_-12px_rgba(106,17,203,0.16)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5ECFF] text-[#6A11CB]">
            <ShoppingBag className="h-8 w-8 stroke-[1.9]" />
          </div>
          <h2 className="mt-4 text-[18px] font-extrabold text-[#2B0B4E]">
            Your Cart is Empty
          </h2>
          <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-[#6A5782]">
            Add photo frames, coffee mugs, T-shirt prints, or keychains to get started.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex h-[46px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-7 text-[14px] font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(106,17,203,0.4)] transition-transform active:scale-[0.98]"
          >
            <Gift className="h-4 w-4 stroke-[2.2]" />
            <span>Explore Gifts</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-56px)] w-full overflow-x-clip bg-gradient-to-b from-[#FDF9FF] via-[#FAF5FF] to-[#F6EEFF] pb-[108px]">
      {/* 1. MY CART HEADER ROW (No Step Indicator) */}
      <div className="flex items-center gap-1 px-3 pb-2 pt-2.5">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#3B0764] transition-colors active:bg-[#EBD8FF]/60"
        >
          <ChevronLeft className="h-[22px] w-[22px] stroke-[2.4]" />
        </button>
        <h1 className="truncate text-[18.5px] font-extrabold tracking-[-0.015em] text-[#2B0B4E]">
          My Cart{' '}
          <span className="font-semibold text-[#5E477A]">
            ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
          </span>
        </h1>
      </div>

      {/* DELIVERY ADDRESS STRIP */}
      <section aria-label="Delivery address" className="px-3.5">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#E6D4FF] bg-[#F4ECFF] px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin
              aria-hidden="true"
              className="h-[18px] w-[18px] shrink-0 text-[#6A11CB] stroke-[2.1]"
            />
            <p className="truncate text-[13.5px] font-bold text-[#2B0B4E]">
              {selectedAddress
                ? `Delivery at ${selectedAddress.city} - ${selectedAddress.pincode}`
                : 'Add Delivery Address'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (savedAddresses.length > 0) {
                setAddressSheetOpen(true);
              } else {
                navigate('/addresses');
              }
            }}
            className="shrink-0 whitespace-nowrap rounded-xl border border-[#DEC7FF] bg-white px-3.5 py-1.5 text-[12.5px] font-extrabold text-[#3B0764] shadow-[0_2px_6px_rgba(106,17,203,0.08)] transition-transform active:scale-95"
          >
            {selectedAddress ? 'Change' : 'Add'}
          </button>
        </div>
      </section>

      {/* 2. CART PRODUCT CARDS */}
      <section aria-label="Cart items" className="mt-3 space-y-3 px-3.5">
        {items.map((item) => {
          const catalogProduct = productById.get(item.productId);
          const categoryLabel =
            (catalogProduct && categoryNameById.get(catalogProduct.categoryId)) ||
            'GiftKart';
          const CategoryIcon = getCategoryTagIcon(categoryLabel);
          const saved = isWishlisted(item.productId);
          const linePriceInr = item.unitPriceInr * item.quantity;

          return (
            <article
              key={item.cartItemId}
              className="flex items-stretch gap-3 rounded-[20px] border border-[#EBD8FF] bg-white p-3 shadow-[0_6px_18px_-10px_rgba(106,17,203,0.16)]"
            >
              {/* Product Image */}
              <Link
                to={`/product/${item.productSlug}`}
                className="h-[92px] w-[92px] shrink-0 self-center overflow-hidden rounded-[16px] border border-[#F2E6FF] bg-[#FAF6FF]"
              >
                <ProductImage
                  src={item.image}
                  alt={item.productName}
                  aspectClass="aspect-square"
                />
              </Link>

              {/* Middle Details: Category Tag, Name, Price, Quantity Control */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  {/* Category Tag */}
                  <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#F3E8FF] px-2.5 py-[3px] text-[11px] font-bold leading-none text-[#6A11CB]">
                    <CategoryIcon
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 stroke-[2.2]"
                    />
                    <span className="truncate">{categoryLabel}</span>
                  </span>

                  {/* Product Name */}
                  <Link
                    to={`/product/${item.productSlug}`}
                    className="mt-1.5 block line-clamp-2 text-[14px] font-extrabold leading-[1.28] text-[#2B0B4E]"
                  >
                    {item.productName}
                  </Link>

                  {/* Current Product Price */}
                  <p className="mt-1 text-[17.5px] font-extrabold leading-none tabular-nums text-[#FF1F7A]">
                    {formatInr(linePriceInr)}
                  </p>
                </div>

                {/* Quantity Minus / Plus Pill */}
                <div className="mt-2.5 inline-flex h-[32px] w-fit items-center rounded-full border border-[#E5D3FF] bg-[#F6EEFF] px-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.cartItemId, item.quantity - 1)
                    }
                    aria-label={`Decrease quantity of ${item.productName}`}
                    className="flex h-[30px] w-[32px] items-center justify-center rounded-full text-[#4C1D95] transition-colors active:bg-[#EBD8FF]"
                  >
                    <Minus className="h-3.5 w-3.5 stroke-[2.4]" />
                  </button>
                  <span className="min-w-[26px] text-center text-[13.5px] font-extrabold tabular-nums text-[#2B0B4E]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.cartItemId, item.quantity + 1)
                    }
                    aria-label={`Increase quantity of ${item.productName}`}
                    className="flex h-[30px] w-[32px] items-center justify-center rounded-full text-[#4C1D95] transition-colors active:bg-[#EBD8FF]"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.4]" />
                  </button>
                </div>
              </div>

              {/* Right Column: Wishlist Icon (Top) & Remove Icon (Bottom) */}
              <div className="flex shrink-0 flex-col items-center justify-between py-0.5">
                <button
                  type="button"
                  onClick={() =>
                    handleWishlistToggle(item.productId, item.productName)
                  }
                  aria-label={
                    saved
                      ? `Remove ${item.productName} from wishlist`
                      : `Save ${item.productName} to wishlist`
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EFE2FF] bg-white shadow-[0_2px_8px_rgba(106,17,203,0.08)] transition-transform active:scale-90"
                >
                  <Heart
                    className={`h-[18px] w-[18px] ${
                      saved
                        ? 'fill-[#FF4D8D] text-[#FF4D8D]'
                        : 'stroke-[2] text-[#4C1D95]'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleRemoveItem(item.cartItemId, item.productName)
                  }
                  aria-label={`Remove ${item.productName} from cart`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#5B4675] transition-colors active:scale-90 active:bg-rose-50 active:text-rose-600"
                >
                  <Trash2 className="h-[18px] w-[18px] stroke-[1.9]" />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* 3. APPLY COUPON SECTION */}
      <section aria-label="Apply coupon" className="mt-3 px-3.5">
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
              <form onSubmit={handleCouponSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    if (couponError) setCouponError('');
                  }}
                  placeholder="Enter coupon code"
                  aria-label="Coupon code"
                  className="h-[42px] min-w-0 flex-1 rounded-xl border border-[#E6D4FF] bg-[#FAF6FF] px-3 font-mono text-[13px] font-bold uppercase text-[#2B0B4E] placeholder:font-sans placeholder:font-medium placeholder:normal-case placeholder:text-[#84729B] focus:border-[#6A11CB] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={couponValidating}
                  className="h-[42px] shrink-0 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] px-4 text-[13px] font-extrabold text-white shadow-[0_4px_12px_rgba(106,17,203,0.25)] active:scale-95 disabled:opacity-50"
                >
                  {couponValidating ? '...' : 'Apply'}
                </button>
              </form>

              {couponError && (
                <p className="mt-2 text-[12px] font-semibold text-rose-600">
                  {couponError}
                </p>
              )}

              {appliedCouponCode && (
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-[#ECFDF5] px-3 py-2 text-[12px]">
                  <span className="font-bold text-[#15803D]">
                    Code {appliedCouponCode} saves {formatInr(couponDiscount)}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearCoupon}
                    className="font-extrabold text-rose-600 underline-offset-2 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              {activeCoupons.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#76628E]">
                    Available Coupons
                  </p>
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
                          className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11.5px] font-extrabold transition-transform active:scale-95 ${
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

      {/* 4. PRICE DETAILS CARD (Real Product Price & Real Discount Only) */}
      <section aria-label="Price details" className="mt-3 px-3.5">
        <div className="rounded-[20px] border border-[#EBD8FF] bg-white p-4 shadow-[0_6px_18px_-10px_rgba(106,17,203,0.14)]">
          {/* Card Header */}
          <div className="flex items-center gap-2">
            <ReceiptText
              aria-hidden="true"
              className="h-[19px] w-[19px] shrink-0 text-[#3B0764] stroke-[2]"
            />
            <h2 className="text-[15.5px] font-extrabold text-[#2B0B4E]">
              Price Details{' '}
              <span className="font-semibold text-[#5E477A]">
                ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
              </span>
            </h2>
          </div>

          {/* Breakdown Rows */}
          <dl className="mt-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <dt className="border-b border-dotted border-[#5A4575]/60 pb-0.5 text-[14px] font-medium text-[#2B0B4E]">
                Product Price
              </dt>
              <dd className="text-[14.5px] font-bold tabular-nums text-[#2B0B4E]">
                + {formatInr(pricing.totalProductPriceInr)}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-2">
              <dt className="border-b border-dotted border-[#16A34A]/75 pb-0.5 text-[14px] font-semibold text-[#16A34A]">
                Product Discount
              </dt>
              <dd className="text-[14.5px] font-bold tabular-nums text-[#16A34A]">
                - {formatInr(pricing.catalogDiscountInr)}
              </dd>
            </div>

            {couponDiscount > 0 && appliedCouponCode && (
              <div className="flex items-center justify-between gap-2">
                <dt className="border-b border-dotted border-[#16A34A]/75 pb-0.5 text-[14px] font-semibold text-[#16A34A]">
                  Coupon Discount ({appliedCouponCode})
                </dt>
                <dd className="text-[14.5px] font-bold tabular-nums text-[#16A34A]">
                  - {formatInr(couponDiscount)}
                </dd>
              </div>
            )}

            {giftWrap.enabled && giftWrapChargeInr > 0 && (
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[14px] font-medium text-[#5A4575]">
                  Gift Wrapping
                </dt>
                <dd className="text-[14.5px] font-bold tabular-nums text-[#2B0B4E]">
                  + {formatInr(giftWrapChargeInr)}
                </dd>
              </div>
            )}
          </dl>

          {/* Divider */}
          <div className="my-3.5 border-t border-[#EFE3FF]" />

          {/* Order Total */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[16px] font-extrabold text-[#2B0B4E]">
              Order Total
            </span>
            <span className="text-[18px] font-extrabold tabular-nums text-[#2B0B4E]">
              {formatInr(pricing.orderTotalInr)}
            </span>
          </div>

          {/* Light Green Savings Banner (Only when real discount > ₹0) */}
          {pricing.totalDiscountInr > 0 && (
            <div className="mt-3.5 flex items-center justify-center gap-2 rounded-xl bg-[#DCFCE7] px-3.5 py-2.5 text-[13px] font-bold text-[#15803D]">
              <BadgePercent
                aria-hidden="true"
                className="h-[19px] w-[19px] shrink-0 fill-[#16A34A] text-white"
              />
              <span>
                Yay! Your total discount is {formatInr(pricing.totalDiscountInr)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 5. STICKY BOTTOM CHECKOUT BAR */}
      <div
        role="region"
        aria-label="Cart checkout summary"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] border-t border-[#EBD8FF] bg-white px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-6px_rgba(106,17,203,0.14)] lg:hidden"
      >
        <div className="mx-auto flex max-w-[480px] items-center gap-4">
          {/* Left: Total Amount */}
          <div className="shrink-0">
            <p className="text-[22px] font-extrabold leading-none tabular-nums text-[#2B0B4E]">
              {formatInr(pricing.orderTotalInr)}
            </p>
            <p className="mt-1 text-[11.5px] font-medium text-[#75628E]">
              Total Amount
            </p>
          </div>

          <div
            aria-hidden="true"
            className="h-9 w-px shrink-0 bg-[#E6D4FF]"
          />

          {/* Right: Gradient Continue Button */}
          <Link
            to="/checkout"
            state={{
              couponCode: appliedCouponCode,
              couponDiscount,
              selectedAddressId: selectedAddress?.id,
            }}
            className="flex h-[48px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-6 text-[16px] font-extrabold text-white shadow-[0_8px_20px_-4px_rgba(162,28,175,0.48)] transition-transform active:scale-[0.985]"
          >
            <span>Continue</span>
            <ChevronRight className="h-5 w-5 shrink-0 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* SAVED DELIVERY ADDRESS SELECTOR SHEET */}
      {addressSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Select delivery address"
        >
          <div
            className="fixed inset-0 bg-[#2B0B4E]/40 backdrop-blur-xs"
            onClick={() => setAddressSheetOpen(false)}
          />
          <div className="relative z-10 w-full rounded-t-[26px] border-t border-[#EBD8FF] bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(43,11,78,0.2)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E6D4FF]" />
            <div className="flex items-center justify-between gap-2 pb-2">
              <h2 className="text-[16px] font-extrabold text-[#2B0B4E]">
                Select Delivery Address
              </h2>
              <button
                type="button"
                onClick={() => setAddressSheetOpen(false)}
                aria-label="Close address selector"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5ECFF] text-[#4C1D95]"
              >
                <X className="h-4 w-4 stroke-[2.3]" />
              </button>
            </div>

            <div className="max-h-[48vh] space-y-2.5 overflow-y-auto py-1">
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setSelectedAddressId(addr.id);
                      setAddressSheetOpen(false);
                      pushToast({
                        title: 'Delivery Address Updated',
                        description: `${addr.label} (${addr.city} - ${addr.pincode})`,
                        variant: 'success',
                      });
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                      isSelected
                        ? 'border-[#6A11CB] bg-[#F7F0FF]'
                        : 'border-[#EFE2FF] bg-white active:bg-[#FAF6FF]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-extrabold text-[#2B0B4E]">
                        {addr.label} · {addr.fullName}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-[#5B4775]">
                        {addr.addressLine1}
                        {addr.area ? `, ${addr.area}` : ''}
                      </p>
                      <p className="mt-0.5 text-[12px] font-semibold text-[#6A11CB]">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
                          : 'border-[#D4BEF5] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <Link
              to="/addresses"
              onClick={() => setAddressSheetOpen(false)}
              className="mt-3 flex h-[44px] w-full items-center justify-center rounded-full border border-[#DEC7FF] bg-[#FAF5FF] text-[13.5px] font-extrabold text-[#6A11CB] active:scale-[0.985]"
            >
              Manage / Add New Address
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
