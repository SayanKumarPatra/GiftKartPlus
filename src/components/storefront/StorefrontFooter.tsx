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
import { useStoreSettings } from '../../hooks/useStoreData';

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Customize', to: '/customize' },
  { label: 'Occasions', to: '/shop?occasion=Birthday' },
  { label: 'Accessories', to: '/category/personalized-accessories' },
  { label: 'All Categories', to: '/categories' },
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
  { label: 'Careers', to: '/contact' },
];

export function StorefrontFooter() {
  const { data: settings } = useStoreSettings();
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  const activeZones =
    settings?.deliveryZones.filter((z) => z.isActive).map((z) => z.name) ?? [
      'Jalchak',
    ];

  const socialButtons = (
    <div className="flex items-center gap-2">
      {[
        { label: 'YouTube', Icon: Youtube, bg: 'bg-[#FF4D8D]/12 text-[#FF4D8D]' },
        { label: 'Instagram', Icon: Instagram, bg: 'bg-[#6A11CB]/10 text-[#6A11CB]' },
        { label: 'Facebook', Icon: Facebook, bg: 'bg-[#6A11CB]/10 text-[#6A11CB]' },
        { label: 'WhatsApp', Icon: MessageCircle, bg: 'bg-[#FF4D8D]/12 text-[#FF4D8D]' },
      ].map(({ label, Icon, bg }) => (
        <a
          key={label}
          href="#social"
          onClick={(e) => e.preventDefault()}
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
    <footer className="gk-footer-gradient relative overflow-hidden border-t border-[#EBD8FF] pb-[64px] lg:pb-0">
      {/* COMPACT DESKTOP 5-COLUMN FOOTER */}
      <div className="mx-auto hidden max-w-7xl px-6 py-6 lg:block">
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Column 1: Brand + Short Copy + Social */}
          <div className="col-span-3">
            <Link to="/" aria-label="GiftKart Home" className="inline-block">
              <BrandLogo size="sm" showTagline />
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-[#594A6B]">
              Har Gift Mein Ek Kahani. Personalized mugs, T-shirts, photo frames, and boutique gift wrapping for Jalchak.
            </p>
            <div className="mt-3">{socialButtons}</div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#2B0B4E]">
              Quick Links
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs font-medium text-[#594A6B]">
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
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#2B0B4E]">
              Customer Support
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs font-medium text-[#594A6B]">
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
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#2B0B4E]">
              About GiftKart
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs font-medium text-[#594A6B]">
              {ABOUT_LINKS.map((item) => (
                <li key={item.label}>
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
              We Deliver To
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs font-semibold text-[#2B0B4E]">
              {activeZones.map((zone) => (
                <li key={zone} className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF4D8D]" />
                  <span>{zone}, West Bengal</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1.5 text-xs text-[#594A6B]">
              <p className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
                <span>{settings?.supportEmail ?? 'demo@giftkart.in'}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
                <span>{settings?.supportPhone ?? '+91 9382040746'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT MOBILE ACCORDION FOOTER */}
      <div className="px-3.5 py-4 lg:hidden">
        <div className="flex flex-col items-center text-center">
          <Link to="/" aria-label="GiftKart Home">
            <BrandLogo size="sm" showTagline />
          </Link>
          <p className="mt-1.5 max-w-xs text-xs text-[#594A6B]">
            Personalized gifts crafted with love for Jalchak, West Bengal.
          </p>
          <div className="mt-2.5">{socialButtons}</div>
        </div>

        <div className="mt-3 divide-y divide-[#EBD8FF] rounded-xl border border-[#EBD8FF] bg-white/85">
          {[
            { id: 'quick', title: 'Quick Links', links: QUICK_LINKS },
            { id: 'support', title: 'Customer Support', links: SUPPORT_LINKS },
            { id: 'about', title: 'About GiftKart', links: ABOUT_LINKS },
          ].map((group) => {
            const isOpen = openMobileGroup === group.id;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-[40px] w-full items-center justify-between px-3.5 text-left text-xs font-bold text-[#2B0B4E]"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#6A11CB] transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <ul className="space-y-1.5 px-3.5 pb-3 text-xs font-medium text-[#594A6B]">
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

          <div>
            <button
              type="button"
              onClick={() => toggleGroup('deliver')}
              aria-expanded={openMobileGroup === 'deliver'}
              className="flex min-h-[40px] w-full items-center justify-between px-3.5 text-left text-xs font-bold text-[#2B0B4E]"
            >
              <span>We Deliver To</span>
              <ChevronDown
                className={`h-4 w-4 text-[#6A11CB] transition-transform ${
                  openMobileGroup === 'deliver' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openMobileGroup === 'deliver' && (
              <div className="space-y-1.5 px-3.5 pb-3 text-xs text-[#594A6B]">
                {activeZones.map((zone) => (
                  <p key={zone} className="flex items-center gap-1.5 font-semibold text-[#2B0B4E]">
                    <MapPin className="h-3.5 w-3.5 text-[#FF4D8D]" />
                    <span>{zone}, West Bengal</span>
                  </p>
                ))}
                <p className="text-[11px]">
                  {settings?.supportEmail ?? 'demo@giftkart.in'} ·{' '}
                  {settings?.supportPhone ?? '+91 9382040746'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Solid Royal Purple Bottom Bar */}
      <div className="bg-[#6A11CB] px-4 py-2 text-center text-[11px] font-medium text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-2.5">
          <span>© 2026 GiftKart. All Rights Reserved.</span>
          <span className="hidden text-white/40 sm:inline">|</span>
          <span>Made with ♥ in Bengal</span>
          <span className="hidden text-white/40 sm:inline">|</span>
          <span className="text-white/85">Local Demo Mode · No Live Payments</span>
        </div>
      </div>
    </footer>
  );
}
