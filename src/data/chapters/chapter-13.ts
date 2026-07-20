import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter13Module: LearningModule = {
  id: "chapter-13-llm-inference-optimization",
  title: "LLM Inference Optimization",
  description:
    "Master the serving-side mechanics that decide whether large models can be delivered efficiently in production: KV cache reuse, paged attention, batching policy, GPU memory utilization, and Kubernetes-based autoscaling. Learn to argue the system-level trade-offs between throughput, tail latency, and infrastructure cost.",
  duration: "4 lessons",
  lessons: [
    {
      id: "ch13-prefill-vs-decode",
      title: "Prefill vs Decode Phase",
      prompt: "Read the two phases of every request",
      question:
        "A document Q&A service prepends a 2,000-token retrieved context to every request but generates answers of about 50 tokens. Users complain about time to first token, not generation speed. Which phase should the team attack first, and on what resource?",
      options: [
        "Prefill: it processes all prompt tokens in parallel, is compute-bound, and dominates when prompts are long relative to outputs",
        "Decode: it is memory-bandwidth-bound, so it always dominates latency regardless of prompt length",
        "Decode: generating one token per step means more total steps than the single parallel prefill pass",
      ],
      correct: 0,
      feedback:
        "Correct. With long prompts and short outputs, the parallel, compute-bound prefill pass is where the latency sits; decode bandwidth only matters once tokens start flowing.",
      explanation:
        "Every request runs prefill, which processes all prompt tokens in parallel and populates the KV cache, then decode, which emits one token per step while reading that cache. Prefill is compute-bound; decode is memory-bandwidth-bound. A 2,000-token prompt with a 50-token answer spends most of its latency budget in prefill, so prompt-side work, not per-token decode speed, is the first lever.",
      takeaways: [
        "Prefill processes every prompt token in parallel and is compute-bound.",
        "Decode emits one token per step and is memory-bandwidth-bound because it re-reads the KV cache.",
        "Diagnose which phase dominates from the prompt/output token mix before choosing an optimization.",
      ],
      model: ["Split the request into phases", "Find the bound resource", "Optimize that phase first"],
      source: { chapter: 13, sections: ["13.1.1"], pages: "85" },
    },
    {
      id: "ch13-kv-cache",
      title: "KV Cache",
      prompt: "Size the memory that serving actually runs out of",
      question:
        "You plan to serve Llama-3-70B at FP16 with batch 32 and 4,096-token sequences. The weights take about 140 GB, yet the capacity model says you need on the order of 6-8 H100-80GB GPUs. A teammate insists the FLOP budget fits on two. What explains the gap?",
      options: [
        "Tensor parallelism splits compute unevenly, so most of the extra GPUs are idle spare capacity",
        "The estimate double-counts the weights; 140 GB spread across two 80 GB GPUs is already sufficient",
        "The KV cache, roughly 344 GB worst case at that batch and sequence length, dwarfs the weights and drives GPU count, which is why GQA with 8 KV heads shrinks it about 8x",
      ],
      correct: 2,
      feedback:
        "Correct. At FP16, batch 32, sequence 4,096, the full-attention KV cache is about 344 GB, larger than the roughly 140 GB of weights. KV-cache memory, not FLOPs, is the binding constraint on batch size and context length.",
      explanation:
        "KV cache bytes equal 2 * L * H * d_head * S * B * dtype_bytes; for Llama-3-70B specs (L=80, H=64, d_head=128) at FP16, batch 32, sequence 4,096 that is about 344 GB before weights. Real Llama-3-70B uses grouped-query attention with 8 KV heads instead of 64, cutting the cache about 8x to roughly 43 GB, and FP8 cache storage halves it again. Because the cache is linear in batch and sequence length, those are the most direct dials.",
      takeaways: [
        "Without a KV cache, each decode step recomputes attention over the full context, O(n^2) total; with it, each step is O(n) compute plus O(n) memory reads.",
        "Size the cache with 2 * L * H * d_head * S * B * dtype_bytes before choosing GPUs.",
        "GQA, FP8 cache storage, and smaller batch or context are the three levers against the memory wall.",
      ],
      model: ["Compute worst-case cache", "Apply GQA and dtype", "Dial batch and context"],
      source: { chapter: 13, sections: ["13.1.2"], pages: "85" },
    },
    {
      id: "ch13-paged-attention",
      title: "Paged Attention (vLLM)",
      prompt: "Treat KV memory the way an operating system does",
      question:
        "Your serving stack reserves a contiguous KV block sized for the maximum sequence length for every request. Most requests are far shorter, about 20% of GPU memory is stranded, and running 8 parallel samples per prompt is prohibitively expensive. Which mechanism addresses both problems?",
      options: [
        "Reserve even larger contiguous blocks so any sequence fits, and drop parallel sampling to save memory",
        "Paged attention: allocate fixed-size pages on demand through a block table, and let sequences sharing a prefix share physical pages with copy-on-write",
        "Quantize the KV cache to FP8 so the stranded 20% matters less, keeping contiguous allocation",
      ],
      correct: 1,
      feedback:
        "Correct. Paged attention divides the cache into fixed-size pages allocated on demand, cutting waste from about 20% to under 4%, and copy-on-write page sharing makes parallel sampling, speculative decoding, and beam search cheap.",
      explanation:
        "Contiguous allocation reserves max-length blocks upfront, so short requests strand memory as internal fragmentation of roughly 20%. vLLM's paged attention borrows OS virtual memory: fixed-size pages, a per-request block table mapping logical positions to physical pages, and on-demand allocation. Sequences that share a prefix, whether beam search, parallel sampling, speculative decoding, or shared system prompts, share physical pages until one writes a divergent token.",
      takeaways: [
        "Contiguous max-length reservation wastes about 20% of KV memory to internal fragmentation.",
        "Fixed-size pages with a logical-to-physical block table cut waste below 4%.",
        "Copy-on-write page sharing is what makes prefix caching, parallel sampling, speculative decoding, and beam search memory-efficient.",
      ],
      model: ["Divide cache into pages", "Map logical to physical", "Share until a divergent write"],
      source: { chapter: 13, sections: ["13.1.3"], pages: "86" },
    },
    {
      id: "ch13-continuous-batching",
      title: "Continuous Batching",
      prompt: "Schedule at the iteration level, not the request level",
      question:
        "A GPU endpoint serves a mix of 20-token and 2,000-token generations under static batching. Whenever a long request enters a batch, every short request in that batch waits for it; utilization sags and p99 latency spikes. What scheduling change fixes both?",
      options: [
        "Increase the static batch size so each batch amortizes more work and absorbs the long requests",
        "Switch to dynamic batching that groups requests by arrival time, since arrival-time grouping removes head-of-line blocking",
        "Switch to continuous batching: admit and evict requests at each token-generation step so completed requests are replaced immediately and fast requests never wait behind slow ones",
      ],
      correct: 2,
      feedback:
        "Correct. Continuous (iteration-level) batching adds and removes requests after every token step, lifting throughput 5-10x over static batching and cutting tail latency because fast requests are no longer blocked behind slow ones.",
      explanation:
        "Static batching waits for a full batch, processes it, and releases everything at once, so the slowest request blocks the GPU for all others. Dynamic batching groups by arrival time: better utilization, but each batch still waits for its slowest member. Continuous batching schedules at the iteration level, letting new requests join and completed ones leave after each token step, which keeps the GPU at maximum utilization.",
      takeaways: [
        "Static batching lets one slow request block an entire batch; dynamic batching improves utilization but still waits for the slowest member.",
        "Continuous batching schedules at the token-iteration level and replaces finished requests immediately.",
        "Expect 5-10x throughput over static batching plus a tail-latency win; the differentiator is the p99 insight, not just throughput.",
      ],
      model: ["Compare batch scopes", "Schedule per iteration", "Verify throughput and p99"],
      source: { chapter: 13, sections: ["13.1.4"], pages: "86" },
    },
  ],
};

export const chapter13CourseContent: Record<string, LessonCourseContent> = {
  "ch13-prefill-vs-decode": {
    objectives: [
      "Describe what happens in the prefill and decode phases of a transformer request.",
      "Explain why prefill is compute-bound while decode is memory-bandwidth-bound.",
      "Use the prompt/output token mix to decide whether to optimize time to first token or per-token latency.",
    ],
    sections: [
      {
        heading: "Every request has two phases",
        paragraphs: [
          "Prefill ingests the entire prompt in one parallel pass. Every prompt token runs through the model at once, attention is computed across the full input, and the resulting key-value matrices are written into the KV cache for later use. Because all positions are processed together, this phase behaves like one large matrix multiplication that can saturate GPU compute.",
          "Decode then generates the answer autoregressively, one new token per forward pass. Each step computes K and V for just the new token, appends them to the cache, and reads the cached K/V of all previous tokens to compute attention. The arithmetic per step is small, but the memory traffic grows with the context built so far.",
        ],
      },
      {
        heading: "Why the bottleneck flips between compute and bandwidth",
        paragraphs: [
          "Prefill is compute-bound because the parallel pass over hundreds or thousands of tokens keeps the GPU's math units busy; adding memory bandwidth would not speed it up. Decode is the opposite: each step performs little math but must stream the KV cache out of HBM, so memory bandwidth, not FLOPs, sets the token rate.",
          "This flip explains a common production surprise: a serving stack tuned for one phase can still be unhealthy in the other. Long-prompt workloads such as retrieval-augmented prompts and document Q&A spend their budget in prefill, while long-output workloads such as essay or code generation spend theirs in decode.",
        ],
      },
      {
        heading: "Map metrics to the phase that produces them",
        paragraphs: [
          "Time to first token is almost entirely a prefill phenomenon: the user waits for the prompt pass plus queueing before seeing anything. Per-token latency after the first token is a decode phenomenon, governed by bandwidth and batching. Reporting one blended latency number hides which phase is actually failing.",
          "Instrument the two separately and tie alerts to the token mix of real traffic. When prompts are long and answers short, watch time to first token and prefill queue depth; when answers are long, watch per-token latency and cache read throughput.",
        ],
      },
      {
        heading: "Design consequences of the phase split",
        paragraphs: [
          "Prefill-side levers reduce or avoid prompt work: shorten prompts, and cache the KV of shared prefixes so repeated prompt tokens are not recomputed. Decode-side levers manage the cache and the batch: keep the KV footprint small enough to stay in memory and keep the GPU fed with iteration-level scheduling.",
          "Hardware and capacity choices follow the same split. A prefill-heavy product leans on compute; a decode-heavy product leans on memory bandwidth and HBM capacity. Sizing a fleet without knowing the workload's phase mix usually means paying for the wrong resource.",
        ],
      },
    ],
    example: {
      title: "Worked example: document Q&A with slow first tokens",
      scenario:
        "A legal research assistant prepends a 4,096-token retrieved context to every question and returns answers of roughly 60 tokens. Users rate the product as slow even though token generation itself feels instant once it starts.",
      analysis:
        "The token mix says prefill dominates: each request spends its latency budget on a single parallel pass over 4,096 prompt tokens, while decode runs only about 60 steps. Because prefill is compute-bound, the fix is to reduce or reuse prompt computation, not to add decode-side batching.",
      decision:
        "Measure time to first token and per-token latency separately, enable prefix caching for the shared instruction portion of the prompt, cap retrieved context to what answers actually need, and re-check TTFT before buying more GPUs.",
    },
    productionChecklist: [
      "Track time to first token and per-token latency as separate metrics.",
      "Record the prompt/completion token mix per endpoint to know which phase dominates.",
      "Cache the KV of shared prompt prefixes instead of recomputing them per request.",
      "Budget prefill compute capacity for peak long-prompt traffic.",
      "Alert on context-length growth, which silently inflates both prefill cost and cache size.",
    ],
    commonMistakes: [
      "Quoting a single blended latency number that hides whether prefill or decode is slow.",
      "Adding decode-side batching to fix a time-to-first-token problem caused by long prompts.",
      "Forgetting that prefill also populates the KV cache decode depends on, so skipping it is not an option.",
      "Assuming more GPU compute helps a decode-bound workload that is actually limited by memory bandwidth.",
    ],
    knowledgeChecks: [
      {
        id: "ch13-prefill-vs-decode-kc-1",
        prompt: "A meeting-summary product sends 3,000-token transcripts as prompts and returns 100-token summaries. The team wants to cut perceived latency. Which phase should they optimize first, and why does it dominate here?",
        options: [
          "Prefill, because all 3,000 prompt tokens are processed in one parallel compute-bound pass that dwarfs the roughly 100 decode steps",
          "Decode, because every request spends most of its time emitting tokens one step at a time regardless of prompt length",
          "Neither; the two phases always split latency evenly, so only queueing can be optimized",
        ],
        correct: 0,
        feedback: "Correct. Prefill processes all prompt tokens in parallel and is compute-bound; with a 3,000-token prompt and a 100-token output, the prefill pass dominates latency while decode contributes only about 100 short steps.",
      },
      {
        id: "ch13-prefill-vs-decode-kc-2",
        prompt: "In the legal research assistant example, each question carries a 4,096-token retrieved context and answers run about 60 tokens. Users call the product slow even though generation feels instant once it starts. What does this symptom pattern tell you?",
        options: [
          "Decode is the bottleneck because 60 sequential steps always outweigh one parallel prefill pass",
          "Time to first token is a prefill phenomenon, so the single parallel pass over 4,096 prompt tokens is where the wait sits",
          "The KV cache is corrupted, forcing every decode step to recompute attention over the full context",
        ],
        correct: 1,
        feedback: "Correct. Prefill is compute-bound and determines time to first token; with long prompts and short outputs the user's wait is the prompt pass, which is why the fix targets prompt-side work rather than decode batching.",
      },
      {
        id: "ch13-prefill-vs-decode-kc-3",
        prompt: "An on-call engineer sees the blended average latency of a chat endpoint double after prompts grew from 500 to 2,500 tokens, while per-token speed after the first token stayed flat. What is the most likely diagnosis?",
        options: [
          "Decode bandwidth saturated, because per-token speed after the first token is always the first thing to degrade",
          "The serving engine silently switched to static batching, so each batch now waits for its slowest request",
          "Prefill cost grew linearly with prompt length; the blended metric hid the phase split because decode speed never changed",
        ],
        correct: 2,
        feedback: "Correct. Longer prompts mean a longer compute-bound prefill pass, which inflates time to first token while per-token decode latency stays flat; only phase-split metrics reveal which phase actually regressed.",
      },
      {
        id: "ch13-prefill-vs-decode-kc-4",
        prompt: "A PM proposes solving all latency complaints by buying GPUs with more compute for a decode-bound long-generation workload. How do you defend a different allocation of the budget using the phase model?",
        options: [
          "Decode is memory-bandwidth-bound, not compute-bound, so extra FLOPs will not raise token rate; invest in memory bandwidth and cache capacity instead",
          "Agree, because prefill and decode are both compute-bound and faster math units speed up every phase",
          "Reject all hardware changes, since the phase split means latency can only be improved by rewriting prompts",
        ],
        correct: 0,
        feedback: "Correct. The phase split in this lesson says decode performs little math per step but streams the KV cache from HBM, so memory bandwidth, not FLOPs, sets the token rate for long-generation workloads.",
      },
      {
        id: "ch13-prefill-vs-decode-kc-5",
        prompt: "Before rolling out a prompt-shortening change, which measurement plan would actually prove it helped the prefill-heavy endpoint, and which signals would you watch after release?",
        options: [
          "Watch only end-to-end average latency, because a single blended number captures every phase improvement",
          "Track time to first token and per-token latency separately, plus the prompt/completion token mix per endpoint, and alert on context-length growth",
          "Measure GPU temperature and fan speed, since prefill is compute-bound and thermal load is the leading indicator",
        ],
        correct: 1,
        feedback: "Correct. Time to first token is a prefill signal and per-token latency is a decode signal; the production habit is to track both separately, record the token mix, and alert on context-length growth that inflates prefill cost.",
      },
    ],
  },
  "ch13-kv-cache": {
    objectives: [
      "Explain what the KV cache stores and how it changes decoding complexity.",
      "Compute KV-cache memory for a given model, batch, sequence length, and dtype.",
      "Choose among GQA, FP8 cache storage, and batch/context reduction to fit a serving budget.",
    ],
    sections: [
      {
        heading: "What the cache stores and why it exists",
        paragraphs: [
          "During decode, computing attention for a new token requires the keys and values of every previous token. Without a cache, each step would recompute K and V for the whole prefix, making total inference cost quadratic in output length. The KV cache stores those matrices once, so each step computes K and V only for the new token and appends them.",
          "That changes per-step work from recomputing the full context to one token's worth of compute plus a read of the cached entries: O(n) compute and O(n) memory reads per step instead of O(n^2) recomputation overall. The trade is explicit: decode stops being compute-hungry and becomes memory-hungry, which is why cache capacity management becomes the central serving problem.",
        ],
      },
      {
        heading: "Sizing the cache before you size the fleet",
        paragraphs: [
          "KV cache bytes = 2 * L * H * d_head * S * B * dtype_bytes, where the leading 2 covers K and V, L is layers, H is attention heads, d_head is head dimension, S is sequence length, and B is batch size. Every factor is linear, which makes estimation straightforward and makes batch and sequence the most direct dials.",
          "Worked example: Llama-3-70B (L=80, H=64, d_head=128) at FP16, batch 32, sequence 4,096 gives 2*80*64*128*4096*32*2 bytes, about 344 GB (roughly 320 GiB), before the approximately 140 GB of weights. Holding weights plus cache at that operating point needs on the order of 6-8 H100-80GB GPUs connected with tensor parallelism over a fast NVLink/NVSwitch interconnect.",
        ],
      },
      {
        heading: "The three levers against the memory wall",
        paragraphs: [
          "Grouped-query attention reduces the number of KV heads: real Llama-3-70B uses 8 KV heads instead of 64, shrinking the worked-example cache about 8x to roughly 43 GB. Modern models reduce KV heads deliberately because of this wall, so always use the model's actual KV-head count in the formula rather than its query-head count.",
          "KV-cache quantization stores the cache in FP8 instead of FP16, halving it again. And because the cache is linear in batch size and sequence length, capping concurrency or context is the most direct operational dial when memory runs out.",
        ],
      },
      {
        heading: "Why this is the binding serving constraint",
        paragraphs: [
          "The interview-grade takeaway is that KV-cache memory, not raw FLOPs, usually binds batch size and context length in LLM serving. It is the reason GQA, paged attention, and FP8 caches exist at all.",
          "Operationally this means capacity planning starts from the cache: compute worst-case and GQA-adjusted footprints per replica, then decide how much HBM headroom remains for weights, activations, and fragmentation before setting concurrency limits.",
        ],
      },
    ],
    example: {
      title: "Worked example: capacity planning for a 70B chat deployment",
      scenario:
        "A team must serve a Llama-3-70B chat product with 4,096-token conversations and a target of 32 concurrent sequences per replica on H100-80GB GPUs.",
      analysis:
        "Naive math with 64 KV heads gives a roughly 344 GB cache plus about 140 GB of weights, on the order of 6-8 GPUs per replica. The model's actual GQA configuration uses 8 KV heads, cutting the cache to about 43 GB; FP8 cache storage can halve it again, and lowering max concurrency or context cuts it linearly.",
      decision:
        "Size the replica from the GQA-adjusted cache plus weights, keep batch and context caps as configured dials, reserve memory-utilization headroom, and validate the plan with a load test at the target concurrency before committing the fleet.",
    },
    productionChecklist: [
      "Compute worst-case and GQA-adjusted KV-cache bytes per replica before selecting GPUs.",
      "Use the model's real KV-head count, not its query-head count, in the sizing formula.",
      "Set explicit max sequence length and max concurrent-sequence limits.",
      "Choose cache dtype (FP16 vs FP8) deliberately and verify the quality impact.",
      "Leave HBM headroom for weights, activations, and fragmentation instead of budgeting to 100%.",
    ],
    commonMistakes: [
      "Budgeting GPU memory for weights only and discovering the KV cache at the first OOM.",
      "Plugging the full query-head count into the formula for a model that actually uses GQA.",
      "Assuming FLOPs, not cache memory, limit batch size and context length.",
      "Forgetting that the cache grows linearly with both batch size and sequence length.",
    ],
    knowledgeChecks: [
      {
        id: "ch13-kv-cache-kc-1",
        prompt: "Your team must double the maximum sequence length from 4,096 to 8,192 tokens on a 70B deployment that already runs near the HBM limit. Using the KV cache formula, what happens to per-sequence cache memory and what is the cleanest counter-move?",
        options: [
          "Cache memory quadruples, because the formula is quadratic in sequence length; counter by reducing batch size fourfold",
          "Cache memory stays flat, because the cache only depends on model layers and heads; no counter-move is needed",
          "Cache memory doubles, because the cache is linear in S; counter by halving batch size or applying FP8 cache storage",
        ],
        correct: 2,
        feedback: "Correct. KV cache bytes are 2*L*H*d_head*S*B*dtype_bytes, linear in both S and B; doubling S doubles the cache, and this lesson's direct dials are smaller batch, shorter context, or FP8 quantization.",
      },
      {
        id: "ch13-kv-cache-kc-2",
        prompt: "Apply this lesson's capacity-planning worked example: Llama-3-70B (80 layers, 64 heads, head dim 128) at FP16, batch 32, sequence 4,096. Which capacity conclusion follows from computing 2*80*64*128*4096*32*2 bytes?",
        options: [
          "The cache is about 344 GB, larger than the roughly 140 GB of weights, so holding both needs on the order of 6-8 H100-80GB GPUs with tensor parallelism",
          "The cache is about 43 GB, so a single H100-80GB comfortably holds weights plus cache at this operating point",
          "The cache is about 1.4 TB, so this model cannot be served on any current GPU fleet",
        ],
        correct: 0,
        feedback: "Correct. The full-attention computation gives roughly 344 GB (about 320 GiB) before weights; the 43 GB figure is the GQA-adjusted value with 8 KV heads, not the worst case the formula computes with 64 heads.",
      },
      {
        id: "ch13-kv-cache-kc-3",
        prompt: "A serving team sized its fleet from the 140 GB weight footprint alone, and replicas now OOM whenever concurrency approaches the target of 32 sequences at 4,096 tokens. What did the capacity plan miss?",
        options: [
          "Weight fragmentation across tensor-parallel shards, which always doubles the effective weight footprint",
          "The KV cache, which at that batch and sequence length is hundreds of gigabytes and is usually the binding constraint, not FLOPs or weights",
          "CUDA context overhead, which is the dominant memory consumer in every LLM serving stack",
        ],
        correct: 1,
        feedback: "Correct. This lesson's central warning is budgeting GPU memory for weights only and discovering the KV cache at the first OOM; the cache, not raw FLOPs, usually binds batch size and context length.",
      },
      {
        id: "ch13-kv-cache-kc-4",
        prompt: "A colleague proposes cutting the KV cache by switching the deployment to FP8 cache storage, while another wants to halve the batch cap instead. Defend a position using this lesson's three levers against the memory wall.",
        options: [
          "FP8 cache storage is always wrong because 8-bit formats destroy attention quality in every model",
          "Halving batch is always wrong because batch size never appears in the KV cache formula",
          "Both are legitimate levers: FP8 halves the cache via dtype_bytes while batch and sequence are the direct linear dials, so choose based on quality tolerance and traffic shape",
        ],
        correct: 2,
        feedback: "Correct. This lesson lists GQA, KV-cache quantization to FP8, and smaller batch or shorter context as the three levers against the memory wall; the formula shows exactly where each one acts.",
      },
      {
        id: "ch13-kv-cache-kc-5",
        prompt: "You changed the serving configuration to GQA-adjusted sizing and FP8 cache storage. Which validation routine confirms the memory plan before committing the fleet to production traffic?",
        options: [
          "Compute worst-case and GQA-adjusted cache bytes per replica, keep HBM headroom for weights and fragmentation, then load-test at target concurrency",
          "Run the model once on a laptop GPU and extrapolate linearly to the full fleet",
          "Skip memory validation and rely on the autoscaler to add nodes whenever replicas OOM",
        ],
        correct: 0,
        feedback: "Correct. The production routine is to size from the GQA-adjusted cache plus weights, reserve memory-utilization headroom, and validate with a load test at the target concurrency before committing hardware.",
      },
    ],
  },
  "ch13-paged-attention": {
    objectives: [
      "Explain why contiguous KV-cache allocation fragments GPU memory.",
      "Describe the page and block-table mechanism behind paged attention.",
      "Show how copy-on-write page sharing enables parallel sampling, speculative decoding, and prefix caching.",
    ],
    sections: [
      {
        heading: "The fragmentation problem in naive serving",
        paragraphs: [
          "Traditional serving reserves one contiguous KV block per request, sized for the maximum sequence length the deployment allows. Most real requests are far shorter than that maximum, so the reserved-but-unused tail of each block is stranded: internal fragmentation of roughly 20% of KV memory.",
          "That waste directly raises cost. Memory that could hold more concurrent sequences sits idle, and because KV memory is the binding constraint on batch size, fragmentation silently caps throughput.",
        ],
      },
      {
        heading: "Pages and block tables",
        paragraphs: [
          "Paged attention applies the operating-system virtual-memory idea to the KV cache. The cache is divided into fixed-size pages, for example 16 tokens each, and pages are allocated on demand as tokens are generated instead of being reserved upfront.",
          "Each request keeps a logical block table that maps its logical token positions to physical pages, so a sequence's cache no longer needs to be contiguous. Allocation granularity matches actual usage, which is what drives memory waste from about 20% down to under 4%.",
        ],
      },
      {
        heading: "Copy-on-write: one mechanism, many features",
        paragraphs: [
          "When multiple sequences share a common prefix and then diverge, their shared prefix pages are stored once. A page is copied only when a sequence actually writes a divergent token: copy-on-write. This is not just a beam-search trick.",
          "The same mechanism serves parallel sampling (n candidate completions from one prompt share the prompt's pages), speculative decoding (draft and verified sequences share prefix pages), beam search, and shared system-prompt prefixes across concurrent requests.",
        ],
      },
      {
        heading: "What paging unlocks in production",
        paragraphs: [
          "Near-zero fragmentation, under 4%, translates into 2-4x throughput over naive serving on the same hardware, because far more sequences fit in the same HBM. Paging is also the substrate that makes prefix caching practical: cached prefixes live as shareable pages.",
          "The validation loop is memory-centric. Watch fragmentation, page-pool occupancy, and cache hit rates, and confirm the features that depend on sharing, such as n>1 sampling, speculative decoding, and beam search, actually hit shared pages rather than duplicating memory.",
        ],
      },
    ],
    example: {
      title: "Worked example: a code assistant with 8-way sampling",
      scenario:
        "A code-generation product returns 8 candidate completions per prompt. With contiguous KV allocation, each candidate reserves its own max-length block, GPU memory strands at about 20%, and the sampling feature multiplies memory pressure.",
      analysis:
        "All 8 candidates share the same prompt prefix, so their prefix pages are identical. Paged attention stores those pages once with copy-on-write and allocates new pages only as each candidate diverges, while on-demand allocation removes the max-length reservation waste.",
      decision:
        "Move serving to a paged-attention engine such as vLLM, enable prefix caching for the shared system prompt, keep 8-way sampling, and verify with memory-occupancy and fragmentation metrics before and after.",
    },
    productionChecklist: [
      "Serve with an engine that implements paged attention, such as vLLM, instead of contiguous pre-allocation.",
      "Enable prefix caching so shared system-prompt pages are reused across requests.",
      "Monitor page-pool occupancy, fragmentation, and prefix cache hit rate.",
      "Load-test copy-on-write paths with n>1 sampling and beam search before enabling them at scale.",
      "Keep max sequence limits configured so page allocation stays bounded under abuse.",
    ],
    commonMistakes: [
      "Reserving contiguous max-length KV blocks per request and accepting about 20% waste as normal.",
      "Assuming copy-on-write only matters for beam search, when it also powers parallel sampling and speculative decoding.",
      "Turning on a paged engine but never enabling prefix caching, leaving shared-prefix savings unrealized.",
      "Treating quantization as a substitute for paging: one shrinks each entry, the other removes allocation waste.",
    ],
    knowledgeChecks: [
      {
        id: "ch13-paged-attention-kc-1",
        prompt: "Traffic analysis shows most requests use under 800 tokens, but the serving stack reserves 8,192-token contiguous KV blocks for every request. Which change directly removes the resulting memory waste, and why?",
        options: [
          "Raise the reservation to 16,384 tokens so every request fits without reallocation",
          "Adopt paged attention, which allocates fixed-size pages on demand instead of reserving max-length blocks, cutting waste from about 20% to under 4%",
          "Compress prompts so every request uses exactly the same length as the reservation",
        ],
        correct: 1,
        feedback: "Correct. The waste is internal fragmentation from contiguous over-allocation; paged attention's on-demand fixed-size pages with a block table match allocation to actual usage, which this lesson quantifies as roughly 20% down to under 4%.",
      },
      {
        id: "ch13-paged-attention-kc-2",
        prompt: "In the code assistant example, 8 candidate completions are generated per prompt. Under paged attention with copy-on-write, what happens to the KV pages holding the shared prompt prefix across those 8 candidates?",
        options: [
          "Each candidate duplicates the prefix pages, because isolation between samples requires full copies",
          "The prefix pages are evicted immediately after prefill, since decode never reads them again",
          "They are stored once and shared by all candidates; a page is copied only when a candidate writes a divergent token",
        ],
        correct: 2,
        feedback: "Correct. Copy-on-write keeps shared prefix pages stored once for sequences that share a common prefix and then diverge, which is exactly what makes parallel sampling memory-efficient.",
      },
      {
        id: "ch13-paged-attention-kc-3",
        prompt: "A team migrated to a paged-attention engine but memory usage per request barely improved, and every request still recomputes the shared 500-token system prompt. What is the most likely misconfiguration?",
        options: [
          "Prefix caching was never enabled, so the shared system-prompt pages are recomputed instead of being reused across requests",
          "The block table is too small, so pages are allocated twice per token",
          "Paged attention fundamentally cannot share pages, so the observations prove the engine is working as designed",
        ],
        correct: 0,
        feedback: "Correct. This lesson ties prefix caching to the page-sharing mechanism; a common mistake is turning on a paged engine without enabling prefix caching, leaving shared-prefix savings unrealized (vLLM exposes --enable-prefix-caching).",
      },
      {
        id: "ch13-paged-attention-kc-4",
        prompt: "A reviewer argues that KV-cache quantization to FP8 makes paged attention unnecessary, since both save memory. How do you defend keeping paged attention in the design?",
        options: [
          "Concede: quantization and paging do the same thing, so keeping both is redundant engineering",
          "They attack different problems: quantization shrinks each cache entry while paging removes allocation waste and enables copy-on-write page sharing for sampling and speculative decoding",
          "Reject quantization entirely, because paged attention already provides all the memory savings available",
        ],
        correct: 1,
        feedback: "Correct. FP8 halves entry size via dtype_bytes; paged attention fixes internal fragmentation and unlocks prefix caching, parallel sampling, speculative decoding, and beam search through page sharing. The mechanisms compose rather than substitute.",
      },
      {
        id: "ch13-paged-attention-kc-5",
        prompt: "After enabling paged attention and 8-way sampling, which monitoring and test plan confirms the expected memory and throughput benefits in production?",
        options: [
          "Check model accuracy once a week; memory behavior is fully determined by the engine and needs no monitoring",
          "Track only tokens per second, because throughput is the single metric that paged attention affects",
          "Monitor page-pool occupancy, fragmentation, and prefix cache hit rate, and load-test the copy-on-write paths with n>1 sampling before scaling them",
        ],
        correct: 2,
        feedback: "Correct. The production routine for this mechanism is memory-centric: watch fragmentation and cache hit rates, and verify the features that depend on page sharing, such as n>1 sampling and beam search, under load.",
      },
    ],
  },
  "ch13-continuous-batching": {
    objectives: [
      "Contrast static, dynamic, and continuous batching for LLM decode.",
      "Explain iteration-level scheduling and why it raises utilization.",
      "Tie continuous batching to both the 5-10x throughput gain and the tail-latency improvement.",
    ],
    sections: [
      {
        heading: "Static batching and head-of-line blocking",
        paragraphs: [
          "Static batching waits until a batch is full, processes all requests together, and releases them all at once. Generation lengths vary enormously in real traffic, so the slowest request in each batch decides when the GPU becomes available again.",
          "The result is head-of-line blocking: short requests idle inside finished-but-unreleased slots, utilization sags, and tail latency is set by the longest generation in every batch.",
        ],
      },
      {
        heading: "Dynamic batching: better utilization, same batch boundary",
        paragraphs: [
          "Dynamic batching groups requests by arrival time instead of waiting for a fixed full batch, which improves utilization and reduces queueing delay for bursty traffic.",
          "But a batch is still a batch: once grouped, all member requests run until the slowest finishes. Arrival-time grouping does not remove head-of-line blocking inside the group, so the tail-latency problem survives.",
        ],
      },
      {
        heading: "Iteration-level scheduling",
        paragraphs: [
          "Continuous batching schedules at the token-generation step. After each iteration, completed requests are evicted and waiting requests are admitted, so the batch composition changes every step rather than every request lifetime.",
          "Because LLM decode is already iterative, one token per step, the serving engine gets a natural scheduling point for free. The GPU stays at maximum utilization without making any request wait for a batch-mate's remaining tokens.",
        ],
      },
      {
        heading: "The measured win and how to verify it",
        paragraphs: [
          "The headline result is a 5-10x throughput improvement over static batching, and the second result is lower tail latency: fast requests stop being trapped behind slow ones. Senior answers name both, because the p99 insight is what distinguishes the mechanism from just batching more.",
          "Validate with throughput and latency distributions together: tokens per second and GPU utilization for the throughput claim, p95/p99 per-request latency segmented by output length for the tail-latency claim. Watch queue policy under overload so iteration-level admission stays bounded.",
        ],
      },
    ],
    example: {
      title: "Worked example: a chat API with mixed output lengths",
      scenario:
        "A support chat API serves short confirmations alongside 2,000-token troubleshooting walkthroughs. Under static batching, p99 latency is dominated by whichever batch happens to contain a walkthrough, and GPUs idle between batches.",
      analysis:
        "The bottleneck is scheduling granularity, not capacity: long requests hold batch slots hostage. Moving admission and eviction to the token-iteration level lets short requests finish and leave immediately while long ones keep their slot.",
      decision:
        "Enable continuous batching in the serving engine, keep a bounded waiting queue, and re-measure tokens per second and p99 by output-length cohort to confirm both the throughput and tail-latency wins.",
    },
    productionChecklist: [
      "Run the serving engine with continuous (iteration-level) batching enabled.",
      "Set bounded max-batch and queue-wait policies for overload conditions.",
      "Track tokens per second, GPU utilization, and p95/p99 latency by output-length cohort.",
      "Test behavior when memory pressure forces preemption or eviction of running sequences.",
      "Re-validate latency SLOs after changing batch or queue configuration.",
    ],
    commonMistakes: [
      "Scaling static batch size to fix latency, which makes head-of-line blocking worse.",
      "Calling arrival-time dynamic batching continuous and expecting the tail-latency win.",
      "Celebrating throughput gains without checking p99 for short-request cohorts.",
      "Ignoring queue policy, so overload turns iteration-level admission into unbounded waiting.",
    ],
    knowledgeChecks: [
      {
        id: "ch13-continuous-batching-kc-1",
        prompt: "An internal tool serves 30-token acknowledgments and 3,000-token reports from the same GPU pool under static batching, and short-request users see multi-second stalls. Which scheduling change addresses the stalls without new hardware?",
        options: [
          "Continuous batching, so requests are admitted and evicted at every token-generation step and short requests stop waiting behind 3,000-token generations",
          "Larger static batches, so the GPU processes more requests per batch and amortizes the stalls",
          "Separate models for short and long requests, because batching policy cannot change request-level waiting",
        ],
        correct: 0,
        feedback: "Correct. Static batching blocks the whole batch on its slowest request; iteration-level scheduling replaces completed requests after each token step, which this lesson credits with 5-10x throughput and lower tail latency.",
      },
      {
        id: "ch13-continuous-batching-kc-2",
        prompt: "In the support chat API example, p99 latency under static batching was dominated by whichever batch contained a 2,000-token walkthrough. After enabling continuous batching, what should the latency distribution show?",
        options: [
          "No change, because batching policy affects throughput but never tail latency",
          "Higher p99 for short requests, because iteration-level scheduling starves small generations",
          "Lower p99 for short-request cohorts, because fast requests are no longer trapped behind slow ones, alongside 5-10x higher throughput",
        ],
        correct: 2,
        feedback: "Correct. The senior-level point in this lesson is that continuous batching improves both throughput (5-10x over static) and tail latency; validating by output-length cohort shows short requests stop waiting behind long ones.",
      },
      {
        id: "ch13-continuous-batching-kc-3",
        prompt: "A team claims it enabled continuous batching, but p99 latency is unchanged and traces show batches still launch together and release together, grouped by arrival window. What is the most likely explanation?",
        options: [
          "The GPU lacks memory bandwidth, which makes every batching policy behave identically",
          "They actually configured dynamic batching by arrival time, which improves utilization but still waits for the slowest member of each batch",
          "Continuous batching always preserves p99, so the traces confirm a correct rollout",
        ],
        correct: 1,
        feedback: "Correct. This lesson distinguishes dynamic from continuous: arrival-time grouping still runs each batch until its slowest member finishes, so head-of-line blocking and the tail-latency problem survive.",
      },
      {
        id: "ch13-continuous-batching-kc-4",
        prompt: "A stakeholder proposes fixing tail latency by tripling the static batch size, arguing that bigger batches mean more throughput and therefore faster requests. How do you push back using the scheduling model?",
        options: [
          "Agree fully: larger static batches reduce per-request waiting by definition",
          "Suggest disabling batching entirely, since any form of batching necessarily adds latency",
          "Bigger static batches worsen head-of-line blocking because more requests wait for the slowest generation; the fix is finer scheduling granularity at the token-iteration level",
        ],
        correct: 2,
        feedback: "Correct. Static batching releases all requests at once, so scaling it up makes more requests wait on the slowest one; continuous batching's per-iteration admission and eviction is the mechanism that lowers tail latency.",
      },
      {
        id: "ch13-continuous-batching-kc-5",
        prompt: "You are rolling out continuous batching to production. Which measurement plan verifies both promised benefits and guards the overload path?",
        options: [
          "Track tokens per second and GPU utilization for throughput, p95/p99 by output-length cohort for tail latency, and test bounded queue policy under overload",
          "Measure only average latency before and after, since averages capture both throughput and tail behavior",
          "Watch CPU utilization on the serving pods, because batching efficiency is a CPU-side phenomenon",
        ],
        correct: 0,
        feedback: "Correct. The validation plan pairs throughput signals (tokens per second, utilization) with cohort-level p95/p99 for the tail-latency claim, plus a bounded waiting queue so iteration-level admission stays controlled under overload.",
      },
    ],
  },
};

export const chapter13Practice: CatalogPracticeUnit[] = [
  {
    id: "ch13-13-2-1",
    chapter: 13,
    chapterTitle: "LLM Inference Optimization",
    title: "How would you optimize prompt token recomputation across requests?",
    pages: "86",
    route: "/practice/llm-inference-optimization/how-would-you-optimize-prompt-token-recomputation-across-requests",
    competencies: ["prefill/decode", "KV cache", "paged attention", "batching", "GPU autoscaling"],
    question:
      "Interviewer (senior level): \"Your platform prepends the same 500-token system prompt to every request, about 10,000 requests per hour. How would you optimize the system so the model does not recompute the same prompt tokens repeatedly across requests?\" Which answer is strongest?",
    options: [
      {
        text: "Use prefix caching with radix attention: compute the system prompt's KV once, store it in a radix tree keyed by token hash, and on each new request hash the prefix tokens and skip prefill on a match. In vLLM that is the --enable-prefix-caching flag, and at this volume it typically saves 30-50% of prefill compute.",
        correct: true,
        feedback:
          "Correct. The senior answer works at the KV level: identical prefix tokens produce identical K/V matrices, so caching them in a radix tree and skipping their prefill is exact. At 10K requests/hour, a 500-token shared prefix saves 10,000 x 500 token prefills, typically 30-50% of total prefill compute.",
      },
      {
        text: "Cache the final generated response for identical requests and return it without calling the model, which avoids all recomputation.",
        correct: false,
        feedback:
          "Response caching is a different layer: it only helps for fully identical requests and does nothing for a shared system prompt followed by different user questions, which is the case the interviewer described.",
      },
      {
        text: "Recomputation is unavoidable because each request is a fresh model call; the best you can do is shorten the system prompt.",
        correct: false,
        feedback:
          "Re-running prefill on shared prefix tokens is exactly the problem. Their K/V matrices are identical across requests, so skipping that recomputation is safe, and that is precisely what prefix caching does.",
      },
    ],
  },
  {
    id: "ch13-13-2-2",
    chapter: 13,
    chapterTitle: "LLM Inference Optimization",
    title: "What is KV Cache and why is it critical for LLM serving?",
    pages: "87",
    route: "/practice/llm-inference-optimization/what-is-kv-cache-and-why-is-it-critical-for-llm-serving",
    competencies: ["prefill/decode", "KV cache", "paged attention", "batching", "GPU autoscaling"],
    question:
      "Interviewer (mid level): \"What is KV cache in transformer inference, and why is it critical for LLM serving performance?\" Which response would earn the strongest rating?",
    options: [
      {
        text: "It stores past tokens so the model can look them up instead of regenerating them, which makes long outputs faster.",
        correct: false,
        feedback:
          "\"It stores past tokens\" is the junior answer. Without the complexity change and the HBM consequence, it does not explain why the cache is critical to serving.",
      },
      {
        text: "It caches the key and value matrices of all previous tokens so each decode step computes K/V only for the new token: per-step work drops from O(n^2) recomputation to O(n) compute dominated by memory reads, a 50-200x speedup on long outputs. The catch is that the cache consumes GPU HBM, so managing it becomes the core LLM-serving problem.",
        correct: true,
        feedback:
          "Correct. The senior answer names the mechanism (append-only K/V matrices), the complexity shift (O(n^2) to O(n) per step), the 50-200x long-output speedup, and the consequence: the cache consumes HBM, so managing it is the central serving problem.",
      },
      {
        text: "It is a weights cache that keeps model parameters in HBM between requests so the model does not need to be reloaded.",
        correct: false,
        feedback:
          "Weights are loaded once regardless of any cache. The KV cache holds per-sequence attention state that grows with sequence length and batch size, a completely different memory.",
      },
    ],
  },
  {
    id: "ch13-13-2-3",
    chapter: 13,
    chapterTitle: "LLM Inference Optimization",
    title: "How does paged attention work?",
    pages: "87",
    route: "/practice/llm-inference-optimization/how-does-paged-attention-work",
    competencies: ["prefill/decode", "KV cache", "paged attention", "batching", "GPU autoscaling"],
    question:
      "Interviewer (senior level): \"Explain paged attention and why it matters for production LLM serving.\" Which answer best demonstrates mechanism-level understanding?",
    options: [
      {
        text: "It compresses KV entries so more of them fit in HBM, trading a small quality loss for higher capacity.",
        correct: false,
        feedback:
          "That describes KV-cache quantization. Paged attention changes allocation granularity, not entry precision: it removes reservation waste rather than shrinking entries.",
      },
      {
        text: "It pages memory between GPU and CPU so sequences larger than HBM can still be served, at some latency cost.",
        correct: false,
        feedback:
          "That describes offloading. Paged attention keeps the cache on GPU and attacks internal fragmentation and prefix sharing, not GPU/CPU swapping.",
      },
      {
        text: "It divides the KV cache into fixed-size pages with a per-request block table mapping logical positions to physical pages, allocates pages on demand instead of reserving max-length blocks, and cuts internal fragmentation from about 20% to under 4%. Copy-on-write page sharing is what makes prefix caching, beam search, parallel sampling, and speculative decoding cheap, and together this yields 2-4x throughput over naive serving.",
        correct: true,
        feedback:
          "Correct. This names the problem (contiguous over-allocation stranding about 20%), the mechanism (pages, block table, on-demand allocation, copy-on-write), and the payoff: near-zero fragmentation, 2-4x throughput, and the page sharing that parallel sampling and speculative decoding rely on.",
      },
    ],
  },
  {
    id: "ch13-13-2-4",
    chapter: 13,
    chapterTitle: "LLM Inference Optimization",
    title: "What techniques optimize GPU memory usage for LLM serving?",
    pages: "88",
    route: "/practice/llm-inference-optimization/what-techniques-optimize-gpu-memory-usage-for-llm-serving",
    competencies: ["prefill/decode", "KV cache", "paged attention", "batching", "GPU autoscaling"],
    question:
      "Interviewer (senior level): \"List and explain the techniques for reducing GPU memory consumption when serving large LLMs.\" Which answer shows the breadth and trade-off awareness expected at this level?",
    options: [
      {
        text: "Walk the full toolkit with each lever's cost: INT8/INT4 weight quantization (GPTQ, AWQ, bitsandbytes; 2-4x smaller with under 2% quality loss), FP8 KV cache (halves cache memory), flash attention (O(n) memory instead of O(n^2) attention matrices), paged attention (near-zero fragmentation), tensor parallelism (shards weights across GPUs), speculative decoding (fewer large-model forward passes), weight offloading to CPU RAM (DeepSpeed ZeRO), and selective layer activation via mixture-of-experts routing.",
        correct: true,
        feedback:
          "Correct. The senior signal is breadth plus trade-offs: weight quantization, FP8 cache, flash attention, paged attention, tensor parallelism, speculative decoding, offloading, and selective activation, each with the quality or latency cost it carries.",
      },
      {
        text: "Quantize the model to INT4. Quantization is the standard answer, and the other techniques are marginal compared to its 4x size reduction.",
        correct: false,
        feedback:
          "A single-lever answer misses the point of the question. The interviewer asked for the full toolkit, and cache memory, fragmentation, and attention-matrix memory each need their own lever.",
      },
      {
        text: "Move the whole model to CPU RAM and stream layers onto the GPU per request, which removes the GPU memory limit entirely.",
        correct: false,
        feedback:
          "Full CPU streaming destroys latency for interactive serving. Offloading inactive layers, as in DeepSpeed ZeRO, is a targeted lever, not a wholesale replacement for GPU residency.",
      },
    ],
  },
  {
    id: "ch13-13-2-5",
    chapter: 13,
    chapterTitle: "LLM Inference Optimization",
    title: "How do continuous batching and dynamic batching improve throughput?",
    pages: "88",
    route: "/practice/llm-inference-optimization/how-do-continuous-batching-and-dynamic-batching-improve-throughput",
    competencies: ["prefill/decode", "KV cache", "paged attention", "batching", "GPU autoscaling"],
    question:
      "Interviewer (senior level): \"Compare static batching, dynamic batching, and continuous batching. Why is continuous batching superior?\" Which answer is strongest?",
    options: [
      {
        text: "Dynamic batching is superior because grouping requests by arrival time lets the GPU process compatible requests together without idle gaps.",
        correct: false,
        feedback:
          "Dynamic batching improves utilization, but its batches still finish together, so head-of-line blocking survives. It is not superior to iteration-level scheduling.",
      },
      {
        text: "Static batching blocks the whole batch on its slowest request, and dynamic batching still waits for the slowest member of each arrival group. Continuous batching admits and evicts requests at every token-generation step, keeping the GPU fully utilized, lifting throughput 5-10x over static batching, and lowering tail latency because fast requests no longer wait behind slow ones.",
        correct: true,
        feedback:
          "Correct. The answer contrasts all three scheduling scopes and names both wins: 5-10x throughput and the tail-latency improvement. Interviewers use the p99 insight to separate senior from junior answers.",
      },
      {
        text: "All three are equivalent for autoregressive models; batching policy only matters for training throughput, not inference.",
        correct: false,
        feedback:
          "Batching policy is one of the highest-leverage inference decisions. Decode is already iterative, so scheduling at the iteration level directly multiplies serving throughput.",
      },
    ],
  },
  {
    id: "ch13-13-2-6",
    chapter: 13,
    chapterTitle: "LLM Inference Optimization",
    title: "How do you design a scalable LLM inference service on Kubernetes?",
    pages: "89",
    route: "/practice/llm-inference-optimization/how-do-you-design-a-scalable-llm-inference-service-on-kubernetes",
    competencies: ["prefill/decode", "KV cache", "paged attention", "batching", "GPU autoscaling"],
    question:
      "Interviewer (staff level): \"Design a Kubernetes-based LLM inference service that can autoscale from 10 to 1000 requests per second.\" Which set of design choices best demonstrates staff-level ownership?",
    options: [
      {
        text: "A standard Deployment with many replicas behind a load balancer, scaled on CPU utilization like any stateless web service.",
        correct: false,
        feedback:
          "CPU is not the bottleneck for GPU inference, so CPU-based autoscaling reacts to the wrong signal. The staff answer scales on queue depth and handles GPU node provisioning explicitly.",
      },
      {
        text: "A single large GPU node with the biggest available instance type, since vertical scaling avoids distributed-systems complexity.",
        correct: false,
        feedback:
          "One large node is a single point of failure and cannot track a 10-to-1000 RPS swing; it also ignores availability mechanisms such as PodDisruptionBudgets.",
      },
      {
        text: "A vLLM Deployment pinned to GPU nodes with tensor-parallel sizing and --gpu-memory-utilization tuned, --enable-prefix-caching on, an HPA scaling pods on vllm_queue_depth rather than CPU, a PodDisruptionBudget keeping at least 2 replicas running, and a node auto-provisioner such as Karpenter on GKE/EKS adding GPU nodes when pods go pending.",
        correct: true,
        feedback:
          "Correct. This is the reference design: scale pods on queue depth (the right signal for GPU work), size tensor parallelism and GPU memory utilization explicitly, guarantee availability with a PodDisruptionBudget, and let a node auto-provisioner grow the GPU fleet as pods pend.",
      },
    ],
  },
];
