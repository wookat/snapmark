# SnapMark — Screenshot & Annotate

**Live: https://ext.zalize.com** · A maintained, privacy-first alternative to the abandoned Lightshot extension.

Capture (or paste / upload) a screenshot, annotate it with arrows, boxes, ellipses, lines, freehand pen, text and pixelate/blur, then copy to clipboard or download as PNG. **Everything runs locally in your browser — images are never uploaded anywhere.**

## Why

The Lightshot Chrome extension (2M+ users) hasn't been updated since July 2024, is still Manifest V2, and recent reviews report blank/broken screenshots. It also uploads captures to prnt.sc servers. SnapMark is a clean, open-source replacement. See `docs/research.md`.

## Stack

- Web app: Vite + React 19 + TypeScript + Tailwind CSS v4, canvas-based editor, mobile-friendly
- Backend: Hono on Cloudflare Workers (serves static assets + anonymous KV usage counters)
- Extension: Manifest V3, `activeTab` capture, reuses the exact same built editor locally

## Develop

```bash
npm i
npm run dev        # local dev server
npm run build      # typecheck (tsc -b) + vite build
npm run lint       # oxlint
```

## Deploy

```bash
npm run build
CLOUDFLARE_API_TOKEN=$CLOUDFLARE_WORKERS_API_TOKEN npx wrangler deploy
```

Custom domain `ext.zalize.com` is configured in `wrangler.jsonc` (routes → custom_domain).

## Build the extension

```bash
./scripts/build-extension.sh   # produces snapmark-extension.zip
```

## Install the extension

1. Download `snapmark-extension.zip` from [Releases](https://github.com/wookat/snapmark/releases) and unzip it
2. Open `chrome://extensions`, enable **Developer mode**
3. Click **Load unpacked** and select the unzipped folder
4. Click the SnapMark toolbar icon on any page to capture and annotate it

> Chrome Web Store publication requires a one-time $5 developer registration fee (pending owner approval). Release notes for store submission: `docs/extension-release-notes.md`.

## Privacy

All image processing happens locally. The site records anonymous usage counters only (page visits and button clicks — no personal data, no cookies, no images). SnapMark is not affiliated with Lightshot, Skillbrains, or prnt.sc.
