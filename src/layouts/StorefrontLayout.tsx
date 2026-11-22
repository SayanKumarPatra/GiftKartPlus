import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnnouncementBar } from '../components/storefront/AnnouncementBar';
import { DesktopHeader } from '../components/storefront/DesktopHeader';
import { MobileHeader } from '../components/storefront/MobileHeader';
import { MobileBottomNav } from '../components/storefront/MobileBottomNav';
import { SearchOverlay } from '../components/storefront/SearchOverlay';
import { CartDrawer } from '../components/storefront/CartDrawer';
import { StorefrontFooter } from '../components/storefront/StorefrontFooter';

export function StorefrontLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white">
      <AnnouncementBar />
      <DesktopHeader onOpenSearch={() => setSearchOpen(true)} />
      <MobileHeader onOpenSearch={() => setSearchOpen(true)} />

      <main
        className={
          isHome
            ? 'w-full flex-1'
            : 'mx-auto w-full max-w-7xl flex-1 px-3.5 py-4 sm:px-6 sm:py-5'
        }
      >
        <Outlet />
      </main>

      <StorefrontFooter />
      <MobileBottomNav />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer />
    </div>
  );
}
