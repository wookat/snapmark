# R22 第 7 轮审查 — 代码架构与耦合专项（SnapMark）

审查员：user-experience-officer + qa-engineer + architect
日期：2026-08-14
方法：通读 main 最新代码（src/App.tsx 682 行、src/Editor.tsx 545 行、src/track.ts、worker/index.ts 96 行、extension/、scripts/build-extension.sh），结合前 6 轮线上实测数据做架构判断。

## 先说架构做对的（不折腾）
- 整体极简：无状态管理库、无路由库、1364 行做完整个产品，符合"如无必要勿增实体" ✅
- COMPARE_ROWS/TOOLS 单一数据源同时驱动营销区与编辑器/移动卡片 ✅
- 扩展打包脚本复用 web 构建产物，无双份实现 ✅
- Worker 静态资产 + API 同源，一个部署单元 ✅
- 深思后不立项的项：编辑器代码与落地页同 bundle（React.lazy 可拆）——当前 JS 总量小、Lighthouse Perf 100、FCP 1.4s，拆分引入加载态与复杂度收益为负，明确否决。

## 发现清单

### R7-1【P2｜架构】App.tsx 是 682 行的"上帝文件"：落地页营销内容（约 450 行 JSX+文案数据）与图像接入管线（loadImage/normalizeImage/handleFile/captureScreen）、编辑器路由混居一文件
- 影响：每轮文案改动都在触碰图像管线所在文件，diff 噪声大、回归面不清晰；SMALL_FEATURES/FAQS/COMPARE_ROWS/IC 图标等纯数据与逻辑无分层。
- 建议：拆 `src/Landing.tsx`（含数据常量）与 `src/lib/image.ts`（loadImage/normalizeImage），App 只留状态路由（~80 行）。不引入目录深层级，两个新文件即可。思辨：拆分标准不是行数而是"变更原因"——营销文案与图像管线的变更原因完全不同，应隔离。

### R7-2【P2｜性能/架构】Crop 历史持有全尺寸画布，内存随裁剪次数无界增长
- 代码：`Op { kind:'crop'; prevBase; prevShapes; nextBase: HTMLCanvasElement }`——每次 crop 在 history 里保留一张 prevBase（首次为原图）+ nextBase 画布。16MP 图连续裁剪 N 次 ≈ N×64MB 位图驻留（撤销栈无上限，redoStack 同理）。
- 建议：crop op 只存 `rect + prevShapes`，undo 时从原始 base 重放裁剪链恢复（CPU 换内存）；或简单方案：history 中 crop op 超过 3 个时丢弃最老的 prevBase（降级为不可撤销）并提示。思辨：移动端（16MP 上限正是为 iOS Safari 设的）最可能先崩，重放方案不增加用户可感知延迟（undo 是低频操作）。

### R7-3【P2｜架构】KV read-modify-write 计数在并发下丢增量（R3 起挂账，本轮给出方案级建议）
- 代码：worker/index.ts 中 `get→parseInt→put`，两个 key 串行。Cloudflare KV 无原子自增且最终一致，并发访问高峰丢计数、且 `day:` key 无 TTL 永久堆积。
- 建议：迁移到 Workers Analytics Engine（`c.env.AE.writeDataPoint({blobs:[action]})`，平台原生、免费额度充足、天然按时间聚合，/api/stats 改查 AE SQL API）——符合"优先复用平台成熟能力"；退而求其次给 `day:` key 加 `expirationTtl: 90天`。KV 双 key 自增方案本质不可修，不建议继续修补。

### R7-4【P2｜逻辑】track.ts 两个分支重复 90% 的 fetch 逻辑
- 代码：http 分支与非 http（扩展）分支各写一遍 headers/body/keepalive/catch，仅 base 与 action 前缀不同。
- 建议：先算 `const base = …; const name = location.protocol.startsWith('http') ? action : 'ext_'+action`，一个 fetch 收敛。消除未来改动（如加字段）漏改一支的风险。

### R7-5【P2｜架构】Editor 键盘快捷键 effect 依赖 4 条手工 ref 管道（undoRef/redoRef/downloadRef/copyRef 每次渲染重新赋值）绕过闭包过期
- 影响：模式脆弱——新增快捷键必须记得同时加 ref 赋值，遗漏时表现为"用的是旧状态"这类难查 bug；四条 ref 本质是同一需求（最新 handlers）。
- 建议：收敛为单个 `handlersRef.current = { undo, redo, download, copy }`（一处赋值），或 effect 直接依赖这些 useCallback 化的 handler（移除 `[]`）。思辨：React 官方对该场景的答案是 useEffectEvent，但当前 React 19 已可用 ref 对象一次收敛，不必等新 API。

## progress
审查完成（5×P2，无 P0/P1；线上行为无回归风险项），进入 fix 阶段。

---

## Verdict（审查员线上复验，2026-08-14）

- R7-1 **PASS**：main 上 App.tsx 102 行（状态路由）、Landing.tsx 554 行、lib/image.ts 43 行；线上落地页 8 个 h2 区块完整渲染，三入口正常。
- R7-2 **PASS**：Op 改为 `{kind:'crop'; rect; prevShapes}` + `rebuildBase` 重放；线上嵌套裁剪 1200×750→650×450→270×220，3×undo 逐级精确还原（270→650→1200→1200 去箭头），3×redo 回到 270×220，导出 PNG 实测 270×220，零 JS 异常（shots/v7-editor.png）。
- R7-3 **PASS（部分修，接受驳回理由）**：`day:` key 实装 90 天 TTL；AE 迁移驳回理由成立（为 P2 计数器引入 API token 密钥面违反勿增实体，当前精度损失可忽略）。挂账保留：流量/精度要求上升时迁移 AE。
- R7-4 **PASS**：track.ts 收敛为单 fetch（15 行）；线上 POST /api/track 200、/api/stats 正常计数。
- R7-5 **PASS**：四条 ref 管道收敛为单个 handlersRef；线上 Ctrl+Z / Ctrl+Shift+Z / Ctrl+S 全部生效。

结论：5/5 PASS（R7-3 为接受的部分修复+挂账）。第 7 轮闭环，进入第 8 轮（SEO/发现性专项）。
