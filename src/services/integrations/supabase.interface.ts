import { getSupabaseProjectUrl, isSupabaseConfigured, SUPABASE_MEDIA_BUCKET } from '../../lib/supabase';

export interface SupabaseIntegrationConfig {
  projectUrl?: string;
  storageBucket: string;
  tables: {
    adminUsers: string;
    customers: string;
    customerAddresses: string;
    customerWishlists: string;
    customerCarts: string;
    categories: string;
    subcategories: string;
    products: string;
    giftWrapConfig: string;
    giftWrapStyles: string;
    deliveryZones: string;
    heroBanners: string;
    coupons: string;
    storeSettings: string;
    storeNotifications: string;
    orders: string;
    orderItems: string;
    orderStatusHistory: string;
    orderPayments: string;
    orderNotifications: string;
    productReviews: string;
    newsletterSubscribers: string;
    adminActivityLogs: string;
  };
}

export const SUPABASE_CONTRACT_META = {
  provider: 'SUPABASE' as const,
  get connected(): boolean {
    return isSupabaseConfigured();
  },
  get statusLabel(): string {
    return isSupabaseConfigured() ? 'Connected — Supabase Backend' : 'Not Configured';
  },
  storageBucket: SUPABASE_MEDIA_BUCKET,
  expectedTables: [
    'admin_users',
    'customers',
    'customer_addresses',
    'customer_wishlists',
    'customer_carts',
    'categories',
    'subcategories',
    'products',
    'gift_wrap_config',
    'gift_wrap_styles',
    'delivery_zones',
    'hero_banners',
    'coupons',
    'store_settings',
    'store_notifications',
    'orders',
    'order_items',
    'order_status_history',
    'order_payments',
    'order_notifications',
    'product_reviews',
    'newsletter_subscribers',
    'admin_activity_logs',
  ],
};

export interface ISupabaseClientAdapter {
  isConnected(): boolean;
  getProjectUrl(): string;
  getSchemaPlan(): typeof SUPABASE_CONTRACT_META;
}

export const supabasePlaceholderAdapter: ISupabaseClientAdapter = {
  isConnected: () => isSupabaseConfigured(),
  getProjectUrl: () => getSupabaseProjectUrl(),
  getSchemaPlan: () => SUPABASE_CONTRACT_META,
};
