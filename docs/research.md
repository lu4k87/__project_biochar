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

## Weitere Vorlagen und Aufnahmen (zum Nachsehen, nicht ins Repo kopieren)
- Prommer et al. 2014, Abb. 2: Porengrößenverteilung aus 7 715 vermessenen Poren, mit Größen von Bakterien, Pilzen, Protozoen, Nematoden – https://pmc.ncbi.nlm.nih.gov/articles/PMC3907405/
- Biochar-Journal 2021 (Pellet-Biochar aus Nadelholz): Poren 1–100 µm aus Zellstrukturen als Lebensraum für Mikroorganismen – https://journal.hep.com.cn/bch/EN/10.1007/s42773-021-00104-3
- MDPI C 10/3/77: REM von Hyphen in Poren holziger Biochars nach 56 Tagen im Boden – https://www.mdpi.com/2311-5629/10/3/77
- Biochar-Journal 2025 (s42773-025-00549-w): fraktale Porenmodelle, Sägemehl-Biochar 300–1000 °C – https://link.springer.com/article/10.1007/s42773-025-00549-w
- US-Patente „Biochars and biochar treatment processes“: REM-Bilder von Kiefer-, Birken- und Kokosschalen-Biochar, Übergang Makro → Meso → Mikro entlang einer Pore – https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10252951
- Keiluweit et al. 2010 (Volltext frei): https://escholarship.org/uc/item/177491q3
- IPCC 2019 Refinement, Anhang 4 Biochar: https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch02_Ap4_Biochar.pdf
