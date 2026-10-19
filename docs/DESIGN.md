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

## 11. 版本之间

| 版本 | 主题 |
| --- | --- |
| 0.1.0 | 单套配色 + 布局 + 动效，自插 `ui-skin-furina-style` |
| 0.2.0 | 设置进 DeepSeek 设置界面、默认插画背景、修输入框悬空 |
| 0.3.0 | 细节层（代码/表格/工具行/占位）；删掉三个「替别的插件做内容策略」的开关 |
| 0.4.1 | 精修层、宿主自带导航条上色 + `Alt+↑/↓`、运行状态小胶囊、水膜滑块、窗口按钮去黑底 |
| 0.5.0 | 图片大小可调（用户/AI 两路）、引用块四档色调 + 浓度、精修层补到 P9、隔离测试环境 |
| 0.6.0 | 连续多图默认横排 + 横向滚动条；我发的 / AI 发的可分别选并列或堆叠 |
| 0.7.0 | 右侧 dock 面板磨砂化、22 个别名 token 补色、`data-state="failed"` 死规则改为 `running` |
