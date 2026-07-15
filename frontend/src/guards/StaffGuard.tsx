import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from '@/hooks';

export function StaffGuard() {
  const auth = useAuthState();
  if (!auth.token || auth.role !== 'staff') {
    return <Navigate to="/staff/login" replace />;
  }
  return <Outlet />;
}
