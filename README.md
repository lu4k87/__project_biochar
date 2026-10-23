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
| weißes Hex-Abzeichen | Kamera schwenkt hin, Erklärung in der Infotafel |
| am Zoom-Anschlag weiterscrollen | Ebene tiefer bzw. zurück |
| Zoom-Schiene links: Hex-Marke oder Tasten `1`–`7` | direkt zu einer Ebene |
| Zoom-Schiene: Knopf ziehen | Bildbreite stufenlos (log-Skala 20 cm → 0,5 nm); über den Anschlag der Ebene hinaus losgelassen → tiefer bzw. zurück |
| `Esc` / `Bild ↑` · `Bild ↓` | Ebene zurück · tiefer |
| Regler „Zieltemperatur“ | alle Ebenen gleiten zur neuen Temperatur; Kennwerte (IPCC, EBC), Laborwerte und Nano-Struktur ändern sich |
| Knopf „Pyrolyse abspielen“ | Zeitraffer von Raumtemperatur bis zur Zieltemperatur (≈ 18 s) mit Phasen von „Aufheizen“ bis „Aromatisierung · Rotglut“; solange die Temperatur gleitet, zeigt eine Einblendung oben in der 3D-Ansicht Temperatur, Phase und Gase |
| Regler „Luftfeuchte“ (Ebene 5) | Poren füllen sich nach der Kelvin-Gleichung mit Wasser |
| Regler „Qualität“ (oben rechts) | Darstellung in drei Stufen Leicht · Mittel · Fein: Auflösung, Kantenglättung, Tiefenunschärfe, Bloom, Schatten, Detailgrad der Ebenen – für flüssige Bilder auch auf schwächeren Rechnern; ohne eigene Wahl misst die Seite kurz die Bildrate und schaltet bei Bedarf herunter („auto“) |

## Die sieben Ebenen

| Ebene | Größenordnung | Darstellung | Modell |
|---|---|---|---|
| 1 Stück | 4 cm | Makroaufnahme | verformter Quader, prozedurale Jahrringe, Strahlen, Gefäße, Schwundrisse |
| 2 Gewebe | 1 mm | REM (Sekundärelektronen) | Power-Voronoi: Fasern, Gefäße (Früh-/Spätholz), Holzstrahlen, Jahrringgrenze |
| 3 Zellen | 200 µm | REM | dieselben Zellen als 3D-Bruchstück, Röhren längs aufgebrochen, Tüpfel |
| 4 Zellwand | 25 µm | REM | Hoftüpfel, Mikrorisse, Bruchkante, Bakterien, Pilzhyphe, Asche |
| 5 Nanoporen | 300 nm | Modell (Raymarching) | hierarchisches 3D-Voronoi, Wasser nach Kelvin-Gleichung |
| 6 Mikroporen | 10 nm | Modell nach XRD/HRTEM | gewellte Graphen-Schichten in Stapeln, Mikroporen, CO₂/N₂/H₂O |
| 7 Atome | 2 nm | Molekülmodell | aromatischer Cluster mit –COO⁻/K⁺, –OH, C=O, Rand-H |

Kennwerte, Quellen und Grenzen der Modelle: [docs/research.md](docs/research.md).

## Prüfen

```bash
npm test               # Kennwerte (IPCC, EBC, Kelvin) und Voronoi-Zerlegung
```
