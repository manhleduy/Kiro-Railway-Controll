import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Calendar } from 'lucide-react';
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
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-20"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <ShoppingBag className="h-6 w-6 text-blue-600" />
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No orders yet.</p>
          <Link
            to="/customer/trips"
            className="text-blue-600 hover:underline mt-2 block text-sm"
          >
            Browse trips →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.orderId}
              to={`/customer/orders/${order.orderId}`}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800">
                    Order #{order.orderId}
                  </span>
                  <Badge status={order.status} />
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span>{order.tickets.length} ticket(s)</span>
                  {order.payment && (
                    <span className="font-medium text-gray-700">
                      ${order.payment.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
