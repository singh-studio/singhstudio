/* Laurel pages: buy buttons, the live TV demo, reveals. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var cfgEl = document.getElementById('laurel-config');
  var CFG = cfgEl ? JSON.parse(cfgEl.textContent) : { checkout: {}, email: 'kris@singhstudio.co.nz' };

  function track(name, props) {
    try {
      if (window.gtag) window.gtag('event', name, props || {});
      else if (window.plausible) window.plausible(name, { props: props || {} });
    } catch (e) { /* analytics are optional */ }
  }

  // Buy buttons: the Lemon Squeezy checkout when it's set, otherwise an email to Kris.
  var usesLemon = false;
  document.querySelectorAll('[data-buy]').forEach(function (a) {
    var tier = a.getAttribute('data-buy');
    var url = CFG.checkout && CFG.checkout[tier];
    var name = a.getAttribute('data-name') || ('Laurel ' + tier + ' licence');
    if (url) {
      a.href = url;
      if (/lemonsqueezy\.com/.test(url)) { a.classList.add('lemonsqueezy-button'); usesLemon = true; }
    } else {
      a.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(name) +
        '&body=' + encodeURIComponent('Hi Kris,\n\nI’d like to buy ' + name + '.\n\nOur club or school: \nCountry: \n\nThanks!');
    }
    a.addEventListener('click', function () { track('begin_checkout', { item_id: 'laurel', item_variant: tier, currency: 'USD', value: +a.getAttribute('data-price') || undefined }); });
  });
  if (usesLemon) {
    var ls = document.createElement('script');
    ls.src = 'https://app.lemonsqueezy.com/js/lemon.js'; ls.defer = true;
    document.head.appendChild(ls);
  }
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () { track(el.getAttribute('data-track'), { label: el.getAttribute('data-track-label') || '' }); });
  });

  // The TV demo: a real board file, scaled to fit the frame.
  document.querySelectorAll('.tv-screen').forEach(function (screen) {
    var frame = screen.querySelector('iframe');
    if (!frame) return;
    var fit = function () { screen.style.setProperty('--k', String(screen.clientWidth / 1920)); };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(screen); else window.addEventListener('resize', fit);
    var group = screen.closest('.tvwrap');
    if (!group) return;
    group.querySelectorAll('[data-demo]').forEach(function (b) {
      b.addEventListener('click', function () {
        group.querySelectorAll('[data-demo]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        frame.src = b.getAttribute('data-demo');
        var open = group.querySelector('[data-demo-open]');
        if (open) open.href = b.getAttribute('data-demo').replace('?embed=1', '');
        track('demo_theme', { theme: b.textContent });
      });
    });
  });

  // Gentle reveals
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.rise').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.rise').forEach(function (el) { el.classList.add('in'); });
  }
})();
