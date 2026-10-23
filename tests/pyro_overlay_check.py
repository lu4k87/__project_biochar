# Prüft die Pyrolyse-Einblendung in der 3D-Ansicht im Headless-Chrome per CDP (echte GPU, AGENTS.md §5):
# Zeitpunkte gezielt statt --timeout-Zufall – Einblendung an/aus (Zeitraffer + Reglerwechsel), erster Text sofort,
# Hell/Dunkel/reduced-motion emuliert, keine Überlappung mit Abzeichen, Messleiste, Tafel, keine Konsolenfehler.
# Aufruf: python3 tests/pyro_overlay_check.py [ausgabe-ordner]  (eigene Instanz auf Port 8471, Server des Users bleibt)
import base64, json, os, socket, subprocess, sys, tempfile, time, urllib.request
import websocket   # websocket-client

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('BIOCHAR_TEST_PORT', 8471)); CDP = 9333
OUT = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix='biochar-pyro-')
URL = f'http://127.0.0.1:{PORT}/?play&playsec=10&q=2'

def port_open(p):
    with socket.socket() as s: return s.connect_ex(('127.0.0.1', p)) == 0
server = None if port_open(PORT) else subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1', '--directory', os.path.join(ROOT, 'web')],
                                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
chrome = subprocess.Popen(['google-chrome', '--headless=new', '--enable-gpu', '--use-angle=gl', '--hide-scrollbars',
    f'--remote-debugging-port={CDP}', f'--user-data-dir={OUT}/profile', '--window-size=1440,900', 'about:blank'],
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
    STATE = """(() => { const ps = document.getElementById('pyro-stage'); if (!ps || !document.getElementById('ps-T')) return null;
      const r = (el) => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
      return { ready: document.body.classList.contains('is-ready'), on: ps.classList.contains('is-on'), op: +getComputedStyle(ps).opacity,
        T: document.getElementById('ps-T').textContent, phase: document.getElementById('ps-phase').textContent, gas: document.getElementById('ps-gas').textContent,
        ps: r(ps), badges: [...document.querySelectorAll('.hsb:not(.is-off)')].map(r), bar: r(document.querySelector('.sem-bar')), panel: r(document.getElementById('panel')),
        playing: document.getElementById('btn-play') ? document.getElementById('btn-play').getAttribute('aria-pressed') : null }; })()"""
    def overlap(a, b): return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]
    gaps = []   # Diagnose: längste Pause zwischen zwei Abfragen (blockierter Haupt-Thread)
    def wait(cond, limit):
        t0 = time.time(); tp = t0
        while time.time() - t0 < limit:
            st = js(STATE); gaps.append(time.time() - tp); tp = time.time()
            if st and cond(st): return st, round(time.time() - t0, 1)
            time.sleep(0.1)
        return st, None
    bad = []
    for name, scheme, w, h, reduced in [('dark1440', 'dark', 1440, 900, False), ('light1440', 'light', 1440, 900, False),
                                        ('dark390', 'dark', 390, 844, False), ('reduced1440', 'dark', 1440, 900, True)]:
        call('Emulation.setDeviceMetricsOverride', {'width': w, 'height': h, 'deviceScaleFactor': 1, 'mobile': w < 600})
        feats = [{'name': 'prefers-color-scheme', 'value': scheme}] + ([{'name': 'prefers-reduced-motion', 'value': 'reduce'}] if reduced else [])
        call('Emulation.setEmulatedMedia', {'features': feats})
        call('Page.navigate', {'url': URL})
        st, ready = wait(lambda s: s['ready'], 30)
        st, on = wait(lambda s: s['on'], 10)
        first = st['phase'] if st else ''
        gaps.clear()
        st, mid = wait(lambda s: s['on'] and s['T'] and int(s['T'].split()[0].replace('.', '')) >= 380 and s['op'] > 0.99, 15)
        gap = round(max(gaps), 2) if gaps else None
        mid_T, mid_phase = (st['T'], st['phase']) if st else ('', '')   # sofort festhalten, st wandert weiter
        ov = sum(overlap(st['ps'], b) for b in st['badges']) + overlap(st['ps'], st['bar']) + overlap(st['ps'], st['panel'])
        inwin = st['ps'][0] >= 0 and st['ps'][2] <= w
        open(f'{OUT}/{name}.png', 'wb').write(base64.b64decode(call('Page.captureScreenshot', {'format': 'png'})['data']))
        wait(lambda s: s['playing'] == 'false', 15)
        st, off = wait(lambda s: not s['on'], 6)
        st, faded = wait(lambda s: s['op'] < 0.01, 3)
        line = f"{name}: bereit {ready}s · an {on}s · erster Text {first!r} · mitten {mid_T} {mid_phase!r} · aus {off}s · verblasst {faded}s · Überlappungen {ov} · im Fenster {inwin} · längste Abfragepause {gap}s"
        if name == 'dark1440':   # Reglerwechsel: erscheint beim Gleiten, verschwindet danach wieder
            js("(() => { const i = document.getElementById('in-temp'); i.value = 450; i.dispatchEvent(new Event('input', {bubbles: true})); })()")
            st, g_on = wait(lambda s: s['on'], 3); st, g_off = wait(lambda s: not s['on'], 6)
            line += f" · Regler: an {g_on}s aus {g_off}s {st['T']}"
            if g_on is None or g_off is None: bad.append(f'{name}: Reglerwechsel')
        print(line)
        if None in (ready, on, mid, off, faded) or ov or not inwin or not first: bad.append(name)
    errs = [e for e in events if e['method'] == 'Runtime.exceptionThrown' or (e['method'] == 'Runtime.consoleAPICalled' and e['params']['type'] in ('error', 'warning'))
            or (e['method'] == 'Log.entryAdded' and e['params']['entry']['level'] in ('error', 'warning') and 'favicon' not in e['params']['entry'].get('url', ''))]
    for e in errs[:5]: print('Konsole:', json.dumps(e['params'], ensure_ascii=False)[:200])
    ws.close()
finally:
    chrome.terminate(); chrome.wait()
    if server: server.terminate(); server.wait()
print(f'Screenshots: {OUT}')
sys.exit(1 if bad or errs else 0)
