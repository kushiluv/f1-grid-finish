import {useEffect,useMemo,useState} from 'react';
import type {AppState,Bundle,Chapter,DriverRace,Outcome} from './data/types';
import {BANDS,OUTCOMES,bandStats,circuitStats,circuitLabel,decimal,fmt,gridStarts,percent,selectBase,summarize} from './data/metrics';
import {CHAPTERS,preset,readState} from './state';
import {adjacentStep,CHECKPOINTS,CHECKPOINT_NAMES,firstStep,NEXT_LABEL,readStory,readPresentationState,stateForStep,storyUrl,type StoryStep} from './presentation';
import {GridOutcomeHeatmap} from './charts/GridOutcomeHeatmap';
import {CircuitComparison} from './charts/CircuitComparison';
import {CircuitMovement} from './charts/CircuitMovement';
import {ImpactConclusion} from './components/ImpactConclusion';
import {RECOVERY_ORDER,OUTCOME_COLORS,RecoveryBars} from './charts/RecoveryBars';
import {RaceTrace,DRIVER_COLORS} from './charts/RaceTrace';
import {Icon} from './components/Icon';
import {Modal} from './components/Modal';
import {Methods} from './components/Methods';
import {Records} from './components/Records';
import {OpeningContext} from './components/OpeningContext';
import {RaceControlNote} from './components/RaceControlNote';
import {useRaceAudio} from './components/useRaceAudio';
import Plotly from 'plotly.js-dist-min';

const titles:Record<Chapter,{title:string;description:string;chart:string}>={
  overview:{title:'Correlation between starting and finishing position',description:'Better starts tend to accompany better finishes. The exact order still changes.',chart:'Where do drivers finish from each starting place?'},
  circuits:{title:'How much does race order change by circuit?',description:'',chart:'Starting order and wins from pole'},
  recovery:{title:'Ability to recover',description:'Starting at the back still leaves a route to the top ten. How often does it happen?',chart:'Three outcomes from each starting group.'},
  case:{title:'One winner from the back. Follow the race.',description:'São Paulo, Brazil · 2024. A deliberately selected exception, one observed lap at a time.',chart:'From the starting grid to the finish'},
};
const speakerNotes:Record<Chapter,string[]>={
  overview:['Explain that lower position numbers are better. Each column contains starts from one grid place.','The dark diagonal shows a strong relationship: r ≈ 0.76. It does not mean 76% accuracy.','Only 17.3% of finishers kept exactly the same place. A strong association still leaves room for position changes.','Select P17 to connect the pattern with the next question: can a driver at the back still reach the top ten?'],
  recovery:['Top ten draws automatically on entry. Read the first row, P16–22: 167 top-ten finishes from 1,185 starts, or 14.1%.','Press Reveal podium, then Reveal wins. The same starts produced 12 podiums and one win. Previous outcomes remain on the shared scale; their markers are offset vertically, not stacked.','Move down the groups to show how outcomes become more frequent nearer the front. These are historical groups, not individual forecasts. Click a revealed legend to replay its animation.','The one back-group win was São Paulo 2024. First, compare circuits to see why location also matters.'],
  circuits:['Read the two aligned panels: start–finish correlation on the left and pole-win rate on the right. Select a circuit to inspect its exact values and mean position change.','Reveal wins from pole, then select Yas Marina: Monaco is r = 0.86 and 6/10 wins; Yas Marina is r = 0.79 and 11/12. All measures stay visible together.','Press Compare position change to draw the movement bars. Compare P1–10 starters who finished: Monaco 1.31, São Paulo 1.95, Hungaroring 2.38. These are mean absolute changes, so gains and losses do not cancel.','Monaco and Hungaroring are the smallest and largest movement averages among 19 eligible circuits. This is not an overtake count or a causal track-design ranking. Move to São Paulo’s P17 exception.'],
  case:['At the grid, introduce Verstappen P17, Norris P1 and Ocon P4. Verstappen qualified 12th before a five-place penalty.','Press Play race at 1×. Amber bands mark safety-car or VSC milestones; red marks the stoppage. The race-control note updates with brief holds at the key events. Explain early recovery, restart order at lap 33 and the lap-43 change of leader after the second safety car.','Pause when needed. The car symbols mark observed lap-end ranks, not live car locations; future observations stay hidden.','At lap 69, Verstappen is P1, Ocon P2 and Norris P6. This selected exception illustrates possibilities, not a typical back-row outcome. Next, show the three practical uses.'],
};

export default function App(){
  const [bundle,setBundle]=useState<Bundle|null>(null),[error,setError]=useState('');
  useEffect(()=>{let live=true;const base=import.meta.env.BASE_URL;Promise.all(['driver_race','evidence','uncertainty','race_case','provenance','grid_audit'].map(name=>fetch(`${base}data/${name}.json`).then(r=>{if(!r.ok)throw new Error(`Could not load ${name}`);return r.json();}))).then(([rows,evidence,uncertainty,raceCase,provenance,audit])=>{if(live)setBundle({rows,evidence,uncertainty,raceCase,provenance,audit});}).catch(e=>setError(String(e)));return()=>{live=false;};},[]);
  if(error)return <div className="load-state"><h1>The data could not be loaded.</h1><p>{error}</p><p>Start the app with the included local server, then reload.</p><button onClick={()=>location.reload()}>Reload</button></div>;
  if(!bundle)return <div className="load-state"><div className="loading-mark">G<span>/</span>F</div><p>Loading twelve seasons of race history…</p></div>;
  return <Dashboard bundle={bundle}/>;
}

function Dashboard({bundle}:{bundle:Bundle}){
  const [story,setStory]=useState<StoryStep>(()=>readStory(location.search));
  const [s,setS]=useState<AppState>(()=>{const initial=readState(location.search,bundle.rows);return initial.mode==='present'?readPresentationState(location.search):initial;});
  const [guess,setGuess]=useState<number|null>(null),[introRevealed,setIntroRevealed]=useState(false);
  const [modal,setModal]=useState<'methods'|'records'|'notes'|null>(null);
  const [detailRows,setDetailRows]=useState<DriverRace[]>([]),[detailTitle,setDetailTitle]=useState('');
  const [cell,setCell]=useState<{start:number;finish:number|null}|null>(null);
  const [filters,setFilters]=useState(false),[circuitMenu,setCircuitMenu]=useState(false),[limited,setLimited]=useState(false),[selectedCircuit,setSelectedCircuit]=useState(()=>'monaco');
  const [notice,setNotice]=useState('');
  const [playing,setPlaying]=useState(false),[playSpeed,setPlaySpeed]=useState(2);
  const present=s.mode==='present',intro=present&&story==='intro',closing=present&&story==='closing',analysis=!intro&&!closing;
  const base=useMemo(()=>selectBase(bundle.rows,s),[bundle.rows,s.years,s.circuitIds,s.cohortDriverId,s.cohortConstructorId,s.includeBelgium2021]);
  const stats=useMemo(()=>summarize(base),[base]);
  const openingStats=useMemo(()=>summarize(selectBase(bundle.rows,preset('overview'))),[bundle.rows]);
  const starts=useMemo(()=>gridStarts(base),[base]);
  const cs=useMemo(()=>circuitStats(base),[base]);
  const top10=useMemo(()=>bandStats(base,'top10'),[base]),podiums=useMemo(()=>bandStats(base,'podium'),[base]),wins=useMemo(()=>bandStats(base,'win'),[base]);
  const activeBand=({top10,podium:podiums,win:wins})[s.outcome][s.selectedBand];
  const bandWins=wins[s.selectedBand];
  const soleWinner=bandWins.k===1?bandWins.rows.find(r=>r.finish===1):undefined;
  const defaultScope=s.years[0]===2014&&s.years[1]===2025&&!s.circuitIds.length&&!s.cohortDriverId&&!s.cohortConstructorId&&!s.includeBelgium2021;
  const bridge=defaultScope&&s.selectedBand===4&&soleWinner?.race_id===bundle.rows.find(r=>r.year===2024&&r.grand_prix_id==='sao-paulo')?.race_id;
  const hasCohort=!!(s.cohortDriverId||s.cohortConstructorId);
  const index=CHAPTERS.findIndex(c=>c.id===s.chapter);
  const showWinner=!present||story==='circuits-both';
  const movement=s.chapter==='circuits'&&s.circuitMetric==='movement';
  const recoveryReveal:Outcome|undefined=present?(story==='recovery-win'?'win':story==='recovery-podium'?'podium':'top10'):undefined;
  const recoveryOutcomes=Object.keys(OUTCOMES) as Outcome[];
  const recoveryVisible=(o:Outcome)=>!recoveryReveal||recoveryOutcomes.indexOf(o)<=recoveryOutcomes.indexOf(recoveryReveal);
  const period=!s.includeBelgium2021&&(s.years[0]===2014||s.years[0]===2022)&&s.years[1]===2025?`${s.years[0]}-2025`:null;
  const circuits=useMemo(()=>[...new Map(bundle.rows.map(r=>[r.circuit_id,circuitLabel(r.circuit_id,r.circuit_name)])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[bundle.rows]);
  const drivers=useMemo(()=>[...new Map(bundle.rows.map(r=>[r.driver_id,r.driver_name])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[bundle.rows]);
  const teams=useMemo(()=>[...new Set(bundle.rows.map(r=>r.constructor_id))].sort(),[bundle.rows]);
  const availableCircuits=cs.filter(c=>present||limited||c.races>=8);
  const scopedCircuit=availableCircuits.find(c=>c.id===selectedCircuit)||availableCircuits[0];
  const scope=s.chapter==='case'?'São Paulo 2024 · fixed case study':`${s.years.join('–')} · ${!s.circuitIds.length?'All circuits':s.circuitIds.length===1?circuits.find(c=>c[0]===s.circuitIds[0])?.[1]:`${s.circuitIds.length} circuits`}${hasCohort?' · filtered cohort':''}`;
  const cellRows=cell?starts.filter(r=>r.grid===cell.start&&(cell.finish===null?!r.is_finisher:r.is_finisher&&r.finish===cell.finish)):[];
  const caseLap=s.caseLap??69;
  const winningMoveLap=useMemo(()=>{
    const points=bundle.raceCase.traces[0].points;
    return points.find((point,i)=>i>0&&point.position===1&&points[i-1].position!==1)?.lap??43;
  },[bundle.raceCase]);
  const raceAudio=useRaceAudio({active:s.chapter==='case',lap:caseLap,playing,cueLap:winningMoveLap,finishLap:bundle.raceCase.laps,blocked:modal!==null});
  const caseEvent=bundle.raceCase.events.find(e=>e.lap===caseLap);
  const fullCircuitScope=s.years[0]===2014&&s.years[1]===2025&&!hasCohort&&!s.includeBelgium2021;
  const patch=(p:Partial<AppState>)=>setS(v=>({...v,...p}));
  function activate(step:StoryStep){setPlaying(false);if(step==='circuits-field')setSelectedCircuit('monaco');setStory(step);setS(previous=>{const next=stateForStep(step);if(previous.chapter==='recovery'&&next.chapter==='recovery')next.selectedBand=previous.selectedBand;return next;});setCell(null);setCircuitMenu(false);setFilters(false);setLimited(false);if(step==='intro'){setGuess(null);setIntroRevealed(false);}}
  function go(chapter:Chapter){setPlaying(false);if(present)activate(firstStep(chapter));else{patch({chapter,selectedStart:null,caseLap:null,caseEvent:null});setCell(null);setCircuitMenu(false);}}
  function explore(){setPlaying(false);setS(preset('overview','explore'));setStory('overview');setFilters(true);}
  function next(){setPlaying(false);if(!present){if(index===3){setStory('closing');setS(preset('overview'));}else go(CHAPTERS[index+1].id);return;}activate(adjacentStep(story,1));}
  function back(){setPlaying(false);if(present)activate(adjacentStep(story,-1));else if(index>0)go(CHAPTERS[index-1].id);}
  function reset(){setPlaying(false);if(present)activate(firstStep(s.chapter));else{setS(preset(s.chapter,'explore'));setLimited(false);setFilters(false);setCircuitMenu(false);setCell(null);}}
  function chooseOutcome(outcome:Outcome){if(recoveryVisible(outcome))patch({outcome});}
  function chooseBand(selectedBand:number){patch({selectedBand});}
  function chooseCircuitMetric(metric:AppState['circuitMetric']){if(!present)patch({circuitMetric:metric});else if(metric==='movement')activate('circuits-movement');else if(movement)activate('circuits-both');}
  function setRaceLap(lap:number){if(present){const cp=[...CHECKPOINTS].reverse().find(n=>n<=lap)??0;setStory(cp===0?'case-grid':`case-${cp}` as StoryStep);}patch({caseLap:lap,caseEvent:null});}
  function inspectLap(lap:number){setPlaying(false);setRaceLap(lap);}
  function togglePlayback(){if(playing){setPlaying(false);return;}raceAudio.prepare();if(caseLap>=69)setRaceLap(0);setPlaying(true);}
  useEffect(()=>{
    if(!playing)return;
    if(s.chapter!=='case'||modal||caseLap>=69){setPlaying(false);return;}
    const delay=([11,33,43].includes(caseLap)?1900:bundle.raceCase.control_events.some(event=>event.lap===caseLap)?1200:550)/playSpeed;
    const timer=setTimeout(()=>setRaceLap(caseLap+1),delay);return()=>clearTimeout(timer);
  },[playing,s.chapter,caseLap,playSpeed,modal,present,bundle.raceCase.control_events]);
  useEffect(()=>{const pause=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause);},[]);
  function records(rows:DriverRace[],title:string){setDetailRows(rows);setDetailTitle(title);setModal('records');}
  useEffect(()=>{history.replaceState(null,'',storyUrl(s,story));},[s,story]);
  useEffect(()=>{const pop=()=>{setPlaying(false);const state=readState(location.search,bundle.rows),step=readStory(location.search);setS(state.mode==='present'?readPresentationState(location.search):state);setStory(step);setCell(null);};addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop);},[bundle.rows]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(modal||!present||intro||closing||(e.target as HTMLElement)?.closest('input,select,textarea,button,[role="tablist"]'))return;if(e.key==='ArrowRight'){e.preventDefault();next();}if(e.key==='ArrowLeft'){e.preventDefault();back();}};addEventListener('keydown',key);return()=>removeEventListener('keydown',key);});
  useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(id);},[notice]);
  async function share(){try{await navigator.clipboard.writeText(location.href);setNotice('Link copied with the current chapter and filters.');}catch{setNotice('Copy the address from your browser to share this view.');}}
  async function exportChart(){
    try{
      const el=document.querySelector('.chart-main .js-plotly-plot') as any;if(!el)return;
      const stage=s.chapter==='case'?` · ${present||s.caseLap!==null?`through ${caseLap===0?'the grid':`lap ${caseLap}`}`:'full race'}`:movement?' · mean absolute position change among P1–10 starters who finished':s.chapter==='circuits'&&!showWinner?' · correlation only; pole wins not yet revealed':s.chapter==='recovery'&&recoveryReveal?` · revealed: ${recoveryOutcomes.filter(recoveryVisible).map(o=>OUTCOMES[o].label.toLowerCase()).join(', ')}`:'';
      // Export has its own title row. Keep panel headings close to the plot so
      // their paper-relative offset cannot collide with that title at 1600px.
      const annotations=(el.layout.annotations||[]).map((a:any)=>(s.chapter==='circuits'||s.chapter==='recovery')&&a.yref==='paper'&&a.y>1?{...a,y:1.02}:a);
      const layout={...el.layout,width:1600,height:1000,paper_bgcolor:'#FFFFFF',plot_bgcolor:'#FFFFFF',title:{text:chartTitle,font:{size:24},x:.05,y:.98,yanchor:'top'},margin:{...el.layout.margin,t:130,b:140},annotations:[...annotations,{text:`${scope}${stage} · ${s.chapter==='case'?'Jolpica / OpenF1 / FIA':'F1DB v2025.24.0 + documented corrections'}<br>Grid / Finish · BAIT 518 · Group 3 · BA2 · ${s.chapter==='case'?'Verified lap-end positions<br>Amber: safety car / VSC · Red: red-flag stoppage · Selected race-control milestones':s.chapter==='recovery'?`${fmt(stats.starts)} eligible starts including retirements · top ten / podium / win overlap; do not add rates`:`${fmt(stats.starts)} eligible starts · ${fmt(stats.finishers)} finishers for correlation`}`,xref:'paper',yref:'paper',x:0,y:s.chapter==='case'?-.10:-.13,xanchor:'left',yanchor:'top',showarrow:false,font:{size:13,color:'#526267'}}]};
      if(s.chapter==='recovery'){layout.showlegend=true;layout.legend={...layout.legend,y:1.04,font:{size:15}};}
      if(s.chapter==='overview')layout.annotations.push({text:`Focus: ${document.querySelector('.heatmap-lenses [aria-pressed="true"]')?.textContent} · original column denominators retained`,xref:'paper',yref:'paper',x:0,y:1.1,xanchor:'left',showarrow:false,font:{size:13,color:'#526267'}});
      const url=await Plotly.toImage({data:el.data,layout} as any,{format:'png',width:1600,height:1000});const a=document.createElement('a');a.href=url;a.download=`grid-finish-${s.chapter}${s.chapter==='case'&&(present||s.caseLap!==null)?`-lap-${caseLap}`:''}.png`;a.click();setNotice('Chart saved with scope, stage and attribution.');
    }catch{setNotice('Use your browser’s Print command to save this view.');}
  }
  const emptyOverview=s.chapter==='overview'&&(hasCohort||stats.r===null||(stats.r??0)<.65);
  const chartTitle=movement?'Average position change · top-ten starters':titles[s.chapter].chart;
  const headline=emptyOverview?'How closely does this grid follow the finish?':titles[s.chapter].title;
  const footerLabel=present?NEXT_LABEL[story]:index===3?'Potential impact':`Next: ${CHAPTERS[index+1].name.toLowerCase()}`;
  const caseDescription=caseLap===0?'Verstappen qualified 12th; a five-place power-unit penalty put him P17. Norris started P1 and Ocon P4.':caseLap===33?'After pit visits and a red-flag pause, Ocon led. Verstappen was second, Norris fourth.':caseLap===43?'At the restart, Verstappen passed Ocon for the lead. At the end of lap 43, Norris was seventh.':caseEvent?.description??(caseLap===69?'Verstappen won from 17th. Norris started first and finished sixth. Ocon finished second.':`Positions at the end of lap ${caseLap}. These are observed classifications, not continuous on-track distances.`);

  return <div className={`app-shell ${present?'present':'explore'} ${intro?'screen-intro':closing?'screen-closing':`chapter-${s.chapter}`}`}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="topbar"><a className="brand" href="?step=intro" onClick={e=>{e.preventDefault();activate('intro');}} aria-label="Replay the introduction"><svg width="30" height="26" viewBox="0 0 30 26" aria-hidden="true"><path d="M1 23 16 3h13L14 23z" fill="#D9503C"/><path d="M13 23 28 3h-6L7 23z" fill="#fff"/></svg><span>GRID<span className="brand-slash">/</span>FINISH</span></a><div className="topbar-right"><span className="group-tag">GROUP 3 <i/> BA2</span><div className="mode-switch" role="group" aria-label="Dashboard mode"><button aria-pressed={present} onClick={()=>{setPlaying(false);if(!present){activate(firstStep(s.chapter));setNotice('Presentation preset loaded. Explore filters have been reset.');}}}>Present</button><button aria-pressed={!present} onClick={()=>{setPlaying(false);if(present){setS(v=>({...v,mode:'explore',caseLap:null,caseEvent:null}));setFilters(false);}}}>Explore</button></div><button className="top-icon" aria-label="Toggle full screen" onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.();}}><Icon name="expand"/></button></div></header>
    {analysis&&<nav className="story-nav" aria-label="Story chapters">{CHAPTERS.map((c,i)=><button key={c.id} onClick={()=>go(c.id)} className={s.chapter===c.id?'active':''} aria-current={s.chapter===c.id?'step':undefined}><span className="step-number">0{i+1}</span><b>{['The pattern','Ability to recover','The circuit','The race'][i]}</b><span className="nav-detail">{['Grid → finish','Three outcomes','Order and movement','São Paulo 2024'][i]}</span><Icon name={['grid','target','track','flag'][i]} size={18}/></button>)}</nav>}
    {intro&&<OpeningContext stats={openingStats} guess={guess} revealed={introRevealed} onGuess={setGuess} onReveal={()=>setIntroRevealed(true)} onContinue={()=>activate('overview')} onSkip={()=>activate('overview')}/>}
    {closing&&<ImpactConclusion rows={bundle.rows} onExplore={explore} onReplay={()=>activate('intro')}/>}
    {analysis&&<main id="main-content">
      <section className="chapter-heading"><div><h1>{headline}</h1>{s.chapter!=='circuits'&&<p className="chapter-description">{emptyOverview?'Inspect the outcomes and sample size for the current selection.':titles[s.chapter].description}</p>}</div><div className="scope-block"><strong><i/>{s.chapter==='case'?'SÃO PAULO · 2024':s.years.join(' — ')}</strong><span>{s.chapter==='case'?`${present&&caseLap<69?'Revealed through '+(caseLap===0?'the starting grid':'lap '+caseLap):'69 laps · documented exception'}`:`${fmt(stats.races)} races · ${fmt(stats.starts)} grid starts`}</span>{!present&&<button className="text-button" onClick={()=>setFilters(v=>!v)} aria-expanded={filters}>{filters?'Hide filters':'Edit selection'}<Icon name="down" size={13}/></button>}</div></section>
      {!present&&filters&&<section className="filter-panel" aria-label="Explore filters">
        {s.chapter==='case'?<p className="pinned-case">This chapter is pinned to São Paulo 2024. Other chapters retain your global filters.</p>:<>
          <label>From<select aria-label="From year" value={s.years[0]} onChange={e=>patch({years:[Number(e.target.value),Math.max(Number(e.target.value),s.years[1])]})}>{Array.from({length:12},(_,i)=>2014+i).map(y=><option key={y}>{y}</option>)}</select></label>
          <label>Through<select aria-label="Through year" value={s.years[1]} onChange={e=>patch({years:[Math.min(s.years[0],Number(e.target.value)),Number(e.target.value)]})}>{Array.from({length:12},(_,i)=>2014+i).map(y=><option key={y}>{y}</option>)}</select></label>
          <div className="circuit-filter"><span className="field-label">Circuits</span><button className="select-button" onClick={()=>setCircuitMenu(v=>!v)} aria-expanded={circuitMenu}>{s.circuitIds.length?`${s.circuitIds.length} selected`:'All circuits'}<Icon name="down" size={14}/></button>{circuitMenu&&<div className="circuit-menu"><button className="text-button" onClick={()=>patch({circuitIds:[]})}>Select all circuits</button>{circuits.map(([id,name])=><label key={id}><input type="checkbox" checked={s.circuitIds.includes(id)} onChange={e=>patch({circuitIds:e.target.checked?[...s.circuitIds,id]:s.circuitIds.filter(x=>x!==id)})}/>{name}</label>)}<button className="primary-button" onClick={()=>setCircuitMenu(false)}>Done</button></div>}</div>
          <label>Team cohort<select aria-label="Filter cohort by team" value={s.cohortConstructorId} onChange={e=>patch({cohortConstructorId:e.target.value})}><option value="">All teams</option>{teams.map(t=><option value={t} key={t}>{t.replaceAll('-',' ')}</option>)}</select></label>
          <label>Driver cohort<select aria-label="Filter cohort by driver" value={s.cohortDriverId} onChange={e=>patch({cohortDriverId:e.target.value})}><option value="">All drivers</option>{drivers.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select></label>
          <label className="check-label"><input type="checkbox" checked={s.includeBelgium2021} onChange={e=>patch({includeBelgium2021:e.target.checked})}/>Include Belgium 2021</label>
        </>}<button className="text-button" onClick={reset}><Icon name="reset" size={15}/>Reset</button>
      </section>}
      {!present&&<div className="filter-chips"><span>{scope}</span>{s.cohortDriverId&&<span>{drivers.find(d=>d[0]===s.cohortDriverId)?.[1]}</span>}{s.cohortConstructorId&&<span>{s.cohortConstructorId.replaceAll('-',' ')}</span>}{s.chapter!=='case'&&<button className="pit-chip" onClick={()=>records(base.filter(r=>r.is_starter&&r.grid_text==='PL'),'Pit-lane starts · outside numeric-grid metrics')}>{base.filter(r=>r.is_starter&&r.grid_text==='PL').length} pit-lane starts · inspect</button>}<button className="text-button" onClick={share}><Icon name="share" size={13}/>Share view</button></div>}
      <section className="workspace"><article className="chart-card"><header className="chart-header"><div><h2>{chartTitle}</h2></div><button className="icon-button" onClick={exportChart} aria-label="Save chart as PNG" title="Save current chart with attribution"><Icon name="download" size={18}/></button></header>
        {s.chapter==='circuits'&&<div className="chart-controls circuit-view-tabs"><div className="outcome-tabs" role="group" aria-label="Circuit view"><button aria-pressed={!movement} onClick={()=>chooseCircuitMetric('order')}>Order &amp; pole wins</button><button aria-pressed={movement} onClick={()=>chooseCircuitMetric('movement')}>Position change · P1–10</button></div></div>}
        {s.chapter==='circuits'&&!present&&<div className="chart-controls"><label className="check-label"><input type="checkbox" checked={limited} onChange={e=>setLimited(e.target.checked)}/>Include limited histories</label><span>{period&&!hasCohort?'Intervals for this exact period':'Custom cohort · point estimates only'}</span></div>}
        {s.chapter==='case'&&!present&&<div className="chart-controls race-legend">{bundle.raceCase.traces.slice(0,s.showGasly?4:3).map((t,i)=><span key={t.driver_id}><i style={{background:DRIVER_COLORS[i]}}/>{t.label}</span>)}{!present&&<label className="check-label gasly-toggle"><input type="checkbox" checked={s.showGasly} onChange={e=>patch({showGasly:e.target.checked})}/>Add Gasly</label>}</div>}
        <div className="chart-main" aria-label={chartTitle}>
          {s.chapter==='overview'&&<GridOutcomeHeatmap rows={base} selectedStart={s.selectedStart} highlightedDriverId={s.highlightedDriverId} onSelect={(start,finish)=>{patch({selectedStart:start});setCell({start,finish});}}/>}
          {s.chapter==='circuits'&&(movement?<CircuitMovement rows={base} present={present} showLimited={limited} selectedCircuit={selectedCircuit} onSelect={setSelectedCircuit}/>:<CircuitComparison rows={base} uncertainty={bundle.uncertainty} period={period} hasCohort={hasCohort} showLimited={limited} present={present} selectedCircuit={selectedCircuit} showWinner={showWinner} onSelect={setSelectedCircuit} onReveal={()=>activate('circuits-both')}/>)}
          {s.chapter==='recovery'&&<RecoveryBars rows={base} outcome={s.outcome} selectedBand={s.selectedBand} revealThrough={recoveryReveal} onSelect={(selectedBand,outcome)=>{if(recoveryVisible(outcome))patch({selectedBand,outcome});}}/>}
          {s.chapter==='case'&&<RaceTrace race={bundle.raceCase} showGasly={s.showGasly} lap={s.caseLap} reveal={present||s.caseLap!==null} onLap={inspectLap}/>}
        </div>
        {s.chapter==='case'&&<><audio ref={raceAudio.audioRef} src={`${import.meta.env.BASE_URL}assets/verstappen-celebration.mp3`} preload="auto" muted={raceAudio.muted} hidden/><div className="event-rail" role="group" aria-label="Race checkpoints">{CHECKPOINTS.map((lap,i)=><button key={lap} aria-pressed={caseLap===lap} onClick={()=>inspectLap(lap)}><span>{lap===0?'START':`LAP ${lap}`}</span><b>{CHECKPOINT_NAMES[i]}</b></button>)}</div><div className="lap-control race-playback"><button className="play-button" onClick={togglePlayback} aria-label={playing?'Pause race':'Play race'}><Icon name={playing?'pause':'play'} size={16}/>{playing?'Pause':'Play race'}</button><select aria-label="Playback speed" value={playSpeed} onChange={e=>setPlaySpeed(Number(e.target.value))}><option value={1}>1×</option><option value={2}>2×</option></select><button className="race-mute" aria-label={raceAudio.muted?'Unmute race audio':'Mute race audio'} aria-pressed={raceAudio.muted} onClick={raceAudio.toggleMuted}><Icon name={raceAudio.muted?'muted':'sound'} size={16}/>{raceAudio.muted?'Muted':'Sound on'}</button><label htmlFor="lap-scrubber">{caseLap===0?'Starting grid':`Lap ${caseLap} / 69`}</label><input id="lap-scrubber" type="range" min="0" max="69" value={s.caseLap??69} onChange={e=>inspectLap(Number(e.target.value))}/><button onClick={()=>{setPlaying(false);present?activate('case-69'):patch({caseLap:null,caseEvent:null});}}>Show full race</button><button aria-label="Replay race from the grid" onClick={()=>inspectLap(0)}><Icon name="reset" size={16}/></button></div></>}
        {!(present&&s.chapter==='case')&&<div className="chart-caption">{s.chapter==='overview'?`Each column totals 100% including DNF/DSQ (did not finish / disqualified). Correlation uses ${fmt(stats.finishers)} finishers.`:s.chapter==='circuits'&&movement?'Mean absolute grid–finish difference among P1–10 starters who finished. Larger = more movement in either direction; not an overtake count.':s.chapter==='circuits'?`Correlation uses finishers; pole-win rates use actual P1 starts. Capped lines show 95% intervals when available. ${present?'Five contrasts from 19 circuits with at least eight races.':'Limited histories can be included above.'}`:s.chapter==='recovery'?'One shared 0–100% scale. A win is also a podium and a top-ten result; do not add the rates. Every eligible start counts, including retirements.':'Observed lap-end positions. Net places gained do not count on-track overtakes.'}</div>}
      </article>
      <aside className={`insight-panel ${s.chapter==='overview'&&s.selectedStart!==null?'is-inspecting':''}`} aria-label="Interpretation and selected details"><div className="insight-heading"><span className="section-kicker">{s.chapter==='case'?(caseLap===0?'AT THE START':caseLap===69?'AT THE FINISH':`END OF LAP ${caseLap}`):'WHAT TO NOTICE'}</span><span>0{index+1}</span></div>
        {s.chapter==='overview'&&<>
          <div className="main-result"><span>START–FINISH CORRELATION</span><strong><small>r = </small>{decimal(stats.r)}</strong><p>{stats.r===null?'Insufficient variation or observations to calculate r.':`${(stats.r??0)>=.65?'A strong positive association.':'The observed association.'} Better starting places tend to accompany better finishing places.`}</p></div>
          {s.selectedStart===null&&<><div className="position-contrast"><p><b>{percent(stats.sameRate)}</b> of drivers finish in the same position they started.</p><small className="denominator-note">Among finishers; each race appearance counts once.</small>{stats.sameRate!==null&&<><div className="position-share" aria-hidden="true"><span style={{width:`${stats.sameRate*100}%`}}/></div><div className="position-share-labels"><span><i/>{fmt(stats.same)} same place</span><span>{fmt(stats.finishers-stats.same)} changed place</span></div></>}</div>
          </>}
          {s.chapter==='overview'&&<div className="slot-shortcuts" role="group" aria-label="Inspect a starting position">{[[1,'front'],[10,'middle'],[17,'back']].map(([n,label])=><button key={n} aria-pressed={s.selectedStart===n} onClick={()=>{patch({selectedStart:Number(n)});setCell(null);}}>P{n}<span> · {label}</span></button>)}<button aria-pressed={s.selectedStart===null} onClick={()=>{patch({selectedStart:null});setCell(null);}}>All positions</button></div>}
          {s.selectedStart!==null&&<StartDetail rows={starts} start={s.selectedStart} cell={cell} cellRows={cellRows} onRecords={()=>records(cell?cellRows:starts.filter(r=>r.grid===s.selectedStart),cell?`P${cell.start} → ${cell.finish===null?'DNF / DSQ':`P${cell.finish}`}`:`All starts from P${s.selectedStart}`)}/>}
          {s.selectedStart===null&&<div className="action-hint"><Icon name="grid" size={16}/><p>Choose a starting place or select a cell.</p></div>}
          {!present&&<><label className="field-label" htmlFor="start-select">Any starting place</label><select id="start-select" value={s.selectedStart??''} onChange={e=>{patch({selectedStart:e.target.value?Number(e.target.value):null});setCell(null);}}><option value="">All positions</option>{Array.from({length:22},(_,i)=><option key={i+1} value={i+1}>P{i+1}</option>)}</select><label className="highlight-label">Highlight a driver<select aria-label="Highlight driver without filtering" value={s.highlightedDriverId} onChange={e=>patch({highlightedDriverId:e.target.value})}><option value="">None · all-field reference</option>{drivers.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select><small>Highlights leave reference rates unchanged.</small></label></>}
          <div className="takeaway"><Icon name="info" size={16}/><p>Correlation is a relationship, not a prediction-accuracy percentage.</p></div>
        </>}
        {s.chapter==='circuits'&&<>
          <h2>{movement?'Movement in either direction.':showWinner?'The whole field and the winner.':'How closely does the order hold?'}</h2>
          <p>{movement?'Average places changed by P1–10 starters who finished. P5 → P8 and P8 → P5 both count as three places.':showWinner?'On the left, closer to +1 means the finishing order follows the grid more closely. On the right, compare how often the P1 starter won.':'Closer to +1 means the finishing order follows the grid more closely. First compare alignment across the whole field.'}</p>
          {scopedCircuit&&<div className="circuit-detail integrated-detail"><label className="field-label" htmlFor="circuit-detail-select">Select a circuit</label><select id="circuit-detail-select" aria-label="Circuit detail" value={scopedCircuit.id} onChange={e=>setSelectedCircuit(e.target.value)}>{availableCircuits.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><span className="circuit-races">{scopedCircuit.races} races in this selection</span><dl className="circuit-metrics">
            {!movement&&<div><dt>Starting / finishing order</dt><dd>{decimal(scopedCircuit.r)}<small>Pearson r · {fmt(scopedCircuit.finishers)} finisher results</small></dd></div>}
            {!movement&&showWinner&&<div><dt>Wins from pole position</dt><dd>{percent(scopedCircuit.p1Rate)}<small>{scopedCircuit.p1Wins} wins from {scopedCircuit.p1Starts} P1 starts</small></dd></div>}
            <div><dt>Average places changed · P1–10</dt><dd>{decimal(scopedCircuit.movement.meanAbsolute)}<small>{scopedCircuit.movement.n} top-ten starter results · finishers only</small></dd></div>
          </dl></div>}
          {movement&&<div className="circuit-observation"><b>More movement means a larger change of place.</b><p>{fullCircuitScope?'Monaco has the smallest average change and Hungaroring the largest among the 19 circuits with at least eight races. ':''}These values include gains and losses. They do not count overtakes.</p></div>}
          {showWinner&&fullCircuitScope&&scopedCircuit&&['monaco','yas-marina','interlagos','sochi','hungaroring'].includes(scopedCircuit.id)&&<div className="circuit-observation"><b>{scopedCircuit?.id==='yas-marina'?'11 wins from 12 pole starts.':scopedCircuit?.id==='hungaroring'?'More movement across the top ten.':scopedCircuit?.id==='sochi'?'The weakest alignment in this comparison.':scopedCircuit?.id==='interlagos'?'Now put São Paulo in context.':'Strong alignment does not guarantee a pole win.'}</b><p>{scopedCircuit?.id==='yas-marina'?'Its pole win rate exceeds Monaco’s, despite a lower whole-field correlation.':scopedCircuit?.id==='hungaroring'?'At 2.38 places, it has the largest mean change among the 19 circuits with at least eight races.':scopedCircuit?.id==='sochi'?'Its r = 0.68 is lowest among the same 19 circuits. Its mean position change is not the highest.':scopedCircuit?.id==='interlagos'?'São Paulo combines r = 0.73 with 8 wins from 11 pole starts. Our next case starts P17, well beyond the front.':'Monaco has the smallest mean change, yet only 6 of its 10 pole starters won.'}</p></div>}
        </>}
        {s.chapter==='recovery'&&<>
          <label className="field-label" htmlFor="band-select">Starting group · back to front</label><select id="band-select" value={s.selectedBand} onChange={e=>chooseBand(Number(e.target.value))}>{RECOVERY_ORDER.map(i=><option value={i} key={i}>P{BANDS[i].label} · {BANDS[i].title}</option>)}</select>
          <div className="outcome-tabs detail-outcomes" role="group" aria-label="Inspect an outcome">{recoveryOutcomes.map(o=><button key={o} disabled={!recoveryVisible(o)} title={!recoveryVisible(o)?'Use Next to reveal this outcome':undefined} aria-pressed={s.outcome===o} style={{background:s.outcome===o?OUTCOME_COLORS[o]:undefined}} onClick={()=>chooseOutcome(o)}>{OUTCOMES[o].label}</button>)}</div>
          <div className="main-result outcome-result" role="status"><span>P{BANDS[s.selectedBand].label} → {OUTCOMES[s.outcome].label.toUpperCase()}</span><strong style={{color:OUTCOME_COLORS[s.outcome]}}>{percent(activeBand.rate)}</strong><p><b>{fmt(activeBand.k)} of {fmt(activeBand.n)}</b> starts {s.outcome==='win'?'ended in a win':s.outcome==='podium'?'reached the podium':'reached the top ten'}.</p></div>
          {bridge&&recoveryVisible('win')?<div className="bridge-note"><h2>One win from the back.</h2><p>São Paulo, 2024. We will follow that race after comparing the circuits.</p></div>:<p className="band-note">The same starting group can have very different rates for each outcome.</p>}
          <div className="takeaway"><Icon name="target" size={16}/><p>Starting position is not a complete measure of pace: penalties can place competitive cars at the back.</p></div>
        </>}
        {s.chapter==='case'&&<>
          <h2>{caseLap===0?'Three places on the grid.':caseLap===69?'17th to first.':caseEvent?.title??`The order at lap ${caseLap}.`}</h2><p>{caseDescription}</p>
          <div className="race-position-list" role="status" aria-live={playing?'off':'polite'}>{bundle.raceCase.traces.slice(0,s.showGasly?4:3).map((t,i)=>{const position=t.points.find(p=>p.lap===caseLap)!.position;const change=t.grid-position;return <div key={t.driver_id}><span><i style={{background:DRIVER_COLORS[i]}}/><span className="driver-label">{t.label}<small>Started P{t.grid}</small></span></span><b style={{color:DRIVER_COLORS[i]}}>P{position}{caseLap>0&&<small>{change===0?'No net change':`${Math.abs(change)} ${Math.abs(change)===1?'place':'places'} ${change>0?'gained':'lost'}`}</small>}</b></div>;})}</div>
          <RaceControlNote race={bundle.raceCase} lap={caseLap} playing={playing}/>
          <div className="takeaway"><Icon name="flag" size={16}/><p>{caseLap===69?'Sixteen net places gained does not mean sixteen overtakes.':'Lap-end ranks show the order. Net change is not an overtake count.'}</p></div>
        </>}
      </aside></section>
    </main>}
    <footer className="app-footer"><div className="footer-tools"><button onClick={()=>setModal('methods')}><Icon name="info" size={15}/>Sources & methods</button>{analysis&&<button onClick={()=>records(s.chapter==='case'?bundle.rows.filter(r=>r.year===2024&&r.grand_prix_id==='sao-paulo'):base,scope)}><Icon name="table" size={15}/>Data</button>}<button onClick={()=>setModal('notes')}><Icon name="notes" size={15}/>Speaker notes</button>{analysis&&<button onClick={()=>activate('intro')} className="replay-intro">Replay introduction</button>}</div>{analysis&&<><div className="story-progress"><span>0{index+1} / 04</span><div>{CHAPTERS.map((c,i)=><b key={c.id} className={i<=index?'filled':''}/>)}</div></div><div className="footer-navigation"><button className="previous" disabled={!present&&index===0} aria-label="Previous story step" onClick={back}><Icon name="chevron"/></button><button className="primary-button" onClick={next}>{footerLabel}<Icon name="arrow" size={18}/></button></div></>}{closing&&<button className="text-button" onClick={()=>activate('case-69')}>Back to the race<Icon name="arrow" size={16}/></button>}{intro&&<span className="footer-study">BAIT 518 · interactive research briefing</span>}</footer>
    {notice&&<div className="toast" role="status">{notice}</div>}
    {modal==='methods'&&<Modal title="Sources & methods" onClose={()=>setModal(null)} wide><Methods bundle={bundle}/></Modal>}
    {modal==='records'&&<Modal title={detailTitle} onClose={()=>setModal(null)} wide><Records key={detailTitle} rows={detailRows} title={detailTitle}/></Modal>}
    {modal==='notes'&&<Modal title={intro?'Opening · audience prediction':closing?'Closing · potential impact':`Speaker notes · ${CHAPTERS[index].name}`} onClose={()=>setModal(null)}><p className="notes-time">SIX-MINUTE ROUTE · {intro?'0:00–0:35':closing?'5:15–6:00':CHAPTERS[index].time}</p><ol className="speaker-list">{(intro?['Explain qualifying, the grid, and the finish. Ask for an estimate: how often does a driver win from pole position?','Reveal 134/250 = 53.6%. It is a historical rate, not a prediction for an individual driver.','Move to the whole-field pattern.']:closing?['Point left: 14.1% of P16–22 starts reached the top ten. Use that baseline to set a realistic recovery goal.','Point middle: Monaco 1.31 versus Hungaroring 2.38 average places changed among top-ten starters who finished. Use the contrast to focus a passing and track-layout review.','Point right: Monaco 6/10 versus Yas Marina 11/12 pole wins. Circuit context matters when assessing the race. Allow about 15 seconds per example; no filters or clicks.']:speakerNotes[s.chapter]).map((n,i)=><li key={i}>{n}</li>)}</ol><a className="text-button" href={`${import.meta.env.BASE_URL}STORY_SCRIPT.md`} download><Icon name="download" size={15}/>Download full speaking route</a></Modal>}
  </div>;
}

function StartDetail({rows,start,cell,cellRows,onRecords}:{rows:DriverRace[];start:number;cell:{start:number;finish:number|null}|null;cellRows:DriverRace[];onRecords:()=>void}){
  const rs=rows.filter(r=>r.grid===start),n=rs.length;const nTop=rs.filter(r=>r.finish!==null&&r.finish<=10).length;const nWin=rs.filter(r=>r.finish===1).length;const dnf=rs.filter(r=>!r.is_finisher).length;
  return <section className="start-detail" aria-live="polite"><span className="field-label">STARTING P{start} · {fmt(n)} STARTS</span>{cell?<p><b>{fmt(cellRows.length)} of {fmt(n)}</b> {cell.finish===null?'did not finish / were disqualified':`finished P${cell.finish}`} ({percent(n?cellRows.length/n:null)}).</p>:<p><b>{fmt(nTop)} of {fmt(n)}</b> reached the top ten.</p>}<dl>{[['Won',nWin],['Top ten',nTop],['DNF / DSQ',dnf]].map(([label,k])=><div key={label}><dt>{label}</dt><dd>{percent(n?Number(k)/n:null)}</dd>{n>0&&<div className="detail-meter" aria-hidden="true"><i style={{width:`${Number(k)/n*100}%`}}/></div>}</div>)}</dl><small className="detail-definition">Win is included in top ten.</small><button className="text-button" onClick={onRecords}>View the records<Icon name="arrow" size={15}/></button></section>;
}
