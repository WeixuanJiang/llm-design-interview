import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter18Module: LearningModule = {
  id: "chapter-18-multi-agent-system-design",
  title: "Multi-Agent System Design",
  description:
    "Systems where multiple LLM agents collaborate through planner/worker hierarchies, specialist crews, and debate. The core tension: multi-agent architectures add capability and modularity but multiply latency, cost, and failure surface — so you must know when a single well-tooled agent is the better answer.",
  duration: "4 lessons",
  lessons: [
    {
      id: "ch18-orchestration-topologies",
      title: "Orchestration Topologies",
      prompt: "Pick the coordination pattern that fits the task structure",
      question:
        "A research-and-report feature has a goal that splits cleanly into independent search, extraction, analysis, and writing sub-goals, and wall-clock latency matters. Which orchestration topology is the best fit?",
      options: [
        "A single ReAct-style agent given every tool, looping until it finishes the whole report",
        "A hierarchical orchestrator–worker system that decomposes the goal, delegates sub-tasks to specialists, and synthesizes",
        "A debate ensemble where several full agents argue over the report and a judge picks the winner",
      ],
      correct: 1,
      feedback:
        "Strong choice. Decomposable sub-goals with independent, parallelizable work is exactly the case for an orchestrator–worker hierarchy — the planner delegates and synthesizes while specialists run concurrently.",
      explanation:
        "There are five topologies: single agent with tools (the right default), hierarchical orchestrator–worker (best for decomposable tasks with clear sub-goals), sequential pipeline, debate/ensemble, and blackboard shared-state. Debate buys reasoning quality at N× token cost, and a single agent is limited on complex decomposition, so hierarchy wins here.",
      takeaways: [
        "Default to one well-tooled agent until it provably fails on the task structure.",
        "Hierarchical orchestration fits decomposable tasks with clear, parallelizable sub-goals.",
        "Debate/ensemble raises reasoning quality but multiplies token cost roughly N-fold.",
      ],
      model: ["Name the task structure", "Match a topology to it", "Price the cost and failure surface"],
      source: { chapter: 18, sections: ["18.1.1"], pages: "123" },
    },
    {
      id: "ch18-communication-shared-memory",
      title: "Communication Protocols and Shared Memory",
      prompt: "Design how agents talk and what they share",
      question:
        "Two designs are on the table for a five-agent pipeline: free-form prose hand-offs between agents, or typed, schema-validated messages over a scoped shared workspace. Why does the second design win in production?",
      options: [
        "It does not — prose is what LLMs produce natively, so validation only adds friction",
        "Typed messages are only needed when agents run on different model vendors",
        "A malformed hand-off is caught at the boundary instead of silently propagating downstream",
      ],
      correct: 2,
      feedback:
        "Exactly. The rule is to keep inter-agent messages typed and schema-validated rather than free-form prose, so a malformed hand-off fails loudly instead of corrupting every agent that reads it.",
      explanation:
        "Agents coordinate through explicit message passing (auditable, but volume can explode) or a shared blackboard (less chatter, but needs concurrency control). Either way, shared memory must be scoped (task-level vs persistent), versioned, and access-controlled, because one agent corrupting shared state poisons all downstream agents.",
      takeaways: [
        "Message passing is auditable; a blackboard reduces chatter but needs concurrency control.",
        "Type and schema-validate every inter-agent message — never hand off free-form prose.",
        "Scope, version, and access-control shared memory; corrupted state poisons downstream agents.",
      ],
      model: ["Choose messages vs blackboard", "Type and validate the contract", "Scope and guard shared state"],
      source: { chapter: 18, sections: ["18.1.2"], pages: "123" },
    },
    {
      id: "ch18-conflict-resolution-termination",
      title: "Conflict Resolution and Termination",
      prompt: "Decide disagreements explicitly and guarantee the system stops",
      question:
        "In production, two specialist agents begin ping-ponging — each repeatedly asks the other to redo its work — and token spend climbs without bound. What should the design have included up front?",
      options: [
        "Per-agent and global iteration caps, a shared token/wall-clock budget, and loop detection",
        "A larger context window so the two agents can see more of each other's reasoning",
        "A stronger system prompt telling the agents to cooperate politely",
      ],
      correct: 0,
      feedback:
        "Right. Multi-agent systems inherit and amplify the single-agent termination problem: every agent and the system as a whole need iteration caps, a global budget, and loop detection, or a pair of agents can ping-pong indefinitely.",
      explanation:
        "When agents disagree, resolve explicitly — a judge/aggregator agent, majority vote, confidence-weighted selection, or escalation to a human. Termination is a systems property: caps and budgets enforced at the orchestrator, not politeness in a prompt, are what stop runaway loops.",
      takeaways: [
        "Resolve disagreements explicitly: judge, majority vote, confidence weighting, or human escalation.",
        "Every agent and the whole system need iteration caps and a global token/wall-clock budget.",
        "Add loop detection — unbounded agent ping-pong is a design failure, not a prompt failure.",
      ],
      model: ["Detect the conflict", "Resolve it explicitly", "Enforce hard termination limits"],
      source: { chapter: 18, sections: ["18.1.3"], pages: "124" },
    },
    {
      id: "ch18-cost-latency-control",
      title: "Cost and Latency Control",
      prompt: "Keep emergent multi-agent cost inside a hard budget",
      question:
        "A naive multi-agent rollout is costing roughly an order of magnitude more than a single call. Which set of controls is recommended?",
      options: [
        "Move every agent to the largest available model so each sub-task finishes in fewer turns",
        "Parallelize independent workers, route easy sub-tasks to small models, cap agents/turns, cache sub-task results, and short-circuit to a single agent when possible",
        "Remove the orchestrator so agents negotiate directly and save its token overhead",
      ],
      correct: 1,
      feedback:
        "Correct. A naive multi-agent system can cost 5–50× a single call, and exactly these controls are prescribed: parallelism, model right-sizing, caps, caching, and short-circuiting requests a single agent can answer.",
      explanation:
        "Running independent workers in parallel rather than sequentially cuts wall-clock latency without cutting capability. Routing easy sub-tasks to small models and reserving large models for hard reasoning attacks token cost, while caps, caching, and short-circuit gating stop the crew from being convened at all when one agent would do.",
      takeaways: [
        "A naive multi-agent system can cost 5–50× a single model call.",
        "Parallelize independent sub-tasks; serialize only real dependencies.",
        "Right-size models per sub-task, cache sub-task results, and short-circuit to one agent when possible.",
      ],
      model: ["Attribute cost per agent and turn", "Apply parallelism, right-sizing, caps, caching", "Short-circuit work a single agent can do"],
      source: { chapter: 18, sections: ["18.1.4"], pages: "124" },
    },
  ],
};

export const chapter18CourseContent: Record<string, LessonCourseContent> = {
  "ch18-orchestration-topologies": {
    objectives: [
      "Name the five orchestration topologies and the task structure each one fits.",
      "Explain why a single well-tooled agent is the correct default until it provably fails.",
      "Match a real product requirement to a topology by weighing capability against latency, cost, and failure surface.",
    ],
    sections: [
      {
        heading: "The default: one agent, many tools",
        paragraphs: [
          "The simplest multi-agent design is no multi-agent design: a single ReAct-style loop equipped with many tools. It is cheap, simple, and debuggable, and it is explicitly the right default until it provably fails. Most apparent 'multi-agent wins' come from better tools and prompts, not from more agents.",
          "The single agent's known limit is complex decomposition — when a goal contains several distinct sub-goals that each want their own tools, prompts, and context, one context window handles the structure poorly. That failure, observed and measured, is the trigger for considering a richer topology rather than a starting assumption.",
        ],
      },
      {
        heading: "Hierarchical orchestrator–worker",
        paragraphs: [
          "In a hierarchical design a planner decomposes the goal and delegates sub-tasks to specialist workers, then synthesizes their outputs. It is the best fit for decomposable tasks with clear sub-goals, and because independent sub-tasks can run in parallel it also delivers real wall-clock speedup.",
          "The structural risk is that the planner is a single point of failure: a bad decomposition propagates to every worker. That risk is managed with typed worker outputs, explicit conflict resolution with hard termination limits, and disciplined cost control — the subjects of the later lessons in this chapter.",
        ],
      },
      {
        heading: "Sequential pipelines and debate ensembles",
        paragraphs: [
          "A sequential pipeline chains agents in a fixed order — research, draft, critique, revise is the canonical example. It is predictable, auditable, and easy to debug, but it cannot adapt dynamically: the chain runs the same steps regardless of what intermediate results show.",
          "A debate or ensemble topology has multiple agents argue or vote, with a judge aggregating. It improves quality on reasoning-heavy tasks, but the cost is roughly N× the tokens, so it is reserved for cases where the quality gain is demonstrably worth the multiplier.",
        ],
      },
      {
        heading: "Blackboard / shared-state coordination",
        paragraphs: [
          "In a blackboard design agents read and write a common workspace, coordinating indirectly through state rather than direct messages. This reduces message chatter between agents but introduces a concurrency problem: the shared workspace needs the same discipline as shared mutable memory in a concurrent program.",
          "Choosing among the five topologies is a structured trade-off. The comparison boils down to strength versus cost/risk: single agent is cheap and debuggable but limited on decomposition; hierarchy parallelizes but centralizes failure in the planner; pipelines are auditable but rigid; debate buys quality at N× cost. State the task structure first, then let it pick the topology.",
        ],
      },
    ],
    example: {
      title: "Worked example: choosing a topology for a research-and-report feature",
      scenario:
        "You are scoping a feature that turns a user's question into a cited research report. The work visibly splits into search, extraction, analysis, and writing, and the team is torn between one powerful agent with all tools, a fixed research→draft→critique→revise pipeline, and an orchestrator with specialist workers.",
      analysis:
        "The task decomposes into clear sub-goals, which rules out relying on the single-agent default once the context strain is observed. The sub-tasks are partly independent — several searches and extractions can run concurrently — so a purely sequential pipeline would give up a real latency win. Debate would raise cost roughly N× without a decomposition need driving it.",
      decision:
        "Choose a hierarchical orchestrator–worker topology: a planner builds the task graph, fans independent sub-tasks out to specialist workers in parallel, and synthesizes their typed outputs. Keep the sequential pipeline shape only inside stages that truly depend on each other, and revisit the single-agent design if measurement later shows the hierarchy is not earning its cost.",
    },
    productionChecklist: [
      "Document why the single-agent default fails for this task before adopting any multi-agent topology.",
      "Write down the chosen topology and the task structure (decomposability, dependencies) that justifies it.",
      "Identify the single point of failure in the design (e.g. the planner) and how its mistakes are contained.",
      "Estimate the token-cost multiplier of the topology (e.g. N× for debate) and confirm it fits the budget.",
      "Verify the topology supports the auditability the product needs — pipelines are the most auditable, blackboards the least.",
    ],
    commonMistakes: [
      "Adopting multi-agent because it feels sophisticated rather than because the task decomposes.",
      "Choosing a debate ensemble for a task whose bottleneck is latency or cost, not reasoning quality.",
      "Using a rigid sequential pipeline when sub-tasks are independent and could run in parallel.",
      "Ignoring that the planner in a hierarchy is a single point of failure whose errors reach every worker.",
    ],
    knowledgeChecks: [
      {
        id: "ch18-orchestration-topologies-kc-1",
        prompt:
          "A fraud-triage assistant follows one continuous reasoning chain under a strict latency budget, and auditors must replay every decision it makes. Which orchestration topology should you choose first?",
        options: [
          "A single agent with good tools in one ReAct-style loop",
          "A debate ensemble with a judge aggregating three arguing agents",
          "A blackboard where several agents coordinate through shared state",
        ],
        correct: 0,
        feedback:
          "The lesson's default is one well-tooled agent in a ReAct-style loop — cheap, simple, and debuggable — and a single reasoning chain has no decomposition that would justify multiplying agents, latency, and failure surface.",
      },
      {
        id: "ch18-orchestration-topologies-kc-2",
        prompt:
          "In the worked example, the research-and-report feature splits into search, extraction, analysis, and writing, and several of those sub-tasks are independent. Why does a hierarchy beat a fixed sequential pipeline here?",
        options: [
          "Because a pipeline cannot validate its intermediate outputs at all",
          "Because independent sub-tasks can fan out in parallel, giving a real wall-clock latency win a fixed chain forfeits",
          "Because a hierarchy removes the planner as a failure point entirely",
        ],
        correct: 1,
        feedback:
          "Hierarchical orchestration is best for decomposable tasks with clear sub-goals; a sequential pipeline is predictable but cannot run independent steps concurrently.",
      },
      {
        id: "ch18-orchestration-topologies-kc-3",
        prompt:
          "Every specialist worker in a hierarchical crew produced confident but useless output, and inspection shows the planner broke the goal into the wrong sub-tasks from the start. What does this incident illustrate?",
        options: [
          "That workers need larger context windows to recover from vague instructions",
          "That the blackboard workspace was missing concurrency control",
          "That the planner is a single point of failure whose bad decomposition reaches every worker",
        ],
        correct: 2,
        feedback:
          "The topology table names the planner as the hierarchy's single point of failure; a wrong decomposition propagates to all workers, which is exactly the observed pattern.",
      },
      {
        id: "ch18-orchestration-topologies-kc-4",
        prompt:
          "A teammate proposes a debate ensemble for a routine extraction feature because it sounds more rigorous. How do you defend rejecting debate in favor of a simpler topology?",
        options: [
          "Debate multiplies token cost roughly N-fold and is only earned on reasoning-heavy tasks where the quality gain demonstrably justifies the multiplier",
          "Debate is always inferior because judges cannot aggregate votes reliably",
          "Debate is fine, but only if every agent shares one context window",
        ],
        correct: 0,
        feedback:
          "The trade-off table says debate improves reasoning quality at N× token cost; without a reasoning-heavy task and a measured quality gain, the multiplier is unjustified spend.",
      },
      {
        id: "ch18-orchestration-topologies-kc-5",
        prompt:
          "Before your team adopts any multi-agent topology for a new feature, what evidence does this lesson's default-first rule require you to document in the design review?",
        options: [
          "A benchmark showing the largest available model passed an offline reasoning suite",
          "Observed, measured failure of the single well-tooled agent on the task structure, plus the chosen topology's estimated cost multiplier",
          "A proof that at least three specialist roles can be named for the task",
        ],
        correct: 1,
        feedback:
          "The single agent is the right default until it provably fails, so adoption requires that evidence plus pricing the topology's cost, such as the N× debate multiplier.",
      },
    ],
  },
  "ch18-communication-shared-memory": {
    objectives: [
      "Contrast explicit message passing with a shared blackboard and the trade-offs of each.",
      "Specify typed, schema-validated inter-agent messages instead of free-form prose hand-offs.",
      "Design shared memory that is scoped, versioned, and access-controlled so one agent cannot poison the rest.",
    ],
    sections: [
      {
        heading: "Message passing versus shared blackboard",
        paragraphs: [
          "Agents coordinate through messages, shared state, or both. Explicit message passing sends typed messages between agents: it is auditable — you can replay exactly who said what — but message volume can explode as the agent count grows.",
          "A shared blackboard is a structured workspace that all agents read and write. It produces less chatter, because coordination happens indirectly through state, but it needs concurrency control: without discipline on who may write what, the workspace becomes the system's corruption point.",
        ],
      },
      {
        heading: "Typed, schema-validated hand-offs",
        paragraphs: [
          "Whichever channel you choose, the rule is that inter-agent messages stay typed and schema-validated, not free-form prose. A malformed hand-off should be caught at validation time rather than silently propagated to every agent that consumes it.",
          "In practice this means each agent returns a structured result — status, payload, and the fields the orchestrator needs to reason about partial failure — and the schema is enforced at the boundary. Validation turns a class of subtle, silent failures into loud, local ones.",
        ],
      },
      {
        heading: "Scoping shared memory",
        paragraphs: [
          "Shared memory should be scoped: task-level scratch state lives and dies with the run, while only deliberately promoted facts go to persistent memory. Conflating the two lets transient, low-confidence intermediate results leak into long-term state that future runs trust.",
          "Scoping also bounds blast radius. A worker that corrupts task-level state damages one run; a worker that corrupts persistent memory damages every downstream run that reads it, which is why promotion to persistent memory must be a deliberate, validated act.",
        ],
      },
      {
        heading: "Versioning and access control",
        paragraphs: [
          "Shared state should be versioned and access-controlled, because one agent corrupting shared state poisons all downstream agents. Versioning gives you an audit trail of who wrote what and the ability to roll back a bad write.",
          "Access control applies least privilege to agents: a worker that only needs the research notes should not be able to overwrite the final draft. Treat the shared workspace with the same rigor as a shared database, not as a free-for-all dictionary any agent can clobber.",
        ],
      },
    ],
    example: {
      title: "Worked example: hardening a five-agent pipeline's hand-offs",
      scenario:
        "A five-agent content pipeline passes free-form prose between stages, and twice this month a garbled extraction summary silently flowed into the final report. The team is deciding between tightening prompts or changing the communication protocol itself.",
      analysis:
        "Prompt tightening leaves the failure mode intact: prose hand-offs cannot be validated, so malformed output propagates silently — exactly the pattern to guard against. The failures are boundary failures, not reasoning failures, so the fix belongs in the protocol layer.",
      decision:
        "Move to typed, schema-validated messages for every hand-off, each carrying status, payload, and provenance, and reject malformed writes at the boundary. Put shared artifacts in a scoped, versioned workspace with least-privilege write access, so a bad extraction is caught on write and can be rolled back rather than read as truth downstream.",
    },
    productionChecklist: [
      "Define a typed schema for every inter-agent message and validate it at the boundary.",
      "Decide explicitly between message passing and a blackboard, and record why.",
      "Scope shared memory: task-level scratch state versus deliberately promoted persistent facts.",
      "Version the shared workspace so writes are auditable and reversible.",
      "Apply least-privilege access: each agent can write only the state its role requires.",
    ],
    commonMistakes: [
      "Letting agents hand off free-form prose that cannot be validated or replayed.",
      "Allowing every agent write access to all shared state, so one bad write poisons downstream agents.",
      "Mixing task-level scratch state into persistent memory without a validation gate.",
      "Choosing a blackboard for less chatter without adding the concurrency control it requires.",
    ],
    knowledgeChecks: [
      {
        id: "ch18-communication-shared-memory-kc-1",
        prompt:
          "A compliance-sensitive document pipeline must be able to replay exactly which agent sent what during every production run for audit. Which communication design fits this requirement best?",
        options: [
          "A shared blackboard, because coordination through state produces less chatter",
          "Free-form prose hand-offs, because they preserve each agent's natural phrasing",
          "Explicit typed message passing between agents, because it is auditable and replayable",
        ],
        correct: 2,
        feedback:
          "Explicit message passing is auditable — you can replay who said what — while a blackboard trades that directness for less chatter and needs concurrency control.",
      },
      {
        id: "ch18-communication-shared-memory-kc-2",
        prompt:
          "In the worked example, a garbled extraction summary written as prose silently flowed downstream into the final report twice in one month. Which protocol-layer change stops this class of failure?",
        options: [
          "Type and schema-validate every hand-off so a malformed message is rejected at the boundary instead of propagating",
          "Tighten each agent's prompt so it writes more careful prose summaries",
          "Add a second extraction agent so the two can vote on the summary",
        ],
        correct: 0,
        feedback:
          "The rule is typed, schema-validated messages rather than free-form prose, so a malformed hand-off is caught rather than silently propagated; prompt tweaks leave the failure mode intact.",
      },
      {
        id: "ch18-communication-shared-memory-kc-3",
        prompt:
          "A research worker that only needed to read shared notes was also able to overwrite the final draft, and one bad write corrupted the deliverable. Which missing discipline does this incident point to?",
        options: [
          "Missing debate rounds, since a judge would have caught the overwrite",
          "Missing least-privilege access control — the worker should never have held write access to the final draft",
          "Missing message volume, since more chatter would have surfaced the error",
        ],
        correct: 1,
        feedback:
          "Shared memory must be access-controlled: a worker that only needs the research notes should not be able to overwrite the final draft — least privilege applied to agents.",
      },
      {
        id: "ch18-communication-shared-memory-kc-4",
        prompt:
          "Your crew suffers from exploding message volume as agent count grows, and you propose a shared blackboard. How do you defend that choice while acknowledging its cost?",
        options: [
          "A blackboard eliminates the need for any validation because agents self-police the workspace",
          "A blackboard is strictly safer than message passing, so no additional controls are warranted",
          "A blackboard reduces chatter by coordinating through state, but it must ship with concurrency control, scoping, versioning, and access control",
        ],
        correct: 2,
        feedback:
          "A blackboard produces less chatter but needs concurrency control, and shared memory must be scoped, versioned, and access-controlled — that discipline is the price of the choice.",
      },
      {
        id: "ch18-communication-shared-memory-kc-5",
        prompt:
          "During a pre-launch review of the crew's shared workspace, which set of checks verifies the shared-state discipline from this lesson before you ship?",
        options: [
          "Confirm every agent can write every key so no agent is ever blocked waiting for permissions",
          "Confirm the workspace is scoped between task-level and persistent state, every write is schema-checked with provenance, versioning allows rollback, and each agent holds least-privilege access",
          "Confirm the workspace is a single shared dictionary so debugging stays simple",
        ],
        correct: 1,
        feedback:
          "The checklist for shared memory is scoped, versioned, and access-controlled with validated writes, because one agent corrupting shared state poisons all downstream agents.",
      },
    ],
  },
  "ch18-conflict-resolution-termination": {
    objectives: [
      "Enumerate explicit mechanisms for resolving disagreement between agents.",
      "Explain how multi-agent systems amplify the single-agent termination problem.",
      "Design iteration caps, global budgets, and loop detection that guarantee the system stops.",
    ],
    sections: [
      {
        heading: "Why conflicts must be resolved explicitly",
        paragraphs: [
          "When two workers return contradictory results, 'let the model figure it out' is not a strategy — the contradiction either propagates into the output or gets resolved arbitrarily by whichever result arrives last. An explicit resolution mechanism must be chosen at design time.",
          "The named options are a judge or aggregator agent, majority vote across workers, confidence-weighted selection, and escalation to a human. The right choice depends on the cost of a wrong resolution: human escalation is reserved for cases where an automated wrong answer is unacceptable.",
        ],
      },
      {
        heading: "The amplified termination problem",
        paragraphs: [
          "Single agents already risk looping; multi-agent systems inherit and amplify that problem because loops can now span agents. The canonical failure is a pair of agents that ping-pong indefinitely, each asking the other to redo its work while token spend climbs.",
          "Because the loop is emergent — no single agent decides to loop forever — it cannot be prevented by prompting any one agent to behave. Termination is a property the orchestration layer must enforce mechanically.",
        ],
      },
      {
        heading: "Caps, budgets, and loop detection",
        paragraphs: [
          "Three controls are required: iteration caps on every agent and on the system as a whole, a global token/wall-clock budget enforced at the orchestrator, and loop detection that notices repeated states and terminates the run.",
          "These limits are layered, not alternatives. Per-agent caps stop one agent from spinning; the global budget stops many well-behaved agents from collectively overrunning cost; loop detection catches oscillation that stays under any per-agent cap.",
        ],
      },
      {
        heading: "Designing for graceful endings",
        paragraphs: [
          "Hitting a limit is a normal outcome, not a crash. When a budget or cap fires, the system should terminate with the best partial result and a clear status rather than aborting the run entirely.",
          "This connects termination back to conflict resolution: an aggregator that receives partial or contradictory worker outputs needs a defined policy — resolve by confidence, note the gap, or escalate — so the run always ends in a deliberate state.",
        ],
      },
    ],
    example: {
      title: "Worked example: the reviewer that never signs off",
      scenario:
        "A drafting crew pairs a writer agent with a critic agent. In production, the critic keeps sending drafts back for revision, the writer keeps revising, and one document burns through the daily token budget overnight without ever completing.",
      analysis:
        "This is the ping-pong failure mode: a loop spanning two agents that no per-agent prompt can prevent. The crew has no iteration cap, no shared budget enforced above the two agents, and no detection of the repeated revise-critique cycle. The disagreement between writer and critic also has no explicit resolution path.",
      decision:
        "Add per-agent and system-wide iteration caps, a global token/wall-clock budget enforced by the orchestrator, and loop detection that terminates on repeated cycles. Give the writer–critic disagreement an explicit resolver: after a fixed number of rounds, an aggregator accepts the best draft by confidence or escalates to a human, and the run ends with a recorded status either way.",
    },
    productionChecklist: [
      "Define the conflict-resolution mechanism (judge, vote, confidence weighting, human escalation) for every point where agents can disagree.",
      "Set per-agent iteration caps and a system-wide iteration cap.",
      "Enforce a global token and wall-clock budget at the orchestrator, not per agent.",
      "Implement loop detection that terminates runs on repeated agent–action cycles.",
      "Specify the terminal state when a limit fires: partial result, noted gap, or escalation.",
    ],
    commonMistakes: [
      "Assuming agents will resolve contradictions on their own instead of naming an explicit resolver.",
      "Setting per-agent caps but no global budget, so many agents collectively overrun cost.",
      "Relying on prompts to prevent loops that are actually an emergent, system-level property.",
      "Treating a budget or cap firing as a crash instead of a designed terminal state.",
    ],
    knowledgeChecks: [
      {
        id: "ch18-conflict-resolution-termination-kc-1",
        prompt:
          "Two specialist workers return contradictory figures for the same field, no human reviewer is available, and both workers reported calibrated confidence scores. Which resolution mechanism fits this situation?",
        options: [
          "Let whichever result arrives last overwrite the earlier one in shared state",
          "Use confidence-weighted selection — an explicit resolver alongside a judge or aggregator, majority vote, and human escalation",
          "Ask both workers to debate until one voluntarily withdraws its answer",
        ],
        correct: 1,
        feedback:
          "Explicit conflict resolution is required — judge or aggregator, majority vote, confidence-weighted selection, or human escalation; with calibrated confidences and no human, weighting fits.",
      },
      {
        id: "ch18-conflict-resolution-termination-kc-2",
        prompt:
          "In the worked example, a writer and critic looped through revise-critique cycles all night and burned the daily token budget. Which combination of controls would have ended the run deliberately?",
        options: [
          "A larger token budget so the pair eventually converges on its own",
          "A warmer prompt telling the critic to be more decisive about sign-off",
          "Per-agent and system iteration caps, an orchestrator-enforced global budget, loop detection on repeated cycles, and an aggregator that resolves after a fixed number of rounds",
        ],
        correct: 2,
        feedback:
          "Every agent and the system need iteration caps, a global token and wall-clock budget, and loop detection, with an explicit resolver — prompting cannot stop an emergent loop.",
      },
      {
        id: "ch18-conflict-resolution-termination-kc-3",
        prompt:
          "Every agent in a crew stayed under its individual iteration cap, yet the run still overran its cost target because dozens of well-behaved agents each spent a little. Which control was missing?",
        options: [
          "A global token and wall-clock budget enforced at the orchestrator, which caps collective spend that per-agent caps cannot",
          "A judge agent, since only explicit conflict resolution can reduce spending",
          "A sequential pipeline, since fixed chains never overrun budgets",
        ],
        correct: 0,
        feedback:
          "Both per-agent caps and a global budget enforced at the orchestrator are required; this incident is precisely the gap where individual caps pass but collective spend explodes.",
      },
      {
        id: "ch18-conflict-resolution-termination-kc-4",
        prompt:
          "An automated aggregator resolves worker disagreements in your design, but a stakeholder asks why any case still escalates to a human. How do you defend keeping human escalation?",
        options: [
          "Human escalation is only a courtesy; the aggregator could safely absorb every disagreement if tuned",
          "Humans are cheaper than judge agents, so escalation is primarily a cost-saving measure",
          "Human escalation is reserved for disagreements where an automated wrong answer is unacceptable, complementing the judge, vote, and confidence mechanisms",
        ],
        correct: 2,
        feedback:
          "Escalation to a human is one of the explicit resolvers; the choice among them depends on the cost of a wrong resolution, which is what justifies keeping humans in the loop.",
      },
      {
        id: "ch18-conflict-resolution-termination-kc-5",
        prompt:
          "In a pre-launch drill you force a budget limit to fire mid-run. What behavior must the system demonstrate for the termination design to pass review?",
        options: [
          "It terminates with the best partial result and a clear recorded status — a noted gap or escalation — rather than crashing or hanging",
          "It silently discards all partial work so no low-confidence output can escape",
          "It automatically doubles the budget and retries the run once",
        ],
        correct: 0,
        feedback:
          "Hitting a limit is a designed terminal state; the layered caps, budgets, and loop detection exist so runs end deliberately with partial results, never as unhandled crashes.",
      },
    ],
  },
  "ch18-cost-latency-control": {
    objectives: [
      "Quantify the cost multiplier of naive multi-agent systems relative to a single call.",
      "Apply the control set: parallelism, model right-sizing, caps, caching, and short-circuiting.",
      "Explain why multi-agent cost is emergent and must be a first-class, instrumented budget.",
    ],
    sections: [
      {
        heading: "The 5–50× cost reality",
        paragraphs: [
          "A naive multi-agent system can cost 5–50× a single model call. Every extra agent adds its own turns, context, and retries, so cost is emergent: it comes from the interaction of agents, not from any one agent's price per token.",
          "Because cost is emergent, it cannot be left to chance. It must be treated as a first-class budget with hard limits and per-stage attribution — you need to know cost per agent and per turn before you can control it.",
        ],
      },
      {
        heading: "Parallelize, don't serialize",
        paragraphs: [
          "Running independent workers in parallel rather than sequentially is the main latency control, and it is where the hierarchical topology's wall-clock win comes from. Only real dependencies should force serialization.",
          "A fan-out/fan-in execution pattern is the concrete shape: the orchestrator dispatches independent sub-tasks concurrently and synthesizes when they complete. This cuts latency without cutting capability, which makes it the first lever to pull.",
        ],
      },
      {
        heading: "Right-size models per sub-task",
        paragraphs: [
          "Not every sub-task deserves the largest model. The guidance is to route easy sub-tasks — classification, formatting, routing — to small cheap models and reserve the large model for genuine reasoning.",
          "This attacks cost at the per-call level: in a crew, most calls are routine, so right-sizing compounds across every agent and turn. Capping the number of agents and turns bounds the total number of calls on top of that.",
        ],
      },
      {
        heading: "Caching and short-circuiting",
        paragraphs: [
          "Caching sub-task results and shared retrievals removes duplicate spend — the same extraction or lookup should never be paid for twice within or across runs.",
          "The strongest control is the short-circuit: a cheap gate decides whether the full crew is even needed, and if a single agent can answer, you do not convene a crew. Many production requests never need multi-agent execution, and recognizing that is both a cost and a latency win.",
        ],
      },
    ],
    example: {
      title: "Worked example: a crew whose bill grew 20×",
      scenario:
        "A support-research feature fans every ticket out to a four-agent crew on the largest model. The monthly bill is 20× the single-agent baseline, p95 latency tripled, and review shows most tickets are simple lookups one agent could answer.",
      analysis:
        "The symptoms match the cost checklist: no short-circuit gate, so trivial tickets convene the full crew; no model right-sizing, so routing and formatting calls run on the largest model; workers appear serialized even though lookups are independent; and there is no caching of repeated retrievals across similar tickets.",
      decision:
        "Apply the controls in order of impact: add a cheap gate that short-circuits simple tickets to a single agent; run the remaining independent workers in parallel; route routine sub-tasks to a small model and keep the large model for hard reasoning; cache shared retrievals; and enforce caps on agents and turns. Attribute cost per agent and per turn so the next blow-up is visible before the bill arrives.",
    },
    productionChecklist: [
      "Instrument cost per agent and per turn so the expensive stage is attributable.",
      "Run independent workers in parallel; serialize only true dependencies.",
      "Route easy sub-tasks to small models and reserve large models for hard reasoning.",
      "Cap the number of agents and turns, and cache deterministic sub-task results.",
      "Add a short-circuit gate so requests a single agent can answer never convene the crew.",
    ],
    commonMistakes: [
      "Treating cost as a per-call price problem instead of an emergent system property needing a hard budget.",
      "Serializing independent workers and losing the main latency win of a hierarchy.",
      "Running every sub-task — including classification and formatting — on the largest model.",
      "Convening the full crew for every request with no short-circuit gate for single-agent work.",
    ],
    knowledgeChecks: [
      {
        id: "ch18-cost-latency-control-kc-1",
        prompt:
          "A crew's p95 latency is triple the single-agent baseline, yet trace inspection shows the workers are independent of each other and are being executed one after another. Which control applies first?",
        options: [
          "Move all workers to a larger model so each finishes in fewer turns",
          "Add a debate stage so worker quality improves while latency stays fixed",
          "Run the independent workers in parallel and serialize only real dependencies",
        ],
        correct: 2,
        feedback:
          "The first latency control is running independent workers in parallel rather than sequentially — that is where the hierarchical fan-out/fan-in wall-clock win comes from.",
      },
      {
        id: "ch18-cost-latency-control-kc-2",
        prompt:
          "In the worked example, review showed most support tickets were simple lookups that a four-agent crew processed on the largest model. Which control delivers the biggest saving for those tickets?",
        options: [
          "A majority vote among the four agents to cut hallucination rates",
          "A short-circuit gate that sends requests a single agent can answer to one agent instead of convening the crew",
          "A longer system prompt so the crew handles lookups more carefully",
        ],
        correct: 1,
        feedback:
          "The strongest cost control is the short-circuit: if a single agent can answer, do not convene a crew — most requests in the example never needed multi-agent execution.",
      },
      {
        id: "ch18-cost-latency-control-kc-3",
        prompt:
          "Across runs, the same product extraction is recomputed by every agent that needs it, and the bill shows the identical sub-task paid for many times. Which missing control explains this waste?",
        options: [
          "Caching deterministic sub-task results and shared retrievals so duplicate work is never paid for twice",
          "Confidence-weighted selection, so the best extraction wins earlier",
          "Loop detection, since recomputation is a form of oscillation",
        ],
        correct: 0,
        feedback:
          "Caching sub-task results is one of the cost controls precisely for this pattern — the same extraction or lookup should not be paid for twice within or across runs.",
      },
      {
        id: "ch18-cost-latency-control-kc-4",
        prompt:
          "A reviewer worries that routing classification, formatting, and routing sub-tasks to a small model will degrade the crew's output. How do you defend the model right-sizing policy?",
        options: [
          "Small models are never worse, so the concern is unfounded and no reservation is needed",
          "Easy sub-tasks do not need large-model capability, and reserving the large model for genuine reasoning keeps quality where it matters while savings compound across every agent and turn",
          "The large model should handle everything because consistency outweighs cost",
        ],
        correct: 1,
        feedback:
          "The guidance is to route easy sub-tasks — classification, formatting, routing — to small cheap models and reserve the large model for hard reasoning, compounding savings across the crew.",
      },
      {
        id: "ch18-cost-latency-control-kc-5",
        prompt:
          "A launch review asks how you will keep the crew's emergent cost acceptable once real traffic arrives, given that naive multi-agent systems can cost five to fifty times a single call. Which control set do you present?",
        options: [
          "A larger context window and a single global prompt describing frugality",
          "Unlimited agents with a monthly invoice review to catch overruns after the fact",
          "Caps on agents and turns, parallel execution of independent work, model right-sizing, caching of sub-task results, and a short-circuit gate",
        ],
        correct: 2,
        feedback:
          "A naive multi-agent system can cost 5–50× a single call, and this is exactly the control set: parallelism, right-sized models, caps, caching, and short-circuiting.",
      },
    ],
  },
};

export const chapter18Practice: CatalogPracticeUnit[] = [
  {
    id: "ch18-18-2-1",
    chapter: 18,
    chapterTitle: "Multi-Agent System Design",
    title: "When is multi-agent worth it over a single tool-using agent?",
    pages: "124",
    route: "/practice/multi-agent-system-design/when-is-multi-agent-worth-it-over-a-single-tool-using-agent",
    competencies: ["multi-agent topologies", "typed communication", "shared state", "budgets"],
    question:
      "Multi-agent systems are trendy. When is the added complexity actually justified over one well-tooled agent?",
    options: [
      {
        text: "Default to a single agent with good tools; go multi-agent only when the task decomposes into sub-goals that benefit from specialization, when sub-tasks are independent and parallelizable, or when separation of concerns (e.g. a distinct critic/verifier) improves reliability — and weigh the multiplied latency, cost, and failure modes.",
        correct: true,
        feedback:
          "Most 'multi-agent' wins come from better tools and prompts, so the single tooled agent is the default; specific structural conditions — decomposition, specialization, parallelism, generator/verifier separation — are what justify multiplying agents.",
      },
      {
        text: "Whenever the task is important or complex — multiple agents are simply more powerful, so peak capability should be the default for any serious feature.",
        correct: false,
        feedback:
          "This is the classic junior answer: agents are an organizational pattern for managing context and specialization with a real cost, not an automatic upgrade.",
      },
      {
        text: "Only when a single agent hits a hard context-window limit — as long as everything fits in context, one agent always beats a crew.",
        correct: false,
        feedback:
          "Context fit is not the deciding criterion; the justifications are decomposition into sub-goals, parallelizability, and generator/verifier separation, and latency-tight or audit-heavy tasks argue for staying single even when a crew fits.",
      },
    ],
  },
  {
    id: "ch18-18-2-2",
    chapter: 18,
    chapterTitle: "Multi-Agent System Design",
    title: "Design a hierarchical orchestrator–worker system",
    pages: "124",
    route: "/practice/multi-agent-system-design/design-a-hierarchical-orchestrator-worker-system",
    competencies: ["multi-agent topologies", "typed communication", "shared state", "budgets"],
    question:
      "Design a hierarchical multi-agent system for a complex research-and-report task. Cover delegation, communication, and failure handling.",
    options: [
      {
        text: "Draw a planner box connected to worker boxes, give each worker a role name, and let them exchange natural-language messages until the planner is satisfied with the report.",
        correct: false,
        feedback:
          "This is the junior answer — boxes labeled 'planner' and 'workers' with prose hand-offs specify neither a message contract nor any failure or observability story.",
      },
      {
        text: "Have the orchestrator dispatch sub-tasks, but serialize every worker so partial results can be reviewed in order, and abort the whole run if any worker fails terminally.",
        correct: false,
        feedback:
          "Serializing independent workers throws away the parallel fan-out latency win, and aborting on terminal worker failure contradicts the graceful-degradation guidance — produce the report with a noted gap instead.",
      },
      {
        text: "An orchestrator decomposes the goal into a task graph and fans independent sub-tasks out in parallel to specialist workers; workers return schema-validated results with status, payload, citations, and confidence; failures are handled in layers (per-worker timeout and retry, global token/wall-clock budget, graceful degradation with a noted gap); conflicts resolve by confidence and source authority; and every message carries a shared run_id for replay.",
        correct: true,
        feedback:
          "This is the staff answer: typed/validated messages, parallel fan-out, layered failure handling with budgets, explicit conflict resolution, and end-to-end tracing — engineering the failure and observability story where multi-agent systems actually fall over.",
      },
    ],
  },
  {
    id: "ch18-18-2-3",
    chapter: 18,
    chapterTitle: "Multi-Agent System Design",
    title: "How do you stop multi-agent cost and loops from exploding?",
    pages: "125",
    route: "/practice/multi-agent-system-design/how-do-you-stop-multi-agent-cost-and-loops-from-exploding",
    competencies: ["multi-agent topologies", "typed communication", "shared state", "budgets"],
    question:
      "A multi-agent system's cost and latency are blowing up in production. How do you control them?",
    options: [
      {
        text: "First attribute cost per agent and per turn; then bound loops with per-agent and global iteration caps plus loop/oscillation detection (hash agent, action, args and terminate on repeats), enforce a shared token/wall-clock budget at the orchestrator, right-size models per sub-task, parallelize independent work, cache deterministic results, and short-circuit to a single agent when the crew is unnecessary.",
        correct: true,
        feedback:
          "Follows the control sequence exactly: measure where tokens go, bound loops with multiple independent limits, right-size models, parallelize, cache, and short-circuit — treating emergent cost as a budgeted, instrumented property.",
      },
      {
        text: "Switch every agent to a cheaper model — model price is the dominant cost driver, so a cheaper model is the fastest fix.",
        correct: false,
        feedback:
          "'Use a cheaper model' is explicitly the junior answer; the blow-up is usually one chatty agent or an unbounded loop, so attribution and loop bounds come before model substitution.",
      },
      {
        text: "Reduce the team to two agents so there are fewer parties to loop, and add a prompt instruction that agents must not repeat themselves.",
        correct: false,
        feedback:
          "Loops are an emergent system property; mechanical enforcement is required — iteration caps, an orchestrator-level budget, and repeat detection — rather than prompt instructions, and cost must be attributed per stage, not guessed at.",
      },
    ],
  },
  {
    id: "ch18-18-2-4",
    chapter: 18,
    chapterTitle: "Multi-Agent System Design",
    title: "How do agents share state without corrupting each other?",
    pages: "126",
    route: "/practice/multi-agent-system-design/how-do-agents-share-state-without-corrupting-each-other",
    competencies: ["multi-agent topologies", "typed communication", "shared state", "budgets"],
    question:
      "How do you design shared memory/state for a multi-agent system so one agent can't poison the others?",
    options: [
      {
        text: "Put shared state in one dictionary every agent can read and write — in-place overwrites keep the workspace small, and the latest write naturally wins any conflict.",
        correct: false,
        feedback:
          "This is the junior 'shared dict' answer: unscoped, unvalidated, unversioned state with silent in-place overwrite lets one corrupted entry poison every downstream agent and hides conflicts from the aggregator.",
      },
      {
        text: "Treat shared state like shared mutable memory in a concurrent program: scope it (task-level scratch vs deliberately promoted persistent facts), schema-validate every write with author, timestamp, confidence, and provenance, apply least-privilege access per worker, version the workspace for audit and rollback, and prefer append-with-provenance over in-place overwrite so disagreements stay visible.",
        correct: true,
        feedback:
          "Matches the guidance point by point — scoping, typed and validated writes with provenance, least-privilege views, versioning, and append-with-provenance — because shared state is the highest-leverage failure point in the system.",
      },
      {
        text: "Give each agent its own private memory and forbid all shared state, synchronizing only through the orchestrator's context window.",
        correct: false,
        feedback:
          "The answer is disciplined sharing, not prohibition: scoped, validated, versioned, access-controlled shared state — and append-with-provenance keeps conflicts visible, which per-agent silos cannot do.",
      },
    ],
  },
  {
    id: "ch18-18-2-5",
    chapter: 18,
    chapterTitle: "Multi-Agent System Design",
    title: "How do you evaluate a multi-agent system end to end?",
    pages: "126",
    route: "/practice/multi-agent-system-design/how-do-you-evaluate-a-multi-agent-system-end-to-end",
    competencies: ["multi-agent topologies", "typed communication", "shared state", "budgets"],
    question:
      "How do you measure whether a multi-agent system is actually working, beyond 'the final answer looks good'?",
    options: [
      {
        text: "Evaluate at two levels — outcome (task completion rate, answer correctness against ground truth, cost/latency per task) and process (per-agent contribution, inter-agent hand-off success rate, redundant work, loop/timeout/fallback rates) — capture full traces under a shared run_id for replay, and run ablations to remove agents whose absence doesn't drop quality.",
        correct: true,
        feedback:
          "This is the senior framing: a multi-agent system is a distributed system, so you instrument and evaluate the coordination layer — process metrics tell you which agent to fix, and ablations remove agents that don't earn their cost.",
      },
      {
        text: "Score the final answer with an LLM judge or human review — if end output quality is high, the orchestration is working by definition.",
        correct: false,
        feedback:
          "Final-answer quality hides where the system is fragile; without process metrics like hand-off success and per-agent contribution you cannot localize which agent is failing.",
      },
      {
        text: "Track total token spend and wall-clock latency per run; when those stay within budget, the crew is healthy and no per-agent breakdown is needed.",
        correct: false,
        feedback:
          "Aggregate cost and latency are outcome-adjacent numbers; the differentiator is measuring the coordination layer — per-agent contribution, hand-off success, redundant work, and loop/fallback rates — with traces for replay and ablation.",
      },
    ],
  },
];
