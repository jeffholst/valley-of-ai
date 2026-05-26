'use client';

import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import BlogPostCard from './BlogPostCard';

const ALL = 'All';
const PER_PAGE = 10;

const AUTHOR_TYPES = [ALL, 'human', 'ai', 'human+ai'];
const AUTHOR_TYPE_LABELS = { human: 'Human', ai: 'AI', 'human+ai': 'Human + AI' };

export default function BlogIndex({ posts, categories, tags }) {
  const [query, setQuery] = useState('');
  const [authorType, setAuthorType] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [tag, setTag] = useState(ALL);
  const [page, setPage] = useState(1);

  const fuse = useMemo(
    () =>
      new Fuse(posts, {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'excerpt', weight: 2 },
          { name: 'category', weight: 1 },
          { name: 'tags', weight: 1 },
        ],
        threshold: 0.35,
        includeScore: false,
      }),
    [posts]
  );

  const filtered = useMemo(() => {
    let results = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : posts;

    if (authorType !== ALL) {
      results = results.filter((p) => p.authorType === authorType);
    }
    if (category !== ALL) {
      results = results.filter((p) => p.category === category);
    }
    if (tag !== ALL) {
      results = results.filter((p) => p.tags?.includes(tag));
    }

    // Pinned always first (only when no search query)
    if (!query.trim()) {
      results = [...results.filter((p) => p.pinned), ...results.filter((p) => !p.pinned)];
    }

    return results;
  }, [posts, query, authorType, category, tag, fuse]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function resetFilters() {
    setQuery('');
    setAuthorType(ALL);
    setCategory(ALL);
    setTag(ALL);
    setPage(1);
  }

  const hasActiveFilters = query || authorType !== ALL || category !== ALL || tag !== ALL;

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <input
          type="search"
          placeholder="Search posts…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-48 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <select
          value={authorType}
          onChange={(e) => {
            setAuthorType(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Filter by author type"
        >
          {AUTHOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === ALL ? 'All authors' : AUTHOR_TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Filter by category"
        >
          <option value={ALL}>All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Filter by tag"
        >
          <option value={ALL}>All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {paginated.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">No posts match your filters.</p>
          <button
            onClick={resetFilters}
            className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
