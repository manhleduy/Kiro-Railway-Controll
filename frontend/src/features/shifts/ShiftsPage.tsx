import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Clock, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getShifts, createShift, deleteShift } from '@/services';
import { useAuthState } from '@/hooks';
import type { Shift, StaffProfile } from '@/types';

interface CreateForm {
  startTime: string;
  endTime: string;
}

export function ShiftsPage() {
  const auth = useAuthState();
  const staffId = (auth.user as StaffProfile | null)?.staffId ?? '';
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateForm>();

  function loadShifts() {
    if (!staffId) return;
    getShifts(staffId)
      .then(setShifts)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load shifts');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  async function onCreate(data: CreateForm) {
    try {
      await createShift(staffId, data.startTime, data.endTime);
      toast.success('Shift created');
      reset();
      setShowCreate(false);
      loadShifts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create shift');
    }
  }

  async function onDelete(shiftId: number) {
    try {
      await deleteShift(shiftId);
      toast.success('Shift deleted');
      loadShifts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete shift');
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-600" />
          My Shifts
        </h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showCreate ? (
            <X className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {showCreate ? 'Cancel' : 'Add Shift'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">New Shift</h2>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  {...register('startTime', { required: true })}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  {...register('endTime', { required: true })}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSubmitting ? 'Creating…' : 'Create Shift'}
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
      ) : shifts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>No shifts scheduled.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Shift ID
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Start Time
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  End Time
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shifts.map((shift) => (
                <tr key={shift.shiftId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{shift.shiftId}</td>
                  <td className="px-4 py-3">{shift.startTime}</td>
                  <td className="px-4 py-3">{shift.endTime}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(shift.shiftId)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
