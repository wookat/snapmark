# R22 Round 4 — Fix Ledger (修改员)

PR: https://github.com/wookat/snapmark/pull/11 （已合并）
Deployed: Worker version `417cfe70-7d25-402a-83cf-5da8a6e36435`
Local validation: lint/build 全绿；Playwright 375×667 触摸仿真实测 + 生产复测（证据见 PR #11 评论，含录屏与截图）。

## 逐项响应

### R4-1 375px 编辑器布局失衡（P1）— 已修（方案 a+b）
工具栏容器移动端改 `grid grid-cols-5`：固定 2 行×5 个工具，消灭 Crop 孤行；`sm:` 以上恢复原 flex 单行，桌面零影响。工具栏高度实测 306px → **169px**，画布区（原本已是 flex-1 居中）获得剩余空间。
- 未采纳"工具栏移到底部"：认同它是移动端更优范式（拇指热区），但涉及整页布局重构与桌面/移动双分支维护成本，本轮以最小改动先消除 P1 空间浪费；若后续移动端使用数据显著可再立项。画布 351×219 是 1200×750 图像在 375px 宽下的等比结果，非布局缺陷。

### R4-2 Text 输入框 11.1px 触发 iOS 自动缩放 — 已修
输入框 fontSize 增加 `Math.max(16, …)` 下限（iOS <16px 聚焦自动 zoom 是既定行为）；提交后的文字仍按画布比例绘制，输入框视觉与最终字号解耦。生产实测 computed font-size = 16px，提交正常。

### R4-3 触摸目标偏小 — 已修
- 颜色 swatch：`h-5 w-5` → 移动端 `h-8 w-8`（32px，选中态 scale-110≈35px），`sm:` 恢复 24px。
- Undo/Redo/✕：统一 `h-9 min-w-9`（36×36）。
- 页脚链接：`inline-block py-1.5`（约 32px 点按高），行距用 space-y-0.5 补偿保持视觉密度。
- 工具按钮维持 36px（grid 下自动拉伸列宽更大）。未强推 44px：36px 已高于 WCAG 2.5.5 最低 24px，且 44px 会让工具栏重新膨胀、与 R4-1 目标冲突——在"目标大小"与"操作面积"之间取实测平衡。

### R4-4 触摸设备显示 Ctrl+V 提示 — 已修
Tailwind v4 `pointer-coarse:hidden` 隐藏 "paste with Ctrl+V," 片段，句子退化为 "…or drag & drop anywhere, or try a sample image"，无需 JS。生产触摸仿真实测已隐藏、桌面仍显示。
- 未采纳"改为长按粘贴措辞"：移动浏览器无法编程触发粘贴 UI，长按行为因浏览器而异，误导性大于价值。

### R4-5 Safari 剪贴板异步丢失 user gesture — 已修（代码审查推断项）
`copy()` 改为在用户手势内同步构造 `new ClipboardItem({'image/png': exportBlob()})`（ClipboardItem 值支持 Promise<Blob>，Safari 13.1+ 即支持该形式），`await` 仅发生在 `clipboard.write` 上。失败降级提示（use Download）保留。Chrome 生产实测 Copy 正常；Safari 真机本环境无法验证，与审查员标注一致，留待真机抽验。

## progress
{"round": 4, "status": "fix"}
