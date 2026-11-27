import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, Package, Volume2, X } from 'lucide-react';
import {
  useCustomerOrderNotifications,
  useStoreNotifications,
} from '../../hooks/useStoreData';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { readStorage, STORAGE_KEYS, writeStorage } from '../../storage/localStorageEngine';
import { formatDateTime } from '../../utils/format';
import { playGiftKartNotificationChime } from '../../utils/notificationSound';
import {
  disablePushNotifications,
  enablePushNotifications,
  getActivePushSubscription,
  getNotificationPermissionState,
  getPushSupportState,
  showLocalDeviceNotification,
} from '../../utils/pushNotifications';

interface NotificationBellProps {
  variant: 'mobile' | 'desktop';
}

interface CombinedNotificationItem {
  id: string;
  kind: 'order' | 'store';
  title: string;
  message: string;
  timestamp: string;
  orderNumber?: string;
}

export function NotificationBell({ variant }: NotificationBellProps) {
  const { customerAccount } = useAuth();
  const { data: activeStoreNotifications } = useStoreNotifications(false);
  const { data: orderNotifications } = useCustomerOrderNotifications(
    customerAccount?.id,
    customerAccount?.email
  );
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [lastSeenStamp, setLastSeenStamp] = useState<string>(() =>
    readStorage<string>(STORAGE_KEYS.NOTIF_SEEN_AT, '')
  );
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushStatusNote, setPushStatusNote] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pushSupport = useMemo(() => getPushSupportState(), []);
  const permissionState = getNotificationPermissionState();

  useEffect(() => {
    if (!open) return;
    let active = true;
    void (async () => {
      const perm = getNotificationPermissionState();
      const sub = await getActivePushSubscription();
      if (!active) return;
      setPushEnabled(perm === 'granted' && Boolean(sub || perm === 'granted'));
    })();
    return () => {
      active = false;
    };
  }, [open]);

  const combinedNotifications = useMemo<CombinedNotificationItem[]>(() => {
    const orderItems: CombinedNotificationItem[] = orderNotifications.map((n) => ({
      id: n.id,
      kind: 'order',
      title: n.title,
      message: n.message,
      timestamp: n.sentAt,
      orderNumber: n.orderNumber,
    }));
    const storeItems: CombinedNotificationItem[] = activeStoreNotifications.map((n) => ({
      id: n.id,
      kind: 'store',
      title: n.title,
      message: n.message,
      timestamp: n.updatedAt || n.createdAt,
    }));
    return [...orderItems, ...storeItems].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
  }, [orderNotifications, activeStoreNotifications]);

  const latestActiveStamp = useMemo(() => {
    if (combinedNotifications.length === 0) return '';
    return combinedNotifications[0].timestamp;
  }, [combinedNotifications]);

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

  async function handleEnableAlerts() {
    setPushBusy(true);
    setPushStatusNote(null);
    try {
      const res = await enablePushNotifications({
        customerAccountId: customerAccount?.id,
        customerEmail: customerAccount?.email,
      });
      if (res.enabled) {
        setPushEnabled(true);
        playGiftKartNotificationChime(true);
        void showLocalDeviceNotification({
          id: `welcome-${Date.now()}`,
          title: 'GiftKart Alerts Enabled',
          body: 'You will now receive instant offer & order alerts with sound.',
          url: '/',
        });
        setPushStatusNote('Phone alerts active! You will be notified even when screen is off.');
      } else if (res.reason) {
        setPushStatusNote(res.reason);
      }
    } finally {
      setPushBusy(false);
    }
  }

  async function handleDisableAlerts() {
    setPushBusy(true);
    setPushStatusNote(null);
    try {
      await disablePushNotifications();
      setPushEnabled(false);
      setPushStatusNote('Phone push alerts turned off on this device.');
    } finally {
      setPushBusy(false);
    }
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
              ? 'fixed right-3 top-[60px] z-50 w-[min(336px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#EBD8FF] bg-white/98 shadow-[0_18px_40px_-14px_rgba(106,17,203,0.28)] backdrop-blur-xl'
              : 'absolute right-0 top-full z-50 mt-2.5 w-88 overflow-hidden rounded-2xl border border-[#EBD8FF] bg-white/98 shadow-[0_18px_40px_-14px_rgba(106,17,203,0.28)] backdrop-blur-xl'
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

          {/* Website Browser Push & Sound Opt-In Bar */}
          {pushSupport !== 'unsupported' && (
            <div className="border-b border-[#EFE3FF] bg-[#FCFAFF] px-3.5 py-2.5">
              {pushSupport === 'ios-needs-install' ? (
                <p className="text-[11px] font-medium leading-snug text-[#594A6B]">
                  On iPhone Safari, tap <strong>Share → Add to Home Screen</strong> once to allow browser push alerts.
                </p>
              ) : permissionState === 'denied' ? (
                <p className="text-[11px] font-medium leading-snug text-rose-700">
                  Website notifications are blocked in browser settings. Allow them to get alerts.
                </p>
              ) : pushEnabled ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5 text-[11.5px] font-bold text-emerald-700">
                    <BellRing className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Website Push &amp; Sound On</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => playGiftKartNotificationChime(true)}
                      className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-[#E2D1FA] bg-white px-2 text-[11px] font-bold text-[#6A11CB] hover:bg-[#F5ECFF]"
                    >
                      <Volume2 className="h-3 w-3" />
                      <span>Tone</span>
                    </button>
                    <button
                      type="button"
                      disabled={pushBusy}
                      onClick={() => void handleDisableAlerts()}
                      className="h-7 cursor-pointer rounded-lg px-2 text-[11px] font-semibold text-[#75648E] hover:bg-[#F3ECFC] hover:text-[#1E1035]"
                    >
                      Off
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-extrabold text-[#1E1035]">
                      Instant Browser &amp; Mobile Alerts
                    </p>
                    <p className="text-[10.5px] leading-tight text-[#685782]">
                      Get website offer &amp; order notifications with sound
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pushBusy}
                    onClick={() => void handleEnableAlerts()}
                    className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] px-3 text-[11.5px] font-extrabold text-white shadow-xs transition-transform active:scale-95 disabled:opacity-60"
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    <span>{pushBusy ? 'Turning on...' : 'Enable'}</span>
                  </button>
                </div>
              )}

              {pushStatusNote && (
                <p className="mt-1.5 text-[10.5px] font-medium leading-snug text-[#594A6B]">
                  {pushStatusNote}
                </p>
              )}
            </div>
          )}

          <div className="max-h-[320px] overflow-y-auto p-3">
            {combinedNotifications.length === 0 ? (
              <p className="py-5 text-center text-xs font-medium text-[#75648E]">
                {t('notificationsEmpty')}
              </p>
            ) : (
              <div className="space-y-2.5">
                {combinedNotifications.map((item) =>
                  item.kind === 'order' && item.orderNumber ? (
                    <Link
                      key={item.id}
                      to={`/order/${item.orderNumber}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl border border-[#EBD8FF] bg-gradient-to-r from-[#FAF5FF] to-[#FFF5FA] px-3.5 py-2.5 transition-colors hover:border-[#6A11CB]/40"
                    >
                      <div className="flex items-start gap-2">
                        <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-extrabold leading-snug text-[#2B0B4E]">
                            {item.title}
                          </p>
                          <p className="mt-0.5 whitespace-pre-line text-[11.5px] leading-relaxed text-[#4A3860]">
                            {item.message}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-[#6E5B85]">
                            {formatDateTime(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ) : (
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
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
