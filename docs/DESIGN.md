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
| 滚动内容在底边淡出，不靠给卡片堆阴影 | 只声明雾化带高度 `--fh-composer-fade-h: 40px`，让宿主/skin 既有的渐变绘制继续工作，我们补滚动区留白 |
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
3. **不注册设置面板**：第一版刻意不做 settings.section，减少依赖面。三个开关
   通过 `localStorage` + 属性表达；如果以后要 UI，再加 section 即可（claude-style
   的 `settings.section` 注册是现成模板）。
4. **与 skin-center 的 furina 皮肤重叠**：`furina` 模式只做修补，不接管画布。
   想看到本插件的完整配色，请把皮肤中心的激活皮肤设为「无」，此时进入 `own` 模式。
5. **`lib/client.js` 是产物**：仓库里同时提交 `src/` 与 `lib/`，安装者不需要 node
   也能用；改源码后记得 `node scripts/build.mjs`。
