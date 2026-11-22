export const BRAND_ASSETS = {
  /** Official upright horizontal GiftKart transparent logo with cart icon + tagline */
  logo: '/assets/aistudio/GiftKart_Gift_Cart_Logo_604a8052.png',
  /** Alternate compact wordmark logo */
  logoCompact: '/assets/aistudio/GiftKart_Pink_and_Purple_Smile_Logo_49bea800.png',
  /** Rounded square brand icon & browser favicon */
  appIcon: '/assets/aistudio/GiftKart__Every_Gift_Tells_a_Story_250c90e4.png',
  /** Transparent 3D Glossy Gift Delivery Cart illustration */
  giftCartIllustration: '/assets/aistudio/Glossy_Pink_Gift_Delivery_Cart_ee9c8cec.png',
  /** Uploaded Service Highlights artwork */
  serviceHighlightsBanner: '/assets/aistudio/GiftKart__Gifts_Made_Special_cd5cac7b.png',
  /** Uploaded Stay Connected Newsletter artwork */
  newsletterBanner: '/assets/aistudio/GiftKart_Newsletter__Gifts_and_Offers_15512993.png',
} as const;

export const HERO_BANNERS = {
  personalized: '/assets/aistudio/Make_Every_Gift_Special_9ee4a9d3.png',
  birthday: '/assets/aistudio/GiftKart_Birthday_Gifting_Celebration_0fecf298.png',
  anniversary: '/assets/aistudio/Make_Your_Anniversary_Special_5496186d.png',
  photoGifts: '/assets/aistudio/Customized_Photo_Gifts_for_Every_Memory_2fc1ffab.png',
  specialOccasion: '/assets/aistudio/GiftKart_Special_Occasion_Gifts_032e3256.png',
} as const;

export const STUDIO_MEDIA = {
  heroPersonalized: '/src/assets/images/hero_personalized_gifts_1795285052149.jpg',
  coffeeMug: '/src/assets/images/product_magic_mug_1795285112764.jpg',
  ledLamp: '/src/assets/images/product_led_lamp_1795285053467.jpg',
  photoFrame: '/src/assets/images/product_photo_frame_1795285052399.jpg',
  tshirtPrint: '/src/assets/images/product_tshirt_print_1795285052582.jpg',
  giftBox: '/src/assets/images/product_gift_box_1795285058123.jpg',
  giftBag: '/src/assets/images/category_gift_bag_1795289466578.jpg',
  handmadeGift: '/src/assets/images/category_handmade_gift_1795289475494.jpg',
  keychain: '/src/assets/images/category_keychain_1795289469540.jpg',
  cushionKeychain: '/src/assets/images/product_cushion_keychain_1795285051802.jpg',
  personalizedAccessories: '/src/assets/images/category_personalized_accessories_1795289467233.jpg',
  homeDecor: '/src/assets/images/category_home_decor_1795289476486.jpg',
  stationeryDecor: '/src/assets/images/product_stationery_decor_1795285052438.jpg',
  coupleFriendship: '/src/assets/images/category_couple_friendship_1795289468022.jpg',
  customizedPhotoGifts: '/src/assets/images/category_customized_photo_gifts_1795295079046.jpg',
  specialOccasionGifts: '/src/assets/images/category_special_occasion_gifts_1795295079395.jpg',
} as const;

export const APP_CONFIG = {
  brandName: 'GiftKart',
  tagline: 'Har Gift Mein Ek Kahani.',
  currency: {
    code: 'INR' as const,
    symbol: '₹' as const,
    locale: 'en-IN' as const,
  },
  officialColors: {
    purple: '#6A11CB',
    pink: '#FF4D8D',
    lavender: '#EBD8FF',
    white: '#FFFFFF',
  },
  launchCities: ['Jalchak'] as const,
  demoNotice:
    'GiftKart is currently operating in Local Demo Mode. Orders are saved locally in browser storage; live payments (Cashfree) and cloud database/auth (Supabase) are prepared as unconnected interfaces.',
} as const;

export const OCCASION_ICONS = {
  birthday: '/assets/aistudio/Colourful_3D_Birthday_Cake_with_Candles_57f0845b.png',
  anniversary: '/assets/aistudio/Romantic_Hearts__Rings_and_Gifts_7e158e6e.png',
  friendship: '/assets/aistudio/Joyful_Friendship_Gift_Box_Duo_3e3be459.png',
  couple: '/assets/aistudio/Romantic_Gift_Box_with_Roses_and_Teddy_Bear_9b0c3b60.png',
  corporate: '/assets/aistudio/Elegant_Corporate_Gift_Collection_b7ecd74b.png',
  returnGifts: '/assets/aistudio/3D_Return_Exchange_Box_with_Arrows_683172ee.png',
  festival: '/assets/aistudio/Diwali_Diya_Gift_Festive_Rangoli_b08cfdb1.png',
  specialOccasion: '/assets/aistudio/Special_Occasion_Gift_Collection_34f498d9.png',
  giftHamper: '/assets/aistudio/Festive_Teddy_Bear_Gift_Hamper_a94efa87.png',
} as const;

export const OFFICIAL_OCCASIONS = [
  {
    id: 'occ-birthday',
    label: 'Birthday Gifts',
    tag: 'Birthday' as const,
    slug: 'birthday',
    iconUrl: OCCASION_ICONS.birthday,
  },
  {
    id: 'occ-anniversary',
    label: 'Anniversary Gifts',
    tag: 'Anniversary' as const,
    slug: 'anniversary',
    iconUrl: OCCASION_ICONS.anniversary,
  },
  {
    id: 'occ-friendship',
    label: 'Friendship Gifts',
    tag: 'Friendship' as const,
    slug: 'friendship',
    iconUrl: OCCASION_ICONS.friendship,
  },
  {
    id: 'occ-couple',
    label: 'Couple Gifts',
    tag: 'Couple' as const,
    slug: 'couple',
    iconUrl: OCCASION_ICONS.couple,
  },
  {
    id: 'occ-corporate',
    label: 'Corporate Gifts',
    tag: 'Corporate' as const,
    slug: 'corporate',
    iconUrl: OCCASION_ICONS.corporate,
  },
  {
    id: 'occ-return',
    label: 'Return Gifts',
    tag: 'Return Gifts' as const,
    slug: 'return-gifts',
    iconUrl: OCCASION_ICONS.returnGifts,
  },
  {
    id: 'occ-festival',
    label: 'Festival Gifts',
    tag: 'Festival' as const,
    slug: 'festival',
    iconUrl: OCCASION_ICONS.festival,
  },
  {
    id: 'occ-special',
    label: 'Special Occasion',
    tag: 'Special Occasion' as const,
    slug: 'special-occasion',
    iconUrl: OCCASION_ICONS.specialOccasion,
  },
] as const;
