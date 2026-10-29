export type Chapter = 'overview' | 'circuits' | 'recovery' | 'case';
export type Outcome = 'top10' | 'podium' | 'win';
export type DriverRace = {
  race_id: number; year: number; round: number; date: string;
  grand_prix_id: string; circuit_id: string; circuit_name: string;
  circuit_type: string; race_course_length_km: number;
  driver_id: string; driver_name: string; constructor_id: string;
  grid: number | null; grid_text: string; source_grid_original: number | null;
  grid_override_source: string; qualifying_position: number | null;
  finish: number | null; status: string; reason_retired: string;
  laps: number | null; points: number; is_starter: boolean; is_finisher: boolean;
  exclude_no_green_racing: boolean; net_positions_gained: number | null;
};
export type AppState = {
  mode: 'present' | 'explore'; circuitMetric:'order'|'movement'; chapter: Chapter; years: [number,number];
  circuitIds: string[]; outcome: Outcome; selectedStart: number | null;
  selectedBand: number; highlightedDriverId: string;
  cohortDriverId: string; cohortConstructorId: string;
  includeBelgium2021: boolean; caseLap: number | null; caseEvent: number | null;
  showGasly: boolean;
};
export type Summary = {
  races: number; starts: number; finishers: number; r: number | null;
  same: number; sameRate: number | null; p1Starts: number; p1Wins: number;
  p1Rate: number | null; nonfinishers: number; meanMovement: number | null;
};
export type IntervalRecord = {pearson_r_race_bootstrap_95: [number,number] | null; p1_win_rate_wilson_95: [number,number] | null};
export type Uncertainty = Record<string,Record<string,IntervalRecord>>;
export type RaceCase = {
  session: number; title: string; date: string; laps: number;
  traces: {driver_id:string;label:string;driver_number:number;grid:number;finish:number;points:{lap:number;position:number}[]}[];
  events: {lap:number;label:string;title:string;description:string;kind:string}[];
  control_events: RaceControlEvent[];
  red_flag: {start_lap:number;end_lap:number;utc:string}; method:string;
  sources: {title:string;url:string}[];
};
export type RaceControlEvent={lap:number;kind:'wet'|'vsc'|'safety-car'|'red'|'restart'|'finish';label:string;title:string;description:string;source:string;utc?:string;message?:string;band_end_lap?:number};
export type Bundle = {rows:DriverRace[]; evidence:any; uncertainty:Uncertainty; raceCase:RaceCase; provenance:any; audit:any[]};
