import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter03Module: LearningModule = {
  id: "chapter-3-rag-architecture-production-level",
  title: "RAG Architecture (Production-Level)",
  description:
    "Assemble an interview-ready RAG system as an end-to-end service rather than a notebook prototype, with orchestration, caching, fallback behavior, and failure isolation that hold up under real traffic, partial outages, and mixed workloads.",
  duration: "5 lessons",
  lessons: [
    {
      id: "ch3-end-to-end-pipeline",
      title: "End-to-End Pipeline",
      prompt: "Turn a notebook demo into a staged production request path",
      question:
        "A team's RAG demo embeds the raw user message, queries the vector store, and prompts the LLM with whatever comes back. Which redesign makes it a production-grade request path?",
      options: [
        "Gateway with auth and rate limiting, a semantic-cache fast-path, query rewrite and routing, retrieve then re-rank, generate, then post-process with citations and guardrails before responding",
        "Keep the direct vector-store call but swap in a larger LLM so answer quality compensates for noisy retrieval",
        "Package the whole notebook as one microservice so the full path runs inside a single opaque model call",
      ],
      correct: 0,
      feedback:
        "Strong choice. A production path is a staged service — gateway, cache fast-path, retrieve and re-rank, generate, post-process — where every stage is observable, bounded, and can fail independently.",
      explanation:
        "The production request path is User → Query Rewrite → Route → Retrieve → Re-rank → Generate → Post-process → User, fronted by an API gateway (auth, rate) and a semantic cache. Splitting the work into stages is what lets the system behave predictably under real traffic and partial outages. Interviewers look for this architectural judgment, not component names.",
      takeaways: [
        "Design the request path as explicit stages, not one opaque call.",
        "Put auth, rate limiting, and the cache fast-path at the edge.",
        "Post-process with citations and guardrails before anything reaches the user.",
      ],
      model: ["Rewrite and route", "Retrieve and re-rank", "Generate and post-process"],
      source: { chapter: 3, sections: ["3.1.1"], pages: "36" },
    },
    {
      id: "ch3-stateless-vs-stateful-rag",
      title: "Stateless vs Stateful RAG",
      prompt: "Decide whether the conversation is part of the query",
      question:
        "A support assistant gets follow-ups like 'and what is the deductible on the second plan?' that cannot be retrieved correctly from the follow-up text alone. Which architecture fits?",
      options: [
        "Stateless RAG — treat every query independently so the service stays simple and scales horizontally",
        "Fine-tune the model on support transcripts so it memorizes each user's conversation",
        "Stateful RAG — persist session state in Redis or PostgreSQL and let previous turns influence retrieval",
      ],
      correct: 2,
      feedback:
        "Strong choice. Follow-ups that depend on earlier turns need conversation context at retrieval time; the stateful design keeps that session state in Redis/PostgreSQL so any replica can serve any turn.",
      explanation:
        "Stateless RAG treats each query as independent — simple and scalable, but it cannot resolve a follow-up whose subject lives in a previous turn. Stateful RAG maintains conversation context so previous turns influence retrieval, using Redis or PostgreSQL for session state. Pay for state only when the product is genuinely multi-turn.",
      takeaways: [
        "Default to stateless for self-contained, one-shot questions.",
        "Follow-ups need conversation context applied before retrieval.",
        "Keep session state in an external store such as Redis or PostgreSQL.",
      ],
      model: ["Detect context need", "Load session state", "Rewrite then retrieve"],
      source: { chapter: 3, sections: ["3.1.2"], pages: "36" },
    },
    {
      id: "ch3-agentic-rag-planner-executor-verifier",
      title: "Agentic RAG: Planner – Executor – Verifier",
      prompt: "Wrap retrieval in a bounded control loop",
      question:
        "A research copilot must answer goals that take several dependent steps — retrieve documents, run a SQL lookup, then check the combined result. Which design fits?",
      options: [
        "A single retrieve-generate call with a longer prompt that lists every possible subtask",
        "An agentic loop: a planner decomposes the goal into subtasks, an executor runs each one (retrieve, SQL, API, code), and a verifier checks quality and retries below a threshold until the goal is met or max iterations are hit",
        "Three independent RAG services that each answer part of the question, with the client stitching the responses together",
      ],
      correct: 1,
      feedback:
        "Strong choice. Multi-step goals need decomposition, tool execution, and verification in a loop — bounded by a quality threshold and a max-iteration cap so it stays production-safe.",
      explanation:
        "Agentic RAG replaces the single retrieve-generate shot with a control loop: the planner decomposes the goal into subtasks, the executor runs each subtask against tools (retrieve, SQL, API, code), and the verifier checks output quality and triggers retries when it is below threshold. The loop continues until the goal is achieved or a maximum iteration count is reached.",
      takeaways: [
        "The planner decomposes goals; it does not answer them.",
        "The executor binds each subtask to a concrete tool call.",
        "The verifier plus a max-iteration cap keep the loop honest and bounded.",
      ],
      model: ["Plan subtasks", "Execute with tools", "Verify and retry"],
      source: { chapter: 3, sections: ["3.1.3"], pages: "36" },
    },
    {
      id: "ch3-tool-calling",
      title: "Tool Calling",
      prompt: "Match each subtask to the system that owns the data",
      question:
        "A user asks an operations assistant: 'How many units of SKU-123 are in the Dallas warehouse right now?' The vector index holds last month's inventory reports. Which tool should the agent call?",
      options: [
        "The inventory API, or SQL against the warehouse database — live structured state should be queried at its source",
        "Vector search over the embedded inventory reports, because semantic retrieval finds the most relevant document",
        "Web search, because the question asks for current data and web search is the real-time tool",
      ],
      correct: 0,
      feedback:
        "Strong choice. Stock levels are live structured state: an API or SQL read of the source system is current and exact, while an embedded report is already stale the moment it is indexed.",
      explanation:
        "Tool calling lets agents act beyond the vector store: SQL for structured data, APIs for external services such as inventory or CRM, code execution for calculations, web search for real-time information, and vector search for semantic document retrieval. The design skill is matching the tool to the data shape — the index cannot stay current with live operational state.",
      takeaways: [
        "Vector search is one tool among several, not the universal answer.",
        "Structured and aggregation questions belong in text-to-SQL.",
        "Live state (inventory, CRM, weather) is read from its owning API at request time.",
      ],
      model: ["Classify the subtask", "Pick the owning tool", "Call with timeout"],
      source: { chapter: 3, sections: ["3.1.4"], pages: "36" },
    },
    {
      id: "ch3-streaming-rag-architecture",
      title: "Streaming RAG Architecture",
      prompt: "Design for perceived latency, not just stopwatch latency",
      question:
        "An interactive RAG product takes about 4 seconds per answer and shows nothing until the full response lands; users say it feels broken. Which streaming design is correct?",
      options: [
        "Keep the blocking response but move the transport to WebSockets, since bidirectional transport is what makes LLM apps feel fast",
        "Stream retrieval and re-ranking token-by-token as well, so the user sees progress from the first millisecond",
        "Block retrieval and re-rank (about 300–600ms) so the prompt can be assembled, then stream generation tokens over SSE, emitting citation events at claim boundaries and a final consolidated citation map with a done sentinel",
      ],
      correct: 2,
      feedback:
        "Strong choice. Retrieval and re-ranking must finish before the prompt exists, so they block under a timeout; streaming starts at generation over SSE, with citations emitted incrementally and reconciled at the end.",
      explanation:
        "Perceived latency dominates user satisfaction: an answer that starts showing text at 800ms feels far faster than a faster total time delivered all at once. SSE is the standard transport because it is unidirectional, runs over plain HTTP/2, auto-reconnects, and is proxy- and load-balancer-friendly. The hard part is citations — stream prose immediately, emit citation events as claim boundaries are detected, then close with a consolidated map and a done sentinel.",
      takeaways: [
        "Optimize time to first token; perceived latency drives satisfaction.",
        "Retrieve and re-rank block under a timeout; only generation streams.",
        "Citations stream at claim boundaries and reconcile in a final map.",
      ],
      model: ["Bound the blocking prefix", "Stream tokens over SSE", "Emit citations then sentinel"],
      source: { chapter: 3, sections: ["3.1.5"], pages: "37" },
    },
  ],
};

export const chapter03CourseContent: Record<string, LessonCourseContent> = {
  "ch3-end-to-end-pipeline": {
    objectives: [
      "Lay out the production RAG request path as explicit, observable stages.",
      "Explain the role of the gateway, semantic cache fast-path, and post-processing.",
      "Justify stage isolation as the basis for fallback behavior under real traffic.",
    ],
    sections: [
      {
        heading: "From notebook prototype to staged service",
        paragraphs: [
          "An interview-ready RAG system is assembled as an end-to-end service, not a notebook prototype. The canonical request path is User → Query Rewrite → Route → Retrieve → Re-rank → Generate → Post-process → User. Each arrow is a contract: inputs, outputs, timeouts, and failure behavior are defined per stage so the system can be observed and tested one stage at a time.",
          "Interviewers look for architectural judgment here, not component names. The reason to split the path is behavior under real traffic, partial outages, and mixed workloads: when re-ranking slows down or the vector database times out, a staged design can degrade one stage without collapsing the whole response.",
        ],
      },
      {
        heading: "The edge: gateway, auth, and the cache fast-path",
        paragraphs: [
          "Every request first crosses an API gateway that owns authentication and rate limiting. Abusive or malformed load is stopped before it reaches the retrieval cluster or the LLM, and per-user policy is enforced in exactly one place.",
          "Behind the gateway sits the semantic cache. Before paying for retrieval and generation, the system checks whether a similar query was already answered; a hit short-circuits the expensive path entirely. This fast-path/full-path split, decided at the routing stage, is a defining feature of a production request path.",
        ],
      },
      {
        heading: "Retrieve, re-rank, and generate",
        paragraphs: [
          "The query rewrite stage normalizes the request — resolving follow-ups or tightening intent — and the router sends it to the right knowledge path. Retrieval pulls candidates and the re-ranker orders them with a more precise model, so generation receives a small, high-quality evidence set rather than raw nearest neighbors.",
          "Retrieval and re-ranking must complete before the prompt can be assembled; in a typical deployment they block for roughly 300–600ms. Only then does the LLM generate. Keeping these as separate, timed stages is what makes a latency budget and per-stage fallbacks possible.",
        ],
      },
      {
        heading: "Post-process before you respond",
        paragraphs: [
          "Generation is not the end of the path. Post-processing attaches citations to the evidence actually used and applies guardrail checks — the cite-and-guard stage of the production request path — before anything reaches the user, followed by a final validation pass.",
          "This stage is also a failure-isolation boundary. If guardrails fail or citations cannot be resolved, the system can refuse, degrade, or retry rather than shipping an ungrounded answer. Designing that behavior deliberately is what separates a service from a demo.",
        ],
      },
    ],
    example: {
      title: "Worked example: graduating a support demo",
      scenario:
        "A team's notebook demo answers support questions well in testing: it embeds the raw user message, queries the vector store, and prompts the LLM with the top chunks. Leadership asks what must change before it can serve real customers.",
      analysis:
        "The demo collapses every stage into one opaque call: no gateway means no auth or rate limiting; no semantic cache means every repeat question pays full retrieval and generation cost; no re-rank stage means generation consumes noisy candidates; and no post-processing means answers ship without citations or guardrail checks. Each missing stage is a missing observability and failure-isolation point.",
      decision:
        "Rebuild the request path as gateway (auth, rate) → semantic cache fast-path → rewrite and route → retrieve + re-rank → generate → post-process (cite, guard), with per-stage timeouts and metrics, then load-test the full path with a mix of simple and complex queries.",
    },
    productionChecklist: [
      "Terminate authentication and rate limiting at an API gateway before any model work.",
      "Put a semantic cache fast-path in front of the full retrieval pipeline.",
      "Time retrieval and re-ranking as separate stages with explicit budgets.",
      "Attach citations and run guardrail checks in post-processing, before responding.",
      "Define per-stage failure behavior and verify it with partial-outage tests.",
    ],
    commonMistakes: [
      "Shipping the notebook path — user query straight to the vector store — as the production service.",
      "Treating the pipeline as one opaque call, so no stage can be timed, cached, or failed independently.",
      "Skipping the cache fast-path and paying full retrieval-plus-generation cost for every repeat query.",
      "Letting generated text reach users without the post-processing citation and guardrail stage.",
    ],
    knowledgeChecks: [
      {
        id: "ch3-end-to-end-pipeline-kc-1",
        prompt: "A team's RAG service sends the raw user query straight to the vector store and then to the LLM, and leadership asks why reviewers keep calling it a prototype. Which redesign answers that criticism?",
        options: [
          "Rebuild the path as staged services: gateway with auth and rate limiting, semantic cache fast-path, rewrite and route, retrieve then re-rank, generate, then post-process with citations and guardrails",
          "Keep the direct path but document each step carefully so reviewers can see the team understands the architecture",
          "Replace the vector store with a larger LLM context window so fewer moving parts need to be described in the design review",
        ],
        correct: 0,
        feedback: "The production request path is User → Query Rewrite → Route → Retrieve → Re-rank → Generate → Post-process → User behind a gateway and semantic cache; interviewers want that staged judgment, not component names.",
      },
      {
        id: "ch3-end-to-end-pipeline-kc-2",
        prompt: "A support assistant was shipped straight from a notebook demo: it answers well in testing, but its request path has no gateway, no semantic cache, no re-rank stage, and no post-processing. What is the most important consequence of those omissions?",
        options: [
          "Answers will simply be less accurate, because the LLM receives raw nearest-neighbor chunks instead of a cleaned prompt",
          "Users will notice higher latency on every request, since nothing in the demo path has been performance-tuned yet",
          "Every stage is collapsed into one opaque call, so nothing can be timed, cached, or failed independently — no auth, no fast-path, no citation or guardrail boundary",
        ],
        correct: 2,
        feedback: "The demo's real defect is lost observability and failure isolation: each missing stage (gateway, cache, re-rank, cite-and-guard post-processing) is a missing control point, which is what separates a service from a demo.",
      },
      {
        id: "ch3-end-to-end-pipeline-kc-3",
        prompt: "Production traffic shows every repeated question paying full retrieval and generation cost, and one slow re-ranker outage took the entire answer path down with it. Which design gap explains both symptoms?",
        options: [
          "The LLM is undersized for the traffic, so upgrading the model fixes both the repeated-query cost and the outage cascade",
          "There is no semantic cache fast-path for repeated queries, and no stage isolation or per-stage fallback, so a single stage's outage collapses the whole response",
          "The gateway rate limit is set too high, letting repeated queries through and overwhelming the re-ranker until it fails",
        ],
        correct: 1,
        feedback: "The production request path puts a semantic cache fast-path in front of retrieval and isolates stages so partial outages degrade one stage instead of the whole service; both symptoms trace to those two missing pieces.",
      },
      {
        id: "ch3-end-to-end-pipeline-kc-4",
        prompt: "A reviewer argues the staged pipeline is over-engineering: one strong model call with the whole pipeline inlined would ship faster and read simpler. How do you defend the staged design?",
        options: [
          "Concede and inline the pipeline, but keep the gateway, since auth is the only stage that cannot live inside a model call",
          "Argue that more stages always means better architecture, because each additional service raises the system's maturity score",
          "Stages are what make the system observable and degradable under real traffic, partial outages, and mixed workloads — per-stage timing, caching, timeouts, and fallbacks are impossible inside one opaque call",
        ],
        correct: 2,
        feedback: "The lesson's core premise is behavior under real traffic, partial outages, and mixed workloads; stage boundaries are the mechanism that delivers orchestration, caching, and failure isolation.",
      },
      {
        id: "ch3-end-to-end-pipeline-kc-5",
        prompt: "Before launch, which validation plan best confirms the new staged request path actually behaves like a production service rather than a renamed prototype?",
        options: [
          "Load-test the full path with mixed simple and complex queries, measure per-stage timing, and run partial-outage tests that verify each stage's defined failure behavior",
          "Run the original notebook evaluation set once more and confirm answer quality has not regressed after the refactor",
          "Ship to all users immediately but keep the old demo available so the team can roll back if complaints arrive",
        ],
        correct: 0,
        feedback: "The lesson's checklist is per-stage budgets plus partial-outage verification: production behavior is proven by stage-level timing and failure tests under load, not by re-running the prototype's offline evaluation.",
      },
    ],
  },
  "ch3-stateless-vs-stateful-rag": {
    objectives: [
      "Distinguish stateless and stateful RAG request handling.",
      "Explain how conversation context influences retrieval in a stateful design.",
      "Choose where session state lives and when to pay for it.",
    ],
    sections: [
      {
        heading: "Stateless: the default production posture",
        paragraphs: [
          "In a stateless RAG service every query is independent and no conversation memory is kept between requests. Any replica can handle any request, which keeps the system simple to reason about and trivial to scale horizontally behind a load balancer.",
          "Statelessness works whenever questions are self-contained. A one-shot lookup such as 'what is the refund window?' carries everything retrieval needs inside the query itself, so the pipeline runs unchanged for every request.",
        ],
      },
      {
        heading: "When statelessness breaks",
        paragraphs: [
          "Real conversations are not self-contained. A follow-up like 'and what is the deductible on the second plan?' cannot be retrieved correctly on its own, because the query text no longer contains the subject it refers to.",
          "In a stateful design, previous turns influence retrieval: conversation context is used to turn the follow-up into a self-contained query before it reaches the vector store. Memory is therefore an input to retrieval, not just extra text pasted into the generation prompt.",
        ],
      },
      {
        heading: "Where session state lives",
        paragraphs: [
          "A production stateful design keeps session state in an external store — Redis or PostgreSQL — rather than inside the service process. The state travels with the session id, so any replica can serve any turn of the conversation and a restart does not lose the dialogue.",
          "That choice carries the classic state trade-offs: Redis favors fast session reads and writes, while PostgreSQL favors durability and queryability; either way the team now owns consistency, expiry, and storage of conversation data. State is a product decision with an operational bill attached.",
        ],
      },
      {
        heading: "Choosing and validating",
        paragraphs: [
          "Default to stateless and add state only when the product is genuinely multi-turn. The test is whether retrieval quality on follow-up questions measurably improves when previous turns are available — if users only ever ask one-shot questions, state adds cost and failure modes without quality.",
          "Validate a stateful rollout with multi-turn conversation tests, not single queries: check that context is actually used (a follow-up retrieves the same subject as its parent turn) and that missing or expired session state degrades into a clean stateless answer rather than an error.",
        ],
      },
    ],
    example: {
      title: "Worked example: the follow-up retrieval cannot see",
      scenario:
        "A benefits assistant answers 'Compare the two health plans' correctly, but when the user asks 'and what is the deductible on the second one?', retrieval returns generic deductible policy pages and the answer addresses the wrong plan.",
      analysis:
        "The follow-up is stateless-incompatible: the phrase 'the second one' contains no plan name, so embedding it cannot retrieve the right evidence. The gap is not in the corpus — it is between the conversation and the query.",
      decision:
        "Keep the answering pipeline unchanged, add session state in Redis keyed by session id, and let the rewrite stage expand follow-ups against conversation context (for example, 'deductible on Plan B') before retrieval; track follow-up retrieval accuracy as its own metric.",
    },
    productionChecklist: [
      "Default to stateless; require a measured multi-turn need before adding state.",
      "Store session state in Redis/PostgreSQL keyed by session id, never in process memory.",
      "Apply conversation context at the rewrite stage, before retrieval.",
      "Set session expiry and persistence policy deliberately.",
      "Test that missing or expired state degrades to a clean stateless answer.",
    ],
    commonMistakes: [
      "Building stateful memory by default and paying for it on one-shot traffic.",
      "Keeping conversation state in the service process, so requests break when they land on another replica.",
      "Pasting raw history into the prompt without rewriting the query, so retrieval still sees an unresolvable follow-up.",
      "No expiry or eviction policy, letting session state grow unbounded.",
    ],
    knowledgeChecks: [
      {
        id: "ch3-stateless-vs-stateful-rag-kc-1",
        prompt: "A one-shot internal search tool answers self-contained questions like 'what is the refund window?' with no follow-ups. The team debates adding conversation memory. What is the right call?",
        options: [
          "Add stateful memory now, because every production chat product eventually needs conversation context and retrofitting it later is painful",
          "Stay stateless: each query is independent, which keeps the service simple and horizontally scalable; add state only when a multi-turn need is measured",
          "Fine-tune the model on the search logs so it learns user phrasing without the team operating any session store",
        ],
        correct: 1,
        feedback: "Stateless RAG means each query is independent — simple and scalable — while stateful exists so previous turns can influence retrieval; one-shot traffic has no such need to pay for.",
      },
      {
        id: "ch3-stateless-vs-stateful-rag-kc-2",
        prompt: "A benefits assistant answers 'Compare the two health plans' correctly, but the follow-up 'and what is the deductible on the second one?' retrieves generic deductible policy pages and the answer addresses the wrong plan. Which fix matches this diagnosis?",
        options: [
          "Re-embed the policy corpus with a stronger model so that pronoun-heavy queries produce sharper vectors",
          "Increase retrieval K so the correct plan documents are more likely to appear somewhere in the candidate set",
          "Add session state and let the rewrite stage expand the follow-up against conversation context — 'deductible on Plan B' — before retrieval runs",
        ],
        correct: 2,
        feedback: "The gap is between the conversation and the query, not in the corpus: in a stateful design previous turns influence retrieval, so the rewrite stage must resolve the reference before the vector search.",
      },
      {
        id: "ch3-stateless-vs-stateful-rag-kc-3",
        prompt: "After launching conversation memory, users report that follow-up answers break whenever requests land on a different server, and some sessions return another user's context. What is the likely root cause?",
        options: [
          "Session state was kept in each service process instead of an external Redis/PostgreSQL store keyed by session id, so state does not travel with the session",
          "The embedding model cannot handle multi-turn queries, so retrieval quality collapses whenever a second turn arrives",
          "The load balancer routes too aggressively, and pinning each user to one server forever is the correct long-term fix",
        ],
        correct: 0,
        feedback: "The stateful design uses Redis/PostgreSQL for session state precisely so any replica can serve any turn; in-process state breaks on replica hops and risks cross-session leakage.",
      },
      {
        id: "ch3-stateless-vs-stateful-rag-kc-4",
        prompt: "A product manager wants every assistant in the company stateful by default 'so nothing is ever forgotten.' How do you defend a stateless-by-default posture?",
        options: [
          "Agree, because the cost of running Redis is negligible compared with the risk of forgetting a user detail",
          "Refuse state entirely, since conversation memory never improves retrieval quality in any product",
          "State adds an operational bill — consistency, expiry, storage, failure modes — and only pays off when previous turns measurably influence retrieval; one-shot traffic should not carry it",
        ],
        correct: 2,
        feedback: "The choice is plain: stateless is simple and scalable, stateful maintains context so previous turns influence retrieval; the lesson's test is measured multi-turn need, not a blanket policy.",
      },
      {
        id: "ch3-stateless-vs-stateful-rag-kc-5",
        prompt: "The stateful rollout for the support assistant is built and ready for design review. Which validation evidence best supports shipping it to real users?",
        options: [
          "A single-query benchmark showing stateless accuracy is unchanged, since the stateful path shares the same pipeline",
          "Multi-turn conversation tests showing follow-ups retrieve the same subject as their parent turn, plus proof that missing or expired session state degrades to a clean stateless answer",
          "A load test showing Redis can sustain the session read and write rate at ten times expected traffic",
        ],
        correct: 1,
        feedback: "The lesson's validation standard is behavioral, not just capacity: previous turns must actually influence retrieval on follow-ups, and lost session state must degrade gracefully rather than error.",
      },
    ],
  },
  "ch3-agentic-rag-planner-executor-verifier": {
    objectives: [
      "Describe the planner–executor–verifier loop and each role's contract.",
      "Decide when a goal needs an agentic loop instead of single-shot retrieval.",
      "Bound the loop with a quality threshold and a max-iteration cap.",
    ],
    sections: [
      {
        heading: "Retrieval as a control loop",
        paragraphs: [
          "Single-shot RAG assumes one retrieval and one generation can answer the request. Agentic RAG drops that assumption: the system runs a loop in which a planner decomposes the goal into subtasks, an executor carries each subtask out, and a verifier checks the result before the loop continues.",
          "The loop exists for goals whose answer depends on several dependent steps — a document lookup plus a database query plus a calculation, for example. Decomposition turns one impossible prompt into a sequence of well-scoped, individually checkable tool calls.",
        ],
      },
      {
        heading: "Planner and executor",
        paragraphs: [
          "The planner's job is decomposition: given the user's goal, it emits subtasks rather than an answer. Each subtask is small enough to be executed and checked independently, which is what makes the overall result verifiable.",
          "The executor runs those subtasks against concrete tools — retrieve from the vector store, run SQL, call an API, or execute code. This is where agentic RAG meets tool calling: the planner decides what kind of evidence is needed, and the executor fetches it from the system that actually owns it.",
        ],
      },
      {
        heading: "Verifier and the retry contract",
        paragraphs: [
          "The verifier checks output quality. When the output is below threshold, the loop retries — replanning or re-executing — rather than shipping the weak result. Quality control is a first-class stage, not a hoped-for property of the prompt.",
          "Retries must be bounded: the loop continues until the goal is achieved or a maximum iteration count is reached. The max-iteration cap is the production safety valve that keeps a stubborn goal from burning unbounded latency and tokens, and hitting the cap should produce a degraded, honest response rather than silence.",
        ],
      },
      {
        heading: "When the loop is worth it",
        paragraphs: [
          "Agentic RAG earns its complexity when tasks are genuinely multi-step: research questions, requests combining documents with structured lookups, or goals where the second retrieval depends on the first result. For single-shot factual questions, the loop adds latency and cost with no quality gain.",
          "Validate the loop end to end: track how often the verifier triggers retries, how often the iteration cap is hit, and whether answer quality on multi-step goals actually beats a single-shot baseline. Those signals tell you whether the loop is doing work or just spinning.",
        ],
      },
    ],
    example: {
      title: "Worked example: a research question with a database in the middle",
      scenario:
        "An analyst asks: 'Summarize the onboarding issues in our docs, then check how many tickets mention each one this quarter and rank them.' A single retrieve-generate call either invents the counts or ignores the ranking.",
      analysis:
        "The goal decomposes naturally: retrieve issue themes from the documentation, run SQL against the ticketing system for per-theme counts, then synthesize a ranked summary. Each subtask has a clear owner — vector search, SQL, generation — and a checkable output.",
      decision:
        "Deploy a planner–executor–verifier loop: the planner emits the three subtasks, the executor runs retrieval and SQL, the verifier checks that counts are present and consistent before synthesis, and a max-iteration cap with a thresholded retry keeps the loop bounded.",
    },
    productionChecklist: [
      "Give the planner a fixed subtask schema the executor can run deterministically.",
      "Bind every executor subtask to a concrete tool: retrieve, SQL, API, or code.",
      "Define the verifier's quality threshold before enabling retries.",
      "Cap total iterations and define the degraded response when the cap is hit.",
      "Log each plan, tool call, and verdict so loops can be debugged after the fact.",
    ],
    commonMistakes: [
      "Running the loop without a max-iteration bound, so a hard goal consumes unbounded latency and tokens.",
      "No verifier at all — trusting the executor's first output and losing the retry benefit.",
      "Setting a retry threshold that was never tuned, so nearly everything retries or nothing does.",
      "Using an agentic loop for one-shot factual questions that plain RAG answers faster and cheaper.",
    ],
    knowledgeChecks: [
      {
        id: "ch3-agentic-rag-planner-executor-verifier-kc-1",
        prompt: "A single retrieve-generate call keeps failing on goals that need a document lookup, a database query, and a synthesis step. Which architectural change addresses the failure?",
        options: [
          "Lengthen the prompt to enumerate all required steps so the model performs them inside one generation",
          "Run the same single call three times and majority-vote the outputs to smooth out the failures",
          "Move to an agentic loop: a planner decomposes the goal into subtasks, an executor runs each against tools, and a verifier checks quality with bounded retries",
        ],
        correct: 2,
        feedback: "The agentic RAG loop exists exactly for multi-step goals: the planner decomposes, the executor runs retrieve/SQL/API/code subtasks, and the verifier checks output quality and retries below threshold.",
      },
      {
        id: "ch3-agentic-rag-planner-executor-verifier-kc-2",
        prompt: "An analyst asks an assistant to summarize the onboarding issues in the docs, check how many tickets mention each one this quarter, and rank them. Which execution plan correctly assigns the subtasks?",
        options: [
          "Vector search retrieves issue themes from the docs, SQL counts tickets per theme, generation synthesizes the ranked summary, and the verifier checks the counts are present before synthesis",
          "Vector search retrieves the docs, and the LLM estimates the ticket counts from the retrieved text before ranking them",
          "SQL retrieves the documentation themes, the vector store counts the tickets, and the planner writes the final summary itself",
        ],
        correct: 0,
        feedback: "Each subtask must go to the system that owns the data: themes live in documents (vector search), counts live in the ticketing database (SQL), and the verifier guards the hand-off into synthesis.",
      },
      {
        id: "ch3-agentic-rag-planner-executor-verifier-kc-3",
        prompt: "An agentic deployment shows runaway request latency and token spend: some goals loop dozens of times, re-executing the same subtasks without ever converging. Which missing control explains this?",
        options: [
          "The planner prompt is too short, so the model improvises new subtasks on every iteration",
          "There is no max-iteration cap, so the loop never terminates on stubborn goals; the loop must be bounded to 'goal achieved or max iterations'",
          "The executor's tools are too slow, and upgrading the vector store will let the loop converge faster",
        ],
        correct: 1,
        feedback: "The loop contract is 'continues until goal achieved or max iterations'; without the cap, a goal that never passes the verifier burns unbounded latency and tokens — the lesson's first common mistake.",
      },
      {
        id: "ch3-agentic-rag-planner-executor-verifier-kc-4",
        prompt: "A teammate proposes routing all traffic — including simple factual lookups — through the agentic loop 'for consistency.' How do you push back?",
        options: [
          "Agree: a single code path is easier to operate, and the loop overhead is too small to matter",
          "Reject the loop entirely: single-shot RAG is always sufficient if the prompt is well written",
          "For single-shot factual questions the loop adds latency and cost with no quality gain; reserve it for genuinely multi-step goals where later evidence depends on earlier results",
        ],
        correct: 2,
        feedback: "The lesson's criterion follows the loop's design intent: the loop earns its complexity on multi-step goals (retrieve plus SQL plus code); one-shot questions are answered faster and cheaper by plain RAG.",
      },
      {
        id: "ch3-agentic-rag-planner-executor-verifier-kc-5",
        prompt: "The agentic loop has been running in production for a month. Which metrics best tell you whether the loop is doing real work or just spinning?",
        options: [
          "Verifier-triggered retry rate, max-iteration cap hit rate, and multi-step answer quality versus a single-shot baseline",
          "Total tokens consumed per month, since higher spend proves the loop is exploring thoroughly",
          "Planner response time alone, because a fast planner means the whole loop is healthy",
        ],
        correct: 0,
        feedback: "The lesson's validation approach is explicit: track how often the verifier retries, how often the iteration cap is hit, and whether multi-step quality beats the single-shot baseline — those signals separate work from spinning.",
      },
    ],
  },
  "ch3-tool-calling": {
    objectives: [
      "Treat vector search as one tool among several in an agent's toolbox.",
      "Match each question type to the tool that owns the data.",
      "Explain why live structured state should be queried at its source.",
    ],
    sections: [
      {
        heading: "Beyond the vector store",
        paragraphs: [
          "Classic RAG has exactly one move: retrieve documents, then generate. Tool calling generalizes that — agents call tools instead of only retrieving from a vector store. Vector search remains in the toolbox, but it is the right answer only for semantic document retrieval.",
          "This changes the design question from 'what is in the index?' to 'what kinds of evidence exist, and which system owns each kind?' The agent's value is routing each subtask to the system of record rather than approximating every answer from embeddings.",
        ],
      },
      {
        heading: "Structured data: text-to-SQL",
        paragraphs: [
          "Counts, aggregates, filters, and joins over structured records belong in SQL. Text-to-SQL lets the agent translate a natural-language subtask into a query against the database that actually holds the numbers, instead of hoping an embedded report mentions them.",
          "The failure mode to avoid is asking the LLM to compute over retrieved prose: arithmetic and aggregation over documents are unreliable, while the same question expressed as SQL against the source table is exact and auditable.",
        ],
      },
      {
        heading: "Live state and real-time information: APIs, code, and web search",
        paragraphs: [
          "APIs expose external services — weather, CRM, inventory — whose state changes constantly and should be read at request time. Code execution (Python or bash) handles calculations, so math is done by an interpreter rather than predicted by the model.",
          "Web search covers real-time information retrieval for facts the private corpus cannot contain. The common thread is freshness: these tools exist because no embedding index can stay current with live prices, stock levels, or breaking events.",
        ],
      },
      {
        heading: "Choosing the tool per subtask",
        paragraphs: [
          "A practical routing rule follows the data shape: semantic questions about documents go to vector search; questions about structured records go to SQL; questions about live service state go to the owning API; calculations go to code; current-events questions go to web search.",
          "In an agentic architecture the planner makes this choice per subtask, and each tool call should carry the same production discipline as any pipeline stage — explicit inputs, a timeout, and defined failure behavior. A wrong tool choice is an architecture bug, not a prompt bug.",
        ],
      },
    ],
    example: {
      title: "Worked example: the inventory question",
      scenario:
        "A user asks an operations assistant: 'How many units of SKU-123 are in the Dallas warehouse right now?' The vector index contains last month's inventory report PDFs.",
      analysis:
        "The question is about live structured state. Vector search can retrieve a document about SKU-123, but the number in last month's report is not the number on the shelf today — semantic similarity cannot substitute for a current read of the source system.",
      decision:
        "Route the subtask to the inventory API (or SQL against the warehouse database), reserve vector search for the genuinely semantic parts of the request, and execute any arithmetic through the code tool rather than the model.",
    },
    productionChecklist: [
      "Register tools with explicit input contracts the planner can target.",
      "Send structured aggregation questions to text-to-SQL, not to document retrieval.",
      "Query live state (inventory, CRM, weather) from its owning API at request time.",
      "Execute calculations in Python/bash, never as LLM mental math.",
      "Give every tool call a timeout and a defined failure behavior.",
    ],
    commonMistakes: [
      "Answering structured questions from embedded reports instead of text-to-SQL on the source table.",
      "Embedding fast-changing data such as prices or stock levels and serving it stale instead of calling the live API.",
      "Letting the LLM do arithmetic in prose when a code tool would be exact.",
      "Treating vector search as the universal tool for every question type.",
    ],
    knowledgeChecks: [
      {
        id: "ch3-tool-calling-kc-1",
        prompt: "Users ask the assistant things like 'how many refunds over $500 were issued last week?' Which tool should handle that subtask, and why?",
        options: [
          "Vector search, because refund policy documents describe how refunds work and are semantically close to the question",
          "Text-to-SQL, because counts and filters over structured records belong in a query against the database that holds the numbers",
          "Web search, because 'last week' makes the question time-sensitive and therefore an external search problem",
        ],
        correct: 1,
        feedback: "SQL (text-to-SQL) is the tool for structured data queries; aggregation over records is exact and auditable in SQL, while retrieved prose cannot be reliably counted.",
      },
      {
        id: "ch3-tool-calling-kc-2",
        prompt: "A user asks an operations assistant how many units of SKU-123 are in the Dallas warehouse right now; the vector index holds last month's inventory report PDFs. Why is vector search the wrong tool?",
        options: [
          "Because SKU codes are identifiers, and identifiers never appear in embedding training data",
          "Because the question is too short for the embedding model to encode reliably",
          "Because the answer is live structured state: last month's embedded report cannot equal today's shelf count, so the inventory API or SQL on the source system is required",
        ],
        correct: 2,
        feedback: "The tool list assigns inventory to APIs and structured queries to SQL; semantic similarity finds a relevant document, but it cannot substitute for a current read of the source system.",
      },
      {
        id: "ch3-tool-calling-kc-3",
        prompt: "A finance assistant starts giving wrong totals: the team finds the LLM was summing long columns of numbers from retrieved spreadsheets inside its generation. Which tool-calling fix addresses the root cause?",
        options: [
          "Route the arithmetic to the code execution tool (Python/bash) so an interpreter computes the totals instead of the model predicting them",
          "Add more few-shot examples of correct addition to the prompt so the model computes more carefully",
          "Retrieve smaller chunks so there are fewer numbers for the model to sum incorrectly",
        ],
        correct: 0,
        feedback: "Code execution (Python/bash) is the tool for calculations; mental math over retrieved prose is the exact failure mode the tool boundary exists to remove.",
      },
      {
        id: "ch3-tool-calling-kc-4",
        prompt: "An engineer suggests embedding the inventory database nightly so the assistant can answer stock questions 'with the same vector pipeline as everything else.' What is the strongest objection?",
        options: [
          "Nightly embedding jobs are too expensive to run on any database of meaningful size",
          "Fast-changing data served from an index is served stale; live state should be read from its owning API at request time, which is exactly what tool calling adds",
          "Vector search cannot represent numeric columns at all, so the plan fails on day one",
        ],
        correct: 1,
        feedback: "The tool list exists because no embedding index stays current with live prices or stock levels; serving embedded snapshots of fast-changing data is the lesson's named common mistake.",
      },
      {
        id: "ch3-tool-calling-kc-5",
        prompt: "Before enabling tool calling in production, which readiness check best matches the lesson's production discipline for tool calls?",
        options: [
          "A demo showing the agent picks the right tool on five hand-picked example questions",
          "A benchmark proving the underlying LLM scores well on generic reasoning tasks",
          "Every tool registered with an explicit input contract the planner can target, plus a timeout and defined failure behavior per tool call",
        ],
        correct: 2,
        feedback: "The lesson's checklist treats each tool call like any pipeline stage: explicit inputs, timeouts, and defined failure behavior — a wrong tool choice is an architecture bug, not a prompt bug.",
      },
    ],
  },
  "ch3-streaming-rag-architecture": {
    objectives: [
      "Explain why perceived latency makes streaming an architectural requirement.",
      "Identify which pipeline stages block and which stages stream.",
      "Design the SSE event protocol: status, token, citation, done, and error frames.",
    ],
    sections: [
      {
        heading: "Perceived latency is the real requirement",
        paragraphs: [
          "User satisfaction tracks perceived latency, not stopwatch latency. A call that takes 4 seconds but starts showing text at 800ms feels far faster than one that blocks for 3 seconds and then dumps the whole answer — so for any interactive RAG product, streaming is an architectural requirement, not a nicety.",
          "This reframes the design goal: the first token is a deadline of its own. Everything the user sees before generation — a spinner, a status message — buys perceived time, while everything after the first token arrives incrementally and feels like progress.",
        ],
      },
      {
        heading: "What blocks and what streams",
        paragraphs: [
          "Retrieval and re-ranking are not streamed: they must complete so the prompt can be assembled. The pipeline blocks through Retrieve → Re-rank → Assemble prompt (roughly 300–600ms), then streams tokens as the LLM generates, assembles citations in stream, and runs a final validation.",
          "Because the blocking prefix still exists, it must be bounded. A retrieval timeout (around 3 seconds) guarantees the user gets an error event or a graceful no-information token instead of an indefinite spinner, and a generation timeout (30 seconds) caps the total stream duration.",
        ],
      },
      {
        heading: "Transport: Server-Sent Events",
        paragraphs: [
          "SSE is the standard choice over raw WebSockets for LLM streaming. It is unidirectional — server to client, which is all token streaming needs — runs over plain HTTP/2, auto-reconnects, and is trivially proxy- and load-balancer-friendly. Each token or small token group is sent as a data: event, and a terminal sentinel event signals completion.",
          "A production FastAPI SSE endpoint emits typed frames: a status event with the source count before the first token, token events for prose, citation events as sources are used, a done event carrying the consolidated citation list, and error events for retrieval timeout, generation timeout, or internal failure — never leaking a stack trace to the client.",
        ],
      },
      {
        heading: "Citations mid-stream and the client contract",
        paragraphs: [
          "The hard part of streaming RAG is citations: you cannot wait for the full answer to attach sources, but you also cannot cite a claim before it is written. The production pattern streams prose immediately, emits citation events incrementally as claim boundaries are detected (for example when a marker like [3] appears), and sends a final consolidated, deduplicated citation map at the end.",
          "The client mirrors this protocol: append tokens to a live buffer, render markdown incrementally while handling partial code fences and lists gracefully, show a 'retrieving sources' state before the first token, and swap in real citation chips as citation events arrive, reconciling them against the final map. Production deployments add heartbeats so proxies do not close idle connections, backpressure handling, a tracing span per stage, and graceful cancellation when the client disconnects.",
        ],
      },
    ],
    example: {
      title: "Worked example: the silent four seconds",
      scenario:
        "An enterprise assistant averages 4 seconds per answer and shows nothing until the full response lands. Users refresh mid-answer, doubling load, and satisfaction scores blame slowness even though total latency is acceptable.",
      analysis:
        "The latency budget shows the blocking prefix — retrieve plus re-rank at roughly 300–600ms — is small next to decode time; the problem is that decode is invisible until it finishes. Streaming the same work would put the first token on screen at about 800ms and turn the remaining seconds into visible progress instead of a hang.",
      decision:
        "Adopt the SSE pipeline: bound retrieval with a 3-second timeout, emit a status event with the source count, stream token frames with citation events at claim boundaries, close with a done frame carrying the deduplicated citation map, and render incrementally on the client behind a 'retrieving sources' state.",
    },
    productionChecklist: [
      "Bound the blocking prefix with a retrieval timeout (~3s) before the stream starts.",
      "Cap total stream duration with a generation timeout (~30s) and return partial results on expiry.",
      "Emit a status event before the first token so the client can show progress.",
      "Send citation events at claim boundaries plus a consolidated, deduplicated map at done.",
      "Add heartbeats, backpressure handling, per-stage tracing, and cancellation on disconnect; never leak stack traces.",
    ],
    commonMistakes: [
      "Buffering the entire answer before responding, sacrificing perceived latency for no reliability gain.",
      "Waiting for the full answer to attach citations instead of emitting citation events mid-stream.",
      "Reaching for raw WebSockets when unidirectional SSE over HTTP/2 is simpler and proxy-friendly.",
      "Letting retrieval block the stream indefinitely with no timeout or error event.",
    ],
    knowledgeChecks: [
      {
        id: "ch3-streaming-rag-architecture-kc-1",
        prompt: "A product owner proposes skipping streaming to simplify the first release, noting the average answer already completes in about four seconds. What is the strongest counter-argument?",
        options: [
          "Perceived latency dominates satisfaction: a 4-second answer that starts showing text at 800ms feels far faster than a faster answer that blocks until complete — streaming is an architectural requirement for interactive RAG",
          "Streaming reduces actual total latency by half, so skipping it doubles the infrastructure bill",
          "Streaming is required by HTTP/2, so a blocking design is not technically possible anyway",
        ],
        correct: 0,
        feedback: "The lesson's benchmark comparison: a 4-second answer that starts showing text at 800ms feels far faster than a 3-second answer delivered all at once — perceived latency dominates satisfaction, so streaming is an architectural requirement, not a nicety.",
      },
      {
        id: "ch3-streaming-rag-architecture-kc-2",
        prompt: "An enterprise assistant averages four seconds per answer and shows nothing until the full response lands, so users refresh mid-answer and double the load. Which change directly attacks the complaint?",
        options: [
          "Cut retrieval K so the total answer completes in two seconds instead of four",
          "Emit a status event, then stream tokens over SSE so the first token lands around 800ms and the remaining seconds look like progress instead of a hang",
          "Add a disclaimer telling users that answers may take up to five seconds to appear",
        ],
        correct: 1,
        feedback: "The latency budget showed the blocking prefix (retrieve plus re-rank, roughly 300–600ms) is small next to invisible decode time; streaming puts the first token on screen early and turns the wait into visible progress.",
      },
      {
        id: "ch3-streaming-rag-architecture-kc-3",
        prompt: "After enabling streaming, some requests hang forever with a spinner when the vector database gets slow, and a few error responses exposed raw stack traces to users. Which two controls were skipped?",
        options: [
          "The client buffer was too small, and the markdown renderer was misconfigured",
          "The generation timeout was set to 30 seconds, and the done sentinel was misspelled",
          "The retrieval timeout that bounds the blocking prefix (about 3 seconds, returning an error event), and the rule to never leak a stack trace — log server-side, send a generic error frame",
        ],
        correct: 2,
        feedback: "A production streaming endpoint bounds retrieval with a short timeout (about 3 seconds) so the stream cannot hang on a slow database, and failures are logged server-side while the client receives a sanitized error event instead of a stack trace.",
      },
      {
        id: "ch3-streaming-rag-architecture-kc-4",
        prompt: "A platform engineer argues the team should use raw WebSockets instead of SSE 'because real systems are bidirectional.' How do you defend SSE for token streaming?",
        options: [
          "Concede: bidirectional transport is strictly more capable, so WebSockets future-proof the design",
          "Token streaming only needs server-to-client: SSE is unidirectional, runs over plain HTTP/2, auto-reconnects, and is trivially proxy- and load-balancer-friendly — WebSockets add complexity for capability the product never uses",
          "SSE compresses tokens better than WebSockets, so the choice is purely about bandwidth cost",
        ],
        correct: 1,
        feedback: "SSE is the standard choice over raw WebSockets for LLM streaming for exactly these reasons: unidirectional server-to-client, plain HTTP/2, auto-reconnect, and proxy/load-balancer friendliness.",
      },
      {
        id: "ch3-streaming-rag-architecture-kc-5",
        prompt: "The streaming endpoint is code-complete and the team is planning pre-launch verification for an interactive RAG product. Which test plan covers the right production hardening areas?",
        options: [
          "Verify heartbeats keep proxies from closing idle connections, backpressure when clients read slowly, a tracing span per stage, graceful cancellation on client disconnect, and that the citation map reconciles at done",
          "Confirm the endpoint returns correct answers for fifty sample questions with streaming disabled",
          "Benchmark raw tokens per second against a non-streaming baseline and require at least parity",
        ],
        correct: 0,
        feedback: "A production streaming endpoint still needs hardening around the stream: heartbeats so proxies do not close idle connections, backpressure for slow-reading clients, a tracing span per stage, graceful cancellation on disconnect, and the done frame's deduplicated citation map for client reconciliation.",
      },
    ],
  },
};

export const chapter03Practice: CatalogPracticeUnit[] = [
  {
    id: "ch3-3-2-1",
    chapter: 3,
    chapterTitle: "RAG Architecture (Production-Level)",
    title: "Design a production RAG system for millions of users",
    pages: "39",
    route: "/practice/rag-architecture-production-level/design-a-production-rag-system-for-millions-of-users",
    competencies: ["end-to-end architecture", "state", "streaming", "caching", "failure isolation"],
    question:
      "Design a production-grade RAG system serving 5 million daily active users with sub-3-second end-to-end latency. Walk me through the architecture and justify the key choices.",
    options: [
      {
        text: "Draw the standard boxes — gateway, vector database, LLM, monitoring — and explain what each component does, noting that caching and autoscaling can be added later if traffic grows.",
        correct: false,
        feedback:
          "This is the junior pattern the interview rubric calls out: it draws boxes and lists components without capacity math, cost reasoning, or a fast-path/full-path split to hit the stated latency SLA.",
      },
      {
        text: "Layer the system — CDN plus API gateway (auth, ~500 req/min/user rate limiting), a query classifier routing to a cached fast path or the full RAG path, a Redis semantic cache at cosine ≥ 0.95, a replicated Weaviate/Qdrant cluster with HNSW hybrid search, an async GPU cross-encoder reranker (~50ms P99), vLLM serving with paged attention and continuous batching, post-processing (citations, PII scrubbing, guardrails), and traces/metrics/dashboards — then do the capacity math: 5M users × 10 queries/day ≈ 580 QPS average and ~3000 QPS peak, ≈1.16B tokens/day ≈ $5,800/day at GPT-4o pricing versus ≈ $1,200/day self-hosting LLaMA-3-70B on 20 A100s, so self-host on cost grounds.",
        correct: true,
        feedback:
          "Correct — this matches the staff-level answer: named layers plus the capacity math (QPS, tokens/day, dollars/day) and a cost-grounded self-host versus API decision. The ownership signal is reasoning about cost and capacity at scale, not listing components.",
      },
      {
        text: "Serve every query with the largest frontier API model and scale by purchasing more API quota; avoid self-hosting because operating GPUs is always more expensive than an API.",
        correct: false,
        feedback:
          "The capacity math shows the opposite at this scale — roughly $5,800/day on API pricing versus $1,200/day self-hosted, about 5x cheaper — and sending every query down the full path ignores the cache fast-path the latency SLA needs.",
      },
    ],
  },
  {
    id: "ch3-3-2-2",
    chapter: 3,
    chapterTitle: "RAG Architecture (Production-Level)",
    title: "How do you reduce latency in RAG?",
    pages: "39",
    route: "/practice/rag-architecture-production-level/how-do-you-reduce-latency-in-rag",
    competencies: ["end-to-end architecture", "state", "streaming", "caching", "failure isolation"],
    question:
      "How do you optimize end-to-end latency in a RAG pipeline? Name specific techniques and their impact.",
    options: [
      {
        text: "Break the call into a per-stage budget — embedding ~50ms, vector search ~30ms, re-ranking ~200ms, LLM prefill ~400ms, decode ~1500ms, post-processing ~30ms — then attack the dominant terms: a semantic cache eliminates whole LLM calls, prefix caching saves 30–40% of prefill, streaming improves perceived latency, re-ranking runs async overlapped with prompt preparation, simple queries route to a small fast model, and K drops (for example 20 to 5) when the re-ranker is strong.",
        correct: true,
        feedback:
          "Correct — measure first, then map each stage to its lever with expected impact. The senior pattern is a latency budget per stage, attacking decode and prefill (the dominant terms) and distinguishing real from perceived latency.",
      },
      {
        text: "Say you would add caching and streaming, the two standard levers, without a per-stage breakdown, since the details depend too much on the deployment to discuss in an interview.",
        correct: false,
        feedback:
          "That is the junior answer the interview rubric explicitly contrasts against: 'use caching and streaming' without a budget. Senior answers start from the per-stage breakdown and pick a specific technique for each dominant term.",
      },
      {
        text: "Start by shrinking vector-search time, since retrieval is usually the slowest stage, by raising the HNSW ef parameter and moving the index to GPU before touching anything else.",
        correct: false,
        feedback:
          "The per-stage breakdown shows vector search at ~30ms while decode (~1500ms) and prefill (~400ms) dominate the budget. Optimizing the smallest term first — and raising ef, which trades recall headroom — attacks the wrong stage.",
      },
    ],
  },
  {
    id: "ch3-3-2-3",
    chapter: 3,
    chapterTitle: "RAG Architecture (Production-Level)",
    title: "How do you cache results effectively?",
    pages: "40",
    route: "/practice/rag-architecture-production-level/how-do-you-cache-results-effectively",
    competencies: ["end-to-end architecture", "state", "streaming", "caching", "failure isolation"],
    question:
      "Design a caching strategy for a RAG system. What should and should not be cached?",
    options: [
      {
        text: "Cache final answers keyed on the exact query string under one global TTL; if users rephrase a question, treat it as a brand-new query and pay the full pipeline cost again.",
        correct: false,
        feedback:
          "Exact-match keys miss the point of the semantic cache — the cache embeds the incoming query and hits on cosine similarity ≥ 0.95 — and one global TTL ignores freshness differences across news, docs, and static content.",
      },
      {
        text: "Cache everything, including user-specific and time-sensitive queries, because a higher hit rate always lowers cost; invalidate only when the model version changes.",
        correct: false,
        feedback:
          "This is the incident pattern to avoid: personalized, time-sensitive, and PII-containing queries must never be cached, and a naive cache is exactly how private or stale answers leak to the wrong user.",
      },
      {
        text: "Layer the caches: a Redis semantic cache (embed the query, hit on cosine ≥ 0.95, TTL set by knowledge freshness — about 1h for news, 24h for docs, 7d for static content), KV/prefix caching for static system prompts (vLLM prefix caching or Radix attention), and an embedding cache for chunks at ingestion plus an LRU cache of frequent query embeddings — and never cache personalized, time-sensitive, or PII queries, with an explicit invalidation story.",
        correct: true,
        feedback:
          "Correct — the senior answer separates cache layers with per-layer TTLs and critically specifies what must never be cached (personalized, time-sensitive, PII). The ownership signal is the invalidation and safety story.",
      },
    ],
  },
  {
    id: "ch3-3-2-4",
    chapter: 3,
    chapterTitle: "RAG Architecture (Production-Level)",
    title: "How do you handle failures in retrieval or LLM?",
    pages: "41",
    route: "/practice/rag-architecture-production-level/how-do-you-handle-failures-in-retrieval-or-llm",
    competencies: ["end-to-end architecture", "state", "streaming", "caching", "failure isolation"],
    question:
      "How would you design a fault-tolerant RAG system? What happens when retrieval returns nothing useful or the LLM fails?",
    options: [
      {
        text: "Wrap the whole pipeline in one try/except that logs the exception and returns HTTP 500 so the client knows to retry; keeping the error logic simple and centralized is the cleanest design.",
        correct: false,
        feedback:
          "The rubric explicitly names this the junior answer — 'add a try/except' — because it has no per-failure-type degradation, no circuit breaker, no fallback chain, and nothing to observe when things break.",
      },
      {
        text: "Design graceful degradation per failure type: if the top-k max similarity score is below ~0.6, trigger a web-search fallback; on empty results, return a graceful 'I don't have information about this' with a suggestion to rephrase; put a circuit breaker on the database (after 3 failures in 10s, serve cached responses for 60s); chain LLM fallbacks (primary GPT-4o/Claude-class model → a smaller cheaper model → semantic-cache lookup → error with retry guidance) under a 10-second hard timeout that returns the partial stream if generation already started; and emit a structured log event with query hash, failure type, fallback used, and latency for every failure.",
        correct: true,
        feedback:
          "Correct — a layered fallback strategy per failure type, hard timeouts with partial streaming, and structured failure events is exactly the senior signal the rubric describes, versus a single catch block.",
      },
      {
        text: "Retry the failed call immediately with exponential backoff until it succeeds; transient errors dominate in practice, so persistence beats maintaining fallback paths.",
        correct: false,
        feedback:
          "Unbounded retries against a struggling dependency create retry storms. The fault-tolerant design bounds behavior instead: circuit breaker on the database, hard timeouts, and a degraded-path chain with observability.",
      },
    ],
  },
  {
    id: "ch3-3-2-5",
    chapter: 3,
    chapterTitle: "RAG Architecture (Production-Level)",
    title: "How would you design RAG for real-time vs batch use cases?",
    pages: "41",
    route: "/practice/rag-architecture-production-level/how-would-you-design-rag-for-real-time-vs-batch-use-cases",
    competencies: ["end-to-end architecture", "state", "streaming", "caching", "failure isolation"],
    question:
      "Compare designing a RAG system for real-time interactive use versus batch document processing.",
    options: [
      {
        text: "Contrast the two across concrete axes — latency target (<3 seconds vs minutes–hours), throughput (500–5000 QPS vs 10K–1M docs/run), index (pre-built and hot vs rebuilt per run), LLM (streaming small model vs larger non-streaming model), caching (critical vs not needed), parallelism (request-level vs document-level), and cost focus (latency × cost vs cost per document) — and for batch, use document loaders plus a batch embedding API with Spark/Ray parallelism writing to the vector DB, scheduled at off-peak hours for cost savings.",
        correct: true,
        feedback:
          "Correct — the senior answer contrasts the two designs across concrete axes and picks different architectures accordingly, including the off-peak batch ingestion pattern with document-level parallelism.",
      },
      {
        text: "They are the same system at different speeds: run the interactive architecture with more replicas for batch, since the real-time design is strictly the more demanding one.",
        correct: false,
        feedback:
          "The opposite is true — these are different systems with different optimization targets. Scaling the interactive design for batch wastes money on caching, streaming, and hot indexes that batch does not need.",
      },
      {
        text: "Optimize batch for the same sub-3-second latency SLA as interactive use, keeping streaming and the semantic cache enabled so nightly runs finish faster.",
        correct: false,
        feedback:
          "Batch has no human waiting on a token stream: the batch design drops streaming and caching, targets minutes-to-hours, and optimizes cost per document instead of latency × cost.",
      },
    ],
  },
];
