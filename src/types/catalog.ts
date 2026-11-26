export type OccasionTag =
  | 'Birthday'
  | 'Anniversary'
  | 'Friendship'
  | 'Couple'
  | 'Corporate'
  | 'Return Gifts'
  | 'Festival'
  | 'Special Occasion'
  | 'Wedding'
  | 'Thank You';

export interface Subcategory {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export type SupportedLanguage = 'en' | 'bn' | 'hi';

export interface LocalizedEntityText {
  name?: string;
  description?: string;
  shortDescription?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  subcategories: Subcategory[];
  /** Future-ready optional per-language translations (falls back to original name/description when absent) */
  translations?: Partial<Record<SupportedLanguage, LocalizedEntityText>>;
}

export interface ProductVariantGroup {
  name: string;
  options: string[];
}

export type ProductAvailability = 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER';

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string;
  description: string;
  priceInr: number;
  compareAtPriceInr?: number;
  categoryId: string;
  subcategoryId?: string;
  occasionTags: OccasionTag[];
  images: string[];
  variants: ProductVariantGroup[];
  availability?: ProductAvailability;
  stockCount: number;
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
  isArchived?: boolean;
  isSampleOrTest?: boolean;
  supportsPersonalization: boolean;
  supportsPhotoUpload?: boolean;
  personalizationPrompt?: string;
  /** Future-ready optional per-language translations (falls back to original product fields when absent) */
  translations?: Partial<Record<SupportedLanguage, LocalizedEntityText>>;
  /** Sample preview rating only — clearly labeled as sample data until real reviews are wired */
  sampleRating?: number;
  sampleReviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilterParams {
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
  occasion?: OccasionTag;
  bestSellersOnly?: boolean;
  featuredOnly?: boolean;
  customizableOnly?: boolean;
  includeInactive?: boolean;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'newest';
}
