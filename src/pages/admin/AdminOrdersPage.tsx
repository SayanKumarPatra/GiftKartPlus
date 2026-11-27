import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Gift,
  History,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
} from 'lucide-react';
import { useOrders, useStoreSettings } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { formatDateTime, formatInr } from '../../utils/format';
import {
  ALL_ADMIN_ORDER_STATUSES,
  CANONICAL_PAYMENT_STATUSES,
  getAutoNotificationMessage,
  getOrderBadgeClasses,
  getPaymentBadgeClasses,
  getStatusDisplayLabel,
  normalizeOrderStatus,
  normalizePaymentStatus,
} from '../../utils/orderLifecycle';
import { downloadOrderReceiptPdf, printOrderReceipt } from '../../utils/orderReceiptPdf';
import { DeliveryVanTracker } from '../../components/order/DeliveryVanTracker';
import type {
  CanonicalOrderStatus,
  CanonicalPaymentStatus,
  DemoOrder,
  OrderShippingDetails,
} from '../../types';
import {
  AdminConfirmDialog,
  AdminEmptyState,
  AdminSheetModal,
  AdminToast,
} from '../../components/admin/AdminSharedUI';

type OrderFilterTab =
  | 'All'
  | 'New Order'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Exceptions';

const FILTER_TABS: { key: OrderFilterTab; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'New Order', label: 'New Order' },
  { key: 'Processing', label: 'Processing' },
  { key: 'Packed', label: 'Packed' },
  { key: 'Shipped', label: 'Shipped' },
  { key: 'In Transit', label: 'In Transit' },
  { key: 'Out for Delivery', label: 'Out for Delivery' },
  { key: 'Delivered', label: 'Delivered' },
  { key: 'Exceptions', label: 'Cancelled / Issues' },
];

function toDateTimeLocalValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function toDateInputValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function matchesFilter(order: DemoOrder, tab: OrderFilterTab): boolean {
  if (tab === 'All') return true;
  const canonical = normalizeOrderStatus(order.fulfillmentStatus);
  if (tab === 'Exceptions') {
    return (
      canonical === 'Cancelled' ||
      canonical === 'Delivery Failed' ||
      canonical === 'Returned'
    );
  }
  return canonical === tab;
}

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const { data: orders } = useOrders();
  const { data: storeSettings } = useStoreSettings();

  const [activeTab, setActiveTab] = useState<OrderFilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  // Order Status Update Form State
  const [nextStatus, setNextStatus] = useState<CanonicalOrderStatus>('New Order');
  const [updateDateTime, setUpdateDateTime] = useState<string>(toDateTimeLocalValue());
  const [customerNote, setCustomerNote] = useState<string>('');
  const [shippingForm, setShippingForm] = useState<OrderShippingDetails>({});
  const [savingStatus, setSavingStatus] = useState(false);

  // COD Payment Management Form State
  const [paymentStatusDraft, setPaymentStatusDraft] = useState<CanonicalPaymentStatus>('Unpaid');
  const [collectedAmountDraft, setCollectedAmountDraft] = useState<string>('0');
  const [collectionDateDraft, setCollectionDateDraft] = useState<string>(toDateTimeLocalValue());
  const [paymentNoteDraft, setPaymentNoteDraft] = useState<string>('');
  const [confirmPaidOpen, setConfirmPaidOpen] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Quick Actions / PDF / Previous Orders Modal
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [previousOrdersOpen, setPreviousOrdersOpen] = useState(false);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  // Synchronize forms whenever selected order changes
  useEffect(() => {
    if (!selectedOrder) return;
    const canonical = normalizeOrderStatus(selectedOrder.fulfillmentStatus);
    const canonicalPay = normalizePaymentStatus(selectedOrder);
    const existingShipping = selectedOrder.shippingDetails || {};
    const existingPay = selectedOrder.paymentDetails;

    setNextStatus(canonical);
    setUpdateDateTime(toDateTimeLocalValue());
    setCustomerNote('');
    setShippingForm({
      packingCompletedAt: existingShipping.packingCompletedAt || toDateInputValue(),
      packingNote: existingShipping.packingNote || '',
      courierName: existingShipping.courierName || '',
      trackingId: existingShipping.trackingId || '',
      shippedDate: existingShipping.shippedDate || toDateInputValue(),
      currentShippingUpdate: existingShipping.currentShippingUpdate || '',
      expectedDeliveryDate: existingShipping.expectedDeliveryDate || '',
      outForDeliveryDate: existingShipping.outForDeliveryDate || toDateInputValue(),
      deliveryRemarks: existingShipping.deliveryRemarks || '',
      deliveredAt: existingShipping.deliveredAt || toDateTimeLocalValue(),
      deliveryConfirmation: existingShipping.deliveryConfirmation || '',
      exceptionReason: existingShipping.exceptionReason || '',
    });

    setPaymentStatusDraft(canonicalPay);
    setCollectedAmountDraft(
      String(
        existingPay?.collectedAmountInr !== undefined && existingPay.collectedAmountInr > 0
          ? existingPay.collectedAmountInr
          : selectedOrder.grandTotalInr
      )
    );
    setCollectionDateDraft(
      existingPay?.collectionDate
        ? toDateTimeLocalValue(new Date(existingPay.collectionDate))
        : toDateTimeLocalValue()
    );
    setPaymentNoteDraft(existingPay?.note || '');
  }, [selectedOrder?.id, selectedOrder?.updatedAt]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesFilter(order, activeTab)) return false;
      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customer.fullName.toLowerCase().includes(q) ||
        order.customer.phone.toLowerCase().includes(q) ||
        (order.customer.email || '').toLowerCase().includes(q) ||
        (order.shippingDetails?.trackingId || '').toLowerCase().includes(q)
      );
    });
  }, [orders, activeTab, searchQuery]);

  const customerPreviousOrders = useMemo(() => {
    if (!selectedOrder) return [];
    const email = (selectedOrder.customer.email || '').trim().toLowerCase();
    const phone = (selectedOrder.customer.phone || '').trim();
    return orders.filter((o) => {
      const sameAccount =
        selectedOrder.customerAccountId && o.customerAccountId === selectedOrder.customerAccountId;
      const sameEmail = email && (o.customer.email || '').trim().toLowerCase() === email;
      const samePhone = phone && o.customer.phone.trim() === phone;
      return sameAccount || sameEmail || samePhone;
    });
  }, [orders, selectedOrder]);

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3800);
  }

  function updateShippingField<K extends keyof OrderShippingDetails>(key: K, value: string) {
    setShippingForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveOrderStatus() {
    if (!selectedOrder) return;
    setSavingStatus(true);
    try {
      const payloadShipping: Partial<OrderShippingDetails> = {};
      if (nextStatus === 'Packed') {
        payloadShipping.packingCompletedAt = shippingForm.packingCompletedAt;
        payloadShipping.packingNote = shippingForm.packingNote;
      } else if (nextStatus === 'Shipped') {
        payloadShipping.courierName = shippingForm.courierName;
        payloadShipping.trackingId = shippingForm.trackingId;
        payloadShipping.shippedDate = shippingForm.shippedDate;
      } else if (nextStatus === 'In Transit') {
        payloadShipping.currentShippingUpdate = shippingForm.currentShippingUpdate;
        payloadShipping.expectedDeliveryDate = shippingForm.expectedDeliveryDate;
      } else if (nextStatus === 'Out for Delivery') {
        payloadShipping.outForDeliveryDate = shippingForm.outForDeliveryDate;
        payloadShipping.deliveryRemarks = shippingForm.deliveryRemarks;
      } else if (nextStatus === 'Delivered') {
        payloadShipping.deliveredAt = shippingForm.deliveredAt;
        payloadShipping.deliveryConfirmation = shippingForm.deliveryConfirmation;
      } else if (
        nextStatus === 'Cancelled' ||
        nextStatus === 'Delivery Failed' ||
        nextStatus === 'Returned'
      ) {
        payloadShipping.exceptionReason = shippingForm.exceptionReason;
        payloadShipping.deliveryRemarks = shippingForm.deliveryRemarks;
      }

      const result = await services.orders.updateOrderStatusDetailed(selectedOrder.id, {
        status: nextStatus,
        updateDateTime: updateDateTime ? new Date(updateDateTime).toISOString() : undefined,
        customerNote: customerNote.trim() || undefined,
        shippingDetails: payloadShipping,
      });

      const label = getStatusDisplayLabel(nextStatus);
      if (result.notificationSent) {
        showNotice(`Order #${selectedOrder.orderNumber} updated to ${label}. Customer notified automatically.`);
      } else if (result.duplicateSkipped) {
        showNotice(`Order #${selectedOrder.orderNumber} saved (${label}). Duplicate notification skipped.`);
      } else {
        showNotice(`Order #${selectedOrder.orderNumber} updated to ${label}.`);
      }
      setCustomerNote('');
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Unable to update order status.', 'error');
    } finally {
      setSavingStatus(false);
    }
  }

  async function executePaymentUpdate(targetStatus: CanonicalPaymentStatus) {
    if (!selectedOrder) return;
    setSavingPayment(true);
    try {
      const amount = Math.max(0, Number(collectedAmountDraft) || 0);
      const result = await services.orders.confirmOrderPayment(selectedOrder.id, {
        status: targetStatus,
        collectedAmountInr: targetStatus === 'Unpaid' ? 0 : amount || selectedOrder.grandTotalInr,
        collectionDate: collectionDateDraft ? new Date(collectionDateDraft).toISOString() : undefined,
        note: paymentNoteDraft.trim() || undefined,
      });
      setConfirmPaidOpen(false);
      if (result.notificationSent) {
        showNotice(
          `Payment marked as ${targetStatus} for #${selectedOrder.orderNumber}. Customer notified.`
        );
      } else {
        showNotice(`Payment status saved as ${targetStatus} for #${selectedOrder.orderNumber}.`);
      }
    } catch (err) {
      setConfirmPaidOpen(false);
      showNotice(err instanceof Error ? err.message : 'Unable to save payment status.', 'error');
    } finally {
      setSavingPayment(false);
    }
  }

  async function handleDownloadReceivedCopy() {
    if (!selectedOrder) return;
    setGeneratingPdf(true);
    try {
      await downloadOrderReceiptPdf(selectedOrder, storeSettings);
      showNotice(`Received Copy PDF downloaded for #${selectedOrder.orderNumber}.`);
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to generate Received Copy PDF.',
        'error'
      );
    } finally {
      setGeneratingPdf(false);
    }
  }

  function handlePrintReceivedCopy() {
    if (!selectedOrder) return;
    printOrderReceipt(selectedOrder, storeSettings);
  }

  function handleOpenCustomerProfile() {
    if (!selectedOrder) return;
    const params = new URLSearchParams();
    if (selectedOrder.customerAccountId) {
      params.set('customerId', selectedOrder.customerAccountId);
    }
    if (selectedOrder.customer.email) {
      params.set('email', selectedOrder.customer.email);
    }
    navigate(`/admin/customers?${params.toString()}`);
  }

  // =========================================================================
  // ORDER DETAILS PROFESSIONAL MANAGEMENT VIEW
  // =========================================================================
  if (selectedOrder) {
    const canonicalStatus = normalizeOrderStatus(selectedOrder.fulfillmentStatus);
    const canonicalPayment = normalizePaymentStatus(selectedOrder);
    const isAlreadyPaid = canonicalPayment === 'Paid';
    const orderNotifications = Array.isArray(selectedOrder.notifications)
      ? selectedOrder.notifications
      : [];
    const willSkipDuplicateNotification = orderNotifications.some(
      (n) => n.eventKey === `STATUS:${nextStatus}`
    );
    const paymentHistory = Array.isArray(selectedOrder.paymentHistory)
      ? selectedOrder.paymentHistory
      : [];
    const activityTimeline = [...(selectedOrder.statusHistory || [])].reverse();
    const cleanPhone = (selectedOrder.customer.phone || '').replace(/[^+\d]/g, '');

    return (
      <div className="space-y-4 pb-6">
        <AdminToast
          message={toast?.message ?? null}
          tone={toast?.tone}
          onClose={() => setToast(null)}
        />

        {/* Top Back Navigation + Received Copy Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedOrderId(null)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs font-extrabold text-[#6A11CB] shadow-xs transition-colors hover:bg-[#F8F2FF]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Orders</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={generatingPdf}
              onClick={() => void handleDownloadReceivedCopy()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#540CA6] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition-all hover:opacity-95 disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{generatingPdf ? 'Generating PDF...' : 'Received Copy (PDF)'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintReceivedCopy}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs font-extrabold text-[#6A11CB] shadow-xs transition-colors hover:bg-[#F8F2FF]"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Copy</span>
            </button>
          </div>
        </div>

        {/* Order Overview Header Card */}
        <div className="rounded-3xl border border-[#EBD8FF] bg-white p-4 shadow-[0_10px_28px_-16px_rgba(106,17,203,0.2)] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight text-[#2B0B4E] sm:text-xl">
                  Order #{selectedOrder.orderNumber}
                </h2>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${getOrderBadgeClasses(
                    canonicalStatus
                  )}`}
                >
                  {getStatusDisplayLabel(canonicalStatus)}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${getPaymentBadgeClasses(
                    canonicalPayment
                  )}`}
                >
                  Payment: {canonicalPayment}
                </span>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6E5B85]">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5 text-[#6A11CB]" />
                  Placed: {formatDateTime(selectedOrder.createdAt)}
                </span>
                <span>
                  Updated: {formatDateTime(selectedOrder.updatedAt)}
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF] px-4 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E5B85]">
                Grand Total
              </p>
              <p className="text-lg font-extrabold tabular-nums text-[#6A11CB]">
                {formatInr(selectedOrder.grandTotalInr)}
              </p>
            </div>
          </div>
        </div>

        {/* Animated GiftKart Branded Delivery Van Tracker */}
        <DeliveryVanTracker order={selectedOrder} />

        {/* Responsive 2-Column Workspace */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* LEFT COLUMN: Admin Controls (Status Update + COD Payment + Notifications) */}
          <div className="space-y-4 lg:col-span-7">
            {/* 1. Dynamic Order Status Update Control */}
            <section className="rounded-3xl border border-[#EBD8FF] bg-white p-4 shadow-[0_10px_28px_-16px_rgba(106,17,203,0.18)] sm:p-5">
              <div className="flex items-center justify-between gap-2 border-b border-[#F2E9FF] pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5EAFF] text-[#6A11CB]">
                    <Truck className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#2B0B4E]">
                      Update Order Status
                    </h3>
                    <p className="text-[11px] text-[#6E5B85]">
                      Saving automatically updates tracking &amp; notifies the customer in-app
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11.5px] font-bold text-[#3E2A56]">
                      Order Status
                    </label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value as CanonicalOrderStatus)}
                      className="h-11 w-full rounded-xl border border-[#EBD8FF] bg-[#FCF9FF] px-3 text-xs font-bold text-[#2B0B4E] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                    >
                      {ALL_ADMIN_ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {getStatusDisplayLabel(st)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11.5px] font-bold text-[#3E2A56]">
                      Update Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={updateDateTime}
                      onChange={(e) => setUpdateDateTime(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#EBD8FF] bg-[#FCF9FF] px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic Status-Specific Shipping Fields */}
                {nextStatus === 'Packed' && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#6A11CB]">
                        Packing Completed Date
                      </label>
                      <input
                        type="date"
                        value={shippingForm.packingCompletedAt || ''}
                        onChange={(e) => updateShippingField('packingCompletedAt', e.target.value)}
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#6A11CB]">
                        Packing Note
                      </label>
                      <input
                        type="text"
                        value={shippingForm.packingNote || ''}
                        onChange={(e) => updateShippingField('packingNote', e.target.value)}
                        placeholder="e.g. Bubble wrapped with gift ribbon"
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {nextStatus === 'Shipped' && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3.5 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#6A11CB]">
                        Courier Name
                      </label>
                      <input
                        type="text"
                        value={shippingForm.courierName || ''}
                        onChange={(e) => updateShippingField('courierName', e.target.value)}
                        placeholder="e.g. Delhivery / DTDC / GiftKart Local"
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#6A11CB]">
                        Tracking ID
                      </label>
                      <input
                        type="text"
                        value={shippingForm.trackingId || ''}
                        onChange={(e) => updateShippingField('trackingId', e.target.value)}
                        placeholder="e.g. GKTRK984512"
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 font-mono text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#6A11CB]">
                        Shipping Date
                      </label>
                      <input
                        type="date"
                        value={shippingForm.shippedDate || ''}
                        onChange={(e) => updateShippingField('shippedDate', e.target.value)}
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {nextStatus === 'In Transit' && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#6A11CB]">
                        Current Shipping Update
                      </label>
                      <input
                        type="text"
                        value={shippingForm.currentShippingUpdate || ''}
                        onChange={(e) =>
                          updateShippingField('currentShippingUpdate', e.target.value)
                        }
                        placeholder="e.g. Reached Kharagpur Regional Hub"
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#6A11CB]">
                        Expected Delivery Date
                      </label>
                      <input
                        type="date"
                        value={shippingForm.expectedDeliveryDate || ''}
                        onChange={(e) =>
                          updateShippingField('expectedDeliveryDate', e.target.value)
                        }
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {nextStatus === 'Out for Delivery' && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#FF4D8D]/25 bg-[#FFF0F6]/70 p-3.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#FF4D8D]">
                        Delivery Date
                      </label>
                      <input
                        type="date"
                        value={shippingForm.outForDeliveryDate || ''}
                        onChange={(e) =>
                          updateShippingField('outForDeliveryDate', e.target.value)
                        }
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#FF4D8D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#FF4D8D]">
                        Delivery Remarks
                      </label>
                      <input
                        type="text"
                        value={shippingForm.deliveryRemarks || ''}
                        onChange={(e) => updateShippingField('deliveryRemarks', e.target.value)}
                        placeholder="e.g. Delivery partner will call before arrival"
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#FF4D8D] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {nextStatus === 'Delivered' && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#6A11CB]">
                        Delivered Date &amp; Time
                      </label>
                      <input
                        type="datetime-local"
                        value={shippingForm.deliveredAt || ''}
                        onChange={(e) => updateShippingField('deliveredAt', e.target.value)}
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#6A11CB]">
                        Delivery Confirmation
                      </label>
                      <input
                        type="text"
                        value={shippingForm.deliveryConfirmation || ''}
                        onChange={(e) =>
                          updateShippingField('deliveryConfirmation', e.target.value)
                        }
                        placeholder="e.g. Handed directly to customer"
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {(nextStatus === 'Cancelled' ||
                  nextStatus === 'Delivery Failed' ||
                  nextStatus === 'Returned') && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#FF4D8D]/30 bg-[#FFF0F6]/70 p-3.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#C81E62]">
                        {nextStatus} Reason
                      </label>
                      <input
                        type="text"
                        value={shippingForm.exceptionReason || ''}
                        onChange={(e) => updateShippingField('exceptionReason', e.target.value)}
                        placeholder={`Reason for ${nextStatus.toLowerCase()}`}
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#FF4D8D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#C81E62]">
                        Remarks
                      </label>
                      <input
                        type="text"
                        value={shippingForm.deliveryRemarks || ''}
                        onChange={(e) => updateShippingField('deliveryRemarks', e.target.value)}
                        placeholder="Additional delivery or return remarks"
                        className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#FF4D8D] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Customer Note */}
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#3E2A56]">
                    Customer Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Add a helpful note saved to the activity timeline..."
                    className="w-full rounded-xl border border-[#EBD8FF] bg-[#FCF9FF] px-3 py-2 text-xs font-medium text-[#2B0B4E] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Automatic Customer Notification Preview */}
                <div className="flex items-start gap-2.5 rounded-2xl border border-[#EBD8FF] bg-gradient-to-r from-[#F8F2FF] to-[#FFF0F6] p-3 text-xs">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#6A11CB]" />
                  <div className="min-w-0">
                    <p className="font-extrabold text-[#2B0B4E]">
                      Automatic In-App Customer Notification
                      {willSkipDuplicateNotification ? ' (Already Sent for This Status)' : ''}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[#5B4874]">
                      &ldquo;{getAutoNotificationMessage(nextStatus)}&rdquo;
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={savingStatus}
                  onClick={() => void handleSaveOrderStatus()}
                  className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6A11CB] via-[#7E1DE0] to-[#FF4D8D] text-xs font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(106,17,203,0.6)] transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{savingStatus ? 'Saving Status...' : 'Save & Update Order Status'}</span>
                </button>
              </div>
            </section>

            {/* 2. COD Payment Management (Strictly Decoupled from Order Status) */}
            <section className="rounded-3xl border border-[#EBD8FF] bg-white p-4 shadow-[0_10px_28px_-16px_rgba(106,17,203,0.18)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2E9FF] pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF0F6] text-[#FF4D8D]">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#2B0B4E]">
                      COD &amp; Payment Management
                    </h3>
                    <p className="text-[11px] text-[#6E5B85]">
                      Managed separately from delivery status — Delivered never auto-marks Paid
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-extrabold ${getPaymentBadgeClasses(
                    canonicalPayment
                  )}`}
                >
                  {canonicalPayment}
                </span>
              </div>

              {/* Payment Summary Metrics */}
              <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E5B85]">
                    Method
                  </p>
                  <p className="mt-0.5 truncate text-xs font-extrabold text-[#2B0B4E]">
                    {selectedOrder.paymentMethod || 'Cash on Delivery (COD)'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E5B85]">
                    Order Amount
                  </p>
                  <p className="mt-0.5 text-xs font-extrabold tabular-nums text-[#2B0B4E]">
                    {formatInr(selectedOrder.grandTotalInr)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E5B85]">
                    Collected
                  </p>
                  <p className="mt-0.5 text-xs font-extrabold tabular-nums text-[#6A11CB]">
                    {formatInr(
                      selectedOrder.paymentDetails?.collectedAmountInr ??
                        (isAlreadyPaid ? selectedOrder.grandTotalInr : 0)
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E5B85]">
                    Confirmed By
                  </p>
                  <p className="mt-0.5 truncate text-xs font-extrabold text-[#2B0B4E]">
                    {selectedOrder.paymentDetails?.confirmedByAdminName || 'Pending'}
                  </p>
                </div>
              </div>

              {selectedOrder.paymentDetails?.collectionDate && (
                <p className="mt-2.5 text-[11.5px] font-semibold text-[#6E5B85]">
                  Collection Date:{' '}
                  <span className="font-bold text-[#2B0B4E]">
                    {formatDateTime(selectedOrder.paymentDetails.collectionDate)}
                  </span>
                </p>
              )}

              {/* Payment Control Form */}
              <div className="mt-4 space-y-3 border-t border-[#F2E9FF] pt-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[#3E2A56]">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatusDraft}
                      onChange={(e) =>
                        setPaymentStatusDraft(e.target.value as CanonicalPaymentStatus)
                      }
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-[#FCF9FF] px-3 text-xs font-bold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    >
                      {CANONICAL_PAYMENT_STATUSES.map((st) => (
                        <option key={st} value={st} disabled={isAlreadyPaid && st === 'Paid'}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[#3E2A56]">
                      Collected Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={collectedAmountDraft}
                      onChange={(e) => setCollectedAmountDraft(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-[#FCF9FF] px-3 text-xs font-bold tabular-nums text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[#3E2A56]">
                      Collection Date
                    </label>
                    <input
                      type="datetime-local"
                      value={collectionDateDraft}
                      onChange={(e) => setCollectionDateDraft(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-[#FCF9FF] px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={paymentNoteDraft}
                  onChange={(e) => setPaymentNoteDraft(e.target.value)}
                  placeholder="Optional payment note (e.g. Cash collected by delivery partner)"
                  className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-[#FCF9FF] px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  {!isAlreadyPaid ? (
                    <button
                      type="button"
                      disabled={savingPayment}
                      onClick={() => setConfirmPaidOpen(true)}
                      className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#540CA6] px-4 text-xs font-extrabold text-white shadow-sm transition-all hover:opacity-95 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark as Paid</span>
                    </button>
                  ) : (
                    <div className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#EBD8FF] bg-[#F8F2FF] px-4 text-xs font-extrabold text-[#6A11CB]">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Payment Confirmed as Paid</span>
                    </div>
                  )}

                  {paymentStatusDraft !== 'Paid' && (
                    <button
                      type="button"
                      disabled={savingPayment}
                      onClick={() => void executePaymentUpdate(paymentStatusDraft)}
                      className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#FF4D8D]/40 bg-[#FFF0F6] px-4 text-xs font-extrabold text-[#FF4D8D] transition-colors hover:bg-[#FFE3EF] disabled:opacity-60"
                    >
                      <span>Save as {paymentStatusDraft}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Payment History Log */}
              {paymentHistory.length > 0 && (
                <div className="mt-4 border-t border-[#F2E9FF] pt-3">
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#6E5B85]">
                    Payment History
                  </p>
                  <div className="space-y-2">
                    {paymentHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between gap-2 rounded-xl border border-[#EBD8FF]/80 bg-[#FCF9FF] px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${getPaymentBadgeClasses(
                                entry.status
                              )}`}
                            >
                              {entry.status}
                            </span>
                            <span className="font-extrabold tabular-nums text-[#2B0B4E]">
                              {formatInr(entry.amountInr)}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="mt-1 text-[11px] text-[#5B4874]">{entry.note}</p>
                          )}
                          {entry.adminName && (
                            <p className="mt-0.5 text-[10.5px] text-[#6E5B85]">
                              By {entry.adminName}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-[10.5px] font-semibold text-[#6E5B85]">
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 3. Automatic Customer Notification Delivery Log */}
            <section className="rounded-3xl border border-[#EBD8FF] bg-white p-4 shadow-[0_10px_28px_-16px_rgba(106,17,203,0.16)] sm:p-5">
              <div className="flex items-center justify-between gap-2 border-b border-[#F2E9FF] pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5EAFF] text-[#6A11CB]">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#2B0B4E]">
                      Customer App Notifications ({orderNotifications.length})
                    </h3>
                    <p className="text-[11px] text-[#6E5B85]">
                      Automatic real-time notifications delivered for this order
                    </p>
                  </div>
                </div>
              </div>

              {orderNotifications.length === 0 ? (
                <p className="mt-3 text-xs text-[#6E5B85]">
                  No notifications recorded yet. Updating the order status will notify the customer automatically.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {orderNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="rounded-2xl border border-[#EBD8FF]/85 bg-[#FCF9FF] p-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="font-extrabold text-[#2B0B4E]">{notif.title}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F3E5FF] px-2 py-0.5 text-[10px] font-extrabold text-[#6A11CB]">
                          <ShieldCheck className="h-3 w-3" />
                          Delivered to App
                        </span>
                      </div>
                      <p className="mt-1 text-[11.5px] text-[#4A3860]">{notif.message}</p>
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-[#6E5B85]">
                        <span>
                          Triggered by {notif.adminName || notif.triggeredBy}
                        </span>
                        <span>{formatDateTime(notif.sentAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: Customer & Quick Actions + Items + Activity Timeline */}
          <div className="space-y-4 lg:col-span-5">
            {/* Customer & Delivery Information + Quick Actions */}
            <section className="rounded-3xl border border-[#EBD8FF] bg-white p-4 shadow-[0_10px_28px_-16px_rgba(106,17,203,0.18)] sm:p-5">
              <div className="flex items-center gap-2 border-b border-[#F2E9FF] pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5EAFF] text-[#6A11CB]">
                  <User className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#2B0B4E]">
                    Customer &amp; Delivery Info
                  </h3>
                  <p className="text-[11px] text-[#6E5B85]">
                    {selectedOrder.customer.deliveryZoneNameSnapshot}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-xs text-[#3E2A56]">
                <p className="text-sm font-extrabold text-[#2B0B4E]">
                  {selectedOrder.customer.fullName}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#6A11CB]" />
                  <span className="font-semibold">{selectedOrder.customer.phone}</span>
                </p>
                {selectedOrder.customer.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[#6A11CB]" />
                    <span className="truncate">{selectedOrder.customer.email}</span>
                  </p>
                )}
                <div className="flex items-start gap-2 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-2.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF4D8D]" />
                  <p className="leading-relaxed">
                    {selectedOrder.customer.addressLine1}
                    {selectedOrder.customer.addressLine2
                      ? `, ${selectedOrder.customer.addressLine2}`
                      : ''}
                    <br />
                    {selectedOrder.customer.city}, {selectedOrder.customer.state} —{' '}
                    <span className="font-extrabold text-[#2B0B4E]">
                      {selectedOrder.customer.pincode}
                    </span>
                  </p>
                </div>
              </div>

              {/* Working Quick Actions */}
              <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <a
                  href={cleanPhone ? `tel:${cleanPhone}` : undefined}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#540CA6] px-3 text-[11.5px] font-extrabold text-white shadow-xs transition-opacity hover:opacity-95"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call Customer</span>
                </a>
                <button
                  type="button"
                  onClick={handleOpenCustomerProfile}
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#EBD8FF] bg-[#F8F2FF] px-3 text-[11.5px] font-extrabold text-[#6A11CB] transition-colors hover:bg-[#EFE2FF]"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Customer Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviousOrdersOpen(true)}
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#FF4D8D]/35 bg-[#FFF0F6] px-3 text-[11.5px] font-extrabold text-[#FF4D8D] transition-colors hover:bg-[#FFE3EF]"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Past Orders ({customerPreviousOrders.length})</span>
                </button>
              </div>
            </section>

            {/* Purchased Products & Price Breakdown */}
            <section className="rounded-3xl border border-[#EBD8FF] bg-white p-4 shadow-[0_10px_28px_-16px_rgba(106,17,203,0.18)] sm:p-5">
              <div className="flex items-center justify-between border-b border-[#F2E9FF] pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF0F6] text-[#FF4D8D]">
                    <Package className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-extrabold text-[#2B0B4E]">
                    Order Items ({selectedOrder.items.length})
                  </h3>
                </div>
              </div>

              <div className="mt-3 divide-y divide-[#F2E9FF]">
                {selectedOrder.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex gap-3 py-3 first:pt-0">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-[#FAF6FF]">
                      {item.imageSnapshot ? (
                        <img
                          src={item.imageSnapshot}
                          alt={item.productNameSnapshot}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#6A11CB]">
                          <Gift className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-extrabold text-[#2B0B4E]">
                          {item.productNameSnapshot}
                        </p>
                        <p className="shrink-0 text-xs font-extrabold tabular-nums text-[#6A11CB]">
                          {formatInr(item.lineTotalInr)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#6E5B85]">
                        Qty {item.quantity} × {formatInr(item.unitPriceInrSnapshot)}
                        {item.productSkuSnapshot ? ` • SKU: ${item.productSkuSnapshot}` : ''}
                      </p>
                      {Object.keys(item.selectedVariants || {}).length > 0 && (
                        <p className="mt-0.5 text-[11px] font-semibold text-[#540CA6]">
                          {Object.entries(item.selectedVariants)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ')}
                        </p>
                      )}
                      {item.personalizationDetails && (
                        <p className="mt-1 rounded-lg bg-[#F8F2FF] px-2 py-1 text-[11px] text-[#6A11CB]">
                          Personalization: {item.personalizationDetails}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedOrder.giftWrap?.enabled && (
                <div className="mt-2 rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF] p-3 text-xs">
                  <p className="font-extrabold text-[#6A11CB]">
                    Gift Wrap: {selectedOrder.giftWrap.styleNameSnapshot || 'Signature Wrap'}
                  </p>
                  {selectedOrder.giftWrap.recipientName && (
                    <p className="mt-0.5 text-[#3E2A56]">
                      Recipient: <strong>{selectedOrder.giftWrap.recipientName}</strong>
                    </p>
                  )}
                  {selectedOrder.giftWrap.giftMessage && (
                    <p className="mt-0.5 italic text-[#6E5B85]">
                      &ldquo;{selectedOrder.giftWrap.giftMessage}&rdquo;
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 space-y-1.5 border-t border-[#F2E9FF] pt-3 text-xs">
                <div className="flex justify-between text-[#6E5B85]">
                  <span>Subtotal</span>
                  <span className="font-bold tabular-nums text-[#2B0B4E]">
                    {formatInr(selectedOrder.subtotalInr)}
                  </span>
                </div>
                <div className="flex justify-between text-[#6E5B85]">
                  <span>Gift Wrap</span>
                  <span className="font-bold tabular-nums text-[#2B0B4E]">
                    {formatInr(selectedOrder.giftWrapChargeInr)}
                  </span>
                </div>
                <div className="flex justify-between text-[#6E5B85]">
                  <span>Delivery Charge</span>
                  <span className="font-bold tabular-nums text-[#2B0B4E]">
                    {selectedOrder.deliveryChargeInr > 0
                      ? formatInr(selectedOrder.deliveryChargeInr)
                      : 'FREE'}
                  </span>
                </div>
                {selectedOrder.discountInr > 0 && (
                  <div className="flex justify-between text-[#FF4D8D]">
                    <span>
                      Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}
                    </span>
                    <span className="font-extrabold tabular-nums">
                      -{formatInr(selectedOrder.discountInr)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#F2E9FF] pt-2 text-sm font-extrabold text-[#6A11CB]">
                  <span>Grand Total</span>
                  <span className="tabular-nums">{formatInr(selectedOrder.grandTotalInr)}</span>
                </div>
              </div>
            </section>

            {/* Order Activity Timeline */}
            <section className="rounded-3xl border border-[#EBD8FF] bg-white p-4 shadow-[0_10px_28px_-16px_rgba(106,17,203,0.18)] sm:p-5">
              <div className="flex items-center gap-2 border-b border-[#F2E9FF] pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5EAFF] text-[#6A11CB]">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#2B0B4E]">
                    Order Activity Timeline ({activityTimeline.length})
                  </h3>
                  <p className="text-[11px] text-[#6E5B85]">
                    Complete immutable log of status, payment &amp; notification events
                  </p>
                </div>
              </div>

              <ol className="relative mt-4 space-y-3.5 border-l-2 border-[#EBD8FF] pl-4">
                {activityTimeline.map((entry, idx) => {
                  const isNotification = entry.type === 'NOTIFICATION_SENT';
                  const isPayment = entry.type === 'PAYMENT_UPDATE';
                  return (
                    <li key={entry.id || `${entry.timestamp}-${idx}`} className="relative">
                      <span
                        className={`absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-white shadow-xs ${
                          isPayment
                            ? 'bg-[#FF4D8D]'
                            : isNotification
                            ? 'bg-[#EBD8FF] ring-2 ring-[#6A11CB]'
                            : 'bg-[#6A11CB]'
                        }`}
                      />
                      <div className="rounded-2xl border border-[#EBD8FF]/75 bg-[#FCF9FF] p-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-extrabold text-[#2B0B4E]">
                            {isPayment
                              ? 'Payment Updated'
                              : isNotification
                              ? 'Customer Notification Sent'
                              : getStatusDisplayLabel(entry.status)}
                          </span>
                          <span className="text-[10.5px] font-semibold text-[#6E5B85]">
                            {formatDateTime(entry.timestamp)}
                          </span>
                        </div>
                        {entry.metadataSummary && (
                          <p className="mt-1 text-[11px] font-bold text-[#6A11CB]">
                            {entry.metadataSummary}
                          </p>
                        )}
                        {entry.note && (
                          <p className="mt-1 text-[11.5px] text-[#4A3860]">{entry.note}</p>
                        )}
                        <p className="mt-1.5 text-[10.5px] font-semibold text-[#6E5B85]">
                          By {entry.adminName || entry.updatedBy}
                          {entry.adminEmail ? ` (${entry.adminEmail})` : ''}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        </div>

        {/* Confirm Mark as Paid Dialog */}
        <AdminConfirmDialog
          open={confirmPaidOpen}
          title="Confirm COD Payment as Paid?"
          message={`Mark Order #${selectedOrder.orderNumber} as Paid with collected amount ${formatInr(
            Math.max(0, Number(collectedAmountDraft) || selectedOrder.grandTotalInr)
          )}? This will lock duplicate Paid confirmations and send an automatic Payment Successful notification to the customer.`}
          confirmLabel={savingPayment ? 'Confirming...' : 'Confirm Paid'}
          onConfirm={() => void executePaymentUpdate('Paid')}
          onCancel={() => setConfirmPaidOpen(false)}
        />

        {/* View Previous Orders Sheet Modal */}
        <AdminSheetModal
          open={previousOrdersOpen}
          title="Customer Order History"
          subtitle={`${selectedOrder.customer.fullName} • ${customerPreviousOrders.length} orders`}
          onClose={() => setPreviousOrdersOpen(false)}
          footer={
            <button
              type="button"
              onClick={() => setPreviousOrdersOpen(false)}
              className="h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#540CA6] text-xs font-extrabold text-white"
            >
              Close
            </button>
          }
        >
          <div className="space-y-2.5">
            {customerPreviousOrders.map((past) => {
              const isCurrent = past.id === selectedOrder.id;
              const pastStatus = normalizeOrderStatus(past.fulfillmentStatus);
              const pastPayment = normalizePaymentStatus(past);
              return (
                <button
                  key={past.id}
                  type="button"
                  onClick={() => {
                    setSelectedOrderId(past.id);
                    setPreviousOrdersOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-all ${
                    isCurrent
                      ? 'border-[#6A11CB] bg-[#F8F2FF]'
                      : 'border-[#EBD8FF] bg-white hover:border-[#6A11CB]/50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#2B0B4E]">
                        #{past.orderNumber}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-[#6A11CB] px-2 py-0.5 text-[9.5px] font-bold text-white">
                          Viewing
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#6E5B85]">
                      {formatDateTime(past.createdAt)} • {past.items.length} item(s)
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getOrderBadgeClasses(
                          pastStatus
                        )}`}
                      >
                        {getStatusDisplayLabel(pastStatus)}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getPaymentBadgeClasses(
                          pastPayment
                        )}`}
                      >
                        {pastPayment}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold tabular-nums text-[#6A11CB]">
                    {formatInr(past.grandTotalInr)}
                  </span>
                </button>
              );
            })}
          </div>
        </AdminSheetModal>
      </div>
    );
  }

  // =========================================================================
  // ORDERS LIST VIEW
  // =========================================================================
  return (
    <div className="space-y-3.5 pb-4">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A11CB]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Order ID, Customer Name, Phone, or Tracking ID..."
          className="h-11 w-full rounded-2xl border border-[#EBD8FF] bg-white pl-10 pr-4 text-xs font-semibold text-[#2B0B4E] placeholder:text-[#8E7AA8] shadow-[0_6px_18px_-14px_rgba(106,17,203,0.2)] focus:border-[#6A11CB] focus:outline-none"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const active = activeTab === tab.key;
          const count = orders.filter((o) => matchesFilter(o, tab.key)).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] text-white shadow-xs'
                  : 'border border-[#EBD8FF] bg-white text-[#4A3860] hover:border-[#6A11CB]/40'
              }`}
            >
              {tab.label} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <AdminEmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title={
            activeTab === 'All' && !searchQuery
              ? 'No orders yet.'
              : 'No matching orders found.'
          }
          description="Real customer orders placed on GiftKart will sync here immediately for processing, shipping, and COD management."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const canonicalStatus = normalizeOrderStatus(order.fulfillmentStatus);
            const canonicalPayment = normalizePaymentStatus(order);
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#EBD8FF] bg-white px-4 py-3.5 text-left shadow-[0_8px_22px_-16px_rgba(106,17,203,0.22)] transition-all hover:border-[#6A11CB]/45 active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[13.5px] font-extrabold text-[#2B0B4E]">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${getOrderBadgeClasses(
                        canonicalStatus
                      )}`}
                    >
                      {getStatusDisplayLabel(canonicalStatus)}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${getPaymentBadgeClasses(
                        canonicalPayment
                      )}`}
                    >
                      {canonicalPayment}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs font-bold text-[#3E2A56]">
                    {order.customer.fullName} · {order.customer.phone}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[#6E5B85]">
                    {order.items.length} item{order.items.length === 1 ? '' : 's'} ·{' '}
                    {order.customer.city} ({order.customer.pincode}) ·{' '}
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-extrabold tabular-nums text-[#6A11CB]">
                      {formatInr(order.grandTotalInr)}
                    </p>
                    <p className="text-[10.5px] font-semibold text-[#6E5B85]">
                      Manage
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#6A11CB]" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
