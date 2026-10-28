import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import type {Layout, Config} from 'plotly.js';
import type {PlotParams} from 'react-plotly.js';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';

const PlotlyChart = createPlotlyComponent(Plotly);
export function Plot(props:PlotParams){
  const ref=useRef<HTMLDivElement>(null);
  const [size,setSize]=useState({width:0,height:0});
  useLayoutEffect(()=>{
    const el=ref.current;if(!el)return;
    const resize=()=>{const r=el.getBoundingClientRect();setSize(old=>old.width===Math.round(r.width)&&old.height===Math.round(r.height)?old:{width:Math.round(r.width),height:Math.round(r.height)});};
    const observer=new ResizeObserver(resize);observer.observe(el);resize();return()=>observer.disconnect();
  },[]);
  const {style,className,...other}=props;
  return <div ref={ref} className={className} style={{position:'relative',minHeight:0,...style}}>{size.width>0&&size.height>0&&<PlotlyChart {...other} layout={{...props.layout,autosize:false,width:size.width,height:size.height}} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>}</div>;
}
export function useCompactChart(){
  const [compact,setCompact]=useState(()=>innerWidth<760);
  useEffect(()=>{const media=matchMedia('(max-width:759px)');const update=()=>setCompact(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  return compact;
}
export const INK='#202A30', TEAL='#087F8C', AMBER='#A46A18', PURPLE='#79609B', MUTED='#759398';
export const GRID='#E7EDEB', LABEL='#50686E';
// A fixed sequential scale across all cohorts: make small concentrations legible
// while retaining a literal 0–100% legend and a distinct measured zero.
export const SHARE_COLORS: [number,string][] = [[0,'#F1F5F4'],[.04,'#D6E7E3'],[.12,'#95C6C0'],[.25,'#4A9D9D'],[.5,'#14727E'],[1,'#073C48']];
export const config: Partial<Config> = {responsive:true,displayModeBar:false,scrollZoom:false,displaylogo:false};
export const baseLayout: Partial<Layout> = {
  autosize:true,paper_bgcolor:'transparent',plot_bgcolor:'transparent',
  font:{family:'Arial, Helvetica, sans-serif',color:INK,size:15},
  margin:{l:70,r:35,t:45,b:45},
  hoverlabel:{bgcolor:INK,font:{color:'#fff',size:14},bordercolor:INK},
  showlegend:false,dragmode:false,
};
export function EmptyChart({text='No eligible starts in this selection.'}:{text?:string}) {
  return <div className="empty-chart"><span className="empty-grid">↗</span><h3>No comparison available</h3><p>{text}</p><p>Try another period or reset the filters.</p></div>;
}
