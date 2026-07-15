import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { myOrders, cancelTicket, changeTicket } from '@/services';
import { Badge } from '@/components';
import { useAuthState } from '@/hooks';
import type { Order, CustomerProfile, Ticket } from '@/types';

interface ChangeForm {
  newSeatId: string;
  passCCCD: string;
  passName: string;
}

function ChangeTicketRow({
  ticket,
  onChanged,
}: {
  ticket: Ticket;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<ChangeForm>();

  async function onSubmit(data: ChangeForm) {
    try {
      await changeTicket(
        ticket.ticketId,
        Number(data.newSeatId),
        data.passCCCD,
        data.passName,
      );
      toast.success('Ticket updated');
      reset();
      setOpen(false);
      onChanged();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change ticket');
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-blue-600 hover:underline"
      >
        {open ? 'Cancel change' : 'Change ticket'}
      </button>
      {open && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 grid grid-cols-3 gap-2">
          <input
            {...register('newSeatId', { required: true })}
            type="number"
            placeholder="New seat ID"
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <input
            {...register('passCCCD', { required: true })}
            placeholder="New CCCD"
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <input
            {...register('passName', { required: true })}
            placeholder="New name"
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="col-span-3 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const auth = useAuthState();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  function loadOrder() {
    const customerId = (auth.user as CustomerProfile | null)?.customerId;
    if (!customerId || !orderId) return;
    myOrders(customerId)
      .then((orders: Order[]) => {
        const found = orders.find((o: Order) => o.orderId === Number(orderId));
        setOrder(found ?? null);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load order');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, auth.user]);

  async function handleCancel(seatId: number | null) {
    if (seatId === null) return;
    try {
      await cancelTicket(seatId);
      toast.success('Ticket cancelled');
      loadOrder();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel');
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Order not found.</p>
        <Link
          to="/customer/orders"
          className="text-blue-600 hover:underline mt-2 block"
        >
          ← Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/customer/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Order #{order.orderId}
        </h1>
        <Badge status={order.status} />
      </div>

      {/* Payment info */}
      {order.payment && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-800">
              ${order.payment.price.toFixed(2)} via{' '}
              {order.payment.method.name}
            </p>
            <p className="text-sm text-gray-500">
              {order.payment.method.description}
            </p>
          </div>
        </div>
      )}

      {/* Tickets */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">
          Tickets ({order.tickets.length})
        </h2>
        <div className="space-y-4">
          {order.tickets.map((ticket: Ticket) => (
            <div
              key={ticket.ticketId}
              className="flex items-start justify-between border-b border-gray-100 last:border-0 pb-4 last:pb-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-800">
                    {ticket.passName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {ticket.passCCCD}
                  </span>
                  <Badge status={ticket.status} />
                </div>
                {ticket.seat && (
                  <p className="text-sm text-gray-500 mt-1 ml-6">
                    Seat #{ticket.seat.seatId} — {ticket.seat.seatClass.name}
                  </p>
                )}
                {ticket.status === 'Open' && (
                  <div className="ml-6">
                    <ChangeTicketRow
                      ticket={ticket}
                      onChanged={loadOrder}
                    />
                  </div>
                )}
              </div>
              {ticket.status === 'Open' && ticket.seatId !== null && (
                <button
                  onClick={() => handleCancel(ticket.seatId)}
                  className="ml-4 px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
