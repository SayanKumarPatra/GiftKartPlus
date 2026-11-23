import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Flame, Heart, Search } from 'lucide-react';
import { STUDIO_MEDIA } from '../../config/appConfig';
import {
  useCategories,
  useProducts,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ProductImage } from '../ui/ProductImage';
import { formatInr } from '../../utils/format';

import figmaHeroGiftBoxesImg from '../../assets/images/figma_hero_gift_boxes_1795420552395.jpg';
import figmaCatAllGiftsImg from '../../assets/images/figma_cat_all_gifts_1795420531719.jpg';
import figmaCatPersonalizedImg from '../../assets/images/figma_cat_personalized_1795420523721.jpg';
import figmaCatToysGamesImg from '../../assets/images/figma_cat_toys_games_1795420524272.jpg';
import figmaCatAccessoriesImg from '../../assets/images/figma_cat_accessories_1795420524231.jpg';

interface MobileCategoryItem {
  id: string;
  label: string;
  to: string;
  imageUrl: string;
}

const PRIMARY_MOBILE_CATEGORIES: MobileCategoryItem[] = [
  {
    id: 'fg-cat-all-gifts',
    label: 'All Gifts',
    to: '/shop',
    imageUrl: figmaCatAllGiftsImg,
  },
  {
    id: 'fg-cat-personalized',
    label: 'Personalized',
    to: '/customize',
    imageUrl: figmaCatPersonalizedImg,
  },
  {
    id: 'fg-cat-toys-games',
    label: 'Toys & Games',
    to: '/category/handmade-gift',
    imageUrl: figmaCatToysGamesImg,
  },
  {
    id: 'fg-cat-accessories',
    label: 'Accessories',
    to: '/category/personalized-accessories',
    imageUrl: figmaCatAccessoriesImg,
  },
];

const SHORT_CATEGORY_LABELS: Record<string, string> = {
  'led-lighting-gifts': 'LED Lamps',
  'home-decor-gifts': 'Home Decor',
  'customized-stationery': 'Stationery',
  'couple-friendship-gifts': 'Couple Gifts',
  'customized-photo-gifts': 'Photo Gifts',
  'special-occasion-gifts': 'Occasions',
};

type MobileHeroEntry =
  | { kind: 'figma-primary'; id: string }
  | {
      kind: 'admin-slide';
      id: string;
      imageUrl: string;
      alt: string;
      href: string;
    };

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

  const heroEntries = useMemo<MobileHeroEntry[]>(() => {
    const adminSlides: MobileHeroEntry[] = (settings?.heroSlides ?? [])
      .filter((s) => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 4)
      .map((s) => ({
        kind: 'admin-slide',
        id: s.id,
        imageUrl: s.imageUrl,
        alt: `${s.titlePrefix} ${s.titleHighlight}`,
        href: s.ctaHref || '/shop',
      }));

    return [{ kind: 'figma-primary', id: 'figma-hero-primary' }, ...adminSlides];
  }, [settings?.heroSlides]);

  const slideCount = heroEntries.length;
  const safeSlideIndex = slideCount > 0 ? activeSlide % slideCount : 0;

  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideCount);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [slideCount, resetTick]);

  // Combine 4 primary shortcuts + remaining real store categories into a compact 2-row scrollable list
  const allMobileCategories = useMemo<MobileCategoryItem[]>(() => {
    const excludedSlugs = new Set(['handmade-gift', 'personalized-accessories']);
    const storeCategories: MobileCategoryItem[] = [...categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((c) => !excludedSlugs.has(c.slug))
      .map((c) => ({
        id: c.id,
        label: SHORT_CATEGORY_LABELS[c.slug] ?? c.name,
        to: `/category/${c.slug}`,
        imageUrl: c.imageUrl || STUDIO_MEDIA.giftBox,
      }));

    return [...PRIMARY_MOBILE_CATEGORIES, ...storeCategories];
  }, [categories]);

  // Real active products from the store database stacked cleanly in 2-column rows
  const trendingProducts = useMemo(() => {
    const prioritized = products.filter((p) => p.isBestSeller || p.isFeatured);
    const others = products.filter((p) => !p.isBestSeller && !p.isFeatured);
    return [...prioritized, ...others];
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
    <div className="min-h-screen w-full overflow-x-clip bg-gradient-to-b from-[#FDE4EC] via-[#F9ECFF] to-[#F5ECFF] pb-4">
      {/* UPPER WARM PINK ZONE: Search Bar + Flatter Hero Slider with Subtle Margin & Light Radius */}
      <div className="bg-[#FDE4EC] pb-2">
        {/* STEP 02 – PILL SEARCH BAR (Search Icon Only) */}
        <section aria-label="Search gifts" className="px-2.5 pt-1 pb-2">
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="flex h-[40px] w-full items-center gap-2 rounded-full bg-white px-3.5 shadow-[0_4px_14px_-8px_rgba(106,17,203,0.18)] ring-1 ring-[#EBD8FF]/90 transition-shadow focus-within:ring-2 focus-within:ring-[#6A11CB]/45"
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
              className="w-full bg-transparent text-[13px] font-medium text-[#2B0B4E] placeholder:text-[#867699] focus:outline-none"
            />
          </form>
        </section>

        {/* STEP 03 – FLATTER HERO SLIDER WITH SUBTLE SIDE GAP & LIGHT BORDER RADIUS */}
        <section aria-label="Promotional offers" className="px-2.5">
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative h-[128px] w-full overflow-hidden rounded-xl bg-[#5B0EB7] shadow-[0_8px_20px_-10px_rgba(106,17,203,0.35)] min-[390px]:h-[136px] min-[420px]:h-[144px]"
          >
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
              style={{
                transform: `translate3d(-${safeSlideIndex * 100}%, 0, 0)`,
              }}
            >
              {heroEntries.map((entry) =>
                entry.kind === 'figma-primary' ? (
                  <div
                    key={entry.id}
                    className="relative flex h-full w-full shrink-0 items-center overflow-hidden bg-gradient-to-r from-[#4E069E] via-[#6A11CB] to-[#7C21E0]"
                  >
                    {/* Right-side Figma Gift Box Artwork with Soft Glowing Ring */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 right-0 w-[52%]"
                    >
                      <img
                        src={figmaHeroGiftBoxesImg}
                        alt=""
                        loading="eager"
                        decoding="async"
                        draggable={false}
                        className="h-full w-full select-none object-cover object-center"
                      />
                      <div className="absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#5D0DB7] via-[#5D0DB7]/65 to-transparent" />
                    </div>

                    {/* Left-side Exact Figma Promotional Copy & CTA */}
                    <div className="relative z-10 flex max-w-[60%] flex-col items-start pl-3.5 pr-1 pb-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-white/95 min-[410px]:text-[10px]">
                        MAKE EVERY OCCASION
                      </p>
                      <h1 className="mt-0.5 text-[22px] font-black italic leading-[0.98] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(43,11,78,0.35)] min-[410px]:text-[25px]">
                        SPECIAL
                      </h1>
                      <p className="mt-1 text-[9.5px] font-medium leading-[1.25] text-[#F5EAFF] min-[410px]:text-[10.5px]">
                        Unique &amp; Personalized Gifts for Your Loved Ones
                      </p>
                      <Link
                        to="/shop"
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF1F7A] to-[#FF4D8D] px-3 py-1 text-[10px] font-bold text-white shadow-[0_6px_14px_-4px_rgba(255,31,122,0.65)] transition-transform active:scale-95"
                      >
                        <span>Shop Now</span>
                        <ArrowRight className="h-2.5 w-2.5 stroke-[2.6]" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={entry.id}
                    to={entry.href}
                    className="relative block h-full w-full shrink-0"
                  >
                    <img
                      src={entry.imageUrl}
                      alt={entry.alt}
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="h-full w-full select-none object-cover object-[center_52%]"
                    />
                  </Link>
                )
              )}
            </div>

            {/* Bottom Slider Pagination Indicators */}
            {slideCount > 1 && (
              <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
                {heroEntries.map((entry, idx) => (
                  <button
                    key={entry.id}
                    type="button"
                    aria-label={`View promotional slide ${idx + 1}`}
                    onClick={() => jumpToSlide(idx)}
                    className={`block cursor-pointer rounded-full transition-all duration-300 ${
                      idx === safeSlideIndex
                        ? 'h-1.5 w-5 bg-white shadow-xs'
                        : 'h-1.5 w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* LOWER SOFT LAVENDER ZONE: Cardless 2-Row Categories (4 Visible per Row) + 2-Column Trending Gifts */}
      <div className="bg-gradient-to-b from-[#F9EEFF] via-[#F6EBFF] to-[#FBF7FF] pt-2.5">
        {/* STEP 04 – CARDLESS 2-ROW CATEGORY GRID (4 Per Row Visible, Slightly Larger Natural Size, Swipe for More) */}
        <section aria-label="Gift categories" className="w-full">
          <div className="no-scrollbar grid grid-flow-col grid-rows-2 auto-cols-[calc((100%-24px)/4)] gap-x-2 gap-y-2.5 overflow-x-auto px-2.5 py-0.5">
            {allMobileCategories.map((cat) => (
              <Link
                key={cat.id}
                to={cat.to}
                className="group flex flex-col items-center text-center transition-transform duration-150 active:scale-95"
              >
                <div className="h-[56px] w-[56px] overflow-hidden rounded-xl bg-[#F3E8FF] min-[400px]:h-[60px] min-[400px]:w-[60px]">
                  <img
                    src={cat.imageUrl}
                    alt={cat.label}
                    loading="eager"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="mt-1.5 w-full truncate text-[10.5px] font-semibold leading-tight text-[#2B0B4E] min-[400px]:text-[11px]">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* STEP 05 – TRENDING GIFTS SECTION HEADER */}
        <section
          aria-labelledby="mobile-trending-heading"
          className="mt-3 px-2.5"
        >
          <div className="flex items-center justify-between gap-2 px-0.5">
            <h2
              id="mobile-trending-heading"
              className="flex items-center gap-1.5 text-[16px] font-extrabold tracking-tight text-[#2B0B4E]"
            >
              <Flame
                aria-hidden="true"
                className="h-[18px] w-[18px] shrink-0 fill-[#FF4D8D] text-[#E61E6E]"
              />
              <span>Trending Gifts</span>
            </h2>

            <Link
              to="/shop"
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#2B0B4E] shadow-[0_3px_10px_-3px_rgba(106,17,203,0.18)] ring-1 ring-[#EBD8FF]/90 transition-transform active:scale-95"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3 text-[#6A11CB]" />
            </Link>
          </div>

          {/* STEP 06 – TRENDING GIFTS PRODUCT GRID (Clean 2-Column Mobile Grid) */}
          {productsLoading ? (
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-[16px] border border-[#EBD8FF]/80 bg-white p-2"
                >
                  <div className="aspect-square animate-pulse rounded-[12px] bg-[#F4EBFF]" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-3.5 w-4/5 animate-pulse rounded bg-[#F4EBFF]" />
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#F4EBFF]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {trendingProducts.map((product) => {
                const saved = isWishlisted(product.id);
                const compareAt = product.compareAtPriceInr ?? 0;
                const hasDiscount = compareAt > product.priceInr;
                const discountPercent = hasDiscount
                  ? Math.round(((compareAt - product.priceInr) / compareAt) * 100)
                  : 0;

                return (
                  <article
                    key={product.id}
                    className="group flex flex-col overflow-hidden rounded-[16px] border border-[#EBD8FF]/90 bg-white p-2 shadow-[0_6px_16px_-8px_rgba(106,17,203,0.16)]"
                  >
                    <div className="relative overflow-hidden rounded-[12px] bg-[#FAF6FF]">
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
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-xs ring-1 ring-[#EBD8FF]/80 transition-transform active:scale-90"
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            saved
                              ? 'fill-[#FF4D8D] text-[#FF4D8D]'
                              : 'stroke-[2.1] text-[#4B148C]'
                          }`}
                        />
                      </button>
                    </div>

                    <Link
                      to={`/product/${product.slug}`}
                      className="flex flex-1 flex-col justify-between pt-2"
                    >
                      <h3 className="line-clamp-2 min-h-[32px] text-[12px] font-bold leading-[1.3] text-[#2B0B4E]">
                        {product.name}
                      </h3>

                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[13.5px] font-extrabold tabular-nums text-[#6A11CB]">
                            {formatInr(product.priceInr)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10.5px] font-medium tabular-nums text-[#8B7AA0] line-through">
                              {formatInr(compareAt)}
                            </span>
                          )}
                        </div>

                        {discountPercent > 0 && (
                          <span className="rounded-full bg-[#FF1F7A] px-2 py-[2.5px] text-[9px] font-bold leading-none whitespace-nowrap text-white">
                            {discountPercent}% OFF
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
    </div>
  );
}
