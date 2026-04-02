/**
 * Client-side text processing utilities
 * 
 * This module re-exports shared text processing functions and adds
 * client-specific features like HTML styling and formatting.
 */

// Import shared functions for local use and re-export
import {
  removeNikud,
  splitHebrewText,
  replaceTerms,
  splitEnglishText,
  processEnglishText,
  containsHebrew,
  normalizeApiText,
  processHebrewTextCore
} from '@shared/text-processing';
import { ALL_BIBLE_BOOKS } from '@shared/bible-books';

// Re-export all shared text processing functions
export {
  removeNikud,
  splitHebrewText,
  replaceTerms,
  splitEnglishText,
  processEnglishText,
  containsHebrew,
  normalizeApiText,
  processHebrewTextCore
};

/**
 * Processes Hebrew text (alias for core processing)
 * Note: Previously included HTML styling for parentheses, but that was removed
 * due to issues with Hebrew text in Niddah 47a.16 and other sections
 */
export function processHebrewText(text: string): string {
  return processHebrewTextCore(text);
}

/**
 * Basic formatting for English text - processes HTML and line breaks while preserving formatting
 * CLIENT-SPECIFIC: Creates HTML paragraph tags
 */
export function formatEnglishText(text: string): string {
  if (!text) return '';
  
  // Split text into lines and create paragraph tags with proper spacing
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return '';
  
  // Create properly spaced paragraphs
  const paragraphs = lines.map(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return '';
    return `<p class="mb-3 leading-relaxed">${trimmedLine}</p>`;
  }).filter(p => p);
  
  return paragraphs.join('');
}

const BIBLE_NAME_TO_SLUG: Record<string, string> = {};
for (const book of ALL_BIBLE_BOOKS) {
  BIBLE_NAME_TO_SLUG[book.name] = book.slug;
}

const BIBLE_BOOK_NAMES_SORTED = ALL_BIBLE_BOOKS.map(b => b.name)
  .sort((a, b) => b.length - a.length);

const BIBLE_CITATION_PATTERN = new RegExp(
  `(${BIBLE_BOOK_NAMES_SORTED.map(n => n.replace(/\s+/g, '\\s+')).join('|')})\\s+(\\d+):(\\d+)(?:\\s*[–\\-]\\s*\\d+)?`,
  'g'
);

export function linkBibleCitations(html: string): string {
  if (!html) return '';

  const anchors: string[] = [];
  let protected_ = html.replace(/<a\s[^>]*>[\s\S]*?<\/a>/gi, (match) => {
    anchors.push(match);
    return `__EXISTING_ANCHOR_${anchors.length - 1}__`;
  });
  
  const htmlTags: string[] = [];
  protected_ = protected_.replace(/<[^>]+>/g, (match) => {
    htmlTags.push(match);
    return `__LINK_HTML_${htmlTags.length - 1}__`;
  });

  protected_ = protected_.replace(BIBLE_CITATION_PATTERN, (match, book: string, chapter: string, verse: string) => {
    const normalizedBook = book.replace(/\s+/g, ' ');
    const slug = BIBLE_NAME_TO_SLUG[normalizedBook] || normalizedBook;
    return `<a href="/bible/${slug}/${chapter}#${verse}" class="bible-citation-link">${match}</a>`;
  });

  protected_ = protected_.replace(/__LINK_HTML_(\d+)__/g, (_, index) => htmlTags[parseInt(index)]);
  protected_ = protected_.replace(/__EXISTING_ANCHOR_(\d+)__/g, (_, index) => anchors[parseInt(index)]);

  return protected_;
}

/**
 * Processes Bible Hebrew text (no biblical quote styling for Ketiv-Qere notation)
 * Bible text should not apply italic styling to parentheses since those are Ketiv-Qere notations
 */
export function processBibleHebrewText(text: string): string {
  if (!text) return '';

  // Just normalize whitespace - nikud already removed by backend
  const processed = text
    .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n')  // Remove leading whitespace on new lines
    .replace(/[ \t]+\n/g, '\n')  // Remove trailing whitespace before new lines
    .trim();

  return processed;
}

/**
 * Processes Mishnah Hebrew text: just removes nikud and normalizes whitespace.
 * Unlike Talmud Hebrew, Mishnah text is already pre-split by the API,
 * so we skip the additional punctuation splitting that processHebrewText does.
 */
export function processMishnahHebrewText(text: string): string {
  if (!text) return '';

  let processed = removeNikud(text);

  processed = processed
    .replace(/אומרים,/g, 'אומרים:')
    .replace(/אומר,/g, 'אומר:')
    .replace(/אמרו לו,/g, 'אמרו לו:')
    .replace(/(אמרו להם\s+[^,\n]+),/g, '$1:')
    .replace(/אמרו להם,/g, 'אמרו להם:')
    .replace(/אמר להם,/g, 'אמר להם:')
    .replace(/אמר לו רבי ([^,\n]+),/g, 'אמר לו רבי $1:')
    .replace(/אמר רבי ([^,\n]+),/g, 'אמר רבי $1:')
    .replace(/אמר לו,/g, 'אמר לו:')
    .replace(/(אמר\s+[^,\n]+),/g, '$1:')
    .replace(/אמר,/g, 'אמר:')
    .replace(/ואלו הן,/g, 'ואלו הן:')
    .replace(/(אלו\s+[^.\n]+)\./g, '$1:')
    .replace(/שני לו,/g, 'שני לו:')
    .replace(/שלישי לו,/g, 'שלישי לו:')
    .replace(/(איזהו\s+[^,\n]+),/g, '$1?')
    .replace(/(ואיזו היא\s+[^,\n]+),/g, '$1?')
    .replace(/(מה בין\s+[^.\n]+)\./g, '$1?')
    .replace(/(כיצד\s+[^,.\n]+)[,.]/g, '$1?')
    .replace(/כיצד\./g, 'כיצד?')
    .replace(/כיצד,/g, 'כיצד?')
    .replace(/במה דברים אמורים,/g, 'במה דברים אמורים?')
    .replace(/אימתי,/g, 'אימתי?')
    .replace(/זה הכלל,/g, 'זה הכלל:')
    .replace(/(איזהו\s+[^.\n]+)\./g, '$1?')
    .replace(/(באיזה\s+[^,\n]+),/g, '$1?')
    .replace(/(באיזה\s+[^.\n]+)\./g, '$1?')
    .replace(/(מאימתי\s+[^.\n]+)\./g, '$1?');

  processed = processed
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

  return processed;
}

/**
 * Processes Mishnah English text: splits by punctuation into separate lines.
 * Mishnah English is pure translation (like Bible), so we split on sentence-ending
 * punctuation (periods, semicolons, colons, question marks, exclamation marks)
 * to create line-by-line display matching the Hebrew layout.
 */
export function processMishnahEnglishText(text: string): string {
  if (!text) return '';

  let processed = text
    .replace(/<[^>]*>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  processed = processed
    .replace(/\bsaid,/g, 'said:')
    .replace(/\bR\.\s/g, "R' ")
    .replace(/\bJoshua\b/g, 'Yehoshua')
    .replace(/\bJudah\b/g, 'Yehuda')
    .replace(/\bYose\b/g, 'Yosei')
    .replace(/\bIshmael\b/g, 'Yishmael')
    .replace(/\bAkiba\b/g, 'Akiva')
    .replace(/\bZadok\b/g, 'Tzadok')
    .replace(/\bEleazar\b/g, 'Elazar')
    .replace(/\bBeth Hillel\b/g, 'Beit Hillel')
    .replace(/\bBeth Shammai\b/g, 'Beit Shammai')
    .replace(/\bthyself\b/gi, (m) => m[0] === 'T' ? 'Yourself' : 'yourself')
    .replace(/\bthy\b/gi, (m) => m[0] === 'T' ? 'Your' : 'your')
    .replace(/\bMt\.\s/g, 'Mount ')
    .replace(/\bi\.e\./g, 'i\x00e\x00')
    .replace(/\be\.g\./g, 'e\x00g\x00')
    .replace(/\bibid\./g, 'ibid\x00')
    .replace(/\bb\.\s/g, 'b\x00 ')
    .replace(/R'/g, 'R\x00')
    .replace(/([.;:?!,])(?![\]\)'])(?=[\[A-Z])/g, '$1\n')
    .replace(/([.;:?!,])(?![\]\)'])\s+(?!\))/g, '$1\n')
    .replace(/R\x00/g, "R'")
    .replace(/i\x00e\x00/g, 'i.e.')
    .replace(/e\x00g\x00/g, 'e.g.')
    .replace(/ibid\x00/g, 'ibid.')
    .replace(/b\x00/g, 'b.');

  processed = processed
    .replace(/\n{3,}/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

  return processed;
}

/**
 * Processes Rambam Hebrew text: removes nikud and normalizes whitespace.
 * Starts identical to processMishnahHebrewText; Rambam-specific rules added as needed.
 */
export function processRambamHebrewText(text: string): string {
  if (!text) return '';

  let processed = removeNikud(text);

  processed = processed
    .replace(/אומרים,/g, 'אומרים:')
    .replace(/אומר,/g, 'אומר:')
    .replace(/אמרו לו,/g, 'אמרו לו:')
    .replace(/(אמרו להם\s+[^,\n]+),/g, '$1:')
    .replace(/אמרו להם,/g, 'אמרו להם:')
    .replace(/אמר להם,/g, 'אמר להם:')
    .replace(/אמר לו רבי ([^,\n]+),/g, 'אמר לו רבי $1:')
    .replace(/אמר רבי ([^,\n]+),/g, 'אמר רבי $1:')
    .replace(/אמר לו,/g, 'אמר לו:')
    .replace(/(אמר\s+[^,\n]+),/g, '$1:')
    .replace(/אמר,/g, 'אמר:')
    .replace(/ואלו הן,/g, 'ואלו הן:')
    .replace(/(אלו\s+[^.\n]+)\./g, '$1:')
    .replace(/זה הכלל,/g, 'זה הכלל:')
    .replace(/(איזהו\s+[^,\n]+),/g, '$1?')
    .replace(/(ואיזו היא\s+[^,\n]+),/g, '$1?')
    .replace(/(מה בין\s+[^.\n]+)\./g, '$1?')
    .replace(/(כיצד\s+[^,.\n]+)[,.]/g, '$1?')
    .replace(/כיצד\./g, 'כיצד?')
    .replace(/כיצד,/g, 'כיצד?')
    .replace(/במה דברים אמורים,/g, 'במה דברים אמורים?')
    .replace(/אימתי,/g, 'אימתי?');

  processed = processed
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/:$/, '.')
    .trim();

  return processed;
}

/**
 * Processes Rambam English text (Touger translation): strips HTML tags and splits into lines.
 * NOTE: Footnote extraction (parseSectionFootnotes) must be called BEFORE this function
 * so that the raw HTML with footnote markers is processed first.
 * Starts identical to processMishnahEnglishText.
 */
export function processRambamEnglishText(text: string): string {
  if (!text) return '';

  // Step 1: Protect <sup data-note-ref> elements — restored AFTER sentence splitting
  // so splitting patterns can see the period that precedes each footnote marker.
  const protectedSups: string[] = [];
  let processed = text.replace(/<sup[^>]*data-note-ref[^>]*>[\s\S]*?<\/sup>/g, (match) => {
    protectedSups.push(match);
    return `\x00RAMBAM_NOTE_${protectedSups.length - 1}\x00`;
  });

  // Step 2: Protect <em>/<i> italic content — normalize both to <em> so italics display.
  // Restored AFTER all splitting/cleanup so HTML doesn't interfere with text patterns.
  const protectedItalics: string[] = [];
  processed = processed.replace(/<(?:em|i)>([\s\S]*?)<\/(?:em|i)>/gi, (_, content) => {
    protectedItalics.push(`<em>${content}</em>`);
    return `\x00RAMBAM_ITALIC_${protectedItalics.length - 1}\x00`;
  });

  // Step 3: Strip remaining HTML (other tags like <b>, <span>, etc.), normalize whitespace
  processed = processed
    .replace(/<[^>]*>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Step 4: Protect abbreviations so their periods don't trigger sentence splits
  processed = processed
    .replace(/\bR\.\s/g, "R' ")
    .replace(/\bi\.e\./g, 'i\x00e\x00')
    .replace(/\be\.g\./g, 'e\x00g\x00')
    .replace(/\bibid\./g, 'ibid\x00')
    .replace(/\bb\.\s/g, 'b\x00 ')
    .replace(/R'/g, 'R\x00');

  // Step 5: Sentence splitting — must run BEFORE sup/italic restoration.
  // Pattern A: period/etc. immediately followed by a sup placeholder (e.g. "build.¹ Below")
  processed = processed
    .replace(/([.;:?!])(\x00RAMBAM_NOTE_\d+\x00)\s*/g, '$1$2\n')
    // Pattern A2: period/etc. followed by italic placeholder — same logic
    .replace(/([.;:?!])(\x00RAMBAM_ITALIC_\d+\x00)\s*/g, '$1$2\n')
    // Pattern B: period/etc. directly followed by uppercase or [
    .replace(/([.;:?!])(?![\]\)'])(?=[\[A-Z])/g, '$1\n')
    // Pattern C: period/etc. followed by whitespace (not followed by closing paren)
    .replace(/([.;:?!])(?![\]\)'])\s+(?!\))/g, '$1\n')
    // Pattern D: split before a), b), c)... and i), ii), iii), iv)... list items
    .replace(/([;:.])\s*([a-z]{1,4}\))/g, '$1\n$2');

  // Step 6: Restore abbreviations
  processed = processed
    .replace(/R\x00/g, "R'")
    .replace(/i\x00e\x00/g, 'i.e.')
    .replace(/e\x00g\x00/g, 'e.g.')
    .replace(/ibid\x00/g, 'ibid.')
    .replace(/b\x00/g, 'b.');

  // Step 7: Restore footnote sups — land after the newline that split their sentence
  processed = processed.replace(/\x00RAMBAM_NOTE_(\d+)\x00/g, (_, i) => protectedSups[parseInt(i)]);

  // Step 8: Restore italic placeholders
  processed = processed.replace(/\x00RAMBAM_ITALIC_(\d+)\x00/g, (_, i) => protectedItalics[parseInt(i)]);

  // Step 9: Final cleanup
  processed = processed
    .replace(/\n{3,}/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/:$/, '.')
    .trim();

  return processed;
}

/**
 * Simpler processing for Bible English text - no auto-splitting
 * (Backend already handles verse splitting and HTML processing)
 */
export function processBibleEnglishText(text: string): string {
  if (!text) return '';

  // Backend has already:
  // - Replaced HTML-wrapped divine names with "YHWH"
  // - Stripped all HTML tags
  // - Split verses into segments
  
  // Apply shared term replacements
  let processed = replaceTerms(text);

  // Normalize whitespace
  processed = processed
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')  // Multiple line breaks to double
    .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n')  // Remove leading whitespace on new lines
    .replace(/[ \t]+\n/g, '\n')  // Remove trailing whitespace before new lines
    .trim();

  return processed;
}
