import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ImagePlus,
  Images,
  Package,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCategories, useProducts } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { ALL_GIFTS_CATEGORY_ID } from '../../config/seedData';
import { formatInr, slugify } from '../../utils/format';
import type { Product } from '../../types';
import {
  AdminConfirmDialog,
  AdminEmptyState,
  AdminSheetModal,
  AdminToast,
  AdminToggleSwitch,
  readImageFileAsDataUrl,
} from '../../components/admin/AdminSharedUI';

const MAX_PRODUCT_IMAGES = 6;

interface ProductDraft {
  id: string;
  name: string;
  description: string;
  priceInr: string;
  compareAtPriceInr: string;
  categoryId: string;
  images: string[];
  imageUrlInput: string;
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
    images: [],
    imageUrlInput: '',
    isAvailable: true,
    supportsPersonalization: true,
    supportsPhotoUpload: true,
  };
}

function isValidImageSource(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/') ||
    /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,/i.test(trimmed)
  );
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
  const [visibleCount, setVisibleCount] = useState(20);
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
    setVisibleCount(20);
  }, [search, categoryFilter]);

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
    window.setTimeout(() => setToast(null), 3500);
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
    const existingImages = Array.isArray(product.images)
      ? product.images
          .map((img) => (typeof img === 'string' ? img.trim() : ''))
          .filter(Boolean)
          .slice(0, MAX_PRODUCT_IMAGES)
      : [];
    setDraft({
      id: product.id,
      name: product.name,
      description: product.description || product.shortDescription || '',
      priceInr: String(product.priceInr),
      compareAtPriceInr: product.compareAtPriceInr
        ? String(product.compareAtPriceInr)
        : '',
      categoryId: product.categoryId,
      images: existingImages,
      imageUrlInput: '',
      isAvailable: available,
      supportsPersonalization: product.supportsPersonalization,
      supportsPhotoUpload: Boolean(product.supportsPhotoUpload),
    });
    setEditorOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const remainingSlots = MAX_PRODUCT_IMAGES - draft.images.length;
    if (remainingSlots <= 0) {
      showNotice(
        `Maximum ${MAX_PRODUCT_IMAGES} photos allowed per product. Remove one to add more.`,
        'error'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToProcess = selectedFiles.slice(0, remainingSlots);
    const skippedCount = selectedFiles.length - filesToProcess.length;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToProcess) {
        const dataUrl = await readImageFileAsDataUrl(file, 820, false);
        if (dataUrl) {
          uploadedUrls.push(dataUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        setDraft((prev) => {
          const merged = [...prev.images];
          for (const url of uploadedUrls) {
            if (merged.length < MAX_PRODUCT_IMAGES && !merged.includes(url)) {
              merged.push(url);
            }
          }
          return { ...prev, images: merged };
        });

        const addedLabel =
          uploadedUrls.length === 1
            ? '1 photo added!'
            : `${uploadedUrls.length} photos added!`;
        showNotice(
          skippedCount > 0
            ? `${addedLabel} (${skippedCount} skipped — max ${MAX_PRODUCT_IMAGES} photos).`
            : `${addedLabel} Tap Save Product to publish live.`
        );
      }
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to upload product photos.',
        'error'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleAddImageUrl() {
    const cleanUrl = draft.imageUrlInput.trim();
    if (!cleanUrl) return;
    if (!isValidImageSource(cleanUrl)) {
      showNotice('Please enter a valid image URL (https://... or /assets/...).', 'error');
      return;
    }
    if (draft.images.length >= MAX_PRODUCT_IMAGES) {
      showNotice(`Maximum ${MAX_PRODUCT_IMAGES} photos allowed per product.`, 'error');
      return;
    }
    if (draft.images.includes(cleanUrl)) {
      showNotice('This photo is already in the gallery.', 'error');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      images: [...prev.images, cleanUrl],
      imageUrlInput: '',
    }));
    showNotice('Photo URL added to gallery.');
  }

  function handleRemoveImage(index: number) {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  }

  function handleSetMainImage(index: number) {
    if (index <= 0) return;
    setDraft((prev) => {
      if (index >= prev.images.length) return prev;
      const next = [...prev.images];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return { ...prev, images: next };
    });
    showNotice('Main cover photo updated.');
  }

  function handleMoveImage(index: number, direction: -1 | 1) {
    setDraft((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.images.length) return prev;
      const next = [...prev.images];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return { ...prev, images: next };
    });
  }

  async function handleQuickAvailabilityToggle(product: Product, nextAvailable: boolean) {
    try {
      await services.catalog.saveProduct({
        ...product,
        isActive: nextAvailable,
        availability: nextAvailable ? 'IN_STOCK' : 'OUT_OF_STOCK',
        stockCount: nextAvailable ? 99 : 0,
      });
      await services.adminAuth.logActivity(
        `Marked "${product.name}" as ${nextAvailable ? 'Available' : 'Unavailable'}`,
        'Products Management'
      );
      showNotice(
        nextAvailable
          ? `"${product.name}" is now live.`
          : `"${product.name}" marked unavailable.`
      );
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to update availability.',
        'error'
      );
    }
  }

  async function handleSaveProduct(e?: React.FormEvent) {
    if (e) e.preventDefault();
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

    const finalImages = [...draft.images];
    const pendingUrl = draft.imageUrlInput.trim();
    if (
      pendingUrl &&
      isValidImageSource(pendingUrl) &&
      finalImages.length < MAX_PRODUCT_IMAGES &&
      !finalImages.includes(pendingUrl)
    ) {
      finalImages.push(pendingUrl);
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
        images: finalImages.filter((u) => u.trim().length > 0).slice(0, MAX_PRODUCT_IMAGES),
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
        existing
          ? `Updated product "${cleanName}" (${finalImages.length} photo${finalImages.length === 1 ? '' : 's'})`
          : `Added product "${cleanName}" (${finalImages.length} photo${finalImages.length === 1 ? '' : 's'})`,
        'Products Management'
      );
      setEditorOpen(false);
      showNotice(
        existing
          ? 'Product & gallery updated live!'
          : 'Product added & published to store!'
      );
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Could not save product.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteProduct() {
    if (!deleteTarget) return;
    try {
      await services.catalog.deleteProduct(deleteTarget.id);
      await services.adminAuth.logActivity(
        `Deleted product "${deleteTarget.name}"`,
        'Products Management'
      );
      setDeleteTarget(null);
      showNotice('Product deleted.');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to delete product.',
        'error'
      );
    }
  }

  return (
    <div className="space-y-3">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {/* Search + Category Filter Row */}
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
          {filteredProducts.slice(0, visibleCount).map((product) => {
            const isAvailable =
              product.isActive && product.availability !== 'OUT_OF_STOCK';
            return (
              <div
                key={product.id}
                className="flex items-center justify-between gap-2.5 rounded-2xl border border-[#EBD8FF]/90 bg-white p-2.5 shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EFE3FF] bg-[#FAF6FF]">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-[#9B8AB4]" />
                    )}
                    {product.images.length > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 inline-flex items-center gap-0.5 rounded-md bg-[#1E1035]/80 px-1 py-0.5 text-[9px] font-extrabold leading-none tabular-nums text-white">
                        <Images className="h-2.5 w-2.5" />
                        {product.images.length}
                      </span>
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
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      {product.images.length > 1 && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F5ECFF] px-2 py-0.5 text-[10px] font-bold text-[#6A11CB]">
                          {product.images.length} photos
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <AdminToggleSwitch
                    checked={isAvailable}
                    onChange={(next) =>
                      void handleQuickAvailabilityToggle(product, next)
                    }
                    label={`Toggle availability for ${product.name}`}
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditProduct(product)}
                      aria-label={`Edit ${product.name}`}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[#E5D5FA] bg-[#FAF6FF] text-[#6A11CB] hover:bg-[#F3E8FF]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      aria-label={`Delete ${product.name}`}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 20)}
              className="flex h-10 w-full cursor-pointer items-center justify-center rounded-2xl border border-[#E5D5FA] bg-white text-xs font-extrabold text-[#6A11CB] transition-colors hover:bg-[#FAF6FF]"
            >
              Load More Products ({filteredProducts.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}

      {/* Primary Add New Product Button */}
      <button
        type="button"
        onClick={openAddProduct}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#7E1DE0] to-[#A624C2] px-5 text-[13.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(106,17,203,0.5)] transition-transform active:scale-[0.98]"
      >
        <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
        <span>Add New Product</span>
      </button>

      {/* Always-Visible Sticky-Footer Add / Edit Product Sheet */}
      <AdminSheetModal
        open={editorOpen}
        title={draft.id ? 'Edit Product' : 'Add New Product'}
        subtitle="Changes publish live to the GiftKart store"
        onClose={() => setEditorOpen(false)}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="h-11 flex-1 cursor-pointer rounded-xl border border-[#DFCEF7] bg-white text-xs font-bold text-[#4A3860]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || uploading}
              onClick={() => void handleSaveProduct()}
              className="flex h-11 flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] text-xs font-extrabold text-white shadow-sm disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Product'}</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveProduct} noValidate className="space-y-3">
          {/* Multi-Photo Product Gallery (Up to 6 Photos) */}
          <div className="rounded-2xl border border-[#EFE3FF] bg-[#FCF9FF] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-[#3B0764]">
                <Images className="h-3.5 w-3.5 text-[#6A11CB]" />
                <span>
                  Product Photos ({draft.images.length}/{MAX_PRODUCT_IMAGES})
                </span>
              </label>
              {draft.images.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700">
                  <Check className="h-3 w-3" />
                  {draft.images.length === 1
                    ? '1 photo ready'
                    : `${draft.images.length} photos ready`}
                </span>
              ) : (
                <span className="text-[10.5px] font-semibold text-[#7A6894]">
                  Add up to {MAX_PRODUCT_IMAGES} photos
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* 3-Column Photo Gallery Grid */}
            <div className="grid grid-cols-3 gap-2">
              {draft.images.map((imgUrl, idx) => (
                <div
                  key={`${imgUrl.slice(0, 48)}-${idx}`}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 bg-white shadow-xs ${
                    idx === 0
                      ? 'border-[#6A11CB] ring-2 ring-[#6A11CB]/15'
                      : 'border-[#E5D5FA]'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Product photo ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />

                  {/* Top-left badge: Main or #N */}
                  <span
                    className={`absolute left-1 top-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold leading-none shadow-xs ${
                      idx === 0
                        ? 'bg-[#6A11CB] text-white'
                        : 'bg-[#1E1035]/75 text-white'
                    }`}
                  >
                    {idx === 0 ? 'Main' : `#${idx + 1}`}
                  </span>

                  {/* Top-right remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    aria-label={`Remove photo ${idx + 1}`}
                    className="absolute right-1 top-1 flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-full bg-rose-600/95 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                  >
                    <X className="h-3 w-3 stroke-[2.6]" />
                  </button>

                  {/* Bottom action strip: Set Main & Reorder */}
                  {draft.images.length > 1 && (
                    <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-0.5 rounded-lg bg-[#1E1035]/72 px-1 py-0.5 backdrop-blur-[2px]">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveImage(idx, -1)}
                        aria-label={`Move photo ${idx + 1} left`}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>

                      {idx > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(idx)}
                          title="Set as Main Cover Photo"
                          aria-label={`Set photo ${idx + 1} as main cover`}
                          className="flex h-5 cursor-pointer items-center gap-0.5 rounded bg-amber-400/95 px-1.5 text-[9px] font-extrabold text-[#1E1035] hover:bg-amber-300"
                        >
                          <Star className="h-2.5 w-2.5 fill-current" />
                          <span>Cover</span>
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-white/90">Cover</span>
                      )}

                      <button
                        type="button"
                        disabled={idx === draft.images.length - 1}
                        onClick={() => handleMoveImage(idx, 1)}
                        aria-label={`Move photo ${idx + 1} right`}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Photo Tile */}
              {draft.images.length < MAX_PRODUCT_IMAGES && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#CBB0F2] bg-white px-2 text-center text-[#6A11CB] transition-colors hover:border-[#6A11CB] hover:bg-[#F5ECFF]/70 disabled:opacity-60"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10.5px] font-extrabold leading-tight">
                    {uploading
                      ? 'Optimizing...'
                      : draft.images.length === 0
                        ? 'Add Photos'
                        : 'Add More'}
                  </span>
                </button>
              )}
            </div>

            {/* Multi-select upload trigger + Paste URL option */}
            <div className="mt-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={uploading || draft.images.length >= MAX_PRODUCT_IMAGES}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#6A11CB]/30 bg-[#F5ECFF] px-3 text-[11.5px] font-bold text-[#6A11CB] transition-colors hover:bg-[#EBDCFF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {uploading
                      ? 'Compressing photos...'
                      : draft.images.length >= MAX_PRODUCT_IMAGES
                        ? `Max ${MAX_PRODUCT_IMAGES} Photos Added`
                        : 'Select Multiple Photos'}
                  </span>
                </button>
                <span className="text-[10px] font-medium text-[#7A6894]">
                  1st photo = Cover
                </span>
              </div>

              {draft.images.length < MAX_PRODUCT_IMAGES && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={draft.imageUrlInput}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, imageUrlInput: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    placeholder="Or paste photo URL & tap Add..."
                    className="h-8 min-w-0 flex-1 rounded-lg border border-[#DFCEF7] bg-white px-2.5 text-[11.5px] text-[#1E1035] focus:border-[#6A11CB] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!draft.imageUrlInput.trim()}
                    className="h-8 shrink-0 cursor-pointer rounded-lg border border-[#D8C2F8] bg-white px-2.5 text-[11px] font-extrabold text-[#6A11CB] hover:bg-[#F5ECFF] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
              Product Name *
            </label>
            <input
              type="text"
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
                inputMode="numeric"
                min={1}
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
                Original MRP (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
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
        </form>
      </AdminSheetModal>

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
