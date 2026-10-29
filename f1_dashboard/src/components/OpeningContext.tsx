import {percent,fmt} from '../data/metrics';
import type {Summary} from '../data/types';
import {Icon} from './Icon';

function StartingGridIllustration(){
  return <div className="grid-illustration">
    <div className="grid-front"><span>FRONT OF THE GRID</span><Icon name="arrow" size={18}/></div>
    <svg viewBox="0 0 430 450" role="img" aria-labelledby="starting-grid-title starting-grid-desc">
      <title id="starting-grid-title">A simplified Formula 1 starting grid</title><desc id="starting-grid-desc">Twenty staggered starting places. P1 is first at the front. This illustration explains the grid, rather than depicting a particular race.</desc>
      <defs><pattern id="checkered" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#627176"/><rect x="10" y="10" width="10" height="10" fill="#627176"/></pattern></defs>
      <path d="M75 22V425M330 22V425" stroke="#829398" opacity=".18" strokeWidth="2"/>
      <rect x="75" y="15" width="255" height="12" fill="url(#checkered)" opacity=".5"/>
      <path d="M204 35V425" stroke="#829398" opacity=".15" strokeDasharray="6 10"/>
      {Array.from({length:20},(_,i)=>{const x=i%2===0?127:254,y=51+Math.floor(i/2)*35+(i%2)*13;return <g key={i} transform={`translate(${x},${y})`} className={i===0?'grid-car first':'grid-car'}>
        <path d="M-27 14h-9V-12h9" fill="none" stroke={i===0?'#F38D7B':'#66787E'} strokeWidth="1.5"/>
        <rect x="-10" y="-9" width="20" height="21" rx="5" fill={i===0?'#E15A46':'#61747A'}/><path d="M-7-14H7L10-9h-20zM-12 9h24v4h-24z" fill={i===0?'#F5C9BE':'#91A0A4'}/>
        <rect x="-15" y="-6" width="5" height="9" rx="1" fill="#111C21"/><rect x="10" y="-6" width="5" height="9" rx="1" fill="#111C21"/>
        <text x={i%2===0?-43:32} y="5" textAnchor={i%2===0?'end':'start'} fill={i===0?'#FFFFFF':'#A6B5B8'} fontSize={i===0?20:12} fontWeight={i===0?750:500}>P{i+1}</text>
      </g>;})}
      <path d="M148 51 168 38h25" stroke="#E97662" fill="none"/><text x="172" y="33" fill="#F4C6B9" fontSize="19" fontWeight="750">Pole position</text>
    </svg>

  </div>;
}

export function OpeningContext({stats,guess,revealed,onGuess,onReveal,onContinue,onSkip}:{stats:Summary;guess:number|null;revealed:boolean;onGuess:(n:number)=>void;onReveal:()=>void;onContinue:()=>void;onSkip:()=>void}){
  return <main id="main-content" className="opening-stage">
    <section className="opening-art"><StartingGridIllustration/></section>
    <section className="opening-copy">
      <img className="opening-f1-logo" src={`${import.meta.env.BASE_URL}assets/f1-logo.svg`} alt="Formula 1" width="164" height="44"/><h1>How does starting position relate to <em>the finishing result?</em></h1>
      <div className="context-steps"><div><b>01 / QUALIFYING</b><p>Drivers compete on timed laps for their starting places.</p></div><div><b>02 / THE GRID</b><p>The race lineup after penalties. Pole position is the front slot, P1.</p></div><div><b>03 / THE FINISH</b><p>The final race result. P1 is the winner; P10 is tenth.</p></div></div>
      {!revealed?<div className="prediction"><h2>How often does a driver win from pole position?</h2><p>Make an estimate</p><div className="guess-buttons" role="group" aria-label="Estimate the pole-position win rate">{[25,50,75].map(n=><button key={n} aria-pressed={guess===n} onClick={()=>onGuess(n)}>{n}%</button>)}</div><button className="primary-button" disabled={guess===null} onClick={onReveal}>Reveal the history<Icon name="arrow"/></button></div>:<div className="prediction revealed" role="status"><div className="reveal-top"><span className="section-kicker">THE HISTORY</span><span>Your estimate: {guess}%</span></div><div className="opening-value">{percent(stats.p1Rate)}</div><p className="reveal-explanation"><b>of drivers starting from pole position won the race.</b><br/>{stats.p1Wins} wins from {stats.p1Starts} actual P1 starts.</p><div className="proportion-bar" aria-hidden="true"><span style={{width:`${(stats.p1Rate??0)*100}%`}}/></div><p className="opening-transition">That is the front starter. What about the whole field?</p><button className="primary-button" onClick={onContinue}>Explore the pattern<Icon name="arrow"/></button></div>}
      {!revealed&&<button className="intro-skip" onClick={onSkip}>Skip to the evidence<Icon name="arrow" size={15}/></button>}
      <p className="opening-scope">2014–2025 · {fmt(stats.races)} Grands Prix · sprint results and Belgium 2021 excluded</p>
    </section>
  </main>;
}
