/**
 * =============================================================================
 * ENGLISH CARDINAL NUMBER PARSER
 * =============================================================================
 *
 * Algorithmically converts English number-word sequences in text to digits.
 * Replaces the former static lookup-table approach, which was incomplete and
 * broke compound numbers like "a hundred and twenty three" → "120 3".
 *
 * ## WHAT IT HANDLES
 * - Simple units/teens:   six→6, seventeen→17
 * - Tens:                 thirty→30, ninety→90
 * - Hyphenated compounds: twenty-three→23, one-hundred-and-five→105
 * - Hundreds:             three hundred→300, nine hundred and ninety-nine→999
 * - Full compounds:       a hundred and twenty three→123
 * - Thousands+:           four thousand three hundred and twenty→4,320
 * - Millions/billions:    six million five thousand→6,005,000
 * - "a"/"an" prefix:      a hundred→100, a thousand→1,000
 * - Biblical inversions:  five and twenty→25, two and twenty thousand→22,000
 * - Case-insensitive:     A Hundred And Twenty→120
 *
 * ## WHAT IT DOES NOT HANDLE (by design)
 * - Ordinal words (first, second, third, fourth…) — not in the cardinal map;
 *   handled selectively by time_ordinals / ordinals_basic in term-replacements
 * - Fractional words (half, quarter, -thirds…) — not in the cardinal map;
 *   handled by ordinals_fractional in term-replacements (which runs first)
 * - Mixed numbers (three and a half) — "half" is not a cardinal word so the
 *   parser only sees "three", leaving "and a half" intact for the lookup table
 *
 * ## INTEGRATION
 * Called from replaceTerms() AFTER the combined term-replacement pattern so
 * that fractions and special idioms are consumed by the lookup table first.
 *
 * @see shared/text-processing.ts replaceTerms()
 * @see shared/data/term-replacements.json (ordinals_fractional, time_ordinals)
 * @see .agents/skills/number-parsing/SKILL.md
 */

// =============================================================================
// WORD → VALUE MAPS
// =============================================================================

const UNIT_MAP: Record<string, number> = {
  zero: 0,
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const MAGNITUDE_MAP: Record<string, number> = {
  hundred: 100,
  thousand: 1_000,
  million: 1_000_000,
  billion: 1_000_000_000,
};

// Words that "a" / "an" may legally precede as a synonym for "one"
const VALID_A_TARGETS = new Set(['hundred', 'thousand', 'million', 'billion']);

// =============================================================================
// SEQUENCE DETECTION REGEX
// =============================================================================

const ALL_CARDINAL_WORDS = [
  ...Object.keys(UNIT_MAP),
  ...Object.keys(MAGNITUDE_MAP),
]
  // Longest first so "nineteen" is tried before "nine", "thirteen" before "three", etc.
  .sort((a, b) => b.length - a.length);

const CARDINAL_ALT = ALL_CARDINAL_WORDS.join('|');

// Connector between number words: optional spaces + optional "and" + spaces,
// or a hyphen (for "twenty-three", "one-hundred-and-five").
const CONNECTOR = `(?:\\s+(?:and\\s+)?|-)`;

// Full pattern:
//   optional leading "a" / "an" (only meaningful before a magnitude word)
//   + first number word
//   + zero or more (connector + number word) pairs
export const NUMBER_SEQUENCE_PATTERN = new RegExp(
  `\\b(?:(?:a|an)\\s+)?(?:${CARDINAL_ALT})(?:${CONNECTOR}(?:${CARDINAL_ALT}))*\\b`,
  'gi'
);

// =============================================================================
// PARSER
// =============================================================================

/**
 * Try to parse a matched word sequence as a cardinal number.
 * Returns the integer value, or null if the input is not a valid number phrase.
 */
export function tryParseCardinal(raw: string): number | null {
  // Normalise: lower-case, replace hyphens with spaces
  const normalised = raw.toLowerCase().replace(/-/g, ' ').trim();

  // Split on whitespace, discard connector word "and"
  const tokens = normalised.split(/\s+/).filter(t => t !== 'and');
  if (tokens.length === 0) return null;

  // Handle optional leading "a" / "an"
  let leadingOne = false;
  let start = 0;
  if (tokens[0] === 'a' || tokens[0] === 'an') {
    // "a" is only valid before a magnitude word (hundred / thousand / million / billion)
    if (!tokens[1] || !VALID_A_TARGETS.has(tokens[1])) return null;
    leadingOne = true;
    start = 1;
  }

  // current: accumulator for the number below the current magnitude boundary
  // result:  accumulated total for magnitudes already pushed (thousand+)
  let current = leadingOne ? 1 : 0;
  let result = 0;

  for (let i = start; i < tokens.length; i++) {
    const token = tokens[i];

    const unitVal = UNIT_MAP[token];
    if (unitVal !== undefined) {
      current += unitVal;
      continue;
    }

    const magVal = MAGNITUDE_MAP[token];
    if (magVal !== undefined) {
      if (magVal === 100) {
        // "hundred" multiplies the running subtotal (e.g. three hundred → 300)
        current = (current === 0 ? 1 : current) * 100;
      } else {
        // "thousand" / "million" / "billion" — flush current into result
        result += (current === 0 ? 1 : current) * magVal;
        current = 0;
      }
      continue;
    }

    // Unrecognised token (e.g. a stray word) — bail out, leave text unchanged
    return null;
  }

  return result + current;
}

// =============================================================================
// FORMATTER
// =============================================================================

/**
 * Format a parsed cardinal number:
 * - ≥ 1,000 → comma-separated groups ("1,000", "42,360", "1,000,000")
 * - < 1,000 → plain digits ("123", "39", "7")
 */
export function formatCardinal(n: number): string {
  if (n >= 1000) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return n.toString();
}

// =============================================================================
// PUBLIC API
// =============================================================================

// Standalone words that should NOT be converted when they appear alone.
// "one" is used as an impersonal pronoun ("does one recite", "one must") and
// "two" reads naturally as prose ("recites two blessings") far more often than
// as a numeric quantity that benefits from digit form. Both were absent from
// the former static lookup table for the same reason.
const STANDALONE_EXCLUSIONS = new Set(['one', 'two']);

/**
 * Replace all English cardinal number-word sequences in `text` with their
 * digit equivalents. Sequences that cannot be parsed are left unchanged.
 *
 * Must be called AFTER the combined term-replacement lookup so that fractions
 * and special idioms ("three and one-third" → "3⅓") are consumed first.
 */
export function parseNumbers(text: string): string {
  return text.replace(NUMBER_SEQUENCE_PATTERN, (match) => {
    // Skip standalone "one" / "two" — too ambiguous in prose.
    const lower = match.toLowerCase().trim();
    if (STANDALONE_EXCLUSIONS.has(lower)) return match;

    const value = tryParseCardinal(match);
    return value !== null ? formatCardinal(value) : match;
  });
}
