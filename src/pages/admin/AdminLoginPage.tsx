import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_ADMIN_CREDENTIALS } from '../../services/local/localAuthServices';

export function AdminLoginPage() {
  const { adminSession, signInAdminDemo } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath =
    (location.state as { from?: string } | null)?.from ?? '/admin';

  const [email, setEmail] = useState(DEMO_ADMIN_CREDENTIALS.email);
  const [passcode, setPasscode] = useState(DEMO_ADMIN_CREDENTIALS.passcode);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (adminSession) {
    return <Navigate to={fromPath} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInAdminDemo({ email, passcode });
      pushToast({
        title: 'Welcome back, Admin',
        description: 'GiftKart Mobile Admin Panel ready.',
        variant: 'success',
      });
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-[#F6ECFF] via-[#FFF6FA] to-[#FFFFFF] px-4 py-6">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <BrandLogo size="sm" showTagline={false} />
          <Link
            to="/"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-[#EBD8FF] bg-white px-3.5 text-xs font-semibold text-[#6A11CB] shadow-xs active:bg-[#FAF6FF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Storefront</span>
          </Link>
        </div>

        <div className="space-y-4 rounded-3xl border border-[#EBD8FF] bg-white p-5 shadow-xl shadow-[#6A11CB]/10 sm:p-7">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-[#6A11CB]">
              Owner Control Center
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-[#2A0E4D]">
              GiftKart Admin Sign In
            </h1>
            <p className="mt-1 text-xs text-[#5F4B78]">
              Manage orders, products, 10 official categories, banners, coupons, and delivery zones from your phone.
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-[#4A3862]"
              >
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] bg-[#FDFBFF] px-3.5 text-sm text-[#2A0E4D] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-passcode"
                className="block text-xs font-semibold text-[#4A3862]"
              >
                Passcode
              </label>
              <input
                id="admin-passcode"
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] bg-[#FDFBFF] px-3.5 text-sm text-[#2A0E4D] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth disabled={submitting} variant="primary">
              <Lock className="h-4 w-4" />
              <span>{submitting ? 'Signing in...' : 'Open Admin Panel'}</span>
            </Button>
          </form>

          <div className="border-t border-[#F0E4FF] pt-3 text-center text-[11px] text-[#7B6496]">
            Demo Login:{' '}
            <span className="font-mono font-semibold text-[#2A0E4D]">
              {DEMO_ADMIN_CREDENTIALS.email}
            </span>{' '}
            /{' '}
            <span className="font-mono font-semibold text-[#2A0E4D]">
              {DEMO_ADMIN_CREDENTIALS.passcode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
