---
name: text-reader-checklist
description: Checklist of technical layers required when adding a new primary text reader (e.g., Jerusalem Talmud, Mishneh Torah) to ChavrutAI. Use when planning or implementing a new text corpus to ensure parity with existing Talmud Bavli, Bible, and Mishnah readers.
---

# New Text Reader Checklist

When adding a new primary text reader to ChavrutAI, every layer below must be implemented to match the existing Talmud Bavli, Bible, and Mishnah readers. Use this as a planning and review checklist.

## 1. Shared Data & Types (`shared/`)

- [ ] **Metadata file** — Create `shared/<corpus>-data.ts` (or extend `shared/tractates.ts`) with:
  - Tractate/book list with display names, chapter/section counts, and Sefaria API identifiers
  - Organized by logical groupings (Seder, section, etc.)
  - URL slug mapping (display name ↔ URL-safe slug) with normalization function
  - Validation function (`isValid<Corpus>Tractate`)
  - Info lookup function (`get<Corpus>TractateInfo`)
- [ ] **Navigation logic** — Create or extend `shared/<corpus>-navigation.ts` with:
  - Previous/next page calculation
  - Page/folio validation
  - Chapter boundary data (if applicable)
- [ ] **Text processing** — Add corpus-specific processing functions to `shared/text-processing.ts` or `client/src/lib/text-processing.ts`:
  - Hebrew text: sentence splitting, punctuation cleanup, special marker handling
  - English text: paragraph splitting, transliteration normalization, abbreviation protection

**Existing examples:**
- Talmud: `shared/tractates.ts` (SEDER_TRACTATES, getTractateSlug), `shared/talmud-navigation.ts`, `shared/talmud-data.ts`
- Bible: `shared/bible-books.ts` (TORAH_BOOKS, NEVIIM_BOOKS, KETUVIM_BOOKS, getBookBySlug)
- Mishnah: `shared/tractates.ts` (MISHNAH_ONLY_TRACTATES, MISHNAH_URL_MAP, getMishnahTractateSlug)

## 2. API Endpoints (`server/routes.ts`)

- [ ] **Text fetch endpoint** — `GET /api/<corpus>/:tractate/:chapter` (or similar):
  1. Check local storage/cache (`storage.getText`)
  2. If miss, fetch from Sefaria API (or other source)
  3. Run corpus-specific text processing
  4. Cache the result
  5. Return `{ hebrewSections, englishSections }` (same shape as existing readers)
- [ ] **Tractate info endpoint** (if needed) — `GET /api/<corpus>/:tractate/info`
  - Returns chapter count, metadata for the tractate table of contents

**Existing examples:**
- Talmud: `GET /api/text?work=Talmud Bavli&tractate=...&folio=...&side=...`
- Mishnah: `GET /api/mishnah/:tractate/:chapter`, `GET /api/mishnah/:tractate/info`
- Bible: uses the generic `/api/text` endpoint with `work=Bible`

## 3. Client Routes (`client/src/App.tsx`)

- [ ] **Three route levels** (matching existing pattern):
  - `/<corpus>` — Contents/index page (all tractates/books)
  - `/<corpus>/:tractate` — Tractate/book table of contents (chapters, folio ranges)
  - `/<corpus>/:tractate/:chapter` — Chapter/folio reader (bilingual text display)
- [ ] **Route wrapper components** — Create `<Corpus>ViewRoute` that:
  - Validates the URL slug and redirects to canonical form if needed
  - Passes parsed params to the page component

**Existing examples:**
- Talmud: `/talmud`, `/talmud/:tractate`, `/talmud/:tractate/:folio`
- Bible: `/bible`, `/bible/:book`, `/bible/:book/:chapter`
- Mishnah: `/mishnah`, `/mishnah/:tractate`, `/mishnah/:tractate/:chapter`

## 4. Page Components (`client/src/pages/`)

- [ ] **Contents page** (`<corpus>-contents.tsx`) — All tractates/books organized by section
- [ ] **Tractate page** (`<corpus>-tractate.tsx`) — Chapter listing with navigation links
- [ ] **Chapter/reader page** (`<corpus>-chapter.tsx`) — Bilingual text display using:
  - `SectionedBilingualDisplay` component (shared across all readers)
  - `PageNavigation` for prev/next navigation
  - `ExternalLinksFooter` for links to Sefaria and other sources
  - Loading states via `useQuery` with `isLoading` checks
  - Breadcrumb navigation

**Existing examples:**
- Talmud: `tractate-view.tsx`, `contents.tsx`, `tractate-contents.tsx`
- Bible: `bible-chapter.tsx`, `bible-contents.tsx`, `bible-book.tsx`
- Mishnah: `mishnah-chapter.tsx`, `mishnah-contents.tsx`, `mishnah-tractate.tsx`

## 5. SEO: Client-Side (`client/src/hooks/use-seo.ts`)

- [ ] **useSEO hook** — Each page component calls `useSEO()` with:
  - `title`: Unique per page, 50-60 chars, primary keyword near beginning, brand at end
  - `description`: 150-160 chars, includes corpus/tractate name
  - `canonical`: Full canonical URL using `window.location.origin`
  - `ogTitle`, `ogDescription`, `ogUrl`: Open Graph metadata
  - `keywords`: Relevant search terms
  - `robots`: "index, follow"
  - `structuredData`: Client-side JSON-LD (Article, CollectionPage, or Book)
- [ ] **generateSEOData helper** — Add corpus-specific functions to `generateSEOData` object in `use-seo.ts`

## 6. SEO: Server-Side Meta Tags (`server/routes.ts`)

- [ ] **`generateServerSideMetaTags()`** — Add route matchers for:
  - `/<corpus>` — Index page meta
  - `/<corpus>/:tractate` — Tractate page meta
  - `/<corpus>/:tractate/:chapter` — Chapter page meta with dynamic title/description

**Pattern:** Each branch sets `title`, `description`, `ogTitle`, `ogDescription`, `canonical`, `robots`.

## 7. SEO: Server-Side Structured Data (`server/routes.ts`)

- [ ] **`generateServerSideStructuredData()`** — Add JSON-LD for:
  - Index page: `CollectionPage` + `BreadcrumbList` + `Organization`
  - Tractate page: `CollectionPage` (or `Book`) + `BreadcrumbList` + `Organization`
  - Chapter page: `Article` + `BreadcrumbList` + `Organization`, with `isPartOf` linking to Book → BookSeries

**Pattern:** All use `@graph` format with shared `organizationNode`. Breadcrumbs follow: Home > Corpus > Tractate > Chapter.

## 8. SEO: Crawler Content (`server/routes.ts`)

- [ ] **`generateCrawlerBodyContent()`** — Add route matchers that generate:
  - H1 heading with tractate/chapter name
  - Breadcrumb navigation (`<nav aria-label="Breadcrumb">`)
  - Description paragraph
  - Text excerpt (fetched from storage cache when available)
  - Prev/next navigation links
  - For index pages: full listing of tractates/chapters as `<ul>` links

**Why:** Crawlers receive this pre-rendered HTML instead of the SPA shell, ensuring content is indexed without JavaScript execution.

## 9. Sitemaps (`server/routes/`)

- [ ] **Create `sitemap-<corpus>.ts`** — Generates XML sitemap with:
  - Index page URL (priority 0.8)
  - All tractate URLs (priority 0.6-0.7)
  - All chapter URLs (priority 0.5)
  - Proper `lastmod`, `changefreq`, `priority` values
- [ ] **Register in `sitemap-index.ts`** — Add `<sitemap>` entry pointing to new sitemap
- [ ] **Register route in `server/routes.ts`** — `app.get('/sitemap-<corpus>.xml', generate<Corpus>Sitemap)`
- [ ] **Add index page to `sitemap-main.ts`** — Add `/<corpus>` to the main sitemap

## 10. URL Normalization & Redirects (`server/routes.ts`)

- [ ] **Canonical URL format** — Decide on slug format (underscores vs hyphens, casing)
- [ ] **Normalization middleware** — Add to the URL normalization block in `registerRoutes()`:
  - Redirect non-canonical slug variants to canonical form (301)
  - Strip trailing slashes
  - Handle URL-encoded spaces
  - Lowercase/uppercase normalization if needed

## 11. Storage & Caching (`server/storage.ts`)

- [ ] **Storage interface** — Verify `IStorage.getText()` can handle the new corpus, or add a dedicated method
- [ ] **Cache key format** — Ensure the cache key distinguishes corpus (e.g., `work` parameter)
- [ ] **Client-side prefetching** — Add to `client/src/hooks/use-prefetch.ts` to preload adjacent pages

## 12. robots.txt (`client/public/robots.txt`)

- [ ] **Add `Allow: /<corpus>/`** directive

## 13. Navigation & Footer

- [ ] **Homepage** — Add the new corpus as a section on the home page
- [ ] **Navigation** — Add to the site navigation/header
- [ ] **Footer** — Add to the footer links
- [ ] **HTML sitemap** (`client/src/pages/sitemap.tsx`) — Add the new corpus section

## 14. Search Integration (if applicable)

- [ ] **Search endpoint** — Extend `/api/search` or add corpus-specific search
- [ ] **Search page** — Add corpus as a filter option on the search page

## Summary: Files to Create or Modify

| Layer | New Files | Modified Files |
|-------|-----------|----------------|
| Shared data | `shared/<corpus>-data.ts` | `shared/tractates.ts` (if extending) |
| API | — | `server/routes.ts` |
| Client routes | — | `client/src/App.tsx` |
| Pages | `client/src/pages/<corpus>-*.tsx` (3 files) | — |
| SEO client | — | `client/src/hooks/use-seo.ts` |
| SEO server | — | `server/routes.ts` (3 functions) |
| Sitemap | `server/routes/sitemap-<corpus>.ts` | `server/routes/sitemap-index.ts`, `server/routes/sitemap-main.ts`, `server/routes.ts` |
| robots.txt | — | `client/public/robots.txt` |
| Navigation | — | `client/src/pages/home.tsx`, `client/src/components/footer.tsx`, `client/src/pages/sitemap.tsx` |
