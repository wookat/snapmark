#!/usr/bin/env bash
# Builds the web app and packages the Chrome extension zip.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build
rm -rf extension/app
cp -r dist extension/app
cd extension
zip -rq ../snapmark-extension.zip . -x '*.DS_Store'
cd ..
echo "Built snapmark-extension.zip ($(du -h snapmark-extension.zip | cut -f1))"
