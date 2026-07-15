import { useEffect, useState } from 'react';
import { ClipboardList, User, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { pendingOrders, approveOrder } from '@/services';
import { Badge } from '@/components';
import { useAuthState } from '@/hooks';
import type { Order, StaffProfile, Ticket } from '@/types';

export function StaffOrdersPage() {
  const auth = useAuthState();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function loadOrders() {
    pendingOrders()
      .then(setOrders)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load orders');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleApprove(orderId: number, approve: boolean) {
    const staffId = (auth.user as StaffProfile | null)?.staffId;
    if (!staffId) return;
    try {
      await approveOrder(orderId, approve ? 'Confirmed' : 'Denied', staffId);
      toast.success(`Order #${orderId} ${approve ? 'confirmed' : 'denied'}`);
      loadOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-28"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <ClipboardList className="h-6 w-6 text-yellow-500" />
        Pending Orders
        {orders.length > 0 && (
          <span className="ml-2 bg-yellow-100 text-yellow-700 text-sm px-2 py-0.5 rounded-full font-normal">
            {orders.length}
          </span>
        )}
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No pending orders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      Order #{order.orderId}
                    </span>
                    <Badge status={order.status} />
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                    <User className="h-3.5 w-3.5" />
                    {order.customer.fullname} — {order.customer.email}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(order.orderId, true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirm
                  </button>
                  <button
                    onClick={() => handleApprove(order.orderId, false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Deny
                  </button>
                </div>
              </div>

              {/* Tickets summary */}
              <div className="mt-4 space-y-2">
                {order.tickets.map((ticket: Ticket) => (
                  <div
                    key={ticket.ticketId}
                    className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <Badge status={ticket.status} />
                    <span className="font-medium">{ticket.passName}</span>
                    <span className="text-gray-500">{ticket.passCCCD}</span>
                    {ticket.seat && (
                      <span className="text-gray-400">
                        Seat #{ticket.seat.seatId} ({ticket.seat.seatClass.name})
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Payment */}
              {order.payment && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard className="h-4 w-4" />
                  <span>
                    ${order.payment.price.toFixed(2)} via{' '}
                    {order.payment.method.name}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
