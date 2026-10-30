[Claude] [biochar] Bugfix Runde 2: 26 Befunde beheben
Rückmeldung an: dev-ws-18
Kontext: Zweite Fehlersuche (Chat dev-ws-18, 2026-10-30) fand
  26 Fehler in __project_biochar, je Befund von einem zweiten
  Agenten gegengeprüft. Nur Code gelesen, nichts geändert.
  Erste Runde (dev-ws-c2) ist schon behoben, nicht wiederholen.
Aufgabe: alle Befunde unten beheben, erst Rückfälle, dann mittel,
  dann niedrig. Vor jedem Fix die Stelle selbst prüfen (Zeilen
  können verschoben sein). Strittiges (Texte/Fakten) erst fragen.
Beachten:
  - AGENTS.md des Projekts, Prüfungen laut Definition of Done
  - npm test, Konsole ohne Fehler, Hell + Dunkel
  - Server des Users nicht anfassen, eigene Test-Instanz
  - Commit + Push je Gruppe, Zettel im letzten Commit löschen

## Befunde

1. RÜCKFALL · niedrig · web/js/main.js:1037 · biochar: Hash-Wechsel beim Ladebild löst später eine Fahrt aus
   - Fehler: Der hashchange-Handler setzt state.wish = i und ruft goTo(i) auf. Während bootLoad (Programmcode plus bis zu 3 Ebenen, je Ebene bis zu 8 s auf lv.ready) bricht goTo wegen !state.active sofort ab (Zeile 667). state.index ist dann -1, deshalb ist i nie gleich state.index und der Wunsch wird nie gelöscht. activate() setzt state.wish nicht zurück.
   - Folge: Nach der Ankunft startet sofort eine zweite, ungewollte Fahrt zu Ebene 4 (Zeile 785: goTo(state.wish)).
   - Fix: Im hashchange-Handler bei !state.active nur zurückkehren (ohne Wunsch), oder in start() nach activate(lv) state.wish = null setzen.
2. mittel · web/js/quality.js:64 · Qualität schaltet am 60-Hz-Bildschirm nie wieder herauf
   - Fehler: Die Wache schaltet nur herauf, wenn die Bildzeit 15 s lang unter 0,85 × Budget liegt (Budget = 1/60 s, mit Bildraten-Deckel 1/Deckel). Der Bildschirm gibt aber höchstens 60 Bilder/s (bzw. den Deckel) aus. Die gemessene Bildzeit liegt deshalb nie unter dem Budget (r ≈ 1,0), und w.fast wächst nie an. Der Test schaltet nur herauf, weil er 120 Bilder/s annimmt.
   - Folge: Die Stufe bleibt bis zum Neuladen auf Mittel bzw. Leicht. Die Simulation zeigt nach 10 Minuten mit flüssigen 60 Bildern/s immer noch Stufe 1. Auch „Auto“ im Zahnrad nach einer festen Stufe misst nur nach unten. Die Darstellung bleibt also dauerhaft schlechter als nötig.
   - Fix: Spielraum anders messen: Als „Luft“ gelten Bildzeiten bis etwa 1,1 × Budget, solange der Bildschirm im Takt bleibt. Oder die Arbeitszeit je Bild messen (performance.now() am Ende von frame() minus Beginn) statt des Abstands zwischen zwei Bildern. Den Test um einen Fall „60-Hz-Takt nach Absenkung“ ergänzen.
3. mittel · web/js/levels/atoms.js:100 · Holz bei 290–349 °C: falsches Atom gelöscht, Ring B zerbricht
   - Fehler: In Stufe 2 von buildWood soll `atoms.pop()` den Ether-Sauerstoff oe entfernen. Zu diesem Zeitpunkt ist aber das letzte Atom schon rb[5], also ein Kohlenstoff von Ring B, denn ring(cB) wurde nach oe angelegt. Ergebnis: oe bleibt als loses O-Atom ohne Bindung stehen. Die Bindungen rb[4]–rb[5] und rb[5]–rb[0] zeigen danach auf den nächsten neuen Index, und das ist die phenolische OH-Gruppe an Ring A (node-Nachbau: atoms[rb5] = 'O', ungebunden O13, C14 H14 O2 statt C15 … O1).
   - Folge: Ein Kohlenstoff fliegt aus Ring B weg. Zwei lange Bindungsstäbe laufen quer durch das Molekül zum Sauerstoff an Ring A, und ein einzelnes O-Atom schwebt frei. Die Summenformel in der Infotafel zeigt C₁₄H₁₄O₂ statt der beabsichtigten C₁₅H₁₄O₁.
   - Fix: oe in Stufe 2 gar nicht erst anlegen: `const pOe = at(atoms[cb].p, -90, 1.43); const oe = stage < 2 ? add('O', pOe) : -1; const cB = at(at(pOe, -90, 1.36), -90, A);`. Danach `atoms.pop()` und die Schleife in Zeile 101 löschen.
4. mittel · web/js/levels/wall.js:669 · Asche-Glühen und Hyphen-Ast nach Rückkehr auf Ebene 4 kaputt
   - Fehler: Bei einer Pause von mehr als 0,5 s setzt update() die Uhr `age` auf 0 zurück. edxAt (Klick „Asche-Partikel“) und sprout (Klick „Pilzhyphe“) behalten dabei ihren alten Wert. Dadurch wird `age - edxAt` stark negativ, und `exp(-(age-edxAt)/0.45)` in Zeile 558 explodiert. Ab edxAt > 40 s läuft der Float32-Wert über (Infinity, im Shader per mix() sogar NaN). Beim Ast gilt `age < sprout`, also f = 0.
   - Folge: Die Asche-Kristalle leuchten nach der Rückkehr grell weiß, bei NaN schwarz oder fleckig (Bloom kann den Fehler verschmieren). Das hält so viele Sekunden an, wie edxAt groß war. Der zusätzliche Hyphen-Ast verschwindet und taucht später von selbst wieder auf, ohne Klick.
   - Fix: Beim Zurücksetzen auch die Klick-Zeiten löschen: `if (t - lastT > 0.5) { age = 0; sprout = null; edxAt = null; crMesh.material.uniforms.uBase.value = 0.5; nbMesh.visible = false; } else age += t - lastT;`. Zusätzlich den Exponenten begrenzen: `Math.exp(-Math.max(0, age - edxAt) / 0.45)`.
5. mittel · tests/facts_check.py:73 · Kennzahl-Prüfung bleibt grün, wenn die Tafel gar nicht erscheint
   - Fehler: Findet MEASURE kein `.facts` oder wirft es eine Ausnahme, kommt `None` zurück. Das Skript druckt dann nur „keine Kennzahlen“ und macht ohne `bad += 1` weiter. Alle 7 Ebenen haben `facts:` (content.js), ein fehlender Kasten heißt also: die Seite ist kaputt. Zusätzlich wertet Z. 84 nur Runtime.exceptionThrown und Log.entryAdded aus, nicht console.error. main.js fängt Startfehler aber mit `start().catch(err => console.error(err))` ab (Z. 1290).
   - Folge: Für die kaputte Ebene steht „keine Kennzahlen“ in der Ausgabe, der Exit-Code ist trotzdem 0. Die Prüfung meldet grün, obwohl die Seite nicht lädt.
   - Fix: Bei `not m` `bad += 1` zählen. In `errs` zusätzlich `Runtime.consoleAPICalled` mit type 'error' aufnehmen (wie in hs_card_check.py:208). Optional prüfen, dass `is-ready` erreicht wurde.
6. mittel · tests/hs_card_check.py:111 · Karten-Lageprüfung zählt eine nie geöffnete Karte als „nicht sichtbar“
   - Fehler: MEASURE liefert `card: null`, sobald die Karte `is-away` hat oder unsichtbar ist (opacity < 0.05, display none). Ob sie überhaupt `is-open` ist, prüft es nicht. Jedes `null` wird als '--' gewertet und zählt nicht. Eine Karte, die nach dem Klick gar nicht aufgeht, ist so nicht von „Abzeichen gerade außer Sicht“ zu unterscheiden.
   - Folge: Jede Zeile zeigt '--', Überlappungen 0, Exit-Code 0. Die Prüfung ist grün, obwohl keine Karte mehr aufgeht.
   - Fix: In MEASURE `open: card.classList.contains('is-open')` und `away` getrennt zurückgeben. Ist die Karte nicht offen, als BAD zählen. Nur `is-away` darf '--' bleiben.
7. mittel · web/js/hud.js:592 · Ebene 6 zeigt Kohle-Spektren (XRD, Raman, La) auch für rohes Holz
   - Fehler: spectraBlock(shown) und updateSpectra laufen in Ebene 6 bei jeder Temperatur. nanoStructure klemmt T unter 350 °C auf k = 0, deshalb zeigt die Tafel bei 25–345 °C dieselben Werte wie bei Kohle aus 350 °C: (002)-Peak mit d002 0,40 nm, 2θ 22,2°, Lc 0,5 nm sowie I_D/I_G 0,32 aus La 0,8 nm. Dasselbe gilt für die Statuszeile der Karte (hud.js:451, current >= 5: „La ≈ 0,8 nm“) in den Ebenen 6 und 7.
   - Folge: Das Bild zeigt Zellulose-Fibrillen, und das Abzeichen sagt selbst „Graphen-Stapel entstehen ab ≈ 345 °C“ (hud.js:186). Die virtuelle Messung zeigt trotzdem Graphen-Stapel und eine D-Bande, die es im Holz nicht gibt. Sie widerspricht damit der eigenen Ebene.
   - Fix: Unter T_MIN (oder gewichtet mit pyroState(T).sheets) die Spektren ausblenden bzw. den Hinweis „Holz: keine Graphenschichten, kein (002)/D-Signal“ zeigen. Alternativ die Amplituden von (002) und D in xrdCurve/ramanCurve mit sheets skalieren. La in cardStatusHtml erst ab T_MIN anzeigen.
8. mittel · web/js/levels/piece.js:847 · Wassertropfen versickert 6- bis 8-mal schneller als angegeben
   - Fehler: Jedes Bild zieht dt·10 µl / WDPT(θ) ab, und WDPT wird mit dem aktuellen, schon kleineren Winkel neu gerechnet. dropPenetration liefert aber die gesamte Eindringzeit beim Startwinkel (Doerr 1998). Weil θ beim Versickern sinkt, wird die Rate doppelt beschleunigt. Nachgerechnet: θ0 = 60° ergibt WDPT 26 s, der Tropfen ist aber nach ≈ 4 s weg; 75° ergibt 309 s statt ≈ 40 s; 85° ergibt 1586 s statt ≈ 207 s.
   - Folge: Der Tropfen ist nach etwa 4 s verschwunden, obwohl der Hinweistext 26 s nennt. Auch die Einordnung nach Doerr-Klasse passt nicht mehr zum Gesehenen. Der Kommentar in Z. 760 verspricht „versickert in der Eindringzeit“.
   - Fix: Die Eindringzeit beim Auftropfen einmal festhalten (drop.pen0 = dropPenetration(θ0).s) und mit konstanter Rate dv = dt·DROP_UL/pen0 abziehen. θ darf dabei weiter optisch sinken. Bei einem Temperaturwechsel pen0 neu setzen.
9. mittel · web/js/levels/cells.js:205 · Pilzhyphe bleibt nach Rückkehr lange unsichtbar
   - Fehler: update() setzt die Uhr age nach einer Pause von über 0,5 s auf 0 zurück (gewollt: Zeitraffer beginnt bei der Ankunft neu). hyStart wird dabei nicht zurückgesetzt. Hat der Nutzer vorher auf „Pilzhyphe“ geklickt oder „Wachstum neu starten“ gedrückt, gilt hyStart = alter age-Wert (z. B. 60 s). growHypha rechnet dann f = (age − hyStart)·… ≤ 0.
   - Folge: Die Hyphe ist nach der Rückkehr so viele Sekunden lang nicht zu sehen, wie age beim Klick betrug (hier ≈ 60 s), erst dann wächst sie. Das Abzeichen „Pilzhyphe“ zeigt währenddessen auf leere Luft.
   - Fix: Beim Zurücksetzen der Uhr auch das Wachstum zurücksetzen: if (t − lastClock > 0.5) { age = 0; hyStart = 0.4; hyF = −1; }.
10. mittel · web/js/hud.js:1376 · Endwert des Maßstab-Lineals zeigt 2 statt 1,5 (µm, nm, mm, cm)
   - Fehler: rulerEnd.textContent = formatLength(n * step) ruft formatLength ohne approx auf, also mit 0 Nachkommastellen. Liegt n·step bei 1,5 einer Einheit (Teilung 0,5 und 3 Hauptstriche), rundet fmt(1.5, 0) auf „2“.
   - Folge: Der letzte Hauptstrich steht bei 1,5 Einheiten, beschriftet ist er mit „2 …“. Der Maßstab ist dann um 33 % falsch, und das mitten in der REM-Datenleiste.
   - Fix: Im Lineal nicht runden, sondern höchstens eine Nachkommastelle zeigen, z. B. in formatLength: fmt(v, Number.isInteger(v) ? 0 : 1), oder formatLength(n * step, false) mit einer Stelle, wenn v < 10.
11. mittel · web/js/hud.js:172 · Temperaturfenster in HS_TEMP passen nicht zur Sichtbarkeit in den Ebenen
   - Fehler: Ob ein Merkmal aktiv ist, entscheiden Chip, Statuszeile der Karte und Gleitsprung-Knopf nach den festen Grenzen in HS_TEMP. Die Abzeichen in der Szene folgen dagegen der Logik der jeweiligen Ebene, und die schaltet später um. Ebene 1 Schwundrisse: HS_TEMP min 380, piece.js zeigt sie erst ab open > 0,12, also ≈ 427 °C. Ebene 5 (Riss, Schlitzpore, Rennen, Wasser): HS_TEMP min 340, meso.js zeigt sie erst ab pyroState.open ≥ 0,5, also 350 °C. Ebene 6 (Stapel, Mikropore, Gas): HS_TEMP min 345, micro.js zeigt sie erst ab sheets ≥ 0,6, also ≈ 357 °C. Kleiner auch umgekehrt: Ebene 4 Mikroriss ist schon ab ≈ 303 °C sichtbar (HS_TEMP 310), Fibrille bis 369 °C (HS_TEMP 365).
   - Folge: Der Chip ist nicht gedimmt, die Karte meldet „● Aktiv (ab 380 °C)“. In der Szene gibt es aber kein Abzeichen, die Kamera schwenkt nicht, die Karte steht oben rechts, und der Knopf für den Gleitsprung fehlt. Der Nutzer findet das angeblich aktive Merkmal nicht.
   - Fix: Die Grenzen angleichen (cracks min ≈ 430, meso-Gruppe min 350, micro stack/micropore/gas min ≈ 360, wall crack min ≈ 305, fibril max ≈ 369; Badges und content-Tag „≥ 380 °C“ mitziehen). Besser: isHsOffAt nutzt für Hotspots mit Meta zusätzlich h.hidden bzw. normal=0 der Ebene.
12. mittel · web/js/content.js:193 · Größenvergleich „2 nm ≈ Glucose-Ring“ ist etwa 4-fach zu klein
   - Fehler: Ein Glucosering ist ≈ 0,5 nm groß. Das Projekt sagt das selbst: „zwei je 1,04 nm“ (content.js:185, Nishiyama 2002, docs/research.md). 2 nm Bildbreite sind also ≈ 4 Glucose-Ringe und nicht ≈ einer.
   - Folge: Der Vergleich ist prominent sichtbar falsch und widerspricht der Fibrillen-Karte auf Ebene 6.
   - Fix: compare auf '≈ 4 Glucose-Ringe' ändern (wie '≈ 4× DNA-Helix' auf Ebene 6).
13. niedrig · web/js/main.js:398 · Lupe ignoriert Licht-Einstellungen des Zahnrads
   - Fehler: Das Hauptbild rendert in render() zwischen lightUp(lv) und lightDown(lv): Lichtstärke, Haupt-/Gegenlicht, Umgebung, Farbtemperatur und weiche Schatten. renderLoupe() ruft dagegen renderer.render(lv.scene, c) ohne lightUp/lightDown auf. Die Lupe zeigt also immer die Lichter im gebauten Zustand.
   - Folge: Das Hauptbild ist dunkel bzw. warm. Die Lupe daneben zeigt denselben Punkt hell und neutral. Der Ausschnitt passt sichtbar nicht zur Szene.
   - Fix: In renderLoupe den Aufruf einrahmen: const lit = lightUp(lv); renderer.render(lv.scene, c); if (lit) lightDown(lv);
14. niedrig · web/js/main.js:562 · Auto-Orbit lässt sich im Zahnrad nicht wieder einschalten
   - Fehler: settings.on schaltet controls.autoRotate nur aus (wenn still || !S.orbit). Einen Zweig zum Einschalten gibt es nicht. autoRotate wird nur in activate() aus lv.orbit.autoRotate gesetzt, also erst beim nächsten Ebenenwechsel.
   - Folge: Der Schalter steht auf „an“, das Stück dreht sich aber nicht mehr, bis der Nutzer die Ebene wechselt. Für den Nutzer wirkt der Schalter wirkungslos.
   - Fix: In settings.on ergänzen: if (state.controls && state.active && keys && (keys.includes('orbit') || keys.includes('motion'))) state.controls.autoRotate = !still && S.orbit && !!state.active.orbit.autoRotate;
15. niedrig · web/js/levels/atoms.js:605 · Schattenkarte der Ebene 7 wird beim Entladen nie freigegeben
   - Fehler: dispose() gibt Geometrien und Materialien frei, aber nicht das Hauptlicht `key` mit castShadow. Dessen RenderTarget key.shadow.map (bis 1024² Farbe + Tiefe) gibt erst DirectionalLight.dispose() bzw. key.shadow.dispose() frei. main.js activate() ruft nur lv.dispose() und lv.rt.dispose() auf und durchläuft die Szene nicht.
   - Folge: Je Hin- und Rückweg bleibt eine Schattenkarte (≈ 2–8 MB) im Grafikspeicher. three.js zählt sie weiter in renderer.info.memory.textures. Freigegeben wird sie höchstens, wenn der Browser die WebGL-Objekte irgendwann per Garbage Collection einsammelt.
   - Fix: In dispose() zusätzlich `key.dispose(); rim.dispose();` aufrufen (gibt shadow.map frei). Am besten auch die InstancedMeshes freigeben: `for (const m of [atomMesh, cloudMesh, bondMesh, piMesh]) m.dispose();`.
16. niedrig · web/js/levels/micro.js:803 · Instanzpuffer der Ebene 6 bleiben nach dem Entladen liegen
   - Fehler: dispose() gibt die Geometrien und Materialien frei, ruft aber für keines der InstancedMeshes (glcMesh, bondMesh, sideMesh mit je ≈ 3700 Instanzen, hemiMesh, ligMesh, lines/fill, atomMesh) `.dispose()` auf. Nur das löscht in three.js r170 die GPU-Puffer von instanceMatrix und instanceColor (WebGLObjects onInstancedMeshDispose). geometry.dispose() erfasst diese Puffer nicht. Dasselbe Muster gibt es in meso.js (molMesh), atoms.js und in walls.js disposeGroup (wall.js: bacMesh, strandMesh, spMesh, crMesh).
   - Folge: Pro Besuch bleiben etwa 1 MB Instanzpuffer im Grafikspeicher, bis der Browser sie per Garbage Collection einsammelt. Sichtbar nur bei langem Ausstellungsbetrieb (?tour).
   - Fix: In dispose() `for (const m of [glcMesh, bondMesh, sideMesh, hemiMesh, ligMesh, lines, fill, atomMesh]) m.dispose();` ergänzen. In walls.js disposeGroup zusätzlich `if (o.isInstancedMesh) o.dispose();`.
17. niedrig · tests/hs_card_check.py:10 · Fester CDP-Port 9334 und gemeinsamer Server 8471 bei Parallelläufen
   - Fehler: hs_card_check.py und pyro_levels_check.py (Z. 12) nutzen beide den fest eingetragenen CDP-Port 9334, ohne Umgebungsvariable zum Umstellen. Alle vier Skripte teilen außerdem Port 8471: Ein laufender Server wird mitbenutzt, aber das Skript, das ihn gestartet hat, beendet ihn am Ende (`server.terminate()`).
   - Folge: Das zweite Chrome kann den Debug-Port nicht belegen. Das zweite Skript holt sich die Seite des ersten Browsers und steuert sie mit, beide Läufe liefern Unsinn. Bzw. der übrig gebliebene Lauf verliert mitten drin den Server und meldet Ladefehler.
   - Fix: CDP wie in kosmos per Umgebung einstellbar machen und je Skript eindeutig setzen (z. B. 9333/9334/9335/9336). Den Server nur beenden, wenn kein anderer Lauf ihn nutzt, oder je Skript einen eigenen Port verwenden (BIOCHAR_TEST_PORT je Skript verschieden vorbelegen).
18. niedrig · web/js/levels/piece.js:548 · Riss-Texturen der Ebene 1 werden beim Entladen nie freigegeben
   - Fehler: Die drei CanvasTextures in crackTex (1024×1024 und 2× 1024×512, mit Mipmaps ≈ 11 MB) hängen nur in sh.uniforms.uCrackMap (onBeforeCompile). Nach dispose() ruft piece.js disposeGroup (walls.js:134) auf, und das gibt nur Texturen frei, die als Eigenschaft am Material stehen (Object.values(mat)), keine Shader-Uniforms. Ein texture.dispose() für crackTex gibt es nirgends.
   - Folge: Bei jedem Neuaufbau bleiben ≈ 11 MB Grafikspeicher liegen, bis der Garbage Collector die WebGL-Objekte irgendwann zufällig einsammelt. renderer.info.memory.textures steigt bei jedem Hin- und Rückflug.
   - Fix: In piece.js dispose() zusätzlich crackTex.forEach((t) => t.dispose()) aufrufen. Alternativ in disposeGroup auch mat.userData bzw. bekannte Uniform-Texturen durchgehen.
19. niedrig · web/js/hud.js:232 · Kachel „CO₂ gebunden“ nennt „C × 3,67“, rechnet aber mit Fperm
   - Fehler: Der Wert ist p.co2 = C × Fperm × 44/12 (science.js:55). Das Unteretikett der Kachel lautet aber „C × 3,67“ und lässt den IPCC-Faktor Fperm weg.
   - Folge: Wer nachrechnet, erhält 0,9 × 3,67 = 3,3 t/t statt der angezeigten 2,9 t/t. Etikett und Zahl widersprechen sich (erklärt nur im aufgeklappten LAB_NOTE).
   - Fix: Etikett auf „C × Fperm × 3,67“ oder kurz „IPCC · ×44/12“ ändern.
20. niedrig · web/js/levels/ground.js:20 · Rückkehr zu Ebene 1: Waldboden neu gewürfelt und erst kahl
   - Fehler: create() in piece.js (Z. 353) ruft bei jedem Aufbau groundTextures() auf. Dort wird ohne ?seed jedes Mal ein neuer Zufalls-Seed gezogen. Beim Start wartet bootLoad auf lv.ready, bei einem späteren Neuaufbau über goTo/buildLevel wartet niemand. Blätter bleiben bis zum Eintreffen der Texturen unsichtbar (mesh.visible = false, Z. 225), der Boden zeigt nur die Grundfarbe.
   - Folge: Ästchen, Krümel und Wurzeln liegen an anderen Stellen als vorher (anderer Seed, neue Konsolenzeile [boden] seed=…). Während der Rückfahrt und 2–5 s danach fehlen Laub und Bodentextur, dann blenden sie auf. Die Szene sieht bei jedem Besuch anders aus.
   - Fix: Seed einmal je Seitenladung auf Modulebene festlegen (const SEED = … außerhalb von groundTextures). Optional Ebene 1 vor der Fahrt nach oben vorladen bzw. in goTo auf lv.ready warten (mit Zeitlimit wie in bootLoad).
21. niedrig · web/js/levels/piece.js:888 · Kontaktschatten der Kohlekrümel sind auch ohne Krümel sichtbar
   - Fehler: Die Krümel und der Staub (fallout) werden nur bei st.char > 0.8 eingeblendet (Kommentar: „entstehen erst beim Verkohlen“). Ihre Kontaktschatten liegen in einem eigenen blobMesh (Z. 665–668). Das steht nicht in fallout und bleibt immer sichtbar.
   - Folge: Rund 48 dunkle, weiche Flecken liegen auf dem Waldboden, obwohl dort (noch) keine Krümel liegen. Im Holzzustand zeigen sie Schatten von Dingen, die es nicht gibt.
   - Fix: blobMesh in fallout aufnehmen (fallout.push(blobMesh)) oder seine Sichtbarkeit bzw. Deckkraft im setParam('temp') an st.char koppeln.
22. niedrig · web/js/hud.js:403 · Gespeicherte Lage der Zeitleiste wird beim Laden nicht begrenzt
   - Fehler: moveTl berechnet den Standardplatz als r.left − tlOff.x. Beim ersten Aufruf (erste Meldung des ResizeObserver, Z. 436) ist tl.style.translate aber noch leer, während tlOff schon den Wert aus localStorage hat. Dadurch verschiebt sich der Klemmbereich genau um den gespeicherten Versatz, und dieser Versatz besteht die Prüfung immer, egal wie groß das Fenster jetzt ist.
   - Folge: Die Zeitleiste steht beim Start um den alten Versatz verschoben: über der Infotafel oder teils außerhalb des Fensters. Auch der Knopf ⟲ und der Griff können dann außerhalb liegen. Erst eine spätere Größenänderung der Fußleiste korrigiert die Lage.
   - Fix: Den Standardplatz aus dem tatsächlich angewendeten Versatz berechnen: in einer eigenen Variablen merken, was in tl.style.translate steht (anfangs 0), und l = r.left − applied.x, t = r.top − applied.y. Zusätzlich die geladenen Werte mit Number.isFinite prüfen.
23. niedrig · web/js/content.js:146 · Vergleiche „300 nm ≈ Grippevirus“ und „25 µm ≈ Blutzelle“ ≈ 3-fach daneben
   - Fehler: Grippeviren sind meist 80–120 nm groß, 300 nm entsprechen also ≈ 3 Viren. Rote Blutkörperchen messen 7–8 µm, also passen ≈ 3 in 25 µm (content.js:120). Beide Angaben stehen ohne Faktor und ohne Quelle.
   - Folge: Zwei Alltagsvergleiche sind um etwa das Dreifache zu groß.
   - Fix: In '≈ 3× Grippevirus' und '≈ 3 rote Blutkörperchen' ändern (oder eine passende Größe wählen) und die Werte in SOURCES/research.md belegen.
24. niedrig · web/js/hud.js:201 · Per Zahnrad abgeschaltetes Merkmal heißt „Bei anderer Temperatur sichtbar“
   - Fehler: Für Hotspots ohne HS_TEMP-Eintrag wertet isHsOffAt jedes h.hidden als temperaturbedingt. h.hidden setzen aber auch die Ebenen-Schalter: cells.js:223 Pilzhyphe, tissue.js:291 Kapillar-Aufstieg, wall.js:633 Bakterien/Hyphe/Sporen. cardStatusHtml (Z. 453) gibt dann den festen Text aus.
   - Folge: Der Chip wird gestrichelt als zeitlich gesperrt markiert, und die Karte meldet „◐ Bei anderer Temperatur sichtbar“. Eine andere Temperatur bringt das Merkmal aber nicht zurück, nur der Schalter.
   - Fix: Abschalten über einen Schalter getrennt markieren (z. B. h.off = true statt h.hidden) oder in isHsOffAt/cardStatusHtml einen eigenen Text „im Zahnrad ausgeschaltet“ zeigen.
25. niedrig · web/css/biochar.css:795 · Unsichtbare Abzeichen bleiben per Tab erreichbar
   - Fehler: Ausgeblendete Hotspots (temperaturbedingt, von hinten gesehen, außerhalb des Bilds, während eines Übergangs) bekommen nur .is-off bzw. .hotspots.is-hidden. Das setzt opacity 0 und pointer-events none, aber weder visibility:hidden noch tabindex=-1 oder aria-hidden (hud.js:1292).
   - Folge: Der Fokus landet auf unsichtbaren Knöpfen (Fokusring nicht zu sehen), Screenreader lesen nicht vorhandene Merkmale vor. Enter öffnet deren Karte oder taucht über ein unsichtbares Abzeichen ab.
   - Fix: In updateMarkers bei !visible zusätzlich el.tabIndex = dot.tabIndex = -1 und aria-hidden setzen (bzw. .is-off um visibility:hidden mit Übergangsverzögerung ergänzen), dasselbe für .hotspots.is-hidden.
26. niedrig · web/js/levels/ground.js:321 · Bodentexturen blenden bei Bewegung „Aus“ trotzdem 1,2 s ein
   - Fehler: Die Einblende-Animation fragt nur die System-Einstellung `reduced` ab (Z. 15, Z. 321: `fade = reduced ? 1 : 0`). Die Grundstufe „Aus“ im Zahnrad (settings.S.motion === 'off') fehlt in der Abfrage. Laut AGENTS.md wirkt „Aus“ wie reduced-motion, und piece.js prüft es selbst über isStill() so.
   - Folge: Bodentextur, Blätter und Blattschatten blenden über 1,2 s weich ein, obwohl der Nutzer Bewegung abgeschaltet hat.
   - Fix: `fade = (reduced || settings.S.motion === 'off') ? 1 : 0` (settings importieren) oder isStill aus piece.js als Parameter an makeGround übergeben.
