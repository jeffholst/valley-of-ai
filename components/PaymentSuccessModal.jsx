'use client';

import { useEffect } from 'react';

const ROBOTS = ['🤖', '🤖', '🤖'];

export default function PaymentSuccessModal({ type = 'tip', onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-success-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center overflow-hidden">
        {/* X close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Sparkle confetti dots */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          {['top-4 left-8', 'top-6 right-10', 'top-10 left-1/2', 'top-2 left-1/3', 'top-8 right-6'].map((pos, i) => (
            <span
              key={i}
              className={`absolute text-lg robot-confetti ${pos}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {['✨', '⭐', '💫', '🌟', '✨'][i]}
            </span>
          ))}
        </div>

        {/* Dancing robots */}
        <div className="flex justify-center items-end gap-4 mb-6 h-20" aria-hidden="true">
          {ROBOTS.map((robot, i) => (
            <span
              key={i}
              className="text-5xl robot-dance select-none"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              {robot}
            </span>
          ))}
        </div>

        <h2
          id="payment-success-title"
          className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
        >
          Thank You!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
          The bots are dancing in your honor! 🎉
        </p>
        {type === 'tip' && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">
            Your tip has been received and your request has been boosted to the front of the review queue.
          </p>
        )}

        <button onClick={onClose} className="btn-primary w-full">
          Keep up the good work, bots!
        </button>
      </div>
    </div>
  );
}
