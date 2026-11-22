import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Crown, Heart, Package, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useCategories, useProducts } from '../../hooks/useStoreData';
import { OFFICIAL_OCCASIONS } from '../../config/appConfig';
import type { OccasionTag, ProductFilterParams } from '../../types';
import { ProductCard } from '../../components/storefront/ProductCard';
import { ProductImage } from '../../components/ui/ProductImage';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { useCart } from '../../context/CartContext';

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
  const { data: categories } = useCategories();

  const categorySlug = searchParams.get('category') ?? '';
  const subcategorySlug = searchParams.get('subcategory') ?? '';
  const occasionParam = (searchParams.get('occasion') ?? '') as OccasionTag | '';
  const searchQuery = searchParams.get('search') ?? '';
  const [sortBy, setSortBy] = useState<ProductFilterParams['sortBy']>('featured');

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const activeSubcategory = activeCategory?.subcategories.find(
    (s) => s.slug === subcategorySlug
  );

  const { data: products, isLoading } = useProducts({
    categoryId: activeCategory?.id,
    subcategoryId: activeSubcategory?.id,
    occasion: occasionParam || undefined,
    search: searchQuery || undefined,
    bestSellersOnly,
    customizableOnly,
    sortBy,
  });

  const catNameById = new Map(categories.map((c) => [c.id, c.name]));

  function updateParam(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (!v) {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    setSearchParams(next);
  }

  const pageHeading = bestSellersOnly
    ? 'Our Best Sellers'
    : customizableOnly
      ? 'Customize Your Gift'
      : isSearchPage
        ? searchQuery
          ? `Search Results for "${searchQuery}"`
          : 'Search GiftKart Catalog'
        : activeSubcategory
          ? `${activeCategory?.name} — ${activeSubcategory.name}`
          : activeCategory
            ? activeCategory.name
            : occasionParam
              ? `${occasionParam} Gifts`
              : 'Shop All Personalized Gifts';

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4D8D]">
              {bestSellersOnly ? (
                <Crown className="h-4 w-4 text-amber-500" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>
                {bestSellersOnly
                  ? 'Most Loved Keepsakes'
                  : customizableOnly
                    ? 'Add Custom Names, Quotes & Photos'
                    : 'GiftKart Official 15-Category Catalog'}
              </span>
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#3B0764] sm:text-4xl">
              {pageHeading}
            </h1>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A11CB]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => updateParam({ search: e.target.value || null })}
                placeholder="Search mugs, frames, tees..."
                className="min-h-[42px] w-full rounded-full border border-[#EBD8FF] bg-white pl-10 pr-4 text-sm text-[#2B0B4E] placeholder:text-[#8B7AA0] focus:border-[#6A11CB] focus:outline-none sm:w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#6A11CB]" />
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as ProductFilterParams['sortBy'])
                }
                aria-label="Sort products"
                className="min-h-[42px] rounded-full border border-[#EBD8FF] bg-white px-4 text-xs font-bold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main 15 Categories Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => updateParam({ category: null, subcategory: null })}
            className={`min-h-[36px] rounded-full px-4 text-xs font-bold transition-colors whitespace-nowrap ${
              !categorySlug
                ? 'bg-[#6A11CB] text-white shadow-sm'
                : 'border border-[#EBD8FF] bg-white text-[#3E2A56] hover:bg-[#F8F2FF]'
            }`}
          >
            All Categories ({categories.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateParam({ category: cat.slug, subcategory: null })}
              className={`min-h-[36px] rounded-full px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                categorySlug === cat.slug
                  ? 'bg-[#6A11CB] text-white shadow-sm'
                  : 'border border-[#EBD8FF] bg-white text-[#3E2A56] hover:bg-[#F8F2FF]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Exact Subcategory Filter Strip (Coffee Mug, T-shirt Print, Photo Frame) */}
        {activeCategory && activeCategory.subcategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF] p-3">
            <span className="mr-1 text-xs font-bold text-[#6A11CB]">
              {activeCategory.name} Styles:
            </span>
            <button
              type="button"
              onClick={() => updateParam({ subcategory: null })}
              className={`min-h-[32px] rounded-full px-3 text-xs font-bold whitespace-nowrap ${
                !subcategorySlug
                  ? 'bg-[#FF4D8D] text-white'
                  : 'bg-white text-[#3E2A56] hover:text-[#6A11CB]'
              }`}
            >
              All
            </button>
            {activeCategory.subcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => updateParam({ subcategory: sub.slug })}
                className={`min-h-[32px] rounded-full px-3 text-xs font-semibold whitespace-nowrap ${
                  subcategorySlug === sub.slug
                    ? 'bg-[#FF4D8D] text-white'
                    : 'bg-white text-[#3E2A56] hover:text-[#6A11CB]'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Supplemental Occasion Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-[#6E5B85]">Occasion:</span>
          {OFFICIAL_OCCASIONS.map((occ) => {
            const active = occasionParam === occ.tag;
            return (
              <button
                key={occ.id}
                type="button"
                onClick={() => updateParam({ occasion: active ? null : occ.tag })}
                className={`min-h-[30px] rounded-full px-3 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#FF4D8D] text-white'
                    : 'bg-[#FFF0F6] text-[#6A11CB] hover:bg-[#EBD8FF]/70'
                }`}
              >
                {occ.tag}
              </button>
            );
          })}
          {(categorySlug || subcategorySlug || occasionParam || searchQuery) && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="ml-auto text-xs font-bold text-[#FF4D8D] hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF]"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No gifts matched these filters"
          description="Try clearing a filter or exploring another one of GiftKart's 15 official gift categories."
          icon={<Package className="h-5 w-5" />}
          action={
            <Button size="sm" onClick={() => setSearchParams({})}>
              Show All Gifts
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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

  return (
    <div className="space-y-8">
      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-6 sm:p-8">
        <p className="text-xs font-bold text-[#FF4D8D]">Official Catalog Taxonomy</p>
        <h1 className="mt-1.5 text-3xl font-extrabold text-[#3B0764] sm:text-4xl">
          All {categories.length} Gift Categories
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#4B2C70]">
          Explore every official GiftKart category, including complete subcategory collections for Coffee Mug, T-shirt Print, and Photo Frame.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="gk-card gk-card-hover group flex flex-col overflow-hidden rounded-3xl"
          >
            <Link to={`/category/${cat.slug}`} className="block p-3 pb-0">
              <div className="overflow-hidden rounded-2xl">
                <ProductImage
                  src={cat.imageUrl}
                  alt={cat.name}
                  aspectClass="aspect-[16/10]"
                  zoomOnHover
                />
              </div>
            </Link>

            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/category/${cat.slug}`}
                    className="text-lg font-extrabold text-[#2B0B4E] group-hover:text-[#6A11CB]"
                  >
                    {cat.name}
                  </Link>
                  <span className="font-mono text-xs font-bold text-[#8B7AA0]">
                    #{String(cat.sortOrder).padStart(2, '0')}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#594A6B]">
                  {cat.description}
                </p>

                {cat.subcategories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#EBD8FF] pt-3.5">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/shop?category=${cat.slug}&subcategory=${sub.slug}`}
                        className="rounded-full bg-[#F8F2FF] px-2.5 py-1 text-[11px] font-semibold text-[#6A11CB] transition-colors hover:bg-[#6A11CB] hover:text-white"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2">
                <Link
                  to={`/category/${cat.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4D8D] hover:text-[#6A11CB]"
                >
                  <span>Explore {cat.name}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryDetailPage() {
  const { slug } = useParams();
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const { data: categories } = useCategories();
  const category = categories.find((c) => c.slug === slug);

  const { data: products } = useProducts({
    categoryId: category?.id,
    subcategoryId: selectedSubId ?? undefined,
  });

  if (!category) {
    return (
      <EmptyState
        title="Category not found"
        description="Browse all 15 official GiftKart categories to find the perfect personalized gift."
        action={
          <Link to="/categories">
            <Button size="sm">View All Categories</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="gk-promo-gradient grid items-center gap-6 rounded-3xl border border-[#EBD8FF] p-6 sm:p-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Link
            to="/categories"
            className="text-xs font-bold text-[#6A11CB] hover:underline"
          >
            ← All 15 Categories
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold text-[#3B0764] sm:text-4xl">
            {category.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#4B2C70]">
            {category.description}
          </p>

          {category.subcategories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubId(null)}
                className={`min-h-[34px] rounded-full px-3.5 text-xs font-bold ${
                  !selectedSubId
                    ? 'bg-[#6A11CB] text-white'
                    : 'bg-white text-[#2B0B4E] hover:bg-[#EBD8FF]/70'
                }`}
              >
                All {category.name}
              </button>
              {category.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubId(sub.id)}
                  className={`min-h-[34px] rounded-full px-3.5 text-xs font-semibold ${
                    selectedSubId === sub.id
                      ? 'bg-[#FF4D8D] text-white'
                      : 'bg-white text-[#2B0B4E] hover:bg-[#EBD8FF]/70'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="overflow-hidden rounded-2xl border-2 border-white shadow-md">
            <ProductImage
              src={category.imageUrl}
              alt={category.name}
              aspectClass="aspect-[4/3]"
            />
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={`No products listed in this ${category.name} selection yet`}
          description="You can add new products directly to this category or subcategory from the Admin Panel (/admin/products)."
          icon={<Package className="h-5 w-5" />}
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link to="/shop">
                <Button size="sm">Browse All Gifts</Button>
              </Link>
              <Link to="/admin/products">
                <Button variant="glass" size="sm">
                  Add Product in Admin
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryLabel={category.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WishlistPage() {
  const { wishlistIds } = useCart();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="space-y-6">
      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-6 sm:p-8">
        <h1 className="flex items-center gap-2.5 text-3xl font-extrabold text-[#3B0764]">
          <Heart className="h-7 w-7 fill-[#FF4D8D] text-[#FF4D8D]" />
          <span>Your Wishlist</span>
        </h1>
        <p className="mt-1.5 text-sm text-[#4B2C70]">
          Saved personalized gifts stored locally in your browser.
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Tap the heart icon on any product card to save gifts for birthdays, anniversaries, and special occasions."
          icon={<Heart className="h-5 w-5 text-[#FF4D8D]" />}
          action={
            <Link to="/shop">
              <Button size="sm">Explore Gifts</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
