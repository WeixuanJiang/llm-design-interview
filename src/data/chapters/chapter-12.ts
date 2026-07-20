import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

const chapter12Lessons = [
  {
    id: "ch12-ci-cd-for-rag",
    title: "CI/CD for RAG",
    prompt: "Gate every pipeline change before it reaches users",
    question: "A support-assistant team ships prompt and chunker edits through a standard code pipeline, but quality regressions keep reaching production before anyone notices. Which pipeline change best closes that gap?",
    options: [
      "Add an eval CI stage that runs a RAGAS/DeepEval golden-dataset suite on every pull request and blocks the merge when quality drops more than 3%",
      "Run the full golden-dataset evaluation every night and roll back the next morning if quality dropped",
      "Require a reviewer to eyeball a few sampled answers before any prompt change is merged",
    ],
    correct: 0,
    feedback: "Strong choice. An evaluation gate on every pull request turns quality into a merge condition, so a regression beyond the agreed threshold never ships.",
    explanation: "RAG behavior is stochastic, so code review alone cannot detect regressions caused by prompt, chunker, embedder, or retriever changes. The prescription is unit tests for each component in isolation, an eval CI stage that runs RAGAS/DeepEval on a golden dataset for every PR and blocks merges when quality drops more than 3%, plus integration tests over the assembled pipeline. A staged canary rollout then catches whatever the pre-merge gates miss.",
    takeaways: [
      "Unit-test the chunker, embedder, retriever, and prompt builder in isolation.",
      "Run a golden-dataset evaluation (RAGAS/DeepEval) on every PR with an explicit drop threshold, such as blocking at a 3% regression.",
      "Cover the assembled pipeline with synthetic-query integration tests, then release through a staged canary.",
    ],
    model: ["Isolate components", "Gate on golden evals", "Roll out gradually"],
    source: { chapter: 12, sections: ["12.1.1"], pages: "81" },
  },
  {
    id: "ch12-model-versioning",
    title: "Model Versioning",
    prompt: "Version every component, and never overwrite a version",
    question: "After an embedding-model upgrade, an audit asks the team to reproduce last month's answers, but nobody can say which chunking config and prompt template were live at the time. Which practice prevents this situation?",
    options: [
      "Keep a shared deployment spreadsheet that engineers update whenever they remember to",
      "Tag every component — embedding model, LLM, prompt template, chunking config — with its own version, store it in config management, keep it in Git, increment on any change, and never overwrite",
      "Version only the language model, since prompts and chunking are just configuration",
    ],
    correct: 1,
    feedback: "Strong choice. A RAG system's behavior is the product of every component, so each one needs an immutable, incrementing version kept in config management under Git.",
    explanation: "The rule is to tag every component — embedding model, LLM, prompt template, and chunking config — store the versions in config management such as Hydra or Dynaconf, and keep them version-controlled in Git. Versions increment on any change and are never overwritten, which is what makes a release reproducible. It is also what makes rollback a pointer flip: because old versions still exist, the previous index and configuration can be reselected without rebuilding anything.",
    takeaways: [
      "Behavior is the product of all components: version the embedding model, LLM, prompt template, and chunking config together.",
      "Store component versions in config management (Hydra, Dynaconf) and keep them in Git.",
      "Increment versions on every change; never overwrite an existing version.",
    ],
    model: ["Tag each component", "Store in Git-backed config", "Increment, never overwrite"],
    source: { chapter: 12, sections: ["12.1.2"], pages: "81" },
  },
  {
    id: "ch12-a-b-testing-and-canary-deployment",
    title: "A/B Testing and Canary Deployment",
    prompt: "Promote a release only as fast as production evidence allows",
    question: "A new LLM version has passed offline evaluation. How should it reach full production traffic?",
    options: [
      "Deploy straight to 100% traffic, since offline evaluation already passed",
      "Split traffic 50/50 for a week so the experiment reaches statistical power as fast as possible",
      "Roll out 5% -> 25% -> 100% with pauses, running an automated analysis such as a faithfulness check with a minimum threshold before each promotion",
    ],
    correct: 2,
    feedback: "Strong choice. Small staged steps with automated analysis limit blast radius while production evidence accumulates, and each promotion is earned by metrics rather than by the clock.",
    explanation: "The canary pattern advances traffic in steps — 5%, then 25%, then 100% — with pauses between them and an analysis template that checks a quality metric such as faithfulness against a floor like 0.85 before promotion. Labeling the rollout with the component version keeps metrics attributable. Offline evaluation passing is not sufficient, because the evaluation set may not represent live traffic; a failed gate halts promotion while the previous version keeps serving.",
    takeaways: [
      "Advance traffic in steps (5% -> 25% -> 100%) instead of switching all traffic at once.",
      "Attach automated analysis, such as a minimum faithfulness of 0.85, to every promotion step.",
      "Label each rollout with the component version so metrics, alerts, and rollback stay attributable.",
    ],
    model: ["Small first step", "Analyze, then promote", "Version-tagged rollout"],
    source: { chapter: 12, sections: ["12.1.3"], pages: "81" },
  },
];

export const chapter12Module: LearningModule = {
  id: "chapter-12-deployment-and-llmops",
  title: "Deployment & LLMOps",
  description: "Turn designs into disciplined releases: CI/CD for prompts and retrieval components, immutable model and config versioning, evaluation-gated canary rollouts, and instant rollback — software delivery adapted for stochastic systems.",
  duration: "3 lessons",
  lessons: chapter12Lessons,
};

export const chapter12CourseContent: Record<string, LessonCourseContent> = {
  "ch12-ci-cd-for-rag": {
    objectives: [
      "Explain why a RAG pipeline needs component unit tests, eval CI, and integration tests as separate gates.",
      "Design a CI pipeline that blocks merges when golden-dataset quality regresses beyond an explicit threshold.",
      "Connect pre-merge evaluation to staged canary rollout so regressions are caught at every boundary.",
    ],
    sections: [
      {
        heading: "Why stochastic systems need eval gates",
        paragraphs: [
          "A prompt edit, a chunking change, or a retriever tweak can pass every code review and unit test while silently degrading answer quality, because RAG behavior is stochastic rather than deterministic. Traditional CI proves the code runs; it says nothing about whether the answers are still faithful and relevant.",
          "The fix is to treat quality as a merge condition. Just as a failing test blocks a merge, a failing evaluation must block it too. LLMOps is disciplined software delivery adapted for stochastic systems: the discipline is the same, but the test suite includes measured answer quality.",
        ],
      },
      {
        heading: "Component unit tests",
        paragraphs: [
          "The first layer tests each pipeline component in isolation: the chunker, the embedder, the retriever, and the prompt. These tests are fast and cheap, and they pin each component's contract — for example, that the chunker produces the expected sizes and overlap for a given input.",
          "Isolated tests matter because RAG failures are compositional. When an end-to-end answer degrades, green component tests tell you which stages still honor their contracts, shrinking the search space to the interaction between stages instead of the whole pipeline.",
        ],
      },
      {
        heading: "Eval CI on a golden dataset",
        paragraphs: [
          "The second layer runs an evaluation framework such as RAGAS or DeepEval against a golden dataset on every pull request. The gate is concrete: block the merge if quality drops more than 3%. The exact number matters less than the fact that it is explicit, measured, and enforced by the pipeline rather than by human judgment.",
          "The golden dataset is itself a release artifact. It must represent real traffic, and it must grow: when a regression escapes into production, the post-mortem adds the query types that caused it to the golden set before the rollout is retried. A stale or unrepresentative set quietly converts the gate into decoration.",
        ],
      },
      {
        heading: "Integration tests and staged rollout",
        paragraphs: [
          "The third layer tests the assembled pipeline end to end with synthetic queries, catching contract mismatches between stages that isolated tests cannot see — for example, a retriever output shape the prompt builder does not handle.",
          "Even three green layers are not a release. The final step is a canary deployment that advances 5% -> 25% -> 100% while quality metrics are monitored at each step, so production traffic itself becomes the last gate with the smallest possible blast radius.",
        ],
      },
    ],
    example: {
      title: "Worked example: a prompt change that silently degrades grounding",
      scenario: "A retrieval team opens a pull request that rewrites the answer prompt to be more concise. All unit tests pass and the diff looks harmless, but the eval CI stage reports faithfulness on the golden dataset down 4% — past the 3% merge-blocking threshold.",
      analysis: "The regression is invisible to code review and unit tests: the shorter answer format is dropping the evidence sentences that grounded the claims. Because evaluation runs on every pull request, the change is stopped at the merge boundary instead of being discovered by users days later.",
      decision: "Block the merge, inspect which golden queries lost faithfulness, revise the prompt so citations survive, and re-run the suite. Ship only after the golden metrics return to baseline, and still release through the 5% -> 25% -> 100% canary stages.",
    },
    productionChecklist: [
      "Unit-test the chunker, embedder, retriever, and prompt builder against deterministic fixtures.",
      "Run RAGAS/DeepEval on a versioned golden dataset for every pull request.",
      "Block merges when quality drops beyond an explicit threshold, such as 3%.",
      "Test the assembled pipeline end to end with synthetic queries before release.",
      "Roll out 5% -> 25% -> 100% while monitoring quality metrics at each step.",
    ],
    commonMistakes: [
      "Reviewing prompt and chunking changes as plain code with no behavioral evaluation.",
      "Evaluating only on release night instead of on every pull request, so regressions ship and are found by users.",
      "Gating on a stale or unrepresentative golden dataset that no longer matches real traffic.",
      "Skipping integration tests because every component test passes in isolation.",
    ],
    knowledgeChecks: [
      {
        id: "ch12-ci-cd-for-rag-kc-1",
        prompt: "A team is about to merge a retriever configuration change that passed code review, and the tech lead wants one pipeline safeguard that stops silent quality regressions before the merge lands. Which safeguard should they add?",
        options: [
          "An eval CI stage that runs RAGAS or DeepEval on a golden dataset for every pull request and blocks the merge when quality drops more than 3%",
          "A nightly batch job that re-runs the full evaluation suite and emails a report the next morning",
          "A policy requiring two senior engineers to approve every retriever diff in code review",
        ],
        correct: 0,
        feedback: "Correct — the eval CI step gates every pull request on golden-dataset quality and blocks merges past a 3% drop, catching stochastic regressions that code review cannot see.",
      },
      {
        id: "ch12-ci-cd-for-rag-kc-2",
        prompt: "In this lesson's worked example, a concise-prompt pull request drops golden-set faithfulness by four percent while every unit test stays green. What should the pipeline and the team do next?",
        options: [
          "Merge anyway, because unit tests are the authoritative gate for prompt changes",
          "Block the merge, find which golden queries lost faithfulness, revise the prompt, and re-run the suite before any canary rollout",
          "Merge and rely on the canary stage to catch the faithfulness drop at five percent traffic",
        ],
        correct: 1,
        feedback: "Correct — merges are blocked beyond a 3% quality drop, so this pull request fails the gate; canary stages are the last line of defense, not a substitute for pre-merge evaluation.",
      },
      {
        id: "ch12-ci-cd-for-rag-kc-3",
        prompt: "Three weeks after launch, users report that answers stopped citing sources. Component tests for the chunker, embedder, retriever, and prompt builder are all green. Which missing test layer most likely let this regression through?",
        options: [
          "More granular unit tests for the embedding model's tokenizer",
          "A second human code review of the answer prompt template",
          "End-to-end integration tests that run synthetic queries through the assembled pipeline",
        ],
        correct: 2,
        feedback: "Correct — isolated component tests are paired with integration tests over synthetic queries, because green components can still compose badly and only the assembled path reveals it.",
      },
      {
        id: "ch12-ci-cd-for-rag-kc-4",
        prompt: "A manager argues that running RAGAS on every pull request slows the team down and proposes evaluating only before major releases. How should an engineer defend per-pull-request evaluation?",
        options: [
          "Stochastic components can regress from a one-line prompt or chunking edit, so quality must be a merge condition; release-night evaluation finds problems only after they are queued to ship",
          "Concede, and replace per-PR evaluation with a larger canary cohort at release time",
          "Compromise by evaluating only pull requests that touch the language model integration",
        ],
        correct: 0,
        feedback: "Correct — eval CI runs on every pull request with a merge-blocking 3% threshold, because small innocent-looking edits to stochastic components are exactly what code review misses.",
      },
      {
        id: "ch12-ci-cd-for-rag-kc-5",
        prompt: "All three pre-merge test layers pass for a new retriever version. According to the chapter's release practice, what remains before the change may serve all production traffic?",
        options: [
          "Nothing — three green test layers are sufficient evidence for a full rollout",
          "A canary rollout advancing 5% to 25% to 100% of traffic, with quality metrics monitored at each step",
          "A week-long 50/50 A/B test to maximize statistical power before any promotion decision",
        ],
        correct: 1,
        feedback: "Correct — the final CI/CD step is a staged 5% -> 25% -> 100% canary with quality monitoring at each step, making live traffic the last gate with the smallest blast radius.",
      },
    ],
  },
  "ch12-model-versioning": {
    objectives: [
      "Enumerate every RAG component whose version affects system behavior.",
      "Set up config-managed, Git-versioned component versions that increment immutably.",
      "Explain how complete versioning enables reproducibility and instant rollback.",
    ],
    sections: [
      {
        heading: "The system is the version set",
        paragraphs: [
          "A RAG answer is the product of several independently changing artifacts: the embedding model, the LLM, the prompt template, and the chunking config. Recording a version for only one of them — usually the LLM — leaves the others as invisible variables, so two deployments that look identical can behave differently.",
          "The rule is therefore to tag every component with a version. The meaningful unit of release is the bundle of versions, not any single model. When someone asks 'what changed?', the answer should be a diff between two explicit version sets, not an investigation.",
        ],
      },
      {
        heading: "Config management plus Git",
        paragraphs: [
          "Versions live in configuration management such as Hydra and Dynaconf, and the configuration itself is version-controlled in Git. The deployment reads a committed config, so what is live is exactly what is in the repository, and a git log is a deployment history.",
          "This closes the gap between 'the code we run' and 'the system we run'. In a RAG product, much of the behavior lives in configuration rather than code; putting that configuration under the same version control as code is what makes the whole system auditable.",
        ],
      },
      {
        heading: "Increment, never overwrite",
        paragraphs: [
          "The rule is explicit: increment versions on any change and never overwrite. An overwritten version destroys history — you can no longer reproduce what ran last month, and you cannot tell whether a behavior change came from a new artifact or from a mutated old one.",
          "Immutability also disciplines the team. A one-line prompt tweak is a new version with its own evaluation gate and canary rollout, exactly like a model swap. Small changes are cheap to version and expensive to debug when they ride along untracked.",
        ],
      },
      {
        heading: "Versioning as the foundation of rollback",
        paragraphs: [
          "Complete versioning is what makes rollback a control-plane action instead of a rebuild. When artifacts are named after the version that produced them — such as keeping the docs-emb-v1 vector collection alongside docs-emb-v2 — rolling back an embedding model is a pointer change, because the old index still exists and no recomputation is needed.",
          "The same property serves audits and post-mortems. If every release is an immutable, complete version set, any historical answer can be reproduced by redeploying its exact bundle, and any regression can be bisected across versions.",
        ],
      },
    ],
    example: {
      title: "Worked example: reconstructing a release for an audit",
      scenario: "Compliance asks why the assistant's answers changed in March. Because every deployment reads a Git-versioned config, the team diffs two releases: v14 pinned embedding model e1, LLM g4, prompt template p6, and chunking config c2; v15 bumped only the embedding model to e2 and left everything else unchanged.",
      analysis: "The single-component diff isolates the cause of the behavior change immediately, with no archaeology. Nothing was overwritten, so the team can also redeploy v14 exactly as it ran — including the vector collection built with e1, which still exists under its versioned name.",
      decision: "Keep version bundles immutable and complete, and treat any component change — even a prompt edit — as a new version that passes through the same evaluation gate and staged rollout as a model upgrade.",
    },
    productionChecklist: [
      "Version the embedding model, LLM, prompt template, and chunking config independently.",
      "Store component versions in config management such as Hydra or Dynaconf.",
      "Keep every configuration version-controlled in Git.",
      "Increment versions on any change; never overwrite an existing version.",
      "Name versioned artifacts, such as vector collections, after the component version that built them.",
    ],
    commonMistakes: [
      "Versioning only the LLM while prompt and chunking changes ship untracked.",
      "Editing a live config in place instead of committing a new version.",
      "Reusing a version tag after a change, which makes history ambiguous.",
      "Keeping versions outside Git, where they silently drift from what is actually deployed.",
    ],
    knowledgeChecks: [
      {
        id: "ch12-model-versioning-kc-1",
        prompt: "A platform team is writing the versioning policy for a RAG product. Which policy matches the chapter's rule for what must carry a version?",
        options: [
          "Version only the language model, because it dominates answer behavior",
          "Tag every component — embedding model, LLM, prompt template, and chunking config — because behavior is the product of all of them",
          "Version the entire application under one monolithic release number",
        ],
        correct: 1,
        feedback: "Correct — every component carries a version (embedding model, LLM, prompt template, chunking config); a single model or application version leaves invisible variables that still change behavior.",
      },
      {
        id: "ch12-model-versioning-kc-2",
        prompt: "In this lesson's audit example, the team diffs release v14 against v15 and finds that only the embedding model moved from e1 to e2. What made this one-step diagnosis possible?",
        options: [
          "Engineers kept detailed personal notes about each deployment in a shared document",
          "The monitoring dashboard happened to flag the embedding service that month",
          "Every deployment reads an immutable Git-versioned config that pins each component, so history is a diff between explicit version sets",
        ],
        correct: 2,
        feedback: "Correct — component versions live in config management under Git and are never overwritten, turning 'what changed?' into a config diff instead of an investigation.",
      },
      {
        id: "ch12-model-versioning-kc-3",
        prompt: "A team overwrites its production config in place to fix a prompt typo. Two months later it cannot reproduce a customer's reported answer or say exactly what was live at the time. Which versioning rule did the team violate?",
        options: [
          "Increment versions on any change and never overwrite an existing version",
          "Store the embedding model weights in the same Git repository as the code",
          "Run the full evaluation suite before every configuration edit",
        ],
        correct: 0,
        feedback: "Correct — the rule is to increment on any change and never overwrite; in-place edits destroy the history that reproduction, audit, and rollback all depend on.",
      },
      {
        id: "ch12-model-versioning-kc-4",
        prompt: "An engineer complains that creating a new config version for a one-line prompt tweak is bureaucratic overhead. How should the tech lead defend the practice using the chapter's reasoning?",
        options: [
          "Agree, and let small prompt edits bypass versioning whenever the change looks safe",
          "A one-line prompt edit is a behavior change in a stochastic system, so it needs the same immutable version, evaluation gate, and staged rollout as a model swap",
          "Compromise by batching prompt edits into one weekly versioned commit",
        ],
        correct: 1,
        feedback: "Correct — prompt templates are versioned as first-class components and incremented on any change; bypasses and batches hide exactly the small edits that cause silent regressions.",
      },
      {
        id: "ch12-model-versioning-kc-5",
        prompt: "A new embedding model e2 is about to replace e1 in production. Which artifact-naming and versioning practice keeps rollback instant, according to the chapter?",
        options: [
          "Rebuild the existing vector collection in place with e2 so storage stays clean",
          "Record the upgrade in the release notes so operators know e2 is live",
          "Keep the version-named collections docs-emb-v1 and docs-emb-v2 side by side, so rollback is a pointer flip back to the intact v1 index",
        ],
        correct: 2,
        feedback: "Correct — the rollback answer relies on blue-green versioning: the old version's artifacts persist, so restoring service is a config change with no recomputation.",
      },
    ],
  },
  "ch12-a-b-testing-and-canary-deployment": {
    objectives: [
      "Design a staged canary rollout with metric-gated promotion steps.",
      "Explain why passing offline evaluation is not sufficient evidence for full traffic.",
      "Connect canary analysis to rollback so a failed gate leaves the previous version serving.",
    ],
    sections: [
      {
        heading: "Why stage exposure",
        paragraphs: [
          "Offline evaluation runs on a fixed dataset, but production traffic always contains queries the dataset does not represent. A model or prompt can pass every offline gate and still regress on live traffic — which is exactly why the rollback post-mortem asks whether the canary eval set was representative.",
          "Staged exposure limits the blast radius of that residual risk. Each step is a small experiment: a minority of users see the new version while the majority stay on the proven one, and the experiment only expands when the evidence says it should.",
        ],
      },
      {
        heading: "The rollout shape",
        paragraphs: [
          "The canary rollout advances through explicit steps: 5% of traffic with a ten-minute pause, then 25% with a thirty-minute pause, then 100%. Pauses give quality metrics time to accumulate at each step before more traffic is exposed.",
          "Promotion is metric-gated, not schedule-gated. The rollout attaches an analysis template — the example checks faithfulness against a minimum of 0.85 — and a step that fails its analysis stops the rollout. Time passing is not evidence; the metric clearing its floor is.",
        ],
      },
      {
        heading: "Version tagging and attribution",
        paragraphs: [
          "The rollout carries canary metadata labeling the release with its component version, such as model-version v2. That label is what makes dashboards, alerts, and rollbacks attributable: when a metric moves, everyone knows which version moved it.",
          "Attribution closes the loop with the versioning discipline from the rest of the chapter. A canary without version labels produces telemetry you cannot act on, because you cannot roll back what you cannot identify.",
        ],
      },
      {
        heading: "When the gate fails",
        paragraphs: [
          "A failed analysis halts promotion while the previous version keeps serving, so the user-facing impact stays limited to the small canary cohort. Because the old version's artifacts were kept — the blue-green pattern — returning traffic to it is a configuration change, not a rebuild.",
          "The incident is not finished at the halt. The follow-up asks why the earlier gates missed the regression: analyze which query types caused the drop, and add those query types to the golden dataset before retrying the rollout. Each escape makes the evaluation set stronger.",
        ],
      },
    ],
    example: {
      title: "Worked example: canarying embedding model v2",
      scenario: "A team promotes embedding model v2 with an Argo Rollout: 5% of traffic with a ten-minute pause while a faithfulness-check analysis requires at least 0.85, then 25% for thirty minutes, then 100%, with canary metadata labeling the release model-version v2.",
      analysis: "At 5%, only a small cohort sees the new embeddings while the analysis template compares live faithfulness against the 0.85 floor. If the gate trips, promotion stops and traffic returns to v1's collection with no index rebuild, because the blue-green setup kept the v1 index intact. If a regression slips past the gate and appears at 25%, the same pointer flip still fixes it in minutes.",
      decision: "Adopt the staged rollout with the analysis template wired to the same metrics used in eval CI, label every rollout with its component version, and add any query types that fail in later stages to the golden dataset before retrying.",
    },
    productionChecklist: [
      "Start canaries small, around 5% of traffic, and advance through explicit steps.",
      "Pause between steps long enough for quality metrics to accumulate.",
      "Gate each promotion on automated analysis, such as a minimum faithfulness of 0.85.",
      "Label every rollout with the component version for attribution.",
      "Keep the previous version's artifacts live so rollback stays a configuration change.",
    ],
    commonMistakes: [
      "Treating a passed offline evaluation as permission to ship to 100% at once.",
      "Advancing on a schedule with no metric gate at each step.",
      "Running a canary without version labels, so telemetry cannot be attributed to a release.",
      "Decommissioning the previous version's index before the new one has proven itself at full traffic.",
    ],
    knowledgeChecks: [
      {
        id: "ch12-a-b-testing-and-canary-deployment-kc-1",
        prompt: "A fine-tuned LLM version has passed every offline evaluation. Under the chapter's canary pattern, which rollout plan should the team execute?",
        options: [
          "Switch all traffic immediately, since offline evaluation already validated the release",
          "Run a 50/50 traffic split for a week to reach statistical confidence quickly",
          "Advance 5% to 25% to 100% with pauses, gating each promotion on automated analysis such as a minimum faithfulness of 0.85",
        ],
        correct: 2,
        feedback: "Correct — the rollout moves through 5%, 25%, and 100% steps with pauses and a faithfulness-check analysis template, so each promotion is earned by live metrics.",
      },
      {
        id: "ch12-a-b-testing-and-canary-deployment-kc-2",
        prompt: "In this lesson's Argo Rollout example, the release is labeled model-version v2 and the first step sends five percent of traffic for ten minutes while a faithfulness-check analysis requires at least 0.85. What happens if live faithfulness falls below that floor?",
        options: [
          "The analysis stops promotion, holding traffic at the canary level while the previous version keeps serving the rest",
          "The rollout automatically advances to 25 percent to gather more data",
          "The threshold is temporarily lowered to see whether the metric recovers",
        ],
        correct: 0,
        feedback: "Correct — in the canary pattern a failed analysis template halts the rollout at its current step, limiting impact to the small canary cohort while the previous version keeps serving.",
      },
      {
        id: "ch12-a-b-testing-and-canary-deployment-kc-3",
        prompt: "A rollout reaches 100 percent and faithfulness later craters from 0.91 to 0.73. The post-mortem finds the canary showed no warning. What does the chapter say to investigate first?",
        options: [
          "Whether the canary steps were too small, so the next rollout starts at 25 percent",
          "Whether the canary evaluation set was representative of the live traffic that regressed",
          "Whether faithfulness is an unreliable metric that should be replaced with latency monitoring",
        ],
        correct: 1,
        feedback: "Correct — the rollback post-mortem explicitly asks why the canary missed the drop and whether its eval set was representative, then adds the failing query types to the golden dataset.",
      },
      {
        id: "ch12-a-b-testing-and-canary-deployment-kc-4",
        prompt: "A product manager pushes to skip the 5 and 25 percent steps because they delay the launch by forty minutes. Which defense of the staged steps best reflects the chapter?",
        options: [
          "Agree — offline gates already passed, and time-to-launch is the priority",
          "Keep the steps but delete the pauses, because the analysis templates run instantly",
          "The steps cap blast radius while production evidence accumulates; offline sets cannot represent all live queries, and the pauses give quality metrics time to accumulate before promotion",
        ],
        correct: 2,
        feedback: "Correct — exposure is staged at 5%, 25%, and 100% with pauses precisely because offline evaluation cannot cover live traffic, and every step is a metric-gated experiment.",
      },
      {
        id: "ch12-a-b-testing-and-canary-deployment-kc-5",
        prompt: "Two model versions are being canaried by different teams in the same week. Which rollout hygiene practice from the chapter keeps production metrics attributable to the right release?",
        options: [
          "Canary metadata that labels each rollout with its component version, such as model-version v2",
          "Announcing each rollout in the team chat before it starts",
          "Scheduling the canaries in different weeks so dashboards never overlap",
        ],
        correct: 0,
        feedback: "Correct — the rollout carries canary metadata labeling the release with its component version, which is what makes dashboards, alerts, and rollback attributable.",
      },
    ],
  },
};

export const chapter12Practice: CatalogPracticeUnit[] = [
  {
    id: "ch12-12-2-1",
    chapter: 12,
    chapterTitle: "Deployment & LLMOps",
    title: "How do you deploy RAG at scale?",
    pages: "82",
    route: "/practice/deployment-and-llmops/how-do-you-deploy-rag-at-scale",
    competencies: ["CI/CD", "versioning", "canary", "rollback", "Kubernetes", "multi-region"],
    question: "In a staff-level interview you are asked: \"Walk me through deploying a production RAG system on Kubernetes at scale.\" Which answer is strongest?",
    options: [
      {
        text: "Lay out the full tiered topology — FastAPI API pods behind an ingress with HPA on CPU and request-queue depth, a separate GPU embedding service that batches requests and autoscales on GPU utilization, vLLM on a GPU node pool with a PodDisruptionBudget keeping at least two pods running, a Weaviate/Qdrant StatefulSet with persistent volumes and anti-affinity across AZs, a Redis cache StatefulSet, and Kafka for async ingestion — then add a warm-standby second region with DNS-based failover, Kafka-replicated vector data, and stated targets like RPO 60 seconds and RTO 2 minutes.",
        correct: true,
        feedback: "Correct. The staff-level answer specifies separate API, embedding, LLM, vector, cache, and queue tiers with GPU node pools, PodDisruptionBudgets, AZ anti-affinity, and a multi-region RPO/RTO — operational completeness, not just 'deploy the container'.",
      },
      {
        text: "Containerize the application, run it on Kubernetes with several replicas behind a load balancer, and let the cluster autoscaler handle growth.",
        correct: false,
        feedback: "This is the junior 'put it on Kubernetes' answer the interview rubric warns about — no tier separation, no GPU node pools, no disruption budgets or AZ spread, and no failover targets.",
      },
      {
        text: "Deploy the whole RAG pipeline as one monolithic pod per region so every component shares the same scaling policy and lifecycle.",
        correct: false,
        feedback: "Collapsing every tier into one pod couples GPU-hungry embedding and LLM stages to API scaling and lifecycle, and the answer says nothing about PDBs, anti-affinity, or multi-region RPO/RTO.",
      },
    ],
  },
  {
    id: "ch12-12-2-2",
    chapter: 12,
    chapterTitle: "Deployment & LLMOps",
    title: "How do you roll back a bad model?",
    pages: "82",
    route: "/practice/deployment-and-llmops/how-do-you-roll-back-a-bad-model",
    competencies: ["CI/CD", "versioning", "canary", "rollback", "Kubernetes", "multi-region"],
    question: "A senior-level interviewer says: \"You deployed a new embedding model and faithfulness dropped from 0.91 to 0.73 in production. How do you roll back?\" Which response best demonstrates ownership?",
    options: [
      {
        text: "Redeploy the previous container image and wait for the old embedding model to re-embed the corpus so the index returns to its earlier state.",
        correct: false,
        feedback: "Rebuilding embeddings makes rollback a slow data-plane project; the key point is that blue-green keeps the v1 index alive, so rollback should be an instant config change with no recomputation.",
      },
      {
        text: "Flip the routing config — point the embedding model back to v1, route 100% of traffic to the old vector collection (docs-emb-v1), disable dual-write to the v2 collection, and fire an alert naming the faithfulness regression — then run a post-mortem on why the canary missed it and add the failing query types to the golden dataset before retrying.",
        correct: true,
        feedback: "Correct. This is the senior-level answer: rollback is an instant control-plane pointer flip (minutes, not a rebuild) because blue-green keeps the v1 index intact, followed by a post-mortem that improves the evaluation set — reversible by design plus learning.",
      },
      {
        text: "Keep v2 serving while engineers patch prompts to recover faithfulness, since the new index took hours to build and abandoning it wastes that work.",
        correct: false,
        feedback: "Serving a known-bad model to protect sunk build cost ignores a live 0.91 -> 0.73 regression; the correct move is immediate rollback to the intact v1 index, then analysis of what the canary missed.",
      },
    ],
  },
  {
    id: "ch12-12-2-3",
    chapter: 12,
    chapterTitle: "Deployment & LLMOps",
    title: "How do you test RAG systems before release?",
    pages: "83",
    route: "/practice/deployment-and-llmops/how-do-you-test-rag-systems-before-release",
    competencies: ["CI/CD", "versioning", "canary", "rollback", "Kubernetes", "multi-region"],
    question: "An interviewer asks: \"What is your complete testing strategy for a RAG system before releasing to production?\" Which answer earns the strongest rating?",
    options: [
      {
        text: "Run the pipeline end to end on a handful of representative queries and sign off when the answers look right.",
        correct: false,
        feedback: "A few eyeball-checked queries are the junior 'test the pipeline' answer — no pyramid, no numeric pass bars, and no security or load coverage.",
      },
      {
        text: "Focus testing on the language model's answer quality, since retrieval components are deterministic and rarely fail.",
        correct: false,
        feedback: "The test pyramid unit-tests the chunker, metadata extractor, and prompt builder, and component-tests retrieval with Recall@5 — pipeline stages fail independently of the model.",
      },
      {
        text: "Apply a test pyramid with concrete gates: unit tests for chunker sizing and overlap, metadata extraction on mock documents, and prompt-builder context injection and token counts; component tests such as Recall@5 at least 0.80 on a labeled golden set and improved Precision@5 after re-ranking; integration tests on 50 golden queries requiring faithfulness at least 0.85 and answer relevancy at least 0.80 with P95 end-to-end within 3 seconds; security tests blocking 20 known injection payloads and proving tenant isolation; and load tests at 1000 concurrent requests with no degradation versus baseline.",
        correct: true,
        feedback: "Correct. The senior-level answer is a pyramid with numeric pass bars at every level, and it includes security (injection payloads, tenant isolation) and load tests — the differentiators over 'it works'.",
      },
    ],
  },
  {
    id: "ch12-12-2-4",
    chapter: 12,
    chapterTitle: "Deployment & LLMOps",
    title: "How do you handle multi-region deployment?",
    pages: "83",
    route: "/practice/deployment-and-llmops/how-do-you-handle-multi-region-deployment",
    competencies: ["CI/CD", "versioning", "canary", "rollback", "Kubernetes", "multi-region"],
    question: "A staff-level prompt says: \"Design a globally distributed RAG system with users in the US, EU, and Asia.\" What should the strongest answer include?",
    options: [
      {
        text: "Route users at the edge (CloudFront/Cloudflare) to the nearest region to cut 100-200ms of RTT; index documents regionally for data residency — EU documents in the EU index for GDPR — with no cross-region queries; run self-hosted LLMs per region or region-specific API endpoints; replicate only knowledge not subject to residency rules globally; use eventual consistency for the knowledge base but strong consistency for user data and access logs; and fail over through the API gateway to the nearest healthy region with a latency warning surfaced to the user.",
        correct: true,
        feedback: "Correct. The staff-level answer treats compliance and consistency as first-class constraints: regional indexes for residency, no cross-region queries, eventual consistency for the knowledge base, strong consistency for user data, and explicit failover behavior.",
      },
      {
        text: "Deploy identical stacks in every region behind one globally replicated vector index, so any region can answer any user's query.",
        correct: false,
        feedback: "One global index violates data residency — the design requires regional indexes (EU documents in the EU region under GDPR) with no cross-region queries, for both latency and privacy reasons.",
      },
      {
        text: "Serve all traffic from a single well-provisioned primary region and rely on CDN caching to keep latency acceptable for EU and Asia.",
        correct: false,
        feedback: "A single region ignores data residency, adds the 100-200ms of RTT that edge routing exists to remove, and offers no regional failover — the opposite of the prescribed design.",
      },
    ],
  },
];
