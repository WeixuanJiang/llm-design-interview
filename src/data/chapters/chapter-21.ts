import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter21Module: LearningModule = {
  id: "chapter-21-model-serving-at-hyperscaler-scale",
  title: "Model Serving at Hyperscaler Scale",
  description:
    "Scale single-cluster LLM inference to the fleet: disaggregate prefill and decode onto specialized GPU pools, schedule many tenants over scarce accelerators, accelerate decode with speculative methods, and plan global capacity as a fleet-economics problem of throughput, tail latency, and utilization.",
  duration: "4 lessons",
  lessons: [
    {
      id: "ch21-prefill-decode-disaggregation",
      title: "Prefill/Decode Disaggregation",
      prompt: "Separate the two inference phases onto specialized pools",
      question:
        "A platform runs streaming chat (short prompts, long answers) and long-document summarization (8K-token prompts, short answers) on the same GPU workers. Whenever a large summarization prefill lands, chat decode stalls and tail latency spikes, even though both phases are already batched. What redesign most directly removes this interference?",
      options: [
        "Run prefill and decode on separate GPU pools, transferring the prompt's KV cache from prefill workers to decode workers over a high-bandwidth interconnect",
        "Raise the decode batch size so more chat tokens are produced between prefill jobs",
        "Give every model its own dedicated GPU so the two workloads never mix",
      ],
      correct: 0,
      feedback:
        "Strong choice. Splitting the compute-bound prefill from the bandwidth-bound decode removes the interference, and the KV handoff over a fast fabric is what links the two pools.",
      explanation:
        "Prefill processes the whole prompt in parallel and is compute-bound; decode emits one token per step while reading the KV cache and is memory-bandwidth-bound. Co-located, a long prefill monopolizes the GPU and stalls other requests' decode (head-of-line blocking), and no single batching policy optimizes both phases. Disaggregation trades a KV-cache transfer over the interconnect for independent tuning and scaling of each pool.",
      takeaways: [
        "Prefill is compute-bound and parallel; decode is memory-bandwidth-bound and sequential.",
        "Co-location causes head-of-line blocking and forces a batching compromise between the phases.",
        "Disaggregation pays off only when the interconnect makes the KV transfer small relative to the interference removed.",
      ],
      model: ["Separate the phases", "Transfer the KV cache", "Tune and scale pools independently"],
      source: { chapter: 21, sections: ["21.1.1"], pages: "136" },
    },
    {
      id: "ch21-multi-tenant-gpu-scheduling",
      title: "Multi-Tenant GPU Scheduling",
      prompt: "Maximize utilization without violating isolation or SLAs",
      question:
        "A fleet hosts one base model with 300 customer fine-tunes, serving latency-sensitive interactive chat plus nightly batch jobs. Tenants report that a neighbor's batch bursts starve their interactive traffic, while average GPU utilization stays low because models are scattered across cards. Which scheduling design best raises utilization without violating SLAs?",
      options: [
        "Give each customer model its own dedicated GPU and serve every tenant's requests in strict FIFO order",
        "Pack tenants with multi-LoRA adapters and memory-footprint bin-packing, let interactive traffic preempt batch under SLA-aware priority, enforce fair-share quotas, and run batch on spot capacity",
        "Maximize cross-tenant batch size on on-demand GPUs so cards never idle, and buy more GPUs whenever queues grow",
      ],
      correct: 1,
      feedback:
        "Strong choice. The fleet win comes from packing many tenants safely, then protecting SLAs with priority and quotas instead of dedicating hardware.",
      explanation:
        "At fleet scale the scheduler must maximize utilization of scarce, expensive GPUs subject to per-tenant SLAs and isolation. Multi-LoRA packs hundreds of fine-tunes onto one base model, bin-packing by memory footprint limits fragmentation, SLA-aware priority lets interactive traffic preempt batch, and fair-share quotas stop noisy neighbors. Spot or preemptible capacity for batch and on-demand for interactive cuts cost further.",
      takeaways: [
        "Treat GPU scheduling as bin-packing plus priority queuing over scarce GPU memory and bandwidth.",
        "Multi-LoRA and memory bin-packing pack the tenants; fair-share quotas keep them isolated.",
        "Interactive traffic preempts batch; batch backfills idle cycles on spot or preemptible capacity.",
      ],
      model: ["Pack more per GPU", "Prioritize by SLA", "Quota, route, and autoscale"],
      source: { chapter: 21, sections: ["21.1.2"], pages: "136" },
    },
    {
      id: "ch21-speculative-decoding",
      title: "Speculative Decoding",
      prompt: "Accelerate decode without changing the output distribution",
      question:
        "Decode on the flagship model is the latency bottleneck, but the product cannot accept any change in output distribution. A teammate proposes pairing it with a small draft model. Under what condition does this help, and why is it safe?",
      options: [
        "It helps whenever the draft model is smaller and faster; the target only needs to spot-check a sample of the drafted tokens, which is close enough to lossless in practice",
        "It helps only when the draft runs on separate hardware, so verification never competes with decode for the same GPU",
        "It helps when the draft is well-matched to the target: the target verifies the drafted tokens in one parallel forward pass and accepts the longest prefix it agrees with, which reproduces the target's exact distribution",
      ],
      correct: 2,
      feedback:
        "Strong choice. Verifying several tokens costs roughly one bandwidth-bound step, and the accept-longest-prefix rule keeps the output identical to plain decoding; the acceptance rate decides the gain.",
      explanation:
        "Decode underutilizes compute because each step reads the KV cache and weights to emit a single token. A cheap draft proposes several tokens and the target verifies them in one parallel forward pass, accepting the longest agreeing prefix and correcting the first disagreement, so the final sequence follows the target's distribution exactly. The speedup, typically 2-3x, is governed by the acceptance rate, so the draft must be trained or chosen for the target's domain.",
      takeaways: [
        "Speculative decoding is exact, not approximate: the target's verification defines the output.",
        "Parallel verification is nearly free because decode is memory-bandwidth-bound.",
        "The acceptance rate determines the speedup; a poorly matched draft wastes verification and can slow things down.",
      ],
      model: ["Draft several tokens", "Verify in one parallel pass", "Accept the longest correct prefix"],
      source: { chapter: 21, sections: ["21.1.3"], pages: "136" },
    },
    {
      id: "ch21-capacity-global-routing",
      title: "Capacity Planning and Global Routing",
      prompt: "Plan scarce GPU capacity as forecasting and commitment",
      question:
        "Your company must provision GPUs for a flagship LLM launch in six months. Procurement lead time is several months, and finance rejects waste. Which capacity plan is most defensible?",
      options: [
        "Forecast peak QPS with prompt/response length distributions, convert load-tested tokens/sec into GPU-seconds per request, size for peak plus headroom, then cut headroom cost with spot capacity, speculative decoding, quantization, and demand shaping",
        "Autoscale GPU pools on traffic the way CPU services do, adding cards as queues grow, and let the cloud absorb the lead time",
        "Provision for average daily demand in one region and rely on cross-region failover to absorb traffic spikes",
      ],
      correct: 0,
      feedback:
        "Strong choice. GPU capacity is a forecasting and commitment problem: derive GPU-seconds per request from demand and load tests, provision above peak, then attack the cost of that headroom.",
      explanation:
        "GPUs are scarce, expensive, and procurement-bound, so capacity cannot be treated as elastic on-demand like CPU. Plan from peak QPS and the distribution of prompt and response lengths, convert measured tokens/sec per GPU into GPU-seconds per request, and provision for peak demand times a headroom factor for spikes and failures. Then reduce the cost of headroom with spot fleets for batch work, speculative decoding and quantization for more tokens/sec per GPU, and admission control with latency tiers to shape demand, while provisioning per region with cross-region failover.",
      takeaways: [
        "Plan from demand distributions to GPU-seconds per request, not from average traffic or intuition.",
        "Provision above peak, then cut the cost of headroom with spot capacity, speculation, quantization, and demand shaping.",
        "GPU capacity is a forecasting and commitment problem; reconcile forecast versus actual continuously because the cost stakes are huge.",
      ],
      model: ["Forecast demand", "Convert to GPU-seconds", "Provision, then economize"],
      source: { chapter: 21, sections: ["21.1.4"], pages: "136-137" },
    },
  ],
};

export const chapter21CourseContent: Record<string, LessonCourseContent> = {
  "ch21-prefill-decode-disaggregation": {
    objectives: [
      "Explain the opposite compute-versus-bandwidth profiles of prefill and decode.",
      "Diagnose the interference that co-locating the two phases creates on shared GPUs.",
      "Decide when disaggregated serving wins, given the KV-transfer cost and interconnect speed.",
    ],
    sections: [
      {
        heading: "Two phases with opposite profiles",
        paragraphs: [
          "LLM inference is not one uniform workload. Prefill processes the entire prompt in parallel, so it is compute-bound and its cost scales with prompt length. Decode generates tokens one at a time, each step reading the KV cache and model weights to emit a single token, so it is memory-bandwidth-bound and inherently sequential.",
          "Because the profiles are opposite, each phase wants different hardware treatment. Prefill benefits from large batches that saturate compute; decode benefits from low, predictable latency at the token level. Any serving design that ignores this split is negotiating against itself.",
        ],
      },
      {
        heading: "Why co-location degrades both phases",
        paragraphs: [
          "When prefill and decode share a GPU, they interfere directly. A long prefill monopolizes the card and stalls the decode of every other request in flight, producing head-of-line blocking that shows up as tail-latency spikes in streaming traffic.",
          "The batching policy makes the compromise structural rather than incidental: the policy that maximizes prefill throughput is not the one that minimizes decode latency. Co-located, you are stuck degrading one objective to serve the other.",
        ],
      },
      {
        heading: "How disaggregated serving works",
        paragraphs: [
          "Disaggregated serving runs the two phases on separate GPU pools. Prefill workers compute the prompt's KV cache, which is transferred to decode workers that stream the tokens. Each pool is sized and tuned for its own objective: prefill for throughput with large batches and high compute utilization, decode for low, predictable latency.",
          "The pools also scale independently, which matters when traffic is heterogeneous. A workload with long prompts but short outputs needs more prefill capacity, while a chatty workload needs more decode capacity. Removing the interference improves both tail latency and overall utilization.",
        ],
      },
      {
        heading: "The transfer cost decides whether it wins",
        paragraphs: [
          "The price of disaggregation is the KV-cache transfer from prefill to decode workers over the interconnect. The split only pays off if the fabric is fast enough that the transfer is small relative to the interference removed; on a slow fabric, disaggregation can actually lose.",
          "That makes this a hyperscaler technique, justified by high-bandwidth networking and large, heterogeneous traffic, rather than a default for a single node. Validate it by measuring prefill and decode latency separately, benchmarking transfer time on the real interconnect, and confirming that tail latency and utilization both improve after the split.",
        ],
      },
    ],
    example: {
      title: "Worked example: mixed summarization and chat fleet",
      scenario:
        "One serving tier handles 8K-token document summarization alongside streaming chat. Every time a summarization batch arrives, chat users see token streams stall, and p99 latency triples. Both features share the same GPUs and one global batching configuration.",
      analysis:
        "The long summarization prefills monopolize the GPUs and stall in-flight chat decode, which is the head-of-line blocking pattern. The workload mix is long-prompt/short-output versus short-prompt/long-output, so the two phases need capacity in different proportions, and no single batching policy can serve both objectives.",
      decision:
        "Split prefill and decode into separate pools with KV transfer over the high-bandwidth fabric, size the prefill pool for summarization peaks and the decode pool for chat concurrency, and gate the rollout on measured transfer time plus improved tail latency and utilization.",
    },
    productionChecklist: [
      "Instrument prefill and decode as separate pools with their own latency and utilization dashboards.",
      "Benchmark KV-cache transfer time on the production interconnect under load before committing.",
      "Size each pool from measured prompt and response length distributions.",
      "Re-check tail latency and GPU utilization after the split, not just average throughput.",
      "Keep a co-located configuration available for pools whose fabric cannot keep up with the transfer.",
    ],
    commonMistakes: [
      "Justifying the split with 'it is faster' instead of naming the compute-versus-bandwidth profiles and the interference removed.",
      "Applying disaggregation over a slow interconnect where the KV transfer can cost more than the interference it removes.",
      "Tuning one global batching policy and expecting it to serve both prefill throughput and decode latency.",
      "Scaling prefill and decode capacity in lockstep even though the workload's prompt/output mix demands them in different proportions.",
    ],
    knowledgeChecks: [
      {
        id: "ch21-prefill-decode-disaggregation-kc-1",
        prompt:
          "A team serves short-prompt chat and long-prompt document Q&A from one pool of GPUs, and in-flight chat decode stalls whenever a long prefill arrives. Which redesign most directly addresses the stall while keeping both phases efficient?",
        options: [
          "Disaggregate prefill and decode into separate GPU pools, transferring the prompt's KV cache from prefill workers to decode workers",
          "Increase the global batch size so prefills finish faster and decode catches up between them",
          "Cap prompt length for all tenants so no single prefill can monopolize a GPU",
        ],
        correct: 0,
        feedback:
          "Correct: prefill is compute-bound and decode is bandwidth-bound, and co-locating them causes head-of-line blocking; separate pools tuned per phase remove the interference, linked by the KV transfer.",
      },
      {
        id: "ch21-prefill-decode-disaggregation-kc-2",
        prompt:
          "In the worked example, a fleet serving 8K-token summarization and streaming chat sees chat p99 triple whenever summarization batches arrive, and both features share GPUs under one batching configuration. What is the most defensible first change?",
        options: [
          "Roll out a larger batching window across the shared pool so summarization prefills drain faster",
          "Restrict summarization to off-peak hours so chat users stop noticing the stalls",
          "Split prefill and decode into separate pools, size prefill for summarization peaks and decode for chat concurrency, and verify the interconnect keeps the KV transfer cheap",
        ],
        correct: 2,
        feedback:
          "The disaggregated design fits the example: the mix is long-prompt/short-output versus short-prompt/long-output, so pools scale independently, and the split pays off only if the fabric makes the transfer small relative to the interference removed.",
      },
      {
        id: "ch21-prefill-decode-disaggregation-kc-3",
        prompt:
          "A team disaggregated prefill and decode, but end-to-end latency got worse and utilization barely moved, with traces showing decode workers waiting on KV data from prefill workers. What is the most likely root cause?",
        options: [
          "The decode pool is under-provisioned relative to the prefill pool, so requests queue at decode",
          "The interconnect is too slow, so the KV-cache transfer costs more than the interference the split removed",
          "The batching policy on the decode pool is too aggressive for streaming traffic",
        ],
        correct: 1,
        feedback:
          "Disaggregation only pays off when the fabric is fast enough that the transfer is small relative to the work saved; on a slow interconnect the split can actually lose, which matches the traces.",
      },
      {
        id: "ch21-prefill-decode-disaggregation-kc-4",
        prompt:
          "An architect challenges your disaggregation proposal, arguing that co-location is simpler and avoids moving KV caches across the network. Which response best defends the split while honestly naming its cost?",
        options: [
          "Concede that co-location is strictly better and keep one pool, since simplicity always wins in serving design",
          "Claim the split has no cost because KV caches are small and networks are fast enough by default",
          "Argue that co-location forces head-of-line blocking and a batching compromise, while the split's real cost is the KV transfer — justified when a high-bandwidth fabric and large heterogeneous traffic make the transfer cheap relative to the interference removed",
        ],
        correct: 2,
        feedback:
          "This matches the staff-level framing: the differentiator is naming the trade-off — transfer cost versus interference removed — and the conditions, fast interconnect plus large heterogeneous traffic, under which disaggregation wins.",
      },
      {
        id: "ch21-prefill-decode-disaggregation-kc-5",
        prompt:
          "You are rolling out prefill and decode disaggregation to production. Which validation plan best decides whether the split actually paid off for the fleet?",
        options: [
          "Measure prefill and decode latency separately, benchmark KV transfer time on the real interconnect under load, and confirm tail latency and utilization both improve after the split",
          "Compare only average throughput before and after, since higher tokens per second proves the architecture",
          "Ship the split everywhere at once and rely on user complaints to reveal whether the fabric can keep up",
        ],
        correct: 0,
        feedback:
          "The win comes from improved tail latency and utilization, with interconnect speed as the deciding condition, so validation must measure transfer time and per-phase latency rather than one average throughput number.",
      },
    ],
  },
  "ch21-multi-tenant-gpu-scheduling": {
    objectives: [
      "Frame fleet scheduling as bin-packing plus priority queuing over scarce GPU memory and bandwidth.",
      "Combine multi-LoRA packing, memory bin-packing, SLA-aware priority, and fair-share quotas into one design.",
      "Route requests with cache affinity and autoscale pools on queue depth rather than CPU metrics.",
    ],
    sections: [
      {
        heading: "The scheduling objective",
        paragraphs: [
          "At fleet scale, many models and customers share scarce, expensive GPUs. The scheduler's job is to maximize utilization while honoring isolation and per-tenant SLAs, which is a harder problem than single-server tuning because the tenants compete and interfere.",
          "The scarce resources are GPU memory and bandwidth, not CPU. Every mechanism in this lesson either packs more work onto a card safely or decides whose work goes first when demand exceeds capacity.",
        ],
      },
      {
        heading: "Packing more per GPU",
        paragraphs: [
          "Multi-LoRA serving lets one base model host hundreds of fine-tuned adapters, so many customer models share a single GPU instead of each needing a dedicated card. Bin-packing models onto GPUs by memory footprint keeps fragmentation from stranding capacity that no remaining model can use.",
          "Within each resident model, continuous batching keeps the GPU busy at the token level. Packing is what converts a fragmented, half-empty fleet into a dense one without touching the models themselves.",
        ],
      },
      {
        heading: "Priority, fairness, and cost",
        paragraphs: [
          "SLA-aware queuing gives interactive, latency-sensitive traffic priority and lets it preempt batch or offline work. Fair-share quotas give each tenant a guaranteed share so a noisy neighbor cannot starve the others, while still allowing bursts into idle capacity.",
          "Cost follows the same split: batch jobs run on cheaper spot or preemptible capacity and backfill idle cycles, while interactive traffic runs on-demand. Utilization rises because nothing sits idle, and SLAs hold because interactive work can always displace preemptible work.",
        ],
      },
      {
        heading: "Routing and autoscaling",
        paragraphs: [
          "Routing ties the design together. Send each request to a replica that already has its model or adapter loaded (cache affinity) and has SLA headroom. Cold models incur a load, so keep hot ones pinned and evict by LRU.",
          "Operate the fleet on the right signals: monitor utilization and SLA attainment per tenant, and autoscale pools on queue depth, not CPU. A queue that grows while GPUs look busy is the signature of a packing or priority problem, not a CPU problem.",
        ],
      },
    ],
    example: {
      title: "Worked example: fine-tune hosting fleet",
      scenario:
        "A platform hosts 300 customer LoRA adapters over one base model, serving interactive chat with latency SLAs plus nightly batch evaluation jobs. A neighbor's batch bursts periodically starve interactive tenants, yet average GPU utilization is only 40% because models are scattered across cards.",
      analysis:
        "Dedicating a GPU per customer would strand expensive memory. The real levers are packing (multi-LoRA plus bin-packing by footprint), priority with preemption to protect interactive SLAs, fair-share quotas to stop starvation, and spot capacity for the batch work that can tolerate preemption.",
      decision:
        "Adopt multi-LoRA packing with memory bin-packing, SLA-priority queues with batch preemption, per-tenant quotas with burst into idle capacity, cache-affinity routing with LRU eviction and hot models pinned, and autoscaling on queue depth with per-tenant utilization and SLA dashboards.",
    },
    productionChecklist: [
      "Enforce per-tenant fair-share quotas with burst allowed into idle capacity.",
      "Bin-pack models by measured memory footprint and re-pack as footprints change.",
      "Give interactive traffic SLA-aware priority that preempts batch, and run batch on spot or preemptible capacity.",
      "Pin hot models and adapters, evict cold ones by LRU, and budget for model load time in routing.",
      "Autoscale pools on queue depth and track utilization plus SLA attainment per tenant.",
    ],
    commonMistakes: [
      "Dedicating a GPU per customer and stranding expensive capacity instead of packing tenants safely.",
      "Letting one tenant's batch work starve interactive traffic because there are no quotas or preemption.",
      "Autoscaling on CPU metrics while the scarce resource is actually GPU memory and bandwidth.",
      "Routing requests to replicas without the adapter loaded and paying cold-model load time on the request path.",
    ],
    knowledgeChecks: [
      {
        id: "ch21-multi-tenant-gpu-scheduling-kc-1",
        prompt:
          "A fleet hosts hundreds of customer fine-tunes of one base model, serving interactive chat plus nightly batch jobs, with low utilization and tenants complaining about starvation. Which scheduling combination best matches the prescribed design?",
        options: [
          "Dedicate one GPU per customer model and process each tenant's requests in strict FIFO order",
          "Multi-LoRA packing plus memory-footprint bin-packing, SLA-aware priority that lets interactive traffic preempt batch, fair-share quotas with burst, and spot capacity for batch work",
          "One global FIFO queue with maximum cross-tenant batch size so the GPUs stay busy",
        ],
        correct: 1,
        feedback:
          "The design packs many tenants per GPU with multi-LoRA and bin-packing, protects SLAs with priority and preemption, prevents starvation with fair-share quotas, and cuts cost by running batch on spot or preemptible capacity.",
      },
      {
        id: "ch21-multi-tenant-gpu-scheduling-kc-2",
        prompt:
          "In the worked example, 300 customer LoRA adapters sit scattered across GPUs at 40 percent average utilization while batch bursts starve interactive tenants. Which change set most directly implements the prescribed remedy for this fleet?",
        options: [
          "Pin every adapter on every GPU so routing never misses, and give batch jobs top priority at night",
          "Buy on-demand GPUs for the batch workload so it stops competing with interactive traffic entirely",
          "Bin-pack the adapters by memory footprint, add SLA-priority queuing with batch preemption and fair-share quotas, and route with cache affinity while evicting cold adapters by LRU",
        ],
        correct: 2,
        feedback:
          "This is the example's decision path: pack densely by footprint, protect interactive SLAs with preemption and quotas, and keep routing cache-aware with hot models pinned and cold ones evicted by LRU.",
      },
      {
        id: "ch21-multi-tenant-gpu-scheduling-kc-3",
        prompt:
          "After a scheduling rollout, interactive tenants still miss SLAs during batch windows: dashboards show healthy CPU utilization, autoscaled pools that never grow, and deepening request queues. What is the most likely misconfiguration?",
        options: [
          "The pools autoscale on CPU metrics instead of queue depth, so GPU memory and bandwidth scarcity never triggers capacity growth",
          "The fair-share quotas are too generous, letting interactive tenants monopolize the fleet",
          "Continuous batching is disabled, so GPUs alternate between idle and saturated states",
        ],
        correct: 0,
        feedback:
          "The guidance is explicit: autoscale pools on queue depth, not CPU, because the scarce resources are GPU memory and bandwidth; deepening queues alongside stable CPU is the signature of this mistake.",
      },
      {
        id: "ch21-multi-tenant-gpu-scheduling-kc-4",
        prompt:
          "A reviewer argues that dedicating a GPU to each customer model would make SLA isolation trivial and scheduling simple. How do you defend the packed multi-tenant design against this challenge?",
        options: [
          "Agree and dedicate hardware, since isolation is the only scheduling requirement that matters at fleet scale",
          "Dismiss the concern because packing never affects isolation, so the trade-off does not exist",
          "Explain that dedication strands expensive capacity, and that the win comes from packing many tenants safely — bin-packing plus priority queuing over scarce GPU memory and bandwidth, with quotas and preemption providing the isolation instead of hardware",
        ],
        correct: 2,
        feedback:
          "This is the stated differentiator: treating fleet scheduling as bin-packing plus priority scheduling with isolation enforced by quotas, rather than dedicating GPUs per customer.",
      },
      {
        id: "ch21-multi-tenant-gpu-scheduling-kc-5",
        prompt:
          "Which monitoring and validation setup is prescribed for operating a multi-tenant GPU fleet once the new scheduler has shipped to production?",
        options: [
          "Track only aggregate GPU utilization weekly, since per-tenant detail is too expensive to collect",
          "Monitor utilization and SLA attainment per tenant, autoscale on queue depth, and watch for cold-model load time when routing misses cache affinity",
          "Alert on CPU saturation across the fleet and treat it as the leading indicator of GPU scarcity",
        ],
        correct: 1,
        feedback:
          "The prescribed practice is to monitor utilization and SLA attainment per tenant and to autoscale pools on queue depth, and to flag cold-model loads when routing lacks cache affinity.",
      },
    ],
  },
  "ch21-speculative-decoding": {
    objectives: [
      "Explain why decode leaves compute headroom that speculative decoding exploits.",
      "Describe the draft-verify loop and why the acceptance rule makes it lossless.",
      "Relate the speedup to the acceptance rate and choose a draft strategy accordingly.",
    ],
    sections: [
      {
        heading: "Why decode has spare compute",
        paragraphs: [
          "Decode is memory-bandwidth-bound: each step reads the whole KV cache and the model weights to produce a single token. The arithmetic needed for that one token does not saturate the GPU's compute, so there is headroom sitting idle on every step.",
          "That headroom is the opportunity. If the same bandwidth-bound pass can verify several candidate tokens instead of producing one, multiple tokens can be emitted per large-model step whenever the candidates are right.",
        ],
      },
      {
        heading: "The draft-verify loop",
        paragraphs: [
          "A small, fast draft model proposes the next several tokens cheaply. The large target model then processes all of the proposed tokens in a single parallel forward pass, which costs roughly the same as the one-token pass because the work is bandwidth-bound.",
          "The target accepts the longest prefix where it agrees with the draft and corrects the first disagreement. When the draft is right, one large-model step yields several tokens, giving a 2-3x decode speedup in practice.",
        ],
      },
      {
        heading: "Why it is lossless",
        paragraphs: [
          "The guarantee comes from the acceptance and correction rule: the algorithm is constructed so the accepted tokens follow exactly the target model's own distribution. The draft only proposes; the target's verification decides what is emitted.",
          "As a result, the final sequence is distributed identically to plain decoding. Output quality is unchanged and only speed improves, which is why speculative decoding is described as exact rather than approximate.",
        ],
      },
      {
        heading: "Acceptance rate and draft strategy",
        paragraphs: [
          "The speedup is governed by the acceptance rate: how often the draft agrees with the target. A well-matched, well-trained draft yields high acceptance and the full 2-3x gain; a poorly matched draft wastes the verification pass and can even slow things down.",
          "Variants such as Medusa, EAGLE, and n-gram drafting avoid maintaining a separate draft model. Whichever approach you choose, train or select the draft for the target's domain and measure acceptance on real traffic instead of assuming the speedup.",
        ],
      },
    ],
    example: {
      title: "Worked example: speculative decode rollout for a chat model",
      scenario:
        "A chat product's p95 inter-token latency is too high, and the quality team forbids any change in output distribution. An engineer proposes plugging in an off-the-shelf small model as the draft to ship the speedup quickly.",
      analysis:
        "The mechanism is lossless only under the accept-longest-prefix rule, which the plan must preserve. The bigger risk is acceptance: a draft from a different domain will disagree often with the target, wasting verification compute and potentially slowing decode. A self-draft method such as Medusa or EAGLE avoids maintaining a separate model entirely.",
      decision:
        "Gate the rollout on the measured acceptance rate over production traffic, train or select the draft for the target model's domain (or adopt a self-draft variant), and ship only when end-to-end latency improves with the output distribution verifiably unchanged.",
    },
    productionChecklist: [
      "Measure the draft acceptance rate on real production traffic before and after rollout.",
      "Train or select the draft model to match the target model's domain.",
      "Verify the lossless property: accepted output follows the target model's exact distribution.",
      "Benchmark end-to-end decode latency, not just tokens per large-model step.",
      "Evaluate Medusa, EAGLE, or n-gram drafting when a separate draft model is impractical to maintain.",
    ],
    commonMistakes: [
      "Treating speculative decoding as an approximation that trades output quality for speed.",
      "Assuming the 2-3x speedup without measuring the acceptance rate on your own traffic.",
      "Pairing the target with a poorly matched draft and wasting the verification pass.",
      "Describing it as 'a small model helps the big one' without the verification and acceptance rule that makes it exact.",
    ],
    knowledgeChecks: [
      {
        id: "ch21-speculative-decoding-kc-1",
        prompt:
          "Decode latency is the bottleneck for a chat model, and the product team forbids any change in output distribution. Which technique accelerates decode while preserving the target model's exact outputs, and why does it work?",
        options: [
          "Quantize the target model, because lower precision is always distribution-preserving",
          "Sample multiple completions from a smaller model and let the target rank them, because ranking preserves quality",
          "Speculative decoding, because a draft proposes tokens and the target verifies them in one parallel pass, accepting the longest prefix it agrees with, so the output follows the target's exact distribution",
        ],
        correct: 2,
        feedback:
          "Speculative decoding is exact, not approximate: the acceptance and correction rule makes the final sequence distributed identically to plain decoding while verification stays nearly free on a bandwidth-bound step.",
      },
      {
        id: "ch21-speculative-decoding-kc-2",
        prompt:
          "In the worked example, an engineer wants to plug an off-the-shelf small model in as the draft to ship speculative decoding quickly. What should the team do before approving this rollout?",
        options: [
          "Measure the draft's acceptance rate on production traffic and train or select a draft matched to the target's domain — or adopt a self-draft variant — shipping only if end-to-end latency improves with the distribution unchanged",
          "Approve immediately, because any smaller model is fast enough to serve as the draft regardless of domain",
          "Reject speculative decoding entirely, since a mismatched draft proves the technique cannot be lossless",
        ],
        correct: 0,
        feedback:
          "The acceptance rate is the governing factor: choose or train the draft for the target's domain and measure acceptance rather than assume the speedup; Medusa and EAGLE-style variants avoid a separate draft.",
      },
      {
        id: "ch21-speculative-decoding-kc-3",
        prompt:
          "After enabling speculative decoding, decode latency increased and verification compute rose sharply, while acceptance logs show the draft and target disagreeing on most proposed tokens. What is the most likely cause and fix?",
        options: [
          "The verification pass is broken and should sample-check fewer tokens to save compute",
          "The draft is poorly matched to the target's domain, wasting the verification pass; retrain or replace the draft for the domain, or use a self-draft method, and re-measure acceptance",
          "The KV cache is too large, so speculative decoding cannot help and should be disabled permanently",
        ],
        correct: 1,
        feedback:
          "A poorly matched draft wastes the verification and can even slow things down; the remedy is a well-matched, well-trained draft or a self-draft variant, judged by measured acceptance rate.",
      },
      {
        id: "ch21-speculative-decoding-kc-4",
        prompt:
          "A colleague proposes skipping the draft entirely and simply accepting that decode emits one token per large-model step. How do you defend investing in speculative decoding despite its draft-matching overhead?",
        options: [
          "Argue that decode is compute-bound, so a bigger batch alone will recover the same speedup without any draft",
          "Claim the draft overhead is fictional because verification costs nothing at all under any conditions",
          "Explain that decode is bandwidth-bound and leaves compute idle, so parallel verification of drafted tokens is nearly free and yields a 2-3x speedup at identical output distribution when the draft is well-matched",
        ],
        correct: 2,
        feedback:
          "The technique is grounded in decode's bandwidth-bound nature: verification reuses the same pass almost for free, and the acceptance rule keeps output exact, so the investment pays off when acceptance is high.",
      },
      {
        id: "ch21-speculative-decoding-kc-5",
        prompt:
          "You are preparing a speculative decoding release for production traffic. Which measurement plan best proves the change is both safe and worthwhile?",
        options: [
          "Assume the published 2-3x speedup and skip acceptance measurement, since the property is lossless by construction",
          "Measure the acceptance rate on real traffic, verify the output distribution is identical to plain decoding, and benchmark end-to-end decode latency before and after enabling the draft",
          "Track only GPU utilization, because higher compute usage proves the verification pass is working",
        ],
        correct: 1,
        feedback:
          "Measure acceptance rather than assume the speedup: the lossless property comes from the acceptance and correction rule, and the gain is faster decode at unchanged output quality.",
      },
    ],
  },
  "ch21-capacity-global-routing": {
    objectives: [
      "Explain why GPU capacity is a forecasting and commitment problem rather than elastic scaling.",
      "Convert demand forecasts and load tests into GPU-seconds per request and a fleet size.",
      "Reduce headroom cost and design regional provisioning with cross-region failover.",
    ],
    sections: [
      {
        heading: "Why GPU capacity is not elastic",
        paragraphs: [
          "Unlike CPU, GPUs are scarce, expensive, and bound by procurement lead times, so you cannot treat them as elastic on-demand capacity. Capacity becomes a forecasting and commitment problem: decisions are made months ahead and are expensive to reverse.",
          "The stakes are asymmetric and both directions hurt. Over-provisioning GPUs is one of the largest line items in an LLM business, while under-provisioning means dropped traffic at exactly the moments of peak demand.",
        ],
      },
      {
        heading: "From demand to fleet size",
        paragraphs: [
          "Start from demand: forecast peak QPS and, crucially, the distribution of prompt and output lengths, because GPU-seconds per request scale with both prefill (prompt length) and decode (output length). Average QPS alone hides the shape of the work.",
          "From a load test, get tokens/sec per GPU for the model and derive GPU-seconds per request. Then size the fleet to peak demand times a headroom factor for spikes and failures, given your target utilization: you provision above peak for headroom, but every idle GPU is enormous cost.",
        ],
      },
      {
        heading: "Cutting the cost of headroom",
        paragraphs: [
          "Rather than simply buying the headroom, reduce what it costs. Serve batch and asynchronous workloads on spot or preemptible GPUs, and use speculative decoding and quantization to raise tokens/sec per GPU, which is effectively more capacity from the same hardware.",
          "Shape demand as well as supply: admission control and latency tiers let non-urgent traffic be deferred off-peak instead of forcing you to provision for every simultaneous peak.",
        ],
      },
      {
        heading: "Global routing and resilience",
        paragraphs: [
          "Global serving routes users to the nearest healthy region for latency, respects data residency constraints, and fails over across regions when a region degrades. Provision each region against its own regional demand and accept some stranded capacity as the price of resilience.",
          "Operate the plan as a living forecast: track utilization and headroom continuously and reconcile forecast versus actual, because GPU capacity is a commitment with huge cost stakes and the forecast will be wrong in both directions over time.",
        ],
      },
    ],
    example: {
      title: "Worked example: provisioning a global assistant launch",
      scenario:
        "A flagship assistant launches in three regions in six months. GPU procurement lead time is four months, the forecast is 2,000 peak QPS with long-context sessions, and finance has flagged GPU spend as the top cost risk for the business.",
      analysis:
        "With months of lead time, autoscaling cannot rescue an undersized buy, so the plan must be committed from the forecast. GPU-seconds per request have to come from a load test on the real model with the real prompt and response length distributions. The headroom cost can then be attacked rather than accepted: batch evaluation jobs on spot capacity, speculative decoding and quantization raising tokens/sec per GPU, and latency tiers deferring non-urgent traffic off-peak.",
      decision:
        "Commit to a per-region buy sized at peak demand times an explicit headroom factor, attach spot, speculation, quantization, and demand-shaping programs to the plan, route users to the nearest healthy region with data residency respected and cross-region failover tested, and reconcile forecast versus actual weekly after launch.",
    },
    productionChecklist: [
      "Forecast peak QPS together with the prompt and response length distributions.",
      "Load-test tokens/sec per GPU and derive GPU-seconds per request from the measurement.",
      "Provision above peak with an explicit headroom factor for traffic spikes and failures.",
      "Shift batch workloads to spot or preemptible capacity and apply speculative decoding and quantization to raise per-GPU throughput.",
      "Provision per region with data-residency-aware routing, tested cross-region failover, and continuous forecast-versus-actual reconciliation.",
    ],
    commonMistakes: [
      "Treating GPU capacity as elastic on-demand and planning to autoscale on traffic like a CPU service.",
      "Sizing for average traffic and dropping requests at peak instead of planning for peak QPS and length distributions.",
      "Buying raw headroom instead of cutting its cost with spot capacity, speculation, quantization, and demand shaping.",
      "Skipping forecast-versus-actual reconciliation while over-provisioned GPUs grow into the largest line item.",
    ],
    knowledgeChecks: [
      {
        id: "ch21-capacity-global-routing-kc-1",
        prompt:
          "Finance asks why the LLM platform cannot simply autoscale GPUs on traffic the way the CPU services do. Which answer best captures the reasoning about GPU capacity planning?",
        options: [
          "It can — GPU autoscaling works the same way, just with larger machines and longer boot times",
          "GPUs should be provisioned for average load with bursts absorbed by queues, since peaks are rare",
          "GPUs are scarce, expensive, and bound by procurement lead times, so capacity is a forecasting and commitment problem rather than elastic on-demand scaling",
        ],
        correct: 2,
        feedback:
          "Unlike CPU, GPU capacity cannot be treated as elastic because of scarcity, cost, and lead times, which makes it a forecasting and commitment problem.",
      },
      {
        id: "ch21-capacity-global-routing-kc-2",
        prompt:
          "In the worked example, a launch spans three regions with 2,000 peak QPS, long-context sessions, and a four-month procurement lead time. Which plan most closely follows the worked example's decision?",
        options: [
          "Wait for launch traffic, then buy GPUs weekly as queues reveal actual demand per region",
          "Load-test tokens/sec per GPU with the real length distributions, derive GPU-seconds per request, commit per region to peak times a headroom factor, and attach spot, speculation, quantization, and demand-shaping programs",
          "Buy for 2,000 QPS in one region and let cross-region failover carry the other two regions' traffic",
        ],
        correct: 1,
        feedback:
          "The example decision follows this chapter's approach: derive GPU-seconds from load tests and length distributions, commit per region above peak, then cut headroom cost with spot capacity, speculative decoding, quantization, and demand shaping.",
      },
      {
        id: "ch21-capacity-global-routing-kc-3",
        prompt:
          "Six months after launch, GPU spend is the company's largest line item, yet peak-hour requests are still dropped; the postmortem shows the fleet was sized from average daily traffic and never re-forecast. Which capacity-planning principles were violated?",
        options: [
          "Size to peak demand with an explicit headroom factor rather than average traffic, and reconcile forecast versus actual continuously because both over- and under-provisioning are costly",
          "Provision only in one region and use more aggressive cross-region failover to absorb peaks",
          "Replace the load test with vendor benchmarks and buy the largest available GPU pool once",
        ],
        correct: 0,
        feedback:
          "Size the fleet to peak demand times a headroom factor and track utilization and headroom continuously, reconciling forecast versus actual, because over-provisioning is a top cost while under-provisioning drops traffic.",
      },
      {
        id: "ch21-capacity-global-routing-kc-4",
        prompt:
          "An executive proposes buying enough on-demand GPUs for the worst imaginable peak and keeping them idle the rest of the year for safety. How do you defend the headroom-cost-reduction approach instead?",
        options: [
          "Agree, because idle GPUs are the only reliable way to survive demand spikes and regional failures",
          "Reject all headroom and size exactly to forecast peak, since any buffer is waste by definition",
          "Keep headroom for spikes and failures but attack its cost: spot capacity for batch work, speculative decoding and quantization for more tokens/sec per GPU, and admission control with latency tiers to defer non-urgent demand off-peak",
        ],
        correct: 2,
        feedback:
          "The approach is to provision above peak for headroom and then reduce the cost of that headroom through spot fleets, speculative decoding and quantization, and demand shaping rather than simply buying idle capacity.",
      },
      {
        id: "ch21-capacity-global-routing-kc-5",
        prompt:
          "Which operating cadence best keeps a global LLM fleet's capacity healthy after the launch plan has been committed and regions are live?",
        options: [
          "Set capacity once at launch and revisit it at the annual budget review, since the plan was committed",
          "Track utilization and headroom continuously, reconcile forecast versus actual on a regular cadence, and keep cross-region failover tested while respecting data residency in routing",
          "Monitor only per-request latency and add GPUs whenever users report slowness in any region",
        ],
        correct: 1,
        feedback:
          "The operating cadence calls for continuously tracking utilization and headroom with forecast-versus-actual reconciliation, and for global routing that respects data residency with failover across regions.",
      },
    ],
  },
};

export const chapter21Practice: CatalogPracticeUnit[] = [
  {
    id: "ch21-21-2-1",
    chapter: 21,
    chapterTitle: "Model Serving at Hyperscaler Scale",
    title: "Why disaggregate prefill and decode?",
    pages: "137",
    route: "/practice/model-serving-at-hyperscaler-scale/why-disaggregate-prefill-and-decode",
    competencies: ["prefill/decode disaggregation", "GPU scheduling", "speculative decoding", "fleet capacity"],
    question:
      "In a staff-level interview for an LLM platform role, the interviewer asks: explain prefill/decode disaggregation — why would you split the two phases across separate GPU pools, and what is the cost?",
    options: [
      {
        text: "The main driver is memory: prefill and decode checkpoints cannot fit on one GPU, so they are split across pools. The cost is extra bookkeeping in the scheduler.",
        correct: false,
        feedback:
          "This misstates the mechanism. The split is about the compute-versus-bandwidth interference and head-of-line blocking, not memory capacity, and the real cost is the KV-cache transfer over the interconnect.",
      },
      {
        text: "Prefill is compute-bound and parallel while decode is memory-bandwidth-bound and sequential, so co-locating them creates head-of-line blocking and forces a batching compromise. Separate pools let each phase be tuned and scaled for its own objective, improving tail latency and utilization; the cost is the KV-cache transfer, which only pays off on a fast interconnect.",
        correct: true,
        feedback:
          "Correct. This matches the staff-level answer: opposite hardware profiles, the interference and head-of-line problem, independent tuning and scaling, and the KV-transfer cost that requires a high-bandwidth fabric to be worthwhile.",
      },
      {
        text: "Split them so each pool can run a different model size optimized for its phase. The cost is that decode workers sit idle whenever prefill is busy.",
        correct: false,
        feedback:
          "Disaggregation is not about hosting different model sizes, and the pools are linked by the KV handoff rather than leaving one idle. The named cost is the KV-cache transfer over the interconnect.",
      },
    ],
  },
  {
    id: "ch21-21-2-2",
    chapter: 21,
    chapterTitle: "Model Serving at Hyperscaler Scale",
    title: "How does speculative decoding speed up inference without changing output?",
    pages: "137",
    route: "/practice/model-serving-at-hyperscaler-scale/how-does-speculative-decoding-speed-up-inference-without-changing-output",
    competencies: ["prefill/decode disaggregation", "GPU scheduling", "speculative decoding", "fleet capacity"],
    question:
      "The interviewer asks: explain speculative decoding — why is it lossless, and what determines the speedup?",
    options: [
      {
        text: "Decode is memory-bandwidth-bound, so a small draft model proposes several tokens and the target verifies them in a single parallel forward pass, accepting the longest prefix it agrees with and correcting the first disagreement. The acceptance rule reproduces the target's exact distribution, and the acceptance rate determines the 2-3x speedup, so the draft must match the target's domain.",
        correct: true,
        feedback:
          "Correct. Parallel verification is nearly free on a bandwidth-bound step, the accept-and-correct rule preserves the target's exact distribution, and the acceptance rate governs the gain.",
      },
      {
        text: "The draft model generates the easy tokens and the target only spot-checks a random sample, which is lossless because drafts are usually right. The speedup depends mainly on how small the draft model is.",
        correct: false,
        feedback:
          "Spot-checking a sample would be an approximation. The lossless guarantee comes from full parallel verification with longest-prefix acceptance, and the governing factor is the acceptance rate of a well-matched draft, not draft size alone.",
      },
      {
        text: "It works by quantizing the target model during verification, which is lossless because quantization preserves token rankings. The speedup depends on the decode batch size.",
        correct: false,
        feedback:
          "Quantization is a separate optimization and is not what makes speculative decoding exact. The guarantee comes from the verification and acceptance rule, not from precision tricks.",
      },
    ],
  },
  {
    id: "ch21-21-2-3",
    chapter: 21,
    chapterTitle: "Model Serving at Hyperscaler Scale",
    title: "Design multi-tenant GPU scheduling for a serving fleet",
    pages: "138",
    route: "/practice/model-serving-at-hyperscaler-scale/design-multi-tenant-gpu-scheduling-for-a-serving-fleet",
    competencies: ["prefill/decode disaggregation", "GPU scheduling", "speculative decoding", "fleet capacity"],
    question:
      "Design question: many customers and models share a scarce GPU fleet. Design the scheduling to maximize utilization without violating SLAs.",
    options: [
      {
        text: "Assign each customer a dedicated GPU partition and serve requests FIFO per partition. Isolation is guaranteed by construction, so SLAs are trivially met.",
        correct: false,
        feedback:
          "Dedicating hardware per customer is the junior answer: it strands utilization. The fleet win comes from packing many tenants safely with quotas and preemption, not from static partitions.",
      },
      {
        text: "Maximize cross-tenant batch size so the GPUs never idle, and handle SLA violations by buying more GPUs when queues grow.",
        correct: false,
        feedback:
          "Bigger batches alone ignore interference and fairness, and buying GPUs ignores scarcity and lead times. Without priority, quotas, and packing, utilization gains will violate SLAs.",
      },
      {
        text: "Pack tenants with multi-LoRA adapters and bin-pack models by memory footprint, give interactive traffic priority that preempts batch, enforce fair-share quotas with burst into idle capacity, run batch on spot, route with cache affinity and LRU eviction, keep continuous batching per model, and autoscale pools on queue depth.",
        correct: true,
        feedback:
          "Correct. This treats the problem as bin-packing plus priority scheduling over scarce GPU memory and bandwidth, with isolation from fair-share quotas and cost control from spot capacity and cache-affinity routing.",
      },
    ],
  },
  {
    id: "ch21-21-2-4",
    chapter: 21,
    chapterTitle: "Model Serving at Hyperscaler Scale",
    title: "How do you do capacity planning for an LLM serving fleet?",
    pages: "139",
    route: "/practice/model-serving-at-hyperscaler-scale/how-do-you-do-capacity-planning-for-an-llm-serving-fleet",
    competencies: ["prefill/decode disaggregation", "GPU scheduling", "speculative decoding", "fleet capacity"],
    question:
      "The interviewer notes that GPUs are scarce and expensive with long lead times, then asks: how do you plan capacity for a large LLM service?",
    options: [
      {
        text: "Autoscale GPU pools on traffic the way a CPU service does, with alerts on utilization; the cloud provider supplies GPUs as queues grow.",
        correct: false,
        feedback:
          "This is the junior answer. With procurement lead times, GPUs are not elastic; capacity must be forecast and committed rather than autoscaled on demand.",
      },
      {
        text: "Treat capacity as forecasting and commitment: forecast peak QPS and prompt/output length distributions, derive GPU-seconds per request from load tests, size for peak times a headroom factor, then cut headroom cost with spot fleets, speculative decoding and quantization, and demand shaping via admission control and latency tiers — provisioning per region with cross-region failover and reconciling forecast versus actual.",
        correct: true,
        feedback:
          "Correct. This is the senior answer: demand distributions to GPU-seconds, headroom with explicit cost reduction, regional provisioning with failover, and continuous forecast reconciliation.",
      },
      {
        text: "Provision for average load plus a large idle buffer of GPUs in one region; simplicity beats forecasting accuracy when hardware is expensive.",
        correct: false,
        feedback:
          "Average-load sizing drops peak traffic, and a standing idle buffer is exactly the over-provisioning cost that becomes one of the largest line items in an LLM business.",
      },
    ],
  },
];
