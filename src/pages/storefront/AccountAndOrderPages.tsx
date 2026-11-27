import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Headset,
  Heart,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  PencilLine,
  Phone,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCustomerOrders, useProducts } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import type { DemoOrder } from '../../types';
import { formatDateTime, formatInr } from '../../utils/format';
import {
  canCustomerCancelOrder,
  getCustomerOrderStatusLabel,
  getOrderTimelineStepIndex,
  type CustomerOrderDisplayStatus,
} from '../../utils/storefrontHelpers';
import {
  getOrderBadgeClasses,
  getPaymentBadgeClasses,
  getStatusDisplayLabel,
  normalizePaymentStatus,
} from '../../utils/orderLifecycle';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { ProductImage } from '../../components/ui/ProductImage';
import { MobileOrdersPage } from '../../components/storefront/MobileOrdersPage';
import { MobileAccountAuthPages } from '../../components/storefront/MobileAccountAuthPages';
import { LanguageSelector } from '../../components/storefront/LanguageSelector';

const DESKTOP_LOGIN_ILLUSTRATION =
  '/assets/aistudio/Vibrant_Purple_Shopping_Bag_Scene_2fb63564.png';
const DESKTOP_SIGNUP_ILLUSTRATION =
  '/assets/aistudio/3D_Purple_Clipboard_Registration_Icon_30307bae.png';
const DESKTOP_FORGOT_ILLUSTRATION =
  '/assets/aistudio/Glossy_Purple_Forgot_Password_Envelope_7c26fe9d.png';
const DESKTOP_ORDERS_LOGGED_OUT_ILLUSTRATION =
  '/assets/aistudio/Vibrant_3D_Shopping_Essentials_49dd2758.png';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DesktopAuthMode = 'login' | 'signup' | 'forgot';
type DesktopAccountTab = 'overview' | 'edit-profile' | 'preferences' | 'language';

function GoogleOfficialLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3.01h3.87c2.26-2.08 3.56-5.15 3.56-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3.01c-1.08.72-2.45 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.26a7.2 7.2 0 0 1 0-4.52v-3.1H1.25a12 12 0 0 0 0 10.72l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.25 6.64l4 3.1C6.2 6.89 8.86 4.77 12 4.77Z"
      />
    </svg>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'GK';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function CustomerAccountPage() {
  const { customerAccount, isAuthReady, signInCustomerDemo, signOutCustomer } =
    useAuth();
  const { wishlistIds } = useCart();
  const { language, languages, t } = useLanguage();
  const { data: orders } = useCustomerOrders(
    customerAccount?.id,
    customerAccount?.email
  );
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentLanguageLabel =
    languages.find((l) => l.code === language)?.nativeName ?? 'English';

  const navState = location.state as {
    from?: string;
    mode?: DesktopAuthMode;
    reason?: string;
  } | null;

  const queryMode = searchParams.get('mode') as DesktopAuthMode | null;
  const queryTab = searchParams.get('tab');
  const initialMode: DesktopAuthMode =
    queryMode === 'signup' || queryMode === 'forgot' || queryMode === 'login'
      ? queryMode
      : navState?.mode === 'signup'
        ? 'signup'
        : navState?.mode === 'forgot'
          ? 'forgot'
          : 'login';

  const [authMode, setAuthMode] = useState<DesktopAuthMode>(initialMode);
  const [activeTab, setActiveTab] = useState<DesktopAccountTab>(
    queryTab === 'language' ? 'language' : 'overview'
  );
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Sign Up form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupErrors, setSignupErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSentTo, setForgotSentTo] = useState<string | null>(null);

  // Edit Profile & Preferences state
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [editName, setEditName] = useState(customerAccount?.fullName ?? '');
  const [editEmail, setEditEmail] = useState(customerAccount?.email ?? '');
  const [editPhone, setEditPhone] = useState(customerAccount?.phone ?? '');
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);
  const [orderUpdatesOn, setOrderUpdatesOn] = useState(true);
  const [offersOn, setOffersOn] = useState(true);
  const [whatsappUpdatesOn, setWhatsappUpdatesOn] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (queryMode === 'signup' || queryMode === 'login' || queryMode === 'forgot') {
      setAuthMode(queryMode);
    } else if (navState?.mode) {
      setAuthMode(navState.mode);
    }
  }, [queryMode, navState?.mode]);

  useEffect(() => {
    if (queryTab === 'language') {
      setActiveTab('language');
    }
  }, [queryTab]);

  useEffect(() => {
    if (customerAccount) {
      setEditName(customerAccount.fullName);
      setEditEmail(customerAccount.email);
      setEditPhone(customerAccount.phone);
    }
  }, [customerAccount]);

  const myOrdersCount = useMemo(() => {
    if (!customerAccount) return 0;
    return orders.filter(
      (o) =>
        o.customerAccountId === customerAccount.id ||
        o.customer.email.toLowerCase() === customerAccount.email.toLowerCase()
    ).length;
  }, [orders, customerAccount]);

  async function completeAuth(input: {
    fullName: string;
    email: string;
    phone: string;
  }) {
    await signInCustomerDemo({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      defaultCity: 'Jalchak',
    });
    const redirectTarget = navState?.from;
    if (redirectTarget && redirectTarget !== '/account') {
      navigate(redirectTarget, { replace: true });
      return;
    }
    setActiveTab('overview');
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: { email?: string; password?: string } = {};
    if (!loginEmail.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!EMAIL_PATTERN.test(loginEmail.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!loginPassword.trim()) {
      errs.password = 'Please enter your password.';
    } else if (loginPassword.trim().length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    setLoginErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const cleanEmail = loginEmail.trim().toLowerCase();
    const inferredName = cleanEmail
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

    await completeAuth({
      fullName: inferredName || 'GiftKart Member',
      email: cleanEmail,
      phone: '',
    });
  }

  async function handleSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: { name?: string; email?: string; password?: string } = {};
    if (!signupName.trim()) {
      errs.name = 'Please enter your full name.';
    }
    if (!signupEmail.trim()) {
      errs.email = 'Email address is required.';
    } else if (!EMAIL_PATTERN.test(signupEmail.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!signupPassword.trim()) {
      errs.password = 'Please create a password.';
    } else if (signupPassword.trim().length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    setSignupErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await completeAuth({
      fullName: signupName.trim(),
      email: signupEmail.trim().toLowerCase(),
      phone: signupPhone.replace(/\D/g, '').slice(-10),
    });
  }

  async function handleGoogleContinue() {
    await completeAuth({
      fullName: 'Sayan Kumar',
      email: 'sayan.kumar@gmail.com',
      phone: '',
    });
  }

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim() || !EMAIL_PATTERN.test(forgotEmail.trim())) {
      setForgotError('Please enter a valid registered email address.');
      return;
    }
    setForgotError('');
    setForgotSentTo(forgotEmail.trim());
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) return;
    await signInCustomerDemo({
      fullName: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.replace(/\D/g, '').slice(-10),
      defaultCity: customerAccount?.defaultCity || 'Jalchak',
    });
    setProfileSavedNotice(true);
    window.setTimeout(() => setProfileSavedNotice(false), 3000);
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  const activeIllustration =
    authMode === 'signup'
      ? DESKTOP_SIGNUP_ILLUSTRATION
      : authMode === 'forgot'
        ? DESKTOP_FORGOT_ILLUSTRATION
        : DESKTOP_LOGIN_ILLUSTRATION;

  return (
    <>
      {/* Normal Mobile (< 900px): Premium 4-Screen Auth & My Account Experience */}
      <div className="-mx-3.5 -my-4 sm:-mx-6 sm:-my-5 lg:hidden">
        <MobileAccountAuthPages />
      </div>

      {/* Desktop & Laptop (>= 900px): Full Feature Parity with Mobile Auth & Account */}
      <div className="mx-auto hidden max-w-5xl lg:block">
        {!isAuthReady ? (
          <div className="h-80 animate-pulse rounded-2xl bg-[#FAF5FF]" />
        ) : !customerAccount ? (
          /* LOGGED-OUT SPLIT AUTH EXPERIENCE */
          <div className="mx-auto grid max-w-4xl grid-cols-12 overflow-hidden rounded-2xl border border-[#EFE3FF] bg-white shadow-[0_14px_40px_-20px_rgba(106,17,203,0.2)]">
            {/* Left Visual Brand Column with Mobile 3D Illustrations */}
            <div className="col-span-5 flex flex-col items-center justify-center bg-gradient-to-b from-[#FAF3FF] via-[#FDF7FF] to-[#FFF2F8] p-8 text-center">
              <img
                src={activeIllustration}
                alt="GiftKart Account Illustration"
                className="h-44 w-auto object-contain drop-shadow-[0_12px_22px_rgba(106,17,203,0.16)]"
              />
              <h2 className="mt-5 font-display text-xl font-bold text-[#1E1035]">
                {authMode === 'signup'
                  ? t('createAccount')
                  : authMode === 'forgot'
                    ? t('account')
                    : t('welcomeBack')}
              </h2>
              <p className="mt-2 max-w-[260px] text-xs leading-relaxed text-[#594A6B]">
                {t('guestAccountNote')}
              </p>

              {/* Language Switcher Accessible Before Login */}
              <LanguageSelector compact className="mt-5 w-full text-left" />
            </div>

            {/* Right Interactive Auth Form Column */}
            <div className="col-span-7 p-8">
              {navState?.reason === 'wishlist' && (
                <div className="mb-4 rounded-xl border border-[#EBD8FF] bg-[#FAF5FF] px-4 py-2.5 text-xs font-semibold text-[#6A11CB]">
                  {t('signInPrompt')}
                </div>
              )}

              {authMode !== 'forgot' && (
                <div className="mb-6 flex border-b border-[#EFE3FF]">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`cursor-pointer border-b-2 pb-2.5 pr-6 text-sm font-bold transition-colors ${
                      authMode === 'login'
                        ? 'border-[#6A11CB] text-[#6A11CB]'
                        : 'border-transparent text-[#7A6894] hover:text-[#1E1035]'
                    }`}
                  >
                    {t('signIn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`cursor-pointer border-b-2 pb-2.5 px-6 text-sm font-bold transition-colors ${
                      authMode === 'signup'
                        ? 'border-[#6A11CB] text-[#6A11CB]'
                        : 'border-transparent text-[#7A6894] hover:text-[#1E1035]'
                    }`}
                  >
                    {t('createAccount')}
                  </button>
                </div>
              )}

              {/* LOGIN FORM */}
              {authMode === 'login' && (
                <form onSubmit={(e) => void handleLoginSubmit(e)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2B0B4E]">
                      Email Address
                    </label>
                    <div className="relative mt-1">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C75A8]" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-11 w-full rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] pl-10 pr-3.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                      />
                    </div>
                    {loginErrors.email && (
                      <p className="mt-1 text-xs font-semibold text-[#C81E68]">{loginErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#2B0B4E]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotSentTo(null);
                          setAuthMode('forgot');
                        }}
                        className="cursor-pointer text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative mt-1">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C75A8]" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="h-11 w-full rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] pl-10 pr-10 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        aria-label="Toggle password visibility"
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#7A6894] hover:text-[#6A11CB]"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="mt-1 text-xs font-semibold text-[#C81E68]">{loginErrors.password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(106,17,203,0.4)] transition-opacity hover:opacity-95"
                  >
                    {t('signIn')}
                  </button>

                  <div className="relative my-4 flex items-center justify-center">
                    <span className="h-px flex-1 bg-[#EFE3FF]" />
                    <span className="px-3 text-[11px] font-semibold text-[#8C75A8]">
                      or continue with
                    </span>
                    <span className="h-px flex-1 bg-[#EFE3FF]" />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleGoogleContinue()}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-[#DFD2F2] bg-white text-sm font-bold text-[#1E1035] transition-colors hover:bg-[#FAF6FF]"
                  >
                    <GoogleOfficialLogo className="h-4 w-4" />
                    <span>Continue with Google</span>
                  </button>
                </form>
              )}

              {/* SIGN UP FORM */}
              {authMode === 'signup' && (
                <form onSubmit={(e) => void handleSignUpSubmit(e)} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#2B0B4E]">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] px-3.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                    />
                    {signupErrors.name && (
                      <p className="mt-1 text-xs font-semibold text-[#C81E68]">{signupErrors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#2B0B4E]">
                        {t('emailAddress')} *
                      </label>
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] px-3.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                      />
                      {signupErrors.email && (
                        <p className="mt-1 text-xs font-semibold text-[#C81E68]">{signupErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2B0B4E]">
                        {t('phoneNumber')}
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={signupPhone}
                        onChange={(e) =>
                          setSignupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                        }
                        placeholder="10-digit mobile"
                        className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] px-3.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2B0B4E]">
                      Create Password *
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="h-10 w-full rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] pl-3.5 pr-10 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((prev) => !prev)}
                        aria-label="Toggle password visibility"
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#7A6894]"
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {signupErrors.password && (
                      <p className="mt-1 text-xs font-semibold text-[#C81E68]">
                        {signupErrors.password}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(106,17,203,0.4)] transition-opacity hover:opacity-95"
                  >
                    {t('createAccount')}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleGoogleContinue()}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-[#DFD2F2] bg-white text-sm font-bold text-[#1E1035] transition-colors hover:bg-[#FAF6FF]"
                  >
                    <GoogleOfficialLogo className="h-4 w-4" />
                    <span>Continue with Google</span>
                  </button>
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {authMode === 'forgot' && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="cursor-pointer text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
                  >
                    ← {t('back')}
                  </button>
                  <h1 className="font-display text-xl font-bold text-[#1E1035]">
                    Forgot Password
                  </h1>
                  {forgotSentTo ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                      <p className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Password reset link sent
                      </p>
                      <p className="mt-1">
                        We&apos;ve sent password recovery instructions to{' '}
                        <strong>{forgotSentTo}</strong>.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#2B0B4E]">
                          {t('emailAddress')}
                        </label>
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="mt-1 h-11 w-full rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] px-3.5 text-sm focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                        />
                        {forgotError && (
                          <p className="mt-1 text-xs font-semibold text-[#C81E68]">{forgotError}</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] text-sm font-bold text-white"
                      >
                        {t('submit')}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LOGGED-IN 2-COLUMN DESKTOP ACCOUNT DASHBOARD */
          <div className="grid grid-cols-12 items-start gap-6">
            {/* Left Account Sidebar */}
            <aside className="col-span-4 space-y-4 rounded-2xl border border-[#EFE3FF] bg-white p-5 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)]">
              <div className="flex items-center gap-3.5 border-b border-[#EFE3FF] pb-4">
                <div className="relative">
                  {avatarPreviewUrl ? (
                    <img
                      src={avatarPreviewUrl}
                      alt={customerAccount.fullName}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-[#EBD8FF]"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6A11CB] to-[#FF4D8D] text-base font-extrabold text-white">
                      {getInitials(customerAccount.fullName)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Update profile photo"
                    className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white bg-[#2B0B4E] text-white shadow-xs hover:bg-[#6A11CB]"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="sr-only"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold text-[#1E1035]">
                    {customerAccount.fullName}
                  </p>
                  <p className="truncate text-xs text-[#685782]">
                    {customerAccount.email}
                  </p>
                </div>
              </div>

              <nav aria-label="Account navigation" className="space-y-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-[#FAF5FF] text-[#6A11CB]'
                      : 'text-[#2B0B4E] hover:bg-[#FAF8FC]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <User className="h-4 w-4" />
                    <span>{t('myAccount')}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('edit-profile')}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                    activeTab === 'edit-profile'
                      ? 'bg-[#FAF5FF] text-[#6A11CB]'
                      : 'text-[#2B0B4E] hover:bg-[#FAF8FC]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <PencilLine className="h-4 w-4" />
                    <span>{t('editProfile')}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('language')}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                    activeTab === 'language'
                      ? 'bg-[#FAF5FF] text-[#6A11CB]'
                      : 'text-[#2B0B4E] hover:bg-[#FAF8FC]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-[#6A11CB]" />
                    <span>{t('appLanguage')}</span>
                  </span>
                  <span className="rounded-full bg-[#F3E8FF] px-2 py-0.5 text-[10.5px] font-bold text-[#6A11CB]">
                    {currentLanguageLabel}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('preferences')}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                    activeTab === 'preferences'
                      ? 'bg-[#FAF5FF] text-[#6A11CB]'
                      : 'text-[#2B0B4E] hover:bg-[#FAF8FC]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Settings className="h-4 w-4" />
                    <span>{t('accountSettings')}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                <div className="my-2 h-px bg-[#EFE3FF]" />

                <Link
                  to="/my-orders"
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[#2B0B4E] hover:bg-[#FAF8FC] hover:text-[#6A11CB]"
                >
                  <span className="flex items-center gap-2.5">
                    <Package className="h-4 w-4 text-[#6A11CB]" />
                    <span>{t('myOrders')}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#7A6894]">
                    {myOrdersCount}
                  </span>
                </Link>

                <Link
                  to="/addresses"
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[#2B0B4E] hover:bg-[#FAF8FC] hover:text-[#6A11CB]"
                >
                  <span className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-[#6A11CB]" />
                    <span>{t('savedAddresses')}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#9B8AB4]" />
                </Link>

                <Link
                  to="/wishlist"
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[#2B0B4E] hover:bg-[#FAF8FC] hover:text-[#6A11CB]"
                >
                  <span className="flex items-center gap-2.5">
                    <Heart className="h-4 w-4 text-[#FF4D8D]" />
                    <span>{t('wishlist')}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#7A6894]">
                    {wishlistIds.length}
                  </span>
                </Link>

                <Link
                  to="/contact"
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[#2B0B4E] hover:bg-[#FAF8FC] hover:text-[#6A11CB]"
                >
                  <span className="flex items-center gap-2.5">
                    <Headset className="h-4 w-4 text-[#6A11CB]" />
                    <span>{t('helpSupport')}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#9B8AB4]" />
                </Link>
              </nav>

              <div className="border-t border-[#EFE3FF] pt-3">
                {!confirmLogout ? (
                  <button
                    type="button"
                    onClick={() => setConfirmLogout(true)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#FFD1E5] bg-[#FFF0F6]/70 py-2.5 text-xs font-bold text-[#C81E68] transition-colors hover:bg-[#FFF0F6]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t('signOut')}</span>
                  </button>
                ) : (
                  <div className="space-y-2 rounded-xl border border-[#FFD1E5] bg-[#FFF0F6]/80 p-3 text-center">
                    <p className="text-xs font-bold text-[#9D174D]">
                      {t('signOut')}?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmLogout(false)}
                        className="flex-1 cursor-pointer rounded-lg border border-[#DFD2F2] bg-white py-1.5 text-xs font-bold text-[#2B0B4E]"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmLogout(false);
                          void signOutCustomer();
                        }}
                        className="flex-1 cursor-pointer rounded-lg bg-[#FF4D8D] py-1.5 text-xs font-bold text-white hover:bg-[#E03576]"
                      >
                        {t('signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Right Active Content Panel */}
            <div className="col-span-8 rounded-2xl border border-[#EFE3FF] bg-white p-6 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)]">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-[#1E1035]">
                      Hello, {customerAccount.fullName}
                    </h1>
                    <p className="mt-0.5 text-xs text-[#685782]">
                      Manage your GiftKart profile, saved delivery addresses, wishlist, and order history.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Link
                      to="/my-orders"
                      className="rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] p-4 transition-all hover:border-[#6A11CB]/40"
                    >
                      <Package className="h-5 w-5 text-[#6A11CB]" />
                      <p className="mt-2 font-mono text-2xl font-extrabold text-[#1E1035]">
                        {myOrdersCount}
                      </p>
                      <p className="text-xs font-semibold text-[#685782]">Total Orders</p>
                    </Link>

                    <Link
                      to="/wishlist"
                      className="rounded-xl border border-[#EFE3FF] bg-[#FFF5FA] p-4 transition-all hover:border-[#FF4D8D]/40"
                    >
                      <Heart className="h-5 w-5 text-[#FF4D8D]" />
                      <p className="mt-2 font-mono text-2xl font-extrabold text-[#1E1035]">
                        {wishlistIds.length}
                      </p>
                      <p className="text-xs font-semibold text-[#685782]">Saved Wishlist</p>
                    </Link>

                    <Link
                      to="/addresses"
                      className="rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] p-4 transition-all hover:border-[#6A11CB]/40"
                    >
                      <MapPin className="h-5 w-5 text-[#6A11CB]" />
                      <p className="mt-2 text-sm font-extrabold text-[#1E1035]">
                        Addresses
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#685782]">
                        Manage delivery details →
                      </p>
                    </Link>
                  </div>

                  <div className="rounded-xl border border-[#EFE3FF] bg-[#FCFAFF] p-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-extrabold text-[#1E1035]">
                        Account Details
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab('edit-profile')}
                        className="cursor-pointer text-xs font-bold text-[#6A11CB] hover:underline"
                      >
                        Edit Profile
                      </button>
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <dt className="text-[#7A6894]">Full Name</dt>
                        <dd className="mt-0.5 font-bold text-[#1E1035]">
                          {customerAccount.fullName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#7A6894]">Email</dt>
                        <dd className="mt-0.5 truncate font-bold text-[#1E1035]">
                          {customerAccount.email}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#7A6894]">Phone</dt>
                        <dd className="mt-0.5 font-mono font-bold text-[#1E1035]">
                          {customerAccount.phone || 'Not added'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {activeTab === 'edit-profile' && (
                <form onSubmit={(e) => void handleSaveProfile(e)} className="space-y-4">
                  <div>
                    <h1 className="font-display text-xl font-bold text-[#1E1035]">
                      Edit Profile
                    </h1>
                    <p className="mt-0.5 text-xs text-[#685782]">
                      Update your name, email address, and contact mobile number.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-[#2B0B4E]">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2B0B4E]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2B0B4E]">
                        Mobile Number
                      </label>
                      <div className="relative mt-1">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C75A8]" />
                        <input
                          type="tel"
                          maxLength={10}
                          value={editPhone}
                          onChange={(e) =>
                            setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                          }
                          className="h-10 w-full rounded-xl border border-[#DFD2F2] bg-white pl-9 pr-3.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {profileSavedNotice && (
                    <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <Check className="h-4 w-4" />
                      Profile changes saved.
                    </p>
                  )}

                  <div className="pt-1">
                    <Button type="submit" variant="primary" size="md">
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-4">
                  <div>
                    <h1 className="font-display text-xl font-bold text-[#1E1035]">
                      Notifications &amp; Preferences
                    </h1>
                    <p className="mt-0.5 text-xs text-[#685782]">
                      Control how GiftKart keeps you informed about orders and offers.
                    </p>
                  </div>

                  <div className="divide-y divide-[#EFE3FF] rounded-xl border border-[#EFE3FF]">
                    {[
                      {
                        label: 'Order & Delivery Updates',
                        desc: 'Receive live updates when your order moves from Placed to Shipped and Delivered.',
                        checked: orderUpdatesOn,
                        onToggle: () => setOrderUpdatesOn((v) => !v),
                      },
                      {
                        label: 'WhatsApp Customization Updates',
                        desc: 'Allow our studio team to confirm custom photo prints on WhatsApp.',
                        checked: whatsappUpdatesOn,
                        onToggle: () => setWhatsappUpdatesOn((v) => !v),
                      },
                      {
                        label: 'Festive Deals & New Gift Arrivals',
                        desc: 'Stay updated on seasonal coupons and new personalized collections.',
                        checked: offersOn,
                        onToggle: () => setOffersOn((v) => !v),
                      },
                    ].map((pref) => (
                      <label
                        key={pref.label}
                        className="flex cursor-pointer items-center justify-between gap-4 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#6A11CB]" />
                          <div>
                            <p className="text-sm font-bold text-[#1E1035]">
                              {pref.label}
                            </p>
                            <p className="text-xs text-[#685782]">{pref.desc}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={pref.checked}
                          onChange={pref.onToggle}
                          className="h-4 w-4 shrink-0 accent-[#6A11CB]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'language' && (
                <div className="space-y-4">
                  <LanguageSelector />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const ORDER_FILTER_TABS: Array<'All' | CustomerOrderDisplayStatus> = [
  'All',
  'Order Placed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const PROGRESS_STAGES = ['Order Placed', 'Processing', 'Shipped', 'Delivered'] as const;

export function MyOrdersPage() {
  const { customerAccount, isAuthReady } = useAuth();
  const { data: orders } = useCustomerOrders(
    customerAccount?.id,
    customerAccount?.email
  );
  const { data: products } = useProducts();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState<'All' | CustomerOrderDisplayStatus>(
    'All'
  );
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const customerOrders = useMemo(() => {
    if (!customerAccount) return [];
    return orders;
  }, [orders, customerAccount]);

  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { All: customerOrders.length };
    for (const order of customerOrders) {
      const label = getCustomerOrderStatusLabel(order.fulfillmentStatus);
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return counts;
  }, [customerOrders]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'All') return customerOrders;
    return customerOrders.filter(
      (order) => getCustomerOrderStatusLabel(order.fulfillmentStatus) === activeFilter
    );
  }, [customerOrders, activeFilter]);

  async function handleConfirmCancel(order: DemoOrder) {
    if (!canCustomerCancelOrder(order.fulfillmentStatus) || cancellingId) return;
    setCancellingId(order.id);
    setCancelError(null);
    try {
      await services.orders.cancelOrderByCustomer(order.id);
      setConfirmCancelId(null);
    } catch (err) {
      setCancelError(
        err instanceof Error
          ? err.message
          : 'Cancellation is unavailable once processing has started.'
      );
    } finally {
      setCancellingId(null);
    }
  }

  function handleReorder(order: DemoOrder) {
    for (const line of order.items) {
      const matched = products.find((p) => p.id === line.productId);
      if (matched && matched.stockCount > 0) {
        addToCart(matched, {
          quantity: line.quantity,
          selectedVariants: line.selectedVariants,
          personalizationDetails: line.personalizationDetails,
        });
      }
    }
    navigate('/cart');
  }

  return (
    <>
      {/* Normal Mobile (< 900px): Premium Mobile Orders Page UI */}
      <div className="-mx-3.5 -my-4 sm:-mx-6 sm:-my-5 lg:hidden">
        <MobileOrdersPage />
      </div>

      {/* Desktop & Laptop (>= 900px): Full Feature Parity with Mobile Orders */}
      <div className="mx-auto hidden max-w-5xl lg:block">
        {!isAuthReady ? (
          <div className="h-72 animate-pulse rounded-2xl bg-[#FAF5FF]" />
        ) : !customerAccount ? (
          /* LOGGED-OUT STATE — Matches Mobile Illustration + 3 Highlights */
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#EFE3FF] bg-white px-10 py-10 text-center shadow-[0_12px_36px_-18px_rgba(106,17,203,0.16)]">
            <img
              src={DESKTOP_ORDERS_LOGGED_OUT_ILLUSTRATION}
              alt="GiftKart Orders Illustration"
              className="mx-auto h-44 w-auto object-contain drop-shadow-[0_10px_22px_rgba(106,17,203,0.14)]"
            />
            <h1 className="mt-4 font-display text-2xl font-bold text-[#1E1035]">
              Track &amp; Manage Your Orders
            </h1>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-[#594A6B]">
              Sign in to view your GiftKart order history, check live status progress, and manage deliveries.
            </p>

            <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2.5">
              <Link
                to="/account"
                state={{ from: '/my-orders' }}
                className="flex h-11 w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(106,17,203,0.4)] hover:opacity-95"
              >
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Login / Sign In</span>
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/account"
                state={{ from: '/my-orders', mode: 'signup' }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#DFD2F2] bg-[#FAF6FF] px-5 text-sm font-bold text-[#6A11CB] hover:bg-[#F2E7FF]"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create New Account</span>
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#EFE3FF] pt-6 text-left">
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FAF5FF] text-[#6A11CB]">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1E1035]">Live Status</p>
                  <p className="text-[11px] text-[#685782]">
                    Follow Placed, Processing &amp; Shipped updates.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FAF5FF] text-[#6A11CB]">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1E1035]">Easy Returns</p>
                  <p className="text-[11px] text-[#685782]">
                    7-day return on standard non-customized items.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FAF5FF] text-[#6A11CB]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1E1035]">Order Support</p>
                  <p className="text-[11px] text-[#685782]">
                    Direct WhatsApp support whenever you need help.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LOGGED-IN ORDERS DASHBOARD */
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EFE3FF] pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#1E1035]">
                  {t('myOrders')}
                </h1>
                <p className="mt-0.5 text-[13px] text-[#685782]">
                  {t('noOrdersDesc')}
                </p>
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFD2F2] bg-[#FAF6FF] px-3.5 py-2 text-xs font-bold text-[#6A11CB] hover:bg-[#F1E4FF]"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{t('continueShopping')}</span>
              </Link>
            </div>

            {/* Status Filter Tabs */}
            <div
              role="tablist"
              aria-label="Filter orders by status"
              className="flex flex-wrap items-center gap-2 border-b border-[#EFE3FF] pb-3"
            >
              {ORDER_FILTER_TABS.map((tab) => {
                const active = activeFilter === tab;
                const count = countsByStatus[tab] ?? 0;
                const tabLabel =
                  tab === 'All'
                    ? t('allOrders')
                    : tab === 'Order Placed'
                      ? t('statusPending')
                      : tab === 'Processing'
                        ? t('statusConfirmed')
                        : tab === 'Shipped'
                          ? t('statusShipped')
                          : tab === 'Delivered'
                            ? t('statusDelivered')
                            : t('statusCancelled');
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveFilter(tab)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                      active
                        ? 'bg-[#6A11CB] text-white'
                        : 'bg-[#FAF6FF] text-[#4B3963] hover:bg-[#F1E4FF] hover:text-[#6A11CB]'
                    }`}
                  >
                    <span>{tabLabel}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-white text-[#6A11CB]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {cancelError && (
              <div className="rounded-xl border border-[#FFD1E5] bg-[#FFF0F6] px-4 py-2.5 text-xs font-semibold text-[#C81E68]">
                {cancelError}
              </div>
            )}

            {filteredOrders.length === 0 ? (
              <EmptyState
                title={t('noOrdersYet')}
                description={t('noOrdersDesc')}
                icon={<Package className="h-5 w-5" />}
                action={
                  activeFilter === 'All' ? (
                    <Link to="/shop">
                      <Button size="sm">{t('shopNow')}</Button>
                    </Link>
                  ) : (
                    <Button size="sm" onClick={() => setActiveFilter('All')}>
                      {t('allOrders')}
                    </Button>
                  )
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusLabel = getCustomerOrderStatusLabel(
                    order.fulfillmentStatus
                  );
                  const exactStatusLabel = getStatusDisplayLabel(order.fulfillmentStatus);
                  const badgeClass = getOrderBadgeClasses(order.fulfillmentStatus);
                  const paymentStatus = normalizePaymentStatus(order);
                  const stepIdx = getOrderTimelineStepIndex(order.fulfillmentStatus);
                  const cancellable = canCustomerCancelOrder(order.fulfillmentStatus);
                  const primaryItem = order.items[0];
                  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <article
                      key={order.id}
                      className="overflow-hidden rounded-2xl border border-[#EFE3FF] bg-white shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)]"
                    >
                      {/* Top Metadata Row */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F3EAFF] bg-[#FCFAFF] px-5 py-3 text-xs">
                        <div className="flex flex-wrap items-center gap-6">
                          <div>
                            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6894]">
                              Order ID
                            </p>
                            <p className="font-mono font-extrabold text-[#6A11CB]">
                              {order.orderNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6894]">
                              Order Date
                            </p>
                            <p className="font-semibold text-[#1E1035]">
                              {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6894]">
                              Payment Method
                            </p>
                            <p className="font-bold text-[#1E1035]">
                              {order.paymentMethod || 'Cash on Delivery (COD)'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6894]">
                              Total
                            </p>
                            <p className="font-mono font-extrabold tabular-nums text-[#1E1035]">
                              {formatInr(order.grandTotalInr)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getPaymentBadgeClasses(
                              paymentStatus
                            )}`}
                          >
                            {paymentStatus}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${badgeClass}`}
                          >
                            {exactStatusLabel}
                          </span>
                        </div>
                      </div>

                      {/* Body: Product Preview + 4-Step Live Progress Stepper */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-5">
                          <div className="flex items-start gap-4">
                            {primaryItem && (
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#EFE3FF] bg-[#FAF6FF]">
                                <ProductImage
                                  src={primaryItem.imageSnapshot}
                                  alt={primaryItem.productNameSnapshot}
                                  aspectClass="aspect-square"
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-extrabold text-[#1E1035]">
                                {primaryItem?.productNameSnapshot ?? 'GiftKart Order'}
                                {order.items.length > 1 && (
                                  <span className="ml-1.5 text-xs font-semibold text-[#6A11CB]">
                                    +{order.items.length - 1} more{' '}
                                    {order.items.length - 1 === 1 ? 'item' : 'items'}
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 text-xs text-[#685782]">
                                Total Qty: {totalQty} · Delivering to{' '}
                                <span className="font-semibold text-[#2B0B4E]">
                                  {order.customer.fullName}, {order.customer.city} -{' '}
                                  {order.customer.pincode}
                                </span>
                              </p>
                              {order.giftWrap.enabled && (
                                <p className="mt-1 text-xs font-semibold text-[#FF4D8D]">
                                  Includes Gift Wrapping ({order.giftWrap.styleNameSnapshot})
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2.5">
                            {statusLabel === 'Delivered' && (
                              <button
                                type="button"
                                onClick={() => handleReorder(order)}
                                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#DFD2F2] bg-[#FAF6FF] px-3.5 text-xs font-bold text-[#6A11CB] hover:bg-[#F1E4FF]"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Reorder</span>
                              </button>
                            )}
                            <Link
                              to={`/order/${order.orderNumber}`}
                              className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#DFD2F2] bg-white px-3.5 text-xs font-bold text-[#1E1035] transition-colors hover:border-[#6A11CB] hover:text-[#6A11CB]"
                            >
                              <span>View Order Details</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>

                        {/* 4-Step Live Horizontal Progress Stepper */}
                        {statusLabel !== 'Cancelled' ? (
                          <div className="mt-5 border-t border-[#F3EAFF] pt-4">
                            <ol className="grid grid-cols-4 gap-2">
                              {PROGRESS_STAGES.map((stage, idx) => {
                                const done = stepIdx >= idx;
                                return (
                                  <li key={stage} className="flex items-center gap-2">
                                    <span
                                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                        done
                                          ? 'bg-[#6A11CB] text-white'
                                          : 'border border-[#DFD2F2] bg-[#FAF8FC] text-[#9B8AB4]'
                                      }`}
                                    >
                                      {done ? (
                                        <Check className="h-3.5 w-3.5 stroke-[2.8]" />
                                      ) : (
                                        idx + 1
                                      )}
                                    </span>
                                    <span
                                      className={`text-xs font-bold ${
                                        done ? 'text-[#1E1035]' : 'text-[#9B8AB4]'
                                      }`}
                                    >
                                      {stage}
                                    </span>
                                    {idx < PROGRESS_STAGES.length - 1 && (
                                      <span
                                        className={`h-0.5 flex-1 rounded-full ${
                                          stepIdx > idx ? 'bg-[#6A11CB]' : 'bg-[#EFE3FF]'
                                        }`}
                                      />
                                    )}
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#FFD1E5] bg-[#FFF0F6]/80 px-3.5 py-2 text-xs font-semibold text-[#C81E68]">
                            <XCircle className="h-4 w-4 shrink-0" />
                            <span>{t('orderCancelled')}</span>
                          </div>
                        )}

                        {/* Strict Pre-Processing Cancellation Row */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3EAFF] pt-3.5 text-xs">
                          {cancellable ? (
                            confirmCancelId === order.id ? (
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-bold text-[#9D174D]">
                                  {t('cancelOrder')}?
                                </span>
                                <button
                                  type="button"
                                  disabled={cancellingId === order.id}
                                  onClick={() => void handleConfirmCancel(order)}
                                  className="cursor-pointer rounded-lg bg-[#FF4D8D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#E03576] disabled:opacity-50"
                                >
                                  {cancellingId === order.id
                                    ? t('loading')
                                    : t('cancelOrder')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelId(null)}
                                  className="cursor-pointer rounded-lg border border-[#DFD2F2] bg-white px-3 py-1.5 text-xs font-bold text-[#2B0B4E]"
                                >
                                  {t('cancel')}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelId(order.id)}
                                  className="cursor-pointer rounded-lg border border-[#FFD1E5] bg-[#FFF0F6]/70 px-3 py-1.5 text-xs font-bold text-[#C81E68] transition-colors hover:bg-[#FFF0F6]"
                                >
                                  {t('cancelOrder')}
                                </button>
                                <span className="text-[11px] text-[#7A6894]">
                                  Cancellation is allowed only before processing starts.
                                </span>
                              </div>
                            )
                          ) : statusLabel === 'Processing' ||
                            statusLabel === 'Shipped' ? (
                            <span className="text-xs font-medium text-[#685782]">
                              Cancellation is unavailable once processing has started.
                            </span>
                          ) : (
                            <span />
                          )}

                          <Link
                            to="/contact"
                            className="font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
                          >
                            {t('needHelp')}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
