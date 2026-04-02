import { numberToHebrewGematria } from "@/lib/external-links";
import { getRambamHilchotInfo } from "@shared/rambam-data";

export interface RambamExternalLink {
  name: string;
  url: string;
  type: 'section' | 'chapter';
  description?: string;
}

export function getRambamSectionLinks(hilchotSlug: string, chapter: number, halacha: number): RambamExternalLink[] {
  const info = getRambamHilchotInfo(hilchotSlug);
  if (!info) return [];

  const links: RambamExternalLink[] = [];

  if (info.alHatorah) {
    links.push({
      name: 'Al HaTorah',
      url: `https://rambam.alhatorah.org/Full/${info.alHatorah}/${chapter}.${halacha}`,
      type: 'section',
      description: `Al HaTorah Rambam – ${info.displayName} ${chapter}:${halacha}`,
    });
  }

  const hebrewChapter = numberToHebrewGematria(chapter);
  const hebrewHalacha = numberToHebrewGematria(halacha);
  const wikisourcePage = `רמב"ם_הלכות_${info.wikisourceHebrew}_${hebrewChapter}_${hebrewHalacha}`;
  links.push({
    name: 'Wikisource',
    url: `https://he.wikisource.org/wiki/${encodeURIComponent(wikisourcePage)}`,
    type: 'section',
    description: `Hebrew Wikisource – ${info.displayName} ${chapter}:${halacha}`,
  });

  return links;
}

export function getRambamChapterLinks(hilchotSlug: string, chapter: number): RambamExternalLink[] {
  const info = getRambamHilchotInfo(hilchotSlug);
  if (!info) return [];

  const links: RambamExternalLink[] = [];
  const sefariaKey = info.sefaria.replace(/ /g, '_').replace(/,/g, ',');

  links.push({
    name: 'Sefaria',
    url: `https://www.sefaria.org/${sefariaKey}.${chapter}`,
    type: 'chapter',
    description: 'View this chapter on Sefaria',
  });

  if (info.alHatorah) {
    links.push({
      name: 'Al HaTorah',
      url: `https://rambam.alhatorah.org/Full/${info.alHatorah}/${chapter}.1`,
      type: 'chapter',
      description: 'View this chapter on Al HaTorah',
    });
  }

  const hebrewChapter = numberToHebrewGematria(chapter);
  const wikisourcePage = `רמב"ם_הלכות_${info.wikisourceHebrew}_${hebrewChapter}`;
  links.push({
    name: 'Wikisource',
    url: `https://he.wikisource.org/wiki/${encodeURIComponent(wikisourcePage)}`,
    type: 'chapter',
    description: 'View this chapter on Hebrew Wikisource',
  });

  return links;
}
