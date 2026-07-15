import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Train } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTrip } from '@/services';
import { SeatGrid } from '@/components';
import type { Trip } from '@/types';

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (!tripId) return;
    getTrip(Number(tripId))
      .then(setTrip)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load trip';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [tripId]);

  function handleSelect(seatId: number) {
    setSelectedIds((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId],
    );
  }

  function handleBook() {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }
    navigate(
      `/customer/trips/${tripId}/order?seats=${selectedIds.join(',')}`,
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Trip not found.</p>
        <Link to="/customer/trips" className="text-blue-600 hover:underline mt-2 block">
          ← Back to trips
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/customer/trips"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to trips
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Train className="h-6 w-6 text-blue-600" />
              {trip.track}
            </h1>
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Arrival: {new Date(trip.arrivalDate).toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {trip.seats.filter((s) => s.status === 'Available').length} seats
              available
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Select Seats
        </h2>
        <SeatGrid
          seats={trip.seats}
          selectedIds={selectedIds}
          onSelect={handleSelect}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-center justify-between">
          <p className="text-blue-800 font-medium">
            {selectedIds.length} seat{selectedIds.length > 1 ? 's' : ''} selected
          </p>
          <button
            onClick={handleBook}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Book Selected Seats →
          </button>
        </div>
      )}
    </div>
  );
}
