# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI System Design Gym: an interactive, local-first React app for practicing production AI/ML/LLM/agent/RAG system design. Learners work through missions (requirements → estimation → architecture → stress event → review), a drag-and-drop AWS architecture builder (React Flow), lesson-based Learn content, Practice drills, and a Progress dashboard. No backend — all state lives in browser `localStorage`.

## Commands

```bash
npm install       # install deps
npm run dev       # Vite dev server at http://127.0.0.1:5173 (hash routes: /#home, /#learn, /#missions, /#practice, /#progress)
npm run build     # tsc -b (project references) then vite build
npm test          # vitest run (single pass)
npm run test:watch  # vitest watch mode
```

Run a single test file: `npx vitest run src/domain/attempt.test.ts`. Run tests matching a name: `npx vitest run -t "pattern"`.

There is no lint script configured; rely on `npm run build` (tsc) for type checking.

## Architecture

- **`src/App.tsx`** is the whole router: it reads `window.location.hash` into a `View`, lazy-loads each top-level page, and owns two persisted pieces of state — the mission `attempt` (via `useReducer(attemptReducer, ...)`, domain/attempt.ts) and a separate `LearningState` (completed modules/lessons, practice stats) saved directly to `localStorage` under `ai-system-design-gym.learning.v1`. There is exactly one active mission attempt at a time, keyed under `ATTEMPT_STORAGE_KEY` (`ai-system-design-gym.attempt.enterprise-rag.v1`).
- **`src/domain/`** holds all state logic decoupled from React/UI, intentionally so it can move to a shared package or backend service later:
  - `types.ts` — core types: `AttemptState`, `ArchitectureNode`/`Edge` (React Flow), `EstimationState`, mission stage/mode enums.
  - `attempt.ts` — the reducer (`attemptReducer`) driving the five-stage mission workflow (requirements → estimation → architecture → stress → review), plus `loadAttempt`/`saveAttempt` localStorage persistence and the seeded initial Enterprise RAG architecture graph.
  - `validation.ts` — pure stage-gate functions (`validateRequirements`, `validateEstimation`, `validateArchitecture`, `validateMitigation`) and `calculateScore`/`calculatePeakQps`. These gate progression between mission stages and are the place to look when changing what counts as a "valid" answer at each stage.
  - `missionSchema.ts` — Zod schemas (`missionSchema`, `componentDefinitionSchema`) validating mission/component data shape.
- **`src/data/`** is static content: mission catalog/specs (`awsCustomerMissions.ts`, `missionSpecifications.ts`, `missionCaseStudies.ts`, `missionUseCases.ts`), the 96-service AWS catalog (`awsServiceLibrary.ts`), lesson content (`learningContent.ts`), and PDF-derived curriculum (`pdfCatalog.ts`). Most of these files have colocated `*.test.ts` files asserting catalog integrity (uniqueness of IDs/specs, schema conformance) — when adding/editing data entries, run the matching test file.
- **`src/components/`** are the views/screens, one per top-level route plus mission-workflow pieces: `HomePage`, `LearnPage`, `MissionCatalogue` (mission picker), `MissionWorkspace` (the five-stage mission shell), `ArchitectureBuilder` + `SystemNode` (React Flow canvas and node renderer), `CaseStudyBuildLab`, `PracticePage`, `ProgressPage`, `AppShell` (nav rail/topbar/mobile nav).
- Only one mission (`mission-enterprise-rag-v1`, the seeded Enterprise RAG scenario in `attempt.ts`) is currently wired into the live attempt workflow; the 100 customer missions in `data/awsCustomerMissions.ts` are catalog/spec data for the Build Lab and mission browsing, not yet all backed by live attempts (see `docs/implementation-status.md` for the fidelity ledger and intentional deviations).

## Docs worth checking before larger changes

- `docs/PRODUCT.md` — product purpose, target users, design principles, accessibility bar (WCAG 2.2 AA).
- `docs/implementation-status.md` — what's matched/implemented vs. intentionally deviated from the accepted design (e.g., AI coach is currently deterministic/stage-grounded, not a real model call).
- `docs/DESIGN.md`, `docs/spec.md`, `docs/PRD.md` — deeper design/spec detail if working on UI or mission mechanics.
- `.impeccable/` — design audit/critique history for the UI (frontend-design skill artifacts).

<!-- OPENWIKI:START -->

## OpenWiki

This repository uses OpenWiki for recurring code documentation. Start with `openwiki/quickstart.md`, then follow its links to architecture, workflows, domain concepts, operations, integrations, testing guidance, and source maps.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->
