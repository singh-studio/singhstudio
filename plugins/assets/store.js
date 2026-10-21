/* Singh Studio Plugins: storefront behaviour. The licence switch, buy buttons, the buy bar, analytics, the NZ clock, demo controls, reveals. */
(function () {
  'use strict';
  var cfgEl = document.getElementById('store-config');
  var CFG = cfgEl ? JSON.parse(cfgEl.textContent) : { checkout: {}, email: 'kris@singhstudio.co.nz', analytics: {} };
  var root = document.documentElement;
  root.classList.remove('no-js');

  /* Analytics: GA4 loads only when an ID is set in catalog.json. Events use GA4's ecommerce names. */
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
  if (page) track('view_item', { currency: 'USD', value: +document.body.getAttribute('data-price') || undefined, items: [{ item_id: page, item_name: document.body.getAttribute('data-product-name') }] });
  var tiles = document.querySelectorAll('.tile[data-slug]');
  if (tiles.length) {
    track('view_item_list', { item_list_id: 'plugins', items: Array.prototype.map.call(tiles, function (t, i) {
      return { item_id: t.getAttribute('data-slug'), item_name: t.getAttribute('data-name'), price: +t.getAttribute('data-price'), index: i };
    }) });
  }

  /* Licence: one website or unlimited. Both prices are in the page, this shows one, and the choice lasts for the visit. */
  var switches = document.querySelectorAll('[data-set-licence]');
  function setLicence(l, chosen) {
    root.setAttribute('data-licence', l);
    switches.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-set-licence') === l ? 'true' : 'false'); });
    if (!chosen) return;
    try { sessionStorage.setItem('ssp-licence', l); } catch (e) {}
    track('select_licence', { licence: l });
  }
  switches.forEach(function (b) { b.addEventListener('click', function () { setLicence(b.getAttribute('data-set-licence'), true); }); });
  setLicence(root.getAttribute('data-licence') === 'unlimited' ? 'unlimited' : 'single');

  /* Buy buttons carry their checkout link (or an email to Kris) from the build. This adds tracking and Lemon Squeezy's overlay. */
  var usesLemon = false;
  document.querySelectorAll('[data-buy]').forEach(function (a) {
    var parts = a.getAttribute('data-buy').split(':'), slug = parts[0], tier = parts[1] || 'single';
    if (a.getAttribute('href') === '#') {
      var url = CFG.checkout[slug] && CFG.checkout[slug][tier], name = a.getAttribute('data-name') || slug;
      a.href = url || 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(name + ', ' + (tier === 'unlimited' ? 'unlimited' : 'single-site') + ' licence');
      if (url && /lemonsqueezy\.com/.test(url)) a.classList.add('lemonsqueezy-button');
    }
    if (a.classList.contains('lemonsqueezy-button')) usesLemon = true;
    a.addEventListener('click', function () {
      var price = +a.getAttribute('data-price') || undefined;
      track('begin_checkout', { currency: 'USD', value: price, items: [{ item_id: slug, item_name: a.getAttribute('data-name') || slug, item_variant: tier, price: price, quantity: 1 }] });
    });
  });
  if (usesLemon) {
    var ls = document.createElement('script');
    ls.src = 'https://app.lemonsqueezy.com/js/lemon.js'; ls.defer = true;
    ls.onload = function () {
      // Report finished orders to analytics. If Lemon Squeezy's setup call isn't there, the checkout works as before.
      setTimeout(function () {
        try {
          if (!window.LemonSqueezy || !window.LemonSqueezy.Setup) return;
          window.LemonSqueezy.Setup({ eventHandler: function (e) {
            if (!e || e.event !== 'Checkout.Success') return;
            var order = e.data && e.data.order && e.data.order.data, at = (order && order.attributes) || {};
            track('purchase', { transaction_id: order && order.id, currency: at.currency || 'USD', value: at.total ? at.total / 100 : undefined });
          } });
        } catch (err) {}
      }, 0);
    };
    document.head.appendChild(ls);
  }
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () { track(el.getAttribute('data-track'), { label: el.getAttribute('data-track-label') || '' }); });
  });

  /* The buy bar slides up once the buy box has scrolled off the top, and steps aside while
     the pricing section or the footer is on screen, because they have their own buttons. */
  var bar = document.querySelector('.buybar'), box = document.getElementById('buybox');
  if (bar && box && 'IntersectionObserver' in window) {
    var past = false, quiet = [];
    var show = function () {
      var on = past && !quiet.length;
      bar.classList.toggle('show', on);
      bar.inert = !on;
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
    };
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { past = !e.isIntersecting && e.boundingClientRect.top < 0; });
      show();
    }).observe(box);
    var calm = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = quiet.indexOf(e.target);
        if (e.isIntersecting && i < 0) quiet.push(e.target);
        if (!e.isIntersecting && i > -1) quiet.splice(i, 1);
      });
      show();
    });
    document.querySelectorAll('#pricing, .foot').forEach(function (el) { calm.observe(el); });
  }

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
