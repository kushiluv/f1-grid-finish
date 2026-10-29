import {useMemo} from 'react';
import type {DriverRace} from '../data/types';
import {bandStats,circuitStats,percent,decimal,fmt} from '../data/metrics';
import {Icon} from './Icon';

export function ImpactConclusion({rows,onExplore,onReplay}:{rows:DriverRace[];onExplore:()=>void;onReplay:()=>void}){
 const evidence=useMemo(()=>{
  const all=rows.filter(r=>!r.exclude_no_green_racing),circuits=circuitStats(all);
  return {back:bandStats(all,'top10')[4],monaco:circuits.find(c=>c.id==='monaco')!,hungaroring:circuits.find(c=>c.id==='hungaroring')!,yas:circuits.find(c=>c.id==='yas-marina')!};
 },[rows]);
 const {back,monaco,hungaroring,yas}=evidence;
 const X=(value:number)=>24+value/3*312;
 return <main id="main-content" className="impact-stage closing-stage concise-impact">
  <div className="impact-heading"><p className="section-kicker">POTENTIAL IMPACT</p><h1>Three practical uses of the evidence</h1><p>Starting position provides a baseline. The race context helps turn it into a useful question.</p></div>
  <div className="decision-grid">
   <article className="decision-column strategy-decision">
    <header><span>01 / TEAM STRATEGY</span><h2>Set a recovery goal</h2></header>
    <div className="decision-visual">
     <p className="impact-chart-label">Top-ten finishes from P16–22</p>
     <div className="decision-number"><strong>{percent(back.rate)}</strong><span>reached<br/>the top ten</span></div>
     <div className="waffle" role="img" aria-label={`${percent(back.rate)} of starts from P16–22 reached the top ten; each cell is one percentage point`}>{Array.from({length:100},(_,i)=><i key={i} style={{background:`linear-gradient(to right, #087f8c ${Math.max(0,Math.min(1,(back.rate??0)*100-i))*100}%, #E5ECE8 0%)`}}/>)}</div>
     <p className="impact-visual-key"><i className="key-square"/>Top ten<span>100 cells = 100%</span></p>
     <p className="decision-sample">{fmt(back.k)} of {fmt(back.n)} starts</p>
    </div>
    <div className="decision-use"><b>Use it to</b><p>Set a realistic target before weighing strategy risks.</p></div>
   </article>
   <article className="decision-column design-decision">
    <header><span>02 / CIRCUIT PLANNING</span><h2>Prioritise track reviews</h2></header>
    <div className="decision-visual">
     <p className="impact-chart-label">Average places changed · P1–10 starters</p>
     <svg className="movement-summary" viewBox="0 0 360 170" role="img" aria-label={`Monaco: ${decimal(monaco.movement.meanAbsolute)} places changed across ${monaco.movement.n} results. Hungaroring: ${decimal(hungaroring.movement.meanAbsolute)} across ${hungaroring.movement.n}. Top-ten starters who finished; average absolute grid-to-finish change.`}>
      <title>Average position change: Monaco and Hungaroring</title>
      <line x1={X(0)} x2={X(3)} y1="108" y2="108" stroke="#DFE7E2" strokeWidth="4"/>
      <path className="movement-link" pathLength="1" d={`M${X(monaco.movement.meanAbsolute!)} 108 H${X(hungaroring.movement.meanAbsolute!)}`} stroke="#A46A18" strokeWidth="4" fill="none"/>
      {[monaco,hungaroring].map((c,i)=><g key={c.id} className={i?'movement-hungaroring':'movement-monaco'}>
       <text className="movement-name" x={X(c.movement.meanAbsolute!)} y="22" textAnchor="middle">{c.name}</text>
       <text className="movement-value" x={X(c.movement.meanAbsolute!)} y="57" textAnchor="middle">{decimal(c.movement.meanAbsolute)}</text>
       <text className="movement-sample" x={X(c.movement.meanAbsolute!)} y="78" textAnchor="middle">{c.movement.n} finishes</text>
       <circle cx={X(c.movement.meanAbsolute!)} cy="108" r="8" stroke="white" strokeWidth="2"/>
      </g>)}
      {[0,1,2,3].map(t=><g key={t}><line x1={X(t)} x2={X(t)} y1="120" y2="125" stroke="#8CA29F"/><text className="movement-tick" x={X(t)} y="145" textAnchor="middle">{t}</text></g>)}
      <text className="movement-axis" x="180" y="166" textAnchor="middle">AVERAGE PLACES CHANGED</text>
     </svg>
     <p className="decision-sample">Finishers only. Gains and losses both count.</p>
    </div>
    <div className="decision-use"><b>Use it to</b><p>Focus a review of overtaking opportunities and track layout.</p></div>
   </article>
   <article className="decision-column forecast-decision">
    <header><span>03 / BETTING ANALYSIS</span><h2>Account for the circuit</h2></header>
    <div className="decision-visual">
     <p className="impact-chart-label">Pole starts that ended in a win</p>
     <div className="pole-samples" role="img" aria-label={`${monaco.name}: ${monaco.p1Wins} wins from ${monaco.p1Starts} pole starts. ${yas.name}: ${yas.p1Wins} wins from ${yas.p1Starts}. One square is one pole start; filled squares are wins.`}>
      {[monaco,yas].map(c=><div className="pole-sample" key={c.id}>
       <div className="pole-sample-label"><span>{c.name}</span><strong>{c.p1Wins}<small> of {c.p1Starts}</small></strong></div>
       <div className="pole-tiles" aria-hidden="true">{Array.from({length:c.p1Starts},(_,i)=><i key={i} className={i<c.p1Wins?'pole-tile won':'pole-tile'} style={{animationDelay:`${260+i*28}ms`}}/>)}</div>
      </div>)}
     </div>
     <p className="impact-visual-key"><i className="key-square pole-key"/>Win<span>One square = one pole start</span></p>
    </div>
    <div className="decision-use"><b>Use it to</b><p>Assess pole position in its circuit context before comparing odds.</p></div>
   </article>
  </div>
  <div className="impact-bottom"><p>2014–2025 · F1DB · Historical patterns need current race context; position changes do not count overtakes.</p><button className="text-button" onClick={onExplore}>Explore the evidence<Icon name="arrow" size={16}/></button><button className="text-button" onClick={onReplay}><Icon name="reset" size={15}/>Replay</button></div>
 </main>;
}
