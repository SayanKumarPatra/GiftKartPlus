import React, { useState } from 'react';
import {
  Bell,
  Edit3,
  Info,
  Plus,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { useStoreNotifications } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
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
}

function createNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const EMPTY_DRAFT: NotificationDraft = {
  id: '',
  title: '',
  message: '',
  isActive: true,
};

export function AdminNotificationsPage() {
  const { data: notifications } = useStoreNotifications(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<NotificationDraft>(EMPTY_DRAFT);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoreNotification | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(
    null
  );

  const activeCount = notifications.filter((n) => n.isActive).length;

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3500);
  }

  function openNewNotification() {
    setIsEditingExisting(false);
    setDraft({
      id: createNotificationId(),
      title: '',
      message: '',
      isActive: true,
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
    });
    setEditorOpen(true);
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
      await services.notifications.saveNotification({
        id: draft.id || createNotificationId(),
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
      setEditorOpen(false);
      showNotice(
        isEditingExisting
          ? 'Notification updated.'
          : draft.isActive
            ? 'Notification saved and shown in the storefront bell popup.'
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

      {/* Top Summary Card */}
      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-[0_8px_20px_-14px_rgba(106,17,203,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[14.5px] font-extrabold text-[#1E1035]">
                Storefront Notifications
              </h2>
              <p className="text-[11.5px] text-[#75648E]">
                Shows title &amp; message in the header notification bell
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#F4EAFF] px-2.5 py-1 text-[11px] font-extrabold text-[#6A11CB]">
              {activeCount}/{notifications.length} Active
            </span>
            <button
              type="button"
              onClick={openNewNotification}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] px-3 text-[11.5px] font-extrabold text-white shadow-xs transition-transform active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Honest Storage Scope Note — No Fake Push Claims */}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#EBD8FF] bg-[#FAF6FF] px-3 py-2 text-[11px] leading-relaxed text-[#594A6B]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
          <span>
            Active notifications immediately appear inside the storefront Notification Bell popup in
            this store environment. Global multi-device broadcasting and background push alerts
            require connecting a shared database and Web Push service later.
          </span>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <AdminEmptyState
          icon={<Bell className="h-5 w-5" />}
          title="No notifications created yet"
          description="Create a short title and message to show inside the storefront header notification bell."
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
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        item.isActive ? 'bg-[#FF4D8D]' : 'bg-[#D6CBE6]'
                      }`}
                    />
                    <p className="text-[13.5px] font-extrabold text-[#1E1035]">
                      {item.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.isActive
                          ? 'bg-[#FFF0F6] text-[#C81E68]'
                          : 'bg-[#F3EEFB] text-[#75648E]'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-[12px] leading-relaxed text-[#4A3860]">
                    {item.message}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#FAF6FF] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#685782]">
                    <Users className="h-3 w-3 text-[#6A11CB]" />
                    <span>Target: All Registered Users</span>
                  </div>
                </div>

                <AdminToggleSwitch
                  checked={item.isActive}
                  onChange={(next) => void handleToggle(item, next)}
                  label={`Toggle ${item.title}`}
                />
              </div>

              <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-[#F4ECFF] pt-2.5">
                <button
                  type="button"
                  onClick={() => openEditNotification(item)}
                  className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-[#E5D5FA] bg-white px-2.5 text-[11px] font-bold text-[#4A3860] hover:border-[#6A11CB] hover:text-[#6A11CB]"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-[#FF4D8D]/30 bg-[#FFF0F6] px-2.5 text-[11px] font-bold text-[#C81E68] hover:bg-[#FFE2EE]"
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
        <span>Create Notification</span>
      </button>

      {/* Create / Edit Sheet Modal */}
      <AdminSheetModal
        open={editorOpen}
        title={isEditingExisting ? 'Edit Notification' : 'Create Notification'}
        subtitle="Displayed cleanly inside the header notification bell"
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
                  ? 'Saving...'
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
              maxLength={400}
              value={draft.message}
              onChange={(e) => setDraft((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Write a clear, helpful message for customers..."
              className="w-full resize-none rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] px-3 py-2.5">
            <p className="text-[11px] font-bold text-[#685782]">Target Audience</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-extrabold text-[#1E1035]">
              <Users className="h-3.5 w-3.5 text-[#6A11CB]" />
              <span>All Registered Users</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] px-3 py-2.5">
            <div>
              <span className="block text-xs font-bold text-[#1E1035]">
                Active on Storefront
              </span>
              <span className="text-[10.5px] text-[#75648E]">
                Turn off to hide immediately from users
              </span>
            </div>
            <AdminToggleSwitch
              checked={draft.isActive}
              onChange={(next) => setDraft((prev) => ({ ...prev, isActive: next }))}
              label="Toggle active status"
            />
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
