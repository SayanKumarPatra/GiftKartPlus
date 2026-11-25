import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Edit3,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCategories, useProducts } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { ALL_GIFTS_CATEGORY_ID } from '../../data/seedData';
import { formatInr, slugify } from '../../utils/format';
import type { Product } from '../../types';
import {
  AdminConfirmDialog,
  AdminEmptyState,
  AdminToast,
  AdminToggleSwitch,
  readImageFileAsDataUrl,
} from '../../components/admin/AdminSharedUI';

interface ProductDraft {
  id: string;
  name: string;
  description: string;
  priceInr: string;
  compareAtPriceInr: string;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
  supportsPersonalization: boolean;
  supportsPhotoUpload: boolean;
}

function createEmptyProductDraft(defaultCategoryId: string): ProductDraft {
  return {
    id: '',
    name: '',
    description: '',
    priceInr: '',
    compareAtPriceInr: '',
    categoryId: defaultCategoryId,
    imageUrl: '',
    isAvailable: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
  };
}

export function AdminProductsPage() {
  const { data: categories } = useCategories(true);
  const { data: products } = useProducts({ includeInactive: true });
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const assignableCategories = useMemo(
    () => categories.filter((c) => c.id !== ALL_GIFTS_CATEGORY_ID),
    [categories]
  );

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [filterOpen, setFilterOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(() =>
    createEmptyProductDraft('cat-photo-frame')
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setDraft(
        createEmptyProductDraft(assignableCategories[0]?.id || 'cat-photo-frame')
      );
      setEditorOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, assignableCategories]);

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (
        categoryFilter !== 'ALL' &&
        categoryFilter !== ALL_GIFTS_CATEGORY_ID &&
        p.categoryId !== categoryFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (categoryMap.get(p.categoryId) ?? '').toLowerCase().includes(q)
      );
    });
  }, [products, categoryFilter, search, categoryMap]);

  function openAddProduct() {
    setDraft(
      createEmptyProductDraft(assignableCategories[0]?.id || 'cat-photo-frame')
    );
    setEditorOpen(true);
  }

  function openEditProduct(product: Product) {
    const available =
      product.isActive && product.availability !== 'OUT_OF_STOCK';
    setDraft({
      id: product.id,
      name: product.name,
      description: product.description || product.shortDescription || '',
      priceInr: String(product.priceInr),
      compareAtPriceInr: product.compareAtPriceInr
        ? String(product.compareAtPriceInr)
        : '',
      categoryId: product.categoryId,
      imageUrl: product.images[0] || '',
      isAvailable: available,
      supportsPersonalization: product.supportsPersonalization,
      supportsPhotoUpload: Boolean(product.supportsPhotoUpload),
    });
    setEditorOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await readImageFileAsDataUrl(file, 1000);
      setDraft((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to upload product image.',
        'error'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = draft.name.trim();
    const price = Number(draft.priceInr);
    const compareAt = draft.compareAtPriceInr.trim()
      ? Number(draft.compareAtPriceInr)
      : undefined;

    if (!cleanName) {
      showNotice('Please enter a product name.', 'error');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      showNotice('Please enter a valid price in ₹.', 'error');
      return;
    }

    setSaving(true);
    try {
      const existing = draft.id
        ? products.find((p) => p.id === draft.id)
        : undefined;
      const productId = existing?.id || `prod-${Date.now()}`;
      const productSlug =
        existing?.slug || `${slugify(cleanName)}-${Date.now().toString(36).slice(-4)}`;
      const sku =
        existing?.sku ||
        `GK-${cleanName.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'GIFT'}-${Date.now().toString().slice(-3)}`;

      const desc = draft.description.trim();
      const shortDesc =
        desc.length > 120 ? `${desc.slice(0, 117)}...` : desc || cleanName;

      await services.catalog.saveProduct({
        id: productId,
        slug: productSlug,
        sku,
        name: cleanName,
        shortDescription: shortDesc,
        description: desc || cleanName,
        priceInr: Math.round(price),
        compareAtPriceInr:
          compareAt && Number.isFinite(compareAt) && compareAt > price
            ? Math.round(compareAt)
            : undefined,
        categoryId:
          draft.categoryId || assignableCategories[0]?.id || 'cat-photo-frame',
        subcategoryId: existing?.subcategoryId,
        occasionTags: existing?.occasionTags ?? ['Birthday', 'Special Occasion'],
        images: draft.imageUrl.trim() ? [draft.imageUrl.trim()] : [],
        variants: existing?.variants ?? [],
        stockCount: draft.isAvailable ? 99 : 0,
        availability: draft.isAvailable ? 'IN_STOCK' : 'OUT_OF_STOCK',
        isBestSeller: existing?.isBestSeller ?? false,
        isFeatured: existing?.isFeatured ?? true,
        isActive: draft.isAvailable,
        supportsPersonalization: draft.supportsPersonalization,
        supportsPhotoUpload: draft.supportsPhotoUpload,
        personalizationPrompt:
          existing?.personalizationPrompt ??
          'Enter custom name or message to print',
        createdAt: existing?.createdAt,
      });

      await services.adminAuth.logActivity(
        existing ? `Updated product "${cleanName}"` : `Added product "${cleanName}"`,
        'Products Management'
      );
      setEditorOpen(false);
      showNotice(
        existing
          ? 'Product updated on live storefront.'
          : 'Product added to live storefront.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteProduct() {
    if (!deleteTarget) return;
    await services.catalog.deleteProduct(deleteTarget.id);
    await services.adminAuth.logActivity(
      `Deleted product "${deleteTarget.name}"`,
      'Products Management'
    );
    setDeleteTarget(null);
    showNotice('Product deleted.');
  }

  return (
    <div className="space-y-3">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {/* Search + Category Filter Row (Matches Mockup Screen 5) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6894]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-10 w-full rounded-full border border-[#E5D5FA] bg-white pl-9.5 pr-3.5 text-[13px] font-medium text-[#1E1035] placeholder:text-[#8E7EA6] shadow-[0_4px_12px_-8px_rgba(106,17,203,0.18)] focus:border-[#6A11CB] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen((prev) => !prev)}
          aria-label="Filter by category"
          className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
            categoryFilter !== 'ALL' || filterOpen
              ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
              : 'border-[#E5D5FA] bg-white text-[#6A11CB]'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Collapsible 10-Category Filter Pills */}
      {filterOpen && (
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`shrink-0 cursor-pointer rounded-full px-3 py-1 text-[11.5px] font-bold transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-[#6A11CB] text-white'
                : 'border border-[#E5D5FA] bg-white text-[#4A3860]'
            }`}
          >
            All ({products.length})
          </button>
          {assignableCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`shrink-0 cursor-pointer rounded-full px-3 py-1 text-[11.5px] font-bold transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-[#6A11CB] text-white'
                  : 'border border-[#E5D5FA] bg-white text-[#4A3860]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <AdminEmptyState
          icon={<Package className="h-5 w-5" />}
          title="No products found."
          description={
            products.length === 0
              ? 'Add your first GiftKart product to publish it live on the storefront.'
              : 'Try clearing your search or switching category filters.'
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredProducts.map((product) => {
            const isAvailable =
              product.isActive && product.availability !== 'OUT_OF_STOCK';
            return (
              <div
                key={product.id}
                className="flex items-center justify-between gap-2.5 rounded-2xl border border-[#EBD8FF]/90 bg-white p-2.5 shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EFE3FF] bg-[#FAF6FF]">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-[#9B8AB4]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-extrabold text-[#1E1035]">
                      {product.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[13px] font-extrabold tabular-nums text-[#6A11CB]">
                        {formatInr(product.priceInr)}
                      </span>
                      <span className="text-[11px] font-medium text-[#75648E]">
                        · {categoryMap.get(product.categoryId) || 'Uncategorized'}
                      </span>
                    </div>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditProduct(product)}
                    aria-label={`Edit ${product.name}`}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[#E5D5FA] bg-[#FAF6FF] text-[#6A11CB] hover:bg-[#F3E8FF]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(product)}
                    aria-label={`Delete ${product.name}`}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Primary Add New Product Button (Matches Mockup Screen 5) */}
      <button
        type="button"
        onClick={openAddProduct}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#7E1DE0] to-[#A624C2] px-5 text-[13.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(106,17,203,0.5)] transition-transform active:scale-[0.98]"
      >
        <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
        <span>Add New Product</span>
      </button>

      {/* Add / Edit Product Sheet */}
      {editorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[95] flex items-end justify-center bg-[#1E1035]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
        >
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[26px] border border-[#EBD8FF] bg-white p-4 shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE3FF] pb-3">
              <h3 className="text-[15.5px] font-extrabold text-[#1E1035]">
                {draft.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                aria-label="Close product editor"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-[#FAF6FF] text-[#594A6B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-3.5 space-y-3">
              {/* Product Image Upload */}
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Product Image
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5D5FA] bg-[#FAF6FF]">
                    {draft.imageUrl ? (
                      <img
                        src={draft.imageUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-[#9B8AB4]" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-8 w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-[#6A11CB]/30 bg-[#F5ECFF] px-3 text-[11.5px] font-bold text-[#6A11CB]"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                    <input
                      type="url"
                      value={draft.imageUrl.startsWith('data:') ? '' : draft.imageUrl}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))
                      }
                      placeholder="Or paste image URL..."
                      className="h-8 w-full rounded-lg border border-[#DFCEF7] bg-[#FAF8FF] px-2.5 text-[11.5px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Custom Coffee Mug"
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={draft.priceInr}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, priceInr: e.target.value }))
                    }
                    placeholder="299"
                    className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                    MRP / Original (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draft.compareAtPriceInr}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        compareAtPriceInr: e.target.value,
                      }))
                    }
                    placeholder="Optional"
                    className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Category *
                </label>
                <select
                  value={draft.categoryId}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] font-medium text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                >
                  {assignableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe size, material, and customization details..."
                  className="w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] p-3 text-[12.5px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-2 rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E1035]">
                    Availability ({draft.isAvailable ? 'Available' : 'Unavailable'})
                  </span>
                  <AdminToggleSwitch
                    checked={draft.isAvailable}
                    onChange={(next) =>
                      setDraft((prev) => ({ ...prev, isAvailable: next }))
                    }
                    label="Toggle product availability"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-[#EAE0FA] pt-2">
                  <span className="text-xs font-semibold text-[#4A3860]">
                    Allow Custom Name / Photo
                  </span>
                  <AdminToggleSwitch
                    checked={draft.supportsPersonalization}
                    onChange={(next) =>
                      setDraft((prev) => ({
                        ...prev,
                        supportsPersonalization: next,
                        supportsPhotoUpload: next,
                      }))
                    }
                    label="Toggle customization support"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="h-10 flex-1 cursor-pointer rounded-xl border border-[#DFCEF7] bg-white text-xs font-bold text-[#4A3860]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] text-xs font-extrabold text-white shadow-xs disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product?"
        message={`Are you sure you want to permanently remove "${deleteTarget?.name ?? ''}" from your store?`}
        confirmLabel="Delete"
        onConfirm={() => void confirmDeleteProduct()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
