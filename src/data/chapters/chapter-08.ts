import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter08Module: LearningModule = {
  id: "chapter-8-security-and-enterprise-rag",
  title: "Security & Enterprise RAG",
  description:
    "Enterprise requirements reshape RAG design beyond answer quality: tenant isolation, row-level permissions, sensitive-content handling, auditability, and data governance decide whether a system can ship inside a regulated organization.",
  duration: "3 lessons",
  lessons: [
    {
      id: "ch8-access-control-models",
      title: "Access Control Models",
      prompt: "Choose between role-based and attribute-based authorization",
      question:
        "An enterprise RAG assistant serves two coarse document classes - finance docs for analysts and technical docs for engineers - and must now also enforce rules like 'visible to legal staff with clearance level 3 or higher.' Which authorization design fits both requirements?",
      options: [
        "Use role-based access control for everything, adding a new role for each combination of department, clearance, and tenure as rules arrive.",
        "Keep RBAC for the broad document classes and use attribute-based access control for rules that depend on user and document attributes such as department and clearance.",
        "Skip a formal model: retrieve broadly and let the prompt tell the model which documents the user is allowed to see.",
      ],
      correct: 1,
      feedback:
        "Strong choice. RBAC covers the coarse document classes, while ABAC evaluates user and document attributes - the chapter's basis for row-level security.",
      explanation:
        "The chapter defines RBAC as access by user role (an analyst reads finance docs) and ABAC as access by document and user attributes, which is more fine-grained and enables row-level security. A clearance-plus-department rule is an attribute rule; expressing it as roles forces one role per combination. Prompt instructions are not enforcement - the chapter's architecture applies the authorization filter server-side before retrieval.",
      takeaways: [
        "RBAC fits stable, coarse document classes that map cleanly to job functions.",
        "ABAC enables row-level security by comparing user and document attributes.",
        "Enforce authorization inside the retrieval query, not in the prompt.",
      ],
      model: ["Classify the rule", "Pick RBAC or ABAC", "Enforce at retrieval"],
      source: { chapter: 8, sections: ["8.1.1"], pages: "59" },
    },
    {
      id: "ch8-multi-tenant-isolation",
      title: "Multi-tenant Isolation",
      prompt: "Pick an isolation pattern that survives your tenant count",
      question:
        "A SaaS knowledge product must onboard thousands of tenants, one of which is a regulated customer demanding the strongest isolation. Which isolation design best matches these constraints?",
      options: [
        "Collection-per-tenant for every customer, since complete isolation is the most secure option available.",
        "One shared index for all tenants, with the tenant_id used for filtering supplied by the client on each request.",
        "Namespace or partition per tenant with a mandatory server-side metadata filter as the default, reserving collection-per-tenant for the regulated customer.",
      ],
      correct: 2,
      feedback:
        "Strong choice. Shared partitions with an enforced metadata filter scale to thousands of tenants, while the highest-sensitivity tenant justifies a dedicated collection.",
      explanation:
        "The chapter lists three options: collection-per-tenant (complete isolation, highest security, expensive at scale), namespace/partition-per-tenant (shared infrastructure with a metadata filter enforcing isolation), and row-level filtering (every query includes a mandatory tenant_id filter). With thousands of tenants, dedicated collections for everyone do not scale; the regulated tenant is exactly the case the dedicated option exists for. Client-supplied tenant IDs are never trusted - identity comes from a validated JWT server-side.",
      takeaways: [
        "Collection-per-tenant maximizes isolation but is expensive at scale.",
        "Namespaces and row-level filters share infrastructure under a mandatory tenant filter.",
        "Inject the tenant filter server-side from the validated identity, never from the client.",
      ],
      model: ["Count the tenants", "Tier the sensitivity", "Filter every query"],
      source: { chapter: 8, sections: ["8.1.2"], pages: "59" },
    },
    {
      id: "ch8-pii-filtering",
      title: "PII Filtering",
      prompt: "Keep personal data out of the index and out of the answer",
      question:
        "A support RAG system ingests tickets full of customer emails and phone numbers, and generated answers may quote ticket text. Where should PII controls be placed?",
      options: [
        "Detect PII at ingestion and redact it before embedding, then scan LLM outputs for accidental exposure before returning answers.",
        "Embed tickets as-is and rely on the LLM to avoid repeating personal data in its answers.",
        "Scan only the final answers, leaving the raw personal data stored in the vector index.",
      ],
      correct: 0,
      feedback:
        "Strong choice. The chapter prescribes exactly these two control points: redact before embedding, and scan outputs before they reach the user.",
      explanation:
        "The chapter recommends tools such as Microsoft Presidio or AWS Comprehend to detect PII at ingestion and redact it before embedding, and to scan LLM outputs for accidental PII exposure. Once personal data is embedded it persists in the index and can be retrieved and quoted; trusting the model's restraint is not a control.",
      takeaways: [
        "Redact PII at ingestion, before text is embedded and indexed.",
        "Scan every generated output for accidental PII exposure.",
        "Use dedicated detectors such as Presidio or Comprehend, not model goodwill.",
      ],
      model: ["Detect at ingestion", "Redact before embedding", "Scan the output"],
      source: { chapter: 8, sections: ["8.1.3"], pages: "59" },
    },
  ],
};

export const chapter08CourseContent: Record<string, LessonCourseContent> = {
  "ch8-access-control-models": {
    objectives: [
      "Distinguish RBAC from ABAC and the rule complexity each model can express.",
      "Decide where in the RAG path authorization must be enforced.",
      "Recognize role explosion and post-retrieval filtering as failure patterns.",
    ],
    sections: [
      {
        heading: "Two models for authorization",
        paragraphs: [
          "RBAC grants access based on the user's role: an analyst can read finance documents while an engineer can read technical documents. It is simple to reason about and simple to audit when document classes map cleanly onto job functions, which is why it remains the default starting point for enterprise systems.",
          "ABAC grants access by evaluating attributes of both the user and the document: department, clearance level, and hire date on the user side; sensitivity, owning team, and allowed departments on the document side. It is more fine-grained than RBAC and is what enables row-level security, where each document effectively carries its own access rule.",
        ],
      },
      {
        heading: "Where the check must happen",
        paragraphs: [
          "Access control is a property of retrieval, not of the prompt. The chapter's enterprise flow shows the sequence: the user presents a JWT, a server-side authorization filter derives tenant and ACL context from it, retrieval runs against the scoped index with that filter applied, and only then do results flow through PII scrubbing and guarding into an answer, with an audit log alongside.",
          "If filtering happens after retrieval - in application code or by instructing the model - unauthorized content has already left the index and entered the request path. The chapter's leakage answer therefore injects the mandatory metadata filter before every vector search, with identity extracted from the validated token rather than accepted from the client.",
        ],
      },
      {
        heading: "Role explosion versus attribute evaluation",
        paragraphs: [
          "A rule such as 'department X with clearance level at least 3, hired before 2024' is painful in pure RBAC: it forces a role per combination of department, clearance band, and tenure, and the role catalog explodes as rules multiply while assignments quietly drift out of date. RBAC stays attractive where document classes are stable and coarse.",
          "ABAC handles the same rule by converting document ACL rules into chunk metadata at ingestion - min_clearance, allowed_departments, max_hire_date - and comparing them at query time against user attributes pulled from the identity provider, such as Okta or Active Directory. The chapter notes that Weaviate, Qdrant, and Pinecone all support the complex metadata filtering this pattern requires.",
        ],
      },
      {
        heading: "Failure modes and validation",
        paragraphs: [
          "The recurring failures are trusting client-supplied user IDs, filtering after retrieval instead of inside the query, letting document metadata that reveals other users' data leak into the prompt, and roles that silently accumulate permissions over time. The chapter's design stance is to assume each layer can fail and to layer the checks so a single failure is not a breach.",
          "Validate authorization like any other subsystem: write tests that attempt cross-role and cross-attribute access through every query path, confirm filters are constructed server-side from validated tokens, and verify that a missed filter is caught by a downstream layer such as output scanning or audit review rather than becoming a silent exposure.",
        ],
      },
    ],
    example: {
      title: "Worked example: contract search for legal and finance",
      scenario:
        "A contract document must be visible only to employees in legal or finance with clearance level at least 3 who were hired before 2024-01-01. A user's IdP token carries clearance 4, department legal, and hire date 2022-05-01.",
      analysis:
        "At ingestion the ACL rule is evaluated into chunk metadata: min_clearance 3, allowed_departments [legal, finance], max_hire_date 2024-01-01. At query time the server extracts the user's attributes from the validated token and builds a filter - min_clearance at most 4, allowed_departments containing legal, max_hire_date on or after 2022-05-01 - so this user's query can retrieve the chunk while under-clearance or wrong-department users never see it as a candidate.",
      decision:
        "Use ABAC with ingestion-time attribute conversion and a query-time metadata filter built from IdP attributes; keep RBAC for the coarse split between document classes where it remains sufficient.",
    },
    productionChecklist: [
      "Extract user identity and attributes from a validated server-side token, never from client input.",
      "Evaluate document ACL rules into chunk metadata at ingestion time.",
      "Build the authorization filter into the vector search query itself.",
      "Confirm the vector store supports the complex metadata filtering the rules require.",
      "Keep other users' metadata out of prompts and log every access for forensic review.",
    ],
    commonMistakes: [
      "Creating a new role for every combination of department, clearance, and tenure until the catalog is unmanageable.",
      "Accepting a user ID from the client instead of reading it from a validated JWT.",
      "Filtering unauthorized chunks after retrieval instead of inside the query.",
      "Assuming one access check is enough instead of layering filters, prompt hygiene, output scanning, and audit.",
    ],
    knowledgeChecks: [
      {
        id: "ch8-access-control-models-kc-1",
        prompt: "An enterprise RAG portal starts with a simple rule - analysts read finance documents and engineers read technical documents - and leadership asks which access model to adopt first. Which design is the best fit?",
        options: [
          "Adopt ABAC immediately with per-user attribute policies for every document class, since it is the more expressive model.",
          "Adopt RBAC, mapping each stable document class to a role such as analyst or engineer.",
          "Avoid both models and check the user's department in the frontend before showing search results.",
        ],
        correct: 1,
        feedback: "The chapter's RBAC example is exactly this case - role-based access for stable classes like finance versus technical docs. ABAC's fine-grained attributes earn their complexity when rules become per-row; frontend checks are not enforcement.",
      },
      {
        id: "ch8-access-control-models-kc-2",
        prompt: "A RAG system evaluates document ACL rules into chunk metadata at ingestion: one chunk carries min_clearance 3, allowed_departments [legal, finance], and max_hire_date 2024-01-01. A user token shows clearance 2, department legal, hired in 2021. What happens at query time?",
        options: [
          "The chunk is excluded, because the user's clearance 2 does not satisfy the chunk's min_clearance 3 attribute comparison.",
          "The chunk is retrieved, because the user's department matches the allowed_departments list, which is the primary rule.",
          "The chunk is retrieved but flagged, because hire-date and clearance rules only apply to audit, not to retrieval.",
        ],
        correct: 0,
        feedback: "The chapter's ABAC filter compares every attribute - min_clearance must be at most the user's clearance. Failing one comparison excludes the chunk at retrieval; matches on other attributes do not compensate.",
      },
      {
        id: "ch8-access-control-models-kc-3",
        prompt: "After a release, an engineer receives an answer quoting a finance document they should not see. The retrieval code applies a role check, but only on results after the vector search returns. What is the most likely design flaw?",
        options: [
          "The embedding model memorized the finance document and regenerated it from weights rather than from retrieval.",
          "The JWT validator rejected the token and the system fell back to a default permissive role.",
          "The authorization filter runs after retrieval instead of inside the query, so unauthorized chunks were already candidates in the request path.",
        ],
        correct: 2,
        feedback: "The chapter's leakage answer injects the mandatory metadata filter before every vector search. Post-retrieval filtering lets unauthorized content leave the index, which is exactly the failure this incident shows.",
      },
      {
        id: "ch8-access-control-models-kc-4",
        prompt: "A reviewer argues that ABAC is over-engineering for a new enterprise product and proposes one role per document as a simpler alternative. Which response best defends the access-model choice?",
        options: [
          "Agree - one role per document is strictly more fine-grained than ABAC and therefore always safer.",
          "Keep coarse roles where classes are stable, but use ABAC when rules combine user and document attributes, since a role per rule combination explodes as rules multiply.",
          "Reject both - access rules should live in the system prompt so they can be edited without redeploying the service.",
        ],
        correct: 1,
        feedback: "The chapter positions RBAC for coarse classes and ABAC for fine-grained row-level rules; encoding attribute rules as roles forces one role per combination. Prompt text is not an enforcement layer.",
      },
      {
        id: "ch8-access-control-models-kc-5",
        prompt: "Before launching an enterprise RAG service, the team must prove its authorization layer works. Which validation plan best matches the chapter's guidance?",
        options: [
          "Attempt cross-role and cross-attribute access through every query path, confirm filters are built server-side from validated tokens, and verify a missed filter is caught by output scanning or audit review.",
          "Run the standard retrieval recall benchmark, since a retriever that ranks well will also filter permissions correctly.",
          "Ask a small group of beta users to report any documents they believe they should not be able to see.",
        ],
        correct: 0,
        feedback: "The chapter's defense-in-depth stance assumes each layer can fail, so validation must attack each layer directly: server-side token-derived filters plus downstream output scanning and audit logging as the safety net.",
      },
    ],
  },
  "ch8-multi-tenant-isolation": {
    objectives: [
      "Compare collection-per-tenant, namespace-per-tenant, and row-level filtering.",
      "Match the isolation pattern to tenant count, security tier, and cost.",
      "Ensure every query carries a mandatory, server-side tenant filter.",
    ],
    sections: [
      {
        heading: "The isolation requirement",
        paragraphs: [
          "In a multi-tenant RAG product, one tenant's documents must never be visible to another tenant. Isolation is a retrieval property: it has to hold for every vector search the system issues, not just at the API boundary, because a single unfiltered query is enough to leak a neighbor's data.",
          "The chapter's enterprise architecture makes the flow explicit: the user's JWT feeds a server-side authorization filter carrying tenant and ACL context, retrieval executes against the scoped index with that filter applied, and the result passes through PII scrubbing and audit before an answer is returned.",
        ],
      },
      {
        heading: "Three isolation patterns",
        paragraphs: [
          "Collection-per-tenant gives each tenant its own collection or index. It provides complete isolation and the highest security, but it is expensive at scale: thousands of tenants would mean thousands of indexes to provision, monitor, and pay for.",
          "Namespace or partition per tenant shares infrastructure across tenants while a metadata filter enforces isolation within the shared system. Row-level filtering is the lightest form: one shared index where every query includes a mandatory tenant_id filter so a chunk is only ever a candidate for its owning tenant.",
        ],
      },
      {
        heading: "Choosing by tenant count and sensitivity tier",
        paragraphs: [
          "The choice trades isolation strength against cost and operational sprawl. A large base of small tenants makes per-tenant collections impractical, while a regulated tenant with a demanding compliance posture can justify the dedicated collection and its stronger boundary.",
          "A common production compromise is shared namespace isolation as the default, with collection-per-tenant reserved for the highest-sensitivity tier. Whatever the pattern, the tenant filter must be injected server-side from the validated identity; a tenant_id supplied by the client is an attack vector, not a control.",
        ],
      },
      {
        heading: "Failure modes and validation",
        paragraphs: [
          "Typical failures are a code path that issues a vector search without the tenant filter, trusting a tenant identifier that arrived from the client, and assuming shared-infrastructure isolation is equivalent to dedicated isolation for every tenant tier. Each turns an architectural promise into a convention that one refactor can break.",
          "Validate with cross-tenant leakage tests that attempt to retrieve another tenant's chunks through every query path, including admin and debug tooling. Verify the filter is mandatory rather than opt-in, and log every retrieval with tenant context and retrieved document IDs so a suspected leak can be investigated forensically.",
        ],
      },
    ],
    example: {
      title: "Worked example: SaaS knowledge platform",
      scenario:
        "A platform hosts 2,000 small tenants plus one regulated healthcare tenant, all querying the same vector database fleet.",
      analysis:
        "A collection per tenant would mean 2,000 indexes to provision, monitor, and pay for - exactly the scale cost the chapter warns about. Namespaces with a mandatory tenant_id metadata filter keep shared infrastructure efficient, while the healthcare tenant's sensitivity tier warrants its own encrypted collection, mirroring the restricted-tier controls in the chapter's sensitive-document model.",
      decision:
        "Default to namespace-per-tenant with a server-side mandatory filter, place the healthcare tenant in a dedicated collection, and run cross-tenant leakage tests on every retrieval path before launch.",
    },
    productionChecklist: [
      "Tag every chunk with tenant identity at ingestion.",
      "Inject the tenant filter server-side from the validated JWT on every query.",
      "Reserve dedicated collections for tenants whose sensitivity tier justifies them.",
      "Run cross-tenant leakage tests against every retrieval path, including internal tooling.",
      "Log queries with tenant context and retrieved document IDs for forensic review.",
    ],
    commonMistakes: [
      "Provisioning collection-per-tenant for thousands of tenants without a cost or operations plan.",
      "Letting the client send the tenant_id that is used for filtering.",
      "Making the tenant filter optional on supposedly trusted code paths.",
      "Treating shared-infrastructure isolation as adequate for the most sensitive tenant tier.",
    ],
    knowledgeChecks: [
      {
        id: "ch8-multi-tenant-isolation-kc-1",
        prompt: "A B2B startup expects fifty small tenants this year and wants strong isolation guarantees without dedicating an index to each customer. Which pattern best fits this profile?",
        options: [
          "Row-level filtering, where every query carries a mandatory tenant_id filter on a fully shared index.",
          "Collection-per-tenant, because complete isolation is always worth its cost at any tenant count.",
          "Namespace or partition per tenant on shared infrastructure, with a metadata filter enforcing isolation between tenants.",
        ],
        correct: 2,
        feedback: "The chapter describes namespace/partition-per-tenant as shared infrastructure with filter-enforced isolation - the middle option between costly collection-per-tenant and the lightest row-level filtering.",
      },
      {
        id: "ch8-multi-tenant-isolation-kc-2",
        prompt: "In the SaaS knowledge platform example, 2,000 small tenants share the fleet while one regulated healthcare tenant needs the strongest controls. Which design applies the chapter's patterns correctly?",
        options: [
          "Use namespaces with a mandatory server-side tenant filter for the small tenants, and a dedicated collection for the healthcare tenant's sensitivity tier.",
          "Put all 2,001 tenants in one index with row-level tenant_id filters, because uniformity simplifies operations.",
          "Give every tenant its own collection, because a regulated tenant exists somewhere in the fleet.",
        ],
        correct: 0,
        feedback: "The chapter's trade-off: collection-per-tenant is the highest-security option but expensive at scale, so it is reserved for the tier that justifies it; shared namespaces under an enforced filter serve the long tail.",
      },
      {
        id: "ch8-multi-tenant-isolation-kc-3",
        prompt: "A tenant reports seeing another tenant's document titles in answers. The platform uses namespaces, and an investigation finds one internal analytics endpoint that issues vector searches without the tenant filter. What does this incident illustrate?",
        options: [
          "Namespaces provide no isolation, so the platform must migrate every tenant to dedicated collections.",
          "Isolation must hold on every query path - one unfiltered code path is enough to leak a neighbor's data, so the filter has to be mandatory everywhere.",
          "The embedding model mixed the two tenants' vectors, so re-embedding both namespaces will fix the leak.",
        ],
        correct: 1,
        feedback: "The chapter makes isolation a retrieval property that must hold for every vector search, not just the main API path; the fix is a mandatory server-side filter on all paths, including internal tooling.",
      },
      {
        id: "ch8-multi-tenant-isolation-kc-4",
        prompt: "An architect objects that row-level filtering is weaker than collection-per-tenant and should never be used in any system. Which response best states the chapter's trade-off?",
        options: [
          "Row-level filtering is equally strong as dedicated collections, so the objection has no technical basis at all.",
          "The objection is correct - the only defensible pattern for any multi-tenant system is collection-per-tenant.",
          "Row-level filtering trades some isolation strength for shared-infrastructure efficiency, and it is acceptable when every query carries a mandatory server-side tenant_id filter.",
        ],
        correct: 2,
        feedback: "The chapter lists all three patterns as legitimate options with an explicit cost-versus-isolation trade: row-level filtering works when the mandatory tenant_id filter is enforced on every query, injected server-side.",
      },
      {
        id: "ch8-multi-tenant-isolation-kc-5",
        prompt: "Before onboarding its first enterprise tenants, a team must demonstrate that tenant isolation actually holds. Which pre-launch evidence best matches the chapter's expectations?",
        options: [
          "Cross-tenant leakage tests that attempt to retrieve another tenant's chunks through every query path, plus logs recording tenant context and retrieved document IDs for each query.",
          "A load test showing p99 latency stays within budget when thousands of tenants share the index.",
          "A signed document from the vector database vendor certifying that namespaces are secure by design.",
        ],
        correct: 0,
        feedback: "The chapter's leakage answer pairs mandatory filters with audit logging of every query and retrieved document ID; direct leakage-attempt tests on every path are the evidence that isolation holds, not latency numbers or vendor assurances.",
      },
    ],
  },
  "ch8-pii-filtering": {
    objectives: [
      "Place PII detection at both ingestion time and output time.",
      "Explain why redaction must happen before embedding.",
      "Use dedicated PII detection tooling rather than relying on model behavior.",
    ],
    sections: [
      {
        heading: "Two control points",
        paragraphs: [
          "The chapter prescribes two PII control points. At ingestion, detect PII and redact it before the text is embedded. At output, scan LLM responses for accidental PII exposure before returning them to the user.",
          "Both points are needed because the risks differ. Ingestion-time redaction keeps personal data out of the vector index entirely, while output scanning catches the cases where sensitive content still reaches a generated answer despite upstream controls.",
        ],
      },
      {
        heading: "Redact before embedding",
        paragraphs: [
          "Once personal data is embedded, it is baked into the index: it can be retrieved, quoted, and reconstructed by anyone authorized to query that corpus. Redaction before embedding means the index never holds the raw PII in the first place, which is far stronger than filtering it later.",
          "Detection should use dedicated tooling - the chapter names Microsoft Presidio and AWS Comprehend - which recognize entities such as emails, phone numbers, and other personal identifiers far more reliably than hoping the embedding model ignores them.",
        ],
      },
      {
        heading: "Scan the generated answer",
        paragraphs: [
          "Even with a clean index, outputs deserve a final check: scan the generated response for PII patterns before returning it. In the chapter's enterprise diagram this is the PII scrub and guard stage that sits between retrieval and the answer.",
          "Output scanning also complements access control. The chapter's data-leakage answer includes scanning responses for patterns matching other users' documents, so the output stage doubles as a safety net when an upstream authorization layer fails.",
        ],
      },
      {
        heading: "Failure modes and validation",
        paragraphs: [
          "The failure patterns are personal data embedded into the index at ingestion, relying on the LLM to avoid repeating personal data on its own, scanning outputs while raw PII remains retrievable in the store, and treating detection as a one-time cleanup rather than a permanent pipeline stage.",
          "Validate the detector against representative documents from the real corpus, verify in the ingestion path that redaction runs before embedding, and probe the system with queries designed to elicit personal data. Keep audit evidence of what was detected and scrubbed so the control itself is provable.",
        ],
      },
    ],
    example: {
      title: "Worked example: support ticket assistant",
      scenario:
        "Support tickets routinely contain customer emails and phone numbers. The RAG system indexes tickets and drafts answers that may quote ticket text back to agents.",
      analysis:
        "If tickets are embedded as-is, personal data persists in the index and can surface in any answer that retrieves the ticket. Running Presidio or Comprehend over the ingestion stream and redacting before embedding keeps the index clean, and a final output scan catches anything that still slips into a generated reply.",
      decision:
        "Add PII detection with redaction to the ingestion pipeline ahead of embedding, an output scan ahead of the response, and log detection events into the audit trail.",
    },
    productionChecklist: [
      "Run a dedicated PII detector such as Microsoft Presidio or AWS Comprehend on the ingestion stream.",
      "Redact detected PII before text is embedded and indexed.",
      "Scan every generated answer for accidental PII exposure before returning it.",
      "Test detectors on representative production documents, not only synthetic samples.",
      "Record detection and scrub events in the audit trail.",
    ],
    commonMistakes: [
      "Embedding raw text first and planning to clean the index later.",
      "Trusting the embedding model or LLM to ignore personal data on its own.",
      "Scanning only outputs while the index still holds raw PII.",
      "Treating PII detection as a launch-time task instead of a permanent pipeline stage.",
    ],
    knowledgeChecks: [
      {
        id: "ch8-pii-filtering-kc-1",
        prompt: "A healthcare-adjacent RAG product indexes clinical notes containing patient identifiers. The team can only add one new pipeline stage this quarter. Which single stage does the chapter prioritize first?",
        options: [
          "An output scanner that blocks answers containing PII patterns before responses reach users.",
          "Ingestion-time PII detection that redacts personal data before the text is embedded and indexed.",
          "A prompt instruction telling the model never to repeat names, emails, or phone numbers.",
        ],
        correct: 1,
        feedback: "The chapter's first PII control is detection at ingestion with redaction before embedding, because once personal data is embedded it persists in the index; output scanning is the second, complementary layer.",
      },
      {
        id: "ch8-pii-filtering-kc-2",
        prompt: "In the support ticket example, tickets with customer emails and phone numbers are embedded as-is, and answers quote ticket text. Which remediation follows the chapter's two control points?",
        options: [
          "Keep the existing index and add an output scanner, since blocking quoted PII in answers is sufficient protection.",
          "Move the tickets to a separate collection and encrypt it at rest, leaving the text itself unchanged.",
          "Re-run ingestion with Presidio or Comprehend redacting PII before embedding, rebuild the index, and add an output scan before responses are returned.",
        ],
        correct: 2,
        feedback: "The chapter prescribes both control points: detect and redact at ingestion before embedding, and scan LLM outputs for accidental exposure. PII already embedded must be removed by re-ingesting, not just filtered at the end.",
      },
      {
        id: "ch8-pii-filtering-kc-3",
        prompt: "A security review discovers that customer phone numbers can be retrieved from the vector index even though an output scanner blocks them from final answers. Which failure pattern from this lesson does this describe?",
        options: [
          "Scanning only outputs while raw PII remains stored in the index, so the data is still retrievable inside the system.",
          "Using a detector with too high a recall threshold, causing the scanner to block harmless answers.",
          "Encrypting embeddings at rest, which prevents the output scanner from reading the chunk text.",
        ],
        correct: 0,
        feedback: "This is exactly the lesson's failure pattern: output scanning alone leaves raw PII retrievable in the store. The chapter requires redaction before embedding so the index never holds the raw personal data.",
      },
      {
        id: "ch8-pii-filtering-kc-4",
        prompt: "A product manager pushes back: PII redaction adds ingestion latency and occasionally removes useful context from tickets. Which response best defends the design?",
        options: [
          "Agree to skip redaction for trusted data sources and rely on the output scanner to compensate for the risk.",
          "Accept the trade-off - redaction before embedding is what keeps personal data out of the index permanently, and retrieval or quoting of embedded PII cannot be undone by later filters.",
          "Replace redaction with access control, since only authorized agents can query the ticket index anyway.",
        ],
        correct: 1,
        feedback: "The chapter's rationale for ingestion-time redaction is that embedded PII persists and can be retrieved and quoted later; output scanning is a second layer, not a substitute, and access control does not cover data that should not be stored.",
      },
      {
        id: "ch8-pii-filtering-kc-5",
        prompt: "Before launch, the team must prove the PII controls work on real data rather than on slides. Which validation approach matches this lesson's guidance?",
        options: [
          "Run the detector on a handful of synthetic examples, since production data cannot be used for testing.",
          "Measure answer quality on a benchmark, because a grounded model will naturally avoid exposing personal data.",
          "Test the detector against representative production documents, verify redaction runs before embedding, probe outputs with queries designed to elicit personal data, and log detection events for audit.",
        ],
        correct: 2,
        feedback: "The lesson's validation guidance: representative documents, confirmation that redaction precedes embedding, adversarial probing of outputs, and audit evidence of detections - synthetic-only tests and answer-quality benchmarks prove neither control.",
      },
    ],
  },
};

export const chapter08Practice: CatalogPracticeUnit[] = [
  {
    id: "ch8-8-2-1",
    chapter: 8,
    chapterTitle: "Security & Enterprise RAG",
    title: "How do you prevent data leakage across users?",
    pages: "60",
    route: "/practice/security-and-enterprise-rag/how-do-you-prevent-data-leakage-across-users",
    competencies: ["RBAC/ABAC", "tenant isolation", "PII", "sensitive data", "auditability"],
    question:
      "In a system design interview you are asked: \"User A should never see User B's documents. How do you enforce this at every layer of the RAG stack?\" Which answer earns the strongest rating?",
    options: [
      {
        text: "Add a user filter to the retrieval call and trust the user ID passed in from the client, keeping the design to a single check so it stays simple and fast.",
        correct: false,
        feedback:
          "Trusting a client-supplied ID is exactly what the chapter warns against: identity must come from a validated JWT server-side, and a single layer's failure must not equal a breach.",
      },
      {
        text: "Lay out defense-in-depth: tag every chunk with owner_id and access_group at ingestion, inject a mandatory metadata filter before every vector search using identity from a validated server-side JWT, keep other users' metadata out of the prompt, scan the generated response for cross-user patterns, and log every query with retrieved document IDs for forensic review.",
        correct: true,
        feedback:
          "Correct. The chapter's senior answer layers ingestion tags, a server-side metadata filter, prompt hygiene, output scanning, and audit logging, explicitly assuming any single layer can fail.",
      },
      {
        text: "Encrypt each user's embeddings at rest so documents cannot mix, which removes the need for runtime access checks.",
        correct: false,
        feedback:
          "Encryption at rest protects storage, not query-time visibility; the chapter's answer enforces isolation across the indexing, query, prompt, output, and audit layers.",
      },
    ],
  },
  {
    id: "ch8-8-2-2",
    chapter: 8,
    chapterTitle: "Security & Enterprise RAG",
    title: "How do you implement row-level security in RAG?",
    pages: "60",
    route: "/practice/security-and-enterprise-rag/how-do-you-implement-row-level-security-in-rag",
    competencies: ["RBAC/ABAC", "tenant isolation", "PII", "sensitive data", "auditability"],
    question:
      "A staff-level interviewer asks: \"Design row-level security for a RAG system where a document can have complex access rules - for example, visible only to employees in department X with clearance level at least 3 who were hired before 2024.\" What should the strongest answer include?",
    options: [
      {
        text: "An ABAC pipeline: at ingestion, evaluate document ACL rules into chunk metadata such as min_clearance, allowed_departments, and max_hire_date; at query time, pull the user's attributes from the identity provider via the validated token and build a metadata filter comparing them, enforced inside the vector search - a pattern Weaviate, Qdrant, and Pinecone all support.",
        correct: true,
        feedback:
          "Correct. This is the chapter's staff-level answer: ACLs become metadata at ingestion, user attributes come from the IdP, and the filter is enforced at retrieval rather than as a coarse role check.",
      },
      {
        text: "Define one role per rule combination - for example legal-clearance-3-pre-2024 - and check the user's role before calling the retriever.",
        correct: false,
        feedback:
          "That is the junior 'filter by role' answer the chapter contrasts against; a role per combination explodes as rules multiply and cannot express attribute comparisons like clearance thresholds or hire-date cutoffs.",
      },
      {
        text: "Retrieve a broad candidate set to protect recall, then drop unauthorized chunks in application code just before building the prompt.",
        correct: false,
        feedback:
          "Post-retrieval filtering lets unauthorized content leave the index; the chapter builds the filter from user attributes inside the query itself.",
      },
    ],
  },
  {
    id: "ch8-8-2-3",
    chapter: 8,
    chapterTitle: "Security & Enterprise RAG",
    title: "How do you handle sensitive documents?",
    pages: "61",
    route: "/practice/security-and-enterprise-rag/how-do-you-handle-sensitive-documents",
    competencies: ["RBAC/ABAC", "tenant isolation", "PII", "sensitive data", "auditability"],
    question:
      "The interviewer continues: \"A RAG system contains documents with trade secrets, legal privileged information, and personal health data. How do you handle them differently?\" Which response demonstrates production-grade thinking?",
    options: [
      {
        text: "Encrypt the sensitive documents and otherwise run them through the same index, cache, and model path as everything else.",
        correct: false,
        feedback:
          "'Encrypt them' is the junior answer the chapter calls out; encryption alone leaves caching, logging, and endpoint exposure unaddressed.",
      },
      {
        text: "Apply the strictest controls uniformly to every document so that no classification work is required.",
        correct: false,
        feedback:
          "The chapter's ownership signal is differentiated handling by classification, not one blanket policy; uniform maximum controls waste cost and add friction on public content.",
      },
      {
        text: "Define sensitivity tiers with escalating controls: public needs no restrictions, internal requires authentication, confidential adds RBAC with logged access and no LLM output caching, and restricted/PHI/legal privilege gets a separate encrypted vector index, embeddings generated in a secure enclave, private non-logged LLM endpoints, watermarked output, human-in-the-loop review, and an immutable audit trail.",
        correct: true,
        feedback:
          "Correct. The chapter's senior answer is tiered classification with per-tier controls, from authenticated internal docs up to restricted handling with secure-enclave embedding and immutable audit.",
      },
    ],
  },
  {
    id: "ch8-8-2-4",
    chapter: 8,
    chapterTitle: "Security & Enterprise RAG",
    title: "How do you audit RAG outputs?",
    pages: "61",
    route: "/practice/security-and-enterprise-rag/how-do-you-audit-rag-outputs",
    competencies: ["RBAC/ABAC", "tenant isolation", "PII", "sensitive data", "auditability"],
    question:
      "For a regulated enterprise deployment you are asked: \"How do you implement a comprehensive audit trail for a RAG system?\" Choose the best answer.",
    options: [
      {
        text: "Log each user's raw query text to the standard application log and let the existing log pipeline handle retention.",
        correct: false,
        feedback:
          "'Log the queries' is the junior answer; the chapter stores hashes rather than raw PII text and requires a compliance-grade store, defined retention, and anomaly alerting.",
      },
      {
        text: "Specify a full audit event schema - event ID, timezone-aware timestamp, user and session IDs, SHA-256 hashes of the query and response instead of raw text, retrieved document IDs and scores, model, latency, guardrail flag, sensitivity level - write it to an append-only WORM store with Elasticsearch indexing, retain it for seven years where HIPAA or SOX applies, alert on anomalous access patterns, and make writes fail-safe: fall back to a durable queue and fail the request rather than silently drop a record.",
        correct: true,
        feedback:
          "Correct. The chapter's senior answer treats audit as a fail-safe compliance subsystem: a defined event schema, immutable WORM storage, multi-year retention, anomaly alerting, and guaranteed delivery.",
      },
      {
        text: "Buffer audit events in memory and flush them on a timer, dropping them if the audit store is down so user-facing latency stays low.",
        correct: false,
        feedback:
          "The chapter's write path explicitly never silently drops records: primary WORM store, a durable queued fallback, and failing the request as the last resort for regulated data.",
      },
    ],
  },
];
