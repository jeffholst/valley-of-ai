/**
 * Sync public content
 *
 * Copies runtime assets (apps/, logs/) into public/ so Next.js can serve them.
 * SVG assets already live in public/ — no copy needed.
 * data/apps.json is imported directly — no copy needed.
 */

import { cpSync, existsSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const targets = [
  { from: resolve(root, 'apps'), to: resolve(root, 'public/apps') },
  { from: resolve(root, 'logs'), to: resolve(root, 'public/logs') },
]

console.log('[sync] Copying runtime assets into public/...\n')

for (const { from, to } of targets) {
  if (!existsSync(from)) {
    console.warn(`⚠️  Skipped missing source: ${from}`)
    continue
  }
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, { recursive: true, force: true })
  console.log(`✅ ${from} → ${to}`)
}

console.log('\n[sync] Done.')
