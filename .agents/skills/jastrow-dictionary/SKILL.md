# Jastrow Dictionary Skill

Use when modifying or extending the Jastrow Dictionary page (`/dictionary`). This skill documents how the dictionary works and where to make changes.

## Architecture Overview

The Jastrow Dictionary is a modernized web presentation of Marcus Jastrow's *Dictionary of the Targumim, the Talmud Babli and Yerushalmi, and the Midrashic Literature*. It fetches data from the Sefaria API and applies client-side text transformations for readability.

## Data Flow

1. **User searches or browses** → frontend sends request to Express backend
2. **Backend (`server/storage.ts`, class `SefariaAPI`)** → queries Sefaria's Lexicon API (`/api/words/` and `/api/words/completion/`)
3. **Backend transforms** → `flattenSenses()` simplifies nested sense structures; `transformHyperlinks()` converts internal Sefaria links to absolute URLs
4. **Frontend (`client/src/pages/dictionary.tsx`)** → applies `expandAbbreviations()` (using `jastrow-mappings.json`) and `splitIntoParagraphs()` for display formatting

## Key Files

| File | Purpose |
|---|---|
| `client/src/pages/dictionary.tsx` | Main UI component, text processing (abbreviation expansion, paragraph splitting, copy handler) |
| `client/src/data/jastrow-mappings.json` | Abbreviation → full-name mapping dictionary (tractates, books, grammatical terms, etc.) |
| `server/routes.ts` (lines ~2200–2248) | Three API endpoints: `/api/dictionary/search`, `/api/dictionary/browse`, `/api/dictionary/autosuggest` |
| `server/storage.ts` (class `SefariaAPI`, lines ~129–464) | Backend logic: `searchEntries()`, `browseByLetter()`, `getAutosuggest()`, `flattenSenses()`, `transformHyperlinks()` |
| `shared/schema.ts` | Zod schemas: `dictionaryEntrySchema`, `searchRequestSchema`, `browseRequestSchema`, `autosuggestRequestSchema` |

## API Endpoints

- `GET /api/dictionary/search?query=<term>` — Search for a specific Hebrew/Aramaic word
- `GET /api/dictionary/browse?letter=<letter>` — Browse entries starting with a Hebrew letter
- `GET /api/dictionary/autosuggest?query=<term>` — Autocomplete suggestions

## Text Processing Pipeline (Frontend)

Applied in this order when rendering each dictionary entry sense:

1. **`splitIntoParagraphs(text)`** — Splits on em-dash/en-dash characters into `<p>` blocks
2. **`splitByPeriodAndLink(text)`** — Splits into new lines when a period+space is followed by a hyperlinked word (e.g., `it). Bava` or `ten. Berakhot`)
3. **`convertSuperscriptLetters(text)`** — Converts tiny/superscript Unicode letters (ᵃ, ᵇ, ᶜ, ᵈ) to standard-size letters
4. **`expandAbbreviations(text)`** — Replaces scholarly abbreviations with full names using `jastrow-mappings.json`

## Abbreviation Mappings (`jastrow-mappings.json`)

- Sorted longest-first to avoid partial replacements
- Only replaces text outside HTML tags (using negative lookahead `(?![^<]*>)`)
- Categories: Talmudic tractates, biblical books, midrashic literature, Torah portions, grammatical terms, manuscripts, secondary literature, general terms
- Binyan abbreviations include trailing colons for readability (e.g., `"Af."` → `"Af'el:"`)

## URL Search Parameters

The dictionary page syncs search state with URL parameters for shareability:
- `?q=<term>` — Search query (triggers automatic search on page load)
- `?letter=<letter>` — Browse by letter (triggers automatic browse on page load)

These are set via `window.history.replaceState` and read on mount via `URLSearchParams`.

## Adding New Abbreviation Mappings

1. Open `client/src/data/jastrow-mappings.json`
2. Add entry to `mappings` object: `"Abbr.": "Full expansion"`
3. Longer abbreviations take priority (sorted by length at runtime)
4. Use trailing colon in expansion for grammatical form labels (e.g., binyanim)
5. Test with a dictionary entry that uses the abbreviation

## Adding New Text Transformations

1. Add a new function in `dictionary.tsx` (alongside `splitIntoParagraphs`, `expandAbbreviations`, etc.)
2. Apply it in the rendering pipeline inside the `results.map()` block (line ~639)
3. Order matters: structural splits first, then text replacements
