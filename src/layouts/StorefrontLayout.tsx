import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { AnnouncementBar } from '../components/storefront/AnnouncementBar';
import { DesktopHeader } from '../components/storefront/DesktopHeader';
import { MobileHeader } from '../components/storefront/MobileHeader';
import { MobileBottomNav } from '../components/storefront/MobileBottomNav';
import { SearchOverlay } from '../components/storefront/SearchOverlay';
import { CartDrawer } from '../components/storefront/CartDrawer';
import { ProductShareHost } from '../components/storefront/ProductShareModal';
import { StorefrontFooter } from '../components/storefront/StorefrontFooter';
import { BrandLogo } from '../components/ui/BrandLogo';
import { useStoreSettings } from '../hooks/useStoreData';

export function StorefrontLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { data: settings } = useStoreSettings();

  useEffect(() => {
    if (settings?.seo?.title) {
      document.title = settings.seo.title;
    } else if (settings?.storeName) {
      document.title = `${settings.storeName} — ${settings.tagline || 'Har Gift Mein Ek Kahani.'}`;
    }
    if (settings?.seo?.description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', settings.seo.description);
      }
    }
  }, [settings?.seo?.title, settings?.seo?.description, settings?.storeName, settings?.tagline]);

  if (settings?.maintenanceMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FAF5FF] via-white to-[#FFF4FA] px-5 text-center">
        <BrandLogo size="md" showTagline />
        <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#6A11CB]">
          <Wrench className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-[#1E1035]">
          {settings.storeName || 'GiftKart'} is Under Maintenance
        </h1>
        <p className="mt-2 max-w-md text-sm text-[#594A6B]">
          We are currently updating our catalog and store experience. Please check back shortly.
        </p>
        {(settings.supportPhone || settings.supportEmail) && (
          <p className="mt-4 text-xs font-semibold text-[#6A11CB]">
            Need help? {settings.supportPhone} · {settings.supportEmail}
          </p>
        )}
      </div>
    );
  }

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
      <ProductShareHost />
    </div>
  );
}
