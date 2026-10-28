import type { AppState, DriverRace, Outcome, Summary } from './types';

export const BANDS = [
  {label:'1', min:1, max:1, title:'Starting first'},
  {label:'2–3', min:2, max:3, title:'Near the front'},
  {label:'4–10', min:4, max:10, title:'Inside the top ten'},
  {label:'11–15', min:11, max:15, title:'Chasing the top ten'},
  {label:'16–22', min:16, max:22, title:'Starting at the back'},
];
export const OUTCOMES: Record<Outcome,{label:string; n:number}> = {top10:{label:'Top ten',n:10},podium:{label:'Podium',n:3},win:{label:'Win',n:1}};
export const fmt = (n:number) => n.toLocaleString('en-US');
export const percent = (n:number|null, digits=1) => n===null?'—':`${(n*100).toFixed(n>0&&n<.01?2:digits)}%`;
export const decimal = (n:number|null,digits=2) => n===null?'—':n.toFixed(digits);
export function pearson(x:number[], y:number[]):number|null {
  if(x.length!==y.length||x.length<3)return null;
  const n=x.length, sx=x.reduce((a,b)=>a+b,0),sy=y.reduce((a,b)=>a+b,0);
  const sxx=x.reduce((a,b)=>a+b*b,0),syy=y.reduce((a,b)=>a+b*b,0),sxy=x.reduce((a,b,i)=>a+b*y[i],0);
  const d=(n*sxx-sx*sx)*(n*syy-sy*sy);
  return d>0?(n*sxy-sx*sy)/Math.sqrt(d):null;
}
export function selectBase(rows:DriverRace[],s:AppState):DriverRace[] {
  return rows.filter(r=>r.year>=s.years[0]&&r.year<=s.years[1]
    &&(s.includeBelgium2021||!r.exclude_no_green_racing)
    &&(!s.circuitIds.length||s.circuitIds.includes(r.circuit_id))
    &&(!s.cohortDriverId||r.driver_id===s.cohortDriverId)
    &&(!s.cohortConstructorId||r.constructor_id===s.cohortConstructorId));
}
export const gridStarts = (rows:DriverRace[]) => rows.filter(r=>r.is_starter&&r.grid!==null&&r.grid>0);
export function summarize(rows:DriverRace[]):Summary {
  const starts=gridStarts(rows), fs=starts.filter(r=>r.is_finisher&&r.finish!==null),p1=starts.filter(r=>r.grid===1);
  const same=fs.filter(r=>r.grid===r.finish).length,p1Wins=p1.filter(r=>r.finish===1).length;
  return {races:new Set(starts.map(r=>r.race_id)).size,starts:starts.length,finishers:fs.length,
    r:pearson(fs.map(r=>r.grid!),fs.map(r=>r.finish!)),same,sameRate:fs.length?same/fs.length:null,
    p1Starts:p1.length,p1Wins,p1Rate:p1.length?p1Wins/p1.length:null,nonfinishers:starts.length-fs.length,
    meanMovement:fs.length?fs.reduce((a,r)=>a+Math.abs(r.grid!-r.finish!),0)/fs.length:null};
}
export function heatmap(rows:DriverRace[]) {
  const starts=gridStarts(rows),denoms=Array(22).fill(0) as number[];
  const counts=Array.from({length:23},()=>Array(22).fill(0) as number[]);
  starts.forEach(r=>{
    const x=r.grid!-1;if(x<0||x>=22)return;denoms[x]++;
    const y=r.is_finisher&&r.finish!==null?r.finish-1:22;
    if(y>=0&&y<23)counts[y][x]++;
  });
  return {counts,denoms,values:counts.map(row=>row.map((k,i)=>denoms[i]?k/denoms[i]:null))};
}
export function bandStats(rows:DriverRace[],outcome:Outcome) {
  const starts=gridStarts(rows);
  return BANDS.map(b=>{
    const rs=starts.filter(r=>r.grid!>=b.min&&r.grid!<=b.max);
    const wins=rs.filter(r=>r.finish!==null&&r.finish<=OUTCOMES[outcome].n).length;
    return {...b,rows:rs,n:rs.length,k:wins,rate:rs.length?wins/rs.length:null,races:new Set(rs.map(r=>r.race_id)).size};
  });
}
export function topTenMovement(rows:DriverRace[]) {
  const starts=gridStarts(rows).filter(r=>r.grid!<=10);
  const finishers=starts.filter(r=>r.is_finisher&&r.finish!==null);
  const changes=finishers.map(r=>r.grid!-r.finish!);
  const totalNet=changes.reduce((a,b)=>a+b,0);
  return {starts:starts.length,n:finishers.length,totalNet,
    meanNet:changes.length?totalNet/changes.length:null,
    meanAbsolute:changes.length?changes.reduce((a,b)=>a+Math.abs(b),0)/changes.length:null};
}
export function circuitStats(rows:DriverRace[]) {
  const map=new Map<string,DriverRace[]>();
  rows.forEach(r=>map.set(r.circuit_id,[...(map.get(r.circuit_id)||[]),r]));
  return [...map].map(([id,rs])=>({id,name:rs[0].circuit_name,rows:rs,movement:topTenMovement(rs),...summarize(rs)})).sort((a,b)=>(b.r??-2)-(a.r??-2));
}
export function downloadCsv(rows:DriverRace[],filename='grid-finish-data.csv') {
  if(!rows.length)return;
  const keys=Object.keys(rows[0]) as (keyof DriverRace)[];
  const quote=(x:unknown)=>`"${String(x??'').replaceAll('"','""')}"`;
  const sourceKeys=['data_source','source_version'];
  const csv=[[...keys,...sourceKeys].map(quote).join(','),...rows.map(r=>[...keys.map(k=>quote(r[k])),quote('F1DB https://github.com/f1db/f1db'),quote('v2025.24.0 + documented grid/status corrections')].join(','))].join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
