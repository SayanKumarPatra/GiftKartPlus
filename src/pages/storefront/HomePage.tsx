import {
  ForYouSection,
  HeroSliderSection,
  OccasionsSection,
} from '../../components/storefront/HomeSections';
import { MobileHomePage } from '../../components/storefront/MobileHomePage';

export function HomePage() {
  return (
    <div className="w-full">
      {/* Normal Mobile View (< 900px): Dedicated Redesigned Mobile Homepage */}
      <div className="lg:hidden">
        <MobileHomePage />
      </div>

      {/* Desktop, Laptop & Mobile "Desktop Site" Mode (>= 900px): Existing Desktop Homepage Unchanged */}
      <div className="hidden lg:block">
        <HeroSliderSection />
        <OccasionsSection />
        <ForYouSection />
      </div>
    </div>
  );
}
