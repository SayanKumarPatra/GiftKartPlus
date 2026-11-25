import { useMemo, useState } from 'react';
import { CreditCard, X } from 'lucide-react';
import { useOrders } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { formatDateTime, formatInr } from '../../utils/format';
import type { DemoOrder, PaymentRecordStatus } from '../../types';
import { AdminEmptyState, AdminToast } from '../../components/admin/AdminSharedUI';

type PaymentTab = 'All' | 'Successful' | 'Pending' | 'Failed';
const PAYMENT_TABS: PaymentTab[] = ['All', 'Successful', 'Pending', 'Failed'];

function derivePaymentStatus(order: DemoOrder): PaymentRecordStatus {
  if (order.paymentStatus) return order.paymentStatus;
  if (order.fulfillmentStatus === 'Cancelled') return 'FAILED';
  if (
    order.fulfillmentStatus === 'Completed' ||
    order.fulfillmentStatus === 'Delivered'
  ) {
    return 'SUCCESS';
  }
  return 'PENDING';
}

function getPaymentLabel(status: PaymentRecordStatus): Exclude<PaymentTab, 'All'> {
  if (status === 'SUCCESS') return 'Successful';
  if (status === 'FAILED') return 'Failed';
  return 'Pending';
}

function getPaymentBadgeClass(status: PaymentRecordStatus): string {
  if (status === 'SUCCESS') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'FAILED') return 'bg-rose-50 text-rose-700 border border-rose-200';
  return 'bg-amber-50 text-amber-800 border border-amber-200';
}

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
        status: derivePaymentStatus(order),
      })),
    [orders]
  );

  const filtered = useMemo(() => {
    if (activeTab === 'All') return transactions;
    return transactions.filter((t) => getPaymentLabel(t.status) === activeTab);
  }, [transactions, activeTab]);

  const selectedTxn = useMemo(
    () => transactions.find((t) => t.order.id === selectedOrderId) ?? null,
    [transactions, selectedOrderId]
  );

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  async function handleMarkPayment(
    orderId: string,
    orderNumber: string,
    nextStatus: PaymentRecordStatus
  ) {
    setUpdating(true);
    try {
      await services.orders.updatePaymentStatus(
        orderId,
        nextStatus,
        `Payment status marked as ${getPaymentLabel(nextStatus)} by Admin.`
      );
      await services.adminAuth.logActivity(
        `Updated payment for #${orderNumber} to ${getPaymentLabel(nextStatus)}`,
        'Payments Management'
      );
      showNotice(`Payment for #${orderNumber} updated to ${getPaymentLabel(nextStatus)}.`);
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
              : transactions.filter((t) => getPaymentLabel(t.status) === tab).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] text-white shadow-xs'
                  : 'border border-[#E5D5FA] bg-white text-[#4A3860]'
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
          description="Real payment records from customer orders will appear here automatically."
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
                  <p className="truncate text-[13px] font-extrabold text-[#1E1035]">
                    {reference}
                  </p>
                  <p className="truncate text-[11.5px] text-[#75648E]">
                    #{order.orderNumber} · {order.paymentMethod || 'COD'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[13.5px] font-extrabold tabular-nums text-[#1E1035]">
                  {formatInr(order.grandTotalInr)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${getPaymentBadgeClass(
                    status
                  )}`}
                >
                  {getPaymentLabel(status)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Transaction Details Sheet */}
      {selectedTxn && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[95] flex items-end justify-center bg-[#1E1035]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
        >
          <div className="w-full max-w-md rounded-t-[26px] border border-[#EBD8FF] bg-white p-4 shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE3FF] pb-3">
              <h3 className="text-[15.5px] font-extrabold text-[#1E1035]">
                Transaction Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                aria-label="Close transaction details"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-[#FAF6FF] text-[#594A6B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-[#75648E]">Reference ID</dt>
                <dd className="font-extrabold text-[#1E1035]">{selectedTxn.reference}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#75648E]">Order Number</dt>
                <dd className="font-bold text-[#1E1035]">
                  #{selectedTxn.order.orderNumber}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#75648E]">Customer</dt>
                <dd className="font-bold text-[#1E1035]">
                  {selectedTxn.order.customer.fullName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#75648E]">Payment Method</dt>
                <dd className="font-semibold text-[#1E1035]">
                  {selectedTxn.order.paymentMethod || 'Cash on Delivery (COD)'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#75648E]">Amount</dt>
                <dd className="text-sm font-extrabold tabular-nums text-[#6A11CB]">
                  {formatInr(selectedTxn.order.grandTotalInr)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#75648E]">Recorded On</dt>
                <dd className="font-medium text-[#4A3860]">
                  {formatDateTime(selectedTxn.order.createdAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-[#EFE3FF] pt-3">
              <p className="mb-2 text-[11.5px] font-bold text-[#4A3860]">
                Record Payment Settlement Status
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['SUCCESS', 'PENDING', 'FAILED'] as PaymentRecordStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        void handleMarkPayment(
                          selectedTxn.order.id,
                          selectedTxn.order.orderNumber,
                          st
                        )
                      }
                      className={`h-9 cursor-pointer rounded-xl border text-xs font-bold transition-colors ${
                        selectedTxn.status === st
                          ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
                          : 'border-[#E5D5FA] bg-[#FAF6FF] text-[#4A3860]'
                      }`}
                    >
                      {getPaymentLabel(st)}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
