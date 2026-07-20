import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

// Chapter 1: RAG Fundamentals.
// Learn content for this chapter already lives in learningContent.ts (rag-anatomy);
// this file only contributes the interview drills for the catalog Practice units
// 1.2.1-1.2.5, authored from the chapter's Tough Questions and Core Concepts.

const chapterTitle = "RAG Fundamentals";
const competencies = ["RAG selection", "embeddings", "chunking", "vector databases", "similarity"];

export const chapter01Practice: CatalogPracticeUnit[] = [
  {
    id: "ch1-1-2-1",
    chapter: 1,
    chapterTitle,
    title: "Why use RAG instead of fine-tuning? When does RAG fail?",
    pages: "26",
    route: "/practice/rag-fundamentals/why-use-rag-instead-of-fine-tuning-when-does-rag-fail",
    competencies,
    question:
      "In a system design interview for a documentation assistant, the interviewer asks: \"Why use RAG instead of fine-tuning, and when does RAG actually fail?\" Which answer is strongest?",
    options: [
      {
        text: "Choose RAG because the knowledge changes frequently, answers need citations and traceable sources, and iteration must not require retraining; then explain that RAG fails in identifiable ways — wrong chunks returned or the answer missing from the index, the answer spanning chunk boundaries, query language differing from document language, questions needing multi-hop reasoning, a stale index, or the LLM ignoring retrieved context — and that you diagnose it by evaluating retrieval (Recall@K) and generation (faithfulness) separately, then fixing the measured bottleneck.",
        correct: true,
        feedback:
          "Correct. This mirrors the chapter's guidance: RAG wins on fresh knowledge, citations, and fast iteration, and a senior answer separates retrieval failure from generation failure, localizing each with Recall@K versus faithfulness before committing to a fix.",
      },
      {
        text: "Prefer RAG in every situation, and if it keeps failing on domain questions, fine-tune the base model directly on the document corpus so the facts are stored permanently in the weights.",
        correct: false,
        feedback:
          "The chapter explicitly warns that fine-tuning is a poor knowledge-injection tool: it is expensive, cannot be updated cheaply, and tends to memorize unreliably while hallucinating confidently on half-learned facts. It also never separates retrieval failures from generation failures.",
      },
      {
        text: "When RAG answers poorly, treat the pipeline as one opaque component: stuff more retrieved chunks into the prompt and keep rewording the prompt until the final answers look better.",
        correct: false,
        feedback:
          "This tunes everything at once and cannot localize the failure. The chapter's fix strategy is to measure retrieval and generation separately — low Recall@K means fix chunking and embedding; low faithfulness despite good retrieval means fix the prompt.",
      },
    ],
  },
  {
    id: "ch1-1-2-2",
    chapter: 1,
    chapterTitle,
    title: "How do embedding models impact retrieval quality?",
    pages: "26",
    route: "/practice/rag-fundamentals/how-do-embedding-models-impact-retrieval-quality",
    competencies,
    question:
      "The interviewer continues: \"How do embedding models impact retrieval quality, and which would you choose for a domain-specific system?\" What does the strongest answer include?",
    options: [
      {
        text: "Pick the top-ranked model on the MTEB leaderboard and ship it, since leaderboard rank reliably predicts retrieval recall on any corpus, including specialized domains.",
        correct: false,
        feedback:
          "The chapter treats MTEB only as a starting filter; the senior move is to build a domain golden set and choose by measured recall on your own data, not by leaderboard rank.",
      },
      {
        text: "Choose the largest, highest-dimensional embedding model available, because bigger models are always better retrievers, and chunk your documents to the model's maximum length regardless of cost.",
        correct: false,
        feedback:
          "The chapter calls \"bigger models are better\" the junior answer. Higher dimensionality is more expressive but slower and costlier, some models cap input at 512 tokens, and a smaller, cheaper model is the right choice when it matches measured quality on your data.",
      },
      {
        text: "Call the embedding model the single biggest lever on retrieval quality, then discuss concrete factors — dimensionality, general-purpose versus domain-trained data, pooling strategy, and max context length — and propose starting from a strong baseline such as text-embedding-3-large or BGE-large, evaluating on a domain test set with MTEB metrics as a filter, and fine-tuning on (query, positive, hard negative) triplets only if recall is still poor.",
        correct: true,
        feedback:
          "Correct. This names the levers the chapter lists (dimensionality, training data, pooling, context length), follows its baseline-then-domain-eval-then-contrastive-fine-tuning sequence, and accepts a smaller model when measured quality matches.",
      },
    ],
  },
  {
    id: "ch1-1-2-3",
    chapter: 1,
    chapterTitle,
    title: "What happens if chunk size is too large or too small?",
    pages: "27",
    route: "/practice/rag-fundamentals/what-happens-if-chunk-size-is-too-large-or-too-small",
    competencies,
    question:
      "Next the interviewer asks: \"What happens if chunk size is too large or too small, and how would you tune it?\" Which response shows the best grasp of the trade-off?",
    options: [
      {
        text: "Err toward very large chunks that fill as much of the generation context window as possible, because the LLM can always find the answer inside a big chunk, so chunk size only matters for fitting the prompt.",
        correct: false,
        feedback:
          "The chapter states the opposite: oversized chunks (2000+ tokens) make the embedding average over too much content, so precision drops and irrelevant content dilutes the relevant signal. It also skips any measurement loop.",
      },
      {
        text: "Too small (50-100 tokens) leaves each chunk without context, makes embeddings noisy, splits answers across chunks so no single chunk is sufficient, and raises indexing and search cost; too large (2000+ tokens) averages the embedding over too much content, dilutes the relevant signal, and drops precision. Tune it as a measured parameter: start near 512 tokens with about 64 tokens of overlap, track Context Precision@5, grid-search sizes on a labeled eval set, and consider parent-child chunking — roughly 400-token children for retrieval with 1600-token parents returned for generation.",
        correct: true,
        feedback:
          "Correct. This covers both failure directions from the chapter and its full tuning loop: a concrete starting point, a named metric (Context Precision@5), grid search on labeled data, and the parent-child pattern that decouples retrieval granularity from generation context.",
      },
      {
        text: "Err toward the smallest chunks possible so every embedding is maximally focused, and simply retrieve many more chunks to reconstruct whatever context any single chunk is missing.",
        correct: false,
        feedback:
          "Tiny chunks lack context, their embeddings are noisy, answers span multiple chunks with none individually sufficient, and indexing and searching far more chunks raises retrieval cost. The chapter's sanctioned way to decouple matching granularity from reading context is parent-child chunking, not ever-smaller chunks.",
      },
    ],
  },
  {
    id: "ch1-1-2-4",
    chapter: 1,
    chapterTitle,
    title: "Explain cosine similarity vs inner product in high-dimensional space",
    pages: "27",
    route: "/practice/rag-fundamentals/explain-cosine-similarity-vs-inner-product-in-high-dimensional-space",
    competencies,
    question:
      "The interviewer then tests vector-search fundamentals: \"What is the difference between cosine similarity and inner product, and when does each fail in high-dimensional space?\" Which answer would you give?",
    options: [
      {
        text: "Cosine similarity is always the correct metric for text and dot product is simply wrong, so you should compute true cosine at query time even when all your vectors are already L2-normalized.",
        correct: false,
        feedback:
          "This misses the equivalence the chapter derives: once both vectors are unit length the cosine denominator collapses to 1, so dot product delivers cosine semantics at inner-product speed — the standard production pattern, and one many ANN indexes are optimized for.",
      },
      {
        text: "Adopt a universal similarity cutoff such as cosine > 0.7 taken from published examples, because cosine scores carry a stable meaning across embedding models and corpora.",
        correct: false,
        feedback:
          "The chapter explicitly warns against hard-coding a threshold from a blog post: absolute score ranges are model- and corpus-specific — contrastively trained models spread scores while older anisotropic models score even unrelated pairs high — so thresholds must be calibrated per model on your own data.",
      },
      {
        text: "Cosine normalizes by magnitude, so it measures angle only — two vectors with the same direction but different lengths count as identical — while dot product mixes direction and magnitude, letting a long document with many relevant terms score higher at the same angular distance. After L2-normalizing every vector the two are mathematically identical, so normalize once at index time and use an inner-product index. In high dimensions the contrast between nearest and farthest neighbors shrinks, ranking matters more than raw scores, and thresholds must be calibrated per model and corpus.",
        correct: true,
        feedback:
          "Correct. This gives the chapter's angle-versus-magnitude distinction, its L2-normalization equivalence and indexing rule, and both high-dimensional caveats — shrinking distance contrast and non-portable, model-specific score ranges.",
      },
    ],
  },
  {
    id: "ch1-1-2-5",
    chapter: 1,
    chapterTitle,
    title: "How do you handle domain-specific vocabulary?",
    pages: "28",
    route: "/practice/rag-fundamentals/how-do-you-handle-domain-specific-vocabulary",
    competencies,
    question:
      "For the final question: \"Users query your RAG system with domain-specific jargon the embedding model has never seen — how do you handle it?\" What is the strongest answer?",
    options: [
      {
        text: "Sequence interventions from cheapest to costliest and let evidence decide how far to go: add BM25 — or SPLADE learned sparse representations — so exact rare terms still match, maintain a domain glossary that expands synonyms and acronyms at both index and query time, use an LLM to rewrite queries with jargon plus plain-language equivalents, tag documents with a controlled vocabulary for metadata filtering, and fine-tune the embedding model on contrastive pairs from real domain query logs only when retrieval still misses.",
        correct: true,
        feedback:
          "Correct. This is the chapter's layered playbook — BM25/SPLADE, glossary expansion, query rewriting, metadata filtering, then embedding fine-tuning — sequenced by cost and grounded in where retrieval actually misses, which is exactly the senior signal it describes.",
      },
      {
        text: "Go straight to fine-tuning the embedding model on domain data, because vocabulary the model has never seen can only be fixed by changing the model itself.",
        correct: false,
        feedback:
          "The chapter calls jumping directly to embedding fine-tuning the junior answer. Cheaper fixes — exact-term sparse retrieval, glossary and acronym expansion, query rewriting — come first, and fine-tuning is justified only when evidence shows those still leave retrieval misses.",
      },
      {
        text: "Switch to a much larger general-purpose embedding model, since a bigger training corpus will almost certainly have absorbed the domain jargon and closed the representation gap.",
        correct: false,
        feedback:
          "Jargon the embedding model has never seen is precisely the representation gap this question targets, and the chapter never prescribes scale as the fix — it prescribes exact-match sparse channels, glossary expansion, query rewriting, and targeted contrastive fine-tuning on domain pairs.",
      },
    ],
  },
];
