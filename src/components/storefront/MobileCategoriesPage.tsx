import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Candy,
  Coffee,
  Gift,
  Heart,
  Home,
  Image as ImageIcon,
  KeyRound,
  Lightbulb,
  Package,
  Search,
  Shirt,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCategories, useProducts } from '../../hooks/useStoreData';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Category, Product } from '../../types';
import { formatInr } from '../../utils/format';

type SidebarCategoryKey =
  | 'all-gifts'
  | 'coffee-mugs'
  | 'tshirt-prints'
  | 'photo-frames'
  | 'led-lighting-gifts'
  | 'cushions'
  | 'gift-boxes-hampers'
  | 'gift-bags'
  | 'home-decor-gifts'
  | 'keychains'
  | 'unique-chocolates';

interface SidebarCategoryConfig {
  id: SidebarCategoryKey;
  label: string;
  Icon: LucideIcon;
  matchesCategory: (category: Category) => boolean;
}

/**
 * Final ordered 11-category structure for Mobile Categories Page.
 * Empty categories (0 available products) are automatically hidden except "All Gifts".
 */
const ORDERED_SIDEBAR_CATEGORIES: SidebarCategoryConfig[] = [
  {
    id: 'all-gifts',
    label: 'All Gifts',
    Icon: Gift,
    matchesCategory: () => true,
  },
  {
    id: 'coffee-mugs',
    label: 'Coffee Mugs',
    Icon: Coffee,
    matchesCategory: (cat) =>
      cat.id === 'cat-coffee-mug' ||
      cat.slug === 'coffee-mug' ||
      cat.slug === 'coffee-mugs' ||
      /coffee\s*mug/i.test(cat.name),
  },
  {
    id: 'tshirt-prints',
    label: 'T-Shirt Prints',
    Icon: Shirt,
    matchesCategory: (cat) =>
      cat.id === 'cat-tshirt-print' ||
      cat.slug === 't-shirt-print' ||
      cat.slug === 't-shirt-prints' ||
      /t[-\s]?shirt/i.test(cat.name),
  },
  {
    id: 'photo-frames',
    label: 'Photo Frames',
    Icon: ImageIcon,
    matchesCategory: (cat) =>
      cat.id === 'cat-photo-frame' ||
      cat.slug === 'photo-frame' ||
      cat.slug === 'photo-frames' ||
      /photo\s*frame/i.test(cat.name),
  },
  {
    id: 'led-lighting-gifts',
    label: 'LED Lighting Gifts',
    Icon: Lightbulb,
    matchesCategory: (cat) =>
      cat.id === 'cat-led-lighting' ||
      cat.slug === 'led-lighting-gifts' ||
      /led|lighting/i.test(cat.name),
  },
  {
    id: 'cushions',
    label: 'Cushions',
    Icon: Heart,
    matchesCategory: (cat) =>
      cat.id === 'cat-cushions' ||
      cat.slug === 'cushions' ||
      cat.slug === 'cushion' ||
      /cushion/i.test(cat.name),
  },
  {
    id: 'gift-boxes-hampers',
    label: 'Gift Boxes & Hampers',
    Icon: Package,
    matchesCategory: (cat) =>
      cat.id === 'cat-gift-box' ||
      cat.slug === 'gift-box' ||
      cat.slug === 'gift-boxes-hampers' ||
      /gift\s*box|hamper/i.test(cat.name),
  },
  {
    id: 'gift-bags',
    label: 'Gift Bags',
    Icon: ShoppingBag,
    matchesCategory: (cat) =>
      cat.id === 'cat-gift-bag' ||
      cat.slug === 'gift-bag' ||
      cat.slug === 'gift-bags' ||
      /gift\s*bag/i.test(cat.name),
  },
  {
    id: 'home-decor-gifts',
    label: 'Home Decor Gifts',
    Icon: Home,
    matchesCategory: (cat) =>
      cat.id === 'cat-home-decor' ||
      cat.slug === 'home-decor-gifts' ||
      /home\s*decor/i.test(cat.name),
  },
  {
    id: 'keychains',
    label: 'Keychains',
    Icon: KeyRound,
    matchesCategory: (cat) =>
      cat.id === 'cat-keychain' ||
      cat.slug === 'keychain' ||
      cat.slug === 'keychains' ||
      /key\s*chain/i.test(cat.name),
  },
  {
    id: 'unique-chocolates',
    label: 'Unique Chocolates',
    Icon: Candy,
    matchesCategory: (cat) =>
      cat.id === 'cat-unique-chocolates' ||
      cat.slug === 'unique-chocolates' ||
      cat.slug === 'chocolates' ||
      /chocolate/i.test(cat.name),
  },
];

function deduplicateProducts(list: Product[]): Product[] {
  const seen = new Set<string>();
  const unique: Product[] = [];
  for (const product of list) {
    if (!seen.has(product.id)) {
      seen.add(product.id);
      unique.push(product);
    }
  }
  return unique;
}

export function MobileCategoriesPage() {
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { customerAccount } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const rawCatParam = searchParams.get('cat');
  const catParam = (
    rawCatParam === 'keychain' ? 'keychains' : rawCatParam
  ) as SidebarCategoryKey | null;
  const isValidCatParam = ORDERED_SIDEBAR_CATEGORIES.some(
    (c) => c.id === catParam
  );

  const [activeCategoryId, setActiveCategoryId] =
    useState<SidebarCategoryKey>(
      isValidCatParam && catParam ? catParam : 'all-gifts'
    );
  const [searchQuery, setSearchQuery] = useState('');
  const rightPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isValidCatParam && catParam) {
      setActiveCategoryId(catParam);
    }
  }, [catParam, isValidCatParam]);

  // Deduplicated active available products across the entire catalog
  const allAvailableProducts = useMemo(() => {
    const active = products.filter((p) => p.isActive && p.stockCount > 0);
    return deduplicateProducts(active);
  }, [products]);

  // Build map from each sidebar category key -> its matching products (deduplicated)
  const productsBySidebarKey = useMemo(() => {
    const map = new Map<SidebarCategoryKey, Product[]>();
    map.set('all-gifts', allAvailableProducts);

    for (const def of ORDERED_SIDEBAR_CATEGORIES) {
      if (def.id === 'all-gifts') continue;
      const matchingCatIds = new Set(
        categories.filter((c) => def.matchesCategory(c)).map((c) => c.id)
      );
      const matchedProducts = allAvailableProducts.filter((p) =>
        matchingCatIds.has(p.categoryId)
      );
      map.set(def.id, deduplicateProducts(matchedProducts));
    }
    return map;
  }, [allAvailableProducts, categories]);

  const visibleSidebarCategories = ORDERED_SIDEBAR_CATEGORIES;

  const activeCategoryDef =
    visibleSidebarCategories.find((c) => c.id === activeCategoryId) ??
    visibleSidebarCategories[0];

  const displayedProducts =
    productsBySidebarKey.get(activeCategoryDef.id) ?? [];

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      navigate('/search');
      return;
    }
    navigate(`/search?search=${encodeURIComponent(trimmed)}`);
  }

  function handleSelectCategory(id: SidebarCategoryKey) {
    setActiveCategoryId(id);
    if (rightPanelRef.current) {
      const rect = rightPanelRef.current.getBoundingClientRect();
      if (rect.top < 110) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + rect.top - 116),
          behavior: 'smooth',
        });
      }
    }
  }

  function handleWishlistToggle(e: React.MouseEvent, productId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!customerAccount) {
      navigate('/account', {
        state: { from: location.pathname, reason: 'wishlist' },
      });
      return;
    }
    toggleWishlist(productId);
  }

  function handleAddToCart(e: React.MouseEvent, product: Product) {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariants: Record<string, string> = {};
    for (const v of product.variants) {
      if (v.options.length > 0) {
        defaultVariants[v.name] = v.options[0];
      }
    }
    addToCart(product, { quantity: 1, selectedVariants: defaultVariants });
    pushToast({
      title: 'Added to Cart',
      description: `${product.name} added to your GiftKart bag.`,
      variant: 'success',
    });
  }

  return (
    <div className="min-h-[calc(100dvh-132px)] w-full overflow-x-clip bg-[#FAF7FF]">
      {/* Search Bar Directly Below Existing Mobile Header */}
      <div className="border-b border-[#EFE3FF] bg-gradient-to-b from-[#FAF5FF] to-white px-3 py-2.5">
        <form
          onSubmit={handleSearchSubmit}
          className="flex h-[42px] w-full items-center gap-2.5 rounded-full border border-[#EBD8FF] bg-white px-3.5 shadow-[0_3px_12px_rgba(106,17,203,0.08)] focus-within:border-[#6A11CB]/50 focus-within:ring-2 focus-within:ring-[#6A11CB]/15"
        >
          <Search className="h-[18px] w-[18px] shrink-0 text-[#6A11CB] stroke-[2.2]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for Gifts, Products & More..."
            aria-label="Search for Gifts, Products & More"
            className="h-full w-full min-w-0 bg-transparent text-[13px] font-medium text-[#2B0B4E] placeholder:text-[#7E6B95] focus:outline-none"
          />
        </form>
      </div>

      {/* Main Split Layout: LEFT Vertical Category Sidebar + RIGHT Direct 2-Column Product Grid */}
      <div className="flex w-full items-start">
        {/* LEFT SIDEBAR: Vertical Category List */}
        <aside
          aria-label="Gift Categories"
          className="sticky top-[56px] max-h-[calc(100dvh-134px)] w-[104px] shrink-0 self-start overflow-y-auto border-r border-[#EAE0F8] bg-[#F6EEFF] px-1.5 pb-6 pt-2 no-scrollbar min-[390px]:w-[114px] min-[412px]:w-[122px]"
        >
          <ul className="space-y-1.5">
            {visibleSidebarCategories.map(({ id, label, Icon }) => {
              const isSelected = id === activeCategoryDef.id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(id)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`flex w-full items-center gap-1.5 rounded-xl px-2 py-2.5 text-left transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#6A11CB] text-white shadow-[0_4px_12px_rgba(106,17,203,0.28)]'
                        : 'border border-[#EFE3FF] bg-white text-[#2B0B4E] shadow-[0_1px_4px_rgba(106,17,203,0.04)] active:bg-[#F3E8FF]'
                    }`}
                  >
                    <Icon
                      aria-hidden="true"
                      className={`h-[15px] w-[15px] shrink-0 stroke-[2.1] ${
                        isSelected ? 'text-white' : 'text-[#6A11CB]'
                      }`}
                    />
                    <span
                      className={`min-w-0 flex-1 break-words text-[10.5px] leading-[1.2] tracking-[-0.01em] min-[390px]:text-[11px] ${
                        isSelected ? 'font-bold text-white' : 'font-semibold text-[#2B0B4E]'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* RIGHT SECTION: Direct 2-Column Product Grid (No Subcategories, No Extra Banners, No See All/View All) */}
        <section
          ref={rightPanelRef}
          aria-live="polite"
          aria-label={activeCategoryDef.label}
          className="min-w-0 flex-1 px-2 pb-6 pt-2.5 min-[390px]:px-2.5"
        >
          {/* Minimal Active Category Title & Count */}
          <div className="mb-2.5 flex items-baseline justify-between gap-2 px-0.5">
            <h1 className="truncate text-[14px] font-extrabold tracking-[-0.01em] text-[#2B0B4E] min-[390px]:text-[15px]">
              {activeCategoryDef.label}
            </h1>
            <span className="shrink-0 text-[11px] font-semibold text-[#75628E]">
              {isLoading
                ? '...'
                : `${displayedProducts.length} ${displayedProducts.length === 1 ? 'item' : 'items'}`}
            </span>
          </div>

          {/* 2-Column Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 min-[390px]:gap-2.5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[200px] animate-pulse rounded-2xl border border-[#EFE3FF] bg-white"
                />
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="mt-2 rounded-2xl border border-[#EFE3FF] bg-white px-4 py-8 text-center shadow-[0_4px_14px_rgba(106,17,203,0.05)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5ECFF] text-[#6A11CB]">
                <activeCategoryDef.Icon className="h-6 w-6 stroke-[1.9]" />
              </div>
              <p className="mt-3 text-[13.5px] font-extrabold text-[#2B0B4E]">
                {activeCategoryDef.label}
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[#6E5B85]">
                New gifts are being added to this category soon.
              </p>
              <button
                type="button"
                onClick={() => handleSelectCategory('all-gifts')}
                className="mt-4 inline-flex min-h-[38px] items-center justify-center rounded-full bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] px-4 text-[12px] font-bold text-white shadow-[0_4px_12px_rgba(106,17,203,0.24)] active:scale-95"
              >
                Explore All Gifts
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 min-[390px]:gap-2.5">
              {displayedProducts.map((product) => {
                const wishlisted = isWishlisted(product.id);
                const hasDiscount =
                  typeof product.compareAtPriceInr === 'number' &&
                  product.compareAtPriceInr > product.priceInr;
                const discountPercent = hasDiscount
                  ? Math.round(
                      ((product.compareAtPriceInr! - product.priceInr) /
                        product.compareAtPriceInr!) *
                        100
                    )
                  : 0;

                return (
                  <article
                    key={product.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-[#EFE3FF] bg-white shadow-[0_3px_12px_rgba(106,17,203,0.06)] transition-transform duration-150 active:scale-[0.985]"
                  >
                    {/* Product Image + Discount Badge + Wishlist Heart */}
                    <Link
                      to={`/product/${product.slug}`}
                      className="relative block aspect-square w-full overflow-hidden bg-[#FAF6FF]"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />

                      {discountPercent > 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-[#FF4D8D] px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-white shadow-xs">
                          {discountPercent}% OFF
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleWishlistToggle(e, product.id)}
                        aria-label={
                          wishlisted
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                        }
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/92 text-[#6A11CB] shadow-xs active:scale-90"
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            wishlisted
                              ? 'fill-[#FF4D8D] text-[#FF4D8D]'
                              : 'text-[#4B148C] stroke-[2]'
                          }`}
                        />
                      </button>
                    </Link>

                    {/* Product Info + Price + Add to Cart */}
                    <div className="flex flex-1 flex-col justify-between p-2">
                      <Link
                        to={`/product/${product.slug}`}
                        className="line-clamp-2 text-[11px] font-bold leading-[1.3] text-[#2B0B4E] min-[390px]:text-[11.5px]"
                      >
                        {product.name}
                      </Link>

                      <div className="mt-2 flex items-end justify-between gap-1">
                        <div className="min-w-0 leading-tight">
                          <p className="text-[12.5px] font-extrabold tabular-nums text-[#6A11CB] min-[390px]:text-[13px]">
                            {formatInr(product.priceInr)}
                          </p>
                          {hasDiscount && (
                            <p className="text-[10px] font-medium tabular-nums text-[#8E7DA6] line-through">
                              {formatInr(product.compareAtPriceInr!)}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, product)}
                          aria-label={`Add ${product.name} to cart`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] text-white shadow-[0_3px_8px_rgba(106,17,203,0.24)] active:scale-90 min-[390px]:h-[30px] min-[390px]:w-[30px]"
                        >
                          <ShoppingCart className="h-3.5 w-3.5 stroke-[2.2]" />
                        </button>
                      </div>
                    </div>
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
