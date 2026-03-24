/**
 * Tests for scripts/selection-utils.js
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
} from '../../scripts/selection-utils.js';

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
