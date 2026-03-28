import { Request, Response } from 'express';
import { TRACTATE_LISTS, getTractateSlug } from '../../shared/tractates';

export function generateMainSitemap(req: Request, res: Response) {
  // Use production URL for deployed site
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://chavrutai.com' 
    : req.protocol + '://' + req.get('host');
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main navigation pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/talmud</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/suggested-pages</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/blog-posts</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/biblical-index</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/dictionary</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/term-index</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/outline/sanhedrin/10</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/mishnah</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/yerushalmi</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/mishnah-map</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/sugya-viewer</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/sitemap</loc>
    <priority>0.6</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/external-links</loc>
    <priority>0.6</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <priority>0.5</priority>
    <changefreq>yearly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <priority>0.4</priority>
    <changefreq>yearly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/changelog</loc>
    <priority>0.5</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>

  <!-- Tractate contents pages -->`;

  // Add all tractate contents pages
  TRACTATE_LISTS["Talmud Bavli"].forEach((tractate: string) => {
    const tractateSlug = getTractateSlug(tractate);
    sitemap += `
  <url>
    <loc>${baseUrl}/talmud/${tractateSlug}</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`;
  });

  // Add biblical index book pages
  const biblicalBooks = [
    'Genesis', 'Exodus', 'Leviticus_part1', 'Leviticus_part2', 'Numbers', 'Deuteronomy_part1', 'Deuteronomy_part2',
    'Joshua', 'Judges', '1_Samuel', '2_Samuel', '1_Kings', '2_Kings', 'Isaiah', 'Jeremiah', 'Ezekiel', 
    'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Psalms', 'Proverbs', 'Job', 'Ruth', 'Lamentations', 'Ecclesiastes', 'Esther', 'Daniel', 'Ezra', 'Nehemiah', '1_Chronicles', '2_Chronicles'
  ];
  
  biblicalBooks.forEach((book: string) => {
    const bookSlug = book.toLowerCase();
    sitemap += `
  <url>
    <loc>${baseUrl}/biblical-index/book/${bookSlug}</loc>
    <priority>0.6</priority>
    <changefreq>monthly</changefreq>
  </url>`;
  });

  sitemap += `
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
}