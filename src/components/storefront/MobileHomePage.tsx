import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Gift,
  Headphones,
  Heart,
  LayoutGrid,
  Search,
  Sparkles,
  Smile,
} from 'lucide-react';
import { useProducts, useStoreSettings } from '../../hooks/useStoreData';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ProductImage } from '../ui/ProductImage';
import { formatInr } from '../../utils/format';

import occasionBirthdayImg from '../../assets/images/mobile_occasion_birthday_1795372824084.jpg';
import occasionAnniversaryImg from '../../assets/images/mobile_occasion_anniversary_1795372828097.jpg';
import occasionRomanticImg from '../../assets/images/mobile_occasion_romantic_1795372827257.jpg';
import occasionFestiveImg from '../../assets/images/mobile_occasion_festive_1795372827888.jpg';

const MOBILE_QUICK_CATEGORIES = [
  {
    id: 'mq-all-gifts',
    label: 'All Gifts',
    to: '/shop',
    Icon: Gift,
    iconBg: 'bg-gradient-to-br from-[#6A11CB] to-[#9B27D8] text-white',
    cardBg: 'from-[#F8F0FF] to-[#EFE1FF]',
  },
  {
    id: 'mq-personalized',
    label: 'Personalized',
    to: '/customize',
    Icon: Sparkles,
    iconBg: 'bg-gradient-to-br from-[#FF4D8D] to-[#E62E73] text-white',
    cardBg: 'from-[#FFF1F7] to-[#FFE2EE]',
  },
  {
    id: 'mq-toys-games',
    label: 'Toys & Games',
    to: '/category/handmade-gift',
    Icon: Smile,
    iconBg: 'bg-gradient-to-br from-[#8B2CE2] to-[#FF4D8D] text-white',
    cardBg: 'from-[#FAF1FF] to-[#F3E3FF]',
  },
  {
    id: 'mq-accessories',
    label: 'Accessories',
    to: '/category/personalized-accessories',
    Icon: Headphones,
    iconBg: 'bg-gradient-to-br from-[#6A11CB] to-[#7D2AE8] text-white',
    cardBg: 'from-[#F6EEFF] to-[#ECE0FF]',
  },
  {
    id: 'mq-more',
    label: 'More',
    to: '/categories',
    Icon: LayoutGrid,
    iconBg: 'bg-white text-[#6A11CB] ring-1 ring-[#6A11CB]/25',
    cardBg: 'from-[#F9F3FF] to-[#F1E4FF]',
  },
] as const;

const MOBILE_OCCASION_CARDS = [
  {
    id: 'mocc-birthday',
    label: 'Birthday',
    to: '/shop?occasion=Birthday',
    imageUrl: occasionBirthdayImg,
  },
  {
    id: 'mocc-anniversary',
    label: 'Anniversary',
    to: '/shop?occasion=Anniversary',
    imageUrl: occasionAnniversaryImg,
  },
  {
    id: 'mocc-romantic',
    label: 'Love & Romantic',
    to: '/shop?occasion=Couple',
    imageUrl: occasionRomanticImg,
  },
  {
    id: 'mocc-festive',
    label: 'Festive',
    to: '/shop?occasion=Festival',
    imageUrl: occasionFestiveImg,
  },
] as const;

export function MobileHomePage() {
  const { data: settings } = useStoreSettings();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { toggleWishlist, isWishlisted } = useCart();
  const { customerAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [resetTick, setResetTick] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const slides = useMemo(
    () =>
      (settings?.heroSlides ?? [])
        .filter((s) => s.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [settings?.heroSlides]
  );

  const slideCount = slides.length;
  const safeSlideIndex = slideCount > 0 ? activeSlide % slideCount : 0;

  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideCount);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [slideCount, resetTick]);

  const featuredProducts = useMemo(() => {
    const featured = products.filter((p) => p.isFeatured || p.isBestSeller);
    const remaining = products.filter((p) => !p.isFeatured && !p.isBestSeller);
    return [...featured, ...remaining];
  }, [products]);

  function jumpToSlide(idx: number) {
    setActiveSlide(idx);
    setResetTick((t) => t + 1);
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null || slideCount <= 1) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    if (Math.abs(deltaX) > 32 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        jumpToSlide((safeSlideIndex + 1) % slideCount);
      } else {
        jumpToSlide((safeSlideIndex - 1 + slideCount) % slideCount);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      navigate('/shop');
      return;
    }
    navigate(`/search?search=${encodeURIComponent(trimmed)}`);
  }

  function handleWishlistToggle(productId: string) {
    if (!customerAccount) {
      navigate('/account', {
        state: {
          from: `${location.pathname}${location.search}`,
          reason: 'wishlist',
        },
      });
      return;
    }
    toggleWishlist(productId);
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-gradient-to-b from-[#FFFFFF] via-[#FAF4FF] to-[#FFFFFF] pb-6">
      {/* SECTION 2: COMPACT RECTANGULAR SEARCH BAR (Above Sliding Banner) */}
      <section aria-label="Search gifts" className="px-3 pt-2.5 pb-2.5">
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="flex h-[40px] w-full items-center gap-2.5 rounded-lg bg-white px-3.5 shadow-[0_4px_14px_-8px_rgba(106,17,203,0.18)] ring-1 ring-[#E5D0FF] transition-shadow focus-within:ring-2 focus-within:ring-[#6A11CB]/45"
        >
          <button
            type="submit"
            aria-label="Submit search"
            className="flex shrink-0 items-center justify-center text-[#6A11CB]"
          >
            <Search className="h-[17px] w-[17px] stroke-[2.2]" />
          </button>
          <label htmlFor="mobile-home-search" className="sr-only">
            Search for Gifts, Products &amp; More
          </label>
          <input
            id="mobile-home-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for Gifts, Products & More..."
            className="w-full bg-transparent text-[13px] font-medium text-[#1E1035] placeholder:text-[#7E7094] focus:outline-none"
          />
        </form>
      </section>

      {/* SECTION 3: FULL-WIDTH EDGE-TO-EDGE FLATTER SLIDING BANNER (Admin-Controlled Live Slides) */}
      {slideCount > 0 && (
        <section aria-label="Promotional offers" className="w-full">
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative h-[126px] w-full overflow-hidden rounded-none bg-gradient-to-r from-[#6A11CB] via-[#8E24D6] to-[#FF4D8D] min-[390px]:h-[136px] sm:h-[176px]"
          >
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
              style={{ transform: `translate3d(-${safeSlideIndex * 100}%, 0, 0)` }}
            >
              {slides.map((slide) => (
                <Link
                  key={slide.id}
                  to={slide.ctaHref || '/shop'}
                  className="relative block h-full w-full shrink-0"
                >
                  <img
                    src={slide.imageUrl}
                    alt={`${slide.titlePrefix} ${slide.titleHighlight}`}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    referrerPolicy="no-referrer"
                    className="h-full w-full select-none object-cover object-[center_52%]"
                  />
                </Link>
              ))}
            </div>

            {slideCount > 1 && (
              <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#2B0B4E]/35 px-2.5 py-1 backdrop-blur-xs">
                {slides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`View banner ${idx + 1}`}
                    onClick={() => jumpToSlide(idx)}
                    className={`block cursor-pointer rounded-full transition-all duration-300 ${
                      idx === safeSlideIndex
                        ? 'h-1.5 w-4 bg-white'
                        : 'h-1.5 w-1.5 bg-white/45'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 4: QUICK CATEGORY NAVIGATION (5 Shortcuts — No Service Benefits Strip Below) */}
      <section aria-label="Quick categories" className="mt-3.5 px-3">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-2xl bg-white/85 p-2.5 shadow-[0_6px_22px_-12px_rgba(106,17,203,0.16)] ring-1 ring-[#EBD8FF]/70 sm:grid sm:grid-cols-5 sm:overflow-visible">
          {MOBILE_QUICK_CATEGORIES.map(({ id, label, to, Icon, iconBg, cardBg }) => (
            <Link
              key={id}
              to={to}
              className={`group flex min-w-[66px] flex-1 shrink-0 snap-start flex-col items-center justify-center rounded-xl bg-gradient-to-b px-1.5 py-2.5 text-center ring-1 ring-[#EBD8FF]/55 transition-transform duration-150 active:scale-95 ${cardBg}`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs ${iconBg}`}
              >
                <Icon className="h-5 w-5 stroke-[2]" />
              </span>
              <span className="mt-1.5 line-clamp-1 text-[10.5px] font-semibold leading-tight text-[#1E1035]">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 5: SHOP BY OCCASION (4 Studio Photography Cards) */}
      <section aria-labelledby="mobile-occasion-heading" className="mt-5 px-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="mobile-occasion-heading"
            className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-[#1E1035]"
          >
            <span
              aria-hidden="true"
              className="h-4 w-[3.5px] rounded-full bg-[#FF4D8D]"
            />
            <span>Shop by Occasion</span>
          </h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4D8D] active:opacity-75"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="no-scrollbar mt-2.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 min-[390px]:grid min-[390px]:grid-cols-4 min-[390px]:overflow-visible">
          {MOBILE_OCCASION_CARDS.map((card) => (
            <Link
              key={card.id}
              to={card.to}
              className="group flex w-[88px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-[#F6ECFF]/90 shadow-[0_6px_16px_-8px_rgba(106,17,203,0.18)] ring-1 ring-[#EBD8FF]/70 transition-transform duration-150 active:scale-[0.97] min-[390px]:w-auto"
            >
              <div className="aspect-square w-full overflow-hidden bg-[#FFF0F6]">
                <img
                  src={card.imageUrl}
                  alt={card.label}
                  loading="eager"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex min-h-[34px] flex-1 items-center justify-center px-1 py-1.5 text-center">
                <span className="line-clamp-2 text-[11px] font-semibold leading-[1.2] text-[#1E1035]">
                  {card.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 6: FEATURED COLLECTION (Real Store Products) */}
      <section aria-labelledby="mobile-featured-heading" className="mt-5 px-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="mobile-featured-heading"
            className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-[#1E1035]"
          >
            <span
              aria-hidden="true"
              className="h-4 w-[3.5px] rounded-full bg-[#FF4D8D]"
            />
            <span>Featured Collection</span>
          </h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4D8D] active:opacity-75"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {productsLoading ? (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#EBD8FF]/70"
              >
                <div className="aspect-square animate-pulse bg-[#F4EBFF]" />
                <div className="space-y-1.5 p-2.5">
                  <div className="h-3.5 w-4/5 animate-pulse rounded bg-[#F4EBFF]" />
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#F4EBFF]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {featuredProducts.map((product) => {
              const saved = isWishlisted(product.id);
              const hasDiscount =
                Boolean(product.compareAtPriceInr) &&
                (product.compareAtPriceInr ?? 0) > product.priceInr;

              return (
                <article
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_6px_18px_-10px_rgba(106,17,203,0.18)] ring-1 ring-[#EBD8FF]/75"
                >
                  <div className="relative overflow-hidden bg-[#FAF6FF]">
                    <Link to={`/product/${product.slug}`} className="block">
                      <ProductImage
                        src={product.images[0]}
                        alt={product.name}
                        aspectClass="aspect-square"
                      />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleWishlistToggle(product.id)}
                      aria-label={
                        saved
                          ? `Remove ${product.name} from wishlist`
                          : `Save ${product.name} to wishlist`
                      }
                      className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/92 shadow-xs backdrop-blur-xs transition-transform active:scale-90"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${
                          saved
                            ? 'fill-[#FF4D8D] text-[#FF4D8D]'
                            : 'text-[#2B0B4E]'
                        }`}
                      />
                    </button>
                  </div>

                  <Link
                    to={`/product/${product.slug}`}
                    className="flex flex-1 flex-col justify-between p-2.5"
                  >
                    <h3 className="line-clamp-2 text-[12px] font-semibold leading-[1.35] text-[#1E1035]">
                      {product.name}
                    </h3>

                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-[13.5px] font-bold tabular-nums text-[#6A11CB]">
                        {formatInr(product.priceInr)}
                      </span>
                      {hasDiscount && product.compareAtPriceInr && (
                        <span className="text-[11px] font-medium tabular-nums text-[#8B7AA0] line-through">
                          {formatInr(product.compareAtPriceInr)}
                        </span>
                      )}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
