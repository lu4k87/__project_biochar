---
name: headless-cdp-check
description: Zeitabläufe der Seite im Headless-Chrome per CDP prüfen (tests/pyro_overlay_check.py) statt --timeout-Screenshots; Hell nur per Emulation, Headless-Standard auf diesem Rechner ist dunkel
metadata:
  type: project
---

`google-chrome --headless=new --screenshot --timeout=…` trifft Zeitpunkte nur zufällig (Laden 3–8 s, Zeitraffer läuft weiter) und meldet auf diesem Rechner `prefers-color-scheme: dark` als Standard (GTK-Theme) – Hell-Theme gibt es headless nur per CDP `Emulation.setEmulatedMedia`.

**Why:** Prüfung der Pyrolyse-Einblendung 2026-10-23 (dev-ws-e2): erster `--timeout`-Screenshot fiel in die ersten 250 ms des Zeitraffers, „Hell“ ohne Emulation blieb dunkel.
**How to apply:** `python3 tests/pyro_overlay_check.py [ordner]` (websocket-client ist installiert, startet eigene Instanz auf 8471, GPU-Flags aus AGENTS.md §5): wartet auf `is-ready`, misst Einblendung an/aus, Überlappung, Konsole, Hell/Dunkel/390 px/reduced-motion. Für neue Zeitablauf-Prüfungen dieses Muster kopieren (Polling über `Runtime.evaluate`, Screenshot per `Page.captureScreenshot`).
