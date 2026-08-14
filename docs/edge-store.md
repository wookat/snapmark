# Microsoft Edge Add-ons — Store Listing Materials

Everything needed to publish/maintain SnapMark on the Microsoft Edge Add-ons store.
No passwords or secrets in this file.

## Package

- Product: SnapMark — Screenshot & Annotate (Lightshot alternative)
- Version: 1.1.0 (Chrome MV3, fully compatible with Edge)
- Package: `snapmark-extension-v1.1.0.zip` from the GitHub release
  https://github.com/wookat/snapmark/releases/tag/v1.1.0
- Verified in Edge (stable, Linux): loads unpacked, captures visible tab, editor
  opens, annotation + copy + download all work.

## Accounts

- Microsoft account email: `zalizedata@proton.me` (password managed by owner; not stored here)
- Partner Center program: Microsoft Edge program (free enrollment, no payment)
- Partner Center URL: https://partner.microsoft.com/dashboard/microsoftedge/overview
- Enrollment status: see “Submission log” below.

## Store listing copy (English-first)

- Name: `SnapMark — Screenshot & Annotate`
- Short description (≤132 chars):
  `Capture the visible tab and annotate with arrows, boxes, text and blur. 100% local — screenshots never leave your device.`
- Category: Productivity (Developer tools acceptable alternative)
- Search terms: `screenshot, annotate, capture, markup, lightshot alternative`

Full description:

```
SnapMark is a fast, privacy-first screenshot tool. Click the toolbar icon to
capture the visible tab, then annotate instantly in a full-page editor:

• Arrow, box, ellipse, line, pen and highlighter
• Text labels and numbered counters
• Blur tool to hide sensitive information
• Crop, undo, copy to clipboard, download as PNG

100% local and private:
• No account, no sign-up, no watermark
• Screenshots are processed entirely on your device — nothing is uploaded
• Only two permissions: activeTab (capture on click) and storage (hand the
  capture to the editor)

SnapMark is a free, open-source alternative to the abandoned Lightshot
extension. Source code: https://github.com/wookat/snapmark
Website: https://ext.zalize.com
```

## Assets

- Logo: `extension/icons/icon128.png` (128×128, also 48/16 in the package; original artwork)
- Screenshots (1280×800, self-made, no third-party content):
  - `docs/store-assets/edge-screenshot-1-landing.png` — product page
  - `docs/store-assets/edge-screenshot-2-editor.png` — editor with capture loaded
  - `docs/store-assets/edge-screenshot-3-annotated.png` — arrow/box/highlight annotations
- Privacy policy URL: https://ext.zalize.com/privacy (live; added in PR #19)
- Support / homepage URL: https://ext.zalize.com

## Permission justification (for the certification form)

- `activeTab`: capture a screenshot of the current tab only when the user clicks
  the toolbar button.
- `storage`: pass the captured image from the background service worker to the
  editor page locally. No remote code, no external requests from the extension.

## Submission log

| Date (UTC) | Event | Status |
| --- | --- | --- |
| 2026-08-14 | Package v1.1.0 verified working in Edge | done |
| 2026-08-14 | Privacy policy deployed at /privacy (PR #19) | done |
| 2026-08-14 | Microsoft account signup — blocked at human-verification (press-and-hold) CAPTCHA; requires owner | blocked |
| — | Partner Center Edge program enrollment | pending |
| — | Store submission | pending |
| — | Certification review result | pending |

Update this table on every submission/review event (listing URL, CRX ID,
reviewer feedback, publish date).
