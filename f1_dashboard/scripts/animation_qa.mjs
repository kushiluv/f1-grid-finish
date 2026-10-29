import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.F1_DASHBOARD_URL||'http://127.0.0.1:5181/';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await b.newPage({viewport:{width:1280,height:720},acceptDownloads:true}),checks=[],errors=[];
p.on('pageerror',e=>errors.push(e.message));fs.mkdirSync('artifacts/animations',{recursive:true});
async function load(step){await p.goto(base+'?step='+step);await p.locator('.js-plotly-plot').waitFor();await p.waitForTimeout(200);}
async function check(name,f){await f();checks.push(name);console.log('PASS',name);}
const plot=()=>p.locator('.js-plotly-plot');
try{
 await check('recovery draws top ten on entry, then cumulatively reveals podium and win with Next',async()=>{
  await load('recovery-top10');const original=await plot().evaluate(e=>e.data.map(t=>t.x));
  await expect(p.getByRole('button',{name:'Animate podium',exact:true})).toBeDisabled();
  await expect(p.getByRole('button',{name:'Win',exact:true})).toBeDisabled();
  await expect(p.locator('.bridge-note')).toHaveCount(0);
  for(const [j,name] of ['top ten','podium','win'].entries()){
   if(j)await p.getByRole('button',{name:j===1?'Reveal podium':'Reveal wins',exact:true}).click();
   await expect(p.locator('.recovery-interactive')).toHaveAttribute('data-animating','true');
   const running=await p.locator('.recovery-interactive').evaluate(e=>e.getAnimations({subtree:true}).map(a=>({duration:a.effect.getTiming().duration,delay:a.effect.getTiming().delay,frames:a.effect.getKeyframes()})));
   assert(running.length>=10,JSON.stringify(running));assert(running.some(a=>a.frames.some(f=>f.strokeDashoffset!==undefined)),'no line drawing');
   assert.deepEqual(await plot().evaluate(e=>e.data.map(t=>t.x)),original);
   assert.deepEqual(await plot().evaluate(e=>e.data.map(t=>t.visible)),[0,1,2].map(i=>i<=j));
   assert.equal(await p.locator('.scatterlayer .trace').count(),j+1);
   assert.equal(await p.locator('.annotation').count(),(j+1)*5);
   await p.screenshot({path:`artifacts/animations/recovery-${name.replaceAll(' ','-')}-drawing.png`});
   await expect(p.locator('.recovery-interactive')).not.toHaveAttribute('data-animating','true');
   await expect(p.getByRole('button',{name:'Animate '+name,exact:true})).toHaveAttribute('aria-pressed','true');
   assert.equal(await plot().evaluate((e,i)=>e.data[i].marker.color,j),['#087F8C','#7152A3','#AD650C'][j]);
   await p.screenshot({path:`artifacts/animations/recovery-${name.replaceAll(' ','-')}-revealed.png`,fullPage:true});
  }
  await expect(p.locator('.bridge-note')).toContainText('One win from the back.');
  await p.getByRole('button',{name:'Animate win',exact:true}).click();await expect(p.locator('.recovery-interactive')).toHaveAttribute('data-animating','true');
  await p.getByRole('button',{name:'Animate podium',exact:true}).click();await expect(p.getByRole('button',{name:'Animate podium',exact:true})).toHaveAttribute('aria-pressed','true');
  await p.waitForTimeout(1250);assert.equal(await p.locator('.recovery-interactive').evaluate(e=>e.getAnimations({subtree:true}).length),0);
  await p.screenshot({path:'artifacts/animations/recovery-complete-1280.png',fullPage:true});
 });
 await check('Back hides later outcomes, links preserve the reveal, and Explore keeps all outcomes available',async()=>{
  await load('recovery-win');await p.getByLabel('Starting group · back to front').selectOption('3');
  await p.getByRole('button',{name:'Previous story step'}).click();
  assert.equal(new URL(p.url()).searchParams.get('step'),'recovery-podium');
  await expect(p.getByLabel('Starting group · back to front')).toHaveValue('3');
  await expect(p.getByRole('button',{name:'Animate win',exact:true})).toBeDisabled();
  assert.deepEqual(await plot().evaluate(e=>e.data.map(t=>t.visible)),[true,true,false]);
  await p.reload();await p.locator('.js-plotly-plot').waitFor();await expect(p.locator('.outcome-result')).toContainText('P11–15 → PODIUM');
  await p.getByRole('button',{name:'Previous story step'}).click();assert.deepEqual(await plot().evaluate(e=>e.data.map(t=>t.visible)),[true,false,false]);
  await p.getByRole('button',{name:'Reveal podium',exact:true}).click();await p.getByRole('button',{name:'Reveal wins',exact:true}).click();
  await expect(p.locator('.outcome-result')).toContainText('2 of 1,238');
  await p.getByRole('button',{name:'Compare the circuits',exact:true}).click();await expect(p.locator('h1')).toContainText('by circuit');
  await p.goto(base+'?mode=explore&chapter=recovery');await p.locator('.js-plotly-plot').waitFor();
  assert.deepEqual(await plot().evaluate(e=>e.data.map(t=>t.visible)),[true,true,true]);
  await expect(p.getByRole('button',{name:'Animate win',exact:true})).toBeEnabled();
 });
 await check('circuit pole panel begins hidden and the reveal animates while preserving the first panel',async()=>{
  await load('circuits-field');assert.equal(await plot().evaluate(e=>e.data.length),1);
  await expect(p.locator('.circuit-detail')).not.toContainText('Wins from pole position');await expect(p.locator('.circuit-detail')).not.toContainText('60.0%');
  const left=await plot().evaluate(e=>({data:e.data[0].x,range:e.layout.xaxis.range}));
  await p.screenshot({path:'artifacts/animations/circuits-hidden-1280.png',fullPage:true});
  await p.getByRole('button',{name:'Reveal pole comparison',exact:true}).click();await expect(p.locator('.circuit-scroll')).toHaveAttribute('data-animating','true');
  assert.equal(await plot().evaluate(e=>e.data.length),2);assert.deepEqual(await plot().evaluate(e=>({data:e.data[0].x,range:e.layout.xaxis.range})),left);
  assert(await p.locator('.circuit-scroll').evaluate(e=>e.getAnimations({subtree:true}).some(a=>a.effect.getKeyframes().some(k=>k.clipPath))));
  await p.screenshot({path:'artifacts/animations/circuits-revealing.png',fullPage:true});
  await expect(p.locator('.circuit-scroll')).not.toHaveAttribute('data-animating','true');await expect(p.locator('.circuit-detail')).toContainText('60.0%');
  await p.reload();await expect(p.locator('.circuit-question')).toHaveCount(0);assert.equal(await plot().evaluate(e=>e.data.length),2);
  await p.getByRole('button',{name:'Previous story step'}).click();await expect(p.locator('.circuit-question')).toBeVisible();
  await p.getByRole('button',{name:'Reveal wins from pole',exact:true}).click();await expect(p.locator('.circuit-scroll')).toHaveAttribute('data-animating','true');
 });
 await check('absolute circuit movement animates without changing the paired view or its selected circuit',async()=>{
  await load('circuits-movement');await expect(p.locator('.movement-view')).toHaveAttribute('data-animating','true');
  const d=await plot().evaluate(e=>({values:e.data[0].x,ids:e.data[0].customdata.map(d=>d[0]),range:e.layout.xaxis.range}));
  assert.deepEqual(d.ids,['monaco','yas-marina','interlagos','sochi','hungaroring']);
  [1.31,1.52,1.95,2.16,2.38].forEach((v,i)=>assert(Math.abs(d.values[i]-v)<.005));assert.deepEqual(d.range,[0,3]);
  assert.equal(await p.locator('.barlayer .point').count(),5);
  assert(await p.locator('.movement-view').evaluate(e=>e.getAnimations({subtree:true}).some(a=>a.effect.getKeyframes().some(k=>k.clipPath))));
  await expect(p.locator('.movement-view')).not.toHaveAttribute('data-animating','true');
  await p.getByLabel('Circuit detail').selectOption('interlagos');await expect(p.locator('.circuit-detail')).toContainText('1.95');
  await p.getByRole('button',{name:'Order & pole wins',exact:true}).click();assert.equal(await plot().evaluate(e=>e.data.length),2);await expect(p.getByLabel('Circuit detail')).toHaveValue('interlagos');
  await p.getByRole('button',{name:'Compare position change',exact:true}).click();await expect(p.locator('.movement-view')).toHaveAttribute('data-animating','true');
  await p.reload();await p.locator('.movement-view .js-plotly-plot').waitFor();assert.equal(new URL(p.url()).searchParams.get('step'),'circuits-movement');
  await p.goto(base+'?mode=explore&chapter=circuits&metric=movement');await p.locator('.movement-view .js-plotly-plot').waitFor();await expect(p.getByRole('button',{name:'Position change · P1–10',exact:true})).toHaveAttribute('aria-pressed','true');
 });
 await check('race-control context and shaded periods reveal only reached milestones and scrub backwards',async()=>{
  await load('case-69');
  for(const [lap,label] of [[0,'WET RACE'],[11,'WET RACE'],[28,'VSC'],[30,'SAFETY CAR'],[32,'RED FLAG'],[33,'RESTART ORDER'],[39,'SAFETY CAR'],[43,'RACING RESUMES'],[69,'FINISH']]){
   await p.locator('#lap-scrubber').fill(String(lap));await expect(p.locator('.control-badge')).toHaveText(label);
   await expect.poll(()=>plot().evaluate(e=>Math.max(...e.data[0].x))).toBe(lap);
   const shapes=await plot().evaluate(e=>e.layout.shapes.filter(s=>s.name?.startsWith('control-')));
   assert(shapes.every(s=>s.x0<=lap&&s.x1<=lap),JSON.stringify({lap,shapes}));
   const expected=[28,30,32,39].filter(n=>n<=lap);assert.deepEqual(shapes.map(s=>s.x0),expected);
  }
  await p.locator('#lap-scrubber').fill('11');await expect(p.locator('.control-badge')).toHaveText('WET RACE');
  await expect.poll(()=>plot().evaluate(e=>e.layout.shapes.filter(s=>s.name?.startsWith('control-')).length)).toBe(0);
  await p.locator('#lap-scrubber').fill('32');await expect(p.locator('.race-control-note')).toContainText('Colapinto');await p.reload();await expect(p.locator('.control-badge')).toHaveText('RED FLAG');
  await p.getByRole('button',{name:'Play race',exact:true}).click();await expect(p.locator('.control-badge')).toHaveText('RESTART ORDER',{timeout:5000});await p.getByRole('button',{name:'Pause race',exact:true}).click();
 });
 await check('reduced motion shows complete evidence immediately and cancels an active replay',async()=>{
  await load('recovery-win');await p.getByRole('button',{name:'Animate win',exact:true}).click();await expect(p.locator('.recovery-interactive')).toHaveAttribute('data-animating','true');
  await p.emulateMedia({reducedMotion:'reduce'});await expect(p.locator('.recovery-interactive')).not.toHaveAttribute('data-animating','true');
  await p.getByRole('button',{name:'Animate podium',exact:true}).click();await p.waitForTimeout(80);assert.equal(await p.locator('.recovery-interactive').evaluate(e=>e.getAnimations({subtree:true}).length),0);
  await load('circuits-field');await p.getByRole('button',{name:'Reveal pole comparison',exact:true}).click();await expect(p.locator('.circuit-detail')).toContainText('60.0%');assert.equal(await p.locator('.circuit-scroll').evaluate(e=>e.getAnimations({subtree:true}).length),0);
  await p.emulateMedia({reducedMotion:'no-preference'});
 });
 await check('mobile legends remain keyboard accessible and reveal the winner panel',async()=>{
  await p.setViewportSize({width:390,height:844});await load('recovery-top10');await p.getByRole('button',{name:'Reveal podium',exact:true}).click();await p.getByRole('button',{name:'Reveal wins',exact:true}).click();await p.getByRole('button',{name:'Animate win',exact:true}).focus();await p.keyboard.press('Enter');await expect(p.locator('.recovery-interactive')).toHaveAttribute('data-animating','true');
  await p.waitForTimeout(1200);await p.screenshot({path:'artifacts/animations/recovery-complete-390.png',fullPage:true});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await load('circuits-field');await p.getByRole('button',{name:'Reveal pole comparison',exact:true}).click();await expect(p.getByRole('button',{name:'The winner',exact:true})).toHaveAttribute('aria-pressed','true');
  await p.waitForTimeout(1000);assert.equal(await plot().evaluate(e=>e.data[0].x[0]),.6);await p.screenshot({path:'artifacts/animations/circuits-revealed-390.png',fullPage:true});
 });
 assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/animation-validation.json',JSON.stringify({passed:true,checks,errors},null,2));
}catch(e){await p.screenshot({path:'artifacts/animations/failure.png',fullPage:true});fs.writeFileSync('artifacts/animation-validation.json',JSON.stringify({passed:false,checks,error:String(e),errors},null,2));throw e;}finally{await b.close();}
