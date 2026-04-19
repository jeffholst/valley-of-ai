// Session-code helpers. Pure functions — no runtime deps — so they can be
// used from Node.js scripts, Next.js pages, and unit tests.

// Avoids visually ambiguous characters (0/O, 1/I, etc.) so players can copy
// codes from Zoom chat into a form without squinting.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a short, case-insensitive session code suitable for sharing in chat.
 *
 * @param {number} length - number of characters (default 6).
 * @param {() => number} [rand] - optional RNG for tests; defaults to Math.random.
 */
export function generateSessionCode(length = 6, rand = Math.random) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Normalize a user-entered code to canonical form (uppercase, stripped). */
export function normalizeSessionCode(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** True when the code is the expected shape for a session identifier. */
export function isValidSessionCode(code, length = 6) {
  if (typeof code !== 'string') {
    return false;
  }
  if (code.length !== length) {
    return false;
  }
  for (const ch of code) {
    if (!CODE_ALPHABET.includes(ch)) {
      return false;
    }
  }
  return true;
}
