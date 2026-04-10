'use client';

import { ENTRY_COLORS } from './VersusVoteBar';

export default function VersusVoteButton({
  appId,
  entryIndex,
  myVote,
  isVoting,
  isLoading,
  onVote,
}) {
  const isMyChoice = myVote === appId;
  const hasVoted = !!myVote;
  const disabled = hasVoted || isVoting || isLoading;
  const color = ENTRY_COLORS[entryIndex % ENTRY_COLORS.length];

  return (
    <button
      onClick={() => onVote(appId)}
      disabled={disabled}
      className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
        isMyChoice
          ? `${color.bg} text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-current`
          : hasVoted
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
            : `bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:${color.bg} hover:text-white`
      }`}
    >
      {isVoting
        ? 'Voting...'
        : isMyChoice
          ? 'Your Pick!'
          : hasVoted
            ? 'Vote Cast'
            : 'Vote for This'}
    </button>
  );
}
