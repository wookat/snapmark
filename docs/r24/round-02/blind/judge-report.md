# 盲评报告（第 2 轮 · A/B/C 三款截图工具）

评审依据：blind2/ 下 11 张匿名截图 + 提供的 Lighthouse（移动模拟）实测数据。未访问任何网站或代码，未猜测产品身份。
（评审会话：https://app.devin.ai/sessions/e4a783cf62654ae38c55e04883e948a9 ，报告原文分 3 条消息输出，此处合并存档。）

## 1. 六维评分表

| 维度 | A | B | C | 胜者 |
|---|---|---|---|---|
| 视觉设计 | 9 | 8 | 5 | A |
| 信息层级 | 9 | 7 | 6 | A |
| 交互与流程顺滑度 | 9 | 6 | 6 | A |
| 功能完整度 | 8 | 9 | 5 | B |
| 性能实测 | 10 | 7 | 3 | A |
| 文案与信任感 | 9 | 7 | 5 | A |

## 2. 分维理由

### 视觉设计：A 9 / B 8 / C 5（胜者 A）
- A 首页（A-home-desktop/mobile）是干净的现代 SaaS 风格：蓝黑双色、清晰的 hero 排版、带 macOS 风格窗口的产品示意图，桌面与移动端视觉完全一致；编辑器暗色工作台（A-editor-desktop）画布居中、工具条整齐，观感专业。
- B 首页手写下划线装饰 + 大字 hero（B-home-desktop）同样有设计感，编辑器（B-editor-desktop）棋盘格透明背景、分组工具条也很专业；但 start 页（B-start-desktop）几乎是空白页配一个灰色卡片，与首页风格断裂。
- C（C-home-desktop/mobile）紫色底纹 + 粉色 Go 按钮 + emoji 手指，风格偏 2015 年代模板站；hero 图占位灰块巨大、上传卡片与背景对比生硬，整体精致度明显落后。

### 信息层级：A 9 / B 7 / C 6（胜者 A）
- A 首页一屏内完成「定位标语 → 一句话价值 → 双 CTA（Capture/Upload）→ 四个信任要点（Free forever/No account/No uploads/No watermark）→ 数据条（12 tools/0 uploads/$0/MV3）」，层级教科书式清晰；移动端折行后依然保持同样顺序。
- B 首页层级也清楚（标题→副标题→CTA→大幅产品截图），但副标题两行「annotation, markup tool / and multi-slides how to's tutorial editor」断句别扭，信息密度低；start 页只有上传卡片，缺乏引导上下文。
- C 把上传框、URL 输入、demo 链接都塞进一张卡片，功能入口尚算集中，但顶部巨大灰色 hero 占位块把真正的标题挤到第二屏（移动端尤甚），首屏信息利用率差。

### 交互与流程顺滑度：A 9 / B 6 / C 6（胜者 A）
- A 从首页即可 Capture/Upload/粘贴（Ctrl+V）/拖拽/试样例图五种方式进入，编辑器（A-editor-desktop/mobile）工具、颜色、粗细滑杆、Copy/Download 一屏可达；移动编辑器把工具网格化平铺，触控友好。
- B 需经首页 → start 上传页 → 编辑器三步；上传页移动版（B-editor-mobile）就是同一上传卡片，未针对小屏做额外优化；编辑器功能强但顶部双行工具栏在移动端必然拥挤（缺移动编辑器截图佐证顺滑度）。
- C 流程最短（首页即工作区，上传/URL 一步进入样式化），但 450ms TBT 与 0.285 CLS 意味着实际操作会卡顿、页面跳动，抵消了流程短的优势。

### 功能完整度：A 8 / B 9 / C 5（胜者 B）
- B 编辑器可见工具最全：Arrow/Line/Polyline/Ellipse/Rect/Highlight/Path/Blur/Spot/Zoom/Pin/Text/Note/Image/Crop/Background，另有 Add Slide/Duplicate Slide 多页教程、Publish 发布、Simple/Fancy 样式切换、缩放与画布尺寸显示（B-editor-desktop），能力面最广。
- A 有 12 个工具（Arrow/Box/Ellipse/Line/Pen/Highlight/Text/Counter/Blur/Magnify/Note/Crop）+ 调色板 + 粗细滑杆 + Copy/PNG 下载 + 浏览器扩展（MV3），覆盖核心标注场景，但无多页/发布能力。
- C 只见上传/URL 抓取 + 设备样机美化（Background: Image/Solid/Gradient/None），属于单一用途的 mockup 工具，截图中未见任何标注工具。

### 性能实测：A 10 / B 7 / C 3（胜者 A）
- A 四项满分（Perf/A11y/BP/SEO 均 100），FCP/LCP 1.0s、TBT 0ms、CLS 0.03，几乎无可挑剔。
- B Perf 84，LCP 3.9s、TBT 190ms 偏慢（首页大幅 hero 截图是主要嫌疑），但 A11y 96 / BP 100 / SEO 100 底子好。
- C Perf 56、A11y 83、BP 77，LCP 4.1s、TBT 450ms、CLS 0.285 全面落后；0.285 的 CLS 对上传类工具是实打实的误点风险。

### 文案与信任感：A 9 / B 7 / C 5（胜者 A）
- A 文案精准打隐私与免费痛点：「nothing ever leaves your device」「No uploads / No watermark / No account」，配「The maintained, private Lightshot alternative」定位语与 GitHub 链接，信任构建最完整。
- B 「Annotate any screenshot securely anywhere」清楚但泛；start 页「I don't trust you at this point. Let me use a test image」幽默却也暗示了用户的不信任场景，且页面未给出隐私承诺佐证。
- C 「Create beautiful mobile & browser screenshot mockups in seconds」直白，但无隐私/免费/数据处理说明，emoji 与过时视觉进一步削弱专业信任感。

## 3. 总分与总体胜者

| 产品 | 总分 (/60) |
|---|---|
| **A** | **54** |
| B | 44 |
| C | 30 |

**总体胜者：A。** 六维中五维领先：性能满分 + 隐私文案 + 桌面/移动一致体验；B 以功能广度取胜但性能与三步流程有短板；C 各维全面落后。

## 4. 各自最该改进的 3 件事

**A**
1. 补齐多图/多页与分享发布能力（对比 B 的 Add Slide/Publish），扩大教程类高级场景覆盖。
2. 首页 hero 示意图偏静态占位风格，可换成真实编辑器交互演示（GIF/视频）以更快传达能力。
3. 移动编辑器工具区占屏近半（A-editor-mobile），建议工具栏可折叠，把画布放到首屏更大区域。

**B**
1. 优化性能：LCP 3.9s、TBT 190ms，压缩/懒加载首页大幅 hero 截图，目标 Perf 90+。
2. 合并「首页 → start 上传页」为一步（首页直接支持粘贴/拖拽进编辑器），并给 start 页补充品牌与信任元素，消除风格断裂。
3. 补移动端编辑器适配：双行密集工具栏在小屏上需重排（分组折叠或底部工具条），并提供移动端体验证据。

**C**
1. 性能与稳定性第一优先：CLS 0.285 必须修（为 hero 图与卡片预留固定尺寸），削减 450ms TBT，目标 Perf 80+。
2. 视觉现代化：替换紫底纹/emoji/粉色按钮的模板感，去掉首屏巨大灰色占位块，让标题与上传区进首屏。
3. 补 A11y（83）与信任文案：修对比度与表单标签，并明确说明图片是否上传服务器、是否免费无水印。

（报告完）
