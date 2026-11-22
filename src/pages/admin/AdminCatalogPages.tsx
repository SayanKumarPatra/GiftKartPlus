import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Edit3,
  FolderTree,
  Gift,
  Image as ImageIcon,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  Upload,
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
import { resetAllDemoSeedData } from '../../data/seedData';
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

const MEDIA_OPTIONS: { label: string; url: string }[] = [
  { label: 'Banner 1 — Personalized Gifts', url: HERO_BANNERS.personalized },
  { label: 'Banner 2 — Birthday Gifts', url: HERO_BANNERS.birthday },
  { label: 'Banner 3 — Anniversary Gifts', url: HERO_BANNERS.anniversary },
  { label: 'Banner 4 — Customized Photo Gifts', url: HERO_BANNERS.photoGifts },
  { label: 'Banner 5 — Special Occasion Gifts', url: HERO_BANNERS.specialOccasion },
  { label: 'Coffee Mug Studio', url: STUDIO_MEDIA.coffeeMug },
  { label: 'LED Lamp Studio', url: STUDIO_MEDIA.ledLamp },
  { label: 'Photo Frame Studio', url: STUDIO_MEDIA.photoFrame },
  { label: 'T-shirt Print Studio', url: STUDIO_MEDIA.tshirtPrint },
  { label: 'Gift Box Studio', url: STUDIO_MEDIA.giftBox },
  { label: 'Gift Bag Studio', url: STUDIO_MEDIA.giftBag },
  { label: 'Handmade Gift Studio', url: STUDIO_MEDIA.handmadeGift },
  { label: 'Keychain Studio', url: STUDIO_MEDIA.keychain },
  { label: 'Cushion Studio', url: STUDIO_MEDIA.cushionKeychain },
  { label: 'Personalized Accessories Studio', url: STUDIO_MEDIA.personalizedAccessories },
  { label: 'Home Decor Studio', url: STUDIO_MEDIA.homeDecor },
  { label: 'Stationery Studio', url: STUDIO_MEDIA.stationeryDecor },
  { label: 'Couple & Friendship Studio', url: STUDIO_MEDIA.coupleFriendship },
  { label: 'Customized Photo Gifts Studio', url: STUDIO_MEDIA.customizedPhotoGifts },
  { label: 'Special Occasion Gifts Studio', url: STUDIO_MEDIA.specialOccasionGifts },
];

/* ============================================================================
 * 1. ADMIN DASHBOARD OVERVIEW
 * ========================================================================== */
export function AdminDashboardPage() {
  const { data: products } = useProducts({ includeInactive: true });
  const { data: categories } = useCategories(true);
  const { data: orders } = useOrders();
  const { data: coupons } = useCoupons();
  const { data: giftWrap } = useGiftWrapConfig();
  const { data: settings } = useStoreSettings();
  const { pushToast } = useToast();

  const totalDemoRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.fulfillmentStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.grandTotalInr, 0),
    [orders]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stockCount <= 12).sort((a, b) => a.stockCount - b.stockCount),
    [products]
  );

  const giftWrappedCount = useMemo(
    () => orders.filter((o) => o.giftWrap.enabled).length,
    [orders]
  );

  function handleResetDemo() {
    resetAllDemoSeedData();
    pushToast({
      title: 'Demo seed data restored',
      description:
        'All 15 official categories, exact subcategories, studio products, Jalchak delivery zone, and demo orders were restored.',
      variant: 'info',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-[#EBD8FF] bg-gradient-to-r from-[#6A11CB] to-[#9130E8] p-6 text-white shadow-lg shadow-[#6A11CB]/15">
        <div>
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            Local Demo Mode · Browser Storage
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            GiftKart Store Operations
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#F4EBFF]">
            Manage your 15 official gift categories, exact subcategories, personalized products, hero banners, gift wrapping, and Jalchak demo orders.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDemo}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#6A11CB] shadow-sm transition-colors hover:bg-[#FFF0F6] hover:text-[#FF4D8D]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Demo Seed</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F4B78]">Demo Order Volume</span>
            <ShoppingCart className="h-4 w-4 text-[#FF4D8D]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#2A0E4D]">
            {formatInr(totalDemoRevenue)}
          </p>
          <p className="mt-1 text-xs text-[#7B6496]">
            Across {orders.length} demo order(s) (non-cancelled)
          </p>
        </div>

        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F4B78]">Active Catalog</span>
            <Package className="h-4 w-4 text-[#6A11CB]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#2A0E4D]">
            {products.filter((p) => p.isActive).length}{' '}
            <span className="text-sm font-normal text-[#7B6496]">/ {products.length}</span>
          </p>
          <p className="mt-1 text-xs text-[#7B6496]">
            {categories.length} official main categories
          </p>
        </div>

        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F4B78]">Gift Wrapping</span>
            <Gift className="h-4 w-4 text-[#FF4D8D]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#2A0E4D]">
            {giftWrappedCount} / {orders.length}
          </p>
          <p className="mt-1 text-xs text-[#7B6496]">
            {giftWrap?.globallyEnabled ? 'Enabled' : 'Disabled'} ·{' '}
            {giftWrap?.styles.filter((s) => s.isActive).length ?? 0} active styles
          </p>
        </div>

        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F4B78]">Delivery Zones &amp; Promos</span>
            <Sparkles className="h-4 w-4 text-[#6A11CB]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#2A0E4D]">
            {settings?.deliveryZones.filter((z) => z.isActive).length ?? 0} Zones
          </p>
          <p className="mt-1 text-xs text-[#7B6496]">
            {settings?.deliveryZones.map((z) => z.name).join(' & ') || 'Jalchak'} ·{' '}
            {coupons.filter((c) => c.isActive).length} active coupons
          </p>
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#F0E4FF] pb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#2A0E4D]">
                Recent Demo Orders
              </h2>
              <p className="text-xs text-[#5F4B78]">
                Preserved with immutable product, price, SKU, and gift-wrapping snapshots.
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
            >
              <span>Manage Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
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
                      {order.orderNumber}
                    </td>
                    <td className="py-3">
                      <p className="font-semibold text-[#2A0E4D]">{order.customer.fullName}</p>
                      <p className="text-[11px] text-[#7B6496]">
                        {order.customer.deliveryZoneNameSnapshot} · {formatDateTime(order.createdAt)}
                      </p>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex rounded-full bg-[#F4EBFF] px-2.5 py-0.5 text-[11px] font-semibold text-[#6A11CB]">
                        {order.fulfillmentStatus}
                      </span>
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

        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F0E4FF] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#FF4D8D]" />
              <h2 className="font-display text-lg font-bold text-[#2A0E4D]">Low Stock Watch</h2>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
            >
              Inventory →
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#5F4B78]">
              All catalog items are well stocked (&gt; 12 units).
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {lowStockProducts.slice(0, 5).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#F0E4FF] bg-[#FDFBFF] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#2A0E4D]">{p.name}</p>
                    <p className="font-mono text-[11px] text-[#7B6496]">{p.sku}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#FFF0F6] px-2.5 py-0.5 font-mono text-xs font-bold text-[#FF4D8D]">
                    {p.stockCount} left
                  </span>
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
 * 2. ADMIN PRODUCTS MANAGEMENT
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
  const firstCat = categories[0];
  return {
    id: '',
    name: '',
    sku: `GK-NEW-${Math.floor(100 + Math.random() * 899)}`,
    priceInr: '499',
    compareAtPriceInr: '649',
    stockCount: '25',
    categoryId: firstCat?.id ?? 'cat-coffee-mug',
    subcategoryId: firstCat?.subcategories[0]?.id ?? '',
    shortDescription: '',
    description: '',
    imageUrl: STUDIO_MEDIA.coffeeMug,
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
  const [editingForm, setEditingForm] = useState<ProductFormState | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCatId && p.categoryId !== filterCatId) {
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
  }, [products, search, filterCatId]);

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
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingForm) return;
    const price = Number(editingForm.priceInr);
    const compareAt = editingForm.compareAtPriceInr ? Number(editingForm.compareAtPriceInr) : undefined;
    const stock = Math.max(0, Number(editingForm.stockCount) || 0);

    if (!editingForm.name.trim() || !editingForm.sku.trim() || Number.isNaN(price) || price <= 0) {
      pushToast({
        title: 'Invalid product details',
        description: 'Name, SKU, and a valid INR price are required.',
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
        sku: editingForm.sku.trim().toUpperCase(),
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
        categoryId: editingForm.categoryId,
        subcategoryId: editingForm.subcategoryId || undefined,
        occasionTags:
          editingForm.occasionTags.length > 0 ? editingForm.occasionTags : ['Special Occasion'],
        images: [editingForm.imageUrl.trim() || STUDIO_MEDIA.giftBox],
        variants: existing?.variants ?? [{ name: 'Edition', options: ['Standard'] }],
        stockCount: stock,
        isBestSeller: editingForm.isBestSeller,
        isFeatured: editingForm.isFeatured,
        isActive: editingForm.isActive,
        supportsPersonalization: editingForm.supportsPersonalization,
        supportsPhotoUpload: editingForm.supportsPhotoUpload,
        personalizationPrompt: editingForm.personalizationPrompt.trim() || undefined,
        sampleRating: existing?.sampleRating ?? 4.8,
        sampleReviewCount: existing?.sampleReviewCount ?? 24,
        createdAt: existing?.createdAt,
      });

      pushToast({
        title: editingForm.id ? 'Product updated' : 'Product added to catalog',
        description: `${editingForm.name.trim()} saved to local catalog. Historical demo orders remain unchanged.`,
        variant: 'success',
      });
      setEditingForm(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    await services.catalog.deleteProduct(product.id);
    pushToast({
      title: 'Product removed',
      description: `${product.name} deleted from active catalog. Existing order snapshots remain intact.`,
      variant: 'info',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">Products Management</h1>
          <p className="text-xs text-[#5F4B78]">
            Editing product names or INR prices will never alter historical Demo Order snapshots.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setEditingForm(createEmptyProductForm(categories))}
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </Button>
      </div>

      {/* Add / Edit Product Drawer/Panel */}
      {editingForm && (
        <form
          onSubmit={(e) => void handleSaveProduct(e)}
          className="rounded-3xl border border-[#6A11CB]/25 bg-white p-6 shadow-md space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#F0E4FF] pb-3">
            <h2 className="font-display text-lg font-bold text-[#2A0E4D]">
              {editingForm.id ? 'Edit Product' : 'Create New Product'}
            </h2>
            <button
              type="button"
              onClick={() => setEditingForm(null)}
              className="text-xs font-semibold text-[#5F4B78] hover:text-[#FF4D8D]"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#4A3862]">Product Name *</label>
              <input
                type="text"
                required
                value={editingForm.name}
                onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A3862]">SKU *</label>
              <input
                type="text"
                required
                value={editingForm.sku}
                onChange={(e) => setEditingForm({ ...editingForm, sku: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A3862]">Main Category *</label>
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
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-sm focus:border-[#6A11CB] focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A3862]">
                Subcategory {selectedFormCategory?.subcategories.length ? '(Exact Official)' : '(None)'}
              </label>
              <select
                value={editingForm.subcategoryId}
                onChange={(e) => setEditingForm({ ...editingForm, subcategoryId: e.target.value })}
                disabled={!selectedFormCategory?.subcategories.length}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-sm disabled:bg-[#FAF6FF] focus:border-[#6A11CB] focus:outline-none"
              >
                <option value="">— None —</option>
                {selectedFormCategory?.subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-[#4A3862]">
                Product Photo (Studio Preset or Local File Upload)
              </label>
              <div className="mt-1.5 flex flex-col gap-3 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3 sm:flex-row sm:items-center">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-white">
                  <ProductImage
                    src={editingForm.imageUrl}
                    alt={editingForm.name || 'Preview'}
                    className="h-full w-full"
                  />
                </div>
                <div className="grid flex-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <span className="block text-[11px] font-semibold text-[#6E5B85]">
                      Choose Studio Photo Preset
                    </span>
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
                      className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
                    >
                      {!MEDIA_OPTIONS.some((m) => m.url === editingForm.imageUrl) && (
                        <option value="">Custom Uploaded Image (Local Preview)</option>
                      )}
                      {MEDIA_OPTIONS.map((m) => (
                        <option key={m.url} value={m.url}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-[#6E5B85]">
                      Or Upload Image (Local Demo ≤ 1.5MB)
                    </span>
                    <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#6A11CB]/40 bg-white px-3 py-2 text-xs font-bold text-[#6A11CB] transition hover:border-[#FF4D8D] hover:text-[#FF4D8D]">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Product Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 1.5 * 1024 * 1024) {
                            pushToast({
                              title: 'File Too Large for Demo Storage',
                              description: 'Please upload an image under 1.5 MB for local demo preview.',
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
                                title: 'Product Photo Loaded',
                                description: `${file.name} stored locally in browser demo mode.`,
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A3862]">Price (INR ₹) *</label>
              <input
                type="number"
                min={1}
                required
                value={editingForm.priceInr}
                onChange={(e) => setEditingForm({ ...editingForm, priceInr: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A3862]">
                Compare-at MRP (INR ₹)
              </label>
              <input
                type="number"
                min={0}
                value={editingForm.compareAtPriceInr}
                onChange={(e) =>
                  setEditingForm({ ...editingForm, compareAtPriceInr: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A3862]">Stock Quantity *</label>
              <input
                type="number"
                min={0}
                required
                value={editingForm.stockCount}
                onChange={(e) => setEditingForm({ ...editingForm, stockCount: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-[#4A3862]">Short Description</label>
              <input
                type="text"
                value={editingForm.shortDescription}
                onChange={(e) =>
                  setEditingForm({ ...editingForm, shortDescription: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-[#4A3862]">Full Description</label>
              <textarea
                rows={2}
                value={editingForm.description}
                onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-sm focus:border-[#6A11CB] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold text-[#4A3862]">
            {(
              [
                ['isActive', 'Active on Storefront'],
                ['isBestSeller', 'Best Seller'],
                ['isFeatured', 'Featured'],
                ['supportsPersonalization', 'Personalization Text'],
                ['supportsPhotoUpload', 'Photo Upload Preview'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="inline-flex cursor-pointer items-center gap-2">
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

          <div className="flex justify-end gap-2.5 border-t border-[#F0E4FF] pt-4">
            <Button type="button" variant="glass" size="sm" onClick={() => setEditingForm(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              <Check className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Product'}</span>
            </Button>
          </div>
        </form>
      )}

      {/* Filters & Table */}
      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[#EBD8FF] bg-[#FAF6FF] px-3 py-2">
            <Search className="h-4 w-4 text-[#6A11CB]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full bg-transparent text-xs text-[#2A0E4D] focus:outline-none"
            />
          </div>

          <select
            value={filterCatId}
            onChange={(e) => setFilterCatId(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs font-semibold text-[#4A3862] focus:border-[#6A11CB] focus:outline-none"
          >
            <option value="">All 15 Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0E4FF] text-[#7B6496]">
                <th className="pb-2.5 font-semibold">Product</th>
                <th className="pb-2.5 font-semibold">Category / Subcategory</th>
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
                    <td className="py-3 font-mono tabular-nums">
                      <span
                        className={
                          product.stockCount <= 12
                            ? 'font-bold text-[#FF4D8D]'
                            : 'font-semibold text-[#2A0E4D]'
                        }
                      >
                        {product.stockCount}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          product.isActive
                            ? 'bg-[#F4EBFF] text-[#6A11CB]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Hidden'}
                      </span>
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
 * 3. ADMIN CATEGORIES & SUBCATEGORIES MANAGEMENT (15 OFFICIAL + EXACT NAMES)
 * ========================================================================== */
export function AdminCategoriesPage() {
  const { data: categories } = useCategories(true);
  const { pushToast } = useToast();
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({});

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
    pushToast({
      title: 'Subcategory added',
      description: `${raw} added under ${cat.name}.`,
      variant: 'success',
    });
  }

  async function handleDeleteSubcategory(cat: Category, subId: string, subName: string) {
    await services.catalog.deleteSubcategory(cat.id, subId);
    pushToast({
      title: 'Subcategory removed',
      description: `${subName} removed from ${cat.name}.`,
      variant: 'info',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
          Official 15 Categories &amp; Subcategories
        </h1>
        <p className="text-xs text-[#5F4B78]">
          Preserves all 15 official GiftKart categories and exact Coffee Mug, T-shirt Print, and Photo Frame subcategory names.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-[#FAF6FF]">
                  <ProductImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#8C75A8]">
                      #{cat.sortOrder}
                    </span>
                    <h2 className="font-display text-base font-bold text-[#2A0E4D]">{cat.name}</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-[#5F4B78]">{cat.description}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void toggleCategoryActive(cat)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
                  cat.isActive
                    ? 'bg-[#F4EBFF] text-[#6A11CB]'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {cat.isActive ? 'Active' : 'Hidden'}
              </button>
            </div>

            <div className="border-t border-[#F0E4FF] pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7B6496]">
                <FolderTree className="h-3.5 w-3.5 text-[#FF4D8D]" />
                <span>Subcategories ({cat.subcategories.length})</span>
              </p>

              {cat.subcategories.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {cat.subcategories.map((sub) => (
                    <span
                      key={sub.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#EBD8FF] bg-[#FAF6FF] px-2.5 py-1 text-xs font-medium text-[#2A0E4D]"
                    >
                      <span>{sub.name}</span>
                      <button
                        type="button"
                        onClick={() => void handleDeleteSubcategory(cat, sub.id, sub.name)}
                        aria-label={`Delete ${sub.name}`}
                        className="text-[#8C75A8] hover:text-rose-600"
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
                  placeholder={`Add subcategory to ${cat.name}...`}
                  className="flex-1 rounded-xl border border-[#EBD8FF] bg-[#FDFBFF] px-3 py-1.5 text-xs focus:border-[#6A11CB] focus:outline-none"
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
        ))}
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

  const [titlePrefix, setTitlePrefix] = useState('');
  const [titleHighlight, setTitleHighlight] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Shop Now');
  const [ctaHref, setCtaHref] = useState('/shop');
  const [imageUrl, setImageUrl] = useState<string>(STUDIO_MEDIA.heroPersonalized);
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
    pushToast({ title: 'Hero slide added', variant: 'success' });
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
    pushToast({ title: 'Hero slide removed', variant: 'info' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
          Homepage Hero Slider Banners
        </h1>
        <p className="text-xs text-[#5F4B78]">
          Control the rotating hero banners displayed on the GiftKart homepage.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleAddSlide(e)}
        className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-4"
      >
        <h2 className="font-display text-base font-bold text-[#2A0E4D]">Add Hero Banner Slide</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            type="text"
            required
            placeholder="Heading Prefix (e.g. Personalized Gifts for)"
            value={titlePrefix}
            onChange={(e) => setTitlePrefix(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <input
            type="text"
            required
            placeholder="Pink Highlight Text (e.g. Every Moment)"
            value={titleHighlight}
            onChange={(e) => setTitleHighlight(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Subtitle copy"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <input
            type="text"
            placeholder="CTA Button Label"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <input
            type="text"
            placeholder="CTA Path (e.g. /shop)"
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <select
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          >
            {MEDIA_OPTIONS.map((m) => (
              <option key={m.url} value={m.url}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#5F4B78]">Occasion Tag:</span>
            <select
              value={occasionTag}
              onChange={(e) => setOccasionTag(e.target.value as OccasionTag)}
              className="rounded-xl border border-[#EBD8FF] bg-white px-3 py-1.5 text-xs focus:border-[#6A11CB] focus:outline-none"
            >
              {OFFICIAL_OCCASIONS.map((o) => (
                <option key={o.id} value={o.tag}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm" variant="primary">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Add Hero Slide</span>
          </Button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
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
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-bold text-[#2A0E4D]">
                    {slide.titlePrefix}{' '}
                    <span className="text-[#FF4D8D]">{slide.titleHighlight}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#5F4B78]">{slide.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleSlide(slide.id)}
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    slide.isActive ? 'bg-[#F4EBFF] text-[#6A11CB]' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {slide.isActive ? 'Active' : 'Paused'}
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-[#F0E4FF] pt-2.5 text-xs">
                <span className="font-mono text-[#7B6496]">
                  CTA: {slide.ctaLabel} → {slide.ctaHref}
                </span>
                <button
                  type="button"
                  onClick={() => void removeSlide(slide.id)}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Remove
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
 * 5. ADMIN INVENTORY CONTROL
 * ========================================================================== */
export function AdminInventoryPage() {
  const { data: products } = useProducts({ includeInactive: true });
  const { pushToast } = useToast();

  async function adjustStock(product: Product, delta: number) {
    const nextStock = Math.max(0, product.stockCount + delta);
    await services.catalog.saveProduct({
      ...product,
      stockCount: nextStock,
    });
    pushToast({
      title: 'Stock updated',
      description: `${product.name} stock is now ${nextStock}.`,
      variant: 'info',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
          Inventory &amp; Stock Control
        </h1>
        <p className="text-xs text-[#5F4B78]">
          Quickly replenish or adjust unit counts. Items at or below 12 units are highlighted in GiftKart Pink.
        </p>
      </div>

      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs overflow-x-auto">
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
            {products.map((p) => {
              const isLow = p.stockCount <= 12;
              return (
                <tr key={p.id} className="hover:bg-[#FAF6FF]">
                  <td className="py-3 font-mono text-[#7B6496]">{p.sku}</td>
                  <td className="py-3 font-semibold text-[#2A0E4D]">{p.name}</td>
                  <td className="py-3">
                    {p.stockCount === 0 ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 font-bold text-rose-700">
                        Out of Stock
                      </span>
                    ) : isLow ? (
                      <span className="rounded-full bg-[#FFF0F6] px-2.5 py-0.5 font-bold text-[#FF4D8D]">
                        Low Stock
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#F4EBFF] px-2.5 py-0.5 font-semibold text-[#6A11CB]">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void adjustStock(p, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EBD8FF] text-[#5F4B78] hover:bg-[#FAF6FF]"
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
                        className="flex h-7 items-center justify-center gap-0.5 rounded-lg bg-[#6A11CB] px-2 text-[11px] font-bold text-white hover:bg-[#580DAC]"
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
  );
}

/* ============================================================================
 * 6. ADMIN GIFT WRAPPING CONFIGURATION
 * ========================================================================== */
export function AdminGiftWrappingPage() {
  const { data: config } = useGiftWrapConfig();
  const { pushToast } = useToast();

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
            Gift Wrapping Configuration
          </h1>
          <p className="mt-0.5 text-xs text-[#5F4B78]">
            Enable or disable storefront gift wrapping and configure wrapping styles and INR charges.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleToggleGlobal()}
          className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-xs font-bold transition-colors ${
            config.globallyEnabled
              ? 'bg-[#6A11CB] text-white'
              : 'border border-[#EBD8FF] bg-[#FAF6FF] text-[#5F4B78]'
          }`}
        >
          <Gift className="h-4 w-4" />
          <span>{config.globallyEnabled ? 'Globally Enabled' : 'Globally Disabled'}</span>
        </button>
      </div>

      <form
        onSubmit={(e) => void handleAddStyle(e)}
        className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-4"
      >
        <h2 className="font-display text-base font-bold text-[#2A0E4D]">Add Wrapping Style</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            required
            placeholder="Style Name (e.g. Festive Lavender Box)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              required
              placeholder="Charge (₹)"
              value={chargeInr}
              onChange={(e) => setChargeInr(e.target.value)}
              className="w-28 rounded-xl border border-[#EBD8FF] px-3 py-2 font-mono text-xs focus:border-[#6A11CB] focus:outline-none"
            />
            <Button type="submit" size="sm" variant="accent" fullWidth>
              <Plus className="h-3.5 w-3.5" />
              <span>Add Style</span>
            </Button>
          </div>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {config.styles.map((style) => (
          <div
            key={style.id}
            className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs flex flex-col justify-between gap-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base font-bold text-[#2A0E4D]">{style.name}</h3>
                <span className="font-mono text-sm font-bold text-[#6A11CB]">
                  {formatInr(style.chargeInr)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#5F4B78]">{style.description}</p>
            </div>

            <div className="flex items-center justify-between border-t border-[#F0E4FF] pt-3">
              <button
                type="button"
                onClick={() => void toggleStyle(style)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  style.isActive ? 'bg-[#F4EBFF] text-[#6A11CB]' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {style.isActive ? 'Active' : 'Inactive'}
              </button>
              <button
                type="button"
                onClick={() => void deleteStyle(style.id)}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
