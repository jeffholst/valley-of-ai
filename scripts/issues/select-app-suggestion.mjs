#!/usr/bin/env node
/**
 * Determines the best app concept to build next.
 * Priority order:
 *   1. GitHub boosted+approved suggestions (ranked by verified tip total)
 *   2. GitHub approved suggestions (no boost label)
 *   3. Vote-inspired concept (top-voted apps → similar but distinct idea)
 *   4. Category gap (popular category with few apps)
 *
 * Usage:
 *   node scripts/issues/select-app-suggestion.js
 *   node scripts/issues/select-app-suggestion.js --json   (machine-readable output only)
 *
 * Output: JSON recommendation object printed to stdout.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  getIssueComments,
  getRepoOwner,
  listIssuesByLabels,
  loadEnv,
} from './lib/issue-github-client.mjs';
import {
  computeSaturatedTags,
  computeRecentTags,
  computeDuplicationRisk,
} from './lib/issue-selection-heuristics.mjs';

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

function getBoostedIssues() {
  log('  Checking boosted+approved issues...');
  const issues = listIssuesByLabels({
    labels: ['suggestion', 'status:approved', 'boosted'],
    state: 'open',
    limit: 20,
    fields: ['number', 'title', 'body', 'url'],
  });
  if (issues === null) {
    throw new Error(
      'Failed to retrieve boosted approved suggestions from GitHub. ' +
        'Check gh authentication and network connectivity.'
    );
  }
  if (!Array.isArray(issues)) {
    throw new Error('GitHub returned an unexpected response while listing boosted suggestions.');
  }
  if (issues.length === 0) {
    return null;
  }

  const owner = getRepoOwner();
  log(`  Repo owner: ${owner}`);

  const ranked = issues.map((issue) => ({
    ...issue,
    tipTotal: getTipTotal(issue.number, owner),
  }));
  ranked.sort((a, b) => b.tipTotal - a.tipTotal || a.number - b.number);

  return ranked[0];
}

function getApprovedIssues() {
  log('  Checking approved (non-boosted) issues...');
  const issues = listIssuesByLabels({
    labels: ['suggestion', 'status:approved'],
    state: 'open',
    limit: 10,
    fields: ['number', 'title', 'body', 'url'],
  });
  if (issues === null) {
    throw new Error(
      'Failed to retrieve approved suggestions from GitHub. ' +
        'Check gh authentication and network connectivity.'
    );
  }
  if (!Array.isArray(issues)) {
    throw new Error('GitHub returned an unexpected response while listing approved suggestions.');
  }
  if (issues.length === 0) {
    return null;
  }
  // Prefer lower (older) issue numbers
  issues.sort((a, b) => a.number - b.number);
  return issues[0];
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------
function buildSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getVoteCounts(supabase, appIds) {
  const { data, error } = await supabase
    .from('app_votes')
    .select('app_id, vote_type')
    .in('app_id', appIds);

  if (error || !data) {
    return {};
  }

  const counts = {};
  for (const id of appIds) {
    counts[id] = { up: 0, down: 0, net: 0 };
  }
  for (const row of data) {
    if (!counts[row.app_id]) {
      counts[row.app_id] = { up: 0, down: 0, net: 0 };
    }
    if (row.vote_type === 'up') {
      counts[row.app_id].up += 1;
    } else {
      counts[row.app_id].down += 1;
    }
    counts[row.app_id].net = counts[row.app_id].up - counts[row.app_id].down;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Category gap analysis
// ---------------------------------------------------------------------------
function analyzeCategoryGaps(apps, voteCounts) {
  // Known broadly-popular categories (rough ordering by general user appeal)
  const popularityRank = {
    Games: 1,
    Entertainment: 2,
    Productivity: 3,
    Utilities: 4,
    Education: 5,
    Visualizations: 6,
    Design: 7,
    Icebreakers: 8,
  };

  const byCategory = {};
  for (const app of apps) {
    const cat = app.category || 'Unknown';
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, totalNet: 0, apps: [] };
    }
    const vc = voteCounts[app.id] || { net: 0 };
    byCategory[cat].count += 1;
    byCategory[cat].totalNet += vc.net;
    byCategory[cat].apps.push(app.name);
  }

  const gaps = Object.entries(byCategory).map(([cat, stats]) => ({
    category: cat,
    count: stats.count,
    avgNetVotes: stats.count > 0 ? +(stats.totalNet / stats.count).toFixed(2) : 0,
    popularityRank: popularityRank[cat] ?? 99,
  }));

  // Score: high popularity rank (low number) + high avg votes + low app count
  gaps.sort((a, b) => {
    const scoreA = a.avgNetVotes / Math.sqrt(a.count) - a.popularityRank * 0.5;
    const scoreB = b.avgNetVotes / Math.sqrt(b.count) - b.popularityRank * 0.5;
    return scoreB - scoreA;
  });

  return gaps;
}

// ---------------------------------------------------------------------------
// Vote-inspired concept analysis
// ---------------------------------------------------------------------------
function getTopVotedApps(apps, voteCounts, n = 5) {
  return apps
    .map((app) => ({ ...app, net: (voteCounts[app.id] || { net: 0 }).net }))
    .sort((a, b) => b.net - a.net)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  loadEnv();

  log('\n=== App Selection Script ===\n');

  // Load apps registry
  const appsPath = path.join(rootDir, 'data', 'apps.json');
  const apps = JSON.parse(readFileSync(appsPath, 'utf8'));
  const appIds = apps.map((a) => a.id);

  // Compute similarity context once — used by all passes
  const saturatedTags = computeSaturatedTags(apps);
  const recentTags = computeRecentTags(apps, 14);

  const similarityContext = {
    saturatedTags,
    recentTags,
    note: 'Avoid concepts whose core mechanic is defined primarily by saturated or recent tags. These indicate oversupply in the current catalog.',
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  // Parses the Category from an issue body.
  // Handles both the legacy markdown format (**Category:** <value>)
  // and the YAML issue form format (### Category\n\n<value>).
  function parseCategory(body) {
    return (
      (body.match(/\*\*Category:\*\*\s*([^\n]+)/i) ||
        body.match(/###\s*Category\s*\n+([^\n#]+)/i) ||
        [])[1]?.trim() ?? null
    );
  }

  // ---------------------------------------------------------------------------
  // Pass 1: GitHub boosted issues
  // ---------------------------------------------------------------------------
  log('Pass 1: GitHub boosted issues');
  const boosted = getBoostedIssues();
  if (boosted) {
    const dupRisk = computeDuplicationRisk(`${boosted.title} ${boosted.body}`, apps);
    const category = parseCategory(boosted.body);
    const existingInCategory = category
      ? apps
          .filter((a) => a.category?.toLowerCase() === category.toLowerCase())
          .map((a) => ({ name: a.name, tags: a.tags }))
      : [];
    const result = {
      source: 'github-boosted',
      issueNumber: boosted.number,
      issueUrl: boosted.url,
      title: boosted.title,
      tipTotal: boosted.tipTotal,
      reasoning: `Boosted issue #${boosted.number} with $${boosted.tipTotal} in verified tips — highest priority.`,
      prompt: boosted.body,
      duplicationRisk: dupRisk,
      existingAppsInCategory: existingInCategory,
      similarityContext,
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  log('  None found.\n');

  // ---------------------------------------------------------------------------
  // Pass 2: GitHub approved issues
  // ---------------------------------------------------------------------------
  log('Pass 2: GitHub approved issues');
  const approved = getApprovedIssues();
  if (approved) {
    const dupRisk = computeDuplicationRisk(`${approved.title} ${approved.body}`, apps);
    const category = parseCategory(approved.body);
    const existingInCategory = category
      ? apps
          .filter((a) => a.category?.toLowerCase() === category.toLowerCase())
          .map((a) => ({ name: a.name, tags: a.tags }))
      : [];
    const result = {
      source: 'github-approved',
      issueNumber: approved.number,
      issueUrl: approved.url,
      title: approved.title,
      reasoning: `Approved community suggestion #${approved.number} — oldest open request.`,
      prompt: approved.body,
      duplicationRisk: dupRisk,
      existingAppsInCategory: existingInCategory,
      similarityContext,
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  log('  None found.\n');

  // ---------------------------------------------------------------------------
  // Pass 3 & 4: Supabase vote analysis + category gap
  // ---------------------------------------------------------------------------
  log('Pass 3: Vote-inspired concept + category gap analysis');

  const supabase = buildSupabaseClient();
  let voteCounts = {};

  if (supabase) {
    log('  Fetching vote counts from Supabase...');
    voteCounts = await getVoteCounts(supabase, appIds);
    log(`  Got vote data for ${Object.keys(voteCounts).length} apps.`);
  } else {
    log('  Supabase not configured — vote counts unavailable, using 0 for all apps.');
  }

  const topVoted = getTopVotedApps(apps, voteCounts, 5);
  const categoryGaps = analyzeCategoryGaps(apps, voteCounts);

  // For each top-voted app, list sibling apps in the same category so the AI
  // can see what's already been done there and pick a distinct angle.
  const voteInspired = topVoted.map((app) => {
    const siblings = apps
      .filter((a) => a.category === app.category && a.id !== app.id)
      .map((a) => ({ name: a.name, tags: a.tags }));
    return {
      inspiredBy: app.name,
      category: app.category,
      tags: app.tags,
      netVotes: app.net,
      existingAppsInCategory: siblings,
      suggestion: `Build something in the ${app.category} space inspired by "${app.name}" (${app.net} net votes). Avoid duplicating: ${siblings.map((s) => s.name).join(', ') || 'none yet'}.`,
    };
  });

  const topGap = categoryGaps[0];

  const result = {
    source: 'vote-and-category-analysis',
    reasoning:
      'No open GitHub suggestions found. Recommendations based on top-voted apps and category engagement gaps.',
    similarityContext,
    topVotedApps: topVoted.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      tags: a.tags,
      netVotes: a.net,
    })),
    voteInspiredConcepts: voteInspired,
    categoryGaps: categoryGaps.map((g) => ({
      category: g.category,
      appCount: g.count,
      avgNetVotes: g.avgNetVotes,
    })),
    recommendation: {
      primary: voteInspired[0]
        ? `Vote-inspired: ${voteInspired[0].suggestion}`
        : 'Unable to determine vote-inspired concept.',
      secondary: topGap
        ? `Category gap: "${topGap.category}" has ${topGap.count} apps with avg ${topGap.avgNetVotes} net votes — consider a new ${topGap.category} app.`
        : null,
    },
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`select-app-suggestion.js error: ${message}`);
  process.exit(1);
});
