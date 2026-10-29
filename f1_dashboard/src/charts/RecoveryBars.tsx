import {useState} from 'react';
import {fadeIn,useChartReveal,type RevealPart} from './useChartReveal';
import type {Data,Layout,Annotation,Shape} from 'plotly.js';
import type {DriverRace,Outcome} from '../data/types';
import {bandStats,percent,fmt,OUTCOMES} from '../data/metrics';
import {Plot,baseLayout,config,TEAL,INK,GRID,LABEL,EmptyChart,useCompactChart} from './Plot';

export const RECOVERY_ORDER=[4,3,2,1,0];
export const OUTCOME_COLORS={top10:TEAL,podium:'#7152A3',win:'#AD650C'};
// Overlapping outcomes share one axis. Vertical offsets separate close rates;
// the horizontal coordinates remain exact, including rates smaller than 1%.
export function RecoveryBars({rows,outcome,selectedBand,revealThrough,onSelect}:{rows:DriverRace[];outcome:Outcome;selectedBand:number;revealThrough?:Outcome;onSelect:(index:number,outcome:Outcome)=>void}) {
 const compact=useCompactChart(),outcomes:Outcome[]=['top10','podium','win'];
 const [replay,setReplay]=useState(0),revealedCount=revealThrough?outcomes.indexOf(revealThrough)+1:3;
 const {root,afterPlot}=useChartReveal(`${revealThrough??'all'}:${replay}`,container=>{
  const j=outcomes.indexOf(outcome),parts:RevealPart[]=[];
  const plot=container.querySelector('.js-plotly-plot') as any;
  if(!plot)return parts;
  const trace=container.querySelectorAll('.scatterlayer .trace')[j];
  const max=Math.max(1,...plot.data[j].x.filter((v:unknown)=>typeof v==='number'));
  const points=trace?.querySelectorAll('.point');
  let pointIndex=0;
  for(let row=0;row<5;row++){
   const value=plot.data[j].x[row];if(value===null)continue;
   const duration=900*value/max;
   const shapeIndex=plot.layout.shapes.findIndex((shape:any)=>shape.name===`recovery-${outcome}-${row}`);
   const path=container.querySelector(`.shapelayer path[data-index="${shapeIndex}"]`) as SVGPathElement|null;
   if(path){const length=path.getTotalLength();parts.push({element:path,frames:[{strokeDasharray:`${length} ${length}`,strokeDashoffset:length},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0}],duration:Math.max(1,duration)});}
   parts.push({element:points?.[pointIndex++]??null,frames:fadeIn,duration:130,delay:duration});
   parts.push({element:container.querySelector(`.annotation[data-index="${j*5+row}"]`),frames:fadeIn,duration:130,delay:duration});
  }
  return parts;
 },!!revealThrough);
 const groups=outcomes.map(o=>bandStats(rows,o));if(!groups[0].some(b=>b.n))return <EmptyChart/>;
 const annotations:Partial<Annotation>[]=[],shapes:Partial<Shape>[]=[],data:Data[]=[];
 RECOVERY_ORDER.forEach((band,row)=>shapes.push({type:'rect',xref:'paper',yref:'y',x0:0,x1:1,y0:row-.45,y1:row+.45,fillcolor:band===selectedBand?'#E9F2EF':row%2===0?'#F8FAF7':'#fff',line:{width:0},layer:'below'}));
 outcomes.forEach((o,j)=>{
  const bs=groups[j],offset=(j-1)*.30,revealed=j<revealedCount;
  const xs=RECOVERY_ORDER.map(i=>bs[i].rate===null?null:bs[i].rate!*100),ys=RECOVERY_ORDER.map((_,r)=>r+offset);
  data.push({type:'scatter',mode:'markers',visible:revealed,cliponaxis:false,name:o==='top10'?'Top ten · P1–10':o==='podium'?'Podium · P1–3':'Win · P1',x:xs,y:ys,
   marker:{symbol:(['circle','diamond','triangle-up'] as const)[j],size:RECOVERY_ORDER.map(i=>i===selectedBand&&o===outcome?13:o===outcome?10:9),color:OUTCOME_COLORS[o],opacity:RECOVERY_ORDER.map(i=>i===selectedBand||o===outcome?1:.78),line:{width:1,color:'#fff'}},
   customdata:RECOVERY_ORDER.map(i=>[i,o,bs[i].k,bs[i].n,bs[i].label]),
   hovertemplate:`<b>P%{customdata[4]} → ${OUTCOMES[o].label}</b><br>%{customdata[2]} of %{customdata[3]} starts<br>%{x:.2f}%<extra></extra>`});
  RECOVERY_ORDER.forEach((i,row)=>{
   const value=xs[row];if(value!==null)shapes.push({name:`recovery-${o}-${row}`,visible:revealed,type:'line',xref:'x',yref:'y',x0:0,x1:value,y0:ys[row],y1:ys[row],opacity:o===outcome?.85:.40,line:{color:OUTCOME_COLORS[o],width:o===outcome?3:2},layer:'below'});
   annotations.push({visible:revealed,x:value??0,y:ys[row],xref:'x',yref:'y',xshift:10,xanchor:'left',text:`<b>${percent(bs[i].rate)}</b>`,showarrow:false,font:{size:compact?11:14,color:OUTCOME_COLORS[o]}});
  });
 });
 const layout:Partial<Layout>={...baseLayout,margin:{l:compact?83:118,r:compact?62:80,t:15,b:52},showlegend:false,
  legend:{orientation:'h',x:.5,xanchor:'center',y:1.06,yanchor:'bottom',font:{size:compact?10:13},itemclick:false,itemdoubleclick:false,traceorder:'normal'},
  xaxis:{range:[0,100],tickvals:[0,25,50,75,100],ticktext:['0%','25%','50%','75%','100%'],tickfont:{size:compact?10:12,color:LABEL},gridcolor:GRID,zeroline:false,fixedrange:true,title:{text:'SHARE OF STARTS REACHING EACH OUTCOME',font:{size:compact?9:11,color:LABEL},standoff:16}},
  yaxis:{range:[4.5,-.5],tickvals:[0,1,2,3,4],ticktext:RECOVERY_ORDER.map(i=>`<b>P${groups[0][i].label}</b><br><span style="font-size:${compact?9:11}px;color:${LABEL}">${fmt(groups[0][i].n)} starts</span>`),ticks:'outside',ticklen:12,tickcolor:'transparent',tickfont:{size:compact?13:17,color:INK},showgrid:false,zeroline:false,fixedrange:true},annotations,shapes,
 };

 return <div ref={root} className="recovery-interactive" data-reveal-through={revealThrough??'all'}><div className="recovery-legend" role="group" aria-label="Animate an outcome">{outcomes.map((o,j)=><button key={o} type="button" disabled={j>=revealedCount} title={j>=revealedCount?'Use Next to reveal this outcome':'Replay this outcome'} aria-label={`Animate ${OUTCOMES[o].label.toLowerCase()}`} aria-pressed={outcome===o} style={{'--outcome-color':OUTCOME_COLORS[o]} as React.CSSProperties} onClick={()=>{setReplay(v=>v+1);onSelect(selectedBand,o);}}><svg width="34" height="20" viewBox="0 0 34 20" aria-hidden="true"><path d="M1 10H23" stroke="currentColor" strokeWidth="2.5"/>{j===0?<circle cx="24" cy="10" r="5" fill="currentColor"/>:j===1?<path d="M24 3 31 10 24 17 17 10Z" fill="currentColor"/>:<path d="M24 3 31 16H17Z" fill="currentColor"/>}</svg><span><b>{OUTCOMES[o].label}</b><small>{j===0?'P1–10':j===1?'P1–3':'P1'}</small></span><span className="legend-replay" aria-hidden="true">↻</span></button>)}</div><p className="legend-hint">{revealedCount<3?`Next: reveal ${revealedCount===1?'podium finishes':'wins'}. Select a revealed legend to replay.`:'Select a legend to draw that outcome.'}</p><Plot className="plot recovery-plot" data={data} layout={layout} config={config} style={{width:'100%',flex:1,minHeight:0}} onInitialized={afterPlot} onUpdate={afterPlot} onClick={e=>{const d=e.points[0]?.customdata as unknown as [number,Outcome];if(d&&outcomes.indexOf(d[1])<revealedCount)onSelect(d[0],d[1]);}}/></div>;
}
