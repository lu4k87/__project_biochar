#!/usr/bin/env python3
"""Aufnahmen der Biochar-Seite per CDP (Muster tests/hs_card_check.py), z. B. fuer Vorher/Nachher-Boegen mit ?dev (window.__bc).
Aufruf: python3 tests/shots_cdp.py <shots.json> <bilder-ordner>; shots.json = Liste von
{name, level, query ("&dev&seed=7", eigenes "&q=0" ersetzt das feste q=3), scheme (light|dark), motion (reduce), width, height, css, js, clip (Selektor, Liste oder [x, y, w, h]), pad, scale, wait}.
Wartet je Shot auf body.is-ready, spielt css/js ein, schreibt <name>.png + <name>.shot.json (Format wie preview/capture.py)."""
import json, os, subprocess, sys, time, urllib.request, base64, socket, websocket
import tempfile, shutil
PORT = int(os.environ.get('BIOCHAR_TEST_PORT', 8475)); CDP = int(os.environ.get('BIOCHAR_CDP_PORT', 9340))   # eigene Instanz, Server des Users (8470) bleibt
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PROFILE = tempfile.mkdtemp(prefix='biochar-shots-')
def port_open(p):
    with socket.socket() as s: return s.connect_ex(('127.0.0.1', p)) == 0
server = None if port_open(PORT) else subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1', '--directory', os.path.join(ROOT, 'web')],
                                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
shots = json.load(open(sys.argv[1])); OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
chrome = subprocess.Popen(['google-chrome', '--headless=new', '--enable-gpu', '--use-angle=gl', '--hide-scrollbars',
    f'--remote-debugging-port={CDP}', f'--user-data-dir={PROFILE}', '--window-size=1440,900', 'about:blank'],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print('chrome pid', chrome.pid, flush=True)
try:
    for _ in range(50):
        try: targets = json.load(urllib.request.urlopen(f'http://127.0.0.1:{CDP}/json')); break
        except Exception: time.sleep(0.2)
    page = next(t for t in targets if t['type'] == 'page')
    ws = websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True); ws.settimeout(60)
    seq = 0; events = []
    def call(method, params=None):
        global seq; seq += 1; ws.send(json.dumps({'id': seq, 'method': method, 'params': params or {}}))
        while True:
            m = json.loads(ws.recv())
            if m.get('id') == seq: return m.get('result', {})
            if 'method' in m: events.append(m)
    def js(expr):
        r = call('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': True})
        if 'exceptionDetails' in r: print('  JS-Fehler:', r['exceptionDetails'].get('text'), (r['exceptionDetails'].get('exception') or {}).get('description', '')[:200], flush=True)
        return r.get('result', {}).get('value')
    call('Runtime.enable'); call('Page.enable'); call('Log.enable'); call('Network.enable'); call('Network.setCacheDisabled', {'cacheDisabled': True})
    for s in shots:
        w, h = s.get('width', 1440), s.get('height', 900)
        call('Emulation.setDeviceMetricsOverride', {'width': w, 'height': h, 'deviceScaleFactor': 1, 'mobile': w < 600})
        call('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-color-scheme', 'value': s.get('scheme', 'light')}, {'name': 'prefers-reduced-motion', 'value': s.get('motion', 'no-preference')}]})
        events.clear(); t0 = time.time()
        call('Page.navigate', {'url': f"http://127.0.0.1:{PORT}/?{'' if '&q=' in s.get('query', '') else 'q=3&'}shot={s['name']}{s.get('query', '')}#ebene={s.get('level', 1)}"})
        ok = False
        for _ in range(300):
            if js("document.body.classList.contains('is-ready') && !document.body.classList.contains('is-loading') && !document.getElementById('hotspots').classList.contains('is-hidden')"): ok = True; break
            time.sleep(0.2)
        if s.get('css'): js("(() => { const st = document.createElement('style'); st.id = 'x-css'; st.textContent = " + json.dumps(s['css']) + "; document.head.append(st); })()")
        if s.get('js'): js("(async () => { " + s['js'] + " })()")
        time.sleep(s.get('wait', 1.5))
        params = {'format': 'png'}
        if s.get('clip'):
            pad = s.get('pad', 12); sc = s.get('scale', 2)
            r = js("(() => { const sel = " + json.dumps(s['clip']) + "; if (Array.isArray(sel) && sel.length === 4 && typeof sel[0] === 'number') return [sel[0], sel[1], sel[0] + sel[2], sel[1] + sel[3]]; const els = (Array.isArray(sel) ? sel : [sel]).map((q) => document.querySelector(q)).filter(Boolean); if (!els.length) return null; let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0; for (const e of els) { const b = e.getBoundingClientRect(); x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom); } return [x0, y0, x1, y1]; })()")
            if not r: print(f"  {s['name']}: clip {s['clip']} nicht gefunden", flush=True)
            else:
                x0, y0, x1, y1 = r; x0 = max(0, x0 - pad); y0 = max(0, y0 - pad); x1 = min(w, x1 + pad); y1 = min(h, y1 + pad)
                params['clip'] = {'x': x0, 'y': y0, 'width': x1 - x0, 'height': y1 - y0, 'scale': sc}
                json.dump({'scale': sc, 'clip': True, 'css': [round(x1 - x0), round(y1 - y0)], 'texts': []}, open(f"{OUT}/{s['name']}.shot.json", 'w'))
        data = call('Page.captureScreenshot', params)['data']
        open(f"{OUT}/{s['name']}.png", 'wb').write(base64.b64decode(data))
        errs = [e for e in events if e['method'] in ('Runtime.exceptionThrown',) or (e['method'] == 'Log.entryAdded' and e['params']['entry']['level'] == 'error')]
        print(f"{s['name']}: {'ok' if ok else 'NICHT READY'} {time.time() - t0:.1f} s · Fehler {len(errs)}" + (' · ' + str(errs[0])[:160] if errs else ''), flush=True)
finally:
    chrome.terminate(); chrome.wait()
    if server: server.terminate(); server.wait()
    shutil.rmtree(PROFILE, ignore_errors=True)
