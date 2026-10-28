import type {Data,Layout} from 'plotly.js';
import type {RaceCase} from '../data/types';
import {Plot,baseLayout,config,TEAL,AMBER,PURPLE,useCompactChart} from './Plot';
export const DRIVER_COLORS=[TEAL,AMBER,PURPLE,'#697A8D'];

export function RaceTrace({race,showGasly,lap,reveal,onLap}:{race:RaceCase;showGasly:boolean;lap:number|null;reveal:boolean;onLap:(lap:number)=>void}) {
  const compact=useCompactChart();const end=reveal?(lap??0):race.laps;
  const traces=race.traces.slice(0,showGasly?4:3);
  const endpoint=traces.map(t=>t.points.find(p=>p.lap===(lap??end))!);
  const labelPositions=endpoint.map((p,i)=>({i,position:p.position})).sort((a,b)=>a.position-b.position);
  let previous=-1;
  const labels:number[]=[];
  labelPositions.forEach(p=>{labels[p.i]=Math.max(p.position,previous+1.5);previous=labels[p.i];});
  const data:Data[]=traces.map((t,i)=>({type:'scatter',mode:end===0?'markers':'lines',x:t.points.filter(p=>p.lap<=end).map(p=>p.lap),y:t.points.filter(p=>p.lap<=end).map(p=>p.position),name:t.label,
    marker:{size:10,color:DRIVER_COLORS[i]},line:{color:DRIVER_COLORS[i],width:i===0?4:2.8,shape:'hv',dash:i===1?'dash':i===2?'dot':'solid'},
    hovertemplate:`<b>${t.label}</b><br>Lap %{x} · P%{y}<extra></extra>`,
  }));
  if(lap!==null)data.push({type:'scatter',mode:'markers',x:traces.map(()=>lap),y:endpoint.map(p=>p.position),marker:{size:10,color:traces.map((_,i)=>DRIVER_COLORS[i]),line:{color:'#fff',width:2}},hoverinfo:'skip'});
  const layout:Partial<Layout>={...baseLayout,margin:{l:compact?43:68,r:compact?12:20,t:16,b:48},hovermode:'x unified',
    xaxis:{range:[-1,compact?91:84],tickvals:compact?[0,20,40,60,69]:[0,10,20,30,40,50,60,69],ticktext:compact?['Grid','20','40','60','69']:['Grid','10','20','30','40','50','60','69'],tickfont:{size:compact?11:14},fixedrange:true,showgrid:false,zeroline:false,title:{text:'LAP · OBSERVED LAP-END POSITIONS',font:{size:compact?9:12,color:'#607579'},standoff:13}},
    yaxis:{range:[20,.15],tickvals:[1,5,10,15,20],ticktext:['P1','P5','P10','P15','P20'],tickfont:{size:compact?11:14},gridcolor:'#E5EBE9',zeroline:false,fixedrange:true,title:{text:compact?'POSITION':'POSITION · FIRST AT TOP',font:{size:compact?9:12,color:'#607579'},standoff:12}},
    shapes:[...(!reveal||end>=33?[{type:'rect' as const,xref:'x' as const,yref:'paper' as const,x0:32,x1:33,y0:0,y1:1,line:{width:0},fillcolor:'#C5382D',opacity:.12,layer:'below' as const}]:[]),...(lap!==null?[{type:'line' as const,xref:'x' as const,yref:'paper' as const,x0:lap,x1:lap,y0:0,y1:1,line:{color:'#819697',width:1,dash:'dot' as const}}]:[])],
    annotations:[...traces.map((t,i)=>({x:lap??end,y:endpoint[i].position,xref:'x' as const,yref:'y' as const,text:`<b>${compact?t.label.slice(0,3).toUpperCase():t.label}</b> P${endpoint[i].position}`,showarrow:true,arrowhead:0,axref:'x' as const,ayref:'y' as const,ax:(lap??end)+1.7,ay:labels[i],xanchor:'left' as const,font:{color:DRIVER_COLORS[i],size:compact?11:15},arrowcolor:DRIVER_COLORS[i],arrowwidth:1,bgcolor:'#fff'})),
      ...(!reveal||end>=33?[{x:32.5,y:1.025,xref:'x' as const,yref:'paper' as const,text:'RACE SUSPENDED',showarrow:false,font:{size:compact?9:11,color:'#B5362A'}}]:[]),
    ],
  };
  return <Plot className="plot race-plot" data={data} layout={layout} config={config} style={{width:'100%',height:'100%'}} onClick={e=>{const x=e.points[0]?.x;if(typeof x==='number')onLap(Math.max(0,Math.min(end,Math.round(x))));}}/>;
}
