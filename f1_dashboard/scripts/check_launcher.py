"""Check that the local Python launcher serves the exact production artifacts."""
from pathlib import Path
from urllib.request import urlopen
import hashlib
import json
import os
import re

root = Path(__file__).resolve().parents[1]
base = os.environ.get('F1_DASHBOARD_URL', 'http://127.0.0.1:5182/').rstrip('/') + '/'
dist = root / 'dist'
index = (dist / 'index.html').read_text()
assets = re.findall(r'(?:src|href)="\./([^\"]+)"', index)
files = ['index.html', *assets, 'assets/f1-logo.svg', 'STORY_SCRIPT.md']
files += ['data/' + f.name for f in sorted((dist / 'data').glob('*.json'))]
for rel in files:
    with urlopen(base + rel) as response:
        assert response.status == 200, rel
        assert response.read() == (dist / rel).read_bytes(), rel
for file in (root / 'public').rglob('*'):
    if file.is_file():
        assert file.read_bytes() == (dist / file.relative_to(root / 'public')).read_bytes(), str(file)
report = {
    'passed': True,
    'revision': 'absolute-movement-and-race-control',
    'launcher': 'scripts/serve.py',
    'runtime': 'Python 3 standard library',
    'http_status': 200,
    'built_index_and_data_bytes_match': True,
    'public_assets_and_script_match_build': True,
    'checked_files': files,
    'node_required_to_run_build': False,
    'bind_host': '127.0.0.1',
    'production_url': base,
    'built_index_sha256': hashlib.sha256((dist / 'index.html').read_bytes()).hexdigest(),
}
(root / 'artifacts/launcher-validation.json').write_text(json.dumps(report, indent=2))
print('Verified exact production bytes for', len(files), 'files and all public assets.')
