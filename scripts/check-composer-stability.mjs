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
function geometry() {
  const box=e=>{const r=e?.getBoundingClientRect();return r?.width?{x:r.x,width:r.width,y:r.y}:null};
  const visible=s=>[...document.querySelectorAll(s)].find(e=>e.getBoundingClientRect().width);
  return {input:box(visible('[data-input-scroll]')),goal:box(document.querySelector('[data-goal-bar]')?.firstElementChild),stats:[...document.querySelectorAll('[data-composer-stat]')].map(box),dock:box(document.querySelector('[data-composer-dock]')),model:box(visible('.fh-model-button')),effort:box(visible('.fh-effort-button')),context:box(visible('[data-composer-dock] > ._2WTFBq_root'))};
}
const settle=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
let original;
try {
  original=await evaluate('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})');
  const widths=process.argv.includes('--matrix')?[1923,1570,1100,900,760,640,520,400]:[original.width];
  for(const width of widths){
    if(process.argv.includes('--matrix')) await send('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:false});
    await settle();
    const g=await evaluate('('+geometry.toString()+')()');
    assert.ok(g.goal,'Open a conversation with an active goal');
    await evaluate(`(()=>{const candidates=[...document.querySelectorAll('.fh-model-label,[data-slot="conversation.input.model"] [class*="_triggerLabel"]')];const node=candidates.find(e=>e.getBoundingClientRect().width);if(!node)throw Error('Missing visible model label');window.__fhStabilityFixture={node,text:node.textContent};node.textContent='X';})()`);await settle();
    const short=await evaluate('('+geometry.toString()+')()');
    await evaluate('window.__fhStabilityFixture.node.textContent="Extremely long model information with provider, price and reasoning metadata"');await settle();
    const long=await evaluate('('+geometry.toString()+')()');
    const drift=Math.max(...short.stats.flatMap((r,i)=>[Math.abs(r.x-long.stats[i].x),Math.abs(r.width-long.stats[i].width)]));
    console.log('width='+width+', goal/input='+g.goal.width+'/'+g.input.width+', statistics drift='+drift+'px');
    assert.ok(Math.abs(g.goal.x-g.input.x)<1&&Math.abs(g.goal.width-g.input.width)<1,'Goal bar and input must have identical left edge and width');
    assert.ok(drift<1,'Statistics must not move or shrink when the model label changes');
    const centerError=Math.abs((g.dock.x+g.dock.width/2)-(g.input.x+g.input.width/2));
    assert.ok(centerError<1,'Token statistics must remain centered on the input, not on the leftover track: '+centerError+'px');
    const groupLeft=Math.min(...g.stats.map(r=>r.x));
    const groupRight=Math.max(...g.stats.map(r=>r.x+r.width));
    assert.ok(Math.abs((groupLeft+groupRight)/2-(g.input.x+g.input.width/2))<1,'The visible statistics group itself must be centered');
    if(g.model&&g.effort){
      assert.ok(g.effort.x-(g.model.x+g.model.width)<=3,'Model and effort must remain adjacent, not stretched apart');
      assert.ok(g.model.x>=g.input.x+g.input.width/2,'Model and effort must stay on the right');
      if(g.context)assert.ok(g.context.x-(g.effort.x+g.effort.width)<=36,'Model/effort group must retain its original context-side anchor: '+JSON.stringify(g));
    }
    await evaluate('window.__fhStabilityFixture.node.textContent=window.__fhStabilityFixture.text;delete window.__fhStabilityFixture');
  }
  console.log('PASS goal/input equality and fixed statistics positions');
} finally {
  await evaluate('if(window.__fhStabilityFixture){window.__fhStabilityFixture.node.textContent=window.__fhStabilityFixture.text;delete window.__fhStabilityFixture}');
  if(original&&process.argv.includes('--matrix'))await send('Emulation.setDeviceMetricsOverride',{width:original.width,height:original.height,deviceScaleFactor:original.dpr,mobile:false});
  ws.close();
}
