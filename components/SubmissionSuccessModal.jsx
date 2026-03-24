'use client';

import { useEffect, useRef } from 'react';
import TipSection from '@/components/TipSection';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export default function SubmissionSuccessModal({
  message,
  issueUrl,
  issueLabel,
  issueNumber,
  onClose,
}) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef);

  // Close on Escape key
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
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div ref={panelRef} className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center overflow-y-auto max-h-[90vh]">
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

        {/* Success icon */}
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 id="modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Thank You!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>

        {/* Tip the bots section */}
        {issueNumber && <TipSection issueNumber={issueNumber} type="tip" />}

        <div className="mt-6">
          <button onClick={onClose} className="btn-primary w-full">
            Let the bots starve
          </button>
        </div>

        {issueUrl && (
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-purple-600 dark:text-purple-400 underline mt-4"
          >
            {issueLabel || 'View on GitHub'}
          </a>
        )}
      </div>
    </div>
  );
}
