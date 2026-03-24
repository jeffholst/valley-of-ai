import { verifyTurnstile } from '@/lib/turnstile';
import { escapeMd } from '@/lib/markdown';

const GITHUB_API_URL = 'https://api.github.com';

// App IDs follow the format YYYY/MM/DD/slug (e.g. "2026/03/21/my-app")
const APP_ID_RE = /^\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+$/;

export async function POST(request) {
  if (!process.env.GITHUB_SUGGESTIONS_TOKEN || !process.env.GITHUB_REPO) {
    return Response.json({ error: 'Improvements unavailable' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { turnstileToken, appId, appName, requestor, description } = body;

  if (!appId || !description) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!APP_ID_RE.test(appId)) {
    return Response.json({ error: 'Invalid app ID' }, { status: 400 });
  }

  if (description.length < 10 || description.length > 1000) {
    return Response.json({ error: 'Description must be 10–1000 characters' }, { status: 400 });
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

  // Build GitHub issue
  const safeAppName = appName ? escapeMd(String(appName)) : null;
  const safeRequestor = requestor ? escapeMd(String(requestor)) : null;
  const requestorLine = safeRequestor
    ? `**Requestor:** ${safeRequestor}`
    : '**Requestor:** anonymous';
  const appLine = safeAppName
    ? `**App:** [${safeAppName}](https://www.valleyofai.com/apps/${appId})`
    : `**App:** ${appId}`;
  const issueBody = `## App Improvement\n\n${appLine}\n${requestorLine}\n\n### Description\n\n${description}`;

  const normalizedDesc = description.replace(/\s+/g, ' ').trim();
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
      title: `Improvement [${appId}]: ${normalizedDesc.slice(0, 60)}${normalizedDesc.length > 60 ? '…' : ''}`,
      body: issueBody,
      labels: ['improvement', 'status:pending'],
    }),
  });

  if (!res.ok) {
    console.error('GitHub API error:', res.status, await res.text());
    return Response.json({ error: 'Failed to submit improvement' }, { status: 502 });
  }

  const issue = await res.json();
  return Response.json({ issueNumber: issue.number, issueUrl: issue.html_url }, { status: 201 });
}
