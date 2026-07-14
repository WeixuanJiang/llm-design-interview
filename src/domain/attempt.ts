import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from "@xyflow/react";
import type { ArchitectureEdge, ArchitectureNode, AttemptState, MissionMode, MissionStage } from "./types";

export const ATTEMPT_STORAGE_KEY = "ai-system-design-gym.attempt.enterprise-rag.v1";

const initialNodes: ArchitectureNode[] = [
  { id: "client", type: "systemNode", position: { x: 40, y: 90 }, data: { label: "Web client", service: "Web application", category: "entry", description: "Employee chat and search interface", metric: "10,000 users" } },
  { id: "api-gateway", type: "systemNode", position: { x: 280, y: 90 }, data: { label: "API Gateway", service: "API Gateway", category: "entry", description: "Authentication, routing, and quotas", metric: "Peak 450 QPS" } },
  { id: "ecs", type: "systemNode", position: { x: 520, y: 90 }, data: { label: "ECS retrieval service", service: "ECS Fargate", category: "compute", description: "Query orchestration and context assembly", metric: "P95 160 ms" } },
  { id: "sqs", type: "systemNode", position: { x: 280, y: 300 }, data: { label: "SQS ingestion queue", service: "Amazon SQS", category: "queue", description: "Burst buffering and retry isolation", metric: "Backlog 1,240" } },
  { id: "opensearch", type: "systemNode", position: { x: 520, y: 300 }, data: { label: "OpenSearch", service: "Amazon OpenSearch", category: "data", description: "Hybrid vector and keyword retrieval", metric: "P95 118 ms" } },
  { id: "bedrock", type: "systemNode", position: { x: 760, y: 300 }, data: { label: "Amazon Bedrock", service: "Amazon Bedrock", category: "ai", description: "Answer generation with managed models", metric: "P95 1.6 s" } },
];

const initialEdges: ArchitectureEdge[] = [
  { id: "client-api", source: "client", target: "api-gateway" },
  { id: "api-ecs", source: "api-gateway", target: "ecs" },
  { id: "ecs-search", source: "ecs", target: "opensearch" },
  { id: "search-bedrock", source: "opensearch", target: "bedrock" },
  { id: "sqs-search", source: "sqs", target: "opensearch" },
];

export function createInitialAttempt(mode: MissionMode = "beginner"): AttemptState {
  return {
    schemaVersion: 1,
    attemptId: crypto.randomUUID(),
    missionId: "mission-enterprise-rag-v1",
    mode,
    stage: "requirements",
    completedStages: [],
    requirementSummary: "",
    confirmedRequirements: [],
    estimation: { users: 10_000, queriesPerUserPerDay: 12, workingHours: 10, peakFactor: 3, documentChunks: 50_000_000 },
    nodes: initialNodes,
    edges: initialEdges,
    decisions: {},
    selectedNodeId: "ecs",
    stressActive: false,
    mitigation: "",
    revisionBase: null,
    revisionCount: 0,
    savedAt: null,
  };
}

export function loadAttempt(): AttemptState | null {
  try {
    const value = localStorage.getItem(ATTEMPT_STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as AttemptState;
    return parsed.schemaVersion === 1 && Array.isArray(parsed.nodes) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: AttemptState): AttemptState {
  const saved = { ...attempt, savedAt: new Date().toISOString() };
  localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(saved));
  return saved;
}

export type AttemptAction =
  | { type: "set-mode"; mode: MissionMode }
  | { type: "set-stage"; stage: MissionStage }
  | { type: "complete-stage"; stage: MissionStage; next: MissionStage }
  | { type: "set-requirement-summary"; value: string }
  | { type: "toggle-requirement"; id: string }
  | { type: "set-estimation"; field: keyof AttemptState["estimation"]; value: number }
  | { type: "nodes-change"; changes: NodeChange<ArchitectureNode>[] }
  | { type: "edges-change"; changes: EdgeChange<ArchitectureEdge>[] }
  | { type: "connect"; connection: Connection }
  | { type: "add-node"; node: ArchitectureNode }
  | { type: "remove-node"; id: string }
  | { type: "select-node"; id: string | null }
  | { type: "save-decision"; id: string; value: string }
  | { type: "activate-stress" }
  | { type: "set-mitigation"; value: string }
  | { type: "start-revision" }
  | { type: "submit-revision" }
  | { type: "mark-saved"; savedAt: string };

export function attemptReducer(state: AttemptState, action: AttemptAction): AttemptState {
  switch (action.type) {
    case "set-mode": return { ...state, mode: action.mode };
    case "set-stage": return { ...state, stage: action.stage };
    case "complete-stage": return { ...state, stage: action.next, completedStages: [...new Set([...state.completedStages, action.stage])] };
    case "set-requirement-summary": return { ...state, requirementSummary: action.value };
    case "toggle-requirement": return { ...state, confirmedRequirements: state.confirmedRequirements.includes(action.id) ? state.confirmedRequirements.filter((id) => id !== action.id) : [...state.confirmedRequirements, action.id] };
    case "set-estimation": return { ...state, estimation: { ...state.estimation, [action.field]: action.value } };
    case "nodes-change": return { ...state, nodes: applyNodeChanges(action.changes, state.nodes) };
    case "edges-change": return { ...state, edges: applyEdgeChanges(action.changes, state.edges) };
    case "connect": return { ...state, edges: addEdge({ ...action.connection, id: crypto.randomUUID() }, state.edges) };
    case "add-node": return state.nodes.some((node) => node.id === action.node.id) ? state : { ...state, nodes: [...state.nodes, action.node], selectedNodeId: action.node.id };
    case "remove-node": return { ...state, nodes: state.nodes.filter((node) => node.id !== action.id), edges: state.edges.filter((edge) => edge.source !== action.id && edge.target !== action.id), selectedNodeId: state.selectedNodeId === action.id ? null : state.selectedNodeId };
    case "select-node": return state.selectedNodeId === action.id ? state : { ...state, selectedNodeId: action.id };
    case "save-decision": return { ...state, decisions: { ...state.decisions, [action.id]: action.value } };
    case "activate-stress": return { ...state, stage: "stress", stressActive: true, completedStages: [...new Set([...state.completedStages, "architecture" as MissionStage])], revisionBase: { nodes: state.nodes, edges: state.edges, decisions: state.decisions } };
    case "set-mitigation": return { ...state, mitigation: action.value };
    case "start-revision": return { ...state, stage: "architecture" };
    case "submit-revision": return { ...state, stage: "review", revisionCount: state.revisionCount + 1, completedStages: [...new Set([...state.completedStages, "stress" as MissionStage])] };
    case "mark-saved": return { ...state, savedAt: action.savedAt };
  }
}
