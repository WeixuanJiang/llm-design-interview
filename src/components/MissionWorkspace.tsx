import type { Dispatch } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Bot, Check, ChevronRight, Cloud, Save, X } from "lucide-react";
import type { AttemptAction } from "../domain/attempt";
import type { AttemptState, MissionStage, ValidationResult } from "../domain/types";
import { calculatePeakQps, calculateScore, validateArchitecture, validateEstimation, validateMitigation, validateRequirements } from "../domain/validation";
import { enterpriseRagMission } from "../data/enterpriseRagMission";
import { ArchitectureBuilder } from "./ArchitectureBuilder";

const stageValidators: Partial<Record<MissionStage, (attempt: AttemptState) => ValidationResult>> = {
  requirements: validateRequirements,
  estimation: validateEstimation,
  architecture: validateArchitecture,
  stress: validateMitigation,
};

interface MissionWorkspaceProps {
  attempt: AttemptState;
  dispatch: Dispatch<AttemptAction>;
  saveStatus: "saved" | "saving" | "offline";
  onExit: () => void;
}

const stages: Array<{ id: MissionStage; label: string }> = [
  { id: "requirements", label: "Requirements" },
  { id: "estimation", label: "Estimation" },
  { id: "architecture", label: "Architecture" },
  { id: "stress", label: "Stress test" },
  { id: "review", label: "Review" },
];

export function MissionWorkspace({ attempt, dispatch, saveStatus, onExit }: MissionWorkspaceProps) {
  const [stageErrors, setStageErrors] = useState<string[]>([]);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionValue, setDecisionValue] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const selected = attempt.nodes.find((node) => node.id === attempt.selectedNodeId) ?? null;
  const stageIndex = stages.findIndex((stage) => stage.id === attempt.stage);

  const submit = (validation: ValidationResult, action: () => void) => {
    setStageErrors(validation.errors);
    if (validation.valid) action();
  };

  const continueStage = () => {
    if (attempt.stage === "requirements") submit(validateRequirements(attempt), () => dispatch({ type: "complete-stage", stage: "requirements", next: "estimation" }));
    if (attempt.stage === "estimation") submit(validateEstimation(attempt), () => dispatch({ type: "complete-stage", stage: "estimation", next: "architecture" }));
    if (attempt.stage === "architecture") submit(validateArchitecture(attempt), () => attempt.revisionBase && attempt.stressActive ? dispatch({ type: "submit-revision" }) : dispatch({ type: "activate-stress" }));
    if (attempt.stage === "stress") submit(validateMitigation(attempt), () => dispatch({ type: "complete-stage", stage: "stress", next: "review" }));
  };

  // Only ever narrows stageErrors toward empty once the learner has attempted "Continue" -
  // never introduces new errors outside the explicit submit() path.
  useEffect(() => {
    if (!stageErrors.length) return;
    const validator = stageValidators[attempt.stage];
    const result = validator?.(attempt);
    if (result?.valid) setStageErrors([]);
  }, [attempt, stageErrors.length]);

  useEffect(() => {
    if (stageErrors.length) bannerRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [stageErrors]);

  const openDecision = () => {
    if (!selected) return;
    setDecisionValue(attempt.decisions[selected.id] ?? "");
    setDecisionError(null);
    setDecisionOpen(true);
  };

  const saveDecision = () => {
    if (!selected || decisionValue.trim().length < 30) {
      setDecisionError("Decision reasoning must include at least 30 characters.");
      return;
    }
    dispatch({ type: "save-decision", id: selected.id, value: decisionValue.trim() });
    setDecisionOpen(false);
    setDecisionError(null);
  };

  return (
    <section className="workspace-page">
      <header className="mission-header">
        <div className="mission-title-row">
          <div><h1>{enterpriseRagMission.title}</h1><p>{enterpriseRagMission.summary}</p></div>
          <div className="mission-header-actions">
            <span className={`save-indicator ${saveStatus}`}><Cloud /> {saveStatus === "saving" ? "Saving" : saveStatus === "offline" ? "Saved locally" : "Saved"}</span>
            <button className="button ghost" onClick={onExit}><ArrowLeft /> Exit workspace</button>
          </div>
        </div>
        <ol className="stage-stepper" aria-label="Mission stages">
          {stages.map((stage, index) => {
            const content = <><span>{index < stageIndex ? <Check /> : index + 1}</span><strong>{stage.label}</strong></>;
            const stageHint = stage.id === "stress" ? " — includes a required revision step" : stage.id === "review" ? " — one revision is required to complete" : "";
            return index < stageIndex
              ? <li key={stage.id} className="done"><button type="button" onClick={() => dispatch({ type: "set-stage", stage: stage.id })} aria-label={`Review ${stage.label} (completed)`}>{content}</button></li>
              : <li key={stage.id} className={index === stageIndex ? "active" : "future"} aria-current={index === stageIndex ? "step" : undefined} aria-label={`${stage.label}${stageHint}`}>{content}</li>;
          })}
        </ol>
      </header>

      <div className="workspace-toolbar">
        <span><strong>{stages[stageIndex].label}</strong><small>{stageInstruction(attempt.stage, attempt.mode)}</small></span>
        <button className="icon-button" onClick={() => setCoachOpen(true)} aria-label="Open contextual coach" title="Open contextual coach"><Bot /></button>
      </div>

      {stageErrors.length ? <div className="validation-banner" role="alert" ref={bannerRef}><AlertTriangle /><div><strong>Resolve before continuing</strong>{stageErrors.map((error) => <p key={error}>{error}</p>)}</div><button className="icon-button" onClick={() => setStageErrors([])} aria-label="Dismiss validation errors"><X /></button></div> : null}

      <div className="stage-content">
        {attempt.stage === "requirements" ? <RequirementsStage attempt={attempt} dispatch={dispatch} /> : null}
        {attempt.stage === "estimation" ? <EstimationStage attempt={attempt} dispatch={dispatch} /> : null}
        {attempt.stage === "architecture" ? <ArchitectureBuilder attempt={attempt} onNodesChange={(changes) => dispatch({ type: "nodes-change", changes })} onEdgesChange={(changes) => dispatch({ type: "edges-change", changes })} onConnect={(connection) => dispatch({ type: "connect", connection })} onAddNode={(node) => dispatch({ type: "add-node", node })} onSelectNode={(id) => dispatch({ type: "select-node", id })} onRemoveNode={(id) => dispatch({ type: "remove-node", id })} onEditDecision={openDecision} /> : null}
        {attempt.stage === "stress" ? <StressStage attempt={attempt} dispatch={dispatch} /> : null}
        {attempt.stage === "review" ? <ReviewStage attempt={attempt} dispatch={dispatch} /> : null}
      </div>

      {attempt.stage !== "review" ? <footer className="workspace-footer"><div><span className="footer-label">Current evidence</span><p>{footerEvidence(attempt)}</p></div><button className="button primary" onClick={continueStage}>{attempt.stage === "architecture" && attempt.revisionBase ? "Submit revision" : nextLabel(attempt.stage)}<ChevronRight /></button></footer> : null}

      {decisionOpen && selected ? <div className="modal-backdrop"><section className="decision-dialog" role="dialog" aria-modal="true" aria-labelledby="decision-title"><header><div><span>Architecture decision</span><h2 id="decision-title">Defend {selected.data.label}</h2></div><button className="icon-button" onClick={() => setDecisionOpen(false)} aria-label="Close decision editor"><X /></button></header><label>Reasoning<textarea autoFocus value={decisionValue} onChange={(event) => { setDecisionValue(event.target.value); setDecisionError(null); }} maxLength={600} placeholder="State the requirement, trade-off, and condition that would change this decision." /></label><small className={decisionValue.trim().length >= 30 ? "char-counter ok" : "char-counter"}>{decisionValue.length}/600 characters{decisionValue.trim().length < 30 ? ` (${30 - decisionValue.trim().length} more needed)` : ""}</small>{decisionError ? <p className="field-error" role="alert">{decisionError}</p> : null}<footer><button className="button ghost" onClick={() => setDecisionOpen(false)}>Cancel</button><button className="button primary" onClick={saveDecision}><Save /> Save reasoning</button></footer></section></div> : null}

      {coachOpen ? <aside className="coach-drawer" aria-label="Contextual coach"><header><div><span className="coach-icon"><Bot /></span><div><strong>AI Coach</strong><small>Grounded in the current stage</small></div></div><button className="icon-button" onClick={() => setCoachOpen(false)} aria-label="Close contextual coach"><X /></button></header><div className="coach-body"><span className="coach-label">Guided question</span><p>{coachPrompt(attempt)}</p><div className="coach-context">This is a scripted prompt tied to your current stage, not a live conversation — it won't respond to follow-ups.</div></div></aside> : null}
    </section>
  );
}

function RequirementsStage({ attempt, dispatch }: { attempt: AttemptState; dispatch: Dispatch<AttemptAction> }) {
  return <div className="form-stage"><div className="stage-main"><h2>Clarify what the system must guarantee</h2><p>Confirm the authored constraints, then restate the problem in your own words before designing.</p><div className="requirement-list">{enterpriseRagMission.requirements.map((requirement) => <label key={requirement.id} className="check-row"><input type="checkbox" checked={attempt.confirmedRequirements.includes(requirement.id)} onChange={() => dispatch({ type: "toggle-requirement", id: requirement.id })}/><span><strong>{requirement.label}</strong><small>Required for architecture evaluation</small></span></label>)}</div><label className="field-label">Requirements summary<textarea value={attempt.requirementSummary} onChange={(event) => dispatch({ type: "set-requirement-summary", value: event.target.value })} placeholder="Describe the users, scale, latency, security, and freshness constraints." /></label></div><aside className="stage-aside"><h3>Scenario facts</h3><dl><div><dt>Employees</dt><dd>10,000</dd></div><div><dt>Document chunks</dt><dd>50 million</dd></div><div><dt>Latency target</dt><dd>P95 under 3 s</dd></div><div><dt>Freshness</dt><dd>15 minutes</dd></div></dl></aside></div>;
}

function EstimationStage({ attempt, dispatch }: { attempt: AttemptState; dispatch: Dispatch<AttemptAction> }) {
  const fields: Array<{ key: keyof AttemptState["estimation"]; label: string; suffix: string }> = [
    { key: "users", label: "Active users", suffix: "users" }, { key: "queriesPerUserPerDay", label: "Queries per user/day", suffix: "queries" }, { key: "workingHours", label: "Active window", suffix: "hours" }, { key: "peakFactor", label: "Peak multiplier", suffix: "x" }, { key: "documentChunks", label: "Indexed chunks", suffix: "chunks" },
  ];
  return <div className="form-stage"><div className="stage-main"><h2>Estimate the request and retrieval load</h2><p>Edit the assumptions. Derived values update immediately and become evidence for architecture evaluation.</p><div className="estimate-grid">{fields.map((field) => <label key={field.key}><span>{field.label}</span><div><input type="number" min="1" value={attempt.estimation[field.key]} onChange={(event) => dispatch({ type: "set-estimation", field: field.key, value: Number(event.target.value) })}/><small>{field.suffix}</small></div></label>)}</div></div><aside className="calculation-panel"><span>Derived peak load</span><strong>{calculatePeakQps(attempt)} QPS</strong><p>(users x queries x peak factor) / active seconds</p><dl><div><dt>Vector corpus</dt><dd>{(attempt.estimation.documentChunks / 1_000_000).toFixed(0)}M chunks</dd></div><div><dt>Target budget</dt><dd>3,000 ms</dd></div></dl></aside></div>;
}

function StressStage({ attempt, dispatch }: { attempt: AttemptState; dispatch: Dispatch<AttemptAction> }) {
  return <div className="stress-stage"><header><span className="stress-icon"><AlertTriangle /></span><div><h2>Traffic increased 20x</h2><p>The request path breached its latency objective. Use the evidence to prioritise a mitigation.</p></div></header><div className="evidence-table" role="table" aria-label="Stress event evidence"><div role="row"><span role="columnheader">Signal</span><span role="columnheader">Before</span><span role="columnheader">Now</span><span role="columnheader">Interpretation</span></div><div role="row"><span>End-to-end P95</span><span>2.4 s</span><strong>8.4 s</strong><span>Objective breached</span></div><div role="row"><span>OpenSearch CPU</span><span>61%</span><strong>94%</strong><span>Retrieval saturation</span></div><div role="row"><span>Bedrock throttling</span><span>0.4%</span><strong>17%</strong><span>Downstream pressure</span></div></div><label className="field-label">Mitigation and validation plan<textarea value={attempt.mitigation} onChange={(event) => dispatch({ type: "set-mitigation", value: event.target.value })} placeholder="Prioritise one bottleneck, explain the evidence, and state how you will verify latency and retrieval quality." /></label></div>;
}

function ReviewStage({ attempt, dispatch }: { attempt: AttemptState; dispatch: Dispatch<AttemptAction> }) {
  const score = calculateScore(attempt);
  const comparison = useMemo(() => {
    if (!attempt.revisionBase) return "Initial architecture captured.";
    const nodeDelta = attempt.nodes.length - attempt.revisionBase.nodes.length;
    const decisionDelta = Object.keys(attempt.decisions).length - Object.keys(attempt.revisionBase.decisions).length;
    return `${nodeDelta >= 0 ? "+" : ""}${nodeDelta} components and ${decisionDelta >= 0 ? "+" : ""}${decisionDelta} decisions since the initial submission.`;
  }, [attempt]);
  const strongestDecision = useMemo(() => {
    const entries = Object.entries(attempt.decisions).sort((a, b) => b[1].length - a[1].length);
    if (!entries.length) return null;
    const [nodeId, text] = entries[0];
    const node = attempt.nodes.find((candidate) => candidate.id === nodeId);
    return { label: node?.data.label ?? "a component", text };
  }, [attempt.decisions, attempt.nodes]);
  return <div className="review-stage"><header><div><h2>{attempt.revisionCount ? "Revision evaluated" : "Initial feedback"}</h2><p>Evidence is linked to the architecture, decisions, and stress response.</p></div><strong className="score">{score}<small>/100</small></strong></header><div className="feedback-grid"><section><span>Strength</span>{strongestDecision ? <><h3>Your strongest recorded decision</h3><p>{`On ${strongestDecision.label}: "${strongestDecision.text}"`}</p></> : <><h3>No decisions recorded yet</h3><p>Record at least one decision on the architecture to see it reflected here.</p></>}</section><section><span>Risk</span><h3>Retrieval saturation needs a measured response</h3><p>{attempt.mitigation || "No mitigation evidence was submitted."}</p></section><section><span>Revision evidence</span><h3>{attempt.revisionCount ? "Design changed after feedback" : "One revision is required"}</h3><p>{comparison}</p></section></div><footer>{attempt.revisionCount === 0 ? <button className="button primary" onClick={() => dispatch({ type: "start-revision" })}>Revise architecture<ChevronRight /></button> : <div className="completion-message"><Check /> Mission loop complete. The attempt is saved and ready for competency processing.</div>}</footer></div>;
}

function stageInstruction(stage: MissionStage, mode: AttemptState["mode"]) {
  const guidance = mode === "beginner" ? "Guided" : mode === "interview" ? "Defend each choice" : "Use operational evidence";
  const tasks = { requirements: "Clarify constraints", estimation: "Quantify scale", architecture: "Build and defend, then respond to a stress event and one revision", stress: "Diagnose and mitigate", review: "Compare evidence" };
  return `${guidance} - ${tasks[stage]}`;
}

function nextLabel(stage: MissionStage) {
  return ({ requirements: "Continue to estimation", estimation: "Continue to architecture", architecture: "Run stress event", stress: "Submit for review", review: "Complete" })[stage];
}

function footerEvidence(attempt: AttemptState) {
  if (attempt.stage === "requirements") return `${attempt.confirmedRequirements.length}/3 constraints confirmed`;
  if (attempt.stage === "estimation") return `${calculatePeakQps(attempt)} calculated peak QPS`;
  if (attempt.stage === "architecture") return `${attempt.nodes.length} components, ${attempt.edges.length} connections, ${Object.keys(attempt.decisions).length} decisions`;
  if (attempt.stage === "stress") return attempt.mitigation ? "Mitigation draft recorded" : "Mitigation evidence required";
  return "Evaluation complete";
}

function coachPrompt(attempt: AttemptState) {
  if (attempt.stage === "requirements") return "Which requirement would most change the architecture if its target became ten times stricter?";
  if (attempt.stage === "estimation") return `Your estimate is ${calculatePeakQps(attempt)} peak QPS. Which assumption has the widest uncertainty range?`;
  if (attempt.stage === "architecture") return "Where does backpressure occur when model inference throttles, and what protects the request path?";
  if (attempt.stage === "stress") return "Which signal identifies the first bottleneck, and what measurement would disprove your hypothesis?";
  return "What changed between your initial and revised architecture, and which risk remains?";
}
