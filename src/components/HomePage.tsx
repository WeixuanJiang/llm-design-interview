import { ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, GraduationCap, Target } from "lucide-react";
import { catalogMissions } from "../data/pdfCatalog";
import { studyPlan } from "../data/specialActivities";
import type { AppSection } from "./AppShell";

interface HomePageProps {
  completedModules: number;
  reviewed: number;
  missionProgress: number;
  onNavigate: (section: AppSection) => void;
}

const pathways: Array<{ title: string; description: string; section: AppSection; icon: typeof BookOpen }> = [
  { title: "Foundations", description: "Build knowledge across the 23-module AI engineering curriculum.", section: "learn", icon: BookOpen },
  { title: "Interview prep", description: "Use the full question bank, failure lab, and 45-minute mock.", section: "practice", icon: GraduationCap },
  { title: "Production incidents", description: "Design, stress, and revise systems under operational constraints.", section: "missions", icon: Target },
];

export function HomePage({ completedModules, reviewed, missionProgress, onNavigate }: HomePageProps) {
  const featured = catalogMissions.filter((mission) => [31, 32, 33, 41].includes(mission.chapter));
  const nextSection: AppSection = completedModules ? "learn" : missionProgress ? "missions" : reviewed ? "practice" : "learn";
  return <div className="product-page page-content home-page">
    <header className="home-header"><div><span>Continue learning</span><h1>{completedModules ? "Resume your next course module" : "Start with retrieval foundations"}</h1><p>Build the knowledge first, then reinforce it through decisions, incidents, and design missions.</p></div><button className="button primary" onClick={() => onNavigate(nextSection)}>Continue <ArrowRight /></button></header>

    <section className="home-pathways" aria-labelledby="pathways-title"><header><h2 id="pathways-title">Choose a pathway</h2></header><div>{pathways.map(({ title, description, section, icon: Icon }) => <button key={title} onClick={() => onNavigate(section)}><Icon /><span><strong>{title}</strong><small>{description}</small></span><ArrowRight /></button>)}</div></section>

    <div className="home-dashboard-grid"><section className="featured-missions"><header><h2>Featured missions</h2><button className="button text" onClick={() => onNavigate("missions")}>View all</button></header>{featured.map((mission) => <button key={mission.chapter} onClick={() => onNavigate("missions")}><span>Chapter {mission.chapter}</span><strong>{mission.title}</strong><small>{mission.scenario}</small></button>)}</section><aside className="skill-snapshot"><header><ChartNoAxesColumnIncreasing /><h2>Skill snapshot</h2></header><dl><div><dt>Course modules</dt><dd>{completedModules}/23</dd></div><div><dt>Practice evidence</dt><dd>{reviewed}</dd></div><div><dt>Mission stages</dt><dd>{missionProgress}/5</dd></div></dl><button className="button ghost" onClick={() => onNavigate("progress")}>Open Progress <ArrowRight /></button></aside></div>

    <section className="home-study-plan"><header><h2>Four-week plan</h2><button className="button text" onClick={() => onNavigate("progress")}>View plan</button></header><div>{studyPlan.map((week) => <article key={week.week}><span>Week {week.week}</span><strong>{week.title}</strong><small>{week.chapters}</small></article>)}</div></section>
  </div>;
}
