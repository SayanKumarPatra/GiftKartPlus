import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ProductImage } from '../ui/ProductImage';
import {
  useCategories,
  useProducts,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { SEED_HERO_SLIDES } from '../../data/seedData';
import {
  buildPopulatedCategoryGroups,
  getAvailableStorefrontProducts,
} from '../../utils/storefrontHelpers';

/* ============================================================================
 * 1. DESKTOP PROMOTIONAL HERO BANNER CAROUSEL
 * ========================================================================== */
export function HeroSliderSection() {
  const { data: settings } = useStoreSettings();
  const slides = useMemo(() => {
    const source =
      settings?.heroSlides && settings.heroSlides.length > 0
        ? settings.heroSlides
        : SEED_HERO_SLIDES;
    return source
      .filter((s) => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [settings?.heroSlides]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;
  const activeSlide = slides[safeIndex];

  if (!activeSlide) return null;

  return (
    <section aria-label="Promotional Banners" className="bg-white pt-5 pb-4">
      <div className="mx-auto max-w-[1400px] px-6 xl:px-8">
        <div className="group relative overflow-hidden rounded-2xl border border-[#EBD8FF] bg-[#FAF5FF] shadow-[0_10px_32px_-16px_rgba(106,17,203,0.22)]">
          <Link
            to={activeSlide.ctaHref || '/shop'}
            className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A11CB]"
          >
            <div className="relative h-[320px] w-full xl:h-[380px]">
              <ProductImage
                src={activeSlide.imageUrl}
                alt={`${activeSlide.titlePrefix} ${activeSlide.titleHighlight}`.trim()}
                aspectClass="h-full w-full"
                eager
              />
            </div>
          </Link>

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((safeIndex - 1 + slides.length) % slides.length)
                }
                aria-label="Previous banner"
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/60 bg-white/90 text-[#2B0B4E] shadow-md backdrop-blur-sm transition-all hover:bg-white hover:text-[#6A11CB]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((safeIndex + 1) % slides.length)}
                aria-label="Next banner"
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/60 bg-white/90 text-[#2B0B4E] shadow-md backdrop-blur-sm transition-all hover:bg-white hover:text-[#6A11CB]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-3.5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-sm">
                {slides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Go to banner ${idx + 1}`}
                    className={`h-2 cursor-pointer rounded-full transition-all ${
                      idx === safeIndex
                        ? 'w-7 bg-[#FF4D8D]'
                        : 'w-2 bg-white/75 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 2. DESKTOP SHOP BY CATEGORY (All 10 Active Official Categories Synchronized)
 * ========================================================================== */
export function ShopByCategorySection() {
  const { data: categories } = useCategories();
  const { data: products } = useProducts();

  const categoryGroups = useMemo(
    () => buildPopulatedCategoryGroups(categories, products),
    [categories, products]
  );

  if (categoryGroups.length === 0) return null;

  return (
    <section
      aria-labelledby="desktop-shop-by-category"
      className="bg-white py-6"
    >
      <div className="mx-auto max-w-[1400px] px-6 xl:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2
              id="desktop-shop-by-category"
              className="font-display text-[22px] font-bold tracking-tight text-[#1E1035]"
            >
              Shop by Category
            </h2>
            <p className="mt-0.5 text-[13px] text-[#685782]">
              Explore curated gift collections tailored for every occasion.
            </p>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1 text-[13px] font-bold text-[#6A11CB] transition-colors hover:text-[#FF4D8D]"
          >
            <span>All Categories</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-3.5">
          {categoryGroups.map((group) => (
            <Link
              key={group.id}
              to={
                group.isAllGifts
                  ? '/categories?cat=all-gifts'
                  : `/categories?cat=${encodeURIComponent(group.slug)}`
              }
              className="group flex flex-col items-center rounded-xl border border-[#EFE4FF] bg-[#FCFAFF] p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6A11CB]/40 hover:bg-white hover:shadow-[0_10px_22px_-12px_rgba(106,17,203,0.22)]"
            >
              <div className="flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-[0_2px_8px_rgba(106,17,203,0.06)]">
                {group.isPngArtwork ? (
                  <img
                    src={group.artworkUrl}
                    alt={group.label}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-108"
                  />
                ) : (
                  <ProductImage
                    src={group.artworkUrl}
                    alt={group.label}
                    aspectClass="h-full w-full rounded-lg"
                    zoomOnHover
                  />
                )}
              </div>
              <span className="mt-2.5 line-clamp-2 text-[12.5px] font-bold leading-snug text-[#2B0B4E] group-hover:text-[#6A11CB]">
                {group.label}
              </span>
              <span className="mt-0.5 text-[11px] font-medium tabular-nums text-[#7C6997]">
                {group.products.length}{' '}
                {group.products.length === 1 ? 'item' : 'items'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 3. DESKTOP TRENDING GIFTS (4-5 Column Highlight Row)
 * ========================================================================== */
export function TrendingGiftsSection() {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const trendingProducts = useMemo(() => {
    const available = getAvailableStorefrontProducts(products);
    const prioritized = available.filter((p) => p.isBestSeller || p.isFeatured);
    const others = available.filter((p) => !p.isBestSeller && !p.isFeatured);
    return [...prioritized, ...others].slice(0, 5);
  }, [products]);

  if (!isLoading && trendingProducts.length === 0) return null;

  return (
    <section
      aria-labelledby="desktop-trending-gifts"
      className="border-y border-[#F2E9FF] bg-[#FAF7FF] py-8"
    >
      <div className="mx-auto max-w-[1400px] px-6 xl:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4D8D] text-white shadow-xs">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <h2
                id="desktop-trending-gifts"
                className="font-display text-[22px] font-bold tracking-tight text-[#1E1035]"
              >
                Trending Gifts
              </h2>
              <p className="text-[13px] text-[#685782]">
                Customer favourites crafted for memorable moments.
              </p>
            </div>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-[13px] font-bold text-[#6A11CB] transition-colors hover:text-[#FF4D8D]"
          >
            <span>View All Gifts</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[310px] animate-pulse rounded-xl border border-[#ECE2FA] bg-white"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 xl:grid-cols-5">
            {trendingProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryLabel={categoryNameById.get(product.categoryId)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
 * 4. DESKTOP PRODUCT LISTING (Full Store Catalog in 4-5 Column Grid)
 * ========================================================================== */
export function ProductListingSection() {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all-gifts');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>(
    'featured'
  );

  const categoryGroups = useMemo(
    () => buildPopulatedCategoryGroups(categories, products),
    [categories, products]
  );

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const displayedProducts = useMemo(() => {
    const activeGroup =
      categoryGroups.find((g) => g.id === selectedGroupId) ?? categoryGroups[0];
    const base = [...(activeGroup?.products ?? [])];
    if (sortBy === 'price-asc') {
      return base.sort((a, b) => a.priceInr - b.priceInr);
    }
    if (sortBy === 'price-desc') {
      return base.sort((a, b) => b.priceInr - a.priceInr);
    }
    return base;
  }, [categoryGroups, selectedGroupId, sortBy]);

  return (
    <section
      aria-labelledby="desktop-product-listing"
      className="bg-white py-9"
    >
      <div className="mx-auto max-w-[1400px] px-6 xl:px-8">
        {/* Heading + Sort Control */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EFE4FF] pb-4">
          <div>
            <h2
              id="desktop-product-listing"
              className="font-display text-[22px] font-bold tracking-tight text-[#1E1035]"
            >
              Explore All Gifts
            </h2>
            <p className="mt-0.5 text-[13px] text-[#685782]">
              Showing{' '}
              <span className="font-semibold tabular-nums text-[#2B0B4E]">
                {displayedProducts.length}
              </span>{' '}
              available products
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="home-desktop-sort"
              className="text-xs font-semibold text-[#5E4B78]"
            >
              Sort by
            </label>
            <select
              id="home-desktop-sort"
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as 'featured' | 'price-asc' | 'price-desc'
                )
              }
              className="h-9 rounded-lg border border-[#DCD0EF] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Clean Category Filter Tabs (Only Populated Categories) */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {categoryGroups.map((group) => {
            const active = selectedGroupId === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className={`cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#6A11CB] text-white shadow-xs'
                    : 'border border-[#EBD8FF] bg-[#FCFAFF] text-[#3A2259] hover:border-[#6A11CB]/40 hover:text-[#6A11CB]'
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        {/* 4–5 Column Product Grid */}
        {isLoading ? (
          <div className="mt-6 grid grid-cols-4 gap-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[310px] animate-pulse rounded-xl border border-[#ECE2FA] bg-[#FAF7FF]"
              />
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="mt-6 rounded-xl border border-[#EBD8FF] bg-[#FAF7FF] px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[#2B0B4E]">
              No products are available in this category right now.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-4 gap-4 xl:grid-cols-5">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryLabel={categoryNameById.get(product.categoryId)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Backward-compatible aliases in case external imports reference them
export const OccasionsSection = ShopByCategorySection;
export const ForYouSection = ProductListingSection;
