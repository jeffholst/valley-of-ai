/**
 * Shared GitHub issue helpers for the issue-review and issue-selection scripts.
 * Wraps `gh` CLI calls, local env loading, and common issue/label utilities.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const moduleFilename = fileURLToPath(import.meta.url);
const moduleDirname = path.dirname(moduleFilename);
const rootDir = path.resolve(moduleDirname, '../../..');

export function loadEnv() {
  const preExistingKeys = new Set(Object.keys(process.env));

  function parseFile(filePath, overwrite) {
    if (!existsSync(filePath)) {
      return;
    }

    const lines = readFileSync(filePath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const eq = trimmed.indexOf('=');
      if (eq === -1) {
        continue;
      }

      const key = trimmed.slice(0, eq).trim();
      const value = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, '');

      // Shell and CI values should always win over repo-local files.
      if (preExistingKeys.has(key)) {
        continue;
      }

      // `.env.local` may override `.env` for local developer-specific tweaks.
      if (overwrite || !process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  parseFile(path.join(rootDir, '.env'), false);
  parseFile(path.join(rootDir, '.env.local'), true);
}

export function gh(command) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

export function ghJson(command) {
  try {
    return JSON.parse(gh(command));
  } catch {
    // Callers treat null as "GitHub command failed or returned invalid JSON".
    return null;
  }
}

export function listIssuesByLabels({ labels, state = 'open', limit = 20, fields }) {
  const labelFlags = labels.map((label) => `--label "${label}"`).join(' ');
  const jsonFields = fields.join(',');

  return ghJson(
    `gh issue list ${labelFlags} --state ${state} --limit ${limit} --json ${jsonFields}`
  );
}

export function getIssue(number, fields = ['number', 'title', 'body', 'url', 'state', 'labels']) {
  return ghJson(`gh issue view ${number} --json ${fields.join(',')}`);
}

export function getIssueComments(number) {
  const issue = getIssue(number, ['comments']);
  return issue?.comments ?? [];
}

export function addLabels(issueNumber, labels) {
  gh(`gh issue edit ${issueNumber} ${labels.map((label) => `--add-label "${label}"`).join(' ')}`);
}

export function removeLabels(issueNumber, labels) {
  gh(
    `gh issue edit ${issueNumber} ${labels.map((label) => `--remove-label "${label}"`).join(' ')}`
  );
}

export function commentOnIssue(issueNumber, body) {
  execSync(`gh issue comment ${issueNumber} --body-file -`, {
    input: body,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

export function getRepoOwner() {
  try {
    return gh("gh api repos/{owner}/{repo} --jq '.owner.login'");
  } catch {
    return null;
  }
}

export function issueHasLabel(issue, label) {
  return (issue.labels || []).some((item) =>
    typeof item === 'string' ? item === label : item.name === label
  );
}

export function inferIssueType(issue) {
  const suggestion = issueHasLabel(issue, 'suggestion');
  const improvement = issueHasLabel(issue, 'improvement');
  const blogPost = issueHasLabel(issue, 'blog-post');

  const typeCount = [suggestion, improvement, blogPost].filter(Boolean).length;
  if (typeCount !== 1) {
    return null;
  }

  if (suggestion) return 'suggestion';
  if (improvement) return 'improvement';
  return 'blog-post';
}
