# Prüft die Pyrolyse-Zeitleiste in der 3D-Ansicht im Headless-Chrome per CDP (echte GPU, AGENTS.md §5):
# Zeitpunkte gezielt statt --timeout-Zufall – Zeitraffer läuft und endet am Ziel, Kopfzeile + aktives Kapitel folgen,
# Hell/Dunkel/390 px/reduced-motion emuliert, keine Überlappung mit Abzeichen, Info-Karte, Leisten, Tafel; dazu
# Ziel ziehen, Kapitel-Sprung, Weiterspielen ab dem Ist-Punkt, Verschieben (Maus, Taste, gespeichert, ⟲), Konsole leer.
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
    STATE = """(() => { const tl = document.getElementById('pyro-tl'); if (!tl || !document.getElementById('tl-T')) return null;
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(), cs = getComputedStyle(el);
        return b.width && b.height && cs.display !== 'none' && cs.visibility !== 'hidden' ? [b.left, b.top, b.right, b.bottom] : null; };
      const q = (s) => document.querySelector(s), card = q('.hs-card'), on = q('.tl-chapters .is-on');
      return { ready: document.body.classList.contains('is-ready'), playing: q('#btn-play').getAttribute('aria-pressed'),
        T: q('#tl-T').textContent, goal: q('#tl-goal-T').textContent, phase: q('#tl-phase').textContent, chapter: on ? on.textContent : '',
        tl: r(tl), box: [r(q('.stage-hud')), r(q('.bottombar'))].reduce((u, b) => [Math.min(u[0], b[0]), u[1], Math.max(u[2], b[2]), b[3]]), hsb: [...document.querySelectorAll('.hsb:not(.is-off)')].map(r).filter(Boolean), bars: [r(q('.ladder')), r(q('.topbar'))].filter(Boolean), shift: tl.style.translate, moved: tl.classList.contains('is-moved'), saved: localStorage.getItem('biochar.timeline-dock'),
        ui: [...document.querySelectorAll('.hsb:not(.is-off)')].map(r).concat([r(q('.sem-bar')), r(q('.nav-buttons')), r(q('#panel')), r(q('.ladder')), r(q('.topbar')),
          card && card.classList.contains('is-open') && !card.classList.contains('is-away') ? r(card) : null]).filter(Boolean) }; })()"""
    deg = lambda s: int(s.split()[0].replace('.', '')) if s and s.split()[0].replace('.', '').isdigit() else -1
    def overlap(a, b): return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]
    def inside(a, b): return a[0] >= b[0] - 0.5 and a[1] >= b[1] - 0.5 and a[2] <= b[2] + 0.5 and a[3] <= b[3] + 0.5
    def wait(cond, limit):
        t0 = time.time()
        while time.time() - t0 < limit:
            st = js(STATE)
            if st and cond(st): return st, round(time.time() - t0, 1)
            time.sleep(0.1)
        return st, None
    def layout(st, name):   # Zero Overlap: Leiste ganz in Bühne + Fußleiste, nichts darunter; Abzeichen behalten Platz unter den Leisten
        ov = sum(overlap(st['tl'], b) for b in st['ui'])
        hb = sum(overlap(a, b) for a in st['hsb'] for b in st['bars'])
        if ov or hb or not inside(st['tl'], st['box']): bad.append(f'{name}: Überlappungen {ov}, Abzeichen auf Leiste {hb}, in der Bühne {inside(st["tl"], st["box"])}')
        return f'Überlappungen {ov} · Abzeichen auf Leiste {hb} · Leiste {round(st["tl"][3] - st["tl"][1])} px hoch · in der Bühne {inside(st["tl"], st["box"])}'
    def click(sel): js(f"document.querySelector({json.dumps(sel)}).click()")
    def center(sel): return js(f"(() => {{ const b = document.querySelector({json.dumps(sel)}).getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }})()")
    def mouse(kind, x, y): call('Input.dispatchMouseEvent', {'type': kind, 'x': x, 'y': y, 'button': 'left', 'buttons': 1 if kind != 'mouseReleased' else 0, 'clickCount': 1})
    bad = []
    for name, scheme, w, h, reduced in [('dark1440', 'dark', 1440, 900, False), ('light1440', 'light', 1440, 900, False),
                                        ('dark390', 'dark', 390, 844, False), ('reduced1440', 'dark', 1440, 900, True)]:
        call('Emulation.setDeviceMetricsOverride', {'width': w, 'height': h, 'deviceScaleFactor': 1, 'mobile': w < 600})
        feats = [{'name': 'prefers-color-scheme', 'value': scheme}] + ([{'name': 'prefers-reduced-motion', 'value': 'reduce'}] if reduced else [])
        call('Emulation.setEmulatedMedia', {'features': feats})
        call('Page.navigate', {'url': URL})
        js("localStorage.removeItem('biochar.timeline-dock')")
        st, ready = wait(lambda s: s['ready'], 30)
        st, on = wait(lambda s: s['playing'] == 'true', 10)
        st, mid = wait(lambda s: s['playing'] == 'true' and deg(s['T']) >= 380, 15)
        mid_T, mid_phase, mid_ch = (st['T'], st['phase'], st['chapter']) if st else ('', '', '')
        line = f"{name}: bereit {ready}s · spielt {on}s · mitten {mid_T} {mid_phase!r} Kapitel {mid_ch!r} · {layout(st, name)}"
        open(f'{OUT}/{name}.png', 'wb').write(base64.b64decode(call('Page.captureScreenshot', {'format': 'png'})['data']))
        st, end = wait(lambda s: s['playing'] == 'false', 15)
        line += f" · Ende {end}s bei {st['T']} (Ziel {st['goal']})"
        if None in (ready, on, mid, end) or not mid_phase or st['T'] != st['goal'] or (w > 860 and not mid_ch): bad.append(name)
        if name == 'dark1440':
            # Ziel setzen wie per Ziehen/Tastatur (Range-Feld), die gezeigte Temperatur gleitet hin
            js("(() => { const i = document.getElementById('in-temp'); i.value = 450; i.dispatchEvent(new Event('input', {bubbles: true})); })()")
            st, g = wait(lambda s: s['goal'] == '450 °C' and s['T'] == '450 °C', 4)
            line += f"\n  Ziel 450: {g}s"
            # Kapitel „Trocknung“: Sprung an den Phasenbeginn (100 °C), bleibt stehen
            click('.tl-chapters button[data-k="1"]')
            st, k = wait(lambda s: s['T'] == '100 °C' and s['playing'] == 'false', 4)
            line += f" · Kapitel Trocknung → {st['T']} {k}s"
            click('#btn-play')   # weiter ab dem Ist-Punkt, nicht ab 25 °C
            st, r = wait(lambda s: s['playing'] == 'true', 3)
            first = deg(st['T'])
            click('#btn-play')
            st, s_ = wait(lambda s: s['playing'] == 'false', 3)
            line += f" · ▶ ab {first} °C, ■ {s_}s"
            if None in (g, k, r, s_) or first < 100: bad.append(f'{name}: Ziel/Kapitel/Weiterspielen')
            # Verschieben: Griff mit der Maus 300 px nach oben ziehen → gespeichert, nach Neuladen gleich, ⟲ zurück
            x, y = center('.tl-grip'); mouse('mousePressed', x, y)
            for i in range(1, 7): mouse('mouseMoved', x - 20 * i, y - 50 * i)
            mouse('mouseReleased', x - 120, y - 300)
            time.sleep(0.6)
            st = js(STATE); moved = st['shift']
            line += f"\n  gezogen: {moved} gespeichert {st['saved']} · {layout(st, name + ' gezogen')}"
            call('Page.reload'); st, _ = wait(lambda s: s['ready'], 30); time.sleep(0.8); st = js(STATE)
            line += f" · nach Neuladen {st['shift']}"
            js("document.querySelector('.tl-grip').focus()")
            for kind in ('rawKeyDown', 'keyUp'): call('Input.dispatchKeyEvent', {'type': kind, 'key': 'ArrowUp', 'code': 'ArrowUp', 'windowsVirtualKeyCode': 38})
            st2 = js(STATE)
            line += f" · Taste ↑ {st2['shift']}"
            click('.tl-reset'); st3 = js(STATE)
            line += f" · ⟲ {st3['shift']!r} verschoben {st3['moved']}"
            dy = lambda s: float(s.split()[1].replace('px', '')) if s and len(s.split()) > 1 else 0.0
            if not moved or st['shift'] != moved or dy(st2['shift']) != dy(moved) - 20 or st3['moved'] or st3['shift'] not in ('0px', '0px 0px'):
                bad.append(f'{name}: Verschieben')
        print(line, flush=True)
    errs = [e for e in events if e['method'] == 'Runtime.exceptionThrown' or (e['method'] == 'Runtime.consoleAPICalled' and e['params']['type'] in ('error', 'warning'))
            or (e['method'] == 'Log.entryAdded' and e['params']['entry']['level'] in ('error', 'warning') and 'favicon' not in e['params']['entry'].get('url', ''))]
    for e in errs[:5]: print('Konsole:', json.dumps(e['params'], ensure_ascii=False)[:200])
    ws.close()
finally:
    chrome.terminate(); chrome.wait()
    if server: server.terminate(); server.wait()
print(f'Screenshots: {OUT}')
for b in bad: print('FEHLER:', b)
sys.exit(1 if bad or errs else 0)
