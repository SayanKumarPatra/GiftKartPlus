import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
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

const ROUTE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard Overview',
  '/admin/products': 'Products Management',
  '/admin/categories': 'Categories & Subcategories (15 Official)',
  '/admin/orders': 'Demo Orders & Status History',
  '/admin/customers': 'Customer Records (Demo)',
  '/admin/inventory': 'Inventory & Stock Control',
  '/admin/customization-requests': 'Customization Requests Queue',
  '/admin/gift-wrapping': 'Gift Wrapping Settings',
  '/admin/banners': 'Homepage Hero Banners',
  '/admin/coupons': 'Offers & Coupons',
  '/admin/reviews': 'Reviews Moderation (Sample)',
  '/admin/reports': 'Store Analytics & Reports',
  '/admin/pages': 'Website Pages & Asset Manifest',
  '/admin/settings': 'Store Settings & Delivery Zones',
  '/admin/integrations': 'Future Integrations Readiness',
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { adminSession, signOutAdmin } = useAuth();
  const { pushToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentTitle = ROUTE_TITLES[location.pathname] ?? 'Admin Workspace';

  async function handleSignOut() {
    await signOutAdmin();
    pushToast({
      title: 'Signed out of Demo Admin',
      description: 'Local browser demo session cleared.',
      variant: 'info',
    });
    navigate('/admin/login');
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#EBD8FF] px-4">
        <Link to="/admin" className="flex items-center gap-2">
          <BrandLogo size="sm" showTagline={false} />
          <span className="rounded-lg bg-[#F4EBFF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6A11CB]">
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close admin sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#5F4B78] hover:bg-[#F4EBFF] lg:hidden"
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
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-[#8C75A8]">
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
                      `flex min-h-[38px] items-center gap-2.5 rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap ${
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
              {adminSession?.displayName ?? 'Store Admin'}
            </p>
            <span className="shrink-0 rounded-md bg-[#FFF0F6] px-1.5 py-0.5 text-[10px] font-bold text-[#FF4D8D]">
              DEMO
            </span>
          </div>
          <p className="mt-0.5 truncate text-[#5F4B78]">{adminSession?.email}</p>
          <p className="mt-1.5 text-[11px] leading-snug text-[#8C75A8]">
            Single Admin · LocalStorage Demo Auth
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-semibold text-[#5F4B78] transition-colors hover:border-[#FF4D8D]/40 hover:bg-[#FFF0F6] hover:text-[#FF4D8D]"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out Demo Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FAF6FF] text-[#2A0E4D]">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden w-[264px] shrink-0 border-r border-[#EBD8FF] bg-white lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile/Tablet Slide-Over Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#2A0E4D]/35 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 h-full w-[264px] border-r border-[#EBD8FF] bg-white shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Admin Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#EBD8FF] bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin navigation"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#2A0E4D] hover:bg-[#F4EBFF] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="whitespace-nowrap font-semibold text-[#6A11CB]">
                GiftKart Admin
              </span>
              <span className="text-[#B89FD4]" aria-hidden="true">
                /
              </span>
              <span className="truncate font-bold text-[#2A0E4D]">
                {currentTitle}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <span className="hidden rounded-full border border-[#EBD8FF] bg-[#FAF6FF] px-3 py-1 text-xs font-semibold text-[#6A11CB] sm:inline-flex">
              Jalchak · INR (₹)
            </span>
            <Link
              to="/"
              className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full bg-[#6A11CB] px-4 text-xs font-semibold text-white shadow-sm shadow-[#6A11CB]/20 transition-all hover:bg-[#580DAC] whitespace-nowrap"
            >
              <span>View Storefront</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
