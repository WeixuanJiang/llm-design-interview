export const studyPlan = [
  { week: 1, title: "Retrieval foundations", outcome: "Explain RAG choices, embeddings, chunking, hybrid search, and production request paths.", chapters: "Chapters 1-3", activities: ["Complete the retrieval foundation lessons", "Run five retrieval interview drills", "Draft the Enterprise RAG request path"] },
  { week: 2, title: "Quality and reliability", outcome: "Measure retrieval and generation separately, diagnose hallucination, and design recovery behavior.", chapters: "Chapters 4-5 and failure taxonomy", activities: ["Build an evaluation scorecard", "Complete the RAG incident triage lab", "Revise a design after quality feedback"] },
  { week: 3, title: "Scale and operations", outcome: "Plan ingestion, capacity, security, observability, deployment, and inference under production constraints.", chapters: "Chapters 6-8 and 11-13", activities: ["Estimate capacity and cost", "Trace an ingestion failure", "Define SLOs, alerts, rollout, and rollback"] },
  { week: 4, title: "Interview and production synthesis", outcome: "Defend a complete architecture, handle follow-ups, and communicate trade-offs clearly.", chapters: "Chapter 16 and mock interview guide", activities: ["Run a 45-minute mock interview", "Complete one production stress event", "Review the competency evidence and repeat weak drills"] },
];

export const ragFailureBranches = [
  { id: "retrieval", label: "Retrieval", symptom: "Relevant documents exist, but the answer receives unrelated chunks.", diagnosis: "Measure query and corpus coverage, candidate recall, filters, fusion, and reranker behavior before changing the generator.", signals: ["Recall@K by query cohort", "Filtered candidate count", "Dense and sparse rank overlap", "Reranker score distribution"] },
  { id: "context", label: "Context", symptom: "The right document is retrieved, but the decisive passage is missing or buried.", diagnosis: "Inspect parsing, chunk boundaries, parent expansion, context ordering, truncation, and token allocation.", signals: ["Chunk and parent identifiers", "Prompt token composition", "Truncation events", "Evidence position"] },
  { id: "generation", label: "Generation", symptom: "The prompt contains sufficient evidence, but the answer contradicts or ignores it.", diagnosis: "Test grounding instructions, claim verification, citation alignment, abstention, model behavior, and output validation.", signals: ["Claim support rate", "Citation precision", "Abstention calibration", "Model and prompt version"] },
  { id: "infrastructure", label: "Infrastructure", symptom: "Quality and latency collapse during bursts while individual components look healthy at low load.", diagnosis: "Inspect queues, saturation, timeouts, retries, connection pools, cache behavior, and dependency rate limits under realistic concurrency.", signals: ["Queue age and depth", "p95/p99 stage latency", "Retry amplification", "Saturation and throttling"] },
];

export const mockInterviewPhases = [
  { minutes: 5, title: "Clarify the problem", prompt: "Restate the user outcome, actors, scope, constraints, and questions that materially change the design." },
  { minutes: 7, title: "Estimate scale", prompt: "State traffic, data volume, growth, token, storage, and latency assumptions. Show the arithmetic and uncertainty." },
  { minutes: 15, title: "Design the architecture", prompt: "Describe the end-to-end online and offline paths, component contracts, data flow, and ownership boundaries." },
  { minutes: 10, title: "Deep dive and stress", prompt: "Choose the riskiest subsystem. Defend trade-offs, handle a failure, and explain capacity and recovery behavior." },
  { minutes: 5, title: "Evaluate and operate", prompt: "Define offline quality, online outcomes, SLOs, monitoring, release gates, rollback, privacy, and security." },
  { minutes: 3, title: "Summarize", prompt: "Give a concise design summary: requirements, key decisions, largest trade-off, failure plan, and evidence." },
];
