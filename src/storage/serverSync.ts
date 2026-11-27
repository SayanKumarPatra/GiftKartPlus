import {
  SEED_CATEGORIES,
  SEED_GIFT_WRAP_CONFIG,
  SEED_STORE_SETTINGS,
} from '../config/seedData';
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
import { normalizeOfficialContactFields } from '../utils/storefrontHelpers';

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

export const STATIC_ADMIN_TOKEN = '__giftkart_static_admin__';

export class BackendUnavailableError extends Error {
  constructor(message = 'Backend API server is not reachable on this host.') {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

export function isBackendUnavailableError(err: unknown): boolean {
  return err instanceof BackendUnavailableError;
}

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

// Strictly held in JS memory (never written to localStorage/sessionStorage for server mode)
let adminBearerToken: string | null = null;
let cachedAdminSession: AdminDemoSession | null = null;

// Tracks whether Express backend (/api/*) is running ('server') or static host like Vercel ('static')
let backendMode: 'unknown' | 'server' | 'static' = 'unknown';

let initialHydrationPromise: Promise<void> | null = null;
let eventSource: EventSource | null = null;
let reconnectTimer: number | null = null;
let syncStarted = false;
let activeRefreshPromise: Promise<void> | null = null;

export function getBackendMode(): 'unknown' | 'server' | 'static' {
  return backendMode;
}

export function isStaticHostMode(): boolean {
  return backendMode === 'static';
}

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
  if (backendMode === 'static') {
    throw new BackendUnavailableError();
  }

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
    if (adminBearerToken === STATIC_ADMIN_TOKEN) {
      backendMode = 'static';
      throw new BackendUnavailableError();
    }
    headers.Authorization = `Bearer ${adminBearerToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options?.method ?? 'GET',
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new BackendUnavailableError('Network error while contacting backend API.');
  }

  const hasGiftKartHeader = response.headers.get('x-giftkart-backend') === '1';
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const isJsonResponse = contentType.includes('application/json');
  const text = await response.text();

  // Critical for static hosts (e.g. Vercel):
  // - SPA rewrites return 200 OK text/html
  // - Static hosts return 404/405 (either HTML or Vercel JSON NOT_FOUND) without X-GiftKart-Backend
  if (!isJsonResponse || ((response.status === 404 || response.status === 405) && !hasGiftKartHeader)) {
    if (
      contentType.includes('text/html') ||
      response.status === 404 ||
      response.status === 405
    ) {
      backendMode = 'static';
    }
    throw new BackendUnavailableError(
      `Backend API unavailable on this host (${response.status}).`
    );
  }

  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      backendMode = 'static';
      throw new BackendUnavailableError('Invalid JSON payload from API endpoint.');
    }
  }

  backendMode = 'server';

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

const STORAGE_KEY_TO_TOPIC: Record<string, StoreEventTopic> = {
  [STORAGE_KEYS.CATEGORIES]: 'catalog',
  [STORAGE_KEYS.PRODUCTS]: 'catalog',
  [STORAGE_KEYS.STORE_SETTINGS]: 'settings',
  [STORAGE_KEYS.GIFT_WRAP_CONFIG]: 'giftWrap',
  [STORAGE_KEYS.COUPONS]: 'coupons',
  [STORAGE_KEYS.ORDERS]: 'orders',
  [STORAGE_KEYS.REGISTERED_CUSTOMERS]: 'customers',
  [STORAGE_KEYS.PRODUCT_REVIEWS]: 'community',
  [STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS]: 'community',
  [STORAGE_KEYS.ADMIN_ACTIVITY_LOGS]: 'activity',
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
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22)
    ) {
      throw new Error(
        'Browser storage is full. Please upload a smaller image or remove unused banners/products.'
      );
    }
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
    try {
      writeLocalCollection('categories', liveStore.categories);
    } catch {
      // Ignore quota mirror error during hydration
    }
  }
  if (Array.isArray(data.products)) {
    liveStore.products = data.products;
    try {
      writeLocalCollection('products', liveStore.products);
    } catch {
      // Ignore quota mirror error during hydration
    }
  }
  if (data.storeSettings && typeof data.storeSettings === 'object') {
    const incomingSocial = data.storeSettings.socialLinks;
    const normalizedContact = normalizeOfficialContactFields({
      supportEmail: data.storeSettings.supportEmail,
      supportPhone: data.storeSettings.supportPhone,
      contactVersion: data.storeSettings.contactVersion,
      socialLinks: incomingSocial,
    });
    liveStore.storeSettings = {
      ...SEED_STORE_SETTINGS,
      ...data.storeSettings,
      supportEmail: normalizedContact.supportEmail,
      supportPhone: normalizedContact.supportPhone,
      contactVersion: normalizedContact.contactVersion,
      socialLinks: {
        instagram:
          incomingSocial?.instagram?.trim() || SEED_STORE_SETTINGS.socialLinks!.instagram,
        facebook:
          incomingSocial?.facebook?.trim() || SEED_STORE_SETTINGS.socialLinks!.facebook,
        whatsapp: normalizedContact.whatsappUrl,
        youtube: incomingSocial?.youtube?.trim() || '',
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
    try {
      writeLocalCollection('storeSettings', liveStore.storeSettings);
    } catch {
      // Ignore quota mirror error during hydration
    }
  }
  if (data.giftWrapConfig && typeof data.giftWrapConfig === 'object') {
    liveStore.giftWrapConfig = {
      ...SEED_GIFT_WRAP_CONFIG,
      ...data.giftWrapConfig,
    };
    try {
      writeLocalCollection('giftWrapConfig', liveStore.giftWrapConfig);
    } catch {
      // Ignore quota mirror error during hydration
    }
  }
  if (Array.isArray(data.coupons)) {
    liveStore.coupons = data.coupons;
    try {
      writeLocalCollection('coupons', liveStore.coupons);
    } catch {
      // Ignore quota mirror error during hydration
    }
  }
  if (Array.isArray(data.productReviews)) {
    liveStore.productReviews = data.productReviews;
    try {
      writeLocalCollection('productReviews', liveStore.productReviews);
    } catch {
      // Ignore quota mirror error during hydration
    }
  }
}

function mergeAdminData(
  version: number,
  data: Partial<LiveStoreSnapshot>
): void {
  mergePublicData(version, data);
  if (Array.isArray(data.orders)) {
    liveStore.orders = data.orders;
    try {
      writeLocalCollection('orders', liveStore.orders);
    } catch {
      // Ignore quota mirror error during hydration
    }
  }
  if (Array.isArray(data.registeredCustomers)) {
    liveStore.registeredCustomers = data.registeredCustomers;
    try {
      writeLocalCollection('registeredCustomers', liveStore.registeredCustomers);
    } catch {
      // Ignore quota mirror error during hydration
    }
  }
  if (Array.isArray(data.newsletterSubscribers)) {
    liveStore.newsletterSubscribers = data.newsletterSubscribers;
    try {
      writeLocalCollection('newsletterSubscribers', liveStore.newsletterSubscribers);
    } catch {
      // Ignore quota mirror error during hydration
    }
  }
  if (Array.isArray(data.adminActivityLogs)) {
    liveStore.adminActivityLogs = data.adminActivityLogs;
    try {
      writeLocalCollection('adminActivityLogs', liveStore.adminActivityLogs);
    } catch {
      // Ignore quota mirror error during hydration
    }
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
      if (backendMode === 'static') {
        hydrateFromLocalFallback();
        const uniqueTopics = Array.from(new Set(topicsToEmit));
        uniqueTopics.forEach((topic) => storeEvents.emit(topic));
        return;
      }

      if (adminBearerToken && adminBearerToken !== STATIC_ADMIN_TOKEN) {
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
      if (!isBackendUnavailableError(err)) {
        console.warn('[GiftKart Sync] Server sync error, using local browser cache.', err);
      }
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
      initialHydrationPromise = null;
    });
  }
  return initialHydrationPromise;
}

export function savePublicLocalCollection<K extends SyncableCollectionKey>(
  collection: K,
  value: LiveStoreSnapshot[K],
  emitTopic: StoreEventTopic
): void {
  liveStore[collection] = value;
  writeLocalCollection(collection, value);
  storeEvents.emit(emitTopic);
}

export async function saveAdminCollection<K extends SyncableCollectionKey>(
  collection: K,
  value: LiveStoreSnapshot[K],
  emitTopic: StoreEventTopic
): Promise<void> {
  if (!adminBearerToken) {
    throw new Error('Admin sign-in required. Please log in again.');
  }

  if (backendMode === 'static' || adminBearerToken === STATIC_ADMIN_TOKEN) {
    liveStore[collection] = value;
    writeLocalCollection(collection, value);
    storeEvents.emit(emitTopic);
    return;
  }

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
    if (isBackendUnavailableError(err)) {
      liveStore[collection] = value;
      writeLocalCollection(collection, value);
      storeEvents.emit(emitTopic);
      return;
    }
    throw err;
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
  if (
    typeof window === 'undefined' ||
    typeof EventSource === 'undefined' ||
    backendMode !== 'server'
  ) {
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
        notification?: {
          id?: string;
          title?: string;
          body?: string;
          url?: string;
          tag?: string;
          sentAt?: string;
          customerAccountId?: string;
          customerEmail?: string;
        };
      };
      if (payload.type === 'connected') {
        if (typeof payload.version === 'number' && payload.version > liveStore.version) {
          void refreshStoreFromServer(['all']);
        }
        return;
      }
      if (payload.type === 'push:notification' && payload.notification) {
        window.dispatchEvent(
          new CustomEvent('giftkart:live-push', { detail: payload.notification })
        );
        return;
      }
      if (payload.type === 'store:updated') {
        const incomingVersion = typeof payload.version === 'number' ? payload.version : 0;
        if (incomingVersion > liveStore.version || incomingVersion === 0) {
          const topics = (payload.topics ?? []).filter((t): t is StoreEventTopic =>
            VALID_TOPICS.has(t as StoreEventTopic)
          );
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
    if (backendMode !== 'server') {
      return;
    }
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
    }
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      if (backendMode === 'server') {
        connectEventStream();
        void refreshStoreFromServer(['all']);
      }
    }, 3000);
  };
}

export function startLiveStoreSync(): void {
  if (typeof window === 'undefined' || syncStarted) return;
  syncStarted = true;

  purgeLegacyLocalAdminKeys();
  void ensureServerHydrated().then(() => {
    if (backendMode === 'server') {
      connectEventStream();
    }
  });

  // Sync updates instantly across tabs when running on static hosting (Vercel)
  window.addEventListener('storage', (event) => {
    if (!event.key) return;
    const topic = STORAGE_KEY_TO_TOPIC[event.key];
    if (topic) {
      hydrateFromLocalFallback();
      storeEvents.emit(topic);
    }
  });

  // Re-sync immediately whenever the user returns to the browser tab (especially on mobile phones!)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void refreshStoreFromServer(['all']);
      if (
        backendMode === 'server' &&
        (!eventSource || eventSource.readyState === EventSource.CLOSED)
      ) {
        connectEventStream();
      }
    }
  });

  window.addEventListener('focus', () => {
    void refreshStoreFromServer(['all']);
  });
}
