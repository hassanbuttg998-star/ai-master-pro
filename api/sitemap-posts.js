// /api/sitemap-posts.js - lists every post page for Google (served at /sitemap-posts.xml)
const SB_URL = 'https://wfmtoodutuaeousykora.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbXRvb2R1dHVhZW91c3lrb3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjUwODcsImV4cCI6MjA5NTkwMTA4N30.TCav8aVw4i5KSOKcey-zRrReLPWYosIgclzMyDB5V8w'  // public anon key (same one the website already uses);
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

module.exports = async function handler(req, res) {
    let rows = [];
    try {
        const r = await fetch(`${SB_URL}/rest/v1/posts?select=id,image_url,title,created_at&order=created_at.desc&limit=5000`, {
            headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
        });
        if (r.ok) rows = await r.json();
    } catch (e) { /* empty sitemap */ }
    const urls = rows.map(p => `  <url><loc>https://frazxpro.com/post/${esc(p.id)}</loc>${p.created_at ? `<lastmod>${esc(String(p.created_at).slice(0, 10))}</lastmod>` : ''}${p.image_url ? `<image:image><image:loc>${esc(p.image_url)}</image:loc>${p.title ? `<image:title>${esc(p.title)}</image:title>` : ''}</image:image>` : ''}</url>`).join('\n');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.statusCode = 200;
    res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`);
};
