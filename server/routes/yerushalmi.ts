import { Router } from "express";
import fs from "fs";
import path from "path";
import { getYerushalmiTractateInfo, YERUSHALMI_TRACTATES } from "@shared/yerushalmi-data";
import { processHebrewTextCore as processHebrewText, processEnglishText } from "@shared/text-processing";

const sefariaAPIBaseURL = "https://www.sefaria.org/api";

let yerushalmiShapesData: Record<string, number[][]> = {};
try {
  const shapesPath = path.join(process.cwd(), "shared/data/yerushalmi-shapes.json");
  yerushalmiShapesData = JSON.parse(fs.readFileSync(shapesPath, "utf-8"));
} catch (e) {
  console.error("Failed to load yerushalmi-shapes.json:", e);
}

export function createYerushalmiRouter(): Router {
  const router = Router();
  const yerushalmiInfoCache = new Map<string, { tractate: string; chapters: number; halakhotPerChapter: number[] }>();

  router.get("/api/yerushalmi/tractates", async (_req, res) => {
    try {
      const result: Record<string, Array<{ name: string; chapters: number; sefaria: string }>> = {};
      for (const [seder, tractates] of Object.entries(YERUSHALMI_TRACTATES)) {
        result[seder] = tractates.map(t => ({ name: t.name, chapters: t.chapters, sefaria: t.sefaria }));
      }
      res.json({ tractates: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Yerushalmi tractates" });
    }
  });

  router.get("/api/yerushalmi/:tractate/info", async (req, res) => {
    try {
      const { tractate } = req.params;
      const tractateInfo = getYerushalmiTractateInfo(tractate);
      if (!tractateInfo) {
        res.status(404).json({ error: `Invalid Yerushalmi tractate: ${tractate}` });
        return;
      }

      const cacheKey = tractateInfo.name;
      if (yerushalmiInfoCache.has(cacheKey)) {
        res.json(yerushalmiInfoCache.get(cacheKey));
        return;
      }

      const sefariaRef = tractateInfo.sefaria;
      const response = await fetch(`https://www.sefaria.org/api/v3/texts/${sefariaRef}`);

      if (!response.ok) {
        const fallback = { tractate: tractateInfo.name, chapters: tractateInfo.chapters, halakhotPerChapter: [] };
        res.json(fallback);
        return;
      }

      const sefariaData = await response.json();
      const halakhotPerChapter: number[] = [];

      const versions: Array<{ language?: string; text?: unknown[] }> = Array.isArray(sefariaData.versions) ? sefariaData.versions : [];
      const heVersion = versions.find((v) => v.language === 'he');
      if (heVersion && Array.isArray(heVersion.text)) {
        for (const chapter of heVersion.text) {
          halakhotPerChapter.push(Array.isArray(chapter) ? chapter.length : 0);
        }
      }

      const result = {
        tractate: tractateInfo.name,
        chapters: tractateInfo.chapters,
        halakhotPerChapter,
      };

      if (halakhotPerChapter.length > 0) {
        yerushalmiInfoCache.set(cacheKey, result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in /api/yerushalmi/:tractate/info:', error);
      res.status(500).json({ error: "Failed to get Yerushalmi tractate info" });
    }
  });

  router.get("/api/yerushalmi/:tractate/shape", (req, res) => {
    const { tractate } = req.params;
    const tractateInfo = getYerushalmiTractateInfo(tractate);
    if (!tractateInfo) {
      res.status(404).json({ error: "Invalid tractate" });
      return;
    }
    const shapes = yerushalmiShapesData[tractateInfo.sefaria] ?? [];
    res.json({ shapes });
  });

  router.get("/api/yerushalmi/:tractate/:chapter", async (req, res) => {
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

      const tractateInfo = getYerushalmiTractateInfo(tractate);
      if (!tractateInfo) {
        res.status(404).json({ error: `Invalid Yerushalmi tractate: ${tractate}` });
        return;
      }

      if (chapterNum > tractateInfo.chapters) {
        res.status(404).json({ error: `Chapter ${chapterNum} does not exist in ${tractateInfo.name} (max: ${tractateInfo.chapters})` });
        return;
      }

      const sefariaBase = tractateInfo.sefaria;

      const chapterShapes: number[][] = yerushalmiShapesData[sefariaBase] ?? [];
      const halakhotSegmentCounts: number[] = chapterShapes[chapterNum - 1] ?? [];
      if (halakhotSegmentCounts.length === 0) {
        res.status(502).json({ error: "No shape data for this chapter" });
        return;
      }

      const guggenheimVersion = "versionTitle=The%20Jerusalem%20Talmud%2C%20translation%20and%20commentary%20by%20Heinrich%20W.%20Guggenheimer&versionTitleInHebrew=%D9%AA";

      const halakhotResponses = await Promise.all(
        halakhotSegmentCounts.map((_, halIdx) =>
          fetch(`${sefariaAPIBaseURL}/texts/${sefariaBase}.${chapterNum}.${halIdx + 1}?lang=bi&commentary=0&${guggenheimVersion}`)
            .then(r => r.ok ? r.json() : null)
        )
      );

      const allHebrew: string[] = [];
      const allEnglish: string[] = [];
      const sectionRefs: string[] = [];

      halakhotResponses.forEach((halData, halIdx) => {
        if (!halData) return;
        const heSegs: string[] = Array.isArray(halData.he) ? halData.he : [halData.he || ''];
        const enSegs: string[] = Array.isArray(halData.text) ? halData.text : [halData.text || ''];
        const count = Math.max(heSegs.length, enSegs.length);
        for (let segIdx = 0; segIdx < count; segIdx++) {
          allHebrew.push(heSegs[segIdx] || '');
          allEnglish.push(enSegs[segIdx] || '');
          sectionRefs.push(`${sefariaBase}.${chapterNum}.${halIdx + 1}.${segIdx + 1}`);
        }
      });

      const processedHebrewSections = allHebrew.map(s => processHebrewText(s));
      const processedEnglishSections = allEnglish.map(s => processEnglishText(s));

      res.json({
        tractate: tractateInfo.name,
        chapter: chapterNum,
        totalChapters: tractateInfo.chapters,
        hebrewSections: processedHebrewSections,
        englishSections: processedEnglishSections,
        sefariaRef: `${sefariaBase}.${chapterNum}`.replace(/_/g, ' '),
        halakhotCount: halakhotSegmentCounts.length,
        sectionRefs,
      });
    } catch (error) {
      console.error('Error in /api/yerushalmi:', error);
      res.status(500).json({ error: "Failed to fetch Yerushalmi text" });
    }
  });

  return router;
}
