/* Applies admin-controlled logo/favicon on every page. Falls back to default files. */
(function () {
  var URL_ = 'https://wfmtoodutuaeousykora.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbXRvb2R1dHVhZW91c3lrb3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjUwODcsImV4cCI6MjA5NTkwMTA4N30.TCav8aVw4i5KSOKcey-zRrReLPWYosIgclzMyDB5V8w';
  var CK = 'frazx_site_settings';
  function apply(s) {
    if (!s) return;
    try {
      if (s.logo_url) document.querySelectorAll('img[alt="FRAZX Logo"]').forEach(function (i) { i.src = s.logo_url; });
      if (s.favicon_url) {
        document.querySelectorAll('link[rel="icon"]').forEach(function (l) { l.remove(); });
        var l = document.createElement('link'); l.rel = 'icon'; l.href = s.favicon_url; document.head.appendChild(l);
        var a = document.querySelector('link[rel="apple-touch-icon"]'); if (a) a.href = s.favicon_url;
      }
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
