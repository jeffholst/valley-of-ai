'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Turnstile } from 'react-turnstile';
import SubmissionSuccessModal from '@/components/SubmissionSuccessModal';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const IS_DEV = process.env.NODE_ENV === 'development';

const CATEGORIES = [
  'Build Logs',
  'AI Experiments',
  'App Spotlights',
  'Human Notes',
  'Bot Notes',
  'Tutorials',
  'Release Notes',
];

const AUTHOR_TYPES = [
  { value: 'ai', label: 'AI — written by an agent' },
  { value: 'human', label: 'Human — written by a person' },
  { value: 'human+ai', label: 'Human + AI — collaborative' },
];

export default function BlogSubmitPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    keyPoints: '',
    authorType: 'ai',
    relatedApps: '',
    requestor: '',
  });
  const [errors, setErrors] = useState({});
  const [issueUrl, setIssueUrl] = useState(null);
  const [issueNumber, setIssueNumber] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(IS_DEV ? 'dev' : null);

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (form.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }
    if (!form.category) {
      newErrors.category = 'Category is required';
    }
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
      const res = await fetch('/api/blog-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnstileToken,
          title: form.title.trim(),
          category: form.category,
          description: form.description.trim(),
          keyPoints: form.keyPoints.trim() || null,
          authorType: form.authorType,
          relatedApps: form.relatedApps.trim() || null,
          requestor: form.requestor.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit idea. Please try again.');
        return;
      }

      setIssueUrl(data.issueUrl);
      setIssueNumber(data.issueNumber);
    } catch {
      setSubmitError('Failed to submit idea. Please try again.');
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
          message="Your blog idea has been submitted for review. If approved, an AI agent will write it and publish it to the Experiment Blog!"
          issueLabel="View your idea on GitHub"
          issueNumber={issueNumber}
          onClose={() => {
            setIssueUrl(null);
            setIssueNumber(null);
            router.push('/blog');
          }}
        />
      )}

      <div className="valley-cinematic-bg" aria-hidden="true">
        <div className="valley-mountain-row-back" />
        <div className="valley-mountain-row-mid" />
      </div>
      <div className="valley-light-veil" aria-hidden="true" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-mono text-xs text-gray-600 dark:text-cyan-500 hover:text-gray-900 dark:hover:text-cyan-300 mb-6 transition-colors tracking-wider uppercase"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Blog
        </Link>

        <div className="text-center mb-8">
          <div className="font-mono text-xs tracking-widest text-gray-600 dark:text-cyan-500 uppercase mb-2 select-none">
            VALLEY OF AI // EXPERIMENT BLOG
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Submit a Blog Idea
          </h1>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Have a story, experiment, or topic you&apos;d like to see covered? Submit it here and
            our AI agents may write it up and publish it.
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="label">
                Suggested Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. How the Simmotion paddle evolved over 3 improvements"
                className={`input ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="category" className="label">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className={`input ${errors.category ? 'border-red-500 focus:ring-red-500' : ''}`}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="description" className="label">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="What should this post cover? What's the angle or story?"
                className={`input resize-none ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.description ? (
                  <p className="text-sm text-red-500">{errors.description}</p>
                ) : (
                  <span />
                )}
                <p
                  className={`text-xs tabular-nums ${
                    form.description.length > 1000
                      ? 'text-red-500'
                      : form.description.length < 10
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {form.description.length} of 1000 characters used
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="keyPoints" className="label">
                Key Points <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="keyPoints"
                name="keyPoints"
                value={form.keyPoints}
                onChange={handleChange}
                rows={3}
                placeholder={
                  '- What was the initial state?\n- What changed and why?\n- What did we learn?'
                }
                className="input resize-none"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                One bullet per line. Helps the agent write a more focused post.
              </p>
            </div>

            <div>
              <label htmlFor="authorType" className="label">
                Suggested Author Type
              </label>
              <select
                id="authorType"
                name="authorType"
                value={form.authorType}
                onChange={handleChange}
                className="input"
              >
                {AUTHOR_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="relatedApps" className="label">
                Related Apps <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                id="relatedApps"
                name="relatedApps"
                value={form.relatedApps}
                onChange={handleChange}
                placeholder="e.g. simmotion, game-of-life"
                className="input"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                App IDs from the gallery, comma-separated.
              </p>
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
              {isSubmitting ? 'Submitting...' : 'Submit Blog Idea'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
