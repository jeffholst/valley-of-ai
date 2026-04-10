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
  const hoverBgByBg = {
    'bg-sky-500': 'hover:bg-sky-500',
    'bg-emerald-500': 'hover:bg-emerald-500',
    'bg-violet-500': 'hover:bg-violet-500',
    'bg-amber-500': 'hover:bg-amber-500',
    'bg-rose-500': 'hover:bg-rose-500',
    'bg-cyan-500': 'hover:bg-cyan-500',
    'bg-indigo-500': 'hover:bg-indigo-500',
    'bg-fuchsia-500': 'hover:bg-fuchsia-500',
  };
  const hoverBg = color.hoverBg || hoverBgByBg[color.bg] || '';

  return (
    <button
      onClick={() => onVote(appId)}
      disabled={disabled}
      className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
        isMyChoice
          ? `${color.bg} text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-current`
          : hasVoted
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
            : `bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 ${hoverBg} hover:text-white`
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
