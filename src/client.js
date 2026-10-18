/**
 * dsh-furina-style — Client 半边。
 *
 * 全部工作都在浏览器里完成，用的是和宿主插件一致的模式：
 *   1. 在 <html> 上写一个命名空间属性 data-dsh-furina，所有样式规则都以它为
 *      作用域，卸载时删掉属性即全部失效；
 *   2. 注入一张 <style>（幂等，重复 install 不会产生第二张）；
 *   3. 根据「谁在负责表面」实时切换三个模式属性，用一个 MutationObserver
 *      跟随 data-dsh-skin / data-dsh-claude-style / data-ds-dark-theme 变化；
 *   4. 用 ctx.effect(...) 把清理函数交给框架，禁用/卸载插件时自动还原。
 *
 * 为什么是「模式属性」而不是直接写死颜色：
 *   - 没有别的皮肤时（own）本插件给出完整的芙宁娜配色；
 *   - skin-center 的 furina 皮肤在跑时（furina）只做缺陷修补，不抢它的插画；
 *   - 别的皮肤在跑时（other）完全不碰颜色，只留布局与动效，避免打架。
 *
 * 与 claude-style 的关系：它是独立 Cordis 插件，可能同时加载。检测到
 * html[data-dsh-claude-style] 就点亮 data-dsh-furina-handoff 并把布局段关掉
 * （配色仍保留），这样两套几何规则不会互相错位。
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

    const PLUGIN_ID = 'dsh-furina-style';
    const CSS_TAG_ID = PLUGIN_ID + '/furina-style.css';
    const CSS = __FH_STYLESHEET_JSON__;

    /** 命名空间属性：出现在 <html> 上，所有规则都以它为前缀。 */
    const ATTR_ROOT = 'data-dsh-furina';
    /** 表面模式：own / furina / other。 */
    const ATTR_SURFACES = 'data-dsh-furina-surfaces';
    /** 布局开关：on / off（让路给 claude-style 时是 off）。 */
    const ATTR_LAYOUT = 'data-dsh-furina-layout';
    /** 动效开关：on / reduced。 */
    const ATTR_MOTION = 'data-dsh-furina-motion';
    /** 让路标记：存在即表示布局段被别的主题接管。 */
    const ATTR_HANDOFF = 'data-dsh-furina-handoff';

    const MOTION_STORAGE_KEY = 'dsh-furina:motion';
    const MOTION_MODES = ['system', 'on', 'reduced'];

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
    function detectLayout() {
      return document.documentElement.hasAttribute('data-dsh-claude-style') ? 'off' : 'on';
    }

    function readMotionPreference() {
      let stored = null;
      try {
        stored = window.localStorage.getItem(MOTION_STORAGE_KEY);
      } catch (error) {
        stored = null;
      }
      if (stored !== null && MOTION_MODES.indexOf(stored) === -1) stored = null;
      if (stored === 'on') return 'on';
      if (stored === 'reduced') return 'reduced';
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
      setAttr(root, ATTR_ROOT, '');
      setAttr(root, ATTR_SURFACES, detectSurfaces());
      setAttr(root, ATTR_LAYOUT, detectLayout());
      setAttr(root, ATTR_MOTION, readMotionPreference());
      if (detectLayout() === 'off') {
        setAttr(root, ATTR_HANDOFF, 'claude-style');
      } else if (root.hasAttribute(ATTR_HANDOFF)) {
        root.removeAttribute(ATTR_HANDOFF);
      }
    }

    /* ------------------------------------------------------------------ */
    /* 跟随宿主状态                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * 监听三个可能改变模式的外部信号：
     *   data-dsh-skin        —— 皮肤中心切换/卸载皮肤
     *   data-dsh-claude-style —— claude-style 启用/停用
     *   data-ds-dark-theme   —— 明暗切换（在 body 上，样式本身靠 CSS 处理，
     *                           这里只是保持同步的入口）
     * 只在 html / body 的属性变化上监听，且过滤器里不含本插件自己的属性，
     * 因此不会自激循环。
     */
    function watchHostState() {
      const targets = [document.documentElement, document.body].filter(
        (el) => el !== null && el !== undefined
      );
      if (targets.length === 0) return function () {};
      const filter = ['data-dsh-skin', 'data-dsh-claude-style', 'data-ds-dark-theme', 'class'];
      const observer = new MutationObserver(syncAttributes);
      for (const target of targets) {
        observer.observe(target, { attributes: true, attributeFilter: filter });
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

      return function () {
        observer.disconnect();
        if (media !== null) {
          if (typeof media.removeEventListener === 'function') {
            media.removeEventListener('change', onMediaChange);
          } else if (typeof media.removeListener === 'function') {
            media.removeListener(onMediaChange);
          }
        }
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
        root.removeAttribute(ATTR_ROOT);
        root.removeAttribute(ATTR_SURFACES);
        root.removeAttribute(ATTR_LAYOUT);
        root.removeAttribute(ATTR_MOTION);
        root.removeAttribute(ATTR_HANDOFF);
      };
    }

    function apply(ctx) {
      if (ctx !== undefined && ctx !== null && typeof ctx.effect === 'function') {
        ctx.effect(install, PLUGIN_ID + ': furina surface');
      } else {
        install();
      }
    }

    exports.apply = apply;
    return module.exports;
  },
});
