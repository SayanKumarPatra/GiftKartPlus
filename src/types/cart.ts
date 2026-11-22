export interface CartItem {
  cartItemId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productSku: string;
  unitPriceInr: number;
  quantity: number;
  selectedVariants: Record<string, string>;
  personalizationDetails: string;
  customPhotoFileName?: string;
  customPhotoPreviewUrl?: string;
  image?: string;
}

export interface CartSummary {
  itemCount: number;
  subtotalInr: number;
  giftWrapChargeInr: number;
  discountInr: number;
  estimatedTotalInr: number;
}
