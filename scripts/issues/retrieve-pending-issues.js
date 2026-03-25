#!/usr/bin/env node
/**
 * Lists open pending GitHub issues for automated review.
 * By default it returns fresh pending suggestion/improvement issues and can
 * optionally target the human-review queue instead.
 */

import { pathToFileURL } from 'url';
import {
  getIssue,
  inferIssueType,
  issueHasLabel,
  listIssuesByLabels,
  loadEnv,
} from './lib/issue-github-client.js';

const VALID_TYPES = new Set(['suggestion', 'improvement']);
const HUMAN_REVIEW_LABEL = 'status:needs-human-review';

function normalizeLabels(labels = []) {
  return labels.map((label) => (typeof label === 'string' ? label : label.name));
}

export function normalizeIssue(issue) {
  return {
    number: issue.number,
    type: inferIssueType(issue),
    title: issue.title,
    body: issue.body,
    url: issue.url,
    labels: normalizeLabels(issue.labels),
    createdAt: issue.createdAt,
    author: issue.author?.login ?? null,
  };
}

export function isPendingCandidate(issue, type = null, includeNeedsHumanReview = false) {
  const inferredType = inferIssueType(issue);

  if (!issueHasLabel(issue, 'status:pending')) {
    return false;
  }

  const hasNeedsHumanReviewLabel = issueHasLabel(issue, HUMAN_REVIEW_LABEL);

  if (includeNeedsHumanReview ? !hasNeedsHumanReviewLabel : hasNeedsHumanReviewLabel) {
    return false;
  }

  if (!VALID_TYPES.has(inferredType)) {
    return false;
  }

  if (type && inferredType !== type) {
    return false;
  }

  return true;
}

export function parseArgs(args) {
  const env = process.env;

  const getArgValue = (flag) => {
    const exactIndex = args.indexOf(flag);
    if (exactIndex !== -1) {
      return args[exactIndex + 1] ?? null;
    }

    const prefixed = args.find((arg) => arg.startsWith(`${flag}=`));
    if (prefixed) {
      return prefixed.slice(flag.length + 1) || null;
    }

    return null;
  };

  const getEnvValue = (key) => {
    const value = env[key];
    return value === undefined || value === '' ? null : value;
  };

  const getEnvBoolean = (key) => {
    const value = env[key];
    if (value === undefined) {
      return false;
    }

    return ['true', '1', ''].includes(String(value).toLowerCase());
  };

  const positionalArgs = args.filter((arg) => !arg.startsWith('--'));
  const positionalTypeCandidate = positionalArgs.find((arg) => !/^\d+$/.test(arg));
  const envTypeRaw = getEnvValue('npm_config_type');
  const envIssueNumber = getEnvValue('npm_config_issue');
  const envLimitValue = getEnvValue('npm_config_limit');
  const envNeedsHumanReview = getEnvBoolean('npm_config_needs_human_review');
  const envType =
    envTypeRaw && !['true', '1'].includes(String(envTypeRaw).toLowerCase()) ? envTypeRaw : null;

  if (
    !getArgValue('--type') &&
    !envType &&
    positionalTypeCandidate &&
    !VALID_TYPES.has(positionalTypeCandidate)
  ) {
    throw new Error(`Invalid --type value: ${positionalTypeCandidate}`);
  }

  const type = getArgValue('--type') ?? envType ?? positionalTypeCandidate ?? null;
  const issueNumber =
    getArgValue('--issue') ??
    envIssueNumber ??
    positionalArgs.find((arg) => /^\d+$/.test(arg) && arg !== type) ??
    null;
  const limitValue = getArgValue('--limit') ?? envLimitValue;
  const limit = limitValue ? Number(limitValue) : 50;

  if (type && !VALID_TYPES.has(type)) {
    throw new Error(`Invalid --type value: ${type}`);
  }

  if (issueNumber && (!Number.isInteger(Number(issueNumber)) || Number(issueNumber) <= 0)) {
    throw new Error(`Invalid --issue value: ${issueNumber}`);
  }

  if (limitValue && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error(`Invalid --limit value: ${limitValue}`);
  }

  return {
    jsonOnly: args.includes('--json'),
    includeNeedsHumanReview: args.includes('--needs-human-review') || envNeedsHumanReview,
    type,
    issueNumber: issueNumber ? Number(issueNumber) : null,
    limit,
  };
}

export function sortIssuesOldestFirst(issues) {
  return [...issues].sort((a, b) => {
    const createdAtDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    if (!Number.isNaN(createdAtDiff) && createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return a.number - b.number;
  });
}

export function buildRetrieveResult(issues) {
  return {
    found: issues.length > 0,
    count: issues.length,
    issues,
  };
}

export function retrievePendingIssues(
  options,
  deps = {
    getIssue,
    listIssuesByLabels,
  }
) {
  const { issueNumber, limit, type, includeNeedsHumanReview } = options;

  if (issueNumber) {
    const issue = deps.getIssue(issueNumber, [
      'number',
      'title',
      'body',
      'url',
      'state',
      'labels',
      'createdAt',
      'author',
    ]);

    if (
      !issue ||
      String(issue.state).toLowerCase() !== 'open' ||
      !isPendingCandidate(issue, type, includeNeedsHumanReview)
    ) {
      return buildRetrieveResult([]);
    }

    return buildRetrieveResult([normalizeIssue(issue)]);
  }

  const rawIssues =
    deps.listIssuesByLabels({
      labels: ['status:pending'],
      state: 'open',
      limit,
      fields: ['number', 'title', 'body', 'url', 'state', 'labels', 'createdAt', 'author'],
    }) ?? [];

  const issues = sortIssuesOldestFirst(
    rawIssues
      .filter((issue) => String(issue.state).toLowerCase() === 'open')
      .filter((issue) => isPendingCandidate(issue, type, includeNeedsHumanReview))
      .map(normalizeIssue)
  );

  return buildRetrieveResult(issues);
}

export async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  loadEnv();

  const result = retrievePendingIssues(options);
  process.stdout.write(`${JSON.stringify(result, null, options.jsonOnly ? 0 : 2)}\n`);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
