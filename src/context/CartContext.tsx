import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CartItem, GiftWrapSelection, GiftWrapStyle, Product } from '../types';
import { STORAGE_KEYS, readStorage, writeStorage } from '../storage/localStorageEngine';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  isSupabaseSchemaMissingError,
} from '../lib/supabase';
import { useAuth } from './AuthContext';

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
  updateGiftWrapDetails: (
    details: Partial<Pick<GiftWrapSelection, 'recipientName' | 'giftMessage'>>
  ) => void;
  resetGiftWrap: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function getAccountWishlistKey(email?: string | null): string | null {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  return `${STORAGE_KEYS.WISHLIST_IDS}:${normalized}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customerAccount } = useAuth();
  const customerId = customerAccount?.id ?? null;
  const wishlistStorageKey = getAccountWishlistKey(customerAccount?.email);

  const [items, setItems] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.CART_ITEMS, [])
  );
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [giftWrap, setGiftWrap] = useState<GiftWrapSelection>(DEFAULT_GIFT_WRAP);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const hydratedRemoteCartForRef = useRef<string | null>(null);
  const cartSyncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.CART_ITEMS, items);
  }, [items]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.CART_GIFT_WRAP, giftWrap);
  }, [giftWrap]);

  // Hydrate wishlist & cart from Supabase for the currently signed-in customer
  useEffect(() => {
    if (!wishlistStorageKey || !customerId) {
      setWishlistIds([]);
      hydratedRemoteCartForRef.current = null;
      return;
    }

    const storedForUser = readStorage<string[]>(wishlistStorageKey, []);
    setWishlistIds(storedForUser);

    if (!isSupabaseConfigured()) return;
    let active = true;

    void (async () => {
      try {
        const client = getSupabaseClient();

        // 1. Hydrate Wishlist
        const { data: wishRows, error: wishErr } = await client
          .from('customer_wishlists')
          .select('product_id')
          .eq('customer_id', customerId);

        if (!active) return;
        if (!wishErr && Array.isArray(wishRows)) {
          const remoteIds = wishRows
            .map((r) => String((r as { product_id?: unknown }).product_id ?? ''))
            .filter(Boolean);
          setWishlistIds(remoteIds);
          writeStorage(wishlistStorageKey, remoteIds);
        } else if (wishErr && !isSupabaseSchemaMissingError(wishErr)) {
          console.warn('[GiftKart] Wishlist hydration skipped:', wishErr.message);
        }

        // 2. Hydrate Persistent Cart (once per logged-in customer)
        if (hydratedRemoteCartForRef.current !== customerId) {
          hydratedRemoteCartForRef.current = customerId;
          const { data: cartRow, error: cartErr } = await client
            .from('customer_carts')
            .select('items, gift_wrap')
            .eq('customer_id', customerId)
            .maybeSingle();

          if (!active) return;
          if (!cartErr && cartRow) {
            const remoteItems = Array.isArray(cartRow.items)
              ? (cartRow.items as CartItem[])
              : [];
            const remoteWrap =
              cartRow.gift_wrap &&
              typeof cartRow.gift_wrap === 'object' &&
              'enabled' in cartRow.gift_wrap
                ? (cartRow.gift_wrap as GiftWrapSelection)
                : null;

            setItems((localItems) =>
              localItems.length === 0 && remoteItems.length > 0 ? remoteItems : localItems
            );
            if (remoteWrap) {
              setGiftWrap((localWrap) =>
                !localWrap.enabled && remoteWrap.enabled ? remoteWrap : localWrap
              );
            }
          }
        }
      } catch {
        // Keep localStorage cache seamlessly
      }
    })();

    return () => {
      active = false;
    };
  }, [wishlistStorageKey, customerId]);

  // Debounce-persist cart + gift wrap to Supabase customer_carts when authenticated
  useEffect(() => {
    if (!customerId || !isSupabaseConfigured() || typeof window === 'undefined') {
      return;
    }
    if (cartSyncTimerRef.current !== null) {
      window.clearTimeout(cartSyncTimerRef.current);
    }
    cartSyncTimerRef.current = window.setTimeout(() => {
      const client = getSupabaseClient();
      void client
        .from('customer_carts')
        .upsert(
          {
            customer_id: customerId,
            items,
            gift_wrap: giftWrap,
          },
          { onConflict: 'customer_id' }
        )
        .then(() => {
          // Synced silently
        });
    }, 450);

    return () => {
      if (cartSyncTimerRef.current !== null) {
        window.clearTimeout(cartSyncTimerRef.current);
      }
    };
  }, [customerId, items, giftWrap]);

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

  const toggleWishlist = useCallback(
    (productId: string) => {
      if (!wishlistStorageKey) {
        return false;
      }
      let added = false;
      setWishlistIds((prev) => {
        const next = prev.includes(productId)
          ? ((added = false), prev.filter((id) => id !== productId))
          : ((added = true), [...prev, productId]);
        writeStorage(wishlistStorageKey, next);

        if (customerId && isSupabaseConfigured()) {
          const client = getSupabaseClient();
          if (added) {
            void client
              .from('customer_wishlists')
              .upsert(
                { customer_id: customerId, product_id: productId },
                { onConflict: 'customer_id,product_id' }
              );
          } else {
            void client
              .from('customer_wishlists')
              .delete()
              .eq('customer_id', customerId)
              .eq('product_id', productId);
          }
        }

        return next;
      });
      return added;
    },
    [wishlistStorageKey, customerId]
  );

  const isWishlisted = useCallback(
    (productId: string) => Boolean(wishlistStorageKey) && wishlistIds.includes(productId),
    [wishlistIds, wishlistStorageKey]
  );

  const setGiftWrapEnabled = useCallback((_enabled: boolean, _defaultStyle?: GiftWrapStyle) => {
    setGiftWrap(DEFAULT_GIFT_WRAP);
  }, []);

  const selectGiftWrapStyle = useCallback((_style: GiftWrapStyle) => {
    setGiftWrap(DEFAULT_GIFT_WRAP);
  }, []);

  const updateGiftWrapDetails = useCallback(
    (_details: Partial<Pick<GiftWrapSelection, 'recipientName' | 'giftMessage'>>) => {
      setGiftWrap(DEFAULT_GIFT_WRAP);
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
    const giftWrapChargeInr = 0;
    const estimatedTotalInr = subtotalInr;
    return { itemCount, subtotalInr, giftWrapChargeInr, estimatedTotalInr };
  }, [items]);

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
