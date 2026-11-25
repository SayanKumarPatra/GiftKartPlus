import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RotateCcw,
  ShoppingBag,
  Truck,
  User,
  UserPlus,
} from 'lucide-react';
import { useStoreSettings } from '../../hooks/useStoreData';
import { useAuth } from '../../context/AuthContext';
import { buildWhatsAppSupportUrl } from '../../utils/storefrontHelpers';
import { MobileHelpSupportPage } from '../../components/storefront/MobileHelpSupportPage';

export function AboutUsPage() {
  const { data: settings } = useStoreSettings();
  const activeZonesText =
    settings?.deliveryZones
      .filter((z) => z.isActive)
      .map((z) => z.name)
      .join(', ') || 'Jalchak, Paschim Medinipur, West Bengal';

  return (
    <div className="mx-auto max-w-4xl pb-2">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[12px] text-neutral-500"
      >
        <Link to="/" className="transition-colors hover:text-neutral-900">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-neutral-800">About GiftKart</span>
      </nav>

      {/* Editorial Header */}
      <header className="mt-2.5 border-b border-neutral-200 pb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-neutral-900 sm:text-[28px]">
          {settings?.pageContent?.aboutHeadline ||
            'GiftKart — Har Gift Mein Ek Kahani.'}
        </h1>
        <p className="mt-1.5 text-[12.5px] text-neutral-500">
          Jalchak, Paschim Medinipur, West Bengal
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          Personalized &amp; Ready-to-Gift Storefront
        </p>
        <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-neutral-700 sm:text-[14.5px]">
          {settings?.pageContent?.aboutStory ||
            'Founded in Jalchak, West Bengal, GiftKart is a dedicated gifting storefront offering personalized photo frames, coffee mugs, custom T-shirt prints, home decor, hand made gifts, keychains, LED lighting, PVC cards, and curated gift bags & boxes. Every order is prepared with attention to print clarity, safe packaging, and transparent INR pricing.'}
        </p>
      </header>

      {/* Three Corporate Standards — Hairline Editorial Columns */}
      <section
        aria-label="Our operating standards"
        className="grid divide-y divide-neutral-200 border-b border-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <div className="py-4 sm:py-5 sm:pr-5">
          <p className="text-[11.5px] font-medium text-neutral-400 tabular-nums">
            01
          </p>
          <h2 className="mt-1 text-[14px] font-semibold text-neutral-900">
            Personalized Craftsmanship
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">
            Photo frames, coffee mugs, T-shirt prints, LED lighting, and PVC cards
            are printed to order with accurate colour reproduction and clean finishing.
          </p>
        </div>

        <div className="py-4 sm:px-5 sm:py-5">
          <p className="text-[11.5px] font-medium text-neutral-400 tabular-nums">
            02
          </p>
          <h2 className="mt-1 text-[14px] font-semibold text-neutral-900">
            Manual Quality Inspection
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">
            Each item is checked manually for print accuracy and protective
            packaging prior to dispatch to minimize transit damage.
          </p>
        </div>

        <div className="py-4 sm:py-5 sm:pl-5">
          <p className="text-[11.5px] font-medium text-neutral-400 tabular-nums">
            03
          </p>
          <h2 className="mt-1 text-[14px] font-semibold text-neutral-900">
            Dedicated Local Fulfilment
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">
            Actively delivering across{' '}
            <span className="font-medium text-neutral-800">
              {activeZonesText}
            </span>{' '}
            with Cash on Delivery (COD) and direct customer support.
          </p>
        </div>
      </section>

      {/* Store & Contact Details */}
      <section
        aria-label="Store details"
        className="border-b border-neutral-200 py-4 sm:py-5"
      >
        <h2 className="text-[13.5px] font-semibold text-neutral-900">
          Store &amp; Customer Support Information
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-[11.5px] text-neutral-500">Registered Area</dt>
            <dd className="mt-0.5 text-[13px] font-medium text-neutral-900">
              Jalchak, Paschim Medinipur, West Bengal
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-neutral-500">Support Phone</dt>
            <dd className="mt-0.5 text-[13px] font-medium text-neutral-900 tabular-nums">
              {settings?.supportPhone ?? '+91 9239505791'}
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-neutral-500">Support Email</dt>
            <dd className="mt-0.5 truncate text-[13px] font-medium text-neutral-900">
              {settings?.supportEmail ?? 'hello.giftkart@gmail.com'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Legal Policies Directory */}
      <section className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px]">
          <span className="font-semibold text-neutral-900">Policies:</span>
          {[
            { label: 'Return & Refund', to: '/return-policy' },
            { label: 'Cancellation', to: '/cancellation-policy' },
            { label: 'Shipping', to: '/shipping-policy' },
            { label: 'Privacy', to: '/privacy-policy' },
            { label: 'Terms & Conditions', to: '/terms' },
            { label: 'FAQ', to: '/faq' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <Link
          to="/shop"
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-neutral-900 bg-neutral-900 px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-neutral-800"
        >
          <span>Browse Products</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}

const DESKTOP_LOGGED_OUT_HELP_ILLUSTRATION =
  '/assets/aistudio/3D_Headset_Support_Illustration_e1278b5b.png';
const DESKTOP_SUPPORT_AGENT_ILLUSTRATION =
  '/assets/aistudio/Cheerful_Customer_Support_Agent_with_Laptop_b3ec24dc.png';

const DESKTOP_SUPPORT_TOPICS = [
  { id: 'order-issues', label: 'Order Related Issues', Icon: ShoppingBag },
  { id: 'payment-issues', label: 'Payment Issues', Icon: CreditCard },
  { id: 'delivery-issues', label: 'Delivery Issues', Icon: Truck },
  { id: 'return-refund', label: 'Return & Refund', Icon: RotateCcw },
  { id: 'product-issues', label: 'Product Related Issues', Icon: Package },
  { id: 'other-queries', label: 'Other Queries', Icon: MessageCircle },
];

export function ContactUsPage() {
  const { data: settings } = useStoreSettings();
  const { customerAccount, isAuthReady } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [issueNote, setIssueNote] = useState('');

  const whatsappHref = buildWhatsAppSupportUrl(
    settings?.supportPhone,
    customerAccount?.fullName ?? 'GiftKart Customer',
    customerAccount?.email ?? '',
    issueNote,
    selectedTopic || undefined
  );

  return (
    <>
      {/* Normal Mobile (< 900px): Premium Help & Support WhatsApp Page */}
      <div className="-mx-3.5 -my-4 sm:-mx-6 sm:-my-5 lg:hidden">
        <MobileHelpSupportPage />
      </div>

      {/* Desktop & Laptop (>= 900px): Full Feature Parity with Mobile Help & Support */}
      <div className="mx-auto hidden max-w-5xl lg:block">
        {!isAuthReady ? (
          <div className="h-72 animate-pulse rounded-2xl bg-[#FAF5FF]" />
        ) : !customerAccount ? (
          /* Logged-Out State — Same Illustration & Prompt as Mobile */
          <div className="mx-auto max-w-xl rounded-2xl border border-[#EFE3FF] bg-white px-10 py-10 text-center shadow-[0_12px_36px_-18px_rgba(106,17,203,0.18)]">
            <img
              src={DESKTOP_LOGGED_OUT_HELP_ILLUSTRATION}
              alt="GiftKart Help and Support"
              className="mx-auto h-44 w-auto object-contain drop-shadow-[0_10px_22px_rgba(106,17,203,0.12)]"
            />
            <h1 className="mt-4 font-display text-2xl font-bold text-[#1E1035]">
              Help &amp; Support
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#594A6B]">
              Please log in to get support and contact our team directly on WhatsApp.
            </p>
            <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
              <Link
                to="/account"
                state={{ from: '/contact' }}
                className="flex h-11 w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(106,17,203,0.28)] transition-opacity hover:opacity-95"
              >
                <span className="flex items-center gap-2.5">
                  <User className="h-4 w-4" />
                  <span>Login / Sign In</span>
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/account"
                state={{ from: '/contact', mode: 'signup' }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#DFD2F2] bg-[#FAF6FF] px-5 text-sm font-bold text-[#6A11CB] transition-colors hover:bg-[#F2E7FF]"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create New Account</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Logged-In State — Support Agent Illustration + WhatsApp Hub + 6 Topics */
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-6 rounded-2xl border border-[#EFE3FF] bg-gradient-to-r from-[#FAF5FF] via-white to-[#FFF4FA] px-8 py-6">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6A11CB]">
                  GiftKart Customer Care
                </p>
                <h1 className="mt-1 font-display text-3xl font-bold text-[#1E1035]">
                  Help &amp; Support
                </h1>
                <p className="mt-1.5 text-sm text-[#594A6B]">
                  Hi <strong className="text-[#1E1035]">{customerAccount.fullName}</strong>, we&apos;re
                  here to help! Select a topic below or chat with our support team directly on WhatsApp.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-5 text-xs font-semibold text-[#594A6B]">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#6A11CB]" />
                    {settings?.supportPhone ?? '+91 9239505791'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#6A11CB]" />
                    {settings?.supportEmail ?? 'hello.giftkart@gmail.com'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#FF4D8D]" />
                    Jalchak, Paschim Medinipur, WB
                  </span>
                </div>
              </div>
              <img
                src={DESKTOP_SUPPORT_AGENT_ILLUSTRATION}
                alt="GiftKart Support Representative"
                className="h-40 w-auto shrink-0 object-contain drop-shadow-[0_10px_20px_rgba(106,17,203,0.12)]"
              />
            </div>

            <div className="grid grid-cols-12 gap-6 items-start">
              {/* Left: 6 Support Topics */}
              <div className="col-span-7 space-y-4 rounded-2xl border border-[#EFE3FF] bg-white p-6 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.1)]">
                <div>
                  <h2 className="text-base font-extrabold text-[#1E1035]">
                    What can we help you with?
                  </h2>
                  <p className="mt-0.5 text-xs text-[#685782]">
                    Choose a topic to pre-fill your WhatsApp support message.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {DESKTOP_SUPPORT_TOPICS.map(({ id, label, Icon }) => {
                    const active = selectedTopic === label;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setSelectedTopic((prev) => (prev === label ? '' : label))
                        }
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                          active
                            ? 'border-[#6A11CB] bg-[#FAF5FF] shadow-xs ring-1 ring-[#6A11CB]/20'
                            : 'border-[#EFE3FF] bg-white hover:border-[#6A11CB]/40'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            active
                              ? 'bg-[#6A11CB] text-white'
                              : 'bg-[#F6EEFF] text-[#6A11CB]'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-[#1E1035]">{label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#EFE3FF] pt-4">
                  <label
                    htmlFor="desktop-support-note"
                    className="block text-xs font-bold text-[#2B0B4E]"
                  >
                    Brief Message / Order Number (Optional)
                  </label>
                  <textarea
                    id="desktop-support-note"
                    rows={3}
                    value={issueNote}
                    onChange={(e) => setIssueNote(e.target.value)}
                    placeholder="Share your Order # or describe your question..."
                    className="mt-1.5 w-full rounded-xl border border-[#DFD2F2] bg-[#FAF8FC] px-3.5 py-2.5 text-sm text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Right: WhatsApp Direct Support Card + Quick Policy Links */}
              <div className="col-span-5 space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-[0_8px_24px_-14px_rgba(22,163,74,0.18)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_14px_rgba(37,211,102,0.3)]">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#1E1035]">
                        Contact Us on WhatsApp
                      </h2>
                      <p className="text-xs text-[#594A6B]">
                        Chat directly with our Jalchak support desk.
                      </p>
                    </div>
                  </div>

                  {selectedTopic && (
                    <p className="mt-3 rounded-lg bg-[#FAF5FF] px-3 py-1.5 text-xs font-semibold text-[#6A11CB]">
                      Selected Topic: {selectedTopic}
                    </p>
                  )}

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex h-12 w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#18B852] via-[#22C55E] to-[#16A34A] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(22,163,74,0.28)] transition-opacity hover:opacity-95"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Chat on WhatsApp</span>
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>

                <div className="rounded-2xl border border-[#EFE3FF] bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7A6894]">
                    Helpful Self-Service Links
                  </p>
                  <div className="mt-2.5 divide-y divide-[#F3EAFF] text-xs font-semibold">
                    {[
                      { label: 'Track & Manage My Orders', to: '/my-orders' },
                      { label: 'Frequently Asked Questions (FAQ)', to: '/faq' },
                      { label: 'Return & Refund Policy', to: '/return-policy' },
                      { label: 'Order Cancellation Policy', to: '/cancellation-policy' },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex items-center justify-between py-2.5 text-[#2B0B4E] transition-colors hover:text-[#6A11CB]"
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#9B8AB4]" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const FAQ_ITEMS = [
  {
    q: 'Which products are eligible for Return & Refund?',
    a: 'Only standard, non-customized products (items without any custom photo, custom name, or personalized print) are eligible for return and refund within 7 days of delivery in unused condition with original packaging. Customized products with your personal photo or name are strictly non-returnable and non-refundable, except in verified cases of transit damage or wrong item delivery reported within 48 hours.',
  },
  {
    q: 'When can I cancel my GiftKart order?',
    a: 'You can cancel your order from the My Orders page only while its status is "Order Placed" (before processing starts). Once your order moves into "Processing", cancellation is strictly not possible.',
  },
  {
    q: 'What payment methods are currently accepted?',
    a: 'Cash on Delivery (COD) is currently active and available for checkout. UPI payment is temporarily unavailable and will be enabled in an upcoming update.',
  },
  {
    q: 'Where does GiftKart currently deliver?',
    a: 'GiftKart currently delivers across Jalchak, Paschim Medinipur, West Bengal and nearby serviceable PIN codes. Standard delivery usually takes 1–3 business days after dispatch.',
  },
  {
    q: 'How do I check my order status?',
    a: 'Open the My Orders section from the bottom navigation or My Account menu to see your complete order history, live progress stages (Order Placed, Processing, Shipped, Delivered), and full order details.',
  },
  {
    q: 'How does Gift Wrapping work?',
    a: 'You can add curated Gift Wrapping and a personal message note on eligible items or in your cart with transparent INR pricing before placing your order.',
  },
];

export function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl pb-2">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[12px] text-neutral-500"
      >
        <Link to="/" className="transition-colors hover:text-neutral-900">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-neutral-800">FAQ</span>
      </nav>

      {/* Clean Document Header */}
      <header className="mt-2.5 border-b border-neutral-200 pb-4">
        <h1 className="text-[22px] font-bold tracking-tight text-neutral-900 sm:text-[26px]">
          Frequently Asked Questions
        </h1>
        <p className="mt-1 text-[13px] text-neutral-600 sm:text-[13.5px]">
          Answers regarding returns, cancellations, Cash on Delivery, and
          Jalchak delivery.
        </p>
      </header>

      {/* Minimal Hairline Accordion */}
      <div className="divide-y divide-neutral-200 border-b border-neutral-200">
        {FAQ_ITEMS.map((item, idx) => {
          const open = openIdx === idx;
          return (
            <div key={item.q}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIdx(open ? null : idx)}
                className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-[13.5px] font-semibold text-neutral-900 transition-colors hover:text-[#6A11CB] sm:text-[14px]"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ${
                    open ? 'rotate-180 text-neutral-700' : ''
                  }`}
                />
              </button>
              {open && (
                <div className="pb-4 pr-6 text-[13px] leading-relaxed text-neutral-600 sm:text-[13.5px]">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiet Support Footer Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-neutral-600">
        <span>Need further assistance with an existing order?</span>
        <div className="flex items-center gap-4">
          <Link
            to="/return-policy"
            className="text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
          >
            Return Policy
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-0.5 font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
          >
            <span>Help &amp; Support</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

type PolicyType = 'return' | 'cancellation' | 'shipping' | 'privacy' | 'terms';

interface PolicyHighlightItem {
  tone: 'allowed' | 'restricted' | 'info';
  title: string;
  detail: string;
}

interface PolicySectionItem {
  heading: string;
  body: string;
  bullets?: string[];
}

interface PolicyDocument {
  title: string;
  subtitle: string;
  lastUpdated: string;
  highlights: PolicyHighlightItem[];
  sections: PolicySectionItem[];
}

const POLICY_TABS: { type: PolicyType; label: string; to: string }[] = [
  { type: 'return', label: 'Return & Refund', to: '/return-policy' },
  { type: 'cancellation', label: 'Cancellation', to: '/cancellation-policy' },
  { type: 'shipping', label: 'Shipping', to: '/shipping-policy' },
  { type: 'privacy', label: 'Privacy', to: '/privacy-policy' },
  { type: 'terms', label: 'Terms', to: '/terms' },
];

const POLICY_CONTENT: Record<PolicyType, PolicyDocument> = {
  return: {
    title: 'Return & Refund Policy',
    subtitle: 'Clear return rules for standard vs. customized photo gifts.',
    lastUpdated: 'November 2026',
    highlights: [
      {
        tone: 'allowed',
        title: 'Non-Customized Products Only',
        detail:
          'Returns and refunds apply strictly to standard products that do not carry any custom photo, custom name, or personalized print (within 7 days of delivery, unused & in original packaging).',
      },
      {
        tone: 'restricted',
        title: 'Customized Photo / Name Products — No Return',
        detail:
          'Any product personalized with customer-uploaded photos, names, messages, or custom printing is strictly non-returnable and non-refundable (except verified transit damage or wrong item delivered).',
      },
    ],
    sections: [
      {
        heading: '1. Return Eligibility (Non-Customized Products)',
        body: 'Only standard, ready-made products without any customization (no uploaded photo, custom name, message, or personalized printing) are eligible for return and refund. To qualify, the return request must be raised within 7 days of delivery and the item must meet all conditions below:',
        bullets: [
          'The product is unused, unwashed, and in the exact condition received.',
          'Original GiftKart packaging, box, tags, and included accessories are completely intact.',
          'Order ID and purchase details from your My Orders section are provided.',
        ],
      },
      {
        heading: '2. Strict Non-Returnable Policy for Customized Products',
        body: 'Because customized products—including Photo Frames, Coffee Mugs, T-shirt Prints, LED Lighting, Hand Made keepsakes, KeyChains, and PVC Cards—are uniquely crafted using your personal photo or text, they cannot be resold. Therefore, customized items are strictly not eligible for return, exchange, or refund due to change of mind, size preference, or customer-submitted spelling/image errors.',
      },
      {
        heading: '3. Damaged, Defective, or Wrong Product Received',
        body: 'If any delivered item (standard or customized) arrives broken/damaged during transit, has a major printing defect caused by our studio, or is the wrong product compared to your placed order, you must report it within 48 hours of delivery through Help & Support.',
        bullets: [
          'Share clear photographs of the defect/damage along with an uncut unboxing video showing the sealed parcel and shipping label.',
          'Once verified by our quality team, GiftKart will arrange a free replacement or appropriate resolution.',
        ],
      },
      {
        heading: '4. Return Inspection & Refund Process',
        body: 'For eligible non-customized returns, once the returned product reaches our Jalchak desk and passes quality inspection, the refund is approved and processed within 5–7 business days.',
        bullets: [
          'Cash on Delivery (COD) Orders: Approved refunds are transferred directly to your verified bank account or UPI ID after confirmation.',
          'Prepaid Orders (when enabled): Approved refunds are credited back to the original payment source.',
          'Gift wrapping charges or delivery fees (if any) are non-refundable unless the return is due to an error on GiftKart’s part.',
        ],
      },
      {
        heading: '5. Cases Not Covered Under Return / Refund',
        body: 'Returns or refunds cannot be accepted for damage caused after delivery, missing original packaging, minor colour or brightness variations caused by mobile/computer screen calibration, or requests raised after the 7-day standard / 48-hour damage window.',
      },
    ],
  },

  cancellation: {
    title: 'Cancellation Policy',
    subtitle: 'Pre-processing cancellation guidelines for all GiftKart orders.',
    lastUpdated: 'November 2026',
    highlights: [
      {
        tone: 'allowed',
        title: 'Allowed Before Processing Starts',
        detail:
          'You can cancel your order anytime while its status is still "Order Placed" directly from the My Orders page.',
      },
      {
        tone: 'restricted',
        title: 'Not Allowed Once Processing Begins',
        detail:
          'Once your order enters the "Processing" stage, preparation and packaging begin immediately—cancellation is strictly no longer possible.',
      },
    ],
    sections: [
      {
        heading: '1. When Order Cancellation Is Permitted',
        body: 'Customers may cancel an order free of charge only while the order status remains "Order Placed". During this stage, the order has not yet been taken into production, customization, or dispatch preparation.',
      },
      {
        heading: '2. Strictly No Cancellation After Processing Begins',
        body: 'As soon as our team moves your order status from "Order Placed" to "Processing" (or later stages such as "Shipped" and "Delivered"), the order cannot be cancelled under any circumstances. This applies to both standard and customized gifts because inventory allocation, printing, and gift-wrapping preparation begin immediately.',
      },
      {
        heading: '3. How to Cancel an Eligible Order',
        body: 'Open My Orders, tap on the order you wish to cancel, and select "Cancel Order". If the Cancel Order button is no longer available and a processing notice is displayed, your order has already entered processing and cannot be cancelled.',
      },
      {
        heading: '4. Review Customized Details Before Ordering',
        body: 'Before confirming your checkout, please verify your selected product variant, size, spelling of custom names/messages, uploaded photo clarity, and delivery address. Modifications or cancellations cannot be accepted once printing or processing starts.',
      },
      {
        heading: '5. Cancellations by GiftKart & Refund Terms',
        body: 'GiftKart reserves the right to cancel an order in exceptional situations such as stock unavailability, unserviceable delivery PIN code, incomplete address, or suspected fraudulent activity. If a prepaid order is cancelled before processing or by GiftKart, a full refund will be issued within 5–7 business days. For COD orders cancelled in time, no charges apply.',
      },
    ],
  },

  shipping: {
    title: 'Shipping & Delivery Policy',
    subtitle: 'Dispatch timelines, local Jalchak coverage, and safe packaging.',
    lastUpdated: 'November 2026',
    highlights: [
      {
        tone: 'info',
        title: 'Serviceable Area & Transparent INR Pricing',
        detail:
          'Active local delivery across Jalchak, Paschim Medinipur, West Bengal and serviceable PIN codes with clear delivery timelines.',
      },
    ],
    sections: [
      {
        heading: '1. Serviceable Delivery Locations',
        body: 'GiftKart currently delivers across Jalchak, Paschim Medinipur, West Bengal, and nearby serviceable PIN codes. Please enter an accurate house/street address, landmark, and 6-digit PIN code during checkout to ensure timely delivery.',
      },
      {
        heading: '2. Order Processing & Crafting Time',
        body: 'Every gift is carefully packed before dispatch:',
        bullets: [
          'Standard Non-Customized Products: Prepared and dispatched within 24 hours of order confirmation.',
          'Customized Photo & Personalized Gifts: Require 1–2 business days for printing, drying/finishing, and manual quality inspection.',
        ],
      },
      {
        heading: '3. Estimated Delivery Timeline & Charges',
        body: 'Orders within Jalchak are typically delivered within 1–3 business days after dispatch. Delivery timelines may vary slightly during major festivals, public holidays, or severe weather conditions. Any applicable delivery fee or free-shipping offer is clearly shown in INR (₹) at checkout before you place your order.',
      },
      {
        heading: '4. Cash on Delivery (COD) & Delivery Verification',
        body: 'Please ensure your mobile number is reachable so our delivery executive can coordinate doorstep handover. For Cash on Delivery (COD) orders, kindly keep the payable amount ready. Repeated unconfirmed refusals at delivery may restrict future COD access.',
      },
      {
        heading: '5. Order Status & Transit Damage Reporting',
        body: 'You can track your live order progress directly inside My Orders (Order Placed → Processing → Shipped → Delivered). If an outer package looks crushed or tampered with upon delivery, please capture an uncut unboxing video and notify Help & Support within 48 hours.',
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How GiftKart protects your personal details and custom photos.',
    lastUpdated: 'November 2026',
    highlights: [
      {
        tone: 'info',
        title: 'Your Data & Personal Photos Stay Private',
        detail:
          'We collect only the information needed to craft and deliver your gifts. Your personal details and uploaded customization photos are never sold to third parties.',
      },
    ],
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'When you register, save an address, or place an order on GiftKart, we collect only essential information required to fulfill your order:',
        bullets: [
          'Contact & Identity Details: Full Name, Mobile Number, and Email Address.',
          'Delivery Information: Street/House Address, Landmark, Area, City, State, and 6-digit PIN Code.',
          'Order & Personalization Data: Selected products, gift messages, and custom photos you upload for printing.',
        ],
      },
      {
        heading: '2. Strict Confidentiality of Uploaded Custom Photos',
        body: 'Any photograph or custom artwork you upload for photo frames, coffee mugs, T-shirt prints, keychains, LED lighting, or PVC cards is used strictly for printing and fulfilling your order. GiftKart does not sell, publish, or publicly share your personal images without your explicit consent.',
      },
      {
        heading: '3. How We Use Your Information',
        body: 'We use your information to confirm and process orders, coordinate doorstep delivery, send important order updates, respond to WhatsApp/customer support queries, apply eligible discounts, and protect against fraudulent orders.',
      },
      {
        heading: '4. Data Sharing & Legal Disclosure',
        body: 'We do not sell or rent customer information. Delivery details (Name, Address, and Phone Number) are shared strictly with authorized delivery personnel or logistics partners solely to complete your delivery, or with legal authorities if mandated under applicable Indian law.',
      },
      {
        heading: '5. Storage, Security & Your Rights',
        body: 'We follow reasonable technical and operational practices to safeguard your account and order records. You are responsible for keeping your login credentials private. You can edit your profile, manage or delete saved delivery addresses anytime from My Account, or contact Help & Support to request assistance regarding your personal data.',
      },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    subtitle: 'Legal terms governing use of GiftKart and all orders placed.',
    lastUpdated: 'November 2026',
    highlights: [
      {
        tone: 'info',
        title: 'Fair & Transparent Shopping Agreement',
        detail:
          'By ordering on GiftKart, you agree to our transparent INR pricing, pre-processing cancellation rule, and non-returnable terms for customized gifts.',
      },
    ],
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By accessing, browsing, or placing an order on GiftKart, you agree to comply with these Terms & Conditions along with our Return & Refund Policy, Cancellation Policy, Shipping Policy, and Privacy Policy.',
      },
      {
        heading: '2. Eligibility & Accurate Customer Details',
        body: 'You agree to provide truthful, complete, and accurate contact and delivery information (Full Name, active 10-digit Mobile Number, Email Address, full Street Address, and valid PIN Code). GiftKart is not liable for failed or delayed deliveries resulting from inaccurate or incomplete customer details.',
      },
      {
        heading: '3. Pricing, Offers & Payment Terms',
        body: 'All product prices are displayed in Indian Rupees (INR / ₹). Coupon codes are subject to validity periods, minimum order value, and applicable campaign rules. Cash on Delivery (COD) is currently supported at checkout; UPI or additional payment methods will apply when enabled.',
      },
      {
        heading: '4. Custom Orders & Content Responsibility',
        body: 'When submitting custom photos, names, or messages for personalization, you confirm that you have the lawful right to use such content and that it does not infringe third-party copyrights or contain offensive, defamatory, or unlawful material. GiftKart reserves the right to reject inappropriate customization requests. Slight colour or alignment variations may naturally occur between digital displays and printed gift surfaces.',
      },
      {
        heading: '5. Order Cancellation & Return Rules',
        body: 'Orders may only be cancelled prior to entering the "Processing" stage; once processing starts, cancellation is not permitted. Only non-customized products are eligible for return and refund within 7 days of delivery in unused condition. Customized products bearing customer photos, names, or custom prints are non-returnable and non-refundable except in verified transit-damage or wrong-item cases reported within 48 hours.',
      },
      {
        heading: '6. Intellectual Property & Limitation of Liability',
        body: 'All GiftKart branding, logos, product visuals, graphics, and website content are the property of GiftKart and may not be reproduced or used commercially without written permission. To the maximum extent permitted by law, GiftKart’s total liability for any claim relating to an order shall not exceed the purchase price paid for that specific order.',
      },
      {
        heading: '7. Governing Law & Jurisdiction',
        body: 'These Terms & Conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to GiftKart orders or services shall be subject to the exclusive jurisdiction of the competent courts in Paschim Medinipur, West Bengal, India.',
      },
    ],
  },
};

function getHighlightLabel(type: PolicyType, tone: PolicyHighlightItem['tone']) {
  if (tone === 'allowed') {
    return type === 'cancellation' ? 'Allowed' : 'Eligible';
  }
  if (tone === 'restricted') {
    return type === 'cancellation' ? 'Not Allowed' : 'Not Eligible';
  }
  return 'Policy Scope';
}

export function PolicyPage({ type }: { type: PolicyType }) {
  const { data: settings } = useStoreSettings();
  const content = POLICY_CONTENT[type];
  const customPolicyNote =
    type === 'privacy'
      ? settings?.policies?.privacyPolicy?.trim()
      : type === 'terms'
        ? settings?.policies?.termsAndConditions?.trim()
        : type === 'return'
          ? settings?.policies?.refundPolicy?.trim()
          : '';

  return (
    <div className="mx-auto max-w-5xl pb-2">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[12px] text-neutral-500"
      >
        <Link to="/" className="transition-colors hover:text-neutral-900">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span>Legal</span>
        <span aria-hidden="true">/</span>
        <span className="truncate text-neutral-800">{content.title}</span>
      </nav>

      {/* Mobile Policy Switcher — Clean Underline Tabs (No Pills / No Gradients) */}
      <nav
        aria-label="GiftKart legal policies"
        className="no-scrollbar mt-2 flex items-center gap-5 overflow-x-auto border-b border-neutral-200 lg:hidden"
      >
        {POLICY_TABS.map((tab) => {
          const active = tab.type === type;
          return (
            <Link
              key={tab.type}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap border-b-2 pb-2.5 pt-1 text-[12.5px] transition-colors ${
                active
                  ? 'border-[#6A11CB] font-semibold text-neutral-900'
                  : 'border-transparent font-medium text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Corporate 2-Column Editorial Layout on Desktop, Single Column on Mobile */}
      <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-12 lg:gap-10">
        {/* Desktop Sticky Legal Directory Sidebar */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            <p className="text-[11px] font-semibold tracking-wider text-neutral-400">
              Legal &amp; Policies
            </p>
            <nav
              aria-label="Policy navigation"
              className="mt-2 flex flex-col space-y-0.5"
            >
              {POLICY_TABS.map((tab) => {
                const active = tab.type === type;
                return (
                  <Link
                    key={tab.type}
                    to={tab.to}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded px-2.5 py-2 text-[13px] transition-colors ${
                      active
                        ? 'bg-neutral-100 font-semibold text-neutral-900'
                        : 'font-normal text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 border-t border-neutral-200 pt-4">
              <p className="text-[11px] font-semibold tracking-wider text-neutral-400">
                Information
              </p>
              <div className="mt-2 flex flex-col space-y-0.5 text-[13px]">
                <Link
                  to="/about"
                  className="rounded px-2.5 py-1.5 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                  About GiftKart
                </Link>
                <Link
                  to="/faq"
                  className="rounded px-2.5 py-1.5 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                  FAQ
                </Link>
                <Link
                  to="/contact"
                  className="rounded px-2.5 py-1.5 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                  Help &amp; Support
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Editorial Legal Document */}
        <article className="lg:col-span-9">
          {/* Document Title & Quiet Metadata */}
          <header className="border-b border-neutral-200 pb-4">
            <h1 className="text-[21px] font-bold leading-tight tracking-tight text-neutral-900 sm:text-[26px]">
              {content.title}
            </h1>
            <p className="mt-1 text-[13px] text-neutral-600 sm:text-[14px]">
              {content.subtitle}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-neutral-500">
              <span>{settings?.storeName || 'GiftKart'} India</span>
              <span aria-hidden="true">·</span>
              <span>Last updated {content.lastUpdated}</span>
              <span aria-hidden="true">·</span>
              <span>Applicable to all GiftKart orders</span>
            </div>
          </header>

          {customPolicyNote && (
            <section className="mt-4 rounded border border-neutral-200 bg-neutral-50 px-3.5 py-3">
              <p className="text-[11.5px] font-semibold text-neutral-700">
                Store Policy Statement
              </p>
              <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-neutral-700">
                {customPolicyNote}
              </p>
            </section>
          )}

          {/* Neutral Structured Key Summary Table */}
          {content.highlights.length > 0 && (
            <section
              aria-label="Key policy summary"
              className="mt-4 rounded border border-neutral-200 bg-neutral-50/70"
            >
              <div className="border-b border-neutral-200 px-3.5 py-2 text-[11.5px] font-semibold text-neutral-700">
                Summary at a Glance
              </div>
              <div className="divide-y divide-neutral-200">
                {content.highlights.map((item) => {
                  const statusColor =
                    item.tone === 'allowed'
                      ? 'text-emerald-700'
                      : item.tone === 'restricted'
                        ? 'text-rose-700'
                        : 'text-neutral-600';
                  return (
                    <div
                      key={item.title}
                      className="grid gap-1 px-3.5 py-2.5 sm:grid-cols-12 sm:gap-4"
                    >
                      <div className="sm:col-span-3">
                        <span
                          className={`text-[12px] font-semibold ${statusColor}`}
                        >
                          {getHighlightLabel(type, item.tone)}
                        </span>
                      </div>
                      <div className="sm:col-span-9">
                        <p className="text-[12.5px] font-semibold text-neutral-900">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-600">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Numbered Legal Clauses */}
          <div className="mt-2 divide-y divide-neutral-200">
            {content.sections.map((sec) => (
              <section key={sec.heading} className="py-3.5 sm:py-4">
                <h2 className="text-[14.5px] font-semibold text-neutral-900 sm:text-[15px]">
                  {sec.heading}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-700 sm:text-[13.5px]">
                  {sec.body}
                </p>
                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-neutral-700 marker:text-neutral-400 sm:text-[13px]">
                    {sec.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Minimal Support & Grievance Contact Footer */}
          <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-4 text-[12.5px] text-neutral-600">
            <div className="min-w-0">
              <span className="font-semibold text-neutral-900">
                Customer Support:
              </span>{' '}
              <span>{settings?.supportEmail ?? 'hello.giftkart@gmail.com'}</span>
              <span className="mx-1.5 text-neutral-400" aria-hidden="true">
                ·
              </span>
              <span className="tabular-nums">
                {settings?.supportPhone ?? '+91 9239505791'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/my-orders"
                className="text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
              >
                My Orders
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-0.5 font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
              >
                <span>Help &amp; Support</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
