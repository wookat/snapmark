# R22 第 7 轮修复 — 代码架构与耦合（SnapMark）

修改员：senior engineer（Devin）
日期：2026-08-14
PR：https://github.com/wookat/snapmark/pull/14（base=main，已合并）
部署版本：05a7e69f-439d-4230-8f5b-e62bb7b31fee（ext.zalize.com）

## 逐项响应

### R7-1 App.tsx 上帝文件 → 已修
- 按"变更原因"拆分（认同审查员的拆分标准）：
  - `src/Landing.tsx`：Icon/IC、SMALL_FEATURES、COMPARE_ROWS、FAQS、EditorMockup、CompareCell + 全部落地页 JSX；dragOver 状态下沉到 Landing 内部（纯展示态，App 无需知道）。
  - `src/lib/image.ts`：loadImage、normalizeImage 及尺寸常量（MAX_PIXELS/MIN_SVG_EDGE/MIN_RASTER_EDGE）。
  - `App.tsx` 缩为 ~100 行状态路由：`<Landing notice onFile onSample onCapture />` vs `<Editor />`。
- 否决方案：按行数机械拆成多个 section 组件（增实体无收益）；引入 pages/components 深目录（当前规模不需要）。

### R7-2 Crop 历史无界内存 → 已修（采纳重放方案）
- Op 改为 `{ kind:'crop'; rect:{x,y,w,h}; prevShapes:Shape[] }`，不再持有 prevBase/nextBase 画布。
- 新增 `rebuildBase(ops)`：从 initialImage 起重放裁剪链（每步先烙印该步 prevShapes 再按 rect 裁剪），undo/redo 时按需重建 base。内存 O(1)（原 N×全尺寸位图），CPU 只花在低频的 undo/redo 上。
- 否决方案：审查员的降级方案（超过 3 个 crop 丢最老 prevBase、提示不可撤销）——重放方案成本相近却无功能阉割，无理由选降级。
- 验证：本地 + 线上均做了双层嵌套裁剪 → 逐级 undo（尺寸逐级精确还原 516×281→750×500→1200×750，标注按各层正确重现）→ 逐级 redo（终态与原 516×281 完全一致）。

### R7-3 KV read-modify-write 计数 → 部分修（TTL），AE 迁移驳回缓行
- 已修：`day:` key 写入加 `expirationTtl: 90 天`，按日计数不再永久堆积。
- 驳回 AE 迁移（本轮）理由：
  1. `/api/stats` 查 AE 需走 SQL API，要求在 worker 里存 Cloudflare API token secret——为一个 P2 计数器引入新的密钥依赖与外部认证面，违反"如无必要勿增实体"。
  2. AE 是新数据集，历史 total 计数会归零/冻结，需要额外迁移逻辑。
  3. 当前流量下并发丢增量的实际损失可忽略（计数仅内部参考，非计费/PII）。
  - 若未来流量或计数精度要求上来，同意迁移 AE 并在立项时申请 secret。此判断写明供仲裁。

### R7-4 track.ts 重复 fetch → 已修
- 收敛为单个 fetch：`base` 与 `ext_` 前缀先算好，headers/body/keepalive/catch 只写一遍。22 行 → 15 行。

### R7-5 四条手工 ref 管道 → 已修
- 收敛为单个 `handlersRef.current = { undo, redo, download, copy }`（一处赋值），键盘 effect 统一走 `handlersRef.current.*`。新增快捷键只需在一个对象里加字段。
- 否决方案：给四个 handler 全部 useCallback 化并放进 effect 依赖——会让键盘监听随每次绘制状态变化反复解绑/重绑，得不偿失；useEffectEvent 等 React 官方 API 落地后可再简化。

## 验证
- 本地：`npm run lint` + `npm run build` 全绿（仅存量 fast-refresh warning）；Playwright smoke（/tmp/smoke7.py）：落地页各 section 渲染、箭头+双层裁剪+3×undo/3×redo 每步尺寸精确、重放后箭头像素仍在。
- 线上（testing agent，全程录屏，证据已评论至 PR #14）：落地页完整渲染、drag-over/粘贴/示例图三入口、嵌套裁剪 undo/redo 逐级精确还原、Ctrl+Z/Shift+Z/C/S 快捷键、裁剪后导出 PNG 516×281 精确、text/counter/blur + LIFO undo、/api/track POST 200 / GET 405。零回归。
- 未验证项：真机 Safari（环境限制，同前几轮）。

## progress
fix 完成，等待审查员线上复验。
