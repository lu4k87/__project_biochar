[Claude] [biochar] Zahnrad: Reiter Qualität + Stufe Sparsam
Rückmeldung an: dev-ws-a7
Kontext: User 31.10.2026: „in den settings auch einen Reiter für
  Qualität, dass auch schwache Computer ohne gute Grafikkarte die
  biochar Webseite besuchen und ansehen können“; Auswahl im Dialog:
  „Reiter + Sparstufe“. Heute: Karte „Leistung“ im Reiter Global
  (Qualität Auto/Leicht/Mittel/Fein mit Messzeile, Detailgrad,
  Schatten, Renderskala, Bildraten-Deckel), Stufen in quality.js,
  Auto = Bildraten-Probe 5 s + Wache mit Hysterese. Stand da1373f
  (Karte „Material & Optik“ neu im Reiter Global).
Aufgabe: dritter Reiter „Qualität“ neben „Ebene n | Global“ (Karte
  „Leistung“ wandert dorthin) und neue Stufe „Sparsam“ unter Leicht
  für Rechner ohne Grafikkarte: niedrige Renderskala, ohne
  Tiefenunschärfe/Bloom/Farbsaum/Schatten, vereinfachte Ebenen
  (setParam 'quality'), Waldboden leichter; Auto startet auf
  schwachen Geräten (z. B. Software-Renderer, wenig Speicher,
  langsame Probe) gleich dort. Erst Vorschau (Skill preview), dann
  umsetzen, Prüfstufe 2, Commit + Push, Zettel löschen.
Dateien: web/js/quality.js · web/js/settings.js (GROUPS, Reiter,
  HTML) · web/js/layers.js · web/js/main.js (applyQuality, eff) ·
  web/js/levels/*.js (setParam 'quality') · web/css/biochar.css ·
  tests/quality.test.js · AGENTS.md §4 + README.md
Beachten:
  - Messen: Headless Chrome mit SwiftShader = schwacher Rechner
    (ohne --enable-gpu), Bildzeit je Ebene 1–7 vorher/nachher
  - Server des Users (8470) nicht anfassen, eigene Instanz
  - Hell + Dunkel 1440 + 390 px, npm test, hs_card_check, facts_check
