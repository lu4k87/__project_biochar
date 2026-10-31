# Prüft die Kennzahl-Karten (.facts) im Headless-Chrome per CDP: je Ebene und Breite bricht der Wert nur an „ · “, kein Wort ragt
# über die Karte hinaus, Balken einer Zeile liegen auf einer Linie, Karten bleiben im Panel; Konsole ohne Fehler.
# Ab 1440 px Breite (900 px hoch) passt die Tafel zugeklappt ohne Scrollen (Vorschau 2026-10-25, Panel:B); Ebene 5–7 dürfen
# scrollen (zu viel Inhalt, User 2026-10-25).
# Aufruf: python3 tests/facts_check.py [breiten=1440,1024,390] [ebenen=1,…,7] [bilder-ordner]  (SCHEME=light für hell;
# eigene Instanz auf Port 8471, Server des Users bleibt)
import base64, json, os, socket, subprocess, sys, tempfile, time, urllib.request
import websocket   # websocket-client

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('BIOCHAR_TEST_PORT', 8473)); CDP = int(os.environ.get('BIOCHAR_CDP_PORT', 9335))   # je Skript eigene Ports: Parallelläufe stören sich nicht
WIDTHS = [int(w) for w in (sys.argv[1] if len(sys.argv) > 1 else '1440,1024,390').split(',')]
LEVELS = [int(n) for n in (sys.argv[2] if len(sys.argv) > 2 else '1,2,3,4,5,6,7').split(',')]
SHOTS = sys.argv[3] if len(sys.argv) > 3 else None
SCHEME = os.environ.get('SCHEME', 'dark')
SCROLL_OK = {5, 6, 7}   # Ebenen, deren Tafel bei 1440 × 900 scrollen darf
PROFILE = tempfile.mkdtemp(prefix='biochar-facts-')
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
    # Wort-Überlauf: Range über jeden Textknoten misst die echte Zeilenbreite (scrollWidth sieht überstehende Wörter nicht)
    MEASURE = """(() => { const box = document.querySelector('.facts'); if (!box) return null;
      const r = (el) => el.getBoundingClientRect(), problems = [], rows = {};
      const panel = r(document.querySelector('.panel-body'));
      [...box.querySelectorAll('.fact')].forEach((f, i) => {
        const c = r(f), v = f.querySelector('.fact-value'), bar = f.querySelector('.fact-bar'), name = v.textContent;
        if (c.left < panel.left - 1 || c.right > panel.right + 1) problems.push(`${name}: Karte ragt aus dem Panel`);
        if ([...f.querySelectorAll('.fact-value > span')].some((s) => s.getClientRects().length > 1)) problems.push(`${name}: Wert bricht zwischen Zahl und Einheit um`);
        const pad = parseFloat(getComputedStyle(f).paddingRight);
        for (const el of f.querySelectorAll('.fact-value, .fact-label')) {
          const rg = document.createRange(); rg.selectNodeContents(el);
          for (const q of rg.getClientRects()) if (q.right > c.right - pad + 1) { problems.push(`${name}: „${el.textContent.slice(0, 30)}“ ragt über den Kartenrand`); break; }
        }
        if (bar) (rows[Math.round(c.top)] ??= []).push(Math.round(r(bar).bottom));   // geteilte Sammelwerte haben keinen Balken
      });
      Object.values(rows).forEach((b) => { if (Math.max(...b) - Math.min(...b) > 1) problems.push(`Balken einer Zeile versetzt: ${b.join(' / ')} px`); });
      const pb = document.querySelector('#panel-body'), b = r(box);
      return { problems, fit: [pb.scrollHeight, pb.clientHeight], clip: [b.left, b.top, b.width, b.height] }; })()"""
    bad = 0
    for w in WIDTHS:
        call('Emulation.setDeviceMetricsOverride', {'width': w, 'height': 900 if w > 600 else 844, 'deviceScaleFactor': 1, 'mobile': w < 600})
        call('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-color-scheme', 'value': SCHEME}]})
        for n in LEVELS:
            call('Page.navigate', {'url': f'http://127.0.0.1:{PORT}/?q=3&shot={w}-{n}#ebene={n}'})   # eigene URL je Aufnahme: sonst kein Neuladen
            for _ in range(150):
                if js("document.body.classList.contains('is-ready') && !document.body.classList.contains('is-loading')"): break
                time.sleep(0.2)
            else:
                bad += 1; print(f'{w} px · Ebene {n}: ❌ Seite nicht bereit (is-ready fehlt)'); continue
            time.sleep(1.0)
            js("document.querySelector('.facts')?.scrollIntoView({block: 'center'})"); time.sleep(0.3)
            m = js(MEASURE)
            if not m: bad += 1; print(f'{w} px · Ebene {n}: ❌ keine Kennzahlen (jede Ebene hat facts)'); continue
            fit = ''
            if w >= 1440 and m['fit'][0] > m['fit'][1]:
                if n in SCROLL_OK: fit = f" ℹ️ scrollt (erlaubt): {m['fit'][0]} / {m['fit'][1]} px"
                else: m['problems'].append(f"Tafel scrollt: {m['fit'][0]} / {m['fit'][1]} px")
            bad += len(m['problems'])
            print(f"{w} px · Ebene {n} · Tafel {m['fit'][0]} / {m['fit'][1]} px: {'✅' if not m['problems'] else '❌ ' + ' · '.join(m['problems'])}{fit}")
            if SHOTS:
                x, y, cw, ch = m['clip']
                img = call('Page.captureScreenshot', {'format': 'png', 'clip': {'x': x - 8, 'y': y - 8, 'width': cw + 16, 'height': ch + 16, 'scale': 1}})
                with open(os.path.join(SHOTS, f'facts-{SCHEME}-{w}-{n}.png'), 'wb') as fh: fh.write(base64.b64decode(img['data']))
    errs = [e for e in events if e.get('method') == 'Runtime.exceptionThrown' or (e.get('method') == 'Runtime.consoleAPICalled' and e['params']['type'] == 'error')
            or (e.get('method') == 'Log.entryAdded' and e['params']['entry']['level'] == 'error')]
    for e in errs: print('Konsole:', json.dumps(e['params'])[:200])
    sys.exit(1 if bad or errs else 0)
finally:
    chrome.terminate(); chrome.wait()
    if server: server.terminate(); server.wait()
