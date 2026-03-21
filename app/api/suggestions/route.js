const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const GITHUB_API_URL = 'https://api.github.com';

async function verifyTurnstile(token, ip) {
  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(request) {
  if (!process.env.GITHUB_SUGGESTIONS_TOKEN) {
    return Response.json({ error: 'Suggestions unavailable' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { turnstileToken, category, requestor, description } = body;

  if (!category || !description) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (description.length < 10 || description.length > 1000) {
    return Response.json({ error: 'Description must be 10–1000 characters' }, { status: 400 });
  }

  // Verify Turnstile bot protection (skipped in development)
  if (process.env.NODE_ENV !== 'development') {
    if (!turnstileToken) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const turnstileOk = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileOk) {
      return Response.json({ error: 'Bot verification failed' }, { status: 403 });
    }
  }

  // Build GitHub issue
  const requestorLine = requestor ? `**Requestor:** ${requestor}` : '**Requestor:** anonymous';
  const issueBody = `## App Suggestion\n\n**Category:** ${category}\n${requestorLine}\n\n### Description\n\n${description}`;

  const repo = process.env.GITHUB_REPO || 'jeff/valley-of-ai';
  const res = await fetch(`${GITHUB_API_URL}/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_SUGGESTIONS_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `Suggestion: ${description.slice(0, 72).trim()}${description.length > 72 ? '…' : ''}`,
      body: issueBody,
      labels: ['suggestion', 'status:pending'],
    }),
  });

  if (!res.ok) {
    console.error('GitHub API error:', res.status, await res.text());
    return Response.json({ error: 'Failed to submit suggestion' }, { status: 502 });
  }

  const issue = await res.json();
  return Response.json({ issueNumber: issue.number, issueUrl: issue.html_url }, { status: 201 });
}
