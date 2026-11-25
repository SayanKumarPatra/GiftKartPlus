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
import { HERO_BANNERS, STUDIO_MEDIA } from '../config/appConfig';
import { STORAGE_KEYS, readStorage, writeStorage } from '../storage/localStorageEngine';

const SEED_TIMESTAMP = '2026-11-15T10:00:00.000Z';

export const ALL_GIFTS_CATEGORY_ID = 'cat-all-gifts';

/**
 * Exact 10 official GiftKart categories in mandated display order.
 * Single centralized seed source synchronized across Storefront & Admin Panel.
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

/**
 * Maps obsolete legacy category IDs safely onto the new 10 official categories
 * so no existing or admin-created product is ever lost or orphaned.
 */
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

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-magic-mug-01',
    slug: 'personalized-photo-magic-mug',
    sku: 'GK-MUG-MG01',
    name: 'Personalized Photo Magic Mug',
    shortDescription: 'Heat-reactive ceramic mug that reveals your hidden photo & quote with warm coffee or tea.',
    description: 'Crafted from 330ml AAA-grade glossy ceramic, our Personalized Photo Magic Mug unveils your cherished photograph and custom message cleanly when filled with a hot beverage.',
    priceInr: 349,
    compareAtPriceInr: 499,
    categoryId: 'cat-coffee-mugs',
    subcategoryId: 'sub-mug-magic',
    occasionTags: ['Birthday', 'Anniversary', 'Friendship', 'Special Occasion'],
    images: [STUDIO_MEDIA.coffeeMug, STUDIO_MEDIA.heroPersonalized],
    variants: [
      { name: 'Capacity', options: ['330 ml Standard', '400 ml Tall'] },
      { name: 'Handle Style', options: ['Classic C-Handle', 'Heart Handle'] },
    ],
    stockCount: 42,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
    personalizationPrompt: 'Enter custom name or quote printed on the mug',
    sampleRating: 4.8,
    sampleReviewCount: 36,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-led-lamp-07',
    slug: '3d-led-heart-photo-lamp',
    sku: 'GK-LED-MN07',
    name: '3D LED Heart Photo Lamp',
    shortDescription: 'Warm glowing engraved acrylic heart lamp resting on a handcrafted wooden base.',
    description: 'Turn your favorite couple or family portrait into a luminous evening centerpiece. Precision laser-engraved on crystal-clear acrylic with an oak wood USB LED base.',
    priceInr: 999,
    compareAtPriceInr: 1399,
    categoryId: 'cat-led-lighting',
    occasionTags: ['Anniversary', 'Couple', 'Birthday', 'Special Occasion'],
    images: [STUDIO_MEDIA.ledLamp, STUDIO_MEDIA.heroPersonalized],
    variants: [
      { name: 'Size', options: ['7 inch Standard', '9 inch Grand'] },
      { name: 'Light Mode', options: ['Warm White', 'Multi-Color Touch'] },
    ],
    stockCount: 18,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
    personalizationPrompt: 'Add couple names & milestone date to engrave',
    sampleRating: 4.9,
    sampleReviewCount: 28,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-frame-collage-05',
    slug: 'custom-collage-photo-frame',
    sku: 'GK-FRM-CL05',
    name: 'Custom Collage Photo Frame',
    shortDescription: 'Multi-opening black & natural wood collage frame curated to showcase four memories.',
    description: 'Hand-assembled matte architectural collage frame with warm oak inner mats and glare-resistant acrylic glass. Ready for tabletop or wall mounting.',
    priceInr: 599,
    compareAtPriceInr: 799,
    categoryId: 'cat-photo-frame',
    subcategoryId: 'sub-frame-collage',
    occasionTags: ['Birthday', 'Anniversary', 'Festival', 'Special Occasion'],
    images: [STUDIO_MEDIA.photoFrame, STUDIO_MEDIA.heroPersonalized],
    variants: [
      { name: 'Frame Size', options: ['10 x 12 inch', '12 x 16 inch'] },
      { name: 'Finish', options: ['Black & Oak', 'Walnut Wood'] },
    ],
    stockCount: 24,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
    personalizationPrompt: 'Enter optional title strip caption for the collage',
    sampleRating: 4.8,
    sampleReviewCount: 21,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-tshirt-couple-03',
    slug: 'couple-printed-tshirt-set',
    sku: 'GK-TSH-CP03',
    name: 'Couple T-Shirt Print (Set of 2)',
    shortDescription: 'Matching 220 GSM bio-washed white cotton couple T-shirts with custom chest print.',
    description: 'Soft, breathable combed cotton couple T-shirt pair finished with vibrant wash-resistant DTF artwork. Tailored comfortably for Jalchak weather.',
    priceInr: 799,
    compareAtPriceInr: 1199,
    categoryId: 'cat-tshirt-prints',
    subcategoryId: 'sub-tshirt-couple',
    occasionTags: ['Couple', 'Anniversary', 'Friendship'],
    images: [STUDIO_MEDIA.tshirtPrint],
    variants: [
      { name: 'His Size', options: ['M', 'L', 'XL', 'XXL'] },
      { name: 'Her Size', options: ['S', 'M', 'L', 'XL'] },
    ],
    stockCount: 34,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
    personalizationPrompt: 'Enter custom text or initials for both T-shirts',
    sampleRating: 4.7,
    sampleReviewCount: 19,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-giftbox-hamper-09',
    slug: 'royal-lavender-keepsake-gift-box',
    sku: 'GK-BOX-RL09',
    name: 'Royal Lavender Keepsake Gift Box',
    shortDescription: 'Signature royal purple & rose satin keepsake box with handmade note cards & trinkets.',
    description: 'Lovingly curated rigid keepsake box lined in blush satin with hand-calligraphed note cards, wooden love charm, and dried lavender accents.',
    priceInr: 1499,
    compareAtPriceInr: 1999,
    categoryId: 'cat-gifts-bag-box',
    occasionTags: ['Birthday', 'Anniversary', 'Festival', 'Special Occasion', 'Return Gifts'],
    images: [STUDIO_MEDIA.giftBox, STUDIO_MEDIA.heroPersonalized],
    variants: [
      { name: 'Box Edition', options: ['Classic Lavender', 'Rose Ribbon Deluxe'] },
    ],
    stockCount: 14,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: false,
    personalizationPrompt: 'Enter name for lid foil tag & keepsake card greeting',
    sampleRating: 4.9,
    sampleReviewCount: 16,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-couple-mug-02',
    slug: 'ek-kahani-couple-mug-set',
    sku: 'GK-MUG-CP02',
    name: 'Ek Kahani Name Printed Couple Mugs',
    shortDescription: 'Paired 330ml glossy ceramic mugs customized with couple names and floral heart art.',
    description: 'Celebrate morning chai and coffee together with matching ceramic mugs featuring crisp dishwasher-safe sublimation prints.',
    priceInr: 599,
    compareAtPriceInr: 799,
    categoryId: 'cat-coffee-mugs',
    subcategoryId: 'sub-mug-couple',
    occasionTags: ['Couple', 'Anniversary', 'Wedding'],
    images: [STUDIO_MEDIA.coffeeMug],
    variants: [
      { name: 'Inner Rim', options: ['Soft Pink', 'Lavender', 'White'] },
    ],
    stockCount: 28,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
    personalizationPrompt: 'Enter both names & date (e.g., Aarav & Meera)',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-tshirt-oversized-04',
    slug: 'signature-oversized-custom-tee',
    sku: 'GK-TSH-OV04',
    name: 'Signature 240 GSM Oversized Print Tee',
    shortDescription: 'Heavyweight dropped-shoulder cotton tee with crisp personalized typography or graphic.',
    description: 'Relaxed modern oversized silhouette crafted in 240 GSM French terry cotton with ultra-crisp custom front & back printing.',
    priceInr: 699,
    compareAtPriceInr: 899,
    categoryId: 'cat-tshirt-prints',
    subcategoryId: 'sub-tshirt-oversized',
    occasionTags: ['Birthday', 'Friendship'],
    images: [STUDIO_MEDIA.tshirtPrint],
    variants: [
      { name: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      { name: 'Color', options: ['Pure White', 'Soft Lavender'] },
    ],
    stockCount: 40,
    isBestSeller: false,
    isFeatured: false,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
    personalizationPrompt: 'Enter custom chest name or back artwork text',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-frame-led-06',
    slug: 'aurora-led-lighting-photo-frame',
    sku: 'GK-FRM-LD06',
    name: 'Aurora LED Lighting Photo Frame',
    shortDescription: 'Illuminated tabletop photo frame bathing your cherished portrait in soft evening light.',
    description: 'Built with a smooth light-diffusing acrylic panel and energy-efficient warm LED array powered by USB.',
    priceInr: 1149,
    compareAtPriceInr: 1499,
    categoryId: 'cat-photo-frame',
    subcategoryId: 'sub-frame-led',
    occasionTags: ['Anniversary', 'Birthday', 'Couple'],
    images: [STUDIO_MEDIA.ledLamp, STUDIO_MEDIA.photoFrame],
    variants: [
      { name: 'Size', options: ['8 x 10 inch', '10 x 12 inch'] },
    ],
    stockCount: 15,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
    personalizationPrompt: 'Enter caption engraved beneath photo',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-cushion-08',
    slug: 'lavender-velvet-photo-cushion',
    sku: 'GK-CSH-LV08',
    name: 'Lavender Velvet Personalized Cushion',
    shortDescription: 'Plush 16x16 inch pastel lavender velvet cushion customized with photo or monogram.',
    description: 'Supremely soft velvet finish with concealed zip and resilient microfiber filler included.',
    priceInr: 549,
    compareAtPriceInr: 749,
    categoryId: 'cat-home-decor',
    occasionTags: ['Birthday', 'Friendship', 'Couple'],
    images: [STUDIO_MEDIA.cushionKeychain],
    variants: [
      { name: 'Shade', options: ['Soft Lavender', 'Blush Pink'] },
    ],
    stockCount: 27,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
    personalizationPrompt: 'Enter name or short greeting to print',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-keychain-11',
    slug: 'engraved-steel-heart-keychain',
    sku: 'GK-KEY-HT11',
    name: 'Engraved Polished Heart Keychain',
    shortDescription: 'Mirror-polished stainless steel heart keychain laser-engraved with initials or date.',
    description: 'Scratch-resistant polished steel keepsake presented inside a soft lavender gift pouch.',
    priceInr: 299,
    compareAtPriceInr: 399,
    categoryId: 'cat-keychain',
    occasionTags: ['Friendship', 'Couple', 'Return Gifts'],
    images: [STUDIO_MEDIA.keychain, STUDIO_MEDIA.cushionKeychain],
    variants: [
      { name: 'Finish', options: ['Mirror Silver', 'Rose Tone'] },
    ],
    stockCount: 55,
    isBestSeller: false,
    isFeatured: false,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: false,
    personalizationPrompt: 'Enter initials or date (up to 16 chars)',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-stationery-10',
    slug: 'monogram-atelier-diary-pen-set',
    sku: 'GK-STN-DP10',
    name: 'Monogram Diary & Rose Pen Gift Set',
    shortDescription: 'Royal plum hardbound diary with gold-foil initials paired with a metallic rose pen.',
    description: 'Designed for executives, writers, and corporate celebrations with 192 ivory fountain-friendly pages and crisp name engraving.',
    priceInr: 899,
    compareAtPriceInr: 1149,
    categoryId: 'cat-home-decor',
    occasionTags: ['Corporate', 'Return Gifts', 'Birthday'],
    images: [STUDIO_MEDIA.stationeryDecor],
    variants: [
      { name: 'Cover Color', options: ['Royal Plum', 'Blush Rose'] },
    ],
    stockCount: 26,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: false,
    personalizationPrompt: 'Enter exact name/initials for gold foil embossing',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-accessories-12',
    slug: 'executive-personalized-desk-combo',
    sku: 'GK-ACC-DK12',
    name: 'Personalized Desk & Accessory Organizer',
    shortDescription: 'Rose-gold metallic pen stand and monogrammed accessory valet for desks & studios.',
    description: 'Clean metallic desk set crafted for corporate gifting, graduations, and new job milestones.',
    priceInr: 749,
    compareAtPriceInr: 949,
    categoryId: 'cat-home-decor',
    occasionTags: ['Corporate', 'Special Occasion'],
    images: [STUDIO_MEDIA.stationeryDecor],
    variants: [
      { name: 'Finish', options: ['Rose Gold', 'Brushed Lavender'] },
    ],
    stockCount: 19,
    isBestSeller: false,
    isFeatured: false,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: false,
    personalizationPrompt: 'Enter name or company mark for engraving',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

export const SEED_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-welcome',
    titlePrefix: 'Welcome to',
    titleHighlight: 'GiftKart',
    subtitle: 'Har Gift Mein Ek Kahani — Personalized & Unique Gifts for Every Occasion',
    ctaLabel: 'Shop Now',
    ctaHref: '/shop',
    imageUrl: HERO_BANNERS.welcome,
    occasionTag: 'Special Occasion',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'slide-perfect-gift',
    titlePrefix: 'Find the',
    titleHighlight: 'Perfect Gift',
    subtitle: 'Curated Gift Boxes, Roses, Teddy Bears, Photo Mugs & LED Keepsakes',
    ctaLabel: 'Explore Gifts',
    ctaHref: '/shop',
    imageUrl: HERO_BANNERS.perfectGift,
    occasionTag: 'Special Occasion',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'slide-birthday-collection',
    titlePrefix: 'Premium',
    titleHighlight: 'Birthday Gifts',
    subtitle: 'LED Photo Frames, Custom Birthday T-Shirts, Mugs, Wallets & Keychains',
    ctaLabel: 'Shop Birthday Gifts',
    ctaHref: '/shop?occasion=Birthday',
    imageUrl: HERO_BANNERS.birthdayCollection,
    occasionTag: 'Birthday',
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'slide-romantic-showcase',
    titlePrefix: 'Romantic &',
    titleHighlight: 'Couple Gifts',
    subtitle: 'Glowing Photo Frames, Heart Lamps, Magic Mugs, Rose Domes & Moon Lamps',
    ctaLabel: 'Shop Couple Gifts',
    ctaHref: '/shop?occasion=Couple',
    imageUrl: HERO_BANNERS.romanticShowcase,
    occasionTag: 'Couple',
    isActive: true,
    sortOrder: 4,
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

/**
 * Initial launch delivery zone strictly limited to Jalchak ONLY.
 * Admin-editable in Store Settings.
 */
export const SEED_STORE_SETTINGS: StoreSettings = {
  storeName: 'GiftKart',
  tagline: 'Har Gift Mein Ek Kahani.',
  currencyCode: 'INR',
  currencySymbol: '₹',
  supportEmail: 'demo@giftkart.in',
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
  heroSlides: SEED_HERO_SLIDES,
  announcement: {
    enabled: true,
    desktopText:
      'Delivery in Jalchak • Customization Available • Demo Orders Only (No COD)',
    mobileText: 'Serving Jalchak | Demo Orders Only',
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
};

export const SEED_COUPONS: Coupon[] = [
  {
    id: 'cpn-kahani10',
    code: 'KAHANI10',
    description: '10% off on personalized orders above ₹799 (up to ₹250)',
    discountType: 'PERCENTAGE',
    value: 10,
    minOrderInr: 799,
    maxDiscountInr: 250,
    isActive: true,
    createdAt: SEED_TIMESTAMP,
  },
  {
    id: 'cpn-gift100',
    code: 'GIFT100',
    description: 'Flat ₹100 off on orders above ₹1,200',
    discountType: 'FLAT_INR',
    value: 100,
    minOrderInr: 1200,
    isActive: true,
    createdAt: SEED_TIMESTAMP,
  },
];

export const SEED_DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'ord-demo-1001',
    orderNumber: 'GK-2026-1001',
    mode: 'DEMO_ORDER',
    customer: {
      fullName: 'Ananya Chatterjee',
      phone: '+91 9382040746',
      email: 'demo@giftkart.in',
      addressLine1: 'Main Road, Near Jalchak Bazar',
      addressLine2: 'Jalchak',
      deliveryZoneId: 'zone-jalchak',
      deliveryZoneNameSnapshot: 'Jalchak',
      city: 'Jalchak',
      state: 'West Bengal',
      pincode: '721155',
    },
    items: [
      {
        productId: 'prod-led-lamp-07',
        productNameSnapshot: '3D LED Heart Photo Lamp',
        productSkuSnapshot: 'GK-LED-MN07',
        unitPriceInrSnapshot: 999,
        quantity: 1,
        lineTotalInr: 999,
        selectedVariants: {
          Size: '7 inch Standard',
          'Light Mode': 'Warm White',
        },
        personalizationDetails: 'Engrave: "Together Always — Ritam & Ananya"',
        imageSnapshot: STUDIO_MEDIA.ledLamp,
      },
    ],
    giftWrap: {
      enabled: true,
      styleId: 'wrap-lavender-silk',
      styleNameSnapshot: 'Royal Lavender Silk',
      chargeInrSnapshot: 79,
      recipientName: 'Ritam Sen',
      giftMessage: 'Five years of laughter, coffee, and endless stories. Happy Anniversary!',
    },
    subtotalInr: 999,
    giftWrapChargeInr: 79,
    discountInr: 100,
    deliveryChargeInr: 0,
    grandTotalInr: 978,
    couponCode: 'KAHANI10',
    paymentMethod: 'Cash on Delivery (COD)',
    paymentGatewayStatus: 'CASHFREE_NOT_CONNECTED',
    fulfillmentStatus: 'Preparing',
    statusHistory: [
      {
        status: 'Demo Placed',
        timestamp: '2026-11-18T09:15:00.000Z',
        note: 'Demo order placed locally (no real payment collected; Cashfree not connected).',
        updatedBy: 'System (Demo Order)',
      },
      {
        status: 'Confirmed',
        timestamp: '2026-11-18T11:30:00.000Z',
        note: 'Order verified and acrylic laser engraving queued.',
        updatedBy: 'Admin',
      },
      {
        status: 'Preparing',
        timestamp: '2026-11-19T08:45:00.000Z',
        note: 'LED lamp assembled and being wrapped in Royal Lavender Silk.',
        updatedBy: 'Admin',
      },
    ],
    createdAt: '2026-11-18T09:15:00.000Z',
    updatedAt: '2026-11-19T08:45:00.000Z',
  },
  {
    id: 'ord-demo-1002',
    orderNumber: 'GK-2026-1002',
    mode: 'DEMO_ORDER',
    customer: {
      fullName: 'Debanjan Mukherjee',
      phone: '+91 9382040746',
      email: 'demo@giftkart.in',
      addressLine1: 'Station Para, Jalchak Market',
      deliveryZoneId: 'zone-jalchak',
      deliveryZoneNameSnapshot: 'Jalchak',
      city: 'Jalchak',
      state: 'West Bengal',
      pincode: '721155',
    },
    items: [
      {
        productId: 'prod-magic-mug-01',
        productNameSnapshot: 'Personalized Photo Magic Mug',
        productSkuSnapshot: 'GK-MUG-MG01',
        unitPriceInrSnapshot: 349,
        quantity: 2,
        lineTotalInr: 698,
        selectedVariants: {
          Capacity: '330 ml Standard',
          'Handle Style': 'Heart Handle',
        },
        personalizationDetails: 'Print: "Best Sister Ever — Jalchak 2026"',
        imageSnapshot: STUDIO_MEDIA.coffeeMug,
      },
    ],
    giftWrap: {
      enabled: true,
      styleId: 'wrap-rose-ribbon',
      styleNameSnapshot: 'Rose Pink Celebration',
      chargeInrSnapshot: 99,
      recipientName: 'Sohini Mukherjee',
      giftMessage: 'Pour hot chai to reveal our favorite Puja memory!',
    },
    subtotalInr: 698,
    giftWrapChargeInr: 99,
    discountInr: 0,
    deliveryChargeInr: 69,
    grandTotalInr: 866,
    paymentMethod: 'Cash on Delivery (COD)',
    paymentGatewayStatus: 'CASHFREE_NOT_CONNECTED',
    fulfillmentStatus: 'Demo Placed',
    statusHistory: [
      {
        status: 'Demo Placed',
        timestamp: '2026-11-20T14:20:00.000Z',
        note: 'Demo order placed locally (no payment collected; Cashfree not connected).',
        updatedBy: 'System (Demo Order)',
      },
    ],
    createdAt: '2026-11-20T14:20:00.000Z',
    updatedAt: '2026-11-20T14:20:00.000Z',
  },
];

export const SEED_SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-jalchak-1',
    label: 'Home — Jalchak',
    fullName: 'Ananya Chatterjee',
    phone: '+91 9382040746',
    email: 'demo@giftkart.in',
    addressLine1: 'Main Road, Near Jalchak Bazar',
    area: 'Jalchak Bazar',
    deliveryZoneId: 'zone-jalchak',
    city: 'Jalchak',
    state: 'West Bengal',
    pincode: '721155',
    isDefault: true,
    createdAt: SEED_TIMESTAMP,
  },
  {
    id: 'addr-jalchak-2',
    label: 'Office — Jalchak',
    fullName: 'Rohan Sen',
    phone: '+91 9382040746',
    email: 'demo@giftkart.in',
    addressLine1: 'Station Para, Near Jalchak High School',
    area: 'Station Para',
    deliveryZoneId: 'zone-jalchak',
    city: 'Jalchak',
    state: 'West Bengal',
    pincode: '721155',
    isDefault: false,
    createdAt: SEED_TIMESTAMP,
  },
];

export const SEED_REVIEWS: ProductReview[] = [
  {
    id: 'rev-sample-1',
    productId: 'prod-magic-mug-01',
    productName: 'Personalized Photo Magic Mug',
    authorName: 'Sample Reviewer (Jalchak)',
    rating: 5,
    comment:
      'Sample preview entry: Illustrates how verified customer reviews will appear once live store orders and review submissions are connected.',
    isSampleData: true,
    isApproved: true,
    createdAt: SEED_TIMESTAMP,
  },
  {
    id: 'rev-sample-2',
    productId: 'prod-led-lamp-07',
    productName: '3D LED Heart Photo Lamp',
    authorName: 'Sample Reviewer (Jalchak)',
    rating: 5,
    comment:
      'Sample preview entry: Demonstrates warm LED lamp feedback layout and star rating display.',
    isSampleData: true,
    isApproved: true,
    createdAt: SEED_TIMESTAMP,
  },
];

const LEGACY_HERO_BANNER_PATHS = new Set<string>([
  '/assets/aistudio/Make_Every_Gift_Special_9ee4a9d3.png',
  '/assets/aistudio/GiftKart_Birthday_Gifting_Celebration_0fecf298.png',
  '/assets/aistudio/Make_Your_Anniversary_Special_5496186d.png',
  '/assets/aistudio/Customized_Photo_Gifts_for_Every_Memory_2fc1ffab.png',
  '/assets/aistudio/GiftKart_Special_Occasion_Gifts_032e3256.png',
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

  if (alreadyMigrated && !hasObsoleteCategories && storedCategories.length > 0) {
    return;
  }

  // 1. Replace cached categories safely with the exact 10 official GiftKart categories
  writeStorage(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);

  // 2. Preserve 100% of existing products while safely remapping obsolete categoryId references
  const storedProducts = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
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

  writeStorage(STORAGE_KEYS.CATEGORY_MIGRATION_V2, true, 'catalog');
}

export function ensureDemoSeedHydrated(): void {
  const alreadySeeded = readStorage<boolean>(STORAGE_KEYS.SEEDED_FLAG, false);
  if (alreadySeeded) {
    // Seamlessly upgrade legacy default hero banners while preserving all other user/store data
    const storedSettings = readStorage<StoreSettings | null>(
      STORAGE_KEYS.STORE_SETTINGS,
      null
    );
    if (
      storedSettings &&
      Array.isArray(storedSettings.heroSlides) &&
      storedSettings.heroSlides.some((s) => LEGACY_HERO_BANNER_PATHS.has(s.imageUrl))
    ) {
      writeStorage(STORAGE_KEYS.STORE_SETTINGS, {
        ...storedSettings,
        heroSlides: SEED_HERO_SLIDES,
      });
    }

    // Safely migrate cached legacy categories -> exact 10 official categories without losing products or orders
    runCategoryMigrationV2IfNeeded();
    return;
  }
  writeStorage(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
  writeStorage(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  writeStorage(STORAGE_KEYS.GIFT_WRAP_CONFIG, SEED_GIFT_WRAP_CONFIG);
  writeStorage(STORAGE_KEYS.STORE_SETTINGS, SEED_STORE_SETTINGS);
  writeStorage(STORAGE_KEYS.COUPONS, SEED_COUPONS);
  writeStorage(STORAGE_KEYS.ORDERS, SEED_DEMO_ORDERS);
  writeStorage(STORAGE_KEYS.SAVED_ADDRESSES, SEED_SAVED_ADDRESSES);
  writeStorage(STORAGE_KEYS.PRODUCT_REVIEWS, SEED_REVIEWS);
  writeStorage(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, []);
  writeStorage(STORAGE_KEYS.CATEGORY_MIGRATION_V2, true);
  writeStorage(STORAGE_KEYS.SEEDED_FLAG, true);
}

export function resetAllDemoSeedData(): void {
  writeStorage(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES, 'catalog');
  writeStorage(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS, 'catalog');
  writeStorage(STORAGE_KEYS.GIFT_WRAP_CONFIG, SEED_GIFT_WRAP_CONFIG, 'giftWrap');
  writeStorage(STORAGE_KEYS.STORE_SETTINGS, SEED_STORE_SETTINGS, 'settings');
  writeStorage(STORAGE_KEYS.COUPONS, SEED_COUPONS, 'coupons');
  writeStorage(STORAGE_KEYS.ORDERS, SEED_DEMO_ORDERS, 'orders');
  writeStorage(STORAGE_KEYS.SAVED_ADDRESSES, SEED_SAVED_ADDRESSES, 'community');
  writeStorage(STORAGE_KEYS.PRODUCT_REVIEWS, SEED_REVIEWS, 'community');
  writeStorage(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, [], 'community');
  writeStorage(STORAGE_KEYS.CATEGORY_MIGRATION_V2, true);
  writeStorage(STORAGE_KEYS.SEEDED_FLAG, true, 'all');
}
