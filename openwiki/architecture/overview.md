# Architecture overview

[← Quickstart](../quickstart.md)

## Runtime shape

`src/main.tsx` mounts `<App />` under React `StrictMode` and imports global application and React Flow styles. `src/App.tsx` is the application orchestrator: it owns route selection, the Enterprise RAG reducer state, aggregate learning state, theme, and debounced attempt persistence.

```text
main.tsx
  └─ App.tsx
      ├─ AppShell (navigation, responsive shell, theme control)
      ├─ lazy route views: Home / Learn / Practice / Progress / MissionWorkspace
      ├─ MissionCatalogue (eagerly imported)
      └─ domain state: attempt reducer + local learning record
```

Top-level lazy routes have `ErrorBoundary` and `SkeletonPanel` fallbacks. The `missions` catalogue is not lazy-loaded. Route handling is a small hash parser in `App.tsx`, so deep links identify a view only—not a particular lesson, case, or stage.

## Client state and persistence

All durable state is in `localStorage`; there is no API call or account boundary.

| State | Key / owner | Notes |
|---|---|---|
| Enterprise RAG attempt | `ai-system-design-gym.attempt.enterprise-rag.v1`; `src/domain/attempt.ts` | Versioned `AttemptState`, restored only when `schemaVersion === 1` and nodes are an array. App saves it 450 ms after reducer changes. |
| Learning aggregate | `ai-system-design-gym.learning.v1`; `src/App.tsx` | Completed module/lesson IDs and reviewed/correct practice counts. |
| Theme | `ai-system-design-gym.theme.v1`; `src/App.tsx` | Uses OS preference when no choice is saved; document theme is set before first paint. |
| Catalogue notes | `ai-system-design-gym.catalogue-notes.v1`; `src/domain/notes.ts` | Per-case freeform notes, saved by `MissionCatalogue`. |

Malformed saved attempt, learning, or notes JSON is ignored/falls back locally. Reset from the catalogue only removes the Enterprise RAG attempt and reloads; it deliberately leaves learning records, theme, and catalogue notes intact.

The displayed `saved`/`offline` indicator reflects `navigator.onLine`, but writes are local in either case. Do not interpret it as cloud synchronization.

## Domain boundary

`src/domain/` is deliberately React-independent except for React Flow type/helpers:

- `types.ts` defines mission mode/stage, graph contracts, estimation inputs, snapshot, and `AttemptState`.
- `attempt.ts` seeds and reduces the Enterprise RAG attempt. Reducer actions cover graph mutations, evidence, stage progression, stress activation, and revision submission.
- `validation.ts` holds pure gate functions, peak-QPS calculation, and deterministic score calculation.
- `missionSchema.ts` validates compact authored mission definitions with Zod; `data/enterpriseRagMission.ts` parses its data at module load.
- `notes.ts` isolates catalogue-note persistence.

Keep new business rules in this boundary rather than embedding them in view components. It is the natural extraction point for a future shared package or server-side attempt service.

## Architecture canvas

`ArchitectureBuilder.tsx` is a controlled React Flow view. Its parent owns all graph state through the attempt reducer. It combines the mission palette with the static AWS service library, supports node addition, drag/drop, edge connections, selection, decision editing, and confirmed deletion. `SystemNode.tsx` defines the custom node renderer.

The current validation checks category presence, a minimum connection count, and a substantive decision. It **does not** validate topology, service compatibility, authorization paths, latency/cost behavior, or factual architecture quality. Preserve this distinction if presenting or extending scores.

## Delivery

The application ships as a static Vite build:

1. `npm run build` runs `tsc -b && vite build` (`package.json`).
2. `Dockerfile` uses `node:20-alpine` and `npm ci` to build `/app/dist`.
3. The runtime image is `nginx:1.27-alpine`; `nginx.conf` serves the assets, enables gzip, applies 30-day immutable caching to static asset extensions, and falls back to `index.html`.
4. `docker-compose.yml` exposes the container on `localhost:8080`.

The Nginx fallback supports SPA delivery, though hash navigation itself does not require server-side route rewriting.

## Extension constraints

The source and `docs/implementation-status.md` intentionally describe several future boundaries, not implemented capabilities:

- server-backed profiles, shared progress, cross-device sync, and analytics;
- a provider-independent AI evaluation/coach gateway (the current coach is scripted and stage-grounded);
- richer competency evidence and rubric-based scoring;
- independently persisted workflows for the catalogue’s 100 cases.

Any backend introduction must decide how to migrate versioned browser attempts, whether the local-first mode remains supported, and which server-validated rules replace or complement the current UI gates.
