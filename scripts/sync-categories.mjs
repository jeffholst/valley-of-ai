#!/usr/bin/env node

/**
 * Synchronizes category definitions across files that duplicate the canonical
 * category enum defined in schemas/meta.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  transformVersusSchema,
  transformIssueTemplate,
  transformSharedPrompt,
} from './category-transforms.mjs';
export { transformVersusSchema, transformIssueTemplate, transformSharedPrompt };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const metaSchemaPath = path.join(root, 'schemas', 'meta.json');
const versusSchemaPath = path.join(root, 'schemas', 'versus.json');
const issueTemplatePath = path.join(root, '.github', 'ISSUE_TEMPLATE', 'app_suggestion.yml');
const sharedPromptPath = path.join(root, 'pipelines', 'prompts', 'shared.md');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getCanonicalCategories() {
  const metaSchema = readJson(metaSchemaPath);
  const categories = metaSchema?.properties?.category?.enum;

  if (!Array.isArray(categories) || categories.length === 0) {
    throw new Error('schemas/meta.json does not define properties.category.enum');
  }

  if (!categories.every((category) => typeof category === 'string' && category.trim().length > 0)) {
    throw new Error('schemas/meta.json properties.category.enum must be non-empty strings');
  }

  return categories;
}

function syncVersusSchema(categories) {
  const updated = transformVersusSchema(fs.readFileSync(versusSchemaPath, 'utf8'), categories);
  fs.writeFileSync(versusSchemaPath, updated);
}

function syncIssueTemplate(categories) {
  const updated = transformIssueTemplate(fs.readFileSync(issueTemplatePath, 'utf8'), categories);
  fs.writeFileSync(issueTemplatePath, updated);
}

function syncSharedPrompt(categories) {
  const updated = transformSharedPrompt(fs.readFileSync(sharedPromptPath, 'utf8'), categories);
  fs.writeFileSync(sharedPromptPath, updated);
}

function main() {
  const categories = getCanonicalCategories();
  syncVersusSchema(categories);
  syncIssueTemplate(categories);
  syncSharedPrompt(categories);

  console.log(`Synchronized categories (${categories.length}): ${categories.join(', ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
