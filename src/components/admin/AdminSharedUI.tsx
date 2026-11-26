import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

/**
 * Compresses any phone/desktop image (including large PNG/JPG screenshots & photos)
 * into a crisp lightweight WebP/JPEG data URL so LocalStorage never overflows.
 */
export function readImageFileAsDataUrl(
  file: File,
  maxDimension = 960,
  preserveTransparency = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, or WEBP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the selected image.'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result ?? '');
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          const { naturalWidth: w, naturalHeight: h } = img;
          const scale = Math.min(1, maxDimension / Math.max(w, h));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          // For opaque formats (JPEG), fill white background so transparent PNGs never turn black
          const preferWebp = true;
          let output = '';

          if (preserveTransparency) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const webpUrl = canvas.toDataURL('image/webp', 0.8);
            if (webpUrl.startsWith('data:image/webp') && webpUrl.length < 220_000) {
              resolve(webpUrl);
              return;
            }
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const qualities = [0.76, 0.62, 0.48, 0.36];
          for (const q of qualities) {
            const candidate = preferWebp
              ? canvas.toDataURL('image/webp', q)
              : canvas.toDataURL('image/jpeg', q);
            output = candidate.startsWith('data:image/webp')
              ? candidate
              : canvas.toDataURL('image/jpeg', q);
            if (output.length <= 180_000) {
              break;
            }
          }

          resolve(output || rawDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Mobile-first bottom sheet / centered modal portaled to document.body so it
 * ALWAYS paints above AdminMobileBottomNav, tracks visualViewport (soft keyboard),
 * scrolls smoothly via min-h-0 flex-1, and pins the Save footer cleanly in view.
 */
export function AdminSheetModal({
  open,
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [viewportMetrics, setViewportMetrics] = useState<{
    height: number;
    offsetTop: number;
  } | null>(null);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const updateViewport = () => {
      const vv = window.visualViewport;
      setViewportMetrics({
        height: Math.round(vv ? vv.height : window.innerHeight),
        offsetTop: Math.round(vv ? vv.offsetTop : 0),
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const sheetMaxHeight = viewportMetrics
    ? `${Math.max(260, Math.round(viewportMetrics.height * 0.92))}px`
    : '88dvh';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-x-0 top-0 z-[200] flex items-end justify-center bg-[#1E1035]/55 backdrop-blur-[2px] sm:items-center sm:p-4"
      style={
        viewportMetrics
          ? {
              top: `${viewportMetrics.offsetTop}px`,
              height: `${viewportMetrics.height}px`,
            }
          : { bottom: 0 }
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-t-[26px] border border-[#EBD8FF] bg-white shadow-2xl sm:rounded-2xl"
        style={{ maxHeight: sheetMaxHeight }}
      >
        {/* Sticky Top Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#EFE3FF] bg-white px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15.5px] font-extrabold text-[#1E1035]">
              {title}
            </h3>
            {subtitle && (
              <p className="truncate text-[11px] font-medium text-[#75648E]">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#FAF6FF] text-[#594A6B] hover:bg-[#F1E6FF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content (min-h-0 is critical so mobile flex never clips the footer) */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3.5">
          {children}
        </div>

        {/* Always-Visible Pinned Bottom Footer */}
        {footer && (
          <div
            className="shrink-0 border-t border-[#EFE3FF] bg-white px-4 pt-2.5 shadow-[0_-8px_20px_-12px_rgba(106,17,203,0.24)]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 14px)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function AdminToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A11CB] ${
        checked ? 'bg-[#16A34A]' : 'bg-[#D6CBE6]'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function AdminToast({
  message,
  tone = 'success',
  onClose,
}: {
  message: string | null;
  tone?: 'success' | 'error';
  onClose: () => void;
}) {
  if (!message || typeof document === 'undefined') return null;
  return createPortal(
    <div
      role="status"
      className={`fixed left-1/2 top-4 z-[220] flex w-[calc(100%-24px)] max-w-md -translate-x-1/2 items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-semibold shadow-lg ${
        tone === 'error'
          ? 'border border-[#FF4D8D]/35 bg-[#FFF0F6] text-[#9E1650]'
          : 'border border-emerald-200 bg-white text-[#1E1035] ring-1 ring-[#6A11CB]/15'
      }`}
    >
      <span className="flex items-center gap-2">
        {tone === 'error' ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF4D8D]" />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        )}
        <span>{message}</span>
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="rounded-lg p-1 text-[#685782] hover:bg-black/5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>,
    document.body
  );
}

export function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
      className="fixed inset-0 z-[210] flex items-center justify-center bg-[#1E1035]/50 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xl">
        <h3
          id="admin-confirm-title"
          className="text-[15px] font-extrabold text-[#1E1035]"
        >
          {title}
        </h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#594A6B]">
          {message}
        </p>
        {children && <div className="mt-3">{children}</div>}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 cursor-pointer rounded-xl border border-[#E2D4F4] bg-white px-3.5 text-xs font-bold text-[#4A3860] transition-colors hover:bg-[#FAF6FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-9 cursor-pointer rounded-xl px-4 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95 ${
              danger
                ? 'bg-gradient-to-r from-[#FF4D8D] to-[#D81B60]'
                : 'bg-gradient-to-r from-[#6A11CB] to-[#9333EA]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AdminEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DFCEF7] bg-white px-4 py-8 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5ECFF] text-[#6A11CB]">
        {icon}
      </div>
      <p className="mt-2.5 text-[13.5px] font-bold text-[#1E1035]">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-[#685782]">
          {description}
        </p>
      )}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}
