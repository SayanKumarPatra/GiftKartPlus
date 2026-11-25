import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '../../types';
import { ProductImage } from '../ui/ProductImage';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatInr } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  categoryLabel?: string;
  compact?: boolean;
}

export function ProductCard({
  product,
  categoryLabel,
  compact = false,
}: ProductCardProps) {
  const { items, addToCart, toggleWishlist, isWishlisted } = useCart();
  const { customerAccount } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const saved = isWishlisted(product.id);
  const isInCart = items.some((item) => item.productId === product.id);

  function handleAddToCart() {
    if (isInCart) {
      navigate('/cart');
      return;
    }
    const defaultVariants: Record<string, string> = {};
    product.variants.forEach((group) => {
      if (group.options.length > 0) {
        defaultVariants[group.name] = group.options[0];
      }
    });
    addToCart(product, { quantity: 1, selectedVariants: defaultVariants });
    pushToast({
      title: 'Product is added to cart.',
      variant: 'success',
      compact: true,
    });
  }

  function handleWishlistClick() {
    if (!customerAccount) {
      navigate('/account', {
        state: {
          from: `${location.pathname}${location.search}`,
          reason: 'wishlist',
        },
      });
      return;
    }
    toggleWishlist(product.id);
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#ECE4F5] bg-white shadow-[0_1px_4px_rgba(43,11,78,0.04)] transition-all duration-200 hover:border-[#D7B9FA] hover:shadow-[0_12px_26px_-12px_rgba(106,17,203,0.18)]">
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
          onClick={handleWishlistClick}
          aria-label={
            saved
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          className="absolute right-2.5 top-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#2B0B4E] shadow-xs transition-transform duration-150 hover:scale-105"
        >
          <Heart
            className={`h-4 w-4 ${
              saved ? 'fill-[#FF4D8D] text-[#FF4D8D]' : 'text-[#2B0B4E]'
            }`}
          />
        </button>
      </div>

      {/* Clean Modern E-Commerce Card Body (Normal Selling Price Only — No Ratings/Reviews/MRP) */}
      <div className={`flex flex-1 flex-col ${compact ? 'p-3' : 'p-3.5'}`}>
        {categoryLabel && (
          <p className="truncate text-[11px] font-semibold text-[#6A11CB]">
            {categoryLabel}
          </p>
        )}

        <Link
          to={`/product/${product.slug}`}
          className={`mt-0.5 line-clamp-2 font-semibold leading-[1.35] text-[#1E1035] transition-colors hover:text-[#6A11CB] ${
            compact ? 'text-[13px]' : 'text-[14px]'
          }`}
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span
            className={`font-bold tabular-nums text-[#1E1035] ${
              compact ? 'text-[14.5px]' : 'text-[16px]'
            }`}
          >
            {formatInr(product.priceInr)}
          </span>
          {product.stockCount <= 0 && (
            <span className="text-[11px] font-semibold text-rose-600">
              Out of Stock
            </span>
          )}
        </div>

        {/* Bottom Full-Width Add to Cart / Go to Cart Button */}
        <div className={`mt-auto ${compact ? 'pt-2.5' : 'pt-3'}`}>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isInCart && product.stockCount <= 0}
            className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              compact ? 'h-8 text-[11.5px]' : 'h-[38px] text-[12.5px]'
            } ${
              isInCart
                ? 'border border-[#6A11CB] bg-[#F5ECFF] text-[#6A11CB] hover:bg-[#EDE0FF]'
                : 'bg-[#6A11CB] text-white hover:bg-[#550DA8] active:bg-[#440A8A]'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
            <span>
              {isInCart
                ? 'Go to Cart'
                : product.stockCount > 0
                  ? 'Add to Cart'
                  : 'Out of Stock'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
