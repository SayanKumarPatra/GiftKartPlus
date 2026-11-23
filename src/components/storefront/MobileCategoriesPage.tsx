import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Search } from 'lucide-react';

import figmaHeroGiftBoxesImg from '../../assets/images/figma_hero_gift_boxes_1795420552395.jpg';
import figmaCatAllGiftsImg from '../../assets/images/figma_cat_all_gifts_1795420531719.jpg';
import heroPersonalizedImg from '../../assets/images/hero_personalized_gifts_1795285052149.jpg';
import coffeeMugImg from '../../assets/images/product_magic_mug_1795285112764.jpg';
import tshirtPrintImg from '../../assets/images/product_tshirt_print_1795285052582.jpg';
import photoFrameImg from '../../assets/images/product_photo_frame_1795285052399.jpg';
import ledLampImg from '../../assets/images/product_led_lamp_1795285053467.jpg';
import cushionImg from '../../assets/images/product_cushion_keychain_1795285051802.jpg';
import giftBoxImg from '../../assets/images/product_gift_box_1795285058123.jpg';
import giftBagImg from '../../assets/images/category_gift_bag_1795289466578.jpg';
import homeDecorImg from '../../assets/images/category_home_decor_1795289476486.jpg';
import kitchenGiftsImg from '../../assets/images/mobile_cat_kitchen_gifts_1795431665296.jpg';
import moonLampImg from '../../assets/images/mobile_sub_moon_lamp_1795431667937.jpg';
import heartCushionImg from '../../assets/images/mobile_sub_heart_cushion_1795431665593.jpg';
import surpriseBoxImg from '../../assets/images/mobile_sub_surprise_box_1795431696834.jpg';
import coupleFriendshipImg from '../../assets/images/category_couple_friendship_1795289468022.jpg';
import customizedPhotoImg from '../../assets/images/category_customized_photo_gifts_1795295079046.jpg';
import handmadeGiftImg from '../../assets/images/category_handmade_gift_1795289475494.jpg';
import stationeryDecorImg from '../../assets/images/product_stationery_decor_1795285052438.jpg';
import specialOccasionImg from '../../assets/images/category_special_occasion_gifts_1795295079395.jpg';
import occasionBirthdayImg from '../../assets/images/mobile_occasion_birthday_1795372824084.jpg';
import occasionAnniversaryImg from '../../assets/images/mobile_occasion_anniversary_1795372828097.jpg';
import occasionRomanticImg from '../../assets/images/mobile_occasion_romantic_1795372827257.jpg';
import occasionFestiveImg from '../../assets/images/mobile_occasion_festive_1795372827888.jpg';
import { OCCASION_ICONS } from '../../config/appConfig';

type SidebarCategoryId =
  | 'all-gifts'
  | 'coffee-mugs'
  | 'tshirt-prints'
  | 'photo-frames'
  | 'led-lighting-gifts'
  | 'cushions'
  | 'gift-boxes-hampers'
  | 'gift-bags'
  | 'home-decor-gifts'
  | 'kitchen-gifts';

interface SubcategoryCardItem {
  id: string;
  name: string;
  imageUrl: string;
  to: string;
}

interface SidebarCategoryDef {
  id: SidebarCategoryId;
  name: string;
  shortLabel: string;
  iconImage: string;
  shopAllTo: string;
  subcategories: SubcategoryCardItem[];
}

const SIDEBAR_CATEGORIES: SidebarCategoryDef[] = [
  {
    id: 'all-gifts',
    name: 'All Gifts',
    shortLabel: 'All Gifts',
    iconImage: figmaCatAllGiftsImg,
    shopAllTo: '/shop',
    subcategories: [],
  },
  {
    id: 'coffee-mugs',
    name: 'Coffee Mugs',
    shortLabel: 'Coffee Mugs',
    iconImage: coffeeMugImg,
    shopAllTo: '/category/coffee-mug',
    subcategories: [
      {
        id: 'mug-photo',
        name: 'Personalized Photo Mug',
        imageUrl: customizedPhotoImg,
        to: '/shop?category=coffee-mug&search=Photo%20Mug',
      },
      {
        id: 'mug-magic',
        name: 'Magic Mug',
        imageUrl: coffeeMugImg,
        to: '/shop?category=coffee-mug&subcategory=magic-mug',
      },
      {
        id: 'mug-couple',
        name: 'Couple Mug',
        imageUrl: coupleFriendshipImg,
        to: '/shop?category=coffee-mug&search=Couple',
      },
      {
        id: 'mug-name',
        name: 'Custom Name Mug',
        imageUrl: heroPersonalizedImg,
        to: '/shop?category=coffee-mug&search=Name%20Mug',
      },
    ],
  },
  {
    id: 'tshirt-prints',
    name: 'T-Shirt Prints',
    shortLabel: 'T-Shirt Prints',
    iconImage: tshirtPrintImg,
    shopAllTo: '/category/t-shirt-print',
    subcategories: [
      {
        id: 'tshirt-photo',
        name: 'Custom Photo T-Shirt',
        imageUrl: tshirtPrintImg,
        to: '/shop?category=t-shirt-print&search=Photo',
      },
      {
        id: 'tshirt-couple',
        name: 'Couple T-Shirt',
        imageUrl: coupleFriendshipImg,
        to: '/shop?category=t-shirt-print&search=Couple',
      },
      {
        id: 'tshirt-name',
        name: 'Name Print T-Shirt',
        imageUrl: heroPersonalizedImg,
        to: '/shop?category=t-shirt-print&search=Name',
      },
    ],
  },
  {
    id: 'photo-frames',
    name: 'Photo Frames',
    shortLabel: 'Photo Frames',
    iconImage: photoFrameImg,
    shopAllTo: '/category/photo-frame',
    subcategories: [
      {
        id: 'frame-personalized',
        name: 'Personalized Photo Frame',
        imageUrl: photoFrameImg,
        to: '/shop?category=photo-frame',
      },
      {
        id: 'frame-led',
        name: 'LED Photo Frame',
        imageUrl: ledLampImg,
        to: '/shop?category=photo-frame&search=LED',
      },
      {
        id: 'frame-collage',
        name: 'Collage Photo Frame',
        imageUrl: customizedPhotoImg,
        to: '/shop?category=photo-frame&search=Collage',
      },
    ],
  },
  {
    id: 'led-lighting-gifts',
    name: 'LED Lighting Gifts',
    shortLabel: 'LED Lighting Gifts',
    iconImage: moonLampImg,
    shopAllTo: '/category/led-lighting-gifts',
    subcategories: [
      {
        id: 'led-moon',
        name: '3D Moon Lamp',
        imageUrl: moonLampImg,
        to: '/shop?category=led-lighting-gifts&search=Moon',
      },
      {
        id: 'led-personalized',
        name: 'Personalized LED Lamp',
        imageUrl: ledLampImg,
        to: '/category/led-lighting-gifts',
      },
      {
        id: 'led-photo',
        name: 'Photo LED Lamp',
        imageUrl: customizedPhotoImg,
        to: '/shop?category=led-lighting-gifts&search=Photo',
      },
      {
        id: 'led-night-light',
        name: 'Decorative Night Light',
        imageUrl: homeDecorImg,
        to: '/shop?category=led-lighting-gifts&search=Night%20Light',
      },
    ],
  },
  {
    id: 'cushions',
    name: 'Cushions',
    shortLabel: 'Cushions',
    iconImage: heartCushionImg,
    shopAllTo: '/category/cushion',
    subcategories: [
      {
        id: 'cushion-photo',
        name: 'Personalized Photo Cushion',
        imageUrl: cushionImg,
        to: '/category/cushion',
      },
      {
        id: 'cushion-heart',
        name: 'Heart Cushion',
        imageUrl: heartCushionImg,
        to: '/shop?category=cushion&search=Heart',
      },
      {
        id: 'cushion-couple',
        name: 'Couple Cushion',
        imageUrl: coupleFriendshipImg,
        to: '/shop?category=cushion&search=Couple',
      },
    ],
  },
  {
    id: 'gift-boxes-hampers',
    name: 'Gift Boxes & Hampers',
    shortLabel: 'Gift Boxes & Hampers',
    iconImage: surpriseBoxImg,
    shopAllTo: '/category/gift-box',
    subcategories: [
      {
        id: 'box-birthday',
        name: 'Birthday Gift Box',
        imageUrl: occasionBirthdayImg,
        to: '/shop?category=gift-box&occasion=Birthday',
      },
      {
        id: 'box-couple-hamper',
        name: 'Couple Gift Hamper',
        imageUrl: giftBoxImg,
        to: '/shop?category=gift-box&occasion=Couple',
      },
      {
        id: 'box-surprise',
        name: 'Surprise Gift Box',
        imageUrl: surpriseBoxImg,
        to: '/category/gift-box',
      },
      {
        id: 'box-personalized',
        name: 'Personalized Gift Hamper',
        imageUrl: specialOccasionImg,
        to: '/shop?category=gift-box&search=Hamper',
      },
    ],
  },
  {
    id: 'gift-bags',
    name: 'Gift Bags',
    shortLabel: 'Gift Bags',
    iconImage: giftBagImg,
    shopAllTo: '/category/gift-bag',
    subcategories: [
      {
        id: 'bag-premium',
        name: 'Premium Gift Bags',
        imageUrl: giftBagImg,
        to: '/category/gift-bag',
      },
      {
        id: 'bag-paper',
        name: 'Paper Gift Bags',
        imageUrl: handmadeGiftImg,
        to: '/shop?category=gift-bag&search=Paper',
      },
    ],
  },
  {
    id: 'home-decor-gifts',
    name: 'Home Decor Gifts',
    shortLabel: 'Home Decor Gifts',
    iconImage: homeDecorImg,
    shopAllTo: '/category/home-decor-gifts',
    subcategories: [
      {
        id: 'decor-lamps',
        name: 'Decorative Lamps',
        imageUrl: moonLampImg,
        to: '/shop?category=home-decor-gifts&search=Lamp',
      },
      {
        id: 'decor-personalized',
        name: 'Personalized Home Decor',
        imageUrl: homeDecorImg,
        to: '/category/home-decor-gifts',
      },
      {
        id: 'decor-showpieces',
        name: 'Decorative Showpieces',
        imageUrl: stationeryDecorImg,
        to: '/shop?category=home-decor-gifts&search=Showpiece',
      },
    ],
  },
  {
    id: 'kitchen-gifts',
    name: 'Kitchen Gifts',
    shortLabel: 'Kitchen Gifts',
    iconImage: kitchenGiftsImg,
    shopAllTo: '/shop?search=Kitchen',
    subcategories: [
      {
        id: 'kitchen-accessories',
        name: 'Kitchen Accessories',
        imageUrl: kitchenGiftsImg,
        to: '/shop?search=Kitchen%20Accessories',
      },
      {
        id: 'kitchen-personalized',
        name: 'Personalized Kitchen Gifts',
        imageUrl: coffeeMugImg,
        to: '/shop?search=Personalized%20Kitchen',
      },
      {
        id: 'kitchen-sets',
        name: 'Kitchen Gift Sets',
        imageUrl: surpriseBoxImg,
        to: '/shop?search=Kitchen%20Gift%20Set',
      },
    ],
  },
];

const SPECIAL_COLLECTIONS: SubcategoryCardItem[] = [
  {
    id: 'special-couple',
    name: 'Couple Gifts',
    imageUrl: OCCASION_ICONS.couple,
    to: '/shop?occasion=Couple',
  },
  {
    id: 'special-friendship',
    name: 'Friendship Gifts',
    imageUrl: OCCASION_ICONS.friendship,
    to: '/shop?occasion=Friendship',
  },
];

const SHOP_BY_OCCASION: SubcategoryCardItem[] = [
  {
    id: 'occ-birthday',
    name: 'Birthday',
    imageUrl: occasionBirthdayImg,
    to: '/shop?occasion=Birthday',
  },
  {
    id: 'occ-anniversary',
    name: 'Anniversary',
    imageUrl: occasionAnniversaryImg,
    to: '/shop?occasion=Anniversary',
  },
  {
    id: 'occ-valentine',
    name: "Valentine's Day",
    imageUrl: occasionRomanticImg,
    to: '/shop?occasion=Couple',
  },
  {
    id: 'occ-festive',
    name: 'Festive',
    imageUrl: occasionFestiveImg,
    to: '/shop?occasion=Festival',
  },
  {
    id: 'occ-special-moments',
    name: 'Special Moments',
    imageUrl: specialOccasionImg,
    to: '/shop?occasion=Special%20Occasion',
  },
];

export function MobileCategoriesPage() {
  const navigate = useNavigate();
  const [activeCategoryId, setActiveCategoryId] =
    useState<SidebarCategoryId>('all-gifts');
  const [searchQuery, setSearchQuery] = useState('');
  const rightContentRef = useRef<HTMLDivElement | null>(null);

  const activeCategory =
    SIDEBAR_CATEGORIES.find((cat) => cat.id === activeCategoryId) ??
    SIDEBAR_CATEGORIES[0];

  const mainCategories = SIDEBAR_CATEGORIES.filter(
    (cat) => cat.id !== 'all-gifts'
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      navigate('/search');
      return;
    }
    navigate(`/search?search=${encodeURIComponent(trimmed)}`);
  }

  function handleSelectCategory(id: SidebarCategoryId) {
    setActiveCategoryId(id);
    if (rightContentRef.current) {
      const rect = rightContentRef.current.getBoundingClientRect();
      if (rect.top < 110) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + rect.top - 116),
          behavior: 'smooth',
        });
      }
    }
  }

  return (
    <div className="min-h-[calc(100dvh-132px)] w-full overflow-x-clip bg-white">
      {/* Top Search Bar Section (Directly beneath MobileHeader) */}
      <div className="border-b border-[#EFE3FF] bg-gradient-to-b from-[#FAF5FF] to-white px-3 py-2.5">
        <form
          onSubmit={handleSearchSubmit}
          className="flex h-[42px] w-full items-center gap-2.5 rounded-full border border-[#EBD8FF] bg-white px-3.5 shadow-[0_3px_12px_rgba(106,17,203,0.08)] focus-within:border-[#6A11CB]/50 focus-within:ring-2 focus-within:ring-[#6A11CB]/15"
        >
          <Search className="h-[18px] w-[18px] shrink-0 text-[#6A11CB] stroke-[2.2]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for Gifts, Products & More..."
            aria-label="Search for Gifts, Products & More"
            className="h-full w-full min-w-0 bg-transparent text-[13px] font-medium text-[#2B0B4E] placeholder:text-[#7E6B95] focus:outline-none"
          />
        </form>
      </div>

      {/* Main Split Layout: Left Vertical Sidebar + Right Subcategory Grid */}
      <div className="flex w-full items-start">
        {/* Left Vertical Category Sidebar (Exact 10 Categories) */}
        <aside
          aria-label="Gift Categories"
          className="sticky top-[56px] max-h-[calc(100dvh-134px)] w-[86px] shrink-0 overflow-y-auto border-r border-[#E8D7FF] bg-[#F5ECFF] pb-6 pt-1 no-scrollbar min-[390px]:w-[94px] min-[420px]:w-[100px]"
        >
          <ul className="flex flex-col">
            {SIDEBAR_CATEGORIES.map((category) => {
              const isActive = category.id === activeCategoryId;
              return (
                <li key={category.id} className="relative">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(category.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`relative flex w-full flex-col items-center gap-1.5 px-1.5 py-2.5 text-center transition-colors duration-200 ${
                      isActive
                        ? 'bg-white text-[#6A11CB]'
                        : 'text-[#3B1E5C] active:bg-[#EDE0FF]/80'
                    }`}
                  >
                    {/* Active Purple Indicator Bar */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-1.5 bottom-1.5 w-[3.5px] rounded-r-full transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-b from-[#6A11CB] to-[#FF4D8D] opacity-100'
                          : 'opacity-0'
                      }`}
                    />

                    {/* Category Thumbnail */}
                    <div
                      className={`h-10 w-10 overflow-hidden rounded-xl border bg-white transition-all duration-200 min-[390px]:h-11 min-[390px]:w-11 ${
                        isActive
                          ? 'border-[#6A11CB]/45 shadow-[0_3px_10px_rgba(106,17,203,0.16)]'
                          : 'border-[#E6D3FF]/90 shadow-[0_1px_4px_rgba(43,11,78,0.06)]'
                      }`}
                    >
                      <img
                        src={category.iconImage}
                        alt={category.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Category Label */}
                    <span
                      className={`line-clamp-2 w-full px-0.5 text-[10px] leading-[1.22] tracking-[-0.01em] min-[390px]:text-[10.5px] ${
                        isActive ? 'font-bold text-[#6A11CB]' : 'font-semibold text-[#3B1E5C]'
                      }`}
                    >
                      {category.shortLabel}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Right Category Content Area */}
        <section
          ref={rightContentRef}
          aria-live="polite"
          className="min-w-0 flex-1 bg-white px-2.5 pb-6 pt-2.5 min-[390px]:px-3"
        >
          {/* Compact Top Promotional Category Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6A11CB] via-[#9C27B0] to-[#FF4D8D] px-3.5 py-3 text-white shadow-[0_6px_18px_rgba(106,17,203,0.2)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-5 -top-6 h-24 w-24 rounded-full bg-white/15 blur-xl"
            />
            <div className="relative z-10 flex items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <h1 className="text-[14px] font-extrabold leading-[1.2] tracking-[-0.01em] text-white min-[390px]:text-[15px]">
                  Explore All Gift Categories
                </h1>
                <p className="mt-1 text-[11px] font-medium leading-[1.35] text-white/90 min-[390px]:text-[11.5px]">
                  Find the perfect gift for every occasion.
                </p>
              </div>
              <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-xl border border-white/30 bg-white/15 shadow-sm min-[390px]:h-[68px] min-[390px]:w-[68px]">
                <img
                  src={figmaHeroGiftBoxesImg}
                  alt="GiftKart Gift Boxes"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Subcategory / Category Grid Content */}
          <div
            key={activeCategory.id}
            className="mt-3.5 space-y-5 transition-opacity duration-200"
          >
            {activeCategory.id === 'all-gifts' ? (
              /* ALL GIFTS VIEW: All 9 Main Gift Categories in a Clean 2-Column Grid */
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-[13.5px] font-extrabold text-[#2B0B4E] min-[390px]:text-[14px]">
                      All Gift Categories
                    </h2>
                  </div>
                  <Link
                    to="/shop"
                    className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-[#6A11CB] active:text-[#FF4D8D]"
                  >
                    <span>Shop All</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 min-[390px]:gap-2.5">
                  {mainCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[#EFE3FF] bg-[#FCFAFF] p-1.5 text-left shadow-[0_2px_8px_rgba(106,17,203,0.05)] transition-all duration-150 active:scale-[0.98] active:border-[#6A11CB]/40"
                    >
                      <div className="aspect-square w-full overflow-hidden rounded-xl bg-white">
                        <img
                          src={cat.iconImage}
                          alt={cat.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1 px-1 pb-0.5 pt-2">
                        <span className="line-clamp-2 text-[11.5px] font-bold leading-[1.25] text-[#2B0B4E] min-[390px]:text-[12px]">
                          {cat.name}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]/70" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* SELECTED CATEGORY VIEW: 2-Column Subcategory Image Grid */
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <h2 className="truncate text-[13.5px] font-extrabold text-[#2B0B4E] min-[390px]:text-[14.5px]">
                    {activeCategory.name}
                  </h2>
                  <Link
                    to={activeCategory.shopAllTo}
                    className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-[#6A11CB] active:text-[#FF4D8D]"
                  >
                    <span>View All</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 min-[390px]:gap-2.5">
                  {activeCategory.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={sub.to}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[#EFE3FF] bg-[#FCFAFF] p-1.5 shadow-[0_2px_8px_rgba(106,17,203,0.05)] transition-all duration-150 active:scale-[0.98] active:border-[#6A11CB]/40"
                    >
                      <div className="aspect-square w-full overflow-hidden rounded-xl bg-white">
                        <img
                          src={sub.imageUrl}
                          alt={sub.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1 px-1 pb-0.5 pt-2">
                        <span className="line-clamp-2 text-[11.5px] font-bold leading-[1.25] text-[#2B0B4E] min-[390px]:text-[12px]">
                          {sub.name}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]/70" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Dedicated Section: Special Collections (Separate from 10-item Main Sidebar) */}
            <div className="border-t border-[#F0E4FF] pt-4">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-extrabold text-[#2B0B4E] min-[390px]:text-[13.5px]">
                  Special Collections
                </h2>
                <span className="text-[10.5px] font-semibold text-[#FF4D8D]">
                  Curated Picks
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 min-[390px]:gap-2.5">
                {SPECIAL_COLLECTIONS.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#F3D9EE] bg-gradient-to-b from-[#FFF7FB] to-[#FAF4FF] p-1.5 shadow-[0_2px_8px_rgba(255,77,141,0.06)] transition-all duration-150 active:scale-[0.98]"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-white p-1.5">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full rounded-lg object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1 px-1 pb-0.5 pt-2">
                      <span className="line-clamp-1 text-[11.5px] font-bold text-[#2B0B4E] min-[390px]:text-[12px]">
                        {item.name}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#FF4D8D]" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Dedicated Section: Shop by Occasion (Separate from 10-item Main Sidebar) */}
            <div className="border-t border-[#F0E4FF] pt-4">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-extrabold text-[#2B0B4E] min-[390px]:text-[13.5px]">
                  Shop by Occasion
                </h2>
                <Link
                  to="/shop"
                  className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-[#6A11CB]"
                >
                  <span>Explore</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2 min-[390px]:gap-2.5">
                {SHOP_BY_OCCASION.map((occ) => (
                  <Link
                    key={occ.id}
                    to={occ.to}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#EFE3FF] bg-[#FCFAFF] p-1.5 shadow-[0_2px_8px_rgba(106,17,203,0.05)] transition-all duration-150 active:scale-[0.98]"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-white">
                      <img
                        src={occ.imageUrl}
                        alt={occ.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1 px-1 pb-0.5 pt-2">
                      <span className="line-clamp-1 text-[11.5px] font-bold text-[#2B0B4E] min-[390px]:text-[12px]">
                        {occ.name}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]/70" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
