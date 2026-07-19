import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  Train,
  MapPin,
  ShoppingBag,
  MessageSquare,
  User,
  LogOut,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useAuthDispatch } from '@/hooks';

const navItems = [
  { to: '/customer/trips', label: 'Trips', icon: Train },
  { to: '/customer/stations', label: 'Stations', icon: MapPin },
  { to: '/customer/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/customer/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/customer/chat', label: 'Help', icon: Bot },
  { to: '/customer/profile', label: 'Profile', icon: User },
] as const;

export function CustomerLayout() {
  const { logout } = useAuthDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
      >
        <div className="absolute left-[-8rem] top-8 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl animate-float" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl animate-float-delayed" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-2xl shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/customer/trips" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
              <Train className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-slate-900">
                  Railway
                </span>
                <span className="hero-kicker">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live booking
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fast reservations, clean seat selection, clear status
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `nav-chip ${isActive ? 'nav-chip-active' : 'nav-chip-inactive'}`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="nav-chip border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}
