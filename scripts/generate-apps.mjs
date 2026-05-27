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
import { buildAppsRegistry } from './apps-registry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const APPS_DIR = path.join(rootDir, 'apps');
const OUTPUT_FILE = path.join(rootDir, 'data', 'apps.json');
const BASE_PATH = '';

/**
 * Main function
 */
async function main() {
  console.log('🔍 Scanning for apps...');

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
