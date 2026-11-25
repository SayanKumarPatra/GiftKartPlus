import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Check,
  Clock,
  Gift,
  Home,
  Mail,
  MapPin,
  MoreHorizontal,
  Package,
  PencilLine,
  Phone,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { services } from '../../services/registry';
import {
  useSavedAddresses,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { useAuth } from '../../context/AuthContext';
import { STUDIO_MEDIA } from '../../config/appConfig';
import type { DemoOrder, SavedAddress } from '../../types';
import { formatDateTime, formatInr } from '../../utils/format';
import {
  validateEmail,
  validateIndianPhone,
  validateIndianPincode,
  validateRequired,
} from '../../utils/validation';
import {
  INDIAN_STATES,
  canCustomerCancelOrder,
  formatFullAddress,
  getCustomerOrderStatusLabel,
  getOrderStatusBadgeClasses,
  getOrderTimelineStepIndex,
  lookupIndianPin,
  normalizeAddressType,
  type AddressTypeOption,
} from '../../utils/storefrontHelpers';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductImage } from '../../components/ui/ProductImage';
import { MobileSavedAddressesPage } from '../../components/storefront/MobileSavedAddressesPage';

const ORDER_DETAIL_STAGES = [
  'Order Placed',
  'Processing',
  'Shipped',
  'Delivered',
] as const;

/* ============================================================================
 * #14 ORDER DETAILS PAGE (/order/:orderNumber)
 * ========================================================================== */
export function OrderDetailsPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void services.orders
      .getOrderByNumber(orderNumber ?? '')
      .then((found) => {
        if (active) setOrder(found);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderNumber]);

  async function handleCancelOrder() {
    if (!order || !canCustomerCancelOrder(order.fulfillmentStatus) || cancelling) {
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await services.orders.cancelOrderByCustomer(order.id);
      setOrder(updated);
      setConfirmCancel(false);
    } catch (err) {
      setCancelError(
        err instanceof Error
          ? err.message
          : 'Order cannot be cancelled once processing has started.'
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-[#F4EBFF]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#FAF6FF]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <EmptyState
          title="Order not found"
          description={`We could not find an order matching "${orderNumber ?? ''}".`}
          icon={<Package className="h-5 w-5" />}
          action={
            <Link to="/my-orders">
              <Button size="sm">View My Orders</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const displayStatus = getCustomerOrderStatusLabel(order.fulfillmentStatus);
  const statusBadgeClass = getOrderStatusBadgeClasses(order.fulfillmentStatus);
  const timelineStepIdx = getOrderTimelineStepIndex(order.fulfillmentStatus);
  const cancellable = canCustomerCancelOrder(order.fulfillmentStatus);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#6E5B85]">
        <Link to="/" className="hover:text-[#6A11CB]">Home</Link>
        <span>/</span>
        <Link to="/my-orders" className="hover:text-[#6A11CB]">My Orders</Link>
        <span>/</span>
        <span className="font-bold text-[#1E1035]">{order.orderNumber}</span>
      </nav>

      {/* Clean Order Summary Header */}
      <div className="rounded-2xl border border-[#EFE3FF] bg-white p-6 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#7A6894]">
              Order Receipt
            </p>
            <h1 className="mt-1 font-mono text-2xl font-extrabold text-[#1E1035] sm:text-3xl">
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-xs text-[#594A6B]">
              Placed on {formatDateTime(order.createdAt)} · Payment:{' '}
              <strong className="text-[#6A11CB]">
                {order.paymentMethod || 'Cash on Delivery (COD)'}
              </strong>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span
              className={`inline-flex rounded-full px-3.5 py-1 text-xs font-bold ${statusBadgeClass}`}
            >
              {displayStatus}
            </span>
            <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-[#1E1035]">
              {formatInr(order.grandTotalInr)}
            </p>
          </div>
        </div>

        {/* 4-Step Live Horizontal Progress Bar */}
        {displayStatus !== 'Cancelled' ? (
          <div className="mt-5 border-t border-[#EFE3FF] pt-5">
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ORDER_DETAIL_STAGES.map((stage, idx) => {
                const done = timelineStepIdx >= idx;
                return (
                  <li key={stage} className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        done
                          ? 'bg-[#6A11CB] text-white'
                          : 'border border-[#DFD2F2] bg-[#FAF8FC] text-[#9B8AB4]'
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5 stroke-[2.8]" /> : idx + 1}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        done ? 'text-[#1E1035]' : 'text-[#9B8AB4]'
                      }`}
                    >
                      {stage}
                    </span>
                    {idx < ORDER_DETAIL_STAGES.length - 1 && (
                      <span
                        className={`hidden h-0.5 flex-1 rounded-full sm:block ${
                          timelineStepIdx > idx ? 'bg-[#6A11CB]' : 'bg-[#EFE3FF]'
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>This order was cancelled before processing started.</span>
          </div>
        )}
      </div>

      {/* Ordered Items */}
      <div className="space-y-4 rounded-2xl border border-[#EFE3FF] bg-white p-6 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.1)]">
        <h2 className="text-base font-extrabold text-[#1E1035]">
          Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
        </h2>
        <div className="divide-y divide-[#F0E4FF]">
          {order.items.map((item, idx) => (
            <div
              key={`${item.productSkuSnapshot}-${idx}`}
              className="flex gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-[#FAF6FF]">
                <ProductImage
                  src={item.imageSnapshot}
                  alt={item.productNameSnapshot}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#1E1035]">
                      {item.productNameSnapshot}
                    </p>
                    <p className="font-mono text-[11px] text-[#7B6496]">
                      SKU: {item.productSkuSnapshot} · {formatInr(item.unitPriceInrSnapshot)} ×{' '}
                      {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-extrabold tabular-nums text-[#6A11CB]">
                    {formatInr(item.lineTotalInr)}
                  </span>
                </div>
                {Object.keys(item.selectedVariants).length > 0 && (
                  <p className="mt-1 text-xs text-[#594A6B]">
                    {Object.entries(item.selectedVariants)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </p>
                )}
                {item.personalizationDetails && (
                  <p className="mt-1 text-xs font-semibold text-[#6A11CB]">
                    Personalization: {item.personalizationDetails}
                  </p>
                )}
                {item.customPhotoFileName && (
                  <p className="mt-0.5 text-xs font-medium text-[#FF4D8D]">
                    Photo Attached: {item.customPhotoFileName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery, Gift Wrap & Price Summary */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-1.5 rounded-2xl border border-[#EFE3FF] bg-white p-5 text-xs">
          <p className="flex items-center gap-1.5 font-extrabold text-[#1E1035]">
            <MapPin className="h-4 w-4 text-[#FF4D8D]" />
            <span>Delivery Address</span>
          </p>
          <p className="font-bold text-[#1E1035]">{order.customer.fullName}</p>
          <p className="text-[#594A6B]">{order.customer.addressLine1}</p>
          {order.customer.addressLine2 && (
            <p className="text-[#594A6B]">{order.customer.addressLine2}</p>
          )}
          <p className="font-semibold text-[#6A11CB]">
            {order.customer.city}, {order.customer.state} — {order.customer.pincode}
          </p>
          <p className="text-[#594A6B]">
            {order.customer.phone}
            {order.customer.email ? ` · ${order.customer.email}` : ''}
          </p>
        </div>

        <div className="space-y-1.5 rounded-2xl border border-[#EFE3FF] bg-white p-5 text-xs">
          <p className="flex items-center gap-1.5 font-extrabold text-[#1E1035]">
            <Gift className="h-4 w-4 text-[#FF4D8D]" />
            <span>Gift Wrapping</span>
          </p>
          {order.giftWrap.enabled ? (
            <>
              <p className="font-bold text-[#6A11CB]">
                {order.giftWrap.styleNameSnapshot} (
                {formatInr(order.giftWrap.chargeInrSnapshot)})
              </p>
              {order.giftWrap.recipientName && (
                <p className="text-[#594A6B]">
                  Recipient:{' '}
                  <strong className="text-[#1E1035]">
                    {order.giftWrap.recipientName}
                  </strong>
                </p>
              )}
              {order.giftWrap.giftMessage && (
                <p className="italic text-[#594A6B]">
                  &ldquo;{order.giftWrap.giftMessage}&rdquo;
                </p>
              )}
            </>
          ) : (
            <p className="text-[#594A6B]">Standard protective packaging.</p>
          )}
        </div>

        <div className="space-y-1.5 rounded-2xl border border-[#EFE3FF] bg-white p-5 text-xs">
          <p className="font-extrabold text-[#1E1035]">Order Totals</p>
          <div className="flex justify-between text-[#594A6B]">
            <span>Subtotal</span>
            <span className="font-mono">{formatInr(order.subtotalInr)}</span>
          </div>
          {order.giftWrapChargeInr > 0 && (
            <div className="flex justify-between text-[#594A6B]">
              <span>Gift Wrapping</span>
              <span className="font-mono">{formatInr(order.giftWrapChargeInr)}</span>
            </div>
          )}
          {order.discountInr > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
              <span className="font-mono">-{formatInr(order.discountInr)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#594A6B]">
            <span>Delivery</span>
            <span className="font-mono">
              {order.deliveryChargeInr === 0
                ? 'FREE'
                : formatInr(order.deliveryChargeInr)}
            </span>
          </div>
          <div className="flex justify-between text-[#594A6B]">
            <span>Payment Method</span>
            <span className="font-bold text-[#1E1035]">
              {order.paymentMethod || 'Cash on Delivery (COD)'}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#EFE3FF] pt-2 text-sm font-extrabold text-[#1E1035]">
            <span>Grand Total</span>
            <span className="font-mono text-[#6A11CB]">
              {formatInr(order.grandTotalInr)}
            </span>
          </div>
        </div>
      </div>

      {/* Status History & Cancellation Controls */}
      <div className="space-y-4 rounded-2xl border border-[#EFE3FF] bg-white p-6">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-[#1E1035]">
          <Clock className="h-4 w-4 text-[#6A11CB]" />
          <span>Order Activity Log</span>
        </h2>
        <ol className="space-y-3 border-l-2 border-[#EBD8FF] pl-5">
          {order.statusHistory.map((entry, idx) => (
            <li key={`${entry.timestamp}-${idx}`} className="relative text-xs">
              <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-[#6A11CB]" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#1E1035]">
                  {getCustomerOrderStatusLabel(entry.status)}
                </span>
                <span className="font-mono text-[11px] text-[#7B6496]">
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>
              {entry.note && <p className="mt-0.5 text-[#594A6B]">{entry.note}</p>}
            </li>
          ))}
        </ol>

        {cancelError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700">
            {cancelError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-[#EFE3FF] pt-4">
          <Link to="/my-orders">
            <Button variant="glass" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to My Orders</span>
            </Button>
          </Link>

          {cancellable &&
            (confirmCancel ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-rose-800">
                  Confirm cancellation?
                </span>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => void handleCancelOrder()}
                  className="cursor-pointer rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="cursor-pointer rounded-lg border border-[#DFD2F2] bg-white px-3 py-1.5 text-xs font-bold text-[#2B0B4E]"
                >
                  Keep Order
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="glass"
                size="sm"
                onClick={() => setConfirmCancel(true)}
                className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50"
              >
                Cancel Order
              </Button>
            ))}

          {(displayStatus === 'Processing' || displayStatus === 'Shipped') && (
            <span className="text-xs font-medium text-[#685782]">
              Cancellation is unavailable once processing has started.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const DESKTOP_ADDRESS_TYPES: Array<{
  value: AddressTypeOption;
  label: string;
  Icon: typeof Home;
}> = [
  { value: 'Home', label: 'Home', Icon: Home },
  { value: 'Work', label: 'Work', Icon: Briefcase },
  { value: 'Other', label: 'Other', Icon: MoreHorizontal },
];

/* ============================================================================
 * #15 SAVED ADDRESSES PAGE (/addresses) — Full Desktop Parity with Mobile
 * ========================================================================== */
export function SavedAddressesPage() {
  const { data: addresses } = useSavedAddresses();
  const { data: settings } = useStoreSettings();
  const { customerAccount } = useAuth();

  const activeZones = (settings?.deliveryZones ?? []).filter((z) => z.isActive);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(customerAccount?.email ?? '');
  const [addressLine1, setAddressLine1] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [stateName, setStateName] = useState('West Bengal');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [addressType, setAddressType] = useState<AddressTypeOption>('Home');
  const [isDefault, setIsDefault] = useState(true);
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  useEffect(() => {
    if (customerAccount?.email && !editingId && !email) {
      setEmail(customerAccount.email);
    }
  }, [customerAccount?.email, editingId, email]);

  function resetForm() {
    setEditingId(null);
    setFullName('');
    setPhone('');
    setEmail(customerAccount?.email ?? '');
    setAddressLine1('');
    setLandmark('');
    setPincode('');
    setStateName('West Bengal');
    setCity('');
    setArea('');
    setAddressType('Home');
    setIsDefault(addresses.length === 0);
    setSaveForFuture(true);
    setError(null);
  }

  function startEditAddress(addr: SavedAddress) {
    setEditingId(addr.id);
    setFullName(addr.fullName);
    const digits = addr.phone.replace(/\D/g, '');
    setPhone(digits.length > 10 ? digits.slice(-10) : digits);
    setEmail(addr.email || customerAccount?.email || '');
    setAddressLine1(addr.addressLine1);
    setLandmark(addr.landmark ?? '');
    setPincode(addr.pincode);
    setStateName(addr.state || 'West Bengal');
    setCity(addr.city || '');
    setArea(addr.area || '');
    setAddressType(normalizeAddressType(addr.label));
    setIsDefault(addr.isDefault);
    setSaveForFuture(true);
    setError(null);
    setSavedBanner(null);
  }

  function handlePinChange(raw: string) {
    const cleanPin = raw.replace(/\D/g, '').slice(0, 6);
    setPincode(cleanPin);
    if (cleanPin.length === 6) {
      const match = lookupIndianPin(cleanPin);
      if (match) {
        setStateName(match.state);
        if (match.city) setCity(match.city);
        if (match.area) setArea(match.area);
      }
    }
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedBanner(null);

    const nameRes = validateRequired(fullName, 'Full name');
    if (!nameRes.valid) return setError(nameRes.error!);
    const phoneRes = validateIndianPhone(phone);
    if (!phoneRes.valid) return setError(phoneRes.error!);
    if (email.trim()) {
      const emailRes = validateEmail(email);
      if (!emailRes.valid) return setError(emailRes.error!);
    }
    const addrRes = validateRequired(addressLine1, 'House / Street address');
    if (!addrRes.valid) return setError(addrRes.error!);
    const pinRes = validateIndianPincode(pincode);
    if (!pinRes.valid) return setError(pinRes.error!);
    if (!stateName.trim()) return setError('Please select your state.');
    if (!city.trim()) return setError('Please enter city or district.');
    if (!area.trim()) return setError('Please enter area or locality.');

    const defaultZone = activeZones[0];
    const payload: SavedAddress = {
      id: editingId ?? `addr-${Date.now()}`,
      label: addressType,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || customerAccount?.email || '',
      addressLine1: addressLine1.trim(),
      landmark: landmark.trim() || undefined,
      area: area.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      deliveryZoneId: defaultZone?.id ?? 'zone-jalchak',
      isDefault,
      createdAt: new Date().toISOString(),
    };

    await services.community.saveAddress(payload);
    setSavedBanner(
      editingId ? 'Address updated successfully.' : 'Address saved for faster checkout.'
    );
    resetForm();
  }

  return (
    <>
      {/* Normal Mobile (< 900px): Reference-Matched Compact One-Screen Address Management */}
      <div className="-mx-3.5 -my-4 sm:-mx-6 sm:-my-5 lg:hidden">
        <MobileSavedAddressesPage />
      </div>

      {/* Desktop & Laptop (>= 900px): Full 9-Field Parity with Mobile Saved Addresses */}
      <div className="mx-auto hidden max-w-5xl space-y-5 lg:block">
        <div className="border-b border-[#EFE3FF] pb-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-[#7A6894]"
          >
            <Link to="/" className="hover:text-[#6A11CB]">
              Home
            </Link>
            <span>/</span>
            <Link to="/account" className="hover:text-[#6A11CB]">
              Account
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#1E1035]">Saved Addresses</span>
          </nav>
          <h1 className="mt-1.5 font-display text-2xl font-bold text-[#1E1035]">
            Saved Delivery Addresses
          </h1>
          <p className="mt-0.5 text-[13px] text-[#685782]">
            Save and manage your delivery addresses for faster one-step GiftKart checkout.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Saved Address Cards */}
          <div className="space-y-3.5 lg:col-span-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#1E1035]">
                Your Addresses ({addresses.length})
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="cursor-pointer text-xs font-bold text-[#6A11CB] hover:underline"
                >
                  + Add New Instead
                </button>
              )}
            </div>

            {addresses.length === 0 ? (
              <EmptyState
                title="No saved addresses yet"
                description="Add your delivery address using the form to skip typing during checkout."
                icon={<MapPin className="h-5 w-5" />}
              />
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    addr.isDefault
                      ? 'border-[#6A11CB] bg-[#FAF6FF] shadow-xs'
                      : 'border-[#EFE3FF] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => void services.community.setDefaultAddress(addr.id)}
                        aria-label={`Set ${addr.fullName} as default address`}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 ${
                          addr.isDefault
                            ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
                            : 'border-[#C9B5E6] bg-white hover:border-[#6A11CB]'
                        }`}
                      >
                        {addr.isDefault && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-[#1E1035]">
                            {addr.fullName}
                          </span>
                          <span className="rounded bg-[#F4EBFF] px-2 py-0.5 text-[10px] font-bold text-[#6A11CB]">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="rounded bg-[#6A11CB] px-2 py-0.5 text-[10px] font-bold text-white">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#4B3963]">
                          {formatFullAddress(addr)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-[11.5px] font-medium text-[#685782]">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-[#6A11CB]" />
                            {addr.phone}
                          </span>
                          {addr.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3 text-[#6A11CB]" />
                              {addr.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center gap-3 border-t border-[#EFE3FF] pt-3 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => startEditAddress(addr)}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-[#6A11CB] hover:text-[#FF4D8D]"
                    >
                      <PencilLine className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <span className="h-3.5 w-px bg-[#EBD8FF]" />
                    <button
                      type="button"
                      onClick={() => {
                        if (editingId === addr.id) resetForm();
                        void services.community.deleteAddress(addr.id);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-[#7A6894] hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: 9-Field Add / Edit Address Form */}
          <form
            onSubmit={(e) => void handleSaveAddress(e)}
            className="space-y-4 rounded-2xl border border-[#EFE3FF] bg-white p-6 shadow-[0_8px_24px_-14px_rgba(106,17,203,0.12)] lg:col-span-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-[#1E1035]">
                <Plus className="h-4 w-4 text-[#FF4D8D]" />
                <span>{editingId ? 'Edit Saved Address' : 'Add New Address'}</span>
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="cursor-pointer text-xs font-bold text-[#7A6894] hover:text-[#1E1035]"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  Mobile Number *
                </label>
                <div className="mt-1 flex h-10 items-center overflow-hidden rounded-xl border border-[#DFD2F2] bg-white focus-within:border-[#6A11CB]">
                  <span className="flex h-full items-center border-r border-[#EFE3FF] bg-[#FAF6FF] px-2.5 text-xs font-bold text-[#6A11CB]">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="10-digit mobile"
                    className="h-full w-full px-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  House / Flat / Building / Street *
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g., Mukherjee Road, House No. 12"
                  className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g., Near Jalchak School"
                  className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="e.g., 721155"
                  className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3 font-mono text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  State *
                </label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  City / District *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Paschim Medinipur"
                  className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  Area / Locality *
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g., Jalchak"
                  className="mt-1 h-10 w-full rounded-xl border border-[#DFD2F2] bg-white px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>
            </div>

            {/* Address Type */}
            <div>
              <p className="text-xs font-bold text-[#2B0B4E]">Address Type *</p>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {DESKTOP_ADDRESS_TYPES.map(({ value, label, Icon }) => {
                  const active = addressType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAddressType(value)}
                      className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all ${
                        active
                          ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
                          : 'border-[#DFD2F2] bg-white text-[#2B0B4E] hover:border-[#6A11CB]/50'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Checkboxes */}
            <div className="space-y-2 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#4B3963]">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 accent-[#6A11CB]"
                />
                <span>Set as Default Address</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#4B3963]">
                <input
                  type="checkbox"
                  checked={saveForFuture}
                  onChange={(e) => setSaveForFuture(e.target.checked)}
                  className="h-4 w-4 accent-[#6A11CB]"
                />
                <span>Save this address for future orders</span>
              </label>
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {error}
              </p>
            )}
            {savedBanner && (
              <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <Check className="h-4 w-4" />
                {savedBanner}
              </p>
            )}

            <button
              type="submit"
              className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF247A] text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(106,17,203,0.4)] transition-opacity hover:opacity-95"
            >
              {editingId ? 'Update Address' : 'Save Address'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/* ============================================================================
 * #24 CUSTOMIZATION GUIDE PAGE (/customization-guide)
 * ========================================================================== */
export function CustomizationGuidePage() {
  const { data: settings } = useStoreSettings();

  const steps = [
    {
      step: '01',
      title: 'Select Your Base Product & Finish',
      body: 'Choose from customizable mugs, printed T-shirts, LED photo frames, cushions, and keepsakes directly from the product catalog.',
      img: STUDIO_MEDIA.coffeeMug,
    },
    {
      step: '02',
      title: 'Enter Exact Name, Date or Message',
      body: 'Provide exact spelling, dates, or short messages in the personalization field on the product page. Double-check spelling before checkout.',
      img: STUDIO_MEDIA.tshirtPrint,
    },
    {
      step: '03',
      title: 'Upload a Clear, High-Resolution Photo',
      body: 'Use a well-lit, front-facing photograph for best print sharpness on mugs, frames, and apparel. Avoid heavily cropped or low-light screenshots.',
      img: STUDIO_MEDIA.photoFrame,
    },
    {
      step: '04',
      title: 'Optional Gift Wrapping & Order Review',
      body: 'Add curated gift wrapping and a note card if desired, verify your delivery address, and confirm your order.',
      img: STUDIO_MEDIA.giftBox,
    },
  ];

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
        <span className="text-neutral-800">Customization Guide</span>
      </nav>

      {/* Clean Editorial Header */}
      <header className="mt-2.5 border-b border-neutral-200 pb-4">
        <h1 className="text-[22px] font-bold tracking-tight text-neutral-900 sm:text-[26px]">
          {settings?.pageContent?.customizationHeadline ??
            'How GiftKart Customization Works'}
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-neutral-600 sm:text-[14px]">
          {settings?.pageContent?.customizationNote ??
            'Step-by-step instructions for preparing photos, personalized text, and gift wrapping for crisp print results.'}
        </p>
      </header>

      {/* Structured 4-Step Editorial Grid */}
      <section
        aria-label="Customization steps"
        className="grid divide-y divide-neutral-200 border-b border-neutral-200 md:grid-cols-2 md:divide-x md:divide-y-0"
      >
        {steps.map(({ step, title, body, img }, index) => (
          <div
            key={step}
            className={`flex gap-3.5 py-4 sm:py-5 ${
              index % 2 === 0 ? 'md:pr-6' : 'md:pl-6'
            } ${index >= 2 ? 'md:border-t md:border-neutral-200' : ''}`}
          >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-50">
              <ProductImage
                src={img}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11.5px] font-medium text-neutral-400 tabular-nums">
                Step {step}
              </p>
              <h2 className="mt-0.5 text-[14px] font-semibold text-neutral-900">
                {title}
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600">
                {body}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Neutral Important Policy Notice */}
      <section className="mt-4 rounded border border-neutral-200 bg-neutral-50/70 px-4 py-3 text-[12.5px] text-neutral-600">
        <p className="font-semibold text-neutral-900">
          Important Note on Customized Orders
        </p>
        <p className="mt-0.5 leading-relaxed">
          Customized products carrying personal photos, names, or printed
          messages are non-returnable and non-refundable (except verified
          transit damage or wrong item reported within 48 hours). Orders cannot
          be cancelled once Processing begins.
        </p>
      </section>

      {/* Action Footer */}
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-4 text-[12.5px]">
          <Link
            to="/return-policy"
            className="text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
          >
            Return &amp; Refund Policy
          </Link>
          <Link
            to="/cancellation-policy"
            className="text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#6A11CB] hover:decoration-[#6A11CB]"
          >
            Cancellation Policy
          </Link>
        </div>
        <Link
          to="/customize"
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded border border-neutral-900 bg-neutral-900 px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Browse Customizable Gifts
        </Link>
      </footer>
    </div>
  );
}
