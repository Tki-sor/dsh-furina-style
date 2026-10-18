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
    /** 让路标记：存在即表示布局段被别的主题接管。 */
    const ATTR_HANDOFF = 'data-dsh-furina-handoff';

    const ALL_ATTRS = [
      ATTR_ROOT,
      ATTR_SURFACES,
      ATTR_LAYOUT,
      ATTR_MOTION,
      ATTR_BG,
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

    /** 默认值：背景用插画，布局与动效全开。 */
    const PREFS_DEFAULT = Object.freeze({
      background: 'art', // art | gradient | none
      backgroundOpacity: 0.55, // 0..1
      layout: true,
      motion: 'system', // system | on | reduced
    });

    const BACKGROUND_MODES = ['art', 'gradient', 'none'];
    const MOTION_MODES = ['system', 'on', 'reduced'];

    function clampOpacity(value) {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) return PREFS_DEFAULT.backgroundOpacity;
      return Math.min(1, Math.max(0.1, Math.round(n * 100) / 100));
    }

    function pickEnum(value, allowed, fallback) {
      return allowed.indexOf(value) === -1 ? fallback : value;
    }

    function normalizePrefs(raw) {
      const input = raw !== null && typeof raw === 'object' ? raw : {};
      return {
        background: pickEnum(input.background, BACKGROUND_MODES, PREFS_DEFAULT.background),
        backgroundOpacity: clampOpacity(input.backgroundOpacity),
        layout: input.layout === undefined ? PREFS_DEFAULT.layout : Boolean(input.layout),
        motion: pickEnum(input.motion, MOTION_MODES, PREFS_DEFAULT.motion),
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
      if (handoff) {
        setAttr(root, ATTR_HANDOFF, 'claude-style');
      } else if (root.hasAttribute(ATTR_HANDOFF)) {
        root.removeAttribute(ATTR_HANDOFF);
      }
      const alphas = scrimAlphas(prefs.backgroundOpacity);
      for (let i = 0; i < ART_SCRIM_VARS.length; i += 1) {
        root.style.setProperty(ART_SCRIM_VARS[i], alphas[i]);
      }
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
    /* 生命周期                                                            */
    /* ------------------------------------------------------------------ */

    function install() {
      if (typeof document === 'undefined') return function () {};
      syncAttributes();
      const removeStylesheet = ensureStylesheet();
      const stopWatching = watchHostState();
      return function () {
        stopWatching();
        removeStylesheet();
        const root = document.documentElement;
        for (const attr of ALL_ATTRS) root.removeAttribute(attr);
        for (const name of ART_SCRIM_VARS) root.style.removeProperty(name);
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

    function installSettings(ctx) {
      if (h === null || ctx === undefined || ctx === null) return;

      let t = fallbackTranslate;
      try {
        if (ctx.locale !== undefined && ctx.locale !== null && typeof ctx.locale.bind === 'function') {
          t = ctx.locale.bind(NS);
        }
      } catch (error) {
        t = fallbackTranslate;
      }

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
      if (ctx !== undefined && ctx !== null && typeof ctx.effect === 'function') {
        ctx.effect(install, PLUGIN_ID + ': furina surface');
      } else {
        install();
      }
      installSettings(ctx);
    }

    exports.apply = apply;
    exports.inject = ['slots', 'locale'];
    exports.name = PLUGIN_ID;
    return module.exports;
  },
});
