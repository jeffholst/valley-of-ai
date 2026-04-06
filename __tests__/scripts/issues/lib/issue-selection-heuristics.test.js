/**
 * Tests for scripts/issues/lib/issue-selection-heuristics.js
 *
 * Covers the four pure functions with no external dependencies:
 *   - computeSaturatedTags
 *   - computeRecentTags
 *   - computeDuplicationRisk
 *   - extractAppPath
 */

import {
  computeSaturatedTags,
  computeRecentTags,
  computeDuplicationRisk,
  extractAppPath,
  computeImprovementSanity,
  SANITY_DEFAULTS,
} from '../../../../scripts/issues/lib/issue-selection-heuristics.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

function makeApp(overrides = {}) {
  return {
    id: 'test-app',
    name: 'Test App',
    category: 'Games',
    tags: [],
    createdAt: daysAgo(30),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeSaturatedTags
// ---------------------------------------------------------------------------

describe('computeSaturatedTags', () => {
  it('returns empty array when there are no apps', () => {
    expect(computeSaturatedTags([])).toEqual([]);
  });

  it('returns empty array when no tag meets the threshold', () => {
    const apps = [
      makeApp({ tags: ['puzzle'] }),
      makeApp({ tags: ['action'] }),
      makeApp({ tags: ['strategy'] }),
    ];
    // Each tag appears in 1/3 ≈ 33% — but threshold at 20% means ceil(3*0.2)=1
    // so all would be included; use a higher threshold to get empty result
    expect(computeSaturatedTags(apps, 50)).toEqual([]);
  });

  it('includes tags at or above the threshold percentage', () => {
    const apps = [
      makeApp({ tags: ['arcade'] }),
      makeApp({ tags: ['arcade'] }),
      makeApp({ tags: ['arcade'] }),
      makeApp({ tags: ['puzzle'] }),
      makeApp({ tags: ['puzzle'] }),
      makeApp({ tags: ['strategy'] }),
    ];
    // 6 apps, 20% threshold → ceil(6 * 0.2) = 2
    // arcade: 3 (50%) ✓, puzzle: 2 (33%) ✓, strategy: 1 (17%) ✗
    const result = computeSaturatedTags(apps, 20);
    const tags = result.map((r) => r.tag);
    expect(tags).toContain('arcade');
    expect(tags).toContain('puzzle');
    expect(tags).not.toContain('strategy');
  });

  it('returns results sorted by count descending', () => {
    // common: 4 apps, rare: 2 apps — unambiguous ordering
    const apps = [
      makeApp({ tags: ['common'] }),
      makeApp({ tags: ['common'] }),
      makeApp({ tags: ['common', 'rare'] }),
      makeApp({ tags: ['common', 'rare'] }),
      makeApp({ tags: ['other'] }),
    ];
    const result = computeSaturatedTags(apps, 1);
    expect(result[0].tag).toBe('common');
    expect(result[0].count).toBeGreaterThan(result[1].count);
  });

  it('includes correct pct in each result entry', () => {
    const apps = [
      makeApp({ tags: ['retro'] }),
      makeApp({ tags: ['retro'] }),
      makeApp({ tags: ['retro'] }),
      makeApp({ tags: ['retro'] }),
    ];
    const result = computeSaturatedTags(apps, 20);
    expect(result).toHaveLength(1);
    expect(result[0].tag).toBe('retro');
    expect(result[0].count).toBe(4);
    expect(result[0].pct).toBe(100);
  });

  it('handles apps with no tags without throwing', () => {
    const apps = [makeApp({ tags: [] }), makeApp({ tags: undefined })];
    expect(() => computeSaturatedTags(apps)).not.toThrow();
    expect(computeSaturatedTags(apps)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computeRecentTags
// ---------------------------------------------------------------------------

describe('computeRecentTags', () => {
  it('returns empty array when there are no apps', () => {
    expect(computeRecentTags([])).toEqual([]);
  });

  it('only includes tags from apps within the day window', () => {
    const apps = [
      makeApp({ name: 'Fresh App', tags: ['new-tag'], createdAt: daysAgo(3) }),
      makeApp({ name: 'Old App', tags: ['old-tag'], createdAt: daysAgo(30) }),
    ];
    const result = computeRecentTags(apps, 14);
    const tags = result.map((r) => r.tag);
    expect(tags).toContain('new-tag');
    expect(tags).not.toContain('old-tag');
  });

  it('excludes apps created exactly at the boundary (older)', () => {
    const apps = [makeApp({ tags: ['boundary-tag'], createdAt: daysAgo(15) })];
    const result = computeRecentTags(apps, 14);
    expect(result.map((r) => r.tag)).not.toContain('boundary-tag');
  });

  it('returns tags sorted by count descending', () => {
    const apps = [
      makeApp({ name: 'A', tags: ['popular'], createdAt: daysAgo(1) }),
      makeApp({ name: 'B', tags: ['popular'], createdAt: daysAgo(2) }),
      makeApp({ name: 'C', tags: ['niche'], createdAt: daysAgo(3) }),
    ];
    const result = computeRecentTags(apps, 14);
    expect(result[0].tag).toBe('popular');
    expect(result[0].count).toBe(2);
  });

  it('lists the app names that use each tag in recentApps', () => {
    const apps = [
      makeApp({ name: 'Alpha', tags: ['shared-tag'], createdAt: daysAgo(1) }),
      makeApp({ name: 'Beta', tags: ['shared-tag'], createdAt: daysAgo(2) }),
    ];
    const result = computeRecentTags(apps, 14);
    const entry = result.find((r) => r.tag === 'shared-tag');
    expect(entry.recentApps).toContain('Alpha');
    expect(entry.recentApps).toContain('Beta');
  });
});

// ---------------------------------------------------------------------------
// computeDuplicationRisk
// ---------------------------------------------------------------------------

describe('computeDuplicationRisk', () => {
  const existingApps = [
    makeApp({
      id: 'chess-game',
      name: 'Chess Game',
      category: 'Games',
      tags: ['chess', 'strategy', 'board'],
    }),
    makeApp({
      id: 'weather-tool',
      name: 'Weather Tool',
      category: 'Utilities',
      tags: ['weather', 'forecast'],
    }),
  ];

  it('returns low risk when candidate shares no keywords', () => {
    const result = computeDuplicationRisk('A brand new cooking timer app', existingApps);
    expect(result.risk).toBe('low');
    expect(result.score).toBe(0);
    expect(result.matches).toHaveLength(0);
  });

  it('returns medium risk for 1-2 matching apps', () => {
    // "chess strategy" hits name word "chess" and tag "strategy" → 2 hits → match
    const result = computeDuplicationRisk('Build a chess strategy puzzle game', existingApps);
    expect(result.risk).toBe('medium');
    expect(result.score).toBe(1);
    expect(result.matches[0].name).toBe('Chess Game');
  });

  it('returns high risk for more than 2 matching apps', () => {
    const manyApps = [
      makeApp({
        id: 'app-1',
        name: 'Snake Game',
        category: 'Games',
        tags: ['snake', 'retro', 'arcade'],
      }),
      makeApp({
        id: 'app-2',
        name: 'Tetris Clone',
        category: 'Games',
        tags: ['tetris', 'blocks', 'arcade'],
      }),
      makeApp({
        id: 'app-3',
        name: 'Space Shooter',
        category: 'Games',
        tags: ['space', 'shooter', 'arcade'],
      }),
    ];
    // "arcade retro snake tetris space games" should hit all three
    const result = computeDuplicationRisk(
      'An arcade retro game like snake tetris space shooter',
      manyApps
    );
    expect(result.risk).toBe('high');
    expect(result.score).toBeGreaterThan(2);
  });

  it('is case-insensitive', () => {
    const result = computeDuplicationRisk('CHESS STRATEGY game', existingApps);
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it('does not match apps with only one keyword overlap', () => {
    // "chess" alone — only 1 keyword hit, below the threshold of 2
    const result = computeDuplicationRisk('chess', existingApps);
    expect(result.matches).toHaveLength(0);
    expect(result.risk).toBe('low');
  });

  it('returns empty matches for empty apps list', () => {
    const result = computeDuplicationRisk('anything', []);
    expect(result.risk).toBe('low');
    expect(result.matches).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// extractAppPath
// ---------------------------------------------------------------------------

describe('extractAppPath', () => {
  it('extracts app path from title bracket pattern', () => {
    const issue = {
      title: 'Improvement [2026/03/22/freecell-mobile-classic]: Fix card stacking',
      body: '',
    };
    expect(extractAppPath(issue)).toBe('2026/03/22/freecell-mobile-classic');
  });

  it('strips leading slashes from title match', () => {
    const issue = {
      title: 'Improvement [/2026/03/22/my-app]: Fix something',
      body: '',
    };
    expect(extractAppPath(issue)).toBe('2026/03/22/my-app');
  });

  it('falls back to body URL when title has no brackets', () => {
    const issue = {
      title: 'Fix the dark mode bug',
      body: '**App:** [My App](https://www.valleyofai.com/apps/2026/03/10/snake-game)',
    };
    expect(extractAppPath(issue)).toBe('2026/03/10/snake-game');
  });

  it('strips trailing slash from body URL match', () => {
    const issue = {
      title: 'No brackets here',
      body: 'See https://www.valleyofai.com/apps/2026/03/10/snake-game/',
    };
    expect(extractAppPath(issue)).toBe('2026/03/10/snake-game');
  });

  it('returns null when neither title brackets nor body URL are present', () => {
    const issue = { title: 'General improvement request', body: 'No URL here.' };
    expect(extractAppPath(issue)).toBeNull();
  });

  it('returns null for empty body', () => {
    const issue = { title: 'No brackets', body: '' };
    expect(extractAppPath(issue)).toBeNull();
  });

  it('is case-insensitive for body URL matching', () => {
    const issue = {
      title: 'No brackets',
      body: 'https://www.VALLEYOFAI.COM/APPS/2026/03/10/my-app',
    };
    expect(extractAppPath(issue)).toBe('2026/03/10/my-app');
  });
});

// ---------------------------------------------------------------------------
// computeImprovementSanity
// ---------------------------------------------------------------------------

describe('computeImprovementSanity', () => {
  const NOW = new Date('2026-03-25T12:00:00Z');

  const daysAgoFrom = (base, n) => new Date(base.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
  const hoursAgoFrom = (base, n) => new Date(base.getTime() - n * 60 * 60 * 1000).toISOString();

  function makeImprovement(overrides = {}) {
    return {
      issueNumber: 100,
      description: 'Added a new feature to the app',
      implementedAt: daysAgoFrom(NOW, 30),
      ...overrides,
    };
  }

  // --- low risk ---

  it('returns low risk when app has no improvements', () => {
    const result = computeImprovementSanity({ improvements: [] }, 'add a button', false, {}, NOW);
    expect(result.overallRisk).toBe('low');
    expect(result.totalImprovements).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it('returns low risk when app has null improvements', () => {
    const result = computeImprovementSanity({ improvements: null }, 'add a button', false, {}, NOW);
    expect(result.overallRisk).toBe('low');
  });

  it('returns low risk when app has no meta at all', () => {
    const result = computeImprovementSanity(null, 'add a button', false, {}, NOW);
    expect(result.overallRisk).toBe('low');
  });

  it('returns low risk for a single recent improvement', () => {
    const meta = { improvements: [makeImprovement({ implementedAt: daysAgoFrom(NOW, 3) })] };
    const result = computeImprovementSanity(meta, 'add something new', false, {}, NOW);
    expect(result.overallRisk).toBe('low');
  });

  // --- frequency: medium risk ---

  it('returns medium risk when freqMediumCount1d threshold is met', () => {
    const meta = {
      improvements: Array.from({ length: SANITY_DEFAULTS.freqMediumCount1d }, (_, i) =>
        makeImprovement({ implementedAt: hoursAgoFrom(NOW, i + 1) })
      ),
    };
    const result = computeImprovementSanity(meta, 'add something', false, {}, NOW);
    expect(result.overallRisk).toBe('medium');
    expect(result.recentCount1d).toBe(SANITY_DEFAULTS.freqMediumCount1d);
    expect(result.signals.frequencyRisk).toBe('medium');
  });

  it('returns medium risk when freqMediumCount7d threshold is met', () => {
    const meta = {
      improvements: Array.from({ length: SANITY_DEFAULTS.freqMediumCount7d }, (_, i) =>
        makeImprovement({ implementedAt: daysAgoFrom(NOW, 1 + (i % 6)) })
      ),
    };
    const result = computeImprovementSanity(meta, 'add something', false, {}, NOW);
    expect(result.recentCount7d).toBe(SANITY_DEFAULTS.freqMediumCount7d);
    expect(result.signals.frequencyRisk).toBe('medium');
  });

  it('returns medium risk when freqMediumCount30d threshold is met', () => {
    const meta = {
      improvements: Array.from({ length: SANITY_DEFAULTS.freqMediumCount30d }, (_, i) =>
        makeImprovement({ implementedAt: daysAgoFrom(NOW, 10 + (i % 20)) })
      ),
    };
    const result = computeImprovementSanity(meta, 'add something', false, {}, NOW);
    expect(result.recentCount30d).toBe(SANITY_DEFAULTS.freqMediumCount30d);
    expect(result.signals.frequencyRisk).toBe('medium');
  });

  // --- frequency: high risk ---

  it('returns high risk when freqHighCount1d threshold is met', () => {
    const meta = {
      improvements: Array.from({ length: SANITY_DEFAULTS.freqHighCount1d }, (_, i) =>
        makeImprovement({ implementedAt: hoursAgoFrom(NOW, i + 1) })
      ),
    };
    const result = computeImprovementSanity(meta, 'add something', false, {}, NOW);
    expect(result.overallRisk).toBe('high');
    expect(result.signals.frequencyRisk).toBe('high');
  });

  it('returns high risk when freqHighCount7d threshold is met', () => {
    const meta = {
      improvements: Array.from({ length: SANITY_DEFAULTS.freqHighCount7d }, (_, i) =>
        makeImprovement({ implementedAt: daysAgoFrom(NOW, 1 + (i % 6)) })
      ),
    };
    const result = computeImprovementSanity(meta, 'add something', false, {}, NOW);
    expect(result.overallRisk).toBe('high');
    expect(result.signals.frequencyRisk).toBe('high');
  });

  // --- volume ---

  it('returns medium risk when volumeMediumTotal threshold is met', () => {
    const meta = {
      improvements: Array.from({ length: SANITY_DEFAULTS.volumeMediumTotal }, () =>
        makeImprovement({ implementedAt: daysAgoFrom(NOW, 60) })
      ),
    };
    const result = computeImprovementSanity(meta, 'add something', false, {}, NOW);
    expect(result.totalImprovements).toBe(SANITY_DEFAULTS.volumeMediumTotal);
    expect(result.signals.volumeRisk).toBe('medium');
  });

  it('returns high risk when volumeHighTotal threshold is met', () => {
    const meta = {
      improvements: Array.from({ length: SANITY_DEFAULTS.volumeHighTotal }, () =>
        makeImprovement({ implementedAt: daysAgoFrom(NOW, 60) })
      ),
    };
    const result = computeImprovementSanity(meta, 'add something', false, {}, NOW);
    expect(result.signals.volumeRisk).toBe('high');
    expect(result.overallRisk).toBe('high');
  });

  // --- oscillation ---

  it('returns medium oscillation risk when one recent improvement contains a reversal keyword', () => {
    const meta = {
      improvements: [
        makeImprovement({ description: 'reverted the payline toggle to simple on/off' }),
      ],
    };
    const result = computeImprovementSanity(meta, 'add paylines back', false, {}, NOW);
    expect(result.signals.oscillationRisk).toBe('medium');
    expect(result.oscillationSignals).toHaveLength(1);
    expect(result.overallRisk).toBe('medium');
  });

  it('returns high oscillation risk when two or more recent improvements contain reversal keywords', () => {
    const meta = {
      improvements: [
        makeImprovement({ description: 'reverted the payline toggle to simple on/off' }),
        makeImprovement({ description: 'restored the original card layout' }),
      ],
    };
    const result = computeImprovementSanity(meta, 'add paylines back', false, {}, NOW);
    expect(result.signals.oscillationRisk).toBe('high');
    expect(result.oscillationSignals).toHaveLength(2);
    expect(result.overallRisk).toBe('high');
  });

  it('does not flag oscillation for bare "removed" without qualifying context', () => {
    const meta = {
      improvements: [
        makeImprovement({ description: 'removed duplicate shell elements and cleaned up CSS' }),
      ],
    };
    const result = computeImprovementSanity(meta, 'add a UFO ship', false, {}, NOW);
    expect(result.signals.oscillationRisk).toBe('low');
    expect(result.oscillationSignals).toHaveLength(0);
  });

  it('flags oscillation for "removed the" and "removed feature"', () => {
    const meta = {
      improvements: [
        makeImprovement({ description: 'removed the sidebar navigation' }),
        makeImprovement({ description: 'removed feature that auto-played music' }),
      ],
    };
    const result = computeImprovementSanity(meta, 'add sidebar back', false, {}, NOW);
    expect(result.signals.oscillationRisk).toBe('high');
    expect(result.oscillationSignals).toHaveLength(2);
  });

  it('does not flag oscillation for improvements outside the oscillation window', () => {
    const old = Array.from({ length: 4 }, () =>
      makeImprovement({ description: 'reverted something old' })
    );
    const recent = makeImprovement({ description: 'added a new unrelated feature' });
    const meta = { improvements: [...old, recent] };
    const result = computeImprovementSanity(
      meta,
      'add something new',
      false,
      { oscillationWindow: 1 },
      NOW
    );
    expect(result.signals.oscillationRisk).toBe('low');
  });

  // --- recency overlap ---

  it('returns medium overlap risk when candidate shares many words with a recent improvement', () => {
    const meta = {
      improvements: [
        makeImprovement({ description: 'added payline toggle button to show lines individually' }),
      ],
    };
    const result = computeImprovementSanity(
      meta,
      'show payline toggle lines individually button',
      false,
      {},
      NOW
    );
    expect(result.signals.overlapRisk).toBe('medium');
    expect(result.recencyOverlapHits).toHaveLength(1);
  });

  it('does not flag overlap when candidate has too few significant words', () => {
    const meta = {
      improvements: [makeImprovement({ description: 'add button' })],
    };
    // candidate has fewer than recencyOverlapMinWords (3) significant words
    const result = computeImprovementSanity(meta, 'add button', false, {}, NOW);
    expect(result.signals.overlapRisk).toBe('low');
  });

  it('does not flag overlap below the threshold fraction', () => {
    const meta = {
      improvements: [
        makeImprovement({ description: 'completely different feature with other words here' }),
      ],
    };
    const result = computeImprovementSanity(
      meta,
      'payline toggle spin wheel display',
      false,
      {},
      NOW
    );
    expect(result.signals.overlapRisk).toBe('low');
  });

  // --- boost behavior ---

  it('caps high frequency risk to low when boosted and boostOverridesHighFreq is true', () => {
    const meta = {
      improvements: Array.from({ length: SANITY_DEFAULTS.freqHighCount1d }, (_, i) =>
        makeImprovement({ implementedAt: hoursAgoFrom(NOW, i + 1) })
      ),
    };
    const result = computeImprovementSanity(meta, 'add something', true, {}, NOW);
    // frequency was high, but boost reduces it to low
    expect(result.signals.frequencyRisk).toBe('high'); // raw signal unchanged
    expect(result.overallRisk).not.toBe('high');
  });

  it('caps oscillation risk to low when boosted and boostOverridesOscillation is true', () => {
    const meta = {
      improvements: [
        makeImprovement({ description: 'reverted the previous change' }),
        makeImprovement({ description: 'restored the original layout' }),
      ],
    };
    const result = computeImprovementSanity(meta, 'add the feature back', true, {}, NOW);
    expect(result.signals.oscillationRisk).toBe('high'); // raw signal unchanged
    expect(result.overallRisk).not.toBe('high');
  });

  it('never exceeds boostMaxRisk for boosted issues', () => {
    // volume alone can hit high, but boost caps at medium
    const meta = {
      improvements: Array.from({ length: SANITY_DEFAULTS.volumeHighTotal }, () =>
        makeImprovement({ implementedAt: daysAgoFrom(NOW, 60) })
      ),
    };
    const result = computeImprovementSanity(meta, 'add something', true, {}, NOW);
    const capIdx = ['low', 'medium', 'high'].indexOf(SANITY_DEFAULTS.boostMaxRisk);
    const resultIdx = ['low', 'medium', 'high'].indexOf(result.overallRisk);
    expect(resultIdx).toBeLessThanOrEqual(capIdx);
  });

  it('includes boost reason in reasons array when boost was applied and there were signals', () => {
    const meta = {
      improvements: Array.from({ length: SANITY_DEFAULTS.freqMediumCount1d }, (_, i) =>
        makeImprovement({ implementedAt: hoursAgoFrom(NOW, i + 1) })
      ),
    };
    const result = computeImprovementSanity(meta, 'add something', true, {}, NOW);
    expect(result.isBoosted).toBe(true);
    expect(result.reasons.some((r) => r.includes('Boost override'))).toBe(true);
  });

  it('does not include boost reason when there are no risk signals', () => {
    const result = computeImprovementSanity({ improvements: [] }, 'add something', true, {}, NOW);
    expect(result.reasons).toHaveLength(0);
  });

  // --- custom options ---

  it('respects custom threshold overrides', () => {
    const meta = {
      improvements: [makeImprovement({ implementedAt: daysAgoFrom(NOW, 1) })],
    };
    // Lower threshold: 1 improvement in 7d = high
    const result = computeImprovementSanity(
      meta,
      'add something',
      false,
      { freqHighCount7d: 1 },
      NOW
    );
    expect(result.overallRisk).toBe('high');
  });

  // --- output shape ---

  it('always returns all expected fields', () => {
    const result = computeImprovementSanity(null, 'test', false, {}, NOW);
    expect(result).toHaveProperty('overallRisk');
    expect(result).toHaveProperty('isBoosted');
    expect(result).toHaveProperty('totalImprovements');
    expect(result).toHaveProperty('recentCount7d');
    expect(result).toHaveProperty('recentCount30d');
    expect(result).toHaveProperty('oscillationSignals');
    expect(result).toHaveProperty('recencyOverlapHits');
    expect(result).toHaveProperty('signals');
    expect(result).toHaveProperty('reasons');
    expect(result.signals).toHaveProperty('frequencyRisk');
    expect(result.signals).toHaveProperty('volumeRisk');
    expect(result.signals).toHaveProperty('oscillationRisk');
    expect(result.signals).toHaveProperty('overlapRisk');
  });
});
