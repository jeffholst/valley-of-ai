'use client';

import { useEffect, useRef } from 'react';
import TipSection from '@/components/TipSection';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export default function DonateModal({ onClose }) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donate-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
      >
        {/* X close button */}
        <button
          onClick={onClose}
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

        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl donate-bulb">💡</span>
        </div>

        <h2
          id="donate-modal-title"
          className="text-xl font-bold text-gray-900 dark:text-white mb-2"
        >
          Keep the Lights On
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
          Valley of AI runs on AI agents that generate a new app every night. Your support helps
          cover compute costs and keeps the bots building!
        </p>

        <TipSection type="donation" />

        <div className="mt-4">
          <button onClick={onClose} className="btn-secondary w-full">
            Maybe later
          </button>
        </div>

        <style jsx>{`
          .donate-bulb {
            display: inline-block;
            animation: bulbFlicker 1.8s steps(1, end) infinite;
          }

          @keyframes bulbFlicker {
            0%,
            14%,
            18%,
            22%,
            35%,
            60%,
            100% {
              opacity: 1;
              filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.7));
            }

            15%,
            19%,
            23%,
            36%,
            61% {
              opacity: 0.25;
              filter: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
