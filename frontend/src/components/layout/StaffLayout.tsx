import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Ticket,
  Train,
  MapPin,
  Clock,
  Layers,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuthDispatch } from '@/hooks';

export function StaffLayout() {
  const { logout } = useAuthDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/staff/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 border-b border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1">
              <Shield className="h-6 w-6 text-yellow-400" />
              <span className="ml-2 text-lg font-bold text-white">
                Staff Portal
              </span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Link
                to="/staff/orders"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <ClipboardList className="h-4 w-4" />
                Orders
              </Link>
              <Link
                to="/staff/tickets"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <Ticket className="h-4 w-4" />
                Tickets
              </Link>
              <Link
                to="/staff/trips"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <Train className="h-4 w-4" />
                Trips
              </Link>
              <Link
                to="/staff/stations"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Stations
              </Link>
              <Link
                to="/staff/shifts"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <Clock className="h-4 w-4" />
                Shifts
              </Link>
              <Link
                to="/staff/seat-classes"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <Layers className="h-4 w-4" />
                Seat Classes
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-gray-700 transition-colors ml-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
