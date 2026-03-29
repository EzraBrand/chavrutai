---
name: number-parsing
description: Add, modify, or debug number-word-to-digit conversion rules. Use when the user reports numbers displaying incorrectly in any text reader (Talmud, Bible, Mishnah, Yerushalmi), or wants to change how English number words are converted to digits.
---

# Number Parsing

## Architecture

Number-word-to-digit conversion happens in multiple layers depending on text type.

### Layer 1: Algorithmic Cardinal Parser — `shared/number-parser.ts`

Converts contiguous English number-word sequences to digits:
- `parseNumbers(text)` — main entry point, replaces all number-word sequences in text
- `tryParseCardinal(raw)` — parses a single matched sequence into an integer
- `formatCardinal(n)` — formats with commas for numbers >= 1,000

Handles: units, teens, tens, hundreds, thousands, millions, billions, "a hundred", biblical inversions ("five and twenty").

Does NOT handle: ordinals (first, fifth, tenth), fractions (half, quarter, one-third).

Standalone "one" and "two" are excluded (too ambiguous in prose).

### Layer 2: Algorithmic Ordinal Converter — `server/lib/bible-text-processing.ts`

The `convertOrdinals()` function (Bible-only, server-side) converts ordinal words to digit+suffix form BEFORE `parseNumbers()` runs. This prevents `parseNumbers` from converting the cardinal part (e.g., "twenty" → "20") and leaving the ordinal suffix orphaned (e.g., "20-fifth").

Coverage:
- Compound ordinals: "twenty-first" → "21st", "thirty-fifth" → "35th" (all tens 20-90 + all unit ordinals)
- Standalone ordinals 10-30: "tenth" → "10th", "twentieth" → "20th", "thirtieth" → "30th"
- Teens: "eleventh" → "11th" through "nineteenth" → "19th"

Order of operations in `processBibleEnglish()`: ordinals → then cardinals.

### Layer 3: Static Term Replacements — `shared/data/term-replacements.json`

Runs via `replaceTerms()`. Handles special cases:
- `ordinals_fractional`: "one-third" → "1/3rd", "two-fifths" → "2/5ths"
- `time_ordinals`: "the fifth day" → "the 5th day", "the tenth month" → "the 10th month"
- `ordinals_basic`: "third" → "3rd", "fourth" → "4th", "tenth" → "10th"
- `ordinals_compound`: "twenty-first" → "21st", "thirty-fifth" → "35th"

## Where Each Text Type Gets Processed

### Talmud / Mishnah / Yerushalmi
- `shared/text-processing.ts` → `replaceTerms()` (term replacements + ordinals) → `parseNumbers()` (cardinals)
- Both layers apply in sequence

### Bible
- Server-side: `server/lib/bible-text-processing.ts` → `processBibleEnglish()`:
  1. Comma stripping after magnitude words ("thousand, five hundred" → "thousand five hundred")
  2. `convertOrdinals()` — compound/standalone ordinals to digits
  3. `parseNumbers()` — cardinal numbers to digits
- Client-side: `client/src/lib/text-processing.ts` → `processBibleEnglishText()` → `replaceTerms()`
  - Term replacements also run on Bible text on the frontend

## Common Issues

### Numbers split across commas
Source text like "forty six thousand, five hundred" gets split into two numbers.
Fix: The comma-stripping regex in `processBibleEnglish()` handles this:
```js
.replace(/\b(thousand|million|billion),\s+/gi, '$1 ')
```

### Compound ordinals broken by cardinal parser
"twenty-fifth" becomes "20-5th" because `parseNumbers` converts "twenty" to "20" first.
Fix: `convertOrdinals()` runs BEFORE `parseNumbers()` and converts compound ordinals to digit form first.

### Ordinals converted to fractions
Rules in `ordinals_fractional` (term-replacements.json) can match ordinal contexts.
Example: `"a fifth": "1/5th"` converted Bible's "a fifth day" to "1/5th day".
Fix: Remove overly broad fractional rules. Keep specific forms like "one-fifth" or "one fifth".

### False matches in prose
The algorithmic parser excludes standalone "one" and "two" via `STANDALONE_EXCLUSIONS` in `number-parser.ts`. Add more words there if needed.

## Adding a New Rule

### For Bible ordinals:
Update `convertOrdinals()` in `server/lib/bible-text-processing.ts`:
- New compound ordinal tens → add to `TENS_MAP`
- New standalone ordinal → add to `STANDALONE_ORDINAL_MAP`

### For Talmud/Mishnah ordinals or fractions:
Add to the appropriate section in `shared/data/term-replacements.json`:
- `ordinals_fractional` for fractions (one-third, two-fifths)
- `time_ordinals` for time-context ordinals (the fifth day → the 5th day)
- `ordinals_basic` for standalone ordinals (third → 3rd)

### For cardinal number issues:
Fix in `shared/number-parser.ts`:
- Missing word → add to `UNIT_MAP` or `MAGNITUDE_MAP`
- False positive → add to `STANDALONE_EXCLUSIONS`
- Connector issue → update `CONNECTOR` regex

## Key Principle

Term replacement rules must not be so broad they match ordinal/prose contexts. The algorithmic converter is preferred because it handles all compound ordinals systematically. For Bible text, ordinals MUST be converted before cardinals to prevent partial conversion.

## Testing

After changes, verify:
1. API output: `curl http://localhost:5000/api/bible/text?book=<Book>&chapter=<Ch>` and check `englishSegments`
2. For Talmud: `curl http://localhost:5000/api/talmud/...` and check English text
3. Check the rendered page in the browser to confirm client-side processing doesn't re-break things
