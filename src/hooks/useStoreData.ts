import { useCallback, useEffect, useRef, useState } from 'react';
import { services } from '../services/registry';
import { storeEvents, type StoreEventTopic } from '../storage/storeEvents';
import type {
  AdminActivityLog,
  Category,
  Coupon,
  DemoOrder,
  GiftWrapConfig,
  NewsletterSubscriber,
  Product,
  ProductFilterParams,
  ProductReview,
  RegisteredCustomer,
  SavedAddress,
  StoreSettings,
} from '../types';

interface AsyncState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function useAsyncStoreResource<T>(
  fetcher: () => Promise<T>,
  initialValue: T,
  topics: StoreEventTopic[]
): AsyncState<T> {
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load store data.');
    } finally {
      hasLoadedOnceRef.current = true;
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return storeEvents.subscribe((topic) => {
      if (topic === 'all' || topics.includes(topic)) {
        void refresh();
      }
    });
  }, [refresh, topics]);

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

export function useCategories(includeInactive = false): AsyncState<Category[]> {
  const fetcher = useCallback(
    () => services.catalog.getCategories(includeInactive),
    [includeInactive]
  );
  return useAsyncStoreResource(fetcher, [], CATALOG_TOPICS);
}

export function useProducts(filters?: ProductFilterParams): AsyncState<Product[]> {
  const filterKey = JSON.stringify(filters ?? {});
  const fetcher = useCallback(() => {
    const parsed = JSON.parse(filterKey) as ProductFilterParams;
    return services.catalog.getProducts(parsed);
  }, [filterKey]);
  return useAsyncStoreResource(fetcher, [], CATALOG_TOPICS);
}

export function useGiftWrapConfig(): AsyncState<GiftWrapConfig | null> {
  const fetcher = useCallback(() => services.giftWrap.getConfig(), []);
  return useAsyncStoreResource<GiftWrapConfig | null>(fetcher, null, GIFT_WRAP_TOPICS);
}

export function useStoreSettings(): AsyncState<StoreSettings | null> {
  const fetcher = useCallback(() => services.settings.getSettings(), []);
  return useAsyncStoreResource<StoreSettings | null>(fetcher, null, SETTINGS_TOPICS);
}

export function useOrders(): AsyncState<DemoOrder[]> {
  const fetcher = useCallback(() => services.orders.listOrders(), []);
  return useAsyncStoreResource(fetcher, [], ORDER_TOPICS);
}

export function useCoupons(): AsyncState<Coupon[]> {
  const fetcher = useCallback(() => services.promotions.listCoupons(), []);
  return useAsyncStoreResource(fetcher, [], COUPON_TOPICS);
}

export function useRegisteredCustomers(): AsyncState<RegisteredCustomer[]> {
  const fetcher = useCallback(() => services.customers.listCustomers(), []);
  return useAsyncStoreResource(fetcher, [], CUSTOMER_TOPICS);
}

export function useAdminActivityLogs(): AsyncState<AdminActivityLog[]> {
  const fetcher = useCallback(() => services.adminAuth.getActivityLogs(), []);
  return useAsyncStoreResource(fetcher, [], ACTIVITY_TOPICS);
}

export function useSavedAddresses(): AsyncState<SavedAddress[]> {
  const fetcher = useCallback(() => services.community.listSavedAddresses(), []);
  return useAsyncStoreResource(fetcher, [], COMMUNITY_TOPICS);
}

export function useProductReviews(productId?: string): AsyncState<ProductReview[]> {
  const fetcher = useCallback(
    () => services.community.listReviews(productId),
    [productId]
  );
  return useAsyncStoreResource(fetcher, [], COMMUNITY_TOPICS);
}

export function useNewsletterSubscribers(): AsyncState<NewsletterSubscriber[]> {
  const fetcher = useCallback(() => services.community.listNewsletterSubscribers(), []);
  return useAsyncStoreResource(fetcher, [], COMMUNITY_TOPICS);
}
