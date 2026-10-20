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

`src/15-polish.css`（P1–P9）不新增结构、不改几何，只补质感。两条纪律：

- **亮色规则必须写 `body:not([data-ds-dark-theme])`**：`data-ds-dark-theme` 挂在
  `body` 上，写在 `<html>` 上的 `:not()` 永远为真 —— 开发期那版会话头因此把暗色界面
  涂出一条 75px 灰白亮带。
- **模糊只在插画模式开**：渐变/纯色模式的画布本身干净，再叠 `backdrop-filter` 只会
  让标题发毛，所以 `backdrop-filter` 规则都挂在 `[data-dsh-furina-bg="art"]` 下。

---

## 8. 0.5.0：两处「用户能看见但宿主不管」的尺寸与颜色

### 8.1 图片大小：两条渲染路径，所以两个滑块

同一个聊天流里的图，**来源不同、渲染方也不同**：

| 谁发的 | 渲染方 | DOM 锚点 | 原始约束 |
| --- | --- | --- | --- |
| 用户 | 本插件 vendored 的 `dsh-easyrewrite` 补丁 | `[data-dsh-easyrewrite="user-images"] img[data-dbe-msg-image]` | 内联 `max-height:280px` |
| 助手 | 宿主 `@deepseek-ai/dsh-client-ui-chat` | `button[class*="_imageButton_"] img` | `max-height:360px; max-width:min(100%,640px)` |

两个关键差异决定了写法：

- **用户图必须 `!important`**：补丁给的是**内联** `style="max-height:280px"`，
  非 important 的内联样式优先级高于任何选择器，只能用 `!important` 压。
  （也可以改补丁让它读 CSS 变量，但那意味着再维护一个包、再多一次重启；主题侧
  `!important` 是更小的一步。这个容器本来就出自本插件参与的补丁，不算「改第三方 DOM」。）
- **助手图不能 `!important`**：宿主用的是 class 选择器（`.` 特异性 0,1,0），我们
  的 `html[data-*][data-*] [data-slot=…] button[class*=…] img` 已经是 (0,3,2)，
  不用 !important 就压得住；少一个 !important 就少一个将来宿主改结构时打架的点。
- **锚点用 class 的「子串」而不是全名**：`_imageButton_1ypvv_446` 里 `1ypvv` 是
  构建哈希（宿主每次构建都变），`_imageButton_` 才是人写的那半。所以写
  `[class*="_imageButton_"]`。这是本插件第二次用子串匹配（第一次是
  `[class*="_frame"]`），两处都写清了理由。

默认值：用户图 240（原来是 280，反馈偏大）、助手图 360（= 宿主原值，不动）。
范围 100–480 / 120–600、step 20 —— 太小会看不清，太大会把整屏挤掉。

### 8.2 引用块：颜色分层一定要在 `body` 上做

改动前：`background: color-mix(in srgb, var(--fh-brand-wash) 42%, transparent)`。
`--fh-brand-wash` 是 `#dce3f7`（淡薰衣草），**只在亮色块里声明过，暗色块漏了**。
于是暗色界面里那块引用是「42% 的亮色水膜压在深底上」＝ 一块泛白的奶灰，
用户第一眼就觉得违和。

修法不是把这个 token 调暗了事（`--fh-brand-wash` 还被表头水膜、动效环境光斑用），
而是**给引用块单独分一层颜色**：

- `data-dsh-furina-quote` 四档（`water` / `pearl` / `neutral` / `none`）写在 `<html>`；
- 具体色值 `--fh-quote-tint` 由 `html[data-dsh-furina][data-dsh-furina-quote="…"] body`
  规则给出；
- 浓度 `--fh-quote-alpha` 由 JS 写内联变量；CSS 里
  `color-mix(in srgb, var(--fh-quote-tint) var(--fh-quote-alpha, 32%), transparent)`。

**为什么定色规则要挂在 `body` 而不是 `<html>`**：这是本设计里最容易踩的一个坑。
`--fh-quote-water` 的定义是 `var(--fh-brand-wash)`，而 `--fh-brand-wash` 的暗色值
覆盖在 `body[data-ds-dark-theme]` 上。CSS 自定义属性的 `var()` 是在**声明它的那个
元素**上完成替换的：如果 `--fh-quote-tint: var(--fh-quote-water)` 写在 `<html>` 上，
替换时读到的就是亮色值（那时还没走到 body），传到 body 已经晚了。把定色规则整体挪到
`body` 上，它就能读到 body 自己的暗色覆盖。

顺带修掉同源泛白：暗色块补了 `--fh-brand-wash:#263353` 和 `--fh-pearl:#2c3a5e`。
这两处之前也是「暗色下沿用亮色值」，只是影响面小（表头水膜 26%、动效光斑 34%），
没人注意到。

### 8.3 为什么要另起一个实例测试

之前每个版本都是在用户正在用的桌面实例里 `location.reload()` 验证的。问题是：

- 本插件是**构建产物缓存**的（见 §6「已知取舍」第 6 条），每次 rebuild 都要完整重启应用才能加载新
  代码；而在用户正在用的实例里重启，会把人家正在跑的任务打断。
- DevTools 探针要靠点坐标（`evaljs4.ps1` 点 Console 提示行）和剪贴板回读，
  窗口一移动就失效，还得反复抢焦点。

0.5.0 起换成隔离测试：

- `DSH_HOME=C:\Users\11515\.dsh-test`，profile 名 `furina-test`，只加载
  `dsh-base` + `dsh-web-app` + `dsh-furina-style`（+ vendored `dsh-easyrewrite`），
  不装 claude-style / 皮肤中心 / pet / memsearch，干扰面最小；
- `profiles\node_modules` 用 junction 指回真实 `.dsh\profiles\node_modules`，
  避免再复制 1.1 GB；
- 探针走 headless Edge 的 CDP（`--remote-debugging-port=9333`），
  `Runtime.evaluate` 直接拿返回值，不需要剪贴板、不需要焦点。截图用
  `Page.captureScreenshot`。

**踩过的坑**：`ln -s` 在 Git-Bash on Windows 上对目录会退化成**复制**（一次
1.1 GB）；必须用 `cmd //c "mklink /J <绝对目标> <绝对源>"`，且两个参数都必须是
绝对路径（相对路径报「系统找不到指定的路径」）。

---

## 9. 0.6.0：让连续多图横排，而不碰 React 的树

### 9.1 三条渲染路径，三种改法

连续多张图在本机上有三条完全不同的渲染路径，容器结构、谁负责、能不能改都不一样：

| 来源 | 容器 | 谁渲染 | 改法 |
| --- | --- | --- | --- |
| 我发送的图片 | `[data-dsh-easyrewrite="user-images"]` | 本插件维护的 easyrewrite 补丁 | 内联 `flex-direction: column` → `row`（必须 `!important`） |
| AI 结构化图片块 | `div[class*="_gallery"][data-align]` | 宿主 `ui-attachment` 的 `ImageGallery` | `flex-wrap: wrap` → `nowrap` + `overflow-x: auto`，缩略图 64×64 → 按比例 |
| AI markdown 图 | `p` 里的多个 `button[class*="_imageButton_"]` | 宿主 markdown 渲染器 | 段落改 inline 流（`white-space: nowrap`）+ 横向滚动 |

宿主其实已经把**连续的 image block 合并成一次 `renderSlot("conversation.chat.message.images")`**
（`dsh-client-ui-chat` 的 `AssistantNodeView` 里有个 `while (next.kind === "image")` 的
收集循环），所以结构化图片块本来就是「一个容器里的多个兄弟」，纯 CSS 就能排成一条。
这条发现让 0.6.0 不需要新建任何 DOM。

### 9.2 为什么 markdown 多图段落不能用 flex

最自然的写法是给那个 `<p>` 加 `display: flex`。但它有副作用：**「一句话 + 多张图」
也是同一个段落**，而纯文本节点不是元素、`:has()` 看不见它，所以
`:not(:has(> :not(button)))` 这类守卫拦不住 —— 那段文字会被当成匿名 flex item，
实测第一个图按钮被顶到 x=170（文字宽度）。

改用 inline 流（`display: block` + `white-space: nowrap`）就没有这个问题：文字仍然
是行内内容，自然留在行首；按钮之间的 `
` 文本节点在 `nowrap` 下不再换行，于是所有
图排成一行，`overflow-x: auto` 接管横向滚动。两种方案在纯图段落里视觉一致，但只有
inline 流不改变文字语义。仍然保留「元素子级全是图」的守卫：段落里还有 `<a>` /
`<strong>` 之类元素时整段不接管。

另一个坑：宿主 `aU` 在没有 fileImages provider 时渲染的是**裸 `<img>`**（不包
`button`），所以 `:has()` 判据要同时认 `p > button` 和 `p > img` 两种形态。

### 9.3 缩略图尺寸为什么跟「AI 图片最大值」联动

宿主 gallery 的 tile 写死 64×64（`object-fit: cover` 的方块缩略图），单独给一套
「缩略图大小」滑块会多出一个需要解释的概念。并列模式下把 tile 高度取自 0.5.0 就有的
`--fh-img-ai-h` 的 0.6 倍、宽度按图片比例，于是用户调「AI 发送的图片」时，
**点开的大图上限和缩略带的高度是一起变的**，语义上是同一件事。

### 9.4 不做的两件事

- **不搬 DOM**：这些节点全部由 React 管理，`insertBefore` / `appendChild` 会触发
  `HierarchyRequestError`，而且主题本来就不该改宿主的树。
- **不合并空行分隔的多段**：`![](a)` 与 `![](b)` 之间有空行时是**两个 `<p>`**，
  中间隔着段落边距。CSS 无法把两个兄弟段落变成一个滚动容器（除非用 `display:
  contents` 之类会破坏语义的写法），所以这种情况保持原样 —— 而这也符合 markdown
  作者的意图：空行本来就是在分段。

---

## 10. 0.7.0：把「宿主其实给了值，但值不对」的那一层补齐

前几版处理的都是「宿主没有」或「宿主有但没做透」。这一版是第三种情况：
**宿主给了 token，还给了值，但那个值在中性灰阶里** —— 换到任何一套有色相的
皮肤里都会跳出来。

### 10.1 判断一个别名 token 该不该覆盖

宿主 CSS 里引用的 `--dsw-*` 有一百多个是 alias 层。补色前先做四步：

1. 用 `getComputedStyle(document.body).getPropertyValue(...)` 把候选 token 的
   **live 计算值**全拉一遍 —— 不要读源码，源码里的值要经过两层 `var()` 才落地。
2. grep 宿主 CSS，数每个 token 的**真实消费点**：
   `grep -c 'var(--dsw-alias-button-elevated-fill)' tests/extracted2/cssdump/*.css`
3. **0 处消费的一律不覆盖** —— `settings-card-stroke`、`onboarding-*`、
   `file-diff-*`、`markdown-code-segment-*` 都是「定义了但没人读」的僵尸
   token，覆盖只会让 diff 变长。
4. 剩下的按消费点的**可见面积**排优先级。这批里最大的是侧栏「新会话」按钮
   （`_2H3hWW_newSession`，38px 高），它吃 `button-elevated-fill`。

判别式：**如果一个 token 的宿主值落在中性灰阶（`--dsw-static-neutral-bluish-*`），
而消费点是「用户会长时间看着的一块面积」，就该换。** 纯交互反馈（hover /
active）另当别论，只需保证它在有色背景上不脏。

### 10.2 一个坑：暗色下 `button-primary-hover` 是近白

宿主的 alias 定义（`tests/extracted2/cssdump/alias_tokens_dark.css`）：

```css
--dsw-alias-button-primary-fill:  var(--dsw-alias-brand-primary);
--dsw-alias-button-primary-hover: var(--dsw-static-neutral-bluish-100);  /* #ebeef2 */
```

主按钮按下时底色从品牌色跳到**近白** —— 在亮色主题里这是合理的「变浅」方向，
但在暗色主题里它就是「按钮突然变成一块白斑」。覆盖成 `#93a8e0`（品牌色提亮版）。
同类问题：
- `button-info-fill` 亮 `#4176e6` / 暗 `#7aaaff`（DeepSeek 蓝），和我们的蓝紫
  `#4a5fa8` / `#7f96d2` 并排就是两种蓝；
- `switch-thumb` 暗 `#adb2b8`（中性灰），开关圆点应该是 `#dbe2f2`；
- `label-shimmer`（「深度求索中」扫光的基色）暗 `color-mix(#fff 45%)`，
  在蓝底上扫出来是一道白痕。

还有一个**变量作用域**的坑：这批 token 最初写成 `var(--fh-brand)`，而
`--fh-brand` 只在公共块定义了一次（亮色的 `#4a5fa8`），暗色块没有覆盖它 →
暗色下 `button-primary-fill` 会解析成亮色值。改成在这些 token 里引用
`var(--dsw-alias-brand-primary)`（它在自己的亮/暗两块都定义过）才正确。

### 10.3 右侧边栏：不是「没接管」，是「接管了但看起来没接管」

这里差点被误判，值得记一笔：

```
[data-dockkit-pane] 计算背景 = rgb(16, 22, 36)
--dsw-alias-bg-base         = #101624      ← 一模一样
```

宿主规则 `._tabHost_6nhg2_162:not(._float_6nhg2_156){background:var(--dsw-alias-bg-base)}`
**一直是被我们掌控的**。问题不在值，在「一块 576×782 的实色矩形贴在插画背景上」
这个事实本身：主内容区的插画从右边被一刀切断，边界处没有任何过渡。

所以修法不是改 token，而是改这个节点的**材质**：

```css
background: color-mix(in srgb, var(--fh-surface-base) 86%, transparent);
backdrop-filter: blur(24px) saturate(140%);
box-shadow: inset 0.5px 0 0 0 var(--dsw-alias-border-l2);
```

三条纪律：

- **86% 是下限**。再低，终端里的等宽文字在插画上会开始发飘（对比度不够）；
  再高，插画就白透了。这个数字是在隔离实例里逐档截图定的。
- **`backdrop-filter` 必须有条件**：关掉插画（渐变 / 纯色底）时没有东西可模糊，
  `blur` 只会白烧 GPU；减弱动效时同理。两条退路都要写。
- **圆角只给贴边 dock**（`:not([class*="_float_"])`）。浮动面板本来该是完整
  圆角卡片，再补左侧圆角会变成「缺一个角」。

被否决的方案：把 `[data-dockkit-pane]` 换成 `--dsw-alias-bg-layer-1`（更亮的
层次色）。否决理由是那样它就从「水面上的一块」变成「另一个面板」，和主内容区
争层次 —— dock 是次级表面，不该比正文更亮。

标签条同理：宿主激活标签用 `--dsw-alias-markdown-tag`（一块中灰蓝），和输入卡
的选中态不是同一个语汇。改成 `color-mix(brand-primary 18%)` + 0.5px 内描边。

### 10.4 修一条从未命中的规则

`50-details.css` 的 D6 之前写：

```css
[data-tool][data-state="error"],
[data-tool][data-state="failed"] { ... }
```

实测宿主 `[data-tool]` 的 `data-state` 取值分布：

```
ok 2701 | error 20 | running 1
```

**`failed` 从来不存在，`success` 也不存在**（成功态叫 `ok`）。那条分支写了三个
版本、一次都没命中过 —— 因为它和 `error` 写在一起，「看起来没坏」所以没人发现。

现在改成 `running`：运行中的工具行给一层 8% 品牌色的呼吸水膜
（2.4s，`--fh-dur-breathe`），减弱动效时退化成静态 8%。这是宿主说不出来的一种
状态 —— 它只有 `ok` / `error` 两种视觉。

更一般的教训：**写状态选择器之前，先把 live 上的取值分布拉一遍**。
`document.querySelectorAll('[data-tool]')` 再统计 `dataset.state` 的频次，
比读组件源码快也准。

### 10.5 不做的事：第三方气泡

`dsh-easyrewrite` 的用户气泡是它自己写的内联 `bubbleStyle`
（`rgba(255,255,255,0.08)`），按 0.3.0 定下的原则不接管 —— 主题只负责自己的
表面，不替别的插件做内容策略。这条线在 0.3.0 已经用「删掉三个开关」付过学费。

---

## 11. 0.7.1：一条全局规则在 28px 高的盒子里捅出的三个洞

用户报的是三个问题：右上角三个图标按钮没和左边标签中心对齐、「+」偏下、
「标题为什么不是完全展开的，怎么还有滚动条」。它们是同一个病根的三张脸。

### 11.1 病根：`* { scrollbar-width: thin }` 压掉了宿主的 `none`

0.4.x 起布局层有一条全局细滚动条规则：

```css
html[data-dsh-furina][data-dsh-furina-layout="on"] * {
  scrollbar-width: thin;
  scrollbar-color: ...;
}
```

特异性 0,2,1。而宿主在 dockkit 里只给**一个**元素写了 `scrollbar-width:none`：

```css
._stripTabs_6nhg2_257 {
  display:flex; flex:0 1 auto; align-items:center; min-width:0;
  overflow-x:auto; overflow-y:hidden; scroll-behavior:smooth;
  scrollbar-width:none;   /* ← 全文唯一一处 */
  touch-action:none;
}
```

0,1,0 < 0,2,1，所以它输了。`overflow-x:auto` 的标签条于是真的长出一条
10px 高的横向滚动条 —— 这条条就是用户说的「怎么还有滚动条」。

### 11.2 连锁反应：5px 的错位

`_tabStrip_` 是 `height:28px; padding-top:10px; box-sizing:content-box`
的 flex 容器（`align-items:center`）。它的子级分两类：

- `_stripTabs_`（标签 + 「+」+ 分隔线）：被滚动条撑到 `offsetHeight:38`
  （28 内容 + 10 滚动条），内容盒落在 y=5..33，**标签中心 y≈19**；
- `_stripChrome_` / `_iconButton_`（右上角三个按钮）：高度就是 28，
  直接在父级内容盒里居中，**中心 y=24**。

差 5px（用户截图按 1.5 DPR 量到约 10 屏幕 px），看起来就是「没对齐」。
「+」在 `_stripTabs_` 里面，所以跟着标签一起被顶高了 5px —— 它其实和标签
是共线的，**用户感知到的「+ 偏下」是它相对右侧按钮偏下**。

对照实验（隔离实例里注入临时样式）：`scrollbar-width:none` +
`::-webkit-scrollbar{display:none}` 之后，`offsetHeight 38→28`、
`tabCenter 19→24`、`chromeCenter 24` —— 完全重合。**一条规则修好三件事。**
这个实验值得记住：先做「只改一条」的对照，再决定要不要补第二个补丁。

### 11.3 为什么只收窄到 dock 面板内

全局细滚动条是这套皮肤的语言（正文、侧栏、代码块、弹层都靠它统一），
不能为了一个 28px 的标签条把它撤掉。所以 K6 的三条规则都带
`[data-dockkit-pane]` 前缀 —— 宿主哪天改了 dockkit 的类名，这条规则最多失效，
不会外溢到别处。

顺带记一条：`_slotCaret_6nhg2_346` 的 `:before` 里写着
`var(--dsw-alias-brand-primary-new-colorprimary-new-color)`，这是宿主自己的
字符串拼接 bug（token 名被拼了两遍），实际解析失败、颜色无效。**不要照着它
去补 token** —— 那是个永远不会被读到的名字。

### 11.4 百分比 `max-width` 在这种布局里是死路

标签宽度上限从宿主的 `170px` 放到 `280px` 之后，长文件名能完整展开了。
但中间试过写成 `max-width: min(46%, 280px)`，**反而更窄**：标签 118.7px、
标题只剩 99px。原因是标签的包含块 `_stripTabs_` 是 shrink-to-fit 的 flex
item（`flex:0 1 auto`），它的宽度本身取决于内容宽度，于是百分比的解析基准
是「它已经收缩之后的结果」：214.5 × 46% ≈ 98.7px，正好把标题卡死。

**包含块宽度由内容反推（shrink-to-fit / fit-content / 表格列）时，百分比
尺寸没有可用的基准，只能写绝对长度。** 这类循环依赖在 flex + 溢出组合里
很常见，改之前先用 `getBoundingClientRect()` 量一眼实际宽度。

---

## 12. 0.7.2：「字装得下却被渐隐」—— 宿主的 mask 不看溢出

### 12.1 症状与两个叠加原因

0.7.1 把标签宽度从 280px 放开后，长文件名能展开了，但用户立刻发现
「标题框右边又被吞了」：文字末尾没有省略号，而是**渐渐消失**，后面紧挨着
关闭叉。

实测（桌面实例、dock 一条标签、文本 `furina-skin-improvement-plan.md`）：

```
tab    230.5px  x=861.7 .. 1092.2
title  210.5px  x=871.7 .. 1082.2   padding: 0 10px（标签的）
text   194.5px  right = 1066.2      ← 文本自然宽，Range 量的
mask   linear-gradient(to right, #000 calc(100% - 16px), transparent)
close   20x20   x=1068.2 .. 1088.2  position:absolute; top:4px; right:4px
```

两件事叠在一起：

1. **宿主在 active / hover 态无条件挂 mask**：
   ```css
   ._tabActive_6nhg2_346 ._tabTitle_6nhg2_389,
   ._tab_6nhg2_134:hover ._tabTitle_6nhg2_389,
   ._tab_6nhg2_134:focus-within ._tabTitle_6nhg2_389 {
     mask-image: linear-gradient(to right,
       black calc(100% - 30px), transparent calc(100% - 14px));
   }
   ```
   那 30px 是给绝对定位的关闭叉让位的。宿主另有一条
   `[data-dockkit-tab-clipped]` 规则（`calc(100% - 16px)`）才代表「真的溢出」，
   但 active 这条**不检查溢出就直接生效**。实测全页 `clippedEls = 0`。
2. **0.7.1 放宽标签后大多数标题其实装得下**：标题盒 215.5px、文本 194.5px。
   宿主那条渐隐起点 = 1082.2 − 30 = 1052.2，而文本右边界 1066.2 —— 末尾
   14px 落在渐隐区、再被关闭叉压掉 14px，「右边被吞」是这两处之和。

### 12.2 修法：还文字 14px，但保留关闭叉的让位

```css
html[data-dsh-furina][data-dsh-furina-layout="on"]
  [data-dockkit-pane] [class*="_tab_"]:not([class*="_tabQuiet_"])
  [class*="_tabTitle_"] {
  padding-inline-end: 16px;
  mask-image: linear-gradient(to right, #000 calc(100% - 16px), transparent);
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 16px), transparent);
}
```

三个决定：

- **为什么是 16px**：关闭叉 20px 宽、`right:4px`，真正需要让位的是
  `20 − 标签左 padding 10 ≈ 10px`，再留呼吸 → 16px。相对宿主的 30px
  多还给文字 14px。
- **为什么必须同时加 `padding-inline-end`**：只把 mask 收紧到
  `calc(100% - 16px)`，文字会继续向 × 底下延伸。加了 padding 后标题的内容盒
  右边界正好等于渐隐起点，**文字一毫米不丢**。A/B 实测：
  ```
  clean : pad=16 tabW=230.5 textRight=1066.2 fadeStart=1052.2 lost=true
  fixed : pad=16 tabW=230.5 textRight=1066.2 fadeStart=1066.2 lost=false
          close.left=1068.2 → 文字与 × 间距 2px
  ```
- **为什么加 `:not([class*="_tabQuiet_"])`**：首页那个「开始」标签是 quiet
  变体，没有关闭叉，宿主明确写 `mask-image: none`。给它塞 16px padding
  是无中生有地挤掉可用宽度。

超长标题仍然会渐隐（`scrollWidth > clientWidth` 时文本被裁剪），这是宿主的
本意 —— 我们的目标是「**装得下就别渐隐**」，不是「永远不渐隐」。

### 12.3 一条可复用的判别法：mask 类规则要单独问「它在什么条件下成立」

宿主的裁剪提示通常有两套：一套按真实溢出开关（属性选择器
`[data-*-clipped]`），一套按交互状态无条件挂上（`:hover` / `.*Active`）。
**后者在「容器被主题改宽」之后会变成纯粹的损失** —— 它假设的几何
（窄标签必然溢出）被我们的 `max-width` 改掉了，但规则本身不知道。

所以改完任何宽度/字号之后，顺带用 `Range.selectNodeContents()` 量一遍
`textRect`，和 mask 的渐隐起点比一下：`textRect.right > fadeStart` 就是
既损失可读性、又没有换来任何裁切保护的无用渐隐。

---

## 13. 0.8.0：不搬 DOM 也能让按钮住进窗口标题栏

两件事，一件是「把宿主已经画好的东西挪到它该在的地方」，另一件是
「宿主把两层画成了一层，把它拆开」。两条都只用了 CSS 与 `env()`。

### 13.1 为什么标题栏那条规则可以没有 JS

claude-style 的 headerBand 是一整段 JS：量窗口控件宽、量标题宽、量标签条的
居中点，算出一个「放得下吗」的布尔值，再逐项 `style.setProperty` 写六个变量，
窗口 resize 时重算一遍，还要处理「只抬标题不抬按钮」「两边都放不下就都不抬」
这些分支。

在我们这里，等价信息有一半是 CSS 直接给的：Electron 在 Windows 上启用
`window-controls-overlay` 之后，

- CSS 环境查询：`env(titlebar-area-width)` = 1143px、`env(titlebar-area-height)`
  = 40px（本机 1280 宽窗口）；
- JS 侧：`navigator.windowControlsOverlay.getTitlebarAreaRect()` → 同一组数。

`100vw − titlebar-area-width` 就是右侧三个窗口按钮的宽度（137px）。于是
「贴着窗口按钮左边 8px、在 caption row 里垂直居中」可以写成：

```css
top: calc(env(titlebar-area-height, 40px) / 2);
right: calc(100vw - env(titlebar-area-width, calc(100vw - 140px)) + 8px);
transform: translateY(-50%);
```

两个 `env()` 都带兜底值：`titlebar-area-height` 缺省 40px（就是宿主
`--dsh-windows-titlebar-height` 的值）、`titlebar-area-width` 缺省按
「窗口宽 − 140px」算（claude 用的也是 140px 这个兜底常量）。所以即使
`window-controls-overlay` 不可用，按钮也只是「距右 148px」，不会跑到窗口外。

**放弃的 JS 版本**：本来可以学 claude 量一次写变量，但那样就得挂 resize 监听、
在设置面板里接开关、还要处理「插件卸载时把六个变量删干净」。纯 CSS 版本
只有一个开关属性 `data-dsh-furina-band="on|off"`，卸载即消失。

### 13.2 真正的坑：`backdrop-filter` 会给 `fixed` 后代建 containing block

第一次实测，按钮确实变成 `position: fixed` 了，但落在 y=46 而不是 y=6 ——
正好是「header 顶部 40px + 20px 的一半」。原因是 0.4.1 给会话头加的毛玻璃：

```css
header:has([data-conversation-tabs]) { backdrop-filter: blur(10px) saturate(125%) }
```

**`backdrop-filter` 和 `transform` / `filter` 一样，会把元素变成其
`position: fixed` 后代的 containing block。** 于是 `top: 20px` 变成
「相对 header 顶部的 20px」。

修法不是删掉毛玻璃，而是把它从 header 本体挪到伪元素：

```css
header:has([data-conversation-tabs]) { backdrop-filter: none; position: relative; z-index: 0 }
header:has([data-conversation-tabs])::before {
  content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  backdrop-filter: blur(10px) saturate(125%);
}
```

视觉上没有差别（伪元素铺满 header、内容画在它上面），但 header 本体不再是
containing block，fixed 恢复相对视口定位。这是本版最值得记住的一条：
**做「把宿主元素抬到窗口层」这类效果之前，先查祖先链上有没有
`backdrop-filter` / `transform` / `filter` / `contain`。**

顺带确认了两件「看起来会挡路、其实不挡」的事：

- 祖先链上的 `overflow: hidden`（对话根、centerCol、frame 三层都有）
  **裁不到 `position: fixed`** —— fixed 的 containing block 是视口，
  不是最近的可滚动祖先（那是 `position: absolute` 的规则）。
- 页面里没有任何 `-webkit-app-region` 冲突：宿主的拖拽声明只在
  `html[data-platform=darwin]` 下写，Windows 上全页 `app-region: none`。
  保险起见规则里仍写了 `no-drag`。

### 13.3 输入框：宿主把两层画成了一层

宿主的结构是「卡片 + 内容」，但**只给卡片画了造型**：

```css
.RlGAzG_card   { background: var(--dsw-specific-input-major); border-radius: 22px;
                 box-shadow: var(--dsw-elevation-soft); padding-top: 8px; gap: 12px }
.RlGAzG_scroll { max-height: …; margin-right: 4px; overflow-y: auto }  /* 无底、无边、无内边距 */
```

所以输入文字、工具行、发送键全都陷在同一块底里，视觉上分不出「你在打字的
那一层」和「操作那一层」。

claude-style 的解法是**把造型从卡片下移到输入区**：卡片拉平成透明容器，
`[data-input-scroll]` 自己拿一张 14px 小卡（底 + 0.5px 边 + 阴影），工具行
浮在卡下面的画布上。0.8.0 照这个结构重写，但颜色全用水色令牌：

- 卡片的 `--dsw-elevation-soft`（一圈 `0 0 0 1px` 的描边阴影）在 `framed`
  模式下让位给输入区自己的 `0.5px` 实边 —— 一层阴影 + 一层描边重叠会脏；
- `:focus-within` 不换底色，只把边线提到 46% 水色 + 3px 的 12% 光晕，
  与 0.7.x 的焦点环语言一致；
- 亮色下阴影换成 `rgb(44 58 115 / .08)`（蓝墨，不是纯黑）加一道内高光，
  暗色保持 `rgb(0 0 0 / .18)`。

两个安全前提是实测出来的：卡片里那 9 个 `[data-slot]`
（`overlay` / `attachments` / `permission` / `plan` / `left` / `right` /
`model` / `model.label` / `activity`）**全部是 `display: contents` 的空壳**，
rect 恒为 0×0，所以给卡面改 background/gap 不会让任何插槽错位；卡片的最后
一个子级恒为工具行 `div.RlGAzG_row`，`> :last-child` 选择器因此稳定。

### 13.4 两个开关的位置

两条都是「宿主本来也能用，只是不够好」的改进，所以默认开、可关：

| prefs 键 | 默认 | html 属性 | 关掉后 |
| --- | --- | --- | --- |
| `headerBand` | `true` | `data-dsh-furina-band="off"` | 按钮回标题行右端（0.7.x 原样） |
| `composerFramed` | `true` | `data-dsh-furina-composer="host"` | 输入框回宿主一整块大卡 |

关掉走的是「属性不匹配 → 整条规则不生效」，不是 `display: none` 或重置样式，
所以不存在「关掉之后还残留一半」的状态。

---

## 14. 0.9.0：9px 的幻影溢出，与一根会滑动的光标

一条旧规则在 250px 宽的盒子里撑出 9px，把宿主的渐隐诱发了；另一件事是给
`contenteditable` 画一根会滑动的光标。

### 14.1 9px 从哪来：`::before` 装进 `overflow: auto` 容器的代价

0.4.1 的精修层 P2 想给宿主标签补一层悬停水膜，写法是「绝对定位伪元素往外撑」：

```css
[role="tab"]::before { content: ""; position: absolute; inset: -5px -9px 4px -9px; }
```

这套写法在会话头的两个标签上没问题 —— 父级 `overflow: visible`，伪元素溢出
多少都不进布局。但右侧 dock 的标签**也是 `role="tab"`**（live 实测
`roleTabTotal = 3`：对话、轨迹、dock 标签），它的父级 `_stripTabs_` 是
`overflow-x: auto` 的滚动容器：伪元素向右溢出的 9px 直接变成 `scrollWidth`
的一部分。

于是 `clientWidth 251 / scrollWidth 260`。宿主看到「还有 9px 可以滚」，就给
整条 strip 挂上 24px 的右端渐隐（`[data-dockkit-strip-scroll=end]` 那条），
把标签文字最后几个字和关闭叉一起吃掉。

排除过程（全部 live 注入）：改标签宽度 → 仍 +9；去掉标题右内边距 → +9；
隐藏关闭叉 → 不变；清掉 margin → 不变；`overflow: hidden` → 不变；
`data-dsh-furina-layout="off"` → **251 / 251，幻影消失**。
最后用 `[data-dockkit-pane] [role="tab"]::before { content: none }` 一击命中：
`251 / 251`，恢复 `content` 后回到 `260`。

**判别法**：给一个元素加带负 inset 的绝对定位伪元素之前，先看它的**父级**
有没有 `overflow` 不等于 `visible`。`overflow: visible` 的溢出是「画出去但不算数」，
`overflow: auto` 的溢出是「既画出去又算进 `scrollWidth`」。

修法是两层：

1. P2 五条规则全部收窄到 `[data-conversation-tabs] [role="tab"]` —— 只给真正
   想要的对话 / 轨迹标签；
2. K8 独立兜底：单标签的标签条 `mask-image: none`。这一条与 P2 的修复相互独立，
   覆盖「将来又有别的东西撑出溢出」的情况。

为什么 0.7.2 没修好？因为 0.7.2 只改了**标签自己**的 mask（渐隐起点从右 −30px
收到右 −16px），而真正盖住文字的是**标签条那一层**的 24px 渐隐。眼睛看到的是
「文字淡了」，代码里是两层 mask 叠加，只改一层等于没改。

### 14.2 平滑光标：为什么不能纯 CSS，也不能只抄一半

claude-style 的输入光标是自绘的：系统光标 `caret-color: transparent` 藏掉，
换一层绝对定位的 2px div，读 `selection.getRangeAt(0).getClientRects()` 的
**最后一个矩形**定位置，靠 `transition: transform 80ms` 滑动，每次落位后把
闪烁动画的 `currentTime` 归零。

为什么不能纯 CSS？光标位置不是任何 CSS 表达式能算出来的量 —— 它依赖浏览器
内部的文本排版与选区，只有 Selection API 拿得到。

我们照抄结构，但重写了三处：

**（1）安全阀优先于好看。** 藏系统光标是唯一「一旦失败用户就没法打字」的操作。
所以 `caret-color: transparent` 挂的不是配置项，而是 JS **成功定过位之后**才写上的
`[data-dsh-furina-caret-active]`：

```css
html[data-dsh-furina][data-dsh-furina-caret="on"]:not([data-dsh-furina-handoff])
  [data-composer-input][data-dsh-furina-caret-active] { caret-color: transparent; }
```

任何一步失败（父级 `display: contents`、selection 不可用、测不到矩形），这个
属性就不会出现，系统光标原样保留。**最坏情况是「特性没生效」，不是「光标没了」。**

**（2）三级测量兜底。** 宿主的输入框是 lexical 的 `contenteditable`，空内容时
selection 的矩形高度是 0。所以顺序是：selection 末矩形 → 前后各取 1 字符的
probe range → 内容盒左上角，高度回落到 20px。

**（3）跟事件走，不轮询。** 监听 `selectionchange` / `beforeinput` / `input` /
`keydown` / `keyup` / `pointerdown` / `scroll` / `resize` / `compositionend`。
`compositionend` 是给中文输入法的 —— 拼音候选期间 selection 停在组合区，
`selectionchange` 在候选落定那一刻不一定触发。

首次显示时先把 `transition-property` 设成 `none`、写完位置、下一帧再恢复，
否则第一帧会从 (0, 0) 滑到光标处。claude-style 里也是同一个处理 —— 这是
「首帧不飞入」的标准写法。

### 14.3 这一版没有做的事

- 没做「打字时文字淡入 / 打字机」。claude-style 里没有这类动画（`typing` /
  `typed` / `text-in` 在整个 bundle 里 0 命中），用户说的「平滑输入效果」
  就是光标那一层的位移 + 闪烁。
- 没动 lexical 的 `contenteditable` 自身样式（`padding` / `line-height` 由
  0.8.0 的 C2 负责）—— 光标层是它的兄弟节点，不参与输入框排版。

---

## 15. 0.10.0：把输入区按 claude 的几何重排

这一版没有新功能，改的全是**位置**和**重量**：输入卡里那排按钮原来挂在卡外面
（工具行），现在要搬进卡面里；工具行原来会换行，现在钉死成一行；设置页原来
是一叠卡片，现在摊平成行 + 发丝线。

验收标准是用户一句话给的：

> 「这个按钮也仿照 claude 皮肤做吧，然后这个设置部分也按照 claude 皮肤做，
> 然后加号放到输入框左边，做成方形的，权限部分放在底部，仿照 claude 皮肤的，
> 模型选择也放在底部仿照 claude，发送消息按钮做进输入框里，参考 claude 那样。」

拆开是五件事，加一件顺手补的（窗口 chrome）。

### 15.1 工具行为什么必须钉成单行

**症状**：窗口一窄，「模型」和「发送」就被挤到第二行，整张输入卡的高度在
83 / 111 之间跳；光标所在那一行会跟着上下蹿。

**根因**：宿主 `.RlGAzG_row` 是

```css
flex-wrap: wrap; justify-content: space-between; gap: 12px; padding: 2px 8px 6px;
```

`space-between` + `wrap` 意味着「左右两组各贴一边，中间的空隙靠剩余空间
撑开」；空间不够时不是压缩，而是把右边那组整个折到下一行。行高因此是一个
随窗口宽度阶跃的函数。

**实测**：claude 的工具行是恒定单行 ——

```css
flex-wrap: nowrap; align-items: center; gap: 8px;
padding: 0 4px; height: 28px; min-height: 28px;
```

**修法**（C6）：照抄这组数字，**但 `margin-top` 显式归零**。claude 原版是
card `gap: 0` + 工具行 `margin-top: 6px`；而 0.8.0 的 C1 已经把 card 的
`gap` 定成 8px，再叠 6 就是 14px，会把后面 C7 / C8 的锚点算式整个推翻。

于是有了一条**恒等式**，C7 / C8 直接引用它：

```
card 底边 − 卡面 [data-input-scroll] 底边
  = 工具行 28px + C1 的 gap 8px
  = 36px
```

**取舍**：宿主给 `_trailing` 写的是**内联** `margin-left: 317px`（JS 量出来
的），那是 `space-between` 的替代品。改成 `nowrap` 之后它会把右侧整组推到
天边，必须用 `margin-left: auto` 覆盖掉，让「剩余空间全给 trailing 吃」这件事
由 flex 自己算。

### 15.2 绝对定位：为什么只锚 bottom，为什么包含块不是 card

按钮的物理位置在两个祖先之外（「+」在 `_row > _tools` 里），纯 CSS 搬不动
父级，只能让按钮**脱离文档流**再按卡面坐标摆回去。

**关键一：锚 `bottom`，绝不锚 `top`。**
`[data-composer-card]` 的孩子顺序是

```
overlayAnchor → [data-slot="conversation.input.attachments"] → 卡面 → 工具行
```

附件轨一出现，整张卡是**向上长高**的（composer 钉在视口底部）。用 `top` 定位
的按钮会留在原来的高度，正好掉在附件缩略图上。工具行永远贴着 card 底边，
所以 `bottom` 在「空态 / 有附件 / 多行输入」三种形态下都稳定。

**关键二：包含块是 `_row`，不是 card。**
`_row` 上有 `container-type: inline-size`。按 CSS Containment 规范，容器查询
的尺寸 containment 隐含 `contain: layout`，于是 `position: absolute` 的
包含块变成 `_row`。这不影响算式 —— `_row` 是 card 的最后一个孩子，card 的
`padding` 已被 C1 清零，两者左 / 下边重合；而 layout containment 不裁剪溢出。
但**必须知道这件事**，否则下次有人给 `_row` 加 `padding` 时，44.5px 会整段偏。

两条算式：

```
「+」  24px，在单行 41px 的卡面里居中 → 距卡面底边 (41 − 24) / 2 = 8.5
       bottom = 36 + 8.5 = 44.5px   left: 6px（按钮占 6→30，文字从 36 起）
发送键 28px                                → 距卡面底边 (41 − 28) / 2 = 6.5
       bottom = 36 + 6.5 = 42.5px   right: 8px（按钮占右侧 8→36，文字边界 40）
```

**取舍**：41px 是宿主单行卡面的实测高度（输入行 24 + 上下 padding 6+6 + 边框）。
它由宿主字体行高决定，会随宿主升级变；但两颗按钮都是居中的，41 变成 43 时
误差只有 1px，肉眼不可见，不值得为它再引一层 JS 测量。

### 15.3 只搬 `trailing` 的最后一个孩子

运行中且可继续（`interruptible`）时，trailing 里会**同时存在两个
`_primary`**：「额外停止键」+「主键」。如果按 `button[class*="_primary"]`
全选，两颗会叠在同一个坐标上。

所以选择器写成 `> :last-child:is(button[class*="_primary"])`，外加一条
`> :last-child button[class*="_primary"]`（主键可能被 Tooltip 包一层）。
多出来的那个停止键留在工具行原位 —— 它是少数派状态，先不动。

另外宿主给 `_primary` 写了 `transform: translateY(-2px)`，绝对定位之后这 2px
会把它顶出卡面中线，必须 `transform: none`；按下态的缩放改到 `:active` 里
单独给，避免「定位用的 transform」和「反馈用的 transform」互相覆盖。

### 15.4 占位符必须跟着输入框一起改

C2 里输入框是 `padding: 6px 10px 6px 12px`。卡内左右各被占掉一块之后：

```
左：+ 占 6→30，+6 呼吸 ⇒ padding-left 12 → 36
右：发送键占 8→36，+4 呼吸 ⇒ padding-right 10 → 40
```

但**占位符是绝对定位的**（`inset: 6px 10px auto 12px`），它不跟输入框的
padding 走。只改一边，光标和占位文字就会错开 24px —— 这是最容易漏的一处。

### 15.5 设置页：去卡片化之后才看得见的三件事

**（一）两层底色叠加。**
原来 `.fh-set-card` 是 `bg-layer-2` + 1px 边 + 16px 圆角 + `padding: 4px 16px`。
它装在宿主的设置弹层里，等于「弹层底色上又叠一张卡」，内层比外层更亮，
视觉重心全跑到卡片边框上。claude 的设置区没有卡片：行与行之间只靠
0.5px 分隔线切分。所以这里 `background: transparent; border: 0; radius: 0;
padding: 0` —— 类名保留（client.js 生成，不能删），外观清零。

**（二）`space-between` 在窄面板里的空洞。**
原来是 `justify-content: space-between; gap: 20px`：空间不够时文字被压成多行，
控件仍顶在最右，中间留一条空。换成 claude 的 `flex-wrap: wrap;
gap: 12px 8px` + 文字块 `flex: 1 1 140px; padding-right: 48px`：宽度不够时
控件**整块换到下一行**，不再挤文字。

**（三）0.5px 线在 1x / 2x 屏不是一回事。**
宿主跑在 Chromium 上，1x 屏会把 0.5px 取整成 1px，2x 屏才是真发丝线。这条
是 claude 原文（`border-top: .5px solid var(--dsw-alias-border-l2)`），照抄；
但它意味着「高分屏上这页比低分屏更轻」，是刻意的。

**开关的整数行程**：38×22 换成 36×20、`box-sizing: border-box`、`padding: 2px`
之后，内槽 36 − 2×2 = 32，knob 16，行程正好 `32 − 16 = 16px`，读成一个
`--fh-switch-travel` 变量。`box-sizing` 必须**显式**写：宿主没有全局
`box-sizing` 重置（整仓只有 `60-caret.css` 一处 `content-box`），不写就变成
36 + 2×2 = 40 宽。

**顺手消灭的一个对比度隐患**：分段按钮的选中态原来是「品牌色实心 + 白字」，
而暗色品牌色 `rgb(127,150,210)` 配白字只有 2.92:1 —— 当时只能绕道用
`--dsw-alias-label-primary-foreground` 兜。改成 claude 的浅色块
（暗色 layer-3 / 亮色 overlay + 1px 投影）之后，文字是 label-primary，
对比度由宿主调色板保证，**白字方案连同它的问题一起消失**。

### 15.6 窗口 chrome：三条锚点纪律

这一版新增 `58-chrome.css`，管三样宿主自己的东西：会话头右上的 dock 开关、
侧栏底部的账号行、以及账号行 portal 出来的菜单。

**纪律一：`data-slot` 具名槽是跨版本契约。**
宿主通过 `ctx.slots.inject()` 注册的槽（`settings.launcher`、
`conversation.session.header.corner`、`conversation.input.permission` / `.model`）
是插件契约的一部分，比哈希类名稳得多，也比 `[role=menu]` 这种泛语义准得多。
新规则一律先找槽。

**纪律二：绝不写哈希类名。**
宿主 CSS module 的类名有两种哈希格式（`ET65mq_trigger` 这种「5 位前缀_」和
`_itemIcon_4ub78_148` 这种「_名字_hash_序号」），跨版本必变。唯一例外是
`[class*="_signedOutMenu"]` —— 那是宿主给未登录菜单留的语义化前缀，跨版本
不变；其余一律走 `:nth-child(2)` / `:first-child:has(svg)` / `:has(kbd)`。

用户名刻意取 `> span:nth-child(2)`（第二个**孩子**，不是第二个 span）：登录是
`[span.avatar, span.label]`，未登录是 `[svg, span.label]`，折叠时 label 整个
不渲染 —— 三种情况下「第 2 个孩子」要么是用户名、要么不存在，两头都不会误伤。
刻意不用 `:last-child`：将来末尾追加角标就取错了。

**纪律三：portal 到 body 的菜单靠 body 上的 `--dsw-*` 继承。**
菜单不在侧栏里，不继承侧栏的任何上下文；颜色能跟随主题，全因为别名的
`--dsw-*` 声明在 `body` 上（见 §2）。所以 H3 的颜色只写 token、不写死值。

### 15.7 两个 CSS 陷阱

**（一）`:has()` 不能嵌套。** Chrome 会把整条选择器判为无效 —— 不是忽略内层，
是**整条规则不生效**。想表达「没有箭头时才补箭头」只能写成平行的两道：

```css
:not(:has(> svg:last-child)):not(:has(> :last-child svg))::after { … }
```

**（二）border 画的箭头在 200% DPI 下发毛。**
用「两条边 + `rotate(45deg)`」拼出来的 chevron，在非整数缩放下会糊成一片。
改成 SVG `mask-image` + `background: currentColor`：矢量抗锯齿，还能跟着
文字色自动变。

### 15.8 这一版没有做的事

- **第二个停止键没搬**：`interruptible` 时工具行里的额外停止键仍在原位。
  它只在「运行中且可继续」时出现，搬它要把 `_trailing > :not(:last-child)`
  也绝对定位，收益低、状态组合多。
- **滑块没有 claude 对照物**：claude 设置页 CSS 里 `type=range` 命中 0 次
  （核查过它的产物），所以滑块只做与行网格对齐的微调，不动形状。
- **设置页只改 CSS，没动 DOM**：`src/client.js` 里 `.fh-set-row` 的构造与全部
  `fh-set-*` 类名一字未改。视觉重排全部落在 `40-settings.css`，这样
  任何一条改动都可以单独回滚。

## 16. 0.11.0：三圈「宿主没画」的边界，与一圈「我们画多了」的环

上一版把输入区按 claude 的几何重排完，这一版回到正文。起点是两份材料：一份是把
`dsh-claude-style` 的成品 CSS 逐字拆出来（它的 `lib/client.js` 707,639 B 里藏着单个
277,025 字符的模板串，剥出 1,161 条顶层规则），另一份是在隔离实例里用 CDP 量宿主的
真实 DOM 与几何。

先泼一盆冷水。

### 16.1 120 个锚点，宿主里一个都没有

claude-style 给每条规则都带根前缀 `body[data-dsh-claude-style]`（它自己 JS 注入的属性），
结构定位全部走自造值 `data-dsh-claude-part~=xxx` —— 去重后 120 个。而在宿主 asar 里，
`part` 属性**一次都没出现**；反过来，宿主真有的 `data-code-wrap` /
`data-code-block-banner` / `data-code-block-content` / `data-message-attachments` /
`data-row-key` / `data-conversation-header-corner`，它一个都没用。

于是它那 29 条侧栏行规则、19 条附件规则、6 条表格规则、5 条会话头规则，**照抄等于写一堆
永不生效的 CSS**。能直接被宿主吃到的只剩四类：`.md-code-block`（宿主全局类）、
`[data-composer-card]` / `[data-input-scroll]`、`*` 上的滚动条伪元素，以及
`:is(button, input, …):focus-visible`。

这一版只做**锚点能站稳**的部分，于是问题变成：在宿主真有的锚点里，哪些是「宿主画了
里面、没画外面」？

### 16.2 焦点环：先收窄给谁，再跟上什么时候给

`10-layout.css` 原来有一条无差别的：

```css
:focus-visible { outline: 2px solid …; outline-offset: 2px; }
```

两个问题。**一是给得太多**：宿主的可聚焦元素远多于按钮 —— 会话滚动区、代码块、消息容器
都带 `tabindex`，鼠标点一下也亮一圈。**二是没跟上时机**：宿主自己有契约

```css
html[data-input-modality="pointer"] body :focus-visible:not(:read-write) { outline-color: transparent; }
```

也就是它按输入模态决定要不要画环（键盘来才画）。我们那条无差别规则特异性更高，把这条
契约整个盖掉了。

claude 的写法是角色清单：

```css
:is(button, input, textarea, select, [role="button"], [role="tab"], [role="treeitem"]):focus-visible {
  outline: 2px solid rgba(20, 20, 19, .45); outline-offset: 1px;
}
```

暗色 `outline-color: #faf9f599`。它**完全没判断 modality** —— `modality` 与
`data-input-modality` 在它的产物里 0 命中，画不画全交给浏览器原生的
`:focus-visible` 启发式。

我们抄它的清单（另补 `summary` / `a[href]` / `[role="menuitem"]` / `[role="switch"]` /
`[role="checkbox"]` / `[role="radio"]`），但**保留宿主契约**：再写一条，在
`[data-input-modality="pointer"]` 时把环色置 `transparent`。

这里踩了一个坑：第一版写成

```css
html[data-input-modality="pointer"] html[data-dsh-furina][data-dsh-furina-layout="on"] :is(…):focus-visible { … }
```

`data-input-modality` 与 `data-dsh-furina` **都挂在 `<html>` 上**，两个 `html` 之间的后代
组合子永远不匹配 —— 规则静默失效。三条属性必须写进同一个复合选择器：

```css
html[data-dsh-furina][data-dsh-furina-layout="on"][data-input-modality="pointer"]
  :is(…):focus-visible:not(:read-write) { outline-color: transparent; }
```

### 16.3 代码块：只加外框，不动圆角、不加 overflow

**症状**：代码块在浅画布上像一整块洞。宿主给代码块刷了两层底色（banner 更深、正文更深），
却没给外边界；相邻两个代码块之间只剩 10px 间距，边界全靠颜色差自己找。

**根因**：宿主 `.md-code-block` 只有 margin（非 compact `10px 0`，compact `4px 0`）和
banner 的 `border-radius: 16px 16px 0 0`，没有 border。

**修法**：0.5px 的 `border-l2` 90% + 一层 1px 落影（亮色 `rgb(16 24 44 / .06)`，
暗色 `rgb(0 0 0 / .32)`）。两条刻意的「不做」：

- **不改 radius**：圆角在 banner 上是 16/16/0/0，正文块是 0/0/16/16，统一改会把两者的
  拼缝掀开；
- **不加 `overflow: hidden`**：非 compact 时 banner 是 `position: sticky`（宿主自己写的），
  裁切会把它锁死在框里、粘不住。

另外要记住：banner 下面那条 0.5px 发丝线和复制按钮样式是 0.4.1 的 P8 自己写的 ——
claude 对 banner 与复制按钮 **0 条规则**。

### 16.4 表格：外框 + 圆角，但不夺走横向滚动

**症状**：宽表格在会话里像一张没边界的纸，滚到边缘才看出「右边还有」。

**根因**：宿主的 `_tableScroll` 是 `max-width: 100%; overflow-x: auto`，而 `table` 是
`width: max-content; max-width: max-content` —— 内容天然超宽，靠容器横滚。`.md-table-wide`
更极端：平时 `overflow-x: hidden` 且 `padding-bottom: var(--dsh-scrollbar-width, 5px)`，
只在 `:hover` / `:focus-visible` 时切成 `scroll` 并把 padding 归零。

**修法**：只加 `border: 0.5px` + `border-radius: var(--dsw-radius-md, 12px)` +
`background-clip: padding-box`。**故意不写 `overflow: hidden`**：容器的 `overflow-x` 已经是
`auto`/`scroll`，按 CSS 规则另一轴会自动 compute 成 `auto`，内容本来就被裁到圆角内侧；
再补一条 `overflow: hidden` 会把 `.md-table-wide` 的 hover 切滚动整个废掉。
`background-clip: padding-box` 是为了让圆角外的 0.5px 边框底下不露出表格自身的底色。

也**没做**「还能横向滚」的渐隐：宿主已在 `.md-table-wide` 上预留
`padding-bottom: var(--dsh-scrollbar-width, 5px)` 给滚动条，再叠一层 mask 会和它抢同一块空间。

### 16.5 附件卡：一个稳定锚点，加一个显式声明的例外

**症状**：自己发出去的文件卡（240px 宽、`min-height: 64px`）和正文一样贴着画布，
没有「这是一张卡」的层次。

**锚点**：容器 `[data-message-attachments]` 是宿主 JSX 里写死的 data-*（`UserContent` 在
`attachments.length > 0` 时渲染），稳定；卡片本身只有 CSS module 类 `_fileCard`
（产物前缀 `cJsG2q_`），没有 data-*。

**修法**：容器 gap 8px；卡片 `border-radius: var(--dsw-radius-md, 12px)`、边框 90% 的
`border-l2`、底色 `specific-input-major` 78%、hover 8% 品牌色水膜。外层用 `:where()` 把
特异性压到 0，让任何后续覆写都能赢过我们。

这是本仓库**第二类**被显式允许的锚点：CSS module 的「人写部分」子串（第一类是 0.7.1 起的
`[class*="_stripTabs_"]` 那批）。注释里写明了它是哈希例外 —— 宿主换构建会自然失效，
而不是误伤别的东西。

### 16.6 这一版没有做的事

- **输入区附件轨**（粘贴图片后那排缩略图）：宿主里只有 `srf2qa_rail` 这类哈希类，没有任何
  data-* 可锚；
- **表格「还能横向滚」的渐隐**：见 16.4，和宿主预留的 scrollbar padding 打架；
- **会话头下渐隐纱**：claude 的纵向渐隐 `--dsh-claude-fade-stops` 可以借，但它的落点是
  `[data-composer-seat]:before`（输入区上方）而不是会话头，照搬要重定 stop 位置；
- **hero 容器 `max-width: 720px`**：宿主 `variant === "hero"` 只是 class 不是 data-*，
  而且 `_hero` 的 padding 已经由我们的 framed 开关管着；
- **侧栏行 28px**：宿主自己就是 `_sessionRow{height: 32px}`、14px 字、6px 圆角，
  claude 的 28px 是它自己布局的产物，不必照搬。

---

## 17. 0.12.0：宿主只设计了四级标题，我们补完另外两级

### 17.1 症状：一段文档读到 h5 就失去了层级

宿主自己渲染出来的标题阶梯是这样的（隔离实例，CDP 实测 computed style）：

```
h1  21px / 30px  w700
h2  19px / 28px  w700
h3  18px / 26px  w700
h4  14px / 24px  w600
h5  14px / 24px  w600
h6  14px / 24px  w600
```

前三级挤在 3px 以内；后三级**完全塌平**，h5 和 h6 在屏幕上没有任何区别。
对一段用 `#####` 划小节的文档来说，读到第五级时层级就消失了 —— 读者只能靠
上下文猜「这一行是另一个小节的开头」。

这不是渲染 bug，是宿主只设计了四级：h1/h2/h3 各有自己的 `font` 简写 token，
h4 用「正文字号 + 600 字重」，h5/h6 直接复用 `--dsw-font-markdown-base-strong`
（也就是 h4 的那一条）。

### 17.2 根因：能改的地方和想改的地方不是同一层

第一反应是覆写 `--dsw-font-markdown-h2` 之类的 token。先得确认两件事：
token 谁消费的、以及 token 的默认值声明在哪。

**消费方是宿主元素规则**，逐字是：

```css
._markdown_1ypvv_5 h1 { font: var(--dsw-font-markdown-h1); margin: 32px 0 16px; }
._markdown_1ypvv_5 h2 { font: var(--dsw-font-markdown-h2); margin: 32px 0 16px; }
._markdown_1ypvv_5 h3 { font: var(--dsw-font-markdown-h3); margin: 32px 0 16px; }
._markdown_1ypvv_5 h4 { font: var(--dsw-font-markdown-h4); margin: 16px 0; }
._markdown_1ypvv_5 :where(h5, h6) { font: var(--dsw-font-markdown-base-strong); margin: 16px 0; }
```

所以我们**不需要抢类名**：覆写 token，宿主的元素规则会替我们消费。这比写
`h2 { font-size: 18px }` 干净 —— 行高、字重、字体族跟着一条 token 一起走，
不会出现「字号变了行高没变」的错位。

**默认值声明在 `body{}` 里**，不是 `html{}`：

```css
--dsw-font-markdown-h2: 700 calc(19px + var(--dsh-content-font-delta))
                        / calc(28px + var(--dsh-content-font-delta)) var(--dsw-font-family);
--dsw-font-markdown-h3: 700 calc(18px + var(--dsh-content-font-delta))
                        / calc(26px + var(--dsh-content-font-delta)) var(--dsw-font-family);
--dsw-font-markdown-h4: 600 var(--dsh-content-font-size, 14px) / calc(24px + delta);
--dsw-font-markdown-base-strong: 600 var(--dsh-content-font-size, 14px) / calc(24px + delta);
```

这一点直接决定了覆写的位置：**必须写在 `body` 上**。写 `html { --dsw-…: … }`
只是给 html 加了条继承值，而元素上的声明（`body{}`）赢过继承值，一切照旧。
00-tokens.css 第 1 节为同一件事踩过一次，注释里记着。

### 17.3 实测：字号是内联写在 `body` 上的

还有一个更隐蔽的前提。宿主把用户设置里的字号写成**内联样式**：

```js
for (const [role, name] of Object.entries(FONT_SIZE_VARIABLES))
  body.style.setProperty(name, `${snapshot.fontSizes[role]}px`);
```

`FONT_SIZE_SPECS` 里三档是 text 14（10–22）、code 11（10–16）、terminal 13（10–20）。

内联样式的优先级高于任何 CSS 选择器，这意味着：

- **覆写 `--dsh-content-font-size` 无效** —— 宿主在 html 上那条 `!important` 也许
  能赢，但那是跟用户设置正面打架；
- 唯一能接的接口是宿主自己派生的 **delta**：
  `--dsh-content-font-delta: calc(var(--dsh-content-font-size) - 14px)`。

所以本文件的纪律是：**每一个尺寸都写成 `calc(Npx + var(--dsh-content-font-delta, 0px))`**。
写死 px 的后果是用户把正文字号调大，标题纹丝不动，正文和标题的相对层级崩掉。

实测这条纪律成立：把 `--dsh-content-font-size` 临时调到 18px（delta = +4px），

```
h2   18px/26px → 22px/30px
h3   16px/24px → 20px/28px
行内代码 13px → 17px
```

整条阶梯按同一个 delta 一起长。

### 17.4 修法一：阶梯 21 / 18 / 16 / 14（T1）

h2 降 1px，h3 降 2px：

```css
html[data-dsh-furina][data-dsh-furina-layout="on"] body {
  --dsw-font-markdown-h2: 700 calc(18px + var(--dsh-content-font-delta, 0px)) /
    calc(26px + var(--dsh-content-font-delta, 0px)) var(--dsw-font-family);
  --dsw-font-markdown-h3: 700 calc(16px + var(--dsh-content-font-delta, 0px)) /
    calc(24px + var(--dsh-content-font-delta, 0px)) var(--dsw-font-family);
}
```

行高同步收紧（28→26、26→24），保持行盒比例和正文一致，而不是「字号变小、
行高还留着原来的数」。

有意思的是 claude-style 也做了同一件事，而且只降 1px：它的 h2 是
`700 calc(18px + delta)/calc(26px + delta)`、h3 是 `calc(16px + delta)/calc(24px + delta)`
—— 数完全一样。考虑过要不要避开这个巧合，最后决定不避：宿主原来的
19/18 确实太挤，而 21/18/16 是让 h2 与 h3 各有 3px 与 2px 落差的自然结果。

### 17.5 修法二：h5/h6 没有 token，只能写元素规则（T2）

`--dsw-font-markdown-base-strong` **同时被 `strong` 用** —— 覆写它会把正文里
所有加粗一起变小，这个代价不能接受。所以这两级只能走元素规则。

方向也要反过来：不往上加字号（小标题比正文还响就本末倒置了），而是往下收：

| 级别 | 字号/行高 | 字重 | 字距 | 颜色 |
| --- | --- | --- | --- | --- |
| h5 | 13 / 22 | 600 | 0.02em | label-secondary |
| h6 | 12 / 20 | 600 | 0.04em | label-tertiary |

字距是必须的：小字号中英混排时，中文方块字与拉丁字母的字面宽度差得更多，
不加字距就挤成一条。

### 17.6 修法三：间距从 em 换成一根显式标尺（T3）

0.12.0 之前这里只有一行 `margin-top: 1.35em`。em 的毛病是**跟着标题自己的
字号走**：

```
h1  21px × 1.35 = 28.35px
h3  18px × 1.35 = 24.30px
```

只差 4px。视觉上「大小标题一样重」—— 层级刚在字号上修好，间距又把它抹平一次。

改成显式标尺，步长 4 4 4 2：

| 级别 | margin-top | margin-bottom |
| --- | --- | --- |
| h1 | 30 | 14 |
| h2 | 26 | 12 |
| h3 | 22 | 10 |
| h4 | 18 | 8 |
| h5 / h6 | 16 | 6 |

下边距反而比宿主的 16px 小，因为宿主给的下边距会和下一段自己的
`margin-top: 16px` 叠加，视觉上是两份留白相加。再补一条收口规则：

```css
:is(h1..h6) + :is(p, ul, ol, pre, table, blockquote) { margin-top: calc(6px + delta); }
```

免得标题后面跟一个列表或代码块时，那一块自己又顶出 16px。

实测（注入合成节点到真实 markdown 容器）：

```
H2 mt26 mb12   P(after head) mt6    ← 收口规则生效
H3 mt22 mb10   UL(x)         mt6    ← 同上
P  mt12 mb12   P(plain2)     mb0    ← 宿主 :last-child !important 仍在管
P(first) mt0                        ← 宿主 :first-child !important 仍在管
```

### 17.7 修法四：行内代码的分数像素（T4）

宿主给行内 code 的是 `font-size: .875em !important`。14px 正文里算出
**12.25px** —— 分数字号在中英混排里会落到半个像素上，笔画边缘发灰。

顺带发现插件里原来有一条 `font-size: 0.92em`（50-details.css D1）**从来没生效**：
它没有 `!important`，被宿主那条压得干干净净；实测的 12.25px 全部来自宿主。
这是一条死声明，0.12.0 删掉。

改成 `calc(1em - 1px)`（= 13px）：

```css
:not(pre) > code { font-size: calc(1em - 1px) !important; }
```

台阶回到整数，且只比正文小 7%，夹在中文句子中间不会「跳一下」。

两个必须注意的点：

1. **必须 `!important`**，因为宿主那条也是 `!important`。特异性
   (0,4,2) 对 (0,1,2)，字面上是我们高，但 `!important` 声明之间的比较不看
   特异性之外的东西 —— 实际上两条都是 important 时，特异性高的赢，
   所以严格说这条 `!important` 是为了跟宿主处在同一个比较层级。
2. **标题内的行内代码要兜回来**。宿主让标题里的 code 继承标题字号
   （`:where(h1..h6) code { font: inherit }`），我们那条 `!important` 会把它
   一起盖掉，所以补一条 `:is(h1..h6) > code { font-size: 1em !important }`。

实测：

```
inlineCode 13px/19px     （原来 12.25px/19px）
h3 > code  16px/19px     （继承标题字号，未被压成 15px）
pre        14px/24px     （不动 —— 代码块字号由用户设置里 code-font-size 管）
```

### 17.8 修法五：两条断行属性（T5）

纯排版，不动任何尺寸：

- `p / li / blockquote` 用 `text-wrap: pretty` —— 浏览器为了避免段末只剩
  一两个字而提前换行。中文没有空格，孤字尤其难看。
- `h1–h4` 用 `text-wrap: balance` —— 多行标题的行长被均分。

两条都是渐进增强：不认识就整条忽略，退回原来的断行。实测 computed style
`text-wrap: pretty` / `balance` 均已生效（Chromium 117+）。

### 17.9 退役的三条旧声明，与这一版没有做的事

排版第一次有了统一去处，就该把散在外面的收掉：

| 位置 | 旧声明 | 退役原因 |
| --- | --- | --- |
| 50-details.css D1 | `font-size: 0.92em` | 死声明，被宿主 `.875em !important` 完全压掉 |
| 50-details.css D5 | `margin-top: 1.35em` 整节 | 迁到 T3；em 让大小标题间距只差 4px |
| 10-layout.css L9 | `:is(h1,h2,h3){letter-spacing:0.01em}` | 迁到 T3，与阶梯同文件 |

没有做的三件事：

- **换字体族。** claude-style 的排版优势里有一半来自自托管的四个字体文件
  （Anthropic Sans Web Text / Inter / Noto Serif / JetBrains Mono）。那是一次
  几 MB 的体积和一次加载竞态，换不来「层级」。
- **调正文字号。** 14px 是用户在设置里定的（10–22 可调）。皮肤去改它等于跟
  用户的设置打架，而且用户一调大就再打一次。
- **照抄 claude 的 markdown 结构规则。** 它那一整套锚在
  `[data-dsh-claude-part~=markdown]` 上 —— 那是它自己 JS 注入的属性，宿主
  asar 里 `part` 属性 0 命中（16.1 已记录）。它的 `p { margin: 12px 0 }`
  我们本来就有，h2/h3 各降 1px 我们也做了，剩下的差异全在字体族。

### 17.10 验收用的三条探针

排版这种改动肉眼很难判断「是不是真生效了」，所以验收全部走 CDP 探针
（隔离实例 `http://127.0.0.1:5177`，headless Edge `:9333`）：

1. **阶梯探针**：往真实 `._markdown_1ypvv_5` 里注入 h1–h6/p/li/blockquote，
   读 computed `fontSize/lineHeight/fontWeight/letterSpacing/margin/color/textWrap`。
   期望值见 17.1 与 17.6 的两张表。
2. **行内代码探针**：注入 `<p>text <code>`、`<pre><code>`、`<h3>head <code>`，
   期望 13 / 14 / 16。
3. **delta 探针**：`document.body.style.setProperty('--dsh-content-font-size','18px')`
   后重新量阶梯，期望 h2 22/30、h3 20/28、行内 code 17px；量完必须
   `removeProperty` 复原。

三条都通过之后才动文档和版本号 —— 否则改的是「以为生效了」的 CSS。

---

## 18. 0.13.0：一屏纸的重心，与一层字压不压得住

0.12.0 动的是字，这一版动的是**尺子**。两条线：

1. **构图**：新会话那一屏还是宿主的「搜索页」形状（居中大标题 + 徽标 + 752 列），
   而 claude 那一屏的重心在输入框上。
2. **对比度**：浅色主题 + 插画背景下，16 个文本层里有 8 层低于 WCAG 4.5:1，
   最差三层只有 2.35 / 2.46 / 2.61。

第二条是这一版真正的主线 —— 它不是「有点淡」，是读不下去。

### 18.1 先立规矩：这一版只碰两个文件的两类声明

0.11.0 补边界、0.12.0 补字号，两版都在扩「选择器覆盖面」。这一版反过来收：

- `06-hero.css`（新建，H0.1–H0.3）只管新会话那一屏的构图；
- `00-tokens.css` 的公共调色板第一次做主题分流；
- `30-surface.css` 只补注释（验算），不改规则；
- `20-motion.css` 只修三条从来没命中过的选择器。

不新增设置项，不改用户能调的滑块（`--fh-veil` 一个字都没动）。

### 18.2 新会话页：为什么只改一个变量就够

宿主三层宽度是**联动**的：

```
Dc7zOa_composerHero 宽 = card-max-width + 2 × side-clearance
Hqq-bq_stack        宽 = min(100%, card-max-width)
RlGAzG_card         宽 = min(100%, card-max-width)
```

所以在 `[data-composer-seat]` 上重声明 `--dsh-composer-card-max-width`，
标题列 / 工作区行 / 输入卡会同时收窄并自动对齐 —— 不需要分别设宽。

反过来做过一次：直接改 `composerStack` 宽度，实测得到
「root 720 / stack 672 / card 688」，三者谁都不齐。**联动的宽度只能从联动
的那个变量改。**

取值必须写成裸 `clamp(720px, 68ch, 900px)`：

```css
/* 对：card 落 720 */
--dsh-composer-card-max-width: clamp(720px, 68ch, 900px);

/* 错：100% - 16px 先算成 736，最终 card 落 704 */
--dsh-composer-card-max-width: min(calc(100% - 16px), clamp(720px, 68ch, 900px));
```

沿用 `10-layout.css` 的 `--dsh-chat-user-width` 同款 clamp，是为了让新会话页和
会话正文列用**同一根尺子**，不是随手挑的 720。

### 18.3 `:has()` 的层数问题：3 层、4 层、5 层各拿到什么

hero 变体只是 class（`Dc7zOa_composerHero` / `RlGAzG_hero` / `Hqq-bq_headline`），
没有 `data-*` 可判。整个 `06-hero.css` 只能从具名槽反查容器：

```
[data-slot="conversation.hero.brand.mark"]
[data-slot="conversation.hero.workspace"]
[data-slot="conversation.hero.workspace.directoryFlow"]
[data-slot="conversation.hero.agentPreset"]
[data-slot="conversation.hero.options"]
```

具名槽是跨版本契约（0.10.0 起最主要的一类锚点），所以不碰哈希类名。

数层数时有两个坑：

1. **不能把 `display: contents` 的槽本身数进去** —— 它的 rect 是 0，不是一个
   盒。只能数它外面的真实 div。
2. **层数必须精确**。从 `brand.mark` 往上数：

```
span(1) / headline(2) / stack(3) / root(4)
```

   - 写 4 层 `div:has(> div > div > span > [brand.mark])` → 拿到 root（对）
   - 写 3 层 → 拿到 stack，会把 headline 再挤窄一圈（错）
   - 写 5 层 → 实测 0 命中，上面没有第 5 个 div（错）

实测（隔离实例 1570×871，hero 态）：

```
headline   559,350  720×26   20px/26px 500  justify-content: flex-start
workspace  559,400  720×28   padding 0
card       559,436  720×94   --dsh-composer-card-max-width: clamp(720px, 68ch, 900px)
brand svg  559,352   29×21   徽标 display: none
document.scrollWidth = document.clientWidth = 1570  （无横向溢出）
```

三者左缘 `x = 559`、宽 `720`，同一条竖线。

### 18.4 logo 只能锁高度

```css
[data-slot="conversation.hero.brand.mark"] svg { height: 21px; width: auto; }
```

这枚 svg 的 viewBox 是 **23.16 × 17.04**（宽高比 1.36）。写成 `21px × 21px`
会把它从 28.5 压成 21 —— 横向被挤扁。锁高度、宽自动，是唯一不改变比例的写法。

### 18.5 浅色可读性：根因不是「颜色淡」，是「没有对照物」

先把根因摆清楚，否则改法看起来像随手调色。

`30-surface.css:65-79` 把对话区中间列与底行设成
`background: transparent !important` —— 插画**直透正文区**。浅色的水膜是
`rgb(247 250 255 / 0.4)`，压在插画最亮处几乎不改变亮度：

```
插画最亮样本 #c6b4bc  ← 水膜 0.4 白色 → 合成后仍然 #c6b4bc 附近
```

所以**浅色下遮罩救不了对比度**。12 个文本层里有 7 层的好坏，取决于背后那一片
插画有多亮 —— 而插画是用户自己选的。

前景 token（`00-tokens.css:119-122`）仍然按「水色画布 `#eef2fa`」设计，
画布被插画替换之后，它们就失去了对照物。

两条路摆在这儿：

| 路 | 做法 | 问题 |
| --- | --- | --- |
| A | 把水膜浓度 `--fh-veil` 0.4 → 0.62 | 所有小字层一次性到 6.4–8.2:1，**代价是插画变淡** —— 把用户选的背景当成错误来修 |
| B | 前景色往下沉 | 层次压缩，但不动用户的画 |

选 B。而且 A 本身也救不全：`--fh-water-faint: #7c8bab` 压在**纯白**上只有
`3.42:1`，token 自身就不达标 —— 拉满`--fh-veil` 到 1.0 也只有 3.42。换什么
背景都没用，那一档必须单独改。

### 18.6 四个 token 的实测账

```css
/* 00-tokens.css:13-19 公共调色板（只被浅色 body 规则引用，暗色块是硬编码 hex） */
--fh-water-ink-soft: #2d3650;   /* 原 #3e4b6d */
--fh-water-mute:     #333b4e;   /* 原 #5f6e93 */
--fh-water-faint:    #42495a;   /* 原 #7c8bab */
--fh-brand:          #2a3660;   /* 原 #4a5fa8 */
```

| 层 | 原最差 | 新值 | 依据 |
| --- | --- | --- | --- |
| label-secondary（模型行） | 3.41 | 4.73 | 压 `#9fa2b2` |
| label-tertiary（工具行） | 2.05 | 4.52 | 压 `#9aa5bd` |
| label-caption（「High」） | 1.74 | 4.58 | 压 `#c6b4bc`；对白 9.0 |
| 底部统计 tok/s | 3.54 | 4.87 | 压 `#d3d8e0` |
| 链接 | 2.77 | 4.55 | 压 `#a8b0c3`；对白 11.7 |
| 标签 pill | 2.34 | 4.55 | 压 `#9ba1b7` |
| 缓存命中行 | 2.21 | 4.87 | 压 `#a2acbb` |
| 侧栏分组 / 时间 | 3.56 | 4.49–4.73 | 压 `#edf1fb` |

**8 层逐层复算全部 ≥ 4.5:1。** 残余：插画极暗的两处（`#9da3af` 一带）
新 faint 仍在 3.5–3.7，那已经不归前景管 —— 那是插画本身的亮度。

代价写在明处：**浅色的明度层次从 3 档压到 2 档**。这是「不淡就读不了」的
必然结果，不是没注意到。

### 18.7 一次自己引入、又自己修掉的回归

公共调色板声明在 `html[data-dsh-furina]` 上，暗色块是它的**后代** ——
于是浅色一改，暗色跟着动。

改完实测：

```
暗色 --fh-brand = #2a3660   ← 应该是 #4a5fa8
```

`#2a3660` 在深底上是「一块几乎看不见的深蓝」。受影响的是那几处还引用
`--fh-brand` 的**装饰**：流式光标、工具行水膜、`li::marker`。

修法是在暗色块里显式钉回：

```css
html[data-dsh-furina][data-dsh-furina-surfaces="own"] body[data-ds-dark-theme] {
  --fh-brand: #4a5fa8;   /* 钉回 0.12.0 的原值 */
}
```

理由：暗色段的文字与品牌色本来就走各自硬编码的 `--dsw-alias-*`，只有那几处
装饰还在引用 `--fh-brand`，所以浅色下沉不该顺带改暗色的观感。

这条教训值得单独记一句：**公共 token 放在主题块外面，等于给两个主题装了一根
共用的轴 —— 动之前先想清楚另一头连着谁。** 复核实测：

```
dark   --fh-brand #4a5fa8   brand-primary #7f96d2
light  --fh-brand #2a3660   brand-primary #2a3660   bg-base #f7f9fe
```

顺带把暗色唯一贴线的那一档抬起来：

```css
/* 00-tokens.css:303 暗色 */
--dsw-alias-label-caption: #8fa0c8;   /* 原 #788bb4 */
```

中位 4.64 → 6.06，最差像素 3.26 → 4.26。只影响暗色。

⚠️ 复核实测有一个读数陷阱：暗色覆写的作用域是
`html[data-dsh-furina] body[data-ds-dark-theme]`，所以 `--fh-brand` **必须
在 body（或它的后代）上读**。在 `document.documentElement` 上读永远得到
浅色那份 `#2a3660` —— 第一次复验就是这么误判成「回归还在」的。实测同一个
暗色状态下：

```
getComputedStyle(document.documentElement) --fh-brand → #2a3660   （html 自己的值）
getComputedStyle(document.body)            --fh-brand → #4a5fa8   （真正继承下去的）
```

### 18.8 三条「写了、但从来没命中过」的动效选择器

审查动效层时顺手量了命中数，三条规则都在 **0**：

| 位置 | 旧写法 | 为什么从来没生效 | 修法 |
| --- | --- | --- | --- |
| M1 消息入场 | 给 `[data-slot="conversation.chat.node"]` 的**每个**子元素挂 `animation … both` | `animation-fill-mode: both` 在层叠里**高于普通声明**（动画填充值赢过普通声明），它把行尾操作条的 `opacity` 钉在最后一帧的 1，于是 `10-layout.css:149` 那条「hover 才出现」永远算不出 0。实测：操作条 opacity 恒为 1 | 加 `:not([data-turn-tail])` 排除行尾条 |
| M3 思考态涟漪 | `[data-chat-flow-kind="turn-process"] [data-state="running"]` | turn-process 那个 flowItem 里**根本没有** `[data-state]` —— 孩子只有隐藏播报（`role=status`）和 `data-turn-process` 按钮。真正带 `data-state="running"` 的是思考块 `ReasoningRow` | `[data-variant="think"][data-state="running"] [data-disclosure-row] > span:first-child`，呼吸光挂到那枚 16px 的 leading 图标上（挂整行会溢到相邻行） |
| M4 展开涌动 | `[data-expanded="true"]` | 宿主的写法是 `"data-expanded": expanded \|\| void 0` —— 折叠时**整条属性不存在**，不是 `"false"`。全页 0 个 `data-expanded` | 改成只判属性存在 `[data-expanded]` |

M1 那条最有教学价值：**`animation-fill-mode` 不是「动画播放时」的事，它是
一个持久的声明级覆盖**。给一个容器里的所有子元素挂 `both`，等于把它们的
每一帧值都钉成最终值 —— 之后任何 `opacity` 状态切换都会失效。

### 18.9 补的验算：`30-surface.css` 的注释此前只算了暗色

那段注释原文只说「`#dbe2f2` 压在 `rgb(10 15 27 / .4)` 上约 9:1」。这一版补上：

浅色的对照色是 `rgb(247 250 255 / .4)`，压在白底上几乎不改变亮度，所以
**浅色下遮罩救不了对比度**；12 个文本层里有 7 层的对比度取决于插画亮度本身；
结论是浅色可读性归 `--fh-water-*` 那一组 token 管，不归这里。

注释的价值在于：下一个想「把水膜调浓一点」的人，会先看到这句话。

### 18.10 验收：三条探针

1. **hero 几何探针**（`cdp_file.js`）：进 hero 态后量 headline / workspace / card
   的 `rect` 与 `font`，期望三者左缘相同、宽 720，且
   `document.scrollWidth === document.clientWidth`。
2. **双主题 token 探针**：切浅色（`data-ds-theme-source=light` +
   `color-scheme:light` + `body.removeAttribute('data-ds-dark-theme')`）读四个
   `--fh-water-*` 与 `--fh-brand`；切回暗色必须读到 `--fh-brand: #4a5fa8`。
3. **对比度复算**：从审计报告的「旧色 + 旧最差比值」反解背景亮度，再用新色
   算回去，8 层 ≥ 4.5 才算过。

三条都过之后才动文档与版本号。

---

## 19. 0.14.0：任务栏等宽与共享底栏

### 19.1 两个缺陷不在同一层

任务栏原生最大宽度是 card-max-width 减去四份 dock-inset，8px × 4 = 32px。
输入区只扣侧边留白，所以基线为任务栏 x544 / 720px、输入框 x528 / 752px。
修复让二者共用 card-max-width 与 side-clearance，不改任务列表内部 padding。

底栏则是树结构问题：权限/模型在 card > row 内，统计 dock 是 card 的兄弟。
仅改 flex order 不能跨父节点合行。选择 root → card → row 两层 CSS subgrid，
左列权限、弹性中列统计、右列模型；card/dock 共用 composer 命名行且底对齐。
不采用 display:contents 打散 row：宿主 observeControlRow 依赖真实元素矩形。

### 19.2 兼容原来的锚点和条件状态

取消 row 的 inline-size containment 后，卡内「+」与发送键改由 card 作为
绝对定位包含块；二者底缘相同，原来的 bottom 距离仍成立。root 作为命名容器
用于按真实面板宽度响应。≤560px 时只有 DialogPill 隐藏可视文字，aria-label
及详情弹层保留；PlainPill 无弹层，必须保留它唯一的文字，靠原生 ellipsis 缩短。
≤360px 再缩权限标签，仍保留按钮 aria-label。

提示条显式占 notice 全宽行，不能让 grid 自动把它排到输入框后方。
运行活动替换权限/模型时，切为「活动弹性列 + 统计列」，不强制显示 hidden 控件。
附件槽的直接子元素横跨所有列；多行输入不改变底栏或发送键的锚点。
这些防护均由 [18-composer-footer.css](../src/18-composer-footer.css) 局部完成。

### 19.3 验收与边界

[几何回归](../scripts/check-composer-layout.mjs) 首先在旧版失败于
Task and input left edges differ，修复后通过。它检查任务/输入的宽度和左缘，
权限/统计/模型中心线，每颗统计按钮或静态 pill 的边界，卡内动作锚点及页面溢出。
--matrix 使用长模型标签覆盖 8 档窗口宽度（1923 到 400px）；--plain 临时模拟
无弹层统计，确认文字没有被 display:none 隐藏；夹具结束恢复，不发送模型请求。

另以隔离浏览器的可恢复 DOM 夹具检验：展开任务列表、156px 高输入区、56px 高
附件占位、提示条和运行活动；浅/暗属性均测试。它们是结构回归，不等同真实上传或
真实模型流式请求。新会话页烟测输入卡为 720px。普通对话卡 752px，底栏省下26px。
构建产物更新后，桌面窗口需要完整重启；测试不重启用户正在使用的应用。

---

## 20. 0.15.0：控件的样子与宿主的职责分开

### 20.1 真拆分，不改原生 React 树

发送键和权限只是换表面；模型 / 推理强度则需要两个真正独立的触发器。
[composer-controls.js](../src/composer-controls.js) 注册 conversation.input.right 槽位，
通过 modelDirectories.directoryFor(sessionId) 使用宿主的 store / load / select。
useSyncExternalStore 跟随会话状态；模型和档位都读宿主元数据，不维护第二份供应商表。
目录未就绪、无可选项、子代理或主题未接管时返回空，原生模型入口仍在。
只有 .fh-model-controls[data-ready] 实际挂载后，才用 CSS 隐藏原生入口；原生节点仍在，
以其 disabled 状态作为宿主锁定契约。缺少 API 不应留下一个空的替代按钮。

### 20.2 选择意图与交互边界

选择模型提交 provider / model，适用时带模型的默认强度；同模型保留显式档位。
选择强度保持当前 provider / model。Default 是缺省字段，不是 null 或某个固定字符串。
元数据有 defaultEffort 时不额外伪造 Default，任意供应商自定义档位 ID 都原样透传。
滑条只更新本地预览，pointer-up / key-up / blur 才提交，不在拖动中连续请求。
没有推理元数据的模型不显示强度按钮。已保留但不再列出的档位显示原名及提示，
不把未知档位伪装成 Default。拒绝和异常保留弹层并展示错误。

弹层 portal 到 body，按按钮矩形和视口空间定位；监听滚动、窗口变化与自身尺寸。
搜索 / 滑条在位置变为可见后才聚焦——初次 visibility:hidden 时 focus 会失败。
Escape 恢复入口焦点，Tab 在弹层循环，模型列表支持上下方向键，点击外部不抢回焦点。
清理阶段移除观察器、监听、portal 与槽位注册，不改用户模型配置或发送消息。

### 20.3 原生权限与底栏几何

权限仍由宿主原生菜单完成，保留确认流程和安全语义。菜单无专属 panel class，
而 Auto 标记在部分目录里不存在，不能依赖它。只在原生权限入口打开后，
识别当前选中项对应的 menu，写 data-fh-permission-menu 供局部样式使用。
其余菜单 / 确认对话框不接管；标记监听与属性在卸载时清理。

[19-composer-controls.css](../src/19-composer-controls.css) 保留 0.14 的 subgrid，
把原生上下文指示放在根容器右端；trailing 列预留 72px，窄输入区缩为 32px 圆环位，
不是只在视觉上挪过去而让其他按钮仍占同一块区域。28px 控件与统计中心线一致。
权限改成 24px 素文字按钮，发送改为 26px 透明回车箭头；原生停止方块不被替换。
所有规则要求主题、布局接管和 framed 三个条件，退出接管即恢复原生显示。

### 20.4 可复现验证

[交互检查](../scripts/check-composer-controls.mjs) 只操作 :5177 隔离页面。
初始化钩子只为测试取得宿主 React / ReactDOM，然后挂载假模型目录；不调真实服务。
覆盖模型与强度的完整选择载荷、任意档位 ID、Default 字段缺省、无推理模型、
键盘预览仅提交一次、错误、焦点恢复、原生 disabled 镜像、缺失 API 回退及权限菜单。
测试触发器和 body portal 都按夹具所有者限定，临时隐藏生产控件，避免误操作真实目录。
复用几何检查的八档视口矩阵，分别覆盖可点击统计和无弹层静态统计。
夹具、初始化钩子和视口恢复。构建后另重启隔离宿主验证注册与原生回退，
不刷新或重启正在使用的桌面实例。

---

## 21. 0.16.0：固定布局轨道，而不是固定模型文字

### 21.1 两个确定性回归

目标条是另一个 dock，内部卡片仍保留 720px 上限；只修任务卡不会修到它。
复现时目标条 x=544、宽720，输入框 x=528、宽752。外层和内部卡片都必须统一约束。
旧 footer 的首尾列取决于控件固有宽度，中间统计又自行居中：短模型标签换成长标签，
统计横移 148.78125px。能挤在同一行不等于位置固定，0.15 的覆盖检查没有抓到这一点。

[稳定布局规则](../src/19a-composer-stability.css) 使用与文字无关的三列：
权限 clamp(28px,12%,88px)，统计 minmax(0,1fr)，模型 clamp(136px,38%,340px)。
统计内部再分两列，模型仅在自己的轨道省略。百分比相对输入区，不用容器自身无法查询的 cqw。
原生 slot、hidden 与宿主 React 节点保留，上下文继续占用最右端预留位。
活动行替换模型时仍落在第三列，而不是沿用旧两列布局的第一列（仅28–88px）；
宽／窄窗口均验证排队操作真实可点击，且统计位置不变。

### 21.2 面板对照实物，而不是只复用“滑条”这个概念

模型主面板采用供应商标题＋横线、32px 模型行、13/16 名称与11/14 可选说明、尾端选中勾；
固定底部入口打开邻接子菜单，子菜单使用 sticky 反色供应商胶囊，不重复说明。
保留键盘直接输入筛选，但初始不画搜索框。插件没有 Claude 私有 quickProviders 设置，
故首个宿主供应商及当前模型放主面板，其余放“更多模型”；不读取另一个插件的配置或目录。

推理面板按参考采用标题／值、上置 Faster/Smarter 端点、26px 轨道、4px 刻度和16×30 白色滑块。
可见部分是独立 DOM；透明原生 range 只提供键盘、读屏及松手提交语义。最高档采用五行紫色点阵。
弹层半径12px；子菜单基于 viewport 定位，必须取消通用 dialog 入场 transform 及滚动裁切，
否则 fixed 子菜单虽存在且有几何读数，实际却在卡片外不可见。模型主体独立滚动，底部入口不跟随。

### 21.3 验收增加可见性与稳定性

[稳定性检查](../scripts/check-composer-stability.mjs) 在1923/1570/1100/900/760/640/520/400px
逐档断言目标／输入等宽，以及短长模型标签之间两块统计的 x 和 width 变化均小于1px；实测均0px。
[控件检查](../scripts/check-composer-controls.mjs) 新增面板尺寸、白色滑块、上置端点、最高档五行点阵、
多供应商载荷、窄屏子菜单方向键跳过隐藏项，以及 elementFromPoint 命中断言。可选 DSH_TEST_PREVIEW_DIR 保存真实浏览器的四种面板截图；
截图等待有限动画结束，只在测试夹具期间隐藏测试浏览器的无关扩展遮挡，结束恢复。
仍使用真实宿主 React＋假模型目录，不发消息、不调用供应商，不刷新用户桌面。

---

## 22. 0.17.0：恢复原位，而不是重新分栏

### 22.1 测量基准必须是输入框

0.16 的固定轨道消除了模型标签引起的 148.78px 漂移，却把“位置稳定”误当成了正确位置。
新回归先在旧构建上失败：统计容器中心距输入框中心 **98.875px**。左右轨道不对称，因此在剩余区域居中仍然偏左。

[19a-composer-stability.css](../src/19a-composer-stability.css) 改成两侧等宽的三轨布局：

    minmax(0, 1fr) clamp(60px, calc(100% - 424px), 408px) minmax(0, 1fr)

中间宽度只取决于输入宽度。统计恢复 flex 整组居中，不再拆成撑满轨道的两列；
右侧模型组与模型按钮均不 grow，避免模型和强度分隔成两大片；优先省略模型名，
短强度标签保留完整，长标签在独立 span 内省略，避免只留下被裁掉的中间几个字。上下文的原有最右定位与预留空间不变。
活动／排队状态仍使用第三栏，隐藏权限时不改变统计中线。窄屏以真实按钮命中测试验收，不再要求不符合对称布局的136px固定下限。

[稳定性回归](../scripts/check-composer-stability.mjs) 除短长文本间 x/width 不变，还分别断言统计容器、
实际统计项包围盒都位于输入框中线；模型与强度相距不超过3px，并保持在上下文一侧。
原有八档视口、静态统计、排队按钮、模型与推理交互测试继续运行。

### 22.2 账号菜单的身份和宽度

截图指向左下角账号入口的设置／反馈／退出菜单，不是设置主页面。
Claude 参考的260px只是 fallback，实际使用触发行的测量宽度。
[account-menu.js](../src/account-menu.js) 只在具名 settings.launcher 触发后标记对应原生 portal，
并以 ResizeObserver 更新局部 --fh-account-width；读取 offsetWidth 而不是带按压缩放的 DOMRect，
避免120ms回弹期间缓存缩小宽度（transform不触发ResizeObserver）。折叠账号入口使用260px fallback，CSS按视口限宽。
不再靠 aria-keyshortcuts 猜菜单身份，因此快捷键未绑定也有效，其他带快捷键的菜单不被误染。

[58-chrome.css](../src/58-chrome.css) 保留原生向上锚定和命令：12px卡片、6px内边距、32px行、
13/20文字、16px图标，补 viewport、separator、footer、selected 结构样式和自有材质变量。
helper不阻止事件、不搬节点；菜单移除或插件卸载后释放 observer、监听、帧与标记。
[账号菜单检查](../scripts/check-account-menu.mjs) 使用真实原生弹层验证测量宽度、缩放跟随、快捷键缺省、键盘退出与权限菜单隔离，
不触发退出登录或改变设置。--built 直接验证构建产物；默认模式临时预览源文件并恢复。

---

## 23. 版本之间


| 版本 | 主题 |
| --- | --- |
| 0.1.0 | 单套配色 + 布局 + 动效，自插 `ui-skin-furina-style` |
| 0.2.0 | 设置进 DeepSeek 设置界面、默认插画背景、修输入框悬空 |
| 0.3.0 | 细节层（代码/表格/工具行/占位）；删掉三个「替别的插件做内容策略」的开关 |
| 0.4.1 | 精修层、宿主自带导航条上色 + `Alt+↑/↓`、运行状态小胶囊、水膜滑块、窗口按钮去黑底 |
| 0.5.0 | 图片大小可调（用户/AI 两路）、引用块四档色调 + 浓度、精修层补到 P9、隔离测试环境 |
| 0.6.0 | 连续多图默认横排 + 横向滚动条；我发的 / AI 发的可分别选并列或堆叠 |
| 0.7.0 | 右侧 dock 面板磨砂化、22 个别名 token 补色、`data-state="failed"` 死规则改为 `running` |
| 0.7.1 | dock 标签条三处错位（全局细滚动条压掉宿主 `none`）、标签宽度上限 170→280px |
| 0.7.2 | dock 标签标题不再被 hover/active 态 mask 白吃一截：装得下就完整显示 |
| 0.8.0 | 会话头按钮抬进原生标题栏（纯 CSS + `env()`）、输入区独立成卡；两个开关 |
| 0.9.0 | dock 标签不再被自己撑出的 9px 幻影溢出诱发宿主渐隐；平滑输入光标（自绘层 + 80ms 滑动 + 1s 步进闪烁）；一个新开关 |
| 0.10.0 | 输入区按 claude 几何重排（工具行 28px 单行、+ 与发送键进卡面）；设置页去卡片化；窗口 chrome（dock 开关 / 侧栏账号行 / 账号菜单） |
| 0.11.0 | 正文容器补发丝外框（代码块 / 宽表格 / 我发出的附件卡）；焦点环收窄到真焦点语义，并跟住宿主的指针模态契约 |
| 0.12.0 | 排版轴：标题阶梯 21/18/16/14/13/12（宿主后两级塌平）、显式间距标尺、行内代码回到整数像素、断行质量 |
| 0.13.0 | 新会话页按 claude 构图收拢（标题 20/26 左对齐、720 列、三者同左缘）；浅色小字可读性修复（四个公共墨色下沉、品牌色 `#2a3660`、暗色品牌色钉回）；修掉三条从未命中的动效选择器 |
| 0.14.0 | 任务栏与输入框等宽；权限/统计/模型共享单行底栏，兼容窄面板、活动行、提示条与附件 |
| 0.15.0 | 透明回车发送键；模型 / 推理强度独立控件及离散滑条；原生权限水色菜单；上下文固定底栏右端 |
| 0.16.0 | 目标条等宽；统计独立固定轨道；模型主菜单＋更多模型侧栏；宽轨道／白色滑块／最高档五行点阵 |
| 0.17.0 | 统计以输入中线居中；模型与强度紧邻靠右；账号菜单实测等宽、Claude 几何与精准身份 |

