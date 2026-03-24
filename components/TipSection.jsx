'use client';

import { useState } from 'react';

const PRESET_AMOUNTS = [1, 3, 5];

export default function TipSection({ issueNumber, type = 'tip' }) {
  const [selected, setSelected] = useState(null); // preset amount or 'custom'
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTip = async (amount) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, issueNumber, type }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = () => {
    const amount = parseInt(customAmount, 10);
    if (!amount || amount < 1) {
      setError('Please enter an amount of at least $1.');
      return;
    }
    if (amount > 999) {
      setError('Maximum tip amount is $999.');
      return;
    }
    handleTip(amount);
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
        {type === 'tip' ? '🤖 Tip the bots' : '💡 Choose an amount'}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {type === 'tip'
          ? 'A tip puts your request at the front of the review queue and helps keep the bots running. It does not guarantee acceptance, but is greatly appreciated.'
          : 'Every dollar helps keep the AI bots running and building new apps every night. Thank you!'}
      </p>

      {/* Preset + Custom buttons */}
      <div className="flex gap-2">
        {PRESET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => {
              setSelected(amount);
              setError(null);
              handleTip(amount);
            }}
            disabled={isLoading}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all duration-150
              ${
                selected === amount && isLoading
                  ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-300 cursor-wait'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {selected === amount && isLoading ? '...' : `$${amount}`}
          </button>
        ))}
        <button
          onClick={() => {
            setSelected('custom');
            setError(null);
          }}
          disabled={isLoading}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all duration-150
            ${
              selected === 'custom'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          Custom
        </button>
      </div>

      {/* Custom amount input */}
      {selected === 'custom' && (
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              type="number"
              min="1"
              max="999"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              placeholder="0"
              className="input pl-6 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleCustomSubmit}
            disabled={isLoading || !customAmount}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-400 hover:bg-amber-500 text-amber-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Tip'}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
