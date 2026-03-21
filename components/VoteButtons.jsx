'use client';

export default function VoteButtons({ upvoteCount, downvoteCount, myVote, isLoading, isVoting, onVote, size = 'md' }) {
  const disabled = !!myVote || isVoting || isLoading;

  const handleClick = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {onVote(type);}
  };

  if (size === 'sm') {
    return (
      <div className="inline-flex items-center gap-1">
        <button
          onClick={(e) => handleClick(e, 'up')}
          disabled={disabled}
          title={myVote === 'up' ? 'You liked this' : 'Like'}
          className={`inline-flex items-center gap-0.5 text-sm transition-colors disabled:cursor-not-allowed ${
            myVote === 'up'
              ? 'text-green-500'
              : myVote
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-green-500'
          }`}
        >
          👍 {isLoading ? '·' : upvoteCount}
        </button>
        <button
          onClick={(e) => handleClick(e, 'down')}
          disabled={disabled}
          title={myVote === 'down' ? 'You disliked this' : 'Dislike'}
          className={`inline-flex items-center gap-0.5 text-sm transition-colors disabled:cursor-not-allowed ${
            myVote === 'down'
              ? 'text-red-500'
              : myVote
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
          }`}
        >
          👎 {isLoading ? '·' : downvoteCount}
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={(e) => handleClick(e, 'up')}
        disabled={disabled}
        title={myVote === 'up' ? 'You liked this' : 'Like'}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed ${
          myVote === 'up'
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
            : myVote
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900 hover:text-green-700 dark:hover:text-green-300'
        }`}
      >
        👍 {isLoading ? '…' : upvoteCount}
      </button>
      <button
        onClick={(e) => handleClick(e, 'down')}
        disabled={disabled}
        title={myVote === 'down' ? 'You disliked this' : 'Dislike'}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed ${
          myVote === 'down'
            ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
            : myVote
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300'
        }`}
      >
        👎 {isLoading ? '…' : downvoteCount}
      </button>
    </div>
  );
}
