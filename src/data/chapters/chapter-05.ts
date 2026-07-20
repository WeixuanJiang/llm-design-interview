import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter05Module: LearningModule = {
  id: "chapter-5-hallucination-and-reliability",
  title: "Hallucination & Reliability",
  description:
    "Grounded systems still fail, so reliability has to be built in layers: retrieval validation, answer constraints, confidence estimation, citations, and refusal policies. Learn to design safe behavior that acknowledges uncertainty instead of promising perfect accuracy.",
  duration: "3 lessons",
  lessons: [
    {
      id: "ch5-grounded-generation",
      title: "Grounded Generation",
      prompt: "Force the model to cite context before answering",
      question:
        "A legal research assistant drafts fluent answers from retrieved documents, but reviewers keep finding claims that no retrieved passage supports. Which change most directly reduces unsupported generation?",
      options: [
        "Add a longer system prompt reminding the model that accuracy is critical and that hallucination is unacceptable",
        "Require the model to cite context before answering, using structured outputs that make a source ID mandatory in every response",
        "Raise the sampling temperature so answers paraphrase the sources more loosely and sound less overconfident",
      ],
      correct: 1,
      feedback:
        "Strong choice. Grounded generation makes citation a structural precondition of answering: the model must point to context first, and structured outputs enforce a source ID on every response.",
      explanation:
        "Grounded generation constrains the model to answer from retrieved evidence rather than from parametric memory. The chapter's core pattern forces citation of context before answering and uses structured outputs so every response carries source IDs. A post-hoc faithfulness gate then checks the draft and routes failures to refusal or escalation.",
      takeaways: [
        "Make citation of context a precondition of answering, not an afterthought.",
        "Use structured outputs to require source IDs in every response.",
        "Gate the generated draft with a faithfulness check that can refuse or escalate.",
      ],
      model: ["Retrieve evidence", "Generate grounded answer with citations", "Faithfulness check: release, refuse, or escalate"],
      source: { chapter: 5, sections: ["5.1.1"], pages: "47" },
    },
    {
      id: "ch5-citation-enforcement",
      title: "Citation Enforcement",
      prompt: "Make every factual claim traceable to a source",
      question:
        "A compliance team requires every factual claim in a RAG answer to be traceable to a retrieved source. The model already receives a citation-style prompt but frequently omits references or invents plausible-looking ones. What should the team add?",
      options: [
        "A structural citation mechanism, such as a schema of claims carrying text and source_id or post-hoc NLI attribution, plus a verification step that scores each citation against its cited source",
        "A second copy of the same citation instruction repeated in the user message so the model takes the requirement more seriously",
        "A larger context window so the model can see more sources at once and choose better ones on its own",
      ],
      correct: 0,
      feedback:
        "Strong choice. Enforcement means the output contract cannot be satisfied without citations, and a verification step confirms each citation actually supports its claim rather than trusting honest-looking markers.",
      explanation:
        "The citation-enforced prompt tells the model to answer only from the provided context, attach a marker such as [1] to each factual claim, and state when the context lacks the answer. Because a prompted model can still produce unfaithful citations, the chapter backs the prompt with structural mechanisms and a verification step that removes or escalates claims whose citation fails cross-encoder scoring.",
      takeaways: [
        "Write the citation contract into the prompt: answer only from context, cite every claim, abstain when the answer is missing.",
        "Back the prompt with structured output of claims and source IDs, or post-hoc NLI attribution.",
        "Verify each citation against its cited source and remove or escalate claims that fail.",
      ],
      model: ["Cite every claim", "Attribute structurally", "Verify citation support"],
      source: { chapter: 5, sections: ["5.1.2"], pages: "47" },
    },
    {
      id: "ch5-confidence-and-refusal",
      title: "Confidence Scoring and Refusal",
      prompt: "Decide when to answer, caveat, refuse, or escalate",
      question:
        "A RAG assistant must stop producing confident wrong answers when the evidence is weak. Which design best operationalizes confidence?",
      options: [
        "Ask the model at the end of each answer how confident it feels and display that self-reported number to users",
        "Block every query whose top-1 retrieval similarity is below 0.95 so that only near-certain questions are ever answered",
        "Fuse independent signals such as retrieval similarity, uncertainty markers in the output, and source contradiction, then map thresholds to actions: answer, flag for review, refuse or escalate, or surface the conflict",
      ],
      correct: 2,
      feedback:
        "Strong choice. Confidence is a fused decision: retrieval score, the model's own uncertainty markers, and evidence conflict each feed thresholds that map to answering, review, refusal, escalation, or surfacing the conflict.",
      explanation:
        "The chapter's confidence rule combines the model's self-assessed confidence with the retrieval score. Concretely, a top-1 retrieval similarity below 0.60 triggers refusal or escalation, uncertainty markers such as 'I think' or 'probably' flag the answer for review, and multiple contradicting sources are surfaced to the user rather than silently merged.",
      takeaways: [
        "Fuse retrieval scores with the model's self-assessed confidence instead of trusting either signal alone.",
        "Map each signal and threshold to a concrete action: answer, review, refuse, escalate, or surface conflict.",
        "Treat refusal as designed safe behavior that protects users, not as a system failure.",
      ],
      model: ["Score evidence and self-assessed confidence", "Map signals to thresholds", "Answer, flag, refuse, or escalate"],
      source: { chapter: 5, sections: ["5.1.3"], pages: "47" },
    },
  ],
};

export const chapter05CourseContent: Record<string, LessonCourseContent> = {
  "ch5-grounded-generation": {
    objectives: [
      "Explain how grounded generation constrains answers to retrieved evidence.",
      "Design a pipeline with a post-hoc faithfulness gate and an explicit refusal path.",
      "Use structured outputs to require source IDs on every generated response.",
    ],
    sections: [
      {
        heading: "Why grounded systems still fail",
        paragraphs: [
          "Retrieval-augmented generation reduces hallucination, but it does not eliminate it. A system can retrieve evidence and still produce claims the evidence does not support, because the generator always retains the ability to fall back on parametric memory. Reliability therefore emerges from multiple layers working together: retrieval validation, answer constraints, confidence estimation, citations, and refusal policies.",
          "The senior mindset is to acknowledge uncertainty explicitly and design safe behavior instead of promising perfect accuracy. Grounded generation is the first of these layers: it forces the model to cite context before answering, so every claim has an auditable link back to retrieved evidence.",
        ],
      },
      {
        heading: "The grounded generation pipeline",
        paragraphs: [
          "The chapter's reference pipeline runs as a sequence: the query retrieves evidence, the model generates a grounded answer, and a post-hoc faithfulness check examines the draft. Drafts that pass are released as an answer with citations; drafts that fail are routed to a refusal or escalation path instead of reaching the user.",
          "The key architectural point is that generation is not trusted by default. The faithfulness gate sits between the model and the user as an independent control, so a fluent but unsupported draft becomes a routing decision rather than a user-facing error.",
        ],
      },
      {
        heading: "Structured outputs as a grounding contract",
        paragraphs: [
          "Grounding is enforced through the output contract, not requested politely. Structured outputs require source IDs in every response, which means a response that does not point at retrieved evidence fails validation and cannot be released. This converts citation from a stylistic preference into a machine-checkable precondition of answering.",
          "Prompt-side techniques reinforce the same contract: an explicit instruction to answer only from the provided context and say so when the answer is unknown, chain-of-thought with citations where the model first identifies which context sentence answers the question and then writes the answer, structured output with required source IDs, and a low temperature around 0.0-0.1 for factual tasks.",
        ],
      },
      {
        heading: "Grounding is necessary but not sufficient",
        paragraphs: [
          "A grounding contract cannot compensate for bad evidence. Hallucination in production RAG is most often a systems problem rooted in retrieval: when the retrieved context is irrelevant or incomplete, the model fills the gap. Prompt tweaks alone rarely fix a retrieval-caused hallucination.",
          "That is why grounded generation pairs with retrieval-side work such as better chunking, re-ranking, retrieving enough documents for the answer to be present, and parent-child chunking that retrieves a precise child but generates from the richer parent. Post-generation checks close the loop: a RAGAS faithfulness score flags any answer that falls below 0.8, NLI-based claim verification checks each extracted claim against the context, and low-confidence answers are routed to human review.",
        ],
      },
    ],
    example: {
      title: "Worked example: grounded support assistant",
      scenario:
        "A support assistant answers policy questions from a retrieved knowledge base. During an audit, reviewers find fluent answers whose claims cannot be traced to any retrieved document, and some answers cite the right policy but add conditions the policy never states.",
      analysis:
        "The failure is unsupported generation after retrieval, so grounding must become structural. Requiring citation of context before answering and enforcing source IDs through structured output makes an uncited claim a validation failure. A post-hoc faithfulness gate catches drafts that cite a source but go beyond it, routing them to refusal or escalation instead of the user.",
      decision:
        "Adopt the grounded pipeline: retrieve evidence, generate with mandatory source IDs under a low temperature, run a faithfulness check on every draft, and release only answers that pass with citations. Measure the faithfulness score separately from retrieval quality so a retrieval-caused gap is not misdiagnosed as a prompting problem.",
    },
    productionChecklist: [
      "Require a source ID on every response through structured output validation.",
      "Instruct the model to answer only from the provided context and to say when the answer is not there.",
      "Run a post-hoc faithfulness check before any answer is released.",
      "Route faithfulness failures to a refusal or escalation path, never silently to the user.",
      "Keep sampling temperature low, around 0.0-0.1, for factual tasks.",
    ],
    commonMistakes: [
      "Telling the model not to hallucinate and calling that a grounding strategy.",
      "Treating citations as optional decoration the model may skip when the answer feels obvious.",
      "Trusting a fluent draft without an independent faithfulness gate.",
      "Trying to fix a retrieval-caused hallucination with prompt tweaks alone.",
    ],
    knowledgeChecks: [
      {
        id: "ch5-grounded-generation-kc-1",
        prompt:
          "A team ships a RAG assistant whose fluent answers are often unsupported by any retrieved passage. Which change most directly implements grounded generation as the chapter defines it?",
        options: [
          "Require the model to cite context before answering, and enforce a source ID on every response through structured output validation so uncited answers cannot be released",
          "Attach a visible disclaimer under each answer warning users that the response may contain inaccuracies",
          "Retrieve more documents for every query so the model always has more material to choose from",
        ],
        correct: 0,
        feedback:
          "Correct. Grounded generation forces citation of context before answering and uses structured outputs to require source IDs in every response; a disclaimer only warns the user, and extra retrieval alone never binds claims to evidence.",
      },
      {
        id: "ch5-grounded-generation-kc-2",
        prompt:
          "In this lesson's worked example, auditors find answers that cite the right policy document but add conditions the policy never states. Which control directly addresses this residual failure mode?",
        options: [
          "Structured output requiring source IDs, because the original problem was claims without any citation at all",
          "A higher sampling temperature so the model paraphrases the policy more loosely instead of inventing conditions",
          "The post-hoc faithfulness gate, which checks the generated draft against the evidence and routes failures to refusal or escalation instead of the user",
        ],
        correct: 2,
        feedback:
          "Correct. These claims are cited but go beyond the cited source, so the control that compares the draft against the evidence is the faithfulness gate; source ID validation cannot detect a claim that exceeds its own citation.",
      },
      {
        id: "ch5-grounded-generation-kc-3",
        prompt:
          "A team has strengthened its grounding prompt three times, yet hallucinated answers persist in production. Retrieval logs show many queries return only loosely related passages. What is the most likely diagnosis?",
        options: [
          "The sampling temperature is still too high, and lowering it will eliminate the unsupported answers",
          "The hallucination is rooted in bad evidence: retrieval is returning irrelevant or incomplete context, and prompt tweaks alone rarely fix a retrieval-caused hallucination",
          "The model is simply too small for the domain, so upgrading to a stronger model is the necessary fix",
        ],
        correct: 1,
        feedback:
          "Correct. The chapter frames hallucination as a systems problem most often rooted in bad evidence; when retrieval returns weak context the generator fills the gaps, so retrieval quality must be inspected before any further prompt work.",
      },
      {
        id: "ch5-grounded-generation-kc-4",
        prompt:
          "A reviewer argues that the grounding contract, with its instruction to answer only from context and to say when the answer is unknown, makes the assistant unhelpful and proposes dropping it. How should the team defend the design?",
        options: [
          "Accept the review and remove the answer-only-from-context instruction so the model can use its full parametric knowledge",
          "Keep the contract but drop the faithfulness gate, since the extra check adds latency without changing what the model generates",
          "Keep the grounding contract because reliability emerges from layered controls, and address helpfulness by improving retrieval so the evidence needed to answer is actually present",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter's stance is to design safe behavior instead of promising perfect accuracy; removing grounding un-grounds every claim, and dropping the gate removes the control that stops unsupported drafts from reaching users.",
      },
      {
        id: "ch5-grounded-generation-kc-5",
        prompt:
          "Before launch, the team must define how it will validate that grounded generation actually works in production. Which validation plan matches the chapter's guidance?",
        options: [
          "Measure retrieval relevance and post-generation faithfulness as separate gates, flag answers whose faithfulness score falls below 0.8, and route low-confidence cases to human review",
          "Track only end-to-end user satisfaction, because a single outcome metric captures every upstream effect",
          "Approve the launch once the grounded prompt passes a small hand-picked demo set, then tune behavior from live traffic",
        ],
        correct: 0,
        feedback:
          "Correct. The chapter pairs grounding with post-generation checks such as a RAGAS faithfulness score flagged below 0.8 and human review of low-confidence answers, keeping retrieval quality and generation faithfulness measured as separate gates.",
      },
    ],
  },
  "ch5-citation-enforcement": {
    objectives: [
      "Design a citation-enforced system prompt with an explicit abstention clause.",
      "Compare structured output, post-hoc attribution, and retrieval-augmented decoding as citation mechanisms.",
      "Add a verification step that confirms each citation genuinely supports its claim.",
    ],
    sections: [
      {
        heading: "The citation-enforced prompt",
        paragraphs: [
          "Citation enforcement starts with a system prompt that states the contract in plain terms: answer only using the provided context, include a citation marker such as [1] or [2] for each factual claim, and if the answer is not in the context, respond that there is not enough information to answer. The prompt carries both the context and a source reference list so that every marker resolves to a real retrieved document.",
          "The abstention clause is as important as the citation rule. Without an explicit allowed response for missing evidence, the model is pressured to improvise, and the citation format will happily decorate an unsupported answer. The prompt is the policy layer of enforcement, but it is only one layer.",
        ],
      },
      {
        heading: "Method 1: structured output",
        paragraphs: [
          "The strongest enforcement makes citations non-optional at the schema level. Using a JSON schema response format or a Pydantic model, the system requires a structured response made of claims, each carrying its text and a source_id. A response without source IDs fails schema validation and never reaches the user.",
          "This changes the failure mode from silent omission to an explicit, catchable error. Instead of auditing prose for missing markers, the application rejects any answer whose structure does not bind every claim to a retrieved source.",
        ],
      },
      {
        heading: "Methods 2 and 3: attribution after and during generation",
        paragraphs: [
          "Post-hoc attribution works on an already generated response: an NLI model matches each sentence to the most supportive retrieved chunk, and citation markers are injected where the match holds. This decouples citation from the generator's cooperation, which matters because the same model that produced an unsupported claim cannot be trusted to flag it.",
          "Retrieval-augmented decoding moves the check inside generation: at each sentence boundary the system runs a relevance check against the retrieved documents and appends the citation as the sentence is produced. Both methods share the goal of claim-level attribution that does not rely on the model volunteering honest references.",
        ],
      },
      {
        heading: "Verification: do not trust honest-looking citations",
        paragraphs: [
          "A citation is a claim about a source, and it can be wrong. After citation injection, the verification step extracts each cited source and runs cross-encoder scoring on the (claim, cited source) pair against a threshold above 0.7. If verification fails, the claim is removed or escalated to a human rather than shipped with a broken reference.",
          "This is the senior differentiator the chapter names: a junior answer asks the model to cite, while a senior answer provides concrete mechanisms and then verifies that each citation actually supports its claim. Enforcement without verification launders unsupported text into apparently sourced text.",
        ],
      },
    ],
    example: {
      title: "Worked example: verifiable answers for a policy bot",
      scenario:
        "A compliance-facing policy bot must guarantee that every factual claim in its answers traces to a retrieved policy document. The current prompt asks for [1]-style citations, but reviewers find responses with no citations and others whose citations point to documents that do not contain the claim.",
      analysis:
        "Prompt-only enforcement fails in both directions: omission and fabrication. A structured output schema of claims with text and source_id makes omission a validation error, while post-hoc NLI attribution provides claim-level matching that does not depend on the generator. Fabricated or weak citations still survive both, so a cross-encoder verification step must score each (claim, source) pair and remove or escalate failures.",
      decision:
        "Ship a three-part design: citation-enforced system prompt with an abstention clause, structured output requiring source IDs per claim, and a verification pass with a 0.7 cross-encoder threshold that drops or escalates unverifiable claims before release.",
    },
    productionChecklist: [
      "Include the source reference list in the prompt so citation markers resolve to real documents.",
      "Require claims with source IDs through a JSON schema or Pydantic response contract.",
      "Attribute sentences post-hoc with an NLI model when the generator's own citations are unreliable.",
      "Score every (claim, cited source) pair with a cross-encoder and enforce the acceptance threshold.",
      "Remove or escalate claims whose citations fail verification instead of shipping them.",
    ],
    commonMistakes: [
      "Asking the model to cite and trusting the citations it produces.",
      "Omitting the abstention clause, so the model improvises when the context lacks the answer.",
      "Injecting citation markers without checking that they support the claim they decorate.",
      "Keeping unverifiable claims in the answer instead of removing or escalating them.",
    ],
    knowledgeChecks: [
      {
        id: "ch5-citation-enforcement-kc-1",
        prompt:
          "A RAG assistant's system prompt asks for citations, but the model still omits them on many answers. Which change enforces citations rather than merely requesting them?",
        options: [
          "Repeat the citation instruction in every user message so the requirement is harder for the model to miss",
          "Require a structured response of claims where each claim carries text and a source_id, so any answer without source IDs fails schema validation",
          "Append the retrieved source list after the answer so users can see which documents were used",
        ],
        correct: 1,
        feedback:
          "Correct. Structured output with a schema of claims carrying text and source_id makes citations non-optional; repetition and appended source lists leave citation to the model's discretion and give no claim-level traceability.",
      },
      {
        id: "ch5-citation-enforcement-kc-2",
        prompt:
          "In this lesson's worked example, the compliance bot fails in two ways: some answers have no citations, and others cite documents that do not contain the claim. Which combination addresses both failure directions?",
        options: [
          "Structured output requiring a source_id per claim to make omission a validation error, plus cross-encoder verification scoring each claim against its cited source to catch unsupported citations",
          "A stronger prompt stating that citations must be accurate, since the model already knows the citation format",
          "Routing every generated answer to a human reviewer who checks each citation manually before release",
        ],
        correct: 0,
        feedback:
          "Correct. Omission is fixed structurally by requiring source IDs per claim, and fabrication is fixed by the verification step that scores (claim, cited source) pairs above a 0.7 threshold and removes or escalates the failures.",
      },
      {
        id: "ch5-citation-enforcement-kc-3",
        prompt:
          "After launch, auditors find answers decorated with [1] and [2] markers, yet the cited chunks frequently do not support the sentences they decorate. What is the diagnosis and the right fix?",
        options: [
          "The citation format is ambiguous; switching from numeric markers to footnote syntax will make citations honest",
          "The context window is too small, so including more retrieved chunks will let the model cite more accurately",
          "Citations were trusted without verification; add a step that extracts each cited source, cross-encoder scores the (claim, source) pair against a 0.7 threshold, and removes or escalates failing claims",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter's differentiator is verifying citations rather than trusting the model to produce honest ones; changing the marker format or adding more context never checks whether a citation actually supports its claim.",
      },
      {
        id: "ch5-citation-enforcement-kc-4",
        prompt:
          "A reviewer proposes saving latency by dropping the independent attribution and verification pass, trusting the generator's own citations instead. How should the team defend the verification step?",
        options: [
          "Keep the independent pass because the model that produced an unsupported claim cannot be trusted to flag it; enforcement without verification launders unsupported text into apparently sourced text",
          "Agree to drop it, since a well-prompted modern model follows citation instructions reliably enough for production",
          "Replace claim-level verification with one whole-answer score, which preserves the same guarantee at lower cost",
        ],
        correct: 0,
        feedback:
          "Correct. The chapter separates citation mechanisms from a verification step precisely because self-reported citations can be unfaithful; a single whole-answer score cannot confirm that each individual claim is supported by its cited source.",
      },
      {
        id: "ch5-citation-enforcement-kc-5",
        prompt:
          "The team is defining release gates for the citation enforcement feature. Which validation plan actually proves that every factual claim is traced to a genuine source?",
        options: [
          "Accept the feature when most sampled answers contain at least one citation marker, since markers indicate sourcing behavior",
          "Validate only that the structured output schema passes, because a source_id field guarantees an honest citation",
          "Verify each citation before release by extracting the cited source and cross-encoder scoring the pair above threshold, track the rate of removed or escalated claims, and test the abstention path when context lacks the answer",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter's verification step checks that each citation genuinely supports its claim and removes or escalates failures; marker presence and schema validity only prove that citations exist, not that they are faithful.",
      },
    ],
  },
  "ch5-confidence-and-refusal": {
    objectives: [
      "Combine retrieval scores with model self-assessment into a single confidence decision.",
      "Detect low-confidence answers using multiple independent signals.",
      "Design refusal and escalation behavior, including refusal logging that feeds knowledge-gap discovery.",
    ],
    sections: [
      {
        heading: "Fusing weak signals into a decision",
        paragraphs: [
          "No single signal reliably tells you a RAG answer is shaky, so the chapter fuses several. The core rule combines the model's self-assessed confidence with the retrieval score: neither is trustworthy alone, but agreement or disagreement between them is informative. The full signal set includes a low maximum retrieval similarity, low answer log-probability (high perplexity in token prediction), hedging language such as 'I think' or 'probably' caught by a regex or classifier, a low post-generation RAGAS faithfulness score, and conflicting content across the top retrieved documents.",
          "Each signal is weak in isolation: a high retrieval score does not guarantee faithful generation, and self-reported confidence is uncalibrated. The senior move is fusing multiple weak signals into a calibrated decision rather than checking one number.",
        ],
      },
      {
        heading: "Mapping thresholds to actions",
        paragraphs: [
          "Detection without an action map is decoration. The chapter's concrete thresholds: a top-1 retrieval similarity below 0.60 triggers refusal or escalation; uncertainty markers in the output flag the answer for review; and multiple contradicting sources cause the conflict to be surfaced to the user instead of silently averaged into a false consensus.",
          "When confidence is low, the response is graduated. A transparent caveat tells the user what the sources suggest while admitting the answer may not be fully accurate; a refusal states plainly that reliable information is unavailable; and escalation routes the request to a human agent or a live web search when the knowledge base is not the right source.",
        ],
      },
      {
        heading: "When refusal is the correct answer",
        paragraphs: [
          "Refusal is designed behavior with explicit triggers, not an embarrassed fallback. The system should refuse when the query is out of scope for the knowledge base, when no retrieved document clears the minimum similarity threshold (for example 0.55), when the query carries harmful intent such as prompt injection, PII extraction, or a jailbreak, when the question requires real-time data the system does not have, or when every retrieved document is outdated beyond a freshness threshold.",
          "Attempting an answer in any of these states manufactures risk: out-of-scope and stale-evidence answers are confident guesses, and answering a hostile query is a security failure, not a quality failure. A system that never refuses is not more helpful; it is less reliable.",
        ],
      },
      {
        heading: "Graceful refusal as a feedback loop",
        paragraphs: [
          "A good refusal is explicit and useful. It states plainly that reliable information could not be found in the knowledge base, and it offers an alternative such as the official source the user can check. The user leaves with a clear boundary and a next step rather than a vague non-answer.",
          "The ownership signal is what happens next: refusals are logged, and refusal queries are clustered to identify knowledge gaps that drive future indexing. Each refused question becomes evidence about what the corpus is missing, turning the refusal path into a feedback loop that steadily shrinks the set of questions the system cannot answer.",
        ],
      },
    ],
    example: {
      title: "Worked example: calibrating a financial Q&A assistant",
      scenario:
        "A finance Q&A assistant answers questions over quarterly filings. Traffic analysis shows three failure shapes: users ask for current stock prices the filings cannot provide, some questions retrieve only weakly related passages, and a portion of queries attempt to extract personal data embedded in documents.",
      analysis:
        "Each failure maps to a named refusal trigger: real-time data the system lacks, no document above the minimum similarity threshold, and harmful intent. Fusing signals matters because the weak-retrieval case needs the retrieval score while the harmful-intent case needs query screening. Answering any of them from the filings would produce confident guesses or a security breach.",
      decision:
        "Set a minimum top-1 similarity threshold with refusal or escalation below it, screen queries for harmful intent, refuse real-time data requests explicitly while pointing to a market data source, and log every refusal. Cluster the refusal log monthly to find filing types or topics that should be indexed next.",
    },
    productionChecklist: [
      "Set a minimum top-1 retrieval similarity threshold and refuse or escalate below it.",
      "Scan generated outputs for hedging markers and route flagged answers to review.",
      "Surface contradicting sources to the user explicitly instead of merging them silently.",
      "Give every refusal an explicit explanation plus an alternative source to check.",
      "Log refusals and cluster refusal queries to prioritize future indexing.",
    ],
    commonMistakes: [
      "Trusting the model's self-reported confidence as the only signal.",
      "Answering out-of-scope or real-time questions from stale or missing context.",
      "Refusing silently with no explanation and no alternative for the user.",
      "Treating refusals as dead ends instead of knowledge-gap data for the indexing roadmap.",
    ],
    knowledgeChecks: [
      {
        id: "ch5-confidence-and-refusal-kc-1",
        prompt:
          "A product team wants its RAG assistant to stop giving confident wrong answers on weak evidence. Which confidence design matches the chapter's approach?",
        options: [
          "Ask the model to report a confidence percentage with each answer and display that number to users",
          "Answer only when the top retrieval similarity exceeds 0.95, so the system responds solely to near-certain queries",
          "Fuse retrieval similarity, self-assessed uncertainty markers, faithfulness scoring, and source contradiction, then map thresholds to actions: answer, flag for review, refuse or escalate, or surface the conflict",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter fuses multiple weak signals into a calibrated decision and maps thresholds to actions; self-reported confidence alone is uncalibrated, and a 0.95 bar manufactures massive over-refusal far beyond the chapter's thresholds.",
      },
      {
        id: "ch5-confidence-and-refusal-kc-2",
        prompt:
          "In this lesson's worked example, a user of the finance Q&A assistant asks for the current stock price, which the filings corpus cannot provide. What should the system do?",
        options: [
          "Answer from the most recent quarterly filing, since it contains the latest price-related figures available in the corpus",
          "Refuse explicitly because the question requires real-time data the system does not have, offer an appropriate market-data source, and log the refusal",
          "Give the filing-based figure with a transparent caveat that it may not be fully accurate",
        ],
        correct: 1,
        feedback:
          "Correct. Requiring real-time data the system lacks is a named refusal trigger in the chapter; a stale filing figure, even caveated, would be a confident guess, and a graceful refusal offers an alternative and is logged.",
      },
      {
        id: "ch5-confidence-and-refusal-kc-3",
        prompt:
          "After launch, users receive confident answers to questions far outside the knowledge base. Logs show retrieval similarity was far below threshold on those queries, yet the system answered anyway. What is the diagnosis?",
        options: [
          "The refusal path was never enforced: no minimum similarity threshold gated generation, so out-of-scope queries fell through; add threshold-based refusal or escalation and log every refusal",
          "The model's temperature was too high, causing it to improvise on questions it should have skipped",
          "The knowledge base is simply too small, so indexing more documents will resolve the confident out-of-scope answers",
        ],
        correct: 0,
        feedback:
          "Correct. The chapter makes a below-threshold retrieval score an explicit refusal trigger; temperature tuning does not create a refusal path, and new indexing should be driven by clustered refusal logs rather than by answering anyway.",
      },
      {
        id: "ch5-confidence-and-refusal-kc-4",
        prompt:
          "A product manager complains the refusal rate is too high and asks the team to make the assistant answer everything so it stays helpful. How should the team defend the refusal design?",
        options: [
          "Lower the similarity threshold toward zero so the assistant attempts an answer on every query",
          "Refusal is designed safe behavior: answering out-of-scope, stale, or harmful queries manufactures confident guesses and security breaches, and the right fix for over-refusal is clustering refusal logs to close knowledge gaps",
          "Keep the similarity thresholds but drop harmful-intent screening, since injection and jailbreak attempts are rare in practice",
        ],
        correct: 1,
        feedback:
          "Correct. The chapter treats refusal as designed safe behavior whose logs feed a knowledge-gap feedback loop; answering harmful queries is a security failure, and near-zero thresholds convert every evidence gap into a confident guess.",
      },
      {
        id: "ch5-confidence-and-refusal-kc-5",
        prompt:
          "The team must define production monitoring that proves the confidence and refusal system actually works. Which monitoring plan follows the chapter's guidance?",
        options: [
          "Track average answer latency and token cost, since reliability problems always surface first as performance regressions",
          "Declare the system healthy once the weekly refusal count reaches zero, because refusals indicate failed interactions",
          "Track the refusal rate and cluster refusal queries to find knowledge gaps, review answers flagged for hedging language, and verify that contradicting-source cases surface the conflict to the user",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter turns refusals into a knowledge-gap feedback loop, flags uncertainty markers for review, and surfaces source conflicts explicitly; zero refusals would more likely mean missing enforcement than perfect reliability.",
      },
    ],
  },
};

export const chapter05Practice: CatalogPracticeUnit[] = [
  {
    id: "ch5-5-2-1",
    chapter: 5,
    chapterTitle: "Hallucination & Reliability",
    title: "How do you reduce hallucination in RAG?",
    pages: "48",
    route: "/practice/hallucination-and-reliability/how-do-you-reduce-hallucination-in-rag",
    competencies: ["grounding", "citation verification", "confidence", "refusal", "contradictory evidence"],
    question:
      "In a senior-level interview you are asked: \"List all the techniques you would use to reduce hallucination in a production RAG system.\" Which answer demonstrates the strongest production understanding?",
    options: [
      {
        text: "Strengthen the system prompt to forbid hallucination explicitly, since generation is where hallucinated text is produced and therefore where it should be fixed.",
        correct: false,
        feedback:
          "This is the junior answer the question is designed to expose. Prompt tweaks alone rarely fix a retrieval-caused hallucination, because the generator fills gaps left by bad evidence.",
      },
      {
        text: "Retrieve as many documents as the context window can hold on every query, because more context always means fewer hallucinations.",
        correct: false,
        feedback:
          "Volume without relevance adds noise, and the chapter's premise is that less noise means less hallucination. Increasing K is only useful alongside relevance work such as better chunking and re-ranking.",
      },
      {
        text: "Attack hallucination across three layers: improve retrieval so evidence is relevant and complete (better chunking, re-ranking, sufficient K, parent-child retrieval), constrain the prompt (grounding instructions, chain-of-thought with citations, temperature 0.0-0.1, structured outputs with source IDs), and add post-generation checks (RAGAS faithfulness flagging below 0.8, NLI claim verification, human review of low-confidence answers), because hallucination is a systems problem most often rooted in bad evidence.",
        correct: true,
        feedback:
          "Correct. The senior answer spans retrieval, prompt, and post-generation layers and frames hallucination as a systems problem rooted in bad evidence, not a prompting defect.",
      },
    ],
  },
  {
    id: "ch5-5-2-2",
    chapter: 5,
    chapterTitle: "Hallucination & Reliability",
    title: "What if retrieved documents are wrong?",
    pages: "48",
    route: "/practice/hallucination-and-reliability/what-if-retrieved-documents-are-wrong",
    competencies: ["grounding", "citation verification", "confidence", "refusal", "contradictory evidence"],
    question:
      "An interviewer asks: \"What happens when the retrieved documents contain incorrect or contradictory information, and how do you handle it?\" Which answer demonstrates the strongest production understanding?",
    options: [
      {
        text: "Classify the failure first (outdated, contradictory, partially relevant, or adversarially crafted), then apply a targeted mitigation for each: timestamp filtering with document dates exposed to the model, source quality scoring in re-ranking, contradiction detection that surfaces the conflict when top documents disagree, ingestion-time validation, and prompt-injection defense that wraps retrieved content in structured tags and treats it as data, not instructions.",
        correct: true,
        feedback:
          "Correct. The senior answer classifies the document failure and matches a mitigation to each class, treating retrieved documents as an attack and quality surface rather than trusted truth.",
      },
      {
        text: "Accept that some answers will be wrong, because a retrieval system inherits the quality of its corpus and nothing meaningful can be done at query time.",
        correct: false,
        feedback:
          "This is the junior answer. The chapter gives concrete mitigations for every failure class, from timestamp filtering and source quality scoring to contradiction detection and injection defense.",
      },
      {
        text: "Merge contradicting documents into a single consensus answer so the user always receives one clean, confident response.",
        correct: false,
        feedback:
          "Averaging contradiction hides it. When the top retrieved documents disagree, the chapter says to surface the conflict explicitly rather than manufacture consensus.",
      },
    ],
  },
  {
    id: "ch5-5-2-3",
    chapter: 5,
    chapterTitle: "Hallucination & Reliability",
    title: "How do you enforce citations in generated answers?",
    pages: "49",
    route: "/practice/hallucination-and-reliability/how-do-you-enforce-citations-in-generated-answers",
    competencies: ["grounding", "citation verification", "confidence", "refusal", "contradictory evidence"],
    question:
      "In a system design interview you are asked: \"How do you enforce that every factual claim in a RAG response is traced to a source?\" Which answer demonstrates the strongest production understanding?",
    options: [
      {
        text: "Instruct the model in the prompt to include citations and trust it to cite honestly, since modern models follow formatting instructions reliably.",
        correct: false,
        feedback:
          "Asking the model to cite is the junior answer. The chapter's differentiator is verifying citations rather than trusting the model to produce honest ones.",
      },
      {
        text: "Combine a concrete citation mechanism (structured output with a schema of claims carrying text and source_id, post-hoc NLI attribution matching each sentence to its most supportive chunk, or retrieval-augmented decoding with a relevance check at each sentence boundary) with a verification step that extracts each cited source, cross-encoder scores the (claim, source) pair against a 0.7 threshold, and removes or escalates claims that fail.",
        correct: true,
        feedback:
          "Correct. The senior answer names enforceable mechanisms for claim-level attribution and adds a verification step that confirms each citation actually supports its claim.",
      },
      {
        text: "Append the full list of retrieved documents at the end of each answer so users can locate and check the sources themselves.",
        correct: false,
        feedback:
          "A document dump is not claim-level traceability. The requirement is that every factual claim be traced to a source, which needs per-claim attribution plus verification.",
      },
    ],
  },
  {
    id: "ch5-5-2-4",
    chapter: 5,
    chapterTitle: "Hallucination & Reliability",
    title: "How do you detect low-confidence answers?",
    pages: "49",
    route: "/practice/hallucination-and-reliability/how-do-you-detect-low-confidence-answers",
    competencies: ["grounding", "citation verification", "confidence", "refusal", "contradictory evidence"],
    question:
      "An interviewer asks: \"How do you know when your RAG system is not confident in its answer, and what do you do about it?\" Which answer demonstrates the strongest production understanding?",
    options: [
      {
        text: "Ask the model to output a confidence score alongside each answer and act on that single self-reported number.",
        correct: false,
        feedback:
          "Checking the model's own confidence is the junior answer. Self-assessment is one weak signal, not a calibrated decision, and the chapter fuses it with independent evidence.",
      },
      {
        text: "Treat low-confidence detection as unnecessary when retrieval quality is high, because strong retrieval guarantees a well-supported answer.",
        correct: false,
        feedback:
          "Grounded systems still fail: good retrieval does not guarantee faithful generation, which is exactly why post-generation signals such as faithfulness and hedging detection exist.",
      },
      {
        text: "Fuse independent signals (max retrieval cosine similarity below 0.65, low answer log-probability, hedging language like 'I think' or 'probably' caught by a regex or classifier, post-generation RAGAS faithfulness below 0.75, and contradictory top documents), then map thresholds to actions: a transparent caveat, a refusal, or escalation to a human agent or live web search.",
        correct: true,
        feedback:
          "Correct. The senior answer combines multiple weak signals into a calibrated decision and maps each threshold to a concrete action instead of stopping at detection.",
      },
    ],
  },
  {
    id: "ch5-5-2-5",
    chapter: 5,
    chapterTitle: "Hallucination & Reliability",
    title: "When should the system refuse to answer?",
    pages: "50",
    route: "/practice/hallucination-and-reliability/when-should-the-system-refuse-to-answer",
    competencies: ["grounding", "citation verification", "confidence", "refusal", "contradictory evidence"],
    question:
      "In a senior interview you are asked: \"Define the conditions under which a RAG system should refuse to answer rather than attempt a response.\" Which answer demonstrates the strongest production understanding?",
    options: [
      {
        text: "Refuse on concrete triggers: the query is out of scope for the knowledge base, no retrieved document clears the minimum similarity threshold (for example 0.55), the query carries harmful intent such as prompt injection, PII extraction, or a jailbreak, the question requires real-time data the system lacks, or every retrieved document is stale beyond a freshness bound; and make the refusal graceful by being explicit, offering an alternative source, and logging refusals so clustered queries reveal knowledge gaps for future indexing.",
        correct: true,
        feedback:
          "Correct. The senior answer specifies concrete refusal triggers and designs graceful refusal whose logs turn into a knowledge-gap feedback loop for indexing.",
      },
      {
        text: "Refuse only when the model says it does not know the answer, since the model itself is the best judge of whether it can respond.",
        correct: false,
        feedback:
          "Refusing 'when it doesn't know' is the junior answer. The chapter replaces self-judgment with explicit triggers: similarity thresholds, scope, harmful intent, real-time data needs, and freshness bounds.",
      },
      {
        text: "Never refuse: a helpful assistant should always attempt an answer from the best available context, because a refusal is a failed interaction.",
        correct: false,
        feedback:
          "Always answering manufactures confident guesses on missing, stale, or hostile input. The chapter treats refusal as designed safe behavior and a source of knowledge-gap signal, not failure.",
      },
    ],
  },
];
