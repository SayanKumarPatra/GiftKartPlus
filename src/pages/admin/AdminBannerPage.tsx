import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStoreSettings } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import type { HeroSlide } from '../../types';
import {
  AdminConfirmDialog,
  AdminEmptyState,
  AdminSheetModal,
  AdminToast,
  AdminToggleSwitch,
  readImageFileAsDataUrl,
} from '../../components/admin/AdminSharedUI';

interface BannerDraft {
  id: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_BANNER: BannerDraft = {
  id: '',
  titlePrefix: '',
  titleHighlight: '',
  subtitle: '',
  ctaLabel: 'Shop Now',
  ctaHref: '/shop',
  imageUrl: '',
  isActive: true,
};

export function AdminBannerPage() {
  const { data: settings } = useStoreSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewIdx, setPreviewIdx] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<BannerDraft>(EMPTY_BANNER);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  const slides = useMemo(() => {
    const raw = Array.isArray(settings?.heroSlides) ? settings.heroSlides : [];
    return [...raw].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [settings?.heroSlides]);

  const activeSlides = useMemo(
    () => slides.filter((s) => s.isActive && Boolean(s.imageUrl)),
    [slides]
  );

  const safePreviewIdx =
    activeSlides.length > 0 ? previewIdx % activeSlides.length : 0;
  const activePreview = activeSlides[safePreviewIdx];

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3500);
  }

  async function persistSlides(nextSlides: HeroSlide[], activityLabel: string) {
    const currentSettings = settings ?? (await services.settings.getSettings());
    const reindexed = nextSlides.map((s, idx) => ({
      ...s,
      sortOrder: idx + 1,
    }));
    await services.settings.updateSettings({
      ...currentSettings,
      heroSlides: reindexed,
    });
    await services.adminAuth.logActivity(activityLabel, 'Banner Management');
  }

  function openNewBanner() {
    setDraft({ ...EMPTY_BANNER, id: `banner-${Date.now()}` });
    setEditorOpen(true);
  }

  function openEditBanner(slide: HeroSlide) {
    setDraft({
      id: slide.id,
      titlePrefix: slide.titlePrefix,
      titleHighlight: slide.titleHighlight,
      subtitle: slide.subtitle,
      ctaLabel: slide.ctaLabel || 'Shop Now',
      ctaHref: slide.ctaHref || '/shop',
      imageUrl: slide.imageUrl,
      isActive: slide.isActive,
    });
    setEditorOpen(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await readImageFileAsDataUrl(file, 960, false);
      setDraft((prev) => ({ ...prev, imageUrl: dataUrl }));
      showNotice('Banner photo ready! Tap "Save Banner" below.');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to upload banner image.',
        'error'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSaveBanner(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!draft.imageUrl.trim()) {
      showNotice('Please upload a banner photo or paste an image URL first.', 'error');
      return;
    }
    setSaving(true);
    try {
      const exists = slides.some((s) => s.id === draft.id);
      const nextSlide: HeroSlide = {
        id: draft.id || `banner-${Date.now()}`,
        titlePrefix: draft.titlePrefix.trim() || `Banner ${slides.length + 1}`,
        titleHighlight: draft.titleHighlight.trim(),
        subtitle: draft.subtitle.trim(),
        ctaLabel: draft.ctaLabel.trim() || 'Shop Now',
        ctaHref: draft.ctaHref.trim() || '/shop',
        imageUrl: draft.imageUrl.trim(),
        isActive: draft.isActive,
        sortOrder: exists
          ? slides.find((s) => s.id === draft.id)?.sortOrder ?? slides.length + 1
          : slides.length + 1,
      };
      const nextSlides = exists
        ? slides.map((s) => (s.id === nextSlide.id ? nextSlide : s))
        : [...slides, nextSlide];

      await persistSlides(
        nextSlides,
        exists
          ? `Updated banner "${nextSlide.titlePrefix}"`
          : `Added banner "${nextSlide.titlePrefix}"`
      );
      setEditorOpen(false);
      showNotice(
        exists
          ? 'Banner updated & saved live!'
          : 'New banner saved to homepage slider!'
      );
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Could not save banner.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBanner(slide: HeroSlide, nextActive: boolean) {
    try {
      const nextSlides = slides.map((s) =>
        s.id === slide.id ? { ...s, isActive: nextActive } : s
      );
      await persistSlides(
        nextSlides,
        `${nextActive ? 'Enabled' : 'Disabled'} banner "${slide.titlePrefix}"`
      );
      showNotice(nextActive ? 'Banner activated.' : 'Banner hidden from storefront.');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to update banner.',
        'error'
      );
    }
  }

  async function handleMoveBanner(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    try {
      const reordered = [...slides];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(target, 0, moved);
      await persistSlides(reordered, 'Reordered storefront banners');
      showNotice('Banner display order saved.');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to reorder banners.',
        'error'
      );
    }
  }

  async function confirmDeleteBanner() {
    if (!deleteTarget) return;
    try {
      const nextSlides = slides.filter((s) => s.id !== deleteTarget.id);
      await persistSlides(nextSlides, `Deleted banner "${deleteTarget.titlePrefix}"`);
      setDeleteTarget(null);
      showNotice('Banner removed from storefront slider.');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to delete banner.',
        'error'
      );
    }
  }

  const isEditingExisting = slides.some((s) => s.id === draft.id);

  return (
    <div className="space-y-3.5">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {/* Live Storefront Slider Preview */}
      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3 shadow-[0_8px_20px_-14px_rgba(106,17,203,0.2)]">
        {activePreview ? (
          <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl bg-[#F4EAFF]">
            <img
              src={activePreview.imageUrl}
              alt={`${activePreview.titlePrefix} ${activePreview.titleHighlight}`.trim()}
              className="h-full w-full object-cover"
            />
            {activeSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewIdx(
                      (safePreviewIdx - 1 + activeSlides.length) % activeSlides.length
                    )
                  }
                  aria-label="Previous preview banner"
                  className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/85 text-[#2B0B4E] shadow-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewIdx((safePreviewIdx + 1) % activeSlides.length)
                  }
                  aria-label="Next preview banner"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/85 text-[#2B0B4E] shadow-xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 backdrop-blur-xs">
                  {activeSlides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPreviewIdx(idx)}
                      aria-label={`Preview slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === safePreviewIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/55'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex aspect-[3/1] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#DEC9FA] bg-[#FAF6FF] px-4 text-center">
            <ImageIcon className="h-6 w-6 text-[#6A11CB]/60" />
            <p className="mt-1 text-xs font-bold text-[#4A3860]">
              No active storefront banners
            </p>
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
          <div>
            <h2 className="text-[14.5px] font-extrabold text-[#1E1035]">
              Website Banner (Slider)
            </h2>
            <p className="text-[11.5px] text-[#75648E]">
              Auto-saved live to desktop &amp; mobile homepage
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#F4EAFF] px-2.5 py-0.5 text-[11px] font-extrabold text-[#6A11CB]">
            {activeSlides.length}/{slides.length} Active
          </span>
        </div>
      </div>

      {/* Banners List */}
      {slides.length === 0 ? (
        <AdminEmptyState
          icon={<ImageIcon className="h-5 w-5" />}
          title="No banners added yet."
          description="Tap Add New Banner below to upload a sliding banner for your homepage."
        />
      ) : (
        <div className="space-y-2.5">
          {slides.map((slide, idx) => {
            const label =
              `${slide.titlePrefix} ${slide.titleHighlight}`.trim() ||
              `Banner ${idx + 1}`;
            return (
              <div
                key={slide.id}
                className="flex items-center justify-between gap-2.5 rounded-2xl border border-[#EBD8FF]/90 bg-white p-2.5 shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <img
                    src={slide.imageUrl}
                    alt={label}
                    className="h-12 w-20 shrink-0 rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold text-[#1E1035]">
                      {label}
                    </p>
                    <p className="truncate text-[11px] text-[#75648E]">
                      #{idx + 1} · Link: {slide.ctaHref || '/shop'}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => void handleMoveBanner(idx, -1)}
                        aria-label="Move banner up"
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-[#E5D5FA] bg-[#FAF6FF] text-[#6A11CB] disabled:opacity-35"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === slides.length - 1}
                        onClick={() => void handleMoveBanner(idx, 1)}
                        aria-label="Move banner down"
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-[#E5D5FA] bg-[#FAF6FF] text-[#6A11CB] disabled:opacity-35"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditBanner(slide)}
                        aria-label={`Edit ${label}`}
                        className="flex h-6 cursor-pointer items-center gap-1 rounded-lg border border-[#E5D5FA] bg-white px-2 text-[10.5px] font-bold text-[#4A3860] hover:border-[#6A11CB] hover:text-[#6A11CB]"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(slide)}
                        aria-label={`Delete ${label}`}
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <AdminToggleSwitch
                  checked={slide.isActive}
                  onChange={(next) => void handleToggleBanner(slide, next)}
                  label={`Toggle ${label}`}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Primary Add New Banner CTA */}
      <button
        type="button"
        onClick={openNewBanner}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#7E1DE0] to-[#A624C2] px-5 text-[13.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(106,17,203,0.5)] transition-transform active:scale-[0.98]"
      >
        <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
        <span>Add New Banner</span>
      </button>

      {/* Sticky-Footer Add / Edit Banner Sheet */}
      <AdminSheetModal
        open={editorOpen}
        title={isEditingExisting ? 'Edit Banner' : 'Add New Banner'}
        subtitle="Upload photo and tap Save Banner below"
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
              onClick={() => void handleSaveBanner()}
              className="flex h-11 flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] text-xs font-extrabold text-white shadow-sm disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Banner'}</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveBanner} noValidate className="space-y-3">
          {/* Tappable Banner Image Picker */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[11.5px] font-bold text-[#4A3860]">
                Banner Photo (3:1 wide recommended) *
              </label>
              {draft.imageUrl && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700">
                  <Check className="h-3 w-3" />
                  Photo ready
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex aspect-[3/1] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#D6C1F5] bg-[#FAF6FF] transition-colors hover:border-[#6A11CB]"
            >
              {draft.imageUrl ? (
                <>
                  <img
                    src={draft.imageUrl}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-[#1E1035]/75 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur-xs">
                    <Upload className="h-3 w-3" />
                    Change Photo
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <Upload className="h-5 w-5 text-[#6A11CB]" />
                  <span className="mt-1 text-xs font-bold text-[#6A11CB]">
                    {uploading ? 'Compressing photo...' : 'Tap to Upload Banner Photo'}
                  </span>
                </div>
              )}
            </button>

            <input
              type="text"
              value={draft.imageUrl.startsWith('data:') ? '' : draft.imageUrl}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              placeholder="Or paste image URL (https://... or /assets/...)"
              className="mt-2 h-9 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                Banner Title
              </label>
              <input
                type="text"
                value={draft.titlePrefix}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, titlePrefix: e.target.value }))
                }
                placeholder="e.g. Festive Gifts"
                className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                Highlight Text
              </label>
              <input
                type="text"
                value={draft.titleHighlight}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, titleHighlight: e.target.value }))
                }
                placeholder="e.g. 20% Off"
                className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
              Banner Click Link
            </label>
            <input
              type="text"
              value={draft.ctaHref}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, ctaHref: e.target.value }))
              }
              placeholder="/shop or /category/photo-frame"
              className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] px-3 py-2.5">
            <span className="text-xs font-bold text-[#1E1035]">
              Show on Live Storefront
            </span>
            <AdminToggleSwitch
              checked={draft.isActive}
              onChange={(next) =>
                setDraft((prev) => ({ ...prev, isActive: next }))
              }
              label="Toggle banner active status"
            />
          </div>
        </form>
      </AdminSheetModal>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Banner?"
        message="This banner will be removed from the live storefront slider immediately."
        confirmLabel="Delete"
        onConfirm={() => void confirmDeleteBanner()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
