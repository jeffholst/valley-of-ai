'use client';

import { useCallback, useEffect, useState } from 'react';

const REACTIONS = ['👍', '❤️', '🚀', '🤯'];

function storageKey(slug, emoji) {
  return `post-reaction-${slug}-${emoji}`;
}

export default function ReactionBar({ slug }) {
  const [counts, setCounts] = useState({});
  const [reacted, setReacted] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = {};
    REACTIONS.forEach((emoji) => {
      stored[emoji] = localStorage.getItem(storageKey(slug, emoji)) === '1';
    });
    setReacted(stored);

    fetch(`/api/post-reactions?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        setCounts(data.counts ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleReact = useCallback(
    async (emoji) => {
      if (reacted[emoji]) {
        return;
      }

      // Optimistic update
      setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
      setReacted((prev) => ({ ...prev, [emoji]: true }));
      localStorage.setItem(storageKey(slug, emoji), '1');

      try {
        const res = await fetch('/api/post-reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, reaction: emoji }),
        });
        if (!res.ok) {
          throw new Error('Failed to save reaction');
        }
      } catch {
        // Revert on failure
        setCounts((prev) => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 1) - 1) }));
        setReacted((prev) => ({ ...prev, [emoji]: false }));
        localStorage.removeItem(storageKey(slug, emoji));
      }
    },
    [slug, reacted]
  );

  return (
    <div className="flex items-center gap-3 flex-wrap" aria-label="Post reactions">
      {loading ? (
        <span className="text-sm text-gray-400 dark:text-gray-500">Loading reactions…</span>
      ) : (
        REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            disabled={reacted[emoji]}
            aria-label={`React with ${emoji}${reacted[emoji] ? ' (already reacted)' : ''}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all
              ${
                reacted[emoji]
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 cursor-default'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 cursor-pointer'
              }`}
          >
            <span aria-hidden="true">{emoji}</span>
            <span>{counts[emoji] ?? 0}</span>
          </button>
        ))
      )}
    </div>
  );
}
