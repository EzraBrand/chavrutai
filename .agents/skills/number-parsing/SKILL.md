---
name: number-parsing
description: Add, modify, or debug number-word-to-digit conversion rules. Use when the user reports numbers displaying incorrectly in any text reader (Talmud, Bible, Mishnah, Yerushalmi), or wants to change how English number words are converted to digits.
---

# Number Parsing

## Architecture

Number-word-to-digit conversion happens in two layers:

### Layer 1: Algorithmic Parser — `shared/number-parser.ts`

Converts contiguous English number-word sequences to digits:
- `parseNumbers(text)` — main entry point, replaces all number-word sequences in text
- `tryParseCardinal(raw)` — parses a single matched sequence into an integer
- `formatCardinal(n)` — formats with commas for numbers >= 1,000

Handles: units, teens, tens, hundreds, thousands, millions, billions, "a hundred", biblical inversions ("five and twenty").

Does NOT handle: ordinals (first, fifth, tenth), fractions (half, quarter, one-third).

Standalone "one" and "two" are excluded (too ambiguous in prose).

### Layer 2: Static Term Replacements — `shared/data/term-replacements.json`

Runs BEFORE the algorithmic parser. Handles special cases the parser can't:
- `ordinals_fractional`: "one-third" → "1/3rd", "two-fifths" → "2/5ths"
- `time_ordinals`: "the fifth day" → "the 5th day", "the tenth month" → "the 10th month"
- `ordinals_basic`: "third" → "3rd", "fourth" → "4th"
- `ordinals_compound`: "twenty-first" → "21st", "thirty-fifth" → "35th"

## Where Each Text Type Gets Processed

### Talmud / Mishnah / Yerushalmi
- `shared/text-processing.ts` → `replaceTerms()` (term replacements) → `parseNumbers()` (algorithmic)
- Both layers apply in sequence

### Bible
- Server-side: `server/lib/bible-text-processing.ts` → `processBibleEnglish()` → `parseNumbers()`
  - Includes a pre-processing step: commas after magnitude words (thousand/million/billion) are stripped so "forty six thousand, five hundred" parses as one number (46,500) not two (46,000 + 500)
- Client-side: `client/src/lib/text-processing.ts` → `processBibleEnglishText()` → `replaceTerms()`
  - Term replacements also run on Bible text on the frontend

## Common Issues

### Numbers split across commas
Source text like "forty six thousand, five hundred" gets split into two numbers.
Fix: The comma-stripping regex in `processBibleEnglish()` handles this:
```js
.replace(/\b(thousand|million|billion),\s+/gi, '$1 ')
```
If a new magnitude word needs handling, add it to this regex.

### Ordinals converted to fractions
Rules in `ordinals_fractional` (term-replacements.json) can match ordinal contexts.
Example: `"a fifth": "1/5th"` converted Bible's "a fifth day" to "1/5th day".
Fix: Remove overly broad fractional rules. Keep specific forms like "one-fifth" or "one fifth".

### False matches in prose
The algorithmic parser already excludes standalone "one" and "two" via `STANDALONE_EXCLUSIONS` in `number-parser.ts`. If another word causes false matches, add it to that set.

## Adding a New Number Rule

### For a fractional or ordinal pattern:
Add to the appropriate section in `shared/data/term-replacements.json`:
- `ordinals_fractional` for fractions (one-third, two-fifths)
- `time_ordinals` for time-context ordinals (the fifth day → the 5th day)
- `ordinals_basic` for standalone ordinals (third → 3rd)

### For a cardinal number issue:
Fix in `shared/number-parser.ts`:
- Missing word → add to `UNIT_MAP` or `MAGNITUDE_MAP`
- False positive → add to `STANDALONE_EXCLUSIONS`
- Connector issue → update `CONNECTOR` regex

### For Bible-specific number formatting:
Fix in `server/lib/bible-text-processing.ts` → `processBibleEnglish()`.

## Key Principle

Term replacement rules must not be so broad they match ordinal/prose contexts. When in doubt, require more specific patterns (e.g., "one-fifth" instead of "a fifth"). The algorithmic parser is safe by design — it only matches words in the cardinal map.

## Testing

After changes, verify:
1. API output: `curl http://localhost:5000/api/bible/text?book=<Book>&chapter=<Ch>` and check `englishSegments`
2. For Talmud: `curl http://localhost:5000/api/talmud/...` and check English text
3. Check the rendered page in the browser to confirm client-side processing doesn't re-break things
