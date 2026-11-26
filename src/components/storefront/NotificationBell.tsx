import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useStoreNotifications } from '../../hooks/useStoreData';
import { useLanguage } from '../../context/LanguageContext';
import { readStorage, STORAGE_KEYS, writeStorage } from '../../storage/localStorageEngine';

interface NotificationBellProps {
  variant: 'mobile' | 'desktop';
}

export function NotificationBell({ variant }: NotificationBellProps) {
  const { data: activeNotifications } = useStoreNotifications(false);
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [lastSeenStamp, setLastSeenStamp] = useState<string>(() =>
    readStorage<string>(STORAGE_KEYS.NOTIF_SEEN_AT, '')
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const latestActiveStamp = useMemo(() => {
    if (activeNotifications.length === 0) return '';
    return activeNotifications.reduce(
      (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
      activeNotifications[0].updatedAt
    );
  }, [activeNotifications]);

  // Subtle pink indicator dot ONLY when an active notification exists and hasn't been opened yet
  const showIndicator = Boolean(latestActiveStamp && latestActiveStamp > lastSeenStamp);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleToggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next && latestActiveStamp) {
        setLastSeenStamp(latestActiveStamp);
        try {
          writeStorage(STORAGE_KEYS.NOTIF_SEEN_AT, latestActiveStamp);
        } catch {
          // Ignore storage errors
        }
      }
      return next;
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={t('notificationsAria')}
        aria-expanded={open}
        className={
          variant === 'mobile'
            ? 'relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#4B148C] transition-colors active:bg-[#EBD8FF]/50'
            : 'group relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#6A11CB] transition-colors hover:bg-[#FAF5FF] hover:text-[#FF4D8D]'
        }
      >
        <Bell
          className={
            variant === 'mobile'
              ? 'h-[19px] w-[19px] stroke-[1.9]'
              : 'h-[19px] w-[19px] stroke-[1.95]'
          }
        />
        {showIndicator && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-1.5 top-1.5 flex h-2 w-2"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4D8D] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4D8D]" />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('notificationsTitle')}
          className={
            variant === 'mobile'
              ? 'fixed right-3 top-[60px] z-50 w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#EBD8FF] bg-white/98 shadow-[0_18px_40px_-14px_rgba(106,17,203,0.28)] backdrop-blur-xl'
              : 'absolute right-0 top-full z-50 mt-2.5 w-80 overflow-hidden rounded-2xl border border-[#EBD8FF] bg-white/98 shadow-[0_18px_40px_-14px_rgba(106,17,203,0.28)] backdrop-blur-xl'
          }
        >
          {/* Minimal Popup Header */}
          <div className="flex items-center justify-between border-b border-[#EFE3FF] bg-gradient-to-r from-[#FAF5FF] to-[#FFF4F9] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#6A11CB]" />
              <span className="text-[13px] font-extrabold text-[#1E1035]">
                {t('notificationsTitle')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('close')}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#594A6B] transition-colors hover:bg-[#EBD8FF]/50 hover:text-[#6A11CB]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Strictly Minimal Notification Content: ONLY Title and Message */}
          <div className="max-h-[300px] overflow-y-auto p-3">
            {activeNotifications.length === 0 ? (
              <p className="py-5 text-center text-xs font-medium text-[#75648E]">
                {t('notificationsEmpty')}
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeNotifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#EFE3FF] bg-[#FCFAFF] px-3.5 py-2.5"
                  >
                    <p className="text-[13px] font-bold leading-snug text-[#1E1035]">
                      {item.title}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-[#594A6B]">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
