import type { LucideIcon } from 'lucide-react';
import {
  Candy,
  Coffee,
  Gift,
  Heart,
  Home,
  Image as ImageIcon,
  KeyRound,
  Lightbulb,
  Package,
  Shirt,
  ShoppingBag,
} from 'lucide-react';
import type { Category, OrderFulfillmentStatus, Product, SavedAddress } from '../types';
import { STUDIO_MEDIA } from '../config/appConfig';

/* ============================================================================
 * 1. SHARED CURATED CATEGORIES (Matches Mobile Categories & Shop by Category)
 *    - No subcategories on customer storefront
 *    - Empty categories (0 available in-stock active products) are hidden
 *    - Includes Unique Chocolates
 * ========================================================================== */

export type SidebarCategoryKey =
  | 'all-gifts'
  | 'coffee-mugs'
  | 'tshirt-prints'
  | 'photo-frames'
  | 'led-lighting-gifts'
  | 'cushions'
  | 'gift-boxes-hampers'
  | 'gift-bags'
  | 'home-decor-gifts'
  | 'keychains'
  | 'unique-chocolates';

export interface CuratedCategoryConfig {
  id: SidebarCategoryKey;
  label: string;
  Icon: LucideIcon;
  artworkUrl: string;
  isPngArtwork: boolean;
  matchesCategory: (category: Category) => boolean;
}

export const ORDERED_SIDEBAR_CATEGORIES: CuratedCategoryConfig[] = [
  {
    id: 'all-gifts',
    label: 'All Gifts',
    Icon: Gift,
    artworkUrl:
      '/assets/aistudio/Glossy_Purple_Gift_Box_with_Golden_Bow-edited_09de3fec.png',
    isPngArtwork: true,
    matchesCategory: () => true,
  },
  {
    id: 'coffee-mugs',
    label: 'Coffee Mugs',
    Icon: Coffee,
    artworkUrl: '/assets/aistudio/Festive_Red_Ribbon_Coffee_Mug_195c9bba.png',
    isPngArtwork: true,
    matchesCategory: (cat) =>
      cat.id === 'cat-coffee-mug' ||
      cat.slug === 'coffee-mug' ||
      cat.slug === 'coffee-mugs' ||
      /coffee\s*mug/i.test(cat.name),
  },
  {
    id: 'tshirt-prints',
    label: 'T-Shirt Prints',
    Icon: Shirt,
    artworkUrl:
      '/assets/aistudio/Tropical_Sunset_T-Shirt_on_Golden_Display_cf5d3e8e.png',
    isPngArtwork: true,
    matchesCategory: (cat) =>
      cat.id === 'cat-tshirt-print' ||
      cat.slug === 't-shirt-print' ||
      cat.slug === 't-shirt-prints' ||
      /t[-\s]?shirt/i.test(cat.name),
  },
  {
    id: 'photo-frames',
    label: 'Photo Frames',
    Icon: ImageIcon,
    artworkUrl:
      '/assets/aistudio/Romantic_Framed_Couple_on_Golden_Pedestal_ac3f2968.png',
    isPngArtwork: true,
    matchesCategory: (cat) =>
      cat.id === 'cat-photo-frame' ||
      cat.slug === 'photo-frame' ||
      cat.slug === 'photo-frames' ||
      /photo\s*frame/i.test(cat.name),
  },
  {
    id: 'led-lighting-gifts',
    label: 'LED Lighting Gifts',
    Icon: Lightbulb,
    artworkUrl:
      '/assets/aistudio/Romantic_Moonlight_Couple_Lamp_Gift_Set_a4d8a6f1.png',
    isPngArtwork: true,
    matchesCategory: (cat) =>
      cat.id === 'cat-led-lighting' ||
      cat.slug === 'led-lighting-gifts' ||
      /led|lighting/i.test(cat.name),
  },
  {
    id: 'cushions',
    label: 'Cushions',
    Icon: Heart,
    artworkUrl:
      '/assets/aistudio/Cuddling_Couple_Pillow_on_Golden_Pedestal_402804e5.png',
    isPngArtwork: true,
    matchesCategory: (cat) =>
      cat.id === 'cat-cushions' ||
      cat.slug === 'cushions' ||
      cat.slug === 'cushion' ||
      /cushion/i.test(cat.name),
  },
  {
    id: 'gift-boxes-hampers',
    label: 'Gift Boxes & Hampers',
    Icon: Package,
    artworkUrl:
      '/assets/aistudio/Luxury_Purple_Valentine_Gift_Hamper_7db1384e.png',
    isPngArtwork: true,
    matchesCategory: (cat) =>
      cat.id === 'cat-gift-box' ||
      cat.slug === 'gift-box' ||
      cat.slug === 'gift-boxes-hampers' ||
      /gift\s*box|hamper/i.test(cat.name),
  },
  {
    id: 'gift-bags',
    label: 'Gift Bags',
    Icon: ShoppingBag,
    artworkUrl:
      '/assets/aistudio/GiftKart_Floral_Luxury_Gift_Bag_6f56e4fd.png',
    isPngArtwork: true,
    matchesCategory: (cat) =>
      cat.id === 'cat-gift-bag' ||
      cat.slug === 'gift-bag' ||
      cat.slug === 'gift-bags' ||
      /gift\s*bag/i.test(cat.name),
  },
  {
    id: 'home-decor-gifts',
    label: 'Home Decor Gifts',
    Icon: Home,
    artworkUrl:
      '/assets/aistudio/Warm_Buddha_Moonlight_Decor_Display_c24a114f.png',
    isPngArtwork: true,
    matchesCategory: (cat) =>
      cat.id === 'cat-home-decor' ||
      cat.slug === 'home-decor-gifts' ||
      /home\s*decor/i.test(cat.name),
  },
  {
    id: 'keychains',
    label: 'Keychains',
    Icon: KeyRound,
    artworkUrl:
      '/assets/aistudio/Golden_Pedestal_Keychain_Collection_b507d441.png',
    isPngArtwork: true,
    matchesCategory: (cat) =>
      cat.id === 'cat-keychain' ||
      cat.slug === 'keychain' ||
      cat.slug === 'keychains' ||
      /key\s*chain/i.test(cat.name),
  },
  {
    id: 'unique-chocolates',
    label: 'Unique Chocolates',
    Icon: Candy,
    artworkUrl: STUDIO_MEDIA.giftBox,
    isPngArtwork: false,
    matchesCategory: (cat) =>
      cat.id === 'cat-unique-chocolates' ||
      cat.slug === 'unique-chocolates' ||
      cat.slug === 'chocolates' ||
      /chocolate/i.test(cat.name),
  },
];

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
  id: string;
  label: string;
  Icon: LucideIcon;
  artworkUrl: string;
  isPngArtwork: boolean;
  products: Product[];
}

/**
 * Returns ordered categories for Storefront (All Gifts + curated non-empty categories
 * + any extra custom admin categories that have >= 1 active in-stock product).
 */
export function buildPopulatedCategoryGroups(
  categories: Category[],
  products: Product[]
): PopulatedCategoryGroup[] {
  const available = getAvailableStorefrontProducts(products);
  const activeCategories = categories.filter((c) => c.isActive);
  const matchedCatIdsGlobal = new Set<string>();
  const groups: PopulatedCategoryGroup[] = [];

  for (const def of ORDERED_SIDEBAR_CATEGORIES) {
    if (def.id === 'all-gifts') {
      groups.push({
        id: def.id,
        label: def.label,
        Icon: def.Icon,
        artworkUrl: def.artworkUrl,
        isPngArtwork: def.isPngArtwork,
        products: available,
      });
      continue;
    }

    const matchingCats = activeCategories.filter((c) => def.matchesCategory(c));
    const matchingIds = new Set(matchingCats.map((c) => c.id));
    matchingCats.forEach((c) => matchedCatIdsGlobal.add(c.id));

    const matchedProducts = available.filter((p) => matchingIds.has(p.categoryId));
    if (matchedProducts.length > 0) {
      groups.push({
        id: def.id,
        label: def.label,
        Icon: def.Icon,
        artworkUrl: matchingCats[0]?.imageUrl && !def.isPngArtwork ? matchingCats[0].imageUrl : def.artworkUrl,
        isPngArtwork: def.isPngArtwork,
        products: matchedProducts,
      });
    }
  }

  // Also include any newly added active admin categories that have >= 1 available product
  for (const cat of activeCategories) {
    if (matchedCatIdsGlobal.has(cat.id)) continue;
    const catProducts = available.filter((p) => p.categoryId === cat.id);
    if (catProducts.length > 0) {
      groups.push({
        id: cat.slug,
        label: cat.name,
        Icon: Gift,
        artworkUrl: cat.imageUrl || STUDIO_MEDIA.giftBox,
        isPngArtwork: false,
        products: catProducts,
      });
    }
  }

  return groups;
}

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

export function cleanWhatsAppDigits(rawPhone?: string): string {
  const digits = (rawPhone ?? '919382040746').replace(/\D/g, '');
  if (!digits) return '919382040746';
  return digits.length === 10 ? `91${digits}` : digits;
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
    case 'Demo Placed':
      return 'Order Placed';
    case 'Confirmed':
    case 'Preparing':
      return 'Processing';
    case 'Out for Delivery':
      return 'Shipped';
    case 'Delivered':
      return 'Delivered';
    case 'Cancelled':
      return 'Cancelled';
    default:
      return 'Order Placed';
  }
}

export function canCustomerCancelOrder(status: OrderFulfillmentStatus): boolean {
  // Strictly allowed ONLY before Processing starts
  return status === 'Demo Placed';
}

export function getOrderTimelineStepIndex(status: OrderFulfillmentStatus): number {
  switch (status) {
    case 'Demo Placed':
      return 0;
    case 'Confirmed':
    case 'Preparing':
      return 1;
    case 'Out for Delivery':
      return 2;
    case 'Delivered':
      return 3;
    case 'Cancelled':
      return -1;
    default:
      return 0;
  }
}

export function getOrderStatusBadgeClasses(status: OrderFulfillmentStatus): string {
  const label = getCustomerOrderStatusLabel(status);
  switch (label) {
    case 'Delivered':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'Shipped':
      return 'bg-sky-50 text-sky-700 border border-sky-200';
    case 'Processing':
      return 'bg-[#F4EBFF] text-[#6A11CB] border border-[#EBD8FF]';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-amber-50 text-amber-800 border border-amber-200';
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

export function pickSavedAddress(addresses: SavedAddress[]): SavedAddress | null {
  const valid = addresses.filter(isValidSavedAddress);
  if (valid.length === 0) return null;
  return valid.find((a) => a.isDefault) ?? valid[0];
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
