/** Geometry regression against an existing isolated conversation; never sends messages.
 * DSH_CDP_URL defaults to http://127.0.0.1:9333; DSH_TEST_PAGE to :5177.
 * --matrix temporarily resizes the test page and substitutes a long model label.
 * Add --plain to cover noninteractive statistics (no aria-label or details dialog).
 * All browser-only fixtures are restored; no model/session configuration is changed.
 */
import assert from 'node:assert/strict';
const endpoint = process.env.DSH_CDP_URL || 'http://127.0.0.1:9333';
const pages = await (await fetch(endpoint + '/json/list')).json();
const page = pages.find(p => p.type === 'page' && p.url.includes(process.env.DSH_TEST_PAGE || ':5177'));
assert.ok(page, 'Open the isolated test conversation first');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
let sequence = 0;
const pending = new Map();
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  const entry = pending.get(message.id);
  if (!entry) return;
  clearTimeout(entry.timer);
  pending.delete(message.id);
  if (message.error) entry.reject(new Error(message.error.message));
  else entry.resolve(message.result);
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP check timed out: ' + method)); }, 10000);
    pending.set(id, {resolve, reject, timer});
    ws.send(JSON.stringify({id, method, params}));
  });
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
  assert.ok(!response.exceptionDetails, 'Browser probe threw');
  return response.result.value;
}
function probe() {
  const box = element => {
    if (!element) return null;
    const r = element.getBoundingClientRect();
    return r.width && r.height ? {x: r.x, y: r.y, width: r.width, height: r.height} : null;
  };
  const rect = selector => box(document.querySelector(selector));
  return {
    task: rect('[data-testid="todo-panel"]'), input: rect('[data-input-scroll]'),
    permission: rect('[data-slot="conversation.input.permission"] button'),
    model: rect('[data-slot="conversation.input.model"] button'), stats: rect('[data-composer-dock]'),
    pills: [...document.querySelectorAll('[data-composer-dock] button, [data-composer-stat] > span')].map(box).filter(Boolean),
    plainLabels: [...document.querySelectorAll('[data-composer-stat] > span [class*="_label"]')].map(e => ({text:e.textContent,display:getComputedStyle(e).display})),
    add: rect('[data-composer-card] [class*="_add"]'),
    primary: rect('[data-composer-card] [class*="_primary"]'),
    pageScrollWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
  };
}
function check(g) {
  for (const name of ['task', 'input', 'permission', 'model', 'stats']) assert.ok(g[name], 'Missing visible ' + name);
  assert.ok(Math.abs(g.task.x - g.input.x) < 1, 'Task and input left edges differ');
  assert.ok(Math.abs(g.task.width - g.input.width) < 1, 'Task and input widths differ');
  const middle = r => r.y + r.height / 2;
  for (const r of [g.permission, g.model, ...g.pills]) {
    assert.ok(Math.abs(middle(r) - middle(g.stats)) < 2, 'Controls occupy separate rows');
  }
  const controls = [g.permission, ...g.pills, g.model].sort((a, b) => a.x - b.x);
  for (let i = 1; i < controls.length; i++) {
    assert.ok(controls[i - 1].x + controls[i - 1].width <= controls[i].x + 1, 'Footer controls overlap');
  }
  for (const r of controls) {
    assert.ok(r.x >= g.input.x - 1 && r.x + r.width <= g.input.x + g.input.width + 1, 'Footer escapes input edges');
  }
  for (const r of [g.add, g.primary]) {
    assert.ok(r && r.y >= g.input.y - 1 && r.y + r.height <= g.input.y + g.input.height + 1, 'Input action lost its anchor');
  }
  for (const label of g.plainLabels) assert.ok(label.text && label.display !== 'none', 'Static statistics lost their only label');
  assert.ok(g.pageScrollWidth <= g.viewportWidth, 'Page overflows horizontally');
}
let original;
try {
  if (process.argv.includes('--matrix')) {
    original = await evaluate('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})');
    await evaluate("(()=>{const node=document.querySelector('[data-slot=\"conversation.input.model\"] [class*=\"_triggerLabel\"]');window.__fhLayoutFixture={node,text:node.textContent};node.textContent='Deepseek-V4.1-Flash · x0.11 High';})()");
    if (process.argv.includes('--plain')) {
      await evaluate(
        '(' + (() => {
          window.__fhPlainFixture = [...document.querySelectorAll('[data-composer-stat] > button')].map(button => {
            const span = document.createElement('span');
            span.className = button.className;
            span.innerHTML = button.innerHTML;
            button.replaceWith(span);
            return {button, span};
          });
        }).toString() + ')()'
      );
    }
    for (const width of [1923, 1570, 1100, 900, 760, 640, 520, 400]) {
      await send('Emulation.setDeviceMetricsOverride', {width, height:950, deviceScaleFactor:1, mobile:false});
      await evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
      const geometry = await evaluate('(' + probe.toString() + ')()');
      check(geometry);
      console.log('PASS width=' + width + ', task/input=' + geometry.input.width + ', footer controls=' + geometry.pills.length);
    }
  } else {
    const geometry = await evaluate('(' + probe.toString() + ')()');
    check(geometry);
    console.log(JSON.stringify(geometry));
    console.log('PASS: equal task/input widths and one non-overlapping footer row');
  }
} finally {
  if (original) {
    await evaluate('if(window.__fhLayoutFixture){const f=window.__fhLayoutFixture;f.node.textContent=f.text;delete window.__fhLayoutFixture;} if(window.__fhPlainFixture){for(const f of window.__fhPlainFixture)f.span.replaceWith(f.button);delete window.__fhPlainFixture;}');
    await send('Emulation.setDeviceMetricsOverride', {width:original.width, height:original.height, deviceScaleFactor:original.dpr, mobile:false});
  }
  ws.close();
}
