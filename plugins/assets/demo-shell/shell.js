// Demo chrome for every product demo: embed mode, section-colour switcher, toasts for links that go nowhere.
(function () {
  var root = document.documentElement, params = new URLSearchParams(location.search);
  if (params.has('embed')) root.classList.add('is-embed'); else root.classList.add('has-ribbon');
  var toastEl = document.createElement('div');
  toastEl.className = 'demo-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(toastEl); });
  var tt;
  window.demoToast = function (msg) {
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  };
  // Links into pages that only exist on a real site
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-demo-link], a[href="#"], a[href^="/team/"], a[href^="/resources/"], a[href^="/events/"], a[href^="/give"], a[href^="/sermons/"]');
    if (!a || a.hasAttribute('download')) return;
    e.preventDefault();
    window.demoToast(a.getAttribute('href') === '#' ? 'This is a made-up church site, so the rest of it is scenery.' : 'On your site, this opens that page.');
  });
  // Section colours: every plugin re-reads the theme through its own retheme()
  window.setDemoTheme = function (name) {
    document.querySelectorAll('[data-section-theme]').forEach(function (s) { s.setAttribute('data-section-theme', name); });
    var sec = document.querySelector('.page-section');
    if (sec) document.body.style.background = getComputedStyle(sec).backgroundColor;
    document.querySelectorAll('[data-ssk]').forEach(function (el) { if (el.__ssk && el.__ssk.retheme) el.__ssk.retheme(); });
    document.querySelectorAll('[data-theme]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-theme') === name ? 'true' : 'false'); });
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-theme]');
    if (b) window.setDemoTheme(b.getAttribute('data-theme'));
  });
  document.addEventListener('DOMContentLoaded', function () { if (params.get('theme')) window.setDemoTheme(params.get('theme')); });
})();
