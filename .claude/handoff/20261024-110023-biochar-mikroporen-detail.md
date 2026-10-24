[Claude] [Biochar] Ebene 6 Mikroporen: feiner + wissenschaftlich prüfen
Rückmeldung an: dev-ws-ae
Kontext: Projekt ~/__project_biochar (eigenes Git, Stand ac0d2b3),
  Seite http://localhost:8470/#ebene=6 (npm run serve).
  Screenshot des Users: große glatte cremeweiße gebogene Platten
  (turbostratische Lagen), verstreute dunkelblaue Würfelchen,
  wenige rosa/weiße Kugeln, Hotspots „Turbostratischer Stapel“,
  „Mikropore“, „CO₂ in der Pore“. User: „detailreicher und feiner,
  prüfe ob das wissenschaftlich korrekt dargestellt wird“
Aufgabe:
  - mit Befunden vergleichen (HRTEM von Biochar/Hartkohle:
    gebogene Graphen-Lagen ≈ 1–3 nm, 2–4 Lagen je Stapel,
    Abstand ≈ 0,34–0,38 nm, Mikroporen < 2 nm, CO₂ ≈ 0,33 nm):
    Maßstab, Lagen-Form, Porenform, Moleküle – Abweichungen nennen
  - Darstellung feiner und detailreicher machen, Fehler korrigieren,
    Texte der Ebene in content.js anpassen
  - dem User kurz erklären: was ist belegt, was ist Modell
Dateien:
  - web/js/levels/micro.js
  - web/js/content.js (nur Abschnitt Ebene 6)
  - web/js/science.js (nur falls Kennwerte nötig)
  - docs/research.md (Quellen)
Beachten:
  - AGENTS.md des Projekts: jede Zahl mit Quelle in SOURCES oder
    als „Modell“ gekennzeichnet; fremde TEM-Bilder nur verlinken
  - Skills threejs, research; Leistung über quality.js-Stufen
  - Zahlen oben sind Richtwerte aus dem Gedächtnis → mit Quellen
    belegen oder korrigieren
  - parallel Chat biochar-nanoporen-detail (Ebene 5, meso.js):
    content.js/science.js nur eigene Abschnitte, per Pfad committen
  - Prüfen: node tests/science.test.js, Headless-Chrome #ebene=6
    hell + dunkel, 1440 + 390 px, eigene Instanz auf Port 8474
