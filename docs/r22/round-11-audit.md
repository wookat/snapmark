# R22 第 11 轮审查 — 回归总审（SnapMark）

审查员：user-experience-officer + qa-engineer + architect
日期：2026-08-14
方法：全站 Lighthouse、桌面/移动 golden path 真浏览器回归、API/安全头 curl 回归、线上 bundle 与 main 源码逐特征比对

## 回归矩阵（通过项）
- Lighthouse：Performance 1.00 / Best Practices 1.00 / SEO 1.00（FCP=LCP=1.4s）
- 桌面 golden path：sample→箭头→blur→undo/redo→Ctrl+S 导出 1200×750，零 JS 异常
- 移动 375px：无横向滚动、Crop 按钮可见可点、编辑器可用
- API：/api/track Origin 校验 403 / 限速 429 / 405、/api/stats 200+60s 缓存、安全头全套（CSP/HSTS/XFO/nosniff/referrer/permissions-policy）在线
- 扩展 zip 下载 200；sitemap/robots/图标/预渲染 HTML 正常

## 发现清单

### R11-1【P1｜部署/回归】线上 JS bundle 与 main 不一致：第 9 轮全部前端修复在生产上丢失
- 复现（线上实测，非推断）：
  - `assets/index-2VJAyZ5a.js`（当前唯一 bundle）中 `Editor toolbar`、`Drawing tools`、`Annotation canvas`、`Skip to content`、`amber-800` 全部 0 命中；而 `Copied to clipboard` 等旧特征存在。
  - 真浏览器验证：桌面与移动编辑器 `[role=toolbar]`=0、`[role=group]`=0、canvas 无 aria-label、首个 Tab 无 skip link；移动对比卡 warn 文案回退为 amber-600（3.19:1），Lighthouse a11y 回落 0.93。
  - 与之矛盾的是：预渲染 HTML 里却有 amber-800 与第 10 轮 FAQ 新文案——即 **HTML 是新源码渲染的，客户端 JS 是旧构建产物**。
- 根因假设（供修改员核对）：第 10 轮部署时 dist 混装——prerender 脚本经 ssrLoadModule 直读最新 src 生成 HTML，而 client bundle 来自未重建的陈旧 vite 产物（或部署了旧 dist 缓存）。HTML/JS 源不一致还引入了水合不匹配风险。
- 影响：第 9 轮 5 项无障碍修复在生产全部失效（R9-1~R9-5 线上回归 FAIL）；构建管线存在「部署产物≠main」的系统性风险，比单点 bug 更严重。
- 建议：① 从 main 干净重建并重新部署，线上逐项复核 R9 特征；② 治本——部署脚本强制顺序 `clean → vite build → prerender(dist) → wrangler deploy`，prerender 只消费本次构建产物，禁止跨次混用；可在 CI-less 流程里加一步部署后自检（curl bundle grep 关键特征）。

### 结论
除 R11-1 外全部维度回归通过。R11-1 为部署管线问题而非代码问题——main 源码本身包含全部修复（已核对 origin/main）。修复并重新部署后，本轮即可闭环。

## progress
audit 完成，等待修改员 fix（重点：干净重建部署 + 管线加固）。
