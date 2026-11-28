import type { LucideIcon } from 'lucide-react';
import {
  Coffee,
  CreditCard,
  Gift,
  Home,
  Image as ImageIcon,
  KeyRound,
  Lightbulb,
  Package,
  Shirt,
  Sparkles,
} from 'lucide-react';
import type { Category, OrderFulfillmentStatus, Product, SavedAddress } from '../types';
import { STUDIO_MEDIA } from '../config/appConfig';
import { ALL_GIFTS_CATEGORY_ID } from '../config/seedData';

/* ============================================================================
 * 1. CENTRALIZED STOREFRONT CATEGORY ENGINE (Single Source of Truth)
 *    - Synchronized dynamically with useCategories() across Mobile, Desktop & Admin
 *    - Displays all active categories in exact sortOrder (exact 10 official categories)
 * ========================================================================== */

export interface CategoryPresentation {
  Icon: LucideIcon;
  artworkUrl: string;
  isPngArtwork: boolean;
}

const CATEGORY_ICON_BY_ID: Record<string, LucideIcon> = {
  [ALL_GIFTS_CATEGORY_ID]: Gift,
  'cat-photo-frame': ImageIcon,
  'cat-coffee-mugs': Coffee,
  'cat-tshirt-prints': Shirt,
  'cat-home-decor': Home,
  'cat-hand-made': Sparkles,
  'cat-keychain': KeyRound,
  'cat-gifts-bag-box': Package,
  'cat-led-lighting': Lightbulb,
  'cat-pvc-card': CreditCard,
};

const CATEGORY_DEFAULT_ARTWORK_BY_ID: Record<
  string,
  { url: string; isPng: boolean }
> = {
  [ALL_GIFTS_CATEGORY_ID]: {
    url: '/assets/aistudio/Glossy_Purple_Gift_Box_with_Golden_Bow-edited_09de3fec.webp',
    isPng: true,
  },
  'cat-photo-frame': {
    url: '/assets/aistudio/Romantic_Framed_Couple_on_Golden_Pedestal_ac3f2968.webp',
    isPng: true,
  },
  'cat-coffee-mugs': {
    url: '/assets/aistudio/Festive_Red_Ribbon_Coffee_Mug_195c9bba.webp',
    isPng: true,
  },
  'cat-tshirt-prints': {
    url: '/assets/aistudio/Tropical_Sunset_T-Shirt_on_Golden_Display_cf5d3e8e.webp',
    isPng: true,
  },
  'cat-home-decor': {
    url: '/assets/aistudio/Warm_Buddha_Moonlight_Decor_Display_c24a114f.webp',
    isPng: true,
  },
  'cat-hand-made': {
    url: STUDIO_MEDIA.handmadeGift,
    isPng: false,
  },
  'cat-keychain': {
    url: '/assets/aistudio/Golden_Pedestal_Keychain_Collection_b507d441.webp',
    isPng: true,
  },
  'cat-gifts-bag-box': {
    url: '/assets/aistudio/Luxury_Purple_Valentine_Gift_Hamper_7db1384e.webp',
    isPng: true,
  },
  'cat-led-lighting': {
    url: '/assets/aistudio/Romantic_Moonlight_Couple_Lamp_Gift_Set_a4d8a6f1.webp',
    isPng: true,
  },
  'cat-pvc-card': {
    url: STUDIO_MEDIA.pvcCard,
    isPng: false,
  },
};

export function isAllGiftsCategory(
  category: Pick<Category, 'id' | 'slug'> | undefined | null
): boolean {
  if (!category) return false;
  return (
    category.id === ALL_GIFTS_CATEGORY_ID ||
    category.slug.trim().toLowerCase() === 'all-gifts'
  );
}

function normalizeLegacyAssetUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('/assets/aistudio/') && trimmed.endsWith('.png') && !trimmed.includes('GiftKart_Gift_Cart_Logo_604a8052')) {
    return trimmed.replace(/\.png$/i, '.webp');
  }
  if (trimmed.startsWith('/src/assets/images/')) {
    return trimmed.replace(/^\/src\/assets\/images\//, '/assets/images/').replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  return trimmed;
}

export function getCategoryPresentation(category: Category): CategoryPresentation {
  const defaultMeta = CATEGORY_DEFAULT_ARTWORK_BY_ID[category.id];
  const rawUrl = category.imageUrl?.trim() || defaultMeta?.url || STUDIO_MEDIA.giftBox;
  const resolvedUrl = normalizeLegacyAssetUrl(rawUrl);
  const lower = resolvedUrl.toLowerCase();
  const isPng =
    lower.endsWith('.png') ||
    lower.startsWith('/assets/aistudio/') ||
    Boolean(defaultMeta?.isPng && resolvedUrl === defaultMeta.url);
  const Icon = CATEGORY_ICON_BY_ID[category.id] ?? Gift;

  return {
    Icon,
    artworkUrl: resolvedUrl,
    isPngArtwork: isPng,
  };
}

/**
 * Resolves a URL category slug/query parameter safely against active categories,
 * supporting minor legacy URL bookmarks cleanly without exposing old categories.
 */
const URL_SLUG_COMPAT_MAP: Record<string, string> = {
  'all-gifts': 'all-gifts',
  'photo-frame': 'photo-frame',
  'photo-frames': 'photo-frame',
  'coffee-mugs': 'coffee-mugs',
  'coffee-mug': 'coffee-mugs',
  't-shirt-prints': 't-shirt-prints',
  't-shirt-print': 't-shirt-prints',
  'tshirt-prints': 't-shirt-prints',
  'home-decor': 'home-decor',
  'home-decor-gifts': 'home-decor',
  'hand-made': 'hand-made',
  'handmade-gift': 'hand-made',
  'handmade-gifts': 'hand-made',
  keychain: 'keychain',
  keychains: 'keychain',
  'gifts-bag-box': 'gifts-bag-box',
  'gift-box': 'gifts-bag-box',
  'gift-bag': 'gifts-bag-box',
  'gift-bags': 'gifts-bag-box',
  'gift-boxes-hampers': 'gifts-bag-box',
  'led-lighting': 'led-lighting',
  'led-lighting-gifts': 'led-lighting',
  'pvc-card': 'pvc-card',
  'pvc-cards': 'pvc-card',
};

export function resolveCategoryBySlug(
  rawSlug: string | null | undefined,
  categories: Category[]
): Category | undefined {
  const normalized = (rawSlug ?? '').trim().toLowerCase();
  if (!normalized) return undefined;

  const exact = categories.find(
    (c) =>
      c.slug.trim().toLowerCase() === normalized ||
      c.id.trim().toLowerCase() === normalized
  );
  if (exact) return exact;

  const mappedSlug = URL_SLUG_COMPAT_MAP[normalized];
  if (mappedSlug) {
    return categories.find((c) => c.slug.trim().toLowerCase() === mappedSlug);
  }
  return undefined;
}

export function deduplicateProducts(list: Product[]): Product[] {
  const seen = new Set<string>();
  const unique: Product[] = [];
  for (const product of list) {
    if (!seen.has(product.id)) {
      seen.add(product.id);
      unique.push(product);
    }
  }
  return unique;
}

export function getAvailableStorefrontProducts(products: Product[]): Product[] {
  return deduplicateProducts(
    products.filter((p) => p.isActive && !p.isArchived && p.stockCount > 0)
  );
}

export interface PopulatedCategoryGroup {
  /** URL-friendly canonical slug used in ?cat= and /category/:slug */
  id: string;
  categoryId: string;
  slug: string;
  label: string;
  isAllGifts: boolean;
  Icon: LucideIcon;
  artworkUrl: string;
  isPngArtwork: boolean;
  products: Product[];
}

/**
 * Single centralized builder used across Mobile Home, Desktop Home,
 * Mobile Categories, Desktop Categories, and Product Listing tabs.
 * Returns every active category in exact sortOrder synchronized with Admin Panel.
 */
export function buildStorefrontCategoryGroups(
  categories: Category[],
  products: Product[]
): PopulatedCategoryGroup[] {
  const available = getAvailableStorefrontProducts(products);
  const activeCategories = [...categories]
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return activeCategories.map((cat) => {
    const allGifts = isAllGiftsCategory(cat);
    const presentation = getCategoryPresentation(cat);
    const matchedProducts = allGifts
      ? available
      : available.filter((p) => p.categoryId === cat.id);

    return {
      id: cat.slug,
      categoryId: cat.id,
      slug: cat.slug,
      label: cat.name,
      isAllGifts: allGifts,
      Icon: presentation.Icon,
      artworkUrl: presentation.artworkUrl,
      isPngArtwork: presentation.isPngArtwork,
      products: matchedProducts,
    };
  });
}

// Exported alias for seamless compatibility across all storefront modules
export const buildPopulatedCategoryGroups = buildStorefrontCategoryGroups;

/* ============================================================================
 * 2. PRODUCT VARIANTS & PERSONALIZATION HELPERS (Matches Mobile PDP rules)
 * ========================================================================== */

const HIDDEN_VARIANT_NAMES = new Set(['capacity', 'handle style']);

export function getVisibleVariantGroups(product: Product) {
  return (product.variants ?? []).filter(
    (group) =>
      group.options.length > 1 &&
      !HIDDEN_VARIANT_NAMES.has(group.name.trim().toLowerCase())
  );
}

export function isProductPersonalized(product: Product): boolean {
  return Boolean(product.supportsPersonalization || product.supportsPhotoUpload);
}

const LEGACY_PLACEHOLDER_PHONE_DIGITS = new Set([
  '9876543210',
  '919876543210',
  '9800000000',
  '919800000000',
  '9000000000',
  '919000000000',
  '9999999999',
  '919999999999',
  '1234567890',
  '911234567890',
  '0000000000',
  '910000000000',
]);

const LEGACY_EMAIL_PATTERN =
  /@(giftkart\.in|giftkart\.com|example\.com)$|^(support|care|info|contact|help|hello)@giftkart\./i;

export const OFFICIAL_GIFTKART_EMAIL = 'hello.giftkart@gmail.com';
export const OFFICIAL_GIFTKART_PHONE = '+91 9239505791';
export const OFFICIAL_GIFTKART_WHATSAPP_DIGITS = '919239505791';
export const OFFICIAL_GIFTKART_WHATSAPP_URL = 'https://wa.me/919239505791';
export const STORE_CONTACT_MIGRATION_VERSION = 2;

export function cleanWhatsAppDigits(rawPhone?: string): string {
  const digits = (rawPhone ?? OFFICIAL_GIFTKART_WHATSAPP_DIGITS).replace(/\D/g, '');
  if (!digits || digits.length < 10 || LEGACY_PLACEHOLDER_PHONE_DIGITS.has(digits)) {
    return OFFICIAL_GIFTKART_WHATSAPP_DIGITS;
  }
  return digits.length === 10 ? `91${digits}` : digits;
}

export function normalizeOfficialContactFields(input: {
  supportEmail?: string;
  supportPhone?: string;
  contactVersion?: number;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    youtube?: string;
  };
}): {
  supportEmail: string;
  supportPhone: string;
  whatsappUrl: string;
  contactVersion: number;
  migrated: boolean;
} {
  const currentVersion =
    typeof input.contactVersion === 'number' ? input.contactVersion : 0;
  const needsVersionMigration = currentVersion < STORE_CONTACT_MIGRATION_VERSION;

  if (needsVersionMigration) {
    return {
      supportEmail: OFFICIAL_GIFTKART_EMAIL,
      supportPhone: OFFICIAL_GIFTKART_PHONE,
      whatsappUrl: OFFICIAL_GIFTKART_WHATSAPP_URL,
      contactVersion: STORE_CONTACT_MIGRATION_VERSION,
      migrated: true,
    };
  }

  const rawEmail = (input.supportEmail ?? '').trim();
  const isLegacyEmail = !rawEmail || LEGACY_EMAIL_PATTERN.test(rawEmail);
  const supportEmail = isLegacyEmail ? OFFICIAL_GIFTKART_EMAIL : rawEmail;

  const rawPhone = (input.supportPhone ?? '').trim();
  const rawPhoneDigits = rawPhone.replace(/\D/g, '');
  const isLegacyPhone =
    !rawPhone ||
    rawPhoneDigits.length < 10 ||
    LEGACY_PLACEHOLDER_PHONE_DIGITS.has(rawPhoneDigits);
  const supportPhone = isLegacyPhone ? OFFICIAL_GIFTKART_PHONE : rawPhone;

  const normalizedDigits = cleanWhatsAppDigits(supportPhone);
  const rawWhatsapp = (input.socialLinks?.whatsapp ?? '').trim();
  const rawWaDigits = rawWhatsapp.replace(/\D/g, '');
  const isLegacyWa =
    !rawWhatsapp ||
    !rawWaDigits ||
    rawWaDigits.length < 10 ||
    LEGACY_PLACEHOLDER_PHONE_DIGITS.has(rawWaDigits);
  const whatsappUrl = isLegacyWa
    ? `https://wa.me/${normalizedDigits}`
    : rawWhatsapp;

  const migrated =
    supportEmail !== rawEmail ||
    supportPhone !== rawPhone ||
    whatsappUrl !== rawWhatsapp;

  return {
    supportEmail,
    supportPhone,
    whatsappUrl,
    contactVersion: STORE_CONTACT_MIGRATION_VERSION,
    migrated,
  };
}

export function buildWhatsAppPersonalizationUrl(
  rawPhone: string | undefined,
  productName: string,
  sku: string,
  selectedVariants: Record<string, string>
): string {
  const digits = cleanWhatsAppDigits(rawPhone);
  const variantSummary = Object.entries(selectedVariants)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  const message = [
    'Hello GiftKart Team,',
    `I would like to personalize "${productName}" (SKU: ${sku}).`,
    variantSummary ? `Selected Options: ${variantSummary}` : '',
    'Here are my customization details / photos:',
  ]
    .filter(Boolean)
    .join('\n');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppSupportUrl(
  rawPhone: string | undefined,
  customerName: string,
  customerEmail: string,
  issueText: string,
  topic?: string
): string {
  const digits = cleanWhatsAppDigits(rawPhone);
  const lines = [
    'Hello GiftKart Support Team,',
    `Name: ${customerName}`,
    customerEmail ? `Email: ${customerEmail}` : '',
    topic ? `Topic: ${topic}` : '',
    issueText.trim()
      ? `Issue Details: ${issueText.trim()}`
      : 'I need assistance with my GiftKart order / account.',
  ].filter(Boolean);
  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/* ============================================================================
 * 3. ORDER STATUS & TIMELINE HELPERS (Matches Mobile Orders Rules)
 * ========================================================================== */

export type CustomerOrderDisplayStatus =
  | 'Order Placed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export function getCustomerOrderStatusLabel(
  status: OrderFulfillmentStatus
): CustomerOrderDisplayStatus {
  switch (status) {
    case 'New Order':
    case 'New':
    case 'Demo Placed':
    case 'Confirmed':
      return 'Order Placed';
    case 'Processing':
    case 'Preparing':
    case 'Packed':
      return 'Processing';
    case 'Shipped':
    case 'In Transit':
    case 'Out for Delivery':
      return 'Shipped';
    case 'Completed':
    case 'Delivered':
      return 'Delivered';
    case 'Cancelled':
    case 'Delivery Failed':
    case 'Returned':
      return 'Cancelled';
    default:
      return 'Order Placed';
  }
}

export function canCustomerCancelOrder(status: OrderFulfillmentStatus): boolean {
  // Strictly allowed ONLY before Processing starts
  return status === 'New Order' || status === 'New' || status === 'Demo Placed';
}

export function getOrderTimelineStepIndex(status: OrderFulfillmentStatus): number {
  switch (status) {
    case 'New Order':
    case 'New':
    case 'Demo Placed':
    case 'Confirmed':
      return 0;
    case 'Processing':
    case 'Preparing':
    case 'Packed':
      return 1;
    case 'Shipped':
    case 'In Transit':
    case 'Out for Delivery':
      return 2;
    case 'Completed':
    case 'Delivered':
      return 3;
    case 'Cancelled':
    case 'Delivery Failed':
    case 'Returned':
      return -1;
    default:
      return 0;
  }
}

export function getOrderStatusBadgeClasses(status: OrderFulfillmentStatus): string {
  const label = getCustomerOrderStatusLabel(status);
  switch (label) {
    case 'Delivered':
      return 'bg-[#6A11CB] text-white border border-[#6A11CB]';
    case 'Shipped':
      return 'bg-[#FFF0F6] text-[#FF4D8D] border border-[#FF4D8D]/35';
    case 'Processing':
      return 'bg-[#F3E5FF] text-[#540CA6] border border-[#D8B4FE]';
    case 'Cancelled':
      return 'bg-[#FFF0F6] text-[#B8205B] border border-[#FF4D8D]/40';
    default:
      return 'bg-[#F8F2FF] text-[#6A11CB] border border-[#EBD8FF]';
  }
}

/* ============================================================================
 * 4. ADDRESS & PINCODE HELPERS (Matches Mobile Checkout & Saved Addresses)
 * ========================================================================== */

export type AddressTypeOption = 'Home' | 'Work' | 'Other';

export interface PinLookupResult {
  state: string;
  city?: string;
  area?: string;
}

const EXACT_PIN_DIRECTORY: Record<string, PinLookupResult> = {
  '721155': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Jalchak' },
  '721101': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Medinipur' },
  '721102': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Medinipur' },
  '721301': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Kharagpur' },
  '721302': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'IIT Kharagpur' },
  '721131': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Pingla' },
  '721140': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Sabang' },
  '721126': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Debra' },
  '721146': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Ghatal' },
  '721602': { state: 'West Bengal', city: 'Purba Medinipur', area: 'Haldia' },
  '721636': { state: 'West Bengal', city: 'Purba Medinipur', area: 'Tamluk' },
  '700156': { state: 'West Bengal', city: 'Kolkata', area: 'New Town' },
  '700091': { state: 'West Bengal', city: 'Kolkata', area: 'Salt Lake' },
  '700001': { state: 'West Bengal', city: 'Kolkata', area: 'BBD Bagh' },
  '711101': { state: 'West Bengal', city: 'Howrah', area: 'Howrah Maidan' },
  '713216': { state: 'West Bengal', city: 'Paschim Bardhaman', area: 'Durgapur' },
};

const STATE_BY_PIN_PREFIX: Array<{ prefixes: string[]; state: string }> = [
  { prefixes: ['11'], state: 'Delhi' },
  { prefixes: ['12', '13'], state: 'Haryana' },
  { prefixes: ['14', '15', '16'], state: 'Punjab' },
  { prefixes: ['17'], state: 'Himachal Pradesh' },
  { prefixes: ['18', '19'], state: 'Jammu & Kashmir' },
  { prefixes: ['20', '21', '22', '23', '24', '25', '26', '27', '28'], state: 'Uttar Pradesh' },
  { prefixes: ['30', '31', '32', '33', '34'], state: 'Rajasthan' },
  { prefixes: ['36', '37', '38', '39'], state: 'Gujarat' },
  { prefixes: ['40', '41', '42', '43', '44'], state: 'Maharashtra' },
  { prefixes: ['45', '46', '47', '48'], state: 'Madhya Pradesh' },
  { prefixes: ['49'], state: 'Chhattisgarh' },
  { prefixes: ['50'], state: 'Telangana' },
  { prefixes: ['51', '52', '53'], state: 'Andhra Pradesh' },
  { prefixes: ['56', '57', '58', '59'], state: 'Karnataka' },
  { prefixes: ['60', '61', '62', '63', '64'], state: 'Tamil Nadu' },
  { prefixes: ['67', '68', '69'], state: 'Kerala' },
  { prefixes: ['70', '71', '72', '73', '74'], state: 'West Bengal' },
  { prefixes: ['75', '76', '77'], state: 'Odisha' },
  { prefixes: ['78'], state: 'Assam' },
  { prefixes: ['79'], state: 'North East India' },
  { prefixes: ['80', '81', '82', '83', '84', '85'], state: 'Bihar' },
];

export const INDIAN_STATES = [
  'West Bengal',
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
];

export function lookupIndianPin(pin: string): PinLookupResult | null {
  if (!/^\d{6}$/.test(pin)) return null;
  if (EXACT_PIN_DIRECTORY[pin]) return EXACT_PIN_DIRECTORY[pin];
  const prefix2 = pin.slice(0, 2);
  const found = STATE_BY_PIN_PREFIX.find((entry) => entry.prefixes.includes(prefix2));
  return found ? { state: found.state } : null;
}

export function normalizeAddressType(label?: string): AddressTypeOption {
  const lower = (label ?? '').trim().toLowerCase();
  if (lower === 'work' || lower === 'office') return 'Work';
  if (lower === 'home' || !lower) return 'Home';
  return 'Other';
}

export function formatFullAddress(addr: SavedAddress): string {
  const parts = [
    addr.addressLine1,
    addr.landmark,
    addr.area,
    addr.city,
    addr.state,
  ]
    .map((p) => (p ?? '').trim())
    .filter(Boolean);

  const uniqueParts = parts.filter(
    (part, index) =>
      index === 0 || part.toLowerCase() !== parts[index - 1].toLowerCase()
  );
  const joined = uniqueParts.join(', ');
  return addr.pincode ? `${joined} - ${addr.pincode}` : joined;
}

export function isValidSavedAddress(addr: SavedAddress | undefined | null): addr is SavedAddress {
  if (!addr) return false;
  return Boolean(
    addr.fullName?.trim() &&
      addr.phone?.replace(/\D/g, '').length >= 10 &&
      addr.addressLine1?.trim() &&
      /^\d{6}$/.test(addr.pincode?.trim() ?? '')
  );
}

export function pickSavedAddress(
  addresses: SavedAddress[],
  preferredId?: string | null
): SavedAddress | null {
  const valid = addresses.filter(isValidSavedAddress);
  if (valid.length === 0) return null;
  return (
    (preferredId ? valid.find((a) => a.id === preferredId) : undefined) ??
    valid.find((a) => a.isDefault) ??
    valid[0]
  );
}

/* ============================================================================
 * 5. ADMIN CUSTOMER STATUS PERSISTENCE (Firebase-ready local client store)
 * ========================================================================== */

const CUSTOMER_STATUS_KEY = 'giftkart_admin_customer_status_v1';

export type CustomerAccountStatus = 'Active' | 'Blocked';

export function loadCustomerStatusMap(): Record<string, CustomerAccountStatus> {
  try {
    const raw = window.localStorage.getItem(CUSTOMER_STATUS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CustomerAccountStatus>;
  } catch {
    return {};
  }
}

export function saveCustomerStatusMap(
  map: Record<string, CustomerAccountStatus>
): void {
  try {
    window.localStorage.setItem(CUSTOMER_STATUS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

/**
 * Checks whether React Router has at least one previous in-app history entry
 * before calling navigate(-1), preventing Back buttons from exiting the website
 * when a page is opened directly in a fresh browser tab.
 */
export function canNavigateBackInApp(): boolean {
  if (typeof window === 'undefined') return false;
  const state = window.history.state as { idx?: number } | null;
  if (typeof state?.idx === 'number') {
    return state.idx > 0;
  }
  return window.history.length > 2;
}

