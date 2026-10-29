import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base=process.env.F1_DASHBOARD_URL||'http://127.0.0.1:5182/';
const out=path.resolve('artifacts'),checks=[],errors=[],external=[];
const browser=await chromium.launch({executablePath:process.env.F1_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:720},acceptDownloads:true});
await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(['http:','https:'].includes(u.protocol)&&!['localhost','127.0.0.1'].includes(u.hostname)){external.push(u.href);await route.abort();}
  else await route.continue();
});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
async function load(step){await page.goto(base+'?step='+step);await page.locator('h1').waitFor();await page.waitForTimeout(300);}
async function check(name,fn){await fn();checks.push(name);console.log('PASS',name);}
const plot=()=>page.locator('.chart-main .js-plotly-plot');
try{
  await check('production opening uses the local F1 logo and fits a 320px phone',async()=>{
    await page.setViewportSize({width:320,height:700});await load('intro');
    assert(await page.locator('.opening-f1-logo').evaluate(el=>el.complete&&el.naturalWidth>0));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await expect(page.locator('.topbar')).not.toContainText('A HEAD START');
    await page.setViewportSize({width:1280,height:720});
  });
  await check('production race plays every lap to completion and shows the verified car endpoints',async()=>{
    await load('case-grid');await page.getByLabel('Playback speed').selectOption('2');
    await page.getByRole('button',{name:'Play race',exact:true}).click();
    await expect(page.locator('#lap-scrubber')).toHaveValue('69',{timeout:60000});
    await expect(page.getByRole('button',{name:'Play race',exact:true})).toBeVisible();
    const d=await plot().evaluate(el=>({lengths:el.data.map(t=>t.x.length),cars:el.layout.images.map(i=>[i.x,i.y])}));
    assert.deepEqual(d.lengths,[70,70,70]);assert.deepEqual(d.cars,[[69,1],[69,6],[69,2]]);
    await expect(page.locator('.race-position-list')).toContainText('16 places gained');
    await expect(page.locator('.race-position-list')).toContainText('5 places lost');
    const fit=await page.locator('.insight-panel').evaluate(el=>el.scrollHeight<=el.clientHeight+2);assert(fit);
    await page.screenshot({path:path.join(out,'screenshots/case-69-1280.png'),fullPage:true});
  });
  await check('production recovery export preserves all three outcomes and explains overlap',async()=>{
    await load('recovery-top10');assert.deepEqual(await plot().evaluate(e=>e.data.map(t=>t.visible)),[true,false,false]);
    const partial=page.waitForEvent('download');await page.getByRole('button',{name:'Save chart as PNG'}).click();await (await partial).saveAs(path.join(out,'recovery-top-ten-export.png'));
    await page.getByRole('button',{name:'Reveal podium',exact:true}).click();await page.getByRole('button',{name:'Reveal wins',exact:true}).click();assert.deepEqual(await plot().evaluate(e=>e.data.map(t=>t.visible)),[true,true,true]);
    const download=page.waitForEvent('download');
    await page.getByRole('button',{name:'Save chart as PNG'}).click();
    const file=await download;await file.saveAs(path.join(out,'recovery-export.png'));
    assert(fs.statSync(path.join(out,'recovery-export.png')).size>10000);
    await expect(page.locator('.outcome-result')).toContainText('1 of 1,185');
    assert.equal(await plot().evaluate(el=>el.data.length),3);
  });
  await check('production race export retains car illustrations at the selected lap',async()=>{
    await load('case-33');const download=page.waitForEvent('download');
    await page.getByRole('button',{name:'Save chart as PNG'}).click();
    const file=await download;assert(file.suggestedFilename().includes('lap-33'));
    await file.saveAs(path.join(out,'attributed-case-lap-33.png'));
    const cars=await plot().evaluate(el=>el.layout.images);assert.equal(cars.length,3);assert(cars.every(c=>c.x===33&&c.source.startsWith('data:image/svg+xml')));
    await expect(page.locator('.race-position-list')).toContainText('3 places lost');
    await page.screenshot({path:path.join(out,'screenshots/case-33-1280.png'),fullPage:true});
  });
  await check('production circuit movement and impact controls use the revised data definitions',async()=>{
    await load('circuits-movement');assert.deepEqual(await plot().evaluate(el=>el.data[0].customdata.map(r=>r[0])),['monaco','yas-marina','interlagos','sochi','hungaroring']);
    assert((await plot().evaluate(el=>el.data[0].x)).every(v=>v>=0));
    await page.getByLabel('Circuit detail').selectOption('interlagos');await expect(page.locator('.circuit-detail')).toContainText('1.95');
    await load('closing');assert.equal(await page.locator('.closing-stage select,.closing-stage input').count(),0);
    await expect(page.locator('.strategy-decision')).toContainText('167 of 1,185 starts');await expect(page.locator('.forecast-decision')).toContainText('6 of 10');await expect(page.locator('.forecast-decision')).toContainText('11 of 12');
  });
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  fs.writeFileSync(path.join(out,'story-production-validation.json'),JSON.stringify({passed:true,revision:'absolute-movement-and-race-control',checks,production_url:base,browserErrors:errors,externalRuntimeRequests:external},null,2));
}catch(e){fs.writeFileSync(path.join(out,'story-production-validation.json'),JSON.stringify({passed:false,checks,error:String(e),browserErrors:errors,externalRuntimeRequests:external},null,2));throw e;}
finally{await browser.close();}
