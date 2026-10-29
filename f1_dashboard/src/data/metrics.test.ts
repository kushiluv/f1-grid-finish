import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {bandStats,circuitStats,gridStarts,heatmap,pearson,selectBase,summarize,percent,topTenMovement} from './metrics';
import type {DriverRace} from './types';
import {preset,readState,stateUrl} from '../state';
const rows=JSON.parse(readFileSync(new URL('../../public/data/driver_race.json',import.meta.url),'utf8')) as DriverRace[];

describe('real-data fixtures and denominator rules',()=>{
  const selected=selectBase(rows,preset('overview'));
  it('matches the audited study counts and full-precision correlation',()=>{
    const s=summarize(selected);
    expect(s.races).toBe(251);expect(s.starts).toBe(4920);expect(s.finishers).toBe(4117);
    expect(s.r).toBeCloseTo(.7646446838008164,12);expect(s.same).toBe(713);
    expect(s.p1Wins).toBe(134);expect(s.p1Starts).toBe(250);
  });
  it('keeps retirements in outcome rates, including rare nonzero wins',()=>{
    const b=bandStats(selected,'win')[3];expect(b.k).toBe(2);expect(b.n).toBe(1238);
    expect(bandStats(selected,'top10')[3].k).toBe(402);
    expect(percent(b.rate)).toBe('0.16%');
    expect(b.n).toBeGreaterThan(b.rows.filter(r=>r.is_finisher).length);
  });
  it('normalises whole heatmap columns without dropping DNF/DSQ',()=>{
    const h=heatmap(selected);
    h.denoms.forEach((n,i)=>{
      expect(h.counts.reduce((a,r)=>a+r[i],0)).toBe(n);
      if(n)expect(h.values.reduce((a,r)=>a+(r[i]??0),0)).toBeCloseTo(1,12);
    });
    expect(h.counts[22].reduce((a,b)=>a+b,0)).toBe(803);
  });
  it('separates no data from measured zero and constant correlation',()=>{
    const h=heatmap(selected.filter(r=>r.grid===1));
    expect(h.values[0][1]).toBeNull();expect(h.values[21][0]).toBe(0);
    expect(pearson([],[])).toBeNull();expect(pearson([1,1,1],[1,2,3])).toBeNull();
    expect(summarize([]).p1Rate).toBeNull();expect(percent(null)).toBe('—');expect(percent(0)).toBe('0.0%');
  });
  it('does not count a DNS pole award as an actual first-position start',()=>{
    const monaco=circuitStats(selected).find(c=>c.id==='monaco')!;
    expect(monaco.races).toBe(11);expect(monaco.p1Starts).toBe(10);expect(monaco.p1Wins).toBe(6);
    const dns=selected.find(r=>r.driver_id==='charles-leclerc'&&r.year===2021&&r.circuit_id==='monaco')!;
    expect(dns.is_starter).toBe(false);expect(gridStarts([dns])).toHaveLength(0);
  });
  it('excludes pit-lane starters and classified retirees from the right subsets',()=>{
    const pl=selected.find(r=>r.driver_id==='sergio-perez'&&r.year===2023&&r.grand_prix_id==='qatar')!;
    expect(pl.grid_text).toBe('PL');expect(gridStarts([pl])).toHaveLength(0);
    const retired=selected.find(r=>r.finish!==null&&r.is_starter&&r.grid!==null&&!r.is_finisher)!;
    expect(summarize([retired]).starts).toBe(1);expect(summarize([retired]).finishers).toBe(0);
    expect(heatmap([retired]).counts[22][retired.grid!-1]).toBe(1);
  });
});
describe('filter and URL state contracts',()=>{
  it('highlighting is separate from cohort filtering',()=>{
    const a=preset('overview','explore');a.highlightedDriverId='max-verstappen';
    expect(summarize(selectBase(rows,a)).starts).toBe(4920);
    a.cohortDriverId='max-verstappen';expect(selectBase(rows,a).every(r=>r.driver_id==='max-verstappen')).toBe(true);
    expect(summarize(selectBase(rows,a)).starts).toBeLessThan(4920);
  });
  it('round-trips valid Explore states and rejects invalid IDs/years',()=>{
    const s=preset('recovery','explore');s.years=[2022,2025];s.circuitIds=['monaco'];s.outcome='win';
    const again=readState(stateUrl(s),rows);expect(again.years).toEqual([2022,2025]);expect(again.circuitIds).toEqual(['monaco']);expect(again.outcome).toBe('win');
    const invalid=readState('?chapter=garbage&mode=explore&years=2026,2010&circuits=made-up&driver=missing',rows);
    expect(invalid.chapter).toBe('overview');expect(invalid.years).toEqual([2014,2025]);expect(invalid.circuitIds).toEqual([]);expect(invalid.cohortDriverId).toBe('');
  });
  it('loads full presentation presets instead of hidden URL filters',()=>{
    const s=readState('?mode=present&chapter=overview&driver=max-verstappen&years=2023,2023',rows);
    expect(s.cohortDriverId).toBe('');expect(s.years).toEqual([2014,2025]);
  });
});

 describe('top-ten starter movement',()=>{
  it('matches independently tallied circuit samples, signs and totals',()=>{
    const base=selectBase(rows,preset('overview'));
    for(const [id,starts,n,total] of [['monaco',109,97,-9],['yas-marina',120,110,-73],['monza',120,108,-38],['spa-francorchamps',108,92,-55]] as const){
      const m=topTenMovement(base.filter(r=>r.circuit_id===id));
      expect(m.starts).toBe(starts);expect(m.n).toBe(n);expect(m.totalNet).toBe(total);expect(m.meanNet).toBeCloseTo(total/n,12);
      expect(m.meanAbsolute!).toBeGreaterThan(Math.abs(m.meanNet!));
    }
  });
  it('separates net from absolute change, and excludes nonfinishers and other starts',()=>{
    const r=rows[0];const make=(grid:number|null,finish:number|null,is_finisher=true,is_starter=true)=>({...r,grid,finish,is_finisher,is_starter});
    const m=topTenMovement([make(2,1),make(2,3),make(10,20,false),make(11,1),make(null,2),make(1,1,true,false)]);
    expect(m).toEqual({starts:3,n:2,totalNet:0,meanNet:0,meanAbsolute:1});
    expect(topTenMovement([]).meanNet).toBeNull();expect(topTenMovement([make(1,null,false)]).meanAbsolute).toBeNull();
  });
});

it('uses mean absolute changes rather than the absolute signed mean and includes São Paulo',()=>{
 const all=selectBase(rows,preset('overview'));
 const cs=circuitStats(all),monaco=cs.find(c=>c.id==='monaco')!,sao=cs.find(c=>c.id==='interlagos')!,hun=cs.find(c=>c.id==='hungaroring')!;
 expect(monaco.movement.meanAbsolute).toBeCloseTo(127/97,12);expect(monaco.movement.meanAbsolute).not.toBeCloseTo(Math.abs(monaco.movement.meanNet!));
 expect(sao.name).toBe('São Paulo');expect(sao.movement.meanAbsolute).toBeCloseTo(183/94,12);expect(sao.p1Wins).toBe(8);expect(sao.p1Starts).toBe(11);
 expect(hun.movement.meanAbsolute).toBeCloseTo(255/107,12);
 const eligible=cs.filter(c=>c.races>=8);expect(eligible).toHaveLength(19);expect(eligible.sort((a,b)=>a.movement.meanAbsolute!-b.movement.meanAbsolute!)[0].id).toBe('monaco');expect(eligible.at(-1)!.id).toBe('hungaroring');
 expect(eligible.sort((a,b)=>a.r!-b.r!)[0].id).toBe('sochi');
});

// The closing comparison counts actual results, not rounded chart percentages.
it('calculates movement tails on top-ten finishers and Wilson intervals on starts',async()=>{
 const {movementTail,wilson}=await import('./metrics');
 const monaco=rows.filter(r=>r.circuit_id==='monaco'&&!r.exclude_no_green_racing);
 const hungary=rows.filter(r=>r.circuit_id==='hungaroring'&&!r.exclude_no_green_racing);
 expect(movementTail(monaco,3)).toEqual({k:17,n:97,rate:17/97});
 expect(movementTail(hungary,3)).toEqual({k:41,n:107,rate:41/107});
 expect(movementTail(monaco,0).rate).toBe(1);
 const interval=wilson(11,12);expect(interval[0]).toBeCloseTo(.64612,4);expect(interval[1]).toBeCloseTo(.98513,4);
});
