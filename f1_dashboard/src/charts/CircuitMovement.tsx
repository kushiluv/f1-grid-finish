import type {DriverRace} from '../data/types';
import {circuitStats,decimal} from '../data/metrics';
import {PRESENT_CIRCUITS} from '../state';
import {Plot,baseLayout,config,TEAL,AMBER,GRID,LABEL,EmptyChart,useCompactChart} from './Plot';

export function CircuitMovement({rows,present,showLimited,selectedCircuit,onSelect}:{rows:DriverRace[];present:boolean;showLimited:boolean;selectedCircuit:string;onSelect:(id:string)=>void}) {
  const compact=useCompactChart();
  let cs=circuitStats(rows);
  if(present)cs=PRESENT_CIRCUITS.map(id=>cs.find(c=>c.id===id)).filter(c=>!!c);
  else if(!showLimited&&cs.length>4)cs=cs.filter(c=>c.races>=8);
  if(!cs.length)return <EmptyChart text="No circuits meet this selection."/>;
  const bound=Math.max(1,Math.ceil(Math.max(...cs.map(c=>Math.abs(c.movement.meanNet??0)))*1.25));
  return <div className="circuit-scroll"><Plot className="plot" style={{width:'100%',height:cs.length>5?cs.length*75+100:'100%'}} config={config}
    data={[{type:'bar',orientation:'h',y:cs.map((_,i)=>i),x:cs.map(c=>c.movement.meanNet),width:.34,
      marker:{color:cs.map(c=>(c.movement.meanNet??0)>=0?TEAL:AMBER),opacity:cs.map(c=>c.id===selectedCircuit?1:.65)},
      customdata:cs.map(c=>[c.id,c.name,c.movement.n,c.movement.meanAbsolute]),
      hovertemplate:'<b>%{customdata[1]}</b><br>Net change: %{x:+.2f} places<br>Change in either direction: %{customdata[3]:.2f} places<br>%{customdata[2]} finishers who started P1–10<extra></extra>'}]}
    layout={{...baseLayout,margin:{l:compact?95:135,r:compact?38:50,t:30,b:75},
      xaxis:{ticklabeloverflow:'allow',range:[-bound,bound],tickvals:[-bound,0,bound],ticktext:[`−${bound}<br>Places lost`,'0<br>No net change',`+${bound}<br>Places gained`],gridcolor:GRID,zeroline:true,zerolinecolor:LABEL,zerolinewidth:1.5,fixedrange:true,tickfont:{size:compact?10:12}},
      yaxis:{range:[cs.length-.5,-.5],tickvals:cs.map((_,i)=>i),ticktext:cs.map(c=>`<b>${c.id==='spa-francorchamps'?'Spa':c.name}</b>`),showgrid:false,zeroline:false,fixedrange:true,tickfont:{size:compact?12:16}},
      annotations:cs.map((c,i)=>({x:c.movement.meanNet??0,y:i,xref:'x',yref:'y',yshift:25,showarrow:false,text:`<b>${c.movement.meanNet===null?'—':`${c.movement.meanNet>0?'+':''}${decimal(c.movement.meanNet)}`}</b>`,font:{size:compact?16:20,color:LABEL}})),
      shapes:cs.map((c,i)=>({type:'rect',xref:'paper',yref:'y',x0:0,x1:1,y0:i-.48,y1:i+.48,line:{width:0},fillcolor:c.id===selectedCircuit?'#EAF3F1':i%2===0?'#F6F8F7':'#FFFFFF',layer:'below'})),
    }} onClick={e=>{const d=e.points[0]?.customdata as unknown as string[];if(d?.[0])onSelect(d[0]);}}/></div>;
}
