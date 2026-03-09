#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const DEFAULT_MAIN_SITE_URL = 'https://www.valleyofai.com';
const DEFAULT_MAIN_SITE_NAME = 'Valley of AI';

function loadEnvLikeFile(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) return values;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function resolveGaMeasurementId() {
  if (process.env.VITE_GA_MEASUREMENT_ID) return process.env.VITE_GA_MEASUREMENT_ID;

  const envPaths = [
    path.join(root, '.env.local'),
    path.join(root, '.env'),
  ];

  for (const p of envPaths) {
    const vals = loadEnvLikeFile(p);
    if (vals.VITE_GA_MEASUREMENT_ID) return vals.VITE_GA_MEASUREMENT_ID;
  }

  return '';
}

function resolveMainSiteUrl() {
  if (process.env.VITE_MAIN_SITE_URL) return process.env.VITE_MAIN_SITE_URL;

  const envPaths = [
    path.join(root, '.env.local'),
    path.join(root, '.env'),
  ];

  for (const p of envPaths) {
    const vals = loadEnvLikeFile(p);
    if (vals.VITE_MAIN_SITE_URL) return vals.VITE_MAIN_SITE_URL;
  }

  return DEFAULT_MAIN_SITE_URL;
}

function resolveMainSiteName() {
  if (process.env.VITE_MAIN_SITE_NAME) return process.env.VITE_MAIN_SITE_NAME;

  const envPaths = [
    path.join(root, '.env.local'),
    path.join(root, '.env'),
  ];

  for (const p of envPaths) {
    const vals = loadEnvLikeFile(p);
    if (vals.VITE_MAIN_SITE_NAME) return vals.VITE_MAIN_SITE_NAME;
  }

  return DEFAULT_MAIN_SITE_NAME;
}

function replaceInFile(filePath, gaId, mainSiteUrl, mainSiteName) {
  let content = fs.readFileSync(filePath, 'utf8');
  const next = content
    .replaceAll('__GA_MEASUREMENT_ID__', gaId)
    .replaceAll('__MAIN_SITE_URL__', mainSiteUrl)
    .replaceAll('__MAIN_SITE_NAME__', mainSiteName)
    .replace(/googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+/g, `googletagmanager.com/gtag/js?id=${gaId}`)
    .replace(/gtag\('config', 'G-[A-Z0-9]+'\)/g, `gtag('config', '${gaId}')`);

  if (next !== content) {
    fs.writeFileSync(filePath, next);
    return 1;
  }
  return 0;
}

function walk(dirPath, files = []) {
  if (!fs.existsSync(dirPath)) return files;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  const gaId = resolveGaMeasurementId();
  const mainSiteUrl = resolveMainSiteUrl();
  const mainSiteName = resolveMainSiteName();
  if (!gaId) {
    console.error('ERROR: Missing VITE_GA_MEASUREMENT_ID (.env/.env.local or environment variable).');
    process.exit(1);
  }

  const distDir = path.join(root, 'dist');
  const targetFiles = [
    path.join(distDir, 'index.html'),
    ...walk(path.join(distDir, 'apps')).filter((p) => p.endsWith('index.html')),
  ].filter((p) => fs.existsSync(p));

  let changed = 0;
  for (const filePath of targetFiles) {
    changed += replaceInFile(filePath, gaId, mainSiteUrl, mainSiteName);
  }

  console.log(`Injected GA ID, main site URL, and main site name into ${changed} file(s).`);
}

main();
