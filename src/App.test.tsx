import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("application sections", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "#missions";
  });

  it("navigates to Learn and completes an interactive module", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^learn$/i }));
    expect(await screen.findByRole("heading", { name: /match the adaptation method to the problem/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /advanced retrieval design/i }));
    expect(screen.getByRole("heading", { level: 1, name: /hybrid retrieval.*bm25.*vector search/i })).toBeInTheDocument();
    expect(screen.getByText(/question 1 of 5/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /connect the requirement.*measurable evidence/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/defensible/i);
    expect(screen.getByRole("button", { name: /next question/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    fireEvent.click(screen.getByRole("button", { name: /choose the smallest design/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    fireEvent.click(screen.getByRole("button", { name: /segment the affected cohort/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    fireEvent.click(screen.getByRole("button", { name: /keep the simpler baseline/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    fireEvent.click(screen.getByRole("button", { name: /pause or roll back the canary/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /complete lesson/i }));
    expect(screen.getByText(/1 of 4 lessons complete/i)).toBeInTheDocument();
  });

  it("presents Chapter 1 as a sourced multi-lesson learning sequence", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^learn$/i }));

    expect(await screen.findByText(/lesson 1 of 7/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /match the adaptation method to the problem/i })).toBeInTheDocument();
    expect(screen.getByText(/chapter 1.*pages 22-23/i)).toBeInTheDocument();

    const reading = screen.getByRole("article", { name: /lesson reading/i });
    const knowledgeCheck = screen.getByRole("region", { name: /knowledge check/i });
    expect(screen.getByText(/keep changing knowledge outside model weights/i)).toBeInTheDocument();
    expect(reading.compareDocumentPosition(knowledgeCheck) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /retrieval-augmented generation/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/frequent updates and citations/i);
  });

  it("evaluates a practice decision and records the result", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^practice$/i }));

    const challenge = await screen.findByRole("region", { name: /practice challenge/i });
    fireEvent.click(within(challenge).getByRole("button", { name: /clarify requirements.*validation evidence/i }));
    fireEvent.click(within(challenge).getByRole("button", { name: /review answer/i }));

    expect(within(challenge).getByRole("status")).toHaveTextContent(/correct/i);
    expect(screen.getByRole("contentinfo", { name: /practice evidence/i })).toHaveTextContent(/1 reviewed/i);
  });

  it("routes a weak-skill recommendation from Progress into Practice", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^progress$/i }));

    expect(await screen.findByRole("heading", { name: /see what you can design independently/i })).toBeInTheDocument();
    expect(screen.getAllByText(/ML platform and training/i)).toHaveLength(2);
    expect(screen.getByText(/0 of 23 modules complete/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /practise weak skills/i }));

    expect(await screen.findByRole("heading", { name: /^practice$/i })).toBeInTheDocument();
  });

  it("provides the failure lab, mock interview, and four-week study plan", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^practice$/i }));
    await screen.findByRole("heading", { name: /^practice$/i });

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

  it("provides the catalog-mapped learner dashboard", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^home$/i }));
    expect(await screen.findByRole("heading", { name: /start with retrieval foundations/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /choose a pathway/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /featured missions/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /four-week plan/i })).toBeInTheDocument();
    expect(screen.getByText(/0\/23/i)).toBeInTheDocument();
  });
});
