/* Laurel: the shared data model. Runs in the board runtime (old TV browsers, so ES2017 only:
   no optional chaining, no ??, no class fields), in the editor, and in Node for the build. */
(function (root) {
  'use strict';

  var VERSION = '1.0.0';
  var THEMES = ['timber', 'heritage', 'modern'];
  var WOODS = ['rimu', 'oak', 'walnut'];
  var PAPERS = ['ivory', 'stone'];
  var ROLES = ['year', 'name', 'text'];
  var SORTS = ['asc', 'desc', 'none'];
  var MAX_COLS = 4;

  // Words the boards show. Clubs can rename any of them (Honors, Roll of Honour, Kia ora...).
  var WORDS = {
    honours: 'Honours',
    find: 'Find a name',
    findHint: 'Search every board',
    boards: 'Boards',
    people: 'People',
    est: 'Est.',
    page: 'Page',
    of: 'of',
    spotlight: 'Honours',
    scan: 'Find your name',
    back: 'All boards',
    noMatch: 'No names match',
    names: 'names',
    updated: 'Updated',
    touch: 'Touch to explore',
    share: 'Copy link',
    copied: 'Link copied'
  };

  function str(v, max) {
    if (v === null || v === undefined) return '';
    var s = String(v).replace(/\r\n?/g, '\n');
    s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    return max ? s.slice(0, max) : s;
  }
  function line(v, max) { return str(v, max).replace(/\s+/g, ' ').trim(); }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function num(v, min, max, dflt) {
    var n = Number(v);
    if (!isFinite(n)) return dflt;
    return Math.min(max, Math.max(min, Math.round(n)));
  }
  function bool(v, dflt) { return typeof v === 'boolean' ? v : dflt; }
  function colour(v, dflt) { v = line(v, 9); return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : dflt; }
  function image(v) {
    v = str(v);
    return /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[a-z0-9+\/=\s]+$/i.test(v) ? v.replace(/\s+/g, '') : '';
  }
  function webUrl(v) {
    v = line(v, 400);
    if (!v) return '';
    if (!/^https?:\/\//i.test(v) && /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(v)) v = 'https://' + v;
    return /^https?:\/\/[^\s<>"']+$/i.test(v) ? v : '';
  }

  var idCounter = 0;
  function uid(prefix) {
    idCounter = (idCounter + 1) % 1679616;
    return (prefix || 'x') + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 6) + idCounter.toString(36);
  }

  function slug(s) {
    s = fold(line(s)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s.slice(0, 60) || 'item';
  }

  // Strip diacritics (\u0101 -> a) for matching and sorting, keeping the original for display.
  function fold(s) {
    s = String(s || '');
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036F]/g, '');
    return s.replace(/[\u02BB\u02BC\u2018\u2019'`]/g, '');
  }

  // A forgiving key for "is this the same person": case, accents, dots and spacing don't matter,
  // and runs of initials join up, so "A. B. Jones", "A.B. Jones" and "AB JONES" all match.
  function nameKey(s) {
    var parts = fold(String(s || '').replace(/\(.*?\)/g, ' ')).toLowerCase().replace(/[.,]/g, ' ').replace(/[^a-z0-9\s-]/g, '').split(/\s+/).filter(Boolean);
    var out = [], run = '';
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].length === 1) { run += parts[i]; continue; }
      if (run) { out.push(run); run = ''; }
      out.push(parts[i]);
    }
    if (run) out.push(run);
    return out.join(' ');
  }

  // Placeholders clubs write where a name would go. They stay on the board but aren't people.
  var NOT_A_NAME = /^(not (contested|awarded|held|played|presented)|no (competition|award|contest|champion|winner|event)|vacant|none|nil|n\/?a|tba|tbc|tbd|unknown|war years?|cancell?ed|abandoned|postponed|recess|in recess|[-\u2013\u2014.\s]+)$/i;

  // One cell can hold a pair or a team: "J. Smith & K. Brown", "A / B", "A; B", "A and B".
  // Columns marked as a list of names (bowls fours, crews) split on commas too.
  function splitNames(cell, list) {
    var s = line(cell);
    if (!s || NOT_A_NAME.test(s)) return [];
    return s.split(list ? /\s*(?:&|\+|;|,|\n|\band\b|\s\/\s|\/(?=[A-Z\u00C0-\u024F]))\s*/ : /\s*(?:&|\+|;|\n|\band\b|\s\/\s|\/(?=[A-Z\u00C0-\u024F]))\s*/).map(function (p) { return p.trim(); }).filter(function (p) {
      return p && !NOT_A_NAME.test(p) && /[a-z\u00C0-\u024F]/i.test(fold(p));
    });
  }

  var SUFFIX = /^(jnr|jr|snr|sr|ii|iii|iv|qsm|mbe|obe|cbe|onzm|mnzm|cnzm|dcnzm|knzm|jp|qso|am|oam|ao|esq|phd|dr)\.?$/i;
  var PARTICLE = /^(te|van|von|de|da|di|du|la|le|mac|mc|st|st\.|o|ten|ter|der|den|del|della|bin|binti|al|el)$/i;
  function surname(name) {
    var w = line(name).replace(/\(.*?\)/g, ' ').split(/\s+/).filter(Boolean);
    while (w.length > 1 && SUFFIX.test(w[w.length - 1].replace(/,/g, ''))) w.pop();
    if (!w.length) return '';
    var i = w.length - 1;
    while (i > 1 && PARTICLE.test(w[i - 1])) i--;
    return w.slice(i).join(' ').replace(/,$/, '');
  }
  // Filed under the first letter of the whole surname: "Te Rangi" under T, "van der Berg" under V.
  function initial(name) {
    var c = fold(surname(name)).charAt(0).toUpperCase();
    return /[A-Z]/.test(c) ? c : '#';
  }

  function yearOf(cell) {
    var m = String(cell || '').match(/(^|[^0-9])(1[5-9][0-9]{2}|2[0-9]{3})(?![0-9])/);
    return m ? Number(m[2]) : null;
  }

  // ---------- reading pasted lists and CSV ----------

  function parseDelimited(text, delim) {
    var rows = [], row = [], cell = '', q = false, i = 0, c;
    text = str(text);
    while (i < text.length) {
      c = text.charAt(i);
      if (q) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') { cell += '"'; i += 2; continue; }
          q = false; i++; continue;
        }
        cell += c; i++; continue;
      }
      if (c === '"' && cell.replace(/\s/g, '') === '') { q = true; cell = ''; i++; continue; }
      if (c === delim) { row.push(cell); cell = ''; i++; continue; }
      if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue; }
      cell += c; i++;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.map(function (r) { return r.map(function (x) { return x.replace(/\s+/g, ' ').trim(); }); })
      .filter(function (r) { return r.join('') !== ''; });
  }

  function sniffDelimiter(text) {
    var sample = str(text).split('\n').slice(0, 20).join('\n');
    if (sample.indexOf('\t') >= 0) return '\t';
    var commas = (sample.match(/,/g) || []).length, semis = (sample.match(/;/g) || []).length;
    if (semis > commas) return ';';
    return commas ? ',' : null;
  }

  // Lines like "1987  A. B. Jones  71" (typed, or copied from a document) become cells.
  function splitLooseLine(lineText, cols) {
    var s = str(lineText).replace(/\t/g, '  ').replace(/[ \u00A0]+$/, '').replace(/^[ \u00A0]+/, '');
    var yearIdx = -1, i;
    for (i = 0; i < cols.length; i++) if (cols[i].role === 'year') { yearIdx = i; break; }
    var out = [];
    for (i = 0; i < cols.length; i++) out.push('');
    var m = s.match(/^((?:1[5-9]|2[0-9])[0-9]{2}(?:\s*[-\u2013\u2014\/]\s*(?:[0-9]{2}|[0-9]{4}))?)[\s.:,\u2013\u2014-]+(.+)$/);
    if (m && yearIdx >= 0) {
      out[yearIdx] = m[1].replace(/\s+/g, '').replace(/-/g, '\u2013');
      s = m[2];
    } else {
      var tail = s.match(/^(.+?)[\s,]+\(?((?:1[5-9]|2[0-9])[0-9]{2}(?:\s*[-\u2013\/]\s*(?:[0-9]{2}|[0-9]{4}))?)\)?$/);
      if (tail && yearIdx >= 0) { out[yearIdx] = tail[2].replace(/\s+/g, '').replace(/-/g, '\u2013'); s = tail[1]; }
    }
    // Two or more spaces (or a spaced dash) separate the remaining fields.
    var rest = s.split(/\s{2,}|\s[\u2013\u2014-]\s/).map(function (x) { return x.trim(); }).filter(Boolean);
    var free = [];
    for (i = 0; i < cols.length; i++) if (i !== yearIdx || !out[yearIdx]) free.push(i);
    if (rest.length > free.length && free.length) {
      rest = rest.slice(0, free.length - 1).concat([rest.slice(free.length - 1).join(' ')]);
    }
    for (i = 0; i < rest.length && i < free.length; i++) out[free[i]] = line(rest[i]);
    return out;
  }

  function looksLikeHeader(cells, cols) {
    var hits = 0;
    for (var i = 0; i < cells.length; i++) {
      var c = fold(cells[i]).toLowerCase();
      if (!c) continue;
      if (/^(year|years|season|date|name|names|winner|winners|champion|champions|holder|event|record|detail|details|score|board|title|subtitle|team|notes?)$/.test(c)) hits++;
      for (var j = 0; j < cols.length; j++) if (fold(cols[j].label).toLowerCase() === c) { hits++; break; }
    }
    return hits >= 1 && !cells.some(function (x) { return yearOf(x) && /^\d{4}/.test(x); });
  }

  // Turn whatever someone pasted into rows for a board with these columns.
  function rowsFromText(text, cols) {
    text = str(text).replace(/\u00A0/g, ' ');
    var delim = sniffDelimiter(text);
    var table;
    if (delim) {
      table = parseDelimited(text, delim);
      // A comma list with one field per line is really a loose list ("1926, A. Jones" -> year + name).
      var widths = table.map(function (r) { return r.length; });
      if (delim !== '\t' && Math.max.apply(null, widths.concat([0])) > cols.length + 1) table = null;
    }
    var header = false;
    if (!table) {
      table = str(text).split('\n').filter(function (l) { return line(l); }).map(function (l) { return splitLooseLine(l, cols); });
    } else {
      if (table.length && looksLikeHeader(table[0], cols)) { header = true; table.shift(); }
      // Single-column paste: run each cell through the loose splitter.
      if (table.length && table.every(function (r) { return r.length === 1; }) && cols.length > 1) {
        table = table.map(function (r) { return splitLooseLine(r[0], cols); });
      } else {
        table = table.map(function (r) {
          var out = [];
          for (var i = 0; i < cols.length; i++) out.push(r[i] || '');
          if (r.length > cols.length) out[cols.length - 1] = r.slice(cols.length - 1).join(' ').trim();
          return out;
        });
      }
    }
    var rows = table.filter(function (r) { return r.join('').trim() !== ''; }).map(function (r) { return { c: r.map(function (x) { return line(x, 200); }) }; });
    return { rows: rows, header: header };
  }

  function csvCell(v) {
    v = str(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  // One file for every board: board, subtitle, then the board's own column labels.
  function toCSV(project) {
    var out = [['Board', 'Subtitle', 'Year', 'Name', 'Detail', 'More'].join(',')];
    project.boards.forEach(function (b) {
      b.rows.forEach(function (r) {
        var year = '', name = '', texts = [];
        b.cols.forEach(function (c, i) {
          var v = r.c[i] || '';
          if (c.role === 'year' && !year) year = v;
          else if (c.role === 'name' && !name) name = v;
          else texts.push(v);
        });
        out.push([b.title, b.subtitle, year, name, texts[0] || '', texts.slice(1).join(' / ')].map(csvCell).join(','));
      });
    });
    return out.join('\r\n') + '\r\n';
  }

  // Read the CSV above (or anything shaped like it) back into boards.
  function boardsFromCSV(text) {
    var delim = sniffDelimiter(text) || ',';
    var t = parseDelimited(text, delim);
    if (!t.length) return [];
    var head = t[0].map(function (h) { return fold(h).toLowerCase(); });
    var at = function (names) { for (var i = 0; i < head.length; i++) if (names.indexOf(head[i]) >= 0) return i; return -1; };
    var iBoard = at(['board', 'honour', 'honor', 'award', 'title']), iSub = at(['subtitle', 'division', 'grade', 'section']);
    var iYear = at(['year', 'season', 'date', 'years']), iName = at(['name', 'names', 'winner', 'holder', 'champion', 'person']);
    var iDet = at(['detail', 'details', 'score', 'result', 'record', 'notes', 'note']), iMore = at(['more', 'extra']);
    if (iBoard < 0 || iName < 0) return [];
    var map = {}, order = [];
    t.slice(1).forEach(function (r) {
      var title = line(r[iBoard]); if (!title) return;
      var sub = iSub >= 0 ? line(r[iSub]) : '';
      var k = title + '\u0000' + sub;
      if (!map[k]) { map[k] = { title: title, subtitle: sub, rows: [], hasDet: false, hasMore: false }; order.push(k); }
      var det = iDet >= 0 ? line(r[iDet]) : '', more = iMore >= 0 ? line(r[iMore]) : '';
      if (det) map[k].hasDet = true;
      if (more) map[k].hasMore = true;
      map[k].rows.push([iYear >= 0 ? line(r[iYear]) : '', line(r[iName]), det, more]);
    });
    return order.map(function (k) {
      var g = map[k];
      var cols = [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }];
      if (g.hasDet || g.hasMore) cols.push({ label: 'Detail', role: 'text' });
      if (g.hasMore) cols.push({ label: 'More', role: 'text' });
      return normaliseBoard({ title: g.title, subtitle: g.subtitle, cols: cols, rows: g.rows.map(function (r) { return { c: r.slice(0, cols.length) }; }) });
    });
  }

  // ---------- normalising (everything that comes in from a file goes through here) ----------

  function normaliseCols(cols) {
    if (!cols || !cols.length) cols = [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }];
    cols = cols.slice(0, MAX_COLS).map(function (c) {
      c = c || {};
      var col = { label: line(c.label, 40) || 'Column', role: pick(c.role, ROLES, 'text') };
      if (col.role === 'name' && c.multi === true) col.multi = true;
      return col;
    });
    return cols;
  }

  function normaliseBoard(b) {
    b = b || {};
    var cols = normaliseCols(b.cols);
    var rows = (b.rows || []).slice(0, 5000).map(function (r) {
      r = r || {};
      var cells = Array.isArray(r) ? r : (r.c || []);
      var c = [];
      for (var i = 0; i < cols.length; i++) c.push(line(cells[i], 200));
      var row = { c: c };
      var photo = image(r.photo); if (photo) row.photo = photo;
      var text = str(r.text, 1200).trim(); if (text) row.text = text;
      return row;
    });
    return {
      id: line(b.id, 40) || uid('b'),
      title: line(b.title, 80) || 'Untitled board',
      subtitle: line(b.subtitle, 80),
      group: line(b.group, 40),
      kind: line(b.kind, 20) || 'custom',
      cols: cols,
      rows: rows,
      sort: pick(b.sort, SORTS, 'asc'),
      screen: bool(b.screen, true),
      web: bool(b.web, true)
    };
  }

  function normaliseProject(p) {
    p = p || {};
    var org = p.org || {}, look = p.look || {}, screen = p.screen || {}, words = p.words || {};
    var w = {};
    Object.keys(WORDS).forEach(function (k) { w[k] = line(words[k], 60) || WORDS[k]; });
    var out = {
      laurel: 1,
      id: line(p.id, 40) || uid('p'),
      org: {
        name: line(org.name, 100) || 'Our club',
        short: line(org.short, 40),
        tagline: line(org.tagline, 120),
        founded: line(org.founded, 20),
        crest: image(org.crest),
        url: webUrl(org.url)
      },
      look: {
        theme: pick(look.theme, THEMES, 'timber'),
        wood: pick(look.wood, WOODS, 'rimu'),
        paper: pick(look.paper, PAPERS, 'ivory'),
        bg: colour(look.bg, '#12261c'),
        accent: colour(look.accent, '#d9a93b'),
        caps: bool(look.caps, true)
      },
      screen: {
        seconds: num(screen.seconds, 5, 60, 12),
        cover: bool(screen.cover, true),
        spotlight: bool(screen.spotlight, true),
        features: bool(screen.features, true),
        qr: bool(screen.qr, true),
        clock: bool(screen.clock, false),
        credit: bool(screen.credit, true)
      },
      web: { credit: bool((p.web || {}).credit, true) },
      words: w,
      boards: (p.boards || []).slice(0, 200).map(normaliseBoard),
      updated: line(p.updated, 40) || new Date().toISOString()
    };
    return out;
  }

  // ---------- reading the boards ----------

  function colIndex(board, role) {
    for (var i = 0; i < board.cols.length; i++) if (board.cols[i].role === role) return i;
    return -1;
  }

  function sortedRows(board) {
    var rows = board.rows.filter(function (r) { return r.c.join('') !== ''; });
    var yi = colIndex(board, 'year');
    if (board.sort === 'none' || yi < 0) return rows;
    var dir = board.sort === 'desc' ? -1 : 1;
    return rows.map(function (r, i) { return { r: r, i: i, y: yearOf(r.c[yi]) }; }).sort(function (a, b) {
      if (a.y === null && b.y === null) return a.i - b.i;
      if (a.y === null) return 1;
      if (b.y === null) return -1;
      return (a.y - b.y) * dir || a.i - b.i;
    }).map(function (x) { return x.r; });
  }

  function yearRange(board) {
    var yi = colIndex(board, 'year');
    if (yi < 0) return '';
    var lo = null, hi = null;
    board.rows.forEach(function (r) {
      var y = yearOf(r.c[yi]);
      if (y === null) return;
      if (lo === null || y < lo) lo = y;
      if (hi === null || y > hi) hi = y;
    });
    if (lo === null) return '';
    return lo === hi ? String(lo) : lo + '\u2013' + hi;
  }

  function latestYear(project) {
    var hi = null;
    project.boards.forEach(function (b) {
      var yi = colIndex(b, 'year');
      if (yi < 0) return;
      b.rows.forEach(function (r) { var y = yearOf(r.c[yi]); if (y !== null && (hi === null || y > hi)) hi = y; });
    });
    return hi;
  }

  // Everyone on every board, merged by nameKey. Returns [{key, name, slug, honours:[...]}].
  function people(project) {
    var map = {}, list = [];
    project.boards.forEach(function (b) {
      var yi = colIndex(b, 'year');
      b.cols.forEach(function (col, ni) {
        if (col.role !== 'name') return;
        b.rows.forEach(function (r) {
          splitNames(r.c[ni], col.multi).forEach(function (n) {
            var k = nameKey(n);
            if (!k) return;
            if (!map[k]) { map[k] = { key: k, name: n.replace(/\s*\(.*?\)\s*/g, ' ').trim() || n, honours: [] }; list.push(map[k]); }
            map[k].honours.push({ board: b, row: r, col: col, year: yi >= 0 ? r.c[yi] : '', y: yi >= 0 ? yearOf(r.c[yi]) : null });
          });
        });
      });
    });
    var used = {};
    list.forEach(function (p) {
      var s = slug(p.name), n = 2;
      while (used[s]) s = slug(p.name) + '-' + n++;
      used[s] = true;
      p.slug = s;
      p.sort = fold(surname(p.name) + ' ' + p.name).toLowerCase();
      p.initial = initial(p.name);
      p.honours.sort(function (a, b) { return (a.y || 9999) - (b.y || 9999); });
    });
    list.sort(function (a, b) { return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0; });
    return list;
  }

  function boardSlugs(project) {
    var used = {};
    project.boards.forEach(function (b) {
      var base = slug(b.title + (b.subtitle ? ' ' + b.subtitle : '')), s = base, n = 2;
      while (used[s]) s = base + '-' + n++;
      used[s] = true;
      b.slug = s;
    });
  }

  function countNames(project) {
    var n = 0;
    project.boards.forEach(function (b) { n += b.rows.filter(function (r) { return r.c.join('') !== ''; }).length; });
    return n;
  }

  var api = {
    VERSION: VERSION, THEMES: THEMES, WOODS: WOODS, PAPERS: PAPERS, ROLES: ROLES, WORDS: WORDS, MAX_COLS: MAX_COLS,
    str: str, line: line, uid: uid, slug: slug, fold: fold, nameKey: nameKey, splitNames: splitNames, surname: surname,
    initial: initial, yearOf: yearOf, image: image, webUrl: webUrl, colour: colour,
    parseDelimited: parseDelimited, sniffDelimiter: sniffDelimiter, splitLooseLine: splitLooseLine, rowsFromText: rowsFromText,
    toCSV: toCSV, boardsFromCSV: boardsFromCSV,
    normaliseCols: normaliseCols, normaliseBoard: normaliseBoard, normaliseProject: normaliseProject,
    colIndex: colIndex, sortedRows: sortedRows, yearRange: yearRange, latestYear: latestYear, people: people,
    boardSlugs: boardSlugs, countNames: countNames, isPlaceholder: function (v) { return NOT_A_NAME.test(line(v)); }
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LaurelModel = api;
})(typeof window !== 'undefined' ? window : this);
