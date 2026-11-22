import { Link } from 'react-router-dom';
import { Gift, Image as ImageIcon, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatInr } from '../../utils/format';
import { Button } from '../ui/Button';
import { ProductImage } from '../ui/ProductImage';

export function CartDrawer() {
  const {
    items,
    giftWrap,
    isCartDrawerOpen,
    subtotalInr,
    giftWrapChargeInr,
    estimatedTotalInr,
    closeCartDrawer,
    updateQuantity,
    removeItem,
  } = useCart();

  if (!isCartDrawerOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      <div
        className="fixed inset-0 bg-[#2A0E4D]/35 backdrop-blur-xs"
        onClick={closeCartDrawer}
      />

      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-[#EBD8FF] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EBD8FF] bg-gradient-to-r from-[#FAF6FF] to-[#FFF4F9] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6A11CB] text-white">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#2A0E4D]">
                Your Gift Bag
              </h2>
              <p className="text-[11px] text-[#5F4B78]">
                {items.reduce((sum, i) => sum + i.quantity, 0)} item(s) · INR (₹)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCartDrawer}
            aria-label="Close cart drawer"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5F4B78] hover:bg-[#EBD8FF]/60 hover:text-[#6A11CB]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4EBFF] text-[#6A11CB]">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="font-display text-base font-bold text-[#2A0E4D]">
                Your gift bag is empty
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#5F4B78]">
                Explore 15 personalized gifting categories and add thoughtful keepsakes to begin a story.
              </p>
              <Link to="/shop" onClick={closeCartDrawer} className="mt-5">
                <Button size="sm" variant="accent">
                  Browse Gifts
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="rounded-2xl border border-[#EBD8FF] bg-[#FDFBFF] p-3.5 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <Link
                      to={`/product/${item.productSlug}`}
                      onClick={closeCartDrawer}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-white"
                    >
                      <ProductImage
                        src={item.image}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${item.productSlug}`}
                          onClick={closeCartDrawer}
                          className="line-clamp-2 text-sm font-semibold text-[#2A0E4D] hover:text-[#6A11CB]"
                        >
                          {item.productName}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.cartItemId)}
                          aria-label={`Remove ${item.productName}`}
                          className="rounded-lg p-1 text-[#7B6496] hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="mt-0.5 font-mono text-[11px] text-[#7B6496]">
                        SKU: {item.productSku}
                      </p>

                      {Object.keys(item.selectedVariants).length > 0 && (
                        <p className="mt-1 text-xs text-[#5F4B78]">
                          {Object.entries(item.selectedVariants)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}

                      {item.personalizationDetails && (
                        <p className="mt-1 text-xs font-medium text-[#6A11CB]">
                          Note: {item.personalizationDetails}
                        </p>
                      )}

                      {item.customPhotoFileName && (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-lg bg-[#FFF0F6] px-2 py-0.5 text-[11px] font-medium text-[#FF4D8D]">
                          <ImageIcon className="h-3 w-3" />
                          <span className="truncate max-w-[160px]">{item.customPhotoFileName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#F0E4FF] pt-2.5">
                    <div className="inline-flex items-center rounded-xl border border-[#EBD8FF] bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="flex h-8 w-8 items-center justify-center text-[#5F4B78] hover:text-[#6A11CB]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[28px] text-center font-mono text-xs font-bold tabular-nums text-[#2A0E4D]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="flex h-8 w-8 items-center justify-center text-[#5F4B78] hover:text-[#6A11CB]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="font-mono text-sm font-bold tabular-nums text-[#6A11CB]">
                      {formatInr(item.unitPriceInr * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Gift Wrapping Summary in Cart Drawer */}
              <div className="rounded-2xl border border-[#EBD8FF] bg-gradient-to-br from-[#F8F2FF] to-[#FFF5FA] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#6A11CB]">
                    <Gift className="h-4 w-4 text-[#FF4D8D]" />
                    <span>Gift Wrapping Summary</span>
                  </div>
                  <Link
                    to="/cart"
                    onClick={closeCartDrawer}
                    className="text-xs font-semibold text-[#FF4D8D] hover:underline"
                  >
                    Configure
                  </Link>
                </div>
                {giftWrap.enabled ? (
                  <div className="mt-2 space-y-1 text-xs text-[#5F4B78]">
                    <p>
                      Style:{' '}
                      <span className="font-semibold text-[#2A0E4D]">
                        {giftWrap.styleNameSnapshot || 'Selected'}
                      </span>{' '}
                      ·{' '}
                      <span className="font-mono font-semibold tabular-nums text-[#6A11CB]">
                        {formatInr(giftWrap.chargeInrSnapshot)}
                      </span>
                    </p>
                    {giftWrap.recipientName && (
                      <p>
                        Recipient:{' '}
                        <span className="font-medium text-[#2A0E4D]">
                          {giftWrap.recipientName}
                        </span>
                      </p>
                    )}
                    {giftWrap.giftMessage && (
                      <p className="line-clamp-2 italic text-[#4A3862]">
                        &ldquo;{giftWrap.giftMessage}&rdquo;
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-[#5F4B78]">
                    Not enabled yet. Add boutique wrapping, recipient name &amp; a personal note in Cart.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[#EBD8FF] bg-[#FAF6FF] px-5 py-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#5F4B78]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#2A0E4D]">
                  {formatInr(subtotalInr)}
                </span>
              </div>
              {giftWrap.enabled && (
                <div className="flex justify-between text-[#5F4B78]">
                  <span>Gift Wrapping ({giftWrap.styleNameSnapshot})</span>
                  <span className="font-mono tabular-nums text-[#2A0E4D]">
                    {formatInr(giftWrapChargeInr)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#EBD8FF] pt-2 text-base font-bold text-[#2A0E4D]">
                <span>Estimated Total</span>
                <span className="font-mono tabular-nums text-[#6A11CB]">
                  {formatInr(estimatedTotalInr)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link to="/cart" onClick={closeCartDrawer}>
                <Button variant="glass" fullWidth>
                  View Cart
                </Button>
              </Link>
              <Link to="/checkout" onClick={closeCartDrawer}>
                <Button variant="accent" fullWidth>
                  Demo Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
