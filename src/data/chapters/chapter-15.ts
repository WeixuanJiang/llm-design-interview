import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter15Module: LearningModule = {
  id: "chapter-15-multimodal-rag",
  title: "Multimodal RAG",
  description:
    "Retrieval over knowledge that is not plain text — scanned PDFs, slides, charts, diagrams, screenshots, and photographs. Compare the OCR-to-text pipeline with vision-language retrieval that keeps the page as an image, and reason about cost, accuracy, and where each approach breaks.",
  duration: "2 lessons",
  lessons: [
    {
      id: "ch15-text-only-rag-fails",
      title: "Why Text-Only RAG Fails on Visual Documents",
      prompt: "Recognize when OCR flattening destroys the answer",
      question:
        "A financial-services team wants Q&A over tens of thousands of earnings PDFs whose key answers live in charts and tables. The platform lead proposes the standard stack: OCR every page to text, chunk, embed, and run normal text RAG. What is the primary risk of this plan?",
      options: [
        "OCR licensing and compute make the pipeline too slow to index at that scale",
        "The text index will cost more to store than keeping the original page images",
        "Flattening charts and tables to text silently destroys the layout and visual information the answers depend on",
      ],
      correct: 2,
      feedback:
        "Correct. A bar chart becomes a meaningless list of numbers, a table loses its row/column relationships, and a diagram vanishes entirely — and the system keeps answering fluently on top of the loss.",
      explanation:
        "A huge fraction of enterprise knowledge is visually structured: financial reports with tables and charts, slide decks, engineering diagrams, and scanned forms. Running these through an OCR-to-text pipeline loses the very information that answers the question, and the failure mode is silent data loss on visuals rather than an obvious error. Multimodal RAG exists to keep visual content as a first-class retrievable modality.",
      takeaways: [
        "OCR-to-text is lossy compression: charts become number lists, tables lose structure, diagrams disappear.",
        "The failure is silent — the pipeline returns fluent answers with no signal that evidence was destroyed at indexing time.",
        "Choose the pipeline by corpus: prose, wikis, code, and tickets suit text RAG; reports, slides, scanned docs, and forms do not.",
      ],
      model: ["Classify the corpus: prose or visually structured?", "Identify what OCR would destroy", "Keep pages visual when answers live in layout"],
      source: { chapter: 15, sections: ["15.1.1"], pages: "94" },
    },
    {
      id: "ch15-vision-language-retrieval",
      title: "Vision-Language Retrieval Approaches",
      prompt: "Match the retriever to the document type",
      question:
        "A team must retrieve from scanned forms and financial reports where the answer sits inside a specific table cell or chart region on a complex page layout. Which retriever is the best primary fit?",
      options: [
        "ColPali, because it embeds page images at patch level with late-interaction matching and can localize a region such as a table cell without running OCR",
        "CLIP, because its shared image-text vector space makes it the strongest option for dense text inside a document page image",
        "An OCR-to-text pipeline, because parsing to text first always improves retrieval quality on complex layouts",
      ],
      correct: 0,
      feedback:
        "Correct. ColPali feeds the page image directly into a vision-language model and produces multi-vector, ColBERT-style embeddings over image patches, so a query can match the relevant region of a page with no fragile parsing step.",
      explanation:
        "CLIP and successors like SigLIP jointly embed images and text into a shared vector space and are the workhorse for retrieving natural images and figures by description, but they capture global image semantics and are weak on dense in-image text such as the small print on a document page. ColPali is purpose-built for document pages: multi-vector late interaction over patches, no OCR, strong on complex layouts — at the cost of larger multi-vector storage and higher compute. The production pattern renders each page to an image, retrieves page images, and lets a vision-capable generator read the chart or table directly with a citation back to the page.",
      takeaways: [
        "CLIP retrieves images by description but is a poor primary retriever for text-heavy document pages.",
        "ColPali trades multi-vector storage and compute for OCR-free, layout-aware page retrieval.",
        "The production PDF-with-charts pipeline is: render pages, index visually and/or extract tables and figures, retrieve page images, generate with a vision-capable LLM that cites the page.",
      ],
      model: ["Characterize the corpus", "Pick the retriever that fits it", "Benchmark on a corpus-specific golden set"],
      source: { chapter: 15, sections: ["15.1.2"], pages: "94" },
    },
  ],
};

export const chapter15CourseContent: Record<string, LessonCourseContent> = {
  "ch15-text-only-rag-fails": {
    objectives: [
      "Explain why visually structured enterprise knowledge breaks OCR-to-text RAG pipelines.",
      "Name the specific information destroyed when charts, tables, and diagrams are flattened to text.",
      "Compare text-only and multimodal RAG across indexing, retriever, generator, cost, failure mode, and best-fit corpus.",
    ],
    sections: [
      {
        heading: "Enterprise knowledge is visually structured",
        paragraphs: [
          "Retrieval systems are usually designed as if knowledge were plain prose, but a huge fraction of enterprise knowledge is not: financial reports packed with tables and charts, slide decks, engineering diagrams, and scanned forms. In these documents the layout is not decoration — it is part of how the information is encoded.",
          "The naive approach is to OCR everything to text and then run a standard text RAG pipeline on top. This is attractive because it reuses all existing text infrastructure, but it assumes the answer survives flattening. For visually structured documents that assumption fails exactly where it matters.",
        ],
      },
      {
        heading: "What OCR flattening actually destroys",
        paragraphs: [
          "OCR-to-text loses the very information that answers the question. A bar chart becomes a meaningless list of numbers with no axes or series labels. A table loses its row/column relationships, so a figure can no longer be tied to the line item and period it belongs to. A diagram vanishes entirely.",
          "The dangerous part is that this is silent data loss. The pipeline does not error; it indexes happily and the generator still produces fluent answers — they are just unsupported by evidence that was destroyed at ingestion time. Text-only RAG on visual documents therefore fails before retrieval even begins.",
        ],
      },
      {
        heading: "The two pipelines side by side",
        paragraphs: [
          "Text-only RAG indexes by parsing, OCR, chunking, and embedding, retrieves with a text embedding model, and generates with a text LLM. Multimodal RAG renders each page to an image, indexes with a vision-language or multi-vector retriever such as ColPali, and generates with a vision-capable LLM that reads the chart or table directly.",
          "The trade-offs line up predictably. Text-only RAG handles neither charts nor diagrams and handles tables poorly, but it is cheaper and lower-latency. Multimodal RAG preserves layout and reads visuals, at higher cost from image tokens and larger models. Their failure modes are mirrors: silent data loss on visuals for text-only, versus higher cost and weaker performance on pure long-form text for multimodal.",
        ],
      },
      {
        heading: "When text-only RAG is still the right tool",
        paragraphs: [
          "Multimodal retrieval is not an upgrade to apply everywhere. For prose-heavy corpora — wikis, code, tickets, clean text-dominant documents — text-only RAG remains cheaper, simpler, and plugs into existing infrastructure, and the multimodal path is comparatively weaker on pure long-form text.",
          "The selection question is therefore about the corpus, not the technology. Ask where the answers live: if they live in paragraph text, keep the text pipeline; if they live in the layout of reports, slides, scanned documents, and forms, keeping the page as an image stops being optional.",
        ],
      },
    ],
    example: {
      title: "Worked example: earnings-report Q&A over flattened charts",
      scenario:
        "A team OCRs its archive of financial PDFs into a text index and launches a Q&A assistant. A user asks how revenue trended across the year, and the answer lives in a revenue chart on page 6 of a report. The assistant replies with generic commentary that does not match the actual figures.",
      analysis:
        "The chart that held the answer was flattened during OCR into a list of numbers with no trend information, so no retrieval strategy could recover it — the loss happened at indexing. This is the textbook silent failure: the system retrieves and generates confidently on top of missing evidence, and nothing in the pipeline flags it.",
      decision:
        "Keep pages visual for this corpus: render each page to an image, index the images with a document-aware visual retriever, and pass retrieved page images to a vision-capable generator that reads the chart directly and cites the document and page. Reserve the OCR-to-text stack for corpora that are genuinely prose.",
    },
    productionChecklist: [
      "Audit the corpus for visual structure — tables, charts, diagrams, scans — before committing to a text pipeline.",
      "Sample real pages and compare OCR output against the original to make information loss visible.",
      "Treat silent data loss on visuals as a first-class failure mode, not an edge case.",
      "Keep document ID and page number as provenance so answers can cite back to the source page.",
      "Match the pipeline to the corpus: text RAG for prose, wikis, code, and tickets; visual retrieval for reports, slides, scanned docs, and forms.",
    ],
    commonMistakes: [
      "Defaulting to OCR-to-text because the text infrastructure already exists, without checking what the corpus actually looks like.",
      "Assuming OCR preserves tables, when in practice row/column relationships are flattened away.",
      "Having no detection for silent visual data loss, so fluent-but-unsupported answers reach users.",
      "Applying multimodal retrieval to pure long-form prose, paying image-token and larger-model costs where text RAG is stronger.",
    ],
    knowledgeChecks: [
      {
        id: "ch15-text-only-rag-fails-kc-1",
        prompt:
          "A legal team archives thousands of scanned contracts and forms and wants question answering; an engineer proposes OCR to text followed by standard chunking and embedding before retrieval. What is the biggest design risk?",
        options: [
          "OCR processing will make the indexing pipeline too slow to ever finish the archive",
          "Flattening pages to text silently destroys the layout, tables, and visual structure the answers depend on",
          "Scanned page images produce embedding vectors far too large for any vector store to hold",
        ],
        correct: 1,
        feedback:
          "The chapter's core warning: OCR-to-text loses the very information that answers the question — a table loses its row/column relationships and a diagram vanishes — so the risk is silent data loss, not speed or vector size.",
      },
      {
        id: "ch15-text-only-rag-fails-kc-2",
        prompt:
          "In the earnings-report assistant, users ask how revenue trended across the year and the answer lives only inside a chart on page six. Why does better chunking or a stronger text embedding model fail to fix the wrong answers?",
        options: [
          "The chart was destroyed at OCR and indexing time, so no retrieval improvement can recover information that never entered the index",
          "The embedding model was never fine-tuned on financial vocabulary, which is the only way trends can be retrieved",
          "The generator simply needs a larger context window so it can attend to the chart text more carefully",
        ],
        correct: 0,
        feedback:
          "A bar chart becomes a meaningless list of numbers under OCR flattening; retrieval operates on what was indexed, so tuning chunking or embeddings cannot restore information that was lost at ingestion.",
      },
      {
        id: "ch15-text-only-rag-fails-kc-3",
        prompt:
          "A text-only RAG system over financial reports passes its smoke tests and returns fluent, confident answers, yet analysts keep finding quoted figures that do not match the source tables. Which failure mode best explains this pattern?",
        options: [
          "The text embedding model is randomly pairing queries with unrelated documents at search time",
          "The vector index has gone stale because the corpus was not re-embedded after an upgrade",
          "Silent data loss on visuals — OCR flattened the tables' row and column relationships, and the pipeline emits no error signal for that loss",
        ],
        correct: 2,
        feedback:
          "This is the failure mode the chapter names for text-only RAG: the pipeline does not error, it just answers fluently on top of evidence that was destroyed when tables and charts were flattened.",
      },
      {
        id: "ch15-text-only-rag-fails-kc-4",
        prompt:
          "A product manager argues multimodal RAG should replace every text pipeline because it handles charts and tables. Using this lesson's side-by-side comparison of the two pipelines, how do you defend keeping text-only RAG for a corpus of wikis, code, and support tickets?",
        options: [
          "Multimodal RAG can never cite source pages, so text pipelines are always the more auditable choice for any corpus",
          "For prose-dominant corpora text RAG is cheaper and lower-latency, and the multimodal path is weaker on pure long-form text, so the image tokens and larger models buy nothing there",
          "Text-only RAG actually handles tables better than multimodal RAG because OCR normalizes numbers into clean rows",
        ],
        correct: 1,
        feedback:
          "The side-by-side comparison in this lesson gives prose, wikis, code, and tickets as text RAG's best fit at lower cost and latency, while multimodal RAG's own failure mode is higher cost and weaker results on pure long-form text.",
      },
      {
        id: "ch15-text-only-rag-fails-kc-5",
        prompt:
          "Before shipping retrieval over a mixed corpus of reports, slides, and scanned forms, what pre-launch verification should gate the release of the new pipeline?",
        options: [
          "Load-test the embedding endpoint to maximum throughput and ship whenever the latency percentile stays inside budget",
          "Fine-tune the generator on generic question-answer pairs so it responds confidently across every document type",
          "Audit the corpus for visually structured content and sample real pages to compare OCR output against the originals, so silent information loss becomes visible before the pipeline is chosen",
        ],
        correct: 2,
        feedback:
          "The production guidance in this lesson is to audit the corpus for visual structure and compare OCR output with the original pages; because the loss is silent, latency tests and generator fine-tuning cannot reveal it.",
      },
    ],
  },
  "ch15-vision-language-retrieval": {
    objectives: [
      "Explain how CLIP-family models retrieve images from text queries and where they fall short.",
      "Describe ColPali's multi-vector, late-interaction approach to document-page retrieval.",
      "Assemble the production pipeline for PDFs mixing prose, tables, and charts.",
    ],
    sections: [
      {
        heading: "CLIP and the shared image-text space",
        paragraphs: [
          "CLIP, and successors like SigLIP, jointly embed images and text into a shared vector space, so a text query can directly retrieve relevant images via cosine similarity. It is the workhorse for the 'find me the photo or figure that matches this description' problem.",
          "Its weakness is scope of perception: CLIP captures global image semantics well but is weak on dense text inside an image, such as the small print on a document page. That makes it strong for natural images and figures, and a poor primary retriever for text-heavy document pages.",
        ],
      },
      {
        heading: "ColPali: retrieval built for document pages",
        paragraphs: [
          "ColPali (2024) is purpose-built for documents. Instead of OCR-then-embed, it feeds the page image directly into a vision-language model and produces multi-vector, late-interaction embeddings in the ColBERT style over image patches. A query matches against patch-level embeddings, so it can localize the relevant region of a page — a specific table cell or chart — without ever running OCR.",
          "This dramatically simplifies the pipeline by removing fragile parsing, and it improves retrieval on complex layouts. The cost is real and must be named: multi-vector storage makes the index significantly larger, and compute is higher than a single-vector text index.",
        ],
      },
      {
        heading: "The production PDF-with-charts pipeline",
        paragraphs: [
          "For documents mixing prose, tables, and charts, the production pattern has four steps. First, render each page to an image. Second, index pages with a document-aware visual retriever such as ColPali and, in parallel, extract structured elements — tables via a table-transformer, figures via a detector — for content that must be machine-readable.",
          "Third, at query time, retrieve the relevant page images. Fourth, pass those images to a vision-capable generator — GPT-4o, Claude, or Gemini — that reads the chart or table directly and answers with a citation back to the page. The extracted tables matter because numeric questions can then be answered exactly rather than read off a picture.",
        ],
      },
      {
        heading: "Choosing and combining retrievers",
        paragraphs: [
          "The selection rule follows the corpus. A text-dominant corpus with clean digital text starts with OCR and text RAG. Figure- and photo-heavy retrieval-by-description points to the CLIP family. Layout-heavy documents — scanned forms, slides, financial reports where the answer lives in tables and charts — point to ColPali, accepting the storage and compute cost.",
          "Never pick blind: build a representative golden set from the actual corpus and benchmark retrieval quality and downstream answer accuracy per approach before committing, because the best retriever is entirely corpus-dependent. A hybrid is often right — ColPali for visual pages, text retrieval for prose sections, fused at query time — and total cost of ownership at 100k+ documents should be part of the decision.",
        ],
      },
    ],
    example: {
      title: "Worked example: RAG over 100,000 financial PDFs",
      scenario:
        "You are asked to design retrieval for 100,000 financial PDFs where most answers depend on charts and tables rather than prose. Some questions are exact and numeric ('What was Q3 free cash flow?'); others are visual ('Explain the trend in the revenue chart').",
      analysis:
        "One retrieval path cannot serve both question shapes well. Page images indexed with ColPali handle the visual-trend questions with no OCR and no fragile parsing, while a table-extraction model stores machine-readable tables so numeric questions can be answered exactly — via the extracted-table path or Text-to-SQL — instead of being read off a picture. Every page carries metadata: document ID, page number, fiscal period, document type.",
      decision:
        "Build the dual index, route queries by type — numeric to the table/SQL path, visual to page-image retrieval, hybrid questions to both — and generate with a vision-capable LLM that cites the document and page. Bound image-token cost by capping pages per query, downscaling to the minimum legible resolution, and caching page embeddings. Evaluate retrieval (did we fetch the right page?) separately from reading (did the model read the figure correctly?), since a multimodal system can retrieve the right page and still misread the chart.",
    },
    productionChecklist: [
      "Render every page to an image and attach document ID, page number, fiscal period, and document type as metadata.",
      "Run table extraction alongside visual indexing when exact numeric answers are required.",
      "Cap pages per query and downscale images to the minimum legible resolution to bound image-token cost.",
      "Cache page embeddings to avoid recomputing the multi-vector index representations.",
      "Evaluate retrieval accuracy and figure-reading accuracy as two separate failure points.",
    ],
    commonMistakes: [
      "Using CLIP as the primary retriever for text-heavy document pages, where its weakness on dense in-image text hurts retrieval.",
      "Treating ColPali as free — ignoring the significantly larger multi-vector index and higher compute in the serving bill.",
      "Committing to a retriever without benchmarking on a golden set drawn from the actual corpus.",
      "Evaluating only end-to-end answer quality, which conflates 'fetched the wrong page' with 'misread the right page'.",
    ],
    knowledgeChecks: [
      {
        id: "ch15-vision-language-retrieval-kc-1",
        prompt:
          "A design team wants 'find the figure or photo that matches this description' search over a library of natural images and illustrations, with very few dense text pages. Which retriever family fits best, and why?",
        options: [
          "ColPali, because multi-vector patch embeddings are always the cheapest way to index natural images",
          "An OCR-to-text pipeline, because descriptions of figures are reliably embedded in surrounding page text",
          "CLIP or SigLIP, because they jointly embed images and text into a shared vector space so a text query retrieves matching images by cosine similarity",
        ],
        correct: 2,
        feedback:
          "The chapter calls CLIP the workhorse for retrieval-by-description over natural images and figures thanks to its shared image-text space; ColPali's patch-level design targets document pages, and OCR cannot see unwritten visuals.",
      },
      {
        id: "ch15-vision-language-retrieval-kc-2",
        prompt:
          "In this lesson's worked example of RAG over 100,000 financial PDFs, why does the design run a table-extraction model alongside the ColPali page-image index instead of letting the vision LLM read every number off the retrieved page images?",
        options: [
          "Exact numeric questions are routed to machine-readable tables or Text-to-SQL for exactness, because a system can retrieve the right page and still misread the figure",
          "Table extraction is mandatory because ColPali is unable to index any page that contains a table",
          "The table index exists only to shrink storage, since extracted tables are always smaller than page embeddings",
        ],
        correct: 0,
        feedback:
          "The worked example splits exact numeric questions such as 'What was Q3 free cash flow?' onto the extracted-table or Text-to-SQL path so numbers are answered exactly rather than read off a picture, and it treats reading as its own failure point.",
      },
      {
        id: "ch15-vision-language-retrieval-kc-3",
        prompt:
          "A team deploys ColPali as the retriever for everything, including a large prose-only internal wiki, and is later surprised by a swelling storage bill and mediocre results on long-form text. What did they ignore?",
        options: [
          "ColPali embeddings expire shortly after indexing and silently stop matching queries over time",
          "ColPali's multi-vector index is significantly larger and compute is higher, and the selection rule starts clean text-dominant corpora like this wiki on OCR and text RAG rather than visual retrieval",
          "Multi-vector indexes cannot store metadata such as document ID and page number alongside the embeddings",
        ],
        correct: 1,
        feedback:
          "This lesson names ColPali's concrete cost — significantly larger multi-vector storage and higher compute — and its selection rule maps clean text-dominant corpora to OCR and text RAG; ColPali earns its cost on layout-heavy documents, not prose.",
      },
      {
        id: "ch15-vision-language-retrieval-kc-4",
        prompt:
          "A staff engineer proposes making ColPali the default retriever for all corpora because it is the newest option and strongest on complex layouts. How do you push back using this lesson's selection rule?",
        options: [
          "Agree, because the newest retriever dominates older ones on every corpus and simplifies the stack to one component",
          "Reject ColPali entirely, since OCR-to-text integrates with existing text infrastructure and therefore always wins",
          "Map each retriever to the corpus it fits: OCR and text RAG for clean text-dominant documents, CLIP for figure- and photo-heavy retrieval-by-description, and ColPali for layout-heavy documents where answers live in tables and charts",
        ],
        correct: 2,
        feedback:
          "The selection rule in this lesson ties each retriever to corpus characteristics instead of novelty rankings, and it names ColPali's multi-vector storage and compute cost rather than treating the strongest layout retriever as free.",
      },
      {
        id: "ch15-vision-language-retrieval-kc-5",
        prompt:
          "Before committing to a retriever for a new document corpus, what evaluation practice does this lesson insist on, and which two failure points must be measured separately rather than as one blended score?",
        options: [
          "Build a representative golden set from the actual corpus and benchmark retrieval quality and downstream answer accuracy per approach; measure retrieval ('did we fetch the right page?') separately from reading ('did the model read the figure correctly?')",
          "Run one end-to-end accuracy number on generic public benchmarks and pick whichever retriever scores highest on them",
          "Ask the vision LLM to self-report confidence on every answer and ship once the average confidence clears a threshold",
        ],
        correct: 0,
        feedback:
          "This lesson insists the best retriever is corpus-dependent, so de-risk with a golden set from the actual corpus, and it separates the two failure points: fetching the right page versus reading the figure correctly.",
      },
    ],
  },
};

export const chapter15Practice: CatalogPracticeUnit[] = [
  {
    id: "ch15-15-2-1",
    chapter: 15,
    chapterTitle: "Multimodal RAG",
    title: "Design a RAG system over PDFs full of charts and tables",
    pages: "95",
    route: "/practice/multimodal-rag/design-a-rag-system-over-pdfs-full-of-charts-and-tables",
    competencies: ["visual retrieval", "OCR limits", "ColPali/CLIP", "multimodal evaluation"],
    question:
      "Design a RAG system for 100,000 financial PDFs where most answers depend on charts and tables, not prose. Walk through indexing, retrieval, generation, cost control, and evaluation.",
    options: [
      {
        text: "Reject OCR-flattening up front: render every page to an image and index with a document-aware visual retriever like ColPali, while running table extraction in parallel for exact numeric questions. Route numeric queries to the extracted-table or Text-to-SQL path and visual-trend queries to page-image retrieval, generate with a vision-capable LLM that cites document and page, cap pages per query, downscale to minimum legible resolution, cache page embeddings — and evaluate retrieval (did we fetch the right page?) separately from reading (did the model read the figure correctly?).",
        correct: true,
        feedback:
          "This is the senior answer: it keeps pages visual, splits exact numeric questions from visual-trend questions, budgets image-token cost and resolution explicitly, and treats retrieval and reading as two separate failure points with their own evaluation.",
      },
      {
        text: "OCR all 100,000 PDFs to text and run standard text RAG with a strong embedding model, since OCR is cheap, mature, and plugs directly into existing text infrastructure.",
        correct: false,
        feedback:
          "This is the junior answer the chapter calls out: flattening a chart or table to text is exactly where the answer is lost, and the loss is silent — the system answers fluently on top of destroyed evidence.",
      },
      {
        text: "Keep the pipeline simple: send every question to ColPali-retrieved page images and let the vision LLM read all numbers directly off the charts and tables, so one unified visual path handles every query type.",
        correct: false,
        feedback:
          "A single visual path ignores the senior design's explicit split: exact numeric questions should go through extracted machine-readable tables or Text-to-SQL for exactness, and the model can retrieve the right page yet still misread the figure — which is why reading accuracy needs its own evaluation.",
      },
    ],
  },
  {
    id: "ch15-15-2-2",
    chapter: 15,
    chapterTitle: "Multimodal RAG",
    title: "ColPali vs CLIP vs OCR—how do you choose the retriever?",
    pages: "96",
    route: "/practice/multimodal-rag/colpali-vs-clip-vs-ocr-how-do-you-choose-the-retriever",
    competencies: ["visual retrieval", "OCR limits", "ColPali/CLIP", "multimodal evaluation"],
    question:
      "Compare ColPali, CLIP, and an OCR-to-text pipeline for document retrieval. How do you choose between them, and how do you de-risk the choice?",
    options: [
      {
        text: "Choose ColPali as the default for every document corpus: it is the newest approach, purpose-built for documents, and strongest on complex layouts, so it is the safe one-size-fits-all answer.",
        correct: false,
        feedback:
          "Ranking the three by novelty is the junior answer the chapter calls out — ColPali's multi-vector index is significantly larger and costs more compute, and the best retriever is entirely corpus-dependent.",
      },
      {
        text: "Always start with OCR-to-text because it is the cheapest option, roll it out, and only revisit the retriever decision if users complain about answer quality.",
        correct: false,
        feedback:
          "Cheap-and-existing is fine only for clean, text-dominant corpora; OCR's data loss on tables, charts, and layout is silent, so users get fluent wrong answers rather than complaints — the chapter insists on benchmarking against a corpus-specific golden set before committing, not after.",
      },
      {
        text: "Map each option to the corpus it fits: OCR-to-text for clean text-dominant documents, the CLIP family for figure- and photo-heavy retrieval-by-description, and ColPali for layout-heavy documents where answers live in tables and charts — naming ColPali's concrete costs in multi-vector storage and compute. Then de-risk by building a representative golden set from the actual corpus, benchmarking retrieval quality and downstream answer accuracy per approach before committing, considering a fused hybrid of ColPali for visual pages and text retrieval for prose, and accounting for total cost of ownership at 100k+ documents.",
        correct: true,
        feedback:
          "This is the staff answer: each retriever is tied to corpus characteristics, ColPali's cost is named rather than treated as free, the decision is benchmarked on a corpus-specific golden set, a fused hybrid is on the table, and total cost at scale is part of the call.",
      },
    ],
  },
];
