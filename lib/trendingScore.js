/**
 * Trending score formula for gallery sort.
 *
 * score = recentNet / (hoursOld + 2)^TRENDING_GRAVITY
 *
 * - recentNet: net votes cast in the last 7 days (upvotes minus downvotes)
 * - hoursOld:  hours since app.createdAt
 * - +2 in the denominator prevents division by zero and gives brand-new apps
 *   a small head start over apps created at exactly the same moment
 * - gravity 1.5: gentler decay than Hacker News (1.8); apps are more durable
 *   than news items so older apps should remain discoverable longer
 *
 * Score is 0 when recentNet is 0 (no recent activity), regardless of age.
 * Score is negative when recent downvotes exceed recent upvotes.
 *
 * @param {string} createdAt  - ISO timestamp of app creation
 * @param {number} recentNet  - net votes cast in the last 7 days
 * @param {number} [now]      - current timestamp ms; injectable for testing
 * @returns {number}
 */
export const TRENDING_GRAVITY = 1.5;

export function trendingScore(createdAt, recentNet, now = Date.now()) {
  const hoursOld = (now - new Date(createdAt).getTime()) / 3600000;
  return recentNet / Math.pow(hoursOld + 2, TRENDING_GRAVITY);
}
