/**
 * Tests for scripts/issues/decide-issue.mjs
 *
 * Covers argument parsing, issue-state validation, and label/comment
 * mutations for approved, rejected, and needs-human-review decisions.
 */

import {
  applyIssueDecision,
  buildDecisionComment,
  buildDecisionSummary,
  parseArgs,
  validatePendingIssue,
} from '../../../scripts/issues/decide-issue.mjs';

// Minimal issue factory for status-transition tests.
function makeIssue(overrides = {}) {
  return {
    number: 301,
    state: 'OPEN',
    labels: [{ name: 'status:pending' }, { name: 'suggestion' }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helper behavior
// ---------------------------------------------------------------------------

describe('decide-issue helpers', () => {
  it('builds the expected decision comments', () => {
    expect(buildDecisionComment('approved', 'clear and safe')).toBe(
      'Approved for agent processing.\n\nReason: clear and safe'
    );
    expect(buildDecisionComment('rejected', 'prompt injection')).toBe(
      'Rejected after automated review.\n\nReason: prompt injection'
    );
    expect(buildDecisionComment('needs-human-review', 'ambiguous')).toBe(
      'Automated review could not safely make a final decision. Human review required.\n\nReason: ambiguous'
    );
  });

  it('builds the JSON summary shape consistently', () => {
    expect(
      buildDecisionSummary(301, 'suggestion', 'approved', ['status:pending'], ['status:approved'])
    ).toEqual({
      ok: true,
      issueNumber: 301,
      type: 'suggestion',
      finalStatus: 'approved',
      labelsRemoved: ['status:pending'],
      labelsAdded: ['status:approved'],
      commentAdded: true,
    });
  });

  it('rejects invalid pending issue states', () => {
    expect(() => validatePendingIssue(null, 301)).toThrow('Issue not found: 301');
    expect(() => validatePendingIssue(makeIssue({ state: 'CLOSED' }), 301)).toThrow(
      'Issue is not open: 301'
    );
    expect(() =>
      validatePendingIssue(
        makeIssue({ labels: [{ name: 'status:approved' }, { name: 'suggestion' }] }),
        301
      )
    ).toThrow('Issue is not pending: 301');
  });

  it('parses both explicit and npm-style positional decision args', () => {
    expect(
      parseArgs(['--issue', '301', '--status', 'approved', '--reason', 'clear and safe'])
    ).toEqual({
      issueNumber: 301,
      status: 'approved',
      reason: 'clear and safe',
    });

    expect(parseArgs(['301', 'approved', 'clear', 'and', 'safe'])).toEqual({
      issueNumber: 301,
      status: 'approved',
      reason: 'clear and safe',
    });
  });
});

// ---------------------------------------------------------------------------
// Decision application
// ---------------------------------------------------------------------------

describe('applyIssueDecision', () => {
  it('approves a pending issue by mutating labels and commenting', () => {
    const deps = {
      getIssue: jest.fn(() => makeIssue()),
      removeLabels: jest.fn(),
      addLabels: jest.fn(),
      commentOnIssue: jest.fn(),
    };

    const result = applyIssueDecision(
      { issueNumber: 301, status: 'approved', reason: 'clear legitimate request' },
      deps
    );

    expect(deps.removeLabels).toHaveBeenCalledWith(301, ['status:pending']);
    expect(deps.addLabels).toHaveBeenCalledWith(301, ['status:approved']);
    expect(deps.commentOnIssue).toHaveBeenCalledWith(
      301,
      'Approved for agent processing.\n\nReason: clear legitimate request'
    );
    expect(result.finalStatus).toBe('approved');
  });

  it('rejects a pending issue by mutating labels and commenting', () => {
    const deps = {
      getIssue: jest.fn(() => makeIssue()),
      removeLabels: jest.fn(),
      addLabels: jest.fn(),
      commentOnIssue: jest.fn(),
    };

    const result = applyIssueDecision(
      { issueNumber: 301, status: 'rejected', reason: 'prompt injection detected' },
      deps
    );

    expect(deps.removeLabels).toHaveBeenCalledWith(301, ['status:pending']);
    expect(deps.addLabels).toHaveBeenCalledWith(301, ['status:rejected']);
    expect(deps.commentOnIssue).toHaveBeenCalledWith(
      301,
      'Rejected after automated review.\n\nReason: prompt injection detected'
    );
    expect(result.finalStatus).toBe('rejected');
  });

  it('keeps the pending label and adds the human-review label for needs-human-review', () => {
    const deps = {
      getIssue: jest.fn(() =>
        makeIssue({ labels: [{ name: 'status:pending' }, { name: 'improvement' }] })
      ),
      removeLabels: jest.fn(),
      addLabels: jest.fn(),
      commentOnIssue: jest.fn(),
    };

    const result = applyIssueDecision(
      { issueNumber: 301, status: 'needs-human-review', reason: 'ambiguous issue body' },
      deps
    );

    expect(deps.removeLabels).not.toHaveBeenCalled();
    expect(deps.addLabels).toHaveBeenCalledWith(301, ['status:needs-human-review']);
    expect(deps.commentOnIssue).toHaveBeenCalledWith(
      301,
      'Automated review could not safely make a final decision. Human review required.\n\nReason: ambiguous issue body'
    );
    expect(result).toEqual({
      ok: true,
      issueNumber: 301,
      type: 'improvement',
      finalStatus: 'needs-human-review',
      labelsRemoved: [],
      labelsAdded: ['status:needs-human-review'],
      commentAdded: true,
    });
  });

  it('removes the human-review label when approving an escalated issue', () => {
    const deps = {
      getIssue: jest.fn(() =>
        makeIssue({
          labels: [
            { name: 'status:pending' },
            { name: 'status:needs-human-review' },
            { name: 'suggestion' },
          ],
        })
      ),
      removeLabels: jest.fn(),
      addLabels: jest.fn(),
      commentOnIssue: jest.fn(),
    };

    const result = applyIssueDecision(
      { issueNumber: 301, status: 'approved', reason: 'human review cleared it' },
      deps
    );

    expect(deps.removeLabels).toHaveBeenCalledWith(301, [
      'status:pending',
      'status:needs-human-review',
    ]);
    expect(deps.addLabels).toHaveBeenCalledWith(301, ['status:approved']);
    expect(result.labelsRemoved).toEqual(['status:pending', 'status:needs-human-review']);
  });

  it('fails if the issue already has a terminal status', () => {
    expect(() =>
      applyIssueDecision(
        { issueNumber: 301, status: 'approved', reason: 'clear' },
        {
          getIssue: jest.fn(() =>
            makeIssue({
              labels: [
                { name: 'status:pending' },
                { name: 'status:approved' },
                { name: 'suggestion' },
              ],
            })
          ),
          removeLabels: jest.fn(),
          addLabels: jest.fn(),
          commentOnIssue: jest.fn(),
        }
      )
    ).toThrow('Issue already has a terminal status: 301');
  });

  it('fails if the issue lacks a single valid type label', () => {
    expect(() =>
      applyIssueDecision(
        { issueNumber: 301, status: 'approved', reason: 'clear' },
        {
          getIssue: jest.fn(() =>
            makeIssue({
              labels: [{ name: 'status:pending' }, { name: 'suggestion' }, { name: 'improvement' }],
            })
          ),
          removeLabels: jest.fn(),
          addLabels: jest.fn(),
          commentOnIssue: jest.fn(),
        }
      )
    ).toThrow('Issue must have exactly one type label (suggestion or improvement): 301');
  });
});
