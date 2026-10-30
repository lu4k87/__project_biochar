# Prüft die Pyrolyse-Übergänge je Ebene im Headless-Chrome per CDP (echte GPU, AGENTS.md §5): Ebenen 3–7 bei
# T = 25/350/550/800 °C, hell + dunkel (1440 px), dazu die Info-Karte der Hotspots (Klick → Karte links vom Abzeichen)
# bei 1440 px und 390 px. Ebene 5 zusätzlich: Regler Luftfeuchte 0/50/90/99 % und zurück auf 90 % (Hysterese), hell +
# dunkel, 1440 + 390 px, Messlinien sichtbar, Puls des Abzeichens „Kapillarkondensation“ (reduced-motion: nur Farbe).
# Ergebnis: Bildbogen `sheet.png` (+ `sheet-rh.png`), Einzelbilder, Konsolenfehler als Liste.
# Aufruf: python3 tests/pyro_levels_check.py [ausgabe-ordner]  (eigene Instanz auf Port 8471, Server des Users bleibt)
import base64, json, os, socket, subprocess, sys, tempfile, time, urllib.request
import websocket   # websocket-client
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('BIOCHAR_TEST_PORT', 8474)); CDP = int(os.environ.get('BIOCHAR_CDP_PORT', 9336))   # je Skript eigene Ports: Parallelläufe stören sich nicht
OUT = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix='biochar-levels-')
os.makedirs(OUT, exist_ok=True)
LEVELS = [int(x) for x in os.environ.get('LEVELS', '3,4,5,6,7').split(',')]
TEMPS = [25, 350, 550, 800]

def port_open(p):
    with socket.socket() as s: return s.connect_ex(('127.0.0.1', p)) == 0
server = None if port_open(PORT) else subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1', '--directory', os.path.join(ROOT, 'web')],
                                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
chrome = subprocess.Popen(['google-chrome', '--headless=new', '--enable-gpu', '--use-angle=gl', '--hide-scrollbars',
    f'--remote-debugging-port={CDP}', f'--user-data-dir={OUT}/profile', '--window-size=1440,900', 'about:blank'],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
errors, shots = [], {}
try:
    for _ in range(50):
        try: targets = json.load(urllib.request.urlopen(f'http://127.0.0.1:{CDP}/json')); break
        except Exception: time.sleep(0.2)
    page = next(t for t in targets if t['type'] == 'page')
    ws = websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True); ws.settimeout(40)
    seq = 0
    def call(method, params=None):
        global seq; seq += 1; ws.send(json.dumps({'id': seq, 'method': method, 'params': params or {}}))
        while True:
            m = json.loads(ws.recv())
            if m.get('id') == seq: return m.get('result', {})
            if m.get('method') == 'Runtime.exceptionThrown': errors.append(('exception', m['params']['exceptionDetails'].get('text', '') + ' ' + str(m['params']['exceptionDetails'].get('exception', {}).get('description', ''))[:300]))
            if m.get('method') == 'Runtime.consoleAPICalled' and m['params']['type'] in ('error', 'warning'): errors.append((m['params']['type'], ' '.join(str(a.get('value', a.get('description', '')))[:200] for a in m['params']['args'])))
            if m.get('method') == 'Log.entryAdded' and m['params']['entry']['level'] in ('error',): errors.append(('log', m['params']['entry']['text'][:300]))
    def js(expr):
        r = call('Runtime.evaluate', {'expression': expr, 'returnByValue': True})
        if 'exceptionDetails' in r: errors.append(('js', str(r['exceptionDetails'].get('exception', {}).get('description', r['exceptionDetails'].get('text')))[:300]))
        return r.get('result', {}).get('value')
    for m in ('Runtime.enable', 'Log.enable', 'Page.enable'): call(m)
    def pump(sec):   # Ereignisse einsammeln, während die Seite läuft
        t0 = time.time()
        while time.time() - t0 < sec: js('1'); time.sleep(0.1)
    def load(url, w, h, scheme):
        call('Emulation.setDeviceMetricsOverride', {'width': w, 'height': h, 'deviceScaleFactor': 1, 'mobile': w < 600})
        call('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-color-scheme', 'value': scheme}]})
        call('Page.navigate', {'url': url})
        t0 = time.time()
        while time.time() - t0 < 40 and not js("document.body.classList.contains('is-ready') && !document.body.classList.contains('is-loading')"): time.sleep(0.2)
        pump(3.5)
    def shot(name):
        data = call('Page.captureScreenshot', {'format': 'png'})['data']
        path = os.path.join(OUT, name + '.png'); open(path, 'wb').write(base64.b64decode(data)); shots[name] = path
    for lv in LEVELS:
        for scheme in ('dark', 'light'):
            for T in TEMPS:
                n0 = len(errors)
                load(f'http://127.0.0.1:{PORT}/?T={T}&q=2#ebene={lv}', 1440, 900, scheme)
                shot(f'e{lv}-{scheme}-{T}')
                print(f'Ebene {lv} {scheme} {T} °C: {len(errors) - n0} Konsolenfehler', flush=True)
    # Info-Karte: Klick auf das erste Info-Abzeichen → Karte offen, links vom Abzeichen, im Fenster
    CARD = """(() => { const b = document.querySelector('.hsb--info:not(.is-off)'); if (!b) return { ok: false, why: 'kein Abzeichen' };
      const c = document.querySelector('.hs-card'); const rb = b.getBoundingClientRect(), rc = c.getBoundingClientRect();
      const beside = rc.right <= rb.left, below = rc.top >= rb.bottom;   // links vom Abzeichen, im schmalen Fenster darunter
      return { ok: c.classList.contains('is-open') && (beside || below) && rc.left >= 0 && rc.top >= 0 && rc.bottom <= innerHeight && +getComputedStyle(c).opacity > 0.9, beside, below,
        open: c.classList.contains('is-open'), card: [rc.left, rc.top, rc.right, rc.bottom], badge: [rb.left, rb.top, rb.right, rb.bottom], op: getComputedStyle(c).opacity }; })()"""
    for name, w, h, scheme in [('card-1440-dark', 1440, 900, 'dark'), ('card-1440-light', 1440, 900, 'light'), ('card-390-dark', 390, 844, 'dark')]:
        load(f'http://127.0.0.1:{PORT}/?T=550&q=2#ebene=4', w, h, scheme)
        js("document.querySelector('.hsb--info:not(.is-off)').click()"); pump(0.8)
        st = js(CARD); shot(name)
        print(f'{name}: Karte {"✅" if st and st["ok"] else "❌"} {st}', flush=True)
        if not (st and st['ok']): errors.append(('card', f'{name}: {st}'))
        js("document.querySelector('.hsb--info:not(.is-off)').click()"); pump(0.5)   # zweiter Klick schließt
        if js("document.querySelector('.hs-card').classList.contains('is-open')"): errors.append(('card', f'{name}: zweiter Klick schließt nicht'))
    # Ebene 5: Luftfeuchte-Regler, Messlinien, Hysterese, Puls
    RH_STEPS = [0, 0.5, 0.9, 0.99, 0.9]
    SET_RH = "(v => { const i = document.getElementById('in-rh'); i.value = v; i.dispatchEvent(new Event('input')); })(%s)"
    RH_STATE = """(() => ({ wet: document.getElementById('out-wet').textContent, note: document.getElementById('rh-note').textContent,
      ms: document.querySelectorAll('.ms-lab:not(.is-off)').length, labs: [...document.querySelectorAll('.ms-lab:not(.is-off)')].map(e => e.textContent),
      pulse: (() => { const b = [...document.querySelectorAll('.hsb')].find(e => e.textContent.includes('Kapillar')); return b ? getComputedStyle(b).animationName : 'kein Abzeichen'; })() }))()"""
    if 5 in LEVELS:
        for w, h, scheme in [(1440, 900, 'dark'), (1440, 900, 'light'), (390, 844, 'dark'), (390, 844, 'light')]:
            n0 = len(errors)
            load(f'http://127.0.0.1:{PORT}/?T=550&q=2&run=rh{w}{scheme}#ebene=5', w, h, scheme)   # eigene URL: sonst nur Hash-Wechsel ohne Neuladen
            res = []
            for k, v in enumerate(RH_STEPS):
                js(SET_RH % v); pump(0.25)
                st = js(RH_STATE); pump(1.6)
                shot(f'rh-{w}-{scheme}-{k}')
                res.append(st)
            if None in res: errors.append(('rh', f'{w} {scheme}: Zustand nicht lesbar')); continue
            wet = [r['wet'] for r in res]
            num = lambda r: float(r['wet'].replace('Ø', '').replace('nm', '').replace('.', '').replace(',', '.'))
            hyst_ok = num(res[4]) > num(res[2]) and 'Hysterese' in res[4]['note']   # zurück auf 90 %: mehr gefüllt als vorwärts
            ms_ok = w < 600 or max(r['ms'] for r in res) >= 2   # Kamerafahrt: je nach Pose blendet eine Linie aus
            pulse_ok = res[3]['pulse'] == 'hsb-pulse' or w < 600   # 99 %: Makroporen füllen → Puls (mobil evtl. ohne Abzeichen)
            print(f'Ebene 5 rF {w} {scheme}: gefüllt {wet} · Messlinien {max(r["ms"] for r in res)} {res[0]["labs"]} · Puls {res[3]["pulse"]} · '
                  f'Hysterese {"✅" if hyst_ok else "❌"} · {len(errors) - n0} Konsolenfehler', flush=True)
            if not (hyst_ok and ms_ok and pulse_ok): errors.append(('rh', f'{w} {scheme}: hyst {hyst_ok} ms {ms_ok} pulse {pulse_ok}'))
            if w == 1440:   # Tafelausschnitt mit Skala, Anzeige und Isotherme (Hysterese-Zustand)
                r = js("(() => { const e = document.querySelector('.rh'); e.scrollIntoView({block: 'center'}); const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; })()"); pump(0.5)
                data = call('Page.captureScreenshot', {'format': 'png', 'clip': {'x': r[0], 'y': r[1], 'width': r[2], 'height': r[3], 'scale': 1}})['data']
                open(os.path.join(OUT, f'rhpanel-{scheme}.png'), 'wb').write(base64.b64decode(data))
        # reduzierte Bewegung: Puls nur als Farbwechsel
        call('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-color-scheme', 'value': 'dark'}, {'name': 'prefers-reduced-motion', 'value': 'reduce'}]})
        call('Page.navigate', {'url': f'http://127.0.0.1:{PORT}/?T=550&q=2#ebene=5'}); pump(6)
        js(SET_RH % 0.99); pump(0.2); st = js(RH_STATE)
        print(f'Ebene 5 reduced-motion: Puls {st["pulse"]}', flush=True)
        if st['pulse'] != 'hsb-pulse-tint': errors.append(('rh', f'reduced-motion: {st["pulse"]}'))
    ws.close()
finally:
    chrome.terminate(); chrome.wait()
    if server: server.terminate()
# Bildbogen aus allen Bildern im Ausgabeordner (auch aus früheren Läufen): je Ebene zwei Zeilen (dunkel, hell), Spalten =
# Temperaturen; darunter die Karten-Bilder
shots = {f[:-4]: os.path.join(OUT, f) for f in os.listdir(OUT) if f.endswith('.png') and f != 'sheet.png'}
TW, THh = 480, 300
rows = [(f'Ebene {lv} · {s}', [f'e{lv}-{s}-{T}' for T in TEMPS]) for lv in sorted({int(n[1]) for n in shots if n[0] == 'e'}) for s in ('dark', 'light')]
sheet = Image.new('RGB', (40 + len(TEMPS) * (TW + 10), 40 + (len(rows) + 1) * (THh + 30)), (24, 24, 28))
d = ImageDraw.Draw(sheet)
for x, T in enumerate(TEMPS): d.text((40 + x * (TW + 10), 12), f'{T} °C', fill=(240, 240, 240))
for y, (label, names) in enumerate(rows):
    d.text((4, 40 + y * (THh + 30) + THh // 2), label.replace(' · ', '\n'), fill=(240, 240, 240))
    for x, n in enumerate(names):
        if n in shots: sheet.paste(Image.open(shots[n]).resize((TW, THh)), (40 + x * (TW + 10), 40 + y * (THh + 30)))
y = len(rows)
for x, n in enumerate(['card-1440-dark', 'card-1440-light', 'card-390-dark']):
    if n in shots:
        im = Image.open(shots[n]); im.thumbnail((TW, THh)); sheet.paste(im, (40 + x * (TW + 10), 40 + y * (THh + 30)))
        d.text((40 + x * (TW + 10), 40 + y * (THh + 30) - 14), n, fill=(240, 240, 240))
sheet.save(os.path.join(OUT, 'sheet.png'))
rh = sorted(n for n in shots if n.startswith('rh-'))
if rh:   # Luftfeuchte: Zeilen = Breite/Schema, Spalten = 0/50/90/99/zurück 90 %
    cfg = sorted({n.rsplit('-', 1)[0] for n in rh})
    sh = Image.new('RGB', (40 + 5 * (TW + 10), 40 + len(cfg) * (THh + 30)), (24, 24, 28)); d = ImageDraw.Draw(sh)
    for x, lab in enumerate(['0 %', '50 %', '90 %', '99 %', 'zurück 90 %']): d.text((40 + x * (TW + 10), 12), lab, fill=(240, 240, 240))
    for y, c in enumerate(cfg):
        d.text((4, 40 + y * (THh + 30) + THh // 2), c.replace('rh-', '').replace('-', '\n'), fill=(240, 240, 240))
        for x in range(5):
            if f'{c}-{x}' in shots:
                im = Image.open(shots[f'{c}-{x}']); im.thumbnail((TW, THh)); sh.paste(im, (40 + x * (TW + 10), 40 + y * (THh + 30)))
    sh.save(os.path.join(OUT, 'sheet-rh.png'))
print(f'\nBildbogen: {OUT}/sheet.png\nKonsolenfehler/-warnungen: {len(errors)}')
for e in errors[:20]: print(' ', e)
sys.exit(1 if errors else 0)
