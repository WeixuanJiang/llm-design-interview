import { describe, expect, it } from "vitest";
import { learningModules } from "../data/learningContent";
import { catalogPracticeUnits } from "../data/pdfCatalog";
import {
  computeNextAction,
  CURRICULUM_TOTALS,
  DRILL_ACCURACY_TARGET,
  drillsMastered,
  MISSION_STAGE_TOTAL,
  type NextAction,
  type NextActionInput,
} from "./nextAction";

const allLessonIds = learningModules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
const allModuleIds = learningModules.map((module) => module.id);
const totalDrills = catalogPracticeUnits.length;
const masteredDrills = { reviewed: totalDrills, correct: Math.ceil(totalDrills * DRILL_ACCURACY_TARGET) };
const curriculumDone = { completedLessons: allLessonIds, completedModules: allModuleIds };

const base: NextActionInput = {
  completedLessons: [],
  completedModules: [],
  reviewed: 0,
  correct: 0,
  missionStages: 0,
  hasAttempt: false,
};

function expectWellFormed(action: NextAction) {
  expect(action.title.trim().length).toBeGreaterThan(0);
  expect(action.description.trim().length).toBeGreaterThan(0);
  expect(action.ctaLabel.trim().length).toBeGreaterThan(0);
}

describe("computeNextAction", () => {
  it("returns start with the first curriculum lesson when there is no evidence", () => {
    const action = computeNextAction(base);
    expect(action.kind).toBe("start");
    expect(action.moduleId).toBe(learningModules[0].id);
    expect(action.lessonId).toBe(learningModules[0].lessons[0].id);
    expectWellFormed(action);
  });

  it("returns the next incomplete lesson once learning has begun", () => {
    const firstModule = learningModules[0];
    const action = computeNextAction({ ...base, completedLessons: [firstModule.lessons[0].id] });
    expect(action.kind).toBe("lesson");
    expect(action.moduleId).toBe(firstModule.id);
    expect(action.lessonId).toBe(firstModule.lessons[1].id);
    expectWellFormed(action);
  });

  it("crosses into the next module when a module is finished", () => {
    const firstModule = learningModules[0];
    const secondModule = learningModules[1];
    const action = computeNextAction({
      ...base,
      completedLessons: firstModule.lessons.map((lesson) => lesson.id),
      completedModules: [firstModule.id],
    });
    expect(action.kind).toBe("lesson");
    expect(action.moduleId).toBe(secondModule.id);
    expect(action.lessonId).toBe(secondModule.lessons[0].id);
  });

  it("treats drill or mission evidence as a returning learner and still leads with lessons", () => {
    const action = computeNextAction({ ...base, reviewed: 12, correct: 9, missionStages: 2, hasAttempt: true });
    expect(action.kind).toBe("lesson");
    expect(action.lessonId).toBe(learningModules[0].lessons[0].id);
  });

  it("returns drill when the curriculum is done but drills are unattempted", () => {
    const action = computeNextAction({ ...base, ...curriculumDone, reviewed: totalDrills - 1, correct: totalDrills - 1 });
    expect(action.kind).toBe("drill");
    expect(action.moduleId).toBeUndefined();
    expectWellFormed(action);
  });

  it("returns drill when accuracy stays below the mastery target", () => {
    const correct = Math.floor(totalDrills * DRILL_ACCURACY_TARGET) - 1;
    const action = computeNextAction({ ...base, ...curriculumDone, reviewed: totalDrills, correct });
    expect(action.kind).toBe("drill");
  });

  it("returns mission when lessons and drills are done with a mission in progress", () => {
    const action = computeNextAction({ ...base, ...curriculumDone, ...masteredDrills, missionStages: 2, hasAttempt: true });
    expect(action.kind).toBe("mission");
    expectWellFormed(action);
  });

  it("returns review once the mission is fully complete", () => {
    const action = computeNextAction({
      ...base,
      ...curriculumDone,
      ...masteredDrills,
      missionStages: MISSION_STAGE_TOTAL,
      hasAttempt: true,
    });
    expect(action.kind).toBe("review");
    expectWellFormed(action);
  });

  it("returns review when nothing is in progress after drills are mastered", () => {
    const action = computeNextAction({ ...base, ...curriculumDone, ...masteredDrills });
    expect(action.kind).toBe("review");
  });
});

describe("drillsMastered", () => {
  it("requires every drill attempted at the accuracy target", () => {
    expect(drillsMastered(totalDrills, totalDrills)).toBe(true);
    expect(drillsMastered(totalDrills - 1, totalDrills - 1)).toBe(false);
    expect(drillsMastered(totalDrills, Math.floor(totalDrills * DRILL_ACCURACY_TARGET) - 1)).toBe(false);
    expect(drillsMastered(0, 0)).toBe(false);
  });

  it("exposes curriculum totals derived from the real catalog", () => {
    expect(CURRICULUM_TOTALS.modules).toBe(learningModules.length);
    expect(CURRICULUM_TOTALS.lessons).toBe(allLessonIds.length);
    expect(CURRICULUM_TOTALS.drills).toBe(totalDrills);
  });
});
