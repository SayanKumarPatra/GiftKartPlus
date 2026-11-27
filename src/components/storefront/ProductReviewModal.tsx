import { useEffect, useState } from 'react';
import { Camera, CheckCircle2, Loader2, Star, Trash2, X } from 'lucide-react';
import type { ProductReview } from '../../types';
import { services } from '../../services/registry';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { ProductImage } from '../ui/ProductImage';

export interface ReviewModalTarget {
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage?: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  authorName: string;
  existingReview?: ProductReview;
}

interface ProductReviewModalProps {
  target: ReviewModalTarget | null;
  onClose: () => void;
  onSubmitted?: (reviews: ProductReview[]) => void;
}

const RATING_LABEL_KEYS = {
  1: 'ratingPoor',
  2: 'ratingFair',
  3: 'ratingGood',
  4: 'ratingVeryGood',
  5: 'ratingExcellent',
} as const;

const MAX_PHOTOS = 3;

async function compressReviewPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('Invalid image file.'));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported image format.'));
      img.onload = () => {
        try {
          const maxDim = 900;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.max(1, Math.round(width * scale));
            height = Math.max(1, Math.round(height * scale));
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas unavailable.'));
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          if (compressed.length > 390_000) {
            resolve(canvas.toDataURL('image/jpeg', 0.58));
          } else {
            resolve(compressed);
          }
        } catch {
          reject(new Error('Could not process image.'));
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function ProductReviewModal({
  target,
  onClose,
  onSubmitted,
}: ProductReviewModalProps) {
  const { pushToast } = useToast();
  const { language, t, localizeEntity } = useLanguage();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setRating(target.existingReview?.rating ?? 5);
    setHoverRating(0);
    setComment(target.existingReview?.comment ?? '');
    setPhotos(target.existingReview?.photos ?? []);
    setError(null);
  }, [target]);

  useEffect(() => {
    if (!target) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, submitting, onClose]);

  if (!target) return null;

  const activeStar = hoverRating || rating;

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setError(`You can upload up to ${MAX_PHOTOS} photos per review.`);
      return;
    }

    setError(null);
    setUploadingPhoto(true);
    try {
      const nextPhotos: string[] = [];
      for (const file of files.slice(0, remainingSlots)) {
        if (!file.type.startsWith('image/')) {
          setError('Please choose JPG, PNG, or WebP photos only.');
          continue;
        }
        const compressed = await compressReviewPhoto(file);
        nextPhotos.push(compressed);
      }
      if (nextPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...nextPhotos].slice(0, MAX_PHOTOS));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target || submitting) return;

    const trimmedComment = comment.trim();
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating.');
      return;
    }
    if (trimmedComment.length < 3) {
      setError('Please write a short comment about your experience.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const nowIso = new Date().toISOString();
      const reviewPayload: ProductReview = {
        id:
          target.existingReview?.id ??
          `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: target.productId,
        productName: target.productName,
        orderId: target.orderId,
        orderNumber: target.orderNumber,
        customerId: target.customerId,
        customerEmail: target.customerEmail,
        customerPhone: target.customerPhone,
        authorName: target.authorName || 'Verified Buyer',
        rating,
        comment: trimmedComment,
        photos,
        verifiedPurchase: true,
        isSampleData: false,
        isApproved: true,
        createdAt: target.existingReview?.createdAt ?? nowIso,
        updatedAt: nowIso,
      };

      const updatedReviews = await services.community.upsertReview(reviewPayload);
      pushToast({
        title: target.existingReview ? t('editYourReview') : t('customerReviews'),
        description: target.existingReview
          ? t('reviewUpdatedToast')
          : t('reviewPublishedToast'),
        variant: 'success',
      });
      onSubmitted?.(updatedReviews);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to publish your review right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-heading"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#1A0833]/55 p-3 backdrop-blur-[2px] sm:items-center"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-[440px] overflow-y-auto rounded-[24px] border border-[#EBD8FF] bg-white shadow-[0_24px_60px_-14px_rgba(43,11,78,0.48)]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#F2E6FF] bg-white/95 px-4 py-3 backdrop-blur-sm">
          <div>
            <h2
              id="review-modal-heading"
              className="text-[15px] font-extrabold text-[#2B0B4E]"
            >
              {target.existingReview ? t('updateYourReview') : t('rateAndReviewProduct')}
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{t('verifiedPurchase')} · {target.orderNumber}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label={t('close')}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#6E5B85] hover:bg-[#F5ECFF] hover:text-[#2B0B4E]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-4">
          {/* Product Summary */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#F0E3FF] bg-[#FBF8FF] p-2.5">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-white">
              <ProductImage
                src={target.productImage}
                alt={localizeEntity(target.productName, 'name')}
                aspectClass="aspect-square"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-[#2B0B4E]">
                {localizeEntity(target.productName, 'name')}
              </p>
              <p className="text-[11px] text-[#6E5B85]">
                {t('reviewingAs')} <strong className="text-[#2B0B4E]">{target.authorName}</strong>
              </p>
            </div>
          </div>

          {/* Interactive Star Rating */}
          <div className="rounded-2xl border border-[#F0E3FF] bg-[#FAF6FF]/60 px-4 py-3 text-center">
            <p className="text-[12px] font-bold text-[#4C1D95]">
              {t('howWasGiftExperience')}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= activeStar;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`${star}/5`}
                    className="cursor-pointer p-1 transition-transform active:scale-90 hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        filled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_6px_rgba(251,191,36,0.45)]'
                          : 'text-[#D6C5EC]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[12px] font-extrabold text-[#6A11CB]">
              {activeStar} / 5 · {t(RATING_LABEL_KEYS[activeStar as 1 | 2 | 3 | 4 | 5] ?? 'ratingExcellent')}
            </p>
          </div>

          {/* Written Comment */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="verified-review-comment"
                className="text-[12px] font-bold text-[#2B0B4E]"
              >
                {t('yourFeedbackLabel')} *
              </label>
              <span className="text-[11px] tabular-nums text-[#7A6894]">
                {comment.length}/600
              </span>
            </div>
            <textarea
              id="verified-review-comment"
              rows={3}
              maxLength={600}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('feedbackPlaceholder')}
              className="mt-1.5 w-full rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] px-3 py-2.5 text-[13px] text-[#2B0B4E] placeholder:text-[#8E7AA6] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Customer Photos Upload (Up to 3) */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#2B0B4E]">
                {t('addProductPhotosOptional')}
              </span>
              <span className="text-[11px] font-semibold text-[#7A6894]">
                {photos.length}/{MAX_PHOTOS}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#6E5B85]">
              {t('realPhotosHelp')}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              {photos.map((photoSrc, idx) => (
                <div
                  key={`${idx}-${photoSrc.slice(0, 24)}`}
                  className="relative h-[68px] w-[68px] overflow-hidden rounded-xl border border-[#EBD8FF] bg-[#FAF6FF]"
                >
                  <img
                    src={photoSrc}
                    alt={`${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos((prev) => prev.filter((_, photoIdx) => photoIdx !== idx))
                    }
                    aria-label={t('removePhoto')}
                    className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-[#2B0B4E]/80 text-white hover:bg-[#C81E68]"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <label className="flex h-[68px] w-[68px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#6A11CB]/55 bg-[#FAF6FF] text-[#6A11CB] transition-colors hover:bg-[#F3E8FF]">
                  {uploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      <span className="text-[10px] font-bold">{t('addPhotoBtn')}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingPhoto || submitting}
                    onChange={(e) => void handlePhotoFiles(e)}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-[#FFD1E5] bg-[#FFF0F6] px-3 py-2 text-[12px] font-semibold text-[#C81E68]">
              {language === 'bn' && error.startsWith('Please write')
                ? 'অনুগ্রহ করে আপনার অভিজ্ঞতা সম্পর্কে একটি ছোট মন্তব্য লিখুন।'
                : error}
            </p>
          )}

          {/* Submit */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full border border-[#DFD2F2] bg-white text-[12.5px] font-bold text-[#3B2654] hover:bg-[#FAF6FF]"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingPhoto}
              className="flex h-10 flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] px-4 text-[12.5px] font-extrabold text-white shadow-[0_6px_16px_-4px_rgba(106,17,203,0.45)] transition-transform active:scale-[0.98] disabled:opacity-55"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {submitting
                  ? t('publishingBtn')
                  : target.existingReview
                    ? t('saveReviewBtn')
                    : t('publishReviewBtn')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
