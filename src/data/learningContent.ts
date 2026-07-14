import { catalogCourseContent, catalogLearningModules } from "./pdfCatalog";

export interface LearningLesson {
  id: string;
  title: string;
  prompt: string;
  question: string;
  options: string[];
  correct: number;
  feedback: string;
  explanation: string;
  takeaways: string[];
  model: string[];
  source: { chapter: number; sections: string[]; pages: string };
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: LearningLesson[];
}

export interface KnowledgeCheckQuestion {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  feedback: string;
}

export interface LessonCourseContent {
  objectives: string[];
  sections: Array<{ heading: string; paragraphs: string[] }>;
  example: { title: string; scenario: string; analysis: string; decision: string };
  productionChecklist: string[];
  commonMistakes: string[];
}

const chapterOneLessons: LearningLesson[] = [
  {
    id: "adaptation-choice",
    title: "RAG, fine-tuning, or long context?",
    prompt: "Match the adaptation method to the problem",
    question: "A support product uses policies that change every day and must cite the policy used in each answer. What should carry the knowledge?",
    options: ["Retrieval-augmented generation", "Supervised fine-tuning", "A larger model with no external knowledge"],
    correct: 0,
    feedback: "Strong choice. Frequent updates and citations point to retrieval because the knowledge can change without retraining the model.",
    explanation: "Keep changing knowledge outside model weights. Retrieval selects current evidence for each request; fine-tuning is better for stable behavior such as tone or output format. Long context is useful when a bounded document set can be supplied economically for one task.",
    takeaways: ["Use retrieval for fresh, traceable knowledge.", "Use fine-tuning for stable behavior and format.", "Use long context for bounded, one-off document reasoning."],
    model: ["Knowledge gap", "Behavior gap", "Bounded context"],
    source: { chapter: 1, sections: ["1.1.1"], pages: "22-23" },
  },
  {
    id: "rag-plus-tuning",
    title: "Combine retrieval and fine-tuning",
    prompt: "Separate what changes from what stays fixed",
    question: "A bank assistant needs current rates and a strict compliance-approved response format. Which design addresses both needs?",
    options: ["RAG for rates plus fine-tuning for response behavior", "Fine-tune the latest rates into the model each day", "Use retrieval alone and hope the format is consistent"],
    correct: 0,
    feedback: "Strong choice. Retrieval owns volatile facts while fine-tuning shapes the stable response contract.",
    explanation: "A combined system is appropriate when the product has both a knowledge gap and a behavior gap. Keep policies, prices, and other changing facts in an index; teach repeatable tone, structure, or refusal behavior separately.",
    takeaways: ["Diagnose knowledge and behavior failures separately.", "Do not use fine-tuning as a frequently updated database.", "Evaluate retrieval quality and output compliance independently."],
    model: ["Live facts", "Retrieved evidence", "Consistent behavior"],
    source: { chapter: 1, sections: ["1.1.2"], pages: "23-24" },
  },
  {
    id: "embedding-types",
    title: "Dense, sparse, and hybrid retrieval",
    prompt: "Choose a representation for mixed query signals",
    question: "Users search with exact product codes and natural-language descriptions. Which retrieval design protects both kinds of relevance?",
    options: ["Dense embeddings only", "Sparse keyword search only", "Hybrid dense and sparse retrieval with calibrated fusion"],
    correct: 2,
    feedback: "Strong choice. Hybrid retrieval keeps exact lexical matches while adding semantic recall for paraphrases and intent.",
    explanation: "Dense vectors are useful for semantic similarity; sparse methods preserve rare terms, identifiers, and exact wording. A hybrid system retrieves from both channels and combines ranked results before optional reranking.",
    takeaways: ["Dense search handles meaning and paraphrases.", "Sparse search protects exact and rare terms.", "Fusion and reranking must be evaluated on representative queries."],
    model: ["Dense candidates", "Sparse candidates", "Fuse and rerank"],
    source: { chapter: 1, sections: ["1.1.3"], pages: "24" },
  },
  {
    id: "chunking-strategies",
    title: "Chunk for retrieval and context",
    prompt: "Choose a chunking policy",
    question: "A policy corpus has long, meaningful sections and answers often span adjacent paragraphs. What is the best starting policy?",
    options: ["One vector for every complete document", "Structure-aware chunks with measured overlap", "Split every sentence into a separate chunk"],
    correct: 1,
    feedback: "Strong choice. Structural boundaries preserve meaning, while measured overlap protects facts that cross a boundary.",
    explanation: "Chunking balances retrieval precision against the context needed to answer. Small chunks can lose supporting detail; large chunks dilute the matching signal. Start from document structure, then tune size and overlap against a labeled retrieval set.",
    takeaways: ["Treat chunk size as an evaluated parameter.", "Respect headings, lists, and document boundaries.", "Consider small retrieval chunks with larger parent context."],
    model: ["Parse structure", "Retrieve focused child", "Return useful parent"],
    source: { chapter: 1, sections: ["1.1.4"], pages: "24" },
  },
  {
    id: "vector-store-choice",
    title: "Select a vector store by constraints",
    prompt: "Turn product constraints into an index choice",
    question: "A team already operates PostgreSQL, has moderate vector volume, and wants transactional metadata beside embeddings. What is the most pragmatic first evaluation?",
    options: ["A PostgreSQL vector extension", "A single in-memory research index", "Build a custom distributed database"],
    correct: 0,
    feedback: "Strong choice. Existing operational capability and transactional metadata make a PostgreSQL extension a credible baseline to measure before adding another system.",
    explanation: "Vector-store selection is an operational decision, not a popularity contest. Compare index types, filtering, update behavior, scale limits, availability, and team ownership. Benchmark with the real corpus and query distribution.",
    takeaways: ["Start from scale, filtering, freshness, and reliability requirements.", "Account for operational ownership and migration cost.", "Measure recall and latency under realistic load."],
    model: ["Requirements", "Candidate indexes", "Measured decision"],
    source: { chapter: 1, sections: ["1.1.5"], pages: "24" },
  },
  {
    id: "similarity-choice",
    title: "Cosine similarity and dot product",
    prompt: "Make normalization an indexing contract",
    question: "Both indexed and query embeddings are L2-normalized. Which statement is correct?",
    options: ["Cosine and dot product produce the same ranking", "Vector magnitude should still change the ranking", "Only Euclidean distance remains valid"],
    correct: 0,
    feedback: "Strong choice. Unit-length vectors remove the cosine denominator, so cosine similarity reduces to the dot product.",
    explanation: "Normalization must be consistent at ingestion and query time. With unit-length vectors, inner product provides cosine semantics without computing vector magnitudes for every comparison. Thresholds still need calibration for the selected model and corpus.",
    takeaways: ["Normalize index and query vectors consistently.", "Do not import similarity thresholds from another model.", "Evaluate rankings and thresholds on domain data."],
    model: ["Normalize vectors", "Inner product", "Calibrate threshold"],
    source: { chapter: 1, sections: ["1.1.6"], pages: "24-25" },
  },
  {
    id: "long-context-boundary",
    title: "Know when long context is enough",
    prompt: "Choose retrieval or direct context deliberately",
    question: "An analyst asks one question over a fixed contract that fits comfortably in the model context. There is no shared knowledge base. What is the simplest credible approach?",
    options: ["Provide the contract directly with clear instructions", "Build a distributed retrieval platform first", "Fine-tune the contract into model weights"],
    correct: 0,
    feedback: "Strong choice. A bounded, one-off document task can use direct context when cost, latency, and attention quality remain acceptable.",
    explanation: "Long context and retrieval are complementary. Direct context can simplify bounded analysis, while retrieval controls cost, freshness, access, and relevance for large or frequently queried collections. A large window does not guarantee every token receives equal attention.",
    takeaways: ["Use direct context for bounded, one-off analysis.", "Use retrieval for large, changing, secured collections.", "Retrieve a focused evidence set, then reason with enough context headroom."],
    model: ["Bounded corpus?", "Cost and access", "Direct or retrieve"],
    source: { chapter: 1, sections: ["1.1.7"], pages: "25-26" },
  },
];

export const lessonCourseContent: Record<string, LessonCourseContent> = {
  "adaptation-choice": {
    objectives: ["Distinguish knowledge, behavior, and bounded-context problems.", "Choose between retrieval, fine-tuning, and direct long-context prompting.", "Explain the operational consequences of each approach."],
    sections: [
      { heading: "Start with the kind of gap", paragraphs: ["Model adaptation choices become clearer when you diagnose the gap before choosing a technique. A knowledge gap means the system lacks current or private facts. A behavior gap means it knows enough but responds in the wrong style, structure, or task format. A context-selection gap means the facts exist, but the request needs a focused subset of them.", "Retrieval-augmented generation addresses a knowledge and context-selection gap by locating evidence at request time. The model is not expected to memorize the corpus. Instead, the application owns ingestion, indexing, access control, retrieval, context assembly, generation, and citations as separate observable stages."] },
      { heading: "What fine-tuning actually changes", paragraphs: ["Supervised fine-tuning changes the probability of response patterns. It is useful when the desired behavior is stable: follow a house style, produce a schema, classify a request, use domain terminology, or apply a repeatable procedure. It is a poor substitute for a database because facts encoded in weights are difficult to update, attribute, delete, and verify.", "Fine-tuning also introduces an evaluation and release lifecycle. Training data must be curated, training runs versioned, regressions measured, and the resulting model deployed safely. That investment can be justified for repeated behavior, but rarely for facts that change every day."] },
      { heading: "Where long context fits", paragraphs: ["Direct long-context prompting can be the simplest solution when the corpus is bounded, supplied for one request, and comfortably fits the model window. Contract review, analysis of a small repository, or comparison of several reports may not need an index at all.", "Window capacity is not the only constraint. Prefill latency and cost rise with input length, access controls are harder to apply inside one large prompt, and relevant facts may receive uneven attention. Long context is therefore a reasoning workspace, not an automatic replacement for retrieval."] },
      { heading: "A practical decision framework", paragraphs: ["Ask four questions in order. How frequently does the information change? Must the answer cite or prove its source? Is the desired change factual or behavioral? Can the relevant corpus be supplied economically and securely on every request?", "Choose the smallest architecture that answers those questions. Direct context is often enough for bounded analysis. Retrieval is appropriate for large, changing, shared, or permissioned knowledge. Fine-tuning is appropriate when stable behavior must become reliable at scale. Production systems can combine all three, but each addition needs a measured reason."] },
    ],
    example: { title: "Worked example: employee policy assistant", scenario: "Policies change weekly, employees have different document permissions, every answer needs a citation, and responses must use a fixed HR tone.", analysis: "Freshness, permissions, and citations are knowledge-delivery requirements, so the policy corpus belongs in retrieval. The fixed tone is a behavior requirement that can begin with prompting and later justify fine-tuning if prompt-only compliance is unreliable.", decision: "Start with permission-aware RAG and a strict response template. Measure retrieval recall, citation correctness, and format compliance separately before deciding whether fine-tuning is needed." },
    productionChecklist: ["Version the corpus and index independently from the model.", "Measure retrieval quality before blaming generation.", "Enforce access control before evidence enters the prompt.", "Track input tokens, time to first token, and end-to-end cost.", "Keep a rollback path for model, prompt, and index changes."],
    commonMistakes: ["Fine-tuning frequently changing facts into weights.", "Using the largest context window without a cost or latency budget.", "Treating RAG as one opaque model call instead of an observable pipeline.", "Combining techniques before establishing which gap each one fixes."],
  },
  "rag-plus-tuning": {
    objectives: ["Separate volatile knowledge from stable behavior.", "Design a combined RAG and fine-tuning boundary.", "Define independent quality measures for both layers."],
    sections: [
      { heading: "Two systems with different update speeds", paragraphs: ["A combined architecture works because retrieval and fine-tuning evolve on different clocks. The retrieval corpus can be refreshed continuously as documents change. Fine-tuned behavior should change less frequently through a controlled model release.", "This separation keeps operational ownership clear. Content teams can publish knowledge without a training run, while model teams can improve structure or tone without rebuilding the knowledge base."] },
      { heading: "Diagnose before combining", paragraphs: ["If answers are stale, unsupported, or missing known facts, inspect ingestion and retrieval. If evidence is correct but the output violates a schema or tone, inspect prompting and behavior. If domain terms fail to match documents, the representation layer may need glossary expansion, hybrid search, or embedding adaptation.", "Only combine methods when evidence shows more than one failure class. Otherwise the extra training, deployment, and debugging surface creates complexity without improving the measured bottleneck."] },
      { heading: "Define the contract between layers", paragraphs: ["Retrieved evidence should be clearly delimited, attributed, and permission checked. The generator should know whether it must answer only from evidence, when it should abstain, how to cite, and which output schema to follow.", "A fine-tuned generator must still be tested for grounding. Strong formatting does not imply factual correctness, and a confident style can make unsupported answers more dangerous."] },
      { heading: "Evaluate the combined system", paragraphs: ["Use a retrieval set to measure whether relevant evidence is found, a grounding set to measure whether claims follow from evidence, and a behavior set to measure format, tone, refusal, and policy compliance.", "Release gates should isolate regressions. If retrieval recall is stable but schema compliance falls, investigate the generator. If behavior is stable but citations become irrelevant, investigate the corpus, query processing, and ranking pipeline."] },
    ],
    example: { title: "Worked example: regulated product support", scenario: "Product rates change daily, but every response must include approved disclosures and a strict JSON payload for downstream systems.", analysis: "Rates belong in a versioned retrieval index. The response contract is stable and repeated, so it can begin as a validated prompt and later move into fine-tuning if volume and error rates justify it.", decision: "Use RAG for product facts, schema validation at the application boundary, and fine-tuning only after measuring persistent behavior failures." },
    productionChecklist: ["Assign owners to corpus updates and model releases.", "Validate output schemas after generation.", "Test abstention when evidence is missing.", "Run grounding and behavior evaluations as separate suites.", "Log source identifiers without exposing sensitive text."],
    commonMistakes: ["Assuming a fine-tuned tone guarantees grounded facts.", "Retraining when re-indexing would solve the problem.", "Using one blended score that hides which layer regressed.", "Allowing retrieved instructions to override system behavior."],
  },
  "embedding-types": {
    objectives: ["Explain dense and sparse retrieval signals.", "Design a hybrid candidate pipeline.", "Evaluate fusion and reranking on domain queries."],
    sections: [
      { heading: "Dense retrieval", paragraphs: ["Dense encoders map text into compact continuous vectors. Nearby vectors represent texts the model considers semantically related, which helps with paraphrases, synonyms, and intent that does not share exact words.", "Dense quality depends on the embedding model, its training distribution, input length, pooling, and how well the domain matches the model. It can miss product identifiers, acronyms, names, and rare terminology that were weakly represented during training."] },
      { heading: "Sparse retrieval", paragraphs: ["Sparse retrieval scores lexical evidence such as terms and their corpus frequency. It is interpretable and particularly strong for exact codes, quoted phrases, names, error messages, and uncommon domain vocabulary.", "Lexical matching can miss semantic equivalence. A query using everyday language may not match a technical document that expresses the same idea with different terms."] },
      { heading: "Hybrid candidate generation", paragraphs: ["Hybrid retrieval runs dense and sparse searches, then combines their ranked candidates. Rank-based fusion is often easier to calibrate than adding raw scores because dense and sparse scores live on different scales.", "A reranker can then score a smaller candidate set with a more expensive model. This separates high-recall candidate generation from high-precision ordering and gives each stage a clear latency budget."] },
      { heading: "Evaluation and tuning", paragraphs: ["Build a golden set containing semantic queries, exact identifiers, ambiguous terms, and hard negatives. Measure recall before reranking, ranking quality after fusion, and end-to-end answer quality after generation.", "Do not assume hybrid is automatically better. Poor fusion can suppress a strong channel, and rerankers can introduce latency or domain bias. Tune weights and candidate counts using representative traffic."] },
    ],
    example: { title: "Worked example: hardware support search", scenario: "A user searches for 'power unit failure on ZX-410' while documentation calls the issue 'PSU thermal shutdown' and contains the exact model identifier.", analysis: "Sparse search protects the exact ZX-410 match. Dense search connects 'power unit failure' to 'PSU thermal shutdown'. Fusion keeps candidates supported by either signal, and reranking considers the full query-document relationship.", decision: "Retrieve from both channels, fuse by rank, rerank the top candidates, and evaluate exact-code and semantic query cohorts separately." },
    productionChecklist: ["Version embedding models with their indexes.", "Keep sparse and dense latency budgets visible.", "Monitor candidate overlap between channels.", "Re-embed safely when models change.", "Evaluate by query cohort, not only one aggregate score."],
    commonMistakes: ["Using dense search for identifiers without measuring misses.", "Adding incomparable raw scores without calibration.", "Reranking too many candidates in the request path.", "Changing the embedding model without rebuilding the index."],
  },
  "chunking-strategies": {
    objectives: ["Relate chunk boundaries to retrieval precision and answer context.", "Compare fixed, structural, semantic, and parent-child strategies.", "Design a chunk-size evaluation loop."],
    sections: [
      { heading: "Chunking is an information boundary", paragraphs: ["A retriever ranks chunks, not abstract documents. Every split decides which facts can be represented together and which relationships may be separated. That makes chunking part of the retrieval model rather than a simple preprocessing task.", "Small chunks create focused embeddings but can omit definitions, qualifiers, and neighboring evidence. Large chunks preserve context but mix topics, weaken the matching signal, and consume more generation tokens."] },
      { heading: "Choose boundaries from document structure", paragraphs: ["Fixed-size splitting is predictable and useful as a baseline, but it can cut sentences and sections arbitrarily. Recursive splitting prefers paragraph and sentence boundaries. Document-aware splitting uses headings, lists, tables, and markup to preserve authored structure.", "Semantic splitting looks for topic changes using sentence representations. It can improve coherence but adds preprocessing cost and requires careful tuning for the domain."] },
      { heading: "Separate retrieval granularity from reading context", paragraphs: ["Parent-child retrieval uses small child chunks for precise matching and returns a larger parent section for generation. This avoids forcing one chunk size to satisfy two competing jobs.", "The parent still needs a size limit and access controls. Returning an entire document for every child match can reintroduce token waste and permission problems."] },
      { heading: "Tune with evidence", paragraphs: ["Create questions with known supporting passages, then compare chunk strategies using recall and context precision. Track duplicate retrieval caused by overlap, total index size, ingestion time, and generated-answer faithfulness.", "Tune by document class when necessary. API references, policies, tickets, and transcripts have different structures; one global character count rarely serves all of them well."] },
    ],
    example: { title: "Worked example: policy manual", scenario: "A 90-page manual uses descriptive headings, numbered exceptions, and tables. Many answers require a rule plus the exception immediately below it.", analysis: "Sentence chunks would separate rules from exceptions. Whole-section chunks may be too broad. Structural child chunks with controlled overlap can retrieve the rule precisely, while the parent section supplies the related exception.", decision: "Parse headings and lists, retrieve 300-500 token children, return bounded parent sections, and tune with rule-and-exception questions." },
    productionChecklist: ["Preserve source offsets and document identifiers.", "Apply permissions to every derived chunk.", "Measure overlap duplication and index growth.", "Version the parser and chunking policy.", "Re-index through an idempotent, observable pipeline."],
    commonMistakes: ["Choosing chunk size from a blog instead of domain evaluation.", "Splitting tables or code blocks without structure awareness.", "Using overlap so large that results become duplicates.", "Losing the link from a chunk back to its source and parent."],
  },
  "vector-store-choice": {
    objectives: ["Translate requirements into vector-store capabilities.", "Compare index, metadata, update, and operational constraints.", "Plan a benchmark and migration path."],
    sections: [
      { heading: "Begin with workload requirements", paragraphs: ["Estimate vector count, dimension, update rate, query rate, filter selectivity, latency target, availability, and retention. Include tenancy and regional constraints because they change partitioning and access-control design.", "A small internal corpus with moderate traffic has different needs from a billion-vector consumer search product. Choosing a system before sizing the workload usually produces unnecessary complexity or an early ceiling."] },
      { heading: "Index behavior matters", paragraphs: ["Approximate-nearest-neighbor indexes trade recall, memory, build time, and query latency. Graph-based indexes can offer strong low-latency recall but consume memory. Partitioned or inverted approaches can reduce memory or support scale with different tuning costs.", "Filtering interacts with vector search. A database that performs well without metadata constraints may degrade when every query applies tenant, product, date, or permission filters."] },
      { heading: "Operations are part of the decision", paragraphs: ["Managed services reduce infrastructure ownership but can increase cost and portability risk. An extension inside an existing database can simplify transactions and operations but may have scale or isolation limits. A local library is useful for experiments but does not automatically provide replication, tenancy, or recovery.", "Evaluate backups, index rebuilds, rolling upgrades, monitoring, and failure behavior alongside benchmark numbers. The fastest happy-path query is not enough for a production decision."] },
      { heading: "Benchmark and evolve", paragraphs: ["Build a representative corpus and query set, then test recall, filtered latency, concurrent writes, and recovery. Record configuration, hardware, and cost so results can be reproduced.", "Keep an abstraction around document and retrieval operations only where it supports a credible migration. Avoid hiding capabilities behind an overly generic interface before you understand the chosen system."] },
    ],
    example: { title: "Worked example: internal engineering search", scenario: "The company has 8 million chunks, 20 updates per second, strict team permissions, moderate traffic, and an experienced PostgreSQL operations team.", analysis: "Existing ownership and transactional metadata make a PostgreSQL vector extension a reasonable baseline. Permission filters and index growth are the risks that need measurement.", decision: "Benchmark filtered recall and P95 latency on PostgreSQL first, define a scale threshold for a dedicated store, and keep source data in a rebuildable system of record." },
    productionChecklist: ["Size memory and storage with index overhead.", "Test selective metadata filters.", "Define backup and full rebuild procedures.", "Monitor recall proxies and latency by tenant.", "Keep source documents outside the vector index as the system of record."],
    commonMistakes: ["Selecting by vendor feature lists without a workload.", "Ignoring filtered-query performance.", "Treating an in-memory library as a complete production database.", "Having no rebuild or migration plan."],
  },
  "similarity-choice": {
    objectives: ["Explain cosine similarity and inner product operationally.", "Apply consistent vector normalization.", "Calibrate thresholds and ranking quality on domain data."],
    sections: [
      { heading: "Direction and magnitude", paragraphs: ["Cosine similarity compares vector direction after accounting for length. Inner product combines direction and magnitude. Whether magnitude contains useful information depends on how the embedding model was trained and how vectors are prepared.", "The metric configured in the index must match the embedding model and query pipeline. A mathematically valid metric can still perform poorly when it conflicts with training assumptions."] },
      { heading: "Why normalization changes the choice", paragraphs: ["L2 normalization rescales every vector to unit length. Once both document and query vectors have length one, the cosine denominator is one, so cosine similarity equals their dot product.", "This creates a simple production contract: normalize consistently at ingestion and query time, use an inner-product index when supported, and test that the implementation preserves the expected ranking."] },
      { heading: "Thresholds are not portable", paragraphs: ["Similarity values depend on the model, domain, corpus composition, and negative examples. A threshold that works for one embedding model may reject useful results or admit noise for another.", "Ranking metrics are usually more stable than interpreting one raw score. If the product needs a no-answer threshold, calibrate it on labeled positives and hard negatives and monitor drift after corpus or model changes."] },
      { heading: "High-dimensional search in practice", paragraphs: ["Approximate indexes can change ordering relative to exact search. Measure the recall of the ANN configuration as well as the semantic quality of the embedding model.", "Separate these concerns during debugging: exact-search quality reveals representation problems, while gaps between exact and approximate results reveal index tuning problems."] },
    ],
    example: { title: "Worked example: model migration", scenario: "A team replaces its embedding model but keeps the old index configuration and a hard-coded acceptance threshold.", analysis: "The new model may use a different score distribution and normalization convention. Even if top results look plausible, the threshold and ANN parameters are no longer validated.", decision: "Rebuild the index, verify normalization, compare exact and approximate recall, and recalibrate thresholds on the domain evaluation set before rollout." },
    productionChecklist: ["Store embedding model and normalization versions with the index.", "Normalize queries exactly as indexed documents.", "Compare ANN results against exact-search samples.", "Calibrate thresholds with hard negatives.", "Re-evaluate after model, corpus, or index changes."],
    commonMistakes: ["Mixing normalized queries with unnormalized documents.", "Using a universal cosine threshold.", "Blaming embeddings for an under-tuned ANN index.", "Changing distance metric without rebuilding and evaluating."],
  },
  "long-context-boundary": {
    objectives: ["Recognize bounded tasks where direct context is sufficient.", "Explain cost, latency, attention, security, and freshness trade-offs.", "Combine retrieval with a large reasoning window."],
    sections: [
      { heading: "Capacity is not effective attention", paragraphs: ["A context window states how many tokens a model can accept, not whether every token will influence the answer equally. Long prompts can make relevant evidence harder to locate and can increase sensitivity to ordering.", "For critical tasks, evaluate answer quality as evidence moves through the prompt and as distractor volume grows. Do not infer reliable reasoning merely from a successful request."] },
      { heading: "When direct context is the simpler design", paragraphs: ["Direct context is attractive when the document set is small, bounded, and supplied specifically for one task. It removes ingestion and index maintenance and lets the model reason across the complete material.", "The team still needs token limits, document parsing, permissions, prompt-injection defenses, and evidence attribution. Simpler does not mean uncontrolled."] },
      { heading: "When retrieval remains necessary", paragraphs: ["Large shared collections cannot be resent economically on every request. Frequently changing knowledge needs an update path, and permissioned corpora need document-level controls before prompt assembly.", "Retrieval also creates an observable selection stage. Teams can measure whether evidence was found, inspect why a document ranked, and cite the selected source."] },
      { heading: "Use both as complementary tools", paragraphs: ["A mature system retrieves a focused evidence set and then uses a sufficiently large context window to reason across it. Candidate retrieval controls scale and relevance; the window provides room for synthesis, comparison, and supporting instructions.", "Tune the number and size of retrieved chunks against answer quality, cost, and latency. More context is helpful only while the additional evidence contributes more signal than noise."] },
    ],
    example: { title: "Worked example: contract analysis versus policy search", scenario: "Legal reviews one uploaded contract at a time, while employees repeatedly search thousands of changing policies with team-specific permissions.", analysis: "The contract is bounded and request-specific, so direct context may be sufficient. The policy collection is large, reused, updated, and permissioned, so retrieval provides selection, freshness, and access control.", decision: "Use direct context for the contract workflow after token and quality evaluation; use permission-aware RAG for policy search; share downstream grounding and citation checks." },
    productionChecklist: ["Measure token cost and time to first token.", "Test evidence at different prompt positions.", "Apply permissions before prompt construction.", "Limit and label untrusted document instructions.", "Track which evidence supports each generated claim."],
    commonMistakes: ["Equating maximum window size with reliable use of every token.", "Sending the complete corpus on every request.", "Building retrieval for a single small document without measuring the simpler option.", "Adding more chunks after quality has begun to decline."],
  },
};

function singleLesson(id: string, title: string, prompt: string, question: string, options: string[], correct: number, feedback: string, chapter: number, pages: string): LearningLesson {
  return { id, title, prompt, question, options, correct, feedback, explanation: feedback, takeaways: ["Tie the decision to a measurable requirement.", "State the operational trade-off.", "Define what evidence would change the choice."], model: ["Requirement", "Decision", "Evidence"], source: { chapter, sections: [], pages } };
}

Object.assign(lessonCourseContent, catalogCourseContent);

export const learningModules: LearningModule[] = [
  { id: "rag-anatomy", title: "RAG fundamentals", description: "Choose adaptation methods, representations, chunks, indexes, and context strategies.", duration: "7 lessons", lessons: chapterOneLessons },
  ...catalogLearningModules,
];

export function getLessonKnowledgeChecks(lesson: LearningLesson): KnowledgeCheckQuestion[] {
  const course = lessonCourseContent[lesson.id];
  const example = course?.example ?? {
    scenario: lesson.question,
    decision: `Apply ${lesson.title} only after connecting the requirement to measurable quality, latency, reliability, and cost evidence.`,
  };
  const checklist = course?.productionChecklist ?? ["Define the requirement and success threshold.", "Test representative and difficult cases.", "Specify fallback and rollback behavior."];
  const mistakes = course?.commonMistakes ?? ["Choosing by familiarity alone.", "Evaluating only aggregate results.", "Launching without rollback evidence."];
  const principle = lesson.takeaways.join(" ");

  return [
    {
      id: `${lesson.id}-decision`,
      prompt: `During a production design review for ${lesson.title}, the team must choose an approach under real operating constraints. ${lesson.question} Select the decision that best preserves the stated requirement and an auditable path to validation.`,
      options: lesson.options,
      correct: lesson.correct,
      feedback: lesson.feedback,
    },
    {
      id: `${lesson.id}-worked-scenario`,
      prompt: `A team is preparing to move this lesson's worked example from a successful prototype into a controlled production pilot: ${example.scenario} Which proposal is the most defensible next design decision?`,
      options: [
        "Select the lowest-latency implementation from a vendor benchmark, freeze the design, and infer domain quality from the prototype's average result.",
        example.decision,
        "Adopt the most capable architecture immediately, combine all available mechanisms, and postpone component-level evaluation until enough production feedback accumulates.",
      ],
      correct: 1,
      feedback: `Correct. The worked scenario requires a decision tied to its actual constraint and a reversible validation path. ${example.decision}`,
    },
    {
      id: `${lesson.id}-incident`,
      prompt: `Two weeks after launch, aggregate quality is stable, but one high-value cohort regresses while p99 latency and fallback traffic rise. The team suspects ${lesson.title}, yet several upstream changes shipped together. What should the incident lead do first?`,
      options: [
        "Increase serving capacity and relax the acceptance threshold together, because restoring the aggregate dashboard is the fastest evidence that the design is healthy.",
        "Retrain or reconfigure the lesson's primary mechanism using the newest production events, then compare the new aggregate score with the previous release.",
        `Segment the affected cohort, trace versioned stage inputs and outputs, contain impact with the defined fallback, and use ${checklist.slice(0, 2).join(" and ").toLowerCase()} to decide whether to roll back.`,
      ],
      correct: 2,
      feedback: `Correct. A correlated incident needs containment and stage-level evidence before remediation. The response applies the lesson's production checks instead of assuming ${lesson.title} is the failing layer.`,
    },
    {
      id: `${lesson.id}-tradeoff`,
      prompt: `An architecture reviewer challenges the proposal for ${lesson.title}: the more capable option improves the headline metric, but costs more, weakens explainability, and has not been tested on difficult cohorts. Which response demonstrates the strongest system-design judgment?`,
      options: [
        `Keep the simpler baseline, state the trade-off explicitly, and run a representative comparison guided by these lesson principles: ${principle}`,
        `Choose the more capable option because the headline metric is already higher, then use monitoring to discover whether the untested cohorts or operating costs become material.`,
        `Reject both options and standardize on the organization's most familiar platform, because operational consistency should override task-specific quality evidence during design review.`,
      ],
      correct: 0,
      feedback: `Correct. The lesson is not a prescription for maximum complexity. Its principles must be tested against representative cohorts, explicit trade-offs, and a credible baseline before the architecture expands.`,
    },
    {
      id: `${lesson.id}-change-control`,
      prompt: `A release involving ${lesson.title} passes offline evaluation, but the canary shows a small quality gain alongside rising unit cost and a severe-error increase. The team also committed the common mistake “${mistakes[0]}” during planning. What is the best release decision?`,
      options: [
        "Complete the rollout because the primary offline metric and average online quality improved; address cost and severe errors in the next scheduled model release.",
        `Pause or roll back the canary, preserve the versioned evidence, investigate the severe-error cohort and cost path, then relaunch only after ${checklist.at(-1)?.toLowerCase() ?? "the rollback and validation gates are satisfied"}`,
        "Keep the canary running indefinitely at its current percentage so the team can collect more data without declaring either the release or rollback criteria.",
      ],
      correct: 1,
      feedback: `Correct. A small aggregate gain does not override a severe-error regression or an unbounded cost increase. Reversible rollout gates and explicit evidence are part of the ${lesson.title} decision, not follow-up work.`,
    },
  ];
}
