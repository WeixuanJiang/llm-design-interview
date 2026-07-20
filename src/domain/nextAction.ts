// Next-action engine for the Today page. Pure derivation over learner evidence:
// given lesson completion, drill evidence, and mission state, decide the single
// dominant action. No storage access — the caller assembles NextActionInput.

import { learningModules } from "../data/learningContent";
import { catalogPracticeUnits } from "../data/pdfCatalog";

export type NextActionKind = "start" | "lesson" | "drill" | "mission" | "review";

export interface NextAction {
  kind: NextActionKind;
  title: string;
  description: string;
  ctaLabel: string;
  moduleId?: string;
  lessonId?: string;
}

export interface NextActionInput {
  completedLessons: string[];
  completedModules: string[];
  reviewed: number;
  correct: number;
  missionStages: number;
  hasAttempt: boolean;
}

/** Mission workspace stages: requirements, estimation, architecture, stress, review. */
export const MISSION_STAGE_TOTAL = 5;
/** Drill mastery requires every drill attempted plus this accuracy floor. */
export const DRILL_ACCURACY_TARGET = 0.8;

export const CURRICULUM_TOTALS = {
  modules: learningModules.length,
  lessons: learningModules.reduce((sum, module) => sum + module.lessons.length, 0),
  drills: catalogPracticeUnits.length,
} as const;

export function drillsMastered(reviewed: number, correct: number): boolean {
  return reviewed >= CURRICULUM_TOTALS.drills && correct / reviewed >= DRILL_ACCURACY_TARGET;
}

interface LessonRef {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  lessonPrompt: string;
  lessonIndex: number;
  lessonCount: number;
}

/** First incomplete lesson in curriculum order, or null when the curriculum is done. */
function findNextLesson(completedLessons: string[]): LessonRef | null {
  const done = new Set(completedLessons);
  for (const module of learningModules) {
    for (let index = 0; index < module.lessons.length; index += 1) {
      const lesson = module.lessons[index];
      if (!done.has(lesson.id)) {
        return {
          moduleId: module.id,
          moduleTitle: module.title,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonPrompt: lesson.prompt,
          lessonIndex: index,
          lessonCount: module.lessons.length,
        };
      }
    }
  }
  return null;
}

export function computeNextAction(input: NextActionInput): NextAction {
  const { completedLessons, completedModules, reviewed, correct, missionStages, hasAttempt } = input;
  const hasEvidence =
    completedLessons.length > 0 || completedModules.length > 0 || reviewed > 0 || missionStages > 0 || hasAttempt;
  const next = findNextLesson(completedLessons);

  // First visit: no evidence of any kind — onboard with the first lesson.
  if (!hasEvidence) {
    return {
      kind: "start",
      title: "Start your first lesson",
      description: next
        ? `Begin with “${next.lessonTitle}” in ${next.moduleTitle} — the first step of the ${CURRICULUM_TOTALS.modules}-module curriculum.`
        : `Begin the ${CURRICULUM_TOTALS.modules}-module curriculum.`,
      ctaLabel: "Start learning",
      moduleId: next?.moduleId,
      lessonId: next?.lessonId,
    };
  }

  // Returning learner with curriculum left: continue at the first incomplete lesson.
  if (next) {
    return {
      kind: "lesson",
      title: next.lessonTitle,
      description: `Next up in ${next.moduleTitle} — lesson ${next.lessonIndex + 1} of ${next.lessonCount}. ${next.lessonPrompt}.`,
      ctaLabel: "Continue lesson",
      moduleId: next.moduleId,
      lessonId: next.lessonId,
    };
  }

  // Curriculum complete but drill mastery short: attempt every drill at target accuracy.
  if (!drillsMastered(reviewed, correct)) {
    const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;
    return {
      kind: "drill",
      title: "Sharpen your interview drills",
      description: `Curriculum complete. ${reviewed} of ${CURRICULUM_TOTALS.drills} drills attempted at ${accuracy}% accuracy — mastery means every drill attempted at ${Math.round(DRILL_ACCURACY_TARGET * 100)}% or better.`,
      ctaLabel: "Open drills",
    };
  }

  // Lessons and drills done with a mission still in flight: finish the build.
  if (hasAttempt && missionStages < MISSION_STAGE_TOTAL) {
    return {
      kind: "mission",
      title: "Resume your design mission",
      description: `${missionStages} of ${MISSION_STAGE_TOTAL} mission stages complete — return to the workspace and finish the build.`,
      ctaLabel: "Resume mission",
    };
  }

  // Everything complete: keep skills warm through review.
  return {
    kind: "review",
    title: "Review and reinforce",
    description: "Curriculum, drills, and missions are complete. Revisit missed questions or rerun a mock interview to stay sharp.",
    ctaLabel: "Review progress",
  };
}
