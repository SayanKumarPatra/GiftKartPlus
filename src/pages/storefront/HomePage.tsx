import { Suspense, lazy } from 'react';
import { useIsDesktop } from '../../hooks/useMediaQuery';

const LazyMobileHomePage = lazy(() =>
  import('../../components/storefront/MobileHomePage').then((m) => ({
    default: m.MobileHomePage,
  }))
);

const LazyDesktopHomePage = lazy(() =>
  import('../../components/storefront/HomeSections').then((m) => ({
    default: function DesktopHomeSections() {
      return (
        <>
          <m.HeroSliderSection />
          <m.ShopByCategorySection />
          <m.TrendingGiftsSection />
          <m.ProductListingSection />
        </>
      );
    },
  }))
);

function MobileHomeSkeleton() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FDE4EC] via-[#F9ECFF] to-[#F5ECFF] px-2.5 pt-2 pb-6">
      <div className="h-[38px] w-full animate-pulse rounded-full bg-white/90" />
      <div className="mt-2 aspect-[3/1] w-full animate-pulse rounded-xl bg-[#EBD8FF]/70" />
      <div className="mt-3 grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5">
            <div className="h-14 w-14 animate-pulse rounded-xl bg-white/80" />
            <div className="h-2.5 w-12 animate-pulse rounded bg-[#EBD8FF]/70" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="overflow-hidden rounded-[14px] border border-[#EBD8FF]/80 bg-white p-1.5"
          >
            <div className="aspect-square animate-pulse rounded-[10px] bg-[#F4EBFF]" />
            <div className="mt-2 h-3.5 w-4/5 animate-pulse rounded bg-[#F4EBFF]" />
            <div className="mt-1.5 h-3.5 w-1/2 animate-pulse rounded bg-[#F4EBFF]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopHomeSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-5 xl:px-8">
      <div className="h-[320px] w-full animate-pulse rounded-2xl bg-[#F4ECFF] xl:h-[380px]" />
      <div className="grid grid-cols-5 gap-3.5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-32 animate-pulse rounded-xl bg-[#FAF5FF]" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-[300px] animate-pulse rounded-xl bg-[#FAF5FF]" />
        ))}
      </div>
    </div>
  );
}

export function HomePage() {
  const isDesktop = useIsDesktop();

  return (
    <div className="w-full">
      {isDesktop ? (
        <Suspense fallback={<DesktopHomeSkeleton />}>
          <LazyDesktopHomePage />
        </Suspense>
      ) : (
        <Suspense fallback={<MobileHomeSkeleton />}>
          <LazyMobileHomePage />
        </Suspense>
      )}
    </div>
  );
}
