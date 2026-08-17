# R24 第 2 轮台账（盲评复赛 → 差距分析 → 实现与部署）

日期：2026-08-16 / 2026-08-17（UTC）

## 1. 匿名盲评（复赛）

- 竞品：Annotely（annotely.com）、Screenshot.rocks（screenshot.rocks）。Markup Hero 公开页持续导航超时，按规则不绕过，继续排除。
- 截图：Playwright（deviceScaleFactor=2），SnapMark 与 Annotely 各取首页/编辑器 × 1440/375，Screenshot.rocks 取首页 × 1440/375（其首页即工作区），共 11 张，存 `round-02/blind/`。
- 匿名化：Pillow 遮盖 logo/域名/品牌字样，随机标注 A/B/C。映射（评审不知情）：**A = SnapMark，B = Annotely，C = Screenshot.rocks**。
- 性能实测（Lighthouse 移动模拟，作为盲评材料提供）：
  - SnapMark：Perf 100 / A11y 100 / BP 100 / SEO 100；FCP 1.0s，LCP 1.0s，TBT 0ms，CLS 0.03
  - Annotely：Perf 84 / A11y 96 / BP 100 / SEO 100；FCP 1.7s，LCP 3.9s，TBT 190ms，CLS 0
  - Screenshot.rocks：Perf 56 / A11y 83 / BP 77 / SEO 100；FCP 2.8s，LCP 4.1s，TBT 450ms，CLS 0.285
- 独立评审：不知情子会话 https://app.devin.ai/sessions/e4a783cf62654ae38c55e04883e948a9 ，仅凭匿名截图+性能数据评分。原始报告全文见 `round-02/blind/judge-report.md`。

### 比分（第 2 轮）

| 维度 | A=SnapMark | B=Annotely | C=Screenshot.rocks | 胜者 |
|---|---|---|---|---|
| 视觉设计 | 9 | 8 | 5 | SnapMark |
| 信息层级 | 9 | 7 | 6 | SnapMark |
| 交互与流程顺滑度 | 9 | 6 | 6 | SnapMark |
| 功能完整度 | 8 | 9 | 5 | Annotely |
| 性能实测 | 10 | 7 | 3 | SnapMark |
| 文案与信任感 | 9 | 7 | 5 | SnapMark |
| **总分** | **54/60** | 44/60 | 30/60 | **SnapMark** |

### 与第 1 轮比分变化（vs Annotely）

| 维度 | R1 我方 | R2 我方 | R1 Annotely | R2 Annotely |
|---|---|---|---|---|
| 视觉设计 | 8 | 9 | 6 | 8 |
| 信息层级 | 9 | 9 | 6 | 7 |
| 交互与流程 | 8 | 9 | 6 | 6 |
| 功能完整度 | 7 | 8 | 8 | 9 |
| 性能实测 | 10 | 10 | 6 | 7 |
| 文案与信任感 | 9 | 9 | 6 | 7 |
| 总分 | 51 | 54 | 38 | 44 |

第 1 轮实现的 Note/Magnify/多格式导出/移动端工具标签把功能完整度从 7 提到 8，总分 51→54，但功能完整度仍输 Annotely（其多页 slide + Publish 发布能力面最广）。

## 2. 差距分析（揭盲后）

输/平维度：仅「功能完整度」8 vs 9（Annotely 胜）。评审对 A（我方）的 3 条建议：①分享/发布能力 ②首页 hero 更真实 ③移动端工具栏可折叠。

超越式改进（不抄 Annotely 的云端 Publish，坚持本地隐私模型）：

- **P0 分享能力（对标 Publish 的隐私优先替代）**：接入 Web Share API（`navigator.share` + files），一键把标注图分享到系统分享面板（微信/邮件/AirDrop 等），图片全程不上传我方服务器——比 Annotely 的云发布更符合我们「nothing ever leaves your device」的信任主张。桌面/无 canShare 环境自动隐藏按钮（渐进增强）。
- **P0 移动端工具栏可折叠**：375px 下工具区占屏近半；新增折叠开关（显示当前工具图标+名称），折叠后画布获得更大首屏面积。桌面端不受影响。
- P1（延后到第 3 轮评估）：多页/slide 教程能力、首页 hero 动态演示——实体较大，先验证本轮改动的比分效果再决定。

## 3. 实现与验证

分支 `r24-round-02`（自 main f6da5a2 拉出）。改动 `src/Editor.tsx`：

- `share()`：`exportBlob()` → `File` → `navigator.canShare({files})` 检查 → `navigator.share({files})`；成功 toast「Shared」，取消不报错；不支持时按钮不渲染。
- 工具栏折叠：`toolsOpen` 状态 + `sm:hidden` 折叠按钮（aria-expanded，显示当前工具 icon/label + ▴/▾），折叠时工具网格 `hidden`，桌面端 `sm:flex` 始终展开。

本地验证：

- `npm run build` ✅；`npm run lint` ✅（仅既有 warning react(only-export-components)）。
- Playwright（vite preview 4173）：375px 折叠开关可见→点击后工具网格隐藏→再点恢复 ✅；1440px 折叠开关隐藏、工具组常显 ✅。截图 r2-mobile-open/collapsed、r2-desktop。
- Share 按钮：headless Chromium 无 `navigator.canShare`，按钮按设计不渲染（渐进增强路径验证）；真机移动浏览器（支持 canShare）才显示，线上复测时以移动 UA 验证。

## 4. PR / 部署 / 线上复测

- PR：https://github.com/wookat/snapmark/pull/23（已合并 main）。
- 部署：main 分支 `npx wrangler deploy`，版本 `c61b50a2-c018-406e-9759-9126113a6351`，域名 ext.zalize.com。
- 线上复测（Playwright）：
  - 375px：折叠开关可见→折叠后工具网格隐藏 ✅；画一条箭头→PNG 下载成功 ✅（live2-editor-375 / -collapsed 截图）。
  - 1440px：折叠开关隐藏、工具栏完整 ✅（live2-editor-1440 截图）。
  - Share：无 `canShare` 环境按钮不渲染 ✅；注入 `canShare/share`（模拟移动浏览器）后按钮出现、点击后 toast「Shared」 ✅（live2-share-375 截图）。
  - Lighthouse（移动模拟）：Perf 100 / A11y 100 / BP 100 / SEO 100；FCP 1.0s，LCP 1.0s，TBT 0ms，CLS 0.03。

第 3 轮：重新匿名盲评（考虑纳入更强标杆），针对功能完整度残余差距（多页/教程场景）评估 P1。
