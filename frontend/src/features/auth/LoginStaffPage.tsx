import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Shield, Train, ClipboardList } from 'lucide-react';
import { loginStaff } from '@/services';
import { useAuthDispatch } from '@/hooks';
import { AuthLayout } from '@/components';
import type { StaffProfile } from '@/types';

const schema = z.object({
  staffId: z.string().min(1, 'id is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function LoginStaffPage() {
  const navigate = useNavigate();
  const { login } = useAuthDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const payload = await loginStaff(
        data.staffId,
        data.email,
        data.password,
      );
      login({
        token: payload.token,
        role: 'staff',
        user: payload.user as StaffProfile,
      });
      toast.success('Welcome, staff member!');
      navigate('/staff/orders', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    }
  }

  return (
    <AuthLayout
      badge="Operations access"
      title="Control booking workflows with confidence"
      description="Sign in to manage orders, tickets, schedules, stations, and support from a focused operations workspace."
      icon={<Shield className="h-6 w-6" />}
      accentLabel="Staff portal"
      accentTone="staff"
      points={[
        'Operational tools for orders, tickets, and route data',
        'Fast access to seat classes, shifts, and station management',
        'Designed for quick scanability in busy environments',
      ]}
      footer={
        <p className="text-center text-sm text-slate-600">
          <Link to="/login" className="font-semibold text-amber-700 hover:text-amber-800">
            Back to customer login
          </Link>
        </p>
      }
    >
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-amber-300 ring-1 ring-slate-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="card-heading text-2xl">Staff Login</h2>
          <p className="card-subtitle mt-2">Operations portal access</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Staff ID
            </label>
            <input
              {...register('staffId')}
              type="text"
              className="input-modern"
              placeholder="staff@railway.com"
            />
            {errors.staffId && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.staffId.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="input-modern"
              placeholder="staff@railway.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              className="input-modern"
              placeholder="********"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary w-full bg-slate-950 hover:bg-slate-800"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <ClipboardList className="mb-2 h-4 w-4 text-amber-600" />
            Live queues
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Train className="mb-2 h-4 w-4 text-amber-600" />
            Route control
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
