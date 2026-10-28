import {useEffect,useMemo,useState} from 'react';
import type {AppState,Bundle,Chapter,DriverRace,Outcome} from './data/types';
import {BANDS,OUTCOMES,bandStats,circuitStats,decimal,fmt,gridStarts,percent,selectBase,summarize} from './data/metrics';
import {CHAPTERS,preset,readState} from './state';
import {adjacentStep,CHECKPOINTS,CHECKPOINT_NAMES,firstStep,NEXT_LABEL,readStory,readPresentationState,stateForStep,storyUrl,type StoryStep} from './presentation';
import {GridOutcomeHeatmap} from './charts/GridOutcomeHeatmap';
import {CircuitComparison} from './charts/CircuitComparison';
import {RecoveryBars} from './charts/RecoveryBars';
import {RaceTrace,DRIVER_COLORS} from './charts/RaceTrace';
import {AMBER} from './charts/Plot';
import {Icon} from './components/Icon';
import {Modal} from './components/Modal';
import {Methods} from './components/Methods';
import {Records} from './components/Records';
import {OpeningContext,ClosingTakeaway} from './components/OpeningContext';
import Plotly from 'plotly.js-dist-min';

const titles:Record<Chapter,{title:string;description:string;chart:string}>={
  overview:{title:'The grid leaves a clear imprint.',description:'Better starts tend to accompany better finishes. The exact order still changes.',chart:'Where do drivers finish from each starting place?'},
  circuits:{title:'Two ways to read the same grid.',description:'The whole finishing order and the winner are different questions. A circuit is the track where a race takes place.',chart:'The circuit changes the comparison'},
  recovery:{title:'A recovery needs a destination.',description:'Top ten, podium (top three), or a win: the goal changes what a good recovery looks like.',chart:'Same starting groups. A different goal.'},
  case:{title:'One winner from the back. Follow the race.',description:'São Paulo, Brazil · 2024. A deliberately selected exception, one observed lap at a time.',chart:'From the starting grid to the finish'},
};
const speakerNotes:Record<Chapter,string[]>={
  overview:['Explain that lower position numbers are better. Every column represents starts from one grid place.','The diagonal means the same starting and finishing place. Better starts tend to accompany better finishes; r ≈ 0.76 is not 76% accuracy.','Only 17.3% of finishers kept exactly the same place. The relationship is stronger than that exact-match statistic might suggest.','Select one starting-place shortcut, then ask whether every circuit tells the same story.'],
  circuits:['Begin with the field panel. Explain start–finish correlation among finishers.','Reveal wins from first. Monaco is 0.86 and 6/10; Yas Marina is 0.79 and 11/12. These measures answer different questions.','Histories are small and intervals overlap. Do not describe this as a definitive circuit ranking or a causal effect of track design.','Transition: someone starting farther back may care about a top-ten finish rather than a win.'],
  recovery:['Start with P11–15 highlighted: 402 of 1,238 starts reached the top ten.','Choose Win: only 2 of those same 1,238 starts won (0.16%). Keep the scale and denominator fixed.','Choose the back group: one winner from 1,185 starts in positions 16–22. This is a different group from P11–15.','Follow that race. The one qualifying winner in the default study scope is Verstappen at São Paulo 2024.'],
  case:['Start at the grid, without revealing the finishing positions. Explain the three driver names.','Advance through lap 11, lap 33 restart order, lap 43 new leader, and lap 69 finish. The suspension occurred between laps 32 and 33.','Positions gained do not count overtakes. Race events illustrate the evolving order; they do not isolate causal effects.','Close with the baseline, the question, and room for the race itself.'],
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
  const [filters,setFilters]=useState(false),[circuitMenu,setCircuitMenu]=useState(false),[limited,setLimited]=useState(false),[selectedCircuit,setSelectedCircuit]=useState('monaco');
  const [notice,setNotice]=useState('');
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
  const bridge=defaultScope&&s.selectedBand===4&&s.outcome==='win'&&soleWinner?.race_id===bundle.rows.find(r=>r.year===2024&&r.grand_prix_id==='sao-paulo')?.race_id;
  const hasCohort=!!(s.cohortDriverId||s.cohortConstructorId);
  const index=CHAPTERS.findIndex(c=>c.id===s.chapter);
  const showWinner=!present||story!=='circuits-field';
  const period=!s.includeBelgium2021&&(s.years[0]===2014||s.years[0]===2022)&&s.years[1]===2025?`${s.years[0]}-2025`:null;
  const circuits=useMemo(()=>[...new Map(bundle.rows.map(r=>[r.circuit_id,r.circuit_name])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[bundle.rows]);
  const drivers=useMemo(()=>[...new Map(bundle.rows.map(r=>[r.driver_id,r.driver_name])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[bundle.rows]);
  const teams=useMemo(()=>[...new Set(bundle.rows.map(r=>r.constructor_id))].sort(),[bundle.rows]);
  const scopedCircuit=cs.find(c=>c.id===selectedCircuit)||cs[0];
  const scope=s.chapter==='case'?'São Paulo 2024 · fixed case study':`${s.years.join('–')} · ${!s.circuitIds.length?'All circuits':s.circuitIds.length===1?circuits.find(c=>c[0]===s.circuitIds[0])?.[1]:`${s.circuitIds.length} circuits`}${hasCohort?' · filtered cohort':''}`;
  const cellRows=cell?starts.filter(r=>r.grid===cell.start&&(cell.finish===null?!r.is_finisher:r.is_finisher&&r.finish===cell.finish)):[];
  const caseLap=s.caseLap??69;
  const caseEvent=bundle.raceCase.events.find(e=>e.lap===caseLap);
  const patch=(p:Partial<AppState>)=>setS(v=>({...v,...p}));
  function activate(step:StoryStep){setStory(step);setS(stateForStep(step));setCell(null);setCircuitMenu(false);setFilters(false);setLimited(false);if(step==='intro'){setGuess(null);setIntroRevealed(false);}}
  function go(chapter:Chapter){if(present)activate(firstStep(chapter));else{patch({chapter,selectedStart:null,caseLap:null,caseEvent:null});setCell(null);setCircuitMenu(false);}}
  function explore(){setS(preset('overview','explore'));setStory('overview');setFilters(true);}
  function next(){if(!present){if(index===3){setStory('closing');setS(preset('overview'));}else go(CHAPTERS[index+1].id);return;}if(story==='recovery-top10'){setStory(s.selectedBand===4?'recovery-back':'recovery-win');patch({outcome:'win'});return;}activate(adjacentStep(story,1));}
  function back(){if(present&&story==='recovery-win'){setStory('recovery-top10');patch({outcome:'top10'});return;}if(present)activate(adjacentStep(story,-1));else if(index>0)go(CHAPTERS[index-1].id);}
  function reset(){if(present)activate(firstStep(s.chapter));else{setS(preset(s.chapter,'explore'));setLimited(false);setFilters(false);setCircuitMenu(false);setCell(null);}}
  function chooseOutcome(outcome:Outcome){if(present){setStory(outcome==='win'?(s.selectedBand===4?'recovery-back':'recovery-win'):'recovery-top10');}patch({outcome});}
  function chooseBand(selectedBand:number){if(present&&s.outcome==='win')setStory(selectedBand===4?'recovery-back':'recovery-win');patch({selectedBand});}
  function inspectLap(lap:number){if(present){const cp=[...CHECKPOINTS].reverse().find(n=>n<=lap)??0;setStory(cp===0?'case-grid':`case-${cp}` as StoryStep);}patch({caseLap:lap,caseEvent:null});}
  function records(rows:DriverRace[],title:string){setDetailRows(rows);setDetailTitle(title);setModal('records');}
  useEffect(()=>{history.replaceState(null,'',storyUrl(s,story));},[s,story]);
  useEffect(()=>{const pop=()=>{const state=readState(location.search,bundle.rows),step=readStory(location.search);setS(state.mode==='present'?readPresentationState(location.search):state);setStory(step);setCell(null);};addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop);},[bundle.rows]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(modal||!present||intro||closing||(e.target as HTMLElement)?.closest('input,select,textarea,button,[role="tablist"]'))return;if(e.key==='ArrowRight'){e.preventDefault();next();}if(e.key==='ArrowLeft'){e.preventDefault();back();}};addEventListener('keydown',key);return()=>removeEventListener('keydown',key);});
  useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(id);},[notice]);
  async function share(){try{await navigator.clipboard.writeText(location.href);setNotice('Link copied with the current chapter and filters.');}catch{setNotice('Copy the address from your browser to share this view.');}}
  async function exportChart(){
    try{
      const el=document.querySelector('.chart-main .js-plotly-plot') as any;if(!el)return;
      const stage=s.chapter==='case'?` · ${present?`through ${caseLap===0?'the grid':`lap ${caseLap}`}`:'full race'}`:s.chapter==='circuits'&&!showWinner?' · field comparison only':'';
      // Export has its own title row. Keep panel headings close to the plot so
      // their paper-relative offset cannot collide with that title at 1600px.
      const annotations=(el.layout.annotations||[]).map((a:any)=>s.chapter==='circuits'&&a.yref==='paper'&&a.y>1?{...a,y:1.02}:a);
      const layout={...el.layout,width:1600,height:1000,paper_bgcolor:'#FFFFFF',plot_bgcolor:'#FFFFFF',title:{text:titles[s.chapter].chart,font:{size:24},x:.05,y:.98,yanchor:'top'},margin:{...el.layout.margin,t:130,b:140},annotations:[...annotations,{text:`${scope}${stage} · ${s.chapter==='case'?'Jolpica / OpenF1 / FIA':'F1DB v2025.24.0 + documented corrections'}<br>Grid / Finish · BAIT 518 · Group 3 · BA2 · ${s.chapter==='case'?'Verified lap-end positions':`${fmt(stats.starts)} eligible starts · ${fmt(stats.finishers)} finishers for correlation`}`,xref:'paper',yref:'paper',x:0,y:-.13,xanchor:'left',yanchor:'top',showarrow:false,font:{size:13,color:'#526267'}}]};
      const url=await Plotly.toImage({data:el.data,layout} as any,{format:'png',width:1600,height:1000});const a=document.createElement('a');a.href=url;a.download=`grid-finish-${s.chapter}${present&&s.chapter==='case'?`-lap-${caseLap}`:''}.png`;a.click();setNotice('Chart saved with scope, stage and attribution.');
    }catch{setNotice('Use your browser’s Print command to save this view.');}
  }
  const emptyOverview=s.chapter==='overview'&&(hasCohort||stats.r===null||(stats.r??0)<.65);
  const headline=emptyOverview?'How closely does this grid follow the finish?':s.chapter==='recovery'&&bridge?'One win. From 1,185 starts at the back.':titles[s.chapter].title;
  const footerLabel=present?NEXT_LABEL[story]:index===3?'The takeaway':`Next: ${CHAPTERS[index+1].name.toLowerCase()}`;
  const caseDescription=caseLap===0?'Three starting places. Follow how their positions develop.':caseLap===33?'After pit visits and a red-flag pause, Ocon led. Verstappen was second, Norris fourth.':caseLap===43?'At the restart, Verstappen passed Ocon for the lead. At the end of lap 43, Norris was seventh.':caseEvent?.description??(caseLap===69?'Verstappen won from 17th. Norris started first and finished sixth. Ocon finished second.':`Positions at the end of lap ${caseLap}. These are observed classifications, not continuous on-track distances.`);

  return <div className={`app-shell ${present?'present':'explore'} ${intro?'screen-intro':closing?'screen-closing':`chapter-${s.chapter}`}`}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="topbar"><a className="brand" href="?step=intro" onClick={e=>{e.preventDefault();activate('intro');}} aria-label="Replay the introduction"><svg width="30" height="26" viewBox="0 0 30 26" aria-hidden="true"><path d="M1 23 16 3h13L14 23z" fill="#D9503C"/><path d="M13 23 28 3h-6L7 23z" fill="#fff"/></svg><span>GRID<span className="brand-slash">/</span>FINISH</span></a><span className="topbar-description">A HEAD START, NOT A VERDICT</span><div className="topbar-right"><span className="group-tag">GROUP 3 <i/> BA2</span><div className="mode-switch" role="group" aria-label="Dashboard mode"><button aria-pressed={present} onClick={()=>{if(!present){activate(firstStep(s.chapter));setNotice('Presentation preset loaded. Explore filters have been reset.');}}}>Present</button><button aria-pressed={!present} onClick={()=>{if(present){setS(v=>({...v,mode:'explore',caseLap:null,caseEvent:null}));setFilters(false);}}}>Explore</button></div><button className="top-icon" aria-label="Toggle full screen" onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.();}}><Icon name="expand"/></button></div></header>
    {analysis&&<nav className="story-nav" aria-label="Story chapters">{CHAPTERS.map((c,i)=><button key={c.id} onClick={()=>go(c.id)} className={s.chapter===c.id?'active':''} aria-current={s.chapter===c.id?'step':undefined}><span className="step-number">0{i+1}</span><b>{['The pattern','The circuit','The goal','The race'][i]}</b><span className="nav-detail">{['Grid → finish','Two questions','Recovery to what?','São Paulo 2024'][i]}</span><Icon name={['grid','track','target','flag'][i]} size={18}/></button>)}</nav>}
    {intro&&<OpeningContext stats={openingStats} guess={guess} revealed={introRevealed} onGuess={setGuess} onReveal={()=>setIntroRevealed(true)} onContinue={()=>activate('overview')} onSkip={()=>activate('overview')}/>}
    {closing&&<ClosingTakeaway onExplore={explore} onReplay={()=>activate('intro')}/>}
    {analysis&&<main id="main-content">
      <section className="chapter-heading"><div><p className="eyebrow">CHAPTER 0{index+1} <span>/</span> {s.chapter==='case'?'THE EXCEPTION':s.chapter==='recovery'?'DEFINE THE OUTCOME':s.chapter==='circuits'?'SAME SPORT, DIFFERENT QUESTIONS':'THE HISTORICAL PATTERN'}</p><h1>{headline}</h1><p className="chapter-description">{emptyOverview?'Inspect the outcomes and sample size for the current selection.':titles[s.chapter].description}</p></div><div className="scope-block"><strong><i/>{s.chapter==='case'?'SÃO PAULO · 2024':s.years.join(' — ')}</strong><span>{s.chapter==='case'?`${present&&caseLap<69?'Revealed through '+(caseLap===0?'the starting grid':'lap '+caseLap):'69 laps · documented exception'}`:`${fmt(stats.races)} races · ${fmt(stats.starts)} grid starts`}</span>{!present&&<button className="text-button" onClick={()=>setFilters(v=>!v)} aria-expanded={filters}>{filters?'Hide filters':'Edit selection'}<Icon name="down" size={13}/></button>}</div></section>
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
      <section className="workspace"><article className="chart-card"><header className="chart-header"><div><span className="section-kicker">{s.chapter==='case'?'ONE RACE, LAP BY LAP':'THE EVIDENCE'}</span><h2>{titles[s.chapter].chart}</h2></div><button className="icon-button" onClick={exportChart} aria-label="Save chart as PNG" title="Save current chart with attribution"><Icon name="download" size={18}/></button></header>

        {s.chapter==='recovery'&&<div className="chart-controls"><div className="outcome-tabs" role="group" aria-label="Outcome">{(Object.keys(OUTCOMES) as Outcome[]).map(o=><button key={o} aria-pressed={s.outcome===o} onClick={()=>chooseOutcome(o)}>{OUTCOMES[o].label}</button>)}</div><span>Choose the destination.</span></div>}
        {s.chapter==='circuits'&&!present&&<div className="chart-controls"><label className="check-label"><input type="checkbox" checked={limited} onChange={e=>setLimited(e.target.checked)}/>Include limited histories</label><span>{period&&!hasCohort?'Intervals for this exact period':'Custom cohort · point estimates only'}</span></div>}
        {s.chapter==='case'&&!present&&<div className="chart-controls race-legend">{bundle.raceCase.traces.slice(0,s.showGasly?4:3).map((t,i)=><span key={t.driver_id}><i style={{background:DRIVER_COLORS[i]}}/>{t.label}</span>)}{!present&&<label className="check-label gasly-toggle"><input type="checkbox" checked={s.showGasly} onChange={e=>patch({showGasly:e.target.checked})}/>Add Gasly</label>}</div>}
        <div className="chart-main" aria-label={titles[s.chapter].chart}>
          {s.chapter==='overview'&&<GridOutcomeHeatmap rows={base} selectedStart={s.selectedStart} highlightedDriverId={s.highlightedDriverId} onSelect={(start,finish)=>{patch({selectedStart:start});setCell({start,finish});}}/>}
          {s.chapter==='circuits'&&<CircuitComparison rows={base} uncertainty={bundle.uncertainty} period={period} hasCohort={hasCohort} showLimited={limited} present={present} selectedCircuit={selectedCircuit} showWinner={showWinner} onSelect={setSelectedCircuit}/>}
          {s.chapter==='recovery'&&<RecoveryBars rows={base} outcome={s.outcome} selectedBand={s.selectedBand} onSelect={chooseBand}/>}
          {s.chapter==='case'&&<RaceTrace race={bundle.raceCase} showGasly={s.showGasly} lap={s.caseLap} reveal={present} onLap={inspectLap}/>}
        </div>
        {s.chapter==='case'&&<><div className="event-rail" role="group" aria-label="Race checkpoints">{CHECKPOINTS.map((lap,i)=><button key={lap} aria-pressed={caseLap===lap} onClick={()=>present?activate(lap===0?'case-grid':`case-${lap}` as StoryStep):patch({caseLap:lap,caseEvent:null})}><span>{lap===0?'START':`LAP ${lap}`}</span><b>{CHECKPOINT_NAMES[i]}</b></button>)}</div><div className="lap-control"><label htmlFor="lap-scrubber">{caseLap===0?'Starting grid':`Lap ${caseLap} / 69`}</label><input id="lap-scrubber" type="range" min="0" max="69" value={s.caseLap??69} onChange={e=>inspectLap(Number(e.target.value))}/><button onClick={()=>present?activate('case-69'):patch({caseLap:null,caseEvent:null})}>Show full race</button><button aria-label="Replay race from the grid" onClick={()=>present?activate('case-grid'):patch({caseLap:0,caseEvent:null})}><Icon name="reset" size={14}/></button></div></>}
        {!(present&&s.chapter==='case')&&<div className="chart-caption">{s.chapter==='overview'?`Each column totals 100% including DNF/DSQ (did not finish / disqualified). Correlation uses ${fmt(stats.finishers)} finishers.`:s.chapter==='circuits'?`${period&&!hasCohort?'Capped lines: 95% intervals.':'Point estimates for this selection.'} Small histories; not a definitive circuit ranking.`:s.chapter==='recovery'?`Same 0–100% scale. Retirements remain in the denominator.${s.outcome==='win'?' Dots mark positive rates below 1%.':' Outcomes overlap.'}`:'Observed lap-end positions. Net places gained do not count on-track overtakes.'}</div>}
      </article>
      <aside className={`insight-panel ${s.chapter==='overview'&&s.selectedStart!==null?'is-inspecting':''}`} aria-label="Interpretation and selected details"><div className="insight-heading"><span className="section-kicker">{s.chapter==='case'?(caseLap===0?'AT THE START':caseLap===69?'AT THE FINISH':`END OF LAP ${caseLap}`):'WHAT TO NOTICE'}</span><span>0{index+1}</span></div>
        {s.chapter==='overview'&&<>
          <div className="main-result"><span>START–FINISH CORRELATION</span><strong><small>r = </small>{decimal(stats.r)}</strong><p>{stats.r===null?'Insufficient variation or observations to calculate r.':`${(stats.r??0)>=.65?'A strong positive association.':'The observed association.'} ${fmt(stats.finishers)} eligible finishers.`}</p></div>
          {s.selectedStart===null&&<><div className="position-contrast"><p><b>{percent(stats.sameRate)}</b> of finishers kept the same place.</p>{stats.sameRate!==null&&<><div className="position-share" aria-hidden="true"><span style={{width:`${stats.sameRate*100}%`}}/></div><div className="position-share-labels"><span><i/>{fmt(stats.same)} same place</span><span>{fmt(stats.finishers-stats.same)} changed place</span></div></>}</div>
          <p className="reading-guide"><span>Above diagonal <b>↗ gained places</b></span><span>Below diagonal <b>↙ lost places</b></span></p></>}
          {s.chapter==='overview'&&<div className="slot-shortcuts" role="group" aria-label="Inspect a starting position">{[[1,'front'],[10,'middle'],[17,'back']].map(([n,label])=><button key={n} aria-pressed={s.selectedStart===n} onClick={()=>{patch({selectedStart:Number(n)});setCell(null);}}>P{n}<span> · {label}</span></button>)}<button aria-pressed={s.selectedStart===null} onClick={()=>{patch({selectedStart:null});setCell(null);}}>All positions</button></div>}
          {s.selectedStart!==null&&<StartDetail rows={starts} start={s.selectedStart} cell={cell} cellRows={cellRows} onRecords={()=>records(cell?cellRows:starts.filter(r=>r.grid===s.selectedStart),cell?`P${cell.start} → ${cell.finish===null?'DNF / DSQ':`P${cell.finish}`}`:`All starts from P${s.selectedStart}`)}/>}
          {s.selectedStart===null&&<div className="action-hint"><Icon name="grid" size={16}/><p>Choose a starting place or select a cell.</p></div>}
          {!present&&<><label className="field-label" htmlFor="start-select">Any starting place</label><select id="start-select" value={s.selectedStart??''} onChange={e=>{patch({selectedStart:e.target.value?Number(e.target.value):null});setCell(null);}}><option value="">All positions</option>{Array.from({length:22},(_,i)=><option key={i+1} value={i+1}>P{i+1}</option>)}</select><label className="highlight-label">Highlight a driver<select aria-label="Highlight driver without filtering" value={s.highlightedDriverId} onChange={e=>patch({highlightedDriverId:e.target.value})}><option value="">None · all-field reference</option>{drivers.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select><small>Highlights leave reference rates unchanged.</small></label></>}
          <div className="takeaway"><Icon name="info" size={16}/><p>Correlation is a relationship, not a prediction-accuracy percentage.</p></div>
        </>}
        {s.chapter==='circuits'&&<>
          <h2>{showWinner?'Same grid. Different questions.':'Does the field tell us who wins?'}</h2><p>{showWinner?'Whole-field alignment and winning from first give different circuit comparisons.':'First, look at how closely the finishing order follows the starting grid. Then ask about the winner.'}</p>
          <div className="circuit-pair" role="group" aria-label="Highlight a circuit">{['monaco','yas-marina'].map(id=>{const c=cs.find(x=>x.id===id);return c?<button aria-pressed={selectedCircuit===id} key={id} onClick={()=>setSelectedCircuit(id)}><span><i style={{background:id==='monaco'?'#087F8C':AMBER}}/>{c.name}</span><b>{decimal(c.r)} <small>r</small></b>{showWinner&&<em>{c.p1Wins}/{c.p1Starts} wins from first</em>}</button>:null;})}</div>
          {scopedCircuit&&<div className="circuit-detail"><span className="field-label">SELECTED · {scopedCircuit.name}</span><p>{scopedCircuit.races} races · {fmt(scopedCircuit.finishers)} finishers{showWinner&&<><br/>{scopedCircuit.p1Wins} wins / {scopedCircuit.p1Starts} actual P1 starts</>}</p>{!present&&<button className="text-button" onClick={()=>setS({...preset('overview','explore'),years:s.years,circuitIds:[scopedCircuit.id],includeBelgium2021:s.includeBelgium2021,cohortDriverId:s.cohortDriverId,cohortConstructorId:s.cohortConstructorId})}>Explore this circuit<Icon name="arrow" size={15}/></button>}</div>}
          <div className="takeaway"><Icon name="info" size={16}/><p>{showWinner?'The samples are small. Differences do not isolate the effect of the circuit.':'Use “Show wins from first” to reveal the second comparison.'}</p></div>
        </>}
        {s.chapter==='recovery'&&<>
          <label className="field-label" htmlFor="band-select">Starting group</label><select id="band-select" value={s.selectedBand} onChange={e=>chooseBand(Number(e.target.value))}>{BANDS.map((b,i)=><option value={i} key={b.label}>P{b.label} · {b.title}</option>)}</select>
          <div className="main-result outcome-result" role="status"><span>P{BANDS[s.selectedBand].label} → {OUTCOMES[s.outcome].label.toUpperCase()}</span><strong>{percent(activeBand.rate)}</strong><p><b>{fmt(activeBand.k)} of {fmt(activeBand.n)}</b> starts {s.outcome==='win'?'produced a win':s.outcome==='podium'?'reached the top three':'reached the top ten'}.</p></div>
          {s.outcome==='win'&&s.selectedBand===3&&<div className="goal-comparison"><div><b>{fmt(top10[3].k)}</b><span>top-ten finishes</span></div><Icon name="arrow"/><div><b>{fmt(wins[3].k)}</b><span>wins</span></div><p>Two goals. The same {fmt(activeBand.n)} starts.</p></div>}
          {bridge?<div className="bridge-note"><span className="section-kicker">THERE IS A RACE BEHIND THAT ONE.</span><h2>Follow the exception.</h2><p>The only winning record in this back group is São Paulo 2024.</p>{!present&&<button className="text-button" onClick={()=>activate('case-grid')}>Follow that race<Icon name="arrow" size={15}/></button>}</div>:<p className="band-note">{activeBand.races} races in this selection. {activeBand.n<30||activeBand.races<5?'Limited history: read the exact counts.':'Select a group or change the goal.'}</p>}
          {!present&&<button className="text-button" onClick={()=>records(activeBand.rows,`Starts from P${BANDS[s.selectedBand].label}`)}>View these starts<Icon name="arrow" size={15}/></button>}
          <div className="takeaway"><Icon name="target" size={16}/><p>Historical group frequencies frame expectations. They are not an individual race forecast.</p></div>
        </>}
        {s.chapter==='case'&&<>
          <h2>{caseLap===0?'Three places on the grid.':caseLap===69?'17th to first.':caseEvent?.title??`The order at lap ${caseLap}.`}</h2><p>{caseDescription}</p>
          <div className="race-position-list" role="status">{bundle.raceCase.traces.slice(0,s.showGasly?4:3).map((t,i)=>{const position=t.points.find(p=>p.lap===caseLap)!.position;const change=t.grid-position;return <div key={t.driver_id}><span><i style={{background:DRIVER_COLORS[i]}}/><span className="driver-label">{t.label}<small>Started P{t.grid}</small></span></span><b style={{color:DRIVER_COLORS[i]}}>P{position}{caseLap>0&&<small>{change===0?'No net change':`${change>0?'+':''}${change} ${Math.abs(change)===1?'place':'places'}`}</small>}</b></div>;})}</div>
          <p className="band-note">{caseLap===0?'P1 is at the front. P17 begins much farther back.':caseLap===33?'End of lap 33. The suspension is marked between laps 32 and 33.':caseLap===69?'A deliberately selected exception to the historical pattern.':`Positions recorded at the end of lap ${caseLap}.`}</p>
          <div className="takeaway"><Icon name="flag" size={16}/><p>{caseLap===69?'Sixteen net places gained does not mean sixteen overtakes.':'Lap-end ranks show the order. Net change is not an overtake count.'}</p></div>
        </>}
      </aside></section>
    </main>}
    <footer className="app-footer"><div className="footer-tools"><button onClick={()=>setModal('methods')}><Icon name="info" size={15}/>Sources & methods</button>{analysis&&<button onClick={()=>records(s.chapter==='case'?bundle.rows.filter(r=>r.year===2024&&r.grand_prix_id==='sao-paulo'):base,scope)}><Icon name="table" size={15}/>Data</button>}<button onClick={()=>setModal('notes')}><Icon name="notes" size={15}/>Speaker notes</button>{analysis&&<button onClick={()=>activate('intro')} className="replay-intro">Replay introduction</button>}</div>{analysis&&<><div className="story-progress"><span>0{index+1} / 04</span><div>{CHAPTERS.map((c,i)=><b key={c.id} className={i<=index?'filled':''}/>)}</div></div><div className="footer-navigation"><button className="previous" disabled={!present&&index===0} aria-label="Previous story step" onClick={back}><Icon name="chevron"/></button><button className="primary-button" onClick={next}>{footerLabel}<Icon name="arrow" size={18}/></button></div></>}{closing&&<button className="text-button" onClick={()=>activate('case-69')}>Back to the race<Icon name="arrow" size={16}/></button>}{intro&&<span className="footer-study">BAIT 518 · interactive research briefing</span>}</footer>
    {notice&&<div className="toast" role="status">{notice}</div>}
    {modal==='methods'&&<Modal title="Sources & methods" onClose={()=>setModal(null)} wide><Methods bundle={bundle}/></Modal>}
    {modal==='records'&&<Modal title={detailTitle} onClose={()=>setModal(null)} wide><Records key={detailTitle} rows={detailRows} title={detailTitle}/></Modal>}
    {modal==='notes'&&<Modal title={intro?'Opening · audience prediction':closing?'Closing · land the use case':`Speaker notes · ${CHAPTERS[index].name}`} onClose={()=>setModal(null)}><p className="notes-time">SIX-MINUTE ROUTE · {intro?'0:00–0:35':closing?'5:30–6:00':CHAPTERS[index].time}</p><ol className="speaker-list">{(intro?['Explain qualifying, the grid, and the finish. Ask for an estimate: how often does the first starter win?','Reveal 134/250 = 53.6%. It is a historical rate, not a prediction for an individual driver.','Move to the whole-field pattern.']:closing?['Use the grid as a historical baseline. Name the circuit and desired outcome. Leave room for race events.','Association also reflects the car and driver. Stop at six minutes; Explore is available for questions.']:speakerNotes[s.chapter]).map((n,i)=><li key={i}>{n}</li>)}</ol><a className="text-button" href={`${import.meta.env.BASE_URL}STORY_SCRIPT.md`} download><Icon name="download" size={15}/>Download full speaking route</a></Modal>}
  </div>;
}

function StartDetail({rows,start,cell,cellRows,onRecords}:{rows:DriverRace[];start:number;cell:{start:number;finish:number|null}|null;cellRows:DriverRace[];onRecords:()=>void}){
  const rs=rows.filter(r=>r.grid===start),n=rs.length;const nTop=rs.filter(r=>r.finish!==null&&r.finish<=10).length;const nWin=rs.filter(r=>r.finish===1).length;const dnf=rs.filter(r=>!r.is_finisher).length;
  return <section className="start-detail" aria-live="polite"><span className="field-label">STARTING P{start} · {fmt(n)} STARTS</span>{cell?<p><b>{fmt(cellRows.length)} of {fmt(n)}</b> {cell.finish===null?'did not finish / were disqualified':`finished P${cell.finish}`} ({percent(n?cellRows.length/n:null)}).</p>:<p><b>{fmt(nTop)} of {fmt(n)}</b> reached the top ten.</p>}<dl>{[['Won',nWin],['Top ten',nTop],['DNF / DSQ',dnf]].map(([label,k])=><div key={label}><dt>{label}</dt><dd>{percent(n?Number(k)/n:null)}</dd>{n>0&&<div className="detail-meter" aria-hidden="true"><i style={{width:`${Number(k)/n*100}%`}}/></div>}</div>)}</dl><small className="detail-definition">Win is included in top ten.</small><button className="text-button" onClick={onRecords}>View the records<Icon name="arrow" size={15}/></button></section>;
}
