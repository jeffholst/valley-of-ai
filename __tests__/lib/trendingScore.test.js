import { trendingScore, TRENDING_GRAVITY } from '@/lib/trendingScore';

// Fixed reference point so tests are not sensitive to wall-clock time.
const NOW = new Date('2026-04-14T12:00:00Z').getTime();

const hoursAgo = (h) => new Date(NOW - h * 3600000).toISOString();
const daysAgo = (d) => hoursAgo(d * 24);

// ---------------------------------------------------------------------------
// Score formula
// ---------------------------------------------------------------------------

describe('trendingScore', () => {
  it('returns 0 when recentNet is 0, regardless of age', () => {
    expect(trendingScore(daysAgo(1), 0, NOW)).toBe(0);
    expect(trendingScore(daysAgo(30), 0, NOW)).toBe(0);
  });

  it('returns a positive score for positive recentNet', () => {
    expect(trendingScore(daysAgo(1), 5, NOW)).toBeGreaterThan(0);
  });

  it('returns a negative score for negative recentNet (more downvotes than upvotes)', () => {
    expect(trendingScore(daysAgo(1), -3, NOW)).toBeLessThan(0);
  });

  it('uses TRENDING_GRAVITY as the exponent', () => {
    const hoursOld = 22; // arbitrary
    const recentNet = 10;
    const createdAt = hoursAgo(hoursOld);
    const expected = recentNet / Math.pow(hoursOld + 2, TRENDING_GRAVITY);
    expect(trendingScore(createdAt, recentNet, NOW)).toBeCloseTo(expected, 10);
  });

  it('defaults now to Date.now() when omitted (smoke test — just must not throw)', () => {
    expect(() => trendingScore(daysAgo(1), 5)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Ranking stability
// ---------------------------------------------------------------------------

describe('trendingScore ranking stability', () => {
  it('newer app with equal recent votes outranks older app', () => {
    const scoreNew = trendingScore(daysAgo(1), 5, NOW);
    const scoreOld = trendingScore(daysAgo(7), 5, NOW);
    expect(scoreNew).toBeGreaterThan(scoreOld);
  });

  it('app with more recent votes outranks app with fewer, same age', () => {
    const scoreHigh = trendingScore(daysAgo(2), 10, NOW);
    const scoreLow = trendingScore(daysAgo(2), 3, NOW);
    expect(scoreHigh).toBeGreaterThan(scoreLow);
  });

  it('score decreases monotonically as age increases (same recentNet)', () => {
    const scores = [1, 6, 24, 72, 168, 336].map((h) => trendingScore(hoursAgo(h), 5, NOW));
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThan(scores[i - 1]);
    }
  });

  it('a very new app with 1 recent vote outranks a month-old app with 0 recent votes', () => {
    const scoreNew = trendingScore(hoursAgo(1), 1, NOW);
    const scoreOld = trendingScore(daysAgo(30), 0, NOW);
    expect(scoreNew).toBeGreaterThan(scoreOld);
  });

  it('a month-old app with many recent votes still outranks a brand-new app with none', () => {
    const scoreActive = trendingScore(daysAgo(30), 50, NOW);
    const scoreInactive = trendingScore(hoursAgo(1), 0, NOW);
    expect(scoreActive).toBeGreaterThan(scoreInactive);
  });

  it('produces consistent sort order across multiple calls (no randomness)', () => {
    const apps = [
      { id: 'a', createdAt: daysAgo(3), recentNet: 8 },
      { id: 'b', createdAt: daysAgo(1), recentNet: 2 },
      { id: 'c', createdAt: daysAgo(10), recentNet: 20 },
      { id: 'd', createdAt: daysAgo(2), recentNet: 0 },
    ];

    const sort = () =>
      [...apps]
        .sort(
          (a, b) =>
            trendingScore(b.createdAt, b.recentNet, NOW) -
            trendingScore(a.createdAt, a.recentNet, NOW)
        )
        .map((app) => app.id);

    const first = sort();
    expect(sort()).toEqual(first);
    expect(sort()).toEqual(first);
  });
});
