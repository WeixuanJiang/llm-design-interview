import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter14Module: LearningModule = {
  id: "chapter-14-graphrag-and-knowledge-graph-retrieval",
  title: "GraphRAG & Knowledge-Graph Retrieval",
  description:
    "Standard RAG retrieves independent chunks ranked by similarity; this module restructures retrieval around entities and relationships so the system can connect facts across documents and summarize an entire corpus. Learn precisely when a knowledge graph earns its added complexity and when plain hybrid retrieval remains the better engineering choice.",
  duration: "3 lessons",
  lessons: [
    {
      id: "ch14-entity-centric-vs-chunks",
      title: "Entity-Centric vs Chunk-Based Retrieval",
      prompt: "Decide when top-k chunks are structurally not enough",
      question:
        "An investigations team asks its RAG assistant two kinds of questions: “find the paragraph describing incident 4471” and “what are the recurring risks across all 10,000 incident reports?” The first works; the second keeps failing no matter how retrieval is tuned. What is the root cause?",
      options: [
        "Chunk retrieval fetches each passage independently and has no representation of the corpus as a whole, so global questions cannot be answered by any top-k lookup",
        "The embedding model lacks the domain vocabulary for risk language, so a domain-adapted embedder will fix the global questions",
        "The top-k is set too low, so raising it until enough chunks are retrieved will let the generator synthesize corpus-wide themes",
      ],
      correct: 0,
      feedback:
        "Strong choice. The failure is structural: top-k similarity never builds a global or relational view, so no tuning of k or embeddings can produce a corpus-wide answer.",
      explanation:
        "Chunk-based retrieval treats the corpus as a flat bag of passages, which is excellent for “find the passage that answers this” but has two structural weaknesses: chunks are retrieved independently, and there is no representation of the corpus as a whole. Entity-centric retrieval restructures the corpus around entities and relationships, producing a knowledge graph that retrieval can traverse instead of only ranking passages.",
      takeaways: [
        "Name the question shape before choosing the retrieval unit.",
        "Top-k lookup cannot answer global questions about the corpus as a whole.",
        "Entity-centric indexing extracts entities and relationships into a knowledge graph at index time.",
      ],
      model: ["Question shape", "Retrieval unit", "Structural limit"],
      source: { chapter: 14, sections: ["14.1.1"], pages: "91" },
    },
    {
      id: "ch14-graphrag-architecture",
      title: "Microsoft GraphRAG Architecture",
      prompt: "Connect index-time communities to the two query modes",
      question:
        "A team adopting Microsoft GraphRAG has finished LLM-based entity and relationship extraction over its corpus. What must the indexing pipeline add before the system can answer broad questions like “what are the major themes across the whole corpus?”",
      options: [
        "A cross-encoder reranker over the extracted entities so the most important nodes rank first for broad queries",
        "A document-level index over the raw chunks so global queries can retrieve many more passages per request",
        "Leiden community detection that partitions the graph into nested communities, plus an LLM-written summary for each community",
      ],
      correct: 2,
      feedback:
        "Strong choice. Community summaries are the key innovation: they give the system a hierarchical, corpus-wide table of contents that global search can map-reduce over.",
      explanation:
        "Microsoft’s GraphRAG partitions the extracted entity graph into nested communities of densely related entities using the Leiden algorithm, then has an LLM write a summary for each community. Global search map-reduces over these summaries for corpus-spanning questions, while local search anchors on named entities and expands to their graph neighborhood and attached source chunks.",
      takeaways: [
        "Community summaries turn an entity graph into a hierarchical table of contents for the corpus.",
        "Global search answers questions no single chunk contains by reducing over community summaries.",
        "Local search answers entity-specific questions by expanding from anchored nodes to neighbors, relationships, and source chunks.",
      ],
      model: ["Extract graph", "Summarize communities", "Route global or local"],
      source: { chapter: 14, sections: ["14.1.2"], pages: "91" },
    },
    {
      id: "ch14-graph-traversal-vs-iterative",
      title: "When Graph Traversal Beats Iterative Linear Multi-hop",
      prompt: "Choose the multi-hop mechanism that fits the workload",
      question:
        "An internal platform answers “Who reports to the manager of the team that owns service X?” thousands of times a week over a stable service directory. Today it uses iterative retrieval: retrieve, read, generate a follow-up query, retrieve again. What is the strongest argument for replacing that loop with a knowledge graph?",
      options: [
        "The question is a deterministic 3-hop walk over known relationships, and the one-time construction cost amortizes when thousands of queries reuse the same paths",
        "Graph construction removes the need for an LLM at index time, so the graph is both cheaper and fresher than repeated retrieval",
        "Iterative retrieval cannot express three hops at all, so any multi-hop question requires a graph regardless of query volume",
      ],
      correct: 0,
      feedback:
        "Strong choice. Dense, known, and reusable relationships are exactly the conditions where a graph walk is exact and instant while iterative re-query compounds errors and latency.",
      explanation:
        "Iterative multi-hop retrieval works but is fragile: each hop is an independent LLM-plus-retrieval round-trip, errors compound, latency stacks, and one bad intermediate query derails the chain. Graph traversal wins when relationships are dense, known, and reusable; iterative retrieval stays preferable when relationships are sparse or unpredictable, the corpus changes constantly, or the budget cannot absorb LLM-based graph construction.",
      takeaways: [
        "Deterministic multi-hop questions are exact graph walks, not guessing games.",
        "Amortize one-time graph construction across many queries that reuse the same relationships.",
        "Stay with iterative retrieval when relationships are sparse, the corpus churns, or budget is tight.",
      ],
      model: ["Test determinism", "Measure reuse", "Check freshness budget"],
      source: { chapter: 14, sections: ["14.1.3"], pages: "92" },
    },
  ],
};

export const chapter14CourseContent: Record<string, LessonCourseContent> = {
  "ch14-entity-centric-vs-chunks": {
    objectives: [
      "Explain the two structural weaknesses of chunk-based retrieval.",
      "Describe how entity-centric indexing restructures a corpus into a knowledge graph.",
      "Match question shapes to chunk-based or entity-centric retrieval.",
    ],
    sections: [
      {
        heading: "How chunk-based retrieval sees a corpus",
        paragraphs: [
          "Chunk-based retrieval treats the corpus as a flat bag of passages. A query embedding finds the top-k nearest chunks, which is excellent for “find the passage that answers this”: FAQ lookup, support answers, and policy citations. The unit of retrieval is the text passage, and nothing else exists in the index.",
          "That design carries two structural weaknesses. First, each chunk is retrieved independently — the system never sees that chunk A and chunk D describe the same entity, so relational questions return fragments instead of connections. Second, there is no representation of the corpus as a whole, so global questions such as “what are the main themes across all 10,000 documents?” are unanswerable by top-k lookup no matter how retrieval is tuned.",
        ],
      },
      {
        heading: "What entity-centric retrieval changes",
        paragraphs: [
          "Entity-centric retrieval restructures the corpus around things and relationships. During indexing, an LLM reads the corpus and extracts entities — people, organizations, products, concepts — together with the relationships between them, producing a knowledge graph.",
          "Retrieval then operates over nodes and edges, not just passages. Explicit edges connect entities across documents, which is what makes cross-document “connect the dots” questions answerable, and the graph structure gives the system a corpus-level view that a bag of chunks never had.",
        ],
      },
      {
        heading: "A structural comparison",
        paragraphs: [
          "The two designs differ on every dimension that matters. Chunk RAG retrieves text passages, has no cross-document links, is weak on global questions, and answers multi-hop questions through iterative re-query. GraphRAG retrieves entities, relationships, and communities; connects entities with explicit edges; handles global questions through community summaries; and traverses the graph natively for multi-hop questions.",
          "The cost profile is just as asymmetric. Chunk indexing is cheap — embed and store. Graph indexing is expensive — LLM calls extract entities and relationships across the corpus. Chunk retrieval suits fact lookup, FAQ, and support; entity-centric retrieval suits investigations, connect-the-dots analysis, and summarization.",
        ],
      },
      {
        heading: "Choosing by question shape",
        paragraphs: [
          "The practical question is not which design is more advanced but which failure you can tolerate. If the workload is dominated by “find the passage” questions, a graph adds LLM indexing cost and operational complexity without unlocking any question type users actually ask.",
          "If users ask how entities connect across documents, or what the whole corpus says, flat retrieval structurally cannot answer and no amount of chunk tuning will fix it. Classify production query traffic into fact-lookup, relational, and global-synthesis shapes, and let that distribution drive the indexing investment.",
        ],
      },
    ],
    example: {
      title: "Worked example: incident-report investigations",
      scenario:
        "A reliability organization stores 10,000 incident reports. Investigators ask two recurring kinds of questions: “find the report for incident 4471” and “what are the recurring risks across all these reports, and how is vendor A connected to the region-B outages?”",
      analysis:
        "The first question is fact lookup, and chunk retrieval already serves it well. The second pair fails structurally: recurring-risk synthesis has no single answering passage, and the vendor-connection question requires edges that link entities across reports — neither of which top-k similarity can construct.",
      decision:
        "Keep hybrid chunk retrieval for report lookup, and add an entity-centric graph index — entities, relationships, and community summaries — for the investigation questions, justified by the measured failure of the flat index on those question types.",
    },
    productionChecklist: [
      "Classify query traffic into fact-lookup, relational, and global-synthesis shapes before choosing an index.",
      "Confirm every extracted entity and relationship links back to its source chunks for provenance.",
      "Measure per-document LLM extraction cost before committing to graph indexing.",
      "Keep a chunk-based retrieval path live for simple fact lookup after the graph ships.",
      "Track which question types fail under top-k retrieval as the trigger for graph investment.",
    ],
    commonMistakes: [
      "Raising top-k or enlarging chunks in the hope that global questions become answerable.",
      "Building a knowledge graph for a workload that is almost entirely FAQ-style fact lookup.",
      "Blaming the embedding model for failures that come from retrieving chunks independently.",
      "Paying LLM indexing cost for a corpus whose questions never cross documents.",
    ],
    knowledgeChecks: [
      {
        id: "ch14-entity-centric-vs-chunks-kc-1",
        prompt:
          "A procurement platform answers contract FAQ reliably with top-k chunk retrieval, but analysts now ask how two suppliers are connected across thousands of contracts and every tuned retrieval attempt still fails. What change actually addresses this?",
        options: [
          "Raise top-k sharply so each analyst query returns many more contract chunks, and let the generator infer the connections across them",
          "Restructure the corpus at index time into a knowledge graph of entities and relationships, so retrieval operates over nodes and edges rather than isolated passages",
          "Adopt a larger embedding model that encodes supplier names into richer vectors, so semantic similarity finally surfaces the connections",
        ],
        correct: 1,
        feedback:
          "Correct. The fix is entity-centric retrieval: LLM extraction of entities and relationships at index time, with retrieval over nodes and edges instead of a flat bag of passages that top-k lookup cannot escape.",
      },
      {
        id: "ch14-entity-centric-vs-chunks-kc-2",
        prompt:
          "A reliability organization stores 10,000 incident reports: lookup questions like finding incident 4471 succeed, while recurring-risk and vendor-connection questions across the whole archive keep failing. Which design decision best fits that evidence?",
        options: [
          "Keep hybrid chunk retrieval for report lookup and add an entity-centric graph index for the investigation questions that flat retrieval structurally cannot serve",
          "Retire chunk retrieval entirely and rebuild every workload on the graph, since it is the strictly more capable index",
          "Tune chunk size and overlap more aggressively until the recurring-risk questions start answering themselves",
        ],
        correct: 0,
        feedback:
          "Correct. Chunk retrieval is best for fact lookup and graphs are best for investigations and summarization, so each index should serve the question shape it fits rather than replacing one another.",
      },
      {
        id: "ch14-entity-centric-vs-chunks-kc-3",
        prompt:
          "After launch, investigators complain that answers about how two entities relate return fragments that each mention one entity but never connect them across documents. Which diagnosis matches the structural failure described for flat chunk indexes?",
        options: [
          "The reranker is too weak to prefer chunks that mention both entities together in one passage",
          "The generator context window is too small to hold enough chunks for a connected answer",
          "Chunks are retrieved independently with no cross-document links, so the system never sees that two chunks describe the same entity",
        ],
        correct: 2,
        feedback:
          "Correct. The first structural weakness is exactly this: each chunk is retrieved independently and flat indexes carry no cross-document links, a gap that neither reranking nor a larger context window can close.",
      },
      {
        id: "ch14-entity-centric-vs-chunks-kc-4",
        prompt:
          "A reviewer challenges your proposal to add entity-centric indexing, noting that LLM-based extraction costs orders of magnitude more than embed-and-store chunk indexing. Which defense is consistent with the chapter's guidance?",
        options: [
          "The graph is the more modern architecture, so its indexing cost is justified for any corpus regardless of workload",
          "The cost is justified only if the workload includes investigations, connect-the-dots, or summarization questions that flat retrieval structurally cannot answer",
          "The cost is never justified, because cheap chunk indexing can serve every retrieval workload adequately",
        ],
        correct: 1,
        feedback:
          "Correct. Fact lookup, FAQ, and support belong to chunk retrieval and investigations, connect-the-dots work, and summarization to graphs — the workload must contain the latter to justify LLM extraction cost.",
      },
      {
        id: "ch14-entity-centric-vs-chunks-kc-5",
        prompt:
          "Before committing a team to LLM-based entity extraction over the whole corpus, which pre-build validation does the chapter's framing of question shapes and indexing cost most directly support?",
        options: [
          "Classify production query traffic into fact-lookup, relational, and global-synthesis shapes, confirm top-k retrieval measurably fails on the latter two, and price the per-document extraction cost",
          "Benchmark embedding recall on a random sample of chunks, since retrieval quality is the main risk in any index build",
          "Build the graph first and watch aggregate answer quality after launch, because pre-build measurement cannot predict graph value",
        ],
        correct: 0,
        feedback:
          "Correct. The graph's value ties to question shape — relational and global questions — and its cost to LLM extraction, so validating the query mix and pricing extraction before building is the direct application.",
      },
    ],
  },
  "ch14-graphrag-architecture": {
    objectives: [
      "Describe the Microsoft GraphRAG indexing pipeline from raw corpus to community summaries.",
      "Distinguish global search and local search and the question shapes each serves.",
      "Explain why community summaries function as a hierarchical, corpus-wide table of contents.",
    ],
    sections: [
      {
        heading: "Indexing: from text to an entity graph",
        paragraphs: [
          "Microsoft’s GraphRAG, open-sourced in 2024, is the reference design for entity-centric retrieval. Its indexing pipeline runs an LLM over the corpus to extract entities and the relationships between them, producing an entity-and-relationship graph rather than a flat chunk index.",
          "This index-time LLM work is what makes graph retrieval powerful and what makes it expensive. Extraction can cost orders of magnitude more than embedding chunks, so building the graph must be justified by question types that flat retrieval cannot serve.",
        ],
      },
      {
        heading: "Communities and their summaries",
        paragraphs: [
          "After extraction, a community-detection algorithm — Leiden — partitions the graph into nested communities of densely related entities. Each community clusters the entities that are most tightly connected to one another.",
          "For each community, an LLM writes a community summary: a synthesized description of what that cluster of entities is about. These summaries are the key innovation, because they give the system a hierarchical, corpus-wide table of contents that no bag of chunks can provide.",
        ],
      },
      {
        heading: "Global search: map-reduce over summaries",
        paragraphs: [
          "Global search targets broad, corpus-spanning questions such as “what are the major themes?” It runs a map-reduce over community summaries: each summary produces a partial answer, and the partials are reduced into a final response.",
          "This answers questions that no single chunk could, at real cost — one query can touch many summaries. Production deployments bound global search to the top communities by relevance and cache summary-level partials instead of running a naive map-reduce over thousands of communities.",
        ],
      },
      {
        heading: "Local search: entity-anchored expansion",
        paragraphs: [
          "Local search targets entity-specific questions such as “what is X’s relationship to Y?” It anchors on the relevant entities in the graph, then expands outward to their neighboring nodes, connected relationships, and the source text chunks attached to those entities.",
          "The result is a focused, well-connected context assembled from graph structure and grounded in the original text. Because source chunks stay attached to entities, answers can still cite evidence rather than relying on graph structure alone.",
        ],
      },
    ],
    example: {
      title: "Worked example: research-corpus analyst assistant",
      scenario:
        "An analyst assistant sits over a large publication corpus. Two representative queries arrive in the same hour: “what are the major themes in this year’s publications?” and “what is lab X’s relationship to protein Y?”",
      analysis:
        "The theme question spans the whole corpus and no single passage answers it, so it maps to global search over community summaries. The relationship question names concrete entities, so it maps to local search anchored on lab X and protein Y, expanding to neighboring nodes and attached source chunks.",
      decision:
        "Index the corpus with entity extraction, Leiden communities, and per-community summaries; route broad theme queries to global search and entity-named queries to local search; cap global search to the most relevant communities and cache its partial answers.",
    },
    productionChecklist: [
      "Budget index-time LLM calls for entity extraction, relationship extraction, and summary writing.",
      "Version the graph and its community summaries together so both query modes stay consistent.",
      "Bound global search to the top relevant communities and cache summary-level partials.",
      "Keep source chunks attached to entities so local search answers can cite evidence.",
      "Route queries to global or local search with explicit signals instead of defaulting everything to one mode.",
    ],
    commonMistakes: [
      "Treating GraphRAG as a single search mode instead of two complementary modes.",
      "Running an unbounded map-reduce over thousands of communities on every global query.",
      "Skipping community summaries and expecting the raw entity graph to answer global questions.",
      "Committing to graph indexing without a plan for keeping the graph fresh as documents change.",
    ],
    knowledgeChecks: [
      {
        id: "ch14-graphrag-architecture-kc-1",
        prompt:
          "A GraphRAG deployment answers entity-specific questions well, but broad questions like “what are the major themes across the corpus this quarter?” still fail after entity and relationship extraction. Which missing index-time artifact explains the gap?",
        options: [
          "More relationship edges between the extracted entities, so broad queries can traverse further across the graph",
          "A document-level chunk index with a much larger top-k reserved for broad queries",
          "Leiden community detection over the graph plus an LLM-written summary for each discovered community",
        ],
        correct: 2,
        feedback:
          "Correct. Leiden partitions the graph into nested communities and an LLM writes a summary per community, giving a hierarchical, corpus-wide table of contents that global search map-reduces over.",
      },
      {
        id: "ch14-graphrag-architecture-kc-2",
        prompt:
          "An analyst assistant over a large publication corpus receives two queries in the same hour: “what are the major themes in this year’s publications?” and “what is lab X’s relationship to protein Y?” Which routing matches Microsoft GraphRAG’s two query modes?",
        options: [
          "Send both to global search, since community summaries already cover the whole corpus",
          "Send the theme question to global search over community summaries and the lab-protein question to local search anchored on those entities and expanded to neighbors and source chunks",
          "Send both to local search, since only local search grounds answers in the original source text",
        ],
        correct: 1,
        feedback:
          "Correct. Broad corpus-spanning questions belong to global search's map-reduce over summaries and entity-specific questions to local search's anchored expansion into neighbors, relationships, and attached chunks.",
      },
      {
        id: "ch14-graphrag-architecture-kc-3",
        prompt:
          "Two weeks after launch, global search latency and LLM spend spike because every broad query runs an unbounded map-reduce over thousands of communities. Which diagnosis and fix follow the chapter's production guidance?",
        options: [
          "Global map-reduce is inherently expensive, so bound it to the top communities by relevance and cache summary-level partial answers",
          "The community summaries are too short, so regenerate them longer until global answers improve",
          "Leiden produced too many communities, so re-run detection until only a handful of communities remain",
        ],
        correct: 0,
        feedback:
          "Correct. The cost guidance for GraphRAG confronts exactly this problem: cap global search by bounding to the top communities by relevance and caching summary-level partials instead of a naive map-reduce over thousands of communities.",
      },
      {
        id: "ch14-graphrag-architecture-kc-4",
        prompt:
          "A teammate proposes routing every query to global search because community summaries are precomputed and therefore free at query time. Which defense of selective routing aligns with the chapter's cost analysis?",
        options: [
          "Agree — precomputed summaries make global search effectively free, so routing logic is unnecessary",
          "Disagree only for compliance reasons, since local search is the only mode that can cite source chunks",
          "Disagree — each global query still runs a map-reduce over many summaries, which is expensive, and entity-specific questions get a better focused context from local search anyway",
        ],
        correct: 2,
        feedback:
          "Correct. Global search's cost — touching many summaries per query — is traded against its unique corpus-wide reach, reserving it for broad questions while local search assembles a focused, well-connected context for entity-specific ones.",
      },
      {
        id: "ch14-graphrag-architecture-kc-5",
        prompt:
          "Before releasing a GraphRAG deployment with both query modes, which validation plan best reflects the chapter's mechanism of summaries, anchored expansion, and source-chunk provenance?",
        options: [
          "Verify only that the extraction LLM finishes over the corpus without errors, then ship both modes",
          "Test routing signals on representative broad and entity-specific queries, confirm local answers trace to attached source chunks, and measure global search cost under bounded community fan-out",
          "A/B test global search against local search on one shared query set and keep whichever mode wins on average",
        ],
        correct: 1,
        feedback:
          "Correct. This validates each mechanism the chapter defines: routing between the two modes, provenance through source chunks attached to entities, and bounded global fan-out as the cost control for map-reduce over summaries.",
      },
    ],
  },
  "ch14-graph-traversal-vs-iterative": {
    objectives: [
      "Explain how iterative linear multi-hop retrieval works and why it is fragile.",
      "Identify the three conditions under which graph traversal beats iterative re-query.",
      "State the workloads where iterative retrieval remains the better engineering choice.",
    ],
    sections: [
      {
        heading: "The iterative loop and its failure modes",
        paragraphs: [
          "The earlier retrieval chapters answer multi-hop questions with an iterative loop: retrieve, read, generate a follow-up query, and retrieve again until the chain completes. The loop works, and it requires no graph construction at index time.",
          "Its weakness is compounding. Each hop is an independent LLM-plus-retrieval round-trip, so errors compound, latency stacks hop by hop, and a single bad intermediate query derails the entire chain into confidently wrong evidence.",
        ],
      },
      {
        heading: "Where a graph walk wins",
        paragraphs: [
          "Graph traversal wins when relationships are dense, known, and reusable. Deterministic connections make the clearest case: “Who reports to the manager of the team that owns service X?” is a three-hop graph walk that is exact and instant, but a noisy guessing game for iterative semantic re-query.",
          "The second condition is reuse: if thousands of queries traverse the same relationships, the one-time graph-construction cost amortizes far better than re-discovering the same paths per query. The third is global synthesis: “summarize the whole corpus” has no linear multi-hop equivalent — you would have to read everything — and community summaries make it tractable.",
        ],
      },
      {
        heading: "Where the iterative loop still wins",
        paragraphs: [
          "Iterative linear retrieval remains preferable when relationships are sparse or unpredictable, because there is no stable structure worth paying to encode. Exploratory, one-off questions over prose fit the loop better than a fixed set of edges.",
          "It also wins when the corpus changes constantly, since graphs are expensive to keep fresh, and when the budget cannot absorb LLM-based graph construction over the whole corpus. In those regimes, paying per-query retrieval cost beats paying index-time extraction cost.",
        ],
      },
      {
        heading: "Making the call with evidence",
        paragraphs: [
          "The decision reduces to three measurements: how deterministic the relationships are, how many production queries reuse the same paths, and how fast the underlying documents change. High determinism plus high reuse plus a stable corpus points to a graph.",
          "Instrument the existing iterative chain first — per-hop latency, hop failure rate, and how often queries share intermediate steps. That evidence tells you whether a graph would remove a measured failure or merely add impressive-looking complexity.",
        ],
      },
    ],
    example: {
      title: "Worked example: service-ownership lookups",
      scenario:
        "An internal platform answers “Who reports to the manager of the team that owns service X?” thousands of times a week over a service directory that changes only when teams reorganize. The current implementation chains three iterative retrieval rounds per question.",
      analysis:
        "The relationships are known and deterministic, the same ownership and reporting paths are traversed constantly, and the corpus is stable — all three graph conditions hold. The iterative chain re-derives identical paths per query, compounding error and latency with no compensating benefit.",
      decision:
        "Build the graph once, answer ownership questions with exact traversal, define a freshness path for the graph when reorganizations land, and reserve iterative retrieval for one-off exploratory questions outside the modeled relationships.",
    },
    productionChecklist: [
      "Count how many production queries traverse the same relationship paths before building a graph.",
      "Instrument per-hop latency and per-hop failure rate on any iterative multi-hop chain.",
      "Define how the graph stays fresh as the underlying documents change.",
      "Keep an iterative retrieval fallback for questions outside the modeled relationships.",
      "Compare one-time graph construction cost against per-query multi-hop cost over realistic traffic.",
    ],
    commonMistakes: [
      "Chaining iterative re-queries for deterministic questions that a graph walk answers exactly.",
      "Building a graph over relationships that are sparse, unpredictable, or rarely reused.",
      "Ignoring corpus churn when committing to LLM-based graph construction.",
      "Judging a multi-hop chain by its final answer without inspecting intermediate-hop errors.",
    ],
    knowledgeChecks: [
      {
        id: "ch14-graph-traversal-vs-iterative-kc-1",
        prompt:
          "A platform fields the question “Who reports to the manager of the team that owns service X?” thousands of times per week over a stable directory, currently via iterative retrieval. Which mechanism does the chapter say fits this workload?",
        options: [
          "A knowledge graph: the question is a deterministic three-hop walk over known relationships, and heavy reuse amortizes the one-time construction cost",
          "The existing iterative loop: it avoids index-time LLM cost, and three hops is few enough that fragility does not matter",
          "A single vector search whose query text contains all three hop descriptions at once",
        ],
        correct: 0,
        feedback:
          "Correct. The first two graph-wins conditions are deterministic connections — an exact, instant walk instead of a noisy guessing game — and many overlapping hops, where one-time construction cost amortizes across queries.",
      },
      {
        id: "ch14-graph-traversal-vs-iterative-kc-2",
        prompt:
          "A service-ownership platform answers “Who reports to the manager of the team that owns service X?” by chaining three iterative retrieval rounds per question over a directory that changes only at reorganizations. Which evidence most strongly justifies rebuilding on a graph?",
        options: [
          "The iterative chain occasionally produces a wrong final answer, which alone proves a graph is necessary",
          "A graph would remove all LLM cost from the system, including index-time extraction",
          "The same ownership and reporting paths are traversed constantly, the relationships are known and deterministic, and the corpus is stable — all three graph conditions hold",
        ],
        correct: 2,
        feedback:
          "Correct. Deterministic connections, many overlapping hops, and a stable corpus are precisely the conditions under which graph traversal beats iterative re-query; a graph never removes LLM cost.",
      },
      {
        id: "ch14-graph-traversal-vs-iterative-kc-3",
        prompt:
          "An iterative multi-hop chain returns a confidently wrong answer, and inspection shows the second hop's generated follow-up query drifted off topic, poisoning everything retrieved afterward. Which diagnosis matches the chapter's account of this failure?",
        options: [
          "The final generator hallucinated despite perfect retrieval, so generation alone needs fixing",
          "Each hop is an independent LLM-plus-retrieval round-trip, so errors compound and one bad intermediate query derails the whole chain",
          "The first hop's top-k was too small, so enlarging it would have prevented the downstream drift",
        ],
        correct: 1,
        feedback:
          "Correct. The iterative loop is fragile for exactly this reason: every hop is an independent round-trip, errors compound, latency stacks, and a single bad intermediate query derails the chain.",
      },
      {
        id: "ch14-graph-traversal-vs-iterative-kc-4",
        prompt:
          "You propose keeping iterative retrieval for a breaking-news research tool whose corpus changes hourly and whose questions are unpredictable one-offs. A reviewer pushes for a knowledge graph instead. Which defense follows the chapter?",
        options: [
          "Relationships here are sparse and unpredictable and the corpus changes constantly, and graphs are expensive to keep fresh — so per-query retrieval cost beats index-time construction",
          "Iterative retrieval is always more accurate than graph traversal, so accuracy alone settles the debate",
          "A graph cannot represent fast-changing news entities at all, so the reviewer's proposal is technically impossible",
        ],
        correct: 0,
        feedback:
          "Correct. The stay-iterative conditions are exactly these: relationships sparse or unpredictable, the corpus changing constantly since graphs are expensive to keep fresh, and budgets that cannot absorb LLM-based construction.",
      },
      {
        id: "ch14-graph-traversal-vs-iterative-kc-5",
        prompt:
          "Before deciding between graph traversal and an iterative chain for a multi-hop workload, which measurement plan best operationalizes the chapter's three graph-wins conditions?",
        options: [
          "Compare final-answer quality of both mechanisms on a small demo set and pick the higher average",
          "Build the graph first, because its benefits can only be measured after construction completes",
          "Count how many production queries reuse the same relationship paths, instrument per-hop latency and failure of the iterative chain, and measure corpus change rate against construction budget",
        ],
        correct: 2,
        feedback:
          "Correct. These measurements map one-to-one onto the graph-wins conditions: many overlapping hops for amortization, deterministic connections where the iterative chain is fragile, and corpus freshness versus LLM-based construction cost.",
      },
    ],
  },
};

export const chapter14Practice: CatalogPracticeUnit[] = [
  {
    id: "ch14-14-2-1",
    chapter: 14,
    chapterTitle: "GraphRAG & Knowledge-Graph Retrieval",
    title: "When would you choose GraphRAG over standard hybrid retrieval?",
    pages: "92",
    route: "/practice/graphrag-and-knowledge-graph-retrieval/when-would-you-choose-graphrag-over-standard-hybrid-retrieval",
    competencies: ["entity retrieval", "knowledge graphs", "global/local search", "routing"],
    question:
      "In a senior-level interview for a retrieval platform, you are asked: “When would you choose GraphRAG over standard chunk-based hybrid retrieval, and what does it cost you?” Which answer earns the strongest rating?",
    options: [
      {
        text: "Choose GraphRAG whenever the data is complex, because it is the more advanced architecture; adopt it as the default retriever and migrate all queries rather than maintaining two retrieval paths.",
        correct: false,
        feedback:
          "“More advanced, so better” is the junior answer — it adopts expensive architecture without naming the measured failure it addresses, and wholesale replacement ignores the LLM-heavy indexing and freshness burden.",
      },
      {
        text: "Treat GraphRAG as a targeted tool for the two workloads flat retrieval structurally fails — corpus-level synthesis and dense multi-hop relationships; quantify the cost as LLM-based indexing, a freshness burden, and operational complexity, and introduce it as a second retrieval mode behind a router only after measuring where hybrid retrieval plus re-ranking fails.",
        correct: true,
        feedback:
          "Correct. This names the two specific failure modes of flat retrieval, prices the graph honestly, and deploys it behind a router — exactly the ownership signal a senior answer is judged on.",
      },
      {
        text: "Never choose GraphRAG; hybrid retrieval with a reranker can answer any question if you raise top-k high enough, so the added complexity is never justified.",
        correct: false,
        feedback:
          "This overcorrects: top-k similarity structurally cannot build a global or relational view, so global-synthesis and dense multi-hop questions stay unanswerable no matter how retrieval is tuned.",
      },
    ],
  },
  {
    id: "ch14-14-2-2",
    chapter: 14,
    chapterTitle: "GraphRAG & Knowledge-Graph Retrieval",
    title: "Explain Microsoft GraphRAG’s global vs local search",
    pages: "93",
    route: "/practice/graphrag-and-knowledge-graph-retrieval/explain-microsoft-graphrags-global-vs-local-search",
    competencies: ["entity retrieval", "knowledge graphs", "global/local search", "routing"],
    question:
      "In a staff-level interview, the panel asks: “Explain how global search and local search differ in Microsoft GraphRAG, and how you would route between them.” What does the strongest answer include?",
    options: [
      {
        text: "Global search answers broad, corpus-spanning questions by map-reducing over community summaries, while local search anchors on named entities and expands to their graph neighborhood and attached source chunks; route with a lightweight classifier on signals like aggregation words versus concrete entities, run ambiguous queries local-first with escalation to global, and cap global cost by bounding to top communities and caching summary-level partials.",
        correct: true,
        feedback:
          "Correct. It defines both modes mechanically, specifies routing signals, handles the ambiguous case with an escalation path, and confronts the cost of global map-reduce with bounding and caching.",
      },
      {
        text: "The modes differ mainly in prompt wording — global prompts say “summarize” and local prompts say “find” — so routing can be hard-coded per product area without any query-level signals.",
        correct: false,
        feedback:
          "The difference is mechanical, not cosmetic: global is a map-reduce over community summaries and local is entity-anchored neighborhood expansion. Hard-coding routes by product area ignores the query signals that actually predict the right mode.",
      },
      {
        text: "Always run global search, because community summaries already cover the whole corpus; local search is a legacy path, and cost controls are unnecessary since summaries are precomputed.",
        correct: false,
        feedback:
          "Summaries are precomputed, but global search still runs a per-query map-reduce over many of them, which is expensive; it also gives up the focused, well-connected context local search assembles for entity-specific questions.",
      },
    ],
  },
];
