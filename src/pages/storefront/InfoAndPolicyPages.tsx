import { useState } from 'react';
import { ChevronDown, Mail, MapPin, Phone, Send } from 'lucide-react';
import { BRAND_ASSETS } from '../../config/appConfig';
import { useStoreSettings } from '../../hooks/useStoreData';
import { useToast } from '../../context/ToastContext';
import { validateEmail, validateRequired } from '../../utils/validation';

export function AboutUsPage() {
  const { data: settings } = useStoreSettings();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="gk-promo-gradient grid items-center gap-6 rounded-3xl border border-[#EBD8FF] p-7 sm:p-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="text-xs font-bold text-[#FF4D8D]">Our Story</p>
          <h1 className="mt-1.5 text-3xl font-extrabold text-[#3B0764] sm:text-4xl">
            {settings?.pageContent?.aboutHeadline || 'GiftKart — Har Gift Mein Ek Kahani.'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#4B2C70]">
            {settings?.pageContent?.aboutStory ||
              'Crafted for thoughtful gift-givers in Jalchak, West Bengal, India, GiftKart brings together 15 dedicated gifting categories—including personalized Coffee Mugs, custom T-shirt Prints, illuminated Photo Frames, handmade surprises, and boutique Gift Wrapping.'}
          </p>
        </div>
        <div className="flex justify-center lg:col-span-4">
          <img
            src={BRAND_ASSETS.giftCartIllustration}
            alt="GiftKart illustration"
            referrerPolicy="no-referrer"
            className="h-40 w-auto object-contain"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="gk-card rounded-3xl p-6">
          <h2 className="text-base font-extrabold text-[#3B0764]">
            Why Every Gift Tells a Story
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#594A6B]">
            From heat-revealing Magic Mugs to laser-engraved 3D LED heart lamps, every item supports personal messages, custom names, and curated ribbon wrapping so unboxing feels personal.
          </p>
        </div>
        <div className="gk-card rounded-3xl p-6">
          <h2 className="text-base font-extrabold text-[#3B0764]">
            Initial Launch Delivery Focus
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#594A6B]">
            Our initial operations focus exclusively on{' '}
            <strong>
              {settings?.deliveryZones.map((z) => z.name).join(' and ') ?? 'Jalchak'}
            </strong>{' '}
            in West Bengal with transparent INR pricing and dedicated local dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContactUsPage() {
  const { data: settings } = useStoreSettings();
  const { pushToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = validateRequired(name, 'Name');
    const em = validateEmail(email);
    const m = validateRequired(message, 'Message');
    if (!n.valid || !em.valid || !m.valid) {
      pushToast({
        title: 'Incomplete inquiry',
        description: n.error ?? em.error ?? m.error,
        variant: 'error',
      });
      return;
    }
    setName('');
    setEmail('');
    setMessage('');
    pushToast({
      title: 'Demo Inquiry Recorded',
      description: 'Email & WhatsApp dispatch will connect in a future backend phase.',
      variant: 'success',
    });
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-12">
      <div className="gk-promo-gradient space-y-5 rounded-3xl border border-[#EBD8FF] p-6 sm:p-8 lg:col-span-5">
        <h1 className="text-3xl font-extrabold text-[#3B0764]">Contact GiftKart</h1>
        <p className="text-sm text-[#4B2C70]">
          Questions about custom photo printing, bulk corporate gifts, or Jalchak delivery? Reach out below.
        </p>
        <div className="space-y-3 text-sm font-semibold text-[#2B0B4E]">
          <p className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-[#FF4D8D]" />
            <span>Jalchak, West Bengal, India</span>
          </p>
          <p className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-[#6A11CB]" />
            <span>{settings?.supportEmail ?? 'demo@giftkart.in'}</span>
          </p>
          <p className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 text-[#6A11CB]" />
            <span>{settings?.supportPhone ?? '+91 9382040746'}</span>
          </p>
        </div>
      </div>

      <div className="gk-card rounded-3xl p-6 sm:p-8 lg:col-span-7">
        <h2 className="text-lg font-extrabold text-[#3B0764]">Send a Message</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2B0B4E]">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#2B0B4E]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#2B0B4E]">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="gk-btn-purple inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 text-sm font-bold"
          >
            <Send className="h-4 w-4" />
            <span>Submit Inquiry</span>
          </button>
        </form>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: 'Where does GiftKart currently deliver?',
    a: 'For our initial launch, GiftKart delivers exclusively in Jalchak, West Bengal (India). Additional zones can be enabled from the Admin Panel as operations expand.',
  },
  {
    q: 'How does Gift Wrapping work?',
    a: 'You can enable Gift Wrapping on the Product or Cart page, choose from Admin-configured wrapping styles with transparent INR charges, and add a recipient name and personal gift message card.',
  },
  {
    q: 'Are online payments or Cash on Delivery active right now?',
    a: 'No. This release runs in Demo Order Placement mode only so you can preview the full shopping, customization, and Admin workflow locally. Cashfree is prepared as an unconnected integration interface.',
  },
  {
    q: 'Can I preview my custom photo on photo mugs or LED frames?',
    a: 'Yes! Eligible products include a local photo upload preview on the Product Details page. Permanent cloud media uploads will activate once Supabase Storage is connected.',
  },
];

export function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-7">
        <h1 className="text-3xl font-extrabold text-[#3B0764]">
          Frequently Asked Questions
        </h1>
        <p className="mt-1.5 text-sm text-[#4B2C70]">
          Everything about customization, gift wrapping, Jalchak delivery, and Demo Order mode.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const open = openIdx === idx;
          return (
            <div key={item.q} className="gk-card overflow-hidden rounded-2xl">
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : idx)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-[#2B0B4E]"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[#6A11CB] transition-transform ${
                    open ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open && (
                <div className="border-t border-[#EBD8FF] px-5 py-4 text-sm leading-relaxed text-[#594A6B]">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const POLICY_CONTENT: Record<
  'shipping' | 'return' | 'cancellation' | 'privacy' | 'terms',
  { title: string; subtitle: string; sections: { heading: string; body: string }[] }
> = {
  shipping: {
    title: 'Shipping Policy',
    subtitle: 'Jalchak Dispatch Guidelines',
    sections: [
      {
        heading: 'Serviceable Delivery Area',
        body: 'Initial delivery coverage includes Jalchak, West Bengal. Delivery charges and free-delivery thresholds are displayed transparently at checkout in INR (₹).',
      },
      {
        heading: 'Personalization Lead Time',
        body: 'Custom printed mugs, T-shirts, and engraved LED photo frames require quality inspection before dispatch. Standard local delivery takes 1–2 business days in Jalchak.',
      },
    ],
  },
  return: {
    title: 'Return & Replacement Policy',
    subtitle: 'Damaged or Print-Defect Resolution',
    sections: [
      {
        heading: 'Personalized & Custom Items',
        body: 'Because custom photo mugs, name-printed T-shirts, and engraved frames are made to order, returns apply strictly to transit damage or printing defects reported within 48 hours of delivery.',
      },
      {
        heading: 'Non-Personalized Accessories & Gift Boxes',
        body: 'Unused, unopened standard gift boxes, bags, and accessories may be requested for exchange within 7 days of delivery in Jalchak.',
      },
    ],
  },
  cancellation: {
    title: 'Cancellation Policy',
    subtitle: 'Pre-Production & Custom Order Cancellation Rules',
    sections: [
      {
        heading: 'Standard Non-Personalized Orders',
        body: 'Standard gifts and accessories can be cancelled anytime before dispatch from our Jalchak fulfillment desk.',
      },
      {
        heading: 'Personalized & Custom-Printed Gifts',
        body: 'Custom mugs, printed T-shirts, and engraved LED photo frames can be cancelled within 2 hours of order confirmation before printing or engraving begins. In Demo Mode, status updates can be tested directly inside the Admin Panel.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Local Demo Storage Transparency',
    sections: [
      {
        heading: 'Demo Mode Storage',
        body: 'In this frontend demo release, your cart, wishlist, demo account profile, and demo orders are stored strictly inside your own browser LocalStorage and are not transmitted to an external server.',
      },
      {
        heading: 'Future Cloud Privacy',
        body: 'Once Supabase Authentication, Database, and Cashfree Payments are connected in production, this policy will be updated with full cloud retention and encryption terms.',
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'GiftKart Storefront Usage Terms',
    sections: [
      {
        heading: 'Demo Order Mode',
        body: 'Orders placed in this preview version are Demo Orders only. No financial transaction or live payment obligation is created while Cashfree remains disconnected.',
      },
      {
        heading: 'Pricing & Immutable Order Records',
        body: 'All prices are listed in Indian Rupees (INR). Every placed demo order freezes product names, SKUs, unit prices, and gift wrapping selections at checkout.',
      },
    ],
  },
};

export function PolicyPage({
  type,
}: {
  type: 'shipping' | 'return' | 'cancellation' | 'privacy' | 'terms';
}) {
  const content = POLICY_CONTENT[type];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-7">
        <p className="text-xs font-bold text-[#FF4D8D]">GiftKart Policies</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#3B0764]">{content.title}</h1>
        <p className="mt-1 text-sm text-[#4B2C70]">{content.subtitle}</p>
      </div>
      <div className="gk-card space-y-5 rounded-3xl p-6 sm:p-8">
        {content.sections.map((sec) => (
          <section key={sec.heading}>
            <h2 className="text-base font-extrabold text-[#2B0B4E]">{sec.heading}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#594A6B]">{sec.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
