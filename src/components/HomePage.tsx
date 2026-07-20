import { ArrowRight, BookOpen, Compass, Gauge, GraduationCap, Layers, RotateCcw, Rocket, Target, type LucideIcon } from "lucide-react";
import { awsCustomerMissions, type AwsCustomerMission } from "../data/awsCustomerMissions";
import { learningModules } from "../data/learningContent";
import { CURRICULUM_TOTALS, MISSION_STAGE_TOTAL, type NextAction, type NextActionKind } from "../domain/nextAction";
import type { AppSection } from "./AppShell";
import "../home.css";

export interface HomePageStats {
  modulesDone: number;
  modulesTotal: number;
  lessonsDone: number;
  lessonsTotal: number;
  reviewed: number;
  /** Drill accuracy as a 0-100 percentage. */
  accuracy: number;
  missionStages: number;
}

export interface HomePageProps {
  action: NextAction;
  stats: HomePageStats;
  onAction: (action: NextAction) => void;
  onNavigate: (section: AppSection) => void;
}

const PATH_SECTION: AppSection = "path";

const ACTION_KIND_META: Record<Exclude<NextActionKind, "start">, { eyebrow: string; icon: LucideIcon }> = {
  lesson: { eyebrow: "Up next", icon: BookOpen },
  drill: { eyebrow: "Recommended practice", icon: GraduationCap },
  mission: { eyebrow: "Mission in progress", icon: Target },
  review: { eyebrow: "Stay sharp", icon: RotateCcw },
};

const HERO_STEPS: Array<{ label: string; detail: string }> = [
  { label: "Learn", detail: "Work through production AI design modules with sourced lessons." },
  { label: "Drill", detail: "Answer interview-style questions and repair weak skills." },
  { label: "Build", detail: "Design real customer systems in guided missions." },
];

interface PathStage {
  name: string;
  focus: string;
  icon: LucideIcon;
  moduleCount: number;
}

const PATH_STAGES: PathStage[] = [
  { name: "Foundations", focus: "Retrieval, chunking, indexes, and adaptation choices", icon: Layers, moduleCount: 0 },
  { name: "Quality", focus: "Evaluation, grounding, hallucination control, and observability", icon: Gauge, moduleCount: 0 },
  { name: "Scale", focus: "Capacity, inference optimization, serving, and cost", icon: Rocket, moduleCount: 0 },
  { name: "Synthesis", focus: "Agents, platforms, safety, and end-to-end design", icon: Compass, moduleCount: 0 },
].map((stage, index) => {
  // Split the 23-module curriculum into four ordered stages: 6 / 6 / 6 / 5.
  const start = index * 6;
  const end = index === 3 ? learningModules.length : start + 6;
  return { ...stage, moduleCount: Math.max(0, end - start) };
});

/** Pick three featured customer missions with distinct archetypes; the window
 *  rotates with learner progress so the selection evolves as evidence grows. */
function pickFeaturedMissions(stats: HomePageStats): AwsCustomerMission[] {
  const offset = (stats.lessonsDone + stats.reviewed + stats.missionStages * 3) % awsCustomerMissions.length;
  const picked: AwsCustomerMission[] = [];
  const archetypes = new Set<string>();
  for (let i = 0; i < awsCustomerMissions.length && picked.length < 3; i += 1) {
    const mission = awsCustomerMissions[(offset + i) % awsCustomerMissions.length];
    if (archetypes.has(mission.archetype)) continue;
    archetypes.add(mission.archetype);
    picked.push(mission);
  }
  for (let i = 0; picked.length < 3 && i < awsCustomerMissions.length; i += 1) {
    const mission = awsCustomerMissions[(offset + i) % awsCustomerMissions.length];
    if (!picked.includes(mission)) picked.push(mission);
  }
  return picked;
}

function Hero({ action, onAction }: { action: NextAction; onAction: (action: NextAction) => void }) {
  const facts = [
    { value: CURRICULUM_TOTALS.modules, label: "modules" },
    { value: CURRICULUM_TOTALS.drills, label: "drills" },
    { value: awsCustomerMissions.length, label: "customer cases" },
  ];
  return (
    <section className="home-hero blueprint-grid" aria-labelledby="home-hero-title">
      <span className="eyebrow-label">AI System Design Gym</span>
      <h1 id="home-hero-title">Train AI system design like a skill, not a quiz.</h1>
      <p className="home-hero-loop" aria-label="Learning loop">
        Learn <span aria-hidden="true">→</span> Drill <span aria-hidden="true">→</span> Build <span aria-hidden="true">→</span> Review
      </p>
      <div className="home-hero-facts">
        {facts.map((fact) => (
          <span key={fact.label} className="home-hero-fact">
            <strong className="num">{fact.value}</strong> {fact.label}
          </span>
        ))}
      </div>
      <ol className="home-hero-steps">
        {HERO_STEPS.map((step, index) => (
          <li key={step.label}>
            <span className="num home-step-index">{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
          </li>
        ))}
      </ol>
      <div className="home-hero-actions">
        <button type="button" className="button primary home-cta" onClick={() => onAction(action)}>
          {action.ctaLabel} <ArrowRight />
        </button>
      </div>
    </section>
  );
}

function NextActionCard({ action, onAction }: { action: NextAction; onAction: (action: NextAction) => void }) {
  const meta = ACTION_KIND_META[action.kind as Exclude<NextActionKind, "start">] ?? ACTION_KIND_META.lesson;
  const Icon = meta.icon;
  return (
    <section className="card home-action-card" aria-labelledby="home-action-title">
      <div className="home-action-icon" aria-hidden="true"><Icon /></div>
      <div className="home-action-body">
        <span className="eyebrow-label">{meta.eyebrow}</span>
        <h1 id="home-action-title">{action.title}</h1>
        <p>{action.description}</p>
      </div>
      <button type="button" className="button primary home-cta" onClick={() => onAction(action)}>
        {action.ctaLabel} <ArrowRight />
      </button>
    </section>
  );
}

function Snapshot({ stats }: { stats: HomePageStats }) {
  const tiles = [
    { label: "Modules", value: stats.modulesDone, suffix: `/ ${stats.modulesTotal}` },
    { label: "Lessons", value: stats.lessonsDone, suffix: `/ ${stats.lessonsTotal}` },
    { label: "Drills reviewed", value: stats.reviewed, suffix: null },
    { label: "Accuracy", value: Math.round(stats.accuracy), suffix: "%" },
    { label: "Mission stages", value: stats.missionStages, suffix: `/ ${MISSION_STAGE_TOTAL}` },
  ];
  return (
    <section className="home-snapshot" aria-labelledby="home-snapshot-title">
      <header className="home-section-header">
        <h2 id="home-snapshot-title">This week&rsquo;s snapshot</h2>
      </header>
      <div className="home-snapshot-grid">
        {tiles.map((tile) => (
          <div key={tile.label} className="card home-tile">
            <span className="home-tile-value">
              <span className="num">{tile.value}</span>
              {tile.suffix ? <small className="num">{tile.suffix}</small> : null}
            </span>
            <span className="home-tile-label">{tile.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PathPreview({ onNavigate }: { onNavigate: (section: AppSection) => void }) {
  return (
    <section className="home-path-preview" aria-labelledby="home-path-title">
      <header className="home-section-header">
        <h2 id="home-path-title">Your learning path</h2>
        <button type="button" className="button text" onClick={() => onNavigate(PATH_SECTION)}>
          Open path <ArrowRight />
        </button>
      </header>
      <div className="home-stage-grid">
        {PATH_STAGES.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <button key={stage.name} type="button" className="card home-stage-card" onClick={() => onNavigate(PATH_SECTION)}>
              <span className="home-stage-top">
                <span className="home-stage-icon" aria-hidden="true"><Icon /></span>
                <span className="num home-stage-count">{index + 1} / {PATH_STAGES.length}</span>
              </span>
              <strong>{stage.name}</strong>
              <small>{stage.focus}</small>
              <span className="home-stage-modules">{stage.moduleCount} modules</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedMissions({ stats, onNavigate }: { stats: HomePageStats; onNavigate: (section: AppSection) => void }) {
  const featured = pickFeaturedMissions(stats);
  return (
    <section className="home-featured" aria-labelledby="home-featured-title">
      <header className="home-section-header">
        <h2 id="home-featured-title">Featured missions</h2>
        <button type="button" className="button text" onClick={() => onNavigate("missions")}>
          View all <ArrowRight />
        </button>
      </header>
      <div className="home-mission-grid">
        {featured.map((mission) => (
          <button key={mission.id} type="button" className="card home-mission-card" onClick={() => onNavigate("missions")}>
            <span className="home-mission-meta">
              <span className="eyebrow-label">{mission.customer}</span>
              <span className="home-mission-archetype">{mission.archetype}</span>
            </span>
            <strong>{mission.title}</strong>
            <small>{mission.industry}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

export function HomePage({ action, stats, onAction, onNavigate }: HomePageProps) {
  const firstVisit = action.kind === "start";
  return (
    <div className="product-page page-content home-page transition-fade">
      {firstVisit ? <Hero action={action} onAction={onAction} /> : <NextActionCard action={action} onAction={onAction} />}
      {!firstVisit ? <Snapshot stats={stats} /> : null}
      <PathPreview onNavigate={onNavigate} />
      <FeaturedMissions stats={stats} onNavigate={onNavigate} />
    </div>
  );
}
