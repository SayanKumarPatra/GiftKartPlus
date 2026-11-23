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
        className="gk-liquid-glass-nav fixed inset-x-0 bottom-0 z-40 w-full rounded-t-[24px] px-1.5 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="relative grid grid-cols-5 items-center">
          {/* Inner Sliding Soft Lavender Active Capsule */}
          <div
            aria-hidden="true"
            className={`gk-mobile-nav-capsule-track pointer-events-none absolute inset-y-[1px] left-0 w-1/5 px-1 ${
              hasActiveTab ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate3d(${capsuleIndex * 100}%, 0, 0)`,
            }}
          >
            <div className="gk-liquid-glass-capsule h-full w-full rounded-[20px]" />
          </div>

          {MOBILE_NAV_ITEMS.map(({ id, label, to, Icon }, idx) => {
            const isActive = idx === activeIndex;

            return (
              <Link
                key={id}
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className="gk-mobile-nav-item relative z-10 flex min-h-[52px] flex-col items-center justify-center gap-[3px] rounded-[20px] px-1 py-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A11CB]/45 focus-visible:ring-inset"
              >
                <Icon
                  aria-hidden="true"
                  fill={isActive && id === 'home' ? '#6A11CB' : isActive ? 'rgba(106, 17, 203, 0.16)' : 'none'}
                  className={`gk-mobile-nav-icon h-[21px] w-[21px] shrink-0 ${
                    isActive
                      ? 'gk-mobile-nav-icon--active stroke-[2.2]'
                      : 'stroke-[1.85]'
                  }`}
                />
                <span
                  className={`gk-mobile-nav-label whitespace-nowrap text-[10.5px] leading-[1.15] tracking-[-0.01em] ${
                    isActive
                      ? 'gk-mobile-nav-label--active font-bold'
                      : 'font-semibold'
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
