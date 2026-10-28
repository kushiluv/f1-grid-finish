import type {AppState, Chapter, DriverRace} from './data/types';
export const CHAPTERS: {id:Chapter;name:string;label:string;time:string}[] = [
  {id:'overview',name:'The relationship',label:'Grid → finish',time:'0:35–1:40'},
  {id:'circuits',name:'The circuit',label:'Two kinds of predictability',time:'1:40–2:50'},
  {id:'recovery',name:'The goal',label:'Recovery to what?',time:'2:50–4:00'},
  {id:'case',name:'The exception',label:'São Paulo 2024',time:'4:00–5:30'},
];
export const PRESENT_CIRCUITS=['monaco','yas-marina','monza','spa-francorchamps'];
export function preset(chapter:Chapter,mode:'present'|'explore'='present'):AppState {
  return {mode,chapter,years:[2014,2025],circuitIds:chapter==='circuits'?PRESENT_CIRCUITS:[],outcome:'top10',selectedStart:null,selectedBand:3,highlightedDriverId:'',cohortDriverId:'',cohortConstructorId:'',includeBelgium2021:false,caseLap:null,caseEvent:null,showGasly:false};
}
export function readState(search:string,rows:DriverRace[]):AppState {
  const p=new URLSearchParams(search),chapter=CHAPTERS.some(x=>x.id===p.get('chapter'))?p.get('chapter') as Chapter:'overview';
  const mode=p.get('mode')==='explore'?'explore':'present';const s=preset(chapter,mode);
  if(mode==='present')return s;
  const years=(p.get('years')||'2014,2025').split(',').map(Number);
  if(years.length===2&&years.every(x=>Number.isInteger(x)&&x>=2014&&x<=2025)&&years[0]<=years[1])s.years=years as [number,number];
  const ids=new Set(rows.map(r=>r.circuit_id));
  if(p.has('circuits'))s.circuitIds=(p.get('circuits')||'').split(',').filter(x=>ids.has(x));
  const out=p.get('outcome');if(out==='win'||out==='podium'||out==='top10')s.outcome=out;
  const drivers=new Set(rows.map(r=>r.driver_id)),teams=new Set(rows.map(r=>r.constructor_id));
  if(drivers.has(p.get('driver')||''))s.cohortDriverId=p.get('driver')!;
  if(teams.has(p.get('team')||''))s.cohortConstructorId=p.get('team')!;
  s.includeBelgium2021=p.get('belgium')==='1';
  if(p.has('band')){const n=Number(p.get('band'));if(Number.isInteger(n)&&n>=0&&n<=4)s.selectedBand=n;}
  if(p.has('start')){const n=Number(p.get('start'));if(Number.isInteger(n)&&n>=1&&n<=22)s.selectedStart=n;}
  if(drivers.has(p.get('highlight')||''))s.highlightedDriverId=p.get('highlight')!;
  if(p.has('lap')){const n=Number(p.get('lap'));if(Number.isInteger(n)&&n>=0&&n<=69)s.caseLap=n;}
  if(p.has('event')){const n=Number(p.get('event'));if(Number.isInteger(n)&&n>=0&&n<=2)s.caseEvent=n;}
  s.showGasly=p.get('gasly')==='1';
  return s;
}
export function stateUrl(s:AppState) {
  const p=new URLSearchParams({chapter:s.chapter,mode:s.mode});
  if(s.mode==='explore'){
    p.set('years',s.years.join(','));p.set('circuits',s.circuitIds.join(','));p.set('outcome',s.outcome);
    if(s.cohortDriverId)p.set('driver',s.cohortDriverId);if(s.cohortConstructorId)p.set('team',s.cohortConstructorId);
    if(s.includeBelgium2021)p.set('belgium','1');
    p.set('band',String(s.selectedBand));
    if(s.selectedStart!==null)p.set('start',String(s.selectedStart));
    if(s.highlightedDriverId)p.set('highlight',s.highlightedDriverId);
    if(s.caseLap!==null)p.set('lap',String(s.caseLap));
    if(s.caseEvent!==null)p.set('event',String(s.caseEvent));
    if(s.showGasly)p.set('gasly','1');
  }
  return '?'+p.toString();
}
