import {
  ForYouSection,
  HeroSliderSection,
  OccasionsSection,
} from '../../components/storefront/HomeSections';

export function HomePage() {
  return (
    <div className="w-full">
      {/* Hero Sliding Banner (Clean Sleek Carousel — Desktop & Mobile) */}
      <HeroSliderSection />

      {/* Gifts for Every Occasion (Directly Below Hero Slider) */}
      <OccasionsSection />

      {/* For You — Curated All-Products Editorial Grid */}
      <ForYouSection />
    </div>
  );
}
