import React, { createContext, useCallback, useContext, useState } from 'react';
import { Check, CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  compact?: boolean;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const isAdminRoute =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/admin');
      if (!toast.compact && !isAdminRoute) {
        return;
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => {
        if (toast.compact) {
          const withoutCompact = prev.filter((item) => !item.compact);
          return [...withoutCompact.slice(-1), { ...toast, id }];
        }
        return [...prev.slice(-2), { ...toast, id }];
      });
      window.setTimeout(() => {
        dismissToast(id);
      }, toast.compact ? 2200 : 2800);
    },
    [dismissToast]
  );

  const compactToasts = toasts.filter((t) => t.compact);
  const standardToasts = toasts.filter((t) => !t.compact);

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}

      {/* Compact Reference-Style Add-to-Cart Snackbar */}
      {compactToasts.length > 0 && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-3.5 bottom-[88px] z-[60] mx-auto flex max-w-md flex-col items-center gap-2 lg:bottom-6 lg:max-w-sm"
        >
          {compactToasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex w-full items-center gap-3 rounded-[10px] bg-[#2F3443] px-4 py-3 text-white shadow-[0_8px_24px_rgba(15,18,28,0.28)] transition-all duration-150"
            >
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white text-[#2F3443]">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </span>
              <p className="truncate text-[14px] font-semibold leading-snug tracking-[0.01em] text-white">
                {toast.title}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Standard Notifications */}
      {standardToasts.length > 0 && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-[132px] z-50 mx-auto flex max-w-sm flex-col gap-2 lg:inset-x-auto lg:bottom-6 lg:right-4 lg:mx-0"
        >
          {standardToasts.map((toast) => {
            const Icon =
              toast.variant === 'success'
                ? CheckCircle2
                : toast.variant === 'error'
                  ? AlertCircle
                  : Info;
            const iconColor =
              toast.variant === 'success'
                ? 'text-emerald-700'
                : toast.variant === 'error'
                  ? 'text-rose-700'
                  : 'text-[#6A11CB]';
            return (
              <div
                key={toast.id}
                className="pointer-events-auto glass-surface-strong flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm text-[#1A1025] shadow-[0_8px_24px_rgba(43,11,78,0.16)] transition-all duration-150"
              >
                <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug text-[#1A1025]">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-[#594A6B]">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="rounded-lg p-1 text-[#594A6B] transition-colors hover:bg-[#EBD8FF]/50 hover:text-[#1A1025]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
