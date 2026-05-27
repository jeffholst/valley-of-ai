'use client';

import { useState, useEffect } from 'react';
import { formatDuration } from '@/lib/formatDuration';

function StatusDot({ status }) {
  if (status === 'completed' || status === 'success') {
    return (
      <svg
        className="w-3.5 h-3.5 flex-shrink-0 text-green-500 dark:text-green-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (status === 'failed' || status === 'aborted') {
    return (
      <svg
        className="w-3.5 h-3.5 flex-shrink-0 text-red-500 dark:text-red-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (status === 'started') {
    return (
      <svg
        className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400 dark:text-cyan-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-cyan-700"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-8H7a1 1 0 000 2h6a1 1 0 000-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PostLog({ slug }) {
  const [entries, setEntries] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/post-log?slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setEntries(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading || entries.length === 0) {
    return null;
  }

  const pipelineEntries = entries.filter(
    (e) =>
      e.pipeline?.step &&
      e.pipeline.step !== 'TRANSACTION_START' &&
      e.pipeline.step !== 'TRANSACTION_END'
  );

  const txStart = entries.find((e) => e.pipeline?.step === 'TRANSACTION_START');
  const txEnd = entries.find((e) => e.pipeline?.step === 'TRANSACTION_END');

  const runDate = txStart?.timestamp
    ? new Date(txStart.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null;

  const runId = txStart?.runId ?? null;
  const totalDuration = txEnd?.pipeline?.durationMs ?? null;

  return (
    <div className="border border-gray-200 dark:border-[rgba(80,200,255,0.2)] bg-white dark:bg-[rgba(4,12,30,0.55)] backdrop-blur-sm">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-[rgba(0,40,60,0.3)] transition-colors"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-gray-600 dark:text-cyan-500 tracking-widest uppercase">
            // PIPELINE_LOG
          </span>
          {runDate && (
            <span className="font-mono text-[10px] text-gray-400 dark:text-cyan-700 tracking-wider">
              {runDate}
            </span>
          )}
          {totalDuration && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 border border-gray-200 dark:border-cyan-900 text-gray-500 dark:text-cyan-600 tracking-wider">
              {formatDuration(totalDuration)}
            </span>
          )}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 dark:text-cyan-700 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 dark:border-[rgba(80,200,255,0.1)] px-4 pt-3 pb-4 space-y-1">
          {runId && (
            <div className="font-mono text-[10px] text-gray-400 dark:text-cyan-800 mb-3 pb-2 border-b border-gray-100 dark:border-[rgba(80,200,255,0.08)] tracking-wider truncate">
              {runId}
            </div>
          )}

          {pipelineEntries.map((entry, idx) => {
            const step = entry.pipeline?.step ?? '';
            const status = entry.pipeline?.status ?? '';
            const duration = entry.pipeline?.durationMs ?? null;

            return (
              <div key={idx} className="flex items-start gap-2.5 py-1">
                <div className="mt-0.5">
                  <StatusDot status={status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-semibold text-gray-700 dark:text-cyan-300 tracking-wide">
                      {step}
                    </span>
                    {duration && (
                      <span className="font-mono text-[10px] text-gray-400 dark:text-cyan-700">
                        {formatDuration(duration)}
                      </span>
                    )}
                  </div>
                  {entry.message && (
                    <p className="font-mono text-[10px] text-gray-500 dark:text-cyan-600 mt-0.5 leading-relaxed">
                      {entry.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
