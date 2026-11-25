import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  ExternalLink,
  FileText,
  FolderTree,
  Gift,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PencilLine,
  Plug,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';
import { AdminMobileBottomNav } from '../components/admin/AdminMobileBottomNav';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ADMIN_NAV_GROUPS = [
  {
    heading: 'Overview & Orders',
    items: [
      { label: 'Dashboard', to: '/admin', end: true, icon: LayoutDashboard },
      { label: 'Orders', to: '/admin/orders', end: false, icon: ShoppingCart },
      { label: 'Customers', to: '/admin/customers', end: false, icon: Users },
      {
        label: 'Customization Requests',
        to: '/admin/customization-requests',
        end: false,
        icon: PencilLine,
      },
      { label: 'Reports', to: '/admin/reports', end: false, icon: BarChart3 },
    ],
  },
  {
    heading: 'Catalog & Merchandising',
    items: [
      { label: 'Products', to: '/admin/products', end: false, icon: Package },
      { label: 'Categories', to: '/admin/categories', end: false, icon: FolderTree },
      { label: 'Inventory', to: '/admin/inventory', end: false, icon: Boxes },
      { label: 'Gift Wrapping', to: '/admin/gift-wrapping', end: false, icon: Gift },
      { label: 'Banners', to: '/admin/banners', end: false, icon: ImageIcon },
      { label: 'Offers & Coupons', to: '/admin/coupons', end: false, icon: Tag },
      { label: 'Reviews', to: '/admin/reviews', end: false, icon: MessageSquare },
    ],
  },
  {
    heading: 'Website & System',
    items: [
      { label: 'Website Pages', to: '/admin/pages', end: false, icon: FileText },
      { label: 'Store Settings', to: '/admin/settings', end: false, icon: Settings },
      { label: 'Integrations', to: '/admin/integrations', end: false, icon: Plug },
    ],
  },
];

const ROUTE_TITLES: Record<string, { full: string; short: string }> = {
  '/admin': { full: 'Dashboard Overview', short: 'Dashboard' },
  '/admin/products': { full: 'Products Management', short: 'Products' },
  '/admin/categories': { full: 'Categories (10 Official)', short: 'Categories' },
  '/admin/orders': { full: 'Orders & Status History', short: 'Orders' },
  '/admin/customers': { full: 'Customer Records', short: 'Customers' },
  '/admin/inventory': { full: 'Inventory & Stock Control', short: 'Inventory' },
  '/admin/customization-requests': {
    full: 'Customization Requests',
    short: 'Custom Queue',
  },
  '/admin/gift-wrapping': { full: 'Gift Wrapping Settings', short: 'Gift Wrap' },
  '/admin/banners': { full: 'Homepage Hero Banners', short: 'Banners' },
  '/admin/coupons': { full: 'Offers & Coupons', short: 'Coupons' },
  '/admin/reviews': { full: 'Reviews Moderation', short: 'Reviews' },
  '/admin/reports': { full: 'Store Analytics & Reports', short: 'Reports' },
  '/admin/pages': { full: 'Website Pages & Copy', short: 'Pages CMS' },
  '/admin/settings': { full: 'Store Settings & Zones', short: 'Settings' },
  '/admin/integrations': { full: 'System Integrations', short: 'Integrations' },
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { adminSession, signOutAdmin } = useAuth();
  const { pushToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  const titleEntry = ROUTE_TITLES[location.pathname] ?? {
    full: 'Admin Workspace',
    short: 'Admin',
  };
  const isHomeRoute = location.pathname === '/admin';

  async function handleSignOut() {
    await signOutAdmin();
    pushToast({
      title: 'Signed out of Admin',
      description: 'Admin session cleared.',
      variant: 'info',
    });
    navigate('/admin/login');
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#EBD8FF] px-4">
        <Link to="/admin" className="flex items-center gap-2">
          <BrandLogo size="sm" showTagline={false} />
          <span className="text-[11px] font-bold tracking-wide text-[#6A11CB]">
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close admin sidebar"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5F4B78] hover:bg-[#F4EBFF] lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex-1 space-y-5 overflow-y-auto px-3 py-4"
      >
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="mb-1.5 px-3 text-[11px] font-bold tracking-wide text-[#8C75A8]">
              {group.heading}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex min-h-[42px] items-center gap-2.5 rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-[#EBD8FF]/75 text-[#6A11CB] shadow-xs ring-1 ring-[#6A11CB]/15'
                          : 'text-[#5F4B78] hover:bg-[#FAF6FF] hover:text-[#2A0E4D]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? 'text-[#FF4D8D]' : 'text-[#8C75A8]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-[#EBD8FF] bg-[#FAF6FF] p-4">
        <div className="rounded-xl border border-[#EBD8FF] bg-white p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-bold text-[#2A0E4D]">
              {adminSession?.displayName ?? 'Store Owner'}
            </p>
            <span className="shrink-0 text-[10px] font-bold text-[#FF4D8D]">
              OWNER
            </span>
          </div>
          <p className="mt-0.5 truncate text-[#5F4B78]">{adminSession?.email}</p>
        </div>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#5F4B78] transition-colors hover:border-[#FF4D8D]/40 hover:bg-[#FFF0F6] hover:text-[#FF4D8D]"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh overflow-x-clip bg-[#FAF6FF] text-[#2A0E4D]">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden w-[260px] shrink-0 border-r border-[#EBD8FF] bg-white lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile/Tablet Slide-Over Drawer (Optional via Menu Icon) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-[#2A0E4D]/40 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 h-full w-[276px] max-w-[82vw] border-r border-[#EBD8FF] bg-white shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Admin Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact Sticky Top App Bar (54px on Mobile, 64px on Desktop) */}
        <header className="sticky top-0 z-30 flex h-[54px] items-center justify-between gap-2 border-b border-[#EBD8FF] bg-white/95 px-3 backdrop-blur-md sm:px-5 lg:h-16 lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {isHomeRoute ? (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open admin menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#2A0E4D] active:bg-[#F4EBFF] lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            ) : (
              <Link
                to="/admin"
                aria-label="Back to Admin Dashboard"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#6A11CB] active:bg-[#F4EBFF] lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}

            {/* Mobile Compact Title */}
            <div className="min-w-0 lg:hidden">
              <p className="truncate font-display text-[15px] font-bold leading-tight text-[#2A0E4D]">
                {titleEntry.short}
              </p>
              <p className="truncate text-[10.5px] font-medium text-[#7B6496]">
                GiftKart Admin
              </p>
            </div>

            {/* Desktop Breadcrumb Title */}
            <div className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
              <span className="whitespace-nowrap font-semibold text-[#6A11CB]">
                GiftKart Admin
              </span>
              <span className="text-[#B89FD4]" aria-hidden="true">
                /
              </span>
              <span className="truncate font-bold text-[#2A0E4D]">
                {titleEntry.full}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs font-semibold text-[#6A11CB] md:inline">
              Jalchak · INR (₹)
            </span>
            <Link
              to="/"
              className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full bg-[#6A11CB] px-3.5 text-xs font-semibold text-white shadow-sm shadow-[#6A11CB]/20 transition-all hover:bg-[#580DAC] active:scale-[0.97] whitespace-nowrap lg:min-h-[38px] lg:px-4"
            >
              <span>Store</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* Scrollable Content with Safe Bottom Clearance for Floating Mobile Nav */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-3.5 pb-[96px] sm:px-5 sm:py-5 lg:px-6 lg:py-6 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Floating Glass Bottom Navigation + All Tools Bottom Sheet */}
      <AdminMobileBottomNav
        adminName={adminSession?.displayName}
        adminEmail={adminSession?.email}
        onSignOut={() => void handleSignOut()}
      />
    </div>
  );
}
