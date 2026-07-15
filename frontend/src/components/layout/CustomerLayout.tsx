import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Train, ShoppingBag, MessageSquare, User, LogOut } from 'lucide-react';
import { useAuthDispatch } from '@/hooks';

export function CustomerLayout() {
  const { logout } = useAuthDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1">
              <Train className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-lg font-bold text-gray-900">
                Railway
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/customer/trips"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Train className="h-4 w-4" />
                Trips
              </Link>
              <Link
                to="/customer/orders"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                My Orders
              </Link>
              <Link
                to="/customer/feedback"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Feedback
              </Link>
              <Link
                to="/customer/profile"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ml-2"
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
