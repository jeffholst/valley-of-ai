#!/usr/bin/env node

/**
 * Synchronizes category definitions across files that duplicate the canonical
 * category enum defined in docs/json-schema/meta.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const metaSchemaPath = path.join(root, 'docs', 'json-schema', 'meta.json');
const versusSchemaPath = path.join(root, 'docs', 'json-schema', 'versus.json');
const issueTemplatePath = path.join(root, '.github', 'ISSUE_TEMPLATE', 'app_suggestion.yml');
const sharedPromptPath = path.join(root, 'docs', 'agent-prompts', 'AGENT_PROMPT_SHARED.md');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getCanonicalCategories() {
  const metaSchema = readJson(metaSchemaPath);
  const categories = metaSchema?.properties?.category?.enum;

  if (!Array.isArray(categories) || categories.length === 0) {
    throw new Error('docs/json-schema/meta.json does not define properties.category.enum');
  }

  if (!categories.every((category) => typeof category === 'string' && category.trim().length > 0)) {
    throw new Error(
      'docs/json-schema/meta.json properties.category.enum must be non-empty strings'
    );
  }

  return categories;
}

function syncVersusSchema(categories) {
  const versusSchemaContent = fs.readFileSync(versusSchemaPath, 'utf8');
  const enumBlockPattern =
    /("category"\s*:\s*\{\s*"type"\s*:\s*"string"\s*,\s*"enum"\s*:\s*\[)([\s\S]*?)(\]\s*\})/m;
  const match = versusSchemaContent.match(enumBlockPattern);

  if (!match) {
    throw new Error('docs/json-schema/versus.json is missing items.properties.category.enum');
  }

  const indentMatch = match[2].match(/\n(\s*)"/);
  const valueIndent = indentMatch?.[1] ?? '          ';
  const enumValues = categories.map((category) => `${valueIndent}"${category}"`).join(',\n');
  const updated = versusSchemaContent.replace(
    enumBlockPattern,
    `${match[1]}\n${enumValues}\n${valueIndent.slice(0, -2)}${match[3]}`
  );

  fs.writeFileSync(versusSchemaPath, updated);
}

function syncIssueTemplate(categories) {
  const template = fs.readFileSync(issueTemplatePath, 'utf8');

  const optionsBlockPattern =
    /(id:\s*category[\s\S]*?^\s*options:\s*\n)([\s\S]*?)(^\s*validations:\s*\n)/m;
  const match = template.match(optionsBlockPattern);

  if (!match) {
    throw new Error(
      'Could not find the category options block in .github/ISSUE_TEMPLATE/app_suggestion.yml'
    );
  }

  const itemIndentMatch = match[2].match(/^(\s*)-\s+/m);
  const itemIndent = itemIndentMatch?.[1] ?? '        ';
  const optionsList = categories.map((category) => `${itemIndent}- ${category}`).join('\n');
  const updated = template.replace(optionsBlockPattern, `${match[1]}${optionsList}\n${match[3]}`);

  fs.writeFileSync(issueTemplatePath, updated);
}

function syncSharedPrompt(categories) {
  const prompt = fs.readFileSync(sharedPromptPath, 'utf8');
  const categoryLinePattern = /- `category`: one of .*$/m;
  const categoryList = categories.map((category) => `\`${category}\``).join(' | ');
  const replacement = `- \`category\`: one of ${categoryList}`;

  if (!categoryLinePattern.test(prompt)) {
    throw new Error(
      'Could not find the category line in docs/agent-prompts/AGENT_PROMPT_SHARED.md'
    );
  }

  const updated = prompt.replace(categoryLinePattern, replacement);
  fs.writeFileSync(sharedPromptPath, updated);
}

function main() {
  const categories = getCanonicalCategories();
  syncVersusSchema(categories);
  syncIssueTemplate(categories);
  syncSharedPrompt(categories);

  console.log(`Synchronized categories (${categories.length}): ${categories.join(', ')}`);
}

main();
