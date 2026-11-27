import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  playGiftKartNotificationChime,
  unlockNotificationAudio,
} from '../../utils/notificationSound';
import {
  showLocalDeviceNotification,
  syncPushSubscriptionIdentity,
  type LivePushPayload,
} from '../../utils/pushNotifications';

interface ActiveHeadsUpAlert {
  id: string;
  title: string;
  body: string;
  url: string;
}

/**
 * Global real-time notification listener:
 * 1. Unlocks Web Audio on first tap so our custom GiftKart chime plays reliably.
 * 2. Keeps the signed-in customer's Push subscription mapped to their account.
 * 3. Listens to Service Worker push messages + live SSE alerts, plays the custom
 *    GiftKart bell chime + vibrates, displays a sleek top-of-screen heads-up banner,
 *    and triggers a native OS notification if the tab is in the background.
 */
export function LiveNotificationHost() {
  const { customerAccount } = useAuth();
  const { t } = useLanguage();
  const [banner, setBanner] = useState<ActiveHeadsUpAlert | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    unlockNotificationAudio();
  }, []);

  useEffect(() => {
    if (!customerAccount) return;
    void syncPushSubscriptionIdentity({
      customerAccountId: customerAccount.id,
      customerEmail: customerAccount.email,
    });
  }, [customerAccount?.id, customerAccount?.email]);

  useEffect(() => {
    function handleIncomingAlert(payload: LivePushPayload | undefined) {
      if (!payload || !payload.title) return;

      // Filter customer-targeted order alerts so other shoppers don't receive someone else's order push
      const hasTarget = Boolean(payload.customerAccountId || payload.customerEmail);
      if (hasTarget) {
        const myId = customerAccount?.id || '';
        const myEmail = (customerAccount?.email || '').trim().toLowerCase();
        const matchesId = Boolean(payload.customerAccountId && myId && payload.customerAccountId === myId);
        const matchesEmail = Boolean(
          payload.customerEmail && myEmail && payload.customerEmail.toLowerCase() === myEmail
        );
        if (!matchesId && !matchesEmail) {
          return;
        }
      }

      // Deduplicate between Service Worker push and SSE relay
      const dedupeKey = payload.id || `${payload.title}:${payload.body}`;
      if (seenIdsRef.current.has(dedupeKey)) {
        return;
      }
      seenIdsRef.current.add(dedupeKey);
      if (seenIdsRef.current.size > 40) {
        const first = seenIdsRef.current.values().next().value;
        if (first) seenIdsRef.current.delete(first);
      }

      // Avoid double-buzzing the Admin who just clicked Send on the admin panel
      const isOnAdminPage =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      if (isOnAdminPage && !payload.fromServiceWorker) {
        return;
      }

      // Play distinct GiftKart notification chime + vibrate
      playGiftKartNotificationChime(true);

      const safeUrl =
        typeof payload.url === 'string' && payload.url.startsWith('/') && !payload.url.startsWith('//')
          ? payload.url
          : '/';

      // If browser tab is backgrounded & notification wasn't already shown by SW push, raise OS alert
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden' &&
        !payload.fromServiceWorker
      ) {
        void showLocalDeviceNotification({
          id: dedupeKey,
          title: payload.title,
          body: payload.body,
          url: safeUrl,
          tag: payload.tag || dedupeKey,
        });
      }

      // Show sleek mobile-style heads-up banner at top of viewport
      setBanner({
        id: dedupeKey,
        title: payload.title,
        body: payload.body,
        url: safeUrl,
      });

      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = window.setTimeout(() => {
        setBanner(null);
      }, 6500);
    }

    const onCustomSsePush = (event: Event) => {
      const detail = (event as CustomEvent<LivePushPayload>).detail;
      handleIncomingAlert(detail);
    };

    const onServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: LivePushPayload } | undefined;
      if (data?.type === 'GIFTKART_PUSH_RECEIVED' && data.payload) {
        handleIncomingAlert({ ...data.payload, fromServiceWorker: true });
      }
    };

    window.addEventListener('giftkart:live-push', onCustomSsePush);
    navigator.serviceWorker?.addEventListener('message', onServiceWorkerMessage);

    return () => {
      window.removeEventListener('giftkart:live-push', onCustomSsePush);
      navigator.serviceWorker?.removeEventListener('message', onServiceWorkerMessage);
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, [customerAccount?.id, customerAccount?.email]);

  if (!banner) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed inset-x-3 top-3 z-[240] mx-auto max-w-md animate-[fadeIn_180ms_ease-out]"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-[#DFC7FF] bg-white/98 p-3.5 shadow-[0_18px_40px_-10px_rgba(89,11,179,0.34)] ring-1 ring-[#6A11CB]/15 backdrop-blur-xl">
        <a
          href={banner.url}
          onClick={() => setBanner(null)}
          className="flex min-w-0 flex-1 items-start gap-3"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4D8D] text-white shadow-sm">
            <Bell className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#6A11CB]">
              <span>GiftKart</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#75648E]">{t('justNow')}</span>
            </div>
            <p className="mt-0.5 truncate text-[13.5px] font-extrabold text-[#1E1035]">
              {banner.title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#4A3860]">
              {banner.body}
            </p>
          </div>
        </a>
        <button
          type="button"
          onClick={() => setBanner(null)}
          aria-label={t('dismissAlert')}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#75648E] transition-colors hover:bg-[#F5ECFF] hover:text-[#1E1035]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
