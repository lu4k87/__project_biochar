[Claude] [Biochar] Ebenen-Schalter: liegen gebliebene Änderungen prüfen
übernommen von dev-ws-84 am 2026-10-26 17:27
Rückmeldung an: dev-ws-37
Kontext: Repo ~/__project_biochar (three.js ohne Build), zuerst AGENTS.md.
  17 Dateien enthalten uncommittete Änderungen eines beendeten Chats
  (Stand 15:55–16:08 am 2026-10-26): neue web/js/layers.js (Schalter
  „Ebene n · …“ im Zahnrad, Wassertropfen, Tagesgang, Schwingungen …),
  dazu settings.js (Panel-Umbau Bento), main.js (registerLayers,
  showLayers), hud.js (setRh), science.js + tests/science.test.js,
  alle web/js/levels/*.js, content.js (+2 Zeilen), biochar.css,
  AGENTS.md, README.md. Der Chat dev-ws-37 hat in denselben Dateien nur
  eigene Stellen committet (a1212bf, Blocksatz + Mausrad-Zoom); der
  fremde Rest liegt unverändert und unstaged im Arbeitsbaum.
Aufgabe:
  - Änderungen sichten (git diff, layers.js lesen), ob vollständig
    und lauffähig; offensichtliche Lücken schließen
  - Befund mitprüfen: Statuszeile der Info-Karte zeigt „La ≈ NaN nm“
    (Ebene 6, z. B. Zellulose-Mikrofibrille / CO₂ in der Pore)
  - Prüfung laut AGENTS.md §5: npm test, hs_card_check.py,
    facts_check.py, Seite je Ebene ohne Konsolenfehler, Zahnrad
    ?cfg und ?cfg=global hell + dunkel, 1440 px + 390 px
  - danach committen + pushen (Skill commit), Zettel im selben
    Commit löschen
Dateien:
  - web/js/layers.js, web/js/settings.js, web/js/main.js, web/js/hud.js
  - web/js/science.js, tests/science.test.js, web/js/levels/*.js
  - web/js/content.js, web/css/biochar.css, AGENTS.md, README.md
Beachten:
  - Server des Users auf 8470 läuft (PID 1087328) → nicht anfassen,
    Tests auf eigenem Port (BIOCHAR_TEST_PORT)
  - Schon bekannt, nicht von diesem Umbau: bei 1024 px überdeckt die
    Info-Karte in Ebene 3/5/6/7 Abzeichen (hs_card_check BAD)
