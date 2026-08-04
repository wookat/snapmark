# R14 竞品对标拆解 — SnapMark (ext.zalize.com)

日期：2026-08-04 · 方法：浏览器实测（1440px / 375px 全页截图 + computed-style 抽取）

## 选定竞品

| 竞品 | 理由 | 定位 |
|---|---|---|
| **CleanShot X**（cleanshot.com） | 公认截图工具官网设计天花板；Mac 付费产品，官网转化率极高 | 设计规范主要对标对象 |
| **Lightshot**（prnt.sc） | 2M+ 用户的直接竞品（我们即其替代品）；官网停留在 2010s 风格 | 功能/口碑对比对象 |
| 参考：Awesome Screenshot / Flameshot | 辅助验证信息架构 | — |

## CleanShot X 设计规范拆解（实测 computed styles）

### 排版
- 字体：`Inter, "Inter UI", "SF Pro Display", ...`（与我们一致，保留）
- H1/H2：**48px / 700 / line-height 60px**，纯黑 `rgb(0,0,0)`
- 正文 16px/400；按钮文字 14px/700
- 标题短句化（"Quick Access" / "Annotate" / "Scrolling capture"），每节一个动词性短标题 + 2–3 行说明

### 配色
- **浅色主题**：白底黑字（我们旧版是深色主题——竞品级产品站以浅色为主）
- 主色：**#0669FF**（品牌蓝），按钮纯蓝底白字
- 辅助：浅灰分区背景（近 #F5F7FA）、大量留白

### 组件样式
- 按钮：**全圆角 pill（radius 20px）**、蓝底白字、粗体小字号
- 卡片：大圆角（16–24px）、浅灰底或白底+浅边框，无重阴影
- 产品截图/演示图是页面主视觉，每个功能区块配一张

### 信息架构（首页从上到下）
1. 极简 header（logo + 3 链接 + 主 CTA pill）
2. Hero：左文右图，badge + H1 + 副文案 + 双 CTA + 社会证明（用户评价头像）
3. 「7 apps in one / 50+ features」数字卖点带
4. **交替式功能区块 ×9**（图文左右交替：Quick Access、Annotate、Cloud、Scrolling、Recording、Background、OCR、Pin、Hide icons）
5. 小功能宫格（icon + 标题 + 一句话）
6. Feedback（用户评价卡片）
7. 大 CTA 色带（深底白字 + pill 按钮）
8. 邮件订阅 + 多列 footer

### 移动端（375px 实测）
- 单列堆叠，图片满宽，标题降到 ~32px，CTA 满宽；无横向滚动

### SEO 结构
- title 品牌+品类；meta description 完整卖点；语义化 h1→h2 层级；每功能区块一个 h2

## Lightshot（prnt.sc）拆解
- 2010s 风格：灰底、渐变按钮、Twitter 时间线挂件；无移动端优化
- 核心流程：上传→生成公开链接（隐私弱点，图片公开可遍历）
- 扩展 2024-07 后停更、仍是 MV2；近期评论大量反馈截图空白

## 差距诊断（旧版 SnapMark vs CleanShot 级标准）

| 维度 | 旧版问题 | 复刻动作 |
|---|---|---|
| 主题 | 深色、偏"开发者 demo"感 | 改浅色产品站主题，白底 + #0669FF 主蓝 |
| Hero | 居中堆叠、无产品视觉 | 左文右"编辑器实景"视觉 + 双 CTA + 信任行 |
| 功能展示 | 4 个纯文字卡片 | 交替式图文功能区块（CleanShot 式）+ 小功能宫格 |
| 组件 | 圆角矩形按钮 | pill 按钮、大圆角卡片、浅阴影 |
| 结构 | 无 FAQ、无大 CTA 带、footer 单段 | 补 FAQ（含 FAQPage JSON-LD）、CTA 色带、多列 footer |
| SEO | 单 h1 结构可 | 保留并加 FAQPage 结构化数据 |

## 比竞品更好的点（差异化清单）
1. **免装即用**：网页版直接截图/标注，CleanShot 要买+装、Lightshot 要装扩展
2. **隐私**：100% 本地处理，Lightshot 上传 prnt.sc 且可公开遍历；CleanShot Cloud 也走服务器
3. **免费无账号无水印**：CleanShot $29 起
4. **跨平台**：Web 任何系统可用；CleanShot 仅 Mac
5. **移动端可用**：竞品工具类均无移动端；我们 375px 全流程可用
6. **MV3 扩展 + 持续维护**：Lightshot 停更 MV2

截图证据：`docs/benchmark/`（本地生成，PR 描述内嵌）。
