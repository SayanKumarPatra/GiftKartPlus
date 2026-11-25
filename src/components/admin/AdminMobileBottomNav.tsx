import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  ExternalLink,
  FileText,
  FolderTree,
  Gift,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
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
import type { LucideIcon } from 'lucide-react';
import { useOrders, useProducts } from '../../hooks/useStoreData';

interface AdminMobileBottomNavProps {
  adminName?: string;
  adminEmail?: string;
  onSignOut: () => void;
}

interface PrimaryTab {
  id: 'dashboard' | 'orders' | 'products' | 'categories' | 'more';
  label: string;
  to?: string;
  Icon: LucideIcon;
  matches: (pathname: string) => boolean;
}

const PRIMARY_TABS: PrimaryTab[] = [
  {
    id: 'dashboard',
    label: 'Home',
    to: '/admin',
    Icon: LayoutDashboard,
    matches: (p) => p === '/admin',
  },
  {
    id: 'orders',
    label: 'Orders',
    to: '/admin/orders',
    Icon: ShoppingCart,
    matches: (p) => p === '/admin/orders',
  },
  {
    id: 'products',
    label: 'Products',
    to: '/admin/products',
    Icon: Package,
    matches: (p) => p === '/admin/products',
  },
  {
    id: 'categories',
    label: 'Category',
    to: '/admin/categories',
    Icon: FolderTree,
    matches: (p) => p === '/admin/categories',
  },
  {
    id: 'more',
    label: 'All Tools',
    Icon: LayoutGrid,
    matches: (p) =>
      p !== '/admin' &&
      p !== '/admin/orders' &&
      p !== '/admin/products' &&
      p !== '/admin/categories',
  },
];

interface ToolItem {
  label: string;
  to: string;
  icon: LucideIcon;
  accent: string;
  badge?: number;
}

export function AdminMobileBottomNav({
  adminName,
  adminEmail,
  onSignOut,
}: AdminMobileBottomNavProps) {
  const { pathname } = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: orders } = useOrders();
  const { data: products } = useProducts({ includeInactive: true });

  const pendingOrdersCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.fulfillmentStatus !== 'Delivered' &&
          o.fulfillmentStatus !== 'Cancelled'
      ).length,
    [orders]
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockCount <= 12).length,
    [products]
  );

  const customizationCount = useMemo(() => {
    let count = 0;
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.personalizationDetails?.trim() || item.customPhotoFileName) {
          count += 1;
        }
      });
    });
    return count;
  }, [orders]);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  const activeIndex = useMemo(() => {
    if (sheetOpen) return 4;
    const idx = PRIMARY_TABS.findIndex((t) => t.matches(pathname));
    return idx >= 0 ? idx : 0;
  }, [pathname, sheetOpen]);

  const toolGroups: { title: string; items: ToolItem[] }[] = [
    {
      title: 'Store & Orders',
      items: [
        {
          label: 'Dashboard',
          to: '/admin',
          icon: LayoutDashboard,
          accent: 'bg-[#F4EBFF] text-[#6A11CB]',
        },
        {
          label: 'Orders',
          to: '/admin/orders',
          icon: ShoppingCart,
          accent: 'bg-[#FFF0F6] text-[#FF4D8D]',
          badge: pendingOrdersCount || undefined,
        },
        {
          label: 'Customers',
          to: '/admin/customers',
          icon: Users,
          accent: 'bg-[#F4EBFF] text-[#6A11CB]',
        },
        {
          label: 'Custom Queue',
          to: '/admin/customization-requests',
          icon: PencilLine,
          accent: 'bg-[#FFF0F6] text-[#FF4D8D]',
          badge: customizationCount || undefined,
        },
        {
          label: 'Reports',
          to: '/admin/reports',
          icon: BarChart3,
          accent: 'bg-[#F4EBFF] text-[#6A11CB]',
        },
        {
          label: 'Reviews',
          to: '/admin/reviews',
          icon: MessageSquare,
          accent: 'bg-[#FFF0F6] text-[#FF4D8D]',
        },
      ],
    },
    {
      title: 'Catalog & Marketing',
      items: [
        {
          label: 'Products',
          to: '/admin/products',
          icon: Package,
          accent: 'bg-[#F4EBFF] text-[#6A11CB]',
        },
        {
          label: 'Categories',
          to: '/admin/categories',
          icon: FolderTree,
          accent: 'bg-[#FFF0F6] text-[#FF4D8D]',
        },
        {
          label: 'Inventory',
          to: '/admin/inventory',
          icon: Boxes,
          accent: 'bg-amber-50 text-amber-700',
          badge: lowStockCount || undefined,
        },
        {
          label: 'Banners',
          to: '/admin/banners',
          icon: ImageIcon,
          accent: 'bg-[#F4EBFF] text-[#6A11CB]',
        },
        {
          label: 'Coupons',
          to: '/admin/coupons',
          icon: Tag,
          accent: 'bg-[#FFF0F6] text-[#FF4D8D]',
        },
        {
          label: 'Gift Wrap',
          to: '/admin/gift-wrapping',
          icon: Gift,
          accent: 'bg-[#F4EBFF] text-[#6A11CB]',
        },
      ],
    },
    {
      title: 'Website & Settings',
      items: [
        {
          label: 'Pages & Copy',
          to: '/admin/pages',
          icon: FileText,
          accent: 'bg-[#F4EBFF] text-[#6A11CB]',
        },
        {
          label: 'Settings',
          to: '/admin/settings',
          icon: Settings,
          accent: 'bg-[#FFF0F6] text-[#FF4D8D]',
        },
        {
          label: 'Integrations',
          to: '/admin/integrations',
          icon: Plug,
          accent: 'bg-[#F4EBFF] text-[#6A11CB]',
        },
      ],
    },
  ];

  return (
    <>
      {/* All Tools Slide-Up Bottom Sheet */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="All Admin Tools"
        >
          <div
            className="fixed inset-0 bg-[#2A0E4D]/45 backdrop-blur-xs"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative z-10 flex max-h-[84dvh] flex-col rounded-t-[28px] border-t border-[#EBD8FF] bg-white shadow-2xl">
            <div className="mx-auto mt-2.5 h-1.5 w-11 rounded-full bg-[#E3D1FA]" />

            <div className="flex items-center justify-between border-b border-[#F3EAFF] px-4 py-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#2A0E4D]">
                  All Admin Controls
                </h2>
                <p className="text-[11px] text-[#7B6496]">
                  {adminName ?? 'Store Owner'} · {adminEmail ?? 'GiftKart Admin'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close all tools"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6EEFF] text-[#6A11CB] active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              {toolGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-2.5 text-[11px] font-bold tracking-wide text-[#8C75A8]">
                    {group.title}
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isCurrent =
                        item.to === '/admin'
                          ? pathname === '/admin'
                          : pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setSheetOpen(false)}
                          className={`relative flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2.5 text-center transition-transform active:scale-[0.97] ${
                            isCurrent
                              ? 'border-[#6A11CB] bg-[#FAF5FF] ring-1 ring-[#6A11CB]/20'
                              : 'border-[#F0E4FF] bg-white hover:bg-[#FDFBFF]'
                          }`}
                        >
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="absolute right-2 top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 text-[10px] font-bold tabular-nums text-white">
                              {item.badge}
                            </span>
                          )}
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.accent}`}
                          >
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          <span className="text-[11px] font-semibold leading-tight text-[#2A0E4D]">
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5 border-t border-[#F0E4FF] bg-[#FAF6FF] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
              <Link
                to="/"
                onClick={() => setSheetOpen(false)}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#6A11CB] px-3 text-xs font-bold text-white shadow-sm active:scale-[0.98]"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View Store</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  onSignOut();
                }}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs font-bold text-rose-600 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Frosted Glass Admin Bottom Navigation */}
      <nav
        aria-label="Admin mobile navigation"
        className="gk-liquid-glass-nav fixed inset-x-2.5 bottom-[max(0.5rem,calc(env(safe-area-inset-bottom,0px)+0.3rem))] z-40 mx-auto max-w-[436px] rounded-full p-[5px] lg:hidden"
      >
        <div className="relative grid grid-cols-5 items-center">
          <div
            aria-hidden="true"
            className="gk-mobile-nav-capsule-track pointer-events-none absolute inset-y-0 left-0 w-1/5 opacity-100"
            style={{
              transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
            }}
          >
            <div className="gk-liquid-glass-capsule h-full w-full rounded-full" />
          </div>

          {PRIMARY_TABS.map(({ id, label, to, Icon }, idx) => {
            const isActive = idx === activeIndex;
            const showOrderBadge = id === 'orders' && pendingOrdersCount > 0;

            const inner = (
              <>
                <span className="relative">
                  <Icon
                    aria-hidden="true"
                    fill={isActive ? 'rgba(106, 17, 203, 0.14)' : 'none'}
                    className={`gk-mobile-nav-icon h-[20px] w-[20px] shrink-0 ${
                      isActive
                        ? 'gk-mobile-nav-icon--active stroke-[2.2]'
                        : 'stroke-[1.85]'
                    }`}
                  />
                  {showOrderBadge && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF4D8D] px-1 text-[9px] font-bold tabular-nums text-white shadow-xs">
                      {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
                    </span>
                  )}
                </span>
                <span
                  className={`gk-mobile-nav-label whitespace-nowrap text-[10px] leading-[1.15] tracking-[-0.015em] ${
                    isActive
                      ? 'gk-mobile-nav-label--active font-bold'
                      : 'font-semibold'
                  }`}
                >
                  {label}
                </span>
              </>
            );

            if (!to) {
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSheetOpen((prev) => !prev)}
                  aria-expanded={sheetOpen}
                  className="gk-mobile-nav-item relative z-10 flex min-h-[52px] flex-col items-center justify-center gap-[3px] rounded-full px-1 py-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A11CB]/45 focus-visible:ring-inset"
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link
                key={id}
                to={to}
                onClick={() => setSheetOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className="gk-mobile-nav-item relative z-10 flex min-h-[52px] flex-col items-center justify-center gap-[3px] rounded-full px-1 py-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6A11CB]/45 focus-visible:ring-inset"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
