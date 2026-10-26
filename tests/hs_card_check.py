# Prüft die Lage der Info-Karte im Headless-Chrome per CDP (echte GPU, AGENTS.md §5): je Ebene jede Karte über die Tafel
# öffnen, warten bis sie steht, dann Überlappung mit REM-Leiste, Knopfleiste, Hinweis, Tafel, Kopf, Schiene, Einblendung,
# anderen Abzeichen und dem Fensterrand messen (Zero Overlap); Konsole ohne Fehler.
# Aufruf: python3 tests/hs_card_check.py [breiten=1440,390] [ebenen=1,2,3,4,5,6,7] [bilder-ordner]  (SCHEME=light für hell;
# eigene Instanz auf Port 8471, Server des Users bleibt). Karte „--“ = Abzeichen gerade nicht sichtbar (zählt nicht)
import base64, json, os, shutil, socket, subprocess, sys, tempfile, time, urllib.request
import websocket   # websocket-client

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('BIOCHAR_TEST_PORT', 8471)); CDP = 9334
WIDTHS = [int(w) for w in (sys.argv[1] if len(sys.argv) > 1 else '1440,390').split(',')]
LEVELS = [int(n) for n in (sys.argv[2] if len(sys.argv) > 2 else '1,2,3,4,5,6,7').split(',')]
SHOTS = sys.argv[3] if len(sys.argv) > 3 else None
SCHEME = os.environ.get('SCHEME', 'dark')
PROFILE = tempfile.mkdtemp(prefix='biochar-card-')
# Trennwörterbücher aus dem Chrome des Users: ein frisches Profil hat keine, hyphens: auto trennte dann gar nicht
HYPH = os.path.expanduser('~/.config/google-chrome/hyphen-data')
if os.path.isdir(HYPH): shutil.copytree(HYPH, os.path.join(PROFILE, 'hyphen-data'))
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
      const q = (s) => document.querySelector(s);
      const ui = { sem: r(q('.sem-bar')), nav: r(q('.nav-buttons')), hint: r(q('.center-hint')), panel: r(q('#panel')), brand: r(q('.brand')),
        actions: r(q('.top-actions')), ladder: r(q('.ladder')), timeline: r(q('#pyro-tl')) };
      [...document.querySelectorAll('.hsb:not(.is-off):not(.is-active)')].forEach((b, i) => ui['hsb' + i] = r(b));
      const card = q('.hs-card');
      return { card: card.classList.contains('is-away') ? null : r(card), ui, W: innerWidth, H: innerHeight }; })()"""
    # Blocksatz ohne Gassen: größte Wortlücke je Absatz mit text-align: justify (ohne letzte und weggekürzte Zeilen), in em;
    # getrennt wird nur an normalen Leerzeichen, Zahl + Einheit mit geschütztem Leerzeichen zählt als ein Wort
    GAPS = """((root) => { const out = [];
      for (const el of root.querySelectorAll('p, li')) {
        const cs = getComputedStyle(el), box = el.getBoundingClientRect();
        if (cs.textAlign !== 'justify' || !box.width || !el.checkVisibility()) continue;
        const fs = parseFloat(cs.fontSize), words = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n; (n = tw.nextNode());) for (const m of n.data.matchAll(/[^ \\n\\t]+/g)) {
          const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
          const rs = [...r.getClientRects()].filter((x) => x.width);
          if (rs.length && rs.at(-1).bottom <= box.bottom + 1) words.push({ w: m[0], l: rs[0].left, top: rs[0].top, r: rs.at(-1).right, end: rs.at(-1).top });
        }
        const last = words.length ? words.at(-1).top : 0;
        let max = 0, at = '';
        for (let i = 1; i < words.length; i++) {
          const a = words[i - 1], b = words[i];
          if (Math.abs(b.top - a.end) > 2 || Math.abs(b.top - last) < 2) continue;
          const g = (b.l - a.r) / fs; if (g > max) { max = g; at = a.w + ' ' + b.w; }
        }
        out.push({ cls: el.className || el.parentElement.className, w: Math.round(box.width), gap: +max.toFixed(2), at });
      }
      return out; })"""
    # em; normales Leerzeichen ≈ 0,26 em. Ab 0,7 em (Skill text-format §4: > ~2 Leerzeichen) Hinweis, ab 1,5 em Fehler: so
    # breit wird es nur ohne Trennung oder in zu schmaler Spalte (vor 2026-10-26 bis 3,5 em); dazwischen bleiben einzelne
    # Zeilen vor langen, absichtlich untrennbaren Ketten wie „(≈ 240–360 °C,“
    GAP_WARN, GAP_MAX = 0.7, 1.5
    gaps = wide = 0
    def gap_report(where, root):
        global gaps, wide
        for g in js(f"{GAPS}({root})") or []:
            if g['gap'] > GAP_WARN:
                gaps += 1; wide += g['gap'] > GAP_MAX
                print(f"{where} {'GASSE' if g['gap'] > GAP_MAX else 'lücke'} {g['gap']} em ({g['at']}) in .{g['cls']} {g['w']} px", flush=True)
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
            gap_report(f'{w} L{n} Tafel', "document.getElementById('panel')")   # Einleitung gekürzt
            js("document.querySelector('.lead-more')?.click(); document.querySelectorAll('#panel details').forEach((d) => d.open = true)")
            gap_report(f'{w} L{n} Tafel offen', "document.getElementById('panel')")
            js("document.querySelector('.lead-more')?.click(); document.querySelectorAll('#panel details').forEach((d) => d.open = false)")
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
                if c: gap_report(f'{w} L{n} {hid}', "document.querySelector('.hs-card')")
                if SHOTS and c:
                    open(f'{SHOTS}/{SCHEME}-{w}-L{n}-{hid}.png', 'wb').write(base64.b64decode(call('Page.captureScreenshot', {'format': 'png'})['data']))
                js(btn)   # zweiter Klick schließt die Karte
                time.sleep(0.4)
    errs = [e for e in events if e['method'] == 'Runtime.exceptionThrown' or (e['method'] == 'Runtime.consoleAPICalled' and e['params']['type'] in ('error', 'warning'))
            or (e['method'] == 'Log.entryAdded' and e['params']['entry']['level'] in ('error', 'warning') and 'favicon' not in e['params']['entry'].get('url', ''))]
    for e in errs[:5]: print('Konsole:', json.dumps(e['params'], ensure_ascii=False)[:200])
    print(f'Überlappungen {bad} · Lücken > {GAP_WARN} em {gaps} · Gassen > {GAP_MAX} em {wide} · Konsole {len(errs)}' + (f' · Bilder: {SHOTS}' if SHOTS else ''))
    ws.close()
finally:
    chrome.terminate(); chrome.wait()
    if server: server.terminate(); server.wait()
sys.exit(1 if bad or wide or errs else 0)
