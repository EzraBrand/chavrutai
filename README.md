# ChavrutAI - Modern Talmud Study Platform

A comprehensive web application for studying the Babylonian Talmud, featuring bilingual text access, advanced study tools, and an intuitive interface designed for learners of all levels.

## Overview

ChavrutAI is a full-featured digital platform providing access to all 37 tractates of the Babylonian Talmud with bilingual (Hebrew/English) text display, integrated reference tools, and customizable study preferences. Built with modern web technologies, it combines traditional Talmudic scholarship with contemporary user experience design.

## Major Features

### Complete Text Library
- **All 37 tractates** of the Babylonian Talmud (5,400+ folio pages)
- **Bilingual text display** with Hebrew and English side-by-side
- **Sefaria API integration** for authoritative, up-to-date text content
- **Traditional folio numbering** supporting 2a, 2b, 3a format
- **Page continuation preview** showing the first section of the next folio

### Intelligent Navigation
- **Hierarchical structure**: Work → Tractate → Chapter → Folio
- **Interactive breadcrumb navigation** with dropdown selectors
- **Mobile-optimized hamburger menu** for tractate and chapter selection
- **Section-by-section navigation** within individual folios
- **Previous/Next controls** understanding Talmudic folio patterns

### Study & Reference Tools

#### Dictionary/Lexicon
- **Full Jastrow Dictionary integration** via Sefaria API
- **Search functionality** with intelligent autosuggest
- **Browse by Hebrew letter** for systematic exploration
- **Hyperlinked cross-references** to related entries and primary texts

#### Biblical Index
- **Comprehensive biblical citation index** organized by book
- **Maps biblical verses** to their Talmudic locations
- **Browse by biblical book** (Torah, Prophets, Writings)
- **Direct links** to relevant Talmud passages

#### Topic Outlines
- **Structured outlines** showing key discussions and debates
- **Topic-based organization** for better conceptual understanding
- **Chapter-level summaries** (expanding coverage)

#### Blog Post Integration
- **"Talmud & Tech" blog integration** linked to specific Talmudic locations
- **Searchable and filterable** table of articles
- **External analysis and commentary** from modern perspectives

### Advanced Text Processing
- **Intelligent highlighting system** with 5,385+ terms across multiple gazetteers:
  - Concepts and ideas
  - Personal and place names
  - Biblical references
  - Talmudic toponyms
- **Smart paragraph splitting** for improved readability
- **Proper RTL support** for Hebrew text
- **Section markers** for navigating complex passages

### Customizable Experience
- **Text size controls** (5 levels: extra-small to extra-large)
- **Hebrew font selection** (7 options: Calibri, Times, Frank Ruehl, Noto Sans Hebrew, Noto Serif Hebrew, Assistant, David Libre)
- **Theme switching** (light/dark mode with sepia palette)
- **Layout preferences** (side-by-side vs. stacked bilingual display)
- **Highlighting toggles** (enable/disable by category)
- **Persistent settings** saved to browser localStorage

### Discovery Features
- **Suggested Pages**: Curated list of 20+ famous Talmudic passages (Hillel's Golden Rule, Hannah's Prayer, "Who is wise?", etc.)
- **Tractate Contents**: Visual grid showing all chapters and folio ranges
- **Traditional Seder organization**: 6 major divisions (Zeraim, Moed, Nashim, Nezikin, Kodashim, Tohorot)

## Pages & Routes

### Main Study Pages
| Page | Route | Description |
|------|-------|-------------|
| **Home/Contents** | `/` or `/talmud` | Landing page showing all 37 tractates organized by traditional Seder |
| **Tractate Contents** | `/talmud/:tractate` | Grid view of all chapters and folios for a specific tractate |
| **Tractate View** | `/tractate/:tractate/:folio` | Core reading page with bilingual text and full navigation |
| **Chapter Outline** | `/outline/:tractate/:chapter` | Topic-based outline of key discussions within a chapter |

### Discovery & Reference
| Page | Route | Description |
|------|-------|-------------|
| **Suggested Pages** | `/suggested-pages` | Curated list of famous and essential Talmudic passages |
| **Biblical Index** | `/biblical-index` | Complete index of biblical citations in the Talmud |
| **Biblical Book** | `/biblical-index/book/:bookName` | All citations from a specific biblical book |
| **Dictionary** | `/dictionary` | Full Jastrow Dictionary with search and browse capabilities |
| **Blog Posts** | `/blog-posts` | "Talmud & Tech" articles mapped to Talmudic locations |

### Information Pages
| Page | Route | Description |
|------|-------|-------------|
| **About** | `/about` | Project information and philosophy |
| **Contact** | `/contact` | Contact form and feedback channel |
| **Sitemap** | `/sitemap` | Human-readable hierarchical sitemap with statistics |
| **Privacy** | `/privacy` | Privacy policy and data handling information |
| **Changelog** | `/changelog` | Version history and feature updates |

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS + shadcn/ui, TanStack Query, Wouter.
- **Backend:** Express.js, TypeScript, Drizzle ORM + PostgreSQL (Neon serverless).
- **External APIs:** Sefaria API (text and dictionary), talmud-nlp-indexer (term highlighting gazetteers).

## Project Structure

```
client/src/
  pages/            — route pages (tractate-view, bible-chapter, search, etc.)
  components/       — UI components (text/, navigation/, bible/, outline/)
  lib/              — utilities (text-processing, gazetteer, analytics)
  hooks/            — custom hooks (use-seo, use-chat, use-mobile)
  context/          — React context providers (preferences)
  types/            — TypeScript types (talmud, bible)
client/public/
  data/chapters/    — JSON files for 37 tractates (chapter/outline data)
server/
  routes.ts         — API endpoints (talmud, bible, dictionary, blog, sitemap)
  storage.ts        — storage interface + in-memory implementation
shared/
  schema.ts         — Drizzle DB schema + Zod insert schemas
  text-processing.ts — shared text splitting/formatting (Hebrew + English)
  talmud-navigation.ts — page validation, prev/next navigation
  talmud-data.ts    — tractate metadata, folio ranges, Seder groupings
```

## API Endpoints

- `GET /api/text` — Talmud folio text (Hebrew + English sections)
- `GET /api/tractates` — list all 37 tractates
- `GET /api/chapters` — chapter info for a tractate
- `GET /api/bible/text` — Bible chapter text
- `GET /api/bible/books` — list Bible books
- `GET /api/bible/chapters` — chapter list for a Bible book
- `GET /api/dictionary/search` — dictionary search
- `GET /api/dictionary/browse` — browse by Hebrew letter
- `GET /api/dictionary/autosuggest` — autocomplete suggestions
- `GET /api/rss-feed` — blog feed (titles only)
- `GET /api/rss-feed-full` — blog feed (full content)

## Recognition

ChavrutAI is featured in the official [Sefaria Powered-By directory](https://developers.sefaria.org/docs/powered-by-sefaria), a curated list of projects and applications built using the Sefaria API and text data.

## Screenshot

![ChavrutAI Talmud page showing Berakhot 2a with bilingual Hebrew/English text, section navigation, and links to Sefaria and Al HaTorah](docs/talmud-page-screenshot.png)

*The Talmud reading page displaying Berakhot 2a — the opening folio of the entire Talmud. Hebrew and English text appear side by side, with numbered section navigation, direct links to Sefaria and Al HaTorah, and folio navigation controls.*

