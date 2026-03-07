import {
  TalmudSectionSegmentationSchema,
  type TalmudBoundaryCandidate,
  type TalmudEnglishAnchor,
  type TalmudSectionSegmentation,
} from "@shared/schema";
import { removeNikud } from "@shared/text-processing";

const HTML_TAG_PATTERN = /<\/?\w+(?:\s+[^>]*)?>/g;
const BR_TAG_PATTERN = /<br\s*\/?>/gi;
const BOLD_CONTENT_PATTERN = /<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi;
const ENGLISH_BOUNDARY_PATTERN = /[.!?;:](?=\s|$)|,(?=\s+[A-Z"'(\u2018\u2019\u201C\u201D])/g;
const HEBREW_BOUNDARY_PATTERN = /[.!?;:,\u05C3]/g;

export const TALMUD_SEGMENTATION_VERSION = "talmud-segmentation-v0";

export interface TalmudSectionInput {
  ref: string;
  sectionIndex: number;
  hebrew: string;
  english: string;
}

export interface TalmudSegmentationPromptPayload {
  ref: string;
  sectionIndex: number;
  version: string;
  normalizedHebrew: string;
  normalizedEnglish: string;
  englishAnchors: TalmudEnglishAnchor[];
  hebrewCandidates: TalmudBoundaryCandidate[];
  englishCandidates: TalmudBoundaryCandidate[];
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

function htmlToPlainText(html: string): string {
  const withBreaks = html.replace(BR_TAG_PATTERN, "\n");
  const withoutTags = withBreaks.replace(HTML_TAG_PATTERN, "");
  return normalizeWhitespace(decodeHtmlEntities(withoutTags));
}

function normalizeHebrewText(text: string): string {
  return normalizeWhitespace(removeNikud(htmlToPlainText(text)));
}

function normalizeEnglishText(text: string): string {
  return htmlToPlainText(text);
}

function extractEnglishAnchors(englishHtml: string): TalmudEnglishAnchor[] {
  const anchors: TalmudEnglishAnchor[] = [];
  let index = 0;
  const matches = Array.from(englishHtml.matchAll(BOLD_CONTENT_PATTERN));

  for (const match of matches) {
    const html = match[0];
    const innerHtml = match[2] || "";
    const text = htmlToPlainText(innerHtml);
    if (!text) {
      continue;
    }

    const prefix = englishHtml.slice(0, match.index ?? 0);
    const startChar = htmlToPlainText(prefix).length;
    const endChar = startChar + text.length;

    anchors.push({
      index,
      html,
      text,
      startChar,
      endChar,
      isBold: true,
    });
    index += 1;
  }

  return anchors;
}

function buildBoundaryMap(text: string, pattern: RegExp, reasonPrefix: string): Map<number, string> {
  const boundaries = new Map<number, string>();
  const matches = Array.from(text.matchAll(new RegExp(pattern.source, pattern.flags)));

  for (const match of matches) {
    const punct = match[0];
    const endChar = (match.index ?? 0) + punct.length;
    if (endChar > 0 && endChar < text.length) {
      boundaries.set(endChar, `${reasonPrefix}:${punct}`);
    }
  }

  return boundaries;
}

function addAnchorBoundaries(
  boundaries: Map<number, string>,
  anchors: TalmudEnglishAnchor[],
  textLength: number,
): void {
  anchors.forEach((anchor) => {
    if (anchor.startChar > 0 && anchor.startChar < textLength && !boundaries.has(anchor.startChar)) {
      boundaries.set(anchor.startChar, "anchor:start");
    }
    if (anchor.endChar > 0 && anchor.endChar < textLength && !boundaries.has(anchor.endChar)) {
      boundaries.set(anchor.endChar, "anchor:end");
    }
  });
}

function buildCandidatesFromBoundaries(
  text: string,
  boundaries: Map<number, string>,
): TalmudBoundaryCandidate[] {
  if (!text) {
    return [];
  }

  const sortedBoundaries = Array.from(boundaries.entries())
    .sort((a, b) => a[0] - b[0]);
  const candidates: TalmudBoundaryCandidate[] = [];

  let startChar = 0;
  let index = 0;

  for (const [endChar, reason] of sortedBoundaries) {
    const segmentText = text.slice(startChar, endChar).trim();
    if (!segmentText) {
      startChar = endChar;
      continue;
    }

    const localStartOffset = text.slice(startChar, endChar).indexOf(segmentText);
    const absoluteStart = startChar + Math.max(localStartOffset, 0);

    candidates.push({
      index,
      text: segmentText,
      startChar: absoluteStart,
      endChar: absoluteStart + segmentText.length,
      reason,
    });

    startChar = endChar;
    index += 1;
  }

  const trailingText = text.slice(startChar).trim();
  if (trailingText) {
    const localStartOffset = text.slice(startChar).indexOf(trailingText);
    const absoluteStart = startChar + Math.max(localStartOffset, 0);

    candidates.push({
      index,
      text: trailingText,
      startChar: absoluteStart,
      endChar: absoluteStart + trailingText.length,
      reason: "tail",
    });
  }

  return candidates;
}

function buildEnglishCandidates(
  normalizedEnglish: string,
  anchors: TalmudEnglishAnchor[],
): TalmudBoundaryCandidate[] {
  const boundaries = buildBoundaryMap(normalizedEnglish, ENGLISH_BOUNDARY_PATTERN, "punct");
  addAnchorBoundaries(boundaries, anchors, normalizedEnglish.length);
  return buildCandidatesFromBoundaries(normalizedEnglish, boundaries);
}

function buildHebrewCandidates(normalizedHebrew: string): TalmudBoundaryCandidate[] {
  const boundaries = buildBoundaryMap(normalizedHebrew, HEBREW_BOUNDARY_PATTERN, "punct");
  return buildCandidatesFromBoundaries(normalizedHebrew, boundaries);
}

function buildInitialNotes(
  englishAnchors: TalmudEnglishAnchor[],
  hebrewCandidates: TalmudBoundaryCandidate[],
  englishCandidates: TalmudBoundaryCandidate[],
): string[] {
  const notes: string[] = [];

  if (englishAnchors.length === 0) {
    notes.push("No bold English anchors detected in this section.");
  }
  if (hebrewCandidates.length !== englishCandidates.length) {
    notes.push(
      `Candidate count mismatch: Hebrew=${hebrewCandidates.length}, English=${englishCandidates.length}.`,
    );
  }

  return notes;
}

export function buildTalmudSectionSegmentationScaffold(
  input: TalmudSectionInput,
): TalmudSectionSegmentation {
  const normalizedHebrew = normalizeHebrewText(input.hebrew);
  const normalizedEnglish = normalizeEnglishText(input.english);
  const englishAnchors = extractEnglishAnchors(input.english);
  const hebrewCandidates = buildHebrewCandidates(normalizedHebrew);
  const englishCandidates = buildEnglishCandidates(normalizedEnglish, englishAnchors);

  const segmentation: TalmudSectionSegmentation = {
    sectionIndex: input.sectionIndex,
    ref: input.ref,
    status: "rules_only",
    strategy: "rules_v1",
    version: TALMUD_SEGMENTATION_VERSION,
    normalizedHebrew,
    normalizedEnglish,
    englishAnchors,
    hebrewCandidates,
    englishCandidates,
    alignedSegments: [],
    confidence: null,
    notes: buildInitialNotes(englishAnchors, hebrewCandidates, englishCandidates),
  };

  return TalmudSectionSegmentationSchema.parse(segmentation);
}

export function buildTalmudPageSegmentationScaffolds(
  pageRef: string,
  hebrewSections: string[],
  englishSections: string[],
): TalmudSectionSegmentation[] {
  const maxSections = Math.max(hebrewSections.length, englishSections.length);

  return Array.from({ length: maxSections }, (_, sectionIndex) =>
    buildTalmudSectionSegmentationScaffold({
      ref: `${pageRef}:${sectionIndex + 1}`,
      sectionIndex,
      hebrew: hebrewSections[sectionIndex] || "",
      english: englishSections[sectionIndex] || "",
    }),
  );
}

export function buildTalmudSegmentationPromptPayload(
  scaffold: TalmudSectionSegmentation,
): TalmudSegmentationPromptPayload {
  return {
    ref: scaffold.ref,
    sectionIndex: scaffold.sectionIndex,
    version: scaffold.version,
    normalizedHebrew: scaffold.normalizedHebrew,
    normalizedEnglish: scaffold.normalizedEnglish,
    englishAnchors: scaffold.englishAnchors,
    hebrewCandidates: scaffold.hebrewCandidates,
    englishCandidates: scaffold.englishCandidates,
  };
}

export function validateTalmudSectionSegmentation(
  segmentation: TalmudSectionSegmentation,
): TalmudSectionSegmentation {
  return TalmudSectionSegmentationSchema.parse(segmentation);
}
