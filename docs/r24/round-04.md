# R24 Round 4（最终轮）— 盲评对标迭代台账 + 最终对比

## 1. 竞品与材料采集

- 竞品：Photopea（photopea.com）、Annotely（annotely.com）。
- SnapMark 截图为第 3 轮改进（多页标注 + 移动折叠）部署上线后（版本 `7d8f71ff-0aeb-4dec-ac34-e15509a35c3e`）的线上实拍：首页 1440/375、编辑器 1440（含 2 页页条 + 标注）、编辑器 375（工具栏默认折叠）。
- 竞品截图沿用本轮周期内（2026-08-16）的一手采集（Playwright，DPR 2），未复用任何竞品资产。

## 2. 匿名化与随机映射（第 4 轮重新随机）

| 标签 | 实际产品 |
|---|---|
| A | Photopea |
| B | Annotely |
| C | **SnapMark（我方）** |

- 匿名材料：`docs/r24/round-04/blind/`（10 张 A/B/C 截图 + `judge-prompt.txt`）。
- Lighthouse（移动模拟，提供给评审的实测数据）：
  - A（Photopea）：Perf 100 / A11y 89 / BP 100 / SEO 100；FCP 0.8s，LCP 1.2s，TBT 0ms。
  - B（Annotely）：Perf 84 / A11y 96 / BP 100 / SEO 100；FCP 1.7s，LCP 3.9s，TBT 190ms。
  - C（SnapMark，本轮部署后实测）：Perf 100 / A11y 100 / BP 100 / SEO 100；FCP 1.0s，LCP 1.0s，TBT 10ms，CLS 0.03。

## 3. 盲评结果（原始报告：`round-04/blind/judge-report.md`）

| 维度 | A=Photopea | B=Annotely | C=SnapMark | 胜者 |
|---|---:|---:|---:|---|
| 视觉设计 | 6 | 8 | 9 | C |
| 信息层级 | 6 | 7 | 9 | C |
| 交互与流程顺滑度 | 7 | 7 | 9 | C |
| 功能完整度 | 10 | 9 | 9 | A |
| 性能实测 | 9 | 7 | 10 | C |
| 文案与信任感 | 6 | 7 | 9 | C |
| **总分** | **44/60** | **45/60** | **55/60** | **C（SnapMark）** |

## 4. 四轮六维比分曲线（SnapMark）

| 维度 | R1 | R2 | R3 | R4 |
|---|---:|---:|---:|---:|
| 视觉设计 | 9 | 9 | 9 | 9 |
| 信息层级 | 9 | 9 | 9 | 9 |
| 交互与流程顺滑度 | 8 | 9 | 9 | 9 |
| 功能完整度 | 7 | 8 | 8 | 9 |
| 性能实测 | 9 | 10 | 10 | 10 |
| 文案与信任感 | 9 | 9 | 9 | 9 |
| **总分** | **51** | **54** | **54** | **55** |

竞品总分曲线：Annotely 38 → 44 → 43 → 45；Screenshot.rocks 30（R2）；Photopea 44（R3）→ 44（R4）。
SnapMark 四轮均为总分第一，且第 4 轮六维中五维单项第一。

## 5. 剩余差距与理由

- 唯一未夺维度：功能完整度 9 vs Photopea 10（R1 时为 7，经 Note/Magnify/多格式导出、Web Share、多页标注三批改进已从 -2 收敛到 -1）。
- 理由：Photopea 是完整 Photoshop 级图像编辑器（全菜单、PSD/AI/RAW 多格式、图层/滤镜/AI 生成）。SnapMark 定位是「本地、快速、无账号」的截图标注工具，补齐该差距需要变成通用图像编辑器，违背产品定位与隐私模型（0 uploads），属于不应追赶的差距；在「标注工具面」上我方已与 Annotely 持平（9 vs 9）。
- 评审对 C 的后续建议（转入日常迭代 backlog，不在本 R24 范围强做）：链接分享/发布、多页重排/复制/PDF 打包导出、首页真实交互演示 + CLS 收敛到 0。

## 6. 材料与证据

- 盲评材料：`docs/r24/round-04/blind/`；评审会话（独立、不知身份）：https://app.devin.ai/sessions/e4a783cf62654ae38c55e04883e948a9
- 本轮无新的代码改动（第 3 轮改进已上线并在本轮验证有效：功能完整度 8→9、总分 54→55）。
- 全部 PR：#21、#22（R1）、#23（R2）、#24（R3）。
- 线上：https://ext.zalize.com（Cloudflare Workers，版本 `7d8f71ff-0aeb-4dec-ac34-e15509a35c3e`）。
