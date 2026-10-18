# dsh-furina-style

> 芙宁娜水色 × Claude 风格的布局与动效 —— 给 DeepSeek Harness Web GUI 的独立主题插件。

![dsh-furina-style](docs/preview-dark.png)

一个**纯客户端**的 DSH bundle 插件：零 Host 能力、零第三方依赖、零构建依赖。
它做三件事：

1. **配色**：一套冷调「水与珍珠」的调色板（亮 / 暗各自独立设计），覆盖宿主
   全部 `--dsw-alias-*` 语义 token；
2. **布局**：抄 claude-style 的几何纪律 —— 独立水面式的输入卡、40px 的底部
   雾化带、压薄的会话头、32px 行高的弹层、发丝线边框与墨色焦点环；
3. **动效**：把所有时长 / 曲线 / 距离做成 `--fh-*` 令牌，克制的入场、反馈、
   循环呼吸三层节奏，并自带 reduced-motion 双保险。

卸载插件 = 删掉 `<html>` 上的命名空间属性 = 100% 还原，不留任何残影。

---

## 安装

插件是标准 DSH bundle，源码目录即可直接安装：

```bash
# 在你的 DSH 里（或让 Agent 调用 plugin_manager）
plugin_manager install_bundle {"target": "<绝对路径>/dsh-furina-style"}
```

安装后**刷新页面**（`Ctrl+R`）即生效。插件通过软链接挂进 profile，
所以之后改源码只需要 `node scripts/build.mjs` + 刷新，不必重装。

### 从源码构建

```bash
node scripts/build.mjs   # src/*.css + src/client.js → lib/client.js
```

`lib/client.js` 是产物（顶部有 GENERATED 标记），不要手改。

---

## 它和「皮肤」有什么不同

DSH 的 skin-center 皮肤包（`skin.json` + `skin.css` + `patches.css`）是**声明式**的：
只能写 CSS 变量和选择器，拿不到 DOM、拿不到 JS。本插件是**插件**，所以能做皮肤
做不到的事：

| 能力 | skin-center 皮肤 | 本插件 |
| --- | --- | --- |
| 覆盖 `--dsw-*` 配色 | ✅ | ✅ |
| 按「谁在负责表面」切换策略 | ❌ | ✅（`own` / `furina` / `other`） |
| 给 `<html>` / `<body>` 写状态属性 | ❌ | ✅ |
| 与 claude-style 自动互斥让路 | ❌ | ✅ |
| 跟随系统 reduced-motion | 部分 | ✅（属性门控 + 媒体查询双保险） |
| 卸载后保证零残留 | ✅ | ✅（`ctx.effect` 清理） |

### 三种表面模式

插件在 `<html>` 上写 `data-dsh-furina-surfaces`，样式表按它分三档：

| 模式 | 触发条件 | 行为 |
| --- | --- | --- |
| `own` | 没有其它皮肤在跑 | 完整芙宁娜配色 + 画布水光渐变 |
| `furina` | `html[data-dsh-skin="furina"]` | 只**修补**官方芙宁娜皮肤的已知缺陷，不抢它的插画 |
| `other` | 其它皮肤在跑 | 完全不碰颜色，只保留布局与动效 |

`furina` 模式修的是什么（都是从 `skins/furina` 里实测出来的硬缺陷）：

- 面板层 alpha 公式方向反了（`calc(.35 + scrim*.45)`），导致 `backgroundOpacity:35`
  时面板只有 0.51 alpha、正文发灰 → 重写成单调递增且足够不透明；
- `--dsw-alias-bg-overlay` alpha 只有 0.10，弹层透底 → 提到 0.96；
- 气泡圆角滑块失效（皮肤硬编码 `--dsw-specific-bubble`、0 次引用滑块变量）
  → 用 `color-mix()` 重新接上 `--dsh-skin-bubble-alpha`；
- tooltip 用暖黄 `#ffffe1` 和冷蓝撞色 → 换蓝墨底；
- 焦点环默认 `transparent` → 给芙宁娜品牌蓝。

---

## 与 claude-style 的关系

`dsh-claude-style` 是另一个独立 Cordis 插件，两者**可以同时安装，但不建议同时启用**。
本插件检测到 `html[data-dsh-claude-style]` 时会：

1. 点亮 `data-dsh-furina-handoff="claude-style"`；
2. 把 `data-dsh-furina-layout` 切成 `off` —— **整块布局规则让路**；
3. 只保留配色 token 重映射，让你仍然得到芙宁娜的色。

这样两套几何不会互相错位（claude-style 会改 composer 圆角、侧栏行高、Windows
标题栏等全局布局，两边同时全量跑必然打架）。

> 反向也成立：claude-style 检测到 `html[data-dsh-skin]` 时会自己让路到
> 「只装 settings」。所以「激活芙宁娜皮肤 + 装本插件」是当前最稳的组合。

---

## 动效令牌

所有动效值都是 CSS 变量，想调节奏改一处即可（`src/00-tokens.css`）：

| 组 | 令牌 | 值 |
| --- | --- | --- |
| 反馈 | `--fh-dur-instant` / `-feedback` / `-reveal` | 80 / 120 / 160ms |
| 表面 | `--fh-dur-surface` | 180ms |
| 入场 / 退场 | `--fh-dur-enter` / `-exit` | 320ms / 120ms（退场永远比入场快） |
| 位移 | `--fh-dur-move` | 200ms |
| 循环 | `--fh-dur-breathe` | 2400ms |
| 曲线 | `--fh-ease-standard` / `-out` / `-enter` / `-glide` / `-settle` | 见源码 |
| 距离 | `--fh-nudge` / `-travel` / `-rise` | 4 / 8 / 12px |
| 缩放 | `--fh-scale-menu` / `-dialog` | 0.98 / 0.96 |

### 减弱动效

两档开关，属性门控是主闸：

```js
// 跟随系统（默认）
localStorage.removeItem('dsh-furina:motion');
// 强制开启
localStorage.setItem('dsh-furina:motion', 'on');
// 强制减弱
localStorage.setItem('dsh-furina:motion', 'reduced');
```

改完刷新页面即可。`prefers-reduced-motion: reduce` 还会额外兜底（防 JS 未就绪
时动效先播一遍）。

---

## 工程结构

```
dsh-furina-style/
├── package.json          # dsh.bundle.patch / dsh.client 声明
├── cordis.patch.yml      # 把自己 insert 进 web roster
├── index.js              # Host 半边（空实现）
├── skin.json             # 给皮肤中心读的身份证（可选）
├── src/
│   ├── 00-tokens.css     # 设计令牌 + 三种表面模式的配色
│   ├── 10-layout.css     # 布局（L1–L9）
│   ├── 20-motion.css     # 动效（M1–M11）
│   └── client.js         # 模式判定 / 属性同步 / 样式注入模板
├── lib/client.js         # 构建产物（GENERATED）
├── scripts/build.mjs     # 零依赖构建脚本
├── locale/{zh,en}.json
└── docs/                 # 设计说明
```

### 为什么锚点选得这么克制

宿主 CSS module 的类名是哈希（`BynINW_frame`、`Dc7zOa_composerSeat`），跨版本会变，
**一律不依赖**。可用的稳定锚点只有宿主自己写出的 `data-*` 属性：

- `data-composer-card` / `-seat` / `-input` / `-dock`
- `data-conversation-scroll` / `-content` / `-region` / `-tabs`
- `data-chat-motion` / `-turn` / `-flow-kind` / `data-streaming`
- `data-windows-titlebar`、`data-sidebar-collapsed`
- `[role="menu"]` / `[role="dialog"]` / `[role="treeitem"]`

唯一的模糊匹配是 `[class*="_frame"]` —— Windows 上整窗涂色的源头就这一个，
而它没有 data 属性可抓。规则里都写清了为什么。

---

## 兼容性

| 依赖 | 说明 |
| --- | --- |
| DSH | `>= 0.1.7` |
| 浏览器 | Chromium 105+（用到 `:has()`、`color-mix()`） |
| 平台 | Windows / macOS（`[data-platform=darwin]` 分支由宿主处理） |

不支持 `:has()` / `color-mix()` 时样式会优雅降级：颜色变量仍然生效，
用到这两个特性的布局/装饰规则整条失效，不会破坏宿主原有布局。

---

## License

MIT © Tki-sor

配色灵感来自 DSH 官方芙宁娜皮肤（BSD 3-Clause, © zhu1090093659）与
[dsh-claude-style](https://github.com/Nwflower/dsh-claude-style)（MIT, © Nwflower）；
本插件为独立实现，未复制其源码。详见 `THIRD_PARTY_NOTICES.md`。
