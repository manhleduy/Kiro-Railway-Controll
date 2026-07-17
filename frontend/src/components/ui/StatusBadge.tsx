import type { OrderStatus, TicketStatus } from '@/types';

type BadgeStatus = OrderStatus | TicketStatus;

const statusStyles: Record<BadgeStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Denied: 'bg-rose-50 text-rose-700 border-rose-200',
  Open: 'bg-sky-50 text-sky-700 border-sky-200',
  Canceled: 'bg-slate-100 text-slate-600 border-slate-200',
  Resolved: 'bg-teal-50 text-teal-700 border-teal-200',
};

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function Badge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusStyles[status]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  );
}
