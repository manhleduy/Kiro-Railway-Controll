import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock3, ShieldCheck, Ticket, Train } from 'lucide-react';
import { loginCustomer } from '@/services';
import { useAuthDispatch } from '@/hooks';
import { AuthLayout } from '@/components';
import type { CustomerProfile } from '@/types';

const schema = z.object({
  customerId: z.string().min(1, 'user id is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function LoginCustomerPage() {
  const navigate = useNavigate();
  const { login } = useAuthDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const payload = await loginCustomer(
        data.customerId,
        data.email,
        data.password,
      );
      login({
        token: payload.token,
        role: 'customer',
        user: payload.user as CustomerProfile,
      });
      toast.success('Welcome back!');
      navigate('/customer/trips', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    }
  }

  return (
    <AuthLayout
      badge="Customer access"
      title="Travel smarter with a cleaner booking flow"
      description="Sign in to browse trips, choose seats, manage orders, and keep track of your journey in one place."
      icon={<Train className="h-6 w-6" />}
      accentLabel="Passenger experience"
      accentTone="customer"
      points={[
        'Live trip browsing with seat availability at a glance',
        'Fast booking and order tracking from any device',
        'Self-service help, feedback, and profile management',
      ]}
      footer={
        <div className="space-y-2 text-center text-sm text-slate-600">
          <p>
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-sky-700 hover:text-sky-800"
            >
              Register
            </Link>
          </p>
          <p>
            <Link
              to="/forgot-password"
              className="font-semibold text-sky-700 hover:text-sky-800"
            >
              Forgot your password?
            </Link>
          </p>
          <p>
            Staff?{' '}
            <Link
              to="/staff/login"
              className="font-semibold text-slate-700 hover:text-slate-900"
            >
              Staff login
            </Link>
          </p>
        </div>
      }
    >
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="card-heading text-2xl">Customer Login</h2>
          <p className="card-subtitle mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Customer ID
            </label>
            <input
              {...register('customerId')}
              type="text"
              className="input-modern"
              placeholder="your-id"
            />
            {errors.customerId && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.customerId.message}
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
              placeholder="you@example.com"
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

          <button type="submit" disabled={isSubmitting} className="button-primary w-full">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-500 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Ticket className="mb-2 h-4 w-4 text-sky-600" />
            Seat selection
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Clock3 className="mb-2 h-4 w-4 text-sky-600" />
            Order tracking
          </div>
          <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:col-span-1">
            <ShieldCheck className="mb-2 h-4 w-4 text-sky-600" />
            Secure access
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
