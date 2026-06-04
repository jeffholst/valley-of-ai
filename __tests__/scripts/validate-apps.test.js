/**
 * Tests for the category-parsing helper functions exported from
 * scripts/validate-apps.mjs.
 *
 * Covers:
 *   - parseIssueTemplateCategories
 *   - parseSharedPromptCategories
 */

// Import from the pure helpers module directly; validate-apps.mjs re-exports these
// but also declares __dirname/__filename which conflict with Babel's CJS injection.
// This mirrors how generate-versus.test.js imports from versus-registry.mjs instead
// of generate-versus.mjs.
import {
  parseIssueTemplateCategories,
  parseSharedPromptCategories,
} from '../../scripts/category-parsers.mjs';

// ---------------------------------------------------------------------------
// parseIssueTemplateCategories
// ---------------------------------------------------------------------------

describe('parseIssueTemplateCategories', () => {
  const validTemplate = `
- type: dropdown
  id: category
  attributes:
    label: App Category
    options:
      - Games
      - Productivity
      - Tools
  validations:
    required: true
`;

  it('parses a valid options block', () => {
    expect(parseIssueTemplateCategories(validTemplate)).toEqual(['Games', 'Productivity', 'Tools']);
  });

  it('returns null when there is no category field', () => {
    const content = `
- type: input
  id: title
  attributes:
    label: Title
`;
    expect(parseIssueTemplateCategories(content)).toBeNull();
  });

  it('returns null when the options block is missing', () => {
    const content = `
- type: dropdown
  id: category
  attributes:
    label: App Category
  validations:
    required: true
`;
    expect(parseIssueTemplateCategories(content)).toBeNull();
  });

  it('trims whitespace from category names', () => {
    const content = `
- type: dropdown
  id: category
  attributes:
    options:
      -  Games 
      -  Tools 
  validations:
    required: true
`;
    const result = parseIssueTemplateCategories(content);
    expect(result).toEqual(['Games', 'Tools']);
  });

  it('returns an empty array when options block is empty', () => {
    const content = `
- type: dropdown
  id: category
  attributes:
    options:
  validations:
    required: true
`;
    // match[2] would be empty — filter(Boolean) returns []
    const result = parseIssueTemplateCategories(content);
    // Either null (no match) or empty array are acceptable; test the actual behaviour
    expect(result === null || (Array.isArray(result) && result.length === 0)).toBe(true);
  });

  it('handles a single category', () => {
    const content = `
- type: dropdown
  id: category
  attributes:
    options:
      - Games
  validations:
    required: true
`;
    expect(parseIssueTemplateCategories(content)).toEqual(['Games']);
  });
});

// ---------------------------------------------------------------------------
// parseSharedPromptCategories
// ---------------------------------------------------------------------------

describe('parseSharedPromptCategories', () => {
  it('parses a well-formed category line', () => {
    const content = 'Some text\n- `category`: one of `Games` | `Productivity` | `Tools`\nMore text';
    expect(parseSharedPromptCategories(content)).toEqual(['Games', 'Productivity', 'Tools']);
  });

  it('returns null when the category line is missing', () => {
    const content = 'No category line here';
    expect(parseSharedPromptCategories(content)).toBeNull();
  });

  it('handles a single category value', () => {
    const content = '- `category`: one of `Games`';
    expect(parseSharedPromptCategories(content)).toEqual(['Games']);
  });

  it('strips backtick delimiters from values', () => {
    const content = '- `category`: one of `Alpha` | `Beta` | `Gamma`';
    const result = parseSharedPromptCategories(content);
    expect(result).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('handles extra whitespace around pipe separators', () => {
    const content = '- `category`: one of `Games`  |  `Tools`';
    const result = parseSharedPromptCategories(content);
    expect(result).toEqual(['Games', 'Tools']);
  });
});
