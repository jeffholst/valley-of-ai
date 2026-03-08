#!/usr/bin/env node

import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

const utc = new Date()
const yyyy = utc.getUTCFullYear()
const mm = String(utc.getUTCMonth() + 1).padStart(2, '0')
const dd = String(utc.getUTCDate()).padStart(2, '0')
const hh = String(utc.getUTCHours()).padStart(2, '0')
const mi = String(utc.getUTCMinutes()).padStart(2, '0')

let sha = 'nogit'
try {
  sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
} catch {
  // Fallback for environments without git metadata.
}

const deployVersion = `${pkg.version}+${yyyy}${mm}${dd}.${hh}${mi}.${sha}`
process.stdout.write(deployVersion)
