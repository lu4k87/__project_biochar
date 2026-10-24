# Prüft die Lage der Info-Karte im Headless-Chrome per CDP (echte GPU, AGENTS.md §5): je Ebene jede Karte über die Tafel
# öffnen, warten bis sie steht, dann Überlappung mit REM-Leiste, Knopfleiste, Hinweis, Tafel, Kopf, Schiene, Einblendung,
# anderen Abzeichen und dem Fensterrand messen (Zero Overlap); Konsole ohne Fehler.
# Aufruf: python3 tests/hs_card_check.py [breiten=1440,390] [ebenen=1,2,3,4,5,6,7] [bilder-ordner]  (SCHEME=light für hell;
# eigene Instanz auf Port 8471, Server des Users bleibt). Karte „--“ = Abzeichen gerade nicht sichtbar (zählt nicht)
import base64, json, os, socket, subprocess, sys, tempfile, time, urllib.request
import websocket   # websocket-client

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('BIOCHAR_TEST_PORT', 8471)); CDP = 9334
WIDTHS = [int(w) for w in (sys.argv[1] if len(sys.argv) > 1 else '1440,390').split(',')]
LEVELS = [int(n) for n in (sys.argv[2] if len(sys.argv) > 2 else '1,2,3,4,5,6,7').split(',')]
SHOTS = sys.argv[3] if len(sys.argv) > 3 else None
SCHEME = os.environ.get('SCHEME', 'dark')
PROFILE = tempfile.mkdtemp(prefix='biochar-card-')
if SHOTS: os.makedirs(SHOTS, exist_ok=True)

def port_open(p):
    with socket.socket() as s: return s.connect_ex(('127.0.0.1', p)) == 0
server = None if port_open(PORT) else subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1', '--directory', os.path.join(ROOT, 'web')],
                                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
chrome = subprocess.Popen(['google-chrome', '--headless=new', '--enable-gpu', '--use-angle=gl', '--hide-scrollbars',
    f'--remote-debugging-port={CDP}', f'--user-data-dir={PROFILE}', '--window-size=1440,900', 'about:blank'],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: targets = json.load(urllib.request.urlopen(f'http://127.0.0.1:{CDP}/json')); break
        except Exception: time.sleep(0.2)
    page = next(t for t in targets if t['type'] == 'page')
    ws = websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True); ws.settimeout(30)
    seq = 0; events = []
    def call(method, params=None):
        global seq; seq += 1; ws.send(json.dumps({'id': seq, 'method': method, 'params': params or {}}))
        while True:
            m = json.loads(ws.recv())
            if m.get('id') == seq: return m.get('result', {})
            if 'method' in m: events.append(m)
    def js(expr):
        return call('Runtime.evaluate', {'expression': expr, 'returnByValue': True}).get('result', {}).get('value')
    for m in ('Runtime.enable', 'Log.enable', 'Page.enable'): call(m)
    MEASURE = """(() => { const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(), cs = getComputedStyle(el);
        if (!b.width || !b.height || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return null;
        return [b.left, b.top, b.right, b.bottom].map(Math.round); };
      const q = (s) => document.querySelector(s), ps = document.getElementById('pyro-stage');
      const ui = { sem: r(q('.sem-bar')), nav: r(q('.nav-buttons')), hint: r(q('.center-hint')), panel: r(q('#panel')), brand: r(q('.brand')),
        actions: r(q('.top-actions')), ladder: r(q('.ladder')), pyro: ps.classList.contains('is-on') ? r(ps) : null };
      [...document.querySelectorAll('.hsb:not(.is-off):not(.is-active)')].forEach((b, i) => ui['hsb' + i] = r(b));
      const card = q('.hs-card');
      return { card: card.classList.contains('is-away') ? null : r(card), ui, W: innerWidth, H: innerHeight }; })()"""
    def ov(a, b): return a and b and a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]
    bad = 0
    for w in WIDTHS:
        call('Emulation.setDeviceMetricsOverride', {'width': w, 'height': 900 if w > 600 else 844, 'deviceScaleFactor': 1, 'mobile': w < 600})
        call('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-color-scheme', 'value': SCHEME}]})
        for n in LEVELS:
            call('Page.navigate', {'url': f'http://127.0.0.1:{PORT}/?q=3&shot={w}-{n}#ebene={n}'})   # eigene URL je Aufnahme: sonst kein Neuladen
            for _ in range(150):
                if js("document.body.classList.contains('is-ready') && !document.body.classList.contains('is-loading') && !document.getElementById('hotspots').classList.contains('is-hidden')"): break
                time.sleep(0.2)
            time.sleep(1.0)
            for hid in js("[...document.querySelectorAll('#panel-body button[data-hs]')].map(b => b.dataset.hs)") or []:
                btn = f"document.querySelector('#panel-body button[data-hs=\"{hid}\"]').click()"
                js(btn)
                time.sleep(1.5)   # Blick schwenkt zum Punkt: warten, bis die Karte zweimal gleich steht (höchstens 5 s)
                st, prev, t0 = js(MEASURE), None, time.time()
                while time.time() - t0 < 3.5 and st['card'] != prev:
                    prev = st['card']; time.sleep(0.3); st = js(MEASURE)
                c = st['card']
                hits = [k for k, v in st['ui'].items() if ov(c, v)]
                outside = bool(c) and (c[0] < 0 or c[1] < 0 or c[2] > st['W'] or c[3] > st['H'])
                flag = '-- ' if not c else 'BAD' if hits or outside else 'OK '
                bad += flag == 'BAD'
                print(f"{w} L{n} {hid:14s} {flag} card={c} hits={hits}{' outside' if outside else ''}", flush=True)
                if SHOTS and c:
                    open(f'{SHOTS}/{SCHEME}-{w}-L{n}-{hid}.png', 'wb').write(base64.b64decode(call('Page.captureScreenshot', {'format': 'png'})['data']))
                js(btn)   # zweiter Klick schließt die Karte
                time.sleep(0.4)
    errs = [e for e in events if e['method'] == 'Runtime.exceptionThrown' or (e['method'] == 'Runtime.consoleAPICalled' and e['params']['type'] in ('error', 'warning'))
            or (e['method'] == 'Log.entryAdded' and e['params']['entry']['level'] in ('error', 'warning') and 'favicon' not in e['params']['entry'].get('url', ''))]
    for e in errs[:5]: print('Konsole:', json.dumps(e['params'], ensure_ascii=False)[:200])
    print(f'Überlappungen {bad} · Konsole {len(errs)}' + (f' · Bilder: {SHOTS}' if SHOTS else ''))
    ws.close()
finally:
    chrome.terminate(); chrome.wait()
    if server: server.terminate(); server.wait()
sys.exit(1 if bad or errs else 0)
