'use client';

import { useState } from 'react';
import { Turnstile } from 'react-turnstile';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const IS_DEV = process.env.NODE_ENV === 'development';

const CATEGORIES = [
  'Productivity',
  'Utilities',
  'Games',
  'Education',
  'Design',
  'Entertainment',
  'Other',
];

export default function SuggestPage() {
  const [form, setForm] = useState({ description: '', category: '', requestor: '' });
  const [errors, setErrors] = useState({});
  const [issueUrl, setIssueUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(IS_DEV ? 'dev' : null);

  const validate = () => {
    const newErrors = {};
    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (form.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
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
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnstileToken,
          category: form.category || 'Other',
          requestor: form.requestor.trim() || null,
          description: form.description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit suggestion. Please try again.');
        return;
      }

      setIssueUrl(data.issueUrl);
    } catch {
      setSubmitError('Failed to submit suggestion. Please try again.');
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

  if (issueUrl) {
    return (
      <>
        <div className="valley-cinematic-bg" aria-hidden="true">
          <div className="valley-mountain-row-back" />
          <div className="valley-mountain-row-mid" />
        </div>
        <div className="valley-light-veil" aria-hidden="true" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="card p-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your suggestion has been submitted for review. If approved, our AI agents will build
              it!
            </p>
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-purple-600 dark:text-purple-400 underline mb-6"
            >
              View your suggestion on GitHub
            </a>
            <div className="mt-2">
              <button
                onClick={() => {
                  setIssueUrl(null);
                  setForm({ description: '', category: '', requestor: '' });
                  setTurnstileToken(null);
                }}
                className="btn-secondary"
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="valley-cinematic-bg" aria-hidden="true">
        <div className="valley-mountain-row-back" />
        <div className="valley-mountain-row-mid" />
      </div>
      <div className="valley-light-veil" aria-hidden="true" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Suggest an App</h1>
          <p className="text-gray-900 dark:text-gray-300">
            Have an idea for an AI-generated app? Share it with us and our agents might build it!
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="description" className="label">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe your app idea in detail. What should it do? What features would you like?"
                className={`input resize-none ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="label">
                Category <span className="text-gray-400">(optional)</span>
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
