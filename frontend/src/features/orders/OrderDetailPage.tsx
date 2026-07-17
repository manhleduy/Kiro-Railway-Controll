import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, User, Sparkles } from 'lucide-react';
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
    <div className="mt-3 space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-semibold text-sky-700 hover:text-sky-800"
      >
        {open ? 'Cancel change' : 'Change ticket'}
      </button>
      {open && (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2 sm:grid-cols-3">
          <input
            {...register('newSeatId', { required: true })}
            type="number"
            placeholder="New seat ID"
            className="input-modern"
          />
          <input
            {...register('passCCCD', { required: true })}
            placeholder="New CCCD"
            className="input-modern"
          />
          <input
            {...register('passName', { required: true })}
            placeholder="New name"
            className="input-modern"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary sm:col-span-3"
          >
            {isSubmitting ? 'Saving...' : 'Save changes'}
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
      <div className="space-y-4">
        <div className="surface-card h-28 animate-pulse" />
        <div className="surface-card h-48 animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="surface-card py-16 text-center text-slate-500">
        <p>Order not found.</p>
        <Link
          to="/customer/orders"
          className="mt-3 inline-flex items-center font-semibold text-sky-700 hover:text-sky-800"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/customer/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="surface-card overflow-hidden p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="hero-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Order summary
            </span>
            <h1 className="hero-title mt-4">Order #{order.orderId}</h1>
            <p className="hero-copy mt-2">
              Review payment details and manage passenger tickets from a single view.
            </p>
          </div>
          <Badge status={order.status} />
        </div>
      </div>

      {order.payment && (
        <div className="surface-card flex items-start gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              ${order.payment.price.toFixed(2)} via {order.payment.method.name}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {order.payment.method.description}
            </p>
          </div>
        </div>
      )}

      <div className="surface-card p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="card-heading">Tickets ({order.tickets.length})</h2>
          <p className="card-subtitle">Passenger management and seat control</p>
        </div>

        <div className="space-y-4">
          {order.tickets.map((ticket: Ticket) => (
            <div
              key={ticket.ticketId}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {ticket.passName}
                    </span>
                    <span className="text-sm text-slate-500">
                      {ticket.passCCCD}
                    </span>
                    <Badge status={ticket.status} />
                  </div>
                  {ticket.seat && (
                    <p className="mt-2 text-sm text-slate-500">
                      Seat #{ticket.seat.seatId} - {ticket.seat.seatClass.name}
                    </p>
                  )}
                  {ticket.status === 'Open' && (
                    <ChangeTicketRow ticket={ticket} onChanged={loadOrder} />
                  )}
                </div>

                {ticket.status === 'Open' && ticket.seatId !== null && (
                  <button
                    onClick={() => handleCancel(ticket.seatId)}
                    className="button-secondary border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
