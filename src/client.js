/**
 * dsh-furina-style — Client 半边。
 *
 * 两件事：
 *   A. 主题：在 <html> 上写命名空间属性 data-dsh-furina，注入一张 <style>，
 *      按「谁在负责表面」切换 own / furina / other 三种档位。
 *   B. 设置：往 DeepSeek 设置界面（settings.section 槽位）注册一页偏好，
 *      写 localStorage（key = dsh-furina:prefs），改完即时生效、不用重启。
 *
 * 设计约束（用户明确要求）：
 *   - 配置必须长在宿主自己的设置界面里，不做插件私有配置页；
 *   - 默认背景是芙宁娜插画（data URI 内联在样式表里，不依赖 Host 路由）；
 *   - 不引入任何吉祥物 / 彩蛋；只在用户允许时「隐藏」别人插件的这类元素；
 *   - 任何第三方插件缺席/改名都必须零副作用：所有隐藏规则都是纯 CSS
 *     选择器，匹配不到就什么都不做，本文件也不 import 任何第三方包。
 *
 * 本文件是模板：CSS 占位符会被 scripts/build.mjs 替换成内联的样式表字符串，
 * 产物写进 lib/client.js。不要直接手改 lib/client.js。
 */
window.__ModuleLoader__.load({
  id: 'dsh-furina-style',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    /* ------------------------------------------------------------------ */
    /* 依赖（全部可选，拿不到就降级，绝不抛错）                            */
    /* ------------------------------------------------------------------ */

    var React = null;
    try {
      React = require('react');
    } catch (error) {
      React = null;
    }
    var h =
      React !== null && typeof React.createElement === 'function'
        ? React.createElement.bind(React)
        : null;

    /* ------------------------------------------------------------------ */
    /* 常量                                                                */
    /* ------------------------------------------------------------------ */

    const PLUGIN_ID = 'dsh-furina-style';
    const CSS_TAG_ID = PLUGIN_ID + '/furina-style.css';
    const CSS = __FH_STYLESHEET_JSON__;

    /** 命名空间属性：出现在 <html> 上，所有样式规则都以它为前缀。 */
    const ATTR_ROOT = 'data-dsh-furina';
    /** 表面模式：own / furina / other。 */
    const ATTR_SURFACES = 'data-dsh-furina-surfaces';
    /** 布局开关：on / off（让路给 claude-style 时是 off）。 */
    const ATTR_LAYOUT = 'data-dsh-furina-layout';
    /** 动效开关：on / reduced。 */
    const ATTR_MOTION = 'data-dsh-furina-motion';
    /** 背景模式：art / gradient / none。 */
    const ATTR_BG = 'data-dsh-furina-bg';
    /** 对话导航条开关：on / off。 */
    const ATTR_RAIL = 'data-dsh-furina-rail';
    /** 状态细节开关：on / off（给宿主状态行补一句「在做什么」）。 */
    const ATTR_STATUS = 'data-dsh-furina-status';
    /** 引用块底色：water / pearl / neutral / none。 */
    const ATTR_QUOTE = 'data-dsh-furina-quote';
    /** 让路标记：存在即表示布局段被别的主题接管。 */
    const ATTR_HANDOFF = 'data-dsh-furina-handoff';

    const ALL_ATTRS = [
      ATTR_ROOT,
      ATTR_SURFACES,
      ATTR_LAYOUT,
      ATTR_MOTION,
      ATTR_BG,
      ATTR_RAIL,
      ATTR_STATUS,
      ATTR_QUOTE,
      ATTR_HANDOFF,
    ];

    /**
     * 插画强度不用 opacity 控制（opacity 会把整层连纱一起变淡，插画淡了
     * 底色反而更亮），而是改写纱的 alpha：alpha 越低，插画越清楚。
     * 前三个变量是亮色的顶/中/底，后三个是暗色的。
     */
    const ART_SCRIM_VARS = [
      '--fh-art-scrim-top',
      '--fh-art-scrim-mid',
      '--fh-art-scrim-bottom',
      '--fh-art-scrim-dark-top',
      '--fh-art-scrim-dark-mid',
      '--fh-art-scrim-dark-bottom',
    ];

    /** 由 0..1 的强度算出六处纱的 alpha（strength 越大 → alpha 越小）。 */
    function scrimAlphas(strength) {
      const s = Math.min(1, Math.max(0.1, strength));
      const round = (n) => String(Math.round(n * 100) / 100);
      return [
        round(0.66 - 0.4 * s), // 亮 · 顶
        round(0.64 - 0.4 * s), // 亮 · 中
        round(0.7 - 0.42 * s), // 亮 · 底
        round(0.75 - 0.4 * s), // 暗 · 顶
        round(0.75 - 0.42 * s), // 暗 · 中
        round(0.8 - 0.42 * s), // 暗 · 底
      ];
    }

    /** 迁移用旧键（0.1.0 只存过动效偏好）。 */
    const LEGACY_MOTION_KEY = 'dsh-furina:motion';

    /* ------------------------------------------------------------------ */
    /* 偏好                                                                */
    /* ------------------------------------------------------------------ */

    const PREFS_KEY = 'dsh-furina:prefs';

    /** 默认值：背景用插画，布局、动效、导航条、状态细节全开。 */
    const PREFS_DEFAULT = Object.freeze({
      background: 'art', // art | gradient | none
      backgroundOpacity: 0.55, // 0..1
      veil: 0.4, // 0..1 —— 正文水膜浓度（0 = 完全去掉）
      layout: true,
      motion: 'system', // system | on | reduced
      rail: true, // 对话导航条（右侧短横线）
      status: true, // 状态行细节（在宿主那行后面补「在做什么」）
      imageUser: 240, // px —— 我发送的图片最大高度
      imageAssistant: 360, // px —— AI 发送的图片最大高度（宿主默认也是 360）
      quoteTint: 'water', // water | pearl | neutral | none
      quoteAlpha: 0.32, // 0..0.8 —— 引用块底色浓度
    });

    const BACKGROUND_MODES = ['art', 'gradient', 'none'];
    const MOTION_MODES = ['system', 'on', 'reduced'];
    const QUOTE_TINTS = ['water', 'pearl', 'neutral', 'none'];

    /** 图片高度的可调范围（px）。上限比下限宽，因为横图竖图差别大。 */
    const IMAGE_USER_RANGE = [100, 480];
    const IMAGE_ASSISTANT_RANGE = [120, 600];

    function clampOpacity(value) {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) return PREFS_DEFAULT.backgroundOpacity;
      return Math.min(1, Math.max(0.1, Math.round(n * 100) / 100));
    }

    /** 水膜可以到 0（完全关掉），所以下限与插画强度不同。 */
    function clampVeil(value) {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) return PREFS_DEFAULT.veil;
      return Math.min(1, Math.max(0, Math.round(n * 100) / 100));
    }

    /** 图片高度：整数 px，超出范围收敛到边界。 */
    function clampPx(value, range, fallback) {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) return fallback;
      return Math.round(Math.min(range[1], Math.max(range[0], n)));
    }

    /** 引用块浓度：0..0.8，两位小数。 */
    function clampQuoteAlpha(value) {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) return PREFS_DEFAULT.quoteAlpha;
      return Math.min(0.8, Math.max(0, Math.round(n * 100) / 100));
    }

    function pickEnum(value, allowed, fallback) {
      return allowed.indexOf(value) === -1 ? fallback : value;
    }

    function normalizePrefs(raw) {
      const input = raw !== null && typeof raw === 'object' ? raw : {};
      return {
        background: pickEnum(input.background, BACKGROUND_MODES, PREFS_DEFAULT.background),
        backgroundOpacity: clampOpacity(input.backgroundOpacity),
        veil: clampVeil(input.veil),
        layout: input.layout === undefined ? PREFS_DEFAULT.layout : Boolean(input.layout),
        motion: pickEnum(input.motion, MOTION_MODES, PREFS_DEFAULT.motion),
        rail: input.rail === undefined ? PREFS_DEFAULT.rail : Boolean(input.rail),
        status: input.status === undefined ? PREFS_DEFAULT.status : Boolean(input.status),
        imageUser: clampPx(input.imageUser, IMAGE_USER_RANGE, PREFS_DEFAULT.imageUser),
        imageAssistant: clampPx(
          input.imageAssistant,
          IMAGE_ASSISTANT_RANGE,
          PREFS_DEFAULT.imageAssistant
        ),
        quoteTint: pickEnum(input.quoteTint, QUOTE_TINTS, PREFS_DEFAULT.quoteTint),
        quoteAlpha: clampQuoteAlpha(input.quoteAlpha),
      };
    }

    function readPrefs() {
      let raw = null;
      try {
        raw = window.localStorage.getItem(PREFS_KEY);
      } catch (error) {
        raw = null;
      }
      if (raw === null) {
        // 从 0.1.0 的单一动效键迁移一次；迁移失败不影响其它默认值。
        let legacy = null;
        try {
          legacy = window.localStorage.getItem(LEGACY_MOTION_KEY);
        } catch (error) {
          legacy = null;
        }
        if (legacy === 'on' || legacy === 'reduced') {
          return normalizePrefs({ motion: legacy });
        }
        return normalizePrefs(null);
      }
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        parsed = null;
      }
      return normalizePrefs(parsed);
    }

    function writePrefs(prefs) {
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch (error) {
        /* 隐私模式 / 配额满：退回内存态，本次会话内仍然有效 */
      }
    }

    /** 偏好订阅：设置面板与样式同步共用一条通道。 */
    const prefListeners = new Set();

    function subscribePrefs(listener) {
      prefListeners.add(listener);
      return function () {
        prefListeners.delete(listener);
      };
    }

    function emitPrefs(prefs) {
      for (const listener of prefListeners) {
        try {
          listener(prefs);
        } catch (error) {
          /* 单个监听器出错不影响其它 */
        }
      }
    }

    function updatePrefs(patch) {
      const next = normalizePrefs(Object.assign({}, readPrefs(), patch));
      writePrefs(next);
      syncAttributes();
      emitPrefs(next);
      return next;
    }

    /* ------------------------------------------------------------------ */
    /* 样式表注入                                                          */
    /* ------------------------------------------------------------------ */

    function ensureStylesheet() {
      if (typeof document === 'undefined') return function () {};
      const selector = 'style[data-plugin-css="' + CSS_TAG_ID + '"]';
      const existing = document.querySelector(selector);
      if (existing !== null) {
        return function () {
          existing.remove();
        };
      }
      const tag = document.createElement('style');
      tag.dataset.plugin = PLUGIN_ID;
      tag.dataset.pluginCss = CSS_TAG_ID;
      tag.textContent = CSS;
      document.head.appendChild(tag);
      return function () {
        tag.remove();
      };
    }

    /* ------------------------------------------------------------------ */
    /* 模式判定                                                            */
    /* ------------------------------------------------------------------ */

    /**
     * 谁在负责表面？
     *   skin-center 激活皮肤时会往 <html> 写 data-dsh-skin="<id>"。
     *   没有它 → 本插件自己负责（own）；
     *   是 furina → 只修补（furina）；
     *   是别的 → 完全不碰颜色（other）。
     */
    function detectSurfaces() {
      const skin = document.documentElement.getAttribute('data-dsh-skin');
      if (skin === null || skin === '') return 'own';
      return skin === 'furina' ? 'furina' : 'other';
    }

    /**
     * 布局归谁？claude-style 会往 <html> 写 data-dsh-claude-style。
     * 它在跑时我们把布局段整块让出去，只保留配色。
     */
    function claudeStyleActive() {
      return document.documentElement.hasAttribute('data-dsh-claude-style');
    }

    /** 'system' 解析成实际档位（on / reduced）。 */
    function resolveMotion(pref) {
      if (pref === 'on' || pref === 'reduced') return pref;
      let systemReduced = false;
      try {
        systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (error) {
        systemReduced = false;
      }
      return systemReduced ? 'reduced' : 'on';
    }

    /* ------------------------------------------------------------------ */
    /* 属性同步                                                            */
    /* ------------------------------------------------------------------ */

    /** 只在值真的变化时写属性，避免无意义的样式重算。 */
    function setAttr(el, name, value) {
      if (el.getAttribute(name) !== value) el.setAttribute(name, value);
    }

    function syncAttributes() {
      const root = document.documentElement;
      const prefs = readPrefs();
      const handoff = claudeStyleActive();

      setAttr(root, ATTR_ROOT, '');
      setAttr(root, ATTR_SURFACES, detectSurfaces());
      setAttr(root, ATTR_LAYOUT, prefs.layout && !handoff ? 'on' : 'off');
      setAttr(root, ATTR_MOTION, resolveMotion(prefs.motion));
      setAttr(root, ATTR_BG, prefs.background);
      setAttr(root, ATTR_RAIL, prefs.rail ? 'on' : 'off');
      setAttr(root, ATTR_STATUS, prefs.status ? 'on' : 'off');
      setAttr(root, ATTR_QUOTE, prefs.quoteTint);
      if (handoff) {
        setAttr(root, ATTR_HANDOFF, 'claude-style');
      } else if (root.hasAttribute(ATTR_HANDOFF)) {
        root.removeAttribute(ATTR_HANDOFF);
      }
      const alphas = scrimAlphas(prefs.backgroundOpacity);
      for (let i = 0; i < ART_SCRIM_VARS.length; i += 1) {
        root.style.setProperty(ART_SCRIM_VARS[i], alphas[i]);
      }
      // 正文水膜浓度：CSS 只读这一个变量，0 = 完全透明。
      root.style.setProperty('--fh-veil', String(clampVeil(prefs.veil)));
      // 图片最大高度与引用块浓度：同样只写变量，样式表里取值。
      root.style.setProperty(
        '--fh-img-user-h',
        clampPx(prefs.imageUser, IMAGE_USER_RANGE, PREFS_DEFAULT.imageUser) + 'px'
      );
      root.style.setProperty(
        '--fh-img-ai-h',
        clampPx(prefs.imageAssistant, IMAGE_ASSISTANT_RANGE, PREFS_DEFAULT.imageAssistant) + 'px'
      );
      root.style.setProperty(
        '--fh-quote-alpha',
        Math.round(clampQuoteAlpha(prefs.quoteAlpha) * 100) + '%'
      );
    }

    /* ------------------------------------------------------------------ */
    /* 跟随宿主状态                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * 监听三个可能改变模式的外部信号：
     *   data-dsh-skin         —— 皮肤中心切换/卸载皮肤
     *   data-dsh-claude-style —— claude-style 启用/停用
     *   data-ds-dark-theme    —— 明暗切换（样式本身由 CSS 处理，这里只是入口）
     * 过滤器里不含本插件自己的属性，因此不会自激循环。
     */
    function watchHostState() {
      let stopWatch = function () {};
      if (typeof MutationObserver === 'function' && typeof document !== 'undefined') {
        const targets = [document.documentElement, document.body].filter(
          (el) => el !== null && el !== undefined
        );
        if (targets.length > 0) {
          const filter = ['data-dsh-skin', 'data-dsh-claude-style', 'data-ds-dark-theme', 'class'];
          const observer = new MutationObserver(syncAttributes);
          for (const target of targets) {
            observer.observe(target, { attributes: true, attributeFilter: filter });
          }
          stopWatch = function () {
            observer.disconnect();
          };
        }
      }

      let media = null;
      const onMediaChange = () => syncAttributes();
      try {
        media = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (typeof media.addEventListener === 'function') {
          media.addEventListener('change', onMediaChange);
        } else if (typeof media.addListener === 'function') {
          media.addListener(onMediaChange);
        }
      } catch (error) {
        media = null;
      }

      const stopMedia = function () {
        if (media === null) return;
        if (typeof media.removeEventListener === 'function') {
          media.removeEventListener('change', onMediaChange);
        } else if (typeof media.removeListener === 'function') {
          media.removeListener(onMediaChange);
        }
      };

      return function () {
        stopWatch();
        stopMedia();
      };
    }

    /* ------------------------------------------------------------------ */
    /* 对话导航：宿主已经画了一条，我们只补键盘快捷键                      */
    /* ------------------------------------------------------------------ */

    /**
     * 宿主自带轮次导航：@deepseek-ai/dsh-client-ui-chat 的 TurnNavigator 在
     * 对话右侧渲染一条竖排短横线（`nav` 里每个已加载轮次一个
     * `button[data-index]`），自带 aria-current、hover 预览气泡、虚拟滚动、
     * 上下淡出遮罩、容器查询与减弱动效支持。
     *
     * 0.4.0 之前本插件又自绘了一列 `.fh-rail`，于是右侧同时挂着两列刻度、
     * 位置还错开 20~60px —— 这是「看着不像成品」的直接来源（审计 #113）。
     * 0.4.1 起：不再创建任何 DOM，外观由 55-rail.css 直接给宿主那条 nav 上色；
     * 这里只补宿主没有的「键盘」—— Alt+↑ / Alt+↓ 在轮次之间跳。
     */
    function installRailKeys(translate) {
      if (typeof document === 'undefined') return function () {};
      const t = typeof translate === 'function' ? translate : fallbackTranslate;
      let disposed = false;

      function isEnabled() {
        return document.documentElement.getAttribute(ATTR_RAIL) === 'on';
      }

      function scrollElement() {
        return document.querySelector('[data-conversation-scroll]');
      }

      /** 已加载的轮次（宿主分页加载，没加载的轮次不在 DOM 里）。 */
      function turnNodes(scrollEl) {
        if (scrollEl === null) return [];
        return Array.prototype.slice.call(
          scrollEl.querySelectorAll('[data-chat-flow-kind="user"][data-chat-turn]')
        );
      }

      function preferredScrollBehavior() {
        return resolveMotion(readPrefs().motion) === 'reduced' ? 'auto' : 'smooth';
      }

      /** 视口里最靠上的一轮 = 当前轮；都不在视口内则取最近的一轮。 */
      function activeIndex(nodes, scrollEl) {
        if (nodes.length === 0) return -1;
        const box = scrollEl.getBoundingClientRect();
        const probe = box.top + Math.min(120, box.height / 3);
        let best = -1;
        let bestDistance = Infinity;
        for (let i = 0; i < nodes.length; i += 1) {
          const rect = nodes[i].getBoundingClientRect();
          if (rect.top <= probe && rect.bottom >= box.top) best = i;
          const distance = Math.abs(rect.top - probe);
          if (distance < bestDistance) bestDistance = distance;
        }
        if (best >= 0) return best;
        let nearest = 0;
        let nearestDistance = Infinity;
        for (let i = 0; i < nodes.length; i += 1) {
          const distance = Math.abs(nodes[i].getBoundingClientRect().top - box.top);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = i;
          }
        }
        return nearest;
      }

      function jump(nodes, scrollEl, index) {
        const node = nodes[index];
        if (node === undefined || node === null) return;
        const box = scrollEl.getBoundingClientRect();
        const offset = node.getBoundingClientRect().top - box.top + scrollEl.scrollTop;
        try {
          scrollEl.scrollTo({ top: Math.max(0, offset - 12), behavior: preferredScrollBehavior() });
        } catch (error) {
          scrollEl.scrollTop = Math.max(0, offset - 12);
        }
      }

      /** Alt+↑ / Alt+↓：跳上一轮 / 下一轮。输入框有草稿时不抢键。 */
      function onKeyDown(event) {
        if (disposed || !isEnabled() || !event.altKey) return;
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return;
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        const target = event.target;
        if (target !== null && typeof target.closest === 'function') {
          const field = target.closest('input, textarea, [contenteditable="true"]');
          if (field !== null) {
            const draft = typeof field.value === 'string' ? field.value : field.textContent;
            if (typeof draft === 'string' && draft.trim().length > 0) return;
          }
          if (target.closest('[role="dialog"], [role="menu"]') !== null) return;
        }
        const scrollEl = scrollElement();
        const nodes = turnNodes(scrollEl);
        if (scrollEl === null || nodes.length === 0) return;
        const dir = event.key === 'ArrowUp' ? -1 : 1;
        const current = activeIndex(nodes, scrollEl);
        const next = Math.min(nodes.length - 1, Math.max(0, current + dir));
        event.preventDefault();
        jump(nodes, scrollEl, next);
      }

      window.addEventListener('keydown', onKeyDown, true);

      return function () {
        disposed = true;
        window.removeEventListener('keydown', onKeyDown, true);
      };
    }

    /* ------------------------------------------------------------------ */
    /* 状态细节：给宿主的「深度求索中」补一句在做什么                      */
    /* ------------------------------------------------------------------ */

    /**
     * 宿主已经有一整行运行态文案（「深度求索中，用时 N 分 N 秒」+ 扫光 + 鲸鱼
     * 动画）。我们不去改它的文字（那是 React 的文本节点，动它会打架），而是
     * 往那一行元素上写两个自定义属性：
     *
     *   data-fh-phase       think / tool / stall
     *   data-fh-phase-label 本地化后的一句话
     *
     * CSS 再用 ::after + content: attr(data-fh-phase-label) 把它画成紧跟其后
     * 的小胶囊。属性不是 React 管理的东西，重渲染不会把它冲掉；插件卸载时
     * 我们主动清掉，页面上不留痕迹。
     *
     * 四个阶段怎么判：
     *   tool  有 [data-tool][data-state="running"] 挂着 → 补工具名
     *   write 助手正文正在变长（每次轮询采样文本长度）→ 补「正在写回答」
     *   stall 十二条秒内对话流没有任何变动，但仍然在跑 → 补「暂未响应」
     *   think 以上都不是
     *
     * 为什么 think 不出胶囊：宿主那行本来就写着「深度求索中」，再贴一枚
     * 「正在思考」是同一句话说两遍。胶囊只补宿主说不出来的三种情况。
     */
    function installStatus(translate) {
      if (typeof document === 'undefined') return function () {};
      const t = typeof translate === 'function' ? translate : fallbackTranslate;
      const PHASE_ATTR = 'data-fh-phase';
      const LABEL_ATTR = 'data-fh-phase-label';

      const WRITE_WINDOW_MS = 1800;
      const STALL_MS = 12000;

      let current = null;
      let timer = 0;
      let lastActivityAt = Date.now();
      let lastPhase = '';
      let lastTextLength = -1;
      let lastGrowthAt = 0;
      let disposed = false;

      function isEnabled() {
        return document.documentElement.getAttribute(ATTR_STATUS) === 'on';
      }

      function runningElement() {
        return document.querySelector('[data-chat-running="true"]');
      }

      function runningTool() {
        return document.querySelector('[data-tool][data-state="running"]');
      }

      /**
       * 胶囊挂在运行行最后那个孩子上（runningContent，display:flex）。
       * 挂在最外层运行行上会被它的 column 排布挤成第三行（审计 #12），
       * 而宿主这层结构是稳定的：读屏 span + divider + content。
       */
      function labelHost(run) {
        const last = run.lastElementChild;
        return last === null || last === undefined ? run : last;
      }

      function clear(el) {
        if (el === null || el === undefined) return;
        el.removeAttribute(PHASE_ATTR);
        el.removeAttribute(LABEL_ATTR);
      }

      /**
       * 采样助手正文的长度。两次采样之间变长了就记一次「刚刚在写」。
       * 比监听 data-* 状态可靠：宿主不会为「正在流式输出」写任何属性，
       * 但正文变长这件事一定会发生。
       */
      function sampleAssistantText() {
        const nodes = document.querySelectorAll('[data-chat-flow-kind="assistant-step"]');
        const last = nodes.length === 0 ? null : nodes[nodes.length - 1];
        const length = last === null ? 0 : String(last.textContent || '').length;
        if (lastTextLength >= 0 && length > lastTextLength) lastGrowthAt = Date.now();
        lastTextLength = length;
      }

      function phaseNow() {
        if (!isEnabled()) return null;
        const run = runningElement();
        if (run === null) return null;
        const host = labelHost(run);
        const tool = runningTool();
        if (tool !== null) {
          const name = tool.getAttribute('data-tool') || '';
          const label = name.length > 0 ? t('phaseTool') + ' ' + name : t('phaseTool');
          return { el: host, phase: 'tool', label };
        }
        const now = Date.now();
        if (now - lastGrowthAt < WRITE_WINDOW_MS) {
          return { el: host, phase: 'write', label: t('phaseWrite') };
        }
        if (now - lastActivityAt > STALL_MS) {
          return { el: host, phase: 'stall', label: t('phaseStall') };
        }
        return { el: host, phase: 'think', label: '' };
      }

      function tick() {
        if (disposed) return;
        sampleAssistantText();
        const next = phaseNow();
        const nextEl = next === null ? null : next.el;
        if (current !== null && current !== nextEl) {
          clear(current);
          current = null;
        }
        if (next === null) {
          lastPhase = '';
          return;
        }
        current = nextEl;
        if (next.label.length === 0) {
          clear(nextEl);
          lastPhase = next.phase;
          return;
        }
        const phaseKey = next.phase + '\u0000' + next.label;
        if (phaseKey === lastPhase) return;
        lastPhase = phaseKey;
        if (nextEl.getAttribute(PHASE_ATTR) !== next.phase) {
          nextEl.setAttribute(PHASE_ATTR, next.phase);
        }
        if (nextEl.getAttribute(LABEL_ATTR) !== next.label) {
          nextEl.setAttribute(LABEL_ATTR, next.label);
        }
      }

      // 「有没有动静」看对话流里的真实变化，不看运行行自己的计时器 ——
      // 那一行每秒都在改「用时 N 分 N 秒」，把它当活动信号，stall 永远不可达
      // （审计 #13）。所以观察回调里先排除运行行自己产生的变动。
      let observer = null;
      let observedRoot = null;

      function insideRunningRow(node) {
        let el = node === null || node === undefined ? null : node.nodeType === 1 ? node : node.parentElement;
        while (el !== null && el !== undefined) {
          if (el.getAttribute !== undefined && el.getAttribute('data-chat-running') === 'true') return true;
          el = el.parentElement;
        }
        return false;
      }

      function onMutations(records) {
        let real = false;
        for (let i = 0; i < records.length; i += 1) {
          const record = records[i];
          if (insideRunningRow(record.target)) continue;
          real = true;
          break;
        }
        if (!real) return;
        lastActivityAt = Date.now();
        tick();
      }

      function startObserver() {
        if (typeof MutationObserver !== 'function') return;
        const root = document.querySelector('[data-conversation-scroll]');
        if (root === null || root === observedRoot) return;
        if (observer !== null) observer.disconnect();
        observedRoot = root;
        observer = new MutationObserver(onMutations);
        observer.observe(root, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }

      lastActivityAt = Date.now();
      startObserver();
      // 会话切换时 [data-conversation-scroll] 整个会重建（审计 #14），
      // 所以这个心跳也负责「换绑 observer」；700ms 只做比较，开销可忽略。
      timer = window.setInterval(() => {
        startObserver();
        tick();
      }, 700);
      tick();

      return function () {
        disposed = true;
        if (timer !== 0) {
          window.clearInterval(timer);
          timer = 0;
        }
        if (observer !== null) {
          observer.disconnect();
          observer = null;
        }
        clear(current);
        current = null;
      };
    }

    /* ------------------------------------------------------------------ */
    /* 生命周期                                                            */
    /* ------------------------------------------------------------------ */

    function install(translate) {
      if (typeof document === 'undefined') return function () {};
      syncAttributes();
      const removeStylesheet = ensureStylesheet();
      const stopWatching = watchHostState();
      const stopRail = installRailKeys(translate);
      const stopStatus = installStatus(translate);
      return function () {
        stopStatus();
        stopRail();
        stopWatching();
        removeStylesheet();
        const root = document.documentElement;
        for (const attr of ALL_ATTRS) root.removeAttribute(attr);
        for (const name of ART_SCRIM_VARS) root.style.removeProperty(name);
        root.style.removeProperty('--fh-veil');
        root.style.removeProperty('--fh-img-user-h');
        root.style.removeProperty('--fh-img-ai-h');
        root.style.removeProperty('--fh-quote-alpha');
      };
    }

    /* ------------------------------------------------------------------ */
    /* 文案                                                                */
    /* ------------------------------------------------------------------ */

    const NS = 'furina-style';

    const STRINGS = {
      zh: {
        nav: '芙宁娜主题',
        title: '芙宁娜主题',
        desc: '水与珍珠的冷色调外观，外加一层可调的背景插画。设置即时生效，不需要重启。',
        bgLabel: '背景',
        bgHint: '默认使用芙宁娜插画；关掉可退回纯渐变或纯色画布。',
        bgArt: '插画',
        bgGradient: '渐变',
        bgNone: '纯色',
        opacityLabel: '插画强度',
        opacityHint: '插画透过画布的程度。文字发灰时可调低。',
        veilLabel: '内容遮罩',
        veilHint: '对话区压在插画上的那层水膜。觉得中间发黑就调低，0 为完全透明。',
        layoutLabel: '布局微调',
        layoutHint: '输入卡圆角与投影、对话列宽、会话头分隔线。',
        motionLabel: '动效',
        motionHint: '入场、悬停与弹层的动画节奏。',
        motionSystem: '跟随系统',
        motionOn: '开启',
        motionReduced: '减弱',
        statusLabel: '当前状态',
        statusOwn: '本主题独立负责配色与布局',
        statusFurina: '皮肤中心正在运行 furina 皮肤，本主题只做修补',
        statusOther: '别的皮肤正在运行，本主题不碰配色',
        statusHandoff: '检测到 claude-style 正在接管布局，本主题已让路',
        railLabel: '对话导航',
        railJump: '跳到第',
        railHint: '给宿主右侧那列轮次刻度换成皮肤的水色，并支持 Alt+↑ / Alt+↓ 跳上一轮 / 下一轮。',
        statusDetailLabel: '运行状态细节',
        statusDetailHint: '回答进行中时，在「深度求索中」这行末尾补一枚小胶囊，说清楚正在调用哪个工具，或者是不是卡住了。',
        phaseTool: '调用工具',
        phaseWrite: '正在写回答',
        phaseStall: '暂未响应',
        imageUserLabel: '我发送的图片',
        imageUserHint: '聊天记录里你自己发出去的图最大多高。觉得占地方就调小。',
        imageAssistantLabel: 'AI 发送的图片',
        imageAssistantHint: '助手回复里插入的图最大多高（宿主默认 360px）。',
        quoteLabel: '引用块',
        quoteHint: '正文里「> 引用」那一段的底色。水色最贴合这套皮肤，嫌抢眼可以换更淡的或直接关掉。',
        quoteWater: '水色',
        quotePearl: '珍珠',
        quoteNeutral: '中性',
        quoteNone: '关闭',
        quoteAlphaLabel: '引用块浓度',
        quoteAlphaHint: '引用块底色的深浅。调到 0 就只剩左边的竖线。',
        reset: '恢复默认',
        on: '开',
        off: '关',
      },
      en: {
        nav: 'Furina Theme',
        title: 'Furina Theme',
        desc: 'A cool water-and-pearl look with an adjustable background illustration. Changes apply instantly.',
        bgLabel: 'Background',
        bgHint: 'Uses the Furina illustration by default; switch to gradient or a flat canvas.',
        bgArt: 'Illustration',
        bgGradient: 'Gradient',
        bgNone: 'Flat',
        opacityLabel: 'Illustration strength',
        opacityHint: 'How much of the illustration shows through. Lower it if text feels washed out.',
        veilLabel: 'Content veil',
        veilHint: 'The water veil over the chat area. Lower it if the middle looks too dark; 0 is fully clear.',
        layoutLabel: 'Layout polish',
        layoutHint: 'Composer radius and shadow, chat column width, header divider.',
        motionLabel: 'Motion',
        motionHint: 'Timing for entrances, hovers and popovers.',
        motionSystem: 'System',
        motionOn: 'On',
        motionReduced: 'Reduced',
        statusLabel: 'Status',
        statusOwn: 'This theme owns the colors and layout',
        statusFurina: 'skin-center is running the furina skin; this theme only patches',
        statusOther: 'Another skin is active; this theme leaves colors alone',
        statusHandoff: 'claude-style is holding the layout; this theme stepped aside',
        railLabel: 'Conversation navigation',
        railJump: 'Jump to turn',
        railHint: 'Restyle the host turn ticks beside the conversation, and add Alt+↑ / Alt+↓ to jump between turns.',
        statusDetailLabel: 'Live status detail',
        statusDetailHint: 'While a reply is running, append a small pill to the status line saying which tool is running, or that it has stalled.',
        phaseTool: 'running tool',
        phaseWrite: 'writing a reply',
        phaseStall: 'no response yet',
        imageUserLabel: 'Images I send',
        imageUserHint: 'Maximum height for images you sent. Lower it if they take too much room.',
        imageAssistantLabel: 'Images from the assistant',
        imageAssistantHint: 'Maximum height for images in assistant replies (host default is 360px).',
        quoteLabel: 'Blockquote',
        quoteHint: 'Tint behind “>” quotes. Water matches the skin best; pick a softer one or turn it off.',
        quoteWater: 'Water',
        quotePearl: 'Pearl',
        quoteNeutral: 'Neutral',
        quoteNone: 'Off',
        quoteAlphaLabel: 'Blockquote strength',
        quoteAlphaHint: 'How strong the blockquote tint is. At 0 only the left rule remains.',
        reset: 'Reset',
        on: 'On',
        off: 'Off',
      },
    };

    function fallbackTranslate(key) {
      const lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
      const dict = lang.indexOf('zh') === 0 ? STRINGS.zh : STRINGS.en;
      return dict[key] !== undefined ? dict[key] : key;
    }

    /* ------------------------------------------------------------------ */
    /* 设置面板                                                            */
    /* ------------------------------------------------------------------ */

    function StatusLine(props) {
      const t = props.t;
      const surfaces = detectSurfaces();
      const handoff = claudeStyleActive();
      const key = handoff
        ? 'statusHandoff'
        : surfaces === 'furina'
          ? 'statusFurina'
          : surfaces === 'other'
            ? 'statusOther'
            : 'statusOwn';
      return h('div', { className: 'fh-set-status' }, h('span', { className: 'fh-set-dot' }), t(key));
    }

    function Segmented(props) {
      return h(
        'div',
        { className: 'fh-set-seg', role: 'group', 'aria-label': props.label },
        props.options.map((option) =>
          h(
            'button',
            {
              key: option.value,
              type: 'button',
              className: 'fh-set-seg-btn' + (option.value === props.value ? ' is-on' : ''),
              'aria-pressed': option.value === props.value,
              onClick: () => props.onChange(option.value),
            },
            option.label
          )
        )
      );
    }

    function Switch(props) {
      return h(
        'button',
        {
          type: 'button',
          role: 'switch',
          className: 'fh-set-switch' + (props.checked ? ' is-on' : ''),
          'aria-checked': props.checked,
          'aria-label': props.label,
          onClick: () => props.onChange(!props.checked),
        },
        h('span', { className: 'fh-set-knob' })
      );
    }

    function Row(props) {
      return h(
        'div',
        { className: 'fh-set-row' },
        h(
          'div',
          { className: 'fh-set-rowtext' },
          h('div', { className: 'fh-set-name' }, props.name),
          props.hint === undefined
            ? null
            : h('div', { className: 'fh-set-hint' }, props.hint)
        ),
        h('div', { className: 'fh-set-control' }, props.children)
      );
    }

    function SettingsSection(props) {
      const t = props !== null && props !== undefined && typeof props.t === 'function' ? props.t : fallbackTranslate;
      const [prefs, setPrefs] = React.useState(readPrefs);
      React.useEffect(() => subscribePrefs(setPrefs), []);

      const patch = (next) => {
        setPrefs(updatePrefs(next));
      };

      return h(
        'div',
        { className: 'fh-set' },
        h(
          'div',
          { className: 'fh-set-head' },
          h('div', { className: 'fh-set-title' }, t('title')),
          h('div', { className: 'fh-set-desc' }, t('desc'))
        ),
        h(
          'div',
          { className: 'fh-set-card' },
          h(
            Row,
            { name: t('bgLabel'), hint: t('bgHint') },
            h(Segmented, {
              label: t('bgLabel'),
              value: prefs.background,
              options: [
                { value: 'art', label: t('bgArt') },
                { value: 'gradient', label: t('bgGradient') },
                { value: 'none', label: t('bgNone') },
              ],
              onChange: (value) => patch({ background: value }),
            })
          ),
          h(
            Row,
            {
              name: t('opacityLabel'),
              hint: t('opacityHint'),
            },
            h('input', {
              className: 'fh-set-range',
              type: 'range',
              min: 10,
              max: 100,
              step: 5,
              value: Math.round(prefs.backgroundOpacity * 100),
              disabled: prefs.background !== 'art',
              'aria-label': t('opacityLabel'),
              onChange: (event) => patch({ backgroundOpacity: Number(event.target.value) / 100 }),
            }),
            h('span', { className: 'fh-set-value' }, Math.round(prefs.backgroundOpacity * 100) + '%')
          ),
          h(
            Row,
            {
              name: t('veilLabel'),
              hint: t('veilHint'),
            },
            h('input', {
              className: 'fh-set-range',
              type: 'range',
              min: 0,
              max: 100,
              step: 5,
              value: Math.round(prefs.veil * 100),
              disabled: prefs.background !== 'art',
              'aria-label': t('veilLabel'),
              onChange: (event) => patch({ veil: Number(event.target.value) / 100 }),
            }),
            h('span', { className: 'fh-set-value' }, Math.round(prefs.veil * 100) + '%')
          ),
          h(
            Row,
            { name: t('motionLabel'), hint: t('motionHint') },
            h(Segmented, {
              label: t('motionLabel'),
              value: prefs.motion,
              options: [
                { value: 'system', label: t('motionSystem') },
                { value: 'on', label: t('motionOn') },
                { value: 'reduced', label: t('motionReduced') },
              ],
              onChange: (value) => patch({ motion: value }),
            })
          ),
          h(
            Row,
            { name: t('layoutLabel'), hint: t('layoutHint') },
            h(Switch, {
              checked: prefs.layout,
              label: t('layoutLabel'),
              onChange: (value) => patch({ layout: value }),
            })
          ),
          h(
            Row,
            { name: t('railLabel'), hint: t('railHint') },
            h(Switch, {
              checked: prefs.rail,
              label: t('railLabel'),
              onChange: (value) => patch({ rail: value }),
            })
          ),
          h(
            Row,
            { name: t('statusDetailLabel'), hint: t('statusDetailHint') },
            h(Switch, {
              checked: prefs.status,
              label: t('statusDetailLabel'),
              onChange: (value) => patch({ status: value }),
            })
          ),
          h(
            Row,
            { name: t('imageUserLabel'), hint: t('imageUserHint') },
            h('input', {
              className: 'fh-set-range',
              type: 'range',
              min: IMAGE_USER_RANGE[0],
              max: IMAGE_USER_RANGE[1],
              step: 20,
              value: prefs.imageUser,
              'aria-label': t('imageUserLabel'),
              onChange: (event) => patch({ imageUser: Number(event.target.value) }),
            }),
            h('span', { className: 'fh-set-value' }, prefs.imageUser + 'px')
          ),
          h(
            Row,
            { name: t('imageAssistantLabel'), hint: t('imageAssistantHint') },
            h('input', {
              className: 'fh-set-range',
              type: 'range',
              min: IMAGE_ASSISTANT_RANGE[0],
              max: IMAGE_ASSISTANT_RANGE[1],
              step: 20,
              value: prefs.imageAssistant,
              'aria-label': t('imageAssistantLabel'),
              onChange: (event) => patch({ imageAssistant: Number(event.target.value) }),
            }),
            h('span', { className: 'fh-set-value' }, prefs.imageAssistant + 'px')
          ),
          h(
            Row,
            { name: t('quoteLabel'), hint: t('quoteHint') },
            h(Segmented, {
              label: t('quoteLabel'),
              value: prefs.quoteTint,
              options: [
                { value: 'water', label: t('quoteWater') },
                { value: 'pearl', label: t('quotePearl') },
                { value: 'neutral', label: t('quoteNeutral') },
                { value: 'none', label: t('quoteNone') },
              ],
              onChange: (value) => patch({ quoteTint: value }),
            })
          ),
          h(
            Row,
            { name: t('quoteAlphaLabel'), hint: t('quoteAlphaHint') },
            h('input', {
              className: 'fh-set-range',
              type: 'range',
              min: 0,
              max: 80,
              step: 4,
              value: Math.round(prefs.quoteAlpha * 100),
              disabled: prefs.quoteTint === 'none',
              'aria-label': t('quoteAlphaLabel'),
              onChange: (event) => patch({ quoteAlpha: Number(event.target.value) / 100 }),
            }),
            h('span', { className: 'fh-set-value' }, Math.round(prefs.quoteAlpha * 100) + '%')
          )
        ),
        h(
          'div',
          { className: 'fh-set-foot' },
          h(
            'div',
            { className: 'fh-set-footline' },
            h('span', { className: 'fh-set-footlabel' }, t('statusLabel')),
            h(StatusLine, { t })
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'fh-set-reset',
              onClick: () => patch(PREFS_DEFAULT),
            },
            t('reset')
          )
        )
      );
    }

    /* ------------------------------------------------------------------ */
    /* 插件入口                                                            */
    /* ------------------------------------------------------------------ */

    /**
     * 解析文案函数。宿主给了 locale 服务就用它，否则读 <html lang> 挑内置词典。
     * 运行时（导航条标签、状态行）与设置面板共用同一个 t，避免两处文案漂移。
     */
    function resolveTranslate(ctx) {
      try {
        if (
          ctx !== undefined &&
          ctx !== null &&
          ctx.locale !== undefined &&
          ctx.locale !== null &&
          typeof ctx.locale.bind === 'function'
        ) {
          return ctx.locale.bind(NS);
        }
      } catch (error) {
        /* 落到内置词典 */
      }
      return fallbackTranslate;
    }

    function installSettings(ctx, t) {
      if (h === null || ctx === undefined || ctx === null) return;

      try {
        if (typeof ctx.effect === 'function' && ctx.locale !== undefined && ctx.locale !== null) {
          if (typeof ctx.locale.register === 'function') {
            ctx.effect(() => ctx.locale.register(NS, STRINGS), PLUGIN_ID + ': settings copy');
          }
        }
      } catch (error) {
        /* 文案注册失败就用内置兜底，面板照样能显示 */
      }

      const slots = ctx.slots;
      if (slots === undefined || slots === null || typeof slots.inject !== 'function') return;
      try {
        slots.inject('settings.section', () =>
          slots.register(
            {
              name: 'settings.section',
              id: 'furina-style',
              order: 450,
              label: () => t('nav'),
              locale: NS,
            },
            SettingsSection
          )
        );
      } catch (error) {
        /* 设置界面不可用时静默降级：主题仍然生效 */
      }
    }

    function apply(ctx) {
      const t = resolveTranslate(ctx);
      if (ctx !== undefined && ctx !== null && typeof ctx.effect === 'function') {
        ctx.effect(
          () => install(t),
          PLUGIN_ID + ': furina surface'
        );
      } else {
        install(t);
      }
      installSettings(ctx, t);
    }

    exports.apply = apply;
    exports.inject = ['slots', 'locale'];
    exports.name = PLUGIN_ID;
    return module.exports;
  },
});
