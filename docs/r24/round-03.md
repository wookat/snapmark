# R24 Round 3 — 盲评对标迭代台账

## 1. 竞品与材料采集

- 竞品：Annotely（annotely.com，连续第 3 轮基准）、Photopea（photopea.com，本轮新增强标杆——完整浏览器图像编辑器的标注流）。
- 采集时间：2026-08-16（UTC），Playwright（Chromium，DPR 2），尺寸 1440×900 与 375×812。
- 覆盖页面：三款产品的首页、核心编辑器/工作台、移动 375px 视图（Photopea 桌面工作台经点击「Start using Photopea」进入，未绕过任何登录/反爬）。
- 原始截图：会话工作区 `~/r24/shots3/`；匿名化脚本 `~/r24/anon3.py`（Pillow 遮罩 logo/域名/品牌字样/广告区）。

## 2. 匿名化与随机映射（第 3 轮重新随机）

| 标签 | 实际产品 |
|---|---|
| A | Annotely |
| B | **SnapMark（我方）** |
| C | Photopea |

- 匿名材料：`docs/r24/round-03/blind/`（11 张 A/B/C 截图 + `judge-prompt.txt`）。
- 提示词明确：标签与上一轮无对应关系，禁止沿用上一轮推断；评审不得访问网站/仓库/代码。
- Lighthouse（移动模拟，提供给评审的实测数据）：
  - A（Annotely）：Perf 84 / A11y 96 / BP 100 / SEO 100；FCP 1.7s，LCP 3.9s，TBT 190ms。
  - B（SnapMark）：Perf 100 / A11y 100 / BP 100 / SEO 100；FCP 1.0s，LCP 1.0s，TBT 0ms。
  - C（Photopea）：Perf 100 / A11y 89 / BP 100 / SEO 100；FCP 0.8s，LCP 1.2s，TBT 0ms。

## 3. 盲评结果（原始报告：`round-03/blind/judge-report.md`）

| 维度 | A=Annotely | B=SnapMark | C=Photopea | 胜者 |
|---|---:|---:|---:|---|
| 视觉设计 | 8 | 9 | 6 | B |
| 信息层级 | 7 | 9 | 6 | B |
| 交互与流程顺滑度 | 5 | 9 | 7 | B |
| 功能完整度 | 9 | 8 | 10 | C |
| 性能实测 | 7 | 10 | 9 | B |
| 文案与信任感 | 7 | 9 | 6 | B |
| **总分** | **43/60** | **54/60** | **44/60** | **B（SnapMark）** |

三轮分数曲线（SnapMark）：R1 51/60 → R2 54/60 → R3 54/60（竞品从 Annotely 38→44→43，新增 Photopea 44）。

## 4. 揭盲与差距分析

- 我方唯一落败维度仍是「功能完整度」（8 vs Photopea 10、Annotely 9）。
- 评审注：A 的上传/开始页 404 属于 Annotely，与我方无关。
- Photopea 的优势是完整 Photoshop 级工作台（图层/滤镜/云盘/模板）——与 SnapMark「本地、快速、无账号标注」定位不同，不应照抄；应在教程/多图工作流上做本地优先的超越。
- 评审对 B 的三条建议中，「移动工具栏可折叠」「分享能力」已在 R2 落地（Web Share + 折叠开关）；剩余真实差距 = 多页/教程工作流。

### 改进项

- **P0 多页标注（本地）**：一次会话内标注多张图（教程/步骤场景），页条切换、每页独立撤销历史、一键导出全部页 PNG。全部本地内存完成，零上传——比竞品云端 Publish 更符合隐私模型。
- **P1 移动端工具栏默认折叠**：375px 首屏画布占比更大（评审曾指出工具区占屏近半）。
- **P1 首页文案**：feature 列表加入多页能力表述（不复制竞品文案）。

## 5. 实现（分支 `r24-round-03`）

- `src/Editor.tsx`：
  - 新增 `PageState { base, shapes, history, redoStack }`；`pages` + `pageIdx` 状态；切页时快照当前页、载入目标页。
  - 工具栏「⧉ Page」按钮 + 隐藏 file input 添加新页；>1 页时显示页条（role=tablist，页码 + Page N of M）。
  - 导出菜单在多页时新增「All N pages (PNG)」逐页导出（`-p1/-p2` 文件名后缀）。
  - `exportPageBlob` 抽象按页导出（尺寸取自各页 base）。
  - 移动端 `toolsOpen` 初始值改为 `window.innerWidth >= 640`（375px 默认折叠）。
- `src/Landing.tsx`：feature 列表加入 “Multi-page: annotate a whole tutorial, export every page at once”。

## 6. 本地验证

- `npm run build` ✅（prerender 正常）；`npm run lint` ✅（仅既有 fast-refresh warning）。
- Playwright smoke（`~/r24/smoke3.py`，vite preview）：
  - 页 1 画箭头 → 添加页 2（375 截图）→ 页条出现、Page 2 of 2 ✅
  - 页 2 画标注 → 切回页 1（1200×750，1 annotation）→ 切回页 2（750×1400，1 annotation），每页状态独立 ✅
  - Download all → `…-p1.png`、`…-p2.png` 两个下载 ✅
  - 375px：工具栏默认折叠、点开关展开正常 ✅

## 7. PR / 部署 / 线上复测

（PR 合并与部署后回填。）
