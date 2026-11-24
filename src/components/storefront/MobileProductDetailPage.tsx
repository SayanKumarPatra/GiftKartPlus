import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Candy,
  Coffee,
  Gift,
  Heart,
  Home,
  Image as ImageIcon,
  KeyRound,
  Lightbulb,
  Package,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Category, Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ProductImage } from '../ui/ProductImage';
import { formatInr } from '../../utils/format';

interface MobileProductDetailPageProps {
  product: Product;
  category?: Category;
  categories: Category[];
  products: Product[];
  supportPhone?: string;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.95L0 24l6.32-1.66a11.84 11.84 0 0 0 5.74 1.46h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.44-8.42ZM12.07 21.8h-.01a9.87 9.87 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.65-.24-.37a9.84 9.84 0 0 1-1.52-5.27c0-5.45 4.44-9.89 9.91-9.89 2.64 0 5.13 1.03 7 2.9a9.82 9.82 0 0 1 2.9 7c0 5.46-4.44 9.89-9.89 9.89Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.21 5.08 4.5.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function getCategoryMeta(category?: Category): {
  Icon: LucideIcon;
  sidebarParam: string;
} {
  if (!category) {
    return { Icon: Gift, sidebarParam: 'all-gifts' };
  }
  const slug = category.slug.toLowerCase();
  const name = category.name.toLowerCase();

  if (slug.includes('mug') || name.includes('mug')) {
    return { Icon: Coffee, sidebarParam: 'coffee-mugs' };
  }
  if (slug.includes('t-shirt') || slug.includes('tshirt') || name.includes('t-shirt')) {
    return { Icon: Shirt, sidebarParam: 'tshirt-prints' };
  }
  if (slug.includes('frame') || name.includes('frame')) {
    return { Icon: ImageIcon, sidebarParam: 'photo-frames' };
  }
  if (slug.includes('led') || slug.includes('lighting') || name.includes('led')) {
    return { Icon: Lightbulb, sidebarParam: 'led-lighting-gifts' };
  }
  if (slug.includes('cushion') || name.includes('cushion')) {
    return { Icon: Heart, sidebarParam: 'cushions' };
  }
  if (slug.includes('gift-box') || name.includes('box') || name.includes('hamper')) {
    return { Icon: Package, sidebarParam: 'gift-boxes-hampers' };
  }
  if (slug.includes('gift-bag') || name.includes('bag')) {
    return { Icon: ShoppingBag, sidebarParam: 'gift-bags' };
  }
  if (slug.includes('home-decor') || name.includes('home decor')) {
    return { Icon: Home, sidebarParam: 'home-decor-gifts' };
  }
  if (slug.includes('keychain') || name.includes('keychain') || name.includes('key chain')) {
    return { Icon: KeyRound, sidebarParam: 'keychains' };
  }
  if (slug.includes('chocolate') || name.includes('chocolate')) {
    return { Icon: Candy, sidebarParam: 'unique-chocolates' };
  }
  return { Icon: Gift, sidebarParam: 'all-gifts' };
}

function buildDefaultVariants(targetProduct: Product): Record<string, string> {
  const defaults: Record<string, string> = {};
  targetProduct.variants.forEach((variant) => {
    if (variant.options.length > 0) {
      defaults[variant.name] = variant.options[0];
    }
  });
  return defaults;
}

export function MobileProductDetailPage({
  product,
  category,
  products,
  supportPhone,
}: MobileProductDetailPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerAccount } = useAuth();
  const { items, addToCart, toggleWishlist, isWishlisted } = useCart();
  const { pushToast } = useToast();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() =>
    buildDefaultVariants(product)
  );
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setActiveImageIdx(0);
    setSelectedVariants(buildDefaultVariants(product));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [product.id]);

  const isInCart = useMemo(() => {
    const selectedSig = JSON.stringify(selectedVariants);
    return items.some(
      (item) =>
        item.productId === product.id &&
        JSON.stringify(item.selectedVariants) === selectedSig
    );
  }, [items, product.id, selectedVariants]);

  const galleryImages = useMemo(
    () => (product.images.length > 0 ? product.images : ['']),
    [product.images]
  );

  const safeImageIdx =
    activeImageIdx >= 0 && activeImageIdx < galleryImages.length ? activeImageIdx : 0;

  const { Icon: CategoryIcon, sidebarParam } = useMemo(
    () => getCategoryMeta(category),
    [category]
  );

  /**
   * Show ONLY genuine product-specific selection options (e.g., T-Shirt Size, Frame Size,
   * Color, Shade, Light Mode). Never force unnecessary Capacity or Handle Style options
   * onto standard mugs or products that don't require them.
   */
  const visibleVariantGroups = useMemo(() => {
    return product.variants.filter((group) => {
      if (group.options.length <= 1) return false;
      const normalized = group.name.trim().toLowerCase();
      if (normalized === 'capacity' || normalized === 'handle style') {
        return false;
      }
      return true;
    });
  }, [product.variants]);

  const showPersonalizationCard = Boolean(
    product.supportsPersonalization || product.supportsPhotoUpload
  );

  const whatsappHref = useMemo(() => {
    const prefilled = product.supportsPhotoUpload
      ? `Hello GiftKart! After placing my order, I would like to send my photo and custom message for "${product.name}".`
      : `Hello GiftKart! After placing my order, I would like to send my custom text for "${product.name}".`;
    const encoded = encodeURIComponent(prefilled);
    const digitsOnly = (supportPhone ?? '').replace(/[^\d]/g, '');
    return digitsOnly
      ? `https://wa.me/${digitsOnly}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
  }, [product.name, product.supportsPhotoUpload, supportPhone]);

  /**
   * Up to 3 real related products in one single horizontal row.
   * Never includes the current product itself, and never fabricates fake items.
   */
  const recommendedProducts = useMemo(() => {
    const productOccasions = new Set(product.occasionTags);
    return products
      .filter((item) => item.isActive && item.id !== product.id)
      .sort((a, b) => {
        const sameCatDiff =
          Number(b.categoryId === product.categoryId) -
          Number(a.categoryId === product.categoryId);
        if (sameCatDiff !== 0) return sameCatDiff;

        const aSharedOccasions = a.occasionTags.filter((tag) =>
          productOccasions.has(tag)
        ).length;
        const bSharedOccasions = b.occasionTags.filter((tag) =>
          productOccasions.has(tag)
        ).length;
        if (bSharedOccasions !== aSharedOccasions) {
          return bSharedOccasions - aSharedOccasions;
        }

        return Number(b.isBestSeller || b.isFeatured) - Number(a.isBestSeller || a.isFeatured);
      })
      .slice(0, 3);
  }, [products, product.id, product.categoryId, product.occasionTags]);

  const isOutOfStock = product.stockCount <= 0;

  function handleGalleryTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleGalleryTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || galleryImages.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 36) return;
    if (deltaX < 0) {
      setActiveImageIdx((prev) => (prev + 1) % galleryImages.length);
    } else {
      setActiveImageIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  }

  function handleAddToCart() {
    if (isInCart) {
      navigate('/cart');
      return;
    }
    if (isOutOfStock) return;
    addToCart(product, {
      quantity: 1,
      selectedVariants,
    });
    pushToast({
      title: 'Product is added to cart.',
      variant: 'success',
      compact: true,
    });
  }

  function handleBuyNow() {
    if (isOutOfStock) return;
    addToCart(product, {
      quantity: 1,
      selectedVariants,
    });
    navigate('/checkout');
  }

  function handleQuickAddRecommended(relProduct: Product) {
    if (relProduct.stockCount <= 0) return;
    addToCart(relProduct, {
      quantity: 1,
      selectedVariants: buildDefaultVariants(relProduct),
    });
    pushToast({
      title: 'Product is added to cart.',
      variant: 'success',
      compact: true,
    });
  }

  function handleWishlistAction(targetProductId: string) {
    if (!customerAccount) {
      navigate('/account', {
        state: {
          from: `${location.pathname}${location.search}`,
          reason: 'wishlist',
        },
      });
      return;
    }
    toggleWishlist(targetProductId);
  }

  const descriptionText = product.description?.trim() || product.shortDescription?.trim();

  return (
    <div className="min-h-screen w-full bg-white pb-[86px] text-[#2B0B4E]">
      {/* 1. MAIN PRODUCT IMAGE GALLERY (Sharp Square-Corner Box, No Arrows, No Zoom) */}
      <section aria-label="Product photos">
        <div
          onTouchStart={handleGalleryTouchStart}
          onTouchEnd={handleGalleryTouchEnd}
          className="relative w-full overflow-hidden rounded-none border-b border-[#EBD8FF]/70 bg-[#FDF7FC]"
        >
          <ProductImage
            src={galleryImages[safeImageIdx]}
            alt={product.name}
            aspectClass="aspect-[4/3]"
          />
        </div>

        {/* 2. PRODUCT THUMBNAIL GALLERY (Only when multiple real images exist) */}
        {galleryImages.length > 1 && (
          <div className="no-scrollbar mt-2.5 flex items-center gap-2 overflow-x-auto px-3.5 pb-0.5">
            {galleryImages.map((img, idx) => {
              const isSelected = idx === safeImageIdx;
              return (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`View image ${idx + 1} of ${product.name}`}
                  aria-pressed={isSelected}
                  className={`relative h-[56px] w-[74px] shrink-0 overflow-hidden rounded-[8px] p-[2px] transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] shadow-[0_3px_10px_rgba(106,17,203,0.16)]'
                      : 'border border-[#EBD8FF] bg-white opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="h-full w-full overflow-hidden rounded-[6px] bg-[#FDF7FC]">
                    <ProductImage
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      aspectClass="aspect-[4/3]"
                      className="h-full w-full"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. CATEGORY TAG -> PRODUCT NAME -> NORMAL SELLING PRICE -> DESCRIPTION */}
      <section aria-label="Product details" className="px-3.5 pt-3.5">
        {/* Category Tag Directly Above Product Name (Zero Breadcrumbs) */}
        {category && (
          <Link
            to={`/categories?cat=${sidebarParam}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#EBD8FF] bg-[#F5ECFF] px-3 py-1 text-[12px] font-bold leading-none text-[#6A11CB] transition-colors active:bg-[#EBD8FF]"
          >
            <CategoryIcon className="h-3.5 w-3.5 shrink-0 stroke-[2.2]" aria-hidden="true" />
            <span>{category.name}</span>
          </Link>
        )}

        {/* Product Name */}
        <h1 className="mt-2 text-[22px] font-extrabold leading-[1.2] tracking-[-0.015em] text-[#2B0B4E]">
          {product.name}
        </h1>

        {/* Normal Selling Price ONLY (No Rating, No Reviews, No Original Price, No Discount) */}
        <p className="mt-1.5 text-[27px] font-extrabold leading-none tracking-[-0.02em] text-[#FF2A7A] tabular-nums">
          {formatInr(product.priceInr)}
        </p>

        {/* Product Description */}
        {descriptionText && (
          <p className="mt-2.5 text-[13.5px] leading-[1.55] text-[#3B2654]">
            {descriptionText}
          </p>
        )}
      </section>

      {/* 4. PRODUCT-SPECIFIC OPTIONS (Conditional — Only When Genuine Variants Exist) */}
      {visibleVariantGroups.length > 0 && (
        <section
          aria-label="Product options"
          className="mt-3.5 space-y-3 border-t border-[#F2E6FF] px-3.5 pt-3.5"
        >
          {visibleVariantGroups.map((group) => (
            <div key={group.name}>
              <p className="text-[12px] font-bold text-[#3B0764]">
                {group.name}:{' '}
                <span className="font-extrabold text-[#6A11CB]">
                  {selectedVariants[group.name] ?? group.options[0]}
                </span>
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {group.options.map((opt) => {
                  const isActive = selectedVariants[group.name] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setSelectedVariants((prev) => ({ ...prev, [group.name]: opt }))
                      }
                      className={`min-h-[34px] rounded-full px-3.5 text-[12px] font-bold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#6A11CB] text-white shadow-[0_4px_12px_rgba(106,17,203,0.25)]'
                          : 'border border-[#EBD8FF] bg-[#FAF6FF] text-[#3B0764] hover:border-[#6A11CB]/50'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 5. COMPACT WHATSAPP PERSONALIZATION STRIP (Conditional — ONLY For Personalized Products) */}
      {showPersonalizationCard && (
        <section aria-label="WhatsApp personalization" className="mt-3 px-3.5">
          <div className="flex items-center gap-2 rounded-[10px] border border-[#EBD8FF] bg-[#F8F3FF] px-2.5 py-1.5">
            {/* Compact WhatsApp Icon */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
              <WhatsAppIcon className="h-4 w-4" />
            </div>

            {/* Concise Compact Text */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-extrabold leading-[1.2] text-[#4C1D95]">
                Photo &amp; Custom Text
              </p>
              <p className="mt-0.5 text-[10.5px] leading-[1.25] text-[#4B3568]">
                {product.supportsPhotoUpload
                  ? 'Send photo & text on WhatsApp after ordering.'
                  : 'Send custom text on WhatsApp after ordering.'}
              </p>
            </div>

            {/* Slim Compact Button */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#25D366] bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#16A34A] whitespace-nowrap transition-colors active:scale-95 hover:bg-[#F0FDF4]"
            >
              <WhatsAppIcon className="h-3 w-3 text-[#25D366]" />
              <span>WhatsApp</span>
            </a>
          </div>
        </section>
      )}

      {/* 6. YOU MAY ALSO LIKE — 3 COMPACT CARDS IN ONE SINGLE ROW */}
      {recommendedProducts.length > 0 && (
        <section aria-label="You may also like" className="mt-5 px-3.5">
          <div className="flex items-center gap-2">
            <Gift className="h-[18px] w-[18px] shrink-0 text-[#FF2A7A] stroke-[2.2]" aria-hidden="true" />
            <h2 className="text-[16.5px] font-extrabold tracking-[-0.01em] text-[#2B0B4E] whitespace-nowrap">
              You May Also Like
            </h2>
            <div aria-hidden="true" className="h-px flex-1 bg-[#EBD8FF]" />
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {recommendedProducts.map((rel) => {
              const relWishlisted = isWishlisted(rel.id);
              return (
                <article
                  key={rel.id}
                  className="flex flex-col overflow-hidden rounded-[14px] border border-[#EBD8FF] bg-white p-1.5 shadow-[0_3px_12px_rgba(106,17,203,0.06)]"
                >
                  <div className="relative overflow-hidden rounded-[10px] bg-[#FDF7FC]">
                    <Link
                      to={`/product/${rel.slug}`}
                      aria-label={rel.name}
                      className="block"
                    >
                      <ProductImage
                        src={rel.images[0]}
                        alt={rel.name}
                        aspectClass="aspect-[4/3]"
                      />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleWishlistAction(rel.id)}
                      aria-label={
                        relWishlisted
                          ? `Remove ${rel.name} from wishlist`
                          : `Save ${rel.name} to wishlist`
                      }
                      className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 shadow-xs transition-transform active:scale-90 ${
                        relWishlisted ? 'text-[#FF4D8D]' : 'text-[#4C1D95]'
                      }`}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 stroke-[2.2] ${
                          relWishlisted ? 'fill-[#FF4D8D]' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <Link
                    to={`/product/${rel.slug}`}
                    className="mt-1.5 line-clamp-2 min-h-[26px] text-[10.5px] font-extrabold leading-[1.22] text-[#2B0B4E] min-[390px]:text-[11px]"
                  >
                    {rel.name}
                  </Link>

                  <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
                    <span className="text-[12.5px] font-extrabold leading-none text-[#FF2A7A] tabular-nums min-[390px]:text-[13px]">
                      {formatInr(rel.priceInr)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickAddRecommended(rel)}
                      disabled={rel.stockCount <= 0}
                      aria-label={`Add ${rel.name} to cart`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#6A11CB] to-[#7E22CE] text-white shadow-[0_3px_8px_rgba(106,17,203,0.28)] transition-transform active:scale-90 disabled:opacity-45"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 stroke-[2.2]" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. FIXED BOTTOM PURCHASE BAR (Clean 2-Button Add to Cart + Buy Now, Zero Quantity Clutter) */}
      <div
        role="region"
        aria-label="Purchase actions"
        className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-30 border-t border-[#EBD8FF]/90 bg-white/96 px-3 py-2 shadow-[0_-6px_18px_rgba(106,17,203,0.08)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-[480px] grid-cols-2 gap-2.5">
          {/* Add to Cart / Go to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isInCart && isOutOfStock}
            className={`inline-flex h-[43px] items-center justify-center gap-2 rounded-full border-[1.5px] px-3 text-[13.5px] font-extrabold whitespace-nowrap transition-all active:scale-[0.98] disabled:opacity-45 ${
              isInCart
                ? 'border-[#6A11CB] bg-[#F5ECFF] text-[#6A11CB]'
                : 'border-[#6A11CB] bg-white text-[#2B0B4E]'
            }`}
          >
            <ShoppingCart className="h-4 w-4 shrink-0 text-[#6A11CB] stroke-[2.2]" />
            <span>
              {isInCart
                ? 'Go to Cart'
                : isOutOfStock
                  ? 'Out of Stock'
                  : 'Add to Cart'}
            </span>
            {isInCart && (
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#6A11CB] stroke-[2.5]" />
            )}
          </button>

          {/* Buy Now Gradient Button */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="inline-flex h-[43px] items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-3 text-[14px] font-extrabold text-white shadow-[0_6px_16px_-4px_rgba(255,36,122,0.52)] whitespace-nowrap transition-transform active:scale-[0.98] disabled:opacity-45"
          >
            <Zap className="h-4 w-4 shrink-0 fill-white text-white" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
