import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Train, Plus, Trash2, X, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTrips, createTrip, deleteTrip } from '@/services';
import type { Trip } from '@/types';

interface CreateForm {
  track: string;
  arrivalDate: string;
}

export function StaffTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateForm>();

  function loadTrips() {
    getTrips()
      .then(setTrips)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load trips');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTrips();
  }, []);

  async function onCreate(data: CreateForm) {
    try {
      await createTrip(data.track, data.arrivalDate);
      toast.success('Trip created');
      reset();
      setShowCreate(false);
      loadTrips();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trip');
    }
  }

  async function onDelete(tripId: number) {
    if (!confirm(`Delete trip #${tripId}?`)) return;
    try {
      await deleteTrip(tripId);
      toast.success('Trip deleted');
      loadTrips();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete trip');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Train className="h-6 w-6 text-blue-600" />
          Trips Management
        </h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? 'Cancel' : 'Add Trip'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">New Trip</h2>
          <form onSubmit={handleSubmit(onCreate)} className="flex gap-3 flex-wrap">
            <input
              {...register('track', { required: true })}
              placeholder="Track (e.g. Hanoi → HCMC)"
              className="flex-1 min-w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              {...register('arrivalDate', { required: true })}
              type="datetime-local"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Train className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>No trips found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <div
              key={trip.tripId}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {trip.track}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(trip.arrivalDate).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {trip.seats.length} seats total
                  </p>
                </div>
                <button
                  onClick={() => onDelete(trip.tripId)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
