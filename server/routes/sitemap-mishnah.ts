import { Request, Response } from 'express';
import { MISHNAH_ONLY_TRACTATES, getMishnahTractateSlug } from '@shared/tractates';

export function generateMishnahSitemap(req: Request, res: Response) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://chavrutai.com' 
    : req.protocol + '://' + req.get('host');
  
  const currentDate = new Date().toISOString().split('T')[0];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Mishnah Main Page -->
  <url>
    <loc>${baseUrl}/mishnah</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Mishnah-Talmud Mapping -->
  <url>
    <loc>${baseUrl}/mishnah-map</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

  const sederNames: Record<string, string> = {
    zeraim: 'Seder Zeraim (Seeds)',
    moed: 'Seder Moed (Festivals)',
    nezikin: 'Seder Nezikin (Damages)',
    kodashim: 'Seder Kodashim (Holy Things)',
    tohorot: 'Seder Tohorot (Purities)',
  };

  let totalChapters = 0;
  let totalTractates = 0;

  for (const [seder, tractates] of Object.entries(MISHNAH_ONLY_TRACTATES)) {
    sitemap += `

  <!-- ${sederNames[seder] || seder} - ${tractates.length} tractates -->`;

    for (const tractate of tractates) {
      const slug = getMishnahTractateSlug(tractate.name);
      totalTractates++;

      sitemap += `
  <url>
    <loc>${baseUrl}/mishnah/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

      for (let chapter = 1; chapter <= tractate.chapters; chapter++) {
        totalChapters++;
        sitemap += `
  <url>
    <loc>${baseUrl}/mishnah/${slug}/${chapter}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`;
      }
    }
  }

  sitemap += `

  <!-- Mishnah: ${totalTractates} tractates, ${totalChapters} chapter pages -->
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
}
