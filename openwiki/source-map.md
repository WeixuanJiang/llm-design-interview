# Source map

[← Quickstart](quickstart.md)

## Application entry and composition

| Area | Primary files | What to change there |
|---|---|---|
| Bootstrap | `src/main.tsx` | Root render and global style imports. |
| Application state and navigation | `src/App.tsx` | Hash-view parsing, lazy route composition, learning aggregate, theme, autosave, reset behavior. |
| Navigation shell | `src/components/AppShell.tsx` | Desktop/mobile navigation, context heading, theme control. |
| Global visual system | `src/styles.css` | Shared tokens, dark mode, responsive styling, component classes. |
| Route resilience | `src/components/ErrorBoundary.tsx`, `src/components/Skeleton.tsx` | Lazy-route failure/loading experiences. |

## Learner-facing components

| Surface | Files | Notes |
|---|---|---|
| Home | `HomePage.tsx` | Summary and section navigation. |
| Learn | `LearnPage.tsx`, `data/learningContent.ts`, `data/pdfCatalog.ts` | Lesson navigation, reading, checks, completion callbacks, curriculum metadata. |
| Practice | `PracticePage.tsx`, `data/specialActivities.ts` | Drills, RAG failure lab, mock-interview UI. |
| Catalogue | `MissionCatalogue.tsx`, `CaseStudyBuildLab.tsx` | Customer cases, local notes, Build Lab entry/context. |
| Workspace | `MissionWorkspace.tsx` | Enterprise RAG stage shell, validation banners, decision editor, scripted coach, review. |
| Graph editor | `ArchitectureBuilder.tsx`, `SystemNode.tsx`, `ConfirmDialog.tsx` | React Flow palette/canvas/inspector and destructive-action confirmation. |
| Progress | `ProgressPage.tsx` | Derived competency view, recommendation, browser export. |

## Domain and persistence

| File | Responsibility |
|---|---|
| `src/domain/types.ts` | Shared types for modes, stages, graph nodes/edges, attempt snapshots, and validation results. |
| `src/domain/attempt.ts` | Enterprise RAG seed state, reducer, storage key, loading/saving. |
| `src/domain/validation.ts` | Stage gates, peak-QPS formula, and deterministic score. |
| `src/domain/missionSchema.ts` | Zod schemas for compact mission/component definitions. |
| `src/domain/notes.ts` | Customer-catalogue local note persistence. |

## Authored static data

- `enterpriseRagMission.ts` — Zod-checked active mission definition and recommended palette.
- `awsCustomerMissions.ts` — runtime catalogue assembly and classification.
- `missionCaseStudies.ts` / `missionSpecifications.ts` / `missionUseCases.ts` — substantive per-case narrative and requirement inputs.
- `awsCustomerSources.json` — source/provenance metadata used by catalogue construction and tests.
- `awsServiceLibrary.ts` — categorized AWS service library used by the builder.
- `learningContent.ts`, `pdfCatalog.ts`, `pdf-content-catalog.txt`, `specialActivities.ts` — curriculum and activity data.

Large static-data edits should be targeted: read the type/assembly layer and its colocated test before changing individual records. Avoid treating external source URLs in the catalogue as runtime integrations; the app does not fetch them.

## Tests

| Test group | Files | Protects |
|---|---|---|
| End-to-end-ish UI | `src/App.test.tsx`, `components/MissionWorkspace.test.tsx` | Navigation, lesson/practice flows, progress routing, selected workspace validation behavior. |
| Attempt state | `domain/attempt.test.ts` | Stage completion, edge cleanup, revision baseline behavior. |
| Rules | `domain/validation.test.ts` | Gate thresholds, QPS, score behavior. |
| Catalogue/data integrity | `data/*.test.ts` | Mission counts/uniqueness/specification alignment, service coverage, curriculum and PDF metadata. |
| Shared setup | `src/test/setup.ts`, `vitest.config.ts` | jsdom and Testing Library matchers. |

## Product and design records

- `README.md` — concise implementation overview and commands.
- `docs/PRODUCT.md` — users, product purpose, learning principles, accessibility bar.
- `docs/spec.md` / `docs/PRD.md` / `docs/DESIGN.md` — detailed intended behavior and design reference.
- `docs/implementation-status.md` — implementation fidelity ledger and intentional deviations; consult this before claiming a planned feature exists.
- `.impeccable/` — UI critique/audit artifacts, not app runtime inputs.

## Delivery and repository automation

- `package.json` — available developer commands; no lint command is configured.
- `vite.config.ts`, `tsconfig*.json` — build/toolchain configuration.
- `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `nginx.conf` — static container packaging and Nginx behavior.
- `.github/workflows/openwiki-update.yml` — uncommitted OpenWiki refresh workflow; it is repository automation, not application runtime code.
- `openwiki/INSTRUCTIONS.md` — user-authored documentation brief; do not edit during routine wiki maintenance.
