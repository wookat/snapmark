# R16 竞品研究 — 值得学的优点清单（ext 线 / SnapMark）

日期：2026-08-07 · 方法：Playwright 全页实测截图（1440px，重点站另测 375px），共实测 **14 个**竞品/标杆。
截图存档：会话内 `/home/ubuntu/r16-ext/shots/`（cleanshot / lightshot / awesome-screenshot / flameshot / excalidraw / tldraw / shottr / gyazo / monosnap / screenshot-rocks / pika / snipboard / photopea / ksnip，含 375px 变体）。

## 实测竞品名单（14）

| # | 站点 | 类型 | 流量/口碑依据 |
|---|---|---|---|
| 1 | cleanshot.com | Mac 付费截图工具 | 公认截图工具官网设计天花板 |
| 2 | prnt.sc / Lightshot | 直接竞品（我们即其替代品） | Chrome 扩展 2M+ 用户 |
| 3 | awesomescreenshot.com | Chrome 扩展 | 3M+ 用户、18k+ 评论 4.6 星 |
| 4 | flameshot.org | 开源桌面截图 | GitHub 27k+ star |
| 5 | excalidraw.com | 白板/标注编辑器标杆 | GitHub 100k+ star |
| 6 | tldraw.com | 白板/标注编辑器标杆 | GitHub 40k+ star |
| 7 | shottr.cc | Mac 轻量截图 | HN/Reddit 高口碑 |
| 8 | gyazo.com | 截图分享 SaaS | 自称 20M 用户 |
| 9 | monosnap.com | 截图+云存储 | 2M+ 用户 |
| 10 | screenshot.rocks | 截图美化（同为纯浏览器本地处理） | 开源、PH 热门 |
| 11 | pika.style | 截图美化 SaaS | PH 热门、付费转化标杆 |
| 12 | snipboard.io | 极简截图分享 | 老牌工具站 |
| 13 | photopea.com | 浏览器本地图像编辑标杆 | 月活千万级 |
| 14 | github.com/ksnip/ksnip | 开源截图标注 | GitHub 2k+ star |

## 值得学的优点（12 条）

| # | 出处 | 具体页面/组件 | 为什么好 | 适用到我们 |
|---|---|---|---|---|
| 1 | Flameshot | 首页 hero 右侧编辑器实截图：工具栏含**编号计数器（counter）**工具 | 教程/步骤类截图刚需，一键打「①②③」序号，是截图标注工具的差异化高频功能 | 编辑器新增 Counter 工具（P0） |
| 2 | Flameshot / Shottr | 编辑工具列表含 **highlight 荧光笔** | 半透明高亮不遮挡原文字，比矩形框更适合标记文本，QA/文档场景高频 | 编辑器新增 Highlight 工具（P0） |
| 3 | Excalidraw / tldraw | 画布 UI：**每个工具有数字快捷键**（1–9，悬停提示显示） | 高频用户效率倍增；快捷键提示内嵌 tooltip，学习成本为零 | 编辑器工具加 1–8 快捷键 + tooltip 标注（P0） |
| 4 | tldraw | 颜色面板：预设色 + 尺寸 S/M/L/XL 分档 | 分档比滑杆更快选中目标粗细；预设色+自定义并存 | 编辑器加自定义取色器（native color input），保留滑杆（P1） |
| 5 | Screenshot.rocks | 首页上传卡片内「**Try a demo image: Browser / Mobile**」链接 | 零成本让访客立刻体验核心编辑器，不必先有截图——直接提升转化 | 首页 hero 拖放区加「Try a sample image」按钮（P0） |
| 6 | CleanShot X | 全站 og 卡片 + 每个功能区块一张真产品图 | 社交分享出图（og:image）是免费分发渠道；我们目前 **没有 og:image** | index.html 加 og:image/twitter card + 生成 1200×630 品牌图（P0） |
| 7 | Shottr | 首页「Tips and Tricks」卡片区（快捷键教学） | 把快捷键当营销素材，强化「pro 工具」心智，提升留存 | FAQ/功能区补充快捷键说明；编辑器 tooltip 展示（P1） |
| 8 | Photopea | 纯浏览器本地处理 + 打开即用零 onboarding | 与我们同一隐私叙事的成功标杆：工具本体即首页 | 保持「首屏即上传区」；demo 一键进编辑器强化即用感（P0-5 同步实现） |
| 9 | Awesome Screenshot | 首页大区块「2,000,000+ users · 4.6★ · 18,489 reviews」+ 真实用户评论墙 | 社会证明是转化的第一杠杆；我们暂无用户量，可先用 GitHub star/开源可验证替代 | 现阶段以「Open source · verify on GitHub」替代；后续接入 Web Store 评分（backlog 登记） |
| 10 | Gyazo | 功能区块每条配 mini-截图/动图演示 | 「看见即理解」，减少文字阅读负担 | 功能区块的 mock 组件已具备；后续换真实录屏 GIF（backlog） |
| 11 | Monosnap | 「How it works」三步编号流程区块 | 步骤化降低理解成本，尤其扩展安装类复杂流程 | 我们扩展安装区已有 3 步列表，保持；将 demo 按钮纳入第 0 步「先试试」（P0） |
| 12 | Snipboard | 首页直接教「Alt+PrtScr → Ctrl+V」系统级粘贴流 | 教育用户「不装扩展也能用」的最短路径，降低门槛 | hero 已有 Ctrl+V 提示；编辑器内空状态同样提示（保持并在 sample 流内强化） |

## 编辑器能力对照（矛盾论：主要矛盾在编辑器，不在落地页）

R14 已把落地页对齐 CleanShot 设计规范（浅色、pill、交替区块），Lighthouse 100/93/100/100。
本轮实测发现：**竞品编辑器普遍有 计数器/荧光笔/快捷键/自定义色**，我们编辑器只有 8 个基础工具、无快捷键、8 个固定色。编辑器是留存核心（用户用完即走还是回头用），落地页再漂亮也补不了工具本体的差距 —— 这是 R16 的主要矛盾。
