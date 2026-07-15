import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from '@/hooks';

export function CustomerGuard() {
  const auth = useAuthState();
  if (!auth.token || auth.role !== 'customer') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
