import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter10Module: LearningModule = {
  id: "chapter-10-prompt-engineering-for-rag",
  title: "Prompt Engineering for RAG",
  description:
    "Prompt design controls grounded behavior even when retrieval is already strong. Learn to assemble bounded prompts with explicit grounding, refusal, and citation instructions, and to enforce typed, verifiable output contracts — prompt engineering as a measured discipline, not a collection of informal tricks.",
  duration: "2 lessons",
  lessons: [
    {
      id: "ch10-context-injection-patterns",
      title: "Context Injection Patterns",
      prompt: "Assemble a bounded grounded prompt",
      question:
        "A support assistant answers from retrieved policy chunks, but in production it sometimes ignores the evidence, answers from training knowledge, and never declines when a policy is missing. Which prompt change best enforces grounded behavior?",
      options: [
        "Rebuild the prompt as a bounded template: a role line, an instructions block placed before the context that forbids outside knowledge and speculation, a fixed refusal sentence for missing answers, numbered passages with required [Source N] citations, then the question and an answer marker",
        "Append the retrieved chunks at the very end of the prompt so the evidence sits closest to the generation and carries the most weight",
        "Strengthen the persona line — for example, 'You are an extremely accurate policy expert' — so the model tries harder to stay factual",
      ],
      correct: 0,
      feedback:
        "Strong choice. The production template separates instructions, evidence, and query into delimited sections, states the grounding rule ahead of the context, and hard-codes both an exact refusal sentence and a citation format.",
      explanation:
        "The chapter's production RAG template issues explicit orders: answer only from the provided context, reply with a fixed sentence when the answer is absent, cite using [Source N], and do not speculate. Persona adjectives do not constrain behavior; delimited sections plus a grounding and refusal contract do.",
      takeaways: [
        "Separate system instructions, retrieved evidence, and the user query into one bounded prompt.",
        "State the grounding rule and the exact refusal sentence before the context block.",
        "Number every passage and require [Source N] citations so claims can be verified later.",
      ],
      model: ["Delimit sections", "Ground and refuse", "Require citations"],
      source: { chapter: 10, sections: ["10.1.1"], pages: "72" },
    },
    {
      id: "ch10-structured-outputs",
      title: "Structured Outputs",
      prompt: "Validate generation against a typed schema",
      question:
        "A RAG service must hand answers with citations to downstream systems. Occasionally the model emits malformed JSON or cites a source_id that was never retrieved. What is the strongest design?",
      options: [
        "Ask for JSON in the prompt text, parse the free-form reply, and retry in a loop until the response parses cleanly",
        "Trust the model's self-reported is_grounded and confidence fields once the response matches the expected shape",
        "Constrain decoding to a typed schema — answer, citations with claim and source_id, is_grounded, confidence bounded to [0,1] — fall back safely on validation error, and post-verify that every cited source_id exists in the retrieved set",
      ],
      correct: 2,
      feedback:
        "Strong choice. Schema-constrained decoding removes free-form variation, validation failures are logged and return a safe fallback, and a post-hoc check catches citations that point outside the retrieved evidence.",
      explanation:
        "The chapter's Pydantic contract types each citation with a claim, a source_id, and a confidence constrained to [0,1], and routes ValidationError to a logged safe fallback. Production hardening adds a single repair retry, a refusal path for low-confidence or ungrounded output, and verification that each source_id was actually retrieved.",
      takeaways: [
        "Treat the response schema as a contract: answer, citations, is_grounded, bounded confidence.",
        "On validation failure, log and return a safe fallback — at most one repair retry.",
        "Never trust self-reported grounding; verify each citation's source_id against the retrieved set.",
      ],
      model: ["Schema contract", "Constrained decoding", "Fallback and verify"],
      source: { chapter: 10, sections: ["10.1.2"], pages: "72" },
    },
  ],
};

export const chapter10CourseContent: Record<string, LessonCourseContent> = {
  "ch10-context-injection-patterns": {
    objectives: [
      "Assemble a bounded RAG prompt that separates system instructions, retrieved evidence, and the user query.",
      "Write grounding, refusal, and citation instructions that constrain the model to the provided context.",
      "Manage prompt layout and token budget so grounding survives context pressure.",
    ],
    sections: [
      {
        heading: "A bounded prompt, not a bag of text",
        paragraphs: [
          "The chapter opens with a prompt-assembly figure: system instructions, retrieved context, and the user query are combined into a single bounded prompt before the LLM call, and the model returns structured output. The framing matters — prompt structure, context ordering, citation instructions, contradiction handling, and output formats are engineering decisions that control behavior, not informal tricks layered on after retrieval.",
          "The production template makes this concrete. A role line names the assistant and the company, an instructions block carries the behavioral rules, a context block holds the retrieved evidence, a question block carries the user query, and an answer marker closes the scaffold. Delimiters give the model — and the team maintaining the system — an explicit contract about what each span of tokens is for.",
        ],
      },
      {
        heading: "Grounding and refusal instructions",
        paragraphs: [
          "The instructions block carries the behavioral contract: answer only based on the provided context; if the answer is not in the context, respond with a fixed refusal sentence; be concise and factual; do not speculate. Hard-coding the exact refusal string converts abstention from a hoped-for behavior into a testable one — you can assert on the literal output in evaluation.",
          "Negative instructions pull real weight here. Without an explicit ban on using training knowledge and on inferring beyond what is stated, the model fills evidence gaps from parametric memory and produces fluent, unsupported answers. The refusal clause and the no-speculation clause are what turn a helpful model into a grounded one.",
        ],
      },
      {
        heading: "Citations and source IDs",
        paragraphs: [
          "The template requires citations in [Source N] format. Numbering each context passage and demanding attribution means every generated claim can be traced back to a specific retrieved chunk, which is the difference between an answer that sounds grounded and one that provably is.",
          "Source IDs also create a verification hook for the generation layer. Because passages are numbered before injection, a post-hoc check can confirm that a cited source actually exists in the retrieved set, instead of trusting the model's attribution at face value. Prompt design and output validation are two halves of one grounding contract.",
        ],
      },
      {
        heading: "Ordering, position effects, and the token budget",
        paragraphs: [
          "Layout is behavioral, not cosmetic. The chapter recommends placing the explicit grounding instruction before the context rather than after it, and warns that position matters because later instructions tend to carry more influence. Treat the ordering of role, instructions, evidence, and question as a designed control surface, and validate layout changes on a golden dataset rather than assuming they are neutral.",
          "Injection is also bounded by a token budget. Count tokens before adding context and stop when the budget is roughly 80% full, reserving the remainder for instructions and the response. Rank evidence by re-ranker score before truncating, so the budget cut removes the least useful passage first — and where the tail still matters, demote it instead of dropping it: inject a one-sentence summary for lower-priority documents, or use a hierarchical layout that keeps the top passage in full and sends only summaries or titles for the rest. Context is a managed budget with priority ordering, not a hard cut at the window edge.",
        ],
      },
    ],
    example: {
      title: "Worked example: policy assistant prompt assembly",
      scenario:
        "A company's support assistant retrieves policy chunks and must answer only from them, cite the policy behind each answer, and decline cleanly when the policy is missing.",
      analysis:
        "The failure modes are behavioral, not retrieval: the model has the evidence but is not constrained to it, so it blends in training knowledge and never abstains. Assembling the prompt as role line, instructions, numbered context, question, and answer marker turns each requirement into an explicit line — the grounding rule ahead of the evidence, a fixed refusal sentence, the [Source N] citation format, and a no-speculation clause.",
      decision:
        "Adopt the bounded template with the grounding instruction placed before the evidence block, a hard-coded refusal string, numbered passages, and required [Source N] citations; then evaluate groundedness and refusal behavior on a golden dataset before rollout.",
    },
    productionChecklist: [
      "Version the prompt template like code; changes require an explicit version bump.",
      "Place the grounding and refusal instructions before the context block.",
      "Number every retrieved passage and require [Source N] citations in the answer.",
      "Count tokens before injection and stop near 80% of budget, reserving room for instructions and the response.",
      "Evaluate the template on a golden dataset and re-check it when switching models, because grounding instructions may not transfer.",
    ],
    commonMistakes: [
      "Appending retrieved chunks without a grounding instruction, so the model blends evidence with training knowledge.",
      "Burying the grounding rule after the context instead of stating it before the evidence.",
      "Letting the model improvise refusals instead of fixing one exact refusal sentence.",
      "Hard-cutting context at the window edge instead of managing a token budget with priority ordering.",
    ],
    knowledgeChecks: [
      {
        id: "ch10-context-injection-patterns-kc-1",
        prompt:
          "Your grounded support assistant keeps answering questions from its own training knowledge instead of the retrieved policy passages, and reviewers cannot tell which answers used evidence. Which prompt assembly change most directly fixes this?",
        options: [
          "Rebuild the prompt as a bounded template: role line, instructions before the context that ban outside knowledge and speculation, an exact refusal sentence, numbered passages, required [Source N] citations, then the question and answer marker",
          "Move the retrieved passages to the very end of the prompt so the evidence sits closest to the generated answer",
          "Rewrite the role line to call the model a meticulous, citation-loving policy expert so it behaves more carefully",
        ],
        correct: 0,
        feedback:
          "Correct. The chapter's production template separates instructions, evidence, and query, places the grounding rule before the context, and hard-codes a refusal sentence and [Source N] citation format.",
      },
      {
        id: "ch10-context-injection-patterns-kc-2",
        prompt:
          "In the worked example, a policy assistant must answer only from retrieved policies, cite the policy behind each answer, and decline cleanly when the policy is missing. Which template layout satisfies all three requirements at once?",
        options: [
          "Inject every retrieved policy in full and add a friendly closing line reminding the model to be accurate and helpful",
          "Put one combined instruction after the context block so the model reads the evidence first and the rules second",
          "Role line, then an instructions block with the grounding rule, an exact refusal sentence, and the [Source N] citation format, then the numbered context, the question, and an answer marker",
        ],
        correct: 2,
        feedback:
          "Correct. This mirrors the chapter's production template: grounding and refusal instructions precede the delimited context, and numbered passages make each citation checkable against the retrieved set.",
      },
      {
        id: "ch10-context-injection-patterns-kc-3",
        prompt:
          "After a teammate simplified the prompt by deleting the fixed refusal sentence, the assistant now fabricates policy details whenever the retrieved passages lack the answer. What is the correct diagnosis of this regression?",
        options: [
          "The retrieval index lost coverage, so the model is forced to improvise; re-embedding the corpus will restore abstention behavior",
          "Removing the explicit refusal string left abstention undefined, so with no instruction banning speculation the model fills evidence gaps from training knowledge",
          "The model weights drifted after the prompt edit, so only a model downgrade can restore the previous refusal behavior",
        ],
        correct: 1,
        feedback:
          "Correct. The chapter's template hard-codes an exact refusal response and bans speculation; deleting them makes gap-filling the default behavior, which is a prompt-contract regression, not a retrieval or weights problem.",
      },
      {
        id: "ch10-context-injection-patterns-kc-4",
        prompt:
          "A reviewer argues you should inject all ten retrieved documents in full because more evidence can only improve grounding. How do you best defend the bounded-budget design against this suggestion?",
        options: [
          "Agree partially but cap the prompt at five documents in retrieval order, dropping the rest exactly at the window edge",
          "Concede the point and raise the model's context window, since a larger window removes the trade-off entirely",
          "Context is a managed budget with priority ordering: count tokens, stop near 80 percent reserving room for instructions and response, rank by re-ranker score, and demote the tail to summaries or titles",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter's overflow guidance treats context as a managed budget — token counting, an 80 percent reserve, ranked truncation, and hierarchical or summarized tail context — not a hard cut or unlimited stuffing.",
      },
      {
        id: "ch10-context-injection-patterns-kc-5",
        prompt:
          "Before rolling out a rewritten grounding template to production, and again when switching the underlying model, what does the chapter's approach require you to validate?",
        options: [
          "Evaluate each grounding pattern on a golden dataset per model, because grounding instructions that help on one model may not transfer to another, and version the prompt like code",
          "Run a one-time spot check on a handful of answers with the current model, then reuse the same template for every future model",
          "Ship the template behind a feature flag and watch aggregate user satisfaction, since grounding problems will surface on their own",
        ],
        correct: 0,
        feedback:
          "Correct. The chapter's tip is explicit: evaluate each pattern on your golden dataset, instructions may not transfer across models, and prompt versioning makes template changes explicit and reversible.",
      },
    ],
  },
  "ch10-structured-outputs": {
    objectives: [
      "Define a typed response contract for RAG answers: answer text, citations, an is_grounded flag, and bounded confidence.",
      "Constrain decoding to the schema and handle validation failure with logging and a safe fallback.",
      "Add production hardening: one repair retry, a refusal path, and post-hoc citation verification.",
    ],
    sections: [
      {
        heading: "Why free-form answers are a liability",
        paragraphs: [
          "A RAG answer consumed by downstream systems cannot be an unverified paragraph of prose. The chapter defines a typed response — answer text, a list of citations, an is_grounded flag, and a confidence score — which forces the model to self-assess grounding explicitly instead of hiding uncertainty inside fluent text.",
          "Structured output is also a determinism lever. Constraining the response to a fixed JSON schema eliminates free-form variation, which matters when a compliance team needs the same query to produce the same shaped response every time.",
        ],
      },
      {
        heading: "The schema as a contract",
        paragraphs: [
          "Each citation is typed: the claim being made, the source_id it rests on, and a confidence constrained to the [0,1] range. The top-level response carries the answer, the citation list, the is_grounded flag, and a confidence that is likewise bounded — constraints enforced by the schema itself rather than by polite prompt wording.",
          "Generation uses schema-constrained decoding with an explicit timeout, so a malformed structure becomes a typed failure the application can catch and route, not a parsing surprise discovered by a downstream consumer.",
        ],
      },
      {
        heading: "Failure handling: validate, log, fall back",
        paragraphs: [
          "When the model returns a malformed structure, the code catches the validation error, logs a warning, and returns None — a safe fallback instead of surfacing broken output to callers. Unexpected exceptions are logged with full context and also fall back safely, so no failure path leaks malformed data.",
          "The production note adds exactly one repair retry on validation failure — not an unbounded loop — and a refusal path when confidence is low or the response is not grounded, so weak answers are declined rather than shipped.",
        ],
      },
      {
        heading: "Post-hoc citation verification",
        paragraphs: [
          "Self-reported grounding is not evidence. The chapter's production note requires verifying that each citation's source_id actually exists in the retrieved set, which catches the case where the model cites a plausible-looking source that was never retrieved.",
          "This closes the loop with the prompt layer: numbered passages in the context give citations something checkable to point at, and the verification step turns is_grounded from a claim the model makes into a property the system tests.",
        ],
      },
    ],
    example: {
      title: "Worked example: citation-verified response API",
      scenario:
        "A compliance-facing assistant must return machine-readable answers: every claim carries a citation, and downstream systems reject responses that are malformed or cite unknown sources.",
      analysis:
        "Free-form generation fails silently — JSON drift breaks parsers and invented source IDs pass unnoticed. A typed contract (citation with claim, source_id, confidence in [0,1]; response with answer, citations, is_grounded) plus constrained decoding makes structure enforceable, and a post-hoc check ties every citation back to the retrieved set.",
      decision:
        "Constrain decoding to the schema with an explicit timeout, log and fall back safely on validation failure with a single repair retry, refuse low-confidence or ungrounded responses, and verify each source_id before returning the answer.",
    },
    productionChecklist: [
      "Constrain confidence fields to the [0,1] range in the schema.",
      "Set an explicit timeout on structured generation calls.",
      "Log validation failures and return a safe fallback instead of malformed output.",
      "Allow a single repair retry on validation error — never an unbounded loop.",
      "Post-verify that every cited source_id exists in the retrieved set before responding.",
    ],
    commonMistakes: [
      "Trusting self-reported is_grounded or confidence without post-hoc verification.",
      "Retrying malformed output indefinitely instead of one bounded repair attempt.",
      "Returning malformed structure to callers rather than a safe fallback.",
      "Asking for JSON in prompt prose only, without schema-constrained decoding.",
    ],
    knowledgeChecks: [
      {
        id: "ch10-structured-outputs-kc-1",
        prompt:
          "Downstream services must consume your RAG answers programmatically, but the model's free-form replies keep breaking their parsers and hiding whether the answer was grounded. What is the strongest generation design?",
        options: [
          "Ask nicely for JSON in the prompt and parse the reply with a tolerant parser that repairs common formatting mistakes",
          "Keep free-form answers but add a separate classifier afterward that guesses whether each answer was grounded",
          "Constrain decoding to a typed schema — answer, citations with claim and source_id, is_grounded, and confidence bounded to [0,1] — with an explicit timeout, so malformed output becomes a typed failure you can catch",
        ],
        correct: 2,
        feedback:
          "Correct. The chapter's structured-output listing uses schema-constrained decoding with a timeout, making structure enforceable and forcing the model to self-assess grounding explicitly.",
      },
      {
        id: "ch10-structured-outputs-kc-2",
        prompt:
          "In the worked example, a compliance-facing assistant must return machine-readable answers where every claim carries a citation and downstream systems reject malformed responses. Which end-to-end design meets that contract?",
        options: [
          "Schema-constrained decoding with a timeout, a logged safe fallback on validation failure with one repair retry, a refusal path for low-confidence or ungrounded output, and post-hoc verification that each source_id was retrieved",
          "Schema-constrained decoding alone, because a response that validates against the schema is guaranteed to be grounded and correctly cited",
          "Free-form generation followed by a strict JSON reformatting pass, plus retries until the downstream system stops rejecting payloads",
        ],
        correct: 0,
        feedback:
          "Correct. This assembles the chapter's full production pattern: typed contract, constrained decoding, bounded retry, refusal path, and verification that every cited source_id exists in the retrieved set.",
      },
      {
        id: "ch10-structured-outputs-kc-3",
        prompt:
          "An audit finds that several answers cite source IDs that look plausible but were never in the retrieved set, even though every response passed schema validation. What is the right diagnosis and fix?",
        options: [
          "Schema validation is broken, so tighten the schema with stricter string patterns for source IDs until the invented identifiers disappear",
          "Schema validity only proves shape, not provenance; the model's self-reported citations went unchecked, so add the chapter's post-hoc verification that each source_id exists in the retrieved set",
          "The retriever returned the wrong documents, so increase K and rerank more aggressively until citations become real again",
        ],
        correct: 1,
        feedback:
          "Correct. The chapter's production note exists for exactly this failure: self-reported grounding is not evidence, so every citation's source_id must be verified against the retrieved set.",
      },
      {
        id: "ch10-structured-outputs-kc-4",
        prompt:
          "A teammate proposes looping the generation call until the model finally returns schema-valid output, arguing this maximizes the success rate. How do you best defend the bounded-retry design?",
        options: [
          "The chapter specifies a single repair retry on validation failure and then a logged safe fallback; an unbounded loop adds unbounded latency and cost while still guaranteeing nothing about grounding",
          "Accept the loop but cap it at ten attempts, because ten is a round number that balances success rate against latency",
          "Skip retries entirely and always fall back, since a model that failed validation once will never succeed on a second attempt",
        ],
        correct: 0,
        feedback:
          "Correct. The production note adds exactly one repair retry on ValidationError, then falls back safely — bounding latency and cost instead of looping until the output happens to parse.",
      },
      {
        id: "ch10-structured-outputs-kc-5",
        prompt:
          "Before launch, which set of checks does the chapter's structured-output pattern require beyond confirming that responses validate against the schema?",
        options: [
          "No further checks: schema validation plus a capable model is sufficient assurance for downstream consumers",
          "Only a load test on the generation endpoint, since grounding problems are quality issues rather than release blockers",
          "Confidence constrained to [0,1] in the schema, a logged safe-fallback path for validation failures, a refusal path for low-confidence or ungrounded responses, and post-hoc verification that every cited source_id exists in the retrieved set",
        ],
        correct: 2,
        feedback:
          "Correct. These are exactly the production additions specified on top of basic schema validation: bounded confidence, a safe fallback, one repair retry, a refusal path, and source_id verification.",
      },
    ],
  },
};

export const chapter10Practice: CatalogPracticeUnit[] = [
  {
    id: "ch10-10-2-1",
    chapter: 10,
    chapterTitle: "Prompt Engineering for RAG",
    title: "How do you prevent context overflow?",
    pages: "73",
    route: "/practice/prompt-engineering-for-rag/how-do-you-prevent-context-overflow",
    competencies: ["prompt assembly", "token budgets", "grounding", "conflicts", "determinism"],
    question:
      "Your RAG system retrieves 10 documents but the LLM context window only fits 5. How do you handle overflow?",
    options: [
      {
        text: "Manage context as a budget with priority ordering: count tokens before injection and stop when the budget is about 80% full, reserving room for instructions and the response; rank documents by re-ranker score so truncation cuts the lowest-value evidence first; and use selective summarization, prompt compression, hierarchical context, or dynamic K for the tail.",
        correct: true,
        feedback:
          "Correct. This is the chapter's senior answer — context treated as a managed budget with priority ordering, combining token budgeting, ranked truncation, summarization, compression, hierarchical context, and dynamic K.",
      },
      {
        text: "Truncate: keep documents in retrieval order until the window is full and drop the rest.",
        correct: false,
        feedback:
          "This is the junior answer the chapter calls out — a hard cut with no token budget, no ranking before truncation, and no compression or summarization.",
      },
      {
        text: "Fix K=5 at the retriever so the prompt can never overflow.",
        correct: false,
        feedback:
          "A fixed K still overflows when chunks run long and wastes recall when they run short; the chapter tunes K dynamically based on average chunk length and still keeps a token budget at assembly time.",
      },
    ],
  },
  {
    id: "ch10-10-2-2",
    chapter: 10,
    chapterTitle: "Prompt Engineering for RAG",
    title: "How do you structure prompts for grounding?",
    pages: "74",
    route: "/practice/prompt-engineering-for-rag/how-do-you-structure-prompts-for-grounding",
    competencies: ["prompt assembly", "token budgets", "grounding", "conflicts", "determinism"],
    question:
      "What specific prompt design patterns maximize factual grounding in RAG responses?",
    options: [
      {
        text: "Tell the model clearly to use the provided context; a capable model will follow a well-phrased instruction.",
        correct: false,
        feedback:
          "This is the junior answer — one vague instruction, with none of the specific patterns (ordering, negative instructions, chain-of-thought grounding, source IDs, structured self-assessment) and no cross-model validation.",
      },
      {
        text: "Apply named patterns and measure each one: put 'answer only from the context below' before the context; add negative instructions (no training knowledge, no inference beyond what is stated); use chain-of-thought grounding (find the answering sentence first, then answer from it); number passages and require citations; define an explicit refusal string; force structured output with self-assessed grounding — and validate every pattern on a golden dataset because instructions may not transfer across models.",
        correct: true,
        feedback:
          "Correct. The chapter's senior answer lists concrete patterns — instruction-before-context, negative instructions, chain-of-thought grounding, source IDs, explicit refusal, structured self-assessment — and treats prompt design as measured engineering validated per model.",
      },
      {
        text: "Write one strong grounding prompt and reuse it unchanged across every model and task so behavior stays consistent.",
        correct: false,
        feedback:
          "This contradicts the chapter's tip: grounding instructions that help on one model may not transfer to another, so each pattern must be evaluated on your golden dataset per model.",
      },
    ],
  },
  {
    id: "ch10-10-2-3",
    chapter: 10,
    chapterTitle: "Prompt Engineering for RAG",
    title: "How do you handle conflicting documents?",
    pages: "74",
    route: "/practice/prompt-engineering-for-rag/how-do-you-handle-conflicting-documents",
    competencies: ["prompt assembly", "token budgets", "grounding", "conflicts", "determinism"],
    question:
      "Two retrieved documents give contradictory answers. What does the LLM do by default, and how do you handle this?",
    options: [
      {
        text: "Pick the better source and answer from it alone.",
        correct: false,
        feedback:
          "This is the junior answer — it hides the conflict. The senior answer detects contradiction, resolves by authority and recency, and makes the disagreement visible.",
      },
      {
        text: "Let the model synthesize both sources into one blended answer, since it has read both and can reconcile them.",
        correct: false,
        feedback:
          "That is exactly the dangerous default the chapter warns about — silent blending produces a fluent response that is partially wrong.",
      },
      {
        text: "Start from the dangerous default — without guidance the LLM silently blends conflicting sources into a partially wrong answer — then add conflict detection (an NLI model scoring entailment, neutral, or contradiction before generation), an explicit conflict prompt that presents both perspectives and notes the disagreement, resolution by source authority and recency, and surfacing the conflict to the user.",
        correct: true,
        feedback:
          "Correct. The chapter's senior answer names the blending default first, then layers NLI conflict detection, explicit conflict prompting, authority and date-based resolution, and user-visible surfacing of the disagreement.",
      },
    ],
  },
  {
    id: "ch10-10-2-4",
    chapter: 10,
    chapterTitle: "Prompt Engineering for RAG",
    title: "How do you ensure deterministic outputs?",
    pages: "75",
    route: "/practice/prompt-engineering-for-rag/how-do-you-ensure-deterministic-outputs",
    competencies: ["prompt assembly", "token budgets", "grounding", "conflicts", "determinism"],
    question:
      "A compliance team requires that the same query always produces the same response. How do you achieve this?",
    options: [
      {
        text: "Set temperature to zero; greedy decoding makes the system deterministic.",
        correct: false,
        feedback:
          "This is the junior answer — temperature 0 is only one lever. Retrieval non-determinism, prompt drift, and silently updated model weights all remain.",
      },
      {
        text: "Pull every determinism lever — temperature 0, a fixed seed (noting it may not survive model version updates), schema-constrained structured output, deterministic retrieval via exact search or a fixed HNSW seed, a semantic cache that returns the exact cached response at high similarity, and prompt versioning — then admit true determinism is impossible with cloud APIs whose weights change silently, and hash and store the (query, context, response) tuple at generation time for audit.",
        correct: true,
        feedback:
          "Correct. The chapter's senior answer covers all determinism levers and adds the honest caveat: since true determinism is impossible with cloud models, design for auditability by hashing and storing tuples.",
      },
      {
        text: "Guarantee determinism by pinning the model version in the API request and freezing the prompt template.",
        correct: false,
        feedback:
          "The chapter's caveat is that cloud providers can silently update weights even behind a pinned version, so true determinism cannot be guaranteed — audit logging of hashed tuples is the honest design.",
      },
    ],
  },
];
