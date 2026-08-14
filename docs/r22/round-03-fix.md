# R22 Round 3 — Fix Ledger (修改员)

PR: https://github.com/wookat/snapmark/pull/10
Deployed: Worker version `34abbc52-5c54-4f2a-9a01-5e833d974533` (from round-3 branch, merge left to boss per platform policy)
Local validation: `npm run lint` + `npm run build` green; preview smoke (Playwright) confirms inlined CSS applies and editor loads.

## 逐项响应

### R3-1 非哈希静态资源 max-age=0 — 已修
Worker 对成功的非 HTML、非 `/assets/` 响应设置 `cache-control: public, max-age=3600, stale-while-revalidate=86400`（sample.png、og.png、favicon、extension.zip）。`/` 与 HTML 保持 `max-age=0, must-revalidate` 以保证发版即时生效。哈希资产维持一年 immutable。线上已验证 `sample.png` 返回新头。
- 未采纳"extension.zip 走版本号路径 + immutable"：会引入路径版本管理实体，1 小时缓存 + SWR 已消除重复下载成本，如无必要勿增实体。

### R3-2 CSS 渲染阻塞 — 已修（构建期内联）
新增约 15 行零依赖 Vite 插件 `inlineCss()`：`generateBundle` 阶段把 CSS bundle（gzip 后约 8KB）替换进 `index.html` 的 `<style>`，删除 `<link rel=stylesheet>`，消除一次渲染阻塞请求。
- 权衡：audit 担心内联损害缓存——但 HTML 本身就是 `max-age=0`，CSS 独立缓存的收益仅在"JS 变了 CSS 没变"场景，且 CSS 仅 8KB；内联净收益为正。CSP 已含 `style-src 'unsafe-inline'`，无需改动。
- 否决方案：`<link rel=preload>`（仍是一次往返）、critical-CSS 提取工具（新增构建依赖与复杂度，违背勿增实体）。

### R3-3 大画布全量重绘 / Blur 临时 canvas — 驳回（本轮不修）
同意 audit 自己的结论：桌面实测 55–60 FPS，属预防性优化。引入 offscreen 合成缓存会显著增加渲染路径复杂度（缓存失效时机、crop/undo 交互），在无实测掉帧证据前是过度设计。待移动端实测出现掉帧再议。

### R3-4 Canvas 声明未加载的 Inter 字体 — 已修
统一为诚实的字体栈：Canvas 文本/计数器改用 `CANVAS_FONT = 'system-ui, sans-serif'`；同时把 CSS `--font-sans` 里从未加载的 `"Inter"` 移除（页面与导出图渲染一致，声明即所得）。
- 否决方案：真的引入 Inter webfont——增加约 100KB+ 加载与 FOUT，与 R3-2 的性能目标相悖，现有 system-ui 视觉已足够。

### R3-5 红色 mockup 徽章对比度 3.8:1 — 已修
`bg-red-500` → `bg-red-700`（#b91c1c，白字对比度约 5.9:1，>4.5:1 AA）。红-700 仍保持"错误标注"语义。

### R3-6 KV 原子性（追踪项）— 维持既定结论
非阻塞已知项（A6 partial-pass 延续）。指标为 best-effort 统计，Durable Object 级别的强一致对该用途是过度设计。

## progress
{"round": 3, "status": "fix"}
