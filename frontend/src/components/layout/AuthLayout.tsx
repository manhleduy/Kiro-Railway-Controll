import type { ReactNode } from 'react';

interface AuthLayoutProps {
  badge: string;
  title: string;
  description: string;
  icon: ReactNode;
  accentLabel: string;
  accentTone: 'customer' | 'staff';
  points: string[];
  footer?: ReactNode;
  children: ReactNode;
}

const themeStyles = {
  customer: {
    glow: 'bg-sky-400/18',
    badge: 'border-sky-200 bg-sky-50/90 text-sky-700',
    icon: 'bg-slate-900 text-white',
    accent: 'text-sky-700',
  },
  staff: {
    glow: 'bg-amber-400/14',
    badge: 'border-amber-200 bg-amber-50/90 text-amber-700',
    icon: 'bg-slate-950 text-amber-300',
    accent: 'text-amber-700',
  },
} as const;

export function AuthLayout({
  badge,
  title,
  description,
  icon,
  accentLabel,
  accentTone,
  points,
  footer,
  children,
}: AuthLayoutProps) {
  const theme = themeStyles[accentTone];

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10 text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className={`absolute left-[-6rem] top-16 h-80 w-80 rounded-full ${theme.glow} blur-3xl animate-float`} />
        <div className="absolute right-[-6rem] top-[-4rem] h-96 w-96 rounded-full bg-indigo-300/14 blur-3xl animate-float-delayed" />
      </div>

      <div className="surface-card relative z-10 grid w-full max-w-5xl overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 px-8 py-8 text-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.99))]" />
          <div className="relative">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${theme.badge}`}>
              {badge}
            </div>
            <div className={`mt-6 flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-sm ${theme.icon}`}>
              {icon}
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
              {description}
            </p>

            <div className="mt-8 space-y-3">
              {points.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${theme.glow}`} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              {accentLabel}
            </p>
            <p className={`mt-2 text-sm font-medium ${theme.accent}`}>
              Clean rail operations, fewer clicks, clearer status
            </p>
          </div>
        </aside>

        <section className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="lg:hidden">
            <div className={`hero-kicker ${theme.badge}`}>
              {badge}
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>

          <div className="mt-6">
            {children}
          </div>

          {footer ? (
            <div className="mt-6 border-t border-slate-200/80 pt-5">
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
