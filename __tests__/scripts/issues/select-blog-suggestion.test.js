import {
  deriveSlug,
  parseKeyPoints,
  parseRelatedApps,
  parseRequestor,
  parseSuggestedAuthorType,
} from '../../../scripts/issues/select-blog-suggestion.mjs';

// ---------------------------------------------------------------------------
// Helpers for building YAML-form issue bodies (matching blog_post.yml output)
// ---------------------------------------------------------------------------

function yamlBody(fields) {
  return Object.entries(fields)
    .map(([heading, value]) => `### ${heading}\n\n${value}`)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// deriveSlug
// ---------------------------------------------------------------------------

describe('deriveSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(deriveSlug('Hello World', 1)).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(deriveSlug('Hello! World?', 1)).toBe('hello-world');
  });

  it('strips emoji', () => {
    expect(deriveSlug('🎮 Gaming Time', 1)).toBe('gaming-time');
  });

  it('collapses consecutive hyphens', () => {
    expect(deriveSlug('a -- b --- c', 1)).toBe('a-b-c');
  });

  it('trims leading and trailing spaces before converting', () => {
    expect(deriveSlug('  trimmed title  ', 1)).toBe('trimmed-title');
  });

  it('truncates to 60 characters', () => {
    const long = 'a'.repeat(80);
    expect(deriveSlug(long, 1)).toHaveLength(60);
  });

  it('falls back to issue-<N> when title is empty string', () => {
    expect(deriveSlug('', 42)).toBe('issue-42');
  });

  it('falls back to issue-<N> when title is all special characters', () => {
    expect(deriveSlug('!!!???@@@', 7)).toBe('issue-7');
  });
});

// ---------------------------------------------------------------------------
// parseSuggestedAuthorType
// ---------------------------------------------------------------------------

describe('parseSuggestedAuthorType', () => {
  it('returns ai for "ai" value', () => {
    expect(parseSuggestedAuthorType(yamlBody({ 'Suggested Author Type': 'ai' }))).toBe('ai');
  });

  it('returns human for "human" value', () => {
    expect(parseSuggestedAuthorType(yamlBody({ 'Suggested Author Type': 'human' }))).toBe('human');
  });

  it('returns human+ai for "human+ai" value', () => {
    expect(parseSuggestedAuthorType(yamlBody({ 'Suggested Author Type': 'human+ai' }))).toBe(
      'human+ai'
    );
  });

  it('is case-insensitive: Human+AI → human+ai', () => {
    expect(parseSuggestedAuthorType(yamlBody({ 'Suggested Author Type': 'Human+AI' }))).toBe(
      'human+ai'
    );
  });

  it('is case-insensitive: Human → human', () => {
    expect(parseSuggestedAuthorType(yamlBody({ 'Suggested Author Type': 'Human' }))).toBe('human');
  });

  it('defaults to ai when field is absent', () => {
    expect(parseSuggestedAuthorType('### Category\n\nBuild Logs')).toBe('ai');
  });

  it('defaults to ai for _No response_', () => {
    expect(parseSuggestedAuthorType(yamlBody({ 'Suggested Author Type': '_No response_' }))).toBe(
      'ai'
    );
  });
});

// ---------------------------------------------------------------------------
// parseRelatedApps
// ---------------------------------------------------------------------------

describe('parseRelatedApps', () => {
  it('returns a list of app IDs from comma-separated values', () => {
    expect(parseRelatedApps(yamlBody({ 'Related Apps': 'app-one, app-two, app-three' }))).toEqual([
      'app-one',
      'app-two',
      'app-three',
    ]);
  });

  it('returns a list from newline-separated values', () => {
    expect(parseRelatedApps(yamlBody({ 'Related Apps': 'app-one\napp-two' }))).toEqual([
      'app-one',
      'app-two',
    ]);
  });

  it('returns empty array when field is absent', () => {
    expect(parseRelatedApps('### Category\n\nBuild Logs')).toEqual([]);
  });

  it('returns empty array for _No response_', () => {
    expect(parseRelatedApps(yamlBody({ 'Related Apps': '_No response_' }))).toEqual([]);
  });

  it('returns empty array for n/a (case-insensitive)', () => {
    expect(parseRelatedApps(yamlBody({ 'Related Apps': 'N/A' }))).toEqual([]);
    expect(parseRelatedApps(yamlBody({ 'Related Apps': 'n/a' }))).toEqual([]);
  });

  it('returns empty array for none (case-insensitive)', () => {
    expect(parseRelatedApps(yamlBody({ 'Related Apps': 'None' }))).toEqual([]);
    expect(parseRelatedApps(yamlBody({ 'Related Apps': 'none' }))).toEqual([]);
  });

  it('strips leading bullet markers', () => {
    expect(parseRelatedApps(yamlBody({ 'Related Apps': '- app-one\n- app-two' }))).toEqual([
      'app-one',
      'app-two',
    ]);
  });
});

// ---------------------------------------------------------------------------
// parseRequestor
// ---------------------------------------------------------------------------

describe('parseRequestor', () => {
  it('returns the username when present', () => {
    expect(parseRequestor(yamlBody({ Requestor: 'alice' }))).toBe('alice');
  });

  it('returns null for _No response_', () => {
    expect(parseRequestor(yamlBody({ Requestor: '_No response_' }))).toBeNull();
  });

  it('returns null when field is absent', () => {
    expect(parseRequestor('### Category\n\nBuild Logs')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseKeyPoints
// ---------------------------------------------------------------------------

describe('parseKeyPoints', () => {
  it('returns array of bullet lines', () => {
    const body = yamlBody({ 'Key Points': '- First point\n- Second point\n- Third point' });
    expect(parseKeyPoints(body)).toEqual(['First point', 'Second point', 'Third point']);
  });

  it('supports asterisk bullets', () => {
    const body = yamlBody({ 'Key Points': '* Point A\n* Point B' });
    expect(parseKeyPoints(body)).toEqual(['Point A', 'Point B']);
  });

  it('returns empty array when field is absent', () => {
    expect(parseKeyPoints('### Category\n\nBuild Logs')).toEqual([]);
  });

  it('filters blank lines', () => {
    const body = yamlBody({ 'Key Points': '- Real point\n\n- Another point' });
    expect(parseKeyPoints(body)).toEqual(['Real point', 'Another point']);
  });
});
