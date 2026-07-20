export const studyPlan = [
  { week: 1, title: "Retrieval foundations", outcome: "Explain RAG choices, embeddings, chunking, hybrid search, and production request paths.", chapters: "Chapters 1-3", activities: ["Complete the retrieval foundation lessons", "Run five retrieval interview drills", "Draft the Enterprise RAG request path"] },
  { week: 2, title: "Quality and reliability", outcome: "Measure retrieval and generation separately, diagnose hallucination, and design recovery behavior.", chapters: "Chapters 4-5 and failure taxonomy", activities: ["Build an evaluation scorecard", "Complete the RAG incident triage lab", "Revise a design after quality feedback"] },
  { week: 3, title: "Scale and operations", outcome: "Plan ingestion, capacity, security, observability, deployment, and inference under production constraints.", chapters: "Chapters 6-8 and 11-13", activities: ["Estimate capacity and cost", "Trace an ingestion failure", "Define SLOs, alerts, rollout, and rollback"] },
  { week: 4, title: "Interview and production synthesis", outcome: "Defend a complete architecture, handle follow-ups, and communicate trade-offs clearly.", chapters: "Chapter 16 and mock interview guide", activities: ["Run a 45-minute mock interview", "Complete one production stress event", "Review the competency evidence and repeat weak drills"] },
];

export interface RagFailureScenario {
  id: string;
  /** Observable behavior only — the symptom must never name the failing stage. */
  symptom: string;
}

export interface RagFailureBranch {
  id: string;
  label: string;
  scenarios: RagFailureScenario[];
  diagnosis: string;
  signals: string[];
}

export const ragFailureBranches: RagFailureBranch[] = [
  {
    id: "retrieval",
    label: "Retrieval",
    scenarios: [
      { id: "retrieval-unrelated-chunks", symptom: "Relevant documents exist, but the answer receives unrelated chunks." },
      { id: "retrieval-cohort-gap", symptom: "Overall answer-quality scores look healthy, but one question cohort — multi-step troubleshooting — is answered correctly far less often than simple fact lookups." },
      { id: "retrieval-filter-overpruning", symptom: "Since a document-scoping rollout, users in one region are told no information exists for topics that are documented and were answerable last month." },
      { id: "retrieval-fusion-miss", symptom: "Questions phrased with exact product codes and paraphrased questions about the same topics return different answers, and each phrasing misses facts the other one finds." },
      { id: "retrieval-embedding-drift", symptom: "Wrong answers began appearing immediately after a routine model upgrade, even though no documents, prompts, or traffic patterns changed." },
    ],
    diagnosis: "Measure query and corpus coverage, candidate recall, filters, fusion, and reranker behavior before changing the generator.",
    signals: ["Recall@K by query cohort", "Filtered candidate count", "Dense and sparse rank overlap", "Reranker score distribution"],
  },
  {
    id: "context",
    label: "Context",
    scenarios: [
      { id: "context-missing-passage", symptom: "The right document is retrieved, but the decisive passage is missing or buried." },
      { id: "context-chunk-boundary", symptom: "Answers quote the first half of a policy correctly but consistently miss the exception clause that immediately follows it in the same document." },
      { id: "context-lost-in-middle", symptom: "When many source documents back a single answer, facts stated in the middle of the supplied material are overlooked while facts at the start and end are used." },
      { id: "context-token-truncation", symptom: "For questions with long supporting documents, answers ignore everything past a certain point in the document, as though the final sections were never seen." },
      { id: "context-table-parsing", symptom: "The assistant paraphrases a specification sheet's prose correctly but returns its figures jumbled, mislabeled, or missing entirely." },
    ],
    diagnosis: "Inspect parsing, chunk boundaries, parent expansion, context ordering, truncation, and token allocation.",
    signals: ["Chunk and parent identifiers", "Prompt token composition", "Truncation events", "Evidence position"],
  },
  {
    id: "generation",
    label: "Generation",
    scenarios: [
      { id: "generation-contradicts-evidence", symptom: "The prompt contains sufficient evidence, but the answer contradicts or ignores it." },
      { id: "generation-citation-misalignment", symptom: "Answers cite the correct document, but the cited passage does not actually support the claim attached to it." },
      { id: "generation-over-abstention", symptom: "The assistant replies that it lacks enough information for questions whose answers are clearly present in the supplied material." },
      { id: "generation-instruction-ignoring", symptom: "Despite explicit output rules, answers arrive as free-form prose without the required structure or source markers." },
      { id: "generation-parametric-override", symptom: "The assistant states plausible general knowledge that conflicts with the specific figures given in the material provided for the question." },
    ],
    diagnosis: "Test grounding instructions, claim verification, citation alignment, abstention, model behavior, and output validation.",
    signals: ["Claim support rate", "Citation precision", "Abstention calibration", "Model and prompt version"],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    scenarios: [
      { id: "infrastructure-burst-collapse", symptom: "Quality and latency collapse during bursts while individual components look healthy at low load." },
      { id: "infrastructure-queue-saturation", symptom: "During a predictable morning traffic spike, response times climb from seconds to minutes and some requests time out, then everything recovers on its own." },
      { id: "infrastructure-retry-amplification", symptom: "A brief slowdown in one upstream service is followed by a flood of duplicate requests that turns a seconds-long hiccup into a prolonged outage." },
      { id: "infrastructure-cache-stampede", symptom: "Every deploy is followed by a short window of slow, error-prone responses that clears once the system has been serving traffic for a while." },
      { id: "infrastructure-rate-limit", symptom: "Requests intermittently fail with throttling errors during peak hours even though internal dashboards show spare capacity everywhere." },
    ],
    diagnosis: "Inspect queues, saturation, timeouts, retries, connection pools, cache behavior, and dependency rate limits under realistic concurrency.",
    signals: ["Queue age and depth", "p95/p99 stage latency", "Retry amplification", "Saturation and throttling"],
  },
];

export const mockInterviewPhases = [
  { minutes: 5, title: "Clarify the problem", prompt: "Restate the user outcome, actors, scope, constraints, and questions that materially change the design." },
  { minutes: 7, title: "Estimate scale", prompt: "State traffic, data volume, growth, token, storage, and latency assumptions. Show the arithmetic and uncertainty." },
  { minutes: 15, title: "Design the architecture", prompt: "Describe the end-to-end online and offline paths, component contracts, data flow, and ownership boundaries." },
  { minutes: 10, title: "Deep dive and stress", prompt: "Choose the riskiest subsystem. Defend trade-offs, handle a failure, and explain capacity and recovery behavior." },
  { minutes: 5, title: "Evaluate and operate", prompt: "Define offline quality, online outcomes, SLOs, monitoring, release gates, rollback, privacy, and security." },
  { minutes: 3, title: "Summarize", prompt: "Give a concise design summary: requirements, key decisions, largest trade-off, failure plan, and evidence." },
];
