import type { CatalogPracticeUnit } from "../pdfCatalog";

// Chapter 16 — 20 Top System Design Questions & Answers (pp. 97-106).
// The chapter carries thirteen interview drills (16.0.1-16.0.13); each drill's
// correct answer and feedback are rewritten from the sample answers and
// "What Separates a Senior Answer" guidance for that question.
export const chapter16Practice: CatalogPracticeUnit[] = [
  {
    id: "ch16-16-0-1",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "How do you build a robust RAG system end to end?",
    pages: "97",
    route: "/practice/top-system-design-questions/how-do-you-build-a-robust-rag-system-end-to-end",
    competencies: ["system design", "interview"],
    question:
      "In a staff-level system design round, the interviewer says: \"Walk me through how you would build a robust RAG system end to end for a production use case.\" Which answer structure is strongest?",
    options: [
      {
        text: "Describe a layered pipeline where every stage—ingestion, indexing, retrieval, reranking, generation, evaluation, monitoring—carries a named owner, a target metric, and a fallback (Recall@20 ≥ 0.90, Precision@5 ≥ 0.80, faithfulness ≥ 0.85, P95 ≤ 3s), then give explicit if/then routing between failure modes so any single component failure degrades gracefully instead of producing a confident wrong answer.",
        correct: true,
        feedback:
          "Correct. The staff answer attaches a measurable target and fallback to each stage and routes between failure modes—for example, low recall means fix chunking and embeddings before the prompt, and top-1 similarity below the calibrated threshold triggers a fallback rather than an improvised answer.",
      },
      {
        text: "Walk through the standard stages—ingestion, indexing, retrieval, generation—naming a popular tool for each, and note that a vector database plus a well-written prompt covers most of the work.",
        correct: false,
        feedback:
          "Listing stages and tools is exactly the junior answer the chapter calls out: \"vector DB plus prompt\" has no per-stage metrics, no failure routing, and no graceful degradation story.",
      },
      {
        text: "Pick the highest-scoring component for each stage from public leaderboards, wire them together, and validate the assembled system with average end-to-end answer quality.",
        correct: false,
        feedback:
          "Leaderboard picks plus one average score hide stage-level failures; the robust design is built around per-stage thresholds, CI regression gates, dedup and embedding version control, and drift monitoring.",
      },
    ],
  },
  {
    id: "ch16-16-0-2",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "What folder structure would you use for a production RAG system?",
    pages: "98",
    route: "/practice/top-system-design-questions/what-folder-structure-would-you-use-for-a-production-rag-system",
    competencies: ["system design", "interview"],
    question:
      "A mid-level interview asks: \"What folder structure would you use for a production RAG system so the codebase stays maintainable?\" What does the strongest answer include?",
    options: [
      {
        text: "Keep everything in one notebook-heavy repository so the team can iterate quickly, and split code into packages only when the repo becomes painful to navigate.",
        correct: false,
        feedback:
          "A notebook-heavy repo is what the senior answer explicitly moves away from; it gives no separation between batch ingestion, latency-sensitive serving, and evaluation, so ownership and testing stay muddy.",
      },
      {
        text: "A domain-oriented layout: apps/ for api, worker, and eval_runner; src/ split by pipeline concern (ingestion, chunking, embeddings, indexing, retrieval, reranking, prompting, generation, memory, caching, observability, security); versioned configs/ so prompts, chunkers, and model versions change without code edits; tests/ with eval beside unit and integration; infra/ as code—plus an if/then for when worker and model serving split into separate deployables.",
        correct: true,
        feedback:
          "Correct. The senior answer ties structure to operational reality: batch vs latency-sensitive paths, independent scaling of ingestion vs serving, config-as-code, and evaluation and observability living alongside the runtime rather than outside it.",
      },
      {
        text: "Create one microservice repository per pipeline stage from day one—ingestion, retrieval, and generation each get their own repo, CI pipeline, and deployment.",
        correct: false,
        feedback:
          "Splitting every stage into its own repo up front over-engineers a small early team; the decision rule keeps a single modular monorepo until ingestion throughput or LLM serving must scale independently.",
      },
    ],
  },
  {
    id: "ch16-16-0-3",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "How do you choose the right RAG framework?",
    pages: "99",
    route: "/practice/top-system-design-questions/how-do-you-choose-the-right-rag-framework",
    competencies: ["system design", "interview"],
    question:
      "The interviewer asks: \"How do you choose the right RAG framework such as LangChain, LlamaIndex, Haystack, or a custom stack?\" Which response demonstrates senior judgment?",
    options: [
      {
        text: "Default to LangChain because it is the most popular option with the most connectors; framework choice rarely matters once the prototype works.",
        correct: false,
        feedback:
          "\"LangChain is popular, use that\" is the junior answer the chapter names; popularity ignores abstraction churn and the risk of the framework hiding your latency-critical path.",
      },
      {
        text: "Build the entire stack custom from day one—frameworks always hide too much, and full control is the only way to hit a latency SLA.",
        correct: false,
        feedback:
          "Full-custom from day one throws away the speed-of-development axis; start on a framework while you are still discovering the problem and peel off hot-path components only when an SLA demands it.",
      },
      {
        text: "Choose on three axes—control, speed of development, and operational complexity—mapping each option to its workload (LangChain/LangGraph for rapid prototyping and agent graphs, LlamaIndex for ingestion-heavy doc-centric apps, Haystack for pipeline-style on-prem with strong eval tooling, thin custom for stable latency-sensitive systems), and never let a framework hide the critical path: retrieval logic, prompt construction, evaluation, and observability stay in a thin, testable layer you own.",
        correct: true,
        feedback:
          "Correct. The senior answer treats framework choice as a control-vs-velocity trade-off with a concrete cost per option and an explicit boundary: hot-path components with an SLA get peeled onto a layer you own even if the rest stays on the framework.",
      },
    ],
  },
  {
    id: "ch16-16-0-4",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "How do you design the ingestion and indexing pipeline?",
    pages: "100",
    route: "/practice/top-system-design-questions/how-do-you-design-the-ingestion-and-indexing-pipeline",
    competencies: ["system design", "interview"],
    question:
      "During a senior system design interview you are asked: \"What does a good ingestion and indexing pipeline look like in a robust RAG system?\" Which answer stands out?",
    options: [
      {
        text: "A linear flow—parse, clean, chunk, embed, upsert into the vector store—run as a full reload whenever documents change so the index always reflects the latest corpus.",
        correct: false,
        feedback:
          "A one-shot linear load with full reloads is the junior answer; it has no idempotency key, no version tags, no tombstones, and re-embeds unchanged content at full cost.",
      },
      {
        text: "An asynchronous, idempotent, versioned pipeline—connector, parse, clean, chunk, metadata enrichment, batched embedding, indexing to both vector and lexical stores—keyed by a content hash so re-processing is a no-op, with every chunk tagged doc_id/hash/emb_model/indexed_at, delete-by-doc_id then re-insert on change, tombstones for source deletions, and a background blue-green backfill into a new collection when the chunking or embedding strategy changes.",
        correct: true,
        feedback:
          "Correct. The senior answer designs for re-runs and partial failures: content-hash idempotency, per-chunk embedding-model versioning, explicit delete handling within the freshness SLA, and zero-downtime strategy changes.",
      },
      {
        text: "Upsert new chunks alongside existing ones keyed by chunk position so old and new versions coexist; the retriever's top-k will naturally prefer the freshest content.",
        correct: false,
        feedback:
          "Coexisting versions leave orphan chunks that keep surfacing in retrieval; the rule is explicit: delete by doc_id then re-insert, never leave orphans, and write a tombstone when a document is deleted at source.",
      },
    ],
  },
  {
    id: "ch16-16-0-5",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "How do you structure the generation layer for grounded answers?",
    pages: "100",
    route: "/practice/top-system-design-questions/how-do-you-structure-the-generation-layer-for-grounded-answers",
    competencies: ["system design", "interview"],
    question:
      "The interviewer follows up: \"How do you structure the generation layer so the model stays grounded in the retrieved context?\" What is the strongest answer?",
    options: [
      {
        text: "Treat grounding as a contract plus a verification step: a prompt that strictly separates evidence from instructions, forces per-claim citations, and defines an explicit abstention token; structured output for answer/citations/is_grounded; post-hoc NLI checks that drop or abstain on any claim whose citation fails the entailment threshold; and temperature pinned near zero with machine-checkable output for high-stakes domains.",
        correct: true,
        feedback:
          "Correct. The principle is never to trust the model to self-ground—constrain it with a prompt contract and abstention path, then verify every citation post-hoc against a numeric entailment threshold.",
      },
      {
        text: "Write a clear system prompt telling the model to answer only from the provided context; modern instruction-following models comply reliably enough that extra machinery is wasted latency.",
        correct: false,
        feedback:
          "This is the \"tell the model to use the context\" junior answer the chapter contrasts with; without an abstention contract and post-hoc verification, unsupported claims pass as grounded.",
      },
      {
        text: "Add several few-shot examples of well-cited answers so the model learns the citation format, and sample at a moderate temperature to keep answers natural.",
        correct: false,
        feedback:
          "Few-shot formatting teaches style, not entailment; the chapter requires structured output plus an NLI check per citation, and for high-stakes use cases temperature at or below 0.1 rather than moderate sampling.",
      },
    ],
  },
  {
    id: "ch16-16-0-6",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "How do you integrate RAG with cloud infrastructure?",
    pages: "101",
    route: "/practice/top-system-design-questions/how-do-you-integrate-rag-with-cloud-infrastructure",
    competencies: ["system design", "interview"],
    question:
      "In a cloud architecture segment, you are asked: \"How would you integrate a RAG system with cloud infrastructure in a secure and scalable way?\" Choose the best response.",
    options: [
      {
        text: "Deploy the working prototype onto a large VM in one cloud region, store API keys in environment files for simplicity, and add a second VM when traffic grows.",
        correct: false,
        feedback:
          "\"Deploy it on AWS\" with long-lived keys in env files is the junior answer the chapter names; it skips plane separation, least-privilege IAM, secrets management, and horizontal scaling.",
      },
      {
        text: "Commit fully to one vendor's proprietary services for embeddings, vector search, and generation so the integration is as tight as possible; portability concerns are usually overstated.",
        correct: false,
        feedback:
          "Deep proprietary coupling with no abstraction ignores the lock-in guidance: keep a thin abstraction around embeddings, vector search, and model endpoints so vendors stay swappable.",
      },
      {
        text: "Split the design into a data plane (object storage, managed vector search, model endpoints, cache, queue) and a control plane (CI/CD, Terraform, secrets manager, IAM); keep the API stateless behind a load balancer and run ingestion on queues plus workers so spikes never touch the request path; build security in by default—VPC isolation, least-privilege IAM, short-lived credentials, encryption in transit and at rest—and pin regional indexes and endpoints where data residency requires it.",
        correct: true,
        feedback:
          "Correct. The senior answer separates data and control planes, names concrete managed services per responsibility, keeps the request path stateless and ingestion async, and treats security-by-default and vendor portability as design requirements.",
      },
    ],
  },
  {
    id: "ch16-16-0-7",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "How do you design memory for conversational RAG?",
    pages: "102",
    route: "/practice/top-system-design-questions/how-do-you-design-memory-for-conversational-rag",
    competencies: ["system design", "interview"],
    question:
      "The interviewer asks: \"How do you design memory for conversational RAG without polluting retrieval?\" Which design earns the strongest rating?",
    options: [
      {
        text: "Keep conversation memory and the knowledge index in separate stores with three explicit tiers—session memory for active turns, a rolling summary tier with token-cap eviction, and an opt-in long-term profile that is tenant-scoped and deletable; resolve references like \"it\" against session memory before retrieving, and gate anything long-term by relevance and policy instead of appending it blindly.",
        correct: true,
        feedback:
          "Correct. The core principle is that personal context and domain documents must not share one search space; each tier carries retention and eviction rules, and every memory record is auditable and deletable for privacy compliance.",
      },
      {
        text: "Embed each chat turn into the same vector store as the domain documents so one retrieval pass naturally blends personal context with knowledge.",
        correct: false,
        feedback:
          "Mixing chat turns into the knowledge index is exactly the pollution the question warns about: personal context and domain documents compete in one search space and retrieval degrades for both.",
      },
      {
        text: "Append the full conversation history to every prompt so the model always has complete context, truncating only when the context window fills.",
        correct: false,
        feedback:
          "\"Store the chat history\" and stuff it in the prompt is the junior answer; it ignores token caps, reference resolution before retrieval, and the relevance and policy gating required for long-term memory.",
      },
    ],
  },
  {
    id: "ch16-16-0-8",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "How do you manage context windows effectively?",
    pages: "102",
    route: "/practice/top-system-design-questions/how-do-you-manage-context-windows-effectively",
    competencies: ["system design", "interview"],
    question:
      "You are asked in a senior loop: \"How do you manage context windows so the prompt stays useful instead of becoming overloaded?\" What should the best answer cover?",
    options: [
      {
        text: "Truncate the retrieved context to whatever fits the model's window; the model will use what it gets, and longer windows mostly make the problem disappear.",
        correct: false,
        feedback:
          "\"Truncate to fit\" is the junior answer the chapter names; arbitrary truncation drops high-value evidence and ignores that answer quality falls once signal-to-noise drops, even when the tokens technically fit.",
      },
      {
        text: "Move to the largest-context model available and pass every retrieved chunk through; bigger windows are cheaper than the engineering time spent on selection.",
        correct: false,
        feedback:
          "Passing everything contradicts the finding that more context is not better; it also skips ranked selection, dedup, and the lost-in-the-middle placement effect the senior answer exploits.",
      },
      {
        text: "Treat context as an explicit token budget by section—instructions, evidence, memory, reserve for the response—and fill the evidence slot by reranker score, dropping near-duplicates, replacing low-priority documents with one-line summaries or compression, and placing the strongest and freshest evidence at the start and end of the context to counter the lost-in-the-middle effect.",
        correct: true,
        feedback:
          "Correct. The senior answer budgets tokens by section, truncates by reranker score rather than arbitrarily, compresses the tail, and positions key evidence at the edges because of the lost-in-the-middle effect.",
      },
    ],
  },
  {
    id: "ch16-16-0-9",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "How do you reduce token cost in a large-scale RAG system?",
    pages: "103",
    route: "/practice/top-system-design-questions/how-do-you-reduce-token-cost-in-a-large-scale-rag-system",
    competencies: ["system design", "interview"],
    question:
      "A cost-focused interviewer asks: \"How do you reduce token cost while keeping the system reliable?\" Which answer is strongest?",
    options: [
      {
        text: "Switch all traffic to the cheapest available model; per-token price dominates the bill, and users rarely notice quality differences on simple queries.",
        correct: false,
        feedback:
          "\"Use a cheaper model\" for everything is the junior answer the chapter names; unguarded downgrades hide the quality regressions you must catch with route-accuracy and quality evals.",
      },
      {
        text: "Rank the levers by leverage and attach a reliability guard to each: route easy queries to a small model guarded by route-accuracy evals, raise retrieval precision so fewer chunks go downstream while holding Recall@K, serve repeats from a semantic cache with strict TTL and invalidation, compress prompts with a quality check, and cap output length with a completeness check—while budgeting offline re-embedding economics separately from per-query serving economics and measuring cost by request type.",
        correct: true,
        feedback:
          "Correct. The senior answer attacks architecture before desperation: every saving lever carries a guard, offline and online costs are budgeted separately, and routing thresholds are treated as product decisions validated by eval.",
      },
      {
        text: "Shrink every prompt by cutting instructions and retrieved context to a fixed token cap across all request types; uniform limits make cost predictable.",
        correct: false,
        feedback:
          "A uniform cap trades quality for predictability blindly; the better approach instead measures cost by request type and applies levers—routing, precision, caching, compression—only where each is validated not to regress quality.",
      },
    ],
  },
  {
    id: "ch16-16-0-10",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "How do you choose the right models across the RAG stack?",
    pages: "104",
    route: "/practice/top-system-design-questions/how-do-you-choose-the-right-models-across-the-rag-stack",
    competencies: ["system design", "interview"],
    question:
      "The interviewer asks: \"How do you choose embedding models, rerankers, and generator models across the RAG stack?\" Which approach shows system-level thinking?",
    options: [
      {
        text: "Never choose components independently—pick sensible baselines (a strong open or hosted embedding model, a cross-encoder reranker, a strong instruction-following generator), then benchmark the full pipeline on a domain golden set and assign each gap to the cheapest component that fixes it: fine-tune embeddings on hard-negative triplets for weak recall, invest in the reranker for precision, and downgrade or add routing on the generator when faithfulness is fine but latency or cost is high.",
        correct: true,
        feedback:
          "Correct. Model choice is framed as a system-level optimization over quality, latency, and cost decided by end-to-end benchmark—leaderboards filter candidates, the domain stack measurement decides.",
      },
      {
        text: "Select the top-ranked model for each component from public leaderboards; the best embedding model plus the best LLM necessarily gives the best stack.",
        correct: false,
        feedback:
          "The chapter explicitly says the best embedding model is not the best stack once reranking, latency, and cost are included; component leaderboard chasing is the junior pattern.",
      },
      {
        text: "Spend the budget on the largest generator available since generation is what users see; embeddings and rerankers are commodity parts where any reasonable choice works.",
        correct: false,
        feedback:
          "Over-paying for the generator is explicitly called out: a reranker is cheap relative to a bigger generator for fixing precision gaps, and routing avoids paying for the largest model everywhere.",
      },
    ],
  },
  {
    id: "ch16-16-0-11",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "What does a strong end-to-end API contract look like for RAG?",
    pages: "104",
    route: "/practice/top-system-design-questions/what-does-a-strong-end-to-end-api-contract-look-like-for-rag",
    competencies: ["system design", "interview"],
    question:
      "In an API design deep dive, you are asked: \"What should the API contract look like for an end-to-end RAG service?\" What does the strongest contract include?",
    options: [
      {
        text: "Accept a query string and return the answer text plus a list of source document links; anything more couples the client to internals that will change.",
        correct: false,
        feedback:
          "\"Return the answer and sources\" is the junior answer the chapter names; it lacks control knobs, honest refusal signaling, and the trace_id and model_version that support and analytics workflows need.",
      },
      {
        text: "Expose the pipeline's internals—chunk IDs, retrieval scores, and the assembled prompt—so client teams can debug answer quality on their own.",
        correct: false,
        feedback:
          "Exposing internals couples callers to implementation details that should stay hidden; the contract should expose diagnostics and control (trace_id, confidence, latency tier), not the pipeline's plumbing.",
      },
      {
        text: "A stable, versioned schema that hides internals but exposes diagnostics and control: request fields for query, session, tenant (also enforced server-side from the token), citation mode, and a latency tier that routes to a fast or quality path; response fields for answer, structured citations, confidence, a refused flag with a reason, latency, trace_id, and model_version—so the system answers honestly when unconfident and support can pull the full trace.",
        correct: true,
        feedback:
          "Correct. The senior contract decouples callers from evolving internals while carrying control knobs (latency_tier, citation_mode), honest failure signaling (refused plus refusal_reason), and operability fields (trace_id, model_version).",
      },
    ],
  },
  {
    id: "ch16-16-0-12",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "How do you test a robust RAG system end to end?",
    pages: "105",
    route: "/practice/top-system-design-questions/how-do-you-test-a-robust-rag-system-end-to-end",
    competencies: ["system design", "interview"],
    question:
      "A hiring manager asks: \"How do you test a robust RAG system end to end before calling it production ready?\" Which answer defines readiness best?",
    options: [
      {
        text: "Write unit tests for the chunker and prompt builder, run the system on a demo set of questions, and walk stakeholders through the answers; production traffic will reveal anything else.",
        correct: false,
        feedback:
          "\"Write some tests\" plus a good demo is the junior answer the chapter contrasts with; readiness is defined as measured quality, known limits, rollback paths, and tested failure behavior.",
      },
      {
        text: "Apply a test pyramid with numeric gates per level: unit tests for the chunker, prompt builder, and retriever wiring; component bars such as Recall@5 ≥ 0.80 with the reranker improving Precision@5; integration targets like faithfulness ≥ 0.85 on a golden set; load tests at P95 ≤ 3s under target concurrency; red-team injection payloads all blocked with tenant isolation verified; and failure-mode tests proving timeouts, stale indexes, and missing documents degrade gracefully—any failed gate blocks release.",
        correct: true,
        feedback:
          "Correct. The senior answer treats a successful red-team payload and a confident wrong answer under failure as launch blockers, and defines production-ready as measured quality plus tested failure behavior, not a working demo.",
      },
      {
        text: "Gate releases on one offline metric—an end-to-end faithfulness score above a threshold on a golden set—since a single strong number is easier to enforce in CI.",
        correct: false,
        feedback:
          "One aggregate score misses load, security, and failure-mode behavior; readiness requires per-level gates including P95 latency, blocked injection payloads, tenant isolation, and graceful degradation under outages.",
      },
    ],
  },
  {
    id: "ch16-16-0-13",
    chapter: 16,
    chapterTitle: "20 Top System Design Questions & Answers",
    title: "Give me the concise interview answer for a production-grade RAG system",
    pages: "106",
    route: "/practice/top-system-design-questions/give-me-the-concise-interview-answer-for-a-production-grade-rag-system",
    competencies: ["system design", "interview"],
    question:
      "In the closing minutes, the interviewer asks: \"Give me your one concise summary of a production-grade RAG system.\" Which 30-second answer is strongest?",
    options: [
      {
        text: "\"I would build a modern, best-in-class RAG platform using state-of-the-art models, a scalable vector database, and robust monitoring, iterating with stakeholders to deliver a delightful, trustworthy user experience.\"",
        correct: false,
        feedback:
          "This is the fluent-but-generic tour the chapter flags as junior: adjectives instead of thresholds, no mental model, and nothing measurable an interviewer can probe.",
      },
      {
        text: "\"At my last company we used Qdrant with 384-dimensional embeddings, a Python monorepo, and LangSmith; I would replicate that exact setup since it worked well for our 50-million-document corpus.\"",
        correct: false,
        feedback:
          "Reciting one past stack's details shows experience but not compressible judgment; the concise senior answer generalizes with targets and a structure instead of replaying a single implementation.",
      },
      {
        text: "\"I build RAG as a full-stack decision system: idempotent, versioned ingestion; hybrid retrieval with reranking targeting Recall@20 ≥ 0.90 and Precision@5 ≥ 0.80; grounded generation with citation verification at faithfulness ≥ 0.85; layered evaluation gating releases in CI; full tracing and reversible deploys—controlling cost with caching, context compression, and model routing. The structure: ingest, retrieve, ground, evaluate, operate—each with a metric and a fallback.\"",
        correct: true,
        feedback:
          "Correct. The senior 30-second answer compresses the full tour but keeps the load-bearing numbers—Recall, Precision, and faithfulness targets—and closes on the ingest→retrieve→ground→evaluate→operate mental model with a metric and fallback per stage.",
      },
    ],
  },
];
