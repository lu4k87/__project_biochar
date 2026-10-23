# Recherche: Struktur von Pflanzenkohle (Stand 2026-10-22)

Grundlage für Texte und Modelle der Seite. Zahlen mit Quelle; alles andere ist als Modell oder Richtwert gekennzeichnet.

## Kennzahlen mit Quelle

| Aussage | Wert | Quelle |
|---|---|---|
| Porenklassen | Mikro < 2 nm · Meso 2–50 nm · Makro > 50 nm | Thommes et al. 2015 (IUPAC) |
| Holzanatomie bleibt erhalten, Porenanteil Buchen-Biochar (500 °C) | 47,6 ± 5,9 % des Querschnitts; Frühholz 61,8 %, Spätholz 40,2 % | Prommer et al. 2014, PLoS ONE 9:e86388 |
| Gefäßdurchmesser Buchen-Biochar | Frühholz 24 ± 12 µm, Spätholz 15 ± 9 µm | Prommer et al. 2014 |
| Maxima der Porengrößen (REM) | ≈ 0,7 µm (einfache Tüpfel), ≈ 3 µm (Hoftüpfel, Parenchym), 15–25 µm (Gefäße) | Prommer et al. 2014 |
| Größen im Boden | Bakterien 0,6–0,8 µm, Pilze 1,2–4 µm, Mykorrhiza-Hyphen 2–20 µm | Prommer et al. 2014 |
| Organischer C, Holz-Pyrolyse | Fc = 0,77 ± 42 % | IPCC 2019 Refinement, Tab. 4Ap.1 |
| Anteil C nach 100 Jahren | 0,65 (350–450 °C) · 0,80 (450–600 °C) · 0,89 (> 600 °C) | IPCC 2019 Refinement, Tab. 4Ap.2 |
| Grenzwerte zertifizierte Pflanzenkohle | H/Corg < 0,7 · O/Corg < 0,4 | EBC-Richtlinien |
| Kategorien nach Temperatur | Übergangs-, amorphe, Komposit-, turbostratische Kohle | Keiluweit et al. 2010 |
| Clustergröße (¹³C-NMR) | ≈ 10 C bei 450 °C, ≈ 25 C bei 600 °C | AIChE 2010, Paper 490f (Tagungsbeitrag) |
| Holzkohle bleibt nicht-graphitierend | – | Franklin 1951 |
| Redoxaktive Gruppen | Biochar nimmt Elektronen auf und gibt sie ab | Klüpfel et al. 2014 |
| Kelvin-Gleichung (Wasser, 25 °C) | 2γVm/(RT) = 1,05 nm → 50 % rF ≈ 4 nm, 90 % ≈ 21 nm, 99 % ≈ 210 nm | Physikalische Chemie, eigene Rechnung |

## Richtwerte und Modellannahmen (nicht als Messwert lesen)
- **Temperaturtabelle** in `web/js/science.js` (Ausbeute, C, H/C, O/C, BET, pH): typische Verläufe für Holz bei langsamer Pyrolyse, zusammengestellt aus Übersichtsliteratur (Lehmann & Joseph 2015; Xiao et al. 2016). Reale Kohlen streuen stark.
- **Kategoriegrenzen** nach Keiluweit et al. 2010 auf 450 °C und 650 °C gerundet.
- **Ebene 5:** Porennetz = hierarchisches 3D-Voronoi (Zellen 60 nm und 11 nm) – Form ähnlich FIB-REM-Rekonstruktionen, keine Messung.
- **Ebene 6:** Schichtgröße 0,6–1,6 nm, 1–3 Schichten, Abstand 0,40 → 0,36 nm; XRD-Werte für La können größer ausfallen als NMR-Clustergrößen.
- **Ebene 7:** eben, ohne Fünf-/Siebenring-Defekte (Harris-Modell gekrümmter Schichten nur im Text erwähnt), Sauerstoffgruppen gleichmäßig verteilt.

### Detailstufe 2026-10-23 (Modelle, keine Messwerte)
- **Ebene 1 (Stück):** Gefäße auf der Stirnfläche in echter Größe (Ø 24 ± 12 µm Frühholz, 15 ± 9 µm Spätholz nach Prommer et al. 2014) bei ≈ 120 Gefäßen je mm² – Richtwert in der Größenordnung, die Holzanatomie-Atlanten für zerstreutporige Buche nennen; bei ≈ 11 µm je Texturpixel sind sie nur aus der Nähe als Körnung sichtbar, wie unter der Lupe. Jahrringbreite im Modell ≈ 2,6 mm. Faserriefen, angeschnittene Gefäße (0,3–1 mm lange Rinnen) und Strahl-Spiegel auf den Längsflächen, muschelige Bruchflächen an den Abplatzern, Krümel 0,2–3 mm, Staub 80–300 µm. Form (Wahl des Users 2026-10-23): längs gespaltener Splitter mit Keil-Querschnitt, faseriger Spaltfläche und zerfasertem Bruchende; Würfelrisse aus der Schwindung als Geometrie (quer zur Faser, längs entlang der Holzstrahlen, ein Ringriss; Öffnung ≈ 0,5 mm, Tiefe ≈ 1,6 mm, Blöcke ≈ 0,2 mm versetzt) – Modell, Maße geschätzt.
- **Ebene 2 (Gewebe):** Bruchfläche mit Terrassen (Stufen ≈ 1,2 µm) und Höhenunterschieden bis ≈ 12 µm, einzelne eingebrochene Zellen. Durchbrechungsplatten: einfache (Ringleiste) in weiten Gefäßen, leiterförmige (4–7 Sprossen) in engen Spätholzgefäßen – Buche hat beide Typen; Lage und Neigung im Modell zufällig.
- **Ebene 2/3 (Wände):** Mittellamelle als ≈ 0,3 µm breite helle Fuge in der Schnittfläche, im Zellzwickel verbreitert. Fasertüpfel als kleine behöfte Tüpfel (Hof Ø ≈ 2,4 µm) mit schrägem Schlitz (≈ 45°, folgt dem Fibrillenwinkel).
- **Ebene 3 (Zellen):** Thyllen (blasige Auswüchse der Parenchymzellen ins Gefäß) in zwei Gefäßen; bei Buche typisch für den Rotkern, nicht für jedes Stück. Gezahnte Bruchkante: Faserbündel brechen verschieden lang (Sägezahn ≈ 34 µm).
- **Ebene 4 (Zellwand):** Mikrofibrillen-Riefen der innersten Wandschicht (S3) als flache Spirale ≈ 75° zur Zellachse im Abstand von ≈ 0,2 µm; feine Körnung (Ø 0,15–0,3 µm) als Andeutung einer Warzenschicht – für Buche nicht belegt, daher schwach. Tüpfelkammer linsenförmig mit gekreuztem Gegenporus. Bakterien (0,7 µm dick) auch als Ketten, darüber ein Biofilm-Schleier aus extrazellulären Polymeren mit Haftfäden; Pilzsporen ≈ 2–3 µm. Asche: Calcium liegt im Holz u. a. als Calciumoxalat vor (Kristallform u. a. sechseckige Plättchen); beim Verkohlen zerfällt es ab ≈ 400–500 °C zu Calciumcarbonat und behält dabei die Form (Pseudomorphose), ab ≈ 700 °C entsteht CaO (thermischer Abbau von Calciumoxalat, Lehrbuchwerte). Bewegung und Farbe (Modell, keine Messung): gedämpfte Falschfarben wie bei eingefärbten REM-Bildern (Bakterien grünlich, Pilz ocker, Asche bläulich, Wand grau); Wasserteilchen, die zu den Tüpfeln treiben, sind ein Sinnbild und nicht maßstäblich; Hyphenwachstum und Sporenreifung laufen im Zeitraffer (≈ 22 s Ast, danach Sporen); Rissbreite und Kristallgröße wachsen linear mit der Pyrolysetemperatur (350 °C: Risse ×0,56, Kristalle ×0,78 · 800 °C: ×1,56 bzw. ×1,28, bezogen auf 550 °C) – Richtung belegt (stärkerer Schwund, mehr Asche bei höherer Temperatur), Stärke nicht.
- **Ebene 5 (Nanoporen):** Knoten-und-Streben-Gitter: an den Kanten der großen Voronoi-Zellen verdickte Plateau-Ränder (Streben Ø ≈ 11 nm), an den Ecken Knoten (≈ 19 nm), dazwischen dünne Wände (≈ 10 nm) nur in der Tiefe; Wandporen jetzt ≈ 2–6 nm (Zellen 7,5 nm statt 11 nm). Optik nach REM-Aufnahmen offenporiger Gerüste, keine Messung.
- **Ebene 6 (Mikroporen):** Schichten als Platten mit ≈ 0,14 nm Dicke (Atomdurchmesser), Randatome als Buckel im Abstand ≈ 0,25 nm, etwa jede zweite gekrümmte Schicht trägt in der Mitte einen Fünfring (Schale) bzw. Siebenring (Sattel) – Ursache der Krümmung im Harris-Modell; mehr Schichten im Volumen (Dichte ≈ +35 %).
- **Ebene 7 (Atome):** Elektronenwolke als weiche Hülle mit dem van-der-Waals-Radius (C 1,70 Å, O 1,52 Å, H 1,20 Å, K 2,75 Å; Bondi 1964), Bindungen als Halbkegel in den Farben der Atome, π-Elektronen über/unter den Ringen nur angedeutet.
- **Bildsprache (keine Wissenschaft):** Tiefenunschärfe, Bloom, Farbsaum, Grading und bewegtes Licht dienen der Wirkung. In den REM-Ebenen bleibt die Unschärfe gering, weil Rasterelektronenmikroskope eine große Schärfentiefe haben.

## Weitere Vorlagen und Aufnahmen (zum Nachsehen, nicht ins Repo kopieren)
- Prommer et al. 2014, Abb. 2: Porengrößenverteilung aus 7 715 vermessenen Poren, mit Größen von Bakterien, Pilzen, Protozoen, Nematoden – https://pmc.ncbi.nlm.nih.gov/articles/PMC3907405/
- Biochar-Journal 2021 (Pellet-Biochar aus Nadelholz): Poren 1–100 µm aus Zellstrukturen als Lebensraum für Mikroorganismen – https://journal.hep.com.cn/bch/EN/10.1007/s42773-021-00104-3
- MDPI C 10/3/77: REM von Hyphen in Poren holziger Biochars nach 56 Tagen im Boden – https://www.mdpi.com/2311-5629/10/3/77
- Biochar-Journal 2025 (s42773-025-00549-w): fraktale Porenmodelle, Sägemehl-Biochar 300–1000 °C – https://link.springer.com/article/10.1007/s42773-025-00549-w
- US-Patente „Biochars and biochar treatment processes“: REM-Bilder von Kiefer-, Birken- und Kokosschalen-Biochar, Übergang Makro → Meso → Mikro entlang einer Pore – https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10252951
- Keiluweit et al. 2010 (Volltext frei): https://escholarship.org/uc/item/177491q3
- IPCC 2019 Refinement, Anhang 4 Biochar: https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch02_Ap4_Biochar.pdf

## Pyrolyse-Labor in den Ebenen (Modellannahmen, 2026-10-23)
- **Stück:** Im Holzzustand ist die Oberfläche nur leicht rau (Faserriefen, Jahrring-Relief, Gefäße), ohne Schwundrisse. Risse, Blockversatz und Risslinien öffnen sich mit der Schwindung quer zur Faser (`pyroState.shrinkT`): sichtbar ab ≈ 260 °C, voll offen ab ≈ 580 °C; Risstiefe ≤ 1,1 mm, Öffnung ≤ 0,5 mm (Richtwerte, Modell). Physikalischer Hintergrund: Schwindung quer zur Faser ist deutlich größer als längs, die Spannung reißt das Gewebe in Würfelmuster auf – Größen sind nicht gemessen.
- **Gewebe/Zellen:** Schwindung relativ zum Ausgangsbild bei 550 °C aus `pyroState` (quer ≤ 28 %, längs ≤ 10 %, Modell); Wanddicke folgt dem Masseverlust, Anteil ≈ 12 % (Richtwert, `tissueScale` in `science.js`).
- **Zellen:** Stärkekörner (Ø ≈ 4–8 µm, Modell) in den Strahlzellen verschwinden 220–330 °C (`pyroState.starch`, Fenster der Hemizellulose nach Yang et al. 2007); Wände werden glatt-glasig (weniger Körnung, hellere Kanten, `glassy` 300–450 °C); Thyllen bleiben (in Holzkohle erhalten) und schrumpfen mit.
- **Zellwand:** Mikrorisse schließen sich unter 350 °C ganz (ab 250 °C), Asche-Kristalle wachsen mit T (Modell). Tüpfelmembran (Zellulose/Pektin) schließt im Holz die Kammer, zerfällt 240–360 °C (`membrane`, Modell); Mikrofibrillen-Riefen der S3-Schicht verblassen mit der Zellulose 315–400 °C (`fibril`); Nanoporen der Bruchfläche erscheinen 300–400 °C (`sheets`).
- **Nanoporen:** Im Holz ist die Wand dicht (Abstandsfeld um 3,2 Einheiten aufgeblasen), Relief der Mikrofibrillen-Bündel ≈ 20 nm (Fernandes et al. 2011); das Porennetz öffnet sich 260–380 °C (`open`, Modell). Danach folgt die Wandstärke zwischen den kleinen Poren der BET-Fläche (5 → 390 m²/g, Tabelle `science.js`): heißer = mehr offene Poren. Wasserfilm mit Kapillarwellen und Glitzerpunkten ist Darstellung, keine Messgröße.
- **Mikroporen:** feste Stammliste der Stapel; Größe, Schichtzahl, d002 und Krümmung gleiten mit `nanoStructure(T)`. Aromatische Schichten entstehen zwischen 300 und 400 °C (`sheets`, Modell, vgl. Keiluweit et al. 2010: amorphe Kohle ≈ 350–400 °C). Holz: Zellulose-Mikrofibrillen Ø 3,5 nm (Fernandes et al. 2011) als wellige Stäbe, dünner und blasser 315–400 °C (`fibril`); Matrix-Kettenstücke 220–380 °C (`matrix`). CO₂/N₂/H₂O: Physisorption als Modell – Anziehung ab 1 nm, Anlagerung 0,33 nm über der Schicht, Verweilzeit 1,5–5 s × (1 − 0,6·k), danach Desorption; das markierte CO₂ sitzt in der Mikropore. Austretende CO₂-/H₂O-Moleküle: ein Molekül je 12 °C Aufheizung (nur Darstellung).
- **Atome:** Unter 350 °C Lignin-Bruchstück C₁₇H₂₀O₆ (Guaiacylglycerol-β-guaiacylether, β-O-4 nach Ralph et al. 2004) in drei Stufen: 25 °C vollständig · 200 °C Seitenketten-OH als H₂O ab · 300 °C Methoxygruppen (Methanol) und Ether-O ab, Ringe rücken (mix 0,55) auf ihre Cluster-Plätze; Ringkohlenstoffe und Cα/Cβ gleiten über gemeinsame Schlüssel in den 350-°C-Cluster, Cγ und Methoxy-C gehen ab. Ab 350 °C Struktur in 25-°C-Stufen; Randgruppen nach fester Rangfolge, entfallende Gruppen verlassen den Cluster (Dehydratisierung/Decarboxylierung), neue Ringe wachsen ein. Summenformel und H/C zählen live.
