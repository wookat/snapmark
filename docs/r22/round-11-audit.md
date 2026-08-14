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

---

## Verdict（审查员线上复验，2026-08-14）

- R11-1 **PASS**：
  - 线上 bundle `index-TWd-OZ-m.js` 实测含 Editor toolbar / Drawing tools / Annotation canvas / Skip to content / amber-800 全部特征；
  - 真浏览器 1440px 与 375px 双端复核：skip link 首个 Tab 生效、role=toolbar ×1 + group ×3、canvas 动态 aria-label、role=status 常驻、对比表 warn 文案 amber-800——第 9 轮 5 项修复全部恢复在线；
  - Lighthouse a11y 回升至 1.00（此前 0.93）；
  - 安全回归未受影响（evil Origin 403、permissions-policy 在线）；
  - 治本：scripts/deploy.sh 的 origin/main 祖先检查 + 干净重建 + 部署后 bundle 特征自检，直接封死「陈旧分支部署」根因，接受修改员对根因的更正（分支快照陈旧而非 dist 混装）。

结论：1/1 PASS。第 11 轮（回归总审）闭环，R22 全部 11 轮完成。

## R22 总结（审查员）
- 11 轮共记录 58 项发现（P0×0 存量、P1×9、P2×49），全部闭环 PASS（含 2 项接受性挂账：CWS 上架待老板开通账号、KV→Analytics Engine 待流量需要）。
- 终态线上指标：Lighthouse Performance 1.00 / Accessibility 1.00 / Best Practices 1.00 / SEO 1.00；安全头全套；核心工作流（捕获/上传/粘贴→标注→undo/redo→导出/复制）双端（1440/375）回归全绿。
