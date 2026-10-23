import { writeFileSync } from 'node:fs';

const baseUrl = process.env.VITE_SITE_URL || 'https://campusplus.in';
const today = new Date().toISOString().split('T')[0];

const routes = [
  '/',
  '/explore',
  '/submit',
  '/terms',
  '/privacy',
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route === '/' ? '' : route}</loc>
    <lastmod>${today}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync('apps/web/public/sitemap.xml', xml, 'utf8');
console.log('sitemap.xml generated successfully.');
