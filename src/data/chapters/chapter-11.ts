import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter11Module: LearningModule = {
  id: "chapter-11-observability-and-monitoring",
  title: "Observability & Monitoring",
  description:
    "Make a deployed RAG system diagnosable: structured traces, retrieval logs, prompt and model versions, latency histograms, drift detectors, and feedback loops that connect production issues back to measurable causes.",
  duration: "3 lessons",
  lessons: [
    {
      id: "ch11-what-to-log",
      title: "What to Log",
      prompt: "Design a structured trace for every RAG request",
      question:
        "A team logs only the final answer and total latency for each RAG request. Users report wrong answers, and the team cannot tell whether retrieval, prompting, or generation failed. What is the most valuable change?",
      options: [
        "Emit a structured trace per request covering inputs, retrieval IDs and scores, re-ranking order, generation details, guardrails and citations, and the final outcome",
        "Increase verbosity of the model's raw output logging so engineers can read more answers manually when complaints arrive",
        "Replace per-request logs with a daily aggregate dashboard of average latency and error rate, which is cheaper to store",
      ],
      correct: 0,
      feedback:
        "Strong choice. Per-stage traces let you branch directly to retrieval, context, prompt, or model failures instead of guessing from one blended end-to-end signal.",
      explanation:
        "Every RAG request should produce a structured trace spanning inputs, retrieval, re-ranking, generation, post-processing, and outcome. Retrieved document IDs and similarity scores are indispensable because bad retrieval is the most common source of bad answers, while model name and token counts make version and cost regressions attributable. Aggregate-only monitoring can never attribute one bad answer to the stage that caused it.",
      takeaways: [
        "Log per request and per stage, not only the final output.",
        "Retrieved document IDs plus similarity scores are the minimum for diagnosing retrieval failures.",
        "Record model name and prompt/completion tokens so version and cost regressions are visible.",
      ],
      model: ["Structured trace", "Stage-level fields", "Join to outcome"],
      source: { chapter: 11, sections: ["11.1.1"], pages: "78" },
    },
    {
      id: "ch11-tracing-tools",
      title: "Tracing Tools",
      prompt: "Match the tracing stack to the system's constraints",
      question:
        "A platform runs several RAG services, some built on LangChain and some custom, and wants traces from all of them exported into its existing Jaeger backend without being tied to one LLM vendor. Which tracing choice fits best?",
      options: [
        "Standardize everything on LangSmith and rewrite the custom services into LangChain so all traces share one visual trace tree",
        "Deploy Helicone as a proxy in front of every service so token tracking and replay come for free with no instrumentation work",
        "Instrument services with OpenTelemetry and export spans to Jaeger, keeping the tracing standard vendor-neutral across heterogeneous codebases",
      ],
      correct: 2,
      feedback:
        "Strong choice. OpenTelemetry is the vendor-neutral option among the three tools and exports to Jaeger, Datadog, or Honeycomb, so mixed services share one trace format without a rewrite.",
      explanation:
        "Three representative tools have distinct integration models: LangSmith gives native LangChain tracing with a visual trace tree, eval functions, and annotations; OpenTelemetry is vendor-neutral and exports to backends such as Jaeger, Datadog, and Honeycomb; Helicone is an LLM-specific proxy with token tracking, a cost dashboard, and replay. The right choice follows the stack, the existing backend, and the cost-visibility requirement rather than any single tool's popularity.",
      takeaways: [
        "LangSmith fits LangChain-centric teams that want trace trees, evals, and annotations.",
        "OpenTelemetry is the vendor-neutral choice for multi-service export to existing backends.",
        "Helicone's proxy model delivers token tracking, cost dashboards, and replay quickly.",
      ],
      model: ["Propagate request ID", "Instrument each stage", "Export to one backend"],
      source: { chapter: 11, sections: ["11.1.2"], pages: "78" },
    },
    {
      id: "ch11-drift-detection",
      title: "Drift Detection",
      prompt: "Detect traffic and quality shifts before users do",
      question:
        "Six weeks after launch, thumbs-down rates creep upward even though nothing was deployed. Which monitoring set would detect the likely causes earliest?",
      options: [
        "Server CPU and memory utilization, because resource pressure is the usual explanation for quality decay",
        "Embedding drift via weekly query-centroid cosine distance, topic drift via BERTopic new-cluster alerts, and quality drift via RAGAS faithfulness and relevance trends",
        "A daily count of total requests and 5xx errors, because distribution drift always surfaces as rising failure rates",
      ],
      correct: 1,
      feedback:
        "Strong choice. The query distribution and answer quality can drift without any code change; the three drift detectors target exactly those shifts rather than infrastructure health.",
      explanation:
        "Three drift types matter: embedding drift measured as cosine distance between weekly query-embedding centroids, topic drift found by running a topic model on new queries and alerting on new clusters, and quality drift tracked as RAGAS faithfulness and relevance trending downward over time. Infrastructure metrics capture none of these because it is the traffic that changed, not the deployment.",
      takeaways: [
        "Drift happens without deploys; monitor the query distribution, not only the system.",
        "Compare weekly query-embedding centroids with cosine distance to spot semantic shift.",
        "Alert on new topic clusters and downward RAGAS faithfulness and relevance trends.",
      ],
      model: ["Baseline distribution", "Periodic comparison", "Alert on shift"],
      source: { chapter: 11, sections: ["11.1.3"], pages: "78" },
    },
  ],
};

export const chapter11CourseContent: Record<string, LessonCourseContent> = {
  "ch11-what-to-log": {
    objectives: [
      "Design a structured per-request trace schema covering inputs, retrieval, re-ranking, generation, post-processing, and outcome.",
      "Prioritize the highest-diagnostic-value signals when the logging budget is limited.",
      "Connect each logged field to the concrete debugging or cost decision it enables.",
    ],
    sections: [
      {
        heading: "A trace per request, not a log of outputs",
        paragraphs: [
          "A RAG answer is the product of a pipeline: the query is rewritten, candidates are retrieved, re-ranked, assembled into a prompt, generated, and post-processed. Logging only the final response collapses all of those stages into one number, so every failure looks like a model failure. The core requirement is a structured trace per request that records what each stage received and produced.",
          "The trace starts with inputs: the raw query, the rewritten query, and session context, which expose query-rewriting problems early. Retrieval contributes the query embedding, retrieved document IDs, similarity scores, and latency; re-ranking adds the before-and-after document ordering and re-ranker scores. These fields matter most because bad retrieval is the most common source of bad answers.",
        ],
      },
      {
        heading: "Generation, post-processing, and outcome fields",
        paragraphs: [
          "The generation stage should record the model name, prompt tokens, completion tokens, latency, and the response. Token counts make cost overruns visible per request instead of at the end of the month, and the model name lets you re-run a failing query on a prior version to check for a version regression.",
          "Post-processing fields capture guardrail results, citations, and a confidence score, while the outcome field stores user feedback when available alongside the final delivered response. Joining outcome to stage data is what turns a trace store into a quality system: thumbs-down events can be traced back to the exact retrieval set, prompt assembly, and model version that produced them.",
        ],
      },
      {
        heading: "Prioritizing when you cannot log everything",
        paragraphs: [
          "The tough interview question asks which five signals survive a hard limit, and the answer is a prioritization exercise: retrieved document IDs with scores, an asynchronously computed faithfulness score, end-to-end latency at P50/P95/P99, LLM token usage, and a user feedback signal. Each is justified by a decision: diagnose retrieval, catch hallucination trends before users notice, see performance regressions including tail spikes, keep cost visible, and obtain ground truth on quality.",
          "The senior signal is not the list itself but the reasoning. A junior answer names generic logs; a senior answer defends a small set of signals by their diagnostic and cost value. Expensive checks such as faithfulness scoring stay asynchronous and sampled so that observability does not become a latency or cost problem of its own.",
        ],
      },
      {
        heading: "From logs to decisions",
        paragraphs: [
          "Every retained field should map to an action. Low similarity scores route investigation toward chunking, the embedding model, or query rewriting; high scores on irrelevant documents point to semantic mismatch and metadata filtering; prompt-token anomalies expose truncation or assembly bugs. If a field never changes a decision, it is storage cost without diagnostic value.",
          "Latency belongs in the trace as a histogram, not an average: the priority list calls for P50, P95, and P99 because tail latency spikes are invisible in a mean. Combined with per-request token usage, these fields give the team one artifact that supports debugging, capacity work, and cost control at the same time.",
        ],
      },
    ],
    example: {
      title: "Worked example: the invisible regression",
      scenario:
        "A support RAG bot's monthly LLM bill doubles and wrong-answer complaints rise in the same month. The team only logs request counts and final answers, so it can neither explain the cost nor attribute the bad answers.",
      analysis:
        "Without prompt and completion token counts per request, the cost overrun is invisible until the invoice arrives. Without retrieved document IDs and similarity scores, the team cannot tell retrieval failures from generation failures, and without any sampled faithfulness scoring the hallucination trend goes unnoticed until users complain.",
      decision:
        "Implement the structured trace with per-stage fields, then add the five priority signals: retrieved IDs plus scores, async faithfulness sampling, P50/P95/P99 latency, token usage per request, and thumbs up/down feedback joined to the trace by request ID.",
    },
    productionChecklist: [
      "Emit one structured trace per request with a request ID propagated across all stages.",
      "Log retrieved document IDs, similarity scores, and the re-ranker's before/after ordering.",
      "Record model name, prompt tokens, and completion tokens on every generation call.",
      "Capture guardrail results, citations, confidence, and the final delivered response.",
      "Attach user feedback to the trace so quality ground truth joins stage-level data.",
    ],
    commonMistakes: [
      "Logging only the final answer and blaming the LLM for every bad response.",
      "Tracking average latency instead of P50/P95/P99, hiding tail regressions.",
      "Omitting token counts, so cost overruns surface only when the bill arrives.",
      "Collecting traces without a user feedback signal, leaving no ground truth for quality.",
    ],
    knowledgeChecks: [
      {
        id: "ch11-what-to-log-kc-1",
        prompt:
          "A RAG service currently writes only the final answer and total request latency to its logs, and the team cannot tell which stage caused a wrong answer. What should the logging redesign introduce first?",
        options: [
          "A structured per-request trace recording inputs, retrieval IDs and scores, re-ranking order, generation details, post-processing results, and the outcome",
          "Longer retention of the existing final-answer logs so engineers can manually compare more historical answers side by side",
          "A single daily aggregate of mean latency and total requests, because dashboards are cheaper to query than per-request records",
        ],
        correct: 0,
        feedback:
          "Every RAG request should produce a structured trace spanning inputs, retrieval, re-ranking, generation, post-processing, and outcome; final-answer logs cannot attribute a failure to its stage.",
      },
      {
        id: "ch11-what-to-log-kc-2",
        prompt:
          "In the worked example, a support RAG bot's monthly bill doubles and wrong-answer complaints rise while the team logs only request counts and final answers. Which two trace fields would have exposed each problem earliest?",
        options: [
          "Uptime percentage and average daily request count, because availability and traffic volume explain both cost and quality trends",
          "The raw query text and the final delivered response, since reading both sides of the conversation reveals every failure type",
          "Prompt and completion token counts for the cost overrun, and retrieved document IDs with similarity scores for the wrong answers",
        ],
        correct: 2,
        feedback:
          "Token usage ties to cost visibility before the bill arrives, and retrieved IDs plus scores diagnose retrieval, the most common source of bad answers.",
      },
      {
        id: "ch11-what-to-log-kc-3",
        prompt:
          "A team investigates a bad answer and finds its trace lacks retrieved document IDs and similarity scores, while generation fields are complete. Why does this gap block the standard debugging ladder?",
        options: [
          "Because the trace is too small to store in the time-series database, so the latency histograms and token counts are dropped along with it",
          "Because the ladder branches on similarity scores: low scores implicate chunking, embeddings, or query rewriting, while high scores on irrelevant documents indicate semantic mismatch — without them retrieval cannot be ruled in or out",
          "Because generation fields can only be interpreted after the model version is known, and the retrieval gap hides which model produced the answer",
        ],
        correct: 1,
        feedback:
          "The debugging ladder checks retrieved_doc_ids and similarity scores first and branches on their values; missing those fields makes the retrieval step undiagnosable.",
      },
      {
        id: "ch11-what-to-log-kc-4",
        prompt:
          "A manager proposes logging every full prompt, completion, and retrieved document for all traffic so nothing is ever missing. How should you defend a prioritized signal set instead?",
        options: [
          "Agree, since storage is cheaper than engineering time and a complete record removes the need to reason about which signals matter",
          "Reject per-request logging entirely and rely on user reports, because any tracing adds unacceptable latency to the generation path",
          "Defend a small set justified by the decision each enables — retrieved IDs and scores for retrieval diagnosis, async faithfulness for hallucination trends, latency percentiles, token usage for cost, and user feedback as ground truth",
        ],
        correct: 2,
        feedback:
          "The senior-answer signal is prioritizing logs by diagnostic and cost value; the five signals each map to a concrete decision rather than to maximal capture.",
      },
      {
        id: "ch11-what-to-log-kc-5",
        prompt:
          "Before launch you must prove the new tracing design supports the debugging workflow. Which validation evidence best demonstrates the instrumentation is production-ready?",
        options: [
          "Re-run a set of known past failures through the instrumented pipeline and confirm each trace contains the fields needed to branch at every ladder step, with one request ID joining stages, user feedback attached, and token counts plus P50/P95/P99 latency visible per request",
          "Show that daily log volume stays under the storage budget and that the aggregate dashboard renders without errors for a full week",
          "Demonstrate that the average end-to-end latency metric is populated, since one healthy aggregate proves every pipeline stage is covered",
        ],
        correct: 0,
        feedback:
          "Production readiness means traces actually support the debugging ladder: per-stage fields under one request ID with the outcome joined and percentile latency, not just pipeline throughput or averages.",
      },
    ],
  },
  "ch11-tracing-tools": {
    objectives: [
      "Compare LangSmith, OpenTelemetry, and Helicone by integration model and strengths.",
      "Choose a tracing stack from framework, vendor, backend, and cost-visibility constraints.",
      "Use traces beyond debugging: evaluations, annotations, replay, and cost dashboards.",
    ],
    sections: [
      {
        heading: "Three integration models",
        paragraphs: [
          "This chapter surveys three representative tools. LangSmith is the native tracing option for LangChain, offering a visual trace tree plus eval functions and annotations, so trace data doubles as evaluation material. OpenTelemetry is the vendor-neutral standard and exports to backends such as Jaeger, Datadog, and Honeycomb.",
          "Helicone takes a third route: an LLM-specific proxy that adds token tracking, a cost dashboard, and replay without deep code changes. The trade-off is span granularity — a proxy sees requests and responses at the boundary, while a native SDK or OpenTelemetry instrumentation can expose retrieval, re-ranking, and prompt assembly as separate spans inside the pipeline.",
        ],
      },
      {
        heading: "Choosing by constraint",
        paragraphs: [
          "Tool choice follows the stack and the operating environment. A LangChain-centric team that wants annotations and built-in eval functions gets the most from LangSmith. A heterogeneous platform with several frameworks and an existing observability backend should standardize on OpenTelemetry so every service exports the same span format.",
          "Cost visibility and fast adoption argue for Helicone: placing a proxy in front of LLM calls delivers token tracking and a cost dashboard immediately, and replay helps reproduce failing requests. These options compose — a team can run OpenTelemetry spans across services while a proxy handles LLM cost accounting.",
        ],
      },
      {
        heading: "Making traces operable",
        paragraphs: [
          "The first step of the debugging ladder is pulling the full trace for a single request ID, which only works if one identity is propagated across every service and stage. Trace design should treat that request ID as a hard contract, carried through retrieval, orchestration, and generation calls alike.",
          "Traces must also land where the team can compute on them. Exporting to a backend such as Jaeger, Datadog, or Honeycomb enables percentile latency views and alerting, and a visual trace tree lets an on-call engineer branch quickly between retrieval and generation hypotheses instead of reading raw logs.",
        ],
      },
      {
        heading: "From traces to evaluation assets",
        paragraphs: [
          "The debugging process ends by writing a unit test that reproduces the failure and adding it to a regression suite. Tracing tools support that loop directly: LangSmith's eval functions and annotations turn inspected traces into scored datasets, and Helicone's replay re-runs captured requests against a fix before it ships.",
          "Traces also feed the weekly feedback analysis loop, where reviewers inspect the worst-performing query clusters and categorize each root cause as retrieval, generation, or prompt. Without per-stage traces that categorization is guesswork; with them it is a mechanical review of recorded evidence.",
        ],
      },
    ],
    example: {
      title: "Worked example: one trace across a mixed stack",
      scenario:
        "A company runs a LangChain orchestrator plus two custom retrieval microservices. Finance wants token cost per product line, and the on-call team already operates Jaeger and wants end-to-end traces there.",
      analysis:
        "OpenTelemetry satisfies the on-call requirement: vendor-neutral spans from all three services export to the existing Jaeger backend under one request ID. The finance requirement points to an LLM-aware proxy such as Helicone for token tracking and cost dashboards, while LangSmith's annotations and eval functions add value where LangChain is already in use.",
      decision:
        "Adopt OpenTelemetry as the trace backbone across services, front the LLM calls with Helicone for cost and replay, and use LangSmith evals on the orchestrator — composing the tools by constraint rather than forcing one tool everywhere.",
    },
    productionChecklist: [
      "Propagate a single request ID through every service and pipeline stage.",
      "Export spans to a backend the team already operates, such as Jaeger, Datadog, or Honeycomb.",
      "Verify the trace tree shows retrieval, re-ranking, and generation as separate spans.",
      "Enable token tracking and a cost dashboard for LLM calls.",
      "Keep replay or re-run capability for captured failing requests.",
    ],
    commonMistakes: [
      "Instrumenting only the LangChain service and leaving custom services untraced.",
      "Locking traces into a format that cannot export to the existing observability backend.",
      "Capturing traces but never linking them to evaluation, annotation, or replay workflows.",
      "Relying on a proxy alone and losing per-stage span detail inside the pipeline.",
    ],
    knowledgeChecks: [
      {
        id: "ch11-tracing-tools-kc-1",
        prompt:
          "A platform team must pick one tracing approach for three RAG services built on different frameworks, exporting to an existing Jaeger backend. Which choice fits the stated constraints?",
        options: [
          "LangSmith, because its visual trace tree, eval functions, and annotations make it the richest option for any framework",
          "OpenTelemetry, because it is vendor-neutral and exports to Jaeger, Datadog, or Honeycomb, so all three heterogeneous services share one span format",
          "Helicone, because an LLM-specific proxy in front of each service gives every service identical internal stage spans with no code changes",
        ],
        correct: 1,
        feedback:
          "OpenTelemetry is vendor-neutral with export to Jaeger, Datadog, and Honeycomb; LangSmith is native to LangChain, and a proxy sees boundary calls rather than internal stage spans.",
      },
      {
        id: "ch11-tracing-tools-kc-2",
        prompt:
          "In the worked example, finance wants token cost per product line while on-call wants end-to-end traces in Jaeger across a LangChain orchestrator and two custom services. Which composition satisfies both?",
        options: [
          "OpenTelemetry spans across all services into Jaeger for on-call, with Helicone in front of LLM calls for token tracking and cost dashboards, and LangSmith evals where LangChain runs",
          "Helicone alone for everything, since its cost dashboard also produces cross-service distributed traces in Jaeger automatically",
          "LangSmith alone for everything, because finance and on-call can both export its annotations into the Jaeger backend natively",
        ],
        correct: 0,
        feedback:
          "Each tool has a distinct strength — OpenTelemetry for vendor-neutral export, Helicone for token tracking and cost dashboards, LangSmith for LangChain-native evals — so composition by constraint beats one tool everywhere.",
      },
      {
        id: "ch11-tracing-tools-kc-3",
        prompt:
          "During an incident, an engineer cannot pull a single end-to-end trace for the failing request because each service logs with its own unrelated identifiers. What design defect does this reveal?",
        options: [
          "The services need longer log retention windows, because short retention deletes the identifiers before incidents are investigated",
          "The tracing backend lacks sufficient storage, so spans from different services are being dropped under write pressure",
          "No request ID was propagated across services, which breaks the first step of the debugging ladder: retrieving the full trace for that request ID",
        ],
        correct: 2,
        feedback:
          "The debugging ladder starts by pulling the full trace for the request ID; without one propagated identity, per-service records cannot be joined into the trace that step requires.",
      },
      {
        id: "ch11-tracing-tools-kc-4",
        prompt:
          "A teammate argues for putting the Helicone proxy in front of all LLM traffic as the complete observability solution, citing zero instrumentation work. What trade-off should you raise?",
        options: [
          "That proxies cannot track tokens or cost, so Helicone would fail even at its stated purpose of LLM call accounting",
          "That a proxy observes requests and responses at the boundary but not internal retrieval, re-ranking, and prompt-assembly spans, so stage-level diagnosis still needs SDK or OpenTelemetry instrumentation",
          "That replay is only useful for building training data, so adopting the proxy would lock the team out of debugging workflows entirely",
        ],
        correct: 1,
        feedback:
          "Helicone is an LLM-specific proxy for token tracking, cost dashboards, and replay; boundary capture trades away the per-stage span detail that native or OpenTelemetry instrumentation provides.",
      },
      {
        id: "ch11-tracing-tools-kc-5",
        prompt:
          "Before declaring the tracing rollout complete, which evidence shows the tooling actually supports the team's debug-to-regression workflow rather than merely collecting spans?",
        options: [
          "A drill where a known bad request is traced end to end by request ID, its root cause categorized as retrieval, generation, or prompt, a reproducing test added to the regression suite, and replay used to verify the fix",
          "A report showing total spans stored per day grew steadily after rollout, proving that instrumentation coverage increased across all services",
          "A screenshot of the cost dashboard showing token totals for the month, proving finance can audit LLM spend without engineering help",
        ],
        correct: 0,
        feedback:
          "The debugging ladder ends with a reproducing unit test added to the regression suite, and replay plus annotations turn traces into evaluation assets; volume or cost screenshots do not prove diagnostic capability.",
      },
    ],
  },
  "ch11-drift-detection": {
    objectives: [
      "Distinguish embedding drift, topic drift, and quality drift and their different causes.",
      "Implement weekly centroid comparison, topic-cluster alerts, and RAGAS trend monitoring.",
      "Route confirmed drift into corpus, prompt, or model remediation with validation before deploy.",
    ],
    sections: [
      {
        heading: "Why systems drift without deploys",
        paragraphs: [
          "A RAG system can degrade while every line of code stays the same, because its quality depends on the match between the corpus, the models, and the live query distribution. Users change what they ask, and the system's answers decay quietly. Drift separates into three detectable types rather than one vague notion of staleness.",
          "Infrastructure monitoring cannot see any of them. CPU, memory, and error rates stay flat while semantic relevance erodes, which is why drift detection watches the traffic and the output quality directly: embedding drift, topic drift, and quality drift each get their own detector and cadence.",
        ],
      },
      {
        heading: "Embedding and topic drift",
        paragraphs: [
          "Embedding drift is measured as the cosine distance between weekly query-embedding centroids. A growing distance means the semantic center of traffic is moving away from the baseline the corpus and prompts were tuned for, even if every individual query still looks reasonable.",
          "Topic drift uses a finer lens: run a topic model such as BERTopic over new queries and alert on new clusters. A brand-new cluster usually means users need content the corpus does not cover, which maps directly to the feedback-loop fix of adding missing documents for that content type.",
        ],
      },
      {
        heading: "Quality drift and alerting",
        paragraphs: [
          "Quality drift is tracked as RAGAS faithfulness and relevance trending downward over time. To keep it affordable, scoring runs asynchronously on a sample — for example, every twentieth request — and writes to a time-series database such as InfluxDB or Prometheus rather than the request path.",
          "Alerts fire on rolling windows, not single points: the threshold example fires when the seven-day rolling mean faithfulness drops below 0.85. Rolling thresholds suppress noise from one bad day while still catching a sustained decline well before complaint volume makes it obvious.",
        ],
      },
      {
        heading: "Responding to drift",
        paragraphs: [
          "Detection without response is just a red dashboard. The dashboard view combines the faithfulness trend, hallucination rate by query category, and the correlation between user feedback and faithfulness, so an operator can see whether a drift alert is affecting real users and which query categories drive it.",
          "Confirmed drift feeds the same fix pipeline as user feedback: add missing documents or improve chunking for retrieval-side gaps, update prompts for generation-side issues, and validate the fix on the golden eval set for the affected topic cluster before deploying. Drift response is a recurring flywheel, not a one-off incident.",
        ],
      },
    ],
    example: {
      title: "Worked example: the quiet traffic shift",
      scenario:
        "An internal HR assistant launches for benefits questions. Two months later, company news drives a wave of severance-policy queries, and the thumbs-down rate climbs with no deployment and no infra alerts.",
      analysis:
        "Weekly query-embedding centroids show a cosine-distance jump versus baseline — classic embedding drift. The topic model flags a new severance cluster, and the rolling RAGAS faithfulness trend dips because the corpus contains almost no severance documents, so the model fills the gap with unsupported text.",
      decision:
        "Let the new-cluster and rolling-faithfulness alerts fire, add the missing severance-policy documents to the corpus, verify the fix on the golden eval set for that topic cluster, then deploy and watch the cluster's thumbs-down rate recover.",
    },
    productionChecklist: [
      "Compute weekly query-embedding centroids and alert on cosine-distance spikes.",
      "Run a topic model over new queries and alert on new clusters.",
      "Trend RAGAS faithfulness and relevance on a rolling window with threshold alerts.",
      "Store drift metrics in a time-series database and break dashboards down by query category.",
      "Route confirmed drift into the corpus or prompt fix pipeline with golden-set validation.",
    ],
    commonMistakes: [
      "Monitoring only infrastructure metrics and missing query-distribution shift.",
      "Alerting on single-day quality dips instead of rolling-window trends.",
      "Putting an expensive judge synchronously on the request path to detect drift.",
      "Detecting a new topic cluster but never feeding it back into corpus or prompt fixes.",
    ],
    knowledgeChecks: [
      {
        id: "ch11-drift-detection-kc-1",
        prompt:
          "Thumbs-down rates creep up six weeks after launch with no deployment and no infrastructure alerts. Which monitoring addition targets the most likely explanation?",
        options: [
          "Deeper CPU and memory profiling on the serving nodes, because hidden resource pressure usually explains slow quality decay",
          "A stricter error-rate alert on 5xx responses, because user-perceived quality problems eventually surface as serving failures",
          "The three drift detectors: weekly query-embedding centroid cosine distance, topic-model new-cluster alerts on new queries, and RAGAS faithfulness and relevance trends",
        ],
        correct: 2,
        feedback:
          "Embedding drift, topic drift, and quality drift are the detectors for traffic and quality shifts that occur without any deployment; infrastructure and error metrics stay flat during such drift.",
      },
      {
        id: "ch11-drift-detection-kc-2",
        prompt:
          "In the worked example, company news drives a wave of severance-policy queries to an HR assistant and faithfulness dips. Which detector most directly pinpoints the cause, and which fix applies?",
        options: [
          "The contradiction detector pinpoints it, and the fix is to retrain the embedding model on severance terminology before re-indexing everything",
          "The topic model alerts on the new severance cluster, and the fix pipeline adds the missing severance-policy documents, then validates on the golden eval set for that cluster before deploying",
          "The latency percentile trend pinpoints it, and the fix is to add a metadata filter that blocks severance queries until traffic returns to baseline",
        ],
        correct: 1,
        feedback:
          "The topic-drift detector alerts on new query clusters, and the feedback-loop fix for retrieval gaps is adding missing documents for that content type, validated on the golden eval set before deploy.",
      },
      {
        id: "ch11-drift-detection-kc-3",
        prompt:
          "A team runs RAGAS faithfulness on every request synchronously and sees P99 latency double while dashboards lag behind. Which design failure does this illustrate, and what is the prescribed fix instead?",
        options: [
          "An expensive judge was placed on the request path; the prescribed design is sampled asynchronous scoring — for example every twentieth request — written to a time-series database with rolling-threshold alerts",
          "The judge model version drifted; the prescribed fix is pinning the judge model and re-running the entire week's traffic synchronously to rebuild the trend",
          "The time-series database was undersized; the prescribed fix is storing only raw responses and computing faithfulness offline once per quarter",
        ],
        correct: 0,
        feedback:
          "The stated differentiator is monitoring at scale without putting an expensive judge on the request path: async sampled scoring to a time-series database with threshold alerts.",
      },
      {
        id: "ch11-drift-detection-kc-4",
        prompt:
          "A reviewer argues that drift alerts should fire on any single-day dip in faithfulness to maximize sensitivity. How do you defend the rolling-window threshold design instead?",
        options: [
          "Concede and tighten the threshold to every hourly dip, because alert fatigue is preferable to missing a real decline by one day",
          "Remove alerting entirely and rely on quarterly trend reviews, since sampled faithfulness scores are too noisy for any automated threshold",
          "Defend the rolling window — the example alerts when the seven-day rolling mean faithfulness drops below a threshold — because it suppresses one-day noise while still catching a sustained decline before users notice",
        ],
        correct: 2,
        feedback:
          "The threshold example fires when the 7-day rolling mean faithfulness falls below 0.85; rolling windows trade single-day sensitivity for alert precision on sustained quality drift.",
      },
      {
        id: "ch11-drift-detection-kc-5",
        prompt:
          "Before relying on drift detection in production, which validation demonstrates the whole detect-to-fix loop works rather than just the detectors firing?",
        options: [
          "A load test proving the time-series database can ingest faithfulness scores at ten times current traffic without dropping writes",
          "A drill injecting a synthetic new topic cluster, confirming the cluster alert and rolling faithfulness alert fire, the dashboard shows the affected query category, and the corpus fix passes the golden eval set for that cluster before deploy",
          "A comparison showing this quarter's average faithfulness score matches last quarter's, proving the system has not drifted since launch",
        ],
        correct: 1,
        feedback:
          "The loop is detect, route into the fix pipeline, validate on the golden eval set, then deploy; an end-to-end drill with an injected shift proves the flywheel, not just metric ingestion.",
      },
    ],
  },
};

export const chapter11Practice: CatalogPracticeUnit[] = [
  {
    id: "ch11-11-2-1",
    chapter: 11,
    chapterTitle: "Observability & Monitoring",
    title: "What logs are critical in a RAG system?",
    pages: "78",
    route: "/practice/observability-and-monitoring/what-logs-are-critical-in-a-rag-system",
    competencies: ["tracing", "metrics", "drift", "debugging", "feedback loops"],
    question:
      "In a system design interview you are asked: \"If you could only log 5 things in a RAG system, what would they be and why?\" Which answer earns the strongest rating?",
    options: [
      {
        text: "Log every full prompt, completion, and raw retrieved document for all requests so nothing is ever missing, and defer prioritization until storage cost forces it.",
        correct: false,
        feedback:
          "Logging everything avoids the actual question. The interview tests whether you can justify a few highest-value signals by the decisions they enable, not whether you can keep everything.",
      },
      {
        text: "Log average daily latency, total request count, uptime, CPU utilization, and the model name, because infrastructure health determines answer quality.",
        correct: false,
        feedback:
          "This is the generic-logs answer the interview rubric warns about: none of these signals can diagnose a retrieval failure, a hallucination trend, or a cost overrun.",
      },
      {
        text: "Retrieved document IDs with scores, an async faithfulness score, end-to-end P50/P95/P99 latency, LLM token usage, and a user feedback signal — each justified by the decision it enables: diagnosing retrieval, catching hallucination trends early, seeing tail-latency regressions, keeping cost visible, and getting quality ground truth.",
        correct: true,
        feedback:
          "Correct. This matches the five priority signals and, more importantly, the senior-answer signal: each log is prioritized by diagnostic and cost value rather than listed generically.",
      },
    ],
  },
  {
    id: "ch11-11-2-2",
    chapter: 11,
    chapterTitle: "Observability & Monitoring",
    title: "How do you debug bad answers?",
    pages: "79",
    route: "/practice/observability-and-monitoring/how-do-you-debug-bad-answers",
    competencies: ["tracing", "metrics", "drift", "debugging", "feedback loops"],
    question:
      "A user reports that your RAG system gave a completely wrong answer. In the interview you are asked: \"Walk me through your debugging process.\" Which process demonstrates senior-level ownership?",
    options: [
      {
        text: "Pull the full trace for that request ID, then walk the ladder: check retrieved doc IDs and similarity scores (low scores point to chunking, embedding, or query rewriting; high scores on irrelevant docs point to semantic mismatch and metadata filters), check whether the answer was in the retrieved context, check prompt assembly for truncation, compare against the prior model version — then write a reproducing unit test and add it to the regression suite.",
        correct: true,
        feedback:
          "Correct. This is the debugging ladder: trace first, branch on similarity-score evidence through retrieval, context, prompt, and model, and end by converting the failure into a regression test.",
      },
      {
        text: "Swap in a more capable model and re-prompt, since a completely wrong answer usually indicates a model-capability limit; then watch whether the next few answers improve.",
        correct: false,
        feedback:
          "This skips the trace entirely and guesses at the model layer first. The debugging process attributes the failure stage by stage before changing anything.",
      },
      {
        text: "Read the final output carefully, adjust the system prompt wording until the reported example looks correct, and ship the fix.",
        correct: false,
        feedback:
          "This is the junior pattern the interview rubric calls out — looking at the output and tuning by one example, with no trace evidence and no regression test to prevent recurrence.",
      },
    ],
  },
  {
    id: "ch11-11-2-3",
    chapter: 11,
    chapterTitle: "Observability & Monitoring",
    title: "How do you monitor hallucination in production?",
    pages: "79",
    route: "/practice/observability-and-monitoring/how-do-you-monitor-hallucination-in-production",
    competencies: ["tracing", "metrics", "drift", "debugging", "feedback loops"],
    question:
      "An interviewer asks: \"How do you continuously monitor hallucination rates at scale in production?\" Which design is strongest?",
    options: [
      {
        text: "Run a full RAGAS faithfulness evaluation synchronously on every request before returning the answer, so no hallucinated response can ever reach a user.",
        correct: false,
        feedback:
          "Putting an expensive judge on the request path is exactly what the scalable design avoids; synchronous per-request scoring does not scale and punishes latency on every call.",
      },
      {
        text: "Score a sample asynchronously — RAGAS faithfulness on every 20th request into a time-series DB with a rolling-threshold alert — plus a fast hedging-language detector flagging responses for human review, citation verification on a random 1% sample reported as citation accuracy, an NLI contradiction check for high-stakes domains, and a Grafana dashboard trending faithfulness, hallucination rate by query category, and feedback correlation.",
        correct: true,
        feedback:
          "Correct. This is the scalable design: sampled async scoring, threshold alerts, cheap detectors, citation sampling, and dashboards — continuous monitoring without a judge on the request path.",
      },
      {
        text: "Rely on user reports plus a weekly manual spot check of random answers, since automated judges are too unreliable to trust for a metric as subtle as hallucination.",
        correct: false,
        feedback:
          "Manual review alone is the junior answer; it detects trends weeks late and produces no time series, alerts, or per-category breakdown.",
      },
    ],
  },
  {
    id: "ch11-11-2-4",
    chapter: 11,
    chapterTitle: "Observability & Monitoring",
    title: "How do you implement user feedback loops?",
    pages: "80",
    route: "/practice/observability-and-monitoring/how-do-you-implement-user-feedback-loops",
    competencies: ["tracing", "metrics", "drift", "debugging", "feedback loops"],
    question:
      "In an interview you are asked: \"Design a closed-loop system where user feedback continuously improves RAG quality.\" What does the strongest answer include?",
    options: [
      {
        text: "Add a thumbs up/down widget after each response and review the average rating in a quarterly business review, since collecting any feedback constitutes a closed loop.",
        correct: false,
        feedback:
          "A rating widget without analysis, root-cause attribution, and validated fixes is the junior answer the interview rubric names explicitly — the loop never closes.",
      },
      {
        text: "Automatically fine-tune the model on every thumbs-down interaction each night, so the system self-corrects without slow human analysis in the loop.",
        correct: false,
        feedback:
          "This skips root-cause categorization and golden-set validation; the flywheel fixes retrieval, generation, or prompts based on diagnosed cause and validates before deploy.",
      },
      {
        text: "Close the flywheel: collect explicit signals (thumbs up/down plus optional free-text on downvotes) and implicit ones (follow-up questions signaling incomplete answers); weekly, cluster low-rated queries by topic, compute topic-level downvote rates, and review traces of the worst clusters to categorize root cause as retrieval, generation, or prompt; fix accordingly — add missing documents or improve chunking, update prompts with few-shot examples, or add thumbs-up responses to fine-tuning data — then validate the fix on the golden eval set for that topic cluster before deploying and repeating.",
        correct: true,
        feedback:
          "Correct. This is the feedback flywheel end to end: explicit and implicit collection, topic clustering, trace-based root-cause attribution, targeted fixes, and golden-set validation before deploy.",
      },
    ],
  },
];
