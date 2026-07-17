import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Ticket,
  Train,
  MapPin,
  Clock,
  Layers,
  LogOut,
  Shield,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useAuthDispatch } from '@/hooks';

const navItems = [
  { to: '/staff/orders', label: 'Orders', icon: ClipboardList },
  { to: '/staff/tickets', label: 'Tickets', icon: Ticket },
  { to: '/staff/trips', label: 'Trips', icon: Train },
  { to: '/staff/stations', label: 'Stations', icon: MapPin },
  { to: '/staff/shifts', label: 'Shifts', icon: Clock },
  { to: '/staff/seat-classes', label: 'Seat Classes', icon: Layers },
  { to: '/staff/chat', label: 'Help', icon: Bot },
] as const;

export function StaffLayout() {
  const { logout } = useAuthDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/staff/login', { replace: true });
  }

  return (
    <div className="app-shell text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
      >
        <div className="absolute left-[-7rem] top-10 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl animate-float" />
        <div className="absolute right-[-6rem] top-24 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl animate-float-delayed" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950/80 to-transparent" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-2xl shadow-[0_16px_50px_rgba(2,6,23,0.35)]">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/staff/orders" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-white">
                  Staff Portal
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-amber-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Operations
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage tickets, stations, shifts, and booking workflows
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `nav-chip ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                      : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="nav-chip border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15"
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
