# R22 第 4 轮审查 — 移动端专项（SnapMark / ext.zalize.com）

审查员：user-experience-officer + qa-engineer + architect
日期：2026-08-14
方法：真实浏览器 375×667 @2x iPhone UA + 触摸事件（CDP dispatchTouchEvent）实测：落地页走查、编辑器触摸绘制、滚动干扰、点按目标尺寸、文本输入焦点行为。

## 通过项
- 落地页 375px 无横向滚动，排版层级清晰（shots/m4-01-hero.png）。
- 触摸拖拽绘制 Box 正常，绘制时页面不滚动（touch-action 正确）。
- 竖向触摸画线不引发页面滚动 ✅。
- 桌面端第 3 轮结论（redraw 性能）在触摸绘制下同样流畅。

## 发现清单

### R4-1【P1｜视觉/功能】375px 编辑器布局严重失衡：工具栏区占据视口上方约 46%（~306px），画布被压到下半屏仅 351×219，且上下均有大片黑色空区
- 复现：手机打开 sample → 编辑器。截图 shots/m4-03-editor.png：工具行、颜色行、按钮行行距过大，Crop 图标孤行换行（第 1 行 9 个工具 + 第 2 行仅 1 个孤儿图标）。
- 影响：移动端核心操作面积不足 1/3 屏，标注精度差；这是第 1 轮 A4 遗留问题的实证深化。
- 建议：a) 工具栏压缩为两行紧凑网格（gap-1、去掉多余 padding），Crop 不孤行；b) 画布区 flex-1 填满剩余空间并居中；c) 或参考移动标注类 app 把工具栏移至底部（拇指热区）。思辨：底部工具栏是移动端更优范式（单手可达），但改动大；本轮至少做 a+b 消除空间浪费。

### R4-2【P2｜功能】移动端 Text 输入框 font-size 11.1px：iOS Safari 聚焦时会强制放大页面（自动 zoom），破坏编辑视野
- 复现：Text 工具点画布，computed font-size=11.115px（随画布缩放比例缩小）。iOS 对 <16px 输入聚焦自动 zoom 是既定行为。
- 建议：输入框 CSS font-size 固定 ≥16px，仅提交后按画布比例绘制；输入框视觉大小与最终字号解耦。

### R4-3【P2｜视觉/无障碍】触摸目标偏小：颜色swatch 20×20、Undo/Redo 24×32、页脚链接高 16px，低于 44×44（Apple HIG）/48×48（Material）
- 实测清单见审查脚本输出；工具按钮 36×36 勉强（>24 WCAG 最低），颜色与撤销/重做是高频操作，误触率高。
- 建议：移动断点下 swatch ≥32px、Undo/Redo 提升点击区（padding 扩大），页脚链接 py-2。

### R4-4【P2｜文案】移动端落地页仍显示「paste with Ctrl+V」快捷键提示，触摸设备无意义
- 建议：触摸设备（`(pointer: coarse)` 或无键盘）隐藏该行或改为「长按粘贴」措辞。

### R4-5【P2｜逻辑】移动端「Copy」按钮未按能力探测：iOS Safari 的 `navigator.clipboard.write(ClipboardItem)` 需要用户手势同步调用，异步 toBlob 后写剪贴板在 Safari 会被拒
- 代码：exportBlob().then(写剪贴板) 为异步链，Safari 判定失去 user gesture。Chromium 模拟无法完全复现 Safari 行为，此条为代码审查推断（标注：未在真机 iOS 验证）。
- 建议：Safari 路径用 `ClipboardItem(promise)` 形式（Safari 支持 promise-based ClipboardItem）同步构造；或失败时降级提示改用 Download。

## progress
审查完成（1×P1 + 4×P2），进入 fix 阶段。

---

## Verdict（审查员线上复验，asset index-CseSzqdH.js，375×667 触摸仿真，2026-08-14）

- R4-1 **PASS**：工具栏 2×5 网格，Crop 不再孤行且可见；工具栏高度 306px → 169px（实测画布上沿以上为工具栏+居中留白）。画布 351×219 为 1200×750 图像等比结果，居中合理（shots/v4-editor.png）。
- R4-2 **PASS**：Text 输入框 computed font-size 实测 16px。
- R4-3 **PASS**：全页按钮扫描无 <32px 触摸目标（颜色 swatch 32px、Undo/Redo/✕ 36px）。
- R4-4 **PASS（带遗留）**：hero 的 Ctrl+V 提示在 pointer:coarse 下已隐藏；但 Features 区卡片标题「Paste with Ctrl+V」在触摸设备仍可见——属营销文案非操作提示，不改判 FAIL，转入第 6 轮（信息架构与文案）待处理。
- R4-5 **PASS（代码级）**：copy() 已改为手势内同步构造 ClipboardItem(Promise<Blob>)；Chrome 生产实测正常，Safari 真机不可及维持"留待真机抽验"标注。

结论：5/5 PASS（1 项带遗留转第 6 轮）。第 4 轮闭环，进入第 5 轮（错误路径与边界专项）。
