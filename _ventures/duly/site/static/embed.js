/* Duly embeddable calculator.
   <div data-duly="oia"></div>
   <script src="https://duly.nz/embed.js" async></script>
   data-duly takes any regime id (see https://duly.nz/developers/#api). */
(function () {
  var script = document.currentScript;
  var origin = script ? new URL(script.src).origin : 'https://duly.nz';
  var frames = [];
  function mount(el) {
    if (el.getAttribute('data-duly-mounted')) return;
    el.setAttribute('data-duly-mounted', '1');
    var f = document.createElement('iframe');
    var q = '?r=' + encodeURIComponent(el.getAttribute('data-duly') || 'oia');
    if (el.getAttribute('data-province')) q += '&p=' + encodeURIComponent(el.getAttribute('data-province'));
    f.src = origin + '/embed/' + q;
    f.title = 'Working-day deadline calculator by Duly';
    f.loading = 'lazy';
    f.style.cssText = 'width:100%;max-width:640px;border:0;min-height:560px;display:block;color-scheme:normal';
    el.appendChild(f);
    frames.push(f);
  }
  function scan() { Array.prototype.forEach.call(document.querySelectorAll('[data-duly]'), mount); }
  window.addEventListener('message', function (e) {
    if (e.origin !== origin || !e.data || e.data.duly !== 'height') return;
    frames.forEach(function (f) { if (f.contentWindow === e.source) f.style.height = Math.ceil(e.data.h) + 'px'; });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
