import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const appsPath = path.join(repoRoot, 'data', 'apps.json');
const outputPath = path.join(repoRoot, 'data', 'app-vote-stats.json');
const recentWindowDays = 7;

dotenv.config({ path: path.join(repoRoot, '.env.local'), quiet: true });
dotenv.config({ path: path.join(repoRoot, '.env'), quiet: true });

function emptyStatsForApps(apps) {
  return Object.fromEntries(apps.map((app) => [app.id, { up: 0, down: 0, net: 0, recentNet: 0 }]));
}

function buildSnapshot(apps, votes, generatedAt) {
  const recentWindowStart =
    new Date(generatedAt).getTime() - recentWindowDays * 24 * 60 * 60 * 1000;
  const stats = emptyStatsForApps(apps);

  votes.forEach((vote) => {
    if (!stats[vote.app_id]) {
      return;
    }

    const isUp = vote.vote_type === 'up';
    if (isUp) {
      stats[vote.app_id].up += 1;
    } else {
      stats[vote.app_id].down += 1;
    }

    stats[vote.app_id].net = stats[vote.app_id].up - stats[vote.app_id].down;
    if (vote.created_at && new Date(vote.created_at).getTime() >= recentWindowStart) {
      stats[vote.app_id].recentNet += isUp ? 1 : -1;
    }
  });

  return {
    generatedAt,
    recentWindowDays,
    apps: stats,
  };
}

async function fetchVotes(appIds) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    console.warn('SUPABASE_URL or SUPABASE_SECRET_KEY is missing; writing zeroed vote stats.');
    return [];
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('app_votes')
    .select('app_id, vote_type, created_at')
    .in('app_id', appIds);

  if (error) {
    throw new Error(`Failed to fetch app votes: ${error.message}`);
  }

  return data ?? [];
}

async function main() {
  const apps = JSON.parse(await fs.readFile(appsPath, 'utf8'));
  const appIds = apps.map((app) => app.id);
  const generatedAt = new Date().toISOString();
  const votes = await fetchVotes(appIds);
  const snapshot = buildSnapshot(apps, votes, generatedAt);

  await fs.writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${path.relative(repoRoot, outputPath)} with ${votes.length} votes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
