import { fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";
import { attemptReducer, createInitialAttempt } from "../domain/attempt";
import type { AttemptState } from "../domain/types";
import { MissionWorkspace } from "./MissionWorkspace";

vi.mock("./ArchitectureBuilder", () => ({
  ArchitectureBuilder: (props: { onEditDecision: () => void }) => (
    <button onClick={props.onEditDecision}>Edit reasoning</button>
  ),
}));

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
