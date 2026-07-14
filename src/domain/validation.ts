import type { AttemptState, ValidationResult } from "./types";

export function calculatePeakQps(state: AttemptState): number {
  const { users, queriesPerUserPerDay, workingHours, peakFactor } = state.estimation;
  return Math.round((users * queriesPerUserPerDay * peakFactor) / Math.max(1, workingHours * 3600));
}

export function validateRequirements(state: AttemptState): ValidationResult {
  const errors: string[] = [];
  if (state.confirmedRequirements.length < 3) errors.push("Confirm all three mission requirements.");
  if (state.requirementSummary.trim().length < 60) errors.push("Summarise the requirements in at least 60 characters.");
  return { valid: errors.length === 0, errors };
}

export function validateEstimation(state: AttemptState): ValidationResult {
  const errors: string[] = [];
  if (calculatePeakQps(state) < 1) errors.push("Peak QPS must be greater than zero.");
  if (state.estimation.documentChunks < 1_000_000) errors.push("Document volume must reflect the enterprise scenario.");
  return { valid: errors.length === 0, errors };
}

export function validateArchitecture(state: AttemptState): ValidationResult {
  const errors: string[] = [];
  const categories = new Set(state.nodes.map((node) => node.data.category));
  if (!categories.has("compute")) errors.push("Add a compute component to orchestrate retrieval.");
  if (!categories.has("data")) errors.push("Add a retrieval data store.");
  if (!categories.has("ai")) errors.push("Add a model-serving component.");
  if (state.edges.length < Math.max(3, state.nodes.length - 2)) errors.push("Connect the main request and ingestion paths.");
  if (!Object.values(state.decisions).some((value) => value.trim().length >= 30)) errors.push("Record at least one decision with a requirement and trade-off.");
  return { valid: errors.length === 0, errors };
}

export function validateMitigation(state: AttemptState): ValidationResult {
  const errors = state.mitigation.trim().length >= 40 ? [] : ["Explain the mitigation, evidence, and validation plan in at least 40 characters."];
  return { valid: errors.length === 0, errors };
}

export function calculateScore(state: AttemptState): number {
  const decisionPoints = Math.min(10, Object.values(state.decisions).filter((value) => value.length >= 30).length * 3);
  const graphPoints = Math.min(8, state.nodes.length + Math.floor(state.edges.length / 2));
  const mitigationPoints = state.mitigation.length >= 80 ? 8 : state.mitigation.length >= 40 ? 5 : 0;
  return Math.min(96, 68 + decisionPoints + graphPoints + mitigationPoints + state.revisionCount * 6);
}
