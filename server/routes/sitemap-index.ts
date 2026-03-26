import { Request, Response } from 'express';

export function generateSitemapIndex(req: Request, res: Response) {
  // Use production URL for deployed site
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://chavrutai.com' 
    : req.protocol + '://' + req.get('host');
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main navigation and site pages -->
  <sitemap>
    <loc>${baseUrl}/sitemap-main.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  
  <!-- Bible - 39 books, ~929 chapters -->
  <sitemap>
    <loc>${baseUrl}/sitemap-bible.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  
  <!-- Seder Zeraim (Order of Seeds) - 1 tractate, ~128 pages -->
  <sitemap>
    <loc>${baseUrl}/sitemap-seder-zeraim.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  
  <!-- Seder Moed (Order of Appointed Times) - 11 tractates, ~1,654 pages -->
  <sitemap>
    <loc>${baseUrl}/sitemap-seder-moed.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  
  <!-- Seder Nashim (Order of Women) - 7 tractates, ~1,442 pages -->
  <sitemap>
    <loc>${baseUrl}/sitemap-seder-nashim.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  
  <!-- Seder Nezikin (Order of Damages) - 8 tractates, ~1,134 pages -->
  <sitemap>
    <loc>${baseUrl}/sitemap-seder-nezikin.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  
  <!-- Seder Kodashim (Order of Holy Things) - 11 tractates, ~1,114 pages -->
  <sitemap>
    <loc>${baseUrl}/sitemap-seder-kodashim.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  
  <!-- Seder Tohorot (Order of Purities) - 1 tractate, ~146 pages -->
  <sitemap>
    <loc>${baseUrl}/sitemap-seder-tohorot.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  
  <!-- Mishnah - 26 tractates not in Talmud Bavli -->
  <sitemap>
    <loc>${baseUrl}/sitemap-mishnah.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemapIndex);
}