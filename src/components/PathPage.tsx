import { ArrowRight, Check, ChevronDown, CircleCheck, FlaskConical, Target, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { learningModules, type LearningModule } from "../data/learningContent";
import { catalogPracticeUnits, type CatalogPracticeUnit } from "../data/pdfCatalog";
import { isPracticeMastered, isPracticeMissed, loadPracticeRecords, practiceMastery, recordPracticeAttempt, savePracticeRecords, type PracticeRecordMap } from "../domain/practiceRecords";
import { DrillPlayer } from "./DrillPlayer";
import "../path.css";

interface PathPageProps {
  completedLessons: string[];
  completedModules: string[];
  reviewed: number;
  correct: number;
  onReviewed: (correct: boolean) => void;
  onOpenLesson: (moduleId: string, lessonId: string) => void;
  onOpenTraining: (mode: "failure" | "mock") => void;
  onOpenMissions: () => void;
}

interface PathStage {
  id: string;
  title: string;
  range: readonly [number, number];
  description: string;
}

interface PathEntry {
  module: LearningModule;
  chapter: number;
  drills: CatalogPracticeUnit[];
}

const stages: PathStage[] = [
  { id: "foundations", title: "Foundations", range: [1, 3], description: "Core retrieval building blocks: adaptation choices, hybrid retrieval, and the production RAG request path." },
  { id: "quality", title: "Quality", range: [4, 5], description: "Measure what matters and keep answers grounded, attributed, and reliable." },
  { id: "scale", title: "Scale & Operations", range: [6, 13], description: "Run RAG as a production system: capacity, ingestion pipelines, security, agents, prompts, observability, releases, and inference serving." },
  { id: "synthesis", title: "Synthesis", range: [14, 24], description: "Advanced and cross-cutting design: graphs, multimodal, fine-tuning, multi-agent systems, training, platforms, evaluation, cost, and safety." },
];

// rag-anatomy carries the chapter-1 lessons; catalog modules encode their
// chapter in the module id as `chapter-N-slug` (see data/pdfCatalog.ts).
function moduleChapter(module: LearningModule): number {
  if (module.id === "rag-anatomy") return 1;
  const match = module.id.match(/^chapter-(\d+)-/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

export function PathPage({ completedLessons, completedModules, reviewed, correct, onReviewed, onOpenLesson, onOpenTraining, onOpenMissions }: PathPageProps) {
  // Chapter cards pair every learning module with the catalog drills that share
  // its chapter number, sorted by chapter so the path reads in book order.
  const entries = useMemo<PathEntry[]>(() => learningModules.map((module) => {
    const chapter = moduleChapter(module);
    return { module, chapter, drills: catalogPracticeUnits.filter((unit) => unit.chapter === chapter) };
  }).sort((a, b) => a.chapter - b.chapter), []);

  const [records, setRecords] = useState<PracticeRecordMap>(() => loadPracticeRecords());
  const [openModules, setOpenModules] = useState<ReadonlySet<string>>(() => {
    const resume = entries.find((entry) => !completedModules.includes(entry.module.id));
    return new Set(resume ? [resume.module.id] : []);
  });
  const [openDrill, setOpenDrill] = useState<{ moduleId: string; drillId: string } | null>(null);

  const modulesDone = entries.filter((entry) => completedModules.includes(entry.module.id)).length;
  const accuracy = reviewed ? Math.round((correct / reviewed) * 100) : 0;

  const toggleModule = (moduleId: string) => {
    setOpenModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
    // Collapsing a chapter also collapses any drill open inside it.
    setOpenDrill((current) => (current?.moduleId === moduleId ? null : current));
  };

  const toggleDrill = (moduleId: string, drillId: string) => {
    setOpenDrill((current) => (current?.drillId === drillId ? null : { moduleId, drillId }));
  };

  // Persisting the attempt first (via the records state update) and reporting
  // through onReviewed mirrors PracticePage: badges, mastery bars, and the
  // global reviewed/accuracy counters all advance exactly once per submit.
  const handleDrillResult = (drillId: string) => (isCorrect: boolean) => {
    onReviewed(isCorrect);
    setRecords((current) => savePracticeRecords(recordPracticeAttempt(current, drillId, isCorrect)));
  };

  return (
    <div className="product-page page-content path-page">
      <header className="page-header">
        <div>
          <span className="eyebrow-label">Learning path</span>
          <h1>Learn the system, then prove it</h1>
          <p>Work through the 23-chapter blueprint in four stages: read the lessons, answer the drills, then apply it in special training and design missions. Every attempt is saved on this device.</p>
        </div>
        <div className="page-header-actions">
          <dl className="path-overview" aria-label="Path overview">
            <div className="path-overview-stat">
              <dd><span className="num">{modulesDone}</span>/{entries.length}</dd>
              <dt>Modules complete</dt>
            </div>
            <div className="path-overview-stat">
              <dd className="num">{reviewed}</dd>
              <dt>Drills reviewed</dt>
            </div>
            <div className="path-overview-stat">
              <dd><span className="num">{accuracy}</span>%</dd>
              <dt>Drill accuracy</dt>
            </div>
          </dl>
        </div>
      </header>

      {stages.map((stage, stageIndex) => {
        const stageEntries = entries.filter((entry) => entry.chapter >= stage.range[0] && entry.chapter <= stage.range[1]);
        if (stageEntries.length === 0) return null;
        return (
          <section key={stage.id} className="path-stage" aria-labelledby={`path-stage-${stage.id}`}>
            <div className="path-stage-heading">
              <span className="eyebrow-label">Stage {stageIndex + 1} · Chapters {stage.range[0]}–{stage.range[1]}</span>
              <h2 id={`path-stage-${stage.id}`}>{stage.title}</h2>
              <p>{stage.description}</p>
            </div>
            <div className="path-stage-modules">
              {stageEntries.map((entry) => {
                const { module, chapter, drills } = entry;
                const lessonsDone = module.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length;
                const lessonsTotal = module.lessons.length;
                const drillMastery = practiceMastery(records, drills.map((drill) => drill.id));
                const moduleComplete = completedModules.includes(module.id);
                const isOpen = openModules.has(module.id);
                return (
                  <article key={module.id} className="card path-module">
                    <button
                      type="button"
                      className="path-module-toggle"
                      aria-expanded={isOpen}
                      aria-controls={`path-module-body-${module.id}`}
                      onClick={() => toggleModule(module.id)}
                    >
                      <span className="path-module-heading">
                        <span className="eyebrow-label">Chapter {chapter}</span>
                        <span className="path-module-title-row">
                          <span className="path-module-title">{module.title}</span>
                          {moduleComplete ? <span className="path-badge path-badge--complete"><CircleCheck aria-hidden="true" /> Complete</span> : null}
                        </span>
                        <span className="path-module-meta"><span className="num">{lessonsDone}</span>/<span className="num">{lessonsTotal}</span> lessons · <span className="num">{drills.length}</span> drills</span>
                      </span>
                      <span className="path-module-progress">
                        <span className="path-meter">
                          <span className="path-meter-label"><span>Lessons</span><span className="num">{lessonsDone}/{lessonsTotal}</span></span>
                          <span className="path-meter-track" role="progressbar" aria-label={`${module.title} lessons complete`} aria-valuemin={0} aria-valuemax={lessonsTotal} aria-valuenow={lessonsDone}>
                            <span className="path-meter-fill path-meter-fill--lessons" style={{ width: `${lessonsTotal ? (lessonsDone / lessonsTotal) * 100 : 0}%` }} />
                          </span>
                        </span>
                        <span className="path-meter">
                          <span className="path-meter-label"><span>Drills mastered</span><span className="num">{drillMastery.mastered}/{drillMastery.total}</span></span>
                          <span className="path-meter-track" role="progressbar" aria-label={`${module.title} drills mastered`} aria-valuemin={0} aria-valuemax={drillMastery.total} aria-valuenow={drillMastery.mastered}>
                            <span className="path-meter-fill path-meter-fill--drills" style={{ width: `${drillMastery.total ? (drillMastery.mastered / drillMastery.total) * 100 : 0}%` }} />
                          </span>
                        </span>
                      </span>
                      <ChevronDown className="path-module-chevron" aria-hidden="true" />
                    </button>
                    {isOpen ? (
                      <div className="path-module-body" id={`path-module-body-${module.id}`}>
                        <section aria-label={`${module.title} lessons`}>
                          <span className="eyebrow-label">Lessons</span>
                          <ul className="path-list">
                            {module.lessons.map((lesson) => {
                              const done = completedLessons.includes(lesson.id);
                              return (
                                <li key={lesson.id}>
                                  <button type="button" className="list-row path-lesson-row" onClick={() => onOpenLesson(module.id, lesson.id)}>
                                    <span className={done ? "path-row-check path-row-check--done" : "path-row-check"} aria-hidden="true">{done ? <Check /> : null}</span>
                                    <span className="path-row-text">{lesson.title}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                        <section aria-label={`${module.title} drills`}>
                          <span className="eyebrow-label">Drills</span>
                          {drills.length === 0 ? <p className="path-empty">No catalog drills are mapped to this chapter yet.</p> : (
                            <ul className="path-list">
                              {drills.map((drill) => {
                                const record = records[drill.id];
                                const drillOpen = openDrill?.drillId === drill.id;
                                return (
                                  <li key={drill.id}>
                                    <button
                                      type="button"
                                      className={drillOpen ? "list-row path-drill-row active" : "list-row path-drill-row"}
                                      aria-expanded={drillOpen}
                                      aria-controls={`path-drill-player-${drill.id}`}
                                      onClick={() => toggleDrill(module.id, drill.id)}
                                    >
                                      <span className="path-row-text"><span className="path-drill-id num">{drill.id}</span> {drill.title}</span>
                                      {isPracticeMastered(record) ? <span className="path-badge path-badge--answered">Answered</span> : isPracticeMissed(record) ? <span className="path-badge path-badge--missed">Missed</span> : null}
                                    </button>
                                    {drillOpen ? (
                                      <div className="path-drill-player" id={`path-drill-player-${drill.id}`}>
                                        <DrillPlayer key={drill.id} unit={drill} onResult={handleDrillResult(drill.id)} />
                                      </div>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </section>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="path-special" aria-labelledby="path-special-title">
        <div className="path-section-heading">
          <span className="eyebrow-label">Special training</span>
          <h2 id="path-special-title">Train the way the interview feels</h2>
        </div>
        <div className="path-special-grid">
          <article className="card path-special-card">
            <div className="card-body">
              <span className="path-special-icon" aria-hidden="true"><FlaskConical /></span>
              <h3>RAG failure lab</h3>
              <p>Read a production symptom, diagnose the failing stage of the RAG pipeline, and pick the first evidence to inspect.</p>
              <button type="button" className="button secondary" onClick={() => onOpenTraining("failure")}>Open failure lab <ArrowRight aria-hidden="true" /></button>
            </div>
          </article>
          <article className="card path-special-card">
            <div className="card-body">
              <span className="path-special-icon" aria-hidden="true"><Timer /></span>
              <h3>45-minute mock interview</h3>
              <p>Work the complete interview arc — clarify, estimate, design, and deep-dive — against the clock with structured notes.</p>
              <button type="button" className="button secondary" onClick={() => onOpenTraining("mock")}>Start mock interview <ArrowRight aria-hidden="true" /></button>
            </div>
          </article>
        </div>
      </section>

      <article className="card path-apply">
        <div className="card-body">
          <span className="path-special-icon" aria-hidden="true"><Target /></span>
          <div className="path-apply-text">
            <h2>Ready to apply?</h2>
            <p>Take a design mission and build a complete system under operational constraints: requirements, estimation, architecture, stress testing, and review.</p>
          </div>
          <button type="button" className="button primary" onClick={onOpenMissions}>Browse missions <ArrowRight aria-hidden="true" /></button>
        </div>
      </article>
    </div>
  );
}
