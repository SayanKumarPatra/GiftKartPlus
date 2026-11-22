import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Product } from '../../types';
import { ProductImage } from '../ui/ProductImage';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatInr } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  categoryLabel?: string;
}

export function ProductCard({ product, categoryLabel }: ProductCardProps) {
  const { addToCart, toggleWishlist, isWishlisted, openCartDrawer } = useCart();
  const { pushToast } = useToast();
  const saved = isWishlisted(product.id);

  function handleAddToCart() {
    const defaultVariants: Record<string, string> = {};
    product.variants.forEach((group) => {
      if (group.options.length > 0) {
        defaultVariants[group.name] = group.options[0];
      }
    });
    addToCart(product, { quantity: 1, selectedVariants: defaultVariants });
    pushToast({
      title: 'Added to Cart',
      description: `${product.name} · ${formatInr(product.priceInr)}`,
      variant: 'success',
    });
    openCartDrawer();
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#ECE4F5] bg-white shadow-[0_1px_4px_rgba(43,11,78,0.04)] transition-shadow duration-200 hover:shadow-[0_12px_26px_-12px_rgba(106,17,203,0.18)]">
      {/* Flush Square Product Image + Top-Right Circular Wishlist Toggle */}
      <div className="relative overflow-hidden bg-[#FAF7FD]">
        <Link to={`/product/${product.slug}`} className="block">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            aspectClass="aspect-square"
            zoomOnHover
          />
        </Link>

        <button
          type="button"
          onClick={() => {
            const added = toggleWishlist(product.id);
            pushToast({
              title: added ? 'Saved to Wishlist' : 'Removed from Wishlist',
              description: product.name,
              variant: 'info',
            });
          }}
          aria-label={
            saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
          }
          className="absolute right-2.5 top-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#2B0B4E] shadow-xs transition-transform duration-150 hover:scale-105 sm:h-8 sm:w-8"
        >
          <Heart
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
              saved ? 'fill-[#FF4D8D] text-[#FF4D8D]' : 'text-[#2B0B4E]'
            }`}
          />
        </button>
      </div>

      {/* Clean Editorial Card Body */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        {/* Price (Left) + Crisp Compact NEW Tag (Right) */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-bold tabular-nums text-[#1E1035] sm:text-[15px]">
            {formatInr(product.priceInr)}
          </span>
          <span className="shrink-0 rounded bg-[#F3ECFB] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#5A11AD]">
            NEW
          </span>
        </div>

        {/* Editorial Serif Product Title */}
        <Link
          to={`/product/${product.slug}`}
          className="mt-1 line-clamp-2 font-editorial text-[12.5px] font-semibold leading-[1.35] text-[#1E1035] transition-colors hover:text-[#6A11CB] sm:text-[14px]"
        >
          {product.name}
        </Link>

        {/* Subtle Maker / Brand Attribution */}
        <p className="mt-1.5 truncate text-[10.5px] font-medium text-[#84759A] sm:text-[11px]">
          {categoryLabel ? `By GiftKart · ${categoryLabel}` : 'By GiftKart'}
        </p>

        {/* Bottom Full-Width Solid Add to Cart Button */}
        <div className="mt-auto pt-2.5 sm:pt-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stockCount <= 0}
            className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg bg-[#5A11AD] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#460B8C] active:bg-[#3A0875] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[38px] sm:text-xs"
          >
            {product.stockCount > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </article>
  );
}
