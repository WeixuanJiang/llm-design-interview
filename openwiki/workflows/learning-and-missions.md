# Learning and mission workflows

[← Quickstart](../quickstart.md) · [Architecture](../architecture/overview.md)

## Product loop

The intended learning sequence is **understand → decide → explain → challenge → revise → reflect** (`docs/PRODUCT.md`). The UI is organized around Learn, Practice, Missions, and Progress, but only the Enterprise RAG workspace implements the complete persisted mission loop.

## Learn and Practice

`LearnPage.tsx` renders authored modules and lessons from `src/data/learningContent.ts`. A learner receives completion credit only after working through the lesson’s sequence of knowledge checks and completing the lesson; `App.tsx` de-duplicates completed lesson IDs and marks a module complete once all of its lesson IDs are present.

`PracticePage.tsx` provides three local experiences:

- catalog drills, which report a reviewed/correct result back to `App`;
- a RAG failure-diagnosis exercise using the same aggregate counters;
- mock interview phases and notes, which are view-local and do not enter the persisted progress record.

The content is static and authored; it is not generated at runtime. Relevant data includes `learningContent.ts`, `pdfCatalog.ts`, and `specialActivities.ts`. The PDF catalogue preserves editorial/source metadata; lessons are intended as original rewrites rather than copied source text (`docs/implementation-status.md`).

## Mission catalogue vs. active workspace

`MissionCatalogue.tsx` is a browse/filter/read experience around `awsCustomerMissions.ts`, which assembles 100 customer-style cases from static case studies, specifications, source metadata, and service recommendations. Cases have requirements, scale assumptions, a data flow, a stress event, and a Build Lab context. Notes are persisted per case, but selected case/filter/stage are transient.

The full workflow is `mission-enterprise-rag-v1` only:

- **Scenario:** secure internal RAG for 10,000 employees and 50 million chunks.
- **Hard requirements:** employee/document authorization, query P95 under three seconds, and changed-document freshness within fifteen minutes.
- **Seeded graph:** web client → API Gateway → ECS retrieval service → OpenSearch → Bedrock, plus SQS → OpenSearch ingestion path.
- **Authoring source:** `src/data/enterpriseRagMission.ts`; initial state: `src/domain/attempt.ts`.

Do not assume a selected catalogue case maps to an `AttemptState`; it currently does not.

## Enterprise RAG stages

`MissionWorkspace.tsx` renders the five-stage state machine. UI submission runs the pure validators from `src/domain/validation.ts` before dispatching reducer actions.

| Stage | Learner evidence | Gate / transition |
|---|---|---|
| Requirements | Confirm all three requirements and write a summary | Three confirmations + trimmed summary of at least 60 characters → estimation |
| Estimation | Adjust usage and document-volume assumptions | Positive peak QPS and at least 1,000,000 chunks → architecture |
| Architecture | Build/adjust graph and save component rationale | Compute, data, and AI categories; at least `max(3, nodes - 2)` edges; one decision ≥30 chars → stress |
| Stress | Explain mitigation and validation plan | Mitigation ≥40 chars → review |
| Review | Inspect feedback and revise | Learner starts revision, returns to architecture, then submits a revision; `revisionCount` increments and marks stress complete |

Peak QPS is `round(users × queriesPerUserPerDay × peakFactor / max(1, workingHours × 3600))`. It is a simple exercise heuristic, not a capacity model.

When architecture is activated for stress, the reducer stores a `revisionBase` graph/evidence snapshot. The review compares current graph/decision counts with that baseline. Existing reducer tests cover a decision update after snapshotting; retain or expand that coverage if changing immutable update behavior.

## Score and feedback interpretation

`calculateScore` begins at 68 and adds capped structural points for substantive decisions, graph size/connectivity, mitigation length, and each revision, capped at 96. The review calls out the longest recorded decision, repeats the mitigation as a risk response, and displays the revision delta.

This is **deterministic feedback**, not an architecture assessment engine. In particular, a valid or high-scoring graph may still be a poor system design. The documented target in `docs/spec.md` includes rubric/evidence/AI-evaluation concepts that have not been implemented.

The contextual coach is likewise a scripted, current-stage prompt. It does not accept or answer follow-up messages (`MissionWorkspace.tsx`, `docs/implementation-status.md`).

## Progress

`ProgressPage.tsx` derives a competency profile from completed modules, practice totals/accuracy, completed mission stages, decision count, and revision count. It makes a recommendation from the lowest computed skill and can export a plain-text report in the browser.

There is no independent progress ledger, confidence decay, historical attempt analysis, or calibrated competency model. When changing learning signals, update the page’s derived formulas and its tests together.

## Safe change sequence

1. Identify whether the request concerns static catalogue content or the single active attempt.
2. For gate, score, stage, or persistence changes, modify `src/domain/` first and add/update unit tests.
3. Update `MissionWorkspace.tsx`/`ArchitectureBuilder.tsx` for presentation and accessibility behavior; do not duplicate domain rules there.
4. For content catalogue changes, run the colocated data test that enforces the relevant integrity constraints.
5. Run the full test suite and production build as described in [Operations and testing](../operations-and-testing.md).
