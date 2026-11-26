import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  CreditCard,
  ExternalLink,
  Gift,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  LogOut,
  Package,
  Percent,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminMobileBottomNav } from '../components/admin/AdminMobileBottomNav';

interface PageHeaderMeta {
  title: string;
  showBack: boolean;
  backTo: string;
}

function getHeaderMeta(pathname: string): PageHeaderMeta {
  if (pathname === '/admin' || pathname === '/admin/') {
    return { title: 'GiftKart Admin', showBack: false, backTo: '/admin' };
  }
  if (pathname.startsWith('/admin/products')) {
    return { title: 'Products', showBack: false, backTo: '/admin' };
  }
  if (pathname.startsWith('/admin/orders')) {
    return { title: 'Orders', showBack: false, backTo: '/admin' };
  }
  if (pathname.startsWith('/admin/more')) {
    return { title: 'GiftKart Admin', showBack: false, backTo: '/admin' };
  }
  if (pathname.startsWith('/admin/banners')) {
    return { title: 'Banner Management', showBack: true, backTo: '/admin/more' };
  }
  if (pathname.startsWith('/admin/categories')) {
    return { title: 'Categories', showBack: true, backTo: '/admin/more' };
  }
  if (pathname.startsWith('/admin/offers')) {
    return { title: 'Offers & Promotions', showBack: true, backTo: '/admin/more' };
  }
  if (pathname.startsWith('/admin/notifications')) {
    return { title: 'Notifications', showBack: true, backTo: '/admin/more' };
  }
  if (pathname.startsWith('/admin/customers')) {
    return { title: 'Customers', showBack: true, backTo: '/admin/more' };
  }
  if (pathname.startsWith('/admin/payments')) {
    return { title: 'Payments', showBack: true, backTo: '/admin/more' };
  }
  if (pathname.startsWith('/admin/settings')) {
    return { title: 'Website Settings', showBack: true, backTo: '/admin/more' };
  }
  if (pathname.startsWith('/admin/security')) {
    return { title: 'Admin & Security', showBack: true, backTo: '/admin/more' };
  }
  return { title: 'GiftKart Admin', showBack: false, backTo: '/admin' };
}

const DESKTOP_SIDEBAR_ITEMS = [
  { to: '/admin', label: 'Dashboard', Icon: Home, end: true },
  { to: '/admin/banners', label: 'Banner Management', Icon: ImageIcon },
  { to: '/admin/products', label: 'Products', Icon: Package },
  { to: '/admin/categories', label: 'Categories', Icon: Layers },
  { to: '/admin/orders', label: 'Orders', Icon: ShoppingBag },
  { to: '/admin/offers', label: 'Offers & Promotions', Icon: Percent },
  { to: '/admin/notifications', label: 'Notifications', Icon: Bell },
  { to: '/admin/customers', label: 'Customers', Icon: Users },
  { to: '/admin/payments', label: 'Payments', Icon: CreditCard },
  { to: '/admin/settings', label: 'Website Settings', Icon: Settings },
  { to: '/admin/security', label: 'Admin & Security', Icon: ShieldCheck },
];

export function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { adminSession, signOutAdmin } = useAuth();
  const headerMeta = getHeaderMeta(pathname);

  async function handleSignOut() {
    await signOutAdmin();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#F7F3FF] text-[#1E1035] lg:flex">
      {/* Clean Desktop Sidebar (>= 1024px) */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-[#EBD8FF] lg:bg-white">
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#5B0EB7] via-[#6A11CB] to-[#9333EA] px-4 py-4 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold leading-tight">GiftKart Admin</p>
            <p className="truncate text-[11px] text-white/80">
              {adminSession?.email ?? 'Store Management'}
            </p>
          </div>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {DESKTOP_SIDEBAR_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6A11CB] to-[#8C28EA] text-white shadow-xs'
                    : 'text-[#4A3860] hover:bg-[#F5ECFF] hover:text-[#6A11CB]'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1.5 border-t border-[#EFE3FF] p-3">
          <Link
            to="/"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5D5FA] bg-[#FAF6FF] px-3 py-2 text-xs font-bold text-[#6A11CB] transition-colors hover:bg-[#F3E8FF]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Storefront</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#FF4D8D]/30 bg-[#FFF0F6] px-3 py-2 text-xs font-bold text-[#C81E68] transition-colors hover:bg-[#FFE2EE]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Mobile-First Column */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Compact Purple Gradient Top App Bar (Matches Mockup) */}
        <header className="relative bg-gradient-to-r from-[#5B0EB7] via-[#6A11CB] to-[#9824E4] px-3.5 pb-6 pt-3 text-white lg:pb-4 lg:pt-3.5">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
            {headerMeta.showBack ? (
              <button
                type="button"
                onClick={() => navigate(headerMeta.backTo)}
                aria-label="Go back"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/12 text-white transition-colors active:scale-95 hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <Link
                to="/admin/more"
                aria-label="Admin sections menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white transition-colors active:scale-95 hover:bg-white/20 lg:hidden"
              >
                <LayoutGrid className="h-4.5 w-4.5" />
              </Link>
            )}

            <h1 className="truncate text-center text-[16px] font-extrabold tracking-tight text-white lg:text-left lg:text-[17px]">
              {headerMeta.title}
            </h1>

            <Link
              to="/"
              aria-label="Open live GiftKart store"
              title="Open live store"
              className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-white/12 px-2.5 text-[11.5px] font-bold text-white transition-colors active:scale-95 hover:bg-white/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Store</span>
            </Link>
          </div>
        </header>

        {/* Curved Sheet Content Surface */}
        <main className="relative z-10 -mt-4 flex-1 rounded-t-[24px] bg-[#F7F3FF] px-3.5 pb-24 pt-4 lg:mt-0 lg:rounded-none lg:px-6 lg:pb-8 lg:pt-5">
          <div className="mx-auto w-full max-w-3xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Exact 4-Item Fixed Mobile Bottom Navigation */}
      <AdminMobileBottomNav />
    </div>
  );
}
