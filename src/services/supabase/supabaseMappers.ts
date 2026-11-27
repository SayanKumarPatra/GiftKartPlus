import type {
  AdminActivityLog,
  Category,
  Coupon,
  CustomerDemoAccount,
  DeliveryZone,
  DemoOrder,
  GiftWrapStyle,
  HeroSlide,
  NewsletterSubscriber,
  OccasionTag,
  OrderFulfillmentStatus,
  OrderItemSnapshot,
  OrderNotificationRecord,
  OrderPaymentHistoryEntry,
  OrderReceiptRecord,
  OrderShippingDetails,
  OrderStatusHistoryEntry,
  PaymentRecordStatus,
  Product,
  ProductReview,
  RegisteredCustomer,
  SavedAddress,
  StoreNotification,
  StoreSettings,
  Subcategory,
} from '../../types';

const DEFAULT_SUPPORT_EMAIL = 'hello.giftkart@gmail.com';
const DEFAULT_SUPPORT_PHONE = '+91 9239505791';
const DEFAULT_WHATSAPP_URL = 'https://wa.me/919239505791';

export const SCHEMA_MIGRATION_HINT =
  'Supabase database tables are not initialized yet. Please open Supabase Dashboard → SQL Editor and run supabase/migrations/001_giftkart_complete_schema.sql once.';

export function asRecord(val: unknown): Record<string, unknown> {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}

export function mapSubcategoryRow(row: Record<string, unknown>): Subcategory {
  return {
    id: String(row.id ?? ''),
    slug: String(row.slug ?? ''),
    name: String(row.name ?? ''),
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapCategoryRow(
  row: Record<string, unknown>,
  subRows: Record<string, unknown>[] = []
): Category {
  const subs = subRows
    .map(mapSubcategoryRow)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: String(row.id ?? ''),
    slug: String(row.slug ?? ''),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    imageUrl: typeof row.image_url === 'string' && row.image_url ? row.image_url : undefined,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active !== false,
    subcategories: subs,
    translations:
      row.translations && typeof row.translations === 'object'
        ? (row.translations as Category['translations'])
        : undefined,
  };
}

export function mapProductRow(row: Record<string, unknown>): Product {
  const images = Array.isArray(row.images)
    ? row.images.filter((i): i is string => typeof i === 'string' && i.length > 0)
    : [];
  const occasionTags = Array.isArray(row.occasion_tags)
    ? (row.occasion_tags.filter((t): t is string => typeof t === 'string') as OccasionTag[])
    : [];
  const variants = Array.isArray(row.variants)
    ? (row.variants as Product['variants'])
    : [];

  return {
    id: String(row.id ?? ''),
    slug: String(row.slug ?? ''),
    sku: String(row.sku ?? ''),
    name: String(row.name ?? ''),
    shortDescription: String(row.short_description ?? ''),
    description: String(row.description ?? ''),
    priceInr: Number(row.price_inr ?? 0),
    compareAtPriceInr:
      row.compare_at_price_inr !== null && row.compare_at_price_inr !== undefined
        ? Number(row.compare_at_price_inr)
        : undefined,
    categoryId: String(row.category_id ?? ''),
    subcategoryId:
      typeof row.subcategory_id === 'string' && row.subcategory_id
        ? row.subcategory_id
        : undefined,
    occasionTags,
    images,
    variants,
    availability:
      row.availability === 'OUT_OF_STOCK' || row.availability === 'PREORDER'
        ? row.availability
        : 'IN_STOCK',
    stockCount: Number(row.stock_count ?? 0),
    isBestSeller: Boolean(row.is_best_seller),
    isFeatured: Boolean(row.is_featured),
    isActive: row.is_active !== false,
    isArchived: Boolean(row.is_archived),
    isSampleOrTest: false,
    supportsPersonalization: Boolean(row.supports_personalization),
    supportsPhotoUpload: Boolean(row.supports_photo_upload),
    personalizationPrompt:
      typeof row.personalization_prompt === 'string' && row.personalization_prompt
        ? row.personalization_prompt
        : undefined,
    translations:
      row.translations && typeof row.translations === 'object'
        ? (row.translations as Product['translations'])
        : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function mapGiftWrapStyleRow(row: Record<string, unknown>): GiftWrapStyle {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    chargeInr: Number(row.charge_inr ?? 0),
    accentColorHex: String(row.accent_color_hex ?? '#6A11CB'),
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapDeliveryZoneRow(row: Record<string, unknown>): DeliveryZone {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    state: String(row.state ?? 'West Bengal'),
    chargeInr: Number(row.charge_inr ?? 0),
    freeDeliveryAboveInr: Number(row.free_delivery_above_inr ?? 499),
    estimatedDays: String(row.estimated_days ?? '1–2 Days'),
    isActive: row.is_active !== false,
  };
}

export function mapHeroSlideRow(row: Record<string, unknown>): HeroSlide {
  return {
    id: String(row.id ?? ''),
    titlePrefix: String(row.title_prefix ?? ''),
    titleHighlight: String(row.title_highlight ?? ''),
    subtitle: String(row.subtitle ?? ''),
    ctaLabel: String(row.cta_label ?? 'Shop Now'),
    ctaHref: String(row.cta_href ?? '/shop'),
    imageUrl: String(row.image_url ?? ''),
    occasionTag:
      typeof row.occasion_tag === 'string' && row.occasion_tag
        ? (row.occasion_tag as OccasionTag)
        : undefined,
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapCouponRow(row: Record<string, unknown>): Coupon {
  return {
    id: String(row.id ?? ''),
    code: String(row.code ?? '').toUpperCase(),
    title: typeof row.title === 'string' && row.title ? row.title : undefined,
    description: String(row.description ?? ''),
    discountType: row.discount_type === 'FLAT_INR' ? 'FLAT_INR' : 'PERCENTAGE',
    value: Number(row.value ?? 0),
    minOrderInr: Number(row.min_order_inr ?? 0),
    maxDiscountInr:
      row.max_discount_inr !== null && row.max_discount_inr !== undefined
        ? Number(row.max_discount_inr)
        : undefined,
    validFrom:
      typeof row.valid_from === 'string' && row.valid_from ? row.valid_from : undefined,
    validUntil:
      typeof row.valid_until === 'string' && row.valid_until ? row.valid_until : undefined,
    linkedBannerId:
      typeof row.linked_banner_id === 'string' && row.linked_banner_id
        ? row.linked_banner_id
        : undefined,
    isActive: row.is_active !== false,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapStoreNotificationRow(row: Record<string, unknown>): StoreNotification {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    message: String(row.message ?? ''),
    targetAudience: 'ALL_REGISTERED_USERS',
    isActive: row.is_active !== false,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function mapStoreSettingsRows(
  settingsRow: Record<string, unknown> | null,
  zonesRows: Record<string, unknown>[],
  heroRows: Record<string, unknown>[],
  notifRows: Record<string, unknown>[],
  fallback: StoreSettings
): StoreSettings {
  const s = settingsRow ?? {};
  const bannerRaw = asRecord(s.banner);
  const announcementRaw = asRecord(s.announcement);
  const newsletterRaw = asRecord(s.newsletter);
  const pageContentRaw = asRecord(s.page_content);
  const socialLinksRaw = asRecord(s.social_links);
  const seoRaw = asRecord(s.seo);
  const policiesRaw = asRecord(s.policies);
  const footerRaw = asRecord(s.footer_content);

  return {
    storeName: String(s.store_name ?? fallback.storeName ?? 'GiftKart'),
    tagline: String(s.tagline ?? fallback.tagline ?? 'Har Gift Mein Ek Kahani.'),
    logoUrl:
      typeof s.logo_url === 'string' && s.logo_url
        ? s.logo_url
        : fallback.logoUrl,
    maintenanceMode:
      typeof s.maintenance_mode === 'boolean'
        ? s.maintenance_mode
        : fallback.maintenanceMode ?? false,
    currencyCode: 'INR',
    currencySymbol: '₹',
    supportEmail: String(
      s.support_email ?? fallback.supportEmail ?? DEFAULT_SUPPORT_EMAIL
    ),
    supportPhone: String(
      s.support_phone ?? fallback.supportPhone ?? DEFAULT_SUPPORT_PHONE
    ),
    serviceCitiesSummary: String(
      s.service_cities_summary ??
        fallback.serviceCitiesSummary ??
        'Jalchak, Pingla, Paschim Medinipur, West Bengal - 721155'
    ),
    deliveryZones:
      zonesRows.length > 0
        ? zonesRows.map(mapDeliveryZoneRow)
        : fallback.deliveryZones,
    banner: {
      ...fallback.banner,
      ...bannerRaw,
    } as StoreSettings['banner'],
    heroSlides: heroRows
      .map(mapHeroSlideRow)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    announcement: {
      ...fallback.announcement,
      ...announcementRaw,
    } as StoreSettings['announcement'],
    newsletter: {
      ...fallback.newsletter,
      ...newsletterRaw,
    } as StoreSettings['newsletter'],
    pageContent: {
      ...fallback.pageContent,
      ...pageContentRaw,
    } as StoreSettings['pageContent'],
    socialLinks: {
      ...(fallback.socialLinks ?? {
        instagram: '',
        facebook: '',
        whatsapp: DEFAULT_WHATSAPP_URL,
        youtube: '',
      }),
      ...socialLinksRaw,
    } as StoreSettings['socialLinks'],
    seo: {
      ...(fallback.seo ?? { title: 'GiftKart', description: '' }),
      ...seoRaw,
    } as StoreSettings['seo'],
    policies: {
      ...(fallback.policies ?? {
        privacyPolicy: '',
        termsAndConditions: '',
        refundPolicy: '',
      }),
      ...policiesRaw,
    } as StoreSettings['policies'],
    footerContent: {
      ...(fallback.footerContent ?? { description: '', copyrightText: '' }),
      ...footerRaw,
    } as StoreSettings['footerContent'],
    notifications: notifRows.map(mapStoreNotificationRow),
    contactVersion: Number(s.contact_version ?? fallback.contactVersion ?? 2),
  };
}

export function mapOrderItemRow(row: Record<string, unknown>): OrderItemSnapshot {
  return {
    productId: String(row.product_id ?? ''),
    productNameSnapshot: String(row.product_name_snapshot ?? 'Gift Item'),
    productSkuSnapshot: String(row.product_sku_snapshot ?? ''),
    unitPriceInrSnapshot: Number(row.unit_price_inr_snapshot ?? 0),
    quantity: Math.max(1, Number(row.quantity ?? 1)),
    lineTotalInr: Number(row.line_total_inr ?? 0),
    selectedVariants: asRecord(row.selected_variants) as Record<string, string>,
    personalizationDetails: String(row.personalization_details ?? ''),
    customPhotoFileName:
      typeof row.custom_photo_file_name === 'string' && row.custom_photo_file_name
        ? row.custom_photo_file_name
        : undefined,
    imageSnapshot:
      typeof row.image_snapshot === 'string' && row.image_snapshot
        ? row.image_snapshot
        : undefined,
  };
}

export function mapOrderStatusHistoryRow(row: Record<string, unknown>): OrderStatusHistoryEntry {
  return {
    id: String(row.id ?? ''),
    type:
      typeof row.event_type === 'string'
        ? (row.event_type as OrderStatusHistoryEntry['type'])
        : 'STATUS_UPDATE',
    status: String(row.status ?? 'New Order') as OrderFulfillmentStatus,
    timestamp: String(row.timestamp ?? new Date().toISOString()),
    note: typeof row.note === 'string' && row.note ? row.note : undefined,
    updatedBy:
      (row.updated_by as OrderStatusHistoryEntry['updatedBy']) ?? 'System',
    adminName:
      typeof row.admin_name === 'string' && row.admin_name ? row.admin_name : undefined,
    adminEmail:
      typeof row.admin_email === 'string' && row.admin_email ? row.admin_email : undefined,
    metadataSummary:
      typeof row.metadata_summary === 'string' && row.metadata_summary
        ? row.metadata_summary
        : undefined,
  };
}

export function mapOrderPaymentRow(row: Record<string, unknown>): OrderPaymentHistoryEntry {
  const rawStatus = String(row.status ?? 'Unpaid');
  const status =
    rawStatus === 'Paid' ||
    rawStatus === 'Payment Collected' ||
    rawStatus === 'Refunded'
      ? rawStatus
      : 'Unpaid';
  return {
    id: String(row.id ?? ''),
    status,
    amountInr: Number(row.amount_inr ?? 0),
    timestamp: String(row.timestamp ?? new Date().toISOString()),
    collectionDate:
      typeof row.collection_date === 'string' && row.collection_date
        ? row.collection_date
        : undefined,
    adminName:
      typeof row.admin_name === 'string' && row.admin_name ? row.admin_name : undefined,
    adminEmail:
      typeof row.admin_email === 'string' && row.admin_email ? row.admin_email : undefined,
    note: typeof row.note === 'string' && row.note ? row.note : undefined,
  };
}

export function mapOrderNotificationRow(row: Record<string, unknown>): OrderNotificationRecord {
  return {
    id: String(row.id ?? ''),
    orderId: String(row.order_id ?? ''),
    orderNumber: String(row.order_number ?? ''),
    customerAccountId:
      typeof row.customer_id === 'string' && row.customer_id
        ? row.customer_id
        : undefined,
    customerEmail:
      typeof row.customer_email === 'string' && row.customer_email
        ? row.customer_email
        : undefined,
    eventKey: String(row.event_key ?? ''),
    status: String(row.status ?? 'New Order') as OrderNotificationRecord['status'],
    title: String(row.title ?? ''),
    message: String(row.message ?? ''),
    sentAt: String(row.sent_at ?? new Date().toISOString()),
    deliveryStatus: 'DELIVERED_TO_APP',
    triggeredBy:
      row.triggered_by === 'Admin' || row.triggered_by === 'Customer'
        ? row.triggered_by
        : 'System',
    adminName:
      typeof row.admin_name === 'string' && row.admin_name ? row.admin_name : undefined,
    customerNote:
      typeof row.customer_note === 'string' && row.customer_note
        ? row.customer_note
        : undefined,
  };
}

export function mapOrderRow(
  row: Record<string, unknown>,
  itemsRows?: Record<string, unknown>[],
  historyRows?: Record<string, unknown>[],
  paymentRows?: Record<string, unknown>[],
  notifRows?: Record<string, unknown>[]
): DemoOrder {
  const rawItems =
    itemsRows ??
    (Array.isArray(row.order_items) ? (row.order_items as Record<string, unknown>[]) : []);
  const rawHistory =
    historyRows ??
    (Array.isArray(row.order_status_history)
      ? (row.order_status_history as Record<string, unknown>[])
      : []);
  const rawPayments =
    paymentRows ??
    (Array.isArray(row.order_payments)
      ? (row.order_payments as Record<string, unknown>[])
      : []);
  const rawNotifs =
    notifRows ??
    (Array.isArray(row.order_notifications)
      ? (row.order_notifications as Record<string, unknown>[])
      : []);

  const customerDetails = asRecord(row.customer_details);
  const giftWrapRaw = asRecord(row.gift_wrap);
  const shippingDetails = asRecord(row.shipping_details) as OrderShippingDetails;
  const paymentDetails = asRecord(row.payment_details);
  const receiptRaw =
    row.receipt && typeof row.receipt === 'object'
      ? (row.receipt as OrderReceiptRecord)
      : undefined;

  return {
    id: String(row.id ?? ''),
    orderNumber: String(row.order_number ?? ''),
    mode: row.mode === 'DEMO_ORDER' ? 'DEMO_ORDER' : 'LIVE_ORDER',
    customerAccountId:
      typeof row.customer_id === 'string' && row.customer_id ? row.customer_id : undefined,
    customer: {
      fullName: String(customerDetails.fullName ?? ''),
      phone: String(customerDetails.phone ?? ''),
      email: String(customerDetails.email ?? row.customer_email ?? ''),
      addressLine1: String(customerDetails.addressLine1 ?? ''),
      addressLine2:
        typeof customerDetails.addressLine2 === 'string'
          ? customerDetails.addressLine2
          : undefined,
      deliveryZoneId: String(customerDetails.deliveryZoneId ?? 'zone-jalchak'),
      deliveryZoneNameSnapshot: String(
        customerDetails.deliveryZoneNameSnapshot ?? 'Jalchak'
      ),
      city: String(customerDetails.city ?? 'Jalchak'),
      state: String(customerDetails.state ?? 'West Bengal'),
      pincode: String(customerDetails.pincode ?? ''),
    },
    items: rawItems.map(mapOrderItemRow),
    giftWrap: {
      enabled: Boolean(giftWrapRaw.enabled),
      styleId: typeof giftWrapRaw.styleId === 'string' ? giftWrapRaw.styleId : null,
      styleNameSnapshot: String(giftWrapRaw.styleNameSnapshot ?? ''),
      chargeInrSnapshot: Number(
        giftWrapRaw.chargeInrSnapshot ?? row.gift_wrap_charge_inr ?? 0
      ),
      recipientName: String(giftWrapRaw.recipientName ?? ''),
      giftMessage: String(giftWrapRaw.giftMessage ?? ''),
    },
    subtotalInr: Number(row.subtotal_inr ?? 0),
    giftWrapChargeInr: Number(row.gift_wrap_charge_inr ?? 0),
    discountInr: Number(row.discount_inr ?? 0),
    deliveryChargeInr: Number(row.delivery_charge_inr ?? 0),
    grandTotalInr: Number(row.grand_total_inr ?? 0),
    couponCode:
      typeof row.coupon_code === 'string' && row.coupon_code ? row.coupon_code : undefined,
    paymentMethod: String(row.payment_method ?? 'Cash on Delivery (COD)'),
    paymentStatus: String(row.payment_status ?? 'UNPAID') as PaymentRecordStatus,
    paymentReference:
      typeof row.payment_reference === 'string' ? row.payment_reference : undefined,
    paymentGatewayStatus:
      row.payment_gateway_status === 'CONNECTED'
        ? 'CONNECTED'
        : 'CASHFREE_NOT_CONNECTED',
    fulfillmentStatus: String(
      row.fulfillment_status ?? 'New Order'
    ) as OrderFulfillmentStatus,
    shippingDetails,
    paymentDetails: Object.keys(paymentDetails).length
      ? {
          status:
            paymentDetails.status === 'Paid' ||
            paymentDetails.status === 'Payment Collected' ||
            paymentDetails.status === 'Refunded'
              ? paymentDetails.status
              : 'Unpaid',
          collectedAmountInr: Number(paymentDetails.collectedAmountInr ?? 0),
          collectionDate:
            typeof paymentDetails.collectionDate === 'string'
              ? paymentDetails.collectionDate
              : undefined,
          confirmedByAdminName:
            typeof paymentDetails.confirmedByAdminName === 'string'
              ? paymentDetails.confirmedByAdminName
              : undefined,
          confirmedByAdminEmail:
            typeof paymentDetails.confirmedByAdminEmail === 'string'
              ? paymentDetails.confirmedByAdminEmail
              : undefined,
          confirmedAt:
            typeof paymentDetails.confirmedAt === 'string'
              ? paymentDetails.confirmedAt
              : undefined,
          note:
            typeof paymentDetails.note === 'string' ? paymentDetails.note : undefined,
        }
      : undefined,
    paymentHistory: rawPayments
      .map(mapOrderPaymentRow)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    notifications: rawNotifs
      .map(mapOrderNotificationRow)
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    statusHistory: rawHistory
      .map(mapOrderStatusHistoryRow)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    receipt: receiptRaw,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function mapCustomerRow(row: Record<string, unknown>): RegisteredCustomer {
  return {
    id: String(row.id ?? ''),
    fullName: String(row.full_name ?? 'GiftKart Customer'),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    defaultCity: String(row.default_city ?? 'Jalchak'),
    status: row.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
    registeredAt: String(row.registered_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function mapCustomerRowToAccount(
  row: Record<string, unknown>,
  signedInAt?: string
): CustomerDemoAccount {
  return {
    id: String(row.id ?? ''),
    fullName: String(row.full_name ?? 'GiftKart Customer'),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    defaultCity: String(row.default_city ?? 'Jalchak'),
    avatarUrl:
      typeof row.avatar_url === 'string' && row.avatar_url ? row.avatar_url : undefined,
    whatsappUpdatesOn: row.whatsapp_updates_on !== false,
    orderUpdatesOn: row.order_updates_on !== false,
    offersOn: row.offers_on !== false,
    isDemoMode: false,
    signedInAt: signedInAt ?? String(row.updated_at ?? new Date().toISOString()),
  };
}

export function mapSavedAddressRow(row: Record<string, unknown>): SavedAddress {
  return {
    id: String(row.id ?? ''),
    label: String(row.label ?? 'Home'),
    fullName: String(row.full_name ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    addressLine1: String(row.address_line1 ?? ''),
    area: String(row.area ?? ''),
    landmark: typeof row.landmark === 'string' && row.landmark ? row.landmark : undefined,
    deliveryZoneId: String(row.delivery_zone_id ?? 'zone-jalchak'),
    city: String(row.city ?? 'Jalchak'),
    state: String(row.state ?? 'West Bengal'),
    pincode: String(row.pincode ?? ''),
    isDefault: Boolean(row.is_default),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapProductReviewRow(row: Record<string, unknown>): ProductReview {
  return {
    id: String(row.id ?? ''),
    productId: String(row.product_id ?? ''),
    productName: String(row.product_name ?? ''),
    orderId: typeof row.order_id === 'string' && row.order_id ? row.order_id : undefined,
    orderNumber:
      typeof row.order_number === 'string' && row.order_number
        ? row.order_number
        : undefined,
    customerId:
      typeof row.customer_id === 'string' && row.customer_id
        ? row.customer_id
        : undefined,
    customerEmail:
      typeof row.customer_email === 'string' && row.customer_email
        ? row.customer_email
        : undefined,
    customerPhone:
      typeof row.customer_phone === 'string' && row.customer_phone
        ? row.customer_phone
        : undefined,
    authorName: String(row.author_name ?? 'Verified Customer'),
    rating: Math.min(5, Math.max(1, Number(row.rating ?? 5))),
    comment: String(row.comment ?? ''),
    photos: Array.isArray(row.photos)
      ? row.photos.filter((p): p is string => typeof p === 'string')
      : [],
    verifiedPurchase: row.verified_purchase !== false,
    isSampleData: false,
    isApproved: row.is_approved !== false,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt:
      typeof row.updated_at === 'string' ? row.updated_at : undefined,
  };
}

export function mapNewsletterRow(row: Record<string, unknown>): NewsletterSubscriber {
  return {
    id: String(row.id ?? ''),
    email: String(row.email ?? ''),
    subscribedAt: String(row.subscribed_at ?? new Date().toISOString()),
  };
}

export function mapActivityLogRow(row: Record<string, unknown>): AdminActivityLog {
  return {
    id: String(row.id ?? ''),
    action: String(row.action ?? ''),
    target: String(row.target ?? ''),
    actorEmail: String(row.actor_email ?? ''),
    timestamp: String(row.timestamp ?? new Date().toISOString()),
  };
}
