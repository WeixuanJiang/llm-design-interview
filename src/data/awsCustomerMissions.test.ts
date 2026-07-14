import { describe, expect, it } from "vitest";
import { awsCustomerMissions } from "./awsCustomerMissions";
import sources from "./awsCustomerSources.json";
import { missionCaseStudies } from "./missionCaseStudies";
import { missionSpecifications } from "./missionSpecifications";

const excluded = /^(Amazon|AWS|Ring|Twitch|Audible|Prime Video|Whole Foods|One Medical)\b/i;

describe("AWS customer mission catalog", () => {
  it("contains exactly 100 sourced external customer cases", () => {
    expect(awsCustomerMissions).toHaveLength(100);
    for (const mission of awsCustomerMissions) {
      expect(mission.sourceUrl).toMatch(/^https:\/\/aws\.amazon\.com\/blogs\/machine-learning\//);
      expect(mission.customer).not.toMatch(excluded);
      expect(mission.components.length).toBeGreaterThanOrEqual(8);
    }
  });

  it("uses one explicit, ordered case study for every runtime mission", () => {
    expect(missionCaseStudies).toHaveLength(100);
    expect(missionSpecifications).toHaveLength(100);
    expect(missionCaseStudies.map((caseStudy) => caseStudy.sourceIndex)).toEqual(
      Array.from({ length: 100 }, (_, index) => index + 1),
    );
    expect(missionSpecifications.map((specification) => specification.sourceIndex)).toEqual(
      Array.from({ length: 100 }, (_, index) => index + 1),
    );

    missionCaseStudies.forEach((caseStudy, index) => {
      const mission = awsCustomerMissions[index];
      expect(mission.customer).toBe(caseStudy.customer);
      expect(mission.title).toBe(caseStudy.title);
      expect(mission.description).toBe(caseStudy.description);
      expect(caseStudy.description).toContain(caseStudy.customer);
      expect(caseStudy.title).not.toBe(sources[index].Title);
      expect(sources[index].Title).not.toContain(caseStudy.customer);
      expect(mission.functionalRequirements).toBe(missionSpecifications[index].functionalRequirements);
      expect(mission.nonFunctionalRequirements).toBe(missionSpecifications[index].nonFunctionalRequirements);
      expect(mission.scaleAssumptions).toBe(missionSpecifications[index].scaleAssumptions);
      expect(mission.dataFlow).toBe(missionSpecifications[index].dataFlow);
    });
  });

  it("keeps customer names, titles, and descriptions unique", () => {
    expect(new Set(missionCaseStudies.map(({ customer }) => customer)).size).toBe(100);
    expect(new Set(missionCaseStudies.map(({ title }) => title)).size).toBe(100);
    expect(new Set(missionCaseStudies.map(({ description }) => description)).size).toBe(100);
  });

  it("keeps every case description close to 100 words", () => {
    for (const mission of awsCustomerMissions) {
      const wordCount = mission.description.trim().split(/\s+/).length;
      expect(wordCount, mission.title).toBeGreaterThanOrEqual(90);
      expect(wordCount, mission.title).toBeLessThanOrEqual(120);
    }
  });

  it("keeps source and blog provenance out of learner-facing case descriptions", () => {
    const provenanceLanguage = /AWS Machine Learning Blog|blog story|named external customer|the source establishes|public article|public story|source architecture/i;

    for (const mission of awsCustomerMissions) {
      expect(mission.description, mission.title).not.toMatch(provenanceLanguage);
    }
  });

  it("supplies unique, explicit requirements and workload data for every mission", () => {
    const functionalSets = new Set<string>();
    const nonFunctionalSets = new Set<string>();
    const scaleSets = new Set<string>();
    const flowSets = new Set<string>();

    for (const mission of awsCustomerMissions) {
      expect(mission.functionalRequirements).toHaveLength(4);
      expect(mission.nonFunctionalRequirements).toHaveLength(3);
      expect(mission.scaleAssumptions).toHaveLength(4);
      expect(mission.dataFlow).toHaveLength(4);

      functionalSets.add(mission.functionalRequirements.join("\n"));
      nonFunctionalSets.add(mission.nonFunctionalRequirements.join("\n"));
      scaleSets.add(mission.scaleAssumptions.join("\n"));
      flowSets.add(mission.dataFlow.join("\n"));

      const assumptions = mission.scaleAssumptions.join(" ");
      expect(assumptions).toMatch(/Usage baseline:/);
      expect(assumptions).toMatch(/daily|weekly|monthly|annually|every|per (day|month|week|second|minute|hour)/);
      expect(assumptions).toMatch(/peak|concurrent|simultaneous/i);
      expect(assumptions).toMatch(/MB|GB|TB|PB|documents|records|events|turns|calls|pages|assets|jobs|files|items|updates|chunks|facts|passages|questions|workflows|submissions|segments|interactions|translations/);
      expect(assumptions).toMatch(/99\.9|RTO|recovery|recover|restore|failover/);

      const allRequirements = [
        ...mission.functionalRequirements,
        ...mission.nonFunctionalRequirements,
        ...mission.scaleAssumptions,
        ...mission.dataFlow,
      ].join(" ");
      expect(allRequirements).not.toMatch(/Estimate daily|Set measurable|Estimate payload|Define concurrency|Authenticate the caller and attach tenant/i);
    }

    expect(functionalSets.size).toBe(100);
    expect(nonFunctionalSets.size).toBe(100);
    expect(scaleSets.size).toBe(100);
    expect(flowSets.size).toBe(100);
  });
});
