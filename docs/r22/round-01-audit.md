# R22 第 1 轮审查（全局体检）— SnapMark (ext.zalize.com)

审查员：user-experience-officer + qa-engineer + architect 三合一
日期：2026-08-14 · 方法：375px/1440px 真浏览器走查（Playwright+Chromium 实截）、核心工作流实测（sample→标注→copy/download→undo→crop）、API curl 实测、Lighthouse、通读 src/App.tsx、src/Editor.tsx、worker/index.ts、extension/*

**基线数据（实测）**：Lighthouse perf 100 / a11y 93 / bp 96 / seo 100；FCP=LCP 1.5s，CLS 0；`/api/stats` 1.65s，`/api/track` 200/400 校验正常；404 页正常；extension zip（v1.1.0）可下载、结构完整。核心链路（上传→标注→复制→下载）桌面端全部走通，无 console error。底子很好，以下是发现清单。

---

## 发现清单

### A1 [P1][逻辑] Crop 不可撤销，一次误裁毁掉全部标注
复现：加若干标注 → Crop 框选 → 松手。base 被替换、`shapes=[]`、undo/redo 全清（Editor.tsx onPointerUp crop 分支：`setBase(next); setShapes([]); setRedoStack([])`）。此后 Ctrl+Z 无效，误裁只能从头再来。截图：shots/d-07-after-crop.png。
思辨：现在 history 只覆盖 shapes，base 变换游离在 history 之外——这是模型缺陷而不是漏写一行。更好的设计是把「操作」统一建模：history 是操作列表（含 crop 条目，crop 项记录裁剪前 base 引用），undo 弹出任意操作类型均可恢复。不必做成完整命令模式，仅需保存裁剪前的 base（canvas 引用链，内存可控）。

### A2 [P1][功能·移动端] 移动端「Capture screen」主 CTA 点击静默无反应
移动浏览器（iOS Safari/Android Chrome）不支持 `getDisplayMedia`，`captureScreen` 直接 throw 被空 catch 吞掉——用户点最大最蓝的按钮，什么都不发生。复现：375px UA=iPhone 点击 hero/CTA band 的 Capture screen。
建议：`if (!navigator.mediaDevices?.getDisplayMedia)` 时隐藏该按钮并把 Upload 提升为主按钮（首页文案已声称 "Works on mobile"，当前体验与承诺矛盾）。CTA band 底部同一按钮同样处理。

### A3 [P1][视觉·移动端] 375px 编辑器工具栏溢出，Crop 工具不可见且无滚动暗示
shots/m-03-editor.png：工具行 `overflow-x-auto` 但无任何可滚动提示，第 10 个工具 Crop 被截断在视口外，Blur 也贴边。移动用户不知道还有工具。
建议：小屏改两行网格，或加渐隐边缘/滚动指示；也可以把颜色/粗细收进第二行（当前已 flex-wrap，但工具行本身是独立 overflow 容器不会 wrap）。

### A4 [P2][视觉·移动端] 移动端编辑器画布偏小、画面大量黑色空区
shots/m-03-editor.png：竖屏图片只占屏幕约 1/4，上下大片纯黑。`max-h-[calc(100vh-8rem)]` 针对横图，竖屏时宽度受限导致图小。建议允许双指缩放或初始 fit-width，并将 canvas 垂直居中（当前 wrapper 已 items-center，但小图观感仍空旷，可提高初始缩放）。

### A5 [P2][性能] /api/stats 串行 10 次 KV get，实测 1.65s
worker/index.ts `for...await` 逐 key 读。改 `Promise.all` 即可降到 ~200ms。该端点虽是内部用，但也是最简单的性能修复。

### A6 [P2][架构·逻辑] /api/track 读-改-写非原子 + KV 每 key 1 写/秒限制，计数注定丢失
两次串行 get+put（total、day 各一次）。KV 最终一致且同 key 并发写互相覆盖；流量一上来 visit 计数会显著低估，且当前每请求 4 次 KV 往返。
思辨：KV 本来就不是计数器原语。现成方案是 Workers Analytics Engine（免费、专为此设计、支持按天聚合）或 Durable Object counter。建议迁 Analytics Engine，别在 KV 上修修补补——符合「用成熟方案不造轮子」。若暂不迁，至少 `c.executionCtx.waitUntil` 异步写、合并为单 key JSON。

### A7 [P2][性能] 指纹化静态资源 cache-control 为 max-age=0 must-revalidate
`/assets/index-*.js`（233KB）带内容 hash 却每次 revalidate。wrangler assets 配置加长缓存（`max-age=31536000, immutable`，index.html 保持 no-cache）。回访/编辑器二次打开速度直接受益。

### A8 [P2][安全] 无任何安全响应头；/api CORS 全开放无限流
首页响应缺 CSP、X-Frame-Options/frame-ancestors、HSTS、Referrer-Policy；`/api/track` cors() 默认 `*` 且无速率限制，任何人可脚本刷计数（数据本就匿名，风险低，但计数会失真）。建议：加基础安全头；track 限 origin=ext.zalize.com（extension 场景是 chrome-extension origin，需一并允许）。

### A9 [P2][无障碍] Lighthouse a11y 93：对比度不足
比较表中 emerald-600(#009966) on zinc-50 对比 3.65:1，hero mockup 白字 3.8:1（后者 aria-hidden 可忽略）。emerald-600→emerald-700 即达标。另外编辑器工具按钮 <lg 只有图标无 aria-label（title 有，但 title 不算无障碍名，实际 aria-hidden 的 span 里只剩空 name）——需给 button 加 aria-label。

### A10 [P2][视觉·一致性] 首页 mockup/图示与真实编辑器不一致
- hero mockup 工具条 8 个图标 vs 实际 10 个工具（stats band 又写 "10 tools"）；crop 图标 mockup 用 ⤢、实际用 ⤤；Features 区图示 Highlight 缺失、把 Pen 高亮而文案讲 arrows。
- 小事，但产品页与产品不一致伤可信度。建议 mockup 与 TOOLS 数组同源或至少目视对齐。

### A11 [P2][功能] 标注不可选中/移动/删除单项；文本不可二次编辑
所有 shape 落笔即定，改错只能连环 undo。文本输入框 text-sm 固定字号，与最终渲染字号（14+stroke*6，随缩放）不一致，所见非所得。
思辨：完整对象选择系统成本高；折中方案是「点击选中最后命中的 shape → Delete 删除/拖动平移」，80% 价值 20% 成本。建议列入后续轮次而非本轮必修；本轮可先修文本输入框字号跟随 stroke 和画布缩放。

### A12 [P2][架构·流程] extension zip 与站点版本天然脱节
zip 内打包的是 2026-08-08 构建的 app；站点每次部署后 zip 不会跟着更新，编辑器修复对 extension 用户不生效。CI 已禁用，需在部署 SOP 里明确「改动 src/ 后必须重跑 build-extension.sh 并更新 release」，或在 fix 报告中说明本轮是否重发 release。

---

## 汇总
- P1×3：A1（crop 不可撤销）、A2（移动端主 CTA 静默失败）、A3（移动端工具栏溢出）
- P2×9：A4-A12
- 本轮不要求全修：P1 必修，P2 由修改员按性价比取舍并在 fix 报告说明理由。

## verdict（复验后追加）
（待修改员 round-01-fix.md 后由审查员线上复验填写）
