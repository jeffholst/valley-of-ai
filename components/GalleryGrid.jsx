'use client';

import AppCard from '@/components/AppCard';

export default function GalleryGrid({ apps, earthquake, hasFilters, onResetFilters }) {
  if (apps.length === 0) {
    return (
      <div className="text-center py-16">
        {hasFilters ? (
          <>
            <p className="text-gray-500 dark:text-gray-400 mb-4">No apps match your filters.</p>
            <button onClick={onResetFilters} className="btn-secondary">
              Clear Filters
            </button>
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No apps available yet.</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6${earthquake ? ' earthquake-cards' : ''}`}
    >
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
