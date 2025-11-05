// app/sitemap.xml/route.ts
import { NextRequest } from 'next/server';

const BASE_URL = 'https://crashify.com.au';

const pages = [
    { path: '/', lastmod: '2025-11-04' },
    { path: '/services', lastmod: '2025-10-15' },
    { path: '/about', lastmod: '2025-10-01' },
    { path: '/blog', lastmod: '2025-11-02' },
    { path: '/contact', lastmod: '2025-10-20' },
    { path: '/careers', lastmod: '2025-10-25' },
    { path: '/privacy-policy', lastmod: '2025-10-31' },
    { path: '/terms-of-service', lastmod: '2025-10-31' },
    { path: '/cookie-policy', lastmod: '2025-10-31' },
];

function generateSiteMap() {
    return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages
        .map(
            (page) => `
      <url>
        <loc>${BASE_URL}${page.path}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${page.path === '/' ? '1.0' : '0.7'}</priority>
      </url>`
        )
        .join('')}
  </urlset>`;
}

export async function GET(req: NextRequest) {
    const xml = generateSiteMap();
    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control':
                'public, s-maxage=86400, stale-while-revalidate=604800',
        },
    });
}
