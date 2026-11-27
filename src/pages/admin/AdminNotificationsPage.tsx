import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellRing,
  Edit3,
  Plus,
  Send,
  Smartphone,
  Trash2,
  Users,
  Volume2,
} from 'lucide-react';
import { useStoreNotifications } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { apiRequest, isBackendUnavailableError } from '../../storage/serverSync';
import { playGiftKartNotificationChime } from '../../utils/notificationSound';
import type { StoreNotification } from '../../types';
import {
  AdminConfirmDialog,
  AdminEmptyState,
  AdminSheetModal,
  AdminToast,
  AdminToggleSwitch,
} from '../../components/admin/AdminSharedUI';

interface NotificationDraft {
  id: string;
  title: string;
  message: string;
  isActive: boolean;
  sendPhonePush: boolean;
}

interface PushStatsResponse {
  totalDevices: number;
  uniqueCustomers: number;
  vapidReady: boolean;
}

interface PushBroadcastResponse {
  ok: boolean;
  totalDevices: number;
  delivered: number;
  removedExpired: number;
}

function createNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const EMPTY_DRAFT: NotificationDraft = {
  id: '',
  title: '',
  message: '',
  isActive: true,
  sendPhonePush: true,
};

export function AdminNotificationsPage() {
  const { data: notifications } = useStoreNotifications(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<NotificationDraft>(EMPTY_DRAFT);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingPushId, setSendingPushId] = useState<string | null>(null);
  const [pushStats, setPushStats] = useState<PushStatsResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoreNotification | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(
    null
  );

  const activeCount = notifications.filter((n) => n.isActive).length;

  async function refreshPushStats() {
    try {
      const stats = await apiRequest<PushStatsResponse>('/api/admin/push/stats', {
        requireAdmin: true,
      });
      setPushStats(stats);
    } catch {
      // Static mode or offline — hide live device count gracefully
    }
  }

  useEffect(() => {
    void refreshPushStats();
  }, []);

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 4000);
  }

  function openNewNotification() {
    setIsEditingExisting(false);
    setDraft({
      id: createNotificationId(),
      title: '',
      message: '',
      isActive: true,
      sendPhonePush: true,
    });
    setEditorOpen(true);
  }

  function openEditNotification(item: StoreNotification) {
    setIsEditingExisting(true);
    setDraft({
      id: item.id,
      title: item.title,
      message: item.message,
      isActive: item.isActive,
      sendPhonePush: false,
    });
    setEditorOpen(true);
  }

  async function broadcastPhonePush(item: { id: string; title: string; message: string }) {
    try {
      const res = await apiRequest<PushBroadcastResponse>('/api/admin/push/broadcast', {
        method: 'POST',
        requireAdmin: true,
        body: {
          id: item.id,
          title: item.title,
          message: item.message,
          url: '/',
        },
      });
      void refreshPushStats();
      return res;
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        return null;
      }
      throw err;
    }
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const title = draft.title.trim();
    const message = draft.message.trim();
    if (!title) {
      showNotice('Please enter a notification title.', 'error');
      return;
    }
    if (!message) {
      showNotice('Please enter a notification message.', 'error');
      return;
    }

    setSaving(true);
    try {
      const notifId = draft.id || createNotificationId();
      await services.notifications.saveNotification({
        id: notifId,
        title,
        message,
        targetAudience: 'ALL_REGISTERED_USERS',
        isActive: draft.isActive,
      });
      await services.adminAuth.logActivity(
        isEditingExisting
          ? `Updated notification "${title}"`
          : `Published notification "${title}"`,
        'Notification Management'
      );

      let pushMessage = '';
      if (draft.isActive && draft.sendPhonePush) {
        const pushRes = await broadcastPhonePush({
          id: `${notifId}-${Date.now()}`,
          title,
          message,
        });
        if (pushRes) {
          pushMessage =
            pushRes.delivered > 0
              ? ` Lock-screen push sent to ${pushRes.delivered} phone${pushRes.delivered === 1 ? '' : 's'}!`
              : ' Live chime alert sent to active shoppers (0 phones subscribed for lock-screen push yet).';
        }
      }

      setEditorOpen(false);
      showNotice(
        isEditingExisting
          ? `Notification updated.${pushMessage}`
          : draft.isActive
            ? `Notification published!${pushMessage}`
            : 'Notification saved as inactive.'
      );
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to save notification.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleManualPush(item: StoreNotification) {
    setSendingPushId(item.id);
    try {
      const res = await broadcastPhonePush({
        id: `${item.id}-${Date.now()}`,
        title: item.title,
        message: item.message,
      });
      if (!res) {
        showNotice('Live push server is required for lock-screen phone push alerts.', 'error');
        return;
      }
      if (res.delivered > 0) {
        showNotice(
          `Push alert sent to ${res.delivered} subscribed phone${res.delivered === 1 ? '' : 's'} + live shoppers!`
        );
      } else {
        showNotice(
          'Live sound alert sent to active store visitors! Ask customers to tap Enable in the bell icon for lock-screen alerts.'
        );
      }
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to send push alert.',
        'error'
      );
    } finally {
      setSendingPushId(null);
    }
  }

  async function handleToggle(item: StoreNotification, nextActive: boolean) {
    try {
      await services.notifications.toggleNotification(item.id, nextActive);
      await services.adminAuth.logActivity(
        `${nextActive ? 'Activated' : 'Deactivated'} notification "${item.title}"`,
        'Notification Management'
      );
      showNotice(
        nextActive
          ? 'Notification is now active on storefront.'
          : 'Notification hidden from storefront.'
      );
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to update status.',
        'error'
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await services.notifications.deleteNotification(deleteTarget.id);
      await services.adminAuth.logActivity(
        `Deleted notification "${deleteTarget.title}"`,
        'Notification Management'
      );
      setDeleteTarget(null);
      showNotice('Notification deleted.');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to delete notification.',
        'error'
      );
    }
  }

  return (
    <div className="space-y-3.5">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {/* Top Summary & Live Push Readiness Card */}
      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-[0_8px_20px_-14px_rgba(106,17,203,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
              <BellRing className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[14.5px] font-extrabold text-[#1E1035]">
                Website &amp; Browser Push Alerts
              </h2>
              <p className="text-[11.5px] text-[#75648E]">
                {activeCount}/{notifications.length} active · Lock-screen web push &amp; GiftKart chime
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                playGiftKartNotificationChime(true);
                showNotice('Playing GiftKart notification chime!');
              }}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-[#E2D1FA] bg-[#FAF6FF] px-2.5 text-[11.5px] font-bold text-[#6A11CB] hover:bg-[#F1E6FF]"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Test Tone</span>
            </button>
            <button
              type="button"
              onClick={openNewNotification}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] px-3 text-[11.5px] font-extrabold text-white shadow-xs transition-transform active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Live Subscribed Browsers/Devices Strip */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EBD8FF] bg-[#FAF6FF] px-3 py-2.5 text-[11.5px] text-[#4A3860]">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 shrink-0 text-[#6A11CB]" />
            <span>
              <strong className="font-extrabold text-[#1E1035] tabular-nums">
                {pushStats ? pushStats.totalDevices : 0}
              </strong>{' '}
              {(pushStats?.totalDevices ?? 0) === 1 ? 'browser' : 'browsers'} subscribed for web push alerts
            </span>
          </div>
          <span className="text-[10.5px] font-semibold text-[#685782]">
            Order updates also push automatically
          </span>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <AdminEmptyState
          icon={<Bell className="h-5 w-5" />}
          title="No notifications created yet"
          description="Create an alert to publish it in the storefront bell and send a lock-screen push notification with sound to customers."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#EBD8FF]/90 bg-white p-3 shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[13.5px] font-extrabold text-[#1E1035]">
                      {item.title}
                    </p>
                    <span className="text-[11px] font-bold text-[#685782]">
                      · {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-[12px] leading-relaxed text-[#4A3860]">
                    {item.message}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10.5px] font-semibold text-[#685782]">
                    <Users className="h-3 w-3 text-[#6A11CB]" />
                    <span>All Store Customers</span>
                  </div>
                </div>

                <AdminToggleSwitch
                  checked={item.isActive}
                  onChange={(next) => void handleToggle(item, next)}
                  label={`Toggle ${item.title}`}
                />
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-end gap-1.5 border-t border-[#F4ECFF] pt-2.5">
                <button
                  type="button"
                  disabled={sendingPushId === item.id}
                  onClick={() => void handleManualPush(item)}
                  className="inline-flex h-7.5 cursor-pointer items-center gap-1 rounded-lg bg-[#6A11CB] px-2.5 text-[11px] font-extrabold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
                >
                  <Send className="h-3 w-3" />
                  <span>{sendingPushId === item.id ? 'Sending...' : 'Send Push'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditNotification(item)}
                  className="inline-flex h-7.5 cursor-pointer items-center gap-1 rounded-lg border border-[#E5D5FA] bg-white px-2.5 text-[11px] font-bold text-[#4A3860] hover:border-[#6A11CB] hover:text-[#6A11CB]"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="inline-flex h-7.5 cursor-pointer items-center gap-1 rounded-lg border border-[#FF4D8D]/30 bg-[#FFF0F6] px-2.5 text-[11px] font-bold text-[#C81E68] hover:bg-[#FFE2EE]"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Primary Create Notification CTA */}
      <button
        type="button"
        onClick={openNewNotification}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#7E1DE0] to-[#A624C2] px-5 text-[13.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(106,17,203,0.5)] transition-transform active:scale-[0.98]"
      >
        <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
        <span>Create &amp; Send Push Notification</span>
      </button>

      {/* Create / Edit Sheet Modal */}
      <AdminSheetModal
        open={editorOpen}
        title={isEditingExisting ? 'Edit Notification' : 'Send Notification'}
        subtitle="Publishes to storefront bell & sends phone push alerts"
        onClose={() => setEditorOpen(false)}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="h-11 flex-1 cursor-pointer rounded-xl border border-[#DFCEF7] bg-white text-xs font-bold text-[#4A3860]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="flex h-11 flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] text-xs font-extrabold text-white shadow-sm disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {saving
                  ? 'Sending...'
                  : draft.isActive && draft.sendPhonePush
                    ? 'Publish & Push'
                    : isEditingExisting
                      ? 'Save Changes'
                      : 'Publish Notification'}
              </span>
            </button>
          </div>
        }
      >
        <form onSubmit={(e) => void handleSave(e)} noValidate className="space-y-3">
          <div>
            <label
              htmlFor="notif-title-input"
              className="mb-1 block text-[11.5px] font-bold text-[#4A3860]"
            >
              Notification Title *
            </label>
            <input
              id="notif-title-input"
              type="text"
              maxLength={90}
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Festive Gift Offer Live!"
              className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] font-medium text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="notif-message-input"
              className="mb-1 block text-[11.5px] font-bold text-[#4A3860]"
            >
              Notification Message *
            </label>
            <textarea
              id="notif-message-input"
              rows={4}
              maxLength={320}
              value={draft.message}
              onChange={(e) => setDraft((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Write a clear, exciting message for customers..."
              className="w-full resize-none rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2.5 rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="block text-xs font-bold text-[#1E1035]">
                  Active on Storefront
                </span>
                <span className="text-[10.5px] text-[#75648E]">
                  Shows inside the header notification bell
                </span>
              </div>
              <AdminToggleSwitch
                checked={draft.isActive}
                onChange={(next) => setDraft((prev) => ({ ...prev, isActive: next }))}
                label="Toggle active status"
              />
            </div>

            {draft.isActive && (
              <div className="flex items-center justify-between gap-2 border-t border-[#EAE0FA] pt-2.5">
                <div>
                  <span className="block text-xs font-bold text-[#1E1035]">
                    Send Phone Push Alert (Lock Screen + Sound)
                  </span>
                  <span className="text-[10.5px] text-[#75648E]">
                    Alerts subscribed phones at top of screen with chime &amp; vibration
                  </span>
                </div>
                <AdminToggleSwitch
                  checked={draft.sendPhonePush}
                  onChange={(next) =>
                    setDraft((prev) => ({ ...prev, sendPhonePush: next }))
                  }
                  label="Toggle instant phone push broadcast"
                />
              </div>
            )}
          </div>
        </form>
      </AdminSheetModal>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Notification?"
        message={`"${deleteTarget?.title ?? ''}" will be removed immediately and will no longer appear to users.`}
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

