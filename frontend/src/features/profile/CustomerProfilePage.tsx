import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Lock, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateCustomer, changePassword } from '@/services';
import { useAuthState, useAuthDispatch } from '@/hooks';
import type { CustomerProfile } from '@/types';

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
      const updated = await updateCustomer(
        customer.customerId,
        data.fullname,
        data.phone,
      );
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
      await changePassword(
        customer.customerId,
        data.currentPassword,
        data.newPassword,
      );
      toast.success('Password changed');
      resetPwd();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    }
  }

  if (!customer) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <User className="h-6 w-6 text-blue-600" />
        My Profile
      </h1>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
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
          <div className="space-y-3">
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
                <p className="text-gray-400">Loyalty</p>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">
                    Rank {customer.rank} — {customer.point} pts
                  </span>
                </div>
              </div>
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
                  resetProfile({
                    fullname: customer.fullname,
                    phone: customer.phone,
                  });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change password */}
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
              <p className="mt-1 text-xs text-red-600">
                {pwdErrors.currentPassword.message}
              </p>
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
              <p className="mt-1 text-xs text-red-600">
                {pwdErrors.newPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              {...regPwd('confirmPassword', {
                required: 'Required',
                validate: (v) =>
                  v === watch('newPassword') || 'Passwords do not match',
              })}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {pwdErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {pwdErrors.confirmPassword.message}
              </p>
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
