import { Check, ChevronLeft, ChevronRight, CircleCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getLessonKnowledgeChecks, learningModules, lessonCourseContent, type LearningLesson } from "../data/learningContent";

interface LearnPageProps {
  completedModules: string[];
  completedLessons: string[];
  onComplete: (moduleId: string, lessonId: string, moduleLessonIds: string[]) => void;
  focusModuleId?: string | null;
  focusLessonId?: string | null;
  onFocusHandled?: () => void;
}

// Locates a lesson inside the module list so deep links can jump straight to it.
function findLessonLocation(lessonId: string): { moduleId: string; lessonIndex: number } | null {
  for (const module of learningModules) {
    const lessonIndex = module.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (lessonIndex >= 0) return { moduleId: module.id, lessonIndex };
  }
  return null;
}

export function LearnPage({ completedModules, completedLessons, onComplete, focusModuleId = null, focusLessonId = null, onFocusHandled }: LearnPageProps) {
  const [activeId, setActiveId] = useState(() => {
    const lessonLocation = focusLessonId ? findLessonLocation(focusLessonId) : null;
    if (lessonLocation) return lessonLocation.moduleId;
    if (focusModuleId && learningModules.some((module) => module.id === focusModuleId)) return focusModuleId;
    return learningModules.find((module) => !completedModules.includes(module.id))?.id ?? learningModules[0].id;
  });
  const [lessonIndex, setLessonIndex] = useState(() => (focusLessonId ? findLessonLocation(focusLessonId)?.lessonIndex ?? 0 : 0));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [invalidated, setInvalidated] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const activeModule = useMemo(() => learningModules.find((module) => module.id === activeId) ?? learningModules[0], [activeId]);
  const activeLesson = activeModule.lessons[Math.min(lessonIndex, activeModule.lessons.length - 1)];
  const course = lessonCourseContent[activeLesson.id] ?? fallbackCourse(activeLesson);
  const knowledgeChecks = useMemo(() => getLessonKnowledgeChecks(activeLesson), [activeLesson]);
  const activeQuestion = knowledgeChecks[questionIndex];
  const answerCorrect = checked && choice === activeQuestion.correct;
  const lessonDone = completedLessons.includes(activeLesson.id);
  const completedInModule = activeModule.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length;

  const resetActivity = () => {
    setQuestionIndex(0);
    setChoice(null);
    setChecked(false);
    setInvalidated(false);
    setAttempts(0);
  };
  const revealAnswer = () => {
    setChoice(activeQuestion.correct);
    setChecked(true);
    setInvalidated(false);
  };
  const selectModule = (id: string) => {
    setActiveId(id);
    setLessonIndex(0);
    resetActivity();
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const selectLesson = (index: number) => {
    setLessonIndex(index);
    resetActivity();
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const focusLesson = (moduleId: string, index: number) => {
    setActiveId(moduleId);
    setLessonIndex(index);
    resetActivity();
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Deep-link support: a new focusLessonId jumps straight to that lesson (winning over
  // focusModuleId); a new focusModuleId selects that module's first lesson. Either way the
  // parent is then asked to clear the focus so later visits fall back to the default
  // resume behavior.
  useEffect(() => {
    if (focusLessonId) {
      const location = findLessonLocation(focusLessonId);
      if (location) focusLesson(location.moduleId, location.lessonIndex);
      onFocusHandled?.();
      return;
    }
    if (!focusModuleId) return;
    if (learningModules.some((module) => module.id === focusModuleId)) selectModule(focusModuleId);
    onFocusHandled?.();
  }, [focusModuleId, focusLessonId, onFocusHandled]);

  return (
    <div className="product-page page-content learn-page">
      <div className="reading-layout">
        <aside className="course-outline" aria-label="Course outline">
          <div className="outline-heading">
            <span>Course</span>
            <strong>{activeModule.title}</strong>
            <small>{completedInModule} of {activeModule.lessons.length} lessons complete</small>
          </div>

          <nav className="outline-lessons" aria-label={`${activeModule.title} lessons`}>
            {activeModule.lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                className={index === lessonIndex ? "active" : ""}
                onClick={() => selectLesson(index)}
                aria-current={index === lessonIndex ? "page" : undefined}
              >
                <span>{completedLessons.includes(lesson.id) ? <Check /> : index + 1}</span>
                {lesson.title}
              </button>
            ))}
          </nav>

          <div className="outline-modules">
            <span>All modules</span>
            {learningModules.map((module) => (
              <button key={module.id} className={module.id === activeId ? "active" : ""} onClick={() => selectModule(module.id)}>
                {module.title}
                {completedModules.includes(module.id) ? <CircleCheck /> : null}
              </button>
            ))}
          </div>
        </aside>

        <main className="lesson-main">
          <article className="course-reading" aria-label="Lesson reading">
            <header className="lesson-header">
              <div className="lesson-meta">{activeModule.title} <span>Lesson {lessonIndex + 1} of {activeModule.lessons.length}</span></div>
              <h1>{activeLesson.prompt}</h1>
              <p className="lesson-introduction">{activeLesson.explanation}</p>
              <p className="source-map">Chapter {activeLesson.source.chapter}{activeLesson.source.sections.length ? `, sections ${activeLesson.source.sections.join(", ")}` : ""}, pages {activeLesson.source.pages}</p>
            </header>

            <section className="lesson-objectives" aria-labelledby="lesson-objectives-title">
              <h2 id="lesson-objectives-title">What you will learn</h2>
              <ul>{course.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
            </section>

            {course.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}

            <section className="worked-example">
              <h2>{course.example.title}</h2>
              <dl>
                <div><dt>Scenario</dt><dd>{course.example.scenario}</dd></div>
                <div><dt>Analysis</dt><dd>{course.example.analysis}</dd></div>
                <div><dt>Decision</dt><dd>{course.example.decision}</dd></div>
              </dl>
            </section>

            <section className="lesson-takeaways">
              <h2>Key takeaways</h2>
              <ul>{activeLesson.takeaways.map((item) => <li key={item}><CircleCheck /> {item}</li>)}</ul>
            </section>

            <div className="lesson-reference-grid">
              <section><h2>Production checklist</h2><ul>{course.productionChecklist.map((item) => <li key={item}>{item}</li>)}</ul></section>
              <section><h2>Common mistakes</h2><ul>{course.commonMistakes.map((item) => <li key={item}>{item}</li>)}</ul></section>
            </div>
          </article>

          <section className="knowledge-check" aria-label="Knowledge check">
            <header className="knowledge-check-header"><div><span>Knowledge check</span><strong>Question {questionIndex + 1} of {knowledgeChecks.length}</strong></div><progress value={questionIndex + (answerCorrect ? 1 : 0)} max={knowledgeChecks.length} aria-label="Knowledge check progress" /></header>
            <h2>{activeQuestion.prompt}</h2>
            <div className="lesson-options" role="group" aria-label="Decision options">
              {activeQuestion.options.map((option, index) => (
                <button key={option} className={choice === index ? "lesson-option selected" : "lesson-option"} onClick={() => { if (checked) setInvalidated(true); setChoice(index); setChecked(false); }} aria-pressed={choice === index}>
                  {option}{choice === index ? <Check /> : null}
                </button>
              ))}
            </div>
            {invalidated && !checked ? <p className="check-hint">Selection changed — check your answer again.</p> : null}
            {checked ? <div className={answerCorrect ? "inline-feedback success" : "inline-feedback warning"} role="status">{answerCorrect ? activeQuestion.feedback : "Not yet. Compare the options against the scenario's hardest constraint, failure behavior, and the evidence needed before rollout."}</div> : null}
            {!answerCorrect && attempts >= 2 ? <div className="inline-feedback reveal" role="status"><span>Still stuck? </span><button className="button text" onClick={revealAnswer}>Reveal answer and continue</button></div> : null}
            <div className="lesson-actions">
              <button className="button secondary" disabled={choice === null} onClick={() => { setChecked(true); setInvalidated(false); if (choice !== activeQuestion.correct) setAttempts((value) => value + 1); }}>Check answer</button>
              {questionIndex < knowledgeChecks.length - 1 ? <button className="button primary" disabled={!answerCorrect} onClick={() => { setQuestionIndex((value) => value + 1); setChoice(null); setChecked(false); setInvalidated(false); setAttempts(0); }}>Next question <ChevronRight /></button> : <button className="button primary" disabled={!answerCorrect || lessonDone} onClick={() => onComplete(activeModule.id, activeLesson.id, activeModule.lessons.map((lesson) => lesson.id))}>{lessonDone ? <><CircleCheck /> Completed</> : activeModule.lessons.length === 1 ? "Complete module" : "Complete lesson"}</button>}
            </div>
          </section>

          <footer className="lesson-pagination">
            <button className="button ghost" disabled={lessonIndex === 0} onClick={() => selectLesson(lessonIndex - 1)}><ChevronLeft /> Previous</button>
            <button className="button primary" disabled={lessonIndex === activeModule.lessons.length - 1} onClick={() => selectLesson(lessonIndex + 1)}>Next lesson <ChevronRight /></button>
          </footer>
        </main>
      </div>
    </div>
  );
}

function fallbackCourse(lesson: LearningLesson) {
  return { objectives: ["Explain the core engineering concept.", "Apply it to a design decision.", "Identify evidence that validates the choice."], sections: [{ heading: "Concept and application", paragraphs: [lesson.explanation, "A production decision should connect the chosen approach to a requirement, an explicit trade-off, and a measurable success condition."] }], example: { title: "Applied decision", scenario: lesson.question, analysis: lesson.explanation, decision: "Measure the result against the relevant quality, latency, reliability, and cost constraints." }, productionChecklist: ["Name the requirement.", "Record the trade-off.", "Define the validation metric."], commonMistakes: ["Choosing by familiarity alone.", "Omitting failure behavior.", "Leaving the decision unmeasured."] };
}
