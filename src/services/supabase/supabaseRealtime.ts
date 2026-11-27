import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { storeEvents, type StoreEventTopic } from '../../storage/storeEvents';

const TABLE_TO_TOPIC: Record<string, StoreEventTopic> = {
  categories: 'catalog',
  subcategories: 'catalog',
  products: 'catalog',
  store_settings: 'settings',
  hero_banners: 'settings',
  delivery_zones: 'settings',
  store_notifications: 'settings',
  gift_wrap_config: 'giftWrap',
  gift_wrap_styles: 'giftWrap',
  coupons: 'coupons',
  orders: 'orders',
  order_items: 'orders',
  order_status_history: 'orders',
  order_payments: 'orders',
  order_notifications: 'orders',
  customers: 'customers',
  customer_addresses: 'community',
  product_reviews: 'community',
  newsletter_subscribers: 'community',
  admin_activity_logs: 'activity',
};

let started = false;
const debounceTimers = new Map<StoreEventTopic, number>();

function emitDebounced(topic: StoreEventTopic): void {
  if (typeof window === 'undefined') {
    storeEvents.emit(topic);
    return;
  }
  const existing = debounceTimers.get(topic);
  if (existing !== undefined) {
    window.clearTimeout(existing);
  }
  const timer = window.setTimeout(() => {
    debounceTimers.delete(topic);
    storeEvents.emit(topic);
  }, 180);
  debounceTimers.set(topic, timer);
}

/**
 * Starts Supabase Realtime postgres_changes subscriptions and Auth state listener
 * so Admin Panel changes sync immediately to Storefront and new Orders appear live in Admin.
 */
export function startSupabaseRealtimeSync(): void {
  if (started || !isSupabaseConfigured() || typeof window === 'undefined') {
    return;
  }
  started = true;

  const client = getSupabaseClient();

  client.auth.onAuthStateChange((_event, _session) => {
    emitDebounced('auth');
    emitDebounced('orders');
    emitDebounced('community');
  });

  const channel = client.channel('giftkart-live-sync');
  for (const [table, topic] of Object.entries(TABLE_TO_TOPIC)) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => {
        emitDebounced(topic);
      }
    );
  }

  channel.subscribe();
}
