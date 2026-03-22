'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Turnstile } from 'react-turnstile';
import SubmissionSuccessModal from '@/components/SubmissionSuccessModal';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const IS_DEV = process.env.NODE_ENV === 'development';

function ImprovePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('app') || '';
  const appName = searchParams.get('name') || appId;

  const [form, setForm] = useState({ description: '', requestor: '' });
  const [errors, setErrors] = useState({});
  const [issueUrl, setIssueUrl] = useState(null);
  const [issueNumber, setIssueNumber] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(IS_DEV ? 'dev' : null);

  const validate = () => {
    const newErrors = {};
    const trimmedDescription = form.description.trim();
    if (!trimmedDescription) {
      newErrors.description = 'Description is required';
    } else if (trimmedDescription.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (trimmedDescription.length > 1000) {
      newErrors.description = 'Description must be at most 1000 characters';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!turnstileToken) {
      setSubmitError('Please complete the security verification.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnstileToken,
          appId,
          appName,
          requestor: form.requestor.trim() || null,
          description: form.description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit improvement. Please try again.');
        return;
      }

      setIssueUrl(data.issueUrl);
      setIssueNumber(data.issueNumber);
    } catch {
      setSubmitError('Failed to submit improvement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  return (
    <>
      {issueUrl && (
        <SubmissionSuccessModal
          issueUrl={issueUrl}
          message={`Your improvement idea for ${appName} has been submitted for review.`}
          issueLabel="View your improvement on GitHub"
          issueNumber={issueNumber}
          onClose={() => { setIssueUrl(null); setIssueNumber(null); router.push('/'); }}
        />
      )}

      <div className="valley-cinematic-bg" aria-hidden="true">
        <div className="valley-mountain-row-back" />
        <div className="valley-mountain-row-mid" />
      </div>
      <div className="valley-light-veil" aria-hidden="true" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appId && (
          <div className="card overflow-hidden mb-6">
            <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 relative">
              <img
                src={`/apps/${appId}/thumbnail.svg`}
                alt={appName}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Suggest an Improvement
          </h1>
          <p className="text-gray-900 dark:text-gray-300">
            Have an idea to make this app better? Share it and our AI agents might implement it!
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* App — read-only */}
            <div>
              <label className="label">App</label>
              <div className="input bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-default">
                {appName || appId || 'Unknown app'}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="label">
                Improvement idea <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe what you'd like to see improved or added. Be as specific as possible."
                className={`input resize-none ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.description ? (
                  <p className="text-sm text-red-500">{errors.description}</p>
                ) : (
                  <span />
                )}
                <p className={`text-xs tabular-nums ${
                  form.description.length > 1000
                    ? 'text-red-500'
                    : form.description.length < 10
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-green-600 dark:text-green-400'
                }`}>
                  {form.description.length} of 1000 characters used
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="requestor" className="label">
                Your name or handle <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                id="requestor"
                name="requestor"
                value={form.requestor}
                onChange={handleChange}
                placeholder="e.g. @username or Jane"
                className="input"
              />
            </div>

            {/* Cloudflare Turnstile (skipped in development) */}
            {!IS_DEV && (
              <div className="flex justify-center">
                <Turnstile
                  sitekey={TURNSTILE_SITE_KEY}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>
            )}

            {submitError && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !turnstileToken}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Improvement'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function ImprovePageWrapper() {
  return (
    <Suspense>
      <ImprovePage />
    </Suspense>
  );
}
