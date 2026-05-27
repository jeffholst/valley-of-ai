#!/usr/bin/env node
/**
 * Selects the next approved blog-post issue to execute.
 *
 * Selection strategy: FIFO — oldest approved issue by creation date.
 * When an issue is selected it is immediately locked by applying status:in-progress.
 *
 * Output: JSON object printed to stdout.
 *   found: true  → { found, issueNumber, title, category, description, keyPoints,
 *                     suggestedAuthorType, relatedApps, requestor }
 *   found: false → { found, reason }
 *
 * Usage:
 *   node scripts/issues/select-blog-suggestion.mjs
 *   node scripts/issues/select-blog-suggestion.mjs --json   (machine-readable only)
 *   node scripts/issues/select-blog-suggestion.mjs --dry-run (no label mutation)
 */

import {
  addLabels,
  issueHasLabel,
  listIssuesByLabels,
  loadEnv,
  removeLabels,
} from './lib/issue-github-client.mjs';

const jsonOnly = process.argv.includes('--json');
const dryRun = process.argv.includes('--dry-run');

function log(...args) {
  if (!jsonOnly) {
    console.error(...args);
  }
}

// ---------------------------------------------------------------------------
// Issue body parsers (handles both legacy markdown and YAML form formats)
// ---------------------------------------------------------------------------

function parseField(body, markdownKey, yamlHeading) {
  return (
    (body.match(new RegExp(`\\*\\*${markdownKey}:\\*\\*\\s*([^\\n]+)`, 'i')) ||
      body.match(new RegExp(`###\\s*${yamlHeading}\\s*\\n+([^\\n#]+)`, 'i')) ||
      [])[1]?.trim() ?? null
  );
}

function parseCategory(body) {
  return parseField(body, 'Category', 'Category');
}

function parseDescription(body) {
  // Multi-line: everything between "### Description" (or **Description:**) and next heading
  const yamlMatch = body.match(/###\s*Description\s*\n+([\s\S]*?)(?=\n###|\n\*\*|$)/i);
  if (yamlMatch) return yamlMatch[1].trim();
  const mdMatch = body.match(/\*\*Description:\*\*\s*([^\n]+)/i);
  return mdMatch ? mdMatch[1].trim() : null;
}

function parseKeyPoints(body) {
  const match = body.match(/###\s*Key Points\s*\n+([\s\S]*?)(?=\n###|\n\*\*|$)/i);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function parseSuggestedAuthorType(body) {
  const raw = parseField(body, 'Suggested Author Type', 'Suggested Author Type');
  if (!raw) return 'ai';
  const lower = raw.toLowerCase();
  if (lower.includes('human+ai') || lower.includes('human + ai')) return 'human+ai';
  if (lower.includes('human')) return 'human';
  return 'ai';
}

function parseRelatedApps(body) {
  const match = body.match(/###\s*Related Apps[^\n]*\n+([\s\S]*?)(?=\n###|\n\*\*|$)/i);
  if (!match) return [];
  return match[1]
    .split(/[\n,]+/)
    .map((s) => s.replace(/^[-*]\s*/, '').trim())
    .filter((s) => {
      if (!s) return false;
      const lower = s.toLowerCase();
      return lower !== '_no response_' && lower !== 'n/a' && lower !== 'none';
    });
}

function parseRequestor(body) {
  const value = parseField(body, 'Requestor', 'Requestor');
  if (!value || value.toLowerCase() === '_no response_') {
    return null;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Slug derivation from title
// ---------------------------------------------------------------------------

function deriveSlug(title, issueNumber) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

  if (slug) {
    return slug;
  }

  if (Number.isInteger(issueNumber) && issueNumber > 0) {
    return `issue-${issueNumber}`;
  }

  return `issue-${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  loadEnv();

  log('\n=== Blog Suggestion Selection Script ===\n');
  log('  Checking approved blog-post issues...');

  const issues = listIssuesByLabels({
    labels: ['blog-post', 'status:approved'],
    state: 'open',
    limit: 20,
    fields: ['number', 'title', 'body', 'url', 'labels', 'createdAt'],
  });

  if (issues === null) {
    throw new Error(
      'Failed to retrieve approved blog-post issues from GitHub. ' +
        'Check gh authentication and network connectivity.'
    );
  }

  if (!Array.isArray(issues)) {
    throw new Error('GitHub returned an unexpected response while listing blog-post issues.');
  }

  // Filter out any already locked with status:in-progress
  const available = issues.filter((issue) => !issueHasLabel(issue, 'status:in-progress'));

  if (available.length === 0) {
    const result = { found: false, reason: 'No approved blog-post issues found' };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // FIFO: oldest by createdAt, tiebreak by issue number
  available.sort((a, b) => {
    const dateDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return dateDiff !== 0 ? dateDiff : a.number - b.number;
  });

  const selected = available[0];
  log(`  Selected issue #${selected.number}: ${selected.title}`);

  // Apply status:in-progress to lock the issue
  if (!dryRun) {
    removeLabels(selected.number, ['status:approved']);
    addLabels(selected.number, ['status:in-progress']);
    log(`  Applied status:in-progress to issue #${selected.number}`);
  } else {
    log('  [dry-run] Skipped label mutation');
  }

  const body = selected.body ?? '';
  const result = {
    found: true,
    issueNumber: selected.number,
    issueUrl: selected.url,
    title: selected.title,
    slug: deriveSlug(selected.title, selected.number),
    category: parseCategory(body) ?? 'AI Experiments',
    description: parseDescription(body) ?? '',
    keyPoints: parseKeyPoints(body),
    suggestedAuthorType: parseSuggestedAuthorType(body),
    relatedApps: parseRelatedApps(body),
    requestor: parseRequestor(body),
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`select-blog-suggestion.mjs error: ${message}`);
  process.exit(1);
});
