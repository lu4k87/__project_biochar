[Claude] [Biochar] Boden Ebene 1: Waldboden + Terra preta umsetzen
übernommen von dev-ws-ea am 2026-10-24 13:21
Rückmeldung an: [Claude] dev-ws-67
Kontext: Vorschau „Boden unter dem Kohlestück: 5 Ideen“ am 2026-10-24 entschieden
  (Schatzkammer __treasury__allprojects/biochar/vorschauen/
  2026-10-24-boden-unter-dem-kohlestück-5-ideen, globales Repo 2009b5b)
  - Gewählt: Boden:A (Waldboden: Humus, Buchenblätter, Ästchen)
    + Boden:B (Terra preta: Krümelgefüge, Kohlesplitter, Feinwurzeln)
  - F1 ja: Kohlekrümel des Stücks dunkler und matter (wie das Stück)
  - Anmerkung des Users wörtlich: „mische A und B und mach den boden nicht
    auf einer so simplen kreisscheibenebene sondern größere bodenfläche.
    arbeite randomness ein "seeds"“
  - Lauffähiger Prototyp im Vorschau-Ordner unter prototyp/
    (ground.js, README.md mit den 5 Einbau-Stellen in piece.js, cap.py)
Aufgabe:
  - web/js/levels/ground.js neu aus dem Prototyp: nur die Mischung A + B
    (Humus mit Laubresten + Krümelgefüge mit Kohle, Blätter, Laubschnipsel,
    Ästchen, Erdkrümel, Kohlesplitter, Feinwurzeln); C, D, E entfallen
  - Fläche größer und nicht flach: leichtes Relief (verschobenes Netz statt
    Ebene), unregelmäßiger Rand statt Kreis-Ausblendung, läuft weit in den
    Hintergrund (Tiefenunschärfe übernimmt die Ferne)
  - Zufall per Seed: jede Ladung neuer Seed, per ?seed=… festlegbar,
    gleicher Seed = gleiche Anordnung (Deutung von „seeds“; unklar → fragen)
  - Kohlekrümel (crumbMat in piece.js) dunkler + matter (F1)
  - Bodentextur nicht beim Laden rechnen (Prototyp braucht 2–5 s):
    fertiges Bild, Worker oder kleinere Kachel – Ladezeit messen
  - echte Schatten nur bei quality.shadows, sonst Kontaktschatten
Dateien:
  - web/js/levels/piece.js (Boden ab Zeile ≈ 583: Krümel, shadow, floor, Lichter)
  - web/js/levels/ground.js (neu)
  - web/js/quality.js, AGENTS.md (Projekt-Karte nachziehen)
Beachten:
  - Skill threejs; Vorschau ist entschieden, keine neue nötig
  - Prüfung AGENTS.md §5: node tests/science.test.js, #ebene=1 headless
    hell + dunkel bei 1440 und 390 px, Konsole ohne Fehler,
    python3 tests/hs_card_check.py 1440,390 1
  - Server des Users auf 8470 nicht anfassen, eigene Instanz nutzen
  - piece.js ändern auch andere Biochar-Chats (Glut 800 °C) → vorher
    ListAgents + git status, gleiche Datei → abstimmen
