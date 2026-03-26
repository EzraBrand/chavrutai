import { Request, Response } from 'express';
import { YERUSHALMI_TRACTATES, getYerushalmiTractateSlug } from '@shared/yerushalmi-data';

export function generateYerushalmiSitemap(req: Request, res: Response) {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://chavrutai.com'
    : req.protocol + '://' + req.get('host');

  const currentDate = new Date().toISOString().split('T')[0];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Jerusalem Talmud Main Page -->
  <url>
    <loc>${baseUrl}/yerushalmi</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

  const sederNames: Record<string, string> = {
    zeraim: 'Seder Zeraim',
    moed: 'Seder Moed',
    nashim: 'Seder Nashim',
    nezikin: 'Seder Nezikin',
  };

  let totalChapters = 0;
  let totalTractates = 0;

  for (const [seder, tractates] of Object.entries(YERUSHALMI_TRACTATES)) {
    sitemap += `

  <!-- ${sederNames[seder] || seder} - ${tractates.length} tractates -->`;

    for (const tractate of tractates) {
      const slug = getYerushalmiTractateSlug(tractate.name);
      totalTractates++;

      sitemap += `
  <url>
    <loc>${baseUrl}/yerushalmi/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

      for (let chapter = 1; chapter <= tractate.chapters; chapter++) {
        totalChapters++;
        sitemap += `
  <url>
    <loc>${baseUrl}/yerushalmi/${slug}/${chapter}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`;
      }
    }
  }

  sitemap += `

  <!-- Jerusalem Talmud: ${totalTractates} tractates, ${totalChapters} chapter pages -->
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
}
