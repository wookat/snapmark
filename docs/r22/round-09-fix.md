# Round 9 — Fix report（修改员）

PR: https://github.com/wookat/snapmark/pull/16 （已合并入 main）
部署: worker version `3aeca181-bc5b-4b9c-9852-ee6a50317b80` @ https://ext.zalize.com
本地验证: lint / build 全绿；CDP smoke 逐项断言通过。

## 逐项响应

### R9-1 对比表 warn 文案对比度 3.19:1 — 已修
`CompareCell` warn 分支文字 `text-amber-600` → `text-amber-800`（#92400e on #fff ≈ 6.9:1，留足余量优于恰好 4.5）；图标单独保留 `text-amber-600`（图形元素 3:1 即可，且保持视觉警示色）。桌面表格与移动卡片两处共用同一组件，一处修改全覆盖。

### R9-2 toast 无 aria-live — 已修
编辑器 toast 改为**常驻挂载**的 `role="status"` 容器（隐式 aria-live=polite），toast 气泡在容器内条件渲染。常驻容器是关键：aria-live 区域在内容变化前就存在，SR 才可靠播报；所有 toast（copy/download/crop 失败/clipboard blocked/加载 notice）共用这一个容器，无需逐处添加。
落地页错误 notice 已有 `role="alert"`（第 5 轮引入），本轮核对无需改动。
**证据**：smoke 点击 Copy 后 `[role=status]` 文本为 "Copied to clipboard"。

### R9-3 canvas 对 SR 空白 — 已修
`<canvas role="img" aria-label="Annotation canvas, {W}×{H} pixels, {N} annotations">`，label 随裁剪尺寸与标注数动态更新。
**认同审查员思辨并同样否决**：逐 shape 可访问子树（shadow DOM 描述每个标注）成本高、受众极小，违背"如无必要勿增实体"。

### R9-4 无 skip link — 已修
根节点首个可聚焦元素为视觉隐藏（`sr-only`）、聚焦时浮现的 "Skip to content" 链接 → `#main`；`<main>` 加 `id="main"`。
**证据**：smoke 首个 Tab 聚焦该链接且 focus 态可见（absolute 定位浮现）。

### R9-5 工具栏无分组语义 — 已修
顶栏 `role="toolbar" aria-label="Editor toolbar"`，内部三个 `role="group"`：Drawing tools / Color and stroke / Export and file actions。
**未做 roving tabindex**：审查员已标注非强制；当前 Tab 遍历完全可用，10 个工具的方向键导航属可选增强，收益不抵新增的焦点管理复杂度——留待真实 SR 用户反馈再决定。

## 未修项
无。

## 回归
CDP smoke：水合零告警、skip link、三组 role、canvas label 动态、toast 播报均断言通过；生产端全链路（Lighthouse a11y + golden path）由测试代理执行中，证据将补充在 PR #16 评论。
