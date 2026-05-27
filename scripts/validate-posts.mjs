#!/usr/bin/env node
/**
 * Post Validator
 *
 * Checks all posts in content/posts/ and verifies:
 *   - Required frontmatter fields are present
 *   - Slugs are unique and match the filename
 *   - Author IDs exist in data/authors.json
 *   - relatedApps entries exist in data/apps.json
 *   - AI/human+ai posts have an aiTransparencyNote
 *   - data/posts.json is in sync (run generate:posts if not)
 *
 * Usage: node scripts/validate-posts.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { validateShortSlug } from './post-validators.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const POSTS_DIR = path.join(rootDir, 'content', 'posts');
const POSTS_JSON = path.join(rootDir, 'data', 'posts.json');
const AUTHORS_JSON = path.join(rootDir, 'data', 'authors.json');
const APPS_JSON = path.join(rootDir, 'data', 'apps.json');

const REQUIRED_FIELDS = ['title', 'slug', 'date', 'author', 'authorType', 'category', 'excerpt'];

const VALID_AUTHOR_TYPES = ['human', 'ai', 'human+ai'];
const VALID_CATEGORIES = [
  'Build Logs',
  'AI Experiments',
  'App Spotlights',
  'Human Notes',
  'Bot Notes',
  'Tutorials',
  'Release Notes',
];

function main() {
  const issues = [];

  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No content/posts/ directory found — nothing to validate.');
    process.exit(0);
  }

  const authors = JSON.parse(fs.readFileSync(AUTHORS_JSON, 'utf8'));
  const authorIds = new Set(authors.map((a) => a.id));

  const apps = JSON.parse(fs.readFileSync(APPS_JSON, 'utf8'));
  const appIds = new Set(apps.map((a) => a.id));

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  const seenSlugs = new Set();
  const seenShortSlugs = new Set();
  const parsedPosts = [];

  for (const filename of files) {
    const filepath = path.join(POSTS_DIR, filename);
    let data;
    try {
      ({ data } = matter(fs.readFileSync(filepath, 'utf8')));
    } catch (err) {
      issues.push(`  ${filename}: failed to parse frontmatter — ${err.message}`);
      continue;
    }

    // Required fields
    for (const field of REQUIRED_FIELDS) {
      if (!data[field]) {
        issues.push(`  ${filename}: missing required field '${field}'`);
      }
    }

    // authorType valid
    if (data.authorType && !VALID_AUTHOR_TYPES.includes(data.authorType)) {
      issues.push(
        `  ${filename}: invalid authorType '${data.authorType}' (must be human | ai | human+ai)`
      );
    }

    // category valid
    if (data.category && !VALID_CATEGORIES.includes(data.category)) {
      issues.push(`  ${filename}: invalid category '${data.category}'`);
    }

    // author exists
    if (data.author && !authorIds.has(data.author)) {
      issues.push(`  ${filename}: author '${data.author}' not found in data/authors.json`);
    }

    // AI transparency required for ai / human+ai
    if ((data.authorType === 'ai' || data.authorType === 'human+ai') && !data.aiTransparencyNote) {
      issues.push(`  ${filename}: authorType '${data.authorType}' requires aiTransparencyNote`);
    }

    // Slug uniqueness
    if (data.slug) {
      if (seenSlugs.has(data.slug)) {
        issues.push(`  ${filename}: duplicate slug '${data.slug}'`);
      }
      seenSlugs.add(data.slug);

      const expectedSlug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
      if (data.slug !== expectedSlug) {
        issues.push(
          `  ${filename}: slug '${data.slug}' must match filename-derived slug '${expectedSlug}'`
        );
      }
    }

    // shortSlug optional — must be URL-safe, unique, and not collide with a full slug
    if (data.shortSlug != null) {
      const err = validateShortSlug(data.shortSlug, seenSlugs, seenShortSlugs);
      if (err) {
        issues.push(`  ${filename}: ${err}`);
      }
    }

    // tags must be an array
    const { tags } = data;
    if (tags != null && !Array.isArray(tags)) {
      issues.push(`  ${filename}: tags must be an array`);
    }

    // relatedApps exist in apps.json
    const { relatedApps } = data;
    if (relatedApps != null && !Array.isArray(relatedApps)) {
      issues.push(`  ${filename}: relatedApps must be an array`);
    }

    for (const appId of Array.isArray(relatedApps) ? relatedApps : []) {
      if (typeof appId !== 'string' || !appId.trim()) {
        issues.push(`  ${filename}: relatedApps entries must be non-empty strings`);
        continue;
      }
      if (!appIds.has(appId)) {
        issues.push(`  ${filename}: relatedApp '${appId}' not found in data/apps.json`);
      }
    }

    parsedPosts.push({ slug: data.slug, filename });
  }

  // shortSlug cross-collision: a shortSlug must not match any full slug in the set
  for (const shortSlug of seenShortSlugs) {
    if (seenSlugs.has(shortSlug)) {
      issues.push(`  shortSlug '${shortSlug}' collides with a full slug from another post`);
    }
  }

  // Registry sync check
  if (fs.existsSync(POSTS_JSON)) {
    const registry = JSON.parse(fs.readFileSync(POSTS_JSON, 'utf8'));
    const registrySlugs = new Set(registry.map((p) => p.slug));
    const contentSlugs = new Set(parsedPosts.map((p) => p.slug).filter(Boolean));

    const missing = [...contentSlugs].filter((s) => !registrySlugs.has(s));
    const extra = [...registrySlugs].filter((s) => !contentSlugs.has(s));

    if (missing.length > 0 || extra.length > 0) {
      issues.push(
        `  data/posts.json is out of sync with content/posts/; run \`npm run generate:posts\` and commit the result`
      );
    }

    const missingRecordNumbers = registry
      .filter((p) => !Number.isInteger(p.recordNumber))
      .map((p) => p.slug);
    if (missingRecordNumbers.length > 0) {
      issues.push(
        `  data/posts.json entries missing recordNumber (${missingRecordNumbers.join(', ')}); run \`npm run generate:posts\``
      );
    }
  } else {
    issues.push(`  data/posts.json does not exist; run \`npm run generate:posts\` to create it`);
  }

  if (issues.length > 0) {
    console.error(`Post validation failed: ${issues.length} issue(s) found.`);
    issues.forEach((i) => console.error(i));
    process.exit(1);
  }

  console.log(`Validated ${files.length} post(s): all passed.`);
}

main();
