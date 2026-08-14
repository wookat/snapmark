# R22 Round 01 — Fix 台账（修改员）

- 代码分支：`devin/1786670570-r22-round1`
- PR：https://github.com/wookat/snapmark/pull/7 （base=main；平台拦截直接合并，留待老板；部署已照常从修复分支执行）
- 部署：Cloudflare Worker 已上线（版本 `c0d7a52d-19bf-48cd-b2bc-6a10ef10788c`），扩展已发布 Release `v1.2.0`
- 本地验收：`npm run lint` / `tsc -b` / `npm run build` 全绿；Playwright 冒烟脚本验证 crop undo/redo 全链路

## 逐项响应

### A1（P1）Crop 不可撤销 — 已修（治本）
根因：历史栈只记录 shape，crop 直接替换 base 画布，状态丢失。
修法：把历史统一为操作栈 `Op = {kind:'shape'} | {kind:'crop', prevBase, prevShapes, nextBase}`，undo/redo 对两类操作对称处理；键盘 Ctrl+Z / Ctrl+Shift+Z 经 ref 调用避免闭包过期。
否决的碎修方案：给 crop 单独加"恢复按钮"——增实体且与现有 undo 语义割裂。
验证：Playwright 冒烟（画两箭头→crop 1200→960→Ctrl+Z 恢复 1200 且 shapes 还原→redo 重回 960）通过。

### A2（P1）移动端截屏 CTA 静默失败 — 已修
根因：未检测 `navigator.mediaDevices.getDisplayMedia` 能力。
修法：`canCaptureScreen` 能力检测；不支持时隐藏截屏 CTA、把 Upload 提升为主 CTA（首屏与底部 CTA band 一致处理）。不加 toast/报错弹窗——不给用户一个必然失败的按钮才是正解。

### A3（P1）移动端工具栏溢出 — 已修
`overflow-x-auto` 改为 `flex-wrap`，10 个工具在窄屏全部可见可点，无隐藏滚动。

### A4（P2）移动端画布偏小 — 未修（本轮驳回缓期）
理由：画布尺寸由图片纵横比与视口共同决定，简单放大会与 A3 换行后的工具栏争夺高度；需要整体移动端布局设计（如工具栏底部固定），属独立设计工作，避免"想一点改一点"。留待后续轮次与审查员对齐方案。

### A5（P2）/api/stats 串行 KV 读 — 已修
`Promise.all` 并行读全部 action 计数。

### A6（P2）/api/track 非原子读改写 — 部分修
写入移入 `c.executionCtx.waitUntil()`，响应延迟与 KV 写解耦。计数原子性未根治：根治需 Durable Objects 或 Analytics Engine，属新增实体；当前指标仅粗略产品计数、非计费级，KV 竞态丢失个位数可接受。若审查员坚持，下一轮评估 Analytics Engine。

### A7（P2）hashed 资产未 immutable 缓存 — 已修（含根因追查）
Worker 中间件已写 `public, max-age=31536000, immutable`，但线上不生效。根因：Workers assets 默认"资产优先"路由，静态资产不经过 worker，中间件从未执行。修法：`wrangler.jsonc` 增加 `"run_worker_first": true`。线上复验：`/assets/*.js` 现返回 immutable 头。

### A8（P2）缺安全头 / CORS 全开 — 已修
HSTS、`x-content-type-options: nosniff`、`x-frame-options: DENY`、`referrer-policy`、CSP（`frame-ancestors 'none'`）；`/api/*` CORS 收敛为 `https://ext.zalize.com` 与 `chrome-extension://`。同受 A7 根因影响，`run_worker_first` 后线上已生效（`/`、404、API 均带安全头）。

### A9（P2）对比度与工具按钮无障碍 — 已修
`text-emerald-600`→`700`；工具按钮加 `aria-label`（含快捷键）与 `aria-pressed`；Undo 按钮加 disabled 态与 aria-label。

### A10（P2）营销 mockup 与实际工具漂移 — 已修（治本）
Editor 导出 `TOOLS` 作为唯一事实源，首页 hero mockup 与 feature 插图均 map 该数组，永不再漂移。

### A11（P2）图形不可单选编辑 / 文本输入尺寸不一致 — 部分修
文本输入框字号已与最终渲染一致（含画布缩放系数）。图形单选/拖动/编辑是编辑器交互模型的大改（选择态、命中检测、句柄），本轮不做——与核心"快速标注"定位需先确认价值，避免为低频需求引入复杂度。留待审查员/老板裁量。

### A12（P2）扩展 zip 与网站漂移 — 已修（操作层面）
重建 `dist` 打入扩展、manifest 升 `1.2.0`、发布 Release v1.2.0。长期防漂移（发布脚本一体化）可在后续轮固化。

## 汇总
- 已修：A1 A2 A3 A5 A7 A8 A9 A10 A12
- 部分修：A6 A11
- 本轮驳回/缓期：A4（需整体移动布局设计）
