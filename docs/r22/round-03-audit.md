# R22 第 3 轮审查 — 性能专项（SnapMark / ext.zalize.com）

审查员：user-experience-officer + qa-engineer + architect
日期：2026-08-14
方法：Lighthouse 13.4（生产环境）、API 延迟 curl 多次采样、真实浏览器运行时性能实测（16MP 画布 + 多标注拖拽 FPS 计数）、静态资源头部核查、渲染热路径代码审查（origin/main @8d84883）。

## 实测基线（好消息优先）
- Lighthouse：Performance 99 / A11y 93 / Best-practices 100 / SEO 100；FCP=LCP=1.7s，TBT 0ms，CLS 0，总重量仅 85KB。
- API：/api/stats 5 次采样 86~270ms（首次冷启动 270ms，热 ~90ms）；/api/track 64~73ms；首页 TTFB 71ms。上轮 stats 并行化修复效果稳定。
- 运行时：16MP（4619×3464，降采样后）画布上 Pen 拖拽 54.6fps；叠加 3 个 blur + 15 个 box 后仍 59.4fps；导出 1.1s。桌面端无性能问题。
- 哈希资源 `assets/*` cache-control immutable ✅，br 压缩 72KB ✅。

## 发现清单

### R3-1【P2｜性能】非哈希静态资源全部 max-age=0：sample.png(48KB)/og.png/favicon.svg/extension.zip 每次访问都 revalidate
- 复现：`curl -I` 上述路径均返回 `cache-control: public, max-age=0, must-revalidate`。
- 影响：回访用户重复协商请求；extension.zip 是下载主路径。
- 建议：非哈希但低频变更资源给 `max-age=3600, stale-while-revalidate=86400`；extension.zip 若带版本号路径可 immutable。思辨：og.png/favicon 变更极少，1h TTL 风险可忽略。

### R3-2【P2｜性能】渲染阻塞 CSS 估算可省 300ms（Lighthouse render-blocking-insight）
- index-*.css 仅 8KB（br 后更小），可直接内联进 HTML 或 preload，弱网（3G/移动）下 FCP 收益明显。
- 思辨：当前 FCP 1.7s 已优；此项是"锦上添花"，若内联导致 HTML 不可缓存反而得不偿失——Worker 已对 HTML max-age=0，内联无副作用，可做。

### R3-3【P2｜架构/性能】重绘热路径：每次 pointermove 全量合成 16MP + 每个 blur shape 每帧新建临时 canvas
- 代码：`redraw()` 每帧 `drawImage(base)` + 遍历全部 shapes；`drawShape('blur')` 每次调用 `document.createElement('canvas')`。
- 实测：桌面 55~60fps 无问题（证据在上方基线），此项为预防性建议非必修。
- 建议：将已提交 shapes 合成缓存到 offscreen canvas，pointermove 只画 draft 层；blur 临时 canvas 可复用。思辨：在实测不卡的前提下，勿为优化而增实体——建议仅当第 4 轮移动端实测掉帧时再做。

### R3-4【P2｜逻辑/视觉】canvas 文字字体声明 `Inter, sans-serif` 但站点从未加载 Inter（CSS 无 @font-face，网络无字体请求）
- 影响：Text/Counter 导出字形实际是各系统默认 sans，跨设备导出结果不一致，且与设计意图（Inter）不符。
- 建议：二选一：a) 按需加载 Inter 子集并 `document.fonts.ready` 后再绘制；b) 诚实改为 system-ui 栈。倾向 b（零成本、零网络、导出仍一致于用户所见）。

### R3-5【P2｜无障碍】落地页 mockup 红色角标 12px 白字对比度 3.8 < 4.5（Lighthouse a11y 93 的唯一失分项）
- 元素：`span.absolute.bottom-8.right-8.bg-red-500.text-xs`。建议 bg 加深至 red-600/700 或字号提至 14px bold（3:1 门槛）。

### R3-6【记录项｜逻辑】KV 计数原子性（第 1 轮 A6 遗留）本轮复测未回归：并发写丢失风险仍在，延迟已达标
- 不重复开单，保持 A6 跟踪；若后续做数据看板再迁 Analytics Engine。

## progress
审查完成（5 条新发现 + 1 条遗留跟踪），进入 fix 阶段。
