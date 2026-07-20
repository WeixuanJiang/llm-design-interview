import { ArrowRight, CheckCircle2, Cloud, RotateCcw, Search, SearchX, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { awsCustomerMissions, type AwsCustomerMission, type MissionArchetype } from "../data/awsCustomerMissions";
import type { AttemptState, MissionMode } from "../domain/types";
import { loadNotes, saveNotes } from "../domain/notes";
import { CaseStudyBuildLab } from "./CaseStudyBuildLab";
import { ConfirmDialog } from "./ConfirmDialog";
import "../missions.css";

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

const DEFAULT_INDUSTRY = "All industries";
const INDUSTRIES = [DEFAULT_INDUSTRY, ...new Set(awsCustomerMissions.map((mission) => mission.industry))];
const ARCHETYPE_LABELS: Record<MissionArchetype, string> = {
  agent: "Agent",
  document: "Document",
  "ml-platform": "ML platform",
  analytics: "Analytics",
  realtime: "Realtime",
};
const ARCHETYPES = Object.keys(ARCHETYPE_LABELS) as MissionArchetype[];
const DEFAULT_CASE_ID = awsCustomerMissions[0].id;
const SEARCH_DEBOUNCE_MS = 250;

interface MissionsHashState {
  caseId: string;
  stage: number;
  query: string;
  industry: string;
  archetypes: MissionArchetype[];
}

// Tolerant parse of `#missions?case=&stage=&q=&industry=&arch=`; unknown or
// out-of-range values are dropped so a hand-edited link still opens safely.
function parseMissionsHash(hash: string): Partial<MissionsHashState> | null {
  const raw = hash.replace(/^#/, "");
  const separator = raw.indexOf("?");
  const base = separator === -1 ? raw : raw.slice(0, separator);
  if (base !== "missions") return null;
  const params = new URLSearchParams(separator === -1 ? "" : raw.slice(separator + 1));
  const state: Partial<MissionsHashState> = {};
  const caseId = params.get("case");
  if (caseId && awsCustomerMissions.some((mission) => mission.id === caseId)) state.caseId = caseId;
  const stageParam = params.get("stage");
  if (stageParam !== null) {
    const value = Number.parseInt(stageParam, 10);
    if (Number.isInteger(value) && value >= 0 && value < stages.length) state.stage = value;
  }
  const query = params.get("q");
  if (query?.trim()) state.query = query.trim();
  const industry = params.get("industry");
  if (industry && INDUSTRIES.includes(industry)) state.industry = industry;
  const arch = params.get("arch");
  if (arch) {
    const list = [...new Set(arch.split(",").filter((item): item is MissionArchetype => ARCHETYPES.includes(item as MissionArchetype)))];
    if (list.length) state.archetypes = list;
  }
  return state;
}

// Only non-default values are written, so the bare route stays `#missions`.
function buildMissionsHash(state: MissionsHashState): string {
  const params = new URLSearchParams();
  if (state.caseId !== DEFAULT_CASE_ID) params.set("case", state.caseId);
  if (state.stage !== 0) params.set("stage", String(state.stage));
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.industry !== DEFAULT_INDUSTRY) params.set("industry", state.industry);
  if (state.archetypes.length) params.set("arch", state.archetypes.join(","));
  const queryString = params.toString();
  return queryString ? `#missions?${queryString}` : "#missions";
}

export function MissionCatalogue({ attempt, recovered, onModeChange, onOpen, onReset }: MissionCatalogueProps) {
  const [initialHash] = useState<Partial<MissionsHashState>>(() => parseMissionsHash(window.location.hash) ?? {});
  const [missionId, setMissionId] = useState(initialHash.caseId ?? DEFAULT_CASE_ID);
  const [stage, setStage] = useState(initialHash.stage ?? 0);
  const [searchText, setSearchText] = useState(initialHash.query ?? "");
  const [query, setQuery] = useState(initialHash.query ?? "");
  const [industry, setIndustry] = useState(initialHash.industry ?? DEFAULT_INDUSTRY);
  const [archetypes, setArchetypes] = useState<MissionArchetype[]>(initialHash.archetypes ?? []);
  const [touchedOnly, setTouchedOnly] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>(() => loadNotes());
  const [notesSaveStatus, setNotesSaveStatus] = useState<"saved" | "saving">("saved");
  const [confirmReset, setConfirmReset] = useState(false);

  // Debounce the search box before filtering and writing the URL.
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(searchText), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  // Persist catalogue state into the hash (replaceState: no history spam) so a
  // refresh or a shared link restores the same case, stage, and filters.
  useEffect(() => {
    const next = buildMissionsHash({ caseId: missionId, stage, query, industry, archetypes });
    if (window.location.hash !== next) window.history.replaceState(null, "", next);
  }, [missionId, stage, query, industry, archetypes]);

  // Back/forward navigation and hand-edited hashes restore catalogue state.
  useEffect(() => {
    const syncFromHash = () => {
      const parsed = parseMissionsHash(window.location.hash);
      if (!parsed) return;
      setMissionId(parsed.caseId ?? DEFAULT_CASE_ID);
      setStage(parsed.stage ?? 0);
      setSearchText(parsed.query ?? "");
      setQuery(parsed.query ?? "");
      setIndustry(parsed.industry ?? DEFAULT_INDUSTRY);
      setArchetypes(parsed.archetypes ?? []);
    };
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    setNotesSaveStatus("saving");
    const timer = window.setTimeout(() => {
      saveNotes(notes);
      setNotesSaveStatus("saved");
    }, 450);
    return () => window.clearTimeout(timer);
  }, [notes]);

  // A mission counts as touched when any stage (in any mode) holds a note.
  const touchedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [key, value] of Object.entries(notes)) {
      if (!value.trim()) continue;
      const match = key.match(/^(.*)-(beginner|interview|production)-\d+$/);
      if (match?.[1]) ids.add(match[1]);
    }
    return ids;
  }, [notes]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return awsCustomerMissions.filter((mission) => {
      if (industry !== DEFAULT_INDUSTRY && mission.industry !== industry) return false;
      if (archetypes.length && !archetypes.includes(mission.archetype)) return false;
      if (touchedOnly && !touchedIds.has(mission.id)) return false;
      if (search && !`${mission.customer} ${mission.title} ${mission.industry} ${mission.description}`.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [query, industry, archetypes, touchedOnly, touchedIds]);

  const selected = awsCustomerMissions.find((mission) => mission.id === missionId) ?? visible[0] ?? awsCustomerMissions[0];
  const selectedVisible = visible.some((mission) => mission.id === selected.id);
  const noteKey = `${selected.id}-${attempt.mode}-${stage}`;
  const hasActiveFilters = Boolean(query.trim()) || industry !== DEFAULT_INDUSTRY || archetypes.length > 0 || touchedOnly;

  const toggleArchetype = (archetype: MissionArchetype) => {
    setArchetypes((current) => (current.includes(archetype) ? current.filter((item) => item !== archetype) : [...current, archetype]));
  };
  const clearFilters = () => {
    setSearchText("");
    setQuery("");
    setIndustry(DEFAULT_INDUSTRY);
    setArchetypes([]);
    setTouchedOnly(false);
  };
  const openMission = (mission: AwsCustomerMission) => {
    setMissionId(mission.id);
    setStage(0);
  };

  const brief = (
    <section className="mission-brief card transition-fade" aria-label="Mission brief">
      <header className="mission-brief-header">
        <span className="eyebrow-label mission-brief-eyebrow">Customer case · {ARCHETYPE_LABELS[selected.archetype]}</span>
        <h2>{selected.title}</h2>
        <p>Design the complete production system for {selected.customer}’s implementation.</p>
      </header>

      <nav className="mission-stage-nav" aria-label="Mission stages">{stages.map((item, index) => <button key={item} className={index === stage ? "active" : notes[`${selected.id}-${attempt.mode}-${index}`]?.trim() ? "done" : ""} onClick={() => setStage(index)} aria-current={index === stage ? "step" : undefined}><span>{notes[`${selected.id}-${attempt.mode}-${index}`]?.trim() ? <CheckCircle2 /> : index + 1}</span>{item}</button>)}</nav>

      <div className="mission-brief-stage">
        {stage === 0 ? <UseCase mission={selected} /> : null}
        {stage === 1 ? <Requirements mission={selected} /> : null}
        {stage === 2 ? <CaseStudyBuildLab key={`${selected.id}-${attempt.mode}`} mission={selected} mode={attempt.mode} /> : null}
        {stage === 3 ? <DossierSection title="Stress event" intro={selected.stressEvent} groups={[{ title: "Failure risks", items: selected.risks }, { title: "Evidence to monitor", items: selected.metrics }]} /> : null}
        {stage === 4 ? <DossierSection title="Design review" intro="Defend the architecture using requirements and evidence. Identify the largest unresolved risk, rejected alternatives, launch gates, rollback triggers, and the next experiment." groups={[{ title: "Review measures", items: selected.metrics }, { title: "Required evidence", items: ["A traceable requirement-to-component map", "Capacity arithmetic and unit-cost estimate", "Offline and online evaluation plan", "Failure containment and rollback runbook", "Ownership and post-launch review cadence"] }]} /> : null}
      </div>

      {stage !== 2 ? <section className="mission-notes"><label>Design notes<textarea value={notes[noteKey] ?? ""} onChange={(event) => setNotes((value) => ({ ...value, [noteKey]: event.target.value }))} placeholder={notePrompt(attempt.mode, stage)} /></label><span className={`mission-save ${notesSaveStatus}`}><Cloud /> {notesSaveStatus === "saving" ? "Saving" : "Saved"}</span></section> : null}

      <footer className="mission-brief-footer">
        <button className="button ghost" disabled={stage === 0} onClick={() => setStage((value) => value - 1)}>Previous</button>
        <span className="mission-brief-progress">Stage <span className="num">{stage + 1}</span> of <span className="num">{stages.length}</span></span>
        <button className="button primary" disabled={stage === stages.length - 1} onClick={() => setStage((value) => value + 1)}>Next stage <ArrowRight /></button>
      </footer>

      {recovered ? <div className="mission-resume"><span>Your versioned Enterprise RAG workspace is still available.</span><div><button className="button text" onClick={() => setConfirmReset(true)}>Start over</button><button className="button ghost" onClick={onOpen}>Resume workspace</button></div></div> : null}
    </section>
  );

  return (
    <div className="mission-page page-content">
      <header className="page-header">
        <div><h1>Missions</h1><p>{awsCustomerMissions.length} agent and LLM customer system-design cases.</p></div>
        <div className="page-header-actions">{recovered ? <button className="button ghost" onClick={onOpen}><RotateCcw /> Resume Enterprise RAG</button> : <button className="button primary" onClick={onOpen}>Open Enterprise RAG <ArrowRight /></button>}</div>
      </header>

      <section className="mission-modes" aria-label="Learning mode">{modes.map((mode) => <button key={mode.id} className={attempt.mode === mode.id ? "mission-mode selected" : "mission-mode"} onClick={() => onModeChange(mode.id)} aria-pressed={attempt.mode === mode.id}><strong>{mode.label}</strong><span>{mode.description}</span></button>)}</section>

      <section className="mission-filters card" aria-label="Filter customer missions">
        <div className="mission-filters-main">
          <div className="mission-field mission-field--search">
            <label className="eyebrow-label" htmlFor="mission-search">Search cases</label>
            <div className="mission-search-box">
              <Search />
              <input id="mission-search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Customer, workflow, industry, or description" />
              {searchText ? <button className="icon-button mission-search-clear" onClick={() => { setSearchText(""); setQuery(""); }} aria-label="Clear search"><X /></button> : null}
            </div>
          </div>
          <div className="mission-field">
            <label className="eyebrow-label" htmlFor="mission-industry">Industry</label>
            <select id="mission-industry" value={industry} onChange={(event) => setIndustry(event.target.value)}>{INDUSTRIES.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <label className="mission-toggle">
            <input type="checkbox" role="switch" checked={touchedOnly} onChange={(event) => setTouchedOnly(event.target.checked)} />
            <span className="mission-toggle-track" aria-hidden="true"><span className="mission-toggle-thumb" /></span>
            <span className="mission-toggle-label">Has notes</span>
          </label>
        </div>
        <div className="mission-filters-secondary">
          <div className="mission-archetypes" role="group" aria-label="Archetype">
            <span className="eyebrow-label">Archetype</span>
            <div className="mission-chips">{ARCHETYPES.map((item) => <button key={item} className={archetypes.includes(item) ? "mission-chip active" : "mission-chip"} aria-pressed={archetypes.includes(item)} onClick={() => toggleArchetype(item)}>{ARCHETYPE_LABELS[item]}</button>)}</div>
          </div>
          <p className="mission-count"><span><span className="num">{visible.length}</span> of {awsCustomerMissions.length} cases</span>{hasActiveFilters ? <button className="button text" onClick={clearFilters}>Clear filters</button> : null}</p>
        </div>
      </section>

      <div className="mission-grid">
        {visible.length ? visible.map((mission) => {
          const isSelected = mission.id === selected.id;
          return (
            <Fragment key={mission.id}>
              <button className={isSelected ? "mission-card card selected" : "mission-card card"} onClick={() => openMission(mission)} aria-current={isSelected ? "page" : undefined} aria-expanded={isSelected}>
                <span className="mission-card-top">
                  <span className="eyebrow-label mission-card-customer">{mission.customer}</span>
                  {touchedIds.has(mission.id) ? <span className="mission-badge"><CheckCircle2 /> In progress</span> : null}
                </span>
                <span className="mission-card-title"><Highlighted text={mission.title} query={query} /></span>
                <span className="mission-card-snippet"><Highlighted text={descriptionSnippet(mission, query)} query={query} /></span>
                <span className="mission-card-meta">
                  <span className="mission-tag">{mission.industry}</span>
                  <span className="mission-tag mission-tag--archetype">{ARCHETYPE_LABELS[mission.archetype]}</span>
                </span>
              </button>
              {isSelected ? brief : null}
            </Fragment>
          );
        }) : (
          <div className="empty-state mission-empty">
            <span className="empty-state-icon"><SearchX /></span>
            <h2 className="empty-state-title">No cases match these filters</h2>
            <p className="empty-state-body">Try a different search term, or clear the industry, archetype, and notes filters to browse the full library.</p>
            <div className="empty-state-actions"><button className="button ghost" onClick={clearFilters}>Clear filters</button></div>
          </div>
        )}
        {!selectedVisible ? brief : null}
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Start over?"
        body="This clears your saved Enterprise RAG workspace progress. This can't be undone."
        confirmLabel="Start over"
        tone="danger"
        onConfirm={() => { setConfirmReset(false); onReset(); }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

// Surround every occurrence of the search term with <mark> for result scanning.
function Highlighted({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLowerCase();
  if (!needle) return <>{text}</>;
  const nodes: ReactNode[] = [];
  const lower = text.toLowerCase();
  let index = 0;
  let key = 0;
  while (index < text.length) {
    const found = lower.indexOf(needle, index);
    if (found === -1) { nodes.push(text.slice(index)); break; }
    if (found > index) nodes.push(text.slice(index, found));
    nodes.push(<mark key={key}>{text.slice(found, found + needle.length)}</mark>);
    key += 1;
    index = found + needle.length;
  }
  return <>{nodes}</>;
}

// Default excerpt, or a window around the first match when searching.
function descriptionSnippet(mission: AwsCustomerMission, query: string): string {
  const text = mission.description.replace(/\s+/g, " ").trim();
  const needle = query.trim().toLowerCase();
  const at = needle ? text.toLowerCase().indexOf(needle) : -1;
  if (at === -1) return text.length > 160 ? `${text.slice(0, 160)}…` : text;
  const start = Math.max(0, at - 60);
  const end = Math.min(text.length, at + needle.length + 100);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

function UseCase({ mission }: { mission: AwsCustomerMission }) {
  return <article className="mission-dossier" aria-labelledby="use-case-details"><h3 id="use-case-details">Use case details</h3>{mission.description.split("\n\n").map((paragraph) => <p key={paragraph.slice(0, 48)}>{paragraph}</p>)}<section><h3>Actors and owners</h3><ul>{mission.actors.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h3>Functional requirements</h3><ul>{mission.functionalRequirements.map((item) => <li key={item}>{item}</li>)}</ul></section></article>;
}

function Requirements({ mission }: { mission: AwsCustomerMission }) {
  return <DossierSection title="Requirements and system boundaries" intro="Use the supplied workload baseline for capacity, cost, latency, retention, and recovery decisions. Record and defend any assumption you change before selecting the final architecture." groups={[{ title: "Functional requirements", items: mission.functionalRequirements }, { title: "Non-functional requirements", items: mission.nonFunctionalRequirements }, { title: "Scale assumptions", items: mission.scaleAssumptions }, { title: "End-to-end data and model flow", items: mission.dataFlow }]} />;
}

function DossierSection({ title, intro, groups }: { title: string; intro: string; groups: Array<{ title: string; items: string[] }> }) {
  return <section className="mission-dossier-section"><h3>{title}</h3><p>{intro}</p>{groups.map((group) => <section key={group.title}><h4>{group.title}</h4><ol>{group.items.map((item) => <li key={item}>{item}</li>)}</ol></section>)}</section>;
}

function notePrompt(mode: MissionMode, stage: number) {
  const prompts = {
    beginner: ["Restate the user, desired outcome, and primary risk...", "Record assumptions and map each requirement to evidence...", "", "Describe detection, containment, degraded service, and recovery...", "Summarize the design, trade-offs, launch gates, and revision..."],
    interview: ["Ask only clarifying questions that materially change the design...", "State capacity and SLO assumptions with rough arithmetic...", "", "Respond to the incident without abandoning the original requirements...", "Prepare a two-minute architecture defence..."],
    production: ["Define active impact, incident scope, and evidence to collect...", "Reconcile business goals, policy, SLOs, and missing evidence...", "", "Specify containment, ownership, communication, and recovery checks...", "Write the design-review decision and follow-up work..."],
  };
  return prompts[mode][stage];
}
