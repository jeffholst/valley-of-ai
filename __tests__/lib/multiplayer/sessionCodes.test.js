import {
  generateSessionCode,
  isValidSessionCode,
  normalizeSessionCode,
} from '../../../lib/multiplayer/sessionCodes';

describe('generateSessionCode', () => {
  it('produces a string of the requested length', () => {
    expect(generateSessionCode(6)).toHaveLength(6);
    expect(generateSessionCode(10)).toHaveLength(10);
  });

  it('defaults to 6 characters', () => {
    expect(generateSessionCode()).toHaveLength(6);
  });

  it('only uses unambiguous alphanumeric characters', () => {
    // Alphabet excludes 0, O, 1, I to avoid copy-paste confusion.
    const banned = /[01IO]/;
    for (let i = 0; i < 200; i += 1) {
      expect(generateSessionCode()).not.toMatch(banned);
    }
  });

  it('is deterministic with a fixed RNG', () => {
    const rand = jest.fn().mockReturnValue(0);
    const code = generateSessionCode(4, rand);
    expect(code).toBe('AAAA');
  });
});

describe('normalizeSessionCode', () => {
  it('uppercases and strips whitespace', () => {
    expect(normalizeSessionCode('  abcd23  ')).toBe('ABCD23');
  });

  it('drops characters outside the alphabet', () => {
    expect(normalizeSessionCode('ab-cd 23!')).toBe('ABCD23');
  });

  it('returns an empty string for non-string input', () => {
    expect(normalizeSessionCode(null)).toBe('');
    expect(normalizeSessionCode(undefined)).toBe('');
    expect(normalizeSessionCode(42)).toBe('');
  });
});

describe('isValidSessionCode', () => {
  it('accepts a well-formed code', () => {
    expect(isValidSessionCode('ABCD23')).toBe(true);
  });

  it('rejects the wrong length', () => {
    expect(isValidSessionCode('ABCD2')).toBe(false);
    expect(isValidSessionCode('ABCD234')).toBe(false);
  });

  it('rejects banned characters', () => {
    expect(isValidSessionCode('ABCD0O')).toBe(false);
    expect(isValidSessionCode('ABCDI1')).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isValidSessionCode(null)).toBe(false);
    expect(isValidSessionCode(123456)).toBe(false);
  });
});
