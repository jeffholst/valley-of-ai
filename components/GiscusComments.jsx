'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Giscus comments widget backed by GitHub Discussions.
 *
 * Setup (one-time):
 *  1. Enable GitHub Discussions on the repository.
 *  2. Install the Giscus GitHub App: https://github.com/apps/giscus
 *  3. Visit https://giscus.app, configure for this repo, and copy the
 *     repo-id and category-id values into NEXT_PUBLIC_GISCUS_* in .env
 */

const GISCUS_REPO = process.env.NEXT_PUBLIC_GISCUS_REPO ?? '';
const GISCUS_REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID ?? '';
const GISCUS_CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY ?? 'Blog Comments';
const GISCUS_CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? '';

export default function GiscusComments({ slug, theme }) {
  const ref = useRef(null);
  const [resolvedTheme, setResolvedTheme] = useState(theme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    if (theme === 'dark' || theme === 'light') {
      setResolvedTheme(theme);
      return;
    }

    const syncTheme = () => {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setResolvedTheme(storedTheme);
        return;
      }
      setResolvedTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('storage', syncTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', syncTheme);
    };
  }, [theme]);

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
    script.setAttribute('data-theme', resolvedTheme === 'dark' ? 'dark_dimmed' : 'light');
    script.setAttribute('data-lang', 'en');
    ref.current.appendChild(script);
  }, [slug, resolvedTheme]);

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
