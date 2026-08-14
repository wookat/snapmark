# Round 8 — Fix report（修改员）

PR: https://github.com/wookat/snapmark/pull/15 （已合并入 main）
部署: worker version `a6ba7b80-b51a-4a63-9094-8bdd41fc416a` @ https://ext.zalize.com
本地验证: lint / build 全绿（Editor.tsx 的 fast-refresh warning 为既有项，不影响）；CDP smoke 通过。

## 逐项响应

### R8-1 落地页内容全靠 JS 渲染 — 已修（构建期预渲染）
**独立判断**：真问题。`curl /` 此前 body 为空，非 JS 爬虫（Bing/DDG/社交卡片）拿不到关键词、FAQ、对比表。
**修法**：不引入 SSR 框架。新增 `src/entry-prerender.tsx`（`renderToString(<App/>)`）+ `scripts/prerender.mjs`（构建后用 Vite `ssrLoadModule` 渲染并注入 `dist/index.html` 的 `#root`）。`main.tsx` 改为 root 有子节点时 `hydrateRoot`，否则 `createRoot`（dev 不受影响）。约 50KB 完整落地页 HTML 随首包直出，React 照常水合、交互不变。
**配套治本**：`canCaptureScreen` 原为模块级常量（服务端渲染时无 `getDisplayMedia`，会造成水合不匹配），改为挂载后 `useEffect` 检测的 state——服务端与客户端首帧一致，任何设备上零 hydration warning（smoke 断言 console 无 hydration 报错）。
**否决的方案**：迁移 Next.js / 加 vite-plugin-ssr（单 URL 站点，为一个页面引入整套框架违背"如无必要勿增实体"）；puppeteer 快照预渲染（比 renderToString 重且脆）。
**证据**：`curl -s https://ext.zalize.com/ | grep '<h1'` 直出完整 h1/FAQ/对比表。

### R8-2 sitemap 缺 lastmod、含 changefreq — 已修
删除 worker 里硬编码的 `/sitemap.xml` 路由（-8 行），改由 prerender 脚本在构建时生成 `dist/sitemap.xml`：`<lastmod>` = 构建日期，去掉 `changefreq`。经 assets 兜底路径自动以 `application/xml` 提供。lastmod 随每次部署自动更新，无需人工维护。
**证据**：`curl https://ext.zalize.com/sitemap.xml` → `<lastmod>2026-08-14</lastmod>`。

### R8-3 无 apple-touch-icon / PNG favicon 回退 — 已修
从既有 `favicon.svg` 品牌视觉渲染生成 `apple-touch-icon.png`（180×180，铺满品牌蓝底避免 iOS 给透明角填黑）和 `favicon-48.png`，在 `index.html` 声明两条 `<link>`。未新增设计语言。
**证据**：两个 URL 均 200 `image/png`（部署初期有约 1 分钟资产传播延迟，之后稳定 200）。

### R8-4 未上架 Chrome Web Store — 部分修（外部依赖，如实标注）
上架需要 CWS 开发者账号 + $5 注册费 + 审核，属老板侧外部资源，本轮不可能也不应假装完成——**留待老板开通账号**（资源缺口按 CHARTER 立项汇报，不阻塞）。
本轮过渡改进：扩展区块文案明示 "Not yet on the Chrome Web Store — for now it loads manually in under a minute with the three steps here"，指向同区块内已有的 3 步图文指引；删除跳 GitHub README 的 "Install instructions" 按钮（与页内步骤重复，减少流失点，删代码解决）。

### R8-5 两个同名 CTA 行为不一致 — 已修
底部 "Get the extension" 由外链 GitHub releases 改为与顶部一致锚点 `#extension`；唯一的 .zip 直链下载按钮由扩展区块承载。
**证据**：smoke 断言两个同名 CTA 的 href 均为 `#extension`。

## 未修项
无（R8-4 的商店上架部分为外部依赖，已如实标注并申请资源）。

## 回归
CDP smoke：水合零告警、Capture screen 按钮正常出现、样例图进编辑器、图标/站点地图 200。生产端全链路回归（编辑器 golden path + 移动端）由测试代理执行中，证据将补充在 PR #15 评论。
