/**
 * Tests for the groupLogs() function exported from components/AppLog.jsx
 *
 * groupLogs partitions a flat array of log entries into typed run groups:
 *   - 'legacy'      — entries with actionType (old format)
 *   - 'new_app'     — pipeline runs containing SELECT_SUGGESTION
 *   - 'improvement' — pipeline runs containing SELECT_IMPROVEMENT
 */

import { groupLogs, resolveRunAttribution } from '../../components/AppLog.jsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pipelineEntry(step, runId = 'run-001', overrides = {}) {
  return {
    runId,
    category: 'pipeline',
    timestamp: new Date().toISOString(),
    message: `Step ${step}`,
    pipeline: { step, status: 'completed', seq: 1 },
    ...overrides,
  };
}

function legacyEntry(actionType = 'BUILD') {
  return { actionType, description: 'legacy log entry', timestamp: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Basic grouping
// ---------------------------------------------------------------------------

describe('groupLogs', () => {
  it('returns empty array for empty input', () => {
    expect(groupLogs([])).toEqual([]);
  });

  it('puts legacy entries (actionType present) into a single legacy group', () => {
    const logs = [legacyEntry('BUILD'), legacyEntry('DEPLOY')];
    const groups = groupLogs(logs);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe('legacy');
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[0].runId).toBe('__legacy__');
  });

  it('groups pipeline entries by runId', () => {
    const logs = [
      pipelineEntry('SELECT_SUGGESTION', 'run-001'),
      pipelineEntry('GENERATE_HTML', 'run-001'),
      pipelineEntry('SELECT_SUGGESTION', 'run-002'),
    ];
    const groups = groupLogs(logs);
    // No legacy entries; 2 distinct runIds
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.runId)).toEqual(expect.arrayContaining(['run-001', 'run-002']));
  });

  it('defaults run type to new_app', () => {
    const logs = [pipelineEntry('GENERATE_HTML', 'run-abc')];
    const groups = groupLogs(logs);
    expect(groups[0].type).toBe('new_app');
  });

  // ---------------------------------------------------------------------------
  // Run type detection
  // ---------------------------------------------------------------------------

  it('sets type to new_app when SELECT_SUGGESTION step is present', () => {
    const logs = [
      pipelineEntry('SELECT_SUGGESTION', 'run-new'),
      pipelineEntry('GENERATE_HTML', 'run-new'),
    ];
    const groups = groupLogs(logs);
    expect(groups[0].type).toBe('new_app');
  });

  it('sets type to improvement when SELECT_IMPROVEMENT step is present', () => {
    const logs = [
      pipelineEntry('SELECT_IMPROVEMENT', 'run-imp'),
      pipelineEntry('MODIFY_HTML', 'run-imp'),
    ];
    const groups = groupLogs(logs);
    expect(groups[0].type).toBe('improvement');
  });

  it('type is improvement even if SELECT_IMPROVEMENT appears after other steps', () => {
    const logs = [
      pipelineEntry('ANALYZE_APP', 'run-imp'),
      pipelineEntry('SELECT_IMPROVEMENT', 'run-imp'),
    ];
    const groups = groupLogs(logs);
    expect(groups[0].type).toBe('improvement');
  });

  // ---------------------------------------------------------------------------
  // Mixed entry types
  // ---------------------------------------------------------------------------

  it('separates legacy entries from pipeline entries', () => {
    const logs = [legacyEntry('OLD_BUILD'), pipelineEntry('SELECT_SUGGESTION', 'run-new')];
    const groups = groupLogs(logs);
    expect(groups).toHaveLength(2);
    const types = groups.map((g) => g.type);
    expect(types).toContain('legacy');
    expect(types).toContain('new_app');
  });

  it('places legacy group before pipeline groups', () => {
    const logs = [pipelineEntry('SELECT_SUGGESTION', 'run-001'), legacyEntry('DEPLOY')];
    const groups = groupLogs(logs);
    expect(groups[0].type).toBe('legacy');
  });

  it('handles reasoning and validation entries within the same runId group', () => {
    const logs = [
      pipelineEntry('SELECT_SUGGESTION', 'run-001'),
      {
        runId: 'run-001',
        category: 'reasoning',
        timestamp: new Date().toISOString(),
        message: 'Why I chose this',
      },
      {
        runId: 'run-001',
        category: 'validation',
        timestamp: new Date().toISOString(),
        validation: { checkType: 'file-exists', result: 'PASS' },
      },
    ];
    const groups = groupLogs(logs);
    expect(groups).toHaveLength(1);
    expect(groups[0].entries).toHaveLength(3);
  });

  it('uses __unknown__ runId for entries missing runId', () => {
    const logs = [
      {
        category: 'pipeline',
        timestamp: new Date().toISOString(),
        pipeline: { step: 'GENERATE_HTML' },
      },
    ];
    const groups = groupLogs(logs);
    expect(groups[0].runId).toBe('__unknown__');
  });

  // ---------------------------------------------------------------------------
  // Multiple runs — correct ordering
  // ---------------------------------------------------------------------------

  it('preserves insertion order of runs (chronological by first entry)', () => {
    const logs = [
      pipelineEntry('SELECT_SUGGESTION', 'run-A'),
      pipelineEntry('SELECT_IMPROVEMENT', 'run-B'),
      pipelineEntry('GENERATE_HTML', 'run-A'),
    ];
    const groups = groupLogs(logs);
    // run-A was seen first, run-B second
    expect(groups[0].runId).toBe('run-A');
    expect(groups[1].runId).toBe('run-B');
  });

  it('counts improvement runs independently from new_app runs', () => {
    const logs = [
      pipelineEntry('SELECT_SUGGESTION', 'run-new'),
      pipelineEntry('SELECT_IMPROVEMENT', 'run-imp-1'),
      pipelineEntry('SELECT_IMPROVEMENT', 'run-imp-2'),
    ];
    const groups = groupLogs(logs);
    const improvementGroups = groups.filter((g) => g.type === 'improvement');
    expect(improvementGroups).toHaveLength(2);
  });
});

describe('resolveRunAttribution', () => {
  it('prefers agent and model values from log entries', () => {
    const result = resolveRunAttribution(
      {
        entries: [
          pipelineEntry('SELECT_IMPROVEMENT', 'run-imp', {
            agent: 'GitHub Copilot',
            llmModel: 'GPT-5.4',
          }),
        ],
      },
      {
        agentName: 'Other Agent',
        llmModel: 'older-model',
      }
    );

    expect(result).toEqual({
      agentName: 'GitHub Copilot',
      llmModel: 'GPT-5.4',
    });
  });

  it('falls back to improvement metadata when logs omit attribution', () => {
    const result = resolveRunAttribution(
      {
        entries: [pipelineEntry('SELECT_IMPROVEMENT', 'run-imp')],
      },
      {
        agentName: 'GitHub Copilot',
        llmModel: 'GPT-5.4',
      }
    );

    expect(result).toEqual({
      agentName: 'GitHub Copilot',
      llmModel: 'GPT-5.4',
    });
  });
});
