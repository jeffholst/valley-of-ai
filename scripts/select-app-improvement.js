#!/usr/bin/env node
/**
 * select-app-improvement.js
 *
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
 *   node scripts/select-app-improvement.js
 *   node scripts/select-app-improvement.js --json   (suppress progress output)
 *
 * Output: JSON object printed to stdout.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const jsonOnly = process.argv.includes('--json');

function log(...args) {
  if (!jsonOnly) console.error(...args);
}

// ---------------------------------------------------------------------------
// Load env vars — .env first (base), then .env.local on top (local overrides).
// Already-set process.env values (from the shell) always take precedence.
// ---------------------------------------------------------------------------
function loadEnv() {
  function parseFile(filePath, overwrite) {
    if (!existsSync(filePath)) return;
    const lines = readFileSync(filePath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (overwrite || !process.env[key]) process.env[key] = val;
    }
  }
  parseFile(path.join(rootDir, '.env'), false);
  parseFile(path.join(rootDir, '.env.local'), true);
}

// ---------------------------------------------------------------------------
// GitHub helpers
// ---------------------------------------------------------------------------
function ghJson(cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function getRepoOwner() {
  try {
    return execSync(`gh api repos/{owner}/{repo} --jq '.owner.login'`, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function getTipTotal(issueNumber, repoOwner) {
  if (!repoOwner) return 0;
  try {
    const raw = execSync(`gh issue view ${issueNumber} --json comments`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const data = JSON.parse(raw);
    let total = 0;
    for (const comment of data.comments || []) {
      if (comment.author?.login !== repoOwner) continue;
      const matches = [...(comment.body || '').matchAll(/\$([0-9]+)/g)];
      for (const m of matches) total += parseInt(m[1], 10);
    }
    return total;
  } catch {
    return 0;
  }
}

function getBoostedImprovements() {
  log('  Checking boosted+approved improvement issues...');
  const issues = ghJson(
    `gh issue list --label "improvement" --label "status:approved" --label "boosted" --state open --json number,title,body,url --limit 20`
  );
  if (!issues || issues.length === 0) return null;

  const owner = getRepoOwner();
  log(`  Repo owner: ${owner}`);

  const ranked = issues.map((issue) => ({
    ...issue,
    tipTotal: getTipTotal(issue.number, owner),
  }));
  ranked.sort((a, b) => b.tipTotal - a.tipTotal || a.number - b.number);

  return ranked[0];
}

function getApprovedImprovements() {
  log('  Checking approved (non-boosted) improvement issues...');
  const issues = ghJson(
    `gh issue list --label "improvement" --label "status:approved" --state open --json number,title,body,url --limit 10`
  );
  if (!issues || issues.length === 0) return null;
  issues.sort((a, b) => a.number - b.number);
  return issues[0];
}

// ---------------------------------------------------------------------------
// App lookup helpers
// ---------------------------------------------------------------------------

/**
 * Extract the app path (e.g. "2026/03/22/freecell-mobile-classic") from an
 * improvement issue. Tries two sources:
 *   1. Title pattern: "Improvement [<app-path>]: ..."
 *   2. Body URL:      **App:** [Name](https://...valleyofai.com/apps/<app-path>)
 */
function extractAppPath(issue) {
  // Try title first: Improvement [2026/03/22/freecell-mobile-classic]: ...
  const titleMatch = issue.title.match(/\[([^\]]+)\]/);
  if (titleMatch) return titleMatch[1].replace(/^\/+/, '');

  // Fallback: body URL
  const bodyMatch = (issue.body || '').match(/valleyofai\.com\/apps\/([^\s)]+)/i);
  if (bodyMatch) return bodyMatch[1].replace(/\/$/, '');

  return null;
}

/**
 * Find the app by path id — checks data/apps.json first, then falls back to
 * reading meta.json directly from disk (catches apps with visible:false).
 */
function lookupApp(apps, appPath) {
  if (!appPath) return null;

  // 1. Try apps.json (visible apps)
  const fromRegistry = apps.find((a) => a.id === appPath || a.id.endsWith(appPath));
  if (fromRegistry) return fromRegistry;

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

  const requestor = (issue.body || '').match(/\*\*Requestor:\*\*\s*(.+)/i)?.[1]?.trim() ?? null;
  const description = (issue.body || '').match(/###\s*Description\s*\n+([\s\S]+?)(?:\n###|$)/i)?.[1]?.trim() ?? null;

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
  const boosted = getBoostedImprovements();
  if (boosted) {
    console.log(JSON.stringify(buildResult('github-boosted', boosted, apps), null, 2));
    return;
  }
  log('  None found.\n');

  // ---------------------------------------------------------------------------
  // Pass 2: Approved improvement issues
  // ---------------------------------------------------------------------------
  log('Pass 2: GitHub approved improvement issues');
  const approved = getApprovedImprovements();
  if (approved) {
    console.log(JSON.stringify(buildResult('github-approved', approved, apps), null, 2));
    return;
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
      'Use select-app-suggestion.js (npm run select:app:suggestion) if you want to build a new app instead.',
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('select-app-improvement.js error:', err);
  process.exit(1);
});
