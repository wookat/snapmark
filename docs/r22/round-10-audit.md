# R22 第 10 轮审查 — 安全与滥用专项（SnapMark）

审查员：user-experience-officer + qa-engineer + architect
日期：2026-08-14
方法：线上响应头/CORS/滥用路径实测（curl）+ worker 与扩展源码审查（origin/main）

## 先说做对的（不折腾）
- 安全响应头相当完整：HSTS(1y+subdomains)、CSP（default-src 'self'、object-src none、frame-ancestors none）、X-Frame-Options DENY、nosniff、referrer-policy
- CORS origin 白名单（本站 + chrome-extension://），不是 `*`
- /api/track 动作名走 ALLOWED_ACTIONS 白名单，超大 body 实测 400，非 POST 已返回 405
- 扩展权限最小化（仅 activeTab+storage，无 host_permissions、无 content scripts）；截图 dataUrl 用后即从 storage.local 删除
- 图片全程本地处理、无上传端点，无 PII 面
- CSP style-src 'unsafe-inline'：React style 属性与 404 页内联样式需要；本站无用户注入的 HTML 渲染面，收紧到 style-src-attr 的收益近零——深思后明确不立项。

## 发现清单

### R10-1【P2｜滥用】/api/track 无服务端 Origin 校验、无速率限制，计数可被任意灌水
- 复现：`curl -X POST https://ext.zalize.com/api/track -H 'Origin: https://evil.com' -d '{"action":"visit"}'` → 200 并计数；连续请求无限速。CORS 只限制浏览器读响应，不阻止写入。
- 影响：任何脚本可无限抬高 visit/download 甚至 ext_* 计数，内部参考指标失真；每次写 2 个 KV key，恶意刷量放大 KV 写成本。
- 思辨：计数非计费/安全数据，不值得上重型防护（Turnstile 等违背勿增实体）。合理下限是：① 服务端校验 Origin/来源（存在 Origin 但不在白名单→403）；② 用平台成熟能力（Cloudflare WAF rate limiting rule 或 worker 内简单 IP 桶）限速。
- 建议：Origin 服务端校验 + 平台级限速规则。

### R10-2【P2｜逻辑/隐私】扩展 pendingCapture 加载绕过 normalizeImage 且无失败处理
- 复现（代码审查推断，已核对 origin/main src/App.tsx:21-24）：`loadImage(r.pendingCapture).then(setImage)` 直接进编辑器，未过 normalizeImage——高 DPI 大屏截图（可 >16MP）绕开第 2 轮建立的大图护栏；且无 `.catch`，dataUrl 损坏时静默失败，此时 storage.local 中的截图不被清除而长期滞留（隐私残留）。
- 影响：大屏用户扩展路径可能触发 canvas 尺寸问题；失败路径静默 + 截图残留。
- 建议：pendingCapture 与文件上传共用同一管线（loadImage→normalizeImage→setImage），失败时 toast 提示；remove 移到 finally（成功失败都清除）。

### R10-3【P2｜安全】缺 Permissions-Policy 响应头
- 复现：`curl -sI https://ext.zalize.com/` 无 permissions-policy。
- 影响：纵深防御缺一层——若未来引入第三方脚本或被 XSS，camera/mic/geolocation 等强能力未被显式关闭（display-capture 本站自己要用，需保留）。
- 建议：加 `permissions-policy: camera=(), microphone=(), geolocation=(), payment=()`（保留 display-capture）。

### R10-4【P2｜滥用/性能】/api/stats 公开且无缓存，每次命中做 10 次 KV 读
- 复现：GET /api/stats 匿名可访问，响应无 cache-control；worker 内 Promise.all 读 10 个 total key。
- 影响：内部参考指标对外暴露（低敏感，但无对外价值）；被脚本轮询时 KV 读成本被无谓放大。
- 思辨：加认证对一个内部计数器是过度设计；最小正确做法是加 `cache-control: max-age=60`（或 caches.default 60s），滥用放大即被削平；是否继续公开由修改员判断（公开也可作为 open metrics 卖点）。
- 建议：60s 缓存；可选择性保留公开。

### R10-5【P2｜安全/供应链】扩展 zip 与页面声明的隐私承诺缺少可验证锚点
- 复现：落地页/manifest 均承诺 "screenshots never leave your device"，但扩展 app/index.html 打包的是与网站同源构建产物，包含 track() 调用（发送匿名动作名到 ext.zalize.com）。行为本身合规（无图像数据、无 PII），但承诺文案与「完全无网络请求」的直觉有落差，上架 CWS 审核时也会被问到。
- 影响：信任型产品的核心卖点若被用户抓包质疑「说好 never leave 却有请求」，反噬大于收益。
- 建议：FAQ/扩展区块补一句诚实说明（"匿名使用计数，不含图像/页面内容，可在源码验证"），或扩展构建产物直接剔除 track 调用（构建期 define 开关，勿增运行时实体）。

## progress
audit 完成，等待修改员 fix。

---

## Verdict（审查员线上复验，2026-08-14）

- R10-1 **PASS**：evil Origin 实测 403、本站 Origin 200；持久连接第 30 次起稳定 429（per-isolate 尽力而为的限制已在 fix 中如实标注，接受）。
- R10-2 **PASS**：main 实查 pendingCapture 走 loadImage→normalizeImage→setImage，.catch 提示 + .finally 清除 storage（扩展真机加载受环境限制未实测，代码路径与共用管线已确认）。
- R10-3 **PASS**：permissions-policy 头实测存在（camera/microphone/geolocation/payment 关闭，display-capture 保留）；Capture screen 按钮正常出现，编辑器回归正常。
- R10-4 **PASS**：/api/stats 实测 `cache-control: public, max-age=60`，保持公开（接受）。
- R10-5 **PASS**：FAQ 直出 HTML 实测含匿名计数诚实披露（"never image or page content… verify in the open source code"）。

结论：5/5 PASS。第 10 轮闭环，进入第 11 轮（回归总审）。
