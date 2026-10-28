import type {Data,Layout} from 'plotly.js';
import {useEffect,useState} from 'react';
import type {DriverRace,Uncertainty} from '../data/types';
import {circuitStats,percent} from '../data/metrics';
import {PRESENT_CIRCUITS} from '../state';
import {Plot,baseLayout,config,TEAL,AMBER,EmptyChart,useCompactChart} from './Plot';

export function CircuitComparison({rows,uncertainty,period,hasCohort,showLimited,present,selectedCircuit,showWinner,onSelect}:{rows:DriverRace[];uncertainty:Uncertainty;period:string|null;hasCohort:boolean;showLimited:boolean;present:boolean;selectedCircuit:string;showWinner:boolean;onSelect:(id:string)=>void}) {
  const compact=useCompactChart();const [mobileMetric,setMobileMetric]=useState(0);
  useEffect(()=>{if(compact&&present)setMobileMetric(showWinner?1:0);},[showWinner,compact,present]);
  let cs=circuitStats(rows);
  if(present)cs=PRESENT_CIRCUITS.map(id=>cs.find(c=>c.id===id)).filter(c=>!!c);
  else if(!showLimited&&cs.length>4)cs=cs.filter(c=>c.races>=8);
  if(!cs.length)return <EmptyChart text="No circuits meet the current selection. Include limited histories or change your filters."/>;
  const colors=cs.map(c=>c.id==='monaco'?TEAL:c.id==='yas-marina'?AMBER:'#91A3A5');
  const intervals=cs.map(c=>!hasCohort&&period?uncertainty[period]?.[c.id]:undefined);
  const y=cs.map((_,i)=>i),metric=showWinner?mobileMetric:0;
  const selection=cs.findIndex(c=>c.id===selectedCircuit);
  const marker={size:cs.map(c=>c.id===selectedCircuit?16:12),color:colors,line:{width:cs.map(c=>c.id===selectedCircuit?2.5:1.5),color:cs.map(c=>c.id===selectedCircuit?'#20363D':'#fff')}};
  const all:Data[]=[{
    type:'scatter',mode:'markers+text',x:cs.map(c=>c.r),y,marker,
    text:cs.map(c=>c.r===null?'—':c.r.toFixed(2)),textposition:'top center',textfont:{size:compact?15:18,color:'#202A30'},
    customdata:cs.map(c=>[c.id,c.name,c.finishers]),
    error_x:{type:'data',symmetric:false,array:cs.map((c,i)=>intervals[i]?.pearson_r_race_bootstrap_95&&c.r!==null?intervals[i]!.pearson_r_race_bootstrap_95![1]-c.r:0),arrayminus:cs.map((c,i)=>intervals[i]?.pearson_r_race_bootstrap_95&&c.r!==null?c.r-intervals[i]!.pearson_r_race_bootstrap_95![0]:0),color:'#9EAFB2',thickness:2,width:3},
    hovertemplate:'<b>%{customdata[1]}</b><br>Correlation: %{x:.3f}<br>%{customdata[2]} eligible finishers<extra></extra>',
  },{
    type:'scatter',mode:'markers+text',xaxis:'x2',x:cs.map(c=>c.p1Rate),y,marker,
    text:cs.map(c=>`${percent(c.p1Rate)} · ${c.p1Wins}/${c.p1Starts}`),textposition:'top center',textfont:{size:compact?14:16,color:'#202A30'},
    customdata:cs.map(c=>[c.id,c.name,c.p1Wins,c.p1Starts]),
    error_x:{type:'data',symmetric:false,array:cs.map((c,i)=>intervals[i]?.p1_win_rate_wilson_95&&c.p1Rate!==null?intervals[i]!.p1_win_rate_wilson_95![1]-c.p1Rate:0),arrayminus:cs.map((c,i)=>intervals[i]?.p1_win_rate_wilson_95&&c.p1Rate!==null?c.p1Rate-intervals[i]!.p1_win_rate_wilson_95![0]:0),color:'#9EAFB2',thickness:2,width:3},
    hovertemplate:'<b>%{customdata[1]}</b><br>%{customdata[2]} wins / %{customdata[3]} actual P1 starts<br>%{x:.1%}<extra></extra>',
  }];
  let data=showWinner?all:[all[0]];
  const layout:Partial<Layout>={...baseLayout,margin:{l:135,r:45,t:74,b:55},
    xaxis:{domain:[0,.42],range:[-1,1.13],tickvals:[-1,0,1],ticktext:['−1','0','+1'],gridcolor:'#E8ECEB',zerolinecolor:'#BBC6C8',fixedrange:true,title:{text:'CORRELATION r',font:{size:12,color:'#607579'},standoff:16}},
    xaxis2:{domain:[.59,1],range:[-.02,1.16],tickvals:[0,.5,1],ticktext:['0%','50%','100%'],gridcolor:'#E8ECEB',zeroline:false,fixedrange:true,title:{text:'WINS / ACTUAL P1 STARTS',font:{size:12,color:'#607579'},standoff:16}},
    yaxis:{range:[cs.length-.35,-.7],tickvals:y,ticktext:cs.map(c=>`<b>${c.id==='spa-francorchamps'?'Spa':c.name}</b><br><span style="font-size:12px;color:#607579">${c.races} races${c.races<8?' · limited':''}</span>`),showgrid:true,gridcolor:'#E8ECEB',zeroline:false,fixedrange:true,tickfont:{size:16}},
    annotations:[{text:'<b>The whole field</b><br><span style="font-size:12px">Alignment of start and finish</span>',x:.21,y:1.20,xref:'paper',yref:'paper',showarrow:false,font:{size:17,color:'#283D44'}},...(showWinner?[{text:'<b>The front starter</b><br><span style="font-size:12px">Conversion into a win</span>',x:.8,y:1.20,xref:'paper' as const,yref:'paper' as const,showarrow:false,font:{size:17,color:'#283D44'}}]:[])],
    shapes:selection>=0?[{type:'rect',xref:'paper',yref:'y',x0:0,x1:1,y0:selection-.35,y1:selection+.35,fillcolor:'#087F8C',opacity:.045,line:{width:0},layer:'below'}]:[],
  };
  if(!showWinner)delete layout.xaxis2;
  if(compact){
    data=[{...all[metric],xaxis:'x'}];
    layout.margin={l:104,r:35,t:60,b:48};
    layout.xaxis={...(metric?{domain:[0,1],range:[-.02,1.18],tickvals:[0,.5,1],ticktext:['0%','50%','100%'],gridcolor:'#E8ECEB',zeroline:false,fixedrange:true}:layout.xaxis),domain:[0,1],tickfont:{size:12},title:{text:metric?'WINS / ACTUAL P1 STARTS':'CORRELATION r',font:{size:10},standoff:15}};
    delete layout.xaxis2;
    layout.annotations=[{text:metric?'<b>The front starter</b>':'<b>The whole field</b>',x:.5,y:1.16,xref:'paper',yref:'paper',showarrow:false,font:{size:16,color:'#283D44'}}];
    layout.yaxis={...layout.yaxis,tickfont:{size:13}};
  }
  return <div className="circuit-scroll">{compact&&showWinner&&<div className="mobile-metric" role="group" aria-label="Circuit metric"><button aria-pressed={metric===0} onClick={()=>setMobileMetric(0)}>The field</button><button aria-pressed={metric===1} onClick={()=>setMobileMetric(1)}>The winner</button></div>}<Plot className="plot" data={data} layout={layout} config={config} style={{width:'100%',height:cs.length>5?cs.length*75+140:compact&&showWinner?'calc(100% - 40px)':'100%'}} onClick={e=>{const p=e.points[0];const d=p?.customdata as unknown as string[];if(d?.[0])onSelect(d[0]);}}/>{!showWinner&&!compact&&<div className="circuit-question"><span>THE NEXT QUESTION</span><h3>Does that also tell us<br/>who wins from first?</h3><p>Reveal the second measure<br/>to make the comparison.</p><span className="question-arrow">↓</span></div>}</div>;
}
