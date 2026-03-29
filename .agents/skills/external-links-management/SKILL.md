---
name: external-links-management
description: Add or modify external links (Sefaria, Al HaTorah, Wikisource, Daf Yomi, etc.) shown in text reader pages (Talmud, Mishnah, Yerushalmi, Bible). Use when the user asks to add, change, or remove external links from any reader, or add a new external site to link to.
---

# External Links Management

External links connect each reader page to the corresponding content on third-party sites (Sefaria, Al HaTorah, Hebrew Wikisource, Daf Yomi). Each reader has its own external-links helper file and renders links at two levels: **section-level** (inline next to each text segment) and **page-level** (footer at the bottom of the page).

## Architecture

### Helper files (link generation logic)

| Reader | Helper file | Hebrew names source |
|---|---|---|
| Talmud Bavli | `client/src/lib/external-links.ts` | `TRACTATE_HEBREW_NAMES` in `shared/tractates.ts` |
| Bible | `client/src/lib/bible-external-links.ts` | `hebrew` field in `shared/bible-books.ts` |
| Mishnah | `client/src/lib/mishnah-external-links.ts` | `TRACTATE_HEBREW_NAMES` + `MISHNAH_ONLY_HEBREW_NAMES` in `shared/tractates.ts` |
| Yerushalmi | `client/src/lib/yerushalmi-external-links.ts` | `YERUSHALMI_HEBREW_NAMES` in `shared/yerushalmi-data.ts` |

### Page components (rendering)

| Reader | Page component | Section links | Footer links |
|---|---|---|---|
| Talmud Bavli | `client/src/components/text/sectioned-bilingual-display.tsx` | Sefaria, Al HaTorah | via `ExternalLinksFooter` component |
| Bible | `client/src/pages/bible-chapter.tsx` | Sefaria, Al HaTorah | via `BibleExternalLinksFooter` component |
| Mishnah | `client/src/pages/mishnah-chapter.tsx` | Sefaria, Al HaTorah, Wikisource | Inline footer (Sefaria, Al HaTorah, Wikisource) |
| Yerushalmi | `client/src/pages/yerushalmi-chapter.tsx` | Sefaria only | Inline footer (Sefaria, Wikisource) |

### Footer components (dedicated)

- `client/src/components/external-links-footer.tsx` — Talmud Bavli footer
- `client/src/components/bible/bible-external-links-footer.tsx` — Bible footer
- Mishnah and Yerushalmi use inline footers directly in their page components

## URL Patterns by Site

### Sefaria
- Talmud: `https://www.sefaria.org.il/{Tractate}.{folio}{side}[.{section}]`
- Mishnah: `https://www.sefaria.org/{sefariaRef}.{mishnah}`
- Yerushalmi: `https://www.sefaria.org.il/{sectionRef}`
- Bible: `https://www.sefaria.org.il/{Book}.{chapter}[.{verse}]`

### Al HaTorah
- Talmud: `https://shas.alhatorah.org/Full/{Tractate}/{folio}{side}[.{section}]`
- Mishnah: `https://mishna.alhatorah.org/Full/{Tractate}/{chapter}[.{mishnah}]`
- Bible: `https://mg.alhatorah.org/Full/{Book}/{chapter}[.{verse}]`
- Note: uses different subdomain per corpus (shas/mishna/mg)

### Hebrew Wikisource
- Talmud: `https://he.wikisource.org/wiki/{HebrewTractate}_{HebrewFolio}_{HebrewSide}`
- Mishnah: `https://he.wikisource.org/wiki/משנה_{HebrewTractate}_{HebrewChapter}_{HebrewMishnah}`
- Yerushalmi: `https://he.wikisource.org/wiki/ירושלמי_{HebrewTractate}_{HebrewChapter}`
- Bible: `https://he.wikisource.org/wiki/{HebrewBook}_{HebrewChapter}`
- Uses `numberToHebrewGematria()` from `external-links.ts` for numeric conversion

### Daf Yomi (Tzurat HaDaf)
- Talmud only: `https://daf-yomi.com/Dafyomi_Page.aspx?massechet={id}&amud={amudId}&fs=1`
- Uses `DAF_YOMI_MASSECHET_IDS` mapping in `external-links.ts`

## Tractate Name Overrides

Some external sites use different transliterations. Override mappings:

- **Talmud Al HaTorah** (`EXTERNAL_TRACTATE_NAMES` in `external-links.ts`): Eruvin→Eiruvin, Rosh Hashanah→Rosh_HaShanah, Chullin→Chulin
- **Mishnah Al HaTorah** (`MISHNAH_ALHATORAH_NAMES` in `mishnah-external-links.ts`): Eruvin→Eiruvin, Rosh Hashanah→Rosh_HaShanah, plus multi-word names need underscores (Maaser Sheni→Maaser_Sheni, etc.)
- **Bible Al HaTorah** (`ALHATORAH_BOOK_NAMES` in `bible-external-links.ts`): Full mapping of English→transliterated Hebrew names

## How to Add a New External Site

1. Add the URL generation function to the appropriate helper file (e.g. `getMishnahNewSiteLink(tractate, chapter, mishnah)`)
2. If the site uses different tractate names, add a name override mapping
3. Add the link to the section-level links function (if per-segment) or page-level links function (if per-chapter/page)
4. Update the page component if needed (section links render inline; footer links render at page bottom)
5. Verify URLs by fetching a sample of them (use `fetch(url, { method: 'HEAD' })` to check HTTP 200)
6. Update the changelog page at `client/src/pages/changelog.tsx`

## How to Add External Links to a New Reader

1. Create a new helper file: `client/src/lib/{reader}-external-links.ts`
2. Define an interface for the link type (follow the pattern from existing files)
3. Create URL generation functions for each external site
4. Create aggregate functions: `get{Reader}SectionLinks()` and/or `get{Reader}ChapterLinks()`
5. Import and use in the page component — render section links inline and footer links at page bottom
6. Add Hebrew name mappings to the shared data file if not already present

## Shared Utility

`numberToHebrewGematria(num)` in `client/src/lib/external-links.ts` converts integers to Hebrew gematria strings (e.g. 5→ה, 9→ט, 15→טו). Used by Wikisource links across all readers.
