import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Train, Search, Calendar, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTrips } from '@/services';
import type { Trip, Seat } from '@/types';

export function TripsListPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState('');
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setLoading(true);
    getTrips(trackFilter || undefined)
      .then(setTrips)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load trips';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [trackFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setTrackFilter(inputValue.trim());
  }

  function getAvailableCount(trip: Trip) {
    return trip.seats.filter((s: Seat) => s.status === 'Available').length;
  }

  function getSeatClassSummary(trip: Trip) {
    const map: Record<string, number> = {};
    trip.seats
      .filter((s: Seat) => s.status === 'Available')
      .forEach((s: Seat) => {
        map[s.seatClass.name] = (map[s.seatClass.name] ?? 0) + 1;
      });
    return Object.entries(map);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Train className="h-6 w-6 text-blue-600" />
          Available Trips
        </h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Filter by track…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
        {trackFilter && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              setTrackFilter('');
            }}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Train className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No trips found{trackFilter ? ` for "${trackFilter}"` : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <Link
              key={trip.tripId}
              to={`/customer/trips/${trip.tripId}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {trip.track}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(trip.arrivalDate).toLocaleDateString()}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0 mt-0.5" />
              </div>

              <div className="mt-4 space-y-1">
                {getSeatClassSummary(trip).map(([cls, count]) => (
                  <div
                    key={cls}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600">{cls}</span>
                    <span className="font-medium text-green-600">
                      {count} available
                    </span>
                  </div>
                ))}
                {getSeatClassSummary(trip).length === 0 && (
                  <p className="text-sm text-red-500">Fully booked</p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                {getAvailableCount(trip)} / {trip.seats.length} seats available
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
