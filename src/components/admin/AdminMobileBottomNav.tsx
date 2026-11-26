import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Package, ShoppingBag } from 'lucide-react';
import { useOrders } from '../../hooks/useStoreData';

const MORE_SUBPATHS = [
  '/admin/more',
  '/admin/banners',
  '/admin/categories',
  '/admin/notifications',
  '/admin/offers',
  '/admin/customers',
  '/admin/payments',
  '/admin/settings',
  '/admin/security',
];

export function AdminMobileBottomNav() {
  const { pathname } = useLocation();
  const { data: orders } = useOrders();

  // Never render bottom navigation on the Admin Login page
  if (pathname === '/admin/login') {
    return null;
  }

  const pendingOrdersCount = orders.filter(
    (o) => o.fulfillmentStatus === 'New' || o.fulfillmentStatus === 'Demo Placed'
  ).length;

  const isHomeActive = pathname === '/admin' || pathname === '/admin/';
  const isProductsActive = pathname.startsWith('/admin/products');
  const isOrdersActive = pathname.startsWith('/admin/orders');
  const isMoreActive = MORE_SUBPATHS.some((p) => pathname.startsWith(p));

  const tabs = [
    {
      to: '/admin',
      label: 'Home',
      Icon: Home,
      active: isHomeActive,
      badge: 0,
    },
    {
      to: '/admin/products',
      label: 'Products',
      Icon: Package,
      active: isProductsActive,
      badge: 0,
    },
    {
      to: '/admin/orders',
      label: 'Orders',
      Icon: ShoppingBag,
      active: isOrdersActive,
      badge: pendingOrdersCount,
    },
    {
      to: '/admin/more',
      label: 'More',
      Icon: LayoutGrid,
      active: isMoreActive,
      badge: 0,
    },
  ];

  return (
    <nav
      aria-label="Admin bottom navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EBD8FF]/90 bg-white/95 shadow-[0_-8px_24px_-12px_rgba(106,17,203,0.2)] backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 4px)' }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 py-1.5">
        {tabs.map(({ to, label, Icon, active, badge }) => (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition-all active:scale-95 ${
              active
                ? 'bg-gradient-to-b from-[#F8EEFF] to-[#F3E5FF]/60 text-[#6A11CB]'
                : 'text-[#5A4870] hover:text-[#6A11CB]'
            }`}
          >
            <span className="relative flex h-6 w-6 items-center justify-center">
              <Icon
                className={`h-[20px] w-[20px] ${
                  active ? 'stroke-[2.3] text-[#6A11CB]' : 'stroke-[1.9]'
                }`}
              />
              {badge > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 text-[9.5px] font-extrabold leading-none text-white shadow-xs">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            <span
              className={`text-[10.5px] leading-none ${
                active ? 'font-extrabold text-[#6A11CB]' : 'font-semibold text-[#5A4870]'
              }`}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
