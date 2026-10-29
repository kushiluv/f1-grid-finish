"""Prepare local, typed app data and audit decisions from the planning snapshot."""
from pathlib import Path
import csv, json, hashlib, datetime, sys, contextlib, io, runpy
from prepare_race_control import build_control_events

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT.parent / 'f1_dashboard_plan'
OUT = ROOT / 'public/data'
OUT.mkdir(parents=True, exist_ok=True)
if not (PLAN/'data/raw/f1db-races.csv').exists():
    runpy.run_path(str(PLAN/'source/unpack_snapshot.py'))

def write(name, data):
    (OUT/name).write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))

raw_rows = list(csv.DictReader((PLAN/'output/exploratory_driver_race.csv').open()))
numeric = {'race_id','year','round','race_course_length_km','grid','source_grid_original','qualifying_position','finish','laps','points','net_positions_gained'}
booleans = {'is_starter','is_finisher','exclude_no_green_racing'}
rows=[]
for row in raw_rows:
    typed={}
    for k,v in row.items():
        if k in numeric: typed[k] = float(v) if '.' in v else int(v) if v else None
        elif k in booleans:
            assert v in ('True','False')
            typed[k] = v == 'True'
        else: typed[k]=v
    rows.append(typed)
assert len({(r['race_id'],r['driver_id']) for r in rows}) == 5108
base=[r for r in rows if not r['exclude_no_green_racing'] and r['is_starter'] and r['grid'] is not None]
assert len(base)==4920 and sum(r['is_finisher'] for r in base)==4117
write('driver_race.json',rows)

evidence=json.loads((PLAN/'output/exploratory_evidence.json').read_text())
write('evidence.json',evidence)
lookup={(r['race_id'],r['driver_id']):r for r in rows}
overrides={(o['race_id'],o['driver_id']):o for o in json.loads((PLAN/'research/grid_overrides.json').read_text())}
audit=[]
for race_id,driver,assigned,result in evidence['audit']['grid_table_discrepancies']:
    row=lookup[int(race_id),driver]
    key=(int(race_id),driver)
    if key in overrides:
        action='Corrected';reason=overrides[key]['reason'];source=overrides[key]['source']
    elif row['status'] in ('DNS','DNP'):
        action='Excluded: no start';reason='Published grid assignment exists, but result records no race start.';source=evidence['source']['source']
    elif row['exclude_no_green_racing']:
        action='Excluded: special race';reason='Belgium 2021 is outside the main study; retained for sensitivity.';source='https://www.formula1.com/en/latest/article/verstappen-takes-victory-in-severely-shortened-rain-affected-belgian-gp-as.4AqGhiKQfFaqr7KZjyDjPZ'
    elif row['grid_text']=='PL':
        action='Retained: actual pit-lane start';reason='The result records the actual pit-lane start after the published grid. Kept outside numeric-grid comparisons.';source=evidence['source']['source']
    elif int(race_id)==920:
        action='Retained: actual grid box';reason='Maldonado lined up one row back at Bahrain 2015; Stevens was displaced behind him. Preserve recorded actual boxes, not assigned boxes.';source='https://www.formula1.com/en/results/2015/races/920/bahrain/race-result'
    elif int(race_id)==1096 and driver=='nico-hulkenberg':
        action='Retained: actual grid box';reason='Hülkenberg mistakenly occupied empty grid box 12 instead of his assigned 14; preserve the actual start.';source='https://www.formula1.com/en/latest/article/hulkenberg-acknowledges-big-mistake-as-qatar-race-wrecked-by-wrong-grid-slot.41hvrACz2D2HgJU89w8mHa'
    else:
        raise AssertionError(f'Unreviewed grid discrepancy: {key}')
    audit.append({'race_id':int(race_id),'year':row['year'],'driver':row['driver_name'],'circuit':row['circuit_name'],'published_grid':assigned,'result_grid_original':result,'app_grid':row['grid_text'],'action':action,'reason':reason,'source':source})
assert len(audit)==35
write('grid_audit.json',audit)

lap_file=PLAN/'data/openf1/jolpica_laps_2024_21_full.json'
lapdata=json.loads(lap_file.read_text())
driver_map=[('max_verstappen','max-verstappen','Verstappen',1,17,1),('norris','lando-norris','Norris',4,1,6),('ocon','esteban-ocon','Ocon',31,4,2),('gasly','pierre-gasly','Gasly',10,13,3)]
traces=[]
for remote,driver_id,label,number,grid,finish in driver_map:
    points=[{'lap':0,'position':grid}]
    for lap in lapdata['laps']:
        found=[t for t in lap['Timings'] if t['driverId']==remote]
        assert len(found)==1
        points.append({'lap':lap['number'],'position':int(found[0]['position'])})
    assert len(points)==70 and points[-1]['position']==finish
    traces.append({'driver_id':driver_id,'label':label,'driver_number':number,'grid':grid,'finish':finish,'points':points})
max_points={p['lap']:p['position'] for p in traces[0]['points']}
assert [max_points[x] for x in [1,11,32,43,69]]==[11,6,2,1,1]
write('race_case.json',{
    'session':9636,'title':'São Paulo 2024','date':'2024-11-03','laps':69,'traces':traces,
    'events':[
        {'lap':11,'label':'Early recovery','title':'17th → 6th by lap 11','description':'Verstappen gained ground early, reaching sixth by the end of lap eleven.','kind':'progress'},
        {'lap':33,'label':'The race stops','title':'A changed order at the restart','description':'Pit visits and the red-flag sequence reshaped the order. Ocon led Verstappen and Gasly into the restart. Visits during the suspension are not ordinary racing pit stops.','kind':'red'},
        {'lap':43,'label':'A new leader','title':'Verstappen takes first','description':'At the restart, Verstappen passed Ocon for the lead on lap 43. He finished first; Norris, the first-position starter, finished sixth.','kind':'restart'}
    ],
    'red_flag':{'start_lap':32,'end_lap':33,'utc':'2024-11-03T16:37:22Z'},
    'control_events':build_control_events(PLAN/'data/openf1/race_control_9636.json'),
    'method':'Actual lap-end positions from the Jolpica lap chart; grid anchor and endpoints cross-checked with F1DB. Key milestones corroborated by the FIA race report. Race-control timestamps are retained in raw data; a message lap can differ from the next racing lap. This is a deliberately selected exceptional race.',
    'sources':[
        {'title':'Jolpica lap chart','url':'https://api.jolpi.ca/ergast/f1/2024/21/laps/?format=json&limit=100'},
        {'title':'FIA race account','url':'https://www.fia.com/news/f1-vestappen-takes-stunning-sao-paulo-win-p17-grid-alpine-score-double-podium'},
        {'title':'OpenF1 session data','url':'https://api.openf1.org/v1/sessions?session_key=9636'},
        {'title':'OpenF1 race-control messages','url':'https://api.openf1.org/v1/race_control?session_key=9636'}
    ]
})

with contextlib.redirect_stdout(io.StringIO()):
    analysis=runpy.run_path(str(PLAN/'source/explore_f1.py'))
ci_full={x['circuit_id']:x for x in evidence['circuits']}
ci_recent={}
for cid in sorted({r['circuit_id'] for r in base}):
    rs=[r for r in base if r['year']>=2022 and r['circuit_id']==cid]
    if rs:ci_recent[cid]=analysis['summarize'](rs,True)
write('uncertainty.json',{'2014-2025':ci_full,'2022-2025':ci_recent})
write('provenance.json',{
    'data_version':'F1DB v2025.24.0 · 7 documented overrides',
    'scope':'2014–2025 Grand Prix races; sprints excluded; Belgium 2021 excluded by default',
    'f1db':evidence['source'],
    'grid_review':{'differences_reviewed':35,'documented_overrides':7,'decisions':'All source-table differences have an explicit disposition in grid_audit.json. Late pit-lane starts and non-starts are retained as result statuses; wrong-box starts use recorded actual boxes. This is reconciliation of the source records, not independent verification of every historic result.'},
    'case_lap_source':{'title':'Jolpica F1 API','urls':lapdata['urls'],'sha256':hashlib.sha256(lap_file.read_bytes()).hexdigest(),'records':1133,'laps':69},
    'openf1':json.loads((PLAN/'data/openf1/sources.json').read_text()),
    'attribution':'F1DB (CC BY 4.0), Jolpica and OpenF1; FIA/Formula 1 for corroboration. Independent educational project, unaffiliated with Formula 1.',
    'ai':'OpenAI Codex assisted with source assessment, code, analysis, drafting and interface implementation. The project team is responsible for the final interpretation and presentation.'
})
print('Prepared',len(rows),'rows,',len(base),'eligible grid starts;',len(traces),'verified 69-lap traces; all 35 grid discrepancies have recorded decisions.')
