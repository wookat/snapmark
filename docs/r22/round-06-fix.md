# R22 Round 6 Fix — 信息架构与文案专项

修改员：Devin（本会话）
代码分支：`devin/1786677158-r22-round6` → PR [#13](https://github.com/wookat/snapmark/pull/13)（已合并）
部署：worker version `b8557044-d4a6-408f-90ad-f6813a6d580a`（ext.zalize.com）
本地验证：oxlint + vite build 全绿；Playwright 375px 触屏 + 桌面 smoke 全过；线上全量复测通过（证据见 PR #13 评论，含截图）。

## 逐项响应

### R6-1 触屏设备仍见 Ctrl+V 文案 — 已修（采纳"统一中立措辞"思辨）
营销区两处改为设备中立："paste from the clipboard with Ctrl+V" → "paste straight from your clipboard"；卡片 "Paste with Ctrl+V" → "Paste from clipboard"。
Hero 的 kbd 快捷键提示保留既有 `pointer-coarse:hidden`（它是桌面功能提示而非营销文案，键帽样式在桌面有真实引导价值）。不新增任何设备分支——采纳审查员"如无必要勿增实体"的建议。
线上实测：375px 触屏 body 内 Ctrl+V 出现 0 次；桌面 hero 提示仍在。

### R6-2 FAQ 区域捕获答案不诚实 — 已修
改为直答："Not at capture time — SnapMark captures the full screen, window or tab you pick, and you then use the Crop tool to trim to the exact area (same result in one extra click). On mobile, upload or paste an image and crop it the same way."
先明确不支持捕获时框选，再给等效路径，最后覆盖移动端。

### R6-3 编辑器 ✕ 语义歧义、无品牌 — 已修（采纳一石二鸟方案）
工具栏左侧新增 SnapMark mini logo（蓝色 S 方块 + ≥lg 显示产品名，点击走同一 confirmReset 确认流程）；右上 ✕ 改为「＋ New」（≥sm 显示文字标签）。扩展用户直落编辑器也能看到产品名并有明确的新建入口。
线上实测：logo 与 ＋ New 均在；有标注时点 logo 弹确认框，确认后回落地页。

### R6-4 375px 对比表横向溢出 — 已修（采纳堆叠卡片方案）
行数据提为 `COMPARE_ROWS` 常量单一来源；≥sm 保留三列表格（去掉 min-w 溢出），<sm 渲染堆叠卡片（每行 feature + SnapMark/Lightshot 两行）。卖点列（"Uploaded to prnt.sc" 等）移动端默认可见，无需横滑。
否决方案：渐隐边缘提示可滑——仍把转化关键内容藏在滚动后面，治标不治本。
线上实测：375px `scrollWidth=375` 无横向溢出，卡片含 Lightshot 行；桌面表格正常。

### R6-5 外链行为不一致 — 已修
页脚 4 个 ZALIZE 产品链接统一加 `target="_blank" rel="noreferrer"`，与 GitHub 链接同一规则。
线上实测：点击 HonestQR 新标签页打开，原页不变。
注意事项：已打开的旧标签页在刷新前仍是旧 bundle 行为（部署常态，非缺陷）。

## 验证与证据
- 本地：lint/build 全绿；`/tmp/smoke6.py`（375px 触屏 0 Ctrl+V、卡片可见表格隐藏、桌面反向、_blank 校验、编辑器 logo/New）全过。
- 线上：testing agent 全量复测通过（含核心回归 arrow → undo/redo → Copy → Download 1200×750），截图证据见 PR #13 评论。
- 未验证项：真机 Safari（环境限制，同前几轮）。
