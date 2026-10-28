"""Package the built local application and the inputs needed to reproduce it."""
from pathlib import Path
import json, zipfile, hashlib, re

root=Path(__file__).resolve().parents[1]
plan=root.parent/'f1_dashboard_plan'
out=root/'artifacts'
browser=json.loads((out/'browser-validation.json').read_text())
units=json.loads((out/'unit-test-results.json').read_text())
data=json.loads((out/'data-validation.json').read_text())
launcher=json.loads((out/'launcher-validation.json').read_text())
movement=json.loads((out/'movement-production-validation.json').read_text())
assert browser['passed'] and units['success'] and data['passed'] and launcher['passed'] and movement['passed']
assert units['numPassedTests']>=14
assert len(browser['checks'])>=16
failure=out/'screenshots/failure.png'
if failure.exists():failure.unlink()
index=(root/'dist/index.html').read_text()
assets=re.findall(r'(?:src|href)="(\./assets/[^"]+)"',index)
assert assets and all((root/'dist'/a[2:]).exists() for a in assets)
report={
  'status':'built and verified locally',
  'build':'TypeScript type check and Vite production build passed',
  'unit_tests_passed':units['numPassedTests'],
  'browser_checks_passed':len(browser['checks']),
  'additional_production_checks_passed':len(movement['checks']),
  'verified_viewports':browser['viewports'],
  'external_runtime_requests':0,
  'visual_review':'Desktop, projector, mobile and attributed chart-export images inspected; responsive sizing, labels and export background/attribution checked.',
  'launcher_verified':True,
  'production_javascript_sha256':hashlib.sha256((root/'dist'/next(a[2:] for a in assets if a.endswith('.js'))).read_bytes()).hexdigest(),
  'revision':'presentation-context-and-top-ten-movement',
  'scope':'Interactive opening, four analytical chapters with staged comparisons and race checkpoints, full-stage conclusion, Present/Explore modes, source/AI notes, records and exports. Historical association; no calibrated future-race forecast.',
}
(out/'release-validation.json').write_text(json.dumps(report,indent=2))
archive=out/'F1_Dashboard_App.zip'
files=[]
for file in sorted(root.rglob('*')):
    if not file.is_file() or file==archive:continue
    rel=file.relative_to(root)
    if any(p in ('node_modules','.git','__pycache__') for p in rel.parts):continue
    if file.name=='.DS_Store' or file.suffix in ('.tsbuildinfo','.pyc'):continue
    files.append((file,'f1_dashboard/'+str(rel)))
plan_files=[
  'README.md','source/explore_f1.py','source/unpack_snapshot.py','research/grid_overrides.json',
  'data/raw/manifest.json','data/raw/f1db-v2025.24.0-csv.zip',
  'output/exploratory_driver_race.csv','output/exploratory_race_metrics.csv','output/exploratory_evidence.json',
  'output/F1_Dashboard_Impact_Redesign_Brief.md','output/F1_Dashboard_Blueprint.md','output/F1_Dashboard_Blueprint.pdf','output/BUILD_BRIEF.md','output/STORY_SCRIPT.md','output/PRESENTATION_EXECUTION_PLAN.md','output/AI_USE_NOTES.md'
]
for rel in plan_files:
    assert (plan/rel).exists(),rel
    files.append((plan/rel,'f1_dashboard_plan/'+rel))
files.extend((f,'f1_dashboard_plan/research/lectures/'+f.name) for f in sorted((plan/'research/lectures').glob('*.txt')))
files.extend((f,'f1_dashboard_plan/data/openf1/'+f.name) for f in sorted((plan/'data/openf1').glob('*.json')))
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for file,name in files:z.write(file,name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert z.read('f1_dashboard/dist/index.html')==(root/'dist/index.html').read_bytes()
    assert z.getinfo('f1_dashboard/Start Dashboard.command').external_attr>>16 & 0o111
print('Created',archive,'files',len(files),'bytes',archive.stat().st_size)
