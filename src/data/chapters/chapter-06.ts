import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter06Module: LearningModule = {
  id: "chapter-6-performance-and-scaling",
  title: "Performance & Scaling",
  description:
    "An accurate system still fails if it is too slow or too expensive. Learn to decompose latency, choose an indexing strategy, control embedding cost, place caches, and preserve answer quality while meeting throughput and cost targets.",
  duration: "3 lessons",
  lessons: [
    {
      id: "ch6-approximate-nearest-neighbor",
      title: "Approximate Nearest Neighbor (ANN)",
      prompt: "Trade a little recall for massive speed",
      question:
        "A retrieval service holds 40 million vectors and must answer interactive queries in single-digit milliseconds. Exact search scans every vector per query. What is the right retrieval posture?",
      options: [
        "Keep exact search but buy faster CPUs until the latency target is met",
        "Use an approximate index that accepts a small recall loss for orders-of-magnitude speed",
        "Pre-compute answers offline so no nearest-neighbor search runs at query time",
      ],
      correct: 1,
      feedback:
        "Strong choice. ANN exists precisely because exact nearest neighbor is O(n) per query over n vectors; a small accuracy loss buys massive speed at production scale.",
      explanation:
        "Exact nearest neighbor search compares the query against all n vectors, so cost grows linearly with the corpus. Approximate nearest neighbor indexes trade a small, measurable recall loss for massive speed gains. A flat index stays the recall reference (100%) but is too slow to serve at scale.",
      takeaways: [
        "Exact search is O(n) per query; it does not scale to large corpora.",
        "ANN trades bounded recall loss for large latency wins.",
        "Keep exact (flat) search as the recall baseline for measuring ANN quality.",
      ],
      model: ["Corpus too large for exact scan", "Approximate index", "Measure recall loss"],
      source: { chapter: 6, sections: ["6.1.1"], pages: "51" },
    },
    {
      id: "ch6-indexing-strategies-hnsw-ivf",
      title: "Indexing Strategies: HNSW and IVF",
      prompt: "Pick an index family for your latency and memory budget",
      question:
        "A production retrieval path needs low-latency queries with high recall, and the team can afford generous memory. Which index family is the best default, and how is it tuned?",
      options: [
        "IVF-PQ, because maximum compression is always the right production default",
        "A flat index, because 100% recall removes the need to tune anything",
        "HNSW, tuned with ef_construction for build quality and ef_search for the query-time quality/speed trade-off",
      ],
      correct: 2,
      feedback:
        "Strong choice. HNSW is a graph-based index and the reference choice for low-latency production retrieval; ef_construction and ef_search are its two tuning dials.",
      explanation:
        "The index families sit on a build/query/recall/memory frontier: flat is instant to build with 100% recall but O(n) queries; IVF builds fast with 95-99% recall; HNSW builds slowly but queries fast at 97-99% recall with high memory; IVF-PQ is very fast and very low memory at 90-96% recall. HNSW is preferred for low-latency production retrieval, tuned via ef_construction and ef_search.",
      takeaways: [
        "Index choice is a four-way trade: build speed, query speed, recall, memory.",
        "HNSW fits low-latency production retrieval when memory is affordable.",
        "IVF-PQ fits memory-constrained scale at the cost of lower recall.",
      ],
      model: ["Budget memory and recall", "Choose index family", "Tune ef dials"],
      source: { chapter: 6, sections: ["6.1.2"], pages: "51" },
    },
    {
      id: "ch6-gpu-vs-cpu-tradeoffs",
      title: "GPU vs CPU Trade-offs",
      prompt: "Match the accelerator to corpus size and SLA",
      question:
        "One team serves 3 million vectors under a tight latency SLA; another team must search 50 million vectors in batch. Which hardware allocation follows the cost-performance reality?",
      options: [
        "CPU HNSW for the 3M-vector SLA service; GPU FAISS for the 50M-vector batch workload",
        "GPU FAISS for both, because GPUs are always faster for vector search",
        "CPU HNSW for both, because GPU cost is never justified for ANN",
      ],
      correct: 0,
      feedback:
        "Strong choice. CPU HNSW is preferred below roughly 5M vectors with tight latency SLAs, while GPU FAISS earns its cost at large scale above roughly 10M vectors.",
      explanation:
        "GPU FAISS delivers 10-100x speedup for large-scale ANN over 10M vectors but costs more to operate. Below about 5M vectors with tight latency SLAs, CPU HNSW is the preferred, cheaper option. The decision boundary is corpus size plus SLA, not a blanket preference for either accelerator.",
      takeaways: [
        "GPU FAISS pays off above ~10M vectors with 10-100x speedup.",
        "CPU HNSW is preferred under ~5M vectors with tight latency SLAs.",
        "Weigh accelerator cost against the corpus size and the actual SLA.",
      ],
      model: ["Corpus size", "Latency SLA", "CPU or GPU"],
      source: { chapter: 6, sections: ["6.1.3"], pages: "51" },
    },
  ],
};

export const chapter06CourseContent: Record<string, LessonCourseContent> = {
  "ch6-approximate-nearest-neighbor": {
    objectives: [
      "Explain why exact nearest neighbor search fails at production scale.",
      "State the recall-versus-speed exchange that ANN indexes make.",
      "Use a flat index as the recall baseline for evaluating approximate results.",
    ],
    sections: [
      {
        heading: "Why exact search does not scale",
        paragraphs: [
          "Exact nearest neighbor search compares the query vector against every one of the n indexed vectors, so each query costs O(n) distance computations. At small corpus sizes this is fine, and it defines perfect recall: the true neighbors are always returned.",
          "At millions or billions of vectors the linear scan becomes the dominant latency and cost term in the whole request path. No amount of prompt optimization can compensate for a retrieval stage that scans the full corpus per query, so scale forces a structural change rather than a tuning change.",
        ],
      },
      {
        heading: "The ANN exchange",
        paragraphs: [
          "Approximate nearest neighbor search trades a small accuracy loss for massive speed gains. Instead of guaranteeing the true top-k, an ANN index organizes vectors so the search visits only a promising fraction of the corpus and returns neighbors that are almost always as good as the exact answer.",
          "The operative word is measurable. The recall loss is not a vague risk; it is a number you compute by comparing ANN results against exact results on your own corpus and query distribution, then budget like any other quality target.",
        ],
      },
      {
        heading: "Keeping a recall baseline",
        paragraphs: [
          "A flat index builds instantly and delivers 100% recall with slow O(n) queries. That combination makes it useless as a large-scale serving index but invaluable as a reference: run flat search on a sampled query set to establish what perfect recall looks like.",
          "Every approximate configuration is then scored against that baseline as Recall@K. Without the baseline, teams tune index parameters by watching latency alone and silently ship recall regressions that look like embedding or generation problems downstream.",
        ],
      },
      {
        heading: "Where the loss shows up",
        paragraphs: [
          "The recall an ANN index loses concentrates in borderline neighbors: documents whose true rank sits near the k boundary. Whether that matters depends on the consumer. A re-ranker or a generator that only needs a few solid documents can tolerate small candidate-set imperfections; a compliance lookup that needs one exact passage cannot.",
          "A practical pattern from large-scale deployments is two-stage search: let the cheap ANN pass over-retrieve candidates, then spend exact computation only on that shortlist. This recovers most of the accuracy of exact search at a fraction of its cost.",
        ],
      },
    ],
    example: {
      title: "Worked example: support search over 40M chunks",
      scenario:
        "A support product embeds 40 million knowledge chunks. Interactive autocomplete-style search needs results in milliseconds, while the final answer pass can tolerate a slightly larger budget.",
      analysis:
        "Exact search at O(n) per query cannot meet the interactive budget, so the autocomplete path needs an ANN index. The recall loss is quantified by sampling queries and comparing against flat search, and the answer pass can re-score the ANN shortlist exactly because it is small.",
      decision:
        "Serve interactive queries from an ANN index, keep a flat index on a corpus sample as the recall baseline, and exact-rescore the top candidates before generation.",
    },
    productionChecklist: [
      "Estimate per-query cost of exact search before choosing ANN parameters.",
      "Keep a flat-index baseline on a sampled query set to compute Recall@K.",
      "Over-retrieve candidates and exact-rescore the shortlist when quality matters.",
      "Track recall and latency together for every index configuration change.",
      "Re-measure ANN recall after corpus growth, since query cost and recall drift with n.",
    ],
    commonMistakes: [
      "Serving exact search at scale and blaming the LLM for latency.",
      "Adopting ANN without an exact baseline, so recall loss is invisible.",
      "Tuning only for latency and shipping an unmeasured recall regression.",
      "Assuming ANN recall loss is uniform across queries instead of concentrated near the rank boundary.",
    ],
    knowledgeChecks: [
      {
        id: "ch6-approximate-nearest-neighbor-kc-1",
        prompt:
          "An interactive search feature runs over 25 million vectors, and exact nearest neighbor scanning blows the latency budget on every query. What retrieval posture should the team adopt for the serving path?",
        options: [
          "Keep exact search and add faster CPUs until the latency budget is met",
          "Pre-compute answers for all possible queries so no search runs online",
          "Serve from an approximate index that accepts a small, measured recall loss for massive speed",
        ],
        correct: 2,
        feedback:
          "Exact nearest neighbor is O(n) per query over n vectors, so scale forces the structural ANN exchange: a small accuracy loss for massive speed gains.",
      },
      {
        id: "ch6-approximate-nearest-neighbor-kc-2",
        prompt:
          "A support search product embeds 40 million knowledge chunks: its interactive autocomplete-style path needs results in milliseconds, while the final answer pass tolerates a slightly larger budget. Which design serves both paths well?",
        options: [
          "Serve interactive queries from an ANN index, keep flat search on a sample as the recall baseline, and exact-rescore the shortlist before generation",
          "Serve both paths with one exact index so recall is identical everywhere",
          "Serve both paths from the same ANN index with no re-scoring to save cost",
        ],
        correct: 0,
        feedback:
          "Split the budget by path: ANN for the interactive path, a flat-index sample for measuring Recall@K, and exact re-scoring of the small shortlist, mirroring the two-stage pattern described in this chapter.",
      },
      {
        id: "ch6-approximate-nearest-neighbor-kc-3",
        prompt:
          "After migrating to an ANN index, users report occasionally missing documents that exact search used to find, and the team only ever watched p95 latency during tuning. What is the most likely diagnosis?",
        options: [
          "The embedding model regressed during the migration and must be retrained",
          "The team tuned without a flat-index baseline, so the ANN recall loss was never measured",
          "ANN indexes are fundamentally unreliable and should never serve production traffic",
        ],
        correct: 1,
        feedback:
          "Without an exact (flat) baseline there is no Recall@K number, so the recall regression is invisible; the fix is measuring the loss, not abandoning ANN.",
      },
      {
        id: "ch6-approximate-nearest-neighbor-kc-4",
        prompt:
          "A colleague argues that any recall loss is unacceptable and the service must keep exact nearest neighbor search. How do you defend shipping an ANN index for the interactive path instead?",
        options: [
          "ANN recall loss is a myth; in practice approximate results are always identical to exact",
          "Exact search is cheaper to operate at scale because it needs no index maintenance",
          "Exact search is O(n) and cannot meet the SLA, while ANN's small bounded recall loss buys massive speed and a re-scoring pass over the shortlist recovers quality",
        ],
        correct: 2,
        feedback:
          "The defense is the explicit recall-speed exchange plus the two-stage pattern: over-retrieve cheaply with ANN, then exact-rescore the top candidates for full quality.",
      },
      {
        id: "ch6-approximate-nearest-neighbor-kc-5",
        prompt:
          "You are preparing the ANN rollout review. Which measurement plan actually validates that the approximate index is safe to ship and safe to keep tuning later?",
        options: [
          "Compare ANN results against flat search on a sampled query set for Recall@K, and track recall and latency together on every configuration change",
          "Watch only p99 latency during the canary, since recall is an embedding-model property",
          "Run the new index for a week and rely on user complaints to surface any recall problem",
        ],
        correct: 0,
        feedback:
          "The production checklist requires a flat-index baseline for Recall@K and joint recall-plus-latency tracking per change; latency-only reviews ship silent recall regressions.",
      },
    ],
  },
  "ch6-indexing-strategies-hnsw-ivf": {
    objectives: [
      "Compare flat, IVF, HNSW, and IVF-PQ on build speed, query speed, recall, and memory.",
      "Explain HNSW's graph structure and its ef_construction and ef_search dials.",
      "Select an index family from a latency, recall, and memory budget.",
    ],
    sections: [
      {
        heading: "The index frontier",
        paragraphs: [
          "The four common strategies occupy distinct points on a four-axis trade-off. Flat builds instantly, queries slowly at O(n), holds 100% recall, and uses low memory. IVF builds fast, queries at medium speed, holds 95-99% recall, and uses medium memory. HNSW builds slowly, queries fast, holds 97-99% recall, and uses high memory. IVF-PQ builds at medium speed, queries very fast, holds 90-96% recall, and uses very low memory.",
          "There is no universally best row in that table. The right choice is the one whose weak axis you can afford: HNSW's memory, IVF-PQ's recall, IVF's query speed, or flat's query cost. Stating which axis you are spending is the core of a senior indexing answer.",
        ],
      },
      {
        heading: "HNSW as the low-latency default",
        paragraphs: [
          "HNSW is a graph-based index: vectors are nodes in a layered navigable graph, and search walks the graph toward the query instead of scanning the corpus. It is the reference choice for low-latency production retrieval because query speed and recall are both strong, at the price of slow builds and high memory.",
          "Its two tuning dials separate build-time from query-time investment. ef_construction controls build quality: higher values produce a better graph at slower build speed. ef_search controls the query-time quality/speed trade-off: higher values explore more candidates for better recall at higher latency.",
        ],
      },
      {
        heading: "IVF and IVF-PQ for scale",
        paragraphs: [
          "IVF partitions the vector space so a query only scans the nearest partitions rather than the full corpus, giving fast builds and medium query speed at slightly lower recall than HNSW. It fits workloads where build time and memory matter more than the last few recall points.",
          "IVF-PQ adds product quantization to compress the stored vectors, driving memory to very low levels and query speed to very fast, but recall drops to roughly 90-96%. It is the family to reach for when the corpus is too large to hold uncompressed, accepting the recall cost explicitly.",
        ],
      },
      {
        heading: "Choosing and validating",
        paragraphs: [
          "Start from the budget: what memory can you allocate, what recall does the downstream stage require, and what is the query latency SLA? Map those constraints onto the table's axes, then shortlist one or two families instead of benchmark-shopping across all of them.",
          "Validate the choice on your own dimensionality, corpus size, and hardware. The published recall and speed profiles move substantially with those factors, so an index family chosen from a generic benchmark without local measurement is a guess, not a design.",
        ],
      },
    ],
    example: {
      title: "Worked example: two retrieval services, one platform",
      scenario:
        "A platform team supports a latency-critical product search over 8 million vectors and an analytics archive over 300 million vectors that is queried in bursts.",
      analysis:
        "The product search has a tight latency SLA and affordable memory at 8M vectors, which points to HNSW tuned with ef_search. The archive's 300M vectors make uncompressed storage the binding constraint, which points to IVF-PQ with its very low memory footprint despite 90-96% recall.",
      decision:
        "Run HNSW for the product path and IVF-PQ for the archive, documenting which axis of the trade-off table each service is spending.",
    },
    productionChecklist: [
      "State the memory, recall, and latency budget before picking an index family.",
      "Separate ef_construction (build quality) from ef_search (query quality/speed) when tuning HNSW.",
      "Plan for HNSW's slow builds and high memory in capacity and release schedules.",
      "Benchmark candidate families on your own vectors, corpus size, and hardware.",
      "Record which trade-off axis each service spends so future reviews can revisit it.",
    ],
    commonMistakes: [
      "Defaulting to IVF-PQ for compression and accepting its recall loss without checking downstream needs.",
      "Using a flat index in production for its 100% recall and eating O(n) query cost.",
      "Tuning ef_construction when the real problem is query-time ef_search, or vice versa.",
      "Copying index benchmark conclusions from different dimensionality or corpus size.",
    ],
    knowledgeChecks: [
      {
        id: "ch6-indexing-strategies-hnsw-ivf-kc-1",
        prompt:
          "A latency-critical retrieval service must answer in single-digit milliseconds, recall must stay high, and the capacity plan can afford generous memory. Which index family is the right default and why?",
        options: [
          "A flat index, because 100% recall is always worth its query cost",
          "HNSW, because its graph-based search gives fast queries at 97-99% recall when high memory is affordable",
          "IVF-PQ, because very low memory is the top priority for every production index",
        ],
        correct: 1,
        feedback:
          "HNSW is a graph-based index and the reference choice for low-latency production retrieval; its cost is slow builds and high memory, which this budget can pay.",
      },
      {
        id: "ch6-indexing-strategies-hnsw-ivf-kc-2",
        prompt:
          "One platform team supports a latency-critical product search over 8 million vectors and a bursty analytics archive over 300 million vectors. Which index pairing follows the index frontier?",
        options: [
          "Flat indexes for both, keeping recall at 100% on every service",
          "HNSW for both, because low latency is always the dominant requirement",
          "HNSW for the 8M product path and IVF-PQ for the 300M archive whose binding constraint is memory",
        ],
        correct: 2,
        feedback:
          "Spend different axes per service: HNSW where the latency SLA dominates, IVF-PQ where 300M vectors make very low memory worth the 90-96% recall.",
      },
      {
        id: "ch6-indexing-strategies-hnsw-ivf-kc-3",
        prompt:
          "A team responds to query-time recall complaints by raising ef_construction, and after painfully slow rebuilds the query latency and recall barely change. What went wrong in their tuning?",
        options: [
          "They turned the wrong dial: ef_construction controls build quality, while ef_search controls the query-time quality/speed trade-off",
          "HNSW cannot improve recall at all, so the complaints were impossible to address",
          "Their corpus was too small for ef parameters to have any effect",
        ],
        correct: 0,
        feedback:
          "The two HNSW dials are separate: ef_construction buys a better graph at slower build speed, ef_search buys query-time recall at higher latency; confusing them wastes build time.",
      },
      {
        id: "ch6-indexing-strategies-hnsw-ivf-kc-4",
        prompt:
          "A reviewer challenges your IVF-PQ choice for the 300M-vector archive because its 90-96% recall is the lowest in the comparison table. How do you defend the decision in the design review?",
        options: [
          "IVF-PQ secretly matches HNSW recall, so the table understates it",
          "Recall does not matter for an analytics archive, only speed does",
          "Uncompressed storage is the binding constraint at this scale; IVF-PQ's very low memory and very fast queries are worth a recall cost we state and accept explicitly",
        ],
        correct: 2,
        feedback:
          "The senior indexing answer names which axis you are spending; IVF-PQ trades 90-96% recall for very low memory and very fast queries, an explicit exchange from the comparison table.",
      },
      {
        id: "ch6-indexing-strategies-hnsw-ivf-kc-5",
        prompt:
          "Before committing an index family and its ef parameters to a latency SLA, what validation step does the material insist on rather than trusting published comparison numbers?",
        options: [
          "Adopt the published table directly, since index behavior is hardware-independent",
          "Benchmark candidate families on your own dimensionality, corpus size, and hardware before committing",
          "Pick the family with the best published recall and skip local benchmarking to save time",
        ],
        correct: 1,
        feedback:
          "Benchmark figures move substantially with dimensionality, corpus size, hardware, and graph parameters, so this chapter's watch-out demands benchmarking on your own setup before an SLA.",
      },
    ],
  },
  "ch6-gpu-vs-cpu-tradeoffs": {
    objectives: [
      "Explain when GPU FAISS earns its cost for ANN workloads.",
      "Explain when CPU HNSW is the better economic and latency choice.",
      "Frame hardware selection as a corpus-size plus SLA decision.",
    ],
    sections: [
      {
        heading: "What the GPU buys",
        paragraphs: [
          "GPU FAISS delivers 10-100x speedup for large-scale ANN, and that speedup materializes when the workload is big enough to saturate the accelerator: on the order of 10 million vectors and above. At that scale, distance computations parallelize across thousands of GPU cores and the per-query economics flip in the GPU's favor.",
          "The cost side is real. GPU instances cost more to operate than CPU instances, so the speedup only matters if the workload can keep the GPU busy. A small corpus queried at modest rates leaves an expensive accelerator idle.",
        ],
      },
      {
        heading: "Where the CPU wins",
        paragraphs: [
          "CPU HNSW is the preferred option below roughly 5 million vectors when the service has a tight latency SLA. HNSW's graph walk is already fast at that scale, and a CPU deployment is cheaper, simpler to operate, and easier to co-locate with the rest of the serving stack.",
          "The SLA framing matters: if the CPU already meets the latency target with headroom, the GPU's additional speed has no user-visible value. Spending more for latency the product cannot perceive is a pure cost regression.",
        ],
      },
      {
        heading: "The decision boundary",
        paragraphs: [
          "Between the clear regions sits a gray zone, and the honest answer there is measurement. Corpus size sets the potential parallelism; the query rate and latency SLA determine whether that parallelism converts into value. A 7M-vector corpus with bursty traffic may favor CPU; the same corpus under sustained high QPS may justify GPU.",
          "Treat the ~5M and ~10M vector figures as guideposts from the cost-performance analysis, not physical constants. Dimensionality, index type, and concurrency all shift the crossover, so the boundary belongs in your capacity plan with your own benchmarks behind it.",
        ],
      },
      {
        heading: "Operational consequences",
        paragraphs: [
          "Hardware choice propagates into operations. GPU serving pulls in accelerator provisioning, driver and library compatibility, and utilization monitoring; CPU serving fits standard fleets and autoscaling policies. The cheaper-to-run option is only cheaper if the team can actually operate it well.",
          "Plan for the corpus to grow. A service launched at 3M vectors on CPU HNSW should know at what corpus size or QPS it will re-evaluate GPU FAISS, so the migration is a planned event rather than an emergency during an SLA breach.",
        ],
      },
    ],
    example: {
      title: "Worked example: one team, two workloads",
      scenario:
        "A retrieval platform serves an interactive product at 3M vectors with a strict latency SLA, and a nightly research batch that re-ranks candidates across 50M vectors.",
      analysis:
        "The interactive workload sits under the ~5M guidepost with a tight SLA, so CPU HNSW meets the target at lower cost. The batch workload sits well above the ~10M guidepost, where GPU FAISS's 10-100x speedup compresses hours of compute and justifies the accelerator cost.",
      decision:
        "Keep the interactive service on CPU HNSW, run the batch workload on GPU FAISS, and set corpus-size and QPS thresholds that trigger re-evaluation.",
    },
    productionChecklist: [
      "Record corpus size, dimensionality, QPS, and latency SLA before choosing hardware.",
      "Use CPU HNSW below ~5M vectors with tight latency SLAs.",
      "Reserve GPU FAISS for large-scale ANN above ~10M vectors where 10-100x speedup applies.",
      "Monitor GPU utilization to confirm the accelerator cost is earning its speedup.",
      "Define the corpus or traffic threshold that triggers a hardware re-evaluation.",
    ],
    commonMistakes: [
      "Putting every ANN workload on GPUs because GPUs are faster in the abstract.",
      "Refusing GPUs at 50M+ vector scale and missing the 10-100x batch speedup.",
      "Quoting the 5M/10M guideposts as exact constants without local benchmarks.",
      "Ignoring utilization, so an expensive GPU sits mostly idle on a small corpus.",
    ],
    knowledgeChecks: [
      {
        id: "ch6-gpu-vs-cpu-tradeoffs-kc-1",
        prompt:
          "An interactive retrieval service holds 3 million vectors under a tight latency SLA with modest query traffic. Which hardware choice fits the cost-performance guidance, and what makes it right?",
        options: [
          "CPU HNSW, because below roughly 5M vectors with tight latency SLAs it meets the target at lower cost and simpler operations",
          "GPU FAISS, because GPUs are always the fastest option for any ANN workload",
          "GPU FAISS, because 3 million vectors already saturate a modern accelerator",
        ],
        correct: 0,
        feedback:
          "CPU HNSW is the preferred option below about 5M vectors with tight latency SLAs; the GPU's extra speed has no user-visible value once the SLA is met.",
      },
      {
        id: "ch6-gpu-vs-cpu-tradeoffs-kc-2",
        prompt:
          "A retrieval platform serves a small interactive product at 3 million vectors under a strict SLA, plus a nightly research batch that re-ranks candidates across 50 million vectors. Which hardware allocation is right?",
        options: [
          "CPU HNSW for both workloads to keep the fleet uniform",
          "GPU FAISS for the 50M-vector batch, where 10-100x speedup earns the accelerator cost, and CPU HNSW for the small interactive service",
          "GPU FAISS for both workloads so the team manages one serving stack",
        ],
        correct: 1,
        feedback:
          "GPU FAISS delivers 10-100x speedup for large-scale ANN above roughly 10M vectors, which is exactly the 50M batch; the small interactive service stays cheaper on CPU HNSW.",
      },
      {
        id: "ch6-gpu-vs-cpu-tradeoffs-kc-3",
        prompt:
          "A team moved its 2-million-vector, modest-QPS search service onto GPU instances and now faces a large accelerator bill with persistently low utilization. What is the correct diagnosis of this situation?",
        options: [
          "The GPU drivers are misconfigured and simply need an update",
          "The service needs a larger batch size to make the GPU bill acceptable",
          "The workload is too small to saturate the accelerator, so the GPU's speedup never converted into user or cost value",
        ],
        correct: 2,
        feedback:
          "GPU speedup materializes only when the workload is big enough to keep the accelerator busy; at ~2M vectors with modest QPS the expensive GPU sits mostly idle.",
      },
      {
        id: "ch6-gpu-vs-cpu-tradeoffs-kc-4",
        prompt:
          "A stakeholder insists the interactive 3-million-vector service should move to GPUs because GPUs are faster in benchmarks. How do you defend staying on CPU HNSW in the capacity review?",
        options: [
          "The CPU already meets the latency SLA with headroom, so extra GPU speed is invisible to users and is a pure cost regression",
          "CPUs are technically faster than GPUs for all graph-based indexes",
          "GPU FAISS cannot run HNSW-style workloads under any circumstances",
        ],
        correct: 0,
        feedback:
          "The decision boundary is corpus size plus SLA, not abstract speed: spending more for latency the product cannot perceive is a pure cost regression.",
      },
      {
        id: "ch6-gpu-vs-cpu-tradeoffs-kc-5",
        prompt:
          "Your capacity plan launches the service at 3 million vectors on CPU HNSW. What does the material require you to define now so the future hardware decision is planned rather than reactive?",
        options: [
          "A fixed date to migrate to GPUs regardless of how the workload evolves",
          "The corpus-size or QPS threshold that triggers re-evaluation of GPU FAISS, backed by local benchmarks since the 5M/10M figures are guideposts",
          "Nothing; hardware choices should be revisited only after an SLA breach",
        ],
        correct: 1,
        feedback:
          "The checklist sets explicit re-evaluation thresholds and treats the ~5M/~10M figures as guideposts to confirm with your own benchmarks, so migration is planned, not an emergency.",
      },
    ],
  },
};

export const chapter06Practice: CatalogPracticeUnit[] = [
  {
    id: "ch6-6-2-1",
    chapter: 6,
    chapterTitle: "Performance & Scaling",
    title: "How do you scale vector search to billions of documents?",
    pages: "52",
    route: "/practice/performance-and-scaling/how-do-you-scale-vector-search-to-billions-of-documents",
    competencies: ["ANN", "HNSW/IVF", "sharding", "quantization", "TTFT", "embedding cost"],
    question:
      "Your vector database needs to handle 2 billion embeddings. Walk me through the architecture you would design for it.",
    options: [
      {
        text: "Shard randomly and broadcast every query to all shards, then merge results; it is the simplest scheme and simplicity wins at scale.",
        correct: false,
        feedback:
          "Random sharding is simple but every query fans out to all n shards with no search-space reduction; it ignores the memory wall and the cluster-based routing and quantization the staff answer is built on.",
      },
      {
        text: "Start from the memory wall (~400GB+ for 2B 1536-dim FP16 vectors on one node), use cluster-based sharding to cut the search space, quantize (SQ8 or IVF-PQ) with explicit recall costs, run two-stage search with exact re-scoring, and operate a 10-20 node distributed cluster with replicas.",
        correct: true,
        feedback:
          "This matches the staff-level answer: quantify the memory wall, route queries only to nearest clusters, state quantization recall trade-offs, and add an exact re-scoring pass over a distributed, replicated cluster.",
      },
      {
        text: "Scale a single node vertically with maximum RAM and a GPU; one big HNSW index avoids the complexity of distributed routing and merging.",
        correct: false,
        feedback:
          "Single-node HNSW is infeasible at 2B vectors: the memory wall is hundreds of GB for 1536-dim FP16 alone, and one node also removes fault tolerance; the staff answer is distributed by construction.",
      },
    ],
  },
  {
    id: "ch6-6-2-2",
    chapter: 6,
    chapterTitle: "Performance & Scaling",
    title: "How do you optimize TTFT (time to first token)?",
    pages: "52",
    route: "/practice/performance-and-scaling/how-do-you-optimize-ttft-time-to-first-token",
    competencies: ["ANN", "HNSW/IVF", "sharding", "quantization", "TTFT", "embedding cost"],
    question:
      "What specific techniques reduce Time To First Token in a RAG+LLM pipeline, and why do they work?",
    options: [
      {
        text: "Decompose TTFT into prefill plus retrieval, then attack each: prefix caching for the static system prompt, prompt compression, chunked prefill, parallel retrieval with prompt assembly, streaming from the first token, and a small-model fast path for short answers.",
        correct: true,
        feedback:
          "This is the senior answer: TTFT is dominated by prefill computation plus retrieval, so each named technique targets a real contributor rather than treating TTFT as one opaque number.",
      },
      {
        text: "Upgrade to a faster GPU and a generally faster model; TTFT is a hardware-speed problem, so making the model faster is the direct fix.",
        correct: false,
        feedback:
          "'Make the model faster' is the junior answer: it never decomposes TTFT into prefill plus retrieval, so it misses prefix caching, prompt compression, and parallel retrieval that cut the actual contributors.",
      },
      {
        text: "Increase the decode batch size and wait for the full response before streaming anything, since throughput improvements are what users perceive as speed.",
        correct: false,
        feedback:
          "TTFT is about time until the first token reaches the client; holding back streaming and tuning decode throughput does nothing for prefill and retrieval, which dominate TTFT.",
      },
    ],
  },
  {
    id: "ch6-6-2-3",
    chapter: 6,
    chapterTitle: "Performance & Scaling",
    title: "What are the trade-offs between accuracy and latency in vector search?",
    pages: "53",
    route: "/practice/performance-and-scaling/what-are-the-trade-offs-between-accuracy-and-latency-in-vector-search",
    competencies: ["ANN", "HNSW/IVF", "sharding", "quantization", "TTFT", "embedding cost"],
    question:
      "Explain the accuracy versus latency trade-off in HNSW. Which parameters do you tune, and how would you set them for production?",
    options: [
      {
        text: "Quote the standard numbers: ef_search 16 gives 92% recall at 0.5ms and ef_search 256 gives 99.8% at 8ms, so pick a row from that table for your SLA.",
        correct: false,
        feedback:
          "Those figures are representative benchmarks for one configuration (~1M vectors, ~768 dims, m=16, single-threaded); quoting them as fixed facts is exactly what the senior answer refuses to do.",
      },
      {
        text: "Set ef_search to the maximum your latency budget can possibly tolerate; since higher ef is always more accurate, maximum ef is always the production-correct value.",
        correct: false,
        feedback:
          "Blanket-maximizing ef ignores the actual recall/latency curve on your data and the fact that a re-ranker can compensate for a cheaper ef; the recommendation is to start at ef=64 and tune by A/B test.",
      },
      {
        text: "Name the three dials - ef_search for query-time quality/speed, ef_construction for build quality, m for connections per node (recall vs memory) - treat published numbers as configuration-dependent, benchmark on your own dimensionality, corpus size, and hardware, start near ef=64, and use a re-ranker to compensate for a cheaper ef.",
        correct: true,
        feedback:
          "This is the senior answer: it names all three HNSW dials with their costs, refuses to quote latency numbers as universal facts, benchmarks locally, and notes the re-ranker interaction.",
      },
    ],
  },
  {
    id: "ch6-6-2-4",
    chapter: 6,
    chapterTitle: "Performance & Scaling",
    title: "How do you reduce embedding cost?",
    pages: "54",
    route: "/practice/performance-and-scaling/how-do-you-reduce-embedding-cost",
    competencies: ["ANN", "HNSW/IVF", "sharding", "quantization", "TTFT", "embedding cost"],
    question:
      "Embedding 50 million documents at $0.0001 per 1K tokens is expensive. How do you reduce this cost?",
    options: [
      {
        text: "Switch to the cheapest embedding API tier available; unit price is the whole cost problem, so the lowest sticker price wins.",
        correct: false,
        feedback:
          "'Use a cheaper model' is the junior answer: it skips the amortization math, the 50% batch discount, deduplication, truncation, and tiering that often dominate unit price.",
      },
      {
        text: "Re-embed the entire corpus on every update cycle so the index is always fresh, and negotiate a volume discount to offset the repeated spend.",
        correct: false,
        feedback:
          "Re-embedding unchanged documents is pure waste; the senior answer deduplicates by content hash before embedding and skips unchanged documents on incremental updates.",
      },
      {
        text: "Rank the levers by leverage with quantified math: self-host BGE-large/E5-large on an A10G (~$1/hr, ~1M docs/hr, amortizes in days), use the Batch API's 50% discount for async jobs, drop to a smaller model at 5x lower cost with <5% recall difference, apply Matryoshka truncation to 256 dims for 6x cheaper storage and search, deduplicate before embedding, and tier the index so only hot documents are embedded.",
        correct: true,
        feedback:
          "This matches the senior answer: levers ranked by leverage, each quantified (self-host break-even, 50% batch discount, 5x cheaper small model, 6x Matryoshka savings), plus dedup and tiered indexing.",
      },
    ],
  },
  {
    id: "ch6-6-2-5",
    chapter: 6,
    chapterTitle: "Performance & Scaling",
    title: "When should you use caching vs recomputation?",
    pages: "54",
    route: "/practice/performance-and-scaling/when-should-you-use-caching-vs-recomputation",
    competencies: ["ANN", "HNSW/IVF", "sharding", "quantization", "TTFT", "embedding cost"],
    question:
      "When is it correct to cache and when should you recompute in a RAG system? Describe your invalidation strategy.",
    options: [
      {
        text: "Cache when the input is deterministic and stable, compute is expensive with a high hit rate, and staleness is acceptable; recompute for personalized context, updated knowledge bases, real-time data, and changed security context; invalidate with event-driven, TTL-based, or versioned strategies.",
        correct: true,
        feedback:
          "This is the senior answer: explicit cache-vs-recompute criteria plus an invalidation story (event-driven on document updates, TTL by change rate, version tags invalidated on reindex) so stale or permission-mismatched results never serve.",
      },
      {
        text: "Cache every expensive computation indefinitely; embeddings and LLM outputs are costly, so the highest possible hit rate is always correct.",
        correct: false,
        feedback:
          "'Cache expensive things' without invalidation is the junior answer: it serves stale embeddings after knowledge-base updates and can leak permission-mismatched results when a user's security context changes.",
      },
      {
        text: "Never cache embeddings or retrieval results, because any cache in a RAG system can go stale and correctness must come first.",
        correct: false,
        feedback:
          "Refusing to cache forfeits legitimate wins (system-prompt KV cache, popular-query semantic cache, stable document embeddings); the cache-vs-recompute criteria make staleness an explicit, managed trade-off, not a reason to avoid caching.",
      },
    ],
  },
];
