import { Router } from "express";
import { getRambamHilchotInfo, RAMBAM_INTRODUCTION } from "@shared/rambam-data";
import { processHebrewTextCore as processHebrewText } from "@shared/text-processing";

const sefariaAPIBaseURL = "https://www.sefaria.org/api";

export function createRambamRouter(): Router {
  const router = Router();
  const rambamInfoCache = new Map<string, { hilchot: string; chapters: number; halachotPerChapter: number[] }>();

  router.get("/api/rambam/:hilchot/info", async (req, res) => {
    try {
      const { hilchot } = req.params;
      const info = getRambamHilchotInfo(hilchot);
      if (!info) {
        res.status(404).json({ error: `Invalid Rambam Hilchot: ${hilchot}` });
        return;
      }

      const cacheKey = info.slug;
      if (rambamInfoCache.has(cacheKey)) {
        res.json(rambamInfoCache.get(cacheKey));
        return;
      }

      const sefariaKey = info.sefaria.replace(/ /g, '_').replace(/,/g, ',');
      const response = await fetch(`https://www.sefaria.org/api/v3/texts/${sefariaKey}`);

      if (!response.ok) {
        const fallback = { hilchot: info.displayName, chapters: info.chapters, halachotPerChapter: [] };
        res.json(fallback);
        return;
      }

      const sefariaData = await response.json();
      const halachotPerChapter: number[] = [];

      interface SefariaVersion {
        language?: string;
        text?: unknown[];
      }

      const versions: SefariaVersion[] = Array.isArray(sefariaData.versions) ? sefariaData.versions : [];
      const heVersion = versions.find((v) => v.language === 'he');
      if (heVersion && Array.isArray(heVersion.text)) {
        if (info.isFlat) {
          halachotPerChapter.push(heVersion.text.length);
        } else {
          for (const chapter of heVersion.text) {
            halachotPerChapter.push(Array.isArray(chapter) ? chapter.length : 0);
          }
        }
      }

      const result = {
        hilchot: info.displayName,
        chapters: info.chapters,
        halachotPerChapter,
      };

      if (halachotPerChapter.length > 0) {
        rambamInfoCache.set(cacheKey, result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in /api/rambam/:hilchot/info:', error);
      res.status(500).json({ error: "Failed to get Hilchot info" });
    }
  });

  router.get("/api/rambam/:hilchot/:chapter", async (req, res) => {
    try {
      const { hilchot, chapter } = req.params;

      if (!/^\d+$/.test(chapter)) {
        res.status(400).json({ error: "Invalid chapter number" });
        return;
      }

      const chapterNum = parseInt(chapter, 10);
      if (chapterNum < 1) {
        res.status(400).json({ error: "Invalid chapter number" });
        return;
      }

      const info = getRambamHilchotInfo(hilchot);
      if (!info) {
        res.status(404).json({ error: `Invalid Rambam Hilchot: ${hilchot}` });
        return;
      }

      if (chapterNum > info.chapters) {
        res.status(404).json({ error: `Chapter ${chapterNum} does not exist in ${info.displayName} (max: ${info.chapters})` });
        return;
      }

      const sefariaKey = info.sefaria.replace(/ /g, '_').replace(/,/g, ',');
      const sefariaRef = info.isFlat ? sefariaKey : `${sefariaKey}.${chapterNum}`;
      const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);

      if (!response.ok) {
        res.status(502).json({ error: "Failed to fetch from Sefaria" });
        return;
      }

      const sefariaData = await response.json();
      const hebrewSections = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ''];
      const englishSections: string[] = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ''];

      if (info.isFlat && englishSections.length > 0) {
        englishSections[0] = englishSections[0].replace(/<b>The Rambam's Introduction<\/b>/, '');
      }

      const processedHebrewSections = hebrewSections.map((section: string) => processHebrewText(section || ''));

      res.json({
        hilchot: info.displayName,
        chapter: chapterNum,
        totalChapters: info.chapters,
        hebrewSections: processedHebrewSections,
        englishSections,
        sefariaRef: info.isFlat ? info.sefaria : info.sefaria + `.${chapterNum}`,
        halachotCount: hebrewSections.length,
      });
    } catch (error) {
      console.error('Error in /api/rambam/:hilchot/:chapter:', error);
      res.status(500).json({ error: "Failed to fetch Rambam text" });
    }
  });

  return router;
}
