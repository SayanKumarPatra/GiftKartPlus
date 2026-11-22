import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import { OFFICIAL_OCCASIONS } from '../../config/appConfig';
import { useProducts, useStoreSettings } from '../../hooks/useStoreData';
import { ProductCard } from './ProductCard';

/* -------------------------------------------------------------------------- */
/* HERO SLIDING BANNER (PURE SMOOTH SLIDER — NO OVERLAY BUTTONS OR LINKS)     */
/* -------------------------------------------------------------------------- */
export function HeroSliderSection() {
  const { data: settings } = useStoreSettings();
  const slides = (settings?.heroSlides ?? [])
    .filter((s) => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [activeIndex, setActiveIndex] = useState(0);
  const [resetTick, setResetTick] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const slideCount = slides.length;
  const safeIndex = slideCount > 0 ? activeIndex % slideCount : 0;

  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [slideCount, resetTick]);

  if (slideCount === 0) {
    return null;
  }

  function jumpToSlide(idx: number) {
    setActiveIndex(idx);
    setResetTick((t) => t + 1);
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        jumpToSlide((safeIndex + 1) % slideCount);
      } else {
        jumpToSlide((safeIndex - 1 + slideCount) % slideCount);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }

  return (
    <section
      aria-label="Featured GiftKart sliding banners"
      className="w-full"
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative h-[160px] w-full overflow-hidden sm:h-[220px] md:h-[280px] lg:h-[350px] xl:h-[390px]"
      >
        {/* GPU-Accelerated Continuous Horizontal Track (All Slides Pre-Mounted) */}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translate3d(-${safeIndex * 100}%, 0, 0)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="h-full w-full shrink-0">
              <img
                src={slide.imageUrl}
                alt={`${slide.titlePrefix} ${slide.titleHighlight}`}
                loading="eager"
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
                className="h-full w-full select-none object-cover object-[center_53%]"
              />
            </div>
          ))}
        </div>

        {/* Minimal Slide Indicators Only — Zero Overlay Buttons or Links */}
        {slideCount > 1 && (
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 backdrop-blur-sm sm:bottom-3 sm:gap-2 sm:px-3">
            {slides.map((slide, idx) => (
              <span
                key={slide.id}
                role="presentation"
                onClick={() => jumpToSlide(idx)}
                className={`block cursor-pointer rounded-full transition-all duration-300 ${
                  idx === safeIndex
                    ? 'h-1.5 w-5 bg-[#6A11CB] sm:h-2 sm:w-6'
                    : 'h-1.5 w-1.5 bg-[#6A11CB]/30 hover:bg-[#FF4D8D]/70 sm:h-2 sm:w-2'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* GIFTS FOR EVERY OCCASION (BORDERLESS SOFT PASTEL TILES — SWIPE ON MOBILE)  */
/* -------------------------------------------------------------------------- */
const OCCASION_TILE_GRADIENTS = [
  'bg-gradient-to-br from-[#F9ECFF] to-[#F0D9FF]',
  'bg-gradient-to-br from-[#FFF0F6] to-[#FFDCEB]',
  'bg-gradient-to-br from-[#F5EAFF] to-[#E9D2FF]',
  'bg-gradient-to-br from-[#FFF2F8] to-[#F9DFF0]',
  'bg-gradient-to-br from-[#F6EEFF] to-[#EBD8FF]',
  'bg-gradient-to-br from-[#FFF3F6] to-[#FFE2EE]',
  'bg-gradient-to-br from-[#F8ECFF] to-[#EED7FF]',
  'bg-gradient-to-br from-[#FFF0F7] to-[#FADCEB]',
] as const;

export function OccasionsSection() {
  return (
    <section
      aria-labelledby="occasions-heading"
      className="mx-auto max-w-7xl px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="occasions-heading"
          className="flex items-center gap-1.5 text-base font-extrabold tracking-tight text-[#2B0B4E] sm:text-2xl"
        >
          <span>Gifts for Every</span>
          <span className="text-[#FF4D8D]">Occasion</span>
          <Heart className="h-4 w-4 fill-[#FF4D8D]/20 text-[#FF4D8D] sm:h-5 sm:w-5" />
        </h2>

        {/* Mobile: Non-clickable swipe cue (tapping does nothing; users swipe with finger) */}
        <span
          aria-hidden="true"
          className="pointer-events-none inline-flex shrink-0 select-none items-center gap-0.5 text-[11px] font-bold text-[#6A11CB]/75 lg:hidden"
        >
          <span>View All</span>
          <ArrowRight className="h-3 w-3" />
        </span>

        {/* Desktop: Interactive View All link */}
        <Link
          to="/shop"
          className="hidden shrink-0 items-center gap-1 text-sm font-bold text-[#6A11CB] transition-colors hover:text-[#FF4D8D] lg:inline-flex"
        >
          <span>View All</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* MOBILE & TABLET: Compact Borderless Pastel Squircle Tiles (Finger Swipe Strip) */}
      <div className="no-scrollbar mt-2.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-0.5 lg:hidden">
        {OFFICIAL_OCCASIONS.map((occ, idx) => (
          <Link
            key={occ.id}
            to={`/shop?occasion=${encodeURIComponent(occ.tag)}`}
            className="group flex w-[74px] shrink-0 snap-start flex-col items-center text-center sm:w-[86px]"
          >
            <div
              className={`flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-2xl p-0.5 shadow-xs shadow-[#6A11CB]/8 transition-transform duration-150 group-active:scale-95 sm:h-[82px] sm:w-[82px] sm:p-1 ${
                OCCASION_TILE_GRADIENTS[idx % OCCASION_TILE_GRADIENTS.length]
              }`}
            >
              <img
                src={occ.iconUrl}
                alt={occ.label}
                loading="eager"
                referrerPolicy="no-referrer"
                className="h-full w-full scale-[1.14] object-contain drop-shadow-xs"
              />
            </div>
            <span className="mt-1.5 line-clamp-2 text-[10px] font-bold leading-tight text-[#2B0B4E] group-hover:text-[#6A11CB] sm:text-[11px]">
              {occ.label}
            </span>
          </Link>
        ))}
      </div>

      {/* DESKTOP: Clean Borderless Pastel Squircle Row (8 Columns) */}
      <div className="mt-3.5 hidden grid-cols-8 gap-3 lg:grid">
        {OFFICIAL_OCCASIONS.map((occ, idx) => (
          <Link
            key={occ.id}
            to={`/shop?occasion=${encodeURIComponent(occ.tag)}`}
            className="group flex flex-col items-center text-center"
          >
            <div
              className={`flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-2xl p-1 shadow-xs shadow-[#6A11CB]/10 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md xl:h-[94px] xl:w-[94px] ${
                OCCASION_TILE_GRADIENTS[idx % OCCASION_TILE_GRADIENTS.length]
              }`}
            >
              <img
                src={occ.iconUrl}
                alt={occ.label}
                loading="eager"
                referrerPolicy="no-referrer"
                className="h-full w-full scale-[1.14] object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-[1.2]"
              />
            </div>
            <span className="mt-2 line-clamp-2 text-xs font-bold leading-snug text-[#2B0B4E] group-hover:text-[#6A11CB]">
              {occ.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FOR YOU — EDITORIAL CURATED PRODUCT GRID (ALL PRODUCTS)                    */
/* -------------------------------------------------------------------------- */
export function ForYouSection() {
  const { data: products, isLoading } = useProducts();

  return (
    <section
      aria-labelledby="for-you-heading"
      className="mx-auto max-w-7xl px-3 pb-8 pt-2 sm:px-5 sm:pb-10 sm:pt-3 lg:px-6"
    >
      <div className="mb-3.5 sm:mb-5">
        <h2
          id="for-you-heading"
          className="text-xl font-bold tracking-tight text-[#1E1035] sm:text-2xl"
        >
          For You
        </h2>
        <p className="mt-0.5 text-xs font-medium text-[#7D6E93] sm:text-[13px]">
          Handpicked gifts just for you
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4 lg:gap-4 xl:gap-5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-[#ECE4F5] bg-white"
            >
              <div className="aspect-square animate-pulse bg-[#F4EBFF]" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-16 animate-pulse rounded bg-[#F4EBFF]" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-[#F4EBFF]" />
                <div className="h-9 w-full animate-pulse rounded-lg bg-[#F4EBFF]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4 lg:gap-4 xl:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
