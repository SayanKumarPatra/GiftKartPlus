import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart, Package } from 'lucide-react';
import { useCategories, useProducts } from '../../hooks/useStoreData';
import type { OccasionTag } from '../../types';
import { ProductCard } from '../../components/storefront/ProductCard';
import { MobileCategoriesPage } from '../../components/storefront/MobileCategoriesPage';
import { ProductImage } from '../../components/ui/ProductImage';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  buildStorefrontCategoryGroups,
  isAllGiftsCategory,
  resolveCategoryBySlug,
} from '../../utils/storefrontHelpers';

interface ShopPageProps {
  bestSellersOnly?: boolean;
  customizableOnly?: boolean;
  isSearchPage?: boolean;
}

export function ShopPage({
  bestSellersOnly = false,
  customizableOnly = false,
  isSearchPage = false,
}: ShopPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { t, translateCategory, translateOccasion } = useLanguage();

  const categorySlug = searchParams.get('category') ?? '';
  const subcategorySlug = searchParams.get('subcategory') ?? '';
  const occasionParam = (searchParams.get('occasion') ?? '') as OccasionTag | '';
  const searchQuery = searchParams.get('search') ?? '';

  const activeCategory = resolveCategoryBySlug(categorySlug, categories);
  const activeSubcategory = activeCategory?.subcategories.find(
    (s) => s.slug === subcategorySlug
  );

  const { data: products, isLoading } = useProducts({
    categoryId:
      activeCategory && !isAllGiftsCategory(activeCategory)
        ? activeCategory.id
        : undefined,
    subcategoryId: activeSubcategory?.id,
    occasion: occasionParam || undefined,
    search: searchQuery || undefined,
    bestSellersOnly,
    customizableOnly,
  });

  const catNameById = new Map(categories.map((c) => [c.id, c.name]));
  const hasActiveFilter = Boolean(
    categorySlug || subcategorySlug || occasionParam || searchQuery
  );

  const pageHeading = bestSellersOnly
    ? t('bestSellers')
    : customizableOnly
      ? t('customizeGift')
      : isSearchPage
        ? searchQuery
          ? `${t('searchResultsFor')} "${searchQuery}"`
          : t('search')
        : activeSubcategory
          ? translateCategory(activeSubcategory.name)
          : activeCategory
            ? translateCategory(activeCategory.name, activeCategory.translations)
            : occasionParam
              ? translateOccasion(occasionParam)
              : searchQuery
                ? searchQuery
                : t('allGifts');

  return (
    <div className="space-y-4">
      {/* Clean Minimal Product Listing Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE3FF] pb-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t('back')}</span>
          </button>
          <h1 className="mt-1 truncate text-xl font-extrabold tracking-tight text-[#2B0B4E] sm:text-2xl">
            {pageHeading}
          </h1>
          <p className="text-xs font-medium text-[#6E5B85]">
            {isLoading
              ? t('loading')
              : `${products.length} ${t('giftsFound')}`}
          </p>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="rounded-full border border-[#EBD8FF] bg-[#FAF5FF] px-3.5 py-1.5 text-xs font-bold text-[#6A11CB] transition-colors hover:bg-[#F1E4FF]"
          >
            {t('allGifts')}
          </button>
        )}
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF]"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title={t('noSearchResults')}
          description={t('tryDifferentKeywords')}
          icon={<Package className="h-5 w-5" />}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" onClick={() => setSearchParams({})}>
                {t('allGifts')}
              </Button>
              <Link to="/categories">
                <Button size="sm" variant="glass">
                  {t('browseCategories')}
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryLabel={catNameById.get(product.categoryId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AllCategoriesPage() {
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts();
  const { t, translateCategory } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const categoryGroups = useMemo(
    () => buildStorefrontCategoryGroups(categories, products),
    [categories, products]
  );

  const rawCatParam = searchParams.get('cat') ?? 'all-gifts';
  const resolvedCat = useMemo(
    () => resolveCategoryBySlug(rawCatParam, categories),
    [rawCatParam, categories]
  );
  const activeGroup =
    categoryGroups.find((g) => g.slug === (resolvedCat?.slug ?? rawCatParam)) ??
    categoryGroups[0];

  const sortedProducts = useMemo(() => {
    const list = [...(activeGroup?.products ?? [])];
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => a.priceInr - b.priceInr);
    }
    if (sortBy === 'price-desc') {
      return list.sort((a, b) => b.priceInr - a.priceInr);
    }
    return list;
  }, [activeGroup, sortBy]);

  const catNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  return (
    <>
      {/* Normal Mobile (< 900px): Flipkart-inspired Left Sidebar + Right Category Grid */}
      <div className="-mx-3.5 -my-4 sm:-mx-6 sm:-my-5 lg:hidden">
        <MobileCategoriesPage />
      </div>

      {/* Desktop & Laptop (>= 900px): Curated Non-Empty Categories with Left Sidebar + Product Grid */}
      <div className="hidden lg:block">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[#EFE3FF] pb-4">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs font-medium text-[#7A6894]"
            >
              <Link to="/" className="hover:text-[#6A11CB]">
                {t('home')}
              </Link>
              <span>/</span>
              <span className="font-semibold text-[#2B0B4E]">{t('categories')}</span>
              {activeGroup && activeGroup.id !== 'all-gifts' && (
                <>
                  <span>/</span>
                  <span className="font-semibold text-[#6A11CB]">
                    {translateCategory(activeGroup.label)}
                  </span>
                </>
              )}
            </nav>
            <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#1E1035]">
              {activeGroup ? translateCategory(activeGroup.label) : t('categories')}
            </h1>
            <p className="mt-0.5 text-[13px] text-[#685782]">
              {isLoading
                ? t('loading')
                : `${sortedProducts.length} ${t('giftsFound')}`}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label
              htmlFor="desktop-cat-sort"
              className="text-xs font-semibold text-[#685782]"
            >
              {t('sortBy')}
            </label>
            <select
              id="desktop-cat-sort"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
              }
              className="h-9 rounded-lg border border-[#DFD2F2] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
            >
              <option value="featured">{t('sortFeatured')}</option>
              <option value="price-asc">{t('sortPriceLowHigh')}</option>
              <option value="price-desc">{t('sortPriceHighLow')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left Sticky Category Sidebar */}
          <aside className="col-span-3 sticky top-28 rounded-2xl border border-[#EFE3FF] bg-[#FCFAFF] p-2.5">
            <p className="px-2.5 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-[#7A6894]">
              {t('shopByCategory')}
            </p>
            <nav aria-label="Category filter" className="space-y-1">
              {categoryGroups.map((group) => {
                const isSelected = activeGroup?.id === group.id;
                const localizedLabel = translateCategory(group.label);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() =>
                      setSearchParams(
                        group.id === 'all-gifts' ? {} : { cat: group.id }
                      )
                    }
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all ${
                      isSelected
                        ? 'bg-white font-bold text-[#6A11CB] shadow-[0_4px_14px_-6px_rgba(106,17,203,0.22)] ring-1 ring-[#DFC4FF]'
                        : 'font-semibold text-[#2B0B4E] hover:bg-white/80 hover:text-[#6A11CB]'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#FAF5FF] p-1">
                      {group.isPngArtwork ? (
                        <img
                          src={group.artworkUrl}
                          alt={localizedLabel}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <ProductImage
                          src={group.artworkUrl}
                          alt={localizedLabel}
                          aspectClass="h-full w-full rounded-md"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] leading-snug">
                        {localizedLabel}
                      </p>
                      <p className="text-[11px] font-medium tabular-nums text-[#7C6997]">
                        {group.products.length}{' '}
                        {group.products.length === 1 ? t('item') : t('items')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right Product Grid */}
          <div className="col-span-9">
            {isLoading ? (
              <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF]"
                  />
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <EmptyState
                title={t('noProductsMatch')}
                description={t('catalogEmptyDesc')}
                icon={<Package className="h-5 w-5" />}
                action={
                  <Button size="sm" onClick={() => setSearchParams({})}>
                    {t('allGifts')}
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryLabel={catNameById.get(product.categoryId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function CategoryDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { t, translateCategory } = useLanguage();

  const category = resolveCategoryBySlug(slug, categories);
  const isAllGifts = isAllGiftsCategory(category);

  const { data: fetchedProducts, isLoading } = useProducts({
    categoryId: category
      ? isAllGifts
        ? undefined
        : category.id
      : '__no_matching_category__',
  });

  const products = category ? fetchedProducts : [];
  const categoryTitle = category
    ? translateCategory(category.name, category.translations)
    : undefined;

  if (!categoryTitle) {
    return (
      <EmptyState
        title={t('noProductsMatch')}
        description={t('tryDifferentKeywords')}
        action={
          <Link to="/shop">
            <Button size="sm">{t('allGifts')}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Clean Minimal Category Products Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE3FF] pb-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t('back')}</span>
          </button>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-[#2B0B4E] sm:text-2xl">
            {categoryTitle}
          </h1>
          <p className="text-xs font-medium text-[#6E5B85]">
            {isLoading
              ? t('loading')
              : `${products.length} ${t('giftsFound')}`}
          </p>
        </div>

        <Link
          to="/shop"
          className="rounded-full border border-[#EBD8FF] bg-[#FAF5FF] px-3.5 py-1.5 text-xs font-bold text-[#6A11CB] transition-colors hover:bg-[#F1E4FF]"
        >
          {t('allGifts')}
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF]"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title={t('catalogEmptyTitle')}
          description={t('catalogEmptyDesc')}
          icon={<Package className="h-5 w-5" />}
          action={
            <Link to="/shop">
              <Button size="sm">{t('allGifts')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryLabel={category?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WishlistPage() {
  const { wishlistIds } = useCart();
  const { customerAccount } = useAuth();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { t } = useLanguage();
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  if (!customerAccount) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <EmptyState
          title={t('wishlist')}
          description={t('signInPrompt')}
          icon={<Heart className="h-5 w-5 text-[#FF4D8D]" />}
          action={
            <Link
              to="/account"
              state={{ from: '/wishlist', reason: 'wishlist' }}
            >
              <Button size="sm">{t('signIn')}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="space-y-6">
      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-6 sm:p-8">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-[#3B0764] sm:text-3xl">
          <Heart className="h-6 w-6 fill-[#FF4D8D] text-[#FF4D8D] sm:h-7 sm:w-7" />
          <span>{t('wishlist')}</span>
        </h1>
        <p className="mt-1.5 text-sm text-[#4B2C70]">
          {customerAccount.fullName} ({customerAccount.email})
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <EmptyState
          title={t('wishlistEmptyTitle')}
          description={t('wishlistEmptyDesc')}
          icon={<Heart className="h-5 w-5 text-[#FF4D8D]" />}
          action={
            <Link to="/shop">
              <Button size="sm">{t('exploreGifts')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {savedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryLabel={catMap.get(product.categoryId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
