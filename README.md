# Biochar – Reise in die Pflanzenkohle

Interaktive 3D-Webseite: Vom Stück Buchen-Pflanzenkohle zoomt die Kamera Ebene für Ebene in die Struktur – Gewebe, Zellen, Zellwand mit Tüpfeln, Nanoporen, turbostratischer Kohlenstoff, Atome. Jede Ebene hat anklickbare Punkte mit Erklärungen, Kennzahlen und Quellen.

## Starten

```bash
npm run serve          # oder: python3 -m http.server 8470 --bind 127.0.0.1 --directory web
```

Dann `http://localhost:8470/` öffnen. Für Ausstellungen: `http://localhost:8470/?tour` fliegt selbständig durch alle Ebenen (endet bei der ersten Eingabe), `&dwell=15` setzt die Verweildauer in Sekunden. `?q=1`, `?q=2` oder `?q=3` erzwingt die Qualitätsstufe (Leicht · Mittel · Fein). Kein Build, keine Abhängigkeiten außer einem Browser mit WebGL 2; three.js liegt in `web/vendor/` (läuft offline, nur die Schrift kommt von Google Fonts).

## Bedienung

| Aktion | Wirkung |
|---|---|
| Ziehen / Scrollen | Kamera drehen / zoomen |
| oranges Hex-Abzeichen oder sein Punkt | eine Ebene tiefer fliegen (durchgehender Flug ≈ 5 s, die nächste Ebene bildet sich ohne sichtbare Überblendung aus dem Zoom) |
| weißes Hex-Abzeichen | Kamera schwenkt hin, Erklärung in der Infotafel und in der Info-Karte neben dem Abzeichen (nummerierter Entdeckungs-Pfad `01` → `02` … mit gewinkelten 45°-Leitlinien); links neben dem Text eine runde Lupe mit Fadenkreuz-Ring: Live-Ausschnitt der Szene um den Punkt, schwenkt langsam ±25° (bei reduzierter Bewegung still, Stufe „Leicht“: Standbild) |
| am Zoom-Anschlag weiterscrollen | Ebene tiefer bzw. zurück |
| Zoom-Schiene links: Hex-Marke oder Tasten `1`–`7` | direkt zu einer Ebene (gegliedert in `MAKRO` · `REM` · `NANO` mit Alltags-Größenvergleich je aktiver Ebene, z. B. `≈ Walnuss`, `≈ 2× Haar`, `≈ Glucose-Ring`) |
| Zoom-Schiene: Knopf ziehen | Bildbreite stufenlos (log-Skala 20 cm → 0,5 nm); über den Anschlag der Ebene hinaus losgelassen → tiefer bzw. zurück |
| `Esc` / `Bild ↑` · `Bild ↓` | Ebene zurück · tiefer (mit Sprungfaktor, z. B. `×40 ↓`) |
| Zeitleiste unten im Bild: runder Knopf ▶ / ■ | Pyrolyse abspielen: Zeitraffer von Raumtemperatur bis zur Zieltemperatur (≈ 18 s) mit Phasen von „Aufheizen“ bis „Aromatisierung · Rotglut“; die Kopfzeile zeigt Temperatur, Phase und Gase; nach einem Kapitel-Sprung spielt er ab dort weiter |
| Zeitleiste: Dreieck ziehen, auf die Spur klicken oder `←` `→` | Zieltemperatur 25–800 °C; alle Ebenen gleiten zur neuen Temperatur; Kennwerte (IPCC, EBC), Laborwerte (mit Live-Füllbalken) und Nano-Struktur ändern sich; Strich auf der Spur = Grenze Holz \| Pflanzenkohle ab 350 °C |
| Zeitleiste: Kapitel-Name (Aufheizen … Aromatisierung) | springt an den Beginn dieser Phase |
| Zeitleiste: Griff ⠿ ziehen oder Pfeiltasten | Leiste innerhalb der 3D-Ansicht verschieben (bleibt gespeichert); Doppelklick, ⟲ oder `Pos1` = zurück an den Standardplatz |
| Regler „Luftfeuchte“ (Ebene 5) | Poren füllen sich nach der Kelvin-Gleichung mit Wasser |
| Knopf „Messhilfen“ (oben rechts) | 3D-Messhilfen, Zonenbänder, Porenkonturen, Leitlinien und REM-Apertur-Visier ein- oder ausblenden (bleibt in `localStorage` gespeichert) |
| Regler „Qualität“ (oben rechts) | Darstellung in drei Stufen Leicht · Mittel · Fein: Auflösung, Kantenglättung, Tiefenunschärfe, Bloom, Schatten, Detailgrad der Ebenen – für flüssige Bilder auch auf schwächeren Rechnern; ohne eigene Wahl misst die Seite kurz die Bildrate und schaltet bei Bedarf herunter („auto“) |

## Die sieben Ebenen

| Ebene | Größenordnung | Darstellung | Modell |
|---|---|---|---|
| 1 Stück | 4 cm (`≈ Walnuss`) | Makroaufnahme | verformter Quader, prozedurale Jahrringe, Strahlen, Gefäße; Schwundrisse öffnen sich erst mit der Schwindung (Holz glatt → Kohle gerissen); gravierter Maßstabs-Objektträger (0–40 mm) und Schwundriss-Kontur |
| 2 Gewebe | 1 mm (`≈ Bleistiftmine`) | REM (Sekundärelektronen) | Power-Voronoi: Fasern, Gefäße (Früh-/Spätholz), Holzstrahlen, Jahrringgrenze mit Poren-Zonenband |
| 3 Zellen | 200 µm (`≈ 2× Haar`) | REM | dieselben Zellen als 3D-Bruchstück, Röhren längs aufgebrochen, Tüpfel, Kapillar-Leitfaden |
| 4 Zellwand | 25 µm (`≈ Blutzelle`) | REM | Hoftüpfel-Kammer, Mikrorisse, Bruchkante, Bakterien mit Biofilm-Saum, Pilzhyphe, Asche |
| 5 Nanoporen | 300 nm (`≈ Grippevirus`) | Modell (Raymarching) | hierarchisches 3D-Voronoi, Wasser nach Kelvin-Gleichung, farbige IUPAC-Porenklassen-Konturen (Makro · Meso · Mikro) |
| 6 Mikroporen | 10 nm (`≈ 4× DNA-Helix`) | Modell nach XRD/HRTEM | gewellte Graphen-Schichten in Stapeln mit Live-Schichtabstands-Klammer (`d₀₀₂`), Mikroporen (`< 2 nm`), CO₂/N₂/H₂O |
| 7 Atome | 2 nm (`≈ Glucose-Ring`) | Molekülmodell | aromatischer Cluster mit delokalisiertem π-Elektronenring (`0,142 nm`) und elektrostatischem Ionen-Bindungsfeld (`–COO⁻ ··· K⁺`), –OH, C=O, Rand-H |

Kennwerte, Quellen und Grenzen der Modelle: [docs/research.md](docs/research.md).

## Prüfen

```bash
npm test               # Kennwerte (IPCC, EBC, Kelvin) und Voronoi-Zerlegung
```
