import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

const chapter02Lessons = [
  {
    id: "ch2-hybrid-retrieval",
    title: "Hybrid Retrieval: BM25 + Vector Search",
    prompt: "Fuse sparse and dense candidates into one ranked list",
    question: "Your dense-only retriever keeps missing exact invoice IDs, while a BM25-only prototype misses paraphrased questions. Which query path fixes both failure modes at once?",
    options: [
      "Add the raw BM25 and cosine scores into a single weighted sum and rank by the result",
      "Increase the dense retriever's top-k until the exact identifiers show up by recall alone",
      "Run BM25 and dense retrieval in parallel for the same query and merge the two ranked lists with Reciprocal Rank Fusion",
    ],
    correct: 2,
    feedback: "Strong choice. RRF fusion lets each channel contribute what it is good at: BM25 anchors exact terms while dense retrieval adds semantic matches.",
    explanation: "Hybrid retrieval runs a sparse BM25 search and a dense vector search for the same query, then merges the two ranked lists with Reciprocal Rank Fusion, scoring each document as the sum of 1/(k + rank) with k = 60. Because RRF consumes ranks rather than raw scores, neither channel's score scale can dominate the merged list. Ensemble weights between the channels, such as 0.35 sparse and 0.65 dense, are tuned on an evaluation set rather than guessed.",
    takeaways: [
      "Retrieve from sparse and dense channels in parallel for the same query.",
      "Fuse ranked lists with RRF (k = 60) instead of mixing raw scores.",
      "Tune channel weights on an eval set and keep them in versioned config.",
    ],
    model: ["Sparse candidates", "Dense candidates", "RRF fusion"],
    source: { chapter: 2, sections: ["2.1.1"], pages: "29" },
  },
  {
    id: "ch2-query-rewriting",
    title: "Query Rewriting and Expansion",
    prompt: "Match the rewriting technique to the retrieval gap",
    question: "Users ask short, vague questions while your documents are written as complete declarative answers, and embedding the raw question retrieves poorly. Which technique targets this mismatch directly?",
    options: [
      "HyDE: generate a hypothetical answer and embed it, because answer-shaped text sits closer to the document distribution",
      "Step-back: rewrite the question into a more abstract form to retrieve foundational context",
      "Multi-query: generate 3-5 reformulations and take the union of their results",
    ],
    correct: 0,
    feedback: "Strong choice. HyDE closes the question-to-document gap by embedding a hypothetical answer, which lives closer to the document distribution than the raw question does.",
    explanation: "Query rewriting fixes mismatches between how users ask and how documents are written, and each technique targets a different gap. Multi-query generates 3-5 reformulations and unions their results for phrasing coverage; step-back asks a more abstract form to retrieve foundational context; HyDE embeds a hypothetical answer because answer-shaped text matches answer-shaped documents better. The choice depends on which failure you actually observe.",
    takeaways: [
      "Diagnose the query-document mismatch before choosing a rewrite.",
      "Use multi-query for phrasing variance, step-back for abstraction gaps, HyDE for distribution gaps.",
      "Union or merge rewritten-query results instead of trusting one reformulation.",
    ],
    model: ["Diagnose the gap", "Rewrite the query", "Retrieve and merge"],
    source: { chapter: 2, sections: ["2.1.2"], pages: "30" },
  },
  {
    id: "ch2-reranking-pipeline",
    title: "Re-ranking Pipeline",
    prompt: "Match each ranking stage to its job and budget",
    question: "Your bi-encoder returns 50 fused candidates in milliseconds, but the top results often miss the query's intent. The latency budget allows scoring tens of query-document pairs per query, not millions. What do you add?",
    options: [
      "Replace the bi-encoder with a cross-encoder that scores every document in the corpus at query time",
      "Keep the bi-encoder for cheap candidate retrieval, then re-rank the top candidates with a cross-encoder",
      "Raise the bi-encoder's top-k and trust the wider candidate set to fix ordering precision",
    ],
    correct: 1,
    feedback: "Strong choice. The two-stage pattern keeps bi-encoder recall cheap and buys cross-encoder precision only where it is affordable: on a small candidate set.",
    explanation: "A bi-encoder encodes query and document independently, so it cannot attend to their interaction; it only aligns them in a shared embedding space. A cross-encoder concatenates query and document into one sequence with full attention across both, giving a much more accurate relevance judgment at O(n) cost per query. That cost caps cross-encoders at roughly 20-100 candidates, which is why production systems run them as a second stage over bi-encoder output, with LLM-based scoring as the expensive, highest-quality option.",
    takeaways: [
      "Bi-encoders trade interaction accuracy for index-time speed.",
      "Cross-encoders score query-document pairs jointly and fit only small candidate sets.",
      "Two-stage retrieval gets near-cross-encoder quality at near-bi-encoder cost.",
    ],
    model: ["Retrieve top-k fast", "Re-rank jointly", "Return the top few"],
    source: { chapter: 2, sections: ["2.1.3"], pages: "30" },
  },
  {
    id: "ch2-multi-hop-retrieval",
    title: "Multi-hop Retrieval",
    prompt: "Retrieve facts that depend on earlier facts",
    question: "A question needs facts from multiple documents, and the second lookup only makes sense after the first one returns. Which loop structure handles this?",
    options: [
      "Retrieve once with a much larger top-k so every needed fact is likely included in the first pass",
      "Let the LLM fill the gaps from parametric knowledge instead of issuing follow-up lookups",
      "Retrieve for the original query, extract entities and claims, generate follow-up queries for the missing facts, then re-retrieve and synthesize",
    ],
    correct: 2,
    feedback: "Strong choice. Multi-hop retrieval is iterative: each round's findings generate the next round's queries until the missing facts are filled in.",
    explanation: "Single-pass retrieval cannot answer questions whose follow-up lookups depend on facts found earlier, because the follow-up query cannot be written until the first evidence is read. The iterative loop retrieves for the original query, extracts entities and claims from the results, generates follow-up queries for missing facts, then re-retrieves and synthesizes. Production versions bound this loop with max hops, timeouts, and deduplicated context caps.",
    takeaways: [
      "Recognize questions whose later lookups depend on earlier facts.",
      "Generate follow-up queries from extracted entities and claims, not from thin air.",
      "Synthesize only after the loop has gathered the missing facts.",
    ],
    model: ["Retrieve", "Extract and follow up", "Re-retrieve and synthesize"],
    source: { chapter: 2, sections: ["2.1.4"], pages: "30" },
  },
];

export const chapter02Module: LearningModule = {
  id: "chapter-2-advanced-retrieval-design",
  title: "Advanced Retrieval Design",
  description: "Move from basic vector lookup to production-grade search design: combine lexical search, dense retrieval, query understanding, and re-ranking to maximize precision under latency constraints.",
  duration: "4 lessons",
  lessons: chapter02Lessons,
};

export const chapter02CourseContent: Record<string, LessonCourseContent> = {
  "ch2-hybrid-retrieval": {
    objectives: [
      "Explain how sparse BM25 and dense vector retrieval complement each other in one query path.",
      "Apply Reciprocal Rank Fusion to merge ranked candidate lists from both channels.",
      "Operate hybrid search with input validation, fallback behavior, and tunable weights.",
    ],
    sections: [
      {
        heading: "Why one index is not enough",
        paragraphs: [
          "Production search quality rarely comes from a single index. The chapter's premise is that strong systems combine lexical search, dense retrieval, query understanding, and re-ranking to maximize precision under latency constraints, and hybrid retrieval is the first building block of that combination.",
          "Hybrid retrieval runs two retrievers for the same query: a sparse BM25 keyword search and a dense vector search over the same corpus. BM25 contributes exact lexical evidence while the dense channel contributes semantic similarity, and each channel retrieves its own top-k (k = 10 per retriever is a typical starting point) so both signals are represented before any merging happens.",
        ],
      },
      {
        heading: "Merging ranked lists with RRF",
        paragraphs: [
          "The merge step is Reciprocal Rank Fusion: each document's fused score is the sum over the ranked lists of 1/(k + rank), with k = 60. Because the formula consumes ranks rather than raw scores, a document near the top of either list earns a strong fused position without any cross-channel score calibration.",
          "An ensemble retriever wraps the two channels with explicit weights, using 0.35 sparse and 0.65 dense as a documented starting point. Those weights are meant to be tuned on your own evaluation set, not adopted as universal constants, because the right balance depends on the query mix.",
        ],
      },
      {
        heading: "Failure behavior in the query path",
        paragraphs: [
          "The hybrid query path validates input first: an empty or whitespace-only query raises immediately instead of silently hitting both indexes. That keeps malformed requests from burning latency and producing meaningless fused lists.",
          "If the ensemble call fails, the path logs the exception and degrades to dense-only retrieval; if that fallback also fails, it returns an empty result for the caller to handle. Graceful degradation is part of the retrieval contract, not an afterthought bolted on after launch.",
        ],
      },
      {
        heading: "What production adds",
        paragraphs: [
          "A production system adds more on top of the basic ensemble: per-retriever timeouts so a slow channel cannot stall the whole query, and a circuit breaker on the vector store so an unhealthy dependency stops receiving traffic.",
          "Just as important, channel weights live in versioned configuration rather than source code, so they can be retuned against a fresh eval set without a redeploy. Query normalization also belongs in this layer, applied before either retriever runs.",
        ],
      },
    ],
    example: {
      title: "Worked example: hybrid search for a support knowledge base",
      scenario: "A support product searches tickets and documentation. Exact error codes must match literally, most users describe symptoms in their own words, and the vector store is an external dependency that occasionally times out.",
      analysis: "Dense-only retrieval risks missing the literal error codes, while BM25-only risks missing paraphrased symptom descriptions. Running both channels and fusing with RRF covers both query styles, and a dense-only degraded path keeps search alive when the ensemble call fails.",
      decision: "Ship BM25 (k = 10) and dense (k = 10) behind an ensemble with eval-tuned weights and RRF fusion, add per-retriever timeouts and a circuit breaker on the vector store, and test the dense-only fallback before launch.",
    },
    productionChecklist: [
      "Validate that queries are non-empty before invoking any retriever.",
      "Set per-retriever top-k and per-retriever timeouts explicitly.",
      "Tune ensemble weights on an eval set, not by intuition.",
      "Load fusion weights from versioned config so retuning needs no redeploy.",
      "Implement and test the degraded path for each channel failure.",
    ],
    commonMistakes: [
      "Hard-coding fusion weights in source instead of versioned configuration.",
      "Letting one slow retriever stall the whole query with no timeouts or circuit breaker.",
      "Surfacing an exception to the caller instead of a degraded result set.",
      "Assuming a single index covers both exact terms and semantic similarity.",
    ],
    knowledgeChecks: [
      {
        id: "ch2-hybrid-retrieval-kc-1",
        prompt: "Your search must handle exact invoice identifiers and paraphrased natural-language questions in one query path, and you can only run one merge step. Which design should you ship?",
        options: [
          "Sum raw BM25 and cosine scores with fixed weights and rank by the total",
          "Double the dense retriever's top-k so exact identifiers appear by recall alone",
          "Run BM25 and dense retrieval in parallel and fuse the two ranked lists with RRF",
        ],
        correct: 2,
        feedback: "Correct — this lesson's RRF section merges sparse and dense ranked lists via Reciprocal Rank Fusion with k = 60, not by adding raw scores.",
      },
      {
        id: "ch2-hybrid-retrieval-kc-2",
        prompt: "In the support knowledge base worked example, exact error codes must match literally while users describe symptoms in their own words. What does the hybrid design deploy per query?",
        options: [
          "BM25 and dense retrievers each returning their own top-k, merged with RRF using eval-tuned ensemble weights",
          "A single dense retriever with a larger embedding model to cover both query styles",
          "BM25 alone with synonym expansion added to every incoming query",
        ],
        correct: 0,
        feedback: "Correct — the lesson's ensemble design runs BM25 with k = 10 and dense with k = 10, combined under weights like 0.35/0.65 tuned on an eval set.",
      },
      {
        id: "ch2-hybrid-retrieval-kc-3",
        prompt: "After launch, the vector store starts timing out and every hybrid query fails outright, returning errors to users instead of results. Which missing behavior from this lesson's query-path design would have contained this?",
        options: [
          "A larger candidate pool from each retriever so the failures cancel each other out",
          "A logged fallback that degrades to dense-only retrieval and ultimately an empty result the caller handles",
          "An immediate retry loop against the same ensemble until it eventually succeeds",
        ],
        correct: 1,
        feedback: "Correct — the lesson's failure-path design logs the ensemble failure, degrades to dense-only, and finally returns an empty result for the caller to handle.",
      },
      {
        id: "ch2-hybrid-retrieval-kc-4",
        prompt: "A reviewer proposes hard-coding the 0.35 sparse and 0.65 dense ensemble weights in source to keep the code simple. What is the strongest defense of loading them from versioned config instead?",
        options: [
          "Versioned config loads faster at process startup than constants compiled into the binary",
          "Hard-coded weights are a security risk because attackers can read the source repository",
          "The weights must be retuned on fresh eval sets, and versioned config allows retuning without a redeploy",
        ],
        correct: 2,
        feedback: "Correct — the lesson's production section keeps weights in versioned config rather than source code, so they can be retuned without a redeploy.",
      },
      {
        id: "ch2-hybrid-retrieval-kc-5",
        prompt: "Before rolling out hybrid retrieval, the team wants evidence that the fusion layer is configured correctly. Which pre-launch validation matches the chapter's guidance?",
        options: [
          "Tune the ensemble weights on an evaluation set and verify per-retriever timeouts plus the dense-only fallback under failure injection",
          "Ship with the default weights and watch aggregate click-through rates for a month",
          "Benchmark only the dense channel, since BM25 is a mature algorithm that needs no testing",
        ],
        correct: 0,
        feedback: "Correct — the lesson tunes ensemble weights on an eval set, and its production section calls for per-retriever timeouts and graceful degradation.",
      },
    ],
  },
  "ch2-query-rewriting": {
    objectives: [
      "Distinguish multi-query, HyDE, and step-back rewriting.",
      "Match each rewriting technique to the retrieval failure it repairs.",
      "Merge rewritten-query results without losing the original intent.",
    ],
    sections: [
      {
        heading: "Why rewrite the query at all",
        paragraphs: [
          "Query understanding is one of the components production search combines with lexical and dense retrieval. The index can be perfectly tuned and still miss, because the user's words are often not the document's words.",
          "Query rewriting and expansion attacks that mismatch before retrieval runs. Three key techniques address it, each aimed at a different gap between the query and the corpus rather than being interchangeable synonyms for better search.",
        ],
      },
      {
        heading: "Multi-query: cover phrasing variance",
        paragraphs: [
          "Multi-query generates 3-5 reformulations of the user's question, typically with an LLM, and retrieves for each of them. The union of the per-query result sets provides coverage that any single phrasing would miss.",
          "This is the right tool when the same intent has many plausible surface forms. The union still has to be merged and ranked downstream, so multi-query widens recall rather than deciding the final order of results.",
        ],
      },
      {
        heading: "HyDE: close the distribution gap",
        paragraphs: [
          "HyDE generates a hypothetical answer to the question and embeds that answer instead of the question itself. The motivation is distributional: answer-shaped text sits closer to the document distribution than question-shaped text does.",
          "The hypothetical answer does not need to be correct; it needs to look like the documents. That makes HyDE attractive when the corpus is declarative passages and queries are short questions, and it composes with the same fusion and re-ranking stages as any other candidate source.",
        ],
      },
      {
        heading: "Step-back: retrieve the foundations first",
        paragraphs: [
          "Step-back rewriting asks a more abstract form of the question and retrieves foundational context. A narrow question about one mechanism becomes a broader question about the principles behind it.",
          "Use step-back when the specific query presupposes context the corpus stores at a higher level. The retrieved foundational passages give downstream synthesis the background that the original phrasing would never have matched on its own.",
        ],
      },
    ],
    example: {
      title: "Worked example: short questions over long reference manuals",
      scenario: "An internal assistant answers from declarative reference manuals. Users type terse questions like 'cache eviction policy', and direct dense retrieval keeps returning the table of contents instead of the relevant sections.",
      analysis: "The failure is a distribution gap: question-shaped embeddings are being matched against answer-shaped documents. HyDE embeds a hypothetical passage about the cache eviction policy, which resembles the manual's own prose and lands nearer to the right sections.",
      decision: "Add HyDE rewriting for terse queries, keep multi-query in reserve for phrasing coverage, and evaluate the rewritten path's retrieval quality against the raw-query baseline before rolling it out.",
    },
    productionChecklist: [
      "Log original and rewritten queries together for debugging.",
      "Cap the number of reformulations (3-5 for multi-query).",
      "Union and merge rewritten-query results into one candidate set.",
      "Evaluate the rewrite path against the raw-query baseline.",
      "Version the rewriting prompt and model like any other pipeline stage.",
    ],
    commonMistakes: [
      "Embedding a raw question against answer-shaped documents when HyDE would close the gap.",
      "Generating reformulations but never unioning their result sets.",
      "Sending a specific query when the corpus stores the answer at a more abstract level.",
      "Letting rewrites drift from the user's intent with no evaluation check.",
    ],
    knowledgeChecks: [
      {
        id: "ch2-query-rewriting-kc-1",
        prompt: "Users phrase the same underlying intent in many different ways, and any single reformulation misses relevant documents. Which rewriting technique from this lesson targets this phrasing-variance problem?",
        options: [
          "HyDE: embed a hypothetical answer instead of the question itself",
          "Multi-query: generate 3-5 reformulations and take the union of their results",
          "Step-back: ask a more abstract form of the question first",
        ],
        correct: 1,
        feedback: "Correct — the lesson defines multi-query as generating 3-5 reformulations and unioning their result sets for coverage.",
      },
      {
        id: "ch2-query-rewriting-kc-2",
        prompt: "In the worked example, terse queries like 'cache eviction policy' against declarative reference manuals keep returning the table of contents. Which rewrite closes this specific gap, and why?",
        options: [
          "Multi-query, because five phrasings of a terse query will eventually hit the right section",
          "Step-back, because the table of contents is more abstract than the sections",
          "HyDE, because embedding a hypothetical answer puts the query closer to the document distribution",
        ],
        correct: 2,
        feedback: "Correct — HyDE embeds a hypothetical answer precisely because answer-shaped text sits closer to the document distribution than the question does.",
      },
      {
        id: "ch2-query-rewriting-kc-3",
        prompt: "A team enabled multi-query but retrieval quality did not improve: each reformulation was retrieved and displayed separately, and users saw fragmented result lists. Which step from the multi-query technique was skipped?",
        options: [
          "Taking the union of the per-reformulation result sets into one merged candidate pool",
          "Generating a hypothetical answer for each of the reformulations",
          "Rewriting each reformulation into a more abstract form before retrieving",
        ],
        correct: 0,
        feedback: "Correct — the lesson's multi-query definition is reformulate, retrieve for each variant, then take the union of the results.",
      },
      {
        id: "ch2-query-rewriting-kc-4",
        prompt: "A product manager asks why the pipeline should spend extra LLM calls rewriting queries instead of just raising top-k on the raw query. What is the best defense grounded in this lesson?",
        options: [
          "Rewriting is always cheaper than retrieval, so the extra calls are effectively free",
          "A larger top-k guarantees the right documents enter the candidate set eventually",
          "The mismatch is between how users ask and how documents are written; more of the same raw-query candidates cannot fix that gap",
        ],
        correct: 2,
        feedback: "Correct — the lesson opens with this point: query understanding exists because the index alone cannot bridge query-document mismatch.",
      },
      {
        id: "ch2-query-rewriting-kc-5",
        prompt: "Before enabling HyDE in production, the team wants evidence that it helps rather than hurts. Which validation plan fits this lesson's framing of rewriting techniques?",
        options: [
          "Enable it globally, since hypothetical answers are always closer to documents than questions",
          "Compare the rewritten path's retrieval quality against the raw-query baseline on the queries that exhibit the question-to-document distribution gap",
          "A/B test three rewriting prompts and keep whichever generates the longest hypothetical answers",
        ],
        correct: 1,
        feedback: "Correct — each technique targets a specific gap, so the rewritten path must be evaluated against the raw-query baseline on the affected cohort.",
      },
    ],
  },
  "ch2-reranking-pipeline": {
    objectives: [
      "Explain why independent encoding limits bi-encoder precision.",
      "Describe how cross-encoder joint attention improves relevance judgment.",
      "Design a two-stage retrieve-then-rerank pipeline within a latency budget.",
    ],
    sections: [
      {
        heading: "The first stage: fast and independent",
        paragraphs: [
          "The bi-encoder is the first stage: it encodes the query and each document independently, which is exactly what makes it fast. Document vectors are computed once at index time and reused for every query, so retrieval scales to billions of documents.",
          "That independence is also its precision ceiling. Because the model never sees the query and the document together, it cannot attend to query-document interactions; it can only align the two in a shared embedding space and hope the important nuances survive.",
        ],
      },
      {
        heading: "The re-rank stage: slow and joint",
        paragraphs: [
          "The cross-encoder concatenates the query and the document into a single sequence and applies full attention across both. That joint view produces a far more accurate relevance judgment, which is why it anchors the re-rank stage.",
          "The cost is O(n) per query: every candidate must be scored together with the query at request time. That is what limits cross-encoders to small candidate sets of roughly 20-100 documents, versus the billions a bi-encoder index can serve.",
        ],
      },
      {
        heading: "The two-stage production pattern",
        paragraphs: [
          "Production systems combine the two: the bi-encoder retrieves the top candidates cheaply (top-50 as a concrete default), and the cross-encoder re-ranks them down to the final few (top-5). This two-stage design buys near-cross-encoder quality at near-bi-encoder cost.",
          "The full hybrid pipeline has the same shape end to end: sparse and dense candidates are fused with RRF, then a cross-encoder re-ranks the fused list into the final top-k context. Re-ranking is the precision stage of the whole pipeline, not an optional garnish.",
        ],
      },
      {
        heading: "Model and budget choices",
        paragraphs: [
          "Concrete re-ranker options illustrate the choice: cross-encoder/ms-marco-MiniLM-L-6-v2 when speed matters and BAAI/bge-reranker-large when accuracy matters. The choice between them is a latency-versus-precision decision, not a brand decision.",
          "LLM-based scoring is the third option: use an LLM to score relevance directly. It is expensive but the highest quality, which suits low-volume, high-stakes re-ranking far better than high-QPS serving paths.",
        ],
      },
    ],
    example: {
      title: "Worked example: fixing top-of-list precision",
      scenario: "A documentation search returns 50 fused candidates in a few milliseconds, but users complain the first result is often subtly off-topic. The latency budget allows scoring tens of query-document pairs per query, not millions.",
      analysis: "The bi-encoder's independent encoding cannot see query-document interactions, so subtle intent mismatches survive fusion. A cross-encoder over the top 20-100 fused candidates applies joint attention exactly where the mistakes happen, inside the latency budget.",
      decision: "Keep bi-encoder retrieval plus RRF fusion for recall, add a cross-encoder re-rank from top-50 down to top-5, and reserve LLM-based scoring for a low-volume premium path.",
    },
    productionChecklist: [
      "Cap re-ranker input to a bounded candidate set of 20-100 documents.",
      "Measure re-rank stage latency separately from first-stage retrieval.",
      "Choose the re-ranker model by the speed-versus-accuracy point you need.",
      "Feed the re-ranker the fused list, not a single channel's output.",
      "Evaluate ranking quality after re-ranking, not only recall before it.",
    ],
    commonMistakes: [
      "Running a cross-encoder over the full corpus at query time.",
      "Assuming a larger first-stage top-k fixes ordering precision.",
      "Skipping re-ranking and trusting fused ranks to be precise enough.",
      "Picking a re-ranker model without checking its latency at your candidate count.",
    ],
    knowledgeChecks: [
      {
        id: "ch2-reranking-pipeline-kc-1",
        prompt: "Your bi-encoder retrieves fifty fused candidates quickly, but the top results often miss subtle intent. You may score tens of query-document pairs per query. What do you add to the pipeline?",
        options: [
          "A cross-encoder second stage that re-ranks the small candidate set with joint query-document attention",
          "A cross-encoder replacement for the bi-encoder across the entire corpus",
          "A larger bi-encoder top-k so the correct document is somewhere in the list",
        ],
        correct: 0,
        feedback: "Correct — the lesson's production pattern is bi-encoder retrieval plus cross-encoder re-ranking of only 20-100 candidates.",
      },
      {
        id: "ch2-reranking-pipeline-kc-2",
        prompt: "In the documentation search worked example, the first result is often subtly off-topic even though fifty fused candidates return in milliseconds. Why does a cross-encoder over the top candidates fix this?",
        options: [
          "Because it recomputes the BM25 and dense scores with better calibration",
          "Because it attends to the query and document together, catching interactions that independent encoding cannot see",
          "Because it filters out candidates below a fixed similarity threshold",
        ],
        correct: 1,
        feedback: "Correct — the cross-encoder concatenates query and document into one sequence with full attention, unlike the bi-encoder's independent encoding.",
      },
      {
        id: "ch2-reranking-pipeline-kc-3",
        prompt: "A team 'fixed' precision by scoring every document in the corpus with a cross-encoder at query time; latency exploded and the service fell over. Which trade-off from this lesson's stage comparison did they ignore?",
        options: [
          "Cross-encoders are less accurate than bi-encoders on short documents",
          "Cross-encoders cannot run on GPU hardware, so the team was stuck on CPUs",
          "Cross-encoder scoring is O(n) per query and scales only to 20-100 candidates, not billions of documents",
        ],
        correct: 2,
        feedback: "Correct — the lesson's stage comparison gives cross-encoders O(n) cost per query and a practical limit of 20-100 candidates only.",
      },
      {
        id: "ch2-reranking-pipeline-kc-4",
        prompt: "A stakeholder argues re-ranking is wasted latency because RRF has already ordered the fused list. What is the strongest defense of keeping the cross-encoder stage?",
        options: [
          "Fusion merges rank positions from independent encoders; only joint attention over the fused candidates delivers the far more accurate relevance judgment, at a bounded cost",
          "Re-ranking is free because the cross-encoder reuses the document embeddings computed at indexing time",
          "The cross-encoder stage is required for the RRF formula to produce valid scores",
        ],
        correct: 0,
        feedback: "Correct — the lesson shows cross-encoders give a far more accurate relevance judgment, and the two-stage design bounds that cost to the top candidates.",
      },
      {
        id: "ch2-reranking-pipeline-kc-5",
        prompt: "The team must choose between cross-encoder/ms-marco-MiniLM-L-6-v2 and BAAI/bge-reranker-large for a high-QPS service. Which decision process matches this lesson's guidance on model selection?",
        options: [
          "Pick bge-reranker-large because it is labeled accurate, and accuracy always wins in production",
          "Pick the MiniLM re-ranker because smaller models are always better in production",
          "Measure both latency and precision at the real candidate count, choosing the speed-versus-accuracy point the service budget allows",
        ],
        correct: 2,
        feedback: "Correct — the lesson's model section lists the MiniLM re-ranker as fast and bge-reranker-large as accurate; the choice is a latency-versus-precision decision.",
      },
    ],
  },
  "ch2-multi-hop-retrieval": {
    objectives: [
      "Recognize questions that require facts from multiple documents.",
      "Implement the iterative retrieve-extract-follow-up loop.",
      "Bound the loop with hop limits, timeouts, and deduplicated context.",
    ],
    sections: [
      {
        heading: "When one retrieval is not enough",
        paragraphs: [
          "Some questions require facts from multiple documents, where the second lookup only makes sense after the first one returns. The follow-up query literally cannot be written until the earlier evidence has been read.",
          "The chapter's answer is iterative retrieval: retrieve for the original query, extract entities and claims from the retrieved documents, generate follow-up queries for the missing facts, then re-retrieve and synthesize the final answer.",
        ],
      },
      {
        heading: "The four-step loop",
        paragraphs: [
          "Step one retrieves for the original query. Step two extracts entities and claims from what came back, producing the intermediate facts that identify what is still unknown.",
          "Step three turns that gap into new queries: generate follow-up queries for the missing facts. Step four re-retrieves with those queries and synthesizes across everything gathered, so the final answer is grounded in the full chain of evidence.",
        ],
      },
      {
        heading: "Bounding the loop",
        paragraphs: [
          "A production implementation treats the loop as a bounded system: a maximum hop count caps iterations, a total wall-clock budget bounds the whole call, each hop gets its own retrieval timeout, and context growth is deduplicated and hard-capped at a fixed document limit so the loop cannot expand context without limit.",
          "An answerability check closes each hop: the LLM is asked whether the accumulated context can answer the question, replying 'yes: <answer>' or 'no: <what is missing>', and only a 'no' produces the next follow-up query. If the budget runs out first, the caller receives the context with no confident answer and decides how to handle it.",
        ],
      },
      {
        heading: "Production hardening and alternatives",
        paragraphs: [
          "Production hardening adds caching of query-to-docs results, circuit breakers around the retriever and the LLM, structured tracing of each hop for debugging, a loop and oscillation detector, and a token budget on the formatting step so the answerability prompt never overflows the context window.",
          "An alternative to a hand-written loop is a LangGraph agent where each node is a retrieval step and the graph conditionally continues until the answer is found. When relationships are dense and reusable, a knowledge graph can beat iterative re-query entirely; knowing when is the staff-level signal.",
        ],
      },
    ],
    example: {
      title: "Worked example: the three-hop fact chain",
      scenario: "A user asks: 'What is the nationality of the CEO of the company that acquired OpenAI's main competitor?' No single document holds the whole chain.",
      analysis: "The first retrieval identifies the competitor and its acquirer; extracting that entity generates a follow-up query for the acquirer's CEO; a further hop looks up the CEO's nationality. Each hop's query depends on facts found in the previous hop, which is exactly the iterative pattern.",
      decision: "Implement the bounded loop: at most 3 hops, per-hop timeouts plus a total wall-clock budget, deduplicated context capped at 20 documents, an LLM answerability check per hop, and structured tracing so every hop's query and results can be debugged.",
    },
    productionChecklist: [
      "Cap max hops, total wall-clock budget, and per-hop timeouts.",
      "Deduplicate and hard-cap the accumulated context.",
      "Run an explicit answerability check before starting each new hop.",
      "Trace each hop's query and retrieved documents for debugging.",
      "Cache query-to-docs results across hops and requests.",
    ],
    commonMistakes: [
      "Running an unbounded retrieve-read loop with no termination guarantee.",
      "Appending every retrieved document without deduplication or a size cap.",
      "Generating follow-up queries without extracting what is actually missing.",
      "Treating the loop as a notebook script instead of a system with cost budgets.",
    ],
    knowledgeChecks: [
      {
        id: "ch2-multi-hop-retrieval-kc-1",
        prompt: "A question asks for the nationality of the CEO of the company that acquired OpenAI's main competitor, and no single document holds the whole chain. Which retrieval structure answers it?",
        options: [
          "One retrieval with a very large top-k so every needed fact is present at once",
          "An LLM answering from parametric knowledge, skipping follow-up lookups entirely",
          "An iterative loop: retrieve, extract entities and claims, generate follow-up queries for missing facts, re-retrieve, then synthesize",
        ],
        correct: 2,
        feedback: "Correct — the lesson's multi-hop loop is exactly this iterative retrieve-extract-follow-up pattern over multiple documents.",
      },
      {
        id: "ch2-multi-hop-retrieval-kc-2",
        prompt: "In the three-hop worked example, the first retrieval identifies the competitor and its acquirer. According to the loop design, what produces the next hop's search query?",
        options: [
          "A fixed list of follow-up query templates defined before the first retrieval",
          "The answerability check reporting what is missing, which the LLM turns into a follow-up query",
          "The user, who is asked to rephrase the question after every hop",
        ],
        correct: 1,
        feedback: "Correct — the loop's answerability check asks whether the accumulated context answers the question, and a 'no: <what is missing>' reply seeds the next search query.",
      },
      {
        id: "ch2-multi-hop-retrieval-kc-3",
        prompt: "A prototype multi-hop loop ran for forty iterations overnight, accumulated hundreds of duplicate documents, and overflowed the context window on the answerability prompt. Which bounds from this lesson's loop design were missing?",
        options: [
          "Max hops, a total wall-clock budget, deduplication via seen ids with a hard context cap, and a token budget on prompt formatting",
          "A larger context window model and a faster retriever for each hop",
          "A bigger top-k on the first hop so that later hops become unnecessary",
        ],
        correct: 0,
        feedback: "Correct — the lesson's loop design enforces a maximum hop count, a wall-clock deadline, deduplicated capped context growth, and a token budget on formatting.",
      },
      {
        id: "ch2-multi-hop-retrieval-kc-4",
        prompt: "A teammate suggests removing the per-hop timeouts and the total budget to give the loop 'room to think' on hard questions. What is the strongest defense of keeping the bounds?",
        options: [
          "Bounds make the loop faster on every single question, including the easy ones",
          "The loop is a production system that needs termination and cost guarantees; the caller still decides what to do when it returns without a confident answer",
          "Timeouts are required by the vector database vendor's terms of service",
        ],
        correct: 1,
        feedback: "Correct — the lesson's staff-level signal is bounding the loop explicitly and returning context with no confident answer when the budget is exhausted.",
      },
      {
        id: "ch2-multi-hop-retrieval-kc-5",
        prompt: "Before shipping multi-hop retrieval, the team wants to know the loop is debuggable and safe in production. Which hardening set from the chapter should be in place first?",
        options: [
          "A larger max_docs value and a longer total budget for difficult questions",
          "Removing the answerability check so the loop never stops early",
          "Caching of query-to-docs results, circuit breakers around the retriever and LLM, structured per-hop tracing, and a loop/oscillation detector",
        ],
        correct: 2,
        feedback: "Correct — the lesson's hardening section names caching, circuit breakers, structured tracing of each hop, and a loop/oscillation detector.",
      },
    ],
  },
};

export const chapter02Practice: CatalogPracticeUnit[] = [
  {
    id: "ch2-2-2-1",
    chapter: 2,
    chapterTitle: "Advanced Retrieval Design",
    title: "Design a hybrid retrieval system end-to-end",
    pages: "30",
    route: "/practice/advanced-retrieval-design/design-a-hybrid-retrieval-system-end-to-end",
    competencies: ["hybrid search", "query rewriting", "reranking", "multi-hop retrieval"],
    question: "An interviewer asks: \"Design a hybrid retrieval system from scratch. Walk me through every component and decision.\" Which response earns the strongest rating?",
    options: [
      {
        text: "List the components in a line — parser, embedder, vector store, LLM — and walk through how a query flows across them on the happy path.",
        correct: false,
        feedback: "Naming components in a line is the junior answer; the senior answer separates the indexing path from the query path and gives concrete defaults and quality controls.",
      },
      {
        text: "Focus on choosing the best vector database and embedding model, since retrieval quality is decided by those two choices.",
        correct: false,
        feedback: "The index is only one stage; the senior answer gives equal weight to query rewriting, RRF fusion, cross-encoder re-ranking, and quality controls like thresholds and deduplication.",
      },
      {
        text: "Separate the batch indexing path (parse, chunk at 512 tokens with 64-token overlap, embed densely, build a BM25 index, store metadata) from the latency-sensitive query path (rewrite the query, retrieve top-20 dense and top-20 sparse, fuse with RRF using eval-tuned weights, re-rank top-20 to top-5 with a cross-encoder), then add quality controls: a similarity threshold, near-duplicate removal, and context trimming.",
        correct: true,
        feedback: "Correct. This matches the senior answer: split indexing from the query path, state concrete defaults, and design for failure and latency, not just the happy path.",
      },
    ],
  },
  {
    id: "ch2-2-2-2",
    chapter: 2,
    chapterTitle: "Advanced Retrieval Design",
    title: "Why is BM25 + vector better than vector alone?",
    pages: "31",
    route: "/practice/advanced-retrieval-design/why-is-bm25-vector-better-than-vector-alone",
    competencies: ["hybrid search", "query rewriting", "reranking", "multi-hop retrieval"],
    question: "An interviewer asks: \"Why is hybrid BM25 + vector search better than vector-only retrieval?\" What should the strongest answer include?",
    options: [
      {
        text: "Name the exact vector-only failure modes hybrid repairs — rare terms get poor representations, exact identifiers like \"invoice number INV-2024-0938\" need literal matching, and acronyms may not sit near their expansions in embedding space — then quantify the gain, often 10-20% Recall@5 on standard benchmarks, while noting it is dataset-dependent.",
        correct: true,
        feedback: "Correct. The senior signal is explaining why the combination helps: specific vector-only failure modes plus a quantified, dataset-dependent gain.",
      },
      {
        text: "Hybrid gives you the best of both worlds — semantic understanding plus keywords — so it is strictly better in every situation.",
        correct: false,
        feedback: "\"Best of both worlds\" without naming the failure modes or the measured gain is exactly the junior answer this chapter calls out.",
      },
      {
        text: "BM25 is simply more accurate than embeddings, so adding vectors mainly modernizes the stack.",
        correct: false,
        feedback: "BM25-only has its own failure modes — it misses synonyms, paraphrases, and intent — which is precisely why the dense channel is needed at all.",
      },
    ],
  },
  {
    id: "ch2-2-2-3",
    chapter: 2,
    chapterTitle: "Advanced Retrieval Design",
    title: "How does re-ranking improve precision? Trade-offs?",
    pages: "32",
    route: "/practice/advanced-retrieval-design/how-does-re-ranking-improve-precision-trade-offs",
    competencies: ["hybrid search", "query rewriting", "reranking", "multi-hop retrieval"],
    question: "An interviewer asks: \"Explain the re-ranking step. How does it improve precision and what are the trade-offs?\" Which answer demonstrates production-grade thinking?",
    options: [
      {
        text: "A cross-encoder is just a bigger, more accurate model, so you should use it everywhere the bi-encoder was used.",
        correct: false,
        feedback: "More accurate but O(n) per query; the scalability comparison caps cross-encoders at 20-100 candidates, not billions of documents.",
      },
      {
        text: "Explain the mechanism — a bi-encoder encodes query and document independently and cannot attend to their interaction, while a cross-encoder concatenates them into one sequence with full attention — then quantify the cost: O(n) per query limits cross-encoders to 20-100 candidates, so production retrieves top-50 with the bi-encoder and re-ranks to top-5, getting near-cross-encoder quality at near-bi-encoder cost.",
        correct: true,
        feedback: "Correct. The senior answer explains the joint-attention mechanism, quantifies the per-query cost, and lands on the two-stage pattern.",
      },
      {
        text: "Re-ranking just re-sorts the same candidates by a better score, so it adds no real cost and can be applied to the full index.",
        correct: false,
        feedback: "This misses the trade-off entirely; joint attention must run per candidate per query, which is exactly why re-ranking is a bounded second stage.",
      },
    ],
  },
  {
    id: "ch2-2-2-4",
    chapter: 2,
    chapterTitle: "Advanced Retrieval Design",
    title: "How would you handle ambiguous queries?",
    pages: "32",
    route: "/practice/advanced-retrieval-design/how-would-you-handle-ambiguous-queries",
    competencies: ["hybrid search", "query rewriting", "reranking", "multi-hop retrieval"],
    question: "An interviewer asks: \"A user submits an ambiguous query: 'Tell me about the bank.' How do you handle it?\" Choose the best answer.",
    options: [
      {
        text: "Ask the user to clarify what they mean before doing any retrieval.",
        correct: false,
        feedback: "Clarification alone is the junior answer; it is not always possible in automated pipelines, and a complete answer demands the non-interactive paths as well.",
      },
      {
        text: "Pick the most popular interpretation and answer confidently, since users rarely notice ambiguity.",
        correct: false,
        feedback: "Guessing is what confidence scoring exists to prevent; low-confidence queries should trigger a clarification response instead of a guess.",
      },
      {
        text: "Cover the non-interactive case, not just clarification: generate 2-3 interpretations with an LLM and retrieve for each, use conversation history to disambiguate, bias retrieval with domain metadata filtering, present framed results per interpretation when useful, gate clarification on confidence scoring — and close the loop by logging ambiguous queries to train an intent classifier that routes to domain-specific indices.",
        correct: true,
        feedback: "Correct. The senior answer handles the automated pipeline case with multi-interpretation retrieval and confidence gating, then closes the loop with logged data for an intent router.",
      },
    ],
  },
  {
    id: "ch2-2-2-5",
    chapter: 2,
    chapterTitle: "Advanced Retrieval Design",
    title: "How do you implement multi-hop reasoning retrieval?",
    pages: "33",
    route: "/practice/advanced-retrieval-design/how-do-you-implement-multi-hop-reasoning-retrieval",
    competencies: ["hybrid search", "query rewriting", "reranking", "multi-hop retrieval"],
    question: "An interviewer asks: \"Design a multi-hop retrieval system for a question like: 'What is the nationality of the CEO of the company that acquired OpenAI's main competitor?'\" What distinguishes a staff-level answer?",
    options: [
      {
        text: "Bound the iterative loop explicitly — max hops, a total wall-clock budget, per-hop timeouts, deduplicated context with a hard cap, and an LLM answerability check that generates the next query from what is missing — then add caching, circuit breakers, per-hop tracing, and know when a knowledge graph beats iterative re-query for dense, reusable relationships.",
        correct: true,
        feedback: "Correct. The staff answer treats the loop as a production system with cost and termination guarantees, not a notebook script.",
      },
      {
        text: "Write a retrieve-read loop that keeps going until the model produces a fluent answer.",
        correct: false,
        feedback: "An unbounded loop is the junior version; the prescribed implementation caps hops, time, and context growth, and returns without a confident answer when the budget is exhausted.",
      },
      {
        text: "Retrieve a very large top-k in one pass so all the facts are present, then let the LLM connect them.",
        correct: false,
        feedback: "Single-pass retrieval cannot know the follow-up queries in advance; each hop's query depends on facts extracted in the previous hop.",
      },
    ],
  },
];
