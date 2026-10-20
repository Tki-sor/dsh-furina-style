/** Isolated :5177 native account portal. Never invokes logout or changes settings.
 * Default previews source; --built verifies the installed artifact without injection. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const pages=await(await fetch((process.env.DSH_CDP_URL||'http://127.0.0.1:9333')+'/json/list')).json();
const page=pages.find(p=>p.type==='page'&&new URL(p.url).port==='5177');
assert.ok(page,'Isolated :5177 page required');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
let sequence=0;const pending=new Map();
ws.onmessage=event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)};
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method))},10000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,r.exceptionDetails?.exception?.description||'Browser exception');return r.result.value}
const settle=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))))');
const key=async key=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});await settle()};
async function open(){await evaluate('('+(()=>document.querySelector('[data-slot="settings.launcher"] button').click()).toString()+')()');await settle();await evaluate('('+(()=>Promise.all([...document.querySelectorAll('body > [role="menu"]')].flatMap(m=>m.getAnimations({subtree:true})).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))).toString()+')()')}
function measure(){
  const trigger=document.querySelector('[data-slot="settings.launcher"] button');
  const menu=document.querySelector('[data-fh-account-menu]');if(!menu)return null;
  const css=getComputedStyle(menu),r=menu.getBoundingClientRect(),t=trigger.getBoundingClientRect();
  return {width:r.width,triggerWidth:t.width,radius:css.borderRadius,padding:css.padding,border:css.borderTopWidth,
    above:r.bottom<=t.top+2,rows:[...menu.querySelectorAll('[role="menuitem"]')].map(e=>({height:e.getBoundingClientRect().height,radius:getComputedStyle(e).borderRadius,font:getComputedStyle(e).fontSize})),
    viewportPadding:getComputedStyle(menu.querySelector('[role="presentation"]')).padding};
}
let injected=false;
try{
  await key('Escape');
  if(!process.argv.includes('--built')){
    const source=await readFile(new URL('../src/account-menu.js',import.meta.url),'utf8');
    const css=await readFile(new URL('../src/58-chrome.css',import.meta.url),'utf8');
    await evaluate('(()=>{const style=document.createElement("style");style.id="fh-account-fixture-style";style.textContent='+JSON.stringify(css)+';document.head.append(style);window.__fhDisposeAccount=new Function('+JSON.stringify(source+';return installAccountMenu()')+')();})()');injected=true;
  }
  await open();
  const g=await evaluate('('+measure.toString()+')()');
  assert.ok(g,'Account portal must be marked by its own trigger, not inferred from shortcuts');
  assert.ok(Math.abs(g.width-g.triggerWidth)<1,'Account menu must match the account-row width');
  assert.equal(g.radius,'12px');assert.equal(g.padding,'6px');assert.equal(g.border,'1px');assert.ok(g.above,'Keep native upward anchoring');
  assert.equal(g.viewportPadding,'0px');for(const row of g.rows){assert.equal(row.height,32);assert.equal(row.radius,'6px');assert.equal(row.font,'13px')}
  await evaluate('(()=>{const item=document.querySelector("[data-fh-account-menu] [aria-keyshortcuts]");if(item){window.__fhShortcut={item,value:item.getAttribute("aria-keyshortcuts")};item.removeAttribute("aria-keyshortcuts");}})()');await settle();
  assert.equal((await evaluate('('+measure.toString()+')()')).radius,'12px','Unbound settings shortcuts must not lose menu styling');
  await evaluate('('+(()=>{const trigger=document.querySelector('[data-slot="settings.launcher"] button');window.__fhAccountWidth={trigger,value:trigger.style.getPropertyValue('width'),priority:trigger.style.getPropertyPriority('width')};trigger.style.setProperty('width','220px','important');}).toString()+')()');await settle();
  const resized=await evaluate('('+measure.toString()+')()');assert.ok(Math.abs(resized.width-resized.triggerWidth)<1,'Menu must follow account-row resize');
  await evaluate('(()=>{const f=window.__fhAccountWidth;f.trigger.style.setProperty("width",f.value,f.priority);delete window.__fhAccountWidth;})()');await settle();
  await key('Escape');
  await evaluate('('+(()=>{const trigger=document.querySelector('[data-slot="settings.launcher"] button');window.__fhAccountTransform={trigger,css:trigger.style.cssText};trigger.style.setProperty('transform','scale(.97)','important');trigger.style.setProperty('transition','none','important');}).toString()+')()');
  await open();
  assert.ok(await evaluate('('+(()=>{const trigger=document.querySelector('[data-slot="settings.launcher"] button'),menu=document.querySelector('[data-fh-account-menu]');return Math.abs(menu.getBoundingClientRect().width-trigger.offsetWidth)<1;}).toString()+')()'),'Press transforms must not become the cached menu width');
  await evaluate('(()=>{const f=window.__fhAccountTransform;f.trigger.style.cssText=f.css;delete window.__fhAccountTransform;})()');await settle();
  if(process.env.DSH_TEST_PREVIEW_DIR){
    await mkdir(process.env.DSH_TEST_PREVIEW_DIR,{recursive:true});
    const clip=await evaluate('('+(()=>{const m=document.querySelector('[data-fh-account-menu]').getBoundingClientRect(),t=document.querySelector('[data-slot="settings.launcher"] button').getBoundingClientRect();return{x:Math.max(0,m.x-8),y:Math.max(0,m.y-8),width:Math.max(m.right,t.right)-Math.max(0,m.x-8)+8,height:t.bottom-Math.max(0,m.y-8)+8,scale:1}}).toString()+')()');
    const image=await send('Page.captureScreenshot',{format:'png',clip});await writeFile(join(process.env.DSH_TEST_PREVIEW_DIR,'furina-account-menu.png'),Buffer.from(image.data,'base64'));
  }
  await key('ArrowDown');assert.ok(await evaluate('!!document.activeElement.closest("[data-fh-account-menu]")'),'Native menu keyboard navigation must remain active');
  await key('Escape');assert.equal(await evaluate('!!document.querySelector("[data-fh-account-menu]")'),false);
  await evaluate('('+(()=>document.querySelector('[data-slot="conversation.input.permission"] button').click()).toString()+')()');await settle();
  assert.equal(await evaluate('!!document.querySelector("[data-fh-account-menu]")'),false,'Permission menus must not be restyled as accounts');await key('Escape');
  console.log('PASS native account menu: measured width, Claude geometry, shortcut-unbound style, resize/press-transform, keyboard/Escape, unrelated-menu isolation');
}finally{
  await key('Escape');
  await evaluate('(()=>{const s=window.__fhShortcut;if(s&&s.item.isConnected)s.item.setAttribute("aria-keyshortcuts",s.value);delete window.__fhShortcut;const f=window.__fhAccountWidth;if(f)f.trigger.style.setProperty("width",f.value,f.priority);delete window.__fhAccountWidth;const transformed=window.__fhAccountTransform;if(transformed)transformed.trigger.style.cssText=transformed.css;delete window.__fhAccountTransform;window.__fhDisposeAccount?.();delete window.__fhDisposeAccount;document.getElementById("fh-account-fixture-style")?.remove()})()');
  ws.close();
}
