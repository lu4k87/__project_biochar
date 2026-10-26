[Claude] [Biochar] Doku-Seite readme_biochar.html + Fibrille prüfen
Rückmeldung an: dev-ws-bb
Kontext: Projekt ~/__project_biochar (three.js ohne Build), zuerst
  AGENTS.md. README.md, AGENTS.md, docs/research.md sind seit
  Commit 1e6478f mit dem Code abgeglichen. Es gibt noch keine
  HTML-Doku-Seite; Vorbild ist ~/__project_kosmos/docs/
  readme_kosmos.html (Hero, Bedienung, Stationen-Tabelle,
  Einstellungen, Starten mit Adress-Tabelle, Belege, hell + dunkel).
Aufgabe:
  1. docs/readme_biochar.html im Stil der Kosmos-Seite anlegen:
     Hero, Bedienung, sieben Ebenen (Tabelle aus README), Zahnrad,
     Starten + URL-Parameter, Quellen/Bildnachweis (keine fremden
     REM-Bilder einbinden, nur verlinken – AGENTS.md §0).
  2. Mikrofibrille: content.js Hotspot fibril sagt Ø ≈ 3,5 nm,
     SOURCES id 14 (Fernandes et al. 2011, PNAS 108, E1195)
     sagt Ø ≈ 3 nm; research.md ebenfalls 3,5 nm. Wert im Paper
     nachlesen, dann alle Stellen auf einen belegten Wert bringen.
Dateien:
  - docs/readme_biochar.html (neu)
  - web/js/content.js
  - docs/research.md
  - README.md (Link auf die neue Seite)
Beachten:
  - Server des Users 8470 nicht anfassen, Tests auf 8471
  - npm test grün; Seite hell + dunkel, 1440 und 390 px ansehen
  - parallele Chats im selben Repo: nur eigene Zeilen committen
