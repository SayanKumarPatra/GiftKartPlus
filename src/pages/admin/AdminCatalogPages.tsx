import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  Edit3,
  FolderTree,
  Gift,
  Image as ImageIcon,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  useCategories,
  useCoupons,
  useGiftWrapConfig,
  useOrders,
  useProducts,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { ALL_GIFTS_CATEGORY_ID, resetAllDemoSeedData } from '../../data/seedData';
import { HERO_BANNERS, OFFICIAL_OCCASIONS, STUDIO_MEDIA } from '../../config/appConfig';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, formatInr, slugify } from '../../utils/format';
import type {
  Category,
  GiftWrapStyle,
  HeroSlide,
  OccasionTag,
  Product,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { ProductImage } from '../../components/ui/ProductImage';
import { auditCatalogProducts, getAvailabilityLabel } from '../../utils/productCatalog';

const MEDIA_OPTIONS: { label: string; url: string }[] = [
  { label: 'Banner 1 — Welcome to GiftKart', url: HERO_BANNERS.welcome },
  { label: 'Banner 2 — Find the Perfect Gift', url: HERO_BANNERS.perfectGift },
  { label: 'Banner 3 — Premium Birthday Gifts', url: HERO_BANNERS.birthdayCollection },
  { label: 'Banner 4 — Romantic & Couple Gifts', url: HERO_BANNERS.romanticShowcase },
  { label: 'Photo Frame Studio', url: STUDIO_MEDIA.photoFrame },
  { label: 'Coffee Mugs Studio', url: STUDIO_MEDIA.coffeeMug },
  { label: 'T-shirt Prints Studio', url: STUDIO_MEDIA.tshirtPrint },
  { label: 'Home Decor Studio', url: STUDIO_MEDIA.homeDecor },
  { label: 'Hand Made Studio', url: STUDIO_MEDIA.handmadeGift },
  { label: 'KeyChain Studio', url: STUDIO_MEDIA.keychain },
  { label: 'Gifts Bag + Box Studio', url: STUDIO_MEDIA.giftBox },
  { label: 'LED Lighting Studio', url: STUDIO_MEDIA.ledLamp },
  { label: 'PVC Card Studio', url: STUDIO_MEDIA.pvcCard },
  { label: 'Gift Bag Studio', url: STUDIO_MEDIA.giftBag },
  { label: 'Decor & Cushion Studio', url: STUDIO_MEDIA.cushionKeychain },
  { label: 'Desk & Diary Studio', url: STUDIO_MEDIA.stationeryDecor },
];

const QUICK_MANAGE_SHORTCUTS = [
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart, tone: 'bg-[#FFF0F6] text-[#FF4D8D]' },
  { label: 'Products', to: '/admin/products', icon: Package, tone: 'bg-[#F4EBFF] text-[#6A11CB]' },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree, tone: 'bg-[#FFF0F6] text-[#FF4D8D]' },
  { label: 'Stock', to: '/admin/inventory', icon: Boxes, tone: 'bg-amber-50 text-amber-700' },
  { label: 'Banners', to: '/admin/banners', icon: ImageIcon, tone: 'bg-[#F4EBFF] text-[#6A11CB]' },
  { label: 'Coupons', to: '/admin/coupons', icon: Tag, tone: 'bg-[#FFF0F6] text-[#FF4D8D]' },
  { label: 'Gift Wrap', to: '/admin/gift-wrapping', icon: Gift, tone: 'bg-[#F4EBFF] text-[#6A11CB]' },
  { label: 'Settings', to: '/admin/settings', icon: Settings, tone: 'bg-[#F4EBFF] text-[#6A11CB]' },
];

/* ============================================================================
 * 1. ADMIN DASHBOARD OVERVIEW (MOBILE-FIRST OWNER COCKPIT)
 * ========================================================================== */
export function AdminDashboardPage() {
  const { data: products } = useProducts({ includeInactive: true });
  const { data: categories } = useCategories(true);
  const { data: orders } = useOrders();
  const { data: coupons } = useCoupons();
  const { data: giftWrap } = useGiftWrapConfig();
  const { data: settings } = useStoreSettings();
  const { pushToast } = useToast();

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.fulfillmentStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.grandTotalInr, 0),
    [orders]
  );

  const pendingOrdersCount = useMemo(
    () =>
      orders.filter(
        (o) => o.fulfillmentStatus !== 'Delivered' && o.fulfillmentStatus !== 'Cancelled'
      ).length,
    [orders]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stockCount <= 12).sort((a, b) => a.stockCount - b.stockCount),
    [products]
  );

  const activeProductsCount = useMemo(
    () => products.filter((p) => p.isActive && !p.isArchived).length,
    [products]
  );

  async function handleQuickRestock(product: Product) {
    const nextStock = product.stockCount + 5;
    await services.catalog.saveProduct({
      ...product,
      stockCount: nextStock,
      availability: 'IN_STOCK',
    });
    pushToast({
      title: 'Stock replenished (+5)',
      description: `${product.name} now has ${nextStock} units.`,
      variant: 'success',
    });
  }

  function handleResetDemo() {
    resetAllDemoSeedData();
    pushToast({
      title: 'Store seed restored',
      description: 'All 10 official categories, studio products, and Jalchak settings restored.',
      variant: 'info',
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Compact Hero Summary Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#6A11CB] via-[#7E1AD6] to-[#B026C7] p-4 text-white shadow-lg shadow-[#6A11CB]/20 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#F1DBFF]">
              GiftKart Store Control · Jalchak
            </p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight sm:text-2xl">
              Store Operations Dashboard
            </h1>
            <p className="mt-1 text-xs text-[#F4EBFF]/90">
              {categories.length} official categories · {activeProductsCount} active products ·{' '}
              {settings?.deliveryZones.filter((z) => z.isActive).length ?? 1} active zone
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/products?new=1"
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 text-xs font-bold text-[#6A11CB] shadow-sm active:scale-[0.98] sm:flex-initial"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </Link>
            <Link
              to="/admin/orders"
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3.5 text-xs font-bold text-white ring-1 ring-white/25 active:scale-[0.98] sm:flex-initial"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Orders ({pendingOrdersCount})</span>
            </Link>
            <button
              type="button"
              onClick={handleResetDemo}
              aria-label="Reset store seed data"
              title="Reset Demo Seed"
              className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 active:scale-95 sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden text-xs font-semibold sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2x2 Mobile KPI Grid -> 4-Column Desktop Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <Link
          to="/admin/reports"
          className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs transition-transform active:scale-[0.98] sm:p-5"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#5F4B78]">Order Volume</span>
            <ShoppingCart className="h-4 w-4 shrink-0 text-[#FF4D8D]" />
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold tabular-nums text-[#2A0E4D] sm:text-2xl">
            {formatInr(totalRevenue)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#7B6496]">
            {orders.length} total · {pendingOrdersCount} active
          </p>
        </Link>

        <Link
          to="/admin/products"
          className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs transition-transform active:scale-[0.98] sm:p-5"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#5F4B78]">Active Catalog</span>
            <Package className="h-4 w-4 shrink-0 text-[#6A11CB]" />
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold tabular-nums text-[#2A0E4D] sm:text-2xl">
            {activeProductsCount}{' '}
            <span className="text-xs font-normal text-[#7B6496]">/ {products.length}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#7B6496]">
            {categories.length} official categories
          </p>
        </Link>

        <Link
          to="/admin/inventory"
          className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs transition-transform active:scale-[0.98] sm:p-5"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#5F4B78]">Low Stock</span>
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF4D8D]" />
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold tabular-nums text-[#2A0E4D] sm:text-2xl">
            {lowStockProducts.length}
          </p>
          <p className="mt-0.5 text-[11px] text-[#7B6496]">
            {lowStockProducts.length === 0 ? 'All items stocked' : 'Items ≤ 12 units'}
          </p>
        </Link>

        <Link
          to="/admin/coupons"
          className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs transition-transform active:scale-[0.98] sm:p-5"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#5F4B78]">Offers &amp; Wrap</span>
            <Gift className="h-4 w-4 shrink-0 text-[#6A11CB]" />
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold tabular-nums text-[#2A0E4D] sm:text-2xl">
            {coupons.filter((c) => c.isActive).length} Live
          </p>
          <p className="mt-0.5 text-[11px] text-[#7B6496]">
            Wrap: {giftWrap?.globallyEnabled ? 'On' : 'Off'} ·{' '}
            {giftWrap?.styles.filter((s) => s.isActive).length ?? 0} styles
          </p>
        </Link>
      </div>

      {/* Mobile Quick Manage Grid (4x2 Thumb-Friendly Tiles) */}
      <section className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs lg:hidden">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-[#2A0E4D]">Quick Manage</h2>
          <span className="text-[11px] text-[#7B6496]">Tap any tool</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_MANAGE_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl border border-[#F3EAFF] bg-[#FDFBFF] p-2 text-center active:scale-95"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.tone}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[10.5px] font-semibold leading-tight text-[#2A0E4D]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Orders + Low Stock Watch */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#F0E4FF] pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#2A0E4D] sm:text-lg">
                Recent Orders
              </h2>
              <p className="text-[11px] text-[#5F4B78]">
                Tap any order to inspect items &amp; update delivery status
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
            >
              <span>All Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Stacked Order Cards */}
          <div className="mt-3 space-y-2 md:hidden">
            {orders.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#5F4B78]">No orders placed yet.</p>
            ) : (
              orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders?order=${encodeURIComponent(order.id)}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#F0E4FF] bg-[#FDFBFF] p-3 active:bg-[#F5ECFF]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#6A11CB]">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-[#FF4D8D]">
                        · {order.fulfillmentStatus}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs font-bold text-[#2A0E4D]">
                      {order.customer.fullName}
                    </p>
                    <p className="truncate text-[11px] text-[#7B6496]">
                      {order.customer.deliveryZoneNameSnapshot} · {order.items.length} item(s)
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="font-mono text-xs font-bold tabular-nums text-[#2A0E4D]">
                      {formatInr(order.grandTotalInr)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#8C75A8]" />
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Desktop Order Table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0E4FF] text-[#7B6496]">
                  <th className="pb-2.5 font-semibold">Order #</th>
                  <th className="pb-2.5 font-semibold">Customer &amp; Zone</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                  <th className="pb-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5ECFF]">
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF6FF]">
                    <td className="py-3 font-mono font-bold text-[#6A11CB]">
                      <Link to={`/admin/orders?order=${encodeURIComponent(order.id)}`}>
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3">
                      <p className="font-semibold text-[#2A0E4D]">{order.customer.fullName}</p>
                      <p className="text-[11px] text-[#7B6496]">
                        {order.customer.deliveryZoneNameSnapshot} · {formatDateTime(order.createdAt)}
                      </p>
                    </td>
                    <td className="py-3 font-semibold text-[#6A11CB]">
                      {order.fulfillmentStatus}
                    </td>
                    <td className="py-3 text-right font-mono font-bold tabular-nums text-[#2A0E4D]">
                      {formatInr(order.grandTotalInr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Watch with 1-Tap +5 Restock */}
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between border-b border-[#F0E4FF] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#FF4D8D]" />
              <h2 className="font-display text-base font-bold text-[#2A0E4D] sm:text-lg">
                Low Stock Alert
              </h2>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
            >
              Stock →
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#5F4B78]">
              All catalog items are well stocked (&gt; 12 units).
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lowStockProducts.slice(0, 5).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2.5 rounded-xl border border-[#F0E4FF] bg-[#FDFBFF] p-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#EBD8FF]">
                      <ProductImage
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#2A0E4D]">{p.name}</p>
                      <p className="font-mono text-[11px] font-bold text-[#FF4D8D]">
                        {p.stockCount} left · {p.sku}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleQuickRestock(p)}
                    className="inline-flex min-h-[34px] shrink-0 items-center gap-0.5 rounded-lg bg-[#6A11CB] px-2.5 text-[11px] font-bold text-white active:scale-95"
                  >
                    <Plus className="h-3 w-3" />5
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. ADMIN PRODUCTS MANAGEMENT (MOBILE CARD LIST + DESKTOP TABLE)
 * ========================================================================== */
interface ProductFormState {
  id: string;
  name: string;
  sku: string;
  priceInr: string;
  compareAtPriceInr: string;
  stockCount: string;
  categoryId: string;
  subcategoryId: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  occasionTags: OccasionTag[];
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
  supportsPersonalization: boolean;
  supportsPhotoUpload: boolean;
  personalizationPrompt: string;
}

function createEmptyProductForm(categories: Category[]): ProductFormState {
  const firstCat =
    categories.find((c) => c.id !== ALL_GIFTS_CATEGORY_ID) ?? categories[0];
  return {
    id: '',
    name: '',
    sku: `GK-NEW-${Math.floor(100 + Math.random() * 899)}`,
    priceInr: '499',
    compareAtPriceInr: '649',
    stockCount: '25',
    categoryId: firstCat?.id ?? 'cat-photo-frame',
    subcategoryId: firstCat?.subcategories[0]?.id ?? '',
    shortDescription: '',
    description: '',
    imageUrl: STUDIO_MEDIA.photoFrame,
    occasionTags: ['Birthday'],
    isBestSeller: false,
    isFeatured: false,
    isActive: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
    personalizationPrompt: 'Enter name, date, or custom message to print',
  };
}

export function AdminProductsPage() {
  const { data: products } = useProducts({ includeInactive: true });
  const { data: categories } = useCategories(true);
  const { pushToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterCatId, setFilterCatId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'REVIEW'>('ALL');
  const [editingForm, setEditingForm] = useState<ProductFormState | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('new') === '1' ? createEmptyProductForm([]) : null;
  });
  const [saving, setSaving] = useState(false);

  const productAuditMap = useMemo(
    () => auditCatalogProducts(products, categories),
    [products, categories]
  );

  const reviewCount = useMemo(
    () => products.filter((p) => productAuditMap.get(p.id)?.needsReview).length,
    [products, productAuditMap]
  );

  const assignableCategories = useMemo(
    () => categories.filter((c) => c.id !== ALL_GIFTS_CATEGORY_ID),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCatId && filterCatId !== ALL_GIFTS_CATEGORY_ID && p.categoryId !== filterCatId) {
        return false;
      }
      if (statusFilter === 'ACTIVE' && (!p.isActive || p.isArchived)) {
        return false;
      }
      if (statusFilter === 'ARCHIVED' && p.isActive && !p.isArchived) {
        return false;
      }
      if (statusFilter === 'REVIEW' && !productAuditMap.get(p.id)?.needsReview) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)
      );
    });
  }, [products, search, filterCatId, statusFilter, productAuditMap]);

  const selectedFormCategory = useMemo(
    () => categories.find((c) => c.id === editingForm?.categoryId),
    [categories, editingForm?.categoryId]
  );

  function openEdit(product: Product) {
    setEditingForm({
      id: product.id,
      name: product.name,
      sku: product.sku,
      priceInr: String(product.priceInr),
      compareAtPriceInr: product.compareAtPriceInr ? String(product.compareAtPriceInr) : '',
      stockCount: String(product.stockCount),
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId ?? '',
      shortDescription: product.shortDescription,
      description: product.description,
      imageUrl: product.images[0] ?? STUDIO_MEDIA.coffeeMug,
      occasionTags: product.occasionTags,
      isBestSeller: product.isBestSeller,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      supportsPersonalization: product.supportsPersonalization,
      supportsPhotoUpload: Boolean(product.supportsPhotoUpload),
      personalizationPrompt: product.personalizationPrompt ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingForm) return;
    const price = Number(editingForm.priceInr);
    const compareAt = editingForm.compareAtPriceInr
      ? Number(editingForm.compareAtPriceInr)
      : undefined;
    const stock = Math.max(0, Number(editingForm.stockCount) || 0);

    if (!editingForm.name.trim() || !editingForm.sku.trim() || Number.isNaN(price) || price <= 0) {
      pushToast({
        title: 'Invalid product details',
        description: 'Name, SKU, and a valid INR price are required.',
        variant: 'error',
      });
      return;
    }

    const normalizedSku = editingForm.sku.trim().toUpperCase();
    const duplicateSku = products.find(
      (p) => p.id !== editingForm.id && p.sku.trim().toUpperCase() === normalizedSku
    );
    if (duplicateSku) {
      pushToast({
        title: 'Duplicate SKU detected',
        description: `SKU "${normalizedSku}" is already assigned to "${duplicateSku.name}".`,
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const existing = products.find((p) => p.id === editingForm.id);
      const id = editingForm.id || `prod-${Date.now()}`;
      await services.catalog.saveProduct({
        id,
        slug: existing?.slug || slugify(editingForm.name),
        sku: normalizedSku,
        name: editingForm.name.trim(),
        shortDescription:
          editingForm.shortDescription.trim() || 'Personalized gift crafted by GiftKart.',
        description:
          editingForm.description.trim() ||
          editingForm.shortDescription.trim() ||
          'Handcrafted personalized gift prepared for Jalchak delivery.',
        priceInr: Math.round(price),
        compareAtPriceInr:
          compareAt && compareAt > price ? Math.round(compareAt) : undefined,
        categoryId: editingForm.categoryId || assignableCategories[0]?.id || 'cat-photo-frame',
        subcategoryId: editingForm.subcategoryId || undefined,
        occasionTags:
          editingForm.occasionTags.length > 0 ? editingForm.occasionTags : ['Special Occasion'],
        images: [editingForm.imageUrl.trim() || STUDIO_MEDIA.giftBox],
        variants: existing?.variants ?? [{ name: 'Edition', options: ['Standard'] }],
        availability: stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
        stockCount: stock,
        isBestSeller: editingForm.isBestSeller,
        isFeatured: editingForm.isFeatured,
        isActive: editingForm.isActive,
        isArchived: existing?.isArchived ?? false,
        isSampleOrTest: false,
        supportsPersonalization: editingForm.supportsPersonalization,
        supportsPhotoUpload: editingForm.supportsPhotoUpload,
        personalizationPrompt: editingForm.personalizationPrompt.trim() || undefined,
        sampleRating: existing?.sampleRating ?? 4.8,
        sampleReviewCount: existing?.sampleReviewCount ?? 24,
        createdAt: existing?.createdAt,
      });

      pushToast({
        title: editingForm.id ? 'Product updated' : 'Product added to catalog',
        description: `${editingForm.name.trim()} saved live to storefront.`,
        variant: 'success',
      });
      setEditingForm(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(product: Product) {
    await services.catalog.saveProduct({
      ...product,
      isActive: !product.isActive,
      isArchived: !product.isActive ? false : product.isArchived,
    });
    pushToast({
      title: `${product.name} ${!product.isActive ? 'activated' : 'hidden'}`,
      variant: 'info',
    });
  }

  async function handleToggleArchive(product: Product) {
    const nextArchived = !product.isArchived;
    await services.catalog.saveProduct({
      ...product,
      isArchived: nextArchived,
      isActive: nextArchived ? false : true,
    });
    pushToast({
      title: nextArchived ? 'Product archived' : 'Product restored',
      variant: 'info',
    });
  }

  async function handleAdjustStock(product: Product, delta: number) {
    const nextStock = Math.max(0, product.stockCount + delta);
    await services.catalog.saveProduct({
      ...product,
      stockCount: nextStock,
      availability: nextStock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
    });
  }

  async function handleDelete(product: Product) {
    await services.catalog.deleteProduct(product.id);
    pushToast({
      title: 'Product deleted',
      description: `${product.name} removed from active catalog.`,
      variant: 'info',
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
            Products ({products.length})
          </h1>
          <p className="text-[11px] text-[#5F4B78] sm:text-xs">
            Add, edit, adjust stock, or toggle visibility instantly
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setEditingForm(createEmptyProductForm(categories))}
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </Button>
      </div>

      {/* Add / Edit Product Form */}
      {editingForm && (
        <form
          onSubmit={(e) => void handleSaveProduct(e)}
          className="space-y-4 rounded-2xl border border-[#6A11CB]/25 bg-white p-4 shadow-md sm:rounded-3xl sm:p-6"
        >
          <div className="flex items-center justify-between border-b border-[#F0E4FF] pb-3">
            <h2 className="font-display text-base font-bold text-[#2A0E4D] sm:text-lg">
              {editingForm.id ? 'Edit Product' : 'Create New Product'}
            </h2>
            <button
              type="button"
              onClick={() => setEditingForm(null)}
              aria-label="Close form"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF6FF] text-[#5F4B78]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#4A3862]">Product Name *</label>
              <input
                type="text"
                required
                value={editingForm.name}
                onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-[#4A3862]">SKU *</label>
              <input
                type="text"
                required
                value={editingForm.sku}
                onChange={(e) => setEditingForm({ ...editingForm, sku: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-[#4A3862]">Stock *</label>
              <input
                type="number"
                min={0}
                required
                value={editingForm.stockCount}
                onChange={(e) => setEditingForm({ ...editingForm, stockCount: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-[#4A3862]">Price (₹) *</label>
              <input
                type="number"
                min={1}
                required
                value={editingForm.priceInr}
                onChange={(e) => setEditingForm({ ...editingForm, priceInr: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-[#4A3862]">MRP (₹)</label>
              <input
                type="number"
                min={0}
                value={editingForm.compareAtPriceInr}
                onChange={(e) =>
                  setEditingForm({ ...editingForm, compareAtPriceInr: e.target.value })
                }
                className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-[#4A3862]">Category *</label>
              <select
                value={editingForm.categoryId}
                onChange={(e) => {
                  const nextCat = categories.find((c) => c.id === e.target.value);
                  setEditingForm({
                    ...editingForm,
                    categoryId: e.target.value,
                    subcategoryId: nextCat?.subcategories[0]?.id ?? '',
                  });
                }}
                className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
              >
                {(assignableCategories.length > 0 ? assignableCategories : categories).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-[#4A3862]">Subcategory</label>
              <select
                value={editingForm.subcategoryId}
                onChange={(e) => setEditingForm({ ...editingForm, subcategoryId: e.target.value })}
                disabled={!selectedFormCategory?.subcategories.length}
                className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-sm disabled:bg-[#FAF6FF] focus:border-[#6A11CB] focus:outline-none"
              >
                <option value="">— None —</option>
                {selectedFormCategory?.subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Photo Uploader */}
            <div className="col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-[#4A3862]">Product Photo</label>
              <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-white">
                  <ProductImage
                    src={editingForm.imageUrl}
                    alt={editingForm.name || 'Preview'}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <select
                    value={
                      MEDIA_OPTIONS.some((m) => m.url === editingForm.imageUrl)
                        ? editingForm.imageUrl
                        : ''
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        setEditingForm({ ...editingForm, imageUrl: e.target.value });
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-2.5 text-xs focus:border-[#6A11CB] focus:outline-none"
                  >
                    {!MEDIA_OPTIONS.some((m) => m.url === editingForm.imageUrl) && (
                      <option value="">Custom Uploaded Image</option>
                    )}
                    {MEDIA_OPTIONS.map((m) => (
                      <option key={m.url} value={m.url}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <label className="flex min-h-[40px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#6A11CB]/40 bg-white px-3 text-xs font-bold text-[#6A11CB] active:bg-[#F4EBFF]">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload from Phone Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 1.5 * 1024 * 1024) {
                          pushToast({
                            title: 'Image too large',
                            description: 'Please pick an image under 1.5 MB.',
                            variant: 'error',
                          });
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setEditingForm((prev) =>
                              prev ? { ...prev, imageUrl: reader.result as string } : prev
                            );
                            pushToast({
                              title: 'Photo attached',
                              description: file.name,
                              variant: 'success',
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-[#4A3862]">Short Description</label>
              <input
                type="text"
                value={editingForm.shortDescription}
                onChange={(e) =>
                  setEditingForm({ ...editingForm, shortDescription: e.target.value })
                }
                className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div className="col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-[#4A3862]">Full Description</label>
              <textarea
                rows={2}
                value={editingForm.description}
                onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] p-3 text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs font-semibold text-[#4A3862] sm:flex sm:flex-wrap sm:gap-4">
            {(
              [
                ['isActive', 'Active on Store'],
                ['isBestSeller', 'Best Seller'],
                ['isFeatured', 'Featured'],
                ['supportsPersonalization', 'Custom Text'],
                ['supportsPhotoUpload', 'Photo Upload'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-xl border border-[#F0E4FF] bg-[#FDFBFF] px-3 sm:border-0 sm:bg-transparent sm:px-0"
              >
                <input
                  type="checkbox"
                  checked={editingForm[key]}
                  onChange={(e) => setEditingForm({ ...editingForm, [key]: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#6A11CB]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5 border-t border-[#F0E4FF] pt-3.5 sm:flex sm:justify-end">
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => setEditingForm(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              <Check className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Product'}</span>
            </Button>
          </div>
        </form>
      )}

      {/* Search, Category Filter & Status Tabs */}
      <div className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs sm:p-5">
        <div className="grid gap-2.5 sm:grid-cols-12">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-[#EBD8FF] bg-[#FAF6FF] px-3 sm:col-span-7">
            <Search className="h-4 w-4 shrink-0 text-[#6A11CB]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or SKU..."
              className="w-full bg-transparent text-sm text-[#2A0E4D] focus:outline-none sm:text-xs"
            />
          </div>

          <select
            value={filterCatId}
            onChange={(e) => setFilterCatId(e.target.value)}
            className="h-11 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#4A3862] focus:border-[#6A11CB] focus:outline-none sm:col-span-5"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Interactive Status Segmented Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              ['ALL', `All (${products.length})`],
              ['ACTIVE', 'Active'],
              ['ARCHIVED', 'Hidden'],
              ['REVIEW', `Review (${reviewCount})`],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatusFilter(val)}
              className={`min-h-[34px] shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === val
                  ? 'bg-[#6A11CB] text-white'
                  : 'bg-[#FAF6FF] text-[#5F4B78] hover:bg-[#F1E6FF]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* MOBILE PRODUCT CARDS (ZERO HORIZONTAL SCROLL) */}
        <div className="space-y-3 md:hidden">
          {filteredProducts.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#5F4B78]">
              No products match your filter.
            </p>
          ) : (
            filteredProducts.map((product) => {
              const cat = categories.find((c) => c.id === product.categoryId);
              const sub = cat?.subcategories.find((s) => s.id === product.subcategoryId);
              const availLabel = getAvailabilityLabel(product);

              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-[#F0E4FF] bg-[#FDFBFF] p-3 space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-white">
                      <ProductImage
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-[#2A0E4D]">
                          {product.name}
                        </p>
                        <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-[#6A11CB]">
                          {formatInr(product.priceInr)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#7B6496]">
                        {cat?.name ?? 'Uncategorized'}
                        {sub ? ` / ${sub.name}` : ''} · <span className="font-mono">{product.sku}</span>
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(product)}
                          className={`rounded-md px-2 py-0.5 font-bold ${
                            product.isArchived
                              ? 'bg-amber-100 text-amber-800'
                              : product.isActive
                                ? 'bg-[#F4EBFF] text-[#6A11CB]'
                                : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {product.isArchived
                            ? 'Archived'
                            : product.isActive
                              ? 'Active'
                              : 'Hidden'}
                        </button>
                        <span className="font-medium text-[#7B6496]">{availLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Bottom Action Strip: Stock Stepper + Edit / Archive / Delete */}
                  <div className="flex items-center justify-between gap-2 border-t border-[#F0E4FF] pt-2.5">
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#EBD8FF] bg-white p-1">
                      <button
                        type="button"
                        onClick={() => void handleAdjustStock(product, -1)}
                        aria-label={`Decrease stock for ${product.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF6FF] text-[#4A3862] active:bg-[#EBD8FF]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span
                        className={`min-w-[28px] text-center font-mono text-xs font-bold tabular-nums ${
                          product.stockCount <= 12 ? 'text-[#FF4D8D]' : 'text-[#2A0E4D]'
                        }`}
                      >
                        {product.stockCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleAdjustStock(product, 1)}
                        aria-label={`Increase stock for ${product.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF6FF] text-[#4A3862] active:bg-[#EBD8FF]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-bold text-[#6A11CB] active:bg-[#F4EBFF]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleArchive(product)}
                        aria-label={product.isArchived ? 'Restore product' : 'Archive product'}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EBD8FF] bg-white text-[#5F4B78] active:bg-amber-50"
                      >
                        {product.isArchived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product)}
                        aria-label={`Delete ${product.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EBD8FF] bg-white text-rose-600 active:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP PRODUCT TABLE */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0E4FF] text-[#7B6496]">
                <th className="pb-2.5 font-semibold">Product</th>
                <th className="pb-2.5 font-semibold">Category</th>
                <th className="pb-2.5 font-semibold">Price</th>
                <th className="pb-2.5 font-semibold">Stock</th>
                <th className="pb-2.5 font-semibold">Status</th>
                <th className="pb-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5ECFF]">
              {filteredProducts.map((product) => {
                const cat = categories.find((c) => c.id === product.categoryId);
                const sub = cat?.subcategories.find((s) => s.id === product.subcategoryId);
                const audit = productAuditMap.get(product.id);
                const availLabel = getAvailabilityLabel(product);
                return (
                  <tr key={product.id} className="hover:bg-[#FAF6FF]">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#EBD8FF]">
                          <ProductImage
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#2A0E4D]">{product.name}</p>
                          <p className="font-mono text-[11px] text-[#7B6496]">{product.sku}</p>
                          {audit && audit.flags.length > 0 && (
                            <p className="mt-0.5 text-[10px] font-semibold text-amber-700">
                              {audit.flags.map((f) => f.label).join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-[#4A3862]">
                      <p className="font-medium">{cat?.name ?? '—'}</p>
                      {sub && <p className="text-[11px] text-[#FF4D8D]">{sub.name}</p>}
                    </td>
                    <td className="py-3 font-mono font-bold tabular-nums text-[#6A11CB]">
                      {formatInr(product.priceInr)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleAdjustStock(product, -1)}
                          aria-label={`Decrease stock for ${product.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded border border-[#EBD8FF] text-[#4A3862] hover:bg-[#F4EBFF]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span
                          className={`min-w-[26px] text-center font-mono tabular-nums ${
                            product.stockCount <= 12
                              ? 'font-bold text-[#FF4D8D]'
                              : 'font-semibold text-[#2A0E4D]'
                          }`}
                        >
                          {product.stockCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleAdjustStock(product, 1)}
                          aria-label={`Increase stock for ${product.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded border border-[#EBD8FF] text-[#4A3862] hover:bg-[#F4EBFF]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[10px] font-semibold text-[#7B6496]">{availLabel}</p>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(product)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          product.isArchived
                            ? 'bg-amber-100 text-amber-800'
                            : product.isActive
                              ? 'bg-[#F4EBFF] text-[#6A11CB] hover:bg-[#EBD8FF]'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {product.isArchived
                          ? 'Archived'
                          : product.isActive
                            ? 'Active'
                            : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="rounded-lg border border-[#EBD8FF] p-1.5 text-[#6A11CB] hover:bg-[#F4EBFF]"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleArchive(product)}
                          className="rounded-lg border border-[#EBD8FF] p-1.5 text-[#5F4B78] hover:bg-amber-50 hover:text-amber-700"
                          aria-label={product.isArchived ? 'Restore' : 'Archive'}
                        >
                          {product.isArchived ? (
                            <ArchiveRestore className="h-3.5 w-3.5" />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(product)}
                          className="rounded-lg border border-[#EBD8FF] p-1.5 text-[#7B6496] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 3. ADMIN CATEGORIES & SUBCATEGORIES MANAGEMENT (10 OFFICIAL CATEGORIES)
 * ========================================================================== */
export function AdminCategoriesPage() {
  const { data: categories } = useCategories(true);
  const { data: products } = useProducts({ includeInactive: true });
  const { pushToast } = useToast();
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({});

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImageUrl, setCatImageUrl] = useState<string>(STUDIO_MEDIA.giftBox);
  const [catSortOrder, setCatSortOrder] = useState('11');
  const [catActive, setCatActive] = useState(true);
  const [showCatForm, setShowCatForm] = useState(false);

  function openNewCategoryForm() {
    setEditingCatId(null);
    setCatName('');
    setCatDesc('');
    setCatImageUrl(STUDIO_MEDIA.giftBox);
    setCatSortOrder(String(categories.length + 1));
    setCatActive(true);
    setShowCatForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEditCategoryForm(cat: Category) {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatDesc(cat.description);
    setCatImageUrl(cat.imageUrl ?? STUDIO_MEDIA.giftBox);
    setCatSortOrder(String(cat.sortOrder));
    setCatActive(cat.isActive);
    setShowCatForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = catName.trim();
    if (!trimmedName) return;

    const existing = categories.find((c) => c.id === editingCatId);
    const payload: Category = {
      id: existing?.id ?? `cat-${slugify(trimmedName)}-${Date.now().toString().slice(-3)}`,
      slug: existing?.slug ?? slugify(trimmedName),
      name: trimmedName,
      description: catDesc.trim() || `${trimmedName} curated gift collection.`,
      imageUrl: catImageUrl.trim() || STUDIO_MEDIA.giftBox,
      sortOrder: Math.max(1, Number(catSortOrder) || categories.length + 1),
      isActive: catActive,
      subcategories: existing?.subcategories ?? [],
    };

    await services.catalog.saveCategory(payload);
    pushToast({
      title: existing ? 'Category updated' : 'Category created',
      description: `${payload.name} (#${payload.sortOrder}) synced across mobile & desktop.`,
      variant: 'success',
    });
    setShowCatForm(false);
    setEditingCatId(null);
  }

  async function handleDeleteCategory(cat: Category) {
    if (cat.id === ALL_GIFTS_CATEGORY_ID) {
      pushToast({
        title: 'Master category protected',
        description: '"All Gifts" displays your full store catalog and cannot be deleted.',
        variant: 'info',
      });
      return;
    }
    const assignedCount = products.filter((p) => p.categoryId === cat.id).length;
    if (assignedCount > 0) {
      pushToast({
        title: 'Cannot delete category in use',
        description: `${assignedCount} product(s) belong to "${cat.name}". Reassign or hide instead.`,
        variant: 'error',
      });
      return;
    }
    await services.catalog.deleteCategory(cat.id);
    pushToast({ title: 'Category deleted', variant: 'info' });
  }

  async function toggleCategoryActive(cat: Category) {
    await services.catalog.saveCategory({ ...cat, isActive: !cat.isActive });
    pushToast({
      title: `${cat.name} ${!cat.isActive ? 'activated' : 'hidden'}`,
      variant: 'info',
    });
  }

  async function handleAddSubcategory(cat: Category) {
    const raw = (newSubNames[cat.id] ?? '').trim();
    if (!raw) return;
    await services.catalog.saveSubcategory(cat.id, {
      id: `sub-${Date.now()}`,
      slug: slugify(raw),
      name: raw,
      isActive: true,
      sortOrder: cat.subcategories.length + 1,
    });
    setNewSubNames((prev) => ({ ...prev, [cat.id]: '' }));
    pushToast({ title: 'Subcategory added', description: raw, variant: 'success' });
  }

  async function handleDeleteSubcategory(cat: Category, subId: string, subName: string) {
    await services.catalog.deleteSubcategory(cat.id, subId);
    pushToast({ title: 'Subcategory removed', description: subName, variant: 'info' });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
            Categories ({categories.length})
          </h1>
          <p className="text-[11px] text-[#5F4B78] sm:text-xs">
            Live synced across Mobile, Desktop, Search &amp; Filters
          </p>
        </div>

        <Button type="button" size="sm" variant="primary" onClick={openNewCategoryForm}>
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </Button>
      </div>

      {showCatForm && (
        <form
          onSubmit={(e) => void handleSaveCategory(e)}
          className="space-y-3.5 rounded-2xl border border-[#6A11CB]/25 bg-white p-4 shadow-md sm:p-5"
        >
          <div className="flex items-center justify-between border-b border-[#F0E4FF] pb-2.5">
            <h2 className="font-display text-base font-bold text-[#2A0E4D]">
              {editingCatId ? 'Edit Category' : 'Add New Category'}
            </h2>
            <button
              type="button"
              onClick={() => setShowCatForm(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF6FF] text-[#5F4B78]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <input
              type="text"
              required
              placeholder="Category Name *"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="col-span-2 h-11 rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <input
              type="number"
              min={1}
              required
              placeholder="Order #"
              value={catSortOrder}
              onChange={(e) => setCatSortOrder(e.target.value)}
              className="col-span-1 h-11 rounded-xl border border-[#EBD8FF] px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[#EBD8FF] bg-[#FAF6FF] p-2.5">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#EBD8FF] bg-white">
              <ProductImage src={catImageUrl} alt={catName || 'Category'} className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <select
                value={MEDIA_OPTIONS.some((m) => m.url === catImageUrl) ? catImageUrl : ''}
                onChange={(e) => {
                  if (e.target.value) setCatImageUrl(e.target.value);
                }}
                className="h-9 w-full rounded-lg border border-[#EBD8FF] bg-white px-2 text-xs focus:border-[#6A11CB] focus:outline-none"
              >
                {!MEDIA_OPTIONS.some((m) => m.url === catImageUrl) && (
                  <option value="">Custom Uploaded / URL</option>
                )}
                {MEDIA_OPTIONS.map((m) => (
                  <option key={m.url} value={m.url}>
                    {m.label}
                  </option>
                ))}
              </select>
              <label className="flex min-h-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#6A11CB]/40 bg-white px-2 text-[11px] font-bold text-[#6A11CB]">
                <Upload className="h-3 w-3" />
                <span>Upload Image from Phone</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || file.size > 1.5 * 1024 * 1024) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') setCatImageUrl(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
          </div>

          <input
            type="text"
            placeholder="Category description"
            value={catDesc}
            onChange={(e) => setCatDesc(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 text-xs font-semibold text-[#4A3862]">
              <input
                type="checkbox"
                checked={catActive}
                onChange={(e) => setCatActive(e.target.checked)}
                className="h-4 w-4 accent-[#6A11CB]"
              />
              <span>Visible on Storefront</span>
            </label>
            <Button type="submit" size="sm" variant="primary">
              <Check className="h-3.5 w-3.5" />
              <span>{editingCatId ? 'Update' : 'Save Category'}</span>
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-3 md:grid-cols-2 sm:gap-4">
        {categories.map((cat) => {
          const itemCount =
            cat.id === ALL_GIFTS_CATEGORY_ID
              ? products.length
              : products.filter((p) => p.categoryId === cat.id).length;
          return (
            <div
              key={cat.id}
              className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs sm:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-[#FAF6FF]">
                  <ProductImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="truncate font-display text-sm font-bold text-[#2A0E4D] sm:text-base">
                      <span className="mr-1 font-mono text-xs text-[#8C75A8]">
                        #{cat.sortOrder}
                      </span>
                      {cat.name}
                    </h2>
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#6A11CB]">
                      {cat.id === ALL_GIFTS_CATEGORY_ID
                        ? `${itemCount} total`
                        : `${itemCount} items`}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[#5F4B78]">
                    {cat.description}
                  </p>
                </div>
              </div>

              {/* Mobile-Friendly Action Bar */}
              <div className="flex items-center justify-between gap-2 border-t border-[#F4ECFF] pt-2.5">
                <button
                  type="button"
                  onClick={() => void toggleCategoryActive(cat)}
                  className={`min-h-[34px] rounded-lg px-3 text-xs font-bold ${
                    cat.isActive ? 'bg-[#F4EBFF] text-[#6A11CB]' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {cat.isActive ? 'Active' : 'Hidden'}
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditCategoryForm(cat)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#EBD8FF] px-3 text-xs font-bold text-[#6A11CB] active:bg-[#F4EBFF]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  {cat.id !== ALL_GIFTS_CATEGORY_ID && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteCategory(cat)}
                      aria-label={`Delete ${cat.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EBD8FF] text-rose-600 active:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subcategories */}
              <div className="border-t border-[#F4ECFF] pt-2.5">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-[#7B6496]">
                  <FolderTree className="h-3.5 w-3.5 text-[#FF4D8D]" />
                  <span>Subcategories ({cat.subcategories.length})</span>
                </p>

                {cat.subcategories.length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#EBD8FF] bg-[#FAF6FF] px-2.5 py-1 text-[11.5px] font-medium text-[#2A0E4D]"
                      >
                        <span>{sub.name}</span>
                        <button
                          type="button"
                          onClick={() => void handleDeleteSubcategory(cat, sub.id, sub.name)}
                          aria-label={`Delete ${sub.name}`}
                          className="ml-0.5 flex h-4 w-4 items-center justify-center rounded text-[#8C75A8] hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubNames[cat.id] ?? ''}
                    onChange={(e) =>
                      setNewSubNames((prev) => ({ ...prev, [cat.id]: e.target.value }))
                    }
                    placeholder={`Add subcategory...`}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-[#EBD8FF] bg-[#FDFBFF] px-3 text-xs focus:border-[#6A11CB] focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="glass"
                    onClick={() => void handleAddSubcategory(cat)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
 * 4. ADMIN HERO BANNERS MANAGEMENT
 * ========================================================================== */
export function AdminBannersPage() {
  const { data: settings } = useStoreSettings();
  const { pushToast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [titlePrefix, setTitlePrefix] = useState('');
  const [titleHighlight, setTitleHighlight] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Shop Now');
  const [ctaHref, setCtaHref] = useState('/shop');
  const [imageUrl, setImageUrl] = useState<string>(HERO_BANNERS.welcome);
  const [occasionTag, setOccasionTag] = useState<OccasionTag>('Birthday');

  if (!settings) {
    return <p className="text-sm text-[#5F4B78]">Loading hero banners...</p>;
  }

  async function handleAddSlide(e: React.FormEvent) {
    e.preventDefault();
    if (!settings || !titlePrefix.trim() || !titleHighlight.trim()) return;
    const nextSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      titlePrefix: titlePrefix.trim(),
      titleHighlight: titleHighlight.trim(),
      subtitle: subtitle.trim() || 'Custom Gifts • Unique Designs • Made with Love',
      ctaLabel: ctaLabel.trim() || 'Shop Now',
      ctaHref: ctaHref.trim() || '/shop',
      imageUrl,
      occasionTag,
      isActive: true,
      sortOrder: settings.heroSlides.length + 1,
    };
    await services.settings.updateSettings({
      ...settings,
      heroSlides: [...settings.heroSlides, nextSlide],
    });
    setTitlePrefix('');
    setTitleHighlight('');
    setSubtitle('');
    setShowAddForm(false);
    pushToast({ title: 'Hero banner added', variant: 'success' });
  }

  async function toggleSlide(slideId: string) {
    if (!settings) return;
    await services.settings.updateSettings({
      ...settings,
      heroSlides: settings.heroSlides.map((s) =>
        s.id === slideId ? { ...s, isActive: !s.isActive } : s
      ),
    });
  }

  async function removeSlide(slideId: string) {
    if (!settings) return;
    await services.settings.updateSettings({
      ...settings,
      heroSlides: settings.heroSlides.filter((s) => s.id !== slideId),
    });
    pushToast({ title: 'Hero banner removed', variant: 'info' });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
            Hero Banners ({settings.heroSlides.length})
          </h1>
          <p className="text-[11px] text-[#5F4B78] sm:text-xs">
            Manage homepage promotional slider banners
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showAddForm ? 'Close' : 'Add Slide'}</span>
        </Button>
      </div>

      {showAddForm && (
        <form
          onSubmit={(e) => void handleAddSlide(e)}
          className="space-y-3 rounded-2xl border border-[#6A11CB]/25 bg-white p-4 shadow-md sm:p-5"
        >
          <h2 className="font-display text-base font-bold text-[#2A0E4D]">New Hero Banner Slide</h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              required
              placeholder="Heading Prefix (e.g. Personalized Gifts for)"
              value={titlePrefix}
              onChange={(e) => setTitlePrefix(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <input
              type="text"
              required
              placeholder="Highlight Text (e.g. Every Moment)"
              value={titleHighlight}
              onChange={(e) => setTitleHighlight(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Subtitle copy"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <input
              type="text"
              placeholder="CTA Button Label"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <input
              type="text"
              placeholder="CTA Path (e.g. /shop)"
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <select
              value={MEDIA_OPTIONS.some((m) => m.url === imageUrl) ? imageUrl : ''}
              onChange={(e) => {
                if (e.target.value) setImageUrl(e.target.value);
              }}
              className="h-11 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs focus:border-[#6A11CB] focus:outline-none"
            >
              {!MEDIA_OPTIONS.some((m) => m.url === imageUrl) && (
                <option value="">Uploaded Custom Banner</option>
              )}
              {MEDIA_OPTIONS.map((m) => (
                <option key={m.url} value={m.url}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:justify-between">
            <select
              value={occasionTag}
              onChange={(e) => setOccasionTag(e.target.value as OccasionTag)}
              className="h-10 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs focus:border-[#6A11CB] focus:outline-none"
            >
              {OFFICIAL_OCCASIONS.map((o) => (
                <option key={o.id} value={o.tag}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#6A11CB]/40 bg-[#FAF6FF] px-3 text-xs font-bold text-[#6A11CB]">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Banner</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || file.size > 1.5 * 1024 * 1024) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') setImageUrl(reader.result);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>

            <div className="col-span-2 sm:col-span-1">
              <Button type="submit" size="sm" variant="primary" fullWidth>
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Save Banner Slide</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-3.5 md:grid-cols-2">
        {settings.heroSlides.map((slide) => (
          <div
            key={slide.id}
            className="overflow-hidden rounded-2xl border border-[#EBD8FF] bg-white shadow-xs"
          >
            <div className="aspect-[16/7] w-full overflow-hidden bg-[#FAF6FF]">
              <ProductImage
                src={slide.imageUrl}
                alt={slide.titleHighlight}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-2.5 p-3.5 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-[#2A0E4D] sm:text-base">
                    {slide.titlePrefix}{' '}
                    <span className="text-[#FF4D8D]">{slide.titleHighlight}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#5F4B78]">{slide.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleSlide(slide.id)}
                  className={`min-h-[32px] shrink-0 rounded-lg px-2.5 text-[11px] font-bold ${
                    slide.isActive ? 'bg-[#F4EBFF] text-[#6A11CB]' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {slide.isActive ? 'Active' : 'Paused'}
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-[#F0E4FF] pt-2.5 text-xs">
                <span className="truncate font-mono text-[11px] text-[#7B6496]">
                  {slide.ctaLabel} → {slide.ctaHref}
                </span>
                <button
                  type="button"
                  onClick={() => void removeSlide(slide.id)}
                  className="inline-flex min-h-[32px] items-center gap-1 px-2 text-xs font-semibold text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
 * 5. ADMIN INVENTORY CONTROL (MOBILE CARDS + QUICK STOCK BUTTONS)
 * ========================================================================== */
export function AdminInventoryPage() {
  const { data: products } = useProducts({ includeInactive: true });
  const { pushToast } = useToast();
  const [search, setSearch] = useState('');
  const [stockTab, setStockTab] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (stockTab === 'LOW' && (p.stockCount === 0 || p.stockCount > 12)) return false;
      if (stockTab === 'OUT' && p.stockCount !== 0) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, search, stockTab]);

  async function adjustStock(product: Product, delta: number) {
    const nextStock = Math.max(0, product.stockCount + delta);
    await services.catalog.saveProduct({
      ...product,
      stockCount: nextStock,
      availability: nextStock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
    });
    pushToast({
      title: 'Stock updated',
      description: `${product.name}: ${nextStock} units`,
      variant: 'info',
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
          Inventory &amp; Stock
        </h1>
        <p className="text-[11px] text-[#5F4B78] sm:text-xs">
          Adjust units in 1 tap. Items ≤ 12 units are highlighted.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-xs sm:p-5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-[#EBD8FF] bg-[#FAF6FF] px-3">
            <Search className="h-4 w-4 text-[#6A11CB]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SKU or product..."
              className="w-full bg-transparent text-sm text-[#2A0E4D] focus:outline-none sm:text-xs"
            />
          </div>
          <div className="flex gap-1.5">
            {(
              [
                ['ALL', `All (${products.length})`],
                ['LOW', `Low (${products.filter((p) => p.stockCount > 0 && p.stockCount <= 12).length})`],
                ['OUT', `Out (${products.filter((p) => p.stockCount === 0).length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStockTab(key)}
                className={`min-h-[36px] flex-1 rounded-lg px-3 text-xs font-semibold sm:flex-initial ${
                  stockTab === key
                    ? 'bg-[#6A11CB] text-white'
                    : 'bg-[#FAF6FF] text-[#5F4B78]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Inventory Cards */}
        <div className="space-y-2.5 md:hidden">
          {filtered.map((p) => {
            const isLow = p.stockCount <= 12;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#F0E4FF] bg-[#FDFBFF] p-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#EBD8FF] bg-white">
                    <ProductImage
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#2A0E4D]">{p.name}</p>
                    <p className="font-mono text-[10.5px] text-[#7B6496]">{p.sku}</p>
                    <p
                      className={`mt-0.5 text-[11px] font-bold ${
                        p.stockCount === 0
                          ? 'text-rose-600'
                          : isLow
                            ? 'text-[#FF4D8D]'
                            : 'text-emerald-700'
                      }`}
                    >
                      {p.stockCount === 0
                        ? 'Out of Stock'
                        : isLow
                          ? `Low · ${p.stockCount} left`
                          : `In Stock · ${p.stockCount}`}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void adjustStock(p, -1)}
                    aria-label={`Decrease stock for ${p.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EBD8FF] bg-white text-[#5F4B78] active:bg-[#F4EBFF]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void adjustStock(p, 5)}
                    aria-label={`Add 5 stock for ${p.name}`}
                    className="flex h-9 items-center justify-center gap-0.5 rounded-lg bg-[#6A11CB] px-2.5 text-xs font-bold text-white active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />5
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0E4FF] text-[#7B6496]">
                <th className="pb-2.5 font-semibold">SKU</th>
                <th className="pb-2.5 font-semibold">Product</th>
                <th className="pb-2.5 font-semibold">Status</th>
                <th className="pb-2.5 text-right font-semibold">Units Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5ECFF]">
              {filtered.map((p) => {
                const isLow = p.stockCount <= 12;
                return (
                  <tr key={p.id} className="hover:bg-[#FAF6FF]">
                    <td className="py-3 font-mono text-[#7B6496]">{p.sku}</td>
                    <td className="py-3 font-semibold text-[#2A0E4D]">{p.name}</td>
                    <td className="py-3 font-bold">
                      {p.stockCount === 0 ? (
                        <span className="text-rose-700">Out of Stock</span>
                      ) : isLow ? (
                        <span className="text-[#FF4D8D]">Low Stock</span>
                      ) : (
                        <span className="text-[#6A11CB]">In Stock</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void adjustStock(p, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EBD8FF] text-[#5F4B78] hover:bg-[#FAF6FF]"
                          aria-label={`Decrease stock for ${p.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[36px] text-center font-mono text-sm font-bold tabular-nums text-[#2A0E4D]">
                          {p.stockCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => void adjustStock(p, 5)}
                          className="flex h-8 items-center justify-center gap-0.5 rounded-lg bg-[#6A11CB] px-2.5 text-[11px] font-bold text-white hover:bg-[#580DAC]"
                          aria-label={`Add 5 stock for ${p.name}`}
                        >
                          <Plus className="h-3 w-3" />5
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 6. ADMIN GIFT WRAPPING CONFIGURATION
 * ========================================================================== */
export function AdminGiftWrappingPage() {
  const { data: config } = useGiftWrapConfig();
  const { pushToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [chargeInr, setChargeInr] = useState('79');

  if (!config) {
    return <p className="text-sm text-[#5F4B78]">Loading Gift Wrapping configuration...</p>;
  }

  async function handleToggleGlobal() {
    if (!config) return;
    await services.giftWrap.setGloballyEnabled(!config.globallyEnabled);
    pushToast({
      title: !config.globallyEnabled ? 'Gift Wrapping enabled' : 'Gift Wrapping paused',
      variant: 'info',
    });
  }

  async function handleAddStyle(e: React.FormEvent) {
    e.preventDefault();
    if (!config || !name.trim()) return;
    const style: GiftWrapStyle = {
      id: `gw-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Signature GiftKart wrapping with ribbon and note card.',
      chargeInr: Math.max(0, Math.round(Number(chargeInr) || 0)),
      accentColorHex: '#FF4D8D',
      isActive: true,
      sortOrder: config.styles.length + 1,
    };
    await services.giftWrap.upsertStyle(style);
    setName('');
    setDescription('');
    setChargeInr('79');
    setShowForm(false);
    pushToast({ title: 'Gift wrap style added', variant: 'success' });
  }

  async function toggleStyle(style: GiftWrapStyle) {
    await services.giftWrap.upsertStyle({ ...style, isActive: !style.isActive });
  }

  async function deleteStyle(styleId: string) {
    await services.giftWrap.deleteStyle(styleId);
    pushToast({ title: 'Gift wrap style removed', variant: 'info' });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
            Gift Wrapping
          </h1>
          <p className="mt-0.5 text-xs text-[#5F4B78]">
            Control checkout gift wrapping styles and INR charges
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleToggleGlobal()}
            className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-colors sm:flex-initial ${
              config.globallyEnabled
                ? 'bg-[#6A11CB] text-white'
                : 'border border-[#EBD8FF] bg-[#FAF6FF] text-[#5F4B78]'
            }`}
          >
            <Gift className="h-4 w-4" />
            <span>{config.globallyEnabled ? 'Enabled' : 'Disabled'}</span>
          </button>
          <Button
            type="button"
            size="sm"
            variant="accent"
            onClick={() => setShowForm((p) => !p)}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{showForm ? 'Close' : 'Add Style'}</span>
          </Button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleAddStyle(e)}
          className="space-y-3 rounded-2xl border border-[#6A11CB]/25 bg-white p-4 shadow-md sm:p-5"
        >
          <h2 className="font-display text-base font-bold text-[#2A0E4D]">Add Wrapping Style</h2>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <input
              type="text"
              required
              placeholder="Style Name (e.g. Lavender Box)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                required
                placeholder="Fee (₹)"
                value={chargeInr}
                onChange={(e) => setChargeInr(e.target.value)}
                className="h-11 w-28 rounded-xl border border-[#EBD8FF] px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
              <Button type="submit" size="sm" variant="primary" fullWidth>
                <Check className="h-4 w-4" />
                <span>Save</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {config.styles.map((style) => (
          <div
            key={style.id}
            className="flex flex-col justify-between gap-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base font-bold text-[#2A0E4D]">{style.name}</h3>
                <span className="font-mono text-sm font-bold tabular-nums text-[#6A11CB]">
                  {formatInr(style.chargeInr)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#5F4B78]">{style.description}</p>
            </div>

            <div className="flex items-center justify-between border-t border-[#F0E4FF] pt-2.5">
              <button
                type="button"
                onClick={() => void toggleStyle(style)}
                className={`min-h-[34px] rounded-lg px-3 text-xs font-bold ${
                  style.isActive ? 'bg-[#F4EBFF] text-[#6A11CB]' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {style.isActive ? 'Active' : 'Paused'}
              </button>
              <button
                type="button"
                onClick={() => void deleteStyle(style.id)}
                className="inline-flex min-h-[34px] items-center gap-1 px-2 text-xs font-semibold text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
