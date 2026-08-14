# Round 11 — Fix report（修改员）

PR: https://github.com/wookat/snapmark/pull/18
部署: worker version `bf56dd5d-83a9-4df5-94c0-59a214b18c7b` @ https://ext.zalize.com（用新 deploy 脚本从含 origin/main 的分支干净重建部署，部署后自检通过）
本地验证: lint 全绿（仅既有 Editor.tsx fast-refresh warning）、build 全绿。

## R11-1 线上 bundle 与 main 不一致（第 9 轮前端修复丢失）— 已修

### 根因（实查确认，与审查员假设略有不同）
不是「dist 混装/旧 vite 产物缓存」——prerender 与 client bundle 同源自一次 `npm run build`，不会跨次混用。实际根因：**第 10 轮代码分支从一个尚未包含 #16（第 9 轮）合并的陈旧 origin/main 快照切出**，该分支本地构建/部署都是自洽的，只是源码本身缺第 9 轮改动，所以出现「HTML 有第 10 轮 FAQ 新文案、JS 缺第 9 轮 a11y」的现象（第 10 轮 FAQ 在该分支上有，第 9 轮改动没有）。审查员观察到的 HTML 含 amber-800 是在修改员已从合并后 main 重新部署（`e38802e6`）之后与旧缓存 bundle 观察的时间差所致。

### 修复（两层）
1. **立即纠偏**：发现后（测试代理报告扩展本地构建缺 canvas role 时追查确认）已第一时间从合并后的 main 干净重建并部署 `e38802e6`；本轮再用新脚本部署 `bf56dd5d`。线上实测：`Annotation canvas`、`Editor toolbar`、`Skip to content` 均在当前 bundle `index-TWd-OZ-m.js` 中命中。
2. **治本（PR #18）**：新增 `scripts/deploy.sh`，把审查员建议的管线加固落地并加强：
   - 部署前 `git fetch origin main` 并强制 `origin/main` 必须是 HEAD 祖先，否则拒绝部署（直接杜绝「陈旧分支部署」这一真实根因）；
   - `rm -rf dist && npm run build`，保证 HTML/JS 永远同源一次构建；
   - 部署后自检：curl 线上 HTML → 取引用的 `assets/index-*.js` → 校验该文件存在于本次构建产物、且本地与线上 bundle 都含当前源码特征（`Annotation canvas`、`Editor toolbar`），任一不符即大声失败。

### 主动否决的方案
- 不引入 CI/Actions（全公司规则：禁用）；自检内嵌在部署脚本里，无新增实体。
- 不做「部署产物哈希登记/版本清单系统」——对单 worker 单域名产品是过度设计，ancestor 检查 + 构建后自检已覆盖两类真实失效模式。

### 线上复核证据
- `curl https://ext.zalize.com/` → bundle `index-TWd-OZ-m.js`；线上 bundle grep：`Annotation canvas`=1、`Editor toolbar`=1；HTML 含 `Skip to content`。
- 安全回归未受影响：evil Origin 403、permissions-policy 全套在线。
- 部署脚本自检输出：`Deploy self-check passed: live bundle assets/index-TWd-OZ-m.js matches this build.`
