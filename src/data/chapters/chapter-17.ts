import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter17Module: LearningModule = {
  id: "chapter-17-llm-fine-tuning-for-production",
  title: "LLM Fine-Tuning for Production",
  description:
    "Adapt a base or instruct model for production without defaulting to full fine-tuning: sequence the alignment stack, choose among LoRA, QLoRA, and full fine-tuning, treat data as the real quality driver, and serve many fine-tuned variants economically with multi-LoRA.",
  duration: "4 lessons",
  lessons: [
    {
      id: "ch17-adaptation-stack",
      title: "The Adaptation Stack: SFT, Reward Modeling, RLHF, DPO",
      prompt: "Sequence the alignment pipeline in the right order",
      question:
        "A team takes a base instruct model and wants a support assistant that follows a strict response format and matches the tone users prefer. They plan to start by training a reward model and running PPO. What is the strongest plan?",
      options: [
        "Proceed with reward modeling and PPO first, since preference alignment is the most powerful stage",
        "Run supervised fine-tuning on (prompt, ideal-response) pairs first, then apply preference optimization such as DPO to refine tone",
        "Skip both and run continued pre-training on a large support-domain corpus until the behavior emerges",
      ],
      correct: 1,
      feedback:
        "Strong choice. SFT is the workhorse that teaches format, task behavior, and tone; preference optimization then refines a model that is already in the right behavioral neighborhood.",
      explanation:
        "Production alignment is a pipeline, not a single step. SFT teaches the model what a good answer looks like, and preference methods such as RLHF or DPO teach it which of two answers is better. Jumping straight to RLHF builds a fragile RL loop on a model that has not yet learned the target behavior, while continued pre-training is an expensive step reserved for shifting priors when the domain is far from the base.",
      takeaways: [
        "Do SFT first in almost every adaptation effort; it is the highest-leverage step.",
        "Use preference optimization (DPO or RLHF) to refine behavior SFT has already established.",
        "Reserve continued pre-training for domains whose vocabulary and style are genuinely far from the base.",
      ],
      model: ["SFT teaches the format", "Preference methods rank behaviors", "Refine, then evaluate"],
      source: { chapter: 17, sections: ["17.1.1"], pages: "118" },
    },
    {
      id: "ch17-lora-qlora",
      title: "Parameter-Efficient Fine-Tuning: LoRA and QLoRA",
      prompt: "Match the fine-tuning method to the memory budget",
      question:
        "You must adapt a 65B model for an internal tool, and the only hardware available is a single 48GB GPU. Full fine-tuning is impossible in that memory. What approach fits?",
      options: [
        "LoRA in full precision, since freezing the base weights removes all memory pressure",
        "Shrink the training set until full fine-tuning fits on the GPU",
        "QLoRA: quantize the frozen base to 4-bit NF4 and train small higher-precision LoRA adapters on top",
      ],
      correct: 2,
      feedback:
        "Strong choice. QLoRA keeps the base 4-bit and frozen while gradients flow only through the small adapters, which is exactly what makes a 65B model trainable on one 48GB GPU.",
      explanation:
        "Full fine-tuning updates every weight and keeps optimizer state for each parameter, which for a 70B-class model in mixed precision means hundreds of GB of GPU memory. LoRA cuts trainable parameters by 100-1000x but still needs the base resident in higher precision. QLoRA goes further by quantizing the frozen base to 4-bit NF4 and using paged optimizers to survive memory spikes, so budget-constrained teams can still train adapters.",
      takeaways: [
        "Full fine-tuning memory is dominated by all weights plus optimizer state, not just the weights.",
        "LoRA trains only small low-rank matrices, typically under 1% of parameters, and the adapter is megabytes.",
        "QLoRA trades a small quality cost for the lowest memory footprint: a 4-bit frozen base plus 16-bit adapters.",
      ],
      model: ["Freeze the base", "Train low-rank adapters", "Merge or hot-swap"],
      source: { chapter: 17, sections: ["17.1.2"], pages: "118-119" },
    },
    {
      id: "ch17-fine-tuning-data",
      title: "Data: The Real Driver of Fine-Tuning Quality",
      prompt: "Fix the dataset before touching hyperparameters",
      question:
        "Your fine-tuned model is not beating the base model, and the offline numbers looked suspiciously strong during training. What should you investigate first?",
      options: [
        "Audit the dataset for eval contamination, near-duplicates, and preference pairs that differ on length or formatting instead of the target dimension",
        "Collect ten times more training data, since volume is what drives fine-tuning quality",
        "Increase the LoRA rank and learning rate so the model can absorb more of the existing data",
      ],
      correct: 0,
      feedback:
        "Strong choice. Contamination, near-duplicates, and spurious correlations in preference pairs are the silent killers; they inflate offline numbers and hide real regressions.",
      explanation:
        "Fine-tuning quality is dominated by data, not hyperparameters. A few thousand high-quality, diverse SFT examples beat hundreds of thousands of noisy ones, and preference data only teaches the intended dimension when chosen and rejected responses actually differ on it. Training examples leaking into the test set inflates offline scores, so deduplication and decontamination against the eval set come before any scaling effort.",
      takeaways: [
        "Deduplicate and decontaminate training data against the eval set before anything else.",
        "Prefer a few thousand expert-verified, diverse examples over a large noisy crawl.",
        "Audit chosen/rejected pairs so they differ on the dimension you care about, not on length or formatting artifacts.",
      ],
      model: ["Audit silent killers", "Balance and cover", "Ablate data slices"],
      source: { chapter: 17, sections: ["17.1.3"], pages: "119" },
    },
    {
      id: "ch17-multi-lora-serving",
      title: "Serving Fine-Tuned Models: Multi-LoRA",
      prompt: "Serve hundreds of variants on shared hardware",
      question:
        "A platform must serve 300 customer-specific fine-tunes of an 8B model with good GPU utilization. Loading a separate full model per customer is infeasible. What design works?",
      options: [
        "Give every customer a dedicated deployment behind its own endpoint and autoscale the fleet",
        "Merge all 300 customer adapters into one shared model so a single replica serves everyone",
        "Keep one base model resident in GPU memory and hot-swap small per-request LoRA adapters with a multi-LoRA runtime that batches across adapters",
      ],
      correct: 2,
      feedback:
        "Strong choice. Multi-LoRA serving keeps one base in memory and batches requests that use different adapters together, which is what makes hundreds of fine-tunes economically servable.",
      explanation:
        "A multi-LoRA runtime such as S-LoRA or vLLM's multi-LoRA stores the base model once and swaps megabyte-sized adapters per request, even batching heterogeneous adapters in the same forward pass so utilization stays high. One full model per variant wastes memory on 300 near-identical bases, and merging all adapters together destroys per-customer isolation. Operationally you still need adapter tiering, routing, and version pinning, which this lesson's remaining sections cover in depth.",
      takeaways: [
        "Multi-LoRA turns hundreds of models into one base plus hundreds of tiny, swappable deltas.",
        "Cross-adapter batching keeps GPU utilization high even with a heterogeneous customer mix.",
        "Pin every adapter version to the base-model hash so an adapter is never served on a mismatched base.",
      ],
      model: ["One resident base", "Swap adapters per request", "Batch across adapters"],
      source: { chapter: 17, sections: ["17.1.4"], pages: "119-122" },
    },
  ],
};

export const chapter17CourseContent: Record<string, LessonCourseContent> = {
  "ch17-adaptation-stack": {
    objectives: [
      "Describe the stages of the production alignment pipeline and what each one contributes.",
      "Explain the complementary roles of SFT, reward modeling with RLHF, and DPO.",
      "Decide when continued pre-training is justified before SFT.",
    ],
    sections: [
      {
        heading: "Alignment is a pipeline, not a single step",
        paragraphs: [
          "Production adaptation rarely happens in one training run. The full stack has an optional continued pre-training stage that runs next-token training on a large domain corpus to shift the model's priors, a supervised fine-tuning stage on (prompt, ideal-response) pairs, and a preference stage that aligns the model to human judgments. Each stage answers a different question, and skipping ahead creates fragile results.",
          "Continued pre-training is the expensive option and is reserved for cases where the domain vocabulary and style are genuinely far from the base model, such as a new language or a very different distribution. For most teams working near the base model's distribution, SFT is the workhorse and the highest-leverage step.",
        ],
      },
      {
        heading: "SFT teaches what a good answer looks like",
        paragraphs: [
          "Supervised fine-tuning trains on (prompt, ideal-response) pairs and directly teaches format, task behavior, and tone. If the product needs a strict response schema, a house style, or a repeatable procedure, SFT is the stage that installs it. Because it uses ordinary supervised targets, it is also the most stable and best-understood stage to operate.",
          "The practical implication is ordering: you almost always do SFT first. Preference optimization methods refine a model that is already in the right behavioral neighborhood; they are not designed to teach a brand-new task format from scratch. A team that starts with RLHF before SFT is running an expensive, unstable RL loop to solve a problem a few thousand curated examples would have solved.",
        ],
      },
      {
        heading: "Preference optimization teaches which of two answers is better",
        paragraphs: [
          "Reward modeling plus RLHF trains a reward model on human preference pairs, then optimizes the policy against it with PPO. This aligns the model to fuzzy human preferences such as helpfulness, safety, and overall feel that are hard to express as supervised targets. The cost is real: training a stable reward model and running an RL loop that is sensitive to hyperparameters and prone to reward hacking are the two hardest parts of the pipeline.",
          "DPO, Direct Preference Optimization, reaches for the same preference signal without a separate reward model or RL loop. It applies a classification-style loss directly on preference pairs, which makes it simpler and more stable than PPO-based RLHF at some loss of flexibility. For most teams, DPO is the default preference method, and PPO-based RLHF is reserved for objectives that need a standalone reward model, for example to score and filter generations online or to run best-of-n sampling at inference, or for objectives that are not simple pairwise preferences.",
        ],
      },
      {
        heading: "Sequencing decisions and failure modes",
        paragraphs: [
          "The clean mental model is that SFT teaches the model what a good answer looks like while preference methods teach it which of two answers is better. Diagnose the gap before choosing a stage: a format or task gap is an SFT problem, a tone or helpfulness ranking gap is a preference problem, and a domain-prior gap is the only case that justifies continued pre-training.",
          "Common failure modes follow from ignoring this order. Preference-tuning a model that never learned the task produces polished but wrong behavior. Continued pre-training a model whose domain is already close to the base burns compute for little movement. And treating RLHF as a first resort rather than a refinement step multiplies engineering risk before the basics are in place.",
        ],
      },
    ],
    example: {
      title: "Worked example: support assistant with a preferred tone",
      scenario:
        "A base instruct model answers support questions verbosely, ignores the required response template, and users consistently prefer one style of resolution summary over another. The team proposes starting with reward modeling and PPO.",
      analysis:
        "The format violation and task behavior are SFT problems: they can be expressed as (prompt, ideal-response) pairs and trained directly with a stable supervised loss. The style preference is a fuzzy ranking judgment, which is exactly what preference optimization is for. Running PPO first would spend the hardest engineering effort on a model that has not learned the template yet.",
      decision:
        "Run SFT on curated support conversations to install the template and task behavior, then apply DPO on preference pairs that contrast the two summary styles. Skip continued pre-training because the support domain is close to the base model's distribution, and revisit RLHF only if a standalone reward model becomes necessary.",
    },
    productionChecklist: [
      "Confirm the behavioral gap is diagnosed before choosing a pipeline stage.",
      "Run SFT before any preference optimization stage.",
      "Justify continued pre-training with evidence the domain is far from the base.",
      "Default to DPO for preference alignment unless a standalone reward model is required.",
      "Evaluate the model after each stage instead of only at the end of the pipeline.",
    ],
    commonMistakes: [
      "Starting with RLHF or DPO before SFT has established the target behavior.",
      "Paying for continued pre-training when the domain is already close to the base model.",
      "Expecting preference optimization to teach a brand-new task format from scratch.",
      "Treating the alignment stack as one monolithic training run rather than staged, separately evaluated steps.",
    ],
    knowledgeChecks: [
      {
        id: "ch17-adaptation-stack-kc-1",
        prompt: "After SFT, your support model already follows the required response template, but users consistently prefer one style of resolution summary over another. What is the right next training stage?",
        options: [
          "Run preference optimization such as DPO on pairs that contrast the two summary styles, since SFT has already established the format",
          "Run another SFT pass on the same (prompt, ideal-response) pairs until the preferred style dominates",
          "Start continued pre-training on a larger support corpus so the preferred style emerges in the priors",
        ],
        correct: 0,
        feedback: "The mental model is that SFT teaches what a good answer looks like while preference methods teach which of two answers is better, so ranking two valid styles is a DPO or RLHF job.",
      },
      {
        id: "ch17-adaptation-stack-kc-2",
        prompt: "In the lesson's worked example, a base instruct model ignores the required support response template entirely. Which pipeline stage should run first, and what does it install?",
        options: [
          "Reward modeling plus PPO, because aligning to fuzzy preferences early gives the strongest behavioral foundation",
          "DPO on style preference pairs, because tone should be fixed before any task-format training begins",
          "SFT on curated (prompt, ideal-response) pairs, because it is the workhorse stage that teaches format, task behavior, and tone",
        ],
        correct: 2,
        feedback: "SFT is the workhorse and highest-leverage step, teaching format, task behavior, and tone; preference optimization only refines a model already in the right behavioral neighborhood.",
      },
      {
        id: "ch17-adaptation-stack-kc-3",
        prompt: "A team skipped SFT and ran reward modeling plus PPO directly on a base instruct model. Training is unstable and the model still does not follow the task format. What is the root cause?",
        options: [
          "The reward model was too small to capture the preferences, so scaling it up will stabilize the run",
          "Preference optimization was asked to teach a brand-new task format; it refines behavior only after SFT has put the model in the right neighborhood",
          "PPO always behaves this way, so the team should switch the optimizer and rerun the identical pipeline",
        ],
        correct: 1,
        feedback: "You almost always do SFT first: preference methods refine a model already in the right behavioral neighborhood, and PPO's RL loop is notoriously sensitive to hyperparameters and hard to stabilize.",
      },
      {
        id: "ch17-adaptation-stack-kc-4",
        prompt: "A stakeholder proposes continued pre-training on a large domain corpus before any SFT, although the product's domain vocabulary is close to the base model. How do you defend skipping it?",
        options: [
          "Agree to it, because continued pre-training is a mandatory first stage of every production alignment pipeline",
          "Propose DPO instead, because preference optimization can shift the model's domain priors more cheaply than pre-training",
          "Skip it: continued pre-training is the expensive, optional stage reserved for domains whose vocabulary and style are genuinely far from the base, and SFT is the highest-leverage first step here",
        ],
        correct: 2,
        feedback: "Continued pre-training is optional and expensive, used when the domain vocabulary and style are far from the base; for near-base domains SFT is the workhorse with the highest leverage.",
      },
      {
        id: "ch17-adaptation-stack-kc-5",
        prompt: "Your team needs to align the model to fuzzy helpfulness and safety preferences and also wants a reusable scorer for best-of-n sampling at inference time. Which approach fits, and at what cost?",
        options: [
          "DPO, because it optimizes the same preference signal with a simpler and more stable classification-style loss on preference pairs",
          "PPO-based RLHF, because it yields a standalone reward model reusable for online scoring and best-of-n, accepting reward-hacking risk and RL instability",
          "A larger SFT dataset, because supervised targets can express fuzzy helpfulness preferences with enough examples",
        ],
        correct: 1,
        feedback: "DPO gives no separate reward model; PPO-based RLHF earns its complexity when you need a reusable reward model for online scoring or best-of-n, at the cost of reward hacking and RL-loop instability.",
      },
    ],
  },
  "ch17-lora-qlora": {
    objectives: [
      "Explain why full fine-tuning memory grows with all weights plus optimizer state.",
      "Describe how LoRA's low-rank updates cut trainable parameters by 100-1000x.",
      "Choose among full fine-tuning, LoRA, and QLoRA based on memory, quality, and serving constraints.",
    ],
    sections: [
      {
        heading: "Why full fine-tuning is so expensive",
        paragraphs: [
          "Full fine-tuning updates every weight in the model and must keep optimizer state for every parameter. For a 70B model in mixed precision, that adds up to hundreds of GB of GPU memory before you count activations. This is why full fine-tuning is reserved for cases of maximum quality demand, abundant GPUs, or a needed base-model shift.",
          "Parameter-efficient fine-tuning exists to avoid exactly this bill. The insight is that most production adaptation teaches format, tone, or a bounded task, and that does not require moving every weight. Freezing the base and training a small number of extra parameters delivers most of the quality at a fraction of the memory.",
        ],
      },
      {
        heading: "LoRA: low-rank updates on a frozen base",
        paragraphs: [
          "LoRA freezes the base weights and injects small trainable low-rank matrices into selected layers, so the weight update is expressed as a product of two skinny matrices with rank much smaller than the model dimension. Only those small matrices train, which cuts trainable parameters by 100-1000x; in a typical setup under 1% of parameters receive gradients.",
          "The operational properties matter as much as the math. The resulting adapter is tiny, on the order of megabytes, and it can either be merged into the base weights for deployment or kept separate and swapped. Keeping it separate is what enables multi-adapter serving later, and it makes rollback a routing change instead of a redeploy.",
        ],
      },
      {
        heading: "QLoRA: adapters on a 4-bit base",
        paragraphs: [
          "QLoRA pushes the memory savings further by quantizing the frozen base model to 4-bit NF4 precision, then training LoRA adapters on top in higher precision. The base stays 4-bit and frozen while gradients flow only through the 16-bit adapters, and paged optimizers absorb memory spikes during training.",
          "This combination is what lets a team fine-tune a 65B model on a single 48GB GPU. The trade-off is a small quality cost for a very large memory win, which makes QLoRA the default for single-GPU or budget-constrained tuning, while plain LoRA fits when the base fits comfortably in memory and full fine-tuning is reserved for base shifts.",
        ],
      },
      {
        heading: "Operating the training run like a production system",
        paragraphs: [
          "A minimal LoRA or QLoRA setup selects a rank, scaling factor, dropout, and target modules, then verifies that trainable parameters are a small fraction of the total. Rank and target modules are levers, but data quality, the subject of the next lesson, dominates these hyperparameters for the final result.",
          "A production training run adds the pieces a notebook omits: a held-out eval split with early stopping, learning-rate warmup with a cosine schedule, gradient clipping, checkpoint versioning tied to the base-model hash, and a reproducible data manifest. Without those, you cannot reproduce a checkpoint, prove it improved, or safely serve the adapter against the right base.",
        ],
      },
    ],
    example: {
      title: "Worked example: one GPU, one large model",
      scenario:
        "An internal tools team must adapt a 65B model to produce structured incident summaries. They have a single 48GB GPU, a few thousand curated examples, and no budget for a training cluster.",
      analysis:
        "Full fine-tuning needs hundreds of GB for weights plus optimizer state, so it is out. Plain LoRA still requires the 65B base resident in higher precision, which also exceeds the card. QLoRA quantizes the frozen base to 4-bit NF4 and trains small 16-bit adapters, which fits the memory envelope; the curated dataset is already the right scale, since a few thousand high-quality examples are enough for a bounded task.",
      decision:
        "Train QLoRA adapters targeting the attention projections, with a held-out eval split, early stopping, warmup plus cosine schedule, and gradient clipping. Version the checkpoint against the base-model hash, keep the adapter separate from the base, and validate quality on a domain eval before assuming a more expensive method would do better.",
    },
    productionChecklist: [
      "Estimate memory as all weights plus optimizer state before dismissing or choosing full fine-tuning.",
      "Verify the trainable-parameter fraction after applying the adapter config.",
      "Use QLoRA with NF4 quantization and paged optimizers when GPU memory is the binding constraint.",
      "Add a held-out eval split with early stopping, warmup, cosine schedule, and gradient clipping.",
      "Version every checkpoint with the base-model hash and a reproducible data manifest.",
    ],
    commonMistakes: [
      "Assuming full fine-tuning always wins instead of validating LoRA against a domain eval set.",
      "Counting only weight memory and forgetting optimizer state in the full fine-tuning budget.",
      "Training adapters without a held-out split, so overfitting is discovered in production.",
      "Shipping an adapter without recording which base-model hash it was trained against.",
    ],
    knowledgeChecks: [
      {
        id: "ch17-lora-qlora-kc-1",
        prompt: "You need to teach a 13B instruct model a strict output schema for one bounded task, the base fits comfortably in GPU memory, and no domain shift is expected. Which fine-tuning method is the default?",
        options: [
          "Full fine-tuning, because updating every weight is always the highest-quality option for any adaptation",
          "LoRA, because most production adaptation teaches format, tone, or a bounded task and LoRA handles that with adapters alone",
          "QLoRA, because 4-bit quantization of the base is required even when memory is not the binding constraint",
        ],
        correct: 1,
        feedback: "This lesson's method comparison makes LoRA the default for most production adaptation, with quality usually within a point or two of full fine-tuning; QLoRA targets memory constraints and full FT targets base shifts.",
      },
      {
        id: "ch17-lora-qlora-kc-2",
        prompt: "In the lesson's worked example, a team must adapt a 65B model on a single 48GB GPU. Which specific QLoRA configuration choice makes that training run fit in memory?",
        options: [
          "Quantize the frozen base to 4-bit NF4, train 16-bit LoRA adapters on top, and use paged optimizers to survive memory spikes",
          "Load the base in full 16-bit precision and freeze it, since freezing alone removes enough memory pressure for training",
          "Merge the adapters into the base weights before training so only one set of weights occupies GPU memory",
        ],
        correct: 0,
        feedback: "QLoRA keeps the base 4-bit and frozen while gradients flow only through the 16-bit adapters, with paged optimizers for spikes, which is what lets a 65B model train on one 48GB GPU.",
      },
      {
        id: "ch17-lora-qlora-kc-3",
        prompt: "After a routine base-model upgrade, every customer's previously trained adapter starts producing degraded output with no explicit error. Which missing production practice allowed this incident?",
        options: [
          "The LoRA rank was set too low during the original training runs for all customers",
          "The training runs omitted the cosine learning-rate schedule, so the adapters were never converged",
          "Checkpoints and adapters were not versioned against the base-model hash, so stale adapters were served on a mismatched base",
        ],
        correct: 2,
        feedback: "The production setup requires checkpoint versioning with the base-model hash precisely so an adapter is never served on a mismatched base; a base upgrade silently invalidates unversioned adapters.",
      },
      {
        id: "ch17-lora-qlora-kc-4",
        prompt: "A stakeholder demands full fine-tuning for a tone-and-format adaptation, arguing only it can reach maximum quality. How do you defend choosing LoRA instead?",
        options: [
          "LoRA quality is usually within a point or two of full fine-tuning for behavioral adaptation, so validate on a domain eval set rather than paying hundreds of GB of memory for an assumed win",
          "Concede, because low-rank updates are mathematically incapable of matching full fine-tuning on any task",
          "Counter with QLoRA everywhere, since the lowest memory footprint is always the right production choice",
        ],
        correct: 0,
        feedback: "The senior answer insists on validating against a domain eval rather than assuming full FT wins, noting LoRA usually matches it for behavioral adaptations while full FT is justified only for genuine base shifts.",
      },
      {
        id: "ch17-lora-qlora-kc-5",
        prompt: "Your QLoRA notebook runs and prints that under one percent of parameters train. What must be added before this setup qualifies as a production training run?",
        options: [
          "Nothing: a small trainable-parameter fraction already guarantees reproducibility and safe deployment",
          "Only a higher LoRA rank and more epochs, because coverage of the weight space is the remaining gap",
          "A held-out eval split with early stopping, learning-rate warmup plus a cosine schedule, gradient clipping, checkpoint versioning with the base hash, and a reproducible data manifest",
        ],
        correct: 2,
        feedback: "This lesson's operating section enumerates exactly these additions for a production run: held-out eval with early stopping, warmup plus cosine schedule, gradient clipping, base-hash checkpoint versioning, and a reproducible data manifest.",
      },
    ],
  },
  "ch17-fine-tuning-data": {
    objectives: [
      "Explain why fine-tuning quality is dominated by data rather than hyperparameters.",
      "Detect the silent dataset killers: eval contamination, near-duplicates, and spurious correlations.",
      "Design coverage, balance, and data ablations that measurably improve the model.",
    ],
    sections: [
      {
        heading: "Data dominates hyperparameters",
        paragraphs: [
          "Fine-tuning quality is driven by the dataset far more than by rank, learning rate, or schedule choices. A few thousand high-quality, diverse SFT examples beat hundreds of thousands of noisy ones, because the model imitates the distribution it is shown. Noise, contradictions, and low-quality responses in the training set become noise, contradictions, and low-quality behavior in the model.",
          "This reframes where engineering effort goes. When a fine-tune underperforms, the first move is to audit and improve the data, not to sweep hyperparameters. The blunt interview heuristic: a junior answer says add more data; a senior answer treats data as a measured, audited asset.",
        ],
      },
      {
        heading: "The silent killers: contamination, duplicates, artifacts",
        paragraphs: [
          "Three failure modes quietly destroy fine-tuning value. Eval contamination, where training examples leak into the test set, inflates offline numbers and hides real regressions. Near-duplicates over-represent some patterns and waste capacity. Spurious correlations in preference data, such as chosen responses being systematically longer, teach the model the wrong lesson, like verbosity instead of quality.",
          "The countermeasures are mechanical but non-negotiable: deduplicate the training set, decontaminate it against the eval set, and audit chosen/rejected pairs to confirm they differ on the dimension you actually care about, for example groundedness, rather than on length or formatting artifacts.",
        ],
      },
      {
        heading: "Coverage and balance",
        paragraphs: [
          "Once the data is clean, make it representative. Mine real production queries so the training distribution matches deployment, and add hard and adversarial cases the base model fails on, because those are the examples that move behavior. Prefer a small set of expert-verified examples over a large noisy crawl.",
          "Balance the mix so rare-but-important categories are not drowned out by common ones. A category that appears in one training example out of ten thousand will not survive gradient averaging, no matter how critical it is to the product.",
        ],
      },
      {
        heading: "Prove it with data ablations",
        paragraphs: [
          "Treating data as an asset means measuring its contribution. Train on data slices and measure which slice actually moves the target metric, then invest annotation budget where it pays off. This turns dataset construction from a one-shot curation effort into an iterative, evidence-driven loop.",
          "Ablations also protect against regressions in the opposite direction. If removing a slice improves the metric, that slice was teaching something harmful, and you would never have found it by staring at aggregate training loss. Fine-tuning is dominated by quality and diversity, not volume, and ablations are how you verify both.",
        ],
      },
    ],
    example: {
      title: "Worked example: the fine-tune that lost to the base model",
      scenario:
        "A team's fine-tuned model shows strong offline scores during training but loses to the base model on a fresh evaluation. Stakeholders propose scraping a much larger training set and retraining.",
      analysis:
        "The gap between training-time scores and fresh evaluation is the classic contamination signature: training examples leaked into the original test set inflated the numbers. A dataset audit also finds near-duplicate templates and preference pairs where the chosen response is simply longer. Adding more scraped data would amplify all three problems instead of fixing them.",
      decision:
        "Deduplicate the training set, decontaminate it against a rebuilt eval set, and re-audit preference pairs so chosen and rejected differ on groundedness rather than length. Then mine real production queries, add adversarial cases the base fails, and run data-slice ablations to direct the remaining annotation budget. Only retrain after the data passes these checks.",
    },
    productionChecklist: [
      "Deduplicate the training set and decontaminate it against the eval set before training.",
      "Audit preference pairs so chosen and rejected differ on the target dimension, not length or formatting.",
      "Mine real production queries so training matches the deployment distribution.",
      "Balance the mix so rare-but-critical categories are represented.",
      "Run data-slice ablations to measure which data actually moves the metric.",
    ],
    commonMistakes: [
      "Answering every quality problem with more data instead of auditing the existing data.",
      "Letting training examples leak into the test set and trusting the inflated offline scores.",
      "Building preference pairs that differ only in length or formatting, teaching verbosity.",
      "Tuning rank and learning rate while the dataset still contains duplicates and contamination.",
    ],
    knowledgeChecks: [
      {
        id: "ch17-fine-tuning-data-kc-1",
        prompt: "Your fine-tuned model underperforms the base model on a fresh evaluation, and leadership wants to know your first move. What do you investigate before changing anything else?",
        options: [
          "Scale the dataset by an order of magnitude, because training volume is the primary driver of fine-tuning quality",
          "Sweep the LoRA rank and learning rate, because hyperparameters dominate fine-tuning outcomes",
          "Audit the dataset for eval contamination, near-duplicates, and preference pairs whose chosen and rejected differ on length or formatting artifacts",
        ],
        correct: 2,
        feedback: "The senior answer starts with the silent killers: contamination inflates offline numbers, near-duplicates waste capacity, and spurious length or format correlations in preference data teach the wrong behavior.",
      },
      {
        id: "ch17-fine-tuning-data-kc-2",
        prompt: "In the lesson's worked example, the fine-tune showed strong offline scores during training but lost to the base model on a fresh evaluation. What does that signature most likely indicate?",
        options: [
          "Underfitting, so the team should extend the training schedule until the fresh evaluation improves",
          "Eval contamination: training examples leaked into the test set, inflating offline numbers while hiding the real regression",
          "The preference pairs were too short, so lengthening the chosen responses will close the gap",
        ],
        correct: 1,
        feedback: "Eval contamination is a silent killer precisely because leaked training examples inflate offline numbers and hide real regressions; the fix is decontamination, not more training.",
      },
      {
        id: "ch17-fine-tuning-data-kc-3",
        prompt: "After preference optimization, the model's answers became noticeably longer but no more accurate or grounded. Which dataset defect most plausibly taught this behavior?",
        options: [
          "The chosen responses were systematically longer than the rejected ones, so the model learned verbosity instead of the target dimension",
          "The reward model hacked its own scoring function and rewarded length directly during the RL loop",
          "The base model drifted during SFT, and longer outputs are a normal side effect of any preference stage",
        ],
        correct: 0,
        feedback: "If chosen responses are systematically longer, the model just learns to be verbose; pairs must differ on the dimension you care about, such as groundedness, not length or formatting artifacts.",
      },
      {
        id: "ch17-fine-tuning-data-kc-4",
        prompt: "Stakeholders push to scrape a massive noisy dataset because more data feels safer. How do you defend investing instead in a few thousand expert-verified examples?",
        options: [
          "Agree with them, because fine-tuning improvements are fundamentally a function of training-set volume",
          "Fine-tuning is dominated by quality and diversity, not volume: the model imitates the distribution it is shown, so noise in the training set becomes noise in behavior, and a few thousand high-quality diverse examples beat hundreds of thousands of noisy ones",
          "Argue that dataset size is irrelevant because hyperparameters, not data, determine fine-tuning quality",
        ],
        correct: 1,
        feedback: "Fine-tuning quality is dominated by data rather than hyperparameters, and a few thousand high-quality, diverse SFT examples beat hundreds of thousands of noisy ones.",
      },
      {
        id: "ch17-fine-tuning-data-kc-5",
        prompt: "You have a limited annotation budget left and several candidate data slices to expand. How do you decide where the remaining budget actually pays off?",
        options: [
          "Run data ablations: train on data slices and measure which slice moves the target metric, then invest where the evidence points",
          "Annotate the categories that are cheapest to label, since coverage of any kind improves the model",
          "Split the budget evenly across all categories to guarantee a balanced distribution without extra experiments",
        ],
        correct: 0,
        feedback: "The senior answer runs ablations over data slices to find which slice drives the metric, treating data as a measured, audited asset rather than assuming more of anything is better.",
      },
    ],
  },
  "ch17-multi-lora-serving": {
    objectives: [
      "Explain why one full model per fine-tuned variant does not scale to a long tail of customers.",
      "Describe how multi-LoRA serving batches requests that use different adapters.",
      "Design the operational layer: adapter tiering, routing, capacity caps, and version pinning.",
    ],
    sections: [
      {
        heading: "The long-tail serving problem",
        paragraphs: [
          "A common production need is dozens or hundreds of fine-tuned variants, one per customer or per task. Loading a separate full model for each variant is infeasible: an 8B model replicated 300 times wastes almost all of its memory on identical base weights, and utilization collapses because each replica serves a thin slice of traffic.",
          "The key observation is that LoRA adapters are tiny swappable deltas, on the order of megabytes each. If the base can stay resident and only the delta changes per request, then 300 models collapse into one base plus 300 small adapters, which is the only economical way to serve a long tail of fine-tunes.",
        ],
      },
      {
        heading: "How multi-LoRA serving works",
        paragraphs: [
          "Multi-LoRA serving, implemented by runtimes such as S-LoRA or vLLM's multi-LoRA support, keeps one base model in GPU memory and swaps small per-request LoRA adapters. Crucially, it can batch requests that use different adapters in the same forward pass by applying each request's adapter to its own rows, so GPU utilization stays high even with a heterogeneous mix of customers.",
          "This changes the serving math fundamentally. Adapter storage is cheap, loading is fast, and the expensive base weights are amortized across every tenant. Fine-tuning with LoRA is effectively mandatory for this topology, because full fine-tunes mean one full model per variant and there is nothing small to swap.",
        ],
      },
      {
        heading: "The operational layer: tiering, routing, and caps",
        paragraphs: [
          "Production multi-LoRA needs a cache policy. Keep hot adapters pinned in GPU or host memory and cold ones in object storage behind an LRU cache, route requests to adapters by customer identifier, and cap the number of concurrently loaded adapters per replica to bound memory. Without a cap, a burst across many tenants can evict the working set and thrash adapter loads.",
          "Traffic shape should drive exceptions. If a few customers dominate traffic, merging their adapter into a dedicated replica buys the lowest latency for them, while the long tail continues to share the multi-LoRA pool. This hybrid keeps the economics of shared hardware without penalizing the tenants who pay for most of it.",
        ],
      },
      {
        heading: "Versioning and safe rollout",
        paragraphs: [
          "Every adapter must be versioned against the base-model hash so an adapter is never served on a mismatched base. A base upgrade without re-validating adapters silently changes every customer's behavior, and a mismatched pairing can produce garbage output without any explicit error.",
          "The same property that makes adapters cheap makes rollback fast: reverting a bad fine-tune is routing traffic back to the previous adapter version, not redeploying a model. Record the tuple of base hash, adapter version, and data manifest for every served variant so any deployed behavior is fully reproducible and auditable.",
        ],
      },
    ],
    example: {
      title: "Worked example: 300 customers on shared GPUs",
      scenario:
        "A support platform sells customer-specific assistants. Each of 300 enterprise customers has its own fine-tuned variant of an 8B model, traffic is long-tailed, and finance requires good GPU utilization.",
      analysis:
        "Three hundred dedicated deployments replicate the same base 300 times and leave most replicas idle. Merging all adapters into one model destroys per-customer behavior. Multi-LoRA serving keeps one base resident, stores 300 megabyte-scale adapters cheaply, and batches across adapters so utilization stays high despite the heterogeneous mix.",
      decision:
        "Fine-tune every customer with LoRA and serve through a multi-LoRA runtime. Route by customer ID, pin hot adapters in memory, keep cold adapters in object storage behind an LRU cache, and cap concurrently loaded adapters per replica. Merge the few dominant customers' adapters into dedicated replicas for latency, and version every adapter against the base-model hash.",
    },
    productionChecklist: [
      "Fine-tune variants as LoRA adapters so the serving layer has swappable deltas.",
      "Batch requests across different adapters to keep GPU utilization high.",
      "Tier adapters with hot ones pinned in memory and cold ones in object storage behind an LRU cache.",
      "Cap concurrently loaded adapters per replica to bound memory and prevent thrashing.",
      "Pin every adapter version to the base-model hash and record the full reproducibility tuple.",
    ],
    commonMistakes: [
      "Deploying each fine-tuned variant as its own full model behind a dedicated endpoint.",
        "Merging all customer adapters into a single shared model and losing per-customer behavior.",
      "Loading an unbounded number of adapters per replica so bursts evict the working set.",
      "Serving an adapter on a base version it was not trained or validated against.",
    ],
    knowledgeChecks: [
      {
        id: "ch17-multi-lora-serving-kc-1",
        prompt: "A platform must serve 300 customer-specific fine-tunes of an 8B model with good GPU utilization, and loading a separate full model per customer is infeasible. What serving design do you choose?",
        options: [
          "Give every customer a dedicated deployment behind its own endpoint and rely on autoscaling for utilization",
          "Keep one base model resident in GPU memory and hot-swap small per-request LoRA adapters with a multi-LoRA runtime that batches across adapters",
          "Merge all 300 customer adapters into one shared model so a single replica serves every tenant",
        ],
        correct: 1,
        feedback: "The answer is multi-LoRA serving: one base in memory, megabyte-scale adapters swapped per request, and cross-adapter batching in the same forward pass, the only economical way to serve a long tail of fine-tunes.",
      },
      {
        id: "ch17-multi-lora-serving-kc-2",
        prompt: "In this lesson's 300-customer worked example, a handful of customers generate most of the traffic and demand the lowest latency. What does the design recommend for those dominant customers?",
        options: [
          "Pin all 300 adapters permanently in GPU memory so every customer gets identical latency",
          "Train those customers full fine-tunes instead of adapters, since adapters cannot serve heavy traffic",
          "Merge each dominant customer's adapter into a dedicated replica for the lowest latency, while the long tail keeps sharing the multi-LoRA pool",
        ],
        correct: 2,
        feedback: "The design in this lesson merges a dominant customer's adapter into a dedicated replica when a few customers dominate traffic, keeping the long tail on the shared multi-LoRA pool for economics.",
      },
      {
        id: "ch17-multi-lora-serving-kc-3",
        prompt: "A traffic burst spanning many tenants causes constant adapter loading, evictions, and latency spikes on your multi-LoRA replicas. Which missing control most directly explains the thrashing?",
        options: [
          "There was no cap on concurrently loaded adapters per replica and no LRU hot/cold tiering to bound the working set",
          "The adapters were trained with too low a rank, so each request took longer to finish under load",
          "Cold adapters were stored in object storage, which is never appropriate for a multi-LoRA deployment",
        ],
        correct: 0,
        feedback: "The operational design caps concurrently loaded adapters per replica to bound memory and tiers hot adapters in GPU or host memory with cold ones in object storage behind an LRU cache; without the cap, bursts evict the working set.",
      },
      {
        id: "ch17-multi-lora-serving-kc-4",
        prompt: "A teammate argues for full fine-tuning every customer variant because adapters feel like a compromise. How do you defend LoRA as effectively mandatory for this serving topology?",
        options: [
          "LoRA trains faster than full fine-tuning, and training speed is the deciding factor for serving architecture",
          "LoRA always produces higher-quality models, so there is no real trade-off to discuss",
          "Multi-LoRA economics require tiny swappable deltas: full fine-tunes mean one full model per variant with nothing small to swap, so 300 variants would mean 300 resident models instead of one base plus 300 megabyte-scale adapters",
        ],
        correct: 2,
        feedback: "The senior answer notes the serving axis often decides the training method: with many variants LoRA or QLoRA is mandatory because multi-LoRA hot-swaps adapters on one resident base, while full fine-tunes mean one full model per variant.",
      },
      {
        id: "ch17-multi-lora-serving-kc-5",
        prompt: "A new adapter version for one customer is ready to replace the one currently serving production traffic. What does this lesson's rollout guidance require around that swap?",
        options: [
          "Deploy it immediately to all of the customer's traffic, since adapters are small enough that mistakes are cheap",
          "Pin the new adapter to the base-model hash, record the base hash, adapter version, and data manifest for reproducibility, and keep rollback as routing back to the previous adapter version",
          "Merge the new adapter into the shared base model so the rollback plan and version record become unnecessary",
        ],
        correct: 1,
        feedback: "This lesson's rollout section requires adapter-to-base-hash version pinning and a recorded base hash, adapter version, and data manifest tuple, and it makes rollback a routing change to the previous adapter rather than a redeploy.",
      },
    ],
  },
};

export const chapter17Practice: CatalogPracticeUnit[] = [
  {
    id: "ch17-17-2-1",
    chapter: 17,
    chapterTitle: "LLM Fine-Tuning for Production",
    title: "When do you choose LoRA vs QLoRA vs full fine-tuning?",
    pages: "120",
    route: "/practice/llm-fine-tuning-for-production/when-do-you-choose-lora-vs-qlora-vs-full-fine-tuning",
    competencies: ["SFT", "LoRA/QLoRA", "RLHF/DPO", "data quality", "multi-LoRA serving"],
    question:
      "Walk me through how you decide between LoRA, QLoRA, and full fine-tuning for a production adaptation.",
    options: [
      {
        text: "Default to LoRA in every situation because it is the cheapest option; the behavioral gap and serving plan rarely change the answer.",
        correct: false,
        feedback:
          "This is the junior answer: it ignores behavioral distance from the base, GPU budget, and serving topology, and assumes cheap always wins.",
      },
      {
        text: "Decide on three axes: how far the target behavior is from the base, the GPU budget, and the serving topology. LoRA is the default for format, tone, or bounded tasks; QLoRA when memory is the constraint; full fine-tuning or continued pre-training when the domain is genuinely far from the base and GPUs are available. If many variants will be served, LoRA/QLoRA is mandatory for multi-LoRA economics, and the choice is validated on a domain eval set rather than assuming full fine-tuning wins.",
        correct: true,
        feedback:
          "Correct. The senior answer ties the choice to behavioral distance, memory, and multi-LoRA serving economics, and insists on domain-eval validation since LoRA usually matches full fine-tuning for behavioral adaptation.",
      },
      {
        text: "Always full fine-tune when quality matters, because low-rank adapters can never match the quality of updating every weight.",
        correct: false,
        feedback:
          "LoRA quality is usually within a point or two of full fine-tuning for behavioral adaptation, and full fine-tuning is reserved for genuine base shifts, not assumed superior.",
      },
    ],
  },
  {
    id: "ch17-17-2-2",
    chapter: 17,
    chapterTitle: "LLM Fine-Tuning for Production",
    title: "Compare RLHF and DPO. When would you still use PPO-based RLHF?",
    pages: "120",
    route: "/practice/llm-fine-tuning-for-production/compare-rlhf-and-dpo-when-would-you-still-use-ppo-based-rlhf",
    competencies: ["SFT", "LoRA/QLoRA", "RLHF/DPO", "data quality", "multi-LoRA serving"],
    question:
      "DPO is simpler than RLHF. Why does RLHF still exist, and how would you choose between them?",
    options: [
      {
        text: "RLHF is legacy: DPO is newer, simpler, and more stable, so the correct answer is to always use DPO and retire PPO-based pipelines entirely.",
        correct: false,
        feedback:
          "Choosing by recency is the junior pattern; DPO cannot give you a reusable reward model or directly optimize non-pairwise rewards.",
      },
      {
        text: "Always run PPO-based RLHF because it has the higher alignment ceiling; DPO's simplicity is not worth the lost flexibility even for small teams.",
        correct: false,
        feedback:
          "The recommended default is the opposite: start with DPO because it gets most of the benefit at a fraction of the engineering risk, and accept PPO's reward-hacking and instability costs only for specific objective shapes.",
      },
      {
        text: "Default to DPO, since it collapses the reward model plus PPO pipeline into one supervised-style loss and avoids reward-model fragility and RL instability. Reach for PPO-based RLHF when you need a standalone, reusable reward model for online scoring or best-of-n sampling, when the objective is not a simple pairwise preference such as a verifiable or composite reward, or when you need the last increment of alignment quality and have the team to operate the stability tooling.",
        correct: true,
        feedback:
          "Correct. The staff answer chooses by objective shape and downstream reuse: DPO by default, RLHF for a reusable reward model, non-pairwise objectives, or the alignment ceiling with an operating team.",
      },
    ],
  },
  {
    id: "ch17-17-2-3",
    chapter: 17,
    chapterTitle: "LLM Fine-Tuning for Production",
    title: "How do you build a fine-tuning dataset that actually improves the model?",
    pages: "121",
    route: "/practice/llm-fine-tuning-for-production/how-do-you-build-a-fine-tuning-dataset-that-actually-improves-the-model",
    competencies: ["SFT", "LoRA/QLoRA", "RLHF/DPO", "data quality", "multi-LoRA serving"],
    question:
      "Your fine-tune isn't beating the base model. How do you fix the dataset?",
    options: [
      {
        text: "Hunt the silent killers first: deduplicate, decontaminate training data against the eval set, and audit chosen/rejected pairs so they differ on the target dimension rather than length or formatting. Then improve coverage by mining real production queries and adding hard, adversarial cases the base fails on, balance rare-but-critical categories, prefer a few thousand expert-verified examples over a noisy crawl, and run data-slice ablations to invest annotation budget where it moves the metric.",
        correct: true,
        feedback:
          "Correct. The senior answer treats data as a measured, audited asset: kill contamination, duplicates, and spurious correlations first, then improve coverage and prove impact with ablations.",
      },
      {
        text: "Scale the dataset aggressively, since fine-tuning improvements are mostly a function of training volume; quality concerns can be handled after the run.",
        correct: false,
        feedback:
          "Fine-tuning is dominated by quality and diversity, not volume: a few thousand high-quality examples beat hundreds of thousands of noisy ones.",
      },
      {
        text: "Leave the dataset as is and treat it as a training problem: raise the LoRA rank, extend the schedule, and sweep the learning rate until the metric moves.",
        correct: false,
        feedback:
          "This inverts the core principle that data, not hyperparameters, drives fine-tuning quality; tuning hyperparameters on a contaminated, duplicated dataset entrenches the failure.",
      },
    ],
  },
  {
    id: "ch17-17-2-4",
    chapter: 17,
    chapterTitle: "LLM Fine-Tuning for Production",
    title: "Design serving for hundreds of fine-tuned variants",
    pages: "121",
    route: "/practice/llm-fine-tuning-for-production/design-serving-for-hundreds-of-fine-tuned-variants",
    competencies: ["SFT", "LoRA/QLoRA", "RLHF/DPO", "data quality", "multi-LoRA serving"],
    question:
      "You must serve 300 customer-specific fine-tunes of an 8B model with good GPU utilization. How?",
    options: [
      {
        text: "Deploy each customer's model behind its own endpoint and rely on autoscaling to keep utilization acceptable across the fleet.",
        correct: false,
        feedback:
          "This is the junior pattern: 300 full replicas waste memory on identical base weights and leave most replicas idle on long-tail traffic.",
      },
      {
        text: "Fine-tune with LoRA and use multi-LoRA serving: one base 8B resident in GPU memory, megabyte-scale adapters stored cheaply and loaded per request, with cross-adapter batching in the same forward pass. Keep hot adapters pinned and cold ones in object storage behind an LRU cache, route by customer ID, cap concurrently loaded adapters per replica, merge dominant customers' adapters into dedicated replicas for latency, and version every adapter against the base-model hash.",
        correct: true,
        feedback:
          "Correct. The staff answer exploits that adapters are tiny swappable deltas: one base, cross-adapter batching, hot/cold tiering, per-replica caps, dedicated replicas for heavy tenants, and adapter-to-base version pinning.",
      },
      {
        text: "Merge all 300 customer adapters into one combined model so a single replica can serve every tenant with maximum utilization.",
        correct: false,
        feedback:
          "Merging every adapter together erases per-customer behavior; only an individual dominant customer's adapter is merged into a dedicated replica while the long tail shares the multi-LoRA pool.",
      },
    ],
  },
  {
    id: "ch17-17-2-5",
    chapter: 17,
    chapterTitle: "LLM Fine-Tuning for Production",
    title: "How do you evaluate and safely roll out a fine-tuned model?",
    pages: "122",
    route: "/practice/llm-fine-tuning-for-production/how-do-you-evaluate-and-safely-roll-out-a-fine-tuned-model",
    competencies: ["SFT", "LoRA/QLoRA", "RLHF/DPO", "data quality", "multi-LoRA serving"],
    question:
      "You fine-tuned a model and offline metrics improved. How do you evaluate it fully and roll it out safely?",
    options: [
      {
        text: "Ship it: an improved offline score on the target task is the release gate, and standard monitoring will catch anything else after rollout.",
        correct: false,
        feedback:
          "This is the junior answer: fine-tuning can silently degrade general capability and safety, so a single improved offline metric is necessary but not sufficient.",
      },
      {
        text: "Re-run only the target-task evaluation on a larger test set, then release to all traffic at once, since fine-tuning on benign data does not affect safety behavior.",
        correct: false,
        feedback:
          "Fine-tuning, even on benign data, can erode safety alignment, and the prescribed rollout is staged shadow plus canary rather than a big-bang release.",
      },
      {
        text: "Evaluate on three fronts: the target task, a capability-retention suite to catch catastrophic forgetting, and a safety/refusal suite, plus paraphrased prompts to detect over-fitting to format artifacts. Roll out with shadow traffic against the incumbent, then canary 5% to 25% to 100% with automatic rollback on quality, latency, or safety regressions; with LoRA, rollback is instant by routing to the previous adapter, and the base hash, adapter version, and data manifest are recorded for reproducibility.",
        correct: true,
        feedback:
          "Correct. The senior answer gates on target quality, capability retention, safety, and paraphrase robustness, then uses shadow plus staged canary with instant LoRA rollback and full reproducibility metadata.",
      },
    ],
  },
];
