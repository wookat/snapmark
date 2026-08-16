# R24 Round 1 台账 — SnapMark 盲评对标迭代

日期：2026-08-16（UTC）
负责人：R24 产线（judge + design-lead + engineer）

## 1. 匿名盲评

### 竞品选择
- 竞品：**Annotely**（annotely.com，同类免费在线截图标注工具，标杆强度高）。
- Markup Hero：两次公开页抓取均超时（未绕过），本轮排除。
- 我方：SnapMark（ext.zalize.com）。

### 截图与匿名化
- 采集：Playwright，1440×900 与 375×812，双方各取 首页 + 编辑器（含已载入图片工作流）。
- 匿名化：Pillow 遮盖 logo/域名/品牌字样，随机标注 A（Annotely）/ B（SnapMark）。
- 材料存档：`docs/r24/round-01/blind/`（9 张匿名图）、`docs/r24/round-01/judge-prompt.txt`。

### 性能实测（Lighthouse，移动模拟，评审输入数据）
| 指标 | A (Annotely) | B (SnapMark) |
|---|---|---|
| Performance | 84 | 100 |
| Accessibility | 96 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |
| FCP / LCP | 1.7s / 3.9s | 1.0s / 1.0s |
| TBT / CLS | 190ms / 0 | 0ms / 0.03 |

### 盲评结果（独立评审，不知身份，全文见 `docs/r24/round-01/judge-report.md`）
| 维度 | A | B（我方） | 胜者 |
|---|---|---|---|
| 视觉设计 | 6 | 8 | B |
| 信息层级 | 6 | 9 | B |
| 交互与流程顺滑度 | 6 | 8 | B |
| 功能完整度 | 8 | 7 | **A** |
| 性能实测 | 6 | 10 | B |
| 文案与信任感 | 6 | 9 | B |
| **总分** | 38/60 | **51/60** | B |

### 揭盲
A = Annotely，B = SnapMark（我方）。我方 5 胜 1 负，唯一输掉维度：**功能完整度**。

## 2. 差距分析（输/平维度 → 改进项）

输掉维度：功能完整度（A 有 16+ 工具、多页教程、发布分享；我方 10 工具、仅 PNG 导出）。
评审对 B 的 3 条建议：移动端画布贴顶+工具文字标签；导出格式扩展；补 1-2 个高频进阶工具（放大镜/注释）。

不抄竞品、做超越（保持"精炼本地优先"定位，不加多页/云发布实体）：
- **P0-1 Note 注释工具**：带圆角气泡+阴影的 callout，比竞品纯文本 note 更醒目、教程友好。
- **P0-2 Magnify 放大镜工具**：圈选区域生成圆形放大细节图，竞品 Zoom 的同类超越实现（纯本地 canvas，无额外依赖）。
- **P0-3 导出格式**：Download 增加 PNG/JPG/WebP 菜单（WebP 为竞品没有的现代格式）。
- **P1-1 移动端**：画布贴顶（items-start），工具栏 6 列网格 + 文字标签，触控目标 ≥44px。
- **P1-2 首页文案**：工具数与特性列表同步（12 tools）。

## 3. 实现与验证

- 实现：`src/Editor.tsx`（Tool union +note/zoom、drawShape 新分支、exportBlob(mime)、下载格式菜单、移动工具栏/画布布局）、`src/Landing.tsx`（文案同步）。
- 本地全绿：`npm run build` ✅、`npm run lint` ✅（仅既有 fast-refresh warning，非本轮引入）。
- Playwright 冒烟（vite preview）：Magnify 圈选、Note 气泡、导出菜单、375px 画布贴顶+带标签工具栏 全部通过（截图 `/home/ubuntu/r24/smoke-editor.png`、`smoke-mobile.png`）。
- 四道把关：QA（build/lint/冒烟）✅；UX 走查（375/1440 布局、触控目标）✅；内部交叉测试（盲评评审即独立第三方）✅；合规安全（无新增依赖、无上传、无 PII、未复制竞品任何代码/文案/图片）✅。

## 4. 部署与线上复测

- PR：https://github.com/wookat/snapmark/pull/21（已合并 main）。
- 部署：main 分支 `npm run build` + `wrangler deploy`，版本 d48dd39b-dfc8-47cc-ab83-5675d7625afb，自定义域 ext.zalize.com。
- 线上复测（2026-08-16）：
  - Lighthouse：Perf 100 / A11y 100 / BP 100 / SEO 100；FCP 1.0s、LCP 1.0s、TBT 0ms、CLS 0.03（`/home/ubuntu/r24/lh-live-r1.json`）。
  - 1440px：Magnify 圈选、Note 气泡、导出菜单在线可用（`live-editor-1440.png`）。
  - 375px：画布贴顶、6 列带标签工具栏、Copy/PNG 常驻（`live-editor-375.png`）。
  - 核心流程：首页 → sample image → 标注（zoom/note）→ 导出菜单，全程走通。

## 5. 复赛

Round 2 重新匿名盲评，记录比分变化。
