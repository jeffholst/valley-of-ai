import postsData from '@/data/posts.json';
import authorsData from '@/data/authors.json';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.valleyofai.com';
const FEED_LIMIT = 20;

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const recent = postsData.slice(0, FEED_LIMIT);

  const items = recent
    .map((post) => {
      const author = authorsData.find((a) => a.id === post.author);
      const pubDate = new Date(post.date).toUTCString();
      const link = `${SITE_URL}/blog/${post.slug}`;
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <author>${escapeXml(author?.name ?? post.author)}</author>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Experiment Log — Valley of AI</title>
    <link>${SITE_URL}/blog</link>
    <description>Build logs, AI experiments, app spotlights, and notes from the humans and bots building Valley of AI.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
