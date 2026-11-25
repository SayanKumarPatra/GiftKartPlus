import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Headset,
  Heart,
  Info,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Package,
  PencilLine,
  Phone,
  Send,
  Settings,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BrandLogo } from '../ui/BrandLogo';

const SIGNUP_ILLUSTRATION =
  '/assets/aistudio/3D_Purple_Clipboard_Registration_Icon_30307bae.png';
const LOGIN_ILLUSTRATION =
  '/assets/aistudio/Vibrant_Purple_Shopping_Bag_Scene_2fb63564.png';
const FORGOT_ILLUSTRATION =
  '/assets/aistudio/Glossy_Purple_Forgot_Password_Envelope_7c26fe9d.png';

type AuthScreenMode = 'login' | 'signup' | 'forgot';
type AccountSubView = 'main' | 'edit-profile' | 'settings' | 'notifications';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleOfficialLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
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

function CompactAuthHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="sticky top-0 z-20 grid h-[50px] grid-cols-[40px_1fr_40px] items-center bg-[#FDF6FF]/92 px-3 backdrop-blur-md">
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EFE2FF] bg-white text-[#2B0B4E] shadow-[0_2px_8px_rgba(106,17,203,0.08)] active:scale-95"
      >
        <ArrowLeft className="h-[18px] w-[18px] stroke-[2.2]" />
      </button>

      <div className="flex items-center justify-center">
        <Link to="/" aria-label="GiftKart Home">
          <BrandLogo size="sm" />
        </Link>
      </div>

      <span className="h-9 w-9" aria-hidden="true" />
    </header>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'GK';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function MobileAccountAuthPages() {
  const { customerAccount, isAuthReady, signInCustomerDemo, signOutCustomer } =
    useAuth();
  const { pushToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const navState = location.state as {
    from?: string;
    mode?: 'login' | 'signup' | 'forgot';
    reason?: string;
  } | null;

  const queryMode = searchParams.get('mode') as AuthScreenMode | null;
  const previewAccount = searchParams.get('view') === 'account';

  const initialMode: AuthScreenMode =
    queryMode === 'signup' ||
    queryMode === 'forgot' ||
    queryMode === 'login'
      ? queryMode
      : navState?.mode === 'signup'
        ? 'signup'
        : navState?.mode === 'forgot'
          ? 'forgot'
          : 'login';

  const [authMode, setAuthMode] = useState<AuthScreenMode>(initialMode);
  const [accountSubView, setAccountSubView] = useState<AccountSubView>('main');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});

  // Forgot Password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSentTo, setForgotSentTo] = useState<string | null>(null);

  // Edit Profile form state (static preview + updates local demo account)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [editName, setEditName] = useState(
    customerAccount?.fullName ?? 'Sayan Kumar'
  );
  const [editEmail, setEditEmail] = useState(
    customerAccount?.email ?? 'sayan.kumar@gmail.com'
  );
  const [editPhone, setEditPhone] = useState(
    customerAccount?.phone ?? ''
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Static preview toggles for Account Settings & Notifications
  const [orderUpdatesOn, setOrderUpdatesOn] = useState(true);
  const [offersOn, setOffersOn] = useState(true);
  const [whatsappUpdatesOn, setWhatsappUpdatesOn] = useState(true);

  useEffect(() => {
    if (queryMode === 'signup' || queryMode === 'login' || queryMode === 'forgot') {
      setAuthMode(queryMode);
    } else if (navState?.mode) {
      setAuthMode(navState.mode);
    }
  }, [queryMode, navState?.mode]);

  useEffect(() => {
    if (customerAccount) {
      setEditName(customerAccount.fullName);
      setEditEmail(customerAccount.email);
      setEditPhone(customerAccount.phone);
    }
  }, [customerAccount]);

  const isLoggedIn = Boolean(customerAccount) || previewAccount;
  const activeProfile = customerAccount ?? {
    fullName: editName || 'Sayan Kumar',
    email: editEmail || 'sayan.kumar@gmail.com',
    phone: editPhone || 'Not added',
    defaultCity: 'Jalchak',
  };

  function handleAuthBack() {
    if (authMode === 'forgot') {
      setAuthMode('login');
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  async function completeAuthSession(input: {
    fullName: string;
    email: string;
    phone: string;
    toastTitle: string;
    toastDescription: string;
  }) {
    await signInCustomerDemo({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      defaultCity: 'Jalchak',
    });

    pushToast({
      title: input.toastTitle,
      description: input.toastDescription,
      variant: 'success',
    });

    const redirectTarget = navState?.from;
    if (redirectTarget && redirectTarget !== '/account') {
      navigate(redirectTarget, { replace: true });
      return;
    }
    setAccountSubView('main');
  }

  async function handleSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: { name?: string; email?: string; password?: string } = {};

    if (!signupName.trim()) {
      errors.name = 'Please enter your full name.';
    }
    if (!signupEmail.trim()) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_PATTERN.test(signupEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!signupPassword.trim()) {
      errors.password = 'Please create a password.';
    } else if (signupPassword.trim().length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) return;

    await completeAuthSession({
      fullName: signupName.trim(),
      email: signupEmail.trim(),
      phone: signupPhone.trim() || 'Not added',
      toastTitle: 'Account Created Successfully',
      toastDescription: 'Welcome to GiftKart! Your account is ready.',
    });
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: { email?: string; password?: string; form?: string } = {};

    if (!loginEmail.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!EMAIL_PATTERN.test(loginEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!loginPassword.trim()) {
      errors.password = 'Please enter your password.';
    } else if (loginPassword.trim().length < 4) {
      errors.password = 'Incorrect password. Please check and try again.';
    }

    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const derivedName = loginEmail
      .trim()
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

    await completeAuthSession({
      fullName: derivedName || 'GiftKart Member',
      email: loginEmail.trim(),
      phone: '',
      toastTitle: 'Welcome Back!',
      toastDescription: 'You have logged in to your GiftKart account.',
    });
  }

  async function handleContinueWithGoogle() {
    await completeAuthSession({
      fullName: 'Sayan Kumar',
      email: 'sayan.kumar@gmail.com',
      phone: '',
      toastTitle: 'Signed In with Google',
      toastDescription: 'Welcome to GiftKart! Showing your account.',
    });
  }

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = forgotEmail.trim();
    if (!trimmed) {
      setForgotError('Please enter your registered email address.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setForgotError('Please enter a valid email address format.');
      return;
    }
    setForgotError('');
    setForgotSentTo(trimmed);
    pushToast({
      title: 'Password Reset Link Sent',
      description: `Check ${trimmed} (including spam folder).`,
      variant: 'success',
    });
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || !EMAIL_PATTERN.test(editEmail.trim())) {
      pushToast({
        title: 'Invalid Profile Details',
        description: 'Please enter a valid full name and email address.',
        variant: 'error',
      });
      return;
    }

    await signInCustomerDemo({
      fullName: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      defaultCity: customerAccount?.defaultCity ?? 'Jalchak',
    });

    pushToast({
      title: 'Profile Updated',
      description: 'Your account details have been saved.',
      variant: 'success',
    });
    setAccountSubView('main');
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleConfirmLogout() {
    await signOutCustomer();
    setShowLogoutDialog(false);
    setAccountSubView('main');
    setAuthMode('login');
    pushToast({
      title: 'Logged Out',
      description: 'You have been signed out of your GiftKart account.',
      variant: 'info',
    });
    if (previewAccount) {
      navigate('/account', { replace: true });
    }
  }

  // Prevent auth flicker on page refresh while existing local session hydrates
  if (!isAuthReady && !previewAccount && !queryMode) {
    return (
      <div className="min-h-[calc(100dvh-132px)] w-full bg-gradient-to-b from-[#FDF5FF] via-[#FAF0FF] to-[#F6EEFF] px-4 py-10">
        <div className="mx-auto h-40 max-w-[350px] animate-pulse rounded-[24px] bg-white/80" />
      </div>
    );
  }

  /* ==========================================================================
   * LOGGED-OUT AUTHENTICATION SCREENS (PAGES 1, 2, 3)
   * Full-screen mobile-only overlay (< 900px) with compact Back Arrow + Logo
   * ======================================================================== */
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-clip bg-gradient-to-b from-[#FDF6FF] via-[#FAF1FF] to-[#F6EEFF] lg:hidden">
        <CompactAuthHeader onBack={handleAuthBack} />

        {/* PAGE 1: CREATE NEW ACCOUNT (SIGN UP) */}
        {authMode === 'signup' && (
          <main className="mx-auto flex w-full max-w-[420px] flex-col items-center px-4 pb-6 pt-1">
            <div className="flex w-full items-center justify-center">
              <img
                src={SIGNUP_ILLUSTRATION}
                alt="Create New Account Illustration"
                className="h-auto w-full max-w-[138px] object-contain mix-blend-multiply min-[390px]:max-w-[156px]"
              />
            </div>

            <h1 className="mt-0.5 text-center text-[21px] font-extrabold tracking-[-0.02em] text-[#2B0B4E] min-[390px]:text-[23px]">
              Create New Account
            </h1>
            <p className="mt-1 max-w-[300px] text-center text-[12px] leading-[1.4] text-[#553F70]">
              Join GiftKart and explore a world of gifts for every occasion.
            </p>

            <form
              onSubmit={(e) => void handleSignUpSubmit(e)}
              noValidate
              className="mt-3 w-full space-y-2"
            >
              {/* Full Name */}
              <div>
                <div
                  className={`flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 shadow-[0_2px_10px_rgba(106,17,203,0.05)] focus-within:border-[#6A11CB]/60 focus-within:ring-2 focus-within:ring-[#6A11CB]/15 ${
                    signupErrors.name ? 'border-[#FF4D8D]' : 'border-[#EDE0FF]'
                  }`}
                >
                  <User className="h-[19px] w-[19px] shrink-0 text-[#4B148C] stroke-[1.9]" />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-signup-name"
                      className="block text-[11px] font-bold text-[#2B0B4E]"
                    >
                      Full Name <span className="text-[#FF4D8D]">*</span>
                    </label>
                    <input
                      id="gk-signup-name"
                      type="text"
                      autoComplete="name"
                      value={signupName}
                      onChange={(e) => {
                        setSignupName(e.target.value);
                        if (signupErrors.name)
                          setSignupErrors((p) => ({ ...p, name: undefined }));
                      }}
                      placeholder="Enter your full name"
                      className="mt-0.5 w-full bg-transparent text-[13.5px] font-medium text-[#2B0B4E] placeholder:text-[#8876A0] focus:outline-none"
                    />
                  </div>
                </div>
                {signupErrors.name && (
                  <p className="mt-1 pl-2 text-[11.5px] font-semibold text-[#E11D74]">
                    {signupErrors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <div
                  className={`flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 shadow-[0_2px_10px_rgba(106,17,203,0.05)] focus-within:border-[#6A11CB]/60 focus-within:ring-2 focus-within:ring-[#6A11CB]/15 ${
                    signupErrors.email ? 'border-[#FF4D8D]' : 'border-[#EDE0FF]'
                  }`}
                >
                  <Mail className="h-[19px] w-[19px] shrink-0 text-[#4B148C] stroke-[1.9]" />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-signup-email"
                      className="block text-[11px] font-bold text-[#2B0B4E]"
                    >
                      Email Address <span className="text-[#FF4D8D]">*</span>
                    </label>
                    <input
                      id="gk-signup-email"
                      type="email"
                      autoComplete="email"
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        if (signupErrors.email)
                          setSignupErrors((p) => ({ ...p, email: undefined }));
                      }}
                      placeholder="Enter your email address"
                      className="mt-0.5 w-full bg-transparent text-[13.5px] font-medium text-[#2B0B4E] placeholder:text-[#8876A0] focus:outline-none"
                    />
                  </div>
                </div>
                {signupErrors.email && (
                  <p className="mt-1 pl-2 text-[11.5px] font-semibold text-[#E11D74]">
                    {signupErrors.email}
                  </p>
                )}
              </div>

              {/* Mobile Number (Optional — No OTP) */}
              <div>
                <div className="flex items-center gap-2.5 rounded-xl border border-[#EDE0FF] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(106,17,203,0.05)] focus-within:border-[#6A11CB]/60 focus-within:ring-2 focus-within:ring-[#6A11CB]/15">
                  <Phone className="h-[18px] w-[18px] shrink-0 text-[#4B148C] stroke-[1.9]" />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-signup-phone"
                      className="block text-[11px] font-bold text-[#2B0B4E]"
                    >
                      Mobile Number{' '}
                      <span className="font-semibold text-[#7E6B95]">
                        (Optional)
                      </span>
                    </label>
                    <input
                      id="gk-signup-phone"
                      type="tel"
                      autoComplete="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="Enter your mobile number"
                      className="mt-0.5 w-full bg-transparent text-[13px] font-medium text-[#2B0B4E] placeholder:text-[#8876A0] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <div
                  className={`flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 shadow-[0_2px_10px_rgba(106,17,203,0.05)] focus-within:border-[#6A11CB]/60 focus-within:ring-2 focus-within:ring-[#6A11CB]/15 ${
                    signupErrors.password
                      ? 'border-[#FF4D8D]'
                      : 'border-[#EDE0FF]'
                  }`}
                >
                  <Lock className="h-[19px] w-[19px] shrink-0 text-[#4B148C] stroke-[1.9]" />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-signup-password"
                      className="block text-[11px] font-bold text-[#2B0B4E]"
                    >
                      Password <span className="text-[#FF4D8D]">*</span>
                    </label>
                    <input
                      id="gk-signup-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        if (signupErrors.password)
                          setSignupErrors((p) => ({
                            ...p,
                            password: undefined,
                          }));
                      }}
                      placeholder="Create a strong password"
                      className="mt-0.5 w-full bg-transparent text-[13.5px] font-medium text-[#2B0B4E] placeholder:text-[#8876A0] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                    aria-label={
                      showSignupPassword ? 'Hide password' : 'Show password'
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6E5B85] active:bg-[#F5ECFF]"
                  >
                    {showSignupPassword ? (
                      <Eye className="h-[18px] w-[18px]" />
                    ) : (
                      <EyeOff className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
                {signupErrors.password && (
                  <p className="mt-1 pl-2 text-[11.5px] font-semibold text-[#E11D74]">
                    {signupErrors.password}
                  </p>
                )}
              </div>

              {/* Primary Button: Create Account */}
              <button
                type="submit"
                className="mt-1.5 flex min-h-[46px] w-full items-center justify-between rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] px-5 text-[14.5px] font-bold text-white shadow-[0_8px_22px_rgba(106,17,203,0.28)] transition-transform active:scale-[0.985]"
              >
                <span className="w-5 shrink-0" aria-hidden="true" />
                <span className="flex items-center gap-2">
                  <UserPlus className="h-[18px] w-[18px] shrink-0 stroke-[2.1]" />
                  <span>Create Account</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 stroke-[2.3]" />
              </button>
            </form>

            {/* OR Divider */}
            <div className="my-3 flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-[#E5D4FA]" />
              <span className="text-[11px] font-bold tracking-wider text-[#7A6693]">
                OR
              </span>
              <span className="h-px flex-1 bg-[#E5D4FA]" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => void handleContinueWithGoogle()}
              className="flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-full border border-[#EAE0F8] bg-white px-5 text-[14px] font-bold text-[#2B0B4E] shadow-[0_4px_14px_rgba(106,17,203,0.08)] transition-transform active:scale-[0.985]"
            >
              <GoogleOfficialLogo className="h-[18px] w-[18px] shrink-0" />
              <span>Continue with Google</span>
            </button>

            {/* Existing Account Switch */}
            <p className="mt-3.5 text-center text-[12.5px] font-medium text-[#523D6D]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setSignupErrors({});
                  setAuthMode('login');
                }}
                className="font-extrabold text-[#6A11CB] active:text-[#FF4D8D]"
              >
                Login Now
              </button>
            </p>
          </main>
        )}

        {/* PAGE 2: LOGIN */}
        {authMode === 'login' && (
          <main className="mx-auto flex w-full max-w-[420px] flex-col items-center px-4 pb-6 pt-1">
            <div className="flex w-full items-center justify-center">
              <img
                src={LOGIN_ILLUSTRATION}
                alt="Login to GiftKart Illustration"
                className="h-auto w-full max-w-[162px] object-contain mix-blend-multiply min-[390px]:max-w-[180px]"
              />
            </div>

            <h1 className="mt-1 text-center text-[21px] font-extrabold tracking-[-0.02em] text-[#2B0B4E] min-[390px]:text-[23px]">
              Login to Your Account
            </h1>
            <p className="mt-1 max-w-[300px] text-center text-[12.5px] leading-[1.4] text-[#553F70]">
              Welcome back! Log in to continue shopping on GiftKart.
            </p>

            {navState?.reason === 'wishlist' && (
              <div className="mt-2.5 w-full rounded-xl border border-[#EBD8FF] bg-white/90 px-3 py-2 text-center text-[11.5px] font-semibold text-[#6A11CB]">
                Please log in to save gifts in your Wishlist.
              </div>
            )}

            <form
              onSubmit={(e) => void handleLoginSubmit(e)}
              noValidate
              className="mt-3.5 w-full space-y-2.5"
            >
              {/* Email Address */}
              <div>
                <div
                  className={`flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 shadow-[0_2px_10px_rgba(106,17,203,0.05)] focus-within:border-[#6A11CB]/60 focus-within:ring-2 focus-within:ring-[#6A11CB]/15 ${
                    loginErrors.email ? 'border-[#FF4D8D]' : 'border-[#EDE0FF]'
                  }`}
                >
                  <Mail className="h-[19px] w-[19px] shrink-0 text-[#4B148C] stroke-[1.9]" />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-login-email"
                      className="block text-[11px] font-bold text-[#2B0B4E]"
                    >
                      Email Address
                    </label>
                    <input
                      id="gk-login-email"
                      type="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (loginErrors.email)
                          setLoginErrors((p) => ({ ...p, email: undefined }));
                      }}
                      placeholder="Enter your email address"
                      className="mt-0.5 w-full bg-transparent text-[13.5px] font-medium text-[#2B0B4E] placeholder:text-[#8876A0] focus:outline-none"
                    />
                  </div>
                </div>
                {loginErrors.email && (
                  <p className="mt-1 pl-2 text-[11.5px] font-semibold text-[#E11D74]">
                    {loginErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div
                  className={`flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 shadow-[0_2px_10px_rgba(106,17,203,0.05)] focus-within:border-[#6A11CB]/60 focus-within:ring-2 focus-within:ring-[#6A11CB]/15 ${
                    loginErrors.password
                      ? 'border-[#FF4D8D]'
                      : 'border-[#EDE0FF]'
                  }`}
                >
                  <Lock className="h-[19px] w-[19px] shrink-0 text-[#4B148C] stroke-[1.9]" />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-login-password"
                      className="block text-[11px] font-bold text-[#2B0B4E]"
                    >
                      Password
                    </label>
                    <input
                      id="gk-login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginErrors.password)
                          setLoginErrors((p) => ({
                            ...p,
                            password: undefined,
                          }));
                      }}
                      placeholder="Enter your password"
                      className="mt-0.5 w-full bg-transparent text-[13.5px] font-medium text-[#2B0B4E] placeholder:text-[#8876A0] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={
                      showLoginPassword ? 'Hide password' : 'Show password'
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6E5B85] active:bg-[#F5ECFF]"
                  >
                    {showLoginPassword ? (
                      <Eye className="h-[18px] w-[18px]" />
                    ) : (
                      <EyeOff className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="mt-1 pl-2 text-[11.5px] font-semibold text-[#E11D74]">
                    {loginErrors.password}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setForgotError('');
                    setForgotSentTo(null);
                    setAuthMode('forgot');
                  }}
                  className="text-[12.5px] font-bold text-[#6A11CB] active:text-[#FF4D8D]"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Primary Button: Login / Sign In */}
              <button
                type="submit"
                className="flex min-h-[46px] w-full items-center justify-between rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] px-5 text-[14.5px] font-bold text-white shadow-[0_8px_22px_rgba(106,17,203,0.28)] transition-transform active:scale-[0.985]"
              >
                <span className="w-5 shrink-0" aria-hidden="true" />
                <span className="flex items-center gap-2">
                  <LogIn className="h-[18px] w-[18px] shrink-0 stroke-[2.1]" />
                  <span>Login / Sign In</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 stroke-[2.3]" />
              </button>
            </form>

            {/* OR Divider */}
            <div className="my-3 flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-[#E5D4FA]" />
              <span className="text-[11px] font-bold tracking-wider text-[#7A6693]">
                OR
              </span>
              <span className="h-px flex-1 bg-[#E5D4FA]" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => void handleContinueWithGoogle()}
              className="flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-full border border-[#EAE0F8] bg-white px-5 text-[14px] font-bold text-[#2B0B4E] shadow-[0_4px_14px_rgba(106,17,203,0.08)] transition-transform active:scale-[0.985]"
            >
              <GoogleOfficialLogo className="h-[18px] w-[18px] shrink-0" />
              <span>Continue with Google</span>
            </button>

            {/* Registration Link */}
            <p className="mt-3.5 text-center text-[12.5px] font-medium text-[#523D6D]">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setLoginErrors({});
                  setAuthMode('signup');
                }}
                className="font-extrabold text-[#6A11CB] active:text-[#FF4D8D]"
              >
                Create Account
              </button>
            </p>
          </main>
        )}

        {/* PAGE 3: FORGOT PASSWORD */}
        {authMode === 'forgot' && (
          <main className="mx-auto flex w-full max-w-[420px] flex-col items-center px-4 pb-10 pt-3">
            <div className="flex w-full items-center justify-center">
              <img
                src={FORGOT_ILLUSTRATION}
                alt="Forgot Password Illustration"
                className="h-auto w-full max-w-[205px] object-contain mix-blend-multiply min-[390px]:max-w-[228px]"
              />
            </div>

            <h1 className="mt-2.5 text-center text-[24px] font-extrabold tracking-[-0.02em] text-[#2B0B4E] min-[390px]:text-[26px]">
              Forgot Password?
            </h1>
            <p className="mt-2 max-w-[310px] text-center text-[13px] leading-[1.48] text-[#553F70]">
              No worries! Enter your registered email address and we&apos;ll
              send you a password reset link.
            </p>

            <form
              onSubmit={handleForgotSubmit}
              noValidate
              className="mt-5 w-full space-y-3.5"
            >
              <div>
                <div
                  className={`flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-2.5 shadow-[0_3px_12px_rgba(106,17,203,0.06)] focus-within:border-[#6A11CB]/60 focus-within:ring-2 focus-within:ring-[#6A11CB]/15 ${
                    forgotError ? 'border-[#FF4D8D]' : 'border-[#EDE0FF]'
                  }`}
                >
                  <Mail className="h-[19px] w-[19px] shrink-0 text-[#4B148C] stroke-[1.9]" />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-forgot-email"
                      className="block text-[11px] font-bold text-[#2B0B4E]"
                    >
                      Email Address <span className="text-[#FF4D8D]">*</span>
                    </label>
                    <input
                      id="gk-forgot-email"
                      type="email"
                      autoComplete="email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotError) setForgotError('');
                      }}
                      placeholder="Enter your registered email address"
                      className="mt-0.5 w-full bg-transparent text-[13.5px] font-medium text-[#2B0B4E] placeholder:text-[#8876A0] focus:outline-none"
                    />
                  </div>
                </div>
                {forgotError && (
                  <p className="mt-1 pl-2 text-[11.5px] font-semibold text-[#E11D74]">
                    {forgotError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="flex min-h-[50px] w-full items-center justify-between rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] px-5 text-[15px] font-bold text-white shadow-[0_8px_22px_rgba(106,17,203,0.28)] transition-transform active:scale-[0.985]"
              >
                <span className="w-5 shrink-0" aria-hidden="true" />
                <span className="flex items-center gap-2.5">
                  <Send className="h-[18px] w-[18px] shrink-0 stroke-[2.1]" />
                  <span>Send Reset Link</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 stroke-[2.3]" />
              </button>
            </form>

            {/* Success Confirmation Banner */}
            {forgotSentTo && (
              <div className="mt-4 flex w-full items-start gap-2.5 rounded-2xl border border-[#C6EED3] bg-[#EEFAF2] px-3.5 py-3 text-left">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#15803D]" />
                <div className="min-w-0 flex-1 text-[12px] leading-[1.4] text-[#14532D]">
                  <p className="font-bold">Reset link sent!</p>
                  <p className="mt-0.5">
                    We sent password reset instructions to{' '}
                    <span className="font-semibold break-all">
                      {forgotSentTo}
                    </span>
                    .
                  </p>
                </div>
              </div>
            )}

            {/* Information Card */}
            <div className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#E9D8FF] bg-[#F5EBFF]/90 px-4 py-3.5 text-left shadow-[0_3px_10px_rgba(106,17,203,0.05)]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#6A11CB] shadow-xs">
                <Info className="h-[18px] w-[18px] stroke-[2.2]" />
              </div>
              <p className="text-[12px] font-medium leading-[1.45] text-[#3B1E5C]">
                Check your email inbox (and spam folder) for the password reset
                link.
              </p>
            </div>

            {/* Return to Login */}
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-extrabold text-[#6A11CB] active:text-[#FF4D8D]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </button>
          </main>
        )}
      </div>
    );
  }

  /* ==========================================================================
   * PAGE 4: MY ACCOUNT (LOGGED-IN USER ONLY)
   * Renders inside StorefrontLayout so MobileBottomNav stays visible & Active
   * ======================================================================== */
  return (
    <div className="min-h-[calc(100dvh-132px)] w-full overflow-x-clip bg-gradient-to-b from-[#FCE9F6] via-[#FAF0FF] to-[#F6EEFF] px-3 pb-4 pt-2">
      {/* SUB-VIEW: EDIT PROFILE */}
      {accountSubView === 'edit-profile' && (
        <section aria-label="Edit Profile" className="mx-auto max-w-[420px]">
          <button
            type="button"
            onClick={() => setAccountSubView('main')}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#6A11CB] shadow-[0_2px_8px_rgba(106,17,203,0.08)]"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[2.4]" />
            <span>Back to My Account</span>
          </button>

          <div className="rounded-[24px] border border-[#EFE2FF] bg-white p-5 shadow-[0_8px_24px_rgba(106,17,203,0.08)]">
            <h1 className="text-[19px] font-extrabold text-[#2B0B4E]">
              Edit Profile
            </h1>
            <p className="mt-0.5 text-[12px] text-[#6A5684]">
              Update your personal details and profile picture.
            </p>

            {/* Profile Photo Editor */}
            <div className="mt-4 flex flex-col items-center">
              <div className="relative">
                <div className="flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full border-[3px] border-[#EBD8FF] bg-gradient-to-br from-[#6A11CB] to-[#FF4D8D] text-[24px] font-extrabold text-white shadow-md">
                  {avatarPreviewUrl ? (
                    <img
                      src={avatarPreviewUrl}
                      alt={editName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(editName)}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#6A11CB] text-white shadow-sm active:scale-95"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-[12px] font-bold text-[#6A11CB]"
              >
                Change Profile Photo
              </button>
            </div>

            <form
              onSubmit={(e) => void handleSaveProfile(e)}
              className="mt-4 space-y-3"
            >
              <div className="rounded-2xl border border-[#EDE0FF] bg-[#FCFAFF] px-3.5 py-2.5">
                <label
                  htmlFor="gk-edit-name"
                  className="block text-[11px] font-bold text-[#2B0B4E]"
                >
                  Full Name
                </label>
                <input
                  id="gk-edit-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-0.5 w-full bg-transparent text-[13.5px] font-semibold text-[#2B0B4E] focus:outline-none"
                />
              </div>

              <div className="rounded-2xl border border-[#EDE0FF] bg-[#FCFAFF] px-3.5 py-2.5">
                <label
                  htmlFor="gk-edit-email"
                  className="block text-[11px] font-bold text-[#2B0B4E]"
                >
                  Email Address
                </label>
                <input
                  id="gk-edit-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-0.5 w-full bg-transparent text-[13.5px] font-semibold text-[#2B0B4E] focus:outline-none"
                />
                <p className="mt-1 text-[10.5px] text-[#7A6693]">
                  Email verification will be available in a future update.
                </p>
              </div>

              <div className="rounded-2xl border border-[#EDE0FF] bg-[#FCFAFF] px-3.5 py-2.5">
                <label
                  htmlFor="gk-edit-phone"
                  className="block text-[11px] font-bold text-[#2B0B4E]"
                >
                  Mobile Number
                </label>
                <input
                  id="gk-edit-phone"
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Enter your mobile number"
                  className="mt-0.5 w-full bg-transparent text-[13.5px] font-semibold text-[#2B0B4E] placeholder:text-[#8E7AA6] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] text-[14.5px] font-bold text-white shadow-[0_8px_20px_rgba(106,17,203,0.26)] active:scale-[0.985]"
              >
                Save Changes
              </button>
            </form>
          </div>
        </section>
      )}

      {/* SUB-VIEW: ACCOUNT SETTINGS */}
      {accountSubView === 'settings' && (
        <section aria-label="Account Settings" className="mx-auto max-w-[420px]">
          <button
            type="button"
            onClick={() => setAccountSubView('main')}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#6A11CB] shadow-[0_2px_8px_rgba(106,17,203,0.08)]"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[2.4]" />
            <span>Back to My Account</span>
          </button>

          <div className="space-y-3 rounded-[24px] border border-[#EFE2FF] bg-white p-5 shadow-[0_8px_24px_rgba(106,17,203,0.08)]">
            <h1 className="text-[19px] font-extrabold text-[#2B0B4E]">
              Account Settings
            </h1>
            <p className="text-[12px] text-[#6A5684]">
              Manage your account preferences and gift delivery defaults.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between rounded-2xl border border-[#F0E4FF] bg-[#FCFAFF] px-3.5 py-3">
                <div>
                  <p className="text-[13px] font-bold text-[#2B0B4E]">
                    Default Delivery City
                  </p>
                  <p className="text-[11.5px] text-[#6A5684]">
                    Jalchak, West Bengal
                  </p>
                </div>
                <span className="rounded-full bg-[#F3E8FF] px-2.5 py-1 text-[11px] font-bold text-[#6A11CB]">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#F0E4FF] bg-[#FCFAFF] px-3.5 py-3">
                <div>
                  <p className="text-[13px] font-bold text-[#2B0B4E]">
                    WhatsApp Order Alerts
                  </p>
                  <p className="text-[11.5px] text-[#6A5684]">
                    Receive dispatch &amp; gift wrap updates
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={whatsappUpdatesOn}
                  onClick={() => setWhatsappUpdatesOn((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    whatsappUpdatesOn ? 'bg-[#6A11CB]' : 'bg-[#D8CBEB]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                      whatsappUpdatesOn ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SUB-VIEW: NOTIFICATIONS */}
      {accountSubView === 'notifications' && (
        <section aria-label="Notifications" className="mx-auto max-w-[420px]">
          <button
            type="button"
            onClick={() => setAccountSubView('main')}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#6A11CB] shadow-[0_2px_8px_rgba(106,17,203,0.08)]"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[2.4]" />
            <span>Back to My Account</span>
          </button>

          <div className="space-y-3 rounded-[24px] border border-[#EFE2FF] bg-white p-5 shadow-[0_8px_24px_rgba(106,17,203,0.08)]">
            <h1 className="text-[19px] font-extrabold text-[#2B0B4E]">
              Notifications
            </h1>
            <p className="text-[12px] text-[#6A5684]">
              Control order tracking alerts and festive gift offers.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between rounded-2xl border border-[#F0E4FF] bg-[#FCFAFF] px-3.5 py-3">
                <div>
                  <p className="text-[13px] font-bold text-[#2B0B4E]">
                    Order &amp; Delivery Updates
                  </p>
                  <p className="text-[11.5px] text-[#6A5684]">
                    Processing, shipped, and delivered alerts
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={orderUpdatesOn}
                  onClick={() => setOrderUpdatesOn((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    orderUpdatesOn ? 'bg-[#6A11CB]' : 'bg-[#D8CBEB]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                      orderUpdatesOn ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#F0E4FF] bg-[#FCFAFF] px-3.5 py-3">
                <div>
                  <p className="text-[13px] font-bold text-[#2B0B4E]">
                    Special Gift Offers
                  </p>
                  <p className="text-[11.5px] text-[#6A5684]">
                    Festive discounts &amp; personalized deals
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={offersOn}
                  onClick={() => setOffersOn((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    offersOn ? 'bg-[#6A11CB]' : 'bg-[#D8CBEB]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                      offersOn ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MAIN MY ACCOUNT SCREEN */}
      {accountSubView === 'main' && (
        <section
          aria-label="My Account"
          className="mx-auto max-w-[440px] space-y-2"
        >
          {/* Premium Purple-Pink Gradient Profile Header Card */}
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#6A11CB] via-[#9D1FC4] to-[#FF4D8D] p-3 text-white shadow-[0_8px_22px_rgba(106,17,203,0.24)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 blur-xl"
            />
            <div className="relative z-10 flex items-center gap-3">
              {/* Circular Profile Photo */}
              <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-white/95 bg-gradient-to-br from-[#F3E6FF] to-[#FFD6E8] text-[18px] font-extrabold text-[#6A11CB] shadow-md">
                {avatarPreviewUrl ? (
                  <img
                    src={avatarPreviewUrl}
                    alt={activeProfile.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getInitials(activeProfile.fullName)}</span>
                )}
              </div>

              {/* Name, Email & Edit Profile Button */}
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[16.5px] font-extrabold leading-tight text-white min-[390px]:text-[17.5px]">
                  {activeProfile.fullName}
                </h1>
                <p className="mt-0.5 truncate text-[11.5px] font-medium text-white/90">
                  {activeProfile.email}
                </p>

                <button
                  type="button"
                  onClick={() => setAccountSubView('edit-profile')}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#6A11CB] shadow-xs transition-transform active:scale-95"
                >
                  <PencilLine className="h-3 w-3 stroke-[2.2]" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* 7 Account Menu Option Cards (Compact single-screen fit) */}
          <div className="space-y-1.5">
            {/* 1. My Orders */}
            <Link
              to="/my-orders"
              className="flex items-center gap-2.5 rounded-[16px] border border-[#EFE2FF] bg-white px-3 py-2 shadow-[0_3px_10px_rgba(106,17,203,0.05)] transition-transform active:scale-[0.985]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#6A11CB]">
                <Package className="h-[18px] w-[18px] stroke-[1.9]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold leading-tight text-[#2B0B4E]">
                  My Orders
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-[#6C5885]">
                  Track and view your orders.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#6A11CB]/80 stroke-[2.2]" />
            </Link>

            {/* 2. My Wishlist */}
            <Link
              to="/wishlist"
              className="flex items-center gap-2.5 rounded-[16px] border border-[#EFE2FF] bg-white px-3 py-2 shadow-[0_3px_10px_rgba(106,17,203,0.05)] transition-transform active:scale-[0.985]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#6A11CB]">
                <Heart className="h-[18px] w-[18px] stroke-[1.9]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold leading-tight text-[#2B0B4E]">
                  My Wishlist
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-[#6C5885]">
                  Your saved products.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#6A11CB]/80 stroke-[2.2]" />
            </Link>

            {/* 3. Delivery Addresses */}
            <Link
              to="/addresses"
              className="flex items-center gap-2.5 rounded-[16px] border border-[#EFE2FF] bg-white px-3 py-2 shadow-[0_3px_10px_rgba(106,17,203,0.05)] transition-transform active:scale-[0.985]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#6A11CB]">
                <MapPin className="h-[18px] w-[18px] stroke-[1.9]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold leading-tight text-[#2B0B4E]">
                  Delivery Addresses
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-[#6C5885]">
                  Manage your delivery addresses.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#6A11CB]/80 stroke-[2.2]" />
            </Link>

            {/* 4. Account Settings */}
            <button
              type="button"
              onClick={() => setAccountSubView('settings')}
              className="flex w-full items-center gap-2.5 rounded-[16px] border border-[#EFE2FF] bg-white px-3 py-2 text-left shadow-[0_3px_10px_rgba(106,17,203,0.05)] transition-transform active:scale-[0.985]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#6A11CB]">
                <Settings className="h-[18px] w-[18px] stroke-[1.9]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold leading-tight text-[#2B0B4E]">
                  Account Settings
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-[#6C5885]">
                  Update your account and preferences.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#6A11CB]/80 stroke-[2.2]" />
            </button>

            {/* 5. Notifications */}
            <button
              type="button"
              onClick={() => setAccountSubView('notifications')}
              className="flex w-full items-center gap-2.5 rounded-[16px] border border-[#EFE2FF] bg-white px-3 py-2 text-left shadow-[0_3px_10px_rgba(106,17,203,0.05)] transition-transform active:scale-[0.985]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#6A11CB]">
                <Bell className="h-[18px] w-[18px] stroke-[1.9]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold leading-tight text-[#2B0B4E]">
                  Notifications
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-[#6C5885]">
                  Order, offer and important updates.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#6A11CB]/80 stroke-[2.2]" />
            </button>

            {/* 6. Help & Support */}
            <Link
              to="/contact"
              className="flex items-center gap-2.5 rounded-[16px] border border-[#EFE2FF] bg-white px-3 py-2 shadow-[0_3px_10px_rgba(106,17,203,0.05)] transition-transform active:scale-[0.985]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#6A11CB]">
                <Headset className="h-[18px] w-[18px] stroke-[1.9]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold leading-tight text-[#2B0B4E]">
                  Help &amp; Support
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-[#6C5885]">
                  Get help on WhatsApp.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#6A11CB]/80 stroke-[2.2]" />
            </Link>

            {/* 7. Logout (Distinct Soft Pink Accent) */}
            <button
              type="button"
              onClick={() => setShowLogoutDialog(true)}
              className="flex w-full items-center gap-2.5 rounded-[16px] border border-[#FFD6E7] bg-white px-3 py-2 text-left shadow-[0_3px_10px_rgba(255,77,141,0.07)] transition-transform active:scale-[0.985]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F6] text-[#FF4D8D]">
                <LogOut className="h-[18px] w-[18px] stroke-[2]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold leading-tight text-[#E11D74]">
                  Logout
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-[#8C5B76]">
                  Sign out from your account.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#FF4D8D] stroke-[2.2]" />
            </button>
          </div>
        </section>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gk-logout-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1F0838]/45 px-5 backdrop-blur-xs"
          onClick={() => setShowLogoutDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[330px] rounded-[24px] border border-[#EFE2FF] bg-white p-5 text-center shadow-[0_20px_50px_rgba(43,11,78,0.28)]"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0F6] text-[#FF4D8D]">
              <LogOut className="h-6 w-6 stroke-[2]" />
            </div>
            <h2
              id="gk-logout-title"
              className="mt-3 text-[17px] font-extrabold text-[#2B0B4E]"
            >
              Log Out
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#5E4A77]">
              Are you sure you want to log out?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutDialog(false)}
                className="min-h-[44px] rounded-full border border-[#E6D3FF] bg-[#FAF6FF] text-[13.5px] font-bold text-[#2B0B4E] active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmLogout()}
                className="min-h-[44px] rounded-full bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] text-[13.5px] font-bold text-white shadow-[0_6px_16px_rgba(255,77,141,0.28)] active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
