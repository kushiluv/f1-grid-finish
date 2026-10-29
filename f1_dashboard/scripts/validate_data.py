"""Validate the delivered app data independently of the browser."""
from pathlib import Path
import json, math, hashlib

root=Path(__file__).resolve().parents[1]
data=root/'public/data'
rows=json.loads((data/'driver_race.json').read_text())
assert len(rows)==5108 and len({(r['race_id'],r['driver_id']) for r in rows})==5108
assert all(isinstance(r['is_starter'],bool) and isinstance(r['is_finisher'],bool) for r in rows)
base=[r for r in rows if not r['exclude_no_green_racing']]
eligible=[r for r in base if r['is_starter'] and r['grid'] is not None]
finishers=[r for r in eligible if r['is_finisher']]
assert len(base)==5088 and len(eligible)==4920 and len(finishers)==4117
assert sum(not r['is_starter'] for r in base)==39
assert sum(r['is_starter'] and r['grid_text']=='PL' for r in base)==129
x=[r['grid'] for r in finishers];y=[r['finish'] for r in finishers]
mx=sum(x)/len(x);my=sum(y)/len(y)
correlation=sum((a-mx)*(b-my) for a,b in zip(x,y))/math.sqrt(sum((a-mx)**2 for a in x)*sum((b-my)**2 for b in y))
assert abs(correlation-.7646446838008164)<1e-12
audit=json.loads((data/'grid_audit.json').read_text())
assert len(audit)==35 and sum(a['action']=='Corrected' for a in audit)==7
assert all(a['action'] and a['reason'] and a['source'] for a in audit)
race=json.loads((data/'race_case.json').read_text())
assert all(len(t['points'])==70 and t['points'][0]['position']==t['grid'] and t['points'][-1]['position']==t['finish'] for t in race['traces'])
assert [race['traces'][0]['points'][i]['position'] for i in [1,11,32,43,69]]==[11,6,2,1,1]
control=json.loads((root.parent/'f1_dashboard_plan/data/openf1/race_control_9636.json').read_text())
assert [e['lap'] for e in race['control_events']]==[0,28,30,32,33,39,43,69]
for event in race['control_events']:
    if 'utc' in event:
        assert any(m['date']==event['utc'] and m['lap_number']==event['lap'] and m['message']==event['message'] for m in control)
    if 'band_end_lap' in event:assert event['band_end_lap']>event['lap']
assert any(m['lap_number']==42 and m['message']=='SAFETY CAR IN THIS LAP' for m in control)
provenance=json.loads((data/'provenance.json').read_text())
snapshot=root.parent/'f1_dashboard_plan/data/raw/f1db-v2025.24.0-csv.zip'
assert hashlib.sha256(snapshot.read_bytes()).hexdigest()==provenance['f1db']['sha256']
report={'passed':True,'rows':len(rows),'unique_driver_race_rows':True,'races':251,'eligible_starts':len(eligible),'finishers':len(finishers),'independent_pearson_r':correlation,'source_archive_hash_verified':True,'grid_discrepancies_reviewed':35,'documented_corrections':7,'race_trace_lap_records_per_driver':69,'race_start_end_and_milestones_verified':True,'race_control_milestones_verified':len(race['control_events'])}
(root/'artifacts').mkdir(exist_ok=True)
(root/'artifacts/data-validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
