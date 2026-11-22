import { NavLink } from 'react-router-dom';
import { Gift, Heart, Home, LayoutGrid, User } from 'lucide-react';

export function MobileBottomNav() {
  const navItems = [
    { label: 'Home', to: '/', end: true, Icon: Home },
    { label: 'Categories', to: '/categories', end: false, Icon: LayoutGrid },
    { label: 'Customize', to: '/customize', end: false, Icon: Gift },
    { label: 'Wishlist', to: '/wishlist', end: false, Icon: Heart },
    { label: 'Account', to: '/account', end: false, Icon: User },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl border-t border-[#EFE3FF] bg-white/96 px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_-6px_rgba(106,17,203,0.12)] backdrop-blur-xl lg:hidden"
    >
      <div className="grid grid-cols-5 items-center gap-1">
        {navItems.map(({ label, to, end, Icon }) => (
          <NavLink key={to} to={to} end={end} className="block">
            {({ isActive }) => (
              <span
                className={`flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10.5px] transition-colors ${
                  isActive
                    ? 'bg-[#F3E5FF] font-bold text-[#6A11CB]'
                    : 'font-medium text-[#2B0B4E]'
                }`}
              >
                <Icon
                  className={`h-[19px] w-[19px] ${
                    isActive
                      ? 'stroke-[2.2] text-[#6A11CB]'
                      : 'stroke-[1.8] text-[#2B0B4E]'
                  }`}
                />
                <span className="truncate leading-tight">{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
