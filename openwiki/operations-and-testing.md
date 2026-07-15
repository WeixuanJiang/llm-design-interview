# Operations and testing

[← Quickstart](quickstart.md) · [Source map](source-map.md)

## Prerequisites and local development

The documented requirement is Node.js 20+ with npm. Install dependencies and run Vite:

```bash
npm install
npm run dev
```

Vite serves the application at `http://127.0.0.1:5173` by default. The UI uses hash routes, so visit paths such as `/#learn` rather than server routes.

Available scripts (`package.json`):

```bash
npm run dev          # Vite development server
npm run build        # TypeScript project build, then Vite production build
npm test             # Vitest one-shot run
npm run test:watch   # Vitest watch mode
```

There is no lint script. Treat a clean `npm run build` as the type-check/build gate.

## Test strategy

Vitest runs in `jsdom` and loads Testing Library setup from `src/test/setup.ts` (`vitest.config.ts`). The suite intentionally combines:

- **pure domain tests** for reducer transitions, graph edge cleanup, revision snapshots, validation thresholds, peak QPS, and score logic;
- **static-data integrity tests** for the 100-case catalogue, authored specifications, service library, learning curriculum, and PDF metadata;
- **UI interaction tests** for core routes, lesson completion, practice evidence, progress routing, catalogue/Build Lab discovery, and workspace validation.

Use narrow tests while developing, then run the full suite:

```bash
npx vitest run src/domain/attempt.test.ts
npx vitest run -t "pattern"
npm test
npm run build
```

The documentation pass observed 27 passing tests and a successful production build. Vite reported the main minified JavaScript chunk at approximately 819 kB (250 kB gzip), above its 500 kB advisory threshold. It is not a build failure, but check bundle sizing when adding dependencies or expanding static content.

## Change-specific checks

| Change | Minimum verification |
|---|---|
| Reducer, storage, stages, score, or validation | Corresponding `src/domain/*.test.ts`, `npm test`, `npm run build` |
| Enterprise RAG UI or graph behavior | `components/MissionWorkspace.test.tsx`, `App.test.tsx`, manual desktop/mobile interaction check, full test/build |
| Curriculum, service library, customer cases, or catalogue assembly | Matching `src/data/*.test.ts`, then full test/build |
| Shell/theme/responsive styling | `App.test.tsx` as relevant, manual keyboard/theme/mobile check, full test/build |
| Docker/Nginx packaging | `npm run build`; build/run the image or Compose stack when changing container files |

Current gaps worth considering before high-risk changes: persistence migration/error behavior, accessibility of modal/drawer focus management, deep-link behavior beyond top-level hashes, theme initialization in tests, and full revision completion have limited direct test coverage.

## Container delivery

The current HEAD added static Docker packaging:

```bash
docker compose up --build
```

This exposes Nginx on `http://localhost:8080` (`docker-compose.yml`). The Dockerfile builds with `node:20-alpine`, runs `npm ci` and `npm run build`, then copies `dist/` into `nginx:1.27-alpine`.

`nginx.conf` enables gzip, applies immutable 30-day caching to common static assets, and falls back to `index.html` for unmatched paths. Because generated filenames are content-hashed by Vite, the immutable policy is appropriate for build assets; be cautious if future deployment adds mutable files under the cached extensions.

## Operational limits

- This repository has **no runtime server**, external API, database, credentials, or environment-based application configuration to operate.
- Browser local storage is the persistence layer. Clearing site data removes local attempts, learning records, theme preference, and notes; the in-app reset only clears the Enterprise RAG attempt.
- The apparent online/offline save state is not an availability or synchronization monitor.
- The coach and score are deterministic client-side features; do not treat them as AI service health dependencies.

## Git and documentation hygiene

Recent history explains the present shape: the platform was built in `ca0f9a2`, learner-friction and dark-mode improvements landed in `8111c24`, and static Docker delivery in `e1d3892`. Use history selectively when changing those boundaries rather than preserving old behavior by accident.

At documentation initialization, `CLAUDE.md` was modified and `.github/`, `AGENTS.md`, and `openwiki/` were untracked. Treat those as existing working-tree context: generated wiki work must remain under `openwiki/`, and routine maintenance must not rewrite agent instruction files or `openwiki/INSTRUCTIONS.md`.
