# R22 第 6 轮审查 — 信息架构与文案专项（SnapMark / ext.zalize.com）

审查员：user-experience-officer + qa-engineer + architect
日期：2026-08-14
方法：1440px 与 375px（含无 getDisplayMedia 触屏模拟）生产环境走查：全页文案抽取、FAQ 展开、编辑器控件文案、锚点导航、比较表、外链行为。

## 先说做得好的（不重复挑）
- 移动端 CTA 已自适应：无捕获能力时 hero 与底部 CTA 均变为「Upload image」，无死按钮 ✅
- 信息架构清晰：hero → 数据条 → 三大卖点 → 功能网格 → 对比表 → 扩展 → FAQ → CTA，锚点导航齐全 ✅
- 免责声明（非 Lightshot 关联）、「Chrome Web Store listing pending」的诚实文案 ✅
- 标题/meta description 与页面主张一致 ✅

## 发现清单

### R6-1【P2｜文案】触屏设备仍看到两处「Ctrl+V」文案（R4 遗留项，正式立项）
- 复现：375px 触屏模拟 → 「Capture, paste or drop」段正文「paste from the clipboard with Ctrl+V」及卡片「Paste with Ctrl+V」均可见（body 内共 3 处 Ctrl+V）。
- 影响：手机用户没有 Ctrl 键，营销文案与设备能力错位，削弱「works great on mobile」的可信度。
- 建议：营销区与 hero 采用同一 coarse-pointer 策略，或改为设备中立措辞「Paste from clipboard」。思辨：与其按设备切换文案增加分支，不如统一中立措辞，一处收敛（如无必要勿增实体）。

### R6-2【P2｜文案】FAQ「Can I capture a specific area?」答案在移动端不成立，且回避了真实问题
- 现状：「Capture your screen, then use the Crop tool…」。移动端根本没有 Capture；且 Lightshot 用户问的是"捕获时框选区域"，答案应先明确「不支持捕获时框选，捕获后用 Crop 达到同样效果」。
- 建议：改为诚实直答 + 覆盖移动端（"On mobile, upload or paste, then crop"）。

### R6-3【P2｜功能/IA】编辑器唯一的退出/新建入口是右上角「✕」图标，语义歧义且无品牌回链
- 复现：进入编辑器（shots/r6-editor-1440.png）：无 SnapMark 标识；「New image」的可视符号是 ✕（通常语义=关闭/丢弃）。扩展用户直接落入编辑器，全程见不到产品名与官网入口。
- 建议：✕ 旁加「New」文字标签或改用 + 图标；工具栏左侧放 mini logo（点击=New image 同一确认流程），一石二鸟解决品牌与语义问题。

### R6-4【P2｜视觉/IA】375px 对比表横向溢出（560px 内容 / 343px 容器）依赖滚动但无任何滚动暗示
- 复现：移动端「Why switch from Lightshot?」表格需横滑才能看到 Lightshot 列——恰恰是卖点所在的一列默认不可见。
- 建议：移动端改为堆叠卡片（每行 feature：SnapMark ✓ / Lightshot ✗ 两行）或至少加渐隐边缘提示可滑。思辨：对比表是转化关键组件，值得为小屏做一次真正的响应式重排，而非依赖用户发现隐藏内容。

### R6-5【P2｜IA】外链行为不一致：GitHub 链接 target=_blank + noreferrer，但页脚 ZALIZE 四个产品链接同窗口打开
- 复现：qr/prompter/pdf/scribe.zalize.com 链接 target=null。若用户编辑到一半点了页脚（编辑器与落地页同 SPA），有 beforeunload 保护但体验仍是打断。
- 建议：所有外站链接统一 `target="_blank" rel="noreferrer"`，一条规则收敛。

## progress
审查完成（5×P2，无 P0/P1），进入 fix 阶段。

---

## Verdict（审查员线上复验，2026-08-14）

- R6-1 **PASS**：375px 触屏 body 内 Ctrl+V 出现 0 次；桌面 hero kbd 提示仍在。
- R6-2 **PASS**：FAQ 答案改为「Not at capture time — …use the Crop tool…On mobile, upload or paste…」，直答且覆盖移动端。
- R6-3 **PASS**：编辑器工具栏出现 SnapMark logo 与「New image」按钮；有标注时点 logo 弹确认，确认后回落地页（shots/v6-editor.png）。
- R6-4 **PASS**：375px `scrollWidth=375` 无横向溢出，表格隐藏、堆叠卡片渲染且「Uploaded to prnt.sc」等 Lightshot 列内容默认可见（shots/v6-mobile-compare2.png）；桌面表格正常。
- R6-5 **PASS**：页脚 4 个 ZALIZE 链接均 `_blank` + `noreferrer`。

结论：5/5 PASS。第 6 轮闭环，进入第 7 轮（代码架构与耦合专项）。
