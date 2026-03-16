import { useState, useEffect } from "react";
import { getTractateSlug } from "@shared/tractates";
import { getMishnahSection } from "@shared/mishnah-map";

export interface ChapterInfo {
  number: number;
  englishName: string;
  hebrewName: string;
  startFolio: number;
  startSide: 'a' | 'b';
  endFolio: number;
  endSide: 'a' | 'b';
}

const TRACTATE_FILE_MAP: Record<string, string> = {
  'arakhin': 'arakhin',
  'arachin': 'arakhin',
  'avodah zarah': 'avodah-zarah',
  'bava batra': 'bava-batra',
  'bava kamma': 'bava-kamma',
  'bava metzia': 'bava-metzia',
  'bekhorot': 'bekhorot',
  'berakhot': 'berakhot',
  'beitzah': 'beitzah',
  'beitza': 'beitzah',
  'chagigah': 'chagigah',
  'chullin': 'chullin',
  'eruvin': 'eruvin',
  'gittin': 'gittin',
  'horayot': 'horayot',
  'keritot': 'keritot',
  'ketubot': 'ketubot',
  'kiddushin': 'kiddushin',
  'makkot': 'makkot',
  'megillah': 'megillah',
  'meilah': 'meilah',
  'menachot': 'menachot',
  'moed katan': 'moed-katan',
  'nazir': 'nazir',
  'nedarim': 'nedarim',
  'niddah': 'niddah',
  'pesachim': 'pesachim',
  'rosh hashanah': 'rosh-hashanah',
  'sanhedrin': 'sanhedrin',
  'shabbat': 'shabbat',
  'shevuot': 'shevuot',
  'sotah': 'sotah',
  'sukkah': 'sukkah',
  'taanit': 'taanit',
  'tamid': 'tamid',
  'temurah': 'temurah',
  'yevamot': 'yevamot',
  'yoma': 'yoma',
  'zevachim': 'zevachim',
};

const chapterCache = new Map<string, ChapterInfo[]>();
const loadingPromises = new Map<string, Promise<ChapterInfo[]>>();
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach(cb => cb());
}

function normalizeTractateKey(tractate: string): string {
  return decodeURIComponent(tractate).toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function loadChapterData(tractateKey: string): Promise<ChapterInfo[]> {
  if (chapterCache.has(tractateKey)) {
    return chapterCache.get(tractateKey)!;
  }

  const fileName = TRACTATE_FILE_MAP[tractateKey];
  if (!fileName) return [];

  if (loadingPromises.has(fileName)) {
    return loadingPromises.get(fileName)!;
  }

  const promise = import(`../../../talmud-data/chapters/${fileName}.json`)
    .then((mod) => {
      const data = (mod.default || mod) as ChapterInfo[];
      chapterCache.set(tractateKey, data);
      for (const [key, file] of Object.entries(TRACTATE_FILE_MAP)) {
        if (file === fileName && key !== tractateKey) {
          chapterCache.set(key, data);
        }
      }
      loadingPromises.delete(fileName);
      notifySubscribers();
      return data;
    })
    .catch(() => {
      loadingPromises.delete(fileName);
      const empty: ChapterInfo[] = [];
      chapterCache.set(tractateKey, empty);
      notifySubscribers();
      return empty;
    });

  loadingPromises.set(fileName, promise);
  return promise;
}

function getChapterDataSync(tractate: string): ChapterInfo[] | null {
  const tractateKey = normalizeTractateKey(tractate);
  const cached = chapterCache.get(tractateKey);
  if (cached) return cached;

  loadChapterData(tractateKey);
  return null;
}

export async function preloadChapterData(tractate?: string) {
  if (tractate) {
    await loadChapterData(normalizeTractateKey(tractate));
  }
}

export function useChapterData(tractate: string): ChapterInfo[] {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    subscribers.add(cb);
    const key = normalizeTractateKey(tractate);
    if (!chapterCache.has(key)) {
      loadChapterData(key);
    }
    return () => { subscribers.delete(cb); };
  }, [tractate]);

  return getChapterDataSync(tractate) || [];
}

export function useFindChapterForFolio(
  tractate: string,
  folio: number,
  side: 'a' | 'b'
): ChapterInfo | null {
  const chapters = useChapterData(tractate);
  if (chapters.length === 0) return null;

  const folioNumber = folio + (side === 'b' ? 0.5 : 0);

  for (const chapter of chapters) {
    const startNumber = chapter.startFolio + (chapter.startSide === 'b' ? 0.5 : 0);
    const endNumber = chapter.endFolio + (chapter.endSide === 'b' ? 0.5 : 0);
    if (folioNumber >= startNumber && folioNumber <= endNumber) {
      return chapter;
    }
  }

  let bestMatch: ChapterInfo | null = null;
  for (const chapter of chapters) {
    const startNumber = chapter.startFolio + (chapter.startSide === 'b' ? 0.5 : 0);
    if (startNumber <= folioNumber) {
      if (!bestMatch || startNumber > (bestMatch.startFolio + (bestMatch.startSide === 'b' ? 0.5 : 0))) {
        bestMatch = chapter;
      }
    }
  }
  return bestMatch;
}

export function useChapterDataVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const cb = () => setVersion(n => n + 1);
    subscribers.add(cb);
    return () => { subscribers.delete(cb); };
  }, []);
  return version;
}

export function useMishnahChapterData(tractate: string): ChapterInfo[] {
  const chapters = useChapterData(tractate);
  const tractateKey = normalizeTractateKey(tractate);

  if (tractateKey === 'sanhedrin') {
    return chapters.map(chapter => {
      if (chapter.number === 10) {
        return { ...chapter, englishName: 'Chelek', hebrewName: 'חלק' };
      } else if (chapter.number === 11) {
        return { ...chapter, englishName: 'Eilu Hen HaNechnakin', hebrewName: 'אלו הן הנחנקין' };
      }
      return chapter;
    });
  }

  return chapters;
}

export function getChapterDataByTractate(tractate: string): ChapterInfo[] {
  return getChapterDataSync(tractate) || [];
}

export function getMishnahChapterDataByTractate(tractate: string): ChapterInfo[] {
  const chapters = getChapterDataSync(tractate) || [];
  const tractateKey = normalizeTractateKey(tractate);

  if (tractateKey === 'sanhedrin') {
    return chapters.map(chapter => {
      if (chapter.number === 10) {
        return { ...chapter, englishName: 'Chelek', hebrewName: 'חלק' };
      } else if (chapter.number === 11) {
        return { ...chapter, englishName: 'Eilu Hen HaNechnakin', hebrewName: 'אלו הן הנחנקין' };
      }
      return chapter;
    });
  }

  return chapters;
}

export function findChapterForFolio(
  tractate: string,
  folio: number,
  side: 'a' | 'b'
): ChapterInfo | null {
  const chapters = getChapterDataSync(tractate);
  if (!chapters) return null;

  const folioNumber = folio + (side === 'b' ? 0.5 : 0);

  for (const chapter of chapters) {
    const startNumber = chapter.startFolio + (chapter.startSide === 'b' ? 0.5 : 0);
    const endNumber = chapter.endFolio + (chapter.endSide === 'b' ? 0.5 : 0);
    if (folioNumber >= startNumber && folioNumber <= endNumber) {
      return chapter;
    }
  }

  let bestMatch: ChapterInfo | null = null;
  for (const chapter of chapters) {
    const startNumber = chapter.startFolio + (chapter.startSide === 'b' ? 0.5 : 0);
    if (startNumber <= folioNumber) {
      if (!bestMatch || startNumber > (bestMatch.startFolio + (bestMatch.startSide === 'b' ? 0.5 : 0))) {
        bestMatch = chapter;
      }
    }
  }

  return bestMatch;
}

export function getChapterFirstPageUrl(tractate: string, chapter: ChapterInfo): string {
  const tractateSlug = getTractateSlug(tractate);
  const folioSlug = `${chapter.startFolio}${chapter.startSide}`;
  const section = getMishnahSection(tractate, chapter.number, folioSlug);
  const anchor = section ? `#section-${section}` : '';
  return `/talmud/${tractateSlug}/${folioSlug}${anchor}`;
}

export interface MishnahChapterTalmudEntry {
  mishnahChapter: number;
  talmudChapter: number;
  talmudOrderNote?: string;
}

export const MISHNAH_CHAPTER_TALMUD_MAP: Record<string, MishnahChapterTalmudEntry[]> = {
  'menachot': [
    { mishnahChapter: 1,  talmudChapter: 1  },
    { mishnahChapter: 2,  talmudChapter: 2  },
    { mishnahChapter: 3,  talmudChapter: 3  },
    { mishnahChapter: 4,  talmudChapter: 4  },
    { mishnahChapter: 5,  talmudChapter: 5  },
    { mishnahChapter: 6,  talmudChapter: 7,  talmudOrderNote: 'In the Talmud, this chapter appears as chapter 7 — after Mishnah chapter 10' },
    { mishnahChapter: 7,  talmudChapter: 8,  talmudOrderNote: 'In the Talmud, this chapter appears as chapter 8 — after Mishnah chapter 10' },
    { mishnahChapter: 8,  talmudChapter: 9,  talmudOrderNote: 'In the Talmud, this chapter appears as chapter 9 — after Mishnah chapter 10' },
    { mishnahChapter: 9,  talmudChapter: 10, talmudOrderNote: 'In the Talmud, this chapter appears as chapter 10 — after Mishnah chapter 10' },
    { mishnahChapter: 10, talmudChapter: 6,  talmudOrderNote: 'In the Talmud, this chapter appears as chapter 6 — before Mishnah chapters 6–9' },
    { mishnahChapter: 11, talmudChapter: 11 },
    { mishnahChapter: 12, talmudChapter: 12 },
    { mishnahChapter: 13, talmudChapter: 13 },
  ],
  'megillah': [
    { mishnahChapter: 1, talmudChapter: 1 },
    { mishnahChapter: 2, talmudChapter: 2 },
    { mishnahChapter: 3, talmudChapter: 3, talmudOrderNote: 'In the Talmud, Mishnah chapters 3 and 4 appear in reverse order (chapter 4 precedes chapter 3)' },
    { mishnahChapter: 4, talmudChapter: 3, talmudOrderNote: 'In the Talmud, Mishnah chapters 3 and 4 appear in reverse order (chapter 4 precedes chapter 3)' },
  ],
  'sanhedrin': [
    { mishnahChapter: 1,  talmudChapter: 1  },
    { mishnahChapter: 2,  talmudChapter: 2  },
    { mishnahChapter: 3,  talmudChapter: 3  },
    { mishnahChapter: 4,  talmudChapter: 4  },
    { mishnahChapter: 5,  talmudChapter: 5  },
    { mishnahChapter: 6,  talmudChapter: 6  },
    { mishnahChapter: 7,  talmudChapter: 7  },
    { mishnahChapter: 8,  talmudChapter: 8  },
    { mishnahChapter: 9,  talmudChapter: 9  },
    { mishnahChapter: 10, talmudChapter: 11, talmudOrderNote: 'In the Talmud, Mishnah chapters 10 and 11 appear in reverse order (chapter 11 precedes chapter 10)' },
    { mishnahChapter: 11, talmudChapter: 10, talmudOrderNote: 'In the Talmud, Mishnah chapters 10 and 11 appear in reverse order (chapter 11 precedes chapter 10)' },
  ],
};

export function getMishnahTalmudMapping(tractate: string): MishnahChapterTalmudEntry[] | null {
  const key = normalizeTractateKey(tractate);
  return MISHNAH_CHAPTER_TALMUD_MAP[key] || null;
}
