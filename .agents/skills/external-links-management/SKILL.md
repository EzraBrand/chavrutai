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
- **Mishnah Al HaTorah** (`MISHNAH_ALHATORAH_NAMES` in `mishnah-external-links.ts`): Eruvin→Eiruvin, Rosh Hashanah→Rosh_HaShanah, Chullin→Chulin, Eduyot→Eiduyot, Kelim→Keilim, Taharot→Tahorot, plus multi-word names need underscores (Maaser Sheni→Maaser_Sheni, etc.)
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

## Auditing Al HaTorah Rambam URL Slugs

Al HaTorah's Rambam site (`rambam.alhatorah.org`) is a client-side rendered SPA. This means:
- All pages return HTTP 200 regardless of whether the hilchot name is valid or not.
- The "This page does not exist" error only appears after JavaScript runs in a browser.
- You **cannot** detect broken links by checking HTTP status codes or raw HTML content.

### How to get the canonical hilchot name list

Al HaTorah embeds its full book/hilchot name list in a small site-specific JS file. Fetch it and extract the Rambam array:

```javascript
const jsText = await (await fetch("https://rambam.alhatorah.org/site.dw.8.min.js")).text();
// Find the Rambam array in window.MG.bookNames.Rambam
const match = jsText.match(/Rambam:"([^"]+)"/);
const canonicalNames = match[1].split(",");
// canonicalNames is the authoritative list of display names in order
// Convert to URL slugs: spaces → underscores (apostrophes are kept as-is; the browser URL-encodes them)
const toSlug = (name) => name.replace(/ /g, '_');
```

The resulting list includes intro entries (e.g. "HaMadda Introduction", "Ahavah Introduction") which have no corresponding hilchot in our data — skip those when mapping. The remaining entries match the hilchot in `shared/rambam-data.ts` in order.

### Comparing against stored values

After extracting `canonicalNames` (filtered to actual hilchot, not intros), compare slug-by-slug against the `alHatorah` fields in `RAMBAM_BOOKS`:

```javascript
// canonicalHilchot = canonical names with intro lines removed, in order
// ourValues = alHatorah field values from RAMBAM_BOOKS in order
for (let i = 0; i < canonicalHilchot.length; i++) {
  const canonical = toSlug(canonicalHilchot[i]);
  const ours = ourValues[i];
  if (canonical !== ours) console.log(`MISMATCH: expected ${canonical}, got ${ours}`);
}
```

### URL format for Rambam

```
https://rambam.alhatorah.org/Full/{slug}/{chapter}.{halacha}
```

Where `{slug}` is the canonical display name with spaces replaced by underscores. Apostrophes (e.g. `Tume'at_Meit`) appear literally in the slug and are URL-encoded by the browser automatically.

### Common mismatch patterns found (April 2026 audit)

40 of 83 hilchot slugs were wrong. Recurring error types:
- **Missing underscore in compound**: `veSeferTorah` → `veSefer_Torah`
- **Spelling**: `Kriat` → `Keriat`, `Gerushin` → `Geirushin`, `Naara` → `Naarah`, `Maachalot` → `Maakhalot`, `Tumat` → `Tume'at`, `Gezelah` → `Gezeilah`, etc.
- **Different root word**: `Kli` → `Kelei`, `Issurei_HaMizbeach` → `Isurei_Mizbeach`, `Avodah` → `Avodat`
- **Shortened canonical form**: `Sanhedrin_veHaOnshin_haMesurin_lahem` → `Sanhedrin`, `Melakhim_uMilchamot` → `Melakhim`
- **Double vs single letter**: `Mammon` → `Mamon`, `Bikkurim` → `Bikurim`, `Shemitah` → `Shemittah`, `Mattanah` → `Matanah`
- **Missing apostrophes**: `Tumat_Okhalin` → `Tume'at_Okhelin`, `Sheelah_uFikkadon` → `She'eilah_uPikkadon`

## Shared Utility

`numberToHebrewGematria(num)` in `client/src/lib/external-links.ts` converts integers to Hebrew gematria strings (e.g. 5→ה, 9→ט, 15→טו). Used by Wikisource links across all readers.
