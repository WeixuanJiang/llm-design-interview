import { ArrowRight, CheckCircle2, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { awsCustomerMissions, type AwsCustomerMission } from "../data/awsCustomerMissions";
import type { AttemptState, MissionMode } from "../domain/types";
import { CaseStudyBuildLab } from "./CaseStudyBuildLab";

interface MissionCatalogueProps {
  attempt: AttemptState;
  recovered: boolean;
  onModeChange: (mode: MissionMode) => void;
  onOpen: () => void;
  onReset: () => void;
}

const modes: Array<{ id: MissionMode; label: string; description: string }> = [
  { id: "beginner", label: "Beginner", description: "Guided decisions and immediate support" },
  { id: "interview", label: "Interview", description: "Light scaffolding and timed defence" },
  { id: "production", label: "Production", description: "Evidence-led incident constraints" },
];
const stages = ["Use case", "Requirements", "Build lab", "Stress event", "Review"];

export function MissionCatalogue({ attempt, recovered, onModeChange, onOpen, onReset }: MissionCatalogueProps) {
  const [missionId, setMissionId] = useState(awsCustomerMissions[0].id);
  const [stage, setStage] = useState(0);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All industries");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const industries = useMemo(() => ["All industries", ...new Set(awsCustomerMissions.map((mission) => mission.industry))], []);
  const visible = useMemo(() => awsCustomerMissions.filter((mission) => {
    const matchesIndustry = industry === "All industries" || mission.industry === industry;
    const search = query.trim().toLowerCase();
    return matchesIndustry && (!search || `${mission.customer} ${mission.title} ${mission.industry}`.toLowerCase().includes(search));
  }), [industry, query]);
  const selected = awsCustomerMissions.find((mission) => mission.id === missionId) ?? visible[0] ?? awsCustomerMissions[0];
  const noteKey = `${selected.id}-${attempt.mode}-${stage}`;

  const openMission = (mission: AwsCustomerMission) => {
    setMissionId(mission.id);
    setStage(0);
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="catalogue page-content mission-catalogue-page">
      <header className="mission-library-header"><div><h1>Missions</h1><p>{awsCustomerMissions.length} agent and LLM customer system-design cases.</p></div>{recovered ? <button className="button ghost" onClick={onOpen}><RotateCcw /> Resume Enterprise RAG</button> : <button className="button primary" onClick={onOpen}>Open Enterprise RAG <ArrowRight /></button>}</header>

      <section className="mode-selector" aria-label="Learning mode">{modes.map((mode) => <button key={mode.id} className={attempt.mode === mode.id ? "mode-option selected" : "mode-option"} onClick={() => onModeChange(mode.id)} aria-pressed={attempt.mode === mode.id}><strong>{mode.label}</strong><span>{mode.description}</span></button>)}</section>

      <section className="mission-filters" aria-label="Filter customer missions">
        <label><span>Search customer cases</span><div><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Customer, workflow, or industry" /></div></label>
        <label><span>Industry</span><select value={industry} onChange={(event) => setIndustry(event.target.value)}>{industries.map((item) => <option key={item}>{item}</option>)}</select></label>
        <p>{visible.length} cases</p>
      </section>

      <div className="mission-library-layout">
        <aside className="mission-library-list" aria-label="Customer mission library">{visible.length ? visible.map((mission) => <button key={mission.id} className={mission.id === selected.id ? "active" : ""} onClick={() => openMission(mission)} aria-current={mission.id === selected.id ? "page" : undefined}><span>Case {String(awsCustomerMissions.indexOf(mission) + 1).padStart(3, "0")} · {mission.industry}</span>{mission.customer}<small>{mission.title}</small></button>) : <p className="mission-empty">No customer cases match these filters.</p>}</aside>
        <main className="mission-brief" aria-label="Mission brief">
          <header><span>Customer case · {selected.archetype}</span><h2>{selected.title}</h2><p>Design the complete production system for {selected.customer}’s implementation.</p></header>

          <nav className="mission-stage-nav" aria-label="Mission stages">{stages.map((item, index) => <button key={item} className={index === stage ? "active" : notes[`${selected.id}-${attempt.mode}-${index}`]?.trim() ? "done" : ""} onClick={() => setStage(index)}><span>{notes[`${selected.id}-${attempt.mode}-${index}`]?.trim() ? <CheckCircle2 /> : index + 1}</span>{item}</button>)}</nav>

          {stage === 0 ? <UseCase mission={selected} /> : null}
          {stage === 1 ? <Requirements mission={selected} /> : null}
          {stage === 2 ? <CaseStudyBuildLab key={`${selected.id}-${attempt.mode}`} mission={selected} mode={attempt.mode} /> : null}
          {stage === 3 ? <DossierSection title="Stress event" intro={selected.stressEvent} groups={[{ title: "Failure risks", items: selected.risks }, { title: "Evidence to monitor", items: selected.metrics }]} /> : null}
          {stage === 4 ? <DossierSection title="Design review" intro="Defend the architecture using requirements and evidence. Identify the largest unresolved risk, rejected alternatives, launch gates, rollback triggers, and the next experiment." groups={[{ title: "Review measures", items: selected.metrics }, { title: "Required evidence", items: ["A traceable requirement-to-component map", "Capacity arithmetic and unit-cost estimate", "Offline and online evaluation plan", "Failure containment and rollback runbook", "Ownership and post-launch review cadence"] }]} /> : null}

          {stage !== 2 ? <section className="mission-notes"><label>Design notes<textarea value={notes[noteKey] ?? ""} onChange={(event) => setNotes((value) => ({ ...value, [noteKey]: event.target.value }))} placeholder={notePrompt(attempt.mode, stage)} /></label><footer><button className="button ghost" disabled={stage === 0} onClick={() => setStage((value) => value - 1)}>Previous</button><button className="button primary" disabled={stage === stages.length - 1} onClick={() => setStage((value) => value + 1)}>Next stage <ArrowRight /></button></footer></section> : null}

          {recovered ? <div className="enterprise-workspace-link"><span>Your versioned Enterprise RAG workspace is still available.</span><div><button className="button text" onClick={onReset}>Start over</button><button className="button ghost" onClick={onOpen}>Resume workspace</button></div></div> : null}
        </main>
      </div>
    </div>
  );
}

function UseCase({ mission }: { mission: AwsCustomerMission }) {
  return <article className="case-dossier" aria-labelledby="use-case-details"><h3 id="use-case-details">Use case details</h3>{mission.description.split("\n\n").map((paragraph) => <p key={paragraph.slice(0, 48)}>{paragraph}</p>)}<section><h3>Actors and owners</h3><ul>{mission.actors.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h3>Functional requirements</h3><ul>{mission.functionalRequirements.map((item) => <li key={item}>{item}</li>)}</ul></section></article>;
}

function Requirements({ mission }: { mission: AwsCustomerMission }) {
  return <DossierSection title="Requirements and system boundaries" intro="Use the supplied workload baseline for capacity, cost, latency, retention, and recovery decisions. Record and defend any assumption you change before selecting the final architecture." groups={[{ title: "Functional requirements", items: mission.functionalRequirements }, { title: "Non-functional requirements", items: mission.nonFunctionalRequirements }, { title: "Scale assumptions", items: mission.scaleAssumptions }, { title: "End-to-end data and model flow", items: mission.dataFlow }]} />;
}

function DossierSection({ title, intro, groups }: { title: string; intro: string; groups: Array<{ title: string; items: string[] }> }) {
  return <section className="dossier-section"><h3>{title}</h3><p>{intro}</p>{groups.map((group) => <section key={group.title}><h4>{group.title}</h4><ol>{group.items.map((item) => <li key={item}>{item}</li>)}</ol></section>)}</section>;
}

function notePrompt(mode: MissionMode, stage: number) {
  const prompts = {
    beginner: ["Restate the user, desired outcome, and primary risk...", "Record assumptions and map each requirement to evidence...", "", "Describe detection, containment, degraded service, and recovery...", "Summarize the design, trade-offs, launch gates, and revision..."],
    interview: ["Ask only clarifying questions that materially change the design...", "State capacity and SLO assumptions with rough arithmetic...", "", "Respond to the incident without abandoning the original requirements...", "Prepare a two-minute architecture defence..."],
    production: ["Define active impact, incident scope, and evidence to collect...", "Reconcile business goals, policy, SLOs, and missing evidence...", "", "Specify containment, ownership, communication, and recovery checks...", "Write the design-review decision and follow-up work..."],
  };
  return prompts[mode][stage];
}
