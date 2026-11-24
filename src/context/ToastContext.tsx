import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
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
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 2800);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[132px] z-50 mx-auto flex max-w-sm flex-col gap-2 lg:inset-x-auto lg:bottom-6 lg:right-4 lg:mx-0"
      >
        {toasts.map((toast) => {
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
