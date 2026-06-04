'use client';

import Link from 'next/link';
import { ENTRY_COLORS } from './VersusVoteBar';

export default function VersusCard({ competition, voteTotals }) {
  const totalVotes = voteTotals?.total || 0;

  return (
    <Link href={`/versus/${competition.id}`} className="block group">
      <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Thumbnails row */}
        <div className="flex">
          {competition.entries.map((entry, i) => (
            <div
              key={entry.appId}
              className="flex-1 aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden"
            >
              {entry.thumbnailUrl && (
                <img
                  src={entry.thumbnailUrl}
                  alt={entry.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              {/* Model label overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <span
                  className={`text-xs font-bold ${ENTRY_COLORS[i % ENTRY_COLORS.length].bg} text-white px-1.5 py-0.5 rounded`}
                >
                  {entry.model}
                </span>
              </div>
              {/* Divider between thumbnails */}
              {i < competition.entries.length - 1 && (
                <div className="absolute right-0 top-0 bottom-0 w-px bg-white/30" />
              )}
            </div>
          ))}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {competition.title}
            </h3>
            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {competition.entries.length} models
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
            {competition.prompt}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {competition.category}
            </span>
            <span>
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
