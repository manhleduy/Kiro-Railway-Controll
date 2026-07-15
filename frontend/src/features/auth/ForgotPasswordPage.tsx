import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Train, Mail, KeyRound, Lock } from 'lucide-react';
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp';
import { requestPasswordReset, resetPassword } from '@/services';

// ─── Step schemas ────────────────────────────────────────────────────────────

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

// ─── OTP slot component (matches input-otp docs pattern) ─────────────────────

function OtpSlot({ char, hasFakeCaret, isActive }: {
  char: string | null;
  hasFakeCaret: boolean;
  isActive: boolean;
}) {
  return (
    <div
      className={[
        'relative w-12 h-14 flex items-center justify-center',
        'text-2xl font-bold rounded-xl border-2 transition-all',
        isActive
          ? 'border-blue-500 ring-2 ring-blue-200 bg-white'
          : char
          ? 'border-gray-300 bg-white text-gray-900'
          : 'border-gray-200 bg-gray-50 text-transparent',
      ].join(' ')}
    >
      {char ?? ''}
      {hasFakeCaret && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-px h-6 bg-blue-500 animate-pulse" />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Step = 'email' | 'otp' | 'password';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // ── Step 1 form ──────────────────────────────────────────────────────────
  const {
    register: regEmail,
    handleSubmit: submitEmail,
    formState: { errors: emailErrors, isSubmitting: emailSubmitting },
  } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

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

  // ── Step 2 OTP verify ────────────────────────────────────────────────────
  async function onOtpComplete(value: string) {
    if (value.length < 6) return;
    setOtpError('');
    setVerifying(true);
    // We don't verify the OTP in isolation — we hold it for step 3.
    // Just advance so the user can set their new password.
    setOtp(value);
    setVerifying(false);
    setStep('password');
  }

  // ── Step 3 form ──────────────────────────────────────────────────────────
  const {
    register: regPwd,
    handleSubmit: submitPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  async function onPasswordSubmit(data: PasswordForm) {
    try {
      await resetPassword(email, otp, data.newPassword);
      toast.success('Password reset! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      // If the OTP was wrong / expired, send back to OTP step
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setOtp('');
        setOtpError(msg);
        setStep('otp');
      } else {
        toast.error(msg);
      }
    }
  }

  // ─── Layout wrapper ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
            <Train className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify your email'}
            {step === 'password' && 'Set new password'}
          </h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            {step === 'email' && "Enter your email and we'll send you a code"}
            {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
            {step === 'password' && 'Choose a strong password for your account'}
          </p>
        </div>

        {/* ── Step 1: Email ── */}
        {step === 'email' && (
          <form onSubmit={submitEmail(onEmailSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...regEmail('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {emailErrors.email && (
                <p className="mt-1 text-xs text-red-600">{emailErrors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={emailSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
            >
              {emailSubmitting ? 'Sending…' : 'Send verification code'}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP ── */}
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
                containerClassName="flex gap-3"
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
              <p className="text-center text-sm text-gray-500">Verifying…</p>
            )}

            {otpError && (
              <p className="text-center text-sm text-red-600">{otpError}</p>
            )}

            <p className="text-center text-sm text-gray-500">
              Didn&apos;t receive a code?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline font-medium"
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

        {/* ── Step 3: New password ── */}
        {step === 'password' && (
          <form onSubmit={submitPwd(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...regPwd('newPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {pwdErrors.newPassword && (
                <p className="mt-1 text-xs text-red-600">{pwdErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...regPwd('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {pwdErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{pwdErrors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pwdSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
            >
              {pwdSubmitting ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        )}

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
