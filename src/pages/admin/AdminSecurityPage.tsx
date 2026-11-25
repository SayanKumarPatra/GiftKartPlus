import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminActivityLogs } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { formatDateTime } from '../../utils/format';
import { AdminToast } from '../../components/admin/AdminSharedUI';

export function AdminSecurityPage() {
  const navigate = useNavigate();
  const {
    adminSession,
    changeAdminPasscode,
    updateAdminProfile,
    signOutAdmin,
  } = useAuth();
  const { data: logs } = useAdminActivityLogs();

  const [displayName, setDisplayName] = useState(
    adminSession?.displayName || 'GiftKart Store Admin'
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3500);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      showNotice('Display name cannot be empty.', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      await updateAdminProfile(displayName);
      showNotice('Admin profile saved.');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to update profile.',
        'error'
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword.trim()) {
      showNotice('Enter your current password.', 'error');
      return;
    }
    if (newPassword.trim().length < 6) {
      showNotice('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      showNotice('New password and confirmation do not match.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await changeAdminPasscode(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showNotice('Admin password updated successfully!');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to change password.',
        'error'
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleClearLogs() {
    await services.adminAuth.clearActivityLogs();
    showNotice('Activity log cleared.');
  }

  async function handleLogout() {
    await signOutAdmin();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="space-y-3.5">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {/* Admin Profile Card */}
      <form
        onSubmit={handleSaveProfile}
        noValidate
        className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.18)]"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
            <UserCheck className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-[14px] font-extrabold text-[#1E1035]">
              Admin Profile
            </h2>
            <p className="text-[11.5px] text-[#75648E]">
              Authorized Email: {adminSession?.email}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] text-xs font-extrabold text-white shadow-xs disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </form>

      {/* Change Password Card */}
      <form
        onSubmit={handleChangePassword}
        noValidate
        className="space-y-2.5 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.18)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFEAF2] text-[#FF4D8D]">
              <KeyRound className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-[14px] font-extrabold text-[#1E1035]">
                Change Password
              </h2>
              <p className="text-[11.5px] text-[#75648E]">
                Salted SHA-256 verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords((prev) => !prev)}
            aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[#E5D5FA] bg-[#FAF6FF] px-2.5 text-[11px] font-bold text-[#6A11CB]"
          >
            {showPasswords ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Show</span>
              </>
            )}
          </button>
        </div>

        <input
          type={showPasswords ? 'text' : 'password'}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
        />
        <input
          type={showPasswords ? 'text' : 'password'}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 6 chars)"
          className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
        />
        <input
          type={showPasswords ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
        />

        <button
          type="submit"
          disabled={savingPassword}
          className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1E1035] text-xs font-extrabold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{savingPassword ? 'Updating...' : 'Save New Password'}</span>
        </button>
      </form>

      {/* Session & Logout */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.16)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[#1E1035]">
              Active Admin Session
            </p>
            <p className="truncate text-[11px] text-[#75648E]">
              Signed in {adminSession?.signedInAt ? formatDateTime(adminSession.signedInAt) : 'now'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Real Admin Activity Logs */}
      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.16)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#6A11CB]" />
            <h2 className="text-[13.5px] font-extrabold text-[#1E1035]">
              Activity Logs ({logs.length})
            </h2>
          </div>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={() => void handleClearLogs()}
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-rose-600"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <p className="mt-2.5 text-xs text-[#75648E]">
            No admin activity recorded yet.
          </p>
        ) : (
          <div className="mt-2.5 max-h-60 divide-y divide-[#F3EAFF] overflow-y-auto pr-1">
            {logs.map((entry) => (
              <div key={entry.id} className="py-2 first:pt-0 last:pb-0">
                <p className="text-xs font-bold text-[#1E1035]">{entry.action}</p>
                <p className="text-[11px] text-[#75648E]">
                  {entry.target} · {formatDateTime(entry.timestamp)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
