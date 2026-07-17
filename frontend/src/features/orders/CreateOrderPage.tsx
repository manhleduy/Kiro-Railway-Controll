import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, CreditCard, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTrip, getMethods, createOrder } from '@/services';
import { useAuthState } from '@/hooks';
import type { Method, Seat, CustomerProfile } from '@/types';

interface PassengerEntry {
  passName: string;
  passCCCD: string;
}

interface FormData {
  methodId: string;
  passengers: PassengerEntry[];
}

export function CreateOrderPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuthState();

  const seatIds = (searchParams.get('seats') ?? '')
    .split(',')
    .filter(Boolean)
    .map(Number);

  const [methods, setMethods] = useState<Method[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      methodId: '',
      passengers: seatIds.map(() => ({ passName: '', passCCCD: '' })),
    },
  });

  const { fields } = useFieldArray({ control, name: 'passengers' });

  useEffect(() => {
    if (!tripId || seatIds.length === 0) return;
    Promise.all([getMethods(), getTrip(Number(tripId))])
      .then(([ms, trip]) => {
        setMethods(ms);
        setSeats(trip.seats.filter((s: Seat) => seatIds.includes(s.seatId)));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load data';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function onSubmit(data: FormData) {
    const customerId = (auth.user as CustomerProfile | null)?.customerId;
    if (!customerId) {
      toast.error('Not authenticated');
      return;
    }
    try {
      const tickets = seatIds.map((seatId, i) => ({
        seatId,
        passName: data.passengers[i].passName,
        passCCCD: data.passengers[i].passCCCD,
      }));

      const order = await createOrder(
        customerId,
        parseInt(data.methodId),
        tickets,
      );
      toast.success('Order created successfully!');
      navigate(`/customer/orders/${order.orderId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order failed';
      toast.error(msg);
      navigate(`/customer/trips/${tripId}`);
    }
  }

  const totalPrice = seats.reduce((sum, s) => sum + s.seatClass.price, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="surface-card h-28 animate-pulse" />
        <div className="surface-card h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to={`/customer/trips/${tripId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to trip
      </Link>

      <div className="surface-card flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="hero-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Secure checkout
          </span>
          <h1 className="hero-title mt-4 flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-sky-600" />
            Complete Your Booking
          </h1>
          <p className="hero-copy mt-2">
            Confirm each passenger, choose a payment method, and finish the order in one clean step.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Total price
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {totalPrice.toFixed(2)} VND
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => {
          const seat = seats[index];

          return (
            <div
              key={field.id}
              className="surface-card p-6"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="card-heading text-lg">
                    Passenger {index + 1}
                  </h3>
                  {seat && (
                    <p className="card-subtitle mt-1">
                      Seat #{seat.seatId} - {seat.seatClass.name} - ${seat.seatClass.price.toFixed(2)}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Passenger form
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    {...register(`passengers.${index}.passName`, {
                      required: 'Name is required',
                    })}
                    className="input-modern"
                    placeholder="Nguyen Van A"
                  />
                  {errors.passengers?.[index]?.passName && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.passengers[index].passName?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    CCCD / ID Number
                  </label>
                  <input
                    {...register(`passengers.${index}.passCCCD`, {
                      required: 'ID number is required',
                      minLength: { value: 9, message: 'Min 9 digits' },
                    })}
                    className="input-modern"
                    placeholder="012345678912"
                  />
                  {errors.passengers?.[index]?.passCCCD && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.passengers[index].passCCCD?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="surface-card p-6">
          <h3 className="card-heading text-lg">Payment Method</h3>
          <p className="card-subtitle mt-1 mb-4">
            Choose how you want to pay for this booking.
          </p>
          <select
            {...register('methodId', { required: 'Select a payment method' })}
            className="input-modern"
          >
            <option value="">Select payment method...</option>
            {methods.map((m) => (
              <option key={m.methodId} value={m.methodId}>
                {m.name} - {m.description}
              </option>
            ))}
          </select>
          {errors.methodId && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.methodId.message}
            </p>
          )}
        </div>

        <div className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-slate-800">
            Total: {totalPrice.toFixed(2)} VND
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
