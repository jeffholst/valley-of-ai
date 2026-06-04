'use client';

import { useState } from 'react';

/**
 * Renders a Share button with a popover menu (X, Facebook, copy link).
 * On mobile, delegates to the native OS share sheet instead.
 *
 * Props:
 *   title {string} — used as the share title in navigator.share
 *   text  {string} — the message prepended to the URL in X and native share
 */
export default function ShareButton({ title, text }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy link');

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy link'), 2000);
    } catch {
      setCopyLabel('Failed');
      setTimeout(() => setCopyLabel('Copy link'), 2000);
    }
  }

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  async function handleShareButton() {
    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title, text, url: pageUrl });
        return;
      } catch {
        /* user cancelled — fall through to popover */
      }
    }
    setShareOpen((o) => !o);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShareButton}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-200"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 8a3 3 0 1 0-2.83-4H12a3 3 0 1 0 0 2h3.17A3 3 0 0 0 18 8zm0 8a3 3 0 1 0-2.83-4H12a3 3 0 1 0 0 2h3.17A3 3 0 0 0 18 16zM8 12H6"
          />
        </svg>
        Share
      </button>

      {shareOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            role="presentation"
            onClick={() => setShareOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setShareOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-20 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1">
            <a
              href={xShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShareOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
            <a
              href={fbShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShareOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Share on Facebook
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copyLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
