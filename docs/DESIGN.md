# Design notes

这份文档记录 `dsh-furina-style` 的设计依据：抄了什么、为什么不照抄、每条规则
为什么这么写。给未来的自己（和想改它的人）看。

---

## 1. 三层分工：tokens / layout / motion

```
src/00-tokens.css   颜色与动效值（变量），三种表面模式
src/10-layout.css   几何：宽度、圆角、边框、阴影、留白
src/20-motion.css   时间：入场、反馈、循环、减弱
```

分层不是为了整齐，而是为了**能单独关掉**：

- `data-dsh-furina-surfaces="other"` → 只关颜色，布局与动效照常；
- `data-dsh-furina-layout="off"` → 只关布局（让路给 claude-style），颜色与动效照常；
- `data-dsh-furina-motion="reduced"` → 只关动效。

三条开关互相正交，任何一条单独失效都不会把另外两条带走。

---

## 2. 配色：为什么覆盖到 `body` 而不是 `:root`

宿主把全部 `--dsw-*` 默认值声明在 `body{}` 与 `body[data-ds-dark-theme]{}` 里
（见 `dsh-client-ui-theme` 打包产物）。CSS 变量的规则是：**元素上的直接声明
永远赢过继承值**。

所以如果只在 `:root`（= `html`）上写 `--dsw-alias-label-primary`，`body` 上的
宿主默认值会把它盖掉 —— 这正是官方芙宁娜皮肤的一批私有变量失效的原因。

我们的写法：

```css
html[data-dsh-furina][data-dsh-furina-surfaces="own"] body { --dsw-alias-...: ...; }
```

特异性 (0,3,1) > 宿主的 (0,0,1)，且落在同一个元素上，必胜。

暗色同理，必须挂在 `body[data-ds-dark-theme]` 上（宿主的暗色开关在 body，
不在 html，也不是 `prefers-color-scheme`）。

---

## 3. 配色：亮色不是「白的层级」，暗色不是「把亮色压暗」

宿主亮色的 `bg-base` / `bg-layer-1/2/3` 全是纯白，层级靠**叠加阴影与边框**实现；
暗色才是真正的明度差（`#151517` → `#232324` → `#2c2c2e` → `#353638`）。

我们的做法：

- 亮色：画布给一层极淡的冷蓝（`#eef2fa`），面板层才用白 —— 因为芙宁娜的
  视觉是「深色画布上浮着一层水面」，纯白画布会让整个界面失去水的厚度；
- 暗色：**独立设计**，不是把亮色乘个系数。画布 `#0c1220`（比宿主默认更蓝）、
  层级 `#101624 → #161f33 → #1c2740 → #24314f`，每层明度差 6–8%；
- 边框：一律用蓝墨色 `#2c3a73`（亮）/ `#a0b4e6`（暗）按 alpha 分级，
  **绝不用 `#000` / `#fff` 加透明** —— 灰色边框在冷蓝画布上会发脏。

### 对比度

| 组合 | 目标 | 实测 |
| --- | --- | --- |
| `label-primary` / `bg-base`（亮） | ≥ 7:1 | 约 12.6:1（`#1d2539` on `#f7f9fe`） |
| `label-secondary` / `bg-base`（亮） | ≥ 4.5:1 | 约 7.9:1（`#3e4b6d`） |
| `label-tertiary` / `bg-base`（亮） | ≥ 4.5:1 | 约 4.9:1（`#5f6e93`） |
| `label-primary` / `bg-base`（暗） | ≥ 7:1 | 约 13.2:1（`#dbe2f2` on `#101624`） |
| `label-tertiary` / `bg-base`（暗） | ≥ 4.5:1 | 约 5.6:1（`#8b9cbc`） |

`label-caption` 只用于非必要信息，允许低于 4.5:1（芙宁娜皮肤原值 `#7c8bab`）。

---

## 4. 布局：抄 claude-style 的哪些「纪律」

抄的是**几何原则**，不是它的像素：

| 原则 | 我们的落地 |
| --- | --- |
| 输入卡是一个有厚度的独立表面，不贴在窗口底边 | `border-radius: 18px`（宿主默认 28px 是「整块面板」的量级）、1px 发丝线、三层阴影（发丝 + 品牌色晕 + 宿主 elevation） |
| 焦点要有「点亮」感，而不是只换边框色 | `:focus-within` 时边框转品牌色 42%，叠 1px 同色晕 + 4px 淡雾 + 更深投影 |
| 滚动内容在底边淡出，不靠给卡片堆阴影 | 不补任何留白：宿主的 `[data-phase=active] .composerSeat` 已有 36px 渐变带；我们曾加过 `padding-bottom:40px`，实测把 seat 顶高 40px（y=610.67/bottom=782 vs 视口 822），正是「输入框悬空」的成因，已删除 |
| 弹层是 12px 圆角的小卡片，行高 32px | `[role=menu]` / `[role=dialog][data-modal-autofocus]` + `[role=menuitem]` |
| 正文有阅读宽度上限 | `--dsh-chat-user-width: clamp(720px, 68ch, 900px)`（宿主会据此推导 `--dsh-chat-content-width`） |
| 标题栏要「让路」给内容 | Windows 上把 `[class*="_frame"]` 的整窗涂色让回透明，改由 body 画布负责 |

### 为什么不照抄 claude-style 的 `!important` 数量

它有 539 处 `!important`，因为它要压过宿主的大量内联样式与同特异性规则。
我们只在**必须**的地方用（`data-dsh-furina` 作用域本身已经比宿主高一档），
其余靠特异性取胜。少了 `!important` 的好处是：用户自己的自定义 CSS 仍然能覆盖主题。

---

## 5. 动效：三档节奏

| 档 | 时长 | 用在哪 |
| --- | --- | --- |
| 反馈 | 80–160ms | hover、press、tab 切换、颜色过渡 |
| 表面 | 180ms | 浮层出现、卡片阴影变化 |
| 入场 | 320ms | 消息上浮、弹层从锚点长出 |
| 退场 | 120ms | 刻意比入场快（claude-style 的同一结论） |
| 循环 | 1400–2400ms | 流式光标呼吸、思考态径向光、画布水光漂移 |

曲线选择：

- `--fh-ease-enter: cubic-bezier(0.34, 1.3, 0.64, 1)` —— 带轻微过冲，用于「东西出现了」；
- `--fh-ease-glide: cubic-bezier(0.22, 0.61, 0.36, 1)` —— 无过冲的滑行，用于位移；
- `--fh-ease-settle: cubic-bezier(0.22, 1, 0.36, 1)` —— 长尾收束，用于大块入场；
- `--fh-ease-standard: ease` —— 反馈类，够用且最省。

### 减弱动效为什么用属性而不是只写媒体查询

`prefers-reduced-motion` 是**系统级**设置，但用户可能想「系统开着减弱，这个主题
我想看动效」。属性门控（`data-dsh-furina-motion`）给了这个自由度，媒体查询只
作为 JS 未就绪时的兜底。

---

## 6. 已知取舍

1. **`:has()` 的依赖**：`header:has([data-conversation-tabs])` 是会话头唯一稳定的
   定位方式（宿主没给 header 写 data 属性）。Chromium 105+ 才有，更老的浏览器
   这条规则整条失效 —— 可接受，不会破坏布局。
2. **`[class*="_frame"]` 的模糊匹配**：Windows 整窗涂色的源头没有 data 属性，
   只能这样抓。如果宿主改类名（概率低），这条规则失效，表现为标题栏重新被涂色，
   **不会**破坏其它任何东西。
3. **设置面板的持久化用 localStorage**（`dsh-furina:prefs`），不是 Host 的
   settings 服务。理由：用户要的是「配置出现在 DeepSeek 设置界面里」，那是
   `settings.section` 槽位的事；持久化后端用 localStorage 可以完全留在客户端，
   少一条 Host 依赖路径 —— 本插件因此至今 `index.js` 仍是空实现。
4. **与 skin-center 的 furina 皮肤重叠**：`furina` 模式只做修补，不接管画布。
   想看到本插件的完整配色，请把皮肤中心的激活皮肤设为「无」，此时进入 `own` 模式。
5. **`lib/client.js` 是产物**：仓库里同时提交 `src/` 与 `lib/`，安装者不需要 node
   也能用；改源码后记得 `node scripts/build.mjs`。
6. **重建后必须重启应用（不是刷新）**：宿主按「文件 mtime/ctime/size」给每个
   插件 chunk 算 `rev` 并缓存在 Host 进程内存里；`lib/client.js` 一变，内存里
   的旧 rev 就与磁盘不符，`/plugins/??<pkg>/client.js&rev=<旧>` 一律 404，页面
   卡在启动屏并报 `dsh-furina-style: import failed`。这是宿主机制，不是插件
   的 bug，写进 README 免得使用者踩。
7. **不碰第三方插件的 DOM**：0.1.x 有过三条「隐藏吉祥物 / 封号彩蛋 / 桌宠」
   规则，0.3.0 全部删掉。主题只负责自己的表面；`[class*="_bubble"]` 那条实际上
   命中的是 dsh-pet 的气泡，等于在改别人的界面 —— 这类选择器一律不写。
8. **原生窗口按钮的改法依赖宿主 preload 的实现细节**：我们压的是那个隐藏探针
   `span` 的采样色，不是公开 API。宿主哪天换掉这套 `titleBarOverlay` 采样机制，
   这条规则就会失效 —— 失效的形态是「按钮恢复默认底色」，不会误伤任何 HTML。

---

## 7. 0.4.1：三处「宿主已经有，但没做透」的地方

这一版没有新增任何页面结构。三个新层都是「宿主已经画了，我们只补它没做的那一半」。
判断标准很简单：**如果要靠自绘 DOM 才能做到，就先回头查宿主是不是已经有了。**

### 7.1 对话导航条：先查宿主，别急着画

开发期那版照着 claude-style 自绘了一列 `.fh-rail`，结果右侧同时挂着两列短横线、
横向错开几十像素 ——「看着不像成品」的最大来源。
宿主 `@deepseek-ai/dsh-client-ui-chat` 本来就有 TurnNavigator
（`nav > div[class*="_scroller"] > div[class*="_marks"] > button[data-index]`），
带 `aria-current`、hover 预览、虚拟滚动、上下淡出与减弱动效支持。

0.4.1 起：**不创建任何 DOM**，只给那一条上色（R1–R3）。
锚点用 `button[data-index]` 而不是 `.xpvNua_*` —— CSS-module 前缀是构建哈希，
宿主升版本就变；`data-index` 是组件的语义契约（点击、aria、虚拟化都依赖它）。

`Alt+↑ / ↓` 由 JS 实现（宿主没做键盘跳轮）。取法是「`[data-conversation-scroll]` 里所有
`[data-chat-flow-kind="user"][data-chat-turn]`」，当前轮按「谁跨过视口顶部下方
`min(120, 高度/3)` 那条探针线」判定（都不跨时取离探针最近的），跳转用
`scrollTo({top, behavior})`、减弱动效下改成 `auto`。不读 `aria-current`：它跟着
滚动更新会滞后，连按两次容易原地踏步。焦点在 `input / textarea /
[contenteditable="true"]` 且里面**已有草稿**时直接让路；焦点在 `[role="dialog"]` /
`[role="menu"]` 里时也不抢键。

### 7.2 运行状态：写属性，不写节点

宿主运行行（`div[data-chat-running="true"]`）已经写了「深度求索中，用时 N 分 N 秒」，
还自带扫光、鲸鱼动画与 `role="status"` 的读屏文本。这一层**不替换文本**，只补
宿主说不出来的三件事：正在调用哪个工具、正在写回答、12 秒没动静。

两个细节决定了实现方式：

1. **挂在哪个元素上**。运行行是 `flex-direction: column`（读屏 span + 发丝线 + 内容行），
   `::after` 挂在最外层会被排成第三行，和输入卡上方的工具行叠成三层。所以属性
   写到最后那个 `runningContent`（`display:flex`）上，`::after` 就是行末一个自然的
   flex item，与「深度求索中」同基线，行高不增加。
2. **为什么用属性而不是插节点**。运行行是 React 渲染的，塞子节点会在下一次重渲染
   时被冲掉；`data-fh-phase` / `data-fh-phase-label` 不是 React 管理的东西，重渲染
   不会碰它，插件卸载时删掉即可。CSS 侧用 `content: attr(data-fh-phase-label)` 把文本
   画出来，文案仍由 JS 的 `t()` 决定（跟着 locale 走），CSS 里不硬编码任何一句话。

**「卡住了」怎么判**：不能看运行行自己 —— 它每秒都在改「用时 N 分 N 秒」，永远有
动静。要看对话流的真实 DOM 变动（`MutationObserver` on `[data-conversation-scroll]`），
并在回调里**排除运行行内部产生的变动**，否则 stall 永远不可达。

**思考阶段为什么不出胶囊**：宿主那行本来就写着「深度求索中」，再贴一枚「正在思考」
是同一句话说两遍。胶囊只补宿主说不出来的状态 —— 这是「补」而不是「重画」的边界。

### 7.3 原生窗口按钮：改的是探针的采样色

Windows 上右上角的最小化/最大化/关闭**不是 HTML**，是 Electron 的
`titleBarOverlay`，颜色由主进程 `setTitleBarOverlay({color, symbolColor})` 决定。
宿主 preload 里有一段：创建隐藏探针 `span`，`background-color` 读
`var(--dsw-specific-sidebar-fill)`，用 1×1 canvas 采样成 `rgba(...)`，通过 IPC
`dsh-desktop:windows-appearance` 发给主进程。

两种改法：

- 改 `--dsw-specific-sidebar-fill` —— 不采用：侧栏底色跟着一起变，等于「为了三个
  按钮改整个侧栏」；
- 只压那个探针 span 的 `background-color` —— 采用：
  `body > span[style*="--dsw-specific-sidebar-fill"]` 加
  `background-color: transparent !important`（探针用内联样式，但**没有** `!important`，
  CSS 的 `!important` 稳压它）。

实测确认 alpha 真的生效：传 `rgba(0,0,0,0)` 时三个按钮直接浮在插画上、完全没有色块；
传半透明灰会按比例混进去。宿主 preload 还监视 `head` 子树变化并在样式表插入后重发
一次颜色 —— 所以样式表一 inject，按钮颜色就跟着变，不用等下一次主题切换。

**一个坑**：`PrintWindow` 拍不到原生 caption，验证标题栏必须用 `CopyFromScreen`
抓真实屏幕。

### 7.4 水膜浓度：从「公式」改成「一个滑块」

改动前的水膜中心 alpha 是 `calc(暗色中段纱 + 0.24)` ≈ 0.81 —— 压在插画上是一块很重的
墨色，用户第一反应是「中间为什么这么黑」。它原本是「保证正文对比度」的推导结果，
但是按**最坏情况**（插画最亮处）算的，对实际这张图偏保守。

0.4.1 改成：中心 alpha = `--fh-veil`（默认 0.4），两侧 84% 处乘 0.84，两端淡出到 0；
设置面板给一个 0–100% 滑块，0 = 完全透明。默认 0.4 时，`#dbe2f2` 的正文压在
`rgb(10 15 27 / .4)` 上对比度仍有 ~9:1，远超 WCAG AA。

**为什么允许 0 而「插画强度」下限是 0.1**：插画强度调到 0 等于背景图不可见但
`background-image` 还在（白占一层合成），语义上应该改用「纯色」模式；而水膜调到 0
是合法且常用的诉求（「我要看清插画」），不该被下限挡住。

### 7.5 精修层：只在「宿主画对了、但不到位」的地方动手

`src/15-polish.css`（P1–P7）不新增结构、不改几何，只补质感。两条纪律：

- **亮色规则必须写 `body:not([data-ds-dark-theme])`**：`data-ds-dark-theme` 挂在
  `body` 上，写在 `<html>` 上的 `:not()` 永远为真 —— 开发期那版会话头因此把暗色界面
  涂出一条 75px 灰白亮带。
- **模糊只在插画模式开**：渐变/纯色模式的画布本身干净，再叠 `backdrop-filter` 只会
  让标题发毛，所以 `backdrop-filter` 规则都挂在 `[data-dsh-furina-bg="art"]` 下。

---

## 8. 版本之间

| 版本 | 主题 |
| --- | --- |
| 0.1.0 | 单套配色 + 布局 + 动效，自插 `ui-skin-furina-style` |
| 0.2.0 | 设置进 DeepSeek 设置界面、默认插画背景、修输入框悬空 |
| 0.3.0 | 细节层（代码/表格/工具行/占位）；删掉三个「替别的插件做内容策略」的开关 |
| 0.4.1 | 精修层、宿主自带导航条上色 + `Alt+↑/↓`、运行状态小胶囊、水膜滑块、窗口按钮去黑底 |
