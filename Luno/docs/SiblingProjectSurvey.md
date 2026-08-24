# 🗺️ Luno Multi-Project & Sibling Architecture Survey

## 1. Vision & Architectural Goals
Luno serves dual functions:
1. **Self-Improving Meta-Environment**: The host system that inspects, patches, and rebuilds its own source code.
2. **Multi-Project Application Hub**: An orchestrator that loads, tests, edits, and deploys multiple sibling projects (e.g., `AccuDrawValuation`, `SituationApp`, `Basic3D`, `ColorPicker`, `MidiPlayer`).

## 2. Shared Library Unification
- All core reusable utilities (`makeElement`, `applyCss`, drag/resize controllers, dialog frameworks) will live in a single unified `Library/` namespace.
- Projects can consume `Library/` modules when developing locally or through CDN/relative path mapping when hosted independently on GitHub Pages.

## 3. Manifest Migration (`files.json` ➔ `luno.json`)
- Legacy **Recursi** projects utilize `files.json`.
- **Luno** utilizes standardized `luno.json` containing:
  - `entrypoint`: Class and init/run method declarations.
  - `main`: Script execution load sequence.
  - `library`: Shared library dependencies.
  - `styles`: CSS stylesheets.
  - `type`: Application category (`luno-web-app`, `luno-3d-scene`, `luno-tool`).

## 4. GitHub Pages Deployment Protocol
- Each standalone project repository can be pushed to `origin/main` (or `gh-pages`) directly from the Luno UI with automatic root path resolution and asset linking.