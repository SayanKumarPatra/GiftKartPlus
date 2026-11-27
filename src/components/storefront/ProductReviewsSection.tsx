import { useMemo, useState } from 'react';
import { CheckCircle2, MessageSquarePlus, Star, X } from 'lucide-react';
import type { Product, ProductReview } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCustomerOrders, useProductReviews } from '../../hooks/useStoreData';
import { ProductReviewModal, type ReviewModalTarget } from './ProductReviewModal';

import { getDateLocale } from '../../i18n/bengaliAutoTranslate';
import type { LanguageCode } from '../../i18n/translations';

function formatReviewDate(iso: string, language: LanguageCode): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(getDateLocale(language), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

interface ProductReviewsSectionProps {
  product: Product;
  compact?: boolean;
  hideWhenEmpty?: boolean;
}

const SAFE_PHOTO_SRC =
  /^(https?:\/\/|\/|data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$)/i;

function getSafeReviewPhotos(photos?: string[]): string[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter((src) => typeof src === 'string' && SAFE_PHOTO_SRC.test(src));
}

export function ProductReviewsSection({
  product,
  compact = false,
  hideWhenEmpty = false,
}: ProductReviewsSectionProps) {
  const { customerAccount } = useAuth();
  const { language, t } = useLanguage();
  const { data: rawReviews, refresh: refreshReviews } = useProductReviews(product.id);
  const { data: customerOrders } = useCustomerOrders(
    customerAccount?.id,
    customerAccount?.email
  );

  const [reviewTarget, setReviewTarget] = useState<ReviewModalTarget | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const liveReviews = useMemo(
    () =>
      rawReviews
        .filter(
          (r) =>
            r.productId === product.id &&
            r.isApproved !== false &&
            !r.isSampleData &&
            Boolean(r.authorName?.trim()) &&
            Boolean(
              r.comment?.trim() || (Array.isArray(r.photos) && r.photos.length > 0)
            )
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        ),
    [rawReviews, product.id]
  );

  const stats = useMemo(() => {
    const count = liveReviews.length;
    if (count === 0) {
      return { avg: 0, count: 0, breakdown: [5, 4, 3, 2, 1].map((s) => ({ star: s, count: 0, pct: 0 })) };
    }
    const sum = liveReviews.reduce((acc, r) => acc + Math.min(5, Math.max(1, Number(r.rating) || 5)), 0);
    const breakdown = [5, 4, 3, 2, 1].map((star) => {
      const c = liveReviews.filter((r) => Math.round(r.rating) === star).length;
      return { star, count: c, pct: Math.round((c / count) * 100) };
    });
    return {
      avg: Number((sum / count).toFixed(1)),
      count,
      breakdown,
    };
  }, [liveReviews]);

  // Find a delivered order by the logged-in customer that contains this product
  const eligibleDeliveredOrder = useMemo(() => {
    if (!customerAccount) return null;
    return (
      customerOrders.find((order) => {
        const statusLower = String(order.fulfillmentStatus || '').trim().toLowerCase();
        if (statusLower !== 'delivered' && statusLower !== 'completed') return false;
        return order.items.some((item) => item.productId === product.id);
      }) ?? null
    );
  }, [customerAccount, customerOrders, product.id]);

  const myExistingReview = useMemo(() => {
    if (!eligibleDeliveredOrder) return undefined;
    return liveReviews.find(
      (r) => r.orderId === eligibleDeliveredOrder.id && r.productId === product.id
    );
  }, [eligibleDeliveredOrder, liveReviews, product.id]);

  function openWriteReview() {
    if (!eligibleDeliveredOrder || !customerAccount) return;
    setReviewTarget({
      orderId: eligibleDeliveredOrder.id,
      orderNumber: eligibleDeliveredOrder.orderNumber,
      productId: product.id,
      productName: product.name,
      productImage: product.images[0],
      customerId: customerAccount.id,
      customerEmail: customerAccount.email,
      customerPhone: customerAccount.phone || eligibleDeliveredOrder.customer.phone,
      authorName: customerAccount.fullName || eligibleDeliveredOrder.customer.fullName,
      existingReview: myExistingReview,
    });
  }

  if (hideWhenEmpty && liveReviews.length === 0) {
    return null;
  }

  return (
    <section
      id="customer-reviews"
      aria-label="Customer ratings and verified reviews"
      className={compact ? 'mt-5 px-3.5' : 'border-t border-[#EFE3FF] pt-8'}
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Star className="h-[18px] w-[18px] shrink-0 fill-amber-400 text-amber-400" />
          <h2
            className={
              compact
                ? 'text-[16px] font-extrabold tracking-[-0.01em] text-[#2B0B4E]'
                : 'font-display text-2xl font-bold text-[#1E1035]'
            }
          >
            {t('customerReviews')}
          </h2>
          {stats.count > 0 && (
            <span className="text-[12px] font-bold text-[#7A6894] tabular-nums">
              ({stats.count})
            </span>
          )}
        </div>

        {eligibleDeliveredOrder && (
          <button
            type="button"
            onClick={openWriteReview}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] px-3.5 py-1.5 text-[11.5px] font-bold text-white shadow-xs transition-transform active:scale-95"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span>{myExistingReview ? t('editYourReview') : t('writeReview')}</span>
          </button>
        )}
      </div>

      {/* Rating Summary Card (when real reviews exist) */}
      {stats.count > 0 ? (
        <div
          className={`mt-3 rounded-2xl border border-[#EFE3FF] bg-[#FBF8FF] ${
            compact ? 'p-3' : 'p-5'
          }`}
        >
          <div className="grid items-center gap-4 sm:grid-cols-12">
            {/* Average Score */}
            <div className="flex items-center gap-3 sm:col-span-4 sm:flex-col sm:items-start sm:gap-1 sm:border-r sm:border-[#EBD8FF] sm:pr-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[30px] font-extrabold leading-none tabular-nums text-[#2B0B4E]">
                  {stats.avg.toFixed(1)}
                </span>
                <span className="text-[12px] font-bold text-[#7A6894]">/ 5</span>
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${
                        s <= Math.round(stats.avg)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-[#DDD0EE]'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[11px] font-semibold text-[#6E5B85]">
                  {t('basedOnVerifiedBuyers')} ({stats.count})
                </p>
              </div>
            </div>

            {/* 5-to-1 Breakdown Bars */}
            <div className="space-y-1.5 sm:col-span-8">
              {stats.breakdown.map((row) => (
                <div key={row.star} className="flex items-center gap-2 text-[11px]">
                  <span className="w-7 shrink-0 font-bold tabular-nums text-[#3B2654]">
                    {row.star} ★
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ECE0FA]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] transition-all duration-300"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right font-semibold tabular-nums text-[#7A6894]">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`mt-3 rounded-2xl border border-[#EFE3FF] bg-[#FBF8FF] text-center ${
            compact ? 'px-4 py-5' : 'px-6 py-7'
          }`}
        >
          <p className="text-[13px] font-bold text-[#2B0B4E]">{t('noReviewsYet')}</p>
          <p className="mt-1 text-[11.5px] text-[#6E5B85]">
            {eligibleDeliveredOrder
              ? t('reviewDeliveredPrompt')
              : t('reviewVerifiedNote')}
          </p>
        </div>
      )}

      {/* Live Verified Reviews List */}
      {liveReviews.length > 0 && (
        <div className={`mt-3 grid gap-2.5 ${compact ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
          {liveReviews.map((review: ProductReview) => {
            const safePhotos = getSafeReviewPhotos(review.photos);
            const initial = (review.authorName || 'V').trim().charAt(0).toUpperCase();
            return (
              <article
                key={review.id}
                className="rounded-2xl border border-[#EFE3FF] bg-white p-3.5 shadow-[0_3px_12px_rgba(106,17,203,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6A11CB] to-[#FF4D8D] text-[12px] font-extrabold text-white">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-[#2B0B4E]">
                        {review.authorName}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                        {review.verifiedPurchase !== false && (
                          <span className="inline-flex items-center gap-0.5 font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            <span>{t('verifiedBuyer')}</span>
                          </span>
                        )}
                        <span className="text-[#9B8AB4]">·</span>
                        <span className="text-[#7A6894]">{formatReviewDate(review.createdAt, language)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div
                    aria-label={`${review.rating} out of 5 stars`}
                    className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5"
                  >
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-extrabold tabular-nums text-amber-700">
                      {Number(review.rating).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[#3B2654]">
                  {review.comment}
                </p>

                {/* Customer Uploaded Photos */}
                {safePhotos.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {safePhotos.map((photoSrc, idx) => (
                      <button
                        key={`${review.id}-photo-${idx}`}
                        type="button"
                        onClick={() => setLightboxPhoto(photoSrc)}
                        aria-label={`View customer review photo ${idx + 1}`}
                        className="h-16 w-16 cursor-pointer overflow-hidden rounded-xl border border-[#EBD8FF] bg-[#FAF6FF] transition-transform hover:scale-105 active:scale-95"
                      >
                        <img
                          src={photoSrc}
                          alt={`Customer photo by ${review.authorName}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Write / Edit Review Modal */}
      <ProductReviewModal
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmitted={() => {
          refreshReviews();
        }}
      />

      {/* Full-Screen Customer Photo Lightbox */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Customer review photo preview"
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
        >
          <button
            type="button"
            onClick={() => setLightboxPhoto(null)}
            aria-label="Close photo preview"
            className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxPhoto}
            alt="Customer review photo full view"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85dvh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}
