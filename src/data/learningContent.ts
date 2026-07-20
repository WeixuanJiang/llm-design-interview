import { chapter02Module, chapter02CourseContent } from "./chapters/chapter-02";
import { chapter03Module, chapter03CourseContent } from "./chapters/chapter-03";
import { chapter04Module, chapter04CourseContent } from "./chapters/chapter-04";
import { chapter05Module, chapter05CourseContent } from "./chapters/chapter-05";
import { chapter06Module, chapter06CourseContent } from "./chapters/chapter-06";
import { chapter07Module, chapter07CourseContent } from "./chapters/chapter-07";
import { chapter08Module, chapter08CourseContent } from "./chapters/chapter-08";
import { chapter09Module, chapter09CourseContent } from "./chapters/chapter-09";
import { chapter10Module, chapter10CourseContent } from "./chapters/chapter-10";
import { chapter11Module, chapter11CourseContent } from "./chapters/chapter-11";
import { chapter12Module, chapter12CourseContent } from "./chapters/chapter-12";
import { chapter13Module, chapter13CourseContent } from "./chapters/chapter-13";
import { chapter14Module, chapter14CourseContent } from "./chapters/chapter-14";
import { chapter15Module, chapter15CourseContent } from "./chapters/chapter-15";
import { chapter17Module, chapter17CourseContent } from "./chapters/chapter-17";
import { chapter18Module, chapter18CourseContent } from "./chapters/chapter-18";
import { chapter19Module, chapter19CourseContent } from "./chapters/chapter-19";
import { chapter20Module, chapter20CourseContent } from "./chapters/chapter-20";
import { chapter21Module, chapter21CourseContent } from "./chapters/chapter-21";
import { chapter22Module, chapter22CourseContent } from "./chapters/chapter-22";
import { chapter23Module, chapter23CourseContent } from "./chapters/chapter-23";
import { chapter24Module, chapter24CourseContent } from "./chapters/chapter-24";

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
  knowledgeChecks?: KnowledgeCheckQuestion[];
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
      { heading: "What fine-tuning actually changes", paragraphs: ["Supervised fine-tuning changes the probability of response patterns. It is useful when the desired behavior is stable: follow a house style, produce a schema, classify a request, use domain terminology, or apply a repeatable procedure. It is a poor substitute for a database because facts encoded in weights are difficult to update, attribute, delete, and verify.", "Fine-tuning also introduces an evaluation and release lifecycle. Training data must be curated, training runs versioned, regressions measured, and the resulting model deployed safely. That investment can be justified for repeated behavior, but rarely for facts that change every day. Continued pre-training sits even further along this axis: it can inject a large, stable domain corpus into the model's priors, but it costs GPU-months, needs huge corpora, and still goes stale."] },
      { heading: "Where long context fits", paragraphs: ["Direct long-context prompting can be the simplest solution when the corpus is bounded, supplied for one request, and comfortably fits the model window. Contract review, analysis of a small repository, or comparison of several reports may not need an index at all.", "Window capacity is not the only constraint. Prefill latency and cost rise with input length, access controls are harder to apply inside one large prompt, and relevant facts may receive uneven attention. Long context is therefore a reasoning workspace, not an automatic replacement for retrieval."] },
      { heading: "A practical decision framework", paragraphs: ["Ask four questions in order. How frequently does the information change? Must the answer cite or prove its source? Is the desired change factual or behavioral? Can the relevant corpus be supplied economically and securely on every request?", "Choose the smallest architecture that answers those questions. Direct context is often enough for bounded analysis. Retrieval is appropriate for large, changing, shared, or permissioned knowledge. Fine-tuning is appropriate when stable behavior must become reliable at scale. Production systems can combine all three, but each addition needs a measured reason."] },
    ],
    example: { title: "Worked example: employee policy assistant", scenario: "Policies change weekly, employees have different document permissions, every answer needs a citation, and responses must use a fixed HR tone.", analysis: "Freshness, permissions, and citations are knowledge-delivery requirements, so the policy corpus belongs in retrieval. The fixed tone is a behavior requirement that can begin with prompting and later justify fine-tuning if prompt-only compliance is unreliable.", decision: "Start with permission-aware RAG and a strict response template. Measure retrieval recall, citation correctness, and format compliance separately before deciding whether fine-tuning is needed." },
    productionChecklist: ["Version the corpus and index independently from the model.", "Measure retrieval quality before blaming generation.", "Enforce access control before evidence enters the prompt.", "Track input tokens, time to first token, and end-to-end cost.", "Keep a rollback path for model, prompt, and index changes."],
    commonMistakes: ["Fine-tuning frequently changing facts into weights.", "Using the largest context window without a cost or latency budget.", "Treating RAG as one opaque model call instead of an observable pipeline.", "Combining techniques before establishing which gap each one fixes."],
    knowledgeChecks: [
      {
        id: "adaptation-choice-kc-1",
        prompt: "A customer-support product answers questions from a policy catalog that changes every day, and each answer must cite the exact policy it relied on. Which adaptation method should carry this policy knowledge?",
        options: [
          "Retrieval-augmented generation over a versioned policy index, so updates flow in by re-indexing and every answer can cite its source.",
          "Supervised fine-tuning refreshed on the new policies every week, so the knowledge lives directly in the model's weights.",
          "Continued pre-training on the full policy corpus, so the model internalizes the domain once and for all.",
        ],
        correct: 0,
        feedback: "Retrieval is this lesson's answer for knowledge that changes frequently and must be cited; facts fine-tuned into weights are difficult to update, and continued pre-training still goes stale.",
      },
      {
        id: "adaptation-choice-kc-2",
        prompt: "An employee policy assistant has weekly-changing policies, per-employee document permissions, mandatory citations, and a fixed HR response tone. Which next design decision is the most defensible?",
        options: [
          "Fine-tune the model on the full policy corpus each week so tone and facts are learned together in one artifact.",
          "Paste the entire policy library into a long-context prompt for every request so nothing can be missed.",
          "Put the policies behind permission-aware retrieval with a strict response template, and measure retrieval recall, citation correctness, and format compliance separately before considering fine-tuning.",
        ],
        correct: 2,
        feedback: "The worked example's analysis reaches the same split: freshness, permissions, and citations are knowledge-delivery requirements for retrieval, while the fixed tone is a behavior requirement that prompting addresses first.",
      },
      {
        id: "adaptation-choice-kc-3",
        prompt: "A team fine-tuned last quarter's pricing policies into the model. After this week's pricing update, the assistant keeps quoting the old prices with full confidence. What is the root cause?",
        options: [
          "The retrieval index is stale and should be re-indexed on a daily schedule.",
          "Facts were stored in weights through fine-tuning, which cannot be updated cheaply; the changing prices belong in a retrieval index instead.",
          "The context window is too small to hold the updated price list.",
        ],
        correct: 1,
        feedback: "The lesson's fine-tuning discussion warns that facts encoded in weights are difficult to update, attribute, and verify; frequently changing knowledge belongs in retrieval, not in weights.",
      },
      {
        id: "adaptation-choice-kc-4",
        prompt: "A colleague proposes continued pre-training to inject a large, stable body of legal reference material into the model. How should you evaluate that proposal against retrieval?",
        options: [
          "Approve it unconditionally, because knowledge inside weights is always faster and more reliable than retrieval.",
          "Reject it unconditionally, because continued pre-training never has a legitimate role.",
          "Accept it only for the large, stable corpus it suits, since it costs GPU-months and still goes stale, and keep everything that changes in retrieval.",
        ],
        correct: 2,
        feedback: "The lesson's adaptation discussion places continued pre-training at the far end of the training axis: suited to a large, stable domain corpus, but GPU-months expensive and still stale over time, so changing knowledge stays in retrieval.",
      },
      {
        id: "adaptation-choice-kc-5",
        prompt: "Before launch, how should the team validate that its adaptation choices, retrieval for policies and prompting for tone, actually work for the employee policy assistant?",
        options: [
          "Evaluate retrieval recall, citation correctness, and format compliance as separate measurements, and track input tokens, time to first token, and end-to-end cost.",
          "Ship behind one blended end-to-end quality score so no single stage can be blamed for failures.",
          "Rely on a strong demo, since the choice between RAG and fine-tuning is treated as obvious.",
        ],
        correct: 0,
        feedback: "The worked example's decision and the production checklist measure retrieval, citation, and format layers separately with explicit token, latency, and cost tracking.",
      },
    ],
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
    knowledgeChecks: [
      {
        id: "rag-plus-tuning-kc-1",
        prompt: "A RAG assistant retrieves the right documents and states correct facts, but its answers repeatedly violate the required output schema and house tone. According to this lesson's diagnosis framework, what is the fix?",
        options: [
          "Add more documents to the index so the model sees better examples of the schema.",
          "Fine-tune with supervised examples, because correct facts delivered in the wrong tone and format are a behavior gap, and behavior belongs to fine-tuning.",
          "Enlarge the retrieved context so the model has more room to infer the required format.",
        ],
        correct: 1,
        feedback: "The lesson's diagnosis guidance maps correct facts delivered in the wrong tone or format to a behavior gap, and behavior gaps are fixed with supervised fine-tuning; retrieval has already done its job.",
      },
      {
        id: "rag-plus-tuning-kc-2",
        prompt: "A bank's support assistant must answer in a compliance-approved tone with disclosure boilerplate and a fixed refusal style, while quoting product rates, fees, and policies that change constantly. Which boundary is right?",
        options: [
          "Fine-tune the stable response behavior into weights and retrieve the changing rates, fees, and policy documents from an index: the fixed part lives in weights, the moving part in the index.",
          "Fine-tune the latest rates and fees into the model every night so answers stay fast at inference time.",
          "Retrieve everything and describe the compliance tone in the prompt, hoping the format stays consistent.",
        ],
        correct: 0,
        feedback: "This matches the lesson's worked example: fine-tuning owns the stable response contract while retrieval supplies the constantly changing product facts.",
      },
      {
        id: "rag-plus-tuning-kc-3",
        prompt: "Retrieval returns the correct technical documents, yet the generator keeps ignoring domain jargon and answering around it. Which diagnosis and fix match this lesson's framework?",
        options: [
          "A knowledge gap: add more documents containing the jargon to the index.",
          "A freshness problem: re-index the corpus more frequently.",
          "A representation gap: fine-tune the embedding model and/or the generator so domain terms are represented properly.",
        ],
        correct: 2,
        feedback: "The lesson's diagnosis guidance treats jargon the model ignores despite good retrieval as a representation-layer problem, addressed by adapting the embedding model or the generator.",
      },
      {
        id: "rag-plus-tuning-kc-4",
        prompt: "In a design review, an engineer proposes fine-tuning the model on the entire policy corpus to 'add knowledge' so retrieval can be deleted. What is the strongest response?",
        options: [
          "Approve it, because removing the retriever eliminates retrieval latency and pipeline complexity.",
          "Reject it: fine-tuning is a poor knowledge-injection tool, expensive and not cheaply updatable, and it tends to memorize unreliably and hallucinate confidently on half-learned facts; use it to shape behavior, not to store a knowledge base.",
          "Approve it only if the corpus is small, since small corpora are cheaper to retrain.",
        ],
        correct: 1,
        feedback: "The lesson separates what changes from what stays constant: a corpus that changes belongs in the refreshable index, while fine-tuned weights change slowly through controlled releases, so storing a knowledge base in weights leaves stale, unverifiable facts.",
      },
      {
        id: "rag-plus-tuning-kc-5",
        prompt: "A combined RAG-plus-SFT assistant regresses after a release: retrieval recall is stable, but schema compliance collapsed. How should the team isolate and handle the regression?",
        options: [
          "Roll back the retrieval index first, since retrieval is the most complex stage of the pipeline.",
          "Blend all metrics into one score and optimize that score until the release looks healthy again.",
          "Keep retrieval, grounding, and behavior evaluations as separate suites; with recall stable and schema compliance down, investigate the generator and its fine-tune before touching the index.",
        ],
        correct: 2,
        feedback: "The lesson's evaluation guidance isolates regressions by layer: stable retrieval recall with falling schema compliance points at the generator, while irrelevant citations point at the corpus and ranking pipeline.",
      },
    ],
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
    knowledgeChecks: [
      {
        id: "embedding-types-kc-1",
        prompt: "A parts-search product receives both exact product codes and loose natural-language problem descriptions, and both kinds of query must find the right documentation. Which retrieval representation should the team choose?",
        options: [
          "Dense embeddings only, since semantic meaning eventually covers every query type.",
          "Sparse keyword search only, since exact codes are the hardest queries to satisfy.",
          "Hybrid retrieval: dense embeddings for semantic meaning and synonyms plus sparse term-frequency matching for exact codes, combined through rank-based fusion.",
        ],
        correct: 2,
        feedback: "The lesson's representation sections define dense vectors for semantic meaning and synonyms, sparse term matching for exact keywords, and rank fusion of both channels for stronger precision and recall.",
      },
      {
        id: "embedding-types-kc-2",
        prompt: "A user searches 'power unit failure on ZX-410'; the documentation says 'PSU thermal shutdown' and contains the exact ZX-410 identifier. How do the two retrieval channels contribute?",
        options: [
          "Dense search alone suffices, because 'power unit failure' and 'PSU thermal shutdown' are semantically close.",
          "Sparse search protects the exact ZX-410 match while dense search connects the paraphrase 'power unit failure' to 'PSU thermal shutdown'; rank fusion keeps candidates supported by either signal.",
          "Sparse search alone suffices, because the model identifier is the only reliable signal in the query.",
        ],
        correct: 1,
        feedback: "This is the lesson's worked example: dense vectors capture semantic equivalence across different wording, sparse matching protects the exact identifier, and the hybrid design combines the ranked candidates from both channels.",
      },
      {
        id: "embedding-types-kc-3",
        prompt: "After launch, retrieval misses cluster on queries containing rare domain jargon and part numbers, while paraphrased natural-language queries work well. What is the most likely cause and fix?",
        options: [
          "Dense embeddings miss rare terms that were weakly represented in training; add a sparse keyword channel that still matches exact codes and rare terminology.",
          "The generator is hallucinating; fine-tune the language model on the domain corpus.",
          "Chunks are too small; increase the chunk size so rare terms co-occur more often.",
        ],
        correct: 0,
        feedback: "The lesson's dense-retrieval section warns that dense vectors miss identifiers, acronyms, and rare terminology weakly represented in training, and the sparse channel exists to keep exactly those terms matchable.",
      },
      {
        id: "embedding-types-kc-4",
        prompt: "A teammate argues the team should drop hybrid retrieval and simply buy the largest dense embedding model available, because bigger models are better. How do you respond?",
        options: [
          "Hold to a measured choice: sparse channels protect exact and rare terms that dense models miss, and model selection should follow measured recall on your domain data, not size or leaderboard rank.",
          "Agree: a large enough dense model subsumes keyword matching, so sparse retrieval is legacy technology.",
          "Counter with sparse-only retrieval, since exact matching is interpretable and cheap to run.",
        ],
        correct: 0,
        feedback: "Dense quality depends on how well the model's training distribution matches the domain, not on raw size, and the lesson's evaluation guidance chooses representations by measured recall on representative domain queries.",
      },
      {
        id: "embedding-types-kc-5",
        prompt: "What evaluation plan should gate the launch of the embedding and retrieval pipeline for this mixed workload of exact codes and natural-language questions?",
        options: [
          "Ship whichever embedding model tops a public leaderboard, because rank predicts recall on any corpus.",
          "Build a golden set of semantic queries, exact identifiers, ambiguous terms, and hard negatives; measure retrieval recall by query cohort on your own domain data, and only then consider adapting the embedding model if recall stays poor.",
          "Eyeball a handful of queries in staging and proceed if the results look reasonable.",
        ],
        correct: 1,
        feedback: "The lesson's evaluation section prescribes exactly this golden set and cohort-level recall measurement; leaderboard ranks and model size are not substitutes for measured recall on your data.",
      },
    ],
  },
  "chunking-strategies": {
    objectives: ["Relate chunk boundaries to retrieval precision and answer context.", "Compare fixed, structural, semantic, and parent-child strategies.", "Design a chunk-size evaluation loop."],
    sections: [
      { heading: "Chunking is an information boundary", paragraphs: ["A retriever ranks chunks, not abstract documents. Every split decides which facts can be represented together and which relationships may be separated. That makes chunking part of the retrieval model rather than a simple preprocessing task.", "Small chunks create focused embeddings but can omit definitions, qualifiers, and neighboring evidence. Large chunks preserve context but mix topics, weaken the matching signal, and consume more generation tokens."] },
      { heading: "Choose boundaries from document structure", paragraphs: ["Fixed-size splitting is predictable and useful as a baseline, but it can cut sentences and sections arbitrarily. Recursive splitting prefers paragraph and sentence boundaries. Document-aware splitting uses headings, lists, tables, and markup to preserve authored structure.", "Semantic splitting looks for topic changes using sentence representations. It can improve coherence but adds preprocessing cost and requires careful tuning for the domain."] },
      { heading: "Separate retrieval granularity from reading context", paragraphs: ["Parent-child retrieval uses small child chunks for precise matching and returns a larger parent section for generation. This avoids forcing one chunk size to satisfy two competing jobs.", "The parent still needs a size limit and access controls. Returning an entire document for every child match can reintroduce token waste and permission problems."] },
      { heading: "Tune with evidence", paragraphs: ["Create questions with known supporting passages, then compare chunk strategies using recall and context precision. A measured starting point is about 512 tokens with roughly 64 tokens of overlap, with candidate sizes grid-searched on the labeled set rather than guessed. Very small chunks produce noisy embeddings, split answers across boundaries, and inflate index size and search cost. A common parent-child split retrieves children of about 400 tokens while returning parents of about 1600 tokens for generation. Track duplicate retrieval caused by overlap, total index size, ingestion time, and generated-answer faithfulness.", "Tune by document class when necessary. API references, policies, tickets, and transcripts have different structures; one global character count rarely serves all of them well."] },
    ],
    example: { title: "Worked example: policy manual", scenario: "A 90-page manual uses descriptive headings, numbered exceptions, and tables. Many answers require a rule plus the exception immediately below it.", analysis: "Sentence chunks would separate rules from exceptions. Whole-section chunks may be too broad. Structural child chunks with controlled overlap can retrieve the rule precisely, while the parent section supplies the related exception.", decision: "Parse headings and lists, retrieve 300-500 token children, return bounded parent sections, and tune with rule-and-exception questions." },
    productionChecklist: ["Preserve source offsets and document identifiers.", "Apply permissions to every derived chunk.", "Measure overlap duplication and index growth.", "Version the parser and chunking policy.", "Re-index through an idempotent, observable pipeline."],
    commonMistakes: ["Choosing chunk size from a blog instead of domain evaluation.", "Splitting tables or code blocks without structure awareness.", "Using overlap so large that results become duplicates.", "Losing the link from a chunk back to its source and parent."],
    knowledgeChecks: [
      {
        id: "chunking-strategies-kc-1",
        prompt: "You are indexing a mixed document corpus for the first time and need a defensible default chunking strategy before any tuning begins. Which strategy is the recommended default to start from?",
        options: [
          "Fixed-size splitting at N characters with overlap, because it is simple and predictable.",
          "Recursive character splitting, which tries paragraph boundaries first, then line breaks, then sentence separators, in priority order.",
          "One embedding per document, so no relationship is ever split apart.",
        ],
        correct: 1,
        feedback: "The lesson's boundary guidance presents recursive splitting, preferring paragraph and then sentence boundaries, as the default; fixed-size splitting is the simple baseline that can cut sentences arbitrarily.",
      },
      {
        id: "chunking-strategies-kc-2",
        prompt: "A 90-page policy manual has descriptive headings and numbered exceptions, and most answers require a rule plus the exception written immediately below it. Which chunking design fits best?",
        options: [
          "Split every sentence into its own chunk so each embedding is maximally focused.",
          "Embed the manual as one vector per page so context is never lost.",
          "Parse the structure, retrieve small child chunks that match the rule precisely, and return the bounded parent section so the related exception comes along for generation.",
        ],
        correct: 2,
        feedback: "This mirrors the lesson's worked example and its parent-child pattern: small children for precise matching with a bounded parent returned for context, so one chunk size is not forced to serve both jobs.",
      },
      {
        id: "chunking-strategies-kc-3",
        prompt: "After a chunking change to 2000-token passages, retrieval precision drops: returned chunks contain the answer somewhere, but ranking quality and answer accuracy both degrade. What went wrong?",
        options: [
          "Chunks are too large: each embedding averages over too much content, so irrelevant material dilutes the relevant signal and precision drops.",
          "Chunks are too small: the answers span multiple chunks and none of them is sufficient alone.",
          "The embedding model is broken and must be replaced before any other change.",
        ],
        correct: 0,
        feedback: "The lesson's boundary guidance warns that oversized chunks mix topics and weaken the matching signal, so relevant material is diluted and ranking precision drops.",
      },
      {
        id: "chunking-strategies-kc-4",
        prompt: "A colleague proposes 50-to-100-token micro-chunks, arguing that tiny chunks give the most focused embeddings and the retriever can simply return more of them. What is the strongest counterargument?",
        options: [
          "Agree: smaller chunks always improve embedding focus, and the extra retrieval cost is negligible.",
          "Argue for the opposite extreme of 2000-token chunks, since the model can find anything inside a big chunk.",
          "Tiny chunks lack context, their embeddings get noisy, answers span multiple chunks with none individually sufficient, and indexing and searching many more chunks raises cost; start near 512 tokens with about 64 tokens of overlap and tune from there.",
        ],
        correct: 2,
        feedback: "The lesson's tuning guidance names exactly these costs of too-small chunks and starts near 512 tokens with about 64 tokens of overlap before measured adjustment.",
      },
      {
        id: "chunking-strategies-kc-5",
        prompt: "How should the team tune chunk size for this corpus so the decision survives a rigorous production design review?",
        options: [
          "Start at 512 tokens with 64-token overlap, build a labeled eval set, measure Context Precision@5, grid-search candidate sizes, and consider parent-child with a 400-token child and a 1600-token parent.",
          "Copy a chunk size recommended in a popular blog post and move on to other work.",
          "Increase overlap until every fact appears in at least two chunks, then stop tuning.",
        ],
        correct: 0,
        feedback: "The lesson's tuning loop is exactly this: a measured starting point, context precision on a labeled set, grid search over candidate sizes, and the parent-child split; chunk size is a tuned parameter with a metric, not a guess.",
      },
    ],
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
    knowledgeChecks: [
      {
        id: "vector-store-choice-kc-1",
        prompt: "A team already runs PostgreSQL in production, has moderate vector volume, and wants embeddings stored next to transactional metadata. What is the most pragmatic first evaluation?",
        options: [
          "A PostgreSQL vector extension, so embeddings sit beside transactional metadata in a system the team already operates.",
          "An in-memory index library, because its flat benchmarks are the fastest option.",
          "A purpose-built distributed vector database designed and written in-house.",
        ],
        correct: 0,
        feedback: "The lesson's worked example and operations guidance both start from existing capability: an extension inside the database the team already runs is the credible first benchmark before adding another system.",
      },
      {
        id: "vector-store-choice-kc-2",
        prompt: "An internal engineering search holds 8 million chunks with 20 updates per second, strict team permissions, moderate traffic, and an experienced PostgreSQL operations team. What is the most defensible evaluation path?",
        options: [
          "Adopt a managed serverless vector service immediately, since low operations overhead always wins.",
          "Benchmark filtered recall and p95 latency on the PostgreSQL extension first, define the scale threshold that would force a dedicated store, and keep source documents in a rebuildable system of record.",
          "Deploy a single-node in-memory index library on one large machine, since flat benchmarks look fastest.",
        ],
        correct: 1,
        feedback: "This is the worked example's own decision: benchmark the incumbent PostgreSQL extension first, because permission filters and index growth are the risks worth measuring before any migration.",
      },
      {
        id: "vector-store-choice-kc-3",
        prompt: "A prototype built on an easy local-dev, in-memory index works beautifully on a laptop, but production needs replication, tenancy, backups, and recovery. What is the correct diagnosis?",
        options: [
          "The index is fine; just add more memory and put a load balancer in front of it.",
          "The distance metric is wrong; switching from cosine to inner product will fix it.",
          "The tool is a local-development and research library, not a production database: it does not provide replication, tenancy, backups, or recovery, so evaluate a production-grade store.",
        ],
        correct: 2,
        feedback: "The lesson's operations guidance says a local library is useful for experiments but does not automatically provide replication, tenancy, or recovery; production needs a store evaluated on those behaviors.",
      },
      {
        id: "vector-store-choice-kc-4",
        prompt: "In the design review, one camp wants a managed serverless vector database for low operations overhead, while another wants the PostgreSQL extension for operational reuse. How should the decision be made?",
        options: [
          "Managed always wins, because operations overhead is the only real cost in the decision.",
          "Decide by workload and operating model: managed services trade cost and portability for lower operations overhead, an extension inside the existing database reuses current capability with possible scale or isolation limits, and a dedicated store earns its place only through measured workload needs; then benchmark on the real corpus.",
          "Pick whichever store lists the fastest graph index, since the index type settles the whole question.",
        ],
        correct: 1,
        feedback: "The lesson's operations guidance draws exactly these contrasts, managed services versus an in-place extension versus a dedicated store, and its benchmark section decides on the real corpus and query distribution.",
      },
      {
        id: "vector-store-choice-kc-5",
        prompt: "What benchmark evidence should gate the vector-store decision before the team commits to a single system for production use?",
        options: [
          "The vendor's published benchmark numbers, since those are measured by experts.",
          "Happy-path single-query latency on a small synthetic dataset.",
          "A representative corpus and query distribution testing filtered recall, concurrent writes, index behavior and recall under the chosen approximate-index configuration, and recovery, with source documents kept outside the index as the system of record.",
        ],
        correct: 2,
        feedback: "The lesson's benchmark guidance builds a representative corpus and query set, then tests recall, filtered latency, concurrent writes, and recovery; the fastest happy-path vendor query is not production evidence.",
      },
    ],
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
    knowledgeChecks: [
      {
        id: "similarity-choice-kc-1",
        prompt: "Every document embedding was L2-normalized at ingestion, and query vectors are normalized the same way. Which similarity configuration should the index use, and why?",
        options: [
          "Cosine similarity computed with the full denominator at query time, because cosine is the only valid text metric.",
          "Euclidean distance, because it is the natural default once vectors are normalized.",
          "Dot product: with unit-length vectors the cosine denominator collapses to one, so inner product gives cosine semantics while skipping the division, and many approximate indexes are optimized for inner product.",
        ],
        correct: 2,
        feedback: "The lesson derives that with unit-length vectors the cosine denominator is one, so cosine equals the dot product; the production contract is consistent normalization plus an inner-product index.",
      },
      {
        id: "similarity-choice-kc-2",
        prompt: "A team migrates to a new embedding model but keeps the old index configuration and a hard-coded similarity acceptance threshold. What must happen before this migration ships?",
        options: [
          "Rebuild the index with the new model's vectors, verify the normalization convention matches, and recalibrate the threshold on the domain evaluation set, because score ranges are model- and corpus-specific.",
          "Nothing: cosine similarity is a universal scale, so the old threshold still means the same thing.",
          "Only re-embed the queries, since the indexed documents themselves are unchanged.",
        ],
        correct: 0,
        feedback: "This is the worked example's decision: the lesson's threshold guidance warns that similarity values depend on the model, domain, and corpus, so a migrated model needs a rebuilt index, verified normalization, and a recalibrated threshold.",
      },
      {
        id: "similarity-choice-kc-3",
        prompt: "After a pipeline change, retrieval scores become meaningless: queries are L2-normalized in the new code path, but the index was built from un-normalized embeddings. What is the failure?",
        options: [
          "The curse of dimensionality finally caught up with the corpus.",
          "The normalization contract was broken: whatever normalization is applied at index time must also be applied to the query vector, otherwise the scores are meaningless.",
          "The approximate index is corrupted and must be rebuilt with different parameters.",
        ],
        correct: 1,
        feedback: "The lesson's normalization contract says ingestion and query time must match exactly, and its common-mistakes list names this mix of normalized queries with unnormalized documents as a classic failure.",
      },
      {
        id: "similarity-choice-kc-4",
        prompt: "A reviewer asks when dot product and cosine similarity actually rank documents differently, and whether that difference is signal or bias. What is the accurate answer?",
        options: [
          "With un-normalized vectors, dot product mixes direction and magnitude, so a long document with many relevant terms scores higher at the same angular distance, while cosine removes magnitude bias by measuring angle only; normalize everything and the two coincide.",
          "They always rank identically under every configuration, so the choice never matters.",
          "Dot product is always superior because magnitude always carries useful information.",
        ],
        correct: 0,
        feedback: "The lesson's direction-and-magnitude discussion defines cosine as angle-only and dot product as direction plus magnitude, which is why the choice collapses once vectors are normalized.",
      },
      {
        id: "similarity-choice-kc-5",
        prompt: "The product needs a similarity threshold below which the assistant declines to answer. How should that threshold be set?",
        options: [
          "Use the 0.7 cutoff from a well-known tutorial; cosine ranges are stable across models.",
          "Take the vendor's default, since the database knows its own score distribution best.",
          "Calibrate it per model on your own data with labeled positives and hard negatives: similarity ranges are model- and corpus-specific, so a cutoff imported from another model or a blog post will reject useful results or admit noise.",
        ],
        correct: 2,
        feedback: "The lesson's threshold guidance says values depend on the model, domain, and corpus; calibrate any no-answer threshold on labeled positives and hard negatives and monitor drift after changes.",
      },
    ],
  },
  "long-context-boundary": {
    objectives: ["Recognize bounded tasks where direct context is sufficient.", "Explain cost, latency, attention, security, and freshness trade-offs.", "Combine retrieval with a large reasoning window."],
    sections: [
      { heading: "Capacity is not effective attention", paragraphs: ["A context window states how many tokens a model can accept, not whether every token will influence the answer equally. Long prompts can make relevant evidence harder to locate and can increase sensitivity to ordering. Empirical key-fact studies find accuracy is highest when evidence sits near the beginning or end of a long prompt and degrades when it sits in the middle, a pattern known as lost-in-the-middle, and the dip widens as the total context grows.", "For critical tasks, evaluate answer quality as evidence moves through the prompt and as distractor volume grows. Do not infer reliable reasoning merely from a successful request."] },
      { heading: "When direct context is the simpler design", paragraphs: ["Direct context is attractive when the document set is small, bounded, and supplied specifically for one task. It removes ingestion and index maintenance and lets the model reason across the complete material.", "The team still needs token limits, document parsing, permissions, prompt-injection defenses, and evidence attribution. Simpler does not mean uncontrolled."] },
      { heading: "When retrieval remains necessary", paragraphs: ["Large shared collections cannot be resent economically on every request. Frequently changing knowledge needs an update path, and permissioned corpora need document-level controls before prompt assembly.", "Retrieval also creates an observable selection stage. Teams can measure whether evidence was found, inspect why a document ranked, and cite the selected source."] },
      { heading: "Use both as complementary tools", paragraphs: ["A mature system retrieves a focused evidence set and then uses a sufficiently large context window to reason across it. Candidate retrieval controls scale and relevance; the window provides room for synthesis, comparison, and supporting instructions.", "Tune the number and size of retrieved chunks against answer quality, cost, and latency. More context is helpful only while the additional evidence contributes more signal than noise."] },
    ],
    example: { title: "Worked example: contract analysis versus policy search", scenario: "Legal reviews one uploaded contract at a time, while employees repeatedly search thousands of changing policies with team-specific permissions.", analysis: "The contract is bounded and request-specific, so direct context may be sufficient. The policy collection is large, reused, updated, and permissioned, so retrieval provides selection, freshness, and access control.", decision: "Use direct context for the contract workflow after token and quality evaluation; use permission-aware RAG for policy search; share downstream grounding and citation checks." },
    productionChecklist: ["Measure token cost and time to first token.", "Test evidence at different prompt positions.", "Apply permissions before prompt construction.", "Limit and label untrusted document instructions.", "Track which evidence supports each generated claim."],
    commonMistakes: ["Equating maximum window size with reliable use of every token.", "Sending the complete corpus on every request.", "Building retrieval for a single small document without measuring the simpler option.", "Adding more chunks after quality has begun to decline."],
    knowledgeChecks: [
      {
        id: "long-context-boundary-kc-1",
        prompt: "An analyst asks a one-off question about a single contract that fits comfortably inside the model's context window, and there is no shared knowledge base. What is the simplest credible approach?",
        options: [
          "Stand up a full retrieval pipeline with ingestion, chunking, and an index before answering.",
          "Provide the contract directly in the prompt: the corpus is bounded, supplied per request, and the task is one-off analysis, so direct context is sufficient if cost and latency are acceptable.",
          "Fine-tune the contract into the model's weights so it can answer without the document.",
        ],
        correct: 1,
        feedback: "The lesson's bounded-task guidance says direct context is the simpler design when the document set is small, bounded, and supplied for one request; the team still checks token limits, cost, and latency.",
      },
      {
        id: "long-context-boundary-kc-2",
        prompt: "Legal reviews one uploaded contract at a time, while thousands of employees repeatedly search a large, frequently changing, team-permissioned policy library. Which architecture split is right?",
        options: [
          "Long-context prompting for both, since modern windows can hold entire libraries.",
          "Retrieval for both, since retrieval is always the more mature pattern.",
          "Direct context for the bounded, request-specific contract workflow after token and quality evaluation, and permission-aware RAG for the large, changing, permissioned policy library.",
        ],
        correct: 2,
        feedback: "The worked example's decision splits exactly this way: direct context for the bounded contract task, permission-aware retrieval for the large, changing, permissioned policy collection.",
      },
      {
        id: "long-context-boundary-kc-3",
        prompt: "A long-context assistant answers questions about facts near the beginning or end of a pasted 500-page document correctly, but consistently misses relevant facts buried in the middle. What explains this?",
        options: [
          "The lost-in-the-middle effect: accuracy follows a U-shaped curve over the context, strongest at the edges and degraded in the middle, so a token being inside the window does not guarantee it is effectively used.",
          "The model is hallucinating at random, and nothing systematic is happening.",
          "The context window is still too small; a larger window would fix the problem.",
        ],
        correct: 0,
        feedback: "The lesson's attention guidance describes exactly this edge-versus-middle degradation, called lost-in-the-middle, and notes the dip widens as prompts grow, so a larger window does not fix it.",
      },
      {
        id: "long-context-boundary-kc-4",
        prompt: "A stakeholder asks why the team is building a retrieval pipeline when a 1M-token window could simply hold everything. What is the strongest defense of retrieval?",
        options: [
          "Concede: a window that large holds several books, so retrieval is effectively obsolete.",
          "Prefill cost and latency scale with input tokens, so resending a huge corpus on every query is far more expensive than retrieving a small set of relevant chunks; freshness means resending updated text on every call; a blob prompt offers no per-document access control, citations, or provenance; and attention across long prompts is uneven, so a focused retrieved set often answers better.",
          "Retrieval exists only because language models cannot physically read long inputs.",
        ],
        correct: 1,
        feedback: "The lesson's retrieval-necessity guidance lists scale, cost and latency, freshness, access control, citations, and attention quality as the reasons retrieval survives large windows; each one appears in this defense.",
      },
      {
        id: "long-context-boundary-kc-5",
        prompt: "How should the team combine retrieval and the large context window, and what should it measure to keep the design honest?",
        options: [
          "Use RAG to select the right few thousand tokens and the large window to reason over them with headroom; measure answer quality as evidence moves within the prompt, plus token cost and time to first token.",
          "Always fill the window to capacity so no evidence can be left out, and measure only final answer quality.",
          "Disable retrieval once the window exceeds the corpus size, and stop tracking token cost.",
        ],
        correct: 0,
        feedback: "The lesson's complementary-tools guidance makes retrieval the relevance and cost filter and the window the reasoning space, and the production checklist tracks token cost, time to first token, and evidence position.",
      },
    ],
  },
};

Object.assign(
  lessonCourseContent,
  chapter02CourseContent,
  chapter03CourseContent,
  chapter04CourseContent,
  chapter05CourseContent,
  chapter06CourseContent,
  chapter07CourseContent,
  chapter08CourseContent,
  chapter09CourseContent,
  chapter10CourseContent,
  chapter11CourseContent,
  chapter12CourseContent,
  chapter13CourseContent,
  chapter14CourseContent,
  chapter15CourseContent,
  chapter17CourseContent,
  chapter18CourseContent,
  chapter19CourseContent,
  chapter20CourseContent,
  chapter21CourseContent,
  chapter22CourseContent,
  chapter23CourseContent,
  chapter24CourseContent,
);

export const learningModules: LearningModule[] = [
  { id: "rag-anatomy", title: "RAG fundamentals", description: "Choose adaptation methods, representations, chunks, indexes, and context strategies.", duration: "7 lessons", lessons: chapterOneLessons },
  chapter02Module,
  chapter03Module,
  chapter04Module,
  chapter05Module,
  chapter06Module,
  chapter07Module,
  chapter08Module,
  chapter09Module,
  chapter10Module,
  chapter11Module,
  chapter12Module,
  chapter13Module,
  chapter14Module,
  chapter15Module,
  chapter17Module,
  chapter18Module,
  chapter19Module,
  chapter20Module,
  chapter21Module,
  chapter22Module,
  chapter23Module,
  chapter24Module,
];

export function getLessonKnowledgeChecks(lesson: LearningLesson): KnowledgeCheckQuestion[] {
  const course = lessonCourseContent[lesson.id];
  // Explicit per-lesson questions (authored per chapter) always win; the generic
  // frames below are only a safety net for lessons that lack course content.
  if (course?.knowledgeChecks?.length) return course.knowledgeChecks;
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
