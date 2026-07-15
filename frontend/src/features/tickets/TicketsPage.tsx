import { useEffect, useState } from 'react';
import { Ticket as TicketIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTickets } from '@/services';
import { Badge } from '@/components';
import type { Ticket, TicketStatus } from '@/types';

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');

  function loadTickets() {
    setLoading(true);
    getTickets(
      orderIdFilter ? Number(orderIdFilter) : undefined,
      statusFilter || undefined,
    )
      .then(setTickets)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load tickets');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <TicketIcon className="h-6 w-6 text-blue-600" />
        Tickets
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="number"
          value={orderIdFilter}
          onChange={(e) => setOrderIdFilter(e.target.value)}
          placeholder="Filter by Order ID"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="Canceled">Canceled</option>
          <option value="Resolved">Resolved</option>
        </select>
        <button
          onClick={loadTickets}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Apply
        </button>
        <button
          onClick={() => {
            setOrderIdFilter('');
            setStatusFilter('');
          }}
          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 h-12 animate-pulse"
            />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <TicketIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No tickets found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  ID
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Passenger
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  CCCD
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Order
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Seat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <tr key={ticket.ticketId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    #{ticket.ticketId}
                  </td>
                  <td className="px-4 py-3">{ticket.passName}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {ticket.passCCCD}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">#{ticket.orderId}</td>
                  <td className="px-4 py-3">
                    {ticket.seat ? (
                      <span>
                        #{ticket.seat.seatId}{' '}
                        <span className="text-gray-400">
                          ({ticket.seat.seatClass.name})
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
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
