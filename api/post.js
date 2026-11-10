// /api/post.js
// Serves a real, shareable page for one post at /post/<id> (see vercel.json rewrite).
// It returns the normal gallery page with the post's own title / description / image
// in the <head>, so Google, WhatsApp and Instagram previews show the right thing.
// The page itself then opens the post exactly like before (client-side).

const SB_URL = 'https://wfmtoodutuaeousykora.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbXRvb2R1dHVhZW91c3lrb3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjUwODcsImV4cCI6MjA5NTkwMTA4N30.TCav8aVw4i5KSOKcey-zRrReLPWYosIgclzMyDB5V8w'  // public anon key (same one the website already uses);
const SITE = 'https://frazxpro.com';

const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function ogImage(url) {
    if (!url) return SITE + '/og-image.jpg';
    if (/res\.cloudinary\.com\/.+\/image\/upload\//.test(url) && !/\/upload\/[^/]*(w_|c_|f_)/.test(url)) {
        return url.replace('/upload/', '/upload/f_jpg,q_auto,w_1200,h_630,c_fill,g_auto/');
    }
    return url;
}

module.exports = async function handler(req, res) {
    const id = String((req.query && req.query.id) || '');
    const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let post = null;
    if (validId) {
        try {
            const r = await fetch(`${SB_URL}/rest/v1/posts?id=eq.${id}&select=id,title,prompt,image_url,creator_name,category,created_at&limit=1`, {
                headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
            });
            if (r.ok) { const rows = await r.json(); post = rows && rows[0] ? rows[0] : null; }
        } catch (e) { /* fall through to generic page */ }
    }

    // the normal page (same file the gallery uses)
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'frazxpro.com';
    let html;
    try {
        const t = await fetch(`${proto}://${host}/ai-images`);
        if (!t.ok) throw new Error('template ' + t.status);
        html = await t.text();
    } catch (e) {
        res.statusCode = 302; res.setHeader('Location', '/ai-images#post/' + encodeURIComponent(id)); return res.end();
    }

    if (!post) {
        html = html.replace('</head>', '<meta name="robots" content="noindex">\n</head>');
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=60');
        return res.end(html);
    }

    const title = (post.title || (post.prompt || 'AI Creation').slice(0, 60)).trim();
    const pageTitle = `${title} - AI Prompt | FRAZX PRO`;
    const desc = (post.prompt || 'AI-generated image with a ready-to-copy prompt.').replace(/\s+/g, ' ').trim().slice(0, 155);
    const url = `${SITE}/post/${post.id}`;
    const img = ogImage(post.image_url);

    const setMeta = (re, val) => { html = html.replace(re, (m, a, b) => a + esc(val) + b); };
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(pageTitle)}</title>`);
    setMeta(/(<meta name="description" content=")[^"]*(")/, desc);
    setMeta(/(<link rel="canonical" href=")[^"]*(")/, url);
    setMeta(/(<meta property="og:title" content=")[^"]*(")/, pageTitle);
    setMeta(/(<meta property="og:description" content=")[^"]*(")/, desc);
    setMeta(/(<meta property="og:url" content=")[^"]*(")/, url);
    setMeta(/(<meta property="og:image" content=")[^"]*(")/, img);
    setMeta(/(<meta name="twitter:title" content=")[^"]*(")/, pageTitle);
    setMeta(/(<meta name="twitter:description" content=")[^"]*(")/, desc);
    setMeta(/(<meta name="twitter:image" content=")[^"]*(")/, img);

    const ld = {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        name: title,
        description: desc,
        contentUrl: post.image_url,
        url,
        uploadDate: post.created_at,
        creator: { '@type': 'Person', name: post.creator_name || 'FRAZX PRO creator' }
    };
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n</head>`);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.end(html);
};
