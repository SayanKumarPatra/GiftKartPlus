import { apiRequest, isBackendUnavailableError } from '../storage/serverSync';

export type PushSupportState =
  | 'supported'
  | 'ios-needs-install'
  | 'unsupported';

export interface PushIdentity {
  customerAccountId?: string;
  customerEmail?: string;
}

export interface LivePushPayload {
  id: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  sentAt?: string;
  customerAccountId?: string;
  customerEmail?: string;
  fromServiceWorker?: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getPushSupportState(): PushSupportState {
  if (typeof window === 'undefined') return 'unsupported';
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (isIOS && !isStandalone) {
    return 'ios-needs-install';
  }

  if (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  ) {
    return 'supported';
  }

  if ('Notification' in window) {
    return 'supported';
  }

  return 'unsupported';
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

async function getReadyServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) {
      return existing;
    }
    return await navigator.serviceWorker.register('/sw.js?v=5', {
      updateViaCache: 'none',
    });
  } catch {
    return null;
  }
}

export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  const reg = await getReadyServiceWorker();
  if (!reg || !('pushManager' in reg)) return null;
  try {
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function enablePushNotifications(
  identity?: PushIdentity
): Promise<{
  enabled: boolean;
  permission: NotificationPermission | 'unsupported';
  serverSubscribed: boolean;
  reason?: string;
}> {
  const support = getPushSupportState();
  if (support === 'ios-needs-install') {
    return {
      enabled: false,
      permission: getNotificationPermissionState(),
      serverSubscribed: false,
      reason: 'On iPhone/iPad, tap Share → Add to Home Screen first to enable lock-screen alerts.',
    };
  }
  if (support === 'unsupported' || !('Notification' in window)) {
    return {
      enabled: false,
      permission: 'unsupported',
      serverSubscribed: false,
      reason: 'This browser does not support device notifications.',
    };
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return {
      enabled: false,
      permission,
      serverSubscribed: false,
      reason:
        permission === 'denied'
          ? 'Notifications are blocked in your browser settings. Please allow notifications for GiftKart.'
          : 'Notification permission was dismissed.',
    };
  }

  let serverSubscribed = false;
  try {
    const reg = await getReadyServiceWorker();
    if (reg && 'pushManager' in reg) {
      const keyRes = await apiRequest<{ publicKey: string }>('/api/push/public-key');
      if (keyRes.publicKey) {
        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(keyRes.publicKey),
          });
        }
        const subJson = subscription.toJSON();
        await apiRequest('/api/push/subscribe', {
          method: 'POST',
          body: {
            subscription: subJson,
            customerAccountId: identity?.customerAccountId,
            customerEmail: identity?.customerEmail,
          },
        });
        serverSubscribed = true;
      }
    }
  } catch (err) {
    if (!isBackendUnavailableError(err)) {
      // Keep local Notification permission active even if PushManager fails in embedded iframes
    }
  }

  return {
    enabled: true,
    permission,
    serverSubscribed,
  };
}

export async function syncPushSubscriptionIdentity(identity?: PushIdentity): Promise<void> {
  if (!identity?.customerAccountId && !identity?.customerEmail) return;
  if (getNotificationPermissionState() !== 'granted') return;
  try {
    const subscription = await getActivePushSubscription();
    if (!subscription) return;
    await apiRequest('/api/push/subscribe', {
      method: 'POST',
      body: {
        subscription: subscription.toJSON(),
        customerAccountId: identity.customerAccountId,
        customerEmail: identity.customerEmail,
      },
    });
  } catch {
    // Non-blocking background sync
  }
}

export async function disablePushNotifications(): Promise<void> {
  try {
    const subscription = await getActivePushSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe().catch(() => false);
      await apiRequest('/api/push/unsubscribe', {
        method: 'POST',
        body: { endpoint },
      }).catch(() => {});
    }
  } catch {
    // Ignore cleanup errors
  }
}

export async function showLocalDeviceNotification(payload: {
  id?: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const options: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
    body: payload.body,
    icon: '/icons/icon-192x192.png?v=2',
    badge: '/icons/icon-192x192.png?v=2',
    tag: payload.tag || payload.id || `giftkart-local-${Date.now()}`,
    renotify: true,
    silent: false,
    vibrate: [220, 100, 220, 100, 320],
    data: {
      url: payload.url || '/',
      id: payload.id,
    },
  };

  try {
    const reg = await getReadyServiceWorker();
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(payload.title, options);
      return true;
    }
  } catch {
    // Fall back to Window Notification constructor
  }

  try {
    new Notification(payload.title, options);
    return true;
  } catch {
    return false;
  }
}
