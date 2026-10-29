import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base=process.env.F1_DASHBOARD_URL||'http://127.0.0.1:5181/';
const out=path.resolve('artifacts'),screens=path.join(out,'screenshots');fs.mkdirSync(screens,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.F1_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,acceptDownloads:true});
const external=[],errors=[],checks=[];
await context.route('**/*',async route=>{const u=new URL(route.request().url());if(['http:','https:'].includes(u.protocol)&&!['127.0.0.1','localhost'].includes(u.hostname)){external.push(u.href);await route.abort();}else await route.continue();});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
async function ready(){await page.locator('h1').waitFor();await page.waitForTimeout(220);}
async function load(step='overview',query=''){await page.goto(`${base}?mode=present&step=${step}${query?'&'+query:''}`);await ready();}
async function explore(chapter='overview',query=''){await page.goto(`${base}?mode=explore&chapter=${chapter}${query?'&'+query:''}`);await ready();}
async function shot(name){await page.waitForTimeout(320);if(await page.locator('.concise-impact').count())await page.waitForFunction(()=>document.querySelector('.concise-impact').getAnimations({subtree:true}).every(a=>a.playState!=='running'));await page.screenshot({path:path.join(screens,name+'.png'),fullPage:true});}
async function check(name,fn){await fn();checks.push({name,passed:true});console.log('PASS',name);}
const plot=()=>page.locator('.chart-main .js-plotly-plot');
async function fit(step,w,h){
 const d=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s)?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,height:r.height}:null;};const el=document.querySelector('.js-plotly-plot');const a=document.querySelector('.insight-panel');return {body:document.body.scrollHeight,width:document.documentElement.scrollWidth,footer:rect('.app-footer'),chart:rect('.chart-card'),aside:a?{height:a.clientHeight,scroll:a.scrollHeight}:null,plotHeight:el?el._fullLayout._size.h:null,matrix:el&&el._fullLayout.yaxis?.domain[0]===.12?{x:el._fullLayout.xaxis._length,y:el._fullLayout.yaxis._length}:null};});
 assert(d.body<=h+2,`${step} scrolls at ${w}: ${JSON.stringify(d)}`);assert(d.width<=w+1,`${step} horizontal overflow at ${w}`);
 if(d.chart){assert(d.chart.bottom<=d.footer.top+1,`${step} overlaps footer`);assert(d.aside.scroll<=d.aside.height+2,`${step} aside clips or scrolls at ${w}: ${JSON.stringify(d.aside)}`);}
 if(step.startsWith('case'))assert(d.plotHeight>=300,`${step} actual plotting height ${d.plotHeight} at ${w}`);
 if(d.matrix){assert(Math.abs(d.matrix.x/d.matrix.y-1)<.03,`non-square matrix ${JSON.stringify(d.matrix)}`);assert(d.matrix.y>=(w===1280?280:350),`matrix too small ${d.matrix.y}`);}
}
const steps=['intro','overview','recovery-top10','recovery-podium','recovery-win','circuits-field','circuits-both','circuits-movement','case-grid','case-11','case-33','case-43','case-69','closing'];
try{
 await check('root opens the context and reveals the canonical historical first-start rate',async()=>{
  await page.goto(base);await ready();await expect(page.locator('.opening-stage')).toBeVisible();await expect(page.getByRole('img',{name:'Formula 1',exact:true})).toBeVisible();assert(await page.locator('.opening-f1-logo').evaluate(el=>el.complete&&el.naturalWidth>0));await expect(page.locator('.topbar')).not.toContainText('A HEAD START');await expect(page.getByRole('button',{name:'Reveal the history'})).toBeDisabled();
  await page.locator('.guess-buttons button').nth(2).click();await page.getByRole('button',{name:'Reveal the history'}).click();
  await expect(page.locator('.revealed')).toContainText('53.6%');await expect(page.locator('.revealed')).toContainText('134 wins from 250');await expect(page.locator('.revealed')).toContainText('75%');await shot('00-opening-reveal-1440');await page.setViewportSize({width:1280,height:720});await fit('intro-revealed',1280,720);await shot('00-opening-reveal-1280');await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'Explore the pattern'}).click();await expect(page.locator('.main-result')).toContainText('0.76');
 });
 await check('every narrative state fits desktop and projector with square heatmap cells and tall race plots',async()=>{
  for(const [w,h] of [[1440,900],[1280,720]]){
   await page.setViewportSize({width:w,height:h});
   for(const step of steps){await load(step);await fit(step,w,h);await shot(`${step}-${w}`);}
  }
 });
 await page.setViewportSize({width:1440,height:900});
 await check('overview shortcuts and cell selection explain records inline without changing denominators',async()=>{
  await load();await page.getByRole('button',{name:'P10 · middle',exact:true}).click();await expect(page.locator('.start-detail')).toContainText('135 of 247');await expect(page.locator('.scope-block')).toContainText('4,920 grid starts');
  await plot().evaluate(el=>el.emit('plotly_click',{points:[{curveNumber:0,x:1,y:1}]}));
  await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('.start-detail')).toContainText('134 of 250');
  await page.getByRole('button',{name:'View the records',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('134');await page.keyboard.press('Escape');
  await page.setViewportSize({width:1280,height:720});await fit('overview-selection',1280,720);await shot('overview-inspected-1280');await page.setViewportSize({width:1440,height:900});
 });
 await check('heatmap colours have one meaning and the exact-match summary retains the finisher denominator',async()=>{
  await load();
  const d=await plot().evaluate(el=>el.data.slice(0,2).map(t=>({scale:t.colorscale,min:t.zmin,max:t.zmax})));
  assert.deepEqual(d[0],d[1]);assert.equal(d[0].min,0);assert.equal(d[0].max,1);
  await expect(page.locator('.position-contrast')).toContainText('713 same place');await expect(page.locator('.position-contrast')).toContainText('3,404 changed place');
  const fraction=await page.locator('.position-share').evaluate(el=>el.firstElementChild.getBoundingClientRect().width/el.getBoundingClientRect().width);assert(Math.abs(fraction-713/4117)<.001);
  await explore('overview','driver=max-verstappen&team=marussia');await expect(page.locator('.position-share')).toHaveCount(0);
 });
 await check('heatmap focus dims other outcomes without recalculating rates',async()=>{
  await load();const before=await plot().evaluate(el=>el.data[0].z);
  await page.getByRole('button',{name:'↗ Gained places',exact:true}).click();
  assert.deepEqual(await plot().evaluate(el=>el.data[0].z),before);await expect(page.locator('.heatmap-focus-note')).toContainText('4,920 starts');
  const mask=await plot().evaluate(el=>el.data[2].z);assert.equal(mask[0][1],null);assert.equal(mask[1][0],1);
  await page.getByRole('button',{name:'Same position',exact:true}).click();await expect(page.locator('.heatmap-focus-note')).toContainText('713 of 4,920');
  await page.getByRole('button',{name:'P17 · back',exact:true}).click();await expect(page.locator('.start-detail')).toContainText('STARTING P17');
  await page.getByRole('button',{name:'All finishes',exact:true}).click();assert.deepEqual(await plot().evaluate(el=>el.data[0].z),before);
 });
 await check('restored circuit panels include São Paulo and contrasting order and movement histories',async()=>{
  await load('circuits-both');
  const d=await plot().evaluate(el=>({count:el.data.length,r:el.data[0].x,rates:el.data[1].x,ys:el.data.map(t=>t.y),rows:el.data[0].customdata}));
  assert.equal(d.count,2);assert.deepEqual(d.ys[0],d.ys[1]);
  assert.deepEqual(d.rows.map(r=>r[0]),['monaco','yas-marina','interlagos','sochi','hungaroring']);
  [.6,11/12,8/11,2/8,3/12].forEach((v,i)=>assert.equal(d.rates[i],v));
  assert(Math.abs(d.r[0]-.85659207)<.000001);assert(Math.abs(d.r[3]-.68097174)<.000001);
  await plot().evaluate(el=>el.emit('plotly_click',{points:[{customdata:el.data[0].customdata[2]}]}));
  await expect(page.locator('.integrated-detail')).toContainText('1.95');await expect(page.locator('.integrated-detail')).toContainText('94 top-ten starter results');
  await page.getByLabel('Circuit detail').selectOption('yas-marina');await expect(page.locator('.integrated-detail')).toContainText('11 wins from 12');
 });
 await check('circuit scales, uncertainty and legacy links retain honest comparisons',async()=>{
  await load('circuits-both');assert.equal(new URL(page.url()).searchParams.get('step'),'circuits-both');
  const d=await plot().evaluate(el=>({r:el.layout.xaxis.range,p:el.layout.xaxis2.range,ci:el.data.map(t=>t.error_x.array)}));
  assert.deepEqual(d.r,[-1,1.13]);assert.deepEqual(d.p,[-.02,1.16]);assert(d.ci.every(a=>a.every(v=>v>0)));
  await page.getByRole('button',{name:'Compare position change',exact:true}).click();await expect(page.getByRole('button',{name:'Position change · P1–10',exact:true})).toHaveAttribute('aria-pressed','true');
  assert((await plot().evaluate(el=>el.data[0].x)).every(v=>v>=0));
  await page.getByRole('button',{name:'Watch São Paulo 2024',exact:true}).click();await expect(page.locator('.race-position-list')).toContainText('P17');
 });
 await check('recovery follows the heatmap and combines all outcomes on shared scales with back groups first',async()=>{
  await load('overview');await page.getByRole('button',{name:'Explore recovery',exact:true}).click();
  await expect(page.locator('.outcome-result')).toContainText('167 of 1,185');await expect(page.locator('.outcome-result')).toContainText('14.1%');
  const d=await plot().evaluate(el=>({n:el.data.length,axes:[el.layout.xaxis.range],extraAxis:!!el.layout.xaxis2,values:el.data.map(t=>t.x[0]),order:el.data[0].customdata.map(r=>r[0])}));
  assert.equal(d.n,3);assert.equal(d.extraAxis,false);d.axes.forEach(a=>assert.deepEqual(a,[0,100]));assert.deepEqual(d.order,[4,3,2,1,0]);
  [167,12,1].forEach((n,i)=>assert(Math.abs(d.values[i]-100*n/1185)<1e-10));
  await page.getByRole('button',{name:'Reveal podium',exact:true}).click();await page.getByRole('button',{name:'Reveal wins',exact:true}).click();await expect(page.locator('.outcome-result')).toContainText('1 of 1,185');await expect(page.locator('.outcome-result')).toContainText('0.08%');
  await page.getByLabel('Starting group · back to front').selectOption('3');await expect(page.locator('.outcome-result')).toContainText('2 of 1,238');
  await page.getByRole('button',{name:'Compare the circuits',exact:true}).click();await expect(page.locator('h1')).toContainText('by circuit');
 });
 await check('combined recovery labels fit without collisions on desktop, projector and mobile',async()=>{
  for(const [w,h] of [[1440,900],[1280,720],[390,844]]){
   await page.setViewportSize({width:w,height:h});await load('recovery-win');
   const d=await plot().evaluate(el=>({pitch:el._fullLayout.yaxis._length/5,rects:[...el.querySelectorAll('.annotation-text')].map(t=>{const r=t.getBoundingClientRect();const p=el.getBoundingClientRect();return {text:t.textContent,left:r.left-p.left,right:r.right-p.left,top:r.top-p.top,bottom:r.bottom-p.top,width:p.width,height:p.height};})}));
   assert(d.pitch>=(w===390?36:48),`row pitch ${d.pitch}`);assert.equal(d.rects.length,15);
   for(const r of d.rects)assert(r.left>=0&&r.right<=r.width&&r.top>=0&&r.bottom<=r.height,`recovery label clipped: ${JSON.stringify(r)}`);
   for(let i=0;i<d.rects.length;i++)for(let j=i+1;j<d.rects.length;j++){const a=d.rects[i],b=d.rects[j];assert(!(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom),`recovery labels overlap: ${a.text} / ${b.text}`);}
  }
  await page.setViewportSize({width:1440,height:900});
 });
 await check('rare-rate marker selects its group and outcome without enlarging the data value',async()=>{
  await load('recovery-win');
  const d=await plot().evaluate(el=>({dot:el.data[2].x[0],detail:el.data[2].customdata[0]}));
  assert(Math.abs(d.dot-100/1185)<1e-12);assert.deepEqual(d.detail.slice(0,4),[4,'win',1,1185]);
  await plot().evaluate(el=>el.emit('plotly_click',{points:[{curveNumber:2,x:el.data[2].x[0],y:el.data[2].y[0],customdata:el.data[2].customdata[0]}]}));
  await expect(page.locator('.outcome-result')).toContainText('1 of 1,185');
 });
 await check('paired circuit labels remain inside the chart across screen sizes',async()=>{
  for(const [w,h] of [[2560,1440],[1920,1080],[1280,720],[390,844]]){
   await page.setViewportSize({width:w,height:h});await load('circuits-both');
   const rects=await plot().evaluate(el=>[...el.querySelectorAll('.annotation-text,.textpoint text')].map(t=>{const r=t.getBoundingClientRect(),c=el.getBoundingClientRect();return {text:t.textContent,left:r.left-c.left,right:r.right-c.left,top:r.top-c.top,bottom:r.bottom-c.top,width:c.width,height:c.height};}));
   for(const r of rects)assert(r.left>=-1&&r.right<=r.width+1&&r.top>=-1&&r.bottom<=r.height+1,`clipped circuit label at ${w}: ${JSON.stringify(r)}`);
   for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];assert(!(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom),`overlapping circuit labels at ${w}: ${a.text}, ${b.text}`);}
  }
  await page.setViewportSize({width:1440,height:900});
 });
 await check('race checkpoints contain only observed positions revealed so far and no future-result text',async()=>{
  const expected={0:[17,1,4],11:[6,2,4],33:[2,4,1],43:[1,7,2],69:[1,6,2]};
  for(const lap of [0,11,33,43,69]){
   await load(lap===0?'case-grid':`case-${lap}`);
   const cars=await plot().evaluate(el=>el.layout.images.map(i=>({x:i.x,y:i.y,source:i.source})));assert.equal(cars.length,3);cars.forEach((c,i)=>{assert.equal(c.x,lap);assert.equal(c.y,expected[lap][i]);assert(c.source.startsWith('data:image/svg+xml'));});
   const d=await plot().evaluate(el=>el.data.slice(0,3).map(t=>({xs:t.x,ys:t.y})));
   d.forEach((t,i)=>{assert.equal(Math.max(...t.xs),lap);assert.equal(t.ys.at(-1),expected[lap][i]);assert.equal(t.xs.length,lap+1);});
   const text=await page.locator('main').innerText();if(lap<69){assert(!text.includes('finished sixth'));assert(!text.includes('17th to first.'));}
   await expect(page.locator('.race-position-list').locator('div').nth(0)).toContainText(`P${expected[lap][0]}`);
  }
 });
 await check('race playback advances observed laps, pauses, restarts, stops at finish and respects manual navigation',async()=>{
  await load('case-grid');await page.getByRole('button',{name:'Play race',exact:true}).click();await page.waitForTimeout(1350);
  let lap=Number(await page.locator('#lap-scrubber').inputValue());assert(lap>=1&&lap<5);await page.getByRole('button',{name:'Pause race',exact:true}).click();
  lap=Number(await page.locator('#lap-scrubber').inputValue());await page.waitForTimeout(800);assert.equal(Number(await page.locator('#lap-scrubber').inputValue()),lap);
  await page.locator('#lap-scrubber').fill('68');await page.getByLabel('Playback speed').selectOption('2');await page.getByRole('button',{name:'Play race',exact:true}).click();await expect(page.locator('#lap-scrubber')).toHaveValue('69');await expect(page.getByRole('button',{name:'Play race',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Replay race from the grid'}).click();await expect(page.locator('#lap-scrubber')).toHaveValue('0');
  await page.getByRole('button',{name:'Play race',exact:true}).click();await page.getByRole('button',{name:/LAP 33/}).click();await page.waitForTimeout(750);await expect(page.locator('#lap-scrubber')).toHaveValue('33');await expect(page.getByRole('button',{name:'Play race',exact:true})).toBeVisible();
  await page.reload();await ready();await expect(page.locator('#lap-scrubber')).toHaveValue('33');await expect(page.getByRole('button',{name:'Play race',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Explore',exact:true}).click();await page.getByRole('button',{name:'Play race',exact:true}).click();await page.getByRole('button',{name:/LAP 11/}).click();await page.waitForTimeout(750);await expect(page.locator('#lap-scrubber')).toHaveValue('11');
 });
 await check('one-minute closing uses three fixed examples, exact counts and no filters',async()=>{
  await load('closing');await expect(page.locator('.decision-column')).toHaveCount(3);
  assert.equal(await page.locator('.closing-stage select,.closing-stage input').count(),0);
  await expect(page.locator('.strategy-decision')).toContainText('14.1%');await expect(page.locator('.strategy-decision')).toContainText('167 of 1,185 starts');
  assert.equal(await page.locator('.waffle i').count(),100);
  const filled=await page.locator('.waffle i').evaluateAll(es=>es.filter(e=>e.style.background.includes('100%')).length);assert(filled>=14);
  await expect(page.locator('.design-decision')).toContainText('Monaco');await expect(page.locator('.design-decision')).toContainText('Hungaroring');
  const xs=await page.locator('.movement-summary circle').evaluateAll(es=>es.map(e=>Number(e.getAttribute('cx'))));
  [1.309278350515464,2.383177570093458].forEach((v,i)=>assert(Math.abs(xs[i]-(24+v/3*312))<1e-9));
  const rates=await page.locator('.pole-sample').evaluateAll(es=>es.map(e=>({starts:e.querySelectorAll('.pole-tile').length,wins:e.querySelectorAll('.won').length,text:e.textContent})));
  assert.deepEqual(rates.map(r=>[r.wins,r.starts]),[[6,10],[11,12]]);
  for(const [w,h] of [[1440,900],[1280,720]]){await page.setViewportSize({width:w,height:h});await fit('closing',w,h);const cards=await page.locator('.decision-column').evaluateAll(es=>es.map(e=>({c:e.getBoundingClientRect().bottom,b:e.lastElementChild.getBoundingClientRect().bottom})));assert(cards.every(c=>c.b<=c.c),JSON.stringify(cards));const visuals=await page.locator('.decision-visual').evaluateAll(es=>es.map(e=>({client:e.clientHeight,scroll:e.scrollHeight})));assert(visuals.every(v=>v.scroll<=v.client+2),JSON.stringify(visuals));}
  await page.setViewportSize({width:1440,height:900});
 });
 await check('checkpoint navigation, Back, direct links and keyboard arrows agree',async()=>{
  await load('case-33');await page.getByRole('button',{name:'Previous story step'}).click();await expect(page.locator('.scope-block')).toContainText('lap 11');
  await page.locator('h1').click();await page.keyboard.press('ArrowRight');await expect(page.locator('.scope-block')).toContainText('lap 33');
  await page.reload();await ready();await expect(page.locator('.scope-block')).toContainText('lap 33');
  await page.getByLabel('Lap 33 / 69').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('.scope-block')).toContainText('lap 34');
  await page.getByRole('button',{name:'Show full race'}).click();await expect(page.locator('.race-position-list')).toContainText('P6');
  await page.getByRole('button',{name:'What can we use this for?',exact:true}).click();await expect(page.locator('.closing-stage')).toBeVisible();await page.getByRole('button',{name:'Explore the evidence',exact:true}).click();await expect(page.getByRole('button',{name:'Hide filters'})).toBeVisible();
 });
 await check('highlighting, cohort filtering and shared Explore URLs retain distinct meanings',async()=>{
  await explore();await page.getByRole('button',{name:'Edit selection'}).click();
  await page.getByLabel('Highlight driver without filtering').selectOption('max-verstappen');await expect(page.locator('.scope-block')).toContainText('4,920 grid starts');
  await page.getByLabel('Filter cohort by driver').selectOption('max-verstappen');await expect(page.locator('.scope-block')).not.toContainText('4,920 grid starts');
  const scope=await page.locator('.scope-block>span').innerText();await page.reload();await ready();await expect(page.locator('.scope-block>span')).toHaveText(scope);assert(new URL(page.url()).searchParams.get('highlight')==='max-verstappen');
 });
 await check('filtered cohorts do not inherit default story claims or unsupported uncertainty',async()=>{
  await explore('recovery','years=2022,2023&outcome=win&band=4');await expect(page.locator('.bridge-note')).toHaveCount(0);await expect(page.locator('h1')).not.toContainText('One win');
  await explore('circuits','years=2024,2024&circuits=monaco,yas-marina,monza,spa-francorchamps');await expect(page.locator('.chart-controls').last()).toContainText('point estimates only');await page.getByLabel('Include limited histories').check();assert((await plot().evaluate(el=>el.data.flatMap(t=>t.error_x.array))).every(n=>n===0));
  await page.getByRole('button',{name:'Present',exact:true}).click();await expect(page.locator('.scope-block')).toContainText('2014');assert.equal(await plot().evaluate(el=>el.data.length),1);
 });
 await check('empty cohorts display absence rather than false zero or a strong association claim',async()=>{
  await explore('overview','driver=max-verstappen&team=marussia');await expect(page.getByText('No comparison available')).toBeVisible();await expect(page.locator('.main-result')).toContainText('—');await expect(page.locator('h1')).toContainText('How closely');
 });
 await check('the case remains pinned in Explore and supports full-race inspection and Gasly',async()=>{
  await explore('case','years=2014,2014&circuits=monaco&driver=charles-leclerc');await expect(page.locator('.scope-block')).toContainText('SÃO PAULO');assert.equal(await plot().evaluate(el=>Math.max(...el.data[0].x)),69);
  await page.getByRole('button',{name:/LAP 43/}).click();await expect(page.locator('.race-position-list>div').first()).toContainText('P1');await page.getByLabel('Add Gasly').check();await expect(page.locator('.race-position-list')).toContainText('Gasly');
 });
 await check('sources, definitions, AI acknowledgement and all 35 grid-review decisions remain accessible',async()=>{
  await page.getByRole('button',{name:'Sources & methods'}).click();await expect(page.getByRole('dialog')).toContainText('Pearson');await page.getByRole('tab',{name:'Data & sources'}).click();await expect(page.getByRole('dialog')).toContainText('AI acknowledgement');
  await page.getByRole('tab',{name:'Grid review'}).click();assert.equal(await page.locator('.modal tbody tr').count(),35);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 });
 await check('CSV export preserves records and chart exports support circuit panels and race checkpoint attribution',async()=>{
  await load();await page.getByRole('button',{name:'Data',exact:true}).click();const csvPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download CSV'}).click();const csv=await csvPromise;await csv.saveAs(path.join(out,'visible-data.csv'));const txt=fs.readFileSync(path.join(out,'visible-data.csv'),'utf8');assert(txt.includes('data_source'));assert.equal(txt.split('\r\n').length,5089);await page.keyboard.press('Escape');
  await load('case-33');const pngPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Save chart as PNG'}).click();const png=await pngPromise;assert(png.suggestedFilename().includes('lap-33'));await png.saveAs(path.join(out,'attributed-case-lap-33.png'));assert(fs.statSync(path.join(out,'attributed-case-lap-33.png')).size>10000);
  await load('circuits-both');const circuitPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Save chart as PNG'}).click();const circuit=await circuitPromise;await circuit.saveAs(path.join(out,'circuit-export.png'));assert(fs.statSync(path.join(out,'circuit-export.png')).size>10000);
  await load('recovery-win');const recoveryPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Save chart as PNG'}).click();const recovery=await recoveryPromise;await recovery.saveAs(path.join(out,'recovery-export.png'));assert(fs.statSync(path.join(out,'recovery-export.png')).size>10000);
  await load('circuits-movement');const movePromise=page.waitForEvent('download');await page.getByRole('button',{name:'Save chart as PNG'}).click();const movement=await movePromise;await movement.saveAs(path.join(out,'movement-export.png'));assert(fs.statSync(path.join(out,'movement-export.png')).size>10000);
 });
 await check('mobile opening, charts, selectors and closing have no horizontal overflow',async()=>{
  await page.setViewportSize({width:390,height:844});
  for(const step of ['intro','overview','circuits-both','circuits-movement','recovery-top10','case-33','closing']){
   await load(step);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`mobile overflow ${step}`);await shot(`${step}-390`);

  }
 });
 await check('reduced motion retains all evidence and a zoom-equivalent narrow viewport reflows',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1280,height:720});await load('case-grid');await page.getByRole('button',{name:/LAP 43/}).click();assert.equal(await plot().evaluate(el=>Math.max(...el.data[0].x)),43);
  await page.setViewportSize({width:640,height:360});await load('recovery-win','outcome=win');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await page.evaluate(()=>document.body.scrollHeight>innerHeight));await expect(page.locator('.outcome-result')).toContainText('0.08%');
  await page.emulateMedia({reducedMotion:'no-preference'});
 });
 assert.deepEqual(errors,[],'Browser errors');assert.equal(external.length,0,'External runtime requests');
 fs.writeFileSync(path.join(out,'browser-validation.json'),JSON.stringify({passed:true,revision:'absolute-movement-and-race-control',checks,browserErrors:errors,externalRuntimeRequests:external,viewports:[[1440,900],[1280,720],[390,844]],additionalViewport:[640,360],base},null,2));
 console.log(`Verified ${checks.length} browser checks, no external runtime requests.`);
}catch(error){await shot('failure');fs.writeFileSync(path.join(out,'browser-validation.json'),JSON.stringify({passed:false,checks,error:String(error),browserErrors:errors,externalRuntimeRequests:external},null,2));throw error;}finally{await browser.close();}
