/** Real host React + fake per-session model directory; isolated :5177 only.
 * Reloads ONLY the isolated browser to capture React, never calls a real model API.
 * Fixtures, portal listeners, init hook and viewport are removed in finally.
 */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const endpoint = process.env.DSH_CDP_URL || 'http://127.0.0.1:9333';
const pages = await (await fetch(endpoint + '/json/list')).json();
const page = pages.find(p => p.type === 'page' && new URL(p.url).port === '5177');
assert.ok(page, 'An isolated conversation on :5177 is required');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let sequence = 0;
const pending = new Map();
ws.onmessage = event => {
  const message = JSON.parse(event.data), entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id); clearTimeout(entry.timer);
  message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
};
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 15000);
    pending.set(id, {resolve, reject, timer}); ws.send(JSON.stringify({id, method, params}));
  });
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
  assert.ok(!response.exceptionDetails, response.exceptionDetails?.exception?.description || 'Browser exception');
  return response.result.value;
}
const settle = () => evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
async function click(selector) { await evaluate((selector.startsWith('.fh-') ? 'window.__fhFixtureQuery(' : 'document.querySelector(') + JSON.stringify(selector) + ').click()'); await settle(); }
async function key(key, type = 'keyDown') { await send('Input.dispatchKeyEvent', {type, key, code:key}); await settle(); }
function captureReact() {
  let value;
  Object.defineProperty(window, '__ModuleLoader__', {configurable:true, get:()=>value, set(loader) {
    value = loader;
    const wrap = load => function(registration) {
      if (registration.id === 'dsh-furina-style') {
        const factory = registration.factory;
        registration = {...registration, factory(require) {
          window.__fhTestReact = require('react'); window.__fhTestReactDOM = require('react-dom');
          return factory(require);
        }};
      }
      return load.call(this, registration);
    };
    let load = wrap(loader.load);
    Object.defineProperty(loader, 'load', {configurable:true, get:()=>load, set:fn=>{ load=wrap(fn); }});
  }});
}
function mountFixture(source, css) {
  const React = window.__fhTestReact, ReactDOM = window.__fhTestReactDOM;
  const {Component, marker} = new Function('React', 'h', 'ReactDOM', source + ';return {Component:FurinaModelControls,marker:installPermissionMarker}') (React, React.createElement, ReactDOM);
  const listeners = new Set(), calls = [];
  let snapshot = {status:'ready', pending:null, error:null, retainedEffort:null, current:{provider:'test-provider',model:'alpha'}, groups:[{id:'test-provider',name:'Fixture provider',models:[
    {id:'alpha',name:'Deepseek-V4.1-Flash · x0.11',description:'Balanced general-purpose reasoning',reasoning:{efforts:[{id:'test-low',name:'Low'},{id:'test-high',name:'High'},{id:'provider-custom',name:'Custom'}]}},
    {id:'plain',name:'No reasoning model'},
  ]}]};
  const publish = patch => { snapshot={...snapshot,...patch}; for(const fn of listeners) fn(); };
  const directory = {store:{subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},getSnapshot:()=>snapshot},load:async()=>snapshot,select:async selection=>{
    calls.push(selection);
    if (window.__fhControlFixture.fail) return {ok:false,error:{message:'Fixture refused'}};
    publish({current:{...selection}}); return {ok:true};
  }};
  const host = document.createElement('span'); host.id='fh-controls-fixture'; host.style.display='contents';
  document.querySelector('[data-slot="conversation.input.right"]').append(host);
  const style=document.createElement('style');
  style.textContent=css+'\n.fh-model-controls:not(#fh-controls-fixture .fh-model-controls){display:none!important}#VideoTogetherWrapper{display:none!important}';document.head.append(style);
  window.__fhFixtureQuery=selector=>{
    const inline=host.querySelector(selector);if(inline)return inline;
    for(const trigger of host.querySelectorAll('[aria-controls]')){
      const portal=document.getElementById(trigger.getAttribute('aria-controls'));
      const found=portal?.matches(selector)?portal:portal?.querySelector(selector);if(found)return found;
    }
    return null;
  };
  const native=document.querySelector('[data-slot="conversation.input.model"] button');
  const wasDisabled=native.disabled;
  const root=ReactDOM.createRoot(host), unmark=marker();
  const render = props => root.render(React.createElement(Component, {directory,available:true,...props}));
  window.__fhControlFixture={calls,publish,snapshot:()=>snapshot,render,fail:false,dispose(){root.unmount();host.remove();style.remove();unmark();native.disabled=wasDisabled;delete window.__fhFixtureQuery;}};
  render();
}
async function capturePanel(name) {
  if (!process.env.DSH_TEST_PREVIEW_DIR) return;
  await mkdir(process.env.DSH_TEST_PREVIEW_DIR, {recursive:true});
  await evaluate('Promise.all(window.__fhFixtureQuery(".fh-control-popover").getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))');
  const clip=await evaluate(`(()=>{const panel=window.__fhFixtureQuery('.fh-control-popover');const bounds=[panel,...panel.querySelectorAll('.fh-model-submenu')].map(e=>e.getBoundingClientRect());const x=Math.max(0,Math.min(...bounds.map(b=>b.x))-12),y=Math.max(0,Math.min(...bounds.map(b=>b.y))-12);return {x,y,width:Math.min(innerWidth-x,Math.max(...bounds.map(b=>b.right))-x+12),height:Math.min(innerHeight-y,Math.max(...bounds.map(b=>b.bottom))-y+12),scale:1};})()`);
  const image=await send('Page.captureScreenshot',{format:'png',clip});
  await writeFile(join(process.env.DSH_TEST_PREVIEW_DIR,name+'.png'),Buffer.from(image.data,'base64'));
}
let identifier;
try {
  await send('Page.enable');
  if (!await evaluate('Boolean(window.__fhTestReactDOM)')) {
    ({identifier} = await send('Page.addScriptToEvaluateOnNewDocument', {source:'(' + captureReact.toString() + ')()'}));
    const loaded = new Promise(resolve => {
      const listener = event => { if (JSON.parse(event.data).method === 'Page.loadEventFired') { ws.removeEventListener('message', listener); resolve(); } };
      ws.addEventListener('message', listener);
    });
    await send('Page.reload'); await loaded; await settle();
  }
  await evaluate(`new Promise((resolve,reject)=>{
    const ready=()=>!!document.querySelector('[data-slot="conversation.input.right"]') && !!document.querySelector('[data-testid="todo-panel"]');
    if(ready()){resolve();return;}
    const timer=setTimeout(()=>{observer.disconnect();reject(Error('Open an isolated conversation with tasks first'));},15000);
    const observer=new MutationObserver(()=>{if(ready()){clearTimeout(timer);observer.disconnect();resolve();}});
    observer.observe(document.body,{childList:true,subtree:true});
  })`);
  assert.ok(await evaluate('Boolean(window.__fhTestReactDOM)'), 'The isolated plugin did not expose React');
  const source = await readFile(new URL('../src/composer-controls.js', import.meta.url), 'utf8');
  const css = (await Promise.all(['19-composer-controls.css','19a-composer-stability.css'].map(file => readFile(new URL('../src/' + file, import.meta.url), 'utf8')))).join('\n');
  await evaluate('(' + mountFixture.toString() + ')(' + JSON.stringify(source) + ',' + JSON.stringify(css) + ')'); await settle();
  assert.equal(await evaluate('window.__fhFixtureQuery(".fh-model-button").disabled'), false);
  assert.equal(await evaluate('window.__fhFixtureQuery(".fh-effort-button").textContent'), 'Default');
  assert.ok(await evaluate('('+(()=>{const button=window.__fhFixtureQuery('.fh-effort-button'),range=document.createRange();range.selectNodeContents(button);return range.getBoundingClientRect().width<=button.clientWidth+1;}).toString()+')()'), 'Default effort text must not be squeezed into clipped middle letters');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-slot="conversation.input.model"]')).display`), 'none');
  for (const extra of [[], ['--plain']]) execFileSync(process.execPath, [fileURLToPath(new URL('./check-composer-layout.mjs', import.meta.url)), '--matrix', ...extra], {stdio:'inherit'});
  execFileSync(process.execPath, [fileURLToPath(new URL('./check-composer-stability.mjs', import.meta.url)), '--matrix'], {stdio:'inherit'});
  for (const width of [1570, 400]) {
    const before = await evaluate('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})');
    try {
      await send('Emulation.setDeviceMetricsOverride', {width,height:950,deviceScaleFactor:1,mobile:false});
      await settle();
      const active = await evaluate(
        '(' + (async () => {
          const card=document.querySelector('[data-composer-card]');
          const row=card.querySelector('[class*="_row"]');
          const tools=row.querySelector('[class*="_tools"]');
          const trailing=row.querySelector('[class*="_trailing"]');
          const standard=trailing.querySelector('[class*="_standardControls"]');
          const prefix=trailing.classList[0].slice(0,trailing.classList[0].indexOf('_')+1);
          const meter=document.querySelector('[data-composer-dock] > [class*="_root"]');
          const previous={tools:tools.hidden,standard:standard.hidden,className:trailing.className,meterStyle:meter?.getAttribute("style")};
          const positions=()=>[...document.querySelectorAll('[data-composer-stat]')].map(e=>[e.getBoundingClientRect().x,e.getBoundingClientRect().width]);
          const stats=positions();
          const activity=document.createElement('div');activity.className=prefix+'activityExpanded';
          activity.style.cssText='display:flex;gap:6px;min-width:0;align-items:center';
          const label=document.createElement('span');label.textContent='Queued work';label.style.cssText='flex:1;min-width:0;overflow:hidden;white-space:nowrap';activity.append(label);
          for(let i=0;i<2;i++){const button=document.createElement('button');button.textContent=String(i);button.style.cssText='flex:none;width:36px;height:24px';activity.append(button);}
          try {
            // The host omits ContextMeter entirely while activity is expanded.
            meter?.style.setProperty("display","none","important");
            tools.hidden=true;standard.hidden=true;trailing.classList.add(prefix+'trailingActive');trailing.append(activity);
            await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
            const box=trailing.getBoundingClientRect();
            return {width:box.width,drift:Math.max(...positions().flatMap((r,i)=>r.map((v,j)=>Math.abs(v-stats[i][j])))),hit:[...activity.querySelectorAll('button')].every(button=>{const r=button.getBoundingClientRect();return button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})};
          } finally {activity.remove();tools.hidden=previous.tools;standard.hidden=previous.standard;trailing.className=previous.className;if(meter){if(previous.meterStyle===null)meter.removeAttribute("style");else meter.setAttribute("style",previous.meterStyle);}}
        }).toString() + ')()'
      );
      assert.ok(active.width>=80 && active.hit, 'Active/queued actions must remain hit-testable in the right wing');
      assert.ok(active.drift<1, 'Active controls must preserve statistics positions');
    } finally {
      await send('Emulation.setDeviceMetricsOverride',{width:before.width,height:before.height,deviceScaleFactor:before.dpr,mobile:false});
      await settle();
    }
  }
  console.log('PASS active/queued controls remain hit-testable without moving statistics');
  await evaluate(`document.querySelector('[data-slot="conversation.input.model"] button').disabled=true`); await settle();
  assert.equal(await evaluate('window.__fhFixtureQuery(".fh-model-button").disabled'), true);
  await evaluate(`document.querySelector('[data-slot="conversation.input.model"] button').disabled=false`); await settle();
  if (process.env.DSH_TEST_SCREENSHOT) {
    const clip = await evaluate(`(()=>{const task=document.querySelector('[data-testid="todo-panel"]').getBoundingClientRect();const input=document.querySelector('[data-composer-card]').parentElement.getBoundingClientRect();return {x:input.x,y:task.y-4,width:input.width,height:input.bottom-task.y+8,scale:1};})()`);
    const screenshot = await send('Page.captureScreenshot', {format:'png',clip});
    await writeFile(process.env.DSH_TEST_SCREENSHOT, Buffer.from(screenshot.data,'base64'));
  }
  await click('[data-slot="conversation.input.permission"] button');
  assert.equal(await evaluate('document.querySelectorAll("[data-fh-permission-menu]").length'), 1);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-fh-permission-menu]")).borderRadius'), '12px');
  await evaluate(`(()=>{const menu=document.querySelector('[data-fh-permission-menu]');const badge=document.createElement('span');badge.className='dlU_AG_badge';badge.textContent='Experimental';menu.querySelector('button[class*="_selected"]').append(badge);menu.removeAttribute('data-fh-permission-menu');document.querySelector('[data-slot="conversation.input.permission"] button').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`);await settle();
  assert.equal(await evaluate('document.querySelectorAll("[data-fh-permission-menu]").length'), 1, 'Permission badge must not prevent portal identification');
  await evaluate('document.querySelector("[data-fh-permission-menu] .dlU_AG_badge").remove()');
  await key('Escape');
  await click('.fh-model-button');
  assert.equal(await evaluate('document.activeElement.className'), 'fh-model-search');
  assert.equal(await evaluate('getComputedStyle(window.__fhFixtureQuery(".fh-model-search")).width'), '1px', 'No permanent search box in the reference menu');
  assert.equal(await evaluate('getComputedStyle(window.__fhFixtureQuery(".fh-model-option")).minHeight'), '32px');
  await capturePanel('furina-model-menu');
  await click('.fh-model-option:last-child');
  assert.deepEqual(await evaluate('window.__fhControlFixture.calls.at(-1)'), {provider:'test-provider',model:'plain'});
  assert.equal(await evaluate('!!window.__fhFixtureQuery(".fh-effort-button")'), false);
  await click('.fh-model-button'); await click('.fh-model-option');
  assert.deepEqual(await evaluate('window.__fhControlFixture.calls.at(-1)'), {provider:'test-provider',model:'alpha'});
  await click('.fh-effort-button');
  assert.deepEqual(await evaluate(`(()=>{const track=window.__fhFixtureQuery('.fh-effort-track'),knob=window.__fhFixtureQuery('.fh-effort-knob'),ends=window.__fhFixtureQuery('.fh-effort-ends');return {rail:getComputedStyle(track,'::before').height,knob:[knob.offsetWidth,knob.offsetHeight],white:getComputedStyle(knob).backgroundColor,endsAbove:ends.getBoundingClientRect().bottom<=track.getBoundingClientRect().top,nativeOpacity:getComputedStyle(window.__fhFixtureQuery('.fh-effort-range')).opacity}})()`), {rail:'26px',knob:[16,30],white:'rgb(255, 255, 255)',endsAbove:true,nativeOpacity:'0'});
  await capturePanel('furina-effort-normal');
  const count = await evaluate('window.__fhControlFixture.calls.length');
  await key('End');
  assert.equal(await evaluate('window.__fhControlFixture.calls.length'), count, 'Dragging/key preview must not commit');
  assert.equal(await evaluate('getComputedStyle(window.__fhFixtureQuery(".fh-effort-matrix")).gridTemplateRows.split(" ").length'),5,'Apex is a five-row matrix, not a native range');
  await evaluate('Promise.all(window.__fhFixtureQuery(".fh-effort-fill").getAnimations().map(a=>a.finished.catch(()=>{})))');
  assert.equal(await evaluate('getComputedStyle(window.__fhFixtureQuery(".fh-effort-fill")).opacity'),'0');
  await capturePanel('furina-effort-apex');
  await key('End', 'keyUp');
  assert.equal(await evaluate('window.__fhControlFixture.calls.length'), count + 1);
  assert.deepEqual(await evaluate('window.__fhControlFixture.calls.at(-1)'), {provider:'test-provider',model:'alpha',reasoningEffort:'provider-custom'});
  await key('Home'); await key('Home', 'keyUp');
  assert.deepEqual(await evaluate('window.__fhControlFixture.calls.at(-1)'), {provider:'test-provider',model:'alpha'}, 'Default omits the effort field');
  await key('Escape');
  assert.equal(await evaluate('document.activeElement.className'), 'fh-effort-button');
  await evaluate('window.__fhControlFixture.publish({current:{provider:"test-provider",model:"alpha",reasoningEffort:"legacy-provider-effort"},retainedEffort:"Legacy effort"})'); await settle();
  assert.equal(await evaluate('window.__fhFixtureQuery(".fh-effort-button").textContent'), 'Legacy effort', 'An unlisted active effort must not masquerade as Default');
  await evaluate('window.__fhControlFixture.publish({current:{provider:"test-provider",model:"alpha"},retainedEffort:null})'); await settle();
  await evaluate(`(()=>{const f=window.__fhControlFixture;f.publish({groups:[...f.snapshot().groups,{id:'alternate',name:'Alternate provider',models:[{id:'other',name:'Other provider model',description:'Only shown in the main list'}]}]});})()`);await settle();
  await click('.fh-model-button'); await click('.fh-model-more');
  assert.equal(await evaluate('getComputedStyle(window.__fhFixtureQuery(".fh-model-submenu .fh-model-group-row")).position'),'sticky');
  assert.equal(await evaluate('getComputedStyle(window.__fhFixtureQuery(".fh-control-popover")).overflow'),'visible','The flyout must not be clipped by the generic dialog skin');
  assert.equal(await evaluate(`(()=>{const option=window.__fhFixtureQuery('.fh-model-submenu .fh-model-option');const r=option.getBoundingClientRect();return option.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()`),true,'The flyout must be hit-testable, not merely present in DOM');
  await capturePanel('furina-model-more');
  const menuViewport = await evaluate('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})');
  try {
    await send('Emulation.setDeviceMetricsOverride',{width:520,height:950,deviceScaleFactor:1,mobile:false}); await settle();
    await evaluate('window.__fhFixtureQuery(".fh-model-more").focus()');
    await key('ArrowDown');
    assert.equal(await evaluate('!!document.activeElement.closest(".fh-model-submenu")'),true);
    await key('ArrowDown');
    assert.equal(await evaluate('document.activeElement.className'),'fh-model-search');
    await key('ArrowDown');
    assert.equal(await evaluate('document.activeElement.className'),'fh-model-more','Mobile keyboard navigation must skip hidden primary models');
  } finally {
    await send('Emulation.setDeviceMetricsOverride',{width:menuViewport.width,height:menuViewport.height,deviceScaleFactor:menuViewport.dpr,mobile:false}); await settle();
  }
  await click('.fh-model-submenu .fh-model-option');
  assert.deepEqual(await evaluate('window.__fhControlFixture.calls.at(-1)'),{provider:'alternate',model:'other'});
  await evaluate('window.__fhControlFixture.publish({current:{provider:"test-provider",model:"alpha"}})');await settle();
  await evaluate('window.__fhControlFixture.fail=true');
  await click('.fh-model-button'); await click('.fh-model-option:last-child');
  assert.equal(await evaluate('window.__fhFixtureQuery(".fh-control-error").textContent'), 'Fixture refused');
  await key('Escape');
  await evaluate('window.__fhControlFixture.render({directory:null})'); await settle();
  assert.equal(await evaluate('!!window.__fhFixtureQuery(".fh-model-controls")'), false, 'Missing API restores native fallback');
  if (!await evaluate('document.querySelector(".fh-model-controls[data-ready]") !== null')) {
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('[data-slot="conversation.input.model"]')).display`), 'none');
  }
  console.log('PASS real React model/effort: selection payloads, arbitrary effort IDs, one commit, Default, unsupported model, Escape/focus, failure, missing API fallback');
} finally {
  await evaluate('window.__fhControlFixture?.dispose();delete window.__fhControlFixture;delete window.__fhTestReact;delete window.__fhTestReactDOM');
  if(identifier) await send('Page.removeScriptToEvaluateOnNewDocument', {identifier});
  ws.close();
}
