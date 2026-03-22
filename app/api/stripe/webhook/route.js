import Stripe from 'stripe';

const GITHUB_API_URL = 'https://api.github.com';

async function addLabelToIssue(issueNumber, label) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_SUGGESTIONS_TOKEN;
  if (!repo || !token) return;

  await fetch(`${GITHUB_API_URL}/repos/${repo}/issues/${issueNumber}/labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ labels: ['boosted'] }),
  });
}

async function addCommentToIssue(issueNumber, amount) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_SUGGESTIONS_TOKEN;
  if (!repo || !token) return;

  await fetch(`${GITHUB_API_URL}/repos/${repo}/issues/${issueNumber}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      body: `💰 This submission received a $${amount} tip — moved to the front of the review queue! Thank you for supporting the bots! 🤖`,
    }),
  });
}

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Webhook unavailable' }, { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Read raw body — required for Stripe signature verification
  const rawBody = await request.text();

  let event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { type, issueNumber, amount } = session.metadata ?? {};

    if (type === 'tip' && issueNumber) {
      const issueNum = parseInt(issueNumber, 10);
      if (!isNaN(issueNum)) {
        await Promise.all([
          addLabelToIssue(issueNum, 'boosted'),
          addCommentToIssue(issueNum, amount),
        ]);
      }
    }
  }

  return Response.json({ received: true }, { status: 200 });
}
