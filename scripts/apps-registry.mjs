/**
 * Shared helpers for building the app registry from app metadata files.
 *
 * This module is the single source of truth for registry construction so
 * generate-apps.js and validate-apps.js use identical logic when producing
 * or checking data/apps.json.
 */
import fs from 'fs';
import path from 'path';

const LEADERBOARD_USAGE_PATTERNS = [
  // Preferred shared integration helper.
  /\b(?:window\s*\.\s*)?voaLeaderboard\s*\.\s*submit\s*\(/i,
  // Manual score API submission via fetch.
  /\bfetch\s*\(\s*['"`]\/api\/scores(?:[/?'"`]|\\?)/i,
  // Manual score API submission via XHR open('POST', '/api/scores').
  /\bopen\s*\(\s*['"`]POST['"`]\s*,\s*['"`]\/api\/scores(?:[/?'"`]|\\?)/i,
];

function stripCommentsForDetection(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
}

export function detectLeaderboardUsageFromHtml(html) {
  if (typeof html !== 'string' || html.length === 0) {
    return false;
  }
  const searchable = stripCommentsForDetection(html);
  return LEADERBOARD_USAGE_PATTERNS.some((pattern) => pattern.test(searchable));
}

export function detectLeaderboardUsageFromAppDir(appDir) {
  const indexPath = path.join(appDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return false;
  }
  try {
    const html = fs.readFileSync(indexPath, 'utf8');
    return detectLeaderboardUsageFromHtml(html);
  } catch {
    return false;
  }
}

export function findMetaFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'backups') {
        continue;
      }
      findMetaFiles(fullPath, files);
    } else if (entry.name === 'meta.json') {
      files.push(fullPath);
    }
  }

  return files;
}

function findBackups(appDir) {
  const backupsDir = path.join(appDir, 'backups');
  if (!fs.existsSync(backupsDir)) {
    return [];
  }

  const entries = fs.readdirSync(backupsDir, { withFileTypes: true });
  const backups = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const runId = entry.name;
    if (fs.existsSync(path.join(backupsDir, runId, 'index.html'))) {
      backups.push({ runId, path: `backups/${runId}/index.html` });
    }
  }

  backups.sort((a, b) => a.runId.localeCompare(b.runId));
  return backups;
}

export function parseDateFromPath(appsDir, filePath) {
  const relativePath = path.relative(appsDir, filePath);
  const parts = relativePath.split(path.sep);

  if (parts.length >= 4) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
      appId: parts[3],
    };
  }

  return null;
}

export function transformMeta(appsDir, meta, filePath, dateInfo, basePath = '', backups = []) {
  const appDir = path.dirname(filePath);
  const relativeAppDir = path.relative(appsDir, appDir);
  const normalizedAppDir = relativeAppDir.split(path.sep).join('/');
  const uniqueId = normalizedAppDir;

  return {
    id: uniqueId,
    name: meta.name,
    shortDescription: meta.shortDescription,
    thumbnailUrl: meta.thumbnail ? `${basePath}/apps/${normalizedAppDir}/${meta.thumbnail}` : null,
    createdAt: meta.createdAt,
    year: dateInfo.year,
    month: dateInfo.month,
    day: dateInfo.day,
    category: meta.category,
    inputMode: meta.inputMode || null,
    status: meta.status || 'active',
    tags: meta.tags || [],
    route: `/apps/${uniqueId}`,
    appPath: `${basePath}/apps/${normalizedAppDir}/${meta.homepagePath || 'index.html'}`,
    generation: meta.generation || null,
    suggestion: meta.suggestion || null,
    improvements: meta.improvements || null,
    allowImprovements: meta.allowImprovements ?? true,
    leaderboard: meta.leaderboard === true,
    maxScore: meta.maxScore ?? null,
    backups:
      backups.length > 0
        ? backups.map((b) => ({
            runId: b.runId,
            path: b.path,
            url: `${basePath}/apps/${normalizedAppDir}/${b.path}`,
          }))
        : null,
  };
}

export function buildAppsRegistry({ appsDir, basePath = '', onWarning } = {}) {
  const metaFiles = findMetaFiles(appsDir);
  const apps = [];
  const warnings = [];

  for (const filePath of metaFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const meta = JSON.parse(content);
      const dateInfo = parseDateFromPath(appsDir, filePath);

      if (!dateInfo) {
        const warning = `Skipping ${filePath}: could not parse date from path`;
        warnings.push(warning);
        if (onWarning) {
          onWarning(warning);
        }
        continue;
      }

      if (meta.visible === false) {
        continue;
      }

      const backups = findBackups(path.dirname(filePath));
      apps.push(transformMeta(appsDir, meta, filePath, dateInfo, basePath, backups));
    } catch (error) {
      const warning = `Error processing ${filePath}: ${error.message}`;
      warnings.push(warning);
      if (onWarning) {
        onWarning(warning);
      }
    }
  }

  apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    apps,
    metaFiles,
    warnings,
  };
}
