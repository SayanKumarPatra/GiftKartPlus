export const BRAND_ASSETS = {
  /** Official upright horizontal GiftKart transparent logo with cart icon + tagline */
  logo: '/assets/aistudio/GiftKart_Gift_Cart_Logo_604a8052.png',
} as const;

export const STUDIO_MEDIA = {
  coffeeMug: '/assets/images/product_magic_mug_1795285112764.webp',
  photoFrame: '/assets/images/product_photo_frame_1795285052399.webp',
  tshirtPrint: '/assets/images/product_tshirt_print_1795285052582.webp',
  giftBox: '/assets/images/product_gift_box_1795285058123.webp',
  handmadeGift: '/assets/images/category_handmade_gift_1795289475494.webp',
  pvcCard: '/assets/images/category_pvc_card_1795608982570.webp',
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
} as const;
