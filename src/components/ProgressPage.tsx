import { ArrowRight, BookOpen, CheckCircle2, Download, History, Target } from "lucide-react";
import { useState } from "react";
import { studyPlan } from "../data/specialActivities";
import type { AttemptState } from "../domain/types";
import type { AppSection } from "./AppShell";

interface ProgressPageProps { attempt: AttemptState; completedModules: string[]; reviewed: number; correct: number; onNavigate: (section: AppSection) => void; }

export function ProgressPage({ attempt, completedModules, reviewed, correct, onNavigate }: ProgressPageProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  const missionProgress = Math.round((attempt.completedStages.length / 5) * 100);
  const practiceAccuracy = reviewed ? Math.round(correct / reviewed * 100) : 0;
  const learningLift = Math.min(24, completedModules.length * 2);
  const hasChapter = (...chapters: number[]) => completedModules.some((id) => chapters.some((chapter) => id.startsWith(`chapter-${chapter}-`)));
  const competencies = [
    ["Retrieval and RAG foundations", 45 + (completedModules.includes("rag-anatomy") ? 24 : 0) + (hasChapter(2, 3, 14) ? 8 : 0)],
    ["Evaluation and reliability", 40 + (hasChapter(4, 5, 22) ? 22 : 0) + Math.min(12, practiceAccuracy / 8)],
    ["Data ingestion and freshness", 38 + (hasChapter(7) ? 28 : 0) + Math.min(8, missionProgress / 12)],
    ["Performance and vector scaling", 42 + (hasChapter(6, 21) ? 24 : 0) + Math.min(8, learningLift / 3)],
    ["LLM inference and serving", 38 + (hasChapter(13, 21, 23) ? 26 : 0) + Math.min(8, learningLift / 3)],
    ["Agents and orchestration", 36 + (hasChapter(9, 18) ? 28 : 0) + Math.min(8, missionProgress / 12)],
    ["Security, safety, and governance", 40 + (hasChapter(8, 24) ? 26 : 0) + Math.min(8, practiceAccuracy / 10)],
    ["LLMOps, observability, deployment", 38 + (hasChapter(11, 12) ? 28 : 0) + Math.min(8, missionProgress / 12)],
    ["ML platform and training", 34 + (hasChapter(17, 19, 20) ? 30 : 0) + Math.min(8, learningLift / 3)],
    ["Estimation and cost engineering", 42 + (hasChapter(23) ? 24 : 0) + (attempt.completedStages.includes("estimation") ? 12 : 0)],
    ["System-design communication", 48 + Math.min(18, Object.keys(attempt.decisions).length * 5) + Math.min(10, reviewed)],
  ] as const;
  const overall = Math.round(competencies.reduce((sum, [, score]) => sum + score, 0) / competencies.length);
  const weakest = [...competencies].sort((a, b) => a[1] - b[1])[0];
  const decisions = reviewed + Object.keys(attempt.decisions).length;

  const exportReport = () => {
    const report = `AI System Design Gym progress\nOverall mastery: ${overall}%\nLearning modules: ${completedModules.length}/23\nDecisions reviewed: ${decisions}\nWeakest competency: ${weakest[0]}\n`;
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain" }));
    const link = document.createElement("a"); link.href = url; link.download = "ai-system-design-progress.txt"; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="product-page page-content progress-page">
    <header className="product-page-header"><div><h1>See what you can design independently</h1><p>Scores combine decisions, explanations, revisions, and performance across multiple scenarios.</p></div><div className="page-actions"><button className="button ghost" onClick={exportReport}><Download /> Export report</button><button className="button primary" onClick={() => onNavigate("practice")}>Practise weak skills <ArrowRight /></button></div></header>
    <section className="progress-stats" aria-label="Progress summary"><div><span>Overall mastery</span><strong>{overall}%</strong><small>Evidence-weighted profile</small></div><div><span>Current level</span><strong>{overall >= 72 ? "Independent designer" : "Guided builder"}</strong><small>Next: Independent designer</small></div><div><span>Decisions reviewed</span><strong>{decisions}</strong><small>Across lessons and missions</small></div><div><span>Revision impact</span><strong>{attempt.revisionCount ? "+18%" : "Pending"}</strong><small>{attempt.revisionCount ? "Average gain after feedback" : "Complete a mission revision"}</small></div></section>
    <div className="progress-layout"><section className="competency-panel"><header><div><h2>Skill competency</h2><p>Current profile with confidence from available evidence.</p></div><button className="button text" onClick={() => setShowEvidence((value) => !value)}>{showEvidence ? "Hide evidence" : "View evidence"}</button></header><div className="competency-list">{competencies.map(([name, rawScore]) => { const score = Math.round(rawScore); return <div className="competency-row" key={name}><span>{name}</span><div className="competency-track"><i style={{ width: `${score}%` }} /></div><strong>{score}</strong><small>{score < 55 ? "Developing" : score < 75 ? "Practising" : "Strong"}</small></div>; })}</div>{showEvidence ? <div className="evidence-summary"><History /><span>Profile uses {completedModules.length} completed modules, {reviewed} practice decisions, and {attempt.completedStages.length} mission stages.</span></div> : null}</section>
      <aside className="progress-aside"><section className="recommendation"><Target /><h3>Highest-impact next step</h3><p>Your lowest-evidence competency is <strong>{weakest[0]}</strong>. Complete its next lesson, then answer a related catalog drill to add both knowledge and recall evidence.</p><button className="button primary" onClick={() => onNavigate("learn")}>Start recommendation <ArrowRight /></button></section><section className="activity-panel"><h3>Recent activity</h3><div><BookOpen /><span><strong>Complete curriculum</strong><small>{completedModules.length} of 23 modules complete</small></span><b>{Math.round(completedModules.length / 23 * 100)}%</b></div><div><CheckCircle2 /><span><strong>Practice decisions</strong><small>{reviewed ? `${correct} correct from ${reviewed}` : "No attempts yet"}</small></span><b>{practiceAccuracy}%</b></div><div><Target /><span><strong>Enterprise RAG mission</strong><small>{attempt.stage} stage</small></span><b>{missionProgress}%</b></div></section></aside>
    </div>
    <section className="study-plan" aria-labelledby="study-plan-title"><header><h2 id="study-plan-title">Four-week study plan</h2><p>Adapted from pages 20-21 and connected to the course activities.</p></header><div>{studyPlan.map((week, index) => <article key={week.week}><span>Week {week.week}</span><h3>{week.title}</h3><small>{week.chapters}</small><p>{week.outcome}</p><ul>{week.activities.map((activity) => <li key={activity}>{activity}</li>)}</ul><button className="button ghost" onClick={() => onNavigate(index === 3 ? "practice" : "learn")}>Open activities <ArrowRight /></button></article>)}</div></section>
  </div>;
}
