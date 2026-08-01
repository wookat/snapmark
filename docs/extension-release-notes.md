# SnapMark Extension — Chrome Web Store 发布说明（待开发者账号）

## 状态
- 扩展打包文件 `snapmark-extension.zip` 由 `./scripts/build-extension.sh` 产出，已附在 GitHub Release。
- **Chrome Web Store 上架需一次性 $5 开发者注册费 —— 未购买，记录为需老板提供**（Google 开发者账号 + $5 注册费）。到位后按下方 listing 直接提交即可。

## Store Listing（英文，提交即用）

- **Name**: SnapMark — Screenshot & Annotate (Lightshot alternative)
- **Summary**: Capture the visible tab and annotate with arrows, boxes, text and blur. 100% local — screenshots never leave your device.
- **Category**: Tools / Productivity
- **Description**:
  SnapMark is a maintained, privacy-first screenshot annotator. Click the toolbar icon to capture the current tab, then add arrows, boxes, ellipses, lines, freehand drawings, text, and pixelate/blur to hide sensitive info. Copy the result to your clipboard or download it as PNG. Unlike legacy screenshot extensions, SnapMark is Manifest V3, actively maintained, and never uploads your images to any server — everything is processed locally in your browser. Web version (no install needed): https://ext.zalize.com
- **Permissions justification**:
  - `activeTab`: capture the visible tab only when the user clicks the toolbar icon
  - `storage`: hand the captured image to the local editor page
- **Privacy policy URL**: https://ext.zalize.com (footer privacy statement — no data collected beyond anonymous counters on the website; the extension itself sends nothing)
- **Single purpose**: capture and annotate screenshots locally.

## 提交步骤（账号到位后）
1. https://chrome.google.com/webstore/devconsole → 注册（$5）
2. New item → 上传 `snapmark-extension.zip`
3. 填入上方 listing 文案 + 截图（1280×800，用 ext.zalize.com 编辑器界面截图）
4. Privacy practices：声明不收集用户数据 → 提交审核（通常 1–3 天）
