import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Flame, Heart, Search, Share2 } from 'lucide-react';
import {
  useCategories,
  useProducts,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ProductImage } from '../ui/ProductImage';
import { formatInr } from '../../utils/format';
import { buildStorefrontCategoryGroups } from '../../utils/storefrontHelpers';
import { openProductShare } from './ProductShareModal';

interface MobileHeroSlide {
  id: string;
  imageUrl: string;
  alt: string;
  href: string;
}

export function MobileHomePage() {
  const { data: settings } = useStoreSettings();
  const { data: categories } = useCategories();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { toggleWishlist, isWishlisted } = useCart();
  const { customerAccount } = useAuth();
  const { t, translateCategory, localizeEntity } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [resetTick, setResetTick] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const heroEntries = useMemo<MobileHeroSlide[]>(() => {
    const sourceSlides = Array.isArray(settings?.heroSlides)
      ? settings.heroSlides
      : [];

    return sourceSlides
      .filter((s) => s.isActive && Boolean(s.imageUrl))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        id: s.id,
        imageUrl: s.imageUrl,
        alt: `${s.titlePrefix} ${s.titleHighlight}`.trim() || 'GiftKart Banner',
        href: s.ctaHref || '/shop',
      }));
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

  const allMobileCategories = useMemo(
    () =>
      buildStorefrontCategoryGroups(categories, products).map((group) => ({
        id: group.id,
        label: translateCategory(group.label),
        to: group.isAllGifts ? '/shop' : `/category/${encodeURIComponent(group.slug)}`,
        imageUrl: group.artworkUrl,
        isPng: group.isPngArtwork,
      })),
    [categories, products, translateCategory]
  );

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
    <div className="min-h-screen w-full overflow-x-clip bg-gradient-to-b from-[#FDE4EC] via-[#F9ECFF] to-[#F5ECFF] pb-2">
      {/* UPPER WARM PINK ZONE: Search Bar + Flatter Hero Slider with Subtle Margin & Light Radius */}
      <div className="bg-[#FDE4EC] pb-1.5">
        {/* STEP 02 – PILL SEARCH BAR (Search Icon Only) */}
        <section aria-label="Search gifts" className="px-2.5 pt-1 pb-1.5">
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="flex h-[38px] w-full items-center gap-2 rounded-full bg-white px-3.5 shadow-[0_4px_14px_-8px_rgba(106,17,203,0.18)] ring-1 ring-[#EBD8FF]/90 transition-shadow focus-within:ring-2 focus-within:ring-[#6A11CB]/45"
          >
            <button
              type="submit"
              aria-label="Submit search"
              className="flex shrink-0 items-center justify-center text-[#6A11CB]"
            >
              <Search className="h-[17px] w-[17px] stroke-[2.2]" />
            </button>
            <label htmlFor="mobile-home-search" className="sr-only">
              {t('searchPlaceholder')}
            </label>
            <input
              id="mobile-home-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-transparent text-[13px] font-medium text-[#2B0B4E] placeholder:text-[#867699] focus:outline-none"
            />
          </form>
        </section>

        {/* STEP 03 – 3:1 HERO SLIDING BANNERS WITH SUBTLE SIDE GAP & LIGHT BORDER RADIUS */}
        {heroEntries.length > 0 && (
          <section aria-label="Promotional offers" className="px-2.5">
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative aspect-[3/1] w-full overflow-hidden rounded-xl bg-[#5B0EB7] shadow-[0_8px_20px_-10px_rgba(106,17,203,0.35)]"
            >
              <div
                className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
                style={{
                  transform: `translate3d(-${safeSlideIndex * 100}%, 0, 0)`,
                }}
              >
                {heroEntries.map((entry) => (
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
                      className="h-full w-full select-none object-cover object-center"
                    />
                  </Link>
                ))}
              </div>

              {/* Bottom Slider Pagination Indicators */}
              {slideCount > 1 && (
                <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-2 py-0.5 backdrop-blur-[2px]">
                  {heroEntries.map((entry, idx) => (
                    <button
                      key={entry.id}
                      type="button"
                      aria-label={`View promotional slide ${idx + 1}`}
                      onClick={() => jumpToSlide(idx)}
                      className={`block cursor-pointer rounded-full transition-all duration-300 ${
                        idx === safeSlideIndex
                          ? 'h-1.5 w-5 bg-white shadow-xs'
                          : 'h-1.5 w-1.5 bg-white/55'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* LOWER SOFT LAVENDER ZONE: Cardless 2-Row Categories (4 Visible per Row) + 2-Column Trending Gifts */}
      <div className="bg-gradient-to-b from-[#F9EEFF] via-[#F6EBFF] to-[#FBF7FF] pt-2">
        {/* STEP 04 – CARDLESS 2-ROW CATEGORY GRID (4 Per Row Visible, Slightly Larger Natural Size, Swipe for More) */}
        <section aria-label="Gift categories" className="w-full">
          <div className="no-scrollbar grid grid-flow-col grid-rows-2 auto-cols-[calc((100%-24px)/4)] gap-x-2 gap-y-2 overflow-x-auto px-2.5 py-0.5">
            {allMobileCategories.map((cat) => (
              <Link
                key={cat.id}
                to={cat.to}
                className="group flex flex-col items-center text-center transition-transform duration-150 active:scale-95"
              >
                <div className="flex h-[58px] w-full items-center justify-center min-[400px]:h-[62px]">
                  {cat.isPng ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.label}
                      loading="eager"
                      referrerPolicy="no-referrer"
                      className="h-full w-auto max-w-[66px] object-contain drop-shadow-[0_4px_8px_rgba(43,11,78,0.14)] min-[400px]:max-w-[70px]"
                    />
                  ) : (
                    <div className="h-[52px] w-[52px] overflow-hidden rounded-xl bg-[#F3E8FF] shadow-[0_3px_8px_rgba(43,11,78,0.1)] min-[400px]:h-[56px] min-[400px]:w-[56px]">
                      <img
                        src={cat.imageUrl}
                        alt={cat.label}
                        loading="eager"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <span className="mt-1 line-clamp-2 w-full px-0.5 text-[10px] font-semibold leading-[1.2] text-[#2B0B4E] min-[400px]:text-[10.5px]">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* STEP 05 – TRENDING GIFTS SECTION HEADER */}
        <section
          aria-labelledby="mobile-trending-heading"
          className="mt-2.5 px-2.5"
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
              <span>{t('trendingGifts')}</span>
            </h2>

            <Link
              to="/shop"
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#2B0B4E] shadow-[0_3px_10px_-3px_rgba(106,17,203,0.18)] ring-1 ring-[#EBD8FF]/90 transition-transform active:scale-95"
            >
              <span>{t('viewAll')}</span>
              <ArrowRight className="h-3 w-3 text-[#6A11CB]" />
            </Link>
          </div>

          {/* STEP 06 – TRENDING GIFTS PRODUCT GRID (Clean 2-Column Mobile Grid) */}
          {productsLoading ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-[14px] border border-[#EBD8FF]/80 bg-white p-1.5"
                >
                  <div className="aspect-square animate-pulse rounded-[10px] bg-[#F4EBFF]" />
                  <div className="mt-1.5 space-y-1.5">
                    <div className="h-3.5 w-4/5 animate-pulse rounded bg-[#F4EBFF]" />
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#F4EBFF]" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingProducts.length === 0 ? (
            <div className="mt-2 rounded-2xl border border-[#EBD8FF] bg-white px-4 py-8 text-center">
              <p className="text-[13px] font-bold text-[#2B0B4E]">
                {t('catalogEmptyTitle')}
              </p>
              <p className="mt-1 text-[11.5px] text-[#685782]">
                {t('catalogEmptyDesc')}
              </p>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {trendingProducts.map((product) => {
                const saved = isWishlisted(product.id);
                const compareAt = product.compareAtPriceInr ?? 0;
                const hasDiscount = compareAt > product.priceInr;
                const discountPercent = hasDiscount
                  ? Math.round(((compareAt - product.priceInr) / compareAt) * 100)
                  : 0;
                const displayName = localizeEntity(
                  product.name,
                  'name',
                  product.translations
                );

                return (
                  <article
                    key={product.id}
                    className="group flex flex-col overflow-hidden rounded-[14px] border border-[#EBD8FF]/90 bg-white p-1.5 shadow-[0_6px_16px_-8px_rgba(106,17,203,0.16)]"
                  >
                    <div className="relative overflow-hidden rounded-[12px] bg-[#FAF6FF]">
                      <Link to={`/product/${product.slug}`} className="block">
                        <ProductImage
                          src={product.images[0]}
                          alt={displayName}
                          aspectClass="aspect-square"
                        />
                      </Link>

                      <div className="absolute right-1.5 top-1.5 flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleWishlistToggle(product.id)}
                          aria-label={
                            saved ? t('removeFromWishlist') : t('saveToWishlist')
                          }
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-xs ring-1 ring-[#EBD8FF]/80 transition-transform active:scale-90"
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${
                              saved
                                ? 'fill-[#FF4D8D] text-[#FF4D8D]'
                                : 'stroke-[2.1] text-[#4B148C]'
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openProductShare(product);
                          }}
                          aria-label={`${t('share')} ${displayName}`}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#6A11CB] shadow-xs ring-1 ring-[#EBD8FF]/80 transition-transform active:scale-90"
                        >
                          <Share2 className="h-3.5 w-3.5 stroke-[2.1]" />
                        </button>
                      </div>
                    </div>

                    <Link
                      to={`/product/${product.slug}`}
                      className="flex flex-1 flex-col justify-between pt-2"
                    >
                      <h3 className="line-clamp-2 min-h-[32px] text-[12px] font-bold leading-[1.3] text-[#2B0B4E]">
                        {displayName}
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
                          <span className="rounded-full bg-[#FF4D8D] px-2 py-[2.5px] text-[9px] font-bold leading-none whitespace-nowrap text-white">
                            {discountPercent}% {t('off')}
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
