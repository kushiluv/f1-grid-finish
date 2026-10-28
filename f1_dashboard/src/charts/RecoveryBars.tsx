import type {Data,Layout} from 'plotly.js';
import type {DriverRace,Outcome} from '../data/types';
import {bandStats,percent,fmt} from '../data/metrics';
import {Plot,baseLayout,config,TEAL,EmptyChart,useCompactChart} from './Plot';

export function RecoveryBars({rows,outcome,selectedBand,onSelect}:{rows:DriverRace[];outcome:Outcome;selectedBand:number;onSelect:(index:number)=>void}) {
  const compact=useCompactChart();
  const bs=bandStats(rows,outcome);if(!bs.some(b=>b.n))return <EmptyChart/>;
  const data:Data[]=[{type:'bar',orientation:'h',x:bs.map(b=>(b.rate??0)*100),y:bs.map((_,i)=>i),width:.40,
    marker:{color:bs.map((_,i)=>i===selectedBand?TEAL:'#D6E2E0'),line:{color:bs.map((_,i)=>i===selectedBand?'#055E68':'#D6E2E0'),width:bs.map((_,i)=>i===selectedBand?2:0)}},
    customdata:bs.map((b,i)=>[i,b.k,b.n,b.races,b.label]),
    hovertemplate:'<b>Started P%{customdata[4]}</b><br>%{customdata[1]} / %{customdata[2]} starts<br>%{x:.2f}% · %{customdata[3]} races<extra></extra>',
  },{type:'scatter',mode:'markers',x:bs.map(b=>b.rate!==null&&b.rate>0&&b.rate<.01?b.rate*100:null),y:bs.map((_,i)=>i),marker:{size:7,color:bs.map((_,i)=>i===selectedBand?TEAL:'#809A9A')},hoverinfo:'skip'}];
  const layout:Partial<Layout>={...baseLayout,margin:{l:compact?65:88,r:compact?90:125,t:26,b:48},
    xaxis:{range:[0,100],tickvals:compact?[0,50,100]:[0,25,50,75,100],ticktext:compact?['0%','50%','100%']:['0%','25%','50%','75%','100%'],tickfont:{size:compact?12:14},gridcolor:'#E5EBE9',zeroline:false,fixedrange:true,title:{text:'SHARE OF STARTS',font:{size:12,color:'#607579'},standoff:16}},
    yaxis:{range:[4.55,-.65],tickvals:bs.map((_,i)=>i),ticktext:bs.map(b=>`<b>P${b.label}</b>`),tickfont:{size:compact?13:17},ticks:'outside',ticklen:8,tickcolor:'transparent',showgrid:false,zeroline:false,fixedrange:true},
    annotations:[{x:1.025,y:1.06,xref:'paper',yref:'paper',text:'RESULTS / STARTS',showarrow:false,xanchor:'left',font:{size:compact?8:10,color:'#6A7F83'}},...bs.map((b,i)=>({x:1.025,y:i,xref:'paper' as const,yref:'y' as const,text:`<b>${percent(b.rate)}</b><br><span style="font-size:${compact?10:12}px;color:#607579">${fmt(b.k)} / ${fmt(b.n)}</span>`,showarrow:false,xanchor:'left' as const,align:'left' as const,font:{size:compact?14:19,color:i===selectedBand?TEAL:'#283A40'}}))],
  };
  return <Plot className="plot recovery-plot" data={data} layout={layout} config={config} style={{width:'100%',height:'100%'}} onClick={e=>{const d=e.points[0]?.customdata as unknown as number[];if(d)onSelect(d[0]);}}/>;
}
