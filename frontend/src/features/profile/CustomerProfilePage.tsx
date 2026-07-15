import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Lock, Star, ShoppingBag, CreditCard, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { updateCustomer, changePassword, getCustomerStats } from '@/services';
import { useAuthState, useAuthDispatch } from '@/hooks';
import { Badge } from '@/components';
import type { CustomerProfile, OrderStatus } from '@/types';
import type { CustomerStats } from '@/services/customers.service';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface ProfileForm {
  fullname: string;
  phone: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function CustomerProfilePage() {
  const auth = useAuthState();
  const { login } = useAuthDispatch();
  const customer = auth.user as CustomerProfile | null;
  const [editMode, setEditMode] = useState(false);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (!customer) return;
    setStatsLoading(true);
    getCustomerStats(customer.customerId, selectedYear)
      .then(setStats)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load stats');
      })
      .finally(() => setStatsLoading(false));
  }, [customer?.customerId, selectedYear]);

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    formState: { isSubmitting: profileSubmitting },
    reset: resetProfile,
  } = useForm<ProfileForm>({
    defaultValues: {
      fullname: customer?.fullname ?? '',
      phone: customer?.phone ?? '',
    },
  });

  const {
    register: regPwd,
    handleSubmit: submitPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting },
    reset: resetPwd,
    watch,
  } = useForm<PasswordForm>();

  async function onProfileSubmit(data: ProfileForm) {
    if (!customer) return;
    try {
      const updated = await updateCustomer(customer.customerId, data.fullname, data.phone);
      login({ token: auth.token!, role: 'customer', user: updated });
      toast.success('Profile updated');
      setEditMode(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function onPasswordSubmit(data: PasswordForm) {
    if (!customer) return;
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await changePassword(customer.customerId, data.currentPassword, data.newPassword);
      toast.success('Password changed');
      resetPwd();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    }
  }

  if (!customer) return null;

  // Build chart data — ensure all 12 months are present
  const chartData = MONTH_NAMES.map((name, i) => {
    const entry = stats?.monthlyActivity.find((m) => m.month === i + 1);
    return {
      month: name,
      Orders: entry?.orderCount ?? 0,
      Tickets: entry?.ticketCount ?? 0,
    };
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <User className="h-6 w-6 text-blue-600" />
        My Profile
      </h1>

      {/* ── Stats blocks ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <ShoppingBag className="h-4 w-4" />
            Total Orders
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statsLoading ? '—' : (stats?.totalOrders ?? 0)}
          </p>
        </div>

        {/* Latest order */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <TrendingUp className="h-4 w-4" />
            Latest Order
          </div>
          {statsLoading ? (
            <p className="text-gray-400 text-sm">—</p>
          ) : stats?.latestOrder ? (
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-gray-800">
                #{stats.latestOrder.orderId}
              </p>
              <Badge status={stats.latestOrder.status as OrderStatus} />
            </div>
          ) : (
            <p className="text-gray-400 text-sm">None</p>
          )}
        </div>

        {/* Average payment */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <CreditCard className="h-4 w-4" />
            Avg. Payment
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statsLoading
              ? '—'
              : stats
              ? `$${stats.avgPayment.toFixed(2)}`
              : '$0.00'}
          </p>
        </div>

        {/* Loyalty */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <Star className="h-4 w-4" />
            Loyalty
          </div>
          <p className="text-lg font-bold text-gray-900">
            {statsLoading ? '—' : `Rank ${stats?.rank ?? customer.rank}`}
          </p>
          <p className="text-xs text-gray-500">
            {statsLoading ? '' : `${stats?.point ?? customer.point} pts`}
          </p>
        </div>
      </div>

      {/* ── Activity chart ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Monthly Activity</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {statsLoading ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Orders" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Tickets" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Profile card ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Account Info</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {!editMode ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Full Name</p>
              <p className="font-medium text-gray-800">{customer.fullname}</p>
            </div>
            <div>
              <p className="text-gray-400">Email</p>
              <p className="font-medium text-gray-800">{customer.email}</p>
            </div>
            <div>
              <p className="text-gray-400">Phone</p>
              <p className="font-medium text-gray-800">{customer.phone}</p>
            </div>
            <div>
              <p className="text-gray-400">Customer ID</p>
              <p className="font-medium text-gray-800">{customer.customerId}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submitProfile(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                {...regProfile('fullname', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                {...regProfile('phone', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={profileSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
              >
                {profileSubmitting ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  resetProfile({ fullname: customer.fullname, phone: customer.phone });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Change password ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4" />
          Change Password
        </h2>
        <form onSubmit={submitPwd(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              {...regPwd('currentPassword', { required: 'Required' })}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {pwdErrors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">{pwdErrors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              {...regPwd('newPassword', {
                required: 'Required',
                minLength: { value: 8, message: 'Min 8 characters' },
              })}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {pwdErrors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{pwdErrors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              {...regPwd('confirmPassword', {
                required: 'Required',
                validate: (v) => v === watch('newPassword') || 'Passwords do not match',
              })}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {pwdErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{pwdErrors.confirmPassword.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={pwdSubmitting}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400"
          >
            {pwdSubmitting ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
