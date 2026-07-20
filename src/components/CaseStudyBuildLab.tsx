import { useReducer, useRef } from "react";
import type { AwsCustomerMission } from "../data/awsCustomerMissions";
import { attemptReducer, createInitialAttempt } from "../domain/attempt";
import { ArchitectureBuilder } from "./ArchitectureBuilder";
import "../builder.css";

interface CaseStudyBuildLabProps {
  mission: AwsCustomerMission;
  mode: "beginner" | "interview" | "production";
}

export function CaseStudyBuildLab({ mission, mode }: CaseStudyBuildLabProps) {
  const [attempt, dispatch] = useReducer(attemptReducer, undefined, () => ({
    ...createInitialAttempt(mode),
    missionId: mission.id,
    nodes: [],
    edges: [],
    decisions: {},
    selectedNodeId: null,
  }));
  const decisionRef = useRef<HTMLTextAreaElement>(null);
  const selected = attempt.nodes.find((node) => node.id === attempt.selectedNodeId);

  return (
    <section className="case-build-lab" aria-labelledby="build-lab-title">
      <header>
        <div><h3 id="build-lab-title">Build lab</h3><p>Drag AWS components onto the canvas, connect the request and data paths, then record the reason for each component.</p></div>
        <span>{attempt.nodes.length} components</span>
      </header>
      <ArchitectureBuilder
        attempt={attempt}
        components={mission.components}
        onNodesChange={(changes) => dispatch({ type: "nodes-change", changes })}
        onEdgesChange={(changes) => dispatch({ type: "edges-change", changes })}
        onConnect={(connection) => dispatch({ type: "connect", connection })}
        onAddNode={(node) => dispatch({ type: "add-node", node })}
        onSelectNode={(id) => dispatch({ type: "select-node", id })}
        onRemoveNode={(id) => dispatch({ type: "remove-node", id })}
        onEditDecision={() => decisionRef.current?.focus()}
      />
      {/* Normal document flow below the canvas — replaces the old negative-margin overlay. */}
      <div className="builder-decision">
        {selected ? <label className="builder-decision-editor"><span>Decision for {selected.data.label}</span><textarea ref={decisionRef} value={attempt.decisions[selected.id] ?? ""} onChange={(event) => dispatch({ type: "save-decision", id: selected.id, value: event.target.value })} placeholder="Requirement, alternative considered, trade-off, failure behavior, and revisit condition..." /></label> : <p className="builder-decision-hint">Select a component on the canvas to record the requirement, trade-off, and revisit condition behind it.</p>}
      </div>
    </section>
  );
}
