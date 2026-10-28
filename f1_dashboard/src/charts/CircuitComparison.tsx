import type {Data,Layout,Annotation,Shape} from 'plotly.js';
import {useEffect,useState} from 'react';
import type {DriverRace,Uncertainty} from '../data/types';
import {circuitStats,percent} from '../data/metrics';
import {PRESENT_CIRCUITS} from '../state';
import {Plot,baseLayout,config,INK,TEAL,AMBER,MUTED,GRID,LABEL,EmptyChart,useCompactChart} from './Plot';

export function CircuitComparison({rows,uncertainty,period,hasCohort,showLimited,present,selectedCircuit,showWinner,onSelect}:{rows:DriverRace[];uncertainty:Uncertainty;period:string|null;hasCohort:boolean;showLimited:boolean;present:boolean;selectedCircuit:string;showWinner:boolean;onSelect:(id:string)=>void}) {
  const compact=useCompactChart();const [mobileMetric,setMobileMetric]=useState(0);
  useEffect(()=>{if(compact&&present)setMobileMetric(showWinner?1:0);},[showWinner,compact,present]);
  let cs=circuitStats(rows);
  if(present)cs=PRESENT_CIRCUITS.map(id=>cs.find(c=>c.id===id)).filter(c=>!!c);
  else if(!showLimited&&cs.length>4)cs=cs.filter(c=>c.races>=8);
  if(!cs.length)return <EmptyChart text="No circuits meet the current selection. Include limited histories or change your filters."/>;
  const colors=cs.map(c=>c.id==='monaco'?TEAL:c.id==='yas-marina'?AMBER:MUTED);
  const intervals=cs.map(c=>!hasCohort&&period?uncertainty[period]?.[c.id]:undefined);
  const y=cs.map((_,i)=>i),metric=showWinner?mobileMetric:0;
  const marker={size:cs.map(c=>c.id===selectedCircuit?16:12),color:colors,line:{width:cs.map(c=>c.id===selectedCircuit?2.5:1.5),color:cs.map(c=>c.id===selectedCircuit?INK:'#fff')}};
  const all:Data[]=[{
    type:'scatter',mode:'markers',x:cs.map(c=>c.r),y,marker,
    customdata:cs.map(c=>[c.id,c.name,c.finishers]),
    error_x:{type:'data',symmetric:false,array:cs.map((c,i)=>intervals[i]?.pearson_r_race_bootstrap_95&&c.r!==null?intervals[i]!.pearson_r_race_bootstrap_95![1]-c.r:0),arrayminus:cs.map((c,i)=>intervals[i]?.pearson_r_race_bootstrap_95&&c.r!==null?c.r-intervals[i]!.pearson_r_race_bootstrap_95![0]:0),color:'#657F84',thickness:2,width:5},
    hovertemplate:'<b>%{customdata[1]}</b><br>Correlation: %{x:.3f}<br>%{customdata[2]} eligible finishers<extra></extra>',
  },{
    type:'scatter',mode:'markers',xaxis:'x2',x:cs.map(c=>c.p1Rate),y,marker,
    customdata:cs.map(c=>[c.id,c.name,c.p1Wins,c.p1Starts]),
    error_x:{type:'data',symmetric:false,array:cs.map((c,i)=>intervals[i]?.p1_win_rate_wilson_95&&c.p1Rate!==null?intervals[i]!.p1_win_rate_wilson_95![1]-c.p1Rate:0),arrayminus:cs.map((c,i)=>intervals[i]?.p1_win_rate_wilson_95&&c.p1Rate!==null?c.p1Rate-intervals[i]!.p1_win_rate_wilson_95![0]:0),color:'#657F84',thickness:2,width:5},
    hovertemplate:'<b>%{customdata[1]}</b><br>%{customdata[2]} wins / %{customdata[3]} actual P1 starts<br>%{x:.1%}<extra></extra>',
  }];
  // Align values separately from marks so edge estimates remain easy to read.
  const annotations:Partial<Annotation>[]=[];
  const shapes:Partial<Shape>[]=[];
  cs.forEach((c,i)=>{
    shapes.push({type:'rect',xref:'paper',yref:'y',x0:compact?-.50:-.22,x1:1.04,y0:i-.46,y1:i+.46,fillcolor:c.id===selectedCircuit?'#EAF3F1':i%2===0?'#F6F8F7':'#FFFFFF',line:{width:0},layer:'below'});
    if(c.r!==null&&(!compact||metric===0))shapes.push({type:'line',xref:'x',yref:'y',x0:0,x1:c.r,y0:i,y1:i,line:{color:'#C5D9D5',width:3},layer:'below'});
    const number=(winner:boolean):Partial<Annotation>=>({x:compact?1:winner?1:.46,y:i,xref:'paper',yref:'y',text:winner?`<b>${percent(c.p1Rate)}</b><br><span style="font-size:${compact?10:12}px;color:${LABEL}">${c.p1Wins} / ${c.p1Starts} starts</span>`:`<b>${c.r===null?'—':c.r.toFixed(2)}</b>`,showarrow:false,xanchor:'right',align:'right',font:{size:compact?17:winner?20:24,color:colors[i]}});
    if(!compact||metric===0)annotations.push(number(false));
    if(showWinner&&(!compact||metric===1))annotations.push(number(true));
  });
  const header=(winner:boolean):Partial<Annotation>=>({text:winner?'<b>Wins from pole</b><br><span style="font-size:12px">Share of actual P1 starts</span>':'<b>The whole field</b><br><span style="font-size:12px">Start–finish correlation · r</span>',x:compact?.5:winner?.80:.21,y:1.10,xref:'paper',yref:'paper',showarrow:false,xanchor:'center',yanchor:'bottom',align:'center',font:{size:compact?16:18,color:INK}});
  annotations.push(header(compact&&metric===1));
  if(!compact&&showWinner){annotations.push(header(true));shapes.push({type:'line',xref:'paper',yref:'paper',x0:.51,x1:.51,y0:-.11,y1:1.15,line:{color:GRID,width:1}});}
  const layout:Partial<Layout>={...baseLayout,margin:{l:compact?102:143,r:compact?23:42,t:80,b:64},
    xaxis:{domain:compact?[0,.70]:[0,.34],range:[-1,1.13],tickvals:[-1,0,1],ticktext:['−1<br>Reverse','0<br>No alignment','+1<br>Same order'],tickfont:{size:compact?10:12,color:LABEL},gridcolor:GRID,zerolinecolor:'#A5B9B8',zerolinewidth:1,fixedrange:true},
    xaxis2:{domain:[.59,.88],range:[-.02,1.16],tickvals:[0,.5,1],ticktext:['0%','50%','100%'],tickfont:{size:13,color:LABEL},gridcolor:GRID,zeroline:false,fixedrange:true},
    yaxis:{range:[cs.length-.5,-.5],tickvals:y,ticktext:cs.map(c=>`<b>${c.id==='spa-francorchamps'?'Spa':c.name}</b><br><span style="font-size:${compact?10:12}px;color:${LABEL}">${c.races} races${c.races<8?' · limited':''}</span>`),ticks:'outside',ticklen:15,tickcolor:'transparent',showgrid:false,zeroline:false,fixedrange:true,tickfont:{size:compact?13:17,color:INK}},
    annotations,shapes,
  };
  let data=showWinner?all:[all[0]];
  if(!showWinner)delete layout.xaxis2;
  if(compact){
    data=[{...all[metric],xaxis:'x'}];
    if(metric===1)layout.xaxis={...layout.xaxis2,domain:[0,.69],tickfont:{size:11,color:LABEL}};
    delete layout.xaxis2;
    layout.margin={...layout.margin,t:65,b:53};
  }
  return <div className="circuit-scroll">{compact&&showWinner&&<div className="mobile-metric" role="group" aria-label="Circuit metric"><button aria-pressed={metric===0} onClick={()=>setMobileMetric(0)}>The field</button><button aria-pressed={metric===1} onClick={()=>setMobileMetric(1)}>The winner</button></div>}<Plot className="plot" data={data} layout={layout} config={config} style={{width:'100%',height:cs.length>5?cs.length*75+145:compact&&showWinner?'calc(100% - 40px)':'100%'}} onClick={e=>{const d=e.points[0]?.customdata as unknown as string[];if(d?.[0])onSelect(d[0]);}}/>{!showWinner&&!compact&&<div className="circuit-question"><span>THE NEXT QUESTION</span><h3>Does that also tell us<br/>who wins from pole?</h3><p>Reveal the second measure<br/>to make the comparison.</p><span className="question-arrow">↓</span></div>}</div>;
}
