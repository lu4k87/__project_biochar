[Claude] [Biochar] Ebene 5 umsetzen: Hero-Porenwand + Feuchte-Animation
Rückmeldung an: [Claude] dev-ws-fa
Kontext: Projekt ~/__project_biochar (AGENTS.md lesen), Seite
  `npm run serve` → http://localhost:8470/#ebene=5. Stand ed8ec33
  (Infokarte ohne Zittern, Blocksatz). Vorschau am 2026-10-23
  entschieden, Seite + Bilder:
  ~/ai_dev_workflow_global/__treasury__allprojects/biochar/vorschauen/
  2026-10-23-nanoporen-ebene-detaillierter-luftfeuchte-animation/
  Dort: prototyp-meso.patch (Shader-Diff gegen web/js/levels/meso.js:
  uDetail-Relief, uWmode 1 Füllstand+Meniskus, uWmode 2 Film, probe())
  und prototyp-overlays.py (JS für Messlinien, Skala, Isotherme).
Aufgabe (Entscheidungen des Users):
  - Poren:B: Startkamera nah an der Porenwand (Prototyp: Ziel Hotspot
    wallpore, Kamera +3/+6/+11), feines Wandrelief auf allen
    Qualitätsstufen, Messlinien „Ø … nm · Makro-/Mesopore“ an 3 Poren
    (Werte aus dem Porenmodell sizeL, als Modell gekennzeichnet),
    Kamerafahrt nur im Leerlauf (lv.cine) entlang der Wand, kein Knopf.
  - Feuchte:A+B+C zusammen: Füllstand mit Meniskus, Wasserfilm wächst
    mit der Feuchte, Skala Mikro/Meso/Makro unter dem Regler,
    Mini-Isotherme (Modell) mit Punkt, Anzeige „Poren gefüllt bis
    Ø … nm“, Hex-Abzeichen „Kapillarkondensation“ pulsiert (900 ms).
  - Hysterese ja: beim Zurückdrehen entleeren sich Poren erst bei
    tieferer Feuchte (Desorptionsast), Isotherme zeigt beide Äste.
Dateien:
  - web/js/levels/meso.js
  - web/js/hud.js (Regler-Bereich der Tafel)
  - web/js/science.js (Isotherme, Hysterese als Modell)
  - web/js/content.js (meso: Texte, „Modell“)
  - web/css/biochar.css
  - docs/research.md, tests/science.test.js
  - tests/pyro_levels_check.py
Beachten:
  - Prüfung mit echter GPU, eigene Instanz 8471 (nie 8470), hell +
    dunkel, 1440 + 390 px, Regler 0/50/90/99 %, Konsole ohne Fehler,
    prefers-reduced-motion (Puls nur Farbe, kein Glitzern-Drift).
  - Kelvin-Ø erreicht die Makroporen (27–57 nm) erst bei 93–98 %;
    Füllhöhe zwischen leer und voll ist Darstellung → als Modell.
  - Nicht gewählt, nicht übernehmen: uClass, uCut, uHi, Legende.
  - hud.js placeCard: Breite mit Hysterese (ed8ec33) nicht zurückbauen.
  - Offen beim User: Regler „Zieltemperatur“ ab 25 °C statt 350 °C?
    Ohne Antwort nichts ändern.
  - Commit + Push im Projekt-Repo, diesen Zettel im selben Commit
    löschen.
