import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp';
import { requestPasswordReset, resetPassword } from '@/services';
import { AuthLayout } from '@/components';

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type Step = 'email' | 'otp' | 'password';

function OtpSlot({
  char,
  hasFakeCaret,
  isActive,
}: {
  char: string | null;
  hasFakeCaret: boolean;
  isActive: boolean;
}) {
  return (
    <div
      className={[
        'relative flex h-14 w-12 items-center justify-center rounded-2xl border-2 text-2xl font-semibold transition-all',
        isActive
          ? 'border-sky-500 bg-white text-slate-900 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]'
          : char
            ? 'border-slate-300 bg-white text-slate-900'
            : 'border-slate-200 bg-slate-50 text-transparent',
      ].join(' ')}
    >
      {char ?? ''}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-px animate-pulse bg-sky-500" />
        </div>
      )}
    </div>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const {
    register: regEmail,
    handleSubmit: submitEmail,
    formState: { errors: emailErrors, isSubmitting: emailSubmitting },
  } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

  const {
    register: regPwd,
    handleSubmit: submitPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  async function onEmailSubmit(data: EmailForm) {
    try {
      await requestPasswordReset(data.email);
      setEmail(data.email);
      setStep('otp');
      toast.success('Check your email for the verification code');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send code');
    }
  }

  async function onOtpComplete(value: string) {
    if (value.length < 6) return;
    setOtpError('');
    setVerifying(true);
    setOtp(value);
    setVerifying(false);
    setStep('password');
  }

  async function onPasswordSubmit(data: PasswordForm) {
    try {
      await resetPassword(email, otp, data.newPassword);
      toast.success('Password reset! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      if (
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('expired')
      ) {
        setOtp('');
        setOtpError(msg);
        setStep('otp');
      } else {
        toast.error(msg);
      }
    }
  }

  const titleMap: Record<Step, string> = {
    email: 'Forgot Password',
    otp: 'Verify your email',
    password: 'Set new password',
  };

  const descriptionMap: Record<Step, string> = {
    email: "Enter your email and we'll send you a code.",
    otp: `Enter the 6-digit code sent to ${email}.`,
    password: 'Choose a strong password for your account.',
  };

  const iconMap: Record<Step, ReactNode> = {
    email: <Mail className="h-6 w-6" />,
    otp: <KeyRound className="h-6 w-6" />,
    password: <Lock className="h-6 w-6" />,
  };

  return (
    <AuthLayout
      badge="Account recovery"
      title={titleMap[step]}
      description={descriptionMap[step]}
      icon={iconMap[step]}
      accentLabel="Secure reset"
      accentTone="customer"
      points={[
        'Verification code keeps account recovery safe',
        'You can restart the flow at any step if needed',
        'A clean, guided path reduces mistakes and retries',
      ]}
      footer={
        <p className="text-center text-sm text-slate-600">
          <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
            Back to sign in
          </Link>
        </p>
      }
    >
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="card-heading text-2xl">
            {step === 'email' && 'Account recovery'}
            {step === 'otp' && 'Verify your identity'}
            {step === 'password' && 'Choose a new password'}
          </h2>
          <p className="card-subtitle mt-2">
            {step === 'email' && 'Start by confirming the email tied to your account.'}
            {step === 'otp' && 'Use the code sent to your inbox to continue.'}
            {step === 'password' &&
              'Pick a strong password and finish the reset.'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={submitEmail(onEmailSubmit)} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  {...regEmail('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="input-modern pl-11"
                />
              </div>
              {emailErrors.email && (
                <p className="mt-1.5 text-xs text-red-600">
                  {emailErrors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={emailSubmitting}
              className="button-primary w-full"
            >
              {emailSubmitting ? 'Sending...' : 'Send verification code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <OTPInput
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={otp}
                onChange={setOtp}
                onComplete={onOtpComplete}
                disabled={verifying}
                containerClassName="flex gap-2 sm:gap-3"
                render={({ slots }) => (
                  <>
                    {slots.map((slot, i) => (
                      <OtpSlot key={i} {...slot} />
                    ))}
                  </>
                )}
              />
            </div>

            {verifying && (
              <p className="text-center text-sm text-slate-500">
                Verifying...
              </p>
            )}

            {otpError && (
              <p className="text-center text-sm text-red-600">{otpError}</p>
            )}

            <p className="text-center text-sm text-slate-500">
              Didn&apos;t receive a code?{' '}
              <button
                type="button"
                className="font-semibold text-sky-700 hover:text-sky-800"
                onClick={() => {
                  setOtp('');
                  setStep('email');
                }}
              >
                Try again
              </button>
            </p>
          </div>
        )}

        {step === 'password' && (
          <form onSubmit={submitPwd(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                New password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  {...regPwd('newPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="input-modern pl-11"
                />
              </div>
              {pwdErrors.newPassword && (
                <p className="mt-1.5 text-xs text-red-600">
                  {pwdErrors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Confirm new password
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  {...regPwd('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="input-modern pl-11"
                />
              </div>
              {pwdErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">
                  {pwdErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={pwdSubmitting}
              className="button-primary w-full"
            >
              {pwdSubmitting ? 'Saving...' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
