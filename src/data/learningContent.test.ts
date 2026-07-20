import { describe, expect, it } from "vitest";
import { getLessonKnowledgeChecks, learningModules, lessonCourseContent } from "./learningContent";

describe("lesson knowledge checks", () => {
  it("provides at least five substantial scenario questions for every lesson", () => {
    const lessons = learningModules.flatMap((module) => module.lessons);
    expect(lessons.length).toBeGreaterThan(0);

    for (const lesson of lessons) {
      const questions = getLessonKnowledgeChecks(lesson);
      expect(questions.length, lesson.title).toBeGreaterThanOrEqual(5);
      for (const question of questions) {
        expect(question.prompt.trim().split(/\s+/).length, `${lesson.title}: ${question.prompt}`).toBeGreaterThanOrEqual(18);
        expect(question.options.length).toBeGreaterThanOrEqual(3);
        expect(question.correct).toBeGreaterThanOrEqual(0);
        expect(question.correct).toBeLessThan(question.options.length);
        expect(question.feedback.length).toBeGreaterThan(40);
      }
    }
  });

  it("serves explicit chapter-authored knowledge checks instead of the template generator", () => {
    const lessons = learningModules.flatMap((module) => module.lessons);
    const missingExplicit: string[] = [];
    const templateServed: string[] = [];

    for (const lesson of lessons) {
      const explicit = lessonCourseContent[lesson.id]?.knowledgeChecks;
      if (!explicit || explicit.length < 5) missingExplicit.push(lesson.id);
      for (const question of getLessonKnowledgeChecks(lesson)) {
        if (question.prompt.includes("During a production design review")) templateServed.push(lesson.id);
      }
    }

    const uniqueTemplated = [...new Set(templateServed)];
    expect(missingExplicit, `lessons missing explicit knowledgeChecks: ${missingExplicit.join(", ") || "none"}`).toEqual([]);
    expect(uniqueTemplated, `lessons still served by the template generator: ${uniqueTemplated.join(", ") || "none"}`).toEqual([]);
  });
});
