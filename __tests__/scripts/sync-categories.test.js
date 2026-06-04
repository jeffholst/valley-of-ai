/**
 * Tests for the pure transform helpers exported from scripts/sync-categories.mjs.
 *
 * These functions take a file's content string plus a categories array and
 * return the updated string — no filesystem access.
 *
 * Covers:
 *   - transformVersusSchema
 *   - transformIssueTemplate
 *   - transformSharedPrompt
 */

// Import from the pure helpers module directly; sync-categories.mjs re-exports these
// but also declares __dirname/__filename which conflict with Babel's CJS injection.
// This mirrors how generate-versus.test.js imports from versus-registry.mjs instead
// of generate-versus.mjs.
import {
  transformVersusSchema,
  transformIssueTemplate,
  transformSharedPrompt,
} from '../../scripts/category-transforms.mjs';

// ---------------------------------------------------------------------------
// transformVersusSchema
// ---------------------------------------------------------------------------

describe('transformVersusSchema', () => {
  const categories = ['Games', 'Productivity', 'Tools'];

  const fixture = `{
  "items": {
    "properties": {
      "category": {
        "type": "string",
        "enum": [
          "OldCategory",
          "AnotherOld"
        ]
      }
    }
  }
}`;

  it('replaces the enum values with the provided categories', () => {
    const result = transformVersusSchema(fixture, categories);
    expect(result).toContain('"Games"');
    expect(result).toContain('"Productivity"');
    expect(result).toContain('"Tools"');
    expect(result).not.toContain('"OldCategory"');
    expect(result).not.toContain('"AnotherOld"');
  });

  it('produces valid JSON after transformation', () => {
    const result = transformVersusSchema(fixture, categories);
    expect(() => JSON.parse(result)).not.toThrow();
    const parsed = JSON.parse(result);
    expect(parsed.items.properties.category.enum).toEqual(categories);
  });

  it('preserves surrounding JSON structure', () => {
    const result = transformVersusSchema(fixture, categories);
    const parsed = JSON.parse(result);
    expect(parsed.items.properties.category.type).toBe('string');
  });

  it('throws when the category enum block is missing', () => {
    const invalid = '{ "no": "enum" }';
    expect(() => transformVersusSchema(invalid, categories)).toThrow(
      /versus\.json is missing items\.properties\.category\.enum/
    );
  });

  it('handles a single category', () => {
    const result = transformVersusSchema(fixture, ['Games']);
    const parsed = JSON.parse(result);
    expect(parsed.items.properties.category.enum).toEqual(['Games']);
  });
});

// ---------------------------------------------------------------------------
// transformIssueTemplate
// ---------------------------------------------------------------------------

describe('transformIssueTemplate', () => {
  const categories = ['Games', 'Productivity', 'Tools'];

  const fixture = `- type: dropdown
  id: category
  attributes:
    label: App Category
    options:
      - OldCategory
      - AnotherOld
  validations:
    required: true
`;

  it('replaces option values with the provided categories', () => {
    const result = transformIssueTemplate(fixture, categories);
    expect(result).toContain('- Games');
    expect(result).toContain('- Productivity');
    expect(result).toContain('- Tools');
    expect(result).not.toContain('- OldCategory');
    expect(result).not.toContain('- AnotherOld');
  });

  it('preserves the surrounding YAML structure', () => {
    const result = transformIssueTemplate(fixture, categories);
    expect(result).toContain('id: category');
    expect(result).toContain('validations:');
    expect(result).toContain('required: true');
  });

  it('throws when the options block is missing', () => {
    const invalid = `- type: input
  id: title
`;
    expect(() => transformIssueTemplate(invalid, categories)).toThrow(
      /Could not find the category options block/
    );
  });

  it('handles a single category', () => {
    const result = transformIssueTemplate(fixture, ['Games']);
    expect(result).toContain('- Games');
    expect(result).not.toContain('- OldCategory');
  });
});

// ---------------------------------------------------------------------------
// transformSharedPrompt
// ---------------------------------------------------------------------------

describe('transformSharedPrompt', () => {
  const categories = ['Games', 'Productivity', 'Tools'];

  const fixture = `## Required Fields
- \`category\`: one of \`OldCat\` | \`AnotherOld\`
- \`name\`: a short title
`;

  it('replaces the category list with the provided categories', () => {
    const result = transformSharedPrompt(fixture, categories);
    expect(result).toContain('`Games` | `Productivity` | `Tools`');
    expect(result).not.toContain('`OldCat`');
    expect(result).not.toContain('`AnotherOld`');
  });

  it('preserves the rest of the document', () => {
    const result = transformSharedPrompt(fixture, categories);
    expect(result).toContain('## Required Fields');
    expect(result).toContain('- `name`: a short title');
  });

  it('throws when the category line is missing', () => {
    const invalid = '## Required Fields\n- `name`: a short title\n';
    expect(() => transformSharedPrompt(invalid, categories)).toThrow(
      /Could not find the category line/
    );
  });

  it('handles a single category', () => {
    const result = transformSharedPrompt(fixture, ['Games']);
    expect(result).toContain('`category`: one of `Games`');
  });

  it('uses backtick-delimited values', () => {
    const result = transformSharedPrompt(fixture, ['Alpha', 'Beta']);
    expect(result).toContain('`Alpha` | `Beta`');
  });
});
