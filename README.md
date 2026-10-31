# Biochar – Reise in die Pflanzenkohle

Interaktive 3D-Webseite: Vom Stück Buchen-Pflanzenkohle zoomt die Kamera Ebene für Ebene in die Struktur – Gewebe, Zellen, Zellwand mit Tüpfeln, Nanoporen, turbostratischer Kohlenstoff, Atome. Jede Ebene hat anklickbare Punkte mit Erklärungen, Kennzahlen und Quellen.

Doku-Seite mit Bedienung, Ebenen, Einstellungen und Belegen: [docs/readme_biochar.html](docs/readme_biochar.html).

## Starten

```bash
npm run serve          # oder: python3 -m http.server 8470 --bind 127.0.0.1 --directory web
```

Dann `http://localhost:8470/` öffnen. Für Ausstellungen: `http://localhost:8470/?tour` fliegt selbständig durch alle Ebenen (endet bei der ersten Eingabe), `&dwell=15` setzt die Verweildauer in Sekunden (Standard 12). `?q=1`, `?q=2` oder `?q=3` erzwingt die Qualitätsstufe (Leicht · Mittel · Fein). Kein Build, keine Abhängigkeiten außer einem Browser mit WebGL 2; three.js liegt in `web/vendor/` (läuft offline, nur die Schrift kommt von Google Fonts).

Weitere Adressen: `#ebene=1` … `#ebene=7` springt direkt zu einer Ebene · `?T=450` setzt die Temperatur (25–800 °C) · `?play` startet den Zeitraffer nach dem Laden, `&playsec=4` setzt seine Dauer · `?seed=123` legt die Anordnung des Waldbodens in Ebene 1 fest · Prüfhilfen `?freeze=0.5` und `?fps` (siehe [AGENTS.md](AGENTS.md) §5).

## Bedienung

| Aktion | Wirkung |
|---|---|
| Ziehen / Scrollen | Kamera drehen / zoomen |
| oranges Hex-Abzeichen oder sein Punkt | eine Ebene tiefer fliegen (durchgehender Flug ≈ 3,5 s, im Zahnrad unter „Bewegung“ einstellbar; beim Wechsel erscheint kurz der Titel der Ebene mit Bildbreite und Größenvergleich; die nächste Ebene bildet sich ohne sichtbare Überblendung aus dem Zoom) |
| weißes Hex-Abzeichen | Kamera schwenkt hin, Erklärung in der Infotafel und in der Info-Karte neben dem Abzeichen (nummerierter Entdeckungs-Pfad `01` → `02` … mit gewinkelten 45°-Leitlinien); links neben dem Text eine runde Lupe mit Fadenkreuz-Ring: Live-Ausschnitt der Szene um den Punkt, schwenkt langsam ±25° (bei reduzierter Bewegung still, Stufe „Leicht“: Standbild) |
| am Zoom-Anschlag weiterscrollen | Ebene tiefer bzw. zurück |
| Zoom-Schiene links: Hex-Marke oder Tasten `1`–`7` | direkt zu einer Ebene (gegliedert in `MAKRO` · `REM` · `NANO` mit Alltags-Größenvergleich je aktiver Ebene, z. B. `≈ Walnuss`, `≈ 2× Haar`, `≈ Glucose-Ring`) |
| Zoom-Schiene: Knopf ziehen | Bildbreite stufenlos (log-Skala 20 cm → 0,5 nm); über den Anschlag der Ebene hinaus losgelassen → tiefer bzw. zurück |
| `Esc` / `Bild ↑` · `Bild ↓` | offene Info-Karte bzw. Einstellungen schließen, sonst Ebene zurück · tiefer (mit Sprungfaktor, z. B. `×40 ↓`) |
| Zeitleiste in der Fußleiste (mittig zwischen Messleiste und Ebenen-Wechsel): runder Knopf ▶ / ■ | Pyrolyse abspielen: Zeitraffer von Raumtemperatur bis zur Zieltemperatur (≈ 8 s, im Zahnrad einstellbar) mit Phasen von „Aufheizen“ bis „Aromatisierung · Rotglut“; die Kopfzeile zeigt Temperatur, Phase und Gase; nach einem Kapitel-Sprung spielt er ab dort weiter |
| Zeitleiste: Dreieck ziehen, auf die Spur klicken oder `←` `→` | Zieltemperatur 25–800 °C; alle Ebenen gleiten zur neuen Temperatur; Kennwerte (IPCC, EBC), Laborwerte (3×3 Kacheln mit Differenz zum Rohholz bei 25 °C, dazu Leitfähigkeit σ und Kontaktwinkel θ, mit Live-Füllbalken) und Nano-Struktur ändern sich; Strich auf der Spur = Grenze Holz \| Pflanzenkohle ab 350 °C |
| Zeitleiste: Kapitel-Name (Aufheizen … Aromatisierung) | springt an den Beginn dieser Phase |
| Zeitleiste: Griff ⠿ ziehen oder Pfeiltasten | Leiste in die 3D-Ansicht verschieben (bleibt gespeichert); Doppelklick, ⟲ oder `Pos1` = zurück an den Standardplatz |
| Hotspot außerhalb seiner Temperatur | Entdecken-Chip gestrichelt mit Temperatur-Abzeichen (z. B. `ab 380 °C`); die Info-Karte zeigt Temperatur · Phase · Zustand, der Knopf „Auf … °C gleiten →“ führt sanft zur passenden Temperatur |
| Messleiste `SE` / `BSE` (Ebene 3 und 4) | REM-Detektor wechseln: Sekundärelektronen (Topografie) · Rückstreuelektronen (Asche hell) |
| Regler „Luftfeuchte“ (Ebene 5) | Poren füllen sich nach der Kelvin-Gleichung mit Wasser |
| Zahnrad (oben rechts) | Einstellungen öffnen, aufgebaut wie in Kosmos: Reiter **Ebene n** mit den Phänomenen der aktiven Ebene (1 Wassertropfen mit Kontaktwinkel und Eindringzeit, Schwaden · 2 Kapillar-Aufstieg · 3 Pilzhyphe · 4 Bakterien, Hyphe, Asche · 5 ▶ Tagesgang der Luftfeuchte, Knudsen-Rennen · 6 Gasmoleküle · 7 Schwingungen Wärme / G-Mode / D-Mode, π-Elektronen, Elektronenwolke) und Reiter **Global** (Look mit Farblook, Belichtung, Vignette, Kinobalken · Licht · Kamera & Bewegung · Effekte · REM · Material & Optik mit Kohle-Glanz, Kantenlicht, REM-Kanten und -Korn, Klarlack der Atome, Bloom-Schwelle · Oberfläche mit Hell / Dunkel, Infotafel, Messhilfen, Abzeichen · Leistung); Themenliste links, geänderte Werte mit „Standard“ zurücksetzbar; Wahl bleibt in `localStorage` gespeichert |
| Einstellungen → „Qualität“ | Darstellung in drei Stufen Leicht · Mittel · Fein: Auflösung, Kantenglättung, Tiefenunschärfe, Bloom, Schatten, Detailgrad der Ebenen – für flüssige Bilder auch auf schwächeren Rechnern; ohne eigene Wahl misst die Seite die Bildrate und passt die Stufe an: nach 3 s Ruckeln eine Stufe herunter, nach 15 s Luft wieder herauf („auto“) |

## Die sieben Ebenen

| Ebene | Größenordnung | Darstellung | Modell |
|---|---|---|---|
| 1 Stück | 4 cm (`≈ Walnuss`) | Makroaufnahme mit geringer Schärfentiefe | längs gespaltener Splitter mit zerfasertem Bruchende auf Waldboden (Humus, Buchenlaub, Terra preta), prozedurale Jahrringe, Strahlen, Gefäße; Schwundrisse öffnen sich erst mit der Schwindung (Holz glatt → Kohle gerissen), Kohle ab 550 °C mit Seidenglanz und kühlem Kantenlicht; Messhilfen: Maßstab 0–40 mm und Schwundriss-Kontur |
| 2 Gewebe | 1 mm (`≈ Bleistiftmine`) | REM (Sekundärelektronen) | Power-Voronoi: Fasern, Gefäße (Früh-/Spätholz), Holzstrahlen, Jahrringgrenze mit Poren-Zonenband, Kapillar-Aufstieg (Lucas-Washburn) |
| 3 Zellen | 200 µm (`≈ 2× Haar`) | REM | dieselben Zellen als 3D-Bruchstück, Röhren längs aufgebrochen, Tüpfel, Kapillar-Leitfaden |
| 4 Zellwand | 25 µm (`≈ Blutzelle`) | REM | Hoftüpfel-Kammer, Mikrorisse, Bruchkante, Bakterien mit Biofilm-Saum, Pilzhyphe mit Sporen, Asche mit EDX-Spektrum |
| 5 Nanoporen | 300 nm (`≈ Grippevirus`) | Modell (Raymarching) | hierarchisches 3D-Voronoi, Wasser nach Kelvin-Gleichung, farbige IUPAC-Porenklassen-Konturen (Makro · Meso · Mikro), Diffusions-Rennen der Gase (Knudsen) |
| 6 Mikroporen | 10 nm (`≈ 4× DNA-Helix`) | Modell nach XRD/HRTEM | gewellte Graphen-Schichten in Stapeln mit Live-Schichtabstands-Klammer (`d₀₀₂`), Mikroporen (`< 2 nm`), CO₂/N₂/H₂O; im Holz Zellulose-Mikrofibrillen mit Hemizellulose/Lignin; Röntgenbeugung und Raman D/G in der Infotafel |
| 7 Atome | 2 nm (`≈ Glucose-Ring`) | Molekülmodell | aromatischer Cluster mit delokalisiertem π-Elektronenring (`0,142 nm`) und elektrostatischem Ionen-Bindungsfeld (`–COO⁻ ··· K⁺`), –OH, C=O, Rand-H; unter 350 °C Lignin-Baustein, ab ≈ 525 °C Stone-Wales-Defekt (5-7-7-5) |

Kennwerte, Quellen und Grenzen der Modelle: [docs/research.md](docs/research.md).

## Prüfen

```bash
npm test               # Kennwerte (IPCC, EBC, Kelvin), Voronoi, Qualitätsstufen, Nano-Labor (Knudsen, Bragg/Scherrer, Raman)
```
