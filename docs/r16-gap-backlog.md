# R16 自审与差距 Backlog（ext 线 / SnapMark）

日期：2026-08-07 · 方法：线上实测（https://ext.zalize.com，1440px+375px 全页截图）+ Lighthouse + 代码审计。

## 站点清单

- **页面（2）**：① 落地页 `/`（SPA 首屏）② 编辑器视图（同路由，上传/截图后切换）。Worker 附加路由：`/api/track`、`/api/stats`、`/robots.txt`、`/sitemap.xml`、IndexNow key。
- **组件（落地页 11 + 编辑器 6 = 17）**：Header、Hero(拖放区)、EditorMockup、Stats band、交替功能区块×3、小功能宫格(8 卡)、对比表、扩展区块、FAQ、CTA band、Footer；编辑器：工具栏、色板、粗细滑杆、Undo/Redo、导出按钮组、画布+文本输入+Toast。

## 技术基线（2026-08-07 实测）

| 项 | 结果 |
|---|---|
| Lighthouse | Perf **100** / A11y **93** / BP **100** / SEO **100**（LCP 1.2s、CLS 0、TBT 10ms） |
| A11y 失分 | `color-contrast`（zinc-400 文本）、`td-has-header`（对比表首列空表头） |
| 375px | 单列正常、无横向滚动（实测截图 OK） |
| 全路由 | `/`、robots、sitemap、api/stats 均 200 |
| SEO 结构 | title/desc/canonical/JSON-LD(WebApplication+FAQPage) 齐全；**缺 og:image / twitter card** |

## 差距打分（对照 r16-competitor-advantages.md 12 条优点）

按 主要矛盾（最伤转化/留存/收录）排序：

| 优先级 | 差距 | 伤害 | 来源优点 |
|---|---|---|---|
| **P0-1** | 编辑器无 **计数器（步骤编号）工具** | 留存：教程场景刚需，竞品（Flameshot/CleanShot）标配，缺失=用户回流竞品 | #1 |
| **P0-2** | 编辑器无 **荧光笔（highlight）** | 留存：文本标记高频，矩形框遮字体验差 | #2 |
| **P0-3** | 编辑器 **无键盘快捷键**（工具切换） | 留存：pro 用户效率；竞品编辑器（excalidraw/tldraw）全有 | #3 |
| **P0-4** | **无 og:image/twitter card** | 分发：社交分享无卡片图=白白流失免费流量 | #6 |
| **P0-5** | 首页 **无 demo 一键试用**，必须先有截图才能体验编辑器 | 转化：第一跳门槛，screenshot.rocks 已验证 demo 链接有效 | #5 |
| **P1-1** | 色板仅 8 固定色，无自定义取色 | 留存：品牌色标注做不了 | #4 |
| **P1-2** | a11y `color-contrast`（zinc-400）+ `td-has-header` | 收录/合规：Lighthouse a11y 93→100 | 技术审计 |
| **P1-3** | 编辑器 tooltip 无快捷键提示 | 留存：快捷键可发现性 | #3/#7 |
| P2-1 | 功能区块用 mock 图而非真实录屏 GIF | 转化（中） | #10 |
| P2-2 | 无真实社会证明（用户数/评分） | 转化（中）：依赖 Web Store 上架后数据，暂用开源可验证替代 | #9 |
| P2-3 | 无标注对象的选中/移动/删除（对象模型） | 留存（大但工程量大）：excalidraw 级能力，下轮立项评估 | #3/#4 |
| P2-4 | 导出仅 PNG（无 JPEG/WebP、无倍率） | 留存（低频） | #1 CleanShot |

## 本轮（R16）执行范围

P0-1…P0-5 + P1-1…P1-3 全部实现并部署上线；P2 留下轮。

## 否定之否定（对 R14/R15 的检验）

- **正题（R14）**：把落地页对齐 CleanShot 设计规范，假设「落地页现代化=转化提升」。
- **反题（本轮实测）**：落地页四项 Lighthouse 已到顶（100/93/100/100），但线上统计 visit=15、capture=3、copy=1 —— 到站流量本身极小且编辑器功能薄，落地页继续打磨的边际收益≈0。**R14 的「继续磨落地页」路线被否定**：主要矛盾已从「门面」转移到「工具本体能力 + 分发」。
- **合题（R16）**：编辑器补齐竞品标配能力（counter/highlight/快捷键/自定义色）+ 分发补洞（og:image、demo 即试）；上线后以 /api/stats 的 capture/copy/download 行为数据再检验。
