[Claude] [Biochar] Ebene 6 Mikroporen: Flackern der Plättchen-Kanten
Rückmeldung an: [Claude] dev-ws-ab
Kontext: Projekt ~/__project_biochar (AGENTS.md lesen), Seite
  `npm run serve` → http://localhost:8470/#ebene=6. Stand 299f637:
  Der REM-Shader web/js/sem.js filtert feine Säume, Fugen, Tüpfel
  und Körnung nach Bildpunktgröße (aaBand/aaRing,
  px = 0.71 · length(fwidth(vWorld))). Dadurch flackern die Ebenen 2/3
  in der Leerlauf-Kamerafahrt kaum noch (Zellen 6628 → 1206
  flackernde Pixel, Gewebe 24409 → 3265). Ebene 6 nutzt eigene Shader
  in web/js/levels/micro.js und flackert unverändert (≈ 1800 Pixel,
  an den Kanten der Graphen-Plättchen); Ebene 7 (atoms.js) ≈ 530.
Aufgabe: Flackern der Ebene 6 in der Leerlauf-Kamerafahrt beheben
  (Wunsch des Users „flackert immer noch“, alle Ebenen). Ursache
  erst messen, dann gleiches Muster wie in sem.js: feine Säume/Muster
  nie schmaler als ≈ 2 px, sondern breiter und schwächer; discard nur
  bei großen Löchern. Look aus der Nähe unverändert. Ebene 7
  mitmessen, bei Auffälligkeit mitbeheben.
Dateien: web/js/levels/micro.js (ggf. levels/atoms.js); sem.js nur lesen.
Beachten: Messskript zum Wiederverwenden (Kopie des Repo-Stands per
  `git archive HEAD web` ins eigene Scratchpad, eigene Ports):
  /tmp/claude-1000/-home-mk-dev-ws/ae04b20d-a9e7-435c-95ae-51e2b8b143f5/scratchpad/flick.py
  Aufruf `flick.py <webdir> <ebene> <q> <tag> [port] [cdp]`: 48 Bilder
  per rAF + toDataURL (preserveDrawingBuffer per
  addScriptToEvaluateOnNewDocument). Flackern = Helligkeit springt
  > 24 hoch und sofort zurück. Ausgabe: Heatmap fl_<tag>_heat.png.
  Vorher/Nachher immer nacheinander messen, nie parallel (GPU).
  Server des Users auf 8470 nicht anfassen. DoD laut AGENTS.md: node
  tests/science.test.js, Konsole hell/dunkel, 1440 + 390 px. Commit
  + Push im Projekt-Repo, diesen Zettel im selben Commit löschen.
