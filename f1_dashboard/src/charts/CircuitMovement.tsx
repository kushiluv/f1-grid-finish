import type {DriverRace} from '../data/types';
import {circuitStats,decimal,fmt} from '../data/metrics';
import {PRESENT_CIRCUITS} from '../state';
import {Plot,baseLayout,config,TEAL,AMBER,GRID,LABEL,EmptyChart,useCompactChart} from './Plot';
import {fadeIn,useChartReveal,type RevealPart} from './useChartReveal';

export function CircuitMovement({rows,present,showLimited,selectedCircuit,onSelect}:{rows:DriverRace[];present:boolean;showLimited:boolean;selectedCircuit:string;onSelect:(id:string)=>void}) {
  const compact=useCompactChart();let cs=circuitStats(rows);
  const {root,afterPlot}=useChartReveal('movement',container=>{
    const parts:RevealPart[]=[];
    container.querySelectorAll('.barlayer .point path').forEach(element=>parts.push({element,frames:[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],duration:700}));
    container.querySelectorAll('.annotation').forEach(element=>parts.push({element,frames:fadeIn,duration:180,delay:520}));
    return parts;
  },true);
  if(present)cs=cs.filter(c=>PRESENT_CIRCUITS.includes(c.id));
  else if(!showLimited&&cs.length>5)cs=cs.filter(c=>c.races>=8);
  cs.sort((a,b)=>(a.movement.meanAbsolute??Infinity)-(b.movement.meanAbsolute??Infinity));
  if(!cs.length)return <EmptyChart text="No circuits meet this selection. Include limited histories or change your filters."/>;
  const bound=Math.max(3,Math.ceil(Math.max(...cs.map(c=>c.movement.meanAbsolute??0))));
  return <div ref={root} className="circuit-scroll movement-view"><Plot className="plot" style={{width:'100%',height:cs.length>5?cs.length*68+90:'100%'}} config={config}
    data={[{type:'bar',orientation:'h',y:cs.map((_,i)=>i),x:cs.map(c=>c.movement.meanAbsolute),width:.34,
      marker:{color:cs.map(c=>c.id==='interlagos'?AMBER:TEAL),opacity:cs.map(c=>c.id===selectedCircuit?1:.65)},
      customdata:cs.map(c=>[c.id,c.name,c.movement.n,c.movement.starts]),
      hovertemplate:'<b>%{customdata[1]}</b><br>Average absolute change: %{x:.2f} places<br>%{customdata[2]} finishers from %{customdata[3]} P1–10 starts<extra></extra>'}]}
    layout={{...baseLayout,margin:{l:compact?102:142,r:compact?96:132,t:12,b:55},
      xaxis:{range:[0,bound],dtick:1,tickfont:{size:compact?11:13},title:{text:compact?'AVERAGE PLACES CHANGED':'AVERAGE PLACES CHANGED · EITHER DIRECTION',font:{size:compact?9:11,color:LABEL}},gridcolor:GRID,zeroline:false,fixedrange:true},
      yaxis:{range:[cs.length-.5,-.5],tickvals:cs.map((_,i)=>i),ticktext:cs.map(c=>`<b>${c.name}</b>`),showgrid:false,zeroline:false,fixedrange:true,tickfont:{size:compact?12:16}},
      annotations:cs.flatMap((c,i)=>[
        {x:1,y:i,xref:'paper',yref:'y',xshift:16,yshift:8,showarrow:false,xanchor:'left',text:`<b>${decimal(c.movement.meanAbsolute)}</b>`,font:{size:compact?19:23,color:c.id==='interlagos'?AMBER:TEAL}},
        {x:1,y:i,xref:'paper',yref:'y',xshift:16,yshift:-14,showarrow:false,xanchor:'left',text:`${fmt(c.movement.n)} finishes`,font:{size:compact?10:12,color:LABEL}},
      ]),
      shapes:cs.map((c,i)=>({type:'rect',xref:'paper',yref:'y',x0:0,x1:1.2,y0:i-.48,y1:i+.48,line:{width:0},fillcolor:c.id===selectedCircuit?'#EAF3F1':i%2===0?'#F6F8F7':'#FFFFFF',layer:'below'})),
    }} onInitialized={afterPlot} onUpdate={afterPlot} onClick={e=>{const d=e.points[0]?.customdata as unknown as string[];if(d?.[0])onSelect(d[0]);}}/></div>;
}
