import fs from "fs";
import {
  buildTalmudSectionSegmentationScaffold,
  normalizeTalmudEnglishText,
  normalizeTalmudHebrewText,
} from "./talmud-segmentation";
import { fetchSefariaRawSource } from "./talmud-sefaria-source";
import { type TalmudBoundaryCandidate, type TalmudSectionSegmentation } from "@shared/schema";
import { type TalmudSegmentationEvalDataset, type TalmudSegmentationEvalExample } from "./blogpost-goldset-eval";

export interface SectionSegmentationScore {
  sectionRef: string;
  goldSegmentCount: number;
  hebrewCandidateCount: number;
  englishCandidateCount: number;
  hebrewCoverageRate: number;
  englishCoverageRate: number;
  bilingualCoverageRate: number;
  exactCandidateCountMatch: boolean;
  hebrewBoundaryPrecision: number | null;
  hebrewBoundaryRecall: number | null;
  hebrewBoundaryF1: number | null;
  englishBoundaryPrecision: number | null;
  englishBoundaryRecall: number | null;
  englishBoundaryF1: number | null;
}

export interface BlogpostSegmentationScoreReport {
  generatedAt: string;
  sourceEvalPath: string;
  sectionCount: number;
  exampleCount: number;
  averageGoldSegmentsPerSection: number;
  exactCandidateCountMatchRate: number;
  hebrewCoverageRate: number;
  englishCoverageRate: number;
  bilingualCoverageRate: number;
  hebrewBoundaryPrecision: number | null;
  hebrewBoundaryRecall: number | null;
  hebrewBoundaryF1: number | null;
  englishBoundaryPrecision: number | null;
  englishBoundaryRecall: number | null;
  englishBoundaryF1: number | null;
  sections: SectionSegmentationScore[];
}

function tokenize(text: string): string[] {
  return text.split(" ").filter((token) => token.length > 1);
}

function textOverlapScore(left: string, right: string): number {
  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  if (left.includes(right) || right.includes(left)) {
    return Math.min(left.length, right.length) / Math.max(left.length, right.length);
  }

  const leftTokens = new Set(tokenize(left));
  const rightTokens = tokenize(right);
  if (rightTokens.length === 0) {
    return 0;
  }

  let overlapCount = 0;
  rightTokens.forEach((token) => {
    if (leftTokens.has(token)) {
      overlapCount += 1;
    }
  });

  return overlapCount / rightTokens.length;
}

function candidateListCoversText(candidates: TalmudBoundaryCandidate[], text: string): boolean {
  return candidates.some((candidate) => textOverlapScore(candidate.text, text) >= 0.75);
}

function computeF1(precision: number | null, recall: number | null): number | null {
  if (precision === null || recall === null) {
    return null;
  }
  if (precision + recall === 0) {
    return 0;
  }
  return (2 * precision * recall) / (precision + recall);
}

function computeBoundaryMetrics(
  goldBoundaries: number[],
  candidateBoundaries: number[],
): { precision: number | null; recall: number | null; f1: number | null } {
  if (goldBoundaries.length === 0) {
    return { precision: null, recall: null, f1: null };
  }

  const goldSet = new Set(goldBoundaries);
  const candidateSet = new Set(candidateBoundaries);
  let matches = 0;
  candidateSet.forEach((boundary) => {
    if (goldSet.has(boundary)) {
      matches += 1;
    }
  });

  const precision = candidateSet.size > 0 ? matches / candidateSet.size : 0;
  const recall = goldSet.size > 0 ? matches / goldSet.size : 0;
  return {
    precision,
    recall,
    f1: computeF1(precision, recall),
  };
}

function scoreSectionSegmentation(
  scaffold: TalmudSectionSegmentation,
  examples: TalmudSegmentationEvalExample[],
): SectionSegmentationScore {
  const normalizedExamples = examples.map((example) => ({
    hebrew: normalizeTalmudHebrewText(example.hebrew),
    english: normalizeTalmudEnglishText(example.english),
    sourceProvenance: example.sourceProvenance ?? null,
  }));

  const hebrewCoveredCount = normalizedExamples.filter((example) =>
    candidateListCoversText(scaffold.hebrewCandidates, example.hebrew)
  ).length;
  const englishCoveredCount = normalizedExamples.filter((example) =>
    candidateListCoversText(scaffold.englishCandidates, example.english)
  ).length;
  const bilingualCoveredCount = normalizedExamples.filter((example) =>
    candidateListCoversText(scaffold.hebrewCandidates, example.hebrew)
    && candidateListCoversText(scaffold.englishCandidates, example.english)
  ).length;

  const hebrewGoldBoundaries = normalizedExamples
    .map((example) => example.sourceProvenance)
    .filter((provenance): provenance is NonNullable<typeof provenance> =>
      provenance?.matchStrategy === "hebrew_exact" && provenance.endChar !== null
    )
    .map((provenance) => provenance.endChar)
    .filter((boundary): boundary is number => boundary !== null)
    .slice(0, -1);
  const englishGoldBoundaries = normalizedExamples
    .map((example) => example.sourceProvenance)
    .filter((provenance): provenance is NonNullable<typeof provenance> =>
      provenance?.matchStrategy === "english_exact" && provenance.endChar !== null
    )
    .map((provenance) => provenance.endChar)
    .filter((boundary): boundary is number => boundary !== null)
    .slice(0, -1);

  const hebrewCandidateBoundaries = scaffold.hebrewCandidates
    .map((candidate) => candidate.endChar)
    .slice(0, -1);
  const englishCandidateBoundaries = scaffold.englishCandidates
    .map((candidate) => candidate.endChar)
    .slice(0, -1);

  const hebrewBoundary = computeBoundaryMetrics(hebrewGoldBoundaries, hebrewCandidateBoundaries);
  const englishBoundary = computeBoundaryMetrics(englishGoldBoundaries, englishCandidateBoundaries);

  return {
    sectionRef: scaffold.ref,
    goldSegmentCount: examples.length,
    hebrewCandidateCount: scaffold.hebrewCandidates.length,
    englishCandidateCount: scaffold.englishCandidates.length,
    hebrewCoverageRate: hebrewCoveredCount / examples.length,
    englishCoverageRate: englishCoveredCount / examples.length,
    bilingualCoverageRate: bilingualCoveredCount / examples.length,
    exactCandidateCountMatch:
      scaffold.hebrewCandidates.length === examples.length
      && scaffold.englishCandidates.length === examples.length,
    hebrewBoundaryPrecision: hebrewBoundary.precision,
    hebrewBoundaryRecall: hebrewBoundary.recall,
    hebrewBoundaryF1: hebrewBoundary.f1,
    englishBoundaryPrecision: englishBoundary.precision,
    englishBoundaryRecall: englishBoundary.recall,
    englishBoundaryF1: englishBoundary.f1,
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageNullable(values: Array<number | null>): number | null {
  const filtered = values.filter((value): value is number => value !== null);
  if (filtered.length === 0) {
    return null;
  }
  return average(filtered);
}

export async function scoreBlogpostSegmentationEvalDataset(
  dataset: TalmudSegmentationEvalDataset,
  sourceEvalPath: string,
): Promise<BlogpostSegmentationScoreReport> {
  const bySection = new Map<string, TalmudSegmentationEvalExample[]>();
  dataset.examples.forEach((example) => {
    const sectionRef = example.sourceProvenance?.sectionRef;
    if (!sectionRef) {
      return;
    }
    const existing = bySection.get(sectionRef);
    if (existing) {
      existing.push(example);
    } else {
      bySection.set(sectionRef, [example]);
    }
  });

  const sectionScores: SectionSegmentationScore[] = [];
  for (const [sectionRef, examples] of Array.from(bySection.entries())) {
    const rawSource = await fetchSefariaRawSource(sectionRef);
    const scaffold = buildTalmudSectionSegmentationScaffold({
      ref: sectionRef,
      sectionIndex: 0,
      hebrew: rawSource.hebrewSections[0] || "",
      english: rawSource.englishSections[0] || "",
    });
    sectionScores.push(scoreSectionSegmentation(scaffold, examples));
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceEvalPath,
    sectionCount: sectionScores.length,
    exampleCount: dataset.examples.length,
    averageGoldSegmentsPerSection: average(sectionScores.map((section) => section.goldSegmentCount)),
    exactCandidateCountMatchRate: average(sectionScores.map((section) => section.exactCandidateCountMatch ? 1 : 0)),
    hebrewCoverageRate: average(sectionScores.map((section) => section.hebrewCoverageRate)),
    englishCoverageRate: average(sectionScores.map((section) => section.englishCoverageRate)),
    bilingualCoverageRate: average(sectionScores.map((section) => section.bilingualCoverageRate)),
    hebrewBoundaryPrecision: averageNullable(sectionScores.map((section) => section.hebrewBoundaryPrecision)),
    hebrewBoundaryRecall: averageNullable(sectionScores.map((section) => section.hebrewBoundaryRecall)),
    hebrewBoundaryF1: averageNullable(sectionScores.map((section) => section.hebrewBoundaryF1)),
    englishBoundaryPrecision: averageNullable(sectionScores.map((section) => section.englishBoundaryPrecision)),
    englishBoundaryRecall: averageNullable(sectionScores.map((section) => section.englishBoundaryRecall)),
    englishBoundaryF1: averageNullable(sectionScores.map((section) => section.englishBoundaryF1)),
    sections: sectionScores.sort((left, right) => left.sectionRef.localeCompare(right.sectionRef)),
  };
}

export async function scoreBlogpostSegmentationEvalFile(
  evalPath: string,
): Promise<BlogpostSegmentationScoreReport> {
  const dataset = JSON.parse(fs.readFileSync(evalPath, "utf8")) as TalmudSegmentationEvalDataset;
  return scoreBlogpostSegmentationEvalDataset(dataset, evalPath);
}
