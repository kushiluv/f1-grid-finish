import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import type {RaceCase} from '../data/types';
import {raceControlAt} from './RaceControlNote';
const race=JSON.parse(readFileSync(new URL('../../public/data/race_case.json',import.meta.url),'utf8')) as RaceCase;
it('only explains race-control milestones reached by the selected lap',()=>{
 for(let lap=0;lap<=69;lap++)expect(raceControlAt(race,lap).lap).toBeLessThanOrEqual(lap);
 expect(raceControlAt(race,11).kind).toBe('wet');
 expect(raceControlAt(race,28).kind).toBe('vsc');
 expect(raceControlAt(race,32).kind).toBe('red');
 expect(raceControlAt(race,33).label).toBe('RESTART ORDER');
 expect(raceControlAt(race,39).kind).toBe('safety-car');
 expect(raceControlAt(race,43).label).toBe('RACING RESUMES');
 expect(raceControlAt(race,69).kind).toBe('finish');
});
