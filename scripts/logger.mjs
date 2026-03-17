#!/usr/bin/env node

/**
 * Unified Logging Utility for Valley of AI App Generation Pipeline
 * 
 * USAGE:
 * npm run log -- --runId <RUN_ID> --appId <APP_ID> --category <CATEGORY> [OPTIONS]
 *
 * Categories:
 *   pipeline    - Pipeline steps (requires: --step)
 *   reasoning   - Agent reasoning/decisions (requires: --message, optionally --decision)
 *   validation  - Checks and validation (requires: --checkType, --result)
 *
 * Common OPTIONS:
 *   --message <TEXT>      Human-readable description of the log entry
 *   --phase <PHASE>       Pipeline phase (e.g., GENERATE_HTML, VALIDATE_APP)
 *   --status <STATUS>     started|success|in_progress|failed (default: completed; legacy: completed|in-progress)
 *   --appPath <PATH>      Optional app path (overrides YYYY/MM/DD/<appId>)
 *   --dry-run             Print entry without appending
 *
 * Pipeline-specific OPTIONS (only for --category pipeline):
 *   --step <STEP_NAME>    Step name (SELECT_SUGGESTION, GENERATE_HTML, etc.)
 *   --seq <N>             Step sequence number (1-14) — for progress tracking only
 *   --durationMs <N>      Duration in milliseconds
 *   --tokensIn <N>        Input tokens consumed
 *   --tokensOut <N>       Output tokens produced
 *
 * Reasoning-specific OPTIONS:
 *   --decision <DECISION> Decision made (will be part of reasoning object)
 *   --alternatives <CSV>  Comma-separated alternatives considered
 *   --rationale <TEXT>    Why this decision over alternatives
 *
 * Validation-specific OPTIONS:
 *   --checkType <TYPE>    file-exists|schema-valid|test-pass|responsive|performance
 *   --name <NAME>         Human-readable check name
 *   --result <RESULT>     PASS|FAIL|WARN
 *   --details <JSON>      Additional metadata about the check
 *
 * EXAMPLES:
 *   # Pipeline step with seq for progress tracking
 *   npm run log -- --runId run-20260316-abc123 --appId my-app --category pipeline \
 *     --step GENERATE_HTML --seq 3 --status success --durationMs 5000 \
 *     --tokensIn 3000 --tokensOut 2500 --message "Generated index.html"
 *
 *   # Reasoning entry (no seq needed)
 *   npm run log -- --runId run-20260316-abc123 --appId my-app --category reasoning \
 *     --phase GENERATE_HTML --message "2x2 grid optimal for mobile" \
 *     --decision "grid-2x2" --alternatives "grid-3x3,grid-responsive" \
 *     --rationale "Better thumb reach on mobile"
 *
 *   # Validation check (no seq)
 *   npm run log -- --runId run-20260316-abc123 --appId my-app --category validation \
 *     --checkType "file-exists" --name "HTML validation" --result PASS \
 *     --message "All 53 HTML files valid"
 */

import fs from 'fs';
import path from 'path';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2));

// Validation
if (!args.runId || !args.appId || !args.category) {
  console.error('ERROR: --runId, --appId, and --category are required');
  console.error('Usage: npm run log -- --runId <ID> --appId <ID> --category <TYPE> [OPTIONS]');
  process.exit(1);
}

// Validate category
if (!['pipeline', 'reasoning', 'validation'].includes(args.category)) {
  console.error(`ERROR: --category must be one of: pipeline, reasoning, validation (got: ${args.category})`);
  process.exit(1);
}

// Validate appId as a safe slug to avoid path traversal and invalid characters
const appIdSlugPattern = /^[a-zA-Z0-9_-]+$/;
if (!appIdSlugPattern.test(args.appId)) {
  console.error(`ERROR: --appId must match ${appIdSlugPattern} (got: ${args.appId})`);
  process.exit(1);
}

// Validate pipeline-specific requirements
if (args.category === 'pipeline' && !args.step) {
  console.error('ERROR: --step is required for pipeline entries');
  process.exit(1);
}

if (args.category === 'validation' && !args.checkType) {
  console.error('ERROR: --checkType is required for validation entries');
  process.exit(1);
}

if (args.category === 'validation' && !args.result) {
  console.error('ERROR: --result is required for validation entries');
  process.exit(1);
}

// Build unified entry
const entry = {
  timestamp: new Date().toISOString(),
  runId: args.runId,
  appId: args.appId,
  category: args.category,
  message: args.message || '',
};

// Add phase if present (optional but useful for reasoning and pipeline)
if (args.phase) {
  entry.phase = args.phase;
}

// Populate category-specific fields
if (args.category === 'pipeline') {
  const pipelineStatus = args.status || 'completed';
  entry.pipeline = {
    step: args.step,
    seq: args.seq ? parseInt(args.seq) : null,
    status: pipelineStatus,
    durationMs: args.durationMs ? parseInt(args.durationMs) : null,
    tokensIn: args.tokensIn ? parseInt(args.tokensIn) : null,
    tokensOut: args.tokensOut ? parseInt(args.tokensOut) : null,
  };

  // Backward-compatible top-level fields for existing logs UI
  // The logs UI expects:
  //   - entry.type in {'TRANSACTION_START', 'TRANSACTION_END', 'STEP'}
  //   - entry.step, entry.status, entry.seq, entry.durationMs, entry.tokensIn, entry.tokensOut
  //
  // Derive entry.type from status where possible so transaction boundaries are visible
  const normalizedStatus = String(pipelineStatus).toLowerCase();
  let entryType = 'STEP';
  if (normalizedStatus === 'started' || normalizedStatus === 'in_progress' || normalizedStatus === 'in-progress') {
    entryType = 'TRANSACTION_START';
  } else if (
    normalizedStatus === 'success' ||
    normalizedStatus === 'failed' ||
    normalizedStatus === 'completed'
  ) {
    entryType = 'TRANSACTION_END';
  }

  entry.type = entryType;
  entry.step = entry.pipeline.step;
  entry.seq = entry.pipeline.seq;
  entry.status = entry.pipeline.status;
  entry.durationMs = entry.pipeline.durationMs;
  entry.tokensIn = entry.pipeline.tokensIn;
  entry.tokensOut = entry.pipeline.tokensOut;

  // Also expose aggregate fields used by dashboards for TRANSACTION_END entries.
  // For callers that use this script to emit TRANSACTION_END, they can treat these
  // as totals; for regular STEP entries these simply mirror the step metrics.
  entry.totalDurationMs = entry.pipeline.durationMs;
  entry.totalTokensIn = entry.pipeline.tokensIn;
  entry.totalTokensOut = entry.pipeline.tokensOut;
} else if (args.category === 'reasoning') {
  entry.reasoning = {
    decision: args.decision || null,
    alternatives: args.alternatives ? args.alternatives.split(',').map(a => a.trim()) : [],
    rationale: args.rationale || null,
  };
} else if (args.category === 'validation') {
  let details = {};
  if (args.details) {
    try {
      details = JSON.parse(args.details);
    } catch (err) {
      console.error('ERROR: --details must be valid JSON');
      console.error(`Parsing error: ${err.message}`);
      process.exit(1);
    }
  }
  entry.validation = {
    checkType: args.checkType,
    name: args.name || null,
    result: args.result,
    details,
  };
}

// Output entry to console
console.log(JSON.stringify(entry, null, 2));

// Append to logs (unless dry-run)
if (!args['dry-run']) {
  try {
    appendToLogs(args.appId, entry);
  } catch (err) {
    console.error(`ERROR appending to logs: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Append entry to both central and app-level logs
 * @param {string} appId - App ID
 * @param {object} entry - Log entry
 */
function appendToLogs(appId, entry) {
  // Base directory for all apps; all app paths must stay within this directory
  const baseAppsDir = path.resolve('apps');

  // Parse appPath (format: YYYY/MM/DD/<appId> or custom path relative to apps/)
  let appPath = args.appPath;
  if (!appPath) {
    const timestamp = entry.timestamp;
    const date = new Date(timestamp);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    // Default structure: apps/YYYY/MM/DD/<appId>
    appPath = path.join(baseAppsDir, year.toString(), month, day, appId);
  } else {
    // Treat custom appPath as relative to baseAppsDir and enforce it stays under baseAppsDir
    const resolvedAppPath = path.resolve(baseAppsDir, appPath);
    const relative = path.relative(baseAppsDir, resolvedAppPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Invalid --appPath; must resolve within ${baseAppsDir} (got: ${args.appPath})`);
    }
    appPath = resolvedAppPath;
  }

  // Ensure app-level directory exists
  ensureDirectoryExists(appPath);

  // Append to app-level log
  const appLogPath = path.join(appPath, 'log.jsonl');
  fs.appendFileSync(appLogPath, JSON.stringify(entry) + '\n', 'utf8');

  // Append to central log (same YYYY/MM/DD structure)
  const timestamp = entry.timestamp;
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const centralLogPath = path.join('logs', year.toString(), month, day + '.jsonl');

  ensureDirectoryExists(path.dirname(centralLogPath));
  fs.appendFileSync(centralLogPath, JSON.stringify(entry) + '\n', 'utf8');

  console.error(`✓ Logged to: ${appLogPath}`);
  console.error(`✓ Logged to: ${centralLogPath}`);
}

/**
 * Ensure directory exists, creating if needed
 * @param {string} dirPath - Path to directory
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
