'use client';

import { useState, useEffect } from 'react';

export default function AppLog({ appId }) {
  const [logs, setLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState(new Set());

  const toggleMessageExpansion = (messageIndex) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageIndex)) {
        newSet.delete(messageIndex);
      } else {
        newSet.add(messageIndex);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/app-log?appId=${appId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('No log file found for this app');
          } else {
            setError('Failed to load log file');
          }
          setLogs([]);
          return;
        }
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
        setError(null);
      } catch {
        setError('Error loading log file');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    if (appId) {
      fetchLog();
    }
  }, [appId]);

  if (loading) {
    return (
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
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

  const pipelineSteps = logs.filter((log) => log.pipeline?.step);
  const transactionStart = pipelineSteps.find((log) => log.pipeline.step === 'TRANSACTION_START');
  const transactionEnd = pipelineSteps.find((log) => log.pipeline.step === 'TRANSACTION_END');

  const getStatusColor = (status) => {
    if (status === 'completed' || status === 'success') {
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    }
    if (status === 'failed') {
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    }
    if (status === 'in_progress') {
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    }
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
  };

  const getStatusIcon = (status) => {
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
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const formatDuration = (ms) => {
    if (!ms) {
      return '-';
    }
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
          </svg>
          Pipeline Log
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
        <div className="mt-3 space-y-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          {/* Summary */}
          {transactionStart && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                Pipeline Details
              </div>
              <div>
                Run ID: <span className="font-mono text-xs">{transactionStart.runId}</span>
              </div>
              {transactionEnd && (
                <div>Duration: {formatDuration(transactionEnd.pipeline?.durationMs)}</div>
              )}
            </div>
          )}

          {/* Pipeline Steps */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {pipelineSteps.map((log, idx) => {
              const step = log.pipeline?.step;
              const status = log.pipeline?.status;
              const isDone = status === 'completed' || status === 'success' || status === 'failed';
              const isMessageExpanded = expandedMessages.has(idx);
              const hasLongMessage = log.message && log.message.length > 50;

              return (
                <div
                  key={idx}
                  className={`text-xs p-2 rounded flex items-start gap-2 ${getStatusColor(status)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getStatusIcon(status)}</div>
                  <div className="flex-grow min-w-0">
                    <div className="font-semibold truncate">{step}</div>
                    {log.pipeline?.seq && (
                      <div className="text-xs opacity-75">seq: {log.pipeline.seq}</div>
                    )}
                    {log.message && (
                      <div
                        className={`text-xs opacity-75 transition-all duration-200 ${
                          hasLongMessage ? 'cursor-pointer select-none hover:opacity-100' : ''
                        } ${hasLongMessage && !isMessageExpanded ? 'truncate' : ''}`}
                        onClick={() => hasLongMessage && toggleMessageExpansion(idx)}
                        style={
                          hasLongMessage
                            ? { WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.1)' }
                            : {}
                        }
                      >
                        <div className="flex items-start gap-1">
                          <span className={hasLongMessage ? 'flex-grow' : 'w-full'}>
                            {log.message}
                          </span>
                          {hasLongMessage && (
                            <button className="flex-shrink-0 text-blue-500 hover:text-blue-700 ml-1 transition-colors">
                              {isMessageExpanded ? (
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Token counts for LLM steps */}
                    {(log.tokensIn ||
                      log.pipeline?.tokensIn ||
                      log.tokensOut ||
                      log.pipeline?.tokensOut) && (
                      <div className="text-xs opacity-60 mt-1 flex items-center gap-2">
                        {(log.tokensIn || log.pipeline?.tokensIn) && (
                          <span className="inline-flex items-center gap-1">
                            <span>🔽</span>
                            <span>
                              {(log.tokensIn || log.pipeline?.tokensIn)?.toLocaleString()}
                            </span>
                          </span>
                        )}
                        {(log.tokensOut || log.pipeline?.tokensOut) && (
                          <span className="inline-flex items-center gap-1">
                            <span>🔼</span>
                            <span>
                              {(log.tokensOut || log.pipeline?.tokensOut)?.toLocaleString()}
                            </span>
                          </span>
                        )}
                        {(log.tokensIn || log.pipeline?.tokensIn) &&
                          (log.tokensOut || log.pipeline?.tokensOut) && (
                            <span className="inline-flex items-center gap-1 opacity-50">
                              <span>💰</span>
                              <span>
                                {(
                                  (log.tokensIn || log.pipeline?.tokensIn) +
                                  (log.tokensOut || log.pipeline?.tokensOut)
                                )?.toLocaleString()}
                              </span>
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                  {isDone && log.pipeline?.durationMs && (
                    <div className="flex-shrink-0 text-xs opacity-75 whitespace-nowrap">
                      {formatDuration(log.pipeline.durationMs)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation/Reasoning entries summary */}
          {logs.some((log) => log.category === 'validation') && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs">
              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                Validation Checks ({logs.filter((log) => log.category === 'validation').length})
              </div>
              <div className="space-y-1">
                {logs
                  .filter((log) => log.category === 'validation')
                  .map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 rounded flex items-center gap-2 ${
                        log.validation?.result === 'PASS'
                          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                          : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      {getStatusIcon(log.validation?.result === 'PASS' ? 'completed' : 'failed')}
                      <span className="flex-grow truncate">
                        {log.validation?.name || log.validation?.checkType}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Feedback entries */}
          {logs.some((log) => log.category === 'feedback') && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs">
              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                Post-generation Feedback ({logs.filter((log) => log.category === 'feedback').length}
                )
              </div>
              <div className="space-y-1">
                {logs
                  .filter((log) => log.category === 'feedback')
                  .map((log, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded flex items-start gap-2 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20"
                    >
                      <span className="flex-shrink-0 mt-0.5">💬</span>
                      <div className="flex-grow min-w-0">
                        <div className="font-semibold">{log.feedback?.type || 'feedback'}</div>
                        {log.message && <div className="opacity-75 mt-0.5">{log.message}</div>}
                      </div>
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
