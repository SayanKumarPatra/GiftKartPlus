import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, Package, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../hooks/useStoreData';
import { useToast } from '../../context/ToastContext';
import { services } from '../../services/registry';
import type { DemoOrder } from '../../types';
import { formatDateTime, formatInr } from '../../utils/format';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

export function CustomerAccountPage() {
  const {
    customerAccount,
    customerAuthProviderLabel,
    signInCustomerDemo,
    signOutCustomer,
  } = useAuth();
  const { pushToast } = useToast();

  const [fullName, setFullName] = useState('Ananya Chatterjee');
  const [email, setEmail] = useState('demo@giftkart.in');
  const [phone, setPhone] = useState('9382040746');
  const [defaultCity, setDefaultCity] = useState('Jalchak');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    await signInCustomerDemo({ fullName, email, phone, defaultCity });
    pushToast({
      title: 'Demo Customer Signed In',
      description: 'Saved locally in browser storage (demo only).',
      variant: 'success',
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-6 sm:p-8">
        <p className="text-xs font-bold text-[#FF4D8D]">
          Replaceable Auth Interface · Demo Mode Only
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#3B0764]">
          Customer Account
        </h1>
        <p className="mt-1 text-xs text-[#594A6B]">{customerAuthProviderLabel}</p>
      </div>

      {customerAccount ? (
        <div className="gk-card space-y-5 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8F2FF] text-[#6A11CB]">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#2B0B4E]">
                  {customerAccount.fullName}
                </h2>
                <p className="text-xs text-[#594A6B]">
                  {customerAccount.email} · {customerAccount.phone} · {customerAccount.defaultCity}
                </p>
              </div>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                void signOutCustomer();
                pushToast({ title: 'Signed out of Demo Account', variant: 'info' });
              }}
            >
              Sign Out
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/my-orders"
              className="rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF] p-4 text-center text-xs font-bold text-[#6A11CB] hover:bg-[#EBD8FF]/70"
            >
              My Demo Orders →
            </Link>
            <Link
              to="/addresses"
              className="rounded-2xl border border-[#EBD8FF] bg-[#FFF0F6] p-4 text-center text-xs font-bold text-[#FF4D8D] hover:bg-[#FF4D8D]/15"
            >
              Saved Addresses →
            </Link>
            <Link
              to="/wishlist"
              className="rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF] p-4 text-center text-xs font-bold text-[#6A11CB] hover:bg-[#EBD8FF]/70"
            >
              Saved Wishlist →
            </Link>
            <Link
              to="/track-order"
              className="rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-4 text-center text-xs font-bold text-[#2B0B4E] hover:bg-[#EBD8FF]/70"
            >
              Track Order →
            </Link>
          </div>

          <p className="rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF]/60 p-3.5 text-xs text-[#594A6B]">
            Demo session only (LocalStorage). Not production authentication security; Supabase Auth will replace this adapter in a future backend phase.
          </p>
        </div>
      ) : (
        <div className="gk-card rounded-3xl p-6">
          <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2B0B4E]">
                  Preferred Delivery City
                </label>
                <select
                  value={defaultCity}
                  onChange={(e) => setDefaultCity(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm focus:border-[#6A11CB] focus:outline-none"
                >
                  <option value="Jalchak">Jalchak</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="gk-btn-purple flex min-h-[46px] w-full items-center justify-center rounded-full text-sm font-bold"
            >
              Sign In (Demo Browser Session)
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function MyOrdersPage() {
  const { data: orders } = useOrders();
  const { customerAccount } = useAuth();

  const visibleOrders = customerAccount
    ? orders.filter(
        (o) =>
          o.customerAccountId === customerAccount.id ||
          o.customer.email.toLowerCase() === customerAccount.email.toLowerCase()
      )
    : orders;

  const displayList = visibleOrders.length > 0 ? visibleOrders : orders;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#3B0764]">My Demo Orders</h1>
        <p className="mt-1 text-sm text-[#594A6B]">
          All locally stored demo orders preserve immutable product, price, customization, and gift wrapping snapshots.
        </p>
      </div>

      {displayList.length === 0 ? (
        <EmptyState
          title="No demo orders placed yet"
          description="Explore GiftKart and place your first demo order to see immutable receipts here."
          icon={<Package className="h-5 w-5" />}
          action={
            <Link to="/shop">
              <Button size="sm">Start Shopping</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {displayList.map((order) => (
            <div key={order.id} className="gk-card rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EBD8FF] pb-3.5">
                <div>
                  <span className="font-mono text-base font-extrabold text-[#6A11CB]">
                    {order.orderNumber}
                  </span>
                  <p className="text-xs text-[#594A6B]">
                    Placed {formatDateTime(order.createdAt)} · {order.customer.deliveryZoneNameSnapshot}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#F8F2FF] px-3 py-1 text-xs font-bold text-[#6A11CB]">
                    {order.fulfillmentStatus}
                  </span>
                  <span className="font-mono text-base font-extrabold tabular-nums text-[#2B0B4E]">
                    {formatInr(order.grandTotalInr)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#594A6B]">
                <div>
                  {order.items.map((item, idx) => (
                    <span key={idx} className="mr-3 font-semibold text-[#2B0B4E]">
                      {item.productNameSnapshot} × {item.quantity}
                    </span>
                  ))}
                  {order.giftWrap.enabled && (
                    <span className="font-semibold text-[#FF4D8D]">
                      · Gift Wrapped ({order.giftWrap.styleNameSnapshot})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    to={`/order/${order.orderNumber}`}
                    className="font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
                  >
                    Order Details →
                  </Link>
                  <Link
                    to={`/track-order?order=${order.orderNumber}`}
                    className="font-semibold text-[#594A6B] hover:text-[#6A11CB]"
                  >
                    Track Status
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const initialOrder = searchParams.get('order') ?? 'GK-2026-1001';
  const [query, setQuery] = useState(initialOrder);
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    void services.orders.getOrderByNumber(initialOrder).then((found) => {
      if (found) {
        setOrder(found);
        setSearched(true);
      }
    });
  }, [initialOrder]);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const found = await services.orders.getOrderByNumber(query);
    setOrder(found);
    setSearched(true);
  }

  return (
    <div className="space-y-6">
      <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold text-[#3B0764]">Track Demo Order</h1>
        <p className="mt-1.5 text-sm text-[#4B2C70]">
          Enter your GiftKart order number (try <span className="font-mono font-bold text-[#6A11CB]">GK-2026-1001</span> or{' '}
          <span className="font-mono font-bold text-[#6A11CB]">GK-2026-1002</span>) to view frozen snapshots and timestamped status history.
        </p>

        <form onSubmit={(e) => void handleLookup(e)} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="GK-2026-1001"
            className="min-h-[46px] flex-1 rounded-full border border-[#EBD8FF] bg-white px-5 font-mono text-sm font-bold text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
          />
          <button
            type="submit"
            className="gk-btn-purple inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full px-7 text-sm font-bold"
          >
            <Search className="h-4 w-4" />
            <span>Track Order</span>
          </button>
        </form>
      </div>

      {searched && !order && (
        <EmptyState
          title="Order not found"
          description={`We couldn't find a local demo order matching "${query}".`}
        />
      )}

      {order && (
        <div className="gk-card space-y-6 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EBD8FF] pb-4">
            <div>
              <p className="font-mono text-xs font-bold text-[#FF4D8D]">
                {order.orderNumber} · DEMO ORDER ONLY · {order.customer.deliveryZoneNameSnapshot}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#3B0764]">
                Current Status: {order.fulfillmentStatus}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6E5B85]">Grand Total</p>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-[#6A11CB]">
                {formatInr(order.grandTotalInr)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-6">
              <h3 className="text-sm font-extrabold text-[#2B0B4E]">
                Frozen Item &amp; Gift Wrapping Snapshots
              </h3>
              {order.items.map((item, idx) => (
                <div
                  key={`${item.productSkuSnapshot}-${idx}`}
                  className="rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF]/70 p-4 text-xs"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-bold text-[#2B0B4E]">
                      {item.productNameSnapshot} × {item.quantity}
                    </span>
                    <span className="font-mono font-bold tabular-nums text-[#6A11CB]">
                      {formatInr(item.lineTotalInr)}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-[#6E5B85]">
                    SKU: {item.productSkuSnapshot} · Unit: {formatInr(item.unitPriceInrSnapshot)}
                  </p>
                  {item.personalizationDetails && (
                    <p className="mt-1 font-semibold text-[#6A11CB]">
                      Personalization: {item.personalizationDetails}
                    </p>
                  )}
                </div>
              ))}

              {order.giftWrap.enabled && (
                <div className="rounded-2xl border border-[#EBD8FF] bg-[#FFF0F6]/70 p-4 text-xs">
                  <p className="font-bold text-[#FF4D8D]">
                    Gift Wrap: {order.giftWrap.styleNameSnapshot} ({formatInr(order.giftWrap.chargeInrSnapshot)})
                  </p>
                  <p className="mt-1 text-[#2B0B4E]">
                    Recipient: {order.giftWrap.recipientName || 'Not specified'}
                  </p>
                  {order.giftWrap.giftMessage && (
                    <p className="mt-1 italic text-[#594A6B]">&ldquo;{order.giftWrap.giftMessage}&rdquo;</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 lg:col-span-6">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#2B0B4E]">
                <Clock className="h-4 w-4 text-[#6A11CB]" />
                <span>Timestamped Status History</span>
              </h3>
              <ol className="space-y-3">
                {order.statusHistory.map((entry, idx) => (
                  <li
                    key={`${entry.timestamp}-${idx}`}
                    className="rounded-2xl border border-[#EBD8FF] bg-white p-4 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#2B0B4E]">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        {entry.status}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-[#6E5B85]">
                        {formatDateTime(entry.timestamp)}
                      </span>
                    </div>
                    {entry.note && <p className="mt-1.5 text-[#594A6B]">{entry.note}</p>}
                    <p className="mt-1 text-[11px] text-[#8B7AA0]">
                      Updated by: {entry.updatedBy}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
