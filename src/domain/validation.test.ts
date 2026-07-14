import { describe, expect, it } from "vitest";
import { createInitialAttempt } from "./attempt";
import { calculatePeakQps, calculateScore, validateArchitecture, validateEstimation, validateMitigation, validateRequirements } from "./validation";

describe("attempt validation", () => {
  it("requires confirmed constraints and a learner-authored summary", () => {
    const attempt = createInitialAttempt();
    expect(validateRequirements(attempt).valid).toBe(false);

    attempt.confirmedRequirements = ["identity", "latency", "freshness"];
    attempt.requirementSummary = "The system serves employees securely, stays under the latency target, and refreshes changed documents within fifteen minutes.";
    expect(validateRequirements(attempt)).toEqual({ valid: true, errors: [] });
  });

  it("calculates the scenario peak load deterministically", () => {
    const attempt = createInitialAttempt();
    expect(calculatePeakQps(attempt)).toBe(10);
    expect(validateEstimation(attempt).valid).toBe(true);
  });

  it("requires architecture decisions and stress evidence", () => {
    const attempt = createInitialAttempt();
    expect(validateArchitecture(attempt).errors).toContain("Record at least one decision with a requirement and trade-off.");

    attempt.decisions.ecs = "Containers provide predictable latency and connection reuse, but require explicit scaling and capacity management.";
    expect(validateArchitecture(attempt).valid).toBe(true);
    expect(validateMitigation(attempt).valid).toBe(false);

    attempt.mitigation = "Reduce retrieval fan-out, add backpressure, and verify both P95 latency and Recall@K before rollout.";
    expect(validateMitigation(attempt).valid).toBe(true);
    expect(calculateScore(attempt)).toBeGreaterThan(75);
  });
});
