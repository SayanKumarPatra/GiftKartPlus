import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronRight,
  Mail,
  Phone,
  Search,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useOrders, useRegisteredCustomers } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { formatDateTime, formatInr } from '../../utils/format';
import { getStatusDisplayLabel, normalizePaymentStatus } from '../../utils/orderLifecycle';
import type { DemoOrder, RegisteredCustomer } from '../../types';
import {
  AdminConfirmDialog,
  AdminEmptyState,
  AdminToast,
} from '../../components/admin/AdminSharedUI';

export function AdminCustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: customers } = useRegisteredCustomers();
  const { data: orders } = useOrders();

  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(25);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<RegisteredCustomer | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setVisibleCount(25);
  }, [search]);

  useEffect(() => {
    const paramId = searchParams.get('customerId')?.trim();
    const paramEmail = searchParams.get('email')?.trim().toLowerCase();
    if (!paramId && !paramEmail) return;
    const match = customers.find(
      (c) =>
        (paramId && c.id === paramId) ||
        (paramEmail && c.email.toLowerCase() === paramEmail)
    );
    if (match) {
      setSelectedId(match.id);
    }
  }, [customers, searchParams]);

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  const orderCountIndex = useMemo(() => {
    const byId = new Map<string, Set<string>>();
    const byEmail = new Map<string, Set<string>>();
    for (const o of orders) {
      if (o.customerAccountId) {
        const s = byId.get(o.customerAccountId) ?? new Set<string>();
        s.add(o.id);
        byId.set(o.customerAccountId, s);
      }
      const em = (o.customer.email || '').trim().toLowerCase();
      if (em) {
        const s = byEmail.get(em) ?? new Set<string>();
        s.add(o.id);
        byEmail.set(em, s);
      }
    }
    return { byId, byEmail };
  }, [orders]);

  function getOrderCountForCustomer(customer: RegisteredCustomer): number {
    const ids = new Set<string>();
    const idMatches = orderCountIndex.byId.get(customer.id);
    if (idMatches) idMatches.forEach((id) => ids.add(id));
    const emMatches = orderCountIndex.byEmail.get(customer.email.toLowerCase());
    if (emMatches) emMatches.forEach((id) => ids.add(id));
    return ids.size;
  }

  function getOrdersForCustomer(customer: RegisteredCustomer): DemoOrder[] {
    const email = customer.email.toLowerCase();
    return orders.filter(
      (o) =>
        o.customerAccountId === customer.id ||
        o.customer.email.toLowerCase() === email
    );
  }

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedId) ?? null,
    [customers, selectedId]
  );

  async function confirmToggleBlock() {
    if (!blockTarget) return;
    const nextStatus = blockTarget.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    await services.customers.setCustomerStatus(blockTarget.id, nextStatus);
    await services.adminAuth.logActivity(
      `${nextStatus === 'BLOCKED' ? 'Blocked' : 'Unblocked'} customer ${blockTarget.email}`,
      'Customers Management'
    );
    setBlockTarget(null);
    showNotice(
      nextStatus === 'BLOCKED'
        ? `${blockTarget.fullName} has been blocked.`
        : `${blockTarget.fullName} has been unblocked.`
    );
  }

  // Customer Details Screen
  if (selectedCustomer) {
    const customerOrders = getOrdersForCustomer(selectedCustomer);
    const totalSpent = customerOrders
      .filter((o) => o.fulfillmentStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.grandTotalInr, 0);
    const isBlocked = selectedCustomer.status === 'BLOCKED';

    return (
      <div className="space-y-3">
        <AdminToast
          message={toast?.message ?? null}
          tone={toast?.tone}
          onClose={() => setToast(null)}
        />

        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            if (searchParams.has('customerId') || searchParams.has('email')) {
              setSearchParams({}, { replace: true });
            }
          }}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-extrabold text-[#6A11CB]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Customers</span>
        </button>

        {/* Customer Profile Card */}
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.2)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EFE2FF] text-base font-extrabold text-[#6A11CB]">
                {(selectedCustomer.fullName[0] || 'C').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold text-[#1E1035]">
                  {selectedCustomer.fullName}
                </p>
                <p className="text-[11.5px] font-semibold text-[#75648E]">
                  ID: {selectedCustomer.id}
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold ${
                isBlocked
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {isBlocked ? 'Blocked' : 'Active'}
            </span>
          </div>

          <div className="mt-3 space-y-1.5 border-t border-[#F2E9FF] pt-3 text-xs text-[#4A3860]">
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-[#6A11CB]" />
              <span>{selectedCustomer.email || '—'}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-[#6A11CB]" />
              <span>{selectedCustomer.phone || 'Not provided'}</span>
            </p>
            <p className="text-[11.5px] text-[#75648E]">
              Registered: {formatDateTime(selectedCustomer.registeredAt)}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#F2E9FF] pt-3">
            <div className="rounded-xl bg-[#FAF6FF] p-2.5 text-center">
              <p className="text-[10.5px] font-semibold text-[#75648E]">
                Total Orders
              </p>
              <p className="mt-0.5 text-[15px] font-extrabold tabular-nums text-[#1E1035]">
                {customerOrders.length}
              </p>
            </div>
            <div className="rounded-xl bg-[#FAF6FF] p-2.5 text-center">
              <p className="text-[10.5px] font-semibold text-[#75648E]">
                Total Spend
              </p>
              <p className="mt-0.5 text-[15px] font-extrabold tabular-nums text-[#6A11CB]">
                {formatInr(totalSpent)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBlockTarget(selectedCustomer)}
            className={`mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold transition-colors ${
              isBlocked
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {isBlocked ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Unblock Customer</span>
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                <span>Block Customer</span>
              </>
            )}
          </button>
        </div>

        {/* Purchase History */}
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-3.5 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.16)]">
          <h3 className="text-[13px] font-extrabold text-[#1E1035]">
            Purchase History ({customerOrders.length})
          </h3>
          {customerOrders.length === 0 ? (
            <p className="mt-2 text-xs text-[#75648E]">
              No orders placed by this customer yet.
            </p>
          ) : (
            <div className="mt-2.5 divide-y divide-[#F2E9FF]">
              {customerOrders.map((order) => (
                <div key={order.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#1E1035]">
                      #{order.orderNumber}
                    </span>
                    <span className="font-extrabold tabular-nums text-[#6A11CB]">
                      {formatInr(order.grandTotalInr)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#75648E]">
                    {order.items.map((i) => `${i.productNameSnapshot} ×${i.quantity}`).join(', ')}
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-[#594A6B]">
                    Status: {getStatusDisplayLabel(order.fulfillmentStatus)} · Payment:{' '}
                    {normalizePaymentStatus(order)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <AdminConfirmDialog
          open={Boolean(blockTarget)}
          title={isBlocked ? 'Unblock Customer?' : 'Block Customer?'}
          message={
            isBlocked
              ? `Allow ${selectedCustomer.fullName} to log in and place orders on GiftKart again?`
              : `Blocking ${selectedCustomer.fullName} will prevent login and new orders while preserving all existing purchase records.`
          }
          confirmLabel={isBlocked ? 'Unblock' : 'Block Customer'}
          danger={!isBlocked}
          onConfirm={() => void confirmToggleBlock()}
          onCancel={() => setBlockTarget(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {/* Search Customer Input (Matches Mockup Screen 9) */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6894]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer..."
          className="h-10 w-full rounded-full border border-[#E5D5FA] bg-white pl-9.5 pr-3.5 text-[13px] font-medium text-[#1E1035] placeholder:text-[#8E7EA6] shadow-[0_4px_12px_-8px_rgba(106,17,203,0.18)] focus:border-[#6A11CB] focus:outline-none"
        />
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <AdminEmptyState
          icon={<Users className="h-5 w-5" />}
          title="Your customer list is empty."
          description="Customers who sign in or place orders on GiftKart will automatically sync here."
        />
      ) : (
        <div className="space-y-2">
          {filteredCustomers.slice(0, visibleCount).map((customer) => {
            const orderCount = getOrderCountForCustomer(customer);
            const isBlocked = customer.status === 'BLOCKED';
            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => setSelectedId(customer.id)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#EBD8FF]/90 bg-white px-3.5 py-3 text-left shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)] transition-all active:scale-[0.99] hover:border-[#6A11CB]/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFE2FF] text-sm font-extrabold text-[#6A11CB]">
                    {(customer.fullName[0] || 'C').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[13.5px] font-extrabold text-[#1E1035]">
                        {customer.fullName}
                      </p>
                      {isBlocked && (
                        <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-700">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11.5px] text-[#75648E]">
                      {customer.email}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5ECFF] px-2 py-0.5 text-[10.5px] font-bold text-[#6A11CB]">
                    <ShoppingBag className="h-3 w-3" />
                    {orderCount}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#8B7AA0]" />
                </div>
              </button>
            );
          })}
          {filteredCustomers.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 25)}
              className="flex h-10 w-full cursor-pointer items-center justify-center rounded-2xl border border-[#E5D5FA] bg-white text-xs font-extrabold text-[#6A11CB] transition-colors hover:bg-[#FAF6FF]"
            >
              Load More Customers ({filteredCustomers.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
