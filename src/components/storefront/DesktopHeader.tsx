import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Heart,
  Search,
  ShoppingCart,
  User,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface DesktopHeaderProps {
  onOpenSearch: () => void;
}

export function DesktopHeader({ onOpenSearch }: DesktopHeaderProps) {
  const { itemCount, wishlistIds, openCartDrawer } = useCart();
  const { customerAccount } = useAuth();
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

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 hidden border-b border-[#EAE2F5] bg-white/98 backdrop-blur-xl lg:block"
    >
      <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between gap-6 px-6">
        {/* Left: Upright GiftKart Brand Logo */}
        <Link
          to="/"
          aria-label="GiftKart Home"
          className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A11CB]"
        >
          <BrandLogo size="md" showTagline />
        </Link>

        {/* Center: Clean, Professional Integrated Ecommerce Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="flex h-[42px] max-w-2xl flex-1 items-stretch overflow-hidden rounded-lg border border-[#DCD3EB] bg-[#FAF9FC] transition-colors focus-within:border-[#6A11CB] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6A11CB]/12"
        >
          <label htmlFor="desktop-header-search" className="sr-only">
            Search GiftKart products
          </label>
          <input
            id="desktop-header-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search personalized gifts, mugs, t-shirts, photo frames..."
            className="w-full bg-transparent px-4 text-[13px] font-medium text-[#1E1035] placeholder:text-[#7E7094] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search gifts"
            className="inline-flex h-full shrink-0 cursor-pointer items-center justify-center gap-1.5 border-l border-[#6A11CB] bg-[#6A11CB] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#540CA6] active:bg-[#46098C]"
          >
            <Search className="h-4 w-4 stroke-[2.2]" />
            <span>Search</span>
          </button>
        </form>

        {/* Right: Wishlist | Account ▾ | Cart */}
        <div className="flex shrink-0 items-center gap-4">
          {/* Wishlist */}
          <Link
            to="/wishlist"
            aria-label={`Wishlist (${wishlistIds.length} items)`}
            className="group relative inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1E1035] transition-colors hover:text-[#6A11CB]"
          >
            <span className="relative flex items-center justify-center">
              <Heart className="h-[19px] w-[19px] text-[#6A11CB] transition-colors group-hover:text-[#FF4D8D]" />
              {wishlistIds.length > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 font-mono text-[9px] font-bold tabular-nums text-white">
                  {wishlistIds.length}
                </span>
              )}
            </span>
            <span>Wishlist</span>
          </Link>

          <span className="h-4 w-px bg-[#E5DCF2]" aria-hidden="true" />

          {/* Account Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setAccountOpen(true)}
            onMouseLeave={() => setAccountOpen(false)}
          >
            <Link
              to="/account"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1E1035] transition-colors hover:text-[#6A11CB]"
            >
              <User className="h-[19px] w-[19px] text-[#6A11CB]" />
              <span className="max-w-[96px] truncate">
                {customerAccount ? customerAccount.fullName.split(' ')[0] : 'Account'}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#594A6B] transition-transform duration-150 ${
                  accountOpen ? 'rotate-180' : ''
                }`}
              />
            </Link>

            {accountOpen && (
              <div className="absolute right-0 top-full z-50 w-52 pt-2.5">
                <div className="rounded-xl border border-[#E6DCF5] bg-white p-1.5 shadow-lg shadow-[#2B0B4E]/10">
                  {[
                    { label: customerAccount ? 'My Profile' : 'Sign In / Account', to: '/account' },
                    { label: 'My Orders', to: '/my-orders' },
                    { label: 'Saved Addresses', to: '/addresses' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="block rounded-lg px-3 py-2 text-xs font-semibold text-[#2B0B4E] transition-colors hover:bg-[#F7F2FF] hover:text-[#6A11CB]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="h-4 w-px bg-[#E5DCF2]" aria-hidden="true" />

          {/* Cart */}
          <button
            type="button"
            onClick={openCartDrawer}
            aria-label={`Shopping cart (${itemCount} items)`}
            className="group relative inline-flex cursor-pointer items-center gap-2 text-[13px] font-bold text-[#1E1035] transition-colors hover:text-[#6A11CB]"
          >
            <span className="relative flex items-center justify-center">
              <ShoppingCart className="h-[19px] w-[19px] text-[#6A11CB]" />
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 font-mono text-[9px] font-bold tabular-nums text-white">
                {itemCount}
              </span>
            </span>
            <span>Cart</span>
          </button>
        </div>
      </div>
    </header>
  );
}
