---
name: talmud-english-text-processing
description: Add or modify rules in the Talmud English text processing pipeline — term replacements, paragraph splitting, abbreviation protection, and punctuation handling. Use when the user reports incorrect English text display on any Talmud page, wants to fix splitting bugs, add new term replacements, or adjust how English text is formatted.
---

# Talmud English Text Processing

## Files

All Talmud English processing lives in **`shared/text-processing.ts`** (shared between server and client):

- **`replaceTerms()`** (~line 325) — term/phrase replacement (Rabbi→R', number words→digits, etc.)
- **`splitEnglishText()`** (~line 414) — paragraph splitting on punctuation
- **`processEnglishText()`** (~line 544) — orchestrator that calls `replaceTerms()` then `splitEnglishText()`

Supporting files:
- **`shared/data/term-replacements.json`** — JSON config of all term→replacement mappings
- **`shared/term-replacements-schema.ts`** — Zod schema for validating the JSON config
- **`shared/number-parser.ts`** — algorithmic cardinal number-word→digit conversion
- **`client/src/lib/text-processing.ts`** — re-exports shared functions, adds client-only HTML styling
- **`tests/text-processing.test.ts`** — all unit tests

## Pipeline Overview

`processEnglishText(text)` runs two phases in order:

### Phase 1: Term Replacement (`replaceTerms`)

1. **NFC normalization** — so diacritics in Sefaria text match our keys (e.g., ḥ)
2. **Whitespace normalization** — collapses `",\n domesticated"` → `", domesticated"` so lookups match
3. **Cross-tag hyphen collapse** — `</b>-<b>` → `-` so `sky-blue` is one matchable token
4. **Anchor-tag newline fix** — newlines inside `<a>` tags → spaces (prevents spurious splits)
5. **Bible abbreviation unwrap** — strips `<i>` around Bible-book abbreviations before `.` so term lookup sees `Deut.`
6. **Rabbi handling** — `Rabbi,` → `Rabbi!` (vocative), `Rabbi X` → `R' X` (but not `Rabbis`)
7. **Single-pass term lookup** — combined regex matches all terms from JSON config; callback replaces via Map
8. **Number parser** — converts remaining English number words to digits (runs after term lookup so fractions are already handled)
9. **Baraita dedup** — removes redundant "in a baraita" after "A baraita states"

### Phase 2: Paragraph Splitting (`splitEnglishText`)

Uses a **protect → split → restore** pattern:

#### Protection Steps (before splitting)
| Step | What is protected | Placeholder format |
|---|---|---|
| -1 | `", son of X"` patronymic commas | `__SON_OF_PROTECTION_N__` |
| HTML tags | `<b>`, `</i>`, etc. | `__HTML_TAG_N__` |
| Punct+tag+quote | `.</i>"` (period before closing tag before quote) | `__PUNCT_TAG_QUOTE_N__` |
| Ellipses | `...` (2+ dots) | `__ELLIPSIS_N__` |

#### Splitting Steps (in order)
1. **MISHNA/GEMARA markers** — `<strong>MISHNA:</strong>` → `MISHNA:`
2. **`<br>` tags** → newlines
3. **Bold punctuation** — commas/colons inside `<b>` tags trigger splits
4. **Cross-tag punctuation** — `</b>,<b>` and `</b>:<b>` trigger splits
5. **Triple-punctuation clusters** — `?'"` stays together, split after
6. **Comma + quote** — `,"` splits after the quote
7. **Period + quote** — `."` splits after the quote
8. **Bare periods** — split, BUT protected from splitting when followed by: quote chars, lowercase letter, comma, `]`, or HTML-tag placeholder+quote
9. **Abbreviation fix-ups** — rejoin `i.e.`, `e.g.`, `etc.`, `vs.`, `cf.` that were incorrectly split
10. **Question mark + quote** — `?"` splits after the quote
11. **Bare question marks** — split (not before quotes or `]`)
12. **Semicolon + quote** — `;"` splits after the quote
13. **Bare semicolons** — split (not before quotes)

#### Restoration Steps (after splitting)
1. Restore punct+tag+quote placeholders
2. Restore HTML tag placeholders
3. Restore "son of" placeholders
4. Restore ellipsis placeholders
5. **Orphan quote cleanup** — remove stray quotes left alone on a line

## Common Bug Patterns

### 1. Incorrect split inside quoted/italicized terms
**Symptom:** A closing quote `"` appears on its own line after the period.
**Cause:** HTML tags between punctuation and quote break the protection. Example: `<i>al.</i>"` — after HTML tag placeholdering, the `.` no longer "sees" the quote.
**Fix:** The punct+tag+quote protection step handles this. If a new variant appears, extend the regex in the protection step.
**Pattern:** `/[.,;?!]((?:__HTML_TAG_\d+__)+)([""\u201C\u201D'\u2018\u2019])/g`

### 2. Abbreviation splits
**Symptom:** Text splits after `i.e.` or `e.g.` or `etc.`
**Cause:** The period-split step doesn't know about the abbreviation.
**Fix:** Add a new fix-up pattern after the period-split step (e.g., `const XX_FIX_PATTERN = /xx\.\n/g;`), then add `processedText = processedText.replace(XX_FIX_PATTERN, 'xx.');`

### 3. Patronymic comma splits
**Symptom:** Text splits at `"Rabbi X,⏎son of Rabbi Y"`
**Cause:** The comma triggers a split; the "son of" pattern didn't match.
**Fix:** Extend `SON_OF_PATTERN` regex to capture the new patronymic form.

### 4. Bold/cross-tag splits not firing
**Symptom:** Text should split at a bolded comma but doesn't.
**Cause:** The bold content or cross-tag pattern doesn't match the specific HTML structure.
**Fix:** Check `BOLD_CONTENT_PATTERN`, `BOLD_COMMA_PATTERN`, `CROSS_TAG_COMMA_PATTERN` regexes.

## Adding a New Term Replacement

### Step 1: Determine the replacement type

- **Simple word/phrase swap** → add to `shared/data/term-replacements.json`
- **Regex-based (complex pattern)** → add directly in `replaceTerms()` in `shared/text-processing.ts`

### Step 2: For JSON-based replacements

Edit `shared/data/term-replacements.json`. The file has categories:
```json
{
  "categories": [
    {
      "name": "Category Name",
      "terms": [
        { "from": "source term", "to": "replacement" }
      ]
    }
  ]
}
```

Terms are matched case-insensitively. Longer terms match first (handled automatically by `buildCombinedPattern`).

### Step 3: For regex-based replacements

Add a new regex constant at the top of the file and a `.replace()` call in `replaceTerms()`. Place it in the correct step order (see Phase 1 above).

## Fixing a Splitting Bug

### Step 1: Identify the exact text

Use the Sefaria API to fetch the raw text:
```bash
curl -s "https://www.sefaria.org/api/texts/TRACTATE.FOLIOa_or_b?lang=bi&commentary=0" \
  | node -e '...'  # parse and inspect the specific segment
```

Check exact Unicode code points around the problem area — Sefaria uses smart quotes (U+201C `"`, U+201D `"`) not ASCII quotes.

### Step 2: Trace through the pipeline

Mentally or programmatically trace the text through `splitEnglishText()`:
1. What gets protected (placeholders)?
2. Which split pattern matches the problematic punctuation?
3. Is the protection step missing a case?

### Step 3: Apply the fix

- If punctuation is incorrectly splitting: add a new protection step or extend an existing protection regex
- If punctuation is NOT splitting when it should: check if a protection step is too broad
- Follow the **protect → split → restore** pattern; never reorder existing steps without understanding dependencies

### Step 4: Add a regression test

Add a test in `tests/text-processing.test.ts` under the `splitEnglishText` describe block:
```ts
it('describes the bug scenario', () => {
  const text = 'exact input reproducing the bug';
  const result = splitEnglishText(text);
  expect(result).toContain('expected substring');
  expect(result).not.toMatch(/unwanted pattern/);
});
```

### Step 5: Run tests

```bash
npx vitest run tests/text-processing.test.ts
```

All existing tests must still pass.

## Quote Characters Reference

Sefaria English text uses these quote characters:
| Character | Unicode | Name |
|---|---|---|
| `"` | U+0022 | ASCII double quote |
| `"` | U+201C | Left double quotation mark |
| `"` | U+201D | Right double quotation mark |
| `'` | U+0027 | ASCII single quote / apostrophe |
| `'` | U+2018 | Left single quotation mark |
| `'` | U+2019 | Right single quotation mark |

All split/protection regexes use the character class `[""\u201C\u201D'\u2018\u2019]` to match any of these.

## Testing

After any change, run the full test suite and visit the specific Talmud URL the user provided to confirm the fix. The app hot-reloads on save.

Example URL format: `https://chavrutai.com/talmud/Tractate/Folio#SegmentNumber`
