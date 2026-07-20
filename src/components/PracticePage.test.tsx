import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogPracticeUnits } from "../data/pdfCatalog";
import { ragFailureBranches } from "../data/specialActivities";
import { loadPracticeRecords, PRACTICE_RECORDS_STORAGE_KEY, recordPracticeAttempt, savePracticeRecords } from "../domain/practiceRecords";
import { PracticePage } from "./PracticePage";

function renderPractice(onReviewed = vi.fn(), initialMode?: "failure" | "mock" | "review") {
  render(<PracticePage reviewed={0} correct={0} onReviewed={onReviewed} initialMode={initialMode} />);
  return onReviewed;
}

const failureTab = () => screen.getByRole("tab", { name: /rag failure lab/i });
const mockTab = () => screen.getByRole("tab", { name: /45-minute mock/i });
const reviewTab = () => screen.getByRole("tab", { name: /review missed/i });
const failureLab = () => screen.getByRole("region", { name: /rag failure lab/i });
const branchGroup = () => screen.getByRole("group", { name: /failure branches/i });

// Reads the currently drawn scenario's symptom straight from the DOM, so tests
// stay correct for any random draw instead of assuming one.
function currentSymptom(): string {
  const symptom = failureLab().querySelector(".special-practice-main > p")?.textContent;
  if (!symptom) throw new Error("no scenario symptom rendered");
  return symptom;
}

function currentBranch() {
  const symptom = currentSymptom();
  const branch = ragFailureBranches.find((item) => item.scenarios.some((scenario) => scenario.symptom === symptom));
  if (!branch) throw new Error(`no branch owns scenario: ${symptom}`);
  return branch;
}

const optionNamed = (label: string) => new RegExp(`^[A-D] ${label}$`, "i");

// Clicks the correct option of the currently displayed drill and submits it.
function answerCurrentDrillCorrectly(unitId: string) {
  const unit = catalogPracticeUnits.find((item) => item.id === unitId);
  if (!unit) throw new Error(`unknown unit ${unitId}`);
  const correctIndex = unit.options.findIndex((option) => option.correct);
  const options = within(screen.getByRole("group", { name: /drill options/i })).getAllByRole("button");
  fireEvent.click(options[correctIndex]);
  fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
}

describe("training modes", () => {
  beforeEach(() => localStorage.clear());

  it("opens on the RAG failure lab by default, with no question bank tab", () => {
    renderPractice();

    expect(screen.getByRole("heading", { level: 1, name: /^training$/i })).toBeInTheDocument();
    expect(failureTab()).toHaveAttribute("aria-selected", "true");
    expect(mockTab()).toHaveAttribute("aria-selected", "false");
    expect(reviewTab()).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("heading", { name: /diagnose the failure branch/i })).toBeInTheDocument();
    // The question bank moved to the Path page; the three tabs are the failure
    // lab, the mock interview, and the missed-drill review queue.
    expect(screen.queryByRole("tab", { name: /question bank/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("opens on the 45-minute mock when initialMode is 'mock'", () => {
    renderPractice(vi.fn(), "mock");

    expect(mockTab()).toHaveAttribute("aria-selected", "true");
    expect(failureTab()).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("heading", { name: /clarify the problem/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /interview notes/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /diagnose the failure branch/i })).not.toBeInTheDocument();
  });

  it("switches between the failure lab and the mock interview via the tabs", () => {
    renderPractice();

    fireEvent.click(mockTab());
    expect(screen.getByRole("heading", { name: /clarify the problem/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /diagnose the failure branch/i })).not.toBeInTheDocument();

    fireEvent.click(failureTab());
    expect(screen.getByRole("heading", { name: /diagnose the failure branch/i })).toBeInTheDocument();
  });
});

describe("RAG failure lab", () => {
  beforeEach(() => localStorage.clear());

  it("gives every branch at least four scenarios, each with an observable symptom", () => {
    for (const branch of ragFailureBranches) {
      expect(branch.scenarios.length).toBeGreaterThanOrEqual(4);
      for (const scenario of branch.scenarios) {
        expect(scenario.id).toBeTruthy();
        expect(scenario.symptom.length).toBeGreaterThan(0);
      }
      expect(branch.diagnosis).toBeTruthy();
      expect(branch.signals.length).toBeGreaterThan(0);
    }
  });

  it("renders one drawn scenario with the four shuffled branch options", () => {
    renderPractice();

    expect(screen.getByRole("heading", { name: /diagnose the failure branch/i })).toBeInTheDocument();
    // The symptom text comes from the drawn scenario and never names a branch.
    expect(currentSymptom().length).toBeGreaterThan(0);
    expect(within(branchGroup()).getAllByRole("button")).toHaveLength(4);
    // The pre-submit view shows no signals panel, so it cannot leak the answer.
    expect(screen.queryByText(/evidence to inspect/i)).not.toBeInTheDocument();
  });

  it("judges by branch id and highlights the correct branch after a wrong diagnosis", () => {
    const onReviewed = renderPractice();

    const branch = currentBranch();
    const wrong = ragFailureBranches.find((item) => item.id !== branch.id);
    if (!wrong) throw new Error("need at least two branches");
    const group = branchGroup();
    fireEvent.click(within(group).getByRole("button", { name: optionNamed(wrong.label) }));
    fireEvent.click(screen.getByRole("button", { name: /check diagnosis/i }));

    expect(onReviewed).toHaveBeenCalledTimes(1);
    expect(onReviewed).toHaveBeenCalledWith(false);
    expect(within(group).getByRole("button", { name: optionNamed(branch.label) })).toHaveClass("practice-option--correct");
    expect(within(group).getByRole("button", { name: optionNamed(wrong.label) })).toHaveClass("practice-option--incorrect");
    expect(screen.getByText(/trace the request/i)).toBeInTheDocument();

    const records = loadPracticeRecords();
    expect(records[branch.id]).toMatchObject({ attempts: 1, correct: 0 });
    expect(within(failureLab()).getByText("Missed")).toBeInTheDocument();
  });

  it("scores a correct diagnosis regardless of the shuffled option position and persists it", () => {
    const onReviewed = renderPractice();

    const branch = currentBranch();
    fireEvent.click(within(branchGroup()).getByRole("button", { name: optionNamed(branch.label) }));
    fireEvent.click(screen.getByRole("button", { name: /check diagnosis/i }));

    expect(onReviewed).toHaveBeenCalledTimes(1);
    expect(onReviewed).toHaveBeenCalledWith(true);
    expect(loadPracticeRecords()[branch.id]).toMatchObject({ attempts: 1, correct: 1 });
    // Correct feedback shows the branch diagnosis, then its signals panel.
    expect(screen.getByText(branch.diagnosis)).toBeInTheDocument();
    for (const signal of branch.signals) {
      expect(screen.getByText(signal)).toBeInTheDocument();
    }
    expect(within(failureLab()).getByText("Diagnosed")).toBeInTheDocument();
  });

  it("grades at most once per scenario round, even if submit is clicked again", () => {
    const onReviewed = renderPractice();

    const branch = currentBranch();
    fireEvent.click(within(branchGroup()).getByRole("button", { name: optionNamed(branch.label) }));
    const submitButton = screen.getByRole("button", { name: /check diagnosis/i });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(onReviewed).toHaveBeenCalledTimes(1);
    expect(loadPracticeRecords()[branch.id]).toMatchObject({ attempts: 1, correct: 1 });
  });

  it("requires a branch selection before a diagnosis can be checked", () => {
    const onReviewed = renderPractice();

    expect(screen.getByRole("button", { name: /check diagnosis/i })).toBeDisabled();
    fireEvent.click(within(branchGroup()).getByRole("button", { name: /context/i }));
    expect(screen.getByRole("button", { name: /check diagnosis/i })).toBeEnabled();
    expect(onReviewed).not.toHaveBeenCalled();
  });

  it("draws a fresh scenario on 'Next scenario' without repeating the current one", () => {
    renderPractice();

    const firstSymptom = currentSymptom();
    const branch = currentBranch();
    fireEvent.click(within(branchGroup()).getByRole("button", { name: optionNamed(branch.label) }));
    fireEvent.click(screen.getByRole("button", { name: /check diagnosis/i }));
    fireEvent.click(screen.getByRole("button", { name: /next scenario/i }));

    expect(currentSymptom()).not.toBe(firstSymptom);
    // The round resets: options re-enable, the submit button returns disabled.
    expect(screen.queryByText(/evidence to inspect/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check diagnosis/i })).toBeDisabled();
  });
});

describe("mock interview", () => {
  beforeEach(() => localStorage.clear());

  it("draws a chapter 16 interview question as the prompt", () => {
    renderPractice(vi.fn(), "mock");

    // Every question in the pool comes from ch16, so the chapter context is
    // deterministic regardless of which unit the random draw picks.
    const prompt = screen.getByRole("region", { name: /interview question/i });
    expect(prompt).toHaveTextContent(/20 top system design questions & answers/i);
    expect(prompt).toHaveTextContent(/pp\./i);
    expect(screen.getByRole("button", { name: /new question/i })).toBeInTheDocument();
  });

  it("starts the countdown at 45:00 with the first phase target shown", () => {
    renderPractice(vi.fn(), "mock");

    expect(screen.getByRole("timer", { name: /interview countdown/i })).toHaveTextContent("45:00");
    expect(screen.getByText(/phase target: 5 min/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset timer/i })).toBeInTheDocument();
  });
});

describe("review missed", () => {
  beforeEach(() => localStorage.clear());

  it("shows the empty state when no drill was missed", () => {
    renderPractice(vi.fn(), "review");

    expect(reviewTab()).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("status")).toHaveTextContent(/no missed drills/i);
  });

  it("lists only missed drills in chapter order and clears each one on a correct answer", () => {
    const first = catalogPracticeUnits[0];
    const second = catalogPracticeUnits.find((unit) => unit.chapter > first.chapter);
    const mastered = catalogPracticeUnits.find((unit) => unit.id !== first.id && unit.id !== second?.id);
    if (!first || !second || !mastered) throw new Error("catalog is too small for this test");
    // Two misses and one mastered unit; only the misses may enter the queue.
    let seeded = recordPracticeAttempt({}, first.id, false, "2026-01-01T00:00:00.000Z");
    seeded = recordPracticeAttempt(seeded, second.id, false, "2026-01-01T00:00:00.000Z");
    seeded = recordPracticeAttempt(seeded, mastered.id, true, "2026-01-01T00:00:00.000Z");
    savePracticeRecords(seeded);

    const onReviewed = renderPractice(vi.fn(), "review");

    expect(screen.getByRole("heading", { name: /2 missed drills left/i })).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(`^Drill ${first.id}`, "i"))).toBeInTheDocument();
    expect(screen.queryByLabelText(new RegExp(mastered.id, "i"))).not.toBeInTheDocument();

    answerCurrentDrillCorrectly(first.id);
    expect(onReviewed).toHaveBeenCalledTimes(1);
    expect(onReviewed).toHaveBeenCalledWith(true);
    expect(screen.getByRole("heading", { name: /1 missed drill left/i })).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(`^Drill ${second.id}`, "i"))).toBeInTheDocument();

    answerCurrentDrillCorrectly(second.id);
    expect(onReviewed).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent(/no missed drills/i);
    expect(loadPracticeRecords()[first.id]).toMatchObject({ attempts: 2, correct: 1 });
  });
});

describe("practiceRecords domain", () => {
  beforeEach(() => localStorage.clear());

  it("increments attempts and correct immutably", () => {
    const first = recordPracticeAttempt({}, "1.1", true, "2026-01-01T00:00:00.000Z");
    expect(first["1.1"]).toEqual({ attempts: 1, correct: 1, lastAttemptAt: "2026-01-01T00:00:00.000Z" });
    const second = recordPracticeAttempt(first, "1.1", false, "2026-01-02T00:00:00.000Z");
    expect(second["1.1"]).toEqual({ attempts: 2, correct: 1, lastAttemptAt: "2026-01-02T00:00:00.000Z" });
    expect(first["1.1"].attempts).toBe(1);
  });

  it("loads an empty map for missing or corrupt storage and drops invalid entries", () => {
    expect(loadPracticeRecords()).toEqual({});
    localStorage.setItem(PRACTICE_RECORDS_STORAGE_KEY, "{not json");
    expect(loadPracticeRecords()).toEqual({});
    localStorage.setItem(PRACTICE_RECORDS_STORAGE_KEY, JSON.stringify({ "1.1": { attempts: 2, correct: 1, lastAttemptAt: "2026-01-01" }, bad: { attempts: "nope" } }));
    expect(loadPracticeRecords()).toEqual({ "1.1": { attempts: 2, correct: 1, lastAttemptAt: "2026-01-01" } });
  });
});
