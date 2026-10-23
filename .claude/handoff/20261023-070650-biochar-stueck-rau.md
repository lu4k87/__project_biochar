[Claude] [Biochar] Ebene 1: Holzkohle-Stück rau und abgebrochen
übernommen von dev-ws-52 am 2026-10-23 07:18
Rückmeldung an: [Claude] dev-ws-f3

Kontext: Biochar-3D-Seite (~/__project_biochar, Stand 01ca6d2). Ebene 1 = Holzkohle-Stück, Code in web/js/levels/piece.js (560 Zeilen). Start: npm run serve → http://localhost:8470/#ebene=1 (Server des Users auf 8470 nicht anfassen, eigene Test-Instanz auf anderem Port).
Aufgabe: Wunsch des Users wörtlich: „die erste ebene (holzkohle stück) nicht so glatt sondern rauher, und mehr wie ein abgebrochenes stück und nicht so weich/glatt die oberfläche“. Ziel: Oberfläche rau/zerklüftet wie echte Holzkohle (Schwundrisse, Faserkanten, scharfe Bruchflächen statt weich gerundeter Form), Silhouette wie ein abgebrochenes Stück.
Dateien: web/js/levels/piece.js (Geometrie + Material), ggf. web/js/wood.js / web/js/voronoi.js, docs (Modellannahmen) nachziehen.
Beachten: Sichtbarer Umbau → erst Vorschau mit Varianten (Skill preview, je Bereich 3 Varianten, Vorher/Nachher), dann Code. Vorher ListAgents + Lagebild: Übergabe „biochar-pyrolyse-animation“ (dev-ws-14) arbeitet evtl. auch an piece.js → abstimmen, nicht doppelt ändern. Zellwand-Ebene (wall.js) bearbeitet dev-ws-f3 – nicht anfassen.
