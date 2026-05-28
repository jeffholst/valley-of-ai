'use client';

import { useRouter } from 'next/navigation';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'trending', label: 'Trending' },
];

export const PER_PAGE_OPTIONS = [12, 30, 100];

export default function GalleryPagination({
  sortedAppsCount,
  currentPage,
  totalPages,
  perPage,
  sortBy,
  onPageChange,
  onPerPageChange,
  onSortChange,
  onTrendingShortcut,
  onNewestShortcut,
  navigationOnly = false,
  apps = [],
}) {
  const router = useRouter();

  const handleFeelingLucky = () => {
    if (apps.length === 0) {
      return;
    }
    const randomApp = apps[Math.floor(Math.random() * apps.length)];
    router.push(`/showcase/${randomApp.id}`);
  };
  return (
    <>
      {/* Controls row — hidden when rendering as bottom-only page navigation */}
      {!navigationOnly && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{sortedAppsCount}</span>{' '}
              apps available
            </p>
            {apps.length > 0 && (
              <button
                onClick={handleFeelingLucky}
                className="inline-flex items-center gap-0.5 text-[0.72rem] font-semibold tracking-wide text-slate-900 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full px-2.5 py-0.5 whitespace-nowrap transition-transform hover:scale-105"
                title="Feeling Lucky"
                aria-label="Feeling Lucky"
              >
                🎲<span className="hidden sm:inline"> Feeling Lucky</span>
              </button>
            )}
            {onTrendingShortcut && (
              <button
                onClick={onTrendingShortcut}
                className="inline-flex items-center gap-0.5 text-[0.72rem] font-semibold tracking-wide text-emerald-950 bg-gradient-to-r from-emerald-300 to-cyan-300 rounded-full px-2.5 py-0.5 whitespace-nowrap transition-transform hover:scale-105"
                title="Trending"
                aria-label="Trending"
              >
                🔥<span className="hidden sm:inline"> Trending</span>
              </button>
            )}
            {onNewestShortcut && (
              <button
                onClick={onNewestShortcut}
                className="inline-flex items-center gap-0.5 text-[0.72rem] font-semibold tracking-wide text-sky-950 bg-gradient-to-r from-sky-300 to-indigo-300 rounded-full px-2.5 py-0.5 whitespace-nowrap transition-transform hover:scale-105"
                title="Newest"
                aria-label="Newest"
              >
                ✨<span className="hidden sm:inline"> Newest</span>
              </button>
            )}
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="perPage" className="text-sm text-gray-600 dark:text-gray-400">
                Show:
              </label>
              <select
                id="perPage"
                value={perPage}
                onChange={(e) => onPerPageChange(Number(e.target.value))}
                className="input py-1.5 w-auto"
              >
                {PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-400">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="input py-1.5 w-auto"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * perPage + 1}–
            {Math.min(currentPage * perPage, sortedAppsCount)} of {sortedAppsCount}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                )
                .reduce((acc, page, idx, arr) => {
                  if (idx > 0 && page - arr[idx - 1] > 1) {
                    acc.push('...');
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => onPageChange(item)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === item
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
