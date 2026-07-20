import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter04Module: LearningModule = {
  id: "chapter-4-evaluation-and-metrics",
  title: "Evaluation & Metrics",
  description:
    "Evaluate retrieval, generation, and end-to-end usefulness with disciplined methodology. Distinguish offline evaluation from online monitoring, and read faithfulness, context precision, hit rate, and answer relevance together against product risk rather than reciting definitions.",
  duration: "3 lessons",
  lessons: [
    {
      id: "ch4-retrieval-metrics",
      title: "Retrieval Metrics",
      prompt: "Score the retriever before blaming the generator",
      question:
        "A team just switched embedding models and wants proof that retrieval did not regress before anyone touches the prompt. They hold 500 labeled pairs of (query, relevant document IDs). What should they run?",
      options: [
        "Sample live answers and have an LLM judge score end-to-end quality, since that is what users actually experience.",
        "Ship the change behind a flag and watch the faithfulness dashboard for a week before deciding.",
        "Compute Recall@K, Precision@K, and MRR against the labeled pairs - no LLM needed - and compare with the pre-change baseline.",
      ],
      correct: 2,
      feedback:
        "Correct. Retrieval quality is measurable directly from labeled pairs with deterministic metrics, and the chapter says to run exactly this suite at every chunking or embedding-model change.",
      explanation:
        "Recall@K, Precision@K, and MRR compare ranked output against known relevant documents, so they isolate the retrieval stage without paying for or depending on an LLM judge. End-to-end or generation-side signals cannot separate \"wrong documents retrieved\" from \"hallucinated over the right documents\" - the attribution problem the chapter's evaluation figure is built around.",
      takeaways: [
        "Recall@K measures how much of the relevant evidence made it into the top K; Precision@K measures how much of the top K is worth the generator's context.",
        "MRR rewards putting the first relevant document near the top of the ranked list.",
        "Run the labeled retrieval suite on every chunking or embedding change - it is cheap, deterministic, and LLM-free.",
      ],
      model: ["Label query-doc pairs", "Rank and score at K", "Gate on regression"],
      source: { chapter: 4, sections: ["4.1.1"], pages: "42" },
    },
    {
      id: "ch4-generation-metrics-ragas",
      title: "Generation Metrics (RAGAS)",
      prompt: "Read the four RAGAS metrics as one panel",
      question:
        "A RAG assistant's answers read fluently, but users keep finding invented policy details. The team can instrument one RAGAS metric first to quantify the problem. Which one?",
      options: [
        "Faithfulness - the fraction of factual claims in the answer that the retrieved context supports.",
        "Answer relevancy - whether the answer addresses the question the user actually asked.",
        "Context recall - whether the retrieved context contained everything needed to answer.",
      ],
      correct: 0,
      feedback:
        "Correct. Invented details are claims unsupported by the retrieved context, which is precisely what faithfulness measures; the chapter defines it as the hallucination metric.",
      explanation:
        "RAGAS computes faithfulness by extracting every factual claim from the answer, checking each claim's entailment against the retrieved context, and scoring supported claims over total claims. Answer relevancy and context recall diagnose different failures - answering the wrong question, and missing evidence entirely - so the chapter warns that these metrics must be interpreted together.",
      takeaways: [
        "Faithfulness = supported claims / total claims, judged against the retrieved context rather than world knowledge.",
        "Answer relevancy back-generates questions from the answer to test whether it addresses what was asked.",
        "Context precision and context recall connect generation quality back to retrieval quality.",
      ],
      model: ["Extract claims", "Check entailment", "Score supported/total"],
      source: { chapter: 4, sections: ["4.1.2"], pages: "42" },
    },
    {
      id: "ch4-evaluation-tools",
      title: "Evaluation Tools",
      prompt: "Match the tool to the evaluation job",
      question:
        "A platform team wants evaluation to behave like unit tests: run on every pull request, integrate with pytest, and block merges when quality regresses. Which tool is built for that job?",
      options: [
        "LangSmith, because it provides production tracing, human annotation, and automated evaluation.",
        "DeepEval, because it is a unit-test-style framework with pytest integration and 10+ metrics.",
        "TruLens, because its feedback functions produce detailed traces for RAG and agent pipelines.",
      ],
      correct: 1,
      feedback:
        "Correct. DeepEval is the unit-test framework of the four - pytest integration and a broad metric library - and it is the tool the chapter's CI pipeline uses for its generation gate.",
      explanation:
        "Each tool has a center of gravity: RAGAS for LLM-as-judge scoring with minimal ground truth, DeepEval for test-style gating, TruLens for trace-level feedback functions, and LangSmith for production tracing with human annotation. The gating job in the question is exactly where the chapter's offline pipeline places DeepEval, with an explicit minimum success rate.",
      takeaways: [
        "RAGAS scores faithfulness and relevancy with LLM-as-judge and little ground truth required.",
        "DeepEval turns metrics into pytest-style gates; LangSmith and TruLens cover production tracing and feedback functions.",
        "Name the job first - offline release gate or online monitoring - then pick the tool.",
      ],
      model: ["Name the eval job", "Pick the matching tool", "Wire thresholds and alerts"],
      source: { chapter: 4, sections: ["4.1.3"], pages: "42" },
    },
  ],
};

export const chapter04CourseContent: Record<string, LessonCourseContent> = {
  "ch4-retrieval-metrics": {
    objectives: [
      "Compute Recall@K, Precision@K, and MRR from labeled query-document pairs.",
      "Explain what each retrieval metric captures, what it hides, and why the choice of K must match the product.",
      "Wire retrieval metrics into every chunking or embedding change so regressions are caught before generation gets blamed.",
    ],
    sections: [
      {
        heading: "Why the retriever gets its own scoreboard",
        paragraphs: [
          "The chapter's central diagram splits evaluation into two loops: retrieval evaluation (Recall@K, MRR) feeding fixes to chunking and embedding, and generation evaluation (faithfulness, relevancy) feeding fixes to prompt and model. The reason is attribution. When an end-to-end answer is bad, one aggregate score cannot tell you whether the retriever returned the wrong documents or the generator hallucinated over perfectly good ones.",
          "Retrieval evaluation needs no LLM at all. You build labeled pairs of (query, relevant_doc_ids), run the retriever, and compare the ranked output against the labels. Because it is cheap and deterministic, it can run at every chunking or embedding-model change - which is exactly when the chapter's tough-question answers say to run it.",
        ],
      },
      {
        heading: "The three formulas and what they really measure",
        paragraphs: [
          "Recall@K = |relevant docs in the top K| / |all relevant docs|. It answers: did we find the evidence that exists? Precision@K = |relevant docs in the top K| / K. It answers: how much of what we hand the generator is actually worth its context budget? The two move independently, so both belong on the dashboard.",
          "MRR = (1/|Q|) times the sum of 1/rank of the first relevant document across the query set. It compresses ranking quality into how close to the top the first good result lands, which matters when the generator or the user mostly consumes the first few chunks. The chapter's retrieval panels also list NDCG alongside these for graded ranking quality.",
        ],
      },
      {
        heading: "Reading the metrics together instead of alone",
        paragraphs: [
          "Each metric has a blind spot. High Recall@K with low Precision@K means the evidence is present but buried in noise, so the generator's context is diluted. High Precision@K at a small K can coexist with poor recall if relevant documents never enter the candidate set at all. MRR can look healthy on easy queries while hard multi-hop queries never retrieve their evidence.",
          "The chapter overview insists these numbers be interpreted together and connected to product risk, not recited as definitions. The tough-question section makes this concrete with a diagnostic rule: Recall@5 of 0.9 with faithfulness of 0.6 means retrieval is fine and the prompt or model is the problem; Recall@5 of 0.4 means fix retrieval before touching generation.",
        ],
      },
      {
        heading: "Running retrieval eval as a release gate",
        paragraphs: [
          "Because the suite is label-based and LLM-free, it belongs in CI. The chapter's offline-pipeline answer runs a retrieval-eval script against a versioned golden set with an explicit floor - a minimum Recall@5 of 0.80 - on every pull request, and blocks merges on regression.",
          "Operationally, the labeled pairs are versioned like code, K is chosen to match what the product actually passes to the generator, and results are broken down by document type or query class rather than trusted as one average. An aggregate recall number can hide a cohort that silently regressed.",
        ],
      },
    ],
    example: {
      title: "Worked example: attributing a bad-answer report",
      scenario:
        "A support RAG product starts returning wrong answers right after an embedding-model upgrade. Leadership asks the team to \"fix the LLM prompts,\" but an engineer first pulls the retrieval panel: Recall@5 is 0.42, down from 0.88 before the upgrade, while faithfulness on samples with good retrieval remains 0.93.",
      analysis:
        "The generator grounds faithfully when it receives the right context - the new embedding model is simply failing to surface that context. Rewriting prompts cannot recover documents that were never retrieved, and end-to-end answer sampling alone could not have separated the two causes. The label-based retrieval metrics pinpoint the regression to the embedding change, which is exactly the event the chapter says should always trigger a retrieval re-evaluation.",
      decision:
        "Roll back or re-tune the embedding model and re-run the labeled retrieval suite until Recall@5 recovers past its floor, then re-check faithfulness. Keep a CI gate at Recall@5 of 0.80 or higher so the next chunking or embedding change fails the pull request instead of reaching users.",
    },
    productionChecklist: [
      "Maintain versioned (query, relevant_doc_ids) pairs as the retrieval golden set.",
      "Report Recall@K and Precision@K at the K your generator actually consumes, not an arbitrary one.",
      "Re-run the retrieval suite on every chunking or embedding-model change.",
      "Set an explicit CI floor (for example Recall@5 at 0.80 or higher) and block merges below it.",
      "Break retrieval results down by document type or query class so one average cannot hide a regression.",
    ],
    commonMistakes: [
      "Scoring only end-to-end answers, so a retrieval failure and a generation failure look identical.",
      "Quoting recall without naming K - Recall@5 and Recall@50 are different claims.",
      "Shipping a chunking or embedding change without re-running the labeled retrieval suite.",
      "Paying an LLM judge for retrieval scoring when deterministic labeled pairs already answer the question.",
    ],
    knowledgeChecks: [
      {
        id: "ch4-retrieval-metrics-kc-1",
        prompt:
          "A search team holds 400 labeled pairs of queries and their relevant document IDs, and wants to know whether the top five results usually contain the needed evidence. Which metric directly answers that question?",
        options: [
          "Precision@5, because it divides the relevant results in the top five by five.",
          "MRR, because it averages the reciprocal rank of the first relevant document.",
          "Recall@5, because it divides the relevant documents found in the top five by all relevant documents.",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter defines Recall@K as the relevant documents retrieved in the top K divided by the total relevant documents, which is exactly the evidence-coverage question asked here.",
      },
      {
        id: "ch4-retrieval-metrics-kc-2",
        prompt:
          "After an embedding-model upgrade, a support RAG product starts returning wrong answers. Recall@5 fell from 0.88 to 0.42 while faithfulness on well-retrieved samples stayed 0.93. What should the team fix first?",
        options: [
          "The embedding model or chunking, because the chapter's diagnostic rule says a low Recall@5 means fix retrieval before generation.",
          "The system prompt, because answers users dislike are always a generation-side problem.",
          "The answer-relevancy judge, because the two metrics obviously disagree about the failure.",
        ],
        correct: 0,
        feedback:
          "Correct. The chapter's decomposed-debugging rule says a Recall@5 near 0.4 points at retrieval, so roll back or re-tune the embedding model before touching the prompt.",
      },
      {
        id: "ch4-retrieval-metrics-kc-3",
        prompt:
          "A team evaluates only end-to-end answers with an LLM judge after every release. Users report a sudden wave of wrong answers, but nobody can tell which pipeline stage broke. What design flaw caused this blindness?",
        options: [
          "The LLM judge was too small, so its end-to-end scores were noisy and unreliable.",
          "Evaluating only final answers leaves failures unattributable; the chapter splits evaluation into retrieval and generation loops so a bad answer is attributable.",
          "The labeled dataset was too small to measure anything, so a much larger one is required.",
        ],
        correct: 1,
        feedback:
          "Correct. The chapter's figure separates retrieval eval from generation eval precisely so a bad answer can be attributed; one end-to-end score cannot distinguish wrong retrieval from hallucinated generation.",
      },
      {
        id: "ch4-retrieval-metrics-kc-4",
        prompt:
          "An engineer proposes quoting a single recall number without naming K in the design review, to keep the slide simple. A reviewer objects. Which defense of the reviewer's position is strongest?",
        options: [
          "Simplicity matters more; stakeholders cannot be expected to interpret subscript notation in metric names.",
          "Recall should be replaced entirely by MRR, which needs no K parameter at all.",
          "Recall@5 and Recall@50 are different claims; K must match what the generator actually consumes, so the number is meaningless without it.",
        ],
        correct: 2,
        feedback:
          "Correct. Recall@K is defined relative to a chosen K, and the metric only guides action when K reflects the product's real retrieval depth; an unnamed K hides the coverage-versus-noise trade-off.",
      },
      {
        id: "ch4-retrieval-metrics-kc-5",
        prompt:
          "A platform team wants retrieval quality enforced automatically on every pull request rather than checked manually before big releases. Which setup matches the chapter's offline evaluation pipeline?",
        options: [
          "A CI job that runs the retrieval suite against a versioned golden set with an explicit floor such as Recall@5 at 0.80, and blocks merges below it.",
          "A weekly cron that recomputes Recall@K on sampled logs and emails a report to interested stakeholders.",
          "A pre-launch checklist item reminding the release captain to rerun the evaluation notebook.",
        ],
        correct: 0,
        feedback:
          "Correct. The chapter's pipeline runs the retrieval eval against a versioned golden set with a minimum Recall@5 of 0.80 on every pull request, turning quality into a merge-blocking release gate.",
      },
    ],
  },
  "ch4-generation-metrics-ragas": {
    objectives: [
      "Define faithfulness, answer relevancy, context precision, and context recall precisely.",
      "Explain how RAGAS computes faithfulness: extract claims, check entailment per claim, score supported over total.",
      "Connect a low generation metric to the specific lever that fixes it.",
    ],
    sections: [
      {
        heading: "Faithfulness: the hallucination meter",
        paragraphs: [
          "Faithfulness is the fraction of factual claims in the answer that can be verified against the retrieved context. A faithful answer is fully grounded in what was retrieved; an unfaithful one contains fabricated facts. Note the reference point: the retrieved context, not world knowledge. An answer can be true in the world and still unfaithful to the evidence it was given.",
          "RAGAS computes it in three steps: an LLM extracts all factual claims from the answer; for each claim, an LLM checks whether the retrieved context entails it; the score is supported claims divided by total claims. A score near 0.0 means hallucinated, near 1.0 grounded. Because the judge is an LLM, production wiring needs aligned input lengths, a pinned judge-model version, retry with backoff, and failure isolation so the evaluation never crashes the caller.",
        ],
      },
      {
        heading: "Answer relevancy and the context pair",
        paragraphs: [
          "Answer relevancy asks a different question: does the answer actually address what the user asked? RAGAS approximates it by using an LLM to back-generate questions from the answer and checking their alignment with the original. An answer can be perfectly faithful to the context and still fail the user because it answers a different question.",
          "Context precision and context recall look back at the retrieval stage from the generation side. Context precision measures what fraction of the retrieved context was actually useful; context recall measures whether the retrieved context contained everything needed. Together with faithfulness and relevancy they form one panel - the chapter overview's point is that none of these metrics is interpretable in isolation.",
        ],
      },
      {
        heading: "From metric to lever",
        paragraphs: [
          "The senior pattern in the tough questions is linking each metric to a fix. Low faithfulness has a concrete lever list: add a grounding instruction to answer only from the provided context and say so when the answer is missing; force the model to cite sources before answering; add a post-generation verification pass where another LLM call checks each claim; and drop temperature to 0.2 or below for factual tasks.",
          "Low context precision points the other way - at chunking, candidate counts, and reranking - because the generator is being fed mostly useless context. Low context recall says the evidence was never retrieved at all, which no prompt change can repair. Reading the panel tells you which stage to touch; reading one metric alone invites fixing the wrong stage.",
        ],
      },
      {
        heading: "Offline scores versus online monitoring",
        paragraphs: [
          "The chapter distinguishes offline evaluation from online monitoring. Offline, RAGAS runs in CI against a golden set with explicit thresholds before deployment. Online, the production-monitoring answer runs faithfulness on a sampled slice - about 5% of traffic - asynchronously, alerts when the 7-day rolling faithfulness drops below a threshold like 0.85, and routes low-confidence responses to a human review queue.",
          "Online monitoring also slices the metric where risk concentrates: the chapter's example tracks per-document-type hallucination rates, comparing PDFs against web pages. The ownership signal it names is continuous, sampled, alerted measurement - not a one-off check before launch.",
        ],
      },
    ],
    example: {
      title: "Worked example: faithful but useless",
      scenario:
        "An internal policy assistant scores 0.94 faithfulness in CI, yet employees complain the answers \"don't answer the question.\" The team also notices the prompt is stuffed with long retrieved sections full of irrelevant paragraphs.",
      analysis:
        "Faithfulness only certifies that claims are supported by the retrieved context; it says nothing about whether the answer addresses the question. The panel tells the real story: answer relevancy is low, and context precision is low too - retrieval is flooding the prompt with mostly useless context, and the model is grounding itself in the wrong part of it. Measuring faithfulness alone made the system look healthy.",
      decision:
        "Instrument all four RAGAS metrics, not just faithfulness. Fix context precision first through chunking, candidate count, and reranking; then re-measure faithfulness and relevancy. If faithfulness later drops on sampled production traffic, apply the grounding prompt, citation-before-answering, a post-generation verification pass, and a temperature of 0.2 or below for factual tasks.",
    },
    productionChecklist: [
      "Validate aligned question/answer/context lengths before paying for LLM-judge calls.",
      "Pin the judge-model version - scores drift across model updates.",
      "Run judges asynchronously off the request path with batching, retry, and backoff.",
      "Persist metric scores to a time-series database and alert on rolling thresholds (for example 7-day faithfulness below 0.85).",
      "Never let an evaluation failure crash or block the user-facing request.",
    ],
    commonMistakes: [
      "Treating faithfulness as general factual accuracy instead of support by the retrieved context.",
      "Celebrating high faithfulness while answer relevancy or context recall is failing.",
      "Running LLM judges synchronously on the request path without failure isolation.",
      "Letting the judge-model version float, so score changes reflect judge drift rather than system change.",
    ],
    knowledgeChecks: [
      {
        id: "ch4-generation-metrics-ragas-kc-1",
        prompt:
          "A generated answer contains three factual claims. An LLM judge finds that the retrieved context supports two of them and not the third. What is the faithfulness score, and what does it mean?",
        options: [
          "1.0, because most of the answer was supported by the retrieved context.",
          "Two thirds, because faithfulness is supported claims divided by total claims extracted from the answer.",
          "0.0, because any single unsupported claim marks the entire answer as hallucinated.",
        ],
        correct: 1,
        feedback:
          "Correct. The chapter's RAGAS computation extracts all factual claims, checks each for entailment by the context, and scores supported over total - here two of three, or about 0.67.",
      },
      {
        id: "ch4-generation-metrics-ragas-kc-2",
        prompt:
          "An internal policy assistant scores 0.94 faithfulness in CI, yet employees complain the answers do not address their questions, and prompts are stuffed with irrelevant retrieved paragraphs. Which metric pair explains the complaints?",
        options: [
          "Context recall and MRR, because missing evidence always depresses both at once.",
          "Faithfulness and context recall, because both must be re-measured after any complaint.",
          "Answer relevancy and context precision, because the answers miss the question and the retrieved context is mostly useless.",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter defines answer relevancy as whether the answer addresses the question and context precision as the fraction of retrieved context actually useful - exactly the two failures described here.",
      },
      {
        id: "ch4-generation-metrics-ragas-kc-3",
        prompt:
          "After a routine judge-model upgrade, the faithfulness dashboard shifts overnight while no prompt, index, or corpus changed, and engineers start chasing a phantom regression. What went wrong?",
        options: [
          "The judge-model version was allowed to float; the chapter notes scores drift across model updates, so the judge version must be pinned.",
          "The traffic sample was too small, so the 5% sampling rate must be raised significantly.",
          "The rolling window was too long, so the alert threshold must be recomputed daily.",
        ],
        correct: 0,
        feedback:
          "Correct. The chapter's production notes call for a fixed judge-model version because scores drift across model updates; an unplanned judge upgrade changes the measuring ruler, not the system.",
      },
      {
        id: "ch4-generation-metrics-ragas-kc-4",
        prompt:
          "A product manager proposes one blended quality score combining faithfulness, relevancy, and context metrics to simplify reporting. An engineer defends keeping them separate. Which defense is strongest?",
        options: [
          "Separate scores are easier to compute, and simpler math is always preferable in production systems.",
          "Each metric points at a different lever - grounding prompt and temperature for faithfulness, chunking and reranking for context precision - so blending them hides which stage to fix.",
          "LLM judges cannot be combined mathematically, so blending them is technically impossible anyway.",
        ],
        correct: 1,
        feedback:
          "Correct. The chapter insists the metrics be interpreted together but distinctly, because each low score maps to a different fix; one blended number loses that diagnostic routing to the failing stage.",
      },
      {
        id: "ch4-generation-metrics-ragas-kc-5",
        prompt:
          "A team wants hallucination monitoring on live traffic without slowing user requests or crashing the request path when the judge service fails. Which production setup matches the chapter's guidance?",
        options: [
          "Run the faithfulness judge synchronously inside each request and return the score alongside the answer.",
          "Block every deployment whenever the judge service is unreachable, since evaluation is mandatory.",
          "Score about 5% of sampled traffic asynchronously with retry and failure isolation, persist scores, and alert when the 7-day rolling faithfulness falls below 0.85.",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter's monitoring recipe is asynchronous sampled scoring off the request path, a rolling 0.85 alert threshold, and explicit failure isolation so evaluation never crashes the caller.",
      },
    ],
  },
  "ch4-evaluation-tools": {
    objectives: [
      "Match RAGAS, DeepEval, TruLens, and LangSmith to the evaluation job each is built for.",
      "Distinguish offline evaluation gates from online production monitoring, and staff both.",
      "Design a CI quality gate with explicit thresholds, PR reporting, and a versioned golden dataset.",
    ],
    sections: [
      {
        heading: "Four tools, four centers of gravity",
        paragraphs: [
          "RAGAS is the end-to-end RAG evaluator: LLM-as-judge metrics such as faithfulness and answer relevancy with minimal ground truth required, plus a testset generator that synthesizes evaluation questions of different complexity types - simple, multi-hop, conditional - from your documents.",
          "DeepEval is the unit-test framework: it integrates with pytest and ships 10+ metrics, which makes it the natural fit for gating pull requests. TruLens provides feedback functions for RAG and agent pipelines with detailed traces. LangSmith covers the production side: tracing, human annotation, and automated evaluation. The four overlap, but each has a center of gravity - judge-based scoring, test gating, trace-level feedback, and production observation.",
        ],
      },
      {
        heading: "Offline gates versus online monitoring",
        paragraphs: [
          "The chapter overview's first discipline is separating offline evaluation from online monitoring. Offline evaluation answers \"is this change safe to ship?\" and runs on every code change against a fixed golden set. Online monitoring answers \"is the live system still healthy?\" and runs continuously on sampled live traffic with rolling thresholds and alerts.",
          "The two need different machinery. The offline gate uses DeepEval and a retrieval-eval script in CI with hard thresholds; the online loop uses sampled RAGAS faithfulness (about 5% of traffic, run asynchronously), a 7-day rolling alert floor, per-document-type breakdowns, and a human review queue for low-confidence responses. Choosing a tool means first saying which of these two jobs it is doing.",
        ],
      },
      {
        heading: "The CI quality gate, concretely",
        paragraphs: [
          "The chapter's offline-pipeline answer is a GitHub Actions workflow triggered on pull_request: install ragas, deepeval, and the chain dependencies; run a retrieval-eval script against data/golden_set.jsonl with an explicit floor of Recall@5 at 0.80; then run the DeepEval suite with a minimum success rate of 0.85.",
          "Two details turn this from a script into a gate: merges are blocked when a threshold regresses, and the results - faithfulness and Recall@5 - are commented back onto the PR so reviewers see quality next to the diff. The senior signal the chapter names is treating quality as a release gate wired into the dev workflow, not a manual notebook somebody reruns when worried.",
        ],
      },
      {
        heading: "The golden dataset that feeds every tool",
        paragraphs: [
          "Every tool above is only as good as its dataset. The five-step construction: mine around 1000 representative queries from production logs; optionally expand with LLM-synthetic QA pairs generated from your documents, which is faster but noisier; have domain experts write ideal answers for a 300-500 example subset; add adversarial cases - out-of-scope queries, ambiguous queries, multi-hop questions, and queries whose correct answer is \"not in the knowledge base.\"",
          "Then govern it like code: store it as a versioned file such as data/golden_v1.jsonl, and route every update through PR review with human spot-checks. On size, the chapter is explicit - 200 high-quality, diverse examples are enough for meaningful evaluation, and quality beats quantity: 200 diverse examples beat 2000 noisy ones.",
        ],
      },
    ],
    example: {
      title: "Worked example: gating a chunking change",
      scenario:
        "A team wants to merge a chunking-strategy change. Until now, evaluation meant a data scientist rerunning a RAGAS notebook \"when someone remembered.\" Twice last quarter, retrieval regressions reached users before anyone noticed.",
      analysis:
        "The failure is not metric choice but workflow: no gate, no fixed dataset, no enforced threshold. The chapter's design puts a retrieval-eval script with a minimum Recall@5 of 0.80 and a DeepEval suite with a 0.85 minimum success rate into a pull_request workflow, comments faithfulness and Recall@5 on the PR, and blocks the merge on regression.",
      decision:
        "Stand up the CI quality gate on a versioned golden set, keep tracing plus sampled faithfulness monitoring for the online side, and demote the notebook to exploratory use only. The next chunking change passes or fails in the pull request, not in production.",
    },
    productionChecklist: [
      "Version the golden dataset and route every update through PR review with human spot-checks.",
      "Keep explicit thresholds in CI (for example Recall@5 at 0.80 or higher, generation success rate at 0.85 or higher) and block merges on regression.",
      "Comment metric results on every pull request so quality is reviewed beside the diff.",
      "Sample live traffic for online monitoring with rolling-threshold alerts and a human review queue.",
      "Cover adversarial and out-of-scope cases in the golden set, not only happy-path questions.",
    ],
    commonMistakes: [
      "Running RAGAS once in a notebook and treating quality as permanently checked.",
      "Gating releases on latency and cost while leaving quality to post-deploy monitoring.",
      "Building the golden set from synthetic data alone, with no mined production queries or human annotation.",
      "Measuring dataset progress by volume - the chapter's bar is 200 diverse, high-quality examples over 2000 noisy ones.",
    ],
    knowledgeChecks: [
      {
        id: "ch4-evaluation-tools-kc-1",
        prompt:
          "A team wants evaluation to behave like unit tests: pytest integration, a library of ready metrics, and results that block merges on pull requests. Which tool should they pick, and why?",
        options: [
          "DeepEval, because the chapter describes it as a unit-test framework that integrates with pytest and supports 10+ metrics.",
          "RAGAS, because it needs minimal ground truth and uses an LLM judge.",
          "LangSmith, because it combines production tracing with human annotation.",
        ],
        correct: 0,
        feedback:
          "Correct. The chapter positions DeepEval as the unit-test framework with pytest integration, and its CI pipeline uses DeepEval for the generation gate with a minimum success rate.",
      },
      {
        id: "ch4-evaluation-tools-kc-2",
        prompt:
          "A team's evaluation habit is a data scientist rerunning a RAGAS notebook whenever someone remembers, and retrieval regressions reached users twice last quarter. What is the most important change to make?",
        options: [
          "Rerun the notebook more often, ideally every day, and assign it to an on-call rotation.",
          "Replace RAGAS with TruLens, because its detailed traces prevent regressions automatically.",
          "Move evaluation into a pull-request CI gate with explicit thresholds on a versioned golden set, so merges are blocked on regression.",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter's senior pattern is a CI quality gate - thresholds like Recall@5 at 0.80 and an 0.85 generation success rate wired into the dev workflow - not a manual notebook somebody reruns.",
      },
      {
        id: "ch4-evaluation-tools-kc-3",
        prompt:
          "A golden evaluation set was built entirely from LLM-synthetic QA pairs. The system's real production failures - out-of-scope and multi-hop questions - never appear in evaluation results. Which construction step was skipped?",
        options: [
          "Version control, because unversioned datasets silently drop difficult examples over time.",
          "The adversarial step: the chapter requires adding out-of-scope, ambiguous, and multi-hop cases, which synthetic generation alone does not supply.",
          "Human annotation, because experts should rewrite every synthetic answer before any use.",
        ],
        correct: 1,
        feedback:
          "Correct. The chapter's five-step process calls LLM-synthetic pairs faster but noisier and separately requires adversarial examples - out-of-scope, ambiguous, multi-hop - to cover real failure cases.",
      },
      {
        id: "ch4-evaluation-tools-kc-4",
        prompt:
          "A stakeholder argues the team should keep expanding the golden set toward thousands of examples before trusting any evaluation result. Which chapter-aligned defense of shipping evaluation sooner is strongest?",
        options: [
          "Large datasets are impossible to store cheaply, so volume must be capped for infrastructure reasons.",
          "Synthetic generation is always more accurate than human annotation, so scale that instead.",
          "Quality beats quantity: the chapter says 200 diverse, high-quality examples are enough for meaningful evaluation and beat 2000 noisy ones.",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter's minimum viable dataset is about 200 high-quality, diverse examples, and it explicitly argues quality over quantity rather than volume first.",
      },
      {
        id: "ch4-evaluation-tools-kc-5",
        prompt:
          "A pull request changes the chunking strategy. Which CI result reporting best supports the merge decision, according to the chapter's offline pipeline design?",
        options: [
          "Comment faithfulness and Recall@5 on the PR and block the merge when thresholds regress, so reviewers see quality beside the diff.",
          "Post a pass-or-fail badge with no numbers, because metric details distract reviewers from the code.",
          "Email a weekly digest of evaluation trends to the whole engineering organization.",
        ],
        correct: 0,
        feedback:
          "Correct. The chapter's workflow comments faithfulness and Recall@5 on the pull request and blocks merges on regression - PR-level reporting tied to explicit thresholds.",
      },
    ],
  },
};

export const chapter04Practice: CatalogPracticeUnit[] = [
  {
    id: "ch4-4-2-1",
    chapter: 4,
    chapterTitle: "Evaluation & Metrics",
    title: "How do you measure hallucination?",
    pages: "43",
    route: "/practice/evaluation-and-metrics/how-do-you-measure-hallucination",
    competencies: ["Recall/Precision/MRR/nDCG", "faithfulness", "golden sets", "offline evaluation"],
    question:
      "You are interviewing for a senior AI platform role. The interviewer points at your RAG architecture diagram and asks: \"How do you measure and monitor hallucination in a production RAG system?\" Which response is strongest?",
    options: [
      {
        text: "Define hallucination as any claim in the answer not supported by the retrieved context, then automate measurement: run RAGAS faithfulness on roughly 5% of sampled traffic asynchronously, alert when the 7-day rolling score drops below a threshold like 0.85, route low-confidence responses to a human review queue, and track hallucination rates per document type.",
        correct: true,
        feedback:
          "Correct - this is the chapter's senior pattern: a precise claim-support definition, automated sampled measurement, rolling-threshold alerts, and a human review queue. The ownership signal is continuous, sampled, alerted measurement, not a one-off check.",
      },
      {
        text: "Have a domain expert manually review a batch of answers each week and file tickets for anything that looks fabricated.",
        correct: false,
        feedback:
          "Weekly manual spot-checks are the junior pattern the chapter contrasts against: they are not continuous, sampled, or alerted, and they scale with reviewer time rather than with traffic.",
      },
      {
        text: "Track the thumbs-down rate on answers and treat a rising rate as the hallucination signal.",
        correct: false,
        feedback:
          "User flags conflate irrelevance, tone, and UI issues with unsupported claims. The chapter's bar is a precise claim-support definition measured automatically with an LLM judge, not a proxy that depends on users noticing.",
      },
    ],
  },
  {
    id: "ch4-4-2-2",
    chapter: 4,
    chapterTitle: "Evaluation & Metrics",
    title: "What is faithfulness in RAG?",
    pages: "44",
    route: "/practice/evaluation-and-metrics/what-is-faithfulness-in-rag",
    competencies: ["Recall/Precision/MRR/nDCG", "faithfulness", "golden sets", "offline evaluation"],
    question:
      "The interviewer follows up: \"Define faithfulness. How is it measured, and how do you improve it?\" What should the strongest answer contain?",
    options: [
      {
        text: "Faithfulness is the model's factual accuracy against general world knowledge, measured by comparing answers with a public QA benchmark.",
        correct: false,
        feedback:
          "This misses the chapter's definition: faithfulness is judged against the retrieved context, not world knowledge - an answer can be worldly-true yet unfaithful to the evidence it was given.",
      },
      {
        text: "Faithfulness is the fraction of factual claims in the answer verifiable against the retrieved context; RAGAS extracts the claims with an LLM, checks each for entailment by the context, and scores supported over total - then improve it with a grounding system prompt, citation before answering, a post-generation verification pass, and temperature at 0.2 or below for factual tasks.",
        correct: true,
        feedback:
          "Correct - the senior answer the chapter describes gives the exact computation (extract claims, check entailment, supported/total) and links the metric to specific levers: grounding prompt, citation, post-hoc verification, and low temperature.",
      },
      {
        text: "Faithfulness measures whether the answer addresses the user's question, computed by back-generating questions from the answer and comparing them with the original.",
        correct: false,
        feedback:
          "That is answer relevancy's mechanism in RAGAS. Swapping the two definitions is exactly the kind of metric confusion the chapter warns against when it says the metrics must be interpreted together.",
      },
    ],
  },
  {
    id: "ch4-4-2-3",
    chapter: 4,
    chapterTitle: "Evaluation & Metrics",
    title: "How do you evaluate retrieval vs generation separately?",
    pages: "44",
    route: "/practice/evaluation-and-metrics/how-do-you-evaluate-retrieval-vs-generation-separately",
    competencies: ["Recall/Precision/MRR/nDCG", "faithfulness", "golden sets", "offline evaluation"],
    question:
      "Midway through a system-design interview you are asked: \"Why is it important to evaluate retrieval and generation separately, and how would you do it?\" Choose the strongest response.",
    options: [
      {
        text: "Evaluate the system end-to-end with an LLM judge on final answers, because that is the only signal users actually experience.",
        correct: false,
        feedback:
          "End-to-end-only scoring leaves every failure unattributable - the chapter's whole point is that a bad answer could mean wrong retrieval or unfaithful generation, and one score cannot tell them apart.",
      },
      {
        text: "Tune the prompt until answer quality improves, then infer that retrieval must have been healthy all along.",
        correct: false,
        feedback:
          "Improving the prompt first can mask a retrieval failure and burns effort when Recall@K is the real bottleneck; the chapter's diagnostic rule says check retrieval with labeled pairs before or alongside generation fixes.",
      },
      {
        text: "Separation makes a bad answer attributable: score retrieval with labeled (query, relevant_doc_ids) pairs using Recall@K, Precision@K, MRR, and NDCG - no LLM required - and score generation by injecting the ground-truth document as context and measuring faithfulness and correctness; if Recall@5 is 0.9 but faithfulness is 0.6, fix the prompt, while Recall@5 of 0.4 means fix retrieval first.",
        correct: true,
        feedback:
          "Correct - this is the chapter's decomposition: LLM-free retrieval metrics, generation measured against perfect injected context, and the explicit diagnostic rule that routes the fix to the failing stage.",
      },
    ],
  },
  {
    id: "ch4-4-2-4",
    chapter: 4,
    chapterTitle: "Evaluation & Metrics",
    title: "How would you build an offline evaluation pipeline?",
    pages: "45",
    route: "/practice/evaluation-and-metrics/how-would-you-build-an-offline-evaluation-pipeline",
    competencies: ["Recall/Precision/MRR/nDCG", "faithfulness", "golden sets", "offline evaluation"],
    question:
      "The interviewer asks you to design the quality process itself: \"Build an offline evaluation pipeline that runs on every code change before deployment.\" Which design is strongest?",
    options: [
      {
        text: "A CI quality gate on every pull request: run the retrieval suite against a versioned golden set with an explicit floor such as Recall@5 at 0.80 or higher, run the generation suite with DeepEval at a minimum success rate such as 0.85, block merges on regression, and comment the metric results back onto the PR for reviewers.",
        correct: true,
        feedback:
          "Correct - the chapter's senior answer treats evaluation as a release gate wired into the dev workflow: explicit thresholds, merge blocking, and PR-level reporting rather than a manual notebook.",
      },
      {
        text: "Keep a RAGAS notebook that the team reruns before big releases, and rely on code review to catch risky prompt changes in between.",
        correct: false,
        feedback:
          "A manually rerun notebook cannot block regressions and depends on someone remembering; the chapter explicitly contrasts this with a CI gate that runs on every pull request with enforced thresholds.",
      },
      {
        text: "Gate deployments on latency, cost, and unit tests, then watch quality dashboards after release to catch any quality regressions.",
        correct: false,
        feedback:
          "This defers quality validation to production; the chapter's design catches regressions offline on every code change, before users ever see them.",
      },
    ],
  },
  {
    id: "ch4-4-2-5",
    chapter: 4,
    chapterTitle: "Evaluation & Metrics",
    title: "How do you create a golden dataset?",
    pages: "46",
    route: "/practice/evaluation-and-metrics/how-do-you-create-a-golden-dataset",
    competencies: ["Recall/Precision/MRR/nDCG", "faithfulness", "golden sets", "offline evaluation"],
    question:
      "For the final question, the interviewer asks: \"How do you create a high-quality golden evaluation dataset for your RAG system?\" Which answer demonstrates the most senior approach?",
    options: [
      {
        text: "Use an LLM to generate several thousand synthetic QA pairs from the document corpus and adopt them directly as the evaluation set.",
        correct: false,
        feedback:
          "The chapter calls LLM-synthetic generation faster but noisier and lists it as only one of five steps - without mined production queries, human annotation, and adversarial cases, the set measures the generator's imagination more than the system's real failures.",
      },
      {
        text: "Mine around 1000 representative queries from production logs, expand with LLM-generated QA pairs where useful, have domain experts hand-write ideal answers for a 300-500 example subset, add adversarial cases - out-of-scope, ambiguous, multi-hop, and \"not in the knowledge base\" - and version the set under PR review, treating roughly 200 diverse, high-quality examples as the minimum viable bar.",
        correct: true,
        feedback:
          "Correct - this is the chapter's five-step process with its governance point: real production queries, human annotation, adversarial coverage, version control, and quality over quantity.",
      },
      {
        text: "Maximize volume by collecting every question the support team has ever received, since evaluation quality scales with dataset size.",
        correct: false,
        feedback:
          "The chapter argues the opposite: quality beats quantity, and 200 diverse, high-quality examples support meaningful evaluation better than 2000 noisy ones.",
      },
    ],
  },
];
