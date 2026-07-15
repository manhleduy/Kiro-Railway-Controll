import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, CreditCard } from 'lucide-react';
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
        Number(data.methodId),
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

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <Link
        to={`/customer/trips/${tripId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to trip
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-blue-600" />
        Complete Your Booking
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Passenger info per seat */}
        {fields.map((field, index) => {
          const seat = seats[index];
          return (
            <div
              key={field.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h3 className="font-semibold text-gray-800 mb-4">
                Passenger {index + 1}
                {seat && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    — Seat #{seat.seatId} ({seat.seatClass.name}, $
                    {seat.seatClass.price.toFixed(2)})
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    {...register(`passengers.${index}.passName`, {
                      required: 'Name is required',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nguyen Van A"
                  />
                  {errors.passengers?.[index]?.passName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.passengers[index].passName?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CCCD / ID Number
                  </label>
                  <input
                    {...register(`passengers.${index}.passCCCD`, {
                      required: 'ID number is required',
                      minLength: { value: 9, message: 'Min 9 digits' },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="012345678912"
                  />
                  {errors.passengers?.[index]?.passCCCD && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.passengers[index].passCCCD?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Payment method */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Payment Method</h3>
          <select
            {...register('methodId', { required: 'Select a payment method' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select payment method…</option>
            {methods.map((m) => (
              <option key={m.methodId} value={m.methodId}>
                {m.name} — {m.description}
              </option>
            ))}
          </select>
          {errors.methodId && (
            <p className="mt-1 text-xs text-red-600">
              {errors.methodId.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between bg-blue-50 rounded-xl border border-blue-200 p-4">
          <p className="font-medium text-blue-800">
            Total:{' '}
            {seats
              .reduce((sum, s) => sum + s.seatClass.price, 0)
              .toFixed(2)}{' '}
            VND
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Processing…' : 'Confirm Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
