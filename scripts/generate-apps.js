#!/usr/bin/env node

/**
 * Registry Generator Script
 * 
 * Scans the apps/ directory for meta.json files and generates
 * a consolidated apps.json registry in src/data/
 * 
 * Usage: node scripts/generate-apps.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const APPS_DIR = path.join(rootDir, 'apps')
const OUTPUT_FILE = path.join(rootDir, 'src', 'data', 'apps.json')
const BASE_PATH = '/valley-of-ai'

/**
 * Recursively find all meta.json files in the apps directory
 */
function findMetaFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    
    if (entry.isDirectory()) {
      findMetaFiles(fullPath, files)
    } else if (entry.name === 'meta.json') {
      files.push(fullPath)
    }
  }
  
  return files
}

/**
 * Parse a meta.json file path to extract date components
 * Expected path: apps/YYYY/MM/DD/<app-id>/meta.json
 */
function parseDateFromPath(filePath) {
  const relativePath = path.relative(APPS_DIR, filePath)
  const parts = relativePath.split(path.sep)
  
  if (parts.length >= 4) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
      appId: parts[3],
    }
  }
  
  return null
}

/**
 * Transform a meta.json into an apps.json entry
 */
function transformMeta(meta, filePath, dateInfo) {
  const appDir = path.dirname(filePath)
  const relativeAppDir = path.relative(APPS_DIR, appDir)
  
  return {
    id: meta.id,
    name: meta.name,
    shortDescription: meta.shortDescription,
    thumbnailUrl: meta.thumbnail 
      ? `${BASE_PATH}/apps/${relativeAppDir}/${meta.thumbnail}`
      : null,
    createdAt: meta.createdAt,
    year: dateInfo.year,
    month: dateInfo.month,
    day: dateInfo.day,
    category: meta.category,
    votes: meta.votes || 0,
    status: meta.status || 'active',
    tags: meta.tags || [],
    route: `/apps/${meta.id}`,
    appPath: `${BASE_PATH}/apps/${relativeAppDir}/${meta.homepagePath || 'index.html'}`,
    generation: meta.generation || null,
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Scanning for apps...')
  
  const metaFiles = findMetaFiles(APPS_DIR)
  console.log(`   Found ${metaFiles.length} app(s)`)
  
  const apps = []
  
  for (const filePath of metaFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const meta = JSON.parse(content)
      const dateInfo = parseDateFromPath(filePath)
      
      if (!dateInfo) {
        console.warn(`   ⚠️  Skipping ${filePath}: could not parse date from path`)
        continue
      }
      
      const appEntry = transformMeta(meta, filePath, dateInfo)
      apps.push(appEntry)
      console.log(`   ✅ ${meta.name} (${meta.id})`)
    } catch (error) {
      console.error(`   ❌ Error processing ${filePath}:`, error.message)
    }
  }
  
  // Sort by createdAt descending (newest first)
  apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  // Write the registry
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(apps, null, 2))
  console.log(`\n✨ Generated ${OUTPUT_FILE} with ${apps.length} app(s)`)
}

main()
