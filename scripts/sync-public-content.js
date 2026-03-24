/**
 * Sync public content
 *
 * Copies runtime assets (apps/, logs/) into public/ so Next.js can serve them.
 * For apps, replaces environment variable placeholders in HTML files while
 * copying all other app assets as-is, including app-local log.jsonl files.
 * SVG assets already live in public/ — no copy needed.
 * data/apps.json is imported directly — no copy needed.
 */

import { config } from 'dotenv'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'fs'
import { dirname, resolve, join } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from .env file
config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Map of placeholder names to environment variable names
const PLACEHOLDER_MAP = {
  '__GA_MEASUREMENT_ID__': 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  '__MAIN_SITE_URL__': 'NEXT_PUBLIC_MAIN_SITE_URL',
  '__MAIN_SITE_NAME__': 'NEXT_PUBLIC_SITE_NAME',
  '__GITHUB_URL__': 'NEXT_PUBLIC_GITHUB_URL',
  '__SOCIAL_X_URL__': 'NEXT_PUBLIC_SOCIAL_X_URL',
  '__SOCIAL_FACEBOOK_URL__': 'NEXT_PUBLIC_SOCIAL_FACEBOOK_URL',
  '__SOCIAL_INSTAGRAM_URL__': 'NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL',
  '__SUPABASE_URL__': 'NEXT_PUBLIC_SUPABASE_URL',
  '__SUPABASE_ANON_KEY__': 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
}

/**
 * Recursively process files in a directory, replacing placeholders in HTML files
 * and shell-config.json. All other assets are copied verbatim, including meta.json,
 * thumbnail.svg, and app-local log.jsonl files.
 */
function processDirectory(sourceDir, targetDir) {
  const entries = readdirSync(sourceDir, { withFileTypes: true })
  
  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name)
    const targetPath = join(targetDir, entry.name)
    
    if (entry.isDirectory()) {
      mkdirSync(targetPath, { recursive: true })
      processDirectory(sourcePath, targetPath)
    } else if (entry.name.endsWith('.html') || entry.name === 'shell-config.json') {
      // Read HTML and shell-config.json files and replace placeholders
      let content = readFileSync(sourcePath, 'utf-8')
      
      for (const [placeholder, envVar] of Object.entries(PLACEHOLDER_MAP)) {
        const value = process.env[envVar] || ''
        if (value) {
          content = content.replaceAll(placeholder, value)
        }
      }
      
      writeFileSync(targetPath, content, 'utf-8')
    } else {
      // Copy non-HTML files as-is
      cpSync(sourcePath, targetPath, { recursive: true, force: true })
    }
  }
}

const targets = [
  { from: resolve(root, 'apps'), to: resolve(root, 'public/apps'), processPlaceholders: true },
  { from: resolve(root, 'logs'), to: resolve(root, 'public/logs'), processPlaceholders: false },
]

console.log('[sync] Copying runtime assets into public/...\n')

for (const { from, to, processPlaceholders } of targets) {
  if (!existsSync(from)) {
    console.warn(`⚠️  Skipped missing source: ${from}`)
    continue
  }
  
  mkdirSync(dirname(to), { recursive: true })

  // Generated public targets should mirror the source exactly so newly added
  // files like app-local log.jsonl entries are always present after sync.
  rmSync(to, { recursive: true, force: true })
  
  if (processPlaceholders) {
    mkdirSync(to, { recursive: true })
    processDirectory(from, to)
  } else {
    cpSync(from, to, { recursive: true, force: true })
  }
  
  console.log(`✅ ${from} → ${to}`)
}

console.log('\n[sync] Done.')
