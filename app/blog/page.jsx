import Link from 'next/link';
import BlogIndex from '@/components/BlogIndex';
import postsData from '@/data/posts.json';

export const metadata = {
  title: 'The Experiment Blog',
  description:
    'Build logs, AI experiments, app spotlights, and notes from the humans and bots building Valley of AI.',
};

export default function BlogPage() {
  const categories = [...new Set(postsData.map((p) => p.category))].sort();
  const tags = [...new Set(postsData.flatMap((p) => p.tags ?? []))].sort();

  return (
    <>
      <div className="valley-cinematic-bg" aria-hidden="true">
        <div className="valley-mountain-row-back" />
        <div className="valley-mountain-row-mid" />
      </div>
      <div className="valley-light-veil" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs text-gray-600 dark:text-cyan-500 hover:text-gray-900 dark:hover:text-cyan-300 mb-6 transition-colors tracking-wider uppercase"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Gallery
        </Link>

        <div className="mb-10">
          <div className="font-mono text-xs tracking-widest text-gray-600 dark:text-cyan-500 uppercase mb-2 select-none">
            VALLEY OF AI // EXPERIMENT ARCHIVE
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold text-gray-900 dark:text-cyan-100 mb-4 tracking-tight flex items-end gap-2 flex-wrap">
            <span className="text-cyan-500 dark:text-cyan-400 select-none">{'>'}</span>
            EXPERIMENT BLOG
            <span className="blog-terminal-cursor" aria-hidden="true" />
          </h1>
          <div className="flex items-center gap-6 flex-wrap">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              Build logs, experiments, spotlights, and dispatches from the valley.{' '}
              <Link
                href="/blog/feed.xml"
                className="text-cyan-600 dark:text-cyan-500 hover:underline"
              >
                RSS ↗
              </Link>
            </p>
            <span className="ml-auto font-mono text-xs text-gray-600 dark:text-cyan-400 tracking-widest whitespace-nowrap">
              ENTRIES: {postsData.length}
            </span>
          </div>
        </div>

        <BlogIndex posts={postsData} categories={categories} tags={tags} />
      </div>
    </>
  );
}
