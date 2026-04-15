/**
 * @jest-environment node
 *
 * Tests for the isClean() wrapper around the bad-words library.
 * The bad-words package (badwords-list dep) is ESM-only; we mock it here so
 * Jest can run in CommonJS mode while still testing the wrapper's behaviour.
 */

jest.mock('bad-words', () => {
  const PROFANE = ['shit', 'asshole', 'fuck'];
  class Filter {
    isProfane(input) {
      if (input === null || input === undefined) {
        throw new TypeError('expected string');
      }
      const lower = String(input).toLowerCase();
      if (PROFANE.some((w) => lower.includes(w))) {
        return true;
      }
      return false;
    }
  }
  return { Filter };
});

import { isClean } from '@/app/api/scores/profanity';

describe('isClean()', () => {
  it('returns true for a normal name', () => {
    expect(isClean('Alice')).toBe(true);
  });

  it('returns true for a name with numbers and underscores', () => {
    expect(isClean('Player_42')).toBe(true);
  });

  it('returns true for a name with spaces', () => {
    expect(isClean('Top Player')).toBe(true);
  });

  it('returns true for a name with a dash', () => {
    expect(isClean('Pro-Gamer')).toBe(true);
  });

  it('returns false for a name containing a profane word', () => {
    expect(isClean('shit')).toBe(false);
  });

  it('returns false for a profane word embedded in a longer string', () => {
    expect(isClean('youasshole99')).toBe(false);
  });

  it('returns false (safe fallback) when isProfane throws', () => {
    // isProfane can throw for unusual input; isClean must return false, not throw
    expect(isClean(null)).toBe(false);
  });

  it('returns false (safe fallback) for undefined input', () => {
    expect(isClean(undefined)).toBe(false);
  });
});
