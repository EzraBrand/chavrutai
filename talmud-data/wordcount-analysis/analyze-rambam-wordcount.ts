import { RAMBAM_BOOKS } from '../shared/rambam-data';

const BASE_URL = `http://localhost:5000`;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&[a-z]+;/gi, ' ');
}

function countHebrewWords(text: string): number {
  const cleaned = stripHtml(text);
  const words = cleaned.match(/[\u0590-\u05FF\uFB1D-\uFB4F]+/g);
  return words ? words.length : 0;
}

interface ChapterResult {
  hilchot: string;
  book: string;
  chapter: number;
  wordCount: number;
}

interface SectionResult {
  hilchot: string;
  book: string;
  chapter: number;
  sectionIndex: number;
  wordCount: number;
}

async function fetchWithRetry(url: string, retries = 2): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return await res.json();
    } catch (e: any) {
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

async function processBatch(tasks: Array<{hilchot: typeof RAMBAM_BOOKS[0]['hilchot'][0], ch: number}>) {
  return Promise.all(tasks.map(async ({hilchot, ch}) => {
    const data = await fetchWithRetry(`${BASE_URL}/api/rambam/${hilchot.slug}/${ch}`);
    return {hilchot, ch, data};
  }));
}

async function main() {
  const allChapters: ChapterResult[] = [];
  const allSections: SectionResult[] = [];
  let totalWords = 0;
  let totalChapters = 0;
  let totalSections = 0;

  const allHilchot = RAMBAM_BOOKS.flatMap(b => b.hilchot);
  const allTasks: Array<{hilchot: typeof allHilchot[0], ch: number}> = [];
  for (const hilchot of allHilchot) {
    for (let ch = 1; ch <= hilchot.chapters; ch++) {
      allTasks.push({hilchot, ch});
    }
  }

  console.log(`Analyzing ${allHilchot.length} Rambam Hilchot, ${allTasks.length} total chapters...\n`);

  const BATCH_SIZE = 10;
  for (let i = 0; i < allTasks.length; i += BATCH_SIZE) {
    const batch = allTasks.slice(i, i + BATCH_SIZE);
    const results = await processBatch(batch);

    for (const {hilchot, ch, data} of results) {
      if (!data || !data.hebrewSections) {
        console.error(`  Failed: ${hilchot.displayName} ch ${ch}`);
        continue;
      }

      let chapterWordCount = 0;
      data.hebrewSections.forEach((section: string, idx: number) => {
        const wc = countHebrewWords(section);
        chapterWordCount += wc;
        allSections.push({
          hilchot: hilchot.displayName,
          book: hilchot.book,
          chapter: ch,
          sectionIndex: idx + 1,
          wordCount: wc,
        });
        totalSections++;
      });

      allChapters.push({
        hilchot: hilchot.displayName,
        book: hilchot.book,
        chapter: ch,
        wordCount: chapterWordCount,
      });
      totalWords += chapterWordCount;
      totalChapters++;
    }

    if ((i / BATCH_SIZE) % 20 === 0) {
      console.log(`  Progress: ${Math.min(i + BATCH_SIZE, allTasks.length)}/${allTasks.length} chapters`);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  const missing = allTasks.length - totalChapters;
  if (missing > 0) {
    console.error(`\nWARNING: ${missing} chapters failed to fetch. Results are INCOMPLETE.`);
  }

  allChapters.sort((a, b) => b.wordCount - a.wordCount);
  allSections.sort((a, b) => b.wordCount - a.wordCount);

  console.log('\n' + '='.repeat(70));
  console.log('RAMBAM (MISHNEH TORAH) HEBREW WORD COUNT ANALYSIS');
  console.log('='.repeat(70));

  console.log(`\nTotal Hebrew words: ${totalWords.toLocaleString()}`);
  console.log(`Total chapters: ${totalChapters}`);
  console.log(`Total sections (halakhot): ${totalSections}`);
  console.log(`Average words per chapter: ${Math.round(totalWords / totalChapters)}`);

  console.log('\n--- TOP 20 LONGEST CHAPTERS ---');
  allChapters.slice(0, 20).forEach((c, i) => {
    console.log(`${i + 1}. ${c.hilchot} Ch.${c.chapter} (${c.book}): ${c.wordCount.toLocaleString()} words`);
  });

  console.log('\n--- TOP 20 LONGEST SECTIONS (HALAKHOT) ---');
  allSections.slice(0, 20).forEach((s, i) => {
    console.log(`${i + 1}. ${s.hilchot} Ch.${s.chapter} §${s.sectionIndex} (${s.book}): ${s.wordCount.toLocaleString()} words`);
  });

  const results = {
    totalWords,
    totalChapters,
    totalSections,
    avgWordsPerChapter: Math.round(totalWords / totalChapters),
    top20Chapters: allChapters.slice(0, 20),
    top20Sections: allSections.slice(0, 20),
    bottom20Sections: [...allSections].sort((a, b) => a.wordCount - b.wordCount).filter(s => s.wordCount > 0).slice(0, 20),
    allChapters,
  };

  const fs = await import('fs');
  fs.writeFileSync('scripts/rambam-wordcount-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to scripts/rambam-wordcount-results.json');
}

main().catch(console.error);
