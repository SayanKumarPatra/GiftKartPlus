import {
  AlertCircle,
  Check,
  Clock,
  MapPin,
  Package,
  RotateCcw,
  Store,
  Truck,
} from 'lucide-react';
import type { DemoOrder } from '../../types';
import {
  CORE_ORDER_STAGES,
  getDeliveryVanProgressPercent,
  getLiveTrackingStatusLabel,
  getOrderBadgeClasses,
  getOrderStageIndex,
  getShortStageLabel,
  getStatusDisplayLabel,
  isExceptionOrderStatus,
  isVanInMotion,
  normalizeOrderStatus,
} from '../../utils/orderLifecycle';

interface DeliveryVanTrackerProps {
  order: DemoOrder;
  compact?: boolean;
}

export function DeliveryVanTracker({ order, compact = false }: DeliveryVanTrackerProps) {
  const canonicalStatus = normalizeOrderStatus(order.fulfillmentStatus);
  const stageIndex = getOrderStageIndex(canonicalStatus);
  const isException = isExceptionOrderStatus(canonicalStatus);
  const moving = isVanInMotion(canonicalStatus);
  const vanPercent = getDeliveryVanProgressPercent(canonicalStatus);
  const liveLabel = getLiveTrackingStatusLabel(canonicalStatus);
  const shipping = order.shippingDetails || {};

  const destinationLabel =
    [order.customer.city, order.customer.pincode].filter(Boolean).join(' • ') ||
    order.customer.deliveryZoneNameSnapshot ||
    'Customer Destination';

  const progressFillPercent = isException
    ? canonicalStatus === 'Delivery Failed'
      ? 78
      : canonicalStatus === 'Returned'
      ? 24
      : 8
    : stageIndex <= 0
    ? 6
    : Math.min(100, Math.round((stageIndex / (CORE_ORDER_STAGES.length - 1)) * 100));

  return (
    <section
      aria-label="Live Delivery Tracking"
      className={`relative overflow-hidden rounded-3xl border border-[#EBD8FF] bg-gradient-to-br from-[#FBF7FF] via-white to-[#FFF4F9] shadow-[0_14px_34px_-18px_rgba(106,17,203,0.22)] ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      }`}
    >
      {/* Subtle Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#FF4D8D]/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[#6A11CB]/10 blur-2xl"
      />

      {/* Top Live Status Strip */}
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6A11CB] to-[#FF4D8D] text-white shadow-sm">
            {canonicalStatus === 'Returned' ? (
              <RotateCcw className="h-4.5 w-4.5" />
            ) : isException ? (
              <AlertCircle className="h-4.5 w-4.5" />
            ) : (
              <Truck className="h-4.5 w-4.5" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  moving
                    ? 'bg-[#FF4D8D] gk-live-beacon'
                    : canonicalStatus === 'Delivered'
                    ? 'bg-[#6A11CB]'
                    : 'bg-[#FF4D8D]/70'
                }`}
              />
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#6A11CB]">
                {moving
                  ? 'Live Delivery Tracking'
                  : canonicalStatus === 'Delivered'
                  ? 'Delivery Completed'
                  : isException
                  ? 'Order Status Alert'
                  : 'Order Progress'}
              </span>
            </div>
            <p className="truncate text-[13.5px] font-extrabold text-[#2B0B4E] sm:text-[14.5px]">
              {liveLabel}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-extrabold ${getOrderBadgeClasses(
            canonicalStatus
          )}`}
        >
          {getStatusDisplayLabel(canonicalStatus)}
        </span>
      </div>

      {/* Animated Road & GiftKart Branded Delivery Van Scene */}
      <div className="relative mt-4 rounded-2xl border border-[#EBD8FF]/90 bg-white/85 px-3 pb-3 pt-4 backdrop-blur-md sm:px-4">
        {/* Pickup & Destination Labels */}
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#F5EAFF] text-[#6A11CB]">
              <Store className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#6E5B85]">
                Pickup
              </p>
              <p className="truncate font-extrabold text-[#2B0B4E]">
                GiftKart Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-right min-w-0">
            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#6E5B85]">
                Destination
              </p>
              <p className="truncate font-extrabold text-[#2B0B4E]">
                {destinationLabel}
              </p>
            </div>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F6] text-[#FF4D8D]">
              <MapPin className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Road & Animated Van Track */}
        <div className="relative mt-5 mb-2 h-16 select-none">
          {/* Road Surface */}
          <div className="absolute inset-x-0 bottom-2 h-5 overflow-hidden rounded-full bg-gradient-to-r from-[#3B0764] via-[#540CA6] to-[#3B0764] shadow-inner">
            {/* Active traveled highlight along road top */}
            <div
              className="h-1 bg-gradient-to-r from-[#FF4D8D] via-[#EBD8FF] to-[#FF4D8D] transition-all duration-700 ease-out"
              style={{ width: `${progressFillPercent}%` }}
            />
            {/* Animated dashed lane stripes */}
            <div
              className={`mt-1.5 h-[3px] w-full gk-road-dashes ${
                moving ? 'gk-road-dashes-moving' : ''
              }`}
            />
          </div>

          {/* Start & End Road Pins */}
          <span className="absolute bottom-3 left-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#EBD8FF] shadow-xs" />
          <span
            className={`absolute bottom-3 right-2 h-2.5 w-2.5 rounded-full border-2 border-white shadow-xs ${
              canonicalStatus === 'Delivered' ? 'bg-[#FF4D8D]' : 'bg-white/75'
            }`}
          />

          {/* Smoothly Positioned GiftKart Branded SVG Delivery Van */}
          <div
            className="absolute bottom-3.5 z-10 -translate-x-1/2 transition-all duration-700 ease-out"
            style={{ left: `${Math.min(92, Math.max(9, vanPercent))}%` }}
          >
            <div className={moving ? 'gk-van-moving' : ''}>
              <svg
                width="82"
                height="46"
                viewBox="0 0 82 46"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="GiftKart Delivery Van"
                className="drop-shadow-[0_6px_8px_rgba(106,17,203,0.28)]"
              >
                {/* Motion Wind Streaks (Only when moving) */}
                {moving && (
                  <g>
                    <line
                      x1="1"
                      y1="14"
                      x2="11"
                      y2="14"
                      stroke="#FF4D8D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="gk-wind-line-1"
                    />
                    <line
                      x1="3"
                      y1="21"
                      x2="12"
                      y2="21"
                      stroke="#6A11CB"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      className="gk-wind-line-2"
                    />
                  </g>
                )}

                {/* Cargo Box (GiftKart Purple Gradient) */}
                <defs>
                  <linearGradient id="gkVanBody" x1="12" y1="6" x2="58" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6A11CB" />
                    <stop offset="1" stopColor="#540CA6" />
                  </linearGradient>
                  <linearGradient id="gkVanRibbon" x1="12" y1="26" x2="74" y2="26" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF4D8D" />
                    <stop offset="1" stopColor="#FF75A8" />
                  </linearGradient>
                </defs>

                <rect x="13" y="6" width="42" height="27" rx="5" fill="url(#gkVanBody)" />
                {/* Pink Brand Stripe */}
                <rect x="13" y="25.5" width="42" height="3.5" fill="url(#gkVanRibbon)" />

                {/* Gift Icon Accent + GiftKart Branding on Side */}
                <rect x="17" y="10.5" width="9" height="8" rx="1.5" fill="#FF4D8D" />
                <rect x="20.7" y="10.5" width="1.6" height="8" fill="#FFFFFF" />
                <rect x="17" y="13.7" width="9" height="1.6" fill="#FFFFFF" />
                <text
                  x="28.5"
                  y="17"
                  fill="#FFFFFF"
                  fontSize="6.6"
                  fontWeight="800"
                  fontFamily="Inter, sans-serif"
                  letterSpacing="-0.2"
                >
                  GiftKart
                </text>
                <text
                  x="28.5"
                  y="22.5"
                  fill="#EBD8FF"
                  fontSize="4.2"
                  fontWeight="700"
                  fontFamily="Inter, sans-serif"
                  letterSpacing="0.5"
                >
                  EXPRESS
                </text>

                {/* Van Cabin */}
                <path
                  d="M55 13H65.2C67.1 13 68.8 14 69.7 15.7L73.6 22.8C74.2 23.9 74.5 25.1 74.5 26.3V31C74.5 32.1 73.6 33 72.5 33H55V13Z"
                  fill="#FFFFFF"
                  stroke="#6A11CB"
                  strokeWidth="1.6"
                />
                {/* Windshield */}
                <path
                  d="M58 15.5H64.5C65.7 15.5 66.8 16.1 67.4 17.2L70.2 22.2H58V15.5Z"
                  fill="#EBD8FF"
                />
                {/* Cabin Pink Trim */}
                <rect x="55.8" y="25.5" width="18" height="3" rx="1" fill="#FF4D8D" />
                {/* Headlight */}
                <rect x="72" y="27.2" width="3" height="2.4" rx="1" fill="#FFE169" />

                {/* Rear Wheel */}
                <g className={moving ? 'gk-wheel-moving' : ''}>
                  <circle cx="26" cy="34.5" r="5.5" fill="#2B0B4E" />
                  <circle cx="26" cy="34.5" r="2.6" fill="#EBD8FF" />
                  <line x1="26" y1="31.5" x2="26" y2="37.5" stroke="#6A11CB" strokeWidth="1.2" />
                  <line x1="23" y1="34.5" x2="29" y2="34.5" stroke="#6A11CB" strokeWidth="1.2" />
                </g>

                {/* Front Wheel */}
                <g className={moving ? 'gk-wheel-moving' : ''}>
                  <circle cx="64" cy="34.5" r="5.5" fill="#2B0B4E" />
                  <circle cx="64" cy="34.5" r="2.6" fill="#EBD8FF" />
                  <line x1="64" y1="31.5" x2="64" y2="37.5" stroke="#6A11CB" strokeWidth="1.2" />
                  <line x1="61" y1="34.5" x2="67" y2="34.5" stroke="#6A11CB" strokeWidth="1.2" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* 7-Stage Progress Checkpoints */}
        {!isException ? (
          <div className="mt-3 pt-2 border-t border-[#F2E9FF]">
            <div className="no-scrollbar overflow-x-auto pb-1">
              <div className="relative grid min-w-[520px] grid-cols-7 gap-1">
                {/* Connecting Track Line */}
                <div className="pointer-events-none absolute left-[7%] right-[7%] top-3 h-[3px] rounded-full bg-[#EBD8FF]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] transition-all duration-500"
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
                  return (
                    <div
                      key={stage}
                      className="relative flex flex-col items-center text-center"
                    >
                      <span
                        className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-extrabold transition-all ${
                          completed
                            ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
                            : current
                            ? 'border-[#FF4D8D] bg-[#FF4D8D] text-white shadow-[0_0_0_4px_rgba(255,77,141,0.18)]'
                            : 'border-[#EBD8FF] bg-white text-[#8E7AA8]'
                        }`}
                      >
                        {completed ? (
                          <Check className="h-3.5 w-3.5 stroke-[2.8]" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span
                        className={`mt-1.5 text-[10px] leading-tight ${
                          current
                            ? 'font-extrabold text-[#FF4D8D]'
                            : completed
                            ? 'font-bold text-[#6A11CB]'
                            : 'font-semibold text-[#8E7AA8]'
                        }`}
                      >
                        {getShortStageLabel(stage)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-[#FF4D8D]/30 bg-[#FFF0F6] px-3 py-2.5 text-xs text-[#2B0B4E]">
            <p className="font-extrabold text-[#C81E62]">
              {canonicalStatus}
              {shipping.exceptionReason ? ` — ${shipping.exceptionReason}` : ''}
            </p>
            {shipping.deliveryRemarks && (
              <p className="mt-0.5 text-[11.5px] text-[#6E5B85]">
                {shipping.deliveryRemarks}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Real Shipping Metadata Strip (Only rendered when real data exists in DB) */}
      {(shipping.courierName ||
        shipping.trackingId ||
        shipping.expectedDeliveryDate ||
        shipping.currentShippingUpdate ||
        shipping.deliveredAt) && (
        <div className="relative mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {shipping.courierName && (
            <div className="rounded-xl border border-[#EBD8FF] bg-white/90 px-3 py-2">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#6E5B85]">
                <Package className="h-3 w-3 text-[#6A11CB]" />
                Courier Partner
              </p>
              <p className="mt-0.5 truncate text-xs font-extrabold text-[#2B0B4E]">
                {shipping.courierName}
              </p>
            </div>
          )}
          {shipping.trackingId && (
            <div className="rounded-xl border border-[#EBD8FF] bg-white/90 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E5B85]">
                Tracking ID
              </p>
              <p className="mt-0.5 truncate font-mono text-xs font-extrabold text-[#6A11CB]">
                {shipping.trackingId}
              </p>
            </div>
          )}
          {(shipping.expectedDeliveryDate || shipping.deliveredAt) && (
            <div className="rounded-xl border border-[#EBD8FF] bg-white/90 px-3 py-2">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#6E5B85]">
                <Clock className="h-3 w-3 text-[#FF4D8D]" />
                {shipping.deliveredAt ? 'Delivered On' : 'Expected Delivery'}
              </p>
              <p className="mt-0.5 truncate text-xs font-extrabold text-[#2B0B4E]">
                {shipping.deliveredAt || shipping.expectedDeliveryDate}
              </p>
            </div>
          )}
          {shipping.currentShippingUpdate && (
            <div className="rounded-xl border border-[#EBD8FF] bg-white/90 px-3 py-2 sm:col-span-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E5B85]">
                Latest Shipping Update
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#2B0B4E]">
                {shipping.currentShippingUpdate}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
