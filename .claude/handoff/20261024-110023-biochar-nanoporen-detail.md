[Claude] [Biochar] Ebene 5 Nanoporen: realistischer + detailreicher
übernommen von dev-ws-6a am 2026-10-24 11:01
Rückmeldung an: dev-ws-ae
Kontext: Projekt ~/__project_biochar (eigenes Git, Stand ac0d2b3),
  Seite http://localhost:8470/#ebene=5 (npm run serve).
  User fragt: „Ist das in echt auch so? Sieht das wirklich so aus?
  Detaillierter machen.“
Aufgabe:
  - Szene mit echten Befunden vergleichen (TEM/REM, Gasadsorption
    an Holz-/Buchen-Biochar, Poren 2–50 nm): Form, Größen,
    Wandstruktur, Dichte – Abweichungen benennen
  - Darstellung feiner und detailreicher machen, Abweichungen
    vom Befund korrigieren, Texte der Ebene in content.js anpassen
  - dem User kurz erklären: was ist belegt, was ist Modell
Dateien:
  - web/js/levels/meso.js
  - web/js/content.js (nur Abschnitt Ebene 5)
  - web/js/science.js (nur falls Kennwerte nötig)
  - docs/research.md (Quellen)
Beachten:
  - AGENTS.md des Projekts: jede Zahl mit Quelle in SOURCES oder
    als „Modell“ gekennzeichnet; fremde REM-/TEM-Bilder nur verlinken
  - Skills threejs, research; Leistung über quality.js-Stufen
  - parallel Chat biochar-mikroporen-detail (Ebene 6, micro.js):
    content.js/science.js nur eigene Abschnitte, per Pfad committen
  - Prüfen: node tests/science.test.js, Headless-Chrome #ebene=5
    hell + dunkel, 1440 + 390 px, eigene Instanz auf Port 8473
