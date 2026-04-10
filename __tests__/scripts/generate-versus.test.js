/**
 * Tests for scripts/generate-versus.js
 *
 * Covers the pure validation and registry-building functions.
 */

import { validateVersusData, buildVersusRegistry } from '../../scripts/versus-registry.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApp(id, overrides = {}) {
  return {
    id,
    name: `App ${id}`,
    shortDescription: 'A test app',
    thumbnailUrl: `/apps/${id}/thumbnail.svg`,
    appPath: `/apps/${id}/index.html`,
    generation: {
      llmModel: 'test-model',
      agentName: 'test-agent',
      startTime: '2026-03-05T21:55:00Z',
      endTime: '2026-03-05T22:00:00Z',
      totalTokensIn: 5000,
      totalTokensOut: 3000,
    },
    ...overrides,
  };
}

function makeAppsMap(...apps) {
  return new Map(apps.map((a) => [a.id, a]));
}

function makeCompetition(overrides = {}) {
  return {
    id: 'test-versus',
    title: 'Test Versus',
    prompt: 'Build a test app',
    createdAt: '2026-03-10T12:00:00Z',
    category: 'Games',
    entries: [{ appId: 'app-a' }, { appId: 'app-b' }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateVersusData
// ---------------------------------------------------------------------------

describe('validateVersusData', () => {
  const appsById = makeAppsMap(makeApp('app-a'), makeApp('app-b'), makeApp('app-c'));

  it('returns no errors for valid data', () => {
    const errors = validateVersusData([makeCompetition()], appsById);
    expect(errors).toEqual([]);
  });

  it('detects duplicate competition IDs', () => {
    const competitions = [makeCompetition({ id: 'dupe' }), makeCompetition({ id: 'dupe' })];
    const errors = validateVersusData(competitions, appsById);
    expect(errors).toContain('duplicate competition id: "dupe"');
  });

  it('requires at least 2 entries', () => {
    const comp = makeCompetition({ entries: [{ appId: 'app-a' }] });
    const errors = validateVersusData([comp], appsById);
    expect(errors.some((e) => e.includes('at least 2 entries'))).toBe(true);
  });

  it('detects missing appId references', () => {
    const comp = makeCompetition({
      entries: [{ appId: 'app-a' }, { appId: 'nonexistent' }],
    });
    const errors = validateVersusData([comp], appsById);
    expect(errors.some((e) => e.includes('"nonexistent" not found'))).toBe(true);
  });

  it('detects duplicate entries within a competition', () => {
    const comp = makeCompetition({
      entries: [{ appId: 'app-a' }, { appId: 'app-a' }],
    });
    const errors = validateVersusData([comp], appsById);
    expect(errors.some((e) => e.includes('duplicate appId'))).toBe(true);
  });

  it('detects missing required fields', () => {
    const comp = { id: 'bad', entries: [{ appId: 'app-a' }, { appId: 'app-b' }] };
    const errors = validateVersusData([comp], appsById);
    expect(errors.some((e) => e.includes('missing or invalid title'))).toBe(true);
    expect(errors.some((e) => e.includes('missing or invalid prompt'))).toBe(true);
    expect(errors.some((e) => e.includes('missing createdAt'))).toBe(true);
    expect(errors.some((e) => e.includes('missing category'))).toBe(true);
  });

  it('validates an empty array with no errors', () => {
    const errors = validateVersusData([], appsById);
    expect(errors).toEqual([]);
  });

  it('handles 3+ entries', () => {
    const comp = makeCompetition({
      entries: [{ appId: 'app-a' }, { appId: 'app-b' }, { appId: 'app-c' }],
    });
    const errors = validateVersusData([comp], appsById);
    expect(errors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildVersusRegistry
// ---------------------------------------------------------------------------

describe('buildVersusRegistry', () => {
  const appA = makeApp('app-a', {
    name: 'Alpha App',
    generation: {
      llmModel: 'claude-opus',
      agentName: 'agent-1',
      startTime: '2026-03-05T21:55:00Z',
      endTime: '2026-03-05T22:00:00Z',
      totalTokensIn: 5000,
      totalTokensOut: 3000,
    },
  });
  const appB = makeApp('app-b', {
    name: 'Beta App',
    generation: {
      llmModel: 'gpt-5',
      agentName: 'agent-2',
      startTime: '2026-03-05T22:00:00Z',
      endTime: '2026-03-05T22:10:00Z',
      totalTokensIn: 8000,
      totalTokensOut: 6000,
    },
  });
  const appsById = makeAppsMap(appA, appB);

  it('enriches entries with app metadata', () => {
    const registry = buildVersusRegistry([makeCompetition()], appsById);

    expect(registry).toHaveLength(1);
    expect(registry[0].id).toBe('test-versus');
    expect(registry[0].entries).toHaveLength(2);

    const entryA = registry[0].entries[0];
    expect(entryA.appId).toBe('app-a');
    expect(entryA.name).toBe('Alpha App');
    expect(entryA.model).toBe('claude-opus');
    expect(entryA.agent).toBe('agent-1');
    expect(entryA.generationTime).toBe(300); // 5 minutes in seconds
    expect(entryA.tokensIn).toBe(5000);
    expect(entryA.tokensOut).toBe(3000);
  });

  it('calculates generation time correctly', () => {
    const registry = buildVersusRegistry([makeCompetition()], appsById);
    const entryB = registry[0].entries[1];
    expect(entryB.generationTime).toBe(600); // 10 minutes
  });

  it('handles missing generation data gracefully', () => {
    const appNoGen = makeApp('app-a', { generation: null });
    const map = makeAppsMap(appNoGen, appB);
    const registry = buildVersusRegistry([makeCompetition()], map);

    expect(registry[0].entries[0].model).toBe('unknown');
    expect(registry[0].entries[0].agent).toBe('unknown');
    expect(registry[0].entries[0].generationTime).toBeNull();
    expect(registry[0].entries[0].tokensIn).toBeNull();
  });

  it('preserves competition-level fields', () => {
    const registry = buildVersusRegistry([makeCompetition()], appsById);
    expect(registry[0].title).toBe('Test Versus');
    expect(registry[0].prompt).toBe('Build a test app');
    expect(registry[0].createdAt).toBe('2026-03-10T12:00:00Z');
    expect(registry[0].category).toBe('Games');
  });
});
