'use client';

import AppCard from '@/components/AppCard';

export default function TrendingRow({ apps, voteCounts, isLoading }) {
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
        <div className="flex gap-4 overflow-x-auto pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-64 flex-shrink-0">
              <div className="card overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!apps || apps.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span aria-hidden="true">🔥</span> Trending
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
        {apps.map((app) => (
          <div key={app.id} className="w-64 flex-shrink-0 snap-start">
            <AppCard app={app} initialCounts={voteCounts?.[app.id]} />
          </div>
        ))}
      </div>
    </div>
  );
}
