import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Gift,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminLoginPage() {
  const {
    adminSession,
    isAuthReady,
    isAdminPasscodeConfigured,
    authorizedAdminEmail,
    setupAdminPasscode,
    signInAdminDemo,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(authorizedAdminEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/admin/login'
      ? (location.state as { from: string }).from
      : '/admin';

  if (isAuthReady && adminSession) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your admin email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    if (!isAdminPasscodeConfigured) {
      if (password.trim().length < 6) {
        setError('Create a password with at least 6 characters.');
        return;
      }
      if (password.trim() !== confirmPassword.trim()) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (!isAdminPasscodeConfigured) {
        await setupAdminPasscode({
          email: normalizedEmail,
          passcode: password.trim(),
        });
      } else {
        await signInAdminDemo({
          email: normalizedEmail,
          passcode: password.trim(),
        });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-clip bg-[#F7F3FF]">
      {/* Branded Purple-Pink Gradient Top Hero matching Mockup Screen 1 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#5B0EB7] via-[#6A11CB] to-[#D6288E] px-5 pb-20 pt-12 text-center text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#FF4D8D]/25 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/15 blur-2xl"
        />

        <div className="relative mx-auto flex max-w-sm flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/25 backdrop-blur-sm">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-white">
            GiftKart
          </h1>
          <p className="mt-0.5 text-[13.5px] font-semibold text-white/90">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Crisp White Login Card Overlapping Hero */}
      <div className="relative z-10 mx-auto -mt-12 w-full max-w-sm flex-1 px-4 pb-10">
        <div className="rounded-[26px] border border-[#EBD8FF] bg-white p-5 shadow-[0_18px_40px_-18px_rgba(106,17,203,0.28)]">
          <div className="text-center">
            <h2 className="text-[19px] font-extrabold text-[#1E1035]">
              {isAdminPasscodeConfigured ? 'Admin Login' : 'Set Admin Password'}
            </h2>
            <p className="mt-1 text-[12px] text-[#685782]">
              {isAdminPasscodeConfigured
                ? 'Access to manage your GiftKart store'
                : 'First-time setup for your authorized GiftKart admin account'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3.5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] font-medium text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1 block text-[11.5px] font-bold text-[#4A3860]"
              >
                Admin Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A11CB]" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.giftkart@gmail.com"
                  className="h-11 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] pl-10 pr-3.5 text-[13.5px] font-medium text-[#1E1035] placeholder:text-[#9686AC] focus:border-[#6A11CB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6A11CB]/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1 block text-[11.5px] font-bold text-[#4A3860]"
              >
                {isAdminPasscodeConfigured ? 'Password' : 'Create Password (min 6 chars)'}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A11CB]" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isAdminPasscodeConfigured ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isAdminPasscodeConfigured ? 'Enter your password' : 'Set a strong password'}
                  className="h-11 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] pl-10 pr-10 text-[13.5px] font-medium text-[#1E1035] placeholder:text-[#9686AC] focus:border-[#6A11CB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6A11CB]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[#7A6894] hover:text-[#6A11CB]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isAdminPasscodeConfigured && (
              <div>
                <label
                  htmlFor="admin-password-confirm"
                  className="mb-1 block text-[11.5px] font-bold text-[#4A3860]"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A11CB]" />
                  <input
                    id="admin-password-confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="h-11 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] pl-10 pr-3.5 text-[13.5px] font-medium text-[#1E1035] placeholder:text-[#9686AC] focus:border-[#6A11CB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6A11CB]/20"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#7E1DE0] to-[#B026B8] px-5 text-[14px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(106,17,203,0.55)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65"
            >
              <span>
                {submitting
                  ? 'Signing In...'
                  : isAdminPasscodeConfigured
                    ? 'Log In'
                    : 'Save Password & Enter'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-[#5E4D75]">
            <ShieldCheck className="h-4 w-4 text-[#6A11CB]" />
            <span>Secure Admin Access</span>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
          >
            ← Return to GiftKart Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
