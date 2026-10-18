# Third-Party Notices

`dsh-furina-style` is an independent implementation. It does not copy source code
from the projects below, but its visual language and engineering approach were
informed by them, so they are credited here.

---

## Furina skin for DSH

- **Project**: `furina` skin-center skin package (v0.1.20)
- **Author**: zhu1090093659 (sclass53)
- **License**: BSD 3-Clause
- **Used for**: colour palette reference — the "water and pearl" cool-blue
  palette (water ink `#1d2539` / `#dbe2f2`, brand `#4a5fa8` / `#7f96d2`,
  pearl highlight `#c3cfee`, canvas `#e8ecf5` / `#101624`) was derived from
  measuring this skin's `skin.css`, then re-designed for light and dark
  independently and re-expressed as semantic tokens.
- **Not used**: no CSS rules, selectors, or files are copied. This plugin
  deliberately fixes five defects measured in that skin (see README §三种表面模式)
  and does not ship its artwork.

## dsh-claude-style

- **Project**: https://github.com/Nwflower/dsh-claude-style
- **Author**: Nwflower
- **License**: MIT
- **Used for**: engineering structure and motion vocabulary reference —
  the `window.__ModuleLoader__.load({ id, factory })` client half, idempotent
  `<style>` injection keyed by `data-plugin-css`, namespaced body attribute as
  the single cascade root, tokenised duration / easing / distance scales, and
  the reduced-motion attribute gate.
- **Not used**: no CSS rules, no JavaScript modules, and none of its
  `data-dsh-claude-*` attributes are referenced (they belong to that plugin and
  may disappear at any time).

## DeepSeek Harness

The host design token names (`--dsw-alias-*`, `--dsw-specific-*`, `--dsw-font-*`,
spacing / radius / elevation scales) are read from and re-declared against the
host's own public theme contract. All host `data-*` attributes used as selectors
are the host's own public DOM surface.

## 内置背景插画

`assets/furina-art-1440.jpg` 取自 DSH 官方芙宁娜皮肤包
（`dsh/skins/furina/assets/furina-art.jpg`，BSD 3-Clause, © 2026 zhu1090093659），
由本仓库缩放为 1440×757 后随源码分发，仅用于本主题的默认背景。
本插件不复制该皮肤的任何 CSS、patches 或 hooks 源码。

若官方皮肤的许可证或素材归属发生变化，删掉 `assets/` 后重新运行
`node scripts/build.mjs` 即可移除该素材（构建会因缺文件而明确报错，不会静默产出半成品）。

