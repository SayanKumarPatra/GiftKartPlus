import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Headset, Home, LayoutGrid, Package, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MobileNavItem {
  id: string;
  label: string;
  to: string;
  Icon: LucideIcon;
  matches: (pathname: string) => boolean;
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  {
    id: 'home',
    label: 'Home',
    to: '/',
    Icon: Home,
    matches: (pathname) => pathname === '/',
  },
  {
    id: 'categories',
    label: 'Categories',
    to: '/categories',
    Icon: LayoutGrid,
    matches: (pathname) =>
      pathname === '/categories' || pathname.startsWith('/category/'),
  },
  {
    id: 'order',
    label: 'Order',
    to: '/my-orders',
    Icon: Package,
    matches: (pathname) =>
      pathname === '/my-orders' ||
      pathname === '/track-order' ||
      pathname.startsWith('/order/') ||
      pathname.startsWith('/order-confirmation/'),
  },
  {
    id: 'help',
    label: 'Help',
    to: '/contact',
    Icon: Headset,
    matches: (pathname) =>
      pathname === '/contact' ||
      pathname === '/faq' ||
      pathname === '/shipping-policy' ||
      pathname === '/return-policy' ||
      pathname === '/cancellation-policy' ||
      pathname === '/privacy-policy' ||
      pathname === '/terms',
  },
  {
    id: 'account',
    label: 'Account',
    to: '/account',
    Icon: User,
    matches: (pathname) =>
      pathname === '/account' ||
      pathname === '/addresses' ||
      pathname === '/wishlist',
  },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();

  const activeIndex = useMemo(
    () => MOBILE_NAV_ITEMS.findIndex((item) => item.matches(pathname)),
    [pathname]
  );

  const [lastValidIndex, setLastValidIndex] = useState(
    activeIndex >= 0 ? activeIndex : 0
  );

  useEffect(() => {
    if (activeIndex >= 0) {
      setLastValidIndex(activeIndex);
    }
  }, [activeIndex]);

  const capsuleIndex = activeIndex >= 0 ? activeIndex : lastValidIndex;
  const hasActiveTab = activeIndex >= 0;

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[env(safe-area-inset-bottom,0px)] bg-[#FFF0F7] lg:hidden"
      />

      <nav
        aria-label="Mobile bottom navigation"
        className="gk-liquid-glass-nav fixed inset-x-0 bottom-0 z-40 w-full rounded-none px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="relative grid grid-cols-5 items-center">
          {/* Sliding Lavender Glass Active Capsule */}
          <div
            aria-hidden="true"
            className={`gk-liquid-glass-capsule pointer-events-none absolute inset-y-0 left-0 w-1/5 rounded-2xl ${
              hasActiveTab ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate3d(${capsuleIndex * 100}%, 0, 0)`,
            }}
          />

          {MOBILE_NAV_ITEMS.map(({ id, label, to, Icon }, idx) => {
            const isActive = idx === activeIndex;

            return (
              <Link
                key={id}
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className="relative z-10 flex min-h-[50px] flex-col items-center justify-center gap-[3px] rounded-2xl px-1 py-1.5 text-center transition-transform duration-150 ease-out active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A11CB]/50 focus-visible:ring-inset"
              >
                <Icon
                  aria-hidden="true"
                  className={`h-[19px] w-[19px] transition-colors duration-200 ${
                    isActive
                      ? 'stroke-[2.15] text-[#6A11CB]'
                      : 'stroke-[1.8] text-[#2B0B4E]'
                  }`}
                />
                <span
                  className={`whitespace-nowrap text-[10.5px] leading-none tracking-[-0.01em] transition-colors duration-200 ${
                    isActive
                      ? 'font-semibold text-[#6A11CB]'
                      : 'font-medium text-[#2B0B4E]'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
