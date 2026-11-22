/**
 * Future Supabase Integration Contract (UNCONNECTED).
 *
 * Prepared for future migration of Catalog, Orders, GiftWrap, DeliveryZones,
 * StoreSettings, Storage (product media), and Production Auth (Customer + Single Admin).
 * Do NOT connect or invoke live Supabase credentials during initial frontend phases.
 */

export interface SupabaseIntegrationConfig {
  projectUrl?: string;
  anonKey?: string;
  storageBucket: string;
  tables: {
    categories: string;
    subcategories: string;
    products: string;
    giftWrapStyles: string;
    orders: string;
    orderItems: string;
    orderStatusHistory: string;
    coupons: string;
    deliveryZones: string;
    storeSettings: string;
  };
}

export const SUPABASE_CONTRACT_META = {
  provider: 'SUPABASE' as const,
  connected: false as const,
  statusLabel: 'Integration Ready — Not Connected' as const,
  expectedTables: [
    'categories',
    'subcategories',
    'products',
    'gift_wrap_styles',
    'orders',
    'order_items',
    'order_status_history',
    'coupons',
    'delivery_zones',
    'store_settings',
  ],
};

export class SupabaseNotConnectedError extends Error {
  constructor(operation: string) {
    super(
      `Supabase integration is not connected yet (attempted: ${operation}). GiftKart is currently running on the LocalStorage demo adapter.`
    );
    this.name = 'SupabaseNotConnectedError';
  }
}

export interface ISupabaseClientAdapter {
  isConnected(): false;
  getSchemaPlan(): typeof SUPABASE_CONTRACT_META;
  assertConnected(operation: string): never;
}

export const supabasePlaceholderAdapter: ISupabaseClientAdapter = {
  isConnected: () => false,
  getSchemaPlan: () => SUPABASE_CONTRACT_META,
  assertConnected(operation: string): never {
    throw new SupabaseNotConnectedError(operation);
  },
};
