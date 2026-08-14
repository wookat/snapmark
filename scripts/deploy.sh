#!/usr/bin/env bash
# Deploys ext.zalize.com from a clean build of the current checkout.
# Guards against the two failure modes that can ship a bundle != main:
#   1. deploying from a branch that is behind origin/main
#   2. deploying a stale/mixed dist (prerendered HTML newer than client JS)
set -euo pipefail
cd "$(dirname "$0")/.."

git fetch origin main
if ! git merge-base --is-ancestor origin/main HEAD; then
  echo "ERROR: HEAD is behind origin/main — pull/rebase before deploying." >&2
  exit 1
fi

rm -rf dist
npm run build

: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN}"
npx wrangler deploy

# Post-deploy self-check: the live HTML must reference a bundle that exists in
# this build, and that bundle must carry current-source markers.
sleep 5
html=$(curl -sf https://ext.zalize.com/)
bundle=$(grep -o 'assets/index-[A-Za-z0-9_-]*\.js' <<<"$html" | head -1)
[ -f "dist/$bundle" ] || { echo "ERROR: live HTML references $bundle, not present in this build" >&2; exit 1; }
for marker in 'Annotation canvas' 'Editor toolbar'; do
  grep -q "$marker" "dist/$bundle" || { echo "ERROR: marker '$marker' missing from $bundle" >&2; exit 1; }
  curl -sf "https://ext.zalize.com/$bundle" | grep -q "$marker" || { echo "ERROR: live $bundle missing marker '$marker'" >&2; exit 1; }
done
echo "Deploy self-check passed: live bundle $bundle matches this build."
