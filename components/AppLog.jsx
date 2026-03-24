'use client';

import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms) {
  if (!ms) {
    return '-';
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

function getStatusColor(status) {
  if (status === 'completed' || status === 'success') {
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
  }
  if (status === 'failed') {
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  }
  if (status === 'skipped') {
    return 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
  }
  if (status === 'in_progress') {
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
  }
  return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
}

function StatusIcon({ status }) {
  if (status === 'completed' || status === 'success') {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (status === 'failed') {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (status === 'skipped') {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-8H7a1 1 0 000 2h6a1 1 0 000-2z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Group logs into runs
//
// Returns an array of groups, each with:
//   { type: 'new_app' | 'improvement' | 'legacy', runId, date, entries[] }
//
// Ordering: legacy entries (if any) are grouped first, followed by run-based
// groups in chronological order by the first entry in each group.
// ---------------------------------------------------------------------------

export function groupLogs(logs) {
  const runMap = new Map(); // runId → group
  const legacyEntries = [];

  for (const log of logs) {
    // Legacy format (old actionType-based logs)
    if (log.actionType) {
      legacyEntries.push(log);
      continue;
    }

    // Pipeline / reasoning / validation entries grouped by runId
    const runId = log.runId || '__unknown__';
    if (!runMap.has(runId)) {
      runMap.set(runId, {
        runId,
        type: 'new_app', // default; overridden below
        date: log.timestamp,
        entries: [],
      });
    }
    const group = runMap.get(runId);
    group.entries.push(log);

    // Detect run type from step name
    if (log.pipeline?.step === 'SELECT_IMPROVEMENT') {
      group.type = 'improvement';
    }
  }

  const groups = [];

  if (legacyEntries.length) {
    groups.push({
      type: 'legacy',
      runId: '__legacy__',
      date: legacyEntries[0].timestamp,
      entries: legacyEntries,
    });
  }

  // Runs in chronological order of first entry
  for (const group of runMap.values()) {
    groups.push(group);
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Group header config
// ---------------------------------------------------------------------------

const GROUP_CONFIG = {
  new_app: {
    label: 'Original Build',
    icon: '🚀',
    headerBg: 'bg-blue-50 dark:bg-blue-900/20',
    headerText: 'text-blue-800 dark:text-blue-200',
    headerBorder: 'border-blue-200 dark:border-blue-700',
    badge: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300',
  },
  improvement: {
    label: 'Improvement',
    icon: '🔧',
    headerBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    headerText: 'text-emerald-800 dark:text-emerald-200',
    headerBorder: 'border-emerald-200 dark:border-emerald-700',
    badge: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300',
  },
  legacy: {
    label: 'Build Log',
    icon: '📋',
    headerBg: 'bg-gray-50 dark:bg-gray-800/40',
    headerText: 'text-gray-700 dark:text-gray-300',
    headerBorder: 'border-gray-200 dark:border-gray-600',
    badge: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  },
};

// ---------------------------------------------------------------------------
// Run group component
// ---------------------------------------------------------------------------

function RunGroup({ group, improvementIndex }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState(new Set());

  const toggleMessage = (idx) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const config = GROUP_CONFIG[group.type] ?? GROUP_CONFIG.legacy;
  const pipelineSteps = group.entries.filter((l) => l.pipeline?.step);
  const transactionStart = pipelineSteps.find((l) => l.pipeline.step === 'TRANSACTION_START');
  const transactionEnd = pipelineSteps.find((l) => l.pipeline.step === 'TRANSACTION_END');
  const validationEntries = group.entries.filter((l) => l.category === 'validation');

  const label =
    group.type === 'improvement'
      ? `${config.icon} Improvement #${improvementIndex}`
      : `${config.icon} ${config.label}`;

  const runDate = group.date
    ? new Date(group.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className={`rounded-lg border ${config.headerBorder} overflow-hidden`}>
      {/* Group header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3 py-2 ${config.headerBg} ${config.headerText} text-xs font-semibold transition-colors hover:opacity-90`}
      >
        <span className="flex items-center gap-2">
          <span>{label}</span>
          {runDate && <span className="opacity-60 font-normal">{runDate}</span>}
          {transactionEnd && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${config.badge}`}>
              {formatDuration(transactionEnd.pipeline?.durationMs)}
            </span>
          )}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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

      {isExpanded && (
        <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-900/50">
          {/* Run ID */}
          {transactionStart && (
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono pb-2 border-b border-gray-200 dark:border-gray-700">
              {transactionStart.runId}
            </div>
          )}

          {/* Legacy entries */}
          {group.type === 'legacy' &&
            group.entries.map((log, idx) => (
              <div
                key={idx}
                className="text-xs p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <div className="font-semibold">{log.actionType}</div>
                <div className="opacity-75 mt-0.5">{log.description}</div>
              </div>
            ))}

          {/* Pipeline steps */}
          {pipelineSteps.length > 0 && (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {pipelineSteps.map((log, idx) => {
                const step = log.pipeline?.step;
                const status = log.pipeline?.status;
                const isExpMsg = expandedMessages.has(idx);
                const hasLong = log.message && log.message.length > 50;

                return (
                  <div
                    key={idx}
                    className={`text-xs p-2 rounded flex items-start gap-2 ${getStatusColor(status)}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <StatusIcon status={status} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="font-semibold truncate">{step}</div>
                      {log.pipeline?.seq && (
                        <div className="opacity-60">seq {log.pipeline.seq}</div>
                      )}
                      {log.message &&
                        (hasLong ? (
                          <button
                            type="button"
                            className={`opacity-75 mt-0.5 cursor-pointer ${!isExpMsg ? 'truncate' : ''} flex items-center`}
                            onClick={() => toggleMessage(idx)}
                            aria-expanded={isExpMsg}
                          >
                            <span className={!isExpMsg ? 'truncate' : ''}>{log.message}</span>
                            <span
                              className="ml-1 text-blue-500 hover:text-blue-700 flex-shrink-0"
                              aria-hidden="true"
                            >
                              {isExpMsg ? '▲' : '▼'}
                            </span>
                          </button>
                        ) : (
                          <div className="opacity-75 mt-0.5">{log.message}</div>
                        ))}
                      {(log.tokensIn ||
                        log.pipeline?.tokensIn ||
                        log.tokensOut ||
                        log.pipeline?.tokensOut) && (
                        <div className="opacity-60 mt-1 flex gap-2">
                          {(log.tokensIn || log.pipeline?.tokensIn) && (
                            <span>
                              🔽 {(log.tokensIn || log.pipeline?.tokensIn)?.toLocaleString()}
                            </span>
                          )}
                          {(log.tokensOut || log.pipeline?.tokensOut) && (
                            <span>
                              🔼 {(log.tokensOut || log.pipeline?.tokensOut)?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {log.pipeline?.durationMs && (
                      <div className="flex-shrink-0 opacity-75 whitespace-nowrap">
                        {formatDuration(log.pipeline.durationMs)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Validation checks */}
          {validationEntries.length > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Validation ({validationEntries.length})
              </div>
              <div className="space-y-1">
                {validationEntries.map((log, idx) => (
                  <div
                    key={idx}
                    className={`text-xs p-1.5 rounded flex items-center gap-2 ${log.validation?.result === 'PASS' ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'}`}
                  >
                    <StatusIcon
                      status={log.validation?.result === 'PASS' ? 'completed' : 'failed'}
                    />
                    <span className="truncate">
                      {log.validation?.name || log.validation?.checkType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AppLog({ appId, suggestion, improvements }) {
  const [logs, setLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!appId) {
      return;
    }
    setLoading(true);
    fetch(`/api/app-log?appId=${appId}`)
      .then((res) => {
        if (!res.ok) {
          setError(
            res.status === 404 ? 'No log file found for this app' : 'Failed to load log file'
          );
          setLogs([]);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setLogs(Array.isArray(data) ? data : []);
        }
        setError(null);
      })
      .catch(() => {
        setError('Error loading log file');
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [appId]);

  if (loading) {
    return (
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          Loading log...
        </div>
      </div>
    );
  }

  if (error || logs.length === 0) {
    return (
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error || 'No pipeline log available'}
        </div>
      </div>
    );
  }

  const groups = groupLogs(logs);

  // Count improvement groups for labeling (#1, #2, ...)
  let improvementCounter = 0;

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      {/* Community suggestion banner */}
      {suggestion && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300">
          <div className="font-semibold mb-1">
            Built from a community suggestion
            {suggestion.issueNumber && (
              <a
                href={suggestion.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 underline opacity-75 hover:opacity-100"
              >
                #{suggestion.issueNumber}
              </a>
            )}
            {suggestion.requestor && (
              <span className="ml-2 opacity-75">by {suggestion.requestor}</span>
            )}
          </div>
          <div className="opacity-75 leading-relaxed">{suggestion.prompt}</div>
        </div>
      )}


      {/* Section toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-3"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
          </svg>
          Pipeline Log
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            ({groups.length} {groups.length === 1 ? 'run' : 'runs'})
          </span>
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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

      {isExpanded && (
        <div className="space-y-3">
          {groups.flatMap((group) => {
            const items = [];
            if (group.type === 'improvement') {
              improvementCounter += 1;
              const improvement = improvements?.[improvementCounter - 1];
              if (improvement) {
                items.push(
                  <div
                    key={`improvement-banner-${improvementCounter}`}
                    className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300"
                  >
                    <div className="font-semibold mb-1">
                      🔧 Improvement #{improvementCounter}
                      {improvement.issueNumber && (
                        <a
                          href={improvement.issueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 underline opacity-75 hover:opacity-100"
                        >
                          #{improvement.issueNumber}
                        </a>
                      )}
                      {improvement.requestor && (
                        <span className="ml-2 opacity-75">by {improvement.requestor}</span>
                      )}
                    </div>
                    <div className="opacity-75 leading-relaxed">{improvement.description}</div>
                  </div>
                );
              }
            }
            items.push(
              <RunGroup key={group.runId} group={group} improvementIndex={improvementCounter} />
            );
            return items;
          })}
        </div>
      )}
    </div>
  );
}
