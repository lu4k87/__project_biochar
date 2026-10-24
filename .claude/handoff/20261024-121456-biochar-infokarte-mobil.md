[Claude] [Biochar] Info-Karte mobil: Lage im freien Bereich (Vorschau)
übernommen von dev-ws-08 am 2026-10-24 12:17
Rückmeldung an: dev-ws-13
Kontext: Desktop ist fertig (Commit d4b7bb1): placeCard hält die Karte
  ganz im freien Bereich (links, rechts, darunter/darüber), max-height
  = Bühnenhöhe, andere Abzeichen weichen der Karte aus; 1440 px auf
  allen 7 Ebenen 0 Überlappungen (tests/hs_card_check.py).
  Mobil (≤ 860 px) ist noch alt: die Karte (is-stacked, Lupe über dem
  Text) ragt über REM-Leiste, Knopfleiste und Tafel – bei 390 × 844
  in jedem Fall. Maße 390 × 844: Kopf 12–97, Schiene 107–165, freie
  Bühne nur 175–343 (168 px), .sem-bar 353–411, .nav-buttons 427–468,
  #panel 478–832; Karte heute 300–480 px hoch.
Aufgabe: mobile Lage der Info-Karte neu lösen (Zero Overlap, ganz
  sichtbar, Lupe bleibt): erst Vorschau mit Varianten (Skill preview),
  z. B. Karte statt Tafel im Tafel-Bereich · Tafel beim Öffnen
  einklappen, Karte über der Knopfleiste · kompakte Karte mit kleiner
  Lupe in der Bühne; nach Wahl des Users Code + Prüfung
Dateien:
  - web/js/hud.js (placeCard: Zweig stacked, ponytail-Kommentar)
  - web/css/biochar.css (.hs-card, .hs-lens, @media max-width 860px)
  - tests/hs_card_check.py
Beachten:
  - python3 tests/hs_card_check.py 1440,390 → 0 Überlappungen,
    Konsole leer; SCHEME=light für hell; node tests/science.test.js
  - eigene Instanz 8471, nie Port 8470 (Server des Users)
  - biochar.css/hud.js ändern parallel andere Chats (Schiene, Leisten,
    .sem-bar, .nav-buttons) → vorher fast-forward, nur eigene Hunks
  - Ebene 3 bei 390 px: kaum Abzeichen sichtbar → andere Ebene wählen
