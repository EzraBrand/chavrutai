import { YERUSHALMI_TRACTATES } from '../shared/yerushalmi-data';
import * as fs from 'fs';

const BASE_URL = `http://localhost:5000`;
const PROGRESS_FILE = 'scripts/yerushalmi-progress.json';

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
  tractate: string;
  chapter: number;
  wordCount: number;
}

interface SectionResult {
  tractate: string;
  chapter: number;
  sectionIndex: number;
  wordCount: number;
}

interface Progress {
  completedKeys: string[];
  chapters: ChapterResult[];
  sections: SectionResult[];
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

function loadProgress(): Progress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch {}
  return { completedKeys: [], chapters: [], sections: [] };
}

function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
}

async function main() {
  const progress = loadProgress();
  const completedSet = new Set(progress.completedKeys);
  const allChapters = progress.chapters;
  const allSections = progress.sections;

  const allTractates = Object.values(YERUSHALMI_TRACTATES).flat();
  let total = 0;
  for (const t of allTractates) total += t.chapters;

  console.log(`Total chapters: ${total}, already done: ${completedSet.size}\n`);

  let processed = completedSet.size;
  for (const tractate of allTractates) {
    for (let ch = 1; ch <= tractate.chapters; ch++) {
      const key = `${tractate.name}:${ch}`;
      if (completedSet.has(key)) continue;

      const slug = tractate.name.replace(/ /g, '_');
      const data = await fetchWithRetry(`${BASE_URL}/api/yerushalmi/${slug}/${ch}`);

      if (!data || !data.hebrewSections) {
        console.error(`  Failed: ${tractate.name} ch ${ch}`);
        continue;
      }

      let chapterWordCount = 0;
      data.hebrewSections.forEach((section: string, idx: number) => {
        const wc = countHebrewWords(section);
        chapterWordCount += wc;
        allSections.push({
          tractate: tractate.name,
          chapter: ch,
          sectionIndex: idx + 1,
          wordCount: wc,
        });
      });

      allChapters.push({
        tractate: tractate.name,
        chapter: ch,
        wordCount: chapterWordCount,
      });

      completedSet.add(key);
      progress.completedKeys.push(key);
      processed++;

      if (processed % 5 === 0) {
        saveProgress(progress);
        console.log(`  ${processed}/${total} — ${tractate.name} ch ${ch}: ${chapterWordCount} words`);
      }

      await new Promise(r => setTimeout(r, 50));
    }
  }

  saveProgress(progress);

  if (processed < total) {
    console.log(`\nPartial: ${processed}/${total}. Run again to continue.`);
    return;
  }

  allChapters.sort((a, b) => b.wordCount - a.wordCount);
  allSections.sort((a, b) => b.wordCount - a.wordCount);

  let totalWords = 0;
  allChapters.forEach(c => totalWords += c.wordCount);

  console.log('\n' + '='.repeat(70));
  console.log('YERUSHALMI HEBREW WORD COUNT ANALYSIS');
  console.log('='.repeat(70));

  console.log(`\nTotal Hebrew words: ${totalWords.toLocaleString()}`);
  console.log(`Total chapters: ${allChapters.length}`);
  console.log(`Total sections (segments): ${allSections.length}`);
  console.log(`Average words per chapter: ${Math.round(totalWords / allChapters.length)}`);

  console.log('\n--- TOP 20 LONGEST CHAPTERS ---');
  allChapters.slice(0, 20).forEach((c, i) => {
    console.log(`${i + 1}. ${c.tractate} Ch.${c.chapter}: ${c.wordCount.toLocaleString()} words`);
  });

  console.log('\n--- TOP 20 LONGEST SECTIONS (SEGMENTS) ---');
  allSections.slice(0, 20).forEach((s, i) => {
    console.log(`${i + 1}. ${s.tractate} Ch.${s.chapter} §${s.sectionIndex}: ${s.wordCount.toLocaleString()} words`);
  });

  const results = {
    totalWords,
    totalChapters: allChapters.length,
    totalSections: allSections.length,
    avgWordsPerChapter: Math.round(totalWords / allChapters.length),
    top20Chapters: allChapters.slice(0, 20),
    top20Sections: allSections.slice(0, 20),
    bottom20Sections: [...allSections].sort((a, b) => a.wordCount - b.wordCount).filter(s => s.wordCount > 0).slice(0, 20),
    allChapters,
  };

  fs.writeFileSync('scripts/yerushalmi-wordcount-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to scripts/yerushalmi-wordcount-results.json');
}

main().catch(console.error);
