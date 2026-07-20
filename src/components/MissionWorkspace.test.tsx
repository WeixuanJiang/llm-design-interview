import { fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { attemptReducer, createInitialAttempt } from "../domain/attempt";
import type { AttemptState } from "../domain/types";
import { MissionWorkspace } from "./MissionWorkspace";

vi.mock("./ArchitectureBuilder", () => ({
  ArchitectureBuilder: (props: { onEditDecision: () => void }) => (
    <button onClick={props.onEditDecision}>Edit reasoning</button>
  ),
}));

// The workspace mirrors its stage into the URL hash; reset it so tests stay isolated.
beforeEach(() => {
  window.location.hash = "#workspace";
});

function Harness() {
  const [attempt, dispatch] = useReducer(attemptReducer, createInitialAttempt());
  return <MissionWorkspace attempt={attempt} dispatch={dispatch} saveStatus="saved" onExit={() => {}} />;
}

function createArchitectureAttempt(): AttemptState {
  return {
    ...createInitialAttempt(),
    stage: "architecture",
    completedStages: ["requirements", "estimation"],
    confirmedRequirements: ["identity", "latency", "freshness"],
    requirementSummary: "Ten thousand employees need sub-3-second grounded answers with fifteen-minute freshness guarantees.",
  };
}

function ArchitectureHarness() {
  const [attempt, dispatch] = useReducer(attemptReducer, createArchitectureAttempt());
  return <MissionWorkspace attempt={attempt} dispatch={dispatch} saveStatus="saved" onExit={() => {}} />;
}

function EstimationHarness() {
  const [attempt, dispatch] = useReducer(attemptReducer, { ...createInitialAttempt(), stage: "estimation" as const, completedStages: ["requirements" as const] });
  return <MissionWorkspace attempt={attempt} dispatch={dispatch} saveStatus="saved" onExit={() => {}} />;
}

function StressHarness() {
  const [attempt, dispatch] = useReducer(attemptReducer, { ...createInitialAttempt(), stage: "stress" as const, completedStages: ["requirements" as const, "estimation" as const, "architecture" as const] });
  return <MissionWorkspace attempt={attempt} dispatch={dispatch} saveStatus="saved" onExit={() => {}} />;
}

// First-pass review: stress fired, mitigation submitted, no revision started yet.
function createReviewAttempt(): AttemptState {
  return {
    ...createArchitectureAttempt(),
    stage: "review",
    completedStages: ["requirements", "estimation", "architecture", "stress"],
    stressActive: true,
    mitigation: "Cache hot retrieval paths, add an OpenSearch replica, then re-measure P95 under load.",
    revisionBase: { nodes: [], edges: [], decisions: {} },
  };
}

function ReviewHarness() {
  const [attempt, dispatch] = useReducer(attemptReducer, createReviewAttempt());
  return <MissionWorkspace attempt={attempt} dispatch={dispatch} saveStatus="saved" onExit={() => {}} />;
}

function confirmRequirements() {
  fireEvent.click(screen.getByLabelText(/enforce employee identity/i));
  fireEvent.click(screen.getByLabelText(/keep query-path p95 latency/i));
  fireEvent.click(screen.getByLabelText(/make changed documents searchable/i));
  fireEvent.change(screen.getByPlaceholderText(/describe the users, scale, latency, security/i), {
    target: { value: "Ten thousand employees need sub-3-second grounded answers with fifteen-minute freshness guarantees." },
  });
}

describe("MissionWorkspace validation state", () => {
  it("clears the stage banner once the underlying issue is fixed, without a resubmit", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /continue to estimation/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/resolve before continuing/i);

    confirmRequirements();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the decision-modal error separate from the stage validation banner", () => {
    render(<ArchitectureHarness />);

    fireEvent.click(screen.getByRole("button", { name: /edit reasoning/i }));
    fireEvent.click(screen.getByRole("button", { name: /save reasoning/i }));

    expect(screen.getByText(/decision reasoning must include at least 30 characters/i)).toBeInTheDocument();
    expect(document.querySelector(".validation-banner")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });
});

describe("MissionWorkspace gate checklist", () => {
  it("lists the stage requirements upfront and checks them off as the attempt changes", () => {
    render(<Harness />);

    const toggle = screen.getByRole("button", { name: /requirements to continue/i });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/confirm all three mission requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/summarise the requirements in at least 60 characters/i)).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();

    confirmRequirements();

    expect(screen.getByText("2/2")).toBeInTheDocument();
  });

  it("collapses and expands via the toggle", () => {
    render(<Harness />);

    const toggle = screen.getByRole("button", { name: /requirements to continue/i });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/confirm all three mission requirements/i)).not.toBeInTheDocument();
  });
});

describe("MissionWorkspace estimation input guarding", () => {
  it("never renders NaN QPS when an input is cleared", () => {
    render(<EstimationHarness />);

    fireEvent.change(screen.getByLabelText(/active users/i), { target: { value: "" } });

    expect(screen.queryByText(/nan/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^\d+ QPS$/)).toHaveTextContent("0 QPS");
  });

  it("clamps negative input to zero", () => {
    render(<EstimationHarness />);

    fireEvent.change(screen.getByLabelText(/peak multiplier/i), { target: { value: "-5" } });

    expect(screen.queryByText(/nan/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^\d+ QPS$/)).toHaveTextContent("0 QPS");
  });

  it("updates the derived QPS as the learner types", () => {
    render(<EstimationHarness />);

    fireEvent.change(screen.getByLabelText(/queries per user\/day/i), { target: { value: "120" } });

    expect(screen.getByText(/^\d+ QPS$/)).toHaveTextContent("100 QPS");
    expect(screen.getByText(/calculated peak QPS/i)).toBeInTheDocument();
  });

  it("marks the estimation fields with an error class after a failed submit", () => {
    render(<EstimationHarness />);

    fireEvent.change(screen.getByLabelText(/indexed chunks/i), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /continue to architecture/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/document volume must reflect the enterprise scenario/i);
    expect(screen.getByLabelText(/indexed chunks/i)).toHaveAttribute("aria-invalid", "true");
  });
});

describe("MissionWorkspace text input feedback", () => {
  it("shows a live character counter with the minimum-length hint for the summary", () => {
    render(<Harness />);

    expect(screen.getByText(/0\/60 characters minimum/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/describe the users, scale, latency, security/i), { target: { value: "short" } });

    expect(screen.getByText(/55 more needed/i)).toBeInTheDocument();
  });

  it("marks the summary field with an error class after a failed submit", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /continue to estimation/i }));

    expect(screen.getByPlaceholderText(/describe the users, scale, latency, security/i)).toHaveClass("workspace-field-error");
  });

  it("shows the mitigation counter and error class after a failed stress submit", () => {
    render(<StressHarness />);

    expect(screen.getByText(/0\/40 characters minimum/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));

    expect(screen.getByPlaceholderText(/prioritise one bottleneck/i)).toHaveClass("workspace-field-error");
  });
});

describe("MissionWorkspace header affordances", () => {
  it("renames the coach drawer to Guided hints with the disclaimer on top", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /open guided hints/i }));

    const drawer = screen.getByLabelText("Guided hints");
    expect(drawer).toHaveTextContent(/guided hints/i);
    expect(screen.queryByText(/ai coach/i)).not.toBeInTheDocument();

    const disclaimer = screen.getByText(/scripted prompt tied to your current stage/i);
    const question = screen.getByText(/guided question/i);
    expect(disclaimer.compareDocumentPosition(question) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the saved time when the attempt carries a savedAt timestamp", () => {
    const date = new Date(2025, 4, 1, 9, 7);
    const attempt = { ...createInitialAttempt(), savedAt: date.toISOString() };
    render(<MissionWorkspace attempt={attempt} dispatch={() => {}} saveStatus="saved" onExit={() => {}} />);

    const expected = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    expect(screen.getByText(new RegExp(`Saved ${expected}`))).toBeInTheDocument();
  });

  it("falls back to a plain Saved label when savedAt is null", () => {
    render(<Harness />);

    expect(screen.getByText(/^Saved$/)).toBeInTheDocument();
  });

  it("surfaces the revision requirement as visible text, not only an aria-label", () => {
    render(<Harness />);

    expect(screen.getByText(/includes a required revision step/i)).toBeInTheDocument();
    expect(screen.getByText(/one revision is required to complete/i)).toBeInTheDocument();
  });
});

describe("MissionWorkspace design loop band", () => {
  it("starts on draft and advances to the stress event once the stress event fires", () => {
    render(<Harness />);

    const loop = screen.getByRole("group", { name: /design loop status/i });
    expect(within(loop).getByText("Draft").closest("li")).toHaveClass("active");
    expect(within(loop).getByText("Stress event").closest("li")).toHaveClass("todo");
    expect(within(loop).getByText(/^Revision$/).closest("li")).toHaveClass("todo");
    expect(screen.getByRole("status")).toHaveTextContent(/drafting the initial architecture/i);

    confirmRequirements();
    fireEvent.click(screen.getByRole("button", { name: /continue to estimation/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue to architecture/i }));

    // Progressing through the linear stages keeps the loop on draft until the stress event fires.
    expect(within(loop).getByText("Draft").closest("li")).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: /edit reasoning/i }));
    fireEvent.change(screen.getByLabelText(/^reasoning$/i), { target: { value: "ECS Fargate orchestrates retrieval because managed scaling fits bursty enterprise traffic." } });
    fireEvent.click(screen.getByRole("button", { name: /save reasoning/i }));
    fireEvent.click(screen.getByRole("button", { name: /run stress event/i }));

    expect(within(loop).getByText("Draft").closest("li")).toHaveClass("done");
    expect(within(loop).getByText("Stress event").closest("li")).toHaveClass("active");
    expect(screen.getByRole("status")).toHaveTextContent(/responding to the stress event/i);
  });

  it("marks the revision loop-back explicitly while a revision is in progress", () => {
    render(<ReviewHarness />);

    fireEvent.click(screen.getByRole("button", { name: /revise architecture/i }));

    // The loop marker sits between the architecture and stress stepper items.
    const stepper = screen.getByRole("list", { name: /mission stages/i });
    const badge = within(stepper).getByText(/revision 1 in progress/i);
    const marker = badge.closest("li");
    expect(marker).toHaveClass("workspace-loop-marker");
    const architectureItem = within(stepper).getByText("Architecture").closest("li");
    const stressItem = within(stepper).getByText("Stress test").closest("li");
    expect(architectureItem && marker && architectureItem.compareDocumentPosition(marker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(marker && stressItem && marker.compareDocumentPosition(stressItem) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // The architecture node carries the reworking state instead of looking like a regression.
    expect(architectureItem).toHaveClass("reworking");
    expect(architectureItem).toHaveTextContent("Reworking");

    // The band highlights the revision sub-state and the live text explains the loop-back.
    const loop = screen.getByRole("group", { name: /design loop status/i });
    expect(within(loop).getByText("Draft").closest("li")).toHaveClass("done");
    expect(within(loop).getByText("Stress event").closest("li")).toHaveClass("done");
    expect(within(loop).getByText("Revision 1").closest("li")).toHaveClass("active");
    expect(screen.getByRole("status")).toHaveTextContent(/revision 1 in progress/i);
  });

  it("marks the loop complete after the revision is submitted", () => {
    render(<ReviewHarness />);

    fireEvent.click(screen.getByRole("button", { name: /revise architecture/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit reasoning/i }));
    fireEvent.change(screen.getByLabelText(/^reasoning$/i), { target: { value: "Added a retrieval cache in front of OpenSearch to absorb the 20x burst safely." } });
    fireEvent.click(screen.getByRole("button", { name: /save reasoning/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit revision/i }));

    const loop = screen.getByRole("group", { name: /design loop status/i });
    expect(within(loop).getByText("Revision 1").closest("li")).toHaveClass("done");
    expect(within(loop).getByText("Complete").closest("li")).toHaveClass("active");
    expect(screen.queryByText(/revision \d+ in progress/i)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/mission loop complete/i);
  });
});

describe("MissionWorkspace stage hash contract", () => {
  it("writes the stage into the hash on forward transitions and omits the default", () => {
    render(<Harness />);
    expect(window.location.hash).toBe("#workspace");

    confirmRequirements();
    fireEvent.click(screen.getByRole("button", { name: /continue to estimation/i }));

    expect(window.location.hash).toBe("#workspace?stage=1");
  });

  it("restores the stage from the hash on open and follows hashchange edits", () => {
    window.location.hash = "#workspace?stage=2";
    render(<Harness />);

    expect(screen.getByText(/build and defend/i)).toBeInTheDocument();

    window.location.hash = "#workspace?stage=3";
    fireEvent(window, new Event("hashchange"));

    expect(screen.getByRole("heading", { name: /traffic increased 20x/i })).toBeInTheDocument();
    const loop = screen.getByRole("group", { name: /design loop status/i });
    expect(within(loop).getByText("Stress event").closest("li")).toHaveClass("active");
  });

  it("ignores out-of-range stage params", () => {
    window.location.hash = "#workspace?stage=9";
    render(<Harness />);

    expect(screen.getByText(/clarify constraints/i)).toBeInTheDocument();
  });
});
