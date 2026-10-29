import type {Data,Layout} from 'plotly.js';
import type {RaceCase} from '../data/types';
import {Plot,baseLayout,config,TEAL,AMBER,PURPLE,LABEL,GRID,useCompactChart} from './Plot';
import {raceCarImage} from './raceCar';
export const DRIVER_COLORS=[TEAL,AMBER,PURPLE,'#697A8D'];

export function RaceTrace({race,showGasly,lap,reveal,onLap}:{race:RaceCase;showGasly:boolean;lap:number|null;reveal:boolean;onLap:(lap:number)=>void}) {
  const compact=useCompactChart();const end=reveal?(lap??0):race.laps;
  const traces=race.traces.slice(0,showGasly?4:3);
  const endpoint=traces.map(t=>t.points.find(p=>p.lap===(lap??end))!);
  const labelPositions=endpoint.map((p,i)=>({i,position:p.position})).sort((a,b)=>a.position-b.position);
  let previous=-1;
  const labels:number[]=[];
  labelPositions.forEach(p=>{labels[p.i]=Math.max(p.position,previous+1.5);previous=labels[p.i];});
  const data:Data[]=traces.map((t,i)=>({type:'scatter',mode:'lines',x:t.points.filter(p=>p.lap<=end).map(p=>p.lap),y:t.points.filter(p=>p.lap<=end).map(p=>p.position),name:t.label,
    marker:{size:12,color:DRIVER_COLORS[i],line:{color:'#fff',width:2}},line:{color:DRIVER_COLORS[i],width:i===0?4.5:3,shape:'hv',dash:i===1?'dash':i===2?'dot':'solid'},
    hovertemplate:`<b>${t.label}</b><br>Lap %{x} · P%{y}<extra></extra>`,
  }));

  const layout:Partial<Layout>={...baseLayout,margin:{l:compact?43:68,r:compact?12:20,t:16,b:48},hovermode:'x unified',
    images:traces.map((_,i)=>({source:raceCarImage(DRIVER_COLORS[i]),xref:'x',yref:'y',x:lap??end,y:endpoint[i].position,sizex:compact?5.0:3.3,sizey:1.15,xanchor:'center',yanchor:'middle',sizing:'contain',layer:'above'})),
    xaxis:{range:[-1,compact?91:84],tickvals:compact?[0,20,40,60,69]:[0,10,20,30,40,50,60,69],ticktext:compact?['Grid','20','40','60','69']:['Grid','10','20','30','40','50','60','69'],tickfont:{size:compact?11:14},fixedrange:true,showgrid:false,zeroline:false,title:{text:'LAP · OBSERVED LAP-END POSITIONS',font:{size:compact?9:12,color:'#607579'},standoff:13}},
    yaxis:{range:[20,.15],tickvals:[1,5,10,15,20],ticktext:['P1','P5','P10','P15','P20'],tickfont:{size:compact?11:15,color:LABEL},gridcolor:GRID,zeroline:false,fixedrange:true,title:{text:compact?'POSITION':'POSITION · FIRST AT TOP',font:{size:compact?9:12,color:LABEL},standoff:12}},
    shapes:[
      // This pale area denotes unrevealed time, never a projected trajectory.
      ...(reveal&&end<69?[{type:'rect' as const,xref:'x' as const,yref:'paper' as const,x0:end,x1:69,y0:0,y1:1,line:{width:0},fillcolor:'#F4F6F5',layer:'below' as const}]:[]),
      {type:'rect',xref:'x',yref:'y',x0:0,x1:69,y0:.5,y1:3.5,line:{width:0},fillcolor:'#EAF3F0',opacity:.6,layer:'below'},
      ...[11,43].filter(n=>n<=end).map(n=>({type:'line' as const,xref:'x' as const,yref:'paper' as const,x0:n,x1:n,y0:0,y1:1,line:{color:'#D1DDDA',width:1,dash:'dot' as const},layer:'below' as const})),
      ...race.control_events.filter(event=>event.band_end_lap!==undefined&&event.lap<=end).map(event=>({name:`control-${event.kind}-${event.lap}`,type:'rect' as const,xref:'x' as const,yref:'paper' as const,x0:event.lap,x1:Math.min(end,event.band_end_lap!),y0:0,y1:1,line:{width:0},fillcolor:event.kind==='red'?'#C5382D':'#C98D20',opacity:event.kind==='red'?.14:.12,layer:'below' as const})),
      ...race.control_events.filter(event=>event.band_end_lap!==undefined&&event.lap<=end).map(event=>({type:'line' as const,xref:'x' as const,yref:'paper' as const,x0:event.lap,x1:event.lap,y0:0,y1:1,line:{color:event.kind==='red'?'#C5382D':'#A46A18',width:1,dash:'dot' as const},layer:'below' as const})),
      ...(lap!==null?[{type:'line' as const,xref:'x' as const,yref:'paper' as const,x0:lap,x1:lap,y0:0,y1:1,line:{color:'#668689',width:1.2,dash:'dot' as const}}]:[])],
    annotations:[...traces.map((t,i)=>({x:lap??end,y:endpoint[i].position,xref:'x' as const,yref:'y' as const,text:`<b>${compact?t.label.slice(0,3).toUpperCase():t.label}</b> P${endpoint[i].position}`,showarrow:true,arrowhead:0,axref:'x' as const,ayref:'y' as const,ax:(lap??end)+(compact?3.2:2.5),ay:labels[i],xanchor:'left' as const,font:{color:DRIVER_COLORS[i],size:compact?11:15},arrowcolor:DRIVER_COLORS[i],arrowwidth:1,bgcolor:'#fff'})),
      ...(!reveal||end>=32?[{x:Math.min(32.5,end),y:1.025,xref:'x' as const,yref:'paper' as const,text:'RED FLAG',showarrow:false,font:{size:compact?9:11,color:'#B5362A'}}]:[]),
      {x:67.5,y:3.9,xref:'x',yref:'y',text:'TOP THREE',showarrow:false,xanchor:'right',yanchor:'top',font:{size:compact?8:10,color:'#64837E'}},
      ...(reveal&&end<60?[{x:(end+69)/2,y:15,xref:'x' as const,yref:'y' as const,text:compact?'Not yet revealed':'RACE NOT YET REVEALED',showarrow:false,font:{size:compact?10:12,color:'#849994'}}]:[]),
    ],
  };
  return <Plot className="plot race-plot" data={data} layout={layout} config={config} style={{width:'100%',height:'100%'}} onClick={e=>{const x=e.points[0]?.x;if(typeof x==='number')onLap(Math.max(0,Math.min(end,Math.round(x))));}}/>;
}
