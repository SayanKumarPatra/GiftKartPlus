import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../hooks/useStoreData';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, formatInr } from '../../utils/format';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { MobileOrdersPage } from '../../components/storefront/MobileOrdersPage';
import { MobileAccountAuthPages } from '../../components/storefront/MobileAccountAuthPages';

export function CustomerAccountPage() {
  const {
    customerAccount,
    customerAuthProviderLabel,
    signInCustomerDemo,
    signOutCustomer,
  } = useAuth();
  const { pushToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const navState = location.state as { from?: string; reason?: string } | null;
  const redirectTarget = navState?.from;
  const isWishlistRedirect = navState?.reason === 'wishlist';

  const [fullName, setFullName] = useState('Ananya Chatterjee');
  const [email, setEmail] = useState('demo@giftkart.in');
  const [phone, setPhone] = useState('9382040746');
  const [defaultCity, setDefaultCity] = useState('Jalchak');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    await signInCustomerDemo({ fullName, email, phone, defaultCity });
    if (redirectTarget && redirectTarget !== '/account') {
      navigate(redirectTarget, { replace: true });
      return;
    }
    pushToast({
      title: 'Signed In Successfully',
      description: 'Your account session is now active.',
      variant: 'success',
    });
  }

  return (
    <>
      {/* Normal Mobile (< 900px): Premium 4-Screen Auth & My Account Experience */}
      <div className="-mx-3.5 -my-4 sm:-mx-6 sm:-my-5 lg:hidden">
        <MobileAccountAuthPages />
      </div>

      {/* Desktop & Mobile Desktop-Site (>= 900px): Existing Desktop Account Page Unchanged */}
      <div className="mx-auto hidden max-w-3xl space-y-6 lg:block">
        <div className="gk-promo-gradient rounded-3xl border border-[#EBD8FF] p-6 sm:p-8">
        <p className="text-xs font-bold text-[#FF4D8D]">
          Customer Sign In · Account Access
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

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              to="/my-orders"
              className="rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF] p-4 text-center text-xs font-bold text-[#6A11CB] hover:bg-[#EBD8FF]/70"
            >
              My Orders →
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
          </div>

          <p className="rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF]/60 p-3.5 text-xs text-[#594A6B]">
            Demo session only (LocalStorage). Not production authentication security; Supabase Auth will replace this adapter in a future backend phase.
          </p>
        </div>
      ) : (
        <div className="gk-card rounded-3xl p-6">
          {isWishlistRedirect && (
            <div className="mb-4 rounded-xl border border-[#EBD8FF] bg-[#F8F2FF] px-4 py-3 text-xs font-semibold text-[#5A11AD]">
              Please sign in to save and manage products in your Wishlist.
            </div>
          )}
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
    </>
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
    <>
      {/* Normal Mobile (< 900px): Premium Mobile Orders Page UI */}
      <div className="-mx-3.5 -my-4 sm:-mx-6 sm:-my-5 lg:hidden">
        <MobileOrdersPage />
      </div>

      {/* Desktop & Mobile Desktop-Site (>= 900px): Existing Desktop Orders Page Unchanged */}
      <div className="hidden space-y-6 lg:block">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
