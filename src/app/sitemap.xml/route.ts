// app/sitemap.xml/route.ts

const BASE_URL = 'https://crashify.com.au';

// Static core pages
const staticPages = [
    { path: '/', priority: 1.0, lastmod: '2025-11-04' },
    { path: '/services', priority: 0.8, lastmod: '2025-10-15' },
    { path: '/about', priority: 0.7, lastmod: '2025-10-01' },
    { path: '/blog', priority: 0.7, lastmod: '2025-11-02' },
    { path: '/contact', priority: 0.6, lastmod: '2025-10-20' },
    { path: '/careers', priority: 0.5, lastmod: '2025-10-25' },
    { path: '/privacy-policy', priority: 0.4, lastmod: '2025-10-31' },
    { path: '/terms-of-service', priority: 0.4, lastmod: '2025-10-31' },
    { path: '/cookie-policy', priority: 0.4, lastmod: '2025-10-31' },
];

async function fetchPosts() {
    // Best: replace this with your actual posts API or CMS endpoint
    // Example: return await fetch("https://crashify.com.au/api/posts").then(r=>r.json());
    // For now, placeholder posts:
    return [
        { slug: 'how-crashify-works', lastmod: '2025-10-28' },
        { slug: 'vehicle-inspection-checklist', lastmod: '2025-09-15' },
    ];
}

function buildUrl({
    path,
    lastmod,
    priority,
}: {
    path: string;
    lastmod?: string;
    priority?: number;
}) {
    return `<url>
    <loc>${BASE_URL}${path}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>${(priority ?? 0.7).toFixed(2)}</priority>
  </url>`;
}

export async function GET() {
    const posts = await fetchPosts();
    const postUrls = posts
        .map((p) =>
            buildUrl({
                path: `/blog/${p.slug}`,
                lastmod: p.lastmod,
                priority: 0.6,
            })
        )
        .join('\n');

    const staticUrls = staticPages.map((p) => buildUrl(p)).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticUrls}
    ${postUrls}
  </urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            // cache for 1 day, allow stale while revalidate for one week
            'Cache-Control':
                'public, s-maxage=86400, stale-while-revalidate=604800',
        },
    });
}
