import express from "express";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { normalizeSefariaTractateName, normalizeDisplayTractateName, getTractateSlug } from "@shared/tractates";
import { getMishnahTractateInfo } from "@shared/tractates";
import { getYerushalmiTractateInfo } from "@shared/yerushalmi-data";
import { getRambamHilchotInfo, RAMBAM_BOOKS } from "@shared/rambam-data";
import { getBookBySlug } from "@shared/bible-books";

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const CHAVRUTAI_SAME_AS = [
  "https://github.com/EzraBrand/chavrutai",
  "https://www.ezrabrand.com/",
  "https://x.com/ChavrutAI",
];

function generateServerSideStructuredData(url: string, baseUrl: string): object | null {
  const origin = baseUrl;

  const organizationNode = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "ChavrutAI",
    url: origin,
    foundingDate: "2025",
    description: "Free digital platform for studying the Babylonian Talmud with Hebrew-English bilingual text and modern study tools.",
    logo: {
      "@type": "ImageObject",
      url: `${origin}/favicon-192x192.png`,
    },
    sameAs: CHAVRUTAI_SAME_AS,
  };

  if (url === '/' || url === '') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${origin}/#website`,
          name: "ChavrutAI",
          description: "Free digital platform for studying the Babylonian Talmud with Hebrew-English bilingual text and modern study tools.",
          url: origin,
          potentialAction: {
            "@type": "SearchAction",
            target: `${origin}/talmud/{search_term}`,
            "query-input": "required name=search_term",
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  if (url === '/about') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AboutPage",
          "@id": `${origin}/about`,
          name: "About ChavrutAI",
          description: "Information about ChavrutAI digital Talmud study platform",
          url: `${origin}/about`,
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  if (url === '/talmud') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/talmud`,
          name: "Talmud Bavli — All Tractates",
          description: "Complete table of contents for the Babylonian Talmud. All 37 tractates with Hebrew-English text.",
          url: `${origin}/talmud`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Talmud", item: `${origin}/talmud` },
            ],
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  const tractateMatch = url.match(/^\/talmud\/([^/]+)$/);
  if (tractateMatch) {
    const tractate = tractateMatch[1];
    const tractateTitle = normalizeDisplayTractateName(tractate);
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/talmud/${tractate}`,
          name: `${tractateTitle} — Babylonian Talmud`,
          description: `Study ${tractateTitle} tractate chapter by chapter with Hebrew-English text on ChavrutAI.`,
          url: `${origin}/talmud/${tractate}`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home",   item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Talmud", item: `${origin}/talmud` },
              { "@type": "ListItem", position: 3, name: tractateTitle, item: `${origin}/talmud/${tractate}` },
            ],
          },
          isPartOf: { "@type": "WebSite", "@id": `${origin}/#website` },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  if (url === '/biblical-index') {
    return {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Biblical Citations in the Talmud",
      description: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud",
      url: `${origin}/biblical-index`,
      license: "https://opensource.org/licenses/MIT",
      creator: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: origin,
      },
    };
  }

  if (url === '/bible') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/bible`,
          name: "Hebrew Bible (Tanach) — Hebrew & English",
          description: "Read the complete Hebrew Bible with Koren Jerusalem Bible English translation. All 24 books of the Torah, Nevi'im, and Ketuvim.",
          url: `${origin}/bible`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Bible", item: `${origin}/bible` },
            ],
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  const bibleBookMatch = url.match(/^\/bible\/([^/]+)$/);
  if (bibleBookMatch) {
    const bookSlug = bibleBookMatch[1];
    const book = getBookBySlug(bookSlug);
    const bookTitle = book ? book.name : bookSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Book",
          "@id": `${origin}/bible/${bookSlug}`,
          name: `${bookTitle} — Hebrew Bible`,
          url: `${origin}/bible/${bookSlug}`,
          inLanguage: ["he", "en"],
          genre: "Religious Text",
          isPartOf: { "@type": "BookSeries", name: "Hebrew Bible (Tanach)" },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Bible", item: `${origin}/bible` },
            { "@type": "ListItem", position: 3, name: bookTitle, item: `${origin}/bible/${bookSlug}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  const bibleChapterMatch = url.match(/^\/bible\/([^/]+)\/(\d+)$/);
  if (bibleChapterMatch) {
    const bookSlug = bibleChapterMatch[1];
    const chapter = bibleChapterMatch[2];
    const book = getBookBySlug(bookSlug);
    const bookTitle = book ? book.name : bookSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${origin}/bible/${bookSlug}/${chapter}`,
          headline: `${bookTitle} Chapter ${chapter} — Hebrew & English`,
          description: `Read ${bookTitle} Chapter ${chapter} with parallel Hebrew-English text and the Koren Jerusalem Bible translation.`,
          url: `${origin}/bible/${bookSlug}/${chapter}`,
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          isPartOf: {
            "@type": "Book",
            name: `${bookTitle} — Hebrew Bible`,
            isPartOf: { "@type": "BookSeries", name: "Hebrew Bible (Tanach)" },
          },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Bible", item: `${origin}/bible` },
            { "@type": "ListItem", position: 3, name: bookTitle, item: `${origin}/bible/${bookSlug}` },
            { "@type": "ListItem", position: 4, name: `Chapter ${chapter}`, item: `${origin}/bible/${bookSlug}/${chapter}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  if (url === '/mishnah') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/mishnah`,
          name: "Mishnah — Hebrew & English",
          description: "Study 26 Mishnah tractates not covered by the Babylonian Talmud with bilingual Hebrew-English text.",
          url: `${origin}/mishnah`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Mishnah", item: `${origin}/mishnah` },
            ],
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  const mishnahTractateMatch = url.match(/^\/mishnah\/([^/]+)$/);
  if (mishnahTractateMatch) {
    const tractateSlug = mishnahTractateMatch[1];
    const tractateInfo = getMishnahTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/mishnah/${tractateSlug}`,
          name: `Mishnah ${tractateName}`,
          description: `Study Mishnah ${tractateName} chapter by chapter with bilingual Hebrew-English text.`,
          url: `${origin}/mishnah/${tractateSlug}`,
          isPartOf: { "@type": "WebSite", "@id": `${origin}/#website` },
          publisher: { "@id": `${origin}/#organization` },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Mishnah", item: `${origin}/mishnah` },
            { "@type": "ListItem", position: 3, name: tractateName, item: `${origin}/mishnah/${tractateSlug}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  const mishnahChapterMatch = url.match(/^\/mishnah\/([^/]+)\/(\d+)$/);
  if (mishnahChapterMatch) {
    const tractateSlug = mishnahChapterMatch[1];
    const chapter = mishnahChapterMatch[2];
    const tractateInfo = getMishnahTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${origin}/mishnah/${tractateSlug}/${chapter}`,
          headline: `Mishnah ${tractateName} Chapter ${chapter}`,
          description: `Study Mishnah ${tractateName} Chapter ${chapter} with parallel Hebrew-English text.`,
          url: `${origin}/mishnah/${tractateSlug}/${chapter}`,
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          isPartOf: {
            "@type": "Book",
            name: `Mishnah ${tractateName}`,
            isPartOf: { "@type": "BookSeries", name: "Mishnah" },
          },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Mishnah", item: `${origin}/mishnah` },
            { "@type": "ListItem", position: 3, name: tractateName, item: `${origin}/mishnah/${tractateSlug}` },
            { "@type": "ListItem", position: 4, name: `Chapter ${chapter}`, item: `${origin}/mishnah/${tractateSlug}/${chapter}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  if (url === '/rambam') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/rambam`,
          name: "Mishneh Torah (Rambam) — Hebrew & English",
          description: "Study all 83 Hilchot of the Mishneh Torah with bilingual Hebrew-English text (Touger translation). 14 books covering all areas of Jewish law.",
          url: `${origin}/rambam`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Mishneh Torah", item: `${origin}/rambam` },
            ],
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  const rambamHilchotMatch = url.match(/^\/rambam\/([^/]+)$/);
  if (rambamHilchotMatch) {
    const hilchotSlug = rambamHilchotMatch[1];
    const info = getRambamHilchotInfo(hilchotSlug);
    const hilchotName = info ? info.displayName : hilchotSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/rambam/${hilchotSlug}`,
          name: `Hilchot ${hilchotName} — Mishneh Torah`,
          description: `Study Hilchot ${hilchotName} chapter by chapter with bilingual Hebrew-English text (Touger translation).`,
          url: `${origin}/rambam/${hilchotSlug}`,
          isPartOf: { "@type": "WebSite", "@id": `${origin}/#website` },
          publisher: { "@id": `${origin}/#organization` },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Mishneh Torah", item: `${origin}/rambam` },
            { "@type": "ListItem", position: 3, name: hilchotName, item: `${origin}/rambam/${hilchotSlug}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  const rambamChapterMatch = url.match(/^\/rambam\/([^/]+)\/(\d+)$/);
  if (rambamChapterMatch) {
    const hilchotSlug = rambamChapterMatch[1];
    const chapter = rambamChapterMatch[2];
    const info = getRambamHilchotInfo(hilchotSlug);
    const hilchotName = info ? info.displayName : hilchotSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${origin}/rambam/${hilchotSlug}/${chapter}`,
          headline: `${hilchotName} Chapter ${chapter} — Mishneh Torah`,
          description: `Study Hilchot ${hilchotName} Chapter ${chapter} with parallel Hebrew-English text (Touger translation).`,
          url: `${origin}/rambam/${hilchotSlug}/${chapter}`,
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          isPartOf: {
            "@type": "Book",
            name: `Hilchot ${hilchotName} — Mishneh Torah`,
            isPartOf: { "@type": "BookSeries", name: "Mishneh Torah" },
          },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Mishneh Torah", item: `${origin}/rambam` },
            { "@type": "ListItem", position: 3, name: hilchotName, item: `${origin}/rambam/${hilchotSlug}` },
            { "@type": "ListItem", position: 4, name: `Chapter ${chapter}`, item: `${origin}/rambam/${hilchotSlug}/${chapter}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  if (url === '/yerushalmi') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/yerushalmi`,
          name: "Jerusalem Talmud (Yerushalmi) — Hebrew & English",
          description: "Study the Jerusalem Talmud (Talmud Yerushalmi) with bilingual Hebrew-English text. 39 tractates across four Sedarim, with the Guggenheimer English translation.",
          url: `${origin}/yerushalmi`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Jerusalem Talmud", item: `${origin}/yerushalmi` },
            ],
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  const yerushalmiTractateMatch = url.match(/^\/yerushalmi\/([^/]+)$/);
  if (yerushalmiTractateMatch) {
    const tractateSlug = yerushalmiTractateMatch[1];
    const tractateInfo = getYerushalmiTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/yerushalmi/${tractateSlug}`,
          name: `Jerusalem Talmud ${tractateName}`,
          description: `Study Jerusalem Talmud ${tractateName} chapter by chapter with bilingual Hebrew-English text (Guggenheimer translation).`,
          url: `${origin}/yerushalmi/${tractateSlug}`,
          isPartOf: { "@type": "WebSite", "@id": `${origin}/#website` },
          publisher: { "@id": `${origin}/#organization` },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Jerusalem Talmud", item: `${origin}/yerushalmi` },
            { "@type": "ListItem", position: 3, name: tractateName, item: `${origin}/yerushalmi/${tractateSlug}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  const yerushalmiChapterMatch = url.match(/^\/yerushalmi\/([^/]+)\/(\d+)$/);
  if (yerushalmiChapterMatch) {
    const tractateSlug = yerushalmiChapterMatch[1];
    const chapter = yerushalmiChapterMatch[2];
    const tractateInfo = getYerushalmiTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${origin}/yerushalmi/${tractateSlug}/${chapter}`,
          headline: `Jerusalem Talmud ${tractateName} Chapter ${chapter}`,
          description: `Study Jerusalem Talmud ${tractateName} Chapter ${chapter} with parallel Hebrew-English text (Guggenheimer translation).`,
          url: `${origin}/yerushalmi/${tractateSlug}/${chapter}`,
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          isPartOf: {
            "@type": "Book",
            name: `Jerusalem Talmud ${tractateName}`,
            isPartOf: { "@type": "BookSeries", name: "Jerusalem Talmud" },
          },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Jerusalem Talmud", item: `${origin}/yerushalmi` },
            { "@type": "ListItem", position: 3, name: tractateName, item: `${origin}/yerushalmi/${tractateSlug}` },
            { "@type": "ListItem", position: 4, name: `Chapter ${chapter}`, item: `${origin}/yerushalmi/${tractateSlug}/${chapter}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  const folioMatch = url.match(/^\/talmud\/([^/]+)\/(\d+[ab])$/i);
  if (folioMatch) {
    const tractate = folioMatch[1];
    const folio = folioMatch[2].toLowerCase();
    const folioDisplay = folio.toUpperCase();
    const tractateTitle = normalizeDisplayTractateName(tractate);
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${origin}/talmud/${tractate}/${folio}`,
          headline: `${tractateTitle} ${folioDisplay} — Talmud Bavli`,
          description: `Study ${tractateTitle} folio ${folioDisplay} from the Babylonian Talmud with parallel Hebrew-English text on ChavrutAI.`,
          url: `${origin}/talmud/${tractate}/${folio}`,
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          isPartOf: {
            "@type": "Book",
            name: `${tractateTitle} — Babylonian Talmud`,
            isPartOf: { "@type": "BookSeries", name: "Babylonian Talmud" },
          },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home",         item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Talmud",       item: `${origin}/talmud` },
            { "@type": "ListItem", position: 3, name: tractateTitle,  item: `${origin}/talmud/${tractate}` },
            { "@type": "ListItem", position: 4, name: `${tractateTitle} ${folioDisplay}`, item: `${origin}/talmud/${tractate}/${folio}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  return null;
}

function generateServerSideMetaTags(url: string): { title: string; description: string; ogTitle: string; ogDescription: string; canonical: string; robots: string } {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://chavrutai.com' : 'http://localhost:5000';
  
  const urlObj = new URL(url, baseUrl);
  const pathname = urlObj.pathname;
  
  let seoData = {
    title: "Study Talmud Online - Free Digital Platform | ChavrutAI",
    description: "ChavrutAI \u2014 study the Babylonian Talmud online, free. All 37 tractates with Hebrew-English text, chapter navigation, and modern study tools.",
    ogTitle: "ChavrutAI - Study Talmud Online Free",
    ogDescription: "ChavrutAI \u2014 study the Babylonian Talmud online, free. All 37 tractates with Hebrew-English text, chapter navigation, and modern study tools.",
    canonical: `${baseUrl}/`,
    robots: "index, follow"
  };

  if (pathname === '/' || pathname === '/talmud') {
    seoData.canonical = `${baseUrl}${pathname === '/' ? '/' : '/talmud'}`;
  } else if (pathname === '/about') {
    seoData = {
      title: "About ChavrutAI - Free Digital Talmud Learning Platform",
      description: "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
      ogTitle: "About ChavrutAI - Free Digital Talmud Learning Platform",
      ogDescription: "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
      canonical: `${baseUrl}/about`,
      robots: "index, follow"
    };
  } else if (pathname === '/suggested-pages') {
    seoData = {
      title: "Famous Talmud Pages - Essential Teachings & Stories | ChavrutAI",
      description: "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
      ogTitle: "Famous Talmud Pages - Essential Teachings & Stories",
      ogDescription: "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
      canonical: `${baseUrl}/suggested-pages`,
      robots: "index, follow"
    };
  } else if (pathname === '/biblical-index') {
    seoData = {
      title: "Biblical Citations in the Talmud - Complete Index | ChavrutAI",
      description: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud. Search Torah, Prophets, and Writings references with direct links to Talmudic passages.",
      ogTitle: "Biblical Citations in the Talmud - Complete Index",
      ogDescription: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud.",
      canonical: `${baseUrl}/biblical-index`,
      robots: "index, follow"
    };
  } else if (pathname === '/blog-posts') {
    seoData = {
      title: '"Talmud & Tech" Blog Posts by Talmud Location | ChavrutAI',
      description: 'Blog posts analyzing Talmudic passages, organized by tractate and page location. Click on titles to go to the full articles at the "Talmud & Tech" Blog, or use location links to jump to the corresponding text in ChavrutAI.',
      ogTitle: '"Talmud & Tech" Blog Posts by Talmud Location',
      ogDescription: 'Blog posts analyzing Talmudic passages, organized by tractate and page location.',
      canonical: `${baseUrl}/blog-posts`,
      robots: "index, follow"
    };
  } else if (pathname === '/dictionary') {
    const letter = urlObj.searchParams.get('letter') || '';
    const query = urlObj.searchParams.get('q') || '';
    
    if (letter) {
      seoData = {
        title: `Jastrow Dictionary - Letter ${letter} | ChavrutAI`,
        description: `Browse Jastrow Dictionary entries starting with ${letter}. Comprehensive Talmudic Hebrew and Aramaic dictionary with modernized presentation.`,
        ogTitle: `Jastrow Dictionary - Letter ${letter}`,
        ogDescription: `Browse Jastrow Dictionary entries starting with ${letter}. Talmudic Hebrew and Aramaic with modernized presentation.`,
        canonical: `${baseUrl}/dictionary?letter=${encodeURIComponent(letter)}`,
        robots: "index, follow"
      };
    } else if (query) {
      const safeQuery = escapeHtmlAttr(query);
      seoData = {
        title: `"${safeQuery}" - Jastrow Dictionary | ChavrutAI`,
        description: `Jastrow Dictionary results for "${safeQuery}". Comprehensive Talmudic Hebrew and Aramaic dictionary with modernized presentation.`,
        ogTitle: `"${safeQuery}" - Jastrow Dictionary`,
        ogDescription: `Jastrow Dictionary results for "${safeQuery}". Talmudic Hebrew and Aramaic with modernized presentation.`,
        canonical: `${baseUrl}/dictionary`,
        robots: "index, follow"
      };
    } else {
      seoData = {
        title: "Modernized Jastrow Talmud Dictionary of Hebrew & Aramaic | ChavrutAI",
        description: "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic. Modernized presentation with expanded abbreviations, enhanced readability, and direct term lookup.",
        ogTitle: "Modernized Jastrow Talmud Dictionary of Hebrew & Aramaic",
        ogDescription: "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic with modernized presentation and enhanced readability.",
        canonical: `${baseUrl}/dictionary`,
        robots: "index, follow"
      };
    }
  } else if (pathname === '/term-index') {
    seoData = {
      title: "Talmud Term Index - Names, Places & Key Terms | ChavrutAI",
      description: "Glossary of personal names, place names, and key terms in the Babylonian Talmud. Includes corpus counts, Wikipedia links, Hebrew terms, and biographical data.",
      ogTitle: "Talmud Term Index - Names, Places & Key Terms | ChavrutAI",
      ogDescription: "Glossary of personal names, place names, and key terms in the Babylonian Talmud with corpus counts, Wikipedia links, and biographical data.",
      canonical: `${baseUrl}/term-index`,
      robots: "index, follow"
    };
  } else if (pathname === '/bible') {
    seoData = {
      title: "Bible (Tanach) - Hebrew & English | ChavrutAI",
      description: "Read the complete Hebrew Bible (Tanach) with Koren Jerusalem Bible English translation. Access all 24 books of the Torah, Nevi'im, and Ketuvim with parallel Hebrew-English text.",
      ogTitle: "Bible (Tanach) - Hebrew & English",
      ogDescription: "Read the complete Hebrew Bible with Koren Jerusalem Bible translation.",
      canonical: `${baseUrl}/bible`,
      robots: "index, follow"
    };
  } else if (pathname.match(/^\/bible\/[^/]+\/\d+$/)) {
    const urlParts = pathname.split('/');
    const bookSlug = urlParts[2];
    const chapter = urlParts[3];
    const book = getBookBySlug(bookSlug);
    const bookTitle = book ? book.name : bookSlug.replace(/_/g, ' ');
    seoData = {
      title: `${bookTitle} Chapter ${chapter} - Hebrew & English Bible | ChavrutAI`,
      description: `Read ${bookTitle} Chapter ${chapter} with parallel Hebrew-English text and the Koren Jerusalem Bible translation. Free online Bible study on ChavrutAI.`,
      ogTitle: `${bookTitle} ${chapter} - Hebrew & English Bible`,
      ogDescription: `Read ${bookTitle} Chapter ${chapter} with parallel Hebrew-English text and the Koren Jerusalem Bible translation on ChavrutAI.`,
      canonical: `${baseUrl}/bible/${bookSlug}/${chapter}`,
      robots: "index, follow"
    };
  } else if (pathname.match(/^\/bible\/[^/]+$/)) {
    const bookSlug = pathname.split('/')[2];
    const book = getBookBySlug(bookSlug);
    const bookTitle = book ? book.name : bookSlug.replace(/_/g, ' ');
    seoData = {
      title: `${bookTitle} - Hebrew & English Bible | ChavrutAI`,
      description: `Read all chapters of ${bookTitle} with parallel Hebrew-English text and the Koren Jerusalem Bible translation. Free online Bible study on ChavrutAI.`,
      ogTitle: `${bookTitle} - Hebrew & English Bible`,
      ogDescription: `Read ${bookTitle} with parallel Hebrew-English text and the Koren Jerusalem Bible translation on ChavrutAI.`,
      canonical: `${baseUrl}/bible/${bookSlug}`,
      robots: "index, follow"
    };
  } else if (pathname === '/sugya-viewer') {
    seoData = {
      title: "Sugya Viewer - Custom Talmud Range | ChavrutAI",
      description: "Read any continuous passage (sugya) across the Babylonian Talmud by selecting a custom range of folios. Ideal for in-depth study of extended discussions.",
      ogTitle: "Sugya Viewer - Custom Talmud Range | ChavrutAI",
      ogDescription: "Read any continuous Talmud passage by selecting a custom range of folios on ChavrutAI.",
      canonical: `${baseUrl}/sugya-viewer`,
      robots: "index, follow"
    };
  } else if (pathname === '/mishnah-map') {
    seoData = {
      title: "Mishnah-Talmud Mapping | ChavrutAI",
      description: "Explore the relationship between Mishnah sections and their corresponding Talmudic discussions. Navigate from any Mishnah passage directly to the Gemara that analyzes it.",
      ogTitle: "Mishnah-Talmud Mapping | ChavrutAI",
      ogDescription: "Navigate from any Mishnah passage directly to the Gemara that analyzes it on ChavrutAI.",
      canonical: `${baseUrl}/mishnah-map`,
      robots: "index, follow"
    };
  } else if (pathname === '/sitemap') {
    seoData = {
      title: "Site Map - ChavrutAI Talmud Navigation Guide",
      description: "Complete navigation guide to all 37 Talmud tractates organized by traditional Seder structure. Find any page across 5,400+ folios in the Babylonian Talmud.",
      ogTitle: "Site Map - ChavrutAI Talmud Navigation Guide",
      ogDescription: "Complete navigation guide to all 37 Talmud tractates organized by traditional Seder structure.",
      canonical: `${baseUrl}/sitemap`,
      robots: "index, follow"
    };
  } else if (pathname === '/contact') {
    seoData = {
      title: "Contact | ChavrutAI",
      description: "Contact ChavrutAI with feedback, suggestions, and corrections. We appreciate all input to improve our digital Talmud study platform.",
      ogTitle: "Contact | ChavrutAI",
      ogDescription: "Contact ChavrutAI with feedback, suggestions, and corrections.",
      canonical: `${baseUrl}/contact`,
      robots: "index, follow"
    };
  } else if (pathname === '/privacy') {
    seoData = {
      title: "Privacy Policy - ChavrutAI Talmud Study Platform",
      description: "Privacy policy for ChavrutAI - learn how we handle your data when using our free Talmud study platform.",
      ogTitle: "Privacy Policy - ChavrutAI",
      ogDescription: "Privacy policy for ChavrutAI - learn how we handle your data when using our free Talmud study platform.",
      canonical: `${baseUrl}/privacy`,
      robots: "index, follow"
    };
  } else if (pathname === '/changelog') {
    seoData = {
      title: "Changelog - ChavrutAI",
      description: "Recent updates and improvements to ChavrutAI. Track new features, design enhancements, and user experience improvements for Talmud study.",
      ogTitle: "Changelog - ChavrutAI",
      ogDescription: "Recent updates and improvements to ChavrutAI.",
      canonical: `${baseUrl}/changelog`,
      robots: "index, follow"
    };
  } else if (pathname === '/mishnah') {
    seoData = {
      title: "Mishnah - Hebrew & English | ChavrutAI",
      description: "Study the Mishnah online with bilingual Hebrew-English text. Browse 26 tractates not covered by the Babylonian Talmud, organized by Seder.",
      ogTitle: "Mishnah - Hebrew & English | ChavrutAI",
      ogDescription: "Study the Mishnah online with bilingual Hebrew-English text on ChavrutAI.",
      canonical: `${baseUrl}/mishnah`,
      robots: "index, follow"
    };
  } else if (pathname.match(/^\/mishnah\/[^/]+\/\d+$/)) {
    const urlParts = pathname.split('/');
    const tractateSlug = urlParts[2];
    const chapter = urlParts[3];
    const tractateInfo = getMishnahTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    seoData = {
      title: `Mishnah ${tractateName} Chapter ${chapter} - Hebrew & English | ChavrutAI`,
      description: `Study Mishnah ${tractateName} Chapter ${chapter} with parallel Hebrew-English text. Free online Mishnah study on ChavrutAI.`,
      ogTitle: `Mishnah ${tractateName} ${chapter} - Hebrew & English`,
      ogDescription: `Read Mishnah ${tractateName} Chapter ${chapter} with parallel Hebrew-English text on ChavrutAI.`,
      canonical: `${baseUrl}/mishnah/${tractateSlug}/${chapter}`,
      robots: "index, follow"
    };
  } else if (pathname.match(/^\/mishnah\/[^/]+$/)) {
    const tractateSlug = pathname.split('/')[2];
    const tractateInfo = getMishnahTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    seoData = {
      title: `Mishnah ${tractateName} - Hebrew & English | ChavrutAI`,
      description: `Study Mishnah ${tractateName} chapter by chapter with bilingual Hebrew-English text. Free online on ChavrutAI.`,
      ogTitle: `Mishnah ${tractateName} - Hebrew & English`,
      ogDescription: `Study Mishnah ${tractateName} with Hebrew-English text on ChavrutAI.`,
      canonical: `${baseUrl}/mishnah/${tractateSlug}`,
      robots: "index, follow"
    };
  } else if (pathname === '/rambam') {
    seoData = {
      title: "Mishneh Torah (Rambam) - Complete Text | ChavrutAI",
      description: "Study the Mishneh Torah (Rambam) online with bilingual Hebrew-English text. All 83 Hilchot across 14 books, with the Touger English translation via Sefaria.",
      ogTitle: "Mishneh Torah (Rambam) - Complete Text | ChavrutAI",
      ogDescription: "Study the Mishneh Torah (Rambam) with bilingual Hebrew-English text on ChavrutAI.",
      canonical: `${baseUrl}/rambam`,
      robots: "index, follow"
    };
  } else if (pathname.match(/^\/rambam\/[^/]+\/\d+$/)) {
    const urlParts = pathname.split('/');
    const hilchotSlug = urlParts[2];
    const chapter = urlParts[3];
    const info = getRambamHilchotInfo(hilchotSlug);
    const hilchotName = info ? info.displayName : hilchotSlug.replace(/_/g, ' ');
    seoData = {
      title: `${hilchotName} Chapter ${chapter} - Mishneh Torah | ChavrutAI`,
      description: `Study Hilchot ${hilchotName} Chapter ${chapter} with parallel Hebrew-English text (Touger translation). Free online on ChavrutAI.`,
      ogTitle: `${hilchotName} Chapter ${chapter} - Mishneh Torah`,
      ogDescription: `Read Hilchot ${hilchotName} Chapter ${chapter} with Hebrew-English text on ChavrutAI.`,
      canonical: `${baseUrl}/rambam/${hilchotSlug}/${chapter}`,
      robots: "index, follow"
    };
  } else if (pathname.match(/^\/rambam\/[^/]+$/)) {
    const hilchotSlug = pathname.split('/')[2];
    const info = getRambamHilchotInfo(hilchotSlug);
    const hilchotName = info ? info.displayName : hilchotSlug.replace(/_/g, ' ');
    seoData = {
      title: `${hilchotName} - Mishneh Torah | ChavrutAI`,
      description: `Study Hilchot ${hilchotName} chapter by chapter with bilingual Hebrew-English text (Touger translation). Free online on ChavrutAI.`,
      ogTitle: `${hilchotName} - Mishneh Torah`,
      ogDescription: `Study Hilchot ${hilchotName} with Hebrew-English text (Touger) on ChavrutAI.`,
      canonical: `${baseUrl}/rambam/${hilchotSlug}`,
      robots: "index, follow"
    };
  } else if (pathname === '/yerushalmi') {
    seoData = {
      title: "Jerusalem Talmud (Yerushalmi) - Hebrew & English | ChavrutAI",
      description: "Study the Jerusalem Talmud (Talmud Yerushalmi) online with bilingual Hebrew-English text. 39 tractates with the Guggenheimer English translation, organized by Seder.",
      ogTitle: "Jerusalem Talmud (Yerushalmi) - Hebrew & English | ChavrutAI",
      ogDescription: "Study the Jerusalem Talmud online with bilingual Hebrew-English text (Guggenheimer translation) on ChavrutAI.",
      canonical: `${baseUrl}/yerushalmi`,
      robots: "index, follow"
    };
  } else if (pathname.match(/^\/yerushalmi\/[^/]+\/\d+$/)) {
    const urlParts = pathname.split('/');
    const tractateSlug = urlParts[2];
    const chapter = urlParts[3];
    const tractateInfo = getYerushalmiTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    seoData = {
      title: `Jerusalem Talmud ${tractateName} Chapter ${chapter} - Hebrew & English | ChavrutAI`,
      description: `Study Jerusalem Talmud ${tractateName} Chapter ${chapter} with parallel Hebrew-English text (Guggenheimer translation). Free online on ChavrutAI.`,
      ogTitle: `Jerusalem Talmud ${tractateName} Chapter ${chapter} - Hebrew & English`,
      ogDescription: `Read Jerusalem Talmud ${tractateName} Chapter ${chapter} with Hebrew-English text (Guggenheimer) on ChavrutAI.`,
      canonical: `${baseUrl}/yerushalmi/${tractateSlug}/${chapter}`,
      robots: "index, follow"
    };
  } else if (pathname.match(/^\/yerushalmi\/[^/]+$/)) {
    const tractateSlug = pathname.split('/')[2];
    const tractateInfo = getYerushalmiTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    seoData = {
      title: `Jerusalem Talmud ${tractateName} - Hebrew & English | ChavrutAI`,
      description: `Study Jerusalem Talmud ${tractateName} chapter by chapter with bilingual Hebrew-English text (Guggenheimer translation). Free online on ChavrutAI.`,
      ogTitle: `Jerusalem Talmud ${tractateName} - Hebrew & English`,
      ogDescription: `Study Jerusalem Talmud ${tractateName} with Hebrew-English text on ChavrutAI.`,
      canonical: `${baseUrl}/yerushalmi/${tractateSlug}`,
      robots: "index, follow"
    };
  } else if (pathname.match(/^\/talmud\/[^/]+$/)) {
    const tractate = pathname.split('/')[2];
    const tractateTitle = normalizeDisplayTractateName(tractate);
    seoData = {
      title: `${tractateTitle} Talmud - Complete Chapter Guide | ChavrutAI`,
      description: `Study ${tractateTitle} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access. Free online Talmud learning.`,
      ogTitle: `${tractateTitle} Talmud - Complete Study Guide`,
      ogDescription: `Study ${tractateTitle} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access.`,
      canonical: `${baseUrl}/talmud/${tractate}`,
      robots: "index, follow"
    };
  } else if (pathname.match(/^\/talmud\/[^/]+\/\d+[ab]$/)) {
    const urlParts = pathname.split('/');
    const tractate = urlParts[2];
    const folio = urlParts[3];
    const tractateTitle = normalizeDisplayTractateName(tractate);
    const folioUpper = folio.toUpperCase();
    
    seoData = {
      title: `${tractateTitle} ${folioUpper} – Hebrew & English Talmud | ChavrutAI`,
      description: `Study ${tractateTitle} folio ${folioUpper} with parallel Hebrew-English text, traditional commentary, and modern study tools. Free access to Babylonian Talmud online.`,
      ogTitle: `${tractateTitle} ${folioUpper} – Talmud Study Page`,
      ogDescription: `Study ${tractateTitle} folio ${folioUpper} with parallel Hebrew-English text, traditional commentary, and modern study tools.`,
      canonical: `${baseUrl}/talmud/${tractate}/${folio}`,
      robots: "index, follow"
    };
  } else if (pathname === '/search') {
    const query = urlObj.searchParams.get('q') || '';
    const type = urlObj.searchParams.get('type') || '';
    const safeQuery = escapeHtmlAttr(query);

    let title: string;
    let description: string;
    let ogTitle: string;
    let ogDescription: string;

    if (query) {
      const typeLabel = type === 'bible' ? 'Bible' : type === 'talmud' ? 'Talmud' : 'Talmud &amp; Bible';
      title = `Search results for &quot;${safeQuery}&quot; in ${typeLabel} | ChavrutAI`;
      ogTitle = `Search: &quot;${safeQuery}&quot; \u2013 ${typeLabel} | ChavrutAI`;
      description = `Search results for &quot;${safeQuery}&quot; in the ${typeLabel}. Find passages, explore Hebrew and English text, and study with ChavrutAI.`;
      ogDescription = `Search results for &quot;${safeQuery}&quot; in the ${typeLabel} on ChavrutAI.`;
    } else {
      title = "Search the Talmud & Bible – Hebrew & English | ChavrutAI";
      ogTitle = "Search Talmud & Bible | ChavrutAI";
      description = "Search through the Babylonian Talmud and Hebrew Bible in Hebrew and English. Find any passage, word, or topic across thousands of pages.";
      ogDescription = "Search through the Babylonian Talmud and Hebrew Bible in Hebrew and English on ChavrutAI.";
    }

    seoData = {
      title,
      description,
      ogTitle,
      ogDescription,
      canonical: `${baseUrl}/search`,
      robots: (query || type) ? "noindex, follow" : "index, follow"
    };
  }
  
  return seoData;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function generateCrawlerBodyContent(urlPath: string, seoData: { title: string; description: string }): Promise<string> {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://chavrutai.com' : 'http://localhost:5000';

  function safeSlug(slug: string): string {
    return encodeURIComponent(slug).replace(/%2F/g, '/');
  }

  let heading = '';
  let breadcrumbs = '';
  let body = '';
  let nav = '';

  if (urlPath === '/') {
    heading = 'ChavrutAI — Study Talmud Online';
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    nav = `<nav aria-label="Main navigation"><h2>Explore</h2><ul>` +
      `<li><a href="/talmud">Browse All Tractates</a></li>` +
      `<li><a href="/bible">Hebrew Bible (Tanach)</a></li>` +
      `<li><a href="/suggested-pages">Famous Talmud Pages</a></li>` +
      `<li><a href="/dictionary">Talmud Dictionary</a></li>` +
      `<li><a href="/search">Search</a></li>` +
      `<li><a href="/about">About</a></li>` +
      `</ul></nav>`;
  } else if (urlPath === '/talmud') {
    heading = 'Babylonian Talmud — All Tractates';
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; Talmud</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    const sederNames: Record<string, string> = {
      zeraim: 'Seder Zeraim (Seeds)',
      moed: 'Seder Moed (Festivals)',
      nashim: 'Seder Nashim (Women)',
      nezikin: 'Seder Nezikin (Damages)',
      kodashim: 'Seder Kodashim (Holy Things)',
      tohorot: 'Seder Tohorot (Purities)'
    };
    const { SEDER_TRACTATES } = await import('@shared/tractates');
    nav = '';
    for (const [seder, tractates] of Object.entries(SEDER_TRACTATES)) {
      nav += `<h3>${sederNames[seder] || seder}</h3><ul>`;
      for (const t of tractates) {
        const slug = safeSlug(getTractateSlug(t.name));
        nav += `<li><a href="/talmud/${slug}">${escapeHtml(t.name)}</a> (${t.folios} folios)</li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/talmud\/[^/]+$/)) {
    const tractateSlug = urlPath.split('/')[2];
    const tractateTitle = normalizeDisplayTractateName(tractateSlug);
    const safeTractatePath = safeSlug(tractateSlug);
    const { SEDER_TRACTATES } = await import('@shared/tractates');
    const info = Object.values(SEDER_TRACTATES).flat().find(
      t => getTractateSlug(t.name) === tractateSlug
    );
    heading = `${tractateTitle} — Talmud Tractate`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/talmud">Talmud</a> &rsaquo; ${escapeHtml(tractateTitle)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    if (info) {
      const startFolio = (info as any).startFolio || 2;
      const startSide = (info as any).startSide || 'a';
      nav = `<h3>Folios</h3><ul>`;
      for (let f = startFolio; f <= info.folios; f++) {
        const sides = f === startFolio && startSide === 'b' ? ['b'] :
          f === info.folios ? (info.lastSide === 'a' ? ['a'] : ['a', 'b']) : ['a', 'b'];
        for (const s of sides) {
          nav += `<li><a href="/talmud/${safeTractatePath}/${f}${s}">${escapeHtml(tractateTitle)} ${f}${s.toUpperCase()}</a></li>`;
        }
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/talmud\/[^/]+\/\d+[ab]$/)) {
    const parts = urlPath.split('/');
    const tractateSlug = parts[2];
    const folio = parts[3];
    const tractateTitle = normalizeDisplayTractateName(tractateSlug);
    const safeTractatePath = safeSlug(tractateSlug);
    const folioUpper = folio.toUpperCase();
    heading = `${tractateTitle} ${folioUpper}`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/talmud">Talmud</a> &rsaquo; <a href="/talmud/${safeTractatePath}">${escapeHtml(tractateTitle)}</a> &rsaquo; ${escapeHtml(folioUpper)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;

    try {
      const folioNum = parseInt(folio);
      const side = folio.slice(-1);
      const sefariaName = normalizeSefariaTractateName(tractateSlug);
      const text = await storage.getText('Talmud Bavli', sefariaName, 1, folioNum, side);
      if (text && text.englishSections) {
        const sections = text.englishSections as string[];
        const snippet = sections.slice(0, 5).map(s =>
          typeof s === 'string' ? s.replace(/<[^>]*>/g, '').substring(0, 300) : ''
        ).filter(Boolean);
        if (snippet.length > 0) {
          body += `<div><h2>Text Excerpt</h2>`;
          for (const line of snippet) {
            body += `<p>${escapeHtml(line)}</p>`;
          }
          body += `</div>`;
        }
      }
    } catch {}

    const { SEDER_TRACTATES } = await import('@shared/tractates');
    const tractateInfo = Object.values(SEDER_TRACTATES).flat().find(
      t => getTractateSlug(t.name) === tractateSlug
    );
    const folioNum = parseInt(folio);
    const side = folio.slice(-1);
    const tStartFolio = (tractateInfo as any)?.startFolio || 2;
    const tStartSide = (tractateInfo as any)?.startSide || 'a';
    const tMaxFolio = tractateInfo?.folios;
    const tLastSide = tractateInfo?.lastSide || 'b';

    let prevFolio: string | null = null;
    if (side === 'b') {
      if (folioNum > tStartFolio || tStartSide === 'a') {
        prevFolio = `${folioNum}a`;
      }
    } else {
      if (folioNum > tStartFolio) {
        prevFolio = `${folioNum - 1}b`;
      }
    }

    let nextFolio: string | null = null;
    if (tMaxFolio) {
      if (side === 'a') {
        if (folioNum < tMaxFolio || (folioNum === tMaxFolio && tLastSide === 'b')) {
          nextFolio = `${folioNum}b`;
        }
      } else {
        if (folioNum < tMaxFolio) {
          nextFolio = `${folioNum + 1}a`;
        }
      }
    }

    nav = `<nav aria-label="Page navigation">`;
    if (prevFolio) {
      nav += `<a href="/talmud/${safeTractatePath}/${prevFolio}">&larr; ${escapeHtml(tractateTitle)} ${prevFolio.toUpperCase()}</a> `;
    }
    if (nextFolio) {
      nav += `<a href="/talmud/${safeTractatePath}/${nextFolio}">${escapeHtml(tractateTitle)} ${nextFolio.toUpperCase()} &rarr;</a>`;
    }
    nav += `</nav>`;
  } else if (urlPath === '/bible') {
    heading = 'Hebrew Bible (Tanach)';
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; Bible</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    const { TORAH_BOOKS, NEVIIM_BOOKS, KETUVIM_BOOKS } = await import('@shared/bible-books');
    const sections: [string, any[]][] = [['Torah', TORAH_BOOKS], ["Nevi'im (Prophets)", NEVIIM_BOOKS], ['Ketuvim (Writings)', KETUVIM_BOOKS]];
    nav = '';
    for (const [label, books] of sections) {
      nav += `<h3>${escapeHtml(label)}</h3><ul>`;
      for (const b of books) {
        nav += `<li><a href="/bible/${safeSlug(b.slug)}">${escapeHtml(b.name)} (${escapeHtml(b.hebrew)})</a> — ${b.chapters} chapters</li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/bible\/[^/]+$/)) {
    const bookSlug = urlPath.split('/')[2];
    const book = getBookBySlug(bookSlug);
    const bookTitle = book ? book.name : bookSlug.replace(/_/g, ' ');
    const safeBookPath = safeSlug(bookSlug);
    heading = bookTitle;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/bible">Bible</a> &rsaquo; ${escapeHtml(bookTitle)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    if (book) {
      nav = `<h3>Chapters</h3><ul>`;
      for (let c = 1; c <= book.chapters; c++) {
        nav += `<li><a href="/bible/${safeBookPath}/${c}">${escapeHtml(bookTitle)} Chapter ${c}</a></li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/bible\/[^/]+\/\d+$/)) {
    const parts = urlPath.split('/');
    const bookSlug = parts[2];
    const chapter = parts[3];
    const book = getBookBySlug(bookSlug);
    const bookTitle = book ? book.name : bookSlug.replace(/_/g, ' ');
    const safeBookPath = safeSlug(bookSlug);
    heading = `${bookTitle} Chapter ${chapter}`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/bible">Bible</a> &rsaquo; <a href="/bible/${safeBookPath}">${escapeHtml(bookTitle)}</a> &rsaquo; Chapter ${escapeHtml(chapter)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;

    try {
      const text = await storage.getText('Bible', bookSlug, parseInt(chapter), 0, 'a');
      if (text && text.englishSections) {
        const sections = text.englishSections as string[];
        const snippet = sections.slice(0, 8).map(s =>
          typeof s === 'string' ? s.replace(/<[^>]*>/g, '').substring(0, 300) : ''
        ).filter(Boolean);
        if (snippet.length > 0) {
          body += `<div><h2>Text</h2><ol>`;
          for (const line of snippet) {
            body += `<li>${escapeHtml(line)}</li>`;
          }
          body += `</ol></div>`;
        }
      }
    } catch {}

    const chapterNum = parseInt(chapter);
    nav = `<nav aria-label="Page navigation">`;
    if (chapterNum > 1) {
      nav += `<a href="/bible/${safeBookPath}/${chapterNum - 1}">&larr; Chapter ${chapterNum - 1}</a> `;
    }
    if (book && chapterNum < book.chapters) {
      nav += `<a href="/bible/${safeBookPath}/${chapterNum + 1}">Chapter ${chapterNum + 1} &rarr;</a>`;
    }
    nav += `</nav>`;
  } else if (urlPath === '/rambam') {
    heading = 'Mishneh Torah (Rambam) — All Hilchot';
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; Mishneh Torah</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    nav = '';
    for (const book of RAMBAM_BOOKS) {
      nav += `<h3>${escapeHtml(book.name)}</h3><ul>`;
      for (const h of book.hilchot) {
        nav += `<li><a href="/rambam/${safeSlug(h.slug)}">${escapeHtml(h.displayName)}</a> (${h.chapters} chapters)</li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/rambam\/[^/]+$/)) {
    const hilchotSlug = urlPath.split('/')[2];
    const info = getRambamHilchotInfo(hilchotSlug);
    const hilchotTitle = info ? info.displayName : hilchotSlug.replace(/_/g, ' ');
    const safeHilchot = safeSlug(hilchotSlug);
    heading = `${hilchotTitle} — Mishneh Torah`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/rambam">Mishneh Torah</a> &rsaquo; ${escapeHtml(hilchotTitle)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    if (info) {
      nav = `<h3>Chapters</h3><ul>`;
      for (let c = 1; c <= info.chapters; c++) {
        nav += `<li><a href="/rambam/${safeHilchot}/${c}">${escapeHtml(hilchotTitle)} Chapter ${c}</a></li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/rambam\/[^/]+\/\d+$/)) {
    const parts = urlPath.split('/');
    const hilchotSlug = parts[2];
    const chapter = parseInt(parts[3]);
    const info = getRambamHilchotInfo(hilchotSlug);
    const hilchotTitle = info ? info.displayName : hilchotSlug.replace(/_/g, ' ');
    const safeHilchot = safeSlug(hilchotSlug);
    heading = `${hilchotTitle} Chapter ${chapter} — Mishneh Torah`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/rambam">Mishneh Torah</a> &rsaquo; <a href="/rambam/${safeHilchot}">${escapeHtml(hilchotTitle)}</a> &rsaquo; Chapter ${chapter}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    nav = `<nav aria-label="Page navigation">`;
    if (chapter > 1) {
      nav += `<a href="/rambam/${safeHilchot}/${chapter - 1}">&larr; Chapter ${chapter - 1}</a> `;
    }
    if (info && chapter < info.chapters) {
      nav += `<a href="/rambam/${safeHilchot}/${chapter + 1}">Chapter ${chapter + 1} &rarr;</a>`;
    }
    nav += `</nav>`;
  } else if (urlPath === '/yerushalmi') {
    heading = 'Jerusalem Talmud (Talmud Yerushalmi) — All Tractates';
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; Jerusalem Talmud</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    const { YERUSHALMI_TRACTATES, YERUSHALMI_HEBREW_NAMES } = await import('@shared/yerushalmi-data');
    const sederLabels: Record<string, string> = {
      zeraim: 'Seder Zeraim (Seeds)',
      moed: 'Seder Moed (Festivals)',
      nashim: 'Seder Nashim (Women)',
      nezikin: 'Seder Nezikin (Damages)',
    };
    nav = '';
    for (const [sederKey, tractates] of Object.entries(YERUSHALMI_TRACTATES)) {
      nav += `<h3>${escapeHtml(sederLabels[sederKey] || sederKey)}</h3><ul>`;
      for (const t of tractates) {
        const slug = t.name.toLowerCase().replace(/ /g, '-');
        const hebrew = YERUSHALMI_HEBREW_NAMES[t.name] || '';
        nav += `<li><a href="/yerushalmi/${safeSlug(slug)}">${escapeHtml(t.name)}${hebrew ? ` (${escapeHtml(hebrew)})` : ''}</a></li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/yerushalmi\/[^/]+$/)) {
    const tractateSlug = urlPath.split('/')[2];
    const { getYerushalmiTractateInfo } = await import('@shared/yerushalmi-data');
    const info = getYerushalmiTractateInfo(tractateSlug);
    const tractateTitle = info ? info.name : tractateSlug.replace(/_/g, ' ');
    const safeTractate = safeSlug(tractateSlug);
    heading = `${tractateTitle} — Jerusalem Talmud`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/yerushalmi">Jerusalem Talmud</a> &rsaquo; ${escapeHtml(tractateTitle)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    if (info) {
      nav = `<h3>Chapters</h3><ul>`;
      for (let c = 1; c <= info.chapters; c++) {
        nav += `<li><a href="/yerushalmi/${safeTractate}/${c}">${escapeHtml(tractateTitle)} Chapter ${c}</a></li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/yerushalmi\/[^/]+\/\d+$/)) {
    const parts = urlPath.split('/');
    const tractateSlug = parts[2];
    const chapter = parseInt(parts[3]);
    const { getYerushalmiTractateInfo } = await import('@shared/yerushalmi-data');
    const info = getYerushalmiTractateInfo(tractateSlug);
    const tractateTitle = info ? info.name : tractateSlug.replace(/_/g, ' ');
    const safeTractate = safeSlug(tractateSlug);
    heading = `${tractateTitle} Chapter ${chapter} — Jerusalem Talmud`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/yerushalmi">Jerusalem Talmud</a> &rsaquo; <a href="/yerushalmi/${safeTractate}">${escapeHtml(tractateTitle)}</a> &rsaquo; Chapter ${chapter}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    const chapterNum = chapter;
    nav = `<nav aria-label="Page navigation">`;
    if (chapterNum > 1) {
      nav += `<a href="/yerushalmi/${safeTractate}/${chapterNum - 1}">&larr; Chapter ${chapterNum - 1}</a> `;
    }
    if (info && chapterNum < info.chapters) {
      nav += `<a href="/yerushalmi/${safeTractate}/${chapterNum + 1}">Chapter ${chapterNum + 1} &rarr;</a>`;
    }
    nav += `</nav>`;
  } else {
    heading = seoData.title.replace(/ \| ChavrutAI$/, '').replace(/ - ChavrutAI$/, '');
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; ${escapeHtml(heading)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
  }

  return `<div id="crawler-content">` +
    (breadcrumbs ? breadcrumbs : '') +
    `<h1>${escapeHtml(heading)}</h1>` +
    body +
    nav +
    `<footer><p><a href="${escapeHtml(baseUrl)}">ChavrutAI</a> — Free online Talmud and Bible study platform</p></footer>` +
    `</div>`;
}

function isCrawlerRequest(userAgent: string): boolean {
  const crawlerPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
    /applebot/i,
    /crawler/i,
    /spider/i,
    /bot/i
  ];
  
  return crawlerPatterns.some(pattern => pattern.test(userAgent));
}

async function servePageWithMeta(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const userAgent = req.get('User-Agent') || '';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isCrawlerRequest(userAgent)) {
      return next();
    }
    
    const isAssetRequest = req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i);
    if (isAssetRequest) {
      return next();
    }
    
    const clientTemplate = path.resolve(
      import.meta.dirname,
      "..",
      "client",
      "index.html",
    );

    let template = await fs.promises.readFile(clientTemplate, "utf-8");
    
    const seoData = generateServerSideMetaTags(req.originalUrl);
    
    template = template
      .replace(
        /<title>.*?<\/title>/,
        `<title>${seoData.title}</title>`
      )
      .replace(
        /<meta name="description" content=".*?"/,
        `<meta name="description" content="${seoData.description}"`
      )
      .replace(
        /<meta property="og:title" content=".*?"/,
        `<meta property="og:title" content="${seoData.ogTitle}"`
      )
      .replace(
        /<meta property="og:description" content=".*?"/,
        `<meta property="og:description" content="${seoData.ogDescription}"`
      )
      .replace(
        /<meta property="og:url" content=".*?"/,
        `<meta property="og:url" content="${seoData.canonical}"`
      )
      .replace(
        /<meta name="robots" content=".*?"/,
        `<meta name="robots" content="${seoData.robots}"`
      );
    
    if (template.includes('<link rel="canonical"')) {
      template = template.replace(
        /<link rel="canonical" href=".*?" \/>/,
        `<link rel="canonical" href="${seoData.canonical}" />`
      );
    } else {
      template = template.replace(
        '</head>',
        `  <link rel="canonical" href="${seoData.canonical}" />\n  </head>`
      );
    }

    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://chavrutai.com' : 'http://localhost:5000';
    const structuredData = generateServerSideStructuredData(req.path, baseUrl);
    if (structuredData) {
      const jsonLdScript = `  <script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n  </script>\n  </head>`;
      if (template.includes('application/ld+json')) {
        template = template.replace(
          /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
          `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n  </script>`
        );
      } else {
        template = template.replace('</head>', jsonLdScript);
      }
    }

    const crawlerContent = await generateCrawlerBodyContent(req.path, seoData);
    template = template.replace(
      '<div id="root"></div>',
      `${crawlerContent}\n    <div id="root"></div>`
    );
    
    res.status(200).set({ "Content-Type": "text/html" }).end(template);
  } catch (error) {
    console.error('Error serving page with meta:', error);
    next(error);
  }
}

export function shouldNoIndex(url: string): boolean {
  return false;
}

export { servePageWithMeta };
