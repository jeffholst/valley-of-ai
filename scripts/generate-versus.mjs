#!/usr/bin/env node

/**
 * Versus Registry Generator Script
 *
 * Reads data/versus.json (hand-authored competition definitions) and
 * data/apps.json (the app registry), then produces data/versus-registry.json
 * with each entry enriched with app metadata for fast frontend rendering.
 *
 * Usage: node scripts/generate-versus.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format as formatWithPrettier } from 'prettier';
import { validateVersusData, buildVersusRegistry } from './versus-registry.mjs';

// Re-export for consumers that import from this file (e.g. validate-apps.js)
export { validateVersusData, buildVersusRegistry };

const generatorFile = fileURLToPath(import.meta.url);
const generatorDir = path.dirname(generatorFile);
const rootDir = path.resolve(generatorDir, '..');

const VERSUS_INPUT = path.join(rootDir, 'data', 'versus.json');
const APPS_REGISTRY = path.join(rootDir, 'data', 'apps.json');
const VERSUS_OUTPUT = path.join(rootDir, 'data', 'versus-registry.json');

async function main() {
  // Load inputs
  if (!fs.existsSync(VERSUS_INPUT)) {
    console.log('No data/versus.json found — skipping versus registry generation.');
    return;
  }

  if (!fs.existsSync(APPS_REGISTRY)) {
    console.error('ERROR: data/apps.json not found. Run `npm run generate:apps` first.');
    process.exit(1);
  }

  const competitions = JSON.parse(fs.readFileSync(VERSUS_INPUT, 'utf-8'));
  const apps = JSON.parse(fs.readFileSync(APPS_REGISTRY, 'utf-8'));
  const appsById = new Map(apps.map((a) => [a.id, a]));

  console.log(`Found ${competitions.length} versus competition(s)`);

  // Validate
  const errors = validateVersusData(competitions, appsById);
  if (errors.length > 0) {
    console.error('Validation errors:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // Build enriched registry
  const registry = buildVersusRegistry(competitions, appsById);

  // Sort newest first
  registry.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Write output
  const rawJson = JSON.stringify(registry, null, 2);
  const formattedJson = await formatWithPrettier(rawJson, { parser: 'json' });
  fs.writeFileSync(VERSUS_OUTPUT, formattedJson);

  for (const comp of registry) {
    const models = comp.entries.map((e) => e.model).join(' vs ');
    console.log(`  ${comp.title} (${models})`);
  }
  console.log(`\nGenerated ${VERSUS_OUTPUT} with ${registry.length} competition(s)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
