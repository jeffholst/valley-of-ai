'use client';

import Link from 'next/link';
import { useVotes } from '@/hooks/useVotes';
import VoteButtons from '@/components/VoteButtons';

export default function AppCard({ app }) {
  const { upvoteCount, downvoteCount, myVote, isLoading, isVoting, vote } = useVotes(app.id);

  const formattedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="card overflow-hidden group">
      <Link href={`/showcase/${app.id}`} className="block" tabIndex={-1} aria-hidden="true">
        <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 relative overflow-hidden">
          {app.thumbnailUrl ? (
            <img
              src={app.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-50">🤖</span>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white transition-colors">
            <Link
              href={`/showcase/${app.id}`}
              className="hover:text-primary-600 dark:hover:text-primary-400"
            >
              {app.name}
            </Link>
          </h3>
          <VoteButtons
            upvoteCount={upvoteCount}
            downvoteCount={downvoteCount}
            myVote={myVote}
            isLoading={isLoading}
            isVoting={isVoting}
            onVote={vote}
            size="sm"
          />
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {app.shortDescription}
        </p>

        <div className="flex items-center justify-between">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
            {app.category}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`/improve?app=${encodeURIComponent(app.id)}&name=${encodeURIComponent(app.name)}`}
              className="inline-flex items-center gap-0.5 text-[0.72rem] font-semibold tracking-wide text-slate-900 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full px-2 py-0.5 whitespace-nowrap cursor-pointer transition-transform hover:scale-105"
              title="Suggest an improvement"
            >
              💡 Improve
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
