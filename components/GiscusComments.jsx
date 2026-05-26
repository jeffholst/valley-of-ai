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

function getGiscusTheme(isDark) {
  return isDark ? 'dark_dimmed' : 'light';
}

function readTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export default function GiscusComments({ slug, theme }) {
  const ref = useRef(null);
  const injected = useRef(false);
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // Sync theme from DOM/localStorage — runs once on mount
  useEffect(() => {
    if (theme === 'dark' || theme === 'light') {
      setResolvedTheme(theme);
      return;
    }

    setResolvedTheme(readTheme());

    const syncTheme = () => setResolvedTheme(readTheme());
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('storage', syncTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', syncTheme);
    };
  }, [theme]);

  // Inject Giscus script once per slug
  useEffect(() => {
    if (!ref.current || !GISCUS_REPO_ID || !GISCUS_CATEGORY_ID) {
      return;
    }

    ref.current.innerHTML = '';
    injected.current = false;

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
    script.setAttribute('data-theme', getGiscusTheme(resolvedTheme === 'dark'));
    script.setAttribute('data-lang', 'en');
    script.onload = () => {
      injected.current = true;
    };
    ref.current.appendChild(script);
  }, [slug]); // intentionally omits resolvedTheme — theme changes use postMessage below

  // Update theme without re-injecting — send postMessage to the loaded iframe
  useEffect(() => {
    if (!injected.current) {
      return;
    }
    const iframe = ref.current?.querySelector('iframe.giscus-frame');
    if (!iframe) {
      return;
    }
    iframe.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: getGiscusTheme(resolvedTheme === 'dark') } } },
      'https://giscus.app'
    );
  }, [resolvedTheme]);

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
