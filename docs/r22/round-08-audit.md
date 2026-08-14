# R22 第 8 轮审查 — SEO/发现性专项（SnapMark）

审查员：user-experience-officer + qa-engineer + architect
日期：2026-08-14
对象：https://ext.zalize.com/ （线上实测：curl 原始 HTML、robots/sitemap、真浏览器渲染对比、og.png 视觉检查）

## 先说做对的（不折腾）
- title/description 精准打「Lightshot alternative」关键词，长度合理
- canonical、og:*（含 1200×630 og.png，视觉合格）、twitter:card 齐全
- JSON-LD 双结构化数据（WebApplication + FAQPage）内容与页面一致，非堆砌
- robots.txt + sitemap.xml 存在且互相引用；404 页返回真 404 且带 noindex
- http→https 301 正常；全站 img 均有 alt；h1 唯一、h2 层级清晰
- 单页产品不硬造多页站点结构，符合「如无必要勿增实体」

## 发现清单

### R8-1【P2｜SEO/架构】原始 HTML `<body>` 为空，全部落地页内容依赖 JS 渲染
- 复现：`curl -s https://ext.zalize.com/ | grep '<body>'` → body 内无任何内容；h1、FAQ、对比表全部由 React 挂载后才存在。
- 影响：Google 能渲染 JS，但 Bing/DuckDuckGo/部分社交抓取器对 JS 渲染不可靠；页面核心关键词内容（"maintained Lightshot alternative" 正文、对比表）对这些渠道不可见，仅剩 meta/JSON-LD。
- 思辨：换 SSR 框架（Next 等）是典型过度工程，明确否决。本站只有一个 URL，构建期预渲染（vite prerender 插件或构建后用 headless 浏览器把渲染结果快照进 index.html）即可让爬虫拿到完整 HTML，React 照常 hydrate/接管，改动边界小。
- 建议：构建期静态预渲染落地页 HTML。

### R8-2【P2｜SEO】sitemap.xml 缺 `<lastmod>`，只有被主流引擎忽略的 `<changefreq>`
- 复现：`curl -s https://ext.zalize.com/sitemap.xml` → 仅 loc+changefreq。
- 影响：Google 明确表示使用 lastmod（内容有实质更新时）而忽略 changefreq；当前写法留了个无效字段、缺了有效字段。
- 建议：构建时注入 `<lastmod>`（取构建日期），删掉 changefreq。

### R8-3【P2｜发现性】缺 apple-touch-icon 与 PNG favicon 回退
- 复现：`curl -I https://ext.zalize.com/apple-touch-icon.png` → 404；HTML 只声明 SVG favicon。
- 影响：iOS 添加到主屏、部分搜索结果/书签场景不支持 SVG favicon，回退为默认灰色图标，品牌识别损失。
- 建议：加 180×180 apple-touch-icon.png + 一个 PNG/ICO favicon 回退声明。

### R8-4【P2｜发现性/产品】扩展未上架 Chrome Web Store，安装链路是「下载 zip + 开发者模式手动加载」
- 复现：页面「Get the extension」→ GitHub releases zip + install instructions（README 手动 load-unpacked 流程）。
- 影响：CWS 是扩展类产品最大的自然发现渠道（搜索「lightshot alternative」的用户大多在 CWS 内搜）；手动加载对普通用户是硬门槛，且 Chrome 会对非商店扩展定期弹警告。这是本产品发现性的最大缺口。
- 边界说明：上架需要 CWS 开发者账号（一次性 $5 注册费）与审核流程，超出修改员代码权限，属外部依赖——本条不要求本轮代码修复，但需在 fix.md 中明确挂账并上报父会话决策。
- 过渡建议（可本轮做）：落地页扩展区块明示「暂未上架商店，需手动加载」并给出 3 步图文/折叠指引，替代跳转 GitHub README，降低当前链路流失。

### R8-5【P2｜逻辑/一致性】两处「Get the extension」CTA 行为不一致
- 复现：导航栏「Get the extension」→ 页内锚点 #extension；页面底部「Get the extension」→ 外链 github.com/wookat/snapmark/releases（列表页，还要再点一次才到 zip）。
- 影响：同名 CTA 不同目的地违背一致性；外链去 releases 列表页比直接 zip 下载链接多一跳、流失更高。
- 建议：同名 CTA 统一行为（都锚点到 #extension，由该区块承载唯一的直链下载按钮）。

## progress
audit 完成，等待修改员 fix。
