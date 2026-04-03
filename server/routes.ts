import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { getTractateSlug } from "@shared/tractates";
import { generateSitemapIndex } from "./routes/sitemap-index";
import { generateMainSitemap } from "./routes/sitemap-main";
import { generateSederSitemap } from "./routes/sitemap-seder";
import { generateMishnahSitemap } from "./routes/sitemap-mishnah";
import { generateYerushalmiSitemap } from "./routes/sitemap-yerushalmi";
import { generateRambamSitemap } from "./routes/sitemap-rambam";
import { servePageWithMeta, shouldNoIndex } from "./routes/seo";
import { createTalmudRouter } from "./routes/talmud";
import { createMishnahRouter } from "./routes/mishnah";
import { createYerushalmiRouter } from "./routes/yerushalmi";
import { createRambamRouter } from "./routes/rambam";
import { createBibleRouter } from "./routes/bible";
import { createDictionaryRouter } from "./routes/dictionary";
import { createChatRouter } from "./routes/chat";
import { createSearchRouter } from "./routes/search";
import { createFeedRouter } from "./routes/feed";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.use((req, res, next) => {
    const url = req.path;
    let canonicalUrl = url;
    let needsRedirect = false;
    
    if (url.length > 1 && url.endsWith('/')) {
      canonicalUrl = canonicalUrl.slice(0, -1);
      needsRedirect = true;
    }
    
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
    
    const oldTractateMatch = canonicalUrl.match(/^\/tractate\/([^/]+)\/(\d+)([ab])$/i);
    if (oldTractateMatch) {
      const [, tractate, folio, side] = oldTractateMatch;
      const normalizedTractate = getTractateSlug(tractate);
      const normalizedFolio = folio + side.toLowerCase();
      canonicalUrl = `/talmud/${normalizedTractate}/${normalizedFolio}`;
      needsRedirect = true;
    }
    
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
    
    if (needsRedirect) {
      const fullCanonicalUrl = canonicalUrl + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
      return res.redirect(301, fullCanonicalUrl);
    }
    
    next();
  });
  
  app.use('*', (req, res, next) => {
    if (shouldNoIndex(req.originalUrl)) {
      res.setHeader('X-SEO-NoIndex', 'true');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });
  
  app.get('/', servePageWithMeta);
  app.get('/about', servePageWithMeta);
  app.get('/talmud', servePageWithMeta);
  app.get('/suggested-pages', servePageWithMeta);
  app.get('/privacy', servePageWithMeta);
  app.get('/search', servePageWithMeta);
  app.get('/sitemap', servePageWithMeta);
  app.get('/contact', servePageWithMeta);
  app.get('/changelog', servePageWithMeta);
  app.get('/dictionary', servePageWithMeta);
  app.get('/term-index', servePageWithMeta);
  app.get('/blog-posts', servePageWithMeta);
  app.get('/biblical-index', servePageWithMeta);
  app.get('/bible', servePageWithMeta);
  app.get('/bible/:book', servePageWithMeta);
  app.get('/bible/:book/:chapter', servePageWithMeta);
  app.get('/sugya-viewer', servePageWithMeta);
  app.get('/mishnah-map', servePageWithMeta);
  app.get('/mishnah', servePageWithMeta);
  app.get('/mishnah/:tractate', servePageWithMeta);
  app.get('/mishnah/:tractate/:chapter', servePageWithMeta);
  app.get('/yerushalmi', servePageWithMeta);
  app.get('/yerushalmi/:tractate', servePageWithMeta);
  app.get('/yerushalmi/:tractate/:chapter', servePageWithMeta);
  app.get('/rambam', servePageWithMeta);
  app.get('/rambam/:hilchot', servePageWithMeta);
  app.get('/rambam/:hilchot/:chapter', servePageWithMeta);
  app.get('/talmud/:tractate', servePageWithMeta);
  app.get('/talmud/:tractate/:folio', servePageWithMeta);

  app.use(createTalmudRouter());
  app.use(createMishnahRouter());
  app.use(createYerushalmiRouter());
  app.use(createRambamRouter());
  app.use(createBibleRouter());
  app.use(createDictionaryRouter());
  app.use(createChatRouter());
  app.use(createSearchRouter());
  app.use(createFeedRouter());

  app.get("/api/sitemap", async (req, res) => {
    try {
      const { SEDER_TRACTATES } = await import('@shared/tractates');

      const sederInfo = {
        zeraim: { name: 'Zeraim', description: 'Order of Seeds - Agricultural laws and blessings' },
        moed: { name: 'Moed', description: 'Order of Appointed Times - Sabbath and festivals' },
        nashim: { name: 'Nashim', description: 'Order of Women - Marriage and divorce laws' },
        nezikin: { name: 'Nezikin', description: 'Order of Damages - Civil and criminal law' },
        kodashim: { name: 'Kodashim', description: 'Order of Holy Things - Temple service and ritual slaughter' },
        tohorot: { name: 'Tohorot', description: 'Order of Purities - Ritual purity laws' }
      };

      const getPageCount = (t: { folios: number; lastSide: 'a' | 'b'; startFolio?: number; startSide?: 'a' | 'b' }) => {
        const startFolio = (t as any).startFolio ?? 2;
        const startSide = (t as any).startSide ?? 'a';
        const startOffset = startSide === 'b' ? 1 : 0;
        const endOffset = t.lastSide === 'a' ? 1 : 0;
        return (t.folios - startFolio) * 2 + 2 - startOffset - endOffset;
      };

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
            slug: getTractateSlug(t.name),
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
  app.get('/sitemap-mishnah.xml', generateMishnahSitemap);
  app.get('/sitemap-yerushalmi.xml', generateYerushalmiSitemap);
  app.get('/sitemap-rambam.xml', generateRambamSitemap);

  app.get("/api/glossary", (_req, res) => {
    const filePath = path.join(process.cwd(), "shared/data/glossary_v4.json");
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}
