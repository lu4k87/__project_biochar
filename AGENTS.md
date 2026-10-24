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
| `web/js/main.js` | Renderer, Ebenen laden, durchgehender Flug (beide Kameras mit gleicher Zoomrate, inneres Bild mit seinem Blickziel auf dem Anker, Belichtungsangleich, Lichtschleier statt Teilchen beim Durchtauchen), Intro-Bogen, Leerlauf-Fahrt (`CINE`, je Ebene `lv.cine`), Eingaben, Zusammenführung: gemeinsamer Hintergrund und Grading je Stimmung (`MOODS`), Linse (`LENS`: Tiefenunschärfe aus der Tiefentextur je Ebene `lv.dof`, Bloom aus einer Viertel-Vorstufe `lv.bloom`, Farbsaum), Tonemapping, Korn; Lupe der Info-Karte (`LOUPE`, `renderLoupe`: eigene Kamera auf den Infopunkt → eigenes Bild → Zusammenführung per Viewport in die Bildschirmecke → `drawImage` ins Canvas der Karte, jedes 2. Bild; Ebenen mit eigenen Kamera-Uniforms setzen sie in `onBeforeRender`, z. B. Ebene 5) |
| `web/js/hud.js`, `web/js/icons.js`, `web/css/biochar.css` | Bedienoberfläche: Zoom-Schiene (vertikal, log-Skala, ziehbar → `onRail`, Welten-Klammern `MAKRO`/`REM`/`NANO` und Alltags-Größenvergleiche), Hotspots als Hex-Abzeichen mit gewinkelten 45°-Leitlinien und nummeriertem Entdeckungs-Pfad (Vorlage `_inspiration` 2026-10-22 + Vorschau 2026-10-24), 3D-Messhilfen je Ebene (`Makro:A`, `Nano:A`, ein-/ausblendbar über `#btn-overlays` → `localStorage`), REM-Apertur-Visier, Info-Karte mit Fadenkreuz-Lupe (`hud.lens()` liefert das Canvas, solange die Karte sichtbar ist), Infotafel (2×2-Kennzahlen-Bento ab 360 px + Laborwerte mit Live-Balken), REM-Datenleiste mit Teilstrich-Lineal, Pyrolyse-Zeitleiste mittig in der Fußleiste, bei Platzmangel eigene Zeile darüber (Abspielen, Ziel, Kapitel, am Griff verschiebbar → `localStorage`), Regler |
| `web/js/quality.js` | Darstellungsqualität in drei Stufen (Regler oben rechts, `localStorage`, `?q=`): Pixelverhältnis, Maßstab und Kantenglättung der Ebenen-Bilder, Abtastpunkte der Linse (`comp.defines`), Tiefenunschärfe/Bloom/Farbsaum, Schatten, Detailgrad je Ebene über `setParam('quality')` (Ebene 5: Raymarch-Schritte, Ebene 7: Schattenkarte); ohne gespeicherte Wahl Bildraten-Probe in den ersten 5 s |
| `web/js/content.js` | alle Texte, Kennzahlen, Alltags-Größenvergleiche (`compare`), Welten (`zone`), Sprungfaktoren (`jumpDown`/`jumpUp`) und Quellen je Ebene |
| `web/js/science.js` | Kennwerte über der Pyrolysetemperatur (IPCC, EBC, Kelvin-Gleichung, Nano-Struktur) und Pyrolyse-Zeitraffer (`pyroState`: Phasen, Zersetzung, Schwindung, Glut; `labProps`: Laborwerte ab Raumtemperatur; `tissueScale`: Schwindung/Wanddicke der Gewebe-Ebenen). Alle Ebenen gleiten über `setParam('temp')` (laufender Wert) mit dem Regler, kein Neuaufbau |
| `web/js/voronoi.js`, `wood.js`, `walls.js`, `sem.js` | Power-Diagramm, Buchen-Gewebe, Wände und REM-Instanzen (Flocken, Thyllen), REM-Shader mit gemeinsamem, langsam schwenkendem Detektor (`semDetector`), additive Mischung ohne Alpha (`ADDITIVE`) |
| `web/js/levels/*.js` | die 7 Ebenen: `piece` → `tissue` → `cells` → `wall` → `meso` → `micro` → `atoms` |
| `web/js/levels/ground.js`, `ground_tex.js` | Waldboden der Ebene 1 (Humus mit Buchenlaub + Terra preta, Vorschau 2026-10-24): Fläche Ø ≈ 1 m mit Relief (`heightAt`, Krümel des Stücks liegen darauf) und unregelmäßigem Rand, Anordnung und Texturen aus einem Seed; Texturen rechnet ein Modul-Worker (≈ 2–2,5 s neben dem Aufbau, ohne three.js), danach blenden sie in 1,2 s ein; echte Schatten nur bei `quality.shadows`, sonst Kontaktschatten |
| `web/vendor/three/` | three.js r170 + OrbitControls, RoomEnvironment (Fremdcode, nicht ändern) |
| `tests/science.test.js` | Prüfung der Kennwerte und der Voronoi-Zerlegung |
| `docs/research.md` | Recherche: Quellen, Kennzahlen, weitere Vorlagen |
| `AGENTS.md` | diese Regeln (`GEMINI.md` = Link darauf) |
| `.claude/memory/` | Projekt-Memory, Index `MEMORY.md` |

## 5. Arbeitsweise
- **Start:** `npm run serve` (= `python3 -m http.server 8470 --bind 127.0.0.1 --directory web`) → `http://localhost:8470/` · Ebene direkt: `#ebene=1` … `#ebene=7`.
- **Parameter:** `?tour` (optional `&dwell=Sekunden`) taucht selbständig durch alle Ebenen (Ausstellung, endet bei Eingabe) · `?freeze=0.5` hält den ersten Übergang an (nur für Screenshots) · `?T=450` setzt die Temperatur (auch < 350 °C: Holz bis Übergang) · `?play` startet den Zeitraffer „Pyrolyse abspielen“ nach dem Laden, `&playsec=8` verkürzt ihn · `?q=1|2|3` erzwingt die Qualitätsstufe (sonst gespeicherte Wahl bzw. Bildraten-Probe) · `?fps` schreibt alle 2 s Bildrate und Stufe in die Konsole. · `?seed=123` legt die Anordnung des Waldbodens in Ebene 1 fest (sonst je Ladung neu, steht als `[boden] seed=…` in der Konsole).
- **Prüfungen (Definition of Done):** `node tests/science.test.js` · Seite im Headless-Chrome je geänderter Ebene laden (`#ebene=n`), Konsole ohne Fehler, Screenshot ansehen (hell + dunkel, 1440 px und 390 px). Zeitabläufe (Intro, Übergänge) nur mit echter GPU und Echtzeit prüfen (`--enable-gpu --use-angle=gl --timeout=8000`): SwiftShader liefert zu wenige Bilder, `--virtual-time-budget` friert CSS-Animationen ein (Tafel bleibt blass, Ladering bleibt stehen). Zustand der Logik stattdessen per `--dump-dom --timeout=7000` prüfen: `<body class="is-ready">` ohne `is-loading`, `#hotspots` ohne `is-hidden` außerhalb eines Übergangs. Zeitpunkte gezielt (Pyrolyse-Zeitleiste: Zeitraffer, Phasen, Ziel, Kapitel-Sprung, Verschieben, Überlappung, Konsole, Hell/Dunkel + reduced-motion emuliert): `python3 tests/pyro_overlay_check.py` (CDP, eigene Instanz 8471) – Muster für weitere Zeitablauf-Prüfungen. Lage der Info-Karte (Zero Overlap je Ebene, Breite, Hell/Dunkel): `python3 tests/hs_card_check.py [1440,390] [1,…,7] [bilder-ordner]` (`SCHEME=light`).
- **Wissenschaft:** jede Zahl in `content.js`/`science.js` braucht eine Quelle in `SOURCES` oder steht als „Modell“/„Richtwert“ gekennzeichnet.
- **Commit + Push:** direkt in diesem Repo (Remote noch offen), Skill `commit`.
