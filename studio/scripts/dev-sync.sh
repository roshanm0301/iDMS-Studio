#!/usr/bin/env bash
# dev-sync.sh — auto-pull from cloud when new commits land on the feature branch.
#
# Usage (from studio/ directory):
#   npm run dev:sync
#
# Run this in a second terminal alongside `npm run dev`.
# Vite's HMR will reload the browser automatically when files change.

set -euo pipefail

BRANCH="${DEV_SYNC_BRANCH:-claude/confident-albattani-bwOK5}"
POLL_INTERVAL="${DEV_SYNC_INTERVAL:-30}"

# Resolve repo root (the script lives in studio/scripts/, repo root is two levels up)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  iDMS-Studio · Cloud Dev Sync"
echo "  Branch : $BRANCH"
echo "  Poll   : every ${POLL_INTERVAL}s"
echo "  Tip    : run 'npm run dev' in another terminal"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while true; do
  git fetch origin "$BRANCH" --quiet 2>/dev/null

  LOCAL=$(git rev-parse HEAD 2>/dev/null)
  REMOTE=$(git rev-parse "origin/$BRANCH" 2>/dev/null)

  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date '+%H:%M:%S')] ▶ New commits detected — pulling..."

    git pull origin "$BRANCH" --ff-only --quiet

    # Re-run npm install only if package.json changed
    if git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -q "studio/package.json"; then
      echo "[$(date '+%H:%M:%S')] ▶ package.json changed — running npm install..."
      cd "$REPO_ROOT/studio" && npm install --silent && cd "$REPO_ROOT"
    fi

    COMMIT_MSG=$(git log -1 --pretty=format:"%s")
    echo "[$(date '+%H:%M:%S')] ✓ Pulled: $COMMIT_MSG"
    echo "[$(date '+%H:%M:%S')]   Vite will hot-reload the browser automatically."
    echo ""
  fi

  sleep "$POLL_INTERVAL"
done
