---
name: preview-shots-with-dev
description: Vorschau-Varianten der 3D-Ebenen als echte Aufnahmen – ?dev + tests/shots_cdp.py statt preview/capture.py (lädt die WebGL-Seite nicht fertig)
metadata:
  type: project
---

Vorschauen mit Material-, Licht- oder Linsen-Varianten entstehen als echte Aufnahmen der Seite: `?dev` legt `window.__bc` an (state, comp, bright, LENS, MOODS, settings, renderer()), das Shot-JS ändert Materialien/Uniforms/Lichter von `state.active` und setzt `lv.dirty = true`; Aufnahme per `tests/shots_cdp.py` (CDP, eigener Server 8475, wartet auf `body.is-ready`, Clip als Selektor oder `[x, y, w, h]`, schreibt `<name>.shot.json` im Format von `preview/capture.py`).

**Why:** `preview/capture.py` und `chrome --screenshot --timeout` bringen die Seite nicht über das Ladebild (rAF-gebundenes Laden, 8 % nach 9 s) – die CDP-Prüfskripte des Projekts (`hs_card_check.py`) schaffen Ebene 1 in ≈ 10 s. Chrome-Profil mit Cache lieferte altes `main.js` → Cache im Skript abgeschaltet. (Vorschau 31.10.2026, Chat dev-ws-f9)

**How to apply:** Vorschau-Bilder nie mit `capture.py` versuchen; `shots_cdp.py` mit `query "&dev&seed=7"`, `motion "reduce"` (Kamera still, Waldboden gleich) und `css "#hotspots, .caption { opacity: 0 !important; }"`; Vorher = gleicher Clip ohne `js`. Siehe [[headless-cdp-check]].
