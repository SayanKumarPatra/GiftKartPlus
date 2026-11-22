import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Youtube,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { BRAND_ASSETS } from '../../config/appConfig';
import { useStoreSettings } from '../../hooks/useStoreData';

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Customize', to: '/customize' },
  { label: 'Occasions', to: '/shop?occasion=Birthday' },
  { label: 'Accessories', to: '/category/personalized-accessories' },
  { label: 'All 15 Categories', to: '/categories' },
];

const SUPPORT_LINKS = [
  { label: 'Contact Us', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Return & Refund', to: '/return-policy' },
  { label: 'Cancellation Policy', to: '/cancellation-policy' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms & Conditions', to: '/terms' },
];

const ABOUT_LINKS = [
  { label: 'About Us', to: '/about' },
  { label: 'Our Story', to: '/about' },
  { label: 'Customization Guide', to: '/customization-guide' },
  { label: 'Track Order', to: '/track-order' },
  { label: 'Careers (Contact Us)', to: '/contact' },
];

export function StorefrontFooter() {
  const { data: settings } = useStoreSettings();
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>('quick');

  const activeZones =
    settings?.deliveryZones.filter((z) => z.isActive).map((z) => z.name) ?? [
      'Jalchak',
    ];

  const socialButtons = (
    <div className="flex items-center gap-2.5">
      {[
        { label: 'YouTube', Icon: Youtube, bg: 'bg-[#FF4D8D]/15 text-[#FF4D8D]' },
        { label: 'Instagram', Icon: Instagram, bg: 'bg-[#6A11CB]/12 text-[#6A11CB]' },
        { label: 'Facebook', Icon: Facebook, bg: 'bg-[#6A11CB]/12 text-[#6A11CB]' },
        { label: 'WhatsApp', Icon: MessageCircle, bg: 'bg-[#FF4D8D]/15 text-[#FF4D8D]' },
      ].map(({ label, Icon, bg }) => (
        <a
          key={label}
          href="#social-placeholder"
          onClick={(e) => e.preventDefault()}
          aria-label={`GiftKart on ${label}`}
          title={`${label} (Editable social link placeholder)`}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105 ${bg}`}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );

  const toggleGroup = (id: string) => {
    setOpenMobileGroup((prev) => (prev === id ? null : id));
  };

  return (
    <footer className="gk-footer-gradient relative overflow-hidden border-t border-[#EBD8FF] pb-[64px] lg:pb-0">
      {/* DESKTOP 5-COLUMN FOOTER */}
      <div className="relative mx-auto hidden max-w-7xl px-6 py-8 lg:block">
        <div className="grid grid-cols-12 gap-8">
          {/* Column 1: Brand Logo + Tagline + Description + Social */}
          <div className="col-span-3">
            <Link to="/" aria-label="GiftKart Home">
              <BrandLogo size="md" showTagline />
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-[#594A6B]">
              Har Gift Mein Ek Kahani. Personalized coffee mugs, printed T-shirts, illuminated photo frames, and boutique gift wrapping for Jalchak.
            </p>
            <div className="mt-4">{socialButtons}</div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-span-2">
            <h3 className="text-sm font-extrabold text-[#2B0B4E]">Quick Links</h3>
            <ul className="mt-3.5 space-y-2 text-xs font-medium text-[#594A6B]">
              {QUICK_LINKS.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="transition-colors hover:text-[#6A11CB]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Support */}
          <div className="col-span-2">
            <h3 className="text-sm font-extrabold text-[#2B0B4E]">Customer Support</h3>
            <ul className="mt-3.5 space-y-2 text-xs font-medium text-[#594A6B]">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="transition-colors hover:text-[#6A11CB]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: About GiftKart */}
          <div className="col-span-2">
            <h3 className="text-sm font-extrabold text-[#2B0B4E]">About GiftKart</h3>
            <ul className="mt-3.5 space-y-2 text-xs font-medium text-[#594A6B]">
              {ABOUT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="transition-colors hover:text-[#6A11CB]">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/admin" className="font-bold text-[#6A11CB] hover:text-[#FF4D8D]">
                  Admin Panel (/admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: We Deliver To */}
          <div className="col-span-3">
            <h3 className="text-sm font-extrabold text-[#2B0B4E]">We Deliver To</h3>
            <ul className="mt-3.5 space-y-2 text-xs font-semibold text-[#2B0B4E]">
              {activeZones.map((zone) => (
                <li key={zone} className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#FF4D8D]" />
                  <span>{zone}, West Bengal</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 text-xs text-[#594A6B]">
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#6A11CB]" />
                <span>{settings?.supportEmail ?? 'demo@giftkart.in'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#6A11CB]" />
                <span>{settings?.supportPhone ?? '+91 9382040746'}</span>
              </p>
            </div>
            <img
              src={BRAND_ASSETS.giftCartIllustration}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="mt-4 h-16 w-auto object-contain opacity-95"
            />
          </div>
        </div>
      </div>

      {/* MOBILE ACCORDION FOOTER */}
      <div className="px-3.5 py-5 lg:hidden">
        <div className="flex flex-col items-center text-center">
          <Link to="/" aria-label="GiftKart Home">
            <BrandLogo size="md" showTagline />
          </Link>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#594A6B]">
            Personalized gifts crafted with love for Jalchak, West Bengal.
          </p>
          <div className="mt-3">{socialButtons}</div>
        </div>

        <div className="mt-4 divide-y divide-[#EBD8FF] rounded-2xl border border-[#EBD8FF] bg-white/80">
          {[
            { id: 'quick', title: 'Quick Links', links: QUICK_LINKS },
            { id: 'support', title: 'Customer Support', links: SUPPORT_LINKS },
            {
              id: 'about',
              title: 'About GiftKart',
              links: [...ABOUT_LINKS, { label: 'Admin Panel (/admin)', to: '/admin' }],
            },
          ].map((group) => {
            const isOpen = openMobileGroup === group.id;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-[46px] w-full items-center justify-between px-4 text-left text-sm font-bold text-[#2B0B4E]"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#6A11CB] transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <ul className="space-y-2 px-4 pb-4 text-xs font-medium text-[#594A6B]">
                    {group.links.map((item) => (
                      <li key={item.label}>
                        <Link to={item.to} className="block py-0.5 hover:text-[#6A11CB]">
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {/* Mobile Accordion: We Deliver To */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup('deliver')}
              aria-expanded={openMobileGroup === 'deliver'}
              className="flex min-h-[46px] w-full items-center justify-between px-4 text-left text-sm font-bold text-[#2B0B4E]"
            >
              <span>We Deliver To</span>
              <ChevronDown
                className={`h-4 w-4 text-[#6A11CB] transition-transform ${
                  openMobileGroup === 'deliver' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openMobileGroup === 'deliver' && (
              <div className="space-y-2 px-4 pb-4 text-xs text-[#594A6B]">
                {activeZones.map((zone) => (
                  <p key={zone} className="flex items-center gap-2 font-semibold text-[#2B0B4E]">
                    <MapPin className="h-3.5 w-3.5 text-[#FF4D8D]" />
                    <span>{zone}, West Bengal</span>
                  </p>
                ))}
                <p className="pt-1 text-[11px]">
                  {settings?.supportEmail ?? 'demo@giftkart.in'} ·{' '}
                  {settings?.supportPhone ?? '+91 9382040746'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Bengal Bridge Silhouette Divider */}
      <div aria-hidden="true" className="mx-auto max-w-7xl px-4 sm:px-6">
        <svg
          viewBox="0 0 1200 72"
          fill="none"
          className="h-7 w-full text-[#6A11CB]/20 sm:h-10"
          preserveAspectRatio="none"
        >
          <path
            d="M0 70 H720 L745 44 L770 70 H815 L865 18 L915 70 H990 L1055 12 L1120 70 H1200"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d="M865 18 L865 70 M1055 12 L1055 70 M865 28 L1055 28 M890 48 L1030 48"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <line x1="0" y1="70" x2="1200" y2="70" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* Solid Royal Purple Bottom Bar */}
      <div className="bg-[#6A11CB] px-4 py-2.5 text-center text-xs font-medium text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3">
          <span>© 2026 GiftKart. All Rights Reserved.</span>
          <span className="hidden text-white/40 sm:inline">|</span>
          <span>Made with ♥ in Bengal</span>
          <span className="hidden text-white/40 sm:inline">|</span>
          <span className="text-white/80">Local Demo Mode · No Live Payments</span>
        </div>
      </div>
    </footer>
  );
}
