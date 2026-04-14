import { getSimilarApps } from '@/lib/similarApps';

const makeApp = (overrides) => ({
  id: 'default-id',
  name: 'Default App',
  category: 'Tools',
  tags: [],
  createdAt: '2026-01-01T00:00:00Z',
  visible: true,
  ...overrides,
});

describe('getSimilarApps', () => {
  it('returns empty array when no other apps exist', () => {
    const app = makeApp({ id: 'only-app' });
    expect(getSimilarApps(app, [app])).toEqual([]);
  });

  it('excludes the current app from results', () => {
    const current = makeApp({ id: 'current', category: 'Games' });
    const other = makeApp({ id: 'other', category: 'Games' });
    const results = getSimilarApps(current, [current, other]);
    expect(results.every((r) => r.id !== 'current')).toBe(true);
  });

  it('excludes apps with visible: false', () => {
    const current = makeApp({ id: 'current', category: 'Games' });
    const hidden = makeApp({ id: 'hidden', category: 'Games', visible: false });
    const visible = makeApp({ id: 'visible', category: 'Tools' });
    const results = getSimilarApps(current, [current, hidden, visible]);
    expect(results.find((r) => r.id === 'hidden')).toBeUndefined();
  });

  it('prioritizes same-category apps over cross-category apps', () => {
    const current = makeApp({ id: 'current', category: 'Games', tags: [] });
    const sameCategory = makeApp({ id: 'same-cat', category: 'Games', tags: [] });
    const differentCategory = makeApp({ id: 'diff-cat', category: 'Tools', tags: [] });
    const results = getSimilarApps(current, [current, differentCategory, sameCategory]);
    expect(results[0].id).toBe('same-cat');
  });

  it('breaks category ties by shared tag count', () => {
    const current = makeApp({ id: 'current', category: 'Games', tags: ['a', 'b', 'c'] });
    const fewTags = makeApp({ id: 'few-tags', category: 'Games', tags: ['a'] });
    const moreTags = makeApp({ id: 'more-tags', category: 'Games', tags: ['a', 'b'] });
    const results = getSimilarApps(current, [current, fewTags, moreTags]);
    expect(results[0].id).toBe('more-tags');
  });

  it('breaks score ties by recency (newest first)', () => {
    const current = makeApp({ id: 'current', category: 'Games' });
    const older = makeApp({ id: 'older', category: 'Games', createdAt: '2026-01-01T00:00:00Z' });
    const newer = makeApp({ id: 'newer', category: 'Games', createdAt: '2026-03-01T00:00:00Z' });
    const results = getSimilarApps(current, [current, older, newer]);
    expect(results[0].id).toBe('newer');
  });

  it('returns at most `limit` results', () => {
    const current = makeApp({ id: 'current', category: 'Games' });
    const others = Array.from({ length: 10 }, (_, i) =>
      makeApp({ id: `app-${i}`, category: 'Games' })
    );
    const results = getSimilarApps(current, [current, ...others], 4);
    expect(results).toHaveLength(4);
  });

  it('includes cross-category apps when needed to fill results', () => {
    const current = makeApp({ id: 'current', category: 'Games', tags: [] });
    const crossCat = makeApp({ id: 'cross', category: 'Tools', tags: [] });
    const results = getSimilarApps(current, [current, crossCat], 5);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('cross');
  });

  it('scores shared tags from cross-category apps correctly', () => {
    const current = makeApp({ id: 'current', category: 'Games', tags: ['canvas', 'mobile'] });
    const sameTagsDiffCat = makeApp({
      id: 'tags-match',
      category: 'Tools',
      tags: ['canvas', 'mobile'],
    });
    const sameCatNoTags = makeApp({ id: 'cat-match', category: 'Games', tags: [] });
    // sameCatNoTags: score 10; sameTagsDiffCat: score 4
    const results = getSimilarApps(current, [current, sameTagsDiffCat, sameCatNoTags]);
    expect(results[0].id).toBe('cat-match');
    expect(results[1].id).toBe('tags-match');
  });

  it('handles apps with no tags gracefully', () => {
    const current = makeApp({ id: 'current', tags: undefined });
    const other = makeApp({ id: 'other', tags: null });
    expect(() => getSimilarApps(current, [current, other])).not.toThrow();
  });
});
