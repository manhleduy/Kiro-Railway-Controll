import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { myOrders } from '@/services';
import { Badge } from '@/components';
import { useAuthState } from '@/hooks';
import { store, setOrders } from '@/store';
import type { Order, CustomerProfile } from '@/types';

export function OrdersListPage() {
  const auth = useAuthState();
  const [orders, setLocalOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customerId = (auth.user as CustomerProfile | null)?.customerId;

    if (!customerId) return;
    myOrders(customerId)
      .then((data: Order[]) => {
        setLocalOrders(data);
        store.dispatch(setOrders(data));
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : 'Failed to load orders';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [auth.user]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card h-20 animate-pulse p-5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface-card flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="hero-kicker">
            <ShoppingBag className="h-3.5 w-3.5" />
            Booking history
          </span>
          <h1 className="hero-title mt-4 flex items-center gap-3">
            <ShoppingBag className="h-7 w-7 text-sky-600" />
            My Orders
          </h1>
          <p className="hero-copy mt-2">
            Review payment status, ticket counts, and booking details from a single clean dashboard.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Total orders
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {orders.length}
            </p>
          </div>
          <Link
            to="/customer/orders/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New order
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="surface-card py-16 text-center text-slate-500">
          <ShoppingBag className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>No orders yet.</p>
          <Link
            to="/customer/orders/new"
            className="mt-3 inline-flex items-center font-semibold text-sky-700 hover:text-sky-800"
          >
            Start a new order
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.orderId}
              to={`/customer/orders/${order.orderId}`}
              className="surface-card group flex items-center justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.12)]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-slate-800">
                    Order #{order.orderId}
                  </span>
                  <Badge status={order.status} />
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span>{order.tickets.length} ticket(s)</span>
                  {order.payment && (
                    <span className="font-medium text-slate-700">
                      ${order.payment.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-sky-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
