#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const appsRoot = path.join(root, 'apps');

const REQUIRED_CHECKS = [
  {
    id: 'title-placeholder',
    test: (html) => /<title>[^<]+\s-\s__MAIN_SITE_NAME__<\/title>/i.test(html),
    message: 'missing required <title> format: App Name - __MAIN_SITE_NAME__',
  },
  {
    id: 'ga-loader',
    test: (html) => html.includes('https://www.googletagmanager.com/gtag/js?id=__GA_MEASUREMENT_ID__'),
    message: 'missing GA loader snippet with __GA_MEASUREMENT_ID__',
  },
  {
    id: 'ga-config',
    test: (html) => html.includes("gtag('config', '__GA_MEASUREMENT_ID__');"),
    message: 'missing gtag config call with __GA_MEASUREMENT_ID__',
  },
  {
    id: 'meta-main-url',
    test: (html) => html.includes('<meta name="voa-main-site-url" content="__MAIN_SITE_URL__">'),
    message: 'missing voa-main-site-url meta placeholder',
  },
  {
    id: 'meta-main-name',
    test: (html) => html.includes('<meta name="voa-main-site-name" content="__MAIN_SITE_NAME__">'),
    message: 'missing voa-main-site-name meta placeholder',
  },
  {
    id: 'meta-social-x',
    test: (html) => html.includes('<meta name="voa-social-x-url" content="__SOCIAL_X_URL__">'),
    message: 'missing voa-social-x-url meta placeholder',
  },
  {
    id: 'meta-social-facebook',
    test: (html) => html.includes('<meta name="voa-social-facebook-url" content="__SOCIAL_FACEBOOK_URL__">'),
    message: 'missing voa-social-facebook-url meta placeholder',
  },
  {
    id: 'meta-social-instagram',
    test: (html) => html.includes('<meta name="voa-social-instagram-url" content="__SOCIAL_INSTAGRAM_URL__">'),
    message: 'missing voa-social-instagram-url meta placeholder',
  },
  {
    id: 'shared-shell',
    test: (html) => html.includes('<script src="/apps/shared/app-shell.js" defer></script>'),
    message: 'missing shared shell include: /apps/shared/app-shell.js',
  },
];

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

function main() {
  if (!fs.existsSync(appsRoot)) {
    console.error('ERROR: apps directory not found.');
    process.exit(1);
  }

  const files = walkIndexFiles(appsRoot);
  const failures = [];

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(root, file);

    const errors = REQUIRED_CHECKS.filter((check) => !check.test(html)).map((check) => check.message);
    if (errors.length > 0) {
      failures.push({ file: rel, errors });
    }
  }

  if (failures.length > 0) {
    console.error(`Validation failed: ${failures.length} app file(s) do not meet the shell/analytics contract.`);
    for (const failure of failures) {
      console.error(`- ${failure.file}`);
      for (const error of failure.errors) {
        console.error(`  - ${error}`);
      }
    }
    process.exit(1);
  }

  console.log(`Validated ${files.length} app index.html file(s): all passed.`);
}

main();
