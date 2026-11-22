import type { OccasionTag } from './catalog';

export interface DeliveryZone {
  id: string;
  name: string;
  state: string;
  chargeInr: number;
  freeDeliveryAboveInr: number;
  estimatedDays: string;
  isActive: boolean;
}

export type CouponDiscountType = 'PERCENTAGE' | 'FLAT_INR';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  value: number;
  minOrderInr: number;
  maxDiscountInr?: number;
  isActive: boolean;
  createdAt: string;
}

export interface StoreBanner {
  enabled: boolean;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface HeroSlide {
  id: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  occasionTag?: OccasionTag;
  isActive: boolean;
  sortOrder: number;
}

export interface AnnouncementBarConfig {
  enabled: boolean;
  desktopText: string;
  mobileText: string;
  showSupportLink: boolean;
  showTrackOrderLink: boolean;
}

export interface NewsletterConfig {
  enabled: boolean;
  heading: string;
  description: string;
  buttonLabel: string;
}

export interface PageContentConfig {
  aboutHeadline: string;
  aboutStory: string;
  customizationHeadline: string;
  customizationNote: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  area: string;
  deliveryZoneId: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  rating: number;
  comment: string;
  isSampleData: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  currencyCode: 'INR';
  currencySymbol: '₹';
  supportEmail: string;
  supportPhone: string;
  serviceCitiesSummary: string;
  deliveryZones: DeliveryZone[];
  banner: StoreBanner;
  heroSlides: HeroSlide[];
  announcement: AnnouncementBarConfig;
  newsletter: NewsletterConfig;
  pageContent: PageContentConfig;
}
