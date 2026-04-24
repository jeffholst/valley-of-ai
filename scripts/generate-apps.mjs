#!/usr/bin/env node

/**
 * Registry Generator Script
 *
 * Scans the apps/ directory for meta.json files and generates
 * a consolidated apps.json registry in data/
 *
 * Usage: node scripts/generate-apps.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format as formatWithPrettier } from 'prettier';
import {
  buildAppsRegistry,
  detectLeaderboardUsageFromAppDir,
  findMetaFiles,
} from './apps-registry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const APPS_DIR = path.join(rootDir, 'apps');
const OUTPUT_FILE = path.join(rootDir, 'data', 'apps.json');
const BASE_PATH = '';

async function syncLeaderboardFlags() {
  const metaFiles = findMetaFiles(APPS_DIR);
  let updatedCount = 0;

  for (const metaFile of metaFiles) {
    try {
      const rawMeta = fs.readFileSync(metaFile, 'utf8');
      const meta = JSON.parse(rawMeta);
      const appDir = path.dirname(metaFile);
      const detectedLeaderboard = detectLeaderboardUsageFromAppDir(appDir);

      if (meta.leaderboard === detectedLeaderboard) {
        continue;
      }

      meta.leaderboard = detectedLeaderboard;
      const formattedMeta = await formatWithPrettier(JSON.stringify(meta), { parser: 'json' });
      fs.writeFileSync(metaFile, formattedMeta);
      updatedCount += 1;
    } catch (error) {
      throw new Error(`Failed to sync leaderboard flag for ${metaFile}: ${error.message}`);
    }
  }

  return { metaFilesCount: metaFiles.length, updatedCount };
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Scanning for apps...');

  const { metaFilesCount, updatedCount } = await syncLeaderboardFlags();
  console.log(
    `   Synced leaderboard metadata for ${metaFilesCount} app(s) (${updatedCount} file(s) updated)`
  );

  const { apps, metaFiles, warnings } = buildAppsRegistry({
    appsDir: APPS_DIR,
    basePath: BASE_PATH,
  });
  console.log(`   Found ${metaFiles.length} app(s)`);

  for (const warning of warnings) {
    console.warn(`   ⚠️  ${warning}`);
  }

  for (const app of apps) {
    console.log(`   ✅ ${app.name} (${app.id})`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the registry using Prettier so future formatting steps do not
  // create style-only diffs for data/apps.json.
  const rawJson = JSON.stringify(apps, null, 2);
  const formattedJson = await formatWithPrettier(rawJson, { parser: 'json' });
  fs.writeFileSync(OUTPUT_FILE, formattedJson);
  console.log(`\n✨ Generated ${OUTPUT_FILE} with ${apps.length} app(s)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
