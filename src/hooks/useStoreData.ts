import { useCallback, useEffect, useRef, useState } from 'react';
import { services } from '../services/registry';
import { storeEvents, type StoreEventTopic } from '../storage/storeEvents';
import { storeQueryCache } from '../services/cache/storeQueryCache';
import type {
  AdminActivityLog,
  Category,
  Coupon,
  DemoOrder,
  GiftWrapConfig,
  NewsletterSubscriber,
  OrderNotificationRecord,
  Product,
  ProductFilterParams,
  ProductReview,
  RegisteredCustomer,
  SavedAddress,
  StoreNotification,
  StoreSettings,
} from '../types';

interface AsyncState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface ResourceCacheOptions {
  cacheKey: string;
  staleTimeMs?: number;
  persist?: boolean;
}

function useAsyncStoreResource<T>(
  fetcher: () => Promise<T>,
  initialValue: T,
  topics: StoreEventTopic[],
  options: ResourceCacheOptions
): AsyncState<T> {
  const { cacheKey, staleTimeMs = 30_000, persist = false } = options;

  const initialSnapshot = storeQueryCache.peek<T>(cacheKey, persist);
  const [data, setData] = useState<T>(() =>
    initialSnapshot ? initialSnapshot.data : initialValue
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef<boolean>(Boolean(initialSnapshot));
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Sync state immediately if cacheKey changes (e.g., navigating between category filters)
  const prevKeyRef = useRef(cacheKey);
  if (prevKeyRef.current !== cacheKey) {
    prevKeyRef.current = cacheKey;
    const nextSnap = storeQueryCache.peek<T>(cacheKey, persist);
    if (nextSnap) {
      hasDataRef.current = true;
      setData(nextSnap.data);
      setIsLoading(false);
    } else {
      hasDataRef.current = false;
      setData(initialValue);
      setIsLoading(true);
    }
  }

  const runFetch = useCallback(
    async (force: boolean) => {
      if (!hasDataRef.current) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const result = await storeQueryCache.fetch<T>(
          cacheKey,
          () => fetcherRef.current(),
          {
            staleTimeMs,
            topics,
            persist,
            force,
          }
        );
        hasDataRef.current = true;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load store data.');
      } finally {
        setIsLoading(false);
      }
    },
    [cacheKey, persist, staleTimeMs, topics]
  );

  const refresh = useCallback(() => runFetch(true), [runFetch]);

  useEffect(() => {
    const unsubKey = storeQueryCache.subscribe<T>(cacheKey, (nextData) => {
      hasDataRef.current = true;
      setData(nextData);
      setIsLoading(false);
    });
    void runFetch(false);
    return unsubKey;
  }, [cacheKey, runFetch]);

  useEffect(() => {
    return storeEvents.subscribe((topic) => {
      if (topic === 'all' || topics.includes(topic)) {
        // Deduplicated across all mounted hooks sharing the same cacheKey
        void runFetch(false);
      }
    });
  }, [runFetch, topics]);

  return { data, isLoading, error, refresh };
}

const CATALOG_TOPICS: StoreEventTopic[] = ['catalog'];
const GIFT_WRAP_TOPICS: StoreEventTopic[] = ['giftWrap'];
const SETTINGS_TOPICS: StoreEventTopic[] = ['settings'];
const ORDER_TOPICS: StoreEventTopic[] = ['orders'];
const COUPON_TOPICS: StoreEventTopic[] = ['coupons'];
const COMMUNITY_TOPICS: StoreEventTopic[] = ['community'];
const CUSTOMER_TOPICS: StoreEventTopic[] = ['customers', 'orders', 'auth'];
const ACTIVITY_TOPICS: StoreEventTopic[] = ['activity', 'auth'];

const EMPTY_CATEGORIES: Category[] = [];
const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_NOTIFICATIONS: StoreNotification[] = [];
const EMPTY_ORDERS: DemoOrder[] = [];
const EMPTY_ORDER_NOTIFICATIONS: OrderNotificationRecord[] = [];
const EMPTY_COUPONS: Coupon[] = [];
const EMPTY_CUSTOMERS: RegisteredCustomer[] = [];
const EMPTY_ACTIVITY_LOGS: AdminActivityLog[] = [];
const EMPTY_ADDRESSES: SavedAddress[] = [];
const EMPTY_REVIEWS: ProductReview[] = [];
const EMPTY_SUBSCRIBERS: NewsletterSubscriber[] = [];

export function useCategories(includeInactive = false): AsyncState<Category[]> {
  const fetcher = useCallback(
    () => services.catalog.getCategories(includeInactive),
    [includeInactive]
  );
  return useAsyncStoreResource(fetcher, EMPTY_CATEGORIES, CATALOG_TOPICS, {
    cacheKey: `categories:${includeInactive ? 'all' : 'active'}`,
    staleTimeMs: 45_000,
    persist: !includeInactive,
  });
}

export function useProducts(filters?: ProductFilterParams): AsyncState<Product[]> {
  const normalizedFilters: ProductFilterParams = {};
  if (filters) {
    if (filters.categoryId) normalizedFilters.categoryId = filters.categoryId;
    if (filters.subcategoryId) normalizedFilters.subcategoryId = filters.subcategoryId;
    if (filters.occasion) normalizedFilters.occasion = filters.occasion;
    if (filters.search) normalizedFilters.search = filters.search;
    if (filters.bestSellersOnly) normalizedFilters.bestSellersOnly = true;
    if (filters.featuredOnly) normalizedFilters.featuredOnly = true;
    if (filters.customizableOnly) normalizedFilters.customizableOnly = true;
    if (filters.includeInactive) normalizedFilters.includeInactive = true;
    if (filters.sortBy) normalizedFilters.sortBy = filters.sortBy;
  }
  const filterKey = JSON.stringify(normalizedFilters);
  const isDefaultStorefrontList = filterKey === '{}';

  const fetcher = useCallback(() => {
    const parsed = JSON.parse(filterKey) as ProductFilterParams;
    return services.catalog.getProducts(parsed);
  }, [filterKey]);

  return useAsyncStoreResource(fetcher, EMPTY_PRODUCTS, CATALOG_TOPICS, {
    cacheKey: `products:${filterKey}`,
    staleTimeMs: 45_000,
    persist: isDefaultStorefrontList,
  });
}

export function useGiftWrapConfig(): AsyncState<GiftWrapConfig | null> {
  const fetcher = useCallback(() => services.giftWrap.getConfig(), []);
  return useAsyncStoreResource<GiftWrapConfig | null>(
    fetcher,
    null,
    GIFT_WRAP_TOPICS,
    {
      cacheKey: 'gift_wrap_config',
      staleTimeMs: 60_000,
      persist: true,
    }
  );
}

export function useStoreSettings(): AsyncState<StoreSettings | null> {
  const fetcher = useCallback(() => services.settings.getSettings(), []);
  return useAsyncStoreResource<StoreSettings | null>(
    fetcher,
    null,
    SETTINGS_TOPICS,
    {
      cacheKey: 'store_settings',
      staleTimeMs: 60_000,
      persist: true,
    }
  );
}

export function useStoreNotifications(
  includeInactive = false
): AsyncState<StoreNotification[]> {
  const fetcher = useCallback(
    () => services.notifications.listNotifications(includeInactive),
    [includeInactive]
  );
  return useAsyncStoreResource<StoreNotification[]>(
    fetcher,
    EMPTY_NOTIFICATIONS,
    SETTINGS_TOPICS,
    {
      cacheKey: `store_notifications:${includeInactive ? 'all' : 'active'}`,
      staleTimeMs: 45_000,
      persist: !includeInactive,
    }
  );
}

export function useOrders(): AsyncState<DemoOrder[]> {
  const fetcher = useCallback(() => services.orders.listOrders(), []);
  return useAsyncStoreResource(fetcher, EMPTY_ORDERS, ORDER_TOPICS, {
    cacheKey: 'orders:all',
    staleTimeMs: 15_000,
    persist: false,
  });
}

export function useCustomerOrders(
  customerAccountId?: string,
  email?: string
): AsyncState<DemoOrder[]> {
  const fetcher = useCallback(
    () => services.orders.getOrdersByCustomerAccount(customerAccountId, email),
    [customerAccountId, email]
  );
  return useAsyncStoreResource(fetcher, EMPTY_ORDERS, ORDER_TOPICS, {
    cacheKey: `customer_orders:${customerAccountId ?? ''}:${(email ?? '').toLowerCase()}`,
    staleTimeMs: 15_000,
    persist: false,
  });
}

export function useCustomerOrderNotifications(
  customerAccountId?: string,
  email?: string
): AsyncState<OrderNotificationRecord[]> {
  const fetcher = useCallback(
    () => services.orders.getCustomerOrderNotifications(customerAccountId, email),
    [customerAccountId, email]
  );
  return useAsyncStoreResource(
    fetcher,
    EMPTY_ORDER_NOTIFICATIONS,
    ORDER_TOPICS,
    {
      cacheKey: `customer_order_notifs:${customerAccountId ?? ''}:${(email ?? '').toLowerCase()}`,
      staleTimeMs: 15_000,
      persist: false,
    }
  );
}

export function useCoupons(): AsyncState<Coupon[]> {
  const fetcher = useCallback(() => services.promotions.listCoupons(), []);
  return useAsyncStoreResource(fetcher, EMPTY_COUPONS, COUPON_TOPICS, {
    cacheKey: 'coupons:all',
    staleTimeMs: 45_000,
    persist: true,
  });
}

export function useRegisteredCustomers(): AsyncState<RegisteredCustomer[]> {
  const fetcher = useCallback(() => services.customers.listCustomers(), []);
  return useAsyncStoreResource(fetcher, EMPTY_CUSTOMERS, CUSTOMER_TOPICS, {
    cacheKey: 'customers:all',
    staleTimeMs: 20_000,
    persist: false,
  });
}

export function useAdminActivityLogs(): AsyncState<AdminActivityLog[]> {
  const fetcher = useCallback(() => services.adminAuth.getActivityLogs(), []);
  return useAsyncStoreResource(fetcher, EMPTY_ACTIVITY_LOGS, ACTIVITY_TOPICS, {
    cacheKey: 'admin_activity_logs',
    staleTimeMs: 20_000,
    persist: false,
  });
}

export function useSavedAddresses(): AsyncState<SavedAddress[]> {
  const fetcher = useCallback(() => services.community.listSavedAddresses(), []);
  return useAsyncStoreResource(fetcher, EMPTY_ADDRESSES, COMMUNITY_TOPICS, {
    cacheKey: 'saved_addresses',
    staleTimeMs: 30_000,
    persist: false,
  });
}

export function useProductReviews(productId?: string): AsyncState<ProductReview[]> {
  const fetcher = useCallback(
    () => services.community.listReviews(productId),
    [productId]
  );
  return useAsyncStoreResource(fetcher, EMPTY_REVIEWS, COMMUNITY_TOPICS, {
    cacheKey: `product_reviews:${productId ?? 'all'}`,
    staleTimeMs: 30_000,
    persist: false,
  });
}

export function useNewsletterSubscribers(): AsyncState<NewsletterSubscriber[]> {
  const fetcher = useCallback(
    () => services.community.listNewsletterSubscribers(),
    []
  );
  return useAsyncStoreResource(fetcher, EMPTY_SUBSCRIBERS, COMMUNITY_TOPICS, {
    cacheKey: 'newsletter_subscribers',
    staleTimeMs: 30_000,
    persist: false,
  });
}
