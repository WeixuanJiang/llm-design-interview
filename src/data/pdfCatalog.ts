import catalogMarkdown from "./pdf-content-catalog.txt?raw";
import type { LearningModule, LessonCourseContent } from "./learningContent";

export interface CatalogPracticeUnit {
  id: string;
  chapter: number;
  chapterTitle: string;
  title: string;
  pages: string;
  route: string;
  competencies: string[];
}

export interface CatalogMission {
  chapter: number;
  pages: string;
  title: string;
  scenario: string;
  modes: string;
  priority: string;
  publicCaseStudy: boolean;
}

interface ChapterBlueprint {
  focus: string;
  mechanism: string;
  tradeoffs: string;
  failures: string;
  evidence: string;
}

const blueprints: Record<number, ChapterBlueprint> = {
  1: { focus: "selecting RAG, fine-tuning, long context, embeddings, chunks, and vector indexes", mechanism: "separate changing knowledge from stable model behavior, retrieve focused evidence, and construct a grounded prompt", tradeoffs: "freshness, traceability, retrieval quality, context cost, and operational ownership", failures: "stale indexes, weak chunk boundaries, representation mismatch, irrelevant context, and unsupported generation", evidence: "retrieval recall, ranking quality, citation correctness, groundedness, latency, and cost" },
  2: { focus: "hybrid retrieval, query transformation, reranking, and multi-hop search", mechanism: "generate complementary candidates, fuse ranks, apply a more precise reranker, and repeat retrieval when later evidence depends on earlier facts", tradeoffs: "recall versus precision, candidate breadth versus latency, and query expansion versus topic drift", failures: "one retrieval channel dominating fusion, rewritten queries changing intent, reranker bias, and compounding multi-hop errors", evidence: "Recall@K before reranking, nDCG after reranking, hop-level coverage, latency, and answer support" },
  3: { focus: "production RAG request paths, state, tools, streaming, caching, and dependency isolation", mechanism: "split ingestion, retrieval, orchestration, generation, and verification into independently observable services and contracts", tradeoffs: "state consistency, first-token latency, cache freshness, availability, and complexity", failures: "retry storms, stale caches, partial streams, lost conversation state, tool timeouts, and correlated dependency outages", evidence: "stage latency, error budgets, cache hit quality, trace completeness, groundedness, and graceful-degradation tests" },
  4: { focus: "retrieval and generation evaluation with offline, human, and online signals", mechanism: "build representative labeled sets, score pipeline stages separately, and connect offline metrics to user outcomes", tradeoffs: "metric coverage versus annotation cost, judge speed versus reliability, and aggregate scores versus cohort visibility", failures: "contaminated benchmarks, misleading averages, weak labels, metric gaming, and evaluating only final answers", evidence: "Recall@K, MRR, nDCG, groundedness, answer relevance, human agreement, confidence intervals, and online lift" },
  5: { focus: "hallucination control, attribution, abstention, verification, and reliability", mechanism: "constrain generation to trusted evidence, verify claims, calibrate uncertainty, and route unsupported cases to fallback paths", tradeoffs: "helpfulness versus refusal, verification latency versus risk, and strict grounding versus synthesis", failures: "confident unsupported claims, citation laundering, missing evidence, over-refusal, and verifier-generator correlation", evidence: "claim support rate, citation precision, abstention calibration, severe-error rate, and human escalation outcomes" },
  6: { focus: "capacity planning, latency budgets, caching, batching, and vector-search scale", mechanism: "measure each stage, control concurrency, partition work, cache stable results, and scale bottlenecks independently", tradeoffs: "throughput versus tail latency, recall versus index speed, freshness versus cache efficiency, and utilization versus resilience", failures: "hot partitions, queue growth, retry amplification, cache stampedes, memory pressure, and unbounded fan-out", evidence: "p50/p95/p99 latency, saturation, queue age, QPS, recall under load, cost per request, and recovery time" },
  7: { focus: "document acquisition, parsing, chunking, enrichment, indexing, and freshness", mechanism: "use durable event-driven stages with idempotency, versioning, quality checks, and independently retryable workers", tradeoffs: "freshness versus processing cost, chunk detail versus context, and pipeline simplicity versus replayability", failures: "duplicate events, partial updates, poison documents, parser regressions, stale deletions, and index-version mismatch", evidence: "freshness lag, parse success, duplicate rate, dead-letter volume, chunk quality, index parity, and replay tests" },
  8: { focus: "authorization, isolation, encryption, prompt injection, audit, and enterprise governance", mechanism: "enforce identity and document policy before retrieval, treat content as untrusted, minimize data exposure, and audit every boundary", tradeoffs: "security controls versus latency and usability, tenant isolation versus efficiency, and retention versus investigation needs", failures: "post-retrieval filtering, cross-tenant leakage, instruction injection, secret exposure, excessive permissions, and incomplete audit trails", evidence: "authorization tests, red-team findings, leakage rate, policy coverage, key rotation, audit completeness, and incident drills" },
  9: { focus: "agent planning, tool selection, memory, control loops, and verification", mechanism: "bound the planner with typed tools, explicit state, budgets, approval gates, and independent outcome checks", tradeoffs: "autonomy versus predictability, tool breadth versus attack surface, and planning depth versus latency and cost", failures: "infinite loops, unsafe tool calls, stale memory, hidden state, plan drift, and unverifiable completion", evidence: "task success, tool-call precision, step count, cost, policy violations, recovery rate, and trace review" },
  10: { focus: "prompt contracts, context ordering, few-shot examples, structured output, and injection resistance", mechanism: "separate trusted instructions from untrusted evidence, define explicit output contracts, and version prompts like code", tradeoffs: "instruction detail versus token cost, flexibility versus schema compliance, and examples versus context capacity", failures: "ambiguous precedence, prompt injection, brittle examples, silent truncation, and unvalidated structured output", evidence: "contract compliance, grounding, token use, regression suites, adversarial tests, and model-version comparisons" },
  11: { focus: "traces, metrics, logs, quality telemetry, alerting, and incident diagnosis", mechanism: "propagate request identity across every RAG stage and join operational signals with sampled quality evidence", tradeoffs: "visibility versus cost and privacy, alert sensitivity versus fatigue, and sampling versus forensic depth", failures: "missing correlation IDs, high-cardinality explosions, sensitive prompt logging, noisy alerts, and opaque model failures", evidence: "trace coverage, SLO burn, detection time, diagnosis time, quality cohorts, alert precision, and runbook success" },
  12: { focus: "deployment, prompt and model versioning, evaluation gates, rollout, rollback, and reproducibility", mechanism: "package every model, prompt, index, and configuration change as a versioned release with staged exposure and automated gates", tradeoffs: "release speed versus confidence, canary size versus detection power, and platform standardization versus team flexibility", failures: "configuration drift, irreproducible results, incompatible index/model versions, slow rollback, and hidden prompt changes", evidence: "gate pass rates, canary deltas, rollback time, artifact lineage, environment parity, and change-failure rate" },
  13: { focus: "LLM inference latency, memory, batching, quantization, parallelism, and scheduling", mechanism: "manage prefill and decode separately, reuse KV state, batch compatible work, and allocate model shards to meet SLOs", tradeoffs: "throughput versus inter-token latency, precision versus quality, memory versus recomputation, and utilization versus isolation", failures: "head-of-line blocking, out-of-memory events, uneven shards, long-context starvation, and quality regression after optimization", evidence: "time to first token, time per output token, tokens per second, memory utilization, queue delay, quality gates, and cost" },
  14: { focus: "knowledge graphs, entity linking, graph traversal, and GraphRAG synthesis", mechanism: "extract entities and relations, connect them to source evidence, retrieve relevant subgraphs, and ground synthesis in both graph and text", tradeoffs: "graph construction cost versus multi-hop quality, ontology rigidity versus coverage, and traversal breadth versus noise", failures: "incorrect entity resolution, stale edges, unsupported relations, graph explosion, and loss of source provenance", evidence: "entity-link accuracy, path relevance, multi-hop answer support, freshness, traversal latency, and citation integrity" },
  15: { focus: "multimodal parsing, aligned representations, cross-modal retrieval, and evidence presentation", mechanism: "extract text, layout, images, audio, and tables into linked artifacts while preserving coordinates, timing, and provenance", tradeoffs: "specialized models versus operational complexity, fidelity versus cost, and early versus late fusion", failures: "OCR loss, layout corruption, modality mismatch, missing temporal links, unsafe media, and inaccessible citations", evidence: "modality-specific recall, OCR and layout accuracy, cross-modal ranking, groundedness, latency, and human review" },
  17: { focus: "production fine-tuning data, parameter-efficient methods, release, and evaluation", mechanism: "curate behavior examples, split data to prevent leakage, train reproducibly, and compare the adapted model against a prompt-only baseline", tradeoffs: "quality gain versus training and serving cost, specialization versus general capability, and update speed versus governance", failures: "memorization, catastrophic forgetting, skewed examples, benchmark leakage, unstable formats, and unreproducible checkpoints", evidence: "held-out task quality, safety regression, calibration, data lineage, serving cost, and rollback readiness" },
  18: { focus: "multi-agent roles, messaging, shared state, coordination, and termination", mechanism: "assign narrow responsibilities, use typed messages and durable state, and let an orchestrator enforce budgets, approvals, and stop conditions", tradeoffs: "parallelism versus coordination overhead, specialization versus fragility, and shared context versus isolation", failures: "duplicate work, deadlock, inconsistent state, cascading hallucinations, unbounded delegation, and unclear accountability", evidence: "end-to-end success, coordination steps, duplicate rate, token cost, policy compliance, termination reliability, and trace clarity" },
  19: { focus: "pre-training data, tokenization, objectives, scaling, distributed training, and checkpoints", mechanism: "transform governed corpora into token sequences, optimize next-token prediction across parallel workers, and validate checkpoints continuously", tradeoffs: "data quality versus volume, model size versus compute, context length versus efficiency, and checkpoint frequency versus overhead", failures: "data contamination, training instability, worker divergence, checkpoint corruption, capability imbalance, and evaluation leakage", evidence: "loss curves, gradient health, throughput, scaling efficiency, benchmark integrity, checkpoint recovery, and downstream transfer" },
  20: { focus: "shared ML platform capabilities for data, features, training, registry, deployment, and governance", mechanism: "provide paved workflows with explicit contracts while preserving extension points for specialized teams", tradeoffs: "standardization versus autonomy, central efficiency versus bottlenecks, and platform breadth versus maintainability", failures: "tight coupling, ownership gaps, stale features, inconsistent environments, registry drift, and platform lock-in", evidence: "adoption, lead time, reliability, reproducibility, cost allocation, support burden, and change-failure rate" },
  21: { focus: "hyperscale model serving, routing, sharding, fleet management, and global resilience", mechanism: "route requests by capability and SLO, shard models across accelerators, balance regional fleets, and degrade safely during capacity loss", tradeoffs: "global utilization versus locality, model quality versus availability, and large batches versus fairness and tail latency", failures: "regional overload, shard imbalance, cold starts, routing loops, accelerator failure, and synchronized retries", evidence: "global p99, capacity headroom, shard health, routing quality, failover time, tokens per accelerator, and cost" },
  22: { focus: "trustworthy LLM judges, human review, benchmark governance, and online experiments", mechanism: "calibrate automated judges against blinded human labels, measure disagreement, protect benchmarks, and use statistically powered experiments", tradeoffs: "evaluation speed versus validity, reviewer depth versus cost, and experiment duration versus decision urgency", failures: "judge bias, position effects, low agreement, contamination, repeated peeking, underpowered tests, and novelty decay", evidence: "judge-human agreement, confidence intervals, inter-rater reliability, contamination checks, effect size, and guardrail metrics" },
  23: { focus: "token economics, quantization, batching, caching, and model routing", mechanism: "decompose cost per request, match models to difficulty, raise utilization without violating latency, and guard every optimization with quality checks", tradeoffs: "cost versus quality, batch efficiency versus delay, precision versus memory, and routing savings versus misclassification", failures: "hidden retry cost, low-value long outputs, quality cliffs, expensive fallbacks, queue growth, and unallocated shared cost", evidence: "cost per successful task, token mix, utilization, route accuracy, latency, quality by tier, and budget variance" },
  24: { focus: "layered guardrails, prompt-injection defense, red teaming, content safety, and over-refusal control", mechanism: "combine input controls, policy-aware generation, tool authorization, output checks, monitoring, and human escalation", tradeoffs: "safety versus helpfulness, detection depth versus latency, and universal policy versus contextual risk", failures: "single-filter dependence, indirect injection, encoded attacks, unsafe tool use, policy drift, alert overload, and systematic over-refusal", evidence: "attack success rate, severe-harm recall, false-positive rate, policy coverage, regression results, and escalation outcomes" },
};

function slug(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function extractLine(body: string, label: string) {
  return body.match(new RegExp(`- \\*\\*${label}:\\*\\* ([^\\r\\n]+)`))?.[1] ?? "";
}

const chapterPattern = /### Chapter (\d+): (.+?) \(pages ([^)]+)\)\r?\n([\s\S]*?)(?=\r?\n### Chapter |\r?\n## 8\.)/g;
const chapters = [...catalogMarkdown.matchAll(chapterPattern)].map((match) => ({
  number: Number(match[1]),
  title: match[2],
  pages: match[3],
  body: match[4],
  competencies: extractLine(match[4], "Competencies").split(",").map((item) => item.trim()).filter(Boolean),
  exercise: extractLine(match[4], "Recommended active exercise"),
}));

function parseUnits(block: string, chapter: (typeof chapters)[number], kind: "learn" | "practice") {
  const end = kind === "learn" ? "\\*\\*Practice units\\*\\*" : "\\*\\*Authoring note:";
  const section = block.match(new RegExp(`\\*\\*${kind === "learn" ? "Learn" : "Practice"} units\\*\\*([\\s\\S]*?)(?=${end})`))?.[1] ?? "";
  return [...section.matchAll(/- `([^`]+)` \*\*(.+?)\*\* - PDF p\. ([^;\r\n]+);(?: [^;\r\n]+;)? route: `([^`]+)`/g)].map((match) => ({
    id: match[1],
    chapter: chapter.number,
    chapterTitle: chapter.title,
    title: match[2],
    pages: match[3],
    route: match[4],
    competencies: chapter.competencies,
  }));
}

function makeCourse(title: string, chapter: (typeof chapters)[number], blueprint: ChapterBlueprint): LessonCourseContent {
  const exercise = chapter.exercise || `Apply ${title} to a realistic production decision and defend the result.`;
  return {
    objectives: [
      `Explain ${title} in the context of ${blueprint.focus}.`,
      `Trace how the mechanism works across a production system rather than treating it as an isolated technique.`,
      `Evaluate design choices using explicit quality, latency, reliability, security, and cost evidence.`,
    ],
    sections: [
      { heading: `Understanding ${title}`, paragraphs: [
        `${title} belongs to the broader problem of ${blueprint.focus}. Start by naming the user outcome and the system constraint it serves. A technique is only useful when its role in the request or data path is explicit, its inputs and outputs are defined, and the team can observe whether it is doing its job.`,
        `The central implementation idea is to ${blueprint.mechanism}. This creates separable stages that can be tested independently. It also prevents a common design error: attributing every quality problem to the language model when data selection, orchestration, serving, or policy enforcement may be the actual bottleneck.`,
      ] },
      { heading: "How the production mechanism works", paragraphs: [
        `A production implementation begins with contracts. Define the data accepted by this stage, the metadata and identity that must travel with it, the result returned to the next stage, and the timeout or fallback behavior. Version these contracts so that changes can be rolled out gradually and traced to an evaluation result.`,
        `Operationally, ${blueprint.mechanism}. The implementation should expose stage-level timing, quality signals, and failure categories. Durable work needs idempotency and replay; online work needs bounded concurrency, deadlines, cancellation, and a deliberate degraded response when dependencies are unavailable.`,
      ] },
      { heading: "Design choices and trade-offs", paragraphs: [
        `The important trade-offs are ${blueprint.tradeoffs}. There is rarely one universally correct configuration. The right choice depends on traffic shape, data sensitivity, update frequency, user tolerance for delay, and the cost of an incorrect response. Record those assumptions before selecting a model, index, service, or threshold.`,
        `Compare at least two credible designs against the same workload. Use a simple baseline to reveal whether additional complexity creates measurable value. Keep reversible choices behind configuration or versioned interfaces, and reserve irreversible infrastructure commitments for cases where load tests and operational requirements justify them.`,
      ] },
      { heading: "Failure handling and validation", paragraphs: [
        `Plan explicitly for ${blueprint.failures}. For each failure, decide how it will be detected, whether the request can be retried safely, what degraded answer is acceptable, and which evidence an operator needs. A production design is incomplete until it describes rollback, data repair, and recovery after a partial failure.`,
        `Validate the design with ${blueprint.evidence}. Report results by meaningful cohorts instead of relying only on averages. Re-run the evaluation when data, prompts, models, indexes, policies, or infrastructure change, because improvements in one stage can move the bottleneck or create a regression elsewhere.`,
      ] },
    ],
    example: {
      title: `Worked example: applying ${title}`,
      scenario: exercise,
      analysis: `Translate the exercise into functional requirements, non-functional limits, and failure behavior. Identify where ${title} sits in the end-to-end path, which upstream assumptions it relies on, and which downstream outcome it is expected to improve. Compare a minimal baseline with a more capable design using representative traffic and data.`,
      decision: `Choose the smallest design that meets the stated requirement, instrument it with ${blueprint.evidence}, and define a rollback trigger before rollout. Expand the design only when measured evidence shows that the current stage is the limiting factor.`,
    },
    productionChecklist: ["Write the requirement and success threshold.", "Define stage inputs, outputs, ownership, and versioning.", "Test representative happy paths and hard cohorts.", "Set deadlines, backpressure, fallback, and rollback behavior.", "Review security, privacy, cost, and observability before launch."],
    commonMistakes: ["Choosing a technique before diagnosing the requirement.", "Evaluating only the final answer and hiding stage failures.", "Using average latency or quality without difficult cohorts.", "Adding complexity without a measured baseline.", "Launching without a reversible rollout and recovery plan."],
  };
}

const generatedCourseContent: Record<string, LessonCourseContent> = {};

export const catalogLearningModules: LearningModule[] = chapters.filter((chapter) => chapter.number >= 2 && chapter.number <= 24 && chapter.number !== 16).map((chapter) => {
  const blueprint = blueprints[chapter.number] ?? blueprints[3];
  const units = parseUnits(chapter.body, chapter, "learn");
  const lessons = units.map((unit) => {
    const id = `catalog-${unit.id.replace(/\./g, "-")}-${slug(unit.title)}`;
    generatedCourseContent[id] = makeCourse(unit.title, chapter, blueprint);
    return {
      id,
      title: unit.title,
      prompt: unit.title,
      question: `Which approach best demonstrates production understanding of ${unit.title}?`,
      options: ["Adopt the most complex implementation immediately and evaluate later.", "Connect the requirement, mechanism, trade-offs, failure behavior, and measurable evidence.", "Treat the technique as an isolated model setting with no operational contract."],
      correct: 1,
      feedback: `Correct. A defensible ${unit.title} decision connects its mechanism to a requirement, makes trade-offs explicit, handles failure, and names the evidence used to validate it.`,
      explanation: `This lesson explains ${unit.title} as part of ${blueprint.focus}, including how it works, where it fails, and how to validate it in production.`,
      takeaways: [`Place ${unit.title} in an explicit end-to-end system path.`, `Evaluate ${blueprint.tradeoffs}.`, `Use ${blueprint.evidence} to decide whether the design works.`],
      model: ["Requirement", "Mechanism", "Evidence"],
      source: { chapter: chapter.number, sections: [unit.id], pages: unit.pages },
    };
  });
  return { id: `chapter-${chapter.number}-${slug(chapter.title)}`, title: chapter.title, description: chapter.exercise || `Learn the production foundations of ${chapter.title}.`, duration: `${lessons.length} lessons`, lessons };
});

export const catalogCourseContent = generatedCourseContent;
export const catalogPracticeUnits: CatalogPracticeUnit[] = chapters.flatMap((chapter) => parseUnits(chapter.body, chapter, "practice"));

function tableRowsBetween(start: string, end: string) {
  const block = catalogMarkdown.match(new RegExp(`${start}([\\s\\S]*?)${end}`))?.[1] ?? "";
  return block.split(/\r?\n/).filter((line) => /^\|\s*\d+\s*\|/.test(line)).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
}

const generalMissions: CatalogMission[] = tableRowsBetween("## 9\\. General applied mission catalog - Chapters 25-41", "## 10\\.").map((cells) => ({
  chapter: Number(cells[0]), pages: cells[1], title: cells[2], scenario: cells[3], modes: cells[4], priority: cells[5], publicCaseStudy: false,
}));
const advancedMissions: CatalogMission[] = tableRowsBetween("## 10\\. Advanced company-style mission catalog - Chapters 42-49", "## 11\\.").map((cells) => ({
  chapter: Number(cells[0]), pages: cells[1], title: cells[2], scenario: cells[3], modes: "Interview, Production (advanced)", priority: cells[4], publicCaseStudy: true,
}));

export const catalogMissions = [...generalMissions, ...advancedMissions];
export const catalogCoverage = {
  learnChapters: chapters.filter((chapter) => parseUnits(chapter.body, chapter, "learn").length > 0).length,
  learnUnits: chapters.reduce((sum, chapter) => sum + parseUnits(chapter.body, chapter, "learn").length, 0),
  practiceUnits: chapters.reduce((sum, chapter) => sum + parseUnits(chapter.body, chapter, "practice").length, 0),
  generalMissions: generalMissions.length,
  advancedMissions: advancedMissions.length,
};
