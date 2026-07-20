import { useState, useEffect, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Train, Search, Calendar, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTrips } from '@/services';
import type { Trip, Seat } from '@/types';

export function TripsListPage() {
  const [searchParams] = useSearchParams();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState('');
  const [inputValue, setInputValue] = useState('');
  const ticketId = searchParams.get('ticketId');

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

  function handleSearch(e: FormEvent) {
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
    <div className="space-y-6">
      <div className="surface-card flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="hero-kicker">
            <Train className="h-3.5 w-3.5" />
            Live departures
          </span>
          <h1 className="hero-title mt-4 flex items-center gap-3">
            <Train className="h-7 w-7 text-sky-600" />
            Available Trips
          </h1>
          <p className="hero-copy mt-2">
            Explore routes, compare available seat classes, and move quickly from browsing to booking.
          </p>
          {ticketId && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Pick a trip for ticket <span className="font-semibold">{ticketId}</span>.
              Open any route to choose the seat next.
              <div className="mt-2">
                <Link
                  to="/customer/orders/new"
                  className="font-semibold text-amber-800 underline-offset-2 hover:underline"
                >
                  Cancel and return to order
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Routes
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {trips.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Search
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">Track</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 sm:col-span-1">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Mode
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              Real time
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Filter by track..."
            className="input-modern pl-11"
          />
        </div>
        <button type="submit" className="button-primary sm:min-w-32">
          Search
        </button>
        {trackFilter && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              setTrackFilter('');
            }}
            className="button-secondary sm:min-w-24"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-card animate-pulse p-5">
              <div className="mb-3 h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="surface-card py-16 text-center text-slate-500">
          <Train className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>No trips found{trackFilter ? ` for "${trackFilter}"` : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Link
              key={trip.tripId}
              to={`/customer/trips/${trip.tripId}${ticketId ? `?ticketId=${ticketId}` : ''}`}
              className="surface-card group p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-slate-900">
                    {trip.track}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(trip.arrivalDate).toLocaleDateString()}
                  </div>
                </div>
                <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-sky-500" />
              </div>

              <div className="mt-4 space-y-1">
                {getSeatClassSummary(trip).map(([cls, count]) => (
                  <div key={cls} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{cls}</span>
                    <span className="font-medium text-emerald-600">
                      {count} available
                    </span>
                  </div>
                ))}
                {getSeatClassSummary(trip).length === 0 && (
                  <p className="text-sm text-rose-500">Fully booked</p>
                )}
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                {getAvailableCount(trip)} / {trip.seats.length} seats available
              </div>
              {ticketId && (
                <div className="mt-3 rounded-2xl bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                  Select this trip for ticket {ticketId}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
