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
import BlogHoloPanel from '@/components/BlogHoloPanel';
import PostLog from '@/components/PostLog';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const POST_LOGS_DIR = path.join(process.cwd(), 'content', 'posts', 'logs');

function readPostLog(slug) {
  const logPath = path.join(POST_LOGS_DIR, `${slug}.jsonl`);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[PostLog] malformed line in ${slug}.jsonl:`, err.message);
        }
        return null;
      }
    })
    .filter(Boolean);
}

const AUTHOR_TYPE_SIGNAL = {
  human: {
    label: 'HUMAN_WRITTEN',
    dotClass: 'bg-blue-400',
    textClass: 'text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  },
  ai: {
    label: 'AI_GENERATED',
    dotClass: 'bg-purple-400',
    textClass: 'text-purple-600 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  },
  'human+ai': {
    label: 'COLLABORATIVE',
    dotClass: 'bg-teal-400',
    textClass: 'text-teal-600 dark:text-teal-300 border-teal-300 dark:border-teal-700',
  },
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

async function getPostContent(filename, title) {
  const filepath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(filepath, 'utf8');
  const { content } = matter(raw);
  const processed = await remark().use(html).process(`# ${title}\n\n${content}`);
  return processed.toString();
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = postsData.find((p) => p.slug === slug);
  if (!post) {
    notFound();
  }

  const contentHtml = await getPostContent(post.filename, post.title);
  const logEntries = readPostLog(post.slug);
  const author = authorsData.find((a) => a.id === post.author);
  const relatedApps = (post.relatedApps ?? [])
    .map((id) => appsData.find((a) => a.id === id))
    .filter(Boolean);

  const dateLabel = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const postIndex = postsData.findIndex((p) => p.slug === slug);
  const prevPost = postsData[postIndex + 1] ?? null;
  const nextPost = postsData[postIndex - 1] ?? null;
  const signal = AUTHOR_TYPE_SIGNAL[post.authorType] ?? AUTHOR_TYPE_SIGNAL.ai;

  return (
    <>
      <div className="valley-cinematic-bg" aria-hidden="true">
        <div className="valley-mountain-row-back" />
        <div className="valley-mountain-row-mid" />
      </div>
      <div className="valley-light-veil" aria-hidden="true" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-mono text-xs text-gray-600 dark:text-cyan-500 hover:text-gray-900 dark:hover:text-cyan-300 mb-8 transition-colors tracking-wider uppercase"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Experiment Blog
        </Link>

        {/* AI Transparency note */}
        {post.aiTransparencyNote && (
          <div className="mb-6 border border-cyan-400 dark:border-cyan-700 bg-cyan-50 dark:bg-[rgba(0,40,60,0.45)] px-5 py-4 backdrop-blur-sm">
            <div className="font-mono text-[10px] text-cyan-700 dark:text-cyan-400 tracking-widest uppercase mb-1.5">
              // AI_TRANSPARENCY_DISCLOSURE
            </div>
            <p className="text-sm text-cyan-900 dark:text-cyan-300">{post.aiTransparencyNote}</p>
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="font-mono text-[10px] px-1.5 py-0.5 border text-gray-600 dark:text-cyan-400 border-gray-300 dark:border-cyan-700 tracking-wider">
              [ {post.category.toUpperCase().replace(/ /g, '_')} ]
            </span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 border tracking-wider flex items-center gap-1 ${signal.textClass}`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${signal.dotClass} opacity-80`}
              />
              {signal.label}
            </span>
            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] text-gray-500 dark:text-cyan-500 tracking-wider"
              >
                #{tag}
              </span>
            ))}
            {post.pinned && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 border border-amber-400 text-amber-600 dark:text-amber-400 tracking-wider">
                ◆ PINNED
              </span>
            )}
          </div>

          {/* Author card */}
          <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[rgba(80,200,255,0.2)] bg-white dark:bg-[rgba(4,12,30,0.55)] backdrop-blur-sm">
            <span className="text-2xl" aria-hidden="true">
              {author?.avatar ?? '✍️'}
            </span>
            <div>
              <p className="font-mono text-sm font-semibold text-gray-900 dark:text-cyan-200">
                {author?.name ?? post.author}
              </p>
              <p className="font-mono text-[10px] text-gray-500 dark:text-cyan-500 tracking-wider tabular-nums">
                {dateLabel}
              </p>
            </div>
          </div>
        </header>

        {/* Post body */}
        <div className="mb-12">
          <div className="font-mono text-[10px] text-gray-600 dark:text-cyan-500 tracking-widest uppercase mb-0">
            // TRANSMISSION_BODY
          </div>
          <BlogHoloPanel>
            <div
              className="prose prose-gray dark:prose-invert max-w-none
                prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8
                dark:prose-headings:text-cyan-100
                prose-a:text-purple-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                prose-code:bg-gray-100 dark:prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:rounded-xl
                prose-blockquote:border-l-purple-400 dark:prose-blockquote:border-l-cyan-600 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-300
                prose-hr:border-gray-200 dark:prose-hr:border-cyan-800"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </BlogHoloPanel>
        </div>

        {/* Related apps */}
        {relatedApps.length > 0 && (
          <section className="mb-10">
            <div className="font-mono text-[10px] text-gray-600 dark:text-cyan-500 tracking-widest uppercase mb-3">
              // RELATED_APPS
            </div>
            <div className="flex flex-col gap-2">
              {relatedApps.map((app) => (
                <Link
                  key={app.id}
                  href={`/showcase/${app.id}`}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[rgba(80,200,255,0.18)] bg-white dark:bg-[rgba(4,12,30,0.55)] hover:border-cyan-400 dark:hover:border-cyan-400 transition-colors backdrop-blur-sm"
                >
                  <span className="text-xl" aria-hidden="true">
                    🎮
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium text-gray-900 dark:text-cyan-200">
                      {app.name}
                    </p>
                    <p className="font-mono text-[10px] text-gray-500 dark:text-cyan-500 line-clamp-1 tracking-wide">
                      {app.shortDescription}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400 dark:text-cyan-600 flex-shrink-0"
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
          <div className="font-mono text-[10px] text-gray-600 dark:text-cyan-500 tracking-widest uppercase mb-3">
            // REACTION_FEED
          </div>
          <ReactionBar slug={post.slug} />
        </section>

        {/* Pipeline log */}
        {logEntries.length > 0 && (
          <section className="mb-10">
            <PostLog entries={logEntries} />
          </section>
        )}

        {/* Prev / Next navigation */}
        <nav className="grid grid-cols-2 gap-3 mb-10" aria-label="Post navigation">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="flex flex-col gap-1.5 group p-4 border border-gray-200 dark:border-[rgba(80,200,255,0.2)] bg-white dark:bg-[rgba(4,12,30,0.55)] hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors backdrop-blur-sm"
            >
              <span className="font-mono text-[10px] text-gray-600 dark:text-cyan-400 tracking-widest uppercase">
                ← PREV_TX
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-cyan-200 group-hover:text-purple-600 dark:group-hover:text-cyan-100 transition-colors line-clamp-2">
                {prevPost.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="flex flex-col gap-1.5 text-right group p-4 border border-gray-200 dark:border-[rgba(80,200,255,0.2)] bg-white dark:bg-[rgba(4,12,30,0.55)] hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors backdrop-blur-sm"
            >
              <span className="font-mono text-[10px] text-gray-600 dark:text-cyan-400 tracking-widest uppercase">
                NEXT_TX →
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-cyan-200 group-hover:text-purple-600 dark:group-hover:text-cyan-100 transition-colors line-clamp-2">
                {nextPost.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>

        {/* Comments */}
        <section>
          <div className="font-mono text-[10px] text-gray-600 dark:text-cyan-500 tracking-widest uppercase mb-4">
            // OPEN_CHANNEL
          </div>
          <GiscusComments slug={post.slug} />
        </section>
      </div>
    </>
  );
}
