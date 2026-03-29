import { YERUSHALMI_HEBREW_NAMES } from "@shared/yerushalmi-data";
import { numberToHebrewGematria } from "@/lib/external-links";

export interface YerushalmiExternalLink {
  name: string;
  url: string;
  type: 'chapter';
  description?: string;
}

export function getYerushalmiWikisourceLink(tractate: string, chapter: number): string {
  const hebrewName = YERUSHALMI_HEBREW_NAMES[tractate];
  if (!hebrewName) return '';
  const hebrewChapter = numberToHebrewGematria(chapter);
  const pageName = `ירושלמי_${hebrewName.replace(/ /g, '_')}_${hebrewChapter}`;
  return `https://he.wikisource.org/wiki/${encodeURIComponent(pageName)}`;
}

export function getYerushalmiChapterLinks(tractate: string, chapter: number, sefariaRef: string): YerushalmiExternalLink[] {
  const links: YerushalmiExternalLink[] = [];

  links.push({
    name: 'Sefaria',
    url: `https://www.sefaria.org.il/${sefariaRef.replace(/ /g, '_')}`,
    type: 'chapter',
    description: 'View this chapter on Sefaria',
  });

  const wikisourceUrl = getYerushalmiWikisourceLink(tractate, chapter);
  if (wikisourceUrl) {
    links.push({
      name: 'Wikisource',
      url: wikisourceUrl,
      type: 'chapter',
      description: 'View this chapter on Hebrew Wikisource',
    });
  }

  return links;
}
