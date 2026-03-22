import Stripe from 'stripe';

export async function GET(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Payments unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId || !sessionId.startsWith('cs_')) {
    return Response.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return Response.json({ success: true }, { status: 200 });
    }

    return Response.json({ success: false }, { status: 200 });
  } catch (err) {
    console.error('Stripe session verify error:', err.message);
    return Response.json({ error: 'Failed to verify session' }, { status: 502 });
  }
}
