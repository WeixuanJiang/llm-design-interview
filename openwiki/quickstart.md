# AI System Design Gym — OpenWiki

## What this repository is

AI System Design Gym is a **frontend-only, local-first** learning application for production AI/ML/LLM system design. It combines guided lessons, practice exercises, a customer-mission catalogue, an Enterprise RAG architecture workspace, and a derived progress dashboard. Its product loop is intentionally active: learners clarify constraints, make and defend choices, respond to a stress event, then revise their architecture.

The stack is React 19 + TypeScript + Vite, with React Flow for the architecture canvas, Zod for mission-data validation, and browser `localStorage` for all persistence. There is no server, account system, live AI coach, or remote API integration today. See [Architecture](architecture/overview.md) for the runtime boundary.

## Start here by task

| If you need to… | Read / inspect |
|---|---|
| Understand runtime, routing, persistence, or deployment | [Architecture overview](architecture/overview.md) → `src/App.tsx`, `src/domain/` |
| Change the learner experience or mission gates | [Learning and mission workflows](workflows/learning-and-missions.md) → `src/components/MissionWorkspace.tsx`, `src/domain/validation.ts` |
| Locate authored content, mission data, or UI code | [Source map](source-map.md) |
| Run locally, build, test, or ship the static image | [Operations and testing](operations-and-testing.md) |
| Understand product intent or implementation gaps | `docs/PRODUCT.md`, `docs/spec.md`, `docs/implementation-status.md` |

## Current product scope

- **Learn:** authored AI-system-design lessons and five-question knowledge checks. Lesson completion is stored locally.
- **Practice:** drills, a RAG failure lab, and a mock interview. Reviewed/correct drill counts feed the local progress view.
- **Missions:** a catalogue of 100 static, sourced customer-style cases plus a single fully persisted, guided **Enterprise RAG** attempt.
- **Architecture workspace:** a React Flow graph with component selection, connections, decision evidence, a stress mitigation, and a required revision.
- **Progress:** deterministic heuristics derived from local learning, practice, and Enterprise RAG attempt data—not a calibrated assessment model.

The catalogue should not be mistaken for 100 independently resumable mission engines: the current reducer and storage key are hard-coded for `mission-enterprise-rag-v1`. This distinction matters when extending mission behavior.

## Fast local start

Requires Node.js 20+ and npm:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Navigation is hash-based (`#home`, `#learn`, `#missions`, `#practice`, `#progress`, `#workspace`), implemented in `src/App.tsx`; this is not React Router.

For validation and container instructions, use [Operations and testing](operations-and-testing.md).

## Recent repository direction

The repository progressed from a starter (`d1bb8a3`) to the learning platform (`ca0f9a2`), then improved learner-facing reliability and honesty (`8111c24`): dark mode, error boundaries and route skeletons, confirmed destructive actions, saved catalogue notes, and clearer disclosure that the coach is scripted rather than live. The current HEAD (`e1d3892`) added multi-stage Docker/Nginx packaging for the static build.

Treat `docs/implementation-status.md` as the explicit fidelity ledger: it records intentional gaps such as local-only profiles and the deferred provider-independent AI gateway.

## Documentation conventions

This generated documentation maps the implementation; it does not replace the source-of-truth product materials in `docs/`. Inline source paths are the quickest way to verify behavior. The repository has uncommitted agent/OpenWiki workflow additions; these docs do not modify `AGENTS.md`, `CLAUDE.md`, or `openwiki/INSTRUCTIONS.md`.

## Backlog

- **Backend/profile and AI evaluation gateway** — `docs/spec.md`, `docs/implementation-status.md`: specified as future architecture; no server-side implementation exists to document.
- **Full per-catalogue-mission attempt engine** — `src/data/awsCustomerMissions.ts`, `src/domain/attempt.ts`: 100 cases are present, but only Enterprise RAG has persisted staged workflow state.
