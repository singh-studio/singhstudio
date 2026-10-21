/* Laurel: turns a project into one self-contained HTML file (fonts, textures, data, runtime).
   Shared by the editor (browser) and the build (Node). Needs LaurelModel, qrcode and the assets bundle. */
(function (root) {
  'use strict';
  var M = root.LaurelModel || (typeof require === 'function' ? require('./model.js') : null);
  var qrcode = root.qrcode || (typeof require === 'function' ? require('./vendor/qrcode.js') : null);

  var FACES = {
    cinzel: ['LR Cinzel', '400 700', 'normal'],
    garamond: ['LR Garamond', '400 600', 'normal'],
    'garamond-italic': ['LR Garamond', '400 500', 'italic'],
    'barlow-condensed-500': ['LR Barlow Condensed', '500', 'normal'],
    'barlow-condensed-600': ['LR Barlow Condensed', '600 700', 'normal'],
    'barlow-400': ['LR Barlow', '400', 'normal'],
    'barlow-500': ['LR Barlow', '500 700', 'normal']
  };
  var THEME_FONTS = {
    timber: ['cinzel', 'garamond', 'garamond-italic'],
    heritage: ['cinzel', 'garamond', 'garamond-italic'],
    modern: ['barlow-condensed-500', 'barlow-condensed-600', 'barlow-400', 'barlow-500']
  };

  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  // JSON that is safe inside <script>: no "</script>", no line separators.
  function scriptJSON(v) {
    return JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  }
  function scriptText(s) { return String(s).replace(/<\/(script)/gi, '<\\/$1'); }

  // QR as a compact SVG path, dark on light, with a two-module quiet zone.
  function qrSvg(text) {
    if (!text || !qrcode) return '';
    var prevBytes = qrcode.stringToBytes;
    if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    var q;
    try { q = qrcode(0, 'M'); q.addData(text, 'Byte'); q.make(); } catch (e) { qrcode.stringToBytes = prevBytes; return ''; }
    qrcode.stringToBytes = prevBytes;
    var n = q.getModuleCount(), pad = 2, d = '';
    for (var y = 0; y < n; y++) {
      var x = 0;
      while (x < n) {
        if (!q.isDark(y, x)) { x++; continue; }
        var run = 1;
        while (x + run < n && q.isDark(y, x + run)) run++;
        d += 'M' + (x + pad) + ' ' + (y + pad) + 'h' + run + 'v1h-' + run + 'z';
        x += run;
      }
    }
    var size = n + pad * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="' + size + '" height="' + size + '" fill="#fff"/><path fill="#111" d="' + d + '"/></svg>';
  }

  function fontCSS(assets, names) {
    return '/* Fonts: Cinzel, EB Garamond, Barlow and Barlow Condensed, each under the SIL Open Font License 1.1 (https://openfontlicense.org) */\n' + names.map(function (n) {
      var f = FACES[n];
      if (!f || !assets.fonts[n]) return '';
      return '@font-face{font-family:"' + f[0] + '";src:url(' + assets.fonts[n] + ') format("woff2");font-weight:' + f[1] + ';font-style:' + f[2] + ';font-display:block}';
    }).join('\n');
  }

  // Everything readable without JavaScript: search engines, old browsers, printing.
  function staticHTML(p) {
    var out = ['<div class="lr-static" id="lr-static">'];
    if (p.org.crest) out.push('<img src="' + p.org.crest + '" alt="' + esc(p.org.name) + ' crest" width="140">');
    out.push('<h1>' + esc(p.org.name) + ' \u00B7 ' + esc(p.words.honours) + '</h1>');
    var tag = [p.org.founded ? p.words.est + ' ' + p.org.founded : '', p.org.tagline].filter(Boolean).join(' \u00B7 ');
    if (tag) out.push('<p>' + esc(tag) + '</p>');
    p.boards.forEach(function (b) {
      var rows = M.sortedRows(b);
      out.push('<h2>' + esc(b.title) + (b.subtitle ? ' \u2014 ' + esc(b.subtitle) : '') + '</h2>');
      if (!rows.length) return;
      out.push('<table><thead><tr>' + b.cols.map(function (c) { return '<th scope="col">' + esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>');
      rows.forEach(function (r) {
        out.push('<tr>' + r.c.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>');
        if (r.text) out.push('<tr><td></td><td colspan="' + (b.cols.length - 1 || 1) + '"><p>' + esc(r.text) + '</p></td></tr>');
      });
      out.push('</tbody></table>');
    });
    out.push('<p><small>Made with Laurel \u00B7 singhstudio.co.nz/laurel</small></p></div>');
    return out.join('\n');
  }

  /* opts: { assets, mode: 'screen'|'browse'|'kiosk', licence: {tier,to}|null, preview: bool } */
  function boardHTML(project, opts) {
    opts = opts || {};
    var A = opts.assets || root.LAUREL_ASSETS;
    var p = M.normaliseProject(project);
    var mode = /^(screen|browse|kiosk)$/.test(opts.mode) ? opts.mode : 'browse';
    // A file only carries the boards its place will show, so names kept off the website stay off it.
    if (!opts.preview) p.boards = p.boards.filter(function (b) { return mode === 'screen' ? b.screen : b.web; });
    var theme = p.look.theme;
    var fonts = opts.preview ? Object.keys(FACES) : THEME_FONTS[theme];
    var tex = [];
    if (opts.preview || theme === 'timber') tex.push('--tex-wood:url(' + A.textures.wood + ')');
    if (opts.preview || theme === 'heritage') tex.push('--tex-paper:url(' + A.textures.paper + ')');
    var cfg = {
      mode: mode,
      version: M.VERSION,
      licence: opts.licence && opts.licence.tier ? { tier: opts.licence.tier, to: M.line(opts.licence.to, 100) } : null,
      qr: p.org.url ? qrSvg(p.org.url) : '',
      kioskIdle: 90
    };
    if (opts.preview) cfg.preview = true;
    var boards = p.boards.map(function (b) { return b.title; }).slice(0, 8).join(', ');
    var desc = 'The honours boards of ' + p.org.name + (boards ? ': ' + boards + '.' : '.');
    var title = p.words.honours + ' \u00B7 ' + p.org.name;
    var noindex = mode !== 'browse' || opts.preview || opts.noindex;
    return [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
      '<title>' + esc(title) + '</title>',
      '<meta name="description" content="' + esc(desc) + '">',
      noindex ? '<meta name="robots" content="noindex">' : '',
      '<meta property="og:title" content="' + esc(title) + '">',
      '<meta property="og:description" content="' + esc(desc) + '">',
      '<meta name="generator" content="Laurel ' + M.VERSION + ' by Singh Studio (singhstudio.co.nz/laurel)">',
      '<meta name="theme-color" content="' + (theme === 'modern' ? p.look.bg : theme === 'heritage' ? '#efe5cf' : '#2a160d') + '">',
      p.org.crest ? '<link rel="icon" href="' + p.org.crest + '">' : '',
      '<style>',
      fontCSS(A, fonts),
      tex.length ? ':root{' + tex.join(';') + '}' : '',
      A.css,
      '</style>',
      '</head>',
      '<body class="lr theme-' + theme + '">',
      staticHTML(p),
      '<div id="laurel"></div>',
      '<script type="application/json" id="laurel-data">' + scriptJSON(p) + '</script>',
      '<script type="application/json" id="laurel-config">' + scriptJSON(cfg) + '</script>',
      '<script>' + scriptText(A.model) + '\n' + scriptText(A.runtime) + '</script>',
      '</body>',
      '</html>',
      ''
    ].filter(function (l) { return l !== ''; }).join('\n');
  }

  // Pull the project back out of a board file someone saved earlier.
  function projectFromHTML(text) {
    var m = String(text).match(/<script type="application\/json" id="laurel-data">([\s\S]*?)<\/script>/);
    if (!m) return null;
    try { return M.normaliseProject(JSON.parse(m[1])); } catch (e) { return null; }
  }

  function fileSlug(p) { return M.slug(p.org.short || p.org.name); }

  var api = { boardHTML: boardHTML, projectFromHTML: projectFromHTML, qrSvg: qrSvg, staticHTML: staticHTML, fileSlug: fileSlug, esc: esc, THEME_FONTS: THEME_FONTS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LaurelExport = api;
})(typeof window !== 'undefined' ? window : this);
