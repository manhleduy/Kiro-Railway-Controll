import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  useForm,
  type UseFormHandleSubmit,
  type UseFormRegister,
} from 'react-hook-form';
import {
  ArrowRight,
  Check,
  Edit2,
  MapPin,
  Plus,
  Route as RouteIcon,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createStation,
  deleteStation,
  getStations,
  updateStation,
} from '@/services';
import { StationGraph } from '@/components';
import type { Station } from '@/types';
import {
  CENTRAL_STATION_ID,
  describeRoute,
  findStationMatch,
  planRoute,
  searchStationMatches,
  type StationRouteResult,
} from './station-routing';

interface CreateForm {
  stationId: string;
  name: string;
  location: string;
  nextStationIds: string;
}

interface EditForm {
  name: string;
  location: string;
  nextStationIds: string;
}

interface StationNetworkPageProps {
  showManagement: boolean;
  title: string;
  subtitle: string;
}

function StationRouteCard({
  selectedTarget,
  route,
  routeMessage,
}: {
  selectedTarget: Station | null;
  route: StationRouteResult | null;
  routeMessage: string;
}) {
  if (!selectedTarget) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
        Search for a station to see the route from {CENTRAL_STATION_ID}.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-amber-200">
            <RouteIcon className="h-3.5 w-3.5" />
            Route result
          </span>
          <h3 className="text-2xl font-semibold tracking-tight">
            {selectedTarget.name}
          </h3>
          <p className="max-w-2xl text-sm text-slate-300">
            {selectedTarget.stationId} - {selectedTarget.location}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Mode</p>
          <p className="mt-1 text-lg font-semibold">
            {route
              ? route.isSameStation
                ? 'Already here'
                : route.isDirect
                  ? 'One trip'
                  : 'Multiple trips'
              : 'Unreachable'}
          </p>
          <p className="text-xs text-slate-400">
            {route ? `${route.hops} hop${route.hops === 1 ? '' : 's'}` : 'No route found'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_0.85fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <MapPin className="h-4 w-4 text-amber-300" />
            Route overview
          </div>
          <p className="mt-2 text-sm text-slate-300">{routeMessage}</p>
          <div className="mt-4 space-y-3">
            {route?.path.length ? (
              route.path.map((station, index) => (
                <div key={station.stationId}>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/15 text-sm font-semibold text-amber-200">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">{station.name}</p>
                      <p className="text-xs text-slate-400">
                        {station.stationId} - {station.location}
                      </p>
                    </div>
                    {index < route.path.length - 1 && (
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                Try another station or check whether the graph has a connection from
                {` ${CENTRAL_STATION_ID}.`}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Current hub
            </p>
            <p className="mt-2 text-lg font-semibold">{CENTRAL_STATION_ID}</p>
            <p className="text-sm text-slate-400">Managed station at the center of the graph.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Route guidance
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {route
                ? describeRoute(route)
                : 'No connected path was found from VN1000 to the selected station.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StationManagementSection({
  stations,
  loading,
  showManagement,
  editingId,
  setEditingId,
  showCreate,
  setShowCreate,
  regCreate,
  submitCreate,
  createSubmitting,
  regEdit,
  submitEdit,
  editSubmitting,
  onCreate,
  onEdit,
  onDelete,
  startEdit,
}: {
  stations: Station[];
  loading: boolean;
  showManagement: boolean;
  editingId: string | null;
  setEditingId: (value: string | null) => void;
  showCreate: boolean;
  setShowCreate: (value: boolean | ((current: boolean) => boolean)) => void;
  regCreate: UseFormRegister<CreateForm>;
  submitCreate: UseFormHandleSubmit<CreateForm>;
  createSubmitting: boolean;
  regEdit: UseFormRegister<EditForm>;
  submitEdit: UseFormHandleSubmit<EditForm>;
  editSubmitting: boolean;
  onCreate: (data: CreateForm) => Promise<void>;
  onEdit: (data: EditForm) => Promise<void>;
  onDelete: (stationId: string) => Promise<void>;
  startEdit: (station: Station) => void;
}) {
  if (!showManagement) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
            Staff tools
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Station management</h2>
        </div>
        <button
          onClick={() => setShowCreate((current) => !current)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? 'Cancel' : 'Add station'}
        </button>
      </div>

      {showCreate && (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            New station
          </h3>
          <form
            onSubmit={submitCreate(onCreate)}
            className="mt-4 grid gap-3 lg:grid-cols-2"
          >
            <input
              {...regCreate('stationId', { required: true })}
              placeholder="Station ID (e.g. HN01)"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
            <input
              {...regCreate('name', { required: true })}
              placeholder="Station name"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
            <input
              {...regCreate('location', { required: true })}
              placeholder="Location"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
            <input
              {...regCreate('nextStationIds')}
              placeholder="Next station IDs, comma separated"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
            <button
              type="submit"
              disabled={createSubmitting}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 lg:col-span-2"
            >
              {createSubmitting ? 'Creating...' : 'Create station'}
            </button>
          </form>
        </div>
      )}

      <div className="mt-5 space-y-2">
        {loading ? (
          <div className="grid gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : (
          stations.map((station) =>
            editingId === station.stationId ? (
              <div
                key={station.stationId}
                className="rounded-3xl border border-amber-200 bg-amber-50 p-4"
              >
                <form onSubmit={submitEdit(onEdit)} className="grid gap-3 lg:grid-cols-2">
                  <input
                    {...regEdit('name', { required: true })}
                    placeholder="Station name"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                  <input
                    {...regEdit('location', { required: true })}
                    placeholder="Location"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                  <input
                    {...regEdit('nextStationIds')}
                    placeholder="Next station IDs, comma separated"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 lg:col-span-2"
                  />
                  <div className="flex flex-wrap gap-2 lg:col-span-2">
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div
                key={station.stationId}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {station.stationId}
                    </span>
                    <span className="font-medium text-slate-900">{station.name}</span>
                    <span className="text-sm text-slate-500">- {station.location}</span>
                  </div>
                  {station.nextStations.length > 0 && (
                    <p className="mt-2 text-xs text-slate-400">
                      Next stations: {station.nextStations.map((next) => next.stationId).join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(station)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(station.stationId)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </section>
  );
}

function StationNetworkPage({
  showManagement,
  title,
  subtitle,
}: StationNetworkPageProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<Station | null>(null);
  const [routeResult, setRouteResult] = useState<StationRouteResult | null>(null);
  const [routeMessage, setRouteMessage] = useState(
    `Search for a station to see the path from ${CENTRAL_STATION_ID}.`,
  );

  const {
    register: regCreate,
    handleSubmit: submitCreate,
    reset: resetCreate,
    formState: { isSubmitting: createSubmitting },
  } = useForm<CreateForm>();

  const {
    register: regEdit,
    handleSubmit: submitEdit,
    reset: resetEdit,
    formState: { isSubmitting: editSubmitting },
  } = useForm<EditForm>();

  const centerStation = useMemo(
    () => stations.find((station) => station.stationId === CENTRAL_STATION_ID) ?? null,
    [stations],
  );
  const searchMatches = useMemo(
    () => searchStationMatches(stations, searchTerm),
    [stations, searchTerm],
  );
  const highlightedStationIds = useMemo(
    () => routeResult?.path.map((station) => station.stationId) ?? [],
    [routeResult],
  );

  function loadStations() {
    getStations()
      .then(setStations)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load stations');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStations();
  }, []);

  function runRouteSearch(station: Station) {
    setSelectedTarget(station);
    const route = planRoute(stations, CENTRAL_STATION_ID, station.stationId);
    if (!route) {
      setRouteResult(null);
      setRouteMessage(
        `No connected route from ${CENTRAL_STATION_ID} to ${station.stationId}.`,
      );
      return;
    }

    setRouteResult(route);
    setRouteMessage(describeRoute(route));
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = findStationMatch(stations, searchTerm);
    if (!target) {
      toast.error('No matching station was found');
      setSelectedTarget(null);
      setRouteResult(null);
      setRouteMessage(`Search for a station to see the path from ${CENTRAL_STATION_ID}.`);
      return;
    }

    runRouteSearch(target);
  }

  async function onCreate(data: CreateForm) {
    const ids = data.nextStationIds
      .split(',')
      .map((stationId) => stationId.trim())
      .filter(Boolean);

    try {
      await createStation(data.stationId, data.name, data.location, ids);
      toast.success('Station created');
      resetCreate();
      setShowCreate(false);
      loadStations();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create station');
    }
  }

  function startEdit(station: Station) {
    setEditingId(station.stationId);
    resetEdit({
      name: station.name,
      location: station.location,
      nextStationIds: station.nextStations.map((next) => next.stationId).join(', '),
    });
  }

  async function onEdit(data: EditForm) {
    if (!editingId) return;

    const ids = data.nextStationIds
      .split(',')
      .map((stationId) => stationId.trim())
      .filter(Boolean);

    try {
      await updateStation(editingId, data.name, data.location, ids);
      toast.success('Station updated');
      setEditingId(null);
      loadStations();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update station');
    }
  }

  async function onDelete(stationId: string) {
    if (!confirm(`Delete station ${stationId}?`)) return;

    try {
      await deleteStation(stationId);
      toast.success('Station deleted');
      loadStations();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete station');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              <RouteIcon className="h-3.5 w-3.5" />
              {showManagement ? 'Operations view' : 'Customer view'}
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Stations
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stations.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Hub links
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {centerStation?.nextStations.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Focus</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {routeResult ? `${routeResult.hops} hop${routeResult.hops === 1 ? '' : 's'}` : '--'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!centerStation && !loading && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Managed station {CENTRAL_STATION_ID} was not found in the station list.
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Route search</h2>
              <p className="text-sm text-slate-500">
                Search by station ID, name, or location to plan a trip from {CENTRAL_STATION_ID}.
              </p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Try HN01, Hanoi, or any station name"
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Search className="h-4 w-4" />
              Search route
            </button>
          </form>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Matching stations
            </p>
            <div className="mt-3 space-y-2">
              {searchTerm.trim().length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  Enter a query to narrow down the destination.
                </div>
              ) : searchMatches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  No matching stations were found.
                </div>
              ) : (
                searchMatches.map((station) => (
                  <button
                    key={station.stationId}
                    type="button"
                    onClick={() => {
                      setSearchTerm(station.stationId);
                      runRouteSearch(station);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{station.name}</p>
                      <p className="text-xs text-slate-500">
                        {station.stationId} - {station.location}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <StationRouteCard
          selectedTarget={selectedTarget}
          route={routeResult}
          routeMessage={routeMessage}
        />
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
              Graph
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Connected stations around {CENTRAL_STATION_ID}
            </h2>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            Highlighted path is drawn in amber
          </div>
        </div>

        <div className="mt-5">
          {!loading && stations.length > 0 ? (
            <StationGraph
              stations={stations}
              centerStationId={CENTRAL_STATION_ID}
              highlightedStationIds={highlightedStationIds}
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              Loading station graph...
            </div>
          )}
        </div>
      </section>

      <StationManagementSection
        stations={stations}
        loading={loading}
        showManagement={showManagement}
        editingId={editingId}
        setEditingId={setEditingId}
        showCreate={showCreate}
        setShowCreate={setShowCreate}
        regCreate={regCreate}
        submitCreate={submitCreate}
        createSubmitting={createSubmitting}
        regEdit={regEdit}
        submitEdit={submitEdit}
        editSubmitting={editSubmitting}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
        startEdit={startEdit}
      />
    </div>
  );
}

export function StationsPage() {
  return (
    <StationNetworkPage
      showManagement
      title="Station Network"
      subtitle="Manage connected stations, inspect the graph, and search route paths from VN1000."
    />
  );
}

export function CustomerStationsPage() {
  return (
    <StationNetworkPage
      showManagement={false}
      title="Station Network"
      subtitle="Explore the connected station graph and search routes from VN1000."
    />
  );
}
