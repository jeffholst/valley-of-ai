'use client';

import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'blog-holo-fx';

export default function BlogHoloPanel({ children }) {
  const ref = useRef(null);
  const [fxEnabled, setFxEnabled] = useState(true);
  // Track whether we've read localStorage yet to avoid a hydration flash
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'off') {
      setFxEnabled(false);
    }
    setHydrated(true);
  }, []);

  function toggleFx() {
    const next = !fxEnabled;
    setFxEnabled(next);
    localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
  }

  useEffect(() => {
    // Clear any active glitch state when fx is disabled
    if (!fxEnabled) {
      if (ref.current) {
        delete ref.current.dataset.glitch;
      }
      return;
    }

    let t;

    function glitch() {
      const el = ref.current;
      if (!el) {
        return;
      }
      el.dataset.glitch = 'a';
      setTimeout(() => {
        if (ref.current) {
          ref.current.dataset.glitch = 'b';
        }
      }, 50);
      setTimeout(() => {
        if (ref.current) {
          ref.current.dataset.glitch = 'a';
        }
      }, 95);
      setTimeout(() => {
        if (ref.current) {
          delete ref.current.dataset.glitch;
        }
      }, 135);

      t = setTimeout(glitch, 7000 + Math.random() * 11000);
    }

    t = setTimeout(glitch, 3000 + Math.random() * 5000);
    return () => clearTimeout(t);
  }, [fxEnabled]);

  return (
    <div ref={ref} className="blog-holo-panel p-7 sm:p-9">
      <span className="blog-holo-corner--tr" aria-hidden="true" />
      <span className="blog-holo-corner--bl" aria-hidden="true" />
      <span className="blog-holo-corner--br" aria-hidden="true" />
      {hydrated && (
        <button
          onClick={toggleFx}
          title={fxEnabled ? 'Disable glitch effects' : 'Enable glitch effects'}
          className="absolute top-2.5 right-7 z-10 font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 border transition-colors select-none border-transparent text-gray-400 dark:text-cyan-800 hover:border-gray-300 dark:hover:border-cyan-700 hover:text-gray-600 dark:hover:text-cyan-500"
        >
          {fxEnabled ? 'Destabilized' : 'Stabilized'}
        </button>
      )}
      {children}
    </div>
  );
}
