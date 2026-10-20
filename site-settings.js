/* Applies admin-controlled logo/favicon and the announcement banner on every page. Falls back to defaults. */
(function () {
  var URL_ = 'https://wfmtoodutuaeousykora.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbXRvb2R1dHVhZW91c3lrb3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjUwODcsImV4cCI6MjA5NTkwMTA4N30.TCav8aVw4i5KSOKcey-zRrReLPWYosIgclzMyDB5V8w';
  var CK = 'frazx_site_settings';
  function apply(s) {
    if (!s) return;
    banner(s);
    try {
      if (s.logo_url) document.querySelectorAll('img[alt="FRAZX Logo"]').forEach(function (i) { i.src = s.logo_url; });
      if (s.favicon_url) {
        document.querySelectorAll('link[rel="icon"]').forEach(function (l) { l.remove(); });
        var l = document.createElement('link'); l.rel = 'icon'; l.href = s.favicon_url; document.head.appendChild(l);
        var a = document.querySelector('link[rel="apple-touch-icon"]'); if (a) a.href = s.favicon_url;
      }
    } catch (e) {}
  }
  function banner(s) {
    try {
      var old = document.getElementById('fx-banner');
      var on = s && s.banner_on === '1' && s.banner_text && s.banner_text.trim();
      var dismissed = null;
      try { dismissed = localStorage.getItem('frazx_banner_dismissed'); } catch (e) {}
      var nav = document.getElementById('main-navbar');
      if (!on || dismissed === s.banner_id) {
        if (old) old.remove();
        document.body.style.paddingTop = '';
        if (nav) nav.style.top = '';
        return;
      }
      var el = old || document.createElement('div');
      el.id = 'fx-banner';
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', 'Announcement');
      el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:101;display:flex;align-items:center;justify-content:center;gap:12px;padding:8px 44px 8px 14px;background:linear-gradient(90deg,#0272ad,#0a7f9b);color:#fff;font:600 13px/1.35 "Space Grotesk",system-ui,sans-serif;text-align:center';
      el.textContent = '';
      var t = document.createElement('span'); t.textContent = s.banner_text.trim(); el.appendChild(t);
      var link = (s.banner_link || '').trim();
      if (/^(https?:\/\/|\/)/i.test(link)) {
        var a = document.createElement('a'); a.href = link; a.textContent = 'Learn more';
        a.style.cssText = 'color:#fff;text-decoration:underline;font-weight:700;white-space:nowrap';
        el.appendChild(a);
      }
      var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Dismiss announcement'); x.textContent = '\u00d7';
      x.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:4px 10px';
      x.onclick = function () {
        try { localStorage.setItem('frazx_banner_dismissed', s.banner_id || ''); } catch (e) {}
        el.remove(); document.body.style.paddingTop = ''; if (nav) nav.style.top = '';
      };
      el.appendChild(x);
      if (!old) document.body.insertBefore(el, document.body.firstChild);
      var h = el.offsetHeight;
      document.body.style.paddingTop = h + 'px';
      if (nav) nav.style.top = h + 'px';
    } catch (e) {}
  }
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CK) || 'null'); } catch (e) {}
  function run() { apply(cached); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  fetch(URL_ + '/rest/v1/site_settings?select=key,value', { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      var s = {}; rows.forEach(function (r) { s[r.key] = r.value; });
      try { localStorage.setItem(CK, JSON.stringify(s)); } catch (e) {}
      if (document.readyState !== 'loading') apply(s); else document.addEventListener('DOMContentLoaded', function () { apply(s); });
    }).catch(function () {});
})();
