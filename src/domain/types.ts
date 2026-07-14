import type { Edge, Node } from "@xyflow/react";

export type MissionMode = "beginner" | "interview" | "production";
export type MissionStage = "requirements" | "estimation" | "architecture" | "stress" | "review";
export type ComponentCategory = "entry" | "compute" | "queue" | "data" | "ai";

export interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  service: string;
  category: ComponentCategory;
  description: string;
  metric?: string;
  warning?: string;
}

export type ArchitectureNode = Node<ArchitectureNodeData>;
export type ArchitectureEdge = Edge;

export interface EstimationState {
  users: number;
  queriesPerUserPerDay: number;
  workingHours: number;
  peakFactor: number;
  documentChunks: number;
}

export interface ArchitectureSnapshot {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  decisions: Record<string, string>;
}

export interface AttemptState {
  schemaVersion: 1;
  attemptId: string;
  missionId: string;
  mode: MissionMode;
  stage: MissionStage;
  completedStages: MissionStage[];
  requirementSummary: string;
  confirmedRequirements: string[];
  estimation: EstimationState;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  decisions: Record<string, string>;
  selectedNodeId: string | null;
  stressActive: boolean;
  mitigation: string;
  revisionBase: ArchitectureSnapshot | null;
  revisionCount: number;
  savedAt: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
