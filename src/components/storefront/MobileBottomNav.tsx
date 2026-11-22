import { NavLink } from 'react-router-dom';
import { Grid2X2, Home, Sparkles, Store, User } from 'lucide-react';

export function MobileBottomNav() {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
      isActive ? 'text-[#6A11CB]' : 'text-[#6E5B85]'
    }`;

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-[64px] items-center justify-around border-t border-[#EBD8FF] bg-white/96 px-1 shadow-[0_-4px_20px_rgba(106,17,203,0.08)] backdrop-blur-xl lg:hidden"
    >
      <NavLink to="/" end className={tabClass}>
        {({ isActive }) => (
          <>
            <Home className={`h-5 w-5 ${isActive ? 'text-[#FF4D8D]' : ''}`} />
            <span>Home</span>
          </>
        )}
      </NavLink>

      <NavLink to="/shop" className={tabClass}>
        {({ isActive }) => (
          <>
            <Store className={`h-5 w-5 ${isActive ? 'text-[#FF4D8D]' : ''}`} />
            <span>Shop</span>
          </>
        )}
      </NavLink>

      <NavLink to="/customize" className={tabClass}>
        {({ isActive }) => (
          <>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                isActive ? 'bg-[#FF4D8D] text-white' : 'bg-[#FFF0F6] text-[#FF4D8D]'
              }`}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <span>Customize</span>
          </>
        )}
      </NavLink>

      <NavLink to="/categories" className={tabClass}>
        {({ isActive }) => (
          <>
            <Grid2X2 className={`h-5 w-5 ${isActive ? 'text-[#FF4D8D]' : ''}`} />
            <span>Categories</span>
          </>
        )}
      </NavLink>

      <NavLink to="/account" className={tabClass}>
        {({ isActive }) => (
          <>
            <User className={`h-5 w-5 ${isActive ? 'text-[#FF4D8D]' : ''}`} />
            <span>Account</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
