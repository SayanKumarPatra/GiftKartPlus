import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

/**
 * Compresses a selected phone/desktop image file safely for client-side storage
 * while keeping crisp preview quality (max dimension 1200px).
 */
export function readImageFileAsDataUrl(file: File, maxDimension = 1200): Promise<string> {
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
          if (w <= maxDimension && h <= maxDimension && file.size < 350_000) {
            resolve(rawDataUrl);
            return;
          }
          const scale = Math.min(1, maxDimension / Math.max(w, h));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(mime, 0.82));
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
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
  if (!message) return null;
  return (
    <div
      role="status"
      className={`fixed left-1/2 top-4 z-[90] flex w-[calc(100%-24px)] max-w-md -translate-x-1/2 items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-semibold shadow-lg ${
        tone === 'error'
          ? 'border border-rose-200 bg-rose-50 text-rose-800'
          : 'border border-emerald-200 bg-white text-[#1E1035] ring-1 ring-[#6A11CB]/15'
      }`}
    >
      <span className="flex items-center gap-2">
        {tone === 'error' ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
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
    </div>
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
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1E1035]/45 p-4 backdrop-blur-[2px]"
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
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-xl border border-[#E2D4F4] bg-white px-3.5 text-xs font-bold text-[#4A3860] transition-colors hover:bg-[#FAF6FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-9 rounded-xl px-4 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95 ${
              danger
                ? 'bg-rose-600'
                : 'bg-gradient-to-r from-[#6A11CB] to-[#9333EA]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
