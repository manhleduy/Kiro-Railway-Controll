import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Route as RouteIcon,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createOrder, getMethods, getTrip } from '@/services';
import { useAuthState, useOrderDraftState } from '@/hooks';
import type { CustomerProfile, Method, Seat, Trip } from '@/types';
import {
  addOrderTicket,
  removeOrderTicket,
  replaceOrderDraft,
  resetOrderDraft,
  setOrderMethodId,
  store,
  updateOrderTicket,
} from '@/store';

function isTicketComplete(ticket: {
  tripId: number | null;
  seatId: number | null;
  passName: string;
  passCCCD: string;
}) {
  return (
    ticket.tripId !== null &&
    ticket.seatId !== null &&
    ticket.passName.trim().length > 0 &&
    ticket.passCCCD.trim().length > 0
  );
}

function ticketDisplayLabel(index: number) {
  return `Ticket ${index + 1}`;
}

export function CreateOrderPage() {
  const navigate = useNavigate();
  const { tripId: routeTripId } = useParams<{ tripId?: string }>();
  const [searchParams] = useSearchParams();
  const auth = useAuthState();
  const draft = useOrderDraftState();

  const tripIdFromQuery = searchParams.get('tripId') ?? routeTripId ?? null;
  const seatIdsFromQuery = (searchParams.get('seats') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number)
    .filter((value) => Number.isFinite(value));
  const seatIdsFromQueryKey = seatIdsFromQuery.join(',');
  const hasMeaningfulDraft = draft.tickets.some(
    (ticket) =>
      ticket.tripId !== null ||
      ticket.seatId !== null ||
      ticket.passName.trim().length > 0 ||
      ticket.passCCCD.trim().length > 0,
  );

  const [methods, setMethods] = useState<Method[]>([]);
  const [tripMap, setTripMap] = useState<Record<number, Trip>>({});
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    if (!tripIdFromQuery || seatIdsFromQuery.length === 0 || hasMeaningfulDraft) {
      return;
    }

    const tripId = Number(tripIdFromQuery);
    if (!Number.isFinite(tripId)) return;

    store.dispatch(
      replaceOrderDraft({
        tickets: seatIdsFromQuery.map((seatId) => ({
          tripId,
          seatId,
          passName: '',
          passCCCD: '',
        })),
      }),
    );
  }, [hasMeaningfulDraft, seatIdsFromQueryKey, tripIdFromQuery]);

  const selectedTripIds = useMemo(
    () =>
      [...new Set(draft.tickets.map((ticket) => ticket.tripId).filter((value): value is number => value !== null))],
    [draft.tickets],
  );
  const selectedTripKey = selectedTripIds.join(',');

  const selectedSeatIds = useMemo(
    () =>
      [...new Set(draft.tickets.map((ticket) => ticket.seatId).filter((value): value is number => value !== null))],
    [draft.tickets],
  );

  useEffect(() => {
    let active = true;

    getMethods()
      .then((loadedMethods) => {
        if (!active) return;
        setMethods(loadedMethods);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Failed to load payment methods';
        toast.error(msg);
      })
      .finally(() => {
        if (active) setLoadingMethods(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingTrips(true);

    Promise.all(selectedTripIds.map((tripId) => getTrip(tripId)))
      .then((trips) => {
        if (!active) return;
        const nextTripMap = trips.reduce<Record<number, Trip>>((acc, trip) => {
          acc[trip.tripId] = trip;
          return acc;
        }, {});
        setTripMap(nextTripMap);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Failed to load trip details';
        toast.error(msg);
      })
      .finally(() => {
        if (active) setLoadingTrips(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTripKey]);

  const totalPrice = useMemo(
    () =>
      draft.tickets.reduce((sum, ticket) => {
        if (ticket.tripId === null || ticket.seatId === null) return sum;
        const trip = tripMap[ticket.tripId];
        const seat = trip?.seats.find((item) => item.seatId === ticket.seatId);
        return sum + (seat?.seatClass.price ?? 0);
      }, 0),
    [draft.tickets, tripMap],
  );

  const incompleteTicketLabels = useMemo(
    () =>
      draft.tickets
        .map((ticket, index) => ({ ticket, label: ticketDisplayLabel(index) }))
        .filter(({ ticket }) => !isTicketComplete(ticket))
        .map(({ label }) => label),
    [draft.tickets],
  );

  function handleTripSelector(ticketId: string) {
    navigate(`/customer/trips?ticketId=${ticketId}`);
  }

  async function handleSubmit() {
    const customerId = (auth.user as CustomerProfile | null)?.customerId;
    if (!customerId) {
      toast.error('Not authenticated');
      return;
    }

    if (!draft.methodId) {
      toast.error('Please choose a payment method');
      return;
    }

    if (draft.tickets.length === 0) {
      toast.error('Please add at least one ticket');
      return;
    }

    const invalidTicketIndex = draft.tickets.findIndex((ticket) => !isTicketComplete(ticket));
    if (invalidTicketIndex !== -1) {
      toast.error(`${ticketDisplayLabel(invalidTicketIndex)} is incomplete`);
      return;
    }

    try {
      const tickets = draft.tickets.map((ticket) => ({
        seatId: ticket.seatId as number,
        passName: ticket.passName.trim(),
        passCCCD: ticket.passCCCD.trim(),
      }));

      const order = await createOrder(customerId, Number(draft.methodId), tickets);
      toast.success('Order created successfully');
      store.dispatch(resetOrderDraft());
      navigate(`/customer/orders/${order.orderId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order failed';
      toast.error(msg);
    }
  }

  function getTripSummary(ticketTripId: number | null) {
    if (ticketTripId === null) {
      return null;
    }

    const trip = tripMap[ticketTripId];
    if (!trip) return null;

    return trip;
  }

  function getSeatSummary(tripId: number | null, seatId: number | null) {
    if (tripId === null || seatId === null) {
      return null;
    }

    const trip = tripMap[tripId];
    const seat = trip?.seats.find((item: Seat) => item.seatId === seatId) ?? null;
    return seat;
  }

  if (loadingMethods || loadingTrips) {
    return (
      <div className="space-y-4">
        <div className="surface-card h-28 animate-pulse" />
        <div className="surface-card h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface-card flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="hero-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Flexible checkout
          </span>
          <h1 className="hero-title mt-4 flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-sky-600" />
            Build Your Order
          </h1>
          <p className="hero-copy mt-2">
            Add multiple tickets, choose a trip and seat for each one, and keep everything saved while you move between pages.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Tickets
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {draft.tickets.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Trips
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {selectedTripIds.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {totalPrice.toFixed(2)} VND
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/customer/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/customer/trips"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
          >
            <Search className="h-4 w-4" />
            Find trips
          </Link>
          <button
            type="button"
            onClick={() => store.dispatch(addOrderTicket())}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add ticket
          </button>
        </div>
      </div>

      {draft.tickets.length === 0 ? (
        <div className="surface-card py-16 text-center text-slate-500">
          <CreditCard className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>No tickets yet.</p>
          <button
            type="button"
            onClick={() => store.dispatch(addOrderTicket())}
            className="mt-3 inline-flex items-center font-semibold text-sky-700 hover:text-sky-800"
          >
            Add your first ticket
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {draft.tickets.map((ticket, index) => {
            const trip = getTripSummary(ticket.tripId);
            const seat = getSeatSummary(ticket.tripId, ticket.seatId);
            const routeReady = ticket.tripId !== null;

            return (
              <section key={ticket.id} className="surface-card overflow-hidden p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <span className="hero-kicker">
                      <RouteIcon className="h-3.5 w-3.5" />
                      {ticketDisplayLabel(index)}
                    </span>
                    <h2 className="hero-title mt-3 text-2xl">
                      {ticket.passName.trim() || 'Passenger details'}
                    </h2>
                    <p className="hero-copy mt-2">
                      Each ticket can use its own trip, seat, and passenger information.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTripSelector(ticket.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                    >
                      <Search className="h-4 w-4" />
                      {routeReady ? 'Change trip / seat' : 'Choose trip / seat'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        store.dispatch(
                          updateOrderTicket(ticket.id, {
                            tripId: null,
                            seatId: null,
                          }),
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Clear trip
                    </button>
                    <button
                      type="button"
                      onClick={() => store.dispatch(removeOrderTicket(ticket.id))}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                          Trip
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">
                          {trip ? trip.track : 'No trip selected'}
                        </h3>
                      </div>
                      {trip && (
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                          Trip #{trip.tripId}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
                      {trip ? (
                        <div className="space-y-2 text-sm text-slate-600">
                          <p>
                            <span className="font-medium text-slate-900">Arrival:</span>{' '}
                            {new Date(trip.arrivalDate).toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">Available seats:</span>{' '}
                            {trip.seats.filter((item) => item.status === 'Available').length}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">Selected seat:</span>{' '}
                            {seat
                              ? `Seat ${seat.seatId} - ${seat.seatClass.name} - ${seat.seatClass.price.toFixed(2)} VND`
                              : 'Choose a seat on the trip page'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Use the trip picker to search routes and choose a seat for this ticket.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Passenger name
                        </label>
                        <input
                          value={ticket.passName}
                          onChange={(event) =>
                            store.dispatch(
                              updateOrderTicket(ticket.id, { passName: event.target.value }),
                            )
                          }
                          className="input-modern"
                          placeholder="Nguyen Van A"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          CCCD / ID number
                        </label>
                        <input
                          value={ticket.passCCCD}
                          onChange={(event) =>
                            store.dispatch(
                              updateOrderTicket(ticket.id, { passCCCD: event.target.value }),
                            )
                          }
                          className="input-modern"
                          placeholder="012345678912"
                        />
                      </div>

                      <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">Ticket status</p>
                        <p className="mt-1">
                          {isTicketComplete(ticket)
                            ? 'Ready to checkout'
                            : 'Complete trip, seat, and passenger details to continue'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="surface-card p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="card-heading text-lg">Payment Method</h3>
            <p className="card-subtitle mt-1">
              Choose how you want to pay for the whole order.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Incomplete
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {incompleteTicketLabels.length}
            </p>
          </div>
        </div>

        <select
          value={draft.methodId}
          onChange={(event) => store.dispatch(setOrderMethodId(event.target.value))}
          className="input-modern"
        >
          <option value="">Select payment method...</option>
          {methods.map((method) => (
            <option key={method.methodId} value={method.methodId}>
              {method.name} - {method.description}
            </option>
          ))}
        </select>
      </div>

      <div className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-slate-800">
            Total: {totalPrice.toFixed(2)} VND
          </p>
          <p className="text-sm text-slate-500">
            {draft.tickets.length} ticket(s), {selectedSeatIds.length} seat(s) chosen
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={draft.tickets.length === 0}
          className="button-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Confirm Order
        </button>
      </div>
    </div>
  );
}
