import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Globe,
  Headset,
  Heart,
  LogOut,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  User,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { NotificationBell } from './NotificationBell';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { TranslationKey } from '../../i18n/translations';

interface DesktopHeaderProps {
  onOpenSearch: () => void;
}

const DESKTOP_NAV_LINKS: { labelKey: TranslationKey; to: string; end: boolean }[] = [
  { labelKey: 'home', to: '/', end: true },
  { labelKey: 'categories', to: '/categories', end: false },
  { labelKey: 'allGifts', to: '/shop', end: false },
  { labelKey: 'myOrders', to: '/my-orders', end: false },
  { labelKey: 'helpSupport', to: '/contact', end: false },
];

export function DesktopHeader({ onOpenSearch }: DesktopHeaderProps) {
  const { itemCount, wishlistIds } = useCart();
  const { customerAccount, signOutCustomer } = useAuth();
  const { t } = useLanguage();
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const headerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      onOpenSearch();
      return;
    }
    navigate(`/search?search=${encodeURIComponent(trimmed)}`);
  }

  async function handleLogout() {
    await signOutCustomer();
    setAccountOpen(false);
    navigate('/');
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 hidden border-b border-[#EBD8FF] bg-white/98 backdrop-blur-xl lg:block"
    >
      {/* Primary Brand + Search + Utility Row */}
      <div className="mx-auto flex h-[66px] max-w-[1400px] items-center justify-between gap-6 px-6 xl:px-8">
        {/* Left: GiftKart Brand Logo */}
        <Link
          to="/"
          aria-label="GiftKart Home"
          className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A11CB]"
        >
          <BrandLogo size="md" showTagline />
        </Link>

        {/* Center: Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="flex h-[42px] max-w-2xl flex-1 items-stretch overflow-hidden rounded-lg border border-[#DCD0EF] bg-[#FAF8FC] transition-colors focus-within:border-[#6A11CB] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6A11CB]/12"
        >
          <label htmlFor="desktop-header-search" className="sr-only">
            {t('search')}
          </label>
          <input
            id="desktop-header-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchDesktopPlaceholder')}
            className="w-full bg-transparent px-4 text-[13px] font-medium text-[#1E1035] placeholder:text-[#7E7094] focus:outline-none"
          />
          <button
            type="submit"
            aria-label={t('search')}
            className="inline-flex h-full shrink-0 cursor-pointer items-center justify-center gap-1.5 bg-[#6A11CB] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#560DA8] active:bg-[#46098C]"
          >
            <Search className="h-4 w-4 stroke-[2.2]" />
            <span>{t('search')}</span>
          </button>
        </form>

        {/* Right: Wishlist | Notification Bell | Account Dropdown | Cart */}
        <div className="flex shrink-0 items-center gap-4">
          <Link
            to="/wishlist"
            aria-label={`${t('wishlist')} (${wishlistIds.length})`}
            className="group relative inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1E1035] transition-colors hover:text-[#6A11CB]"
          >
            <span className="relative flex items-center justify-center">
              <Heart className="h-[19px] w-[19px] text-[#6A11CB] transition-colors group-hover:text-[#FF4D8D]" />
              {wishlistIds.length > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 font-mono text-[9px] font-bold tabular-nums text-white">
                  {wishlistIds.length}
                </span>
              )}
            </span>
            <span>{t('wishlist')}</span>
          </Link>

          <NotificationBell variant="desktop" />

          <span className="h-4 w-px bg-[#EBD8FF]" aria-hidden="true" />

          {/* Account Menu */}
          <div
            className="relative"
            onMouseEnter={() => setAccountOpen(true)}
            onMouseLeave={() => setAccountOpen(false)}
          >
            <Link
              to="/account"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1E1035] transition-colors hover:text-[#6A11CB]"
            >
              <User className="h-[19px] w-[19px] text-[#6A11CB]" />
              <span className="max-w-[110px] truncate">
                {customerAccount ? customerAccount.fullName.split(' ')[0] : t('signIn')}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#594A6B] transition-transform duration-150 ${
                  accountOpen ? 'rotate-180' : ''
                }`}
              />
            </Link>

            {accountOpen && (
              <div className="absolute right-0 top-full z-50 w-56 pt-2">
                <div className="rounded-xl border border-[#EBD8FF] bg-white p-1.5 shadow-lg shadow-[#2B0B4E]/10">
                  {customerAccount && (
                    <div className="mb-1 border-b border-[#F2E8FF] px-3 py-2">
                      <p className="truncate text-xs font-bold text-[#1E1035]">
                        {customerAccount.fullName}
                      </p>
                      <p className="truncate text-[11px] text-[#6F5D88]">
                        {customerAccount.email}
                      </p>
                    </div>
                  )}

                  <Link
                    to="/account"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#2B0B4E] transition-colors hover:bg-[#FAF5FF] hover:text-[#6A11CB]"
                  >
                    <User className="h-3.5 w-3.5 text-[#6A11CB]" />
                    <span>{customerAccount ? t('profile') : t('loginRegister')}</span>
                  </Link>
                  <Link
                    to="/account?tab=language"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#2B0B4E] transition-colors hover:bg-[#FAF5FF] hover:text-[#6A11CB]"
                  >
                    <Globe className="h-3.5 w-3.5 text-[#6A11CB]" />
                    <span>{t('language')}</span>
                  </Link>
                  <Link
                    to="/my-orders"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#2B0B4E] transition-colors hover:bg-[#FAF5FF] hover:text-[#6A11CB]"
                  >
                    <Package className="h-3.5 w-3.5 text-[#6A11CB]" />
                    <span>{t('myOrders')}</span>
                  </Link>
                  <Link
                    to="/addresses"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#2B0B4E] transition-colors hover:bg-[#FAF5FF] hover:text-[#6A11CB]"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#6A11CB]" />
                    <span>{t('savedAddresses')}</span>
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#2B0B4E] transition-colors hover:bg-[#FAF5FF] hover:text-[#6A11CB]"
                  >
                    <Headset className="h-3.5 w-3.5 text-[#6A11CB]" />
                    <span>{t('helpSupport')}</span>
                  </Link>

                  {customerAccount && (
                    <>
                      <div className="my-1 h-px bg-[#F2E8FF]" />
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#C81E68] transition-colors hover:bg-[#FFF0F6]"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>{t('signOut')}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="h-4 w-px bg-[#EBD8FF]" aria-hidden="true" />

          {/* Cart Direct Link */}
          <Link
            to="/cart"
            aria-label={`${t('cart')} (${itemCount})`}
            className="group relative inline-flex items-center gap-2 rounded-lg bg-[#FAF5FF] px-3.5 py-2 text-[13px] font-bold text-[#6A11CB] transition-colors hover:bg-[#F1E4FF]"
          >
            <span className="relative flex items-center justify-center">
              <ShoppingCart className="h-[18px] w-[18px]" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 font-mono text-[9px] font-bold tabular-nums text-white">
                  {itemCount}
                </span>
              )}
            </span>
            <span>{t('cart')}</span>
          </Link>
        </div>
      </div>

      {/* Secondary Clean Navigation Strip */}
      <nav
        aria-label="Primary desktop navigation"
        className="border-t border-[#F3EAFF] bg-[#FCFAFF]"
      >
        <div className="mx-auto flex h-10 max-w-[1400px] items-center justify-between px-6 xl:px-8">
          <div className="flex items-center gap-7">
            {DESKTOP_NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex h-10 items-center text-[13px] font-semibold transition-colors ${
                    isActive
                      ? 'text-[#6A11CB] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#6A11CB]'
                      : 'text-[#4B3963] hover:text-[#6A11CB]'
                  }`
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
          </div>

          <p className="text-[12px] font-medium text-[#6C5987]">
            {t('brandTagline')}
          </p>
        </div>
      </nav>
    </header>
  );
}
