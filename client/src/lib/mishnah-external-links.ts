import { TRACTATE_HEBREW_NAMES, MISHNAH_ONLY_HEBREW_NAMES } from "@shared/tractates";
import { numberToHebrewGematria } from "@/lib/external-links";

export interface MishnahExternalLink {
  name: string;
  url: string;
  type: 'section' | 'chapter';
  description?: string;
}

const MISHNAH_ALHATORAH_NAMES: Record<string, string> = {
  "Eruvin": "Eiruvin",
  "Rosh Hashanah": "Rosh_HaShanah",
  "Moed Katan": "Moed_Katan",
  "Bava Kamma": "Bava_Kamma",
  "Bava Metzia": "Bava_Metzia",
  "Bava Batra": "Bava_Batra",
  "Avodah Zarah": "Avodah_Zarah",
  "Maaser Sheni": "Maaser_Sheni",
  "Tevul Yom": "Tevul_Yom",
};

function getAlHaTorahTractateName(tractate: string): string {
  if (MISHNAH_ALHATORAH_NAMES[tractate]) return MISHNAH_ALHATORAH_NAMES[tractate];
  return tractate.replace(/ /g, '_');
}

function getMishnahHebrewName(tractate: string): string | null {
  return (TRACTATE_HEBREW_NAMES as Record<string, string>)[tractate]
    || MISHNAH_ONLY_HEBREW_NAMES[tractate]
    || null;
}

export function getMishnahAlHaTorahLink(tractate: string, chapter: number, mishnah?: number): string {
  const name = getAlHaTorahTractateName(tractate);
  if (mishnah !== undefined) {
    return `https://mishna.alhatorah.org/Full/${name}/${chapter}.${mishnah}`;
  }
  return `https://mishna.alhatorah.org/Full/${name}/${chapter}`;
}

export function getMishnahWikisourceLink(tractate: string, chapter: number, mishnah: number): string {
  const hebrewName = getMishnahHebrewName(tractate);
  if (!hebrewName) return '';
  const hebrewChapter = numberToHebrewGematria(chapter);
  const hebrewMishnah = numberToHebrewGematria(mishnah);
  const pageName = `משנה_${hebrewName.replace(/ /g, '_')}_${hebrewChapter}_${hebrewMishnah}`;
  return `https://he.wikisource.org/wiki/${encodeURIComponent(pageName)}`;
}

export function getMishnahSectionLinks(tractate: string, chapter: number, mishnah: number): MishnahExternalLink[] {
  const links: MishnahExternalLink[] = [];

  links.push({
    name: 'Al HaTorah',
    url: getMishnahAlHaTorahLink(tractate, chapter, mishnah),
    type: 'section',
    description: `Al HaTorah Mishnah - ${tractate} ${chapter}:${mishnah}`,
  });

  const wikisourceUrl = getMishnahWikisourceLink(tractate, chapter, mishnah);
  if (wikisourceUrl) {
    links.push({
      name: 'Wikisource',
      url: wikisourceUrl,
      type: 'section',
      description: `Hebrew Wikisource - ${tractate} ${chapter}:${mishnah}`,
    });
  }

  return links;
}

export function getMishnahChapterLinks(tractate: string, chapter: number, sefariaRef: string): MishnahExternalLink[] {
  const links: MishnahExternalLink[] = [];

  links.push({
    name: 'Sefaria',
    url: `https://www.sefaria.org/${sefariaRef.replace(/ /g, '_')}`,
    type: 'chapter',
    description: 'View this chapter on Sefaria',
  });

  links.push({
    name: 'Al HaTorah',
    url: getMishnahAlHaTorahLink(tractate, chapter),
    type: 'chapter',
    description: 'View this chapter on Al HaTorah',
  });

  const hebrewName = getMishnahHebrewName(tractate);
  if (hebrewName) {
    const hebrewChapter = numberToHebrewGematria(chapter);
    const pageName = `משנה_${hebrewName.replace(/ /g, '_')}_${hebrewChapter}`;
    links.push({
      name: 'Wikisource',
      url: `https://he.wikisource.org/wiki/${encodeURIComponent(pageName)}`,
      type: 'chapter',
      description: 'View this chapter on Hebrew Wikisource',
    });
  }

  return links;
}
