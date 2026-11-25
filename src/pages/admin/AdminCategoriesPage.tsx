import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Layers,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCategories, useProducts } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { ALL_GIFTS_CATEGORY_ID } from '../../data/seedData';
import type { Category } from '../../types';
import { slugify } from '../../utils/format';
import {
  AdminConfirmDialog,
  AdminSheetModal,
  AdminToast,
  AdminToggleSwitch,
  readImageFileAsDataUrl,
} from '../../components/admin/AdminSharedUI';

export function AdminCategoriesPage() {
  const { data: categories } = useCategories(true);
  const { data: products } = useProducts({ includeInactive: true });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [orderInput, setOrderInput] = useState('1');
  const [activeInput, setActiveInput] = useState(true);
  const [assignedProductIds, setAssignedProductIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3500);
  }

  function getCategoryProductCount(catId: string): number {
    if (catId === ALL_GIFTS_CATEGORY_ID) return products.length;
    return products.filter((p) => p.categoryId === catId).length;
  }

  function openNewCategory() {
    setEditing(null);
    setNameInput('');
    setDescriptionInput('');
    setImageInput('');
    setOrderInput(String(sortedCategories.length + 1));
    setActiveInput(true);
    setAssignedProductIds([]);
    setEditorOpen(true);
  }

  function openCategoryEditor(cat: Category) {
    setEditing(cat);
    setNameInput(cat.name);
    setDescriptionInput(cat.description || '');
    setImageInput(cat.imageUrl || '');
    setOrderInput(String(cat.sortOrder));
    setActiveInput(cat.isActive);
    setAssignedProductIds(
      products.filter((p) => p.categoryId === cat.id).map((p) => p.id)
    );
    setEditorOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await readImageFileAsDataUrl(file, 480, true);
      setImageInput(dataUrl);
      showNotice('Category image ready! Tap "Save Category" below.');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to upload image.',
        'error'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleQuickReorder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sortedCategories.length) return;
    try {
      const a = sortedCategories[index];
      const b = sortedCategories[target];
      await services.catalog.saveCategory({ ...a, sortOrder: b.sortOrder });
      await services.catalog.saveCategory({ ...b, sortOrder: a.sortOrder });
      await services.adminAuth.logActivity(
        `Reordered category "${a.name}"`,
        'Category Management'
      );
      showNotice('Category order saved.');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to reorder category.',
        'error'
      );
    }
  }

  function toggleProductAssignment(productId: string) {
    setAssignedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  async function handleSaveCategory(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      showNotice('Please enter a category name.', 'error');
      return;
    }

    setSaving(true);
    try {
      const isCreating = !editing;
      const latestCategories = await services.catalog.getCategories(true);

      if (isCreating) {
        const duplicate = latestCategories.some(
          (c) => c.name.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (duplicate) {
          showNotice(`Category "${cleanName}" already exists.`, 'error');
          setSaving(false);
          return;
        }
      }

      const baseSlug = slugify(cleanName) || `category-${Date.now().toString(36)}`;
      const uniqueSlug = isCreating
        ? latestCategories.some((c) => c.slug === baseSlug)
          ? `${baseSlug}-${Date.now().toString(36).slice(-3)}`
          : baseSlug
        : editing.slug;

      const parsedOrder = Math.max(
        1,
        Number(orderInput) || (isCreating ? latestCategories.length + 1 : editing.sortOrder)
      );

      const categoryPayload: Category = isCreating
        ? {
            id: `cat-${uniqueSlug}-${Date.now().toString(36).slice(-4)}`,
            slug: uniqueSlug,
            name: cleanName,
            description:
              descriptionInput.trim() ||
              `Explore personalized ${cleanName} gifts on GiftKart.`,
            imageUrl: imageInput.trim() || undefined,
            sortOrder: parsedOrder,
            isActive: activeInput,
            subcategories: [],
          }
        : {
            ...editing,
            name: cleanName,
            description: descriptionInput.trim() || editing.description,
            imageUrl: imageInput.trim() || editing.imageUrl,
            sortOrder: parsedOrder,
            isActive: editing.id === ALL_GIFTS_CATEGORY_ID ? true : activeInput,
          };

      const savedCategory = await services.catalog.saveCategory(categoryPayload);

      if (
        savedCategory.id !== ALL_GIFTS_CATEGORY_ID &&
        assignedProductIds.length > 0
      ) {
        await services.catalog.assignProductsToCategory(
          savedCategory.id,
          assignedProductIds
        );
      }

      await services.adminAuth.logActivity(
        isCreating
          ? `Added category "${cleanName}"`
          : `Updated category "${cleanName}"`,
        'Category Management'
      );
      setEditorOpen(false);
      setEditing(null);
      showNotice(
        isCreating
          ? `New category "${cleanName}" added live across the website!`
          : `"${cleanName}" saved across the website!`
      );
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Could not save category.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteCategory() {
    if (!deleteTarget) return;
    try {
      await services.catalog.deleteCategory(deleteTarget.id);
      await services.adminAuth.logActivity(
        `Deleted category "${deleteTarget.name}"`,
        'Category Management'
      );
      if (editing?.id === deleteTarget.id) {
        setEditorOpen(false);
        setEditing(null);
      }
      setDeleteTarget(null);
      showNotice(`Category "${deleteTarget.name}" removed.`);
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to delete category.',
        'error'
      );
    }
  }

  const isAllGifts = editing?.id === ALL_GIFTS_CATEGORY_ID;

  return (
    <div className="space-y-3">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-[12px] font-semibold text-[#685782]">
          {sortedCategories.length} Storefront Categories (Live Global Sync)
        </p>
        <button
          type="button"
          onClick={openNewCategory}
          className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] px-3 text-[11.5px] font-extrabold text-white shadow-xs transition-transform active:scale-95"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        {sortedCategories.map((cat, idx) => {
          const count = getCategoryProductCount(cat.id);
          return (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-2.5 rounded-2xl border border-[#EBD8FF]/90 bg-white px-3 py-2.5 shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)]"
            >
              <button
                type="button"
                onClick={() => openCategoryEditor(cat)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EFE3FF] bg-[#FAF6FF]">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="h-full w-full object-contain p-0.5"
                    />
                  ) : (
                    <Layers className="h-4.5 w-4.5 text-[#6A11CB]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13.5px] font-extrabold text-[#1E1035]">
                      {cat.name}
                    </span>
                    {!cat.isActive && (
                      <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[9.5px] font-bold text-neutral-500">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-[#75648E]">
                    #{cat.sortOrder} · {count} {count === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => void handleQuickReorder(idx, -1)}
                  aria-label={`Move ${cat.name} up`}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[#E5D5FA] bg-[#FAF6FF] text-[#6A11CB] disabled:opacity-35"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === sortedCategories.length - 1}
                  onClick={() => void handleQuickReorder(idx, 1)}
                  aria-label={`Move ${cat.name} down`}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[#E5D5FA] bg-[#FAF6FF] text-[#6A11CB] disabled:opacity-35"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                {cat.id !== ALL_GIFTS_CATEGORY_ID && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cat)}
                    aria-label={`Delete ${cat.name}`}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openCategoryEditor(cat)}
                  aria-label={`Edit ${cat.name}`}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[#6A11CB] hover:bg-[#F5ECFF]"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prominent Bottom Add New Category CTA */}
      <button
        type="button"
        onClick={openNewCategory}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#7E1DE0] to-[#A624C2] px-5 text-[13.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(106,17,203,0.5)] transition-transform active:scale-[0.98]"
      >
        <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
        <span>Add New Category</span>
      </button>

      {/* Always-Visible Sticky-Footer Add / Edit Category Sheet */}
      <AdminSheetModal
        open={editorOpen}
        title={editing ? 'Edit Category' : 'Add New Category'}
        subtitle={
          editing
            ? editing.name
            : 'Appears live across mobile, desktop & product forms'
        }
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditorOpen(false);
                setEditing(null);
              }}
              className="h-11 flex-1 cursor-pointer rounded-xl border border-[#DFCEF7] bg-white text-xs font-bold text-[#4A3860]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || uploading}
              onClick={() => void handleSaveCategory()}
              className="flex h-11 flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] text-xs font-extrabold text-white shadow-sm disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>
                {saving
                  ? 'Saving...'
                  : editing
                    ? 'Save Category'
                    : 'Create Category'}
              </span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveCategory} noValidate className="space-y-3">
          {/* Category Image */}
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
              Category Image / Icon
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#D6C1F5] bg-[#FAF6FF]"
              >
                {imageInput ? (
                  <img
                    src={imageInput}
                    alt={nameInput || 'Category preview'}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <Layers className="h-5 w-5 text-[#9B8AB4]" />
                )}
              </button>
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
                  <span>
                    {uploading
                      ? 'Compressing...'
                      : imageInput
                        ? 'Change Image'
                        : 'Upload Image'}
                  </span>
                </button>
                <input
                  type="text"
                  value={imageInput.startsWith('data:') ? '' : imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="Or paste image URL..."
                  className="h-8 w-full rounded-lg border border-[#DFCEF7] bg-[#FAF8FF] px-2.5 text-[11.5px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                Category Name *
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Chocolate Hampers"
                className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] font-medium text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                Order
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] font-medium text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
              Short Description (Optional)
            </label>
            <input
              type="text"
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="Brief subtitle for this gift category"
              className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
            />
          </div>

          {!isAllGifts && (
            <div className="flex items-center justify-between rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] px-3 py-2.5">
              <span className="text-xs font-bold text-[#1E1035]">
                Visible on Storefront
              </span>
              <AdminToggleSwitch
                checked={activeInput}
                onChange={setActiveInput}
                label="Toggle category visibility"
              />
            </div>
          )}

          {/* Assign Products to Category */}
          {!isAllGifts && (
            <div className="rounded-xl border border-[#EFE3FF] bg-[#FAF8FF] p-3">
              <p className="text-xs font-extrabold text-[#1E1035]">
                Assign Products to {nameInput.trim() || 'This Category'}
              </p>
              {products.length === 0 ? (
                <p className="mt-1 text-[11.5px] text-[#75648E]">
                  No products added yet. You can assign products later when adding items.
                </p>
              ) : (
                <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {products.map((p) => {
                    const checked = assignedProductIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProductAssignment(p.id)}
                        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left text-xs transition-colors ${
                          checked
                            ? 'border-[#6A11CB] bg-white font-bold text-[#6A11CB]'
                            : 'border-[#EAE0FA] bg-white/70 font-medium text-[#4A3860]'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span
                          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border ${
                            checked
                              ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
                              : 'border-[#CFC1E5] bg-white'
                          }`}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </form>
      </AdminSheetModal>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category?"
        message={`"${deleteTarget?.name ?? ''}" will be removed from both desktop and mobile storefronts immediately.`}
        confirmLabel="Delete"
        onConfirm={() => void confirmDeleteCategory()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
