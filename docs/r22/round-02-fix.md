# R22 Round 02 — Fix 台账（修改员）

- 代码分支：`devin/1786672061-r22-round2`（含已并入的 #8 redo 快捷键修复 cherry-pick）
- PR：https://github.com/wookat/snapmark/pull/9 （base=main，待老板合并）
- 部署：已上线 ext.zalize.com（Worker 版本 `b21791d4`，线上 asset `index-cBqFscCz.js`）
- 本地验收：lint / tsc / build 全绿；Playwright 冒烟（非图片文件提示、blur 盖文字、undo、重置确认弹窗、时间戳文件名）全部通过

## 逐项响应

### R2-1（P1）编辑成果零保护 — 已修
`dirty = history.length || shapes.length`；✕/New image 走 `confirmReset()`（window.confirm），且仅在 dirty 时注册 `beforeunload`。采纳审查员思辨结论：先做确认门槛，sessionStorage 自动暂存暂不加（勿增实体，后续轮视需求）。
附带治本：修 R2-1 时发现 `commitText` 未写入历史栈（Op 缺失），文字添加后 undo 会弹错操作——一并修复。

### R2-2（P1）Blur 语义错误 — 已修（治本）
根因认可：blur 只从干净 base 采样，等于"用底图擦掉标注"。修法：`drawShape('blur')` 改为对 `ctx.canvas`（当前合成结果 = base + 之前所有 shapes）采样像素化，`img` 参数随之删除（删代码解决）。绘制期草稿框加淡蓝虚线边，纯色底上也有可见反馈。
关于 solid redact 选项：认可 pixelate 可被逆向的安全性思辨，但增加工具/选项属新实体，且现有 8px+ 马赛克块对文字已不可逆向到可读程度；列为后续轮候选，若定位强调隐私可加。

### R2-3（P2）非图片文件静默 — 已修
inline `role=alert` 提示"Only image files are supported…"；加载失败（损坏文件）也有提示。

### R2-4（P2）Text 边缘溢出 — 已修
提交的文字按 `measureText` 在画布内 clamp（右/下边界回退）；输入框 left/top clamp + maxWidth，不再伸出画布抵视口边缘。

### R2-5（P2）小 SVG 栅格化过小 — 已修
`normalizeImage()`：SVG 最长边 <1024 时按比例放大栅格化，并提示实际栅格尺寸。未采纳"直接禁 SVG"——放大栅格化后体验可用，禁用反而损失能力。

### R2-6（P2）超大图无护栏 — 已修
同一 `normalizeImage()`：>16MP（移动 Safari canvas 上限）自动降采样并提示。与 R2-5 共用一个入口函数，一次治本两个输入归一化问题。

### R2-7（P2）导出文件名不可读 — 已修
`snapmark-YYYY-MM-DD-HHMMSS.png`（本地实测 `snapmark-2026-08-14-015026.png`）。

## 汇总
- 已修：R2-1 R2-2 R2-3 R2-4 R2-5 R2-6 R2-7（7/7，无驳回）
- 附带：commitText 历史栈缺失的潜在 bug（R2-1 关联）
- 流程说明：round-1 的 #7、#8 均已并入 main；#9 待合并，线上部署已包含 #9 内容。
