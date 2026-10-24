[Claude] [Biochar] Ebene 5: Kelvin-Hysterese nach Cohan korrigieren
Rückmeldung an: dev-ws-6a
Kontext: Projekt ~/__project_biochar (eigenes Git, Stand 0de7158),
  Seite http://localhost:8470/#ebene=5 (npm run serve).
  Regler „Luftfeuchte“ der Ebene 5: science.js füllt Poren bis
  kelvinDiameterNm(rh) = 2,1 nm / ln(1/rh) + 0,6 nm (halbkugeliger
  Meniskus) und leert erst bei p² (desorbDiameterNm). Nach Cohan
  (1938, Quelle 16 in content.js) gilt halbkugelig beim Entleeren;
  Füllen läuft mit zylindrischem Meniskus (1,05 nm / ln(1/rh)).
  Die Schleife liegt eine Stufe zu tief (50 %: 4 statt ≈ 2 nm).
  User hat die Korrektur am 2026-10-24 bestätigt.
Aufgabe:
  - Füllast = kelvinDiameterNm(rh²), Entleerungsast = heutiger
    Füllast (wetDiameterNm, desorbDiameterNm, kelvinRh anpassen)
  - danach füllt ein Schlitz der Weite w wie ein Zylinder mit Ø w
    (beide einfach gekrümmt) → Faktor „2w“ in levels/meso.js
    (Schlitze, Riss-Keil) entfernen
  - HUD-Skala (hud.js rh-legend, Isotherme), Startwert in main.js
  - Texte Ebene 5 in content.js (Hotspot water: Ø bei 50/90/99 %,
    Schlitze ≈ 45–65 %), docs/research.md „Luftfeuchte in Ebene 5“
  - Tests anpassen
Dateien:
  - web/js/science.js
  - web/js/hud.js
  - web/js/main.js (nur Startwert wet)
  - web/js/levels/meso.js
  - web/js/content.js (nur Abschnitt meso)
  - docs/research.md
  - tests/science.test.js, tests/pyro_levels_check.py
Beachten:
  - AGENTS.md des Projekts: jede Zahl mit Quelle oder „Modell“
  - ideale Schlitze haben nach Cohan keine Hysterese → dort nur
    als Modell beschriften
  - Prüfen: node tests/science.test.js · LEVELS=5
    BIOCHAR_TEST_PORT=8473 python3 tests/pyro_levels_check.py
    (Hysterese, Messlinien, Puls) · hell + dunkel, 1440 + 390 px
