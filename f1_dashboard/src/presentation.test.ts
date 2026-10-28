import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {adjacentStep,readStory,readPresentationState,stateForStep,storyUrl} from './presentation';
import {readState,preset} from './state';
import {bandStats,selectBase} from './data/metrics';
import type {DriverRace} from './data/types';
const rows=JSON.parse(readFileSync(new URL('../public/data/driver_race.json',import.meta.url),'utf8')) as DriverRace[];

describe('presentation routes and verified story bridge',()=>{
  it('opens the context at the root while honoring existing chapter links',()=>{
    expect(readStory('')).toBe('intro');
    expect(readStory('?mode=present&chapter=case')).toBe('case-grid');
    expect(readStory('?mode=present&chapter=circuits&step=case-43')).toBe('circuits-field');
  });
  it('round-trips partial reveals without inheriting analytical URL filters',()=>{
    const state=stateForStep('case-33');const url=storyUrl(state,'case-33');
    const step=readStory(url);expect(step).toBe('case-33');expect(stateForStep(step).caseLap).toBe(33);
    state.caseLap=34;expect(readPresentationState(storyUrl(state,'case-33')).caseLap).toBe(34);
    const custom=stateForStep('recovery-top10');custom.outcome='podium';custom.selectedBand=0;
    expect(readPresentationState(storyUrl(custom,'recovery-top10'))).toEqual(custom);
    const recovery=stateForStep('recovery-back');expect(recovery.outcome).toBe('win');expect(recovery.selectedBand).toBe(4);
    expect(stateForStep(readStory('?step=recovery-win&driver=max-verstappen')).cohortDriverId).toBe('');
  });
  it('preserves Explore URLs independently of hidden presentation beats',()=>{
    const state=preset('recovery','explore');state.years=[2022,2025];state.cohortDriverId='max-verstappen';state.outcome='podium';
    const again=readState(storyUrl(state,'case-69'),rows);expect(again).toEqual(state);
  });
  it('backs out of reveals in a deterministic sequence',()=>{
    expect(adjacentStep('circuits-both',-1)).toBe('circuits-field');
    expect(adjacentStep('case-33',-1)).toBe('case-11');
    expect(adjacentStep('case-69',1)).toBe('closing');expect(adjacentStep('intro',-1)).toBe('intro');
  });
  it('links the unique winning back-group record to the pinned race, not the P11–15 rate',()=>{
    const back=bandStats(selectBase(rows,preset('overview')),'win')[4];
    const winning=back.rows.filter(r=>r.finish===1);
    expect(back.n).toBe(1185);expect(back.k).toBe(1);expect(winning).toHaveLength(1);
    expect(winning[0]).toMatchObject({year:2024,grand_prix_id:'sao-paulo',driver_id:'max-verstappen',grid:17});
    const filtered=preset('recovery','explore');filtered.years=[2022,2023];
    expect(bandStats(selectBase(rows,filtered),'win')[4].k).toBe(0);
  });
});
