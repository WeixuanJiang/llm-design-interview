import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { ragFailureBranches } from "./data/specialActivities";

// Reads the currently drawn failure-lab scenario from the DOM and resolves its
// owning branch, so the test stays correct for any random draw.
function currentFailureBranch() {
  const lab = screen.getByRole("region", { name: /rag failure lab/i });
  const symptom = lab.querySelector(".special-practice-main > p")?.textContent ?? "";
  const branch = ragFailureBranches.find((item) => item.scenarios.some((scenario) => scenario.symptom === symptom));
  if (!branch) throw new Error(`no branch owns scenario: ${symptom}`);
  return branch;
}

describe("application sections", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "#missions";
  });

  it("navigates to Learn and completes an interactive module", async () => {
    window.location.hash = "#learn";
    render(<App />);

    expect(await screen.findByRole("heading", { name: /match the adaptation method to the problem/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /advanced retrieval design/i }));
    expect(screen.getByRole("heading", { level: 1, name: /fuse sparse and dense candidates/i })).toBeInTheDocument();
    expect(screen.getByText(/question 1 of 5/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /run bm25 and dense retrieval in parallel/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/reciprocal rank fusion/i);
    expect(screen.getByRole("button", { name: /next question/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    fireEvent.click(screen.getByRole("button", { name: /merged with rrf using eval-tuned ensemble weights/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    fireEvent.click(screen.getByRole("button", { name: /a logged fallback that degrades to dense-only/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    fireEvent.click(screen.getByRole("button", { name: /allows retuning without a redeploy/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    fireEvent.click(screen.getByRole("button", { name: /tune the ensemble weights on an evaluation set/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /complete lesson/i }));
    expect(screen.getByText(/1 of 4 lessons complete/i)).toBeInTheDocument();
  });

  it("presents Chapter 1 as a sourced multi-lesson learning sequence", async () => {
    window.location.hash = "#learn";
    render(<App />);
    expect(await screen.findByText(/lesson 1 of 7/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /match the adaptation method to the problem/i })).toBeInTheDocument();
    expect(screen.getByText(/chapter 1.*pages 22-23/i)).toBeInTheDocument();

    const reading = screen.getByRole("article", { name: /lesson reading/i });
    const knowledgeCheck = screen.getByRole("region", { name: /knowledge check/i });
    expect(screen.getByText(/keep changing knowledge outside model weights/i)).toBeInTheDocument();
    expect(reading.compareDocumentPosition(knowledgeCheck) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /retrieval-augmented generation/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/changes frequently/i);
  });

  it("evaluates a practice decision and records the result", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^training$/i }));

    expect(await screen.findByRole("heading", { name: /diagnose the failure branch/i })).toBeInTheDocument();
    const branch = currentFailureBranch();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^[A-D] ${branch.label}$`, "i") }));
    fireEvent.click(screen.getByRole("button", { name: /check diagnosis/i }));

    const diagnosisLead = branch.diagnosis.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    expect(screen.getByRole("status")).toHaveTextContent(new RegExp(diagnosisLead, "i"));
    expect(screen.getByRole("contentinfo", { name: /practice evidence/i })).toHaveTextContent(/1 reviewed/i);
  });

  it("routes a weak-skill recommendation from Progress into Practice", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^progress$/i }));

    expect(await screen.findByRole("heading", { name: /see what you can design independently/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /no evidence yet/i })).toBeInTheDocument();
    expect(screen.getByText(/0 of 23 modules complete/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /practise weak skills/i }));

    expect(await screen.findByRole("heading", { name: /^training$/i })).toBeInTheDocument();
  });

  it("provides the failure lab, mock interview, and four-week study plan", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^training$/i }));
    await screen.findByRole("heading", { name: /^training$/i });

    fireEvent.click(screen.getByRole("tab", { name: /rag failure lab/i }));
    expect(screen.getByRole("heading", { name: /diagnose the failure branch/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /45-minute mock/i }));
    expect(screen.getByRole("heading", { name: /clarify the problem/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /interview notes/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^progress$/i }));
    expect(await screen.findByRole("heading", { name: /four-week study plan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /retrieval foundations/i })).toBeInTheDocument();
  });

  it("provides anonymized customer agent and LLM missions with an embedded build lab", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /^missions$/i })).toBeInTheDocument();
    expect(screen.getByText(/100 agent and LLM customer system-design cases/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /roambank/i }));
    expect(screen.getByRole("heading", { name: /roambank resolves multilingual banking support/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /use case details/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /functional requirements/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /design notes/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^2 requirements$/i }));
    expect(screen.getByRole("heading", { name: /scale assumptions/i })).toBeInTheDocument();
    expect(screen.getByText(/8 million customers generate 420,000 support conversations daily/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /build lab/i }));
    expect(screen.getByLabelText(/architecture canvas/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /components/i }));
    const componentLibrary = within(screen.getByRole("complementary", { name: /^aws component library$/i }));
    expect(componentLibrary.getByRole("button", { name: /amazon bedrock/i })).toHaveAttribute("draggable", "true");
    fireEvent.change(componentLibrary.getByRole("combobox", { name: /aws service category/i }), { target: { value: "All" } });
    fireEvent.change(componentLibrary.getByRole("textbox", { name: /search aws services/i }), { target: { value: "Neptune" } });
    expect(componentLibrary.getByRole("button", { name: /amazon neptune/i })).toHaveAttribute("draggable", "true");
  });

  it("provides the today page with a learning path preview", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^home$/i }));
    expect(await screen.findByRole("heading", { name: /train ai system design like a skill/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /your learning path/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /featured missions/i })).toBeInTheDocument();
    expect(screen.getByText(/customer cases/i)).toBeInTheDocument();
  });
});
