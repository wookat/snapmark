# N2 竞调报告：弃置 Chrome 扩展替代（2026-08-01 采集）

## 要回答的问题
在 Chrome Web Store 找到 3 个「10 万+ 用户、1 年以上未更新、近期差评集中在坏了/不工作、功能可纯前端实现」的弃置扩展，选定 1 个最优标的做干净替代。

## 候选矩阵（数据均为 2026-08-01 从 Chrome Web Store 页面直接采集）

| 候选 | 用户数 | 最后更新 | 近期差评 | 纯前端可行性 |
|---|---|---|---|---|
| **Lightshot (screenshot tool)** ([商店页](https://chromewebstore.google.com/detail/mbniclmhobmnbdlbpiphghaielnnpgdp)) | 2,000,000 | 2024-07-22（>2 年） | "takes blank screenshots"、"The extension is broken… Uninstalling"、"blank, unusable spaces" | 高：截图标注可全本地 canvas 实现；网页版可用 getDisplayMedia/粘贴/上传 |
| Tab Resize - split screen layouts ([商店页](https://chromewebstore.google.com/detail/bkpenclhmiealbebdopglffmfdiilejc)) | 800,000 | 2024-06-11（>2 年） | "Awfully buggy. Can't use. Uninstalled." | 低：核心依赖 chrome.windows API，网页版无意义 |
| TooManyTabs for Chrome ([商店页](https://chromewebstore.google.com/detail/amigcgbheognjmfkaieeeadojiibgbdp)) | 100,000 | 2024-05-08（>2 年） | "randomly duplicate tabs"、"ugly and outdated" | 中：网页版只能做链接/会话管理器，弱化卖点 |

另核查未入选：Copy All Urls（90k，2021 年停更，用户数略低于门槛）、Page Ruler/Eye Dropper/OneTab/Lightshot 竞品（均 2026 年仍在更新）。

## 结论（置信度：高）
**选定 Lightshot 作为标的。** 理由：
1. 体量最大（2M 用户）且品牌搜索词量大（"lightshot not working / lightshot alternative"）。
2. 差评精准命中"坏了"：空白截图、按钮失效，且仍是 Manifest V2（Chrome 已弃用，随时可能下架）。
3. 天然差异化：Lightshot 把截图上传到 prnt.sc 服务器，历史上多次被曝截图可被公开遍历（隐私事故有公开报道）；我们的替代 100% 本地处理，隐私即卖点。
4. 功能完全可纯前端实现：canvas 标注（箭头/框/文字/马赛克）+ getDisplayMedia 截屏 + 剪贴板粘贴。

## 差异化定位
「SnapMark — maintained alternative to the Lightshot extension」：100% 本地、MV3、含 blur/马赛克（Lightshot 没有）、网页版免安装（吃品牌词流量），扩展一键截当前标签页复用同一编辑器。
