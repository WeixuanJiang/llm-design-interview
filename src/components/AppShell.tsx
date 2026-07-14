import { BookOpen, Boxes, ChartNoAxesColumnIncreasing, GraduationCap, House, Target } from "lucide-react";
import type { ReactNode } from "react";

export type AppSection = "home" | "learn" | "missions" | "practice" | "progress";

interface AppShellProps {
  children: ReactNode;
  context: string;
  section: AppSection;
  onNavigate: (section: AppSection) => void;
}

const navigation = [
  { id: "home" as const, label: "Home", icon: House },
  { id: "learn" as const, label: "Learn", icon: BookOpen },
  { id: "missions" as const, label: "Missions", icon: Target },
  { id: "practice" as const, label: "Practice", icon: GraduationCap },
  { id: "progress" as const, label: "Progress", icon: ChartNoAxesColumnIncreasing },
];

export function AppShell({ children, context, section, onNavigate }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><Boxes /></span>
          <span><strong>AI System Design Gym</strong><small>Active engineering practice</small></span>
        </div>
        <nav className="primary-nav">
          <span className="nav-label">Workspace</span>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={section === id ? "nav-item active" : "nav-item"} onClick={() => onNavigate(id)} aria-current={section === id ? "page" : undefined}>
              <Icon /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="profile">
          <span className="avatar">JD</span>
          <span><strong>Jordan Lee</strong><small>AI engineer</small></span>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <span>AI System Design Gym</span>
          <strong>{context}</strong>
        </header>
        {children}
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button key={id} aria-label={`Open ${label}`} className={section === id ? "active" : ""} onClick={() => onNavigate(id)} aria-current={section === id ? "page" : undefined}>
            <Icon /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
