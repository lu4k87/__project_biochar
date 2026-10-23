[Claude] [Biochar] Risse/Kerben: Holz kaum, Kohle etwas mehr
Rückmeldung an: [Claude] dev-ws-2e
Kontext: Projekt ~/__project_biochar (AGENTS.md lesen), Seite
  `npm run serve` → http://localhost:8470/ · Ebene direkt #ebene=n,
  Temperatur ?T=20 (Holz) … ?T=800 (Kohle) · Stand 46f6b50.
  Wunsch des Users (wörtlich): „die risse und kerben im holz weniger
  und in der kohle dann etwas mehr als aktuell. mach es resistisch.
  das holz nur eine ganz leicht raue, aber so so tiefe kerben!“
  (gemeint: realistisch; Holz nur leicht rau, NICHT so tiefe Kerben)
Aufgabe: Holz: nur ganz leicht raue Oberfläche, keine tiefen
  Kerben/Risse. Kohle: Schwundrisse etwas stärker als jetzt und
  realistisch (Holzkohle: Querrisse quer zur Faser = Würfelmuster,
  Radialrisse entlang der Holzstrahlen, Ringrisse, Breite wächst
  mit T). Übergang Holz → Kohle bleibt gleitend mit Regler und
  Zeitraffer (setParam 'temp', uCrack).
Dateien:
  - web/js/levels/piece.js (Ebene 1, vermutlich gemeint:
    Schwundrisse als Geometrie CRACK {width, depth, lift},
    Riss-Textur crackTexture, uCrack, Relief/Rauheit)
  - web/js/science.js nur bei Bedarf (tissueScale.crack, pyroState)
  - ggf. levels/tissue.js, cells.js, wall.js (dort eigene Risse)
Beachten:
  - Zuerst je Ebene Screenshot Holz (?T=20) und Kohle (?T=550):
    wo sind die tiefen Kerben im Holz? Unklar → User per
    AskUserQuestion mit Bildern fragen
  - Wunsch ist klar → Parameter direkt anpassen, Vorher/Nachher-
    Bogen zeigen (Holz + Kohle)
  - Wissenschaft: Zahlen mit Quelle (SOURCES) oder als Modell
  - DoD laut AGENTS.md: node tests/science.test.js, Konsole hell/
    dunkel, 1440 + 390 px; Server des Users auf 8470 nicht
    anfassen, eigene Instanz auf anderem Port
  - Commit + Push im Projekt-Repo, diesen Zettel im selben Commit
    löschen
