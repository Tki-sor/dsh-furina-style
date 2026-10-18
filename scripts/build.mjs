/**
 * dsh-furina-style — 构建脚本。
 *
 * 做一件很简单的事：把 src/*.css 按文件名顺序拼成一张样式表，作为字符串
 * 内联进 src/client.js（替换占位符 __FH_STYLESHEET_JSON__），产物写到
 * lib/client.js。
 *
 * 为什么不用打包器：
 *   - 整个插件只有一个 client 入口，没有模块图需要解析；
 *   - 样式要作为字符串整体注入，打包器反而要多一层 loader；
 *   - 零依赖的脚本在任何 node 版本上都能跑（宿主自带 node ≥ 20）。
 *
 * 用法：node scripts/build.mjs
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'lib');

const PLACEHOLDER = '__FH_STYLESHEET_JSON__';
/** 背景插画占位符：CSS 里写 url("__FH_BACKGROUND_URI__")，构建时换成 data URI。 */
const ART_PLACEHOLDER = '__FH_BACKGROUND_URI__';
const ART_FILE = join(ROOT, 'assets', 'furina-art-1440.jpg');
const ART_MIME = 'image/jpeg';

const BANNER = [
  '/**',
  ' * dsh-furina-style — GENERATED FILE, do not edit.',
  ' * Source: src/client.js + src/*.css (run `node scripts/build.mjs`).',
  ' */',
].join('\n');

/** 递归收集 src 下的 .css，按相对路径排序（数字前缀决定层叠顺序）。 */
async function collectCss(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectCss(full)));
    } else if (entry.name.endsWith('.css')) {
      files.push(full);
    }
  }
  return files.sort((a, b) => a.localeCompare(b, 'en'));
}

/** 去掉注释，减小注入体积；保留换行以免破坏 CSS 语法。 */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n{3,}/g, '\n\n');
}

/**
 * 背景插画 → data URI。
 *
 * 为什么内联而不是走 Host 的静态路由：
 *   - 静态路由要 Host 半边注册前缀，Host 进程不重启不生效，而样式表改完刷新
 *     页面就能验证；
 *   - 内联后插件只有「一张样式表」这一条路径，不存在「路由没挂上 → 404 →
 *     背景空白」的第三态，符合「任何别的插件没了都不受影响」的要求。
 * 代价是产物变大（1440 宽的 jpg 约 70 kB → base64 约 93 kB），可以接受。
 */
async function loadArt() {
  let bytes;
  try {
    bytes = await readFile(ART_FILE);
  } catch (error) {
    throw new Error(
      'background art missing: ' + ART_FILE + ' (expected a ' + ART_MIME + ' asset)'
    );
  }
  return 'data:' + ART_MIME + ';base64,' + bytes.toString('base64');
}

async function main() {
  const cssFiles = await collectCss(SRC);
  if (cssFiles.length === 0) throw new Error('no CSS found under src/');

  const parts = [];
  for (const file of cssFiles) {
    const raw = await readFile(file, 'utf8');
    parts.push(stripComments(raw).trim());
  }

  const artUri = await loadArt();
  const stylesheet = parts.join('\n\n').replaceAll(ART_PLACEHOLDER, artUri);

  const clientSource = await readFile(join(SRC, 'client.js'), 'utf8');
  const occurrences = clientSource.split(PLACEHOLDER).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      'expected exactly one ' + PLACEHOLDER + ' in src/client.js, found ' + occurrences
    );
  }
  const built = BANNER + '\n' + clientSource.replace(PLACEHOLDER, JSON.stringify(stylesheet));

  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'client.js'), built, 'utf8');

  const kb = (n) => (n / 1024).toFixed(1) + ' kB';
  console.log('css files  : ' + cssFiles.length);
  for (const file of cssFiles) {
    const raw = await readFile(file, 'utf8');
    console.log('  ' + file.slice(ROOT.length + 1).replace(/\\/g, '/') + '  ' + kb(raw.length));
  }
  console.log('stylesheet : ' + kb(stylesheet.length));
  console.log('output     : lib/client.js  ' + kb(built.length));
}

main().catch((error) => {
  console.error('[dsh-furina-style] build failed:', error);
  process.exitCode = 1;
});
