#!/usr/bin/env node

/**
 * copy-logs-to-apps.js
 *
 * Traverses every .jsonl log file under /logs and copies each log entry
 * into a `log.jsonl` file inside the matching app folder under /apps.
 *
 * Log entry → app folder mapping:
 *   1. The appId is extracted from `entry.appId` or `entry.details.appId`.
 *   2. The date directory comes from the log file path:
 *        logs/2026/03/14.jsonl  →  apps/2026/03/14/<appId>/log.jsonl
 *   3. The app folder must already contain meta.json, index.html, and
 *      thumbnail.svg — otherwise the entry is skipped (orphan log).
 *
 * Behaviour:
 *   - Overwrites any existing log.jsonl in app folders (fresh copy each run).
 *   - Entries without a resolvable appId are counted as "unmatched".
 *   - A summary is printed to stdout at the end.
 *
 * Usage:
 *   node scripts/copy-logs-to-apps.js            # standard run
 *   node scripts/copy-logs-to-apps.js --dry-run   # preview only, no writes
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const LOGS_DIR = join(ROOT, 'logs');
const APPS_DIR = join(ROOT, 'apps');
const DRY_RUN = process.argv.includes('--dry-run');

/* ── Helpers ─────────────────────────────────────────────── */

/** Recursively find all .jsonl files under a directory */
function findJsonlFiles(dir, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      findJsonlFiles(full, results);
    } else if (entry.name.endsWith('.jsonl')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Extract an appId from a parsed log entry.
 * Checks top-level `appId` first, then `details.appId`.
 */
function extractAppId(entry) {
  return entry.appId || entry.details?.appId || null;
}

/**
 * Derive the app folder path from the log file path and appId.
 *   logs/2026/03/14.jsonl + "decision-spinner"
 *   → apps/2026/03/14/decision-spinner
 */
function resolveAppDir(logFilePath, appId) {
  // logFilePath relative to LOGS_DIR, e.g. "2026/03/14.jsonl"
  const rel = relative(LOGS_DIR, logFilePath);
  // Strip ".jsonl" to get the date directory, e.g. "2026/03/14"
  const dateDir = rel.replace(/\.jsonl$/, '');
  return join(APPS_DIR, dateDir, appId);
}

/** Check that the target app folder has the expected asset files */
function isValidAppFolder(dir) {
  return (
    existsSync(dir) &&
    statSync(dir).isDirectory() &&
    existsSync(join(dir, 'meta.json')) &&
    existsSync(join(dir, 'index.html'))
  );
}

/* ── Main ────────────────────────────────────────────────── */

function main() {
  const logFiles = findJsonlFiles(LOGS_DIR);

  // Stats
  let totalEntries = 0;
  let matchedEntries = 0;
  let unmatchedEntries = 0;
  let skippedNoAppDir = 0;
  let filesWritten = 0;

  /**
   * Accumulate entries per app folder before writing,
   * so each log.jsonl is written as one atomic operation.
   * Key = absolute app dir path, Value = array of raw JSON lines
   */
  const appLogMap = new Map();

  for (const logFile of logFiles) {
    const raw = readFileSync(logFile, 'utf-8');
    const lines = raw.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      totalEntries++;

      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        unmatchedEntries++;
        continue;
      }

      const appId = extractAppId(entry);
      if (!appId) {
        unmatchedEntries++;
        continue;
      }

      const appDir = resolveAppDir(logFile, appId);

      if (!isValidAppFolder(appDir)) {
        skippedNoAppDir++;
        continue;
      }

      if (!appLogMap.has(appDir)) {
        appLogMap.set(appDir, []);
      }
      appLogMap.get(appDir).push(line.trim());
      matchedEntries++;
    }
  }

  // Write (or preview) each log.jsonl
  for (const [appDir, lines] of appLogMap) {
    const outPath = join(appDir, 'log.jsonl');
    const relPath = relative(ROOT, outPath);

    if (DRY_RUN) {
      console.log(`[dry-run] Would write ${lines.length} entries → ${relPath}`);
    } else {
      writeFileSync(outPath, lines.join('\n') + '\n', 'utf-8');
      console.log(`Wrote ${lines.length} entries → ${relPath}`);
    }
    filesWritten++;
  }

  // Summary
  console.log('\n--- Summary ---');
  console.log(`Log files scanned:     ${logFiles.length}`);
  console.log(`Total entries:         ${totalEntries}`);
  console.log(`Matched to app:       ${matchedEntries}`);
  console.log(`Unmatched (no appId):  ${unmatchedEntries}`);
  console.log(`Skipped (no app dir):  ${skippedNoAppDir}`);
  console.log(`App log files written: ${filesWritten}`);
  if (DRY_RUN) {
    console.log('(dry-run mode — no files were written)');
  }
}

main();
