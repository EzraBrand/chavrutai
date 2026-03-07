/**
 * =============================================================================
 * TALMUD TEXT PROCESSING MODULE
 * =============================================================================
 * 
 * Shared text processing utilities for Hebrew and English Talmud text formatting.
 * This module is environment-agnostic and can be used by both server and client.
 * DOM-specific operations (e.g., HTML styling) should remain in client library.
 * 
 * ## ARCHITECTURE OVERVIEW
 * 
 * The module processes bilingual Hebrew-English Talmud text from Sefaria API:
 * 
 * 1. HEBREW PROCESSING (splitHebrewText, processHebrewTextCore):
 *    - Removes nikud (vowel points) for cleaner display
 *    - Splits text into paragraphs on punctuation (periods, colons, etc.)
 *    - Handles Mishnah/Gemara section markers
 *    - Preserves HTML formatting tags
 * 
 * 2. ENGLISH PROCESSING (replaceTerms, splitEnglishText, processEnglishText):
 *    - Term replacement: Normalizes Talmudic terminology (Rabbi→R', Gemara→Talmud)
 *    - Paragraph splitting: Creates readable paragraphs based on punctuation
 *    - HTML preservation: Protects and restores HTML tags during processing
 * 
 * ## PERFORMANCE OPTIMIZATIONS
 * 
 * - Pre-compiled regex patterns at module load (not created per-call)
 * - Single-pass term replacement using combined regex (~8x faster than sequential)
 * - Longest-match-first ordering prevents partial replacements
 * - Term mappings loaded from JSON config for easy maintenance
 * 
 * ## KEY DESIGN PATTERNS
 * 
 * 1. PROTECTION PATTERN: Temporarily replace sensitive content with placeholders
 *    before processing, then restore after. Used for: HTML tags, ellipses,
 *    "son of X" patterns, etc.
 * 
 * 2. STEP-BY-STEP PROCESSING: Each function follows numbered steps for clarity
 *    and easier debugging. Comments explain WHY each step exists.
 * 
 * ## COMMON EDGE CASES
 * 
 * - Ellipses (...): Must not split on each period (issue #74)
 * - Abbreviations (Dr., i.e., e.g.): Must not split after period
 * - HTML tags: Must preserve formatting like <b>, <i>, <strong>
 * - Mishnah/Gemara markers: Special Hebrew section headers
 * - "Rabbi X, son of Rabbi Y": Must not split on internal comma
 * - Punctuation-terminated terms: "Master of the Universe," includes comma
 * 
 * ## MAINTENANCE NOTES
 * 
 * - Term replacements are in shared/data/term-replacements.json
 * - Schema validation in shared/term-replacements-schema.ts
 * - Tests in tests/text-processing.test.ts
 * - Analysis docs in docs/text-processing-analysis.md
 * 
 * @see docs/text-processing-analysis.md for detailed analysis
 */

// =============================================================================
// PRE-COMPILED REGEX PATTERNS (initialized at module load for performance)
// =============================================================================

// Hebrew processing patterns
const NIKUD_PATTERN = /[\u0591-\u05AF\u05B0-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7]/g;
const HTML_TAG_PATTERN = /<\/?\w+(?:\s+[^>]*)?>/g;
const HEBREW_QUOTE_DASH_PATTERN = /״\s*[–—]/g;

// Mishnah/Gemara marker patterns (Hebrew)
const MISHNA_STRONG_BIG_PATTERN = /<strong[^>]*><big[^>]*>(מתני['׳])<\/big><\/strong>\s*/gi;
const GEMARA_STRONG_BIG_PATTERN = /<strong[^>]*><big[^>]*>(גמ['׳])<\/big><\/strong>\s*/gi;
const GEMARA_ALT_STRONG_BIG_PATTERN = /<strong[^>]*><big[^>]*>(גמר['׳])<\/big><\/strong>\s*/gi;
const BIG_STRONG_CONTENT_PATTERN = /<big[^>]*><strong[^>]*>([^<]+)<\/strong><\/big>/gi;
const STRONG_BIG_CONTENT_PATTERN = /<strong[^>]*><big[^>]*>([^<]+)<\/big><\/strong>/gi;
const MISHNA_MARKER_PATTERN = /מתני['׳](?!\w)/g;
const GEMARA_MARKER_PATTERN = /גמ['׳](?!\w)/g;
const GEMARA_ALT_MARKER_PATTERN = /גמר['׳](?!\w)/g;
const IRONY_PUNCT_PATTERN = /\?\!/g;
const QUESTION_NOT_EXCLAIM_PATTERN = /\?(?![\!״])/g;
const EXCLAIM_NOT_QUESTION_PATTERN = /(?<!\?)\!(?!״)/g;

// English processing patterns
const RABBI_VOCATIVE_PATTERN = /\bRabbi,/g;
const RABBI_GENERAL_PATTERN = /\bRabbi(?![!s])/g;
const BARAITA_REDUNDANT_PATTERN = /(A baraita states)(<\/(?:b|strong)>)?\s+in a(?:\s+|(?:\s*<(?:i|em)>))baraita(?:<\/(?:i|em)>)?/gi;
const SON_OF_PATTERN = /,\s*(?:the\s+)?son of\s+[^,;:.]+,?/gi;
const MISHNA_GEMARA_ENG_PATTERN = /<strong[^>]*>(MISHNA|GEMARA):<\/strong>/gi;
const BR_TAG_PATTERN = /<br\s*\/?>/gi;
const BOLD_CONTENT_PATTERN = /<(b|strong)[^>]*>([\s\S]*?)<\/\1>/g;
const BOLD_COMMA_PATTERN = /(?<!\d)<(b|strong)[^>]*>,<\/\1>(?![""\u201C\u201D'\u2018\u2019]|\d)/g;
const BOLD_COLON_PATTERN = /<(b|strong)[^>]*>:<\/\1>/g;
const CROSS_TAG_COMMA_PATTERN = /(?<!\d)<\/(b|strong)>,(?![""\u201C\u201D'\u2018\u2019]|\d)(\s*)<\1[^>]*>/g;
const CROSS_TAG_COLON_PATTERN = /<\/(b|strong)>:(\s*)<\1[^>]*>/g;
const ELLIPSIS_PATTERN = /\.{2,}/g;
const TRIPLE_PUNCT_PATTERN = /([,.\?!;])[''\u2018\u2019][""\u201C\u201D]/g;
const COMMA_QUOTE_PATTERN = /,[""\u201C\u201D'\u2018\u2019](?![""\u201C\u201D'\u2018\u2019])/g;
const PERIOD_QUOTE_PATTERN = /\.[""\u201C\u201D'\u2018\u2019](?![""\u201C\u201D'\u2018\u2019])/g;
const PERIOD_SPLIT_PATTERN = /\.(?![""\u201C\u201D'\u2018\u2019]|\s*[a-z]|,)/g;
const QUESTION_QUOTE_PATTERN = /\?[""\u201C\u201D'\u2018\u2019](?![""\u201C\u201D'\u2018\u2019])/g;
const QUESTION_OTHER_PATTERN = /\?(?![""\u201C\u201D'\u2018\u2019])/g;
const BOLD_COMMA_COLON_TEST = /[,:]/;
const BOLD_COLON_SPLIT = /:/g;
const BOLD_COMMA_SPLIT = /,(?![""\u201C\u201D'\u2018\u2019]|\d)(?<!\d)(?<!\.)/g;

// Whitespace normalization patterns
const MULTI_NEWLINE_PATTERN = /\n\s*\n/g;
const LEADING_TRAILING_WS_PATTERN = /^\s+|\s+$/g;
const NEWLINE_LEADING_WS_PATTERN = /\n\s+/g;
const MULTI_SPACE_TAB_PATTERN = /[ \t]+/g;
const NEWLINE_LEADING_SPACE_PATTERN = /\n[ \t]+/g;
const TRAILING_SPACE_NEWLINE_PATTERN = /[ \t]+\n/g;

// Abbreviation fix patterns
const IE_FIX_PATTERN = /i\.e\.\n/g;
const EG_FIX_PATTERN = /e\.g\.\n/g;
const ETC_FIX_PATTERN = /etc\.\n/g;
const VS_FIX_PATTERN = /vs\.\n/g;
const CF_FIX_PATTERN = /cf\.\n/g;

// Orphaned quote patterns
const ORPHAN_QUOTE_COMMA_PATTERN = /,\n\n[""\u201C\u201D'\u2018\u2019]\s*\n/g;
const ORPHAN_QUOTE_NO_PUNCT_PATTERN = /(?<![,.\?!;''\u2018\u2019""\u201C\u201D])\n[""\u201C\u201D'\u2018\u2019]\s*\n/g;
const ORPHAN_QUOTE_END_PATTERN = /(?<![,.\?!;''\u2018\u2019""\u201C\u201D])\n[""\u201C\u201D'\u2018\u2019]\s*$/g;

// =============================================================================
// TERM REPLACEMENT DATA STRUCTURES (loaded from JSON config)
// =============================================================================

import termReplacementsConfig from './data/term-replacements.json';
import { loadTermReplacements, buildCombinedPattern, TermReplacementsConfigSchema } from './term-replacements-schema';

// Validate config at module load
const validatedConfig = TermReplacementsConfigSchema.parse(termReplacementsConfig);

// Load terms from JSON config
const TERM_LOOKUP_MAP: Map<string, string> = loadTermReplacements(validatedConfig);

// Build combined regex pattern from loaded terms
const COMBINED_TERM_PATTERN: RegExp = buildCombinedPattern(TERM_LOOKUP_MAP);


// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Removes nikud (vowel points and cantillation marks) from Hebrew text
 */
export function removeNikud(hebrewText: string): string {
  return hebrewText.replace(NIKUD_PATTERN, '');
}

/**
 * Split Hebrew Talmud text into paragraphs based on punctuation marks.
 * 
 * Hebrew Talmud text from Sefaria typically contains:
 * - Mishnah (מתני׳) and Gemara (גמ׳) section markers with special formatting
 * - Various punctuation: periods, colons, Hebrew quotation marks (״)
 * - HTML formatting tags for emphasis
 * 
 * This function creates readable paragraphs by inserting newlines after
 * punctuation marks, while preserving formatting and protecting special
 * patterns from incorrect splitting.
 * 
 * ## PROTECTION PATTERN
 * Content that should NOT be split (HTML tags, ellipses, special clusters)
 * is temporarily replaced with placeholders like __HTML_TAG_0__, processed,
 * then restored at the end.
 * 
 * @param text - Hebrew text to split into paragraphs
 * @returns Text with newlines inserted after punctuation marks
 */
export function splitHebrewText(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  // STEP 1: Handle Mishnah/Gemara section markers
  // These are special headers in Talmud text wrapped in <strong><big> tags
  // We extract them and add a newline to separate from following content
  // Examples: <strong><big>מתני׳</big></strong>, <strong><big>גמ׳</big></strong>
  processedText = processedText.replace(MISHNA_STRONG_BIG_PATTERN, '$1\n');
  processedText = processedText.replace(GEMARA_STRONG_BIG_PATTERN, '$1\n');
  processedText = processedText.replace(GEMARA_ALT_STRONG_BIG_PATTERN, '$1\n');
  // Also handle reversed nesting: <big><strong>...</strong></big>
  processedText = processedText.replace(BIG_STRONG_CONTENT_PATTERN, '$1');
  processedText = processedText.replace(STRONG_BIG_CONTENT_PATTERN, '$1');
  
  // STEP 2: Protect HTML tags with placeholders
  // HTML tags like <b>, </i>, <strong> should not be affected by splitting
  // We replace them with unique placeholders and restore later
  const htmlTags: string[] = [];
  const htmlPlaceholders: string[] = [];
  
  processedText = processedText.replace(HTML_TAG_PATTERN, (match) => {
    const placeholder = `__HTML_TAG_${htmlTags.length}__`;
    htmlTags.push(match);
    htmlPlaceholders.push(placeholder);
    return placeholder;
  });
  
  // STEP 3: Protect special punctuation clusters that should stay together
  // Hebrew quotation mark followed by dash: ״—
  const protectedClusters: string[] = [];
  processedText = processedText.replace(HEBREW_QUOTE_DASH_PATTERN, (match) => {
    protectedClusters.push(match);
    return `___PROTECTED_${protectedClusters.length - 1}___`;
  });
  
  // STEP 3b: Protect ellipses (... or more dots) from being split (issue #74)
  // Without this, "..." becomes ".\n.\n.\n" which breaks quotations
  processedText = processedText.replace(/\.{2,}/g, (match) => {
    protectedClusters.push(match);
    return `___PROTECTED_${protectedClusters.length - 1}___`;
  });
  
  // STEP 4: Split after unwrapped Mishnah/Gemara markers
  // These are the markers without HTML wrapping
  processedText = processedText.replace(MISHNA_MARKER_PATTERN, (match) => match + '\n');
  processedText = processedText.replace(GEMARA_MARKER_PATTERN, (match) => match + '\n');
  processedText = processedText.replace(GEMARA_ALT_MARKER_PATTERN, (match) => match + '\n');
  
  // STEP 5: Handle irony punctuation (?!) as a unit
  // This combined punctuation should not split between ? and !
  processedText = processedText.replace(IRONY_PUNCT_PATTERN, '?!\n');
  
  // STEP 5b: Remove dash that immediately follows a question mark (? — or ? –)
  // In Talmudic text this cluster marks a rhetorical question+answer separator;
  // the dash carries no additional split value once the ? already splits the line.
  processedText = processedText.replace(/\?\s*[–—]/g, '?');

  // STEP 6: Split on individual punctuation marks
  // Each mark gets a newline after it to create paragraph breaks
  // Hebrew-specific: ׃ (sof pasuq)
  // NOTE: ״ (gershayim/Hebrew quotation marks) are NOT split on - they mark quoted words inline
  const singleMarks = ['.', ',', '–', '—', ':', ';', '!', '?', ' - ', '׃'];
  
  singleMarks.forEach(mark => {
    if (mark === '?') {
      // Don't split on ? if followed by ! (handled in STEP 5)
      processedText = processedText.replace(QUESTION_NOT_EXCLAIM_PATTERN, '?\n');
    } else if (mark === '!') {
      // Don't split on ! if preceded by ? (handled in STEP 5)
      processedText = processedText.replace(EXCLAIM_NOT_QUESTION_PATTERN, '!\n');
    } else {
      const regex = new RegExp(`(${mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
      processedText = processedText.replace(regex, `$1\n`);
    }
  });
  
  // STEP 7: Clean up excessive newlines and whitespace
  processedText = processedText
    .replace(MULTI_NEWLINE_PATTERN, '\n')
    .replace(LEADING_TRAILING_WS_PATTERN, '')
    .replace(NEWLINE_LEADING_WS_PATTERN, '\n');
  
  // STEP 8: Restore HTML tags from placeholders
  htmlPlaceholders.forEach((placeholder, index) => {
    processedText = processedText.replace(placeholder, htmlTags[index]);
  });
  
  // STEP 9: Restore protected punctuation clusters
  processedText = processedText.replace(/___PROTECTED_(\d+)___/g, (match, index) => {
    return protectedClusters[parseInt(index)];
  });
  
  return processedText;
}

/**
 * Processes Hebrew text by removing nikud and normalizing spacing
 */
export function processHebrewTextCore(text: string): string {
  if (!text) return '';
  
  let processed = removeNikud(text);
  processed = splitHebrewText(processed);
  
  processed = processed
    .replace(MULTI_SPACE_TAB_PATTERN, ' ')
    .replace(NEWLINE_LEADING_SPACE_PATTERN, '\n')
    .replace(TRAILING_SPACE_NEWLINE_PATTERN, '\n')
    .trim();
    
  return processed;
}

/**
 * Replace specific terms in English Talmud text with preferred alternatives.
 * 
 * This function normalizes Talmudic terminology for modern readers:
 * - "Rabbi X" → "R' X" (standard abbreviation)
 * - "Gemara" → "Talmud" (more accessible term)
 * - "phylacteries" → "tefillin" (Hebrew term preferred)
 * - Ordinal numbers: "third" → "3rd", "one-third" → "1/3rd"
 * - And 200+ other term replacements from shared/data/term-replacements.json
 * 
 * ## PERFORMANCE
 * Uses single-pass regex replacement (~8x faster than sequential passes).
 * All terms are combined into one regex pattern, sorted longest-first to
 * prevent partial matches (e.g., "engages in sexual relations" before "sexual relations").
 * 
 * ## SPECIAL CASES
 * - "Rabbi," (vocative with comma) → "Rabbi!" (exclamation for direct address)
 * - "Rabbis" (plural) is preserved, not replaced
 * - Punctuation-terminated terms: "Master of the Universe," includes the comma
 * 
 * @param text - English text to process
 * @returns Text with terms replaced
 */
export function replaceTerms(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  // STEP 0a: Normalize animal-related terms with variable whitespace after comma
  // Sefaria API sometimes inserts newlines/extra spaces: "small,\n domesticated animals"
  // Normalize to single space so the term lookup can match ", domesticated animals"
  processedText = processedText.replace(/,\s+(domesticated animals)/gi, ', $1');
  
  // STEP 0b: Normalize HTML tags splitting hyphenated terms
  // Sefaria API wraps words in <b> tags that can split terms across tags:
  // e.g., "<b>sky</b>-<b>blue wool</b>" prevents matching "sky-blue"
  // This collapses "</b>-<b>" into just "-" so "sky-blue" becomes matchable
  processedText = processedText.replace(/<\/b>-<b>/g, '-');
  
  // STEP 1: Handle Rabbi special cases first (complex logic, not in combined pattern)
  // "Rabbi," (vocative) → "Rabbi!" to mark direct address
  processedText = processedText.replace(RABBI_VOCATIVE_PATTERN, 'Rabbi!');
  // "Rabbi X" → "R' X" but NOT "Rabbis" (negative lookahead for 's')
  processedText = processedText.replace(RABBI_GENERAL_PATTERN, "R'");
  
  // STEP 2: Single-pass replacement for all terms from JSON config
  // Combined regex matches all terms; callback looks up replacement in Map
  processedText = processedText.replace(COMBINED_TERM_PATTERN, (match) => {
    return TERM_LOOKUP_MAP.get(match.toLowerCase()) || match;
  });
  
  // STEP 3: Post-processing cleanup
  // Remove redundant "in a baraita" when preceded by "A baraita states"
  // e.g., "A baraita states in a baraita" → "A baraita states"
  processedText = processedText.replace(BARAITA_REDUNDANT_PATTERN, '$1$2');
  
  return processedText;
}

/**
 * Split English Talmud text into paragraphs based on punctuation marks.
 * 
 * English Talmud text from Sefaria contains:
 * - Translated Talmudic discussions with complex sentence structures
 * - Genealogical patterns: "Rabbi X, son of Rabbi Y, said..."
 * - HTML formatting for emphasis and structure
 * - Abbreviations (i.e., e.g., etc.) that should not trigger splits
 * 
 * This function creates readable paragraphs by inserting newlines after
 * periods, question marks, semicolons, etc., while handling numerous
 * edge cases that would otherwise break the text incorrectly.
 * 
 * ## PROCESSING ORDER MATTERS
 * Steps are carefully ordered: protection → splitting → restoration.
 * Changing the order can introduce bugs. See step comments for details.
 * 
 * ## COMMON EDGE CASES HANDLED
 * - "Rabbi X, son of Rabbi Y" - internal comma should not split
 * - "i.e.", "e.g.", "etc." - abbreviations should not split after period
 * - Ellipses "..." - should not split into three pieces
 * - Bold punctuation <b>,</b> - should trigger split, not be protected
 * - Cross-tag punctuation </b>,<b> - should split at the punctuation
 * 
 * @param text - English text to split into paragraphs
 * @returns Text with newlines inserted after punctuation marks
 */
export function splitEnglishText(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  // STEP -1: Protect "X, [the] son of Y" patronymic patterns
  // These contain commas that should NOT trigger paragraph splits
  // Example: "Rabbi Yosef, son of Rabbi Hiyya, said" → don't split at commas
  const sonOfProtections: string[] = [];
  processedText = processedText.replace(SON_OF_PATTERN, (match) => {
    sonOfProtections.push(match);
    return `__SON_OF_PROTECTION_${sonOfProtections.length - 1}__`;
  });
  
  // STEP 0: Remove special formatting from MISHNA/GEMARA markers
  processedText = processedText.replace(MISHNA_GEMARA_ENG_PATTERN, '$1:');
  
  // Convert <br> tags to newlines
  processedText = processedText.replace(BR_TAG_PATTERN, '\n');
  
  // Split on bolded commas and colons BEFORE protecting HTML tags
  processedText = processedText.replace(BOLD_CONTENT_PATTERN, (match, tagName, content) => {
    if (!BOLD_COMMA_COLON_TEST.test(content)) {
      return match;
    }
    
    let splitContent = content;
    splitContent = splitContent.replace(BOLD_COLON_SPLIT, ':\n');
    splitContent = splitContent.replace(BOLD_COMMA_SPLIT, ',\n');
    
    return `<${tagName}>${splitContent}</${tagName}>`;
  });
  
  // Handle cases where just the comma or colon itself is bolded
  processedText = processedText.replace(BOLD_COMMA_PATTERN, ',\n');
  processedText = processedText.replace(BOLD_COLON_PATTERN, ':\n');
  
  // Handle cross-tag scenarios
  processedText = processedText.replace(CROSS_TAG_COMMA_PATTERN, (match, tagName, whitespace) => {
    return `,\n${whitespace}`;
  });
  processedText = processedText.replace(CROSS_TAG_COLON_PATTERN, (match, tagName, whitespace) => {
    return `:\n${whitespace}`;
  });
  
  // Protect ellipses
  const ellipsisProtections: string[] = [];
  processedText = processedText.replace(ELLIPSIS_PATTERN, (match) => {
    ellipsisProtections.push(match);
    return `__ELLIPSIS_${ellipsisProtections.length - 1}__`;
  });
  
  // Protect HTML tags
  const htmlTags: string[] = [];
  const htmlPlaceholders: string[] = [];
  
  processedText = processedText.replace(HTML_TAG_PATTERN, (match) => {
    const placeholder = `__HTML_TAG_${htmlTags.length}__`;
    htmlTags.push(match);
    htmlPlaceholders.push(placeholder);
    return placeholder;
  });
  
  // Handle triple-punctuation clusters FIRST
  processedText = processedText.replace(TRIPLE_PUNCT_PATTERN, (match) => match + '\n');
  
  // Handle comma + end quote pattern
  processedText = processedText.replace(COMMA_QUOTE_PATTERN, (match) => match + '\n');
  
  // Split on periods
  processedText = processedText.replace(PERIOD_QUOTE_PATTERN, (match) => match + '\n');
  processedText = processedText.replace(PERIOD_SPLIT_PATTERN, '.\n');
  processedText = processedText.replace(IE_FIX_PATTERN, 'i.e.');
  processedText = processedText.replace(EG_FIX_PATTERN, 'e.g.');
  processedText = processedText.replace(ETC_FIX_PATTERN, 'etc.');
  processedText = processedText.replace(VS_FIX_PATTERN, 'vs.');
  processedText = processedText.replace(CF_FIX_PATTERN, 'cf.');
  
  // Split on question marks
  processedText = processedText.replace(QUESTION_QUOTE_PATTERN, (match) => match + '\n');
  processedText = processedText.replace(QUESTION_OTHER_PATTERN, '?\n');
  
  // Split on semicolons - handle semicolon + quote clusters first (issue #90)
  // Pattern: ];", ];" or similar - split AFTER the full cluster, not in the middle
  processedText = processedText.replace(/;[""\u201C\u201D'\u2018\u2019](?![""\u201C\u201D'\u2018\u2019])/g, (match) => match + '\n');
  processedText = processedText.replace(/;(?![""\u201C\u201D'\u2018\u2019])/g, ';\n');
  
  // Clean up
  processedText = processedText
    .replace(MULTI_NEWLINE_PATTERN, '\n')
    .replace(LEADING_TRAILING_WS_PATTERN, '')
    .replace(NEWLINE_LEADING_WS_PATTERN, '\n');
  
  // Restore HTML tags
  htmlPlaceholders.forEach((placeholder, index) => {
    processedText = processedText.replace(placeholder, htmlTags[index]);
  });
  
  // Restore "son of" protected patterns
  sonOfProtections.forEach((original, index) => {
    processedText = processedText.replace(`__SON_OF_PROTECTION_${index}__`, original);
  });
  
  // Restore ellipses
  ellipsisProtections.forEach((original, index) => {
    processedText = processedText.replace(`__ELLIPSIS_${index}__`, original);
  });
  
  // Final cleanup: Fix orphaned quotes
  processedText = processedText
    .replace(ORPHAN_QUOTE_COMMA_PATTERN, ',\n\n')
    .replace(ORPHAN_QUOTE_NO_PUNCT_PATTERN, '\n')
    .replace(ORPHAN_QUOTE_END_PATTERN, '');
  
  return processedText;
}

/**
 * Processes English text to preserve and enhance formatting
 */
export function processEnglishText(text: string): string {
  if (!text) return '';
  
  let processed = text;
  
  processed = replaceTerms(processed);
  processed = splitEnglishText(processed);
  
  processed = processed
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(MULTI_SPACE_TAB_PATTERN, ' ')
    .replace(NEWLINE_LEADING_SPACE_PATTERN, '\n')
    .replace(TRAILING_SPACE_NEWLINE_PATTERN, '\n')
    .trim();
  
  return processed;
}

/**
 * Utility to detect if text contains Hebrew characters
 */
export function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

/**
 * Utility to clean and normalize text from API responses
 */
export function normalizeApiText(text: string | string[]): string {
  if (Array.isArray(text)) {
    return text.join('\n\n');
  }
  return text || '';
}

// Export version info for debugging
export const TEXT_PROCESSING_VERSION = 'v2';
