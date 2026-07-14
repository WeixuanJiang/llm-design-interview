import { describe, expect, it } from "vitest";
import { attemptReducer, createInitialAttempt } from "./attempt";

describe("attempt reducer", () => {
  it("advances stages while preserving completion evidence", () => {
    const initial = createInitialAttempt();
    const estimation = attemptReducer(initial, { type: "complete-stage", stage: "requirements", next: "estimation" });
    const architecture = attemptReducer(estimation, { type: "complete-stage", stage: "estimation", next: "architecture" });

    expect(architecture.stage).toBe("architecture");
    expect(architecture.completedStages).toEqual(["requirements", "estimation"]);
  });

  it("removes attached edges when a node is removed", () => {
    const initial = createInitialAttempt();
    const next = attemptReducer(initial, { type: "remove-node", id: "opensearch" });

    expect(next.nodes.some((node) => node.id === "opensearch")).toBe(false);
    expect(next.edges.some((edge) => edge.source === "opensearch" || edge.target === "opensearch")).toBe(false);
  });

  it("captures an immutable baseline before the stress stage", () => {
    const initial = createInitialAttempt();
    const stressed = attemptReducer(initial, { type: "activate-stress" });
    const revised = attemptReducer(stressed, { type: "save-decision", id: "ecs", value: "A revised decision with enough evidence to demonstrate that the current graph changed." });

    expect(stressed.stage).toBe("stress");
    expect(stressed.revisionBase?.decisions).toEqual({});
    expect(revised.revisionBase?.decisions).toEqual({});
  });
});
