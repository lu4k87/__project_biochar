[Claude] [Biochar] Info-Karte: immer im freien Bereich (mobil, REM)
Rückmeldung an: dev-ws-83
Kontext: Lupe in der Info-Karte ist fertig (Commit 4810ec9). Die
  Prüfung zeigte einen Altfehler, der schon vor der Lupe bestand:
  - 390 px: Karte (z-index 3 in #hotspots) liegt unter REM-Leiste
    (.sem-bar), Knopfleiste (.bottombar) und Tafel (#panel ab
    ≈ 478 px); placeCard klemmt die Karte „unter dem Abzeichen“
    an die Fensterhöhe, die Tafel deckt sie aber zu. Beispiel
    ?q=3#ebene=5, Abzeichen „Schlitzpore“: Karte 294–836 px
  - 1440 px: REM-Leiste überdeckt den unteren Kartenrand, wenn das
    Abzeichen tief steht (stageRect.y1 = Fußleiste, ohne .sem-bar).
    Beispiel ?q=3#ebene=3, „Gefäß“: Karte 548–821 px
Aufgabe: Info-Karte immer ganz sichtbar, sie überdeckt keine
  Bedienelemente und wird von keinen überdeckt (Zero Overlap):
  - Desktop: .sem-bar in stageRect einrechnen
  - Mobil (≤ 860 px): Lage der Karte neu lösen (z. B. im freien
    Bereich über der Tafel, kleinere Lupe); neue Anordnung erst
    als Vorschau (Skill preview), dann Code
Dateien:
  - web/js/hud.js (placeCard, stageRect, LENS_COL)
  - web/css/biochar.css (.hs-card, .hs-lens, @media ≤ 860 px)
Beachten:
  - Prüfen laut AGENTS.md §5: node tests/science.test.js, je Ebene
    #ebene=1…7 Headless-Chrome per CDP (Muster
    tests/pyro_overlay_check.py), Karte offen, hell + dunkel,
    1440 px und 390 px, Konsole leer; eigene Instanz, nie 8470
  - je Aufnahme eigene URL (?shot=x#ebene=n), sonst kein Neuladen
  - Ebene 3 bei 390 px: kein weißes Abzeichen sichtbar → dort ein
    anderes Abzeichen oder anderen Blick wählen
