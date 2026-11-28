import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  Facebook,
  Headset,
  Info,
  Instagram,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Truck,
  Youtube,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { BRAND_ASSETS } from '../../config/appConfig';
import { OFFICIAL_STORE_DELIVERY_ADDRESS } from '../../config/seedData';
import { useStoreSettings } from '../../hooks/useStoreData';
import { useLanguage } from '../../context/LanguageContext';
import {
  cleanWhatsAppDigits,
  normalizeOfficialContactFields,
} from '../../utils/storefrontHelpers';

export function StorefrontFooter() {
  const { data: settings } = useStoreSettings();
  const { language, t, translateCategory } = useLanguage();
  const { pathname } = useLocation();
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const isHome = pathname === '/';

  const QUICK_LINKS = [
    { label: t('home'), to: '/' },
    { label: t('allGifts'), to: '/shop' },
    { label: translateCategory('Photo Frames'), to: '/category/photo-frame' },
    { label: translateCategory('Coffee Mugs'), to: '/category/coffee-mugs' },
    { label: translateCategory('LED Lamps'), to: '/category/led-lighting' },
    { label: t('categories'), to: '/categories' },
  ];

  const SUPPORT_LINKS = [
    { label: t('contactUs'), to: '/contact' },
    { label: t('faq'), to: '/faq' },
    { label: t('returnsRefunds'), to: '/return-policy' },
    { label: t('shippingDelivery'), to: '/shipping-policy' },
    { label: t('privacyPolicy'), to: '/privacy-policy' },
    { label: t('termsConditions'), to: '/terms' },
  ];

  const ABOUT_LINKS = [
    { label: t('aboutUs'), to: '/about' },
    { label: t('customizationStudio'), to: '/customization-guide' },
    { label: t('contactSupport'), to: '/contact' },
  ];

  const officialDeliveryAddress = OFFICIAL_STORE_DELIVERY_ADDRESS;

  const socialLinks = settings?.socialLinks;
  const resolvedContact = normalizeOfficialContactFields({
    supportEmail: settings?.supportEmail,
    supportPhone: settings?.supportPhone,
    contactVersion: settings?.contactVersion,
    socialLinks,
  });
  const instagramUrl =
    socialLinks?.instagram?.trim() || 'https://www.instagram.com/giftkart.online';
  const facebookUrl =
    socialLinks?.facebook?.trim() || 'https://www.facebook.com/share/18v7Ev2crP/';
  const whatsappUrl = resolvedContact.whatsappUrl;
  const youtubeUrl = socialLinks?.youtube?.trim() || '';
  const supportEmail = resolvedContact.supportEmail;
  const supportPhone = resolvedContact.supportPhone;
  const supportPhoneTel = `tel:+${cleanWhatsAppDigits(supportPhone)}`;

  const rawFooterDesc = settings?.footerContent?.description?.trim();
  const isDefaultEnglishDesc =
    !rawFooterDesc || rawFooterDesc.startsWith('Har Gift Mein Ek Kahani');
  const footerDesc =
    language === 'en'
      ? rawFooterDesc || t('footerDefaultDesc')
      : isDefaultEnglishDesc
        ? t('footerDefaultDesc')
        : rawFooterDesc;

  const rawCopyright = settings?.footerContent?.copyrightText?.trim();
  const isDefaultEnglishCopyright =
    !rawCopyright ||
    rawCopyright === '© 2026 GiftKart. All Rights Reserved.' ||
    rawCopyright === '© GiftKart. All rights reserved.';
  const copyrightText =
    language === 'en'
      ? rawCopyright || t('footerDefaultCopyright')
      : isDefaultEnglishCopyright
        ? t('footerDefaultCopyright')
        : rawCopyright;
  const footerLogoSrc = settings?.logoUrl?.trim() || BRAND_ASSETS.logo;

  const socialItems = [
    { label: 'Instagram', href: instagramUrl, Icon: Instagram, bg: 'bg-[#6A11CB]/10 text-[#6A11CB]' },
    { label: 'Facebook', href: facebookUrl, Icon: Facebook, bg: 'bg-[#6A11CB]/10 text-[#6A11CB]' },
    { label: 'WhatsApp', href: whatsappUrl, Icon: MessageCircle, bg: 'bg-[#25D366]/15 text-[#15803D]' },
    ...(youtubeUrl
      ? [{ label: 'YouTube', href: youtubeUrl, Icon: Youtube, bg: 'bg-[#FF4D8D]/12 text-[#FF4D8D]' }]
      : []),
  ];

  const socialButtons = (
    <div className="flex items-center gap-2">
      {socialItems.map(({ label, href, Icon, bg }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`GiftKart on ${label}`}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:opacity-80 ${bg}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );

  const toggleGroup = (id: string) => {
    setOpenMobileGroup((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {!isHome && (
        <div
          aria-hidden="true"
          className="h-[calc(82px+env(safe-area-inset-bottom,0px))] bg-transparent lg:hidden"
        />
      )}
      <footer
        className={`gk-footer-gradient relative overflow-hidden border-t border-[#EBD8FF] ${
          isHome ? 'pb-[calc(82px+env(safe-area-inset-bottom,0px))] lg:pb-0' : 'hidden lg:block'
        }`}
      >
      {/* COMPACT DESKTOP 5-COLUMN FOOTER */}
      <div className="mx-auto hidden max-w-7xl px-6 py-6 lg:block">
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Column 1: Brand + Short Copy + Social */}
          <div className="col-span-3">
            <Link to="/" aria-label="GiftKart Home" className="inline-block">
              <BrandLogo size="sm" showTagline />
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-[#594A6B]">
              {footerDesc}
            </p>
            <div className="mt-3">{socialButtons}</div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#2B0B4E]">
              {t('quickLinks')}
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs font-medium text-[#594A6B]">
              {QUICK_LINKS.map((item) => (
                <li key={item.to + item.label}>
                  <Link to={item.to} className="transition-colors hover:text-[#6A11CB]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Support */}
          <div className="col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#2B0B4E]">
              {t('footerSupport')}
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs font-medium text-[#594A6B]">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors hover:text-[#6A11CB]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: About GiftKart */}
          <div className="col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#2B0B4E]">
              {t('footerCompany')}
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs font-medium text-[#594A6B]">
              {ABOUT_LINKS.map((item) => (
                <li key={item.to + item.label}>
                  <Link to={item.to} className="transition-colors hover:text-[#6A11CB]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Delivery & Contact */}
          <div className="col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#2B0B4E]">
              {t('deliveryInfo')}
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs font-semibold text-[#2B0B4E]">
              <li className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF4D8D]" />
                <span>{officialDeliveryAddress}</span>
              </li>
            </ul>
            <div className="mt-3 space-y-1.5 text-xs text-[#594A6B]">
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-1.5 transition-colors hover:text-[#6A11CB]"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
                <span>{supportEmail}</span>
              </a>
              <a
                href={supportPhoneTel}
                className="flex items-center gap-1.5 transition-colors hover:text-[#6A11CB]"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
                <span>{supportPhone}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT TWO-COLUMN MOBILE FOOTER (Normal Mobile < 900px — Home Page Only) */}
      {isHome && (
      <>
      <div className="bg-gradient-to-br from-[#F5E8FF] via-[#F2E3FF] to-[#EFE0FF] px-2.5 py-3 lg:hidden">
        <div className="grid grid-cols-[minmax(0,41%)_1px_minmax(0,59%)] items-center gap-2">
          {/* Left Column: Official GiftKart Logo (with Tagline) + 3 Social Icons Only */}
          <div className="flex flex-col items-center justify-center text-center">
            <Link
              to="/"
              aria-label="GiftKart — Har Gift Mein Ek Kahani."
              className="inline-flex items-center justify-center"
            >
              <img
                src={footerLogoSrc}
                alt={`${settings?.storeName || 'GiftKart'} — ${settings?.tagline || 'Har Gift Mein Ek Kahani.'}`}
                referrerPolicy="no-referrer"
                className="h-auto w-full max-w-[132px] object-contain select-none min-[390px]:max-w-[146px]"
              />
            </Link>

            <div className="mt-2.5 flex items-center justify-center gap-2 min-[390px]:gap-2.5">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GiftKart on Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-xs transition-transform active:scale-95 min-[390px]:h-9 min-[390px]:w-9"
              >
                <Instagram className="h-4 w-4 stroke-[2.2]" />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GiftKart on Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-xs transition-transform active:scale-95 min-[390px]:h-9 min-[390px]:w-9"
              >
                <Facebook className="h-4 w-4 fill-white stroke-white stroke-[1.5]" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GiftKart on WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs transition-transform active:scale-95 min-[390px]:h-9 min-[390px]:w-9"
              >
                <MessageCircle className="h-4 w-4 stroke-[2.2]" />
              </a>
            </div>
          </div>

          {/* Thin Vertical Lavender Divider */}
          <div aria-hidden="true" className="my-1 w-[1px] self-stretch bg-[#C8A8EC]/70" />

          {/* Right Column: 4 Compact Interactive Accordions */}
          <div className="min-w-0 space-y-1.5">
            {[
              { id: 'quick', title: t('quickLinks'), Icon: Link2, links: QUICK_LINKS },
              { id: 'support', title: t('footerSupport'), Icon: Headset, links: SUPPORT_LINKS },
              { id: 'about', title: t('aboutUs'), Icon: Info, links: ABOUT_LINKS },
            ].map(({ id, title, Icon, links }) => {
              const isOpen = openMobileGroup === id;
              return (
                <div
                  key={id}
                  className={`overflow-hidden border border-[#E5D3FF]/90 bg-white/78 shadow-[0_2px_8px_-4px_rgba(106,17,203,0.14)] transition-all ${
                    isOpen ? 'rounded-2xl' : 'rounded-full'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(id)}
                    aria-expanded={isOpen}
                    className="flex min-h-[32px] w-full items-center justify-between gap-1.5 px-2 py-1 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFE2FF] text-[#5B11B8] min-[390px]:h-6 min-[390px]:w-6">
                        <Icon className="h-3 w-3 stroke-[2.1] min-[390px]:h-3.5 min-[390px]:w-3.5" />
                      </span>
                      <span className="truncate text-[11px] font-bold text-[#2B0B4E] min-[390px]:text-[11.5px]">
                        {title}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 text-[#5B11B8] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="space-y-1 border-t border-[#EFE3FF] px-3 py-2 text-[11px] font-medium text-[#4A3860]">
                      {links.map((item) => (
                        <li key={item.label}>
                          <Link
                            to={item.to}
                            className="block py-0.5 transition-colors hover:text-[#6A11CB]"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {/* 4th Accordion: We Deliver To */}
            <div
              className={`overflow-hidden border border-[#E5D3FF]/90 bg-white/78 shadow-[0_2px_8px_-4px_rgba(106,17,203,0.14)] transition-all ${
                openMobileGroup === 'deliver' ? 'rounded-2xl' : 'rounded-full'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleGroup('deliver')}
                aria-expanded={openMobileGroup === 'deliver'}
                className="flex min-h-[32px] w-full items-center justify-between gap-1.5 px-2 py-1 text-left"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFE2FF] text-[#5B11B8] min-[390px]:h-6 min-[390px]:w-6">
                    <Truck className="h-3 w-3 stroke-[2.1] min-[390px]:h-3.5 min-[390px]:w-3.5" />
                  </span>
                  <span className="truncate text-[11px] font-bold text-[#2B0B4E] min-[390px]:text-[11.5px]">
                    {t('deliveryInfo')}
                  </span>
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-[#5B11B8] transition-transform duration-200 ${
                    openMobileGroup === 'deliver' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openMobileGroup === 'deliver' && (
                <div className="space-y-1 border-t border-[#EFE3FF] px-3 py-2 text-[11px] text-[#4A3860]">
                  <p className="flex items-center gap-1.5 font-semibold text-[#2B0B4E]">
                    <MapPin className="h-3 w-3 shrink-0 text-[#FF4D8D]" />
                    <span>{officialDeliveryAddress}</span>
                  </p>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="block break-all text-[10.5px] leading-snug text-[#594A6B] hover:text-[#6A11CB]"
                  >
                    {supportEmail}
                  </a>
                  <a
                    href={supportPhoneTel}
                    className="block text-[10.5px] leading-snug text-[#594A6B] hover:text-[#6A11CB]"
                  >
                    {supportPhone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Purple Copyright Bar — Mobile Only (< 900px, Home Page Only) */}
      <div className="bg-[#6A11CB] px-3 py-2 text-center text-[10px] font-medium text-white min-[390px]:text-[10.5px] lg:hidden">
        <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 leading-snug">
          <span>{copyrightText}</span>
          <span className="text-white/55">|</span>
          <span>{t('madeInIndia')} 🇮🇳</span>
        </p>
      </div>
      </>
      )}

      {/* Compact Solid Royal Purple Bottom Bar — Desktop Only (>= 900px, Unchanged) */}
      <div className="hidden bg-[#6A11CB] px-4 py-2 text-center text-[11px] font-medium text-white lg:block">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-2.5">
          <span>{copyrightText}</span>
          <span className="hidden text-white/40 sm:inline">|</span>
          <span>{t('madeInBengal')}</span>
          <span className="hidden text-white/40 sm:inline">|</span>
          <span className="text-white/85">{officialDeliveryAddress}</span>
        </div>
      </div>
      </footer>
    </>
  );
}
