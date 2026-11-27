import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  Facebook,
  Instagram,
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
import { useLanguage } from '../../context/LanguageContext';
import {
  buildWhatsAppSupportUrl,
  cleanWhatsAppDigits,
  normalizeOfficialContactFields,
} from '../../utils/storefrontHelpers';
import { MobileHelpSupportPage } from '../../components/storefront/MobileHelpSupportPage';

export function AboutUsPage() {
  const { data: settings } = useStoreSettings();
  const { language, t, translatePlace } = useLanguage();
  const isBn = language === 'bn';
  const resolvedContact = normalizeOfficialContactFields({
    supportEmail: settings?.supportEmail,
    supportPhone: settings?.supportPhone,
    contactVersion: settings?.contactVersion,
    socialLinks: settings?.socialLinks,
  });
  const activeZonesText =
    settings?.deliveryZones
      .filter((z) => z.isActive)
      .map((z) => translatePlace(z.name))
      .join(', ') ||
    (isBn
      ? 'জলচক, পশ্চিম মেদিনীপুর, পশ্চিমবঙ্গ'
      : 'Jalchak, Paschim Medinipur, West Bengal');

  return (
    <div className="mx-auto max-w-4xl pb-2">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[12px] text-neutral-500"
      >
        <Link to="/" className="transition-colors hover:text-neutral-900">
          {t('home')}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-neutral-800">{t('aboutUs')}</span>
      </nav>

      {/* Editorial Header */}
      <header className="mt-2.5 border-b border-neutral-200 pb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-neutral-900 sm:text-[28px]">
          {isBn
            ? 'GiftKart — প্রতিটি উপহারে একটি গল্প।'
            : settings?.pageContent?.aboutHeadline ||
              'GiftKart — Har Gift Mein Ek Kahani.'}
        </h1>
        <p className="mt-1.5 text-[12.5px] text-neutral-500">
          {t('storeLocationText')}
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          {isBn
            ? 'পার্সোনালাইজড ও রেডি-টু-গিফট অনলাইন স্টোর'
            : 'Personalized & Ready-to-Gift Storefront'}
        </p>
        <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-neutral-700 sm:text-[14.5px]">
          {isBn
            ? 'পশ্চিমবঙ্গের জলচক-এ প্রতিষ্ঠিত GiftKart একটি বিশ্বস্ত অনলাইন গিফট স্টোর, যেখানে পার্সোনালাইজড ফটো ফ্রেম, কফি মগ, কাস্টম টি-শার্ট প্রিন্ট, হোম ডেকোর, হাতে তৈরি উপহার, কী-চেইন, এলইডি লাইটিং, পিভিসি কার্ড এবং বিশেষ গিফট ব্যাগ ও বক্স পাওয়া যায়। প্রতিটি অর্ডার নিখুঁত প্রিন্ট, নিরাপদ প্যাকেজিং এবং স্বচ্ছ মূল্যে প্রস্তুত করা হয়।'
            : settings?.pageContent?.aboutStory ||
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
            {isBn ? '০১' : '01'}
          </p>
          <h2 className="mt-1 text-[14px] font-semibold text-neutral-900">
            {isBn ? 'পার্সোনালাইজড কারুকার্য' : 'Personalized Craftsmanship'}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">
            {isBn
              ? 'ফটো ফ্রেম, কফি মগ, টি-শার্ট প্রিন্ট, এলইডি লাইটিং ও পিভিসি কার্ড প্রতিটি অর্ডার অনুযায়ী নিখুঁত রঙ ও ফিনিশিংয়ে প্রিন্ট করা হয়।'
              : 'Photo frames, coffee mugs, T-shirt prints, LED lighting, and PVC cards are printed to order with accurate colour reproduction and clean finishing.'}
          </p>
        </div>

        <div className="py-4 sm:px-5 sm:py-5">
          <p className="text-[11.5px] font-medium text-neutral-400 tabular-nums">
            {isBn ? '০২' : '02'}
          </p>
          <h2 className="mt-1 text-[14px] font-semibold text-neutral-900">
            {isBn ? 'হাতে-কলমে মান পরীক্ষা' : 'Manual Quality Inspection'}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">
            {isBn
              ? 'ডিসপ্যাচের আগে প্রতিটি পণ্য প্রিন্টের মান এবং নিরাপদ প্যাকেজিংয়ের জন্য যত্নসহকারে পরীক্ষা করা হয়।'
              : 'Each item is checked manually for print accuracy and protective packaging prior to dispatch to minimize transit damage.'}
          </p>
        </div>

        <div className="py-4 sm:py-5 sm:pl-5">
          <p className="text-[11.5px] font-medium text-neutral-400 tabular-nums">
            {isBn ? '০৩' : '03'}
          </p>
          <h2 className="mt-1 text-[14px] font-semibold text-neutral-900">
            {isBn ? 'নির্ভরযোগ্য স্থানীয় ডেলিভারি' : 'Dedicated Local Fulfilment'}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">
            {isBn ? (
              <>
                <span className="font-medium text-neutral-800">
                  {activeZonesText}
                </span>{' '}
                জুড়ে ক্যাশ অন ডেলিভারি (COD) এবং সরাসরি কাস্টমার সাপোর্টসহ দ্রুত ডেলিভারি।
              </>
            ) : (
              <>
                Actively delivering across{' '}
                <span className="font-medium text-neutral-800">
                  {activeZonesText}
                </span>{' '}
                with Cash on Delivery (COD) and direct customer support.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Store & Contact Details */}
      <section
        aria-label="Store details"
        className="border-b border-neutral-200 py-4 sm:py-5"
      >
        <h2 className="text-[13.5px] font-semibold text-neutral-900">
          {isBn
            ? 'স্টোর ও কাস্টমার সাপোর্ট তথ্য'
            : 'Store & Customer Support Information'}
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-[11.5px] text-neutral-500">
              {isBn ? 'নিবন্ধিত এলাকা' : 'Registered Area'}
            </dt>
            <dd className="mt-0.5 text-[13px] font-medium text-neutral-900">
              {t('storeLocationText')}
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-neutral-500">
              {isBn ? 'সাপোর্ট ফোন ও হোয়াটসঅ্যাপ' : 'Support Phone & WhatsApp'}
            </dt>
            <dd className="mt-0.5 text-[13px] font-medium text-neutral-900 tabular-nums">
              <a
                href={`tel:+${cleanWhatsAppDigits(resolvedContact.supportPhone)}`}
                className="hover:text-[#6A11CB] hover:underline"
              >
                {resolvedContact.supportPhone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-neutral-500">
              {isBn ? 'সাপোর্ট ইমেইল' : 'Support Email'}
            </dt>
            <dd className="mt-0.5 truncate text-[13px] font-medium text-neutral-900">
              <a
                href={`mailto:${resolvedContact.supportEmail}`}
                className="hover:text-[#6A11CB] hover:underline"
              >
                {resolvedContact.supportEmail}
              </a>
            </dd>
          </div>
        </dl>
        <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
          <a
            href={settings?.socialLinks?.instagram?.trim() || 'https://www.instagram.com/giftkart.online'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#EBD8FF] bg-[#FAF6FF] px-3 py-1 text-xs font-bold text-[#6A11CB] transition-colors hover:bg-[#F3E8FF]"
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>Instagram</span>
          </a>
          <a
            href={settings?.socialLinks?.facebook?.trim() || 'https://www.facebook.com/share/18v7Ev2crP/'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#EBD8FF] bg-[#FAF6FF] px-3 py-1 text-xs font-bold text-[#1877F2] transition-colors hover:bg-[#EFF6FF]"
          >
            <Facebook className="h-3.5 w-3.5" />
            <span>Facebook</span>
          </a>
          <a
            href={resolvedContact.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{t('whatsappShort')}</span>
          </a>
        </div>
      </section>

      {/* Legal Policies Directory */}
      <section className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px]">
          <span className="font-semibold text-neutral-900">
            {t('footerPolicies')}:
          </span>
          {[
            { label: t('returnsRefunds'), to: '/return-policy' },
            { label: isBn ? 'বাতিলকরণ নীতিমালা' : 'Cancellation', to: '/cancellation-policy' },
            { label: t('shippingDelivery'), to: '/shipping-policy' },
            { label: t('privacyPolicy'), to: '/privacy-policy' },
            { label: t('termsConditions'), to: '/terms' },
            { label: t('faq'), to: '/faq' },
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
          <span>{t('exploreGifts')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}

const DESKTOP_LOGGED_OUT_HELP_ILLUSTRATION =
  '/assets/aistudio/3D_Headset_Support_Illustration_e1278b5b.webp';
const DESKTOP_SUPPORT_AGENT_ILLUSTRATION =
  '/assets/aistudio/Cheerful_Customer_Support_Agent_with_Laptop_b3ec24dc.webp';

const DESKTOP_SUPPORT_TOPICS = [
  { id: 'order-issues', labelKey: 'supportTopicOrder' as const, Icon: ShoppingBag },
  { id: 'payment-issues', labelKey: 'supportTopicPayment' as const, Icon: CreditCard },
  { id: 'delivery-issues', labelKey: 'supportTopicDelivery' as const, Icon: Truck },
  { id: 'return-refund', labelKey: 'supportTopicReturn' as const, Icon: RotateCcw },
  { id: 'product-issues', labelKey: 'supportTopicProduct' as const, Icon: Package },
  { id: 'other-queries', labelKey: 'supportTopicOther' as const, Icon: MessageCircle },
];

export function ContactUsPage() {
  const { data: settings } = useStoreSettings();
  const { customerAccount, isAuthReady } = useAuth();
  const { language, t } = useLanguage();
  const isBn = language === 'bn';
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [issueNote, setIssueNote] = useState('');

  const resolvedContact = normalizeOfficialContactFields({
    supportEmail: settings?.supportEmail,
    supportPhone: settings?.supportPhone,
    contactVersion: settings?.contactVersion,
    socialLinks: settings?.socialLinks,
  });

  const whatsappHref = buildWhatsAppSupportUrl(
    resolvedContact.supportPhone,
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
              {t('helpSupport')}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#594A6B]">
              {t('signInPrompt')}
            </p>
            <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
              <Link
                to="/account"
                state={{ from: '/contact' }}
                className="flex h-11 w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(106,17,203,0.28)] transition-opacity hover:opacity-95"
              >
                <span className="flex items-center gap-2.5">
                  <User className="h-4 w-4" />
                  <span>{t('signIn')}</span>
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/account"
                state={{ from: '/contact', mode: 'signup' }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#DFD2F2] bg-[#FAF6FF] px-5 text-sm font-bold text-[#6A11CB] transition-colors hover:bg-[#F2E7FF]"
              >
                <UserPlus className="h-4 w-4" />
                <span>{t('createAccount')}</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Logged-In State — Support Agent Illustration + WhatsApp Hub + 6 Topics */
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-6 rounded-2xl border border-[#EFE3FF] bg-gradient-to-r from-[#FAF5FF] via-white to-[#FFF4FA] px-8 py-6">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6A11CB]">
                  {t('footerSupport')}
                </p>
                <h1 className="mt-1 font-display text-3xl font-bold text-[#1E1035]">
                  {t('helpSupport')}
                </h1>
                <p className="mt-1.5 text-sm text-[#594A6B]">
                  {isBn ? (
                    <>
                      নমস্কার <strong className="text-[#1E1035]">{customerAccount.fullName}</strong>,
                      আমরা আপনাকে সাহায্য করতে প্রস্তুত! নিচ থেকে একটি বিষয় বেছে নিন অথবা সরাসরি হোয়াটসঅ্যাপে আমাদের সাপোর্ট টিমের সাথে কথা বলুন।
                    </>
                  ) : (
                    <>
                      Hi <strong className="text-[#1E1035]">{customerAccount.fullName}</strong>, we&apos;re
                      here to help! Select a topic below or chat with our support team directly on WhatsApp.
                    </>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-5 text-xs font-semibold text-[#594A6B]">
                  <a
                    href={`tel:+${cleanWhatsAppDigits(resolvedContact.supportPhone)}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-[#6A11CB]"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#6A11CB]" />
                    {resolvedContact.supportPhone}
                  </a>
                  <a
                    href={`mailto:${resolvedContact.supportEmail}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-[#6A11CB]"
                  >
                    <Mail className="h-3.5 w-3.5 text-[#6A11CB]" />
                    {resolvedContact.supportEmail}
                  </a>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#FF4D8D]" />
                    {t('storeLocationText')}
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
                    {isBn ? 'আমরা কীভাবে সাহায্য করতে পারি?' : 'What can we help you with?'}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#685782]">
                    {isBn
                      ? 'আপনার হোয়াটসঅ্যাপ সাপোর্ট মেসেজ আগে থেকে তৈরি করতে একটি বিষয় বেছে নিন।'
                      : 'Choose a topic to pre-fill your WhatsApp support message.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {DESKTOP_SUPPORT_TOPICS.map(({ id, labelKey, Icon }) => {
                    const label = t(labelKey);
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
                    {isBn
                      ? 'সংক্ষিপ্ত বার্তা / অর্ডার নম্বর (ঐচ্ছিক)'
                      : 'Brief Message / Order Number (Optional)'}
                  </label>
                  <textarea
                    id="desktop-support-note"
                    rows={3}
                    value={issueNote}
                    onChange={(e) => setIssueNote(e.target.value)}
                    placeholder={
                      isBn
                        ? 'আপনার অর্ডার নম্বর লিখুন অথবা আপনার প্রশ্ন বিস্তারিত জানান...'
                        : 'Share your Order # or describe your question...'
                    }
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
                        {t('connectWithGiftKart')}
                      </h2>
                      <p className="text-xs text-[#594A6B]">
                        {isBn
                          ? 'আমাদের জলচক সাপোর্ট ডেস্কের সাথে সরাসরি চ্যাট করুন।'
                          : 'Chat directly with our Jalchak support desk.'}
                      </p>
                    </div>
                  </div>

                  {selectedTopic && (
                    <p className="mt-3 rounded-lg bg-[#FAF5FF] px-3 py-1.5 text-xs font-semibold text-[#6A11CB]">
                      {isBn ? 'নির্বাচিত বিষয়' : 'Selected Topic'}: {selectedTopic}
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
                      <span>{t('chatOnWhatsApp')}</span>
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </a>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={settings?.socialLinks?.instagram?.trim() || 'https://www.instagram.com/giftkart.online'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#EBD8FF] bg-[#FAF6FF] text-xs font-bold text-[#6A11CB] transition-colors hover:bg-[#F3E8FF]"
                    >
                      <Instagram className="h-3.5 w-3.5" />
                      <span>Instagram</span>
                    </a>
                    <a
                      href={settings?.socialLinks?.facebook?.trim() || 'https://www.facebook.com/share/18v7Ev2crP/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/60 text-xs font-bold text-[#1877F2] transition-colors hover:bg-blue-50"
                    >
                      <Facebook className="h-3.5 w-3.5" />
                      <span>Facebook</span>
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#EFE3FF] bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7A6894]">
                    {t('quickLinks')}
                  </p>
                  <div className="mt-2.5 divide-y divide-[#F3EAFF] text-xs font-semibold">
                    {[
                      { label: t('myOrders'), to: '/my-orders' },
                      { label: t('faq'), to: '/faq' },
                      { label: t('returnsRefunds'), to: '/return-policy' },
                      { label: t('shippingDelivery'), to: '/shipping-policy' },
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

const FAQ_ITEMS_BN = [
  {
    q: 'কোন পণ্যগুলো রিটার্ন ও রিফান্ডের জন্য যোগ্য?',
    a: 'শুধুমাত্র সাধারণ, নন-কাস্টমাইজড পণ্য (যেগুলোতে কোনো ব্যক্তিগত ছবি, নাম বা কাস্টম প্রিন্ট নেই) ডেলিভারির ৭ দিনের মধ্যে অব্যবহৃত অবস্থায় এবং মূল প্যাকেজিংসহ রিটার্ন ও রিফান্ডের জন্য যোগ্য। ব্যক্তিগত ছবি বা নামযুক্ত কাস্টমাইজড পণ্য ফেরত বা রিফান্ডযোগ্য নয়, তবে ৪৮ ঘণ্টার মধ্যে যাচাইকৃত ক্ষতি বা ভুল পণ্য প্রদানের ক্ষেত্রে ব্যতিক্রম প্রযোজ্য।',
  },
  {
    q: 'আমি কখন আমার GiftKart অর্ডার বাতিল করতে পারব?',
    a: 'অর্ডারের স্ট্যাটাস "অর্ডার গৃহীত" (Order Placed) থাকা অবস্থায় আপনি সরাসরি "আমার অর্ডার" পেজ থেকে অর্ডার বাতিল করতে পারবেন। অর্ডার "প্রসেসিং" ধাপে চলে গেলে আর বাতিল করা সম্ভব নয়।',
  },
  {
    q: 'বর্তমানে কোন কোন পেমেন্ট পদ্ধতি চালু রয়েছে?',
    a: 'বর্তমানে ক্যাশ অন ডেলিভারি (COD) সম্পূর্ণ সক্রিয় রয়েছে। UPI অনলাইন পেমেন্ট সাময়িকভাবে বন্ধ আছে এবং পরবর্তী আপডেটে চালু করা হবে।',
  },
  {
    q: 'GiftKart বর্তমানে কোথায় কোথায় ডেলিভারি দেয়?',
    a: 'GiftKart বর্তমানে পশ্চিম মেদিনীপুরের জলচক এবং পার্শ্ববর্তী পিন কোডগুলোতে ডেলিভারি দেয়। ডিসপ্যাচের পর সাধারণত ১–৩ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।',
  },
  {
    q: 'আমার অর্ডারের স্ট্যাটাস কীভাবে দেখব?',
    a: 'নিচের নেভিগেশন বার বা আমার অ্যাকাউন্ট মেনু থেকে "আমার অর্ডার" বিভাগে গিয়ে আপনার সম্পূর্ণ অর্ডার ইতিহাস এবং লাইভ স্ট্যাটাস (অর্ডার গৃহীত, প্রসেসিং, শিপড, ডেলিভার্ড) দেখতে পারবেন।',
  },
  {
    q: 'গিফট র‍্যাপিং কীভাবে কাজ করে?',
    a: 'অর্ডার করার আগে প্রোডাক্ট পেজ বা কার্ট থেকে সহজেই প্রিমিয়াম গিফট র‍্যাপিং এবং ব্যক্তিগত বার্তা যুক্ত করতে পারবেন, যার মূল্য স্পষ্টভাবে টাকা (₹)-তে দেখানো হয়।',
  },
];

export function FaqPage() {
  const { language, t } = useLanguage();
  const isBn = language === 'bn';
  const faqList = isBn ? FAQ_ITEMS_BN : FAQ_ITEMS;
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl pb-2">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[12px] text-neutral-500"
      >
        <Link to="/" className="transition-colors hover:text-neutral-900">
          {t('home')}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-neutral-800">{t('faq')}</span>
      </nav>

      {/* Clean Document Header */}
      <header className="mt-2.5 border-b border-neutral-200 pb-4">
        <h1 className="text-[22px] font-bold tracking-tight text-neutral-900 sm:text-[26px]">
          {t('faq')}
        </h1>
        <p className="mt-1 text-[13px] text-neutral-600 sm:text-[13.5px]">
          {isBn
            ? 'রিটার্ন, বাতিলকরণ, ক্যাশ অন ডেলিভারি এবং জলচক ডেলিভারি সংক্রান্ত সাধারণ প্রশ্নের উত্তর।'
            : 'Answers regarding returns, cancellations, Cash on Delivery, and Jalchak delivery.'}
        </p>
      </header>

      {/* Minimal Hairline Accordion */}
      <div className="divide-y divide-neutral-200 border-b border-neutral-200">
        {faqList.map((item, idx) => {
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
        <span>
          {isBn
            ? 'আপনার অর্ডার নিয়ে আরও সহায়তার প্রয়োজন?'
            : 'Need further assistance with an existing order?'}
        </span>
        <div className="flex items-center gap-4">
          <Link
            to="/return-policy"
            className="text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
          >
            {t('returnsRefunds')}
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-0.5 font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
          >
            <span>{t('helpSupport')}</span>
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

const POLICY_CONTENT_BN: Record<PolicyType, PolicyDocument> = {
  return: {
    title: 'রিটার্ন ও রিফান্ড নীতিমালা',
    subtitle: 'সাধারণ ও কাস্টমাইজড ফটো উপহারের স্পষ্ট রিটার্ন নিয়মাবলী।',
    lastUpdated: 'নভেম্বর ২০২৬',
    highlights: [
      {
        tone: 'allowed',
        title: 'শুধুমাত্র নন-কাস্টমাইজড পণ্যের জন্য',
        detail:
          'যে পণ্যগুলোতে কোনো কাস্টম ছবি, নাম বা ব্যক্তিগত প্রিন্ট নেই, সেগুলো ডেলিভারির ৭ দিনের মধ্যে অব্যবহৃত ও মূল প্যাকেজিংসহ রিটার্ন ও রিফান্ড করা যাবে।',
      },
      {
        tone: 'restricted',
        title: 'কাস্টমাইজড ছবি / নামের পণ্য — রিটার্ন প্রযোজ্য নয়',
        detail:
          'গ্রাহকের ছবি, নাম বা ব্যক্তিগত বার্তা প্রিন্ট করা কোনো পণ্য ফেরত বা রিফান্ডযোগ্য নয় (কেবল ডেলিভারির ৪৮ ঘণ্টার মধ্যে যাচাইকৃত ক্ষতি বা ভুল পণ্য এলে ব্যতিক্রম প্রযোজ্য)।',
      },
    ],
    sections: [
      {
        heading: '১. রিটার্ন যোগ্যতা (নন-কাস্টমাইজড পণ্য)',
        body: 'শুধুমাত্র সাধারণ, রেডি-মেড নন-কাস্টমাইজড পণ্য ডেলিভারির ৭ দিনের মধ্যে রিটার্ন ও রিফান্ডের জন্য যোগ্য। এর জন্য নিচের শর্তগুলো পূরণ করতে হবে:',
        bullets: [
          'পণ্যটি সম্পূর্ণ অব্যবহৃত এবং প্রাপ্ত অবস্থায় অক্ষত থাকতে হবে।',
          'মূল GiftKart প্যাকেজিং, বক্স, ট্যাগ ও আনুষঙ্গিক সব কিছু অক্ষত থাকতে হবে।',
          '"আমার অর্ডার" বিভাগ থেকে অর্ডার নম্বর ও ক্রয়ের তথ্য প্রদান করতে হবে।',
        ],
      },
      {
        heading: '২. কাস্টমাইজড পণ্যের নন-রিটার্নেবল নীতি',
        body: 'ফটো ফ্রেম, কফি মগ, টি-শার্ট প্রিন্ট, এলইডি লাইটিং, হাতে তৈরি উপহার, কী-চেইন এবং পিভিসি কার্ড আপনার ব্যক্তিগত ছবি বা লেখা দিয়ে তৈরি করা হয় বলে এগুলো পুনরায় বিক্রি করা সম্ভব নয়। তাই মত পরিবর্তন বা গ্রাহকের ভুল বানান/ছবির কারণে এগুলো ফেরত বা রিফান্ড করা যাবে না।',
      },
      {
        heading: '৩. ক্ষতিগ্রস্ত, ত্রুটিপূর্ণ বা ভুল পণ্য প্রাপ্তি',
        body: 'যেকোনো পণ্য পরিবহনের সময় ভেঙে গেলে, প্রিন্টে বড় ধরনের ত্রুটি থাকলে অথবা ভুল পণ্য ডেলিভারি হলে ডেলিভারির ৪৮ ঘণ্টার মধ্যে হেল্প ও সাপোর্ট বিভাগে জানাতে হবে।',
        bullets: [
          'সিল করা পার্সেল ও শিপিং লেবেলসহ একটি অখণ্ড আনবক্সিং ভিডিও এবং স্পষ্ট ছবি শেয়ার করুন।',
          'আমাদের মান যাচাই দল বিষয়টি নিশ্চিত করলে GiftKart বিনামূল্যে প্রতিস্থাপন বা যথাযথ সমাধান প্রদান করবে।',
        ],
      },
      {
        heading: '৪. রিটার্ন পরীক্ষা ও রিফান্ড প্রক্রিয়া',
        body: 'যোগ্য নন-কাস্টমাইজড পণ্য আমাদের জলচক ডেস্কে পৌঁছানোর পর মান পরীক্ষায় উত্তীর্ণ হলে ৫–৭ কার্যদিবসের মধ্যে রিফান্ড সম্পন্ন করা হয়।',
        bullets: [
          'ক্যাশ অন ডেলিভারি (COD) অর্ডার: অনুমোদিত রিফান্ড আপনার যাচাইকৃত ব্যাংক অ্যাকাউন্ট বা UPI আইডিতে পাঠানো হবে।',
          'প্রিপেইড অর্ডার (চালু হলে): মূল পেমেন্ট মাধ্যমে রিফান্ড ফেরত যাবে।',
        ],
      },
    ],
  },
  cancellation: {
    title: 'বাতিলকরণ নীতিমালা',
    subtitle: 'সকল GiftKart অর্ডারের প্রসেসিং-পূর্ব বাতিলকরণ নির্দেশিকা।',
    lastUpdated: 'নভেম্বর ২০২৬',
    highlights: [
      {
        tone: 'allowed',
        title: 'প্রসেসিং শুরুর আগে বাতিল করা যাবে',
        detail:
          'অর্ডারের স্ট্যাটাস "অর্ডার গৃহীত" থাকা অবস্থায় যেকোনো সময় "আমার অর্ডার" পেজ থেকে অর্ডার বাতিল করতে পারবেন।',
      },
      {
        tone: 'restricted',
        title: 'প্রসেসিং শুরু হলে বাতিল করা যাবে না',
        detail:
          'অর্ডার "প্রসেসিং" ধাপে চলে গেলে প্রিন্টিং ও প্যাকেজিং শুরু হয়ে যায়—তখন আর অর্ডার বাতিল করা সম্ভব নয়।',
      },
    ],
    sections: [
      {
        heading: '১. কখন অর্ডার বাতিল করা যাবে',
        body: 'অর্ডারের স্ট্যাটাস "অর্ডার গৃহীত" (Order Placed) থাকা অবস্থায় কোনো চার্জ ছাড়াই অর্ডার বাতিল করা যাবে।',
      },
      {
        heading: '২. প্রসেসিং শুরুর পর বাতিল নিষিদ্ধ',
        body: 'আমাদের টিম অর্ডারটি "প্রসেসিং", "শিপড" বা পরবর্তী ধাপে নিয়ে গেলে কোনো অবস্থাতেই অর্ডার বাতিল করা যাবে না।',
      },
      {
        heading: '৩. কীভাবে অর্ডার বাতিল করবেন',
        body: '"আমার অর্ডার" পেজ খুলুন, আপনার অর্ডারটি নির্বাচন করুন এবং "অর্ডার বাতিল করুন" বোতামে চাপুন। বোতামটি না থাকলে বুঝতে হবে অর্ডার প্রসেসিং শুরু হয়ে গেছে।',
      },
      {
        heading: '৪. অর্ডারের আগে কাস্টমাইজেশন তথ্য যাচাই করুন',
        body: 'চেকআউট নিশ্চিত করার আগে পণ্যের ধরন, সাইজ, কাস্টম নাম/বার্তার বানান, ছবি এবং ডেলিভারি ঠিকানা ভালোভাবে মিলিয়ে নিন।',
      },
    ],
  },
  shipping: {
    title: 'শিপিং ও ডেলিভারি নীতিমালা',
    subtitle: 'ডিসপ্যাচ সময়সীমা, জলচক ডেলিভারি এলাকা এবং নিরাপদ প্যাকেজিং।',
    lastUpdated: 'নভেম্বর ২০২৬',
    highlights: [
      {
        tone: 'info',
        title: 'সেবা এলাকা ও স্বচ্ছ মূল্য',
        detail:
          'জলচক, পশ্চিম মেদিনীপুর, পশ্চিমবঙ্গ এবং পার্শ্ববর্তী পিন কোডগুলোতে নির্ভরযোগ্য স্থানীয় ডেলিভারি।',
      },
    ],
    sections: [
      {
        heading: '১. ডেলিভারি এলাকা',
        body: 'GiftKart বর্তমানে জলচক, পশ্চিম মেদিনীপুর, পশ্চিমবঙ্গ এবং নিকটবর্তী পিন কোডগুলোতে ডেলিভারি প্রদান করে। দ্রুত ডেলিভারির জন্য সঠিক ঠিকানা, ল্যান্ডমার্ক ও ৬-অঙ্কের পিন কোড লিখুন।',
      },
      {
        heading: '২. প্রসেসিং ও প্রস্তুতির সময়',
        body: 'প্রতিটি উপহার অত্যন্ত যত্নসহকারে প্যাক করা হয়:',
        bullets: [
          'সাধারণ নন-কাস্টমাইজড পণ্য: অর্ডার নিশ্চিত হওয়ার ২৪ ঘণ্টার মধ্যে ডিসপ্যাচ করা হয়।',
          'কাস্টমাইজড ফটো ও পার্সোনালাইজড উপহার: প্রিন্টিং, ফিনিশিং ও মান পরীক্ষার জন্য ১–২ কার্যদিবস সময় লাগে।',
        ],
      },
      {
        heading: '৩. আনুমানিক ডেলিভারি সময় ও চার্জ',
        body: 'ডিসপ্যাচের পর সাধারণত ১–৩ কার্যদিবসের মধ্যে অর্ডার পৌঁছে দেওয়া হয়। উৎসব বা প্রতিকূল আবহাওয়ায় সময় সামান্য পরিবর্তিত হতে পারে। প্রযোজ্য ডেলিভারি চার্জ বা ফ্রি ডেলিভারি চেকআউটে স্পষ্টভাবে দেখানো হয়।',
      },
      {
        heading: '৪. ক্যাশ অন ডেলিভারি (COD) ও যাচাইকরণ',
        body: 'ডেলিভারির সময় যোগাযোগের জন্য আপনার মোবাইল নম্বর সচল রাখুন এবং COD অর্ডারের ক্ষেত্রে নির্ধারিত অর্থ প্রস্তুত রাখুন।',
      },
    ],
  },
  privacy: {
    title: 'গোপনীয়তা নীতি',
    subtitle: 'GiftKart কীভাবে আপনার ব্যক্তিগত তথ্য ও কাস্টম ছবি সুরক্ষিত রাখে।',
    lastUpdated: 'নভেম্বর ২০২৬',
    highlights: [
      {
        tone: 'info',
        title: 'আপনার তথ্য ও ব্যক্তিগত ছবি সম্পূর্ণ গোপনীয়',
        detail:
          'আমরা কেবল আপনার উপহার তৈরি ও ডেলিভারির জন্য প্রয়োজনীয় তথ্য সংগ্রহ করি। আপনার তথ্য বা আপলোড করা ছবি কখনোই তৃতীয় পক্ষের কাছে বিক্রি করা হয় না।',
      },
    ],
    sections: [
      {
        heading: '১. আমরা যে তথ্য সংগ্রহ করি',
        body: 'অ্যাকাউন্ট তৈরি, ঠিকানা সংরক্ষণ বা অর্ডার করার সময় আমরা কেবল প্রয়োজনীয় তথ্য সংগ্রহ করি:',
        bullets: [
          'যোগাযোগের তথ্য: সম্পূর্ণ নাম, মোবাইল নম্বর এবং ইমেইল ঠিকানা।',
          'ডেলিভারি তথ্য: বাড়ি/রাস্তার ঠিকানা, ল্যান্ডমার্ক, এলাকা, শহর, রাজ্য ও পিন কোড।',
          'অর্ডার ও কাস্টমাইজেশন তথ্য: নির্বাচিত পণ্য, গিফট বার্তা ও প্রিন্টের জন্য আপলোড করা ছবি।',
        ],
      },
      {
        heading: '২. আপলোড করা ছবির কঠোর গোপনীয়তা',
        body: 'ফটো ফ্রেম, মগ, টি-শার্ট বা অন্য যেকোনো উপহারের জন্য আপলোড করা ছবি কেবল আপনার অর্ডার প্রিন্ট ও প্রস্তুত করার কাজেই ব্যবহৃত হয়। আপনার অনুমতি ছাড়া কখনোই এগুলো প্রকাশ বা শেয়ার করা হয় না।',
      },
      {
        heading: '৩. তথ্যের ব্যবহার ও সুরক্ষা',
        body: 'অর্ডার নিশ্চিতকরণ, ডেলিভারি সমন্বয়, অর্ডার আপডেট পাঠানো এবং কাস্টমার সাপোর্ট দেওয়ার জন্য এই তথ্য ব্যবহার করা হয়। আপনি যেকোনো সময় "আমার অ্যাকাউন্ট" থেকে আপনার প্রোফাইল ও ঠিকানা পরিবর্তন বা মুছে ফেলতে পারবেন।',
      },
    ],
  },
  terms: {
    title: 'শর্তাবলী ও নিয়মাবলী',
    subtitle: 'GiftKart ওয়েবসাইট ব্যবহার ও অর্ডার সংক্রান্ত আইনি শর্তাবলী।',
    lastUpdated: 'নভেম্বর ২০২৬',
    highlights: [
      {
        tone: 'info',
        title: 'স্বচ্ছ ও ন্যায্য কেনাকাটার নিয়মাবলী',
        detail:
          'GiftKart-এ অর্ডার করার মাধ্যমে আপনি আমাদের স্বচ্ছ মূল্য, প্রসেসিং-পূর্ব বাতিলকরণ নিয়ম এবং কাস্টমাইজড উপহারের নন-রিটার্নেবল শর্তে সম্মত হচ্ছেন।',
      },
    ],
    sections: [
      {
        heading: '১. শর্তাবলীর সম্মতি',
        body: 'GiftKart ওয়েবসাইট ব্যবহার বা অর্ডার করার মাধ্যমে আপনি এই শর্তাবলী এবং আমাদের রিটার্ন, বাতিলকরণ, শিপিং ও গোপনীয়তা নীতিতে সম্মত হচ্ছেন।',
      },
      {
        heading: '২. সঠিক গ্রাহক তথ্য',
        body: 'সফল ডেলিভারির জন্য সঠিক নাম, সচল ১০-অঙ্কের মোবাইল নম্বর, সম্পূর্ণ ঠিকানা ও সঠিক পিন কোড প্রদান করা আপনার দায়িত্ব।',
      },
      {
        heading: '৩. মূল্য, অফার ও পেমেন্ট',
        body: 'সকল পণ্যের মূল্য ভারতীয় টাকা (₹)-তে প্রদর্শিত হয়। কুপন কোড নির্ধারিত মেয়াদ ও শর্ত সাপেক্ষে প্রযোজ্য। বর্তমানে ক্যাশ অন ডেলিভারি (COD) চালু রয়েছে।',
      },
      {
        heading: '৪. কাস্টমাইজড অর্ডার ও মেধাস্বত্ব',
        body: 'কাস্টমাইজেশনের জন্য আপলোড করা ছবি বা লেখার বৈধ অধিকার আপনার থাকতে হবে। ডিজিটাল স্ক্রিন ও বাস্তব প্রিন্টের রঙে সামান্য স্বাভাবিক পার্থক্য থাকতে পারে। GiftKart-এর সকল লোগো, ডিজাইন ও কনটেন্ট GiftKart-এর নিজস্ব সম্পত্তি।',
      },
      {
        heading: '৫. প্রযোজ্য আইন',
        body: 'এই শর্তাবলী ভারতের আইন অনুযায়ী পরিচালিত এবং যেকোনো বিরোধ পশ্চিম মেদিনীপুর, পশ্চিমবঙ্গের উপযুক্ত আদালতের এখতিয়ারভুক্ত হবে।',
      },
    ],
  },
};

function getHighlightLabel(
  type: PolicyType,
  tone: PolicyHighlightItem['tone'],
  isBn: boolean
) {
  if (tone === 'allowed') {
    if (isBn) return type === 'cancellation' ? 'অনুমোদিত' : 'যোগ্য';
    return type === 'cancellation' ? 'Allowed' : 'Eligible';
  }
  if (tone === 'restricted') {
    if (isBn) return type === 'cancellation' ? 'অনুমোদিত নয়' : 'প্রযোজ্য নয়';
    return type === 'cancellation' ? 'Not Allowed' : 'Not Eligible';
  }
  return isBn ? 'নীতির পরিসর' : 'Policy Scope';
}

export function PolicyPage({ type }: { type: PolicyType }) {
  const { data: settings } = useStoreSettings();
  const { language, t } = useLanguage();
  const isBn = language === 'bn';
  const content = isBn ? POLICY_CONTENT_BN[type] : POLICY_CONTENT[type];
  const localizedTitle =
    type === 'return'
      ? t('returnsRefunds')
      : type === 'shipping'
        ? t('shippingDelivery')
        : type === 'privacy'
          ? t('privacyPolicy')
          : type === 'terms'
            ? t('termsConditions')
            : content.title;

  const localizedPolicyTabs: { type: PolicyType; label: string; to: string }[] = isBn
    ? [
        { type: 'return', label: 'রিটার্ন ও রিফান্ড', to: '/return-policy' },
        { type: 'cancellation', label: 'বাতিলকরণ', to: '/cancellation-policy' },
        { type: 'shipping', label: 'শিপিং', to: '/shipping-policy' },
        { type: 'privacy', label: 'গোপনীয়তা', to: '/privacy-policy' },
        { type: 'terms', label: 'শর্তাবলী', to: '/terms' },
      ]
    : POLICY_TABS;

  const customPolicyNote = isBn
    ? ''
    : type === 'privacy'
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
          {t('home')}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{t('footerPolicies')}</span>
        <span aria-hidden="true">/</span>
        <span className="truncate text-neutral-800">{localizedTitle}</span>
      </nav>

      {/* Mobile Policy Switcher — Clean Underline Tabs (No Pills / No Gradients) */}
      <nav
        aria-label="GiftKart legal policies"
        className="no-scrollbar mt-2 flex items-center gap-5 overflow-x-auto border-b border-neutral-200 lg:hidden"
      >
        {localizedPolicyTabs.map((tab) => {
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
              {isBn ? 'আইনি ও নীতিমালা' : 'Legal & Policies'}
            </p>
            <nav
              aria-label="Policy navigation"
              className="mt-2 flex flex-col space-y-0.5"
            >
              {localizedPolicyTabs.map((tab) => {
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
                {isBn ? 'তথ্য' : 'Information'}
              </p>
              <div className="mt-2 flex flex-col space-y-0.5 text-[13px]">
                <Link
                  to="/about"
                  className="rounded px-2.5 py-1.5 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                  {t('aboutUs')}
                </Link>
                <Link
                  to="/faq"
                  className="rounded px-2.5 py-1.5 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                  {t('faq')}
                </Link>
                <Link
                  to="/contact"
                  className="rounded px-2.5 py-1.5 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                  {t('helpSupport')}
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
              {localizedTitle}
            </h1>
            <p className="mt-1 text-[13px] text-neutral-600 sm:text-[14px]">
              {content.subtitle}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-neutral-500">
              <span>{settings?.storeName || 'GiftKart'} {isBn ? 'ভারত' : 'India'}</span>
              <span aria-hidden="true">·</span>
              <span>
                {isBn
                  ? `সর্বশেষ আপডেট: ${content.lastUpdated}`
                  : `Last updated ${content.lastUpdated}`}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isBn
                  ? 'সকল GiftKart অর্ডারের জন্য প্রযোজ্য'
                  : 'Applicable to all GiftKart orders'}
              </span>
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
                {isBn ? 'এক নজরে সারসংক্ষেপ' : 'Summary at a Glance'}
              </div>
              <div className="divide-y divide-neutral-200">
                {content.highlights.map((item) => {
                  const statusColor =
                    item.tone === 'allowed'
                      ? 'text-emerald-700'
                      : item.tone === 'restricted'
                        ? 'text-[#C81E68]'
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
                          {getHighlightLabel(type, item.tone, isBn)}
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
                {t('footerSupport')}:
              </span>{' '}
              <span>
                {normalizeOfficialContactFields({
                  supportEmail: settings?.supportEmail,
                  supportPhone: settings?.supportPhone,
                  contactVersion: settings?.contactVersion,
                  socialLinks: settings?.socialLinks,
                }).supportEmail}
              </span>
              <span className="mx-1.5 text-neutral-400" aria-hidden="true">
                ·
              </span>
              <span className="tabular-nums">
                {normalizeOfficialContactFields({
                  supportEmail: settings?.supportEmail,
                  supportPhone: settings?.supportPhone,
                  contactVersion: settings?.contactVersion,
                  socialLinks: settings?.socialLinks,
                }).supportPhone}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/my-orders"
                className="text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
              >
                {t('myOrders')}
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-0.5 font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
              >
                <span>{t('helpSupport')}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
