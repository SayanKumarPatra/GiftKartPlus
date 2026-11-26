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
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { NotificationBell } from './NotificationBell';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import type { TranslationKey } from '../../i18n/translations';

interface MobileHeaderProps {
  onOpenSearch?: () => void;
}

interface DrawerMainLink {
  labelKey: TranslationKey;
  to: string;
  Icon: LucideIcon;
}

const MOBILE_DRAWER_MAIN_LINKS: DrawerMainLink[] = [
  { labelKey: 'home', to: '/', Icon: Home },
  { labelKey: 'myOrders', to: '/my-orders', Icon: Package },
  { labelKey: 'savedAddresses', to: '/addresses', Icon: MapPin },
  { labelKey: 'aboutUs', to: '/about', Icon: Info },
  { labelKey: 'contactUs', to: '/contact', Icon: Phone },
];

const MOBILE_DRAWER_POLICY_LINKS: { labelKey: TranslationKey; to: string }[] = [
  { labelKey: 'privacyPolicy', to: '/privacy-policy' },
  { labelKey: 'termsConditions', to: '/terms' },
  { labelKey: 'shippingDelivery', to: '/shipping-policy' },
  { labelKey: 'returnsRefunds', to: '/return-policy' },
  { labelKey: 'faq', to: '/faq' },
];

export function MobileHeader(_props: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, wishlistIds } = useCart();
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const isHome = location.pathname === '/';

  return (
    <>
      <header
        className={`sticky top-0 z-40 grid h-[56px] grid-cols-[100px_1fr_100px] items-center px-2 backdrop-blur-md lg:hidden ${
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
            aria-label={t('menu')}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4B148C] transition-colors active:bg-[#EBD8FF]/50"
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

        {/* Right: Exact Order — Wishlist -> Notification Bell -> Add to Cart */}
        <div className="flex items-center justify-end gap-0.5">
          <Link
            to="/wishlist"
            aria-label={`${t('wishlist')} (${wishlistIds.length})`}
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#4B148C] transition-colors active:bg-[#EBD8FF]/50"
          >
            <Heart className="h-[19px] w-[19px] stroke-[1.9]" />
            {wishlistIds.length > 0 && (
              <span className="absolute right-0 top-0 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#FF4D8D] px-0.5 text-[8.5px] font-bold tabular-nums text-white">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          <NotificationBell variant="mobile" />

          <Link
            to="/cart"
            aria-label={`${t('cart')} (${itemCount})`}
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#4B148C] transition-colors active:bg-[#EBD8FF]/50"
          >
            <ShoppingCart className="h-[19px] w-[19px] stroke-[1.9]" />
            {itemCount > 0 && (
              <span className="absolute right-0 top-0 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#FF4D8D] px-0.5 text-[8.5px] font-bold tabular-nums text-white">
                {itemCount}
              </span>
            )}
          </Link>
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
                aria-label={t('close')}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-[#4B148C] ring-1 ring-[#EBD8FF] transition-colors active:bg-[#EFE2FF]"
              >
                <X className="h-4 w-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Tight, Naturally Stacked Drawer Body */}
            <div className="flex-1 overflow-y-auto px-3 py-2.5">
              <nav aria-label="Mobile menu links" className="space-y-0.5">
                {MOBILE_DRAWER_MAIN_LINKS.map(({ labelKey, to, Icon }) => {
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
                        <span>{t(labelKey)}</span>
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

              {/* Compact Policies Section */}
              <div className="mt-3 border-t border-[#EFE3FF] pt-2.5">
                <p className="mb-1 px-2.5 text-[10.5px] font-bold uppercase tracking-wider text-[#7E6A96]">
                  {t('footerPolicies')}
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
                        <span>{t(link.labelKey)}</span>
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
