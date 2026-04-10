'use client';

const ENTRY_COLORS = [
  { bg: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
  { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
  { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400' },
  { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
  { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
];

export { ENTRY_COLORS };

export default function VersusVoteBar({ entries, voteCounts, totalVotes, isLoading }) {
  if (isLoading) {
    return <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />;
  }

  if (totalVotes === 0) {
    return (
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
        No votes yet — be the first to vote!
      </div>
    );
  }

  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-8">
        {entries.map((entry, i) => {
          const count = voteCounts[entry.appId] || 0;
          const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          const color = ENTRY_COLORS[i % ENTRY_COLORS.length];

          if (pct === 0) {
            return null;
          }

          return (
            <div
              key={entry.appId}
              className={`${color.bg} flex items-center justify-center text-white text-sm font-semibold transition-all duration-500`}
              style={{ width: `${pct}%`, minWidth: pct > 0 ? '2rem' : 0 }}
              title={`${entry.model}: ${count} vote${count !== 1 ? 's' : ''} (${Math.round(pct)}%)`}
            >
              {pct >= 15 ? `${Math.round(pct)}%` : ''}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        {entries.map((entry, i) => {
          const count = voteCounts[entry.appId] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const color = ENTRY_COLORS[i % ENTRY_COLORS.length];
          return (
            <span key={entry.appId} className={color.text}>
              {entry.model}: {pct}% ({count})
            </span>
          );
        })}
      </div>
    </div>
  );
}
