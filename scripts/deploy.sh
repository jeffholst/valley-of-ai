#!/usr/bin/env bash
set -euo pipefail

# This should not be needed by oepnclaw now

#ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
#cd "$ROOT_DIR"

#echo "[deprecated] scripts/deploy.sh is now a compatibility wrapper."
#echo "[deprecated] Preferred flow: npm install --no-bin-links && npm run deploy"

# NAS-safe install for environments without symlink support.
#npm install --no-bin-links

# Canonical deploy flow (runs predeploy automatically).
#npm run deploy
