import { Boxes, ChartNoAxesColumnIncreasing, GraduationCap, House, Laptop, Moon, Rocket, Route, Sun, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import "../shell.css";

export type AppSection = "home" | "path" | "missions" | "practice" | "progress";

export interface MissionSummary {
  saved: boolean;
  completedStages: number;
  totalStages: number;
}

interface AppShellProps {
  children: ReactNode;
  context: string;
  section: AppSection;
  onNavigate: (section: AppSection | "workspace") => void;
  mission: MissionSummary;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

interface NavItem {
  id: AppSection;
  label: string;
  icon: LucideIcon;
}

const navigation: Array<{ group: string | null; items: NavItem[] }> = [
  { group: null, items: [{ id: "home", label: "Home", icon: House }] },
  {
    group: "Learn",
    items: [
      { id: "path", label: "Path", icon: Route },
      { id: "practice", label: "Training", icon: GraduationCap },
    ],
  },
  {
    group: "Apply",
    items: [
      { id: "missions", label: "Missions", icon: Target },
      { id: "progress", label: "Progress", icon: ChartNoAxesColumnIncreasing },
    ],
  },
];

const mobileNavigation: NavItem[] = navigation.flatMap((group) => group.items);

export function AppShell({ children, context, section, onNavigate, mission, theme, onToggleTheme }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><Boxes /></span>
          <span><strong>AI System Design Gym</strong><small>Active engineering practice</small></span>
        </div>
        <nav className="primary-nav">
          {navigation.map(({ group, items }) => (
            <div className="nav-group" key={group ?? "ungrouped"}>
              {group ? <span className="eyebrow-label">{group}</span> : null}
              {items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={section === id ? "nav-item active" : "nav-item"}
                  onClick={() => onNavigate(id)}
                  aria-current={section === id ? "page" : undefined}
                  aria-label={label}
                  title={label}
                >
                  <Icon aria-hidden="true" /><span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        {mission.saved ? (
          <button
            type="button"
            className="continue-mission"
            onClick={() => onNavigate("workspace")}
            aria-label={`Continue Enterprise RAG mission, stage ${mission.completedStages} of ${mission.totalStages}`}
            title={`Continue Enterprise RAG mission — stage ${mission.completedStages} of ${mission.totalStages}`}
          >
            <Rocket aria-hidden="true" />
            <span className="continue-mission-text">
              <span className="eyebrow-label">Continue mission</span>
              <strong>Enterprise RAG mission</strong>
              <small><span className="continue-mission-progress">{mission.completedStages}/{mission.totalStages}</span> stages complete</small>
            </span>
          </button>
        ) : null}
        <div className="profile">
          <span className="avatar"><Laptop aria-hidden="true" /></span>
          <span><strong>Local session</strong><small>Saved only on this device</small></span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <a className="skip-link" href="#main-content">Skip to content</a>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <span className="breadcrumb-root">
              <span className="breadcrumb-full">AI System Design Gym</span>
              <span className="breadcrumb-short">AI Gym</span>
            </span>
            <span className="breadcrumb-separator" aria-hidden="true">/</span>
            <strong className="breadcrumb-current">{context}</strong>
          </nav>
          <button
            type="button"
            className="icon-button"
            onClick={onToggleTheme}
            aria-label="Dark mode"
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>
        </header>
        <main className="main-content" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNavigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-label={`Open ${label}`}
            className={section === id ? "active" : ""}
            onClick={() => onNavigate(id)}
            aria-current={section === id ? "page" : undefined}
          >
            <Icon aria-hidden="true" /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
