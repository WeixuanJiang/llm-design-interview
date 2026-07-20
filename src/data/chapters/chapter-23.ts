import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter23Module: LearningModule = {
  id: "chapter-23-inference-cost-engineering",
  title: "Inference Cost Engineering",
  description:
    "For most LLM products, inference — not training — is the dominant lifetime cost. Treat cost as a first-class engineering target: model per-token unit economics, trade precision for memory and throughput, exploit batching economics, and route each request to the cheapest configuration that still meets quality and latency SLAs.",
  duration: "4 lessons",
  lessons: [
    {
      id: "ch23-token-unit-economics",
      title: "The Unit Economics of a Token",
      prompt: "Model cost per token before trying to reduce it",
      question:
        "A serving team knows only its total monthly GPU invoice and wants to cut the LLM bill. What should they build first?",
      options: [
        "A unit-cost model — $ per 1M tokens derived from GPU $/hr and achieved throughput — with spend attributed per request type and split into prefill and decode tokens",
        "A benchmark of smaller replacement models ranked by public quality scores",
        "A procurement review to negotiate a lower GPU hourly rate",
      ],
      correct: 0,
      feedback:
        "Strong choice. Without a $-per-token model and prefill/decode attribution, the team cannot know which lever — throughput, token count, or GPU price — actually moves its bill.",
      explanation:
        "The fundamental metric is $ per 1M tokens: GPU $/hr divided by tokens/sec/GPU × 3600, scaled to a million. A request's cost is roughly input tokens × prefill cost plus output tokens × decode cost, and decode usually dominates because it is per-token and bandwidth-bound — so a few verbose endpoints often drive the invoice.",
      takeaways: [
        "Cost per 1M tokens = GPU $/hr ÷ (tokens/sec/GPU × 3600), scaled up — throughput and price, not model size alone, set unit cost.",
        "Decode usually dominates a request's cost because it is per-token and memory-bandwidth-bound.",
        "The three primal levers are raising throughput, cutting token count, and lowering GPU $/hr.",
      ],
      model: ["Model $ per 1M tokens", "Attribute spend by request type and phase", "Pull the highest-leverage lever"],
      source: { chapter: 23, sections: ["23.1.1"], pages: "144" },
    },
    {
      id: "ch23-quantization-trade-offs",
      title: "Quantization Trade-offs",
      prompt: "Trade bits for memory and throughput — empirically",
      question:
        "A 70B model barely fits its GPUs and the team wants larger batches. An engineer proposes an immediate fleet-wide cutover to INT4 weight-only quantization. What step must come before the cutover?",
      options: [
        "Confirm from the vendor's published benchmarks that INT4 is near-lossless for this model class",
        "Validate quality on the team's own eval — sensitivity is task-dependent, with math, code, and multi-step reasoning more sensitive than chat — and A/B the quantized model against full precision in production",
        "Quantize the KV cache to FP8 instead, since cache memory is always the binding constraint",
      ],
      correct: 1,
      feedback:
        "Strong choice. Quantization is an empirical decision: the quality cost is model- and task-dependent, so only the team's own eval and a production A/B can set the precision.",
      explanation:
        "The precision ladder runs from FP16/BF16 baseline, to near-lossless INT8/FP8, to INT4 weight-only (AWQ/GPTQ) at roughly 4× smaller with a small quality loss — the common production sweet spot. The governing rule is to quantize as aggressively as the eval allows, not as aggressively as possible.",
      takeaways: [
        "FP8/INT8 is near-lossless for most models and almost always worth taking.",
        "INT4 weight-only (AWQ/GPTQ) gives ~4× memory reduction for a small, measurable quality cost — the common production sweet spot.",
        "KV-cache quantization (FP8) is a separate decision that halves cache memory to enable larger batches or longer context.",
      ],
      model: ["Name the constraint: memory or throughput", "Pick a rung on the precision ladder", "Validate on your eval, then A/B"],
      source: { chapter: 23, sections: ["23.1.2"], pages: "144" },
    },
    {
      id: "ch23-batching-economics",
      title: "Batching Economics",
      prompt: "Amortize weight streaming without breaking the latency SLA",
      question:
        "A low-traffic internal tool serves an 8B model on a dedicated GPU with batch size near one, and its per-token cost is several times higher than the shared platform's. What explains most of the gap?",
      options: [
        "The 8B model is too small to saturate the GPU's compute units, so the hardware is wasted on it",
        "The tool's prompts are longer than the platform's, and prefill dominates its bill",
        "Decode is bandwidth-bound: the largely fixed per-step cost of streaming weights from memory is amortized across the batch, so tiny batches and idle GPUs make every token expensive",
      ],
      correct: 2,
      feedback:
        "Strong choice. Throughput per GPU rises steeply with batch size because the per-step weight-streaming cost is shared; low-traffic services sit at the expensive end of that curve.",
      explanation:
        "Batching cuts cost per token until the GPU saturates, but larger batches raise per-request latency and KV-cache memory — the throughput/latency/memory trilemma. The economic implication is direct: consolidate low-traffic services into shared pools, pack variants with multi-LoRA, and route to shared capacity to cut unit cost.",
      takeaways: [
        "Throughput per GPU rises steeply with batch size until saturation, because the fixed per-step weight-streaming cost is shared across the batch.",
        "The catch is per-request and tail latency plus KV-cache memory; continuous batching captures most of the gain without static batching's latency penalty.",
        "Low-traffic services are expensive per token — consolidate traffic, use multi-LoRA packing, and share serving pools.",
      ],
      model: ["Amortize the fixed per-step cost", "Respect the latency SLA", "Fit the KV-cache memory budget"],
      source: { chapter: 23, sections: ["23.1.3"], pages: "145" },
    },
    {
      id: "ch23-model-routing",
      title: "Model Routing and the Quality/Cost Frontier",
      prompt: "Send every request to the cheapest model that can handle it",
      question:
        "A product sends 100% of traffic to its largest model, and logs suggest most queries are routine. What is usually the single largest cost lever available?",
      options: [
        "A router or cascade that serves the easy majority on a small, cheap model and escalates only hard or low-confidence queries to the large one",
        "INT4 quantization of the flagship model to shrink its memory footprint",
        "A shorter system prompt to cut prefill cost on every request",
      ],
      correct: 0,
      feedback:
        "Strong choice. Routing often cuts cost 5–10× on the easy majority with minimal quality loss; combined with caching and output-length limits it is usually the biggest lever in a mature system.",
      explanation:
        "A cascade runs the cheap model first and escalates only when its confidence is low; a classifier router makes the call upfront. The savings must be guarded: escalation thresholds are validated so quality stays within SLA instead of quietly failing the hard queries that were misrouted.",
      takeaways: [
        "Not every request needs the biggest model — routing often cuts cost 5–10× on the easy majority with minimal quality loss.",
        "A cascade runs the cheap model first and escalates on low confidence; a classifier router decides before generation.",
        "Combined with prompt caching and output-length limits, routing is usually the single largest cost lever in a mature system.",
      ],
      model: ["Split traffic by measured difficulty", "Escalate low-confidence or hard queries", "Validate quality per tier against the SLA"],
      source: { chapter: 23, sections: ["23.1.4"], pages: "145" },
    },
  ],
};

export const chapter23CourseContent: Record<string, LessonCourseContent> = {
  "ch23-token-unit-economics": {
    objectives: [
      "Express serving cost as $ per 1M tokens from GPU price and achieved throughput.",
      "Decompose a request's cost into prefill and decode phases and explain why decode dominates.",
      "Prioritize the three primal levers — throughput, token count, and GPU price — by measured leverage.",
    ],
    sections: [
      {
        heading: "Price the token, not the model",
        paragraphs: [
          "The fundamental cost metric is $ per 1M tokens, derived from throughput in tokens/sec/GPU and the GPU's hourly price: cost per 1M tokens equals GPU $/hr divided by (tokens/sec/GPU × 3600), scaled to a million. Every serving change — a different GPU, a new batching policy, a lower precision — moves unit cost through exactly these two channels, so an optimization that cannot be expressed in this formula cannot be evaluated.",
          "Throughput is dominated by batch size and by the prefill/decode split. Continuous batching amortizes the memory-bandwidth cost of streaming the weights across many requests, so the same GPU produces far more tokens per hour when it is kept full. This is why two deployments of the same model on the same hardware can have very different unit costs.",
        ],
      },
      {
        heading: "Prefill versus decode",
        paragraphs: [
          "A request's cost is roughly input tokens × prefill cost plus output tokens × decode cost. Prefill processes the prompt in parallel, while decode generates tokens one at a time, and each decode step re-streams the weights and KV cache from HBM — making decode per-token and bandwidth-bound.",
          "Because decode usually dominates, the shape of the workload matters more than its volume: a few verbose endpoints often drive the bill. Attribution must therefore split input and output tokens per request type before any optimization begins, or the team will compress prompts while the real cost leaks out through unbounded outputs.",
        ],
      },
      {
        heading: "The three primal levers",
        paragraphs: [
          "Raise throughput: ensure continuous batching is actually saturating the GPU, apply weight quantization such as AWQ/INT4, and use speculative decoding — all three produce more tokens per second on the same hardware. Cut tokens: cap output length per use case, compress and shorten prompts, and cache — a semantic cache for repeated queries, a prefix cache for shared system prompts. A token you do not generate is the cheapest token.",
          "Lower $/hr: right-size the GPU to the SLA — do not serve an 8B model on an H100 if an L4 meets latency — and use spot capacity for batch work. Price leverage also includes the structural moves: consolidating traffic and routing to shared pools so hardware is not idle.",
        ],
      },
      {
        heading: "Attribute, optimize, re-measure",
        paragraphs: [
          "The working loop starts with attribution: current spend per request type, split into prefill and decode tokens, so the endpoints that actually drive the bill are visible. Only then does it make sense to choose a lever — throughput, tokens, routing, or price — in order of measured leverage rather than fashion.",
          "Re-measure $ per 1M tokens after each change so you know it actually moved, and guard quality with an eval so a cost cut does not silently regress the product. The interview differentiator is exactly this: a quantitative cost model driving prioritization, not a list of optimizations.",
        ],
      },
    ],
    example: {
      title: "Worked example: the runaway chat bill",
      scenario:
        "A chat product's monthly inference spend has tripled in a quarter. Traffic grew only 40%, leadership wants a plan, and the team initially assumes the model is simply too big.",
      analysis:
        "The unit-cost model shows throughput per GPU is healthy, but attribution reveals two endpoints whose average output length doubled after a prompt change; decode tokens, not traffic or model size, drove the increase. The primal levers rank themselves: token count first, then throughput, then price.",
      decision:
        "Cap output length per use case, compress the two verbose prompts, and add a semantic cache for repeated questions — re-measuring $ per 1M tokens weekly and gating each change on the quality eval before considering any model swap.",
    },
    productionChecklist: [
      "Express every serving change as a before/after $ per 1M tokens delta.",
      "Attribute spend per endpoint with a prefill/decode token split.",
      "Measure throughput per GPU under real batched traffic, not single-stream tests.",
      "Re-measure unit cost after each optimization lands.",
      "Gate every cost cut on the quality eval so savings cannot silently regress the product.",
    ],
    commonMistakes: [
      "Trying to cut the bill from an aggregate invoice with no per-request attribution.",
      "Assuming long prompts are the main cost when decode usually dominates.",
      "Judging GPUs by hourly price alone instead of $ per token at achieved throughput.",
      "Reaching for a smaller model before checking verbose outputs and missing caches.",
    ],
    knowledgeChecks: [
      {
        id: "ch23-token-unit-economics-kc-1",
        prompt: "A finance partner asks why two deployments of the same model on identical GPUs have very different inference bills. Which explanation is grounded in the unit-cost formula?",
        options: [
          "Cost per 1M tokens is GPU $/hr divided by achieved tokens/sec/GPU times 3600, so the deployment with better batching and higher throughput pays less per token",
          "The cheaper deployment must be running a smaller model, because model size alone sets the per-token price",
          "The difference comes from the GPU purchase contract, since hourly price is the only term in the unit-cost formula",
        ],
        correct: 0,
        feedback: "Correct. The unit-cost formula in this lesson puts achieved throughput in the denominator of $ per 1M tokens, so identical GPUs diverge when one sustains far more tokens per second through batching.",
      },
      {
        id: "ch23-token-unit-economics-kc-2",
        prompt: "In the worked example, a chat product's bill tripled while traffic grew only 40 percent. Applying the lesson, which diagnostic step confirms the real driver before any optimization begins?",
        options: [
          "Benchmark a smaller replacement model on public quality suites to confirm the flagship is oversized",
          "Attribute spend per endpoint with a prefill/decode split to find the verbose endpoints whose decode tokens drove the increase",
          "Compare GPU hourly rates across cloud vendors to see whether the price term in the formula moved",
        ],
        correct: 1,
        feedback: "Correct. The worked example's analysis confirms exactly this: attribution per endpoint with a prefill/decode split exposed the verbose outputs, because decode usually dominates the bill.",
      },
      {
        id: "ch23-token-unit-economics-kc-3",
        prompt: "A team proudly reports it cut prompt lengths in half, yet the monthly inference bill barely moved. Using the unit-economics model, what is the most likely diagnosis of why the savings never materialized?",
        options: [
          "The prompt compression introduced a quality regression that offset all of the savings",
          "The GPUs must have become less utilized, so the hourly price term rose after the change",
          "Decode, not prefill, dominates their bill — output tokens were untouched, and decode is per-token and bandwidth-bound",
        ],
        correct: 2,
        feedback: "Correct. The prefill-versus-decode section shows request cost is input tokens times prefill cost plus output tokens times decode cost — and decode usually dominates, so cutting only prompts cannot move a decode-heavy bill.",
      },
      {
        id: "ch23-token-unit-economics-kc-4",
        prompt: "A reviewer proposes renegotiating the GPU contract as the first cost move. How do you defend prioritizing throughput and token levers first, using the unit-cost formula from this lesson?",
        options: [
          "Hourly price is only one of three primal levers; batching, quantization, caching, and length caps often move the formula more, and price work does not fix an idle or decode-heavy deployment",
          "GPU contracts cannot be renegotiated mid-term, so price leverage never exists in practice",
          "Throughput levers require no measurement at all, while price changes always need a full re-benchmark of the model",
        ],
        correct: 0,
        feedback: "Correct. The lesson names three primal levers — throughput, token count, and GPU price — and ranks them by measured leverage, with right-sizing and spot as price moves rather than the first move.",
      },
      {
        id: "ch23-token-unit-economics-kc-5",
        prompt: "Your team has shipped three separate cost optimizations this quarter. Which measurement practice does this lesson prescribe to confirm each change actually reduced unit cost without harming the product?",
        options: [
          "Compare quarterly aggregate invoices, since unit-cost deltas are too noisy to attribute to individual changes",
          "Re-measure $ per 1M tokens after each change lands, and guard every cost cut with the quality eval so savings cannot silently regress the product",
          "Track GPU utilization dashboards only, because higher utilization always translates one-to-one into lower cost per token",
        ],
        correct: 1,
        feedback: "Correct. The lesson's operating loop is attribute, optimize, re-measure: $ per 1M tokens is re-measured after each change and every cut is gated on the quality eval, which is what makes the program credible.",
      },
    ],
  },
  "ch23-quantization-trade-offs": {
    objectives: [
      "Describe the precision ladder from FP16/BF16 through INT8/FP8 to INT4 weight-only and KV-cache FP8.",
      "Choose a quantization level from the binding constraint — memory or throughput.",
      "Validate precision empirically with a task-cohort eval and a production A/B before cutover.",
    ],
    sections: [
      {
        heading: "What quantization buys",
        paragraphs: [
          "Quantization shrinks weights — and optionally the KV cache and activations — to fewer bits, reducing memory footprint and raising throughput on the same hardware. It is the most direct way to change the $ per 1M tokens formula: smaller weights mean a cheaper GPU or a larger batch, and faster weight streaming means more tokens per second.",
          "The exchange is a small, measurable quality cost for large memory and throughput gains, which makes the decision empirical rather than dogmatic. The size of that quality cost is model- and task-dependent, so no universal rule can pick the precision for you.",
        ],
      },
      {
        heading: "The precision ladder",
        paragraphs: [
          "FP16/BF16 is the baseline: full quality at full memory. INT8/FP8 is roughly 2× smaller and faster and near-lossless for most models — almost always worth taking. INT4 weight-only quantization (GPTQ/AWQ) is roughly 4× smaller with a small quality loss and is the common production sweet spot.",
          "KV-cache quantization to FP8 is a separate decision from weight quantization: it halves cache memory, which enables larger batches or longer context. Weight-only quantization (AWQ/GPTQ) is the common production choice because it captures the large memory and throughput win while keeping the quality cost small and measurable.",
        ],
      },
      {
        heading: "Start from the constraint",
        paragraphs: [
          "If memory is the bottleneck — the model barely fits, or you want bigger batches or longer context — quantize the weights and/or the KV cache to relieve it. If throughput and cost are the goal, quantization raises tokens/sec and compounds with batching, since both push the same unit-cost formula.",
          "Naming the constraint first prevents a common misapplication: choosing a precision because it is popular rather than because it relieves the measured limit. The same ladder rung can be right for a memory-bound 70B deployment and pointless for a compute-bound small model that already fits comfortably.",
        ],
      },
      {
        heading: "Validate on your own workload",
        paragraphs: [
          "Quality loss is task-dependent: chat tolerates INT4 well, but math, code, and multi-step reasoning are more sensitive. A benchmark on the actual workload decides the precision — not a public leaderboard and not the vendor's marketing table.",
          "Before cutting over, A/B the quantized model in production against the full-precision one on quality and latency. The governing rule: quantize as aggressively as the eval allows, not as aggressively as possible.",
        ],
      },
    ],
    example: {
      title: "Worked example: one ladder, two cohorts",
      scenario:
        "A team serving a support copilot wants INT4 weight-only quantization to double effective GPU capacity. Its eval suite covers conversational answers and a billing-calculation cohort that requires multi-step arithmetic.",
      analysis:
        "On eval, the chat cohort is flat at INT4 while the billing cohort regresses measurably — consistent with reasoning and math tasks being more sensitive to precision than chat. A single fleet-wide precision would either waste memory or break the sensitive cohort.",
      decision:
        "Ship INT4 weights for the chat traffic, keep the billing path at higher precision, and A/B both against full precision in production on quality and latency before the fleet-wide cutover.",
    },
    productionChecklist: [
      "Record whether memory or throughput is the binding constraint before choosing a precision.",
      "Evaluate quantized quality per task cohort — chat, code, math, reasoning — not one aggregate score.",
      "Treat KV-cache quantization as a separate decision from weight quantization.",
      "A/B quantized versus full precision on quality and latency before cutover.",
      "Re-run the eval whenever the model version or workload mix changes.",
    ],
    commonMistakes: [
      "Assuming INT4 is free because a public benchmark looked fine.",
      "Collapsing weight and KV-cache quantization into one decision.",
      "Cutting over the whole fleet at once with no A/B against full precision.",
      "Using one blended quality score that hides a reasoning-cohort regression.",
    ],
    knowledgeChecks: [
      {
        id: "ch23-quantization-trade-offs-kc-1",
        prompt: "A served 70B model barely fits its GPUs and the team wants larger batches for cheaper tokens. According to the precision ladder, which first move best fits this memory-bound constraint?",
        options: [
          "Keep FP16 weights and buy larger GPUs, because any precision change always costs measurable quality",
          "Move straight to 2-bit weights, since more compression always means proportionally more savings",
          "Apply INT4 weight-only quantization (AWQ/GPTQ) — roughly 4× smaller with a small quality cost — and consider KV-cache FP8 to relieve cache memory",
        ],
        correct: 2,
        feedback: "Correct. The precision-ladder section calls weight-only INT4 (AWQ/GPTQ) the common production sweet spot for memory relief, with KV-cache FP8 as the separate lever that halves cache memory for larger batches.",
      },
      {
        id: "ch23-quantization-trade-offs-kc-2",
        prompt: "In the worked example, INT4 leaves the chat cohort flat but regresses the billing-calculation cohort. What does this outcome illustrate about how a team should choose its precision level?",
        options: [
          "Quality loss is task-dependent — math, code, and multi-step reasoning are more sensitive than chat — so an eval on the actual workload decides the precision per cohort",
          "INT4 is fundamentally broken for production use and should never have been tested on any cohort",
          "The billing cohort result is measurement noise, because public benchmarks already proved INT4 near-lossless",
        ],
        correct: 0,
        feedback: "Correct. This is the worked example's exact outcome: quality loss is model- and task-dependent — reasoning and math are more sensitive than chat — so the eval on the actual workload decides the precision.",
      },
      {
        id: "ch23-quantization-trade-offs-kc-3",
        prompt: "Two weeks after an INT4 fleet-wide cutover, aggregate quality looks stable but the code-assistant cohort's severe errors have risen sharply. What process failure best explains how this regression shipped?",
        options: [
          "The GPUs were faulty, since quantization by definition cannot change output quality",
          "The team validated on one blended score and skipped the per-cohort eval plus a production A/B against full precision, hiding the sensitive cohort's regression",
          "The KV cache was not quantized at the same time, which always corrupts code outputs",
        ],
        correct: 1,
        feedback: "Correct. The lesson requires validating on your own eval and A/B-ing against full precision before cutover; sensitivity is task-dependent, so one blended score hides exactly this kind of cohort regression.",
      },
      {
        id: "ch23-quantization-trade-offs-kc-4",
        prompt: "A cautious tech lead argues no production model should ever be quantized because the quality risk cannot be bounded. How do you defend a measured quantization program against this position?",
        options: [
          "Agree — the quality cost is inherently unmeasurable, so quantization belongs only in research settings",
          "Disagree and quantize everything to INT4 immediately, since benchmark results transfer across workloads",
          "The trade is a small, measurable quality cost for large memory and throughput gains: FP8/INT8 is near-lossless for most models, and eval plus A/B validation bounds the risk before cutover",
        ],
        correct: 2,
        feedback: "Correct. The lesson frames quantization as an empirical trade — FP8/INT8 near-lossless for most models — governed by the rule to go only as aggressive as the eval allows on the actual workload.",
      },
      {
        id: "ch23-quantization-trade-offs-kc-5",
        prompt: "Your team has chosen INT4 weights for a chat deployment. Which release sequence matches this lesson's guidance for validating the precision decision before and during the production rollout?",
        options: [
          "Benchmark the actual workload by task cohort, then A/B the quantized model against full precision in production on quality and latency before fully cutting over",
          "Cut over the whole fleet at once, then watch the aggregate quality dashboard for a month",
          "Rely on the quantization library's published perplexity numbers and skip production measurement",
        ],
        correct: 0,
        feedback: "Correct. The lesson's governing rule is to validate on your own eval by cohort — sensitivity is task-dependent — then A/B the quantized model in production on quality and latency before the full cutover.",
      },
    ],
  },
  "ch23-batching-economics": {
    objectives: [
      "Explain why decode's bandwidth-bound weight streaming makes batch size the dominant throughput lever.",
      "Name the two limits on batch size — latency and KV-cache memory — and how continuous batching relaxes them.",
      "Apply the economic implication: consolidate low-traffic services into shared, packed serving pools.",
    ],
    sections: [
      {
        heading: "The mechanism: amortizing weight streaming",
        paragraphs: [
          "Decode is memory-bandwidth-bound: every step streams the model weights and KV cache from HBM to produce tokens, and that weight-streaming cost is largely fixed per step regardless of how many requests are in the batch. The GPU spends its time moving weights, not computing on any single request.",
          "Adding requests to the batch therefore produces more tokens for roughly the same streaming cost — throughput per GPU rises steeply and $ per token falls — until the GPU's compute or memory saturates and the curve flattens. Batching is not free efficiency; it is amortization of a fixed cost that exists whether one request or sixty are decoding.",
        ],
      },
      {
        heading: "Catch one: latency",
        paragraphs: [
          "A larger batch means each request waits for the whole batch's step, so per-request latency — and especially tail latency — rises with batch size. There is a genuine throughput/latency trade-off, and an interactive SLA caps how large the batch can go.",
          "The operating point is therefore the largest batch that still meets the latency budget, not the largest batch the hardware can hold. In practice, teams tune continuous batching against the P95 latency limit rather than against a throughput maximum.",
        ],
      },
      {
        heading: "Catch two: KV-cache memory",
        paragraphs: [
          "Each request's KV cache consumes HBM, so batch size is bounded by cache memory even when compute headroom remains. Long contexts make this bind earlier, since cache size grows with sequence length.",
          "This is why KV-cache quantization and paged attention matter economically: they let the batch grow. Continuous batching admits and retires requests at the token level, capturing most of the throughput benefit without static batching's latency penalty — requests no longer wait for a fixed batch window to fill or drain.",
        ],
      },
      {
        heading: "The economics of low traffic",
        paragraphs: [
          "Low-traffic services are expensive per token: small batches and idle GPUs mean the fixed per-step cost is spread over very few tokens. A dedicated GPU serving a quiet internal tool can cost several times more per token than the same model on a busy shared platform.",
          "The structural fixes follow directly: consolidate traffic into shared serving pools, pack multiple LoRA variants onto one base model, and route requests to shared capacity. For a low-QPS service, these moves usually cut unit cost more than any kernel-level optimization available to it alone.",
        ],
      },
    ],
    example: {
      title: "Worked example: three assistants, one pool",
      scenario:
        "Three internal assistants each run a dedicated GPU at low QPS. Each bill is small in absolute terms, but finance flags that their combined per-token cost is several times the company platform's.",
      analysis:
        "At batch size near one, every decode step streams full weights for a single request, and the GPUs idle between requests — none of the three services can reach the steep part of the batching curve alone. The models are related variants, so they can share one base deployment.",
      decision:
        "Consolidate the three models into one continuously batched serving pool with multi-LoRA packing, enforce a per-request latency budget, and right-size the shared GPU tier instead of paying for three idle accelerators.",
    },
    productionChecklist: [
      "Measure the throughput-versus-batch curve on your own hardware and model.",
      "Set the batch ceiling from the P95 latency SLA, not from memory alone.",
      "Track KV-cache memory as the binding constraint on concurrency.",
      "Prefer continuous batching over static batches for interactive traffic.",
      "Consolidate low-traffic models into shared pools before buying more capacity.",
    ],
    commonMistakes: [
      "Saying bigger batches are more efficient without naming the bandwidth-amortization mechanism.",
      "Raising the batch ceiling while ignoring tail latency against the SLA.",
      "Letting KV-cache growth exhaust HBM at peak concurrency.",
      "Leaving low-QPS models on dedicated, mostly idle GPUs.",
    ],
    knowledgeChecks: [
      {
        id: "ch23-batching-economics-kc-1",
        prompt: "An executive asks why the shared platform's per-token cost is several times lower than a dedicated low-traffic deployment of the same model. Which mechanism explanation is the correct one?",
        options: [
          "The platform negotiated a lower GPU hourly rate, which is the main driver of per-token cost",
          "Decode is bandwidth-bound: the largely fixed per-step weight-streaming cost is amortized across the batch, so the platform's larger batches produce far more tokens per GPU-hour",
          "The platform runs a smaller model variant, and model size alone determines cost per token",
        ],
        correct: 1,
        feedback: "Correct. The mechanism section shows throughput per GPU rises steeply with batch size because weight streaming is a fixed per-step cost — small batches and idle GPUs sit at the expensive end of that curve.",
      },
      {
        id: "ch23-batching-economics-kc-2",
        prompt: "In the worked example, three internal assistants each idle on dedicated GPUs at batch size near one. Which consolidation move does the batching-economics analysis in this lesson directly motivate?",
        options: [
          "Buy each assistant a larger GPU so each one can eventually batch more requests",
          "Reduce each assistant's context window so their prompts cost less per request",
          "Merge the three variants into one continuously batched shared serving pool with multi-LoRA packing, so combined traffic reaches the steep part of the batching curve",
        ],
        correct: 2,
        feedback: "Correct. The low-traffic section's economic implication is consolidating traffic, multi-LoRA packing, and shared pools — exactly the consolidation the worked example's decision adopts over per-service tuning.",
      },
      {
        id: "ch23-batching-economics-kc-3",
        prompt: "After raising the batch ceiling to cut costs, an interactive product sees P95 latency blow through its SLA while throughput gains flatten out. What went wrong in batching terms?",
        options: [
          "The team pushed past saturation: each request now waits for the whole batch's step, so per-request and tail latency rose while the throughput curve had already flattened",
          "Batching reduces total GPU work, so the latency increase must be a networking issue unrelated to batch size",
          "The KV cache was too small to matter, proving memory never actually limits batch size in practice",
        ],
        correct: 0,
        feedback: "Correct. The lesson names latency as the first catch — larger batches raise per-request and especially tail latency — and the throughput curve flattens at saturation, so pushing past it buys nothing.",
      },
      {
        id: "ch23-batching-economics-kc-4",
        prompt: "A colleague argues for simply setting the largest batch that fits in HBM, since bigger batches are always more efficient. How do you defend a smaller, SLA-derived operating point for an interactive product?",
        options: [
          "Concede — efficiency per token is the only objective that matters for an interactive product",
          "The trilemma has three terms: beyond the latency SLA the batch hurts users, and KV-cache memory bounds concurrency anyway — the right point maximizes throughput inside both budgets",
          "Reject batching entirely and serve batch size one, because any batching violates interactive latency",
        ],
        correct: 1,
        feedback: "Correct. The lesson frames the throughput/latency/memory trilemma: push batch size only up to the point still inside the latency SLA and the KV memory budget, not the largest batch that fits.",
      },
      {
        id: "ch23-batching-economics-kc-5",
        prompt: "You are tuning continuous batching for an interactive endpoint. Which measurement approach matches this lesson's guidance for finding and holding the right production operating point?",
        options: [
          "Maximize tokens per second in an offline load test and copy that batch size into production",
          "Copy the platform team's batch ceiling, since batching behavior is hardware-independent",
          "Measure the throughput-versus-batch curve on your own hardware, then set the ceiling where P95 latency stays inside the SLA and KV-cache memory still fits at peak concurrency",
        ],
        correct: 2,
        feedback: "Correct. The lesson's operating point is empirical: hold batch size where P95 latency still meets the SLA and KV memory still fits — continuous batching then captures most of the gain without static batching's latency penalty.",
      },
    ],
  },
  "ch23-model-routing": {
    objectives: [
      "Frame model tiers as a quality/cost frontier and explain why not every request needs the biggest model.",
      "Distinguish classifier routers from confidence-based cascades.",
      "Guard routing savings with validated escalation thresholds and per-tier quality measurement.",
    ],
    sections: [
      {
        heading: "The quality/cost frontier",
        paragraphs: [
          "Model tiers trace a quality/cost frontier: larger models buy quality on hard queries at much higher per-token cost. Not every request sits on the part of the frontier that needs the flagship — routine queries get no measurable benefit from the extra spend.",
          "The design question is therefore not which model to serve, but which model serves which request. Serving one tier for all traffic pays flagship prices for queries a small model answers equally well, and that waste compounds with every million tokens.",
        ],
      },
      {
        heading: "Routers and cascades",
        paragraphs: [
          "A router — a classifier — decides upfront which tier handles the query, sending easy traffic to a small, cheap model and escalating hard ones to the large model. A cascade instead runs the cheap model first and escalates only when its confidence is low.",
          "Both patterns often cut cost 5–10× on the easy majority with minimal quality loss. The cascade spends a small amount of cheap compute on every request to buy confidence information; the classifier spends it upfront on a routing decision.",
        ],
      },
      {
        heading: "Guard the escalation threshold",
        paragraphs: [
          "The failure mode is misclassification: a hard query held on the small model is a quality regression paid for with savings. Escalation thresholds must be validated so that quality never drops below the SLA — the router is itself a model and must be evaluated like one.",
          "Measure route accuracy and quality by tier, not one blended score, so a miscalibrated threshold shows up as a tier-level regression rather than hiding inside an average. The savings are real only when the escalated hard queries still get flagship-quality answers.",
        ],
      },
      {
        heading: "Routing in the cost stack",
        paragraphs: [
          "Combined with prompt caching and output-length limits, routing is usually the single largest cost lever in a mature system. A semantic cache can eliminate the call entirely for repeated questions; a length cap bounds the decode cost of what remains.",
          "In a full design, routing and caching do most of the work before you touch the model itself; throughput optimizations — batching, quantization, speculative decoding — then cheapen the traffic that survives. Order matters because each lever shrinks the base the next one applies to.",
        ],
      },
    ],
    example: {
      title: "Worked example: tiered customer support",
      scenario:
        "A support product sends every conversation to its largest model. Review shows most queries are routine — order status, policy lookups — with a long tail of genuinely hard troubleshooting sessions.",
      analysis:
        "A cascade can answer the routine majority on a small model and escalate low-confidence or complex sessions, cutting cost several-fold. The identified risk is an over-tight threshold holding hard troubleshooting on the small tier, so the threshold is tuned on the quality eval rather than on cost targets.",
      decision:
        "Deploy the cascade with an escalation threshold validated against the quality SLA, add a semantic cache for repeated questions, and monitor escalation rate plus per-tier quality continuously.",
    },
    productionChecklist: [
      "Split traffic by measured difficulty, not by intuition about which queries look easy.",
      "Validate escalation thresholds against the quality SLA before rollout.",
      "Track cost, quality, and escalation rate per tier.",
      "Pair routing with semantic/prefix caching and output-length caps.",
      "Re-validate the router whenever a model tier or the traffic mix changes.",
    ],
    commonMistakes: [
      "Routing all traffic to the flagship because quality matters, without measuring the easy majority.",
      "Tuning the escalation threshold for cost while letting quality fall below SLA.",
      "Measuring only blended quality, which hides which tier regressed.",
      "Treating routing as a substitute for caching and output-length limits instead of combining them.",
    ],
    knowledgeChecks: [
      {
        id: "ch23-model-routing-kc-1",
        prompt: "A product sends all traffic to its flagship model, and a review shows most queries are routine. Which design best captures the quality/cost frontier argument from this section?",
        options: [
          "Keep the flagship for everything, because uniform quality is worth any premium",
          "Downgrade every request to the smallest model, since routine queries dominate volume",
          "Add a router or cascade that serves the easy majority on a small cheap model and escalates only hard or low-confidence queries — often a 5–10× cut on the easy traffic",
        ],
        correct: 2,
        feedback: "Correct. The frontier section states not every request needs the biggest model; a router or cascade often cuts cost 5–10× on the easy majority with minimal quality loss.",
      },
      {
        id: "ch23-model-routing-kc-2",
        prompt: "In the worked example, a support cascade answers routine queries on a small model and escalates the rest. What is the identified risk, and how is it controlled in the recommended decision?",
        options: [
          "The risk is an over-tight threshold holding hard troubleshooting on the small tier; it is controlled by validating the escalation threshold against the quality SLA on eval",
          "The risk is that the small model costs more per token than the flagship at low batch sizes",
          "The risk is cache staleness; it is controlled by disabling the semantic cache for escalated queries",
        ],
        correct: 0,
        feedback: "Correct. This is the worked example's own analysis and decision: the risk is an over-tight threshold, and the control is validating escalation against the quality SLA so savings never come from misrouted hard queries.",
      },
      {
        id: "ch23-model-routing-kc-3",
        prompt: "Months after a router launch, blended quality holds steady but escalations have quietly fallen and the hard-query cohort's quality is degrading. What is the most likely routing failure here?",
        options: [
          "The flagship model became slower, so the router times out before it can escalate",
          "The escalation threshold is miscalibrated for the current traffic mix — hard queries are stuck on the small tier, and only per-tier quality measurement would reveal it",
          "The semantic cache is evicting hard queries, which always degrades cohort quality",
        ],
        correct: 1,
        feedback: "Correct. The threshold section requires validating escalation thresholds and tracking cost, quality, and escalation per tier — a blended score hides exactly this kind of slow misrouting regression.",
      },
      {
        id: "ch23-model-routing-kc-4",
        prompt: "A stakeholder worries that any routing layer sacrifices quality for cost and asks to remove it entirely. How do you defend keeping the router while honoring the quality concern?",
        options: [
          "Agree to remove it — routing and quality are fundamentally incompatible objectives",
          "Keep it but stop measuring it, since a router's quality cannot be evaluated like a model's",
          "Routing targets queries where the small model's quality is already equal; the escalation path protects hard queries, and per-tier eval against the SLA keeps the trade-off honest",
        ],
        correct: 2,
        feedback: "Correct. The lesson's point is minimal quality loss on the easy majority — validated thresholds keep hard queries on the flagship, and routing remains the single largest cost lever in a mature system.",
      },
      {
        id: "ch23-model-routing-kc-5",
        prompt: "Your routing cascade is now live in production. Which ongoing measurement practice does this lesson's cost-optimized design prescribe to keep both the savings and the SLA intact over time?",
        options: [
          "Review the total invoice once per quarter, since routing savings are structurally permanent once tuned",
          "Track $ per 1M tokens and P95 latency continuously, monitor escalation rate and quality per tier, and gate every cost change on the quality eval",
          "Measure only the small model's accuracy, because the flagship tier needs no ongoing validation",
        ],
        correct: 1,
        feedback: "Correct. The cost-stack section ties the design together with continuous $ per 1M tokens and P95 tracking, gating every change on the quality eval — measurement closes the constrained-optimization loop.",
      },
    ],
  },
};

export const chapter23Practice: CatalogPracticeUnit[] = [
  {
    id: "ch23-23-2-1",
    chapter: 23,
    chapterTitle: "Inference Cost Engineering",
    title: "How do you model and reduce cost per token?",
    pages: "145",
    route: "/practice/inference-cost-engineering/how-do-you-model-and-reduce-cost-per-token",
    competencies: ["token economics", "quantization", "batching cost", "model routing"],
    question:
      "Your LLM inference bill is too high. How do you model the unit cost and decide what to optimize first?",
    options: [
      {
        text: "Build the unit-cost model — $ per 1M tokens from GPU $/hr and achieved throughput — attribute spend per request type with a prefill/decode split, then optimize by leverage: batching, quantization, and speculative decoding for throughput; length caps, prompt compression, and caching for tokens; routing for the easy majority; right-sized GPUs and spot for price — re-measuring after each change behind a quality eval.",
        correct: true,
        feedback:
          "Correct. This is the staff-level shape: a quantitative cost model first, attribution second, levers pulled in order of leverage, with re-measurement and a quality gate closing the loop.",
      },
      {
        text: "Replace the flagship with a smaller model across all endpoints, since model size is the primary cost driver.",
        correct: false,
        feedback:
          "This is the junior answer the question is built to catch. Without attributing spend you cannot know whether a smaller model addresses the real driver — and it can silently degrade the hard queries.",
      },
      {
        text: "Attack input tokens first by compressing every system prompt, because prefill is where most of the money goes.",
        correct: false,
        feedback:
          "Prefill is usually not the dominant phase: decode is per-token and bandwidth-bound, so output tokens and a few verbose endpoints typically drive the bill. Attribution must precede optimization.",
      },
    ],
  },
  {
    id: "ch23-23-2-2",
    chapter: 23,
    chapterTitle: "Inference Cost Engineering",
    title: "When do you quantize, and how do you choose the level?",
    pages: "146",
    route: "/practice/inference-cost-engineering/when-do-you-quantize-and-how-do-you-choose-the-level",
    competencies: ["token economics", "quantization", "batching cost", "model routing"],
    question:
      "How do you decide whether to quantize a served model and to what precision?",
    options: [
      {
        text: "Quantize to 4-bit everywhere — modern weight-only methods make the memory savings effectively free.",
        correct: false,
        feedback:
          "'Quantize to 4-bit to save memory' is the junior answer. Quality loss is model- and task-dependent — reasoning, code, and math are more sensitive than chat — so the level must come from your eval, not a slogan.",
      },
      {
        text: "Avoid quantization for production models, because the quality risk cannot be bounded.",
        correct: false,
        feedback:
          "Overly conservative. FP8/INT8 is near-lossless for most models, and the quality cost at lower precisions is small and measurable when you validate on your own eval.",
      },
      {
        text: "Treat it as an empirical ladder — FP8/INT8 near-lossless and almost always worth it, INT4 weight-only (AWQ/GPTQ) the production sweet spot, KV-cache FP8 separate for bigger batches or context — choose based on whether memory or throughput is the constraint, validate on your own eval, and A/B before cutover.",
        correct: true,
        feedback:
          "Correct. Constraint first, ladder second, eval third — quantize as aggressively as the eval allows, not as aggressively as possible.",
      },
    ],
  },
  {
    id: "ch23-23-2-3",
    chapter: 23,
    chapterTitle: "Inference Cost Engineering",
    title: "How does batch size drive cost, and what’s the catch?",
    pages: "146",
    route: "/practice/inference-cost-engineering/how-does-batch-size-drive-cost-and-whats-the-catch",
    competencies: ["token economics", "quantization", "batching cost", "model routing"],
    question:
      "Explain why batching cuts cost per token and why you can't just make the batch huge.",
    options: [
      {
        text: "Batching cuts cost because the GPU performs less total work per request; the only limit is memory, so set the largest batch that fits in HBM.",
        correct: false,
        feedback:
          "The mechanism is wrong: batching does not reduce work per token, it amortizes the fixed per-step weight-streaming cost. And memory is only half the catch — latency is the other.",
      },
      {
        text: "Decode is memory-bandwidth-bound, so the per-step cost of streaming weights and KV cache from HBM is largely fixed and amortizes across the batch — throughput rises and $ per token falls until the GPU saturates. The catches are per-request and tail latency, which the interactive SLA caps, and KV-cache memory, which bounds concurrency; continuous batching plus KV quantization push both limits.",
        correct: true,
        feedback:
          "Correct. This names the mechanism, both halves of the throughput/latency/memory trilemma, and the two techniques that move the ceiling — the senior-level answer.",
      },
      {
        text: "Batch size affects throughput but not cost — cost is set by the GPU hourly rate, so the real decision is which GPU to rent.",
        correct: false,
        feedback:
          "Hourly price is only the numerator. The unit-cost formula divides by achieved throughput, which batch size dominates — ignoring batching ignores the biggest throughput lever.",
      },
    ],
  },
  {
    id: "ch23-23-2-4",
    chapter: 23,
    chapterTitle: "Inference Cost Engineering",
    title: "Design a cost-optimized serving setup under a quality SLA",
    pages: "147",
    route: "/practice/inference-cost-engineering/design-a-cost-optimized-serving-setup-under-a-quality-sla",
    competencies: ["token economics", "quantization", "batching cost", "model routing"],
    question:
      "Minimize inference cost for a chat product while keeping quality and P95 latency within SLA. What's your design?",
    options: [
      {
        text: "Frame it as constrained optimization — minimize $ per token subject to quality and P95 SLAs. Lead with a routing cascade and semantic/prefix caching as the biggest wins, then continuous batching tuned to the P95 limit, eval-validated weight quantization, and speculative decoding; right-size GPUs per tier with multi-LoRA packing and spot for async work; track $ per 1M tokens and P95 continuously and gate every change on the quality eval.",
        correct: true,
        feedback:
          "Correct. Constraints first, levers prioritized by leverage — routing and caching before touching the model — and measurement closing the loop: the staff-level answer.",
      },
      {
        text: "Apply the standard optimizations — quantization, batching, caching — all at once so the savings compound, then measure the total reduction.",
        correct: false,
        feedback:
          "Listing and stacking optimizations is the junior pattern. Without attribution you cannot tell which lever worked, and an unvalidated combination can break the SLA in several ways at once.",
      },
      {
        text: "Protect the SLA by serving everything on the flagship model across large GPUs, then revisit cost once the product is stable.",
        correct: false,
        feedback:
          "This concedes the optimization before it starts. Right-sizing is a primal lever — do not serve traffic on hardware bigger than the SLA requires — and routing usually saves more than any hardware choice.",
      },
    ],
  },
];
