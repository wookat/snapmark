# R22 第 9 轮审查 — 无障碍专项（SnapMark）

审查员：user-experience-officer + qa-engineer + architect
日期：2026-08-14
方法：Lighthouse a11y 实测（落地页 0.93）+ 真浏览器键盘走查（Tab 序列、焦点、SR 语义）+ 源码核对（origin/main）

## 先说做对的（不折腾）
- 编辑器工具栏 24 个按钮全部有 aria-label（含快捷键提示），10 个工具带 aria-pressed 状态
- color/range 输入均有 aria-label；Tab 顺序符合视觉顺序，工具全部键盘可达
- 图片全有 alt；h1 唯一、标题层级正确；lang="en" 已声明
- 第 3 轮修过的对比度问题未回归（badge 等），本轮仅剩一处新增文案的对比度问题

## 发现清单

### R9-1【P2｜无障碍/视觉】对比表 warn 文案 amber-600 对白底对比度 3.19，低于 4.5:1
- 复现：Lighthouse color-contrast 唯一 fail：`span.text-amber-600`（14px 正文，#e17100 on #ffffff，3.19:1）。
- 影响：低视力用户读不清对比表中的警示条目（恰是转化关键信息「Lightshot 的缺点」）。
- 建议：换 amber-700/amber-800（或加深底色）达 4.5:1；图标可保持 amber-600（图形 3:1 即可）。

### R9-2【P2｜无障碍】toast/通知无 aria-live，屏幕阅读器完全感知不到操作反馈
- 复现：编辑器内 `showToast`（'PNG downloaded'、'Copied to clipboard'、'Selection too small to crop'、'Clipboard blocked' 等）渲染为普通 div；全页 `[aria-live],[role=status],[role=alert]` 计数为 0。落地页错误 notice 同样无语义。
- 影响：SR 用户执行复制/下载/裁剪后得不到任何结果反馈，错误提示（剪贴板被阻止）也静默——这是编辑器最核心的操作反馈通道。
- 建议：toast 容器加 `role="status"`（隐式 aria-live=polite）；落地页错误 notice 用 `role="alert"`。改动是纯属性级，一处容器即可覆盖所有 toast。

### R9-3【P2｜无障碍】canvas 无 role/aria-label，编辑区对 SR 是空白
- 复现：编辑器 `<canvas>` 无 role、无 aria-label。
- 影响：SR 用户 Tab 进编辑器只听到一排按钮，不知道中间是什么；画布类应用无法做到完全可访问，但至少应说明「这是标注画布，当前图像 W×H」。
- 思辨：给 canvas 做完整可访问替代（shadow DOM 子树逐 shape 描述）成本高且此产品受众极少用 SR 标注图像——否决；最小正确做法是 `role="img"` + 动态 aria-label（含当前尺寸/标注数），成本一行。
- 建议：`role="img"` + 动态 aria-label。

### R9-4【P2｜无障碍】落地页无 skip link，键盘用户每次要 Tab 过整条导航
- 复现：首个 Tab 落在 logo，无「Skip to content」链接；导航 6 个链接 + hero 按钮后才到主内容。
- 影响：键盘/SR 用户重复成本。单页站点影响有限，但实现成本一行。
- 建议：body 首个元素加视觉隐藏、聚焦时可见的 skip link 到 #main（main 元素需加 id）。

### R9-5【P2｜无障碍】工具栏无 role="toolbar" 分组语义
- 复现：编辑器按钮直接平铺，无 toolbar/group 语义；SR 播报为 24 个离散按钮，无「绘图工具/颜色/操作」分组。
- 思辨：完整 toolbar 模式（roving tabindex + 方向键导航）对 10 个工具是合理增强但非必须，当前 Tab 遍历可用——本条只要求分组语义（`role="toolbar"` + `aria-label` 三组），roving tabindex 由修改员自行判断是否顺手实现，不强制。
- 建议：三个功能区各加 `role="toolbar"`/`role="group"` + aria-label。

## progress
audit 完成，等待修改员 fix。

---

## Verdict（审查员线上复验，2026-08-14）

- R9-1 **PASS**：warn 文案实测为 text-amber-800（#92400e on #fff ≈6.9:1），图标保留 amber-600。
- R9-2 **PASS**：常驻 `[role=status]` 容器存在；Ctrl+C 后实测播报 "Copied to clipboard"。
- R9-3 **PASS**：canvas `role="img"`，aria-label 动态（1200×750 → 裁剪后实测 350×250）。
- R9-4 **PASS**：首个 Tab 聚焦 "Skip to content"（href=#main，absolute 浮现），#main 存在。
- R9-5 **PASS**：`role=toolbar` ×1 + 三个 `role=group`（Drawing tools / Color and stroke / Export and file actions）。

结论：5/5 PASS。第 9 轮闭环，进入第 10 轮（安全与滥用专项）。
