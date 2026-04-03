import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { normalizeSefariaTractateName, isValidTractate } from "@shared/tractates";
import { processHebrewTextCore as processHebrewText, processEnglishText } from "@shared/text-processing";

const sefariaAPIBaseURL = "https://www.sefaria.org/api";

const textQuerySchema = z.object({
  work: z.string(),
  tractate: z.string(), 
  chapter: z.coerce.number(),
  folio: z.coerce.number(),
  side: z.enum(['a', 'b'])
});

const tractateListSchema = z.object({
  work: z.string()
});

export function createTalmudRouter(): Router {
  const router = Router();

  router.get("/api/text", async (req, res) => {
    try {
      const { work, tractate, chapter, folio, side } = textQuerySchema.parse(req.query);
      
      if (!isValidTractate(tractate)) {
        res.status(404).json({ error: `Invalid tractate: ${tractate}` });
        return;
      }
      
      const { isValidPage } = await import('@shared/talmud-navigation');
      if (!isValidPage(tractate, folio, side as 'a' | 'b')) {
        res.status(404).json({ error: `Page does not exist: ${tractate} ${folio}${side}` });
        return;
      }
      
      let text = await storage.getText(work, tractate, chapter, folio, side);
      
      if (!text) {
        try {
          const normalizedTractate = normalizeSefariaTractateName(tractate);
          const sefariaRef = `${normalizedTractate}.${folio}${side}`;
          console.log(`Fetching from Sefaria: ${sefariaRef} (original: ${tractate})`);
          const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);
          
          if (response.ok) {
            const sefariaData = await response.json();
            
            const hebrewSections = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ''];
            const englishSections = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ''];
            
            const processedHebrewSections = hebrewSections.map((section: string) => processHebrewText(section || ''));
            const processedEnglishSections = englishSections.map((section: string) => processEnglishText(section || ''));
            
            const hebrewText = processedHebrewSections.join('\n\n');
            const englishText = processedEnglishSections.join('\n\n');
            
            let nextPageFirstSection: { hebrew: string; english: string } | null = null;
            
            try {
              const nextFolio = side === 'a' ? folio : folio + 1;
              const nextSide = side === 'a' ? 'b' : 'a';
              const nextSefariaRef = `${normalizedTractate}.${nextFolio}${nextSide}`;
              const nextResponse = await fetch(`${sefariaAPIBaseURL}/texts/${nextSefariaRef}?lang=bi&commentary=0`);
              
              if (nextResponse.ok) {
                const nextSefariaData = await nextResponse.json();
                const nextHebrewSections = Array.isArray(nextSefariaData.he) ? nextSefariaData.he : [nextSefariaData.he || ''];
                const nextEnglishSections = Array.isArray(nextSefariaData.text) ? nextSefariaData.text : [nextSefariaData.text || ''];
                
                if (nextHebrewSections[0] || nextEnglishSections[0]) {
                  nextPageFirstSection = {
                    hebrew: processHebrewText(nextHebrewSections[0] || ''),
                    english: processEnglishText(nextEnglishSections[0] || '')
                  };
                }
              }
            } catch (nextPageError) {
              console.log('Could not fetch next page for continuation:', nextPageError);
            }

            const newText = {
              work,
              tractate,
              chapter,
              folio,
              side,
              hebrewText,
              englishText,
              hebrewSections: processedHebrewSections,
              englishSections: processedEnglishSections,
              sefariaRef,
              nextPageFirstSection
            };
            
            text = await storage.createText(newText);
          }
        } catch (sefariaError) {
          console.error('Error fetching from Sefaria:', sefariaError);
        }
      }
      
      if (!text) {
        return res.status(404).json({ 
          message: `Text not found for ${work} ${tractate} ${chapter} ${folio}${side}` 
        });
      }
      
      res.json(text);
    } catch (error) {
      console.error('Error in /api/text:', error);
      res.status(400).json({ message: "Invalid request parameters" });
    }
  });

  router.get("/api/tractates", async (req, res) => {
    try {
      const { work } = tractateListSchema.parse(req.query);
      const { TRACTATE_LISTS } = await import('../../shared/tractates');
      
      res.json({ tractates: TRACTATE_LISTS[work as keyof typeof TRACTATE_LISTS] || [] });
    } catch (error) {
      res.status(400).json({ message: "Invalid work parameter" });
    }
  });

  router.get("/api/chapters", async (req, res) => {
    try {
      const { tractate } = z.object({ tractate: z.string() }).parse(req.query);
      
      const { TRACTATE_FOLIO_RANGES } = await import('../../shared/tractates');
      
      const maxFolio = TRACTATE_FOLIO_RANGES[tractate as keyof typeof TRACTATE_FOLIO_RANGES] || 150;
      
      const chapters = [
        { number: 1, folioRange: `2-${maxFolio}` }
      ];
      
      res.json({ chapters });
    } catch (error) {
      res.status(400).json({ message: "Invalid tractate parameter" });
    }
  });

  router.get("/api/sefaria-fetch", async (req, res) => {
    try {
      const { inputMethod, tractate, page, section, url } = req.query;

      let sefariaRef = '';
      let parsedTractate = '';
      let parsedPage = '';
      let parsedSection: number | undefined;

      if (inputMethod === 'url' && typeof url === 'string') {
        const cleanUrl = url.split('?')[0];
        const urlParts = cleanUrl.split('/');
        const reference = urlParts[urlParts.length - 1];
        
        if (!reference) {
          res.status(400).json({ error: 'Invalid URL format' });
          return;
        }

        const crossPageMatch = reference.match(/^([^.]+)\.(\d+[ab])\.(\d+)-(\d+[ab])\.(\d+)$/);
        if (crossPageMatch) {
          parsedTractate = crossPageMatch[1];
          parsedPage = crossPageMatch[2];
          parsedSection = parseInt(crossPageMatch[3]);
        } else {
          const singlePageMatch = reference.match(/^([^.]+)\.(\d+[ab])(?:\.(\d+(?:-\d+)?))?$/);
          if (!singlePageMatch) {
            res.status(400).json({ error: 'Invalid reference format' });
            return;
          }

          parsedTractate = singlePageMatch[1];
          parsedPage = singlePageMatch[2];
          if (singlePageMatch[3]) {
            const sectionPart = singlePageMatch[3].split('-')[0];
            parsedSection = parseInt(sectionPart);
          }
        }
      } else if (inputMethod === 'dropdown') {
        parsedTractate = tractate as string;
        parsedPage = page as string;
        parsedSection = (section && section !== 'all') ? parseInt(section as string) : undefined;
      } else {
        res.status(400).json({ error: 'Invalid input method' });
        return;
      }

      const normalizedTractate = normalizeSefariaTractateName(parsedTractate);
      
      const urlParts = typeof url === 'string' ? url.split('?')[0].split('/') : [];
      const reference = urlParts[urlParts.length - 1] || '';
      const crossPageRangeMatch = reference.match(/^([^.]+)\.(\d+[ab])\.(\d+)-(\d+[ab])\.(\d+)$/);
      
      let hebrewSections: string[] = [];
      let englishSections: string[] = [];
      let sectionRefs: { page: string; sectionNum: number }[] = [];
      
      if (crossPageRangeMatch) {
        const startPage = crossPageRangeMatch[2];
        const startSection = parseInt(crossPageRangeMatch[3]);
        const endPage = crossPageRangeMatch[4];
        const endSection = parseInt(crossPageRangeMatch[5]);
        
        const pagesToFetch: string[] = [];
        const startPageNum = parseInt(startPage.slice(0, -1));
        const startPageSide = startPage.slice(-1);
        const endPageNum = parseInt(endPage.slice(0, -1));
        const endPageSide = endPage.slice(-1);
        
        if (startPageNum === endPageNum) {
          if (startPageSide === 'a') {
            pagesToFetch.push(`${startPageNum}a`);
            if (endPageSide === 'b') {
              pagesToFetch.push(`${startPageNum}b`);
            }
          } else {
            pagesToFetch.push(`${startPageNum}b`);
          }
        } else {
          for (let folio = startPageNum; folio <= endPageNum; folio++) {
            if (folio === startPageNum) {
              if (startPageSide === 'a') {
                pagesToFetch.push(`${folio}a`, `${folio}b`);
              } else {
                pagesToFetch.push(`${folio}b`);
              }
            } else if (folio === endPageNum) {
              pagesToFetch.push(`${folio}a`);
              if (endPageSide === 'b') {
                pagesToFetch.push(`${folio}b`);
              }
            } else {
              pagesToFetch.push(`${folio}a`, `${folio}b`);
            }
          }
        }
        
        for (const pageRef of pagesToFetch) {
          const sefariaRef = `${normalizedTractate}.${pageRef}`;
          console.log(`Fetching from Sefaria: ${sefariaRef}`);
          const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);
          
          if (response.ok) {
            const sefariaData = await response.json();
            const pageHebrew = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ''];
            const pageEnglish = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ''];
            
            let slicedHebrew: string[];
            let slicedEnglish: string[];
            let baseNum: number;
            if (pageRef === startPage) {
              slicedHebrew = pageHebrew.slice(startSection - 1);
              slicedEnglish = pageEnglish.slice(startSection - 1);
              baseNum = startSection;
            } else if (pageRef === endPage) {
              slicedHebrew = pageHebrew.slice(0, endSection);
              slicedEnglish = pageEnglish.slice(0, endSection);
              baseNum = 1;
            } else {
              slicedHebrew = pageHebrew;
              slicedEnglish = pageEnglish;
              baseNum = 1;
            }
            hebrewSections.push(...slicedHebrew);
            englishSections.push(...slicedEnglish);
            for (let j = 0; j < slicedHebrew.length; j++) {
              sectionRefs.push({ page: pageRef, sectionNum: baseNum + j });
            }
          }
        }
      } else {
        sefariaRef = `${normalizedTractate}.${parsedPage}`;
        console.log(`Fetching from Sefaria: ${sefariaRef}`);
        const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);
        
        if (!response.ok) {
          res.status(response.status).json({ error: `Failed to fetch text from Sefaria` });
          return;
        }

        const sefariaData = await response.json();
        
        hebrewSections = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ''];
        englishSections = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ''];

        if (parsedSection !== undefined) {
          const sectionIdx = parsedSection - 1;
          const rangeMatch = reference.match(/\.(\d+)-(\d+)$/);
          
          if (rangeMatch) {
            const startSection = parseInt(rangeMatch[1]);
            const endSection = parseInt(rangeMatch[2]);
            const startIdx = startSection - 1;
            const endIdx = endSection;
            
            if (startIdx >= 0 && startIdx < hebrewSections.length) {
              hebrewSections = hebrewSections.slice(startIdx, endIdx);
              englishSections = englishSections.slice(startIdx, endIdx);
              sectionRefs = hebrewSections.map((_, j) => ({ page: parsedPage, sectionNum: startSection + j }));
            } else {
              hebrewSections = [];
              englishSections = [];
            }
          } else {
            if (sectionIdx >= 0 && sectionIdx < hebrewSections.length) {
              hebrewSections = [hebrewSections[sectionIdx]];
              englishSections = [englishSections[sectionIdx]];
              sectionRefs = [{ page: parsedPage, sectionNum: parsedSection }];
            } else {
              hebrewSections = [];
              englishSections = [];
            }
          }
        } else {
          sectionRefs = hebrewSections.map((_, j) => ({ page: parsedPage, sectionNum: j + 1 }));
        }
      }

      const processedHebrewSections = hebrewSections.map((section: string) => processHebrewText(section || ''));
      const processedEnglishSections = englishSections.map((section: string) => processEnglishText(section || ''));

      let span: string;
      if (crossPageRangeMatch) {
        const startPage = crossPageRangeMatch[2];
        const startSection = crossPageRangeMatch[3];
        const endPage = crossPageRangeMatch[4];
        const endSection = crossPageRangeMatch[5];
        span = `${parsedTractate} ${startPage}:${startSection}-${endPage}:${endSection}`;
      } else {
        const rangeMatch = reference.match(/\.(\d+)-(\d+)$/);
        if (rangeMatch) {
          const startSection = rangeMatch[1];
          const endSection = rangeMatch[2];
          span = `${parsedTractate} ${parsedPage}:${startSection}-${endSection}`;
        } else if (parsedSection) {
          span = `${parsedTractate} ${parsedPage}:${parsedSection}`;
        } else {
          span = `${parsedTractate} ${parsedPage}:1-${englishSections.length}`;
        }
      }

      res.json({
        tractate: parsedTractate,
        page: parsedPage,
        section: parsedSection,
        hebrewSections: processedHebrewSections,
        englishSections: processedEnglishSections,
        sectionRefs,
        span
      });
    } catch (error) {
      console.error('Error in /api/sefaria-fetch:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
