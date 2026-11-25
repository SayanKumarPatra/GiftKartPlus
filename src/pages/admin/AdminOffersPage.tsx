import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Edit3,
  Percent,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useCoupons, useStoreSettings } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { formatInr } from '../../utils/format';
import type { Coupon, CouponDiscountType } from '../../types';
import {
  AdminConfirmDialog,
  AdminEmptyState,
  AdminToast,
  AdminToggleSwitch,
} from '../../components/admin/AdminSharedUI';

interface OfferDraft {
  id: string;
  title: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  value: string;
  minOrderInr: string;
  maxDiscountInr: string;
  validFrom: string;
  validUntil: string;
  linkedBannerId: string;
  isActive: boolean;
}

const EMPTY_OFFER: OfferDraft = {
  id: '',
  title: '',
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  value: '',
  minOrderInr: '0',
  maxDiscountInr: '',
  validFrom: '',
  validUntil: '',
  linkedBannerId: '',
  isActive: true,
};

function getOfferStatus(coupon: Coupon): { label: string; badgeClass: string } {
  if (!coupon.isActive) {
    return { label: 'Inactive', badgeClass: 'bg-neutral-100 text-neutral-600' };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (coupon.validUntil && today > coupon.validUntil.slice(0, 10)) {
    return { label: 'Expired', badgeClass: 'bg-rose-50 text-rose-700' };
  }
  if (coupon.validFrom && today < coupon.validFrom.slice(0, 10)) {
    return { label: 'Scheduled', badgeClass: 'bg-amber-50 text-amber-800' };
  }
  return { label: 'Active', badgeClass: 'bg-emerald-50 text-emerald-700' };
}

export function AdminOffersPage() {
  const { data: coupons } = useCoupons();
  const { data: settings } = useStoreSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<OfferDraft>(EMPTY_OFFER);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  const banners = settings?.heroSlides ?? [];

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setDraft(EMPTY_OFFER);
      setEditorOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  function openNewOffer() {
    setDraft(EMPTY_OFFER);
    setEditorOpen(true);
  }

  function openEditOffer(coupon: Coupon) {
    setDraft({
      id: coupon.id,
      title: coupon.title || '',
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      value: String(coupon.value),
      minOrderInr: String(coupon.minOrderInr),
      maxDiscountInr: coupon.maxDiscountInr ? String(coupon.maxDiscountInr) : '',
      validFrom: coupon.validFrom?.slice(0, 10) || '',
      validUntil: coupon.validUntil?.slice(0, 10) || '',
      linkedBannerId: coupon.linkedBannerId || '',
      isActive: coupon.isActive,
    });
    setEditorOpen(true);
  }

  async function handleSaveOffer(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = draft.code.trim().toUpperCase().replace(/\s+/g, '');
    const numericValue = Number(draft.value);
    const minOrder = Math.max(0, Number(draft.minOrderInr) || 0);
    const maxDisc = draft.maxDiscountInr.trim()
      ? Number(draft.maxDiscountInr)
      : undefined;

    if (!cleanCode) {
      showNotice('Enter a valid coupon code (e.g. FESTIVE10).', 'error');
      return;
    }
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      showNotice('Enter a valid discount value.', 'error');
      return;
    }
    if (draft.discountType === 'PERCENTAGE' && numericValue > 90) {
      showNotice('Percentage discount cannot exceed 90%.', 'error');
      return;
    }
    if (draft.validFrom && draft.validUntil && draft.validFrom > draft.validUntil) {
      showNotice('End date must be on or after the start date.', 'error');
      return;
    }

    setSaving(true);
    try {
      const existing = draft.id ? coupons.find((c) => c.id === draft.id) : undefined;
      const saved: Coupon = {
        id: existing?.id || `offer-${Date.now()}`,
        code: cleanCode,
        title: draft.title.trim() || cleanCode,
        description:
          draft.description.trim() ||
          (draft.discountType === 'PERCENTAGE'
            ? `${numericValue}% off on orders above ${formatInr(minOrder)}`
            : `Flat ${formatInr(numericValue)} off on orders above ${formatInr(minOrder)}`),
        discountType: draft.discountType,
        value: numericValue,
        minOrderInr: minOrder,
        maxDiscountInr:
          maxDisc && Number.isFinite(maxDisc) && maxDisc > 0 ? maxDisc : undefined,
        validFrom: draft.validFrom || undefined,
        validUntil: draft.validUntil || undefined,
        linkedBannerId: draft.linkedBannerId || undefined,
        isActive: draft.isActive,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      await services.promotions.upsertCoupon(saved);
      await services.adminAuth.logActivity(
        existing ? `Updated offer ${cleanCode}` : `Created offer ${cleanCode}`,
        'Offers & Promotions'
      );
      setEditorOpen(false);
      showNotice(
        existing
          ? `Offer ${cleanCode} updated.`
          : `Offer ${cleanCode} is ready for checkout.`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(coupon: Coupon, nextActive: boolean) {
    await services.promotions.upsertCoupon({ ...coupon, isActive: nextActive });
    await services.adminAuth.logActivity(
      `${nextActive ? 'Activated' : 'Deactivated'} offer ${coupon.code}`,
      'Offers & Promotions'
    );
    showNotice(`Offer ${coupon.code} ${nextActive ? 'activated' : 'paused'}.`);
  }

  async function confirmDeleteOffer() {
    if (!deleteTarget) return;
    await services.promotions.deleteCoupon(deleteTarget.id);
    await services.adminAuth.logActivity(
      `Deleted offer ${deleteTarget.code}`,
      'Offers & Promotions'
    );
    setDeleteTarget(null);
    showNotice('Offer deleted.');
  }

  return (
    <div className="space-y-3.5">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {/* Quick Summary & Create Offer Button */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div>
          <p className="text-[13px] font-extrabold text-[#1E1035]">
            Active Coupons &amp; Deals
          </p>
          <p className="text-[11.5px] text-[#75648E]">
            Automatically validated before checkout with expiry handling
          </p>
        </div>
        <button
          type="button"
          onClick={openNewOffer}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] px-3.5 text-xs font-extrabold text-white shadow-xs active:scale-95"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Create Offer</span>
        </button>
      </div>

      {/* Offers List */}
      {coupons.length === 0 ? (
        <AdminEmptyState
          icon={<Percent className="h-5 w-5" />}
          title="No offers or coupons created yet."
          description="Create percentage or flat ₹ coupon codes with optional validity schedules."
        />
      ) : (
        <div className="space-y-2.5">
          {coupons.map((coupon) => {
            const status = getOfferStatus(coupon);
            const linkedBanner = banners.find((b) => b.id === coupon.linkedBannerId);
            return (
              <div
                key={coupon.id}
                className="rounded-2xl border border-[#EBD8FF]/90 bg-white p-3.5 shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)]"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFEAF2] text-[#FF4D8D]">
                      {coupon.discountType === 'PERCENTAGE' ? (
                        <Percent className="h-5 w-5" />
                      ) : (
                        <Tag className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[14px] font-extrabold tracking-wide text-[#1E1035]">
                          {coupon.code}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.badgeClass}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] font-bold text-[#6A11CB]">
                        {coupon.discountType === 'PERCENTAGE'
                          ? `${coupon.value}% OFF`
                          : `Flat ${formatInr(coupon.value)} OFF`}
                        {coupon.minOrderInr > 0
                          ? ` · Min ${formatInr(coupon.minOrderInr)}`
                          : ''}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-[#75648E]">
                        {coupon.description}
                      </p>
                      {(coupon.validFrom || coupon.validUntil) && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#685782]">
                          <Calendar className="h-3 w-3 text-[#6A11CB]" />
                          <span>
                            {coupon.validFrom ? coupon.validFrom.slice(0, 10) : 'Now'} →{' '}
                            {coupon.validUntil ? coupon.validUntil.slice(0, 10) : 'No expiry'}
                          </span>
                        </p>
                      )}
                      {linkedBanner && (
                        <p className="mt-0.5 text-[11px] font-semibold text-[#FF4D8D]">
                          Linked Banner: {linkedBanner.titlePrefix}
                        </p>
                      )}
                    </div>
                  </div>

                  <AdminToggleSwitch
                    checked={coupon.isActive}
                    onChange={(next) => void handleToggleActive(coupon, next)}
                    label={`Toggle ${coupon.code}`}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-[#F4ECFF] pt-2">
                  <button
                    type="button"
                    onClick={() => openEditOffer(coupon)}
                    className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-[#E5D5FA] bg-[#FAF6FF] px-3 text-[11.5px] font-bold text-[#6A11CB]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(coupon)}
                    className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[11.5px] font-bold text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Offer Modal */}
      {editorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[95] flex items-end justify-center bg-[#1E1035]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[26px] border border-[#EBD8FF] bg-white p-4 shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE3FF] pb-3">
              <h3 className="text-[15.5px] font-extrabold text-[#1E1035]">
                {draft.id ? 'Edit Offer / Coupon' : 'Create Offer / Coupon'}
              </h3>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                aria-label="Close offer editor"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-[#FAF6FF] text-[#594A6B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="mt-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={draft.code}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="FESTIVE10"
                    className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs font-extrabold uppercase text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                    Discount Type
                  </label>
                  <select
                    value={draft.discountType}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        discountType: e.target.value as CouponDiscountType,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs font-bold text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT_INR">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                    Discount Value ({draft.discountType === 'PERCENTAGE' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={draft.value}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, value: e.target.value }))
                    }
                    placeholder={draft.discountType === 'PERCENTAGE' ? '10' : '100'}
                    className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draft.minOrderInr}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, minOrderInr: e.target.value }))
                    }
                    placeholder="499"
                    className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={draft.validFrom}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, validFrom: e.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-2.5 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                    End Date (Auto Expiry)
                  </label>
                  <input
                    type="date"
                    value={draft.validUntil}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, validUntil: e.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-2.5 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {banners.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                    Link to Sliding Banner (Optional)
                  </label>
                  <select
                    value={draft.linkedBannerId}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, linkedBannerId: e.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  >
                    <option value="">None</option>
                    {banners.map((b) => (
                      <option key={b.id} value={b.id}>
                        {`${b.titlePrefix} ${b.titleHighlight}`.trim() || b.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Offer Description
                </label>
                <input
                  type="text"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Short note shown to customers..."
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] px-3 py-2.5">
                <span className="text-xs font-bold text-[#1E1035]">
                  Offer Active
                </span>
                <AdminToggleSwitch
                  checked={draft.isActive}
                  onChange={(next) =>
                    setDraft((prev) => ({ ...prev, isActive: next }))
                  }
                  label="Toggle offer active status"
                />
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
                  {saving ? 'Saving...' : 'Save Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Offer?"
        message={`Remove coupon code "${deleteTarget?.code ?? ''}"? Customers will no longer be able to apply it.`}
        confirmLabel="Delete"
        onConfirm={() => void confirmDeleteOffer()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
