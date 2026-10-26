[Claude] [Biochar] Alle Texte: Blocksatz, Trennung, Abstände
Rückmeldung an: dev-ws-8b
Kontext: Fließtexte in allen Bereichen (Infotafel, Info-Karte,
  Hotspot-Karten, Einstellungs-Panel, Ebenen-Titel, Hinweise)
  wirken unruhig: linksbündig, automatische Silbentrennung
  zerreißt Wörter und Eigennamen, Abstände und Ränder uneinheitlich.
  Vorbild des Problems: Kosmos-Karte „Mehr dazu“ („Na-vigations…“,
  „Ce-lesTrak“).
Aufgabe:
  - jeden Fließtext sauber im Blocksatz (text-align: justify,
    letzte Zeile links), ohne Lücken („Gassen“) in schmalen Spalten
  - Silbentrennung nur, wo nötig (lange Komposita); Eigennamen,
    Kürzel, Zahlen + Einheit nie trennen (&shy; gezielt,
    hyphens: manual statt auto, wo es Wörter zerreißt)
  - Bindestriche/Striche im Text meiden: nur bei echten Komposita
    mit Kürzel/Zahl; sonst umformulieren (content.js)
  - Abstände, Innenränder, Zeilenabstand, Absatzabstand je
    Textblock einheitlich (eine Skala)
  - Kurze Labels, Kennzahlen, Knöpfe bleiben linksbündig/zentriert
Dateien:
  - web/css/biochar.css
  - web/js/content.js (Texte)
  - web/js/hud.js, web/js/settings.js (Text-Markup)
Beachten:
  - Skill text-format (Blocksatz, Umbruch), UI-Grundregeln RULES §3
  - content.js + 15 weitere Dateien haben FREMDE uncommittete
    Änderungen (Stand 16:02, Ebenen-Schalter layers.js):
    vorher git status/diff, ListAgents, Besitzer klären;
    nie mitcommitten, bei gleicher Datei 3-Wege-Merge
  - Prüfung laut AGENTS.md §5: npm test, facts_check.py,
    hs_card_check.py, Hell + Dunkel, 1440 px + 390 px
  - Server des Users auf 8470 nicht anfassen, Test auf eigenem Port
Zusatz-Aufgabe (User, 16:40, nach den Texten):
  - Mausrad-Zoom der Kamera noch weicher: kleineres Tempo je
    Raste, längeres Ausgleiten (Dämpfung), keine Sprünge bei
    schnellem Drehen oder Touchpad; Pinch auf Touch unverändert
  - Ort: web/js/main.js (OrbitControls zoomSpeed/dampingFactor,
    eigener wheel-Handler); main.js hat FREMDE uncommittete
    Änderungen → wie oben erst klären, nie mitcommitten
  - Prüfung: Echtzeit mit GPU (Zeitablauf), Konsole ohne Fehler
