'use client';

import { ENTRY_COLORS } from './VersusVoteBar';

/**
 * Static model info for educational context.
 * Keys are normalized model identifiers (lowercase, trimmed).
 * When a model string from the registry doesn't match, the component
 * gracefully falls back to "Unknown" values.
 */
const MODEL_INFO = {
  'claude-opus-4.5': {
    displayName: 'Claude Opus 4.5',
    provider: 'Anthropic',
    releaseDate: 'Feb 2025',
    contextWindow: '200K tokens',
    maxOutput: '32K tokens',
    strengths: [
      'Deep reasoning & analysis',
      'Nuanced creative writing',
      'Complex code generation',
      'Strong instruction following',
    ],
    description:
      "Anthropic's most capable model at its release, excelling at complex reasoning, creative tasks, and coding. Known for thoughtful, detailed outputs with strong safety alignment.",
    leaderboards: [
      { name: 'Chatbot Arena', url: 'https://lmarena.ai/' },
      { name: 'SWE-bench', url: 'https://www.swebench.com/' },
      { name: 'Artificial Analysis', url: 'https://artificialanalysis.ai/' },
    ],
  },
  'gpt-5.3-codex': {
    displayName: 'GPT-5.3 Codex',
    provider: 'OpenAI',
    releaseDate: '2025',
    contextWindow: '200K tokens',
    maxOutput: '32K tokens',
    strengths: [
      'Rapid code generation',
      'Multi-language fluency',
      'Tool & API integration',
      'Fast iteration speed',
    ],
    description:
      "OpenAI's code-specialized model optimized for software development. Designed for fast, accurate code generation across many programming languages with strong tool-use capabilities.",
    leaderboards: [
      { name: 'Chatbot Arena', url: 'https://lmarena.ai/' },
      { name: 'SWE-bench', url: 'https://www.swebench.com/' },
      { name: 'Scale SEAL', url: 'https://scale.com/leaderboard' },
    ],
  },
  'openai-codex/gpt-5.3-codex': {
    displayName: 'GPT-5.3 Codex',
    provider: 'OpenAI (via Codex agent)',
    releaseDate: '2025',
    contextWindow: '200K tokens',
    maxOutput: '32K tokens',
    strengths: [
      'Agentic coding workflows',
      'Autonomous multi-step tasks',
      'Tool & API integration',
      'Fast iteration speed',
    ],
    description:
      "OpenAI's Codex agent platform running GPT-5.3, designed for autonomous coding tasks. Executes multi-step development workflows including writing, testing, and debugging code in sandboxed environments.",
    leaderboards: [
      { name: 'Chatbot Arena', url: 'https://lmarena.ai/' },
      { name: 'SWE-bench', url: 'https://www.swebench.com/' },
      { name: 'Scale SEAL', url: 'https://scale.com/leaderboard' },
    ],
  },
};

function getModelInfo(modelKey) {
  const key = (modelKey || '').toLowerCase().trim();
  return (
    MODEL_INFO[key] || {
      displayName: modelKey || 'Unknown',
      provider: 'Unknown',
      releaseDate: 'N/A',
      contextWindow: 'N/A',
      maxOutput: 'N/A',
      strengths: [],
      description: 'No additional information available for this model.',
    }
  );
}

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) {
    return '-';
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatTokens(count) {
  if (count === null || count === undefined || count === 0) {
    return '-';
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toLocaleString();
}

export default function VersusComparisonTable({ entries }) {
  return (
    <div className="card p-4 sm:p-6 mb-8 overflow-hidden">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Head-to-Head Comparison
      </h2>

      {/* Scrollable table wrapper for mobile */}
      <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 w-36">
                Metric
              </th>
              {entries.map((entry, i) => {
                const color = ENTRY_COLORS[i % ENTRY_COLORS.length];
                return (
                  <th
                    key={entry.appId}
                    className={`text-left py-2 px-3 text-xs font-bold uppercase tracking-wide ${color.text}`}
                  >
                    {entry.name}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            <ComparisonRow
              label="Model"
              entries={entries}
              render={(e) => getModelInfo(e.model).displayName}
            />
            <ComparisonRow
              label="Provider"
              entries={entries}
              render={(e) => getModelInfo(e.model).provider}
            />
            <ComparisonRow
              label="Generation Time"
              entries={entries}
              render={(e) => formatTime(e.generationTime)}
              highlight="lowest"
              getValue={(e) => e.generationTime}
              winLabel="Fastest"
            />
            <ComparisonRow
              label="Tokens In"
              entries={entries}
              render={(e) => formatTokens(e.tokensIn)}
            />
            <ComparisonRow
              label="Tokens Out"
              entries={entries}
              render={(e) => formatTokens(e.tokensOut)}
            />
            <ComparisonRow
              label="Total Tokens"
              entries={entries}
              render={(e) =>
                e.tokensIn !== null || e.tokensOut !== null
                  ? formatTokens((e.tokensIn || 0) + (e.tokensOut || 0))
                  : '-'
              }
            />
            <ComparisonRow
              label="Improvements"
              entries={entries}
              render={(e) =>
                e.improvementCount !== null && e.improvementCount !== undefined
                  ? e.improvementCount
                  : 0
              }
            />
            <ComparisonRow label="Agent" entries={entries} render={(e) => e.agent || '-'} />
          </tbody>
        </table>
      </div>

      {/* Model detail cards */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          About the Models
        </h3>
        <div
          className={`grid gap-4 ${
            entries.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {entries.map((entry, i) => {
            const info = getModelInfo(entry.model);
            const color = ENTRY_COLORS[i % ENTRY_COLORS.length];
            return (
              <div
                key={entry.appId}
                className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className={`text-xs font-bold uppercase tracking-wide ${color.text} mb-2`}>
                  {info.displayName}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                  {info.description}
                </p>
                <div className="space-y-1.5">
                  <ModelDetailRow label="Context Window" value={info.contextWindow} />
                  <ModelDetailRow label="Max Output" value={info.maxOutput} />
                  <ModelDetailRow label="Released" value={info.releaseDate} />
                </div>
                {info.strengths.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Key Strengths
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {info.strengths.map((s) => (
                        <span
                          key={s}
                          className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {info.leaderboards?.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Benchmark Leaderboards
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {info.leaderboards.map((lb) => (
                        <a
                          key={lb.name}
                          href={lb.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {lb.name}
                          <svg
                            className="w-2.5 h-2.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({ label, entries, render, highlight, getValue, winLabel = 'Best' }) {
  // Determine which entry "wins" for highlighting
  let winnerIndex = -1;
  if (highlight === 'lowest' && getValue) {
    let min = Infinity;
    entries.forEach((e, i) => {
      const v = getValue(e);
      if (v !== null && v !== undefined && v > 0 && v < min) {
        min = v;
        winnerIndex = i;
      }
    });
  } else if (highlight === 'highest' && getValue) {
    let max = -Infinity;
    entries.forEach((e, i) => {
      const v = getValue(e);
      if (v !== null && v !== undefined && v > 0 && v > max) {
        max = v;
        winnerIndex = i;
      }
    });
  }

  return (
    <tr>
      <td className="py-2 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {label}
      </td>
      {entries.map((entry, i) => (
        <td
          key={entry.appId}
          className={`py-2 px-3 text-gray-900 dark:text-gray-100 ${
            i === winnerIndex ? 'font-semibold' : ''
          }`}
        >
          <span className="flex items-center gap-1">
            {render(entry)}
            {i === winnerIndex && (
              <span className="text-emerald-500 text-[10px] font-bold uppercase">{winLabel}</span>
            )}
          </span>
        </td>
      ))}
    </tr>
  );
}

function ModelDetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-gray-100 font-medium">{value}</span>
    </div>
  );
}
