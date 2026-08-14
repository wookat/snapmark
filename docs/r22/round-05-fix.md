# R22 Round 5 Fix — 错误路径与边界专项

修改员：Devin（本会话）
代码分支：`devin/1786675865-r22-round5` → PR [#12](https://github.com/wookat/snapmark/pull/12)（已合并）
部署：worker version `86dc9790-75f3-4eb7-903d-09a40c009a66`（ext.zalize.com）
本地验证：oxlint + vite build 全绿；Playwright 本地 smoke + wrangler dev curl 全过；线上全量复测通过（证据见 PR #12 评论，含截图）。

## 逐项响应

### R5-1 极小光栅图不可用 — 已修
根因：`normalizeImage` 只对小 SVG 和超大图做归一化，1×1 等极小光栅图原样进入编辑器。
修法：新增 `MIN_RASTER_EDGE = 256`，非 SVG 且最长边 <256px 时按整数倍（`ceil(256/maxEdge)`）最近邻放大（`imageSmoothingEnabled=false` 保留像素风格），并提示 "Small image upscaled ×N to WxH"。
否决方案：直接拒绝小图 —— 小图标/像素画是合法输入，拒绝伤害正常用例；非整数倍平滑放大 —— 会把像素图糊掉。
线上实测：16×16 PNG → 256×256 画布 + toast + 可正常标注。

### R5-2 极端长宽比图坍缩成发丝线 — 已修
根因：编辑器用 `max-h/max-w` 等比适配视口，400:1 的图短边被压到 <1px。
修法：`Editor` 中 `max(W/H,H/W)>20` 时取消适配约束，按 `displayScale = max(1, ceil(40/minEdge))` 设置显式 CSS 尺寸，放进已有 `overflow-auto` 区域横向滚动；内部画布分辨率与标注坐标不变（`canvasPoint` 本就按 boundingRect 归一化，无需改坐标逻辑）。
否决方案：拒绝长图（长网页截图是核心用例）；修改导出分辨率（破坏"所见即所得"的导出语义）。
线上实测：4000×10 → 40px 高 ×4 显示、可横向滚动，箭头精确落在拖拽位置（缩放截图佐证）。

### R5-3 过小 Crop 选区静默忽略 — 已修
`<10px` 选区现在 toast "Selection too small to crop"；同时把通用的 <3px 误触守卫对 crop 排除，使 crop 的任何过小拖拽都能到达该提示。保留 10px 下限防误裁。

### R5-4 /api/track 非 POST 返回 404 — 已修
在真实路由之后加 `app.all('/api/track')` 兜底返回 405 + `Allow: POST`；顺手对 `/api/stats` 同样处理（405 + `Allow: GET`），一次治本同类问题。POST 校验、CORS、安全头不变。
线上 curl：`PUT /api/track` → 405 + `allow: POST`；`POST` → 200。

### R5-5 动图 GIF 静默丢帧 — 已修（提示，不做动图编辑）
GIF 上传时 toast "Animated GIF — only the first frame is editable"。
附带发现并治本：原 `setNotice` 挂在落地页上，图片加载成功即切换到编辑器，导致所有加载提示（含既有的 SVG/大图缩放提示）从未被用户看到。本轮把提示改为 `initialNotice` prop 传入 Editor，进编辑器时以 toast 展示 4 秒 —— 这是系统性修复，不是只给 GIF 打补丁。
否决方案：实现动图编辑/导出 GIF —— 引入帧解码、时间轴与导出编码器，实体大增而与截图标注核心场景无关，如无必要勿增实体。

## 验证与证据
- 本地：`npm run lint`、`npm run build` 全绿；`/tmp/smoke5.py`（1×1、4000×10、tiny crop、GIF）全过；wrangler dev curl 405 验证。
- 线上：testing agent 全量复测通过（含核心回归：sample → arrow/box/text → 撤销/重做往返 → Copy/Download 1200×750），截图证据见 PR #12 评论。
- 未验证项：真机 Safari 行为（环境限制，同前几轮）。
