---
name: storage-in-dev-ws
description: Projekt biochar liegt vorerst in ~/dev_ws/__project_biochar statt ~/__project_biochar
metadata:
  type: project
---

Der User hat am 2026-10-22 entschieden: das neue Projekt „__project_biochar“ liegt vorerst wörtlich in `~/dev_ws/__project_biochar`, mit eigenem Git-Repo (kein Commit ins dev_ws-Repo; dort per `.git/info/exclude` ausgeblendet). Noch kein Remote, kein Eintrag in `config/projects.yaml`, keine Karte auf lu4k87.github.io.

**Why:** „in dev_ws erstmal ablegen“ – Projekt ist für eine Hochschule, Veröffentlichung noch nicht freigegeben.

**How to apply:** Commits nur lokal in diesem Repo; vor Push/Remote oder Umzug nach `~/__project_biochar` (projects.py) den User fragen.
