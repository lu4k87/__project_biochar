# Projekt-Regeln (biochar)

Ergänzt die gemeinsamen Regeln aller Projekte (`~/.claude/CLAUDE.md` → `~/ai_dev_workflow_global/rules/RULES.md`, gleiche Abschnittsnummern); bei Widerspruch gilt diese Datei, Sicherheit (§0) hat immer Vorrang. Angelegt am 2026-10-22 von Hand nach dem Muster von `projects.py new`; liegt vorerst in `~/dev_ws/__project_biochar` (Wunsch User, 2026-10-22) mit eigenem Git, im dev_ws über `.git/info/exclude` ausgeblendet – später Umzug nach `~/__project_biochar`.

## 0. Sicherheit
- **Arbeitsstand des Users nicht anfassen:** Server des Users auf Port 8470 laufen lassen; Tests mit eigener Instanz auf anderem Port.
- Zugangsdaten, `.env`, Nutzerdaten nie einchecken, nie in Antworten oder Screenshots zeigen.
- Fremde Bilder (REM-Aufnahmen aus Papern) nicht ins Repo legen – nur verlinken (Urheberrecht).

## 0c. Skill-Finder
- Allgemeine Skills: Tabelle in `RULES.md` §0c; für dieses Projekt vor allem `threejs` (Szenen, Shader), `soft-motion`/`hyperframes-animation` (Kamerafahrten), `research` (Quellen); eigene Skills gibt es noch nicht.

## 4. Projekt-Karte

| Ort | Zweck |
|---|---|
| `web/index.html` | Einstieg der Seite (ohne Build, ES-Module + Importmap) |
| `web/js/main.js` | Renderer, Ebenen laden, durchgehender Flug (beide Kameras mit gleicher Zoomrate, weiche Überblendung um den Anker, Partikel beim Durchtauchen), Intro-Bogen, Leerlauf-Fahrt (`CINE`, je Ebene `lv.cine`), Eingaben, Zusammenführung: gemeinsamer Hintergrund und Grading je Stimmung (`MOODS`), Linse (`LENS`: Tiefenunschärfe aus der Tiefentextur je Ebene `lv.dof`, Bloom aus einer Viertel-Vorstufe `lv.bloom`, Farbsaum), Tonemapping, Korn |
| `web/js/hud.js`, `web/js/icons.js`, `web/css/biochar.css` | Bedienoberfläche: Zoom-Schiene (vertikal, log-Skala, ziehbar → `onRail`), Hotspots als Hex-Abzeichen mit Leitlinien (Vorlage `_inspiration` 2026-10-22), Infotafel, REM-Datenleiste, Regler |
| `web/js/content.js` | alle Texte, Kennzahlen und Quellen je Ebene |
| `web/js/science.js` | Kennwerte über der Pyrolysetemperatur (IPCC, EBC, Kelvin-Gleichung, Nano-Struktur) und Pyrolyse-Zeitraffer (`pyroState`: Phasen, Zersetzung, Schwindung, Glut; `labProps`: Laborwerte ab Raumtemperatur) |
| `web/js/voronoi.js`, `wood.js`, `walls.js`, `sem.js` | Power-Diagramm, Buchen-Gewebe, Wände und REM-Instanzen (Flocken, Thyllen), REM-Shader mit gemeinsamem, langsam schwenkendem Detektor (`semDetector`), additive Mischung ohne Alpha (`ADDITIVE`) |
| `web/js/levels/*.js` | die 7 Ebenen: `piece` → `tissue` → `cells` → `wall` → `meso` → `micro` → `atoms` |
| `web/vendor/three/` | three.js r170 + OrbitControls, RoomEnvironment (Fremdcode, nicht ändern) |
| `tests/science.test.js` | Prüfung der Kennwerte und der Voronoi-Zerlegung |
| `docs/research.md` | Recherche: Quellen, Kennzahlen, weitere Vorlagen |
| `AGENTS.md` | diese Regeln (`GEMINI.md` = Link darauf) |
| `.claude/memory/` | Projekt-Memory, Index `MEMORY.md` |

## 5. Arbeitsweise
- **Start:** `npm run serve` (= `python3 -m http.server 8470 --bind 127.0.0.1 --directory web`) → `http://localhost:8470/` · Ebene direkt: `#ebene=1` … `#ebene=7`.
- **Parameter:** `?tour` (optional `&dwell=Sekunden`) taucht selbständig durch alle Ebenen (Ausstellung, endet bei Eingabe) · `?freeze=0.5` hält den ersten Übergang an (nur für Screenshots) · `?T=450` setzt die Temperatur (auch < 350 °C: Holz bis Übergang) · `?play` startet den Zeitraffer „Pyrolyse abspielen“ nach dem Laden, `&playsec=8` verkürzt ihn.
- **Prüfungen (Definition of Done):** `node tests/science.test.js` · Seite im Headless-Chrome je geänderter Ebene laden (`#ebene=n`), Konsole ohne Fehler, Screenshot ansehen (hell + dunkel, 1440 px und 390 px). Zeitabläufe (Intro, Übergänge) nur mit echter GPU und Echtzeit prüfen (`--enable-gpu --use-angle=gl --timeout=8000`): SwiftShader liefert zu wenige Bilder, `--virtual-time-budget` friert CSS-Animationen ein (Tafel bleibt blass, Ladering bleibt stehen). Zustand der Logik stattdessen per `--dump-dom --timeout=7000` prüfen: `<body class="is-ready">` ohne `is-loading`, `#hotspots` ohne `is-hidden` außerhalb eines Übergangs.
- **Wissenschaft:** jede Zahl in `content.js`/`science.js` braucht eine Quelle in `SOURCES` oder steht als „Modell“/„Richtwert“ gekennzeichnet.
- **Commit + Push:** direkt in diesem Repo (Remote noch offen), Skill `commit`.
