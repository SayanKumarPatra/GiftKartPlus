import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  Gift,
  Headset,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

import customizedPhotoMugImg from '../../assets/images/category_customized_photo_gifts_1795295079046.jpg';
import moonLampImg from '../../assets/images/mobile_sub_moon_lamp_1795431667937.jpg';
import heartCushionImg from '../../assets/images/mobile_sub_heart_cushion_1795431665593.jpg';

const VIEW_ORDERS_ILLUSTRATION =
  '/assets/aistudio/Vibrant_3D_Shopping_Essentials_49dd2758.png';

type OrderStatusKey = 'Processing' | 'Shipped' | 'Delivered';
type FilterTabKey = 'all' | OrderStatusKey;

interface TimelineStep {
  label: string;
  dateLabel: string;
  state: 'completed' | 'current' | 'pending';
  detail: string;
}

interface SampleMobileOrder {
  id: string;
  orderId: string;
  placedOn: string;
  deliveredOn?: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  shippingCharge: number;
  grandTotal: number;
  status: OrderStatusKey;
  paymentMethod: string;
  paymentBadge: string;
  deliveryAddress: {
    name: string;
    line1: string;
    line2: string;
    cityStatePin: string;
    phone: string;
  };
  timeline: TimelineStep[];
}

const SAMPLE_MOBILE_ORDERS: SampleMobileOrder[] = [
  {
    id: 'ord-gk784521',
    orderId: 'Order #GK784521',
    placedOn: '21 Nov, 2026',
    productName: 'Personalized Photo Mug',
    productImage: customizedPhotoMugImg,
    quantity: 1,
    unitPrice: 349,
    shippingCharge: 0,
    grandTotal: 349,
    status: 'Processing',
    paymentMethod: 'UPI (Google Pay · Prepaid)',
    paymentBadge: 'Paid',
    deliveryAddress: {
      name: 'Ananya Chatterjee',
      line1: 'House No. 14, College Road',
      line2: 'Near Main Market Square',
      cityStatePin: 'Jalchak, West Bengal — 721155',
      phone: '+91 93820 40746',
    },
    timeline: [
      {
        label: 'Order Placed',
        dateLabel: '21 Nov',
        state: 'completed',
        detail: 'Your personalized gift order has been confirmed.',
      },
      {
        label: 'Processing',
        dateLabel: 'Now',
        state: 'current',
        detail: 'Our gifting studio is printing and preparing your mug.',
      },
      {
        label: 'Shipped',
        dateLabel: 'Expected 22 Nov',
        state: 'pending',
        detail: 'Will be handed over to our delivery partner soon.',
      },
      {
        label: 'Delivered',
        dateLabel: 'Expected 24 Nov',
        state: 'pending',
        detail: 'Safe doorstep delivery with protective packaging.',
      },
    ],
  },
  {
    id: 'ord-gk784330',
    orderId: 'Order #GK784330',
    placedOn: '18 Nov, 2026',
    productName: '3D Moon Lamp (LED)',
    productImage: moonLampImg,
    quantity: 1,
    unitPrice: 699,
    shippingCharge: 0,
    grandTotal: 699,
    status: 'Shipped',
    paymentMethod: 'Debit Card (Prepaid)',
    paymentBadge: 'Paid',
    deliveryAddress: {
      name: 'Ananya Chatterjee',
      line1: 'House No. 14, College Road',
      line2: 'Near Main Market Square',
      cityStatePin: 'Jalchak, West Bengal — 721155',
      phone: '+91 93820 40746',
    },
    timeline: [
      {
        label: 'Order Placed',
        dateLabel: '18 Nov',
        state: 'completed',
        detail: 'Order received and verified successfully.',
      },
      {
        label: 'Processing',
        dateLabel: '18 Nov',
        state: 'completed',
        detail: 'Quality checked and gift-packed securely.',
      },
      {
        label: 'Shipped',
        dateLabel: '20 Nov',
        state: 'current',
        detail: 'Package dispatched and currently in transit.',
      },
      {
        label: 'Delivered',
        dateLabel: 'Expected 22 Nov',
        state: 'pending',
        detail: 'Out for delivery update will appear shortly.',
      },
    ],
  },
  {
    id: 'ord-gk783912',
    orderId: 'Order #GK783912',
    placedOn: '12 Nov, 2026',
    deliveredOn: '15 Nov, 2026',
    productName: 'Personalized Cushion',
    productImage: heartCushionImg,
    quantity: 1,
    unitPrice: 499,
    shippingCharge: 0,
    grandTotal: 499,
    status: 'Delivered',
    paymentMethod: 'Cash on Delivery',
    paymentBadge: 'Paid on Delivery',
    deliveryAddress: {
      name: 'Ananya Chatterjee',
      line1: 'House No. 14, College Road',
      line2: 'Near Main Market Square',
      cityStatePin: 'Jalchak, West Bengal — 721155',
      phone: '+91 93820 40746',
    },
    timeline: [
      {
        label: 'Order Placed',
        dateLabel: '12 Nov',
        state: 'completed',
        detail: 'Order placed and confirmed by GiftKart.',
      },
      {
        label: 'Processing',
        dateLabel: '12 Nov',
        state: 'completed',
        detail: 'Custom cushion printed and finished with care.',
      },
      {
        label: 'Shipped',
        dateLabel: '13 Nov',
        state: 'completed',
        detail: 'Dispatched from GiftKart fulfillment hub.',
      },
      {
        label: 'Delivered',
        dateLabel: '15 Nov',
        state: 'completed',
        detail: 'Delivered safely to the recipient address.',
      },
    ],
  },
];

function getStatusBadgeClasses(status: OrderStatusKey): string {
  switch (status) {
    case 'Processing':
      return 'bg-[#FFF3E0] text-[#D97706] border border-[#FDE2B8]';
    case 'Shipped':
      return 'bg-[#EBF4FF] text-[#2563EB] border border-[#CFE3FF]';
    case 'Delivered':
      return 'bg-[#E8F8EE] text-[#15803D] border border-[#C6EED3]';
  }
}

function getCardTimelineShortDate(step: TimelineStep): string {
  if (step.state === 'pending') return '';
  return step.dateLabel;
}

function HorizontalOrderTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="mt-3 border-t border-[#F2E8FF] pt-3">
      <div className="grid grid-cols-4">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const nextStep = steps[idx + 1];

          let lineClass = 'bg-[#E5DFF0]';
          if (step.state === 'completed' && nextStep?.state === 'completed') {
            lineClass = 'bg-[#16A34A]';
          } else if (
            step.state === 'completed' &&
            nextStep?.state === 'current'
          ) {
            lineClass = 'bg-gradient-to-r from-[#16A34A] to-[#6A11CB]';
          }

          const shortDate = getCardTimelineShortDate(step);

          return (
            <div
              key={step.label}
              className="relative flex flex-col items-center text-center"
            >
              {/* Connecting Horizontal Progress Line */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-[10px] h-[2.5px] w-full -translate-y-1/2 ${lineClass}`}
                />
              )}

              {/* Step Node */}
              <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                {step.state === 'completed' && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A] text-white shadow-[0_2px_6px_rgba(22,163,74,0.28)]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}
                {step.state === 'current' && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-[3.5px] border-[#6A11CB] bg-white ring-3 ring-[#EBD8FF]/80" />
                )}
                {step.state === 'pending' && (
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[#CFC6DE] bg-white" />
                )}
              </div>

              {/* Step Label */}
              <span
                className={`mt-1.5 px-0.5 text-[9.5px] leading-[1.2] tracking-[-0.01em] min-[390px]:text-[10px] ${
                  step.state === 'current'
                    ? 'font-bold text-[#2B0B4E]'
                    : step.state === 'completed'
                      ? 'font-bold text-[#2B0B4E]'
                      : 'font-medium text-[#8B7AA0]'
                }`}
              >
                {step.label}
              </span>

              {/* Step Date / Sub-status */}
              {shortDate && (
                <span
                  className={`mt-0.5 text-[9px] leading-none min-[390px]:text-[9.5px] ${
                    step.state === 'current'
                      ? 'font-bold text-[#6A11CB]'
                      : 'font-medium text-[#6F5C88]'
                  }`}
                >
                  {shortDate}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileOrderDetailsView({
  order,
  onBack,
}: {
  order: SampleMobileOrder;
  onBack: () => void;
}) {
  const { pushToast } = useToast();

  return (
    <div className="px-3.5 pb-6 pt-3">
      {/* Back Header */}
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-bold text-[#6A11CB] shadow-[0_2px_8px_rgba(106,17,203,0.08)] active:scale-[0.98]"
      >
        <ArrowLeft className="h-3.5 w-3.5 stroke-[2.4]" />
        <span>Back to My Orders</span>
      </button>

      <div className="space-y-3">
        {/* Order Header Card */}
        <div className="rounded-[22px] border border-[#EFE2FF] bg-white p-4 shadow-[0_6px_18px_rgba(106,17,203,0.07)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-[16px] font-extrabold text-[#2B0B4E]">
                {order.orderId}
              </h1>
              <p className="mt-0.5 text-[11.5px] font-medium text-[#6F5C88]">
                Order Date: {order.placedOn}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${getStatusBadgeClasses(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          {/* Product Summary */}
          <div className="mt-3.5 flex items-center gap-3 border-t border-[#F2E8FF] pt-3.5">
            <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-[#EFE2FF] bg-[#FAF6FF]">
              <img
                src={order.productImage}
                alt={order.productName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-extrabold leading-snug text-[#2B0B4E]">
                {order.productName}
              </p>
              <p className="mt-1 text-[12px] font-semibold text-[#6F5C88]">
                Quantity: {order.quantity}
              </p>
              <p className="mt-1 text-[15px] font-extrabold tabular-nums text-[#6A11CB]">
                ₹{order.unitPrice}
              </p>
            </div>
          </div>
        </div>

        {/* Full Order Tracking Timeline */}
        <div className="rounded-[22px] border border-[#EFE2FF] bg-white p-4 shadow-[0_6px_18px_rgba(106,17,203,0.06)]">
          <div className="mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#6A11CB]" />
            <h2 className="text-[13.5px] font-extrabold text-[#2B0B4E]">
              Order Tracking Timeline
            </h2>
          </div>

          <ol className="space-y-3.5">
            {order.timeline.map((step, idx) => {
              const isLast = idx === order.timeline.length - 1;
              return (
                <li key={step.label} className="relative flex gap-3">
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-[9px] top-5 h-[calc(100%+4px)] w-[2px] ${
                        step.state === 'completed'
                          ? 'bg-[#16A34A]'
                          : 'bg-[#E5DFF0]'
                      }`}
                    />
                  )}
                  <div className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
                    {step.state === 'completed' && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A] text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                    {step.state === 'current' && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border-[3.5px] border-[#6A11CB] bg-white ring-3 ring-[#EBD8FF]/80" />
                    )}
                    {step.state === 'pending' && (
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[#CFC6DE] bg-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[12.5px] font-bold ${
                          step.state === 'pending'
                            ? 'text-[#8B7AA0]'
                            : 'text-[#2B0B4E]'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span
                        className={`shrink-0 text-[11px] font-semibold ${
                          step.state === 'current'
                            ? 'text-[#6A11CB]'
                            : 'text-[#75628E]'
                        }`}
                      >
                        {step.dateLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-[#6F5C88]">
                      {step.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Delivery Address Section */}
        <div className="rounded-[22px] border border-[#EFE2FF] bg-white p-4 shadow-[0_6px_18px_rgba(106,17,203,0.06)]">
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#FF4D8D]" />
            <h2 className="text-[13.5px] font-extrabold text-[#2B0B4E]">
              Delivery Address
            </h2>
          </div>
          <p className="text-[13px] font-bold text-[#2B0B4E]">
            {order.deliveryAddress.name}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[#5E4A77]">
            {order.deliveryAddress.line1}, {order.deliveryAddress.line2}
          </p>
          <p className="text-[12px] font-semibold text-[#6A11CB]">
            {order.deliveryAddress.cityStatePin}
          </p>
          <p className="mt-1 text-[11.5px] font-medium text-[#6F5C88]">
            Phone: {order.deliveryAddress.phone}
          </p>
        </div>

        {/* Payment Method Section */}
        <div className="rounded-[22px] border border-[#EFE2FF] bg-white p-4 shadow-[0_6px_18px_rgba(106,17,203,0.06)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#6A11CB]" />
              <h2 className="text-[13.5px] font-extrabold text-[#2B0B4E]">
                Payment Method
              </h2>
            </div>
            <span className="rounded-full bg-[#F5ECFF] px-2.5 py-0.5 text-[10.5px] font-bold text-[#6A11CB]">
              {order.paymentBadge}
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] font-semibold text-[#5E4A77]">
            {order.paymentMethod}
          </p>
        </div>

        {/* Price Summary Section */}
        <div className="rounded-[22px] border border-[#EFE2FF] bg-white p-4 shadow-[0_6px_18px_rgba(106,17,203,0.06)]">
          <h2 className="mb-2.5 text-[13.5px] font-extrabold text-[#2B0B4E]">
            Price Summary
          </h2>
          <div className="space-y-2 text-[12.5px]">
            <div className="flex items-center justify-between text-[#5E4A77]">
              <span>Total Amount</span>
              <span className="font-semibold tabular-nums text-[#2B0B4E]">
                ₹{order.unitPrice * order.quantity}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#5E4A77]">
              <span>Shipping Charge</span>
              <span className="font-semibold text-[#15803D]">
                {order.shippingCharge === 0 ? 'Free' : `₹${order.shippingCharge}`}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#F0E4FF] pt-2.5 text-[14px] font-extrabold text-[#2B0B4E]">
              <span>Grand Total</span>
              <span className="tabular-nums text-[#6A11CB]">
                ₹{order.grandTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() =>
              pushToast({
                title: 'Shipment Tracking Preview',
                description: `Status for ${order.orderId}: ${order.status}.`,
                variant: 'info',
              })
            }
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] px-3 text-[12.5px] font-bold text-white shadow-[0_6px_16px_rgba(106,17,203,0.25)] active:scale-[0.98]"
          >
            <Truck className="h-4 w-4 shrink-0" />
            <span>Track Shipment</span>
          </button>

          <Link
            to="/contact"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-[#E6D3FF] bg-white px-3 text-[12.5px] font-bold text-[#6A11CB] shadow-[0_3px_10px_rgba(106,17,203,0.08)] active:scale-[0.98]"
          >
            <Headset className="h-4 w-4 shrink-0" />
            <span>Contact Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileEmptyOrdersState() {
  return (
    <div className="px-4 pb-8 pt-6 text-center">
      <div className="mx-auto max-w-[340px] rounded-[26px] border border-[#EFE2FF] bg-white/90 px-5 py-7 shadow-[0_8px_24px_rgba(106,17,203,0.07)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#F4E6FF] to-[#FFE7F2] text-[#6A11CB] shadow-inner">
          <Gift className="h-10 w-10 stroke-[1.8]" />
        </div>
        <h2 className="mt-4 text-[21px] font-extrabold tracking-[-0.015em] text-[#2B0B4E]">
          No Orders Yet!
        </h2>
        <p className="mt-2 text-[13px] leading-[1.5] text-[#5C4875]">
          You haven&apos;t placed any orders yet. Explore our collection and
          find the perfect gift.
        </p>
        <Link
          to="/shop"
          className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#9C1FC0] to-[#FF4D8D] px-6 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(106,17,203,0.26)] active:scale-[0.98]"
        >
          <span>Explore Gifts</span>
          <ArrowRight className="h-4 w-4 stroke-[2.3]" />
        </Link>
      </div>
    </div>
  );
}

export function MobileOrdersPage() {
  const { customerAccount } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const previewParam = searchParams.get('view'); // optional design preview query: logged-out | orders | empty | details
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTabKey>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    previewParam === 'details' ? SAMPLE_MOBILE_ORDERS[0].id : null
  );

  // Determine active visual state while strictly honoring Logged-Out security rule
  const isLoggedInView =
    previewParam === 'logged-out'
      ? false
      : previewParam === 'orders' ||
          previewParam === 'empty' ||
          previewParam === 'details'
        ? true
        : Boolean(customerAccount);

  const isEmptyPreview = previewParam === 'empty';

  const ordersSource = isEmptyPreview ? [] : SAMPLE_MOBILE_ORDERS;

  const statusCounts = useMemo(
    () => ({
      all: ordersSource.length,
      Processing: ordersSource.filter((o) => o.status === 'Processing').length,
      Shipped: ordersSource.filter((o) => o.status === 'Shipped').length,
      Delivered: ordersSource.filter((o) => o.status === 'Delivered').length,
    }),
    [ordersSource]
  );

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return ordersSource;
    return ordersSource.filter((order) => order.status === activeFilter);
  }, [activeFilter, ordersSource]);

  const selectedOrder = selectedOrderId
    ? ordersSource.find((o) => o.id === selectedOrderId) ?? null
    : null;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      navigate('/search');
      return;
    }
    navigate(`/search?search=${encodeURIComponent(trimmed)}`);
  }

  const filterTabs: Array<{ key: FilterTabKey; label: string; count: number }> = [
    { key: 'all', label: 'All Orders', count: statusCounts.all },
    { key: 'Processing', label: 'Processing', count: statusCounts.Processing },
    { key: 'Shipped', label: 'Shipped', count: statusCounts.Shipped },
    { key: 'Delivered', label: 'Delivered', count: statusCounts.Delivered },
  ];

  return (
    <div className="min-h-[calc(100dvh-132px)] w-full overflow-x-clip bg-gradient-to-b from-[#FCE9F6] via-[#FAF0FF] to-[#F6EEFF]">
      {/* Search Bar Directly Beneath Existing Mobile Header */}
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

      {/* STATE 1: LOGGED-OUT SCREEN (Strictly zero order IDs, products, or customer data) */}
      {!isLoggedInView ? (
        <section
          aria-label="Login Required to View Orders"
          className="flex flex-col items-center px-4 pb-8 pt-3 text-center"
        >
          {/* Uploaded View Your Orders PNG Illustration (Original Aspect Ratio, No Stretch) */}
          <div className="flex w-full items-center justify-center py-2">
            <img
              src={VIEW_ORDERS_ILLUSTRATION}
              alt="View Your Orders Illustration"
              className="mx-auto h-auto w-full max-w-[235px] object-contain drop-shadow-[0_10px_22px_rgba(106,17,203,0.12)] min-[390px]:max-w-[258px]"
            />
          </div>

          <h1 className="mt-2 text-[25px] font-extrabold tracking-[-0.02em] text-[#2B0B4E] min-[390px]:text-[27px]">
            View Your Orders
          </h1>

          <p className="mt-2 max-w-[300px] text-[13.5px] leading-[1.48] text-[#523D6D]">
            Please <span className="font-bold text-[#2B0B4E]">log in</span> to
            see your order history, track progress and order details.
          </p>

          {/* Primary & Secondary Auth Buttons */}
          <div className="mt-5 w-full max-w-[348px] space-y-3">
            <Link
              to="/account"
              state={{ from: '/my-orders' }}
              className="relative flex min-h-[50px] w-full items-center justify-between rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] px-5 text-[15px] font-bold text-white shadow-[0_8px_22px_rgba(106,17,203,0.28)] transition-transform active:scale-[0.985]"
            >
              <span className="flex items-center gap-3">
                <User className="h-[20px] w-[20px] shrink-0 stroke-[2]" />
                <span>Login / Sign In</span>
              </span>
              <ChevronRight className="h-[20px] w-[20px] shrink-0 stroke-[2.2]" />
            </Link>

            <Link
              to="/account"
              state={{ from: '/my-orders', mode: 'signup' }}
              className="flex min-h-[48px] w-full items-center justify-start gap-3 rounded-full border border-[#EBD8FF] bg-white px-5 text-[14.5px] font-bold text-[#2B0B4E] shadow-[0_4px_14px_rgba(106,17,203,0.08)] transition-transform active:scale-[0.985]"
            >
              <UserPlus className="h-[20px] w-[20px] shrink-0 text-[#6A11CB] stroke-[2]" />
              <span>Create New Account</span>
            </Link>
          </div>

          {/* 3 Compact Feature Highlight Cards */}
          <div className="mt-5 grid w-full max-w-[360px] grid-cols-3 gap-2.5">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#EFE2FF] bg-[#FAF4FF]/90 px-2 py-3 text-center shadow-[0_3px_12px_rgba(106,17,203,0.06)]">
              <Package className="h-[22px] w-[22px] text-[#3B1764] stroke-[1.9]" />
              <span className="mt-1.5 text-[11.5px] font-bold leading-[1.25] text-[#2B0B4E] min-[390px]:text-[12px]">
                Track
                <br />
                Orders
              </span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#EFE2FF] bg-[#FAF4FF]/90 px-2 py-3 text-center shadow-[0_3px_12px_rgba(106,17,203,0.06)]">
              <RotateCcw className="h-[22px] w-[22px] text-[#3B1764] stroke-[1.9]" />
              <span className="mt-1.5 text-[11.5px] font-bold leading-[1.25] text-[#2B0B4E] min-[390px]:text-[12px]">
                Easy
                <br />
                Returns
              </span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#EFE2FF] bg-[#FAF4FF]/90 px-2 py-3 text-center shadow-[0_3px_12px_rgba(106,17,203,0.06)]">
              <ShieldCheck className="h-[22px] w-[22px] text-[#3B1764] stroke-[1.9]" />
              <span className="mt-1.5 text-[11.5px] font-bold leading-[1.25] text-[#2B0B4E] min-[390px]:text-[12px]">
                Order
                <br />
                Support
              </span>
            </div>
          </div>
        </section>
      ) : selectedOrder ? (
        /* STATE 4: ORDER DETAILS STATIC VIEW */
        <MobileOrderDetailsView
          order={selectedOrder}
          onBack={() => setSelectedOrderId(null)}
        />
      ) : ordersSource.length === 0 ? (
        /* STATE 3: LOGGED-IN EMPTY ORDERS SCREEN */
        <MobileEmptyOrdersState />
      ) : (
        /* STATE 2: LOGGED-IN MY ORDERS DASHBOARD */
        <section
          aria-label="My Orders Dashboard"
          className="px-3.5 pb-8 pt-2.5"
        >
          {/* Page Heading with Package Icon */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2B0B4E] shadow-[0_3px_10px_rgba(106,17,203,0.08)]">
              <Package className="h-6 w-6 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[20px] font-extrabold leading-tight tracking-[-0.015em] text-[#2B0B4E] min-[390px]:text-[22px]">
                My Orders
              </h1>
              <p className="mt-0.5 text-[12px] font-medium text-[#5A4476] min-[390px]:text-[12.5px]">
                Track, manage and view all your orders.
              </p>
            </div>
          </div>

          {/* Order Status Filter Tabs (Horizontal Scrollable) */}
          <div
            role="tablist"
            aria-label="Filter orders by status"
            className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
          >
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#6A11CB] to-[#8E24AA] font-bold text-white shadow-[0_4px_12px_rgba(106,17,203,0.28)]'
                      : 'border border-[#EFE2FF] bg-white font-semibold text-[#2B0B4E] shadow-[0_2px_8px_rgba(106,17,203,0.05)] active:bg-[#F5ECFF]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          {/* Order Cards Stack */}
          {filteredOrders.length === 0 ? (
            <div className="mt-4">
              <MobileEmptyOrdersState />
            </div>
          ) : (
            <div className="mt-3.5 space-y-3">
              {filteredOrders.map((order) => (
                <article
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedOrderId(order.id);
                    }
                  }}
                  aria-label={`View details for ${order.orderId}`}
                  className="cursor-pointer rounded-[22px] border border-[#EFE2FF] bg-white p-3.5 shadow-[0_6px_20px_rgba(106,17,203,0.07)] transition-transform duration-150 active:scale-[0.99]"
                >
                  {/* Top Product + Meta Row */}
                  <div className="flex items-start gap-3">
                    {/* Square Product Image */}
                    <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-[#F2E7FF] bg-[#FAF6FF] min-[390px]:h-[76px] min-[390px]:w-[76px]">
                      <img
                        src={order.productImage}
                        alt={order.productName}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Details Column */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h2 className="truncate text-[13px] font-extrabold text-[#2B0B4E] min-[390px]:text-[13.5px]">
                          {order.orderId}
                        </h2>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold min-[390px]:text-[11px] ${getStatusBadgeClasses(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <p className="mt-0.5 text-[11px] font-medium text-[#705D89]">
                        Placed on: {order.placedOn}
                      </p>

                      <div className="mt-1 flex items-center justify-between gap-1.5">
                        <p className="truncate text-[12.5px] font-bold text-[#2B0B4E] min-[390px]:text-[13px]">
                          {order.productName}
                        </p>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#6A11CB] stroke-[2.2]" />
                      </div>

                      <p className="mt-0.5 text-[12px] font-medium text-[#6B5884]">
                        Qty: <span className="font-bold text-[#2B0B4E]">{order.quantity}</span>
                        <span className="mx-1.5 text-[#D5C4EA]">|</span>
                        <span className="font-extrabold tabular-nums text-[#2B0B4E]">
                          ₹{order.grandTotal}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Horizontal 4-Step Tracking Timeline */}
                  <HorizontalOrderTimeline steps={order.timeline} />

                  {/* Delivered Order Footer: Delivery Date + Buy Again Button */}
                  {order.status === 'Delivered' && order.deliveredOn && (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[#F8F3FF] px-3 py-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                        <span className="truncate text-[11px] font-medium text-[#4A3566] min-[390px]:text-[11.5px]">
                          Delivered on{' '}
                          <strong className="font-bold text-[#2B0B4E]">
                            {order.deliveredOn}
                          </strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          pushToast({
                            title: 'Ready to Reorder',
                            description: `Exploring "${order.productName}" in GiftKart store.`,
                            variant: 'success',
                          });
                          navigate('/shop');
                        }}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#DEC7FF] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6A11CB] shadow-[0_2px_6px_rgba(106,17,203,0.08)] active:scale-[0.97]"
                      >
                        <RefreshCw className="h-3 w-3 stroke-[2.4]" />
                        <span>Buy Again</span>
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
