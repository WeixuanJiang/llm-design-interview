import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter07Module: LearningModule = {
  id: "chapter-7-data-pipeline-and-ingestion",
  title: "Data Pipeline & Ingestion",
  description:
    "Trustworthy knowledge bases are built upstream: parsing, deduplication, freshness, and embedding version management decide whether retrieval stays reliable over time. This chapter treats production RAG quality as a data-operations problem, not only a model problem.",
  duration: "3 lessons",
  lessons: [
    {
      id: "ch7-document-parsing",
      title: "Document Parsing",
      prompt: "Match the parser to the document format",
      question:
        "A knowledge base ingests scanned contract PDFs, HTML pages heavy with navigation boilerplate, and Markdown runbooks. Which parsing plan protects downstream chunk quality?",
      options: [
        "Run every file through one generic text extractor so the pipeline stays simple",
        "Route each format to specialized tooling: OCR for scanned PDFs, boilerplate-stripping extraction for HTML, and header-aware parsing for Markdown",
        "Skip parsing entirely and chunk the raw file bytes so no information is lost",
      ],
      correct: 1,
      feedback:
        "Strong choice. Format-specific parsing keeps garbage out of the chunking stage: OCR recovers text from scans, main-content extraction drops web boilerplate, and Markdown headers become chunk metadata.",
      explanation:
        "Parsing is the first stage of the ingestion pipeline, and each format needs its own tooling: layout-aware PDF parsers plus OCR such as Tesseract for scanned pages, BeautifulSoup or Trafilatura to strip boilerplate from HTML, document loaders for Office files, and Markdown headers parsed as metadata for structured chunking. A single generic extractor silently produces empty chunks from scans and polluted chunks from web pages.",
      takeaways: [
        "Match the parser to the format: PDF, HTML, Office, and Markdown each have dedicated tooling.",
        "Scanned PDFs require OCR before any text extraction can succeed.",
        "Structure captured at parse time, such as headers and layout, becomes chunk metadata later.",
      ],
      model: ["Detect format", "Parse with the right tool", "Emit clean text plus metadata"],
      source: { chapter: 7, sections: ["7.1.1"], pages: "56" },
    },
    {
      id: "ch7-incremental-updates",
      title: "Incremental Updates",
      prompt: "Re-embed only what actually changed",
      question:
        "A nightly job re-embeds a two-million-document corpus even though only a few hundred documents change per day, and embedding spend is exploding. What redesign keeps the index current at a fraction of the cost?",
      options: [
        "Negotiate a larger embedding API quota and keep running full nightly re-embeds",
        "Re-embed a random sample of documents each night so the whole corpus is eventually refreshed",
        "Hash each document's content, compare it to the stored hash, and re-embed only documents whose hash changed, deleting their old chunks first",
      ],
      correct: 2,
      feedback:
        "Strong choice. Content hashing turns incremental ingestion into an O(1) check per document: unchanged documents are skipped, and changed ones have their old chunks deleted before the new chunks are embedded and inserted.",
      explanation:
        "The incremental-update pattern stores a SHA-256 hash of each document in a metadata database and re-embeds only when the hash differs from the stored value. On change, the old chunks are deleted from the vector DB before new chunks are inserted, so stale generations never accumulate. This makes pipeline re-runs idempotent and ties embedding cost to the change rate rather than the corpus size.",
      takeaways: [
        "Store a content hash per document and compare before paying for embedding.",
        "An update is delete-old-chunks-then-insert, never insert-on-top.",
        "Idempotent re-runs make retries and replays safe after failures.",
      ],
      model: ["Hash content", "Compare to stored hash", "Delete, re-embed, insert if changed"],
      source: { chapter: 7, sections: ["7.1.2"], pages: "56" },
    },
    {
      id: "ch7-data-freshness",
      title: "Data Freshness",
      prompt: "Make freshness queryable and measurable",
      question:
        "A time-sensitive pricing assistant keeps citing two-year-old sheets, but the business still needs the full document history for audits. What design serves fresh answers without deleting old documents?",
      options: [
        "Tag every chunk with indexed_at and document_date, apply a document_date metadata filter for time-sensitive queries, and monitor P90 document age on a dashboard",
        "Delete every document older than 90 days from the index so retrieval can only return fresh content",
        "Add a line to the prompt instructing the model to prefer recent information",
      ],
      correct: 0,
      feedback:
        "Strong choice. Freshness belongs in the metadata layer: date tags plus a query-time filter keep history available for audits while time-sensitive queries only see recent documents, and P90 age monitoring catches pipeline lag before users do.",
      explanation:
        "The pattern tags every chunk with indexed_at and document_date, then enforces recency at query time with a metadata filter such as a 90-day document_date window for time-sensitive query classes. P90 document age in the index is monitored on a dashboard so staleness becomes an observable operations metric. Prompt instructions cannot fix a retrieval candidate set that already contains stale chunks.",
      takeaways: [
        "Tag chunks with both indexed_at and document_date at ingestion time.",
        "Filter by document_date at query time instead of deleting history.",
        "Monitor P90 document age as the operational freshness metric.",
      ],
      model: ["Tag dates", "Filter at query time", "Monitor P90 age"],
      source: { chapter: 7, sections: ["7.1.3"], pages: "56" },
    },
  ],
};

export const chapter07CourseContent: Record<string, LessonCourseContent> = {
  "ch7-document-parsing": {
    objectives: [
      "Route each document format to a parser built for it.",
      "Explain why scanned PDFs need OCR and web pages need boilerplate stripping.",
      "Preserve document structure as metadata for downstream chunking.",
    ],
    sections: [
      {
        heading: "Parsing is the first pipeline stage",
        paragraphs: [
          "The ingestion pipeline that keeps a knowledge base trustworthy is a chain: sources emit change events, documents are parsed and cleaned, chunks are enriched and embedded, and everything lands in a vector and lexical index with a metadata database tracking hashes and versions. Parsing sits at the front of that chain, so its output quality caps the quality of every later stage. A parser that drops text, mangles layout, or keeps page furniture produces chunks and embeddings that faithfully encode the garbage.",
          "Treating parsing as one generic text-extraction call is the most common way to quietly poison an index. Each source format carries different structure and different failure modes, so the pipeline should detect the format and dispatch to tooling built for it. The parser's identity and the document's content hash belong in the metadata database, so every chunk keeps lineage back to how it was produced.",
        ],
      },
      {
        heading: "PDFs: layout-aware extraction and OCR",
        paragraphs: [
          "PDFs come in two very different populations. Born-digital PDFs carry a text layer and benefit from layout-aware extraction: tools like Unstructured.io, PyMuPDF, and pdfplumber recover reading order and structure that naive text dumping scrambles. Scanned PDFs are images. They contain no text layer at all, and a text extractor returns empty output.",
          "Scanned documents must be routed through OCR, for example Tesseract, before anything downstream can use them. The failure mode to design for is silent emptiness: a scanned contract that indexes as zero chunks looks like a successful run unless the pipeline checks extraction yield. Detecting image-only PDFs and forcing the OCR path is a parsing-stage responsibility, not something to discover from bad answers later.",
        ],
      },
      {
        heading: "HTML and Office documents",
        paragraphs: [
          "Web pages mix the content you want with navigation, headers, footers, and sidebars you do not. HTML parsing uses tools such as BeautifulSoup and Trafilatura to strip boilerplate and extract the main content before chunking. Boilerplate left in the text is not harmless: the same navigation text repeats across every page of a site and becomes duplicate chunk pollution throughout the index.",
          "Office documents need their own loaders, such as python-docx for Word files or the document loaders in frameworks like LlamaIndex, because the value is in the document's structure rather than its raw container format. As with HTML, the goal of this stage is clean main content plus the structural cues, headings and sections, that later stages turn into well-formed chunks.",
        ],
      },
      {
        heading: "Markdown: structure becomes metadata",
        paragraphs: [
          "Markdown is the friendliest ingestion format because its structure is explicit. Headers should be parsed out and carried as metadata rather than flattened into plain text, because the section hierarchy is exactly what structure-aware chunking needs in order to cut along meaningful boundaries.",
          "This principle generalizes across formats: whatever structure the source format encodes, whether headers, layout regions, or document sections, should survive parsing as chunk metadata instead of being discarded. Lineage from a chunk back to its document section is what later makes freshness filtering, deduplication, and surgical re-embedding possible.",
        ],
      },
    ],
    example: {
      title: "Worked example: compliance knowledge base with a mixed corpus",
      scenario:
        "A compliance assistant ingests three sources: signed contracts that arrive as scanned PDFs, a policy wiki served as HTML pages with heavy navigation, and engineering runbooks written in Markdown. The first prototype pipes everything through one generic text extractor, and answers come back citing empty pages and menu text.",
      analysis:
        "Each format is failing in its own way. The scanned contracts have no text layer, so extraction yields nothing and they are invisible to retrieval. The wiki pages embed navigation and footer boilerplate into every chunk, so retrieval matches menu text instead of policy. The runbooks lose their section hierarchy, so chunks split mid-procedure.",
      decision:
        "Dispatch by format: OCR the scanned contracts with Tesseract before extraction, run wiki pages through boilerplate-stripping main-content extraction, and parse Markdown headers into metadata for structured chunking. Record the parser used and a content hash per document in the metadata DB, and treat zero-text extractions as failures so silent parsing problems surface immediately.",
    },
    productionChecklist: [
      "Detect each document's format and dispatch to a format-specific parser.",
      "Route image-only PDFs through OCR, such as Tesseract, and flag zero-text extractions as failures.",
      "Strip boilerplate and extract main content from HTML before chunking.",
      "Parse Markdown headers into metadata so chunking can follow document structure.",
      "Write parser identity and content hash to the metadata DB for chunk lineage.",
    ],
    commonMistakes: [
      "Sending scanned PDFs through a text extractor and recording empty results as success.",
      "Embedding HTML pages with navigation and footer boilerplate still attached.",
      "Using one generic extractor for every format and losing layout and structure.",
      "Flattening headers into plain text instead of keeping them as chunk metadata.",
    ],
    knowledgeChecks: [
      {
        id: "ch7-document-parsing-kc-1",
        prompt: "Your pipeline must ingest a corpus mixing scanned contract PDFs, HTML pages with heavy navigation, and Markdown runbooks. Which parsing design protects downstream chunk quality?",
        options: [
          "Dispatch by format: OCR for scanned PDFs, boilerplate-stripping extraction for HTML, and header-aware parsing for Markdown",
          "One generic text extractor for every file to keep the pipeline simple",
          "Chunk the raw files directly and let the embedding model handle the noise",
        ],
        correct: 0,
        feedback: "Each format pairs with dedicated tooling: OCR such as Tesseract for scanned PDFs, boilerplate-stripping extraction for HTML, and Markdown headers parsed as metadata.",
      },
      {
        id: "ch7-document-parsing-kc-2",
        prompt: "In the compliance knowledge base worked example, answers cite empty pages and menu text after one generic extractor handled scanned contracts, wiki HTML, and Markdown runbooks. What is the first fix?",
        options: [
          "Re-tune the prompt so the model learns to ignore menu text and empty citations",
          "Re-embed the whole corpus with a larger embedding model that tolerates noise",
          "Route scanned contracts through OCR, strip wiki boilerplate with main-content extraction, and parse Markdown headers into metadata",
        ],
        correct: 2,
        feedback: "The worked example's decision mirrors the chapter's parsing guidance: scanned PDFs need OCR, HTML needs boilerplate-stripped main content, and Markdown headers should become chunk metadata.",
      },
      {
        id: "ch7-document-parsing-kc-3",
        prompt: "An ingestion run completes green, but auditors discover that every scanned signed contract is invisible to retrieval while the parser logged no errors. What is the most likely root cause?",
        options: [
          "The embedding model cannot represent legal language, so the contracts were encoded as null vectors",
          "Scanned PDFs are images with no text layer, so a text extractor silently produced empty output instead of routing them to OCR",
          "The vector DB rejected the contracts because their chunks exceeded the index size limit",
        ],
        correct: 1,
        feedback: "Scanned PDFs must be handled with OCR such as Tesseract; a text extractor over an image-only PDF yields nothing, and that failure is silent without a yield check.",
      },
      {
        id: "ch7-document-parsing-kc-4",
        prompt: "A teammate proposes simplifying the pipeline to a single generic text extractor for all formats in order to reduce maintenance. How do you defend format-specific parsing?",
        options: [
          "Each format fails differently: scans extract as empty without OCR, HTML keeps boilerplate that pollutes chunks, and Markdown loses the header structure chunking depends on",
          "Format-specific parsers are faster at runtime, and ingestion latency is the main constraint",
          "Generic extractors are acceptable, but the team should fine-tune the embedding model on raw HTML instead",
        ],
        correct: 0,
        feedback: "Per-format tooling exists precisely because the failure modes differ: OCR for scanned PDFs, boilerplate stripping for HTML, Office loaders for Word files, and headers-as-metadata for Markdown.",
      },
      {
        id: "ch7-document-parsing-kc-5",
        prompt: "Before declaring the parsing stage production-ready for a mixed corpus of scans, web pages, and Markdown, which verification belongs in the pipeline's definition of done?",
        options: [
          "Spot-check a few born-digital PDFs by eye and ship if their text looks reasonable",
          "Measure only embedding latency, since parsing quality is invisible to downstream stages",
          "Check extraction yield per document so zero-text outputs fail loudly, and confirm HTML main-content extraction and Markdown header metadata survive into chunks",
        ],
        correct: 2,
        feedback: "The parsing guidance implies verifiable outputs: OCR must recover text from scans, boilerplate must be stripped from HTML, and Markdown headers must persist as metadata for structured chunking.",
      },
    ],
  },
  "ch7-incremental-updates": {
    objectives: [
      "Replace full re-embedding with hash-based change detection.",
      "Implement updates as delete-old-then-insert against the vector store.",
      "Make ingestion idempotent so retries and replays are safe.",
    ],
    sections: [
      {
        heading: "The problem with re-embedding everything",
        paragraphs: [
          "The naive way to keep an index current is to re-embed the whole corpus on a schedule. That works for a demo and collapses in production: embedding cost and job duration scale with corpus size, while the number of documents that actually changed between runs is usually tiny. Paying full-corpus prices to refresh a few hundred changed documents is the default failure mode of pipelines without change detection.",
          "Incremental updates invert the economics. The pipeline re-embeds only documents whose content has changed, so cost and run time track the change rate rather than the corpus size. This is also what makes tight freshness targets reachable: a small incremental job can run far more often than a full rebuild ever could.",
        ],
      },
      {
        heading: "Hash-based change detection",
        paragraphs: [
          "The mechanism is a content hash. Each document is hashed, SHA-256 over its content, and the hash is stored in the metadata database alongside the document's version. On each ingestion run, the pipeline recomputes the hash and compares it to the stored value, which is an O(1) lookup per document.",
          "An unchanged hash means the document is skipped entirely: no re-parsing, no embedding calls, no index writes. A changed hash triggers the update path. The stored hash is then written with the new value so the next run starts from the new baseline, and the version marker moves with it.",
        ],
      },
      {
        heading: "Updates are delete, then insert",
        paragraphs: [
          "Vector stores do not update a document's chunks in place by content. The update path for a changed document is: delete the old chunks from the vector DB, re-embed, and insert the new chunks. Skipping the delete leaves both generations in the index, and retrieval starts surfacing superseded content alongside current content.",
          "Deletes need a handle, which is why every chunk carries its doc_id as a metadata tag. Delete-by-metadata on doc_id removes exactly the old generation of that document before the new generation is inserted. The same doc_id discipline is what later makes source-side deletions and zero-downtime re-indexing workable.",
        ],
      },
      {
        heading: "Idempotency as a design requirement",
        paragraphs: [
          "The pipeline in this chapter is explicitly idempotent and versioned, and hash-based change detection is what delivers that property. Re-running the pipeline over the same inputs is a no-op: hashes match, documents are skipped, and the index is untouched. A run that crashes halfway can simply be retried without double-inserting chunks.",
          "Idempotency depends on the metadata DB and the vector index moving together. The hash, timestamp, and version should be written when the corresponding index changes complete, so a failure never leaves the metadata claiming a document is fresh while its old chunks still serve queries. Treat the metadata record and the index write as one logical unit of work.",
        ],
      },
    ],
    example: {
      title: "Worked example: nightly ingestion for a two-million-document corpus",
      scenario:
        "A documentation platform re-embeds its full two-million-document corpus every night. The embedding bill grows linearly, the job barely fits its nightly window, and logs show that on a typical night fewer than five hundred documents actually changed.",
      analysis:
        "Full re-embedding spends almost its entire budget proving that unchanged documents are unchanged. Hash-based change detection replaces that with an O(1) metadata lookup per document: recompute the SHA-256 hash, compare it to the stored value, and touch only the few hundred documents whose hashes moved. The nightly job shrinks from millions of embedding calls to hundreds.",
      decision:
        "Store a content hash per document in the metadata DB. Each run, skip documents with matching hashes; for changed documents, delete their old chunks by doc_id, re-embed, insert the new chunks, and update the stored hash, timestamp, and version. Because unchanged inputs are a no-op, the pipeline can be re-run safely after any failure.",
    },
    productionChecklist: [
      "Hash each document's content with SHA-256 and store it in the metadata DB.",
      "Skip parsing and embedding entirely when the hash matches the stored value.",
      "Delete old chunks by doc_id before inserting re-embedded chunks.",
      "Update hash, timestamp, and version only after the index writes succeed.",
      "Verify that a repeated run over unchanged inputs makes no embedding calls and no index writes.",
    ],
    commonMistakes: [
      "Re-embedding the full corpus on every schedule regardless of what changed.",
      "Inserting new chunks without deleting the old generation, leaving stale duplicates in the index.",
      "Trying to detect changes from file timestamps instead of hashing the document content.",
      "Marking the metadata record updated before the index writes complete, so hash state and index diverge after a crash.",
    ],
    knowledgeChecks: [
      {
        id: "ch7-incremental-updates-kc-1",
        prompt: "Only a few hundred of two million documents change daily, yet the nightly job re-embeds everything and embedding spend is exploding. What redesign keeps the index current?",
        options: [
          "Negotiate a larger embedding API quota and keep running the full nightly re-embed",
          "Re-embed a random nightly sample of documents so the corpus is refreshed gradually",
          "Hash each document's content, compare against the stored hash, and re-embed only changed documents after deleting their old chunks",
        ],
        correct: 2,
        feedback: "The incremental-update pattern is exactly this: SHA-256 the content, compare with the value in the metadata DB, and on change delete old chunks before re-embedding and inserting new ones.",
      },
      {
        id: "ch7-incremental-updates-kc-2",
        prompt: "Applying the worked example, the nightly two-million-document job shrinks to a few hundred embedding calls. Which stored value makes that reduction possible, and where does it live?",
        options: [
          "A SHA-256 content hash per document, stored in the metadata DB and compared on each run with an O(1) lookup",
          "A document popularity score in a feature store, so only frequently read documents get refreshed",
          "The embedding vector itself, recomputed and compared by cosine similarity against the stored vector",
        ],
        correct: 0,
        feedback: "Hash document content with SHA-256 and compare it to the stored value in the metadata DB; documents with unchanged hashes are skipped entirely.",
      },
      {
        id: "ch7-incremental-updates-kc-3",
        prompt: "After weeks of incremental updates, retrieval starts returning superseded policy text next to the current version, with both chunks carrying the same doc_id. What did the update path skip?",
        options: [
          "It skipped recomputing the content hash, so unchanged documents were needlessly re-embedded",
          "It skipped deleting the old chunks from the vector DB before inserting the re-embedded ones, leaving both generations in the index",
          "It skipped the Markdown header parsing step, so the new chunks lost their section metadata",
        ],
        correct: 1,
        feedback: "The update sequence is explicit: if the hash changed, delete old chunks from the vector DB, then re-embed and insert new chunks; skipping the delete leaves stale duplicates serving queries.",
      },
      {
        id: "ch7-incremental-updates-kc-4",
        prompt: "A manager asks why the pipeline bothers maintaining a metadata database of hashes when file modification timestamps are available for free. How do you defend content hashing?",
        options: [
          "Timestamps consume more storage than SHA-256 hashes, so hashing is purely a cost optimization",
          "Hashing is required by the embedding API's terms of service, so there is no real choice",
          "The hash represents the document's actual content, so any real content change triggers re-embedding while untouched content is skipped, regardless of what the filesystem reports",
        ],
        correct: 2,
        feedback: "Change detection is tied to the document content itself: hash the content with SHA-256, compare to the stored value, and only a content change triggers the delete-re-embed-insert path.",
      },
      {
        id: "ch7-incremental-updates-kc-5",
        prompt: "Which check best verifies that the incremental pipeline is safe to re-run after a mid-job crash, before you trust it to run unattended in production?",
        options: [
          "Re-run the job over unchanged inputs and confirm it makes no embedding calls and no index writes, with hash, timestamp, and version written only after index writes succeed",
          "Measure whether the re-run finishes faster than the original run, since speed proves idempotency",
          "Confirm the crash was logged at error severity so the on-call engineer was paged in time",
        ],
        correct: 0,
        feedback: "The design is idempotent and versioned: unchanged hashes are skipped, and the metadata DB records hash, timestamp, and version, so a repeated run is a no-op rather than a double-insert.",
      },
    ],
  },
  "ch7-data-freshness": {
    objectives: [
      "Tag every chunk with indexed_at and document_date.",
      "Enforce recency with query-time metadata filters instead of deleting history.",
      "Monitor P90 document age as an operational freshness metric.",
    ],
    sections: [
      {
        heading: "Freshness is metadata, not model behavior",
        paragraphs: [
          "Stale answers are usually a data-operations failure, not a model failure: the index keeps serving old versions because nothing records or enforces recency. The chapter's core message is that production RAG quality is constrained by data operations, and freshness is the clearest case. The fix starts at ingestion, where every chunk is tagged with indexed_at and document_date.",
          "The two timestamps answer different questions. document_date is the source document's own date, when the policy or price sheet was published, and it drives recency filtering. indexed_at records when the pipeline processed the chunk, which exposes ingestion lag: a recently published document that sat in a queue for a week is fresh by one clock and stale by the other.",
        ],
      },
      {
        heading: "Enforce recency at query time",
        paragraphs: [
          "With dates on every chunk, freshness becomes a metadata filter applied when the query runs. For time-sensitive query classes, retrieval adds a condition such as document_date within the last 90 days, so old material cannot enter the candidate set no matter how well it matches semantically.",
          "Filtering beats deleting because recency requirements differ by query class. An audit query genuinely needs the two-year-old document; a time-sensitive pricing query must never see it. A query-time filter serves both from one index, while deleting old documents to protect the time-sensitive assistant would destroy the history the audit case depends on.",
        ],
      },
      {
        heading: "Measure age, do not guess it",
        paragraphs: [
          "Freshness needs an operational metric, and the chapter names one: monitor P90 document age in the index via a dashboard. A tail percentile matters because averages hide the forgotten corner of the corpus, such as a source whose feed silently broke weeks ago while everything else stayed current.",
          "This metric closes the loop with the ingestion pipeline. Rising P90 age points upstream: change events not arriving, incremental jobs falling behind, or a source that stopped publishing. Teams that only tune prompts and rerankers will never see a freshness problem coming, because the symptom appears in answers while the cause lives in data operations.",
        ],
      },
      {
        heading: "Freshness and the event-driven pipeline",
        paragraphs: [
          "Date tags and filters assume the pipeline actually learns about changes quickly. That is why the reference architecture starts with sources emitting change events into the parse, chunk, embed, and dual-index stages. Freshness is end-to-end: fast change propagation gets new content indexed, and date metadata keeps old content out of time-sensitive queries.",
          "The same instrumentation governs the awkward cases. When a source document is deleted or superseded, the index must follow: old chunks removed by their metadata identity, hashes and versions updated in the metadata DB. A freshness story that only covers additions quietly accumulates material that should no longer be served.",
        ],
      },
    ],
    example: {
      title: "Worked example: pricing assistant citing two-year-old sheets",
      scenario:
        "A pricing assistant answers from a product wiki that is updated weekly, yet users keep receiving prices from sheets published two years ago. Legal requires the full history to remain retrievable for audits, and the team's first instinct is to re-tune the prompt.",
      analysis:
        "Nothing in the retrieval path knows about time: chunks carry no document_date, so old price sheets rank on semantic similarity alone and often win. Prompt instructions cannot fix a candidate set that already contains stale documents, and deleting the old sheets would violate the audit requirement.",
      decision:
        "Tag every chunk with indexed_at and document_date at ingestion. Pricing-class queries add a metadata filter for documents dated within the last 90 days, while audit-class queries remain unfiltered. Add a dashboard tracking P90 document age in the index with alerting, so ingestion lag is caught before users feel it.",
    },
    productionChecklist: [
      "Tag every chunk with indexed_at and document_date during ingestion.",
      "Apply document_date metadata filters at query time for time-sensitive query classes.",
      "Keep unfiltered history retrievable for query classes that need it.",
      "Monitor P90 document age in the index on a dashboard with alerts.",
      "Route staleness complaints to the ingestion pipeline before changing prompts or models.",
    ],
    commonMistakes: [
      "Treating stale answers as a model problem and editing prompts instead of filtering by date.",
      "Deleting old documents to force freshness, destroying history that other queries need.",
      "Recording only ingestion time and never the source document's own date.",
      "Having no age metric on the index, so staleness is discovered from user complaints.",
    ],
    knowledgeChecks: [
      {
        id: "ch7-data-freshness-kc-1",
        prompt: "A time-sensitive pricing assistant keeps citing two-year-old sheets, while audit queries still need the full document history. What design serves fresh answers without deleting old documents?",
        options: [
          "Delete every document older than 90 days so only fresh content remains retrievable",
          "Tag every chunk with indexed_at and document_date, then apply a document_date metadata filter at query time for time-sensitive query classes",
          "Add a prompt instruction telling the model to prefer recent information in its answers",
        ],
        correct: 1,
        feedback: "The freshness pattern tags chunks with indexed_at and document_date and applies a query-time metadata filter such as document_date within 90 days, keeping history intact for other query classes.",
      },
      {
        id: "ch7-data-freshness-kc-2",
        prompt: "In the pricing assistant worked example, why is re-tuning the prompt the wrong first move, even though stale prices are exactly what users see in the generated answers?",
        options: [
          "Prompts cannot express time concepts at all, so the model would ignore any date instruction",
          "Prompt re-tuning is always the wrong move in production systems regardless of the failure",
          "The retrieval candidate set already contains stale chunks that rank on semantic similarity alone, and no prompt can remove them from the evidence the model sees",
        ],
        correct: 2,
        feedback: "Freshness is a data-operations problem: without a document_date filter, old chunks enter the candidate set on semantic match, and generation cannot repair what retrieval already surfaced.",
      },
      {
        id: "ch7-data-freshness-kc-3",
        prompt: "A source system's feed silently broke three weeks ago while everything else stayed current, yet the team's freshness dashboard showed a healthy average document age. What went wrong with the monitoring?",
        options: [
          "Averages hide the tail; the prescribed metric is P90 document age in the index, which would have exposed the forgotten corner of the corpus",
          "The dashboard should have tracked embedding latency instead, since slow embedding causes staleness",
          "Nothing went wrong; a broken feed is a source-system problem and cannot be observed from the index",
        ],
        correct: 0,
        feedback: "The metric is stated directly: monitor P90 document age in the index via dashboard, because a tail percentile catches a silently stale source that an average would hide.",
      },
      {
        id: "ch7-data-freshness-kc-4",
        prompt: "A stakeholder proposes deleting all documents older than 90 days to guarantee freshness for a pricing assistant whose audit queries still need the history. How do you defend query-time filtering over deletion?",
        options: [
          "Deletion is slower than filtering at query time, and ingestion latency is the binding constraint",
          "The vector DB does not support deletion at all, so filtering is the only mechanism available",
          "Recency requirements differ by query class: audits need the old documents, so one index with a document_date filter serves both, while deletion would destroy required history",
        ],
        correct: 2,
        feedback: "The document_date filter is applied at query time for time-sensitive queries, which presumes old documents stay indexed for query classes that legitimately need them.",
      },
      {
        id: "ch7-data-freshness-kc-5",
        prompt: "Which monitoring setup gives the team an early warning that freshness is degrading, before users start complaining about stale answers coming from the assistant?",
        options: [
          "Track user complaint volume week over week, since users are the most direct freshness signal",
          "Dashboard the P90 document age in the index with alerts, so ingestion lag and silently broken feeds surface as an operations metric",
          "Sample ten queries per day and read the answers by hand to judge whether they feel current",
        ],
        correct: 1,
        feedback: "The freshness guidance is explicit: monitor P90 document age in the index via dashboard, turning staleness into an observable metric instead of a user-reported surprise.",
      },
    ],
  },
};

export const chapter07Practice: CatalogPracticeUnit[] = [
  {
    id: "ch7-7-2-1",
    chapter: 7,
    chapterTitle: "Data Pipeline & Ingestion",
    title: "How do you handle real-time data updates?",
    pages: "57",
    route: "/practice/data-pipeline-and-ingestion/how-do-you-handle-real-time-data-updates",
    competencies: ["parsing", "CDC", "idempotency", "deduplication", "freshness", "embedding versions"],
    question: "Your RAG system must always reflect changes made to source documents within 60 seconds. How do you design this?",
    options: [
      {
        text: "Build a change-data-capture pipeline: sources emit create, update, and delete events to a Kafka topic, a consumer fetches the changed document and runs parse, chunk, embed in batches, then upserts by doc_id with delete-by-metadata for removals, all sized against an explicit per-stage latency budget of roughly 35 seconds against the 60-second SLA.",
        correct: true,
        feedback:
          "Matches the senior pattern: an event-driven CDC design with a stated latency budget per stage, batched embedding for throughput, idempotent upserts, and deletes handled via doc_id metadata rather than true vector deletion.",
      },
      {
        text: "Re-embed the entire corpus every minute with a large embedding batch size so the index is never more than a minute behind the sources.",
        correct: false,
        feedback:
          "Full re-embedding every minute is economically and operationally unworkable at corpus scale, and it still leaves deleted documents in the index, which is exactly the awkward delete case junior answers miss.",
      },
      {
        text: "Attach a re-embed-on-change trigger to each source system and process every update one document at a time as it arrives.",
        correct: false,
        feedback:
          "Re-embed on change is the junior answer: it has no event backbone, no latency budget measured against the SLA, no batching for throughput, and no plan for handling deletes.",
      },
    ],
  },
  {
    id: "ch7-7-2-2",
    chapter: 7,
    chapterTitle: "Data Pipeline & Ingestion",
    title: "How do you re-index without downtime?",
    pages: "57",
    route: "/practice/data-pipeline-and-ingestion/how-do-you-re-index-without-downtime",
    competencies: ["parsing", "CDC", "idempotency", "deduplication", "freshness", "embedding versions"],
    question: "You need to re-embed all 10 million documents with a new embedding model. How do you do this with zero downtime?",
    options: [
      {
        text: "Run the re-embedding job in place over a quiet weekend, overwriting each document's vectors inside the live collection as the job progresses.",
        correct: false,
        feedback:
          "In-place re-embedding mixes two embedding models in one index for the duration of the migration, and the critical constraint is that the embedding model and the index must always match; a mixed index returns meaningless similarities.",
      },
      {
        text: "Take the search service offline overnight, rebuild the index with the new model, and bring it back up before morning traffic arrives.",
        correct: false,
        feedback:
          "This is scheduled downtime, which the scenario explicitly forbids, and it offers no rollback path if the new model underperforms once traffic returns.",
      },
      {
        text: "Use blue-green re-indexing: build a new docs-v2 collection with the new model, dual-write all new ingestion to both v1 and v2 during the migration, shadow-test 1% of queries comparing Recall@5, canary from 5% to 25% to 50% to 100% with quality gates, then flip traffic and decommission v1 after 48 hours of monitoring.",
        correct: true,
        feedback:
          "This is the senior pattern: separate collections per model version, dual-write during migration, shadow and canary validation with quality gates, and the hard invariant that a query is never routed to an index built by a different embedding model.",
      },
    ],
  },
  {
    id: "ch7-7-2-3",
    chapter: 7,
    chapterTitle: "Data Pipeline & Ingestion",
    title: "How do you handle duplicate documents?",
    pages: "58",
    route: "/practice/data-pipeline-and-ingestion/how-do-you-handle-duplicate-documents",
    competencies: ["parsing", "CDC", "idempotency", "deduplication", "freshness", "embedding versions"],
    question: "Your ingestion pipeline receives the same document from multiple sources. How do you detect and handle duplicates?",
    options: [
      {
        text: "Compute a SHA-256 hash of each incoming document and skip anything whose hash already exists in the metadata DB.",
        correct: false,
        feedback:
          "Exact hashing is only the first of three levels: it misses near-duplicates such as version 1.0 versus 1.1 of the same policy, and it does nothing about boilerplate chunks repeated across many pages.",
      },
      {
        text: "Apply three levels matched to the duplicate type: SHA-256 content hashes for exact copies with an O(1) metadata lookup, MinHash or SimHash for near-duplicates with minor edits, and embedding cosine similarity above roughly 0.97 for semantic duplicates while keeping the highest-quality source, plus MinHash LSH dedup at chunk level before embedding so boilerplate never pollutes the index.",
        correct: true,
        feedback:
          "The senior answer distinguishes exact, near-duplicate, and semantic dedup and adds chunk-level dedup before embedding; matching the dedup technique to the duplicate type is the signal interviewers look for.",
      },
      {
        text: "Index everything as received and rely on retrieval-time ranking to push duplicate documents out of the top results.",
        correct: false,
        feedback:
          "Duplicates left in the index waste embedding and storage spend and can crowd distinct documents out of top-k results; deduplication belongs in the ingestion pipeline, not as a hope placed on ranking.",
      },
    ],
  },
  {
    id: "ch7-7-2-4",
    chapter: 7,
    chapterTitle: "Data Pipeline & Ingestion",
    title: "How do you version embeddings?",
    pages: "58",
    route: "/practice/data-pipeline-and-ingestion/how-do-you-version-embeddings",
    competencies: ["parsing", "CDC", "idempotency", "deduplication", "freshness", "embedding versions"],
    question: "How do you manage embedding model versions in a production system where models change regularly?",
    options: [
      {
        text: "Record the embedding model name in each chunk's metadata and keep vectors from all model versions together in one shared collection.",
        correct: false,
        feedback:
          "Tagging alone is the junior answer: vectors produced by different models are not comparable, so a shared collection silently corrupts similarity search for whichever version the query uses.",
      },
      {
        text: "Re-embed the whole corpus immediately whenever a better model is released, so the index only ever contains one embedding version at a time.",
        correct: false,
        feedback:
          "Immediate full re-embedding has no rollback path and no comparison evidence; if the new model degrades quality metrics, going back means running the entire job again.",
      },
      {
        text: "Keep a separate collection per model version such as docs-emb-v1 and docs-emb-v2, tag every chunk with its embedding_model, and let the query router read the serving version from config, so rollback is a config change with no recomputation and new versions are validated by A/B-comparing RAGAS scores and user feedback before cutover.",
        correct: true,
        feedback:
          "Exactly the prescribed versioning scheme: per-version collections plus config-based routing make rollback instant, and parallel A/B evaluation gates the cutover instead of hoping the new model is better.",
      },
    ],
  },
];
