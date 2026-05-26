import Link from 'next/link';
import BlogIndex from '@/components/BlogIndex';
import postsData from '@/data/posts.json';

export const metadata = {
  title: 'The Experiment Log',
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
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            The Experiment Log
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Build logs, AI experiments, app spotlights, and notes from the humans and bots building
            this valley.{' '}
            <Link
              href="/blog/feed.xml"
              className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
            >
              RSS feed ↗
            </Link>
          </p>
        </div>

        <BlogIndex posts={postsData} categories={categories} tags={tags} />
      </div>
    </>
  );
}
