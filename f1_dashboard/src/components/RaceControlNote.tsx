import type {RaceCase} from '../data/types';

export function raceControlAt(race:RaceCase,lap:number){
 return race.control_events.filter(e=>e.lap<=lap).at(-1)??race.control_events[0];
}

export function RaceControlNote({race,lap,playing}:{race:RaceCase;lap:number;playing:boolean}){
 const event=raceControlAt(race,lap);
 return <div className={`race-control-note control-${event.kind}`} key={event.lap} aria-live={playing?'off':'polite'} aria-label="Latest race-control milestone">
  <div><span className="control-badge"><i aria-hidden="true"/>{event.label}</span><small>{event.lap===0?'AT THE START':`LAP ${event.lap}`}</small></div>
  <p>{event.description}</p>
  <div className="race-control-key" aria-label="Chart shading"><span><i/>Safety car / VSC</span><span><i/>Red-flag stop</span></div>
 </div>;
}
