import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Heart,
  Home,
  Info,
  MapPin,
  Menu,
  Package,
  Phone,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { useCart } from '../../context/CartContext';

interface MobileHeaderProps {
  onOpenSearch?: () => void;
}

interface DrawerMainLink {
  label: string;
  to: string;
  Icon: LucideIcon;
}

const MOBILE_DRAWER_MAIN_LINKS: DrawerMainLink[] = [
  { label: 'Home', to: '/', Icon: Home },
  { label: 'Track Order', to: '/track-order', Icon: Truck },
  { label: 'My Orders', to: '/my-orders', Icon: Package },
  { label: 'Saved Addresses', to: '/addresses', Icon: MapPin },
  { label: 'About Us', to: '/about', Icon: Info },
  { label: 'Contact Us', to: '/contact', Icon: Phone },
];

const MOBILE_DRAWER_POLICY_LINKS = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'Return & Refund Policy', to: '/return-policy' },
  { label: 'Cancellation Policy', to: '/cancellation-policy' },
  { label: 'FAQ', to: '/faq' },
] as const;

export function MobileHeader(_props: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, wishlistIds, openCartDrawer } = useCart();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const isHome = location.pathname === '/';

  return (
    <>
      <header
        className={`sticky top-0 z-40 grid h-[56px] grid-cols-[76px_1fr_76px] items-center px-2 backdrop-blur-md lg:hidden ${
          isHome
            ? 'border-b border-transparent bg-[#FDE4EC]/95'
            : 'border-b border-[#EFE3FF]/80 bg-white/96'
        }`}
      >
        {/* Left: Hamburger Menu */}
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#4B148C] transition-colors active:bg-[#EBD8FF]/50"
          >
            <Menu className="h-[22px] w-[22px] stroke-[2]" />
          </button>
        </div>

        {/* Center: Visually Centered Official GiftKart Logo */}
        <div className="flex items-center justify-center overflow-hidden">
          <Link
            to="/"
            aria-label="GiftKart Home"
            className="inline-flex items-center justify-center"
          >
            <BrandLogo size="sm" />
          </Link>
        </div>

        {/* Right: Wishlist & Shopping Cart */}
        <div className="flex items-center justify-end gap-0.5">
          <Link
            to="/wishlist"
            aria-label={`Wishlist (${wishlistIds.length})`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#4B148C] transition-colors active:bg-[#EBD8FF]/50"
          >
            <Heart className="h-[20px] w-[20px] stroke-[1.9]" />
            {wishlistIds.length > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 text-[9px] font-bold tabular-nums text-white">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={openCartDrawer}
            aria-label={`Cart (${itemCount})`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#4B148C] transition-colors active:bg-[#EBD8FF]/50"
          >
            <ShoppingCart className="h-[20px] w-[20px] stroke-[1.9]" />
            {itemCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 text-[9px] font-bold tabular-nums text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Compact Refined Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#2B0B4E]/35 backdrop-blur-xs"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative flex h-full w-[280px] max-w-[82vw] flex-col rounded-r-2xl bg-white shadow-[12px_0_32px_-12px_rgba(43,11,78,0.28)]">
            {/* Soft Brand Drawer Header */}
            <div className="flex h-[56px] shrink-0 items-center justify-between rounded-tr-2xl border-b border-[#EFE3FF] bg-gradient-to-r from-[#FDF0F6] to-[#F6ECFF] px-3.5">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-[#4B148C] ring-1 ring-[#EBD8FF] transition-colors active:bg-[#EFE2FF]"
              >
                <X className="h-4 w-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Tight, Naturally Stacked Drawer Body (No Large Middle Gap) */}
            <div className="flex-1 overflow-y-auto px-3 py-2.5">
              <nav aria-label="Mobile menu links" className="space-y-0.5">
                {MOBILE_DRAWER_MAIN_LINKS.map(({ label, to, Icon }) => {
                  const isActive =
                    to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(to);

                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex min-h-[40px] items-center justify-between rounded-xl px-2.5 py-1.5 text-[13px] transition-colors ${
                        isActive
                          ? 'bg-[#F3E7FF] font-bold text-[#6A11CB]'
                          : 'font-semibold text-[#2B0B4E] active:bg-[#F8F2FF]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isActive
                              ? 'bg-[#6A11CB] text-white'
                              : 'bg-[#F5ECFF] text-[#6A11CB]'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 stroke-[2.1]" />
                        </span>
                        <span>{label}</span>
                      </span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 ${
                          isActive ? 'text-[#6A11CB]' : 'text-[#A291B6]'
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>

              {/* Compact Policies Section Immediately Below */}
              <div className="mt-3 border-t border-[#EFE3FF] pt-2.5">
                <p className="mb-1 px-2.5 text-[10.5px] font-bold uppercase tracking-wider text-[#7E6A96]">
                  Policies
                </p>
                <nav aria-label="Policies and legal" className="space-y-0.5">
                  {MOBILE_DRAWER_POLICY_LINKS.map((link) => {
                    const isActive = location.pathname === link.to;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`flex min-h-[34px] items-center justify-between rounded-lg px-2.5 text-[12.5px] transition-colors ${
                          isActive
                            ? 'bg-[#F5ECFF] font-semibold text-[#6A11CB]'
                            : 'font-medium text-[#55446B] active:bg-[#F8F2FF]'
                        }`}
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#B5A6C7]" />
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
