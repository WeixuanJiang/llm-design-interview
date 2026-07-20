import { describe, expect, it } from "vitest";
import { learningModules, lessonCourseContent } from "./learningContent";
import { catalogCoverage, catalogMissions, catalogPracticeUnits } from "./pdfCatalog";

describe("Catalog integration", () => {
  it("represents every cataloged Learn chapter and substantial lesson content", () => {
    expect(learningModules).toHaveLength(23);
    expect(catalogCoverage.learnChapters).toBeGreaterThanOrEqual(23);
    expect(catalogCoverage.learnUnits).toBeGreaterThanOrEqual(80);

    for (const module of learningModules) {
      expect(module.lessons.length, module.title).toBeGreaterThan(0);
      for (const lesson of module.lessons) {
        const course = lessonCourseContent[lesson.id];
        expect(course, lesson.title).toBeDefined();
        expect(course.sections.length, lesson.title).toBeGreaterThanOrEqual(4);
        expect(course.sections.flatMap((section) => section.paragraphs).length, lesson.title).toBeGreaterThanOrEqual(8);
        expect(lesson.source.pages, lesson.title).not.toBe("");
      }
    }
  });

  it("represents the cataloged interview-practice inventory", () => {
    expect(catalogCoverage.practiceUnits).toBeGreaterThanOrEqual(80);
    for (let chapter = 1; chapter <= 24; chapter += 1) {
      expect(catalogPracticeUnits.some((unit) => unit.chapter === chapter), `chapter ${chapter}`).toBe(true);
    }
  });

  it("ships a concrete drill with exactly one correct option per practice unit", () => {
    const correctPositions = new Set<number>();
    const questions = new Set<string>();
    const ids = new Set<string>();
    for (const unit of catalogPracticeUnits) {
      expect(unit.title.trim().length, unit.id).toBeGreaterThan(0);
      expect(unit.question.trim().length, unit.id).toBeGreaterThan(20);
      expect(unit.question, unit.id).not.toMatch(/\bTODO\b|\bTBD\b|placeholder|lorem ipsum|\$\{|\[object|undefined|NaN/);
      expect(unit.options, unit.id).toHaveLength(3);
      expect(unit.options.filter((option) => option.correct), unit.id).toHaveLength(1);
      for (const option of unit.options) {
        expect(option.text.trim().length, unit.id).toBeGreaterThan(0);
        expect(option.feedback.trim().length, unit.id).toBeGreaterThan(0);
      }
      correctPositions.add(unit.options.findIndex((option) => option.correct));
      questions.add(unit.question);
      ids.add(unit.id);
    }
    expect(questions.size).toBe(catalogPracticeUnits.length);
    expect(ids.size).toBe(catalogPracticeUnits.length);
    expect(correctPositions.size).toBeGreaterThan(1);
  });

  it("represents every applied and company-style mission", () => {
    expect(catalogCoverage.generalMissions).toBe(17);
    expect(catalogCoverage.advancedMissions).toBe(8);
    expect(catalogMissions).toHaveLength(25);
    expect(catalogMissions.filter((mission) => mission.publicCaseStudy)).toHaveLength(8);
  });
});
