[Claude] [Biochar] Zahnrad: Klapp-Liste mit Sprungleiste wie Kosmos
Rückmeldung an: dev-ws-95

Kontext:
- Kosmos (~/__project_kosmos) bekommt im Zahnrad einen neuen Aufbau, gewählt vom User in der Vorschau
  „Zahnrad: Aufbau der Reiter Station und Global für alle Ebenen“ (26.10.2026, Zahnrad:A + Zahnrad:C):
  http://localhost:8085/__treasury__allprojects/kosmos/vorschauen/2026-10-26-zahnrad-aufbau-der-reiter-station-und-global-f%C3%BCr-alle-ebenen/index.html
- Entscheidungen: Gruppen als Klapp-Zeilen mit Kurzwerten im Kopf („Kino · Weißglut“, „2 von 2 an“) ·
  mehrere Gruppen gleichzeitig offen, offene Gruppen je Ebene gemerkt · Sprungleiste der Gruppen oben,
  bleibt beim Scrollen stehen und hebt die sichtbare Gruppe hervor · Einstellung als Zeile Name | Bedienung | Wert ·
  Titelzeile mit Ebenen-Name groß + kleiner Schalter Station/Ebene | Global · Animation als schlanke Zeile ohne Karte.
- Offen beim User: ob der Reiter Global dieselbe Form bekommt (bis zur Antwort Global unverändert lassen).

Aufgabe:
- Denselben Aufbau im Einstellungs-Panel von Biochar umsetzen, für alle Ebenen (Ebenen-Schalter je Ebene, Commit 26d0295).
- Vorlage: Umsetzung in Kosmos web/js/layers.js, web/js/settings.js, web/css/layers.css (Commit von dev-ws-95,
  „feat(web): gear as foldable list with jump bar“) – Muster übernehmen, an Biochar-Klassen und Tokens anpassen.
- Prüfen nach AGENTS.md von Biochar (Tests, Screenshots hell/dunkel falls vorhanden, 1440 + 390 px), Commit + Push.

Dateien: web/js/settings.js, web/js/levels/*.js (Ebenen-Registrierung), web/css/*, web/index.html

Beachten:
- Erst AGENTS.md von Biochar lesen; Vorschau ist schon entschieden, keine neue Vorschau nötig.
- Ein anderer Biochar-Chat (dev-ws-37, Blocksatz/Texte) kann parallel laufen: git status prüfen, fremde Dateien nicht mitcommitten.
