# dsh-furina-style

> 芙宁娜水色 × Claude 风格的布局与动效 —— 给 DeepSeek Harness Web GUI 的独立主题插件。

![dsh-furina-style](docs/preview-dark.png)

一个**纯客户端**的 DSH bundle 插件：零 Host 能力、零第三方依赖、零构建依赖。
它做四件事：

1. **配色**：一套冷调「水与珍珠」的调色板（亮 / 暗各自独立设计），覆盖宿主
   全部 `--dsw-alias-*` 语义 token；
2. **背景**：默认铺一张芙宁娜插画，上面盖一层可调浓度的纱，强度、模式都在
   **DeepSeek 设置界面**里调；
3. **布局**：借鉴 claude-style 的几何纪律 —— 独立水面式的输入卡、压薄的会话头、
   32px 行高的弹层、发丝线边框与墨色焦点环（**但不复制它的吉祥物、彩蛋**），
   外加一层只补质感的精修（会话头 / 标签页 / 侧栏 / 输入卡 / 弹层）；
4. **动效**：把所有时长 / 曲线 / 距离做成 `--fh-*` 令牌，克制的入场、反馈、
   循环呼吸三层节奏，并自带 reduced-motion 双保险；
   外加两处「宿主说不出来」的活体信息：右侧那列对话导航短横线的水色与
   `Alt+↑/↓` 跳轮、运行行末尾的「在做什么」小胶囊。

卸载插件 = 删掉 `<html>` 上的命名空间属性 + 那张注入的 `<style>` = 100% 还原，
不留任何残影。

> **0.2.0 起**：配置项移进了「设置 → 芙宁娜主题」，不再需要手改 localStorage；
> 默认背景图换成芙宁娜插画；顺手修掉了输入框下方 40px 悬空。
> **0.3.0 起**：去掉「隐藏第三方吉祥物 / 封号彩蛋 / 桌宠」三个开关 ——
> 主题只负责自己的表面，不替别的插件做内容策略。
> **0.4.1 起**：精修层 + 对话导航条 + 运行状态细节三件套；正文水膜浓度可调；
> Windows 右上角那三个原生窗口按钮不再是黑底。
> **0.5.0 起**：图片显示大小（你发的 / AI 发的分别可调）、引用块底色四档色调
> 与浓度都可调；精修层补到 P9（代码块 banner、对话里的「重试 / 中断」行）。
> **0.6.0 起**：连续多张图片默认**横排并列 + 底部横向滚动条**，
> 你发的和 AI 发的可以分别选「并列 / 堆叠」。
> **0.7.0 起**：右侧边栏（终端 / 文件 / 浏览器那一栏）不再是整块实色，
> 改成浮在水面上的磨砂玻璃；宿主一批「从未被主题接管」的中性灰按钮色
> 统一收进蓝紫色阶。
> **0.7.1 起**：右侧边栏标签条的三处错位修好了 —— 右上角三个图标按钮与标签
> 共线、「+」不再偏下、那条假的横向滚动条消失，长标题也能展开到 280px。
> **0.7.2 起**：标签标题不再被渐隐 mask 白吃一截 —— 只有真的装不下才渐隐，
> 装得下就完整显示，关闭叉与文字之间留出干净的 2px。
> **0.8.0 起**：会话头那两个按钮（「用文件资源管理器打开」+「更多操作」）
> 搬进 Windows 原生标题栏，和窗口三键同一行；输入框从「一整块大卡」改成
> 宿主式的**输入区独立成卡 + 工具行浮在卡下**，两件事都能在设置里关掉。

### 0.8.0 做了什么

![0.8.0](docs/preview-0.8.0.jpg)

两件事都来自一句话：「布局可以参考 claude 的，例如这两个按钮的位置；聊天框
部分也是可以参考」。

#### 一、会话头的两个按钮抬进原生标题栏

- **目标**：claude-style 的 headerBand —— 会话标题行的「用文件资源管理器打开」
  分体按钮和「更多操作」不再挤在标题行的右端（那里紧挨着右侧 dock 面板，
  视觉上像被夹住），而是升到窗口自己的 caption row 里，和最小化 / 最大化 /
  关闭三键齐平。
- **不需要一行 JS**：Electron 的 `window-controls-overlay` 在 Windows 上把两样
  东西喂给了渲染进程 —— CSS 环境的 `env(titlebar-area-width)` /
  `env(titlebar-area-height)`（本机实测 `1143px` / `40px`），以及 JS 的
  `navigator.windowControlsOverlay.getTitlebarAreaRect()`。区别是 CSS 那个
  **在插件加载的那一刻就是可用值**，所以整件事可以写成纯 CSS：

  ```css
  div:has(> [data-slot="conversation.session.header.utilities"]) {
    position: fixed;
    top: calc(env(titlebar-area-height, 40px) / 2);
    right: calc(100vw - env(titlebar-area-width, calc(100vw - 140px)) + 8px);
    transform: translateY(-50%);
  }
  ```

  `100vw - titlebar-area-width` 就是右侧三个窗口按钮占的宽度（本机 137px），
  `+ 8px` 是留给自己和它们的间距；两个 `env()` 都带兜底值，所以
  `window-controls-overlay` 不可用时退回「距右 148px」，不会跑到窗口外。

- **前置条件是拆掉 header 的 `backdrop-filter`**。0.4.1 起我们给会话头上了一层
  `blur(10px) saturate(125%)` 的毛玻璃，而 **`backdrop-filter` 会给它的
  `position: fixed` 后代创建 containing block** —— 按钮一进 header 就只相对
  header 定位，`top: 20px` 落在 y=46 而不是 y=6。修法是把同一层毛玻璃挪到
  `header::before`（`inset: 0; z-index: -1; pointer-events: none`），header 本体
  只留 `position: relative; z-index: 0`。视觉完全一致，fixed 又恢复自由。
- 祖先链上的三个 `overflow: hidden`（对话根 / centerCol / frame）**不影响
  `position: fixed`** —— fixed 只被 transform / filter / backdrop-filter /
  contain 约束，`overflow` 裁不到它。这一点已经实测，不用为了它去动宿主的
  布局类。
- 窄窗保护：宽度 ≤ 640px 时整条规则退化回 `position: static`，
  按钮回到标题行里（`src/16-band.css` 的 B3）。设置里关掉这个开关，
  `<html>` 上的 `data-dsh-furina-band` 变成 `off`，规则整体不生效。

#### 二、输入框改成「输入区独立成卡」

- 宿主原设计是**一整块大卡**：`[data-composer-card]` 有背景、22px 圆角、阴影，
  输入区（`[data-input-scroll]`）自己在里面**完全没有造型**（无背景、无边框、
  无内边距），所以视觉上文字、工具行、发送键都陷在同一块底里。
- claude-style 的做法正好相反：把大卡的底和边框全部拉平，只给输入区自己一张
  14px 小卡，工具行浮在卡下面的画布上。照这个思路：
  - `[data-composer-card]` → `background: transparent; border: 0; box-shadow: none;
    padding: 0; gap: 8px`；
  - `[data-input-scroll]` → 半透明的 `--dsw-specific-input-major` 底 +
    0.5px 发丝边 + `border-radius: 14px` + `padding: 2px` + 一层薄投影；
  - `:focus-within` 时边线换成 46% 的水色 + 一圈 3px 的 12% 光晕
    （宿主自己那圈 `--dsw-elevation-soft` 在 `framed` 模式下让位）；
  - 工具行 `[data-composer-card] > :last-child` 收紧到 `padding: 0 4px`、
    `gap: 10px`、`min-height: 30px`。
- 两个前提都是实测过的：`[data-input-scroll]` 确实是输入的**直接外层**
  （`[data-composer-input]` 是 lexical contenteditable，在它里面），
  卡片里那 9 个 `[data-slot]` 全是 `display: contents` 的空壳，
  不会因为给卡面改样式而错位；card 的最后一个子级恒为工具行。
- 暗色 / 亮色的阴影分开写（暗色用 `rgb(0 0 0 / .18)`，亮色换成
  `rgb(44 58 115 / .08)` 加一道内高光），reduced-motion 下过渡关掉。
- 设置里关掉 → `data-dsh-furina-composer="host"`，整套规则不生效，
  输入框回到宿主原样。

### 0.7.2 做了什么

- **标签标题「右边又被吞了」，是两件事叠在一起**：

  1. **宿主在 active/hover 态无条件挂渐隐**。`._tabActive_6nhg2_346 ._tabTitle_6nhg2_389`
     和 `:hover` / `:focus-within` 用的是同一个 `mask-image`：
     `linear-gradient(to right, #000 calc(100% - 30px), transparent calc(100% - 14px))`
     —— 那 30px 是给绝对定位的 `_tabClose_`（20px 宽 + right:4px）让位的。
     问题在于它**不检查文字是否真的溢出**（宿主只在 `[data-dockkit-tab-clipped]`
     时才该渐隐，而实测全页 `clippedEls=0`）；
  2. **0.7.1 把标签放宽到 280px 后，多数标题其实装得下**。实测标题盒 215.5px、
     文本自然宽只有 194.5px —— 文字根本没溢出，但那 30px 渐隐照样生效，
     把末尾 6px 吃掉、再叠上关闭叉的 14px，「右边被吞」就是这两处之和。

- **修法**：给非 quiet 标签的 `_tabTitle_` 加 `padding-inline-end: 16px`，
  同时把 mask 的渐隐起点从 `calc(100% - 30px)` 收到 `calc(100% - 16px)`。

  - 16px 的来历：关闭叉宽 20px、`right:4px`，需要让位的是 20 −（标签 padding 10）
    ≈ 10px，再留一点呼吸 → 16px 足够；比起 30px 多还给文字 14px。
  - `padding-inline-end` 必须一起加：只改 mask 会让渐隐区压在关闭叉上，
    文字会贴着 × 继续延伸。
  - 实测（长标题 `furina-skin-improvement-plan-amp.md` 场景）：短标题
    `textRight = fadeStart = 1066.2 → lossless=true`，文字与关闭叉间距 2px；
    长标题仍按宿主原有语义渐隐（`scrollWidth > clientWidth` 时才损失），
    不会假装装得下。

- **为什么加 `:not([class*="_tabQuiet_"])`**：首页那个「开始」标签是 quiet 变体，
  没有关闭叉，宿主明确给它 `mask-image: none` —— 用 16px 去挤它纯属无中生有。

### 0.7.1 做了什么

- **右侧边栏标签条的三处错位，其实是同一条链**。用户看到的是三件事：
  右上角三个图标按钮没和左边的标签中心对齐、「+」新建按钮偏下、标签标题被
  截断而且「还有滚动条」。实测下来病根只有一个：

  > 0.4.x 起，主题有一条全局规则 `* { scrollbar-width: thin }`（为了给正文、
  > 侧栏、代码块统一细滚动条）。它特异性 0,2,1，压过了宿主
  > `._stripTabs_6nhg2_257{ ... scrollbar-width: none }`（0,1,0）。于是那个
  > `overflow-x: auto` 的标签条被塞进了一条 10px 高的横向滚动条。

  这条滚动条的连锁反应：`_stripTabs_` 的高度从 28 变 38（内容 28 + 滚动条 10），
  里面的标签被顶到内容盒上沿、中心落在 y≈19；而右侧三个图标按钮直接在
  `_tabStrip_` 的 28px 内容盒里居中、中心在 y=24 —— **两者差 5px，就是
  「没对齐」和「+ 偏下」的全部原因**。

  修法是在 dock 面板内把宿主的意图还回去（`scrollbar-width: none` +
  `::-webkit-scrollbar { display: none }`），**只收窄到 `[data-dockkit-pane]`**，
  别处的细滚动条是这套皮肤的语言，不动。实测恢复后 `_stripTabs_` 高度 38→28、
  标签中心 19→24、与 chrome 中心 24 完全重合 —— 一条规则同时修好三件事，
  不需要任何 `align-items` / `margin` 补丁。

- **标签宽度上限 170px → 280px**。宿主 `._tab_6nhg2_134{max-width:170px}`
  把单个标签硬封死，再叠 `_tabTitle_` 的渐隐 mask，长文件名就只剩下半截。
  这里换成 280px（约 22 个中文字），保留宿主的 `min-width:80px` 和
  `flex:0 1 auto` —— 标签多的时候仍然会自然收缩。
  **踩过的坑**：一开始写的是 `max-width: min(46%, 280px)`，实测反而更窄
  （标签 118.7px、标题只有 99px）。原因是标签的包含块 `_stripTabs_` 本身是
  shrink-to-fit 的 flex item，百分比按「它已经收缩后的宽度」解析
  （214.5 × 46% ≈ 98.7px），正好把标题卡住。**这种循环依赖的布局里百分比
  没有意义，只能用绝对长度。**

### 0.7.0 做了什么

- **右侧边栏主题化**：宿主给 dock 面板的底色是 `--dsw-alias-bg-base`（我们
  早就接管成 `#101624` 了），但 576 宽的整块**实色**贴在插画背景上，既没有
  边界也不透光，看着像另一套 UI 硬塞进来 —— 这是整套皮肤里最割裂的表面。
  现在它是 `--fh-surface-base` 的 86% + `backdrop-filter: blur(24px)`，
  贴边那侧给 16px 圆角和一条 0.5px 内描边，标签条与正文之间补一条 0.5px
  分隔线。关插画（渐变 / 纯色底）或减弱动效时自动退回实色 —— 那时没有东西
  可模糊，免白烧 GPU。
- **标签条统一语汇**：宿主激活标签用的是 `--dsw-alias-markdown-tag`（一块中
  灰蓝），和输入卡的选中态不是同一个语汇。改成品牌水色 + 内描边；未激活的
  hover 给 6% 水膜；关闭叉默认 55% 透明度、hover 才浮现。
- **补上 22 个从未被接管过的宿主别名 token**（只覆盖有真实消费点的那些）：
  - `button-elevated-fill`：暗色下是 `#43454a`（一块死灰），驱动侧栏顶部的
    「新会话」按钮 —— 背景色普查里那个孤零零的 `rgb(67,69,74)` 就是它。
    现在亮 `#fff` / 暗 `#24314f`。
  - `button-primary-hover`：暗色下宿主给的是 `#ebeef2`，主按钮一 hover 直接
    发白。改成 `#93a8e0`。
  - 同批还包括 `button-floating-*`、`button-ghost-active-*`、
    `button-info-*`、`button-tool-bar-*`、`menu-icon`、`menu-group-header-fill`、
    `switch-thumb`、`label-dimmed`、`label-primary-bluish`、
    `border-l2-darkmode-thin`、`code-diff-added/deleted`、`tooltip-key-bg`、
    `label-shimmer`。
  - **不覆盖**那些宿主 CSS 里 0 处消费的 token（`settings-card-stroke`、
    `onboarding-*`、`file-diff-*` 等）—— 覆盖了也没人读，只是噪音。
- **修正一条永远不命中的规则**：工具行的状态分支之前写的是
  `[data-state="failed"]`，但宿主 `[data-tool]` 的 `data-state` 实测只有
  `ok` / `error` / `running` 三种。`failed` 那条从未生效过。改成 `running`：
  运行中的那一行给一层呼吸的水膜（减弱动效时不呼吸）。
- **不做**：`dsh-easyrewrite` 的用户气泡是第三方插件自己写的内联样式，
  按 0.3.0 定下的原则（主题只负责自己的表面，不替别的插件做内容策略），
  这里不接管。

### 0.6.0 做了什么

- **连续多张图片默认横排**，图多了不再往下堆，而是一条横向带、底下有滚动条。
  三条渲染路径各自处理，**都不动 DOM 结构**（这些节点全在 React 手里）：
  - **我发送的图片**：容器 `[data-dsh-easyrewrite="user-images"]` 自带内联
    `flex-direction: column`，主题用 `!important` 改成 `row` + `overflow-x: auto`。
  - **AI 的结构化图片块**：宿主 `ImageGallery` 的 `div[class*="_gallery"]`
    原本 `flex-wrap: wrap` 且缩略图写死 64×64。并列模式下容器改 `nowrap` +
    横向滚动，缩略图改成「高度 = AI 图片最大值 × 0.6、宽度按比例」。
  - **AI 的 markdown 图片**：连续写在同一段（中间没有空行）的 `![](a) ![](b)`
    会成为同一个 `<p>` 里的多个图按钮。用 `:has()` 找这种段落，改成
    `white-space: nowrap` + `overflow-x: auto`。
    **这里刻意不用 flex**：一句文字 + 两张图也是同一个段落，flex 会把那段文字
    变成匿名 flex item 顶到最右边（实测首个图按钮位移 170px）；inline 流下
    文字自然留在行首，图跟在后面一起滚。
- **两种排布可分别设置**（设置 →「我发送的图片排布」/「AI 图片排布」）：
  **并列**（默认）/ **堆叠**（退回宿主原来的竖排）。
- **单图不受影响**：只有同一段落里 ≥2 张图才接管，一张图仍是宿主原样的 360px 大图。
- AI 图尺寸滑块（0.5.0 的「AI 发送的图片」）在并列模式下同时决定缩略图高度，
  所以「调多大」和「怎么排」是联动的、不需要第三个滑块。

### 0.5.0 做了什么

- **图片显示大小可调**（设置 →「我发送的图片」/「AI 发送的图片」）：两处图片走的是
  完全不同的渲染路径，所以给两个滑块而不是一个。
  - 你发的图由本插件参与维护的 `dsh-easyrewrite` 补丁渲染
    （`[data-dsh-easyrewrite="user-images"] img[data-dbe-msg-image]`），它自带内联
    `max-height:280px`，所以主题这边必须 `!important` 才压得住。默认从 280 收到
    **240px**（之前反馈「我发的图看着偏大」）。
  - AI 回复里插入的图由宿主 `ui-chat` 渲染（`button[class*="_imageButton_"] img`），
    宿主给的是 `max-height:360px / max-width:min(100%,640px)`，默认 **360px** 保持原样。
  - 取值范围 100–480 / 120–600，step 20。锚点用 CSS-module 类名的**子串**
    （`_imageButton_` 是人写部分，`1ypvv` 那样的哈希会随宿主构建变）。
- **引用块底色可调**（设置 →「引用块」+「引用块浓度」）：暗色下原来那块
  `--fh-brand-wash` 42% 的亮色水膜会泛成一块奶白，非常突兀。现在改成
  四档色调（**水色** `#263353` / **珍珠** `#2c3a5e` / **中性** `#dbe2f2` / **关闭**）
  × 浓度 0–80%，竖线改用 `--dsw-alias-brand-primary` 半透明，不再跟着底色走。
  默认水色 + 32%（原来 42%）。
- **顺带修掉同源的泛白**：暗色块补了 `--fh-brand-wash: #263353` 与
  `--fh-pearl: #2c3a5e` 的覆盖 —— 之前这两个 token 在暗色下仍是亮色值，
  导致动效里的环境光斑、表头水膜也一起泛白。
- **精修层补两段**（`src/15-polish.css`，P8–P9）：
  - **P8 代码块**：宿主把 banner 条和正文 `pre` 画成两种灰硬拼，中间没有分隔；
    复制按钮完全裸奔（无圆角、无悬停）。这里补一条 0.5px 水色发丝线、
    复制按钮的圆角/内距/悬停水膜。
  - **P9 重试与中断行**：`[data-chat-flow-kind="turn-error"]` 与
    `[data-chat-flow-kind="model-retry"]` 这两类行宿主完全没主题化
    （透明底、16px 正文色）。改成错误 7% / 警告 6% 的淡底 + 0.5px 内描边，
    字号压到 13px。
- **测试方式改了**：这版起不再在用户正在用的那个实例里做验证，而是用
  `DSH_HOME=C:\Users\11515\.dsh-test` 起一个独立的
  `dsh --profile furina-test web --no-open --port 5177`，
  再用 headless Edge 的 CDP 驱动探针。原因写在 `docs/DESIGN.md` 的 §8.3。

### 0.4.1 做了什么

- **精修层**（`src/15-polish.css`，P1–P7）：会话头的毛玻璃与排印、标签页悬停水膜
  与「左浓右淡」的激活下划线、侧栏选中行的水色、输入卡里模型/权限按钮的悬停与
  按压、行尾操作条（复制 / 重答）手感、弹层与菜单的指针反馈、正文控件一致性。
  只改「宿主已经画对了、但质感不到位」的地方，不新增结构、不动几何。
- **对话导航条**（`src/55-rail.css`，R1–R3）：给宿主自带的那列短横线上色 ——
  未加载 / 普通 / 悬停 / 当前四档拉开层次，悬停预览气泡补一层玻璃，减弱动效下
  过渡归零；`Alt+↑ / ↓` 跳上/下一轮（输入框有草稿时自动让路）。
  **0.4.1 起不再自绘 DOM**：开发期那版没发现宿主已有 TurnNavigator，自绘了一列，
  导致右侧同时挂两列刻度、横向错开几十像素。
- **运行状态细节**（`src/56-status.css` + `client.js`，S1）：宿主运行行本来就写着
  「深度求索中，用时 N 分 N 秒」并自带扫光与鲸鱼，这一层**不替换**它，只在行末补
  一枚小胶囊说清「在做什么」：`调用工具 <名字>` / `正在写回答` / `暂未响应`
  （12 秒没有任何 DOM 变动）。思考阶段不出胶囊 —— 同一句「深度求索中」说两遍是废话。
- **正文水膜可调**（设置 →「内容遮罩」）：压在插画与正文之间那层纱的浓度，
  0–100%。默认 40%，比改动前那版的固定 81% 淡一半；嫌中间发黑就往下拉，
  0 是完全透明（插画全透出来，正文对比度约 1.6:1，只适合看着玩时用）。
- **原生窗口按钮去黑底**：Windows 上右上角的最小化/最大化/关闭是 Electron 的
  `titleBarOverlay`，颜色由宿主 preload 里一个隐藏探针 `span` 的
  `background-color` 采样得到。把那个 span 压成透明（`!important` 压过内联样式），
  三个按钮就直接浮在插画上，不再是一块深蓝药丸。
- **顺手修掉的 bug**：亮色规则把 `:not([data-ds-dark-theme])` 写在 `<html>` 上 ——
  这个属性挂在 `body` 上，所以条件永远为真，暗色下会涂出一条 75px 灰白亮带。

### 0.3.0 做了什么

- **细节层**（`src/50-details.css`）：行内代码、表格、分隔线、`kbd`、链接、
  列表、标题间距、工具调用行、过程组、输入占位文案 —— 宿主没有主题化、
  但每条回答里都会反复出现的东西。
- **修掉三条「看着生效、其实一个节点都没选中」的规则**：
  `[class*="_bubble"]`（宿主不画用户气泡，那是渲染它的插件画的）、
  `[data-windows-titlebar] [class*="_frame"]`（这个属性挂在 `<html>` 自己身
  上，得写成 `html[...][data-windows-titlebar] [class*="_frame"]`）、
  `::placeholder`（输入框是 lexical 的 `contenteditable`，占位文案是它后面
  那个 `aria-hidden` 的兄弟节点）。
- 输入卡占位文案降到 `label-tertiary`，第一眼能分清「空输入框」和「已输入」。

---

## 安装

插件是标准 DSH bundle，源码目录即可直接安装：

```bash
# 在你的 DSH 里（或让 Agent 调用 plugin_manager）
plugin_manager install_bundle {"target": "<绝对路径>/dsh-furina-style"}
```

安装后**重启应用**（不是刷新页面）才会生效。

### ⚠️ 重新构建之后必须重启应用，不要只刷新页面

宿主给每个插件 chunk 算了一个 `rev`（= 文件 mtime/ctime/size 的哈希），缓存在
Host 进程内存里；`lib/client.js` 一变，内存里的 rev 就和磁盘对不上，按旧 rev
去取 chunk 一律 404，页面会卡在启动屏并弹出「DeepSeek Harness 无法使用 /
`dsh-furina-style`: import failed」。**重建 `lib/client.js` 之后一定要完整重启
应用**（退出再打开），只 `location.reload()` 会稳定复现这个 404。

只改 CSS 的令牌值但没重新 build 时，刷新页面当然也是没用的 —— CSS 在
`lib/client.js` 里面。

### 从源码构建

```bash
node scripts/build.mjs   # src/*.css + src/client.js → lib/client.js
```

`lib/client.js` 是产物（顶部有 GENERATED 标记），不要手改。构建完记得重启应用。

### 在隔离实例里测试（不打扰自己正在用的那个）

从 0.5.0 起，验证不在日常实例里做，而是另起一个 home：

```bash
export DSH_HOME='C:\Users\11515\.dsh-test'
"<...>/resources/runtime/cli/bin/dsh.cmd" --profile furina-test --no-open --port 5177
```

`C:\Users\11515\.dsh-test\profiles\node_modules` 是一个 junction，指回真实
`.dsh\profiles\node_modules`（靠 Node 的向上查找拿到 `@deepseek-ai/*` 全家桶，
不必装第二份 1.1 GB）；`profiles\furina-test\node_modules` 里只有两个 junction
指向本仓库和 `dsh-easyrewrite-patched` 的源码目录，所以**改完源码重新 build，
重启这个实例就能看到，完全不影响桌面里那个**。探针用 headless Edge +
`--remote-debugging-port=9333` 走 CDP，不需要抢焦点、不需要点 DevTools。

---

## 设置

所有开关都在 **DeepSeek 设置 → 芙宁娜主题**（`settings.section`，order 450），
改完即时生效、不用重启、不用刷新。面板复用宿主 token，跟随亮/暗主题。

| 项 | 取值 | 说明 |
| --- | --- | --- |
| 背景 | 插画 / 渐变 / 纯色 | 插画 = 内置那张芙宁娜图；渐变 = 原来的水光渐变；纯色 = 只留画布色 |
| 插画强度 | 10% – 100% | 改的是纱的 alpha，不是整层 opacity —— 调低时插画更清楚，底色不变亮 |
| 内容遮罩 | 0% – 100% | 压在与正文之间那层水膜的浓度。嫌中间发黑就调低，0 = 完全透明 |
| 动效 | 跟随系统 / 开启 / 减弱 | 写 `data-dsh-furina-motion`，与 `prefers-reduced-motion` 双保险 |
| 布局微调 | 开 / 关 | 输入卡圆角与投影、对话列宽、会话头分隔线、精修层 |
| 对话导航 | 开 / 关 | 右侧短横线（宿主 TurnNavigator）的上色与 `Alt+↑/↓` 跳轮 |
| 运行状态细节 | 开 / 关 | 运行行末尾那枚「调用工具 / 正在写回答 / 暂未响应」小胶囊 |
| 标题栏放操作按钮 | 开 / 关 | 把「用文件资源管理器打开」+「更多操作」抬进 Windows 原生标题栏。默认开 |
| 输入框独立成卡 | 开 / 关 | 输入区自己一张 14px 小卡、工具行浮在卡下；关掉回宿主一整块大卡。默认开 |
| 我发送的图片 | 100 – 480 px | 你自己发出去的图最大多高。默认 240 |
| AI 发送的图片 | 120 – 600 px | 助手回复里插入的图最大多高。默认 360（= 宿主原值） |
| 我发送的图片排布 | 并列 / 堆叠 | 连续多张图怎么摆。默认**并列**（横排 + 横向滚动条） |
| AI 图片排布 | 并列 / 堆叠 | 同上，作用于 AI 的结构化图片块与 markdown 多图段落。默认**并列** |
| 引用块 | 水色 / 珍珠 / 中性 / 关闭 | 正文 `> 引用` 那段的底色色调。默认水色 |
| 引用块浓度 | 0% – 80% | 引用块底色的深浅，0 = 只剩左边竖线。默认 32% |

「插画强度」和「内容遮罩」只在背景 = 插画时可调（其它模式的画布是纯 CSS 渐变）。
「引用块浓度」在色调选「关闭」时自动变灰。

底部还有一行「当前状态」，显示此刻是谁在负责表面（独立 / 修补芙宁娜皮肤 /
让路给其它皮肤 / 让路给 claude-style），以及一个「恢复默认」。

### 配置存在哪

`localStorage["dsh-furina:prefs"]`，一段 JSON：

```json
{
  "background": "art",
  "backgroundOpacity": 0.55,
  "veil": 0.4,
  "layout": true,
  "motion": "system",
  "rail": true,
  "status": true,
  "imageUser": 240,
  "imageAssistant": 360,
  "quoteTint": "water",
  "quoteAlpha": 0.32,
  "imageLayoutUser": "row",
  "imageLayoutAssistant": "row",
  "headerBand": true,
  "composerFramed": true
}
```

`veil`（内容遮罩）与 `quoteAlpha` 允许 0，其余百分比类的下限都是 0.1；不认识的键在
读入时丢弃，缺的键补默认值。0.4.1 之前存的配置没有 `veil` / `rail` / `status`，
0.4.1 之后、0.5 之前存的配置没有 `imageUser` / `imageAssistant` / `quoteTint` /
`quoteAlpha`，0.5 之后、0.6 之前存的配置没有 `imageLayoutUser` /
`imageLayoutAssistant`，0.7 系列存的配置没有 `headerBand` / `composerFramed`，
读入时都会自动补上。

0.1.0 只存过 `dsh-furina:motion`，升级时会自动迁移一次，然后删掉旧键。
读不到 localStorage（隐私模式、禁用存储）时全部回落到内置默认值，不报错。

### 默认背景图

`assets/furina-art-1440.jpg`（1440×757，69 kB）在构建时被 base64 内联进
`lib/client.js`，所以**不依赖 Host 静态路由**、不依赖磁盘上还有这个文件。
代价是产物大 ~93 kB；好处是插件只有「一张样式表」一条加载路径，任何一侧
挂掉都不会出现「背景 404 → 一片空白」的第三态。

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
| 补运行态细节（在做什么 / 卡住了） | ❌ | ✅（读宿主运行行，不替换它的文本） |
| 改原生窗口按钮（`titleBarOverlay`） | ❌ | ✅（压宿主 preload 的探针采样色） |
| 可调图片显示大小 / 引用块色调 | ❌ | ✅（settings.section 里的滑块与分段控件） |
| 多图并列成横向带 + 分别设置两路排布 | ❌ | ✅（纯 CSS，不动 React 管的 DOM） |
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

三档，在设置面板里选（`动效` 一行），也可以直接写存储：

```js
// 跟随系统（默认）
localStorage.removeItem('dsh-furina:prefs');   // 或把 motion 置为 "system"
// 强制开启
JSON.parse(localStorage.getItem('dsh-furina:prefs')).motion = 'on';
// 强制减弱
JSON.parse(localStorage.getItem('dsh-furina:prefs')).motion = 'reduced';
```

改完刷新页面即可。`prefers-reduced-motion: reduce` 还会额外兜底（防 JS 未就绪
时动效先播一遍）。

---

## 工程结构

```
dsh-furina-style/
├── package.json          # dsh.bundle.patch / dsh.client 声明
├── cordis.patch.yml      # 把自己 insert 进 web roster
├── index.js              # Host 半边（空实现，本插件不用 Host 能力）
├── skin.json             # 给皮肤中心读的身份证（可选）
├── assets/
│   └── furina-art-1440.jpg   # 内置背景插画（构建时转 data URI）
├── src/
│   ├── 00-tokens.css     # 设计令牌 + 三种表面模式的配色
│   ├── 10-layout.css     # 布局（L1–L11，含图片显示大小与并列排布）
│   ├── 15-polish.css     # 精修层（P1–P9，宿主已画但对的地方补质感）
│   ├── 16-band.css       # 会话头操作按钮抬进原生标题栏（B1–B3）
│   ├── 17-composer.css   # 输入区独立成卡（C1–C5）
│   ├── 20-motion.css     # 动效（M1–M11）
│   ├── 30-surface.css    # 背景插画层 + 让容器背景透明 + 正文水膜
│   ├── 40-settings.css   # 设置面板样式（.fh-set-*）
│   ├── 50-details.css    # 细节层（行内代码/表格/工具行/占位文案）
│   ├── 55-rail.css       # 对话导航条（宿主 TurnNavigator 的上色）
│   ├── 56-status.css     # 运行状态行的小胶囊（S1）
│   ├── 57-dock.css       # 右侧 dock 面板（K1–K6，磨砂 + 标签条对齐修正）
│   └── client.js         # 偏好读写 / 属性同步 / 设置面板 / 样式注入模板
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

`env(titlebar-area-*)` 只在 Electron 的 `window-controls-overlay` 生效时给出真值；
拿不到时标题栏那条规则用兜底值（距右 148px）定位，行为仍是「固定的右上角」，
只是不会精确贴着窗口三键。浏览器里打开（非 Electron）时这条规则无意义，
可以关掉设置里的「标题栏放操作按钮」。

不支持 `:has()` / `color-mix()` 时样式会优雅降级：颜色变量仍然生效，
用到这两个特性的布局/装饰规则整条失效，不会破坏宿主原有布局。

**对外部插件零依赖**：`dsh-claude-style`、皮肤中心都只是「如果装了，就读一下
它的状态属性」的关系，本插件从不隐藏、不修改、不依赖它们的任何 DOM。它们全都
不装时，本插件照常工作，不会报错、不会空等、不会影响启动。

---

## License

MIT © Tki-sor

配色灵感来自 DSH 官方芙宁娜皮肤（BSD 3-Clause, © zhu1090093659）与
[dsh-claude-style](https://github.com/Nwflower/dsh-claude-style)（MIT, © Nwflower）；
本插件为独立实现，未复制其源码。详见 `THIRD_PARTY_NOTICES.md`。
