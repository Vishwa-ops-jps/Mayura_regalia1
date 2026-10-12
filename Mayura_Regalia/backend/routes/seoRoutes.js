// /sitemap.xml and /robots.txt, built from the live database so new products and categories
// are included automatically. Set FRONTEND_URL in backend/.env to your real domain
// (for example https://www.mayuraregalia.com) before submitting the sitemap to Google.
const express = require('express');
const { getPool } = require('../config/db');

const router = express.Router();
const siteUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

const STATIC_PAGES = [
  ['/', '1.0'], ['/shop', '0.9'], ['/contact', '0.5'], ['/track-order', '0.3'],
  ['/shipping-policy', '0.3'], ['/returns-policy', '0.3'], ['/privacy-policy', '0.2'], ['/terms-and-conditions', '0.2'],
];

router.get('/sitemap.xml', async (req, res) => {
  try {
    const pool = getPool();
    const base = siteUrl();
    const urls = STATIC_PAGES.map(([loc, priority]) => ({ loc: base + loc, priority }));

    const [categories] = await pool.query("SELECT name FROM categories WHERE status = 'active'");
    categories.forEach((c) => urls.push({ loc: `${base}/shop?category=${encodeURIComponent(c.name)}`, priority: '0.8' }));

    const [products] = await pool.query('SELECT id, updated_at AS updatedAt FROM products');
    products.forEach((p) => urls.push({
      loc: `${base}/product/${p.id}`,
      lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 10) : null,
      priority: '0.7',
    }));

    const body = urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
  } catch (error) {
    console.error('Sitemap error:', error.message);
    res.status(500).type('text/plain').send('Sitemap unavailable');
  }
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nDisallow: /account\nDisallow: /cart\n\nSitemap: ${siteUrl()}/sitemap.xml\n`
  );
});

module.exports = router;
