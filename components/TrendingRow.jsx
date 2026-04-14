'use client';

import AppCard from '@/components/AppCard';

export default function TrendingRow({ apps, voteCounts }) {
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
