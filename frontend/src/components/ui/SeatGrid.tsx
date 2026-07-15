import type { Seat } from '@/types';

interface SeatGridProps {
  seats: Seat[];
  selectedIds: number[];
  onSelect: (seatId: number) => void;
}

const seatStatusStyles: Record<'Available' | 'Booked' | 'Unavailable', string> = {
  Available:
    'bg-white border-green-400 text-green-700 hover:bg-green-50 cursor-pointer',
  Booked: 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed',
  Unavailable: 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed',
};

export function SeatGrid({ seats, selectedIds, onSelect }: SeatGridProps) {
  // Group seats by seat class
  const grouped = seats.reduce<Record<string, Seat[]>>((acc, seat) => {
    const key = seat.seatClass.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(seat);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([className, classSeats]) => (
        <div key={className}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">
              {className}
              <span className="ml-2 text-sm font-normal text-gray-500">
                — ${classSeats[0].seatClass.price.toFixed(2)} / seat
              </span>
            </h3>
            <span className="text-xs text-gray-500">
              {
                classSeats.filter((s) => s.status === 'Available').length
              }{' '}
              available
            </span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {classSeats.map((seat) => {
              const isSelected = selectedIds.includes(seat.seatId);
              const isAvailable = seat.status === 'Available';
              return (
                <button
                  key={seat.seatId}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => isAvailable && onSelect(seat.seatId)}
                  className={`
                    w-10 h-10 rounded border-2 text-xs font-medium transition-all
                    ${isSelected ? 'bg-blue-500 border-blue-600 text-white' : seatStatusStyles[seat.status]}
                  `}
                  title={`Seat ${seat.seatId} — ${seat.status}`}
                >
                  {seat.seatId}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 pt-2 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-white border-2 border-green-400" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-blue-500 border-2 border-blue-600" />
          Selected
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-gray-200 border-2 border-gray-300" />
          Booked
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-red-100 border-2 border-red-300" />
          Unavailable
        </span>
      </div>
    </div>
  );
}
