import catalogMarkdown from "./pdf-content-catalog.txt?raw";
import { learningModules } from "./learningContent";
import { chapter01Practice } from "./chapters/chapter-01";
import { chapter02Practice } from "./chapters/chapter-02";
import { chapter03Practice } from "./chapters/chapter-03";
import { chapter04Practice } from "./chapters/chapter-04";
import { chapter05Practice } from "./chapters/chapter-05";
import { chapter06Practice } from "./chapters/chapter-06";
import { chapter07Practice } from "./chapters/chapter-07";
import { chapter08Practice } from "./chapters/chapter-08";
import { chapter09Practice } from "./chapters/chapter-09";
import { chapter10Practice } from "./chapters/chapter-10";
import { chapter11Practice } from "./chapters/chapter-11";
import { chapter12Practice } from "./chapters/chapter-12";
import { chapter13Practice } from "./chapters/chapter-13";
import { chapter14Practice } from "./chapters/chapter-14";
import { chapter15Practice } from "./chapters/chapter-15";
import { chapter16Practice } from "./chapters/chapter-16";
import { chapter17Practice } from "./chapters/chapter-17";
import { chapter18Practice } from "./chapters/chapter-18";
import { chapter19Practice } from "./chapters/chapter-19";
import { chapter20Practice } from "./chapters/chapter-20";
import { chapter21Practice } from "./chapters/chapter-21";
import { chapter22Practice } from "./chapters/chapter-22";
import { chapter23Practice } from "./chapters/chapter-23";
import { chapter24Practice } from "./chapters/chapter-24";

export interface CatalogPracticeOption {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface CatalogPracticeUnit {
  id: string;
  chapter: number;
  chapterTitle: string;
  title: string;
  pages: string;
  route: string;
  competencies: string[];
  question: string;
  options: CatalogPracticeOption[];
}

export interface CatalogMission {
  chapter: number;
  pages: string;
  title: string;
  scenario: string;
  modes: string;
  priority: string;
  publicCaseStudy: boolean;
}

// Interview drills are authored statically per chapter (see data/chapters/);
// this aggregate preserves book order so Practice surfaces read 1 -> 24.
export const catalogPracticeUnits: CatalogPracticeUnit[] = [
  ...chapter01Practice,
  ...chapter02Practice,
  ...chapter03Practice,
  ...chapter04Practice,
  ...chapter05Practice,
  ...chapter06Practice,
  ...chapter07Practice,
  ...chapter08Practice,
  ...chapter09Practice,
  ...chapter10Practice,
  ...chapter11Practice,
  ...chapter12Practice,
  ...chapter13Practice,
  ...chapter14Practice,
  ...chapter15Practice,
  ...chapter16Practice,
  ...chapter17Practice,
  ...chapter18Practice,
  ...chapter19Practice,
  ...chapter20Practice,
  ...chapter21Practice,
  ...chapter22Practice,
  ...chapter23Practice,
  ...chapter24Practice,
];

function tableRowsBetween(start: string, end: string) {
  const block = catalogMarkdown.match(new RegExp(`${start}([\\s\\S]*?)${end}`))?.[1] ?? "";
  return block.split(/\r?\n/).filter((line) => /^\|\s*\d+\s*\|/.test(line)).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
}

const generalMissions: CatalogMission[] = tableRowsBetween("## 9\\. General applied mission catalog - Chapters 25-41", "## 10\\.").map((cells) => ({
  chapter: Number(cells[0]), pages: cells[1], title: cells[2], scenario: cells[3], modes: cells[4], priority: cells[5], publicCaseStudy: false,
}));
const advancedMissions: CatalogMission[] = tableRowsBetween("## 10\\. Advanced company-style mission catalog - Chapters 42-49", "## 11\\.").map((cells) => ({
  chapter: Number(cells[0]), pages: cells[1], title: cells[2], scenario: cells[3], modes: "Interview, Production (advanced)", priority: cells[4], publicCaseStudy: true,
}));

export const catalogMissions = [...generalMissions, ...advancedMissions];
export const catalogCoverage = {
  learnChapters: learningModules.length,
  learnUnits: learningModules.reduce((sum, module) => sum + module.lessons.length, 0),
  practiceUnits: catalogPracticeUnits.length,
  generalMissions: generalMissions.length,
  advancedMissions: advancedMissions.length,
};
