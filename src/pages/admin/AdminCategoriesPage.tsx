import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Layers,
  Save,
  Upload,
} from 'lucide-react';
import { useCategories, useProducts } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { ALL_GIFTS_CATEGORY_ID } from '../../data/seedData';
import type { Category } from '../../types';
import {
  AdminSheetModal,
  AdminToast,
  AdminToggleSwitch,
  readImageFileAsDataUrl,
} from '../../components/admin/AdminSharedUI';

export function AdminCategoriesPage() {
  const { data: categories } = useCategories(true);
  const { data: products } = useProducts({ includeInactive: true });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editing, setEditing] = useState<Category | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [orderInput, setOrderInput] = useState('1');
  const [activeInput, setActiveInput] = useState(true);
  const [assignedProductIds, setAssignedProductIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  function openCategoryEditor(cat: Category) {
    setEditing(cat);
    setNameInput(cat.name);
    setImageInput(cat.imageUrl || '');
    setOrderInput(String(cat.sortOrder));
    setActiveInput(cat.isActive);
    setAssignedProductIds(
      products.filter((p) => p.categoryId === cat.id).map((p) => p.id)
    );
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
    if (!editing) return;
    const cleanName = nameInput.trim();
    if (!cleanName) {
      showNotice('Category name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const parsedOrder = Math.max(1, Number(orderInput) || editing.sortOrder);
      await services.catalog.saveCategory({
        ...editing,
        name: cleanName,
        imageUrl: imageInput.trim() || editing.imageUrl,
        sortOrder: parsedOrder,
        isActive: editing.id === ALL_GIFTS_CATEGORY_ID ? true : activeInput,
      });

      if (editing.id !== ALL_GIFTS_CATEGORY_ID && assignedProductIds.length > 0) {
        await services.catalog.assignProductsToCategory(
          editing.id,
          assignedProductIds
        );
      }

      await services.adminAuth.logActivity(
        `Updated category "${cleanName}"`,
        'Category Management'
      );
      setEditing(null);
      showNotice(`"${cleanName}" saved across the website!`);
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Could not save category.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      <div className="flex items-center justify-between px-0.5">
        <p className="text-[12px] font-semibold text-[#685782]">
          {sortedCategories.length} Official GiftKart Categories (Global Sync)
        </p>
      </div>

      {/* Exact 10 Official Categories List */}
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

      {/* Always-Visible Sticky-Footer Category Editor */}
      <AdminSheetModal
        open={Boolean(editing)}
        title="Edit Category"
        subtitle={editing?.name}
        onClose={() => setEditing(null)}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
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
              <span>{saving ? 'Saving...' : 'Save Category'}</span>
            </button>
          </div>
        }
      >
        {editing && (
          <form onSubmit={handleSaveCategory} noValidate className="space-y-3">
            {/* Category Image */}
            <div>
              <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                Category Image
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
                      alt={nameInput}
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
                    <span>{uploading ? 'Compressing...' : 'Update Image'}</span>
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
                  Category Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
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
                  max={20}
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] font-medium text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {editing.id !== ALL_GIFTS_CATEGORY_ID && (
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
            {editing.id !== ALL_GIFTS_CATEGORY_ID && (
              <div className="rounded-xl border border-[#EFE3FF] bg-[#FAF8FF] p-3">
                <p className="text-xs font-extrabold text-[#1E1035]">
                  Assign Products to {editing.name}
                </p>
                {products.length === 0 ? (
                  <p className="mt-1 text-[11.5px] text-[#75648E]">
                    No products added yet. Add products first to assign them here.
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
        )}
      </AdminSheetModal>
    </div>
  );
}
