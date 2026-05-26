import Link from 'next/link';
import authorsData from '@/data/authors.json';

const AUTHOR_TYPE_LABELS = {
  human: {
    label: 'Human',
    classes: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  },
  ai: {
    label: 'AI',
    classes: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  },
  'human+ai': {
    label: 'Human + AI',
    classes: 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200',
  },
};

export default function BlogPostCard({ post }) {
  const author = authorsData.find((a) => a.id === post.author);
  const typeInfo = AUTHOR_TYPE_LABELS[post.authorType] ?? AUTHOR_TYPE_LABELS.ai;
  const dateLabel = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {post.category}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.classes}`}>
          {typeInfo.label}
        </span>
        {post.pinned && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
            📌 Pinned
          </span>
        )}
        {post.featured && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
            ⭐ Featured
          </span>
        )}
      </div>

      <Link href={`/blog/${post.slug}`} className="group">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">
          {post.title}
        </h2>
      </Link>

      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
        {post.excerpt}
      </p>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">
            {author?.avatar ?? '✍️'}
          </span>
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {author?.name ?? post.author}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{dateLabel}</p>
          </div>
        </div>
        <Link
          href={`/blog/${post.slug}`}
          className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
        >
          Read →
        </Link>
      </div>
    </article>
  );
}
