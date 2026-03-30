/**
 * Bible text processing utilities
 * Handles Hebrew cantillation splitting and English formatting for Bible texts
 */

import { parseNumbers } from '../../shared/number-parser';

const TENS_MAP: Record<string, number> = {
  ten: 10, eleven: 11, twelf: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const ORDINAL_SUFFIX_MAP: Record<string, { value: number; suffix: string }> = {
  first: { value: 1, suffix: 'st' },
  second: { value: 2, suffix: 'nd' },
  third: { value: 3, suffix: 'rd' },
  fourth: { value: 4, suffix: 'th' },
  fifth: { value: 5, suffix: 'th' },
  sixth: { value: 6, suffix: 'th' },
  seventh: { value: 7, suffix: 'th' },
  eighth: { value: 8, suffix: 'th' },
  ninth: { value: 9, suffix: 'th' },
};

const STANDALONE_ORDINAL_MAP: Record<string, string> = {
  eleventh: '11th', twelfth: '12th',
  thirteenth: '13th', fourteenth: '14th', fifteenth: '15th',
  sixteenth: '16th', seventeenth: '17th', eighteenth: '18th',
  nineteenth: '19th', twentieth: '20th', thirtieth: '30th',
};

const COMPOUND_ORDINAL_TENS = Object.keys(TENS_MAP).filter(t => TENS_MAP[t] >= 20).join('|');
const COMPOUND_ORDINAL_UNITS = Object.keys(ORDINAL_SUFFIX_MAP).join('|');
const STANDALONE_ORDINALS = Object.keys(STANDALONE_ORDINAL_MAP).join('|');

const ORDINAL_PATTERN = new RegExp(
  `\\b(?:(${COMPOUND_ORDINAL_TENS})[-\\s](${COMPOUND_ORDINAL_UNITS})|(${STANDALONE_ORDINALS}))\\b`,
  'gi'
);

function convertOrdinals(text: string): string {
  return text.replace(ORDINAL_PATTERN, (_, tens, unit, standalone) => {
    if (standalone) {
      return STANDALONE_ORDINAL_MAP[standalone.toLowerCase()] || standalone;
    }
    const tensVal = TENS_MAP[tens.toLowerCase()] || 0;
    const unitInfo = ORDINAL_SUFFIX_MAP[unit.toLowerCase()];
    if (!unitInfo) return _;
    const num = tensVal + unitInfo.value;
    const lastTwo = num % 100;
    const lastOne = num % 10;
    let suffix = 'th';
    if (lastTwo !== 11 && lastOne === 1) suffix = 'st';
    else if (lastTwo !== 12 && lastOne === 2) suffix = 'nd';
    else if (lastTwo !== 13 && lastOne === 3) suffix = 'rd';
    return `${num}${suffix}`;
  });
}

/**
 * Split Hebrew verse by specific cantillation marks at word boundaries
 * CRITICAL: Split by these three marks only:
 * - U+0591 (֑) - Etnahta (from יִשְׂרָאֵ֑ל)
 * - U+0594 (֔) - Zaqef Qatan (from אִ֔ישׁ)
 * - U+0597 (֗) - Revia (from יִשְׂרָאֵ֗ל, מֹשֶׁ֗ה)
 *
 * Strategy: Strip HTML first, then find cantillation marks and extend to the next space (word boundary)
 */
function splitHebrewByCantillation(verse: string): string[] {
  if (!verse) return [];

  // CRITICAL: Strip HTML FIRST before splitting, to avoid breaking tags apart
  let text = stripHTML(verse);

  // Replace maqaf (־) with space so it becomes a word boundary
  text = text.replace(/\u05BE/g, ' ');

  // Find positions of cantillation marks (Etnahta, Zaqef Qatan, and Revia)
  const segments: string[] = [];
  let currentStart = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // Check if this character is Etnahta (֑), Zaqef Qatan (֔), or Revia (֗)
    if (char === '\u0591' || char === '\u0594' || char === '\u0597') {
      // Find the next space after this cantillation mark
      let splitPoint = i + 1;
      while (splitPoint < text.length && text[splitPoint] !== ' ' && text[splitPoint] !== '\n') {
        splitPoint++;
      }

      // Extract segment from currentStart to splitPoint
      const segment = text.substring(currentStart, splitPoint).trim();
      if (segment.length > 0) {
        segments.push(segment);
      }

      // Move past the space/newline
      currentStart = splitPoint + 1;
    }
  }

  // Add the remaining text as the last segment
  if (currentStart < text.length) {
    const lastSegment = text.substring(currentStart).trim();
    if (lastSegment.length > 0) {
      segments.push(lastSegment);
    }
  }

  // If no cantillation marks were found, return the whole text
  return segments.length > 0 ? segments : [text.trim()];
}

/**
 * Strip HTML tags, footnotes, and asterisks from text
 */
function stripHTML(text: string): string {
  if (!text) return '';

  // First, unescape HTML entities (&lt; -> <, &gt; -> >, etc.)
  let cleaned = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&thinsp;/g, ' ');  // Add thin space entity

  // Replace <br> tags with newline markers before removing other HTML
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');

  // Remove ALL sup tags (footnote markers, endFootnote markers, etc.)
  cleaned = cleaned.replace(/<sup[^>]*>.*?<\/sup>/g, '');

  // Remove Sefaria footnotes - need to handle nested <i> tags carefully
  // Strategy: find <i class="footnote">, then count opening/closing <i> tags to find the matching </i>
  while (cleaned.includes('<i class="footnote">')) {
    const startIndex = cleaned.indexOf('<i class="footnote">');
    let depth = 0;
    let endIndex = -1;

    // Start searching after the opening tag
    let searchIndex = startIndex + '<i class="footnote">'.length;

    while (searchIndex < cleaned.length) {
      // Check for opening <i> tags
      if (cleaned.substring(searchIndex).startsWith('<i>') || cleaned.substring(searchIndex).startsWith('<i ')) {
        depth++;
        searchIndex++;
      }
      // Check for closing </i> tags
      else if (cleaned.substring(searchIndex).startsWith('</i>')) {
        if (depth === 0) {
          // This is the closing tag for our footnote
          endIndex = searchIndex + '</i>'.length;
          break;
        } else {
          depth--;
          searchIndex++;
        }
      } else {
        searchIndex++;
      }
    }

    if (endIndex > startIndex) {
      // Remove the entire footnote
      cleaned = cleaned.substring(0, startIndex) + cleaned.substring(endIndex);
    } else {
      // Safety: if we can't find the closing tag, just remove the opening tag
      cleaned = cleaned.replace('<i class="footnote">', '');
      break;
    }
  }

  // Then remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Remove asterisks
  cleaned = cleaned.replace(/\*/g, '');

  // Fix BiDi rendering issues with Ketiv-Qere by ensuring proper spacing
  // Replace ) [ with ) plus nbsp plus [  to prevent space collapse
  cleaned = cleaned.replace(/\)\s+\[/g, ')\u00A0[');

  // Clean up any double spaces (but preserve newlines)
  cleaned = cleaned.replace(/[^\S\n]+/g, ' ').trim();

  return cleaned;
}

/**
 * Remove ALL nikud and cantillation marks from Hebrew, plus paragraph markers and newlines
 * Unicode ranges:
 * - Nikud: \u05B0-\u05BC, \u05C1-\u05C2, \u05C4-\u05C7
 * - Cantillation: \u0591-\u05AF, \u05BD, \u05BF, \u05C0, \u05C3
 *
 * Note: HTML is already stripped in splitHebrewByCantillation, so we just remove marks here
 */
function removeCantillationAndNikud(hebrewText: string): string {
  if (!hebrewText) return '';

  // Remove all nikud and cantillation marks
  let cleaned = hebrewText.replace(/[\u0591-\u05C7]/g, '');

  // Remove paragraph markers like {פ}, {ס}, etc.
  cleaned = cleaned.replace(/\{[פסםןךץ]\}/g, '');

  // Remove newlines and extra spaces
  cleaned = cleaned.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Process Hebrew verse: FIRST split by cantillation, THEN remove marks
 * This is the correct order - split while marks are visible, then clean
 */
export function processHebrewVerse(verse: string): string[] {
  if (!verse) return [];

  // Step 1: Split by cantillation marks (while they're still visible)
  const segments = splitHebrewByCantillation(verse);

  // Step 2: Remove nikud and cantillation from each segment
  return segments.map(segment => removeCantillationAndNikud(segment));
}

/**
 * Process an array of Hebrew verses
 */
export function processHebrewVerses(verses: string[]): string[][] {
  return verses.map(verse => processHebrewVerse(verse));
}

/**
 * Process English text: Strip HTML and replace "the Lord", "ETERNAL", "GOD", and Hebrew יהוה with "YHWH"
 */
export function processBibleEnglish(text: string): string {
  if (!text) return '';

  // FIRST: Replace HTML-wrapped divine names BEFORE stripping HTML
  // Sefaria uses patterns like: <span...> \nG<small>OD</small>\n </span>'s
  // We need to replace the entire pattern including span tags and newlines
  let processed = text
    // Pattern: <span...> G<small>OD</small> </span> (with optional newlines/spaces)
    .replace(/<span[^>]*>\s*\n?\s*G<small>OD<\/small>\s*\n?\s*<\/span>/g, 'YHWH')
    // Pattern: <span...> the? L<small>ORD</small> </span> (with optional newlines/spaces)
    .replace(/<span[^>]*>\s*\n?\s*(?:the\s+)?L<small>ORD<\/small>\s*\n?\s*<\/span>/gi, 'YHWH')
    // Pattern: "the L<small>ORD</small>" without wrapping span (MUST come before non-wrapped patterns)
    .replace(/\bthe\s+L<small>ORD<\/small>/gi, 'YHWH')
    .replace(/\bThe\s+L<small>ORD<\/small>/g, 'YHWH')
    // Also handle cases without surrounding span tags - preserve at least one space
    .replace(/\s*\n\s*G<small>OD<\/small>\s*\n\s*/g, ' YHWH ')
    .replace(/\s*\n\s*L<small>ORD<\/small>\s*\n\s*/gi, ' YHWH ');

  // THEN: Strip HTML tags (Sefaria includes footnotes as HTML)
  const noHTML = stripHTML(processed);

  // FINALLY: Replace any remaining renderings of the divine name with "YHWH"
  // IMPORTANT: Process longer phrases FIRST to avoid partial matches
  const result = noHTML
    .replace(/יהוה/g, "YHWH")
    .replace(/\bO Lord\b/g, "O YHWH")
    .replace(/\bO LORD\b/g, "O YHWH")
    .replace(/\bthe LORD\b/g, "YHWH")
    .replace(/\bThe LORD\b/g, "YHWH")
    .replace(/\bthe Lord\b/g, "YHWH")
    .replace(/\bThe Lord\b/g, "YHWH")
    .replace(/\bthe ETERNAL\b/g, "YHWH")
    .replace(/\bThe ETERNAL\b/g, "YHWH")
    .replace(/\bETERNAL\b/g, "YHWH")
    .replace(/\bLORD\b/g, "YHWH")
    .replace(/\bGOD\b/g, "YHWH")
    .replace(/\b(thousand|million|billion),\s+/gi, '$1 ')
    .replace(/Ż/g, "Tz")
    .replace(/ż/g, "tz")
    .replace(/ĥ/g, "ḥ")
    .replace(/᾽/g, "'")
    .replace(/(?<=[a-zA-Z])῾(?=[a-zA-Z])/g, "'")
    .replace(/(?<![a-zA-Z])῾(?=[a-zA-Z])/g, "")
    .replace(/\b(T|t)hy\b/g, (_, c) => c === 'T' ? 'Your' : 'your')
    .replace(/\b(T|t)hou\b/g, (_, c) => c === 'T' ? 'You' : 'you')
    .replace(/\b(T|t)hee\b/g, (_, c) => c === 'T' ? 'You' : 'you')
    .replace(/\b(S|s)houldst\b/g, (_, c) => c === 'S' ? 'Should' : 'should')
    .replace(/\b(H|h)ast\b/g, (_, c) => c === 'H' ? 'Have' : 'have');

  return parseNumbers(convertOrdinals(result));
}

/**
 * Split English text by commas, semicolons, colons, em-dashes, newlines, and sentence endings with quotes
 */
export function splitEnglishByCommas(text: string): string[] {
  if (!text) return [text];

  // Split on:
  // 1. Period/question/exclamation followed by quote - keep quote, then split
  // 2. Period/question/exclamation followed directly by space (no quote) - split here
  // 3. Commas, semicolons, colons followed by space - split here (even inside quotes)
  // 4. Em-dash - split here (with or without space)
  // 5. Newlines - split here

  // Helper to check if character is a quote (straight or curly)
  // Using Unicode escape sequences to be explicit:
  // \u0022 = " (straight quote)
  // \u201C = " (left double quotation mark)
  // \u201D = " (right double quotation mark)
  const isCloseQuote = (char: string) => char === '\u0022' || char === '\u201D';

  const segments: string[] = [];
  let currentSegment = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = i + 1 < text.length ? text[i + 1] : '';
    const charAfterNext = i + 2 < text.length ? text[i + 2] : '';

    // PRIORITY 0: Check for newline - split here
    if (char === '\n') {
      if (currentSegment.trim().length > 0) {
        segments.push(currentSegment.trim());
      }
      currentSegment = '';
      continue;
    }

    currentSegment += char;

    // PRIORITY 1: Check for period/question/exclamation followed by closing quote - keep quote, then split
    if ((char === '.' || char === '?' || char === '!') && isCloseQuote(nextChar)) {
      currentSegment += nextChar; // Add the closing quote
      segments.push(currentSegment.trim());
      currentSegment = '';
      i++; // Skip the quote
      // If there's a space after the quote, skip it too
      if (charAfterNext === ' ') {
        i++;
      }
    }
    // PRIORITY 2: Check for period/question/exclamation followed directly by space (no quote) - split here
    else if ((char === '.' || char === '?' || char === '!') && nextChar === ' ') {
      segments.push(currentSegment.trim());
      currentSegment = '';
      i++; // Skip the space
    }
    // PRIORITY 3: Check for comma, semicolon, colon followed by space - split here
    else if ((char === ',' || char === ';' || char === ':') && nextChar === ' ') {
      segments.push(currentSegment.trim());
      currentSegment = '';
      i++; // Skip the space
    }
    // PRIORITY 4: Check for em-dash - split here (with or without space)
    else if (char === '—') {
      segments.push(currentSegment.trim());
      currentSegment = '';
      // If there's a space after the em-dash, skip it
      if (nextChar === ' ') {
        i++;
      }
    }
  }

  // Add any remaining text
  if (currentSegment.trim().length > 0) {
    segments.push(currentSegment.trim());
  }

  return segments.filter(s => s.length > 0);
}

/**
 * Process English verse: Replace "the Lord" then split by commas
 */
export function processEnglishVerse(verse: string): string[] {
  if (!verse) return [];

  // First replace "the Lord" with "YHWH"
  const withYHWH = processBibleEnglish(verse);

  // Then split by commas
  return splitEnglishByCommas(withYHWH);
}

/**
 * Process an array of English verses
 */
export function processEnglishVerses(verses: string[]): string[][] {
  return verses.map(verse => processEnglishVerse(verse));
}

/**
 * Flatten processed verses into a single array for display
 * This joins all segments from all verses into one array
 */
export function flattenVerseSegments(processedVerses: string[][]): string[] {
  return processedVerses.flat();
}
