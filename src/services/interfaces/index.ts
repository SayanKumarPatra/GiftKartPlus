import type {
  AdminDemoSession,
  AdminSignInInput,
  Category,
  Coupon,
  CreateDemoOrderInput,
  CustomerDemoAccount,
  CustomerSignInInput,
  DeliveryZone,
  DemoOrder,
  GiftWrapConfig,
  GiftWrapStyle,
  OrderFulfillmentStatus,
  Product,
  ProductFilterParams,
  StoreSettings,
  Subcategory,
} from '../../types';

export interface ICatalogService {
  getCategories(includeInactive?: boolean): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  saveCategory(category: Category): Promise<Category>;
  saveSubcategory(categoryId: string, subcategory: Subcategory): Promise<Category>;
  deleteSubcategory(categoryId: string, subcategoryId: string): Promise<Category>;

  getProducts(filters?: ProductFilterParams): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  saveProduct(product: Omit<Product, 'createdAt' | 'updatedAt'> & Partial<Pick<Product, 'createdAt' | 'updatedAt'>>): Promise<Product>;
  deleteProduct(productId: string): Promise<void>;
}

export interface IGiftWrapService {
  getConfig(): Promise<GiftWrapConfig>;
  setGloballyEnabled(enabled: boolean): Promise<GiftWrapConfig>;
  upsertStyle(style: GiftWrapStyle): Promise<GiftWrapConfig>;
  deleteStyle(styleId: string): Promise<GiftWrapConfig>;
}

export interface IOrderService {
  listOrders(): Promise<DemoOrder[]>;
  getOrderByNumber(orderNumber: string): Promise<DemoOrder | null>;
  getOrdersByCustomerAccount(customerAccountId: string): Promise<DemoOrder[]>;
  createDemoOrder(input: CreateDemoOrderInput): Promise<DemoOrder>;
  updateOrderStatus(
    orderId: string,
    nextStatus: OrderFulfillmentStatus,
    note?: string
  ): Promise<DemoOrder>;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountInr: number;
  message: string;
}

export interface IPromotionService {
  listCoupons(): Promise<Coupon[]>;
  validateCoupon(code: string, subtotalInr: number): Promise<CouponValidationResult>;
  upsertCoupon(coupon: Coupon): Promise<Coupon>;
  deleteCoupon(couponId: string): Promise<void>;
}

export interface IStoreSettingsService {
  getSettings(): Promise<StoreSettings>;
  updateSettings(settings: StoreSettings): Promise<StoreSettings>;
  upsertDeliveryZone(zone: DeliveryZone): Promise<StoreSettings>;
  deleteDeliveryZone(zoneId: string): Promise<StoreSettings>;
}

/**
 * Replaceable Customer Authentication interface.
 * Current implementation uses LocalStorage demo sessions only (NOT production secure).
 * Future phase will swap in SupabaseAuthCustomerAdapter without UI changes.
 */
export interface ICustomerAuthService {
  readonly isDemoImplementation: boolean;
  readonly providerLabel: string;
  getCurrentAccount(): Promise<CustomerDemoAccount | null>;
  signInDemo(input: CustomerSignInInput): Promise<CustomerDemoAccount>;
  signOut(): Promise<void>;
}

/**
 * Replaceable Single Admin Authentication interface.
 * Current implementation uses LocalStorage demo sessions only (NOT production secure).
 * Future phase will swap in SupabaseAuthAdminAdapter without UI changes.
 */
export interface IAdminAuthService {
  readonly isDemoImplementation: boolean;
  readonly providerLabel: string;
  readonly securityDisclaimer: string;
  getSession(): Promise<AdminDemoSession | null>;
  signIn(input: AdminSignInInput): Promise<AdminDemoSession>;
  signOut(): Promise<void>;
}

export interface PaymentGatewayDescriptor {
  provider: 'CASHFREE';
  connected: false;
  statusCode: 'INTEGRATION_READY_NOT_CONNECTED';
  statusLabel: 'Integration Ready — Not Connected';
  description: string;
}

export interface CashfreeSessionRequest {
  orderNumber: string;
  amountInr: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface CashfreeSessionResponse {
  paymentSessionId: string;
  cfOrderId: string;
}

/**
 * Payment Gateway service contract prepared for future Cashfree integration.
 * Never fakes payments; throws CashfreeNotConnectedError until connected.
 */
export interface IPaymentGatewayService {
  getDescriptor(): PaymentGatewayDescriptor;
  createPaymentSession(request: CashfreeSessionRequest): Promise<CashfreeSessionResponse>;
  verifyPaymentStatus(orderNumber: string): Promise<{ verified: false; reason: string }>;
}
