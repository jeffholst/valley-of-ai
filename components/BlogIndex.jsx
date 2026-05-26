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
      <div className="bg-white dark:bg-[rgba(4,12,30,0.7)] rounded-xl border border-gray-200 dark:border-[rgba(80,200,255,0.2)] p-4 mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap backdrop-blur-sm">
        <span className="hidden sm:block font-mono text-xs text-gray-400 dark:text-cyan-700 tracking-widest uppercase select-none whitespace-nowrap">
          FILTER BY:
        </span>
        <input
          type="search"
          placeholder="> search transmissions…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-48 rounded-lg border border-gray-300 dark:border-[rgba(80,200,255,0.25)] bg-gray-50 dark:bg-[rgba(4,12,40,0.8)] px-3 py-2 text-sm text-gray-900 dark:text-cyan-100 placeholder-gray-400 dark:placeholder-cyan-800 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600"
        />

        <select
          value={authorType}
          onChange={(e) => {
            setAuthorType(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-[rgba(80,200,255,0.2)] bg-gray-50 dark:bg-[rgba(4,12,40,0.8)] px-3 py-2 text-sm text-gray-900 dark:text-cyan-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600"
          aria-label="Filter by author type"
        >
          {AUTHOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === ALL ? 'ALL AUTHORS' : AUTHOR_TYPE_LABELS[t].toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-[rgba(80,200,255,0.2)] bg-gray-50 dark:bg-[rgba(4,12,40,0.8)] px-3 py-2 text-sm text-gray-900 dark:text-cyan-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600"
          aria-label="Filter by category"
        >
          <option value={ALL}>ALL CATEGORIES</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-[rgba(80,200,255,0.2)] bg-gray-50 dark:bg-[rgba(4,12,40,0.8)] px-3 py-2 text-sm text-gray-900 dark:text-cyan-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600"
          aria-label="Filter by tag"
        >
          <option value={ALL}>ALL TAGS</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="font-mono text-xs text-cyan-600 dark:text-cyan-500 hover:underline whitespace-nowrap tracking-wider uppercase"
          >
            [ CLEAR ]
          </button>
        )}
      </div>

      {/* Results */}
      {paginated.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-mono text-xs tracking-widest text-gray-400 dark:text-cyan-800 uppercase mb-2">
            NO SIGNAL
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No transmissions match your filters.
          </p>
          <button
            onClick={resetFilters}
            className="mt-3 font-mono text-xs text-cyan-600 dark:text-cyan-500 hover:underline tracking-wider uppercase"
          >
            [ CLEAR FILTERS ]
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((post) => (
            <BlogPostCard key={post.slug} post={post} recordIndex={posts.indexOf(post) + 1} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="font-mono text-xs tracking-wider uppercase px-4 py-2 border border-gray-300 dark:border-[rgba(80,200,255,0.25)] text-gray-600 dark:text-cyan-400 disabled:opacity-30 hover:border-cyan-400 dark:hover:border-cyan-400 transition-colors"
          >
            &#x2190; PREV
          </button>
          <span className="font-mono text-xs text-gray-400 dark:text-cyan-700 tracking-widest">
            PAGE {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="font-mono text-xs tracking-wider uppercase px-4 py-2 border border-gray-300 dark:border-[rgba(80,200,255,0.25)] text-gray-600 dark:text-cyan-400 disabled:opacity-30 hover:border-cyan-400 dark:hover:border-cyan-400 transition-colors"
          >
            NEXT &#x2192;
          </button>
        </div>
      )}
    </div>
  );
}
