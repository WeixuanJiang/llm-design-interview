import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter22Module: LearningModule = {
  id: "chapter-22-evaluation-framework-design-deep-dive",
  title: "Evaluation Framework Design (Deep Dive)",
  description:
    "Treat evaluation as a measurement system with its own validity, bias, and error bars: trustworthy LLM judges, engineered human review, governed benchmarks, and statistically sound online experiments.",
  duration: "4 lessons",
  lessons: [
    {
      id: "ch22-llm-as-judge-trustworthy",
      title: "LLM-as-Judge: Making It Trustworthy",
      prompt: "Turn an LLM judge from an oracle into a calibrated instrument",
      question:
        "A team wants to replace weekly human scoring of support answers with an LLM judge that scores every release candidate overnight and gates deployment. What is the most defensible rollout?",
      options: [
        "Point the strongest available model at the outputs with a 1-10 scoring prompt and start gating releases on the average score.",
        "Run pairwise comparisons with randomized, swapped positions, a rubric with worked examples, and reasons before verdicts, then validate judge-human agreement on a labeled calibration set before using it for decisions.",
        "Let the generation model grade its own outputs, since it best understands what a good answer looks like.",
      ],
      correct: 1,
      feedback:
        "Strong choice. The judge is an instrument: design out its known biases, then calibrate it against human labels and report that agreement before trusting it.",
      explanation:
        "LLM judges fail in predictable ways: position bias, verbosity bias, self-preference, and sensitivity to rubric wording. Pairwise comparison with swapped order, a precise rubric, and reasons-before-verdict reduce those biases, but they do not prove validity. The chapter's bar is validation against human labels, because an uncalibrated judge is an unmeasured instrument that silently misdirects every decision it feeds.",
      takeaways: [
        "Prefer pairwise comparison over absolute 1-10 scoring; randomize and swap positions and average.",
        "Give the judge a precise rubric with examples and require a reason before the verdict.",
        "Validate judge-human agreement on a labeled set and report it as a property of the metric.",
      ],
      model: ["Design out bias", "Calibrate on humans", "Report agreement"],
      source: { chapter: 22, sections: ["22.1.1"], pages: "140" },
    },
    {
      id: "ch22-human-in-the-loop-pipelines",
      title: "Human-in-the-Loop Pipelines",
      prompt: "Spend scarce human judgment where it buys the most validity",
      question:
        "A team has budget for 2,000 human labels per month and a backlog of 100,000 outputs that need evaluation. How should they spend the human labels?",
      options: [
        "Assign one trusted senior reviewer to score as many outputs as possible each month, maximizing the number of human-labeled items.",
        "Work through the backlog chronologically so the oldest unlabeled outputs receive human scores first.",
        "Fund the judge's calibration set, hard and ambiguous cases, and a production audit sample, with multiple annotators per item, kappa tracking, seeded gold items, and adjudication.",
      ],
      correct: 2,
      feedback:
        "Strong choice. Humans are highest-leverage building the calibration set, labeling hard cases, and auditing production, with label quality measured rather than assumed.",
      explanation:
        "Human judgment is the ground truth that anchors automated evaluation, but it is expensive and noisy, so quality must be engineered: clear guidelines, multiple annotators per item, inter-annotator agreement such as Cohen's or Fleiss' kappa, adjudication, and seeded gold-standard items. Where humans are spent matters as much as how: calibration sets, hard cases, and production audits, not scoring everything.",
      takeaways: [
        "Measure inter-annotator agreement; low agreement means the task is under-specified.",
        "Seed gold-standard items and adjudicate disagreements to keep annotators honest.",
        "Spend humans on calibration sets, hard cases, and production audits, not bulk scoring.",
      ],
      model: ["Guidelines", "Agreement and gold checks", "Highest-leverage spend"],
      source: { chapter: 22, sections: ["22.1.2"], pages: "140" },
    },
    {
      id: "ch22-benchmark-design-contamination",
      title: "Benchmark Design and Contamination",
      prompt: "Keep benchmarks representative, powered, decontaminated, and moving",
      question:
        "A model's score on a popular public benchmark jumps twelve points after the latest training run, and leadership wants to announce the win. What should the evaluation lead check first?",
      options: [
        "Whether benchmark items leaked into training data, and whether the gain holds on a decontaminated private held-out set that mirrors real usage.",
        "Re-run the benchmark several times and publish the median; once variance is under control, the score can be taken at face value.",
        "Publish the gain but pair it with scores on other public benchmarks to show the improvement is broad.",
      ],
      correct: 0,
      feedback:
        "Strong choice. A contaminated benchmark measures memorization, not capability; the chapter is blunt that scores are meaningless if eval data sits in training.",
      explanation:
        "A good eval set is representative of real usage, covers edge and adversarial cases, is large enough for statistical power, and is decontaminated. Goodhart's law adds a second failure mode: once a benchmark becomes the target, teams overfit to it, so held-out sets should rotate and some stay private. Capability benchmarks and product evals answer different questions and should be weighted by what the product actually needs.",
      takeaways: [
        "Decontaminate: eval items present in training data make scores meaningless.",
        "Rotate held-out sets and keep some private to resist Goodhart overfitting.",
        "Separate capability benchmarks from product evals and weight by real product needs.",
      ],
      model: ["Representative and powered", "Decontaminated", "Rotated and private"],
      source: { chapter: 22, sections: ["22.1.3"], pages: "140" },
    },
    {
      id: "ch22-online-evaluation-statistical-rigor",
      title: "Online Evaluation and Statistical Rigor",
      prompt: "Design experiments whose results are evidence rather than noise",
      question:
        "Two weeks into an A/B test of a new model, the primary metric shows p < 0.05 on three of the last five daily checks, and the product manager wants to declare a winner and ship. What is the statistically sound response?",
      options: [
        "Ship it: independent daily checks showing significance on most days means the effect is stable.",
        "Extend the test indefinitely until the p-value stays below 0.05 for a full consecutive week.",
        "Hold to the pre-registered plan: the sample size was computed for the minimum detectable effect, so keep the fixed horizon or use a sequential test, then check guardrails and segment heterogeneity before shipping.",
      ],
      correct: 2,
      feedback:
        "Strong choice. Repeatedly checking p-values and stopping at the first significant reading inflates false positives; horizon and power are decided before launch.",
      explanation:
        "Online evaluation confirms offline predictions with real users, but only with statistical discipline: a primary metric and guardrails chosen up front, sample size computed for the minimum detectable effect, and no peeking without a sequential-testing design. Novelty effects and heterogeneous segment impact can hide behind an aggregate win, and for LLM products behavioral metrics must be paired with quality proxies because users can prefer an output that is subtly less faithful.",
      takeaways: [
        "Pre-register the primary metric, guardrails, and minimum detectable effect; power the test from them.",
        "Do not peek: commit to a fixed horizon or use sequential testing built for continuous monitoring.",
        "Pair engagement with quality proxies; preference can rise while faithfulness quietly falls.",
      ],
      model: ["Pre-register", "Power and horizon", "Guardrails and segments"],
      source: { chapter: 22, sections: ["22.1.4"], pages: "140" },
    },
  ],
};

export const chapter22CourseContent: Record<string, LessonCourseContent> = {
  "ch22-llm-as-judge-trustworthy": {
    objectives: [
      "Name the known LLM-as-judge failure modes: position bias, verbosity bias, self-preference, and rubric sensitivity.",
      "Design judging tasks that reduce bias by construction: pairwise comparison, position swapping, rubrics with examples, reasons before verdicts.",
      "Validate a judge against human labels and report agreement before letting it drive decisions.",
    ],
    sections: [
      {
        heading: "The judge is an instrument, not an oracle",
        paragraphs: [
          "An LLM judge scales evaluation from a weekly human sample to every release candidate, but a scorer is a measurement instrument with its own error profile. The chapter names four failure modes to control: position bias in pairwise comparisons, verbosity or length bias, self-preference toward the judge's own model family, and sensitivity to how the rubric is worded.",
          "Because these biases are systematic rather than random, scoring more outputs does not wash them out. A judge that prefers longer answers prefers them consistently, and every downstream gate built on its scores inherits the skew. The design goal is to remove as much bias as possible by construction, then measure what remains.",
        ],
      },
      {
        heading: "Designing the bias out",
        paragraphs: [
          "Prefer pairwise comparison over absolute 1-10 scoring: choosing the better of two responses is a more reliable judgment than assigning a calibrated number. Randomize which response appears first, swap the order, and average across orders so position bias cancels out.",
          "Give the judge a precise rubric with worked examples so scores do not drift with prompt wording, and require the judge to state reasons before its verdict; the chain-of-thought improves reliability and makes each judgment auditable. For high-stakes decisions, do not let a model judge its own family, because self-preference is a documented bias rather than a hypothetical one.",
        ],
      },
      {
        heading: "Calibration against human labels",
        paragraphs: [
          "Bias-resistant design is still not proof of validity. The critical step is validating the judge against humans: build a human-labeled calibration set, measure judge-human agreement, and report that agreement as a property of the metric itself. The agreement among humans sets the ceiling the judge can realistically approach.",
          "Deploy the judge only for decisions where its agreement is high enough, and say so wherever its scores are consumed. A judge whose agreement is unknown is an unmeasured instrument: it can be confidently wrong while looking authoritative, and it will silently misdirect every decision it feeds.",
        ],
      },
      {
        heading: "Operating the judge over time",
        paragraphs: [
          "Judge scores are not stable across model versions. Swap the judge model and the score distribution shifts even when the quality of the outputs being graded is unchanged, so scores from different judge versions are not directly comparable. Record the judge version alongside every score.",
          "Re-validate agreement whenever the judge version changes, and keep a standing human audit sample in the loop rather than calibrating once at launch. Monitor judge-human agreement for drift so a judge that was trustworthy at deployment does not quietly become a source of false confidence.",
        ],
      },
    ],
    example: {
      title: "Worked example: release-gating a support copilot",
      scenario:
        "A support copilot ships weekly prompt and model updates. Humans can review 300 answers a week, but the team wants every release candidate scored on 5,000 outputs overnight, with an LLM judge deciding pass or fail.",
      analysis:
        "A 5,000-output nightly gate is exactly where judge bias gets expensive: a length bias would push every release toward longer answers, and position bias would add noise that looks like week-to-week quality movement. The 300 weekly human labels are the calibration budget, used to measure judge-human agreement and to see how close the judge gets to the human-human agreement ceiling.",
      decision:
        "Run pairwise judging with swapped order, a rubric with worked examples, and reasons before verdicts. Validate agreement on the human-labeled calibration set and gate releases only where agreement is high enough, keep a weekly human audit sample in the loop, and re-validate whenever the judge model version changes.",
    },
    productionChecklist: [
      "Use pairwise comparison with randomized, swapped positions instead of absolute 1-10 scores.",
      "Ship the rubric with worked examples and require reasons before the verdict.",
      "Build a human-labeled calibration set and report judge-human agreement.",
      "Do not let a model judge its own family for high-stakes decisions.",
      "Re-validate agreement on judge version changes and keep a human audit sample.",
    ],
    commonMistakes: [
      "Treating a strong model's 1-10 score as ground truth without human calibration.",
      "Ignoring position and length bias because aggregate scores look stable.",
      "Letting a model grade its own family's outputs for a high-stakes gate.",
      "Assuming judge scores survive a judge-model version upgrade without re-validation.",
    ],
    knowledgeChecks: [
      {
        id: "ch22-llm-as-judge-trustworthy-kc-1",
        prompt: "A team configures an LLM judge to score release candidates overnight. Which judging-task design does the chapter recommend for controlling the judge's known biases?",
        options: [
          "Ask the judge for a 1-10 quality score per output with a short prompt, keeping the task simple so scores stay consistent.",
          "Use pairwise comparisons with randomized and swapped positions, a precise rubric with worked examples, and require reasons before the verdict.",
          "Have the generation model judge its own outputs, since it has the deepest understanding of what it intended to say.",
        ],
        correct: 1,
        feedback: "The chapter names position, verbosity, self-preference, and rubric-sensitivity as judge failure modes, and prescribes pairwise comparison with swapped positions, rubric examples, and reasons-first as mitigations.",
      },
      {
        id: "ch22-llm-as-judge-trustworthy-kc-2",
        prompt: "In the worked example, humans can review 300 answers weekly while the LLM judge scores 5,000 outputs nightly. What is the right use of the 300 human labels?",
        options: [
          "Build a calibration set that measures judge-human agreement before the nightly gate is trusted with release decisions.",
          "Spot-check whichever outputs received the lowest judge scores that week, since low scores indicate the most risk.",
          "Re-grade a random 300 of the 5,000 nightly outputs so human scores can replace the judge's scores for that day.",
        ],
        correct: 0,
        feedback: "The chapter's calibration requirement makes human labels the yardstick: judge-human agreement must be measured and reported before the judge drives decisions, which is exactly what the 300-label budget funds.",
      },
      {
        id: "ch22-llm-as-judge-trustworthy-kc-3",
        prompt: "After the team upgrades the judge model version, overnight gate outcomes shift noticeably although output quality is unchanged. What does the chapter say is the most likely explanation?",
        options: [
          "The new judge is simply more accurate, so the shifted gates reveal quality differences the old judge was missing.",
          "The outputs must have drifted in ways the team has not measured yet, and the judge is only reporting that drift.",
          "Judge scores shift across model versions even when graded quality is unchanged, so the judge must be re-validated against human labels before its scores are trusted again.",
        ],
        correct: 2,
        feedback: "The chapter warns that judge scores are not stable across model versions and requires re-validation on version change plus a standing human audit sample, treating the judge as an instrument that drifts.",
      },
      {
        id: "ch22-llm-as-judge-trustworthy-kc-4",
        prompt: "A stakeholder insists on 1-10 absolute scores because dashboards need numbers, while you propose pairwise comparison. How do you defend the pairwise choice using the chapter's reasoning?",
        options: [
          "Pairwise judgments are more reliable than absolute scoring, and position bias can be canceled by randomizing and swapping order, so a reliable ranking beats a precise-looking but noisy number.",
          "Pairwise comparison is cheaper in tokens, and cost is the chapter's main argument for preferring it over absolute scores.",
          "Absolute scores cannot be averaged, so pairwise is the only mathematically valid way to aggregate judge opinions.",
        ],
        correct: 0,
        feedback: "The chapter's argument is reliability, not cost or mathematical necessity: it states pairwise comparison is more reliable than 1-10 scoring, with position randomization and averaging to cancel position bias.",
      },
      {
        id: "ch22-llm-as-judge-trustworthy-kc-5",
        prompt: "Before an LLM judge is allowed to gate releases, what does the chapter require the team to measure, report, and keep monitoring in production?",
        options: [
          "The judge's average score and score variance across releases, since stable statistics indicate a healthy instrument.",
          "Nothing beyond the rubric: a well-written rubric with examples is sufficient validation for a strong model.",
          "Judge-human agreement on a calibration set, reported as a property of the metric, plus a standing human audit sample and re-validation whenever the judge version changes.",
        ],
        correct: 2,
        feedback: "The chapter's core demand is calibration: validate the judge against human labels, report agreement as a property of the metric, keep a human audit sample, and re-validate on version change, because an unvalidated judge is an unmeasured instrument.",
      },
    ],
  },
  "ch22-human-in-the-loop-pipelines": {
    objectives: [
      "Allocate scarce human labeling to its highest-leverage uses: judge calibration, hard cases, and production audits.",
      "Engineer label quality with guidelines, multi-annotator agreement, gold-standard items, and adjudication.",
      "Interpret inter-annotator agreement as a statement about whether the task itself is well-specified.",
    ],
    sections: [
      {
        heading: "Humans as ground truth: expensive and noisy",
        paragraphs: [
          "Human judgment is the ground truth that anchors automated evaluation: it calibrates the LLM judge and defines what good means for the product. But human labels are expensive, so they cannot cover everything, and they are noisy, so they cannot be taken at face value.",
          "The design problem is therefore twofold: spend human effort where it buys the most validity, and engineer the labeling process so the labels themselves can be trusted. Skipping either half produces an evaluation stack that looks precise while resting on unquantified noise.",
        ],
      },
      {
        heading: "Engineering label quality",
        paragraphs: [
          "Write precise annotation guidelines with examples and edge-case rules, then place multiple annotators on each item and measure inter-annotator agreement, using Cohen's kappa for pairs or Fleiss' kappa for larger groups. Agreement measurement is not bureaucracy: it quantifies label noise before any metric is built on top of it.",
          "If humans disagree with each other, the task is under-specified, and no metric built on those labels is reliable. Route disagreements to an adjudicator, and seed gold-standard items with known answers to catch low-quality or rushed annotators before their labels contaminate the set.",
        ],
      },
      {
        heading: "Spending humans where they are highest-leverage",
        paragraphs: [
          "Humans should not score everything; that does not scale and it wastes their comparative advantage. Their highest-leverage jobs are building the calibration set that validates the LLM judge, labeling hard, ambiguous, and adversarial cases, and auditing a sample of production traffic.",
          "The validated judge then handles the bulk volume. This division of labor is what makes the whole evaluation stack scale: human agreement bounds the judge's trustworthiness, and the judge extends human judgment to every release candidate and a live traffic sample.",
        ],
      },
      {
        heading: "Closing the loop",
        paragraphs: [
          "Treat labels as versioned data with provenance: who labeled each item, under which guidelines, and with what measured agreement. When guidelines change, the meaning of older labels changes with them, so label sets need the same release discipline as code.",
          "The operating loop is: humans produce trusted ground truth, that ground truth calibrates and bounds the automated judge, the judge scales evaluation to full volume, and humans re-audit periodically and whenever drift appears. Human evaluation is itself a measurement system whose noise must be quantified before anything is built on it.",
        ],
      },
    ],
    example: {
      title: "Worked example: calibrating a judge for a coding assistant",
      scenario:
        "A coding-assistant team has budget for 1,500 human labels a month. They need to validate an LLM judge, and they suspect quality differs sharply between easy prompts and adversarial ones.",
      analysis:
        "Spending all 1,500 labels on random outputs would leave the judge unvalidated and the hard cases unmeasured. The labels buy more validity split across three buckets: a multi-annotator calibration set, the hard and adversarial cases where the judge is least trustworthy, and a small audit sample of live production traffic.",
      decision:
        "Write guidelines with edge-case rules, double-label every calibration item and compute kappa, seed gold items to filter rushed annotators, and adjudicate disagreements. Validate the judge against the calibrated labels, let it score bulk volume, and re-audit production traffic each cycle.",
    },
    productionChecklist: [
      "Publish annotation guidelines with examples and edge-case rules.",
      "Multi-label calibration items and report Cohen's or Fleiss' kappa.",
      "Seed gold-standard items to detect low-quality annotators.",
      "Route disagreements to an adjudicator and record the resolution.",
      "Version labels with provenance and re-audit production traffic periodically.",
    ],
    commonMistakes: [
      "Spending the whole label budget on random bulk scoring instead of calibration and hard cases.",
      "Using a single annotator per item so label noise stays invisible.",
      "Treating disagreements as annotator errors instead of evidence the task is under-specified.",
      "Skipping gold-standard items, so rushed or low-quality annotators go undetected.",
    ],
    knowledgeChecks: [
      {
        id: "ch22-human-in-the-loop-pipelines-kc-1",
        prompt: "A labeling budget covers only a small fraction of outputs needing evaluation. According to the chapter, where should scarce human labeling effort be allocated?",
        options: [
          "Evenly across all product areas, so every team gets some human coverage each month.",
          "On the newest outputs first, working backward until the monthly budget is exhausted.",
          "On the judge's calibration set, hard and ambiguous cases, and a production audit sample, rather than attempting to score everything.",
        ],
        correct: 2,
        feedback: "The chapter directs humans to their highest-leverage uses: building the judge's calibration set, labeling hard and ambiguous cases, and auditing production traffic, while the validated judge handles bulk volume.",
      },
      {
        id: "ch22-human-in-the-loop-pipelines-kc-2",
        prompt: "In the worked example, a coding-assistant team has 1,500 human labels per month and suspects quality differs between easy and adversarial prompts. How should the labels be spent?",
        options: [
          "All 1,500 on random production outputs, so the monthly sample is unbiased and statistically clean.",
          "Across a multi-annotator calibration set, hard and adversarial cases where the judge is least trustworthy, and a small audit sample of live traffic.",
          "Primarily on outputs the judge scored highest, to confirm the judge is not being too generous.",
        ],
        correct: 1,
        feedback: "The worked example splits the budget across calibration, hard and adversarial cases, and a production audit sample, which is the chapter's highest-leverage allocation rather than random bulk scoring.",
      },
      {
        id: "ch22-human-in-the-loop-pipelines-kc-3",
        prompt: "Inter-annotator agreement on the calibration set comes back low, with frequent disagreements between labelers. What does the chapter say this signals and how should the team respond?",
        options: [
          "The task is under-specified: low agreement means no metric built on these labels is reliable, so tighten guidelines with edge-case rules and adjudicate disagreements.",
          "The team hired weak annotators and should replace the bottom half, then continue with the same guidelines.",
          "Disagreement is healthy diversity of opinion, and averaging the labels preserves the signal.",
        ],
        correct: 0,
        feedback: "The chapter treats low inter-annotator agreement as evidence the task is under-specified and the labels unreliable, prescribing precise guidelines, adjudication, and agreement measurement rather than blaming or averaging.",
      },
      {
        id: "ch22-human-in-the-loop-pipelines-kc-4",
        prompt: "To double labeling throughput, a manager proposes one annotator per item instead of several. How do you defend multi-annotator labeling with kappa measurement using the chapter's argument?",
        options: [
          "Multiple annotators exist mainly to train new labelers, so once annotators are experienced, single labeling is acceptable.",
          "A single annotator makes label noise invisible; multiple annotators per item let the team quantify label quality with kappa and catch under-specified tasks before metrics are built on them.",
          "Kappa is mainly useful for annotator pay decisions, so skipping it only affects staffing, not evaluation quality.",
        ],
        correct: 1,
        feedback: "The chapter's point is that human labels are noisy and their noise must be quantified: multiple annotators with kappa measurement reveal label quality, while single labeling hides it entirely.",
      },
      {
        id: "ch22-human-in-the-loop-pipelines-kc-5",
        prompt: "Which pipeline mechanisms does the chapter specify for keeping human label quality trustworthy as the evaluation program runs in production?",
        options: [
          "Seeded gold-standard items to catch low-quality annotators, adjudication for disagreements, and labels versioned with provenance.",
          "Weekly annotator self-assessments and a suggestion box for guideline improvements.",
          "A single final review by the most senior annotator, whose judgment overrides all others.",
        ],
        correct: 0,
        feedback: "The chapter prescribes gold-standard items with known answers to detect low-quality annotators, adjudication for disagreements, and labels treated as versioned data with provenance, closing the loop with periodic re-audit.",
      },
    ],
  },
  "ch22-benchmark-design-contamination": {
    objectives: [
      "Specify what makes an eval set trustworthy: representative, adversarial, powered, and decontaminated.",
      "Explain Goodhart's law and defend benchmarks with rotation and private held-out sets.",
      "Distinguish capability benchmarks from product evals and weight them by product needs.",
    ],
    sections: [
      {
        heading: "What a good eval set looks like",
        paragraphs: [
          "A trustworthy eval set is representative of real usage, covers edge and adversarial cases rather than only happy paths, and is large enough to give statistical power for the differences the team cares about. A small or easy set produces confident-looking numbers that cannot support a real decision.",
          "Above all, the set must be decontaminated: if eval items appear in training data, the score reflects memorization rather than capability and is, in the chapter's blunt phrasing, meaningless. Decontamination is a property the team verifies, not one it assumes from a benchmark's reputation.",
        ],
      },
      {
        heading: "Contamination in practice",
        paragraphs: [
          "Contamination happens directly, when eval items are scraped into a fine-tuning corpus, and indirectly, when public benchmarks circulate on the web that pre-training consumes. The larger and more public the benchmark, the more likely parts of it already sit inside the model being measured.",
          "The defense is a private held-out set that never leaves the team's control, plus active decontamination checks against training corpora. A gain that appears on a public benchmark but vanishes on the private set is a contamination signal, not a capability gain.",
        ],
      },
      {
        heading: "Goodhart's law and benchmark decay",
        paragraphs: [
          "Once a benchmark becomes a target, teams overfit to it: the score keeps rising while the underlying ability stops improving. This is Goodhart's law, and it means every benchmark has a shelf life as a measurement tool.",
          "The mitigation is rotation and secrecy: rotate held-out sets, keep some private, and refresh with new and adversarial cases so the eval keeps moving. An eval that no longer correlates with real outcomes is worse than no eval, because it manufactures false confidence.",
        ],
      },
      {
        heading: "Capability benchmarks versus product evals",
        paragraphs: [
          "Capability benchmarks measure general ability across a broad spread of tasks; product evals answer a narrower question: does the system work for our task, on our data, under our constraints. Both are useful, but they answer different questions and one cannot substitute for the other.",
          "Weight metrics by what the product actually needs. A model can top a capability leaderboard and still fail the product eval, because users may value faithfulness and concision while the public benchmark rewards fluent completeness.",
        ],
      },
    ],
    example: {
      title: "Worked example: the leaderboard win users did not feel",
      scenario:
        "After a training update, the model jumps nine points on a popular public benchmark and marketing wants to announce it. Meanwhile the private product eval is flat, and support tickets about wrong-but-confident answers are unchanged.",
      analysis:
        "The divergence has three candidate causes from the chapter: contamination of the public benchmark, Goodhart overfitting now that the benchmark is a target, or construct mismatch between what the benchmark rewards and what users value. A private, decontaminated, product-aligned held-out set discriminates among them.",
      decision:
        "Withhold the announcement. Verify decontamination, re-run on the private held-out set, and realign the product eval's weights toward faithfulness and task success before treating the public gain as real progress.",
    },
    productionChecklist: [
      "Verify decontamination of every eval set against training corpora.",
      "Keep at least one private held-out set that never leaves team control.",
      "Rotate held-out sets and add fresh adversarial cases on a schedule.",
      "Maintain separate capability benchmarks and product evals, weighted by product needs.",
      "Check periodically that offline gains still predict online and user outcomes.",
    ],
    commonMistakes: [
      "Reporting public benchmark gains without checking for contamination.",
      "Letting one frozen benchmark serve as the permanent target for every team.",
      "Confusing a capability benchmark with a product eval.",
      "Treating rising eval scores as progress after they stopped predicting user outcomes.",
    ],
    knowledgeChecks: [
      {
        id: "ch22-benchmark-design-contamination-kc-1",
        prompt: "A team is assembling an evaluation set for a new model release. Which properties does the chapter say a trustworthy eval set must have?",
        options: [
          "Representative of real usage, covering edge and adversarial cases, large enough for statistical power, and decontaminated from training data.",
          "Sourced entirely from a respected public benchmark so results stay comparable with other labs.",
          "Small and stable, so scores remain comparable across many releases without recomputation.",
        ],
        correct: 0,
        feedback: "The chapter lists four properties: representative of real usage, edge and adversarial coverage, enough volume for statistical power, and decontamination, warning that contaminated eval items make scores meaningless.",
      },
      {
        id: "ch22-benchmark-design-contamination-kc-2",
        prompt: "In the worked example, a model jumps nine points on a public benchmark while the private product eval stays flat and user complaints continue. Which causes should the team investigate?",
        options: [
          "Only whether the public benchmark was run with the correct prompt template, since harness differences explain most divergences.",
          "Whether the product eval is simply too strict and should be recalibrated to match the public benchmark's scale.",
          "Contamination of the public benchmark, Goodhart overfitting to it as a target, and construct mismatch between what it rewards and what users value.",
        ],
        correct: 2,
        feedback: "The chapter names exactly these three causes for the benchmark-reality gap: contamination, Goodhart overfitting, and construct mismatch, each with its own fix rather than harness or scale adjustments.",
      },
      {
        id: "ch22-benchmark-design-contamination-kc-3",
        prompt: "For two years a team has optimized against one frozen benchmark; scores keep rising while user outcomes stagnate. How does the chapter diagnose this situation?",
        options: [
          "The model has genuinely maximized product quality, so the remaining user complaints must be unrelated to model behavior.",
          "Goodhart's law: once the benchmark became the target, the team overfit to it, so the set must be rotated, partly kept private, and refreshed with new and adversarial cases.",
          "The benchmark needs more items from the same distribution so statistical power increases.",
        ],
        correct: 1,
        feedback: "The chapter invokes Goodhart's law for exactly this pattern: a benchmark that becomes a target stops measuring general ability, and the fix is rotation, private held-out sets, and fresh adversarial cases.",
      },
      {
        id: "ch22-benchmark-design-contamination-kc-4",
        prompt: "Leadership wants to announce a public benchmark gain immediately, while you want to verify it on a private decontaminated set first. What is the chapter-based defense for waiting?",
        options: [
          "If eval items leaked into training, directly or via the web, the score reflects memorization rather than capability, so a public gain that vanishes on a private decontaminated set is a contamination signal, not progress.",
          "Private sets are smaller, so they give a more conservative, board-friendly number for announcements.",
          "Public benchmarks change their scoring often, so waiting a few weeks lets their methodology settle.",
        ],
        correct: 0,
        feedback: "The chapter states contaminated eval data makes scores meaningless because high scores reflect memorization, and prescribes private held-out sets plus decontamination checks as verification before trusting public gains.",
      },
      {
        id: "ch22-benchmark-design-contamination-kc-5",
        prompt: "Which ongoing practices does the chapter prescribe to keep an evaluation set honest as a living asset in production?",
        options: [
          "Annual re-publication of the benchmark so external researchers can audit it.",
          "Mine real production failures into the eval, separate capability benchmarks from product evals, and continuously verify that offline gains still predict online and user outcomes.",
          "Lock the eval after launch so every release is measured against an unchanging yardstick.",
        ],
        correct: 1,
        feedback: "The chapter's systemic fix treats the eval as a living asset: mine production failures into it, keep capability benchmarks distinct from product evals, and rebuild when offline gains stop predicting user outcomes.",
      },
    ],
  },
  "ch22-online-evaluation-statistical-rigor": {
    objectives: [
      "Design an A/B test whose result is decidable: pre-registered metrics, powered sample size, fixed horizon.",
      "Explain why peeking inflates false positives and how sequential testing or fixed horizons prevent it.",
      "Pair behavioral metrics with quality proxies so preference cannot mask a faithfulness regression.",
    ],
    sections: [
      {
        heading: "Offline predicts, online confirms",
        paragraphs: [
          "Offline evaluation predicts; only online evaluation with real users confirms. An A/B test is the confirmation instrument, which means its design determines whether the number it produces is evidence or noise.",
          "The design work happens before launch: choose a single primary metric tied to the goal, choose guardrail metrics that must not regress, such as latency, cost, safety, and faithfulness, and state the minimum detectable effect the team actually cares about.",
        ],
      },
      {
        heading: "Power, randomization, and balance",
        paragraphs: [
          "From the minimum detectable effect and the metric's variance, compute the required sample size and run duration. Significance cannot be read off whatever data happened to accrue; an underpowered test manufactures false negatives, and an overpowered one with repeated looks manufactures false positives.",
          "Randomize at the right unit, often the user rather than the request, so repeated requests from one user do not create correlated samples, and verify the arms are balanced on the dimensions that matter before trusting any readout.",
        ],
      },
      {
        heading: "Peeking and its cure",
        paragraphs: [
          "Repeatedly checking p-values during a run and stopping at the first significant reading dramatically inflates false positives. Every look is another chance for random noise to cross the threshold, and dashboards make looking effortless.",
          "The cures are to commit to a fixed horizon set by the power calculation, or to use a sequential test designed for continuous monitoring, whose thresholds account for repeated looks. Declaring victory mid-run because today crossed p < 0.05 is not rigor; it is noise harvesting.",
        ],
      },
      {
        heading: "Novelty, segments, and LLM-specific metrics",
        paragraphs: [
          "Watch novelty effects, the early behavior change that fades as users acclimate, by examining the metric trend across the whole run rather than its first days. Check heterogeneity too: a model can win overall while hurting a key segment.",
          "For LLM products specifically, pair behavioral metrics such as engagement, task success, and thumbs with quality proxies, because users can prefer an output that is subtly less faithful. Ship only when the primary metric clears significance and no guardrail regresses.",
        ],
      },
    ],
    example: {
      title: "Worked example: the two-week win",
      scenario:
        "A new model launches to 5% of traffic. On day 10 the primary metric, task success, shows p < 0.05, the product manager wants to ship to 100%, but the power calculation called for 21 days and the faithfulness guardrail is not yet segmented.",
      analysis:
        "Stopping on day 10 because the p-value crossed the threshold is peeking, and it inflates false positives. The early lift may be a novelty bump that fades, and the unsegmented guardrail could hide a faithfulness regression concentrated in a minority cohort.",
      decision:
        "Hold the pre-registered 21-day horizon or switch to a pre-planned sequential test, examine the daily trend for novelty decay, segment the guardrails by cohort, and ship only if the primary metric clears significance with no guardrail regression.",
    },
    productionChecklist: [
      "Pre-register one primary metric, guardrails, and the minimum detectable effect.",
      "Compute sample size and duration from the effect and metric variance before launch.",
      "Randomize at the user level and verify arm balance.",
      "Use a fixed horizon or a sequential test; never stop on the first significant peek.",
      "Pair engagement metrics with faithfulness and quality proxies before shipping.",
    ],
    commonMistakes: [
      "Peeking daily and stopping the test at the first p < 0.05 reading.",
      "Randomizing by request, which correlates samples from the same user.",
      "Declaring a winner on engagement while a faithfulness guardrail quietly regresses.",
      "Ignoring novelty effects and segment heterogeneity behind an aggregate win.",
    ],
    knowledgeChecks: [
      {
        id: "ch22-online-evaluation-statistical-rigor-kc-1",
        prompt: "Before launching an A/B test of a new model, which elements does the chapter say must be defined up front for the result to be decidable?",
        options: [
          "Only the traffic split percentage and the dashboard link, so the team can react quickly to early movement.",
          "A single primary metric tied to the goal, guardrail metrics that must not regress, and the minimum detectable effect used to compute sample size and duration.",
          "A list of every metric that might move, so no change goes unnoticed during the run.",
        ],
        correct: 1,
        feedback: "The chapter requires pre-registering one primary metric, guardrails such as latency, cost, safety, and faithfulness, and a minimum detectable effect, since significance cannot be read off whatever data accrues.",
      },
      {
        id: "ch22-online-evaluation-statistical-rigor-kc-2",
        prompt: "In the worked example, the primary metric crosses p < 0.05 on day 10 of a test powered for 21 days, and the product manager pushes to ship. What is the right call?",
        options: [
          "Ship early but only to 50 percent, splitting the difference between speed and caution.",
          "Re-run the power calculation with the observed effect size, which will now justify the shorter run.",
          "Hold the pre-registered 21-day horizon or use a pre-planned sequential test, examine the trend for novelty decay, segment guardrails, and ship only with significance and no guardrail regression.",
        ],
        correct: 2,
        feedback: "The worked example applies the chapter's anti-peeking rule: stopping at the first significant reading inflates false positives, so the fixed horizon or a sequential design governs, with novelty and segment checks before shipping.",
      },
      {
        id: "ch22-online-evaluation-statistical-rigor-kc-3",
        prompt: "A team checks its experiment dashboard daily and stops tests whenever significance appears; half of the shipped wins later fail to hold. How does the chapter explain this?",
        options: [
          "Repeatedly checking p-values and stopping at the first significant reading inflates false positives; each look is another chance for noise to cross the threshold, so use a fixed horizon or sequential testing.",
          "The tests were underpowered because traffic was split 50/50 instead of 90/10 in favor of control.",
          "The shipped wins were real but user tastes changed after each launch, invalidating the results.",
        ],
        correct: 0,
        feedback: "This is the chapter's peeking failure mode: repeated significance checks with early stopping dramatically inflate false positives, and the cure is a fixed horizon from the power calculation or a sequential test designed for continuous monitoring.",
      },
      {
        id: "ch22-online-evaluation-statistical-rigor-kc-4",
        prompt: "An engineer argues for request-level randomization because it produces a larger sample faster. How do you defend user-level randomization using the chapter's reasoning?",
        options: [
          "User-level randomization is simply the industry convention, and conventions reduce design review time.",
          "Request-level randomization is acceptable as long as the traffic volume is very high.",
          "Repeated requests from one user are correlated samples, which breaks the independence the significance math assumes; randomizing at the user level keeps arms comparable and the analysis valid.",
        ],
        correct: 2,
        feedback: "The chapter directs randomizing at the right unit, often the user rather than the request, precisely because correlated samples from the same user distort the experiment, and it also requires checking arm balance.",
      },
      {
        id: "ch22-online-evaluation-statistical-rigor-kc-5",
        prompt: "The chapter says LLM experiments must pair behavioral metrics with quality proxies before shipping. What is the reasoning, and what are the final ship criteria?",
        options: [
          "Behavioral metrics are slower to move, so quality proxies act as fast leading indicators; ship when proxies trend upward.",
          "Users can prefer an output that is subtly less faithful, so engagement alone misleads; ship only when the primary metric clears significance and no guardrail, including faithfulness, regresses.",
          "Quality proxies are cheaper to compute than behavioral metrics, so they reduce experimentation cost; ship when cost stays flat.",
        ],
        correct: 1,
        feedback: "The chapter warns that a model can be preferred while being subtly worse on faithfulness, so behavioral metrics need quality proxies alongside, and shipping requires a significant primary metric with no guardrail regression.",
      },
    ],
  },
};

const chapter22Competencies = ["LLM-as-judge", "human review", "benchmarks", "online experimentation"];

export const chapter22Practice: CatalogPracticeUnit[] = [
  {
    id: "ch22-22-2-1",
    chapter: 22,
    chapterTitle: "Evaluation Framework Design (Deep Dive)",
    title: "How do you make an LLM-as-judge trustworthy?",
    pages: "141",
    route: "/practice/evaluation-framework-design-deep-dive/how-do-you-make-an-llm-as-judge-trustworthy",
    competencies: chapter22Competencies,
    question:
      "You want to use an LLM to evaluate model outputs at scale. How do you make the judge reliable enough to drive decisions?",
    options: [
      {
        text: "Design the biases out with pairwise comparison, randomized and swapped positions, length-bias controls, a precise rubric with worked examples, and reasons before verdicts, avoiding self-family judging for high-stakes calls. Then validate the judge against a human-labeled calibration set, report judge-human agreement, keep a human audit sample, and re-validate on every judge version change.",
        correct: true,
        feedback:
          "Correct. This is the calibrated-instrument answer: biases designed out first, then validated against human labels with agreement reported, monitored for drift, and re-validated when the judge version changes.",
      },
      {
        text: "Pick the strongest available model and ask it to rate each output on a 1-10 scale with a short prompt; a frontier model's ratings are consistent enough that calibration against humans is optional.",
        correct: false,
        feedback:
          "Absolute 1-10 scoring is exactly what the chapter warns is less reliable than pairwise comparison, and skipping human validation leaves an unmeasured ruler that can be confidently wrong.",
      },
      {
        text: "Let the model that generates the answers also grade them, since it best understands its own outputs, and average its scores over a large sample so random error washes out.",
        correct: false,
        feedback:
          "Self-preference is a named judge bias: a model rates its own family higher. Averaging a large sample reduces variance, not a systematic bias like that.",
      },
    ],
  },
  {
    id: "ch22-22-2-2",
    chapter: 22,
    chapterTitle: "Evaluation Framework Design (Deep Dive)",
    title: "How do you run a statistically sound A/B test for an LLM change?",
    pages: "141",
    route: "/practice/evaluation-framework-design-deep-dive/how-do-you-run-a-statistically-sound-a-b-test-for-an-llm-change",
    competencies: chapter22Competencies,
    question:
      "You're A/B testing a new model in production. How do you make sure the result is real and not noise?",
    options: [
      {
        text: "Split traffic evenly, check significance daily, and ship as soon as the primary metric crosses p < 0.05; speed matters and you can always roll back if the effect was illusory.",
        correct: false,
        feedback:
          "Repeatedly checking p-values and stopping at the first significant reading dramatically inflates false positives; the chapter requires a fixed horizon or a sequential test built for continuous monitoring.",
      },
      {
        text: "Randomize at the request level to maximize sample size, run for a couple of weeks, and read significance off whatever data accrued; with enough volume, statistical power takes care of itself.",
        correct: false,
        feedback:
          "Per-request randomization correlates samples from the same user, and significance cannot be read off accrued data; sample size is computed up front from the minimum detectable effect and the metric's variance.",
      },
      {
        text: "Pre-register a single primary metric plus guardrails (latency, cost, safety, faithfulness) and a minimum detectable effect, power the sample size and duration from them, randomize at the user level, do not peek (fixed horizon or a sequential test), check novelty effects and segment heterogeneity, and ship only when the primary metric clears significance with no guardrail regression.",
        correct: true,
        feedback:
          "Correct. Validity is designed before launch: metrics, minimum detectable effect, power, and user-level randomization, then peeking is ruled out and novelty, heterogeneity, and quality-paired guardrails are checked before shipping.",
      },
    ],
  },
  {
    id: "ch22-22-2-3",
    chapter: 22,
    chapterTitle: "Evaluation Framework Design (Deep Dive)",
    title: "Design a human-in-the-loop evaluation pipeline",
    pages: "142",
    route: "/practice/evaluation-framework-design-deep-dive/design-a-human-in-the-loop-evaluation-pipeline",
    competencies: chapter22Competencies,
    question:
      "Human labels are expensive and noisy. Design an evaluation pipeline that uses humans efficiently and trusts the labels.",
    options: [
      {
        text: "Hire enough annotators to have one person score every model output before each release; human judgment is ground truth, so maximizing human coverage maximizes trust.",
        correct: false,
        feedback:
          "Scoring everything with humans does not scale, and a single annotator per item makes label noise invisible; the chapter spends humans on calibration, hard cases, and audits, with agreement measured.",
      },
      {
        text: "Spend humans where they are highest-leverage: build the judge's calibration set, label hard, ambiguous, and adversarial cases, and audit a production sample. Engineer label quality with precise guidelines, multiple annotators per item, kappa agreement measurement, seeded gold-standard items, and adjudication. The validated LLM judge then scores bulk volume, and humans re-audit periodically and on drift.",
        correct: true,
        feedback:
          "Correct. This matches the chapter's pipeline: quantify label noise with kappa, catch weak annotators with gold items, adjudicate disagreements, let the validated judge scale, and close the loop with re-audits.",
      },
      {
        text: "Collect a large batch of labels quickly with minimal guidelines to keep throughput high, then resolve disagreements by majority vote among whichever annotators finished fastest.",
        correct: false,
        feedback:
          "Speed-first labeling without guidelines produces exactly the noise the pipeline exists to control; low inter-annotator agreement signals an under-specified task, not something to vote away.",
      },
    ],
  },
  {
    id: "ch22-22-2-4",
    chapter: 22,
    chapterTitle: "Evaluation Framework Design (Deep Dive)",
    title: "How do you stop benchmarks from lying to you over time?",
    pages: "142",
    route: "/practice/evaluation-framework-design-deep-dive/how-do-you-stop-benchmarks-from-lying-to-you-over-time",
    competencies: chapter22Competencies,
    question:
      "Your eval scores keep going up but users aren't happier. What's going wrong and how do you fix the eval?",
    options: [
      {
        text: "Add more test cases to the existing benchmark; rising scores with flat user satisfaction usually means the set is simply too small to be representative.",
        correct: false,
        feedback:
          "The chapter names this as the junior answer; more cases do not fix contamination, Goodhart overfitting, or construct mismatch, the three classic causes of the benchmark-reality gap.",
      },
      {
        text: "Freeze the benchmark so scores stay comparable across releases, and treat user feedback as a separate qualitative signal that does not need to reconcile with eval trends.",
        correct: false,
        feedback:
          "Freezing a benchmark invites Goodhart overfitting, and an eval whose gains no longer predict user outcomes is worse than no eval; the chapter requires rotation, private sets, and offline-to-online validation.",
      },
      {
        text: "Diagnose the three classic causes and fix each: contamination (decontaminate and keep a private held-out set), Goodhart overfitting (rotate held-out sets, keep some private, add fresh adversarial cases), and construct mismatch (realign to product-relevant criteria weighted by what the product needs). Treat the eval as a living asset: mine production failures into it and verify offline gains still predict online outcomes.",
        correct: true,
        feedback:
          "Correct. This diagnoses all three chapter causes with their paired fixes and closes with the systemic fix: a living eval mined from production failures whose offline gains are continuously validated against online outcomes.",
      },
    ],
  },
];
