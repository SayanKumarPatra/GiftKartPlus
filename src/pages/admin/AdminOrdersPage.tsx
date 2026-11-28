import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Box,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  Eye,
  FileDown,
  FileText,
  Gift,
  History,
  Lock,
  Mail,
  MapPin,
  Navigation,
  Package,
  Phone,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useOrders, useStoreSettings } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { formatDateTime, formatInr } from '../../utils/format';
import {
  CANONICAL_PAYMENT_STATUSES,
  CORE_ORDER_STAGES,
  EXCEPTION_ORDER_STATUSES,
  getAutoNotificationMessage,
  getOrderBadgeClasses,
  getPaymentBadgeClasses,
  getStatusDisplayLabel,
  normalizeOrderStatus,
  normalizePaymentStatus,
} from '../../utils/orderLifecycle';
import {
  downloadOrderReceiptPdf,
  isOrderReceiptAvailable,
  printOrderReceipt,
  resolveOrderReceipt,
} from '../../utils/orderReceiptPdf';
import { DeliveryVanTracker } from '../../components/order/DeliveryVanTracker';
import { OrderReceiptModal } from '../../components/order/OrderReceiptModal';
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

function getTileShortLabel(status: CanonicalOrderStatus): string {
  switch (status) {
    case 'New Order':
      return 'New';
    case 'Processing':
      return 'Processing';
    case 'Packed':
      return 'Packed';
    case 'Shipped':
      return 'Shipped';
    case 'In Transit':
      return 'In Transit';
    case 'Out for Delivery':
      return 'Out for Delivery';
    case 'Delivered':
      return 'Delivered';
    default:
      return status;
  }
}

function StatusTileIcon({ status }: { status: CanonicalOrderStatus }) {
  switch (status) {
    case 'New Order':
      return <Box className="h-5 w-5" />;
    case 'Processing':
      return <Settings className="h-5 w-5" />;
    case 'Packed':
      return <Gift className="h-5 w-5" />;
    case 'Shipped':
      return <Truck className="h-5 w-5" />;
    case 'In Transit':
      return <Navigation className="h-5 w-5" />;
    case 'Out for Delivery':
      return <Truck className="h-5 w-5" />;
    case 'Delivered':
      return <CheckCircle2 className="h-5 w-5" />;
    case 'Cancelled':
      return <XCircle className="h-4 w-4" />;
    case 'Delivery Failed':
      return <AlertTriangle className="h-4 w-4" />;
    case 'Returned':
      return <RotateCcw className="h-4 w-4" />;
  }
}

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const { data: orders } = useOrders();
  const { data: storeSettings } = useStoreSettings();

  const [activeTab, setActiveTab] = useState<OrderFilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setVisibleCount(20);
  }, [activeTab, searchQuery]);

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
  const [paymentEditorOpen, setPaymentEditorOpen] = useState(false);
  const [confirmPaidOpen, setConfirmPaidOpen] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Quick Actions / PDF / Receipt Preview / Previous Orders Modal
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);
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
    setPaymentEditorOpen(false);
  }, [selectedOrder?.id, selectedOrder?.updatedAt]);

  const tabCounts = useMemo(() => {
    const counts: Record<OrderFilterTab, number> = {
      All: orders.length,
      'New Order': 0,
      Processing: 0,
      Packed: 0,
      Shipped: 0,
      'In Transit': 0,
      'Out for Delivery': 0,
      Delivered: 0,
      Exceptions: 0,
    };
    for (const order of orders) {
      const canonical = normalizeOrderStatus(order.fulfillmentStatus);
      if (
        canonical === 'Cancelled' ||
        canonical === 'Delivery Failed' ||
        canonical === 'Returned'
      ) {
        counts.Exceptions += 1;
      } else if (canonical in counts) {
        counts[canonical as OrderFilterTab] += 1;
      }
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesFilter(order, activeTab)) return false;
      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        (order.receipt?.receiptNumber || '').toLowerCase().includes(q) ||
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
      setPaymentEditorOpen(false);
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
      const rcp = resolveOrderReceipt(selectedOrder);
      showNotice(`Official Receipt PDF (${rcp.receiptNumber}) downloaded.`);
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to generate Official Receipt PDF.',
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
  // ORDER DETAILS VIEW — STYLED TO MATCH USER'S GIFTKART PREMIUM MOCKUP
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
    const collectedDisplay =
      selectedOrder.paymentDetails?.collectedAmountInr ??
      (isAlreadyPaid ? selectedOrder.grandTotalInr : 0);

    return (
      <div className="mx-auto max-w-4xl pb-6">
        <AdminToast
          message={toast?.message ?? null}
          tone={toast?.tone}
          onClose={() => setToast(null)}
        />

        {/* Purple Branded Top Header + Soft Lavender Surface Wrapper */}
        <div className="overflow-hidden rounded-[28px] border border-[#EBD8FF] bg-gradient-to-b from-[#EDE0FF] via-[#F6EEFF] to-[#FCEFF8] shadow-[0_18px_42px_-20px_rgba(106,17,203,0.3)]">
          {/* Top Purple Navigation Bar */}
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#6A11CB] via-[#7B1FE0] to-[#9333EA] px-4 py-3.5 text-white">
            <button
              type="button"
              onClick={() => setSelectedOrderId(null)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur-xs transition-colors hover:bg-white/25"
            >
              <ArrowLeft className="h-3.5 w-3.5 stroke-[2.4]" />
              <span>Back to Orders</span>
            </button>

            <h2 className="text-[15px] font-extrabold tracking-tight text-white">
              Order Details
            </h2>

            <button
              type="button"
              onClick={handlePrintReceivedCopy}
              title="Print Received Copy"
              className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white/15 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur-xs transition-colors hover:bg-white/25"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>

          <div className="space-y-3.5 p-3 sm:p-4">
            {/* 1. ORDER OVERVIEW SUMMARY CARD */}
            <section className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_10px_28px_-16px_rgba(106,17,203,0.22)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#EBD8FF] bg-gradient-to-br from-[#F4EAFF] to-[#EBD8FF]/70 text-[#6A11CB]">
                    <ShoppingBag className="h-5 w-5 stroke-[2.2]" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[17px] font-extrabold tracking-tight text-[#2B0B4E] sm:text-[19px]">
                      #{selectedOrder.orderNumber}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#6E5B85]">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
                      <span className="truncate">Placed: {formatDateTime(selectedOrder.createdAt)}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11.5px] font-extrabold shadow-xs ${getOrderBadgeClasses(
                    canonicalStatus
                  )}`}
                >
                  {getStatusDisplayLabel(canonicalStatus)}
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-1 gap-2.5 border-t border-[#F2E9FF] pt-3 sm:grid-cols-2 sm:items-center">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#2B0B4E]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F5EAFF] text-[#6A11CB]">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <span className="truncate">
                    {selectedOrder.paymentMethod || 'Cash on Delivery (COD)'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end sm:border-l sm:border-[#EFE3FF] sm:pl-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#5B4874]">
                    <Coins className="h-4 w-4 text-[#6A11CB]" />
                    <span>Order Amount</span>
                  </span>
                  <span className="text-[19px] font-extrabold tabular-nums text-[#6A11CB]">
                    {formatInr(selectedOrder.grandTotalInr)}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. ORDER PROGRESS & ANIMATED RUNNING GIFTKART VAN */}
            <DeliveryVanTracker order={selectedOrder} />

            {/* 2B. OFFICIAL CUSTOMER RECEIPT RECORD (Synced with Customer Download) */}
            {isOrderReceiptAvailable(selectedOrder) && (() => {
              const savedReceipt = resolveOrderReceipt(selectedOrder);
              return (
                <section className="rounded-[26px] border border-[#DEC7FF] bg-gradient-to-r from-[#FAF5FF] via-white to-[#FFF4FA] p-4 shadow-[0_12px_28px_-16px_rgba(106,17,203,0.22)] sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6A11CB] to-[#8E2DE2] text-white shadow-sm">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[14.5px] font-extrabold text-[#2B0B4E]">
                            Official Order Receipt
                          </h3>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            Customer Download Active
                          </span>
                        </div>
                        <p className="mt-0.5 font-mono text-xs font-extrabold text-[#6A11CB] break-all">
                          {savedReceipt.receiptNumber}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-[#6E5B85]">
                          Issued: {formatDateTime(savedReceipt.issuedAt)} · Payment:{' '}
                          <strong className="text-[#2B0B4E]">{savedReceipt.paymentStatus}</strong> ·
                          Paid: <strong className="text-[#2B0B4E]">{formatInr(savedReceipt.paidAmountInr)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setReceiptPreviewOpen(true)}
                        className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#DEC7FF] bg-white px-3.5 text-xs font-extrabold text-[#6A11CB] hover:bg-[#F6ECFF] transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Receipt</span>
                      </button>
                      <button
                        type="button"
                        disabled={generatingPdf}
                        onClick={() => void handleDownloadReceivedCopy()}
                        className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] to-[#540CA6] px-4 text-xs font-extrabold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        <span>{generatingPdf ? 'Preparing...' : 'Download PDF'}</span>
                      </button>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* 3. UPDATE ORDER STATUS CARD (VISUAL ICON TILE GRID) */}
            <section className="rounded-[26px] border border-white/80 bg-white/95 p-4 shadow-[0_12px_30px_-16px_rgba(106,17,203,0.2)] sm:p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
                  <RefreshCw className="h-4 w-4" />
                </span>
                <h3 className="text-[15px] font-extrabold text-[#2B0B4E]">
                  Update Order Status
                </h3>
              </div>

              {/* 7-Stage Visual Status Tiles */}
              <div className="mt-3.5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
                {CORE_ORDER_STAGES.map((st) => {
                  const selected = nextStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNextStatus(st)}
                      className={`relative flex min-h-[70px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-2.5 text-center transition-all active:scale-[0.97] ${
                        selected
                          ? 'border-[#6A11CB] bg-gradient-to-b from-[#7B1FE0] to-[#6A11CB] text-white shadow-[0_10px_22px_-8px_rgba(106,17,203,0.58)]'
                          : 'border-[#EBD8FF] bg-[#FAF7FF] text-[#6A11CB] hover:border-[#6A11CB]/45 hover:bg-[#F4EAFF]/60'
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#6A11CB] shadow-xs">
                          <Check className="h-2.5 w-2.5 stroke-[3.2]" />
                        </span>
                      )}
                      <StatusTileIcon status={st} />
                      <span
                        className={`text-[10.5px] leading-tight ${
                          selected ? 'font-extrabold text-white' : 'font-bold text-[#2B0B4E]'
                        }`}
                      >
                        {getTileShortLabel(st)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Exception Status Selector Row (Cancelled / Delivery Failed / Returned) */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[10.5px] font-bold uppercase tracking-wider text-[#6E5B85]">
                  Other Status:
                </span>
                {EXCEPTION_ORDER_STATUSES.map((st) => {
                  const selected = nextStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNextStatus(st)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold transition-all ${
                        selected
                          ? 'border-[#FF4D8D] bg-[#FF4D8D] text-white shadow-xs'
                          : 'border-[#F7CFE1] bg-[#FFF4F9] text-[#B8205B] hover:border-[#FF4D8D]'
                      }`}
                    >
                      <StatusTileIcon status={st} />
                      <span>{st}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Status-Specific Shipping Fields */}
              {nextStatus === 'Packed' && (
                <div className="mt-3.5 grid grid-cols-1 gap-2.5 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#6A11CB]">
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
                    <label className="mb-1 block text-[11px] font-extrabold text-[#6A11CB]">
                      Packing Note
                    </label>
                    <input
                      type="text"
                      value={shippingForm.packingNote || ''}
                      onChange={(e) => updateShippingField('packingNote', e.target.value)}
                      placeholder="e.g. Packed safely with protective box"
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {nextStatus === 'Shipped' && (
                <div className="mt-3.5 grid grid-cols-1 gap-2.5 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#6A11CB]">
                      Courier Name
                    </label>
                    <input
                      type="text"
                      value={shippingForm.courierName || ''}
                      onChange={(e) => updateShippingField('courierName', e.target.value)}
                      placeholder="e.g. GiftKart Express / Delhivery"
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#6A11CB]">
                      Tracking ID
                    </label>
                    <input
                      type="text"
                      value={shippingForm.trackingId || ''}
                      onChange={(e) => updateShippingField('trackingId', e.target.value)}
                      placeholder="e.g. GKEXP784563"
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 font-mono text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#6A11CB]">
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
                <div className="mt-3.5 grid grid-cols-1 gap-2.5 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#6A11CB]">
                      Current Shipping Update
                    </label>
                    <input
                      type="text"
                      value={shippingForm.currentShippingUpdate || ''}
                      onChange={(e) => updateShippingField('currentShippingUpdate', e.target.value)}
                      placeholder="e.g. Arrived at regional hub"
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#6A11CB]">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={shippingForm.expectedDeliveryDate || ''}
                      onChange={(e) => updateShippingField('expectedDeliveryDate', e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {nextStatus === 'Out for Delivery' && (
                <div className="mt-3.5 grid grid-cols-1 gap-2.5 rounded-2xl border border-[#FF4D8D]/25 bg-[#FFF2F7] p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#FF4D8D]">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={shippingForm.outForDeliveryDate || ''}
                      onChange={(e) => updateShippingField('outForDeliveryDate', e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#2B0B4E] focus:border-[#FF4D8D] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#FF4D8D]">
                      Delivery Remarks
                    </label>
                    <input
                      type="text"
                      value={shippingForm.deliveryRemarks || ''}
                      onChange={(e) => updateShippingField('deliveryRemarks', e.target.value)}
                      placeholder="e.g. Delivery partner will call before reaching"
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#FF4D8D] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {nextStatus === 'Delivered' && (
                <div className="mt-3.5 grid grid-cols-1 gap-2.5 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#6A11CB]">
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
                    <label className="mb-1 block text-[11px] font-extrabold text-[#6A11CB]">
                      Delivery Confirmation
                    </label>
                    <input
                      type="text"
                      value={shippingForm.deliveryConfirmation || ''}
                      onChange={(e) => updateShippingField('deliveryConfirmation', e.target.value)}
                      placeholder="e.g. Handed directly to customer"
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {(nextStatus === 'Cancelled' ||
                nextStatus === 'Delivery Failed' ||
                nextStatus === 'Returned') && (
                <div className="mt-3.5 grid grid-cols-1 gap-2.5 rounded-2xl border border-[#FF4D8D]/30 bg-[#FFF2F7] p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#C81E62]">
                      {nextStatus} Reason
                    </label>
                    <input
                      type="text"
                      value={shippingForm.exceptionReason || ''}
                      onChange={(e) => updateShippingField('exceptionReason', e.target.value)}
                      placeholder={`Enter reason for ${nextStatus.toLowerCase()}`}
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#FF4D8D] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-extrabold text-[#C81E62]">
                      Remarks
                    </label>
                    <input
                      type="text"
                      value={shippingForm.deliveryRemarks || ''}
                      onChange={(e) => updateShippingField('deliveryRemarks', e.target.value)}
                      placeholder="Additional delivery or return note"
                      className="h-10 w-full rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#FF4D8D] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Update Date & Time + Customer Note Inputs (Matches Mockup Side-by-Side) */}
              <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="flex items-center gap-2.5 rounded-2xl border border-[#EBD8FF] bg-[#FCF9FF] px-3 py-2">
                  <Calendar className="h-4.5 w-4.5 shrink-0 text-[#6A11CB]" />
                  <div className="min-w-0 flex-1">
                    <label className="block text-[10px] font-bold text-[#6E5B85]">
                      Update Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={updateDateTime}
                      onChange={(e) => setUpdateDateTime(e.target.value)}
                      className="mt-0.5 w-full bg-transparent text-xs font-extrabold text-[#2B0B4E] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl border border-[#EBD8FF] bg-[#FCF9FF] px-3 py-2">
                  <FileText className="h-4.5 w-4.5 shrink-0 text-[#6A11CB]" />
                  <div className="min-w-0 flex-1">
                    <label className="block text-[10px] font-bold text-[#6E5B85]">
                      Customer Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Add note (e.g. Shipped via GiftKart Express...)"
                      className="mt-0.5 w-full bg-transparent text-xs font-semibold text-[#2B0B4E] placeholder:text-[#9A88B4] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Notify Customer Banner (Matches Mockup) */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[#F9D6E7] bg-gradient-to-r from-[#FFF0F6] via-[#FFF6FA] to-[#F9F2FF] px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#FF4D8D] shadow-xs">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#2B0B4E]">Notify Customer</p>
                    <p className="truncate text-[11px] font-medium text-[#5B4874]">
                      &ldquo;{getAutoNotificationMessage(nextStatus)}&rdquo;
                    </p>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-extrabold text-emerald-700 shadow-xs">
                  <span>{willSkipDuplicateNotification ? 'Already Sent' : 'Auto Notify'}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </span>
              </div>

              {/* Dual Primary Action Buttons Row: Save & Update Status | Received Copy (PDF) */}
              <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={savingStatus}
                  onClick={() => void handleSaveOrderStatus()}
                  className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6A11CB] to-[#540CA6] px-5 text-xs font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(106,17,203,0.58)] transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{savingStatus ? 'Saving Status...' : 'Save & Update Status'}</span>
                </button>

                <button
                  type="button"
                  disabled={generatingPdf}
                  onClick={() => void handleDownloadReceivedCopy()}
                  className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#6A11CB]/70 bg-white px-5 text-xs font-extrabold text-[#6A11CB] shadow-xs transition-all hover:bg-[#F8F2FF] active:scale-[0.99] disabled:opacity-60"
                >
                  <FileDown className="h-4 w-4" />
                  <span>{generatingPdf ? 'Generating PDF...' : 'Download Receipt'}</span>
                  <span className="rounded bg-[#FFF0F6] px-1.5 py-0.5 text-[9.5px] font-extrabold text-[#FF4D8D]">
                    PDF
                  </span>
                </button>
              </div>
            </section>

            {/* 4. PAYMENT UPDATE CARD (Strictly Decoupled from Delivery Status) */}
            <section className="rounded-[26px] border border-white/80 bg-white/95 p-4 shadow-[0_12px_30px_-16px_rgba(106,17,203,0.2)] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <h3 className="text-[15px] font-extrabold text-[#2B0B4E]">
                    Payment Update
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentEditorOpen((v) => !v)}
                  className="cursor-pointer rounded-full border border-[#EBD8FF] bg-[#FAF6FF] px-3 py-1 text-[11px] font-extrabold text-[#6A11CB] transition-colors hover:bg-[#EFE2FF]"
                >
                  {paymentEditorOpen ? 'Hide Details' : 'Edit Payment Info'}
                </button>
              </div>

              {/* 3-Part Horizontal Payment Row (Matches Mockup) */}
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:items-center">
                <div className="flex items-center gap-2.5 rounded-2xl border border-[#EFE3FF] bg-[#FCF9FF] px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F6] text-[#FF4D8D]">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#6E5B85]">Payment Method</p>
                    <p className="truncate text-xs font-extrabold text-[#2B0B4E]">
                      {selectedOrder.paymentMethod || 'Cash on Delivery (COD)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl border border-[#EFE3FF] bg-[#FCF9FF] px-3 py-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      isAlreadyPaid
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-[#F4EAFF] text-[#6A11CB]'
                    }`}
                  >
                    {isAlreadyPaid ? (
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#6E5B85]">Collection Status</p>
                    <p
                      className={`truncate text-xs font-extrabold tabular-nums ${
                        isAlreadyPaid ? 'text-emerald-700' : 'text-[#6A11CB]'
                      }`}
                    >
                      {canonicalPayment} ({formatInr(isAlreadyPaid ? collectedDisplay : selectedOrder.grandTotalInr)})
                    </p>
                  </div>
                </div>

                {!isAlreadyPaid ? (
                  <button
                    type="button"
                    disabled={savingPayment}
                    onClick={() => setConfirmPaidOpen(true)}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#16A34A] to-[#15803D] px-4 text-xs font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(22,163,74,0.6)] transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                  >
                    <Check className="h-4 w-4 stroke-[2.8]" />
                    <span>Mark as Paid</span>
                  </button>
                ) : (
                  <div className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-extrabold text-emerald-700">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Paid Confirmed</span>
                  </div>
                )}
              </div>

              {/* Payment Status Confirmation Strip */}
              {isAlreadyPaid ? (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-emerald-900">Payment Successful!</p>
                      <p className="text-[11px] font-medium text-emerald-800">
                        Confirmed by {selectedOrder.paymentDetails?.confirmedByAdminName || 'Admin'}
                        {selectedOrder.paymentDetails?.collectionDate
                          ? ` • ${formatDateTime(selectedOrder.paymentDetails.collectionDate)}`
                          : ''}
                        . Customer has been notified.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] px-3.5 py-2 text-[11.5px] text-[#5B4874]">
                  <span>
                    COD payment is managed separately from delivery status. Confirm only after collecting{' '}
                    <strong className="text-[#2B0B4E]">
                      {formatInr(selectedOrder.grandTotalInr)}
                    </strong>
                    .
                  </span>
                </div>
              )}

              {/* Expandable Full COD Payment Controls & History */}
              {paymentEditorOpen && (
                <div className="mt-3.5 space-y-3 border-t border-[#F2E9FF] pt-3.5">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
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

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={paymentNoteDraft}
                      onChange={(e) => setPaymentNoteDraft(e.target.value)}
                      placeholder="Payment note (e.g. Cash collected on doorstep)"
                      className="h-10 flex-1 rounded-xl border border-[#EBD8FF] bg-[#FCF9FF] px-3 text-xs font-medium text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={savingPayment || (isAlreadyPaid && paymentStatusDraft === 'Paid')}
                      onClick={() =>
                        paymentStatusDraft === 'Paid'
                          ? setConfirmPaidOpen(true)
                          : void executePaymentUpdate(paymentStatusDraft)
                      }
                      className="h-10 shrink-0 cursor-pointer rounded-xl bg-[#6A11CB] px-4 text-xs font-extrabold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
                    >
                      Save as {paymentStatusDraft}
                    </button>
                  </div>

                  {paymentHistory.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#6E5B85]">
                        Payment History
                      </p>
                      {paymentHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start justify-between gap-2 rounded-xl border border-[#EBD8FF]/80 bg-[#FCF9FF] px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-extrabold text-[#2B0B4E]">
                              {entry.status} · {formatInr(entry.amountInr)}
                            </span>
                            {entry.note && (
                              <p className="text-[11px] text-[#5B4874]">{entry.note}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-[10.5px] font-semibold text-[#6E5B85]">
                            {formatDateTime(entry.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 5. CUSTOMER & DELIVERY CARD (Matches Mockup Split Layout) */}
            <section className="rounded-[26px] border border-white/80 bg-white/95 p-4 shadow-[0_12px_30px_-16px_rgba(106,17,203,0.2)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
                    <User className="h-4 w-4" />
                  </span>
                  <h3 className="text-[15px] font-extrabold text-[#2B0B4E]">
                    Customer &amp; Delivery
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleOpenCustomerProfile}
                    className="cursor-pointer rounded-full border border-[#EBD8FF] bg-[#FAF6FF] px-3 py-1 text-[11px] font-extrabold text-[#6A11CB] transition-colors hover:bg-[#EFE2FF]"
                  >
                    Customer Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviousOrdersOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#F8D0E4] bg-[#FFF0F6] px-3 py-1 text-[11px] font-extrabold text-[#FF4D8D] transition-colors hover:bg-[#FFE3EF]"
                  >
                    <History className="h-3 w-3" />
                    <span>Orders ({customerPreviousOrders.length})</span>
                  </button>
                </div>
              </div>

              <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-start">
                <div className="space-y-2 text-xs">
                  <p className="flex items-center gap-2 text-[13.5px] font-extrabold text-[#2B0B4E]">
                    <User className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
                    <span>{selectedOrder.customer.fullName}</span>
                  </p>
                  <div className="flex items-center gap-2.5">
                    <p className="flex items-center gap-2 font-bold text-[#3E2A56]">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
                      <span>{selectedOrder.customer.phone}</span>
                    </p>
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        aria-label="Call Customer"
                        className="inline-flex h-7 items-center gap-1 rounded-full bg-[#EFE2FF] px-2.5 text-[11px] font-extrabold text-[#6A11CB] transition-colors hover:bg-[#6A11CB] hover:text-white"
                      >
                        <Phone className="h-3 w-3" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                  {selectedOrder.customer.email && (
                    <p className="flex items-center gap-2 font-medium text-[#5B4874]">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
                      <span className="truncate">{selectedOrder.customer.email}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2.5 text-xs text-[#3E2A56] sm:border-l sm:border-[#EFE3FF] sm:pl-4">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6A11CB]" />
                  <p className="leading-relaxed font-semibold">
                    {selectedOrder.customer.addressLine1}
                    {selectedOrder.customer.addressLine2
                      ? `, ${selectedOrder.customer.addressLine2}`
                      : ''}
                    , {selectedOrder.customer.city}, {selectedOrder.customer.state} —{' '}
                    <span className="font-extrabold text-[#2B0B4E]">
                      {selectedOrder.customer.pincode}
                    </span>
                    <span className="mt-1 block text-[11px] font-bold text-[#6A11CB]">
                      Zone: {selectedOrder.customer.deliveryZoneNameSnapshot}
                    </span>
                  </p>
                </div>
              </div>
            </section>

            {/* 6. PURCHASED PRODUCTS CARD (Matches Mockup) */}
            <section className="rounded-[26px] border border-white/80 bg-white/95 p-4 shadow-[0_12px_30px_-16px_rgba(106,17,203,0.2)] sm:p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
                  <Package className="h-4 w-4" />
                </span>
                <h3 className="text-[15px] font-extrabold text-[#2B0B4E]">
                  Purchased Products ({selectedOrder.items.length})
                </h3>
              </div>

              <div className="mt-3 space-y-2.5">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#EFE3FF] bg-[#FCF9FF] p-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-white">
                        {item.imageSnapshot ? (
                          <img
                            src={item.imageSnapshot}
                            alt={item.productNameSnapshot}
                            className="h-full w-full max-h-full max-w-full object-contain object-center"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#6A11CB]">
                            <Gift className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-extrabold text-[#2B0B4E]">
                          {item.productNameSnapshot}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-[#6E5B85]">
                          Qty: {item.quantity}
                          {item.productSkuSnapshot ? ` · SKU: ${item.productSkuSnapshot}` : ''}
                        </p>
                        {Object.keys(item.selectedVariants || {}).length > 0 && (
                          <p className="mt-0.5 text-[11px] font-semibold text-[#6A11CB]">
                            {Object.entries(item.selectedVariants)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' • ')}
                          </p>
                        )}
                        {item.personalizationDetails && (
                          <p className="mt-0.5 text-[11px] font-medium text-[#FF4D8D]">
                            Note: {item.personalizationDetails}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="shrink-0 text-[15px] font-extrabold tabular-nums text-[#6A11CB]">
                      {formatInr(item.lineTotalInr)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Compact Pricing Breakdown */}
              <div className="mt-3 space-y-1.5 border-t border-[#F2E9FF] pt-3 text-xs">
                <div className="flex justify-between text-[#6E5B85]">
                  <span>Subtotal</span>
                  <span className="font-bold tabular-nums text-[#2B0B4E]">
                    {formatInr(selectedOrder.subtotalInr)}
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

            {/* 7. CUSTOMER NOTIFICATIONS & ORDER ACTIVITY TIMELINE (2-Column on Desktop) */}
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
              {/* Customer App Notification Delivery History */}
              <section className="rounded-[26px] border border-white/80 bg-white/95 p-4 shadow-[0_12px_30px_-16px_rgba(106,17,203,0.18)]">
                <div className="flex items-center gap-2 border-b border-[#F2E9FF] pb-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FFF0F6] text-[#FF4D8D]">
                    <Bell className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-extrabold text-[#2B0B4E]">
                    App Notifications ({orderNotifications.length})
                  </h3>
                </div>

                {orderNotifications.length === 0 ? (
                  <p className="mt-3 text-xs text-[#6E5B85]">
                    Automatic in-app customer notifications will appear here once sent.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {orderNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="rounded-2xl border border-[#EFE3FF] bg-[#FCF9FF] p-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-extrabold text-[#2B0B4E]">{notif.title}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3E5FF] px-2 py-0.5 text-[10px] font-extrabold text-[#6A11CB]">
                            <ShieldCheck className="h-3 w-3" />
                            Delivered
                          </span>
                        </div>
                        <p className="mt-1 text-[11.5px] text-[#4A3860]">{notif.message}</p>
                        <p className="mt-1 text-[10px] font-semibold text-[#6E5B85]">
                          {formatDateTime(notif.sentAt)} · {notif.adminName || notif.triggeredBy}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Immutable Order Activity Timeline */}
              <section className="rounded-[26px] border border-white/80 bg-white/95 p-4 shadow-[0_12px_30px_-16px_rgba(106,17,203,0.18)]">
                <div className="flex items-center gap-2 border-b border-[#F2E9FF] pb-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
                    <Clock className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-extrabold text-[#2B0B4E]">
                    Activity Timeline ({activityTimeline.length})
                  </h3>
                </div>

                <ol className="relative mt-3.5 space-y-3 border-l-2 border-[#EBD8FF] pl-4">
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
                        <div className="rounded-2xl border border-[#EFE3FF] bg-[#FCF9FF] p-2.5 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="font-extrabold text-[#2B0B4E]">
                              {isPayment
                                ? 'Payment Updated'
                                : isNotification
                                ? 'Notification Sent'
                                : getStatusDisplayLabel(entry.status)}
                            </span>
                            <span className="text-[10px] font-semibold text-[#6E5B85]">
                              {formatDateTime(entry.timestamp)}
                            </span>
                          </div>
                          {entry.metadataSummary && (
                            <p className="mt-0.5 text-[11px] font-bold text-[#6A11CB]">
                              {entry.metadataSummary}
                            </p>
                          )}
                          {entry.note && (
                            <p className="mt-0.5 text-[11px] text-[#4A3860]">{entry.note}</p>
                          )}
                          <p className="mt-1 text-[10px] font-semibold text-[#6E5B85]">
                            By {entry.adminName || entry.updatedBy}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            </div>
          </div>
        </div>

        {/* Confirm Mark as Paid Dialog */}
        <AdminConfirmDialog
          open={confirmPaidOpen}
          title="Confirm COD Payment as Paid?"
          message={`Mark Order #${selectedOrder.orderNumber} as Paid with collected amount ${formatInr(
            Math.max(0, Number(collectedAmountDraft) || selectedOrder.grandTotalInr)
          )}? This will lock duplicate Paid confirmations and automatically notify the customer.`}
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

        {/* Official Order Receipt Preview & Download Modal (Same Receipt as Customer) */}
        <OrderReceiptModal
          order={receiptPreviewOpen ? selectedOrder : null}
          storeSettings={storeSettings}
          showPrintButton
          onClose={() => setReceiptPreviewOpen(false)}
          onDownloadComplete={() => {
            const rcp = resolveOrderReceipt(selectedOrder);
            showNotice(`Official Receipt PDF (${rcp.receiptNumber}) downloaded.`);
          }}
        />
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
          const count = tabCounts[tab.key] ?? 0;
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
          {filteredOrders.slice(0, visibleCount).map((order) => {
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
                    {isOrderReceiptAvailable(order) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#DEC7FF] bg-[#FAF5FF] px-2 py-0.5 font-mono text-[9.5px] font-extrabold text-[#6A11CB]">
                        <FileText className="h-2.5 w-2.5" />
                        {resolveOrderReceipt(order).receiptNumber}
                      </span>
                    )}
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
          {filteredOrders.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 20)}
              className="flex h-10 w-full cursor-pointer items-center justify-center rounded-2xl border border-[#E5D5FA] bg-white text-xs font-extrabold text-[#6A11CB] transition-colors hover:bg-[#FAF6FF]"
            >
              Load More Orders ({filteredOrders.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
