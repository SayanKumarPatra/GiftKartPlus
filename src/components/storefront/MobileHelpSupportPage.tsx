import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  CreditCard,
  MessageCircle,
  Package,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  User,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LOGGED_OUT_HELP_ILLUSTRATION =
  '/assets/aistudio/3D_Headset_Support_Illustration_e1278b5b.png';
const SUPPORT_GIRL_ILLUSTRATION =
  '/assets/aistudio/Cheerful_Customer_Support_Agent_with_Laptop_b3ec24dc.png';

/**
 * Placeholder for GiftKart Official WhatsApp Support number (digits with country code, e.g. "91XXXXXXXXXX").
 * Kept intentionally blank until the official support number is configured.
 */
const GIFTKART_WHATSAPP_SUPPORT_NUMBER = '';

const WHATSAPP_PREFILLED_MESSAGE =
  'Hello GiftKart Support, I need help with an issue.';

interface SupportTopicItem {
  id: string;
  label: string;
  Icon: LucideIcon;
}

const SUPPORT_TOPICS: SupportTopicItem[] = [
  {
    id: 'order-issues',
    label: 'Order Related Issues',
    Icon: ShoppingBag,
  },
  {
    id: 'payment-issues',
    label: 'Payment Issues',
    Icon: CreditCard,
  },
  {
    id: 'delivery-issues',
    label: 'Delivery Issues',
    Icon: Truck,
  },
  {
    id: 'return-refund',
    label: 'Return & Refund',
    Icon: RotateCcw,
  },
  {
    id: 'product-issues',
    label: 'Product Related Issues',
    Icon: Package,
  },
  {
    id: 'other-queries',
    label: 'Other Queries',
    Icon: MessageCircle,
  },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.95L0 24l6.32-1.66a11.84 11.84 0 0 0 5.74 1.46h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.44-8.42ZM12.07 21.8h-.01a9.87 9.87 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.65-.24-.37a9.84 9.84 0 0 1-1.52-5.27c0-5.45 4.44-9.89 9.91-9.89 2.64 0 5.13 1.03 7 2.9a9.82 9.82 0 0 1 2.9 7c0 5.46-4.44 9.89-9.89 9.89Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.21 5.08 4.5.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

export function MobileHelpSupportPage() {
  const { customerAccount, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  const previewParam = searchParams.get('view'); // optional preview override: logged-out | logged-in

  const isLoggedInView =
    previewParam === 'logged-out'
      ? false
      : previewParam === 'logged-in'
        ? true
        : Boolean(customerAccount);

  const encodedMessage = encodeURIComponent(WHATSAPP_PREFILLED_MESSAGE);
  const cleanPhone = GIFTKART_WHATSAPP_SUPPORT_NUMBER.replace(/[^\d]/g, '');
  const whatsappHref = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    : `https://api.whatsapp.com/send?text=${encodedMessage}`;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      navigate('/search');
      return;
    }
    navigate(`/search?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-[calc(100dvh-132px)] w-full overflow-x-clip bg-gradient-to-b from-[#FCE9F6] via-[#FAF0FF] to-[#F6EEFF]">
      {/* Search Bar Directly Below Existing Mobile Header */}
      <div className="px-3.5 pb-2 pt-2.5">
        <form
          onSubmit={handleSearchSubmit}
          className="flex h-[44px] w-full items-center gap-2.5 rounded-full border border-[#EBD8FF]/90 bg-white px-4 shadow-[0_4px_14px_rgba(106,17,203,0.08)] focus-within:border-[#6A11CB]/50 focus-within:ring-2 focus-within:ring-[#6A11CB]/15"
        >
          <Search className="h-[18px] w-[18px] shrink-0 text-[#6A11CB] stroke-[2.2]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for Gifts, Products & More..."
            aria-label="Search for Gifts, Products & More"
            className="h-full w-full min-w-0 bg-transparent text-[13px] font-medium text-[#2B0B4E] placeholder:text-[#7E6B95] focus:outline-none"
          />
        </form>
      </div>

      {/* Prevent flashing Logged-out screen while persisted auth session hydrates */}
      {!isAuthReady && !previewParam ? (
        <div className="px-4 py-10">
          <div className="mx-auto h-52 max-w-[340px] animate-pulse rounded-[24px] bg-white/70" />
        </div>
      ) : !isLoggedInView ? (
        /* STATE A — USER NOT LOGGED IN (Strictly NO WhatsApp button, NO form, NO personal info) */
        <section
          aria-label="Login Required for Help and Support"
          className="flex flex-col items-center px-4 pb-8 pt-4 text-center"
        >
          {/* Uploaded PNG #1: Help & Support Illustration (Original Ratio, Centered) */}
          <div className="flex w-full items-center justify-center py-2">
            <img
              src={LOGGED_OUT_HELP_ILLUSTRATION}
              alt="GiftKart Help and Support Illustration"
              className="mx-auto h-auto w-full max-w-[238px] object-contain drop-shadow-[0_10px_22px_rgba(106,17,203,0.12)] min-[390px]:max-w-[264px]"
            />
          </div>

          <h1 className="mt-2.5 text-[26px] font-extrabold tracking-[-0.02em] text-[#2B0B4E] min-[390px]:text-[28px]">
            Help &amp; Support
          </h1>

          <p className="mt-2 max-w-[295px] text-[13.5px] leading-[1.48] text-[#523D6D]">
            Please log in to get support and contact our team on WhatsApp.
          </p>

          {/* Primary & Secondary Auth Buttons */}
          <div className="mt-6 w-full max-w-[348px] space-y-3">
            <Link
              to="/account"
              state={{ from: '/contact' }}
              className="flex min-h-[50px] w-full items-center justify-between rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] px-5 text-[15px] font-bold text-white shadow-[0_8px_22px_rgba(106,17,203,0.28)] transition-transform active:scale-[0.985]"
            >
              <span className="flex items-center gap-3">
                <User className="h-[20px] w-[20px] shrink-0 stroke-[2]" />
                <span>Login / Sign In</span>
              </span>
              <ChevronRight className="h-[20px] w-[20px] shrink-0 stroke-[2.2]" />
            </Link>

            <Link
              to="/account"
              state={{ from: '/contact', mode: 'signup' }}
              className="flex min-h-[48px] w-full items-center justify-start gap-3 rounded-full border border-[#EBD8FF] bg-white px-5 text-[14.5px] font-bold text-[#6A11CB] shadow-[0_4px_14px_rgba(106,17,203,0.08)] transition-transform active:scale-[0.985]"
            >
              <UserPlus className="h-[20px] w-[20px] shrink-0 text-[#6A11CB] stroke-[2]" />
              <span>Create New Account</span>
            </Link>
          </div>
        </section>
      ) : (
        /* STATE B — USER ALREADY LOGGED IN (Support Girl + WhatsApp Card + 6 Help Categories) */
        <section
          aria-label="GiftKart Customer Help and WhatsApp Support"
          className="px-3.5 pb-8 pt-2"
        >
          {/* Top Heading + Support Girl Illustration Blended Seamlessly */}
          <div className="relative flex items-end justify-between gap-1 pt-1">
            <div className="min-w-0 flex-1 pb-6 pl-0.5">
              <h1 className="text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#2B0B4E] min-[390px]:text-[24px]">
                Help &amp; Support
              </h1>
              <p className="mt-1.5 text-[13px] font-medium text-[#564073] min-[390px]:text-[13.5px]">
                We&apos;re here to help you!
              </p>
            </div>

            {/* Uploaded PNG #2: GiftKart Support Girl (Original Ratio, Clean Blend) */}
            <div className="relative z-10 -mb-2.5 w-[158px] shrink-0 min-[390px]:w-[176px] min-[412px]:w-[188px]">
              <img
                src={SUPPORT_GIRL_ILLUSTRATION}
                alt="GiftKart Support Representative"
                className="h-auto w-full object-contain drop-shadow-[0_6px_14px_rgba(106,17,203,0.12)]"
              />
            </div>
          </div>

          {/* Premium WhatsApp Contact Card */}
          <div className="relative z-20 rounded-[24px] border border-[#EFE2FF] bg-white p-4 shadow-[0_10px_28px_rgba(106,17,203,0.09)]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_14px_rgba(37,211,102,0.32)]">
                <WhatsAppIcon className="h-[28px] w-[28px]" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-[15.5px] font-extrabold leading-tight text-[#2B0B4E] min-[390px]:text-[16.5px]">
                  Contact Us on WhatsApp
                </h2>
                <p className="mt-1 text-[12px] leading-[1.4] text-[#5B4775] min-[390px]:text-[12.5px]">
                  Have an issue? Chat with our support team directly on
                  WhatsApp.
                </p>
              </div>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-[48px] w-full items-center justify-between rounded-full bg-gradient-to-r from-[#18B852] via-[#22C55E] to-[#16A34A] px-5 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_rgba(22,163,74,0.3)] transition-transform active:scale-[0.985]"
            >
              <span className="w-5 shrink-0" aria-hidden="true" />
              <span className="flex items-center gap-2">
                <WhatsAppIcon className="h-[19px] w-[19px] shrink-0" />
                <span>Chat on WhatsApp</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 stroke-[2.4]" />
            </a>
          </div>

          {/* Support Topics Section (Informational 2-Column Grid — No Forms/Tickets/FAQ) */}
          <div className="mt-5">
            <h2 className="mb-3 pl-0.5 text-[14px] font-extrabold text-[#2B0B4E] min-[390px]:text-[14.5px]">
              You can contact us for:
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {SUPPORT_TOPICS.map(({ id, label, Icon }) => (
                <div
                  key={id}
                  className="flex items-center gap-2.5 rounded-2xl border border-[#EFE2FF] bg-white px-3 py-3 shadow-[0_4px_12px_rgba(106,17,203,0.06)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F6EEFF] text-[#6A11CB]">
                    <Icon className="h-[18px] w-[18px] stroke-[1.95]" />
                  </div>
                  <span className="text-[11.5px] font-bold leading-[1.25] text-[#2B0B4E] min-[390px]:text-[12px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
