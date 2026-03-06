import type { TalmudSectionSegmentation } from "@shared/schema";

export interface TalmudLocation {
  work: string;
  tractate: string;
  chapter: number;
  folio: number;
  side: 'a' | 'b';
}

export interface Chapter {
  number: number;
  folioRange: string;
}

export interface TalmudText {
  id: string;
  work: string;
  tractate: string;
  chapter: number;
  folio: number;
  side: string;
  hebrewText: string;
  englishText: string;
  hebrewSections?: string[] | null;
  englishSections?: string[] | null;
  sectionSegmentations?: TalmudSectionSegmentation[] | null;
  sefariaRef?: string;
  nextPageFirstSection?: { hebrew: string; english: string } | null;
}

export const WORKS = [
  "Bible",
  "Mishnah", 
  "Talmud Yerushalmi",
  "Talmud Bavli"
] as const;

export type Work = typeof WORKS[number];
