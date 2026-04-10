'use client';

import VersusVoteButton from './VersusVoteButton';
import { ENTRY_COLORS } from './VersusVoteBar';

export default function VersusEntryCard({
  entry,
  entryIndex,
  myVote,
  isVoting,
  isLoading,
  onVote,
}) {
  const color = ENTRY_COLORS[entryIndex % ENTRY_COLORS.length];
  const generationTime = entry.generationTime
    ? entry.generationTime < 60
      ? `${entry.generationTime}s`
      : `${Math.floor(entry.generationTime / 60)}m ${entry.generationTime % 60}s`
    : null;

  return (
    <div className={`card overflow-hidden border-t-4 ${color.bg.replace('bg-', 'border-')}`}>
      {/* Thumbnail */}
      <a
        href={entry.appPath}
        target="_blank"
        rel="noopener noreferrer"
        className="block group/thumb"
      >
        <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
          {entry.thumbnailUrl && (
            <img
              src={entry.thumbnailUrl}
              alt={`Preview of ${entry.name}`}
              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover/thumb:opacity-100 transition-opacity text-white font-semibold text-sm bg-black/50 px-3 py-1.5 rounded-full">
              Launch App
            </span>
          </div>
        </div>
      </a>

      <div className="p-4 space-y-3">
        {/* Model badge + name */}
        <div>
          <span
            className={`inline-block text-xs font-bold uppercase tracking-wide ${color.text} mb-1`}
          >
            {entry.model}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white">{entry.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
            {entry.shortDescription}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span title="Agent">Agent: {entry.agent}</span>
          {generationTime && <span title="Generation time">Time: {generationTime}</span>}
          {entry.tokensIn !== null && entry.tokensIn !== undefined && (
            <span title="Tokens used">
              Tokens: {((entry.tokensIn + (entry.tokensOut || 0)) / 1000).toFixed(1)}k
            </span>
          )}
        </div>

        {/* Launch + Vote */}
        <div className="space-y-2 pt-1">
          <a
            href={entry.appPath}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
          >
            Launch App
          </a>
          <VersusVoteButton
            appId={entry.appId}
            entryIndex={entryIndex}
            myVote={myVote}
            isVoting={isVoting}
            isLoading={isLoading}
            onVote={onVote}
          />
        </div>
      </div>
    </div>
  );
}
