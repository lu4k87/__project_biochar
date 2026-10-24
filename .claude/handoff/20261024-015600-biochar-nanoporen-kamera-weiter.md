[Claude] [Biochar] Ebene 5 Nanoporen: Kamera weiter weg
übernommen von dev-ws-bb am 2026-10-24 02:12
Rückmeldung an: [Claude] dev-ws-cc
Kontext: Projekt ~/__project_biochar (AGENTS.md lesen), Seite
  `npm run serve` → http://localhost:8470/ · Ebene direkt #ebene=5
  (Zoom-Schiene „300 nm Nanoporen“), Stand 5a4bf0e.
  Wunsch des Users (wörtlich): „die nanoporen ebne nicht so nah dran“
Aufgabe: Startansicht der Ebene 5 weiter weg (mehr Überblick), ohne
  den durchgehenden Flug von Ebene 4 → 5 → 6 zu brechen.
Dateien:
  - web/js/levels/meso.js: home (Z. ≈ 320, Abstand zur Wand
    (3, 6, 11)), orbit minDistance/maxDistance, cine (Leerlauf-Fahrt)
  - web/js/main.js nur bei Bedarf (Anker/Übergang der Kameras)
Beachten:
  - Zuerst Screenshot jetzt (#ebene=5, ?T=550) und Varianten Abstand
    z. B. ×1,3 / ×1,6 als Bildbogen; Grad unklar → User per
    AskUserQuestion mit Bildern fragen
  - Hotspots/Abzeichen müssen im Bild bleiben, Raymarch-Detail
    (quality) bei größerem Abstand prüfen (kein Flackern, s. Ebene 6)
  - DoD laut AGENTS.md: node tests/science.test.js, Konsole hell/
    dunkel, 1440 + 390 px, Übergang 4 → 5 nur mit echter GPU;
    Server des Users auf 8470 nicht anfassen, eigene Instanz
  - Commit + Push im Projekt-Repo, diesen Zettel im selben Commit
    löschen
