---
name: browser-cache-after-change
description: Nach Änderungen an index.html + JS/CSS kann der offene Browser alte und neue Dateien mischen → WebGL-Fehlseite; harter Reload (Strg+Shift+R) behebt es
metadata:
  type: project
---

Die Seite hat keinen Build und keine Cache-Header (`python3 -m http.server`); nach einem Commit, der `index.html` und JS/CSS zusammen ändert, kann ein schon offener Browser gecachte alte Dateien mit neuen mischen. Die Seite zeigt dann „Diese Ansicht braucht WebGL 2“ (`.fatal` erscheint bei `no-webgl` und bei jedem Fehler in `start()`), obwohl die ausgelieferten Dateien stimmen.

**Why:** 2026-10-23 nach der Pyrolyse-Einblendung (f5e7800) sah der User die WebGL-Meldung im normalen Chrome; Strg+Shift+R → lief. Headless-Lauf gegen 8470 war grün, Dateien = HEAD.
**How to apply:** Nach jedem Commit, der `index.html` zusammen mit JS/CSS ändert, in der Antwort beim `🌐 Seite öffnen`-Link „Strg+Shift+R (harter Reload)“ nennen; bei der WebGL-Meldung zuerst harten Reload empfehlen, dann erst `chrome://gpu`/Konsole.
