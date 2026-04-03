---
name: seo-management
description: Add, modify, or audit SEO meta titles, descriptions, Open Graph tags, structured data, and crawler content for any page in ChavrutAI. Use when adding a new page/route, fixing page titles, updating meta descriptions, or auditing SEO health across the site.
---

# SEO Management

ChavrutAI is a server-side-rendered SPA. SEO data lives in **two places that must stay in sync**:

1. **Client-side** — `useSEO()` hook in each page component (updates `document.title` and meta tags after React hydrates)
2. **Server-side** — `generateServerSideMetaTags()` in `server/routes/seo.ts` (injects meta into HTML for crawlers before JS loads)

Both systems must produce identical titles, descriptions, and OG tags for the same URL. If they diverge, crawlers see one thing and users see another.

## Architecture Overview

### Files involved

| File | Purpose |
|------|---------|
| `client/src/hooks/use-seo.ts` | `useSEO()` hook + `generateSEOData` helpers for common page types |
| `server/routes/seo.ts` | `generateServerSideMetaTags()` — server-side meta for crawlers |
| `server/routes/seo.ts` | `generateServerSideStructuredData()` — JSON-LD for crawlers |
| `server/routes/seo.ts` | `generateCrawlerBodyContent()` — visible HTML body for crawlers |
| `server/routes/seo.ts` | `servePageWithMeta()` — middleware that reads template, injects meta |
| `client/index.html` | Static fallback meta (homepage defaults) |

### How it works

1. A crawler requests a page (e.g., `/dictionary?letter=ק`)
2. `servePageWithMeta()` detects the crawler user-agent
3. It calls `generateServerSideMetaTags(req.originalUrl)` which:
   - Parses `pathname` from the URL (stripping query params)
   - Matches pathname against route patterns
   - Returns title, description, ogTitle, ogDescription, canonical, robots
4. The function replaces meta tags in `client/index.html` template
5. It also injects JSON-LD and crawler body content

For regular browsers, Vite serves the SPA normally, and `useSEO()` updates meta after React loads.

### Critical: URL parsing

`generateServerSideMetaTags` receives `req.originalUrl` which **includes query parameters**. The function parses `pathname` using `new URL(url, baseUrl).pathname` before route matching. All route comparisons use `pathname`, not the raw URL. This prevents query params from breaking route matching.

## Adding SEO to a New Page

When adding a new page/route, you must update **all three layers**:

### Step 1: Client-side `useSEO()` in the page component

```tsx
import { useSEO } from "@/hooks/use-seo";

export default function MyPage() {
  useSEO({
    title: "Page Title | ChavrutAI",
    description: "Page description for search engines.",
    ogTitle: "Page Title",
    ogDescription: "Page description for social sharing.",
    canonical: `${window.location.origin}/my-page`,
    robots: "index, follow",
    structuredData: { /* JSON-LD */ },
  });
  // ...
}
```

### Step 2: Server-side meta in `generateServerSideMetaTags()`

Add a new `else if` branch in `server/routes/seo.ts`:

```ts
} else if (pathname === '/my-page') {
  seoData = {
    title: "Page Title | ChavrutAI",  // MUST match client
    description: "Page description for search engines.",
    ogTitle: "Page Title",
    ogDescription: "Page description for social sharing.",
    canonical: `${baseUrl}/my-page`,
    robots: "index, follow"
  };
}
```

### Step 3: Register the route for `servePageWithMeta`

Add the Express route handler near the other `servePageWithMeta` registrations:

```ts
app.get('/my-page', servePageWithMeta);
```

### Step 4 (optional): Crawler body content

For content-heavy pages, add a case in `generateCrawlerBodyContent()` to inject visible text/links for crawlers.

### Step 5 (optional): Structured data

For rich pages, add a case in `generateServerSideStructuredData()` to inject JSON-LD.

## Dynamic Titles (Pages with Query Parameters)

For pages where the title changes based on URL parameters (search, dictionary, etc.):

**Server-side:** Use `urlObj.searchParams` (already parsed at function top):

```ts
} else if (pathname === '/dictionary') {
  const letter = urlObj.searchParams.get('letter') || '';
  if (letter) {
    seoData = {
      title: `Jastrow Dictionary - Letter ${letter} | ChavrutAI`,
      // ...
    };
  } else {
    seoData = { /* default dictionary title */ };
  }
}
```

**Client-side:** Derive title from React state:

```tsx
const seoTitle = selectedLetter
  ? `Jastrow Dictionary - Letter ${selectedLetter} | ChavrutAI`
  : "Jastrow Talmud Dictionary | ChavrutAI";

useSEO({ title: seoTitle, /* ... */ });
```

## Title Format Conventions

- Page titles: `Specific Content - Category | ChavrutAI`
- Always end with `| ChavrutAI`
- Keep under 60 characters when possible
- ogTitle: same as title but without `| ChavrutAI` suffix

## SEO Audit Checklist

When auditing or reviewing SEO:

1. **Title parity**: Do client and server produce the same title for each route?
2. **Query param safety**: Does `generateServerSideMetaTags` use `pathname` (not raw `url`) for all route matching?
3. **Canonical URLs**: Are canonicals consistent between client and server?
4. **Route registration**: Is every client route also registered with `app.get('/route', servePageWithMeta)`?
5. **Robots directives**: Are search results and thin pages set to `noindex, follow`?
6. **Structured data**: Do key content pages have JSON-LD?
7. **Crawler body**: Do text-heavy pages inject readable content for crawlers?

## Known Gaps (as of March 2026)

### Title inconsistencies between client and server
- **Folio pages** (`/talmud/:tractate/:folio`): Server uses en-dash and "Hebrew & English Talmud", client uses hyphen and "Talmud Bavli"
- Minor description wording differences on several pages

### Missing crawler body content
These pages fall back to generic content for crawlers:
- `/dictionary` — no entries shown to crawlers
- `/term-index` — no terms shown
- `/suggested-pages` — no page list shown
- `/blog-posts` — no blog list shown

### Missing structured data
These pages have no JSON-LD:
- `/dictionary`, `/term-index`, `/blog-posts`, `/suggested-pages`

### Missing text snippets in crawler body
- Mishnah chapter pages — no text excerpts (unlike Talmud/Bible which do include them)
- Yerushalmi chapter pages — no text excerpts

## Common Mistakes to Avoid

1. **Using `url` instead of `pathname`** in `generateServerSideMetaTags` — query params will break matching
2. **Forgetting to update server-side** when changing client-side titles
3. **Forgetting `servePageWithMeta` registration** when adding a new route
4. **HTML entities in titles** — use `escapeHtmlAttr()` for user-provided content in server-side meta
5. **Hardcoding `window.location.origin`** on the server — use the `baseUrl` variable instead
