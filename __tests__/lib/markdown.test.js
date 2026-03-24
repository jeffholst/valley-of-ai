/**
 * @jest-environment node
 */

import { escapeMd } from '@/lib/markdown';

describe('escapeMd()', () => {
  it('returns plain text unchanged', () => {
    expect(escapeMd('Hello world')).toBe('Hello world');
  });

  it('escapes asterisks', () => {
    expect(escapeMd('**bold**')).toBe('\\*\\*bold\\*\\*');
  });

  it('escapes underscores', () => {
    expect(escapeMd('_italic_')).toBe('\\_italic\\_');
  });

  it('escapes backticks', () => {
    expect(escapeMd('`code`')).toBe('\\`code\\`');
  });

  it('escapes square brackets and parens (link syntax)', () => {
    expect(escapeMd('[text](http://evil.com)')).toBe('\\[text\\]\\(http://evil\\.com\\)');
  });

  it('escapes backslashes', () => {
    expect(escapeMd('back\\slash')).toBe('back\\\\slash');
  });

  it('replaces newlines with spaces', () => {
    expect(escapeMd('line one\nline two')).toBe('line one line two');
  });

  it('replaces carriage returns with spaces', () => {
    expect(escapeMd('line one\r\nline two')).toBe('line one  line two');
  });

  it('escapes hash characters', () => {
    expect(escapeMd('# Heading')).toBe('\\# Heading');
  });

  it('escapes a mix of metacharacters', () => {
    const input = '**bold** and [link](http://evil.com) with `code`';
    expect(escapeMd(input)).not.toMatch(/\*\*bold\*\*/);
    expect(escapeMd(input)).not.toMatch(/\[link\]\(/);
    expect(escapeMd(input)).not.toMatch(/`code`/);
  });
});
