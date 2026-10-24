[Claude] [Biochar] Pyrolyse-Zeitleiste im Bild (Pyro:A, ziehbar)
Rückmeldung an: [Claude] dev-ws-4b
Kontext: Vorschau „Pyrolyse-Steuerung in die 3D-Ansicht holen –
  5 Vorschläge“ entschieden (2026-10-24, globales Repo 465f78f):
  - F2 → Pyro:A „Zeitleiste mit Phasen-Kapiteln am unteren Bildrand“
  - F1 → Steuerung nur im Bild, Leiste per Drag-and-drop verschiebbar
  Anlass: „▶ Pyrolyse abspielen“ und „Zieltemperatur“ liegen heute in
  der Infotafel (hud.js, section.controls) und sind bei 1440 × 900 erst
  nach Scrollen sichtbar. Vorschau + Mockup (mockup/mock.js, mock.css,
  nur Vorlage, Werte live aus science.js) im Ordner:
  ~/ai_dev_workflow_global/__treasury__allprojects/biochar/vorschauen/
  2026-10-24-pyrolyse-steuerung-in-die-3d-ansicht-holen-5-vorschläge/
  Aufbau A: runder Startknopf ▶/■ · Kopfzeile Ist-°C, Phase, Gase,
  „Ziel 550 °C“ · Spur = Temperaturachse T_ROOM…T_MAX als Raster der
  6 PHASES (Breite = Spanne), durchlaufener Anteil in Phasenfarbe,
  weißer Punkt = Ist, weißes Dreieck = Ziel, Strich bei T_MIN ·
  Kapitel-Namen darunter, aktives orange · mobil nur aktives Kapitel.
Aufgabe:
  1. Zeitleiste als HUD-Element in der 3D-Ansicht bauen (grid-area
     stage, unten über der Messleiste), an onPlay, state.temp und
     setLive anbinden; Ziel-Dreieck ziehbar + Tastatur (role="slider",
     ←/→), Klick auf ein Kapitel springt an den Phasenbeginn.
  2. Leiste per Drag-and-drop verschiebbar: Griff, Pointer Events,
     innerhalb der Bühne begrenzt, Position per localStorage (try/catch),
     „zurück an Standardplatz“ per Doppelklick/Knopf, Tastatur-Ersatz.
  3. Infotafel: Live-Karte #pyro-live, #btn-play, Regler #in-temp und
     Phasenleiste aus section.controls entfernen; Tabelle #lab und
     H/Corg-Diagramm bleiben.
  4. Danach gewählte Variante als UI-Baustein ins Repertoire (Skill
     preview), Zettel im Commit der Arbeit löschen.
Dateien:
  - web/js/hud.js (renderPanel section.controls, pyroLive, phaseScale,
    setLive, setStage)
  - web/css/biochar.css (.pyro-live, .slider, .phase-scale, .stage-hud)
  - web/index.html (.stage-hud)
  - tests/pyro_overlay_check.py (prüft Einblendung, ggf. anpassen)
Beachten:
  - Einblendung #pyro-stage oben zeigt beim Abspielen dasselbe wie die
    Kopfzeile der Leiste → entfernen naheliegend, nicht entschieden:
    User kurz fragen
  - Andere Chats arbeiten parallel in __project_biochar: vorher
    ListAgents + git status, fremde uncommittete Dateien nie anfassen
  - Zero Overlap: Leiste nie über Messleiste, Ebenen-Knöpfen,
    Info-Karte; mobil (390 × 844) freie Bühne nur ca. 168 px hoch
  - Prüfungen laut AGENTS.md §5: node tests/science.test.js, Headless
    1440 + 390 px, hell + dunkel, Konsole ohne Fehler,
    python3 tests/pyro_overlay_check.py; UI-Regeln + Skill ui-motion
