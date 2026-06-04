import { verifyTurnstile } from '@/lib/turnstile';
import { escapeMd } from '@/lib/markdown';

const GITHUB_API_URL = 'https://api.github.com';

const VALID_CATEGORIES = new Set([
  'Build Logs',
  'AI Experiments',
  'App Spotlights',
  'Human Notes',
  'Bot Notes',
  'Tutorials',
  'Release Notes',
]);

const VALID_AUTHOR_TYPES = new Set(['ai', 'human', 'human+ai']);

export async function POST(request) {
  if (!process.env.GITHUB_SUGGESTIONS_TOKEN || !process.env.GITHUB_REPO) {
    return Response.json({ error: 'Submissions unavailable' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    turnstileToken,
    title,
    category,
    description,
    keyPoints,
    authorType,
    relatedApps,
    requestor,
  } = body;

  if (!title || !category || !description) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (title.trim().length < 10 || title.trim().length > 200) {
    return Response.json({ error: 'Title must be 10–200 characters' }, { status: 400 });
  }

  if (!VALID_CATEGORIES.has(category)) {
    return Response.json({ error: 'Invalid category' }, { status: 400 });
  }

  if (description.trim().length < 20 || description.trim().length > 1000) {
    return Response.json({ error: 'Description must be 20–1000 characters' }, { status: 400 });
  }

  if (authorType && !VALID_AUTHOR_TYPES.has(authorType)) {
    return Response.json({ error: 'Invalid author type' }, { status: 400 });
  }

  // Verify Turnstile bot protection (skipped in development)
  if (process.env.NODE_ENV !== 'development') {
    if (!turnstileToken) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    let ip = request.headers.get('cf-connecting-ip')?.trim() || '';
    if (!ip) {
      const xff = request.headers.get('x-forwarded-for') || '';
      if (xff) {
        ip =
          xff
            .split(',')
            .map((part) => part.trim())
            .find((part) => part.length > 0) || '';
      }
    }
    const turnstileOk = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileOk) {
      return Response.json({ error: 'Bot verification failed' }, { status: 403 });
    }
  }

  // Build issue body matching the blog_post.yml template structure
  const safeTitle = escapeMd(String(title).trim());
  const safeCategory = escapeMd(String(category));
  const safeDescription = escapeMd(String(description).trim());
  const safeKeyPoints = keyPoints ? escapeMd(String(keyPoints).trim()) : null;
  const safeAuthorType = escapeMd(String(authorType || 'ai'));
  const safeRelatedApps = relatedApps ? escapeMd(String(relatedApps).trim()) : null;
  const safeRequestor = requestor ? escapeMd(String(requestor).trim()) : null;

  const requestorLine = safeRequestor
    ? `**Requestor:** ${safeRequestor}`
    : '**Requestor:** anonymous';

  const issueBody = [
    `### Category\n\n${safeCategory}`,
    `### Title (suggested)\n\n${safeTitle}`,
    `### Description\n\n${safeDescription}`,
    safeKeyPoints ? `### Key Points\n\n${safeKeyPoints}` : null,
    `### Suggested Author Type\n\n${safeAuthorType}`,
    safeRelatedApps ? `### Related Apps\n\n${safeRelatedApps}` : null,
    requestorLine,
  ]
    .filter(Boolean)
    .join('\n\n');

  const normalizedTitle = title.replace(/\s+/g, ' ').trim();
  const repo = process.env.GITHUB_REPO;
  const res = await fetch(`${GITHUB_API_URL}/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_SUGGESTIONS_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `Blog Idea: ${normalizedTitle.slice(0, 80)}${normalizedTitle.length > 80 ? '…' : ''}`,
      body: issueBody,
      labels: ['blog-post', 'status:pending'],
    }),
  });

  if (!res.ok) {
    console.error('GitHub API error:', res.status, await res.text());
    return Response.json({ error: 'Failed to submit blog idea' }, { status: 502 });
  }

  const issue = await res.json();
  return Response.json({ issueNumber: issue.number, issueUrl: issue.html_url }, { status: 201 });
}
