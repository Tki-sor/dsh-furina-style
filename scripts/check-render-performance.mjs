/** Isolated :5177 only; no messages or provider calls.
 * --source previews motion CSS; --compare restores the original ambient loop temporarily.
 * DSH_FRAME_BUDGET_MS defaults to 22ms MEAN; p95 and missed-frame share remain reported.
 * DOM text/scroll stress is NOT a real model or React streaming replay.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const pages=await(await fetch((process.env.DSH_CDP_URL||'http://127.0.0.1:9333')+'/json/list')).json();
const page=pages.find(p=>p.type==='page'&&new URL(p.url).port==='5177');
assert.ok(page,'Isolated :5177 UI required');
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
let sequence=0;
const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)};
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method))},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,r.exceptionDetails?.exception?.description||'Browser exception');return r.result.value}
async function escape(){for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'Escape',code:'Escape'});await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')}
function measure(operation){
  return new Promise((resolve,reject)=>{
    const gaps=[],tasks=[];
    let frame=0,watchdog=0,observer=null,streamNode=null,scroller=null,originalScroll=0,originalBehavior='',originalPriority='';
    let last=null,start=performance.now(),opened=false,mutations=0,lastAppend=start,minScroll=Infinity,maxScroll=-Infinity,finished=false;
    const cleanup=()=>{
      cancelAnimationFrame(frame);clearTimeout(watchdog);observer?.disconnect();streamNode?.remove();
      if(scroller){scroller.scrollTop=originalScroll;scroller.style.setProperty('scroll-behavior',originalBehavior,originalPriority);}
      if(window.__fhPerformanceFixture===cancel)delete window.__fhPerformanceFixture;
    };
    const fail=error=>{if(finished)return;finished=true;cleanup();reject(error)};
    const cancel=()=>fail(Error('Performance measurement cancelled'));
    const tick=now=>{
      try{
        if(last!==null)gaps.push(now-last);last=now;
        if(!opened&&now-start>100){
          opened=true;
          if(operation==='token')document.querySelector('[data-composer-stat="usage"] > button').click();
          if(operation==='settings'){
            document.querySelector('[data-slot="settings.launcher"] button').click();
            frame=requestAnimationFrame(()=>{
              try{document.querySelector('body > [role="menu"] [role="menuitem"]').click();frame=requestAnimationFrame(tick)}catch(error){fail(error)}
            });
            return;
          }
        }
        if(scroller){
          if(now-lastAppend>=33){streamNode.appendData(' streaming');mutations++;lastAppend=now;}
          scroller.scrollTop=(scroller.scrollHeight-scroller.clientHeight)*(.5+.45*Math.sin((now-start)/240));
          minScroll=Math.min(minScroll,scroller.scrollTop);maxScroll=Math.max(maxScroll,scroller.scrollTop);
        }
        if(now-start<1300){frame=requestAnimationFrame(tick);return;}
        const content=scroller||(operation==='token'?document.querySelector('dl[data-session-stats-usage]'):document.querySelector('[role="dialog"]'));
        const dialog=content?.closest('[role="dialog"]')||content,r=dialog?.getBoundingClientRect(),css=dialog&&getComputedStyle(dialog);
        const result={mutations,textAdded:streamNode?.length||0,scrollDistance:scroller?maxScroll-minScroll:0,
          mean:gaps.reduce((a,b)=>a+b,0)/gaps.length,missed:gaps.filter(gap=>gap>25).length/gaps.length,
          p95:[...gaps].sort((a,b)=>a-b)[Math.floor(gaps.length*.95)],max:Math.max(...gaps),frames:gaps.length,longTasks:tasks.length,
          visible:!!(r?.width&&r?.height&&Number(css.opacity)>.95&&css.visibility==='visible')};
        finished=true;cleanup();resolve(result);
      }catch(error){fail(error)}
    };
    try{
      if(operation==='stream-scroll'){
        const candidate=document.querySelector('[data-conversation-scroll]');
        const steps=document.querySelectorAll('[data-chat-flow-kind="assistant-step"]');
        if(!candidate||!steps.length||candidate.scrollHeight-candidate.clientHeight<100)throw Error('A real assistant step and >=100px scroll range are required');
        scroller=candidate;originalScroll=scroller.scrollTop;originalBehavior=scroller.style.getPropertyValue('scroll-behavior');originalPriority=scroller.style.getPropertyPriority('scroll-behavior');
        scroller.style.setProperty('scroll-behavior','auto');streamNode=steps[steps.length-1].appendChild(document.createTextNode(''));
      }
      window.__fhPerformanceFixture=cancel;
      observer=new PerformanceObserver(list=>tasks.push(...list.getEntries().map(e=>e.duration)));
      observer.observe({type:'longtask',buffered:false});
      watchdog=setTimeout(()=>fail(Error('Browser measurement stalled')),5000);
      frame=requestAnimationFrame(tick);
    }catch(error){fail(error)}
  });
}
async function suite(label){
  const results={};
  for(const operation of ['token','settings','stream-scroll']){
    const runs=[];
    for(let i=0;i<4;i++){await escape();runs.push(await evaluate('('+measure.toString()+')('+JSON.stringify(operation)+')'))}
    for(const run of runs){
      assert.ok(run.visible,operation+' must really be visible, not paused at opacity zero');
      if(operation==='stream-scroll')assert.ok(run.mutations>=20&&run.textAdded>=200&&run.scrollDistance>=100,'Fixture must change character data AND scroll the viewport');
    }
    const sorted=runs.map(run=>run.p95).sort((a,b)=>a-b);
    results[operation]={meanFrameMs:+(runs.reduce((n,r)=>n+r.mean,0)/runs.length).toFixed(2),missedFrameShare:+(runs.reduce((n,r)=>n+r.missed,0)/runs.length).toFixed(3),
      p95Samples:runs.map(r=>+r.p95.toFixed(1)),medianP95:(sorted[1]+sorted[2])/2,worstFrame:Math.max(...runs.map(r=>r.max)),longTasks:runs.reduce((n,r)=>n+r.longTasks,0)};
  }
  console.log(label,JSON.stringify(results));return results;
}
try{
  assert.ok(await evaluate('('+(()=>{const root=document.documentElement,scroll=document.querySelector('[data-conversation-scroll]');return root.hasAttribute('data-dsh-furina')&&root.getAttribute('data-dsh-furina-motion')==='on'&&root.getAttribute('data-dsh-furina-surfaces')==='own'&&getComputedStyle(document.body,'::before').content==='""'&&!!document.querySelector('[data-composer-stat="usage"] > button')&&!!document.querySelector('[data-chat-flow-kind="assistant-step"]')&&scroll?.scrollHeight-scroll?.clientHeight>=100;}).toString()+')()'),'Use an enabled own-surface/motion-on Furina conversation with assistant text and >=100px scroll range');
  if(process.argv.includes('--source')){
    const css=await readFile(new URL('../src/20-motion.css',import.meta.url),'utf8');
    await evaluate('(()=>{const s=document.createElement("style");s.id="fh-perf-source";s.textContent='+JSON.stringify(css)+';document.head.append(s)})()');
  }
  if(process.argv.includes('--compare')){
    const legacy='@keyframes fh-perf-legacy-drift{0%,100%{transform:translate3d(0,0,0) scale(1);opacity:.5}50%{transform:translate3d(-2%,1.5%,0) scale(1.06);opacity:.72}}html[data-dsh-furina][data-dsh-furina-motion="on"][data-dsh-furina-surfaces="own"] body::before{animation:fh-perf-legacy-drift calc(var(--fh-dur-breathe) * 8) var(--fh-ease-settle) infinite!important}';
    await evaluate('(()=>{const s=document.createElement("style");s.id="fh-perf-legacy";s.textContent='+JSON.stringify(legacy)+';document.head.append(s)})()');
    assert.ok(await evaluate('document.getAnimations().some(a=>a.animationName==="fh-perf-legacy-drift"&&a.playState==="running"&&a.effect.getTiming().duration>0)'),'Legacy comparison must actually animate');
    await suite('legacy');await evaluate('document.getElementById("fh-perf-legacy").remove()');
  }
  const optimized=await suite('optimized');
  assert.equal(await evaluate('getComputedStyle(document.body,"::before").animationName'),'none','Decorative full-window layer must remain static');
  for(const [operation,result]of Object.entries(optimized))assert.ok(result.meanFrameMs<=Number(process.env.DSH_FRAME_BUDGET_MS||22),operation+' mean '+result.meanFrameMs+'ms exceeds mean frame budget; p95 reported separately');
  console.log('PASS visible native panels, active text/scroll workload, static ambient layer');
}finally{
  try{
    await evaluate('window.__fhPerformanceFixture?.();document.getElementById("fh-perf-source")?.remove();document.getElementById("fh-perf-legacy")?.remove()');
    await escape();
  }finally{for(const entry of pending.values())clearTimeout(entry.timer);ws.close()}
}
