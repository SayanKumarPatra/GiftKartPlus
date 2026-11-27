import { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Gift,
  Home,
  MapPin,
  Navigation,
  Package,
  RotateCcw,
  Truck,
} from 'lucide-react';
import type { CanonicalOrderStatus, DemoOrder } from '../../types';
import {
  CORE_ORDER_STAGES,
  getDeliveryVanProgressPercent,
  getLiveTrackingStatusLabel,
  getOrderStageIndex,
  getStatusDisplayLabel,
  isExceptionOrderStatus,
  isVanInMotion,
  normalizeOrderStatus,
} from '../../utils/orderLifecycle';
import { useLanguage } from '../../context/LanguageContext';
import { getDateLocale } from '../../i18n/bengaliAutoTranslate';
import type { LanguageCode, TranslationKey } from '../../i18n/translations';

interface DeliveryVanTrackerProps {
  order: DemoOrder;
  compact?: boolean;
}

function formatCompactTimestamp(iso: string | undefined, language: LanguageCode): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const locale = getDateLocale(language);
  const datePart = d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  });
  const timePart = d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart},\n${timePart}`;
}

function getStageTimestamp(order: DemoOrder, stage: CanonicalOrderStatus): string | undefined {
  if (stage === 'New Order') {
    const entry = order.statusHistory.find(
      (h) => normalizeOrderStatus(h.status) === 'New Order'
    );
    return entry?.timestamp || order.createdAt;
  }
  const matches = order.statusHistory.filter(
    (h) => normalizeOrderStatus(h.status) === stage && h.type !== 'NOTIFICATION_SENT'
  );
  if (matches.length > 0) {
    return matches[matches.length - 1].timestamp;
  }
  return undefined;
}

function getStageShortHeading(
  stage: CanonicalOrderStatus,
  t: (key: TranslationKey) => string
): string {
  switch (stage) {
    case 'New Order':
      return t('stepOrderPlaced');
    case 'Processing':
      return t('stepProcessing');
    case 'Packed':
      return t('stepPacked');
    case 'Shipped':
      return t('stepShippedDispatch');
    case 'In Transit':
      return t('stepInTransit');
    case 'Out for Delivery':
      return t('stepOutForDelivery');
    case 'Delivered':
      return t('stepDelivered');
    default:
      return stage;
  }
}

function getStageHeadline(
  status: CanonicalOrderStatus,
  language: LanguageCode
): { title: string; subtitle: string } {
  if (language === 'bn') {
    switch (status) {
      case 'New Order':
        return {
          title: 'আপনার GiftKart অর্ডারটি সম্পন্ন হয়েছে!',
          subtitle: 'অর্ডার গৃহীত হয়েছে এবং স্টুডিও প্রসেসিংয়ের অপেক্ষায় আছে।',
        };
      case 'Processing':
        return {
          title: 'আপনার অর্ডারটি প্রস্তুত করা হচ্ছে!',
          subtitle: 'আমাদের GiftKart স্টুডিও যত্ন সহকারে আপনার উপহারটি তৈরি ও মান যাচাই করছে।',
        };
      case 'Packed':
        return {
          title: 'আপনার উপহারটি প্যাক করা ও প্রস্তুত!',
          subtitle: 'সুরক্ষিতভাবে মোড়ানো হয়েছে এবং কুরিয়ারে দেওয়ার জন্য প্রস্তুত।',
        };
      case 'Shipped':
        return {
          title: 'আপনার অর্ডারটি শিপ করা হয়েছে!',
          subtitle: 'আপনার উপহারটি ডেলিভারি হাবের উদ্দেশ্যে রওনা হয়েছে।',
        };
      case 'In Transit':
        return {
          title: 'আপনার অর্ডারটি পথে রয়েছে!',
          subtitle: 'আপনার গন্তব্য শহরের দিকে এগিয়ে চলেছে।',
        };
      case 'Out for Delivery':
        return {
          title: 'আজই ডেলিভারির জন্য বের হয়েছে!',
          subtitle: 'ডেলিভারি পার্টনার আপনার ঠিকানার উদ্দেশ্যে আসছেন।',
        };
      case 'Delivered':
        return {
          title: 'সফলভাবে ডেলিভারি সম্পন্ন হয়েছে!',
          subtitle: 'GiftKart-এর সাথে কেনাকাটা করার জন্য আন্তরিক ধন্যবাদ।',
        };
      case 'Cancelled':
        return {
          title: 'এই অর্ডারটি বাতিল করা হয়েছে।',
          subtitle: 'এই অর্ডারের জন্য আর কোনো শিপিং আপডেট নির্ধারিত নেই।',
        };
      case 'Delivery Failed':
        return {
          title: 'ডেলিভারির চেষ্টা ব্যর্থ হয়েছে।',
          subtitle: 'পুনরায় ডেলিভারির জন্য অনুগ্রহ করে আমাদের সাপোর্টে যোগাযোগ করুন।',
        };
      case 'Returned':
        return {
          title: 'অর্ডারটি GiftKart-এ ফেরত এসেছে।',
          subtitle: 'রিটার্নের তথ্য অর্ডার হিস্ট্রিতে যুক্ত করা হয়েছে।',
        };
    }
  }
  switch (status) {
    case 'New Order':
      return {
        title: 'Your GiftKart order has been placed!',
        subtitle: 'Order received and awaiting studio processing.',
      };
    case 'Processing':
      return {
        title: 'Your order is being prepared!',
        subtitle: 'Our GiftKart studio is carefully crafting & checking your items.',
      };
    case 'Packed':
      return {
        title: 'Your gift is packed & ready!',
        subtitle: 'Wrapped securely and ready for courier handover.',
      };
    case 'Shipped':
      return {
        title: 'Your order has been shipped!',
        subtitle: 'Your gift is on the way to the delivery hub.',
      };
    case 'In Transit':
      return {
        title: 'Your order is in transit!',
        subtitle: 'Moving smoothly towards your destination city.',
      };
    case 'Out for Delivery':
      return {
        title: 'Out for delivery today!',
        subtitle: 'Delivery partner is heading to the customer address.',
      };
    case 'Delivered':
      return {
        title: 'Delivered successfully!',
        subtitle: 'Thank you for shopping with GiftKart.',
      };
    case 'Cancelled':
      return {
        title: 'This order has been cancelled.',
        subtitle: 'No further shipping updates will be scheduled.',
      };
    case 'Delivery Failed':
      return {
        title: 'Delivery attempt unsuccessful.',
        subtitle: 'Please coordinate with the customer for re-attempt.',
      };
    case 'Returned':
      return {
        title: 'Order returned to GiftKart.',
        subtitle: 'Return entry has been recorded in order history.',
      };
  }
}

function StageStepIcon({ stage }: { stage: CanonicalOrderStatus }) {
  switch (stage) {
    case 'New Order':
      return <Check className="h-3.5 w-3.5 stroke-[2.8]" />;
    case 'Processing':
      return <Package className="h-3.5 w-3.5 stroke-[2.2]" />;
    case 'Packed':
      return <Gift className="h-3.5 w-3.5 stroke-[2.2]" />;
    case 'Shipped':
      return <Truck className="h-3.5 w-3.5 stroke-[2.2]" />;
    case 'In Transit':
      return <Navigation className="h-3.5 w-3.5 stroke-[2.2]" />;
    case 'Out for Delivery':
      return <Truck className="h-3.5 w-3.5 stroke-[2.2]" />;
    case 'Delivered':
      return <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.4]" />;
    default:
      return <Package className="h-3.5 w-3.5" />;
  }
}

export function DeliveryVanTracker({ order, compact = false }: DeliveryVanTrackerProps) {
  const { language, t, translateOrderStatus, translatePlace } = useLanguage();
  const [copiedTracking, setCopiedTracking] = useState(false);

  const canonicalStatus = normalizeOrderStatus(order.fulfillmentStatus);
  const stageIndex = getOrderStageIndex(canonicalStatus);
  const isException = isExceptionOrderStatus(canonicalStatus);
  const moving = isVanInMotion(canonicalStatus);
  const vanPercent = getDeliveryVanProgressPercent(canonicalStatus);
  const headline = getStageHeadline(canonicalStatus, language);
  const shipping = order.shippingDetails || {};

  const destinationLabel =
    [order.customer.city ? translatePlace(order.customer.city) : '', order.customer.pincode]
      .filter(Boolean)
      .join(' • ') ||
    (order.customer.deliveryZoneNameSnapshot
      ? translatePlace(order.customer.deliveryZoneNameSnapshot)
      : '') ||
    t('deliveryAddress');

  async function handleCopyTracking() {
    if (!shipping.trackingId) return;
    try {
      await navigator.clipboard.writeText(shipping.trackingId);
      setCopiedTracking(true);
      window.setTimeout(() => setCopiedTracking(false), 1800);
    } catch {
      // Ignore clipboard permission errors
    }
  }

  return (
    <section
      aria-label="Order Progress and Live Delivery Tracking"
      className={`relative overflow-hidden rounded-[26px] border border-[#EBD8FF] bg-white shadow-[0_14px_34px_-18px_rgba(106,17,203,0.22)] ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      }`}
    >
      {/* Top Card Header — Matches Mockup */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
            {canonicalStatus === 'Returned' ? (
              <RotateCcw className="h-4 w-4" />
            ) : isException ? (
              <AlertCircle className="h-4 w-4 text-[#FF4D8D]" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
          </span>
          <h3 className="truncate text-[14.5px] font-extrabold tracking-tight text-[#2B0B4E] sm:text-[15.5px]">
            {t('orderProgressShipping')}
          </h3>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#EBD8FF] bg-[#FCF9FF] px-3 py-1 text-[11px] font-extrabold text-[#2B0B4E] shadow-xs">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isException
                ? 'bg-[#FF4D8D]'
                : moving
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-[#6A11CB]'
            }`}
          />
          <span>
            {isException
              ? translateOrderStatus(getStatusDisplayLabel(canonicalStatus))
              : canonicalStatus === 'Delivered'
              ? t('stepDelivered')
              : t('liveTracking')}
          </span>
        </span>
      </div>

      {/* Iconic Horizontal Stepper with Real Timestamps */}
      {!isException ? (
        <div className="mt-4">
          <div className="no-scrollbar overflow-x-auto pb-1">
            <div className="relative grid min-w-[540px] grid-cols-7 gap-1 pt-1">
              {/* Background Line */}
              <div className="pointer-events-none absolute left-[7%] right-[7%] top-[21px] h-[3px] rounded-full bg-[#E8DCF8]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6A11CB] via-[#8B2CE8] to-[#FF4D8D] transition-all duration-700 ease-out"
                  style={{
                    width: `${
                      stageIndex <= 0
                        ? 0
                        : Math.round((stageIndex / (CORE_ORDER_STAGES.length - 1)) * 100)
                    }%`,
                  }}
                />
              </div>

              {CORE_ORDER_STAGES.map((stage, idx) => {
                const completed = idx < stageIndex;
                const current = idx === stageIndex;
                const stamp = idx <= stageIndex ? getStageTimestamp(order, stage) : undefined;
                const formattedStamp = formatCompactTimestamp(stamp, language);

                return (
                  <div
                    key={stage}
                    className="relative flex flex-col items-center px-0.5 text-center"
                  >
                    <span
                      className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        current
                          ? 'scale-110 border-[#FFFFFF] bg-gradient-to-br from-[#6A11CB] to-[#9333EA] text-white shadow-[0_0_0_4px_rgba(106,17,203,0.22),0_8px_16px_-4px_rgba(106,17,203,0.5)]'
                          : completed
                          ? 'border-white bg-[#6A11CB] text-white shadow-xs'
                          : 'border-[#DFD2F2] bg-white text-[#9D8BB4]'
                      }`}
                    >
                      <StageStepIcon stage={stage} />
                    </span>

                    <span
                      className={`mt-1.5 text-[10.5px] leading-tight ${
                        current
                          ? 'font-extrabold text-[#6A11CB]'
                          : completed
                          ? 'font-bold text-[#2B0B4E]'
                          : 'font-semibold text-[#8E7AA8]'
                      }`}
                    >
                      {getStageShortHeading(stage, t)}
                    </span>

                    {formattedStamp && (
                      <span className="mt-0.5 whitespace-pre-line text-[9.5px] font-semibold leading-tight text-[#6E5B85]">
                        {formattedStamp}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3.5 rounded-2xl border border-[#FF4D8D]/30 bg-[#FFF0F6] px-3.5 py-2.5 text-xs">
          <p className="font-extrabold text-[#C81E62]">
            {translateOrderStatus(getLiveTrackingStatusLabel(canonicalStatus))}
            {shipping.exceptionReason ? ` — ${shipping.exceptionReason}` : ''}
          </p>
          {shipping.deliveryRemarks && (
            <p className="mt-0.5 text-[11.5px] text-[#6E5B85]">{shipping.deliveryRemarks}</p>
          )}
        </div>
      )}

      {/* Scenic Animated GiftKart Delivery Van Track (Preserves Running Van Animation!) */}
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#EFE3FF] bg-gradient-to-b from-[#F7F1FF] via-[#FBF7FF] to-[#F4ECFF] pt-5">
        {/* Pastel City Skyline & Clouds Backdrop */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 92"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-5 h-[78px] w-full opacity-95"
        >
          {/* Soft Clouds */}
          <ellipse cx="115" cy="18" rx="22" ry="7" fill="#EBD8FF" opacity="0.6" />
          <ellipse cx="132" cy="16" rx="14" ry="6" fill="#EBD8FF" opacity="0.6" />
          <ellipse cx="425" cy="15" rx="24" ry="7" fill="#EBD8FF" opacity="0.65" />
          <ellipse cx="445" cy="18" rx="15" ry="5" fill="#EBD8FF" opacity="0.55" />

          {/* Soft Lavender City Skyline */}
          <g fill="#E7D8FA" opacity="0.62">
            <rect x="65" y="38" width="18" height="44" rx="2" />
            <rect x="88" y="28" width="22" height="54" rx="2" />
            <rect x="115" y="42" width="16" height="40" rx="2" />
            <rect x="140" y="34" width="24" height="48" rx="2" />
            <rect x="172" y="46" width="16" height="36" rx="2" />
            <rect x="265" y="32" width="22" height="50" rx="2" />
            <rect x="292" y="42" width="18" height="40" rx="2" />
            <rect x="385" y="36" width="22" height="46" rx="2" />
            <rect x="412" y="26" width="24" height="56" rx="2" />
            <rect x="442" y="44" width="18" height="38" rx="2" />
            <rect x="485" y="34" width="20" height="48" rx="2" />
          </g>

          {/* Soft Rolling Hills & Trees */}
          <path
            d="M0 72 Q50 48 115 68 T240 72 T385 66 T525 60 T600 68 L600 92 L0 92 Z"
            fill="#84CC16"
            opacity="0.28"
          />
          <path
            d="M0 78 Q80 62 160 76 T340 76 T510 68 T600 76 L600 92 L0 92 Z"
            fill="#65A30D"
            opacity="0.34"
          />
          <circle cx="28" cy="64" r="14" fill="#65A30D" opacity="0.55" />
          <circle cx="106" cy="65" r="12" fill="#84CC16" opacity="0.5" />
          <circle cx="508" cy="64" r="13" fill="#84CC16" opacity="0.5" />
          <circle cx="576" cy="63" r="15" fill="#65A30D" opacity="0.55" />
        </svg>

        {/* Track Height Area */}
        <div className="relative h-20 select-none">
          {/* Left Pickup Pin (GiftKart Studio) */}
          <div className="absolute bottom-6 left-3 z-10 flex flex-col items-center sm:left-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#FF4D8D]/25 bg-white text-[#FF4D8D] shadow-[0_6px_14px_-4px_rgba(255,77,141,0.45)]">
              <MapPin className="h-4.5 w-4.5 fill-[#FF4D8D]/15 stroke-[2.4]" />
            </span>
          </div>

          {/* Right Destination Home Pin */}
          <div className="absolute bottom-6 right-3 z-10 flex flex-col items-center sm:right-5">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white shadow-[0_6px_14px_-4px_rgba(106,17,203,0.4)] ${
                canonicalStatus === 'Delivered'
                  ? 'border-[#6A11CB] text-[#6A11CB]'
                  : 'border-[#6A11CB]/35 text-[#6A11CB]'
              }`}
            >
              <Home className="h-4.5 w-4.5 stroke-[2.3]" />
            </span>
          </div>

          {/* Road Surface */}
          <div className="absolute inset-x-0 bottom-0 h-6 overflow-hidden bg-gradient-to-r from-[#5D4B7A] via-[#6F5C8E] to-[#5D4B7A]">
            {/* Top curb highlight */}
            <div className="h-[2px] w-full bg-white/40" />
            {/* Animated dashed road markings */}
            <div
              className={`mt-2 h-[3px] w-full gk-road-dashes ${
                moving ? 'gk-road-dashes-moving' : ''
              }`}
            />
          </div>

          {/* Smoothly Positioned Animated GiftKart Branded Delivery Van */}
          <div
            className="absolute bottom-2.5 z-20 -translate-x-1/2 transition-all duration-700 ease-out"
            style={{ left: `${Math.min(86, Math.max(15, vanPercent))}%` }}
          >
            <div className={moving ? 'gk-van-moving' : ''}>
              <svg
                width="106"
                height="56"
                viewBox="0 0 106 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="GiftKart Animated Delivery Van"
                className="drop-shadow-[0_7px_10px_rgba(43,11,78,0.28)]"
              >
                {/* Dynamic Pink Speed Lines when Van is Moving */}
                {moving && (
                  <g>
                    <line
                      x1="2"
                      y1="14"
                      x2="18"
                      y2="14"
                      stroke="#FF4D8D"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      className="gk-wind-line-1"
                    />
                    <line
                      x1="6"
                      y1="21"
                      x2="19"
                      y2="21"
                      stroke="#FF4D8D"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      className="gk-wind-line-2"
                    />
                    <line
                      x1="1"
                      y1="28"
                      x2="16"
                      y2="28"
                      stroke="#6A11CB"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      className="gk-wind-line-1"
                    />
                  </g>
                )}

                <defs>
                  <linearGradient id="gkMockVanBody" x1="22" y1="8" x2="96" y2="42" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#F5EEFF" />
                  </linearGradient>
                  <linearGradient id="gkMockVanBase" x1="22" y1="32" x2="96" y2="42" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6A11CB" />
                    <stop offset="1" stopColor="#7C22E8" />
                  </linearGradient>
                </defs>

                {/* White & Purple Sleek GiftKart Van Body */}
                <path
                  d="M23 13C23 9.7 25.7 7 29 7H69.5C73.2 7 76.6 8.9 78.5 12L85.8 23.8C86.6 25 87.8 25.9 89.2 26.3L93.5 27.6C95.6 28.2 97 30.1 97 32.3V38.5C97 40.4 95.4 42 93.5 42H27C24.8 42 23 40.2 23 38V13Z"
                  fill="url(#gkMockVanBody)"
                  stroke="#6A11CB"
                  strokeWidth="1.6"
                />

                {/* Purple Lower Body Stripe */}
                <path
                  d="M23.8 32.5H96.2V38.5C96.2 40 95 41.2 93.5 41.2H27C25.2 41.2 23.8 39.8 23.8 38V32.5Z"
                  fill="url(#gkMockVanBase)"
                />
                {/* Pink Accent Trim Line */}
                <rect x="23.8" y="30.5" width="72.4" height="2.4" fill="#FF4D8D" />

                {/* Tinted Cabin Window */}
                <path
                  d="M68 11H72.2C74.2 11 76.1 12.1 77.1 13.8L82.2 22.5H68V11Z"
                  fill="#2B0B4E"
                />
                <path
                  d="M69.8 12.5H72C73.2 12.5 74.3 13.2 74.9 14.2L77.2 18.5H69.8V12.5Z"
                  fill="#EBD8FF"
                  opacity="0.32"
                />

                {/* Pink Gift Icon on Van Side */}
                <rect x="28" y="13.5" width="11" height="10" rx="2" fill="#FF4D8D" />
                <rect x="32.6" y="13.5" width="1.8" height="10" fill="#FFFFFF" />
                <rect x="28" y="17.6" width="11" height="1.8" fill="#FFFFFF" />
                <circle cx="31.5" cy="12.6" r="1.4" stroke="#FF4D8D" strokeWidth="1.2" fill="none" />
                <circle cx="35.5" cy="12.6" r="1.4" stroke="#FF4D8D" strokeWidth="1.2" fill="none" />

                {/* GiftKart Wordmark on Van Side */}
                <text
                  x="41.5"
                  y="21.5"
                  fill="#2B0B4E"
                  fontSize="8.4"
                  fontWeight="800"
                  fontFamily="Inter, sans-serif"
                  letterSpacing="-0.3"
                >
                  GiftKart
                </text>

                {/* Headlight & Glow */}
                <rect x="92.5" y="31.5" width="4.5" height="3.2" rx="1.4" fill="#FDE047" />
                {/* Tail light */}
                <rect x="22.4" y="29" width="2.4" height="4.5" rx="1" fill="#FF4D8D" />

                {/* Rear Wheel */}
                <g className={moving ? 'gk-wheel-moving' : ''}>
                  <circle cx="38" cy="43" r="6.8" fill="#1E1035" />
                  <circle cx="38" cy="43" r="3.4" fill="#EBD8FF" />
                  <line x1="38" y1="39.5" x2="38" y2="46.5" stroke="#6A11CB" strokeWidth="1.3" />
                  <line x1="34.5" y1="43" x2="41.5" y2="43" stroke="#6A11CB" strokeWidth="1.3" />
                </g>

                {/* Front Wheel */}
                <g className={moving ? 'gk-wheel-moving' : ''}>
                  <circle cx="80" cy="43" r="6.8" fill="#1E1035" />
                  <circle cx="80" cy="43" r="3.4" fill="#EBD8FF" />
                  <line x1="80" y1="39.5" x2="80" y2="46.5" stroke="#6A11CB" strokeWidth="1.3" />
                  <line x1="76.5" y1="43" x2="83.5" y2="43" stroke="#6A11CB" strokeWidth="1.3" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Status Message & Courier / Tracking Pill — Matches Mockup */}
      <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F4EAFF] text-[#6A11CB]">
            <Truck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="break-words text-[13.5px] font-extrabold leading-snug text-[#6A11CB]">
              {headline.title}
            </p>
            <p className="mt-0.5 line-clamp-2 break-words text-[11.5px] font-medium text-[#5B4874]">
              {shipping.currentShippingUpdate || headline.subtitle}
            </p>
          </div>
        </div>

        {shipping.courierName || shipping.trackingId ? (
          <div className="flex max-w-full min-w-0 shrink-0 items-center justify-between gap-2.5 rounded-2xl border border-[#F8D0E4] bg-gradient-to-r from-[#FFF0F6] to-[#FAF2FF] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-[#FF4D8D] shadow-xs">
                <Truck className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 text-[11px] leading-tight">
                <p className="truncate font-extrabold text-[#2B0B4E]">
                  {t('courierLabel')}: {shipping.courierName || 'GiftKart'}
                </p>
                {shipping.trackingId && (
                  <p className="mt-0.5 truncate font-mono text-[10.5px] font-bold text-[#6E5B85]">
                    {t('trackingIdLabel')}: {shipping.trackingId}
                  </p>
                )}
              </div>
            </div>
            {shipping.trackingId && (
              <button
                type="button"
                onClick={() => void handleCopyTracking()}
                title={t('copyLinkBtn')}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#EBD8FF] bg-white text-[#6A11CB] transition-colors hover:bg-[#F4EAFF]"
              >
                {copiedTracking ? (
                  <Check className="h-3.5 w-3.5 text-[#6A11CB]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="flex max-w-full min-w-0 shrink-0 items-center gap-2 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] px-3 py-2 text-[11px]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF4D8D]" />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-extrabold text-[#2B0B4E]">{destinationLabel}</p>
              {shipping.expectedDeliveryDate ? (
                <p className="mt-0.5 flex items-center gap-1 text-[10.5px] font-semibold text-[#6E5B85]">
                  <Clock className="h-2.5 w-2.5 shrink-0 text-[#6A11CB]" />
                  <span className="truncate">{t('etaLabel')}: {shipping.expectedDeliveryDate}</span>
                </p>
              ) : (
                <p className="mt-0.5 truncate text-[10.5px] font-semibold text-[#6E5B85]">
                  {t('fromGiftKartStudio')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
