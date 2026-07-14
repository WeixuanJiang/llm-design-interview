import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { catalogPracticeUnits } from "../data/pdfCatalog";
import { mockInterviewPhases, ragFailureBranches } from "../data/specialActivities";

interface PracticePageProps { reviewed: number; correct: number; onReviewed: (correct: boolean) => void; }
type SessionMode = "drills" | "failure" | "mock";

const responseOptions = [
  "Clarify requirements and assumptions, explain the mechanism, compare trade-offs, cover failure handling, and define validation evidence.",
  "Name a preferred model or vendor first, then adapt the requirements to that choice.",
  "Present only the final architecture and omit alternatives so the answer stays concise.",
];

export function PracticePage({ reviewed, correct, onReviewed }: PracticePageProps) {
  const chapters = useMemo(() => [...new Map(catalogPracticeUnits.map((unit) => [unit.chapter, unit.chapterTitle])).entries()], []);
  const [mode, setMode] = useState<SessionMode>("drills");
  const [chapter, setChapter] = useState(chapters[0]?.[0] ?? 1);
  const visibleUnits = catalogPracticeUnits.filter((unit) => unit.chapter === chapter);
  const [activeId, setActiveId] = useState(catalogPracticeUnits[0]?.id ?? "");
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const active = catalogPracticeUnits.find((unit) => unit.id === activeId) ?? visibleUnits[0] ?? catalogPracticeUnits[0];

  const openUnit = (id: string) => {
    setActiveId(id);
    setSelected(null);
    setSubmitted(false);
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changeChapter = (next: number) => {
    setChapter(next);
    const first = catalogPracticeUnits.find((unit) => unit.chapter === next);
    if (first) openUnit(first.id);
  };
  // A reveal-answer escape hatch (like LearnPage's) is intentionally not added here:
  // this submit feeds graded practiceCorrect/practiceReviewed stats, so revealing
  // would need a decision about whether it counts as reviewed/correct. Follow-up.
  const submit = () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    onReviewed(selected === 0);
  };

  if (!active) return <div className="page-content" role="status">No practice units are available.</div>;

  return (
    <div className="product-page page-content practice-page">
      <header className="practice-header">
        <div><h1>Practice</h1><p>Catalog drills, incident diagnosis, and a complete mock interview.</p></div>
        {mode === "drills" ? <label>Chapter<select value={chapter} onChange={(event) => changeChapter(Number(event.target.value))}>{chapters.map(([number, title]) => <option key={number} value={number}>Chapter {number}: {title}</option>)}</select></label> : null}
      </header>

      <div className="practice-modes" role="tablist" aria-label="Practice mode">
        <button role="tab" aria-selected={mode === "drills"} onClick={() => setMode("drills")}>Question bank</button>
        <button role="tab" aria-selected={mode === "failure"} onClick={() => setMode("failure")}>RAG failure lab</button>
        <button role="tab" aria-selected={mode === "mock"} onClick={() => setMode("mock")}>45-minute mock</button>
      </div>

      {mode === "drills" ? <div className="practice-catalog-layout">
        <aside className="practice-unit-list" aria-label="Practice units">
          <strong>{visibleUnits.length} drills</strong>
          {visibleUnits.map((unit) => <button key={unit.id} className={unit.id === active.id ? "active" : ""} onClick={() => openUnit(unit.id)} aria-current={unit.id === active.id ? "page" : undefined}><span>{unit.id}</span>{unit.title}</button>)}
        </aside>
        <main>
          <section className="practice-session" aria-label="Practice challenge">
            <header><span>Chapter {active.chapter}, page {active.pages}</span><h2>{active.title}</h2><p>Build a concise answer that exposes your reasoning. The review checks answer structure before you compare detailed technical choices.</p></header>
            <div className="practice-question">
              <h3>Which response plan gives you the strongest foundation?</h3>
              <div className="practice-options" role="group" aria-label="Response plans">{responseOptions.map((option, index) => <button key={option} disabled={submitted} className={selected === index ? "practice-option selected" : "practice-option"} onClick={() => setSelected(index)} aria-pressed={selected === index}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
              {submitted ? <div role="status" className={selected === 0 ? "inline-feedback success" : "inline-feedback warning"}>{selected === 0 ? `Correct. A strong answer to "${active.title}" starts from requirements, makes trade-offs visible, and names the evidence that would validate or change the design.` : "This plan jumps to a solution before establishing the decision criteria. Start with requirements and make failure behavior and validation explicit."}</div> : null}
              <div className="practice-submit"><button className="button primary" disabled={selected === null || submitted} onClick={submit}>Review answer</button></div>
            </div>
          </section>
          <PracticeEvidence reviewed={reviewed} correct={correct} competencies={active.competencies} />
        </main>
      </div> : null}

      {mode === "failure" ? <FailureLab onReviewed={onReviewed} reviewed={reviewed} correct={correct} /> : null}
      {mode === "mock" ? <MockInterview /> : null}
    </div>
  );
}

function PracticeEvidence({ reviewed, correct, competencies }: { reviewed: number; correct: number; competencies: string[] }) {
  return <footer className="practice-evidence" aria-label="Practice evidence"><CheckCircle2 /><span><strong>{reviewed}</strong> reviewed</span><span><strong>{reviewed ? Math.round(correct / reviewed * 100) : 0}%</strong> accuracy</span><span>{competencies.join(" / ")}</span></footer>;
}

function FailureLab({ onReviewed, reviewed, correct }: PracticePageProps) {
  const [symptom, setSymptom] = useState(0);
  const [diagnosis, setDiagnosis] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const branch = ragFailureBranches[symptom];
  const chooseSymptom = (index: number) => { setSymptom(index); setDiagnosis(null); setSubmitted(false); };
  const submit = () => { if (diagnosis === null || submitted) return; setSubmitted(true); onReviewed(diagnosis === symptom); };

  return <div className="special-practice-layout">
    <aside className="failure-symptoms" aria-label="Failure symptoms">{ragFailureBranches.map((item, index) => <button key={item.id} className={index === symptom ? "active" : ""} onClick={() => chooseSymptom(index)}><strong>{item.label}</strong><span>{item.symptom}</span></button>)}</aside>
    <main className="special-practice-main"><span>RAG failure taxonomy, pages 76-77</span><h2>Diagnose the failure branch</h2><p>{branch.symptom}</p><h3>Where should investigation begin?</h3><div className="practice-options">{ragFailureBranches.map((item, index) => <button key={item.id} disabled={submitted} className={diagnosis === index ? "practice-option selected" : "practice-option"} onClick={() => setDiagnosis(index)}><span>{String.fromCharCode(65 + index)}</span>{item.label}</button>)}</div>{submitted ? <div className={diagnosis === symptom ? "inline-feedback success" : "inline-feedback warning"} role="status">{diagnosis === symptom ? branch.diagnosis : "The symptom points to a different stage. Trace the request and identify the first stage where expected evidence diverges from observed evidence."}</div> : null}<div className="failure-signals"><h3>Evidence to inspect</h3><ul>{branch.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul></div><div className="practice-submit"><button className="button primary" disabled={diagnosis === null || submitted} onClick={submit}>Check diagnosis</button></div><PracticeEvidence reviewed={reviewed} correct={correct} competencies={["retrieval", "context", "generation", "infrastructure"]} /></main>
  </div>;
}

function MockInterview() {
  const [phase, setPhase] = useState(0);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const current = mockInterviewPhases[phase];
  const completed = mockInterviewPhases.filter((_, index) => notes[index]?.trim()).length;
  return <div className="mock-interview" aria-label="45-minute mock interview"><aside><span>45 minutes total</span>{mockInterviewPhases.map((item, index) => <button key={item.title} className={index === phase ? "active" : ""} onClick={() => setPhase(index)}><strong>{item.minutes} min</strong>{item.title}{notes[index]?.trim() ? <CheckCircle2 /> : null}</button>)}</aside><main><span>Phase {phase + 1} of {mockInterviewPhases.length}</span><h2>{current.title}</h2><p>{current.prompt}</p><label>Your interview notes<textarea value={notes[phase] ?? ""} onChange={(event) => setNotes((value) => ({ ...value, [phase]: event.target.value }))} placeholder="State assumptions and reasoning clearly..." /></label><footer><span>{completed} of {mockInterviewPhases.length} phases drafted</span><button className="button primary" disabled={phase === mockInterviewPhases.length - 1} onClick={() => setPhase((value) => value + 1)}>Next phase</button></footer></main></div>;
}
