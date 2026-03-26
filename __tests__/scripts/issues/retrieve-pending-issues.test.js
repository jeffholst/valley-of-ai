/**
 * Tests for scripts/issues/retrieve-pending-issues.js
 *
 * Covers helper behavior, CLI argument parsing, npm-config fallback handling,
 * and queue selection rules for fresh pending items vs. needs-human-review.
 */

import {
  buildRetrieveResult,
  isPendingCandidate,
  normalizeIssue,
  parseArgs,
  retrievePendingIssues,
  sortIssuesOldestFirst,
} from '../../../scripts/issues/retrieve-pending-issues.js';

// Minimal issue factory for queue-filtering and normalization tests.
function makeIssue(overrides = {}) {
  return {
    number: 101,
    title: 'Issue title',
    body: 'Issue body',
    url: 'https://github.com/example/repo/issues/101',
    state: 'OPEN',
    labels: [{ name: 'status:pending' }, { name: 'suggestion' }],
    createdAt: '2026-03-01T00:00:00.000Z',
    author: { login: 'octocat' },
    ...overrides,
  };
}

// Restores npm_config test overrides without leaving stringified "undefined"
// values behind in process.env.
function restoreEnvValue(key, value) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

// ---------------------------------------------------------------------------
// Helper behavior and argument parsing
// ---------------------------------------------------------------------------

describe('retrieve-pending-issues helpers', () => {
  it('identifies pending suggestion or improvement issues', () => {
    expect(isPendingCandidate(makeIssue())).toBe(true);
    expect(
      isPendingCandidate(
        makeIssue({ labels: [{ name: 'status:pending' }, { name: 'improvement' }] })
      )
    ).toBe(true);
    expect(
      isPendingCandidate(
        makeIssue({ labels: [{ name: 'status:approved' }, { name: 'suggestion' }] })
      )
    ).toBe(false);
  });

  it('excludes needs-human-review items by default and includes them when requested', () => {
    const issue = makeIssue({
      labels: [
        { name: 'status:pending' },
        { name: 'status:needs-human-review' },
        { name: 'suggestion' },
      ],
    });

    expect(isPendingCandidate(issue)).toBe(false);
    expect(isPendingCandidate(issue, null, true)).toBe(true);
  });

  it('normalizes issue shape for machine-readable output', () => {
    expect(normalizeIssue(makeIssue())).toEqual({
      number: 101,
      type: 'suggestion',
      title: 'Issue title',
      body: 'Issue body',
      url: 'https://github.com/example/repo/issues/101',
      labels: ['status:pending', 'suggestion'],
      createdAt: '2026-03-01T00:00:00.000Z',
      author: 'octocat',
    });
  });

  it('sorts older issues first using createdAt then number', () => {
    const sorted = sortIssuesOldestFirst([
      normalizeIssue(makeIssue({ number: 103, createdAt: '2026-03-03T00:00:00.000Z' })),
      normalizeIssue(makeIssue({ number: 101, createdAt: '2026-03-01T00:00:00.000Z' })),
      normalizeIssue(makeIssue({ number: 102, createdAt: '2026-03-01T00:00:00.000Z' })),
    ]);

    expect(sorted.map((issue) => issue.number)).toEqual([101, 102, 103]);
  });

  it('builds the empty result shape consistently', () => {
    expect(buildRetrieveResult([])).toEqual({
      found: false,
      count: 0,
      issues: [],
    });
  });

  it('parses both explicit and npm-style positional type filters', () => {
    expect(parseArgs(['--type', 'improvement']).type).toBe('improvement');
    expect(parseArgs(['improvement']).type).toBe('improvement');
    expect(parseArgs(['--type=improvement']).type).toBe('improvement');
  });

  it('parses the needs-human-review queue flag', () => {
    expect(parseArgs(['--needs-human-review']).includeNeedsHumanReview).toBe(true);
  });

  it('supports npm_config fallbacks so npm run works with or without the extra --', () => {
    const originalEnv = {
      npm_config_type: process.env.npm_config_type,
      npm_config_needs_human_review: process.env.npm_config_needs_human_review,
      npm_config_issue: process.env.npm_config_issue,
      npm_config_limit: process.env.npm_config_limit,
    };

    process.env.npm_config_type = 'improvement';
    process.env.npm_config_needs_human_review = 'true';
    process.env.npm_config_issue = '198';
    process.env.npm_config_limit = '25';

    expect(parseArgs([])).toEqual({
      jsonOnly: false,
      includeNeedsHumanReview: true,
      type: 'improvement',
      issueNumber: 198,
      limit: 25,
    });

    restoreEnvValue('npm_config_type', originalEnv.npm_config_type);
    restoreEnvValue('npm_config_needs_human_review', originalEnv.npm_config_needs_human_review);
    restoreEnvValue('npm_config_issue', originalEnv.npm_config_issue);
    restoreEnvValue('npm_config_limit', originalEnv.npm_config_limit);
  });

  it('rejects invalid type filters, including npm-style positional ones', () => {
    expect(() => parseArgs(['--type', 'bogus'])).toThrow('Invalid --type value: bogus');
    expect(() => parseArgs(['bogus'])).toThrow('Invalid --type value: bogus');
  });
});

// ---------------------------------------------------------------------------
// Queue retrieval behavior
// ---------------------------------------------------------------------------

describe('retrievePendingIssues', () => {
  it('returns only open pending suggestion and improvement issues', () => {
    const issues = [
      makeIssue({ number: 104, createdAt: '2026-03-04T00:00:00.000Z' }),
      makeIssue({
        number: 103,
        labels: [{ name: 'status:pending' }, { name: 'improvement' }],
        createdAt: '2026-03-03T00:00:00.000Z',
      }),
      makeIssue({
        number: 102,
        labels: [
          { name: 'status:pending' },
          { name: 'status:needs-human-review' },
          { name: 'suggestion' },
        ],
        createdAt: '2026-03-02T00:00:00.000Z',
      }),
      makeIssue({
        number: 101,
        labels: [{ name: 'status:approved' }, { name: 'suggestion' }],
      }),
      makeIssue({
        number: 100,
        state: 'CLOSED',
      }),
    ];

    const result = retrievePendingIssues(
      { limit: 50, issueNumber: null, type: null },
      {
        listIssuesByLabels: jest.fn(() => issues),
        getIssue: jest.fn(),
      }
    );

    expect(result.found).toBe(true);
    expect(result.count).toBe(2);
    expect(result.issues.map((issue) => issue.number)).toEqual([103, 104]);
    expect(result.issues.map((issue) => issue.type)).toEqual(['improvement', 'suggestion']);
  });

  it('filters results by type when requested', () => {
    const result = retrievePendingIssues(
      { limit: 50, issueNumber: null, type: 'improvement' },
      {
        listIssuesByLabels: jest.fn(() => [
          makeIssue(),
          makeIssue({
            number: 105,
            labels: [{ name: 'status:pending' }, { name: 'improvement' }],
          }),
        ]),
        getIssue: jest.fn(),
      }
    );

    expect(result.issues.map((issue) => issue.number)).toEqual([105]);
  });

  it('returns only needs-human-review items when requested', () => {
    const result = retrievePendingIssues(
      { limit: 50, issueNumber: null, type: null, includeNeedsHumanReview: true },
      {
        listIssuesByLabels: jest.fn(() => [
          makeIssue({ number: 104 }),
          makeIssue({
            number: 105,
            labels: [
              { name: 'status:pending' },
              { name: 'status:needs-human-review' },
              { name: 'improvement' },
            ],
          }),
        ]),
        getIssue: jest.fn(),
      }
    );

    expect(result.issues.map((issue) => issue.number)).toEqual([105]);
  });

  it('supports fetching a specific pending issue by number', () => {
    const result = retrievePendingIssues(
      { limit: 50, issueNumber: 222, type: null },
      {
        getIssue: jest.fn(() => makeIssue({ number: 222 })),
        listIssuesByLabels: jest.fn(),
      }
    );

    expect(result).toEqual({
      found: true,
      count: 1,
      issues: [
        {
          number: 222,
          type: 'suggestion',
          title: 'Issue title',
          body: 'Issue body',
          url: 'https://github.com/example/repo/issues/101',
          labels: ['status:pending', 'suggestion'],
          createdAt: '2026-03-01T00:00:00.000Z',
          author: 'octocat',
        },
      ],
    });
  });

  it('returns no issues when a specific issue is not pending', () => {
    const result = retrievePendingIssues(
      { limit: 50, issueNumber: 222, type: null },
      {
        getIssue: jest.fn(() =>
          makeIssue({
            number: 222,
            labels: [{ name: 'status:approved' }, { name: 'suggestion' }],
          })
        ),
        listIssuesByLabels: jest.fn(),
      }
    );

    expect(result).toEqual({
      found: false,
      count: 0,
      issues: [],
    });
  });
});

// ---------------------------------------------------------------------------
// allowImprovements filtering
// ---------------------------------------------------------------------------

describe('retrievePendingIssues — allowImprovements filtering', () => {
  const mockLoadApps = () => [
    { id: '2026/03/24/my-app', allowImprovements: true },
    { id: '2026/03/24/locked-app', allowImprovements: false },
  ];

  it('excludes bulk improvement issues for apps with allowImprovements: false', () => {
    const result = retrievePendingIssues(
      { limit: 50, issueNumber: null, type: null },
      {
        listIssuesByLabels: jest.fn(() => [
          makeIssue({
            number: 201,
            title: 'Improvement [2026/03/24/locked-app]: fix touch controls',
            labels: [{ name: 'status:pending' }, { name: 'improvement' }],
          }),
        ]),
        getIssue: jest.fn(),
        loadApps: mockLoadApps,
      }
    );

    expect(result.found).toBe(false);
    expect(result.count).toBe(0);
  });

  it('includes bulk improvement issues for apps with allowImprovements: true', () => {
    const result = retrievePendingIssues(
      { limit: 50, issueNumber: null, type: null },
      {
        listIssuesByLabels: jest.fn(() => [
          makeIssue({
            number: 202,
            title: 'Improvement [2026/03/24/my-app]: add dark mode',
            labels: [{ name: 'status:pending' }, { name: 'improvement' }],
          }),
        ]),
        getIssue: jest.fn(),
        loadApps: mockLoadApps,
      }
    );

    expect(result.found).toBe(true);
    expect(result.count).toBe(1);
    expect(result.issues[0].number).toBe(202);
  });

  it('includes suggestion issues regardless of app allowImprovements value', () => {
    const result = retrievePendingIssues(
      { limit: 50, issueNumber: null, type: null },
      {
        listIssuesByLabels: jest.fn(() => [
          makeIssue({
            number: 203,
            title: 'Suggestion: build something cool',
            labels: [{ name: 'status:pending' }, { name: 'suggestion' }],
          }),
        ]),
        getIssue: jest.fn(),
        loadApps: mockLoadApps,
      }
    );

    expect(result.found).toBe(true);
    expect(result.count).toBe(1);
  });

  it('excludes a single improvement issue fetched by number when app is locked', () => {
    const result = retrievePendingIssues(
      { limit: 50, issueNumber: 201, type: null },
      {
        getIssue: jest.fn(() =>
          makeIssue({
            number: 201,
            title: 'Improvement [2026/03/24/locked-app]: fix touch controls',
            labels: [{ name: 'status:pending' }, { name: 'improvement' }],
          })
        ),
        listIssuesByLabels: jest.fn(),
        loadApps: mockLoadApps,
      }
    );

    expect(result.found).toBe(false);
    expect(result.count).toBe(0);
  });

  it('includes a single improvement issue fetched by number when app allows improvements', () => {
    const result = retrievePendingIssues(
      { limit: 50, issueNumber: 202, type: null },
      {
        getIssue: jest.fn(() =>
          makeIssue({
            number: 202,
            title: 'Improvement [2026/03/24/my-app]: add dark mode',
            labels: [{ name: 'status:pending' }, { name: 'improvement' }],
          })
        ),
        listIssuesByLabels: jest.fn(),
        loadApps: mockLoadApps,
      }
    );

    expect(result.found).toBe(true);
    expect(result.count).toBe(1);
  });
});
