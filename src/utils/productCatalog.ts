import type { Category, Product, ProductAvailability } from '../types';

export interface ProductAuditFlag {
  code:
    | 'SAMPLE_OR_TEST'
    | 'DUPLICATE_SKU'
    | 'DUPLICATE_SLUG'
    | 'INVALID_PRICE'
    | 'MISSING_IMAGE'
    | 'MISSING_CATEGORY'
    | 'ARCHIVED';
  label: string;
}

export interface ProductAuditEntry {
  productId: string;
  flags: ProductAuditFlag[];
  needsReview: boolean;
  eligibleForStorefront: boolean;
}

const SAMPLE_NAME_PATTERN = /\b(test|sample|demo|dummy|placeholder|lorem)\b/i;

export function getProductAvailability(product: Product): ProductAvailability {
  if (product.availability) return product.availability;
  return product.stockCount > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
}

export function getAvailabilityLabel(product: Product): string {
  const status = getProductAvailability(product);
  if (status === 'PREORDER') return 'Pre-order';
  if (status === 'OUT_OF_STOCK' || product.stockCount <= 0) return 'Out of Stock';
  if (product.stockCount <= 12) return 'Low Stock';
  return 'In Stock';
}

/**
 * Audits all catalog products without destructively deleting real items.
 * Flags demo/sample/test, duplicate SKU/slug, missing required fields, or archived items
 * so Admin can safely review them while keeping storefront listings clean.
 */
export function auditCatalogProducts(
  products: Product[],
  categories: Category[]
): Map<string, ProductAuditEntry> {
  const result = new Map<string, ProductAuditEntry>();
  const activeCategoryIds = new Set(
    categories.filter((c) => c.isActive).map((c) => c.id)
  );
  const allCategoryIds = new Set(categories.map((c) => c.id));

  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const product of products) {
    const flags: ProductAuditFlag[] = [];
    const normalizedSku = product.sku.trim().toUpperCase();
    const normalizedSlug = product.slug.trim().toLowerCase();

    if (
      product.isSampleOrTest ||
      SAMPLE_NAME_PATTERN.test(product.name) ||
      SAMPLE_NAME_PATTERN.test(product.sku)
    ) {
      flags.push({ code: 'SAMPLE_OR_TEST', label: 'Demo / Test Item' });
    }

    if (!normalizedSku || seenSkus.has(normalizedSku)) {
      flags.push({ code: 'DUPLICATE_SKU', label: 'Duplicate / Missing SKU' });
    } else {
      seenSkus.add(normalizedSku);
    }

    if (!normalizedSlug || seenSlugs.has(normalizedSlug)) {
      flags.push({ code: 'DUPLICATE_SLUG', label: 'Duplicate Slug' });
    } else {
      seenSlugs.add(normalizedSlug);
    }

    if (!Number.isFinite(product.priceInr) || product.priceInr <= 0) {
      flags.push({ code: 'INVALID_PRICE', label: 'Invalid Price' });
    }

    if (!product.images || product.images.filter(Boolean).length === 0) {
      flags.push({ code: 'MISSING_IMAGE', label: 'Missing Image' });
    }

    if (
      categories.length > 0 &&
      (!product.categoryId || !allCategoryIds.has(product.categoryId))
    ) {
      flags.push({ code: 'MISSING_CATEGORY', label: 'Unassigned Category' });
    }

    if (product.isArchived) {
      flags.push({ code: 'ARCHIVED', label: 'Archived' });
    }

    const hasBlockingFlag = flags.some(
      (f) =>
        f.code === 'SAMPLE_OR_TEST' ||
        f.code === 'DUPLICATE_SKU' ||
        f.code === 'INVALID_PRICE' ||
        f.code === 'ARCHIVED' ||
        f.code === 'MISSING_CATEGORY'
    );

    const categoryIsActive =
      categories.length === 0 || activeCategoryIds.has(product.categoryId);

    const eligibleForStorefront =
      product.isActive &&
      !product.isArchived &&
      !hasBlockingFlag &&
      categoryIsActive &&
      Boolean(product.name.trim());

    result.set(product.id, {
      productId: product.id,
      flags,
      needsReview: flags.some((f) => f.code !== 'ARCHIVED'),
      eligibleForStorefront,
    });
  }

  return result;
}

/**
 * Returns only clean, verified, active products suitable for customer storefront listing.
 */
export function filterStorefrontProducts(
  products: Product[],
  categories: Category[]
): Product[] {
  const auditMap = auditCatalogProducts(products, categories);
  return products.filter((p) => auditMap.get(p.id)?.eligibleForStorefront);
}
