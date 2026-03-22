const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const GITHUB_API_URL = 'https://api.github.com';

async function verifyTurnstile(token, ip) {
  try {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY || '',
      response: token || '',
      remoteip: ip || '',
    });

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      console.error('Turnstile verify HTTP error:', res.status, await res.text());
      return false;
    }

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verify failed:', err);
    return false;
  }
}

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

  if (description.length < 10 || description.length > 1000) {
    return Response.json({ error: 'Description must be 10–1000 characters' }, { status: 400 });
  }

  // Verify Turnstile bot protection (skipped in development)
  if (process.env.NODE_ENV !== 'development') {
    if (!turnstileToken) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const ip =
      request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const turnstileOk = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileOk) {
      return Response.json({ error: 'Bot verification failed' }, { status: 403 });
    }
  }

  // Build GitHub issue
  const requestorLine = requestor ? `**Requestor:** ${requestor}` : '**Requestor:** anonymous';
  const appLine = appName ? `**App:** [${appName}](https://www.valleyofai.com/apps/${appId})` : `**App:** ${appId}`;
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
