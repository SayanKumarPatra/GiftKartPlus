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

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  subcategories: Subcategory[];
}

export interface ProductVariantGroup {
  name: string;
  options: string[];
}

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
  stockCount: number;
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
  supportsPersonalization: boolean;
  supportsPhotoUpload?: boolean;
  personalizationPrompt?: string;
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
