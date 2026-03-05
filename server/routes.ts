import express, { type Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { insertTextSchema, searchRequestSchema, browseRequestSchema, autosuggestRequestSchema, textSearchRequestSchema, type SearchResult, type TextSearchResponse } from "@shared/schema";
import { normalizeSefariaTractateName, normalizeDisplayTractateName, isValidTractate, getTractateSlug } from "@shared/tractates";
import { generateSitemapIndex } from "./routes/sitemap-index";
import { generateMainSitemap } from "./routes/sitemap-main";
import { generateSederSitemap } from "./routes/sitemap-seder";
import { z } from "zod";
import OpenAI from "openai";
import { getBlogPostSearch } from "./blog-search";
import { sendChatbotAlert } from "./lib/gmail-client";

// Import text processing utilities from shared library
import { processHebrewTextCore as processHebrewText, processEnglishText } from "@shared/text-processing";

const sefariaAPIBaseURL = "https://www.sefaria.org/api";

// Query parameters schema for text requests
const textQuerySchema = z.object({
  work: z.string(),
  tractate: z.string(), 
  chapter: z.coerce.number(),
  folio: z.coerce.number(),
  side: z.enum(['a', 'b'])
});

const tractateListSchema = z.object({
  work: z.string()
});

// Generate SEO meta tags based on URL route
function generateServerSideMetaTags(url: string): { title: string; description: string; ogTitle: string; ogDescription: string; canonical: string; robots: string } {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://chavrutai.com' : 'http://localhost:5000';
  
  // Default fallback (current static meta)
  let seoData = {
    title: "Study Talmud Online - Free Digital Platform | ChavrutAI",
    description: "Access all 37 tractates of the Babylonian Talmud with Hebrew-English text, chapter navigation, and modern study tools. Start learning today - completely free.",
    ogTitle: "Study Talmud Online Free - Digital Platform",
    ogDescription: "Access all 37 tractates of the Babylonian Talmud with Hebrew-English text, chapter navigation, and modern study tools. Start learning today - completely free.",
    canonical: `${baseUrl}/`,
    robots: "index, follow"
  };

  // Route-specific SEO data (mirroring client-side generateSEOData)
  if (url === '/' || url === '/talmud') {
    // Homepage/Talmud Contents - keep current data
    seoData.canonical = `${baseUrl}${url === '/' ? '/' : '/talmud'}`;
  } else if (url === '/about') {
    seoData = {
      title: "About ChavrutAI - Free Digital Talmud Learning Platform",
      description: "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
      ogTitle: "About ChavrutAI - Free Digital Talmud Learning Platform",
      ogDescription: "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
      canonical: `${baseUrl}/about`,
      robots: "index, follow"
    };
  } else if (url === '/suggested-pages') {
    seoData = {
      title: "Famous Talmud Pages - Essential Teachings & Stories | ChavrutAI",
      description: "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
      ogTitle: "Famous Talmud Pages - Essential Teachings & Stories",
      ogDescription: "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
      canonical: `${baseUrl}/suggested-pages`,
      robots: "index, follow"
    };
  } else if (url === '/biblical-index') {
    seoData = {
      title: "Biblical Citations in the Talmud - Complete Index | ChavrutAI",
      description: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud. Search Torah, Prophets, and Writings references with direct links to Talmudic passages.",
      ogTitle: "Biblical Citations in the Talmud - Complete Index",
      ogDescription: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud.",
      canonical: `${baseUrl}/biblical-index`,
      robots: "index, follow"
    };
  } else if (url === '/blog-posts') {
    seoData = {
      title: '"Talmud & Tech" Blog Posts by Talmud Location | ChavrutAI',
      description: 'Blog posts analyzing Talmudic passages, organized by tractate and page location. Click on titles to go to the full articles at the "Talmud & Tech" Blog, or use location links to jump to the corresponding text in ChavrutAI.',
      ogTitle: '"Talmud & Tech" Blog Posts by Talmud Location',
      ogDescription: 'Blog posts analyzing Talmudic passages, organized by tractate and page location.',
      canonical: `${baseUrl}/blog-posts`,
      robots: "index, follow"
    };
  } else if (url === '/dictionary') {
    seoData = {
      title: "Jastrow Talmud Dictionary - Modernized Hebrew & Aramaic | ChavrutAI",
      description: "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic. Modernized presentation with expanded abbreviations, enhanced readability, and direct term lookup.",
      ogTitle: "Jastrow Talmud Dictionary - Modernized Hebrew & Aramaic",
      ogDescription: "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic with modernized presentation and enhanced readability.",
      canonical: `${baseUrl}/dictionary`,
      robots: "index, follow"
    };
  } else if (url === '/bible') {
    seoData = {
      title: "Bible (Tanach) - Hebrew & English | ChavrutAI",
      description: "Read the complete Hebrew Bible (Tanach) with JPS 1985 English translation. Access all 24 books of the Torah, Nevi'im, and Ketuvim with parallel Hebrew-English text.",
      ogTitle: "Bible (Tanach) - Hebrew & English",
      ogDescription: "Read the complete Hebrew Bible with JPS 1985 translation.",
      canonical: `${baseUrl}/bible`,
      robots: "index, follow"
    };
  } else if (url === '/sitemap') {
    seoData = {
      title: "Site Map - ChavrutAI Talmud Navigation Guide",
      description: "Complete navigation guide to all 37 Talmud tractates organized by traditional Seder structure. Find any page across 5,400+ folios in the Babylonian Talmud.",
      ogTitle: "Site Map - ChavrutAI Talmud Navigation Guide",
      ogDescription: "Complete navigation guide to all 37 Talmud tractates organized by traditional Seder structure.",
      canonical: `${baseUrl}/sitemap`,
      robots: "index, follow"
    };
  } else if (url === '/contact') {
    seoData = {
      title: "Contact | ChavrutAI",
      description: "Contact ChavrutAI with feedback, suggestions, and corrections. We appreciate all input to improve our digital Talmud study platform.",
      ogTitle: "Contact | ChavrutAI",
      ogDescription: "Contact ChavrutAI with feedback, suggestions, and corrections.",
      canonical: `${baseUrl}/contact`,
      robots: "index, follow"
    };
  } else if (url === '/privacy') {
    seoData = {
      title: "Privacy Policy - ChavrutAI Talmud Study Platform",
      description: "Privacy policy for ChavrutAI - learn how we handle your data when using our free Talmud study platform.",
      ogTitle: "Privacy Policy - ChavrutAI",
      ogDescription: "Privacy policy for ChavrutAI - learn how we handle your data when using our free Talmud study platform.",
      canonical: `${baseUrl}/privacy`,
      robots: "index, follow"
    };
  } else if (url === '/changelog') {
    seoData = {
      title: "Changelog - ChavrutAI",
      description: "Recent updates and improvements to ChavrutAI. Track new features, design enhancements, and user experience improvements for Talmud study.",
      ogTitle: "Changelog - ChavrutAI",
      ogDescription: "Recent updates and improvements to ChavrutAI.",
      canonical: `${baseUrl}/changelog`,
      robots: "index, follow"
    };
  } else if (url.match(/^\/talmud\/[^/]+$/)) {
    // Tractate pages like /talmud/berakhot
    const tractate = url.split('/')[2];
    const tractateTitle = normalizeDisplayTractateName(tractate);
    seoData = {
      title: `${tractateTitle} Talmud - Complete Chapter Guide | ChavrutAI`,
      description: `Study ${tractateTitle} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access. Free online Talmud learning.`,
      ogTitle: `${tractateTitle} Talmud - Complete Study Guide`,
      ogDescription: `Study ${tractateTitle} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access.`,
      canonical: `${baseUrl}/talmud/${tractate}`,
      robots: "index, follow"
    };
  } else if (url.match(/^\/talmud\/[^/]+\/\d+[ab]$/)) {
    // Individual folio pages like /talmud/berakhot/2a
    const urlParts = url.split('/');
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
  } else if (url.startsWith('/search')) {
    // Parse query params for richer titles
    const urlObj = new URL(url, baseUrl);
    const query = urlObj.searchParams.get('q') || '';
    const type = urlObj.searchParams.get('type') || '';

    let title: string;
    let description: string;
    let ogTitle: string;
    let ogDescription: string;

    if (query) {
      const typeLabel = type === 'bible' ? 'Bible' : type === 'talmud' ? 'Talmud' : 'Talmud & Bible';
      title = `Search results for "${query}" in ${typeLabel} | ChavrutAI`;
      ogTitle = `Search: "${query}" – ${typeLabel} | ChavrutAI`;
      description = `Search results for "${query}" in the ${typeLabel}. Find passages, explore Hebrew and English text, and study with ChavrutAI.`;
      ogDescription = `Search results for "${query}" in the ${typeLabel} on ChavrutAI.`;
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
      robots: "index, follow"
    };
  }
  
  return seoData;
}

// Check if request is from a search engine crawler
function isCrawlerRequest(userAgent: string): boolean {
  const crawlerPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
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

// Serve HTML page with server-side injected meta tags (only for crawlers)
async function servePageWithMeta(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const userAgent = req.get('User-Agent') || '';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Only serve SSR for crawlers - let static/Vite handle regular browsers and assets
    if (!isCrawlerRequest(userAgent)) {
      return next(); // Let Vite (dev) or static serving (prod) handle this request
    }
    
    // Additional safety: don't serve SSR for asset requests
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

    // Read the HTML template
    let template = await fs.promises.readFile(clientTemplate, "utf-8");
    
    // Generate SEO data for this route
    const seoData = generateServerSideMetaTags(req.originalUrl);
    
    // Replace static meta tags with dynamic ones
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
    
    // Add canonical tag if not present
    if (!template.includes('<link rel="canonical"')) {
      template = template.replace(
        '</head>',
        `  <link rel="canonical" href="${seoData.canonical}" />\n  </head>`
      );
    }
    
    res.status(200).set({ "Content-Type": "text/html" }).end(template);
  } catch (error) {
    console.error('Error serving page with meta:', error);
    // Fall through to next middleware (Vite)
    next(error);
  }
}

// SEO route handler - now allowing all pages to be indexed
function shouldNoIndex(url: string): boolean {
  // Allow all pages to be indexed for comprehensive search coverage
  // This enables indexing of all 5,496+ folio pages across 37 tractates
  return false; // Index all pages
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // URL normalization middleware - redirect all URL variations to canonical format
  app.use((req, res, next) => {
    const url = req.path;
    let canonicalUrl = url;
    let needsRedirect = false;
    
    // Remove trailing slashes (except for root)
    if (url.length > 1 && url.endsWith('/')) {
      canonicalUrl = canonicalUrl.slice(0, -1);
      needsRedirect = true;
    }
    
    // Normalize tractate folio pages: /talmud/:tractate/:folio
    const talmudFolioMatch = canonicalUrl.match(/^\/talmud\/([^/]+)\/(\d+)([ab])$/i);
    if (talmudFolioMatch) {
      const [, tractate, folio, side] = talmudFolioMatch;
      const normalizedTractate = getTractateSlug(tractate);
      const normalizedFolio = folio + side.toLowerCase();
      const normalizedUrl = `/talmud/${normalizedTractate}/${normalizedFolio}`;
      
      if (canonicalUrl !== normalizedUrl) {
        canonicalUrl = normalizedUrl;
        needsRedirect = true;
      }
    }
    
    // Redirect old /tractate/:tractate/:folio URLs to /talmud/:tractate/:folio
    const oldTractateMatch = canonicalUrl.match(/^\/tractate\/([^/]+)\/(\d+)([ab])$/i);
    if (oldTractateMatch) {
      const [, tractate, folio, side] = oldTractateMatch;
      const normalizedTractate = getTractateSlug(tractate);
      const normalizedFolio = folio + side.toLowerCase();
      canonicalUrl = `/talmud/${normalizedTractate}/${normalizedFolio}`;
      needsRedirect = true;
    }
    
    // Normalize tractate contents pages: /talmud/:tractate
    const talmudPageMatch = canonicalUrl.match(/^\/talmud\/([^/]+)$/i);
    if (talmudPageMatch) {
      const [, tractate] = talmudPageMatch;
      const normalizedTractate = getTractateSlug(tractate);
      const normalizedUrl = `/talmud/${normalizedTractate}`;
      
      if (canonicalUrl !== normalizedUrl) {
        canonicalUrl = normalizedUrl;
        needsRedirect = true;
      }
    }
    
    // 301 redirect from old /contents URLs to new /talmud URLs (SEO preservation)
    if (canonicalUrl === '/contents') {
      canonicalUrl = '/talmud';
      needsRedirect = true;
    }
    const oldContentsPageMatch = canonicalUrl.match(/^\/contents\/([^/]+)$/i);
    if (oldContentsPageMatch) {
      const [, tractate] = oldContentsPageMatch;
      const normalizedTractate = getTractateSlug(tractate);
      canonicalUrl = `/talmud/${normalizedTractate}`;
      needsRedirect = true;
    }
    
    // Perform 301 redirect if URL needs normalization
    if (needsRedirect) {
      const fullCanonicalUrl = canonicalUrl + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
      return res.redirect(301, fullCanonicalUrl);
    }
    
    next();
  });
  
  // SEO middleware for strategic indexing (must run before specific routes)
  app.use('*', (req, res, next) => {
    if (shouldNoIndex(req.originalUrl)) {
      // Set custom headers for client-side detection
      res.setHeader('X-SEO-NoIndex', 'true');
      // Set official robots header for search engines
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });
  
  // Server-side meta tag injection for critical pages
  app.get('/', servePageWithMeta);
  app.get('/about', servePageWithMeta);
  app.get('/talmud', servePageWithMeta);
  app.get('/suggested-pages', servePageWithMeta);
  app.get('/privacy', servePageWithMeta);
  app.get('/search', servePageWithMeta);
  app.get('/talmud/:tractate', servePageWithMeta);
  app.get('/talmud/:tractate/:folio', servePageWithMeta);
  
  // Get specific text
  app.get("/api/text", async (req, res) => {
    try {
      const { work, tractate, chapter, folio, side } = textQuerySchema.parse(req.query);
      
      // Validate tractate name
      if (!isValidTractate(tractate)) {
        res.status(404).json({ error: `Invalid tractate: ${tractate}` });
        return;
      }
      
      // Validate page exists (some tractates don't have 'b' side on their final folio)
      const { isValidPage } = await import('@shared/talmud-navigation');
      if (!isValidPage(tractate, folio, side as 'a' | 'b')) {
        res.status(404).json({ error: `Page does not exist: ${tractate} ${folio}${side}` });
        return;
      }
      
      // Try to get from local storage first
      let text = await storage.getText(work, tractate, chapter, folio, side);
      
      // If not found locally, try to fetch from Sefaria
      if (!text) {
        try {
          // Normalize tractate name for Sefaria API
          const normalizedTractate = normalizeSefariaTractateName(tractate);
          const sefariaRef = `${normalizedTractate}.${folio}${side}`;
          console.log(`Fetching from Sefaria: ${sefariaRef} (original: ${tractate})`);
          const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);
          
          if (response.ok) {
            const sefariaData = await response.json();
            
            // Parse Sefaria response and preserve section structure
            const hebrewSections = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ''];
            const englishSections = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ''];
            
            // Process each section individually
            const processedHebrewSections = hebrewSections.map((section: string) => processHebrewText(section || ''));
            const processedEnglishSections = englishSections.map((section: string) => processEnglishText(section || ''));
            
            // Also create combined text for backward compatibility
            const hebrewText = processedHebrewSections.join('\n\n');
            const englishText = processedEnglishSections.join('\n\n');
            
            // Fetch next page's first section for page continuation
            let nextPageFirstSection: { hebrew: string; english: string } | null = null;
            
            try {
              const nextFolio = side === 'a' ? folio : folio + 1;
              const nextSide = side === 'a' ? 'b' : 'a';
              const nextSefariaRef = `${normalizedTractate}.${nextFolio}${nextSide}`;
              const nextResponse = await fetch(`${sefariaAPIBaseURL}/texts/${nextSefariaRef}?lang=bi&commentary=0`);
              
              if (nextResponse.ok) {
                const nextSefariaData = await nextResponse.json();
                const nextHebrewSections = Array.isArray(nextSefariaData.he) ? nextSefariaData.he : [nextSefariaData.he || ''];
                const nextEnglishSections = Array.isArray(nextSefariaData.text) ? nextSefariaData.text : [nextSefariaData.text || ''];
                
                if (nextHebrewSections[0] || nextEnglishSections[0]) {
                  nextPageFirstSection = {
                    hebrew: processHebrewText(nextHebrewSections[0] || ''),
                    english: processEnglishText(nextEnglishSections[0] || '')
                  };
                }
              }
            } catch (nextPageError) {
              console.log('Could not fetch next page for continuation:', nextPageError);
            }

            const newText = {
              work,
              tractate,
              chapter,
              folio,
              side,
              hebrewText,
              englishText,
              hebrewSections: processedHebrewSections,
              englishSections: processedEnglishSections,
              sefariaRef,
              nextPageFirstSection
            };
            
            text = await storage.createText(newText);
          }
        } catch (sefariaError) {
          console.error('Error fetching from Sefaria:', sefariaError);
        }
      }
      
      if (!text) {
        return res.status(404).json({ 
          message: `Text not found for ${work} ${tractate} ${chapter} ${folio}${side}` 
        });
      }
      
      res.json(text);
    } catch (error) {
      console.error('Error in /api/text:', error);
      res.status(400).json({ message: "Invalid request parameters" });
    }
  });

  // Get list of tractates for a work
  app.get("/api/tractates", async (req, res) => {
    try {
      const { work } = tractateListSchema.parse(req.query);
      const { TRACTATE_LISTS } = await import('../shared/tractates');
      
      res.json({ tractates: TRACTATE_LISTS[work as keyof typeof TRACTATE_LISTS] || [] });
    } catch (error) {
      res.status(400).json({ message: "Invalid work parameter" });
    }
  });

  // Get chapters for a tractate
  app.get("/api/chapters", async (req, res) => {
    try {
      const { tractate } = z.object({ tractate: z.string() }).parse(req.query);
      
      const { TRACTATE_FOLIO_RANGES } = await import('../shared/tractates');
      
      const maxFolio = TRACTATE_FOLIO_RANGES[tractate as keyof typeof TRACTATE_FOLIO_RANGES] || 150;
      
      // Return a single chapter covering the full folio range
      const chapters = [
        { number: 1, folioRange: `2-${maxFolio}` }
      ];
      
      res.json({ chapters });
    } catch (error) {
      res.status(400).json({ message: "Invalid tractate parameter" });
    }
  });

  // Sefaria fetch endpoint for the fetch page
  app.get("/api/sefaria-fetch", async (req, res) => {
    try {
      const { inputMethod, tractate, page, section, url } = req.query;

      let sefariaRef = '';
      let parsedTractate = '';
      let parsedPage = '';
      let parsedSection: number | undefined;

      if (inputMethod === 'url' && typeof url === 'string') {
        // Parse Sefaria URL - remove query parameters first
        const cleanUrl = url.split('?')[0];
        const urlParts = cleanUrl.split('/');
        const reference = urlParts[urlParts.length - 1];
        
        if (!reference) {
          res.status(400).json({ error: 'Invalid URL format' });
          return;
        }

        // Parse reference with support for multiple formats:
        // - "Sanhedrin.43b.9" (single section)
        // - "Sukkah.53a.5-6" (same page range)
        // - "Sukkah.52a.4-53a.4" (cross-page range)
        
        // First try to match cross-page range: Tractate.PageA.SectionA-PageB.SectionB
        const crossPageMatch = reference.match(/^([^.]+)\.(\d+[ab])\.(\d+)-(\d+[ab])\.(\d+)$/);
        if (crossPageMatch) {
          parsedTractate = crossPageMatch[1];
          parsedPage = crossPageMatch[2]; // Start page
          parsedSection = parseInt(crossPageMatch[3]); // Start section
        } else {
          // Try single page format: Tractate.Page or Tractate.Page.Section or Tractate.Page.Section-Section
          const singlePageMatch = reference.match(/^([^.]+)\.(\d+[ab])(?:\.(\d+(?:-\d+)?))?$/);
          if (!singlePageMatch) {
            res.status(400).json({ error: 'Invalid reference format' });
            return;
          }

          parsedTractate = singlePageMatch[1];
          parsedPage = singlePageMatch[2];
          // For ranges like "5-6", just take the first section
          if (singlePageMatch[3]) {
            const sectionPart = singlePageMatch[3].split('-')[0];
            parsedSection = parseInt(sectionPart);
          }
        }
      } else if (inputMethod === 'dropdown') {
        parsedTractate = tractate as string;
        parsedPage = page as string;
        parsedSection = (section && section !== 'all') ? parseInt(section as string) : undefined;
      } else {
        res.status(400).json({ error: 'Invalid input method' });
        return;
      }

      // Normalize tractate name for Sefaria API
      const normalizedTractate = normalizeSefariaTractateName(parsedTractate);
      
      // Check if we have a cross-page range
      const urlParts = typeof url === 'string' ? url.split('?')[0].split('/') : [];
      const reference = urlParts[urlParts.length - 1] || '';
      const crossPageRangeMatch = reference.match(/^([^.]+)\.(\d+[ab])\.(\d+)-(\d+[ab])\.(\d+)$/);
      
      let hebrewSections: string[] = [];
      let englishSections: string[] = [];
      
      if (crossPageRangeMatch) {
        // Handle cross-page range: Sukkah.52a.4-53a.4
        const startPage = crossPageRangeMatch[2];
        const startSection = parseInt(crossPageRangeMatch[3]);
        const endPage = crossPageRangeMatch[4];
        const endSection = parseInt(crossPageRangeMatch[5]);
        
        // Generate list of pages to fetch
        const pagesToFetch: string[] = [];
        const startPageNum = parseInt(startPage.slice(0, -1));
        const startPageSide = startPage.slice(-1);
        const endPageNum = parseInt(endPage.slice(0, -1));
        const endPageSide = endPage.slice(-1);
        
        if (startPageNum === endPageNum) {
          // Same folio, different sides
          if (startPageSide === 'a') {
            pagesToFetch.push(`${startPageNum}a`);
            if (endPageSide === 'b') {
              pagesToFetch.push(`${startPageNum}b`);
            }
          } else {
            pagesToFetch.push(`${startPageNum}b`);
          }
        } else {
          // Different folios
          for (let folio = startPageNum; folio <= endPageNum; folio++) {
            if (folio === startPageNum) {
              if (startPageSide === 'a') {
                pagesToFetch.push(`${folio}a`, `${folio}b`);
              } else {
                pagesToFetch.push(`${folio}b`);
              }
            } else if (folio === endPageNum) {
              pagesToFetch.push(`${folio}a`);
              if (endPageSide === 'b') {
                pagesToFetch.push(`${folio}b`);
              }
            } else {
              pagesToFetch.push(`${folio}a`, `${folio}b`);
            }
          }
        }
        
        // Fetch all pages and combine sections
        for (const pageRef of pagesToFetch) {
          const sefariaRef = `${normalizedTractate}.${pageRef}`;
          console.log(`Fetching from Sefaria: ${sefariaRef}`);
          const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);
          
          if (response.ok) {
            const sefariaData = await response.json();
            const pageHebrew = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ''];
            const pageEnglish = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ''];
            
            // Filter sections based on start/end
            if (pageRef === startPage) {
              hebrewSections.push(...pageHebrew.slice(startSection - 1));
              englishSections.push(...pageEnglish.slice(startSection - 1));
            } else if (pageRef === endPage) {
              hebrewSections.push(...pageHebrew.slice(0, endSection));
              englishSections.push(...pageEnglish.slice(0, endSection));
            } else {
              hebrewSections.push(...pageHebrew);
              englishSections.push(...pageEnglish);
            }
          }
        }
      } else {
        // Single page fetch
        sefariaRef = `${normalizedTractate}.${parsedPage}`;
        console.log(`Fetching from Sefaria: ${sefariaRef}`);
        const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);
        
        if (!response.ok) {
          res.status(response.status).json({ error: `Failed to fetch text from Sefaria` });
          return;
        }

        const sefariaData = await response.json();
        
        // Parse Sefaria response and preserve section structure
        hebrewSections = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ''];
        englishSections = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ''];

        // Filter to specific section or range if requested
        if (parsedSection !== undefined) {
          const sectionIdx = parsedSection - 1;
          const rangeMatch = reference.match(/\.(\d+)-(\d+)$/);
          
          if (rangeMatch) {
            // Handle section range on same page
            const startSection = parseInt(rangeMatch[1]);
            const endSection = parseInt(rangeMatch[2]);
            const startIdx = startSection - 1;
            const endIdx = endSection; // end is inclusive
            
            if (startIdx >= 0 && startIdx < hebrewSections.length) {
              hebrewSections = hebrewSections.slice(startIdx, endIdx);
              englishSections = englishSections.slice(startIdx, endIdx);
            } else {
              hebrewSections = [];
              englishSections = [];
            }
          } else {
            // Handle single section
            if (sectionIdx >= 0 && sectionIdx < hebrewSections.length) {
              hebrewSections = [hebrewSections[sectionIdx]];
              englishSections = [englishSections[sectionIdx]];
            } else {
              hebrewSections = [];
              englishSections = [];
            }
          }
        }
      }

      // Process each section individually with the same text processing as the rest of the app
      const processedHebrewSections = hebrewSections.map((section: string) => processHebrewText(section || ''));
      const processedEnglishSections = englishSections.map((section: string) => processEnglishText(section || ''));

      // Calculate span based on the actual range fetched
      let span: string;
      if (crossPageRangeMatch) {
        // Cross-page range
        const startPage = crossPageRangeMatch[2];
        const startSection = crossPageRangeMatch[3];
        const endPage = crossPageRangeMatch[4];
        const endSection = crossPageRangeMatch[5];
        span = `${parsedTractate} ${startPage}:${startSection}-${endPage}:${endSection}`;
      } else {
        // Check for same-page range
        const rangeMatch = reference.match(/\.(\d+)-(\d+)$/);
        if (rangeMatch) {
          const startSection = rangeMatch[1];
          const endSection = rangeMatch[2];
          span = `${parsedTractate} ${parsedPage}:${startSection}-${endSection}`;
        } else if (parsedSection) {
          // Single section
          span = `${parsedTractate} ${parsedPage}:${parsedSection}`;
        } else {
          // All sections on the page
          span = `${parsedTractate} ${parsedPage}:1-${englishSections.length}`;
        }
      }

      res.json({
        tractate: parsedTractate,
        page: parsedPage,
        section: parsedSection,
        hebrewSections: processedHebrewSections,
        englishSections: processedEnglishSections,
        span
      });
    } catch (error) {
      console.error('Error in /api/sefaria-fetch:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get sitemap data for human-readable HTML sitemap page
  app.get("/api/sitemap", async (req, res) => {
    try {
      // Import the SEDER_TRACTATES from shared module
      const { SEDER_TRACTATES } = await import('@shared/tractates');

      const sederInfo = {
        zeraim: { name: 'Zeraim', description: 'Order of Seeds - Agricultural laws and blessings' },
        moed: { name: 'Moed', description: 'Order of Appointed Times - Sabbath and festivals' },
        nashim: { name: 'Nashim', description: 'Order of Women - Marriage and divorce laws' },
        nezikin: { name: 'Nezikin', description: 'Order of Damages - Civil and criminal law' },
        kodashim: { name: 'Kodashim', description: 'Order of Holy Things - Temple service and ritual slaughter' },
        tohorot: { name: 'Tohorot', description: 'Order of Purities - Ritual purity laws' }
      };

      // Calculate actual page count considering startFolio/startSide and lastSide
      const getPageCount = (t: { folios: number; lastSide: 'a' | 'b'; startFolio?: number; startSide?: 'a' | 'b' }) => {
        const startFolio = (t as any).startFolio ?? 2;
        const startSide = (t as any).startSide ?? 'a';
        const startOffset = startSide === 'b' ? 1 : 0;
        const endOffset = t.lastSide === 'a' ? 1 : 0;
        return (t.folios - startFolio) * 2 + 2 - startOffset - endOffset;
      };

      // Calculate total pages for each Seder
      const sitemapData = Object.entries(SEDER_TRACTATES).map(([sederKey, tractates]) => {
        const totalFolios = tractates.reduce((sum, t) => sum + t.folios, 0);
        const totalPages = tractates.reduce((sum, t) => sum + getPageCount(t), 0);
        
        return {
          seder: sederKey,
          name: sederInfo[sederKey as keyof typeof sederInfo].name,
          description: sederInfo[sederKey as keyof typeof sederInfo].description,
          tractates: tractates.map(t => ({
            name: t.name,
            folios: t.folios,
            lastSide: t.lastSide,
            startFolio: (t as any).startFolio ?? 2,
            startSide: (t as any).startSide ?? 'a',
            slug: t.name.toLowerCase().replace(/\s+/g, '-'),
            pages: getPageCount(t)
          })),
          totalTractates: tractates.length,
          totalFolios,
          totalPages
        };
      });

      const allTractates = Object.values(SEDER_TRACTATES).flat();
      res.json({ 
        sedarim: sitemapData,
        summary: {
          totalSedarim: 6,
          totalTractates: allTractates.length,
          totalFolios: allTractates.reduce((sum, t) => sum + t.folios, 0),
          totalPages: allTractates.reduce((sum, t) => sum + getPageCount(t), 0)
        }
      });
    } catch (error) {
      console.error('Error in /api/sitemap:', error);
      res.status(500).json({ message: "Error generating sitemap data" });
    }
  });

  // Bible API Routes
  // Get Bible text for a specific book and chapter
  app.get("/api/bible/text", async (req, res) => {
    try {
      const { BibleQuerySchema } = await import('@shared/schema');
      const { book, chapter } = BibleQuerySchema.parse(req.query);
      
      const { getBookBySlug, normalizeSefariaBookName } = await import('@shared/bible-books');
      const { processHebrewVerse, processEnglishVerse } = await import('./lib/bible-text-processing');
      
      // Validate book
      const bookInfo = getBookBySlug(book);
      if (!bookInfo) {
        res.status(404).json({ error: `Invalid book: ${book}` });
        return;
      }
      
      // Validate chapter
      if (chapter < 1 || chapter > bookInfo.chapters) {
        res.status(400).json({ error: `Invalid chapter ${chapter} for ${bookInfo.name}. Valid range: 1-${bookInfo.chapters}` });
        return;
      }
      
      // Fetch from Sefaria - need to make two calls since v3 API doesn't support multi-version parameter
      const sefariaBookName = normalizeSefariaBookName(book);
      const sefariaRef = `${sefariaBookName}.${chapter}`;
      
      // Fetch Hebrew version
      const hebrewUrl = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(sefariaRef)}`;
      console.log(`Fetching Hebrew Bible text from Sefaria: ${hebrewUrl}`);
      const hebrewResponse = await fetch(hebrewUrl);
      
      if (!hebrewResponse.ok) {
        console.error(`Sefaria API error (Hebrew): ${hebrewResponse.status} ${hebrewResponse.statusText}`);
        res.status(hebrewResponse.status).json({ error: `Failed to fetch Hebrew Bible text from Sefaria` });
        return;
      }
      
      const hebrewData = await hebrewResponse.json();
      
      // Fetch English version (JPS 1985)
      const englishUrl = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(sefariaRef)}?version=english&versionTitle=JPS%201985%20Tanakh`;
      console.log(`Fetching English Bible text from Sefaria: ${englishUrl}`);
      const englishResponse = await fetch(englishUrl);
      
      if (!englishResponse.ok) {
        console.error(`Sefaria API error (English): ${englishResponse.status} ${englishResponse.statusText}`);
        res.status(englishResponse.status).json({ error: `Failed to fetch English Bible text from Sefaria` });
        return;
      }
      
      const englishData = await englishResponse.json();
      
      // Extract Hebrew and English verses from their respective responses
      const hebrewVerses = Array.isArray(hebrewData.versions[0]?.text) ? hebrewData.versions[0].text : [];
      const englishVerses = Array.isArray(englishData.versions[0]?.text) ? englishData.versions[0].text : [];
      
      // Process each verse
      const verses = hebrewVerses.map((hebrewVerse: string, index: number) => {
        const englishVerse = englishVerses[index] || '';
        
        return {
          verseNumber: index + 1,
          hebrewSegments: processHebrewVerse(hebrewVerse),
          englishSegments: processEnglishVerse(englishVerse)
        };
      });
      
      res.json({
        work: "Bible",
        book: bookInfo.slug,
        chapter,
        verses,
        sefariaRef,
        verseCount: verses.length
      });
    } catch (error) {
      console.error('Error in /api/bible/text:', error);
      res.status(500).json({ error: "Failed to fetch Bible text" });
    }
  });

  // Get list of all Bible books
  app.get("/api/bible/books", async (req, res) => {
    try {
      const { ALL_BIBLE_BOOKS, BIBLE_SECTIONS } = await import('@shared/bible-books');
      
      res.json({
        books: ALL_BIBLE_BOOKS,
        sections: BIBLE_SECTIONS
      });
    } catch (error) {
      console.error('Error in /api/bible/books:', error);
      res.status(500).json({ error: "Failed to fetch Bible books" });
    }
  });

  // Get chapters for a specific Bible book
  app.get("/api/bible/chapters", async (req, res) => {
    try {
      const { book } = z.object({ book: z.string() }).parse(req.query);
      const { getBookBySlug } = await import('@shared/bible-books');
      
      const bookInfo = getBookBySlug(book);
      if (!bookInfo) {
        res.status(404).json({ error: `Invalid book: ${book}` });
        return;
      }
      
      // Generate array of chapter numbers [1, 2, 3, ..., n]
      const chapters = Array.from({ length: bookInfo.chapters }, (_, i) => i + 1);
      
      res.json({ chapters });
    } catch (error) {
      console.error('Error in /api/bible/chapters:', error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  // SEO Routes - Nested sitemap structure
  app.get('/sitemap.xml', generateSitemapIndex);
  app.get('/sitemap-main.xml', generateMainSitemap);
  app.get('/sitemap-bible.xml', async (req, res) => {
    const { generateBibleSitemap } = await import('./routes/sitemap-bible');
    generateBibleSitemap(req, res);
  });
  app.get('/sitemap-seder-zeraim.xml', generateSederSitemap('zeraim'));
  app.get('/sitemap-seder-moed.xml', generateSederSitemap('moed'));
  app.get('/sitemap-seder-nashim.xml', generateSederSitemap('nashim'));
  app.get('/sitemap-seder-nezikin.xml', generateSederSitemap('nezikin'));
  app.get('/sitemap-seder-kodashim.xml', generateSederSitemap('kodashim'));
  app.get('/sitemap-seder-tohorot.xml', generateSederSitemap('tohorot'));

  // Dictionary API Routes
  // Search dictionary entries
  app.get("/api/dictionary/search", async (req, res) => {
    try {
      const { query } = searchRequestSchema.parse(req.query);
      const entries = await storage.searchEntries({ query });
      res.json(entries);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid search query" });
      } else {
        console.error("Dictionary search error:", error);
        res.status(500).json({ error: "Dictionary search failed" });
      }
    }
  });

  // Browse entries by Hebrew letter
  app.get("/api/dictionary/browse", async (req, res) => {
    try {
      const { letter } = browseRequestSchema.parse(req.query);
      const entries = await storage.browseByLetter({ letter });
      res.json(entries);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid letter parameter" });
      } else {
        console.error("Dictionary browse error:", error);
        res.status(500).json({ error: "Dictionary browse failed" });
      }
    }
  });

  // Autosuggest for search terms
  app.get("/api/dictionary/autosuggest", async (req, res) => {
    try {
      const { query } = autosuggestRequestSchema.parse(req.query);
      const suggestions = await storage.getAutosuggest({ query });
      res.json(suggestions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid autosuggest query" });
      } else {
        console.error("Dictionary autosuggest error:", error);
        res.status(500).json({ error: "Dictionary autosuggest failed" });
      }
    }
  });

  // AI Chat Routes
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const blogSearch = getBlogPostSearch();

  // Tool definitions for OpenAI function calling
  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "searchBlogPosts",
        description: "Search the Talmud & Tech blog archive for posts related to specific Talmud locations or topics. Returns blog post titles, URLs, and relevant excerpts.",
        parameters: {
          type: "object",
          properties: {
            tractate: {
              type: "string",
              description: "Talmud tractate name (e.g., 'Berakhot', 'Sanhedrin')"
            },
            location: {
              type: "string",
              description: "Talmud location or range (e.g., '7a', '7a.5-22', '7a-7b')"
            },
            keywords: {
              type: "array",
              items: { type: "string" },
              description: "Keywords to search in post titles and content"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 5)",
              default: 5
            }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "getBlogPostContent",
        description: "Retrieve the full content of a specific blog post by its ID. Use this after searchBlogPosts to get detailed content of relevant posts.",
        parameters: {
          type: "object",
          properties: {
            postId: {
              type: "string",
              description: "The blog post ID returned from searchBlogPosts"
            }
          },
          required: ["postId"]
        }
      }
    }
  ];

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, context } = req.body;
      const userMessages = messages.filter((m: any) => m.role === 'user');
      const userMessage = userMessages[userMessages.length - 1];

      // Build system message with context
      const systemMessage: OpenAI.Chat.ChatCompletionSystemMessageParam = {
        role: "system",
        content: `You are a knowledgeable Talmud study assistant. You have access to the Talmud & Tech blog archive which contains detailed analysis of Talmud passages.

${context ? `Current Talmud Text Context:
Tractate: ${context.tractate}
Page: ${context.page}
Section: ${context.section || 'all'}

The text below is from Sefaria's Steinsaltz Edition. In the English text:
- **Bolded text** represents Rabbi Adin Even-Israel Steinsaltz's direct translation of the Aramaic/Hebrew
- Regular (non-bolded) text is Steinsaltz's interpretation and explanation
Use this distinction to understand the text, but do NOT mention or explain this formatting distinction in your responses.

Hebrew Text:
${context.hebrewText || 'N/A'}

English Text (Steinsaltz Edition):
${context.englishText || 'N/A'}` : ''}

When answering questions:
1. Use the current Talmud text context when relevant
2. Search the blog archive for related commentary using the searchBlogPosts tool
3. Provide clear, educational responses using markdown formatting where helpful
4. Cite blog posts when referencing them
5. Be direct and specific - avoid vague statements, meta-commentary, or filler like "there may be", "further exploration might be needed", or "for a comprehensive study"`
      };

      const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        systemMessage,
        ...messages
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: allMessages,
        tools: tools,
        tool_choice: "auto"
      });

      const responseMessage = completion.choices[0].message;

      // Handle tool calls
      if (responseMessage.tool_calls) {
        const toolResults: any[] = [];

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;
          
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          let result: any;

          if (functionName === "searchBlogPosts") {
            const searchResults = blogSearch.search({
              tractate: args.tractate,
              location: args.location,
              keywords: args.keywords,
              limit: args.limit || 5
            });
            result = searchResults;
          } else if (functionName === "getBlogPostContent") {
            const post = blogSearch.getPostById(args.postId);
            result = post ? {
              id: post.id,
              title: post.title,
              contentText: post.contentText.slice(0, 3000), // Limit for token budget
              blogUrl: post.blogUrl
            } : null;
          }

          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            content: JSON.stringify(result)
          });
        }

        // Second API call with tool results
        const secondMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          ...allMessages,
          responseMessage,
          ...toolResults
        ];

        const finalCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: secondMessages
        });

        const finalMessage = finalCompletion.choices[0].message;
        
        // Send email alert with AI response (non-blocking)
        if (userMessage && context) {
          sendChatbotAlert({
            userQuestion: userMessage.content,
            aiResponse: String(finalMessage.content ?? ''),
            fullPrompt: systemMessage.content as string,
            talmudRange: context.range || `${context.tractate} ${context.page}`,
            tractate: context.tractate,
            page: context.page,
            timestamp: new Date()
          }).catch(err => console.error('Email alert failed:', err));
        }
        
        res.json({
          message: finalMessage,
          toolCalls: responseMessage.tool_calls
            .filter(tc => tc.type === 'function')
            .map((tc, i) => ({
              tool: tc.function.name,
              arguments: JSON.parse(tc.function.arguments),
              result: JSON.parse(toolResults[i].content)
            }))
        });
      } else {
        // Send email alert with AI response (non-blocking)
        if (userMessage && context) {
          sendChatbotAlert({
            userQuestion: userMessage.content,
            aiResponse: String(responseMessage.content ?? ''),
            fullPrompt: systemMessage.content as string,
            talmudRange: context.range || `${context.tractate} ${context.page}`,
            tractate: context.tractate,
            page: context.page,
            timestamp: new Date()
          }).catch(err => console.error('Email alert failed:', err));
        }
        
        res.json({
          message: responseMessage,
          toolCalls: []
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Chat request failed" });
    }
  });

  // RSS Feed proxy endpoint
  app.get("/api/rss-feed", async (req, res) => {
    try {
      const response = await fetch("https://www.ezrabrand.com/feed");
      const xmlText = await response.text();
      
      // Parse XML to extract items
      const items: Array<{title: string; link: string; pubDate: string; description: string}> = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];
        const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                      itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
        const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || 
                           itemXml.match(/<description>(.*?)<\/description>/)?.[1] || "";
        
        items.push({ title, link, pubDate, description });
      }
      
      // Return latest 5 posts
      res.json({ items: items.slice(0, 5) });
    } catch (error) {
      console.error("RSS feed fetch error:", error);
      res.status(500).json({ error: "Failed to fetch RSS feed" });
    }
  });

  // RSS Feed with full content endpoint
  app.get("/api/rss-feed-full", async (req, res) => {
    try {
      const response = await fetch("https://www.ezrabrand.com/feed");
      const xmlText = await response.text();
      
      // Parse XML to extract items with full content
      const items: Array<{
        title: string;
        link: string;
        pubDate: string;
        description: string;
        content: string;
        author: string;
      }> = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];
        const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                      itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
        const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || 
                           itemXml.match(/<description>(.*?)<\/description>/)?.[1] || "";
        
        // Extract full content from content:encoded tag (Substack uses this)
        const contentMatch = itemXml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
        const content = contentMatch?.[1] || description;
        
        // Extract author
        const authorMatch = itemXml.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/) ||
                           itemXml.match(/<dc:creator>(.*?)<\/dc:creator>/);
        const author = authorMatch?.[1] || "";
        
        items.push({ title, link, pubDate, description, content, author });
      }
      
      // Return latest 20 posts with full content
      res.json({ items: items.slice(0, 20) });
    } catch (error) {
      console.error("RSS feed full content fetch error:", error);
      res.status(500).json({ error: "Failed to fetch RSS feed" });
    }
  });

  // Daf Yomi endpoint - fetches today's daf from Sefaria calendars API
  app.get("/api/daf-yomi", async (req, res) => {
    try {
      const response = await fetch("https://www.sefaria.org/api/calendars");
      const data = await response.json();
      
      // Find Daf Yomi in the calendar items
      const dafYomi = data.calendar_items?.find(
        (item: any) => item.title?.en === "Daf Yomi"
      );
      
      if (dafYomi) {
        res.json({
          titleEn: dafYomi.displayValue?.en || "",
          titleHe: dafYomi.displayValue?.he || "",
          ref: dafYomi.ref || "",
          url: dafYomi.url || "",
          date: data.date || new Date().toISOString().split("T")[0]
        });
      } else {
        res.status(404).json({ error: "Daf Yomi not found in calendar" });
      }
    } catch (error) {
      console.error("Daf Yomi fetch error:", error);
      res.status(500).json({ error: "Failed to fetch Daf Yomi" });
    }
  });

  // Text Search endpoint - uses Sefaria ElasticSearch API
  app.get("/api/search/text", async (req, res) => {
    try {
      const { query, page, pageSize, type, exact } = textSearchRequestSchema.parse(req.query);
      
      // Request extra results to account for deduplication (Hebrew/English duplicates)
      const fetchSize = pageSize * 2;
      const from = (page - 1) * fetchSize;
      
      // Build path filters based on type selection
      const pathFilters: any[] = [];
      if (type === "all" || type === "talmud") {
        pathFilters.push({ prefix: { "path": "Talmud/Bavli/Seder " } });
      }
      if (type === "all" || type === "bible") {
        pathFilters.push({ prefix: { "path": "Tanakh/Torah" } });
        pathFilters.push({ prefix: { "path": "Tanakh/Prophets" } });
        pathFilters.push({ prefix: { "path": "Tanakh/Writings" } });
      }
      
      // Build ElasticSearch query for Sefaria - filter to only Talmud and Tanakh
      // Also filter to only English and Hebrew (exclude German, Spanish, etc.)
      const esQuery = {
        size: fetchSize,
        from: from,
        query: {
          bool: {
            must: {
              match_phrase: {
                exact: {
                  query: query,
                  slop: exact ? 0 : 3
                }
              }
            },
            filter: [
              {
                bool: {
                  should: pathFilters,
                  minimum_should_match: 1
                }
              },
              {
                bool: {
                  should: [
                    { term: { lang: "en" } },
                    { term: { lang: "he" } }
                  ],
                  minimum_should_match: 1
                }
              }
            ],
            should: [
              // Whitelist: Only show these specific English versions
              { match_phrase: { version: "William Davidson Edition - English" } },
              { match_phrase: { version: "Tanakh: The Holy Scriptures, published by JPS" } },
              // Also include Hebrew text
              { term: { lang: "he" } }
            ],
            minimum_should_match: 1
          }
        },
        highlight: {
          pre_tags: ["<mark>"],
          post_tags: ["</mark>"],
          fields: {
            exact: {
              fragment_size: 200
            }
          }
        },
        sort: [
          { comp_date: {} },
          { order: {} }
        ]
      };

      console.log(`Searching Sefaria for: "${query}" (type: ${type}, exact: ${exact}, page ${page}, size ${pageSize})`);
      
      const response = await fetch("https://www.sefaria.org/api/search/text/_search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(esQuery)
      });

      if (!response.ok) {
        console.error(`Sefaria search error: ${response.status} ${response.statusText}`);
        res.status(response.status).json({ error: "Search request failed" });
        return;
      }

      const data = await response.json();
      
      // Parse results
      // Handle both ES7+ format ({value: N, relation: "eq"}) and older format (just N)
      const hitsTotal = data.hits?.total;
      const total = typeof hitsTotal === 'object' ? (hitsTotal?.value ?? 0) : (hitsTotal ?? 0);
      const hits = data.hits?.hits || [];
      
      const allResults: SearchResult[] = hits.map((hit: any) => {
        const source = hit._source || {};
        const ref = source.ref || "";
        const path = source.path || "";
        
        // Determine type based on path
        let type: "talmud" | "bible" | "other" = "other";
        if (path.includes("Talmud") || path.includes("Bavli")) {
          type = "talmud";
        } else if (path.includes("Torah") || path.includes("Prophets") || path.includes("Writings") || 
                   path.includes("Genesis") || path.includes("Exodus") || path.includes("Leviticus") ||
                   path.includes("Numbers") || path.includes("Deuteronomy") || path.includes("Tanakh")) {
          type = "bible";
        }
        
        // Get highlighted text or fall back to exact text
        const highlight = hit.highlight?.exact?.[0] || "";
        const text = source.exact || "";
        
        return {
          ref,
          hebrewRef: source.heRef || undefined,
          text: text.substring(0, 300),
          highlight: highlight || undefined,
          path: path || undefined,
          type
        };
      });

      // Deduplicate results by ref (Hebrew and English versions can appear separately)
      const seenRefs = new Set<string>();
      const deduped = allResults.filter(result => {
        if (seenRefs.has(result.ref)) {
          return false;
        }
        seenRefs.add(result.ref);
        return true;
      });
      
      // Trim to requested pageSize after deduplication
      const results: SearchResult[] = deduped.slice(0, pageSize);
      
      // Estimate unique total (roughly half due to Hebrew/English duplicates)
      const estimatedUniqueTotal = Math.ceil(total / 2);
      const totalPages = Math.ceil(estimatedUniqueTotal / pageSize);

      const searchResponse: TextSearchResponse = {
        results,
        total: estimatedUniqueTotal,
        page,
        pageSize,
        totalPages,
        query
      };

      res.json(searchResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid search parameters", details: error.errors });
      } else {
        console.error("Search error:", error);
        res.status(500).json({ error: "Search failed" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
