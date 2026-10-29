import {chromium} from '@playwright/test';
import fs from 'node:fs';
fs.mkdirSync('artifacts/refinement',{recursive:true});
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await b.newPage();p.on('pageerror',e=>console.log('ERROR',e.message));
for(const [w,h] of [[1440,900],[1280,720],[390,844],[2560,1440]]){
 await p.setViewportSize({width:w,height:h});
 for(const s of ['recovery-top10','circuits-field','closing']){
 await p.goto('http://127.0.0.1:5181/?step='+s);await p.locator('h1').waitFor();await p.waitForTimeout(700);
 console.log(s,w,await p.evaluate(()=>({height:document.body.scrollHeight,width:document.documentElement.scrollWidth,aside:[document.querySelector('.insight-panel')?.clientHeight,document.querySelector('.insight-panel')?.scrollHeight],matrix:document.querySelector('.js-plotly-plot')?._fullLayout?.yaxis?._length})));
 await p.screenshot({path:`artifacts/refinement/${s}-${w}.png`,fullPage:true});
 }
}
await b.close();
