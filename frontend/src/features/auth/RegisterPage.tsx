import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Train, ShieldCheck, Clock3 } from 'lucide-react';
import { registerCustomer } from '@/services';
import { AuthLayout } from '@/components';

const schema = z.object({
  customerId: z.string().min(1, 'id is required'),
  fullname: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(9, 'Phone must be at least 9 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await registerCustomer(
        data.customerId,
        data.fullname,
        data.email,
        data.phone,
        data.password,
      );
      toast.success('Account created! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
    }
  }

  return (
    <AuthLayout
      badge="New passenger"
      title="Create a streamlined account for every trip"
      description="Register once, then use the same account to book seats, manage orders, and get support from your profile."
      icon={<Train className="h-6 w-6" />}
      accentLabel="Faster onboarding"
      accentTone="customer"
      points={[
        'One account for booking, refunds, and ticket history',
        'Clear seat selection and order status tracking',
        'Quick password recovery and direct support access',
      ]}
      footer={
        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-sky-700 hover:text-sky-800"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="card-heading text-2xl">Create Account</h2>
          <p className="card-subtitle mt-2">Join Railway today</p>
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
              Full name
            </label>
            <input
              {...register('fullname')}
              type="text"
              className="input-modern"
              placeholder="Nguyen Van A"
            />
            {errors.fullname && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.fullname.message}
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
              Phone
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="input-modern"
              placeholder="0901234567"
            />
            {errors.phone && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.phone.message}
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
              placeholder="Min. 8 characters"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="button-primary w-full">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <ShieldCheck className="mb-2 h-4 w-4 text-sky-600" />
            Secure profile
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Clock3 className="mb-2 h-4 w-4 text-sky-600" />
            Faster check-in
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
