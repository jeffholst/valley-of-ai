import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import postsData from '@/data/posts.json';
import authorsData from '@/data/authors.json';
import appsData from '@/data/apps.json';
import ReactionBar from '@/components/ReactionBar';
import GiscusComments from '@/components/GiscusComments';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

const AUTHOR_TYPE_LABELS = {
  human: 'Human-written',
  ai: 'AI-written',
  'human+ai': 'Human + AI',
};

export async function generateStaticParams() {
  return postsData.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = postsData.find((p) => p.slug === slug);
  if (!post) {
    return {};
  }
  return {
    title: post.title,
    description: post.excerpt,
  };
}

async function getPostContent(filename) {
  const filepath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(filepath, 'utf8');
  const { content } = matter(raw);
  const processed = await remark().use(html).process(content);
  return processed.toString();
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = postsData.find((p) => p.slug === slug);
  if (!post) {
    notFound();
  }

  const contentHtml = await getPostContent(post.filename);
  const author = authorsData.find((a) => a.id === post.author);
  const relatedApps = (post.relatedApps ?? [])
    .map((id) => appsData.find((a) => a.id === id))
    .filter(Boolean);

  const dateLabel = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const postIndex = postsData.findIndex((p) => p.slug === slug);
  const prevPost = postsData[postIndex + 1] ?? null;
  const nextPost = postsData[postIndex - 1] ?? null;

  return (
    <>
      <div className="valley-cinematic-bg" aria-hidden="true">
        <div className="valley-mountain-row-back" />
        <div className="valley-mountain-row-mid" />
      </div>
      <div className="valley-light-veil" aria-hidden="true" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          The Experiment Log
        </Link>

        {/* AI Transparency note */}
        {post.aiTransparencyNote && (
          <div className="mb-6 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-5 py-4 text-sm text-purple-800 dark:text-purple-300">
            <span className="font-semibold">AI Transparency: </span>
            {post.aiTransparencyNote}
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {post.category}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
              {AUTHOR_TYPE_LABELS[post.authorType] ?? post.authorType}
            </span>
            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
            {post.title}
          </h1>

          {/* Author card */}
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              {author?.avatar ?? '✍️'}
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {author?.name ?? post.author}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {author?.bio ?? ''} · {dateLabel}
              </p>
            </div>
          </div>
        </header>

        {/* Post body */}
        <div
          className="prose prose-gray dark:prose-invert max-w-none mb-10
            prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8
            prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
            prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:rounded-xl
            prose-blockquote:border-l-purple-400 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-300"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Related apps */}
        {relatedApps.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Related Apps</h2>
            <div className="flex flex-col gap-2">
              {relatedApps.map((app) => (
                <Link
                  key={app.id}
                  href={`/showcase/${app.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                >
                  <span className="text-2xl" aria-hidden="true">
                    🎮
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{app.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {app.shortDescription}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 ml-auto text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reactions */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Reactions</h2>
          <ReactionBar slug={post.slug} />
        </section>

        {/* Prev / Next navigation */}
        <nav
          className="grid grid-cols-2 gap-4 py-6 border-t border-gray-200 dark:border-gray-700 mb-10"
          aria-label="Post navigation"
        >
          {prevPost ? (
            <Link href={`/blog/${prevPost.slug}`} className="flex flex-col gap-1 group">
              <span className="text-xs text-gray-400 dark:text-gray-500">← Older</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                {prevPost.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {nextPost ? (
            <Link href={`/blog/${nextPost.slug}`} className="flex flex-col gap-1 text-right group">
              <span className="text-xs text-gray-400 dark:text-gray-500">Newer →</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                {nextPost.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>

        {/* Comments */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Comments</h2>
          <GiscusComments slug={post.slug} />
        </section>
      </div>
    </>
  );
}
