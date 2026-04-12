#!/usr/bin/env node
/**
 * Agent pipeline harness.
 *
 * Composes the correct prompt files and launches Claude Code for the chosen pipeline.
 * All four prompts are supported. The optional --issue flag bypasses heuristic selection
 * entirely and directs the agent to act on a specific GitHub issue without running
 * duplication or similarity checks.
 *
 * Usage:
 *   npm run agent -- <pipeline> [--issue <n>] [--help]
 *
 * Pipelines:
 *   review              Review all pending GitHub issues (approve / reject / escalate)
 *   new-app             Build a new app (auto-selects suggestion via heuristics)
 *   improve             Improve an existing app (auto-selects improvement via heuristics)
 *
 * Options:
 *   --issue <n>         GitHub issue number to act on directly.
 *
 *                       new-app:  skips `select:app:suggestion`; bypasses duplication and
 *                                 recency checks — operator has pre-vetted the issue.
 *                       improve:  skips `select:app:improvement`; bypasses duplication and
 *                                 recency checks — operator has pre-vetted the issue.
 *                       review:   reviews only this issue instead of all pending.
 *
 *   --help              Show this help text.
 *
 * Examples:
 *   npm run agent -- review
 *   npm run agent -- review --issue 15
 *   npm run agent -- new-app
 *   npm run agent -- new-app --issue 42
 *   npm run agent -- improve
 *   npm run agent -- improve --issue 99
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROMPTS_DIR = resolve(ROOT, 'docs/agent-prompts');

// ─── Argument parsing ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  printHelp();
  process.exit(0);
}

const pipeline = args[0];
const issueIndex = args.indexOf('--issue');
const issueNumber = issueIndex !== -1 ? parseInt(args[issueIndex + 1], 10) : null;

const VALID_PIPELINES = ['review', 'new-app', 'improve'];

if (!VALID_PIPELINES.includes(pipeline)) {
  console.error(`\nError: unknown pipeline "${pipeline}"`);
  console.error(`Valid pipelines: ${VALID_PIPELINES.join(', ')}\n`);
  printHelp();
  process.exit(1);
}

if (issueIndex !== -1) {
  if (!args[issueIndex + 1] || isNaN(issueNumber) || issueNumber <= 0) {
    console.error('\nError: --issue requires a positive integer (e.g. --issue 42)\n');
    process.exit(1);
  }
}

// ─── Prompt composition ───────────────────────────────────────────────────────

const sharedPrompt = readPromptFile('AGENT_PROMPT_SHARED.md');

const pipelinePromptFile = {
  review: 'AGENT_PROMPT_ISSUE_REVIEW.md',
  'new-app': 'AGENT_PROMPT_NEW_APP.md',
  improve: 'AGENT_PROMPT_IMPROVEMENT.md',
}[pipeline];

const pipelinePrompt = readPromptFile(pipelinePromptFile);

const issueOverride = issueNumber ? buildIssueOverride(pipeline, issueNumber) : '';

const fullPrompt = [
  '# Valley of AI — Agent Pipeline Run',
  '',
  '## Shared Contracts (required reading)',
  '',
  sharedPrompt,
  '',
  '---',
  '',
  '## Pipeline Instructions',
  '',
  pipelinePrompt,
  issueOverride,
].join('\n');

// ─── Launch ───────────────────────────────────────────────────────────────────

const label = issueNumber ? `${pipeline} (issue #${issueNumber})` : pipeline;
console.log(`\nLaunching agent pipeline: ${label}`);
console.log('─'.repeat(50));

const result = spawnSync('claude', [], {
  input: fullPrompt,
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: false,
});

if (result.error) {
  if (result.error.code === 'ENOENT') {
    console.error('\nError: `claude` CLI not found in PATH.');
    console.error('Install it with: npm install -g @anthropic-ai/claude-code\n');
  } else {
    console.error(`\nError launching claude: ${result.error.message}\n`);
  }
  process.exit(1);
}

if (result.signal || result.status === null) {
  console.error(`\nError: \`claude\` terminated abnormally${result.signal ? ` (signal: ${result.signal})` : ''}.\n`);
  process.exit(1);
}

process.exit(result.status);
// ─── Helpers ──────────────────────────────────────────────────────────────────

function readPromptFile(filename) {
  const filePath = resolve(PROMPTS_DIR, filename);
  if (!existsSync(filePath)) {
    console.error(`\nError: prompt file not found: ${filePath}\n`);
    process.exit(1);
  }
  return readFileSync(filePath, 'utf8').trim();
}

function buildIssueOverride(pipelineName, number) {
  if (pipelineName === 'new-app') {
    return `

---

## ISSUE OVERRIDE — Operator directive

Issue #${number} has been specified directly by the operator.

- **Skip** \`npm run select:app:suggestion\` entirely.
- Treat issue #${number} as the selected suggestion — fetch its details with:
  \`gh issue view ${number} --json number,title,body,labels,state,url\`
- **Do not run duplication checks, recency checks, or compare against existing apps.**
  The operator has already reviewed this issue and confirmed it should be acted upon.
- Verify the issue is \`OPEN\` and labeled \`suggestion\` + \`status:approved\` before proceeding.
  If either check fails, stop and report why.
- Proceed directly to the guardrail check (Step 1.3), then continue the pipeline from there.
`;
  }

  if (pipelineName === 'improve') {
    return `

---

## ISSUE OVERRIDE — Operator directive

Issue #${number} has been specified directly by the operator.

- **Skip** \`npm run select:app:improvement\` entirely. This is Case B from the pipeline.
- Fetch the issue details with:
  \`gh issue view ${number} --json number,title,body,labels,state,url\`
- **Do not run duplication checks, recency checks, or compare against similar improvements.**
  The operator has already reviewed this issue and confirmed it should be acted upon.
- Verify all three conditions before proceeding:
  1. \`state\` is \`OPEN\`
  2. Labels include \`improvement\`
  3. Labels include \`status:approved\`
  If any check fails, stop and report why.
- Extract \`issueNumber\`, \`issueUrl\`, \`description\`, \`requestor\`, and \`targetApp.id\`
  from the issue body, then proceed directly to Step 1.4 (apply the improvement).
`;
  }

  if (pipelineName === 'review') {
    return `

---

## ISSUE OVERRIDE — Operator directive

Review **only** issue #${number} instead of the full pending queue.

- Skip \`npm run issues:pending\`.
- Fetch the issue directly with:
  \`gh issue view ${number} --json number,title,body,labels,state,url\`
- Apply the normal review process (guardrail check, legitimacy assessment, decision) to this
  single issue and record the decision with \`npm run issues:decide\`.
`;
  }

  return '';
}

function printHelp() {
  console.log(`
Usage:
  npm run agent -- <pipeline> [--issue <n>]

Pipelines:
  review              Review pending GitHub issues (approve / reject / escalate)
  new-app             Build a new app (auto-selects suggestion via heuristics)
  improve             Improve an existing app (auto-selects improvement via heuristics)

Options:
  --issue <n>         Act on a specific GitHub issue number, bypassing selection
                      heuristics and duplication checks (new-app and improve) or
                      reviewing only that issue (review).
  --help              Show this help text.

Examples:
  npm run agent -- review
  npm run agent -- review --issue 15
  npm run agent -- new-app
  npm run agent -- new-app --issue 42
  npm run agent -- improve
  npm run agent -- improve --issue 99
`);
}
