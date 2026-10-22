# Biochar – Reise in die Pflanzenkohle

Interaktive 3D-Webseite: Vom Stück Buchen-Pflanzenkohle zoomt die Kamera Ebene für Ebene in die Struktur – Gewebe, Zellen, Zellwand mit Tüpfeln, Nanoporen, turbostratischer Kohlenstoff, Atome. Jede Ebene hat anklickbare Punkte mit Erklärungen, Kennzahlen und Quellen.

## Starten

```bash
npm run serve          # oder: python3 -m http.server 8470 --bind 127.0.0.1 --directory web
```

Dann `http://localhost:8470/` öffnen. Für Ausstellungen: `http://localhost:8470/?tour` fliegt selbständig durch alle Ebenen (endet bei der ersten Eingabe), `&dwell=15` setzt die Verweildauer in Sekunden. Kein Build, keine Abhängigkeiten außer einem Browser mit WebGL 2; three.js liegt in `web/vendor/` (läuft offline, nur die Schrift kommt von Google Fonts).

## Bedienung

| Aktion | Wirkung |
|---|---|
| Ziehen / Scrollen | Kamera drehen / zoomen |
| oranges Hex-Abzeichen | eine Ebene tiefer fliegen (Portal-Flug, ≈ 4 s) |
| weißes Hex-Abzeichen | Kamera schwenkt hin, Erklärung in der Infotafel |
| am Zoom-Anschlag weiterscrollen | Ebene tiefer bzw. zurück |
| Skalen-Leiter links, Tasten `1`–`7` | direkt zu einer Ebene |
| `Esc` / `Bild ↑` · `Bild ↓` | Ebene zurück · tiefer |
| Regler „Pyrolysetemperatur“ | Kennwerte (IPCC, EBC) und Nano-Struktur ändern sich |
| Regler „Luftfeuchte“ (Ebene 5) | Poren füllen sich nach der Kelvin-Gleichung mit Wasser |

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
