[Claude] [Biochar] Infokarte: Live-Lupe des 3D-Objekts
Rückmeldung an: dev-ws-ac
Kontext: Vorschau entschieden (Schatzkammer biochar/vorschauen/
  2026-10-24-infokarte-mit-3d-objekt-neben-dem-text, Commit a8bb155):
  F2 Objekt:A Live-Ausschnitt der Szene im Kreis · F1 Bildspalte nur
  neben dem Text (Titel bleibt über die ganze Kartenbreite)
Aufgabe: jede Infokarte (hs-card, alle 7 Ebenen, 35 Infopunkte)
  bekommt links neben dem Text einen runden Live-Ausschnitt der
  Szene um den Infopunkt (112 px, Ring 1,5 px var(--accent) +
  5 px var(--accent-soft)), senkrecht mittig zum Text; Text bleibt
  so breit wie heute, die Karte wächst um die Spalte (112 + 14 px)
Plan:
  - hud.js fillCard: <div class="hs-body"><figure class="hs-lens">
    <canvas> + <div class="hs-text"><p>; hud liefert lens() →
    {canvas, id}, solange die Karte offen und nicht is-away ist
  - hud.js placeCard: Spalte in cardW und below einrechnen
    (below, wenn avail < 220 + 126); Klasse is-below → Bild über
    dem Text, mittig (auch im schmalen Fenster ≤ 860 px)
  - CSS: Containerabfrage von .hs-card auf .hs-text verlegen
    (Blocksatz erst ab ≈ 255 px Textbreite, heute 289 px Karte)
  - main.js frame(): eigene Lupen-Kamera blickt aus Richtung der
    Hauptkamera auf h.pos, schwenkt langsam ±25° (reduced-motion:
    still); Bildbreite einmal bei Auswahl aus der Hauptansicht
    (≈ 160 px um den Punkt)
  - Render: lv.scene → lensRT (klein, DepthTexture wie lv.rt),
    dann comp mit tOuter/dOuter = lensRT, DOF 0, Bloom 0 per
    setViewport/setScissor in eine Ecke des Bildschirms, sofort
    drawImage(renderer.domElement) in die Lupe, Uniforms zurück,
    danach normale Zusammenführung (übermalt die Ecke)
  - nur ohne Übergang/Intro, jedes 2. Bild; Stufe „Leicht“:
    einmal rendern, dann Standbild
Dateien:
  - web/js/hud.js
  - web/js/main.js
  - web/css/biochar.css
  - README.md, AGENTS.md (Bedienung, Projekt-Karte)
Beachten:
  - vor dem Start git status: andere Biochar-Chats (dev-ws-7a)
    arbeiten in hud.js/main.js; fremde Hunks nie mitcommitten →
    privater GIT_INDEX_FILE (Memory parallel-chats-merge)
  - Ebene 5 (Raymarching) und 7 (Schattenkarte) mit Lupe prüfen
  - Prüfen laut AGENTS.md §5: node tests/science.test.js, je Ebene
    #ebene=1…7 im Headless-Chrome (Konsole leer), Karte offen,
    hell + dunkel, 1440 px und 390 px; eigene Instanz, nie 8470
  - Aufnahmen: je Aufnahme eigene URL (?shot=x#ebene=4), sonst
    lädt die Seite nicht neu und der 2. Klick schließt die Karte
