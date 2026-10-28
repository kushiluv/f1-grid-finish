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
async function shot(name){await page.waitForTimeout(320);await page.screenshot({path:path.join(screens,name+'.png'),fullPage:true});}
async function check(name,fn){await fn();checks.push({name,passed:true});console.log('PASS',name);}
const plot=()=>page.locator('.chart-main .js-plotly-plot');
async function fit(step,w,h){
 const d=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s)?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,height:r.height}:null;};const el=document.querySelector('.js-plotly-plot');const a=document.querySelector('.insight-panel');return {body:document.body.scrollHeight,width:document.documentElement.scrollWidth,footer:rect('.app-footer'),chart:rect('.chart-card'),aside:a?{height:a.clientHeight,scroll:a.scrollHeight}:null,plotHeight:el?el._fullLayout._size.h:null,matrix:el&&el._fullLayout.yaxis?.domain[0]===.12?{x:el._fullLayout.xaxis._length,y:el._fullLayout.yaxis._length}:null};});
 assert(d.body<=h+2,`${step} scrolls at ${w}: ${JSON.stringify(d)}`);assert(d.width<=w+1,`${step} horizontal overflow at ${w}`);
 if(d.chart){assert(d.chart.bottom<=d.footer.top+1,`${step} overlaps footer`);assert(d.aside.scroll<=d.aside.height+2,`${step} aside clips or scrolls at ${w}: ${JSON.stringify(d.aside)}`);}
 if(step.startsWith('case'))assert(d.plotHeight>=300,`${step} actual plotting height ${d.plotHeight} at ${w}`);
 if(d.matrix){assert(Math.abs(d.matrix.x/d.matrix.y-1)<.03,`non-square matrix ${JSON.stringify(d.matrix)}`);assert(d.matrix.y>=(w===1280?300:380),`matrix too small ${d.matrix.y}`);}
}
const steps=['intro','overview','circuits-field','circuits-both','recovery-top10','recovery-win','recovery-back','case-grid','case-11','case-33','case-43','case-69','closing'];
try{
 await check('root opens the context and reveals the canonical historical first-start rate',async()=>{
  await page.goto(base);await ready();await expect(page.locator('.opening-stage')).toBeVisible();await expect(page.getByRole('button',{name:'Reveal the history'})).toBeDisabled();
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
 await check('the circuit reveal preserves scales, aligns rows and visibly highlights both measures',async()=>{
  await load('circuits-field');assert.equal(await plot().evaluate(el=>el.data.length),1);await expect(page.locator('.circuit-pair')).not.toContainText('wins from first');
  await page.locator('.circuit-pair button').nth(1).click();await page.getByRole('button',{name:'Show wins from first',exact:true}).click();
  const d=await plot().evaluate(el=>({count:el.data.length,ys:el.data.map(t=>t.y),sizes:el.data.map(t=>t.marker.size),r:el.layout.xaxis.range,p:el.layout.xaxis2.range}));
  assert.equal(d.count,2);assert.deepEqual(d.ys[0],d.ys[1]);assert(d.sizes.every(s=>s[1]>s[0]));assert.equal(d.r[0],-1);assert.equal(d.r[1],1.13);assert.equal(d.p[1],1.16);
  await expect(page.locator('.circuit-pair')).toContainText('11/12 wins from first');
 });
 await check('the recovery reveal preserves the denominator and 0–100 scale, including rare positive rates',async()=>{
  await load('recovery-top10');await expect(page.locator('.outcome-result')).toContainText('402 of 1,238');await expect(page.locator('.outcome-result')).toContainText('32.5%');
  await page.getByRole('button',{name:'Win',exact:true}).click();await expect(page.locator('.outcome-result')).toContainText('2 of 1,238');await expect(page.locator('.outcome-result')).toContainText('0.16%');
  assert.deepEqual(await plot().evaluate(el=>el.layout.xaxis.range),[0,100]);await expect(page.locator('.goal-comparison')).toContainText('402');
  await page.getByRole('button',{name:'What about farther back?',exact:true}).click();await expect(page.locator('.outcome-result')).toContainText('1 of 1,185');await expect(page.locator('.outcome-result')).toContainText('0.08%');
  await page.getByRole('button',{name:'Follow that race',exact:true}).click();await expect(page.locator('.race-position-list')).toContainText('P17');await expect(page.locator('.scope-block')).toContainText('starting grid');
 });
 await check('recovery value blocks do not collide at projector size and row pitch remains readable',async()=>{
  await page.setViewportSize({width:1280,height:720});await load('recovery-win');
  const d=await plot().evaluate(el=>({pitch:el._fullLayout.yaxis._length/5.2,rects:[...el.querySelectorAll('.annotation')].filter(g=>!g.textContent.includes('RESULTS / STARTS')).map(g=>{const r=g.querySelector('.annotation-text').getBoundingClientRect();return {top:r.top,bottom:r.bottom};}).sort((a,b)=>a.top-b.top)}));
  assert(d.pitch>=48,`row pitch ${d.pitch}`);assert.equal(d.rects.length,10);for(let i=1;i<d.rects.length;i++)assert(d.rects[i].top>=d.rects[i-1].bottom+2,'rate/count labels collide');
  await page.setViewportSize({width:1440,height:900});
 });
 await check('the rare-rate marker selects its own group without enlarging the data value',async()=>{
  await load('recovery-win');
  const d=await plot().evaluate(el=>({bar:el.data[0].x[4],dot:el.data[1].x[4],detail:el.data[1].customdata[4]}));
  assert(Math.abs(d.bar-100/1185)<1e-12);assert.equal(d.dot,d.bar);assert.equal(d.detail[0],4);
  await plot().evaluate(el=>el.emit('plotly_click',{points:[{curveNumber:1,x:el.data[1].x[4],y:4,customdata:el.data[1].customdata[4]}]}));
  await expect(page.locator('.outcome-result')).toContainText('1 of 1,185');
 });
 await check('circuit values and headers stay inside the chart without overlapping at presentation and mobile sizes',async()=>{
  for(const [w,h] of [[1920,1080],[1280,720],[390,844]]){
   await page.setViewportSize({width:w,height:h});await load('circuits-both');
   for(const metric of w===390?['The field','The winner']:['both']){
    if(metric!=='both')await page.getByRole('button',{name:metric,exact:true}).click();
    const rects=await plot().evaluate(el=>[...el.querySelectorAll('.annotation-text')].map(t=>{const r=t.getBoundingClientRect();const c=el.closest('.chart-card').getBoundingClientRect();return {text:t.textContent,left:r.left-c.left,right:r.right-c.left,top:r.top-c.top,bottom:r.bottom-c.top,width:c.width,height:c.height};}));
    for(const r of rects)assert(r.left>=0&&r.right<=r.width&&r.top>=0&&r.bottom<=r.height,`clipped annotation at ${w}: ${JSON.stringify(r)}`);
    for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];assert(!(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom),`overlapping circuit values at ${w}: ${a.text}, ${b.text}`);}
   }
  }
  await page.setViewportSize({width:1440,height:900});
 });
 await check('race checkpoints contain only observed positions revealed so far and no future-result text',async()=>{
  const expected={0:[17,1,4],11:[6,2,4],33:[2,4,1],43:[1,7,2],69:[1,6,2]};
  for(const lap of [0,11,33,43,69]){
   await load(lap===0?'case-grid':`case-${lap}`);
   const d=await plot().evaluate(el=>el.data.slice(0,3).map(t=>({xs:t.x,ys:t.y})));
   d.forEach((t,i)=>{assert.equal(Math.max(...t.xs),lap);assert.equal(t.ys.at(-1),expected[lap][i]);assert.equal(t.xs.length,lap+1);});
   const text=await page.locator('main').innerText();if(lap<69){assert(!text.includes('finished sixth'));assert(!text.includes('17th to first.'));}
   await expect(page.locator('.race-position-list').locator('div').nth(0)).toContainText(`P${expected[lap][0]}`);
  }
 });
 await check('checkpoint navigation, Back, direct links and keyboard arrows agree',async()=>{
  await load('case-33');await page.getByRole('button',{name:'Previous story step'}).click();await expect(page.locator('.scope-block')).toContainText('lap 11');
  await page.locator('h1').click();await page.keyboard.press('ArrowRight');await expect(page.locator('.scope-block')).toContainText('lap 33');
  await page.reload();await ready();await expect(page.locator('.scope-block')).toContainText('lap 33');
  await page.getByLabel('Lap 33 / 69').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('.scope-block')).toContainText('lap 34');
  await page.getByRole('button',{name:'Show full race'}).click();await expect(page.locator('.race-position-list')).toContainText('P6');
  await page.getByRole('button',{name:'The takeaway',exact:true}).click();await expect(page.locator('.closing-stage')).toBeVisible();await page.getByRole('button',{name:'Explore the evidence',exact:true}).click();await expect(page.getByRole('button',{name:'Hide filters'})).toBeVisible();
 });
 await check('highlighting, cohort filtering and shared Explore URLs retain distinct meanings',async()=>{
  await explore();await page.getByRole('button',{name:'Edit selection'}).click();
  await page.getByLabel('Highlight driver without filtering').selectOption('max-verstappen');await expect(page.locator('.scope-block')).toContainText('4,920 grid starts');
  await page.getByLabel('Filter cohort by driver').selectOption('max-verstappen');await expect(page.locator('.scope-block')).not.toContainText('4,920 grid starts');
  const scope=await page.locator('.scope-block>span').innerText();await page.reload();await ready();await expect(page.locator('.scope-block>span')).toHaveText(scope);assert(new URL(page.url()).searchParams.get('highlight')==='max-verstappen');
 });
 await check('filtered cohorts do not inherit default story claims or unsupported uncertainty',async()=>{
  await explore('recovery','years=2022,2023&outcome=win&band=4');await expect(page.locator('.bridge-note')).toHaveCount(0);await expect(page.locator('h1')).not.toContainText('One win');
  await explore('circuits','years=2024,2024&circuits=monaco,yas-marina,monza,spa-francorchamps');await expect(page.locator('.chart-controls')).toContainText('point estimates only');assert((await plot().evaluate(el=>el.data[0].error_x.array)).every(n=>n===0));
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
 });
 await check('mobile opening, charts, selectors and closing have no horizontal overflow',async()=>{
  await page.setViewportSize({width:390,height:844});
  for(const step of ['intro','overview','circuits-both','recovery-win','case-33','closing']){
   await load(step);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`mobile overflow ${step}`);await shot(`${step}-390`);
   if(step==='circuits-both'){await page.getByRole('button',{name:'The field',exact:true}).click();await page.getByRole('button',{name:'The winner',exact:true}).click();}
  }
 });
 await check('reduced motion retains all evidence and a zoom-equivalent narrow viewport reflows',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1280,height:720});await load('case-grid');await page.getByRole('button',{name:/LAP 43/}).click();assert.equal(await plot().evaluate(el=>Math.max(...el.data[0].x)),43);
  await page.setViewportSize({width:640,height:360});await load('recovery-win');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await page.evaluate(()=>document.body.scrollHeight>innerHeight));await expect(page.locator('.outcome-result')).toContainText('0.16%');
  await page.emulateMedia({reducedMotion:'no-preference'});
 });
 assert.deepEqual(errors,[],'Browser errors');assert.equal(external.length,0,'External runtime requests');
 fs.writeFileSync(path.join(out,'browser-validation.json'),JSON.stringify({passed:true,revision:'chart-clarity-refinement',checks,browserErrors:errors,externalRuntimeRequests:external,viewports:[[1440,900],[1280,720],[390,844]],additionalViewport:[640,360],base},null,2));
 console.log(`Verified ${checks.length} browser checks, no external runtime requests.`);
}catch(error){await shot('failure');fs.writeFileSync(path.join(out,'browser-validation.json'),JSON.stringify({passed:false,checks,error:String(error),browserErrors:errors,externalRuntimeRequests:external},null,2));throw error;}finally{await browser.close();}
