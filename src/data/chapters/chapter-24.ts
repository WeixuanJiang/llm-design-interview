import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter24Module: LearningModule = {
  id: "chapter-24-safety-guardrails-and-red-teaming",
  title: "Safety, Guardrails, and Red-Teaming",
  description:
    "Keep a deployed LLM system safe with layered guardrails, prompt-injection and jailbreak defenses, continuous red-teaming, and a measured safety-versus-helpfulness operating point.",
  duration: "4 lessons",
  lessons: [
    {
      id: "ch24-guardrail-architecture",
      title: "The guardrail architecture",
      prompt: "Layer safety controls around the model",
      question:
        "A customer-facing assistant will gain tool access next quarter, and leadership asks why the safety plan cannot be a well-written system prompt plus one moderation filter. What is the strongest design response?",
      options: [
        "A safety-aligned model with a strong system prompt is sufficient because alignment training already teaches refusal behavior, and additional layers mostly add latency.",
        "Defense-in-depth: input classifiers screen prompts for disallowed content, injection patterns, and PII; the aligned model refuses harmful requests as one layer; outputs are scanned for toxicity, leakage, policy violations, and RAG groundedness; and tool actions are authorized, confirmed, and sandboxed — each layer independently tested and monitored.",
        "Route every request and response through the main model's self-moderation so one model owns all policy decisions and the safety surface stays simple.",
      ],
      correct: 1,
      feedback:
        "Strong choice. No single layer is sufficient, so production systems stack input, model, output, and action guardrails, with dedicated guardrail models running checks the main model should not police itself.",
      explanation:
        "Safety is enforced in layers around the model because every individual layer fails sometimes. Input guardrails filter risky prompts, model-level alignment through RLHF/DPO and safety fine-tuning handles refusal behavior, output guardrails catch toxicity, PII leakage, policy violations, and ungrounded RAG answers, and tool guardrails authorize and sandbox actions — the highest-impact layer once the model can act. Dedicated guardrail models such as Llama Guard or moderation classifiers implement input/output checks more cheaply and reliably than asking the main model to police itself.",
      takeaways: [
        "Stack input, model, output, and action guardrails; never rely on a single layer.",
        "Use dedicated guardrail models for checks instead of main-model self-policing.",
        "Make every layer independently testable, monitored, and swappable.",
      ],
      model: ["Screen inputs", "Align and scan outputs", "Authorize and sandbox actions"],
      source: { chapter: 24, sections: ["24.1.1"], pages: "148" },
    },
    {
      id: "ch24-prompt-injection-jailbreaks",
      title: "Prompt injection and jailbreaks",
      prompt: "Defend against instructions hidden in untrusted content",
      question:
        "A RAG agent summarizes web pages and can call internal tools. A fetched page contains hidden text telling the agent to send the user's credentials to an external address. Which defense posture is correct?",
      options: [
        "Instruct the model in the system prompt to ignore any instructions found in retrieved documents; prompt-level refusal is the primary and sufficient defense.",
        "Block all external content from entering the context, because any retrieved text is an unacceptable injection risk for an agent with tools.",
        "Assume injection cannot be fully prevented and limit blast radius: delimit and label untrusted content as data, scan inputs and tool inputs for injection and exfiltration, enforce least-privilege tools with human confirmation for high-impact actions, and sandbox execution.",
      ],
      correct: 2,
      feedback:
        "Strong choice. There is no known complete fix for prompt injection, so the strategy is containment: separate trusted instructions from untrusted data, classify for injection patterns, and constrain what a hijacked model can actually do.",
      explanation:
        "Jailbreaks manipulate the model into violating its own policies through role-play framing, obfuscation, or many-shot priming, while prompt injection hides instructions inside untrusted content such as retrieved documents or tool results. Indirect injection is especially dangerous in RAG and agent systems because the attacker never talks to the model directly. Since prevention is unreliable, defense-in-depth — delimiters with data-not-instructions framing, input/output classifiers, least-privilege tools, human confirmation, and sandboxing — limits the blast radius of a successful attack.",
      takeaways: [
        "Distinguish jailbreaks, which manipulate the model, from injection, which smuggles instructions inside untrusted content.",
        "Treat injection as unpreventable; design to limit blast radius rather than to hope for prevention.",
        "Constrain capability: least-privilege tools, human confirmation for high-impact actions, and sandboxed execution.",
      ],
      model: ["Separate trusted from untrusted", "Classify inputs and outputs", "Constrain and sandbox capability"],
      source: { chapter: 24, sections: ["24.1.2"], pages: "148" },
    },
    {
      id: "ch24-red-teaming",
      title: "Red-teaming as a continuous program",
      prompt: "Build an adversarial testing loop that never stops",
      question:
        "A team ran a one-time jailbreak test pass before launch and considers red-teaming done. Six weeks later a new jailbreak family circulates online. What does a mature red-teaming program look like?",
      options: [
        "Red-teaming is a launch-gate activity: once the pre-launch checklist passes, ongoing safety is owned by the moderation filter and production monitoring.",
        "A continuous program combining manual expert probing, automated LLM-generated attacks at scale, and curated suites of known jailbreak families, with findings triaged by severity like security bugs, fixed across training data and guardrail rules, and added to a regression suite so they stay fixed.",
        "Rely on production monitoring alone and add new attack patterns to the blocklist as users report harm.",
      ],
      correct: 1,
      feedback:
        "Strong choice. New jailbreaks emerge constantly, so red-teaming must be continuous and wired into training data, guardrail rules, and a regression suite — with launch-blocking severity triage like security vulnerabilities.",
      explanation:
        "Red-teaming is systematic adversarial testing before and during deployment, drawing on manual expert probing, automated red-teaming where LLMs generate attacks at scale, and curated suites covering harm categories and known jailbreak families. It must be continuous because new jailbreaks emerge constantly. Confirmed findings are triaged like security vulnerabilities — a successful finding can block a launch — and fixes feed back into safety training data, guardrail rules, and a regression suite so fixed vulnerabilities stay fixed.",
      takeaways: [
        "Run red-teaming continuously, not as a one-time pre-launch checklist.",
        "Combine manual expert probing, automated attack generation, and curated jailbreak suites.",
        "Triage findings like security bugs and lock every fix into a regression suite.",
      ],
      model: ["Generate attacks", "Triage and fix across layers", "Add to the regression suite"],
      source: { chapter: 24, sections: ["24.1.3"], pages: "148" },
    },
    {
      id: "ch24-safety-helpfulness-tradeoff",
      title: "Safety operations and the over-refusal trade-off",
      prompt: "Measure safety and helpfulness on two axes",
      question:
        "After a guardrail tightening, a medical-education assistant now refuses legitimate questions about drug interactions, and user complaints spike. Leadership proposes loosening the filters a bit. What is the strongest response?",
      options: [
        "Make the trade-off measurable on both axes: track harmful-allowed and benign-refused rates separately, build a benign-but-sensitive evaluation set, replace blunt keyword blocks with intent-aware classifiers, and tune to a deliberate operating point validated on both metrics.",
        "Keep the aggressive guardrails unchanged, because a satisfaction dip is an acceptable price for a lower violation rate.",
        "Loosen the input filters incrementally and re-measure only the violation rate, relaxing further as long as it stays below the old threshold.",
      ],
      correct: 0,
      feedback:
        "Strong choice. Over-refusal is a real product harm with its own metric; safety tuning is a two-sided optimization validated by measuring harmful-allowed and benign-refused rates together.",
      explanation:
        "Production safety operations monitor violation rate, jailbreak success rate, and false-refusal rate, run incident response for novel attacks, and keep policies and classifiers updated. The central tension is over-refusal: aggressive guardrails reject benign requests and damage utility, while loose ones let harm through. Optimizing only safety produces a useless product and optimizing only helpfulness produces an unsafe one, so both axes must be measured and the operating point tuned deliberately — with benign-but-sensitive evaluation sets and intent-aware classifiers instead of keyword blocks.",
      takeaways: [
        "Track harmful-allowed and benign-refused rates as separate first-class metrics.",
        "Build benign-but-sensitive evaluation sets to quantify over-refusal precisely.",
        "Tune a deliberate operating point per product risk tolerance, and prefer graceful responses over hard refusals where possible.",
      ],
      model: ["Measure both axes", "Diagnose over-refusal sources", "Tune the operating point"],
      source: { chapter: 24, sections: ["24.1.4"], pages: "149" },
    },
  ],
};

export const chapter24CourseContent: Record<string, LessonCourseContent> = {
  "ch24-guardrail-architecture": {
    objectives: [
      "Explain why safety is enforced in layers around the model rather than in a single control.",
      "Describe the responsibilities of input, model, output, and tool/action guardrails.",
      "Decide where dedicated guardrail models belong and how each layer is tested and monitored.",
    ],
    sections: [
      {
        heading: "Why no single layer is sufficient",
        paragraphs: [
          "Safety in a deployed LLM system is a property of the whole request path, not of any one component. A system prompt can be overridden by clever framing; alignment training refuses many harmful requests but remains imperfect; a moderation filter sees only part of the traffic. Because every individual layer fails sometimes, production designs stack complementary controls so that a failure in one layer is caught by another.",
          "The layered view also makes safety engineering tractable. Each layer has a defined input, a policy it enforces, a latency budget, and metrics that show whether it is working. That structure turns 'make the product safe' into a set of testable subsystems with owners, instead of an untestable property of the model.",
        ],
      },
      {
        heading: "The four layers",
        paragraphs: [
          "Input guardrails classify and filter incoming prompts before they reach the model: blocking disallowed content, detecting prompt-injection and jailbreak patterns, stripping or flagging PII, and enforcing topic scope. Model-level alignment — RLHF/DPO and safety fine-tuning — trains the model itself to refuse harmful requests; it is the primary layer but imperfect, so it is never the only one.",
          "Output guardrails scan generations before they reach the user, checking toxicity, PII leakage, and policy violations, and for RAG systems groundedness and citation correctness. Tool and action guardrails govern agents: every action is authorized against the acting user's permissions and sandboxed in execution. When the model can act in the world, this is the highest-impact layer, because a text mistake is embarrassing while an unauthorized action is real damage.",
        ],
      },
      {
        heading: "Dedicated guardrail models",
        paragraphs: [
          "Input and output checks are usually implemented by dedicated guardrail models — for example Llama Guard or classifier-based moderation — rather than by asking the main model to police itself. A small purpose-built classifier is cheaper to run on every request, can be swapped or retrained without touching the serving model, and is not subject to the same jailbreak that compromises the main model.",
          "Separation also clarifies accountability. The main model is optimized for helpfulness and quality; the guardrail models are optimized for policy recall and precision. When a violation slips through, the team can tell whether the gap is in alignment, in an input classifier, or in an output scanner — and fix that layer without regressing the others.",
        ],
      },
      {
        heading: "Making each layer testable and monitored",
        paragraphs: [
          "Every layer needs its own evaluation: attack suites for input filters, refusal behavior checks for alignment, toxicity and leakage tests for output scanning, and authorization tests for tool gating. Production monitoring tracks violation rate, jailbreak success rate, and false-refusal rate per layer, so a regression can be attributed instead of guessed at.",
          "The architecture is operated like any other production system: safety has SLAs, dashboards, and an incident-response process for novel attacks. The framing that matters in design reviews is that safety is a layered, measurable system with its own incident response — not a safety sentence added to the prompt.",
        ],
      },
    ],
    example: {
      title: "Worked example: support assistant that gains tool access",
      scenario:
        "A customer-support assistant answers policy questions over RAG today, and next quarter it will issue refunds through a tool. The current safety plan is a firm system prompt plus one moderation filter on user input.",
      analysis:
        "The prompt-plus-filter plan leaves three gaps: nothing screens retrieved documents for injected instructions, nothing checks generated answers for toxicity, PII leakage, or ungrounded claims, and nothing authorizes the refund tool against the caller's permissions. The refund capability converts a text-quality risk into a financial-action risk, which is exactly where the action layer matters most.",
      decision:
        "Adopt layered guardrails: an input classifier for disallowed content, injection patterns, and PII; the aligned model as one refusal layer; an output scanner with groundedness checks for RAG answers; and per-action authorization with human confirmation for refunds and sandboxed execution. Monitor violation, jailbreak-success, and false-refusal rates per layer before enabling the tool.",
    },
    productionChecklist: [
      "Enumerate the input, model, output, and action layers and the policy each one enforces.",
      "Run dedicated guardrail models for input/output checks instead of main-model self-policing.",
      "Authorize every tool action against the acting user's permissions and sandbox execution.",
      "Require human confirmation for high-impact or irreversible actions.",
      "Monitor violation rate, jailbreak success rate, and false-refusal rate per layer.",
    ],
    commonMistakes: [
      "Treating a safety system prompt or one moderation filter as the complete architecture.",
      "Asking the main model to police itself, which inherits the same jailbreak it is defending against.",
      "Forgetting the tool/action layer when the model gains the ability to act.",
      "Measuring only harm blocked while ignoring each layer's false-refusal damage.",
    ],
    knowledgeChecks: [
      {
        id: "ch24-guardrail-architecture-kc-1",
        prompt:
          "A product team proposes shipping a customer-facing LLM assistant whose entire safety design is a carefully written system prompt, because the model has been alignment trained. Why does a layered guardrail architecture outperform this plan?",
        options: [
          "Alignment training guarantees refusal behavior, so the prompt-only plan is acceptable if the refusal rate passes a pre-launch test.",
          "Every individual layer fails sometimes, so safety is stacked around the model: input classifiers filter risky prompts, alignment handles refusal as one layer, outputs are scanned before reaching users, and tool actions are authorized and sandboxed.",
          "The system prompt should be moved into a dedicated guardrail model so the main model can focus entirely on helpfulness.",
        ],
        correct: 1,
        feedback:
          "Correct. Safety is enforced in layers around the model because no single layer is sufficient; alignment is the primary but imperfect layer, never the only one.",
      },
      {
        id: "ch24-guardrail-architecture-kc-2",
        prompt:
          "A support assistant answers policy questions over RAG today, and next quarter it will issue refunds through a tool; its current safety plan is a firm system prompt plus one moderation filter on user input. Which addition matters most once the model can take financial actions, and why?",
        options: [
          "A tool/action guardrail layer that authorizes each refund against the caller's permissions, requires human confirmation for high-impact actions, and sandboxes execution, because an unauthorized action is real damage rather than embarrassing text.",
          "A second moderation filter on user input tuned more aggressively, because most refund abuse will arrive as cleverly worded customer messages.",
          "A longer system prompt reminding the model never to issue refunds without checking policy, because alignment is strongest at the model layer.",
        ],
        correct: 0,
        feedback:
          "Correct. Tool/action guardrails are the highest-impact layer when the model can act; actions are authorized against the user's permissions and sandboxed, with confirmation for high-impact operations.",
      },
      {
        id: "ch24-guardrail-architecture-kc-3",
        prompt:
          "After launch, a jailbreak payload that was invisible to the input filter steers the assistant into leaking another customer's PII in its reply. Which layered-control gap best explains why the leak reached the user?",
        options: [
          "The alignment layer was never trained, because a safety-aligned model would have refused to emit PII regardless of the input filter's miss.",
          "The refund tool lacked sandboxing, so the jailbreak could execute financial actions instead of only leaking text.",
          "The team asked the main model to police itself and skipped the output guardrail, so nothing scanned generations for PII leakage after the input layer failed.",
        ],
        correct: 2,
        feedback:
          "Correct. Output guardrails exist precisely to catch toxicity, PII leakage, and policy violations before generations reach the user; self-policing inherits the same jailbreak that compromised the model.",
      },
      {
        id: "ch24-guardrail-architecture-kc-4",
        prompt:
          "A reviewer argues that running dedicated guardrail models on every request doubles inference cost and that the serving model should simply self-moderate. How do you defend dedicated guardrail models?",
        options: [
          "Dedicated classifiers such as Llama Guard run input and output checks more cheaply and reliably than the main model policing itself, stay swappable without touching the serving model, and are not compromised by the same jailbreak.",
          "Self-moderation is acceptable only for low-risk products; for everything else the serving model should be retrained weekly on the latest violations.",
          "The cost argument is right, so guardrails should sample ten percent of traffic instead of checking every request and response.",
        ],
        correct: 0,
        feedback:
          "Correct. Dedicated guardrail models such as Llama Guard or classifier-based moderation implement input and output checks more cheaply and reliably than relying on the main model to police itself.",
      },
      {
        id: "ch24-guardrail-architecture-kc-5",
        prompt:
          "Before enabling a new tool for the assistant, which monitoring and validation setup best matches the guidance that safety is a layered, measurable system with its own SLAs and incident response?",
        options: [
          "Run one pre-launch red-team exercise and, if it passes, monitor only the end-user report rate, since user complaints are the truest safety signal.",
          "Track a single aggregate safety score across the whole product so leadership gets one number, and investigate only when that number drops sharply.",
          "Test each layer independently with its own evaluation, monitor violation rate, jailbreak success rate, and false-refusal rate per layer, and keep an incident-response path for novel attacks before the tool ships.",
        ],
        correct: 2,
        feedback:
          "Correct. The staff-level answer makes each layer independently testable and monitored on violation, jailbreak-success, and false-refusal rates, treating safety as a measurable system with incident response.",
      },
    ],
  },
  "ch24-prompt-injection-jailbreaks": {
    objectives: [
      "Distinguish jailbreaks from prompt injection and explain why indirect injection is the dangerous case.",
      "Apply defense-in-depth controls: trust separation, classifiers, least-privilege tools, confirmation, and sandboxing.",
      "Frame injection as an unpreventable threat and design to limit blast radius.",
    ],
    sections: [
      {
        heading: "Two different attacks",
        paragraphs: [
          "Jailbreaks manipulate the model into violating its own policies. The attacker talks to the model directly, using role-play framing, 'ignore previous instructions' phrasing, obfuscation, or many-shot priming to push the model past its alignment. These attacks target the model layer, which is why alignment and input classifiers reduce but never eliminate them.",
          "Prompt injection is distinct and harder. The malicious instruction rides inside untrusted content — a retrieved document, a tool result, a web page — and the model follows it because instruction and data share one channel. In indirect injection the attacker never talks to the model at all; they poison content the system will later read, which makes the attack scalable and hard to attribute.",
        ],
      },
      {
        heading: "Why prevention is the wrong goal",
        paragraphs: [
          "There is no known complete fix for prompt injection. Delimiters and instructions to treat retrieved content as data rather than instructions help, but they are not airtight: the model still has to read the untrusted text to do its job, and a sufficiently crafted payload can still steer it. Designing as if the prompt layer were a firewall produces false confidence.",
          "The correct strategic posture is containment. Assume some injections will succeed, and architect so that a hijacked model still cannot read secrets, call dangerous tools unconfirmed, or leak data. Containment over hope is the framing that separates a production answer from a naive one.",
        ],
      },
      {
        heading: "The defense-in-depth stack",
        paragraphs: [
          "The first controls separate trust: wrap all untrusted content in strong delimiters with explicit data-not-instructions framing, and run input and output classifiers that look for injection and jailbreak patterns. These raise the attacker's cost and catch known payload families, but they do not make the system safe by themselves.",
          "The decisive controls constrain capability. Give tools least privilege, require human-in-the-loop confirmation for high-impact or irreversible actions, and execute code or network operations in a sandbox with network isolation — so even a successful injection cannot exfiltrate data or cause damage. For agents, also scan tool inputs for exfiltration rather than only outputs, authorize every action against the acting user's permissions, and audit every tool call so attacks can be replayed and investigated.",
        ],
      },
      {
        heading: "Operating the defense",
        paragraphs: [
          "Injection defense is validated adversarially, not assumed. Red-team continuously with known injection payloads and make resistance a launch gate for new retrieval sources, tools, or prompt changes. Track jailbreak success rate and injection incidents as production metrics, with an incident-response path for novel payloads.",
          "Treat agent injection with the seriousness of remote code execution: the model can be steered into actions, so the security model must assume a compromised instruction follower and protect the capability boundary around it. That mindset — limit privileges, confirm consequential actions, sandbox execution, audit everything — is what keeps an unpreventable attack from becoming an unbounded incident.",
        ],
      },
    ],
    example: {
      title: "Worked example: web-summarizing agent with internal tools",
      scenario:
        "An agent fetches and summarizes web pages, then files tickets through an internal tool. A fetched page contains hidden text telling the agent to send the contents of the user's environment variables to an external address.",
      analysis:
        "The payload arrives through untrusted content, so this is indirect injection — the attacker never contacts the model. Prompt-level instructions to ignore such text help but are not airtight, and the real risk is the tool path: the agent can read sensitive context and act on it. The design must assume the model can be hijacked and make the hijack harmless.",
      decision:
        "Delimit and label fetched content as data, scan fetched pages and tool inputs for injection and exfiltration patterns, restrict the ticket tool to least privilege, require human confirmation before any external send, execute in a network-isolated sandbox, audit every tool call, and gate releases on injection red-team results.",
    },
    productionChecklist: [
      "Wrap untrusted content in strong delimiters with explicit data-not-instructions framing.",
      "Classify inputs, retrieved content, and tool inputs/outputs for injection and exfiltration patterns.",
      "Enforce least-privilege tools and per-action authorization against the acting user's permissions.",
      "Require human confirmation for high-impact or irreversible actions and sandbox execution with network isolation.",
      "Audit every tool call and red-team continuously with known injection payloads as a launch gate.",
    ],
    commonMistakes: [
      "Relying on 'ignore injected instructions' prompt text as the primary defense.",
      "Assuming injection is preventable instead of designing to limit blast radius.",
      "Scanning only model outputs while tool inputs carry the exfiltration attempt.",
      "Granting broad tool permissions with no confirmation step, so a hijack becomes real damage.",
    ],
    knowledgeChecks: [
      {
        id: "ch24-prompt-injection-jailbreaks-kc-1",
        prompt:
          "A security reviewer lumps every attack on the assistant into one category called jailbreaking. Why does the distinction between a jailbreak and indirect prompt injection change the defense you design?",
        options: [
          "There is no practical difference: both are blocked by the same system prompt, so the reviewer is right to treat them as one threat.",
          "Jailbreaks are harmless role-play, while injection is the only real risk, so the defense should focus exclusively on retrieved documents.",
          "A jailbreak manipulates the model directly through framing or obfuscation, while indirect injection hides instructions in untrusted content the system later reads — the attacker never talks to the model, so defenses must secure the data channel, not just the chat channel.",
        ],
        correct: 2,
        feedback:
          "Correct. Jailbreaks (role-play framing, obfuscation, many-shot priming) are distinct from prompt injection carried inside untrusted content, and indirect injection is especially dangerous in RAG and agents.",
      },
      {
        id: "ch24-prompt-injection-jailbreaks-kc-2",
        prompt:
          "An agent fetches and summarizes web pages and can file tickets through an internal tool. A fetched page contains hidden text telling the agent to send the user's environment variables to an external address. Which control set best neutralizes this specific payload?",
        options: [
          "Label the fetched content as data inside strong delimiters, scan the page and the tool inputs for injection and exfiltration patterns, restrict the send capability to least privilege with human confirmation, and run execution in a network-isolated sandbox.",
          "Add a line to the system prompt instructing the model to ignore any commands found inside web pages, then log the incident if it still happens.",
          "Disable page summarization for all external sites and require users to paste page text manually after reviewing it themselves.",
        ],
        correct: 0,
        feedback:
          "Correct. Defense-in-depth for indirect injection is trust separation, input and tool-input classification, least-privilege tools with human confirmation, and sandboxed, network-isolated execution.",
      },
      {
        id: "ch24-prompt-injection-jailbreaks-kc-3",
        prompt:
          "An injected instruction succeeds and the agent attempts to send a sensitive file to an external address, yet the security review concludes the incident caused no damage. Which design choice most likely contained the blast radius?",
        options: [
          "The input classifier happened to catch this exact payload, proving the classifier-first strategy is sufficient against known injection families.",
          "Tool capability was constrained — least-privilege permissions, human confirmation for the external send, and a network-isolated sandbox — so the hijacked model could not complete the exfiltration.",
          "The model's alignment training recognized the malicious framing and refused, showing the model layer can absorb injection failures on its own.",
        ],
        correct: 1,
        feedback:
          "Correct. Assume some injections will succeed and architect so a hijacked model still cannot read secrets, call dangerous tools unconfirmed, or leak data — containment limits blast radius.",
      },
      {
        id: "ch24-prompt-injection-jailbreaks-kc-4",
        prompt:
          "An engineer proposes eliminating injection risk entirely by banning all untrusted content from the agent's context. How do you defend the containment strategy against this prevention-first proposal?",
        options: [
          "Agree and ban retrieved content, because any design that tolerates a successful injection has already failed its security review.",
          "Compromise by allowing retrieval but stripping all instructions from documents with a regex, which makes prevention achievable after all.",
          "RAG and agents exist to use untrusted content, and no complete fix exists, so the defensible posture is defense-in-depth that limits what a successful injection can do — delimiters and classifiers to raise attacker cost, plus capability constraints so a hijack stays harmless.",
        ],
        correct: 2,
        feedback:
          "Correct. There is no known complete fix for injection; the strategy is limiting blast radius rather than assuming prevention, which keeps the product's untrusted-content capability intact.",
      },
      {
        id: "ch24-prompt-injection-jailbreaks-kc-5",
        prompt:
          "Your team is about to connect a new retrieval source and a new tool to the agent. Which pre-release and ongoing validation routine matches the guidance for operating injection defense?",
        options: [
          "Ship behind a feature flag, watch the general error rate for a week, and roll back only if ordinary task success regresses noticeably.",
          "Red-team the new surfaces continuously with known injection payloads as a launch gate, audit every tool call for replay, and track jailbreak success rate and injection incidents as standing production metrics with an incident-response path.",
          "Run the standard offline quality eval on the new source, because injection resistance correlates with answer quality and needs no separate gate.",
        ],
        correct: 1,
        feedback:
          "Correct. Red-team continuously with known injection payloads as a launch gate, audit every tool call, and monitor jailbreak success rate as a production metric with incident response.",
      },
    ],
  },
  "ch24-red-teaming": {
    objectives: [
      "Design a continuous red-teaming program spanning manual, automated, and curated attack sources.",
      "Define severity triage and launch-gate behavior for confirmed findings.",
      "Close the loop from findings into training data, guardrail rules, and regression suites.",
    ],
    sections: [
      {
        heading: "What red-teaming is",
        paragraphs: [
          "Red-teaming is systematic adversarial testing of the deployed system, run before launch and continuously during deployment. It is not a quick pass with a few jailbreak prompts; it is an adversarial measurement system with owned scope, schedules, and gates — closer to a security testing practice than to a QA checklist.",
          "Continuity is the defining property. New jailbreaks emerge constantly, so a one-time pre-launch checklist goes stale within weeks. The program has to keep generating pressure against the current model, prompts, guardrails, and tools, because the attacker's side never stops evolving.",
        ],
      },
      {
        heading: "Three sources of attacks",
        paragraphs: [
          "Manual expert probing brings domain and security specialists who think adversarially about the specific product: its policies, its data, and its tools. Humans are best at novel attack classes and at exploiting context a generator would not know.",
          "Automated red-teaming uses LLMs to generate large volumes of attack variants across harm categories, giving breadth and scale that humans cannot sustain. Curated suites of known jailbreak families and harm taxonomies anchor coverage, so every run tests the known patterns plus whatever the product adds — for RAG and agent systems, injection and data-exfiltration cases belong in the corpus.",
        ],
      },
      {
        heading: "The closed loop for findings",
        paragraphs: [
          "Every confirmed vulnerability is triaged by severity like a security bug, and a launch-blocking finding blocks the release. Severity triage keeps the program honest: novelty and volume of attacks matter less than which ones can actually produce harm in this product.",
          "Fixes land in multiple layers at once — safety fine-tuning data, guardrail classifier rules, and input/output filters — because a single-layer patch invites the same attack back through a different door. Critically, every fixed attack is added to a regression suite so the vulnerability can never silently return when a model, prompt, or guardrail changes.",
        ],
      },
      {
        heading: "Operating the program",
        paragraphs: [
          "In production, jailbreak success rate and violation rate are monitored as standing metrics, and novel attacks discovered live feed back into the red-team corpus. The program also tracks the false-refusal rate so that safety fixes do not over-correct into blocking benign use.",
          "Governance is what makes it a program rather than a hobby: red-teaming is owned, scheduled, and gated. Findings carry trackers and SLAs like security vulnerabilities, fixes are verified against the regression suite, and launch decisions consume red-team results as a gate rather than as advisory input.",
        ],
      },
    ],
    example: {
      title: "Worked example: red-teaming a RAG support agent",
      scenario:
        "A support agent with refund tools is six weeks from launch. The security team proposes one week of manual jailbreak testing, then sign-off.",
      analysis:
        "A single manual week covers only the attacks one team can think of once. The product needs breadth from automated variants across harm categories, depth from expert probing of the refund and data flows, and anchors from curated jailbreak families plus injection and exfiltration suites for the RAG and tool surfaces. It also needs a loop: findings must change training data, guardrail rules, and filters, and every fixed attack must persist as a regression test.",
      decision:
        "Stand up continuous red-teaming: manual expert probing of the refund and data paths, automated LLM-generated attack campaigns, and curated suites including injection and exfiltration. Triage findings by severity with launch-blocking gates, land fixes across alignment data and guardrail rules, add every fixed attack to the regression suite, and monitor jailbreak-success and false-refusal rates after launch.",
    },
    productionChecklist: [
      "Fund all three attack sources: manual experts, automated generation, and curated suites.",
      "Extend coverage to injection and data exfiltration for RAG and agent surfaces.",
      "Triage findings by severity like security bugs and block launches on critical findings.",
      "Land fixes in training data, guardrail rules, and filters — not in one layer only.",
      "Add every fixed attack to a regression suite and monitor jailbreak-success and false-refusal rates in production.",
    ],
    commonMistakes: [
      "Running red-teaming once before launch and treating it as done.",
      "Trying a handful of jailbreak prompts instead of systematic coverage across harm categories.",
      "Fixing a vulnerability in one layer without adding it to the regression suite.",
      "Tightening defenses without tracking false refusals, so fixes over-correct into blocking benign use.",
    ],
    knowledgeChecks: [
      {
        id: "ch24-red-teaming-kc-1",
        prompt:
          "A founder asks why red-teaming cannot be a single thorough exercise in the month before launch, after which the system is certified safe. What is the core reason the program must be continuous?",
        options: [
          "New jailbreaks emerge constantly, so a one-time checklist goes stale quickly; systematic adversarial testing must keep running before and during deployment against the current model, prompts, guardrails, and tools.",
          "Launch-month testing is too rushed to find anything, but any other single month would produce a durable safety certification.",
          "Regulations require annual retesting, so continuity is primarily a compliance formality rather than an engineering need.",
        ],
        correct: 0,
        feedback:
          "Correct. Red-teaming is systematic adversarial testing before and during deployment that must be continuous because new jailbreaks emerge constantly.",
      },
      {
        id: "ch24-red-teaming-kc-2",
        prompt:
          "A refund-capable support agent is six weeks from launch, and the security team proposes one week of manual jailbreak testing followed by sign-off. Which redesign of that plan best strengthens the program before and after release?",
        options: [
          "Extend the same manual effort to three weeks so the experts have time to try more prompts, since expert probing is the highest-signal source.",
          "Replace manual testing with fully automated LLM-generated attacks, because volume and breadth always beat expert depth for a launch gate.",
          "Combine manual expert probing of the refund and data paths, automated LLM-generated attack variants across harm categories, and curated suites of known jailbreak families plus injection and exfiltration cases for the RAG and tool surfaces.",
        ],
        correct: 2,
        feedback:
          "Correct. The red-teaming program draws on three attack sources — manual expert probing, automated red-teaming at scale, and curated suites — extended to injection and data exfiltration for RAG and agent systems.",
      },
      {
        id: "ch24-red-teaming-kc-3",
        prompt:
          "A jailbreak fixed three releases ago suddenly works again after a guardrail update, and nobody notices until users report it. Which missing practice from the red-teaming loop explains this silent regression?",
        options: [
          "The original fix was applied only to the system prompt instead of the model weights, so it was never a real fix.",
          "The fixed attack was never added to a regression suite, so a later model, prompt, or guardrail change could silently reopen the vulnerability with no test to catch it.",
          "The red-team program lacked a bug bounty, so external researchers had no channel to report the regression earlier.",
        ],
        correct: 1,
        feedback:
          "Correct. Every fixed attack must be added to a regression suite so fixed vulnerabilities stay fixed; without it, later changes silently reopen the hole.",
      },
      {
        id: "ch24-red-teaming-kc-4",
        prompt:
          "Engineering leadership complains that a launch-blocking red-team gate will slow releases and asks to make findings advisory only. How do you defend severity triage with launch-blocking gates?",
        options: [
          "Confirmed vulnerabilities are triaged by severity like security bugs, and a launch-blocking finding blocks the release; advisory-only findings let known exploitable harm ship, while severity triage keeps the gate proportional so low-severity issues do not stall releases.",
          "The gate should stay advisory, because the moderation filter already blocks the same attacks in production and release speed matters more.",
          "Block every release until zero findings remain across all harm categories, because any known residual vulnerability is unacceptable.",
        ],
        correct: 0,
        feedback:
          "Correct. Treat a successful red-team finding as a launch blocker with severity triage like security vulnerabilities — proportional, not advisory-only and not zero-tolerance theater.",
      },
      {
        id: "ch24-red-teaming-kc-5",
        prompt:
          "Which operating loop best demonstrates that a red-teaming program's findings are actually being used, rather than collected in a report nobody reads?",
        options: [
          "Publish a quarterly red-team report summarizing attack counts, and let each team decide independently whether to act on it.",
          "Track only the number of attacks attempted per month as the program's KPI, since volume proves the adversarial pressure is real.",
          "Triage every confirmed finding by severity, land fixes in safety fine-tuning data, guardrail rules, and filters, add each fixed attack to the regression suite, feed novel production attacks back into the corpus, and monitor jailbreak-success and false-refusal rates so fixes do not over-correct.",
        ],
        correct: 2,
        feedback:
          "Correct. The closed loop wires findings into training data, guardrail rules, filters, and a regression suite, with production monitoring of jailbreak success and false-refusal rates completing the cycle.",
      },
    ],
  },
  "ch24-safety-helpfulness-tradeoff": {
    objectives: [
      "Operate content safety as a monitored production function with incident response and policy upkeep.",
      "Measure harmful-allowed and benign-refused rates as separate first-class metrics.",
      "Tune the safety/helpfulness operating point deliberately with intent-aware classifiers and graceful responses.",
    ],
    sections: [
      {
        heading: "Safety operations in production",
        paragraphs: [
          "Once the system is live, safety is an operations discipline. Teams monitor violation rate, jailbreak success rate, and false-refusal rate; run an incident-response process when a novel attack appears; and keep policies and classifiers updated as both the product and the threat landscape change. Guardrails are software that decays, not a one-time configuration.",
          "Policy and classifier upkeep is continuous work. New harm categories, product features, and attack patterns all shift what the guardrails must catch, and yesterday's rules quietly lose precision. A safety program without an update path drifts toward either more harm or more over-refusal.",
        ],
      },
      {
        heading: "The two-axis measurement",
        paragraphs: [
          "The central tension in content safety is over-refusal. Aggressive guardrails reject benign requests — frustrating users and damaging utility — while loose ones let harm through. These are two different failure modes with two different costs, and collapsing them into one safety dial makes both invisible.",
          "The fix is measurement on both axes: a harmful-allowed rate that counts safety failures, and a benign-refused rate that counts false refusals of legitimate use. Optimizing only the first produces a useless product; optimizing only the second produces an unsafe one. Both metrics must exist, be reviewed, and be tuned deliberately.",
        ],
      },
      {
        heading: "Attacking over-refusal at its sources",
        paragraphs: [
          "Most over-refusal comes from blunt input filters and an over-cautious model refusing anything near a sensitive topic. Keyword blocks cannot distinguish a nursing student asking about a drug interaction from a request to cause harm, so they refuse both.",
          "The counter is precision: build an evaluation set of benign-but-sensitive prompts — medical information, security education, fiction — and measure false refusals on it directly. Replace keyword blocks with more precise guardrail classifiers and intent-aware policies, so the system reasons about what the user is trying to do rather than which words they used.",
        ],
      },
      {
        heading: "Tuning the operating point",
        paragraphs: [
          "The right balance is product-specific. A children's app and a security-research tool sit at very different points on the safety/helpfulness curve, so the operating point is chosen to fit the product's risk tolerance — not copied from another product or pushed to one extreme.",
          "Every change is validated on both axes: loosening a rule must reduce false refusals without raising the harmful-allowed rate, measured rather than guessed. And where possible, prefer graceful responses over hard refusals — explain the limit and offer a safe alternative — because much of the user complaint is tone, not just blocking.",
        ],
      },
    ],
    example: {
      title: "Worked example: medical-education assistant refusing legitimate questions",
      scenario:
        "After a safety tightening, a medical-education assistant refuses legitimate questions about drug interactions and security-education topics. Complaints spike, and leadership proposes loosening the filters a bit.",
      analysis:
        "Loosening blind optimizes nothing: it might reduce complaints while silently raising harm, or do nothing because the real problem is keyword-level blocking that cannot read intent. The correct move is to measure both axes, build a benign-but-sensitive evaluation set from the actual complaint categories, and find which rules produce the most false refusals per unit of harm prevented.",
      decision:
        "Track harmful-allowed and benign-refused rates separately, build the benign-but-sensitive eval set, replace keyword blocks with intent-aware classifiers, re-tune to an operating point fit for an education product, and validate each loosened rule on both metrics. Where refusal is truly required, respond gracefully by explaining the limit and offering a safe alternative.",
    },
    productionChecklist: [
      "Monitor violation rate, jailbreak success rate, and false-refusal rate in production.",
      "Maintain an incident-response process for novel attacks and a policy/classifier update path.",
      "Keep a benign-but-sensitive evaluation set that quantifies over-refusal.",
      "Prefer intent-aware classifiers over keyword blocks near sensitive topics.",
      "Validate every rule change on both harmful-allowed and benign-refused axes, and use graceful responses where possible.",
    ],
    commonMistakes: [
      "Optimizing only the violation rate while false refusals quietly destroy utility.",
      "Answering over-refusal complaints by loosening filters without measuring both axes.",
      "Using keyword blocks that cannot distinguish benign-but-sensitive intent from harm.",
      "Copying one universal operating point across products with very different risk tolerances.",
    ],
    knowledgeChecks: [
      {
        id: "ch24-safety-helpfulness-tradeoff-kc-1",
        prompt:
          "A dashboard tracks a single safety score for the assistant, and the team celebrates as it climbs. Why does the chapter insist on splitting this into two separate metrics, and what are they?",
        options: [
          "One score is fine as long as it is weighted toward severe harms; the split is mainly a reporting preference for different audiences.",
          "Safety failures and over-refusal are different failure modes with different costs, so harmful-allowed rate and benign-refused rate must be tracked separately — optimizing only one produces either an unsafe or a useless product.",
          "The two metrics should be precision and recall of the input classifier, because every safety outcome flows from that first layer.",
        ],
        correct: 1,
        feedback:
          "Correct. Both axes must be measured — harmful-allowed and benign-refused — because optimizing only safety produces a useless product and optimizing only helpfulness produces an unsafe one.",
      },
      {
        id: "ch24-safety-helpfulness-tradeoff-kc-2",
        prompt:
          "After a safety tightening, a medical-education assistant starts refusing legitimate drug-interaction questions and user complaints spike. Which diagnostic step pinpoints the actual cause before any rule is loosened?",
        options: [
          "Survey users about satisfaction and loosen whichever rules they dislike most, since the complaints define the problem.",
          "Roll back the entire tightening to the previous version, because any change that raises complaints was a net mistake.",
          "Build a benign-but-sensitive evaluation set from the complaint categories — medical information, security education, fiction — measure false refusals on it, and identify which blunt keyword blocks or over-cautious behaviors produce the most false refusals per unit of harm prevented.",
        ],
        correct: 2,
        feedback:
          "Correct. Most over-refusal comes from blunt input filters and an over-cautious model, and a benign-but-sensitive eval set quantifies false refusals before anything is tuned.",
      },
      {
        id: "ch24-safety-helpfulness-tradeoff-kc-3",
        prompt:
          "A children's app and a security-research tool are given identical guardrail configurations to keep operations simple. Which failure pattern does the chapter predict from this decision?",
        options: [
          "One universal operating point cannot fit both risk tolerances: the children's app ends up under-protected or the research tool over-refuses legitimate work, because the right point on the safety/helpfulness curve is product-specific.",
          "Both products will slowly drift unsafe, because shared configurations cannot be updated independently when new attacks appear.",
          "The input classifier's accuracy will degrade, because training data from two products with different vocabularies poisons the model.",
        ],
        correct: 0,
        feedback:
          "Correct. The operating point must fit the product's risk tolerance — a children's app and a security-research tool sit very differently on the safety/helpfulness curve.",
      },
      {
        id: "ch24-safety-helpfulness-tradeoff-kc-4",
        prompt:
          "Support leadership proposes resolving over-refusal complaints by relaxing input filters gradually while watching only the violation-rate dashboard. Why is that plan rejected in favor of two-sided validation?",
        options: [
          "It should be rejected because filters must never be loosened once set; the correct response is better refusal messaging.",
          "It is actually the right plan, because the violation rate is the only metric that measures real harm to users.",
          "It watches one axis blind: loosening can silently raise harm or fail to fix the real cause, so each relaxed rule must be validated on both harmful-allowed and benign-refused rates, with intent-aware classifiers replacing keyword blocks rather than simply weakening them.",
        ],
        correct: 2,
        feedback:
          "Correct. Loosening a rule must reduce false refusals without raising the harmful-allowed rate — measured on both axes, not guessed from one dashboard.",
      },
      {
        id: "ch24-safety-helpfulness-tradeoff-kc-5",
        prompt:
          "After retuning the guardrails, which release validation best demonstrates the new operating point is an improvement rather than a hidden regression on either side of the trade-off?",
        options: [
          "Compare the new violation rate against the old threshold and ship if it is lower, since safety is the primary axis.",
          "Measure harmful-allowed and benign-refused rates together on representative eval sets including benign-but-sensitive prompts, confirm the loosened rules cut false refusals without raising harm, and prefer graceful responses that explain limits and offer safe alternatives where refusal remains necessary.",
          "Run an A/B test on overall user engagement and ship whichever variant wins, because engagement captures both sides of the trade-off automatically.",
        ],
        correct: 1,
        feedback:
          "Correct. Validate changes on both axes with benign-but-sensitive evals, and prefer graceful responses over hard refusals since much of the complaint is tone, not just blocking.",
      },
    ],
  },
};

export const chapter24Practice: CatalogPracticeUnit[] = [
  {
    id: "ch24-24-2-1",
    chapter: 24,
    chapterTitle: "Safety, Guardrails, and Red-Teaming",
    title: "Design a guardrail architecture for an LLM product",
    pages: "149",
    route: "/practice/safety-guardrails-and-red-teaming/design-a-guardrail-architecture-for-an-llm-product",
    competencies: ["guardrails", "injection defense", "red teaming", "safety/helpfulness trade-offs"],
    question:
      "Design the safety/guardrail architecture for a customer-facing LLM application. What are the layers, and why is each one necessary? How do you keep them testable in production?",
    options: [
      {
        text: "Build defense-in-depth because any single layer fails: a fast guardrail-model classifier screens inputs for disallowed content, injection patterns, and PII; the safety-aligned model (RLHF/DPO plus safety fine-tuning) refuses harmful requests but is never relied on alone; outputs are scanned for toxicity, PII leakage, policy violations, and groundedness in RAG; and every tool action is authorized against the user's permissions, human-confirmed when high-impact, and sandboxed — with each layer independently tested and monitored on violation, jailbreak-success, and false-refusal rates.",
        correct: true,
        feedback:
          "Correct. This matches the staff-level answer: layered input/model/output/action guardrails, dedicated guardrail models kept separate from the main model, per-layer testing and monitoring, and both harm and over-refusal measured as their own metrics.",
      },
      {
        text: "Put a comprehensive safety policy into the system prompt and add a moderation filter on user input; the model's alignment training handles everything the filter misses.",
        correct: false,
        feedback:
          "This is the junior pattern the chapter warns about — a safety prompt plus one filter leaves retrieved content, generated output, and tool actions unguarded.",
      },
      {
        text: "Centralize all safety decisions in the main model so there is one policy surface, and have it self-review each response before returning it to the user.",
        correct: false,
        feedback:
          "Self-policing inherits the same jailbreak that compromises the model; dedicated guardrail models are cheaper, swappable, and not subject to the same attack.",
      },
    ],
  },
  {
    id: "ch24-24-2-2",
    chapter: 24,
    chapterTitle: "Safety, Guardrails, and Red-Teaming",
    title: "How do you defend against prompt injection in a RAG/agent system?",
    pages: "149",
    route: "/practice/safety-guardrails-and-red-teaming/how-do-you-defend-against-prompt-injection-in-a-rag-agent-system",
    competencies: ["guardrails", "injection defense", "red teaming", "safety/helpfulness trade-offs"],
    question:
      "Retrieved documents or tool outputs may contain malicious instructions. How do you defend against indirect prompt injection in a RAG or agent system?",
    options: [
      {
        text: "Add explicit instructions telling the model to ignore any commands found in retrieved content, and retrain the model on injection examples until the attack success rate reaches zero.",
        correct: false,
        feedback:
          "There is no complete fix for injection, so zero success is not a credible target; telling the model to ignore injected instructions is the junior answer this question is designed to expose.",
      },
      {
        text: "Eliminate untrusted content from the architecture: disable external retrieval and restrict the agent to a fixed, reviewed knowledge base and a small allowlist of prompts.",
        correct: false,
        feedback:
          "This abolishes the product instead of defending it — RAG and agents exist to use untrusted content, and the expected answer is to contain the risk, not remove the capability.",
      },
      {
        text: "Accept that injection has no complete fix and design to limit blast radius: delimit untrusted content and frame it as data not instructions, classify inputs and tool inputs/outputs for injection and exfiltration patterns, enforce least-privilege tools with human confirmation for high-impact or irreversible actions, run execution in a network-isolated sandbox, audit every tool call, and red-team continuously with known injection payloads as a launch gate.",
        correct: true,
        feedback:
          "Correct. This is the containment-over-prevention posture: trust separation and classifiers raise attacker cost, while least-privilege tools, confirmation, sandboxing, and auditing ensure a hijacked model still cannot read secrets, act dangerously unconfirmed, or leak data.",
      },
    ],
  },
  {
    id: "ch24-24-2-3",
    chapter: 24,
    chapterTitle: "Safety, Guardrails, and Red-Teaming",
    title: "How do you run a red-teaming program?",
    pages: "150",
    route: "/practice/safety-guardrails-and-red-teaming/how-do-you-run-a-red-teaming-program",
    competencies: ["guardrails", "injection defense", "red teaming", "safety/helpfulness trade-offs"],
    question:
      "How would you set up red-teaming for an LLM system, and how do the findings get used?",
    options: [
      {
        text: "Schedule a focused pre-launch exercise where the team tries known jailbreak prompts, fix what comes up, and treat red-teaming as complete once the launch checklist passes.",
        correct: false,
        feedback:
          "Trying some jailbreak prompts before launch is the junior pattern; new jailbreaks emerge constantly, so a one-time checklist goes stale within weeks and cannot protect a deployed system.",
      },
      {
        text: "Run red-teaming as a continuous program with three attack sources — manual expert probing, automated LLM-generated attacks across harm categories, and curated suites of known jailbreak families — plus injection and exfiltration coverage for RAG/agent surfaces; triage every confirmed finding by severity like a security bug with launch-blocking gates; land fixes in safety fine-tuning data, guardrail rules, and filters; and add every fixed attack to a regression suite while monitoring jailbreak-success and false-refusal rates in production.",
        correct: true,
        feedback:
          "Correct. This captures the closed loop: continuous multi-source attacks, severity triage with launch gates, multi-layer fixes, regression suites so vulnerabilities stay fixed, and production monitoring on both harm and over-refusal.",
      },
      {
        text: "Outsource adversarial testing to a bug-bounty program and your moderation vendor, then fold reported issues into a blocklist as they surface in production traffic.",
        correct: false,
        feedback:
          "Reactive third-party-only testing misses the core requirements: owned continuous coverage, severity triage with launch gates, and fixes wired into training data, guardrails, and regression suites.",
      },
    ],
  },
  {
    id: "ch24-24-2-4",
    chapter: 24,
    chapterTitle: "Safety, Guardrails, and Red-Teaming",
    title: "How do you balance safety against over-refusal?",
    pages: "151",
    route: "/practice/safety-guardrails-and-red-teaming/how-do-you-balance-safety-against-over-refusal",
    competencies: ["guardrails", "injection defense", "red teaming", "safety/helpfulness trade-offs"],
    question:
      "Users complain the model refuses too much, but you can't loosen safety carelessly. How do you manage this trade-off?",
    options: [
      {
        text: "Make the trade-off measurable on both axes: track harmful-allowed and benign-refused rates as separate metrics, build a benign-but-sensitive evaluation set (medical information, security education, fiction) to quantify over-refusal, replace blunt keyword blocks with intent-aware classifiers, choose an operating point that fits the product's risk tolerance, validate every loosened rule on both axes, and prefer graceful responses that explain limits and offer safe alternatives over hard refusals.",
        correct: true,
        feedback:
          "Correct. This is the two-sided optimization: over-refusal is a measured product harm, diagnosed with benign-but-sensitive evals and fixed with intent-aware classifiers, with every change validated on both metrics.",
      },
      {
        text: "Hold the guardrails steady and invest in user education explaining why refusals happen; a short-term satisfaction dip is the unavoidable price of a safe product.",
        correct: false,
        feedback:
          "Treating over-refusal as pure communication ignores that benign-refused is a real, measurable product harm — optimizing only safety produces a useless product.",
      },
      {
        text: "Relax the input filters incrementally and watch the violation-rate dashboard, loosening further as long as violations stay below the historical threshold.",
        correct: false,
        feedback:
          "This optimizes one axis blind; each loosened rule must be validated on both harmful-allowed and benign-refused rates, not by watching harm alone.",
      },
    ],
  },
];
