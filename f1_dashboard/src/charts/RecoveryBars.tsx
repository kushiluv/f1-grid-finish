import type {Data,Layout} from 'plotly.js';
import type {DriverRace,Outcome} from '../data/types';
import {bandStats,percent,fmt} from '../data/metrics';
import {Plot,baseLayout,config,TEAL,INK,MUTED,GRID,LABEL,EmptyChart,useCompactChart} from './Plot';

export function RecoveryBars({rows,outcome,selectedBand,onSelect}:{rows:DriverRace[];outcome:Outcome;selectedBand:number;onSelect:(index:number)=>void}) {
  const compact=useCompactChart();
  const bs=bandStats(rows,outcome);if(!bs.some(b=>b.n))return <EmptyChart/>;
  const data:Data[]=[{type:'bar',orientation:'h',x:bs.map(b=>b.rate===null?null:b.rate*100),y:bs.map((_,i)=>i),width:.48,
    marker:{color:bs.map((_,i)=>i===selectedBand?TEAL:MUTED),line:{width:0}},
    customdata:bs.map((b,i)=>[i,b.k,b.n,b.races,b.label]),
    hovertemplate:'<b>Started P%{customdata[4]}</b><br>%{customdata[1]} / %{customdata[2]} starts<br>%{x:.2f}% · %{customdata[3]} races<extra></extra>',
  },{type:'scatter',mode:'markers',x:bs.map(b=>b.rate!==null&&b.rate>0&&b.rate<.01?b.rate*100:null),y:bs.map((_,i)=>i),customdata:bs.map((b,i)=>[i,b.k,b.n,b.races,b.label]),marker:{size:7,color:bs.map((_,i)=>i===selectedBand?TEAL:MUTED)},hovertemplate:'<b>Started P%{customdata[4]}</b><br>%{customdata[1]} / %{customdata[2]} starts<br>%{x:.2f}%<extra></extra>'}];
  const layout:Partial<Layout>={...baseLayout,margin:{l:compact?67:91,r:compact?94:134,t:27,b:48},
    xaxis:{range:[0,100],tickvals:compact?[0,50,100]:[0,25,50,75,100],ticktext:compact?['0%','50%','100%']:['0%','25%','50%','75%','100%'],tickfont:{size:compact?12:14,color:LABEL},gridcolor:GRID,zeroline:false,fixedrange:true,title:{text:'SHARE OF STARTS',font:{size:12,color:LABEL},standoff:16}},
    yaxis:{range:[4.55,-.65],tickvals:bs.map((_,i)=>i),ticktext:bs.map((b,i)=>`<b><span style="color:${i===selectedBand?TEAL:INK}">P${b.label}</span></b>`),tickfont:{size:compact?13:18,color:INK},ticks:'outside',ticklen:12,tickcolor:'transparent',showgrid:false,zeroline:false,fixedrange:true},
    shapes:[{type:'rect',xref:'paper',yref:'y',x0:0,x1:1.2,y0:selectedBand-.47,y1:selectedBand+.47,fillcolor:'#EDF5F3',line:{width:0},layer:'below'},...bs.filter(b=>b.n>0).map(b=>({type:'rect' as const,xref:'x' as const,yref:'y' as const,x0:0,x1:100,y0:bs.indexOf(b)-.24,y1:bs.indexOf(b)+.24,fillcolor:'#EDF1EF',line:{width:0},layer:'below' as const}))],
    annotations:[{x:1.035,y:1.06,xref:'paper',yref:'paper',text:'RESULTS / STARTS',showarrow:false,xanchor:'left',font:{size:compact?9:11,color:LABEL}},...bs.flatMap((b,i)=>[
      {x:1.035,y:i,xref:'paper' as const,yref:'y' as const,yshift:compact?7:9,text:`<b>${percent(b.rate)}</b>`,showarrow:false,xanchor:'left' as const,font:{size:compact?15:22,color:i===selectedBand?TEAL:INK}},
      {x:1.035,y:i,xref:'paper' as const,yref:'y' as const,yshift:compact?-12:-15,text:`${fmt(b.k)} / ${fmt(b.n)}`,showarrow:false,xanchor:'left' as const,font:{size:compact?10:12,color:LABEL}},
    ])],
  };
  return <Plot className="plot recovery-plot" data={data} layout={layout} config={config} style={{width:'100%',height:'100%'}} onClick={e=>{const d=e.points[0]?.customdata as unknown as number[];if(d)onSelect(d[0]);}}/>;
}
