import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MessageSquare, Calendar } from 'lucide-react';
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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-blue-600" />
        Feedback
      </h1>

      {/* Submit form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Submit Feedback</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <textarea
            {...register('content', {
              required: 'Feedback is required',
              validate: (v) =>
                v.trim().length > 0 || 'Feedback cannot be empty',
            })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Share your experience…"
          />
          {errors.content && (
            <p className="text-xs text-red-600">{errors.content.message}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </div>

      {/* Past feedbacks */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Your Feedback History</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-16"
              />
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <p className="text-gray-400 text-sm">No feedback submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <div
                key={fb.feedbackId}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <p className="text-gray-800">{fb.content}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
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
