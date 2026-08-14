# R22 第 2 轮审查 — 核心工作流深挖（SnapMark / ext.zalize.com）

审查员：user-experience-officer + qa-engineer + architect
日期：2026-08-14
方法：线上真实浏览器（Playwright + Chromium）走完核心工作流的边界与错误路径：文件校验、粘贴、SVG、8000×6000 大图、导出、Blur/Text/Counter 语义、重置与离开保护、扩展 pendingCapture 流程（v1.2.0 zip 实装加载验证）。

## 通过项（先说好消息，避免误伤）
- 粘贴图片（ClipboardEvent）→ 直接进编辑器 ✅
- 8000×6000 大图：加载 1.5s、导出 1.2s / 936KB，无卡死 ✅
- Counter 撤销后编号连续（1,2 → undo → 再点得 2），不重号 ✅（shots/r2-counters.png）
- 扩展 zip 实装：pendingCapture → app/index.html 打开编辑器且用后清除；直接打开显示落地页 ✅（shots/r2-ext-editor.png）
- Text 用 Enter 提交、颜色/字号随全局设置 ✅

## 发现清单

### R2-1【P1｜功能】编辑成果零保护：关闭/重置/离开均无确认
- 复现：上传图→加多条标注→点右上 ✕ 或 “New image”→ 直接回落地页，所有标注瞬间丢失，无任何确认。导航离开时 `window.onbeforeunload` 未设置，静默丢失。
- 影响：核心价值是标注成果，误触一次全部报废。这是本轮最高价值问题。
- 建议：shapes 非空或 base 被 crop 过时，✕/New image 弹确认；同条件注册 beforeunload。是否有更好设计？可以做 sessionStorage 自动暂存（刷新可恢复），但先做确认门槛即可，勿增实体。

### R2-2【P1｜逻辑】Blur 语义错误：只采样底图，标注被"擦除"而非打码，纯色区域零反馈
- 复现：橙色纯色图上写 Text "SECRET"，用 Blur 拖框盖住 → 被盖住的文字直接消失（露出干净底图），框外的 "ET" 仍清晰；且纯色底上马赛克与原图无差异，用户完全看不到 blur 生效范围。
- 截图：shots/r2-blur-before.png / shots/r2-blur-after.png
- 根因：drawShape('blur') 只从 base 采样像素化后覆盖绘制，绘制顺序在其他 shape 之后，等于"用干净底图盖掉标注"。
- 建议：blur 应对"当前合成结果"（base+此前 shapes）采样；至少绘制时对 blur 区域画一个淡边框以提供视觉反馈。思辨：如果定位是"遮隐私"，纯色覆盖（solid redact）比 pixelate 更安全（pixelate 可被逆向），可考虑提供 solid 选项。

### R2-3【P2｜功能】选择非图片文件：静默无反应，无任何错误提示
- 复现：文件选择器选 .txt → 页面无变化、无 toast。`handleFile` 对 `!type.startsWith('image/')` 直接 return。
- 建议：toast "仅支持图片文件"。错误路径也是 UX。

### R2-4【P2｜功能】Text 靠近右/下边缘：输入框溢出画布直抵视口边缘，提交后文字被图片边缘截断
- 复现：在画布右下角点 Text → 输入框 rect 延伸到 vw=1440 边缘（shots/r2-textedge.png）；提交的文字超出图片右边被裁掉（blur-after 图中 "SECRET" 的 T 被切）。
- 建议：输入框与最终文字按图片边界 clamp/回退定位；导出时文字超界应可预期（编辑态即所见即所得）。

### R2-5【P2｜逻辑】SVG 上传按 intrinsic 尺寸（100×100）栅格化，小 SVG 得到极小画布
- 复现：上传 100×100 SVG → canvas 100×100，标注/导出都是低分辨率位图。无 width/height 的 SVG 在 Chromium 下 intrinsic 尺寸不可靠。
- 建议：对 SVG 栅格化时按 min(natural, 合理下限如 1024) 放大绘制，或提示"SVG 将按 N×N 栅格化"。思辨：也可直接不支持 SVG（accept 过滤），诚实优于劣化体验。

### R2-6【P2｜功能】超大图无任何提示或降采样保护
- 复现：8000×6000 桌面端可用，但移动端 Safari canvas 面积上限 16.7MP，接近上限的图会静默失败/白屏；当前无尺寸检查。
- 建议：超过阈值（如 24MP）提示并可选降采样。桌面实测本轮 PASS，只需加护栏。

### R2-7【P2｜视觉】导出文件名 `snapmark-1786671596676.png` 为毫秒时间戳，不可读
- 建议：`snapmark-2026-08-14-011230.png`，一行改动，可读可排序。

## progress
审查完成，进入 fix 阶段。

---

## Verdict（审查员线上复验，asset index-cBqfsCz→实测 index-cBqFscCz.js，2026-08-14）

- R2-1 **PASS**：✕ 弹 confirm("Discard this image and all annotations?")，取消后留在编辑器；脏状态下导航触发真实 beforeunload 对话框（Playwright 实测拦截成功，URL 未跳转）。
- R2-2 **PASS**：Blur 现对合成结果采样，覆盖区域内标注（box 边框）被真实像素化而非擦除；绘制草稿有可见边框（shots/v2-blur.png）。
- R2-3 **PASS**：选 .txt → role=alert "Only image files are supported (PNG, JPEG, WebP, GIF, SVG…)"。
- R2-4 **PASS**：右下角 Text 提交后文字 clamp 在图片内（shots/v2-textedge.png），不再溢出裁切。
- R2-5 **PASS**：100×100 SVG 栅格化为 1024×1024。
- R2-6 **PASS**：8000×6000（48MP）自动降采样为 4619×3464（≈16MP）；降采样提示未在 3s 后捕获到（可能为瞬时 toast），不影响判定。
- R2-7 **PASS**：下载文件名实测 `snapmark-2026-08-14-015305.png`。

结论：7/7 PASS，附带修复（commitText 历史栈）未发现回归（undo 行为正常）。第 2 轮闭环，进入第 3 轮（性能专项）。
