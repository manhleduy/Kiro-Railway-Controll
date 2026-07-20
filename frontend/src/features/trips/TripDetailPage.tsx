import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Train, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTrip } from '@/services';
import { SeatGrid } from '@/components';
import type { Trip } from '@/types';
import { useListenSocket } from '@/hooks';
import { store, updateOrderTicket } from '@/store';
import socket from '@/services/socket.service';
export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const ticketId = searchParams.get('ticketId');
  const pickerMode = Boolean(ticketId);

  
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
    if (pickerMode) {
      setSelectedIds([seatId]);
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId],
    );
  }

  function handleBook() {
    if (pickerMode) {
      if (!ticketId) return;
      if (selectedIds.length !== 1) {
        toast.error('Please select one seat');
        return;
      }

      store.dispatch(
        updateOrderTicket(ticketId, {
          tripId: Number(tripId),
          seatId: selectedIds[0],
        }),
      );
      toast.success('Ticket updated');
      navigate('/customer/orders/new');
      return;
    }

    if (selectedIds.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }
    navigate(`/customer/orders/new?tripId=${tripId}&seats=${selectedIds.join(',')}`);
  }

  useListenSocket(socket, "seatStatusChange",
      (data: {seatId: number, oldStatus: string, newStatus: string})=>{
        setTrip((prev:any) => {
        return {
          ...prev,
          seats: prev?.seats.map((item:any)=>item.seatId ===data.seatId ?{...item,status: data.newStatus}:item)
        }});
      }
    )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="surface-card h-28 animate-pulse" />
        <div className="surface-card h-64 animate-pulse" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="surface-card py-16 text-center text-slate-500">
        <p>Trip not found.</p>
        <Link
          to="/customer/trips"
          className="mt-3 inline-flex items-center font-semibold text-sky-700 hover:text-sky-800"
        >
          Back to trips
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/customer/trips"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to trips
      </Link>

      <div className="surface-card overflow-hidden p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="hero-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Trip details
            </span>
            <h1 className="hero-title mt-4 flex items-center gap-3">
              <Train className="h-7 w-7 text-sky-600" />
              {trip.track}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              Arrival: {new Date(trip.arrivalDate).toLocaleString()}
            </div>
            {pickerMode && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Select one seat for ticket <span className="font-semibold">{ticketId}</span>,
                then confirm to return to the order builder.
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Seats available
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {trip.seats.filter((s) => s.status === 'Available').length}
            </p>
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="card-heading text-lg">Select Seats</h2>
            <p className="card-subtitle mt-1">
              Click available seats to build your booking.
            </p>
          </div>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {selectedIds.length} selected
          </span>
        </div>
        <SeatGrid
          seats={trip.seats}
          selectedIds={selectedIds}
          onSelect={handleSelect}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-slate-800">
            {pickerMode
              ? `Seat ${selectedIds[0]} selected`
              : `${selectedIds.length} seat${selectedIds.length > 1 ? 's' : ''} selected`}
          </p>
          <button onClick={handleBook} className="button-primary">
            {pickerMode ? 'Use selected seat' : 'Book Selected Seats'}
          </button>
        </div>
      )}
    </div>
  );
}
