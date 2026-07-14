import { describe, expect, it } from "vitest";
import { learningModules, lessonCourseContent } from "./learningContent";
import { catalogCoverage, catalogMissions, catalogPracticeUnits } from "./pdfCatalog";

describe("PDF catalog integration", () => {
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
    expect(catalogPracticeUnits.some((unit) => unit.chapter === 16)).toBe(true);
  });

  it("represents every applied and company-style mission", () => {
    expect(catalogCoverage.generalMissions).toBe(17);
    expect(catalogCoverage.advancedMissions).toBe(8);
    expect(catalogMissions).toHaveLength(25);
    expect(catalogMissions.filter((mission) => mission.publicCaseStudy)).toHaveLength(8);
  });
});
