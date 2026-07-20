import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadPracticeRecords } from "../domain/practiceRecords";
import { DrillPlayer } from "./DrillPlayer";
import { PathPage } from "./PathPage";
import type { CatalogPracticeUnit } from "../data/pdfCatalog";

// Fixture learning modules: one chapter per stage (ch1 Foundations, ch4
// Quality, ch7 Scale & Operations, ch17 Synthesis). Chapter 17 deliberately
// has no catalog drills so the empty-drills note is exercised.
vi.mock("../data/learningContent", () => {
  const lesson = (id: string, title: string) => ({
    id, title, prompt: title, question: "", options: [], correct: 0, feedback: "", explanation: "", takeaways: [], model: [], source: { chapter: 1, sections: [], pages: "1" },
  });
  return {
    learningModules: [
      { id: "rag-anatomy", title: "RAG fundamentals", description: "", duration: "2 lessons", lessons: [lesson("adaptation-choice", "RAG, fine-tuning, or long context?"), lesson("chunking-strategies", "Chunk for retrieval and context")] },
      { id: "chapter-4-evaluation-and-metrics", title: "Evaluation & Metrics", description: "", duration: "1 lesson", lessons: [lesson("eval-basics", "Measure retrieval first")] },
      { id: "chapter-7-data-pipeline-and-ingestion", title: "Data Pipeline & Ingestion", description: "", duration: "1 lesson", lessons: [lesson("ingest-basics", "Idempotent ingestion")] },
      { id: "chapter-17-llm-fine-tuning-for-production", title: "LLM Fine-Tuning for Production", description: "", duration: "1 lesson", lessons: [lesson("ft-basics", "Curate behavior examples")] },
    ],
  };
});

// Fixture drills place the correct option at different indices (0, 2, 1) so
// tests fail if grading ever assumes a fixed answer position.
vi.mock("../data/pdfCatalog", () => ({
  catalogPracticeUnits: [
    {
      id: "1.1", chapter: 1, chapterTitle: "RAG Fundamentals", title: "Grounded prompting", pages: "22-23", route: "/practice/1-1", competencies: ["retrieval"],
      question: "How should you keep answers grounded when the knowledge base changes daily?",
      options: [
        { text: "Retrieve fresh evidence at request time and cite it", correct: true, feedback: "Correct. Request-time retrieval keeps answers fresh and traceable." },
        { text: "Fine-tune the model on the full corpus every week", correct: false, feedback: "Weekly fine-tuning lags the data and hides provenance." },
        { text: "Rely on the model's parametric memory of the docs", correct: false, feedback: "Parametric memory is stale and cannot cite sources." },
      ],
    },
    {
      id: "1.2", chapter: 1, chapterTitle: "RAG Fundamentals", title: "Chunk sizing", pages: "24-25", route: "/practice/1-2", competencies: ["retrieval"],
      question: "A support bot quotes half-sentences from your docs. What do you fix first?",
      options: [
        { text: "Increase the generation temperature", correct: false, feedback: "Temperature changes wording, not retrieval boundaries." },
        { text: "Add a larger LLM as a reranker", correct: false, feedback: "Reranking cannot recover evidence that chunking destroyed." },
        { text: "Re-chunk with structure-aware boundaries and overlap", correct: true, feedback: "Correct. Boundary-aware chunking keeps decisive passages intact." },
      ],
    },
    {
      id: "4.1", chapter: 4, chapterTitle: "Evaluation & Metrics", title: "Golden sets", pages: "40-41", route: "/practice/4-1", competencies: ["evaluation"],
      question: "What makes an offline evaluation set trustworthy?",
      options: [
        { text: "Use the biggest unlabeled crawl available", correct: false, feedback: "Volume without labels cannot score quality." },
        { text: "Build a representative labeled set with hard cohorts", correct: true, feedback: "Correct. Representative labels and hard cohorts keep scores honest." },
        { text: "Reuse the training split for speed", correct: false, feedback: "Contaminated benchmarks inflate the result." },
      ],
    },
  ],
}));

const defaultProps = () => ({
  completedLessons: [] as string[],
  completedModules: [] as string[],
  reviewed: 0,
  correct: 0,
  onReviewed: vi.fn(),
  onOpenLesson: vi.fn(),
  onOpenTraining: vi.fn(),
  onOpenMissions: vi.fn(),
});

const moduleToggle = (name: RegExp) => screen.getByRole("button", { name });

describe("PathPage", () => {
  beforeEach(() => localStorage.clear());

  it("organizes every module into four stages with a header mastery overview", () => {
    render(<PathPage {...defaultProps()} />);

    expect(screen.getByText("Learning path")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /foundations/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^quality$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /scale & operations/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /synthesis/i })).toBeInTheDocument();
    expect(screen.getByText(/chapters 1–3/i)).toBeInTheDocument();
    expect(screen.getByText(/chapters 14–24/i)).toBeInTheDocument();

    const modulesStat = screen.getByText(/modules complete/i).closest("div");
    expect(modulesStat).toHaveTextContent("0/4");
    expect(screen.getByText(/drills reviewed/i)).toBeInTheDocument();
    expect(screen.getByText(/drill accuracy/i)).toBeInTheDocument();

    // Every chapter card exposes a lessons meter and a drills meter.
    expect(screen.getAllByRole("progressbar")).toHaveLength(8);
  });

  it("expands chapter cards with aria-expanded and routes lesson clicks", () => {
    const props = defaultProps();
    render(<PathPage {...props} completedLessons={["chunking-strategies"]} />);

    // The first incomplete module starts expanded; others start collapsed.
    const ragToggle = moduleToggle(/rag fundamentals/i);
    const evalToggle = moduleToggle(/evaluation & metrics/i);
    expect(ragToggle).toHaveAttribute("aria-expanded", "true");
    expect(evalToggle).toHaveAttribute("aria-expanded", "false");
    expect(ragToggle).toHaveTextContent("1/2 lessons · 2 drills");

    fireEvent.click(evalToggle);
    expect(evalToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("progressbar", { name: /evaluation & metrics lessons complete/i })).toHaveAttribute("aria-valuenow", "0");

    fireEvent.click(screen.getByRole("button", { name: /measure retrieval first/i }));
    expect(props.onOpenLesson).toHaveBeenCalledWith("chapter-4-evaluation-and-metrics", "eval-basics");
  });

  it("answers a drill inline, records the attempt, and refreshes badge and mastery", () => {
    const props = defaultProps();
    render(<PathPage {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /1\.1 grounded prompting/i }));
    const player = screen.getByLabelText(/drill 1\.1: grounded prompting/i);
    fireEvent.click(within(player).getByRole("button", { name: /parametric memory/i }));
    fireEvent.click(within(player).getByRole("button", { name: /submit answer/i }));

    expect(props.onReviewed).toHaveBeenCalledTimes(1);
    expect(props.onReviewed).toHaveBeenCalledWith(false);
    expect(loadPracticeRecords()["1.1"]).toMatchObject({ attempts: 1, correct: 0 });
    expect(within(player).getByRole("status")).toHaveTextContent(/parametric memory is stale/i);
    expect(within(player).getByRole("button", { name: /retrieve fresh evidence/i })).toHaveClass("drill-option--correct");
    expect(within(player).getByRole("button", { name: /parametric memory/i })).toHaveClass("drill-option--incorrect");

    // The row badge flips to Missed and the chapter drill meter stays 0/2.
    expect(screen.getByRole("button", { name: /1\.1 grounded prompting/i })).toHaveTextContent("Missed");
    expect(screen.getByRole("progressbar", { name: /rag fundamentals drills mastered/i })).toHaveAttribute("aria-valuenow", "0");
  });

  it("turns a mastered drill badge to Answered and advances the drill meter", () => {
    const props = defaultProps();
    render(<PathPage {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /1\.2 chunk sizing/i }));
    const player = screen.getByLabelText(/drill 1\.2: chunk sizing/i);
    fireEvent.click(within(player).getByRole("button", { name: /re-chunk with structure-aware/i }));
    fireEvent.click(within(player).getByRole("button", { name: /submit answer/i }));

    expect(props.onReviewed).toHaveBeenCalledWith(true);
    expect(loadPracticeRecords()["1.2"]).toMatchObject({ attempts: 1, correct: 1 });
    expect(screen.getByRole("button", { name: /1\.2 chunk sizing/i })).toHaveTextContent("Answered");
    expect(screen.getByRole("progressbar", { name: /rag fundamentals drills mastered/i })).toHaveAttribute("aria-valuenow", "1");
  });

  it("shows an empty note for chapters without catalog drills", () => {
    render(<PathPage {...defaultProps()} />);
    fireEvent.click(moduleToggle(/fine-tuning for production/i));
    expect(screen.getByText(/no catalog drills are mapped/i)).toBeInTheDocument();
  });

  it("routes special training and mission calls to action", () => {
    const props = defaultProps();
    render(<PathPage {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /open failure lab/i }));
    expect(props.onOpenTraining).toHaveBeenCalledWith("failure");
    fireEvent.click(screen.getByRole("button", { name: /start mock interview/i }));
    expect(props.onOpenTraining).toHaveBeenCalledWith("mock");
    fireEvent.click(screen.getByRole("button", { name: /browse missions/i }));
    expect(props.onOpenMissions).toHaveBeenCalledTimes(1);
  });
});

describe("DrillPlayer", () => {
  const unit: CatalogPracticeUnit = {
    id: "9.9", chapter: 9, chapterTitle: "Agentic RAG", title: "Tool budgets", pages: "90-91", route: "/practice/9-9", competencies: ["agents"],
    question: "How should an agent's tool use be bounded?",
    options: [
      { text: "Let the planner call tools until it stops", correct: false, feedback: "Unbounded loops are a production failure mode." },
      { text: "Give typed tools explicit budgets and approval gates", correct: true, feedback: "Correct. Typed tools with budgets keep autonomy predictable." },
      { text: "Hide tool state from the trace", correct: false, feedback: "Hidden state makes behavior unverifiable." },
    ],
  };

  it("renders the question and options in data order", () => {
    render(<DrillPlayer unit={unit} onResult={vi.fn()} />);

    expect(screen.getByText(/how should an agent's tool use be bounded/i)).toBeInTheDocument();
    const options = within(screen.getByRole("group", { name: /drill options/i })).getAllByRole("button");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent(/^ALet the planner call tools/);
    expect(options[1]).toHaveTextContent(/^BGive typed tools explicit budgets/);
    expect(options[2]).toHaveTextContent(/^CHide tool state from the trace/);
  });

  it("calls onResult exactly once per submit and resets with Next drill", () => {
    const onResult = vi.fn();
    render(<DrillPlayer unit={unit} onResult={onResult} />);

    fireEvent.click(screen.getByRole("button", { name: /typed tools explicit budgets/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    // The submit button is replaced by "Next drill", so a repeat submit is impossible.
    expect(screen.queryByRole("button", { name: /submit answer/i })).not.toBeInTheDocument();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("status")).toHaveTextContent(/budgets keep autonomy predictable/i);

    fireEvent.click(screen.getByRole("button", { name: /next drill/i }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /let the planner call tools/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    expect(onResult).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("status")).toHaveTextContent(/unbounded loops/i);
  });
});
