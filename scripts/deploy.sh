#!/usr/bin/env bash
set -euo pipefail

cd /home/jeff/nas/OpenClaw/workspace/projects/valley-of-ai
npm install --no-bin-links
node ./scripts/generate-apps.js
npm run version:bump
./node_modules/vite/bin/vite.js build
cp -r ./apps dist/ && cp -r logs dist/
./node_modules/gh-pages/bin/gh-pages.js -d dist

