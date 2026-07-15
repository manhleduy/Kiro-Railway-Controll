import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getStations,
  createStation,
  updateStation,
  deleteStation,
} from '@/services';
import { StationGraph } from '@/components';
import type { Station } from '@/types';

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

export function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

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

  async function onCreate(data: CreateForm) {
    const ids = data.nextStationIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await createStation(data.stationId, data.name, data.location, ids);
      toast.success('Station created');
      resetCreate();
      setShowCreate(false);
      loadStations();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    }
  }

  function startEdit(station: Station) {
    setEditingId(station.stationId);
    resetEdit({
      name: station.name,
      location: station.location,
      nextStationIds: station.nextStations.map((s) => s.stationId).join(', '),
    });
  }

  async function onEdit(data: EditForm) {
    if (!editingId) return;
    const ids = data.nextStationIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await updateStation(editingId, data.name, data.location, ids);
      toast.success('Station updated');
      setEditingId(null);
      loadStations();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function onDelete(stationId: string) {
    if (!confirm(`Delete station ${stationId}?`)) return;
    try {
      await deleteStation(stationId);
      toast.success('Station deleted');
      loadStations();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          Stations
        </h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? 'Cancel' : 'Add Station'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">New Station</h2>
          <form onSubmit={submitCreate(onCreate)} className="grid grid-cols-2 gap-3">
            <input
              {...regCreate('stationId', { required: true })}
              placeholder="Station ID (e.g. HN)"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              {...regCreate('name', { required: true })}
              placeholder="Station Name"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              {...regCreate('location', { required: true })}
              placeholder="Location"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              {...regCreate('nextStationIds')}
              placeholder="Next station IDs (comma separated)"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={createSubmitting}
              className="col-span-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
            >
              {createSubmitting ? 'Creating…' : 'Create Station'}
            </button>
          </form>
        </div>
      )}

      {/* Graph */}
      {!loading && stations.length > 0 && (
        <div className="mb-6">
          <StationGraph stations={stations} />
        </div>
      )}

      {/* Station list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {stations.map((station) =>
            editingId === station.stationId ? (
              <div
                key={station.stationId}
                className="bg-white rounded-xl border border-blue-300 p-4"
              >
                <form onSubmit={submitEdit(onEdit)} className="grid grid-cols-2 gap-2">
                  <input
                    {...regEdit('name', { required: true })}
                    placeholder="Name"
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    {...regEdit('location', { required: true })}
                    placeholder="Location"
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    {...regEdit('nextStationIds')}
                    placeholder="Next IDs (comma separated)"
                    className="col-span-2 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="col-span-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div
                key={station.stationId}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-2">
                    {station.stationId}
                  </span>
                  <span className="font-medium text-gray-800">{station.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    — {station.location}
                  </span>
                  {station.nextStations.length > 0 && (
                    <span className="text-xs text-gray-400 ml-2">
                      → {station.nextStations.map((s) => s.stationId).join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(station)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(station.stationId)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
