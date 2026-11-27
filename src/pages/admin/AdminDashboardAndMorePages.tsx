import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  Image as ImageIcon,
  Layers,
  LogOut,
  Package,
  Percent,
  Plus,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Users,
  Wrench,
} from 'lucide-react';
import {
  useCategories,
  useCoupons,
  useOrders,
  useProducts,
  useRegisteredCustomers,
  useStoreNotifications,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { useAuth } from '../../context/AuthContext';

export function AdminDashboardPage() {
  const { data: categories } = useCategories(true);
  const { data: products } = useProducts({ includeInactive: true });
  const { data: orders } = useOrders();
  const { data: customers } = useRegisteredCustomers();
  const { data: coupons } = useCoupons();
  const { data: settings } = useStoreSettings();
  const { data: notifications } = useStoreNotifications(true);
  const activeNotifCount = notifications.filter((n) => n.isActive).length;

  const pendingOrdersCount = orders.filter(
    (o) =>
      o.fulfillmentStatus === 'New Order' ||
      o.fulfillmentStatus === 'New' ||
      o.fulfillmentStatus === 'Demo Placed'
  ).length;
  const isMaintenance = Boolean(settings?.maintenanceMode);

  const managementCards = [
    {
      to: '/admin/products',
      title: 'Products',
      subtitle: 'Manage Items',
      count: products.length,
      Icon: Package,
      iconBg: 'bg-[#F3E8FF] text-[#6A11CB]',
    },
    {
      to: '/admin/orders',
      title: 'Orders',
      subtitle: 'Manage Orders',
      count: orders.length,
      Icon: ShoppingBag,
      iconBg: 'bg-[#FFE8F1] text-[#FF4D8D]',
    },
    {
      to: '/admin/customers',
      title: 'Customers',
      subtitle: 'Manage Users',
      count: customers.length,
      Icon: Users,
      iconBg: 'bg-[#F3E8FF] text-[#8B1AD9]',
    },
    {
      to: '/admin/offers',
      title: 'Offers',
      subtitle: 'Discounts & Deals',
      count: coupons.length,
      Icon: Percent,
      iconBg: 'bg-[#FFE8F1] text-[#E62873]',
    },
  ];

  const quickActions = [
    {
      to: '/admin/products?new=1',
      label: 'Add Product',
      Icon: Plus,
      color: 'text-[#6A11CB] bg-[#F4EAFF]',
    },
    {
      to: '/admin/banners',
      label: 'Manage Banner',
      Icon: ImageIcon,
      color: 'text-[#6A11CB] bg-[#F4EAFF]',
    },
    {
      to: '/admin/offers?new=1',
      label: 'Create Offer',
      Icon: Tag,
      color: 'text-[#FF4D8D] bg-[#FFEAF2]',
    },
    {
      to: '/admin/orders',
      label: 'View Orders',
      Icon: ShoppingBag,
      color: 'text-[#FF4D8D] bg-[#FFEAF2]',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Compact Header + Store Operational Status */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div>
          <h2 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#1E1035]">
            Dashboard
          </h2>
          <p className="mt-0.5 text-[12.5px] font-medium text-[#685782]">
            Manage Your GiftKart Store
          </p>
        </div>

        <Link
          to="/admin/settings"
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
            isMaintenance
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {isMaintenance ? (
            <>
              <Wrench className="h-3 w-3" />
              <span>Maintenance</span>
            </>
          ) : (
            <>
              <Globe className="h-3 w-3" />
              <span>Store Live</span>
            </>
          )}
        </Link>
      </div>

      {/* Pending Action Row — Only Rendered When Real Pending Orders Exist */}
      {pendingOrdersCount > 0 && (
        <Link
          to="/admin/orders"
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#FF4D8D]/25 bg-gradient-to-r from-[#FFF0F6] to-white px-3.5 py-3 shadow-[0_6px_18px_-12px_rgba(255,77,141,0.3)] transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FF4D8D] text-xs font-extrabold text-white">
              {pendingOrdersCount}
            </span>
            <div>
              <p className="text-[13px] font-extrabold text-[#1E1035]">
                New {pendingOrdersCount === 1 ? 'Order' : 'Orders'} Waiting
              </p>
              <p className="text-[11.5px] text-[#685782]">
                Tap to review and update status
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#FF4D8D]" />
        </Link>
      )}

      {/* 2x2 Management Grid (Matches Mockup Screen 2) */}
      <section aria-label="Core store management">
        <div className="grid grid-cols-2 gap-3">
          {managementCards.map(({ to, title, subtitle, count, Icon, iconBg }) => (
            <Link
              key={to}
              to={to}
              className="group relative flex flex-col items-center rounded-2xl border border-[#EBD8FF]/90 bg-white px-3 py-4 text-center shadow-[0_8px_20px_-14px_rgba(106,17,203,0.22)] transition-all active:scale-[0.98] hover:border-[#6A11CB]/40"
            >
              <span className="absolute right-2.5 top-2.5 rounded-full bg-[#F5ECFF] px-2 py-0.5 text-[10.5px] font-extrabold tabular-nums text-[#6A11CB]">
                {count}
              </span>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}
              >
                <Icon className="h-5.5 w-5.5 stroke-[2.1]" />
              </div>
              <p className="mt-2.5 text-[14px] font-extrabold text-[#1E1035]">
                {title}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[#75648E]">
                {subtitle}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions Row */}
      <section aria-label="Quick actions" className="space-y-2.5 pt-1">
        <h3 className="px-0.5 text-[14px] font-extrabold text-[#1E1035]">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {quickActions.map(({ to, label, Icon, color }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#EBD8FF]/85 bg-white px-2.5 py-3.5 text-center shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)] transition-all active:scale-[0.97] hover:border-[#6A11CB]/40"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}
              >
                <Icon className="h-4.5 w-4.5 stroke-[2.2]" />
              </span>
              <span className="text-[11.5px] font-bold leading-tight text-[#1E1035]">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Compact Storefront Quick Links to Other Management Modules */}
      <section aria-label="Website modules" className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-[14px] font-extrabold text-[#1E1035]">
            Store Management
          </h3>
          <Link
            to="/admin/more"
            className="text-[12px] font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
          >
            All Tools →
          </Link>
        </div>

        <div className="space-y-2">
          {[
            {
              to: '/admin/banners',
              title: 'Banner Management',
              desc: `${settings?.heroSlides?.length ?? 0} sliding banner${(settings?.heroSlides?.length ?? 0) === 1 ? '' : 's'}`,
              Icon: ImageIcon,
            },
            {
              to: '/admin/categories',
              title: 'Category Management',
              desc: `${categories.length} storefront ${categories.length === 1 ? 'category' : 'categories'}`,
              Icon: Layers,
            },
            {
              to: '/admin/notifications',
              title: 'Notification Management',
              desc: `${activeNotifCount} active storefront ${activeNotifCount === 1 ? 'notification' : 'notifications'}`,
              Icon: Bell,
            },
            {
              to: '/admin/settings',
              title: 'Website Settings',
              desc: 'Branding, contact, SEO & policies',
              Icon: Settings,
            },
          ].map(({ to, title, desc, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#EBD8FF]/85 bg-white px-3.5 py-3 shadow-[0_6px_16px_-12px_rgba(106,17,203,0.16)] transition-all active:scale-[0.99] hover:border-[#6A11CB]/35"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-[#1E1035]">
                    {title}
                  </p>
                  <p className="truncate text-[11.5px] text-[#75648E]">{desc}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#8D7BA6]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminMorePage() {
  const navigate = useNavigate();
  const { adminSession, signOutAdmin } = useAuth();

  const moreMenuItems = [
    {
      to: '/admin/banners',
      title: 'Banner Management',
      subtitle: 'Manage storefront sliding hero banners',
      Icon: ImageIcon,
    },
    {
      to: '/admin/categories',
      title: 'Category Management',
      subtitle: 'Add, edit, reorder & manage store categories',
      Icon: Layers,
    },
    {
      to: '/admin/notifications',
      title: 'Notification Management',
      subtitle: 'Create & manage storefront header bell updates',
      Icon: Bell,
    },
    {
      to: '/admin/offers',
      title: 'Offers & Promotions',
      subtitle: 'Coupons, discounts & active schedules',
      Icon: Percent,
    },
    {
      to: '/admin/customers',
      title: 'Customers Management',
      subtitle: 'Registered customers, history & access',
      Icon: Users,
    },
    {
      to: '/admin/payments',
      title: 'Payments Management',
      subtitle: 'Order payment statuses & transactions',
      Icon: CreditCard,
    },
    {
      to: '/admin/settings',
      title: 'Website Settings',
      subtitle: 'Logo, contact, social links, SEO & policies',
      Icon: Settings,
    },
    {
      to: '/admin/security',
      title: 'Admin & Security',
      subtitle: 'Admin profile, password & activity logs',
      Icon: ShieldCheck,
    },
  ];

  async function handleLogout() {
    await signOutAdmin();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {moreMenuItems.map(({ to, title, subtitle, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#EBD8FF]/90 bg-white px-3.5 py-3.5 shadow-[0_6px_18px_-14px_rgba(106,17,203,0.2)] transition-all active:scale-[0.99] hover:border-[#6A11CB]/40"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-extrabold text-[#1E1035]">
                  {title}
                </p>
                <p className="truncate text-[11.5px] font-medium text-[#75648E]">
                  {subtitle}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#8B7AA0]" />
          </Link>
        ))}
      </div>

      {/* Compact Account Footer + Sign Out */}
      <div className="rounded-2xl border border-[#EBD8FF]/90 bg-white px-3.5 py-3 shadow-[0_6px_18px_-14px_rgba(106,17,203,0.16)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold text-[#1E1035]">
              {adminSession?.displayName || 'GiftKart Store Admin'}
            </p>
            <p className="truncate text-[11.5px] text-[#75648E]">
              {adminSession?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#FF4D8D]/30 bg-[#FFF0F6] px-3 text-xs font-bold text-[#C81E68] transition-colors hover:bg-[#FFE2EE]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
