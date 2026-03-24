const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Returns true if the token is valid, false on failure or network error.
 *
 * @param {string} token  - The turnstile response token from the client
 * @param {string} [ip]   - Optional remote IP for additional validation
 * @returns {Promise<boolean>}
 */
export async function verifyTurnstile(token, ip) {
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
