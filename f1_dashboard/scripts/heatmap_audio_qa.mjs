import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const base=process.env.F1_DASHBOARD_URL||'http://127.0.0.1:5183/';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
fs.mkdirSync('artifacts/heatmap-audio',{recursive:true});
const plot=()=>page.locator('.js-plotly-plot');
async function load(step){await page.goto(base+'?step='+step);await plot().waitFor();}
async function check(name,fn){await fn();checks.push(name);console.log('PASS',name);}
try{
 await check('heat-map hover previews animate the correct triangle without changing probabilities',async()=>{
  await load('overview');
  const original=await plot().evaluate(e=>e.data.slice(0,2).map(t=>({z:t.z,customdata:t.customdata})));
  await page.getByRole('button',{name:'↗ Gained places',exact:true}).hover();
  await expect(page.locator('.heatmap-explorer')).toHaveAttribute('data-lens','gained');
  await expect(page.locator('.heatmap-explorer')).toHaveAttribute('data-animating','true');
  assert(await page.locator('.heatmap-explorer').evaluate(e=>e.getAnimations({subtree:true}).length)>0);
  assert.deepEqual(await plot().evaluate(e=>e.data.slice(0,2).map(t=>({z:t.z,customdata:t.customdata}))),original);
  const mask=await plot().evaluate(e=>e.data.find(t=>t.opacity===.94).z);
  assert.equal(mask[0][1],null);assert.equal(mask[1][0],1);
  await page.locator('h1').hover();await expect(page.locator('.heatmap-explorer')).toHaveAttribute('data-lens','all');
  await page.getByRole('button',{name:'↗ Gained places',exact:true}).click();await page.locator('h1').hover();
  await expect(page.locator('.heatmap-explorer')).toHaveAttribute('data-lens','gained');
  await page.getByRole('button',{name:'↙ Lost places',exact:true}).hover();await expect(page.locator('.heatmap-explorer')).toHaveAttribute('data-lens','lost');
  await page.locator('h1').hover();await expect(page.locator('.heatmap-explorer')).toHaveAttribute('data-lens','gained');
  await page.getByRole('button',{name:'↗ Gained places',exact:true}).click();await expect(page.locator('.heatmap-explorer')).toHaveAttribute('data-lens','all');
  await page.getByRole('button',{name:'Same position',exact:true}).focus();await expect(page.locator('.heatmap-explorer')).toHaveAttribute('data-lens','same');
  await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'Same position',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.waitForTimeout(600);await page.screenshot({path:'artifacts/heatmap-audio/heatmap.png',fullPage:true});
 });
 await check('reduced motion preserves heat-map focus with no reveal animation',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'↙ Lost places',exact:true}).hover();
  await expect(page.locator('.heatmap-explorer')).toHaveAttribute('data-lens','lost');
  assert.equal(await page.locator('.heatmap-explorer').evaluate(e=>e.getAnimations({subtree:true}).length),0);
  await page.emulateMedia({reducedMotion:'no-preference'});
 });
 await check('2× default and audio cue at the lap-43 lead change, with pause and mute',async()=>{
  await load('case-grid');await expect(page.getByLabel('Playback speed')).toHaveValue('2');
  const audio=page.locator('audio');
  await expect.poll(()=>audio.evaluate(a=>a.readyState)).toBeGreaterThanOrEqual(2);
  assert.equal(await audio.evaluate(a=>a.paused),true);
  assert((await audio.evaluate(a=>a.duration))>7);
  await page.locator('#lap-scrubber').fill('42');await page.getByRole('button',{name:'Play race',exact:true}).click();
  await expect.poll(async()=>Number(await page.locator('#lap-scrubber').inputValue())).toBeGreaterThanOrEqual(43);
  await expect.poll(()=>audio.evaluate(a=>a.currentTime)).toBeGreaterThan(.05);
  assert.equal(await audio.evaluate(a=>a.muted),false);
  await page.getByRole('button',{name:'Pause race',exact:true}).click();
  await expect.poll(()=>audio.evaluate(a=>a.paused)).toBe(true);
  const pausedAt=await audio.evaluate(a=>a.currentTime);await page.waitForTimeout(200);
  assert(Math.abs(await audio.evaluate(a=>a.currentTime)-pausedAt)<.05);
  await page.getByRole('button',{name:'Mute race audio',exact:true}).click();assert.equal(await audio.evaluate(a=>a.muted),true);
  await page.getByRole('button',{name:'Play race',exact:true}).click();await expect.poll(()=>audio.evaluate(a=>a.paused)).toBe(false);
  await page.getByRole('button',{name:'Unmute race audio',exact:true}).click();assert.equal(await audio.evaluate(a=>a.muted),false);
  await page.getByRole('button',{name:'Pause race',exact:true}).click();
  await page.locator('#lap-scrubber').fill('42');assert.equal(await audio.evaluate(a=>a.currentTime),0);
  await page.getByRole('button',{name:'Play race',exact:true}).click();await expect.poll(()=>audio.evaluate(a=>a.currentTime)).toBeGreaterThan(.05);
  await page.getByRole('button',{name:'Pause race',exact:true}).click();
  await page.screenshot({path:'artifacts/heatmap-audio/race.png',fullPage:true});
 });
 await check('mute persists, loading the finish is silent, and the replay keeps the original ending',async()=>{
  await page.getByRole('button',{name:'Mute race audio',exact:true}).click();
  await load('case-69');await expect(page.getByRole('button',{name:'Unmute race audio',exact:true})).toHaveAttribute('aria-pressed','true');
  assert.equal(await page.locator('audio').evaluate(a=>a.paused&&a.muted),true);
  await page.locator('#lap-scrubber').fill('68');await page.getByRole('button',{name:'Play race',exact:true}).click();
  await expect(page.locator('#lap-scrubber')).toHaveValue('69');await expect(page.getByRole('button',{name:'Play race',exact:true})).toBeVisible();
  assert.equal(await plot().evaluate(e=>e.data[0].y.at(-1)),1);
  await page.getByRole('button',{name:'Replay race from the grid',exact:true}).click();
  await expect(page.locator('#lap-scrubber')).toHaveValue('0');
  assert.equal(await page.locator('audio').evaluate(a=>a.paused&&a.currentTime===0),true);
 });
 await check('mobile controls fit and sound remains keyboard accessible',async()=>{
  await page.setViewportSize({width:390,height:844});await load('case-grid');
  await page.getByRole('button',{name:'Unmute race audio',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'Mute race audio',exact:true})).toBeFocused();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:'artifacts/heatmap-audio/mobile.png',fullPage:true});
 });
 assert.deepEqual(errors,[]);
 fs.writeFileSync('artifacts/heatmap-audio-validation.json',JSON.stringify({passed:true,checks,errors},null,2));
}catch(error){
 await page.screenshot({path:'artifacts/heatmap-audio/failure.png',fullPage:true});
 fs.writeFileSync('artifacts/heatmap-audio-validation.json',JSON.stringify({passed:false,checks,errors,error:String(error)},null,2));
 throw error;
}finally{await browser.close();}
