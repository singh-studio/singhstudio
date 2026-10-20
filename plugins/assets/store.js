/* Singh Studio Plugins: storefront behaviour. Buy buttons, analytics, the NZ clock, demo controls, reveals. */
(function () {
  'use strict';
  var cfgEl = document.getElementById('store-config');
  var CFG = cfgEl ? JSON.parse(cfgEl.textContent) : { checkout: {}, email: 'kris@singhstudio.co.nz', analytics: {} };
  document.documentElement.classList.remove('no-js');

  /* Analytics: GA4 loads only when an ID is set in catalog.json */
  function track(name, props) { if (window.gtag) window.gtag('event', name, props || {}); }
  if (CFG.analytics && CFG.analytics.ga4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CFG.analytics.ga4, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.analytics.ga4);
    document.head.appendChild(s);
  }
  var page = document.body.getAttribute('data-product');
  if (page) track('view_item', { item_id: page, item_name: document.body.getAttribute('data-product-name') });

  /* Buy buttons: a Lemon Squeezy (or any) checkout link when set, otherwise an email to Kris */
  var usesLemon = false;
  document.querySelectorAll('[data-buy]').forEach(function (a) {
    var parts = a.getAttribute('data-buy').split(':'), slug = parts[0], tier = parts[1] || 'single';
    var url = CFG.checkout[slug] && CFG.checkout[slug][tier];
    var name = a.getAttribute('data-name') || slug;
    if (url) {
      a.href = url;
      if (/lemonsqueezy\.com/.test(url)) { a.classList.add('lemonsqueezy-button'); usesLemon = true; }
    } else {
      a.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(name + ', ' + (tier === 'unlimited' ? 'unlimited' : 'single-site') + ' licence') +
        '&body=' + encodeURIComponent('Hi Kris,\n\nI’d like to buy ' + name + ' (' + (tier === 'unlimited' ? 'unlimited sites' : 'one site') + ').\n\nMy website: \n\nThanks!');
    }
    a.addEventListener('click', function () {
      track('begin_checkout', { item_id: slug, item_variant: tier, currency: 'USD', value: +a.getAttribute('data-price') || undefined });
    });
  });
  if (usesLemon) {
    var ls = document.createElement('script');
    ls.src = 'https://app.lemonsqueezy.com/js/lemon.js'; ls.defer = true;
    document.head.appendChild(ls);
  }
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () { track(el.getAttribute('data-track'), { label: el.getAttribute('data-track-label') || '' }); });
  });

  /* NZ clock, as on the studio site */
  var clock = document.querySelector('.clock');
  if (clock && window.Intl) {
    var f = new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    var tick = function () { clock.textContent = 'NZ  ' + f.format(new Date()); };
    tick(); setInterval(tick, 1000);
  }

  /* Demo controls drive the embedded demo */
  var frame = document.getElementById('demo-frame');
  function demo(fn) {
    if (!frame) return;
    var target = document.getElementById('demo');
    if (target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (frame.getAttribute('loading') === 'lazy') frame.removeAttribute('loading');
    var w = frame.contentWindow;
    if (w && w.document && w.document.querySelector('[data-ssk-state="ready"], .sshelf[data-state="ready"]')) fn(w);
    else frame.addEventListener('load', function once() { frame.removeEventListener('load', once); setTimeout(function () { fn(frame.contentWindow); }, 400); });
  }
  document.querySelectorAll('[data-demo-theme]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-demo-theme]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      demo(function (w) { if (w.setDemoTheme) w.setDemoTheme(b.getAttribute('data-demo-theme')); });
      track('demo_theme', { theme: b.getAttribute('data-demo-theme') });
    });
  });
  document.querySelectorAll('[data-demo-q]').forEach(function (b) {
    b.addEventListener('click', function () {
      var q = b.getAttribute('data-demo-q');
      demo(function (w) {
        var i = w.document.querySelector('.ssk-search input, .sshelf-search input');
        if (i) { i.value = q; i.dispatchEvent(new w.Event('input', { bubbles: true })); }
      });
      track('demo_search', { q: q });
    });
  });
  document.querySelectorAll('[data-demo-url]').forEach(function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-demo-url');
      demo(function (w) { w.location.href = u; });
    });
  });
  /* Sermon Shelf's live hero: a lit book opens that book in the demo below */
  var heroLive = document.querySelector('.hero-live');
  if (heroLive) {
    heroLive.addEventListener('click', function (e) {
      var a = e.target.closest('[data-go]');
      if (!a) return;
      e.preventDefault(); e.stopPropagation();
      var r = a.getAttribute('data-go');
      demo(function (w) { var el = w.document.querySelector('[data-sermon-shelf]'); if (el && el.__sermonShelf) el.__sermonShelf.go(r, true); });
    }, true);
  }

  /* Content rises into place once */
  var io = 'IntersectionObserver' in window && new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rise').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });
})();
