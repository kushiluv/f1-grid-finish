import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const base=process.env.F1_DASHBOARD_URL||'http://127.0.0.1:5182/';
const browser=await chromium.launch({executablePath:process.env.F1_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),checks=[],errors=[],external=[];
fs.mkdirSync('artifacts/opening',{recursive:true});
await context.route('**/*',async route=>{const u=new URL(route.request().url());if(['http:','https:'].includes(u.protocol)&&!['127.0.0.1','localhost'].includes(u.hostname)){external.push(u.href);await route.abort();}else await route.continue();});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
async function load(){await page.goto(base+'?step=intro');await page.locator('.opening-backdrop').waitFor();await expect(page.locator('.opening-f1-logo')).toBeVisible();}
async function check(name,fn){await fn();checks.push(name);console.log('PASS',name);}
try{
 await check('decorative F1 scene preserves the opening text, logo, grid and estimate choices',async()=>{
  await load();await expect(page.locator('h1')).toHaveText('How does starting position relate to the finishing result?');
  await expect(page.getByRole('img',{name:'A simplified Formula 1 starting grid'})).toBeVisible();await expect(page.getByRole('img',{name:'Formula 1',exact:true})).toBeVisible();
  assert.equal(await page.locator('.gantry-pod').count(),5);assert.equal(await page.locator('.gantry-pod i').count(),10);
  assert.equal(await page.locator('.opening-backdrop').getAttribute('aria-hidden'),'true');
  assert.equal(await page.locator('.opening-backdrop').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  assert.equal(await page.locator('.opening-backdrop button,.opening-backdrop [tabindex]').count(),0);
  assert(await page.locator('.opening-backdrop').evaluate(e=>e.getAnimations({subtree:true}).every(a=>a.effect.getTiming().iterations===1)));
 });
 await check('opening fits desktop, projector and phone widths without horizontal overflow',async()=>{
  for(const [w,h] of [[1280,720],[1440,900],[1920,1080],[390,844],[320,700]]){
   await page.setViewportSize({width:w,height:h});await load();await page.waitForTimeout(1750);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${w} horizontal overflow`);
   if(w>=1100)assert(await page.evaluate(()=>document.body.scrollHeight<=innerHeight+2),`${w} vertical overflow`);
   await expect(page.getByRole('button',{name:'Reveal the history',exact:true})).toBeDisabled();
   await page.screenshot({path:`artifacts/opening/intro-${w}.png`,fullPage:true});
  }
 });
 await check('background never blocks a choice or reveal and the gantry dims on the numerical result',async()=>{
  await page.setViewportSize({width:1280,height:720});await load();
  for(const n of [25,50,75]){const button=page.getByRole('button',{name:n+'%',exact:true});await button.click();await expect(button).toHaveAttribute('aria-pressed','true');}
  await page.getByRole('button',{name:'Reveal the history',exact:true}).click();await expect(page.locator('.prediction.revealed')).toContainText('53.6%');await expect(page.locator('.prediction.revealed')).toContainText('134 wins from 250');
  await expect(page.locator('.intro-start-gantry')).toHaveClass(/lights-out/);await page.waitForTimeout(900);
  assert((await page.locator('.gantry-pod i').first().evaluate(e=>getComputedStyle(e).filter)).includes('brightness(0.22)'));
  await page.screenshot({path:'artifacts/opening/reveal-1280.png',fullPage:true});
  await page.getByRole('button',{name:'Explore the pattern',exact:true}).click();await expect(page.locator('.opening-backdrop')).toHaveCount(0);await expect(page.locator('h1')).toContainText('Correlation');
 });
 await check('phone choices and keyboard controls remain usable over the background',async()=>{
  await page.setViewportSize({width:390,height:844});await load();const button=page.getByRole('button',{name:'50%',exact:true});await button.focus();await page.keyboard.press('Enter');await expect(button).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Reveal the history',exact:true}).click();await expect(page.locator('.prediction.revealed')).toContainText('53.6%');await page.waitForTimeout(900);await page.screenshot({path:'artifacts/opening/reveal-390.png',fullPage:true});
 });
 await check('reduced motion gives a static scene and preserves the complete reveal',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1280,height:720});await load();
  assert.equal(await page.locator('.opening-backdrop').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
  assert.equal(await page.locator('.intro-track-trail').evaluate(e=>getComputedStyle(e).opacity),'0');
  await page.getByRole('button',{name:'25%',exact:true}).click();await page.getByRole('button',{name:'Reveal the history',exact:true}).click();await expect(page.locator('.prediction.revealed')).toContainText('53.6%');
  assert.equal(await page.locator('.opening-stage').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
 });
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={passed:true,checks,browserErrors:errors,externalRuntimeRequests:external,viewports:[[1280,720],[1440,900],[1920,1080],[390,844],[320,700]],built_index_sha256:crypto.createHash('sha256').update(fs.readFileSync('dist/index.html')).digest('hex')};
 fs.writeFileSync('artifacts/opening-validation.json',JSON.stringify(report,null,2));
}catch(e){await page.screenshot({path:'artifacts/opening/failure.png',fullPage:true});fs.writeFileSync('artifacts/opening-validation.json',JSON.stringify({passed:false,checks,error:String(e),browserErrors:errors},null,2));throw e;}finally{await browser.close();}
