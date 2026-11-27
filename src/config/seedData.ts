import type { Category, GiftWrapConfig, StoreSettings } from '../types';

export const ALL_GIFTS_CATEGORY_ID = 'cat-all-gifts';

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-all-gifts',
    slug: 'all-gifts',
    name: 'All Gifts',
    description:
      'Explore every personalized and curated gift collection across GiftKart.',
    imageUrl:
      '/assets/aistudio/Glossy_Purple_Gift_Box_with_Golden_Bow-edited_09de3fec.webp',
    sortOrder: 1,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-photo-frame',
    slug: 'photo-frame',
    name: 'Photo Frame',
    description:
      'Memory frames across Normal, LED Lighting, Stone Print, Crystal, Collage, Wooden, and Acrylic finishes.',
    imageUrl:
      '/assets/aistudio/Romantic_Framed_Couple_on_Golden_Pedestal_ac3f2968.webp',
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
    description:
      'Custom ceramic, magic heat-reveal, photo, couple, and name-printed coffee mugs.',
    imageUrl: '/assets/aistudio/Festive_Red_Ribbon_Coffee_Mug_195c9bba.webp',
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
    description:
      'Custom printed T-shirts in Regular, Infinity, Leather Print, Couple, Name, Oversized, and Polo styles.',
    imageUrl:
      '/assets/aistudio/Tropical_Sunset_T-Shirt_on_Golden_Display_cf5d3e8e.webp',
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
    description:
      'Custom wall clocks, tabletop nameplates, photo keepsakes, and home decor accents.',
    imageUrl:
      '/assets/aistudio/Warm_Buddha_Moonlight_Decor_Display_c24a114f.webp',
    sortOrder: 5,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-hand-made',
    slug: 'hand-made',
    name: 'Hand Made',
    description:
      'Artisan explosion boxes, scrapbook albums, and handcrafted personalized keepsakes.',
    imageUrl: '/assets/images/category_handmade_gift_1795289475494.webp',
    sortOrder: 6,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-keychain',
    slug: 'keychain',
    name: 'KeyChain',
    description:
      'Engraved metal, acrylic photo, and wooden monogram keychains.',
    imageUrl:
      '/assets/aistudio/Golden_Pedestal_Keychain_Collection_b507d441.webp',
    sortOrder: 7,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-gifts-bag-box',
    slug: 'gifts-bag-box',
    name: 'Gifts Bag + Box',
    description:
      'Signature rigid presentation gift boxes, hampers, and boutique ribbon gift bags.',
    imageUrl:
      '/assets/aistudio/Luxury_Purple_Valentine_Gift_Hamper_7db1384e.webp',
    sortOrder: 8,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-led-lighting',
    slug: 'led-lighting',
    name: 'LED Lighting',
    description:
      'Custom 3D heart photo lamps, moon lamps, and warm acrylic bedside keepsakes.',
    imageUrl:
      '/assets/aistudio/Romantic_Moonlight_Couple_Lamp_Gift_Set_a4d8a6f1.webp',
    sortOrder: 9,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-pvc-card',
    slug: 'pvc-card',
    name: 'PVC Card',
    description:
      'Custom printed glossy PVC photo cards, wallet keepsake cards, and personalized ID cards.',
    imageUrl: '/assets/images/category_pvc_card_1795608982570.webp',
    sortOrder: 10,
    isActive: true,
    subcategories: [],
  },
];

export const SEED_GIFT_WRAP_CONFIG: GiftWrapConfig = {
  globallyEnabled: true,
  defaultChargeInr: 79,
  maxMessageLength: 220,
  styles: [
    {
      id: 'wrap-lavender-silk',
      name: 'Royal Lavender Silk',
      description:
        'Matte lavender boutique wrap tied with deep purple satin ribbon and wax seal.',
      chargeInr: 79,
      accentColorHex: '#6A11CB',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'wrap-rose-ribbon',
      name: 'Rose Pink Celebration',
      description:
        'Pearl white textured paper layered with vibrant pink silk bow and message card.',
      chargeInr: 99,
      accentColorHex: '#FF4D8D',
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'wrap-white-pearl',
      name: 'Minimal Pearl White',
      description:
        'Crisp cotton-finish white wrap with soft lavender cord and handwritten tag.',
      chargeInr: 59,
      accentColorHex: '#EBD8FF',
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'wrap-festive-foil',
      name: 'Festive Keepsake Foil',
      description:
        'Heavyweight blush-lavender celebration wrap with shimmer bow for milestones.',
      chargeInr: 129,
      accentColorHex: '#9333EA',
      isActive: true,
      sortOrder: 4,
    },
  ],
};

export const OFFICIAL_SUPPORT_EMAIL = 'hello.giftkart@gmail.com';
export const OFFICIAL_SUPPORT_PHONE = '+91 9239505791';
export const OFFICIAL_WHATSAPP_DIGITS = '919239505791';
export const OFFICIAL_WHATSAPP_URL = 'https://wa.me/919239505791';
export const CONTACT_MIGRATION_VERSION = 2;

export const SEED_STORE_SETTINGS: StoreSettings = {
  storeName: 'GiftKart',
  tagline: 'Har Gift Mein Ek Kahani.',
  logoUrl: '',
  maintenanceMode: false,
  currencyCode: 'INR',
  currencySymbol: '₹',
  supportEmail: OFFICIAL_SUPPORT_EMAIL,
  supportPhone: OFFICIAL_SUPPORT_PHONE,
  contactVersion: CONTACT_MIGRATION_VERSION,
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
    instagram: 'https://www.instagram.com/giftkart.online',
    facebook: 'https://www.facebook.com/share/18v7Ev2crP/',
    whatsapp: 'https://wa.me/919239505791',
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
  notifications: [],
};
