import Link from 'next/link';
import authorsData from '@/data/authors.json';

const AUTHOR_TYPE_SIGNAL = {
  human: {
    label: 'HUMAN',
    dotClass: 'bg-blue-400',
    badgeClass: 'text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    topBarClass: 'bg-blue-500',
  },
  ai: {
    label: 'AI_SRC',
    dotClass: 'bg-purple-400',
    badgeClass: 'text-purple-600 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    topBarClass: 'bg-purple-500',
  },
  'human+ai': {
    label: 'COLLAB',
    dotClass: 'bg-teal-400',
    badgeClass: 'text-teal-600 dark:text-teal-300 border-teal-300 dark:border-teal-700',
    topBarClass: 'bg-teal-500',
  },
};

export default function BlogPostCard({ post, recordIndex }) {
  const author = authorsData.find((a) => a.id === post.author);
  const signal = AUTHOR_TYPE_SIGNAL[post.authorType] ?? AUTHOR_TYPE_SIGNAL.ai;
  const dateLabel = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <article className="blog-hud-card bg-white dark:bg-[rgba(4,12,30,0.72)] rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-[rgba(80,200,255,0.18)] p-6 flex flex-col gap-3 hover:shadow-md dark:hover:border-[rgba(80,220,255,0.45)] transition-all backdrop-blur-sm overflow-hidden">
      {/* Author-type accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${signal.topBarClass} opacity-70`} />

      {/* Record number + badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        {recordIndex !== null && recordIndex !== undefined && (
          <span className="font-mono text-[10px] text-gray-400 dark:text-cyan-800 tracking-widest select-none">
            REC {String(recordIndex).padStart(3, '0')}
          </span>
        )}
        <span className="font-mono text-[10px] px-1.5 py-0.5 border text-gray-500 dark:text-cyan-700 border-gray-300 dark:border-cyan-900 tracking-wider">
          [ {post.category.toUpperCase().replace(/ /g, '_')} ]
        </span>
        <span
          className={`font-mono text-[10px] px-1.5 py-0.5 border tracking-wider flex items-center gap-1 ${signal.badgeClass}`}
        >
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${signal.dotClass} opacity-80`} />
          {signal.label}
        </span>
        {post.pinned && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 border border-amber-400 text-amber-600 dark:text-amber-400 tracking-wider">
            ◆ PINNED
          </span>
        )}
        {post.featured && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 border border-orange-400 text-orange-600 dark:text-orange-400 tracking-wider">
            ★ FEATURED
          </span>
        )}
      </div>

      <Link href={`/blog/${post.slug}`} className="group">
        <h2 className="text-base font-bold text-gray-900 dark:text-cyan-100 group-hover:text-purple-600 dark:group-hover:text-cyan-300 transition-colors leading-snug">
          {post.title}
        </h2>
      </Link>

      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
        {post.excerpt}
      </p>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-[rgba(80,200,255,0.1)]">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">
            {author?.avatar ?? '✍️'}
          </span>
          <div>
            <p className="text-xs font-mono text-gray-600 dark:text-cyan-400">
              {author?.name ?? post.author}
            </p>
            <p className="text-[10px] font-mono text-gray-400 dark:text-cyan-800 tabular-nums tracking-wider">
              {dateLabel}
            </p>
          </div>
        </div>
        <Link
          href={`/blog/${post.slug}`}
          className="font-mono text-[10px] tracking-widest text-gray-500 dark:text-cyan-600 hover:text-purple-600 dark:hover:text-cyan-300 transition-colors uppercase"
        >
          READ &#x2192;
        </Link>
      </div>
    </article>
  );
}
