import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { useCategories } from '../../hooks/useStoreData';
import { useCart } from '../../context/CartContext';
import { OFFICIAL_OCCASIONS } from '../../config/appConfig';

interface MobileHeaderProps {
  onOpenSearch: () => void;
}

export function MobileHeader({ onOpenSearch }: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedCatId, setExpandedCatId] = useState<string | null>('cat-coffee-mug');
  const { data: categories } = useCategories();
  const { itemCount, wishlistIds, openCartDrawer } = useCart();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[52px] items-center justify-between border-b border-[#EBD8FF]/90 bg-white/95 px-2.5 backdrop-blur-xl lg:hidden">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#2B0B4E] hover:bg-[#F8F2FF]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" aria-label="GiftKart Home" className="min-w-0">
            <BrandLogo size="sm" />
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search gifts"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#2B0B4E] hover:bg-[#F8F2FF]"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            to="/wishlist"
            aria-label={`Wishlist (${wishlistIds.length})`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#2B0B4E] hover:bg-[#FFF0F6]"
          >
            <Heart className="h-5 w-5 text-[#FF4D8D]" />
            {wishlistIds.length > 0 && (
              <span className="absolute right-0.5 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 font-mono text-[9px] font-bold tabular-nums text-white">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={openCartDrawer}
            aria-label={`Cart (${itemCount})`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#6A11CB] hover:bg-[#F8F2FF]"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute right-0.5 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 font-mono text-[9px] font-bold tabular-nums text-white">
              {itemCount}
            </span>
          </button>
        </div>
      </header>

      {/* Responsive Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#2B0B4E]/35 backdrop-blur-xs"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative flex h-full w-full max-w-xs flex-col border-r border-[#EBD8FF] bg-white">
            <div className="flex h-[58px] items-center justify-between border-b border-[#EBD8FF] px-4">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#594A6B] hover:bg-[#F8F2FF]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <nav className="space-y-1">
                {[
                  { label: 'Home', to: '/' },
                  { label: 'Shop All Gifts', to: '/shop' },
                  { label: 'Customize Gifts', to: '/customize' },
                  { label: 'Customization Guide', to: '/customization-guide' },
                  { label: 'Best Sellers', to: '/best-sellers' },
                  { label: 'Accessories', to: '/category/personalized-accessories' },
                  { label: 'Track Order', to: '/track-order' },
                  { label: 'My Orders', to: '/my-orders' },
                  { label: 'Saved Addresses', to: '/addresses' },
                  { label: 'About Us', to: '/about' },
                  { label: 'Contact Us', to: '/contact' },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex min-h-[40px] items-center justify-between rounded-xl px-3 text-sm font-semibold text-[#2B0B4E] hover:bg-[#F8F2FF] hover:text-[#6A11CB]"
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="h-4 w-4 text-[#8B7AA0]" />
                  </Link>
                ))}
              </nav>

              {/* 15 Main Categories + Subcategories */}
              <div className="mt-5 border-t border-[#EBD8FF] pt-4">
                <div className="mb-2 flex items-center justify-between px-3">
                  <span className="text-xs font-bold text-[#6A11CB]">
                    Shop by Category (15)
                  </span>
                  <Link to="/categories" className="text-xs font-semibold text-[#FF4D8D]">
                    View all
                  </Link>
                </div>
                <div className="space-y-1">
                  {categories.map((cat) => {
                    const hasSubs = cat.subcategories.length > 0;
                    const expanded = expandedCatId === cat.id;
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between rounded-xl px-3 hover:bg-[#F8F2FF]">
                          <Link
                            to={`/category/${cat.slug}`}
                            className="flex min-h-[38px] flex-1 items-center text-sm font-medium text-[#2B0B4E]"
                          >
                            {cat.name}
                          </Link>
                          {hasSubs && (
                            <button
                              type="button"
                              onClick={() => setExpandedCatId(expanded ? null : cat.id)}
                              aria-label={`Toggle ${cat.name} subcategories`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6A11CB]"
                            >
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${
                                  expanded ? 'rotate-90' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>
                        {hasSubs && expanded && (
                          <div className="ml-4 space-y-0.5 border-l-2 border-[#EBD8FF] py-1 pl-3">
                            {cat.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/shop?category=${cat.slug}&subcategory=${sub.slug}`}
                                className="flex min-h-[34px] items-center text-xs font-medium text-[#594A6B] hover:text-[#FF4D8D]"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Occasions */}
              <div className="mt-5 border-t border-[#EBD8FF] pt-4">
                <p className="mb-2 px-3 text-xs font-bold text-[#FF4D8D]">
                  Gifts for Every Occasion
                </p>
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  {OFFICIAL_OCCASIONS.map((occ) => (
                    <Link
                      key={occ.id}
                      to={`/shop?occasion=${encodeURIComponent(occ.tag)}`}
                      className="rounded-xl bg-[#F8F2FF] px-2.5 py-2 text-xs font-semibold text-[#2B0B4E] hover:bg-[#EBD8FF]"
                    >
                      {occ.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
