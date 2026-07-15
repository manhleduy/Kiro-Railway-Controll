import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layers, Plus, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSeatClasses, createSeatClass, updateSeatClass } from '@/services';
import type { SeatClass } from '@/types';

interface CreateForm {
  name: string;
  price: string;
}

interface EditForm {
  name: string;
  price: string;
}

export function SeatClassesPage() {
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const {
    register: regCreate,
    handleSubmit: submitCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: createSubmitting },
  } = useForm<CreateForm>();

  const {
    register: regEdit,
    handleSubmit: submitEdit,
    reset: resetEdit,
    formState: { isSubmitting: editSubmitting },
  } = useForm<EditForm>();

  function loadSeatClasses() {
    getSeatClasses()
      .then(setSeatClasses)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load seat classes');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSeatClasses();
  }, []);

  async function onCreate(data: CreateForm) {
    const price = parseFloat(data.price);
    if (price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    try {
      await createSeatClass(data.name, price);
      toast.success('Seat class created');
      resetCreate();
      setShowCreate(false);
      loadSeatClasses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    }
  }

  function startEdit(sc: SeatClass) {
    setEditingId(sc.seatClassId);
    resetEdit({ name: sc.name, price: String(sc.price) });
  }

  async function onEdit(data: EditForm) {
    if (editingId === null) return;
    const price = parseFloat(data.price);
    if (price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    try {
      await updateSeatClass(editingId, data.name, price);
      toast.success('Seat class updated');
      setEditingId(null);
      loadSeatClasses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="h-6 w-6 text-blue-600" />
          Seat Classes
        </h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? 'Cancel' : 'Add Class'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">New Seat Class</h2>
          <form onSubmit={submitCreate(onCreate)} className="flex gap-3">
            <div className="flex-1">
              <input
                {...regCreate('name', { required: 'Name is required' })}
                placeholder="Class name (e.g. Economy)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {createErrors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {createErrors.name.message}
                </p>
              )}
            </div>
            <div className="w-32">
              <input
                {...regCreate('price', {
                  required: 'Required',
                  validate: (v) =>
                    parseFloat(v) > 0 || 'Price must be > 0',
                })}
                type="number"
                step="0.01"
                placeholder="Price"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {createErrors.price && (
                <p className="mt-1 text-xs text-red-600">
                  {createErrors.price.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={createSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 shrink-0"
            >
              Create
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : seatClasses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>No seat classes defined.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {seatClasses.map((sc) =>
            editingId === sc.seatClassId ? (
              <div
                key={sc.seatClassId}
                className="bg-white rounded-xl border border-blue-300 p-4"
              >
                <form onSubmit={submitEdit(onEdit)} className="flex gap-2">
                  <input
                    {...regEdit('name', { required: true })}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    {...regEdit('price', { required: true })}
                    type="number"
                    step="0.01"
                    className="w-28 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                </form>
              </div>
            ) : (
              <div
                key={sc.seatClassId}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-gray-800">{sc.name}</span>
                  <span className="ml-3 text-sm font-semibold text-blue-600">
                    ${sc.price.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => startEdit(sc)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
