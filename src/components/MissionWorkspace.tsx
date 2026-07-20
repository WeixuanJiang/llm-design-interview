import type { Dispatch } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Bot, Check, ChevronRight, Cloud, RotateCcw, Save, X } from "lucide-react";
import type { AttemptAction } from "../domain/attempt";
import type { AttemptState, MissionStage, ValidationResult } from "../domain/types";
import type { StageCheck } from "../domain/validation";
import { calculatePeakQps, calculateScore, getStageChecks, validateArchitecture, validateEstimation, validateMitigation, validateRequirements } from "../domain/validation";
import { enterpriseRagMission } from "../data/enterpriseRagMission";
import { ArchitectureBuilder } from "./ArchitectureBuilder";
import "../workspace.css";

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
  const stageChecks = getStageChecks(attempt.stage, attempt);
  // Field-level error markers only appear after a failed "Continue" submit, mirroring the banner.
  const failedCheckIds = new Set(stageErrors.length ? stageChecks.filter((check) => !check.passed).map((check) => check.id) : []);
  const savedTime = saveStatus === "saved" ? formatSavedTime(attempt.savedAt) : null;
  // Design-loop derivation: the mission is a cycle (draft → stress event → revision →
  // complete), not a straight line. `reworking` is true while the learner is back in
  // the architecture stage after starting a revision from review.
  const reworking = isReworking(attempt);
  const revisionDisplay = Math.max(1, attempt.revisionCount + 1);
  const loopSteps = getLoopSteps(attempt);
  const activeLoopStep = loopSteps.find((step) => step.active) ?? loopSteps[0];
  const loopSummary = `Now: ${activeLoopStep.label}`;
  const loopLiveText = reworking
    ? `Design loop status: revision ${revisionDisplay} in progress. You are reworking the architecture stage; later stages reopen after you submit the revision.`
    : `Design loop status: ${loopStatusText[activeLoopStep.id]}.`;

  // URL contract: the stage is mirrored into the hash (#workspace?stage=<0-4>, default
  // omitted) so a workspace link restores the loop position. Inbound edits are parsed
  // tolerantly; outbound writes use replaceState to avoid history pile-up.
  useEffect(() => {
    const syncStageFromHash = () => {
      const index = readStageIndexFromHash(window.location.hash);
      if (index !== null && stages[index].id !== attempt.stage) dispatch({ type: "set-stage", stage: stages[index].id });
    };
    syncStageFromHash();
    window.addEventListener("hashchange", syncStageFromHash);
    return () => window.removeEventListener("hashchange", syncStageFromHash);
  }, [attempt.stage, dispatch]);

  const dispatchWithHash = (stage: MissionStage, action: AttemptAction) => {
    window.history.replaceState(null, "", stageHashFor(stage));
    dispatch(action);
  };

  const goToStage = (stage: MissionStage) => dispatchWithHash(stage, { type: "set-stage", stage });

  const submit = (validation: ValidationResult, action: () => void) => {
    setStageErrors(validation.errors);
    if (validation.valid) action();
  };

  const continueStage = () => {
    if (attempt.stage === "requirements") submit(validateRequirements(attempt), () => dispatchWithHash("estimation", { type: "complete-stage", stage: "requirements", next: "estimation" }));
    if (attempt.stage === "estimation") submit(validateEstimation(attempt), () => dispatchWithHash("architecture", { type: "complete-stage", stage: "estimation", next: "architecture" }));
    if (attempt.stage === "architecture") submit(validateArchitecture(attempt), () => attempt.revisionBase && attempt.stressActive ? dispatchWithHash("review", { type: "submit-revision" }) : dispatchWithHash("stress", { type: "activate-stress" }));
    if (attempt.stage === "stress") submit(validateMitigation(attempt), () => dispatchWithHash("review", { type: "complete-stage", stage: "stress", next: "review" }));
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
            <span className={`save-indicator ${saveStatus}`}><Cloud /> {saveStatus === "saving" ? "Saving" : saveStatus === "offline" ? "Saved locally" : savedTime ? `Saved ${savedTime}` : "Saved"}</span>
            <button className="button ghost" onClick={onExit}><ArrowLeft /> Exit workspace</button>
          </div>
        </div>
        <ol className="stage-stepper" aria-label="Mission stages">
          {stages.map((stage, index) => {
            const content = <><span>{index < stageIndex ? <Check /> : index + 1}</span><strong>{stage.label}</strong></>;
            const stageHint = stage.id === "stress" ? "Includes a required revision step" : stage.id === "review" ? "One revision is required to complete" : "";
            const reworkingThis = reworking && stage.id === "architecture";
            const item = index < stageIndex
              ? (
                <li className={reworkingThis ? "done reworking" : "done"}>
                  <button type="button" onClick={() => goToStage(stage.id)} aria-label={`Review ${stage.label} (completed)`}>{content}</button>
                  {reworkingThis ? <small className="workspace-reworking-tag">Reworking</small> : null}
                </li>
              )
              : (
                <li className={index === stageIndex ? (reworkingThis ? "active reworking" : "active") : "future"} aria-current={index === stageIndex ? "step" : undefined} aria-label={stageHint ? `${stage.label} — ${stageHint}` : stage.label}>
                  {content}
                  {reworkingThis ? <small className="workspace-reworking-tag">Reworking</small> : null}
                  {stageHint ? <small className="workspace-stage-hint">{stageHint}</small> : null}
                </li>
              );
            // The revision loop-back is rendered explicitly between architecture and the
            // remaining stages instead of letting the stepper appear to jump backwards.
            return (
              <Fragment key={stage.id}>
                {reworking && index === stages.length - 2 ? (
                  <li className="workspace-loop-marker" aria-hidden="true">
                    <span className="workspace-loop-badge"><RotateCcw />{`Revision ${revisionDisplay} in progress`}</span>
                  </li>
                ) : null}
                {item}
              </Fragment>
            );
          })}
        </ol>
        <div className="workspace-loop" role="group" aria-label="Design loop status">
          <p className="workspace-loop-summary">
            <span className="eyebrow-label">Design loop</span>
            <span className="workspace-loop-active">{loopSummary}</span>
          </p>
          <ol className="workspace-loop-steps">
            {loopSteps.map((step) => (
              <li key={step.id} className={step.active ? "active" : step.done ? "done" : "todo"}>
                {step.done ? <Check aria-hidden /> : null}
                <span>{step.label}</span>
                <small className="workspace-loop-state">{step.active ? "In progress" : step.done ? "Done" : "Pending"}</small>
              </li>
            ))}
          </ol>
        </div>
        <div className="workspace-sr-only" role="status" aria-live="polite">{loopLiveText}</div>
      </header>

      <div className="workspace-toolbar">
        <span><strong>{stages[stageIndex].label}</strong><small>{stageInstruction(attempt.stage, attempt.mode)}</small></span>
        <button className="icon-button" onClick={() => setCoachOpen(true)} aria-label="Open guided hints" title="Open guided hints"><Bot /></button>
      </div>

      {stageChecks.length ? <StageChecklist checks={stageChecks} /> : null}

      {stageErrors.length ? <div className="validation-banner" role="alert" ref={bannerRef}><AlertTriangle /><div><strong>Resolve before continuing</strong>{stageErrors.map((error) => <p key={error}>{error}</p>)}</div><button className="icon-button" onClick={() => setStageErrors([])} aria-label="Dismiss validation errors"><X /></button></div> : null}

      <div className="stage-content">
        {attempt.stage === "requirements" ? <RequirementsStage attempt={attempt} dispatch={dispatch} summaryInvalid={failedCheckIds.has("requirement-summary")} /> : null}
        {attempt.stage === "estimation" ? <EstimationStage attempt={attempt} dispatch={dispatch} qpsInvalid={failedCheckIds.has("peak-qps")} chunksInvalid={failedCheckIds.has("document-chunks")} /> : null}
        {attempt.stage === "architecture" ? <ArchitectureBuilder attempt={attempt} onNodesChange={(changes) => dispatch({ type: "nodes-change", changes })} onEdgesChange={(changes) => dispatch({ type: "edges-change", changes })} onConnect={(connection) => dispatch({ type: "connect", connection })} onAddNode={(node) => dispatch({ type: "add-node", node })} onSelectNode={(id) => dispatch({ type: "select-node", id })} onRemoveNode={(id) => dispatch({ type: "remove-node", id })} onEditDecision={openDecision} /> : null}
        {attempt.stage === "stress" ? <StressStage attempt={attempt} dispatch={dispatch} mitigationInvalid={failedCheckIds.has("mitigation")} /> : null}
        {attempt.stage === "review" ? <ReviewStage attempt={attempt} onStartRevision={() => dispatchWithHash("architecture", { type: "start-revision" })} /> : null}
      </div>

      {attempt.stage !== "review" ? <footer className="workspace-footer"><div><span className="footer-label">Current evidence</span><p>{footerEvidence(attempt)}</p></div><button className="button primary" onClick={continueStage}>{attempt.stage === "architecture" && attempt.revisionBase ? "Submit revision" : nextLabel(attempt.stage)}<ChevronRight /></button></footer> : null}

      {decisionOpen && selected ? <div className="modal-backdrop"><section className="decision-dialog" role="dialog" aria-modal="true" aria-labelledby="decision-title"><header><div><span>Architecture decision</span><h2 id="decision-title">Defend {selected.data.label}</h2></div><button className="icon-button" onClick={() => setDecisionOpen(false)} aria-label="Close decision editor"><X /></button></header><label>Reasoning<textarea autoFocus value={decisionValue} onChange={(event) => { setDecisionValue(event.target.value); setDecisionError(null); }} maxLength={600} placeholder="State the requirement, trade-off, and condition that would change this decision." /></label><small className={decisionValue.trim().length >= 30 ? "char-counter ok" : "char-counter"}>{decisionValue.length}/600 characters{decisionValue.trim().length < 30 ? ` (${30 - decisionValue.trim().length} more needed)` : ""}</small>{decisionError ? <p className="field-error" role="alert">{decisionError}</p> : null}<footer><button className="button ghost" onClick={() => setDecisionOpen(false)}>Cancel</button><button className="button primary" onClick={saveDecision}><Save /> Save reasoning</button></footer></section></div> : null}

      {coachOpen ? <aside className="coach-drawer" aria-label="Guided hints"><header><div><span className="coach-icon"><Bot /></span><div><strong>Guided hints</strong><small>Grounded in the current stage</small></div></div><button className="icon-button" onClick={() => setCoachOpen(false)} aria-label="Close guided hints"><X /></button></header><div className="coach-body"><div className="coach-context">This is a scripted prompt tied to your current stage, not a live conversation — it won't respond to follow-ups.</div><span className="coach-label">Guided question</span><p>{coachPrompt(attempt)}</p></div></aside> : null}
    </section>
  );
}

function StageChecklist({ checks }: { checks: StageCheck[] }) {
  const [open, setOpen] = useState(true);
  const passed = checks.filter((check) => check.passed).length;
  return (
    <div className="workspace-checklist">
      <button type="button" className="workspace-checklist-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <ChevronRight aria-hidden />
        <span>Requirements to continue</span>
        <span className="workspace-checklist-count">{passed}/{checks.length}</span>
      </button>
      {open ? <ul>
        {checks.map((check) => <li key={check.id} className={check.passed ? "passed" : ""}><span className="workspace-checklist-marker" aria-hidden>{check.passed ? <Check /> : null}</span>{check.label}</li>)}
      </ul> : null}
    </div>
  );
}

function RequirementsStage({ attempt, dispatch, summaryInvalid }: { attempt: AttemptState; dispatch: Dispatch<AttemptAction>; summaryInvalid: boolean }) {
  return <div className="form-stage"><div className="stage-main"><h2>Clarify what the system must guarantee</h2><p>Confirm the authored constraints, then restate the problem in your own words before designing.</p><div className="requirement-list">{enterpriseRagMission.requirements.map((requirement) => <label key={requirement.id} className="check-row"><input type="checkbox" checked={attempt.confirmedRequirements.includes(requirement.id)} onChange={() => dispatch({ type: "toggle-requirement", id: requirement.id })}/><span><strong>{requirement.label}</strong><small>Required for architecture evaluation</small></span></label>)}</div><label className="field-label">Requirements summary<textarea value={attempt.requirementSummary} onChange={(event) => dispatch({ type: "set-requirement-summary", value: event.target.value })} placeholder="Describe the users, scale, latency, security, and freshness constraints." className={summaryInvalid ? "workspace-field-error" : undefined} aria-invalid={summaryInvalid || undefined} /></label><CharacterCounter value={attempt.requirementSummary} minimum={60} /></div><aside className="stage-aside"><h3>Scenario facts</h3><dl><div><dt>Employees</dt><dd>10,000</dd></div><div><dt>Document chunks</dt><dd>50 million</dd></div><div><dt>Latency target</dt><dd>P95 under 3 s</dd></div><div><dt>Freshness</dt><dd>15 minutes</dd></div></dl></aside></div>;
}

function EstimationStage({ attempt, dispatch, qpsInvalid, chunksInvalid }: { attempt: AttemptState; dispatch: Dispatch<AttemptAction>; qpsInvalid: boolean; chunksInvalid: boolean }) {
  const fields: Array<{ key: keyof AttemptState["estimation"]; label: string; suffix: string }> = [
    { key: "users", label: "Active users", suffix: "users" }, { key: "queriesPerUserPerDay", label: "Queries per user/day", suffix: "queries" }, { key: "workingHours", label: "Active window", suffix: "hours" }, { key: "peakFactor", label: "Peak multiplier", suffix: "x" }, { key: "documentChunks", label: "Indexed chunks", suffix: "chunks" },
  ];
  // Local drafts let the input be empty or mid-edit (e.g. "-") without pushing NaN into state;
  // the reducer always receives a finite number clamped at zero. Blur resyncs to the stored value.
  const [drafts, setDrafts] = useState<Partial<Record<keyof AttemptState["estimation"], string>>>({});
  const handleChange = (field: keyof AttemptState["estimation"], raw: string) => {
    setDrafts((previous) => ({ ...previous, [field]: raw }));
    const parsed = Number(raw);
    dispatch({ type: "set-estimation", field, value: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 });
  };
  const handleBlur = (field: keyof AttemptState["estimation"]) => setDrafts((previous) => {
    const next = { ...previous };
    delete next[field];
    return next;
  });
  return <div className="form-stage"><div className="stage-main"><h2>Estimate the request and retrieval load</h2><p>Edit the assumptions. Derived values update immediately and become evidence for architecture evaluation.</p><div className="estimate-grid">{fields.map((field) => {
    const invalid = field.key === "documentChunks" ? chunksInvalid : qpsInvalid;
    return <label key={field.key}><span>{field.label}</span><div className={invalid ? "workspace-field-error" : undefined}><input type="number" min="0" value={drafts[field.key] ?? String(attempt.estimation[field.key])} onChange={(event) => handleChange(field.key, event.target.value)} onBlur={() => handleBlur(field.key)} aria-invalid={invalid || undefined} /><small>{field.suffix}</small></div></label>;
  })}</div></div><aside className="calculation-panel"><span>Derived peak load</span><strong>{calculatePeakQps(attempt)} QPS</strong><p>(users x queries x peak factor) / active seconds</p><dl><div><dt>Vector corpus</dt><dd>{(attempt.estimation.documentChunks / 1_000_000).toFixed(0)}M chunks</dd></div><div><dt>Target budget</dt><dd>3,000 ms</dd></div></dl></aside></div>;
}

function StressStage({ attempt, dispatch, mitigationInvalid }: { attempt: AttemptState; dispatch: Dispatch<AttemptAction>; mitigationInvalid: boolean }) {
  return <div className="stress-stage"><header><span className="stress-icon"><AlertTriangle /></span><div><h2>Traffic increased 20x</h2><p>The request path breached its latency objective. Use the evidence to prioritise a mitigation.</p></div></header><div className="evidence-table" role="table" aria-label="Stress event evidence"><div role="row"><span role="columnheader">Signal</span><span role="columnheader">Before</span><span role="columnheader">Now</span><span role="columnheader">Interpretation</span></div><div role="row"><span>End-to-end P95</span><span>2.4 s</span><strong>8.4 s</strong><span>Objective breached</span></div><div role="row"><span>OpenSearch CPU</span><span>61%</span><strong>94%</strong><span>Retrieval saturation</span></div><div role="row"><span>Bedrock throttling</span><span>0.4%</span><strong>17%</strong><span>Downstream pressure</span></div></div><label className="field-label">Mitigation and validation plan<textarea value={attempt.mitigation} onChange={(event) => dispatch({ type: "set-mitigation", value: event.target.value })} placeholder="Prioritise one bottleneck, explain the evidence, and state how you will verify latency and retrieval quality." className={mitigationInvalid ? "workspace-field-error" : undefined} aria-invalid={mitigationInvalid || undefined} /></label><CharacterCounter value={attempt.mitigation} minimum={40} /></div>;
}

function CharacterCounter({ value, minimum }: { value: string; minimum: number }) {
  const trimmed = value.trim().length;
  const met = trimmed >= minimum;
  return <small className={met ? "workspace-char-counter ok" : "workspace-char-counter"}>{trimmed}/{minimum} characters minimum{met ? "" : ` (${minimum - trimmed} more needed)`}</small>;
}

function ReviewStage({ attempt, onStartRevision }: { attempt: AttemptState; onStartRevision: () => void }) {
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
  return <div className="review-stage"><header><div><h2>{attempt.revisionCount ? "Revision evaluated" : "Initial feedback"}</h2><p>Evidence is linked to the architecture, decisions, and stress response.</p></div><strong className="score">{score}<small>/100</small></strong></header><div className="feedback-grid"><section><span>Strength</span>{strongestDecision ? <><h3>Your strongest recorded decision</h3><p>{`On ${strongestDecision.label}: "${strongestDecision.text}"`}</p></> : <><h3>No decisions recorded yet</h3><p>Record at least one decision on the architecture to see it reflected here.</p></>}</section><section><span>Risk</span><h3>Retrieval saturation needs a measured response</h3><p>{attempt.mitigation || "No mitigation evidence was submitted."}</p></section><section><span>Revision evidence</span><h3>{attempt.revisionCount ? "Design changed after feedback" : "One revision is required"}</h3><p>{comparison}</p></section></div><footer>{attempt.revisionCount === 0 ? <button className="button primary" onClick={onStartRevision}>Revise architecture<ChevronRight /></button> : <div className="completion-message"><Check /> Mission loop complete. The attempt is saved and ready for competency processing.</div>}</footer></div>;
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

function formatSavedTime(savedAt: string | null): string | null {
  if (!savedAt) return null;
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return null;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function coachPrompt(attempt: AttemptState) {
  if (attempt.stage === "requirements") return "Which requirement would most change the architecture if its target became ten times stricter?";
  if (attempt.stage === "estimation") return `Your estimate is ${calculatePeakQps(attempt)} peak QPS. Which assumption has the widest uncertainty range?`;
  if (attempt.stage === "architecture") return "Where does backpressure occur when model inference throttles, and what protects the request path?";
  if (attempt.stage === "stress") return "Which signal identifies the first bottleneck, and what measurement would disprove your hypothesis?";
  return "What changed between your initial and revised architecture, and which risk remains?";
}

/* ── Design loop derivation ─────────────────────────────────────── */

type LoopStepId = "draft" | "stress" | "revision" | "complete";

interface LoopStep {
  id: LoopStepId;
  label: string;
  done: boolean;
  active: boolean;
}

const loopStatusText: Record<LoopStepId, string> = {
  draft: "drafting the initial architecture",
  stress: "responding to the stress event",
  revision: "reworking the architecture",
  complete: "mission loop complete",
};

/** True while the learner is back in architecture after "Revise architecture". */
function isReworking(attempt: AttemptState): boolean {
  return attempt.stage === "architecture" && attempt.stressActive && Boolean(attempt.revisionBase) && attempt.revisionCount === 0;
}

/**
 * Maps the attempt onto the sub-status band shown under the stage stepper:
 * draft → stress event → revision → complete. Exactly one step is active; steps
 * behind it stay done even when the learner revisits an earlier main stage.
 */
function getLoopSteps(attempt: AttemptState): LoopStep[] {
  // Stress counts as experienced once it fired, once it is completed, or whenever the
  // learner is already at/after the stress stage (e.g. via a hash-restored link).
  const stressIndex = stages.findIndex((stage) => stage.id === "stress");
  const atOrPastStress = stages.findIndex((stage) => stage.id === attempt.stage) >= stressIndex;
  const stressExperienced = attempt.stressActive || attempt.completedStages.includes("stress") || atOrPastStress;
  const reworking = isReworking(attempt);
  const revisionDone = attempt.revisionCount > 0;
  const revisionLabel = attempt.revisionBase || revisionDone ? `Revision ${Math.max(1, attempt.revisionCount + (reworking ? 1 : 0))}` : "Revision";
  return [
    { id: "draft", label: "Draft", done: stressExperienced, active: !stressExperienced },
    { id: "stress", label: "Stress event", done: reworking || revisionDone, active: stressExperienced && !reworking && !revisionDone },
    { id: "revision", label: revisionLabel, done: revisionDone, active: reworking },
    { id: "complete", label: "Complete", done: false, active: revisionDone },
  ];
}

/* ── Stage ↔ hash sync (#workspace?stage=<0-4>) ─────────────────── */

function readStageIndexFromHash(hash: string): number | null {
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return null;
  const raw = new URLSearchParams(hash.slice(queryIndex + 1)).get("stage");
  if (raw === null) return null;
  const index = Number.parseInt(raw, 10);
  return Number.isInteger(index) && index >= 0 && index < stages.length ? index : null;
}

/** Preserves the hash base segment and any params owned by other views. */
function stageHashFor(stageId: MissionStage): string {
  const hash = window.location.hash || "#workspace";
  const queryIndex = hash.indexOf("?");
  const base = (queryIndex === -1 ? hash : hash.slice(0, queryIndex)) || "#workspace";
  const params = new URLSearchParams(queryIndex === -1 ? "" : hash.slice(queryIndex + 1));
  const index = stages.findIndex((stage) => stage.id === stageId);
  if (index > 0) params.set("stage", String(index));
  else params.delete("stage");
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
