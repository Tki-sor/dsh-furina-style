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

async function main() {
  const cssFiles = await collectCss(SRC);
  if (cssFiles.length === 0) throw new Error('no CSS found under src/');

  const parts = [];
  for (const file of cssFiles) {
    const raw = await readFile(file, 'utf8');
    parts.push(stripComments(raw).trim());
  }
  const stylesheet = parts.join('\n\n');

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
