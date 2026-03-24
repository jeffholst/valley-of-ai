import { formatDuration } from '@/lib/formatDuration';

describe('formatDuration', () => {
  describe('falsy input', () => {
    it('returns "-" for null', () => expect(formatDuration(null)).toBe('-'));
    it('returns "-" for undefined', () => expect(formatDuration(undefined)).toBe('-'));
    it('returns "-" for 0', () => expect(formatDuration(0)).toBe('-'));
  });

  describe('milliseconds (< 1000ms)', () => {
    it('formats 1ms', () => expect(formatDuration(1)).toBe('1ms'));
    it('formats 350ms', () => expect(formatDuration(350)).toBe('350ms'));
    it('formats 999ms', () => expect(formatDuration(999)).toBe('999ms'));
  });

  describe('seconds (1000ms – 59999ms)', () => {
    it('formats exactly 1 second', () => expect(formatDuration(1000)).toBe('1.0s'));
    it('formats 4200ms as 4.2s', () => expect(formatDuration(4200)).toBe('4.2s'));
    it('formats 59999ms', () => expect(formatDuration(59999)).toBe('60.0s'));
  });

  describe('minutes (≥ 60000ms)', () => {
    it('formats exactly 1 minute', () => expect(formatDuration(60000)).toBe('1m 0s'));
    it('formats 1m 30s', () => expect(formatDuration(90000)).toBe('1m 30s'));
    it('formats 2m 7s', () => expect(formatDuration(127000)).toBe('2m 7s'));
    it('formats 10m 0s', () => expect(formatDuration(600000)).toBe('10m 0s'));
  });
});
