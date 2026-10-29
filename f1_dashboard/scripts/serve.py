"""Open the built dashboard locally. Python only; no Node or internet required."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import argparse
import threading
import webbrowser

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description='Run Grid / Finish locally.')
parser.add_argument('--port',type=int,default=5180)
parser.add_argument('--no-open',action='store_true')
args=parser.parse_args()
dist=root/'dist'
if not (dist/'index.html').exists():
    raise SystemExit('The production build is missing. Run npm install and npm run build, or use the complete application download.')

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        super().end_headers()
    def log_message(self,*args):
        pass

handler=partial(Handler,directory=str(dist))
server=None
for port in [args.port,*range(args.port+1,args.port+11)]:
    try:
        server=ThreadingHTTPServer(('127.0.0.1',port),handler)
        break
    except OSError:
        continue
if server is None:
    raise SystemExit('No local port was available. Close another dashboard terminal and try again.')
url=f'http://127.0.0.1:{server.server_port}/'
print('\nGRID / FINISH — Starting position and race outcomes',flush=True)
print('BAIT 518 · Group 3 · BA2\n',flush=True)
print(f'Open the dashboard: {url}',flush=True)
print('Keep this terminal open while presenting. Press Control+C to stop.\n',flush=True)
if not args.no_open:
    threading.Timer(.5,lambda:webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\nDashboard stopped.')
finally:
    server.server_close()
