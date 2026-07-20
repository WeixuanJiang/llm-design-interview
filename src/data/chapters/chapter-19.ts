import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter19Module: LearningModule = {
  id: "chapter-19-llm-pre-training-internals",
  title: "LLM Pre-Training Internals",
  description:
    "What it takes to pre-train a large language model: data curation at scale, tokenization, scaling laws for spending a compute budget, the parallelism strategies behind multi-thousand-GPU runs, and the failure modes that derail long training.",
  duration: "5 lessons",
  lessons: [
    {
      id: "ch19-data-curation-at-scale",
      title: "Data Curation at Scale",
      prompt: "Build the pipeline that bounds model quality",
      question:
        "A pre-training team holds 30 TB of mixed web crawl, code, and books, and leadership wants to double the raw crawl before the next run. Where does the strongest engineering judgment say the next effort should go?",
      options: [
        "Quality filtering, exact and MinHash deduplication, and benchmark decontamination of the corpus already held",
        "Doubling the raw crawl, because pre-training capability scales primarily with data volume",
        "Skipping deduplication, since repeated documents act as free data augmentation",
      ],
      correct: 0,
      feedback:
        "Strong choice. Modern runs are increasingly data-constrained, so filtering and deduplication are higher-leverage than scraping more, and decontamination keeps reported benchmark scores honest.",
      explanation:
        "Pre-training quality is bounded by data, and the curation pipeline — collect, filter, deduplicate, decontaminate — determines that bound. Duplicates waste compute and hurt generalization, and the mixture ratio materially changes capabilities, so another marginal crawl adds less than cleaning and balancing what you already hold.",
      takeaways: [
        "Pre-training quality is bounded by data, not by crawl volume.",
        "Deduplicate exactly and fuzzily; duplicates waste compute and hurt generalization.",
        "Decontaminate against evaluation benchmarks before reporting any score.",
      ],
      model: ["Collect and filter", "Deduplicate and decontaminate", "Tune the mixture"],
      source: { chapter: 19, sections: ["19.1.1"], pages: "128" },
    },
    {
      id: "ch19-tokenization",
      title: "Tokenization",
      prompt: "Make a near-permanent vocabulary decision",
      question:
        "A team must freeze a tokenizer before pre-training a model that will eventually serve multilingual users and a code assistant. What makes this a high-stakes decision?",
      options: [
        "Tokenizer quality barely matters once the model is large enough, so any standard BPE default is acceptable",
        "The tokenizer is fixed before pre-training and effectively permanent, and vocabulary size trades cheaper context against embedding-table size while multilingual fragmentation becomes a cost and fairness issue",
        "Vocabulary size only changes the embedding table, so it can be revisited later with a quick fine-tune",
      ],
      correct: 1,
      feedback:
        "Strong choice. The tokenizer is baked into the model for its lifetime, and its vocabulary-size, multilingual, and digit/whitespace consequences persist for every downstream cost and behavior.",
      explanation:
        "Tokenizers such as BPE, byte-level BPE, and SentencePiece/Unigram map text to a fixed vocabulary — typically 32k to 256k — before training starts, and that choice cannot be revisited later. A larger vocabulary shortens sequences and improves coverage but grows the embedding table; poor multilingual coverage inflates token counts for non-English users, which is both a cost and a fairness issue.",
      takeaways: [
        "The tokenizer is a near-permanent, pre-training-time commitment.",
        "Vocabulary size trades sequence length against embedding-table size.",
        "Check multilingual fragmentation and digit/whitespace handling before freezing.",
      ],
      model: ["Target distribution", "Vocabulary trade-off", "Freeze and verify"],
      source: { chapter: 19, sections: ["19.1.2"], pages: "128" },
    },
    {
      id: "ch19-scaling-laws",
      title: "Scaling Laws",
      prompt: "Spend a fixed compute budget deliberately",
      question:
        "You hold a fixed pre-training compute budget, approximately C = 6ND. Which allocation is best supported by scaling-law results?",
      options: [
        "Maximize N — parameters are the dominant lever on loss, so spend the budget on the biggest model memory allows",
        "Maximize D alone — train a tiny model on unlimited tokens, since data is the only term that matters",
        "Balance N and D near the compute-optimal point of roughly 20 tokens per parameter, and if the model will be heavily served, deliberately over-train a smaller N with more D",
      ],
      correct: 2,
      feedback:
        "Strong choice. Chinchilla showed many early models were over-sized and under-trained; the compute-optimal allocation scales parameters and tokens together, and serving economics can justify going beyond it.",
      explanation:
        "Scaling laws make loss a smooth function of model size and data, so for a fixed compute budget there is a compute-optimal balance — roughly 20 tokens per parameter. Because inference cost recurs for a heavily served model's whole life while training compute is a one-time cost, deviating toward a smaller, over-trained model often minimizes total lifetime cost.",
      takeaways: [
        "For fixed compute, balance N and D at roughly 20 tokens per parameter.",
        "Compute-optimal to train is not the same as optimal to deploy.",
        "If you are token-constrained, fix the data pipeline rather than growing the model.",
      ],
      model: ["Estimate C ≈ 6ND", "Balance N and D", "Shift for serving"],
      source: { chapter: 19, sections: ["19.1.3"], pages: "128" },
    },
    {
      id: "ch19-distributed-training-parallelism",
      title: "Distributed Training: Parallelism Strategies",
      prompt: "Map parallelism axes onto the network hierarchy",
      question:
        "A model is too large for one node on a cluster of 8-GPU NVLink-connected nodes. Which parallelism layout best respects the interconnect hierarchy?",
      options: [
        "Tensor parallelism within each node on NVLink, pipeline parallelism across a handful of nodes with micro-batching, and data parallelism with FSDP across the rest of the cluster",
        "Tensor parallelism spread across the whole cluster, because the axis with the most communication benefits from the most GPUs",
        "Pure data parallelism with a full model replica per GPU, since the gradient all-reduce is the only cost that matters",
      ],
      correct: 0,
      feedback:
        "Strong choice. The chattiest communication stays on the fastest links: TP intra-node, PP across a few nodes with the bubble shrunk by micro-batching, and DP/FSDP on top with sharded state.",
      explanation:
        "Each axis attacks a different limit: TP splits individual matmuls and needs NVLink, PP splits layers into stages and pays a pipeline bubble, and DP/FSDP splits the batch while sharding optimizer, gradient, and parameter state so no GPU holds the whole model. The guiding principle is to map the most communication-intensive parallelism onto the fastest interconnect while staying under per-GPU memory.",
      takeaways: [
        "TP belongs inside the node; DP and PP can span nodes.",
        "Shrink the pipeline bubble with micro-batching and interleaved schedules.",
        "FSDP/ZeRO shard optimizer state, gradients, and parameters, gathered just-in-time per layer.",
      ],
      model: ["TP intra-node", "PP across nodes", "DP/FSDP on top"],
      source: { chapter: 19, sections: ["19.1.4"], pages: "128" },
    },
    {
      id: "ch19-training-stability",
      title: "Training Stability",
      prompt: "Plan for failure as the steady state",
      question:
        "Four weeks into a six-week run on thousands of GPUs, the loss spikes and then a node dies. Which response plan reflects production-grade stability engineering?",
      options: [
        "Retrain from scratch with a cleaner corpus, because a loss spike means the data pipeline is poisoned",
        "Rewind to the last good checkpoint and skip the bad batch, elastically restart the dead node, and rely on the LR warmup, gradient clipping, and bf16 precision already in place",
        "Simply checkpoint more often going forward — checkpoint frequency is the whole stability strategy",
      ],
      correct: 1,
      feedback:
        "Strong choice. Loss spikes and hardware failures are distinct, planned-for classes: skip-and-retry and sound precision handle the spike, while asynchronous checkpointing and elastic restart absorb the dead node.",
      explanation:
        "At thousands of GPUs over weeks, failure is the steady state, so both classes need pre-planned responses: gradient clipping, LR warmup, safe precision, and skipping bad batches for spikes; frequent asynchronous checkpointing, elastic restart, and straggler health checks for hardware. Checkpoint frequency itself is a cost/risk trade-off, not a maximization.",
      takeaways: [
        "Plan for spikes and hardware deaths as separate failure classes.",
        "Never let one pathological batch poison the run — skip it and rewind.",
        "Tune checkpoint frequency by balancing lost compute against I/O overhead.",
      ],
      model: ["Prevent with warmup and clipping", "Skip and rewind spikes", "Checkpoint and restart"],
      source: { chapter: 19, sections: ["19.1.5"], pages: "129" },
    },
  ],
};

export const chapter19CourseContent: Record<string, LessonCourseContent> = {
  "ch19-data-curation-at-scale": {
    objectives: [
      "Explain why pre-training quality is bounded by data rather than by raw crawl volume.",
      "Describe the four-stage curation pipeline: collect, filter, deduplicate, decontaminate.",
      "Reason about data mixture and ordering as capability-shaping decisions under data constraints.",
    ],
    sections: [
      {
        heading: "Why data bounds model quality",
        paragraphs: [
          "Pre-training quality is bounded by data: the model can only internalize patterns that survive the curation pipeline, so the ceiling on capability is set before the first optimizer step. Architecture and compute decide how efficiently you approach that ceiling; the corpus decides where it is.",
          "This matters more today because modern runs are increasingly data-constrained. When high-quality tokens are the scarce resource, quality filtering and deduplication are higher-leverage than simply scraping more raw web. The teams that win on capability per dollar are usually the ones with the better filter, not the bigger crawl.",
        ],
      },
      {
        heading: "The four-stage curation pipeline",
        paragraphs: [
          "The pipeline begins with collection across source types — web crawl, code, and books — and immediately moves to filtering: language identification keeps the corpus in the intended languages, quality classifiers remove low-value text, and toxicity and PII removal strip content you neither want to learn from nor ship liability for.",
          "Next comes deduplication, both exact and fuzzy — MinHash-style near-duplicate detection catches the boilerplate and mirrored pages that exact matching misses. Duplicates are not neutral: they waste compute and hurt generalization. Finally, decontaminate against evaluation benchmarks, so the scores you report measure capability rather than memorized test data.",
        ],
      },
      {
        heading: "Mixture and ordering as capability levers",
        paragraphs: [
          "Data mixture matters as much as volume. The ratio of web versus code versus math versus high-quality curated sources materially changes which capabilities the finished model has — a model's strengths and blind spots are substantially a mixture decision, not just an architecture decision.",
          "Curriculum and ordering also move outcomes: the sequence in which sources are presented during training changes what sticks. Treat the mixture as a first-class, versioned configuration — record the ratios, vary them deliberately in small ablation runs, and read the effect on the capabilities you care about before committing the full budget.",
        ],
      },
      {
        heading: "Operating under data constraints",
        paragraphs: [
          "When you cannot simply acquire more high-quality tokens, the leverage shifts to the pipeline: tighten quality classifiers, run dedup more aggressively, and rebalance the mixture toward your highest-value sources. Each of these raises the effective quality of a fixed token supply.",
          "Validation is part of the design. Measure duplicate rates before and after fuzzy dedup, audit benchmark overlap before decontamination sign-off, and compare mixture variants on the evaluations that proxy your target capabilities. A curation pipeline without these measurements is an opinion, not an engineering artifact.",
        ],
      },
    ],
    example: {
      title: "Worked example: scraping more versus cleaning what you have",
      scenario:
        "A pre-training team holds 30 TB of mixed web crawl, code, and books. Leadership proposes doubling the raw crawl before the next run, while the current internal benchmark scores look suspiciously strong.",
      analysis:
        "Suspiciously strong benchmark scores are a contamination signal: unless the corpus is decontaminated against the evaluation benchmarks, reported numbers may reflect memorized test data rather than capability. More raw crawl would also import more duplicates, which waste compute and hurt generalization, at a time when quality filtering and dedup are higher-leverage than volume. Meanwhile the mixture ratio — web versus code versus math versus curated sources — will shape capabilities more than another marginal terabyte.",
      decision:
        "Fund the curation pipeline instead of the crawl: run exact and MinHash fuzzy deduplication, apply language ID, quality, toxicity, and PII filters, decontaminate against every reported benchmark, and tune the mixture with small ablation runs before committing compute.",
    },
    productionChecklist: [
      "Run language ID, quality classifiers, and toxicity/PII removal before tokenization begins.",
      "Apply both exact and fuzzy (MinHash) deduplication across the entire corpus.",
      "Decontaminate training data against every evaluation benchmark you intend to report.",
      "Record and version the mixture ratio of web, code, math, and curated sources.",
      "Treat mixture and ordering changes as measured experiments, not defaults.",
    ],
    commonMistakes: [
      "Scaling raw crawl volume when quality filtering and dedup would yield more capability per token.",
      "Skipping fuzzy dedup, so near-duplicates waste compute and quietly hurt generalization.",
      "Reporting benchmark scores without decontaminating the training corpus against those benchmarks.",
      "Fixing the data mixture by habit instead of tuning the web/code/math ratio as a decision.",
    ],
    knowledgeChecks: [
      {
        id: "ch19-data-curation-at-scale-kc-1",
        prompt:
          "Your team has collected a large mixed corpus of web crawl, code, and books, and a stakeholder suggests skipping fuzzy deduplication to ship the training run sooner. What is the strongest engineering response?",
        options: [
          "Insist on both exact and MinHash fuzzy dedup, because duplicates waste compute and hurt generalization even when they are not byte-identical",
          "Agree to skip it, since near-duplicates act as free data augmentation and slightly improve coverage",
          "Skip fuzzy dedup but keep exact dedup, because only byte-identical copies cause measurable harm",
        ],
        correct: 0,
        feedback:
          "Exact plus fuzzy MinHash deduplication is a standard pipeline stage, and duplicates waste compute and hurt generalization, so skipping it trades a hidden quality loss for schedule.",
      },
      {
        id: "ch19-data-curation-at-scale-kc-2",
        prompt:
          "A pre-training team holding 30 TB of mixed web crawl, code, and books notices that its internal benchmark scores look suspiciously strong before the next run. Which pipeline step most directly addresses the risk behind that signal?",
        options: [
          "Running language identification again, because strong scores usually mean the corpus drifted toward a single language",
          "Rebalancing the mixture toward more code, because code tokens make benchmark reasoning appear stronger",
          "Decontaminating the corpus against the evaluation benchmarks, because otherwise reported scores may reflect memorized test data",
        ],
        correct: 2,
        feedback:
          "Without decontamination against evaluation benchmarks, reported scores are memorized test data rather than capability — exactly the risk that suspiciously strong scores signal here.",
      },
      {
        id: "ch19-data-curation-at-scale-kc-3",
        prompt:
          "A trained model parrots near-identical boilerplate passages and generalizes poorly on held-out text, even though the original crawl was huge. Which curation failure best explains this outcome?",
        options: [
          "The mixture contained too much math, which always causes models to repeat boilerplate text at inference time",
          "Deduplication was missing or weak, so duplicated content consumed compute and damaged generalization",
          "The quality classifiers were too strict, which forces a model to memorize the few documents that survived",
        ],
        correct: 1,
        feedback:
          "Duplicates are a direct cause of wasted compute and hurt generalization; exact and fuzzy MinHash dedup exists precisely to prevent this failure mode.",
      },
      {
        id: "ch19-data-curation-at-scale-kc-4",
        prompt:
          "Leadership argues that doubling the raw crawl is the safest way to improve the next model. How do you defend investing in filtering and deduplication instead, using the chapter's reasoning?",
        options: [
          "Concede that volume always wins, because quality filtering only matters for corpora under one terabyte",
          "Argue that filtering matters only for toxicity, and that duplicated or low-quality text is otherwise harmless",
          "Explain that modern runs are increasingly data-constrained, so quality filtering and dedup are higher-leverage than simply scraping more raw data",
        ],
        correct: 2,
        feedback:
          "Modern runs are increasingly data-constrained, which makes quality filtering and dedup higher-leverage than scraping more — that leverage argument is the core of the defense.",
      },
      {
        id: "ch19-data-curation-at-scale-kc-5",
        prompt:
          "Before committing the full training budget, which measurement plan best validates that your curation pipeline actually did its job on this particular corpus?",
        options: [
          "Skip measurement until after training, because curation quality can only be judged from the final benchmark scores",
          "Measure duplicate rates before and after dedup, audit benchmark overlap at decontamination, and compare mixture variants in small ablation runs",
          "Count total collected terabytes as the primary quality metric, since more raw data implies a better corpus",
        ],
        correct: 1,
        feedback:
          "This mirrors the chapter's pipeline: dedup effectiveness, decontamination against evaluation benchmarks, and mixture as a materially capability-changing lever are all checkable before the expensive run.",
      },
    ],
  },
  "ch19-tokenization": {
    objectives: [
      "Explain what BPE, byte-level BPE, and SentencePiece/Unigram tokenizers commit a model to.",
      "Analyze the vocabulary-size trade-off between sequence length and embedding-table size.",
      "Evaluate multilingual, digit, and whitespace handling before freezing a tokenizer.",
    ],
    sections: [
      {
        heading: "What a tokenizer commits you to",
        paragraphs: [
          "Tokenizers — BPE, byte-level BPE, SentencePiece/Unigram — map raw text to a fixed vocabulary, typically in the 32k to 256k range. Every training example, every inference request, and every context-window limit is expressed in those tokens for the model's entire life.",
          "The tokenizer is fixed before pre-training and is effectively permanent: it is baked into the embedding table, the output layer, and every artifact the run produces. That makes it one of the highest-stakes early decisions in a pre-training program — revisited never, inherited everywhere.",
        ],
      },
      {
        heading: "The vocabulary-size trade-off",
        paragraphs: [
          "Vocabulary size is the central dial. A bigger vocabulary means fewer tokens per document, which lowers effective sequence length and therefore both training and inference cost, and it improves coverage of rare words and non-English scripts.",
          "The cost of that bigger vocabulary is a larger embedding and output table — more parameters — and the risk that rare tokens are under-trained because each appears too few times in the corpus. A smaller vocabulary is cheaper in parameters but shreds text into more pieces, raising cost per document and hurting languages and code that fragment badly.",
        ],
      },
      {
        heading: "Multilingual coverage as cost and fairness",
        paragraphs: [
          "Poor multilingual coverage is not a corner case — it is a fairness and cost issue. If the tokenizer fragments a language badly, users of that language pay more tokens for the same content, hit context limits sooner, and receive worse quality for the same request.",
          "Byte-level fallback changes the failure mode: with it, no input is ever un-encodable, so an unfamiliar script degrades into longer sequences rather than errors. For any model with multilingual ambitions, coverage and fallback behavior belong in the acceptance criteria, not in a post-launch bug report.",
        ],
      },
      {
        heading: "Digits, whitespace, and pre-freeze verification",
        paragraphs: [
          "Digit and whitespace handling quietly determines arithmetic and code quality. Splitting numbers into inconsistent pieces degrades arithmetic; mangling indentation degrades code, which is indentation-sensitive. These behaviors are set when the tokenizer is trained and frozen.",
          "Before freezing, verify the tokenizer like any other production contract: measure tokens per document on representative samples for every target language, inspect how numbers and indentation split on real arithmetic and code, and only then lock the vocabulary. The check is cheap; the mistake is permanent.",
        ],
      },
    ],
    example: {
      title: "Worked example: one tokenizer for English chat, multilingual users, and code",
      scenario:
        "A team freezing its pre-training tokenizer expects mostly English chat traffic at launch, but the product roadmap adds multilingual support and a code assistant within a year.",
      analysis:
        "An English-centric small vocabulary keeps the embedding table small but fragments multilingual text and code into more tokens, raising training and inference cost and degrading quality for those users — a fairness issue as well as a cost one, and irreversible once training starts. A larger vocabulary with byte-level fallback costs embedding parameters and risks under-trained rare tokens, but it guarantees every input is encodable and shortens sequences across the board.",
      decision:
        "Choose the larger vocabulary with byte-level fallback, verify tokens-per-document on representative multilingual and code samples, and confirm that digits and indentation survive as coherent tokens before freezing the tokenizer.",
    },
    productionChecklist: [
      "Fix and version the tokenizer before any pre-training tokens are consumed.",
      "Measure tokens per document on representative text for every target language.",
      "Verify digit splitting and whitespace/indentation handling on arithmetic and code samples.",
      "Confirm byte-level fallback so no input is ever un-encodable.",
      "Size the vocabulary explicitly against the embedding-table parameter budget.",
    ],
    commonMistakes: [
      "Treating the tokenizer as reversible when it is baked into the model for its lifetime.",
      "Choosing vocabulary size without measuring fragmentation on non-English text.",
      "Ignoring digit and whitespace handling until arithmetic or code quality regresses.",
      "Maximizing vocabulary size without accounting for embedding-table growth and under-trained rare tokens.",
    ],
    knowledgeChecks: [
      {
        id: "ch19-tokenization-kc-1",
        prompt:
          "A week before pre-training starts, a teammate proposes finalizing the tokenizer later, after seeing how the early loss curves behave. Why is that plan fundamentally flawed?",
        options: [
          "Early loss curves are unreliable, so tokenizer decisions should wait until the model is fully trained instead",
          "The tokenizer is fixed before pre-training and effectively permanent; every token the run consumes already bakes the choice into the model",
          "Tokenizers only affect inference-time behavior, so the decision can be swapped cheaply between checkpoints",
        ],
        correct: 1,
        feedback:
          "The tokenizer is fixed before pre-training and is effectively permanent — a high-stakes early decision, not something that can be deferred past the first consumed tokens.",
      },
      {
        id: "ch19-tokenization-kc-2",
        prompt:
          "A team freezing its pre-training tokenizer expects mostly English chat traffic at launch, but its product roadmap adds multilingual support and a code assistant within a year. Which tokenizer decision best fits that stated target distribution?",
        options: [
          "Choose a larger vocabulary with byte-level fallback, then verify fragmentation on multilingual and code samples before freezing",
          "Choose a small English-centric vocabulary now and plan to retrain the tokenizer once the new features ship",
          "Keep any default BPE tokenizer, because vocabulary choices have no effect on non-English text",
        ],
        correct: 0,
        feedback:
          "The guidance is to match the vocabulary to the target distribution: heavy multilingual or code workloads push toward a larger vocab with byte-level fallback so no input is ever un-encodable.",
      },
      {
        id: "ch19-tokenization-kc-3",
        prompt:
          "After launch, users of one language pay noticeably more tokens for the same content and report worse quality, while arithmetic answers degrade on multi-digit numbers. What is the most likely root cause?",
        options: [
          "The model was under-trained for its size, which always shows up first as tokenizer-specific symptoms",
          "The serving stack is miscounting tokens, so the fix belongs in billing rather than in the tokenizer",
          "The tokenizer fragments that language badly and splits digits poorly — a coverage and digit-handling failure baked in at pre-training time",
        ],
        correct: 2,
        feedback:
          "Poor multilingual coverage inflates token counts as a fairness and cost issue, and digit handling drives arithmetic quality — both are frozen tokenizer properties.",
      },
      {
        id: "ch19-tokenization-kc-4",
        prompt:
          "A colleague pushes for the maximum 256k vocabulary, arguing that fewer tokens per document is strictly better. How do you defend choosing a smaller, deliberate vocabulary size instead?",
        options: [
          "A bigger vocabulary inflates the embedding and output tables, adds parameters, and can leave rare tokens under-trained, so the right size depends on the target distribution",
          "You concede immediately, because vocabulary size has no real downside beyond a little disk storage",
          "You argue vocabulary size never affects training or inference cost, so the choice is purely aesthetic either way",
        ],
        correct: 0,
        feedback:
          "Vocabulary size is a trade-off — sequence length and coverage versus embedding-table size and rare-token under-training — not a strictly-better maximum.",
      },
      {
        id: "ch19-tokenization-kc-5",
        prompt:
          "Which pre-freeze verification checklist best operationalizes the chapter's guidance before the tokenizer is locked in for the entire training run?",
        options: [
          "Confirm the tokenizer library version matches the framework default, then freeze without inspecting any samples",
          "Freeze first and measure fragmentation after training, when real model outputs finally exist to analyze",
          "Measure tokens per document across target languages, inspect digit and whitespace splits on arithmetic and code, and confirm byte-level fallback coverage",
        ],
        correct: 2,
        feedback:
          "The decision guidance includes checking digit and whitespace handling and matching the vocabulary to the target language and code distribution before the permanent freeze.",
      },
    ],
  },
  "ch19-scaling-laws": {
    objectives: [
      "State how scaling laws relate loss to model size N, data D, and compute C.",
      "Apply the Chinchilla compute-optimal balance of roughly 20 tokens per parameter to a fixed budget.",
      "Distinguish compute-optimal training from serving-optimal deployment.",
    ],
    sections: [
      {
        heading: "What scaling laws say",
        paragraphs: [
          "Scaling laws relate loss to model size N, data D, and compute C: loss falls smoothly and predictably as these grow, which means a pre-training run's outcome is largely a budgeting decision made before training starts, not a surprise discovered after it ends.",
          "The practical consequence is that for a fixed compute budget there is a compute-optimal balance between parameters and tokens. Pouring the entire budget into either term alone leaves performance on the table that the same money could have bought.",
        ],
      },
      {
        heading: "The Chinchilla result",
        paragraphs: [
          "The Chinchilla result showed that many early large models were over-sized and under-trained: too many parameters, too few tokens for their compute. The compute-optimal allocation scales parameters and tokens together, at roughly 20 tokens per parameter.",
          "Since compute is approximately C = 6ND, a fixed budget defines a frontier of (N, D) pairs. The reading for practice is direct: given the budget, balance N and D near that frontier point rather than maximizing parameter count, and expect about 20 tokens of data for every parameter you buy.",
        ],
      },
      {
        heading: "Training-optimal versus serving-optimal",
        paragraphs: [
          "Compute-optimal to train is not the same as optimal to deploy. For models that will be served a lot, inference cost dominates lifetime cost, so it can be right to deliberately over-train a smaller model on more tokens than the Chinchilla point prescribes.",
          "The economics explain why: a larger model is compute-optimal to train but more expensive to serve forever, while the extra training compute for over-training a small model is a one-time cost. Optimizing total lifetime cost — training plus serving — is what separates a staff-level allocation from a textbook one.",
        ],
      },
      {
        heading: "Data constraints and the decision framework",
        paragraphs: [
          "Scaling laws assume you can actually obtain D. If you are token-constrained, you cannot reach the compute-optimal data size regardless of budget, which pushes you toward repeated-data techniques or better filtering rather than toward a bigger model.",
          "A workable framework: estimate the budget as C = 6ND; if the model is research or one-off, target the compute-optimal N and D; if it will be heavily served, shift toward a smaller N with more D; and always check data availability before committing to a point on the frontier.",
        ],
      },
    ],
    example: {
      title: "Worked example: one budget, two deployment profiles",
      scenario:
        "Two teams share an identical fixed pre-training compute budget. Team A trains a research model that will be evaluated once; Team B trains a chat model that will serve heavy traffic for years.",
      analysis:
        "Both teams start from C = 6ND and the Chinchilla balance of roughly 20 tokens per parameter. Team A's lifetime cost is essentially its training run, so it should sit near the compute-optimal point. Team B's lifetime cost is dominated by inference, so deviating from the Chinchilla point toward a smaller N trained on more D cuts serving cost forever in exchange for a one-time training increase. If either team is token-constrained, the larger-model branch is not even reachable at the optimal D — better filtering or data repetition would matter more than parameters.",
      decision:
        "Team A allocates compute at the Chinchilla-optimal N and D. Team B deliberately over-trains a smaller model beyond 20 tokens per parameter, sizing N against its serving fleet rather than against the training optimum alone.",
    },
    productionChecklist: [
      "Estimate the compute budget as approximately C = 6ND before choosing N and D.",
      "Use roughly 20 tokens per parameter as the compute-optimal baseline allocation.",
      "Classify the model as research/one-off or heavily served before fixing N.",
      "Confirm the corpus can actually supply the target D before committing to it.",
      "When serving dominates lifetime cost, bias toward a smaller model trained on more tokens.",
    ],
    commonMistakes: [
      "Maximizing parameter count under a fixed budget and leaving the model under-trained.",
      "Applying the training-optimal point to a heavily served model whose lifetime cost is inference.",
      "Planning a data size D that the available corpus cannot supply.",
      "Quoting training-loss improvements while ignoring total lifetime cost.",
    ],
    knowledgeChecks: [
      {
        id: "ch19-scaling-laws-kc-1",
        prompt:
          "You are handed a fixed compute budget and told to spend it on the largest parameter count memory allows, training on whatever tokens remain. What does scaling-law evidence say about this plan?",
        options: [
          "It is correct, because parameters are the only term in the scaling relationship that meaningfully moves loss",
          "It is correct as long as the learning rate is warmed up, since stability fixes any allocation mistake",
          "It repeats the classic over-sized and under-trained mistake; the compute-optimal allocation balances N and D at roughly twenty tokens per parameter",
        ],
        correct: 2,
        feedback:
          "The Chinchilla result: many early models were over-sized and under-trained, and the compute-optimal allocation scales parameters and tokens together at about 20 tokens per parameter.",
      },
      {
        id: "ch19-scaling-laws-kc-2",
        prompt:
          "Two teams share an identical fixed pre-training compute budget: Team A trains a research model that will be evaluated once, while Team B trains a chat model serving heavy traffic for years. How should Team B's allocation differ from Team A's?",
        options: [
          "It should not differ; both teams should sit exactly at the compute-optimal point because the budgets are identical",
          "Team B should over-train a smaller model on more tokens than compute-optimal, because inference dominates its lifetime cost while extra training compute is one-time",
          "Team B should train a larger model on fewer tokens, because serving a bigger model signals higher quality to users",
        ],
        correct: 1,
        feedback:
          "For models that will be served a lot, deliberately over-train a smaller model — a larger model is compute-optimal to train but more expensive to serve forever.",
      },
      {
        id: "ch19-scaling-laws-kc-3",
        prompt:
          "A run finishes with a very large model whose loss is worse than a smaller baseline trained on the same compute. Which misreading of scaling laws most likely produced this outcome?",
        options: [
          "Treating N as the only lever and starving D, when loss is a smooth function of both and the budget should be split near the compute-optimal balance",
          "Using bf16 precision, which inherently caps the loss any large model can reach regardless of allocation",
          "Checkpointing too frequently, which consumed the compute that would otherwise have trained the model",
        ],
        correct: 0,
        feedback:
          "Scaling laws relate loss to N, D, and C jointly; maximizing parameters under a fixed compute budget leaves the model under-trained — exactly the Chinchilla critique of early large models.",
      },
      {
        id: "ch19-scaling-laws-kc-4",
        prompt:
          "A reviewer objects that deviating from the Chinchilla point is simply wasting compute. How do you defend deliberately over-training a smaller model for a heavily served product?",
        options: [
          "You cannot defend it; compute-optimal training is always also deployment-optimal for any product",
          "Argue that Chinchilla was a hardware finding, not a statement about the balance between parameters and tokens",
          "Compute-optimal to train is not optimal to deploy: the extra training compute is one-time, while a larger model is more expensive to serve forever, so minimize total lifetime cost",
        ],
        correct: 2,
        feedback:
          "The staff-level differentiator is optimizing total lifetime cost: training compute is one-time while inference recurs, so serving-heavy models justify over-training a smaller N.",
      },
      {
        id: "ch19-scaling-laws-kc-5",
        prompt:
          "Before locking your allocation, which concrete check belongs in the pre-training plan according to the chapter's decision framework for the run?",
        options: [
          "Estimate C as approximately 6ND, classify the model as research or heavily served, and confirm the corpus can actually supply the target D",
          "Pick N from a public leaderboard and derive D only after training has already started",
          "Verify only that the GPU count is divisible by eight, since allocation is purely a hardware question",
        ],
        correct: 0,
        feedback:
          "The chapter's framework: estimate C ≈ 6ND, target the compute-optimal N and D for research models, shift toward smaller N with more D for served ones, and account for data availability.",
      },
    ],
  },
  "ch19-distributed-training-parallelism": {
    objectives: [
      "Define the data, tensor, pipeline, and expert parallelism axes and what each one splits.",
      "Name each axis's dominant communication cost.",
      "Combine axes so the most communication-intensive traffic stays on the fastest interconnect.",
    ],
    sections: [
      {
        heading: "Why one GPU is not enough",
        paragraphs: [
          "A frontier model does not fit on one GPU, so training is parallelized along several axes, usually combined into what practitioners call 3D parallelism. The combination is not a convenience — it is what makes multi-thousand-GPU training possible at all.",
          "The state problem is the binding constraint. FSDP and ZeRO shard optimizer state, gradients, and parameters across data-parallel ranks so no single GPU holds the full state, gathering the shards just-in-time for each layer. That sharding is what lets the batch axis scale without replicating everything everywhere.",
        ],
      },
      {
        heading: "The four axes and their costs",
        paragraphs: [
          "Data parallelism splits the batch across GPUs — and FSDP additionally shards model state — at the cost of a gradient all-reduce. Tensor parallelism splits individual matmuls, such as attention and MLP blocks, across GPUs, and pays for it with heavy intra-layer communication that needs NVLink-class bandwidth.",
          "Pipeline parallelism splits the layers into stages on different GPUs, and its cost is the pipeline bubble — idle time while the pipeline fills and drains. Expert parallelism, for MoE models, places different experts on different GPUs and pays an all-to-all routing cost as tokens are dispatched to their experts.",
        ],
      },
      {
        heading: "Mapping axes to the network hierarchy",
        paragraphs: [
          "The combination follows the network hierarchy. Tensor parallelism has the heaviest, most frequent communication, so it stays within a node where NVLink bandwidth is highest — typically TP across the 8 GPUs of a single node.",
          "Pipeline parallelism spans a handful of nodes to fit the layer count, with micro-batching and interleaved schedules to shrink the bubble. Data parallelism with FSDP sits on top to scale throughput across the rest of the cluster, because its gradient all-reduce is tolerable across nodes. Tensor-parallel comms stay in-node; data-parallel and pipeline traffic is what crosses node boundaries.",
        ],
      },
      {
        heading: "Sizing the combination",
        paragraphs: [
          "The art is combining the axes to keep GPUs busy while staying under memory limits and minimizing the slowest communication. Each axis's degree is set by per-GPU memory headroom, the layer count, and the bandwidth available at each level of the interconnect.",
          "The guiding principle is stable across clusters: map the most communication-intensive parallelism onto the fastest interconnect, and for MoE models add expert parallelism with its all-to-all routing budgeted explicitly. A layout that ignores the topology trains at a fraction of the hardware's potential throughput.",
        ],
      },
    ],
    example: {
      title: "Worked example: placing a too-large model on a cluster",
      scenario:
        "A model exceeds one node's memory. The cluster is organized as nodes of 8 NVLink-connected GPUs with much slower networking between nodes.",
      analysis:
        "Tensor parallelism has the heaviest, most frequent communication, so it belongs inside the node on NVLink — typically TP across the 8 local GPUs. Pipeline parallelism then splits the layers into stages across a handful of nodes, with micro-batching and interleaved schedules to shrink the fill/drain bubble. Data parallelism with FSDP goes on top, replicating across the remaining cluster while sharding optimizer, gradient, and parameter state so no GPU holds the whole model; its gradient all-reduce tolerates the slower inter-node links. An MoE variant would add expert parallelism with its all-to-all routing.",
      decision:
        "Adopt TP = 8 intra-node, PP across the minimum node count that fits the layers, and DP/FSDP across the rest of the cluster; then verify per-GPU memory headroom and confirm that only DP and PP traffic crosses node boundaries.",
    },
    productionChecklist: [
      "Keep tensor parallelism within a node on NVLink; never stretch it across slow links.",
      "Size pipeline stages to fit the layer count and shrink the bubble with micro-batching.",
      "Shard optimizer state, gradients, and parameters with FSDP/ZeRO so no GPU holds full state.",
      "Confirm per-GPU memory headroom for the chosen TP/PP/DP combination before launch.",
      "For MoE models, plan expert parallelism and its all-to-all routing traffic explicitly.",
    ],
    commonMistakes: [
      "Running tensor parallelism across nodes, putting the chattiest communication on the slowest interconnect.",
      "Ignoring the pipeline bubble instead of shrinking it with micro-batching and interleaved schedules.",
      "Replicating full model state per GPU instead of sharding with FSDP/ZeRO.",
      "Listing the three parallelisms without mapping them onto the network topology and memory budget.",
    ],
    knowledgeChecks: [
      {
        id: "ch19-distributed-training-parallelism-kc-1",
        prompt:
          "Your model exceeds one node's memory on a cluster of eight-GPU NVLink nodes with slower inter-node links. Which initial parallelism layout best respects this hardware?",
        options: [
          "Tensor parallelism spanning many nodes, so the axis with the heaviest communication gets the most GPUs behind it",
          "Tensor parallelism inside each node on NVLink, pipeline stages across a few nodes, and data parallelism with FSDP across the rest",
          "A full model replica on every GPU with pure data parallelism, because replication removes all communication",
        ],
        correct: 1,
        feedback:
          "TP maps intra-node where NVLink bandwidth is highest, PP across a handful of nodes, and DP/FSDP on top — the chattiest communication goes onto the fastest interconnect.",
      },
      {
        id: "ch19-distributed-training-parallelism-kc-2",
        prompt:
          "Your layout for a too-large model uses tensor parallelism across the eight NVLink GPUs inside each node, pipeline stages across the minimum nodes that fit the layers, and data parallelism with FSDP across the rest. What final verification does that layout require?",
        options: [
          "Confirm the pipeline has zero bubble by removing all micro-batches, which are the source of idle time",
          "Verify that tensor-parallel traffic crosses node boundaries, since that proves the cluster is fully utilized",
          "Confirm per-GPU memory headroom and that only data-parallel and pipeline traffic crosses the slower inter-node links",
        ],
        correct: 2,
        feedback:
          "The combination rule keeps tensor-parallel comms within a node while DP and PP span nodes, all while staying under per-GPU memory — the verification step follows directly from that rule.",
      },
      {
        id: "ch19-distributed-training-parallelism-kc-3",
        prompt:
          "Training throughput is a fraction of what the hardware should deliver, and profiling shows most time going into intra-layer communication crossing node-to-node links. What is the most likely design error?",
        options: [
          "Tensor parallelism was stretched across nodes, putting the heaviest, most frequent communication on the slowest interconnect instead of NVLink",
          "FSDP sharded the optimizer state, which always destroys throughput and should be disabled immediately",
          "The batch was split across GPUs at all, because data parallelism is never worth its all-reduce cost",
        ],
        correct: 0,
        feedback:
          "TP has heavy intra-layer comms needing NVLink, and the art is minimizing the slowest communication; TP across nodes is the textbook violation.",
      },
      {
        id: "ch19-distributed-training-parallelism-kc-4",
        prompt:
          "A teammate wants to eliminate pipeline parallelism entirely to avoid paying its bubble. How do you defend keeping pipeline parallelism with micro-batching in the combination?",
        options: [
          "You agree; the bubble cannot be reduced, so pipeline parallelism should never be used in practice",
          "The bubble is a manageable cost: micro-batching and interleaved schedules shrink the fill and drain idle time, and PP is what fits the layer count across nodes",
          "Pipeline parallelism has no costs at all, so the objection is not worth addressing seriously",
        ],
        correct: 1,
        feedback:
          "The pipeline bubble is PP's named cost and the remedy is micro-batching and interleaved schedules — while PP remains how layers are split into stages across nodes.",
      },
      {
        id: "ch19-distributed-training-parallelism-kc-5",
        prompt:
          "Which set of checks best validates a proposed 3D parallelism layout before the multi-week run commits thousands of GPUs to it?",
        options: [
          "Confirm per-GPU memory headroom for the TP/PP/DP degrees, keep TP traffic in-node, size PP to the layer count, and budget all-to-all routing if the model is MoE",
          "Count total GPUs only, because any layout performs identically once enough devices are attached",
          "Benchmark a single GPU in isolation, since per-device speed fully determines cluster throughput",
        ],
        correct: 0,
        feedback:
          "The sizing guidance: keep GPUs busy under memory limits, map communication-intensive axes onto fast interconnects, and plan expert parallelism's all-to-all routing for MoE models.",
      },
    ],
  },
  "ch19-training-stability": {
    objectives: [
      "Enumerate the characteristic failure modes of weeks-to-months runs on thousands of GPUs.",
      "Apply the standard mitigations for loss spikes, hardware failures, and numerical issues.",
      "Tune checkpoint frequency as an explicit cost/risk trade-off.",
    ],
    sections: [
      {
        heading: "Failure is the steady state",
        paragraphs: [
          "Long runs — weeks to months on thousands of GPUs — fail in characteristic ways. At that scale and duration, hardware failures are statistically guaranteed, so robustness is not an incident response; it is part of the training design from day one.",
          "The failure modes fall into three classes: loss spikes and divergence, hardware failures mid-run, and numerical issues around precision — bf16 versus fp16 and loss scaling. Each class has its own playbook, and conflating them produces responses that fix neither.",
        ],
      },
      {
        heading: "Containing loss spikes and divergence",
        paragraphs: [
          "The standard mitigations are gradient clipping, careful learning-rate warmup, lower precision only where it is safe, and skipping or retrying bad batches. Architectural choices such as normalization placement and embedding/output scaling also prevent spikes before they start.",
          "The operational piece is a skip-and-retry path: watch gradient-norm and loss curves with automated alerts, and when a pathological batch appears, drop it and rewind to the last good checkpoint rather than letting one batch poison the run. Precision matters here too — bf16 is more robust than fp16 for large models because of its dynamic range, with loss scaling used carefully where fp16 remains.",
        ],
      },
      {
        heading: "Surviving hardware failures",
        paragraphs: [
          "A GPU dying mid-run is a certainty, not a risk, so frequent checkpointing and elastic restart are mandatory. Asynchronous checkpointing overlaps checkpoint I/O with compute so the act of saving state does not itself stall training.",
          "Elastic, fault-tolerant restart keeps a dead node from killing the job, and health checks catch a slow or failing GPU early — a single straggler tanks a synchronous step for the entire fleet. The design goal is that any single hardware death is a blip in the throughput curve, not an event the team learns about from a crashed job.",
        ],
      },
      {
        heading: "Checkpoint economics and telemetry",
        paragraphs: [
          "Checkpoint frequency is a cost/risk trade-off: too rare and a failure loses days of compute; too frequent and checkpoint I/O dominates the training time it is meant to protect. Tune it by balancing the expected lost compute per failure against the I/O overhead, not by habit.",
          "Detailed run telemetry ties the whole stability story together — throughput, gradient norms, and per-rank timing let you catch degradation early and make a failed run diagnosable rather than mysterious. Without per-rank visibility, the difference between a straggler, a spike, and a slow network is guesswork.",
        ],
      },
    ],
    example: {
      title: "Worked example: the 3 a.m. loss spike",
      scenario:
        "A six-week run on several thousand GPUs shows a sudden loss spike at week four, followed hours later by a node dropping out of the job.",
      analysis:
        "These are two distinct, planned-for failure classes. The spike belongs to the stability playbook: LR warmup and gradient clipping are already in place, bf16 provides safer dynamic range than fp16, and the skip-and-retry path drops the pathological batch and rewinds to the last good checkpoint. The dead node belongs to the fault-tolerance playbook: asynchronous checkpoints mean little compute is lost, elastic restart replaces the node without killing the job, and health checks would have flagged a straggler before it poisoned a synchronous step.",
      decision:
        "Rewind to the last good checkpoint, skip the bad batch, elastically replace the failed node, and re-check that checkpoint frequency still balances lost-compute risk against I/O overhead before resuming the run.",
    },
    productionChecklist: [
      "Enable learning-rate warmup and gradient clipping from step zero.",
      "Prefer bf16 for large models; apply loss scaling carefully wherever fp16 remains.",
      "Implement skip-and-retry so one pathological batch cannot poison the run.",
      "Checkpoint asynchronously and restart elastically so a dead node never kills the job.",
      "Alert on gradient norms, loss curves, throughput, and per-rank timing.",
    ],
    commonMistakes: [
      "Treating 'checkpoint often' as the entire stability strategy.",
      "Letting a bad batch through instead of skipping it and rewinding to the last good checkpoint.",
      "Running fp16 without loss scaling where bf16's dynamic range would be safer.",
      "Setting checkpoint frequency by habit instead of balancing lost compute against I/O overhead.",
    ],
    knowledgeChecks: [
      {
        id: "ch19-training-stability-kc-1",
        prompt:
          "Planning a six-week run on thousands of GPUs, a junior engineer proposes handling failures ad hoc as they arise. What is the strongest objection grounded in this chapter?",
        options: [
          "Ad hoc handling is fine because failures are rare at this scale and duration",
          "Ad hoc handling fails only because it stresses the on-call team, not because of the run itself",
          "At this scale failure is the steady state, so both loss spikes and hardware deaths need pre-planned responses designed into the run from day one",
        ],
        correct: 2,
        feedback:
          "The staff-level framing: at thousands of GPUs over weeks, failure is the steady state, and spikes versus hardware failures are distinct classes that are planned for separately.",
      },
      {
        id: "ch19-training-stability-kc-2",
        prompt:
          "A six-week run on several thousand GPUs hits a sudden loss spike at week four, followed hours later by a node dropping out of the job. What is the correct immediate response sequence?",
        options: [
          "Rewind to the last good checkpoint, skip the bad batch, elastically replace the node, and re-check checkpoint frequency before resuming",
          "Abort the entire run and restart from step zero, because any spike permanently corrupts the model weights",
          "Ignore the spike but replace the node, since loss spikes always resolve themselves within a few steps",
        ],
        correct: 0,
        feedback:
          "This sequence applies the two playbooks: skip-and-retry with a rewind to the last good checkpoint for the spike, and elastic restart plus checkpoint economics for the dead node.",
      },
      {
        id: "ch19-training-stability-kc-3",
        prompt:
          "A synchronous training step suddenly takes far longer than usual and the whole fleet waits. Telemetry later shows one GPU responding slowly rather than being fully dead. What happened?",
        options: [
          "The learning rate schedule entered its warmup phase, which naturally slows every synchronous step",
          "A straggler dragged the synchronous step — health checks exist because one slow or failing GPU tanks the step for everyone",
          "Checkpoint I/O overlapped with compute, which by design makes every step slower for the whole run",
        ],
        correct: 1,
        feedback:
          "A single straggler tanks a synchronous step, which is why health checks that detect a slow or failing GPU are part of the hardware-failure playbook.",
      },
      {
        id: "ch19-training-stability-kc-4",
        prompt:
          "Finance questions why checkpoints are not written after every single step for maximum safety. How do you defend the checkpoint frequency you actually chose?",
        options: [
          "Checkpoint frequency is a cost/risk trade-off: too rare and a failure loses days of compute, too frequent and checkpoint I/O dominates the training it protects",
          "You agree and switch to per-step checkpoints, because storage is always cheaper than compute",
          "You argue checkpoints are unnecessary at all, because elastic restart recovers any failure instantly",
        ],
        correct: 0,
        feedback:
          "Checkpoint frequency balances the cost of lost compute on failure against checkpoint I/O overhead — a tuned trade-off, not a maximum-safety maximum.",
      },
      {
        id: "ch19-training-stability-kc-5",
        prompt:
          "Which telemetry set best satisfies the chapter's requirement that degradations be caught early and failed runs be diagnosable rather than mysterious?",
        options: [
          "Final loss only, since the end number summarizes everything that happened during the run",
          "Throughput, gradient norms, loss curves with automated alerts, and per-rank timing collected continuously throughout the run",
          "A daily manual inspection of GPU temperature, because hardware telemetry replaces training telemetry",
        ],
        correct: 1,
        feedback:
          "Detailed run telemetry — throughput, grad norms, per-rank timing — catches a degradation early and makes a failed run diagnosable; single final numbers cannot do that.",
      },
    ],
  },
};

export const chapter19Practice: CatalogPracticeUnit[] = [
  {
    id: "ch19-19-2-1",
    chapter: 19,
    chapterTitle: "LLM Pre-Training Internals",
    title: "How do scaling laws change how you spend a compute budget?",
    pages: "129",
    route: "/practice/llm-pre-training-internals/how-do-scaling-laws-change-how-you-spend-a-compute-budget",
    competencies: ["data curation", "tokenization", "scaling laws", "distributed training", "stability"],
    question: "You have a fixed pre-training compute budget. How do scaling laws guide how you spend it?",
    options: [
      {
        text: "Spend the budget on the largest model that fits in memory — parameters are the dominant lever on loss, so maximize N and train on whatever tokens remain.",
        correct: false,
        feedback:
          "This is the pre-Chinchilla mistake: for a fixed compute budget, many early models were over-sized and under-trained, leaving performance on the table that the same compute could have bought.",
      },
      {
        text: "Balance N and D at the compute-optimal point — roughly 20 tokens per parameter — and if the model will be heavily served, deliberately over-train a smaller model, because inference dominates lifetime cost while extra training compute is one-time.",
        correct: true,
        feedback:
          "Correct. This applies the Chinchilla balance, separates training-optimal from serving-optimal, and implicitly accounts for data constraints that can cap D regardless of budget.",
      },
      {
        text: "Put essentially the entire budget into data for a small model — once you pass a token threshold, additional parameters stop mattering.",
        correct: false,
        feedback:
          "Data alone is not the answer: scaling laws make loss a function of both N and D, and the compute-optimal allocation scales the two together rather than starving either term.",
      },
    ],
  },
  {
    id: "ch19-19-2-2",
    chapter: 19,
    chapterTitle: "LLM Pre-Training Internals",
    title: "Explain 3D parallelism and how you’d combine the axes",
    pages: "130",
    route: "/practice/llm-pre-training-internals/explain-3d-parallelism-and-how-youd-combine-the-axes",
    competencies: ["data curation", "tokenization", "scaling laws", "distributed training", "stability"],
    question:
      "You're training a model too large for one node. Walk through tensor, pipeline, and data parallelism and how you'd combine them.",
    options: [
      {
        text: "Run tensor parallelism across the entire cluster — it has the heaviest communication, so giving it the most GPUs keeps it fastest.",
        correct: false,
        feedback:
          "TP's intra-layer communication is the most frequent, which is exactly why it must stay within a node on NVLink; stretching it across nodes puts the chattiest traffic on the slowest links.",
      },
      {
        text: "Replicate the full model on every GPU and use pure data parallelism — the gradient all-reduce is the only communication cost worth engineering around.",
        correct: false,
        feedback:
          "A model too large for one node cannot be replicated per GPU; FSDP/ZeRO sharding exists precisely so that no single GPU holds the full optimizer, gradient, and parameter state.",
      },
      {
        text: "Keep tensor parallelism intra-node across the 8 NVLink GPUs, run pipeline parallelism across a handful of nodes with micro-batching to shrink the bubble, and put data parallelism with FSDP on top across the cluster — adding expert parallelism for MoE.",
        correct: true,
        feedback:
          "Correct. Each axis is mapped onto the network hierarchy — the chattiest comms on the fastest links — while FSDP shards state to stay under per-GPU memory, and each axis's dominant cost is named.",
      },
    ],
  },
  {
    id: "ch19-19-2-3",
    chapter: 19,
    chapterTitle: "LLM Pre-Training Internals",
    title: "How do you keep a months-long training run stable?",
    pages: "130",
    route: "/practice/llm-pre-training-internals/how-do-you-keep-a-months-long-training-run-stable",
    competencies: ["data curation", "tokenization", "scaling laws", "distributed training", "stability"],
    question:
      "A multi-week training run on thousands of GPUs keeps hitting loss spikes and hardware failures. How do you make it robust?",
    options: [
      {
        text: "Treat spikes and hardware failures as separate planned-for classes: LR warmup, gradient clipping, bf16, and skip-and-retry of bad batches for spikes; asynchronous checkpointing, elastic restart, and straggler health checks for hardware — with checkpoint frequency tuned as a cost/risk trade-off.",
        correct: true,
        feedback:
          "Correct. This names both failure classes with their specific mitigations, adds telemetry for diagnosis, and treats checkpoint frequency as an explicit balance between lost compute and I/O overhead.",
      },
      {
        text: "Checkpoint as frequently as possible — with enough checkpoints any failure becomes a minor rewind, so checkpoint frequency is essentially the whole strategy.",
        correct: false,
        feedback:
          "Checkpointing alone does nothing for loss spikes, and taken to the extreme its I/O dominates training; frequency is a cost/risk trade-off, not a quantity to maximize.",
      },
      {
        text: "A loss spike means the data pipeline is poisoned — abort the run, clean the corpus, and restart from scratch.",
        correct: false,
        feedback:
          "Spikes are a known, recoverable failure mode of long runs; the remedy is to skip the pathological batch and rewind to the last good checkpoint, not to discard weeks of compute.",
      },
    ],
  },
  {
    id: "ch19-19-2-4",
    chapter: 19,
    chapterTitle: "LLM Pre-Training Internals",
    title: "Why does tokenizer choice matter, and how would you decide?",
    pages: "131",
    route: "/practice/llm-pre-training-internals/why-does-tokenizer-choice-matter-and-how-would-you-decide",
    competencies: ["data curation", "tokenization", "scaling laws", "distributed training", "stability"],
    question:
      "How much does the tokenizer matter for a pre-trained model, and how would you choose vocabulary size?",
    options: [
      {
        text: "Very little — tokenization is a preprocessing detail, so adopt a standard BPE default and let the model learn around it.",
        correct: false,
        feedback:
          "The tokenizer is fixed before pre-training and baked into the model for life; treating it as a detail forfeits the vocabulary-size, multilingual, and digit-handling trade-offs you can only make now.",
      },
      {
        text: "A great deal — it is near-permanent, so choose vocabulary size against the target distribution: larger vocab with byte-level fallback for multilingual and code workloads, smaller for English-centric models, and verify digit/whitespace handling and per-language fragmentation before freezing.",
        correct: true,
        feedback:
          "Correct. This treats vocabulary size as the key trade-off — sequence length and coverage versus embedding-table size and under-trained rare tokens — and raises the multilingual cost and fairness implication.",
      },
      {
        text: "Always choose the largest vocabulary available, around 256k — fewer tokens per document is strictly better for cost.",
        correct: false,
        feedback:
          "A maximal vocabulary inflates the embedding and output tables, adds parameters, and can leave rare tokens under-trained; the right size depends on the target language and code distribution.",
      },
    ],
  },
];
