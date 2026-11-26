import {
  SEED_CATEGORIES,
  SEED_GIFT_WRAP_CONFIG,
  SEED_STORE_SETTINGS,
} from '../data/seedData';
import type {
  AdminActivityLog,
  AdminDemoSession,
  Category,
  Coupon,
  DemoOrder,
  GiftWrapConfig,
  NewsletterSubscriber,
  Product,
  ProductReview,
  RegisteredCustomer,
  StoreSettings,
} from '../types';
import { STORAGE_KEYS } from './localStorageEngine';
import { storeEvents, type StoreEventTopic } from './storeEvents';

export interface LiveStoreSnapshot {
  version: number;
  categories: Category[];
  products: Product[];
  storeSettings: StoreSettings;
  giftWrapConfig: GiftWrapConfig;
  coupons: Coupon[];
  orders: DemoOrder[];
  registeredCustomers: RegisteredCustomer[];
  productReviews: ProductReview[];
  newsletterSubscribers: NewsletterSubscriber[];
  adminActivityLogs: AdminActivityLog[];
}

export type SyncableCollectionKey =
  | 'categories'
  | 'products'
  | 'storeSettings'
  | 'giftWrapConfig'
  | 'coupons'
  | 'orders'
  | 'registeredCustomers'
  | 'productReviews'
  | 'newsletterSubscribers'
  | 'adminActivityLogs';

const liveStore: LiveStoreSnapshot = {
  version: 0,
  categories: SEED_CATEGORIES,
  products: [],
  storeSettings: SEED_STORE_SETTINGS,
  giftWrapConfig: SEED_GIFT_WRAP_CONFIG,
  coupons: [],
  orders: [],
  registeredCustomers: [],
  productReviews: [],
  newsletterSubscribers: [],
  adminActivityLogs: [],
};

// Strictly held in JS memory (never written to localStorage/sessionStorage)
let adminBearerToken: string | null = null;
let cachedAdminSession: AdminDemoSession | null = null;

let initialHydrationPromise: Promise<void> | null = null;
let eventSource: EventSource | null = null;
let reconnectTimer: number | null = null;
let syncStarted = false;
let activeRefreshPromise: Promise<void> | null = null;

export function getAdminBearerToken(): string | null {
  return adminBearerToken;
}

export function setAdminAuthMemory(
  token: string | null,
  session: AdminDemoSession | null
): void {
  adminBearerToken = token;
  cachedAdminSession = session;
}

export function getCachedAdminSession(): AdminDemoSession | null {
  return cachedAdminSession;
}

export function clearAdminAuthMemory(): void {
  adminBearerToken = null;
  cachedAdminSession = null;
}

export function getLiveStore(): LiveStoreSnapshot {
  return liveStore;
}

function purgeLegacyLocalAdminKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.ADMIN_CREDENTIALS);
    window.localStorage.removeItem(STORAGE_KEYS.ADMIN_DEMO_SESSION);
  } catch {
    // Ignore storage cleanup errors in restricted browsers
  }
}

export async function apiRequest<T>(
  url: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    requireAdmin?: boolean;
  }
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options?.requireAdmin) {
    if (!adminBearerToken) {
      throw new Error('Admin sign-in required. Please log in again.');
    }
    headers.Authorization = `Bearer ${adminBearerToken}`;
  }

  const response = await fetch(url, {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  const text = await response.text();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  }

  if (!response.ok) {
    if (response.status === 401 && options?.requireAdmin) {
      clearAdminAuthMemory();
      storeEvents.emit('auth');
    }
    const errMsg =
      typeof parsed.error === 'string' && parsed.error
        ? parsed.error
        : `Request failed (${response.status})`;
    throw new Error(errMsg);
  }

  return parsed as T;
}

const COLLECTION_STORAGE_KEY: Partial<Record<SyncableCollectionKey, string>> = {
  categories: STORAGE_KEYS.CATEGORIES,
  products: STORAGE_KEYS.PRODUCTS,
  storeSettings: STORAGE_KEYS.STORE_SETTINGS,
  giftWrapConfig: STORAGE_KEYS.GIFT_WRAP_CONFIG,
  coupons: STORAGE_KEYS.COUPONS,
  orders: STORAGE_KEYS.ORDERS,
  registeredCustomers: STORAGE_KEYS.REGISTERED_CUSTOMERS,
  productReviews: STORAGE_KEYS.PRODUCT_REVIEWS,
  newsletterSubscribers: STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS,
  adminActivityLogs: STORAGE_KEYS.ADMIN_ACTIVITY_LOGS,
};

function readLocalCollection<K extends SyncableCollectionKey>(
  collection: K
): LiveStoreSnapshot[K] | null {
  if (typeof window === 'undefined') return null;
  const key = COLLECTION_STORAGE_KEY[collection];
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as LiveStoreSnapshot[K];
  } catch {
    return null;
  }
}

function writeLocalCollection<K extends SyncableCollectionKey>(
  collection: K,
  value: LiveStoreSnapshot[K]
): void {
  if (typeof window === 'undefined') return;
  const key = COLLECTION_STORAGE_KEY[collection];
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/private-mode errors when mirroring cache
  }
}

function hydrateFromLocalFallback(): void {
  const localCategories = readLocalCollection('categories');
  const localProducts = readLocalCollection('products');
  const localSettings = readLocalCollection('storeSettings');
  const localGiftWrap = readLocalCollection('giftWrapConfig');
  const localCoupons = readLocalCollection('coupons');
  const localReviews = readLocalCollection('productReviews');
  const localOrders = readLocalCollection('orders');
  const localCustomers = readLocalCollection('registeredCustomers');
  const localSubscribers = readLocalCollection('newsletterSubscribers');
  const localLogs = readLocalCollection('adminActivityLogs');

  mergeAdminData(liveStore.version, {
    categories: localCategories ?? undefined,
    products: localProducts ?? undefined,
    storeSettings: localSettings ?? undefined,
    giftWrapConfig: localGiftWrap ?? undefined,
    coupons: localCoupons ?? undefined,
    productReviews: localReviews ?? undefined,
    orders: localOrders ?? undefined,
    registeredCustomers: localCustomers ?? undefined,
    newsletterSubscribers: localSubscribers ?? undefined,
    adminActivityLogs: localLogs ?? undefined,
  });
}

function mergePublicData(
  version: number,
  data: Partial<LiveStoreSnapshot>
): void {
  liveStore.version = Math.max(liveStore.version, version);
  if (Array.isArray(data.categories) && data.categories.length > 0) {
    liveStore.categories = data.categories;
    writeLocalCollection('categories', liveStore.categories);
  }
  if (Array.isArray(data.products)) {
    liveStore.products = data.products;
    writeLocalCollection('products', liveStore.products);
  }
  if (data.storeSettings && typeof data.storeSettings === 'object') {
    liveStore.storeSettings = {
      ...SEED_STORE_SETTINGS,
      ...data.storeSettings,
      socialLinks: {
        ...SEED_STORE_SETTINGS.socialLinks!,
        ...(data.storeSettings.socialLinks ?? {}),
      },
      seo: {
        ...SEED_STORE_SETTINGS.seo!,
        ...(data.storeSettings.seo ?? {}),
      },
      policies: {
        ...SEED_STORE_SETTINGS.policies!,
        ...(data.storeSettings.policies ?? {}),
      },
      footerContent: {
        ...SEED_STORE_SETTINGS.footerContent!,
        ...(data.storeSettings.footerContent ?? {}),
      },
      notifications: Array.isArray(data.storeSettings.notifications)
        ? data.storeSettings.notifications
        : liveStore.storeSettings.notifications ?? [],
    };
    writeLocalCollection('storeSettings', liveStore.storeSettings);
  }
  if (data.giftWrapConfig && typeof data.giftWrapConfig === 'object') {
    liveStore.giftWrapConfig = {
      ...SEED_GIFT_WRAP_CONFIG,
      ...data.giftWrapConfig,
    };
    writeLocalCollection('giftWrapConfig', liveStore.giftWrapConfig);
  }
  if (Array.isArray(data.coupons)) {
    liveStore.coupons = data.coupons;
    writeLocalCollection('coupons', liveStore.coupons);
  }
  if (Array.isArray(data.productReviews)) {
    liveStore.productReviews = data.productReviews;
    writeLocalCollection('productReviews', liveStore.productReviews);
  }
}

function mergeAdminData(
  version: number,
  data: Partial<LiveStoreSnapshot>
): void {
  mergePublicData(version, data);
  if (Array.isArray(data.orders)) {
    liveStore.orders = data.orders;
    writeLocalCollection('orders', liveStore.orders);
  }
  if (Array.isArray(data.registeredCustomers)) {
    liveStore.registeredCustomers = data.registeredCustomers;
    writeLocalCollection('registeredCustomers', liveStore.registeredCustomers);
  }
  if (Array.isArray(data.newsletterSubscribers)) {
    liveStore.newsletterSubscribers = data.newsletterSubscribers;
    writeLocalCollection('newsletterSubscribers', liveStore.newsletterSubscribers);
  }
  if (Array.isArray(data.adminActivityLogs)) {
    liveStore.adminActivityLogs = data.adminActivityLogs;
    writeLocalCollection('adminActivityLogs', liveStore.adminActivityLogs);
  }
}

export async function refreshStoreFromServer(
  topicsToEmit: StoreEventTopic[] = ['all']
): Promise<void> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      if (adminBearerToken) {
        const res = await apiRequest<{
          version?: number;
          data?: Partial<LiveStoreSnapshot>;
        }>('/api/admin/store', { requireAdmin: true });
        if (res && typeof res.version === 'number' && res.data) {
          mergeAdminData(res.version, res.data);
        } else {
          hydrateFromLocalFallback();
        }
      } else {
        const res = await apiRequest<{
          version?: number;
          data?: Partial<LiveStoreSnapshot>;
        }>('/api/store/public');
        if (res && typeof res.version === 'number' && res.data) {
          mergePublicData(res.version, res.data);
        } else {
          hydrateFromLocalFallback();
        }
      }

      const uniqueTopics = Array.from(new Set(topicsToEmit));
      uniqueTopics.forEach((topic) => storeEvents.emit(topic));
    } catch (err) {
      console.warn('[GiftKart Sync] Server unavailable, using local browser storage cache.', err);
      hydrateFromLocalFallback();
      const uniqueTopics = Array.from(new Set(topicsToEmit));
      uniqueTopics.forEach((topic) => storeEvents.emit(topic));
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export async function ensureServerHydrated(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!initialHydrationPromise) {
    purgeLegacyLocalAdminKeys();
    hydrateFromLocalFallback();
    initialHydrationPromise = refreshStoreFromServer(['all']).catch(() => {
      // Allow retry if initial fetch failed transiently
      initialHydrationPromise = null;
    });
  }
  return initialHydrationPromise;
}

export async function saveAdminCollection<K extends SyncableCollectionKey>(
  collection: K,
  value: LiveStoreSnapshot[K],
  emitTopic: StoreEventTopic
): Promise<void> {
  try {
    const res = await apiRequest<{ ok?: boolean; version?: number }>(
      `/api/admin/store/${encodeURIComponent(collection)}`,
      {
        method: 'PUT',
        body: { data: value },
        requireAdmin: true,
      }
    );
    liveStore[collection] = value;
    writeLocalCollection(collection, value);
    if (typeof res.version === 'number') {
      liveStore.version = Math.max(liveStore.version, res.version);
    }
    storeEvents.emit(emitTopic);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    // Re-throw genuine auth errors from a running backend
    if (
      message.toLowerCase().includes('sign-in required') ||
      message.toLowerCase().includes('unauthorized') ||
      message.includes('(401)')
    ) {
      throw err;
    }
    // Static frontend hosting fallback (no backend server reachable)
    liveStore[collection] = value;
    writeLocalCollection(collection, value);
    storeEvents.emit(emitTopic);
  }
}

const VALID_TOPICS = new Set<StoreEventTopic>([
  'catalog',
  'giftWrap',
  'orders',
  'settings',
  'coupons',
  'auth',
  'customers',
  'activity',
  'community',
  'all',
]);

function connectEventStream(): void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  const es = new EventSource('/api/store/events');
  eventSource = es;

  es.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as {
        type?: string;
        topics?: string[];
        version?: number;
      };
      if (payload.type === 'connected') {
        if (typeof payload.version === 'number' && payload.version > liveStore.version) {
          void refreshStoreFromServer(['all']);
        }
        return;
      }
      if (payload.type === 'store:updated') {
        const incomingVersion = typeof payload.version === 'number' ? payload.version : 0;
        if (incomingVersion > liveStore.version || incomingVersion === 0) {
          const topics = (payload.topics ?? [])
            .filter((t): t is StoreEventTopic => VALID_TOPICS.has(t as StoreEventTopic));
          void refreshStoreFromServer(topics.length > 0 ? topics : ['all']);
        }
      }
    } catch {
      // Ignore malformed heartbeat frames
    }
  };

  es.onerror = () => {
    es.close();
    if (eventSource === es) {
      eventSource = null;
    }
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
    }
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connectEventStream();
      void refreshStoreFromServer(['all']);
    }, 3000);
  };
}

export function startLiveStoreSync(): void {
  if (typeof window === 'undefined' || syncStarted) return;
  syncStarted = true;

  purgeLegacyLocalAdminKeys();
  void ensureServerHydrated();
  connectEventStream();

  // Re-sync immediately whenever the user returns to the browser tab (especially on mobile phones!)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void refreshStoreFromServer(['all']);
      if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
        connectEventStream();
      }
    }
  });

  window.addEventListener('focus', () => {
    void refreshStoreFromServer(['all']);
  });
}
