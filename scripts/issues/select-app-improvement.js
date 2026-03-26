#!/usr/bin/env node
/**
 * Finds the highest-priority approved improvement request for an existing app.
 * Priority order:
 *   1. GitHub boosted+approved improvement issues (ranked by verified tip total)
 *   2. GitHub approved improvement issues (no boost label, oldest first)
 *   3. None found → exits with { source: 'none', found: false } — do not proceed.
 *
 * Unlike select-app-suggestion.js there is NO fallback to vote analysis or
 * category gaps. Improvements are always tied to a specific existing app;
 * if no approved requests exist, the agent should stop.
 *
 * Usage:
 *   node scripts/issues/select-app-improvement.js
 *   node scripts/issues/select-app-improvement.js --json   (suppress progress output)
 *
 * Output: JSON object printed to stdout.
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  getIssueComments,
  getRepoOwner,
  listIssuesByLabels,
  loadEnv,
} from './lib/issue-github-client.js';
import { extractAppPath } from './lib/issue-selection-heuristics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const jsonOnly = process.argv.includes('--json');

function log(...args) {
  if (!jsonOnly) {
    console.error(...args);
  }
}

function getTipTotal(issueNumber, repoOwner) {
  if (!repoOwner) {
    return 0;
  }

  const comments = getIssueComments(issueNumber);
  let total = 0;

  for (const comment of comments) {
    if (comment.author?.login !== repoOwner) {
      continue;
    }
    const matches = [...(comment.body || '').matchAll(/\$([0-9]+)/g)];
    for (const m of matches) {
      total += parseInt(m[1], 10);
    }
  }

  return total;
}

function getBoostedImprovements() {
  log('  Checking boosted+approved improvement issues...');
  const issues = listIssuesByLabels({
    labels: ['improvement', 'status:approved', 'boosted'],
    state: 'open',
    limit: 20,
    fields: ['number', 'title', 'body', 'url'],
  });
  if (!issues || issues.length === 0) {
    return [];
  }

  const owner = getRepoOwner();
  log(`  Repo owner: ${owner}`);

  const ranked = issues.map((issue) => ({
    ...issue,
    tipTotal: getTipTotal(issue.number, owner),
  }));
  ranked.sort((a, b) => b.tipTotal - a.tipTotal || a.number - b.number);

  return ranked;
}

function getApprovedImprovements() {
  log('  Checking approved (non-boosted) improvement issues...');
  const issues = listIssuesByLabels({
    labels: ['improvement', 'status:approved'],
    state: 'open',
    limit: 10,
    fields: ['number', 'title', 'body', 'url'],
  });
  if (!issues || issues.length === 0) {
    return [];
  }
  issues.sort((a, b) => a.number - b.number);
  return issues;
}

// ---------------------------------------------------------------------------
// App lookup helpers
// ---------------------------------------------------------------------------

/**
 * Find the app by path id — checks data/apps.json first, then falls back to
 * reading meta.json directly from disk (catches apps with visible:false).
 */
function lookupApp(apps, appPath) {
  if (!appPath) {
    return null;
  }

  // 1. Try apps.json (visible apps)
  const fromRegistry = apps.find((a) => a.id === appPath || a.id.endsWith(appPath));
  if (fromRegistry) {
    return fromRegistry;
  }

  // 2. Fall back to meta.json on disk (handles visible:false apps)
  const metaPath = path.join(rootDir, 'apps', ...appPath.split('/'), 'meta.json');
  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      return {
        id: appPath,
        name: meta.name,
        category: meta.category,
        tags: meta.tags,
        appPath: `/apps/${appPath}/${meta.homepagePath ?? 'index.html'}`,
        route: `/apps/${appPath}`,
        shortDescription: meta.shortDescription,
        visible: meta.visible ?? true,
        allowImprovements: meta.allowImprovements ?? true,
      };
    } catch {
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Build the enriched result for a found issue
// ---------------------------------------------------------------------------
function buildResult(source, issue, apps) {
  const appPath = extractAppPath(issue);
  const appEntry = lookupApp(apps, appPath);

  if (appEntry && appEntry.allowImprovements === false) {
    return {
      source: 'none',
      found: false,
      message: `App '${appPath}' has allowImprovements: false — skipping. Set allowImprovements: true in meta.json to re-enable improvements.`,
    };
  }

  const requestor = (issue.body || '').match(/\*\*Requestor:\*\*\s*(.+)/i)?.[1]?.trim() ?? null;
  const description =
    (issue.body || '').match(/###\s*Description\s*\n+([\s\S]+?)(?:\n###|$)/i)?.[1]?.trim() ?? null;

  return {
    source,
    found: true,
    issueNumber: issue.number,
    issueUrl: issue.url,
    title: issue.title,
    tipTotal: issue.tipTotal ?? 0,
    requestor,
    description,
    targetApp: appEntry
      ? {
          id: appEntry.id,
          name: appEntry.name,
          category: appEntry.category,
          tags: appEntry.tags,
          appPath: appEntry.appPath,
          route: appEntry.route,
          shortDescription: appEntry.shortDescription,
        }
      : {
          id: appPath,
          name: null,
          note: 'App not found in data/apps.json — verify the app path in the issue.',
        },
    reasoning:
      source === 'github-boosted'
        ? `Boosted improvement issue #${issue.number} with $${issue.tipTotal ?? 0} in verified tips — highest priority.`
        : `Approved improvement issue #${issue.number} — oldest open request.`,
    prompt: issue.body,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  loadEnv();

  log('\n=== App Improvement Selection Script ===\n');

  const appsPath = path.join(rootDir, 'data', 'apps.json');
  const apps = JSON.parse(readFileSync(appsPath, 'utf8'));

  // ---------------------------------------------------------------------------
  // Pass 1: Boosted improvement issues
  // ---------------------------------------------------------------------------
  log('Pass 1: GitHub boosted improvement issues');
  const boostedList = getBoostedImprovements();
  for (const issue of boostedList) {
    const result = buildResult('github-boosted', issue, apps);
    if (result.found) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    log(`  Skipping issue #${issue.number}: ${result.message}`);
  }
  log('  None found.\n');

  // ---------------------------------------------------------------------------
  // Pass 2: Approved improvement issues
  // ---------------------------------------------------------------------------
  log('Pass 2: GitHub approved improvement issues');
  const approvedList = getApprovedImprovements();
  for (const issue of approvedList) {
    const result = buildResult('github-approved', issue, apps);
    if (result.found) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    log(`  Skipping issue #${issue.number}: ${result.message}`);
  }
  log('  None found.\n');

  // ---------------------------------------------------------------------------
  // No improvements found — stop here, do not proceed.
  // ---------------------------------------------------------------------------
  const result = {
    source: 'none',
    found: false,
    message:
      'No approved improvement requests found. Do not proceed with an improvement run. ' +
      'Use scripts/issues/select-app-suggestion.js (npm run select:app:suggestion) if you want to build a new app instead.',
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('select-app-improvement.js error:', err);
  process.exit(1);
});
