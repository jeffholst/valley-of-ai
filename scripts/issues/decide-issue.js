#!/usr/bin/env node
/**
 * Applies a review decision to a GitHub issue by updating labels and adding
 * a comment for approved, rejected, or needs-human-review outcomes.
 */

import { pathToFileURL } from 'url';
import {
  addLabels,
  commentOnIssue,
  getIssue,
  inferIssueType,
  issueHasLabel,
  loadEnv,
  removeLabels,
} from './lib/issue-github-client.js';

export const VALID_STATUSES = new Set(['approved', 'rejected', 'needs-human-review']);
const HUMAN_REVIEW_LABEL = 'status:needs-human-review';

function getArgValue(args, flag) {
  const exactIndex = args.indexOf(flag);
  if (exactIndex !== -1) {
    return args[exactIndex + 1] ?? null;
  }

  const prefixed = args.find((arg) => arg.startsWith(`${flag}=`));
  if (prefixed) {
    return prefixed.slice(flag.length + 1) || null;
  }

  return null;
}

export function parseArgs(args) {
  const positionalArgs = args.filter((arg) => !arg.startsWith('--'));

  const issueNumberValue = getArgValue(args, '--issue') ?? positionalArgs[0] ?? null;
  const status = getArgValue(args, '--status') ?? positionalArgs[1] ?? null;
  const reason = getArgValue(args, '--reason') ?? (positionalArgs.slice(2).join(' ') || null);

  if (!issueNumberValue || !status || !reason) {
    throw new Error(
      'Required: --issue <number> --status <approved|rejected|needs-human-review> --reason "<text>"'
    );
  }

  const issueNumber = Number(issueNumberValue);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error(`Invalid --issue value: ${issueNumberValue}`);
  }

  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Invalid --status value: ${status}`);
  }

  if (!reason.trim()) {
    throw new Error('Decision reason must not be empty.');
  }

  return { issueNumber, status, reason: reason.trim() };
}

export function buildDecisionComment(status, reason) {
  if (status === 'approved') {
    return `Approved for agent processing.\n\nReason: ${reason}`;
  }

  if (status === 'rejected') {
    return `Rejected after automated review.\n\nReason: ${reason}`;
  }

  return `Automated review could not safely make a final decision. Human review required.\n\nReason: ${reason}`;
}

export function validatePendingIssue(issue, issueNumber) {
  if (!issue) {
    throw new Error(`Issue not found: ${issueNumber}`);
  }

  if (String(issue.state).toLowerCase() !== 'open') {
    throw new Error(`Issue is not open: ${issueNumber}`);
  }

  if (!issueHasLabel(issue, 'status:pending')) {
    throw new Error(`Issue is not pending: ${issueNumber}`);
  }

  if (issueHasLabel(issue, 'status:approved') || issueHasLabel(issue, 'status:rejected')) {
    throw new Error(`Issue already has a terminal status: ${issueNumber}`);
  }

  if (!inferIssueType(issue)) {
    throw new Error(
      `Issue must have exactly one type label (suggestion or improvement): ${issueNumber}`
    );
  }
}

export function buildDecisionSummary(issueNumber, type, status, labelsRemoved, labelsAdded) {
  return {
    ok: true,
    issueNumber,
    type,
    finalStatus: status,
    labelsRemoved,
    labelsAdded,
    commentAdded: true,
  };
}

export function applyIssueDecision(
  { issueNumber, status, reason },
  deps = {
    getIssue,
    addLabels,
    removeLabels,
    commentOnIssue,
  }
) {
  const issue = deps.getIssue(issueNumber, ['number', 'state', 'labels']);
  validatePendingIssue(issue, issueNumber);

  const type = inferIssueType(issue);
  const labelsRemoved = [];
  const labelsAdded = [];
  const hasHumanReviewLabel = issueHasLabel(issue, HUMAN_REVIEW_LABEL);

  if (status === 'approved') {
    const labelsToRemove = ['status:pending'];
    if (hasHumanReviewLabel) {
      labelsToRemove.push(HUMAN_REVIEW_LABEL);
    }

    deps.removeLabels(issueNumber, labelsToRemove);
    deps.addLabels(issueNumber, ['status:approved']);
    labelsRemoved.push(...labelsToRemove);
    labelsAdded.push('status:approved');
  } else if (status === 'rejected') {
    const labelsToRemove = ['status:pending'];
    if (hasHumanReviewLabel) {
      labelsToRemove.push(HUMAN_REVIEW_LABEL);
    }

    deps.removeLabels(issueNumber, labelsToRemove);
    deps.addLabels(issueNumber, ['status:rejected']);
    labelsRemoved.push(...labelsToRemove);
    labelsAdded.push('status:rejected');
  } else {
    if (!hasHumanReviewLabel) {
      deps.addLabels(issueNumber, [HUMAN_REVIEW_LABEL]);
      labelsAdded.push(HUMAN_REVIEW_LABEL);
    }
  }

  deps.commentOnIssue(issueNumber, buildDecisionComment(status, reason));

  return buildDecisionSummary(issueNumber, type, status, labelsRemoved, labelsAdded);
}

export async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  loadEnv();

  const result = applyIssueDecision(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
