'use client';

import { useEffect, useRef } from 'react';

/**
 * Giscus comments widget backed by GitHub Discussions.
 *
 * Setup (one-time):
 *  1. Enable GitHub Discussions on the repository.
 *  2. Install the Giscus GitHub App: https://github.com/apps/giscus
 *  3. Visit https://giscus.app, configure for this repo, and copy the
 *     data-repo-id and data-category-id values into the constants below.
 */

const GISCUS_REPO = 'jeffholst/valley-of-ai';
const GISCUS_REPO_ID = ''; // TODO: fill in from giscus.app
const GISCUS_CATEGORY = 'Blog Comments';
const GISCUS_CATEGORY_ID = ''; // TODO: fill in from giscus.app

export default function GiscusComments({ slug, theme }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    if (!GISCUS_REPO_ID || !GISCUS_CATEGORY_ID) {
      return;
    }

    // Remove any existing Giscus iframe before injecting a new one
    ref.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', GISCUS_REPO);
    script.setAttribute('data-repo-id', GISCUS_REPO_ID);
    script.setAttribute('data-category', GISCUS_CATEGORY);
    script.setAttribute('data-category-id', GISCUS_CATEGORY_ID);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', slug);
    script.setAttribute('data-reactions-enabled', '0');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', theme === 'dark' ? 'dark_dimmed' : 'light');
    script.setAttribute('data-lang', 'en');
    ref.current.appendChild(script);
  }, [slug, theme]);

  if (!GISCUS_REPO_ID || !GISCUS_CATEGORY_ID) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Comments coming soon — Giscus setup pending.{' '}
        <a
          href="https://giscus.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 dark:text-purple-400 hover:underline"
        >
          Learn more ↗
        </a>
      </div>
    );
  }

  return <div ref={ref} />;
}
