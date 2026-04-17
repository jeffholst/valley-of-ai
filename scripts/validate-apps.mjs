#!/usr/bin/env node

/**
 * Validates generated apps before they are committed or deployed.
 *
 * This script checks each app's HTML shell contract, validates meta.json
 * files against the schema, and confirms the committed data/apps.json
 * registry is synchronized with the current app metadata.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildAppsRegistry } from './apps-registry.mjs';
import { validateVersusData, buildVersusRegistry } from './versus-registry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const appsRoot = path.join(root, 'apps');
const registryPath = path.join(root, 'data', 'apps.json');
const versusInputPath = path.join(root, 'data', 'versus.json');
const versusRegistryPath = path.join(root, 'data', 'versus-registry.json');
const schemaPath = path.join(root, 'docs', 'json-schema', 'meta.json');
const versusSchemaPath = path.join(root, 'docs', 'json-schema', 'versus.json');
const issueTemplatePath = path.join(root, '.github', 'ISSUE_TEMPLATE', 'app_suggestion.yml');
const sharedPromptPath = path.join(root, 'docs', 'agent-prompts', 'AGENT_PROMPT_SHARED.md');

const REQUIRED_CHECKS = [
  {
    id: 'title-placeholder',
    test: (html) => /<title>[^<]+\s-\s__MAIN_SITE_NAME__<\/title>/i.test(html),
    message: 'missing required <title> format: App Name - __MAIN_SITE_NAME__',
  },
  {
    id: 'ga-loader',
    test: (html) =>
      html.includes('https://www.googletagmanager.com/gtag/js?id=__GA_MEASUREMENT_ID__'),
    message: 'missing GA loader snippet with __GA_MEASUREMENT_ID__',
  },
  {
    id: 'ga-config',
    test: (html) => html.includes("gtag('config', '__GA_MEASUREMENT_ID__');"),
    message: 'missing gtag config call with __GA_MEASUREMENT_ID__',
  },
  {
    id: 'meta-main-url',
    test: (html) => /voa-main-site-url" content="__MAIN_SITE_URL__"\s*\/?>/.test(html),
    message: 'missing voa-main-site-url meta placeholder',
  },
  {
    id: 'meta-main-name',
    test: (html) => /voa-main-site-name" content="__MAIN_SITE_NAME__"\s*\/?>/.test(html),
    message: 'missing voa-main-site-name meta placeholder',
  },
  {
    id: 'meta-social-x',
    test: (html) => /voa-social-x-url" content="__SOCIAL_X_URL__"\s*\/?>/.test(html),
    message: 'missing voa-social-x-url meta placeholder',
  },
  {
    id: 'meta-social-facebook',
    test: (html) => /voa-social-facebook-url" content="__SOCIAL_FACEBOOK_URL__"\s*\/?>/.test(html),
    message: 'missing voa-social-facebook-url meta placeholder',
  },
  {
    id: 'meta-social-instagram',
    test: (html) =>
      /voa-social-instagram-url" content="__SOCIAL_INSTAGRAM_URL__"\s*\/?>/.test(html),
    message: 'missing voa-social-instagram-url meta placeholder',
  },
  {
    id: 'shared-shell',
    test: (html) => html.includes('<script src="/apps/shared/app-shell.js" defer></script>'),
    message: 'missing shared shell include: /apps/shared/app-shell.js',
  },
];

function loadSchema() {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

function validateMetaJson(metaData, schema) {
  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in metaData)) {
        errors.push(`missing required field: ${field}`);
      }
    }
  }

  // Validate each property
  for (const [key, value] of Object.entries(metaData)) {
    if (!schema.properties || !(key in schema.properties)) {
      continue;
    }

    const propSchema = schema.properties[key];
    const propErrors = validateProperty(key, value, propSchema);
    errors.push(...propErrors);
  }

  return errors;
}

function validateProperty(key, value, schema) {
  const errors = [];

  // Type validation
  if (schema.type) {
    let actualType;
    if (typeof value === 'object') {
      actualType = Array.isArray(value) ? 'array' : 'object';
    } else if (schema.type === 'integer' && typeof value === 'number') {
      actualType = Number.isInteger(value) ? 'integer' : 'number';
    } else {
      actualType = typeof value;
    }

    if (actualType !== schema.type) {
      errors.push(`${key}: expected type ${schema.type}, got ${actualType}`);
      return errors;
    }
  }

  // String constraints
  if (schema.type === 'string') {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push(`${key}: must be at least ${schema.minLength} characters (got ${value.length})`);
    }
    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push(`${key}: must be at most ${schema.maxLength} characters (got ${value.length})`);
    }
    if (schema.pattern) {
      const regex = new RegExp(`^${schema.pattern}$`);
      if (!regex.test(value)) {
        errors.push(`${key}: does not match pattern ${schema.pattern}`);
      }
    }
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${key}: must be one of [${schema.enum.join(', ')}], got "${value}"`);
    }
    if (schema.const && value !== schema.const) {
      errors.push(`${key}: must be "${schema.const}", got "${value}"`);
    }
    if (schema.format === 'date-time') {
      try {
        new Date(value);
        if (isNaN(Date.parse(value))) {
          throw new Error();
        }
      } catch {
        errors.push(`${key}: invalid date-time format`);
      }
    }
  }

  // Array constraints
  if (schema.type === 'array') {
    if (schema.minItems && value.length < schema.minItems) {
      errors.push(`${key}: must have at least ${schema.minItems} items`);
    }
    if (schema.maxItems && value.length > schema.maxItems) {
      errors.push(`${key}: must have at most ${schema.maxItems} items`);
    }
    if (schema.uniqueItems && new Set(value).size !== value.length) {
      errors.push(`${key}: must contain unique items`);
    }
    if (schema.items && schema.items.type === 'string') {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (typeof item !== 'string') {
          errors.push(`${key}[${i}]: expected string, got ${typeof item}`);
        }
        if (schema.items.minLength && item.length < schema.items.minLength) {
          errors.push(`${key}[${i}]: must be at least ${schema.items.minLength} characters`);
        }
        if (schema.items.maxLength && item.length > schema.items.maxLength) {
          errors.push(`${key}[${i}]: must be at most ${schema.items.maxLength} characters`);
        }
      }
    }
  }

  // Object constraints
  if (schema.type === 'object') {
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in value)) {
          errors.push(`${key}: missing required property ${field}`);
        }
      }
    }
    if (schema.properties) {
      for (const [propKey, propValue] of Object.entries(value)) {
        if (schema.properties[propKey]) {
          const propErrors = validateProperty(
            `${key}.${propKey}`,
            propValue,
            schema.properties[propKey]
          );
          errors.push(...propErrors);
        }
      }
    }
  }

  // Integer constraints
  if (schema.type === 'integer') {
    if (!Number.isInteger(value)) {
      errors.push(`${key}: must be an integer, got ${value}`);
    }
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${key}: must be at least ${schema.minimum}`);
    }
  }

  return errors;
}

function walkIndexFiles(dir, found = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkIndexFiles(full, found);
    } else if (entry.isFile() && entry.name === 'index.html') {
      found.push(full);
    }
  }
  return found;
}

function walkMetaJsonFiles(dir, found = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMetaJsonFiles(full, found);
    } else if (entry.isFile() && entry.name === 'meta.json') {
      found.push(full);
    }
  }
  return found;
}

function validateRegistrySynchronization() {
  const errors = [];

  if (!fs.existsSync(registryPath)) {
    errors.push(`registry file not found: ${path.relative(root, registryPath)}`);
    return errors;
  }

  let committedRegistry;
  try {
    committedRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch (error) {
    errors.push(`registry file is not valid JSON: ${error.message}`);
    return errors;
  }

  const { apps, warnings } = buildAppsRegistry({ appsDir: appsRoot });

  for (const warning of warnings) {
    errors.push(warning);
  }

  const expectedRegistry = JSON.stringify(apps, null, 2);
  const currentRegistry = JSON.stringify(committedRegistry, null, 2);

  if (currentRegistry !== expectedRegistry) {
    errors.push(
      'data/apps.json is out of sync with apps/*/meta.json; run `npm run generate:apps` and commit the updated registry'
    );
  }

  return errors;
}

function validateVersusSynchronization() {
  const errors = [];

  if (!fs.existsSync(versusInputPath)) {
    // No versus.json — nothing to validate
    return errors;
  }

  let competitions;
  try {
    competitions = JSON.parse(fs.readFileSync(versusInputPath, 'utf8'));
  } catch (error) {
    errors.push(`data/versus.json is not valid JSON: ${error.message}`);
    return errors;
  }

  if (!Array.isArray(competitions)) {
    errors.push('data/versus.json must contain a top-level array of competitions');
    return errors;
  }

  // Load apps registry for cross-reference
  let apps;
  try {
    apps = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch {
    errors.push('cannot validate versus: data/apps.json is missing or invalid');
    return errors;
  }

  const appsById = new Map(apps.map((a) => [a.id, a]));

  // Validate versus data integrity
  const dataErrors = validateVersusData(competitions, appsById);
  errors.push(...dataErrors);
  if (dataErrors.length > 0) {
    return errors;
  }

  // If the source versus data is invalid, stop here so we report the
  // collected validation errors instead of risking a crash while building
  // the derived registry from bad references.
  if (dataErrors.length > 0) {
    return errors;
  }

  // Check versus-registry.json is in sync
  if (!fs.existsSync(versusRegistryPath)) {
    errors.push(
      'data/versus-registry.json not found; run `npm run generate:versus` and commit the result'
    );
    return errors;
  }

  let committedVersusRegistry;
  try {
    committedVersusRegistry = JSON.parse(fs.readFileSync(versusRegistryPath, 'utf8'));
  } catch (error) {
    errors.push(`data/versus-registry.json is not valid JSON: ${error.message}`);
    return errors;
  }

  const expectedRegistry = buildVersusRegistry(competitions, appsById);
  expectedRegistry.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const expectedJson = JSON.stringify(expectedRegistry, null, 2);
  const currentJson = JSON.stringify(committedVersusRegistry, null, 2);

  if (currentJson !== expectedJson) {
    errors.push(
      'data/versus-registry.json is out of sync; run `npm run generate:versus` and commit the updated registry'
    );
  }

  return errors;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

function parseIssueTemplateCategories(content) {
  const optionsBlockPattern =
    /(id:\s*category[\s\S]*?^\s*options:\s*\n)([\s\S]*?)(^\s*validations:\s*\n)/m;
  const match = content.match(optionsBlockPattern);

  if (!match) {
    return null;
  }

  return match[2]
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function parseSharedPromptCategories(content) {
  const categoryLineMatch = content.match(/- `category`: one of (.+)$/m);
  if (!categoryLineMatch) {
    return null;
  }

  return categoryLineMatch[1]
    .split('|')
    .map((token) => token.trim().replace(/^`|`$/g, ''))
    .filter(Boolean);
}

function validateCategorySynchronization(schema) {
  const errors = [];
  const schemaCategories = schema?.properties?.category?.enum;

  if (!Array.isArray(schemaCategories) || schemaCategories.length === 0) {
    errors.push('docs/json-schema/meta.json is missing properties.category.enum');
    return errors;
  }

  // Validate versus schema category enum.
  let versusSchema;
  try {
    versusSchema = JSON.parse(fs.readFileSync(versusSchemaPath, 'utf8'));
  } catch (error) {
    errors.push(`cannot validate docs/json-schema/versus.json: ${error.message}`);
    return errors;
  }

  const versusCategories = versusSchema?.items?.properties?.category?.enum;
  if (!Array.isArray(versusCategories)) {
    errors.push('docs/json-schema/versus.json is missing items.properties.category.enum');
  } else if (!arraysEqual(schemaCategories, versusCategories)) {
    errors.push(
      'docs/json-schema/versus.json category enum is out of sync with docs/json-schema/meta.json; run `npm run sync:categories`'
    );
  }

  // Validate issue template category options.
  let issueTemplate;
  try {
    issueTemplate = fs.readFileSync(issueTemplatePath, 'utf8');
  } catch (error) {
    errors.push(`cannot validate .github/ISSUE_TEMPLATE/app_suggestion.yml: ${error.message}`);
    return errors;
  }

  const issueCategories = parseIssueTemplateCategories(issueTemplate);
  if (!issueCategories) {
    errors.push('could not parse category options from .github/ISSUE_TEMPLATE/app_suggestion.yml');
  } else if (!arraysEqual(schemaCategories, issueCategories)) {
    errors.push(
      '.github/ISSUE_TEMPLATE/app_suggestion.yml category options are out of sync with docs/json-schema/meta.json; run `npm run sync:categories`'
    );
  }

  // Validate agent prompt category list.
  let sharedPrompt;
  try {
    sharedPrompt = fs.readFileSync(sharedPromptPath, 'utf8');
  } catch (error) {
    errors.push(`cannot validate docs/agent-prompts/AGENT_PROMPT_SHARED.md: ${error.message}`);
    return errors;
  }

  const promptCategories = parseSharedPromptCategories(sharedPrompt);
  if (!promptCategories) {
    errors.push('could not parse category line in docs/agent-prompts/AGENT_PROMPT_SHARED.md');
  } else if (!arraysEqual(schemaCategories, promptCategories)) {
    errors.push(
      'docs/agent-prompts/AGENT_PROMPT_SHARED.md category list is out of sync with docs/json-schema/meta.json; run `npm run sync:categories`'
    );
  }

  return errors;
}

function main() {
  if (!fs.existsSync(appsRoot)) {
    console.error('ERROR: apps directory not found.');
    process.exit(1);
  }

  // Load schema
  let schema;
  try {
    schema = loadSchema();
  } catch (e) {
    console.error(`ERROR: Failed to load schema: ${e.message}`);
    process.exit(1);
  }

  // Validate index.html files
  const htmlFiles = walkIndexFiles(appsRoot);
  const htmlFailures = [];

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(root, file);

    const errors = REQUIRED_CHECKS.filter((check) => !check.test(html)).map(
      (check) => check.message
    );
    if (errors.length > 0) {
      htmlFailures.push({ file: rel, errors });
    }
  }

  // Validate meta.json files
  const metaFiles = walkMetaJsonFiles(appsRoot);
  const metaFailures = [];

  for (const file of metaFiles) {
    const rel = path.relative(root, file);
    let metaData;
    try {
      metaData = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      metaFailures.push({ file: rel, errors: [`Invalid JSON: ${e.message}`] });
      continue;
    }

    const errors = validateMetaJson(metaData, schema);
    if (errors.length > 0) {
      metaFailures.push({ file: rel, errors });
    }
  }

  const registryErrors = validateRegistrySynchronization();
  const versusErrors = validateVersusSynchronization();
  const categoryErrors = validateCategorySynchronization(schema);

  // Report results
  let hasFailures = false;

  if (htmlFailures.length > 0) {
    hasFailures = true;
    console.error(
      `HTML validation failed: ${htmlFailures.length} app file(s) do not meet the shell/analytics contract.`
    );
    for (const failure of htmlFailures) {
      console.error(`- ${failure.file}`);
      for (const error of failure.errors) {
        console.error(`  - ${error}`);
      }
    }
  } else {
    console.log(`Validated ${htmlFiles.length} app index.html file(s): all passed.`);
  }

  if (metaFailures.length > 0) {
    hasFailures = true;
    console.error(
      `\nSchema validation failed: ${metaFailures.length} meta.json file(s) do not conform to the schema.`
    );
    for (const failure of metaFailures) {
      console.error(`- ${failure.file}`);
      for (const error of failure.errors) {
        console.error(`  - ${error}`);
      }
    }
  } else {
    console.log(`Validated ${metaFiles.length} app meta.json file(s): all passed.`);
  }

  if (registryErrors.length > 0) {
    hasFailures = true;
    console.error(`\nRegistry validation failed: ${registryErrors.length} issue(s) found.`);
    for (const error of registryErrors) {
      console.error(`  - ${error}`);
    }
  } else {
    console.log('Validated data/apps.json registry synchronization: passed.');
  }

  if (versusErrors.length > 0) {
    hasFailures = true;
    console.error(`\nVersus validation failed: ${versusErrors.length} issue(s) found.`);
    for (const error of versusErrors) {
      console.error(`  - ${error}`);
    }
  } else if (fs.existsSync(versusInputPath)) {
    console.log('Validated data/versus.json and versus-registry.json: passed.');
  }

  if (categoryErrors.length > 0) {
    hasFailures = true;
    console.error(
      `\nCategory synchronization validation failed: ${categoryErrors.length} issue(s) found.`
    );
    for (const error of categoryErrors) {
      console.error(`  - ${error}`);
    }
  } else {
    console.log(
      'Validated category synchronization across schema, issue template, and prompts: passed.'
    );
  }

  if (hasFailures) {
    process.exit(1);
  }
}

main();
