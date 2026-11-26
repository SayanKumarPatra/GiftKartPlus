import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Headset, Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { TranslationKey } from '../../i18n/translations';

interface MobileNavItem {
  id: 'home' | 'categories' | 'order' | 'help' | 'account';
  labelKey: TranslationKey;
  to: string;
  Icon: LucideIcon;
  matches: (pathname: string) => boolean;
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  {
    id: 'home',
    labelKey: 'home',
    to: '/',
    Icon: Home,
    matches: (pathname) => pathname === '/',
  },
  {
    id: 'categories',
    labelKey: 'categories',
    to: '/categories',
    Icon: LayoutGrid,
    matches: (pathname) => pathname === '/categories',
  },
  {
    id: 'order',
    labelKey: 'orderShort',
    to: '/my-orders',
    Icon: ShoppingBag,
    matches: (pathname) =>
      pathname === '/my-orders' ||
      pathname.startsWith('/order/') ||
      pathname.startsWith('/order-confirmation/'),
  },
  {
    id: 'help',
    labelKey: 'help',
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
    labelKey: 'account',
    to: '/account',
    Icon: User,
    matches: (pathname) =>
      pathname === '/account' ||
      pathname === '/addresses' ||
      pathname === '/wishlist',
  },
];

function SolidHomeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M11.16 2.68a1.3 1.3 0 0 1 1.68 0l7.36 6.23c.51.43.8 1.06.8 1.72V19a2.25 2.25 0 0 1-2.25 2.25H15.2a.75.75 0 0 1-.75-.75v-4.25a2.45 2.45 0 0 0-4.9 0v4.25a.75.75 0 0 1-.75.75H5.25A2.25 2.25 0 0 1 3 19v-8.37c0-.66.29-1.29.8-1.72l7.36-6.23Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const isHome = pathname === '/';

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
        className={`h-[calc(18px+env(safe-area-inset-bottom,0px))] lg:hidden ${
          isHome ? 'bg-[#FFF0F7]' : 'bg-transparent'
        }`}
      />

      <nav
        aria-label="Mobile bottom navigation"
        className="gk-liquid-glass-nav fixed inset-x-2.5 bottom-[max(0.55rem,calc(env(safe-area-inset-bottom,0px)+0.35rem))] z-40 mx-auto max-w-[436px] rounded-full p-[5px] lg:hidden"
      >
        <div className="relative grid grid-cols-5 items-center">
          {/* Smooth Sliding Frosted Glass + Soft Pink-Purple Glow Active Pill */}
          <div
            aria-hidden="true"
            className={`gk-mobile-nav-capsule-track pointer-events-none absolute inset-y-0 left-0 w-1/5 ${
              hasActiveTab ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate3d(${capsuleIndex * 100}%, 0, 0)`,
            }}
          >
            <div className="gk-liquid-glass-capsule h-full w-full rounded-full" />
          </div>

          {MOBILE_NAV_ITEMS.map(({ id, labelKey, to, Icon }, idx) => {
            const isActive = idx === activeIndex;

            return (
              <Link
                key={id}
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className="gk-mobile-nav-item relative z-10 flex min-h-[54px] flex-col items-center justify-center gap-[3px] rounded-full px-1 py-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A11CB]/45 focus-visible:ring-inset"
              >
                {id === 'home' && isActive ? (
                  <SolidHomeIcon className="gk-mobile-nav-icon gk-mobile-nav-icon--active h-[22px] w-[22px] shrink-0" />
                ) : (
                  <Icon
                    aria-hidden="true"
                    fill={isActive ? 'rgba(106, 17, 203, 0.14)' : 'none'}
                    className={`gk-mobile-nav-icon h-[21px] w-[21px] shrink-0 ${
                      isActive
                        ? 'gk-mobile-nav-icon--active stroke-[2.15]'
                        : 'stroke-[1.85]'
                    }`}
                  />
                )}
                <span
                  className={`gk-mobile-nav-label whitespace-nowrap text-[10.5px] leading-[1.15] tracking-[-0.015em] ${
                    isActive
                      ? 'gk-mobile-nav-label--active font-bold'
                      : 'font-semibold'
                  }`}
                >
                  {t(labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
