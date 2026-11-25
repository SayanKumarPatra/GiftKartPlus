import type {
  AdminActivityLog,
  AdminDemoSession,
  AdminSignInInput,
  Category,
  Coupon,
  CreateDemoOrderInput,
  CustomerAccountStatus,
  CustomerDemoAccount,
  CustomerSignInInput,
  DeliveryZone,
  DemoOrder,
  GiftWrapConfig,
  GiftWrapStyle,
  OrderFulfillmentStatus,
  PaymentRecordStatus,
  Product,
  ProductFilterParams,
  RegisteredCustomer,
  StoreSettings,
  Subcategory,
} from '../../types';

export interface ICatalogService {
  getCategories(includeInactive?: boolean): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  saveCategory(category: Category): Promise<Category>;
  deleteCategory(categoryId: string): Promise<void>;
  saveSubcategory(categoryId: string, subcategory: Subcategory): Promise<Category>;
  deleteSubcategory(categoryId: string, subcategoryId: string): Promise<Category>;

  getProducts(filters?: ProductFilterParams): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  saveProduct(
    product: Omit<Product, 'createdAt' | 'updatedAt'> &
      Partial<Pick<Product, 'createdAt' | 'updatedAt'>>
  ): Promise<Product>;
  assignProductsToCategory(categoryId: string, productIds: string[]): Promise<void>;
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
  updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentRecordStatus,
    note?: string
  ): Promise<DemoOrder>;
  cancelOrderByCustomer(orderId: string, reason?: string): Promise<DemoOrder>;
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
 * Replaceable Customer Directory interface ready for future Supabase wiring.
 */
export interface ICustomerDirectoryService {
  listCustomers(): Promise<RegisteredCustomer[]>;
  getCustomerById(customerId: string): Promise<RegisteredCustomer | null>;
  getCustomerByEmail(email: string): Promise<RegisteredCustomer | null>;
  upsertCustomer(input: {
    id?: string;
    fullName: string;
    email: string;
    phone: string;
    defaultCity?: string;
  }): Promise<RegisteredCustomer>;
  setCustomerStatus(
    customerId: string,
    status: CustomerAccountStatus
  ): Promise<RegisteredCustomer>;
}

/**
 * Replaceable Customer Authentication interface.
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
 * Never hardcodes credentials; verifies salted SHA-256 hash locally and is ready for Supabase Auth.
 */
export interface IAdminAuthService {
  readonly isDemoImplementation: boolean;
  readonly providerLabel: string;
  readonly securityDisclaimer: string;
  readonly authorizedEmail: string;
  isPasscodeConfigured(): Promise<boolean>;
  setupPasscode(input: AdminSignInInput & { displayName?: string }): Promise<AdminDemoSession>;
  getSession(): Promise<AdminDemoSession | null>;
  signIn(input: AdminSignInInput): Promise<AdminDemoSession>;
  changePasscode(currentPasscode: string, nextPasscode: string): Promise<void>;
  updateProfile(displayName: string): Promise<AdminDemoSession>;
  getActivityLogs(): Promise<AdminActivityLog[]>;
  logActivity(action: string, target: string): Promise<void>;
  clearActivityLogs(): Promise<void>;
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

export interface IPaymentGatewayService {
  getDescriptor(): PaymentGatewayDescriptor;
  createPaymentSession(request: CashfreeSessionRequest): Promise<CashfreeSessionResponse>;
  verifyPaymentStatus(orderNumber: string): Promise<{ verified: false; reason: string }>;
}
