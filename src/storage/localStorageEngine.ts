import { storeEvents, type StoreEventTopic } from './storeEvents';

export const STORAGE_SCHEMA_VERSION = 'v5';
const STORAGE_PREFIX = `giftkart:${STORAGE_SCHEMA_VERSION}:`;

export const STORAGE_KEYS = {
  CATEGORIES: `${STORAGE_PREFIX}categories`,
  PRODUCTS: `${STORAGE_PREFIX}products`,
  GIFT_WRAP_CONFIG: `${STORAGE_PREFIX}gift_wrap_config`,
  ORDERS: `${STORAGE_PREFIX}orders`,
  COUPONS: `${STORAGE_PREFIX}coupons`,
  STORE_SETTINGS: `${STORAGE_PREFIX}store_settings`,
  CART_ITEMS: `${STORAGE_PREFIX}cart_items`,
  CART_GIFT_WRAP: `${STORAGE_PREFIX}cart_gift_wrap`,
  WISHLIST_IDS: `${STORAGE_PREFIX}wishlist_ids`,
  CUSTOMER_DEMO_ACCOUNT: `${STORAGE_PREFIX}customer_demo_account`,
  ADMIN_DEMO_SESSION: `${STORAGE_PREFIX}admin_demo_session`,
  SAVED_ADDRESSES: `${STORAGE_PREFIX}saved_addresses`,
  NEWSLETTER_SUBSCRIBERS: `${STORAGE_PREFIX}newsletter_subscribers`,
  PRODUCT_REVIEWS: `${STORAGE_PREFIX}product_reviews`,
  SEEDED_FLAG: `${STORAGE_PREFIX}seeded`,
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[GiftKart Storage] Failed to read "${key}", using fallback.`, err);
    return fallback;
  }
}

export function writeStorage<T>(
  key: string,
  value: T,
  emitTopic?: StoreEventTopic
): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    if (emitTopic) {
      storeEvents.emit(emitTopic);
    }
  } catch (err) {
    console.error(`[GiftKart Storage] Failed to write "${key}".`, err);
  }
}

export function removeStorage(key: string, emitTopic?: StoreEventTopic): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(key);
    if (emitTopic) {
      storeEvents.emit(emitTopic);
    }
  } catch (err) {
    console.error(`[GiftKart Storage] Failed to remove "${key}".`, err);
  }
}

export function clearAllGiftKartStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith('giftkart:')) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  storeEvents.emit('all');
}
