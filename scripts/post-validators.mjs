/**
 * Pure validation helpers for blog post fields.
 * Imported by validate-posts.mjs and by tests.
 */

/**
 * Validate a single shortSlug value against the already-seen slugs and shortSlugs.
 * Returns an error string if invalid, or null if the value is acceptable.
 * Mutates seenShortSlugs by adding the value on success.
 *
 * @param {string} shortSlug
 * @param {Set<string>} seenFullSlugs - all full slugs registered so far
 * @param {Set<string>} seenShortSlugs - all shortSlugs registered so far (mutated on success)
 * @returns {string|null}
 */
export function validateShortSlug(shortSlug, seenFullSlugs, seenShortSlugs) {
  if (typeof shortSlug !== 'string' || !/^[a-z0-9-]+$/.test(shortSlug)) {
    return `shortSlug '${shortSlug}' must contain only lowercase letters, numbers, and hyphens`;
  }
  if (seenShortSlugs.has(shortSlug)) {
    return `duplicate shortSlug '${shortSlug}'`;
  }
  if (seenFullSlugs.has(shortSlug)) {
    return `shortSlug '${shortSlug}' collides with an existing full slug`;
  }
  seenShortSlugs.add(shortSlug);
  return null;
}
