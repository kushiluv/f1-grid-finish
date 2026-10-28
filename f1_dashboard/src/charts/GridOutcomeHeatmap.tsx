import {useMemo} from 'react';
import type {Data, Layout, PlotMouseEvent} from 'plotly.js';
import type {DriverRace} from '../data/types';
import {heatmap} from '../data/metrics';
import {Plot,baseLayout,config,TEAL,AMBER,EmptyChart,useCompactChart} from './Plot';

export function GridOutcomeHeatmap({rows,selectedStart,highlightedDriverId,onSelect}:{rows:DriverRace[];selectedStart:number|null;highlightedDriverId:string;onSelect:(start:number,finish:number|null)=>void}) {
  const m=useMemo(()=>heatmap(rows),[rows]);
  const compact=useCompactChart();
  if(!m.denoms.some(Boolean))return <EmptyChart/>;
  const x=Array.from({length:22},(_,i)=>i+1);
  const data: Data[]=[{
    type:'heatmap',x,y:x,z:m.values.slice(0,22),zmin:0,zmax:1,
    colorscale:[[0,'#F1F5F4'],[.08,'#D1E8E5'],[.25,'#80BFBE'],[.5,'#278D94'],[1,'#084A54']],
    xgap:2,ygap:2,showscale:true,
    colorbar:{title:{text:'SHARE OF STARTS',side:'right',font:{size:10}},tickvals:[0,.25,.5,.75,1],ticktext:['0%','25%','50%','75%','100%'],thickness:10,len:.79,y:.60,outlinewidth:0,tickfont:{size:12}},
    customdata:m.counts.slice(0,22).map(row=>row.map((k,i)=>[k,m.denoms[i]])) as any,
    hovertemplate:'Started P%{x} → finished P%{y}<br><b>%{z:.1%}</b> · %{customdata[0]} of %{customdata[1]} starts<extra></extra>',
    hoverongaps:false,
  },{
    type:'heatmap',x,y:[0],z:[m.values[22]],xaxis:'x',yaxis:'y2',zmin:0,zmax:1,
    colorscale:[[0,'#F2F3F2'],[.25,'#C7CFCE'],[1,'#525F63']],showscale:false,xgap:2,ygap:0,
    customdata:[m.counts[22].map((k,i)=>[k,m.denoms[i]])] as any,
    hovertemplate:'Started P%{x} → did not finish / DSQ<br><b>%{z:.1%}</b> · %{customdata[0]} of %{customdata[1]} starts<extra></extra>',hoverongaps:false,
  }];
  if(highlightedDriverId){
    const rs=rows.filter(r=>r.driver_id===highlightedDriverId&&r.grid&&r.is_finisher&&r.finish);
    data.push({type:'scatter',mode:'markers',x:rs.map(r=>r.grid!),y:rs.map(r=>r.finish!),marker:{symbol:'circle-open',size:11,color:AMBER,line:{width:2}},hoverinfo:'skip'});
  }
  const layout:Partial<Layout>={...baseLayout,margin:{l:65,r:70,t:48,b:12},
    xaxis:{range:[.5,22.5],tickmode:'array',tickvals:[1,5,10,15,20,22],tickfont:{size:14},side:'top',constrain:'domain',fixedrange:true,showgrid:false,zeroline:false,title:{text:'STARTING POSITION  →',font:{size:12,color:'#6C797D'},standoff:12}},
    yaxis:{domain:[.12,1],range:[22.5,.5],scaleanchor:'x',scaleratio:1,constrain:'domain',tickvals:[1,5,10,15,20,22],ticktext:['1','5','10','15','20','22'],tickfont:{size:14},fixedrange:true,showgrid:false,zeroline:false,title:{text:'FINISHING POSITION',font:{size:12,color:'#6C797D'},standoff:13}},
    yaxis2:{domain:[.02,.07],range:[-.5,.5],tickvals:[0],ticktext:['DNF / DSQ'],tickfont:{size:12},fixedrange:true,showgrid:false,zeroline:false},
    shapes:[{type:'line',x0:1,y0:1,x1:22,y1:22,line:{color:'#087F8C',width:1.3,dash:'dot'},layer:'above'},...(selectedStart?[{type:'rect' as const,xref:'x' as const,yref:'paper' as const,x0:selectedStart-.5,x1:selectedStart+.5,y0:.01,y1:1,line:{color:AMBER,width:2},fillcolor:'transparent'}]:[])],
    annotations:[{x:22.5,y:22.4,xref:'x',yref:'y',text:'Same position',showarrow:false,xanchor:'right',yanchor:'top',font:{size:11,color:TEAL},bgcolor:'#fff'}],
  };
  if(compact){
    layout.margin={l:50,r:44,t:40,b:8};
    layout.xaxis={...layout.xaxis,tickvals:[1,5,10,15,20,22],tickfont:{size:11},title:{text:'STARTING POSITION →',font:{size:9},standoff:10}};
    layout.yaxis={...layout.yaxis,tickfont:{size:11},title:{text:'FINISH',font:{size:9},standoff:9}};
    layout.yaxis2={...layout.yaxis2,ticktext:['DNF / DSQ'],tickfont:{size:8}};
    (data[0] as any).colorbar={tickvals:[0,.5,1],ticktext:['0%','50%','100%'],thickness:7,len:.8,y:.6,outlinewidth:0,tickfont:{size:9}};
  }
  const click=(e:PlotMouseEvent)=>{const p=e.points[0];if(p&&typeof p.x==='number')onSelect(p.x,p.curveNumber===1?null:Number(p.y));};
  return <Plot className="plot" data={data} layout={layout} config={config} useResizeHandler style={{width:'100%',height:'100%'}} onClick={click}/>;
}
