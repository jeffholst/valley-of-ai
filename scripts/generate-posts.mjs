#!/usr/bin/env node
/**
 * Post Registry Generator
 *
 * Reads all .md files in content/posts/, parses frontmatter with gray-matter,
 * and writes a consolidated data/posts.json registry sorted newest-first.
 *
 * Usage: node scripts/generate-posts.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { format as formatWithPrettier } from 'prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const POSTS_DIR = path.join(rootDir, 'content', 'posts');
const OUTPUT_FILE = path.join(rootDir, 'data', 'posts.json');

function readPostFiles() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

function parsePost(filename) {
  const filepath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(filepath, 'utf8');
  const { data } = matter(raw);

  return {
    slug: data.slug,
    title: data.title,
    date: data.date,
    author: data.author,
    authorType: data.authorType,
    category: data.category,
    tags: data.tags ?? [],
    relatedApps: data.relatedApps ?? [],
    pinned: data.pinned ?? false,
    aiTransparencyNote: data.aiTransparencyNote ?? null,
    excerpt: data.excerpt ?? '',
    filename,
  };
}

function readExistingRecordNumbers() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return new Map();
  }

  const raw = fs.readFileSync(OUTPUT_FILE, 'utf8');
  const posts = JSON.parse(raw);

  return new Map(
    posts
      .filter((post) => post.slug && Number.isInteger(post.recordNumber))
      .map((post) => [post.slug, post.recordNumber])
  );
}

async function main() {
  const files = readPostFiles();
  if (files.length === 0) {
    console.warn('No .md files found in content/posts/');
  }

  const posts = files.map(parsePost).sort((a, b) => new Date(b.date) - new Date(a.date));
  const existingRecordNumbers = readExistingRecordNumbers();
  let nextRecordNumber =
    existingRecordNumbers.size > 0 ? Math.max(...existingRecordNumbers.values()) + 1 : 1;

  posts.forEach((post) => {
    post.recordNumber = existingRecordNumbers.get(post.slug) ?? nextRecordNumber++;
  });

  const json = await formatWithPrettier(JSON.stringify(posts), { parser: 'json' });
  fs.writeFileSync(OUTPUT_FILE, json);

  console.log(`✨ Generated ${OUTPUT_FILE} with ${posts.length} post(s)`);
  posts.forEach((p) => console.log(`   ✅ ${p.title} (${p.date})`));
}

main().catch((err) => {
  console.error('generate-posts failed:', err);
  process.exit(1);
});
