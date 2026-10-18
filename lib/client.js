/**
 * dsh-furina-style — GENERATED FILE, do not edit.
 * Source: src/client.js + src/*.css (run `node scripts/build.mjs`).
 */
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
    const CSS = "html[data-dsh-furina] {\n  \n  --fh-water-ink: #1d2539;\n  --fh-water-ink-soft: #3e4b6d;\n  --fh-water-mute: #5f6e93;\n  --fh-water-faint: #7c8bab;\n\n  --fh-brand: #4a5fa8;\n  --fh-brand-hover: #5d74c4;\n  --fh-brand-deep: #222b4d;\n  --fh-brand-wash: #dce3f7;\n  --fh-pearl: #c3cfee;\n  --fh-pearl-ghost: #a5b7e2;\n\n  \n  --fh-canvas: #eef2fa;\n  --fh-surface-base: #f7f9fe;\n  --fh-surface-1: #ffffff;\n  --fh-surface-2: #f4f7fd;\n  --fh-surface-3: #e9eef9;\n  --fh-surface-4: #dfe7f6;\n\n  \n  --fh-dur-instant: 80ms;\n  --fh-dur-feedback: 120ms;\n  --fh-dur-reveal: 160ms;\n  --fh-dur-surface: 180ms;\n  --fh-dur-enter: 320ms;\n  --fh-dur-exit: 120ms;\n  --fh-dur-move: 200ms;\n  --fh-dur-breathe: 2400ms;\n\n  --fh-ease-standard: ease;\n  --fh-ease-out: ease-out;\n  --fh-ease-enter: cubic-bezier(0.34, 1.3, 0.64, 1);\n  --fh-ease-glide: cubic-bezier(0.22, 0.61, 0.36, 1);\n  --fh-ease-settle: cubic-bezier(0.22, 1, 0.36, 1);\n\n  --fh-nudge: 4px;\n  --fh-travel: 8px;\n  --fh-rise: 12px;\n  --fh-blur-soft: 2px;\n  --fh-scale-dialog: 0.96;\n  --fh-scale-menu: 0.98;\n\n  \n  --fh-layer-control: 10;\n  --fh-layer-picker: 20;\n  --fh-layer-chrome: 30;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"reduced\"] {\n  --fh-dur-instant: 0.01ms;\n  --fh-dur-feedback: 0.01ms;\n  --fh-dur-reveal: 0.01ms;\n  --fh-dur-surface: 0.01ms;\n  --fh-dur-enter: 0.01ms;\n  --fh-dur-exit: 0.01ms;\n  --fh-dur-move: 0.01ms;\n  --fh-nudge: 0px;\n  --fh-travel: 0px;\n  --fh-rise: 0px;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-surfaces=\"own\"] body {\n  \n  --dsw-alias-bg-base: var(--fh-surface-base);\n  --dsw-alias-bg-layer-1: var(--fh-surface-1);\n  --dsw-alias-bg-layer-2: var(--fh-surface-2);\n  --dsw-alias-bg-layer-3: var(--fh-surface-3);\n  --dsw-alias-bg-layer-selected: var(--fh-surface-3);\n  --dsw-alias-bg-module-platform: var(--fh-surface-2);\n\n  \n  --dsw-alias-bg-overlay: #f8fafe;\n  --dsw-alias-bg-mask-1: #1016245c;\n  --dsw-alias-bg-mask-2: #1016242e;\n  --dsw-alias-bg-mask-3: #1016248c;\n  --dsw-alias-bg-skeleton: #2c3a730f;\n\n  \n  --dsw-alias-border-l1: #2c3a731f;\n  --dsw-alias-border-l2: #2c3a7333;\n  --dsw-alias-border-l3: #2c3a7352;\n  --dsw-alias-border-l4: #2c3a736b;\n\n  \n  --dsw-alias-label-primary: var(--fh-water-ink);\n  --dsw-alias-label-secondary: var(--fh-water-ink-soft);\n  --dsw-alias-label-tertiary: var(--fh-water-mute);\n  --dsw-alias-label-caption: var(--fh-water-faint);\n  --dsw-alias-label-primary-dimmed: #2c3a73f5;\n  --dsw-alias-label-primary-inverted: #ffffff;\n  --dsw-alias-label-primary-foreground: #ffffff;\n\n  \n  --dsw-alias-brand-primary: var(--fh-brand);\n  --dsw-alias-brand-text: var(--fh-brand-deep);\n  --dsw-alias-link: var(--fh-brand);\n  --dsw-alias-state-business-primary: var(--fh-brand);\n  --dsw-alias-state-business-tertiary: var(--fh-brand-wash);\n  --dsw-alias-state-success-primary: #3f9d5c;\n  --dsw-alias-state-success-tertiary: #dff0e4;\n  --dsw-alias-state-warn-primary: #c9922f;\n  --dsw-alias-state-warn-tertiary: #f8ecd4;\n  --dsw-alias-state-warn-label: #8a611a;\n  --dsw-alias-state-error-primary: #cf4b4b;\n  --dsw-alias-state-idle-primary: #9aa8c6;\n\n  \n  --dsw-alias-interactive-bg-hover: #2c3a730f;\n  --dsw-alias-interactive-bg-active: #2c3a731f;\n  --dsw-alias-interactive-bg-hover-solid: var(--fh-surface-2);\n  --dsw-alias-interactive-bg-hover-accent: #4a5fa81f;\n  --dsw-alias-interactive-bg-hover-danger: #cf4b4b14;\n\n  \n  --dsw-specific-sidebar-fill: #edf1fbfa;\n  --dsw-specific-sidebar-nav-item-hover: #2c3a730f;\n  --dsw-specific-sidebar-nav-item-active: #4a5fa81f;\n  --dsw-specific-sidebar-nav-item-active-accent: var(--fh-brand-wash);\n  --dsw-specific-menu: #f8fafeff;\n  --dsw-menu-surface-fill: #f8fafeff;\n  --dsw-specific-input-major: #ffffff;\n  --dsw-specific-selector: #e4eaf7;\n  --dsw-specific-bubble: #dce3f7;\n  --dsw-specific-bubble-highlight: #c3cfee;\n\n  \n  --dsw-alias-markdown-code-block: #f2f5fc;\n  --dsw-alias-markdown-code-block-banner: #eaeffa;\n  --dsw-alias-markdown-inline-code: #eef2fa;\n  --dsw-alias-markdown-tag: #e9eef9;\n  --dsw-alias-markdown-placeholder: #eef2fa;\n  --dsw-alias-markdown-citation: #eef2fa;\n\n  \n  --dsw-alias-tooltip-bg: var(--fh-brand-deep);\n  --dsw-alias-tooltip-label: #f2f6ff;\n  --dsw-alias-toast-bg: var(--fh-brand-deep);\n  --dsw-alias-toast-label: #f2f6ff;\n\n  \n  --dsw-alias-scrollbar-bg-l1: #b8c6e6;\n  --dsw-alias-scrollbar-bg-l2: #aebde1;\n  --dsw-alias-scrollbar-hover-l1: #9aacd6;\n  --dsw-alias-scrollbar-hover-l2: #8ea2d0;\n\n  \n  --dsw-focus-ring-color: var(--fh-brand);\n  --dsw-focus-ring-width: 2px;\n\n  \n  --dsw-elevation-stroke-color: var(--dsw-alias-border-l2);\n  --dsw-elevation-soft: 0 0 0 0.5px #2c3a7326, 0 4px 16px 0 #2c3a730f, 0 0 24px 0 #2c3a7308;\n  --dsw-elevation-panel: 0 0 0 0.5px #2c3a7333, 0 6px 18px 0 #2c3a7314, 0 0 20px 0 #2c3a730a;\n  --dsw-elevation-prominent: 0 0 0 0.5px #2c3a733d, 0 8px 28px 0 #2c3a731a, 0 0 24px 0 #2c3a7310;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-surfaces=\"own\"] body {\n  background-color: var(--fh-canvas);\n  background-image:\n    radial-gradient(120% 80% at 82% -10%, #ffffff 0%, #eaf0fb 38%, #e2e9f7 62%, #dbe4f5 100%),\n    radial-gradient(60% 40% at 12% 108%, #e7eefc 0%, #eef2fa 70%);\n  background-attachment: fixed;\n  color: var(--dsw-alias-label-primary);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-surfaces=\"own\"] body[data-ds-dark-theme] {\n  --fh-canvas: #0c1220;\n  --fh-surface-base: #101624;\n  --fh-surface-1: #161f33;\n  --fh-surface-2: #1c2740;\n  --fh-surface-3: #24314f;\n  --fh-surface-4: #2c3a5e;\n\n  --dsw-alias-bg-base: var(--fh-surface-base);\n  --dsw-alias-bg-layer-1: var(--fh-surface-1);\n  --dsw-alias-bg-layer-2: var(--fh-surface-2);\n  --dsw-alias-bg-layer-3: var(--fh-surface-3);\n  --dsw-alias-bg-layer-selected: #26334f;\n  --dsw-alias-bg-module-platform: #182238;\n\n  --dsw-alias-bg-overlay: #1a2238f7;\n  --dsw-alias-bg-mask-1: #000000a6;\n  --dsw-alias-bg-mask-2: #00000061;\n  --dsw-alias-bg-mask-3: #000000d9;\n  --dsw-alias-bg-skeleton: #ffffff14;\n\n  --dsw-alias-border-l1: #a0b4e61f;\n  --dsw-alias-border-l2: #a0b4e62e;\n  --dsw-alias-border-l3: #a0b4e642;\n  --dsw-alias-border-l4: #a0b4e657;\n\n  --dsw-alias-label-primary: #dbe2f2;\n  --dsw-alias-label-secondary: #a9b7d0;\n  --dsw-alias-label-tertiary: #8b9cbc;\n  --dsw-alias-label-caption: #788bb4;\n  --dsw-alias-label-primary-dimmed: #dbe2f2f2;\n  --dsw-alias-label-primary-inverted: #101624;\n  --dsw-alias-label-primary-foreground: #101624;\n\n  --dsw-alias-brand-primary: #7f96d2;\n  --dsw-alias-brand-text: #c3cfee;\n  --dsw-alias-link: #93a8e0;\n  --dsw-alias-state-business-primary: #7f96d2;\n  --dsw-alias-state-business-tertiary: #26335380;\n  --dsw-alias-state-success-primary: #58b058;\n  --dsw-alias-state-success-tertiary: #16301c;\n  --dsw-alias-state-warn-primary: #d9a94f;\n  --dsw-alias-state-warn-tertiary: #33290f;\n  --dsw-alias-state-warn-label: #e7c477;\n  --dsw-alias-state-error-primary: #e05c5c;\n  --dsw-alias-state-idle-primary: #56658a;\n\n  --dsw-alias-interactive-bg-hover: #ffffff14;\n  --dsw-alias-interactive-bg-active: #ffffff24;\n  --dsw-alias-interactive-bg-hover-solid: #24314f;\n  --dsw-alias-interactive-bg-hover-accent: #7f96d229;\n  --dsw-alias-interactive-bg-hover-danger: #f25a5a26;\n\n  --dsw-specific-sidebar-fill: #121a2bf2;\n  --dsw-specific-sidebar-nav-item-hover: #ffffff14;\n  --dsw-specific-sidebar-nav-item-active: #7f96d229;\n  --dsw-specific-sidebar-nav-item-active-accent: #263353;\n  --dsw-specific-menu: #1a2238f7;\n  --dsw-menu-surface-fill: #1a2238f7;\n  --dsw-specific-input-major: #1a2238;\n  --dsw-specific-selector: #2a3a5e;\n  --dsw-specific-bubble: #2c3765;\n  --dsw-specific-bubble-highlight: #3a4780;\n\n  --dsw-alias-markdown-code-block: #151d30;\n  --dsw-alias-markdown-code-block-banner: #1b2438;\n  --dsw-alias-markdown-inline-code: #1c2740;\n  --dsw-alias-markdown-tag: #202b45;\n  --dsw-alias-markdown-placeholder: #1c2740;\n  --dsw-alias-markdown-citation: #1c2740;\n\n  --dsw-alias-tooltip-bg: #dbe2f2;\n  --dsw-alias-tooltip-label: #101624;\n  --dsw-alias-toast-bg: #dbe2f2;\n  --dsw-alias-toast-label: #101624;\n\n  --dsw-alias-scrollbar-bg-l1: #33415f;\n  --dsw-alias-scrollbar-bg-l2: #3a4a70;\n  --dsw-alias-scrollbar-hover-l1: #44547d;\n  --dsw-alias-scrollbar-hover-l2: #4d6090;\n\n  --dsw-focus-ring-color: #7f96d2;\n  --dsw-focus-ring-width: 2px;\n\n  --dsw-elevation-stroke-color: var(--dsw-alias-border-l3);\n  --dsw-elevation-soft: 0 0 0 0.5px #a0b4e626, 0 4px 16px 0 #00000038, 0 0 24px 0 #0000002e;\n  --dsw-elevation-panel: 0 0 0 0.5px #a0b4e633, 0 6px 18px 0 #00000047, 0 0 20px 0 #00000038;\n  --dsw-elevation-prominent: 0 0 0 0.5px #a0b4e642, 0 8px 28px 0 #0000005c, 0 0 24px 0 #00000042;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-surfaces=\"own\"] body[data-ds-dark-theme] {\n  background-color: var(--fh-canvas);\n  background-image:\n    radial-gradient(120% 80% at 82% -10%, #1b2744 0%, #131c31 42%, #0f1626 70%, #0c1220 100%),\n    radial-gradient(70% 45% at 8% 106%, #16233c 0%, #0c1220 72%);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-surfaces=\"furina\"] body {\n  \n  --dsw-alias-bg-base: rgba(232, 236, 245, 0.82);\n  --dsw-alias-bg-layer-1: rgba(243, 245, 251, 0.94);\n  --dsw-alias-bg-layer-2: rgba(233, 237, 247, 0.95);\n  --dsw-alias-bg-layer-3: rgba(221, 227, 241, 0.96);\n\n  \n  --dsw-alias-bg-overlay: #f4f7fdf5;\n  --dsw-alias-bg-mask-1: #1a223866;\n  --dsw-alias-bg-mask-2: #1a223833;\n  --dsw-alias-bg-mask-3: #1a223899;\n\n  \n  --dsw-alias-border-l1: #2c3a731f;\n  --dsw-alias-border-l2: #2c3a7333;\n  --dsw-alias-border-l3: #2c3a7352;\n  --dsw-alias-border-l4: #2c3a736b;\n\n  \n  --dsw-specific-bubble: color-mix(in srgb,\n      #dce3f7 calc(var(--dsh-skin-bubble-alpha, 0.5) * 100% + 25%), #ffffff);\n  --dsw-specific-bubble-highlight: color-mix(in srgb,\n      #c3cfee calc(var(--dsh-skin-bubble-alpha, 0.5) * 100% + 25%), #ffffff);\n\n  \n  --dsw-alias-tooltip-bg: #222b4d;\n  --dsw-alias-tooltip-label: #f2f6ff;\n  --dsw-alias-toast-bg: #222b4d;\n  --dsw-alias-toast-label: #f2f6ff;\n\n  \n  --dsw-focus-ring-color: #4a5fa8;\n  --dsw-focus-ring-width: 2px;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-surfaces=\"furina\"] body[data-ds-dark-theme] {\n  --dsw-alias-bg-base: rgba(16, 22, 42, 0.86);\n  --dsw-alias-bg-layer-1: rgba(26, 34, 56, 0.94);\n  --dsw-alias-bg-layer-2: rgba(38, 49, 75, 0.95);\n  --dsw-alias-bg-layer-3: rgba(38, 50, 79, 0.96);\n\n  --dsw-alias-bg-overlay: #1e2740f5;\n  --dsw-alias-bg-mask-1: #000000a6;\n  --dsw-alias-bg-mask-2: #00000061;\n  --dsw-alias-bg-mask-3: #000000d9;\n\n  --dsw-alias-border-l1: #a0b4e61f;\n  --dsw-alias-border-l2: #a0b4e62e;\n  --dsw-alias-border-l3: #a0b4e642;\n  --dsw-alias-border-l4: #a0b4e657;\n\n  --dsw-specific-bubble: color-mix(in srgb,\n      #2c3765 calc(var(--dsh-skin-bubble-alpha, 0.5) * 100% + 30%), #1a2238);\n  --dsw-specific-bubble-highlight: color-mix(in srgb,\n      #3a4780 calc(var(--dsh-skin-bubble-alpha, 0.5) * 100% + 30%), #1a2238);\n\n  --dsw-alias-tooltip-bg: #dbe2f2;\n  --dsw-alias-tooltip-label: #101624;\n  --dsw-alias-toast-bg: #dbe2f2;\n  --dsw-alias-toast-label: #101624;\n\n  --dsw-focus-ring-color: #7f96d2;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [class*=\"_frame\"] {\n  background: transparent !important;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-windows-titlebar] [class*=\"_frame\"]::before {\n  background: transparent !important;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-windows-titlebar] [class*=\"_frame\"] {\n  --fh-titlebar-veil: color-mix(in srgb, var(--dsw-alias-bg-base) 72%, transparent);\n  background-image: linear-gradient(to bottom, var(--fh-titlebar-veil) 0, transparent var(--dsh-windows-titlebar-height, 40px)) !important;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] header:has([data-conversation-tabs]) {\n  border-bottom-color: color-mix(in srgb, var(--dsw-alias-border-l2) 70%, transparent);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] header:has([data-conversation-tabs]) [role=\"tablist\"] {\n  gap: 26px;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] header:has([data-conversation-tabs]) [role=\"tab\"] {\n  transition:\n    color var(--fh-dur-feedback) var(--fh-ease-standard),\n    opacity var(--fh-dur-feedback) var(--fh-ease-standard);\n  opacity: 0.72;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] header:has([data-conversation-tabs]) [role=\"tab\"]:hover,\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] header:has([data-conversation-tabs]) [role=\"tab\"][aria-selected=\"true\"] {\n  opacity: 1;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] header:has([data-conversation-tabs]) [role=\"tab\"][aria-selected=\"true\"]::after {\n  background: var(--dsw-alias-state-business-primary);\n  box-shadow: 0 0 10px color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, transparent);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] {\n  \n  --dsh-chat-user-width: clamp(720px, 68ch, 900px);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-conversation-scroll] {\n  scrollbar-width: thin;\n  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2) transparent;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [class*=\"_bubble\"] {\n  border-radius: var(--dsw-radius-xl);\n  box-shadow: inset 0 0 0 0.5px color-mix(in srgb, var(--dsw-specific-bubble-highlight) 70%, transparent);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-turn-tail] {\n  transition: opacity var(--fh-dur-reveal) var(--fh-ease-standard);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-turn-tail][data-actions-reveal=\"hover\"] {\n  opacity: 0;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-chat-turn]:hover [data-turn-tail][data-actions-reveal=\"hover\"],\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-turn-tail][data-actions-reveal=\"hover\"]:focus-within,\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-turn-tail][data-actions-reveal=\"hover\"]:hover {\n  opacity: 1;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-composer-card] {\n  \n  border-radius: 18px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-specific-input-major);\n  box-shadow:\n    0 0 0 0.5px color-mix(in srgb, var(--dsw-alias-border-l2) 60%, transparent),\n    0 6px 20px -8px color-mix(in srgb, var(--fh-brand) 22%, transparent),\n    var(--dsw-elevation-soft);\n  transition:\n    border-color var(--fh-dur-feedback) var(--fh-ease-standard),\n    box-shadow var(--fh-dur-surface) var(--fh-ease-glide),\n    transform var(--fh-dur-surface) var(--fh-ease-glide);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-composer-card]:focus-within {\n  border-color: color-mix(in srgb, var(--fh-brand) 42%, transparent);\n  box-shadow:\n    0 0 0 1px color-mix(in srgb, var(--fh-brand) 28%, transparent),\n    0 0 0 4px color-mix(in srgb, var(--fh-brand) 10%, transparent),\n    0 10px 28px -12px color-mix(in srgb, var(--fh-brand) 40%, transparent),\n    var(--dsw-elevation-soft);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] {\n  --fh-composer-fade-h: 40px;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-composer-seat] {\n  --fh-composer-fade-h: 40px;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"][data-dsh-furina-surfaces=\"own\"]\n  [data-conversation-scroll] {\n  padding-bottom: var(--fh-composer-fade-h, 40px);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [role=\"menu\"],\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [role=\"dialog\"][data-modal-autofocus] {\n  border-radius: var(--dsw-radius-md);\n  border: 0.5px solid var(--dsw-alias-border-l1);\n  box-shadow: var(--dsw-elevation-prominent);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [role=\"menuitem\"],\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [role=\"menu\"] [role=\"menuitemcheckbox\"],\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [role=\"menu\"] [role=\"menuitemradio\"] {\n  min-height: 32px;\n  border-radius: var(--dsw-radius-sm);\n  transition: background-color var(--fh-dur-feedback) var(--fh-ease-standard);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-session-stats-details] {\n  row-gap: 6px;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [class*=\"_sidebarCol\"] *[role=\"treeitem\"],\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [class*=\"_sidebarCol\"] [class*=\"_panelRow\"] {\n  border-radius: var(--dsw-radius-sm);\n  transition:\n    background-color var(--fh-dur-feedback) var(--fh-ease-standard),\n    color var(--fh-dur-feedback) var(--fh-ease-standard);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] * {\n  scrollbar-width: thin;\n  scrollbar-color: color-mix(in srgb, var(--dsw-alias-scrollbar-bg-l2) 80%, transparent) transparent;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] ::-webkit-scrollbar {\n  width: 10px;\n  height: 10px;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] ::-webkit-scrollbar-thumb {\n  border: 3px solid transparent;\n  border-radius: 999px;\n  background-clip: content-box;\n  background-color: var(--dsw-alias-scrollbar-bg-l2);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] ::-webkit-scrollbar-thumb:hover {\n  background-color: var(--dsw-alias-scrollbar-hover-l2);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] ::-webkit-scrollbar-track {\n  background: transparent;\n}\n\nhtml[data-dsh-furina] ::selection {\n  background: #4a5fa8;\n  color: #ffffff;\n}\n\nhtml[data-dsh-furina] body[data-ds-dark-theme] ::selection {\n  background: #93a8e0;\n  color: #0c1220;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] :focus-visible {\n  outline: 2px solid color-mix(in srgb, var(--fh-brand) 62%, transparent);\n  outline-offset: 1px;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-slot=\"conversation.chat.node\"] p {\n  margin: 12px 0;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-slot=\"conversation.chat.node\"] p:first-child {\n  margin-top: 0;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-slot=\"conversation.chat.node\"] p:last-child {\n  margin-bottom: 0;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-slot=\"conversation.chat.node\"] :is(h1, h2, h3) {\n  letter-spacing: 0.01em;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-slot=\"conversation.chat.node\"] blockquote {\n  border-inline-start: 2px solid color-mix(in srgb, var(--fh-brand) 46%, transparent);\n  border-radius: 0 var(--dsw-radius-sm) var(--dsw-radius-sm) 0;\n  background: color-mix(in srgb, var(--fh-brand-wash) 42%, transparent);\n  padding: 8px 14px;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-layout=\"on\"] [data-slot=\"conversation.chat.node\"] table {\n  width: max-content;\n  min-width: 100%;\n}\n\n@keyframes fh-rise-in {\n  from {\n    opacity: 0;\n    transform: translateY(var(--fh-rise, 12px));\n    filter: blur(var(--fh-blur-soft, 2px));\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n    filter: blur(0);\n  }\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [data-slot=\"conversation.chat.node\"] > * {\n  animation: fh-rise-in var(--fh-dur-enter) var(--fh-ease-settle) both;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [data-slot=\"conversation.chat.node\"] > *:not(:last-child) {\n  animation: none;\n}\n\n@keyframes fh-stream-pulse {\n  0%,\n  100% {\n    opacity: 0.22;\n    transform: scaleY(0.86);\n  }\n  50% {\n    opacity: 1;\n    transform: scaleY(1);\n  }\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [data-streaming]::after {\n  content: \"\";\n  display: inline-block;\n  width: 2px;\n  height: 1.05em;\n  margin-inline-start: 2px;\n  vertical-align: text-bottom;\n  border-radius: 2px;\n  background: var(--fh-brand);\n  animation: fh-stream-pulse var(--fh-dur-breathe) var(--fh-ease-standard) infinite;\n}\n\n@keyframes fh-breathe {\n  0%,\n  100% {\n    opacity: 0.18;\n    transform: scale(0.96);\n  }\n  50% {\n    opacity: 0.42;\n    transform: scale(1.04);\n  }\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [data-chat-flow-kind=\"turn-process\"] [data-state=\"running\"] {\n  position: relative;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [data-chat-flow-kind=\"turn-process\"] [data-state=\"running\"]::before {\n  content: \"\";\n  position: absolute;\n  inset: -6px;\n  border-radius: 999px;\n  pointer-events: none;\n  background: radial-gradient(\n    circle at center,\n    color-mix(in srgb, var(--fh-brand) 26%, transparent) 0,\n    transparent 68%\n  );\n  animation: fh-breathe calc(var(--fh-dur-breathe) * 1.4) var(--fh-ease-standard) infinite;\n}\n\n@keyframes fh-unfold {\n  from {\n    opacity: 0;\n    transform: translateY(calc(var(--fh-nudge, 4px) * -1));\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [data-expanded=\"true\"] > * {\n  animation: fh-unfold var(--fh-dur-surface) var(--fh-ease-glide) both;\n}\n\n@keyframes fh-surface-in {\n  from {\n    opacity: 0;\n    transform: translateY(var(--fh-nudge, 4px)) scale(var(--fh-scale-menu, 0.98));\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0) scale(1);\n  }\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"menu\"],\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"dialog\"] {\n  animation: fh-surface-in var(--fh-dur-surface) var(--fh-ease-glide) both;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"menu\"] > * {\n  animation: fh-surface-in var(--fh-dur-reveal) var(--fh-ease-glide) both;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"menu\"] > :nth-child(2) {\n  animation-delay: 30ms;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"menu\"] > :nth-child(3) {\n  animation-delay: 60ms;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"menu\"] > :nth-child(n + 4) {\n  animation-delay: 90ms;\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] button,\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"button\"],\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"tab\"],\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"menuitem\"] {\n  transition:\n    background-color var(--fh-dur-feedback) var(--fh-ease-standard),\n    border-color var(--fh-dur-feedback) var(--fh-ease-standard),\n    color var(--fh-dur-feedback) var(--fh-ease-standard),\n    opacity var(--fh-dur-feedback) var(--fh-ease-standard),\n    box-shadow var(--fh-dur-feedback) var(--fh-ease-standard);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] button:active,\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"button\"]:active {\n  transform: scale(0.985);\n  transition-duration: var(--fh-dur-instant);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [role=\"tab\"]::after {\n  transition:\n    background-color var(--fh-dur-move) var(--fh-ease-glide),\n    box-shadow var(--fh-dur-move) var(--fh-ease-glide),\n    opacity var(--fh-dur-move) var(--fh-ease-glide);\n}\n\n@keyframes fh-ripple {\n  0% {\n    box-shadow: 0 0 0 0 color-mix(in srgb, var(--fh-brand) 34%, transparent);\n  }\n  100% {\n    box-shadow: 0 0 0 10px color-mix(in srgb, var(--fh-brand) 0%, transparent);\n  }\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [data-json-copy-active=\"true\"],\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [data-copied=\"true\"] {\n  animation: fh-ripple var(--fh-dur-surface) var(--fh-ease-out) both;\n  border-radius: var(--dsw-radius-sm);\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"] [class*=\"_sidebarCol\"] {\n  transition:\n    width var(--fh-dur-move) var(--fh-ease-glide),\n    min-width var(--fh-dur-move) var(--fh-ease-glide),\n    grid-template-columns var(--fh-dur-move) var(--fh-ease-glide);\n}\n\n@keyframes fh-ambient-drift {\n  0%,\n  100% {\n    transform: translate3d(0, 0, 0) scale(1);\n    opacity: 0.5;\n  }\n  50% {\n    transform: translate3d(-2%, 1.5%, 0) scale(1.06);\n    opacity: 0.72;\n  }\n}\n\nhtml[data-dsh-furina][data-dsh-furina-motion=\"on\"][data-dsh-furina-surfaces=\"own\"] body::before {\n  content: \"\";\n  position: fixed;\n  inset: 0;\n  z-index: 0;\n  pointer-events: none;\n  background:\n    radial-gradient(46% 34% at 78% 4%, color-mix(in srgb, var(--fh-brand-wash) 34%, transparent) 0, transparent 72%),\n    radial-gradient(30% 26% at 14% 96%, color-mix(in srgb, var(--fh-pearl) 28%, transparent) 0, transparent 78%);\n  animation: fh-ambient-drift calc(var(--fh-dur-breathe) * 8) var(--fh-ease-settle) infinite;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  html[data-dsh-furina] *,\n  html[data-dsh-furina] *::before,\n  html[data-dsh-furina] *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n    scroll-behavior: auto !important;\n  }\n}";

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
