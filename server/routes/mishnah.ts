import { Router } from "express";
import { getMishnahTractateInfo, MISHNAH_ONLY_TRACTATES } from "@shared/tractates";
import { processHebrewTextCore as processHebrewText, processEnglishText } from "@shared/text-processing";

const sefariaAPIBaseURL = "https://www.sefaria.org/api";

export function createMishnahRouter(): Router {
  const router = Router();
  const mishnahInfoCache = new Map<string, { tractate: string; chapters: number; mishnayotPerChapter: number[] }>();

  router.get("/api/mishnah/tractates", async (_req, res) => {
    try {
      const result: Record<string, Array<{ name: string; chapters: number; sefaria: string }>> = {};
      for (const [seder, tractates] of Object.entries(MISHNAH_ONLY_TRACTATES)) {
        result[seder] = tractates.map(t => ({ name: t.name, chapters: t.chapters, sefaria: t.sefaria }));
      }
      res.json({ tractates: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Mishnah tractates" });
    }
  });

  router.get("/api/mishnah/:tractate/info", async (req, res) => {
    try {
      const { tractate } = req.params;
      const tractateInfo = getMishnahTractateInfo(tractate);
      if (!tractateInfo) {
        res.status(404).json({ error: `Invalid Mishnah tractate: ${tractate}` });
        return;
      }

      const cacheKey = tractateInfo.name;
      if (mishnahInfoCache.has(cacheKey)) {
        res.json(mishnahInfoCache.get(cacheKey));
        return;
      }

      const sefariaRef = tractateInfo.sefaria;
      const response = await fetch(`https://www.sefaria.org/api/v3/texts/${sefariaRef}`);

      if (!response.ok) {
        const fallback = { tractate: tractateInfo.name, chapters: tractateInfo.chapters, mishnayotPerChapter: [] };
        res.json(fallback);
        return;
      }

      const sefariaData = await response.json();
      const mishnayotPerChapter: number[] = [];

      interface SefariaVersion {
        language?: string;
        text?: unknown[];
      }

      const versions: SefariaVersion[] = Array.isArray(sefariaData.versions) ? sefariaData.versions : [];
      const heVersion = versions.find((v) => v.language === 'he');
      if (heVersion && Array.isArray(heVersion.text)) {
        for (const chapter of heVersion.text) {
          mishnayotPerChapter.push(Array.isArray(chapter) ? chapter.length : 0);
        }
      }

      const result = {
        tractate: tractateInfo.name,
        chapters: tractateInfo.chapters,
        mishnayotPerChapter,
      };

      if (mishnayotPerChapter.length > 0) {
        mishnahInfoCache.set(cacheKey, result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in /api/mishnah/:tractate/info:', error);
      res.status(500).json({ error: "Failed to get tractate info" });
    }
  });

  router.get("/api/mishnah/:tractate/:chapter", async (req, res) => {
    try {
      const { tractate, chapter } = req.params;

      if (!/^\d+$/.test(chapter)) {
        res.status(400).json({ error: "Invalid chapter number" });
        return;
      }

      const chapterNum = parseInt(chapter, 10);

      if (chapterNum < 1) {
        res.status(400).json({ error: "Invalid chapter number" });
        return;
      }

      const tractateInfo = getMishnahTractateInfo(tractate);
      if (!tractateInfo) {
        res.status(404).json({ error: `Invalid Mishnah tractate: ${tractate}` });
        return;
      }

      if (chapterNum > tractateInfo.chapters) {
        res.status(404).json({ error: `Chapter ${chapterNum} does not exist in ${tractateInfo.name} (max: ${tractateInfo.chapters})` });
        return;
      }

      const sefariaRef = `${tractateInfo.sefaria}.${chapterNum}`;
      const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);

      if (!response.ok) {
        res.status(502).json({ error: "Failed to fetch from Sefaria" });
        return;
      }

      const sefariaData = await response.json();
      const hebrewSections = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ''];
      const englishSections = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ''];

      const processedHebrewSections = hebrewSections.map((section: string) => processHebrewText(section || ''));
      const processedEnglishSections = englishSections.map((section: string) => processEnglishText(section || ''));

      res.json({
        tractate: tractateInfo.name,
        chapter: chapterNum,
        totalChapters: tractateInfo.chapters,
        hebrewSections: processedHebrewSections,
        englishSections: processedEnglishSections,
        sefariaRef: sefariaRef.replace(/_/g, ' '),
        mishnayotCount: hebrewSections.length,
      });
    } catch (error) {
      console.error('Error in /api/mishnah:', error);
      res.status(500).json({ error: "Failed to fetch Mishnah text" });
    }
  });

  return router;
}
