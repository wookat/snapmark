# Round 10 — Fix report（修改员）

PR: https://github.com/wookat/snapmark/pull/17 （已合并入 main）
部署: worker version `e38802e6-5572-4948-ba19-513d6c99ed64` @ https://ext.zalize.com（从合并后的 main 构建）
本地验证: lint / build 全绿。

**部署纠偏（如实记录）**：首次部署 `6c73a775` 时第 10 轮分支基于的 origin/main 尚未包含刚合并的 #16（第 9 轮 a11y），导致线上短暂回退第 9 轮改动；测试代理发现扩展本地构建缺 canvas role 后追查确认。已从合并后的 main 重新构建部署 `e38802e6`，生产 bundle 实测同时含第 9 轮（Annotation canvas aria-label、skip link）与第 10 轮（403/permissions-policy）。教训：部署前必须 `git pull` 最新 main 或校验分支含所有已合并轮次。

## 逐项响应

### R10-1 /api/track 无 Origin 校验、无限速 — 已修
- **Origin 服务端校验**：存在 `Origin` 头且不在白名单（本站 / chrome-extension://）→ 403。CORS 只挡浏览器读响应，写入必须服务端拦。无 Origin 的请求（curl/扩展某些场景）放行——计数器不值得为此误伤合法路径。
- **限速**：worker 内 per-isolate IP 桶（cf-connecting-ip，30 次/分钟 → 429；Map 超 1 万条清空防内存膨胀）。**认同审查员思辨**：非计费数据不上 Turnstile；选 worker 内桶而非 WAF 规则，避免代码库之外的不可见配置实体。
- **如实说明限制**：per-isolate 桶是尽力而为——跨 isolate/colo 分散的请求可能不触发（生产实测：跨连接 35 次全 200，同一持久连接第 18 次起稳定 429）。足以钝化脚本灌水，不承诺硬上限。
- **证据**：evil Origin → 403，本站 Origin → 200，持久连接超限 → 429。

### R10-2 pendingCapture 绕过 normalizeImage 且无失败处理 — 已修
扩展捕获与文件上传共用同一管线：`loadImage → normalizeImage → setImage`（恢复第 2 轮 >16MP 护栏对高 DPI 截图的覆盖）；失败 `.catch` 显示落地页 notice（"Could not load the captured screenshot — please capture again."）；`storage.local.remove` 移入 `.finally`——成功失败都清除，消除隐私残留。

### R10-3 缺 Permissions-Policy — 已修
`permissions-policy: camera=(), microphone=(), geolocation=(), payment=()` 加入 SECURITY_HEADERS（全站静态响应统一带出）。`display-capture` 有意不禁用——本站 Capture screen 自用。
**证据**：`curl -I /` 实测头存在；生产 Capture screen 功能回归由测试代理验证。

### R10-4 /api/stats 无缓存、10 次 KV 读 — 已修
响应加 `cache-control: public, max-age=60`，轮询滥用被边缘缓存削平。**保持公开**：open metrics 与产品透明定位一致，加认证属过度设计（认同审查员）。

### R10-5 隐私承诺与 track() 的落差 — 已修（诚实披露方案）
FAQ "Where are my screenshots stored?" 补明：唯一网络请求是匿名动作名计数（如 "copy"），不含图像/页面内容，可在开源代码验证。
**否决**：构建期 define 开关从扩展产物剔除 track——网站与扩展共用同一构建产物，拆分构建为近零信任增益新增一个构建实体；若 CWS 审核提出要求再立项。

## 未修项
无。

## 回归
生产 curl 实测四项头/状态码如上；浏览器端遥测回归、FAQ 文案、Capture screen（permissions-policy 不破坏 display-capture）、编辑器 golden path 由测试代理执行中，证据将补充在 PR #17 评论。扩展 pendingCapture 路径若本机无法加载扩展则如实标注未测。
