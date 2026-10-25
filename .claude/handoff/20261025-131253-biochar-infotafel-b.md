[Claude] [Biochar] Infotafel ohne Scrollen umsetzen (Panel:B)
Rückmeldung an: dev-ws-42
Kontext: Infotafel rechts (web/js/hud.js render(), ab Zeile ~420) ist auf
  Ebene 3 bei 1440 × 900 heute 1982 px hoch, sichtbar 866 px. Vorschau
  abgenommen (Schatzkammer biochar/vorschauen/2026-10-25-infotafel-ohne-
  scrollen-eine-ebene-auf-einen-blick/): F2 = Panel:B „Alles in der
  Infotafel, dichter gesetzt“, F1 = Diagramm H/C aufklappbar.
  Prototyp gemessen 842 / 866 px (nur Ebene 3, per CSS/JS eingespielt).
Aufgabe: Panel:B echt in hud.js + biochar.css umsetzen:
  - Einleitung 2 Zeilen (line-clamp) + Knopf „Weiterlesen“ (aria-expanded)
  - Entdecken als Chip-Reihe: Nummer + Hex + Name, Größen-Etikett nur
    noch in der Info-Karte
  - Kennzahlen zweispaltig ohne Icons, erste (lange) über volle Breite
  - Labor: Tabelle → 3 × 3 Kacheln (Name, Wert, Balken); Live-Werte in
    setLive() mitziehen (heute über tr[data-f]), Warnfarbe H/C + O/C
  - Überschrift „Pyrolyse-Labor · Richtwerte Holz (Modell)“,
    Bedienungs-Notiz „Gesteuert wird …“ weg, volle Fußnote (CO₂-Formel)
    + Diagramm H/C in eine aufklappbare Zeile „Verlauf H/C ▸“ (zu)
  - Quellen in einer Zeile, Abstände im Panel 18 → 10 px
  - alle 7 Ebenen messen: #panel-body scrollHeight ≤ clientHeight bei
    1440 × 900 (zugeklappt); Ebene 5 hat zusätzlich den Luftfeuchte-
    Regler → passt sie nicht, User fragen statt still kürzen
Dateien:
  - web/js/hud.js (render, labTable, labChart, setLive, facts)
  - web/css/biochar.css (Abschnitt „Infotafel“, ~Zeile 425–600)
  - Prototyp: ~/ai_dev_workflow_global/__treasury__allprojects/biochar/
    vorschauen/2026-10-25-infotafel-ohne-scrollen-eine-ebene-auf-einen-
    blick/aufnahme_prototyp.py (CSS_COMMON, CSS_CELLS, CSS_B, JS_B)
Beachten:
  - Prüfungen laut AGENTS.md §5: npm test, Headless-Chrome je Ebene,
    hell + dunkel, 1440 + 390 px, tests/hs_card_check.py
  - eigene Test-Instanz, nie Port 8470 (Server des Users)
  - UI-Regeln: keine Mini-Schrift, keine graue Schrift, Zahl + Einheit
    nie getrennt; Hinweis „Richtwerte/Modell“ bleibt sichtbar
  - Zettel im Commit der fertigen Arbeit löschen (git rm)
