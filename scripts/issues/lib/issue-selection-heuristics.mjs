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

/**
 * Default thresholds and settings for computeImprovementSanity.
 * Export these so callers can inspect defaults and override specific values.
 *
 * FREQUENCY — how many improvements in a rolling window trigger a risk flag
 * freqHighCount1d    number  Improvements in last 24 hours that trigger HIGH risk (default 6)
 * freqMediumCount1d  number  Improvements in last 24 hours that trigger MEDIUM risk (default 4)
 * freqHighCount7d    number  Improvements in last 7 days that trigger HIGH risk (default 25)
 * freqMediumCount7d  number  Improvements in last 7 days that trigger MEDIUM risk (default 15)
 * freqMediumCount30d number  Improvements in last 30 days that trigger MEDIUM risk (default 40)
 *
 * VOLUME — total lifetime improvement count thresholds
 * volumeHighTotal    number  All-time improvement count triggering HIGH risk (default 8)
 * volumeMediumTotal  number  All-time improvement count triggering MEDIUM risk (default 5)
 *
 * OSCILLATION — detect recent improvements that suggest undoing prior work
 * oscillationWindow   number    How many recent improvements to scan for reversal language (default 4)
 * oscillationKeywords string[]  Words in improvement descriptions that suggest undoing work
 *
 * RECENCY OVERLAP — detect near-duplicate candidates
 * recencyOverlapWindow     number  How many of the most recent improvements to compare against (default 2)
 * recencyOverlapThreshold  number  Fraction [0–1] of candidate's significant words (length >= 4)
 *                                  that must appear in a recent improvement description to flag overlap (default 0.5)
 * recencyOverlapMinWords   number  Minimum significant words the candidate must have before
 *                                  the overlap check runs at all (default 3)
 *
 * BOOST — boosted (paid) issues get reduced scrutiny and should almost always proceed
 * boostMaxRisk             string  Boosted issues are capped at this risk level, never higher (default 'medium')
 * boostOverridesHighFreq   boolean When true, high frequency risk is reduced to low for boosted issues (default true)
 * boostOverridesOscillation boolean When true, oscillation risk is reduced to low for boosted issues (default true)
 */
export const SANITY_DEFAULTS = {
  freqHighCount1d: 6,
  freqMediumCount1d: 4,
  freqHighCount7d: 25,
  freqMediumCount7d: 15,
  freqMediumCount30d: 40,
  volumeHighTotal: 30,
  volumeMediumTotal: 15,
  oscillationWindow: 4,
  oscillationKeywords: [
    'revert',
    'restore',
    'removed feature',
    'removed the',
    're-add',
    'add back',
    'undo',
    'roll back',
    'put back',
    'previous behavior',
    'as it was',
  ],
  recencyOverlapWindow: 2,
  recencyOverlapThreshold: 0.5,
  recencyOverlapMinWords: 3,
  boostMaxRisk: 'medium',
  boostOverridesHighFreq: true,
  boostOverridesOscillation: true,
};

/** Internal risk level ordering. */
const RISK_LEVELS = ['low', 'medium', 'high'];

function higherRisk(a, b) {
  return RISK_LEVELS.indexOf(a) >= RISK_LEVELS.indexOf(b) ? a : b;
}

function capRisk(risk, cap) {
  const riskIdx = RISK_LEVELS.indexOf(risk);
  const capIdx = RISK_LEVELS.indexOf(cap);
  return riskIdx > capIdx ? cap : risk;
}

/**
 * Checks an improvement candidate against the target app's history for
 * problematic patterns: high frequency, excessive volume, oscillating changes,
 * and near-duplicate requests.
 *
 * @param {object|null} appMeta  Full meta.json object for the target app.
 *                               Must have an `improvements` array (may be null/undefined).
 * @param {string}      candidateDescription  Description text from the candidate issue.
 * @param {boolean}     isBoosted  True when the issue carries the `boosted` label.
 *                                 Boosted issues get reduced scrutiny — they should
 *                                 almost always be allowed through.
 * @param {object}      options    Partial overrides for SANITY_DEFAULTS.
 * @param {Date}        now        Current date (injectable for testing).
 *
 * @returns {{
 *   overallRisk: 'low'|'medium'|'high',
 *   isBoosted: boolean,
 *   totalImprovements: number,
 *   recentCount1d: number,
 *   recentCount7d: number,
 *   recentCount30d: number,
 *   oscillationSignals: Array<{issueNumber: number, description: string}>,
 *   recencyOverlapHits: Array<{issueNumber: number, description: string, sharedWords: string[]}>,
 *   signals: { frequencyRisk: string, volumeRisk: string, oscillationRisk: string, overlapRisk: string },
 *   reasons: string[],
 * }}
 */
export function computeImprovementSanity(
  appMeta,
  candidateDescription,
  isBoosted = false,
  options = {},
  now = new Date()
) {
  const cfg = { ...SANITY_DEFAULTS, ...options };
  const improvements = Array.isArray(appMeta?.improvements) ? appMeta.improvements : [];
  const candidate = (candidateDescription || '').toLowerCase();

  const msPerDay = 24 * 60 * 60 * 1000;
  const cutoff1d = new Date(now.getTime() - 1 * msPerDay);
  const cutoff7d = new Date(now.getTime() - 7 * msPerDay);
  const cutoff30d = new Date(now.getTime() - 30 * msPerDay);

  // --- Frequency ---
  const recentCount1d = improvements.filter((i) => new Date(i.implementedAt) > cutoff1d).length;
  const recentCount7d = improvements.filter((i) => new Date(i.implementedAt) > cutoff7d).length;
  const recentCount30d = improvements.filter((i) => new Date(i.implementedAt) > cutoff30d).length;
  const totalImprovements = improvements.length;

  // --- Oscillation ---
  const oscillationWindow = improvements.slice(-cfg.oscillationWindow);
  const oscillationSignals = oscillationWindow
    .filter((i) =>
      cfg.oscillationKeywords.some((kw) => (i.description || '').toLowerCase().includes(kw))
    )
    .map((i) => ({ issueNumber: i.issueNumber ?? null, description: i.description ?? '' }));

  // --- Recency overlap ---
  const sigWords = (text) =>
    text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length >= 4);
  const candidateWords = new Set(sigWords(candidate));
  const recencyOverlapHits = [];

  if (candidateWords.size >= cfg.recencyOverlapMinWords) {
    const recentSlice = improvements.slice(-cfg.recencyOverlapWindow);
    for (const imp of recentSlice) {
      const impWords = new Set(sigWords(imp.description || ''));
      const shared = [...candidateWords].filter((w) => impWords.has(w));
      if (shared.length / candidateWords.size >= cfg.recencyOverlapThreshold) {
        recencyOverlapHits.push({
          issueNumber: imp.issueNumber ?? null,
          description: imp.description ?? '',
          sharedWords: shared,
        });
      }
    }
  }

  // --- Individual signal risk levels ---
  let frequencyRisk = 'low';
  if (recentCount1d >= cfg.freqHighCount1d || recentCount7d >= cfg.freqHighCount7d) {
    frequencyRisk = 'high';
  } else if (
    recentCount1d >= cfg.freqMediumCount1d ||
    recentCount7d >= cfg.freqMediumCount7d ||
    recentCount30d >= cfg.freqMediumCount30d
  ) {
    frequencyRisk = 'medium';
  }

  let volumeRisk = 'low';
  if (totalImprovements >= cfg.volumeHighTotal) {
    volumeRisk = 'high';
  } else if (totalImprovements >= cfg.volumeMediumTotal) {
    volumeRisk = 'medium';
  }

  const oscillationRisk =
    oscillationSignals.length >= 2 ? 'high' : oscillationSignals.length === 1 ? 'medium' : 'low';
  const overlapRisk = recencyOverlapHits.length > 0 ? 'medium' : 'low';

  // --- Apply boost overrides to individual signals ---
  const effectiveFreqRisk =
    isBoosted && cfg.boostOverridesHighFreq && frequencyRisk === 'high' ? 'low' : frequencyRisk;
  const effectiveOscillationRisk =
    isBoosted && cfg.boostOverridesOscillation ? 'low' : oscillationRisk;

  // --- Combine to overall risk ---
  let overallRisk = [effectiveFreqRisk, volumeRisk, effectiveOscillationRisk, overlapRisk].reduce(
    higherRisk,
    'low'
  );

  // --- Apply boost cap ---
  if (isBoosted) {
    overallRisk = capRisk(overallRisk, cfg.boostMaxRisk);
  }

  // --- Build human-readable reasons ---
  const reasons = [];
  if (recentCount1d >= cfg.freqHighCount1d) {
    reasons.push(
      `${recentCount1d} improvements in the last 24 hours (high threshold: ${cfg.freqHighCount1d})`
    );
  } else if (recentCount1d >= cfg.freqMediumCount1d) {
    reasons.push(
      `${recentCount1d} improvements in the last 24 hours (medium threshold: ${cfg.freqMediumCount1d})`
    );
  }
  if (recentCount7d >= cfg.freqHighCount7d) {
    reasons.push(
      `${recentCount7d} improvements in the last 7 days (high threshold: ${cfg.freqHighCount7d})`
    );
  } else if (recentCount7d >= cfg.freqMediumCount7d) {
    reasons.push(
      `${recentCount7d} improvements in the last 7 days (medium threshold: ${cfg.freqMediumCount7d})`
    );
  }
  if (recentCount30d >= cfg.freqMediumCount30d) {
    reasons.push(
      `${recentCount30d} improvements in the last 30 days (threshold: ${cfg.freqMediumCount30d})`
    );
  }
  if (totalImprovements >= cfg.volumeHighTotal) {
    reasons.push(
      `${totalImprovements} total improvements on this app (high threshold: ${cfg.volumeHighTotal})`
    );
  } else if (totalImprovements >= cfg.volumeMediumTotal) {
    reasons.push(
      `${totalImprovements} total improvements on this app (medium threshold: ${cfg.volumeMediumTotal})`
    );
  }
  for (const sig of oscillationSignals) {
    reasons.push(`Recent improvement contains reversal language: "${sig.description}"`);
  }
  for (const hit of recencyOverlapHits) {
    reasons.push(
      `Candidate closely overlaps recent improvement "${hit.description}" (shared: ${hit.sharedWords.join(', ')})`
    );
  }
  if (isBoosted && reasons.length > 0) {
    reasons.push('Boost override applied — risk reduced for paid/boosted request');
  }

  return {
    overallRisk,
    isBoosted,
    totalImprovements,
    recentCount1d,
    recentCount7d,
    recentCount30d,
    oscillationSignals,
    recencyOverlapHits,
    signals: { frequencyRisk, volumeRisk, oscillationRisk, overlapRisk },
    reasons,
  };
}
