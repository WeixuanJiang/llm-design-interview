import { lazy, Suspense, useEffect, useReducer, useRef, useState } from "react";
import { AppShell, type AppSection } from "./components/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MissionCatalogue } from "./components/MissionCatalogue";
import { SkeletonPanel } from "./components/Skeleton";
import { ATTEMPT_STORAGE_KEY, attemptReducer, createInitialAttempt, loadAttempt, saveAttempt } from "./domain/attempt";

type View = AppSection | "workspace";
type Theme = "light" | "dark";
interface LearningState { completedModules: string[]; completedLessons: string[]; practiceReviewed: number; practiceCorrect: number; }
const LEARNING_STORAGE_KEY = "ai-system-design-gym.learning.v1";
const THEME_STORAGE_KEY = "ai-system-design-gym.theme.v1";

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Set before the first paint so there's no flash of the wrong theme.
document.documentElement.dataset.theme = loadTheme();
const HomePage = lazy(() => import("./components/HomePage").then((module) => ({ default: module.HomePage })));
const LearnPage = lazy(() => import("./components/LearnPage").then((module) => ({ default: module.LearnPage })));
const PracticePage = lazy(() => import("./components/PracticePage").then((module) => ({ default: module.PracticePage })));
const ProgressPage = lazy(() => import("./components/ProgressPage").then((module) => ({ default: module.ProgressPage })));
const MissionWorkspace = lazy(() => import("./components/MissionWorkspace").then((module) => ({ default: module.MissionWorkspace })));

function viewFromHash(): View {
  const value = window.location.hash.slice(1);
  return value === "home" || value === "learn" || value === "missions" || value === "practice" || value === "progress" || value === "workspace" ? value : "home";
}

function loadLearningState(): LearningState {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEARNING_STORAGE_KEY) ?? "null") as LearningState | null;
    return parsed && Array.isArray(parsed.completedModules) ? { ...parsed, completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [] } : { completedModules: [], completedLessons: [], practiceReviewed: 0, practiceCorrect: 0 };
  } catch {
    return { completedModules: [], completedLessons: [], practiceReviewed: 0, practiceCorrect: 0 };
  }
}

export function App() {
  const recoveredRef = useRef(loadAttempt());
  const [attempt, dispatch] = useReducer(attemptReducer, recoveredRef.current ?? createInitialAttempt());
  const [view, setView] = useState<View>(viewFromHash);
  const [learning, setLearning] = useState<LearningState>(loadLearningState);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "offline">(navigator.onLine ? "saved" : "offline");
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const hasProgress = Boolean(recoveredRef.current || attempt.completedStages.length || attempt.requirementSummary || Object.keys(attempt.decisions).length);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (localStorage.getItem(THEME_STORAGE_KEY)) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setTheme(event.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  };

  useEffect(() => {
    setSaveStatus(navigator.onLine ? "saving" : "offline");
    const timer = window.setTimeout(() => {
      saveAttempt(attempt);
      setSaveStatus(navigator.onLine ? "saved" : "offline");
    }, 450);
    return () => window.clearTimeout(timer);
  }, [attempt]);

  useEffect(() => {
    const online = () => setSaveStatus("saved");
    const offline = () => setSaveStatus("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  useEffect(() => {
    const syncView = () => setView(viewFromHash());
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);

  useEffect(() => { localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(learning)); }, [learning]);

  const reset = () => {
    localStorage.removeItem(ATTEMPT_STORAGE_KEY);
    window.location.reload();
  };

  const navigate = (next: View) => {
    window.location.hash = next;
    setView(next);
  };

  const section: AppSection = view === "workspace" ? "missions" : view;
  const context = view === "workspace" ? "Enterprise RAG workspace" : section[0].toUpperCase() + section.slice(1);

  return (
    <AppShell context={context} section={section} onNavigate={navigate} theme={theme} onToggleTheme={toggleTheme}>
      {view === "learn" ? <ErrorBoundary><Suspense fallback={<SkeletonPanel variant="two-pane" />}><LearnPage completedModules={learning.completedModules} completedLessons={learning.completedLessons} onComplete={(moduleId, lessonId, moduleLessonIds) => setLearning((state) => { const completedLessons = [...new Set([...state.completedLessons, lessonId])]; const completedModules = moduleLessonIds.every((id) => completedLessons.includes(id)) ? [...new Set([...state.completedModules, moduleId])] : state.completedModules; return { ...state, completedLessons, completedModules }; })} /></Suspense></ErrorBoundary> : null}
      {view === "home" ? <ErrorBoundary><Suspense fallback={<SkeletonPanel variant="cards" />}><HomePage completedModules={learning.completedModules.length} reviewed={learning.practiceReviewed} missionProgress={attempt.completedStages.length} onNavigate={navigate} /></Suspense></ErrorBoundary> : null}
      {view === "missions" ? <MissionCatalogue attempt={attempt} recovered={hasProgress} onModeChange={(mode) => dispatch({ type: "set-mode", mode })} onOpen={() => navigate("workspace")} onReset={reset} /> : null}
      {view === "practice" ? <ErrorBoundary><Suspense fallback={<SkeletonPanel variant="two-pane" />}><PracticePage reviewed={learning.practiceReviewed} correct={learning.practiceCorrect} onReviewed={(correct) => setLearning((state) => ({ ...state, practiceReviewed: state.practiceReviewed + 1, practiceCorrect: state.practiceCorrect + (correct ? 1 : 0) }))} /></Suspense></ErrorBoundary> : null}
      {view === "progress" ? <ErrorBoundary><Suspense fallback={<SkeletonPanel variant="cards" />}><ProgressPage attempt={attempt} completedModules={learning.completedModules} reviewed={learning.practiceReviewed} correct={learning.practiceCorrect} onNavigate={navigate} /></Suspense></ErrorBoundary> : null}
      {view === "workspace" ? <ErrorBoundary><Suspense fallback={<SkeletonPanel variant="workspace" />}><MissionWorkspace attempt={attempt} dispatch={dispatch} saveStatus={saveStatus} onExit={() => navigate("missions")} /></Suspense></ErrorBoundary> : null}
    </AppShell>
  );
}
