import type {
  Category,
  Coupon,
  DemoOrder,
  GiftWrapConfig,
  HeroSlide,
  Product,
  ProductReview,
  SavedAddress,
  StoreSettings,
} from '../types';
import { STUDIO_MEDIA } from '../config/appConfig';
import { STORAGE_KEYS, readStorage, writeStorage } from '../storage/localStorageEngine';

export const ALL_GIFTS_CATEGORY_ID = 'cat-all-gifts';

/**
 * Exact 10 official GiftKart categories in mandated display order.
 * Single centralized source synchronized across Storefront & Admin Panel.
 */
export const SEED_CATEGORIES: Category[] = [
  {
    id: ALL_GIFTS_CATEGORY_ID,
    slug: 'all-gifts',
    name: 'All Gifts',
    description: 'Explore every personalized and curated gift collection across GiftKart.',
    imageUrl: '/assets/aistudio/Glossy_Purple_Gift_Box_with_Golden_Bow-edited_09de3fec.png',
    sortOrder: 1,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-photo-frame',
    slug: 'photo-frame',
    name: 'Photo Frame',
    description: 'Memory frames across Normal, LED Lighting, Stone Print, Crystal, Collage, Wooden, and Acrylic finishes.',
    imageUrl: '/assets/aistudio/Romantic_Framed_Couple_on_Golden_Pedestal_ac3f2968.png',
    sortOrder: 2,
    isActive: true,
    subcategories: [
      { id: 'sub-frame-normal', slug: 'normal', name: 'Normal', isActive: true, sortOrder: 1 },
      { id: 'sub-frame-led', slug: 'led-lighting', name: 'LED Lighting', isActive: true, sortOrder: 2 },
      { id: 'sub-frame-stone', slug: 'stone-print', name: 'Stone Print', isActive: true, sortOrder: 3 },
      { id: 'sub-frame-crystal', slug: 'crystal', name: 'Crystal', isActive: true, sortOrder: 4 },
      { id: 'sub-frame-collage', slug: 'collage', name: 'Collage', isActive: true, sortOrder: 5 },
      { id: 'sub-frame-wooden', slug: 'wooden', name: 'Wooden', isActive: true, sortOrder: 6 },
      { id: 'sub-frame-acrylic', slug: 'acrylic', name: 'Acrylic', isActive: true, sortOrder: 7 },
    ],
  },
  {
    id: 'cat-coffee-mugs',
    slug: 'coffee-mugs',
    name: 'Coffee Mugs',
    description: 'Custom ceramic, magic heat-reveal, photo, couple, and name-printed coffee mugs.',
    imageUrl: '/assets/aistudio/Festive_Red_Ribbon_Coffee_Mug_195c9bba.png',
    sortOrder: 3,
    isActive: true,
    subcategories: [
      { id: 'sub-mug-normal', slug: 'normal-mug', name: 'Normal Mug', isActive: true, sortOrder: 1 },
      { id: 'sub-mug-magic', slug: 'magic-mug', name: 'Magic Mug', isActive: true, sortOrder: 2 },
      { id: 'sub-mug-photo', slug: 'photo-mug', name: 'Photo Mug', isActive: true, sortOrder: 3 },
      { id: 'sub-mug-couple', slug: 'couple-mug', name: 'Couple Mug', isActive: true, sortOrder: 4 },
      { id: 'sub-mug-name', slug: 'name-printed', name: 'Name Printed', isActive: true, sortOrder: 5 },
      { id: 'sub-mug-color', slug: 'color-changing', name: 'Color Changing', isActive: true, sortOrder: 6 },
    ],
  },
  {
    id: 'cat-tshirt-prints',
    slug: 't-shirt-prints',
    name: 'T-shirt Prints',
    description: 'Custom printed T-shirts in Regular, Infinity, Leather Print, Couple, Name, Oversized, and Polo styles.',
    imageUrl: '/assets/aistudio/Tropical_Sunset_T-Shirt_on_Golden_Display_cf5d3e8e.png',
    sortOrder: 4,
    isActive: true,
    subcategories: [
      { id: 'sub-tshirt-regular', slug: 'regular', name: 'Regular', isActive: true, sortOrder: 1 },
      { id: 'sub-tshirt-infinity', slug: 'infinity', name: 'Infinity', isActive: true, sortOrder: 2 },
      { id: 'sub-tshirt-leather', slug: 'leather-print', name: 'Leather Print', isActive: true, sortOrder: 3 },
      { id: 'sub-tshirt-couple', slug: 'couple', name: 'Couple', isActive: true, sortOrder: 4 },
      { id: 'sub-tshirt-name', slug: 'name', name: 'Name', isActive: true, sortOrder: 5 },
      { id: 'sub-tshirt-oversized', slug: 'oversized', name: 'Oversized', isActive: true, sortOrder: 6 },
      { id: 'sub-tshirt-polo', slug: 'polo', name: 'Polo', isActive: true, sortOrder: 7 },
    ],
  },
  {
    id: 'cat-home-decor',
    slug: 'home-decor',
    name: 'Home Decor',
    description: 'Custom wall clocks, tabletop nameplates, photo keepsakes, and home decor accents.',
    imageUrl: '/assets/aistudio/Warm_Buddha_Moonlight_Decor_Display_c24a114f.png',
    sortOrder: 5,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-hand-made',
    slug: 'hand-made',
    name: 'Hand Made',
    description: 'Artisan explosion boxes, scrapbook albums, and handcrafted personalized keepsakes.',
    imageUrl: STUDIO_MEDIA.handmadeGift,
    sortOrder: 6,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-keychain',
    slug: 'keychain',
    name: 'KeyChain',
    description: 'Engraved metal, acrylic photo, and wooden monogram keychains.',
    imageUrl: '/assets/aistudio/Golden_Pedestal_Keychain_Collection_b507d441.png',
    sortOrder: 7,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-gifts-bag-box',
    slug: 'gifts-bag-box',
    name: 'Gifts Bag + Box',
    description: 'Signature rigid presentation gift boxes, hampers, and boutique ribbon gift bags.',
    imageUrl: '/assets/aistudio/Luxury_Purple_Valentine_Gift_Hamper_7db1384e.png',
    sortOrder: 8,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-led-lighting',
    slug: 'led-lighting',
    name: 'LED Lighting',
    description: 'Custom 3D heart photo lamps, moon lamps, and warm acrylic bedside keepsakes.',
    imageUrl: '/assets/aistudio/Romantic_Moonlight_Couple_Lamp_Gift_Set_a4d8a6f1.png',
    sortOrder: 9,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-pvc-card',
    slug: 'pvc-card',
    name: 'PVC Card',
    description: 'Custom printed glossy PVC photo cards, wallet keepsake cards, and personalized ID cards.',
    imageUrl: STUDIO_MEDIA.pvcCard,
    sortOrder: 10,
    isActive: true,
    subcategories: [],
  },
];

export const OFFICIAL_CATEGORY_IDS = new Set(SEED_CATEGORIES.map((c) => c.id));

export const LEGACY_CATEGORY_ID_MAP: Record<string, string> = {
  'cat-all-gifts': ALL_GIFTS_CATEGORY_ID,
  'cat-photo-frame': 'cat-photo-frame',
  'cat-customized-photo-gifts': 'cat-photo-frame',
  'cat-coffee-mug': 'cat-coffee-mugs',
  'cat-coffee-mugs': 'cat-coffee-mugs',
  'cat-tshirt-print': 'cat-tshirt-prints',
  'cat-tshirt-prints': 'cat-tshirt-prints',
  'cat-home-decor': 'cat-home-decor',
  'cat-cushions': 'cat-home-decor',
  'cat-customized-stationery': 'cat-home-decor',
  'cat-personalized-accessories': 'cat-home-decor',
  'cat-handmade-gift': 'cat-hand-made',
  'cat-hand-made': 'cat-hand-made',
  'cat-keychain': 'cat-keychain',
  'cat-gift-box': 'cat-gifts-bag-box',
  'cat-gift-bag': 'cat-gifts-bag-box',
  'cat-gifts-bag-box': 'cat-gifts-bag-box',
  'cat-special-occasion': 'cat-gifts-bag-box',
  'cat-couple-friendship': 'cat-gifts-bag-box',
  'cat-unique-chocolates': 'cat-gifts-bag-box',
  'cat-led-lighting': 'cat-led-lighting',
  'cat-pvc-card': 'cat-pvc-card',
};

export function remapLegacyCategoryId(categoryId: string): string {
  if (OFFICIAL_CATEGORY_IDS.has(categoryId)) {
    return categoryId;
  }
  return LEGACY_CATEGORY_ID_MAP[categoryId] ?? 'cat-hand-made';
}

// Strictly empty by default — real data only (no demo products, orders, banners, coupons, addresses, or reviews).
export const SEED_PRODUCTS: Product[] = [];
export const SEED_HERO_SLIDES: HeroSlide[] = [];
export const SEED_COUPONS: Coupon[] = [];
export const SEED_DEMO_ORDERS: DemoOrder[] = [];
export const SEED_SAVED_ADDRESSES: SavedAddress[] = [];
export const SEED_REVIEWS: ProductReview[] = [];

export const SEED_GIFT_WRAP_CONFIG: GiftWrapConfig = {
  globallyEnabled: true,
  defaultChargeInr: 79,
  maxMessageLength: 220,
  styles: [
    {
      id: 'wrap-lavender-silk',
      name: 'Royal Lavender Silk',
      description: 'Matte lavender boutique wrap tied with deep purple satin ribbon and wax seal.',
      chargeInr: 79,
      accentColorHex: '#6A11CB',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'wrap-rose-ribbon',
      name: 'Rose Pink Celebration',
      description: 'Pearl white textured paper layered with vibrant pink silk bow and message card.',
      chargeInr: 99,
      accentColorHex: '#FF4D8D',
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'wrap-white-pearl',
      name: 'Minimal Pearl White',
      description: 'Crisp cotton-finish white wrap with soft lavender cord and handwritten tag.',
      chargeInr: 59,
      accentColorHex: '#EBD8FF',
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'wrap-festive-foil',
      name: 'Festive Keepsake Foil',
      description: 'Heavyweight blush-lavender celebration wrap with shimmer bow for milestones.',
      chargeInr: 129,
      accentColorHex: '#9333EA',
      isActive: true,
      sortOrder: 4,
    },
  ],
};

export const SEED_STORE_SETTINGS: StoreSettings = {
  storeName: 'GiftKart',
  tagline: 'Har Gift Mein Ek Kahani.',
  logoUrl: '',
  maintenanceMode: false,
  currencyCode: 'INR',
  currencySymbol: '₹',
  supportEmail: 'admin.giftkart@gmail.com',
  supportPhone: '+91 9382040746',
  serviceCitiesSummary: 'Jalchak, West Bengal',
  deliveryZones: [
    {
      id: 'zone-jalchak',
      name: 'Jalchak',
      state: 'West Bengal',
      chargeInr: 49,
      freeDeliveryAboveInr: 999,
      estimatedDays: '1–2 business days',
      isActive: true,
    },
  ],
  banner: {
    enabled: true,
    headline: 'Har Gift Mein Ek Kahani.',
    subheadline: 'Personalized gifts crafted with love for Jalchak.',
    ctaLabel: 'Shop Now',
    ctaHref: '/shop',
  },
  heroSlides: [],
  announcement: {
    enabled: true,
    desktopText: 'Delivery in Jalchak • Custom Photo & Name Gifts Available',
    mobileText: 'Serving Jalchak • Personalized Gifts',
    showSupportLink: true,
    showTrackOrderLink: true,
  },
  newsletter: {
    enabled: true,
    heading: 'Stay Connected with GiftKart',
    description:
      'Get new personalized gift ideas, seasonal collections, and launch announcements for Jalchak.',
    buttonLabel: 'Subscribe',
  },
  pageContent: {
    aboutHeadline: 'Har Gift Mein Ek Kahani.',
    aboutStory:
      'GiftKart is an online personalized gift and accessories storefront crafted for Jalchak, West Bengal. Every mug, T-shirt print, illuminated photo frame, and boutique gift hamper is prepared with attention to personal memories.',
    customizationHeadline: 'How GiftKart Customization Works',
    customizationNote:
      'Select your preferred product variant, add your custom name, date, or dedication note, and attach a clear photo preview. Optional boutique gift wrapping and personal message cards can be configured directly in your Gift Bag.',
  },
  socialLinks: {
    instagram: '',
    facebook: '',
    whatsapp: 'https://wa.me/919382040746',
    youtube: '',
  },
  seo: {
    title: 'GiftKart — Har Gift Mein Ek Kahani | Personalized Gift Store',
    description:
      'Shop personalized photo frames, custom coffee mugs, T-shirt prints, LED lighting, handmade gifts, and gift hampers in Jalchak, West Bengal.',
  },
  policies: {
    privacyPolicy:
      'GiftKart collects only the information required to process, personalize, and deliver your orders (such as your name, contact number, email address, delivery address, and uploaded customization photos). Your data is never sold to third parties.',
    termsAndConditions:
      'All customized gift items are produced specifically according to the text, photos, and options submitted at checkout. Please review spelling and image clarity carefully before placing your order.',
    refundPolicy:
      'Non-customized, unused products in original packaging are eligible for return or refund within 7 days of delivery. Personalized or customized items containing customer-uploaded photos, names, or custom text are strictly non-returnable and non-refundable unless damaged on arrival.',
  },
  footerContent: {
    description:
      'Personalized photo frames, custom coffee mugs, printed T-shirts, handmade keepsakes, and curated gift boxes delivered across Jalchak.',
    copyrightText: '© 2026 GiftKart. All rights reserved.',
  },
};

const LEGACY_DEMO_PRODUCT_IDS = new Set<string>([
  'prod-magic-mug-01',
  'prod-led-lamp-07',
  'prod-frame-collage-05',
  'prod-tshirt-couple-03',
  'prod-giftbox-hamper-09',
  'prod-couple-mug-02',
  'prod-tshirt-oversized-04',
  'prod-frame-led-06',
  'prod-cushion-08',
  'prod-keychain-11',
  'prod-stationery-10',
  'prod-accessories-12',
]);

const LEGACY_DEMO_ORDER_IDS = new Set<string>(['ord-demo-1001', 'ord-demo-1002']);
const LEGACY_DEMO_COUPON_IDS = new Set<string>(['cpn-kahani10', 'cpn-gift100']);
const LEGACY_DEMO_ADDRESS_IDS = new Set<string>(['addr-jalchak-1', 'addr-jalchak-2']);
const LEGACY_DEMO_REVIEW_IDS = new Set<string>(['rev-sample-1', 'rev-sample-2']);
const LEGACY_DEMO_SLIDE_IDS = new Set<string>([
  'slide-welcome',
  'slide-perfect-gift',
  'slide-birthday-collection',
  'slide-romantic-showcase',
]);

const OBSOLETE_LEGACY_CATEGORY_IDS = new Set<string>([
  'cat-coffee-mug',
  'cat-tshirt-print',
  'cat-gift-box',
  'cat-gift-bag',
  'cat-handmade-gift',
  'cat-cushions',
  'cat-personalized-accessories',
  'cat-customized-stationery',
  'cat-couple-friendship',
  'cat-customized-photo-gifts',
  'cat-special-occasion',
  'cat-unique-chocolates',
]);

function runCategoryMigrationV2IfNeeded(): void {
  const alreadyMigrated = readStorage<boolean>(
    STORAGE_KEYS.CATEGORY_MIGRATION_V2,
    false
  );
  const storedCategories = readStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  const hasObsoleteCategories = storedCategories.some((c) =>
    OBSOLETE_LEGACY_CATEGORY_IDS.has(c.id)
  );

  if (alreadyMigrated && !hasObsoleteCategories && storedCategories.length === SEED_CATEGORIES.length) {
    return;
  }

  writeStorage(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);

  const storedProducts = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  let productsChanged = false;
  const migratedProducts = storedProducts.map((product) => {
    const mappedCategoryId = remapLegacyCategoryId(product.categoryId);
    if (mappedCategoryId !== product.categoryId) {
      productsChanged = true;
      return {
        ...product,
        categoryId: mappedCategoryId,
      };
    }
    return product;
  });

  if (productsChanged) {
    writeStorage(STORAGE_KEYS.PRODUCTS, migratedProducts);
  }

  writeStorage(STORAGE_KEYS.CATEGORY_MIGRATION_V2, true);
}

/**
 * One-time migration that removes ONLY legacy hardcoded demo records
 * while preserving 100% of real admin/customer created data and the 10 official categories.
 */
function runRealDataCleanupV3IfNeeded(): void {
  const alreadyCleaned = readStorage<boolean>(STORAGE_KEYS.REAL_DATA_CLEANUP_V3, false);
  if (alreadyCleaned) {
    return;
  }

  const products = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  writeStorage(
    STORAGE_KEYS.PRODUCTS,
    products.filter((p) => !LEGACY_DEMO_PRODUCT_IDS.has(p.id))
  );

  const orders = readStorage<DemoOrder[]>(STORAGE_KEYS.ORDERS, []);
  writeStorage(
    STORAGE_KEYS.ORDERS,
    orders.filter((o) => !LEGACY_DEMO_ORDER_IDS.has(o.id))
  );

  const coupons = readStorage<Coupon[]>(STORAGE_KEYS.COUPONS, []);
  writeStorage(
    STORAGE_KEYS.COUPONS,
    coupons.filter((c) => !LEGACY_DEMO_COUPON_IDS.has(c.id))
  );

  const addresses = readStorage<SavedAddress[]>(STORAGE_KEYS.SAVED_ADDRESSES, []);
  writeStorage(
    STORAGE_KEYS.SAVED_ADDRESSES,
    addresses.filter((a) => !LEGACY_DEMO_ADDRESS_IDS.has(a.id))
  );

  const reviews = readStorage<ProductReview[]>(STORAGE_KEYS.PRODUCT_REVIEWS, []);
  writeStorage(
    STORAGE_KEYS.PRODUCT_REVIEWS,
    reviews.filter((r) => !LEGACY_DEMO_REVIEW_IDS.has(r.id) && !r.isSampleData)
  );

  const storedSettings = readStorage<StoreSettings | null>(
    STORAGE_KEYS.STORE_SETTINGS,
    null
  );
  if (storedSettings) {
    const cleanedSlides = Array.isArray(storedSettings.heroSlides)
      ? storedSettings.heroSlides.filter((s) => !LEGACY_DEMO_SLIDE_IDS.has(s.id))
      : [];

    writeStorage(STORAGE_KEYS.STORE_SETTINGS, {
      ...SEED_STORE_SETTINGS,
      ...storedSettings,
      supportEmail:
        storedSettings.supportEmail === 'demo@giftkart.in'
          ? SEED_STORE_SETTINGS.supportEmail
          : storedSettings.supportEmail,
      heroSlides: cleanedSlides,
      socialLinks: {
        ...SEED_STORE_SETTINGS.socialLinks!,
        ...(storedSettings.socialLinks ?? {}),
      },
      seo: {
        ...SEED_STORE_SETTINGS.seo!,
        ...(storedSettings.seo ?? {}),
      },
      policies: {
        ...SEED_STORE_SETTINGS.policies!,
        ...(storedSettings.policies ?? {}),
      },
      footerContent: {
        ...SEED_STORE_SETTINGS.footerContent!,
        ...(storedSettings.footerContent ?? {}),
      },
    });
  } else {
    writeStorage(STORAGE_KEYS.STORE_SETTINGS, SEED_STORE_SETTINGS);
  }

  writeStorage(STORAGE_KEYS.REAL_DATA_CLEANUP_V3, true, 'all');
}

export function ensureDemoSeedHydrated(): void {
  const alreadySeeded = readStorage<boolean>(STORAGE_KEYS.SEEDED_FLAG, false);
  if (alreadySeeded) {
    runCategoryMigrationV2IfNeeded();
    runRealDataCleanupV3IfNeeded();
    return;
  }

  writeStorage(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
  writeStorage(STORAGE_KEYS.PRODUCTS, []);
  writeStorage(STORAGE_KEYS.GIFT_WRAP_CONFIG, SEED_GIFT_WRAP_CONFIG);
  writeStorage(STORAGE_KEYS.STORE_SETTINGS, SEED_STORE_SETTINGS);
  writeStorage(STORAGE_KEYS.COUPONS, []);
  writeStorage(STORAGE_KEYS.ORDERS, []);
  writeStorage(STORAGE_KEYS.SAVED_ADDRESSES, []);
  writeStorage(STORAGE_KEYS.PRODUCT_REVIEWS, []);
  writeStorage(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, []);
  writeStorage(STORAGE_KEYS.REGISTERED_CUSTOMERS, []);
  writeStorage(STORAGE_KEYS.CATEGORY_MIGRATION_V2, true);
  writeStorage(STORAGE_KEYS.REAL_DATA_CLEANUP_V3, true);
  writeStorage(STORAGE_KEYS.SEEDED_FLAG, true);
}

export function resetAllDemoSeedData(): void {
  writeStorage(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES, 'catalog');
  writeStorage(STORAGE_KEYS.PRODUCTS, [], 'catalog');
  writeStorage(STORAGE_KEYS.GIFT_WRAP_CONFIG, SEED_GIFT_WRAP_CONFIG, 'giftWrap');
  writeStorage(STORAGE_KEYS.STORE_SETTINGS, SEED_STORE_SETTINGS, 'settings');
  writeStorage(STORAGE_KEYS.COUPONS, [], 'coupons');
  writeStorage(STORAGE_KEYS.ORDERS, [], 'orders');
  writeStorage(STORAGE_KEYS.SAVED_ADDRESSES, [], 'community');
  writeStorage(STORAGE_KEYS.PRODUCT_REVIEWS, [], 'community');
  writeStorage(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, [], 'community');
  writeStorage(STORAGE_KEYS.REGISTERED_CUSTOMERS, [], 'customers');
  writeStorage(STORAGE_KEYS.CATEGORY_MIGRATION_V2, true);
  writeStorage(STORAGE_KEYS.REAL_DATA_CLEANUP_V3, true);
  writeStorage(STORAGE_KEYS.SEEDED_FLAG, true, 'all');
}
