import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter09Module: LearningModule = {
  id: "chapter-9-agentic-rag",
  title: "Agentic RAG",
  description: "Systems in which the model plans, selects tools, iterates, and verifies results instead of performing single-pass retrieval. Learn when an agentic loop is justified over simple RAG, and how to bound, route, and secure it in production.",
  duration: "4 lessons",
  lessons: [
    {
      id: "ch9-planner-executor-verifier",
      title: "Planner – Executor – Verifier",
      prompt: "Structure an agentic loop with explicit roles",
      question: "A research assistant must find a customer's latest invoice, compute refund eligibility from it, and confirm the result before answering. Which architecture gives controlled retries?",
      options: [
        "A planner LLM decomposes the goal into steps, an executor runs each step against tools, a verifier checks output quality and decides to continue or retry, and a memory store accumulates prior-step results.",
        "One retrieve-and-generate call with a larger context window, so the model sees the invoice and the policy at the same time.",
        "Let the model issue tool calls freely until it produces an answer, with no separate verification stage.",
      ],
      correct: 0,
      feedback: "Strong choice. Separating planner, executor, verifier, and memory lets intermediate results drive the next step, and the verifier turns retry into a controlled decision instead of an accident.",
      explanation: "In the agentic loop, the planner decomposes the goal, the executor runs each step against tools such as search, SQL, APIs, or code, the verifier checks output quality and decides to continue or retry, and memory accumulates results from prior steps. A single-pass pipeline cannot use one retrieved fact to go find the next, and unverified tool calls have no governed retry path.",
      takeaways: [
        "Planner decomposes the goal; executor runs each step against tools; verifier decides continue or retry.",
        "Memory accumulates results from prior steps so later steps can use earlier facts.",
        "The loop is plan, execute, verify, retry until done — and it must be bounded, never free-running.",
      ],
      model: ["Plan", "Execute tools", "Verify and retry"],
      source: { chapter: 9, sections: ["9.1.1"], pages: "64" },
    },
    {
      id: "ch9-langgraph-and-crewai",
      title: "LangGraph and CrewAI",
      prompt: "Pick an orchestration framework by control requirements",
      question: "A compliance-heavy workflow needs auditable, conditional control flow between LLM calls and tools, with a verifier able to send work back for retry. Which framework fits best, and why?",
      options: [
        "CrewAI, because giving agents personas and goals produces the most capable behavior for any workflow.",
        "LangGraph, because its explicit state machine — nodes as LLM calls or tools with conditional edges — is built for controlled, auditable workflows.",
        "Neither; plain sequential prompt chaining is always enough once the prompts are well written.",
      ],
      correct: 1,
      feedback: "Strong choice. When auditability and conditional control are the requirement, an explicit state machine beats role-based emergence; CrewAI trades that structural control away.",
      explanation: "LangGraph models the workflow as an explicit state machine whose nodes are LLM calls or tools and whose edges are conditional, which suits controlled, auditable workflows. CrewAI is role-based multi-agent: agents carry personas and goals with less structural control, which fits exploratory or creative work better than regulated flows.",
      takeaways: [
        "LangGraph: explicit state machine — nodes are LLM calls or tools, edges are conditional.",
        "CrewAI: role-based multi-agent with personas and goals, but less structural control.",
        "Choose by control needs: controlled and auditable versus exploratory and creative.",
      ],
      model: ["Control requirements", "State machine or roles", "Auditability check"],
      source: { chapter: 9, sections: ["9.1.2"], pages: "64" },
    },
    {
      id: "ch9-tool-calling-in-agents",
      title: "Tool Calling in Agents",
      prompt: "Harden tool interfaces so failures stay data",
      question: "An agent's SQL tool sometimes exceeds its 5-second budget and its knowledge-base search can return nothing. How should those tools behave inside the agent loop?",
      options: [
        "Let exceptions propagate so the whole agent run crashes fast and the caller sees a 500.",
        "Return empty success responses so the agent keeps going without being distracted by failures.",
        "Return typed error strings such as \"ERROR: query timed out\" — tool errors are data the agent can reason over, not crashes.",
      ],
      correct: 2,
      feedback: "Strong choice. Typed error returns let the planner retry, reroute, or report the failure honestly; crashing the run or faking success both destroy recoverability.",
      explanation: "The guarded-agent listing makes each tool validate input, enforce a timeout, and return error strings — \"tool errors are data, not crashes.\" The SQL tool also rejects write and DDL keywords because production runs on a least-privilege read-only role, and the whole run sits under a recursion_limit hard cap with a graceful top-level fallback answer.",
      takeaways: [
        "Tool errors are data: return typed error strings instead of crashing the agent run.",
        "Guard every tool: input validation, timeouts, and read-only enforcement.",
        "Production runs add per-tool authorization, tenant-scoped filters, wall-clock budgets, and full trace capture.",
      ],
      model: ["Validate input", "Execute with timeout", "Return result or typed error"],
      source: { chapter: 9, sections: ["9.1.3"], pages: "64-65" },
    },
    {
      id: "ch9-structured-and-relational-rag-text-to-sql-vector-hybrid",
      title: "Structured and Relational RAG: Text-to-SQL + Vector Hybrid",
      prompt: "Route each query to the right knowledge regime",
      question: "Users ask both \"total revenue in Q3\" and \"summarize our refund policy\" against the same product. What retrieval architecture answers both correctly?",
      options: [
        "Route structured questions to Text-to-SQL and unstructured questions to vector search, running both paths and fusing when a question needs each.",
        "Put every source into one vector store, because embeddings handle all text uniformly.",
        "Send every question to a SQL generator so the system has one consistent query path.",
      ],
      correct: 0,
      feedback: "Strong choice. Exact aggregates and prose concepts live in different regimes; a router that recognizes which regime a query belongs to is what makes one product answer both.",
      explanation: "Embeddings cannot compute a SUM, enforce a JOIN, or guarantee an exact count, and a SQL generator cannot answer a conceptual question. The design routes structured questions to Text-to-SQL and unstructured questions to vector search — with an LLM classifier, schema-aware heuristics, or an agentic verifier doing the routing — and fuses both paths for hybrid questions.",
      takeaways: [
        "Vector search finds passages that mean roughly this; SQL computes exact, aggregated, filtered answers.",
        "An analytics question sent to a vector store yields fluent nonsense; a conceptual question sent to SQL yields a syntax error.",
        "Hybrid is the common real case: SQL finds the records, vector search fetches the prose, the generator fuses.",
      ],
      model: ["Classify the query", "Run the routed path", "Fuse when hybrid"],
      source: { chapter: 9, sections: ["9.1.4"], pages: "66-67" },
    },
  ],
};

export const chapter09CourseContent: Record<string, LessonCourseContent> = {
  "ch9-planner-executor-verifier": {
    objectives: [
      "Name the four roles in an agentic loop: planner, executor, verifier, and memory.",
      "Explain how intermediate results enable dynamic control flow that single-pass RAG cannot express.",
      "Bound the loop so verification gates every retry instead of allowing unbounded iteration.",
    ],
    sections: [
      {
        heading: "The four roles in the loop",
        paragraphs: [
          "An agentic system replaces one retrieve-then-generate pass with a loop of explicit roles. The planner is an LLM that receives the goal and decomposes it into a task plan. The executor is the tool layer that carries out each step — search, SQL, API calls, or code execution.",
          "The verifier is a second LLM role that checks output quality and decides whether to continue or retry. Memory is a store that accumulates results from prior steps, so step three can use what step one discovered. None of these roles is optional once the task is multi-step: remove the verifier and retries become uncontrolled; remove memory and intermediate facts evaporate between steps.",
        ],
      },
      {
        heading: "Why the loop adds power — and cost",
        paragraphs: [
          "The coordination power is real: the system can decide what to do next based on intermediate results, which is exactly what a fixed pipeline cannot do. A simple RAG pipeline retrieves once and generates once; it cannot notice that the first answer implies a second lookup.",
          "The same loop also increases latency, cost, and the failure surface. Every iteration is another model call and another tool call, and every new branch is a new way to be wrong. The interview-worthy position is not that agents are fashionable, but knowing when simple RAG is enough and when the agentic loop is justified.",
        ],
      },
      {
        heading: "Memory and intermediate state",
        paragraphs: [
          "Memory is what turns a sequence of tool calls into multi-hop reasoning: first find X, then use X to find Y. A refund assistant works only because the invoice found in step one is still available in memory when step two computes eligibility.",
          "Treat that state as explicit and inspectable rather than as an ever-growing prompt. Accumulated results are the audit trail of the run — they let the verifier check each step's output and let operators reconstruct why the agent took a path after the fact.",
        ],
      },
      {
        heading: "Bounding and verifying the loop",
        paragraphs: [
          "The canonical figure of the agentic loop — plan, execute tools, verify, retry until done — carries one qualifier in parentheses: bounded. The verifier is the control point that enforces it, routing each outcome to done or retry rather than letting the planner loop back on itself indefinitely.",
          "In production the verifier's authority is backed by hard limits: a recursion cap on iterations, a token budget, and a wall-clock budget across the whole run, plus monitoring that alerts on runs exceeding roughly fifteen steps so looping behavior gets reviewed instead of discovered by accident. Verification without limits is hope; limits without verification are blind stops. The design needs both.",
        ],
      },
    ],
    example: {
      title: "Worked example: refund eligibility assistant",
      scenario: "A support agent must locate a customer's latest invoice, compute whether the purchase falls inside the refund window, and confirm the computed answer against policy before replying to the customer.",
      analysis: "The planner decomposes the goal into three steps: find the invoice, compute eligibility, check the policy. The executor runs search and code tools for each step. Memory holds the invoice record so the calculation step can use it, and the verifier checks both the intermediate tool outputs and the final answer before anything reaches the customer.",
      decision: "Implement planner – executor – verifier with an explicit memory store, cap iterations with a recursion limit, and let the verifier alone decide retry versus finish.",
    },
    productionChecklist: [
      "Define the planner's task-plan format before wiring any tools.",
      "Give the verifier only two exits: finish or retry.",
      "Persist intermediate results in explicit memory, not in prompt history alone.",
      "Cap iterations, tokens, and wall-clock time for every run.",
      "Trace every step so any run can be replayed and audited.",
    ],
    commonMistakes: [
      "Running an unbounded loop with no verifier gate on retries.",
      "Hiding intermediate state instead of storing results explicitly in memory.",
      "Treating tool outputs as trusted instructions rather than data.",
      "Adding an agentic loop where a fixed acyclic pipeline would have done the job.",
    ],
    knowledgeChecks: [
      {
        id: "ch9-planner-executor-verifier-kc-1",
        prompt: "A support workflow must first find a customer's invoice, then use that invoice to compute refund eligibility, then confirm the result before replying. Which architecture fits this task?",
        options: [
          "A planner decomposes the goal into steps, an executor runs each step against tools, a verifier checks outputs and decides retry or finish, and memory carries results between steps.",
          "A single retrieve-and-generate pipeline with a larger context window, so the invoice and the refund policy are visible to the model at the same time.",
          "A free-running agent that issues tool calls until an answer appears, without any separate verification role.",
        ],
        correct: 0,
        feedback: "Correct. The agentic loop is defined as planner, executor, verifier, and memory; multi-hop work where later steps depend on earlier results is exactly what single-pass retrieval cannot express.",
      },
      {
        id: "ch9-planner-executor-verifier-kc-2",
        prompt: "In the refund worked example, the eligibility computation in step two needs the invoice record that the search step produced in step one. Which agentic-loop role makes that handoff possible?",
        options: [
          "The verifier, because it re-checks every tool output and therefore stores each result for later steps to consume.",
          "The planner, because it rewrites the task plan after every step so the next step embeds everything discovered so far.",
          "The memory store, because it accumulates results from prior steps so the eligibility step can read the invoice the search step found.",
        ],
        correct: 2,
        feedback: "Correct. Memory (Store) is the role that accumulates results from prior steps; the verifier only judges output quality and the planner only decomposes the goal.",
      },
      {
        id: "ch9-planner-executor-verifier-kc-3",
        prompt: "Production incident: an agent repeats the same failing lookup for dozens of iterations until the recursion cap finally kills the run with no answer. Which missing control best explains this failure?",
        options: [
          "A larger context window, because the agent ran out of room to notice that the lookup had already failed several times.",
          "A verifier gate that routes each step outcome to finish or retry, so a repeatedly failing step is stopped by a decision instead of by the hard cap.",
          "Additional tools, because one failing lookup means the agent simply did not have enough ways to answer the question.",
        ],
        correct: 1,
        feedback: "Correct. The verifier owns the continue-or-retry decision; the hard cap is a backstop, not the control, so a repeatedly failing step must be stopped by that verification gate rather than by the limit.",
      },
      {
        id: "ch9-planner-executor-verifier-kc-4",
        prompt: "A reviewer challenges your design: the FAQ flow is single-hop and deterministic, so the proposed agentic loop is overkill. Which defense of using simple RAG there is strongest?",
        options: [
          "Concede with the chapter's decision rule: a pipeline writable as a fixed directed graph with no cycles belongs on simple RAG, because an agentic loop adds latency, cost, and failure modes without buying dynamic control.",
          "Defend the agent anyway: agents are strictly more capable, so even a deterministic single-hop flow benefits from planning, verification, and memory.",
          "Propose a compromise: keep the agentic loop but remove the verifier, since deterministic tasks do not need output checks.",
        ],
        correct: 0,
        feedback: "Correct. The decision rule is that a fixed acyclic pipeline means simple RAG, and agents add latency, cost, and failure modes; senior answers default to the simpler system.",
      },
      {
        id: "ch9-planner-executor-verifier-kc-5",
        prompt: "Before launching the refund eligibility assistant from this lesson's worked example, which evidence package best demonstrates that the agentic loop itself is ready for production traffic?",
        options: [
          "A recorded demo of several happy-path conversations showing the agent reaching correct answers without any visible errors.",
          "A benchmark comparing the agent's average answer quality against a simple RAG baseline on a public dataset.",
          "Proof the loop is bounded — recursion cap, token budget, and wall-clock budget per run — plus full step traces for replay and monitoring that alerts on runs exceeding about fifteen steps.",
        ],
        correct: 2,
        feedback: "Correct. Runs are bounded with recursion_limit, production adds wall-clock budgets and trace capture, and monitoring alerts on runs exceeding 15 steps. Demos and averages hide loop behavior.",
      },
    ],
  },
  "ch9-langgraph-and-crewai": {
    objectives: [
      "Contrast LangGraph's explicit state machine with CrewAI's role-based multi-agent model.",
      "Match framework choice to the control and auditability requirements of the workflow.",
      "Explain why conditional edges and hard recursion limits matter for regulated, retryable workflows.",
    ],
    sections: [
      {
        heading: "LangGraph: explicit state machines",
        paragraphs: [
          "LangGraph represents the workflow as an explicit state machine. Nodes are LLM calls or tools; edges are conditional. The graph you draw is the control flow the system executes, which makes behavior predictable enough to review before it runs.",
          "Conditional edges are where the verifier lives: after a checking node, the edge routes to END or back to retry. That makes LangGraph the fit for controlled, auditable workflows — the ones where a regulator, a customer, or an incident review will ask exactly why the system took each step.",
        ],
      },
      {
        heading: "CrewAI: role-based multi-agent",
        paragraphs: [
          "CrewAI takes the opposite stance: agents are defined by personas and goals, and collaboration emerges from roles rather than from a declared graph. That gives less structural control over exactly what happens next.",
          "The trade is deliberate. For exploratory or creative workflows — research digests, brainstorming, drafting — rigid control flow buys little and role-based flexibility is productive. The mistake is importing that looseness into a workflow whose steps must be justified one by one.",
        ],
      },
      {
        heading: "Choosing by control requirements",
        paragraphs: [
          "The chapter's framing applies directly to framework choice: agents add coordination power while also increasing latency, cost, and failure modes, and the framework determines how much of that behavior you can see and constrain. An explicit state machine maximizes constraint; role-based crews maximize emergent behavior.",
          "Ask the compliance question first. If every run must be reconstructable — which node ran, which edge fired, why a retry happened — choose the state machine. If the output is exploratory and the path does not need defending, role-based agents are a reasonable convenience.",
        ],
      },
      {
        heading: "Operational implications",
        paragraphs: [
          "Framework choice does not remove the need for run-level guards: the chapter's guarded agent run sets an explicit recursion limit of 25 as a hard cap against infinite loops, and wraps the invocation so a failed run degrades to a graceful answer instead of an exception.",
          "Auditability also has to be wired in: production adds full trace capture — the listing names LangSmith — so runs can be replayed. An explicit graph makes replay meaningful, because every node and edge in the trace corresponds to a declared part of the design.",
        ],
      },
    ],
    example: {
      title: "Worked example: audited claims processing",
      scenario: "An insurer automates claim triage. Every automated decision must be reproducible for regulators, and any claim that fails automated verification must be routed back for one bounded re-review before escalating to a human.",
      analysis: "The control flow is fixed and regulated: conditional edges can express \"verify, then END or retry\" precisely, and the explicit graph doubles as the audit artifact. Role-based personas would add narrative flexibility the workflow neither needs nor can defend.",
      decision: "Implement the workflow as a LangGraph state machine with conditional verifier edges, a hard recursion limit, and full trace capture for replay; reserve role-based frameworks for the exploratory analysis work that sits outside the regulated path.",
    },
    productionChecklist: [
      "Map the workflow as an explicit state machine before writing agent code.",
      "Make verifier edges conditional: route to END or retry only.",
      "Set a hard recursion limit on every graph run.",
      "Capture full traces so any run can be replayed for audit.",
      "Reserve role-based multi-agent setups for exploratory, low-regulation tasks.",
    ],
    commonMistakes: [
      "Choosing a role-based framework for a workflow that must be auditable step by step.",
      "Letting agents free-run with no conditional stop edges from the verifier.",
      "Assuming framework defaults include loop caps — set the recursion limit explicitly.",
      "Standing up multiple role-playing agents where one state machine would suffice.",
    ],
    knowledgeChecks: [
      {
        id: "ch9-langgraph-and-crewai-kc-1",
        prompt: "A compliance-heavy workflow requires auditable, conditional control flow between LLM calls and tools, where a verifier can send failed work back for one retry. Which framework choice fits best?",
        options: [
          "CrewAI, because assigning the workflow to agents with clear personas and goals produces the most capable behavior.",
          "LangGraph, because its explicit state machine — nodes as LLM calls or tools with conditional edges — is built for controlled, auditable workflows.",
          "Neither framework; sequential prompt chaining with careful wording is sufficient for any auditable workflow.",
        ],
        correct: 1,
        feedback: "Correct. LangGraph's explicit state machine with conditional edges is best for controlled, auditable workflows, while CrewAI's role-based model offers less structural control.",
      },
      {
        id: "ch9-langgraph-and-crewai-kc-2",
        prompt: "In the audited claims worked example, a claim that fails automated verification must get exactly one bounded re-review before escalating to a human. How should that control flow be implemented?",
        options: [
          "As a conditional edge from the verifier node that routes to a single retry node or to END, so the graph itself encodes the bounded re-review and every run is reconstructable.",
          "As a second agent persona instructed to double-check claims whenever it feels the first review was uncertain.",
          "As a longer system prompt reminding the model to review its own work carefully before answering.",
        ],
        correct: 0,
        feedback: "Correct. LangGraph edges are conditional — the natural encoding of verify-then-END-or-retry — and the explicit graph doubles as the audit artifact regulators need.",
      },
      {
        id: "ch9-langgraph-and-crewai-kc-3",
        prompt: "An incident review of a role-based multi-agent deployment in a regulated workflow cannot reconstruct why the system took each step. What is the most defensible root-cause statement?",
        options: [
          "The model was too small to explain its reasoning, so a larger model should be deployed before the next incident.",
          "The team logged too little text; increasing log verbosity alone would have made the run fully reconstructable.",
          "The framework traded structural control away: with personas and goals instead of a declared graph, there is no explicit state machine to audit step by step.",
        ],
        correct: 2,
        feedback: "Correct. CrewAI agents have personas and goals with less structural control; without declared nodes and conditional edges there is no graph to reconstruct during review.",
      },
      {
        id: "ch9-langgraph-and-crewai-kc-4",
        prompt: "For an exploratory research-digest workflow, a teammate proposes mandating a fully explicit state machine. Which defense of a role-based framework like CrewAI is strongest?",
        options: [
          "CrewAI should always be preferred because role-based agents are newer and therefore more capable than state machines.",
          "The chapter assigns CrewAI to exploratory and creative workflows: when the path need not be defended step by step, role-based flexibility is productive and rigid control flow buys little.",
          "Framework choice never matters for quality, so the team should pick whichever one the most engineers already know.",
        ],
        correct: 1,
        feedback: "Correct. CrewAI is positioned as best for exploratory/creative workflows; the trade is deliberate — less structural control is acceptable when runs do not need step-level justification.",
      },
      {
        id: "ch9-langgraph-and-crewai-kc-5",
        prompt: "A team is preparing an agentic workflow for launch and wants the run-level controls the chapter requires regardless of framework. Which checklist matches?",
        options: [
          "A hard recursion limit on every run, full trace capture such as LangSmith for replay, and a graceful fallback answer when the run fails — wired in explicitly rather than assumed from defaults.",
          "A review of the system prompt by two senior engineers, since careful wording is the primary control on agent behavior.",
          "A single end-to-end accuracy number on the evaluation set, because framework defaults already cover loop safety.",
        ],
        correct: 0,
        feedback: "Correct. The guarded run sets recursion_limit: 25 as a hard cap, wraps the invocation with a graceful fallback, and names full trace capture (LangSmith) for replay as production additions.",
      },
    ],
  },
  "ch9-tool-calling-in-agents": {
    objectives: [
      "Design tool wrappers that return errors as data instead of crashing the agent run.",
      "Enforce read-only and timeout guards inside each tool, not just in the prompt.",
      "List the production hardening an agent run needs beyond the happy path.",
    ],
    sections: [
      {
        heading: "Tools as guarded interfaces",
        paragraphs: [
          "The chapter's guarded LangGraph example shows the pattern. The knowledge-base tool rejects an empty query before doing work, calls the retriever with a 3-second timeout, returns \"No results.\" when nothing matches, and on exception logs the failure and returns \"ERROR: knowledge base unavailable.\" The principle is stated outright: tool errors are data, not crashes.",
          "This matters because the planner is an LLM reasoning over text. A typed error string is something it can read, react to, and explain; an unhandled exception ends the run and gives the user nothing. Returning errors as data keeps recovery inside the loop where it belongs.",
        ],
      },
      {
        heading: "Enforcing least privilege inside the tool",
        paragraphs: [
          "The SQL tool in the listing enforces its own contract: a keyword check rejects INSERT, UPDATE, DELETE, DROP, ALTER, and TRUNCATE, and any violation comes back as \"ERROR: only read-only queries are permitted.\" Execution runs under a 5-second timeout, and a timeout returns its own error string rather than hanging the run.",
          "The code comments are explicit that the regex is a guard, not the security boundary: production uses a least-privilege, read-only database role underneath. Defense lives at the tool and the database layer, so a clever prompt alone cannot turn a read path into a write path.",
        ],
      },
      {
        heading: "Bounding the whole run",
        paragraphs: [
          "Tool-level guards are not enough; the run itself needs bounds. The example invokes the agent with recursion_limit set to 25 — annotated as the hard cap that prevents infinite loops — so a planner that keeps choosing more tool calls is forcibly terminated.",
          "The top level also catches failure of the whole run and substitutes a graceful answer: \"I couldn't complete that request.\" The same philosophy as tool errors applies one level up: a failed run is a controlled outcome with an honest message, not a stack trace.",
        ],
      },
      {
        heading: "What production adds",
        paragraphs: [
          "The listing closes with the gap between demo and production. Named additions: per-tool authorization checks, tenant-scoped filters injected into every tool, a wall-clock budget across the whole run, loop and oscillation detection, and full trace capture with LangSmith for replay.",
          "Read that list as a checklist of independent controls. Authorization decides whether the agent may call the tool at all; tenant filters decide which rows it can see; the wall-clock budget stops slow-but-legal loops; oscillation detection catches repetition that a recursion cap alone misses; traces make all of it reviewable after the fact.",
        ],
      },
    ],
    example: {
      title: "Worked example: sales analytics agent",
      scenario: "A user asks the agent, \"What were total sales last quarter?\" The agent has a knowledge-base search tool and a SQL tool, and the analytics database occasionally runs longer than five seconds.",
      analysis: "The SQL tool must reject anything that is not read-only, time out at five seconds, and return \"ERROR: query timed out\" so the planner can retry, fall back to the knowledge base, or state the failure. Without the recursion cap, a flaky database turns into a retry storm; without typed errors, a slow query turns into a crashed run.",
      decision: "Wrap every tool with input validation, timeouts, and typed error returns; run the agent under a recursion limit with a graceful top-level fallback; add per-tool authorization, tenant-scoped filters, and trace capture before launch.",
    },
    productionChecklist: [
      "Validate tool arguments before execution and return typed error strings.",
      "Set per-tool timeouts and surface timeout errors as data.",
      "Reject write and DDL operations in read-only tools, backed by a least-privilege DB role.",
      "Cap every run with a recursion limit and a wall-clock budget.",
      "Inject tenant-scoped filters into every tool call and capture full traces.",
    ],
    commonMistakes: [
      "Letting tool exceptions propagate and crash the entire agent run.",
      "Returning empty success instead of an explicit, typed error.",
      "Relying on regex alone instead of a least-privilege, read-only database role.",
      "Running with no recursion cap, wall-clock budget, or trace capture.",
    ],
    knowledgeChecks: [
      {
        id: "ch9-tool-calling-in-agents-kc-1",
        prompt: "Inside an agent loop, the SQL tool exceeds its five-second budget on a slow analytics query. What should the tool return to the agent at that moment?",
        options: [
          "Nothing until the query finishes, because returning early would give the planner incomplete information to reason with.",
          "An unhandled TimeoutError exception, so the whole agent run crashes fast and the caller receives a clear error page.",
          "A typed error string such as \"ERROR: query timed out\", because tool errors are data the planner can reason over, not crashes.",
        ],
        correct: 2,
        feedback: "Correct. The SQL tool returns exactly that string on TimeoutError, and the principle is stated outright: tool errors are data, not crashes — the planner can retry, reroute, or report honestly.",
      },
      {
        id: "ch9-tool-calling-in-agents-kc-2",
        prompt: "In this lesson's worked example — the user asks \"What were total sales last quarter?\" and the database is intermittently slow — how does the guarded design keep one slow query from becoming a retry storm?",
        options: [
          "The SQL tool waits indefinitely so the planner always gets a complete result before deciding what to do next.",
          "The SQL tool times out at five seconds and returns an error string, while the run-level recursion limit of twenty-five hard-caps how many times the agent can loop.",
          "The agent retries the identical query in a tight loop until the database responds, then caches that result for all users.",
        ],
        correct: 1,
        feedback: "Correct. The guarded design combines a five-second SQL timeout with a recursion limit of 25, annotated as the hard cap preventing infinite loops; waiting forever and tight retrying are the failure modes it guards.",
      },
      {
        id: "ch9-tool-calling-in-agents-kc-3",
        prompt: "An agent run ends in an exposed stack trace because the knowledge-base retriever was unavailable and the tool let the exception propagate. Which stated principle did this implementation violate?",
        options: [
          "Tool errors are data, not crashes: the tool should have logged the failure and returned \"ERROR: knowledge base unavailable\" so the planner could react and the user got an honest answer.",
          "Tools must be stateless: the failure happened because the retriever kept connection state between agent runs.",
          "Prompts must anticipate outages: the system prompt should have warned the model that the knowledge base might be down.",
        ],
        correct: 0,
        feedback: "Correct. The search tool catches the exception, logs it, and returns \"ERROR: knowledge base unavailable\" — the listing annotates this as tool errors being data, not crashes.",
      },
      {
        id: "ch9-tool-calling-in-agents-kc-4",
        prompt: "A reviewer argues the SQL tool's regex keyword filter is sufficient protection and a read-only database role is redundant. Which defense of the layered design matches the chapter?",
        options: [
          "Agree with the reviewer: the keyword filter blocks every write keyword the chapter lists, so the database role adds no real protection.",
          "Argue the opposite extreme: remove the SQL tool entirely, since no SQL access can ever be made safe enough for an agent.",
          "The listing itself says production uses a least-privilege, read-only DB role — the regex is a guard, not the security boundary, so defense lives at both the tool and the database layer.",
        ],
        correct: 2,
        feedback: "Correct. The listing comments that production uses a least-privilege read-only DB role, and a real SQL parser or allowlist — not just regex — backs the read-only guard.",
      },
      {
        id: "ch9-tool-calling-in-agents-kc-5",
        prompt: "Which pre-launch hardening set does the guarded listing explicitly name as what a production system would add beyond the demo code?",
        options: [
          "A larger model for the planner, a longer system prompt, and a public benchmark score comparing agent accuracy against simple RAG.",
          "Per-tool authorization checks, tenant-scoped filters injected into every tool, a wall-clock budget across the whole run, loop and oscillation detection, and full trace capture for replay.",
          "Happy-path load testing, a style review of tool docstrings, and a sign-off that the demo answered the sample question correctly.",
        ],
        correct: 1,
        feedback: "Correct. The listing's closing comment names exactly these five additions; model upgrades, prompt tweaks, and happy-path demos are not the hardening the chapter asks for.",
      },
    ],
  },
  "ch9-structured-and-relational-rag-text-to-sql-vector-hybrid": {
    objectives: [
      "Explain why aggregates and exact records require SQL while concepts require vector search.",
      "Compare LLM-classifier, schema-aware, and agentic routing strategies by cost and robustness.",
      "Apply guards — read-only SQL, row limits, safe fallback — to both routed paths.",
    ],
    sections: [
      {
        heading: "Two regimes of knowledge",
        paragraphs: [
          "Not all knowledge lives in prose. Numbers, aggregates, and precise records — total revenue in Q3, how many open tickets customer X has — live in relational databases, and vector search is the wrong tool for them: embeddings cannot compute a SUM, enforce a JOIN, or guarantee an exact count.",
          "A senior design therefore splits the path: structured questions go to Text-to-SQL, unstructured questions go to vector search, and some questions need both fused. This is not an optimization layered on RAG; it is recognizing that the corpus was never one kind of thing.",
        ],
      },
      {
        heading: "Why the split matters",
        paragraphs: [
          "Dense retrieval is good at \"find me passages that mean roughly this.\" SQL is good at \"compute this exact, aggregated, filtered answer.\" The failure modes of crossing them are symmetric and ugly: an analytics question sent to a vector store yields fluent nonsense, and a conceptual question sent to a SQL generator yields a syntax error.",
          "The router's job is to recognize which regime a query belongs to before any retrieval happens. Everything downstream — correctness, latency, and the user's trust — depends on that one classification being right most of the time and failing safely when it is not.",
        ],
      },
      {
        heading: "Routing strategies, cheapest to most robust",
        paragraphs: [
          "The chapter lists three strategies in order of cost. An LLM or classifier router uses a small, fast model to label the query STRUCTURED, UNSTRUCTURED, or HYBRID — cheap, flexible, and a good default. Schema-aware routing biases toward SQL when the query references known table or column names or carries numeric and aggregation intent: \"how many,\" \"average,\" \"total,\" a date range.",
          "Agentic routing is the most expensive and most robust: the agent calls both tools and a verifier decides which result actually answers the question — highest quality, highest cost. The hybrid case is the common real one: \"Summarize the contract terms for our top-5 customers by revenue\" needs SQL to find the top five by revenue and vector search to retrieve each contract's terms before the generator fuses them.",
        ],
      },
      {
        heading: "Guards on the routed paths",
        paragraphs: [
          "The router listing builds safety into the decision itself: if classification fails for any reason, the route falls back to UNSTRUCTURED — the safe default that never emits unbounded SQL. On the SQL path, generated queries pass a read-only guard that rejects writes and DDL, and any query missing a LIMIT gets one appended, capped at 1000 rows.",
          "The production additions named in the listing complete the picture: schema-grounded Text-to-SQL with few-shot examples and column descriptions, a SQL validation and repair loop, query-cost estimation before execution, per-tenant row-level filters injected into the WHERE clause, and result caching keyed on the normalized query and schema version. Routing decides the path; these guards decide whether the path is safe to walk.",
        ],
      },
    ],
    example: {
      title: "Worked example: top-customers contract summary",
      scenario: "A sales-operations user asks, \"Summarize the contract terms for our top-5 customers by revenue.\" Neither a pure vector store nor a single SQL query can answer it alone.",
      analysis: "The question is genuinely hybrid: SQL must compute the top five customers by revenue, and vector search must retrieve each customer's contract terms, with the generator fusing the two. A router that forces every query down one path either misses the ranking or misses the prose.",
      decision: "Classify queries with a fast LLM router that falls back to unstructured on failure, guard the SQL path with read-only checks and an enforced row LIMIT, run both paths for hybrid questions, and add schema-grounded Text-to-SQL plus per-tenant row filters before production.",
    },
    productionChecklist: [
      "Classify every query as structured, unstructured, or hybrid before retrieval.",
      "Default to the safest route — unstructured — on classifier failure.",
      "Reject non-read-only SQL and enforce a maximum row LIMIT on every query.",
      "Inject per-tenant row-level filters into the WHERE clause server-side.",
      "Cache results keyed on the normalized query and schema version.",
    ],
    commonMistakes: [
      "Sending analytics questions to a vector store and accepting fluent nonsense.",
      "Forcing conceptual questions through a SQL generator.",
      "Emitting unbounded SQL with no row LIMIT.",
      "Trusting a regex alone instead of a real SQL parser or allowlist and a least-privilege role.",
    ],
    knowledgeChecks: [
      {
        id: "ch9-structured-and-relational-rag-text-to-sql-vector-hybrid-kc-1",
        prompt: "A user asks, \"How many open tickets does customer X have?\" Which retrieval path should the system choose, and what makes the alternative wrong?",
        options: [
          "Text-to-SQL, because exact counts live in the relational database and embeddings cannot compute a SUM, enforce a JOIN, or guarantee an exact count.",
          "Vector search, because ticket records are text and dense retrieval finds passages that mean roughly what the user asked.",
          "Either path, because with good chunking the two regimes converge on the same answer for counting questions.",
        ],
        correct: 0,
        feedback: "Correct. Numbers, aggregates, and precise records live in relational databases, and vector search is the wrong tool — embeddings cannot compute a SUM, enforce a JOIN, or guarantee an exact count.",
      },
      {
        id: "ch9-structured-and-relational-rag-text-to-sql-vector-hybrid-kc-2",
        prompt: "In this lesson's worked example — \"Summarize the contract terms for our top-5 customers by revenue\" — what execution plan answers the question correctly?",
        options: [
          "SQL only: join the revenue table to the contract text table and return the five longest matching rows to the generator.",
          "Vector search only: embed the question and retrieve the contract passages whose meaning is closest to top revenue.",
          "Hybrid: SQL finds the top five customers by revenue, vector search retrieves each contract's terms, and the generator fuses the structured ranking with the unstructured prose.",
        ],
        correct: 2,
        feedback: "Correct. The chapter walks through exactly this split: SQL finds the top-5 by revenue, vector search retrieves each contract's terms, and the generator fuses them into one answer.",
      },
      {
        id: "ch9-structured-and-relational-rag-text-to-sql-vector-hybrid-kc-3",
        prompt: "A user asks for last quarter's total revenue and the system replies with a fluent paragraph of invented numbers. Which diagnosis matches the chapter's named failure mode?",
        options: [
          "The embedding model is too small: a larger embedder would have encoded the revenue figures accurately enough.",
          "The analytics question was routed to the vector store, which the chapter says yields fluent nonsense; the router should have sent it to Text-to-SQL.",
          "The chunks were too large: smaller chunks would have preserved the exact revenue numbers for retrieval.",
        ],
        correct: 1,
        feedback: "Correct. The chapter names this failure directly: sending an analytics question to a vector store yields fluent nonsense, just as a conceptual question sent to SQL yields a syntax error.",
      },
      {
        id: "ch9-structured-and-relational-rag-text-to-sql-vector-hybrid-kc-4",
        prompt: "A teammate proposes making agentic routing — call both tools, let a verifier pick the winning result — the default for every query. Which pushback matches the chapter's cost ordering?",
        options: [
          "Agentic routing is simply wrong in all cases and should never appear anywhere in the design.",
          "Schema-aware routing should be the only strategy, because keyword heuristics are always more accurate than any learned classifier.",
          "Agentic routing is highest quality but highest cost; the chapter's good default is the cheap, flexible LLM classifier router, with schema-aware signals biasing toward SQL on aggregation intent.",
        ],
        correct: 2,
        feedback: "Correct. The strategies are ordered cheapest to most robust: the LLM/classifier router is the good default, schema-aware routing biases on names and aggregation intent, agentic routing costs the most.",
      },
      {
        id: "ch9-structured-and-relational-rag-text-to-sql-vector-hybrid-kc-5",
        prompt: "Before the routed SQL path ships, which guard set does the chapter require so generated queries are safe to execute against production data?",
        options: [
          "A read-only guard rejecting writes and DDL, an enforced row LIMIT when one is missing, fallback to the unstructured route on classifier failure, plus production additions: schema-grounded Text-to-SQL, a validation and repair loop, query-cost estimation, per-tenant row-level filters, and caching keyed on normalized query and schema version.",
          "A code review of the router prompt and a manual spot check of a few generated queries against a staging database.",
          "Unbounded SQL execution behind the regex filter, because the classification step already prevents dangerous queries from being generated.",
        ],
        correct: 0,
        feedback: "Correct. The router design builds these in: fallback to UNSTRUCTURED as the safe default, a guard rejecting non-read-only statements, a LIMIT appended up to 1000 rows, and the listing's named production additions.",
      },
    ],
  },
};

export const chapter09Practice: CatalogPracticeUnit[] = [
  {
    id: "ch9-9-2-1",
    chapter: 9,
    chapterTitle: "Agentic RAG",
    title: "When do you use agentic RAG vs simple RAG?",
    pages: "68",
    route: "/practice/agentic-rag/when-do-you-use-agentic-rag-vs-simple-rag",
    competencies: ["agent loops", "tools", "routing", "termination", "memory", "agent security"],
    question: "In a senior system-design interview you are asked: \"How do you decide when a task requires an agentic approach vs a simple RAG pipeline?\" Which answer earns the strongest rating?",
    options: [
      {
        text: "Default to an agent for every task because agents are strictly more capable, and fall back to simple RAG only when the model's context window is too small for the corpus.",
        correct: false,
        feedback: "This inverts the ownership signal: the senior position defaults to the simpler system. Capability is not the criterion — the decision rule is fixed pipeline versus dynamic decisions on intermediate results.",
      },
      {
        text: "Use simple RAG whenever latency matters at all, and reserve agents exclusively for tasks that need code execution.",
        correct: false,
        feedback: "Too narrow on both sides. Latency under about 2 seconds end-to-end is one signal among several, and the agentic triggers also include multi-hop reasoning, orchestrating multiple data sources, open-ended planning, and self-correction.",
      },
      {
        text: "Apply the decision rule: if the pipeline can be written as a fixed directed graph with no cycles, use simple RAG; choose an agent only when the next step depends on intermediate results — multi-hop reasoning, orchestrating vector DB plus SQL plus API, tool use, open-ended planning, or self-correction — and weigh the added latency, cost, and failure modes.",
        correct: true,
        feedback: "Correct. This is the crisp decision rule from the chapter, plus the senior habit of naming what the agentic loop costs and defaulting to the simpler system unless dynamic control is truly needed.",
      },
    ],
  },
  {
    id: "ch9-9-2-2",
    chapter: 9,
    chapterTitle: "Agentic RAG",
    title: "How do you avoid infinite loops in agents?",
    pages: "68",
    route: "/practice/agentic-rag/how-do-you-avoid-infinite-loops-in-agents",
    competencies: ["agent loops", "tools", "routing", "termination", "memory", "agent security"],
    question: "Interview prompt: \"Agents can get stuck in retry loops. How do you prevent this in production?\" Which response is strongest?",
    options: [
      {
        text: "Layer multiple independent stop conditions: hard limits on iterations (recursion_limit around 25), total token budget, and a 30-second wall-clock timeout that returns the partial result marked incomplete; hash each (action, arguments) tuple and terminate on an exact repeat, detect oscillation between two states, require a structured termination response with answer, confidence, steps taken, and reason to stop, restrict the verifier to END-or-retry edges, and alert on runs exceeding about 15 steps.",
        correct: true,
        feedback: "Correct. The differentiator is multiple independent stop conditions — hard limits, loop and oscillation detection, structured termination, and monitoring — rather than any single counter.",
      },
      {
        text: "Set a maximum iteration count; a single counter is sufficient because any loop will eventually hit it and the agent can simply stop there.",
        correct: false,
        feedback: "This is exactly the junior answer the chapter calls out. One counter misses oscillation below the cap, burns tokens and wall time before it trips, and gives no structured reason for stopping.",
      },
      {
        text: "Improve the system prompt to tell the agent not to repeat itself, and lower the temperature so behavior stays deterministic enough to avoid loops.",
        correct: false,
        feedback: "Prompt wording and temperature are not stop conditions. The chapter's defenses are architectural — limits, repetition detection, and verifier routing — because instruction-following is precisely what fails in a loop.",
      },
    ],
  },
  {
    id: "ch9-9-2-3",
    chapter: 9,
    chapterTitle: "Agentic RAG",
    title: "How do you evaluate agent performance?",
    pages: "69",
    route: "/practice/agentic-rag/how-do-you-evaluate-agent-performance",
    competencies: ["agent loops", "tools", "routing", "termination", "memory", "agent security"],
    question: "An interviewer asks: \"How do you measure whether your AI agent is working well? What metrics do you use?\" What does the strongest answer include?",
    options: [
      {
        text: "Track final-answer accuracy on a held-out set; if the answers are right, the agent is working well, and the rest is implementation detail.",
        correct: false,
        feedback: "The chapter flags this as the junior answer. Correct answers can still come with runaway steps, redundant tool calls, high token cost, and rising loop or fallback rates that a single accuracy number hides.",
      },
      {
        text: "Measure three dimensions — outcome (task completion rate, answer correctness against ground truth via LLM-judge or human review, tool-call accuracy), efficiency (steps to completion, token cost per task, redundant tool calls), and reliability (hallucination rate, loop/timeout rate, fallback rate) — and record full traces, e.g. with LangSmith, to replay runs, compare versions, and run eval functions on historical traces.",
        correct: true,
        feedback: "Correct. This matches the chapter's three metric families with specific measures, and it treats efficiency and reliability as first-class alongside correctness, backed by trace replay.",
      },
      {
        text: "Monitor production latency and error rates like any other service, and sample a few conversations each quarter for a qualitative read on quality.",
        correct: false,
        feedback: "Generic service monitoring misses the agent-specific signals: task completion, steps and tokens per task, redundant calls, loop and fallback rates, and the trace-level evidence needed to debug a run.",
      },
    ],
  },
  {
    id: "ch9-9-2-4",
    chapter: 9,
    chapterTitle: "Agentic RAG",
    title: "How do you orchestrate multiple tools?",
    pages: "69",
    route: "/practice/agentic-rag/how-do-you-orchestrate-multiple-tools",
    competencies: ["agent loops", "tools", "routing", "termination", "memory", "agent security"],
    question: "Interview scenario: \"Your agent has 10 tools available. How do you help it choose the right tool efficiently?\" Choose the best answer.",
    options: [
      {
        text: "Write a detailed description for every tool and put all ten in the system prompt, so the model has complete information when it chooses.",
        correct: false,
        feedback: "Descriptions alone are the junior answer. The chapter's premise is that with many tools the context window fills with tool descriptions and selection errors increase — more static text does not fix that.",
      },
      {
        text: "Let the agent try tools in a fixed order until one returns a result, then cache that order for all future requests to keep behavior stable.",
        correct: false,
        feedback: "A fixed probe order cannot adapt to query intent, wastes calls on irrelevant tools, and skips the validation-and-retry step the chapter requires when a tool returns the wrong shape.",
      },
      {
        text: "Attack the scaling problem directly: embed tool descriptions and dynamically retrieve only the 3–5 most relevant tools into context, add a lightweight routing classifier such as a fine-tuned BERT that maps intent to a tool category before the agent loop, use hierarchical agents whose sub-agents each own a tool subset, write crisp docstrings with when-to-use and when-not-to-use examples, and validate each tool result's type, retrying with corrected arguments when the format is wrong.",
        correct: true,
        feedback: "Correct. This combines the chapter's scaling mechanisms — tool retrieval, a routing layer, hierarchical agents — with clear descriptions and result validation with retry, which is exactly the senior combination.",
      },
    ],
  },
  {
    id: "ch9-9-3-5",
    chapter: 9,
    chapterTitle: "Agentic RAG",
    title: "How do you secure an agent with code-execution and write tools?",
    pages: "71",
    route: "/practice/agentic-rag/how-do-you-secure-an-agent-with-code-execution-and-write-tools",
    competencies: ["agent loops", "tools", "routing", "termination", "memory", "agent security"],
    question: "Staff-level interview question: \"Your agent can execute code and call write APIs. A retrieved document may contain a prompt-injection payload. How do you secure it?\" Which answer demonstrates staff-grade thinking?",
    options: [
      {
        text: "Assume the retrieved document is the attacker and design so a successful injection still cannot cause harm: least-privilege tools authorized per call against the acting user's permissions, human confirmation for high-impact writes like payments, deletes, and external email, code executed in an ephemeral network-isolated sandbox with no mounted credentials, egress allowlists, and CPU/memory/time caps, retrieved content delimited as data — never instructions — with schema-validated tool arguments, every tool call with arguments and result in an immutable audit log with input scanning for exfiltration patterns, and red-team injection tests as a launch gate.",
        correct: true,
        feedback: "Correct. This is the chapter's staff answer: containment, sandboxing, trust separation, and total observability, on the stated assumption that prompt defenses will fail — treating injection as an RCE-class risk defended by architecture.",
      },
      {
        text: "Add a strong guardrail system prompt instructing the agent to ignore injected commands, and scan the final output for policy violations before returning anything to the user.",
        correct: false,
        feedback: "This is precisely the junior answer the chapter names. It hopes wording prevents injection, and output-only scanning misses exfiltration, which appears in the arguments the agent passes to a tool, not just the final text.",
      },
      {
        text: "Remove code execution and write tools entirely, because any agent that can act on the world cannot be made safe.",
        correct: false,
        feedback: "Over-refusal is not the chapter's position. The staff answer keeps the capability and contains the blast radius with least-privilege authorization, sandboxing, human-in-the-loop for high-impact actions, and full auditing.",
      },
    ],
  },
];
