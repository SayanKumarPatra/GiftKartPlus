import { useMemo, useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { useOrders } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { formatDateTime, formatInr } from '../../utils/format';
import {
  CANONICAL_PAYMENT_STATUSES,
  getPaymentBadgeClasses,
  normalizePaymentStatus,
} from '../../utils/orderLifecycle';
import type { CanonicalPaymentStatus } from '../../types';
import {
  AdminEmptyState,
  AdminSheetModal,
  AdminToast,
} from '../../components/admin/AdminSharedUI';

type PaymentTab = 'All' | CanonicalPaymentStatus;
const PAYMENT_TABS: PaymentTab[] = ['All', ...CANONICAL_PAYMENT_STATUSES];

export function AdminPaymentsPage() {
  const { data: orders } = useOrders();
  const [activeTab, setActiveTab] = useState<PaymentTab>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  const transactions = useMemo(
    () =>
      orders.map((order) => ({
        order,
        reference:
          order.paymentReference ||
          `TXN-${order.orderNumber.replace(/[^A-Z0-9]/g, '')}`,
        status: normalizePaymentStatus(order),
      })),
    [orders]
  );

  const filtered = useMemo(() => {
    if (activeTab === 'All') return transactions;
    return transactions.filter((t) => t.status === activeTab);
  }, [transactions, activeTab]);

  const selectedTxn = useMemo(
    () => transactions.find((t) => t.order.id === selectedOrderId) ?? null,
    [transactions, selectedOrderId]
  );

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3500);
  }

  async function handleMarkPayment(
    orderId: string,
    orderNumber: string,
    amountInr: number,
    nextStatus: CanonicalPaymentStatus
  ) {
    setUpdating(true);
    try {
      const res = await services.orders.confirmOrderPayment(orderId, {
        status: nextStatus,
        collectedAmountInr: nextStatus === 'Unpaid' ? 0 : amountInr,
        note: `Payment status updated to ${nextStatus} from Payments Management.`,
      });
      showNotice(
        res.notificationSent
          ? `Payment for #${orderNumber} confirmed as ${nextStatus}. Customer notified.`
          : `Payment for #${orderNumber} saved as ${nextStatus}.`
      );
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to update payment status.',
        'error'
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-3">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {/* Payment Status Filter Tabs */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {PAYMENT_TABS.map((tab) => {
          const active = activeTab === tab;
          const count =
            tab === 'All'
              ? transactions.length
              : transactions.filter((t) => t.status === tab).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] text-white shadow-xs'
                  : 'border border-[#EBD8FF] bg-white text-[#4A3860]'
              }`}
            >
              {tab} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Real Order Payment Transactions List */}
      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={<CreditCard className="h-5 w-5" />}
          title="No payment transactions recorded yet."
          description="Real COD and online payment records from customer orders will appear here automatically."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(({ order, reference, status }) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedOrderId(order.id)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#EBD8FF]/90 bg-white px-3.5 py-3 text-left shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)] transition-all active:scale-[0.99] hover:border-[#6A11CB]/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold text-[#2B0B4E]">
                    {reference}
                  </p>
                  <p className="truncate text-[11.5px] text-[#6E5B85]">
                    #{order.orderNumber} · {order.paymentMethod || 'COD'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[13.5px] font-extrabold tabular-nums text-[#2B0B4E]">
                  {formatInr(order.grandTotalInr)}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getPaymentBadgeClasses(
                    status
                  )}`}
                >
                  {status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Transaction Details Sheet Modal */}
      <AdminSheetModal
        open={Boolean(selectedTxn)}
        title="Payment Settlement Details"
        subtitle={selectedTxn?.reference}
        onClose={() => setSelectedOrderId(null)}
        footer={
          <button
            type="button"
            onClick={() => setSelectedOrderId(null)}
            className="h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#540CA6] text-xs font-extrabold text-white"
          >
            Done
          </button>
        }
      >
        {selectedTxn && (
          <div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-[#6E5B85]">Reference ID</dt>
                <dd className="font-extrabold text-[#2B0B4E]">{selectedTxn.reference}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6E5B85]">Order Number</dt>
                <dd className="font-bold text-[#2B0B4E]">
                  #{selectedTxn.order.orderNumber}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6E5B85]">Customer</dt>
                <dd className="font-bold text-[#2B0B4E]">
                  {selectedTxn.order.customer.fullName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6E5B85]">Payment Method</dt>
                <dd className="font-semibold text-[#2B0B4E]">
                  {selectedTxn.order.paymentMethod || 'Cash on Delivery (COD)'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6E5B85]">Order Total</dt>
                <dd className="text-sm font-extrabold tabular-nums text-[#6A11CB]">
                  {formatInr(selectedTxn.order.grandTotalInr)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6E5B85]">Collected Amount</dt>
                <dd className="font-extrabold tabular-nums text-[#2B0B4E]">
                  {formatInr(
                    selectedTxn.order.paymentDetails?.collectedAmountInr ??
                      (selectedTxn.status === 'Paid' ? selectedTxn.order.grandTotalInr : 0)
                  )}
                </dd>
              </div>
              {selectedTxn.order.paymentDetails?.confirmedByAdminName && (
                <div className="flex justify-between">
                  <dt className="text-[#6E5B85]">Confirmed By</dt>
                  <dd className="font-semibold text-[#2B0B4E]">
                    {selectedTxn.order.paymentDetails.confirmedByAdminName}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[#6E5B85]">Recorded On</dt>
                <dd className="font-medium text-[#4A3860]">
                  {formatDateTime(selectedTxn.order.createdAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-[#EFE3FF] pt-3">
              <p className="mb-2 text-[11.5px] font-bold text-[#4A3860]">
                Update Payment Status
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CANONICAL_PAYMENT_STATUSES.map((st) => {
                  const isLockedPaid = selectedTxn.status === 'Paid' && st === 'Paid';
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={updating || isLockedPaid}
                      onClick={() =>
                        void handleMarkPayment(
                          selectedTxn.order.id,
                          selectedTxn.order.orderNumber,
                          selectedTxn.order.grandTotalInr,
                          st
                        )
                      }
                      className={`inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-xl border text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-65 ${
                        selectedTxn.status === st
                          ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
                          : 'border-[#EBD8FF] bg-[#FAF6FF] text-[#4A3860]'
                      }`}
                    >
                      {isLockedPaid && <Lock className="h-3 w-3" />}
                      <span>{st}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </AdminSheetModal>
    </div>
  );
}
