import type { Seat } from '@/types';

interface SeatGridProps {
  seats: Seat[];
  selectedIds: number[];
  onSelect: (seatId: number) => void;
}

const seatStatusStyles: Record<'Available' | 'Booked' | 'Unavailable', string> = {
  Available:
    'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer shadow-sm',
  Booked: 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed',
  Unavailable: 'bg-rose-50 border-rose-200 text-rose-400 cursor-not-allowed',
};

export function SeatGrid({ seats, selectedIds, onSelect }: SeatGridProps) {
  
  const grouped = seats.reduce<Record<string, Seat[]>>((acc, seat) => {
    const key = seat.seatClass.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(seat);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([className, classSeats]) => (
        <div
          key={className}
          className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-800">
                {className}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ${classSeats[0].seatClass.price.toFixed(2)} / seat
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Select available seats in this class
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {classSeats.filter((s) => s.status === 'Available').length} available
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {classSeats.map((seat) => {
              const isSelected = selectedIds.includes(seat.seatId);
              const isAvailable = seat.status === 'Available';

              return (
                <button
                  key={seat.seatId}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => isAvailable && onSelect(seat.seatId)}
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-2xl border-2 text-xs font-semibold transition-all duration-200',
                    isSelected
                      ? 'border-sky-600 bg-sky-500 text-white shadow-lg shadow-sky-500/25 scale-105'
                      : seatStatusStyles[seat.status],
                  ].join(' ')}
                  title={`Seat ${seat.seatId} - ${seat.status}`}
                >
                  {seat.seatId}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded bg-white border-2 border-emerald-300" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded bg-sky-500 border-2 border-sky-600" />
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded bg-slate-200 border-2 border-slate-300" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded bg-rose-50 border-2 border-rose-200" />
          Unavailable
        </span>
      </div>
    </div>
  );
}
