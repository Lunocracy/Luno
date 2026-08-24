# 🗺️ SPS2: Comprehensive Sibling Inventory & Manifest Architecture (Audited)
**Document ID**: `SPS2`  
**Scan Target**: `/storage/emulated/0/Luno/web/`  
**Workspace Host**: `Luno` (localhost:8080)  
**Date**: August 2026 (Verified Post-Audit)  

---

## 1. Verified Sibling Inventory & Status Matrix

| Project Directory | Category | Git Repo | Manifest Status | Primary Entrypoint | Real Disk Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`MySituation`** | Major Portfolio Dossier | ✅ Yes (`.git`) | `luno.json` + `files.json` | `SituationApp.run()` in `SituationApp.js` | ✅ 38 Files Verified in `web/MySituation/` |
| **`Luno`** | Workspace & Self-Editor | ✅ Yes (`.git`) | `luno.json` | `ClientApp.init()` in `app/ClientApp.js` | ✅ Isolated Core System |
| **`VideoEditor`** | Media / Code Editor Studio | ❌ No | `luno.json` | `VideoEditor.js` in `js/VideoEditor.js` | ✅ Standalone Directory |
| **`guessTheNoteGame`**| Interactive Audio Synth Game| ❌ No | `luno.json` | `GuessTheNoteGame.js` in `js/GuessTheNoteGame.js` | ✅ Standalone Directory |
| **`VideoPrepper`** | Video Chunk Slicing Tool | ❌ No | `luno.json` + `files.json` | `VideoSectionApp.init()` in `app/App.js` | ✅ Standalone Directory |
| **`Basic3D`** | Three.js 3D Starter Template| ❌ No | `luno.json` + `files.json` | `Basic3d.run()` in `Basic3D/Basic3d.js` | ✅ Starter Template |
| **`BasicsWithDialogBox`**| Interactive UI Dialog Sample| ❌ No | `luno.json` + `files.json` | `BasicsWithDialogBox` in `js/BasicsWithDialogBox.js` | ✅ Starter Template |
| **`SimpleTest`** | Minimal Preview Test App | ❌ No | `luno.json` | `SimpleApp.init()` in `src/SimpleApp.js` | ✅ Test App |
| **`Library/`** | Central Shared Modules | ❌ No | `luno.json` | Reusable UI, dialogs & sound engines | ✅ 43 Component Modules |
| **`images/`** | Static Media Assets | ❌ No | Static Asset Dir | N/A | ✅ Shared Media Assets |

---

## 2. Directory Isolation Architecture

- **`web/Luno/`**: Contains core self-editing tools, Outbox/Inbox protocol engines, Bookmarklet suites, AST patchers, and documentation. Zero portfolio or client game code.
- **`web/MySituation/`**: Contains the full executive dossier with 38 assets, animated SVG drum reveals, particle systems (`ValueEmberLogo`), and YouTube players. Operates with independent Git tracking and 1-tap `/api/deploy` capability.
- **`web/Library/`**: Central repository for shared primitives (`DomBasics.js`, `UITools.js`, `LunoDialog.js`, Web Audio synths).