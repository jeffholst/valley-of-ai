import Stripe from 'stripe';

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 999;

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Payments unavailable' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { amount, issueNumber, type } = body;

  const parsedAmount = parseInt(amount, 10);
  if (!parsedAmount || parsedAmount < MIN_AMOUNT || parsedAmount > MAX_AMOUNT) {
    return Response.json(
      { error: `Tip amount must be between $${MIN_AMOUNT} and $${MAX_AMOUNT}` },
      { status: 400 }
    );
  }

  if (type !== 'tip' && type !== 'donation') {
    return Response.json({ error: 'Invalid type' }, { status: 400 });
  }

  if (type === 'tip' && !issueNumber) {
    return Response.json({ error: 'Missing issueNumber for tip' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const envBaseUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || process.env.SITE_URL;
  const headerProto = request.headers.get('x-forwarded-proto')?.split(',')[0] || null;
  const headerHost = request.headers.get('host');
  const headerOrigin = headerProto && headerHost ? `${headerProto}://${headerHost}` : null;
  let origin = envBaseUrl || headerOrigin;
  if (!origin) {
    try {
      origin = new URL(request.url).origin;
    } catch {
      return Response.json(
        { error: 'Unable to determine site origin for payment redirect' },
        { status: 500 }
      );
    }
  }

  const metadata = { type, amount: String(parsedAmount) };
  if (issueNumber) {
    metadata.issueNumber = String(issueNumber);
  }

  const label =
    type === 'tip' ? `Tip the Bots — $${parsedAmount}` : `Keep the Lights On — $${parsedAmount}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: parsedAmount * 100, // cents
            product_data: {
              name: label,
              description:
                type === 'tip'
                  ? 'Tips help prioritize this request and keep the AI bots running!'
                  : `Help keep the ${process.env.NEXT_PUBLIC_SITE_NAME || 'AI'} bots running!`,
            },
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${origin}/?tipped=${type}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    });

    return Response.json({ checkoutUrl: session.url }, { status: 200 });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 502 });
  }
}
