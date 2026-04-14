/**
 * Returns up to `limit` apps similar to `currentApp`.
 *
 * Scoring:
 *   +10  same category  (primary signal)
 *   +2   per shared tag (secondary signal)
 * Ties broken by createdAt descending (newest first).
 *
 * Apps with score 0 are still eligible to pad results, sorted by recency.
 *
 * @param {object}   currentApp - the app being viewed
 * @param {object[]} allApps    - full app registry (data/apps.json)
 * @param {number}   [limit=5]  - max results to return
 * @returns {object[]}
 */
export function getSimilarApps(currentApp, allApps, limit = 5) {
  const currentTags = new Set(currentApp.tags || []);

  const scored = allApps
    .filter((app) => app.id !== currentApp.id && app.visible !== false)
    .map((app) => {
      let score = 0;
      if (app.category === currentApp.category) {
        score += 10;
      }
      for (const tag of app.tags || []) {
        if (currentTags.has(tag)) {
          score += 2;
        }
      }
      const createdAtMs = new Date(app.createdAt).getTime();
      return { app, score, createdAtMs };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.createdAtMs - a.createdAtMs;
    });

  return scored.slice(0, limit).map(({ app }) => app);
}
