import { useState } from "react";
import type { CatalogPracticeUnit } from "../data/pdfCatalog";
// The drill styles live in path.css but the player also renders on the Training
// page (Review missed); importing here keeps it styled wherever it mounts.
import "../path.css";

interface DrillPlayerProps {
  unit: CatalogPracticeUnit;
  onResult: (correct: boolean) => void;
}

// Reusable single-question drill. Options render in catalog order and grading
// reads each option's own `correct` flag — the answer never has a fixed
// position. `onResult` fires exactly once per submit; "Next drill" resets the
// player so the same unit can be attempted again. Callers should key the
// player by `unit.id` so switching units starts from a clean state.
export function DrillPlayer({ unit, onResult }: DrillPlayerProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    onResult(unit.options[selected]?.correct ?? false);
  };

  const nextDrill = () => {
    setSelected(null);
    setSubmitted(false);
  };

  const selectedOption = selected === null ? undefined : unit.options[selected];

  return (
    <div className="drill-player" aria-label={`Drill ${unit.id}: ${unit.title}`}>
      <span className="eyebrow-label">{unit.chapterTitle} · pp. {unit.pages}</span>
      <p className="drill-question">{unit.question}</p>
      <div className="drill-options" role="group" aria-label="Drill options">
        {unit.options.map((option, index) => {
          const stateClass = submitted
            ? option.correct
              ? "drill-option--correct"
              : selected === index
                ? "drill-option--incorrect"
                : null
            : selected === index
              ? "drill-option--selected"
              : null;
          return (
            <button
              key={index}
              type="button"
              disabled={submitted}
              className={stateClass ? `drill-option ${stateClass}` : "drill-option"}
              onClick={() => setSelected(index)}
              aria-pressed={selected === index}
            >
              <span className="drill-option-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <span className="drill-option-text">{option.text}</span>
            </button>
          );
        })}
      </div>
      {submitted && selectedOption ? (
        <div role="status" className={selectedOption.correct ? "inline-feedback success" : "inline-feedback warning"}>
          {selectedOption.feedback}
        </div>
      ) : null}
      <div className="drill-actions">
        {submitted ? (
          <button type="button" className="button secondary" onClick={nextDrill}>Next drill</button>
        ) : (
          <button type="button" className="button primary" disabled={selected === null} onClick={submit}>Submit answer</button>
        )}
      </div>
    </div>
  );
}
