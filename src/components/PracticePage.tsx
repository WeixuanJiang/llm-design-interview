import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { catalogPracticeUnits, type CatalogPracticeUnit } from "../data/pdfCatalog";
import { mockInterviewPhases, ragFailureBranches, type RagFailureBranch, type RagFailureScenario } from "../data/specialActivities";
import { isPracticeMastered, isPracticeMissed, loadPracticeRecords, recordPracticeAttempt, savePracticeRecords, type PracticeRecordMap } from "../domain/practiceRecords";
import { DrillPlayer } from "./DrillPlayer";
import "../practice.css";

type TrainingMode = "failure" | "mock" | "review";

interface PracticePageProps {
  reviewed: number;
  correct: number;
  onReviewed: (correct: boolean) => void;
  /** Deep-link entry point: which training tab to open first. Defaults to the failure lab. */
  initialMode?: TrainingMode;
}

// Fisher-Yates shuffle so the correct failure branch never sits at a fixed position.
function shuffleBranches(branches: RagFailureBranch[]): RagFailureBranch[] {
  const options = [...branches];
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [options[index], options[swap]] = [options[swap], options[index]];
  }
  return options;
}

interface ScenarioDraw {
  branch: RagFailureBranch;
  scenario: RagFailureScenario;
}

// Every (branch, scenario) pair forms one flat draw pool, so draws stay uniform
// across branches no matter how many scenarios each branch carries.
const SCENARIO_POOL: ScenarioDraw[] = ragFailureBranches.flatMap((branch) =>
  branch.scenarios.map((scenario) => ({ branch, scenario })),
);

// The previous scenario is excluded so a round never repeats back-to-back; if
// filtering would empty the pool, fall back to the full pool so a draw exists.
function drawScenario(excludeId?: string): ScenarioDraw | null {
  const pool = excludeId ? SCENARIO_POOL.filter((item) => item.scenario.id !== excludeId) : SCENARIO_POOL;
  const source = pool.length > 0 ? pool : SCENARIO_POOL;
  if (source.length === 0) return null;
  return source[Math.floor(Math.random() * source.length)];
}

export function PracticePage({ reviewed, correct, onReviewed, initialMode = "failure" }: PracticePageProps) {
  const [mode, setMode] = useState<TrainingMode>(initialMode);

  return (
    <div className="product-page page-content practice-page">
      <header className="page-header">
        <div>
          <span className="eyebrow-label">Learn - Drill - Build - Review</span>
          <h1>Training</h1>
          <p>Focused reps outside the learning path. Diagnose RAG failures branch by branch, rehearse a complete 45-minute mock interview under time pressure, then clear the drills you missed.</p>
        </div>
      </header>

      <div className="practice-modes" role="tablist" aria-label="Training mode">
        <button role="tab" aria-selected={mode === "failure"} onClick={() => setMode("failure")}>RAG failure lab</button>
        <button role="tab" aria-selected={mode === "mock"} onClick={() => setMode("mock")}>45-minute mock</button>
        <button role="tab" aria-selected={mode === "review"} onClick={() => setMode("review")}>Review missed</button>
      </div>

      {mode === "failure" ? <FailureLab onReviewed={onReviewed} reviewed={reviewed} correct={correct} /> : null}
      {mode === "mock" ? <MockInterview /> : null}
      {mode === "review" ? <ReviewMissed onReviewed={onReviewed} /> : null}
    </div>
  );
}

function PracticeEvidence({ reviewed, correct, competencies }: { reviewed: number; correct: number; competencies: string[] }) {
  return <footer className="practice-evidence" aria-label="Practice evidence"><CheckCircle2 /><span><strong>{reviewed}</strong> reviewed</span><span><strong>{reviewed ? Math.round(correct / reviewed * 100) : 0}%</strong> accuracy</span><span>{competencies.join(" / ")}</span></footer>;
}

function FailureLab({ onReviewed, reviewed, correct }: Pick<PracticePageProps, "onReviewed" | "reviewed" | "correct">) {
  const [records, setRecords] = useState<PracticeRecordMap>(() => loadPracticeRecords());
  const [round, setRound] = useState<ScenarioDraw | null>(() => drawScenario());
  const [options, setOptions] = useState<RagFailureBranch[]>(() => shuffleBranches(ragFailureBranches));
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // Judging matches the chosen branch id against the drawn scenario's branch id,
  // so the shuffled display order can never leak the answer. Records key on branch id.
  const submit = () => {
    if (diagnosisId === null || submitted || !round) return;
    setSubmitted(true);
    const isCorrect = diagnosisId === round.branch.id;
    onReviewed(isCorrect);
    setRecords((current) => savePracticeRecords(recordPracticeAttempt(current, round.branch.id, isCorrect)));
  };
  const nextScenario = () => {
    setRound((current) => drawScenario(current?.scenario.id));
    setOptions(shuffleBranches(ragFailureBranches));
    setDiagnosisId(null);
    setSubmitted(false);
  };

  if (!round) return <div role="status">No failure scenarios are available.</div>;

  const { branch, scenario } = round;
  const record = records[branch.id];
  return <section className="failure-lab" aria-label="RAG failure lab">
    <main className="special-practice-main"><span>RAG failure taxonomy, pages 76-77</span><h2>Diagnose the failure branch</h2><p>{scenario.symptom}</p><h3>Where should investigation begin?</h3><div className="practice-options" role="group" aria-label="Failure branches">{options.map((item, index) => {
      const stateClass = submitted
        ? item.id === branch.id ? "practice-option--correct" : diagnosisId === item.id ? "practice-option--incorrect" : null
        : diagnosisId === item.id ? "selected" : null;
      return <button key={item.id} disabled={submitted} className={stateClass ? `practice-option ${stateClass}` : "practice-option"} onClick={() => setDiagnosisId(item.id)} aria-pressed={diagnosisId === item.id}><span>{String.fromCharCode(65 + index)}</span>{item.label}</button>;
    })}</div>{submitted ? <div className={diagnosisId === branch.id ? "inline-feedback success" : "inline-feedback warning"} role="status">{diagnosisId === branch.id ? branch.diagnosis : "The symptom points to a different stage. Trace the request and identify the first stage where expected evidence diverges from observed evidence."}</div> : null}{submitted ? <div className="failure-signals"><h3>Evidence to inspect: {branch.label}{isPracticeMastered(record) ? <span className="practice-badge practice-badge--correct">Diagnosed</span> : isPracticeMissed(record) ? <span className="practice-badge practice-badge--missed">Missed</span> : null}</h3><ul>{branch.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul></div> : null}<div className="practice-submit">{submitted ? <button className="button primary" onClick={nextScenario}>Next scenario</button> : <button className="button primary" disabled={diagnosisId === null} onClick={submit}>Check diagnosis</button>}</div><PracticeEvidence reviewed={reviewed} correct={correct} competencies={["retrieval", "context", "generation", "infrastructure"]} /></main>
  </section>;
}

// Chapter 16 collects the book's thirteen interview design questions; each mock
// session draws one at random as its prompt and keeps it until redraw or reset.
const MOCK_QUESTION_POOL = catalogPracticeUnits.filter((unit) => unit.chapter === 16);

function drawMockQuestion(excludeId?: string): CatalogPracticeUnit | null {
  const pool = excludeId ? MOCK_QUESTION_POOL.filter((unit) => unit.id !== excludeId) : MOCK_QUESTION_POOL;
  const source = pool.length > 0 ? pool : MOCK_QUESTION_POOL;
  if (source.length === 0) return null;
  return source[Math.floor(Math.random() * source.length)];
}

const MOCK_TOTAL_SECONDS = 45 * 60;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Elapsed time maps to the phase whose cumulative minute boundary contains it
// (5, 12, 27, 37, 42, 45), so the sidebar can highlight where the clock says
// you should be, independent of the phase you are viewing.
function expectedPhaseIndex(elapsedSeconds: number): number {
  let cumulative = 0;
  for (let index = 0; index < mockInterviewPhases.length; index += 1) {
    cumulative += mockInterviewPhases[index].minutes * 60;
    if (elapsedSeconds < cumulative) return index;
  }
  return mockInterviewPhases.length - 1;
}

// Self-assessment rubric (interview rubric). Guidance is written per dimension;
// the two lowest scores become the next session's practice focus.
const MOCK_RUBRIC = [
  { id: "framing", label: "Problem framing", guidance: "Spend your next mock's first 5 minutes restating scope, constraints, and success metrics before designing." },
  { id: "depth", label: "Technical depth", guidance: "Go one level deeper on the riskiest component: name data structures, interfaces, and capacity numbers instead of tool names." },
  { id: "tradeoffs", label: "Trade-off reasoning", guidance: "For every major decision, state one alternative you rejected and the condition that would make you switch." },
  { id: "failure", label: "Failure & ownership", guidance: "Walk one failure scenario end to end — detection, mitigation, recovery — and name the metric that proves the fix worked." },
  { id: "communication", label: "Communication", guidance: "Narrate your reasoning out loud, signpost each phase, and check in with the interviewer before moving on." },
] as const;

type MockStep = "interview" | "assess" | "result";

function MockInterview() {
  const [question, setQuestion] = useState<CatalogPracticeUnit | null>(() => drawMockQuestion());
  const [phase, setPhase] = useState(0);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(MOCK_TOTAL_SECONDS);
  const [running, setRunning] = useState(true);
  const [step, setStep] = useState<MockStep>("interview");
  const [scores, setScores] = useState<Record<string, number>>({});

  // One-second ticks drive the countdown; the display derives from state, so
  // the timer never drifts with wall-clock reads. Cleanup runs on unmount and
  // whenever the timer is paused.
  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0) setRunning(false);
  }, [secondsLeft]);

  const current = mockInterviewPhases[phase];
  const completed = mockInterviewPhases.filter((_, index) => notes[index]?.trim()).length;
  const onClock = expectedPhaseIndex(MOCK_TOTAL_SECONDS - secondsLeft);
  const timeUp = secondsLeft === 0;
  const scoredCount = MOCK_RUBRIC.filter((dimension) => scores[dimension.id] !== undefined).length;
  // Stable sort keeps rubric order on ties, so the focus list is deterministic.
  const lowestTwo = [...MOCK_RUBRIC].sort((a, b) => (scores[a.id] ?? 0) - (scores[b.id] ?? 0)).slice(0, 2);

  const startNewMock = () => {
    setQuestion(drawMockQuestion(question?.id));
    setPhase(0);
    setNotes({});
    setSecondsLeft(MOCK_TOTAL_SECONDS);
    setRunning(true);
    setStep("interview");
    setScores({});
  };

  if (!question || !current) return <div role="status">No interview questions are available.</div>;

  return (
    <div className="mock-interview" aria-label="45-minute mock interview">
      <aside>
        <span>45 minutes total</span>
        {mockInterviewPhases.map((item, index) => {
          const classes = [
            index === phase && step === "interview" ? "active" : "",
            index === onClock && step === "interview" ? "on-clock" : "",
          ].filter(Boolean).join(" ");
          return (
            <button key={item.title} className={classes} onClick={() => { setPhase(index); setStep("interview"); }}>
              <strong>{item.minutes} min</strong>
              {item.title}
              {notes[index]?.trim() ? <CheckCircle2 /> : null}
            </button>
          );
        })}
      </aside>
      <main>
        {step === "interview" ? (
          <>
            <section className="mock-question" aria-label="Interview question">
              <span className="eyebrow-label">{question.chapterTitle} · pp. {question.pages}</span>
              <h2>{question.title}</h2>
              <p>{question.question}</p>
              <button type="button" className="button secondary" onClick={() => setQuestion(drawMockQuestion(question.id))}>New question</button>
            </section>
            <div className="mock-timer">
              <span role="timer" aria-label="Interview countdown" className={timeUp ? "mock-countdown time-up" : "mock-countdown"}>{formatCountdown(secondsLeft)}</span>
              <span className="mock-timer-phase">Phase target: {current.minutes} min</span>
              <button type="button" className="button secondary" onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Resume"}</button>
              <button type="button" className="button secondary" onClick={() => { setSecondsLeft(MOCK_TOTAL_SECONDS); setRunning(true); }}>Reset timer</button>
            </div>
            {timeUp ? (
              <div className="inline-feedback warning mock-time-up" role="status">
                <span>Time is up — wrap up your current thought and move to self-assessment.</span>
                <button type="button" className="button primary" onClick={() => setStep("assess")}>Go to self-assessment</button>
              </div>
            ) : null}
            <span>Phase {phase + 1} of {mockInterviewPhases.length}</span>
            <h2>{current.title}</h2>
            <p>{current.prompt}</p>
            <label>Your interview notes
              <textarea value={notes[phase] ?? ""} onChange={(event) => setNotes((value) => ({ ...value, [phase]: event.target.value }))} placeholder="State assumptions and reasoning clearly..." />
            </label>
            <footer>
              <span>{completed} of {mockInterviewPhases.length} phases drafted</span>
              {phase < mockInterviewPhases.length - 1 ? (
                <button type="button" className="button primary" onClick={() => setPhase((value) => value + 1)}>Next phase</button>
              ) : (
                <button type="button" className="button primary" onClick={() => setStep("assess")}>Finish &amp; self-assess</button>
              )}
            </footer>
          </>
        ) : null}
        {step === "assess" ? (
          <>
            <span>Self-assessment</span>
            <h2>Rate your mock interview</h2>
            <p>Score each dimension from 1 (needs work) to 5 (interview-ready). Your two lowest scores become the practice focus for your next reps.</p>
            <div className="mock-rubric">
              {MOCK_RUBRIC.map((dimension) => (
                <div className="mock-rubric-row" key={dimension.id}>
                  <span>{dimension.label}</span>
                  <div className="mock-score" role="group" aria-label={`${dimension.label} score`}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button key={value} type="button" aria-pressed={scores[dimension.id] === value} onClick={() => setScores((currentScores) => ({ ...currentScores, [dimension.id]: value }))}>{value}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <footer>
              <span>{scoredCount} of {MOCK_RUBRIC.length} dimensions scored</span>
              <button type="button" className="button primary" disabled={scoredCount < MOCK_RUBRIC.length} onClick={() => setStep("result")}>See practice focus</button>
            </footer>
          </>
        ) : null}
        {step === "result" ? (
          <>
            <span>Practice focus</span>
            <h2>Your two lowest dimensions</h2>
            <p>Self-assessment for &ldquo;{question.title}&rdquo;. Concentrate your next mock sessions here.</p>
            <div className="mock-result">
              {lowestTwo.map((dimension) => (
                <div className="mock-result-row" key={dimension.id}>
                  <strong>{dimension.label}<span className="practice-badge practice-badge--missed">{scores[dimension.id]}/5</span></strong>
                  <p>{dimension.guidance}</p>
                </div>
              ))}
            </div>
            <footer>
              <span>Rubric: {MOCK_RUBRIC.map((dimension) => dimension.label).join(" / ")}</span>
              <button type="button" className="button primary" onClick={startNewMock}>Start a new mock</button>
            </footer>
          </>
        ) : null}
      </main>
    </div>
  );
}

function ReviewMissed({ onReviewed }: Pick<PracticePageProps, "onReviewed">) {
  const [records, setRecords] = useState<PracticeRecordMap>(() => loadPracticeRecords());
  // Missed = attempted but never correct. The queue reads in book order and a
  // unit drops out of it as soon as a correct answer lands.
  const missed = catalogPracticeUnits
    .filter((unit) => isPracticeMissed(records[unit.id]))
    .sort((a, b) => a.chapter - b.chapter);
  const currentUnit = missed[0];

  // Same wiring as PathPage: persist first, then report, so badges, mastery,
  // and the global reviewed/accuracy counters advance exactly once per submit.
  const handleResult = (drillId: string) => (isCorrect: boolean) => {
    onReviewed(isCorrect);
    setRecords((currentRecords) => savePracticeRecords(recordPracticeAttempt(currentRecords, drillId, isCorrect)));
  };

  if (!currentUnit) {
    return (
      <div className="review-missed" aria-label="Review missed drills">
        <div className="inline-feedback success" role="status">
          No missed drills — every attempted drill is correct. Keep practicing from the Path tab to build more evidence.
        </div>
      </div>
    );
  }

  return (
    <div className="review-missed" aria-label="Review missed drills">
      <header className="review-missed-header">
        <span className="eyebrow-label">Review missed</span>
        <h2>{missed.length} missed {missed.length === 1 ? "drill" : "drills"} left</h2>
        <p>Answer a drill correctly to clear it from this queue. Now showing Chapter {currentUnit.chapter} — {currentUnit.chapterTitle}.</p>
      </header>
      <DrillPlayer key={currentUnit.id} unit={currentUnit} onResult={handleResult(currentUnit.id)} />
    </div>
  );
}
