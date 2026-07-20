import { ArrowRight, BookOpen, Boxes, CheckCircle2, Compass, Download, History, RotateCcw, Target, Zap } from "lucide-react";
import { useState } from "react";
import "../progress.css";
import { learningModules } from "../data/learningContent";
import { studyPlan } from "../data/specialActivities";
import type { AttemptState, MissionStage } from "../domain/types";
import type { AppSection } from "./AppShell";

interface ProgressPageProps {
  attempt: AttemptState;
  completedModules: string[];
  reviewed: number;
  correct: number;
  onNavigate: (section: AppSection) => void;
  onOpenModule?: (moduleId: string) => void;
}

interface Competency {
  name: string;
  chapters: number[];
  score: number | null;
}

function moduleIdForChapter(chapter: number): string | undefined {
  if (chapter === 1) return learningModules.find((module) => module.id === "rag-anatomy")?.id;
  return learningModules.find((module) => module.id.startsWith(`chapter-${chapter}-`))?.id;
}

export function ProgressPage({ attempt, completedModules, reviewed, correct, onNavigate, onOpenModule }: ProgressPageProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  const missionProgress = Math.round((attempt.completedStages.length / 5) * 100);
  const practiceAccuracy = reviewed ? Math.round((correct / reviewed) * 100) : 0;
  const learningLift = Math.min(24, completedModules.length * 2);
  const decisionsMade = Object.keys(attempt.decisions).length;
  const decisions = reviewed + decisionsMade;
  const hasChapter = (...chapters: number[]) => completedModules.some((id) => chapters.some((chapter) => id.startsWith(`chapter-${chapter}-`)));
  const hasEvidence = reviewed > 0 || completedModules.length > 0 || attempt.completedStages.length > 0;

  // Scores sum observed evidence only — there is no fabricated baseline. Each row is
  // [name, chapters, direct evidence, soft booster]. A bar appears only when the competency has
  // direct evidence (a related finished module, the estimation stage, or defended decisions);
  // soft signals such as overall practice accuracy or mission progress can only raise a bar that
  // direct evidence already opened, never create one. No direct evidence => null => "—".
  const evidenceRows: Array<[string, number[], number, number]> = [
    ["Retrieval and RAG foundations", [1, 2, 3, 14], (completedModules.includes("rag-anatomy") ? 24 : 0) + (hasChapter(2, 3, 14) ? 8 : 0), 0],
    ["Evaluation and reliability", [4, 5, 22], hasChapter(4, 5, 22) ? 22 : 0, Math.min(12, practiceAccuracy / 8)],
    ["Data ingestion and freshness", [7], hasChapter(7) ? 28 : 0, Math.min(8, missionProgress / 12)],
    ["Performance and vector scaling", [6, 21], hasChapter(6, 21) ? 24 : 0, Math.min(8, learningLift / 3)],
    ["LLM inference and serving", [13, 21, 23], hasChapter(13, 21, 23) ? 26 : 0, Math.min(8, learningLift / 3)],
    ["Agents and orchestration", [9, 18], hasChapter(9, 18) ? 28 : 0, Math.min(8, missionProgress / 12)],
    ["Security, safety, and governance", [8, 24], hasChapter(8, 24) ? 26 : 0, Math.min(8, practiceAccuracy / 10)],
    ["LLMOps, observability, deployment", [11, 12], hasChapter(11, 12) ? 28 : 0, Math.min(8, missionProgress / 12)],
    ["ML platform and training", [17, 19, 20], hasChapter(17, 19, 20) ? 30 : 0, Math.min(8, learningLift / 3)],
    ["Estimation and cost engineering", [23], (hasChapter(23) ? 24 : 0) + (attempt.completedStages.includes("estimation") ? 12 : 0), 0],
    ["System-design communication", [], Math.min(18, decisionsMade * 5) + Math.min(10, reviewed), 0],
  ];
  const competencies: Competency[] = evidenceRows.map(([name, chapters, direct, soft]) => ({
    name,
    chapters,
    score: direct > 0 ? Math.min(100, Math.round(direct + soft)) : null,
  }));
  const measured = competencies.filter((competency) => competency.score !== null);
  const overall = measured.length ? Math.round(measured.reduce((sum, competency) => sum + (competency.score ?? 0), 0) / measured.length) : null;
  const weakest = measured.length ? [...measured].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0] : null;

  // Revision impact is derived from the snapshot taken before feedback: count concrete design
  // changes (components, connectors, decision texts) made since. No snapshot, no number.
  const revisionChanges = (() => {
    if (!attempt.revisionCount || !attempt.revisionBase) return null;
    const base = attempt.revisionBase;
    const changedNodes = attempt.nodes.filter((node) => !base.nodes.some((candidate) => candidate.id === node.id)).length + base.nodes.filter((node) => !attempt.nodes.some((candidate) => candidate.id === node.id)).length;
    const changedEdges = attempt.edges.filter((edge) => !base.edges.some((candidate) => candidate.id === edge.id)).length + base.edges.filter((edge) => !attempt.edges.some((candidate) => candidate.id === edge.id)).length;
    const decisionIds = new Set([...Object.keys(attempt.decisions), ...Object.keys(base.decisions)]);
    const changedDecisions = [...decisionIds].filter((id) => attempt.decisions[id] !== base.decisions[id]).length;
    return changedNodes + changedEdges + changedDecisions;
  })();

  const recommendedModuleId = (competency: Competency) => {
    const moduleIds = competency.chapters.map(moduleIdForChapter).filter((id): id is string => Boolean(id));
    return moduleIds.find((id) => !completedModules.includes(id)) ?? moduleIds[0];
  };
  const openModule = (moduleId: string) => {
    if (onOpenModule) onOpenModule(moduleId);
    else onNavigate("path");
  };
  const firstModuleId = learningModules[0]?.id ?? "rag-anatomy";
  const weakestModuleId = weakest ? recommendedModuleId(weakest) : undefined;
  const weakestModule = weakestModuleId ? learningModules.find((module) => module.id === weakestModuleId) : undefined;

  // Blueprint journey — the learning loop rendered as a fixed route of evidence-gated
  // milestones. State carries no timestamps, so the timeline is a milestone sequence, not a
  // calendar: every node opens only when the matching finished work exists (completed
  // modules, reviewed drills, completedStages, revisionCount), and the first unopened node
  // is highlighted as the next step with its own call to action.
  const stageDone = (stage: MissionStage) => attempt.completedStages.includes(stage);
  const firstOpenModuleId = learningModules.find((module) => !completedModules.includes(module.id))?.id ?? firstModuleId;
  const halfwayCount = Math.ceil(learningModules.length / 2);
  interface JourneyMilestone {
    id: string;
    title: string;
    done: boolean;
    detail: string;
    cta: { label: string; run: () => void };
  }
  const journeyPhases: Array<{ id: string; name: string; icon: typeof BookOpen; milestones: JourneyMilestone[] }> = [
    {
      id: "learn",
      name: "Learn",
      icon: BookOpen,
      milestones: [
        {
          id: "learn-first",
          title: "First module complete",
          done: completedModules.length >= 1,
          detail: completedModules.length >= 1 ? `${completedModules.length} of ${learningModules.length} modules finished` : "Complete any module end to end",
          cta: { label: completedModules.length >= 1 ? "Open next module" : "Start first lesson", run: () => openModule(firstOpenModuleId) },
        },
        {
          id: "learn-half",
          title: "Curriculum halfway",
          done: completedModules.length >= halfwayCount,
          detail: completedModules.length >= halfwayCount ? `${completedModules.length} modules finished — past the midpoint` : `Finish ${halfwayCount} of ${learningModules.length} modules`,
          cta: { label: "Continue learning", run: () => openModule(firstOpenModuleId) },
        },
        {
          id: "learn-all",
          title: "Curriculum complete",
          done: completedModules.length >= learningModules.length,
          detail: completedModules.length >= learningModules.length ? "Every module finished" : `All ${learningModules.length} modules`,
          cta: { label: "Open next module", run: () => openModule(firstOpenModuleId) },
        },
      ],
    },
    {
      id: "practise",
      name: "Practise",
      icon: Target,
      milestones: [
        {
          id: "practise-first",
          title: "First drill reviewed",
          done: reviewed >= 1,
          detail: reviewed >= 1 ? `${correct} correct from ${reviewed} reviewed` : "Answer any drill in Training",
          cta: { label: "Try a drill", run: () => onNavigate("practice") },
        },
        {
          id: "practise-ten",
          title: "Ten decisions reviewed",
          done: reviewed >= 10,
          detail: reviewed >= 10 ? `${reviewed} reviewed, ${practiceAccuracy}% correct` : `${reviewed} of 10 reviewed so far`,
          cta: { label: "Keep drilling", run: () => onNavigate("practice") },
        },
        {
          id: "practise-accuracy",
          title: "80% practice accuracy",
          done: reviewed >= 10 && practiceAccuracy >= 80,
          detail: reviewed >= 10 ? (practiceAccuracy >= 80 ? `${practiceAccuracy}% across ${reviewed} reviewed decisions` : `Now ${practiceAccuracy}% — 80% lights this node`) : "Unlocks after 10 reviewed decisions",
          cta: { label: "Raise accuracy", run: () => onNavigate("practice") },
        },
      ],
    },
    {
      id: "build",
      name: "Build",
      icon: Boxes,
      milestones: [
        {
          id: "build-requirements",
          title: "Requirements framed",
          done: stageDone("requirements"),
          detail: stageDone("requirements") ? `${attempt.confirmedRequirements.length} requirements confirmed` : "Scope the Enterprise RAG mission",
          cta: { label: "Open mission", run: () => onNavigate("missions") },
        },
        {
          id: "build-estimation",
          title: "Capacity estimated",
          done: stageDone("estimation"),
          detail: stageDone("estimation") ? "Traffic and storage model submitted" : "Estimate load before drawing boxes",
          cta: { label: "Open mission", run: () => onNavigate("missions") },
        },
        {
          id: "build-architecture",
          title: "Architecture drafted",
          done: stageDone("architecture"),
          detail: stageDone("architecture") ? `${attempt.nodes.length} components, ${attempt.edges.length} connectors on canvas` : "Place services on the canvas",
          cta: { label: "Open mission", run: () => onNavigate("missions") },
        },
      ],
    },
    {
      id: "stress",
      name: "Stress",
      icon: Zap,
      milestones: [
        {
          id: "stress-test",
          title: "Design stress-tested",
          done: stageDone("stress"),
          detail: stageDone("stress") ? (attempt.mitigation ? "Failure faced — mitigation recorded" : "Failure event completed") : "Face the spike-traffic failure event",
          cta: { label: "Open mission", run: () => onNavigate("missions") },
        },
      ],
    },
    {
      id: "revise",
      name: "Revise",
      icon: RotateCcw,
      milestones: [
        {
          id: "revise-review",
          title: "Feedback reviewed",
          done: stageDone("review"),
          detail: stageDone("review") ? "Design review completed" : "Read the reviewer feedback",
          cta: { label: "Open mission", run: () => onNavigate("missions") },
        },
        {
          id: "revise-submit",
          title: "Revision submitted",
          done: attempt.revisionCount >= 1,
          detail: attempt.revisionCount >= 1 ? (revisionChanges !== null ? `${revisionChanges} design changes after feedback` : `Revision ${attempt.revisionCount} on record`) : "Rework the architecture after feedback",
          cta: { label: "Revise design", run: () => onNavigate("missions") },
        },
      ],
    },
  ];
  const journeyMilestones = journeyPhases.flatMap((phase) => phase.milestones);
  const journeyDoneCount = journeyMilestones.filter((milestone) => milestone.done).length;
  const journeyNextId = journeyMilestones.find((milestone) => !milestone.done)?.id ?? null;

  const exportReport = () => {
    const report = [
      "AI System Design Gym progress",
      `Overall mastery: ${overall === null ? "no evidence yet" : `${overall}%`}`,
      `Learning modules: ${completedModules.length}/${learningModules.length}`,
      `Decisions reviewed: ${decisions}`,
      `Weakest competency: ${weakest ? `${weakest.name} (${weakest.score ?? 0}/100)` : "not enough evidence"}`,
      "",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain" }));
    const link = document.createElement("a"); link.href = url; link.download = "ai-system-design-progress.txt"; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="product-page page-content progress-page">
      <header className="product-page-header">
        <div>
          <h1>See what you can design independently</h1>
          <p>Scores are computed only from completed lessons, reviewed practice, and mission evidence you have actually produced.</p>
        </div>
        <div className="page-actions">
          <button className="button ghost" onClick={exportReport}><Download /> Export report</button>
          <button className="button primary" onClick={() => onNavigate("practice")}>Practise weak skills <ArrowRight /></button>
        </div>
      </header>

      <section className="progress-journey" aria-labelledby="progress-journey-title">
        <header>
          <div>
            <span className="progress-journey-eyebrow">Blueprint journey</span>
            <h2 id="progress-journey-title">Your route through the learning loop</h2>
            <p>Learn → Practise → Build → Stress → Revise. The route is fixed; finished work decides how far it lights up.</p>
          </div>
          <span className="progress-journey-count">{journeyDoneCount} of {journeyMilestones.length} milestones</span>
        </header>
        {!hasEvidence ? (
          <p className="progress-journey-guide">
            <Compass /> Nothing planted yet — this is the full route. Finish the first lesson or drill and the first node lights up.
          </p>
        ) : null}
        <ol className="progress-journey-track">
          {journeyPhases.map((phase) => {
            const phaseDoneCount = phase.milestones.filter((milestone) => milestone.done).length;
            const phaseStatus = phaseDoneCount === phase.milestones.length ? "is-done" : phase.milestones.some((milestone) => milestone.id === journeyNextId) ? "is-active" : "is-upcoming";
            const PhaseIcon = phase.icon;
            return (
              <li className={`progress-journey-phase ${phaseStatus}`} key={phase.id}>
                <span className="progress-journey-node" aria-hidden="true" />
                <div className="progress-journey-phase-head">
                  <PhaseIcon aria-hidden="true" />
                  <span className="progress-journey-phase-name">{phase.name}</span>
                  <span className="progress-journey-phase-count">{phaseDoneCount}/{phase.milestones.length}</span>
                </div>
                <ol className="progress-journey-steps">
                  {phase.milestones.map((milestone) => {
                    const status = milestone.done ? "is-done" : milestone.id === journeyNextId ? "is-next" : "is-upcoming";
                    const statusLabel = milestone.done ? "Done" : status === "is-next" ? "Up next" : "Ahead";
                    return (
                      <li className={`progress-journey-step ${status}`} key={milestone.id} aria-current={status === "is-next" ? "step" : undefined}>
                        <span className="progress-journey-step-dot" aria-hidden="true" />
                        <div>
                          <strong>{milestone.title}<span className="progress-journey-sr"> — {statusLabel}</span></strong>
                          <small>{milestone.detail}</small>
                          {status === "is-next" ? (
                            <button type="button" className="button secondary" onClick={milestone.cta.run}>{milestone.cta.label} <ArrowRight /></button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </li>
            );
          })}
        </ol>
      </section>

      {!hasEvidence ? (
        <section className="progress-empty" aria-labelledby="progress-empty-title">
          <span className="progress-empty-icon"><Compass /></span>
          <h2 id="progress-empty-title">Your competency profile has no evidence yet</h2>
          <p>
            Complete your first lesson or answer your first drill and this page becomes an evidence-weighted profile of what you can
            design independently. Every bar is computed from work you have finished — until then we would rather show nothing than
            invent a score.
          </p>
          <p className="progress-empty-facts">
            Right now: {completedModules.length} of {learningModules.length} modules complete · {reviewed} practice decisions reviewed · {attempt.completedStages.length} of 5 mission stages complete.
          </p>
          <div className="progress-empty-actions">
            <button className="button primary" onClick={() => openModule(firstModuleId)}>Start first lesson <ArrowRight /></button>
            <button className="button secondary" onClick={() => onNavigate("practice")}>Try a drill <ArrowRight /></button>
          </div>
        </section>
      ) : (
        <>
          <dl className="progress-summary" role="group" aria-label="Progress summary">
            <div>
              <dt>Overall mastery</dt>
              <dd className="progress-summary-value">{overall === null ? "—" : `${overall}%`}</dd>
              <dd className="progress-summary-note">{overall === null ? "No scored evidence yet" : "Evidence-weighted profile"}</dd>
            </div>
            <div>
              <dt>Current level</dt>
              <dd className="progress-summary-value">{overall === null ? "—" : overall >= 72 ? "Independent designer" : "Guided builder"}</dd>
              <dd className="progress-summary-note">{overall === null ? "Earn evidence to set a level" : overall >= 72 ? "Highest level reached" : "Next: Independent designer"}</dd>
            </div>
            <div>
              <dt>Decisions reviewed</dt>
              <dd className="progress-summary-value">{decisions}</dd>
              <dd className="progress-summary-note">Across lessons and missions</dd>
            </div>
            <div>
              <dt>Revision impact</dt>
              <dd className="progress-summary-value">{revisionChanges === null ? "—" : revisionChanges}</dd>
              <dd className="progress-summary-note">{revisionChanges === null ? "Complete a mission revision" : `Design changes after feedback${attempt.revisionCount > 1 ? ` across ${attempt.revisionCount} revisions` : ""}`}</dd>
            </div>
          </dl>

          <div className="progress-panels">
            <section className="progress-competency-panel">
              <header>
                <div>
                  <h2>Skill competency</h2>
                  <p>Bars appear only where your finished work provides evidence.</p>
                </div>
                <button className="button text" onClick={() => setShowEvidence((value) => !value)}>{showEvidence ? "Hide evidence" : "View evidence"}</button>
              </header>
              <div className="progress-competency-list">
                {competencies.map((competency) => {
                  const score = competency.score;
                  return (
                    <div className="progress-competency-row" key={competency.name}>
                      <span>{competency.name}</span>
                      <div
                        className={score === null ? "progress-competency-track progress-competency-track-empty" : "progress-competency-track"}
                        role="progressbar"
                        aria-label={score === null ? `${competency.name}: no evidence yet` : `${competency.name}: ${score} out of 100`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={score ?? undefined}
                      >
                        <i style={{ width: `${score ?? 0}%` }} />
                      </div>
                      <strong className={score === null ? "progress-competency-na" : undefined}>{score === null ? "—" : score}</strong>
                      <small>{score === null ? "Unmeasured" : score < 55 ? "Developing" : score < 75 ? "Practising" : "Strong"}</small>
                    </div>
                  );
                })}
              </div>
              {showEvidence ? (
                <div className="progress-evidence">
                  <History />
                  <span>Profile uses {completedModules.length} completed modules, {reviewed} practice decisions, and {attempt.completedStages.length} mission stages.</span>
                </div>
              ) : null}
            </section>

            <aside className="progress-side">
              <section className="progress-recommendation">
                <Target />
                <h3>Highest-impact next step</h3>
                {weakest && weakestModule ? (
                  <>
                    <p>
                      Your weakest measured competency is <strong>{weakest.name}</strong> ({weakest.score ?? 0}/100). Work through <strong>{weakestModule.title}</strong> to
                      add direct evidence to that bar, then answer a related catalog drill for recall evidence.
                    </p>
                    <button className="button primary" onClick={() => openModule(weakestModule.id)}>Open recommended module <ArrowRight /></button>
                  </>
                ) : weakest ? (
                  <>
                    <p>
                      Your weakest measured competency is <strong>{weakest.name}</strong> ({weakest.score ?? 0}/100). It grows through defended architecture decisions and
                      reviewed practice rather than a single lesson.
                    </p>
                    <button className="button primary" onClick={() => onNavigate("missions")}>Open the mission workspace <ArrowRight /></button>
                  </>
                ) : (
                  <>
                    <p>Finish a lesson or drill and the competency needing the most work will be identified here.</p>
                    <button className="button primary" onClick={() => onNavigate("path")}>Browse the curriculum <ArrowRight /></button>
                  </>
                )}
              </section>
              <section className="progress-activity">
                <h3>Recent activity</h3>
                <div>
                  <BookOpen />
                  <span><strong>Complete curriculum</strong><small>{completedModules.length} of {learningModules.length} modules complete</small></span>
                  <b>{Math.round(completedModules.length / learningModules.length * 100)}%</b>
                </div>
                <div>
                  <CheckCircle2 />
                  <span><strong>Practice decisions</strong><small>{reviewed ? `${correct} correct from ${reviewed}` : "No attempts yet"}</small></span>
                  <b>{reviewed ? `${practiceAccuracy}%` : "—"}</b>
                </div>
                <div>
                  <Target />
                  <span><strong>Enterprise RAG mission</strong><small>{attempt.stage} stage</small></span>
                  <b>{missionProgress}%</b>
                </div>
              </section>
            </aside>
          </div>
        </>
      )}

      <section className="study-plan" aria-labelledby="study-plan-title">
        <header>
          <h2 id="study-plan-title">Four-week study plan</h2>
          <p>Adapted from pages 20-21 and connected to the course activities.</p>
        </header>
        <div>
          {studyPlan.map((week, index) => (
            <article key={week.week}>
              <span>Week {week.week}</span>
              <h3>{week.title}</h3>
              <small>{week.chapters}</small>
              <p>{week.outcome}</p>
              <ul>{week.activities.map((activity) => <li key={activity}>{activity}</li>)}</ul>
              <button className="button ghost" onClick={() => onNavigate(index === 3 ? "practice" : "path")}>Open activities <ArrowRight /></button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
