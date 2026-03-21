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
import { buildAppsRegistry } from './apps-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const APPS_DIR = path.join(rootDir, 'apps');
const OUTPUT_FILE = path.join(rootDir, 'data', 'apps.json');
const BASE_PATH = '';

/**
 * Main function
 */
function main() {
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
  
  // Write the registry
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(apps, null, 2));
  console.log(`\n✨ Generated ${OUTPUT_FILE} with ${apps.length} app(s)`);
}

main();
