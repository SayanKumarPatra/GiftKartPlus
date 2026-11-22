import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, GiftWrapSelection, GiftWrapStyle, Product } from '../types';
import { STORAGE_KEYS, readStorage, writeStorage } from '../storage/localStorageEngine';

const DEFAULT_GIFT_WRAP: GiftWrapSelection = {
  enabled: false,
  styleId: null,
  styleNameSnapshot: '',
  chargeInrSnapshot: 0,
  recipientName: '',
  giftMessage: '',
};

interface AddToCartOptions {
  quantity?: number;
  selectedVariants?: Record<string, string>;
  personalizationDetails?: string;
  customPhotoFileName?: string;
  customPhotoPreviewUrl?: string;
}

interface CartContextValue {
  items: CartItem[];
  wishlistIds: string[];
  giftWrap: GiftWrapSelection;
  isCartDrawerOpen: boolean;
  itemCount: number;
  subtotalInr: number;
  giftWrapChargeInr: number;
  estimatedTotalInr: number;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (product: Product, options?: AddToCartOptions) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => boolean;
  isWishlisted: (productId: string) => boolean;
  setGiftWrapEnabled: (enabled: boolean, defaultStyle?: GiftWrapStyle) => void;
  selectGiftWrapStyle: (style: GiftWrapStyle) => void;
  updateGiftWrapDetails: (details: Partial<Pick<GiftWrapSelection, 'recipientName' | 'giftMessage'>>) => void;
  resetGiftWrap: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.CART_ITEMS, [])
  );
  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.WISHLIST_IDS, [])
  );
  const [giftWrap, setGiftWrap] = useState<GiftWrapSelection>(() =>
    readStorage<GiftWrapSelection>(STORAGE_KEYS.CART_GIFT_WRAP, DEFAULT_GIFT_WRAP)
  );
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.CART_ITEMS, items);
  }, [items]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.WISHLIST_IDS, wishlistIds);
  }, [wishlistIds]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.CART_GIFT_WRAP, giftWrap);
  }, [giftWrap]);

  const addToCart = useCallback((product: Product, options?: AddToCartOptions) => {
    const qty = Math.max(1, options?.quantity ?? 1);
    const selectedVariants = options?.selectedVariants ?? {};
    const personalizationDetails = (options?.personalizationDetails ?? '').trim();
    const customPhotoFileName = options?.customPhotoFileName;
    const customPhotoPreviewUrl = options?.customPhotoPreviewUrl;
    const signature = `${product.id}::${JSON.stringify(selectedVariants)}::${personalizationDetails}::${customPhotoFileName ?? ''}`;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartItemId === signature);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + qty,
        };
        return next;
      }
      const nextItem: CartItem = {
        cartItemId: signature,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        productSku: product.sku,
        unitPriceInr: product.priceInr,
        quantity: qty,
        selectedVariants,
        personalizationDetails,
        customPhotoFileName,
        customPhotoPreviewUrl,
        image: product.images[0],
      };
      return [...prev, nextItem];
    });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.cartItemId !== cartItemId);
      }
      return prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity } : i
      );
    });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setGiftWrap(DEFAULT_GIFT_WRAP);
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    let added = false;
    setWishlistIds((prev) => {
      if (prev.includes(productId)) {
        added = false;
        return prev.filter((id) => id !== productId);
      }
      added = true;
      return [...prev, productId];
    });
    return added;
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const setGiftWrapEnabled = useCallback((enabled: boolean, defaultStyle?: GiftWrapStyle) => {
    setGiftWrap((prev) => {
      if (!enabled) {
        return { ...prev, enabled: false };
      }
      if (!prev.styleId && defaultStyle) {
        return {
          ...prev,
          enabled: true,
          styleId: defaultStyle.id,
          styleNameSnapshot: defaultStyle.name,
          chargeInrSnapshot: defaultStyle.chargeInr,
        };
      }
      return { ...prev, enabled: true };
    });
  }, []);

  const selectGiftWrapStyle = useCallback((style: GiftWrapStyle) => {
    setGiftWrap((prev) => ({
      ...prev,
      enabled: true,
      styleId: style.id,
      styleNameSnapshot: style.name,
      chargeInrSnapshot: style.chargeInr,
    }));
  }, []);

  const updateGiftWrapDetails = useCallback(
    (details: Partial<Pick<GiftWrapSelection, 'recipientName' | 'giftMessage'>>) => {
      setGiftWrap((prev) => ({ ...prev, ...details }));
    },
    []
  );

  const resetGiftWrap = useCallback(() => {
    setGiftWrap(DEFAULT_GIFT_WRAP);
  }, []);

  const summary = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalInr = items.reduce(
      (sum, item) => sum + item.unitPriceInr * item.quantity,
      0
    );
    const giftWrapChargeInr =
      items.length > 0 && giftWrap.enabled ? giftWrap.chargeInrSnapshot : 0;
    const estimatedTotalInr = subtotalInr + giftWrapChargeInr;
    return { itemCount, subtotalInr, giftWrapChargeInr, estimatedTotalInr };
  }, [items, giftWrap]);

  return (
    <CartContext.Provider
      value={{
        items,
        wishlistIds,
        giftWrap,
        isCartDrawerOpen,
        ...summary,
        openCartDrawer: () => setIsCartDrawerOpen(true),
        closeCartDrawer: () => setIsCartDrawerOpen(false),
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        toggleWishlist,
        isWishlisted,
        setGiftWrapEnabled,
        selectGiftWrapStyle,
        updateGiftWrapDetails,
        resetGiftWrap,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
