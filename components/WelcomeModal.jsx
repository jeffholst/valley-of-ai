'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const STORAGE_KEY = 'voa-welcome-dismissed';

const SUGGESTIONS = [
  { emoji: '🎮', text: 'Browse the gallery and launch an app — no install needed.' },
  { emoji: '🗳️', text: 'Vote for your favorites to push them up the trending board.' },
  { emoji: '⚔️', text: 'Check out Versus to see how different AI models tackle the same prompt.' },
  { emoji: '💡', text: 'Have an idea? Suggest an app and a bot might build it overnight.' },
];

export default function WelcomeModal({ onClose }) {
  const panelRef = useRef(null);
  const [dontShow, setDontShow] = useState(false);
  useFocusTrap(panelRef);

  const handleDismiss = useCallback(() => {
    if (dontShow) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onClose();
  }, [dontShow, onClose]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
      >
        {/* X button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🌄</span>
          </div>
          <h2
            id="welcome-modal-title"
            className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1"
          >
            Welcome to the Valley of AI
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            A gallery of AI-built apps, growing every day.
          </p>
        </div>

        {/* Suggestions */}
        <ul className="space-y-3 mb-6">
          {SUGGESTIONS.map(({ emoji, text }) => (
            <li
              key={emoji}
              className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
            >
              <span className="text-base leading-5 shrink-0">{emoji}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {/* Don't show again */}
        <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer mb-5 select-none">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
          />
          Don&apos;t show this again
        </label>

        {/* Dismiss */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            Start exploring
          </button>
          <Link
            href="/suggest"
            onClick={handleDismiss}
            className="flex-1 text-center border border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            Suggest an app
          </Link>
        </div>
      </div>
    </div>
  );
}
