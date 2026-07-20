import type { AttemptState, MissionStage, ValidationResult } from "./types";

export interface StageCheck {
  id: string;
  label: string;
  passed: boolean;
}

interface InternalCheck extends StageCheck {
  error: string;
}

export function calculatePeakQps(state: AttemptState): number {
  const { users, queriesPerUserPerDay, workingHours, peakFactor } = state.estimation;
  return Math.round((users * queriesPerUserPerDay * peakFactor) / Math.max(1, workingHours * 3600));
}

function requirementChecks(state: AttemptState): InternalCheck[] {
  return [
    {
      id: "confirm-requirements",
      label: "Confirm all three mission requirements",
      passed: state.confirmedRequirements.length >= 3,
      error: "Confirm all three mission requirements.",
    },
    {
      id: "requirement-summary",
      label: "Summarise the requirements in at least 60 characters",
      passed: state.requirementSummary.trim().length >= 60,
      error: "Summarise the requirements in at least 60 characters.",
    },
  ];
}

function estimationChecks(state: AttemptState): InternalCheck[] {
  return [
    {
      id: "peak-qps",
      label: "Peak QPS must be greater than zero",
      passed: calculatePeakQps(state) >= 1,
      error: "Peak QPS must be greater than zero.",
    },
    {
      id: "document-chunks",
      label: "Document volume must reflect the enterprise scenario (at least 1M chunks)",
      passed: state.estimation.documentChunks >= 1_000_000,
      error: "Document volume must reflect the enterprise scenario.",
    },
  ];
}

function architectureChecks(state: AttemptState): InternalCheck[] {
  const categories = new Set(state.nodes.map((node) => node.data.category));
  return [
    {
      id: "compute-component",
      label: "Add a compute component to orchestrate retrieval",
      passed: categories.has("compute"),
      error: "Add a compute component to orchestrate retrieval.",
    },
    {
      id: "data-component",
      label: "Add a retrieval data store",
      passed: categories.has("data"),
      error: "Add a retrieval data store.",
    },
    {
      id: "ai-component",
      label: "Add a model-serving component",
      passed: categories.has("ai"),
      error: "Add a model-serving component.",
    },
    {
      id: "connections",
      label: "Connect the main request and ingestion paths",
      passed: state.edges.length >= Math.max(3, state.nodes.length - 2),
      error: "Connect the main request and ingestion paths.",
    },
    {
      id: "decision",
      label: "Record at least one decision with a requirement and trade-off",
      passed: Object.values(state.decisions).some((value) => value.trim().length >= 30),
      error: "Record at least one decision with a requirement and trade-off.",
    },
  ];
}

function mitigationChecks(state: AttemptState): InternalCheck[] {
  return [
    {
      id: "mitigation",
      label: "Explain the mitigation, evidence, and validation plan in at least 40 characters",
      passed: state.mitigation.trim().length >= 40,
      error: "Explain the mitigation, evidence, and validation plan in at least 40 characters.",
    },
  ];
}

/**
 * Exposes the per-stage gate rules as readable, live-updating checklist items so the
 * UI can guide the learner before submission instead of only reporting errors after it.
 * Returns an empty array for stages without a gate (review).
 */
export function getStageChecks(stage: MissionStage, attempt: AttemptState): StageCheck[] {
  const checks =
    stage === "requirements" ? requirementChecks(attempt)
    : stage === "estimation" ? estimationChecks(attempt)
    : stage === "architecture" ? architectureChecks(attempt)
    : stage === "stress" ? mitigationChecks(attempt)
    : [];
  return checks.map(({ id, label, passed }) => ({ id, label, passed }));
}

export function validateRequirements(state: AttemptState): ValidationResult {
  const errors = requirementChecks(state).filter((check) => !check.passed).map((check) => check.error);
  return { valid: errors.length === 0, errors };
}

export function validateEstimation(state: AttemptState): ValidationResult {
  const errors = estimationChecks(state).filter((check) => !check.passed).map((check) => check.error);
  return { valid: errors.length === 0, errors };
}

export function validateArchitecture(state: AttemptState): ValidationResult {
  const errors = architectureChecks(state).filter((check) => !check.passed).map((check) => check.error);
  return { valid: errors.length === 0, errors };
}

export function validateMitigation(state: AttemptState): ValidationResult {
  const errors = mitigationChecks(state).filter((check) => !check.passed).map((check) => check.error);
  return { valid: errors.length === 0, errors };
}

export function calculateScore(state: AttemptState): number {
  const decisionPoints = Math.min(10, Object.values(state.decisions).filter((value) => value.length >= 30).length * 3);
  const graphPoints = Math.min(8, state.nodes.length + Math.floor(state.edges.length / 2));
  const mitigationPoints = state.mitigation.length >= 80 ? 8 : state.mitigation.length >= 40 ? 5 : 0;
  return Math.min(96, 68 + decisionPoints + graphPoints + mitigationPoints + state.revisionCount * 6);
}
