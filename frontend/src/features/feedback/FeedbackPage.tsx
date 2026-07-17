import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MessageSquare, Calendar, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFeedbacks, createFeedback } from '@/services';
import { useAuthState } from '@/hooks';
import type { Feedback, CustomerProfile } from '@/types';

interface FormData {
  content: string;
}

export function FeedbackPage() {
  const auth = useAuthState();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const customerId = (auth.user as CustomerProfile | null)?.customerId ?? '';

  function loadFeedbacks() {
    if (!customerId) return;
    getFeedbacks(customerId)
      .then(setFeedbacks)
      .catch((err: unknown) => {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load feedback',
        );
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function onSubmit(data: FormData) {
    const trimmed = data.content.trim();
    if (!trimmed) {
      toast.error('Feedback cannot be empty');
      return;
    }
    try {
      await createFeedback(customerId, trimmed);
      toast.success('Feedback submitted!');
      reset();
      loadFeedbacks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="surface-card flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="hero-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Share your experience
          </span>
          <h1 className="hero-title mt-4 flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-sky-600" />
            Feedback
          </h1>
          <p className="hero-copy mt-2">
            Tell us what worked well or where the journey felt rough so the service can stay polished.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Your voice matters
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">Fast support</p>
        </div>
      </div>

      <div className="surface-card p-6">
        <h2 className="card-heading">Submit Feedback</h2>
        <p className="card-subtitle mt-1 mb-4">
          Add a quick note about your ride, booking, or support experience.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <textarea
            {...register('content', {
              required: 'Feedback is required',
              validate: (v) => v.trim().length > 0 || 'Feedback cannot be empty',
            })}
            rows={5}
            className="input-modern min-h-32 resize-none"
            placeholder="Share your experience..."
          />
          {errors.content && (
            <p className="text-xs text-red-600">{errors.content.message}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="card-heading">Your Feedback History</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="surface-card h-16 animate-pulse" />
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="surface-card py-12 text-center text-slate-400">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>No feedback submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <div
                key={fb.feedbackId}
                className="surface-card p-4"
              >
                <p className="text-slate-800">{fb.content}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(fb.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
