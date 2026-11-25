import {
  HeroSliderSection,
  ProductListingSection,
  ShopByCategorySection,
  TrendingGiftsSection,
} from '../../components/storefront/HomeSections';
import { MobileHomePage } from '../../components/storefront/MobileHomePage';

export function HomePage() {
  return (
    <div className="w-full">
      {/* Mobile View (< 1024px): Protected Mobile Homepage */}
      <div className="lg:hidden">
        <MobileHomePage />
      </div>

      {/* Desktop & Laptop View (>= 1024px): Redesigned Desktop Homepage */}
      <div className="hidden lg:block">
        <HeroSliderSection />
        <ShopByCategorySection />
        <TrendingGiftsSection />
        <ProductListingSection />
      </div>
    </div>
  );
}
