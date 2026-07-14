import { describe, expect, it } from "vitest";
import { getLessonKnowledgeChecks, learningModules } from "./learningContent";

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
});
