[Claude] [biochar] Optik: Kohle:A, REM:A, Atome:A, Linse:A umsetzen
Rückmeldung an: dev-ws-f9
Kontext: Vorschau 31.10.2026 „Biochar: mehr Detail in Material, Licht
  und Linse“ (Chat dev-ws-f9); Entscheidung des Users aus der Seite:
  F1 Kohle:A, F2 REM:A, F3 Atome:A, F4 Linse:A, dazu der Hinweis
  „bau einen settings tab wie bei kosmos ein (aber nur Globale
  settings)“. Stand 398b8d1: ?dev legt window.__bc an (main.js,
  AGENTS.md §5). Archiv der Vorschau mit allen Bildern:
  ~/ai_dev_workflow_global/__treasury__allprojects/biochar/vorschauen/
  2026-10-31-biochar-mehr-detail-in-material-licht-und-linse/
Aufgabe: die vier gewählten Varianten als neue Standardwerte in den
  Code übernehmen (genau die Werte unten, sie wurden so aufgenommen)
  und im Zahnrad, Reiter Global, eine neue Bento-Karte „Material &
  Optik“ anlegen (wie die Kosmos-Karte „Planeten“: je Wert eine Zeile
  mit Regler, Standard = gewählter Wert, live wirksam); nichts im
  Reiter „Ebene n“. Danach Prüfstufe 2, Commit + Push, Zettel löschen.
Dateien: web/js/levels/piece.js (Materialien Z. 533–540, Lichter
  Z. 682–684, dof/bloom/grain Z. 824–826) · web/js/sem.js
  (Standardwerte uBase/uEdge/uEdgeW/uNoise Z. 280–287; Ebenen mit
  eigenen opts im Verhältnis anpassen) · web/js/levels/atoms.js
  (atomMat/bondMat Z. 292–293, key Z. 277) · web/js/levels/micro.js
  (atomMesh Z. 531, gleiche Richtung) · web/js/main.js (LENS.thr Z. ~60,
  uVig 0.45 Z. 113 + 556) · web/js/settings.js (Gruppen ab Z. 170,
  clean(), localStorage biochar-settings.v1) · AGENTS.md §4
  (settings.js-Zeile) + README.md (Zahnrad-Zeile) · tests/shots_cdp.py
Beachten:
  - Werte der Vorschau (per ?dev live eingespielt, so aufgenommen):
    Kohle:A – matEnd/matA/matB: roughness 0.7, metalness 0.3,
      clearcoat 0.6, clearcoatRoughness 0.35, normalScale 1.5,
      envMapIntensity 1.8; Gegenlicht rim (0xc4d6ff) 2.1 → 4.2
    REM:A – sem.js Standard: base 0.36, edge 0.95, edgeW 0.4, noise 0.55
    Atome:A – atomMat + bondMat als MeshPhysicalMaterial: roughness 0.22,
      metalness 0, clearcoat 1, clearcoatRoughness 0.12,
      envMapIntensity 1.4, envMap = scene.environment; key 1.8 → 2.16
    Linse:A – piece.js dof 5 → 9, bloom 0.12 → 0.2, grain 0.018 → 0.012;
      übrige Ebenen dof ×1.8, grain ×0.67; LENS.thr 0.82 → 0.6;
      Vignette-Standard 0.45 → 0.6
  - Karte „Material & Optik“ (Deutung des Hinweises, im Chat nennen):
    Kohle-Glanz (clearcoat 0–1, Standard 0.6) · Kantenlicht (rim ×1–3,
    Standard 2) · REM-Kanten (edge 0.3–1.2, Standard 0.95) · REM-Korn
    (noise 0.3–1.3, Standard 0.55) · Atome-Klarlack (0–1, Standard 1) ·
    Bloom-Schwelle (0.4–1, Standard 0.6); Änderung → setParam bzw.
    Uniform/Material-Update + lv.dirty = true; clean() prüft jeden Wert
  - Aufnahmen: python3 tests/shots_cdp.py <shots.json> <ordner>
    (eigener Server 8475, CDP 9340, Felder siehe Docstring);
    Vorher/Nachher-Bogen wie Vorschau: Ebene 1 clip [230,150,600,470],
    Ebene 3 [110,90,700,530], Ebene 7 [170,90,620,600],
    query "&dev&seed=7", motion "reduce", css "#hotspots, .caption
    { opacity: 0 !important; }" – Vorher = Stand 398b8d1 (git stash
    nie; stattdessen git worktree oder Archivbilder der Vorschau)
  - Prüfung: npm test · Konsole ohne Fehler je Ebene 1–7 · Hell + Dunkel
    1440 + 390 px · tests/hs_card_check.py · tests/facts_check.py ·
    Server des Users (8470) nicht anfassen, eigene Instanz
  - Danach: gewählte Karte als Baustein ins Repertoire
    (~/ai_dev_workflow_global/repertoire/README.md), Doku nachziehen
    (AGENTS.md §4, README Zahnrad + Ebenen-Tabelle), treasury.py save
