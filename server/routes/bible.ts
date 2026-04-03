import { Router } from "express";
import { z } from "zod";

export function createBibleRouter(): Router {
  const router = Router();

  router.get("/api/bible/text", async (req, res) => {
    try {
      const { BibleQuerySchema } = await import('@shared/schema');
      const { book, chapter } = BibleQuerySchema.parse(req.query);
      
      const { getBookBySlug, normalizeSefariaBookName } = await import('@shared/bible-books');
      const { processHebrewVerse, processEnglishVerse } = await import('../lib/bible-text-processing');
      
      const bookInfo = getBookBySlug(book);
      if (!bookInfo) {
        res.status(404).json({ error: `Invalid book: ${book}` });
        return;
      }
      
      if (chapter < 1 || chapter > bookInfo.chapters) {
        res.status(400).json({ error: `Invalid chapter ${chapter} for ${bookInfo.name}. Valid range: 1-${bookInfo.chapters}` });
        return;
      }
      
      const sefariaBookName = normalizeSefariaBookName(book);
      const sefariaRef = `${sefariaBookName}.${chapter}`;
      
      const hebrewUrl = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(sefariaRef)}`;
      console.log(`Fetching Hebrew Bible text from Sefaria: ${hebrewUrl}`);
      const hebrewResponse = await fetch(hebrewUrl);
      
      if (!hebrewResponse.ok) {
        console.error(`Sefaria API error (Hebrew): ${hebrewResponse.status} ${hebrewResponse.statusText}`);
        res.status(hebrewResponse.status).json({ error: `Failed to fetch Hebrew Bible text from Sefaria` });
        return;
      }
      
      const hebrewData = await hebrewResponse.json();
      
      const englishUrl = `https://www.sefaria.org/api/texts/${encodeURIComponent(sefariaRef)}?lang=en&ven=${encodeURIComponent('The Koren Jerusalem Bible')}&context=0`;
      console.log(`Fetching English Bible text from Sefaria: ${englishUrl}`);
      const englishResponse = await fetch(englishUrl);
      
      if (!englishResponse.ok) {
        console.error(`Sefaria API error (English): ${englishResponse.status} ${englishResponse.statusText}`);
        res.status(englishResponse.status).json({ error: `Failed to fetch English Bible text from Sefaria` });
        return;
      }
      
      const englishData = await englishResponse.json();
      
      const hebrewVerses = Array.isArray(hebrewData.versions[0]?.text) ? hebrewData.versions[0].text : [];
      const englishVerses = Array.isArray(englishData.text) ? englishData.text : [];
      
      const verses = hebrewVerses.map((hebrewVerse: string, index: number) => {
        const englishVerse = englishVerses[index] || '';
        
        return {
          verseNumber: index + 1,
          hebrewSegments: processHebrewVerse(hebrewVerse),
          englishSegments: processEnglishVerse(englishVerse)
        };
      });
      
      res.json({
        work: "Bible",
        book: bookInfo.slug,
        chapter,
        verses,
        sefariaRef,
        verseCount: verses.length
      });
    } catch (error) {
      console.error('Error in /api/bible/text:', error);
      res.status(500).json({ error: "Failed to fetch Bible text" });
    }
  });

  router.get("/api/bible/books", async (req, res) => {
    try {
      const { ALL_BIBLE_BOOKS, BIBLE_SECTIONS } = await import('@shared/bible-books');
      
      res.json({
        books: ALL_BIBLE_BOOKS,
        sections: BIBLE_SECTIONS
      });
    } catch (error) {
      console.error('Error in /api/bible/books:', error);
      res.status(500).json({ error: "Failed to fetch Bible books" });
    }
  });

  router.get("/api/bible/chapters", async (req, res) => {
    try {
      const { book } = z.object({ book: z.string() }).parse(req.query);
      const { getBookBySlug } = await import('@shared/bible-books');
      
      const bookInfo = getBookBySlug(book);
      if (!bookInfo) {
        res.status(404).json({ error: `Invalid book: ${book}` });
        return;
      }
      
      const chapters = Array.from({ length: bookInfo.chapters }, (_, i) => i + 1);
      
      res.json({ chapters });
    } catch (error) {
      console.error('Error in /api/bible/chapters:', error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  return router;
}
