import { removeNikud } from "@shared/text-processing";

export interface TalmudSourceProvenance {
  sectionIndex: number;
  sectionNumber: number;
  sectionRef: string;
  matchStrategy: "hebrew_exact" | "english_exact" | "bilingual_overlap" | "section_fallback";
  matchConfidence: number;
  startChar: number | null;
  endChar: number | null;
}

const HTML_TAG_PATTERN = /<\/?\w+(?:\s+[^>]*)?>/g;
const BR_TAG_PATTERN = /<br\s*\/?>/gi;

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
  return text.replace(/\s+/g, " ").trim();
}

function htmlToPlainText(text: string): string {
  return normalizeWhitespace(
    decodeHtmlEntities(
      text
        .replace(BR_TAG_PATTERN, "\n")
        .replace(HTML_TAG_PATTERN, " "),
    ),
  );
}

function normalizeHebrewForMatching(text: string): string {
  return normalizeWhitespace(
    removeNikud(htmlToPlainText(text))
      .replace(/["'`]/g, "")
      .replace(/[^\u05D0-\u05EA0-9\s]/g, " "),
  );
}

function normalizeEnglishForMatching(text: string): string {
  return normalizeWhitespace(
    htmlToPlainText(text)
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9\s]/g, " "),
  );
}

function tokenize(text: string): string[] {
  return text.split(" ").filter((token) => token.length > 1);
}

function scoreTokenOverlap(sectionText: string, queryText: string): number {
  if (!sectionText || !queryText) {
    return 0;
  }

  const sectionTokens = new Set(tokenize(sectionText));
  const queryTokens = tokenize(queryText);
  if (queryTokens.length === 0) {
    return 0;
  }

  let overlapCount = 0;
  queryTokens.forEach((token) => {
    if (sectionTokens.has(token)) {
      overlapCount += 1;
    }
  });

  return overlapCount / queryTokens.length;
}

export function extractSefariaReferenceFromUrl(url: string): string | null {
  const cleanUrl = url.split("?")[0];
  const urlParts = cleanUrl.split("/");
  const reference = urlParts[urlParts.length - 1];
  return reference || null;
}

export function locateTalmudSourceProvenance(params: {
  hebrewText?: string | null;
  englishText?: string | null;
  hebrewSections: string[];
  englishSections: string[];
  sectionRefs: string[];
}): TalmudSourceProvenance | null {
  const normalizedHebrew = normalizeHebrewForMatching(params.hebrewText || "");
  const normalizedEnglish = normalizeEnglishForMatching(params.englishText || "");

  if (!normalizedHebrew && !normalizedEnglish) {
    return null;
  }

  let bestMatch: TalmudSourceProvenance | null = null;
  let bestScore = 0;

  for (let sectionIndex = 0; sectionIndex < params.sectionRefs.length; sectionIndex += 1) {
    const sectionRef = params.sectionRefs[sectionIndex];
    const sectionHebrew = normalizeHebrewForMatching(params.hebrewSections[sectionIndex] || "");
    const sectionEnglish = normalizeEnglishForMatching(params.englishSections[sectionIndex] || "");

    const hebrewExactIndex = normalizedHebrew ? sectionHebrew.indexOf(normalizedHebrew) : -1;
    if (hebrewExactIndex >= 0) {
      const score = 1000 + normalizedHebrew.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          sectionIndex,
          sectionNumber: sectionIndex + 1,
          sectionRef,
          matchStrategy: "hebrew_exact",
          matchConfidence: 1,
          startChar: hebrewExactIndex,
          endChar: hebrewExactIndex + normalizedHebrew.length,
        };
      }
    }

    const englishExactIndex = normalizedEnglish ? sectionEnglish.indexOf(normalizedEnglish) : -1;
    if (englishExactIndex >= 0) {
      const score = 900 + normalizedEnglish.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          sectionIndex,
          sectionNumber: sectionIndex + 1,
          sectionRef,
          matchStrategy: "english_exact",
          matchConfidence: 0.98,
          startChar: englishExactIndex,
          endChar: englishExactIndex + normalizedEnglish.length,
        };
      }
    }

    const overlapScore = Math.max(
      scoreTokenOverlap(sectionHebrew, normalizedHebrew),
      scoreTokenOverlap(sectionEnglish, normalizedEnglish),
    );
    if (overlapScore > bestScore) {
      bestScore = overlapScore;
      bestMatch = {
        sectionIndex,
        sectionNumber: sectionIndex + 1,
        sectionRef,
        matchStrategy: "bilingual_overlap",
        matchConfidence: Number(overlapScore.toFixed(3)),
        startChar: null,
        endChar: null,
      };
    }
  }

  if (!bestMatch || bestScore < 0.35) {
    return null;
  }

  return bestMatch;
}
