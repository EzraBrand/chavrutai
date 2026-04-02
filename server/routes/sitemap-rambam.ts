import { Request, Response } from 'express';
import { RAMBAM_BOOKS } from '@shared/rambam-data';

export function generateRambamSitemap(req: Request, res: Response) {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://chavrutai.com'
    : req.protocol + '://' + req.get('host');

  const currentDate = new Date().toISOString().split('T')[0];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Mishneh Torah Main Page -->
  <url>
    <loc>${baseUrl}/rambam</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

  let totalHilchot = 0;
  let totalChapters = 0;

  for (const book of RAMBAM_BOOKS) {
    sitemap += `

  <!-- ${book.name} - ${book.hilchot.length} Hilchot -->`;

    for (const hilchot of book.hilchot) {
      totalHilchot++;
      sitemap += `
  <url>
    <loc>${baseUrl}/rambam/${hilchot.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

      for (let chapter = 1; chapter <= hilchot.chapters; chapter++) {
        totalChapters++;
        sitemap += `
  <url>
    <loc>${baseUrl}/rambam/${hilchot.slug}/${chapter}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`;
      }
    }
  }

  sitemap += `

  <!-- Mishneh Torah: ${totalHilchot} Hilchot, ${totalChapters} chapter pages -->
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
}
