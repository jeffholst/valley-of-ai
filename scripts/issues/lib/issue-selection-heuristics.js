/**
 * Pure utility functions shared by select-app-suggestion.js and
 * select-app-improvement.js. No external dependencies — safe to unit-test.
 */

/**
 * Returns tags that appear in >= thresholdPct % of apps.
 * These are "saturated" — new apps shouldn't lean on them as their core concept.
 */
export function computeSaturatedTags(apps, thresholdPct = 20) {
  const counts = {};
  for (const app of apps) {
    for (const tag of app.tags || []) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  const threshold = Math.ceil(apps.length * (thresholdPct / 100));
  return Object.entries(counts)
    .filter(([, n]) => n >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count, pct: Math.round((count / apps.length) * 100) }));
}

/**
 * Returns tags that appeared in apps created within the last `days` days.
 * Avoids repeating very recent concepts back-to-back.
 */
export function computeRecentTags(apps, days = 14) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = apps.filter((a) => new Date(a.createdAt).getTime() >= cutoff);
  const counts = {};
  for (const app of recent) {
    for (const tag of app.tags || []) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({
      tag,
      count,
      recentApps: recent.filter((a) => (a.tags || []).includes(tag)).map((a) => a.name),
    }));
}

/**
 * Scores how much a candidate text (issue title + body) overlaps with existing apps.
 * Returns { risk: 'low'|'medium'|'high', score, matches }
 * where matches = existing app names whose keywords appear in the candidate text.
 */
export function computeDuplicationRisk(candidateText, apps) {
  const text = candidateText.toLowerCase();

  const appFingerprints = apps.map((app) => {
    const nameWords = app.name
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);
    const tags = (app.tags || []).map((t) => t.toLowerCase());
    const category = (app.category || '').toLowerCase();
    return { app, keywords: new Set([...nameWords, ...tags, category]) };
  });

  const matches = [];
  for (const { app, keywords } of appFingerprints) {
    const hits = [...keywords].filter((kw) => text.includes(kw));
    if (hits.length >= 2) {
      matches.push({ name: app.name, id: app.id, matchedKeywords: hits });
    }
  }

  const score = matches.length;
  const risk = score === 0 ? 'low' : score <= 2 ? 'medium' : 'high';
  return { risk, score, matches };
}

/**
 * Extract the app path (e.g. "2026/03/22/freecell-mobile-classic") from an
 * improvement issue. Tries two sources:
 *   1. Title pattern: "Improvement [<app-path>]: ..."
 *   2. Body URL:      **App:** [Name](https://...valleyofai.com/apps/<app-path>)
 */
export function extractAppPath(issue) {
  const titleMatch = issue.title.match(/\[([^\]]+)\]/);
  if (titleMatch) {
    return titleMatch[1].replace(/^\/+/, '');
  }

  const bodyMatch = (issue.body || '').match(/valleyofai\.com\/apps\/([^\s)]+)/i);
  if (bodyMatch) {
    return bodyMatch[1].replace(/\/$/, '');
  }

  return null;
}
