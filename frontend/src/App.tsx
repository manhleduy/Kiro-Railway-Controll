import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerGuard, StaffGuard } from '@/guards';
import { CustomerLayout, StaffLayout } from '@/components/layout';
import { LoginCustomerPage, LoginStaffPage, RegisterPage } from '@/features/auth';
import { TripsListPage, TripDetailPage, StaffTripsPage } from '@/features/trips';
import {
  OrdersListPage,
  OrderDetailPage,
  CreateOrderPage,
  StaffOrdersPage,
} from '@/features/orders';
import { TicketsPage } from '@/features/tickets';
import { StationsPage } from '@/features/stations';
import { ShiftsPage } from '@/features/shifts';
import { SeatClassesPage } from '@/features/seatClasses';
import { FeedbackPage } from '@/features/feedback';
import { CustomerProfilePage } from '@/features/profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginCustomerPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/staff/login" element={<LoginStaffPage />} />

        {/* Customer protected routes */}
        <Route element={<CustomerGuard />}>
          <Route element={<CustomerLayout />}>
            <Route path="/customer/trips" element={<TripsListPage />} />
            <Route path="/customer/trips/:tripId" element={<TripDetailPage />} />
            <Route
              path="/customer/trips/:tripId/order"
              element={<CreateOrderPage />}
            />
            <Route path="/customer/orders" element={<OrdersListPage />} />
            <Route
              path="/customer/orders/:orderId"
              element={<OrderDetailPage />}
            />
            <Route path="/customer/feedback" element={<FeedbackPage />} />
            <Route path="/customer/profile" element={<CustomerProfilePage />} />
          </Route>
        </Route>

        {/* Staff protected routes */}
        <Route element={<StaffGuard />}>
          <Route element={<StaffLayout />}>
            <Route path="/staff/orders" element={<StaffOrdersPage />} />
            <Route path="/staff/tickets" element={<TicketsPage />} />
            <Route path="/staff/trips" element={<StaffTripsPage />} />
            <Route path="/staff/stations" element={<StationsPage />} />
            <Route path="/staff/shifts" element={<ShiftsPage />} />
            <Route path="/staff/seat-classes" element={<SeatClassesPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
