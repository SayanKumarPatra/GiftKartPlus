import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, Search } from 'lucide-react';
import { OCCASION_ICONS, STUDIO_MEDIA } from '../../config/appConfig';
import {
  useCategories,
  useProducts,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ProductImage } from '../ui/ProductImage';
import { formatInr } from '../../utils/format';

import occasionBirthdayImg from '../../assets/images/mobile_occasion_birthday_1795372824084.jpg';
import occasionAnniversaryImg from '../../assets/images/mobile_occasion_anniversary_1795372828097.jpg';
import occasionRomanticImg from '../../assets/images/mobile_occasion_romantic_1795372827257.jpg';
import occasionFestiveImg from '../../assets/images/mobile_occasion_festive_1795372827888.jpg';

interface QuickCategoryItem {
  id: string;
  label: string;
  to: string;
  imageUrl: string;
}

interface MobileOccasionItem {
  id: string;
  label: string;
  to: string;
  imageUrl: string;
  isCutout?: boolean;
}

const MOBILE_OCCASION_ITEMS: MobileOccasionItem[] = [
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
    label: 'Love & Couple',
    to: '/shop?occasion=Couple',
    imageUrl: occasionRomanticImg,
  },
  {
    id: 'mocc-festive',
    label: 'Festive',
    to: '/shop?occasion=Festival',
    imageUrl: occasionFestiveImg,
  },
  {
    id: 'mocc-friendship',
    label: 'Friendship',
    to: '/shop?occasion=Friendship',
    imageUrl: OCCASION_ICONS.friendship,
    isCutout: true,
  },
  {
    id: 'mocc-corporate',
    label: 'Corporate',
    to: '/shop?occasion=Corporate',
    imageUrl: OCCASION_ICONS.corporate,
    isCutout: true,
  },
  {
    id: 'mocc-return',
    label: 'Return Gifts',
    to: '/shop?occasion=Return%20Gifts',
    imageUrl: OCCASION_ICONS.returnGifts,
    isCutout: true,
  },
  {
    id: 'mocc-special',
    label: 'Special Day',
    to: '/shop?occasion=Special%20Occasion',
    imageUrl: OCCASION_ICONS.specialOccasion,
    isCutout: true,
  },
];

export function MobileHomePage() {
  const { data: settings } = useStoreSettings();
  const { data: categories } = useCategories();
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

  const quickCategoryItems = useMemo<QuickCategoryItem[]>(() => {
    const baseItems: QuickCategoryItem[] = [
      {
        id: 'mq-all-gifts',
        label: 'All Gifts',
        to: '/shop',
        imageUrl: STUDIO_MEDIA.specialOccasionGifts,
      },
      {
        id: 'mq-personalized',
        label: 'Personalized',
        to: '/customize',
        imageUrl: STUDIO_MEDIA.heroPersonalized,
      },
    ];

    const dynamicItems: QuickCategoryItem[] = [...categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cat) => ({
        id: cat.id,
        label: cat.name,
        to: `/category/${cat.slug}`,
        imageUrl: cat.imageUrl || STUDIO_MEDIA.giftBox,
      }));

    return [...baseItems, ...dynamicItems];
  }, [categories]);

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
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      slideCount <= 1
    ) {
      return;
    }
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
    <div className="min-h-screen w-full overflow-x-clip bg-gradient-to-b from-[#FFFFFF] via-[#FAF4FF] to-[#FFFFFF] pb-4">
      {/* SECTION 2: COMPACT RECTANGULAR SEARCH BAR (Above Sliding Banner) */}
      <section aria-label="Search gifts" className="px-2.5 pt-2 pb-2">
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
            className="relative h-[124px] w-full overflow-hidden rounded-none bg-gradient-to-r from-[#6A11CB] via-[#8E24D6] to-[#FF4D8D] min-[390px]:h-[134px] sm:h-[174px]"
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

      {/* SECTION 4: COMPACT HORIZONTAL IMAGE CATEGORY STRIP (All Options Scrollable — No Wrapper Card, No "More") */}
      <section aria-label="All gift categories" className="mt-2 w-full">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-2 py-0.5">
          {quickCategoryItems.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="group flex w-[66px] shrink-0 snap-start flex-col items-center text-center transition-transform duration-150 active:scale-95"
            >
              <div className="h-[44px] w-full overflow-hidden rounded-lg bg-[#F5ECFF]">
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="mt-1 line-clamp-1 w-full text-[10px] font-semibold leading-tight text-[#1E1035]">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 5: SHOP BY OCCASION (Compact Flatter Horizontal Scroll Strip — All 8 Occasions) */}
      <section aria-labelledby="mobile-occasion-heading" className="mt-2.5 w-full">
        <div className="flex items-center justify-between gap-2 px-2.5">
          <h2
            id="mobile-occasion-heading"
            className="flex items-center gap-1.5 text-[14.5px] font-bold tracking-tight text-[#1E1035]"
          >
            <span
              aria-hidden="true"
              className="h-3.5 w-[3px] rounded-full bg-[#FF4D8D]"
            />
            <span>Shop by Occasion</span>
          </h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-0.5 text-[11.5px] font-bold text-[#FF4D8D] active:opacity-75"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="no-scrollbar mt-1.5 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-2 py-0.5">
          {MOBILE_OCCASION_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="group flex w-[76px] shrink-0 snap-start flex-col items-center text-center transition-transform duration-150 active:scale-95"
            >
              <div className="h-[46px] w-full overflow-hidden rounded-lg bg-gradient-to-br from-[#F8EEFF] to-[#FFEBF4]">
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  className={
                    item.isCutout
                      ? 'h-full w-full object-contain p-1'
                      : 'h-full w-full object-cover'
                  }
                />
              </div>
              <span className="mt-1 line-clamp-1 w-full text-[10px] font-semibold leading-tight text-[#1E1035]">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 6: FEATURED COLLECTION (Real Store Products) */}
      <section aria-labelledby="mobile-featured-heading" className="mt-3 px-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="mobile-featured-heading"
            className="flex items-center gap-1.5 text-[14.5px] font-bold tracking-tight text-[#1E1035]"
          >
            <span
              aria-hidden="true"
              className="h-3.5 w-[3px] rounded-full bg-[#FF4D8D]"
            />
            <span>Featured Collection</span>
          </h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-0.5 text-[11.5px] font-bold text-[#FF4D8D] active:opacity-75"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {productsLoading ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-xl bg-white ring-1 ring-[#EBD8FF]/70"
              >
                <div className="aspect-square animate-pulse bg-[#F4EBFF]" />
                <div className="space-y-1.5 p-2">
                  <div className="h-3.5 w-4/5 animate-pulse rounded bg-[#F4EBFF]" />
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#F4EBFF]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {featuredProducts.map((product) => {
              const saved = isWishlisted(product.id);
              const hasDiscount =
                Boolean(product.compareAtPriceInr) &&
                (product.compareAtPriceInr ?? 0) > product.priceInr;

              return (
                <article
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_6px_18px_-10px_rgba(106,17,203,0.16)] ring-1 ring-[#EBD8FF]/75"
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
                    className="flex flex-1 flex-col justify-between p-2"
                  >
                    <h3 className="line-clamp-2 text-[12px] font-semibold leading-[1.32] text-[#1E1035]">
                      {product.name}
                    </h3>

                    <div className="mt-1 flex items-baseline gap-1.5">
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
